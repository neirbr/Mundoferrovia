
/* ==========================================
   MUNDO FERROVIÁRIO
   SIMULANDO CONDUÇÃO 2D
   CABINE DE CONDUÇÃO
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

  if (window.SimulandoConducaoIniciado) return;
  window.SimulandoConducaoIniciado = true;

  const ctx = canvas.getContext('2d');

  // ==========================================
  // CONFIGURAÇÕES
  // ==========================================

  const jogo = {
    iniciado: false,
    velocidade: 0,
    distancia: 0,
    direcao: 'N',
    ponto: 0,
    freio: 0,
    emergencia: false,
    destino: false,
    ultimoTempo: 0,
    animacao: null
  };

  const config = {
    velocidadePontos: [
      0, 10, 20, 28, 38, 48, 58, 68, 80
    ],
    aceleracao: 4.5,
    freioNatural: 1.2,
    desaceleracaoReducao: 2.5,
    espacamento: 43
  };

  let inicializado = false;
  let contextoAudio = null;
  let osciladoresBuzina = [];
  let ganhoBuzina = null;
  let temporizadorEmergencia = null;

  // ==========================================
  // PERCURSO FERROVIÁRIO
  // Coordenadas originais 1050x1536
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
  // CÁLCULO DO PERCURSO
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
  // ESTILOS DA CABINE
  // ==========================================

  function prepararEstilos() {

    if (document.getElementById('estilosCabineMF')) return;

    const estilo = document.createElement('style');
    estilo.id = 'estilosCabineMF';

    estilo.textContent = `
      #area-botoes.controles-cabine-mf {
        width: 100%;
        display: grid;
        grid-template-columns: 0.9fr 1fr 1fr 1.7fr 1.1fr;
        align-items: center;
        justify-items: center;
        gap: 3px;
        padding: 8px 3px;
        box-sizing: border-box;
        overflow: visible;
      }

      .mf-controle {
        min-width: 0;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        color: #102b3f;
        font-family: Arial, sans-serif;
      }

      .mf-controle-label {
        font-size: 9px;
        font-weight: bold;
        text-align: center;
        white-space: nowrap;
        color: #102b3f;
      }

      .mf-circulo {
        width: 50px;
        height: 50px;
        min-width: 50px;
        border-radius: 50%;
        border: 2px solid #f0b323;
        background: #102b3f;
        color: #f0b323;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: bold;
        padding: 0;
        box-sizing: border-box;
        touch-action: manipulation;
      }

      .mf-seta {
        display: block;
        width: 34px;
        height: 23px;
        border: 0;
        padding: 0;
        background: transparent;
        color: #102b3f;
        font-family: Arial, sans-serif;
        font-size: 23px;
        font-weight: 900;
        line-height: 23px;
        text-align: center;
        cursor: pointer;
        touch-action: manipulation;
      }

      .mf-seta:disabled,
      .mf-circulo:disabled {
        opacity: 0.35;
      }

      .mf-selecao {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1px;
      }

      .mf-freio-area {
        width: 100%;
        max-width: 115px;
        height: 58px;
        display: flex;
        align-items: center;
        touch-action: none;
        cursor: grab;
      }

      .mf-freio-trilho {
        position: relative;
        width: 100%;
        height: 18px;
        border-radius: 10px;
        background: #aeb9c1;
        border: 2px solid #102b3f;
        box-sizing: border-box;
      }

      .mf-freio-progresso {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 0%;
        border-radius: 10px;
        background: #f0b323;
      }

      .mf-freio-manopla {
        position: absolute;
        top: 50%;
        left: 0%;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #102b3f;
        border: 3px solid #f0b323;
        transform: translate(-50%, -50%);
        box-sizing: border-box;
      }

      .mf-freio-area.bloqueado {
        opacity: 0.35;
      }

      .mf-cabine-bloqueada .mf-seta,
      .mf-cabine-bloqueada .mf-buzina {
        opacity: 0.35;
        pointer-events: none;
      }

      .mf-emergencia-ativa {
        animation: mf-piscar 0.7s infinite alternate;
      }

      @keyframes mf-piscar {
        from { box-shadow: 0 0 0 0 #d32f2f; }
        to { box-shadow: 0 0 12px 5px #d32f2f; }
      }

      @media (max-width: 380px) {
        .mf-circulo {
          width: 44px;
          height: 44px;
          min-width: 44px;
          font-size: 20px;
        }

        .mf-controle-label {
          font-size: 8px;
        }

        .mf-seta {
          font-size: 21px;
          height: 22px;
          line-height: 22px;
        }

        .mf-freio-area {
          max-width: 100px;
          height: 54px;
        }

        .mf-freio-manopla {
          width: 29px;
          height: 29px;
        }
      }
    `;

    document.head.appendChild(estilo);
  }

  // ==========================================
  // MONTAR OS CONTROLES
  // ==========================================

  function criarControles() {

    prepararEstilos();

    botoes.classList.add('controles-cabine-mf');

    botoes.innerHTML = `
      <div class="mf-controle">
        <span class="mf-controle-label">BUZINA</span>
        <button
          type="button"
          id="mfBuzina"
          class="mf-circulo mf-buzina"
          aria-label="Buzina"
        >♬</button>
      </div>

      <div class="mf-controle">
        <span class="mf-controle-label">DIREÇÃO</span>
        <div class="mf-selecao">
          <button type="button" id="mfDirecaoCima" class="mf-seta">▲</button>
          <div id="mfDirecao" class="mf-circulo">N</div>
          <button type="button" id="mfDirecaoBaixo" class="mf-seta">▼</button>
        </div>
      </div>

      <div class="mf-controle">
        <span class="mf-controle-label">POTÊNCIA</span>
        <div class="mf-selecao">
          <button type="button" id="mfPontoCima" class="mf-seta">▲</button>
          <div id="mfPonto" class="mf-circulo">0</div>
          <button type="button" id="mfPontoBaixo" class="mf-seta">▼</button>
        </div>
      </div>

      <div class="mf-controle">
        <span class="mf-controle-label">FREIO</span>
        <div
          id="mfFreioArea"
          class="mf-freio-area"
          role="slider"
          aria-label="Aplicação do freio"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="0"
          tabindex="0"
        >
          <div class="mf-freio-trilho">
            <div id="mfFreioProgresso" class="mf-freio-progresso"></div>
            <div id="mfFreioManopla" class="mf-freio-manopla"></div>
          </div>
        </div>
      </div>

      <div class="mf-controle">
        <span class="mf-controle-label">EMERGÊNCIA</span>
        <button
          type="button"
          id="mfEmergencia"
          class="mf-circulo"
          aria-label="Recuperar emergência"
        >!</button>
      </div>
    `;

    ligarEventosControles();
    atualizarVisualControles();
  }

  // ==========================================
  // SELETORA DE DIREÇÃO
  // ==========================================

  function mudarDirecao(sentido) {

    if (jogo.emergencia || jogo.destino) return;

    if (jogo.velocidade > 0.5) {
      status.textContent =
        'AGUARDE A PARADA COMPLETA PARA MUDAR A DIREÇÃO.';
      return;
    }

    if (jogo.direcao === 'N') {

      jogo.direcao = sentido;

    } else if (
      (jogo.direcao === 'F' && sentido === 'R') ||
      (jogo.direcao === 'R' && sentido === 'F')
    ) {

      jogo.direcao = 'N';

    }

    atualizarVisualControles();
    atualizarStatus();
  }

  // ==========================================
  // ACELERAÇÃO
  // ==========================================

  function alterarPonto(valor) {

    if (jogo.emergencia || jogo.destino) return;

    jogo.ponto = Math.max(
      0,
      Math.min(8, jogo.ponto + valor)
    );

    atualizarVisualControles();
    atualizarStatus();
  }

  // ==========================================
  // BUZINA
  // ==========================================

  function ligarBuzina() {

    if (jogo.emergencia || jogo.destino) return;
    if (osciladoresBuzina.length > 0) return;

    try {

      const AudioCtx =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioCtx) return;

      if (!contextoAudio) {
        contextoAudio = new AudioCtx();
      }

      if (contextoAudio.state === 'suspended') {
        contextoAudio.resume();
      }

      ganhoBuzina = contextoAudio.createGain();
      ganhoBuzina.gain.value = 0.08;
      ganhoBuzina.connect(contextoAudio.destination);

      [392, 494].forEach(frequencia => {

        const oscilador = contextoAudio.createOscillator();

        oscilador.type = 'sawtooth';
        oscilador.frequency.value = frequencia;
        oscilador.connect(ganhoBuzina);
        oscilador.start();

        osciladoresBuzina.push(oscilador);
      });

    } catch (erro) {
      console.error('Não foi possível iniciar a buzina.', erro);
    }
  }

  function desligarBuzina() {

    osciladoresBuzina.forEach(oscilador => {
      try {
        oscilador.stop();
      } catch (erro) {}
    });

    osciladoresBuzina = [];

    if (ganhoBuzina) {
      ganhoBuzina.disconnect();
      ganhoBuzina = null;
    }
  }

  // ==========================================
  // FREIO HORIZONTAL
  // 0 A 90 = APLICAÇÃO NORMAL
  // 91 A 100 = EMERGÊNCIA
  // ==========================================

  function aplicarFreio(valor) {

    if (jogo.emergencia || jogo.destino) return;

    jogo.freio = Math.max(
      0,
      Math.min(100, Math.round(valor))
    );

    atualizarVisualFreio();

    if (jogo.freio > 90) {
      acionarEmergencia();
    }
  }

  function atualizarVisualFreio() {

    const progresso = document.getElementById('mfFreioProgresso');
    const manopla = document.getElementById('mfFreioManopla');
    const area = document.getElementById('mfFreioArea');

    if (!progresso || !manopla || !area) return;

    progresso.style.width = jogo.freio + '%';
    manopla.style.left = jogo.freio + '%';

    area.setAttribute('aria-valuenow', jogo.freio);
    area.classList.toggle('bloqueado', jogo.emergencia);
  }

  function ligarArrasteFreio() {

    const area = document.getElementById('mfFreioArea');
    if (!area) return;

    let arrastando = false;

    function calcularValor(evento) {

      const trilhoFreio = area.querySelector('.mf-freio-trilho');
      const retangulo = trilhoFreio.getBoundingClientRect();

      const posicao = Math.max(
        0,
        Math.min(1, (evento.clientX - retangulo.left) / retangulo.width)
      );

      aplicarFreio(posicao * 100);
    }

    area.addEventListener('pointerdown', evento => {

      if (jogo.emergencia || jogo.destino) return;

      evento.preventDefault();

      arrastando = true;
      area.setPointerCapture(evento.pointerId);

      calcularValor(evento);
    });

    area.addEventListener('pointermove', evento => {

      if (!arrastando) return;

      calcularValor(evento);
    });

    function pararArraste() {
      arrastando = false;
    }

    area.addEventListener('pointerup', pararArraste);
    area.addEventListener('pointercancel', pararArraste);
    area.addEventListener('lostpointercapture', pararArraste);

    area.addEventListener('keydown', evento => {

      if (jogo.emergencia) return;

      if (evento.key === 'ArrowRight') {
        evento.preventDefault();
        aplicarFreio(jogo.freio + 2);
      }

      if (evento.key === 'ArrowLeft') {
        evento.preventDefault();
        aplicarFreio(jogo.freio - 2);
      }
    });
  }

  // ==========================================
  // EMERGÊNCIA
  // ==========================================

  function acionarEmergencia() {

    if (jogo.emergencia) return;

    jogo.emergencia = true;
    jogo.freio = 100;
    jogo.ponto = 0;

    desligarBuzina();

    status.textContent =
      'EMERGÊNCIA ATIVADA! SEGURE O BOTÃO DE EMERGÊNCIA POR 10 SEGUNDOS PARA RECUPERAR.';

    atualizarVisualControles();
    atualizarVisualFreio();
  }

  function iniciarRecuperacaoEmergencia() {

    if (!jogo.emergencia || temporizadorEmergencia) return;

    const botao = document.getElementById('mfEmergencia');

    if (botao) {
      botao.textContent = '10';
      botao.classList.add('mf-emergencia-ativa');
    }

    let restante = 10;

    temporizadorEmergencia = setInterval(() => {

      restante--;

      if (botao) {
        botao.textContent = restante > 0 ? restante : '!';
      }

      if (restante <= 0) {

        clearInterval(temporizadorEmergencia);
        temporizadorEmergencia = null;

        jogo.emergencia = false;
        jogo.freio = 0;
        jogo.ponto = 0;
        jogo.direcao = 'N';

        if (botao) {
          botao.classList.remove('mf-emergencia-ativa');
        }

        atualizarVisualControles();
        atualizarVisualFreio();

        status.textContent =
          'EMERGÊNCIA RECUPERADA. FREIOS ALIVIADOS. SELECIONE A DIREÇÃO E A POTÊNCIA PARA PARTIR.';
      }

    }, 1000);
  }

  function cancelarRecuperacaoEmergencia() {

    if (!temporizadorEmergencia) return;

    clearInterval(temporizadorEmergencia);
    temporizadorEmergencia = null;

    const botao = document.getElementById('mfEmergencia');

    if (botao) {
      botao.textContent = '!';
      botao.classList.remove('mf-emergencia-ativa');
    }
  }

  // ==========================================
  // EVENTOS DOS CONTROLES
  // ==========================================

  function ligarEventosControles() {

    const buzina = document.getElementById('mfBuzina');
    const direcaoCima = document.getElementById('mfDirecaoCima');
    const direcaoBaixo = document.getElementById('mfDirecaoBaixo');
    const pontoCima = document.getElementById('mfPontoCima');
    const pontoBaixo = document.getElementById('mfPontoBaixo');
    const emergencia = document.getElementById('mfEmergencia');

    buzina.addEventListener('pointerdown', evento => {
      evento.preventDefault();
      ligarBuzina();
    });

    buzina.addEventListener('pointerup', desligarBuzina);
    buzina.addEventListener('pointerleave', desligarBuzina);
    buzina.addEventListener('pointercancel', desligarBuzina);

    direcaoCima.addEventListener('click', () => {
      mudarDirecao('F');
    });

    direcaoBaixo.addEventListener('click', () => {
      mudarDirecao('R');
    });

    pontoCima.addEventListener('click', () => {
      alterarPonto(1);
    });

    pontoBaixo.addEventListener('click', () => {
      alterarPonto(-1);
    });

    emergencia.addEventListener('pointerdown', evento => {
      evento.preventDefault();
      iniciarRecuperacaoEmergencia();
    });

    emergencia.addEventListener('pointerup', cancelarRecuperacaoEmergencia);
    emergencia.addEventListener('pointerleave', cancelarRecuperacaoEmergencia);
    emergencia.addEventListener('pointercancel', cancelarRecuperacaoEmergencia);

    ligarArrasteFreio();
  }

  // ==========================================
  // ATUALIZAR VISUAL DOS CONTROLES
  // ==========================================

  function atualizarVisualControles() {

    const direcao = document.getElementById('mfDirecao');
    const ponto = document.getElementById('mfPonto');
    const emergencia = document.getElementById('mfEmergencia');

    if (direcao) {
      direcao.textContent = jogo.direcao;
    }

    if (ponto) {
      ponto.textContent = jogo.ponto;
    }

    if (emergencia) {
      emergencia.classList.toggle(
        'mf-emergencia-ativa',
        jogo.emergencia
      );

      emergencia.textContent = jogo.emergencia ? '!' : '!';
    }

    botoes.classList.toggle(
      'mf-cabine-bloqueada',
      jogo.emergencia
    );

    const areaFreio = document.getElementById('mfFreioArea');

    if (areaFreio) {
      areaFreio.classList.toggle('bloqueado', jogo.emergencia);
    }
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

    // Cabine
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

    const sentido = jogo.direcao === 'R' ? -1 : 1;
    const giro = sentido === -1 ? Math.PI : 0;

    function desenharVeiculoNaLinha(distancia, tipo) {

      const posicao = obterPosicao(distancia);

      desenharVeiculo(
        posicao.x,
        posicao.y - 18,
        posicao.angulo + giro,
        tipo
      );
    }

    desenharVeiculoNaLinha(
      jogo.distancia,
      'locomotiva'
    );

    for (let i = 1; i <= 4; i++) {

      const distanciaVagao =
        jogo.distancia - sentido * config.espacamento * i;

      if (
        distanciaVagao < 0 ||
        distanciaVagao > comprimentoTotal
      ) continue;

      desenharVeiculoNaLinha(
        distanciaVagao,
        'vagao'
      );
    }
  }

  // ==========================================
  // DESENHO GERAL
  // ==========================================

  function desenhar() {

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.save();

    ctx.scale(
      canvas.width / 1050,
      canvas.height / 1536
    );

    desenharComposicao();

    ctx.restore();
  }

  // ==========================================
  // PREPARAÇÃO DO CANVAS
  // ==========================================

  function prepararCanvas() {

    const cenario = document.getElementById('cenario');

    if (!cenario) return;

    cenario.style.position = 'relative';

    imagem.style.display = 'block';
    imagem.style.width = '100%';
    imagem.style.height = 'auto';
    imagem.style.objectFit = 'initial';
    imagem.style.margin = '0';

    function ajustarCanvas() {

      if (!imagem.naturalWidth) return;

      const area = cenario.getBoundingClientRect();
      const foto = imagem.getBoundingClientRect();

      canvas.width = imagem.naturalWidth;
      canvas.height = imagem.naturalHeight;

      canvas.style.position = 'absolute';
      canvas.style.left = `${foto.left - area.left}px`;
      canvas.style.top = `${foto.top - area.top}px`;
      canvas.style.width = `${foto.width}px`;
      canvas.style.height = `${foto.height}px`;
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '10';

      desenhar();
    }

    ajustarCanvas();

    window.addEventListener('resize', ajustarCanvas);
  }

  // ==========================================
  // FRENAGEM PROGRESSIVA
  // ==========================================

  function obterDesaceleracaoFreio() {

    if (jogo.emergencia) return 45;

    const psi = Math.min(jogo.freio, 90);

    if (psi <= 0) return 0;

    if (psi <= 40) {
      return 2.5 + (psi / 40) * 5.5;
    }

    if (psi <= 60) {
      return 8 + ((psi - 40) / 20) * 8;
    }

    return 16 + ((psi - 60) / 30) * 19;
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

    const velocidadeSolicitada =
      config.velocidadePontos[jogo.ponto];

    const desaceleracaoFreio = obterDesaceleracaoFreio();

    if (desaceleracaoFreio > 0) {

      jogo.velocidade -= desaceleracaoFreio * dt;

    } else if (
      jogo.direcao !== 'N' &&
      jogo.ponto > 0
    ) {

      if (jogo.velocidade < velocidadeSolicitada) {

        jogo.velocidade += config.aceleracao * dt;

        jogo.velocidade = Math.min(
          jogo.velocidade,
          velocidadeSolicitada
        );

      } else if (jogo.velocidade > velocidadeSolicitada) {

        jogo.velocidade -= config.desaceleracaoReducao * dt;

      }

    } else {

      jogo.velocidade -= config.freioNatural * dt;

    }

    jogo.velocidade = Math.max(0, jogo.velocidade);

    const sentido = jogo.direcao === 'R' ? -1 : 1;

    if (jogo.velocidade > 0) {
      jogo.distancia += jogo.velocidade * dt * sentido;
    }

    // Limites do percurso
    if (jogo.distancia >= comprimentoTotal) {

      jogo.distancia = comprimentoTotal;
      finalizarMissao('MISSÃO CONCLUÍDA - CHEGADA À ESTAÇÃO INFERIOR!');
      return;
    }

    if (jogo.distancia <= 0) {

      jogo.distancia = 0;
      finalizarMissao('MISSÃO CONCLUÍDA - CHEGADA À ESTAÇÃO SUPERIOR!');
      return;
    }

    desenhar();
    atualizarStatus();

    jogo.animacao = requestAnimationFrame(atualizar);
  }

  // ==========================================
  // STATUS DA OPERAÇÃO
  // ==========================================

  function atualizarStatus() {

    if (jogo.emergencia) {
      status.textContent =
        'EMERGÊNCIA ATIVADA! SEGURE O BOTÃO DE EMERGÊNCIA POR 10 SEGUNDOS.';
      return;
    }

    const nomes = {
      N: 'NEUTRO',
      F: 'FRENTE',
      R: 'RÉ'
    };

    status.textContent =
      'DIREÇÃO: ' + nomes[jogo.direcao] +
      ' | PONTO: ' + jogo.ponto +
      ' | VELOCIDADE: ' + Math.round(jogo.velocidade) + ' km/h';
  }

  // ==========================================
  // FINALIZAR MISSÃO
  // ==========================================

  function finalizarMissao(mensagem) {

    jogo.velocidade = 0;
    jogo.ponto = 0;
    jogo.freio = 0;
    jogo.direcao = 'N';
    jogo.destino = true;

    desenhar();
    atualizarVisualControles();
    atualizarVisualFreio();

    status.textContent = mensagem;

    jogo.animacao = null;
  }

  // ==========================================
  // INICIAR SIMULADOR
  // ==========================================

  function iniciarMissao() {

    if (jogo.iniciado || jogo.emergencia || jogo.destino) return;

    jogo.iniciado = true;
    jogo.ultimoTempo = 0;

    status.textContent =
      'SIMULADOR ATIVO. AGUARDANDO COMANDOS DE CONDUÇÃO.';

    if (!jogo.animacao) {
      jogo.animacao = requestAnimationFrame(atualizar);
    }
  }

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  function iniciarSimulador() {

    if (inicializado) return;
    if (!imagem.naturalWidth) return;

    inicializado = true;

    prepararCanvas();

    jogo.distancia = 240;
    jogo.velocidade = 0;
    jogo.direcao = 'N';
    jogo.ponto = 0;
    jogo.freio = 0;
    jogo.emergencia = false;
    jogo.iniciado = true;

    criarControles();

    if (missao) {
      missao.textContent = 'MISSÃO 01';
    }

    desenhar();
    atualizarVisualControles();
    atualizarVisualFreio();

    status.textContent =
      'LOCOMOTIVA PARADA. SELECIONE A DIREÇÃO E A POTÊNCIA.';

    jogo.ultimoTempo = 0;
    jogo.animacao = requestAnimationFrame(atualizar);
  }

  imagem.addEventListener('load', iniciarSimulador);

  imagem.addEventListener('error', () => {
    status.textContent =
      'ERRO: NÃO FOI POSSÍVEL CARREGAR O CENÁRIO.';
  });

  if (imagem.complete && imagem.naturalWidth > 0) {
    iniciarSimulador();
  }

  window.SimulandoConducao = {
    jogo,
    trilho,
    iniciarMissao,
    desenhar,
    acionarEmergencia
  };

})();
