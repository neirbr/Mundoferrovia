
/* =========================================
   MUNDO FERROVIÁRIO
   SIMULADOR DE CONDUÇÃO 2.0
   MOVIMENTAÇÃO DA COMPOSIÇÃO
   ========================================= */

(() => {
  "use strict";

  const railwayRoute = document.getElementById("railwayRoute");
  const locomotive = document.getElementById("locomotive");

  const wagonIds = [
    "wagon1",
    "wagon2",
    "wagon3",
    "wagon4"
  ];

  const wagons = wagonIds.map(id =>
    document.getElementById(id)
  );

  const speedValue = document.getElementById("speedValue");
  const tractionValue = document.getElementById("tractionValue");
  const reverserValue = document.getElementById("reverserValue");
  const gameMessage = document.getElementById("gameMessage");

  if (!railwayRoute || !locomotive || wagons.some(w => !w)) {
    console.error(
      "Simulador: não foi possível localizar todos os elementos da composição."
    );

    if (gameMessage) {
      gameMessage.textContent =
        "Erro ao inicializar a composição. Verifique os elementos do simulador.";
    }

    return;
  }

  /* =========================================
     CONFIGURAÇÕES INICIAIS
     ========================================= */

  const routeLength = railwayRoute.getTotalLength();

  let distance = 0;
  let speed = 0;
  let traction = 0;
  let running = false;
  let lastFrame = 0;

  const MAX_SPEED = 80;
  const MAX_TRACTION = 8;

  const ACCELERATION = 5;
  const BRAKING = 9;

  const WAGON_SPACING = 105;

  /* =========================================
     DIMENSÕES DOS VEÍCULOS
     ========================================= */

  const vehicleDimensions = {
    locomotive: {
      width: 95,
      height: 45
    },
    wagon: {
      width: 75,
      height: 35
    }
  };

  /* =========================================
     POSICIONAMENTO SOBRE OS TRILHOS
     ========================================= */

  function positionVehicle(element, position, dimensions) {
    const point = railwayRoute.getPointAtLength(position);

    const nextPosition = Math.min(
      position + 2,
      routeLength
    );

    const nextPoint = railwayRoute.getPointAtLength(nextPosition);

    const angle =
      Math.atan2(
        nextPoint.y - point.y,
        nextPoint.x - point.x
      ) * 180 / Math.PI;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    element.setAttribute(
      "transform",
      `translate(${point.x} ${point.y}) rotate(${angle}) translate(${-centerX} ${-centerY})`
    );
  }

  function updateTrainPosition() {
    /* Locomotiva à frente */
    positionVehicle(
      locomotive,
      distance,
      vehicleDimensions.locomotive
    );

    /* Vagões atrás da locomotiva */
    wagons.forEach((wagon, index) => {
      const wagonPosition = Math.max(
        0,
        distance - WAGON_SPACING * (index + 1)
      );

      positionVehicle(
        wagon,
        wagonPosition,
        vehicleDimensions.wagon
      );
    });
  }

  /* =========================================
     ATUALIZAÇÃO DO PAINEL
     ========================================= */

  function updateDashboard() {
    if (speedValue) {
      speedValue.textContent =
        `${Math.round(speed)} km/h`;
    }

    if (tractionValue) {
      tractionValue.textContent = traction;
    }

    if (reverserValue) {
      reverserValue.textContent = "F";
    }
  }

  function showMessage(message) {
    if (gameMessage) {
      gameMessage.textContent = message;
    }
  }

  /* =========================================
     CONTROLE TEMPORÁRIO DE MOVIMENTAÇÃO
     ========================================= */

  function increaseSpeed() {
    if (speed >= MAX_SPEED) {
      speed = MAX_SPEED;
      return;
    }

    speed = Math.min(
      MAX_SPEED,
      speed + ACCELERATION
    );

    traction = Math.min(
      MAX_TRACTION,
      Math.ceil(speed / (MAX_SPEED / MAX_TRACTION))
    );

    running = true;

    showMessage("Composição em movimento. Tração aplicada.");
    updateDashboard();
  }

  function decreaseSpeed() {
    speed = Math.max(
      0,
      speed - BRAKING
    );

    traction = Math.max(
      0,
      Math.floor(speed / (MAX_SPEED / MAX_TRACTION))
    );

    if (speed === 0) {
      running = false;
      showMessage("Composição parada.");
    } else {
      showMessage("Reduzindo a velocidade da composição.");
    }

    updateDashboard();
  }

  function toggleMovement() {
    if (running) {
      running = false;
      speed = 0;
      traction = 0;

      showMessage("Composição parada pelo operador.");
    } else {
      running = true;

      if (speed === 0) {
        speed = 10;
        traction = 1;
      }

      showMessage("Movimentação retomada.");
    }

    updateDashboard();
  }

  /* =========================================
     ANIMAÇÃO DA COMPOSIÇÃO
     ========================================= */

  function animate(timestamp) {
    if (!lastFrame) {
      lastFrame = timestamp;
    }

    const deltaTime = Math.min(
      (timestamp - lastFrame) / 1000,
      0.05
    );

    lastFrame = timestamp;

    if (running && speed > 0) {
      /*
       * Conversão simplificada de velocidade
       * para deslocamento no cenário.
       */

      const movement = speed * deltaTime * 1.5;

      distance += movement;

      /*
       * Ao chegar ao final do percurso,
       * a composição para em segurança.
       */

      if (distance >= routeLength) {
        distance = routeLength;
        speed = 0;
        traction = 0;
        running = false;

        showMessage(
          "Composição chegou ao final do trecho."
        );

        updateDashboard();
      }

      updateTrainPosition();
    }

    requestAnimationFrame(animate);
  }

  /* =========================================
     TECLADO - CONTROLES TEMPORÁRIOS
     ========================================= */

  document.addEventListener("keydown", event => {
    if (
      event.target &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(
        event.target.tagName
      )
    ) {
      return;
    }

    if (event.code === "ArrowUp") {
      event.preventDefault();
      increaseSpeed();
    }

    if (event.code === "ArrowDown") {
      event.preventDefault();
      decreaseSpeed();
    }

    if (event.code === "Space") {
      event.preventDefault();
      toggleMovement();
    }
  });

  /* =========================================
     INICIALIZAÇÃO
     ========================================= */

  function initializeSimulator() {
    distance = 0;
    speed = 0;
    traction = 0;
    running = false;

    updateTrainPosition();
    updateDashboard();

    showMessage(
      "Simulador pronto. Use as setas do teclado para movimentar a composição."
    );

    requestAnimationFrame(animate);
  }

  initializeSimulator();

})();
