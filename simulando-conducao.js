
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

function updateDisplays() {
  speedDisplay.textContent = Math.round(speed) + " km/h";

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

function updateControls() {
  const locked =
    emergencyActive ||
    penaltyRecoveryStage > 0;

  directionForward.disabled = locked;
  directionReverse.disabled = locked;
  throttleUp.disabled = locked;
  throttleDown.disabled = locked;
  serviceBrake.disabled = locked;

  emergencyBrake.disabled =
    emergencyActive || penaltyRecoveryStage > 0;

  if (penaltyRecoveryStage === 3) {
    serviceBrake.disabled = false;
    directionForward.disabled = true;
    directionReverse.disabled = true;
    throttleUp.disabled = true;
    throttleDown.disabled = true;
  }
}

function startMission() {
  if (missionStarted) return;

  missionStarted = true;

  missionIntro.hidden = true;
  gameArea.hidden = false;

  resizeCanvas();
  updateDisplays();

  setMessage(
    "Missão iniciada. Antes de movimentar o trem, acione a buzina e a campainha."
  );

  createSoundButtons();

  updateControls();

  requestAnimationFrame(gameLoop);
}

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

function selectDirection(value) {
  if (!missionStarted || emergencyActive ||
      penaltyRecoveryStage > 0) return;

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

function changeThrottle(change) {
  if (!missionStarted || emergencyActive ||
      penaltyRecoveryStage > 0) return;

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

function applyServiceBrake() {
  if (emergencyActive ||
      penaltyRecoveryStage > 0) return;

  brakePressure = Number(serviceBrake.value);

  updateDisplays();
}

function activateEmergency() {
  if (!missionStarted || emergencyActive ||
      penaltyRecoveryStage > 0) return;

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

function beginPenaltyRecovery() {
  if (!emergencyActive || speed > 0.1) return;

  penaltyRecoveryStage = 1;
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

      penaltyMessage.textContent =
        "Agora mova manualmente o freio de 90 PSI até 0 PSI.";

      serviceBrake.disabled = false;
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

    acceleration = -brakingPower * inertiaFactor;
  } else if (targetSpeed > speed) {
    acceleration = 2.2;
  } else if (targetSpeed < speed) {
    acceleration = -0.45;
  }

  speed += acceleration * dt;

  if (!emergencyActive && brakePressure === 0) {
    if (targetSpeed > 0 && speed < targetSpeed) {
      speed = Math.min(speed, targetSpeed);
    }
  }

  speed = Math.max(0, Math.min(100, speed));

  if (speed < 0.05) {
    speed = 0;
  }
}

function drawRailway() {
  const width = canvas.width /
    (window.devicePixelRatio || 1);

  const height = canvas.height /
    (window.devicePixelRatio || 1);

  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#a8d3ed";
  ctx.fillRect(0, 0, width, height * 0.58);

  ctx.fillStyle = "#78a65b";
  ctx.fillRect(0, height * 0.58, width, height * 0.42);

  ctx.fillStyle = "#d9c69a";
  ctx.fillRect(0, height * 0.69, width, height * 0.12);

  const trackY = height * 0.77;

  ctx.fillStyle = "#666666";
  ctx.fillRect(0, trackY, width, 8);

  ctx.fillStyle = "#333333";
  ctx.fillRect(0, trackY + 18, width, 8);

  ctx.fillStyle = "#777777";

  for (let x = 0; x < width; x += 22) {
    ctx.fillRect(x, trackY + 5, 9, 18);
  }

  drawTrain(width, height, trackY);
}

function drawTrain(width, height, trackY) {
  const wagonWidth = TRAIN.wagonLength;
  const locomotiveWidth = TRAIN.locomotiveLength;

  const totalWidth =
    locomotiveWidth +
    TRAIN.wagonCount * wagonWidth;

  const trainX = Math.max(
    10,
    Math.min(width - totalWidth - 10, width * 0.12)
  );

  const trainY = trackY - 43;

  ctx.fillStyle = "#173e58";

  ctx.fillRect(
    trainX,
    trainY,
    locomotiveWidth,
    38
  );

  ctx.fillStyle = "#f0b323";

  ctx.fillRect(
    trainX + 9,
    trainY + 8,
    18,
    13
  );

  ctx.fillStyle = "#d9e5eb";

  ctx.fillRect(
    trainX + 29,
    trainY + 8,
    11,
    13
  );

  for (let i = 0; i < TRAIN.wagonCount; i++) {
    const x =
      trainX + locomotiveWidth + i * wagonWidth;

    ctx.fillStyle = "#7b858b";

    ctx.fillRect(
      x,
      trainY + 7,
      wagonWidth - 4,
      31
    );

    ctx.fillStyle = "#dce6ec";

    ctx.fillRect(
      x + 5,
      trainY + 12,
      wagonWidth - 15,
      5
    );
  }

  ctx.fillStyle = "#222222";

  for (let i = 0; i < TRAIN.wagonCount + 1; i++) {
    const x =
      trainX + i * wagonWidth;

    ctx.beginPath();
    ctx.arc(x + 8, trainY + 39, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function gameLoop(timestamp) {
  if (!missionStarted) return;

  const delta = lastFrame
    ? timestamp - lastFrame
    : 16;

  lastFrame = timestamp;

  if (penaltyRecoveryStage !== 2 &&
      penaltyRecoveryStage !== 3) {
    calculatePhysics(delta);
  }

  if (emergencyActive && speed === 0 &&
      penaltyRecoveryStage === 1) {
    penaltyMessage.textContent =
      "Trem parado. Você pode solicitar a retirada da penalidade.";

    removePenaltyButton.hidden = false;
  }

  updateDisplays();
  drawRailway();

  requestAnimationFrame(gameLoop);
}

startButton.addEventListener("click", startMission);

directionForward.addEventListener("click", () => {
  selectDirection(1);
});

directionReverse.addEventListener("click", () => {
  selectDirection(-1);
});

throttleUp.addEventListener("click", () => {
  changeThrottle(1);
});

throttleDown.addEventListener("click", () => {
  changeThrottle(-1);
});

serviceBrake.addEventListener("input", () => {
  if (penaltyRecoveryStage === 2) {
    handleRecoveryBrake();
  } else {
    applyServiceBrake();
  }
});

emergencyBrake.addEventListener("click", activateEmergency);

removePenaltyButton.addEventListener(
  "click",
  beginPenaltyRecovery
);

updateDisplays();
  
