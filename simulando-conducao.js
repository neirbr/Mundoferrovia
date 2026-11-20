let direcao = 'N'; 
let pontoAceleracao = 0; 
let velocidadeAtual = 0;
let valorFreio = 0; 
let emergenciaAtiva = false;
let freiosTravados = false;

const limitesVelocidade = { 0: 0, 1: 15, 2: 25, 3: 35, 4: 45, 5: 55, 6: 65, 7: 75, 8: 100 };

function mudarDirecao(v) {
    if (emergenciaAtiva || freiosTravados) return;

    if (v > 0) {
        direcao = 'F';
    } else {
        if (direcao === 'F') direcao = 'N';
        else if (direcao === 'N') direcao = 'R';
        else if (direcao === 'R') direcao = 'N';
    }
    document.getElementById('txt-direcao').innerText = direcao;
}

function mudarPotencia(v) {
    if (emergenciaAtiva || freiosTravados) return;
    pontoAceleracao = Math.max(0, Math.min(8, pontoAceleracao + v));
    document.getElementById('txt-potencia').innerText = pontoAceleracao;
}

function atualizarFreio(val) {
    if (emergenciaAtiva || freiosTravados) return;
    valorFreio = val / 100;
}

function acionarEmergencia() {
    emergenciaAtiva = true;
    document.getElementById('range-freio').value = 100;
    valorFreio = 1;
}

function aliviarFreios() {
    if (emergenciaAtiva && velocidadeAtual <= 0) {
        emergenciaAtiva = false;
        freiosTravados = false;
        document.getElementById('range-freio').value = 0;
        valorFreio = 0;
    }
}

function buzina() {
    alert("📢 BUZINA!");
}

setInterval(() => {
    if (freiosTravados) {
        velocidadeAtual = 0;
        document.getElementById('txt-velocidade').innerText = "0 km/h";
        return;
    }

    let velAlvo = (direcao !== 'N') ? limitesVelocidade[pontoAceleracao] : 0;

    if (velocidadeAtual < velAlvo) {
        velocidadeAtual += 0.15;
        if (velocidadeAtual > velAlvo) velocidadeAtual = velAlvo;
    } else if (velocidadeAtual > velAlvo) {
        velocidadeAtual -= 0.1;
        if (velocidadeAtual < velAlvo) velocidadeAtual = velAlvo;
    }

    if (valorFreio > 0) {
        velocidadeAtual -= (valorFreio * 0.7);
    }

    if (emergenciaAtiva) {
        velocidadeAtual -= 0.6;
        if (velocidadeAtual <= 0) {
            velocidadeAtual = 0;
            freiosTravados = true;
        }
    }

    if (velocidadeAtual < 0) velocidadeAtual = 0;

    document.getElementById('txt-velocidade').innerText = Math.round(velocidadeAtual) + " km/h";
}, 50);

window.addEventListener('dblclick', aliviarFreios);
