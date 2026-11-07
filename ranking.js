// ============================================
// MUNDO FERROVIÁRIO - RANKING FERROVIÁRIO
// ============================================

(function () {
  'use strict';

  if (window.MF_RANKING_STARTED) return;
  window.MF_RANKING_STARTED = true;

  const niveis = {
    basico: 'Básico',
    intermediario: 'Intermediário',
    avancado: 'Avançado'
  };

  let nivelAtual = 'basico';

  // --------------------------------------------
  // SALVAR MELHOR PONTUAÇÃO NO FIREBASE
  // --------------------------------------------

  async function salvarPontuacao(pontuacao, nivel) {
    try {
      if (!window.MF_AUTH || !window.MF_DB) {
        console.warn('Firebase não está disponível para o Ranking.');
        return;
      }

      const user = window.MF_AUTH.currentUser;

      if (!user) {
        console.log('Entre na sua conta para participar do Ranking.');
        return;
      }

      if (!niveis[nivel]) return;

      const perfil = await window.MF_DB
        .collection('user_profiles')
        .doc(user.uid)
        .get();

      const dadosPerfil = perfil.exists ? perfil.data() : {};

      const nome =
        dadosPerfil.name ||
        user.displayName ||
        (user.email ? user.email.split('@')[0] : 'Ferroviário');

      const referencia = window.MF_DB
        .collection('quiz_scores')
        .doc(user.uid + '_' + nivel);

      const documento = await referencia.get();

      const pontuacaoAnterior = documento.exists
        ? Number(documento.data().best_score || 0)
        : 0;

      const melhorPontuacao = Math.max(
        pontuacaoAnterior,
        Number(pontuacao)
      );

      await referencia.set({
        user_id: user.uid,
        author_name: nome,
        level: nivel,
        best_score: melhorPontuacao,
        updated_at:
          firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log('Pontuação salva no Ranking:', melhorPontuacao);

    } catch (error) {
      console.error('Erro ao salvar pontuação do Ranking:', error);
    }
  }

  // --------------------------------------------
  // CRIAR ELEMENTOS DO RANKING
  // --------------------------------------------

  function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;

    return elemento;
  }

  function preencherPosicao(elemento, participante, posicao) {
    if (!elemento) return;

    elemento.innerHTML = '';

    if (!participante) {
      elemento.appendChild(
        criarElemento('strong', '', posicao + 'º lugar')
      );

      elemento.appendChild(
        criarElemento('p', 'muted', 'Aguardando participante')
      );

      return;
    }

    elemento.appendChild(
      criarElemento('strong', '', posicao + 'º lugar')
    );

    elemento.appendChild(
      criarElemento('h3', '', participante.author_name)
    );

    elemento.appendChild(
      criarElemento(
        'p',
        '',
        participante.best_score + '% de aproveitamento'
      )
    );
  }

  // --------------------------------------------
  // CARREGAR CLASSIFICAÇÃO
  // --------------------------------------------

  async function carregarRanking(nivel) {
    nivelAtual = nivel || nivelAtual;

    const titulo = document.getElementById('rankingLevelName');
    const lista = document.getElementById('rankingList');

    if (titulo) {
      titulo.textContent = 'Nível ' + niveis[nivelAtual];
    }

    if (!lista) return;

    if (!window.MF_DB) {
      lista.textContent = 'Conexão com o Firebase indisponível.';
      return;
    }

    lista.textContent = 'Carregando classificação...';

    try {
      const resultado = await window.MF_DB
        .collection('quiz_scores')
        .get();

      const participantes = [];

      resultado.forEach(documento => {
        const dados = documento.data();

        if (
          dados.level === nivelAtual &&
          typeof dados.best_score === 'number'
        ) {
          participantes.push(dados);
        }
      });

      participantes.sort((a, b) => {
        return b.best_score - a.best_score;
      });

      preencherPosicao(
        document.getElementById('rankingFirst'),
        participantes[0],
        1
      );

      preencherPosicao(
        document.getElementById('rankingSecond'),
        participantes[1],
        2
      );

      preencherPosicao(
        document.getElementById('rankingThird'),
        participantes[2],
        3
      );

      lista.innerHTML = '';

      if (participantes.length === 0) {
        lista.textContent =
          'Ainda não existem participantes neste nível. Seja o primeiro!';
        return;
      }

      participantes.forEach((participante, indice) => {
        const item = criarElemento('div', 'ranking-item');

        const colocacao = criarElemento(
          'strong',
          'ranking-position',
          (indice + 1) + 'º'
        );

        const informacoes = criarElemento(
          'div',
          'ranking-info'
        );

        informacoes.appendChild(
          criarElemento('strong', '', participante.author_name)
        );

        informacoes.appendChild(
          criarElemento(
            'small',
            '',
            niveis[nivelAtual]
          )
        );

        const pontos = criarElemento(
          'strong',
          'ranking-score',
          participante.best_score + '%'
        );

        item.appendChild(colocacao);
        item.appendChild(informacoes);
        item.appendChild(pontos);

        lista.appendChild(item);
      });

    } catch (error) {
      console.error('Erro ao carregar Ranking:', error);

      lista.textContent =
        'Não foi possível carregar o Ranking. Tente novamente.';
    }
  }

  // --------------------------------------------
  // BOTÕES DE SELEÇÃO DE NÍVEL
  // --------------------------------------------

  function iniciarRanking() {
    document.querySelectorAll('[data-ranking-level]')
      .forEach(botao => {
        botao.addEventListener('click', function () {
          const nivel = this.dataset.rankingLevel;

          if (niveis[nivel]) {
            carregarRanking(nivel);
          }
        });
      });

    carregarRanking('basico');
  }

  // --------------------------------------------
  // DISPONIBILIZAR FUNÇÕES PARA O QUIZ
  // --------------------------------------------

  window.MF_SAVE_QUIZ_SCORE = salvarPontuacao;
  window.MF_LOAD_RANKING = carregarRanking;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarRanking);
  } else {
    iniciarRanking();
  }

})();

