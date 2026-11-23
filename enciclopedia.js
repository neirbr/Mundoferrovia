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

  const ADMIN_UID = 'QWD9zZ4EQkPKwEQ1xMC2WzfUJuF3';

  // =====================================
  // TRADUÇÕES DA ENCICLOPÉDIA
  // =====================================

  const translations = {
    en: {
      'Firebase Auth ou Firestore não inicializado.': 'Firebase Auth or Firestore not initialized.',
      'Você precisa estar logado para sugerir um artigo.': 'You must be logged in to suggest an article.',
      'Preencha todos os campos obrigatórios.': 'Please fill in all required fields.',
      'Enviando sugestão...': 'Sending suggestion...',
      'Sugestão enviada com sucesso! Ela será analisada pela administração.': 'Suggestion submitted successfully! It will be reviewed by the administration.',
      'Não foi possível enviar a sugestão. Verifique as permissões do Firebase.': 'Could not submit the suggestion. Check Firebase permissions.',
      'Enviar sugestão para aprovação': 'Submit suggestion for approval',
      'Ainda não existem artigos publicados na Enciclopédia.': 'There are no articles published in the Encyclopedia yet.',
      'Ler artigo completo': 'Read full article',
      'Fonte:': 'Source:',
      'Contribuição:': 'Contribution:',
      'Comunidade ferroviária': 'Railway community',
      'Editar': 'Edit',
      'Excluir': 'Delete',
      'Não foi possível carregar os artigos.': 'Could not load articles.',
      'Apenas o administrador pode realizar esta ação.': 'Only the administrator can perform this action.',
      'Artigo não encontrado.': 'Article not found.',
      'Título do artigo:': 'Article title:',
      'Categoria:': 'Category:',
      'Resumo do artigo:': 'Article summary:',
      'Conteúdo completo:': 'Full content:',
      'Fonte do artigo (opcional):': 'Article source (optional):',
      'Título, categoria, resumo e conteúdo são obrigatórios.': 'Title, category, summary and content are required.',
      'Artigo atualizado com sucesso!': 'Article updated successfully!',
      'Não foi possível editar o artigo.': 'Could not edit the article.',
      'Tem certeza que deseja excluir este artigo? Esta ação não poderá ser desfeita.': 'Are you sure you want to delete this article? This action cannot be undone.',
      'Artigo excluído com sucesso!': 'Article deleted successfully!',
      'Não foi possível excluir o artigo.': 'Could not delete the article.',
      'Carregando sugestões...': 'Loading suggestions...',
      'Não existem sugestões pendentes no momento.': 'There are no pending suggestions at the moment.',
      'PENDENTE DE APROVAÇÃO': 'PENDING APPROVAL',
      'Autor:': 'Author:',
      'Resumo:': 'Summary:',
      'Visualizar conteúdo completo': 'View full content',
      'Aprovar e publicar': 'Approve and publish',
      'Rejeitar': 'Reject',
      'Erro ao carregar sugestões. Verifique as permissões.': 'Error loading suggestions. Check permissions.',
      'Apenas o administrador pode aprovar artigos.': 'Only the administrator can approve articles.',
      'Esta sugestão não está mais pendente.': 'This suggestion is no longer pending.',
      'Artigo aprovado e publicado com sucesso!': 'Article approved and published successfully!',
      'Não foi possível publicar o artigo. Verifique o Firebase.': 'Could not publish the article. Check Firebase.',
      'Apenas o administrador pode rejeitar sugestões.': 'Only the administrator can reject suggestions.',
      'Deseja realmente rejeitar esta sugestão?': 'Do you really want to reject this suggestion?',
      'Sugestão rejeitada.': 'Suggestion rejected.',
      'Não foi possível rejeitar a sugestão.': 'Could not reject the suggestion.',

      'Locomotivas': 'Locomotives',
      'Vagões': 'Freight cars',
      'Componentes ferroviários': 'Railway components',
      'Sinalização': 'Signaling',
      'Operações ferroviárias': 'Railway operations',
      'História ferroviária': 'Railway history'
    },

    es: {
      'Firebase Auth ou Firestore não inicializado.': 'Firebase Auth o Firestore no está inicializado.',
      'Você precisa estar logado para sugerir um artigo.': 'Debes iniciar sesión para sugerir un artículo.',
      'Preencha todos os campos obrigatórios.': 'Completa todos los campos obligatorios.',
      'Enviando sugestão...': 'Enviando sugerencia...',
      'Sugestão enviada com sucesso! Ela será analisada pela administração.': '¡Sugerencia enviada correctamente! Será revisada por la administración.',
      'Não foi possível enviar a sugestão. Verifique as permissões do Firebase.': 'No se pudo enviar la sugerencia. Comprueba los permisos de Firebase.',
      'Enviar sugestão para aprovação': 'Enviar sugerencia para aprobación',
      'Ainda não existem artigos publicados na Enciclopédia.': 'Todavía no hay artículos publicados en la Enciclopedia.',
      'Ler artigo completo': 'Leer artículo completo',
      'Fonte:': 'Fuente:',
      'Contribuição:': 'Contribución:',
      'Comunidade ferroviária': 'Comunidad ferroviaria',
      'Editar': 'Editar',
      'Excluir': 'Eliminar',
      'Não foi possível carregar os artigos.': 'No se pudieron cargar los artículos.',
      'Apenas o administrador pode realizar esta ação.': 'Solo el administrador puede realizar esta acción.',
      'Artigo não encontrado.': 'Artículo no encontrado.',
      'Título do artigo:': 'Título del artículo:',
      'Categoria:': 'Categoría:',
      'Resumo do artigo:': 'Resumen del artículo:',
      'Conteúdo completo:': 'Contenido completo:',
      'Fonte do artigo (opcional):': 'Fuente del artículo (opcional):',
      'Título, categoria, resumo e conteúdo são obrigatórios.': 'El título, la categoría, el resumen y el contenido son obligatorios.',
      'Artigo atualizado com sucesso!': '¡Artículo actualizado correctamente!',
      'Não foi possível editar o artigo.': 'No se pudo editar el artículo.',
      'Tem certeza que deseja excluir este artigo? Esta ação não poderá ser desfeita.': '¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer.',
      'Artigo excluído com sucesso!': '¡Artículo eliminado correctamente!',
      'Não foi possível excluir o artigo.': 'No se pudo eliminar el artículo.',
      'Carregando sugestões...': 'Cargando sugerencias...',
      'Não existem sugestões pendentes no momento.': 'No hay sugerencias pendientes en este momento.',
      'PENDENTE DE APROVAÇÃO': 'PENDIENTE DE APROBACIÓN',
      'Autor:': 'Autor:',
      'Resumo:': 'Resumen:',
      'Visualizar conteúdo completo': 'Ver contenido completo',
      'Aprovar e publicar': 'Aprobar y publicar',
      'Rejeitar': 'Rechazar',
      'Erro ao carregar sugestões. Verifique as permissões.': 'Error al cargar sugerencias. Comprueba los permisos.',
      'Apenas o administrador pode aprovar artigos.': 'Solo el administrador puede aprobar artículos.',
      'Esta sugestão não está mais pendente.': 'Esta sugerencia ya no está pendiente.',
      'Artigo aprovado e publicado com sucesso!': '¡Artículo aprobado y publicado correctamente!',
      'Não foi possível publicar o artigo. Verifique o Firebase.': 'No se pudo publicar el artículo. Comprueba Firebase.',
      'Apenas o administrador pode rejeitar sugestões.': 'Solo el administrador puede rechazar sugerencias.',
      'Deseja realmente rejeitar esta sugestão?': '¿Realmente deseas rechazar esta sugerencia?',
      'Sugestão rejeitada.': 'Sugerencia rechazada.',
      'Não foi possível rejeitar a sugestão.': 'No se pudo rechazar la sugerencia.',

      'Locomotivas': 'Locomotoras',
      'Vagões': 'Vagones',
      'Componentes ferroviários': 'Componentes ferroviarios',
      'Sinalização': 'Señalización',
      'Operações ferroviárias': 'Operaciones ferroviarias',
      'História ferroviária': 'Historia ferroviaria'
    }
  };

  function idiomaAtual() {
    const idioma = (
      document.documentElement.lang ||
      localStorage.getItem('mf_language') ||
      'pt'
    ).toLowerCase();

    if (idioma.startsWith('en')) return 'en';
    if (idioma.startsWith('es')) return 'es';

    return 'pt';
  }

  function t(text) {
    const idioma = idiomaAtual();

    if (idioma === 'pt') return text;

    return translations[idioma]?.[text] || text;
  }

  if (!auth || !db) {
    console.error(t('Firebase Auth ou Firestore não inicializado.'));
    return;
  }

  // =====================================
  // PROTEÇÃO CONTRA HTML INDESEJADO
  // =====================================

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

  function textoHTML(text) {
    return escapeHTML(t(text));
  }

  // =====================================
  // ORDENAÇÃO POR DATA
  // =====================================

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
        alert(t('Você precisa estar logado para sugerir um artigo.'));
        return;
      }

      const title = document.getElementById('encyclopediaTitle').value.trim();
      const category = document.getElementById('encyclopediaCategory').value;
      const summary = document.getElementById('encyclopediaSummary').value.trim();
      const content = document.getElementById('encyclopediaContent').value.trim();
      const source = document.getElementById('encyclopediaSource').value.trim();

      if (!title || !category || !summary || !content) {
        alert(t('Preencha todos os campos obrigatórios.'));
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = t('Enviando sugestão...');
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

        alert(t('Sugestão enviada com sucesso! Ela será analisada pela administração.'));

        form.reset();

        if (user.uid === ADMIN_UID) {
          carregarSugestoes();
        }

      } catch (error) {
        console.error('Erro ao enviar sugestão:', error);
        alert(t('Não foi possível enviar a sugestão. Verifique as permissões do Firebase.'));
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = t('Enviar sugestão para aprovação');
        }
      }
    });
  }

  // =====================================
  // CARREGAR ARTIGOS PUBLICADOS
  // =====================================

  const ARTICLES_CACHE_KEY = 'mf_encyclopedia_published_v1';

  function renderizarArtigos(artigos) {
    if (!articlesContainer) return;

    if (!Array.isArray(artigos) || artigos.length === 0) {
      articlesContainer.innerHTML =
        `<div class="empty">${textoHTML('Ainda não existem artigos publicados na Enciclopédia.')}</div>`;
      return;
    }

    const lista = artigos.slice();

    lista.sort(function (a, b) {
      return timestampValue(b.published_at) - timestampValue(a.published_at);
    });

    articlesContainer.innerHTML = lista.map(function (artigo) {
      return `
        <div class="card">
          <span class="tag">${escapeHTML(t(artigo.category))}</span>
          <h3>${escapeHTML(artigo.title)}</h3>
          <p>${escapeHTML(artigo.summary)}</p>

          <details>
            <summary class="btn">${textoHTML('Ler artigo completo')}</summary>

            <div style="margin-top:15px; white-space:pre-wrap;">
              ${escapeHTML(artigo.content)}
            </div>

            ${artigo.source ? `
              <p class="muted" style="margin-top:15px">
                ${textoHTML('Fonte:')} ${escapeHTML(artigo.source)}
              </p>
            ` : ''}
          </details>

          <p class="muted" style="margin-top:12px">
            ${textoHTML('Contribuição:')} ${escapeHTML(artigo.author_name || t('Comunidade ferroviária'))}
          </p>

          ${auth.currentUser && auth.currentUser.uid === ADMIN_UID ? `
            <div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">
              <button type="button"
                class="btn btn-secondary"
                data-edit-article="${escapeHTML(artigo.id)}">
                ✏️ ${textoHTML('Editar')}
              </button>

              <button type="button"
                class="btn btn-danger"
                data-delete-article="${escapeHTML(artigo.id)}">
                🗑️ ${textoHTML('Excluir')}
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  async function carregarArtigos() {
    if (!articlesContainer) return;

    try {
      const snapshot = await db.collection('encyclopedia_articles')
        .where('status', '==', 'published')
        .get();

      const artigos = [];

      snapshot.forEach(function (doc) {
        artigos.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Se o Firestore estiver offline e não tiver documentos em seu cache,
      // preserva a última cópia completa salva pelo aplicativo.
      if (snapshot.empty && snapshot.metadata && snapshot.metadata.fromCache) {
        const copiaAnterior = JSON.parse(
          localStorage.getItem(ARTICLES_CACHE_KEY) || '[]'
        );

        if (copiaAnterior.length) {
          renderizarArtigos(copiaAnterior);
          articlesContainer.insertAdjacentHTML(
            'afterbegin',
            `<div class="notice" role="status">${textoHTML('Exibindo os artigos salvos neste aparelho. Conecte-se à internet para verificar atualizações.')}</div>`
          );
          return;
        }
      }

      artigos.sort(function (a, b) {
        return timestampValue(b.published_at) - timestampValue(a.published_at);
      });

      try {
        localStorage.setItem(ARTICLES_CACHE_KEY, JSON.stringify(artigos));
      } catch (storageError) {
        console.warn('Não foi possível atualizar a cópia local da Enciclopédia:', storageError);
      }

      renderizarArtigos(artigos);

    } catch (error) {
      console.error('Erro ao carregar artigos:', error);

      try {
        const artigosSalvos = JSON.parse(
          localStorage.getItem(ARTICLES_CACHE_KEY) || '[]'
        );

        if (artigosSalvos.length) {
          renderizarArtigos(artigosSalvos);
          articlesContainer.insertAdjacentHTML(
            'afterbegin',
            `<div class="notice" role="status">${textoHTML('Você está offline. Exibindo a última versão salva da Enciclopédia.')}</div>`
          );
          return;
        }
      } catch (cacheError) {
        console.warn('Não foi possível ler a cópia local da Enciclopédia:', cacheError);
      }

      articlesContainer.innerHTML =
        `<div class="empty">${textoHTML('Não foi possível carregar os artigos. Acesse esta área com internet para preparar a consulta offline.')}</div>`;
    }
  }

  // =====================================
  // AÇÕES ADMINISTRATIVAS DOS ARTIGOS
  // =====================================

  if (articlesContainer) {
    articlesContainer.addEventListener('click', async function (event) {
      const target = event.target.closest
        ? event.target
        : event.target.parentElement;

      if (!target || !target.closest) return;

      const editButton = target.closest('[data-edit-article]');
      const deleteButton = target.closest('[data-delete-article]');

      if (!editButton && !deleteButton) return;

      const user = auth.currentUser;

      if (!user || user.uid !== ADMIN_UID) {
        alert(t('Apenas o administrador pode realizar esta ação.'));
        return;
      }

      // EDITAR ARTIGO

      if (editButton) {
        const articleId = editButton.getAttribute('data-edit-article');

        try {
          const articleRef = db.collection('encyclopedia_articles').doc(articleId);
          const articleDoc = await articleRef.get();

          if (!articleDoc.exists) {
            alert(t('Artigo não encontrado.'));
            return;
          }

          const artigo = articleDoc.data();

          const title = prompt(t('Título do artigo:'), artigo.title || '');
          if (title === null) return;

          const category = prompt(t('Categoria:'), artigo.category || '');
          if (category === null) return;

          const summary = prompt(t('Resumo do artigo:'), artigo.summary || '');
          if (summary === null) return;

          const content = prompt(t('Conteúdo completo:'), artigo.content || '');
          if (content === null) return;

          const source = prompt(t('Fonte do artigo (opcional):'), artigo.source || '');
          if (source === null) return;

          if (
            !title.trim() ||
            !category.trim() ||
            !summary.trim() ||
            !content.trim()
          ) {
            alert(t('Título, categoria, resumo e conteúdo são obrigatórios.'));
            return;
          }

          await articleRef.update({
            title: title.trim(),
            category: category.trim(),
            summary: summary.trim(),
            content: content.trim(),
            source: source.trim(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
          });

          alert(t('Artigo atualizado com sucesso!'));

          await carregarArtigos();

        } catch (error) {
          console.error('Erro ao editar artigo:', error);
          alert(t('Não foi possível editar o artigo.'));
        }

        return;
      }

      // EXCLUIR ARTIGO

      if (deleteButton) {
        const articleId = deleteButton.getAttribute('data-delete-article');

        const confirmar = confirm(
          t('Tem certeza que deseja excluir este artigo? Esta ação não poderá ser desfeita.')
        );

        if (!confirmar) return;

        try {
          await db.collection('encyclopedia_articles')
            .doc(articleId)
            .delete();

          alert(t('Artigo excluído com sucesso!'));

          await carregarArtigos();

        } catch (error) {
          console.error('Erro ao excluir artigo:', error);
          alert(t('Não foi possível excluir o artigo.'));
        }
      }
    });
  }

  // =====================================
  // CARREGAR SUGESTÕES DO ADMINISTRADOR
  // =====================================

  async function carregarSugestoes() {
    if (!pendingContainer || auth.currentUser?.uid !== ADMIN_UID) return;

    pendingContainer.innerHTML =
      `<div class="empty">${textoHTML('Carregando sugestões...')}</div>`;

    try {
      const snapshot = await db.collection('encyclopedia_suggestions')
        .where('status', '==', 'pending')
        .get();

      if (snapshot.empty) {
        pendingContainer.innerHTML =
          `<div class="empty">${textoHTML('Não existem sugestões pendentes no momento.')}</div>`;
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

            <span class="tag">${textoHTML('PENDENTE DE APROVAÇÃO')}</span>

            <h3>${escapeHTML(item.title)}</h3>

            <p><strong>${textoHTML('Categoria:')}</strong> ${escapeHTML(t(item.category))}</p>

            <p><strong>${textoHTML('Autor:')}</strong> ${escapeHTML(item.author_name || '')}</p>

            <p><strong>${textoHTML('Resumo:')}</strong></p>
            <p>${escapeHTML(item.summary)}</p>

            <details style="margin-top:12px">
              <summary class="btn">${textoHTML('Visualizar conteúdo completo')}</summary>

              <div style="margin-top:12px; white-space:pre-wrap;">
                ${escapeHTML(item.content)}
              </div>

              ${item.source ? `
                <p class="muted" style="margin-top:12px">
                  ${textoHTML('Fonte:')} ${escapeHTML(item.source)}
                </p>
              ` : ''}
            </details>

            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:18px">

              <button
                class="btn"
                type="button"
                data-action="approve"
                data-id="${escapeHTML(item.id)}">
                ${textoHTML('Aprovar e publicar')}
              </button>

              <button
                class="btn"
                type="button"
                data-action="reject"
                data-id="${escapeHTML(item.id)}">
                ${textoHTML('Rejeitar')}
              </button>

            </div>

          </div>
        `;
      }).join('');

    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);

      pendingContainer.innerHTML =
        `<div class="empty">${textoHTML('Erro ao carregar sugestões. Verifique as permissões.')}</div>`;
    }
  }

  // =====================================
  // APROVAR E PUBLICAR ARTIGO
  // =====================================

  async function aprovarSugestao(suggestionId) {
    if (auth.currentUser?.uid !== ADMIN_UID) {
      alert(t('Apenas o administrador pode aprovar artigos.'));
      return;
    }

    try {
      const suggestionRef = db.collection('encyclopedia_suggestions')
        .doc(suggestionId);

      const suggestionDoc = await suggestionRef.get();

      if (!suggestionDoc.exists || suggestionDoc.data().status !== 'pending') {
        alert(t('Esta sugestão não está mais pendente.'));
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

      alert(t('Artigo aprovado e publicado com sucesso!'));

      await carregarSugestoes();
      await carregarArtigos();

    } catch (error) {
      console.error('Erro ao aprovar artigo:', error);
      alert(t('Não foi possível publicar o artigo. Verifique o Firebase.'));
    }
  }

  // =====================================
  // REJEITAR SUGESTÃO
  // =====================================

  async function rejeitarSugestao(suggestionId) {
    if (auth.currentUser?.uid !== ADMIN_UID) {
      alert(t('Apenas o administrador pode rejeitar sugestões.'));
      return;
    }

    const confirmar = confirm(
      t('Deseja realmente rejeitar esta sugestão?')
    );

    if (!confirmar) return;

    try {
      await db.collection('encyclopedia_suggestions')
        .doc(suggestionId)
        .update({
          status: 'rejected',
          reviewed_at: firebase.firestore.FieldValue.serverTimestamp()
        });

      alert(t('Sugestão rejeitada.'));

      await carregarSugestoes();

    } catch (error) {
      console.error('Erro ao rejeitar sugestão:', error);
      alert(t('Não foi possível rejeitar a sugestão.'));
    }
  }

  // =====================================
  // EVENTOS DOS BOTÕES ADMINISTRATIVOS
  // =====================================

  if (pendingContainer) {
    pendingContainer.addEventListener('click', async function (event) {
      const target = event.target.closest
        ? event.target
        : event.target.parentElement;

      if (!target || !target.closest) return;

      const button = target.closest('button[data-action]');

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
  // ATUALIZAR QUANDO O IDIOMA MUDAR
  // =====================================

  function atualizarIdiomaEnciclopedia() {
    carregarArtigos();

    if (auth.currentUser?.uid === ADMIN_UID) {
      carregarSugestoes();
    }

    if (form) {
      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton && !submitButton.disabled) {
        submitButton.textContent = t('Enviar sugestão para aprovação');
      }
    }
  }

  // Observa a alteração do idioma no documento.
  // Não depende de MF_T nem de eventos externos.

  const languageObserver = new MutationObserver(function (mutations) {
    const idiomaMudou = mutations.some(function (mutation) {
      return mutation.attributeName === 'lang';
    });

    if (idiomaMudou) {
      atualizarIdiomaEnciclopedia();
    }
  });

  languageObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang']
  });

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

    if (form) {
      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton && !submitButton.disabled) {
        submitButton.textContent = t('Enviar sugestão para aprovação');
      }
    }
  });


  // ==========================================
  // BIBLIOTECA FIXA DA ENCICLOPÉDIA FERROVIÁRIA
  // ==========================================

  const encyclopediaCategories = document.getElementById('encyclopediaCategories');
  const encyclopediaLibrary = document.getElementById('encyclopediaLibrary');

// Traduções da biblioteca fixa. Os artigos enviados pela comunidade não passam por este mapa.
const encyclopediaTopicTranslations = {
  locomotivas: {
    0: {
      en: {
        title: 'Locomotive models',
        description: 'Learn about the main railway locomotive models and types.',
        content: `
          <h3>Railway locomotive models</h3>
          <p>Locomotives are powered railway vehicles responsible for providing the force needed to move passenger trains, freight trains and service consists.</p>
          <p>Different locomotive models have been developed to meet transportation needs, railway characteristics and operating conditions.</p>
          <ul>
            <li><strong>Diesel-electric:</strong> use a diesel engine to drive a generator or alternator, which supplies power to the electric traction motors.</li>
            <li><strong>Diesel-hydraulic:</strong> use hydraulic transmission to transfer power from the diesel engine to the wheels.</li>
            <li><strong>Electric:</strong> receive power from an external source, such as an overhead line or third rail, to supply the traction motors.</li>
            <li><strong>Diesel-mechanical:</strong> use mechanical power transmission systems.</li>
            <li><strong>Switching locomotives:</strong> designed to move freight cars, assemble consists and perform yard operations.</li>
            <li><strong>Road locomotives:</strong> mainly intended to haul trains over railway routes.</li>
          </ul>
          <p>Models may differ in bogie configuration, number of axles, power output and tractive effort.</p>
        `
      },
      es: {
        title: 'Modelos de locomotoras',
        description: 'Conozca los principales modelos y tipos de locomotoras ferroviarias.',
        content: `
          <h3>Modelos de locomotoras ferroviarias</h3>
          <p>Las locomotoras son vehículos ferroviarios motorizados responsables de proporcionar la fuerza necesaria para mover trenes de pasajeros, de carga y composiciones de servicio.</p>
          <p>Existen diferentes modelos de locomotoras, desarrollados según las necesidades de transporte, las características del ferrocarril y las condiciones de operación.</p>
          <ul>
            <li><strong>Diésel-eléctricas:</strong> utilizan un motor diésel para accionar un generador o alternador que suministra energía a los motores eléctricos de tracción.</li>
            <li><strong>Diésel-hidráulicas:</strong> utilizan transmisión hidráulica para transferir la potencia del motor diésel a las ruedas.</li>
            <li><strong>Eléctricas:</strong> reciben energía de una fuente externa, como una catenaria o un tercer riel, para alimentar los motores de tracción.</li>
            <li><strong>Diésel-mecánicas:</strong> utilizan sistemas mecánicos de transmisión de potencia.</li>
            <li><strong>Locomotoras de maniobras:</strong> diseñadas para mover vagones, formar composiciones y realizar operaciones en patios ferroviarios.</li>
            <li><strong>Locomotoras de línea:</strong> destinadas principalmente a la conducción de trenes en recorridos ferroviarios.</li>
          </ul>
          <p>Los modelos pueden presentar diferentes configuraciones de bogies, cantidad de ejes, potencia y capacidad de tracción.</p>
        `
      }
    },
    1: {
      en: {
        title: 'Locomotive manufacturers',
        description: 'Learn about companies that have developed and manufacture railway locomotives.',
        content: `
          <h3>Locomotive manufacturers</h3>
          <p>The railway industry has manufacturers specializing in the development and production of locomotives for different applications, technologies and markets.</p>
          <p>Historically important manufacturers active in the railway sector include:</p>
          <ul>
            <li><strong>Wabtec:</strong> a company bringing together railway technologies and product lines, including locomotives and control systems.</li>
            <li><strong>Progress Rail:</strong> a manufacturer and supplier of railway solutions, including locomotives and maintenance equipment.</li>
            <li><strong>Alstom:</strong> an international company developing railway technologies and equipment.</li>
            <li><strong>Siemens Mobility:</strong> develops locomotives, signaling systems and railway transportation solutions.</li>
            <li><strong>CRRC:</strong> a Chinese industrial group with a broad presence in the manufacture of locomotives and other railway vehicles.</li>
          </ul>
          <p>Manufacturers design equipment considering factors such as power, energy efficiency, tractive effort, reliability, safety and operating conditions.</p>
        `
      },
      es: {
        title: 'Fabricantes de locomotoras',
        description: 'Conozca empresas que desarrollaron y fabrican locomotoras ferroviarias.',
        content: `
          <h3>Fabricantes de locomotoras</h3>
          <p>La industria ferroviaria cuenta con fabricantes especializados en el desarrollo y la producción de locomotoras para diferentes aplicaciones, tecnologías y mercados.</p>
          <p>Entre los fabricantes históricamente importantes y presentes en el sector ferroviario se encuentran:</p>
          <ul>
            <li><strong>Wabtec:</strong> empresa que reúne tecnologías y líneas de productos ferroviarios, incluidas locomotoras y sistemas de control.</li>
            <li><strong>Progress Rail:</strong> fabricante y proveedor de soluciones ferroviarias, incluidas locomotoras y equipos de mantenimiento.</li>
            <li><strong>Alstom:</strong> empresa con actuación internacional en el desarrollo de tecnologías y equipos ferroviarios.</li>
            <li><strong>Siemens Mobility:</strong> desarrolla locomotoras, sistemas de señalización y soluciones para el transporte ferroviario.</li>
            <li><strong>CRRC:</strong> grupo industrial chino con amplia actuación en la fabricación de locomotoras y otros vehículos ferroviarios.</li>
          </ul>
          <p>Los fabricantes desarrollan equipos considerando factores como potencia, eficiencia energética, capacidad de tracción, confiabilidad, seguridad y condiciones de operación.</p>
        `
      }
    },
    2: {
      en: {
        title: 'Locomotive technologies',
        description: 'Understand the technological systems and features used in locomotives.',
        content: `
          <h3>Locomotive technologies</h3>
          <p>Modern locomotives use different technologies to produce, transmit and control the tractive effort required to move trains.</p>
          <ul>
            <li><strong>Diesel-electric traction:</strong> uses energy produced by the diesel engine and generator or alternator set to power the traction motors.</li>
            <li><strong>Electric traction:</strong> uses electrical energy supplied by an external source.</li>
            <li><strong>Electronic control:</strong> monitors and manages the operating parameters of locomotive equipment.</li>
            <li><strong>Frequency inverters:</strong> control the power supplied to traction motors in compatible electrical systems.</li>
            <li><strong>Diagnostic systems:</strong> help identify faults and monitor equipment condition.</li>
            <li><strong>Dynamic braking:</strong> uses traction motors as generators to produce braking effort, dissipating or recovering energy depending on the system.</li>
          </ul>
          <p>Technological development aims to improve operating performance, energy efficiency, reliability and railway safety.</p>
        `
      },
      es: {
        title: 'Tecnologías de las locomotoras',
        description: 'Comprenda los sistemas y recursos tecnológicos utilizados en las locomotoras.',
        content: `
          <h3>Tecnologías de las locomotoras</h3>
          <p>Las locomotoras modernas utilizan diferentes tecnologías para producir, transmitir y controlar la fuerza de tracción necesaria para mover los trenes.</p>
          <ul>
            <li><strong>Tracción diésel-eléctrica:</strong> utiliza la energía producida por el conjunto del motor diésel y el generador o alternador para alimentar los motores de tracción.</li>
            <li><strong>Tracción eléctrica:</strong> utiliza energía eléctrica suministrada por una fuente externa.</li>
            <li><strong>Control electrónico:</strong> supervisa y gestiona los parámetros de funcionamiento de los equipos de la locomotora.</li>
            <li><strong>Variadores de frecuencia:</strong> controlan la alimentación de los motores de tracción en sistemas eléctricos compatibles.</li>
            <li><strong>Sistemas de diagnóstico:</strong> ayudan a identificar fallas y supervisar las condiciones de los equipos.</li>
            <li><strong>Frenado dinámico:</strong> utiliza los motores de tracción como generadores para producir esfuerzo de frenado, disipando o recuperando energía según el sistema.</li>
          </ul>
          <p>La evolución tecnológica busca mejorar el rendimiento operativo, la eficiencia energética, la confiabilidad y la seguridad ferroviaria.</p>
        `
      }
    },
    3: {
      en: {
        title: 'Locomotive characteristics',
        description: 'Learn about the main technical parameters and design features.',
        content: `
          <h3>Locomotive characteristics</h3>
          <p>Locomotives have technical characteristics that determine their operating capability and performance on railways.</p>
          <ul>
            <li><strong>Power:</strong> the mechanical power output of the propulsion system.</li>
            <li><strong>Tractive effort:</strong> the force a locomotive can develop to move a railway consist.</li>
            <li><strong>Weight:</strong> the total mass of the locomotive, important for determining axle load.</li>
            <li><strong>Maximum speed:</strong> the speed limit specified by the design and operating conditions.</li>
            <li><strong>Axle arrangement:</strong> the arrangement of axles and wheels in the locomotive bogies.</li>
            <li><strong>Bogies:</strong> mechanical assemblies that support, guide and allow the locomotive to travel on the rails.</li>
            <li><strong>Engine:</strong> the equipment that produces the energy used by the traction system.</li>
            <li><strong>Braking system:</strong> the set of equipment used to control speed and apply the brakes.</li>
          </ul>
          <p>These characteristics vary according to the manufacturer, model, purpose and operating conditions of the locomotive.</p>
        `
      },
      es: {
        title: 'Características de las locomotoras',
        description: 'Conozca los principales parámetros técnicos y características constructivas.',
        content: `
          <h3>Características de las locomotoras</h3>
          <p>Las locomotoras presentan características técnicas que determinan su capacidad de operación y rendimiento en los ferrocarriles.</p>
          <ul>
            <li><strong>Potencia:</strong> capacidad de producción de energía mecánica del conjunto de propulsión.</li>
            <li><strong>Fuerza de tracción:</strong> esfuerzo que la locomotora puede desarrollar para mover una composición ferroviaria.</li>
            <li><strong>Peso:</strong> masa total de la locomotora, importante para determinar la carga por eje.</li>
            <li><strong>Velocidad máxima:</strong> límite de velocidad previsto en el diseño y en las condiciones de operación.</li>
            <li><strong>Configuración de ejes:</strong> disposición de los ejes y las ruedas en los bogies de la locomotora.</li>
            <li><strong>Bogies:</strong> conjuntos mecánicos responsables del apoyo, la orientación y el desplazamiento de la locomotora sobre los rieles.</li>
            <li><strong>Motor:</strong> equipo responsable de producir la energía utilizada en el sistema de tracción.</li>
            <li><strong>Sistema de freno:</strong> conjunto de equipos utilizado para controlar la velocidad y realizar el frenado.</li>
          </ul>
          <p>Estas características varían según el fabricante, el modelo, la finalidad y las condiciones de utilización de la locomotora.</p>
        `
      }
    }
  }
};

const additionalTopicTranslations = {
  vagoes: {
    0: {
      en: {title:'Types of freight cars',description:'Learn about the main types of railway freight cars.',content:`<h3>Types of railway freight cars</h3><p>Railway freight cars are vehicles primarily designed to carry cargo. Different models are developed according to the characteristics of the goods and the needs of the operation.</p><ul><li><strong>Gondola:</strong> used to carry bulk materials such as ore, coal and other materials.</li><li><strong>Hopper:</strong> designed to carry bulk commodities, with a structure that allows gravity discharge.</li><li><strong>Boxcar:</strong> used for cargo that needs protection from weather and external exposure.</li><li><strong>Flatcar:</strong> intended for containers, steel products, timber and special loads.</li><li><strong>Tank car:</strong> used to transport liquids and certain bulk products.</li><li><strong>Heavy-duty flatcar:</strong> used to carry special, heavy or oversized loads.</li></ul><p>Car designs and configurations may vary according to the project, the cargo carried and the railway.</p>`},
      es: {title:'Tipos de vagones',description:'Conozca los principales modelos de vagones ferroviarios.',content:`<h3>Tipos de vagones ferroviarios</h3><p>Los vagones ferroviarios son vehículos destinados principalmente al transporte de cargas. Existen diferentes modelos, desarrollados según las características de la mercancía y las necesidades de la operación.</p><ul><li><strong>Góndola:</strong> utilizada para transportar cargas a granel, como mineral, carbón y otros materiales.</li><li><strong>Hopper:</strong> diseñado para transportar graneles, con una estructura que permite la descarga por gravedad.</li><li><strong>Cerrado:</strong> utilizado para cargas que necesitan protección contra la intemperie y la exposición externa.</li><li><strong>Plataforma:</strong> destinado a contenedores, productos siderúrgicos, madera y cargas especiales.</li><li><strong>Tanque:</strong> utilizado para transportar líquidos y determinados productos a granel.</li><li><strong>Plataforma reforzada:</strong> empleada en el transporte de cargas especiales, pesadas o de grandes dimensiones.</li></ul><p>Los modelos y sus configuraciones pueden variar según el diseño, la carga transportada y el ferrocarril.</p>`}
    },
    1: {
      en: {title:'Freight car applications',description:'Understand how each car type serves different kinds of cargo.',content:`<h3>Freight car applications</h3><p>Choosing a freight car depends on the characteristics of the cargo, the loading and unloading method, and the condition of the railway infrastructure.</p><ul><li>Ores and coal: gondola and hopper cars, depending on the discharge system.</li><li>Grain: hopper cars designed for agricultural products.</li><li>Containers: flatcars and intermodal cars.</li><li>Fuel and liquids: tank cars suitable for the product being carried.</li><li>Manufactured goods: boxcars, flatcars or special-purpose cars.</li><li>Oversized loads: heavy-duty flatcars and special equipment.</li></ul>`},
      es: {title:'Aplicaciones de los vagones',description:'Comprenda cómo cada modelo atiende diferentes tipos de carga.',content:`<h3>Aplicaciones de los vagones</h3><p>La elección del vagón depende de las características de la carga, del método de carga y descarga y de las condiciones de la infraestructura ferroviaria.</p><ul><li>Minerales y carbón: vagones góndola y hopper, según el sistema de descarga.</li><li>Granos: vagones hopper específicos para productos agrícolas.</li><li>Contenedores: vagones plataforma y modelos intermodales.</li><li>Combustibles y líquidos: vagones tanque adecuados al producto transportado.</li><li>Productos industrializados: vagones cerrados, plataformas o modelos especiales.</li><li>Cargas de grandes dimensiones: vagones plataforma reforzada y equipos especiales.</li></ul>`}
    },
    2: {
      en: {title:'Structural features',description:'Learn about the main components that make up a freight car.',content:`<h3>Structural features of freight cars</h3><p>Freight cars have different structural features, determined by their purpose and the cargo for which they were designed.</p><ul><li><strong>Frame:</strong> the structural assembly that withstands operating forces and the transported load.</li><li><strong>Bogies:</strong> assemblies that support the car and allow it to move along the rails.</li><li><strong>Wheels and axles:</strong> components responsible for contact with the track and vehicle movement.</li><li><strong>Couplers:</strong> devices used to connect railway vehicles.</li><li><strong>Brake system:</strong> components responsible for braking the car.</li><li><strong>Body or load structure:</strong> the space used to contain the goods.</li></ul>`},
      es: {title:'Características constructivas',description:'Conozca los principales elementos que componen un vagón.',content:`<h3>Características constructivas de los vagones</h3><p>Los vagones presentan diferentes características constructivas, determinadas por su finalidad y por la carga para la que fueron diseñados.</p><ul><li><strong>Estructura:</strong> conjunto estructural que soporta los esfuerzos y la carga transportada.</li><li><strong>Bogies:</strong> conjuntos que sostienen el vagón y permiten su desplazamiento sobre los rieles.</li><li><strong>Ruedas y ejes:</strong> componentes responsables del contacto con la vía y del desplazamiento.</li><li><strong>Enganches:</strong> dispositivos utilizados para conectar los vehículos ferroviarios.</li><li><strong>Sistema de freno:</strong> conjunto de componentes responsable del frenado del vagón.</li><li><strong>Caja o estructura de carga:</strong> espacio destinado al acondicionamiento de la mercancía.</li></ul>`}
    },
    3: {
      en: {title:'Identification and numbering',description:'Learn how freight cars are identified and classified.',content:`<h3>Freight car identification and numbering</h3><p>Freight cars carry identification markings that allow them to be recognized and tracked operationally.</p><p>Markings may include information such as the car number, owner, capacity, tare weight, load limit and vehicle-specific characteristics.</p><p>Identification standards may vary according to the railway system and the regulations adopted.</p>`},
      es: {title:'Identificación y numeración',description:'Sepa cómo se identifican y clasifican los vagones.',content:`<h3>Identificación y numeración de los vagones</h3><p>Los vagones tienen identificaciones que permiten su reconocimiento y control operativo.</p><p>Las inscripciones pueden presentar información como número, propietario, capacidad, tara, carga máxima y características específicas del vehículo.</p><p>Los estándares de identificación pueden variar según el sistema ferroviario y las normas adoptadas.</p>`}
    },
    4: {
      en: {title:'Tare weight, load limit and capacity',description:'Understand freight car weight and capacity concepts.',content:`<h3>Tare weight, load limit and capacity</h3><ul><li><strong>Tare weight:</strong> the weight of an empty freight car.</li><li><strong>Load limit:</strong> the cargo capacity specified for the car, according to its technical specifications.</li><li><strong>Gross weight:</strong> the tare weight plus the weight of the cargo carried.</li><li><strong>Volumetric capacity:</strong> the volume available to contain the cargo.</li></ul><p>Loading must comply with the car's technical limits and the restrictions applicable to railway operations.</p>`},
      es: {title:'Tara, carga máxima y capacidad',description:'Comprenda los conceptos de peso y capacidad de los vagones.',content:`<h3>Tara, carga máxima y capacidad</h3><ul><li><strong>Tara:</strong> peso del vagón vacío.</li><li><strong>Carga máxima:</strong> capacidad de carga indicada para el vagón, según sus especificaciones.</li><li><strong>Peso bruto:</strong> suma de la tara y el peso de la carga transportada.</li><li><strong>Capacidad volumétrica:</strong> volumen disponible para acondicionar la carga.</li></ul><p>La carga debe respetar los límites técnicos del vagón y las restricciones aplicables a la operación ferroviaria.</p>`}
    },
    5: {
      en: {title:'Bogie assemblies and components',description:'Learn about the assemblies responsible for support and movement.',content:`<h3>Freight car bogies and components</h3><p>A bogie is a mechanical assembly installed beneath a freight car. It supports part of the car body and allows the vehicle to negotiate railway curves.</p><p>Its components include wheels, axles, bearings, bearing housings, suspension and the bogie frame.</p><p>The design and configuration of these components vary according to the freight car model.</p>`},
      es: {title:'Bogies y componentes',description:'Conozca los conjuntos responsables del apoyo y desplazamiento.',content:`<h3>Bogies y componentes de los vagones</h3><p>El bogie es un conjunto mecánico instalado debajo del vagón. Sostiene parte de la estructura y permite que el vehículo circule por las curvas del ferrocarril.</p><p>Entre sus componentes se encuentran ruedas, ejes, rodamientos, cajas de rodamientos, suspensión y estructura del bogie.</p><p>El diseño y la configuración de estos componentes varían según el modelo del vagón.</p>`}
    },
    6: {
      en: {title:'Brake systems',description:'Learn about the main elements of the braking system.',content:`<h3>Freight car brake systems</h3><p>The brake system is essential for controlling speed and bringing railway vehicles to a stop.</p><p>Many freight cars use pneumatic brake systems, made up of components such as an air reservoir, control valve, brake cylinder and force-transmission components that apply the brake shoes or other braking devices.</p><p>Inspection equipment and procedures depend on the freight car design and the railway's operating rules.</p>`},
      es: {title:'Sistemas de freno',description:'Conozca los principales elementos del sistema de frenado.',content:`<h3>Sistemas de freno de los vagones</h3><p>El sistema de freno es fundamental para controlar la velocidad y permitir la detención de los vehículos ferroviarios.</p><p>En muchos vagones de carga se utilizan sistemas de freno neumático, compuestos por elementos como depósito de aire, válvula de control, cilindro de freno y componentes que transmiten la fuerza a las zapatas u otros dispositivos de frenado.</p><p>Los equipos y procedimientos de inspección dependen del diseño del vagón y de las reglas operativas del ferrocarril.</p>`}
    },
    7: {
      en: {title:'Inspection and maintenance',description:'Understand the importance of freight car condition and maintenance.',content:`<h3>Freight car inspection and maintenance</h3><p>Freight car inspections contribute to the safety and reliability of railway transportation.</p><p>According to applicable procedures, items such as wheels, bogies, couplers, car structure, brake system and the vehicle's overall condition may be checked.</p><p>Freight cars with defects or abnormal conditions must be handled in accordance with the standards and procedures of the responsible railway.</p>`},
      es: {title:'Inspección y conservación',description:'Comprenda la importancia del mantenimiento de los vagones.',content:`<h3>Inspección y conservación de los vagones</h3><p>La inspección de los vagones contribuye a la seguridad y confiabilidad del transporte ferroviario.</p><p>Según los procedimientos aplicables, pueden revisarse ruedas, bogies, enganches, estructura, sistema de freno y condiciones generales del vehículo.</p><p>Los vagones con anomalías deben recibir el tratamiento previsto en las normas y procedimientos del ferrocarril responsable.</p>`}
    },
    8: {
      en: {title:'Gondola freight car',description:'Characteristics, applications, structure and operation of the gondola car.',content:`<h3>Gondola freight car — Characteristics, applications and operation</h3><h4>1. What is a gondola car?</h4><p>A gondola car is a railway vehicle mainly intended for transporting solid cargo. Its most distinctive feature is an open-top body, with a floor and side walls to contain the materials being carried.</p><p>It is widely used in mining, steelmaking and bulk-material transportation.</p><h4>2. Main applications</h4><p>Materials carried include:</p><ul><li>Iron ore;</li><li>Coal;</li><li>Coke;</li><li>Crushed stone and construction materials;</li><li>Metal scrap;</li><li>Steel products.</li></ul><h4>3. Structural features</h4><ul><li><strong>Metal frame:</strong> withstands operating forces and cargo weight.</li><li><strong>Floor:</strong> supports the cargo.</li><li><strong>Side walls:</strong> define the loading space.</li><li><strong>End walls:</strong> structures located at the ends of the car.</li><li><strong>Bogies:</strong> assemblies responsible for support and movement.</li><li><strong>Couplers:</strong> connect railway vehicles.</li><li><strong>Brake system:</strong> provides braking for the car.</li></ul><h4>4. Loading and unloading</h4><p>Loading may be carried out using conveyor belts, loaders, excavators and other equipment.</p><p>Unloading depends on the car design and the facility used. Many models require external equipment to remove the cargo. Not every gondola car has automatic unloading.</p><h4>5. Advantages</h4><ul><li>Versatility in transporting solid cargo;</li><li>Ability to carry large volumes;</li><li>Compatibility with different loading systems;</li><li>Wide use in industrial and mining operations.</li></ul><h4>6. Limitations and precautions</h4><p>Because it has an open body, the cargo may be exposed to weather conditions. Depending on the material, precautions may be needed to prevent loss, dispersion or contamination.</p><p>Loading must comply with weight limits, proper load distribution and the vehicle's technical specifications.</p><h4>7. Inspection and maintenance</h4><p>Inspections required by railway procedures may include checks of:</p><ul><li>Wheels and axles;</li><li>Bogies and suspension;</li><li>Couplers and draft gear;</li><li>Frame, floor and side walls;</li><li>Brake system components;</li><li>Overall condition and maintenance.</li></ul><p>Any abnormal condition must be handled according to the safety and maintenance procedures of the responsible railway.</p><h4>8. Importance to railway transportation</h4><p>The gondola car is highly important for transporting mineral and industrial products. Its structure allows large quantities of solid materials to be moved, contributing to railway logistics efficiency.</p><p><strong>Summary:</strong> the gondola car is one of the main types used to transport solid freight, standing out for its open structure, versatility and ability to meet different logistics needs.</p>`},
      es: {title:'Vagón góndola',description:'Características, aplicaciones, estructura y funcionamiento del vagón góndola.',content:`<h3>Vagón góndola — Características, aplicaciones y funcionamiento</h3><h4>1. ¿Qué es un vagón góndola?</h4><p>El vagón góndola es un vehículo ferroviario destinado principalmente al transporte de cargas sólidas. Su característica más destacada es tener una estructura abierta en la parte superior, con piso y laterales para contener los materiales transportados.</p><p>Se utiliza ampliamente en operaciones mineras, siderúrgicas y en el transporte de materiales a granel.</p><h4>2. Principales aplicaciones</h4><p>Entre los materiales transportados se encuentran:</p><ul><li>Mineral de hierro;</li><li>Carbón mineral;</li><li>Coque;</li><li>Piedra triturada y materiales de construcción;</li><li>Chatarra metálica;</li><li>Productos siderúrgicos.</li></ul><h4>3. Características constructivas</h4><ul><li><strong>Estructura metálica:</strong> soporta los esfuerzos de la operación y el peso de la carga.</li><li><strong>Piso:</strong> superficie de apoyo de la carga.</li><li><strong>Laterales:</strong> delimitan el espacio de carga.</li><li><strong>Testeros:</strong> estructuras ubicadas en los extremos del vagón.</li><li><strong>Bogies:</strong> conjuntos responsables del apoyo y desplazamiento.</li><li><strong>Enganches:</strong> permiten conectar los vehículos ferroviarios.</li><li><strong>Sistema de freno:</strong> responsable del frenado del vagón.</li></ul><h4>4. Carga y descarga</h4><p>La carga puede realizarse mediante cintas transportadoras, cargadores, excavadoras y otros equipos.</p><p>La descarga depende del diseño del vagón y de la instalación utilizada. Muchos modelos necesitan equipos externos para retirar la carga. No todos los vagones góndola tienen descarga automática.</p><h4>5. Ventajas</h4><ul><li>Versatilidad para transportar cargas sólidas;</li><li>Posibilidad de transportar grandes volúmenes;</li><li>Compatibilidad con diferentes sistemas de carga;</li><li>Amplio uso en operaciones industriales y mineras.</li></ul><h4>6. Limitaciones y cuidados</h4><p>Debido a su estructura abierta, la carga puede quedar expuesta a las condiciones climáticas. Según el material, pueden ser necesarios cuidados para evitar pérdidas, dispersión o contaminación.</p><p>La carga debe respetar los límites de peso, la distribución adecuada y las especificaciones técnicas del vehículo.</p><h4>7. Inspección y conservación</h4><p>En las inspecciones previstas por los procedimientos ferroviarios pueden verificarse:</p><ul><li>Ruedas y ejes;</li><li>Bogies y suspensión;</li><li>Enganches y aparatos de choque y tracción;</li><li>Estructura, piso y laterales;</li><li>Componentes del sistema de freno;</li><li>Condiciones generales de conservación.</li></ul><p>Cualquier anomalía debe recibir el tratamiento previsto en los procedimientos de seguridad y mantenimiento del ferrocarril responsable.</p><h4>8. Importancia para el transporte ferroviario</h4><p>El vagón góndola tiene gran importancia en el transporte de productos minerales e industriales. Su estructura permite mover grandes cantidades de materiales sólidos y contribuye a la eficiencia logística ferroviaria.</p><p><strong>Resumen:</strong> el vagón góndola es uno de los principales modelos utilizados para transportar cargas sólidas, y se destaca por su estructura abierta, versatilidad y capacidad para atender distintas necesidades logísticas.</p>`}
    }
  },
  componentes: {
    0: {
      en:{title:'Wheelsets, wheels and axles',description:'Learn about the components responsible for railway vehicle contact with the track and movement.',content:`<h3>Railway wheelsets, wheels and axles</h3><p>Wheelsets are essential railway vehicle assemblies, responsible for supporting the vehicle and allowing it to move along the rails. A conventional wheelset mainly consists of two railway wheels rigidly mounted on a common axle, forming an integrated assembly.</p><ul><li><strong>Wheels:</strong> components that contact the rails and guide vehicle movement.</li><li><strong>Axles:</strong> elements connecting the wheels and transmitting mechanical forces.</li><li><strong>Flanges:</strong> side portions of the wheels that help guide the vehicle along the track.</li><li><strong>Bearings:</strong> components that allow the axles to rotate while reducing friction.</li><li><strong>Bearing housings:</strong> enclosures that protect and support the bearing assemblies.</li></ul><p>Wheel and axle condition must be monitored through inspections and specific technical procedures.</p>`},
      es:{title:'Ejes montados, ruedas y ejes',description:'Conozca los componentes responsables del contacto y desplazamiento de los vehículos ferroviarios.',content:`<h3>Ejes montados, ruedas y ejes ferroviarios</h3><p>Los ejes montados son conjuntos fundamentales de los vehículos ferroviarios, responsables del apoyo y desplazamiento sobre los rieles. Un eje montado convencional está compuesto principalmente por dos ruedas ferroviarias montadas rígidamente en un eje común, formando un conjunto integrado.</p><ul><li><strong>Ruedas:</strong> componentes que establecen contacto con los rieles y orientan el desplazamiento del vehículo.</li><li><strong>Ejes:</strong> elementos que conectan las ruedas y transmiten los esfuerzos mecánicos.</li><li><strong>Pestañas:</strong> partes laterales de las ruedas que ayudan a guiar el vehículo sobre la vía.</li><li><strong>Rodamientos:</strong> componentes que permiten la rotación de los ejes reduciendo la fricción.</li><li><strong>Cajas de rodamientos:</strong> alojamientos que protegen y sostienen los conjuntos de rodamientos.</li></ul><p>El estado de las ruedas y los ejes debe controlarse mediante inspecciones y procedimientos técnicos específicos.</p>`}
    },
    1: {
      en:{title:'Couplers and draft gear',description:'Understand the devices used to connect railway vehicles.',content:`<h3>Couplers and draft gear</h3><p>Couplers are devices used to connect locomotives and freight cars, allowing railway consists to be assembled. These components transmit tensile and compressive forces while trains are moving.</p><ul><li><strong>Coupler:</strong> device responsible for connecting railway vehicles.</li><li><strong>Draft gear:</strong> assembly designed to absorb and transmit longitudinal forces.</li><li><strong>Knuckle:</strong> component found in certain automatic coupler designs that performs the coupling action.</li><li><strong>Pivot pin:</strong> component used in certain coupler assemblies.</li><li><strong>Draft gear unit:</strong> mechanism that absorbs some impacts and compressive forces.</li></ul><p>Inspecting these components is important for the safety of train assembly and movement.</p>`},
      es:{title:'Enganches y aparatos de choque y tracción',description:'Comprenda los dispositivos utilizados para conectar los vehículos ferroviarios.',content:`<h3>Enganches y aparatos de choque y tracción</h3><p>Los enganches son dispositivos utilizados para conectar locomotoras y vagones, permitiendo formar composiciones ferroviarias. Estos equipos transmiten esfuerzos de tracción y compresión durante el movimiento de los trenes.</p><ul><li><strong>Enganche:</strong> dispositivo responsable de la conexión entre vehículos ferroviarios.</li><li><strong>Aparato de choque y tracción:</strong> conjunto destinado a absorber y transmitir esfuerzos longitudinales.</li><li><strong>Mandíbula:</strong> componente presente en determinados modelos de enganches automáticos, responsable del acoplamiento.</li><li><strong>Perno de articulación:</strong> elemento utilizado en determinados conjuntos de enganche.</li><li><strong>Aparato de choque:</strong> mecanismo que absorbe parte de los impactos y esfuerzos de compresión.</li></ul><p>La inspección de estos componentes es importante para la seguridad de la formación y el movimiento de los trenes.</p>`}
    },
    2: {
      en:{title:'Railway braking systems',description:'Learn about the main braking equipment and operating principles.',content:`<h3>Railway braking systems</h3><p>Railway braking systems control speed, reduce movement and bring vehicles and train consists to a stop.</p><p>In pneumatic systems used on many railway vehicles, compressed air is used to command brake application and release.</p><ul><li><strong>Compressor:</strong> equipment that produces compressed air.</li><li><strong>Reservoirs:</strong> store the air used by the braking system.</li><li><strong>Control valve:</strong> controls system operation according to pressure variations.</li><li><strong>Brake cylinder:</strong> converts air pressure into mechanical force.</li><li><strong>Brake rigging:</strong> a set of levers and linkages that transmits braking force.</li><li><strong>Brake shoes:</strong> components that act by friction against wheel braking surfaces in systems using this arrangement.</li></ul><p>Different braking technologies exist, including pneumatic, dynamic and electro-pneumatic brakes. Maintenance and inspection must follow the applicable technical specifications and operating procedures.</p>`},
      es:{title:'Sistemas de freno ferroviario',description:'Conozca los principales equipos y principios de funcionamiento del frenado.',content:`<h3>Sistemas de freno ferroviario</h3><p>Los sistemas de freno ferroviario son responsables de controlar la velocidad, reducir el movimiento y permitir la detención de los vehículos y composiciones.</p><p>En los sistemas neumáticos utilizados en muchos vehículos ferroviarios, el aire comprimido se emplea para comandar la aplicación y liberación de los frenos.</p><ul><li><strong>Compresor:</strong> equipo responsable de producir aire comprimido.</li><li><strong>Depósitos:</strong> almacenan el aire utilizado en el sistema de frenado.</li><li><strong>Válvula de control:</strong> controla el funcionamiento del sistema según las variaciones de presión.</li><li><strong>Cilindro de freno:</strong> transforma la presión del aire en fuerza mecánica.</li><li><strong>Timonería:</strong> conjunto de palancas y articulaciones que transmite la fuerza de frenado.</li><li><strong>Zapatas de freno:</strong> componentes que actúan por fricción contra las superficies de frenado de las ruedas, en los sistemas que utilizan esta configuración.</li></ul><p>Existen diferentes tecnologías de frenado, incluidos los frenos neumático, dinámico y electroneumático. El mantenimiento y la inspección deben seguir las especificaciones técnicas y los procedimientos operativos aplicables.</p>`}
    },
    3: {
      en:{title:'Rails, sleepers and fastenings',description:'Learn about the main elements that make up railway track structure.',content:`<h3>Railway rails, sleepers and fastenings</h3><p>Railway track is made up of structural elements that support and guide railway vehicles as they travel.</p><ul><li><strong>Rails:</strong> metal profiles that form the wheel running surface and guide vehicles.</li><li><strong>Sleepers:</strong> elements that support the rails and help maintain track gauge.</li><li><strong>Fastenings:</strong> components that secure the rails to the sleepers.</li><li><strong>Base plates:</strong> elements used in certain configurations to distribute forces and support the rails.</li><li><strong>Ballast:</strong> a layer of granular material that provides support, stability and load distribution for the track.</li><li><strong>Rail joints:</strong> devices used to connect rail sections in certain track configurations.</li></ul><p>Maintaining these elements is essential for the stability, geometry and safety of railway infrastructure.</p>`},
      es:{title:'Rieles, durmientes y fijaciones',description:'Conozca los principales elementos que forman la estructura de la vía permanente.',content:`<h3>Rieles, durmientes y fijaciones ferroviarias</h3><p>La vía permanente está formada por elementos estructurales que sostienen y guían los vehículos ferroviarios durante su circulación.</p><ul><li><strong>Rieles:</strong> perfiles metálicos que forman la superficie de rodadura de las ruedas y guían los vehículos.</li><li><strong>Durmientes:</strong> elementos que sostienen los rieles y ayudan a mantener el ancho de vía.</li><li><strong>Fijaciones:</strong> componentes responsables de fijar los rieles a los durmientes.</li><li><strong>Placas de apoyo:</strong> elementos utilizados en determinadas configuraciones para distribuir esfuerzos y apoyar los rieles.</li><li><strong>Balasto:</strong> capa de material granular que proporciona apoyo, estabilidad y distribución de las cargas de la vía.</li><li><strong>Juntas ferroviarias:</strong> dispositivos utilizados para unir segmentos de rieles en determinadas configuraciones de vía.</li></ul><p>La conservación de estos elementos es esencial para la estabilidad, geometría y seguridad de la infraestructura ferroviaria.</p>`}
    }
  },
  sinalizacao: {
    0:{en:{title:'Purpose of railway signaling',description:'Understand how signaling organizes and protects railway movements.',content:`<h3>Purpose of railway signaling</h3><p>Railway signaling brings together systems, equipment, indications and procedures used to organize train movements and guide the professionals involved in operations.</p><p>Its main purpose is to contribute to safe railway traffic by controlling movements, speeds, track occupancy and conditions for movement authority.</p><ul><li><strong>Safety:</strong> helps prevent conflicts between railway movements.</li><li><strong>Organization:</strong> establishes conditions for train movements.</li><li><strong>Guidance:</strong> transmits information to drivers and operating teams.</li><li><strong>Control:</strong> makes it possible to monitor and control traffic conditions.</li></ul><p>Specific systems and procedures vary according to the railway and its operating rules.</p>`},es:{title:'Finalidad de la señalización ferroviaria',description:'Comprenda cómo la señalización organiza y protege la circulación ferroviaria.',content:`<h3>Finalidad de la señalización ferroviaria</h3><p>La señalización ferroviaria reúne sistemas, equipos, indicaciones y procedimientos utilizados para organizar la circulación de los trenes y orientar a los profesionales involucrados en la operación.</p><p>Su finalidad principal es contribuir a la seguridad de la circulación, controlando movimientos, velocidades, ocupación de tramos y condiciones de autorización de paso.</p><ul><li><strong>Seguridad:</strong> ayuda a prevenir conflictos entre movimientos ferroviarios.</li><li><strong>Organización:</strong> establece condiciones para la circulación de los trenes.</li><li><strong>Orientación:</strong> transmite información a los maquinistas y equipos operativos.</li><li><strong>Control:</strong> permite supervisar y controlar las condiciones de circulación.</li></ul><p>Los sistemas y procedimientos específicos varían según el ferrocarril y sus normas operativas.</p>`}},
    1:{en:{title:'Types of railway signals',description:'Learn about the main ways information is conveyed on the railway.',content:`<h3>Types of railway signals</h3><p>Railway signals may be presented in different ways, depending on the technology used and the railway's traffic rules.</p><ul><li><strong>Light signals:</strong> use illuminated indications to convey information.</li><li><strong>Fixed signals:</strong> installed along the track to guide movements.</li><li><strong>Hand signals:</strong> used by authorized personnel in specific situations.</li><li><strong>Cab signaling:</strong> displays information directly in the driving cab.</li><li><strong>Communication-based signaling:</strong> transmits authorities and instructions through communication systems specified in procedures.</li></ul><p>All signals must be interpreted strictly according to the applicable operating regulations.</p>`},es:{title:'Tipos de señales ferroviarias',description:'Conozca las principales formas de transmitir indicaciones en el ferrocarril.',content:`<h3>Tipos de señales ferroviarias</h3><p>Las señales ferroviarias pueden presentarse de diferentes maneras, según la tecnología empleada y las reglas de circulación del ferrocarril.</p><ul><li><strong>Señales luminosas:</strong> utilizan indicaciones luminosas para transmitir información.</li><li><strong>Señales fijas:</strong> instaladas a lo largo de la vía para orientar los movimientos.</li><li><strong>Señales manuales:</strong> utilizadas por profesionales autorizados en determinadas situaciones.</li><li><strong>Señalización de cabina:</strong> presenta información directamente en el puesto de conducción.</li><li><strong>Señalización por comunicación:</strong> transmite autorizaciones e instrucciones mediante sistemas de comunicación previstos en los procedimientos.</li></ul><p>La interpretación de cualquier señal debe seguir rigurosamente la reglamentación operativa aplicable.</p>`}},
    2:{en:{title:'Light signaling',description:'Understand the role of light signals used in railway movements.',content:`<h3>Railway light signaling</h3><p>Light signaling uses illuminated aspects and visual indications to convey information about traffic conditions.</p><p>These devices may be installed at strategic railway locations, such as station approaches, yard entrances, junctions and block sections.</p><ul><li><strong>Light indications:</strong> represent conditions or commands defined by the system.</li><li><strong>Visibility:</strong> indications must be identifiable under the operating conditions for which they are intended.</li><li><strong>Positioning:</strong> signals must be associated with the locations and movements for which they were designed.</li><li><strong>Reliability:</strong> depends on maintenance and technical checks.</li></ul><p>Colors and their meanings must be interpreted according to the railway's signaling regulations, without generalizing across different systems.</p>`},es:{title:'Señalización luminosa',description:'Comprenda la función de las señales luminosas utilizadas en la circulación.',content:`<h3>Señalización luminosa ferroviaria</h3><p>La señalización luminosa utiliza focos de luz e indicaciones visuales para transmitir información relacionada con las condiciones de circulación.</p><p>Estos equipos pueden instalarse en lugares estratégicos del ferrocarril, como aproximaciones a estaciones, entradas de patios, empalmes y tramos de bloqueo.</p><ul><li><strong>Indicaciones luminosas:</strong> representan condiciones o comandos definidos por el sistema.</li><li><strong>Visibilidad:</strong> deben permitir identificar las indicaciones en las condiciones previstas de operación.</li><li><strong>Ubicación:</strong> deben estar asociadas a los lugares y movimientos para los que fueron diseñadas.</li><li><strong>Confiabilidad:</strong> depende del mantenimiento y de las verificaciones técnicas.</li></ul><p>Los colores y sus significados deben interpretarse según el reglamento de señalización del ferrocarril, sin generalizar entre sistemas diferentes.</p>`}},
    3:{en:{title:'Signs and fixed signals',description:'Learn about signaling devices installed along the track.',content:`<h3>Signs and fixed signals</h3><p>Signs and fixed signals are installed along railway infrastructure to convey information to professionals responsible for train driving and operations.</p><ul><li><strong>Speed boards:</strong> indicate speed limits or conditions according to regulations.</li><li><strong>Location signs:</strong> help identify railway points and reference locations.</li><li><strong>Warning signs:</strong> alert staff to track conditions or characteristics.</li><li><strong>Railway markers:</strong> identify references used in operations and maintenance.</li><li><strong>Yard signaling:</strong> guides movements and specific conditions within facilities.</li></ul><p>The location, appearance and interpretation of these devices follow standards defined by each railway system.</p>`},es:{title:'Placas y señales fijas',description:'Conozca los elementos de señalización instalados a lo largo de la vía.',content:`<h3>Placas y señales fijas</h3><p>Las placas y señales fijas son elementos instalados a lo largo de la infraestructura ferroviaria para transmitir información a los profesionales responsables de la conducción y operación de los trenes.</p><ul><li><strong>Placas de velocidad:</strong> indican límites o condiciones de velocidad según la reglamentación.</li><li><strong>Placas de ubicación:</strong> ayudan a identificar puntos y referencias del ferrocarril.</li><li><strong>Señales de advertencia:</strong> alertan sobre condiciones o características de la vía.</li><li><strong>Marcas ferroviarias:</strong> identifican referencias utilizadas en la operación y el mantenimiento.</li><li><strong>Señalización de patio:</strong> orienta movimientos y condiciones específicas de las instalaciones.</li></ul><p>La ubicación, apariencia e interpretación de estos elementos siguen los estándares definidos por cada sistema ferroviario.</p>`}},
    4:{en:{title:'Cab signaling systems',description:'Learn how operating information can be displayed inside the locomotive.',content:`<h3>Cab signaling systems</h3><p>Cab signaling displays information related to train movements directly in the locomotive driving environment.</p><p>Depending on the technology used, the system may provide movement authority conditions, speed limits, approaching restrictions and other operating information.</p><ul><li><strong>Operator interface:</strong> displays information to the driver.</li><li><strong>Speed supervision:</strong> may monitor speed in relation to authorized conditions.</li><li><strong>Infrastructure communication:</strong> receives information from external equipment and systems.</li><li><strong>Alerts:</strong> indicate situations requiring the operator's attention.</li></ul><p>Available features depend on the installed system and its operating configuration.</p>`},es:{title:'Sistemas de señalización en cabina',description:'Sepa cómo se presenta la información operativa dentro de la locomotora.',content:`<h3>Sistemas de señalización en cabina</h3><p>La señalización de cabina presenta información relacionada con la circulación directamente en el entorno de conducción de la locomotora.</p><p>Según la tecnología utilizada, el sistema puede informar condiciones de autorización, límites de velocidad, aproximación a restricciones y otras condiciones operativas.</p><ul><li><strong>Interfaz de operación:</strong> presenta información al maquinista.</li><li><strong>Supervisión de velocidad:</strong> puede controlar la velocidad en relación con las condiciones autorizadas.</li><li><strong>Comunicación con la infraestructura:</strong> recibe información de equipos y sistemas externos.</li><li><strong>Alertas:</strong> informa situaciones que requieren la atención del operador.</li></ul><p>Los recursos disponibles dependen del sistema instalado y de su configuración operativa.</p>`}},
    5:{en:{title:'Track circuits and axle counters',description:'Understand how these devices detect occupancy of railway sections.',content:`<h3>Track circuits and axle counters</h3><p>Track circuits and axle counters are technologies used to detect the presence of railway vehicles in specific sections.</p><ul><li><strong>Track circuit:</strong> uses electrical characteristics of the circuit formed by the rails to detect occupancy.</li><li><strong>Axle counter:</strong> uses sensors installed on the track to register axle passages.</li><li><strong>Occupancy detection:</strong> provides important information to signaling and control systems.</li><li><strong>Section clearance:</strong> takes place according to the system's logic and safety criteria.</li></ul><p>These resources contribute to traffic control and help prevent conflicts between railway movements.</p>`},es:{title:'Circuitos de vía y contadores de ejes',description:'Comprenda cómo estos equipos identifican la ocupación de tramos ferroviarios.',content:`<h3>Circuitos de vía y contadores de ejes</h3><p>Los circuitos de vía y los contadores de ejes son tecnologías utilizadas para detectar la presencia de vehículos ferroviarios en determinados tramos.</p><ul><li><strong>Circuito de vía:</strong> utiliza las características eléctricas del circuito formado por los rieles para detectar la ocupación.</li><li><strong>Contador de ejes:</strong> utiliza sensores instalados en la vía para registrar el paso de los ejes.</li><li><strong>Detección de ocupación:</strong> proporciona información importante a los sistemas de señalización y control.</li><li><strong>Liberación del tramo:</strong> ocurre según la lógica y los criterios de seguridad del sistema.</li></ul><p>Estos recursos contribuyen al control de la circulación y a la prevención de conflictos entre movimientos ferroviarios.</p>`}},
    6:{en:{title:'Railway interlocking',description:'Learn about the system that coordinates routes, switches and signals.',content:`<h3>Railway interlocking</h3><p>Interlocking is a safety system that coordinates signaling elements and switches to prevent incompatible movement combinations.</p><ul><li><strong>Route control:</strong> checks the conditions required to establish a route.</li><li><strong>Switch control:</strong> supervises the position of the switches involved in the route.</li><li><strong>Movement protection:</strong> prevents the authorization of incompatible routes according to the safety logic.</li><li><strong>Integration:</strong> may communicate with signals, occupancy detectors and control centers.</li></ul><p>Interlocking is essential in areas with crossings, turnouts, yards and stations.</p>`},es:{title:'Enclavamiento ferroviario',description:'Conozca el sistema que coordina rutas, aparatos de vía y señales.',content:`<h3>Enclavamiento ferroviario</h3><p>El enclavamiento es un sistema de seguridad que coordina los elementos de señalización y los aparatos de cambio de vía para impedir combinaciones incompatibles de movimientos.</p><ul><li><strong>Control de rutas:</strong> verifica las condiciones necesarias para establecer un itinerario.</li><li><strong>Control de aparatos de vía:</strong> supervisa la posición de los aparatos de cambio de vía involucrados en la ruta.</li><li><strong>Protección de movimientos:</strong> evita la autorización de rutas incompatibles, según la lógica de seguridad.</li><li><strong>Integración:</strong> puede comunicarse con señales, detectores de ocupación y centros de control.</li></ul><p>El enclavamiento es fundamental en zonas con cruces, desvíos, patios y estaciones.</p>`}},
    7:{en:{title:'Signaling failures and abnormal conditions',description:'Understand the importance of identifying and reporting system failures.',content:`<h3>Signaling failures and abnormal conditions</h3><p>Signaling failures may affect system availability and change normal railway traffic conditions.</p><ul><li><strong>Indication failure:</strong> occurs when a signal displays missing or unexpected information.</li><li><strong>Detection failure:</strong> may affect the identification of occupancy in a section.</li><li><strong>Communication failure:</strong> may interrupt information exchange between equipment and control centers.</li><li><strong>Power supply failure:</strong> may affect device operation.</li></ul><p>Any abnormal condition must be reported immediately through the designated channels. Train movements must follow the railway's official safety measures and procedures.</p><p>No professional should assume that conditions are safe or improvise movement authority when a failure occurs.</p>`},es:{title:'Fallas y anomalías en la señalización',description:'Comprenda la importancia de identificar y comunicar fallas en los sistemas.',content:`<h3>Fallas y anomalías en la señalización</h3><p>Las fallas de señalización pueden comprometer la disponibilidad de los sistemas y modificar las condiciones normales de circulación ferroviaria.</p><ul><li><strong>Falla de indicación:</strong> ocurre cuando una señal presenta información ausente o incompatible con lo esperado.</li><li><strong>Falla de detección:</strong> puede afectar la identificación de la ocupación de un tramo.</li><li><strong>Falla de comunicación:</strong> puede interrumpir el intercambio de información entre equipos y centros de control.</li><li><strong>Falla de alimentación:</strong> puede comprometer el funcionamiento de los dispositivos.</li></ul><p>Cualquier anomalía debe comunicarse inmediatamente por los canales previstos. La circulación debe seguir las medidas de seguridad y los procedimientos oficiales del ferrocarril.</p><p>Ningún profesional debe suponer que existe una condición segura ni improvisar una autorización de movimiento ante una falla.</p>`}}
  },
  operacoes: {
    0:{en:{title:'Fundamentals of railway operations',description:'Learn about the activities that keep railway transportation running.',content:`<h3>Fundamentals of railway operations</h3><p>Railway operations comprise the activities required to move trains, organize freight cars, serve facilities and ensure the flow of freight and passengers.</p><ul><li><strong>Train movements:</strong> movement of trains between different points on the railway.</li><li><strong>Shunting:</strong> movement of locomotives and freight cars in yards and facilities.</li><li><strong>Train formation:</strong> organization of the vehicles that make up a train.</li><li><strong>Inspection:</strong> checking the operating condition of vehicles and equipment.</li><li><strong>Control:</strong> monitoring and coordinating railway activities.</li></ul><p>These activities depend on integration between teams, equipment, infrastructure and operating procedures.</p>`},es:{title:'Fundamentos de las operaciones ferroviarias',description:'Conozca las actividades que permiten el funcionamiento del transporte ferroviario.',content:`<h3>Fundamentos de las operaciones ferroviarias</h3><p>Las operaciones ferroviarias comprenden el conjunto de actividades necesarias para mover trenes, organizar vagones, atender instalaciones y garantizar el flujo de cargas y pasajeros.</p><ul><li><strong>Circulación:</strong> movimiento de los trenes entre diferentes puntos del ferrocarril.</li><li><strong>Maniobras:</strong> movimiento de locomotoras y vagones en patios e instalaciones.</li><li><strong>Formación:</strong> organización de los vehículos que componen un tren.</li><li><strong>Inspección:</strong> verificación de las condiciones operativas de los vehículos y equipos.</li><li><strong>Control:</strong> seguimiento y coordinación de las actividades ferroviarias.</li></ul><p>Estas actividades dependen de la integración entre equipos de trabajo, equipos, infraestructura y procedimientos operativos.</p>`}},
    1:{en:{title:'Train movements and control',description:'Understand how railway movements are organized and monitored.',content:`<h3>Train movements and control</h3><p>Railway traffic involves the movement of trains over an organized network, respecting safety conditions, track capacity and operating authorities.</p><ul><li><strong>Planning:</strong> organizing movements according to the operating schedule.</li><li><strong>Movement authority:</strong> authorization to move according to railway rules.</li><li><strong>Traffic control:</strong> monitoring trains and occupied sections.</li><li><strong>Communication:</strong> exchange of information between drivers, controllers and operating teams.</li><li><strong>Records:</strong> documentation of relevant events and occurrences.</li></ul><p>Compliance with movement authorities and traffic procedures is essential for railway safety.</p>`},es:{title:'Circulación y control de trenes',description:'Comprenda cómo se organizan y supervisan los movimientos ferroviarios.',content:`<h3>Circulación y control de trenes</h3><p>La circulación ferroviaria implica el desplazamiento de trenes en una red organizada, respetando las condiciones de seguridad, la capacidad de la vía y las autorizaciones operativas.</p><ul><li><strong>Planificación:</strong> organización de los movimientos según la programación.</li><li><strong>Autorización de circulación:</strong> permiso para circular según las reglas del ferrocarril.</li><li><strong>Control de tráfico:</strong> seguimiento de los trenes y de los tramos ocupados.</li><li><strong>Comunicación:</strong> intercambio de información entre maquinistas, controladores y equipos operativos.</li><li><strong>Registro:</strong> documentación de eventos e incidencias relevantes.</li></ul><p>El cumplimiento de las autorizaciones y de los procedimientos de circulación es indispensable para la seguridad ferroviaria.</p>`}},
    2:{en:{title:'Railway shunting',description:'Learn about locomotive and freight car movements in yards.',content:`<h3>Railway shunting</h3><p>Shunting consists of movements performed to position, remove, group or rearrange railway vehicles in yards, terminals, sidings and other facilities.</p><ul><li><strong>Reverse movement:</strong> movement in the direction opposite to the consist's usual direction of travel.</li><li><strong>Forward movement:</strong> movement to position or transfer vehicles.</li><li><strong>Classification:</strong> separating and organizing freight cars according to destination or operating needs.</li><li><strong>Positioning:</strong> placing vehicles on designated tracks or locations.</li><li><strong>Communication:</strong> transmitting instructions among the professionals involved.</li></ul><p>Shunting must be carried out by authorized teams, with clear communication, attention to track conditions and compliance with local procedures.</p>`},es:{title:'Maniobras ferroviarias',description:'Conozca las actividades de movimiento de locomotoras y vagones en patios.',content:`<h3>Maniobras ferroviarias</h3><p>Las maniobras ferroviarias son movimientos realizados para posicionar, retirar, agrupar o reorganizar vehículos ferroviarios en patios, terminales, desvíos y otras instalaciones.</p><ul><li><strong>Retroceso:</strong> movimiento realizado en sentido contrario al desplazamiento habitual de la composición.</li><li><strong>Avance:</strong> desplazamiento para posicionar o transferir vehículos.</li><li><strong>Clasificación:</strong> separación y organización de vagones según el destino o la necesidad operativa.</li><li><strong>Posicionamiento:</strong> colocación de los vehículos en vías o lugares determinados.</li><li><strong>Comunicación:</strong> transmisión de instrucciones entre los profesionales involucrados.</li></ul><p>Las maniobras deben ser realizadas por equipos autorizados, con comunicación clara, atención a las condiciones de la vía y cumplimiento de los procedimientos locales.</p>`}},
    3:{en:{title:'Train formation and consist makeup',description:'Learn how locomotives and freight cars are arranged to form a train.',content:`<h3>Train formation and consist makeup</h3><p>Train formation is the arrangement of locomotives and railway vehicles that will perform a specific route or service.</p><ul><li><strong>Locomotives:</strong> provide the tractive effort required for movement.</li><li><strong>Freight cars:</strong> carry cargo and are arranged according to operating characteristics.</li><li><strong>Distribution:</strong> considers factors such as mass, length, vehicle characteristics and operating requirements.</li><li><strong>Brakes:</strong> the system must meet the conditions and checks required for the consist.</li><li><strong>Documentation:</strong> records information needed to identify the train and authorize its movement.</li></ul><p>The final consist must comply with the technical and operating limits established by the railway.</p>`},es:{title:'Formación y composición de trenes',description:'Sepa cómo se organizan locomotoras y vagones para formar un tren.',content:`<h3>Formación y composición de trenes</h3><p>La formación de un tren consiste en organizar las locomotoras y los vehículos ferroviarios que realizarán un recorrido o servicio determinado.</p><ul><li><strong>Locomotoras:</strong> proporcionan la fuerza de tracción necesaria para el desplazamiento.</li><li><strong>Vagones:</strong> transportan cargas y se organizan según las características de la operación.</li><li><strong>Distribución:</strong> considera factores como masa, longitud, características de los vehículos y requisitos operativos.</li><li><strong>Freno:</strong> el sistema debe cumplir las condiciones y verificaciones exigidas para la composición.</li><li><strong>Documentación:</strong> registra la información necesaria para identificar y permitir la circulación del tren.</li></ul><p>La composición final debe respetar los límites técnicos y operativos establecidos por el ferrocarril.</p>`}},
    4:{en:{title:'Coupling and uncoupling freight cars',description:'Learn the principles of connecting and separating railway vehicles.',content:`<h3>Coupling and uncoupling freight cars</h3><p>Coupling is the mechanical connection between railway vehicles, allowing them to move as part of a consist. Uncoupling is the separation of those vehicles.</p><ul><li><strong>Couplers:</strong> provide the mechanical connection between vehicles.</li><li><strong>Pneumatic connections:</strong> maintain continuity of brake-system connections where applicable.</li><li><strong>Inspection:</strong> checks the condition of connection devices.</li><li><strong>Communication:</strong> coordinates activities among the professionals involved.</li></ul><p>These activities require specific safety procedures, movement control and prevention of exposure to crush zones. They must be performed only by qualified professionals and according to local rules.</p>`},es:{title:'Acoplamiento y desacoplamiento de vagones',description:'Conozca los principios de unión y separación de los vehículos ferroviarios.',content:`<h3>Acoplamiento y desacoplamiento de vagones</h3><p>El acoplamiento es la unión mecánica entre vehículos ferroviarios, que permite moverlos como parte de una composición. El desacoplamiento consiste en separar esos vehículos.</p><ul><li><strong>Enganches:</strong> realizan la conexión mecánica entre los vehículos.</li><li><strong>Conexiones neumáticas:</strong> permiten la continuidad de las conexiones del sistema de freno cuando corresponda.</li><li><strong>Inspección:</strong> verifica las condiciones de los dispositivos de conexión.</li><li><strong>Comunicación:</strong> coordina las actividades entre los profesionales involucrados.</li></ul><p>Estas actividades exigen procedimientos específicos de seguridad, control de movimientos y prevención de exposición a zonas de aplastamiento. Deben ser ejecutadas únicamente por profesionales habilitados y conforme a las reglas locales.</p>`}},
    5:{en:{title:'Operational train inspection',description:'Understand the importance of checks before and during operation.',content:`<h3>Operational train inspection</h3><p>Operational inspection aims to identify conditions that may compromise safety, vehicle integrity or the continuity of railway operations.</p><ul><li><strong>Wheelsets and bogies:</strong> observing the condition of assemblies and possible abnormalities.</li><li><strong>Couplers:</strong> checking the condition of coupling devices.</li><li><strong>Brakes:</strong> observing and performing the tests required by procedures.</li><li><strong>Structure:</strong> identifying damage, deformation or loose components.</li><li><strong>Cargo:</strong> checking loading and securing conditions, where applicable.</li></ul><p>Identified abnormal conditions must be recorded and reported. Release of the vehicle or train depends on the technical and operating criteria established by the railway.</p>`},es:{title:'Inspección operativa de trenes',description:'Comprenda la importancia de las verificaciones antes y durante la operación.',content:`<h3>Inspección operativa de trenes</h3><p>La inspección operativa busca identificar condiciones que puedan comprometer la seguridad, la integridad de los vehículos o la continuidad de la operación ferroviaria.</p><ul><li><strong>Ejes montados y bogies:</strong> observación de las condiciones de los conjuntos y de posibles anomalías.</li><li><strong>Enganches:</strong> verificación de las condiciones de los dispositivos de acoplamiento.</li><li><strong>Frenos:</strong> observación y realización de las pruebas previstas en los procedimientos.</li><li><strong>Estructura:</strong> identificación de daños, deformaciones o componentes sueltos.</li><li><strong>Carga:</strong> verificación de las condiciones de acondicionamiento y fijación, cuando corresponda.</li></ul><p>Las anomalías identificadas deben registrarse y comunicarse. La liberación del vehículo o tren depende de los criterios técnicos y operativos establecidos por el ferrocarril.</p>`}},
    6:{en:{title:'Railway yard operations',description:'Learn about yard organization and the activities performed there.',content:`<h3>Railway yard operations</h3><p>Railway yards are facilities intended for receiving, forming, classifying, storing and moving trains and freight cars.</p><ul><li><strong>Receiving tracks:</strong> used to receive consists arriving at the yard.</li><li><strong>Classification tracks:</strong> allow freight cars to be organized by destination or service.</li><li><strong>Storage tracks:</strong> used to position vehicles awaiting further movement.</li><li><strong>Sidings:</strong> make transfers between different tracks possible.</li><li><strong>Operational control:</strong> coordinates the occupancy and use of available tracks.</li></ul><p>Yard organization must consider the safe movement of people and equipment, track identification and communication among teams.</p>`},es:{title:'Operaciones en patios ferroviarios',description:'Conozca la organización y las actividades realizadas en los patios.',content:`<h3>Operaciones en patios ferroviarios</h3><p>Los patios ferroviarios son instalaciones destinadas a la recepción, formación, clasificación, estacionamiento y movimiento de trenes y vagones.</p><ul><li><strong>Vías de recepción:</strong> utilizadas para recibir composiciones que llegan al patio.</li><li><strong>Vías de clasificación:</strong> permiten organizar vagones según destinos o servicios.</li><li><strong>Vías de estacionamiento:</strong> utilizadas para posicionar vehículos que esperan un nuevo movimiento.</li><li><strong>Desvíos:</strong> permiten transferencias entre diferentes vías.</li><li><strong>Control operativo:</strong> coordina la ocupación y utilización de las vías disponibles.</li></ul><p>La organización del patio debe considerar la circulación segura de personas y equipos, la identificación de las vías y la comunicación entre los equipos de trabajo.</p>`}},
    7:{en:{title:'Freight car loading and unloading',description:'Understand cargo-handling operations at railway terminals.',content:`<h3>Freight car loading and unloading</h3><p>Loading and unloading are essential railway logistics activities, allowing goods to be transferred between freight cars and customer or terminal facilities.</p><ul><li><strong>Loading:</strong> placing cargo in the car according to its purpose and capacity.</li><li><strong>Distribution:</strong> arranging the load to avoid improper concentration of weight.</li><li><strong>Securing:</strong> using appropriate means to prevent cargo movement.</li><li><strong>Unloading:</strong> removing goods with equipment or systems suitable for the product.</li><li><strong>Verification:</strong> checking the condition of the car and the operation performed.</li></ul><p>Loading must comply with the car's capacity, axle-load limits and requirements specific to each type of cargo.</p><p>Operations must follow the safety procedures and technical guidance applicable to the terminal and railway.</p>`},es:{title:'Carga y descarga de vagones',description:'Comprenda las operaciones de movimiento de cargas en terminales ferroviarias.',content:`<h3>Carga y descarga de vagones</h3><p>Las operaciones de carga y descarga son actividades fundamentales en la logística ferroviaria y permiten transferir mercancías entre los vagones y las instalaciones de los clientes o terminales.</p><ul><li><strong>Carga:</strong> colocación de la carga en el vagón según su finalidad y capacidad.</li><li><strong>Distribución:</strong> organización de la carga para evitar una concentración inadecuada del peso.</li><li><strong>Fijación:</strong> utilización de recursos adecuados para impedir desplazamientos de la carga.</li><li><strong>Descarga:</strong> retirada de la mercancía mediante equipos o sistemas adecuados al producto.</li><li><strong>Verificación:</strong> comprobación de las condiciones del vagón y de la operación realizada.</li></ul><p>La carga debe respetar la capacidad del vagón, los límites de peso por eje y los requisitos específicos de cada tipo de mercancía.</p><p>Las operaciones deben seguir los procedimientos de seguridad y las orientaciones técnicas aplicables al terminal y al ferrocarril.</p>`}}
  },
  historia: {
    0:{en:{title:'The emergence of the first railways',description:'Learn about the origins of railways and the early use of trains for transportation.',content:`<h3>The emergence of the first railways</h3><p>The history of railways is directly connected to the Industrial Revolution and the need to transport raw materials, goods and passengers more efficiently.</p><p>Before steam locomotives, trackways already existed and were used to move wagons pulled by animals or human power.</p><p>In 1825, the Stockton and Darlington Railway opened in England, marking an important milestone in the use of steam locomotives on a public railway.</p><p>In 1830, the Liverpool and Manchester Railway began a new stage in railway transportation, demonstrating the potential of trains to carry passengers and goods between cities.</p><ul><li><strong>England:</strong> birthplace of important advances in modern railways.</li><li><strong>Steam engine:</strong> made greater tractive and transportation capacity possible.</li><li><strong>Expansion:</strong> railways began connecting industrial and commercial regions.</li><li><strong>Impact:</strong> shorter travel times and transformation of logistics.</li></ul><p>Railway development profoundly changed the economy, industry and organization of cities, becoming one of the main symbols of industrialization.</p>`},es:{title:'El surgimiento de los primeros ferrocarriles',description:'Conozca el origen de los ferrocarriles y el inicio del uso de trenes en el transporte.',content:`<h3>El surgimiento de los primeros ferrocarriles</h3><p>La historia de los ferrocarriles está directamente relacionada con la Revolución Industrial y la necesidad de transportar materias primas, mercancías y pasajeros con mayor eficiencia.</p><p>Antes de las locomotoras de vapor, ya existían caminos con rieles utilizados para mover vagones arrastrados por animales o por fuerza humana.</p><p>En 1825 se inauguró en Inglaterra el ferrocarril Stockton and Darlington, un hito en el uso de locomotoras de vapor en un ferrocarril público.</p><p>En 1830, el ferrocarril Liverpool and Manchester inició una nueva etapa del transporte ferroviario y demostró el potencial de los trenes para transportar pasajeros y mercancías entre ciudades.</p><ul><li><strong>Inglaterra:</strong> cuna de importantes avances del ferrocarril moderno.</li><li><strong>Máquina de vapor:</strong> permitió una mayor capacidad de tracción y transporte.</li><li><strong>Expansión:</strong> los ferrocarriles comenzaron a conectar regiones industriales y comerciales.</li><li><strong>Impacto:</strong> reducción de los tiempos de desplazamiento y transformación de la logística.</li></ul><p>El desarrollo ferroviario modificó profundamente la economía, la industria y la organización de las ciudades, convirtiéndose en uno de los principales símbolos de la industrialización.</p>`}},
    1:{en:{title:'The arrival of railways in Brazil',description:'Learn about the beginning of Brazilian railway transportation in the 19th century.',content:`<h3>The arrival of railways in Brazil</h3><p>Brazilian railway construction took place during the 19th century, a period of growth in agricultural production and a need to improve the transportation of goods to ports.</p><p>One of the main people responsible for promoting railway construction in the country was Irineu Evangelista de Sousa, known as the Baron of Mauá.</p><p>On April 30, 1854, the Mauá Railway was inaugurated and is considered Brazil's first railway. Its initial section was approximately 14.5 kilometers long, connecting the Port of Mauá, in Guanabara Bay, to the Fragoso area, in what is now the municipality of Magé, in Rio de Janeiro.</p><ul><li><strong>1854:</strong> inauguration of the first Brazilian railway.</li><li><strong>Baron of Mauá:</strong> businessman and entrepreneur involved in establishing the railway.</li><li><strong>Baronesa locomotive:</strong> historic milestone of steam traction in Brazil.</li><li><strong>Purpose:</strong> to facilitate the transportation of people and goods.</li></ul><p>The arrival of railways represented an important transformation in Brazilian infrastructure and paved the way for railway expansion in different regions of the country.</p>`},es:{title:'La llegada de los ferrocarriles a Brasil',description:'Conozca el inicio del transporte ferroviario brasileño en el siglo XIX.',content:`<h3>La llegada de los ferrocarriles a Brasil</h3><p>La implantación de los ferrocarriles brasileños ocurrió durante el siglo XIX, en un período de crecimiento de la producción agrícola y de necesidad de mejorar el transporte de mercancías hasta los puertos.</p><p>Uno de los principales responsables de impulsar la construcción ferroviaria en el país fue Irineu Evangelista de Sousa, conocido como Barón de Mauá.</p><p>El 30 de abril de 1854 se inauguró el Ferrocarril de Mauá, considerado el primer ferrocarril de Brasil. El tramo inicial tenía aproximadamente 14,5 kilómetros y conectaba el Puerto de Mauá, en la bahía de Guanabara, con la región de Fragoso, en el actual municipio de Magé, en Río de Janeiro.</p><ul><li><strong>1854:</strong> inauguración del primer ferrocarril brasileño.</li><li><strong>Barón de Mauá:</strong> empresario y emprendedor vinculado a la implantación del ferrocarril.</li><li><strong>Locomotora Baronesa:</strong> hito histórico de la tracción a vapor en Brasil.</li><li><strong>Objetivo:</strong> facilitar el transporte de personas y mercancías.</li></ul><p>La llegada de los ferrocarriles representó una transformación importante de la infraestructura brasileña y abrió el camino para la expansión del transporte ferroviario en diferentes regiones del país.</p>`}},
    2:{en:{title:'The Mauá Railway and its pioneering role',description:'Learn about the importance of Brazil’s first railway in national history.',content:`<h3>The Mauá Railway and its pioneering role</h3><p>The Mauá Railway holds a special place in Brazilian transportation history because it represents the beginning of railway operations in the country.</p><p>It was inaugurated in 1854 through the initiative of Irineu Evangelista de Sousa, the Baron of Mauá, who believed railways could modernize the economy and facilitate transportation.</p><p>The line connected the Port of Mauá to the Fragoso area, enabling integration between maritime and railway transportation.</p><ul><li><strong>Location:</strong> Province of Rio de Janeiro, now the state of Rio de Janeiro.</li><li><strong>Initial length:</strong> approximately 14.5 kilometers.</li><li><strong>Inauguration:</strong> April 30, 1854.</li><li><strong>Traction:</strong> steam locomotives.</li><li><strong>Importance:</strong> beginning of railway development in Brazil.</li></ul><p>The Baronesa locomotive became one of the main symbols of this pioneering period and remains a historical reference for the country's railways.</p><p>The Mauá Railway demonstrated that railway transportation could play a strategic role in developing Brazilian infrastructure.</p>`},es:{title:'El Ferrocarril de Mauá y su carácter pionero',description:'Conozca la importancia del primer ferrocarril brasileño para la historia nacional.',content:`<h3>El Ferrocarril de Mauá y su carácter pionero</h3><p>El Ferrocarril de Mauá ocupa un lugar especial en la historia del transporte brasileño porque representa el inicio de la operación ferroviaria en el país.</p><p>Su inauguración tuvo lugar en 1854, por iniciativa de Irineu Evangelista de Sousa, el Barón de Mauá, quien creía en el potencial de los ferrocarriles para modernizar la economía y facilitar el transporte.</p><p>La línea conectaba el Puerto de Mauá con la región de Fragoso, permitiendo la integración entre el transporte marítimo y el ferroviario.</p><ul><li><strong>Ubicación:</strong> provincia de Río de Janeiro, actual estado de Río de Janeiro.</li><li><strong>Extensión inicial:</strong> aproximadamente 14,5 kilómetros.</li><li><strong>Inauguración:</strong> 30 de abril de 1854.</li><li><strong>Tracción:</strong> locomotoras de vapor.</li><li><strong>Importancia:</strong> inicio de la implantación ferroviaria brasileña.</li></ul><p>La locomotora Baronesa se convirtió en uno de los principales símbolos de ese período pionero y sigue siendo una referencia histórica del ferrocarril nacional.</p><p>El Ferrocarril de Mauá demostró que el transporte ferroviario podía desempeñar un papel estratégico en el desarrollo de la infraestructura brasileña.</p>`}},
    3:{en:{title:'Railway expansion in Brazil',description:'Understand how railways developed and began connecting different Brazilian regions.',content:`<h3>Railway expansion in Brazil</h3><p>After the inauguration of the Mauá Railway, the construction of new railway lines became increasingly important to Brazil's economic development.</p><p>During the second half of the 19th century and the beginning of the 20th century, several railways were built mainly to transport agricultural products, especially coffee, as well as passengers and other goods.</p><p>One notable historical undertaking was the São Paulo Railway, inaugurated in 1867, which established a railway connection between Santos and Jundiaí, crossing the Serra do Mar region.</p><ul><li><strong>Agricultural transportation:</strong> railways facilitated the movement of production to ports.</li><li><strong>Regional integration:</strong> new lines connected cities and producing regions.</li><li><strong>Urban development:</strong> railway stations encouraged the growth of many localities.</li><li><strong>Trade:</strong> railway transportation increased the capacity to move goods.</li></ul><p>Throughout the 20th century, changes took place in the administration and organization of Brazilian railways. In 1957, the Federal Railway Network S.A. (RFFSA) was created, bringing several railways together under federal administration.</p><p>This process marked an important stage in the organization of the national railway system.</p>`},es:{title:'La expansión ferroviaria en Brasil',description:'Comprenda cómo se desarrollaron los ferrocarriles y conectaron distintas regiones brasileñas.',content:`<h3>La expansión ferroviaria en Brasil</h3><p>Después de la inauguración del Ferrocarril de Mauá, la construcción de nuevas líneas ferroviarias adquirió importancia para el desarrollo económico brasileño.</p><p>Durante la segunda mitad del siglo XIX y el comienzo del siglo XX, se construyeron diversos ferrocarriles para atender principalmente el transporte de productos agrícolas, especialmente café, además de pasajeros y otras mercancías.</p><p>Entre los emprendimientos históricos destacados se encuentra el São Paulo Railway, inaugurado en 1867, que estableció una conexión ferroviaria entre Santos y Jundiaí, atravesando la región de la Serra do Mar.</p><ul><li><strong>Transporte agrícola:</strong> los ferrocarriles facilitaron el traslado de la producción hasta los puertos.</li><li><strong>Integración regional:</strong> nuevas líneas conectaron ciudades y regiones productoras.</li><li><strong>Desarrollo urbano:</strong> las estaciones ferroviarias estimularon el crecimiento de diversas localidades.</li><li><strong>Comercio:</strong> el transporte ferroviario amplió la capacidad de movimiento de mercancías.</li></ul><p>A lo largo del siglo XX se produjeron cambios en la administración y organización de los ferrocarriles brasileños. En 1957 se creó la Rede Ferroviária Federal S.A. (RFFSA), que reunió diversas líneas ferroviarias bajo una administración federal.</p><p>Este proceso marcó una etapa importante en la organización del sistema ferroviario nacional.</p>`}},
    4:{en:{title:'The evolution of locomotives and railway transportation',description:'Learn how locomotives and railway systems changed technologically over time.',content:`<h3>The evolution of locomotives and railway transportation</h3><p>Since the emergence of the first steam locomotives, railway transportation has undergone major technological changes. These advances increased transportation capacity, improved train performance and expanded operating efficiency.</p><ul><li><strong>Steam locomotives:</strong> used energy from burning fuel to produce steam and move traction mechanisms.</li><li><strong>Diesel locomotives:</strong> represented an important development, using combustion engines to produce tractive power.</li><li><strong>Electric locomotives:</strong> use electrical energy to drive traction motors.</li><li><strong>Signaling systems:</strong> evolved to provide greater control and safety in railway traffic.</li><li><strong>Modern freight cars:</strong> began to feature designs specific to different cargo types and operations.</li></ul><p>Along with locomotive development, improvements were made to rails, sleepers, braking systems, couplers, telecommunications and control equipment.</p><p>Today, railways play a fundamental role in transporting large volumes of freight and carrying passengers in many parts of the world.</p><p>Technological modernization continues to transform the sector, with investment in automation, energy efficiency, monitoring and advanced railway control systems.</p>`},es:{title:'La evolución de las locomotoras y del transporte ferroviario',description:'Conozca la transformación tecnológica de las locomotoras y los sistemas ferroviarios a lo largo del tiempo.',content:`<h3>La evolución de las locomotoras y del transporte ferroviario</h3><p>Desde el surgimiento de las primeras locomotoras de vapor, el transporte ferroviario ha experimentado grandes transformaciones tecnológicas. Los avances permitieron aumentar la capacidad de transporte, mejorar el rendimiento de los trenes y ampliar la eficiencia operativa.</p><ul><li><strong>Locomotoras de vapor:</strong> utilizaban la energía producida por la combustión de combustible para generar vapor y mover los mecanismos de tracción.</li><li><strong>Locomotoras diésel:</strong> representaron una evolución importante, utilizando motores de combustión para producir potencia de tracción.</li><li><strong>Locomotoras eléctricas:</strong> utilizan energía eléctrica para mover los motores de tracción.</li><li><strong>Sistemas de señalización:</strong> evolucionaron para proporcionar mayor control y seguridad en la circulación ferroviaria.</li><li><strong>Vagones modernos:</strong> comenzaron a presentar diseños específicos para diferentes tipos de cargas y operaciones.</li></ul><p>Además de la evolución de las locomotoras, hubo mejoras en los rieles, durmientes, sistemas de frenado, enganches, telecomunicaciones y equipos de control.</p><p>Actualmente, los ferrocarriles desempeñan un papel fundamental en el transporte de grandes volúmenes de carga y en el desplazamiento de pasajeros en diversas partes del mundo.</p><p>La modernización tecnológica continúa transformando el sector, con inversiones en automatización, eficiencia energética, monitoreo y sistemas avanzados de control ferroviario.</p>`}}
  }
};
Object.assign(encyclopediaTopicTranslations, additionalTopicTranslations);


function obterTopicoTraduzido(categoria, indice, topico) {
  const idioma = idiomaAtual();
  const traducao = encyclopediaTopicTranslations[categoria]?.[indice]?.[idioma];
  return traducao ? { ...topico, ...traducao } : topico;
}

const encyclopediaTopics = {  locomotivas: [
    {
      title: 'Modelos de locomotivas',
      description: 'Conheça os principais modelos e tipos de locomotivas ferroviárias.',
      content: `
        <h3>Modelos de locomotivas ferroviárias</h3>

        <p>As locomotivas são veículos ferroviários motorizados responsáveis por fornecer a força necessária para movimentar trens de passageiros, cargas e composições de serviço.</p>

        <p>Existem diferentes modelos de locomotivas, desenvolvidos de acordo com as necessidades de transporte, características da ferrovia e condições de operação.</p>

        <ul>
          <li><strong>Diesel-elétricas:</strong> utilizam um motor diesel para acionar um gerador ou alternador, que fornece energia aos motores elétricos de tração.</li>
          <li><strong>Diesel-hidráulicas:</strong> utilizam transmissão hidráulica para transferir a potência do motor diesel às rodas.</li>
          <li><strong>Elétricas:</strong> recebem energia de uma fonte externa, como rede aérea ou terceiro trilho, para alimentar os motores de tração.</li>
          <li><strong>Diesel-mecânicas:</strong> utilizam sistemas mecânicos de transmissão de potência.</li>
          <li><strong>Locomotivas de manobra:</strong> projetadas para movimentar vagões, formar composições e realizar operações em pátios ferroviários.</li>
          <li><strong>Locomotivas de linha:</strong> destinadas principalmente à condução de trens em percursos ferroviários.</li>
        </ul>

        <p>Os modelos podem apresentar diferentes configurações de truques, quantidade de eixos, potência e capacidade de tração.</p>
      `
    },
    {
      title: 'Fabricantes de locomotivas',
      description: 'Conheça empresas que desenvolveram e fabricam locomotivas ferroviárias.',
      content: `
        <h3>Fabricantes de locomotivas</h3>

        <p>A indústria ferroviária possui fabricantes especializados no desenvolvimento e produção de locomotivas para diferentes aplicações, tecnologias e mercados.</p>

        <p>Entre os fabricantes historicamente importantes e presentes no setor ferroviário estão:</p>

        <ul>
          <li><strong>Wabtec:</strong> empresa que reúne tecnologias e linhas de produtos ferroviários, incluindo locomotivas e sistemas de controle.</li>
          <li><strong>Progress Rail:</strong> fabricante e fornecedora de soluções ferroviárias, incluindo locomotivas e equipamentos de manutenção.</li>
          <li><strong>Alstom:</strong> empresa com atuação internacional no desenvolvimento de tecnologias e equipamentos ferroviários.</li>
          <li><strong>Siemens Mobility:</strong> desenvolve locomotivas, sistemas de sinalização e soluções para transporte ferroviário.</li>
          <li><strong>CRRC:</strong> grupo industrial chinês com ampla atuação na fabricação de locomotivas e outros veículos ferroviários.</li>
        </ul>

        <p>Os fabricantes desenvolvem equipamentos considerando fatores como potência, eficiência energética, capacidade de tração, confiabilidade, segurança e condições de operação.</p>
      `
    },
    {
      title: 'Tecnologias das locomotivas',
      description: 'Entenda os sistemas e recursos tecnológicos utilizados nas locomotivas.',
      content: `
        <h3>Tecnologias das locomotivas</h3>

        <p>As locomotivas modernas utilizam diferentes tecnologias para produzir, transmitir e controlar a força de tração necessária à movimentação dos trens.</p>

        <ul>
          <li><strong>Tração diesel-elétrica:</strong> utiliza a energia produzida pelo conjunto motor diesel e gerador ou alternador para alimentar os motores de tração.</li>
          <li><strong>Tração elétrica:</strong> utiliza energia elétrica fornecida por uma fonte externa.</li>
          <li><strong>Controle eletrônico:</strong> monitora e gerencia parâmetros de funcionamento dos equipamentos da locomotiva.</li>
          <li><strong>Inversores de frequência:</strong> controlam a alimentação dos motores de tração em sistemas elétricos compatíveis.</li>
          <li><strong>Sistemas de diagnóstico:</strong> auxiliam na identificação de falhas e no acompanhamento das condições dos equipamentos.</li>
          <li><strong>Frenagem dinâmica:</strong> utiliza os motores de tração como geradores para produzir esforço de frenagem, dissipando ou recuperando energia conforme o sistema.</li>
        </ul>

        <p>A evolução tecnológica busca melhorar o desempenho operacional, a eficiência energética, a confiabilidade e a segurança ferroviária.</p>
      `
    },
    {
      title: 'Características das locomotivas',
      description: 'Conheça os principais parâmetros técnicos e características construtivas.',
      content: `
        <h3>Características das locomotivas</h3>

        <p>As locomotivas apresentam características técnicas que determinam sua capacidade de operação e desempenho nas ferrovias.</p>

        <ul>
          <li><strong>Potência:</strong> capacidade de produção de energia mecânica pelo conjunto de propulsão.</li>
          <li><strong>Força de tração:</strong> esforço que a locomotiva pode desenvolver para movimentar uma composição ferroviária.</li>
          <li><strong>Peso:</strong> massa total da locomotiva, importante para determinar a carga por eixo.</li>
          <li><strong>Velocidade máxima:</strong> limite de velocidade previsto no projeto e nas condições de operação.</li>
          <li><strong>Configuração de eixos:</strong> disposição dos eixos e rodas nos truques da locomotiva.</li>
          <li><strong>Truques:</strong> conjuntos mecânicos responsáveis pelo apoio, orientação e deslocamento da locomotiva sobre os trilhos.</li>
          <li><strong>Motor:</strong> equipamento responsável pela produção de energia utilizada no sistema de tração.</li>
          <li><strong>Sistema de freio:</strong> conjunto de equipamentos utilizado para controlar a velocidade e realizar a frenagem.</li>
        </ul>
         
        <p>Essas características variam conforme o fabricante, o modelo, a finalidade e as condições de utilização da locomotiva.</p>
      `
    }
  ],

  vagoes: [
    {
      title: 'Tipos de vagões',

        description: 'Conheça os principais modelos de vagões ferroviários.',
        content: `
          <h3>Tipos de vagões ferroviários</h3>
          <p>Os vagões ferroviários são veículos destinados principalmente ao transporte de cargas. Existem diferentes modelos, desenvolvidos de acordo com as características da mercadoria e as necessidades da operação.</p>
          <ul>
            <li><strong>Gôndola:</strong> utilizada no transporte de cargas a granel, como minério, carvão e outros materiais.</li>
            <li><strong>Hopper:</strong> projetado para transportar granéis, com estrutura que permite a descarga por gravidade.</li>
            <li><strong>Fechado:</strong> utilizado para cargas que precisam de proteção contra intempéries e exposição externa.</li>
            <li><strong>Plataforma:</strong> destinado a contêineres, produtos siderúrgicos, madeira e cargas especiais.</li>
            <li><strong>Tanque:</strong> utilizado para transportar líquidos e determinados produtos a granel.</li>
            <li><strong>Prancha:</strong> empregado no transporte de cargas especiais, pesadas ou de grandes dimensões.</li>
          </ul>
          <p>Os modelos e suas configurações podem variar conforme o projeto, a carga transportada e a ferrovia.</p>
        `
       },
      {
  
        title: 'Aplicações dos vagões',
        description: 'Entenda como cada modelo atende a diferentes tipos de carga.',
        content: `
          <h3>Aplicações dos vagões</h3>
          <p>A escolha do vagão depende das características da carga, do método de carregamento e descarregamento e das condições da infraestrutura ferroviária.</p>
          <ul>
            <li>Minérios e carvão: vagões gôndola e hopper, conforme o sistema de descarga.</li>
            <li>Grãos: vagões hopper específicos para produtos agrícolas.</li>
            <li>Contêineres: vagões plataforma e modelos intermodais.</li>
            <li>Combustíveis e líquidos: vagões tanque adequados ao produto transportado.</li>
            <li>Produtos industrializados: vagões fechados, plataformas ou modelos especiais.</li>
            <li>Cargas de grandes dimensões: vagões prancha e equipamentos especiais.</li>
          </ul>
        `
      },
      {
        title: 'Características construtivas',
        description: 'Conheça os principais elementos que compõem um vagão.',
        content: `
          <h3>Características construtivas dos vagões</h3>
          <p>Os vagões possuem diferentes características construtivas, determinadas pela finalidade e pela carga para a qual foram projetados.</p>
          <ul>
            <li><strong>Estrutura:</strong> conjunto estrutural que suporta os esforços e a carga transportada.</li>
            <li><strong>Truques:</strong> conjuntos que sustentam o vagão e permitem sua movimentação sobre os trilhos.</li>
            <li><strong>Rodas e eixos:</strong> componentes responsáveis pelo contato com a via e pelo deslocamento.</li>
            <li><strong>Engates:</strong> dispositivos utilizados para conectar os veículos ferroviários.</li>
            <li><strong>Sistema de freio:</strong> conjunto de componentes responsável pela frenagem do vagão.</li>
            <li><strong>Caixa ou estrutura de carga:</strong> espaço destinado ao acondicionamento da mercadoria.</li>
          </ul>
        `
      },
      {
        title: 'Identificação e numeração',
        description: 'Saiba como os vagões são identificados e classificados.',
        content: `
          <h3>Identificação e numeração dos vagões</h3>
          <p>Os vagões possuem identificações que permitem seu reconhecimento e controle operacional.</p>
          <p>As inscrições podem apresentar informações como numeração, proprietário, capacidade, tara, lotação e características específicas do veículo.</p>
          <p>Os padrões de identificação podem variar conforme o sistema ferroviário e as normas adotadas.</p>
        `
      },
      {
        title: 'Tara, lotação e capacidade',
        description: 'Entenda os conceitos de peso e capacidade dos vagões.',
        content: `
          <h3>Tara, lotação e capacidade</h3>
          <ul>
            <li><strong>Tara:</strong> peso do vagão vazio.</li>
            <li><strong>Lotação:</strong> capacidade de carga indicada para o vagão, conforme suas especificações.</li>
            <li><strong>Peso bruto:</strong> soma da tara com o peso da carga transportada.</li>
            <li><strong>Capacidade volumétrica:</strong> volume disponível para acondicionamento da carga.</li>
          </ul>
          <p>O carregamento deve respeitar os limites técnicos do vagão e as restrições aplicáveis à operação ferroviária.</p>
        `
      },
      {
        title: 'Truques e componentes',
        description: 'Conheça os conjuntos responsáveis pelo apoio e deslocamento.',
        content: `
          <h3>Truques e componentes dos vagões</h3>
          <p>O truque é um conjunto mecânico instalado sob o vagão. Ele sustenta parte da estrutura e permite a inscrição do veículo nas curvas da ferrovia.</p>
          <p>Entre seus componentes estão rodas, eixos, rolamentos, caixas de rolamento, suspensão e estrutura do truque.</p>
          <p>O projeto e a configuração desses componentes variam conforme o modelo do vagão.</p>
        `
      },
      {
        title: 'Sistemas de freio',
        description: 'Conheça os principais elementos do sistema de frenagem.',
        content: `
          <h3>Sistemas de freio dos vagões</h3>
          <p>O sistema de freio é fundamental para controlar a velocidade e permitir a parada dos veículos ferroviários.</p>
          <p>Em muitos vagões de carga são utilizados sistemas de freio pneumático, compostos por elementos como reservatório de ar, válvula de controle, cilindro de freio e componentes de transmissão da força às sapatas ou outros dispositivos de frenagem.</p>
          <p>Os equipamentos e procedimentos de inspeção dependem do projeto do vagão e das regras operacionais da ferrovia.</p>
        `
      },
      {
        title: 'Inspeção e conservação',
        description: 'Entenda a importância da conservação dos vagões.',
        content: `
          <h3>Inspeção e conservação dos vagões</h3>
          <p>A inspeção dos vagões contribui para a segurança e a confiabilidade do transporte ferroviário.</p>
          <p>Conforme os procedimentos aplicáveis, podem ser verificados elementos como rodas, truques, engates, estrutura, sistema de freio e condições gerais do veículo.</p>
          <p>Vagões com anormalidades devem receber o tratamento previsto nas normas e procedimentos da ferrovia responsável.</p>
        `
       },
      {
       title: 'Vagão Gôndola',
        description: 'Características, aplicações, estrutura e funcionamento do vagão gôndola.',
        content: `
          <h3>Vagão Gôndola — Características, Aplicações e Funcionamento</h3>

          <h4>1. O que é um vagão gôndola?</h4>
          <p>O vagão gôndola é um veículo ferroviário destinado principalmente ao transporte de cargas sólidas. Sua característica mais marcante é possuir estrutura aberta na parte superior, com piso e laterais para acomodação dos materiais transportados.</p>
          <p>É bastante utilizado em operações de mineração, siderurgia e transporte de materiais a granel.</p>

          <h4>2. Principais aplicações</h4>
          <p>Entre os materiais transportados estão:</p>
          <ul>
            <li>Minério de ferro;</li>
            <li>Carvão mineral;</li>
            <li>Coque;</li>
            <li>Brita e materiais de construção;</li>
            <li>Sucata metálica;</li>
            <li>Produtos siderúrgicos.</li>
          </ul>

          <h4>3. Características construtivas</h4>
          <ul>
            <li><strong>Estrutura metálica:</strong> suporta os esforços da operação e o peso da carga.</li>
            <li><strong>Piso:</strong> superfície de apoio da carga.</li>
            <li><strong>Laterais:</strong> delimitam o espaço destinado ao carregamento.</li>
            <li><strong>Cabeceiras:</strong> estruturas localizadas nas extremidades do vagão.</li>
            <li><strong>Truques:</strong> conjuntos responsáveis pelo apoio e deslocamento.</li>
            <li><strong>Engates:</strong> permitem a conexão entre os veículos ferroviários.</li>
            <li><strong>Sistema de freio:</strong> responsável pela frenagem do vagão.</li>
          </ul>

          <h4>4. Carregamento e descarregamento</h4>
          <p>O carregamento pode ser realizado por correias transportadoras, carregadores, escavadeiras e outros equipamentos.</p>
          <p>A descarga depende do projeto do vagão e da instalação utilizada. Muitos modelos necessitam de equipamentos externos para retirada da carga. Nem todo vagão gôndola possui descarga automática.</p>

          <h4>5. Vantagens</h4>
          <ul>
            <li>Versatilidade no transporte de cargas sólidas;</li>
            <li>Possibilidade de transportar grandes volumes;</li>
            <li>Compatibilidade com diferentes sistemas de carregamento;</li>
            <li>Ampla utilização em operações industriais e minerais.</li>
          </ul>

          <h4>6. Limitações e cuidados</h4>
          <p>Por possuir estrutura aberta, a carga pode ficar exposta às condições climáticas. Dependendo do material, podem ser necessários cuidados para evitar perdas, dispersão ou contaminação.</p>
          <p>O carregamento deve respeitar os limites de peso, a distribuição adequada da carga e as especificações técnicas do veículo.</p>

          <h4>7. Inspeção e conservação</h4>
          <p>Nas inspeções previstas pelos procedimentos ferroviários, podem ser verificados:</p>
          <ul>
            <li>Rodas e eixos;</li>
            <li>Truques e suspensão;</li>
            <li>Engates e aparelhos de choque e tração;</li>
            <li>Estrutura, piso e laterais;</li>
            <li>Componentes do sistema de freio;</li>
            <li>Condições gerais de conservação.</li>
          </ul>
          <p>Qualquer anormalidade deve receber o tratamento previsto nos procedimentos de segurança e manutenção da ferrovia responsável.</p>

          <h4>8. Importância para o transporte ferroviário</h4>
          <p>O vagão gôndola possui grande importância no transporte de produtos minerais e industriais. Sua estrutura permite movimentar grandes quantidades de materiais sólidos, contribuindo para a eficiência logística ferroviária.</p>

          <p><strong>Resumo:</strong> o vagão gôndola é um dos principais modelos utilizados no transporte ferroviário de cargas sólidas, destacando-se pela estrutura aberta, versatilidade e capacidade de atender diferentes necessidades logísticas.</p>
        `
      },
      
    ],

  componentes: [
    {
      title: 'Rodeiros, rodas e eixos',
      description: 'Conheça os componentes responsáveis pelo contato e deslocamento dos veículos ferroviários.',
      content: `
        <h3>Rodeiros, rodas e eixos ferroviários</h3>

        <p>Os rodeiros são conjuntos fundamentais dos veículos ferroviários, responsáveis pelo apoio e deslocamento sobre os trilhos.</p>

        <p>Um rodeiro convencional é composto principalmente por dois rodeiros? Não: por duas rodas ferroviárias montadas rigidamente em um eixo comum, formando um conjunto integrado.</p>

        <ul>
          <li><strong>Rodas:</strong> componentes que estabelecem contato com os trilhos e orientam o deslocamento do veículo.</li>
          <li><strong>Eixos:</strong> elementos que conectam as rodas e transmitem os esforços mecânicos.</li>
          <li><strong>Frisos:</strong> partes laterais das rodas que auxiliam na orientação do veículo sobre a via.</li>
          <li><strong>Rolamentos:</strong> componentes que permitem a rotação dos eixos com redução do atrito.</li>
          <li><strong>Caixas de rolamento:</strong> alojamentos que protegem e sustentam os conjuntos de rolamentos.</li>
        </ul>

        <p>As condições das rodas e dos eixos devem ser acompanhadas por inspeções e procedimentos técnicos específicos.</p>
      `
    },
    {
      title: 'Engates e aparelhos de choque e tração',
      description: 'Entenda os dispositivos utilizados na conexão dos veículos ferroviários.',
      content: `
        <h3>Engates e aparelhos de choque e tração</h3>

        <p>Os engates são dispositivos utilizados para conectar locomotivas e vagões, permitindo a formação de composições ferroviárias.</p>

        <p>Esses equipamentos transmitem esforços de tração e compressão durante a movimentação dos trens.</p>

        <ul>
          <li><strong>Engate:</strong> dispositivo responsável pela conexão entre veículos ferroviários.</li>
          <li><strong>Aparelho de choque e tração:</strong> conjunto destinado a absorver e transmitir esforços longitudinais.</li>
          <li><strong>Mandíbula:</strong> componente presente em determinados modelos de engates automáticos, responsável pelo acoplamento.</li>
          <li><strong>Pino de articulação:</strong> elemento utilizado em determinados conjuntos de engate.</li>
          <li><strong>Aparelho de choque:</strong> mecanismo que absorve parte dos impactos e esforços de compressão.</li>
        </ul>

        <p>A inspeção desses componentes é importante para a segurança da formação e movimentação dos trens.</p>
      `
    },
    {
      title: 'Sistemas de freio ferroviário',
      description: 'Conheça os principais equipamentos e princípios de funcionamento da frenagem.',
      content: `
        <h3>Sistemas de freio ferroviário</h3>

        <p>Os sistemas de freio ferroviário são responsáveis por controlar a velocidade, reduzir o movimento e permitir a parada dos veículos e composições.</p>

        <p>Nos sistemas pneumáticos utilizados em muitos veículos ferroviários, o ar comprimido é empregado para comandar a aplicação e o alívio dos freios.</p>

        <ul>
          <li><strong>Compressor:</strong> equipamento responsável pela produção de ar comprimido.</li>
          <li><strong>Reservatórios:</strong> armazenam o ar utilizado no sistema de frenagem.</li>
          <li><strong>Válvula de controle:</strong> controla o funcionamento do sistema conforme as variações de pressão.</li>
          <li><strong>Cilindro de freio:</strong> transforma a pressão do ar em força mecânica.</li>
          <li><strong>Timoneira:</strong> conjunto de alavancas e articulações que transmite a força de frenagem.</li>
          <li><strong>Sapatas de freio:</strong> componentes que atuam por atrito contra as superfícies de frenagem das rodas, nos sistemas que utilizam essa configuração.</li>
        </ul>

        <p>Existem diferentes tecnologias de frenagem, incluindo freio pneumático, dinâmico e eletropneumático.</p>

        <p>A manutenção e a inspeção devem seguir as especificações técnicas e os procedimentos operacionais aplicáveis.</p>
      `
    },
    {
      title: 'Trilhos, dormentes e fixações',
      description: 'Conheça os principais elementos que formam a estrutura da via permanente.',
      content: `
        <h3>Trilhos, dormentes e fixações ferroviárias</h3>

        <p>A via permanente é formada por elementos estruturais que sustentam e orientam os veículos ferroviários durante sua circulação.</p>

        <ul>
          <li><strong>Trilhos:</strong> perfis metálicos que formam a superfície de rolamento das rodas e conduzem os veículos.</li>
          <li><strong>Dormentes:</strong> elementos que sustentam os trilhos e ajudam a manter a bitola da via.</li>
          <li><strong>Fixações:</strong> componentes responsáveis pela fixação dos trilhos aos dormentes.</li>
          <li><strong>Placas de apoio:</strong> elementos utilizados em determinadas configurações para distribuir esforços e apoiar os trilhos.</li>
          <li><strong>Lastro:</strong> camada de material granular que proporciona apoio, estabilidade e distribuição das cargas da via.</li>
          <li><strong>Juntas ferroviárias:</strong> dispositivos utilizados para unir segmentos de trilhos em determinadas configurações de via.</li>
        </ul>

        <p>A conservação desses elementos é essencial para a estabilidade, geometria e segurança da infraestrutura ferroviária.</p>
      `  
      }
  ],

  sinalizacao: [
    {
      title: 'Finalidade da sinalização ferroviária',
      description: 'Entenda como a sinalização organiza e protege a circulação ferroviária.',
      content: `
        <h3>Finalidade da sinalização ferroviária</h3>
        <p>A sinalização ferroviária reúne sistemas, equipamentos, indicações e procedimentos utilizados para organizar a circulação dos trens e orientar os profissionais envolvidos na operação.</p>
        <p>Sua principal finalidade é contribuir para a segurança da circulação, controlando movimentos, velocidades, ocupação de trechos e condições de autorização de passagem.</p>
        <ul>
          <li><strong>Segurança:</strong> auxilia na prevenção de conflitos entre movimentos ferroviários.</li>
          <li><strong>Organização:</strong> estabelece condições para a circulação dos trens.</li>
          <li><strong>Orientação:</strong> transmite informações aos maquinistas e equipes operacionais.</li>
          <li><strong>Controle:</strong> permite acompanhar e controlar condições de circulação.</li>
        </ul>
        <p>Os sistemas e procedimentos específicos variam conforme a ferrovia e suas normas operacionais.</p>
      `
    },
    {
      title: 'Tipos de sinais ferroviários',
      description: 'Conheça as principais formas de transmitir indicações na ferrovia.',
      content: `
        <h3>Tipos de sinais ferroviários</h3>
        <p>Os sinais ferroviários podem ser apresentados de diferentes maneiras, de acordo com a tecnologia empregada e as regras de circulação da ferrovia.</p>
        <ul>
          <li><strong>Sinais luminosos:</strong> utilizam indicações luminosas para transmitir informações.</li>
          <li><strong>Sinais fixos:</strong> instalados ao longo da via para orientar os movimentos.</li>
          <li><strong>Sinais manuais:</strong> utilizados por profissionais autorizados em determinadas situações.</li>
          <li><strong>Sinalização de cabine:</strong> apresenta informações diretamente no posto de condução.</li>
          <li><strong>Sinalização por comunicação:</strong> transmite autorizações e orientações por sistemas de comunicação previstos nos procedimentos.</li>
        </ul>
        <p>A interpretação de qualquer sinal deve seguir rigorosamente a regulamentação operacional aplicável.</p>
      `
    },
    {
      title: 'Sinalização luminosa',
      description: 'Entenda a função dos sinais luminosos utilizados na circulação.',
      content: `
        <h3>Sinalização luminosa ferroviária</h3>
        <p>A sinalização luminosa utiliza focos de luz e indicações visuais para transmitir informações relacionadas às condições de circulação.</p>
        <p>Esses equipamentos podem ser instalados em locais estratégicos da ferrovia, como aproximações de estações, entradas de pátios, entroncamentos e trechos de bloqueio.</p>
        <ul>
          <li><strong>Indicações luminosas:</strong> representam condições ou comandos definidos pelo sistema.</li>
          <li><strong>Visibilidade:</strong> devem permitir a identificação das indicações nas condições previstas de operação.</li>
          <li><strong>Posicionamento:</strong> devem estar associados aos locais e movimentos para os quais foram projetados.</li>
          <li><strong>Confiabilidade:</strong> dependem de manutenção e verificações técnicas.</li>
        </ul>
        <p>As cores e seus significados devem ser interpretados conforme o regulamento de sinalização da ferrovia, sem generalizações entre sistemas diferentes.</p>
      `
    },
    {
      title: 'Placas e sinais fixos',
      description: 'Conheça os elementos de sinalização instalados ao longo da via.',
      content: `
        <h3>Placas e sinais fixos</h3>
        <p>As placas e os sinais fixos são elementos instalados ao longo da infraestrutura ferroviária para transmitir informações aos profissionais responsáveis pela condução e operação dos trens.</p>
        <ul>
          <li><strong>Placas de velocidade:</strong> indicam limites ou condições de velocidade conforme a regulamentação.</li>
          <li><strong>Placas de localização:</strong> auxiliam na identificação de pontos e referências da ferrovia.</li>
          <li><strong>Sinais de advertência:</strong> alertam sobre condições ou características da via.</li>
          <li><strong>Marcos ferroviários:</strong> identificam referências utilizadas na operação e manutenção.</li>
          <li><strong>Sinalização de pátio:</strong> orienta movimentos e condições específicas das instalações.</li>
        </ul>
        <p>A localização, aparência e interpretação desses elementos seguem padrões definidos por cada sistema ferroviário.</p>
      `
    },
    {
      title: 'Sistemas de sinalização de cabine',
      description: 'Saiba como as informações operacionais podem ser apresentadas dentro da locomotiva.',
      content: `
        <h3>Sistemas de sinalização de cabine</h3>
        <p>A sinalização de cabine apresenta informações relacionadas à circulação diretamente no ambiente de condução da locomotiva.</p>
        <p>Dependendo da tecnologia utilizada, o sistema pode informar condições de autorização, limites de velocidade, aproximação de restrições e outras condições operacionais.</p>
        <ul>
          <li><strong>Interface de operação:</strong> apresenta informações ao maquinista.</li>
          <li><strong>Supervisão de velocidade:</strong> pode monitorar a velocidade em relação às condições autorizadas.</li>
          <li><strong>Comunicação com a infraestrutura:</strong> recebe informações de equipamentos e sistemas externos.</li>
          <li><strong>Alertas:</strong> informa situações que exigem atenção do operador.</li>
        </ul>
        <p>Os recursos disponíveis dependem do sistema instalado e de sua configuração operacional.</p>
      `
    },
    {
      title: 'Circuitos de via e contadores de eixos',
      description: 'Entenda como esses equipamentos identificam a ocupação de trechos ferroviários.',
      content: `
        <h3>Circuitos de via e contadores de eixos</h3>
        <p>Os circuitos de via e os contadores de eixos são tecnologias utilizadas para detectar a presença de veículos ferroviários em determinados trechos.</p>
        <ul>
          <li><strong>Circuito de via:</strong> utiliza características elétricas do circuito formado pelos trilhos para detectar a ocupação.</li>
          <li><strong>Contador de eixos:</strong> utiliza sensores instalados na via para registrar a passagem dos eixos.</li>
          <li><strong>Detecção de ocupação:</strong> fornece informações importantes aos sistemas de sinalização e controle.</li>
          <li><strong>Liberação de trecho:</strong> ocorre conforme a lógica e os critérios de segurança do sistema.</li>
        </ul>
        <p>Esses recursos contribuem para o controle da circulação e para a prevenção de conflitos entre movimentos ferroviários.</p>
      `
    },
    {
      title: 'Intertravamento ferroviário',
      description: 'Conheça o sistema que coordena rotas, aparelhos de mudança de via e sinais.',
      content: `
        <h3>Intertravamento ferroviário</h3>
        <p>O intertravamento é um sistema de segurança que coordena os elementos de sinalização e os aparelhos de mudança de via para impedir combinações incompatíveis de movimentos.</p>
        <ul>
          <li><strong>Controle de rotas:</strong> verifica as condições necessárias para estabelecer um itinerário.</li>
          <li><strong>Controle de AMVs:</strong> supervisiona a posição dos aparelhos de mudança de via envolvidos na rota.</li>
          <li><strong>Proteção de movimentos:</strong> evita a autorização de rotas incompatíveis, conforme a lógica de segurança.</li>
          <li><strong>Integração:</strong> pode se comunicar com sinais, detectores de ocupação e centros de controle.</li>
        </ul>
        <p>O intertravamento é fundamental em regiões com cruzamentos, desvios, pátios e estações.</p>
      `
    },
    {
      title: 'Falhas e anormalidades na sinalização',
      description: 'Entenda a importância da identificação e comunicação de falhas nos sistemas.',
      content: `
        <h3>Falhas e anormalidades na sinalização</h3>
        <p>Falhas de sinalização podem comprometer a disponibilidade dos sistemas e alterar as condições normais de circulação ferroviária.</p>
        <ul>
          <li><strong>Falha de indicação:</strong> ocorre quando um sinal apresenta informação ausente ou incompatível com o esperado.</li>
          <li><strong>Falha de detecção:</strong> pode afetar a identificação da ocupação de um trecho.</li>
          <li><strong>Falha de comunicação:</strong> pode interromper a troca de informações entre equipamentos e centros de controle.</li>
          <li><strong>Falha de alimentação:</strong> pode comprometer o funcionamento dos dispositivos.</li>
        </ul>
        <p>Qualquer anormalidade deve ser comunicada imediatamente pelos canais previstos. A circulação deve seguir as medidas de segurança e os procedimentos oficiais da ferrovia.</p>
        <p>Nenhum profissional deve presumir uma condição segura ou improvisar uma autorização de movimento diante de uma falha.</p>
      `
    }
  ],

  operacoes: [
    {
      title: 'Fundamentos das operações ferroviárias',
      description: 'Conheça as atividades que permitem o funcionamento do transporte ferroviário.',
      content: `
        <h3>Fundamentos das operações ferroviárias</h3>
        <p>As operações ferroviárias compreendem o conjunto de atividades necessárias para movimentar trens, organizar vagões, atender instalações e garantir o fluxo de cargas e passageiros.</p>
        <ul>
          <li><strong>Circulação:</strong> movimentação dos trens entre diferentes pontos da ferrovia.</li>
          <li><strong>Manobras:</strong> movimentação de locomotivas e vagões em pátios e instalações.</li>
          <li><strong>Formação:</strong> organização dos veículos que compõem um trem.</li>
          <li><strong>Inspeção:</strong> verificação das condições operacionais dos veículos e equipamentos.</li>
          <li><strong>Controle:</strong> acompanhamento e coordenação das atividades ferroviárias.</li>
        </ul>
        <p>Essas atividades dependem da integração entre equipes, equipamentos, infraestrutura e procedimentos operacionais.</p>
      `
    },
    {
      title: 'Circulação e controle de trens',
      description: 'Entenda como os movimentos ferroviários são organizados e acompanhados.',
      content: `
        <h3>Circulação e controle de trens</h3>
        <p>A circulação ferroviária envolve o deslocamento dos trens em uma malha organizada, respeitando as condições de segurança, capacidade da via e autorizações operacionais.</p>
        <ul>
          <li><strong>Planejamento:</strong> organização dos movimentos de acordo com a programação.</li>
          <li><strong>Licenciamento:</strong> autorização de circulação conforme as regras da ferrovia.</li>
          <li><strong>Controle de tráfego:</strong> acompanhamento dos trens e dos trechos ocupados.</li>
          <li><strong>Comunicação:</strong> troca de informações entre maquinistas, controladores e equipes operacionais.</li>
          <li><strong>Registro:</strong> documentação de eventos e ocorrências relevantes.</li>
        </ul>
        <p>O cumprimento das autorizações e dos procedimentos de circulação é indispensável para a segurança ferroviária.</p>
      `
    },
    {
      title: 'Manobras ferroviárias',
      description: 'Conheça as atividades de movimentação de locomotivas e vagões em pátios.',
      content: `
        <h3>Manobras ferroviárias</h3>
        <p>Manobras ferroviárias são movimentos realizados para posicionar, retirar, agrupar ou reorganizar veículos ferroviários em pátios, terminais, desvios e outras instalações.</p>
        <ul>
          <li><strong>Recuo:</strong> movimento realizado no sentido contrário ao deslocamento habitual da composição.</li>
          <li><strong>Avanço:</strong> deslocamento para posicionamento ou transferência de veículos.</li>
          <li><strong>Classificação:</strong> separação e organização de vagões conforme o destino ou a necessidade operacional.</li>
          <li><strong>Posicionamento:</strong> colocação dos veículos em linhas ou locais determinados.</li>
          <li><strong>Comunicação:</strong> transmissão de orientações entre os profissionais envolvidos.</li>
        </ul>
        <p>As manobras devem ser realizadas por equipes autorizadas, com comunicação clara, atenção às condições da via e cumprimento dos procedimentos locais.</p>
      `
    },
    {
      title: 'Formação e composição de trens',
      description: 'Saiba como locomotivas e vagões são organizados para formar um trem.',
      content: `
        <h3>Formação e composição de trens</h3>
        <p>A formação de um trem consiste na organização das locomotivas e dos veículos ferroviários que irão realizar determinado percurso ou serviço.</p>
        <ul>
          <li><strong>Locomotivas:</strong> fornecem a força de tração necessária ao deslocamento.</li>
          <li><strong>Vagões:</strong> transportam cargas e são organizados conforme as características da operação.</li>
          <li><strong>Distribuição:</strong> considera fatores como massa, comprimento, características dos veículos e requisitos operacionais.</li>
          <li><strong>Freio:</strong> o sistema deve atender às condições e verificações exigidas para a composição.</li>
          <li><strong>Documentação:</strong> registra informações necessárias à identificação e à circulação do trem.</li>
        </ul>
        <p>A composição final deve respeitar os limites técnicos e operacionais estabelecidos pela ferrovia.</p>
      `
    },
    {
      title: 'Acoplamento e desacoplamento de vagões',
      description: 'Conheça os princípios de união e separação dos veículos ferroviários.',
      content: `
        <h3>Acoplamento e desacoplamento de vagões</h3>
        <p>O acoplamento é a união mecânica entre veículos ferroviários, permitindo que sejam movimentados como parte de uma composição. O desacoplamento consiste na separação desses veículos.</p>
        <ul>
          <li><strong>Engates:</strong> realizam a conexão mecânica entre os veículos.</li>
          <li><strong>Conexões pneumáticas:</strong> permitem a continuidade das ligações do sistema de freio quando aplicável.</li>
          <li><strong>Inspeção:</strong> verifica as condições dos dispositivos de conexão.</li>
          <li><strong>Comunicação:</strong> coordena as atividades entre os profissionais envolvidos.</li>
        </ul>
        <p>Essas atividades exigem procedimentos específicos de segurança, controle dos movimentos e prevenção de exposição a zonas de esmagamento. Devem ser executadas somente por profissionais habilitados e conforme as regras locais.</p>
      `
    },
    {
      title: 'Inspeção operacional de trens',
      description: 'Entenda a importância das verificações antes e durante a operação.',
      content: `
        <h3>Inspeção operacional de trens</h3>
        <p>A inspeção operacional busca identificar condições que possam comprometer a segurança, a integridade dos veículos ou a continuidade da operação ferroviária.</p>
        <ul>
          <li><strong>Rodeiros e truques:</strong> observação das condições dos conjuntos e de possíveis anormalidades.</li>
          <li><strong>Engates:</strong> verificação das condições dos dispositivos de acoplamento.</li>
          <li><strong>Freios:</strong> observação e realização dos testes previstos nos procedimentos.</li>
          <li><strong>Estrutura:</strong> identificação de danos, deformações ou componentes soltos.</li>
          <li><strong>Carga:</strong> verificação das condições de acondicionamento e fixação, quando aplicável.</li>
        </ul>
        <p>As anormalidades identificadas devem ser registradas e comunicadas. A liberação do veículo ou trem depende dos critérios técnicos e operacionais estabelecidos pela ferrovia.</p>
      `
    },
    {
      title: 'Operações em pátios ferroviários',
      description: 'Conheça a organização e as atividades realizadas nos pátios.',
      content: `
        <h3>Operações em pátios ferroviários</h3>
        <p>Os pátios ferroviários são instalações destinadas à recepção, formação, classificação, estacionamento e movimentação de trens e vagões.</p>
        <ul>
          <li><strong>Linhas de recepção:</strong> utilizadas para receber composições que chegam ao pátio.</li>
          <li><strong>Linhas de classificação:</strong> permitem organizar vagões conforme os destinos ou serviços.</li>
          <li><strong>Linhas de estacionamento:</strong> utilizadas para posicionar veículos que aguardam nova movimentação.</li>
          <li><strong>Desvios:</strong> possibilitam transferências entre diferentes linhas.</li>
          <li><strong>Controle operacional:</strong> coordena a ocupação e a utilização das linhas disponíveis.</li>
        </ul>
        <p>A organização do pátio deve considerar a circulação segura de pessoas e equipamentos, a identificação das linhas e a comunicação entre as equipes.</p>
      `
    },
    {
      title: 'Carregamento e descarga de vagões',
      description: 'Entenda as operações de movimentação de cargas nos terminais ferroviários.',
      content: `
        <h3>Carregamento e descarga de vagões</h3>
        <p>As operações de carregamento e descarga são atividades fundamentais na logística ferroviária, permitindo transferir mercadorias entre os vagões e as instalações dos clientes ou terminais.</p>
        <ul>
          <li><strong>Carregamento:</strong> colocação da carga no vagão conforme sua finalidade e capacidade.</li>
          <li><strong>Distribuição:</strong> organização da carga para evitar concentração inadequada de peso.</li>
          <li><strong>Fixação:</strong> utilização dos recursos apropriados para impedir deslocamentos da carga.</li>
          <li><strong>Descarga:</strong> retirada da mercadoria por equipamentos ou sistemas adequados ao produto.</li>
          <li><strong>Conferência:</strong> verificação das condições do vagão e da operação realizada.</li>
        </ul>
        <p>O carregamento deve respeitar a capacidade do vagão, os limites de peso por eixo e as exigências específicas para cada tipo de mercadoria.</p>
        <p>As operações devem seguir os procedimentos de segurança e as orientações técnicas aplicáveis ao terminal e à ferrovia.</p>
      `
    }
  ],


  historia: [
    {
      title: 'O surgimento das primeiras ferrovias',
      description: 'Conheça a origem das ferrovias e o início da utilização dos trens no transporte.',
      content: `
        <h3>O surgimento das primeiras ferrovias</h3>
        <p>A história das ferrovias está diretamente ligada à Revolução Industrial e à necessidade de transportar matérias-primas, mercadorias e passageiros com maior eficiência.</p>
        <p>Antes das locomotivas a vapor, já existiam caminhos de trilhos utilizados para movimentar vagões puxados por animais ou pela força humana.</p>
        <p>Em 1825, foi inaugurada na Inglaterra a ferrovia Stockton and Darlington, um marco na utilização de locomotivas a vapor em uma ferrovia pública.</p>
        <p>Em 1830, a ferrovia Liverpool and Manchester iniciou uma nova etapa do transporte ferroviário, demonstrando o potencial dos trens para transportar passageiros e mercadorias entre cidades.</p>
        <ul>
          <li><strong>Inglaterra:</strong> berço de importantes avanços da ferrovia moderna.</li>
          <li><strong>Máquina a vapor:</strong> possibilitou maior capacidade de tração e transporte.</li>
          <li><strong>Expansão:</strong> as ferrovias começaram a conectar regiões industriais e comerciais.</li>
          <li><strong>Impacto:</strong> redução dos tempos de deslocamento e transformação da logística.</li>
        </ul>
        <p>O desenvolvimento ferroviário modificou profundamente a economia, a indústria e a organização das cidades, tornando-se um dos principais símbolos da industrialização.</p>
      `
    },
    {
      title: 'A chegada das ferrovias ao Brasil',
      description: 'Conheça o início do transporte ferroviário brasileiro no século XIX.',
      content: `
        <h3>A chegada das ferrovias ao Brasil</h3>
        <p>A implantação das ferrovias brasileiras ocorreu durante o século XIX, em um período de crescimento da produção agrícola e de necessidade de melhorar o transporte de mercadorias até os portos.</p>
        <p>Um dos principais responsáveis por impulsionar a construção ferroviária no país foi Irineu Evangelista de Sousa, conhecido como Barão de Mauá.</p>
        <p>Em 30 de abril de 1854, foi inaugurada a Estrada de Ferro Mauá, considerada a primeira ferrovia do Brasil. O trecho inicial possuía aproximadamente 14,5 quilômetros, ligando o Porto de Mauá, na Baía de Guanabara, à região de Fragoso, no atual município de Magé, no Rio de Janeiro.</p>
        <ul>
          <li><strong>1854:</strong> inauguração da primeira ferrovia brasileira.</li>
          <li><strong>Barão de Mauá:</strong> empresário e empreendedor ligado à implantação da ferrovia.</li>
          <li><strong>Locomotiva Baronesa:</strong> marco histórico da tração a vapor no Brasil.</li>
          <li><strong>Objetivo:</strong> facilitar o transporte de pessoas e mercadorias.</li>
        </ul>
        <p>A chegada das ferrovias representou uma transformação importante na infraestrutura brasileira e abriu caminho para a expansão do transporte ferroviário em diferentes regiões do país.</p>
      `
    },
    {
      title: 'A Estrada de Ferro Mauá e seu pioneirismo',
      description: 'Conheça a importância da primeira ferrovia brasileira para a história nacional.',
      content: `
        <h3>A Estrada de Ferro Mauá e seu pioneirismo</h3>
        <p>A Estrada de Ferro Mauá ocupa um lugar especial na história do transporte brasileiro por representar o início da operação ferroviária no país.</p>
        <p>Sua inauguração aconteceu em 1854, por iniciativa de Irineu Evangelista de Sousa, o Barão de Mauá, que acreditava no potencial das ferrovias para modernizar a economia e facilitar o transporte.</p>
        <p>A linha conectava o Porto de Mauá à região de Fragoso, permitindo a integração entre o transporte marítimo e o ferroviário.</p>
        <ul>
          <li><strong>Localização:</strong> província do Rio de Janeiro, atual estado do Rio de Janeiro.</li>
          <li><strong>Extensão inicial:</strong> aproximadamente 14,5 quilômetros.</li>
          <li><strong>Inauguração:</strong> 30 de abril de 1854.</li>
          <li><strong>Tração:</strong> locomotivas a vapor.</li>
          <li><strong>Importância:</strong> início da implantação ferroviária brasileira.</li>
        </ul>
        <p>A locomotiva Baronesa tornou-se um dos principais símbolos desse período pioneiro e permanece como referência histórica da ferrovia nacional.</p>
        <p>A Estrada de Ferro Mauá demonstrou que o transporte ferroviário poderia desempenhar um papel estratégico no desenvolvimento da infraestrutura brasileira.</p>
      `
    },
    {
      title: 'A expansão ferroviária no Brasil',
      description: 'Entenda como as ferrovias se desenvolveram e passaram a conectar diferentes regiões brasileiras.',
      content: `
        <h3>A expansão ferroviária no Brasil</h3>
        <p>Após a inauguração da Estrada de Ferro Mauá, a construção de novas linhas ferroviárias ganhou importância no desenvolvimento econômico brasileiro.</p>
        <p>Durante a segunda metade do século XIX e o início do século XX, diversas ferrovias foram construídas para atender principalmente ao transporte de produtos agrícolas, especialmente o café, além de passageiros e outras mercadorias.</p>
        <p>Entre os empreendimentos históricos de destaque está a São Paulo Railway, inaugurada em 1867, que estabeleceu uma ligação ferroviária entre Santos e Jundiaí, passando pela região da Serra do Mar.</p>
        <ul>
          <li><strong>Transporte agrícola:</strong> as ferrovias facilitaram o escoamento da produção até os portos.</li>
          <li><strong>Integração regional:</strong> novas linhas conectaram cidades e regiões produtoras.</li>
          <li><strong>Desenvolvimento urbano:</strong> estações ferroviárias estimularam o crescimento de diversas localidades.</li>
          <li><strong>Comércio:</strong> o transporte ferroviário ampliou a capacidade de movimentação de mercadorias.</li>
        </ul>
        <p>Ao longo do século XX, ocorreram mudanças na administração e organização das ferrovias brasileiras. Em 1957, foi criada a Rede Ferroviária Federal S.A. (RFFSA), reunindo diversas estradas de ferro sob uma administração federal.</p>
        <p>Esse processo marcou uma etapa importante da organização do sistema ferroviário nacional.</p>
      `
    },
    {
      title: 'A evolução das locomotivas e do transporte ferroviário',
      description: 'Conheça a transformação tecnológica das locomotivas e dos sistemas ferroviários ao longo do tempo.',
      content: `
        <h3>A evolução das locomotivas e do transporte ferroviário</h3>
        <p>Desde o surgimento das primeiras locomotivas a vapor, o transporte ferroviário passou por grandes transformações tecnológicas. Os avanços permitiram aumentar a capacidade de transporte, melhorar o desempenho dos trens e ampliar a eficiência operacional.</p>
        <ul>
          <li><strong>Locomotivas a vapor:</strong> utilizavam a energia produzida pela queima de combustível para gerar vapor e movimentar os mecanismos de tração.</li>
          <li><strong>Locomotivas diesel:</strong> representaram uma evolução importante, utilizando motores a combustão para produzir potência de tração.</li>
          <li><strong>Locomotivas elétricas:</strong> utilizam energia elétrica para movimentar motores de tração.</li>
          <li><strong>Sistemas de sinalização:</strong> evoluíram para proporcionar maior controle e segurança na circulação ferroviária.</li>
          <li><strong>Vagões modernos:</strong> passaram a apresentar projetos específicos para diferentes tipos de cargas e operações.</li>
        </ul>
        <p>Além da evolução das locomotivas, ocorreram melhorias nos trilhos, dormentes, sistemas de frenagem, engates, telecomunicações e equipamentos de controle.</p>
        <p>Atualmente, as ferrovias desempenham um papel fundamental no transporte de grandes volumes de cargas e no deslocamento de passageiros em diversas partes do mundo.</p>
        <p>A modernização tecnológica continua transformando o setor, com investimentos em automação, eficiência energética, monitoramento e sistemas avançados de controle ferroviário.</p>
      `
    }
  ],
};

function abrirBibliotecaFerroviaria(categoria) {
    if (!encyclopediaCategories || !encyclopediaLibrary) return;

    const idioma = idiomaAtual();
    const nomes = {
      pt: { locomotivas: 'Locomotivas', vagoes: 'Vagões', componentes: 'Componentes ferroviários', sinalizacao: 'Sinalização', operacoes: 'Operações ferroviárias', historia: 'História ferroviária' },
      en: { locomotivas: 'Locomotives', vagoes: 'Freight cars', componentes: 'Railway components', sinalizacao: 'Signaling', operacoes: 'Railway operations', historia: 'Railway history' },
      es: { locomotivas: 'Locomotoras', vagoes: 'Vagones', componentes: 'Componentes ferroviarios', sinalizacao: 'Señalización', operacoes: 'Operaciones ferroviarias', historia: 'Historia ferroviaria' }
    };
    const nomeCategoria = nomes[idioma]?.[categoria] || 'Enciclopédia Ferroviária';
    const textosBiblioteca = {
      pt: { back: '← Voltar às categorias', explore: 'Explore os assuntos disponíveis nesta categoria:', access: 'Acessar conteúdo', preparing: 'O conteúdo desta categoria está em preparação. Em breve, novos materiais serão disponibilizados.' },
      en: { back: '← Back to categories', explore: 'Explore the topics available in this category:', access: 'Open content', preparing: 'This category is being prepared. New materials will be available soon.' },
      es: { back: '← Volver a las categorías', explore: 'Explore los temas disponibles en esta categoría:', access: 'Acceder al contenido', preparing: 'El contenido de esta categoría está en preparación. Próximamente habrá nuevos materiales.' }
    }[idioma] || { back: '← Voltar às categorias', explore: 'Explore os assuntos disponíveis nesta categoria:', access: 'Acessar conteúdo', preparing: 'O conteúdo desta categoria está em preparação.' };
    const topicos = encyclopediaTopics[categoria];

    encyclopediaCategories.style.display = 'none';

    const artigosPublicados = document.getElementById('encyclopediaArticles');
    if (artigosPublicados) {
      const cardArtigos = artigosPublicados.closest('.card');
      if (cardArtigos) cardArtigos.style.display = 'none';
    }

    let conteudo = `
      <button type="button" id="encyclopediaBackButton" class="btn">
        ${textosBiblioteca.back}
      </button>
      <h2 style="margin-top:20px;">${nomeCategoria}</h2>
    `;

    if (topicos && topicos.length) {
      conteudo += `
        <p>${textosBiblioteca.explore}</p>
        <div class="encyclopedia-topic-list">
      `;

      topicos.forEach((topico, indice) => {
        const topicoIdioma = obterTopicoTraduzido(categoria, indice, topico);
        conteudo += `
          <article class="card" style="margin:12px 0; padding:16px;">
            <h3>${topicoIdioma.title}</h3>
            <p>${topicoIdioma.description}</p>
            <button type="button"
              class="btn"
              data-library-topic="${indice}">
              ${textosBiblioteca.access}
            </button>
          </article>
        `;
      });

      conteudo += '</div>';
    } else {
      conteudo += `
        <p>${textosBiblioteca.preparing}</p>
      `;
    }

    encyclopediaLibrary.innerHTML = conteudo;
    encyclopediaLibrary.style.display = 'block';

    document.getElementById('encyclopediaBackButton')
      .addEventListener('click', fecharBibliotecaFerroviaria);

    encyclopediaLibrary.querySelectorAll('[data-library-topic]')
      .forEach(botao => {
        botao.addEventListener('click', () => {
          const indice = Number(botao.dataset.libraryTopic);
          abrirTopicoFerroviario(categoria, indice);
        });
      });
  }

  function abrirTopicoFerroviario(categoria, indice) {
    const topico = encyclopediaTopics[categoria]?.[indice];
    if (!topico || !encyclopediaLibrary) return;

    const topicoIdioma = obterTopicoTraduzido(categoria, indice, topico);
    const idioma = idiomaAtual();
    const voltar = idioma === 'en' ? '← Back to topics' : idioma === 'es' ? '← Volver a los temas' : '← Voltar aos assuntos';

    encyclopediaLibrary.innerHTML = `
      <button type="button" id="encyclopediaBackTopic" class="btn">
        ${voltar}
      </button>
      <h2 style="margin-top:20px;">${topicoIdioma.title}</h2>
      <div style="line-height:1.7; margin-top:16px;">
        ${topicoIdioma.content}
      </div>
    `;

    document.getElementById('encyclopediaBackTopic')
      .addEventListener('click', () => abrirBibliotecaFerroviaria(categoria));
  }

  function fecharBibliotecaFerroviaria() {
    if (!encyclopediaCategories || !encyclopediaLibrary) return;

    encyclopediaLibrary.style.display = 'none';
    encyclopediaCategories.style.display = '';

    const artigosPublicados = document.getElementById('encyclopediaArticles');
    if (artigosPublicados) {
      const cardArtigos = artigosPublicados.closest('.card');
      if (cardArtigos) cardArtigos.style.display = '';
    }
  }

  if (encyclopediaCategories && !encyclopediaCategories.dataset.libraryReady) {
    encyclopediaCategories.dataset.libraryReady = 'true';

    encyclopediaCategories.addEventListener('click', event => {
      const cartao = event.target.closest('[data-encyclopedia-category]');
      if (!cartao) return;

      event.preventDefault();

      abrirBibliotecaFerroviaria(
        cartao.dataset.encyclopediaCategory
      );
    });
  }
  
  console.log('ENCICLOPÉDIA.JS INICIADO 🚂');
  
  })();
                
                