
(function () {
  'use strict';

  if (window.MF_COMMUNITY_STARTED) return;
  window.MF_COMMUNITY_STARTED = true;

  const $ = id => document.getElementById(id);
  const auth = window.MF_AUTH;
  const db = window.MF_DB;
  const cloud = window.MF_CLOUDINARY;

  let currentUser = null;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function message(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function authorName(user) {
    return user.displayName ||
      (user.email ? user.email.split('@')[0] : 'Ferroviário');
  }

  function dateText(value) {
    if (!value || !value.toDate) return 'Publicação recente';
    return value.toDate().toLocaleString('pt-BR');
  }

  function requireFirebase() {
    if (!auth || !db) {
      message('galleryAuthMsg',
        'Firebase não inicializado. Confira os arquivos de configuração.');
      return false;
    }
    return true;
  }

  // CADASTRO
  $('gallerySignup')?.addEventListener('click', async () => {
    if (!requireFirebase()) return;

    const email = $('galleryEmail').value.trim();
    const password = $('galleryPassword').value;

    if (!email || password.length < 8) {
      message('galleryAuthMsg',
        'Informe um e-mail válido e uma senha com pelo menos 8 caracteres.');
      return;
    }

    try {
      await auth.createUserWithEmailAndPassword(email, password);
      message('galleryAuthMsg', 'Conta criada com sucesso!');
    } catch (error) {
      message('galleryAuthMsg', 'Não foi possível criar a conta: ' + error.message);
    }
  });

  // LOGIN
  $('galleryLogin')?.addEventListener('click', async () => {
    if (!requireFirebase()) return;

    const email = $('galleryEmail').value.trim();
    const password = $('galleryPassword').value;

    try {
      await auth.signInWithEmailAndPassword(email, password);
      message('galleryAuthMsg', 'Login realizado!');
    } catch (error) {
      message('galleryAuthMsg', 'Erro ao entrar: ' + error.message);
    }
  });

  // SAIR
  $('galleryLogout')?.addEventListener('click', async () => {
    try {
      await auth.signOut();
      message('galleryAuthMsg', 'Você saiu da sua conta.');
    } catch (error) {
      message('galleryAuthMsg', error.message);
    }
  });

  // ATUALIZAÇÃO DO ESTADO DO USUÁRIO
  if (auth) {
    auth.onAuthStateChanged(user => {
      currentUser = user || null;

      if ($('galleryLogin')) {
        $('galleryLogin').style.display = user ? 'none' : 'inline-block';
      }
      if ($('gallerySignup')) {
        $('gallerySignup').style.display = user ? 'none' : 'inline-block';
      }
      if ($('galleryLogout')) {
        $('galleryLogout').style.display = user ? 'inline-block' : 'none';
      }

      message('galleryAuthMsg', user
        ? 'Conectado como ' + authorName(user)
        : 'Entre ou crie uma conta para participar.');

      loadPosts();
    });
  }

  // ENVIO DE FOTOS PARA O CLOUDINARY
  $('galleryUpload')?.addEventListener('submit', async event => {
    event.preventDefault();

    if (!currentUser) {
      message('galleryUploadMsg', 'Entre na sua conta antes de publicar.');
      return;
    }

    const title = $('photoTitle').value.trim();
    const category = $('photoCategory').value;
    const description = $('photoDescription').value.trim();
    const file = $('photoFile').files[0];
    const rights = $('photoRights').checked;
    const button = $('photoSubmit');

    if (!title || !file || !rights) {
      message('galleryUploadMsg', 'Preencha os campos obrigatórios.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      message('galleryUploadMsg', 'Use uma imagem JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      message('galleryUploadMsg', 'A imagem deve ter no máximo 10 MB.');
      return;
    }

    if (!cloud?.cloudName || !cloud?.uploadPreset) {
      message('galleryUploadMsg', 'Configuração do Cloudinary não encontrada.');
      return;
    }

    button.disabled = true;
    message('galleryUploadMsg', 'Enviando imagem... aguarde.');

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', cloud.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud.cloudName}/image/upload`,
        { method: 'POST', body: form }
      );

      const uploaded = await response.json();

      if (!response.ok || !uploaded.secure_url) {
        throw new Error(uploaded.error?.message || 'Falha no envio da imagem.');
      }

      await db.collection('gallery_photos').add({
        title: title,
        category: category,
        description: description,
        image_url: uploaded.secure_url,
        user_id: currentUser.uid,
        author_name: authorName(currentUser),
        status: 'pending',
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      });

      $('galleryUpload').reset();
      message('galleryUploadMsg',
        'Foto enviada! Ela ficará aguardando aprovação da equipe.');
      loadPosts();

    } catch (error) {
      console.error('Erro ao publicar foto:', error);
      message('galleryUploadMsg',
        'Não foi possível enviar: ' + error.message);
    } finally {
      button.disabled = false;
    }
  });

  // CARREGAR PUBLICAÇÕES APROVADAS
  async function loadPosts() {
    const grid = $('galleryGrid');
    if (!grid || !db) return;

    grid.innerHTML = '<div class="empty">Carregando publicações...</div>';

    try {
      const snapshot = await db.collection('gallery_photos')
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
        grid.innerHTML =
          '<div class="empty">Ainda não há publicações aprovadas.</div>';
        return;
      }

      const cards = await Promise.all(posts.map(renderPost));
      grid.innerHTML = cards.join('');

    } catch (error) {
      console.error('Erro ao carregar comunidade:', error);
      grid.innerHTML =
        '<div class="empty">Erro ao carregar publicações. Verifique as permissões do Firestore.</div>';
    }
  }

  // MONTAR CADA PUBLICAÇÃO
  async function renderPost(post) {
    let likes = [];
    let comments = [];

    try {
      const result = await Promise.all([
        db.collection('gallery_photos').doc(post.id)
          .collection('likes').get(),
        db.collection('gallery_photos').doc(post.id)
          .collection('comments').get()
      ]);

      likes = result[0].docs;
      comments = result[1].docs.map(doc => doc.data());
    } catch (error) {
      console.warn('Interações ainda dependem das regras do Firestore:', error);
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
        <strong>${esc(comment.author_name || 'Ferroviário')}</strong>
        <p>${esc(comment.text || '')}</p>
      </div>
    `).join('');

    return `
      <article class="card community-post">
        <img src="${esc(post.image_url)}"
          alt="${esc(post.title)}"
          loading="lazy"
          style="width:100%;height:230px;object-fit:cover;border-radius:10px">

        <span class="tag">${esc(post.category || 'Ferrovia')}</span>
        <h3>${esc(post.title)}</h3>
        <p>${esc(post.description || '')}</p>

        <small class="muted">
          Publicado por ${esc(post.author_name || 'Ferroviário')}
          • ${esc(dateText(post.created_at))}
        </small>

        <div class="community-actions" style="display:flex;gap:16px;margin:14px 0">
          <button type="button" data-like="${esc(post.id)}">
            ${liked ? '❤️ Curtido' : '🤍 Curtir'} (${likes.length})
          </button>
          <span>💬 ${comments.length} comentário(s)</span>
        </div>

        <div class="community-comments">
          ${commentsHTML || '<p class="muted">Seja o primeiro a comentar.</p>'}
        </div>

        <form data-comment-form="${esc(post.id)}" style="margin-top:12px">
          <input name="comment" maxlength="500"
            placeholder="Escreva um comentário..."
            required style="width:100%;padding:11px;border:1px solid #dce5ea;border-radius:9px">
          <button class="btn secondary" type="submit" style="margin-top:8px">
            Comentar
          </button>
        </form>
      </article>
    `;
  }

  // CURTIR OU REMOVER CURTIDA
  $('galleryGrid')?.addEventListener('click', async event => {
    const button = event.target.closest('[data-like]');
    if (!button) return;

    if (!currentUser) {
      alert('Entre na sua conta para curtir publicações.');
      return;
    }

    const postId = button.dataset.like;
    const likeRef = db.collection('gallery_photos')
      .doc(postId).collection('likes').doc(currentUser.uid);

    button.disabled = true;

    try {
      const existing = await likeRef.get();

      if (existing.exists) {
        await likeRef.delete();
      } else {
        await likeRef.set({
          user_id: currentUser.uid,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      await loadPosts();

    } catch (error) {
      alert('Não foi possível registrar a curtida. As regras do Firestore precisam ser atualizadas.');
      console.error(error);
    }
  });

  // ENVIAR COMENTÁRIOS
  $('galleryGrid')?.addEventListener('submit', async event => {
    const form = event.target.closest('[data-comment-form]');
    if (!form) return;

    event.preventDefault();

    if (!currentUser) {
      alert('Entre na sua conta para comentar.');
      return;
    }

    const postId = form.dataset.commentForm;
    const input = form.querySelector('[name="comment"]');
    const text = input.value.trim();

    if (!text || text.length > 500) return;

    try {
      await db.collection('gallery_photos')
        .doc(postId).collection('comments').add({
          user_id: currentUser.uid,
          author_name: authorName(currentUser),
          text: text,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });

      await loadPosts();

    } catch (error) {
      alert('Não foi possível enviar o comentário. As regras do Firestore precisam ser atualizadas.');
      console.error(error);
    }
  });

  // BOTÃO ATUALIZAR
  $('galleryRefresh')?.addEventListener('click', loadPosts);

  window.MF_LOAD_COMMUNITY = loadPosts;

})();

