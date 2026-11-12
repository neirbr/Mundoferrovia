
// ============================================
// MUNDO FERROVIÁRIO - DESAFIO FERROVIÁRIO
// 30 cenários: Básico, Médio e Avançado
// ============================================

const DESAFIOS = {

  basico: [
    {
      title: "Atenção à movimentação",
      description: "Você está em uma área ferroviária e percebe uma composição se aproximando. Qual deve ser sua atitude?",
      options: [
        "Atravessar rapidamente os trilhos.",
        "Manter distância segura e observar as orientações de segurança.",
        "Passar entre os vagões."
      ],
      correctIndex: 1,
      explanation: "Manter distância e respeitar as orientações de segurança é fundamental. Nunca atravesse uma linha sem autorização e condições seguras."
    },
    {
      title: "Equipamento de proteção",
      description: "Antes de iniciar uma atividade na área ferroviária, você percebe que está sem um equipamento de proteção exigido para aquela tarefa.",
      options: [
        "Iniciar a atividade mesmo assim.",
        "Pedir emprestado qualquer equipamento, sem verificar sua condição.",
        "Não iniciar a atividade e providenciar o equipamento adequado."
      ],
      correctIndex: 2,
      explanation: "Os equipamentos de proteção devem ser adequados à atividade e estar em boas condições. Não se deve iniciar uma tarefa sem cumprir os requisitos de segurança."
    },
    {
      title: "Comunicação operacional",
      description: "Durante uma atividade, você recebe uma orientação que não ficou clara. O que fazer?",
      options: [
        "Solicitar esclarecimento antes de agir.",
        "Tentar adivinhar o que foi solicitado.",
        "Executar a atividade da maneira que achar melhor."
      ],
      correctIndex: 0,
      explanation: "A comunicação clara é essencial no ambiente ferroviário. Em caso de dúvida, confirme a orientação antes de qualquer ação."
    },
    {
      title: "Objeto na linha",
      description: "Você observa um objeto próximo aos trilhos que pode representar um risco à circulação.",
      options: [
        "Ignorar, pois provavelmente não oferece perigo.",
        "Retirar o objeto imediatamente, sem avaliar os riscos.",
        "Comunicar a situação pelos canais adequados e seguir as orientações recebidas."
      ],
      correctIndex: 2,
      explanation: "Uma condição potencialmente perigosa deve ser comunicada. Não realize intervenções sem autorização e avaliação dos riscos."
    },
    {
      title: "Condição climática",
      description: "Uma chuva forte começa durante uma atividade ferroviária. Qual é a melhor atitude?",
      options: [
        "Continuar normalmente, independentemente das condições.",
        "Avaliar as condições, comunicar possíveis riscos e seguir os procedimentos aplicáveis.",
        "Acelerar a atividade para terminar logo."
      ],
      correctIndex: 1,
      explanation: "Condições climáticas podem alterar os riscos de uma atividade. A segurança deve ser reavaliada conforme os procedimentos da empresa."
    },
    {
      title: "Sinalização ferroviária",
      description: "Você encontra uma sinalização cujo significado não conhece. Como deve proceder?",
      options: [
        "Consultar a orientação oficial ou uma pessoa habilitada antes de agir.",
        "Ignorar a sinalização.",
        "Seguir o que outras pessoas parecem estar fazendo."
      ],
      correctIndex: 0,
      explanation: "A sinalização deve ser compreendida e respeitada. Nunca tome decisões operacionais com base em suposições."
    },
    {
      title: "Área restrita",
      description: "Um colega convida você a entrar em uma área ferroviária restrita sem autorização.",
      options: [
        "Entrar apenas por alguns minutos.",
        "Acompanhar o colega porque ele já conhece o local.",
        "Não entrar e respeitar as regras de acesso."
      ],
      correctIndex: 2,
      explanation: "Áreas restritas possuem controles de acesso por razões de segurança. A entrada depende de autorização e cumprimento dos requisitos aplicáveis."
    },
    {
      title: "Identificação de risco",
      description: "Você percebe um vazamento próximo a um equipamento ferroviário.",
      options: [
        "Tocar no líquido para descobrir o que é.",
        "Manter distância, evitar contato e comunicar imediatamente a situação.",
        "Lavar o local sem consultar ninguém."
      ],
      correctIndex: 1,
      explanation: "Um vazamento pode envolver substâncias perigosas. Não toque nem tente resolver por conta própria. Comunique e siga o procedimento de emergência aplicável."
    },
    {
      title: "Trabalho em equipe",
      description: "Durante uma atividade em equipe, você percebe que um colega não recebeu uma informação importante.",
      options: [
        "Garantir que a informação seja comunicada e confirmada pelos canais adequados.",
        "Continuar a atividade sem se preocupar.",
        "Esperar que ele descubra sozinho."
      ],
      correctIndex: 0,
      explanation: "A comunicação entre os envolvidos reduz falhas e evita que uma pessoa execute uma atividade sem conhecer as informações necessárias."
    },
    {
      title: "Situação insegura",
      description: "Você percebe uma situação que pode colocar alguém em risco durante uma atividade ferroviária.",
      options: [
        "Não se envolver.",
        "Esperar o fim do turno para comentar.",
        "Comunicar imediatamente e seguir as orientações de segurança."
      ],
      correctIndex: 2,
      explanation: "A identificação e comunicação rápida de condições inseguras ajudam a prevenir acidentes. A segurança deve ser prioridade."
    }
  ],

  medio: [
    {
      title: "Informação divergente",
      description: "Durante uma atividade, duas orientações recebidas apresentam informações diferentes sobre a operação.",
      options: [
        "Escolher a orientação que parece mais fácil.",
        "Interromper a decisão até esclarecer a divergência com os responsáveis.",
        "Executar as duas orientações ao mesmo tempo."
      ],
      correctIndex: 1,
      explanation: "Informações divergentes precisam ser esclarecidas antes da execução. Não escolha uma orientação por conta própria."
    },
    {
      title: "Vagão com avaria",
      description: "Você identifica uma avaria em um vagão que está previsto para seguir em uma composição.",
      options: [
        "Não considerar a avaria se o vagão estiver aparentemente carregado corretamente.",
        "Liberar o vagão para evitar atraso.",
        "Comunicar a avaria e aguardar avaliação e decisão dos responsáveis."
      ],
      correctIndex: 2,
      explanation: "A condição do vagão precisa ser avaliada por pessoal competente, conforme os critérios e procedimentos aplicáveis. Não se deve liberar um veículo com possível avaria por iniciativa própria."
    },
    {
      title: "Mudança de planejamento",
      description: "Uma alteração de planejamento é informada enquanto uma atividade já está em andamento.",
      options: [
        "Confirmar a nova orientação, seus impactos e as condições para prosseguir.",
        "Ignorar a mudança e manter o plano antigo.",
        "Modificar a atividade sem comunicar a equipe."
      ],
      correctIndex: 0,
      explanation: "Mudanças operacionais precisam ser comunicadas e compreendidas por todos os envolvidos antes de qualquer execução."
    },
    {
      title: "Falha de comunicação",
      description: "Durante uma atividade, você percebe que uma mensagem importante não foi confirmada pelo destinatário.",
      options: [
        "Considerar que a mensagem foi recebida.",
        "Repetir a comunicação pelo meio previsto e obter confirmação.",
        "Pedir a outra pessoa que suponha o conteúdo."
      ],
      correctIndex: 1,
      explanation: "Mensagens importantes devem ser confirmadas. A ausência de confirmação não significa que a informação foi compreendida."
    },
    {
      title: "Equipamento com defeito",
      description: "Um equipamento necessário para uma atividade apresenta funcionamento irregular.",
      options: [
        "Continuar utilizando até parar completamente.",
        "Tentar improvisar um reparo sem autorização.",
        "Retirar de uso conforme o procedimento, comunicar e solicitar avaliação."
      ],
      correctIndex: 2,
      explanation: "Equipamentos com funcionamento irregular podem representar riscos. A situação deve ser comunicada e avaliada por profissionais habilitados."
    },
    {
      title: "Presença de pessoas na área",
      description: "Você percebe pessoas não autorizadas próximas a uma área de movimentação ferroviária.",
      options: [
        "Comunicar a situação e seguir o protocolo de proteção da área.",
        "Continuar a atividade normalmente.",
        "Tentar resolver sozinho, aproximando-se da movimentação."
      ],
      correctIndex: 0,
      explanation: "A presença de pessoas não autorizadas exige atenção e comunicação imediata. A proteção da área deve seguir os procedimentos oficiais."
    },
    {
      title: "Registro de ocorrência",
      description: "Uma ocorrência foi resolvida, mas você percebe que ela ainda não foi registrada.",
      options: [
        "Deixar sem registro porque já foi resolvida.",
        "Registrar os fatos de forma clara e conforme o procedimento da empresa.",
        "Alterar informações para evitar questionamentos."
      ],
      correctIndex: 1,
      explanation: "O registro correto permite rastreabilidade, análise e prevenção de novas ocorrências. As informações devem ser verdadeiras e completas."
    },
    {
      title: "Condição de visibilidade",
      description: "A visibilidade na área ferroviária diminui bastante devido à neblina.",
      options: [
        "Manter o ritmo normal sem comunicar ninguém.",
        "Confiar apenas na percepção visual.",
        "Comunicar a condição e seguir os procedimentos específicos para baixa visibilidade."
      ],
      correctIndex: 2,
      explanation: "A baixa visibilidade modifica as condições de risco. Devem ser aplicadas as orientações oficiais para aquela situação."
    },
    {
      title: "Dúvida sobre autorização",
      description: "Uma atividade depende de autorização, mas você não consegue confirmar se ela foi concedida.",
      options: [
        "Aguardar a confirmação formal antes de iniciar.",
        "Iniciar porque ninguém proibiu expressamente.",
        "Considerar a autorização concedida verbalmente por terceiros."
      ],
      correctIndex: 0,
      explanation: "Atividades que exigem autorização só devem começar após a confirmação conforme o processo oficial. Ausência de proibição não significa autorização."
    },
    {
      title: "Quase acidente",
      description: "Durante o turno, ocorre uma situação que quase provoca um acidente, mas ninguém se machuca.",
      options: [
        "Não comunicar porque não houve feridos.",
        "Comunicar e registrar o quase acidente conforme as regras aplicáveis.",
        "Comentar apenas informalmente com os colegas."
      ],
      correctIndex: 1,
      explanation: "Quase acidentes são oportunidades importantes de prevenção. O registro ajuda a identificar causas e evitar ocorrências futuras."
    }
  ],

  avancado: [
    {
      title: "Risco não previsto",
      description: "Durante uma atividade planejada, surge uma condição de risco que não estava contemplada na avaliação inicial.",
      options: [
        "Continuar para não atrasar o planejamento.",
        "Improvisar uma solução e prosseguir.",
        "Reavaliar a atividade, comunicar os responsáveis e aguardar as orientações necessárias."
      ],
      correctIndex: 2,
      explanation: "Uma mudança nas condições exige nova avaliação de risco. O planejamento original não deve ser seguido cegamente quando a realidade muda."
    },
    {
      title: "Conflito de informações",
      description: "Dois canais de comunicação apresentam instruções operacionais incompatíveis.",
      options: [
        "Priorizar a informação confirmada pela autoridade responsável, esclarecendo o conflito antes de agir.",
        "Escolher a mensagem mais recente sem verificar sua origem.",
        "Executar a instrução que exige menos tempo."
      ],
      correctIndex: 0,
      explanation: "A origem e a validade das instruções precisam ser confirmadas. Conflitos de comunicação não podem ser resolvidos por suposição."
    },
    {
      title: "Indício de falha estrutural",
      description: "Durante uma inspeção visual, você identifica uma possível anomalia em um componente de infraestrutura ferroviária.",
      options: [
        "Ignorar se a circulação ainda estiver acontecendo.",
        "Comunicar imediatamente a localização e as características observadas para avaliação técnica.",
        "Realizar uma intervenção sem autorização."
      ],
      correctIndex: 1,
      explanation: "Possíveis anomalias de infraestrutura devem ser comunicadas com informações precisas para avaliação por profissionais responsáveis."
    },
    {
      title: "Pressão por produtividade",
      description: "A equipe recebe pressão para concluir uma atividade rapidamente, embora existam etapas de segurança ainda não confirmadas.",
      options: [
        "Pular as etapas para cumprir o prazo.",
        "Delegar as verificações a alguém sem preparo.",
        "Manter os requisitos de segurança e comunicar o impacto no planejamento."
      ],
      correctIndex: 2,
      explanation: "A produtividade não justifica eliminar etapas de segurança. Prazos devem ser ajustados quando necessário para preservar pessoas e equipamentos."
    },
    {
      title: "Ocorrência com carga",
      description: "Você observa uma possível irregularidade na condição de acondicionamento de uma carga ferroviária.",
      options: [
        "Comunicar a ocorrência e solicitar avaliação conforme os procedimentos de transporte e segurança.",
        "Tentar reposicionar a carga sem autorização.",
        "Liberar a composição porque a irregularidade parece pequena."
      ],
      correctIndex: 0,
      explanation: "Irregularidades na carga precisam ser avaliadas pelos responsáveis. Uma aparência de pequena gravidade não garante que a condição seja segura."
    },
    {
      title: "Falha em sistema de controle",
      description: "Um sistema utilizado para apoiar o controle da operação apresenta falha ou informação inconsistente.",
      options: [
        "Continuar usando os dados inconsistentes.",
        "Comunicar a falha e seguir o procedimento oficial de contingência.",
        "Criar registros paralelos sem informar a equipe."
      ],
      correctIndex: 1,
      explanation: "Falhas de sistemas exigem comunicação e aplicação do procedimento de contingência autorizado. Não se deve improvisar controles operacionais."
    },
    {
      title: "Ocorrências simultâneas",
      description: "Duas situações de risco são comunicadas quase ao mesmo tempo em pontos diferentes da área ferroviária.",
      options: [
        "Ignorar uma delas até resolver a primeira.",
        "Decidir sozinho qual situação merece atenção.",
        "Comunicar ambas imediatamente, informando localização e natureza dos riscos, e seguir a coordenação responsável."
      ],
      correctIndex: 2,
      explanation: "Ocorrências simultâneas exigem comunicação organizada e coordenação. Informações claras ajudam os responsáveis a definir as prioridades."
    },
    {
      title: "Mudança de equipe",
      description: "Durante a troca de turno, existem pendências operacionais e uma condição de risco ainda não resolvida.",
      options: [
        "Realizar uma passagem de serviço completa, destacando pendências, riscos e medidas adotadas.",
        "Informar apenas as tarefas concluídas.",
        "Deixar os registros para o próximo turno descobrir."
      ],
      correctIndex: 0,
      explanation: "A passagem de serviço deve transmitir informações relevantes, incluindo pendências e riscos. A continuidade segura depende de uma comunicação completa."
    },
    {
      title: "Decisão sob pressão",
      description: "Você precisa tomar conhecimento de uma situação urgente, mas ainda faltam informações essenciais para uma decisão segura.",
      options: [
        "Agir rapidamente com base na experiência pessoal.",
        "Buscar as informações necessárias, comunicar os responsáveis e seguir o protocolo aplicável.",
        "Esperar sem comunicar ninguém."
      ],
      correctIndex: 1,
      explanation: "A urgência não elimina a necessidade de informações confiáveis e comunicação. A resposta deve seguir os protocolos estabelecidos."
    },
    {
      title: "Cultura de segurança",
      description: "Um colega experiente sugere ignorar uma regra porque, segundo ele, sempre fez daquela maneira e nunca houve acidente.",
      options: [
        "Aceitar porque ele tem experiência.",
        "Repetir a prática para não criar conflito.",
        "Respeitar o procedimento oficial e comunicar a situação pelos canais adequados."
      ],
      correctIndex: 2,
      explanation: "A ausência de acidentes anteriores não torna uma prática segura. Procedimentos existem para controlar riscos e devem ser respeitados por todos."
    }
  ]
};

// ============================================
// ELEMENTOS DA PÁGINA
// ============================================

const challengeLevels = document.getElementById("challengeLevels");
const challengeIntro = document.getElementById("challengeIntro");
const levelTitle = document.getElementById("levelTitle");
const challengeGame = document.getElementById("challengeGame");
const challengeResult = document.getElementById("challengeResult");

const currentLevel = document.getElementById("currentLevel");
const questionCounter = document.getElementById("questionCounter");
const currentScore = document.getElementById("currentScore");
const challengeProgress = document.getElementById("challengeProgress");

const scenarioImage = document.getElementById("scenarioImage");
const scenarioTitle = document.getElementById("scenarioTitle");
const scenarioDescription = document.getElementById("scenarioDescription");
const scenarioOptions = document.getElementById("scenarioOptions");
const scenarioFeedback = document.getElementById("scenarioFeedback");

const nextChallenge = document.getElementById("nextChallenge");
const exitChallenge = document.getElementById("exitChallenge");

const resultLevel = document.getElementById("resultLevel");
const finalScore = document.getElementById("finalScore");
const resultMessage = document.getElementById("resultMessage");

const restartChallenge = document.getElementById("restartChallenge");
const backToLevels = document.getElementById("backToLevels");

// ============================================
// ESTADO DO JOGO
// ============================================

let nivelAtual = "";
let perguntaAtual = 0;
let pontuacao = 0;
let respostaRegistrada = false;

const nomesNiveis = {
  basico: "Básico",
  medio: "Médio",
  avancado: "Avançado"
};

// ============================================
// INICIAR NÍVEL
// ============================================

function iniciarDesafio(nivel) {
  if (!DESAFIOS[nivel]) return;

  nivelAtual = nivel;
  perguntaAtual = 0;
  pontuacao = 0;
  respostaRegistrada = false;

  challengeIntro.style.display = "none";
  challengeLevels.style.display = "none";
  levelTitle.style.display = "none";
  challengeResult.style.display = "none";
  challengeGame.style.display = "block";

  currentLevel.textContent = "Nível " + nomesNiveis[nivel];

  mostrarPergunta();

}

// ============================================
// MOSTRAR CENÁRIO
// ============================================

function mostrarPergunta() {
  const perguntas = DESAFIOS[nivelAtual];
  const pergunta = perguntas[perguntaAtual];

  respostaRegistrada = false;

  questionCounter.textContent =
    "Desafio " + (perguntaAtual + 1) + " de " + perguntas.length;

  currentScore.textContent = "Pontos: " + pontuacao;

  challengeProgress.style.width =
    (perguntaAtual / perguntas.length * 100) + "%";

  scenarioTitle.textContent = pergunta.title;
  scenarioDescription.textContent = pergunta.description;

  // A imagem será adicionada aos cenários em uma próxima etapa.
  scenarioImage.hidden = true;
  scenarioImage.removeAttribute("src");

  scenarioOptions.innerHTML = "";

  scenarioFeedback.className = "feedback";
  scenarioFeedback.textContent = "";

  nextChallenge.hidden = true;

  pergunta.options.forEach((opcao, indice) => {
    const botao = document.createElement("button");

    botao.className = "option-button";
    botao.type = "button";
    botao.textContent = String.fromCharCode(65 + indice) + ") " + opcao;

    botao.addEventListener("click", function () {
      responderPergunta(indice);
    });

    scenarioOptions.appendChild(botao);
  });
}

// ============================================
// RESPONDER
// ============================================

function responderPergunta(indiceEscolhido) {
  if (respostaRegistrada) return;

  respostaRegistrada = true;

  const pergunta = DESAFIOS[nivelAtual][perguntaAtual];
  const acertou = indiceEscolhido === pergunta.correctIndex;

  const botoes = scenarioOptions.querySelectorAll(".option-button");

  botoes.forEach((botao, indice) => {
    botao.disabled = true;

    if (indice === pergunta.correctIndex) {
      botao.classList.add("correct");
    }

    if (indice === indiceEscolhido && !acertou) {
      botao.classList.add("incorrect");
    }
  });

  if (acertou) {
    pontuacao += 10;

    scenarioFeedback.className = "feedback correct";
    scenarioFeedback.innerHTML =
      "<strong>✅ Muito bem! Você acertou!</strong>" +
      pergunta.explanation;
  } else {
    scenarioFeedback.className = "feedback incorrect";
    scenarioFeedback.innerHTML =
      "<strong>❌ Não foi dessa vez!</strong>" +
      "A alternativa correta era: " +
      pergunta.options[pergunta.correctIndex] +
      "<br><br>" +
      pergunta.explanation;
  }

  currentScore.textContent = "Pontos: " + pontuacao;

  challengeProgress.style.width =
    ((perguntaAtual + 1) / DESAFIOS[nivelAtual].length * 100) + "%";

  nextChallenge.hidden = false;

  if (perguntaAtual === DESAFIOS[nivelAtual].length - 1) {
    nextChallenge.textContent = "Ver resultado 🏆";
  } else {
    nextChallenge.textContent = "Próximo desafio →";
  }
}



// ============================================
// PRÓXIMA PERGUNTA
// ============================================

function avancarPergunta() {
  if (!respostaRegistrada) return;

  if (perguntaAtual < DESAFIOS[nivelAtual].length - 1) {
    perguntaAtual++;
    mostrarPergunta();
  } else {
    finalizarDesafio();
  }
}

// ============================================
// FINALIZAR E SALVAR RECORD
// ============================================

function finalizarDesafio() {
  challengeGame.style.display = "none";
  challengeResult.style.display = "block";

  const nome = nomesNiveis[nivelAtual];

  resultLevel.textContent = "Nível " + nome;
  finalScore.textContent = pontuacao + " / 100 pontos";

  let mensagem = "";

  if (pontuacao === 100) {
    mensagem = "🏆 Desempenho perfeito! Você demonstrou excelente conhecimento nos cenários apresentados.";
  } else if (pontuacao >= 80) {
    mensagem = "🥇 Excelente resultado! Você demonstrou um ótimo domínio dos conhecimentos apresentados.";
  } else if (pontuacao >= 60) {
    mensagem = "👏 Bom trabalho! Continue estudando e aprimorando seus conhecimentos ferroviários.";
  } else if (pontuacao >= 40) {
    mensagem = "📚 Você está no caminho! Revise as explicações e tente novamente.";
  } else {
    mensagem = "🚂 Todo especialista começa aprendendo. Estude os cenários e faça uma nova tentativa!";
  }

  resultMessage.textContent = mensagem;

  salvarRecorde(nivelAtual, pontuacao);
}

function salvarRecorde(nivel, pontos) {
  const chave = "mf_desafio_best_" + nivel;

  const recordeAnterior = Number(localStorage.getItem(chave) || 0);

  if (pontos > recordeAnterior) {
    localStorage.setItem(chave, String(pontos));
  }
}

// ============================================
// VOLTAR À ESCOLHA DE NÍVEIS
// ============================================

function voltarNiveis() {
  challengeGame.style.display = "none";
  challengeResult.style.display = "none";

  challengeIntro.style.display = "block";
  challengeLevels.style.display = "grid";
  levelTitle.style.display = "block";

  nextChallenge.textContent = "Próximo desafio →";
}

// ============================================
// EVENTOS DOS BOTÕES
// ============================================

challengeLevels.addEventListener("click", function (evento) {
  const botao = evento.target.closest("[data-level]");

  if (!botao) return;

  iniciarDesafio(botao.dataset.level);
});

nextChallenge.addEventListener("click", avancarPergunta);

exitChallenge.addEventListener("click", voltarNiveis);

restartChallenge.addEventListener("click", function () {
  iniciarDesafio(nivelAtual);
});

backToLevels.addEventListener("click", voltarNiveis);

// ============================================
// FIM DO DESAFIO FERROVIÁRIO
// ============================================



