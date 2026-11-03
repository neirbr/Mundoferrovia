(function () {
  'use strict';

  function iniciarComunidade() {
    if (window.MF_COMMUNITY_STARTED) return;
    window.MF_COMMUNITY_STARTED = true;
    console.log('COMUNIDADE.JS INICIADO');
    alert('COMUNIDADE.JS ESTÁ INICIANDO!');

    const $ = id => document.getElementById(id);
    const auth = window.MF_AUTH;
    const db = window.MF_DB;
    const cloud = window.MF_CLOUDINARY;

    let currentUser = null;
    let profileImageUrl = null;

    function esc(value) {
      return String(value ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c]));
    }

    function msg(id, text) {
      const el = $(id);
      if (el) el.textContent = text;
    }

    function nome(user) {
      return user?.displayName ||
        (user?.email ? user.email.split('@')[0] : 'Ferroviário');
    }

    function dataTexto(value) {
      try {
        return value?.toDate
          ? value.toDate().toLocaleString('pt-BR')
          : 'Publicação recente';
      } catch (_) {
        return 'Publicação recente';
      }
    }

    function firebaseOK() {
      if (!auth || !db || !window.firebase || !window.firebase.firestore) {
        msg('communityAuthMsg',
          'Firebase não inicializado. Confira a configuração.');
        return false;
      }
      return true;
    }

    // =====================================
    // LOGIN
    // =====================================

    $('communityLogin')?.addEventListener('click', async () => {
      if (!firebaseOK()) return;

      const email = $('communityEmail')?.value.trim();
      const password = $('communityPassword')?.value;

      if (!email || !password) {
        msg('communityAuthMsg', 'Informe seu e-mail e sua senha.');
        return;
      }

      const button = $('communityLogin');
      button.disabled = true;

      msg('communityAuthMsg', 'Entrando...');

      try {
        await auth.signInWithEmailAndPassword(email, password);

        msg('communityAuthMsg', 'Login realizado com sucesso!');
      } catch (error) {
        console.error('Erro no login:', error);

        msg('communityAuthMsg',
          'Não foi possível entrar: ' + error.message);
      } finally {
        button.disabled = false;
      }
    });

    // =====================================
    // CADASTRO
    // =====================================

    $('communitySignup')?.addEventListener('click', async () => {
      if (!firebaseOK()) return;

      const email = $('communityEmail')?.value.trim();
      const password = $('communityPassword')?.value || '';

      if (!email || password.length < 8) {
        msg('communityAuthMsg',
          'Informe um e-mail válido e uma senha com pelo menos 8 caracteres.');
        return;
      }

      const button = $('communitySignup');
      button.disabled = true;

      try {
        await auth.createUserWithEmailAndPassword(email, password);

        msg('communityAuthMsg', 'Conta criada com sucesso!');
      } catch (error) {
        console.error('Erro no cadastro:', error);

        msg('communityAuthMsg',
          'Erro no cadastro: ' + error.message);
      } finally {
        button.disabled = false;
      }
    });

    // =====================================
    // SAIR
    // =====================================

    $('communityLogout')?.addEventListener('click', async () => {
      if (!auth) return;

      try {
        await auth.signOut();

        msg('communityAuthMsg', 'Você saiu da comunidade.');
      } catch (error) {
        msg('communityAuthMsg', error.message);
      }
    });

    // =====================================
    // PUBLICAÇÃO DE TEXTO E FOTO
    // =====================================

    const postForm = $('communityPostForm');

    if (postForm) {
      postForm.noValidate = true;

      postForm.addEventListener('submit', async event => {
        event.preventDefault();

        if (!firebaseOK()) return;

        if (!currentUser) {
          msg('communityPostMsg',
            'Entre na sua conta antes de publicar.');
          return;
        }

        const text = $('communityText')?.value.trim() || '';
        const file = $('communityPhoto')?.files?.[0];
        const rights = $('communityRights')?.checked;
        const button = $('communityPublish');

        if (!text || text.length > 1000) {
          msg('communityPostMsg',
            'Escreva uma publicação de até 1000 caracteres.');
          return;
        }

        if (file) {
          if (!rights) {
            msg('communityPostMsg',
              'Confirme que tem autorização para publicar a fotografia.');
            return;
          }

          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            msg('communityPostMsg',
              'Use uma imagem JPG, PNG ou WebP.');
            return;
          }

          if (file.size > 10 * 1024 * 1024) {
            msg('communityPostMsg',
              'A imagem deve ter no máximo 10 MB.');
            return;
          }

          if (!cloud?.cloudName || !cloud?.uploadPreset) {
            msg('communityPostMsg',
              'Configuração do Cloudinary não encontrada.');
            return;
          }
        }

        if (button) button.disabled = true;

        msg('communityPostMsg', 'Publicando... aguarde.');

        try {
          let imageUrl = null;

          if (file) {
            const form = new FormData();

            form.append('file', file);
            form.append('upload_preset', cloud.uploadPreset);

            const response = await fetch(
              `https://api.cloudinary.com/v1_1/${cloud.cloudName}/image/upload`,
              {
                method: 'POST',
                body: form
              }
            );

            const uploaded = await response.json();

            if (!response.ok || !uploaded.secure_url) {
              throw new Error(
                uploaded.error?.message ||
                'Falha ao enviar fotografia.'
              );
            }

            imageUrl = uploaded.secure_url;
          }

          const post = {
            user_id: currentUser.uid,
            author_name: nome(currentUser),
            text: text,
            status: 'approved',
            created_at:
              firebase.firestore.FieldValue.serverTimestamp()
          };

          if (imageUrl) {
            post.image_url = imageUrl;
          }

          await db.collection('community_posts').add(post);

          postForm.reset();

          msg('communityPostMsg',
            'Publicação realizada com sucesso!');

          await carregarPublicacoes();

        } catch (error) {
          console.error('Erro ao publicar:', error);

          msg('communityPostMsg',
            'Erro ao publicar: ' + error.message);
        } finally {
          if (button) button.disabled = false;
        }
      });
    }

    // =====================================
    // FEED
    // =====================================

    async function carregarPublicacoes() {
      const feed = $('communityFeed');

      if (!feed || !db) return;

      feed.innerHTML =
        '<div class="empty">Carregando publicações...</div>';

      try {
        const snapshot = await db.collection('community_posts')
          .where('status', '==', 'approved')
          .get();

        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        posts.sort((a, b) =>
          (b.created_at?.toDate?.()?.getTime() || 0) -
          (a.created_at?.toDate?.()?.getTime() || 0)
        );

        if (!posts.length) {
          feed.innerHTML =
            '<div class="empty">Ainda não há publicações. Seja o primeiro a compartilhar!</div>';
          return;
        }

        const cards = await Promise.all(
          posts.map(renderizarPublicacao)
        );

        feed.innerHTML = cards.join('');

      } catch (error) {
        console.error('Erro ao carregar publicações:', error);

        feed.innerHTML =
          '<div class="empty">Não foi possível carregar a comunidade. Confira as regras do Firestore.</div>';
      }
    }

    // =====================================
    // MONTAR PUBLICAÇÃO
    // =====================================

    async function renderizarPublicacao(post) {
      let likes = [];
      let comments = [];

      const ref = db.collection('community_posts').doc(post.id);

      try {
        const results = await Promise.all([
          ref.collection('likes').get(),
          ref.collection('comments').get()
        ]);

        likes = results[0].docs;

        comments = results[1].docs.map(doc => doc.data());

      } catch (error) {
        console.warn('Erro ao carregar interações:', error);
      }

      const liked = !!currentUser &&
        likes.some(doc => doc.id === currentUser.uid);

      comments.sort((a, b) =>
        (a.created_at?.toDate?.()?.getTime() || 0) -
        (b.created_at?.toDate?.()?.getTime() || 0)
      );

      const commentsHTML = comments.map(comment => `
        <div class="community-comment">
          <strong>${esc(comment.author_name || 'Ferroviário')}</strong>
          <p>${esc(comment.text)}</p>
        </div>
      `).join('');

      const imageHTML = post.image_url
        ? `<img src="${esc(post.image_url)}"
             alt="Fotografia da publicação"
             loading="lazy"
             style="width:100%;max-height:300px;object-fit:cover;border-radius:10px;margin-top:12px">`
        : '';

      const deleteHTML = currentUser?.uid === post.user_id
    ? `<button type="button"
         data-delete="${esc(post.id)}"
         class="btn-delete-post">
🗑️ Excluir publicação</button>
    : '';

      return `
        <article class="card community-post">

          <strong>${esc(post.author_name || 'Ferroviário')}</strong>

          <small class="muted">
            ${esc(dataTexto(post.created_at))}
          </small>

          <p style="white-space:pre-wrap;margin-top:12px">
            ${esc(post.text)}
          </p>

          ${imageHTML}

          <div class="community-actions"
               style="display:flex;gap:12px;flex-wrap:wrap;margin:16px 0">

            <button type="button" data-like="${esc(post.id)}">
              ${liked ? '❤️ Curtido' : '🤍 Curtir'} (${likes.length})
            </button>

            <span>💬 ${comments.length} comentário(s)</span>

            ${deleteHTML}

          </div>

          <div class="community-comments">
            ${commentsHTML ||
              '<p class="muted">Seja o primeiro a comentar.</p>'}
          </div>

          <form data-comment="${esc(post.id)}"
                style="margin-top:12px">

            <input name="comment" maxlength="500"
              placeholder="Escreva um comentário..." required>

            <button type="submit" class="btn secondary">
              Comentar
            </button>

          </form>
        </article>
      `;
    }

    // =====================================
    // CURTIDAS
    // =====================================

    $('communityFeed')?.addEventListener('click', async event => {
      const button = event.target.closest('[data-like]');

      if (!button) return;

      if (!currentUser) {
        alert('Entre na sua conta para curtir.');
        return;
      }

      const ref = db.collection('community_posts')
        .doc(button.dataset.like)
        .collection('likes')
        .doc(currentUser.uid);

      button.disabled = true;

      try {
        const existing = await ref.get();

        if (existing.exists) {
          await ref.delete();
        } else {
          await ref.set({
            user_id: currentUser.uid,
            created_at:
              firebase.firestore.FieldValue.serverTimestamp()
          });
        }

        await carregarPublicacoes();

      } catch (error) {
        console.error('Erro na curtida:', error);

        alert('Não foi possível registrar a curtida: ' + error.message);
      }
    });

    // =====================================
    // EXCLUIR PUBLICAÇÃO
    // =====================================

    $('communityFeed')?.addEventListener('click', async event => {
      const button = event.target.closest('[data-delete]');

      if (!button || !currentUser) return;

      if (!confirm('Deseja realmente excluir esta publicação?')) return;

      try {
        await db.collection('community_posts')
          .doc(button.dataset.delete)
          .delete();

        await carregarPublicacoes();

      } catch (error) {
        console.error('Erro ao excluir:', error);

        alert('Não foi possível excluir: ' + error.message);
      }
    });

    // =====================================
    // COMENTÁRIOS
    // =====================================

    $('communityFeed')?.addEventListener('submit', async event => {
      const form = event.target.closest('[data-comment]');

      if (!form) return;

      event.preventDefault();

      if (!currentUser) {
        alert('Entre na sua conta para comentar.');
        return;
      }

      const input = form.querySelector('[name="comment"]');
      const text = input.value.trim();

      if (!text || text.length > 500) return;

      try {
        await db.collection('community_posts')
          .doc(form.dataset.comment)
          .collection('comments')
          .add({
            user_id: currentUser.uid,
            author_name: nome(currentUser),
            text: text,
            created_at:
              firebase.firestore.FieldValue.serverTimestamp()
          });

        await carregarPublicacoes();

      } catch (error) {
        console.error('Erro no comentário:', error);

        alert('Não foi possível comentar: ' + error.message);
      }
    });

    // =====================================
    // PERFIL: PRÉ-VISUALIZAÇÃO DA FOTO
    // =====================================

    $('profilePhoto')?.addEventListener('change', event => {
      const file = event.target.files[0];
      const preview = $('profilePreview');

      if (!file || !preview) return;

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        msg('profileMessage', 'Use uma imagem JPG, PNG ou WebP.');

        event.target.value = '';
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        msg('profileMessage', 'A foto deve ter no máximo 10 MB.');

        event.target.value = '';
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        preview.innerHTML = '';

        const img = document.createElement('img');

        img.src = reader.result;
        img.alt = 'Pré-visualização da foto de perfil';

        img.style.cssText =
          'width:100%;height:100%;object-fit:cover;border-radius:50%';

        preview.appendChild(img);
      };

      reader.readAsDataURL(file);
    });

    // =====================================
    // CARREGAR PERFIL
    // =====================================

    async function carregarPerfil(user) {
      const preview = $('profilePreview');

      if (!user) {
        profileImageUrl = null;

        $('profileForm')?.reset();

        if (preview) {
          preview.textContent = '🚂';
        }

        msg('profileMessage',
          'Entre na comunidade para acessar seu perfil.');

        return;
      }

      try {
        const doc = await db.collection('user_profiles')
          .doc(user.uid)
          .get();

        const dados = doc.exists ? doc.data() : {};

        if ($('profileName')) {
          $('profileName').value =
            dados.name || user.displayName || nome(user);
        }

        if ($('profileBio')) {
          $('profileBio').value = dados.bio || '';
        }

        if ($('profileCity')) {
          $('profileCity').value = dados.city || '';
        }

        if ($('profileState')) {
          $('profileState').value = dados.state || '';
        }

        profileImageUrl = dados.photo_url || null;

        if (preview) {
          if (profileImageUrl) {
            preview.innerHTML = '';

            const img = document.createElement('img');

            img.src = profileImageUrl;
            img.alt = 'Foto de perfil';

            img.style.cssText =
              'width:100%;height:100%;object-fit:cover;border-radius:50%';

            preview.appendChild(img);

          } else {
            preview.textContent = '🚂';
          }
        }

        msg('profileMessage', 'Perfil carregado com sucesso.');

      } catch (error) {
        console.error('Erro ao carregar perfil:', error);

        msg('profileMessage',
          'Erro ao carregar perfil. Verifique as regras do Firestore.');
      }
    }

    // SALVAR PERFIL
// =====================================

$('profileForm')?.addEventListener('submit', async event => {

      console.log('EVENTO DO PERFIL DISPARADO');

      event.preventDefault();

      alert('O formulário foi acionado!');

      if (!firebaseOK()) return;

      if (!currentUser) {
        msg('profileMessage',
          'Entre na sua conta para salvar seu perfil.');
        return;
      }
      const name = $('profileName')?.value.trim() || '';
      const bio = $('profileBio')?.value.trim() || '';
      const city = $('profileCity')?.value.trim() || '';
      const state = ($('profileState')?.value.trim() || '').toUpperCase();
      const file = $('profilePhoto')?.files?.[0];
      const button = $('profileSave');

      if (!name || name.length > 60) {
        msg('profileMessage', 'Informe um nome válido.');
        return;
      }

      if (bio.length > 300 || city.length > 60 || state.length > 2) {
        msg('profileMessage', 'Confira os limites dos campos.');
        return;
      }

      if (button) button.disabled = true;

      msg('profileMessage', 'Salvando perfil...');

      try {
        if (file) {
          if (!cloud?.cloudName || !cloud?.uploadPreset) {
            throw new Error(
              'Configuração do Cloudinary não encontrada.'
            );
          }

          const form = new FormData();

          form.append('file', file);
          form.append('upload_preset', cloud.uploadPreset);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloud.cloudName}/image/upload`,
            {
              method: 'POST',
              body: form
            }
          );

          const uploaded = await response.json();

          if (!response.ok || !uploaded.secure_url) {
            throw new Error(
              uploaded.error?.message || 'Erro ao enviar foto.'
            );
          }

          profileImageUrl = uploaded.secure_url;
        }

        await db.collection('user_profiles')
          .doc(currentUser.uid)
          .set({
            user_id: currentUser.uid,
            name: name,
            bio: bio,
            city: city,
            state: state,
            photo_url: profileImageUrl || '',
            updated_at:
              firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

        try {
          await currentUser.updateProfile({
            displayName: name
          });
        } catch (profileError) {
          console.warn(
            'Não foi possível atualizar nome da conta:',
            profileError
          );
        }

        msg('profileMessage', 'Perfil salvo com sucesso! 🚂');

        await carregarMembros();

      } catch (error) {
        console.error('Erro ao salvar perfil:', error);

        msg('profileMessage',
          'Erro ao salvar perfil: ' + error.message);

      } finally {
        if (button) button.disabled = false;
      }
    });


    // =====================================
    // MEMBROS DA COMUNIDADE + PERFIL PÚBLICO
    // =====================================

    async function carregarMembros() {
      const container = $('communityMembers');

      if (!container || !db) return;

      container.textContent = 'Carregando membros...';

      try {
        const snapshot = await db.collection('user_profiles').get();

        container.innerHTML = '';

        if (snapshot.empty) {
          container.textContent =
            'Ainda não há membros cadastrados.';
          return;
        }

        const members = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));

        members.sort((a, b) =>
          String(a.name || '').localeCompare(
            String(b.name || ''),
            'pt-BR'
          )
        );

        members.forEach(member => {
          const card = document.createElement('article');

          card.className = 'card community-member';
          card.style.cursor = 'pointer';
          card.setAttribute('tabindex', '0');
          card.setAttribute('role', 'button');
          card.setAttribute(
            'aria-label',
            'Ver perfil de ' + (member.name || 'Ferroviário')
          );

          const avatar = member.photo_url
            ? `<img src="${esc(member.photo_url)}"
                 alt="Foto de ${esc(member.name || 'Ferroviário')}"
                 style="width:64px;height:64px;object-fit:cover;border-radius:50%">`
            : '<div style="width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:#e8eef2;font-size:28px">🚂</div>';

          card.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px">
              ${avatar}

              <div>
                <strong>${esc(member.name || 'Ferroviário')}</strong>

                <p class="muted" style="margin:4px 0">
                  ${esc(
                    [member.city, member.state]
                      .filter(Boolean)
                      .join(' - ') ||
                    'Membro da comunidade'
                  )}
                </p>
              </div>
            </div>

            ${member.bio ? `<p>${esc(member.bio)}</p>` : ''}

            <p class="muted" style="margin-top:12px">
              👤 Toque para ver o perfil
            </p>
          `;

          card.addEventListener('click', () => {
            abrirPerfilPublico(member);
          });

          card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              abrirPerfilPublico(member);
            }
          });

          container.appendChild(card);
        });

      } catch (error) {
        console.error('Erro ao carregar membros:', error);

        container.textContent =
          'Não foi possível carregar os membros. Verifique as regras do Firestore.';
      }
    }

    // =====================================
    // ABRIR PERFIL PÚBLICO
    // =====================================

    function abrirPerfilPublico(member) {
      const membersContainer = $('communityMembers');
      const publicProfile = $('publicProfile');
      const publicContent = $('publicProfileContent');

      if (!membersContainer || !publicProfile || !publicContent) {
        console.error('Elementos do perfil público não encontrados.');
        return;
      }

      const membersHeader = membersContainer.previousElementSibling;

      if (membersHeader) {
        membersHeader.style.display = 'none';
      }

      membersContainer.style.display = 'none';

      publicProfile.style.display = 'block';

      const avatar = member.photo_url
        ? `<img src="${esc(member.photo_url)}"
             alt="Foto de perfil"
             style="width:120px;height:120px;object-fit:cover;border-radius:50%;border:3px solid #f0b323">`
        : `<div style="width:120px;height:120px;border-radius:50%;display:grid;place-items:center;background:#e8eef2;font-size:55px;border:3px solid #f0b323">
             🚂
           </div>`;

      const localizacao = [
        member.city,
        member.state
      ].filter(Boolean).join(' - ');

      publicContent.innerHTML = `
        <div style="text-align:center;padding:24px 12px">

          <div style="display:flex;justify-content:center;margin-bottom:16px">
            ${avatar}
          </div>

          <h2 style="margin:8px 0">
            ${esc(member.name || 'Ferroviário')}
          </h2>

          <p class="muted">
            🚂 Membro da Comunidade Mundo Ferroviário
          </p>

          ${localizacao ? `
            <p style="margin:12px 0">
              📍 ${esc(localizacao)}
            </p>
          ` : ''}

          <div style="margin-top:24px;text-align:left">

            <h3>Sobre o ferroviário</h3>

            <p style="white-space:pre-wrap">
              ${esc(member.bio || 'Este membro ainda não adicionou uma biografia.')}
            </p>

          </div>

        </div>
      `;
    }

    // =====================================
    // FECHAR PERFIL PÚBLICO
    // =====================================

    const closePublicProfile = $('closePublicProfile');

    if (closePublicProfile) {
      closePublicProfile.addEventListener('click', () => {
        const membersContainer = $('communityMembers');
        const publicProfile = $('publicProfile');
        const publicContent = $('publicProfileContent');

        if (!membersContainer || !publicProfile) return;

        const membersHeader = membersContainer.previousElementSibling;

        if (membersHeader) {
          membersHeader.style.display = '';
        }

        membersContainer.style.display = '';

        publicProfile.style.display = 'none';

        if (publicContent) {
          publicContent.innerHTML = '';
        }
      });
    }


    // =====================================
    // ESTADO DA AUTENTICAÇÃO
    // =====================================

    if (auth) {
      auth.onAuthStateChanged(async user => {
        currentUser = user || null;

        const logout = $('communityLogout');
        if (logout) logout.style.display = user ? '' : 'none';

        const login = $('communityLogin');
        if (login) login.style.display = user ? 'none' : '';

        const signup = $('communitySignup');
        if (signup) signup.style.display = user ? 'none' : '';

        if (user) {
          msg('communityAuthMsg',
            'Você está conectado à comunidade.');
        }

        await carregarPerfil(user);
        await carregarMembros();
        await carregarPublicacoes();

      }, error => {
        console.error('Erro no estado de autenticação:', error);

        msg('communityAuthMsg',
          'Falha ao verificar login: ' + error.message);
      });

    } else {
      msg('communityAuthMsg',
        'Firebase Auth não está disponível.');
    }

    // =====================================
    // EXPOSIÇÃO PARA OUTRAS PARTES DO SITE
    // =====================================

    window.MF_LOAD_COMMUNITY = carregarPublicacoes;
  }

  // =====================================
  // INICIALIZAÇÃO
  // =====================================

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      iniciarComunidade
    );
  } else {
    iniciarComunidade();
  }

})();
      
    
      
