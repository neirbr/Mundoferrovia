
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
  // GEOMETRIA DA FERROVIA - CENÁRIO FIXO
  // ==========================================

  const MAP = {
    width: 1000,
    height: 500
  };

  let mapScale = 1;
  let mapOffsetX = 0;
  let mapOffsetY = 0;

  // Pontos que formam o percurso ferroviário
  const routePoints = [
    { x: 55, y: 85 },
    { x: 170, y: 85 },
    { x: 280, y: 105 },
    { x: 370, y: 165 },
    { x: 455, y: 205 },
    { x: 555, y: 205 },
    { x: 650, y: 165 },
    { x: 745, y: 155 },
    { x: 825, y: 205 },
    { x: 890, y: 285 },
    { x: 900, y: 355 },
    { x: 850, y: 410 }
  ];

  // Construção de curvas suaves pelo método Catmull-Rom
  const routePath = [];

  function buildRoute() {
    routePath.length = 0;

    for (let i = 0; i < routePoints.length - 1; i++) {
      const p0 = routePoints[Math.max(0, i - 1)];
      const p1 = routePoints[i];
      const p2 = routePoints[i + 1];
      const p3 = routePoints[Math.min(routePoints.length - 1, i + 2)];

      for (let step = 0; step < 30; step++) {
        const t = step / 30;
        const t2 = t * t;
        const t3 = t2 * t;

        const x = 0.5 * (
          2 * p1.x +
          (-p0.x + p2.x) * t +
          (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * t2 +
          (-p0.x + 3*p1.x - 3*p2.x + p3.x) * t3
        );

        const y = 0.5 * (
          2 * p1.y +
          (-p0.y + p2.y) * t +
          (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * t2 +
          (-p0.y + 3*p1.y - 3*p2.y + p3.y) * t3
        );

        routePath.push({ x, y });
      }
    }

    const last = routePoints[routePoints.length - 1];
    routePath.push({ x: last.x, y: last.y });

    let total = 0;

    routePath[0].distance = 0;

    for (let i = 1; i < routePath.length; i++) {
      const dx = routePath[i].x - routePath[i - 1].x;
      const dy = routePath[i].y - routePath[i - 1].y;

      total += Math.hypot(dx, dy);
      routePath[i].distance = total;
    }

    return total;
  }

  const routeLength = buildRoute();

  // Posições dos pontos importantes do percurso
  ROUTE.crossingOne = routeLength * 0.25;
  ROUTE.crossingTwo = routeLength * 0.65;
  ROUTE.signal = routeLength * 0.79;
  ROUTE.station = routeLength * 0.94;
  ROUTE.end = routeLength;

  hazardPosition = routeLength * 0.45;

  // Localiza a posição do trem sobre os trilhos
  function getRoutePointAtDistance(value, offset = 0) {
    const d = Math.max(0, Math.min(routeLength, value));

    let index = 1;

    while (
      index < routePath.length - 1 &&
      routePath[index].distance < d
    ) {
      index++;
    }

    const a = routePath[index - 1];
    const b = routePath[index];

    const segmentLength = b.distance - a.distance;

    const t = segmentLength > 0
      ? (d - a.distance) / segmentLength
      : 0;

    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;

    const angle = Math.atan2(
      b.y - a.y,
      b.x - a.x
    );

    return {
      x: x - Math.sin(angle) * offset,
      y: y + Math.cos(angle) * offset,
      angle
    };
  }

  // Desvio gradual para a linha L2
  function branchOffset(d) {
    const start = ROUTE.signal - 35;
    const end = ROUTE.station;

    if (d <= start) return 0;
    if (d >= end) return 38;

    const t = (d - start) / (end - start);

    return 38 * t * t * (3 - 2 * t);
  }

  function trainOffset(d) {
    if (d >= ROUTE.station) return 38;

    if (switchPosition === "L2" && d >= ROUTE.signal - 35) {
      return branchOffset(d);
    }

    return 0;
  }

  // ==========================================
  // AJUSTE DO MAPA NA TELA
  // ==========================================

  function updateMapTransform() {
    mapScale = Math.min(
      width / MAP.width,
      height / MAP.height
    );

    mapOffsetX = (width - MAP.width * mapScale) / 2;
    mapOffsetY = (height - MAP.height * mapScale) / 2;
  }

  // ==========================================
  // ELEMENTOS DO TERRENO
  // ==========================================

  function drawTree(x, y, size = 15) {
    ctx.fillStyle = "#63472e";
    ctx.fillRect(x - 3, y, 6, size);

    ctx.fillStyle = "#326b39";
    ctx.beginPath();
    ctx.arc(x, y - 5, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4d8b4b";
    ctx.beginPath();
    ctx.arc(x - 5, y - 9, size * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGround() {
    // Gramado fixo
    ctx.fillStyle = "#719b58";
    ctx.fillRect(0, 0, MAP.width, MAP.height);

    // Área rural
    ctx.fillStyle = "#a5a64d";
    ctx.fillRect(0, 170, 390, 330);

    // Faixas da plantação
    ctx.strokeStyle = "#c6bd66";
    ctx.lineWidth = 3;

    for (let x = 15; x < 370; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 210);
      ctx.lineTo(x, 470);
      ctx.stroke();
    }

    // Área urbana
    ctx.fillStyle = "#858d83";
    ctx.fillRect(620, 0, 380, 500);

    // Quadras e terrenos
    ctx.fillStyle = "#a6a99d";
    ctx.fillRect(650, 15, 320, 110);
    ctx.fillRect(660, 280, 320, 170);

    // Ruas
    ctx.fillStyle = "#555c61";
    ctx.fillRect(600, 20, 400, 35);
    ctx.fillRect(625, 115, 375, 28);
    ctx.fillRect(650, 265, 350, 28);

    // Marcas das ruas
    ctx.strokeStyle = "#e7dfc3";
    ctx.lineWidth = 2;
    ctx.setLineDash([14, 12]);

    ctx.beginPath();
    ctx.moveTo(620, 37);
    ctx.lineTo(1000, 37);
    ctx.moveTo(625, 129);
    ctx.lineTo(1000, 129);
    ctx.moveTo(650, 279);
    ctx.lineTo(1000, 279);
    ctx.stroke();

    ctx.setLineDash([]);

    // Fazenda e galpão
    drawFarm();

    // Construções urbanas
    drawTown();

    // Árvores espalhadas
    [
      [35, 200], [90, 275], [350, 315],
      [390, 390], [550, 80], [590, 350],
      [680, 65], [970, 190], [735, 450],
      [950, 465], [560, 450]
    ].forEach(p => drawTree(p[0], p[1], 13));
  }

  // ==========================================
  // FAZENDA
  // ==========================================

  function drawFarm() {
    // Galpão
    ctx.fillStyle = "#b84b38";
    ctx.fillRect(55, 260, 100, 65);

    ctx.fillStyle = "#71382c";
    ctx.beginPath();
    ctx.moveTo(45, 260);
    ctx.lineTo(105, 225);
    ctx.lineTo(165, 260);
    ctx.closePath();
    ctx.fill();

    // Portão
    ctx.fillStyle = "#493a2b";
    ctx.fillRect(90, 290, 30, 35);

    // Trator
    ctx.fillStyle = "#e2a51c";
    ctx.fillRect(210, 355, 55, 27);

    ctx.fillStyle = "#252525";
    ctx.beginPath();
    ctx.arc(220, 387, 11, 0, Math.PI * 2);
    ctx.arc(255, 387, 11, 0, Math.PI * 2);
    ctx.fill();

    // Cerca
    ctx.strokeStyle = "#e1d1a3";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(30, 420);
    ctx.lineTo(340, 420);
    ctx.moveTo(30, 440);
    ctx.lineTo(340, 440);
    ctx.stroke();

    for (let x = 30; x <= 340; x += 35) {
      ctx.fillRect(x, 410, 4, 40);
    }

    // Animais
    for (let i = 0; i < 3; i++) {
      const x = 90 + i * 75;

      ctx.fillStyle = "#eee2ca";
      ctx.beginPath();
      ctx.ellipse(x, 470, 15, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#8c684b";
      ctx.beginPath();
      ctx.arc(x + 12, 466, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Arial";
    ctx.fillText("FAZENDA", 65, 245);
  }

  // ==========================================
  // ÁREA URBANA
  // ==========================================

  function drawTown() {
    const buildings = [
      { x: 675, y: 65, w: 65, h: 43, color: "#d7c4a6" },
      { x: 765, y: 65, w: 75, h: 43, color: "#c7d0d4" },
      { x: 865, y: 65, w: 75, h: 43, color: "#d6b9a5" },
      { x: 680, y: 320, w: 65, h: 55, color: "#d7c4a6" },
      { x: 775, y: 320, w: 65, h: 55, color: "#c7d0d4" },
      { x: 870, y: 320, w: 75, h: 55, color: "#d6b9a5" }
    ];

    buildings.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);

      ctx.fillStyle = "#874e3e";
      ctx.fillRect(b.x - 4, b.y - 8, b.w + 8, 10);

      ctx.fillStyle = "#53748a";

      for (let i = 0; i < 2; i++) {
        ctx.fillRect(b.x + 12 + i * 28, b.y + 12, 13, 15);
      }

      ctx.fillStyle = "#69513e";
      ctx.fillRect(b.x + b.w / 2 - 7, b.y + b.h - 20, 14, 20);
    });

    // Pequeno comércio
    ctx.fillStyle = "#f0b323";
    ctx.fillRect(900, 205, 65, 35);

    ctx.fillStyle = "#263b4a";
    ctx.font = "bold 10px Arial";
    ctx.fillText("LOJA", 915, 227);
  }

  // ==========================================
  // TRILHOS E DORMENTES
  // ==========================================

  function drawRailway(start, end, offsetFunction) {
    const points = [];

    for (let d = start; d <= end; d += 5) {
      const offset = offsetFunction(d);
      points.push(getRoutePointAtDistance(d, offset));
    }

    if (points.length < 2) return;

    // Lastro
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });

    ctx.strokeStyle = "#a69b83";
    ctx.lineWidth = 31;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // Dormentes
    for (let d = start; d <= end; d += 18) {
      const p = getRoutePointAtDistance(d, offsetFunction(d));

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.fillStyle = "#57483a";
      ctx.fillRect(-5, -16, 10, 32);

      ctx.restore();
    }

    // Trilhos metálicos
    for (const side of [-1, 1]) {
      ctx.beginPath();

      points.forEach((p, i) => {
        const x = p.x - Math.sin(p.angle) * side * 8;
        const y = p.y + Math.cos(p.angle) * side * 8;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.strokeStyle = "#c8d0d4";
      ctx.lineWidth = 4;
      ctx.lineJoin = "round";
      ctx.stroke();
    }
  }

  function drawTracks() {
    // Linha principal L1
    drawRailway(0, routeLength, () => 0);

    // Linha paralela L2, com desvio gradual
    drawRailway(
      ROUTE.signal - 35,
      ROUTE.station + 45,
      d => branchOffset(d)
    );
  }

  // ==========================================
  // LOCOMOTIVA E VAGÕES
  // ==========================================

  function drawVehicle(position, type, number) {
    const offset = trainOffset(position);
    const p = getRoutePointAtDistance(position, offset);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

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

    // Faixa
    ctx.fillStyle = isLocomotive ? "#f0b323" : "#737f86";
    ctx.fillRect(
      -vehicleLength / 2 + 5,
      -vehicleWidth / 2 + 4,
      vehicleLength - 10,
      5
    );

    if (isLocomotive) {
      // Cabine
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

      ctx.fillStyle = "#ffffff";
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

    // Quatro vagões
    for (let i = TRAIN.wagons; i >= 1; i--) {
      drawVehicle(
        distance - i * spacing,
        "wagon",
        i
      );
    }

    // Locomotiva
    drawVehicle(distance, "locomotive", 0);
  }

  // ==========================================
  // PASSAGENS EM NÍVEL
  // ==========================================

  function drawCrossing(position, number) {
    const p = getRoutePointAtDistance(position);

    // A passagem fecha na aproximação e enquanto o trem ocupa o cruzamento
    const closed =
      distance >= position - 180 &&
      distance - TRAIN.length <= position + 15;

    if (number === 1) crossingOneClosed = closed;
    else crossingTwoClosed = closed;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    // Estrada perpendicular aos trilhos
    ctx.fillStyle = "#777d80";
    ctx.fillRect(-48, -105, 96, 210);

    // Faixas da estrada
    ctx.strokeStyle = "#e9e3ce";
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);

    ctx.beginPath();
    ctx.moveTo(0, -105);
    ctx.lineTo(0, 105);
    ctx.stroke();

    ctx.setLineDash([]);

    // Barreira
    ctx.fillStyle = "#343434";
    ctx.fillRect(-7, -78, 14, 12);

    ctx.save();
    ctx.translate(0, -72);
    ctx.rotate(closed ? 0 : -1.35);

    ctx.fillStyle = "#f0c323";
    ctx.fillRect(-65, -5, 130, 10);

    ctx.fillStyle = "#c62828";

    for (let i = 0; i < 6; i++) {
      ctx.fillRect(-55 + i * 21, -5, 10, 10);
    }

    ctx.restore();

    // Luz vermelha
    const flashing = Math.floor(performance.now() / 450) % 2 === 0;

    ctx.fillStyle = closed && flashing ? "#ff2525" : "#721515";
    ctx.beginPath();
    ctx.arc(-18, -90, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#343434";
    ctx.fillRect(-25, -105, 14, 12);

    ctx.restore();

    // Carro parado antes da passagem
    if (closed) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      ctx.fillStyle = "#e6e6e6";
      ctx.fillRect(18, -125, 32, 18);

      ctx.fillStyle = "#273746";
      ctx.fillRect(24, -122, 9, 12);

      ctx.restore();
    }
  }

  // ==========================================
  // SINAL FERROVIÁRIO
  // ==========================================

  function drawSignal() {
    const p = getRoutePointAtDistance(ROUTE.signal);

    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = "#343434";
    ctx.fillRect(-4, -72, 8, 72);

    ctx.fillStyle = "#252525";
    ctx.fillRect(-15, -108, 30, 38);

    ctx.fillStyle = "#c62828";
    ctx.beginPath();
    ctx.arc(0, -94, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f0b323";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SINAL", 0, -116);

    ctx.restore();
  }

  // ==========================================
  // ESTAÇÃO E LINHAS L1 / L2
  // ==========================================

  function drawStation() {
    const p = getRoutePointAtDistance(ROUTE.station);

    // Plataforma ao lado das linhas
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    ctx.fillStyle = "#c6c3b8";
    ctx.fillRect(-100, 65, 210, 38);

    ctx.fillStyle = "#e9dfb6";
    ctx.fillRect(-100, 65, 210, 5);

    // Cobertura
    ctx.fillStyle = "#174a67";
    ctx.fillRect(-25, 105, 110, 34);

    ctx.fillStyle = "#f0b323";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ESTAÇÃO", 30, 127);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.fillText("L1", -65, 55);
    ctx.fillText("L2", -65, 25);

    ctx.restore();
  }

  // ==========================================
  // DESVIO E AMV
  // ==========================================

  function drawSwitch() {
    const start = ROUTE.signal - 35;
    const end = ROUTE.station;

    const p1 = getRoutePointAtDistance(start);
    const p2 = getRoutePointAtDistance(end, 38);

    ctx.strokeStyle = "#f0b323";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    ctx.fillStyle = "#f0b323";
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Arial";
    ctx.fillText("AMV", p1.x + 12, p1.y - 12);
  }

  // ==========================================
  // OBSTÁCULO NA VIA
  // ==========================================

  function drawHazard() {
    if (hazardCleared) return;

    const p = getRoutePointAtDistance(hazardPosition, 30);

    ctx.save();
    ctx.translate(p.x, p.y);

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

    updateMapTransform();

    ctx.clearRect(0, 0, width, height);

    ctx.save();

    ctx.translate(mapOffsetX, mapOffsetY);
    ctx.scale(mapScale, mapScale);

    // Cenário fixo
    drawGround();

    // Trilhos
    drawTracks();

    // Elementos ferroviários
    drawCrossing(ROUTE.crossingOne, 1);
    drawCrossing(ROUTE.crossingTwo, 2);

    drawSwitch();
    drawStation();
    drawSignal();

    // Obstáculo e composição
    drawHazard();
    drawTrain();

    ctx.restore();
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
  


 
