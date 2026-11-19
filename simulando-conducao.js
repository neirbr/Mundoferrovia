const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

// --- PONTOS DO TRILHO (WAYPOINTS) ---
const trackPath = [
    { x: 200, y: 70 },   // Estação Superior (Início)
    { x: 750, y: 70 },   // Reta superior
    { x: 880, y: 150 },  // Curva alta direita
    { x: 880, y: 350 },  // Reta descendente direita
    { x: 850, y: 450 },  // Curva baixa direita (perto da fazenda)
    { x: 500, y: 450 },  // Reta central inferior
    { x: 120, y: 420 },  // Curva perto da vila
    { x: 80,  y: 300 },  // Subida esquerda
    { x: 120, y: 180 },  // Curva superior esquerda
    { x: 420, y: 180 },  // Trânsito interno
    { x: 500, y: 250 },  // Alça descendente
    { x: 500, y: 550 },  // Baixada final
    { x: 400, y: 640 },  // Curva para estação inferior
    { x: 800, y: 640 }   // Estação Inferior (Final)
];

// Gera curva suave inter-pontos (Catmull-Rom Spline)
function getSplinePoint(t) {
    const numSections = trackPath.length - 1;
    let i = Math.floor(t * numSections);
    if (i >= numSections) i = numSections - 1;
    const localT = (t * numSections) - i;

    const p0 = trackPath[Math.max(0, i - 1)];
    const p1 = trackPath[i];
    const p2 = trackPath[Math.min(trackPath.length - 1, i + 1)];
    const p3 = trackPath[Math.min(trackPath.length - 1, i + 2)];

    const q0 = -localT * localT * localT + 2 * localT * localT - localT;
    const q1 = 3 * localT * localT * localT - 5 * localT * localT + 2;
    const q2 = -3 * localT * localT * localT + 4 * localT * localT + localT;
    const q3 = localT * localT * localT - localT * localT;

    return {
        x: 0.5 * (p0.x * q0 + p1.x * q1 + p2.x * q2 + p3.x * q3),
        y: 0.5 * (p0.y * q0 + p1.y * q1 + p2.y * q2 + p3.y * q3)
    };
}

// Pré-calcula a extensão do trilho para movimentação física uniforme
const PATH_SAMPLES = 2000;
let pathPoints = [];
let totalPathLength = 0;

function buildPath() {
    pathPoints = [];
    totalPathLength = 0;
    let prev = getSplinePoint(0);
    pathPoints.push({ x: prev.x, y: prev.y, dist: 0 });

    for (let i = 1; i <= PATH_SAMPLES; i++) {
        const pt = getSplinePoint(i / PATH_SAMPLES);
        const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
        totalPathLength += dist;
        pathPoints.push({ x: pt.x, y: pt.y, dist: totalPathLength });
        prev = pt;
    }
}
buildPath();

function getPosAtDistanceRaw(d) {
    d = Math.max(0, Math.min(totalPathLength, d));
    for (let i = 0; i < pathPoints.length - 1; i++) {
        if (d >= pathPoints[i].dist && d <= pathPoints[i + 1].dist) {
            const ratio = (d - pathPoints[i].dist) / (pathPoints[i + 1].dist - pathPoints[i].dist);
            return {
                x: pathPoints[i].x + (pathPoints[i + 1].x - pathPoints[i].x) * ratio,
                y: pathPoints[i].y + (pathPoints[i + 1].y - pathPoints[i].y) * ratio
            };
        }
    }
    return { x: pathPoints[0].x, y: pathPoints[0].y };
}

function getPosAtDistance(d) {
    const pos = getPosAtDistanceRaw(d);
    const nextDist = Math.min(totalPathLength, d + 2);
    const pNext = getPosAtDistanceRaw(nextDist);
    const angle = Math.atan2(pNext.y - pos.y, pNext.x - pos.x);
    return { x: pos.x, y: pos.y, angle };
}

// --- ESTADO DO TREM E FÍSICA ---
let trainPos = 50;      // Distância ao longo do trilho (pixels)
let speed = 0;          // Velocidade em km/h
let reverser = 0;       // -1: R, 0: N, 1: F
let currentNotch = 0;   // 0 a 8
let brakeForce = 0;     // 0 a 1

// Tabela de Velocidade Máxima por Ponto (KM/H)
const notchMaxSpeed = [0, 10, 25, 35, 45, 55, 65, 75, 85];

// --- SINALIZAÇÃO E ROTA ---
const signalDist = totalPathLength - 280;
let routeSet = false;
let gameOver = false;
let gameSuccess = false;

// --- ELEMENTOS VIVOS (ANIMAÇÕES) ---
let waterOffset = 0;

const animals = [
    { x: 620, y: 150, vx: 0.2, type: 'cow' },
    { x: 650, y: 170, vx: -0.15, type: 'cow' },
    { x: 700, y: 380, vx: 0.25, type: 'sheep' },
    { x: 730, y: 400, vx: -0.2, type: 'sheep' }
];

const cars = [
    { x: 930, y: 600, vy: -1.5, axis: 'y', crossingY: 450 },
    { x: 300, y: 320, vx: 1.2, axis: 'x', crossingX: 500 }
];

// --- CONTROLES DA INTERFACE ---
function changeReverser(dir) {
    if (gameOver) return;
    reverser = Math.max(-1, Math.min(1, reverser + dir));
    const labels = {
        '-1': 'SELETORA: R (Ré)',
        '0': 'SELETORA: N (Neutro)',
        '1': 'SELETORA: F (Frente)'
    };
    document.getElementById('reverser-disp').innerText = labels[reverser];
}

function changeNotch(dir) {
    if (gameOver) return;
    currentNotch = Math.max(0, Math.min(8, currentNotch + dir));
    document.getElementById('notch-disp').innerText = `PONTO: ${currentNotch} / 8`;
}

function updateBrake(val) {
    brakeForce = val / 100;
    const label = val == 0 ? `ALÍVIO (0%)` : `APLICAÇÃO (${val}%)`;
    document.getElementById('brake-disp').innerText = label;
}

function setRoute() {
    if (routeSet) return;
    routeSet = true;
    const btn = document.getElementById('routeBtn');
    btn.disabled = true;
    btn.innerText = 'Rota Alinhada ✓';
    showMsg('Rota alinhada! Sinal aberto (Vermelho Piscante).', 3000);
}

function showMsg(txt, duration = 0) {
    const el = document.getElementById('msg-overlay');
    el.innerText = txt;
    el.style.display = 'block';
    if (duration > 0) {
        setTimeout(() => {
            if (!gameOver) el.style.display = 'none';
        }, duration);
    }
}

// --- LOOP DE ATUALIZAÇÃO E FÍSICA ---
function update() {
    if (gameOver) return;

    // 1. Inércia e Aceleração gradual por Ponto
    const targetSpeed = notchMaxSpeed[currentNotch];
    const accelRate = 0.04;
    const decelRate = 0.02;

    if (reverser !== 0 && currentNotch > 0) {
        const dirTarget = targetSpeed * reverser;
        if (Math.abs(speed) < Math.abs(dirTarget)) {
            speed += dirTarget > 0 ? accelRate : -accelRate;
        }
    } else {
        if (speed > 0) speed = Math.max(0, speed - decelRate);
        if (speed < 0) speed = Math.min(0, speed + decelRate);
    }

    // 2. Aplicação do Freio Pneumático
    if (brakeForce > 0) {
        const brakeBite = brakeForce * 0.15;
        if (speed > 0) speed = Math.max(0, speed - brakeBite);
        if (speed < 0) speed = Math.min(0, speed + brakeBite);
    }

    // Movimentação da composição
    trainPos += speed * 0.12;
    trainPos = Math.max(0, Math.min(totalPathLength, trainPos));

    // Atualiza Telemetria
    document.getElementById('speedometer').innerText = `${Math.abs(speed).toFixed(1)} KM/H`;

    // 3. Regras de Passagem do Sinal e Conclusão
    if (trainPos >= signalDist - 10 && trainPos <= signalDist + 10) {
        if (!routeSet) {
            gameOver = true;
            showMsg('SINAL FECHADO ULTRAPASSADO! MISSÃO FALHOU.', 0);
            return;
        }
    }

    if (trainPos >= totalPathLength - 60 && Math.abs(speed) < 0.5) {
        gameOver = true;
        gameSuccess = true;
        showMsg('PARABÉNS! CHEGADA COM SUCESSO À ESTAÇÃO FINAL!', 0);
        return;
    }

    // 4. Atualizar Animações (Água, Animais e Carros)
    waterOffset += 0.05;

    animals.forEach(a => {
        a.x += a.vx;
        if (a.x > 750 || a.x < 600) a.vx *= -1;
    });

    const isTrainNearPN = Math.abs(trainPos - 450) < 150 || Math.abs(trainPos - 850) < 150;

    cars.forEach(c => {
        if (c.axis === 'y') {
            const distToCrossing = Math.abs(c.y - c.crossingY);
            if (!(isTrainNearPN && distToCrossing < 60 && distToCrossing > 10)) {
                c.y += c.vy;
                if (c.y < 50) c.y = 650;
            }
        }
    });
}

// --- RENDERIZAÇÃO ---
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Rio / Água animada
    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.moveTo(0, 500);
    for (let x = 0; x <= canvas.width; x += 20) {
        const y = 500 + Math.sin((x + waterOffset * 20) * 0.02) * 8;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, 540);
    ctx.lineTo(0, 540);
    ctx.fill();

    // 2. Estradas Rodoviárias
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 28;
    ctx.beginPath();
    ctx.moveTo(930, 0); ctx.lineTo(930, 700);
    ctx.moveTo(0, 320); ctx.lineTo(600, 320);
    ctx.stroke();

    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(930, 0); ctx.lineTo(930, 700);
    ctx.moveTo(0, 320); ctx.lineTo(600, 320);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Estações
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(150, 35, 120, 20);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(170, 20, 80, 20);

    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(720, 660, 140, 20);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(740, 670, 100, 25);

    // 4. Cenários (Fazenda, Vila, Animais e Carros)
    ctx.fillStyle = '#d35400';
    ctx.fillRect(650, 100, 50, 40);

    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(100, 230, 25, 25);
    ctx.fillRect(150, 230, 25, 25);
    ctx.fillRect(200, 230, 25, 25);

    animals.forEach(a => {
        ctx.fillStyle = a.type === 'cow' ? '#fff' : '#ecf0f1';
        ctx.fillRect(a.x, a.y, 10, 8);
    });

    cars.forEach(c => {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(c.x - 6, c.y - 10, 12, 20);
    });

    // 5. Trilhos do Trem
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 8;
    ctx.beginPath();
    for (let i = 0; i < pathPoints.length; i++) {
        if (i === 0) ctx.moveTo(pathPoints[i].x, pathPoints[i].y);
        else ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 6. Sinal Ferroviário
    const sigPos = getPosAtDistance(signalDist);
    ctx.save();
    ctx.translate(sigPos.x - 15, sigPos.y - 15);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 12, 24);

    let isRedOn = true;
    if (routeSet) {
        isRedOn = Math.floor(Date.now() / 400) % 2 === 0;
    }
    ctx.fillStyle = isRedOn ? '#ff0000' : '#440000';
    ctx.beginPath();
    ctx.arc(6, 6, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#004400';
    ctx.beginPath();
    ctx.arc(6, 18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 7. Composição (Locomotiva + 4 Vagões)
    const wagonLength = 22;
    const gap = 5;

    for (let i = 4; i >= 0; i--) {
        const distOffset = trainPos - (i * (wagonLength + gap));
        if (distOffset >= 0 && distOffset <= totalPathLength) {
            const pos = getPosAtDistance(distOffset);

            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(pos.angle);

            if (i === 0) {
                ctx.fillStyle = '#f39c12';
                ctx.fillRect(-wagonLength / 2, -7, wagonLength, 14);
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(-wagonLength / 2 + 2, -6, 8, 12);
                ctx.fillStyle = '#fff700';
                ctx.beginPath();
                ctx.arc(wagonLength / 2, 0, 3, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = (i % 2 === 0) ? '#27ae60' : '#2980b9';
                ctx.fillRect(-wagonLength / 2, -6, wagonLength, 12);
                ctx.strokeStyle = '#111';
                ctx.strokeRect(-wagonLength / 2, -6, wagonLength, 12);
            }

            ctx.restore();
        }
    }
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

gameLoop();
