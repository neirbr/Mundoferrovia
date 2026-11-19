
// --- CONFIGURAÇÃO DA COMPOSIÇÃO E TRAJETO ---
const trackPath = [
    {x: 512, y: 100}, // Estação inicial (topo)
    {x: 512, y: 300},
    {x: 512, y: 600},
    {x: 512, y: 900}  // Estação final (base)
    // Dica: depois você pode adicionar mais coordenadas aqui para fazer o trem seguir as curvas exatas da imagem!
];

// Criar elementos no HTML dinamicamente
const container = document.getElementById('game-container');
const trainContainer = document.createElement('div');
trainContainer.className = 'entity train';
trainContainer.style.left = trackPath[0].x + 'px';
trainContainer.style.top = trackPath[0].y + 'px';
container.appendChild(trainContainer);

const locomotive = document.createElement('div');
locomotive.className = 'locomotive';
trainContainer.appendChild(locomotive);

for (let i = 0; i < 4; i++) {
    const wagon = document.createElement('div');
    wagon.className = 'wagon';
    trainContainer.appendChild(wagon);
}

// --- VARIÁVEIS DE ESTADO DO TREM ---
let currentPoint = 0;
let progress = 0;
let speed = 0;          // km/h atual
let direction = 'N';    // 'N' (neutro), 'F' (frente), 'B' (ré)
let power = 0;          // 0 a 8
let brakeValue = 0;     // 0 a 100
let emergencyActive = false;

// Tabela de velocidades máximas por ponto (em km/h)
const speedLimits = {
    0: 0,
    1: 15,
    2: 25,
    3: 35,
    4: 45,
    5: 55,
    6: 65,
    7: 75,
    8: 100
};

// --- ELEMENTOS DA INTERFACE (UI) ---
const dirDisplay = document.getElementById('direction');
const powerDisplay = document.getElementById('power');
const speedDisplay = document.getElementById('speed-display');
const brakeInput = document.getElementById('brake');

// --- EVENTOS DE CONTROLE ---
document.getElementById('forward').addEventListener('click', () => {
    if (emergencyActive || brakeValue > 0) return;
    direction = 'F';
    dirDisplay.textContent = 'F';
});

document.getElementById('neutral').addEventListener('click', () => {
    if (emergencyActive) return;
    direction = 'N';
    dirDisplay.textContent = 'N';
});

document.getElementById('backward').addEventListener('click', () => {
    if (emergencyActive || brakeValue > 0) return;
    direction = 'B';
    dirDisplay.textContent = 'B';
});

document.getElementById('power-up').addEventListener('click', () => {
    if (emergencyActive) return;
    if (power < 8) power++;
    powerDisplay.textContent = power;
});

document.getElementById('power-down').addEventListener('click', () => {
    if (emergencyActive) return;
    if (power > 0) power--;
    powerDisplay.textContent = power;
});

brakeInput.addEventListener('input', (e) => {
    if (emergencyActive) return;
    brakeValue = parseInt(e.target.value);
});

// Botão de Emergência (!)
document.getElementById('emergency').addEventListener('click', () => {
    emergencyActive = true;
    direction = 'N';
    power = 0;
    powerDisplay.textContent = '0';
    dirDisplay.textContent = 'N';
    brakeValue = 100;
    brakeInput.value = 100;
});

// Buzina simples
document.getElementById('buzzer').addEventListener('click', () => {
    alert('Tóóóó! 🚂💨');
});

// --- LOOP DE FÍSICA E MOVIMENTO ---
function gameLoop() {
    // 1. Cálculo de velocidade com base na Regra do Neutro e Pontos
    let targetSpeed = 0;

    if (!emergencyActive && direction !== 'N') {
        targetSpeed = speedLimits[power];
        if (direction === 'B') targetSpeed = - (targetSpeed * 0.5); // Ré é mais lenta
    }

    // Aceleração / Desaceleração progressiva
    if (speed < targetSpeed) {
        speed += 0.2; // Aceleração suave
        if (speed > targetSpeed) speed = targetSpeed;
    } else if (speed > targetSpeed) {
        speed -= 0.3; // Desaceleração natural
        if (speed < targetSpeed) speed = targetSpeed;
    }

    // Aplicação do Freio normal ou de Emergência
    if (brakeValue > 0) {
        const brakeEffect = brakeValue * 0.05;
        if (speed > 0) {
            speed -= brakeEffect;
            if (speed < 0) speed = 0;
        } else if (speed < 0) {
            speed += brakeEffect;
            if (speed > 0) speed = 0;
        }
    }

    // Se o freio de emergência estiver ativo e o trem parar totalmente, os controles continuam travados até aliviar o freio
    if (emergencyActive && Math.abs(speed) <= 0.1) {
        speed = 0;
        // Só destrava se o usuário zerar o freio manualmente na interface
        if (brakeValue === 0) {
            emergencyActive = false;
        }
    }

    // 2. Movimentação no trajeto (se houver velocidade)
    if (speed !== 0 && currentPoint < trackPath.length - 1) {
        const start = trackPath[currentPoint];
        const end = trackPath[currentPoint + 1];

        // Fator de movimento proporcional à velocidade
        progress += (Math.abs(speed) * 0.00005);

        if (progress >= 1) {
            progress = 0;
            currentPoint++;
        }

        const curX = start.x + (end.x - start.x) * progress;
        const curY = start.y + (end.y - start.y) * progress;

        trainContainer.style.left = curX + 'px';
        trainContainer.style.top = curY + 'px';
    }

    // Atualizar visor de velocidade na tela
    speedDisplay.textContent = `${Math.round(Math.abs(speed))} km/h`;

    requestAnimationFrame(gameLoop);
}

// Iniciar o loop do jogo
gameLoop();
