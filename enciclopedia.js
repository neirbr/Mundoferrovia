
(function () {
  'use strict';

  if (window.MF_ENCYCLOPEDIA_STARTED) return;
  window.MF_ENCYCLOPEDIA_STARTED = true;

  const auth = window.MF_AUTH;
  const db = window.MF_DB;

  const form = document.getElementById('encyclopediaSuggestionForm');

  if (!form) {
    console.error('Formulário da Enciclopédia não encontrado.');
    return;
  }

  if (!auth || !db) {
    console.error('Firebase Auth ou Firestore não inicializado.');
    return;
  }

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

  console.log('ENCICLOPÉDIA.JS INICIADO 🚂');

})();

