document.addEventListener("DOMContentLoaded", () => {

  "use strict";

  // ==========================================
  // MUNDO FERROVIÁRIO
  // SIMULADOR DE CONDUÇÃO 2.0
  // ==========================================

  const simulator = {
    initialized: false,

    elements: {
      scenario: document.getElementById("railwayScenario"),
      locomotive: document.getElementById("locomotive"),
      wagon1: document.getElementById("wagon1"),
      wagon2: document.getElementById("wagon2"),
      composition: document.getElementById("trainComposition"),
      line1: document.getElementById("sleepersL1"),
      line2: document.getElementById("sleepersL2"),
      switchArea: document.getElementById("switchArea"),
      crossing: document.getElementById("levelCrossing"),
      barrier: document.getElementById("barrier"),
      signals: document.getElementById("signals"),
      vehicles: document.getElementById("roadVehicles"),
      vegetation: document.getElementById("vegetation"),
      lighting: document.getElementById("lighting")
    },

    configuration: {
      view: "top-down",
      fixedScenario: true,
      movementEnabled: false,
      controlsEnabled: false,
      initialLine: "L1",
      initialSpeed: 0,
      tractionPoint: 0,
      reverser: "N",
      brakeApplied: true
    },

    train: {
      locomotive: {
        id: "locomotive",
        position: {
          x: 425,
          y: 215
        },
        direction: 0
      },

      wagons: [
        {
          id: "wagon1",
          position: {
            x: 300,
            y: 215
          }
        },
        {
          id: "wagon2",
          position: {
            x: 190,
            y: 215
          }
        }
      ]
    }
  };

  // ==========================================
  // VERIFICAÇÃO DOS ELEMENTOS
  // ==========================================

  function checkScenarioElements() {

    const missingElements = [];

    Object.entries(simulator.elements).forEach(([name, element]) => {

      if (!element) {
        missingElements.push(name);
      }

    });

    if (missingElements.length > 0) {

      console.error(
        "Mundo Ferroviário: elementos não encontrados:",
        missingElements
      );

      return false;
    }

    return true;
  }

  // ==========================================
  // PREPARAÇÃO DA COMPOSIÇÃO
  // ==========================================

  function prepareTrain() {

    const train = simulator.train;

    const locomotive = simulator.elements.locomotive;

    locomotive.setAttribute(
      "transform",
      `translate(${train.locomotive.position.x} ${train.locomotive.position.y}) rotate(${train.locomotive.direction})`
    );

    train.wagons.forEach(wagon => {

      const wagonElement = document.getElementById(wagon.id);

      wagonElement.setAttribute(
        "transform",
        `translate(${wagon.position.x} ${wagon.position.y})`
      );

    });

  }

  // ==========================================
  // PREPARAÇÃO DO CENÁRIO FIXO
  // ==========================================

  function prepareScenario() {

    const scenario = simulator.elements.scenario;

    scenario.style.display = "block";

    scenario.style.width = "100%";

    scenario.style.height = "auto";

    scenario.style.overflow = "visible";

    scenario.style.transform = "none";

  }

  // ==========================================
  // CONFIGURAÇÃO INICIAL
  // ==========================================

  function initializeSimulator() {

    if (simulator.initialized) {
      return;
    }

    const elementsValid = checkScenarioElements();

    if (!elementsValid) {

      console.error(
        "Mundo Ferroviário: não foi possível inicializar o cenário."
      );

      return;
    }

    prepareScenario();

    prepareTrain();

    simulator.initialized = true;

    console.info(
      "Mundo Ferroviário: Simulador de Condução 2.0 inicializado."
    );

    console.info(
      "Cenário fixo carregado."
    );

    console.info(
      "Locomotiva e vagões posicionados na linha L1."
    );

    console.info(
      "Movimentação e controles ainda desativados."
    );

  }

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================

  initializeSimulator();

});
