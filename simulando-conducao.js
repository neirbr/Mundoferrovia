
document.addEventListener("DOMContentLoaded", () => {

  "use strict";

  // ==========================================
  // MUNDO FERROVIÁRIO
  // SIMULADOR DE CONDUÇÃO 2.0
  // ==========================================

  const simulator = {

    initialized: false,

    configuration: {
      view: "top-down",
      fixedScenario: true,
      movementEnabled: false,
      controlsEnabled: false,
      initialSpeed: 0,
      tractionPoint: 0,
      reverser: "N",
      brakeApplied: true,
      currentStation: 1
    },

    elements: {
      scenario: document.getElementById("railwayScenario"),

      railway: document.getElementById("railwayTracks"),
      railwayRoute: document.getElementById("railRoute"),

      highway: document.getElementById("highway"),
      roadVehicles: document.getElementById("roadVehicles"),

      station1: document.getElementById("station1"),
      station2: document.getElementById("station2"),

      locomotive: document.getElementById("locomotive"),

      wagon1: document.getElementById("wagon1"),
      wagon2: document.getElementById("wagon2"),
      wagon3: document.getElementById("wagon3"),
      wagon4: document.getElementById("wagon4"),

      composition: document.getElementById("trainComposition"),

      signals: document.getElementById("signals"),
      crossing: document.getElementById("levelCrossing"),
      barrier: document.getElementById("barrier"),

      farm: document.querySelector("#railwayScenario text"),
      vegetation: document.getElementById("vegetation")
    },

    train: {

      locomotive: {
        x: 510,
        y: 100,
        direction: 0
      },

      wagons: [
        { id: "wagon1", x: 430, y: 100 },
        { id: "wagon2", x: 350, y: 100 },
        { id: "wagon3", x: 270, y: 100 },
        { id: "wagon4", x: 190, y: 100 }
      ]

    }

  };

  // ==========================================
  // VERIFICAR ELEMENTOS DO CENÁRIO
  // ==========================================

  function checkElements() {

    const requiredElements = [
      "scenario",
      "railway",
      "railwayRoute",
      "highway",
      "station1",
      "station2",
      "locomotive",
      "wagon1",
      "wagon2",
      "wagon3",
      "wagon4",
      "composition",
      "signals",
      "crossing",
      "barrier"
    ];

    const missing = requiredElements.filter(name => {
      return !simulator.elements[name];
    });

    if (missing.length > 0) {

      console.error(
        "Simulador 2.0: elementos não encontrados:",
        missing
      );

      return false;
    }

    return true;
  }

  // ==========================================
  // PREPARAR COMPOSIÇÃO FERROVIÁRIA
  // ==========================================

  function prepareTrain() {

    const locomotive = simulator.elements.locomotive;

    const position = simulator.train.locomotive;

    locomotive.setAttribute(
      "transform",
      `translate(${position.x} ${position.y}) rotate(${position.direction})`
    );

    simulator.train.wagons.forEach(wagon => {

      const element = document.getElementById(wagon.id);

      element.setAttribute(
        "transform",
        `translate(${wagon.x} ${wagon.y})`
      );

    });

  }

  // ==========================================
  // PREPARAR PLANTA FIXA
  // ==========================================

  function prepareScenario() {

    const scenario = simulator.elements.scenario;

    scenario.style.display = "block";
    scenario.style.width = "100%";
    scenario.style.height = "auto";
    scenario.style.transform = "none";

  }

  // ==========================================
  // REGISTRAR PERCURSO FERROVIÁRIO
  // ==========================================

  function registerRailwayRoute() {

    const route = simulator.elements.railwayRoute;

    simulator.railwayPath = {
      element: route,
      length: route.getTotalLength(),
      startPoint: route.getPointAtLength(0),
      endPoint: route.getPointAtLength(
        route.getTotalLength()
      )
    };

    console.info(
      "Percurso ferroviário registrado:",
      simulator.railwayPath.length,
      "unidades SVG."
    );

  }

  // ==========================================
  // REGISTRAR RODOVIA
  // ==========================================

  function registerHighway() {

    const highway = simulator.elements.highway;

    simulator.highwayPath = {
      element: highway,
      length: highway.getTotalLength()
    };

    console.info(
      "Rodovia registrada:",
      simulator.highwayPath.length,
      "unidades SVG."
    );

  }

  // ==========================================
  // INICIALIZAR SIMULADOR
  // ==========================================

  function initializeSimulator() {

    if (simulator.initialized) {
      return;
    }

    if (!checkElements()) {
      console.error(
        "Não foi possível inicializar o Simulador 2.0."
      );
      return;
    }

    prepareScenario();

    prepareTrain();

    registerRailwayRoute();

    registerHighway();

    simulator.initialized = true;

    console.info(
      "MUNDO FERROVIÁRIO: SIMULADOR 2.0"
    );

    console.info("Cenário carregado.");

    console.info("Fazenda e áreas urbanas reconhecidas.");

    console.info("Rodovia azul reconhecida.");

    console.info("Traçado ferroviário reconhecido.");

    console.info("Estações 1 e 2 reconhecidas.");

    console.info(
      "Locomotiva e quatro vagões posicionados."
    );

    console.info(
      "Movimentação e controles permanecem desativados."
    );

  }

  // ==========================================
  // EXECUTAR
  // ==========================================

  initializeSimulator();

});
