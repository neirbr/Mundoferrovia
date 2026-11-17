
// ==========================================
// MUNDO FERROVIÁRIO
// SIMULANDO UMA CONDUÇÃO
// VISÃO SUPERIOR 2D
// ==========================================

// ELEMENTOS PRINCIPAIS

const canvas = document.getElementById("conducaoCanvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("startMissionButton");
const missionIntro = document.getElementById("missionIntro");
const gameArea = document.getElementById("gameArea");

const speedDisplay = document.getElementById("speedDisplay");
const throttleDisplay = document.getElementById("throttleDisplay");
const directionDisplay = document.getElementById("directionDisplay");
const pressureDisplay = document.getElementById("pressureDisplay");
const brakePressureLabel = document.getElementById("brakePressureLabel");

const directionLever = document.getElementById("directionLever");
const throttleLever = document.getElementById("throttleLever");
const missionMessage = document.getElementById("missionMessage");

const directionForward = document.getElementById("directionForward");
const directionReverse = document.getElementById("directionReverse");
const throttleUp = document.getElementById("throttleUp");
const throttleDown = document.getElementById("throttleDown");

const serviceBrake = document.getElementById("serviceBrake");
const emergencyBrake = document.getElementById("emergencyBrake");

const penaltyPanel = document.getElementById("penaltyPanel");
const penaltyMessage = document.getElementById("penaltyMessage");
const removePenaltyButton = document.getElementById("removePenaltyButton");

const objectiveHorn = document.getElementById("objectiveHorn");
const objectiveBell = document.getElementById("objectiveBell");


// ==========================================
// ESTADO DA MISSÃO
// ==========================================

let missionStarted = false;

let direction = 0;
let throttle = 0;
let speed = 0;
let brakePressure = 0;

let emergencyActive = false;
let penaltyRecoveryStage = 0;
let recoveryTimer = 0;

let hornActivated = false;
let bellActivated = false;

let lastFrame = 0;

const MAX_SPEEDS = [
  0, 15, 25, 35, 45, 55, 65, 75, 100
];

const TRAIN = {
  locomotiveLength: 48,
  wagonLength: 42,
  wagonCount: 4
};


// ==========================================
// DIMENSIONAMENTO DO CENÁRIO
// ==========================================

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();

  const width = Math.max(320, rect.width);
  const height = Math.max(200, rect.height);

  const ratio = window.devicePixelRatio || 1;

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  drawRailway();
}

window.addEventListener("resize", resizeCanvas);


// ==========================================
// PAINEL DE INFORMAÇÕES
// ==========================================

function updateDisplays() {
  speedDisplay.textContent =
    Math.round(speed) + " km/h";

  throttleDisplay.textContent =
    throttle === 0 ? "N" : throttle;

  throttleLever.textContent =
    throttle === 0 ? "N" : throttle;

  directionDisplay.textContent =
    direction === 1 ? "Frente" :
    direction === -1 ? "Ré" : "Neutro";

  directionLever.textContent =
    direction === 1 ? "FRENTE" :
    direction === -1 ? "RÉ" : "NEUTRO";

  pressureDisplay.textContent =
    brakePressure + " PSI";

  brakePressureLabel.textContent =
    brakePressure + " PSI";
}

function setMessage(message) {
  missionMessage.textContent = message;
}


// ==========================================
// BLOQUEIO E LIBERAÇÃO DOS CONTROLES
// ==========================================

function updateControls() {
  const locked =
    emergencyActive || penaltyRecoveryStage > 0;

  directionForward.disabled = locked;
  directionReverse.disabled = locked;

  throttleUp.disabled = locked;
  throttleDown.disabled = locked;

  serviceBrake.disabled = locked;

  emergencyBrake.disabled = locked;

  // Durante a etapa de recomposição,
  // o freio continua liberado.
  if (penaltyRecoveryStage === 3) {
    serviceBrake.disabled = false;
  }
}


// ==========================================
// INICIAR MISSÃO
// ==========================================

function startMission() {
  if (missionStarted) return;

  missionStarted = true;

  missionIntro.hidden = true;
  gameArea.hidden = false;

  resizeCanvas();

  updateDisplays();
  createSoundButtons();
  updateControls();

  setMessage(
    "Missão iniciada. Antes de movimentar o trem, acione a buzina e a campainha."
  );

  requestAnimationFrame(gameLoop);
}


// ==========================================
// BUZINA E CAMPAINHA
// ==========================================

function createSoundButtons() {
  const controlsPanel =
    document.querySelector(".controls-panel");

  if (document.getElementById("hornButton")) return;

  const soundGroup = document.createElement("div");

  soundGroup.className = "control-group";

  soundGroup.innerHTML = `
    <h3>Sinalização sonora</h3>

    <button id="hornButton" type="button">
      Buzina
    </button>

    <button id="bellButton" type="button">
      Campainha
    </button>
  `;

  controlsPanel.prepend(soundGroup);

  document.getElementById("hornButton")
    .addEventListener("click", activateHorn);

  document.getElementById("bellButton")
    .addEventListener("click", activateBell);
}

function activateHorn() {
  hornActivated = true;

  objectiveHorn.textContent =
    "✓ Buzina acionada";

  setMessage(
    "Buzina acionada. Agora acione a campainha."
  );

  checkPreparation();
}

function activateBell() {
  bellActivated = true;

  objectiveBell.textContent =
    "✓ Campainha acionada";

  setMessage(
    "Campainha acionada. Preparação sonora concluída."
  );

  checkPreparation();
}

function checkPreparation() {
  if (hornActivated && bellActivated) {
    setMessage(
      "Preparação concluída. Selecione o sentido e a potência desejada para iniciar a movimentação."
    );
  }
}


// ==========================================
// SELETOR DE SENTIDO
// ==========================================

function selectDirection(value) {
  if (
    !missionStarted ||
    emergencyActive ||
    penaltyRecoveryStage > 0
  ) return;

  direction = value;

  updateDisplays();

  if (throttle > 0 && speed === 0) {
    setMessage(
      "Sentido selecionado. A locomotiva está pronta para iniciar a movimentação."
    );
  } else {
    setMessage(
      "Sentido selecionado. A direção não movimenta o trem sozinha."
    );
  }
}


// ==========================================
// MANETE DE ACELERAÇÃO
// ==========================================

function changeThrottle(change) {
  if (
    !missionStarted ||
    emergencyActive ||
    penaltyRecoveryStage > 0
  ) return;

  throttle = Math.max(
    0,
    Math.min(8, throttle + change)
  );

  updateDisplays();

  if (throttle === 0) {
    setMessage(
      "Aceleração em neutro. O trem não receberá potência de tração."
    );
  } else if (direction === 0) {
    setMessage(
      "Potência selecionada. Escolha frente ou ré para iniciar a movimentação."
    );
  } else {
    setMessage(
      "Potência selecionada. A velocidade aumentará progressivamente."
    );
  }
}


// ==========================================
// FREIO DE SERVIÇO
// ==========================================

function applyServiceBrake() {
  if (
    emergencyActive ||
    penaltyRecoveryStage > 0
  ) return;

  brakePressure = Number(serviceBrake.value);

  updateDisplays();
}


// ==========================================
// FREIO DE EMERGÊNCIA
// ==========================================

function activateEmergency() {
  if (
    !missionStarted ||
    emergencyActive ||
    penaltyRecoveryStage > 0
  ) return;

  emergencyActive = true;

  brakePressure = 90;
  serviceBrake.value = 90;

  penaltyPanel.hidden = false;
  removePenaltyButton.hidden = true;

  penaltyRecoveryStage = 1;

  penaltyMessage.textContent =
    "Freio de emergência aplicado. Aguarde a parada completa do trem.";

  setMessage(
    "EMERGÊNCIA! O sistema bloqueou os controles de movimentação."
  );

  updateDisplays();
  updateControls();
}


// ==========================================
// RECUPERAÇÃO DA PENALIDADE
// ==========================================

function beginPenaltyRecovery() {
  if (
    !emergencyActive ||
    speed > 0.1 ||
    penaltyRecoveryStage !== 1
  ) return;

  penaltyRecoveryStage = 2;
  recoveryTimer = 10;

  removePenaltyButton.hidden = true;

  penaltyMessage.textContent =
    "Retirada da penalidade iniciada. Aguarde 10 segundos.";

  const countdown = setInterval(() => {
    recoveryTimer--;

    penaltyMessage.textContent =
      "Retirada da penalidade: " +
      recoveryTimer + " segundos.";

    if (recoveryTimer <= 0) {
      clearInterval(countdown);

      penaltyRecoveryStage = 2;

      serviceBrake.disabled = false;

      penaltyMessage.textContent =
        "Agora mova manualmente o freio de 90 PSI até 0 PSI.";
    }
  }, 1000);
}

function handleRecoveryBrake() {
  if (penaltyRecoveryStage !== 2) return;

  brakePressure = Number(serviceBrake.value);

  updateDisplays();

  if (brakePressure === 0) {
    penaltyRecoveryStage = 3;

    recoveryTimer = 10;

    serviceBrake.disabled = false;

    penaltyMessage.textContent =
      "Freio zerado. Aguarde 10 segundos para a recomposição do sistema.";

    const countdown = setInterval(() => {
      recoveryTimer--;

      penaltyMessage.textContent =
        "Recomposição do sistema: " +
        recoveryTimer + " segundos.";

      if (recoveryTimer <= 0) {
        clearInterval(countdown);

        penaltyRecoveryStage = 0;
        emergencyActive = false;

        penaltyPanel.hidden = true;

        throttle = 0;
        direction = 0;
        brakePressure = 0;

        serviceBrake.value = 0;

        updateDisplays();
        updateControls();

        setMessage(
          "Sistema completo. Controles liberados. A missão pode continuar."
        );
      }
    }, 1000);
  }
}


// ==========================================
// FÍSICA DE MOVIMENTAÇÃO E FRENAGEM
// ==========================================

function calculatePhysics(delta) {
  const dt = Math.min(delta / 1000, 0.05);

  const targetSpeed =
    direction === 0 || throttle === 0
      ? 0
      : MAX_SPEEDS[throttle];

  let acceleration = 0;

  if (emergencyActive) {
    acceleration = -Math.max(
      3,
      5 + speed * 0.13
    );

  } else if (brakePressure > 0) {
    const brakeFactor = brakePressure / 90;

    const brakingPower =
      1.2 + brakeFactor * 5.5;

    const inertiaFactor =
      speed <= 25 ? 1.7 :
      speed <= 45 ? 1.15 : 0.8;

    acceleration =
      -brakingPower * inertiaFactor;

  } else if (targetSpeed > speed) {
    acceleration = 2.2;

  } else if (targetSpeed < speed) {
    acceleration = -0.45;
  }

  speed += acceleration * dt;

  if (
    !emergencyActive &&
    brakePressure === 0 &&
    targetSpeed > 0 &&
    speed > targetSpeed
  ) {
    speed = Math.max(
      targetSpeed,
      speed - 0.45 * dt
    );
  }

  speed = Math.max(
    0,
    Math.min(100, speed)
  );

  if (speed < 0.05) {
    speed = 0;
  }
}


// ==========================================
// CENÁRIO FERROVIÁRIO VISTO DE CIMA
// ==========================================

function drawRailway() {
  const ratio = window.devicePixelRatio || 1;

  const width = canvas.width / ratio;
  const height = canvas.height / ratio;

  ctx.clearRect(0, 0, width, height);

  // Terreno e vegetação
  ctx.fillStyle = "#83b96b";
  ctx.fillRect(0, 0, width, height);

  // Faixa de terreno ao redor da ferrovia
  ctx.fillStyle = "#b6a17b";

  ctx.fillRect(
    width * 0.25,
    0,
    width * 0.5,
    height
  );

  // Lastro ferroviário
  ctx.fillStyle = "#777777";

  ctx.fillRect(
    width * 0.40,
    0,
    width * 0.20,
    height
  );

  // Dormentes
  ctx.fillStyle = "#493b30";

  for (let y = -10; y < height + 20; y += 20) {
    ctx.fillRect(
      width * 0.40,
      y,
      width * 0.20,
      7
    );
  }

  // Trilhos
  ctx.fillStyle = "#c7cdd0";

  ctx.fillRect(
    width * 0.44,
    0,
    5,
    height
  );

  ctx.fillRect(
    width * 0.54,
    0,
    5,
    height
  );

  // Árvores
  drawTrees(width, height);

  // Composição ferroviária
  drawTrain(width, height);
}


// ==========================================
// ÁRVORES VISTAS DE CIMA
// ==========================================

function drawTrees(width, height) {
  const positions = [
    [0.10, 0.15],
    [0.18, 0.35],
    [0.09, 0.58],
    [0.20, 0.82],
    [0.80, 0.18],
    [0.90, 0.40],
    [0.78, 0.65],
    [0.90, 0.85]
  ];

  positions.forEach(([x, y]) => {
    // Copa da árvore
    ctx.fillStyle = "#285b35";

    ctx.beginPath();

    ctx.arc(
      width * x,
      height * y,
      13,
      0,
      Math.PI * 2
    );

    ctx.fill();

    // Centro da copa
    ctx.fillStyle = "#397b43";

    ctx.beginPath();

    ctx.arc(
      width * x - 3,
      height * y - 3,
      6,
      0,
      Math.PI * 2
    );

    ctx.fill();
  });
}


// ==========================================
// LOCOMOTIVA E QUATRO VAGÕES
// VISTA SUPERIOR
// ==========================================

function drawTrain(width, height) {
  const centerX = width / 2;

  const wagonWidth = 34;
  const locomotiveHeight = 48;
  const wagonHeight = 40;
  const spacing = 3;

  const totalHeight =
    locomotiveHeight +
    TRAIN.wagonCount * (wagonHeight + spacing);

  let y = height / 2 - totalHeight / 2;

  // Locomotiva
  ctx.fillStyle = "#173e58";

  ctx.fillRect(
    centerX - wagonWidth / 2,
    y,
    wagonWidth,
    locomotiveHeight
  );

  // Frente da locomotiva
  ctx.fillStyle = "#f0b323";

  ctx.fillRect(
    centerX - 12,
    y + 4,
    24,
    8
  );

  // Cabine
  ctx.fillStyle = "#dce6ec";

  ctx.fillRect(
    centerX - 11,
    y + 17,
    22,
    18
  );

  // Faróis
  ctx.fillStyle = "#fff5b5";

  ctx.fillRect(
    centerX - 13,
    y + 2,
    5,
    4
  );

  ctx.fillRect(
    centerX + 8,
    y + 2,
    5,
    4
  );

  // Vagões
  y += locomotiveHeight + spacing;

  for (let i = 0; i < TRAIN.wagonCount; i++) {
    ctx.fillStyle = "#687b86";

    ctx.fillRect(
      centerX - wagonWidth / 2,
      y,
      wagonWidth,
      wagonHeight
    );

    ctx.strokeStyle = "#dce6ec";
    ctx.lineWidth = 2;

    ctx.strokeRect(
      centerX - wagonWidth / 2 + 4,
      y + 4,
      wagonWidth - 8,
      wagonHeight - 8
    );

    y += wagonHeight + spacing;
  }
}


// ==========================================
// CICLO PRINCIPAL DO SIMULADOR
// ==========================================

function gameLoop(timestamp) {
  if (!missionStarted) return;

  const delta = lastFrame
    ? timestamp - lastFrame
    : 16;

  lastFrame = timestamp;

  if (
    penaltyRecoveryStage !== 2 &&
    penaltyRecoveryStage !== 3
  ) {
    calculatePhysics(delta);
  }

  // Liberação da recuperação após parada
  if (
    emergencyActive &&
    speed === 0 &&
    penaltyRecoveryStage === 1
  ) {
    penaltyMessage.textContent =
      "Trem parado. Você pode solicitar a retirada da penalidade.";

    removePenaltyButton.hidden = false;
  }

  updateDisplays();

  drawRailway();

  requestAnimationFrame(gameLoop);
}


// ==========================================
// EVENTOS DOS CONTROLES
// ==========================================

startButton.addEventListener(
  "click",
  startMission
);

directionForward.addEventListener(
  "click",
  () => selectDirection(1)
);

directionReverse.addEventListener(
  "click",
  () => selectDirection(-1)
);

throttleUp.addEventListener(
  "click",
  () => changeThrottle(1)
);

throttleDown.addEventListener(
  "click",
  () => changeThrottle(-1)
);

serviceBrake.addEventListener(
  "input",
  () => {
    if (penaltyRecoveryStage === 2) {
      handleRecoveryBrake();
    } else {
      applyServiceBrake();
    }
  }
);

emergencyBrake.addEventListener(
  "click",
  activateEmergency
);

removePenaltyButton.addEventListener(
  "click",
  beginPenaltyRecovery
);


// ==========================================
// ESTADO INICIAL
// ==========================================

updateDisplays();
