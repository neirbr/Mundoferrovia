
(() => {
  "use strict";

  // ==================================================
  // MUNDO FERROVIÁRIO
  // SIMULADOR DE CONDUÇÃO 2D — VISÃO SUPERIOR
  // ==================================================

  const $ = (id) => document.getElementById(id);

  const scene =
    $("railwayScene") ||
    $("railwayCanvas");

  const train = $("trainComposition");

  const route =
    $("railwayRoute") ||
    document.querySelector("#railwayTracks path[data-route]") ||
    document.querySelector("#railwayTracks path.railway-route") ||
    document.querySelector("#railwayTracks path");

  const locomotive = $("locomotive");

  const wagons = [
    $("wagon1"),
    $("wagon2"),
    $("wagon3"),
    $("wagon4")
  ].filter(Boolean);

  if (!scene || !train || !route || !locomotive) {
    console.error(
      "Simulador: confira os elementos railwayScene, trainComposition, railwayRoute e locomotive no HTML."
    );
    return;
  }

  if (typeof route.getTotalLength !== "function") {
    console.error("A rota ferroviária precisa ser um elemento SVG path.");
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
    distanciaEntreVagoes: 0,
    fatorVelocidade: 1.5
  };

  const routeLength = route.getTotalLength();

  let distance = 0;
  let speed = 0;
  let throttle = 0;
  let brake = 0;

  let direction = 1;
  let running = true;
  let emergency = false;
  let penalty = false;

  let previousTime = 0;
  let animationFrame = null;

  // ==================================================
  // ELEMENTOS DA INTERFACE
  // ==================================================

  const ui = {
    speed: $("speedValue") || $("speed"),
    distance: $("distance"),
    throttle: $("tractionValue") || $("throttle"),
    reverser: $("reverserValue") || $("reverser"),
    brake: $("brakePressure"),
    brakeValue: $("brakeValue"),
    message: $("gameMessage"),
    throttleButton: $("throttleButton"),
    reverseButton: $("reverseButton"),
    brakeControl: $("brakeControl"),
    hornButton: $("hornButton"),
    bellButton: $("bellButton"),
    emergencyButton: $("emergencyButton"),
    removePenaltyButton: $("removePenaltyButton")
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
  // ATUALIZAÇÃO DOS INDICADORES
  // ==================================================

  function updateInterface() {
    if (ui.speed) {
      ui.speed.textContent = Math.round(speed) + " km/h";
    }

    if (ui.distance) {
      ui.distance.textContent =
        Math.round(distance) + " m";
    }

    if (ui.throttle) {
      ui.throttle.textContent = throttle;
    }

    if (ui.reverser) {
      ui.reverser.textContent =
        direction === 1 ? "FRENTE" : "RÉ";
    }

    if (ui.brake) {
      ui.brake.textContent = brake + "%";
    }

    if (ui.brakeValue) {
      ui.brakeValue.textContent = brake + "%";
    }
  }

  // ==================================================
  // POSICIONAMENTO DA COMPOSIÇÃO
  // ==================================================

  function getPosition(position) {
    const point = route.getPointAtLength(
      Math.max(0, Math.min(routeLength, position))
    );

    const nextPosition = Math.min(
      routeLength,
      Math.max(0, position + 1)
    );

    const next = route.getPointAtLength(nextPosition);

    let angle = Math.atan2(
      next.y - point.y,
      next.x - point.x
    ) * 180 / Math.PI;

    if (direction === -1) {
      angle += 180;
    }

    return {
      x: point.x,
      y: point.y,
      angle
    };
  }

  function drawTrain() {
    const position = getPosition(distance);

    train.setAttribute(
      "transform",
      `translate(${position.x} ${position.y}) rotate(${position.angle})`
    );
  }

  // ==================================================
  // CONTROLE DE TRAÇÃO
  // ==================================================

  function increaseThrottle() {
    if (!running || penalty || emergency) return;

    if (speed > 0 && direction === 0) return;

    throttle = Math.min(8, throttle + 1);

    if (brake > 0) {
      brake = 0;

      if (ui.brakeControl) {
        ui.brakeControl.value = 0;
      }
    }

    message("Tração ajustada para nível " + throttle);

    updateInterface();
  }

  // ==================================================
  // REDUÇÃO DE TRAÇÃO
  // ==================================================

  function decreaseThrottle() {
    throttle = Math.max(0, throttle - 1);
    updateInterface();
  }

  // ==================================================
  // REVERSOR
  // ==================================================

  function changeDirection() {
    if (!running || penalty) return;

    if (speed > 0.5) {
      message("É necessário parar completamente para inverter o reversor.");
      return;
    }

    direction *= -1;

    updateInterface();

    drawTrain();

    message(
      direction === 1
        ? "Reversor em posição de frente."
        : "Reversor em posição de ré."
    );
  }

  // ==================================================
  // FREIO DE SERVIÇO
  // ==================================================

  function applyBrake(value) {
    if (!running) return;

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
    if (!running) return;

    emergency = true;
    throttle = 0;
    brake = 100;

    if (ui.brakeControl) {
      ui.brakeControl.value = 100;
    }

    message("FREIO DE EMERGÊNCIA APLICADO!");

    updateInterface();
  }

  // ==================================================
  // RETIRADA DE PENALIDADE
  // ==================================================

  function removePenalty() {
    if (!penalty) return;

    if (speed > 0.5) {
      message("Aguarde a parada completa da composição.");
      return;
    }

    penalty = false;
    emergency = false;
    brake = 0;

    if (ui.brakeControl) {
      ui.brakeControl.value = 0;
    }

    updateInterface();

    message("Penalidade retirada. Operação liberada.");
  }

  // ==================================================
  // FÍSICA DA COMPOSIÇÃO
  // ==================================================

  function updatePhysics(delta) {
    if (!running || penalty) return;

    let acceleration = 0;

    if (emergency) {
      acceleration = -CONFIG.freiEmergencia;
    } else if (brake > 0) {
      acceleration =
        -(CONFIG.freioServico * brake / 100);
    } else if (throttle > 0) {
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

    const movement =
      speed * delta * CONFIG.fatorVelocidade;

    distance += movement * direction;

    distance = Math.max(
      0,
      Math.min(routeLength, distance)
    );

    if (
      (direction === 1 && distance >= routeLength) ||
      (direction === -1 && distance <= 0)
    ) {
      speed = 0;
      throttle = 0;
      brake = 0;

      message("Composição chegou ao limite da rota.");

      updateInterface();
    }
  }

  // ==================================================
  // ANIMAÇÃO PRINCIPAL
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
  // BUZINA
  // ==================================================

  function horn() {
    if (!running) return;

    message("Buzina acionada.");
  }

  // ==================================================
  // SINO
  // ==================================================

  function bell() {
    if (!running) return;

    message("Sino acionado.");
  }

  // ==================================================
  // EVENTOS DOS CONTROLES
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
    (event) => applyBrake(event.target.value)
  );

  ui.emergencyButton?.addEventListener(
    "click",
    emergencyBrake
  );

  ui.removePenaltyButton?.addEventListener(
    "click",
    removePenalty
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
  // CONTROLES PELO TECLADO
  // ==================================================

  document.addEventListener("keydown", (event) => {
    if (!running) return;

    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) return;

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
  // INICIALIZAÇÃO
  // ==================================================

  drawTrain();
  updateInterface();

  previousTime = 0;

  animationFrame = requestAnimationFrame(gameLoop);

  console.log(
    "Mundo Ferroviário: Simulador de Condução 2D iniciado."
  );

})();
