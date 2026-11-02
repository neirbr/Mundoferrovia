
(function () {
  'use strict';

  function iniciarComunidade() {
    if (window.MF_COMMUNITY_STARTED) return;
    window.MF_COMMUNITY_STARTED = true;

    const $ = id => document.getElementById(id);
    const auth = window.MF_AUTH;
    const db = window.MF_DB;
    const cloud = window.MF_CLOUDINARY;

    let currentUser = null;

    function esc(value) {
      return String(value ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;',
        '"': '&quot;', "'": '&#39;'
      }[c]));
    }

    function msg(id, text) {
      const el = $(id);
      if (el) el.textContent = text;
    }

    function nome(user) {
      return user.displayName ||
        (user.email ? user.email.split('@')[0] : 'Ferroviário');
    }

    function dataTexto(value) {
      return value?.toDate
        ? value.toDate().toLocaleString('pt-BR')
        : 'Publicação recente';
    }

    function firebaseOK() {
      if (!auth || !db || !window.firebase) {
        msg('communityAuthMsg',
          'Firebase não inicializado. Confira a configuração.');
        return false;
      }
      return true;
    }

    // LOGIN
    $('communityLogin')?.addEventListener('click', async () => {
      if (!firebaseOK()) return;

      const email = $('communityEmail').value.trim();
      const password = $('communityPassword').value;

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
        msg('communityAuthMsg', 'Não foi possível entrar: ' + error.message);
      } finally {
        button.disabled = false;
      }
    });

    // CADASTRO
    $('communitySignup')?.addEventListener('click', async () => {
        alert('Botão Criar conta está funcionando!');
      if (!firebaseOK()) return;

      const email = $('communityEmail').value.trim();
      const password = $('communityPassword').value;

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
        msg('communityAuthMsg', 'Erro no cadastro: ' + error.message);
      } finally {
        button.disabled = false;
      }
    });

    // SAIR
    $('communityLogout')?.addEventListener('click', async () => {
      if (!auth) return;

      try {
        await auth.signOut();
        msg('communityAuthMsg', 'Você saiu da comunidade.');
      } catch (error) {
        msg('communityAuthMsg', error.message);
      }
    });

    // ESTADO DO USUÁRIO
    if (auth) {
      auth.onAuthStateChanged(user => {
        currentUser = user || null;

        if ($('communityLogin'))
          $('communityLogin').style.display = user ? 'none' : '';

        if ($('communitySignup'))
          $('communitySignup').style.display = user ? 'none' : '';

        if ($('communityLogout'))
          $('communityLogout').style.display = user ? '' : 'none';

        msg('communityAuthMsg', user
          ? 'Conectado como ' + nome(user)
          : 'Entre ou crie uma conta para participar.');

        carregarPublicacoes();
      });
    } else {
      msg('communityAuthMsg',
        'Não foi possível conectar ao Firebase Authentication.');
    }

    // PUBLICAR TEXTO E FOTO OPCIONAL
    const postForm = $('communityPostForm');

    if (postForm) {
      // A confirmação de direitos só será exigida se houver foto.
      postForm.noValidate = true;

      postForm.addEventListener('submit', async event => {
        event.preventDefault();

        if (!firebaseOK()) return;

        if (!currentUser) {
          msg('communityPostMsg', 'Entre na sua conta antes de publicar.');
          return;
        }

        const text = $('communityText').value.trim();
        const file = $('communityPhoto').files[0];
        const rights = $('communityRights').checked;
        const button = $('communityPublish');

        if (!text || text.length > 1000) {
          msg('communityPostMsg', 'Escreva uma publicação de até 1000 caracteres.');
          return;
        }

        if (file) {
          if (!rights) {
            msg('communityPostMsg',
              'Confirme que tem autorização para publicar a fotografia.');
            return;
          }

          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            msg('communityPostMsg', 'Use uma imagem JPG, PNG ou WebP.');
            return;
          }

          if (file.size > 10 * 1024 * 1024) {
            msg('communityPostMsg', 'A imagem deve ter no máximo 10 MB.');
            return;
          }

          if (!cloud?.cloudName || !cloud?.uploadPreset) {
            msg('communityPostMsg', 'Configuração do Cloudinary não encontrada.');
            return;
          }
        }

        button.disabled = true;
        msg('communityPostMsg', 'Publicando... aguarde.');

        try {
          let imageUrl = null;

          if (file) {
            const form = new FormData();
            form.append('file', file);
            form.append('upload_preset', cloud.uploadPreset);

            const response = await fetch(
              `https://api.cloudinary.com/v1_1/${cloud.cloudName}/image/upload`,
              { method: 'POST', body: form }
            );

            const uploaded = await response.json();

            if (!response.ok || !uploaded.secure_url) {
              throw new Error(
                uploaded.error?.message || 'Falha ao enviar fotografia.'
              );
            }

            imageUrl = uploaded.secure_url;
          }

          const post = {
            user_id: currentUser.uid,
            author_name: nome(currentUser),
            text: text,
            status: 'approved',
            created_at: firebase.firestore.FieldValue.serverTimestamp()
          };

          if (imageUrl) post.image_url = imageUrl;

          await db.collection('community_posts').add(post);

          postForm.reset();
          msg('communityPostMsg', 'Publicação realizada com sucesso!');
          await carregarPublicacoes();

        } catch (error) {
          console.error('Erro ao publicar:', error);
          msg('communityPostMsg', 'Erro ao publicar: ' + error.message);
        } finally {
          button.disabled = false;
        }
      });
    }

    // CARREGAR PUBLICAÇÕES
    async function carregarPublicacoes() {
      const feed = $('communityFeed');
      if (!feed || !db) return;

      feed.innerHTML = '<div class="empty">Carregando publicações...</div>';

      try {
        const snapshot = await db.collection('community_posts')
          .where('status', '==', 'approved')
          .get();

        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        posts.sort((a, b) => {
          const da = a.created_at?.toDate?.()?.getTime() || 0;
          const dbb = b.created_at?.toDate?.()?.getTime() || 0;
          return dbb - da;
        });

        if (!posts.length) {
          feed.innerHTML =
            '<div class="empty">Ainda não há publicações. Seja o primeiro a compartilhar!</div>';
          return;
        }

        const cards = await Promise.all(posts.map(renderizarPublicacao));
        feed.innerHTML = cards.join('');

      } catch (error) {
        console.error('Erro ao carregar publicações:', error);
        feed.innerHTML =
          '<div class="empty">Não foi possível carregar a comunidade. Confira as regras do Firestore.</div>';
      }
    }

    // MONTAR PUBLICAÇÃO
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

      const liked = currentUser &&
        likes.some(doc => doc.id === currentUser.uid);

      comments.sort((a, b) => {
        const da = a.created_at?.toDate?.()?.getTime() || 0;
        const dbb = b.created_at?.toDate?.()?.getTime() || 0;
        return da - dbb;
      });

      const commentsHTML = comments.map(comment => `
        <div class="community-comment">
          <strong>Ferroviário</strong>
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
        ? `<button type="button" data-delete="${esc(post.id)}"
             class="btn outline">Excluir publicação</button>`
        : '';

      return `
        <article class="card community-post">
          <strong>${esc(post.author_name || 'Ferroviário')}</strong>
          <small class="muted">${esc(dataTexto(post.created_at))}</small>

          <p style="white-space:pre-wrap;margin-top:12px">${esc(post.text)}</p>

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
            ${commentsHTML || '<p class="muted">Seja o primeiro a comentar.</p>'}
          </div>

          <form data-comment="${esc(post.id)}" style="margin-top:12px">
            <input name="comment" maxlength="500"
              placeholder="Escreva um comentário..." required>
            <button type="submit" class="btn secondary">
              Comentar
            </button>
          </form>
        </article>
      `;
    }

    // CURTIDAS
    $('communityFeed')?.addEventListener('click', async event => {
      const button = event.target.closest('[data-like]');
      if (!button) return;

      if (!currentUser) {
        alert('Entre na sua conta para curtir.');
        return;
      }

      const postId = button.dataset.like;
      const ref = db.collection('community_posts')
        .doc(postId).collection('likes').doc(currentUser.uid);

      button.disabled = true;

      try {
        const existing = await ref.get();

        if (existing.exists) {
          await ref.delete();
        } else {
          await ref.set({
            user_id: currentUser.uid,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
          });
        }

        await carregarPublicacoes();

      } catch (error) {
        console.error('Erro na curtida:', error);
        alert('Não foi possível registrar a curtida: ' + error.message);
      }
    });

    // EXCLUIR PRÓPRIA PUBLICAÇÃO
    $('communityFeed')?.addEventListener('click', async event => {
      const button = event.target.closest('[data-delete]');
      if (!button) return;

      if (!currentUser) return;

      if (!confirm('Deseja realmente excluir esta publicação?')) return;

      try {
        await db.collection('community_posts')
          .doc(button.dataset.delete).delete();

        await carregarPublicacoes();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Não foi possível excluir: ' + error.message);
      }
    });

    // COMENTÁRIOS
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
          .collection('comments').add({
            user_id: currentUser.uid,
            text: text,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
          });

        await carregarPublicacoes();

      } catch (error) {
        console.error('Erro no comentário:', error);
        alert('Não foi possível comentar: ' + error.message);
      }
    });

    window.MF_LOAD_COMMUNITY = carregarPublicacoes;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarComunidade, { once: true });
  } else {
    iniciarComunidade();
  }
})();
