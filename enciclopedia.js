
(function () {
  'use strict';

  if (window.MF_ENCYCLOPEDIA_STARTED) return;
  window.MF_ENCYCLOPEDIA_STARTED = true;

  const auth = window.MF_AUTH;
  const db = window.MF_DB;

  const form = document.getElementById('encyclopediaSuggestionForm');
  const articlesContainer = document.getElementById('encyclopediaArticles');
  const adminPanel = document.getElementById('encyclopediaAdminPanel');
  const pendingContainer = document.getElementById('encyclopediaPendingSuggestions');

  // UID DO ADMINISTRADOR CADASTRADO NAS REGRAS DO FIRESTORE
  const ADMIN_UID = 'QWD9zZ4EQkPKwEQ1xMC2WzfUJuF3';

  if (!auth || !db) {
    console.error('Firebase Auth ou Firestore não inicializado.');
    return;
  }

  // PROTEÇÃO CONTRA HTML INDESEJADO
  function escapeHTML(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  // ORDENAÇÃO POR DATA
  function timestampValue(timestamp) {
    if (!timestamp) return 0;
    return timestamp.toMillis ? timestamp.toMillis() : 0;
  }

  // =====================================
  // SUGERIR ARTIGO
  // =====================================

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      const user = auth.currentUser;

      if (!user) {
        alert('Você precisa estar logado para sugerir um artigo.');
        return;
      }

      const title = document.getElementById('encyclopediaTitle').value.trim();
      const category = document.getElementById('encyclopediaCategory').value;
      const summary = document.getElementById('encyclopediaSummary').value.trim();
      const content = document.getElementById('encyclopediaContent').value.trim();
      const source = document.getElementById('encyclopediaSource').value.trim();

      if (!title || !category || !summary || !content) {
        alert('Preencha todos os campos obrigatórios.');
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando sugestão...';
      }

      try {
        await db.collection('encyclopedia_suggestions').add({
          title: title,
          category: category,
          summary: summary,
          content: content,
          source: source,
          author_uid: user.uid,
          author_name: user.displayName || user.email || 'Usuário',
          status: 'pending',
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert('Sugestão enviada com sucesso! Ela será analisada pela administração.');

        form.reset();

        if (user.uid === ADMIN_UID) {
          carregarSugestoes();
        }

      } catch (error) {
        console.error('Erro ao enviar sugestão:', error);
        alert('Não foi possível enviar a sugestão. Verifique as permissões do Firebase.');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Enviar sugestão para aprovação';
        }
      }
    });
  }

  // =====================================
  // CARREGAR ARTIGOS PUBLICADOS
  // =====================================

  async function carregarArtigos() {
    if (!articlesContainer) return;

    try {
      const snapshot = await db.collection('encyclopedia_articles')
        .where('status', '==', 'published')
        .get();

      if (snapshot.empty) {
        articlesContainer.innerHTML =
          '<div class="empty">Ainda não existem artigos publicados na Enciclopédia.</div>';
        return;
      }

      const artigos = [];

      snapshot.forEach(function (doc) {
        artigos.push({
          id: doc.id,
          ...doc.data()
        });
      });

      artigos.sort(function (a, b) {
        return timestampValue(b.published_at) - timestampValue(a.published_at);
      });

      articlesContainer.innerHTML = artigos.map(function (artigo) {
        return `
          <div class="card">
            <span class="tag">${escapeHTML(artigo.category)}</span>
            <h3>${escapeHTML(artigo.title)}</h3>
            <p>${escapeHTML(artigo.summary)}</p>

            <details>
              <summary class="btn">Ler artigo completo</summary>

              <div style="margin-top:15px; white-space:pre-wrap;">
                ${escapeHTML(artigo.content)}
              </div>

              ${artigo.source ? `
                <p class="muted" style="margin-top:15px">
                  Fonte: ${escapeHTML(artigo.source)}
                </p>
              ` : ''}
            </details>

            <p class="muted" style="margin-top:12px">
              Contribuição: ${escapeHTML(artigo.author_name || 'Comunidade ferroviária')}
            </p>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error('Erro ao carregar artigos:', error);

      articlesContainer.innerHTML =
        '<div class="empty">Não foi possível carregar os artigos.</div>';
    }
  }

  // =====================================
  // CARREGAR SUGESTÕES DO ADMINISTRADOR
  // =====================================

  async function carregarSugestoes() {
    if (!pendingContainer || auth.currentUser?.uid !== ADMIN_UID) return;

    pendingContainer.innerHTML =
      '<div class="empty">Carregando sugestões...</div>';

    try {
      const snapshot = await db.collection('encyclopedia_suggestions')
        .where('status', '==', 'pending')
        .get();

      if (snapshot.empty) {
        pendingContainer.innerHTML =
          '<div class="empty">Não existem sugestões pendentes no momento.</div>';
        return;
      }

      const sugestoes = [];

      snapshot.forEach(function (doc) {
        sugestoes.push({
          id: doc.id,
          ...doc.data()
        });
      });

      sugestoes.sort(function (a, b) {
        return timestampValue(b.created_at) - timestampValue(a.created_at);
      });

      pendingContainer.innerHTML = sugestoes.map(function (item) {
        return `
          <div class="card" style="margin-top:15px">

            <span class="tag">PENDENTE DE APROVAÇÃO</span>

            <h3>${escapeHTML(item.title)}</h3>

            <p><strong>Categoria:</strong> ${escapeHTML(item.category)}</p>

            <p><strong>Autor:</strong> ${escapeHTML(item.author_name)}</p>

            <p><strong>Resumo:</strong></p>
            <p>${escapeHTML(item.summary)}</p>

            <details style="margin-top:12px">
              <summary class="btn">Visualizar conteúdo completo</summary>

              <div style="margin-top:12px; white-space:pre-wrap;">
                ${escapeHTML(item.content)}
              </div>

              ${item.source ? `
                <p class="muted" style="margin-top:12px">
                  Fonte: ${escapeHTML(item.source)}
                </p>
              ` : ''}
            </details>

            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:18px">

              <button
                class="btn"
                type="button"
                data-action="approve"
                data-id="${escapeHTML(item.id)}">
                Aprovar e publicar
              </button>

              <button
                class="btn"
                type="button"
                data-action="reject"
                data-id="${escapeHTML(item.id)}">
                Rejeitar
              </button>

            </div>

          </div>
        `;
      }).join('');

    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);

      pendingContainer.innerHTML =
        '<div class="empty">Erro ao carregar sugestões. Verifique as permissões.</div>';
    }
  }

  // =====================================
  // APROVAR E PUBLICAR ARTIGO
  // =====================================

  async function aprovarSugestao(suggestionId) {
    if (auth.currentUser?.uid !== ADMIN_UID) {
      alert('Apenas o administrador pode aprovar artigos.');
      return;
    }

    try {
      const suggestionRef = db.collection('encyclopedia_suggestions')
        .doc(suggestionId);

      const suggestionDoc = await suggestionRef.get();

      if (!suggestionDoc.exists || suggestionDoc.data().status !== 'pending') {
        alert('Esta sugestão não está mais pendente.');
        await carregarSugestoes();
        return;
      }

      const item = suggestionDoc.data();

      const articleRef = db.collection('encyclopedia_articles').doc();

      const batch = db.batch();

      batch.set(articleRef, {
        title: item.title,
        category: item.category,
        summary: item.summary,
        content: item.content,
        source: item.source || '',
        author_uid: item.author_uid,
        author_name: item.author_name,
        status: 'published',
        suggestion_id: suggestionId,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        published_at: firebase.firestore.FieldValue.serverTimestamp()
      });

      batch.update(suggestionRef, {
        status: 'approved',
        article_id: articleRef.id,
        reviewed_at: firebase.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();

      alert('Artigo aprovado e publicado com sucesso!');

      await carregarSugestoes();
      await carregarArtigos();

    } catch (error) {
      console.error('Erro ao aprovar artigo:', error);
      alert('Não foi possível publicar o artigo. Verifique o Firebase.');
    }
  }

  // =====================================
  // REJEITAR SUGESTÃO
  // =====================================

  async function rejeitarSugestao(suggestionId) {
    if (auth.currentUser?.uid !== ADMIN_UID) {
      alert('Apenas o administrador pode rejeitar sugestões.');
      return;
    }

    const confirmar = confirm(
      'Deseja realmente rejeitar esta sugestão?'
    );

    if (!confirmar) return;

    try {
      await db.collection('encyclopedia_suggestions')
        .doc(suggestionId)
        .update({
          status: 'rejected',
          reviewed_at: firebase.firestore.FieldValue.serverTimestamp()
        });

      alert('Sugestão rejeitada.');

      await carregarSugestoes();

    } catch (error) {
      console.error('Erro ao rejeitar sugestão:', error);
      alert('Não foi possível rejeitar a sugestão.');
    }
  }

  // =====================================
  // EVENTOS DOS BOTÕES ADMINISTRATIVOS
  // =====================================

  if (pendingContainer) {
    pendingContainer.addEventListener('click', async function (event) {
      const button = event.target.closest('button[data-action]');

      if (!button || !pendingContainer.contains(button)) return;

      const action = button.dataset.action;
      const id = button.dataset.id;

      if (!id) return;

      button.disabled = true;

      if (action === 'approve') {
        await aprovarSugestao(id);
      } else if (action === 'reject') {
        await rejeitarSugestao(id);
      }

      if (button.isConnected) {
        button.disabled = false;
      }
    });
  }

  // =====================================
  // IDENTIFICAR ADMINISTRADOR
  // =====================================

  auth.onAuthStateChanged(async function (user) {
    const isAdmin = !!user && user.uid === ADMIN_UID;

    if (adminPanel) {
      adminPanel.style.display = isAdmin ? 'block' : 'none';
    }

    if (isAdmin) {
      await carregarSugestoes();
    } else if (pendingContainer) {
      pendingContainer.innerHTML = '';
    }

    await carregarArtigos();
  });

  console.log('ENCICLOPÉDIA.JS INICIADO 🚂');

})();
 
