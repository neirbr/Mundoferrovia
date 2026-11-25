(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const speedValue = document.getElementById("speedValue");
  const distanceValue = document.getElementById("distanceValue");
  const regionName = document.getElementById("regionName");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const hint = document.getElementById("canvasHint");
  const pauseOverlay = document.getElementById("pauseOverlay");

  const W = 800;
  const H = 800;
  const TRACK_LENGTH = 2400;
  const START_S = 520; // Posição inicial da locomotiva junto à plataforma.
  const TRAIN_SPACING = 48;
  const MAX_SPEED = 82;
  const SPEED_LIMITS = [0,15,25,35,45,55,65,75,100];
  const state = {distance:0,trackOffset:0,speed:0,direction:0,throttlePoint:0,brake:0,emergency:false,emergencyStopped:false,paused:false,lastTime:0};

  // Traçado provisório do primeiro trecho. A geometria será refinada na etapa de construção do mapa.
  function trackPoint(s) {
    const x = W / 2 + Math.sin((s + 120) / 360) * 54 + Math.sin(s / 170) * 10;
    const y = 690 - s;
    const dx = (Math.cos((s + 120) / 360) * 54 / 360) + (Math.cos(s / 170) * 10 / 170);
    const length = Math.hypot(dx, -1);
    return { x, y, tx: dx / length, ty: -1 / length, nx: 1 / length, ny: dx / length };
  }

  function worldToScreen(p, cameraY) {
    return { x: p.x, y: p.y - cameraY + H * 0.56 };
  }

  function seeded(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function drawGround(cameraY) {
    ctx.fillStyle = "#71985b";
    ctx.fillRect(0, 0, W, H);
    for (let gy = -100; gy < 1000; gy += 32) {
      for (let gx = 0; gx < W; gx += 32) {
        const worldY = Math.floor((gy + cameraY - H * .56) / 32);
        const r = seeded(Math.floor(gx / 32) * 97 + worldY);
        ctx.fillStyle = r > .82 ? "#789e60" : r < .12 ? "#688e53" : "#71985b";
        ctx.fillRect(gx, gy, 32, 32);
        if (r > .91) {
          ctx.fillStyle = "#9bb66a";
          ctx.fillRect(gx + 8, gy + 11, 3, 3);
          ctx.fillRect(gx + 19, gy + 22, 3, 3);
        }
      }
    }
  }

  function drawTree(x, y, variant = 0) {
    ctx.fillStyle = "#3d5b3c";
    ctx.fillRect(x - 10, y + 8, 20, 8);
    ctx.fillStyle = variant % 2 ? "#315c3e" : "#376b43";
    ctx.fillRect(x - 13, y - 8, 26, 22);
    ctx.fillStyle = variant % 2 ? "#4c8050" : "#52894e";
    ctx.fillRect(x - 9, y - 14, 18, 20);
    ctx.fillStyle = "#7da65b";
    ctx.fillRect(x - 5, y - 12, 7, 5);
  }

  function drawScenery(cameraY) {
    const cameraWorld = cameraY - H * .56;
    const first = Math.floor((cameraWorld - 100) / 115);
    const last = Math.ceil((cameraWorld + H + 100) / 115);
    for (let row = first; row <= last; row++) {
      for (let side = 0; side < 2; side++) {
        const r = seeded(row * 13 + side * 777);
        const yWorld = row * 115 + 45;
        const p = trackPoint(690 - yWorld);
        const x = side === 0 ? 35 + r * 105 : W - 35 - r * 105;
        const y = yWorld - cameraWorld;
        if (Math.abs(x - p.x) > 65) drawTree(x, y, row + side);
        if (r > .62) {
          ctx.fillStyle = "#d9c16c";
          ctx.fillRect(x + (side ? -24 : 22), y + 22, 5, 5);
          ctx.fillStyle = "#e9e0b0";
          ctx.fillRect(x + (side ? -16 : 30), y + 29, 4, 4);
        }
      }
    }
  }

  function drawRails(cameraY) {
    const trainS = START_S + state.trackOffset;
    const start = Math.max(0, trainS - 500);
    const end = Math.min(START_S + TRACK_LENGTH + 700, trainS + 700);
    ctx.lineCap = "square";
    // Lastro
    ctx.beginPath();
    for (let s = start; s <= end; s += 8) {
      const p = trackPoint(s);
      const q = worldToScreen(p, cameraY);
      if (s === start) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
    }
    ctx.strokeStyle = "#8c8065";
    ctx.lineWidth = 38;
    ctx.stroke();

    // Dormentes
    for (let s = start; s <= end; s += 18) {
      const p = trackPoint(s);
      const q = worldToScreen(p, cameraY);
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(Math.atan2(p.ty, p.tx) + Math.PI / 2);
      ctx.fillStyle = "#604b36";
      ctx.fillRect(-23, -3, 46, 6);
      ctx.fillStyle = "#92704c";
      ctx.fillRect(-21, -3, 42, 2);
      ctx.restore();
    }

    // Trilhos metálicos
    for (const side of [-1, 1]) {
      ctx.beginPath();
      for (let s = start; s <= end; s += 8) {
        const p = trackPoint(s);
        const q = worldToScreen({ x: p.x + p.nx * side * 11, y: p.y + p.ny * side * 11 }, cameraY);
        if (s === start) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      }
      ctx.strokeStyle = "#3f4543";
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = "#c4c6bd";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawStation(cameraY) {
    const stationS = START_S;
    const p = worldToScreen(trackPoint(stationS), cameraY);
    if (p.y < -160 || p.y > H + 160) return;
    ctx.fillStyle = "#b7a47c";
    ctx.fillRect(p.x + 34, p.y - 125, 62, 235);
    ctx.fillStyle = "#725b43";
    ctx.fillRect(p.x + 28, p.y - 135, 74, 18);
    ctx.fillStyle = "#e5d9b7";
    ctx.fillRect(p.x + 42, p.y - 106, 46, 35);
    ctx.fillStyle = "#8b4f3e";
    ctx.fillRect(p.x + 52, p.y - 61, 22, 34);
    ctx.fillStyle = "#f1d98c";
    ctx.fillRect(p.x + 43, p.y - 96, 10, 12);
    ctx.fillRect(p.x + 76, p.y - 96, 10, 12);
    ctx.fillStyle = "#d7c49a";
    ctx.fillRect(p.x - 42, p.y - 100, 25, 185);
    ctx.fillStyle = "#8e7958";
    ctx.fillRect(p.x - 47, p.y - 106, 35, 10);
    ctx.fillStyle = "#4c5e47";
    ctx.fillRect(p.x - 38, p.y - 85, 18, 8);
    ctx.fillStyle = "#f6e7b9";
    ctx.font = "bold 10px monospace";
    ctx.fillText("ESTAÇÃO", p.x + 43, p.y - 115);
  }

  function drawWagon(s, index, cameraY) {
    const p = trackPoint(s);
    const q = worldToScreen(p, cameraY);
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.rotate(Math.atan2(p.ty, p.tx) + Math.PI / 2 + (state.direction < 0 ? Math.PI : 0));
    ctx.fillStyle = "#252c2b";
    ctx.fillRect(-13, -18, 26, 42);
    ctx.fillStyle = index % 2 ? "#9a6845" : "#a77b50";
    ctx.fillRect(-11, -19, 22, 38);
    ctx.fillStyle = "#c99b68";
    ctx.fillRect(-8, -16, 16, 5);
    ctx.fillStyle = "#594936";
    ctx.fillRect(-15, -13, 4, 10);
    ctx.fillRect(11, -13, 4, 10);
    ctx.fillRect(-15, 9, 4, 10);
    ctx.fillRect(11, 9, 4, 10);
    ctx.fillStyle = "#e2c69a";
    ctx.fillRect(-2, -5, 4, 12);
    ctx.restore();
  }

  function drawLocomotive(s, cameraY) {
    const p = trackPoint(s);
    const q = worldToScreen(p, cameraY);
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.rotate(Math.atan2(p.ty, p.tx) + Math.PI / 2 + (state.direction < 0 ? Math.PI : 0));
    // Truques e chassi
    ctx.fillStyle = "#202827";
    ctx.fillRect(-16, -30, 32, 64);
    // Corpo diesel
    ctx.fillStyle = "#bd493b";
    ctx.fillRect(-14, -31, 28, 61);
    ctx.fillStyle = "#e3b44e";
    ctx.fillRect(-14, -27, 28, 5);
    ctx.fillStyle = "#263c37";
    ctx.fillRect(-10, -18, 20, 22);
    ctx.fillStyle = "#8eb2ad";
    ctx.fillRect(-7, -15, 14, 8);
    ctx.fillStyle = "#d7d1b8";
    ctx.fillRect(-10, 9, 20, 12);
    ctx.fillStyle = "#f8e6a4";
    ctx.fillRect(-10, -34, 6, 4);
    ctx.fillRect(4, -34, 6, 4);
    ctx.fillStyle = "#222";
    ctx.fillRect(-18, -23, 4, 12);
    ctx.fillRect(14, -23, 4, 12);
    ctx.fillRect(-18, 12, 4, 12);
    ctx.fillRect(14, 12, 4, 12);
    ctx.restore();
  }

  function drawTrain(cameraY) {
    // Os vagões seguem pontos anteriores do mesmo traçado, cada um com orientação própria.
    const trainS = START_S + state.trackOffset;
    for (let i = 8; i >= 1; i--) drawWagon(trainS - i * TRAIN_SPACING, i, cameraY);
    drawLocomotive(trainS, cameraY);
  }

  function drawSignal(cameraY) {
    const s = 760;
    const p = worldToScreen(trackPoint(s), cameraY);
    if (p.y < -40 || p.y > H + 40) return;
    ctx.fillStyle = "#3c4038";
    ctx.fillRect(p.x + 34, p.y - 24, 5, 42);
    ctx.fillStyle = "#252c29";
    ctx.fillRect(p.x + 25, p.y - 31, 23, 28);
    ctx.fillStyle = state.speed < 1 ? "#d5b34e" : "#64b56a";
    ctx.fillRect(p.x + 31, p.y - 25, 11, 8);
    ctx.fillStyle = "#d8d1b6";
    ctx.fillRect(p.x + 31, p.y - 12, 11, 5);
  }

  function render() {
    const cameraY = trackPoint(START_S + state.trackOffset).y;
    drawGround(cameraY);
    drawScenery(cameraY);
    drawStation(cameraY);
    drawRails(cameraY);
    drawSignal(cameraY);
    drawTrain(cameraY);

  }

  function update(dt) {
    if(state.paused)return;
    const limit=state.direction===0||state.throttlePoint===0?0:SPEED_LIMITS[state.throttlePoint];
    const traction=state.direction!==0&&state.throttlePoint>0&&!state.emergency;
    if(state.emergency){
      state.speed=Math.max(0,state.speed-7.5*dt);
      if(state.speed<=0.05){state.speed=0;state.emergencyStopped=true;brakeStatus.textContent="Composição parada — alivie o freio";}
    }else if(state.brake>0){
      state.speed=Math.max(0,state.speed-(0.35+state.brake/100*2.7)*dt);
    }else if(traction&&state.speed<limit){
      state.speed=Math.min(limit,state.speed+(0.32+state.throttlePoint*0.105)*dt);
    }else{
      state.speed=Math.max(0,state.speed-0.12*dt);
    }
    if(state.speed>0&&state.direction!==0){
      const moved=state.speed/3.6*13*dt*state.direction;
      state.trackOffset+=moved;state.distance+=Math.abs(moved);
    }
    if(state.distance>TRACK_LENGTH){state.distance=TRACK_LENGTH;state.speed=0;state.throttlePoint=0;}
    speedValue.textContent=Math.round(state.speed);
    distanceValue.textContent=(state.distance/1000).toFixed(2).replace(".",",")+" km";
    const pct=Math.min(100,state.distance/TRACK_LENGTH*100);
    progressFill.style.width=pct+"%";progressText.textContent=Math.round(pct)+"% do trecho";
    if(state.distance<650)regionName.textContent="Estação de partida";else if(state.distance<1400)regionName.textContent="Campo verde";else regionName.textContent="Trecho rural";
    render();
  }

  function frame(time) {
    const dt = Math.min(.04, (time - (state.lastTime || time)) / 1000);
    state.lastTime = time;
    update(dt);
    requestAnimationFrame(frame);
  }

  const directionValue=document.getElementById("directionValue");
  const throttleValue=document.getElementById("throttleValue");
  const limitValue=document.getElementById("limitValue");
  const brakeSlider=document.getElementById("brakeSlider");
  const brakeValue=document.getElementById("brakeValue");
  const brakeStatus=document.getElementById("brakeStatus");
  const forwardButton=document.getElementById("forwardButton"),neutralButton=document.getElementById("neutralButton"),reverseButton=document.getElementById("reverseButton");
  const throttleUp=document.getElementById("throttleUp"),throttleDown=document.getElementById("throttleDown");
  const emergencyButton=document.getElementById("emergencyButton"),releaseEmergencyButton=document.getElementById("releaseEmergencyButton");
  function refreshControls(){
    directionValue.textContent=state.direction>0?"FRENTE":state.direction<0?"RÉ":"NEUTRO";
    [forwardButton,neutralButton,reverseButton].forEach(b=>b.classList.remove("direction-selected","neutral-selected"));
    if(state.direction>0)forwardButton.classList.add("direction-selected");else if(state.direction<0)reverseButton.classList.add("direction-selected");else neutralButton.classList.add("neutral-selected");
    throttleValue.textContent=state.throttlePoint;limitValue.textContent=state.throttlePoint? "LIMITE "+SPEED_LIMITS[state.throttlePoint]+" KM/H":"TRAÇÃO DESLIGADA";
    brakeValue.textContent=state.brake+"%";brakeSlider.value=state.brake;
    const locked=state.emergency||state.emergencyStopped;
    [forwardButton,neutralButton,reverseButton,throttleUp,throttleDown,brakeSlider].forEach(b=>b.disabled=locked);
    emergencyButton.disabled=locked;releaseEmergencyButton.disabled=!state.emergencyStopped;
    if(state.emergency&&!state.emergencyStopped)brakeStatus.textContent="EMERGÊNCIA — frenagem em andamento";
    else if(!state.emergency&&!state.emergencyStopped)brakeStatus.textContent=state.brake?"Freio de serviço aplicado":"Freio aliviado";
  }
  function chooseDirection(d){if(state.emergency||state.emergencyStopped||state.speed>0.1){brakeStatus.textContent=state.speed>0.1?"Pare a composição antes de inverter o sentido":"Comandos bloqueados";return;}state.direction=d;refreshControls();}
  forwardButton.addEventListener("click",()=>chooseDirection(1));neutralButton.addEventListener("click",()=>chooseDirection(0));reverseButton.addEventListener("click",()=>chooseDirection(-1));
  throttleUp.addEventListener("click",()=>{if(!state.emergency&&!state.emergencyStopped){state.throttlePoint=Math.min(8,state.throttlePoint+1);refreshControls();}});
  throttleDown.addEventListener("click",()=>{if(!state.emergency&&!state.emergencyStopped){state.throttlePoint=Math.max(0,state.throttlePoint-1);refreshControls();}});
  brakeSlider.addEventListener("input",()=>{if(!state.emergency&&!state.emergencyStopped){state.brake=Number(brakeSlider.value);refreshControls();}});
  emergencyButton.addEventListener("click",()=>{if(state.emergency||state.emergencyStopped)return;state.emergency=true;state.brake=100;state.throttlePoint=0;refreshControls();});
  releaseEmergencyButton.addEventListener("click",()=>{if(!state.emergencyStopped||state.speed>0)return;state.emergency=false;state.emergencyStopped=false;state.brake=0;state.direction=0;refreshControls();});

  function setPaused(value) {
    state.paused = value;
    pauseOverlay.hidden = !value;
    document.getElementById("pauseButton").textContent = value ? "▶" : "Ⅱ";
    if(value){state.throttlePoint=0;}
  }
  document.getElementById("pauseButton").addEventListener("click", () => setPaused(!state.paused));
  document.getElementById("resumeButton").addEventListener("click", () => setPaused(false));

  window.addEventListener("keydown",e=>{
    if(e.key==="ArrowUp"){e.preventDefault();if(!state.emergency&&!state.emergencyStopped)state.throttlePoint=Math.min(8,state.throttlePoint+1);refreshControls();}
    if(e.key==="ArrowDown"){e.preventDefault();if(!state.emergency&&!state.emergencyStopped)state.throttlePoint=Math.max(0,state.throttlePoint-1);refreshControls();}
  });
  refreshControls();

  render();
  requestAnimationFrame(frame);
})();