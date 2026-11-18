
(() => {
  "use strict";

  // ==================================================
  // MUNDO FERROVIÁRIO
  // SIMULANDO CONDUÇÃO 2D
  // ==================================================

  const $ = (id) => document.getElementById(id);

  const scene = $("railwayScene");
  const train = $("trainComposition");
  const route = $("railwayRoute");
  const locomotive = $("locomotive");

  const wagons = [
    $("wagon1"),
    $("wagon2"),
    $("wagon3"),
    $("wagon4")
  ];

  if (
    !scene ||
    !train ||
    !route ||
    !locomotive ||
    wagons.some(wagon => !wagon)
  ) {
    console.error("Erro: confira os elementos SVG do simulador.");
    return;
  }

  if (typeof route.getTotalLength !== "function") {
    console.error("A rota precisa ser um SVG path.");
    return;
  }

  // ==================================================
  // CONFIGURAÇÕES
  // ==================================================

  const CONFIG = {
    velocidadeMaxima: 80,
    aceleracao: 2.8,
    freioServico: 7,
    freioEmergencia: 15,
    desaceleracaoNatural: 0.12,
    distanciaEntreVagoes: 150,
    fatorVelocidade: 1.5,
    distanciaInicial: 700
  };

  const routeLength = route.getTotalLength();

  let distance = Math.min(
    CONFIG.distanciaInicial,
    routeLength
  );

  let speed = 0;
  let throttle = 0;
  let brake = 0;

  // 1 = frente | 0 = neutro | -1 = ré
  let direction = 1;

  let emergency = false;
  let running = true;

  let previousTime = 0;
  let animationFrame = null;

  // ==================================================
  // INTERFACE
  // ==================================================

  const ui = {
    speed: $("speed"),
    distance: $("distance"),
    throttle: $("throttle"),
    reverser: $("reverser"),
    brake: $("brakePressure"),
    brakeValue: $("brakeValue"),

    throttleButton: $("throttleButton"),
    reverseButton: $("reverseButton"),
    brakeControl: $("brakeControl"),

    hornButton: $("hornButton"),
    bellButton: $("bellButton"),
    emergencyButton: $("emergencyButton"),

    message: $("gameMessage")
  };

  // ==================================================
  // MENSAGENS
  // ==================================================

  function message(text) {
    if (ui.message) {
      ui.message.textContent = text;
    }
  }

  // ==================================================
  // INDICADORES
  // ==================================================

  function updateInterface() {

    if (ui.speed) {
      ui.speed.textContent =
        Math.round(speed) + " km/h";
    }

    if (ui.distance) {
      ui.distance.textContent =
        Math.round(distance) + " m";
    }

    if (ui.throttle) {
      ui.throttle.textContent =
        throttle === 0 ? "N" : throttle;
    }

    if (ui.reverser) {
      ui.reverser.textContent =
        direction === 1
          ? "FRENTE"
          : direction === -1
            ? "RÉ"
            : "NEUTRO";
    }

    if (ui.brake) {
      ui.brake.textContent = brake + "%";
    }

    if (ui.brakeValue) {
      ui.brakeValue.textContent = brake + "%";
    }

    if (ui.throttleButton) {
      ui.throttleButton.textContent =
        throttle === 0
          ? "Tração 1/8"
          : "Tração " + throttle + "/8";
    }

    if (ui.reverseButton) {
      ui.reverseButton.textContent =
        direction === 1
          ? "Frente"
          : direction === 0
            ? "Neutro"
            : "Ré";
    }

    if (ui.emergencyButton) {
      ui.emergencyButton.textContent =
        emergency
          ? "LIBERAR EMERGÊNCIA"
          : "⚠️ FREIO DE EMERGÊNCIA";
    }
  }

  // ==================================================
  // POSIÇÃO NA ROTA
  // ==================================================

  function getPosition(position, movementDirection = direction) {

    const safePosition = Math.max(
      0,
      Math.min(routeLength, position)
    );

    const point = route.getPointAtLength(safePosition);

    const before = route.getPointAtLength(
      Math.max(0, safePosition - 2)
    );

    const after = route.getPointAtLength(
      Math.min(routeLength, safePosition + 2)
    );

    let angle = Math.atan2(
      after.y - before.y,
      after.x - before.x
    ) * 180 / Math.PI;

    if (movementDirection === -1) {
      angle += 180;
    }

    return {
      x: point.x,
      y: point.y,
      angle: angle + 90
    };
  }

  // ==================================================
  // DESENHO DA COMPOSIÇÃO
  // ==================================================

  function drawTrain() {

    // A locomotiva ocupa a posição principal.

    const locomotivePosition = getPosition(distance);

    locomotive.setAttribute(
      "transform",
      `translate(${locomotivePosition.x} ${locomotivePosition.y}) rotate(${locomotivePosition.angle})`
    );

    // Cada vagão recebe sua própria posição na curva.

    wagons.forEach((wagon, index) => {

      const offset =
        CONFIG.distanciaEntreVagoes * (index + 1);

      const wagonDistance =
        distance - direction * offset;

      const position = getPosition(wagonDistance);

      wagon.setAttribute(
        "transform",
        `translate(${position.x} ${position.y}) rotate(${position.angle})`
      );

    });

    // O grupo principal não deve aplicar uma segunda rotação.
    train.removeAttribute("transform");
  }

  // ==================================================
  // TRAÇÃO
  // ==================================================

  function increaseThrottle() {

    if (emergency) return;

    if (direction === 0) {
      message("Selecione frente ou ré antes de movimentar.");
      return;
    }

    if (brake > 0) {
      message("Libere o freio antes de aplicar tração.");
      return;
    }

    throttle = Math.min(8, throttle + 1);

    updateInterface();

    message("Tração ajustada para " + throttle + ".");
  }

  function decreaseThrottle() {

    throttle = Math.max(0, throttle - 1);

    updateInterface();

    message(
      throttle === 0
        ? "Tração em neutro."
        : "Tração reduzida para " + throttle + "."
    );
  }

  // ==================================================
  // REVERSOR
  // ==================================================

  function changeDirection() {

    if (emergency) return;

    if (speed > 0.5) {
      message("Pare completamente antes de mudar o reversor.");
      return;
    }

    if (direction === 1) {
      direction = 0;
    } else if (direction === 0) {
      direction = -1;
    } else {
      direction = 1;
    }

    throttle = 0;

    drawTrain();
    updateInterface();

    message(
      direction === 1
        ? "Reversor em FRENTE."
        : direction === -1
          ? "Reversor em RÉ."
          : "Reversor em NEUTRO."
    );
  }

  // ==================================================
  // FREIO DE SERVIÇO
  // ==================================================

  function applyBrake(value) {

    if (emergency) return;

    brake = Math.max(
      0,
      Math.min(100, Number(value) || 0)
    );

    if (brake > 0) {
      throttle = 0;
    }

    updateInterface();
  }

  // ==================================================
  // FREIO DE EMERGÊNCIA
  // ==================================================

  function emergencyBrake() {

    if (!emergency) {

      emergency = true;
      throttle = 0;
      brake = 100;

      if (ui.brakeControl) {
        ui.brakeControl.value = 100;
      }

      message("ATENÇÃO! FREIO DE EMERGÊNCIA APLICADO.");

    } else {

      if (speed > 0.5) {
        message("Aguarde a parada completa para liberar a emergência.");
        return;
      }

      emergency = false;
      brake = 0;

      if (ui.brakeControl) {
        ui.brakeControl.value = 0;
      }

      message("Freio de emergência liberado.");
    }

    updateInterface();
  }

  // ==================================================
  // FÍSICA FERROVIÁRIA
  // ==================================================

  function updatePhysics(delta) {

    let acceleration = 0;

    if (emergency) {

      acceleration = -CONFIG.freioEmergencia;

    } else if (brake > 0) {

      acceleration =
        -(CONFIG.freioServico * brake / 100);

    } else if (direction !== 0 && throttle > 0) {

      acceleration =
        CONFIG.aceleracao * throttle / 8;

    } else {

      acceleration = -CONFIG.desaceleracaoNatural;

    }

    speed += acceleration * delta;

    speed = Math.max(
      0,
      Math.min(CONFIG.velocidadeMaxima, speed)
    );

    // A composição não se movimenta em neutro.

    if (direction !== 0 && speed > 0) {

      const movement =
        speed * delta * CONFIG.fatorVelocidade;

      distance += movement * direction;

    }

    // Limites da rota.

    if (distance >= routeLength) {

      distance = routeLength;
      speed = 0;
      throttle = 0;

      message("Fim da rota. Composição parada.");

    } else if (distance <= 0) {

      distance = 0;
      speed = 0;
      throttle = 0;

      message("Início da rota alcançado.");

    }

    // A velocidade chega a zero naturalmente.

    if (speed < 0.05) {
      speed = 0;
    }
  }

  // ==================================================
  // BUZINA
  // ==================================================

  function horn() {
    message("Buzina ferroviária acionada.");
  }

  // ==================================================
  // SINO
  // ==================================================

  function bell() {
    message("Sino ferroviário acionado.");
  }

  // ==================================================
  // EVENTOS DOS BOTÕES
  // ==================================================

  ui.throttleButton?.addEventListener(
    "click",
    increaseThrottle
  );

  ui.reverseButton?.addEventListener(
    "click",
    changeDirection
  );

  ui.brakeControl?.addEventListener(
    "input",
    event => applyBrake(event.target.value)
  );

  ui.emergencyButton?.addEventListener(
    "click",
    emergencyBrake
  );

  ui.hornButton?.addEventListener(
    "click",
    horn
  );

  ui.bellButton?.addEventListener(
    "click",
    bell
  );

  // ==================================================
  // TECLADO
  // ==================================================

  document.addEventListener("keydown", event => {

    if (!running) return;

    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      increaseThrottle();
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      decreaseThrottle();
    }

    if (event.code === "Space") {
      event.preventDefault();
      emergencyBrake();
    }

    if (event.key.toLowerCase() === "r") {
      changeDirection();
    }

  });

  // ==================================================
  // ANIMAÇÃO
  // ==================================================

  function gameLoop(timestamp) {

    if (!running) return;

    if (!previousTime) {
      previousTime = timestamp;
    }

    const delta = Math.min(
      (timestamp - previousTime) / 1000,
      0.05
    );

    previousTime = timestamp;

    updatePhysics(delta);
    drawTrain();
    updateInterface();

    animationFrame = requestAnimationFrame(gameLoop);
  }

  // ==================================================
  // INICIALIZAÇÃO
  // ==================================================

  drawTrain();
  updateInterface();

  animationFrame = requestAnimationFrame(gameLoop);

  console.log(
    "Mundo Ferroviário: Simulando Condução 2D iniciado."
  );

})();
