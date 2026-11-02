
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

  window.MF_IS_ADMIN = (uid) =>
    Array.isArray(window.MF_ADMIN_UIDS) &&
    window.MF_ADMIN_UIDS.includes(uid);

  // CONFIGURAÇÃO CLOUDINARY
window.MF_CLOUDINARY = {
  cloudName: 'dlsdvnvc',
  uploadPreset: 'mf_comunidade_unsigned'
};
