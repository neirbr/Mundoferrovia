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

  async function carregarArtigos() {
    if (!articlesContainer) return;

    try {
      const snapshot = await db.collection('encyclopedia_articles')
        .where('status', '==', 'published')
        .get();

      if (snapshot.empty) {
        articlesContainer.innerHTML =
          `<div class="empty">${textoHTML('Ainda não existem artigos publicados na Enciclopédia.')}</div>`;
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

    } catch (error) {
      console.error('Erro ao carregar artigos:', error);

      articlesContainer.innerHTML =
        `<div class="empty">${textoHTML('Não foi possível carregar os artigos.')}</div>`;
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

  const encyclopediaTopics = {
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
      
    ]
  
  };

  function abrirBibliotecaFerroviaria(categoria) {
    if (!encyclopediaCategories || !encyclopediaLibrary) return;

    const nomes = {
      locomotivas: 'Locomotivas',
      vagoes: 'Vagões',
      componentes: 'Componentes ferroviários',
      sinalizacao: 'Sinalização',
      operacoes: 'Operações ferroviárias',
      historia: 'História ferroviária'
    };

    const nomeCategoria = nomes[categoria] || 'Enciclopédia Ferroviária';
    const topicos = encyclopediaTopics[categoria];

    encyclopediaCategories.style.display = 'none';

    const artigosPublicados = document.getElementById('encyclopediaArticles');
    if (artigosPublicados) {
      const cardArtigos = artigosPublicados.closest('.card');
      if (cardArtigos) cardArtigos.style.display = 'none';
    }

    let conteudo = `
      <button type="button" id="encyclopediaBackButton" class="btn">
        ← Voltar às categorias
      </button>
      <h2 style="margin-top:20px;">${nomeCategoria}</h2>
    `;

    if (topicos && topicos.length) {
      conteudo += `
        <p>Explore os assuntos disponíveis nesta categoria:</p>
        <div class="encyclopedia-topic-list">
      `;

      topicos.forEach((topico, indice) => {
        conteudo += `
          <article class="card" style="margin:12px 0; padding:16px;">
            <h3>${topico.title}</h3>
            <p>${topico.description}</p>
            <button type="button"
              class="btn"
              data-library-topic="${indice}">
              Acessar conteúdo
            </button>
          </article>
        `;
      });

      conteudo += '</div>';
    } else {
      conteudo += `
        <p>O conteúdo desta categoria está em preparação. Em breve, novos materiais serão disponibilizados.</p>
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

    encyclopediaLibrary.innerHTML = `
      <button type="button" id="encyclopediaBackTopic" class="btn">
        ← Voltar aos assuntos
      </button>
      <h2 style="margin-top:20px;">${topico.title}</h2>
      <div style="line-height:1.7; margin-top:16px;">
        ${topico.content}
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
                
                
