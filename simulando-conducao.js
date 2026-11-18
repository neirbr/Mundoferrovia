

/* =========================================
   MUNDO FERROVIÁRIO
   SIMULANDO CONDUÇÃO 2D
   ========================================= */

(() => {
  'use strict';

  // ELEMENTOS PRINCIPAIS
  const imagem = document.getElementById('imagemCenario');
  const canvas = document.getElementById('camadaJogo');
  const status = document.getElementById('status-operacao');
  const areaBotoes = document.getElementById('area-botoes');
  const missao = document.getElementById('missao');

  if (!imagem || !canvas || !status || !areaBotoes) {
    console.error('Elementos do simulador não encontrados.');
    return;
  }

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('Não foi possível iniciar o Canvas.');
    return;
  }

  // ESTADO DO SIMULADOR
  const jogo = {
    iniciado: false,
    pausado: false,
    velocidade: 0,
    aceleracao: 0,
    freio: 0,
    missaoAtual: 1,
    locomotiva: null,
    vagoes: [],
    animacao: null
  };

  // CONFIGURAÇÕES DO CENÁRIO
  const cenario = {
    largura: 0,
    altura: 0,
    carregado: false
  };

  // PREPARAÇÃO DO CANVAS
  function prepararCanvas() {

    if (!imagem.complete || !imagem.naturalWidth) {
      return;
    }

    cenario.largura = imagem.naturalWidth;
    cenario.altura = imagem.naturalHeight;

    canvas.width = cenario.largura;
    canvas.height = cenario.altura;

    cenario.carregado = true;

    desenhar();

    console.log('Cenário ferroviário carregado.');
    console.log(
      'Resolução:',
      cenario.largura,
      'x',
      cenario.altura
    );
  }

  // DESENHO DOS ELEMENTOS DO JOGO
  function desenhar() {

    if (!cenario.carregado) return;

    // Limpa somente a camada do jogo.
    // A imagem original permanece intacta.
    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    desenharElementos();

  }

  // ÁREA RESERVADA PARA A COMPOSIÇÃO
  function desenharElementos() {

    // As posições da locomotiva e dos vagões
    // serão definidas conforme os trilhos reais
    // da imagem original.

    if (jogo.locomotiva) {
      desenharVeiculo(jogo.locomotiva);
    }

    jogo.vagoes.forEach(vagao => {
      desenharVeiculo(vagao);
    });

  }

  // DESENHO INDIVIDUAL DOS VEÍCULOS
  function desenharVeiculo(veiculo) {

    if (!veiculo) return;

    ctx.save();

    ctx.translate(veiculo.x, veiculo.y);
    ctx.rotate(veiculo.angulo || 0);

    ctx.fillStyle = veiculo.cor || '#173b52';

    ctx.fillRect(
      -veiculo.largura / 2,
      -veiculo.altura / 2,
      veiculo.largura,
      veiculo.altura
    );

    ctx.restore();

  }

  // CRIAÇÃO DOS CONTROLES
  function criarControles() {

    areaBotoes.innerHTML = '';

    const botaoIniciar = document.createElement('button');

    botaoIniciar.id = 'botaoIniciar';
    botaoIniciar.type = 'button';
    botaoIniciar.textContent = 'INICIAR MISSÃO';

    botaoIniciar.addEventListener('click', iniciarMissao);

    areaBotoes.appendChild(botaoIniciar);

  }

  // INICIAR MISSÃO
  function iniciarMissao() {

    if (!cenario.carregado) {
      atualizarStatus('Aguardando carregamento do cenário.');
      return;
    }

    if (jogo.iniciado) return;

    jogo.iniciado = true;

    atualizarStatus(
      'MISSÃO 01 INICIADA - PREPARAÇÃO DA OPERAÇÃO.'
    );

    missao.textContent = 'MISSÃO 01';

    const botao = document.getElementById('botaoIniciar');

    if (botao) {
      botao.disabled = true;
      botao.textContent = 'MISSÃO EM ANDAMENTO';
    }

    console.log('Missão iniciada.');
  }

  // ATUALIZAÇÃO DO PAINEL
  function atualizarStatus(mensagem) {
    status.textContent = mensagem;
  }

  // CARREGAMENTO DO CENÁRIO
  function iniciarSimulador() {

    if (!imagem.complete || !imagem.naturalWidth) {
      atualizarStatus('Carregando cenário ferroviário...');
      return;
    }

    prepararCanvas();
    criarControles();

    atualizarStatus(
      'CENÁRIO CARREGADO - AGUARDANDO INÍCIO DA MISSÃO.'
    );

  }

  // EVENTOS DA IMAGEM
  imagem.addEventListener('load', iniciarSimulador);

  imagem.addEventListener('error', () => {
    atualizarStatus(
      'ERRO AO CARREGAR A IMAGEM DO CENÁRIO.'
    );

    console.error('Verifique o caminho da imagem.');
  });

  // INICIALIZAÇÃO
  if (imagem.complete && imagem.naturalWidth) {
    iniciarSimulador();
  }

  // ACESSO AO ESTADO DO JOGO
  window.SimulandoConducao = {
    jogo,
    cenario,
    desenhar,
    atualizarStatus
  };

})();
