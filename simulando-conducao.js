
/* ==========================================
   SIMULADOR DE CONDUÇÃO 2.0
   MOVIMENTAÇÃO DA COMPOSIÇÃO FERROVIÁRIA
========================================== */

(() => {
  "use strict";

  const route = document.getElementById("railwayRoute");
  const trainComposition = document.getElementById("trainComposition");

  const speedDisplay = document.getElementById("speedValue");
  const tractionDisplay = document.getElementById("tractionValue");
  const reverserDisplay = document.getElementById("reverserValue");
  const messageDisplay = document.getElementById("gameMessage");

  if (!route || !trainComposition) {
    console.error("Elementos da ferrovia não encontrados.");
    return;
  }

  // Localiza os veículos dentro da composição.
  // Isso evita confusão com o símbolo da locomotiva dentro de <defs>.
  const locomotive = trainComposition.querySelector('use[id="locomotive"]');

  const wagons = [
    trainComposition.querySelector("#wagon1"),
    trainComposition.querySelector("#wagon2"),
    trainComposition.querySelector("#wagon3"),
    trainComposition.querySelector("#wagon4")
  ];

  if (!locomotive || wagons.some(wagon => !wagon)) {
    console.error("Não foi possível localizar todos os veículos.");
    return;
  }

  // CONFIGURAÇÕES OPERACIONAIS

  const MAX_SPEED = 80;
  const SPEED_STEP = 5;
  const WAGON_SPACING = 105;

  let speed = 0;
  let distance = 0;
  let routeLength = 0;
  let lastFrame = 0;
  let animationStarted = false;
  let finished = false;

  // Inicialização da rota.
  try {
    routeLength = route.getTotalLength();

    if (!routeLength || !Number.isFinite(routeLength)) {
      throw new Error("Comprimento da rota inválido.");
    }
  } catch (error) {
    console.error("Erro ao carregar a rota ferroviária:", error);
    return;
  }

  // Posicionamento inicial da locomotiva.
  distance = Math.min(700, routeLength - WAGON_SPACING * 4);

  if (distance < 0) {
    distance = 0;
  }

  // ATUALIZAÇÃO DO PAINEL

  function updatePanel() {
    const traction = speed === 0
      ? 0
      : Math.min(8, Math.ceil(speed / 10));

    if (speedDisplay) {
      speedDisplay.textContent = speed;
    }

    if (tractionDisplay) {
      tractionDisplay.textContent = traction;
    }

    if (reverserDisplay) {
      reverserDisplay.textContent = speed === 0 ? "N" : "F";
    }
  }

  function showMessage(message) {
    if (messageDisplay) {
      messageDisplay.textContent = message;
    }
  }

  // POSICIONAMENTO DOS VEÍCULOS NA VIA

  function positionVehicle(vehicle, vehicleDistance) {
    const safeDistance = Math.max(
      0,
      Math.min(routeLength, vehicleDistance)
    );

    const point = route.getPointAtLength(safeDistance);

    const nextDistance = Math.min(
      routeLength,
      safeDistance + 2
    );

    const nextPoint = route.getPointAtLength(nextDistance);

    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

    vehicle.setAttribute(
      "transform",
      `translate(${point.x} ${point.y}) rotate(${angle})`
    );
  }

  // POSICIONA A COMPOSIÇÃO COMPLETA

  function positionTrain() {
    positionVehicle(locomotive, distance);

    wagons.forEach((wagon, index) => {
      const wagonDistance = distance - WAGON_SPACING * (index + 1);

      positionVehicle(wagon, wagonDistance);
    });
  }

  // CONTROLE DE VELOCIDADE

  function increaseSpeed() {
    if (finished) return;

    if (speed < MAX_SPEED) {
      speed = Math.min(MAX_SPEED, speed + SPEED_STEP);

      updatePanel();

      showMessage(
        `Tração aplicada. Velocidade atual: ${speed} km/h.`
      );
    } else {
      showMessage("Velocidade máxima permitida no simulador atingida.");
    }
  }

  function decreaseSpeed() {
    if (speed > 0) {
      speed = Math.max(0, speed - SPEED_STEP);

      updatePanel();

      if (speed === 0) {
        showMessage("Composição parada. Reversor em neutro.");
      } else {
        showMessage(`Reduzindo velocidade: ${speed} km/h.`);
      }
    }
  }

  function stopTrain() {
    speed = 0;

    updatePanel();

    showMessage("Freio aplicado. Composição parada.");
  }

  // ANIMAÇÃO DA COMPOSIÇÃO

  function animate(timestamp) {
    if (!animationStarted) return;

    if (!lastFrame) {
      lastFrame = timestamp;
    }

    const elapsed = Math.min(timestamp - lastFrame, 50);
    lastFrame = timestamp;

    if (speed > 0 && !finished) {
      // Conversão da velocidade para deslocamento no cenário.
      const movement = speed * elapsed * 0.0035;

      distance += movement;

      if (distance >= routeLength) {
        distance = routeLength;
        speed = 0;
        finished = true;

        updatePanel();

        showMessage(
          "A composição chegou ao final do trecho ferroviário."
        );
      }
    }

    positionTrain();

    requestAnimationFrame(animate);
  }

  // INICIA A ANIMAÇÃO

  function startAnimation() {
    if (animationStarted) return;

    animationStarted = true;
    lastFrame = 0;

    requestAnimationFrame(animate);
  }

  // TECLADO

  document.addEventListener("keydown", event => {
    if (
      event.target &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)
    ) {
      return;
    }

    if (
      event.code === "ArrowUp" ||
      event.code === "ArrowDown" ||
      event.code === "Space"
    ) {
      event.preventDefault();
    }

    if (event.repeat) return;

    switch (event.code) {
      case "ArrowUp":
        increaseSpeed();
        break;

      case "ArrowDown":
        decreaseSpeed();
        break;

      case "Space":
        stopTrain();
        break;
    }
  });

  // PREPARAÇÃO INICIAL

  positionTrain();
  updatePanel();
  startAnimation();

  showMessage(
    "Simulador pronto. Utilize a seta para cima para movimentar a composição."
  );

})();
