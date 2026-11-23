
(function(){
  const cfg = window.MF_FIREBASE_CONFIG;

  if (!cfg || !cfg.apiKey || !cfg.projectId) {
    console.error('Configure firebase-config.js');
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(cfg);
  }

  window.MF_AUTH = firebase.auth();
  window.MF_DB = firebase.firestore();

  // Mantém em cache local os documentos já consultados, permitindo leitura offline.
  // A sincronização com o servidor ocorre automaticamente quando a conexão retorna.
  window.MF_DB_PERSISTENCE = window.MF_DB.enablePersistence({
    synchronizeTabs: true
  }).catch(function(error) {
    console.warn('Persistência offline do Firestore indisponível:', error.code || error);
    return false;
  });

  window.MF_IS_ADMIN = (uid) =>
    Array.isArray(window.MF_ADMIN_UIDS) &&
    window.MF_ADMIN_UIDS.includes(uid);

  // CONFIGURAÇÃO CLOUDINARY
window.MF_CLOUDINARY = {
  cloudName: 'dlsdvnvc',
  uploadPreset: 'mf_comunidade_unsigned'
};

})();
