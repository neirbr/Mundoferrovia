
/* ==========================================
   MUNDO FERROVIÁRIO
   SIMULANDO CONDUÇÃO 2D
   ========================================== */

(() => {
  'use strict';

  const imagem = document.getElementById('imagemCenario');
  const canvas = document.getElementById('camadaJogo');
  const status = document.getElementById('status-operacao');
  const botoes = document.getElementById('area-botoes');
  const missao = document.getElementById('missao');

  if (!imagem || !canvas || !status || !botoes) {
    console.error('Elementos do simulador não encontrados.');
    return;
  }

  const ctx = canvas.getContext('2d');

  // ==========================================
  // CONFIGURAÇÕES
  // ==========================================

  const jogo = {
    iniciado: false,
    acelerando: false,
    freando: false,
    velocidade: 0,
    distancia: 0,
    destino: false,
    ultimoTempo: 0,
    animacao: null
  };

  const config = {
    velocidadeMaxima: 65,
    aceleracao: 13,
    desaceleracao: 25,
    freioNatural: 2.5,
    espacamento: 43,
    tamanhoLocomotiva: 36,
    tamanhoVagao: 35
  };

  // ==========================================
  // PERCURSO FERROVIÁRIO
  // Coordenadas da imagem original 1050x1536
  // ==========================================

  const trilho = [
    [60,160],
    [180,160],
    [300,160],
    [430,160],
    [560,160],
    [650,160],
    [700,168],
    [745,185],
    [785,215],
    [815,255],
    [840,310],
    [850,370],
    [850,460],
    [850,570],
    [850,680],
    [850,760],
    [845,800],
    [825,830],
    [790,855],
    [745,870],
    [690,880],
    [620,880],
    [550,880],
    [490,870],
    [450,850],
    [425,820],
    [410,780],
    [405,720],
    [405,650],
    [405,570],
    [405,490],
    [395,440],
    [370,415],
    [335,402],
    [280,400],
    [220,400],
    [165,405],
    [125,420],
    [95,450],
    [75,490],
    [65,550],
    [65,650],
    [65,760],
    [65,870],
    [65,980],
    [65,1080],
    [65,1160],
    [75,1200],
    [100,1225],
    [145,1240],
    [210,1245],
    [280,1248],
    [350,1250],
    [390,1252],
    [420,1270],
    [455,1295],
    [495,1320],
    [540,1345],
    [585,1370],
    [630,1395],
    [680,1415],
    [750,1425],
    [850,1425],
    [960,1425]
  ];

  // ==========================================
  // PREPARAÇÃO DO CAMINHO
  // ==========================================

  const segmentos = [];
  let comprimentoTotal = 0;

  for (let i = 0; i < trilho.length - 1; i++) {
    const a = trilho[i];
    const b = trilho[i + 1];

    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const comprimento = Math.hypot(dx, dy);

    segmentos.push({
      a,
      b,
      inicio: comprimentoTotal,
      comprimento,
      angulo: Math.atan2(dy, dx)
    });

    comprimentoTotal += comprimento;
  }

  // ==========================================
  // POSIÇÃO SOBRE OS TRILHOS
  // ==========================================

  function obterPosicao(distancia) {

    distancia = Math.max(
      0,
      Math.min(distancia, comprimentoTotal)
    );

    const segmento = segmentos.find(s =>
      distancia <= s.inicio + s.comprimento
    ) || segmentos[segmentos.length - 1];

    const progresso =
      (distancia - segmento.inicio) /
      segmento.comprimento;

    return {
      x: segmento.a[0] +
        (segmento.b[0] - segmento.a[0]) * progresso,

      y: segmento.a[1] +
        (segmento.b[1] - segmento.a[1]) * progresso,

      angulo: segmento.angulo
    };
  }

  // ==========================================
  // CANVAS
  // ==========================================

  function prepararCanvas() {

    canvas.width = imagem.naturalWidth;
    canvas.height = imagem.naturalHeight;

    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';

    const cenario = document.getElementById('cenario');

    if (cenario) {
      cenario.style.position = 'relative';
    }

    imagem.style.display = 'block';
    imagem.style.width = '100%';
    imagem.style.height = 'auto';

    desenhar();
  }

  // ==========================================
  // DESENHAR LOCOMOTIVA E VAGÕES
  // ==========================================

  function desenharVeiculo(x, y, angulo, tipo) {

    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(angulo);

    const locomotiva = tipo === 'locomotiva';
    const comprimento = locomotiva ? 38 : 35;
    const largura = locomotiva ? 23 : 21;

    // Rodas
    ctx.fillStyle = '#202020';

    for (const lado of [-1, 1]) {
      ctx.fillRect(
        -comprimento / 2 + 5,
        lado * (largura / 2 - 3),
        7,
        5
      );

      ctx.fillRect(
        comprimento / 2 - 12,
        lado * (largura / 2 - 3),
        7,
        5
      );
    }

    // Corpo
    ctx.fillStyle = locomotiva ? '#173d58' : '#80532e';

    ctx.fillRect(
      -comprimento / 2,
      -largura / 2,
      comprimento,
      largura
    );

    // Cabine da locomotiva
    if (locomotiva) {

      ctx.fillStyle = '#d9e2e8';

      ctx.fillRect(-3, -8, 12, 16);

      ctx.fillStyle = '#f0b323';

      ctx.fillRect(12, -9, 5, 18);

      ctx.fillStyle = '#fff4a8';

      ctx.fillRect(17, -5, 3, 10);

    } else {

      ctx.fillStyle = '#b58b5a';

      ctx.fillRect(-9, -7, 18, 14);

    }

    ctx.restore();
  }

  // ==========================================
  // DESENHAR COMPOSIÇÃO
  // ==========================================

  function desenharComposicao() {

    // A locomotiva começa na estação superior.
    const locomotiva = obterPosicao(
      jogo.distancia
    );

    desenharVeiculo(
      locomotiva.x,
      locomotiva.y,
      locomotiva.angulo,
      'locomotiva'
    );

    // Quatro vagões seguem a locomotiva.
    for (let i = 1; i <= 4; i++) {

      const distanciaVagao =
        jogo.distancia - config.espacamento * i;

      if (distanciaVagao < 0) continue;

      const vagao = obterPosicao(distanciaVagao);

      desenharVeiculo(
        vagao.x,
        vagao.y,
        vagao.angulo,
        'vagao'
      );
    }
  }

  // ==========================================
  // DESENHO GERAL
  // ==========================================

  function desenhar() {

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    desenharComposicao();
  }

  // ==========================================
  // PAINEL DE CONTROLES
  // ==========================================

  function criarBotao(id, texto) {

    const botao = document.createElement('button');

    botao.id = id;
    botao.type = 'button';
    botao.textContent = texto;

    botao.style.padding = '12px 16px';
    botao.style.margin = '5px';
    botao.style.borderRadius = '8px';
    botao.style.border = 'none';
    botao.style.fontWeight = 'bold';
    botao.style.cursor = 'pointer';
    botao.style.background = '#174a67';
    botao.style.color = '#ffffff';
    botao.style.touchAction = 'none';

    botoes.appendChild(botao);

    return botao;
  }

  function criarControles() {

    botoes.innerHTML = '';

    const iniciar = criarBotao(
      'botaoIniciar',
      'INICIAR MISSÃO'
    );

    const acelerar = criarBotao(
      'botaoAcelerar',
      'ACELERAR'
    );

    const frear = criarBotao(
      'botaoFrear',
      'FREAR'
    );

    iniciar.addEventListener('click', iniciarMissao);

    acelerar.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (!jogo.iniciado || jogo.destino) return;
      jogo.acelerando = true;
    });

    acelerar.addEventListener('pointerup', () => {
      jogo.acelerando = false;
    });

    acelerar.addEventListener('pointerleave', () => {
      jogo.acelerando = false;
    });

    acelerar.addEventListener('pointercancel', () => {
      jogo.acelerando = false;
    });

    frear.addEventListener('pointerdown', e => {
      e.preventDefault();
      jogo.acelerando = false;
      jogo.freando = true;
    });

    frear.addEventListener('pointerup', () => {
      jogo.freando = false;
    });

    frear.addEventListener('pointerleave', () => {
      jogo.freando = false;
    });

    frear.addEventListener('pointercancel', () => {
      jogo.freando = false;
    });
  }

  // ==========================================
  // INICIAR MISSÃO
  // ==========================================

  function iniciarMissao() {

    if (jogo.iniciado) return;

    jogo.iniciado = true;
    jogo.ultimoTempo = 0;

    status.textContent =
      'MISSÃO INICIADA - AGUARDANDO COMANDO DE ACELERAÇÃO.';

    const botao = document.getElementById('botaoIniciar');

    if (botao) {
      botao.disabled = true;
      botao.textContent = 'MISSÃO EM ANDAMENTO';
    }

    if (!jogo.animacao) {
      jogo.animacao = requestAnimationFrame(atualizar);
    }
  }

  // ==========================================
  // ATUALIZAÇÃO DA MOVIMENTAÇÃO
  // ==========================================

  function atualizar(tempo) {

    if (!jogo.iniciado || jogo.destino) {
      jogo.animacao = null;
      return;
    }

    if (!jogo.ultimoTempo) {
      jogo.ultimoTempo = tempo;
    }

    const dt = Math.min(
      (tempo - jogo.ultimoTempo) / 1000,
      0.05
    );

    jogo.ultimoTempo = tempo;

    if (jogo.acelerando) {

      jogo.velocidade += config.aceleracao * dt;

    } else if (jogo.freando) {

      jogo.velocidade -= config.desaceleracao * dt;

    } else {

      jogo.velocidade -= config.freioNatural * dt;

    }

    jogo.velocidade = Math.max(
      0,
      Math.min(jogo.velocidade, config.velocidadeMaxima)
    );

    jogo.distancia += jogo.velocidade * dt;

    // Atualização da composição
    desenhar();

    atualizarPainel();

    // Chegada à estação inferior
    if (jogo.distancia >= comprimentoTotal) {

      jogo.distancia = comprimentoTotal;
      jogo.velocidade = 0;
      jogo.acelerando = false;
      jogo.freando = false;
      jogo.destino = true;

      desenhar();

      status.textContent =
        'MISSÃO CONCLUÍDA - CHEGADA À ESTAÇÃO INFERIOR!';

      jogo.animacao = null;
      return;
    }

    jogo.animacao = requestAnimationFrame(atualizar);
  }

  // ==========================================
  // PAINEL DE INFORMAÇÕES
  // ==========================================

  function atualizarPainel() {

    status.textContent =
      'MISSÃO EM ANDAMENTO | VELOCIDADE: ' +
      Math.round(jogo.velocidade) +
      ' km/h';
  }

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  function iniciarSimulador() {

    prepararCanvas();
    criarControles();

    jogo.distancia = 240;
    jogo.velocidade = 0;

    if (missao) {
      missao.textContent = 'MISSÃO 01';
    }

    desenhar();

    status.textContent =
      'LOCOMOTIVA PARADA NA ESTAÇÃO SUPERIOR.';

    console.log('Simulador ferroviário preparado.');
    console.log('Extensão do percurso:', comprimentoTotal);
  }

  imagem.addEventListener('load', iniciarSimulador);

  imagem.addEventListener('error', () => {
    status.textContent =
      'ERRO: NÃO FOI POSSÍVEL CARREGAR O CENÁRIO.';
  });

  if (imagem.complete && imagem.naturalWidth) {
    iniciarSimulador();
  }

  window.SimulandoConducao = {
    jogo,
    trilho,
    iniciarMissao,
    desenhar
  };

})();
