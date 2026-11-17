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
  locomotivas: [
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
                
                
