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
  const TRACK_SHIFT_X = 70;
  const TRACK_LENGTH = 2400;
  const START_S = 520; // Posição inicial da locomotiva junto à plataforma.
  const TRAIN_SPACING = 48;
  const MAX_SPEED = 82;
  const SPEED_LIMITS = [0,15,25,35,45,55,65,75,100];
  const state = {distance:0,trackOffset:0,speed:0,direction:0,throttlePoint:0,brake:0,emergency:false,emergencyStopped:false,paused:false,lastTime:0};

  // Traçado provisório do primeiro trecho. A geometria será refinada na etapa de construção do mapa.
  function trackPoint(s) {
    const x = W / 2 + TRACK_SHIFT_X + Math.sin((s + 120) / 360) * 54 + Math.sin(s / 170) * 10;
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

    // A textura fica presa ao mundo, acompanhando a câmera sem trocar os blocos de lugar.
    const cameraWorld = cameraY - H * .56;
    const firstRow = Math.floor(cameraWorld / 32);
    const lastRow = Math.ceil((cameraWorld + H) / 32);

    for (let row = firstRow; row <= lastRow; row++) {
      const screenY = row * 32 - cameraWorld;
      for (let gx = 0; gx < W; gx += 32) {
        const r = seeded(Math.floor(gx / 32) * 97 + row);
        ctx.fillStyle = r > .82 ? "#789e60" : r < .12 ? "#688e53" : "#71985b";
        ctx.fillRect(gx, screenY, 32, 32);
        if (r > .91) {
          ctx.fillStyle = "#9bb66a";
          ctx.fillRect(gx + 8, screenY + 11, 3, 3);
          ctx.fillRect(gx + 19, screenY + 22, 3, 3);
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

  function drawFarmPlot(x, y, variant) {
    // Talhão visto de cima, com linhas de cultivo e pequenas variações de cor.
    ctx.fillStyle = "#9b8954";
    ctx.fillRect(x - 61, y - 76, 122, 152);
    ctx.fillStyle = "#6f8747";
    ctx.fillRect(x - 57, y - 72, 114, 144);
    for (let row = 0; row < 9; row++) {
      const yy = y - 62 + row * 15;
      ctx.fillStyle = "#526f3d";
      ctx.fillRect(x - 51, yy, 102, 3);
      ctx.fillStyle = variant % 2 ? "#b1a45d" : "#a5a052";
      for (let col = 0; col < 13; col++) ctx.fillRect(x - 48 + col * 8, yy - 4, 3, 4);
    }
    ctx.fillStyle = "#d0bd8b";
    for (let px = -54; px <= 54; px += 18) {
      ctx.fillRect(x + px, y - 80, 3, 5);
      ctx.fillRect(x + px, y + 75, 3, 5);
    }
    ctx.fillRect(x - 61, y - 78, 122, 2);
    ctx.fillRect(x - 61, y + 76, 122, 2);
  }

  function drawFarmBuilding(x, y) {
    ctx.fillStyle = "#514637";
    ctx.fillRect(x - 29, y - 20, 62, 47);
    ctx.fillStyle = "#a64f3d";
    ctx.fillRect(x - 27, y - 25, 56, 43);
    ctx.fillStyle = "#c97851";
    ctx.fillRect(x - 22, y - 21, 46, 8);
    ctx.fillStyle = "#684638";
    ctx.fillRect(x - 8, y - 2, 17, 20);
    ctx.fillStyle = "#e1c58d";
    ctx.fillRect(x - 24, y + 22, 50, 4);
  }

  function drawFarmAnimals(x, y) {
    for (let i = 0; i < 3; i++) {
      const ax = x + i * 19;
      const ay = y + (i % 2) * 13;
      ctx.fillStyle = "#eee6cf";
      ctx.fillRect(ax - 6, ay - 4, 13, 9);
      ctx.fillStyle = "#554b3e";
      ctx.fillRect(ax - 5, ay - 4, 4, 4);
      ctx.fillRect(ax + 3, ay + 1, 3, 3);
      ctx.fillStyle = "#443d33";
      ctx.fillRect(ax - 4, ay + 4, 2, 4);
      ctx.fillRect(ax + 3, ay + 4, 2, 4);
    }
  }

  function drawFarmRegion(cameraY) {
    // Primeira região rural: os talhões ficam afastados da ferrovia.
    const plots = [
      { s: 1840, side: -1, variant: 0 },
      { s: 2040, side: 1, variant: 1 },
      { s: 2260, side: -1, variant: 1 },
      { s: 2480, side: 1, variant: 0 }
    ];
    for (const plot of plots) {
      const q = worldToScreen(trackPoint(plot.s), cameraY);
      if (q.y < -110 || q.y > H + 110) continue;
      drawFarmPlot(q.x + plot.side * 178, q.y, plot.variant);
    }
    const barn = worldToScreen(trackPoint(2160), cameraY);
    if (barn.y > -70 && barn.y < H + 70) drawFarmBuilding(barn.x - 185, barn.y + 35);
    const animals = worldToScreen(trackPoint(1950), cameraY);
    if (animals.y > -50 && animals.y < H + 50) drawFarmAnimals(animals.x + 155, animals.y + 48);
    const silo = worldToScreen(trackPoint(2420), cameraY);
    if (silo.y > -70 && silo.y < H + 70) {
      ctx.fillStyle = "#ddd5b9";
      ctx.fillRect(silo.x + 190, silo.y - 24, 22, 43);
      ctx.fillStyle = "#9b5943";
      ctx.fillRect(silo.x + 187, silo.y - 29, 28, 9);
      ctx.fillStyle = "#b4a98c";
      ctx.fillRect(silo.x + 194, silo.y - 18, 4, 30);
    }
  }

  function drawForestTree(x, y, variant = 0) {
    // Copa em camadas para dar mais densidade à floresta sem invadir a faixa ferroviária.
    ctx.fillStyle = "rgba(35, 57, 37, 0.24)";
    ctx.fillRect(x - 15, y + 13, 34, 8);
    ctx.fillStyle = "#574936";
    ctx.fillRect(x - 3, y + 3, 7, 15);
    ctx.fillStyle = variant % 3 === 0 ? "#244b35" : variant % 3 === 1 ? "#2d5738" : "#315f3b";
    ctx.fillRect(x - 15, y - 10, 30, 23);
    ctx.fillStyle = variant % 2 ? "#477b46" : "#3d7042";
    ctx.fillRect(x - 11, y - 17, 23, 22);
    ctx.fillStyle = "#679253";
    ctx.fillRect(x - 6, y - 18, 10, 7);
    ctx.fillRect(x + 5, y - 7, 5, 6);
  }

  function drawForestShrub(x, y, variant = 0) {
    ctx.fillStyle = variant % 2 ? "#315d3b" : "#3d7042";
    ctx.fillRect(x - 8, y - 3, 17, 9);
    ctx.fillStyle = "#6c9652";
    ctx.fillRect(x - 4, y - 5, 7, 4);
    if (variant % 3 === 0) {
      ctx.fillStyle = "#d7bd72";
      ctx.fillRect(x + 5, y - 4, 3, 3);
    }
  }

  function drawForestRegion(cameraY) {
    // A mata começa depois dos talhões e se adensa gradualmente ao longo do trecho final.
    const cameraWorld = cameraY - H * .56;
    const first = Math.floor((cameraWorld - 180) / 104);
    const last = Math.ceil((cameraWorld + H + 180) / 104);

    for (let row = first; row <= last; row++) {
      const s = 690 - (row * 104 + 52);
      if (s < 2540 || s > 3500) continue;
      const p = trackPoint(s);
      const y = row * 104 + 52 - cameraWorld;
      const density = Math.min(1, Math.max(0.35, (s - 2540) / 360));

      for (let side = -1; side <= 1; side += 2) {
        for (let col = 0; col < 5; col++) {
          const seed = row * 173 + (side + 1) * 991 + col * 67;
          const r = seeded(seed);
          if (r > density + 0.08) continue;

          const distance = 112 + col * 43 + seeded(seed + 19) * 24;
          const x = p.x + side * distance + (seeded(seed + 37) - 0.5) * 28;
          if (x < 18 || x > W - 18) continue;

          const treeY = y + (seeded(seed + 53) - 0.5) * 46;
          drawForestTree(x, treeY, Math.floor(seed));
          if (col % 2 === 0 && seeded(seed + 71) > 0.28) {
            drawForestShrub(x + side * 21, treeY + 23, Math.floor(seed + 3));
          }
        }

        // Pequenas clareiras e flores aparecem entre os grupos de árvores.
        if (seeded(row * 211 + side * 41) > 0.42) {
          const clearingX = p.x + side * (235 + seeded(row + side * 7) * 55);
          if (clearingX > 16 && clearingX < W - 16) {
            ctx.fillStyle = "#83a765";
            ctx.fillRect(clearingX - 13, y + 25, 26, 12);
            ctx.fillStyle = "#d8c77b";
            ctx.fillRect(clearingX - 7, y + 27, 3, 3);
            ctx.fillRect(clearingX + 5, y + 31, 3, 3);
          }
        }
      }
    }
  }

  function drawScenery(cameraY) {
    const cameraWorld = cameraY - H * .56;
    const first = Math.floor((cameraWorld - 100) / 82);
    const last = Math.ceil((cameraWorld + H + 100) / 82);

    // Faixas de vegetação dos dois lados, distribuídas até as bordas do mapa.
    const columns = [14, 78, 150, 224, 296];
    for (let row = first; row <= last; row++) {
      const yWorld = row * 82 + 38;
      const p = trackPoint(690 - yWorld);
      const y = yWorld - cameraWorld;

      for (let side = 0; side < 2; side++) {
        for (let col = 0; col < columns.length; col++) {
          const seed = row * 97 + side * 777 + col * 131;
          const r = seeded(seed);
          const offset = (r - .5) * 22;
          const baseX = columns[col];
          const x = side === 0 ? baseX + offset : W - baseX - offset;

          // Mantém uma faixa livre junto aos trilhos e à composição.
          if (Math.abs(x - p.x) > 65) {
            drawTree(x, y + (col % 2 ? 12 : 0), row + side + col);
          }

          if (r > .42) {
            const flowerX = x + (side ? -19 : 19);
            ctx.fillStyle = "#d9c16c";
            ctx.fillRect(flowerX, y + 22, 5, 5);
            ctx.fillStyle = "#e9e0b0";
            ctx.fillRect(flowerX + (side ? -5 : 5), y + 29, 4, 4);
          }
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
    drawFarmRegion(cameraY);
    drawForestRegion(cameraY);
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
    if(state.distance<650)regionName.textContent="Estação de partida";else if(state.distance<1400)regionName.textContent="Campo verde";else if(state.distance<2050)regionName.textContent="Fazendas e plantações";else regionName.textContent="Floresta";
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