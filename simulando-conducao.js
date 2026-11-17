
(() => {
  "use strict";

  // ==========================================
  // MUNDO FERROVIÁRIO - SIMULANDO UMA CONDUÇÃO
  // VISÃO SUPERIOR / TELA HORIZONTAL
  // ==========================================

  const $ = (id) => document.getElementById(id);

  const canvas = $("conducaoCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const missionStart = $("missionStart");
  const gameArea = $("gameArea");

  const startButton = $("startMissionButton");
  const hornButton = $("hornButton");
  const bellButton = $("bellButton");
  const directionButton = $("directionButton");
  const throttleButton = $("throttleButton");
  const brakeSlider = $("brakeSlider");
  const emergencyButton = $("emergencyBrakeButton");

  const speedDisplay = $("speedDisplay");
  const throttleDisplay = $("throttleDisplay");
  const directionDisplay = $("directionDisplay");
  const brakeDisplay = $("brakeDisplay");
  const brakeValue = $("brakeValue");

  const missionStatus = $("missionStatus");
  const routeDistance = $("routeDistance");

  const penaltyPanel = $("penaltyPanel");
  const penaltyMessage = $("penaltyMessage");
  const removePenaltyButton = $("removePenaltyButton");

  // ==========================================
  // ESTADO DA SIMULAÇÃO
  // ==========================================

  let width = 0;
  let height = 0;

  let running = false;
  let lastTime = 0;

  let distance = 0;
  let speed = 0;

  let direction = 0;
  let throttle = 0;
  let brakePressure = 0;

  let hornUsed = false;
  let bellUsed = false;

  let emergencyActive = false;
  let penaltyStage = 0;
  let recoveryTimer = 0;

  let switchPosition = "L1";
  let missionCompleted = false;

  let hazardPosition = 1050;
  let hazardType = Math.random() < 0.5 ? "animal" : "person";
  let hazardCleared = false;
  let hazardTimer = 0;

  let crossingOneClosed = false;
  let crossingTwoClosed = false;

  const TRAIN = {
    wagons: 4,
    length: 290
  };

  const ROUTE = {
    crossingOne: 850,
    crossingTwo: 1650,
    signal: 2570,
    station: 2850,
    end: 3000
  };

  const MAX_SPEED = [
    0, 15, 25, 35, 45, 55, 65, 75, 100
  ];

  const trainScreenX = () => width * 0.39;

  // ==========================================
  // TAMANHO E RESOLUÇÃO DA TELA
  // ==========================================

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    drawScene();
  }

  window.addEventListener("resize", resizeCanvas);

  // ==========================================
  // GEOMETRIA DA FERROVIA
  // ==========================================

  function routeCurve(x) {
    return (
      Math.sin(x / 520) * 75 +
      Math.sin(x / 1150) * 35
    );
  }

  function routeAngle(x) {
    const difference =
      routeCurve(x + 2) - routeCurve(x - 2);

    return Math.atan2(difference, 4);
  }

  function screenX(worldX) {
    return trainScreenX() + worldX - distance;
  }

  function screenY(worldX, offset = 0) {
    return (
      height * 0.51 +
      routeCurve(worldX) -
      routeCurve(distance) +
      offset
    );
  }

  // ==========================================
  // DESENHO DO TERRENO
  // ==========================================

  function drawGround() {
    ctx.fillStyle = "#719b58";
    ctx.fillRect(0, 0, width, height);

    // Vegetação em pequenos grupos
    for (let x = 0; x < width; x += 75) {
      const worldX = distance + x - trainScreenX();

      for (let side of [-1, 1]) {
        const y = screenY(worldX, side * 175);

        ctx.fillStyle =
          ((Math.floor(worldX / 75) + side) % 2 === 0)
            ? "#608c49"
            : "#7fa967";

        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Área rural
    drawFarm();

    // Área urbana
    drawTown();
  }

  // ==========================================
  // FAZENDA
  // ==========================================

  function drawFarm() {
    const x = screenX(950);

    if (x < -300 || x > width + 300) return;

    const y = screenY(950, 185);

    // Plantação
    ctx.fillStyle = "#a6a84d";
    ctx.fillRect(x - 125, y - 45, 155, 75);

    ctx.strokeStyle = "#d0c36a";
    ctx.lineWidth = 3;

    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 115 + i * 25, y - 40);
      ctx.lineTo(x - 115 + i * 25, y + 25);
      ctx.stroke();
    }

    // Galpão
    ctx.fillStyle = "#b84b38";
    ctx.fillRect(x + 35, y - 5, 65, 45);

    ctx.fillStyle = "#71382c";
    ctx.beginPath();
    ctx.moveTo(x + 28, y - 5);
    ctx.lineTo(x + 67, y - 32);
    ctx.lineTo(x + 108, y - 5);
    ctx.closePath();
    ctx.fill();

    // Trator
    ctx.fillStyle = "#e2a51c";
    ctx.fillRect(x - 90, y + 50, 48, 25);

    ctx.fillStyle = "#252525";
    ctx.beginPath();
    ctx.arc(x - 83, y + 77, 10, 0, Math.PI * 2);
    ctx.arc(x - 50, y + 77, 10, 0, Math.PI * 2);
    ctx.fill();

    // Cerca
    ctx.strokeStyle = "#e1d1a3";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(x - 150, y + 100);
    ctx.lineTo(x + 130, y + 100);
    ctx.moveTo(x - 150, y + 120);
    ctx.lineTo(x + 130, y + 120);
    ctx.stroke();

    for (let i = 0; i < 9; i++) {
      ctx.fillRect(x - 150 + i * 35, y + 90, 4, 38);
    }

    // Animais
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = "#f0e6d2";
      ctx.beginPath();
      ctx.arc(x + i * 45 - 40, y + 145, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==========================================
  // ÁREA URBANA
  // ==========================================

  function drawTown() {
    const x = screenX(2050);

    if (x < -350 || x > width + 350) return;

    for (let i = 0; i < 5; i++) {
      const buildingX = x - 140 + i * 75;
      const y = screenY(2050 + i * 75, 175);

      ctx.fillStyle =
        i % 2 === 0 ? "#d6c5a8" : "#c7d0d4";

      ctx.fillRect(buildingX, y - 55, 58, 55);

      ctx.fillStyle = "#874e3e";
      ctx.fillRect(buildingX - 5, y - 65, 68, 12);

      ctx.fillStyle = "#53748a";

      for (let j = 0; j < 2; j++) {
        ctx.fillRect(buildingX + 10 + j * 25, y - 43, 12, 14);
      }
    }

    // Rua urbana
    ctx.fillStyle = "#777b80";
    ctx.fillRect(x - 150, screenY(2050, 260), 400, 48);

    ctx.strokeStyle = "#e9e3ce";
    ctx.setLineDash([15, 12]);
    ctx.beginPath();
    ctx.moveTo(x - 150, screenY(2050, 284));
    ctx.lineTo(x + 250, screenY(2050, 284));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ==========================================
  // TRILHOS E DORMENTES
  // ==========================================

  function drawTrack(offset, main = false) {
    const spacing = 18;
    const railWidth = main ? 5 : 4;

    // Lastro
    ctx.beginPath();

    for (let x = 0; x <= width; x += 8) {
      const worldX = distance + x - trainScreenX();
      const y = screenY(worldX, offset);

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = "#a69b83";
    ctx.lineWidth = 31;
    ctx.stroke();

    // Dormentes
    for (let x = -10; x < width + 20; x += spacing) {
      const worldX = distance + x - trainScreenX();
      const y = screenY(worldX, offset);
      const angle = routeAngle(worldX);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.fillStyle = "#57483a";
      ctx.fillRect(-5, -16, 10, 32);

      ctx.restore();
    }

    // Trilhos metálicos
    for (let side of [-1, 1]) {
      ctx.beginPath();

      for (let x = 0; x <= width; x += 8) {
        const worldX = distance + x - trainScreenX();
        const y = screenY(worldX, offset) + side * 8;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.strokeStyle = "#c8d0d4";
      ctx.lineWidth = railWidth;
      ctx.stroke();
    }
  }

  // ==========================================
  // LOCOMOTIVA E QUATRO VAGÕES
  // ==========================================

  function drawVehicle(worldX, type, number) {
    const x = screenX(worldX);
    const y = screenY(worldX);
    const angle = routeAngle(worldX);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const isLocomotive = type === "locomotive";

    const vehicleLength = isLocomotive ? 62 : 52;
    const vehicleWidth = isLocomotive ? 29 : 25;

    // Sombra
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(
      -vehicleLength / 2 + 3,
      -vehicleWidth / 2 + 4,
      vehicleLength,
      vehicleWidth
    );

    // Corpo
    ctx.fillStyle = isLocomotive ? "#174a67" : "#aeb7bc";

    ctx.fillRect(
      -vehicleLength / 2,
      -vehicleWidth / 2,
      vehicleLength,
      vehicleWidth
    );

    // Faixa superior
    ctx.fillStyle = isLocomotive ? "#f0b323" : "#737f86";
    ctx.fillRect(
      -vehicleLength / 2 + 5,
      -vehicleWidth / 2 + 4,
      vehicleLength - 10,
      5
    );

    // Cabine da locomotiva
    if (isLocomotive) {
      ctx.fillStyle = "#18394e";
      ctx.fillRect(-10, -10, 25, 20);

      ctx.fillStyle = "#8dc4dc";
      ctx.fillRect(7, -7, 7, 14);

      // Faróis
      ctx.fillStyle = "#fff5b2";
      ctx.fillRect(vehicleLength / 2 - 3, -8, 5, 5);
      ctx.fillRect(vehicleLength / 2 - 3, 3, 5, 5);
    } else {
      ctx.fillStyle = "#58656c";
      ctx.fillRect(-8, -7, 16, 14);

      ctx.fillStyle = "#e2e5e7";
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(number, 0, 3);
    }

    // Engates
    ctx.fillStyle = "#242424";
    ctx.fillRect(-vehicleLength / 2 - 5, -3, 6, 6);
    ctx.fillRect(vehicleLength / 2 - 1, -3, 6, 6);

    ctx.restore();
  }

  function drawTrain() {
    const spacing = 62;

    // Quatro vagões atrás da locomotiva
    for (let i = TRAIN.wagons; i >= 1; i--) {
      drawVehicle(distance - i * spacing, "wagon", i);
    }

    // Locomotiva
    drawVehicle(distance, "locomotive", 0);
  }


  // ==========================================
  // PASSAGENS EM NÍVEL
  // ==========================================

  function drawCrossing(worldX, number) {
    const x = screenX(worldX);

    if (x < -100 || x > width + 100) return;

    const y = screenY(worldX);

    const closed = Math.abs(distance - worldX) < 180 + TRAIN.length;

    if (number === 1) crossingOneClosed = closed;
    else crossingTwoClosed = closed;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(routeAngle(worldX));

    // Estrada
    ctx.fillStyle = "#777d80";
    ctx.fillRect(-75, -95, 150, 190);

    // Marcas da estrada
    ctx.strokeStyle = "#e9e3ce";
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);

    ctx.beginPath();
    ctx.moveTo(0, -95);
    ctx.lineTo(0, 95);
    ctx.stroke();

    ctx.setLineDash([]);

    // Barreira
    ctx.fillStyle = "#d8d8d8";
    ctx.fillRect(-5, -85, 10, 65);

    ctx.save();
    ctx.translate(0, -85);
    ctx.rotate(closed ? -0.9 : 0.15);

    ctx.fillStyle = "#f0c323";
    ctx.fillRect(-5, -5, 100, 10);

    ctx.fillStyle = "#c62828";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(8 + i * 18, -5, 9, 10);
    }

    ctx.restore();

    // Sinal vermelho intermitente
    const flashing = Math.floor(performance.now() / 450) % 2 === 0;

    ctx.fillStyle = closed && flashing ? "#ff2525" : "#721515";
    ctx.beginPath();
    ctx.arc(-15, -95, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#343434";
    ctx.fillRect(-20, -108, 10, 12);

    ctx.restore();

    // Veículo parado antes da passagem
    if (closed) {
      ctx.fillStyle = "#e6e6e6";
      ctx.fillRect(x + 45, y + 55, 30, 16);
      ctx.fillStyle = "#273746";
      ctx.fillRect(x + 50, y + 58, 9, 10);
    }
  }

  // ==========================================
  // SINALIZAÇÃO FERROVIÁRIA
  // ==========================================

  function drawSignal() {
    const x = screenX(ROUTE.signal);
    const y = screenY(ROUTE.signal);

    if (x < -50 || x > width + 50) return;

    ctx.fillStyle = "#343434";
    ctx.fillRect(x - 4, y - 75, 8, 75);

    ctx.fillStyle = "#252525";
    ctx.fillRect(x - 15, y - 105, 30, 38);

    const flashing = Math.floor(performance.now() / 450) % 2 === 0;

    ctx.fillStyle =
      switchPosition === "L2" && flashing
        ? "#ff3030"
        : "#c62828";

    ctx.beginPath();
    ctx.arc(x, y - 94, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f0b323";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SINAL", x, y - 113);
  }

  // ==========================================
  // DUAS LINHAS DA ESTAÇÃO
  // ==========================================

  function drawStation() {
    const stationX = screenX(ROUTE.station);

    if (stationX < -400 || stationX > width + 400) return;

    // Segunda linha da estação
    drawTrack(55, false);

    const y = screenY(ROUTE.station, 130);

    // Plataforma
    ctx.fillStyle = "#c6c3b8";
    ctx.fillRect(stationX - 150, y, 330, 35);

    ctx.fillStyle = "#e9dfb6";
    ctx.fillRect(stationX - 150, y, 330, 5);

    // Cobertura da estação
    ctx.fillStyle = "#174a67";
    ctx.fillRect(stationX - 45, y - 55, 120, 35);

    ctx.fillStyle = "#f0b323";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ESTAÇÃO", stationX + 15, y - 33);

    // Identificação das linhas
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Arial";
    ctx.fillText("L1", stationX - 100, y - 10);
    ctx.fillText("L2", stationX - 100, y + 55);
  }

  // ==========================================
  // DESVIO E AMV
  // ==========================================

  function drawSwitch() {
    const x = screenX(ROUTE.signal + 100);

    if (x < -100 || x > width + 150) return;

    const y = screenY(ROUTE.signal + 100);

    ctx.strokeStyle = "#c5cdd0";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(x - 80, y);
    ctx.lineTo(x + 80, y);

    ctx.moveTo(x - 30, y);
    ctx.quadraticCurveTo(x + 20, y + 35, x + 80, y + 55);
    ctx.stroke();

    ctx.fillStyle = "#f0b323";
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==========================================
  // OBSTÁCULO NA VIA
  // ==========================================

  function drawHazard() {
    if (hazardCleared) return;

    const x = screenX(hazardPosition);
    const y = screenY(hazardPosition);

    if (x < -50 || x > width + 50) return;

    ctx.save();
    ctx.translate(x, y - 28);

    if (hazardType === "animal") {
      ctx.fillStyle = "#9a6338";
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f0d6ad";
      ctx.beginPath();
      ctx.arc(-8, -10, 5, 0, Math.PI * 2);
      ctx.arc(8, -10, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#263d87";
      ctx.beginPath();
      ctx.arc(0, -8, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(-5, -2, 10, 18);

      ctx.strokeStyle = "#263d87";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-5, 2);
      ctx.lineTo(-13, 12);
      ctx.moveTo(5, 2);
      ctx.lineTo(13, 12);
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // DESENHO GERAL
  // ==========================================

  function drawScene() {
    if (!ctx || width <= 0 || height <= 0) return;

    drawGround();

    // Linhas paralelas
    drawTrack(-90, false);
    drawTrack(0, true);
    drawTrack(90, false);

    drawCrossing(ROUTE.crossingOne, 1);
    drawCrossing(ROUTE.crossingTwo, 2);

    drawSwitch();
    drawStation();
    drawSignal();
    drawHazard();
    drawTrain();
  }

  // ==========================================
  // ATUALIZAÇÃO DOS INDICADORES
  // ==========================================

  function updateIndicators() {
    speedDisplay.textContent = Math.round(speed) + " km/h";
    throttleDisplay.textContent = throttle === 0 ? "N" : throttle;
    directionDisplay.textContent =
      direction === 1 ? "Frente" :
      direction === -1 ? "Ré" : "Neutro";

    brakeDisplay.textContent = brakePressure + " PSI";
    brakeValue.textContent = brakePressure;

    routeDistance.textContent =
      "Distância: " + Math.max(0, Math.round(distance)) + " m";

    if (missionCompleted) {
      missionStatus.textContent = "Missão concluída";
    } else if (penaltyStage > 0) {
      missionStatus.textContent = "Recomposição do sistema";
    } else if (!hornUsed || !bellUsed) {
      missionStatus.textContent = "Acione buzina e sino";
    } else {
      missionStatus.textContent = "Condução em andamento";
    }
  }

  // ==========================================
  // CONTROLES
  // ==========================================

  function updateControls() {
    const locked =
      emergencyActive ||
      penaltyStage > 0 ||
      missionCompleted;

    directionButton.disabled = locked || speed > 0.5;
    throttleButton.disabled = locked;

    brakeSlider.disabled =
      emergencyActive ||
      penaltyStage === 1 ||
      penaltyStage === 3 ||
      missionCompleted;

    emergencyButton.disabled =
      locked || !running;

    hornButton.disabled = locked || hornUsed;
    bellButton.disabled = locked || bellUsed;
  }

  // ==========================================
  // BUZINA E SINO
  // ==========================================

  hornButton.addEventListener("click", () => {
    if (!running || emergencyActive || penaltyStage > 0) return;

    hornUsed = true;
    hornButton.textContent = "📢 Buzina acionada";

    updateIndicators();
    updateControls();
  });

  bellButton.addEventListener("click", () => {
    if (!running || emergencyActive || penaltyStage > 0) return;

    bellUsed = true;
    bellButton.textContent = "🔔 Sino acionado";

    updateIndicators();
    updateControls();
  });

  // ==========================================
  // REVERSOR
  // FRENTE → NEUTRO → RÉ
  // ==========================================

  directionButton.addEventListener("click", () => {
    if (speed > 0.5 || emergencyActive || penaltyStage > 0) return;

    if (direction === 1) direction = 0;
    else if (direction === 0) direction = -1;
    else direction = 1;

    directionButton.textContent =
      direction === 1 ? "Frente" :
      direction === -1 ? "Ré" : "Neutro";

    updateIndicators();
    updateControls();
  });

  // ==========================================
  // MANETE DE TRAÇÃO
  // ==========================================

  throttleButton.addEventListener("click", () => {
    if (emergencyActive || penaltyStage > 0 || missionCompleted) return;

    throttle++;

    if (throttle > 8) throttle = 0;

    throttleButton.textContent =
      throttle === 0 ? "N" : throttle;

    updateIndicators();
  });

  // ==========================================
  // FREIO INDEPENDENTE
  // ==========================================

  brakeSlider.addEventListener("input", () => {
    if (emergencyActive || penaltyStage > 0 || missionCompleted) return;

    brakePressure = Number(brakeSlider.value);

    updateIndicators();
  });

  // ==========================================
  // FREIO DE EMERGÊNCIA
  // ==========================================

  emergencyButton.addEventListener("click", () => {
    if (emergencyActive || penaltyStage > 0 || !running) return;

    emergencyActive = true;
    brakePressure = 90;
    throttle = 0;

    brakeSlider.value = 90;

    updateIndicators();
    updateControls();
  });

  // ==========================================
  // RECOMPOSIÇÃO DO SISTEMA
  // ==========================================

  function beginPenaltyRecovery() {
    penaltyStage = 1;
    recoveryTimer = 10;

    penaltyPanel.hidden = false;

    penaltyMessage.textContent =
      "Freio de emergência aplicado. Aguarde para iniciar a recomposição.";

    removePenaltyButton.textContent = "Iniciar espera de 10 segundos";

    updateControls();
  }

  removePenaltyButton.addEventListener("click", () => {
    if (penaltyStage === 1) {
      penaltyStage = 2;
      recoveryTimer = 10;

      removePenaltyButton.disabled = true;

      penaltyMessage.textContent =
        "Aguarde 10 segundos para liberar o ajuste manual do freio.";

      const interval = setInterval(() => {
        recoveryTimer--;

        penaltyMessage.textContent =
          "Aguarde: " + recoveryTimer + " segundos.";

        if (recoveryTimer <= 0) {
          clearInterval(interval);

          penaltyStage = 3;

          brakePressure = 90;
          brakeSlider.value = 90;
          brakeSlider.disabled = false;

          removePenaltyButton.disabled = true;
          removePenaltyButton.textContent = "Freio liberado para ajuste";

          penaltyMessage.textContent =
            "Reduza manualmente a pressão de 90 PSI até 0 PSI.";
        }
      }, 1000);

      updateControls();
      return;
    }
  });

  function handleRecoveryBrake() {
    if (penaltyStage !== 3 || brakePressure !== 0) return;

    penaltyStage = 4;
    recoveryTimer = 10;

    brakeSlider.disabled = true;

    penaltyMessage.textContent =
      "Freio zerado. Aguarde 10 segundos para recompor o sistema.";

    const interval = setInterval(() => {
      recoveryTimer--;

      penaltyMessage.textContent =
        "Recomposição: " + recoveryTimer + " segundos.";

      if (recoveryTimer <= 0) {
        clearInterval(interval);

        penaltyStage = 0;
        emergencyActive = false;

        brakePressure = 0;
        brakeSlider.value = 0;

        penaltyPanel.hidden = true;

        removePenaltyButton.disabled = false;

        updateIndicators();
        updateControls();
      }
    }, 1000);
  }

  brakeSlider.addEventListener("change", handleRecoveryBrake);

  // ==========================================
  // SELEÇÃO DA LINHA DA ESTAÇÃO
  // ==========================================

  const switchButton = document.createElement("button");

  switchButton.id = "stationSwitchButton";
  switchButton.className = "control-button";
  switchButton.textContent = "Selecionar L2";

  const switchGroup = document.createElement("div");
  switchGroup.className = "control-group";

  const switchTitle = document.createElement("h3");
  switchTitle.textContent = "Chave de via";

  switchGroup.appendChild(switchTitle);
  switchGroup.appendChild(switchButton);

  $("emergencyBrakeButton").parentElement.parentElement
    .appendChild(switchGroup);

  switchGroup.hidden = true;

  switchButton.addEventListener("click", () => {
    if (speed > 0.5 || emergencyActive || penaltyStage > 0) return;

    if (distance < ROUTE.signal - 120) return;

    if (switchPosition === "L1") {
      switchPosition = "L2";
      switchButton.textContent = "Restaurar L1";
    } else {
      switchPosition = "L1";
      switchButton.textContent = "Selecionar L2";
    }

    drawScene();
  });

  // ==========================================
  // FÍSICA SIMPLIFICADA
  // ==========================================

  function updatePhysics(dt) {
    if (!running || missionCompleted) return;

    if (penaltyStage > 0) {
      if (speed > 0) {
        speed = Math.max(0, speed - 12 * dt);
      }
      return;
    }

    if (emergencyActive) {
      speed = Math.max(0, speed - 18 * dt);

      if (speed <= 0.1) {
        speed = 0;
        emergencyActive = false;
        beginPenaltyRecovery();
      }

      return;
    }

    if (throttle > 0 && direction !== 0 && brakePressure === 0) {
      const targetSpeed = MAX_SPEED[throttle];

      speed = Math.min(
        targetSpeed,
        speed + 2.2 * dt
      );
    } else if (brakePressure > 0) {
      const deceleration =
        (0.15 + brakePressure * 0.045) * 3.6;

      speed = Math.max(0, speed - deceleration * dt);
    } else {
      speed = Math.max(0, speed - 0.12 * dt);
    }

    const movement =
      (speed / 3.6) * dt * 2;

    distance += movement * direction;

    // Limite inicial
    if (distance < 0) distance = 0;

    // Parada obrigatória no sinal
    if (
      switchPosition === "L1" &&
      distance >= ROUTE.signal - 25
    ) {
      distance = ROUTE.signal - 25;
      speed = 0;

      switchGroup.hidden = false;
      missionStatus.textContent = "Aguarde e selecione a L2";
    }

    // Parada na estação
    if (
      switchPosition === "L2" &&
      distance >= ROUTE.station
    ) {
      distance = ROUTE.station;
      speed = 0;
      throttle = 0;

      missionStatus.textContent =
        "Trem parado na estação. Restaure a L1.";

      switchGroup.hidden = false;
    }

    // Obstáculo: quando o trem para, ele sai da via
    if (
      !hazardCleared &&
      Math.abs(distance - hazardPosition) < 100 &&
      speed <= 0.5
    ) {
      hazardTimer += dt;

      if (hazardTimer >= 1.8) {
        hazardCleared = true;
      }
    }

    // Conclusão após parada e restauração da linha
    if (
      distance >= ROUTE.station &&
      speed <= 0.5 &&
      switchPosition === "L1"
    ) {
      missionCompleted = true;
      throttle = 0;

      missionStatus.textContent = "Missão concluída!";

      switchGroup.hidden = true;

      updateControls();
    }

    updateIndicators();
  }

  // ==========================================
  // CICLO DE ANIMAÇÃO
  // ==========================================

  function animationFrame(timestamp) {
    if (!running) return;

    if (!lastTime) lastTime = timestamp;

    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    updatePhysics(dt);
    drawScene();
    updateIndicators();
    updateControls();

    requestAnimationFrame(animationFrame);
  }

  // ==========================================
  // INICIAR MISSÃO
  // ==========================================

  async function requestLandscape() {
    try {
      if (
        screen.orientation &&
        typeof screen.orientation.lock === "function"
      ) {
        await screen.orientation.lock("landscape");
      }
    } catch (error) {
      console.log("O navegador não permitiu bloquear a orientação.");
    }
  }

  startButton.addEventListener("click", async () => {
    if (running) return;

    await requestLandscape();

    document.body.classList.add("simulator-active");

    missionStart.hidden = true;
    gameArea.hidden = false;

    running = true;
    lastTime = 0;

    resizeCanvas();

    updateIndicators();
    updateControls();

    requestAnimationFrame(animationFrame);
  });

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  updateIndicators();
  updateControls();

})();
  


 
