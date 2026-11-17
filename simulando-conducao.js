
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const canvas = $("conducaoCanvas");
  const ctx = canvas.getContext("2d");

  const startButton = $("startMissionButton");
  const gameArea = $("gameArea");
  const missionIntro = $("missionIntro");

  const speedDisplay = $("speedDisplay");
  const throttleDisplay = $("throttleDisplay");
  const directionDisplay = $("directionDisplay");
  const pressureDisplay = $("pressureDisplay");
  const directionLever = $("directionLever");
  const throttleLever = $("throttleLever");
  const brakePressureLabel = $("brakePressureLabel");

  const directionButton = $("directionButton");
  const throttleButton = $("throttleButton");
  const hornButton = $("hornButton");
  const bellButton = $("bellButton");
  const emergencyButton = $("emergencyBrake");
  const serviceBrake = $("serviceBrake");

  const missionMessage = $("missionMessage");
  const sceneCaption = $("sceneCaption");

  const penaltyPanel = $("penaltyPanel");
  const penaltyMessage = $("penaltyMessage");
  const removePenaltyButton = $("removePenaltyButton");

  const MAX_SPEEDS = [0, 15, 25, 35, 45, 55, 65, 75, 100];

  const ROUTE = {
    farm: 650,
    town: 1450,
    crossings: [1050, 1850],
    signal: 2570,
    station: 2850,
    end: 3100
  };

  const TRAIN = {
    length: 115,
    wagons: 4
  };

  let running = false;
  let animationFrame = null;
  let lastFrame = 0;

  let speed = 0;
  let throttle = 0;
  let direction = 0;
  let brakePressure = 0;

  let distance = 0;
  let hornActivated = false;
  let bellActivated = false;
  let emergencyActive = false;
  let missionFinished = false;

  let switchPosition = "L1";
  let callOnActive = false;
  let stationStopped = false;

  let hazardPosition = 0;
  let hazardVisible = false;
  let hazardCleared = false;
  let hazardWaiting = false;
  let hazardWaitStart = 0;

  let penaltyStage = 0;
  let penaltyTimer = null;
  let crossingStates = [false, false];

  let lastTime = 0;

  let sceneryObjects = [];
  let canvasWidth = 800;
  let canvasHeight = 350;

  // --------------------------------------------------
  // AJUSTE DO CANVAS
  // --------------------------------------------------

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    canvasWidth = Math.max(320, rect.width);
    canvasHeight = Math.max(200, rect.height);

    canvas.width = Math.round(canvasWidth * ratio);
    canvas.height = Math.round(canvasHeight * ratio);

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    drawScene();
  }

  window.addEventListener("resize", resizeCanvas);

  // --------------------------------------------------
  // OBJETOS DO CENÁRIO
  // --------------------------------------------------

  function createScenery() {
    sceneryObjects = [];

    for (let x = 80; x < ROUTE.end; x += 115) {
      sceneryObjects.push({
        x,
        type: "tree",
        side: x % 2 === 0 ? "top" : "bottom"
      });
    }

    for (let x = 450; x < 850; x += 95) {
      sceneryObjects.push({
        x,
        type: "farm"
      });
    }

    for (let x = 1370; x < 2050; x += 100) {
      sceneryObjects.push({
        x,
        type: "house"
      });
    }
  }

  // --------------------------------------------------
  // INDICADORES
  // --------------------------------------------------

  function updateDisplays() {
    speedDisplay.textContent = Math.round(speed);
    throttleDisplay.textContent = throttle === 0 ? "N" : throttle;
    directionDisplay.textContent =
      direction === 1 ? "Frente" :
      direction === -1 ? "Ré" : "Neutro";

    pressureDisplay.textContent = brakePressure;
    directionLever.textContent =
      direction === 1 ? "F" :
      direction === -1 ? "R" : "N";

    throttleLever.textContent =
      throttle === 0 ? "N" : throttle;

    brakePressureLabel.textContent = brakePressure;
    serviceBrake.value = brakePressure;
  }

  function updateControls() {
    const recovery = penaltyStage > 0;

    directionButton.disabled =
      recovery || emergencyActive || speed > 0.5 ||
      !hornActivated || !bellActivated || missionFinished;

    throttleButton.disabled =
      recovery || emergencyActive ||
      !hornActivated || !bellActivated || missionFinished;

    hornButton.disabled =
      recovery || emergencyActive || missionFinished;

    bellButton.disabled =
      recovery || emergencyActive || missionFinished;

    emergencyButton.disabled =
      recovery || emergencyActive || missionFinished;

    serviceBrake.disabled =
      recovery || emergencyActive || missionFinished;

    if (penaltyStage === 2) {
      serviceBrake.disabled = false;
    }
  }

  function setMessage(message) {
    missionMessage.textContent = message;
  }

  function completeObjective(id) {
    const item = $(id);
    if (item) item.classList.add("completed");
  }

  // --------------------------------------------------
  // SOM
  // --------------------------------------------------

  function playTone(frequency, duration) {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      const audio = new AudioContextClass();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.045;

      oscillator.connect(gain);
      gain.connect(audio.destination);

      oscillator.start();
      oscillator.stop(audio.currentTime + duration);

      oscillator.onended = () => audio.close();
    } catch (error) {
      console.warn("Áudio indisponível:", error);
    }
  }

  function activateHorn() {
    if (!running || hornActivated || emergencyActive) return;

    hornActivated = true;
    playTone(250, 0.7);

    completeObjective("objectiveHorn");

    setMessage(
      bellActivated
        ? "Buzina e sino acionados. Selecione a direção e a aceleração."
        : "Buzina acionada. Agora acione o sino."
    );

    updateControls();
  }

  function activateBell() {
    if (!running || bellActivated || emergencyActive) return;

    bellActivated = true;
    playTone(850, 0.35);

    completeObjective("objectiveBell");

    setMessage(
      hornActivated
        ? "Preparação concluída. Selecione Frente e depois a aceleração."
        : "Sino acionado. Não se esqueça de acionar a buzina."
    );

    updateControls();
  }

  // --------------------------------------------------
  // DIREÇÃO E ACELERAÇÃO
  // --------------------------------------------------

  function selectDirection() {
    if (directionButton.disabled) return;

    if (direction === 1) {
      direction = 0;
    } else if (direction === 0) {
      direction = -1;
    } else {
      direction = 1;
    }

    // A sequência é Frente -> Neutro -> Ré -> Frente.
    // Para sair da posição de ré, a sequência volta à frente.
    if (direction === -1) {
      setMessage("Direção em ré. Selecione a aceleração quando necessário.");
    } else if (direction === 0) {
      setMessage("Direção em neutro.");
    } else {
      setMessage("Direção à frente selecionada.");
    }

    updateDisplays();
    updateControls();
  }

  function changeThrottle() {
    if (throttleButton.disabled) return;

    throttle = throttle >= 8 ? 0 : throttle + 1;

    setMessage(
      throttle === 0
        ? "Aceleração em neutro."
        : `Aceleração selecionada: posição ${throttle}.`
    );

    updateDisplays();
  }

  // --------------------------------------------------
  // FREIO DE SERVIÇO
  // --------------------------------------------------

  function applyServiceBrake() {
    if (serviceBrake.disabled) return;

    brakePressure = Number(serviceBrake.value);

    if (penaltyStage === 2) {
      handleRecoveryBrake();
      return;
    }

    updateDisplays();
  }

  // --------------------------------------------------
  // FREIO DE EMERGÊNCIA E RECUPERAÇÃO
  // --------------------------------------------------

  function activateEmergency() {
    if (!running || emergencyActive || penaltyStage > 0) return;

    emergencyActive = true;
    brakePressure = 90;
    throttle = 0;

    updateDisplays();
    updateControls();

    setMessage(
      "FREIO DE EMERGÊNCIA APLICADO! Aguarde a parada completa da composição."
    );

    playTone(180, 0.8);
  }

  function beginPenaltyRecovery() {
    if (penaltyStage > 0) return;

    penaltyStage = 1;
    penaltyPanel.hidden = false;
    removePenaltyButton.hidden = false;

    penaltyMessage.textContent =
      "Composição parada. Aguarde para iniciar a recuperação do sistema.";

    removePenaltyButton.disabled = false;
    updateControls();
  }

  function startCountdown(seconds, message, callback) {
    let remaining = seconds;

    penaltyMessage.textContent = `${message} ${remaining} segundos.`;

    penaltyTimer = window.setInterval(() => {
      remaining--;

      penaltyMessage.textContent =
        `${message} ${remaining} segundos.`;

      if (remaining <= 0) {
        clearInterval(penaltyTimer);
        penaltyTimer = null;
        callback();
      }
    }, 1000);
  }

  function startRecovery() {
    if (penaltyStage !== 1) return;

    removePenaltyButton.hidden = true;
    removePenaltyButton.disabled = true;

    startCountdown(
      10,
      "Aguardando recomposição inicial:",
      () => {
        penaltyStage = 2;

        penaltyMessage.textContent =
          "Agora libere manualmente o freio, levando a pressão de 90 PSI até 0 PSI.";

        brakePressure = 90;
        serviceBrake.value = 90;
        serviceBrake.disabled = false;

        updateDisplays();
        updateControls();
      }
    );
  }

  function handleRecoveryBrake() {
    if (penaltyStage !== 2) return;

    brakePressure = Number(serviceBrake.value);
    updateDisplays();

    if (brakePressure === 0) {
      penaltyStage = 3;
      serviceBrake.disabled = true;

      startCountdown(
        10,
        "Freio liberado. Aguardando recomposição final:",
        finishRecovery
      );
    }
  }

  function finishRecovery() {
    penaltyStage = 0;
    emergencyActive = false;

    brakePressure = 0;
    throttle = 0;
    direction = 0;

    penaltyPanel.hidden = true;
    removePenaltyButton.hidden = true;

    updateDisplays();
    updateControls();

    setMessage(
      "Sistema completo. Controles liberados. Retome a operação com atenção."
    );
  }

  // --------------------------------------------------
  // CHAVE DE VIA
  // --------------------------------------------------

  function createSwitchButton() {
    const controls = document.querySelector(".controls-panel");

    const button = document.createElement("button");
    button.id = "switchButton";
    button.type = "button";
    button.className = "primary-button";
    button.textContent = "Alinhar rota para L2";
    button.hidden = true;
    button.style.marginTop = "9px";
    button.style.width = "100%";

    controls.appendChild(button);

    button.addEventListener("click", changeSwitch);
  }

  function changeSwitch() {
    const button = $("switchButton");

    if (!button || missionFinished || emergencyActive) return;

    if (switchPosition === "L1") {
      if (distance < ROUTE.signal - 120 || speed > 0.5) {
        setMessage(
          "Pare antes do sinal vermelho para solicitar o alinhamento da rota L2."
        );
        return;
      }

      switchPosition = "L2";
      callOnActive = true;

      button.textContent = "Restabelecer chave para L1";

      setMessage(
        "Rota L2 alinhada. Sinal de chamada autorizado. Prossiga com cautela."
      );
    } else {
      if (!stationStopped) {
        setMessage(
          "A chave só deve ser restabelecida para L1 após parar na estação."
        );
        return;
      }

      switchPosition = "L1";
      callOnActive = false;

      button.hidden = true;

      completeObjective("objectiveSwitch");

      missionFinished = true;
      setMessage(
        "Missão concluída! Trem estacionado e chave restabelecida na posição normal L1."
      );

      sceneCaption.textContent = "Missão concluída";
      updateControls();
    }
  }

  // --------------------------------------------------
  // PASSAGENS EM NÍVEL
  // --------------------------------------------------

  function updateCrossings() {
    ROUTE.crossings.forEach((crossing, index) => {
      const closed =
        distance >= crossing - 180 &&
        distance <= crossing + TRAIN.length;

      crossingStates[index] = closed;
    });

    if (
      distance > ROUTE.crossings[1] + TRAIN.length &&
      !crossingStates[0] &&
      !crossingStates[1]
    ) {
      completeObjective("objectiveCrossings");
    }
  }

  // --------------------------------------------------
  // OBSTÁCULO ALEATÓRIO
  // --------------------------------------------------

  function createHazard() {
    const choices = ["person", "animal"];

    hazardPosition = 700 + Math.random() * 1350;
    hazardVisible = true;
    hazardCleared = false;
    hazardWaiting = false;

    window.hazardType =
      choices[Math.floor(Math.random() * choices.length)];
  }

  function updateHazard() {
    if (!hazardVisible || hazardCleared) return;

    const difference = hazardPosition - distance;

    if (difference > 0 && difference < 240) {
      setMessage(
        "ATENÇÃO! Há um obstáculo à frente. Reduza a velocidade e pare com segurança."
      );
    }

    if (difference <= 0 && !hazardWaiting) {
      hazardWaiting = true;
      hazardWaitStart = performance.now();
    }

    if (
      hazardWaiting &&
      speed < 0.5 &&
      performance.now() - hazardWaitStart > 1800
    ) {
      hazardCleared = true;

      setMessage(
        "Obstáculo afastado da via. Verifique as condições antes de prosseguir."
      );
    }
  }

  // --------------------------------------------------
  // FÍSICA SIMPLIFICADA
  // --------------------------------------------------

  function calculatePhysics(delta) {
    if (!running || missionFinished) return;

    const dt = Math.min(delta, 0.05);

    if (emergencyActive) {
      speed = Math.max(0, speed - 4.5 * dt);

      if (speed <= 0.1) {
        speed = 0;
        beginPenaltyRecovery();
      }

      return;
    }

    if (penaltyStage > 0) return;

    if (!hornActivated || !bellActivated) return;

    const maximum = MAX_SPEEDS[throttle];

    if (direction !== 0 && throttle > 0 && brakePressure === 0) {
      speed = Math.min(maximum, speed + 1.1 * dt);
    } else if (brakePressure > 0) {
      const deceleration = 0.35 + brakePressure * 0.045;
      speed = Math.max(0, speed - deceleration * dt);
    } else {
      speed = Math.max(0, speed - 0.12 * dt);
    }

    // Impede movimento contrário ao sentido selecionado.
    if (direction === 0 || throttle === 0) {
      speed = Math.max(0, speed - 0.08 * dt);
    }

    const movement = speed / 3.6 * dt;
    distance += movement;

    // Aproximação do sinal vermelho antes da chave.
    if (
      switchPosition === "L1" &&
      distance >= ROUTE.signal - 25
    ) {
      distance = ROUTE.signal - 25;
      speed = 0;

      const button = $("switchButton");
      if (button) button.hidden = false;

      setMessage(
        "Sinal vermelho à frente. Trem parado. Solicite o alinhamento da rota L2."
      );
    }

    // Aproximação da estação.
    if (
      switchPosition === "L2" &&
      distance >= ROUTE.station &&
      !stationStopped
    ) {
      distance = ROUTE.station;
      speed = Math.max(0, speed - 1.5);

      if (speed <= 0.5) {
        speed = 0;
        stationStopped = true;

        completeObjective("objectiveStation");

        const button = $("switchButton");
        if (button) {
          button.hidden = false;
          button.textContent = "Restabelecer chave para L1";
        }

        setMessage(
          "Trem parado na estação de destino. Restabeleça a chave para a posição normal L1."
        );
      }
    }

    updateCrossings();
    updateHazard();

    if (distance > 10) {
      completeObjective("objectiveDrive");
    }
  }

  // --------------------------------------------------
  // DESENHO DO CENÁRIO
  // --------------------------------------------------

  function drawScene() {
    if (!ctx || !canvasWidth || !canvasHeight) return;

    const w = canvasWidth;
    const h = canvasHeight;

    const trackY = h * 0.52;
    const trackHeight = Math.max(62, h * 0.24);
    const scale = 1;

    ctx.clearRect(0, 0, w, h);

    // Solo
    ctx.fillStyle = "#75a85c";
    ctx.fillRect(0, 0, w, h);

    // Áreas de cenário
    drawEnvironment(w, h, trackY);

    // Lastro ferroviário
    ctx.fillStyle = "#858585";
    ctx.fillRect(0, trackY - trackHeight / 2, w, trackHeight);

    // Pedras do lastro
    for (let x = 0; x < w; x += 13) {
      ctx.fillStyle = x % 2 ? "#777777" : "#999999";
      ctx.fillRect(x, trackY - trackHeight / 2 + 5, 7, 3);
      ctx.fillRect(x + 5, trackY + trackHeight / 2 - 8, 6, 3);
    }

    // Dormentes
    for (let x = -20; x < w + 20; x += 19) {
      ctx.fillStyle = "#514333";
      ctx.fillRect(x, trackY - trackHeight / 2 + 3, 8, trackHeight - 6);
    }

    // Trilhos
    ctx.fillStyle = "#343b40";
    ctx.fillRect(0, trackY - 19, w, 5);
    ctx.fillRect(0, trackY + 14, w, 5);

    ctx.fillStyle = "#c3c8ca";
    ctx.fillRect(0, trackY - 18, w, 2);
    ctx.fillRect(0, trackY + 15, w, 2);

    // Passagens em nível
    ROUTE.crossings.forEach((crossing, index) => {
      drawCrossing(crossing, index, trackY, w, h);
    });

    // Sinal
    drawSignal(trackY, w, h);

    // Trem
    drawTrain(w, trackY);

    // Obstáculo
    drawHazard(trackY);

    // Estação
    drawStation(trackY, w, h);
  }

  function drawEnvironment(w, h, trackY) {
    const offset = distance;
    const start = Math.floor(offset / 115) * 115;

    for (let worldX = start - 300; worldX < offset + w + 300; worldX += 115) {
      const screenX = worldX - offset + w * 0.38;

      if (screenX < -80 || screenX > w + 80) continue;

      if (worldX > ROUTE.farm - 250 && worldX < ROUTE.farm + 300) {
        drawFarm(screenX, h, trackY, worldX);
      } else if (worldX > ROUTE.town - 250 && worldX < ROUTE.town + 650) {
        drawHouse(screenX, h, trackY, worldX);
      } else {
        drawTree(screenX, worldX % 2 === 0 ? 30 : h - 30);
      }
    }

    // Áreas de cultivo
    if (ROUTE.farm - offset + w * 0.38 < w &&
        ROUTE.farm - offset + w * 0.38 > -w) {
      const farmX = ROUTE.farm - offset + w * 0.38;

      ctx.fillStyle = "#b4a05c";
      ctx.fillRect(farmX - 85, 15, 170, Math.max(20, trackY - 85));

      ctx.strokeStyle = "#8b783f";
      ctx.lineWidth = 2;

      for (let y = 25; y < trackY - 90; y += 13) {
        ctx.beginPath();
        ctx.moveTo(farmX - 75, y);
        ctx.lineTo(farmX + 75, y);
        ctx.stroke();
      }
    }
  }

  function drawTree(x, y) {
    ctx.fillStyle = "#604b35";
    ctx.fillRect(x - 3, y - 2, 6, 12);

    ctx.fillStyle = "#285f36";
    ctx.beginPath();
    ctx.arc(x, y - 5, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#397b43";
    ctx.beginPath();
    ctx.arc(x - 5, y - 9, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFarm(x, h, trackY, worldX) {
    const y = worldX % 2 === 0 ? 12 : h - 48;

    // Cerca
    ctx.strokeStyle = "#eee0b7";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 28, y, 58, 34);

    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = "#eee0b7";
      ctx.fillRect(x - 28 + i * 14, y - 4, 3, 42);
    }

    // Animais
    ctx.fillStyle = "#f5f0e4";
    ctx.beginPath();
    ctx.arc(x, y + 17, 7, 0, Math.PI * 2);
    ctx.fill();


    // Pequeno galpão
    ctx.fillStyle = "#b84b38";
    ctx.fillRect(x + 35, y + 5, 32, 23);
    ctx.fillStyle = "#71382c";
    ctx.beginPath();
    ctx.moveTo(x + 31, y + 5);
    ctx.lineTo(x + 51, y - 8);
    ctx.lineTo(x + 71, y + 5);
    ctx.fill();
  }

  function drawHouse(x, h, trackY, worldX) {
    const y = worldX % 2 === 0 ? 12 : h - 52;

    ctx.fillStyle = "#e4d4b8";
    ctx.fillRect(x - 23, y, 46, 33);

    ctx.fillStyle = "#a64b3d";
    ctx.beginPath();
    ctx.moveTo(x - 29, y);
    ctx.lineTo(x, y - 20);
    ctx.lineTo(x + 29, y);
    ctx.fill();

    ctx.fillStyle = "#4c748b";
    ctx.fillRect(x - 13, y + 8, 10, 10);
    ctx.fillRect(x + 5, y + 8, 10, 10);

    ctx.fillStyle = "#78563e";
    ctx.fillRect(x - 4, y + 20, 9, 13);
  }

  // --------------------------------------------------
  // PASSAGENS EM NÍVEL
  // --------------------------------------------------

  function drawCrossing(worldX, index, trackY, w, h) {
    const x = worldX - distance + w * 0.38;

    if (x < -70 || x > w + 70) return;

    const closed = crossingStates[index];
    const roadWidth = 45;

    ctx.fillStyle = "#555b5e";
    ctx.fillRect(x - roadWidth / 2, 0, roadWidth, h);

    ctx.fillStyle = "#e6e1d4";
    for (let y = 0; y < h; y += 28) {
      ctx.fillRect(x - 2, y, 4, 13);
    }

    // Veículos aguardando
    if (closed) {
      ctx.fillStyle = "#2867a0";
      ctx.fillRect(x - 15, trackY - 78, 30, 18);

      ctx.fillStyle = "#d7e6ef";
      ctx.fillRect(x - 9, trackY - 75, 18, 7);

      ctx.fillStyle = "#c13d32";
      ctx.fillRect(x - 15, trackY + 60, 30, 18);
    }

    // Sinalização da passagem
    ctx.fillStyle = "#e8e8e8";
    ctx.fillRect(x - 35, trackY - 60, 7, 40);
    ctx.fillRect(x + 28, trackY + 20, 7, 40);

    // Luzes
    ctx.fillStyle = closed ? "#ff2222" : "#7d2828";
    ctx.beginPath();
    ctx.arc(x - 31, trackY - 62, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + 32, trackY + 62, 6, 0, Math.PI * 2);
    ctx.fill();

    // Barreiras
    ctx.save();
    ctx.translate(x - 31, trackY - 20);
    ctx.rotate(closed ? -0.12 : -Math.PI / 2);
    ctx.fillStyle = "#f4f4f4";
    ctx.fillRect(-4, -4, 60, 8);

    ctx.fillStyle = "#d32929";
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(i * 10, -4, 5, 8);
    }
    ctx.restore();

    ctx.save();
    ctx.translate(x + 32, trackY + 20);
    ctx.rotate(closed ? 0.12 : Math.PI / 2);
    ctx.fillStyle = "#f4f4f4";
    ctx.fillRect(-4, -4, 60, 8);

    ctx.fillStyle = "#d32929";
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(i * 10, -4, 5, 8);
    }
    ctx.restore();
  }

  // --------------------------------------------------
  // SINAL FERROVIÁRIO
  // --------------------------------------------------

  function drawSignal(trackY, w, h) {
    const x = ROUTE.signal - distance + w * 0.38;

    if (x < -40 || x > w + 40) return;

    ctx.fillStyle = "#30383d";
    ctx.fillRect(x, trackY - 85, 7, 65);

    ctx.fillStyle = "#20282d";
    ctx.fillRect(x - 12, trackY - 100, 31, 40);

    const green = switchPosition === "L2" && callOnActive;

    ctx.fillStyle = green ? "#e52d2d" : "#f02727";
    ctx.beginPath();
    ctx.arc(x + 3, trackY - 88, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(x + 3, trackY - 70, 7, 0, Math.PI * 2);
    ctx.fill();

    if (green && Math.floor(performance.now() / 500) % 2 === 0) {
      ctx.fillStyle = "#ff3030";
      ctx.beginPath();
      ctx.arc(x + 3, trackY - 88, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // --------------------------------------------------
  // COMPOSIÇÃO FERROVIÁRIA
  // --------------------------------------------------

  function drawTrain(w, trackY) {
    const trainWidth = Math.min(w * 0.47, 370);
    const vehicleWidth = trainWidth / 5;
    const vehicleHeight = Math.max(25, Math.min(38, w * 0.065));
    const totalLeft = w * 0.38 - trainWidth / 2;

    // Quatro vagões
    for (let i = 0; i < 4; i++) {
      const x = totalLeft + i * vehicleWidth;

      ctx.fillStyle = "#263c4b";
      ctx.fillRect(
        x + 3,
        trackY - vehicleHeight / 2,
        vehicleWidth - 6,
        vehicleHeight
      );

      ctx.strokeStyle = "#d1d9de";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        x + 3,
        trackY - vehicleHeight / 2,
        vehicleWidth - 6,
        vehicleHeight
      );

      ctx.fillStyle = "#6f8490";
      ctx.fillRect(
        x + 9,
        trackY - vehicleHeight / 2 + 5,
        vehicleWidth - 18,
        vehicleHeight - 10
      );

      // Rodas
      ctx.fillStyle = "#161c20";
      ctx.beginPath();
      ctx.arc(x + 9, trackY - vehicleHeight / 2, 4, 0, Math.PI * 2);
      ctx.arc(x + vehicleWidth - 9, trackY - vehicleHeight / 2, 4, 0, Math.PI * 2);
      ctx.arc(x + 9, trackY + vehicleHeight / 2, 4, 0, Math.PI * 2);
      ctx.arc(x + vehicleWidth - 9, trackY + vehicleHeight / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Locomotiva
    const locomotiveX = totalLeft + 4 * vehicleWidth;

    ctx.fillStyle = "#123d58";
    ctx.fillRect(
      locomotiveX + 2,
      trackY - vehicleHeight / 2 - 3,
      vehicleWidth - 4,
      vehicleHeight + 6
    );

    ctx.strokeStyle = "#f0b323";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      locomotiveX + 2,
      trackY - vehicleHeight / 2 - 3,
      vehicleWidth - 4,
      vehicleHeight + 6
    );

    ctx.fillStyle = "#dbe5ea";
    ctx.fillRect(
      locomotiveX + vehicleWidth * 0.55,
      trackY - vehicleHeight / 2 + 4,
      vehicleWidth * 0.24,
      vehicleHeight - 8
    );

    // Frente da locomotiva
    ctx.fillStyle = "#f0b323";
    ctx.fillRect(
      locomotiveX + vehicleWidth - 6,
      trackY - 7,
      5,
      14
    );

    // Rodas da locomotiva
    ctx.fillStyle = "#161c20";
    ctx.fillRect(
      locomotiveX + 6,
      trackY - vehicleHeight / 2 - 4,
      7,
      4
    );
    ctx.fillRect(
      locomotiveX + vehicleWidth - 15,
      trackY - vehicleHeight / 2 - 4,
      7,
      4
    );
    ctx.fillRect(
      locomotiveX + 6,
      trackY + vehicleHeight / 2,
      7,
      4
    );
    ctx.fillRect(
      locomotiveX + vehicleWidth - 15,
      trackY + vehicleHeight / 2,
      7,
      4
    );
  }

  // --------------------------------------------------
  // OBSTÁCULO
  // --------------------------------------------------

  function drawHazard(trackY) {
    if (!hazardVisible || hazardCleared) return;

    const x = hazardPosition - distance + canvasWidth * 0.38;

    if (x < -40 || x > canvasWidth + 40) return;

    const y = trackY - 35;

    if (window.hazardType === "animal") {
      ctx.fillStyle = "#8c6039";
      ctx.beginPath();
      ctx.ellipse(x, y, 13, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#65432b";
      ctx.beginPath();
      ctx.arc(x + 12, y - 4, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#f0b323";
      ctx.beginPath();
      ctx.arc(x, y - 7, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#245b9a";
      ctx.fillRect(x - 5, y - 2, 10, 15);

      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 12);
      ctx.lineTo(x - 8, y + 20);
      ctx.moveTo(x + 3, y + 12);
      ctx.lineTo(x + 8, y + 20);
      ctx.stroke();
    }
  }

  // --------------------------------------------------
  // ESTAÇÃO DE DESTINO
  // --------------------------------------------------

  function drawStation(trackY, w, h) {
    const x = ROUTE.station - distance + w * 0.38;

    if (x < -250 || x > w + 250) return;

    ctx.fillStyle = "#d6d2c8";
    ctx.fillRect(x - 95, 10, 190, 32);

    ctx.fillStyle = "#4c5d68";
    ctx.fillRect(x - 80, 15, 160, 5);

    ctx.fillStyle = "#f0b323";
    ctx.fillRect(x - 90, 43, 180, 3);

    // Plataforma
    ctx.fillStyle = "#b7b3a8";
    ctx.fillRect(x - 110, trackY + 45, 220, 18);

    // Segunda linha
    ctx.fillStyle = "#858585";
    ctx.fillRect(x - 100, trackY + 90, 200, 20);

    ctx.fillStyle = "#514333";
    for (let i = 0; i < 200; i += 16) {
      ctx.fillRect(x - 100 + i, trackY + 89, 7, 22);
    }

    ctx.fillStyle = "#343b40";
    ctx.fillRect(x - 100, trackY + 94, 200, 3);
    ctx.fillRect(x - 100, trackY + 103, 200, 3);

    ctx.fillStyle = "#102b3f";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ESTAÇÃO DE DESTINO", x, 9);

    ctx.fillStyle = "#f0b323";
    ctx.font = "bold 11px Arial";
    ctx.fillText("L1", x - 115, trackY - 12);
    ctx.fillText("L2", x - 115, trackY + 104);
  }

  // --------------------------------------------------
  // ATUALIZAÇÃO DA TELA
  // --------------------------------------------------

  function drawTrainAndScene() {
    drawScene();
  }

  function gameLoop(timestamp) {
    if (!running) return;

    if (!lastFrame) lastFrame = timestamp;

    const delta = (timestamp - lastFrame) / 1000;
    lastFrame = timestamp;

    calculatePhysics(delta);
    updateDisplays();
    drawTrainAndScene();

    animationFrame = requestAnimationFrame(gameLoop);
  }

  // --------------------------------------------------
  // INÍCIO DA MISSÃO
  // --------------------------------------------------

  function startMission() {
    missionIntro.hidden = true;
    gameArea.hidden = false;

    running = true;
    lastFrame = 0;

    speed = 0;
    throttle = 0;
    direction = 0;
    brakePressure = 0;
    distance = 0;

    hornActivated = false;
    bellActivated = false;
    emergencyActive = false;
    missionFinished = false;

    switchPosition = "L1";
    callOnActive = false;
    stationStopped = false;

    penaltyStage = 0;
    crossingStates = [false, false];

    hazardCleared = false;
    hazardWaiting = false;

    penaltyPanel.hidden = true;

    createScenery();
    createHazard();

    if (!$("switchButton")) {
      createSwitchButton();
    }

    const switchButton = $("switchButton");
    switchButton.hidden = true;
    switchButton.textContent = "Alinhar rota para L2";

    document.querySelectorAll(".objectives-panel li").forEach((item) => {
      item.classList.remove("completed");
    });

    serviceBrake.value = 0;

    updateDisplays();
    updateControls();
    resizeCanvas();

    setMessage(
      "Missão iniciada. Acione a buzina e o sino antes de movimentar o trem."
    );

    sceneCaption.textContent = "Estação inicial — preparação da composição";

    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(gameLoop);
  }

  // --------------------------------------------------
  // EVENTOS DOS CONTROLES
  // --------------------------------------------------

  startButton.addEventListener("click", startMission);
  directionButton.addEventListener("click", selectDirection);
  throttleButton.addEventListener("click", changeThrottle);
  hornButton.addEventListener("click", activateHorn);
  bellButton.addEventListener("click", activateBell);
  emergencyButton.addEventListener("click", activateEmergency);
  serviceBrake.addEventListener("input", applyServiceBrake);
  removePenaltyButton.addEventListener("click", startRecovery);

  // --------------------------------------------------
  // INICIALIZAÇÃO
  // --------------------------------------------------

  updateDisplays();
  updateControls();
  resizeCanvas();

})();
