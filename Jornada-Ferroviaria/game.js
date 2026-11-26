(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const speedValue = document.getElementById("speedValue");
  const distanceValue = document.getElementById("distanceValue");
  const regionName = document.getElementById("regionName");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const pauseOverlay = document.getElementById("pauseOverlay");

  const W = 800;
  const H = 800;
  const TRACK_SHIFT_X = 70;
  const TRACK_LENGTH = 10400; // Inclui a cidade, o bosque, a estação final e a rodoviária.
  const START_S = 520; // Posição inicial original da locomotiva junto à plataforma.
  // MODO TEMPORÁRIO DE TESTE URBANO: altere para false para voltar ao início normal.
  const TEST_URBAN_MODE = true;
  const TEST_URBAN_START = 5200;
  const TRAIN_SPACING = 48;
  const PASSENGER_WAGON_COUNT = 8;
  const MAX_SPEED = 82;
  const SPEED_LIMITS = [0,15,25,35,45,55,65,75,100];
  const state = {distance:TEST_URBAN_MODE?TEST_URBAN_START:0,trackOffset:TEST_URBAN_MODE?TEST_URBAN_START:0,speed:0,direction:0,throttlePoint:0,brake:0,emergency:false,emergencyStopped:false,paused:false,lastTime:0,cameraY:null};

  // Traçado com curvas mais fechadas intercaladas por longas retas.
  // Cada curva usa transição suave para manter a continuidade dos trilhos.
  const TRACK_CURVES = [
    { start: 700, end: 1150, from: 0, to: 125 },
    { start: 2050, end: 2500, from: 125, to: -110 },
    { start: 4200, end: 4650, from: -110, to: 120 },
    { start: 5550, end: 6000, from: 120, to: -115 }
  ];

  function trackOffsetAt(s) {
    let offset = 0;
    let derivative = 0;
    for (const curve of TRACK_CURVES) {
      if (s < curve.start) break;
      if (s <= curve.end) {
        const t = (s - curve.start) / (curve.end - curve.start);
        const change = curve.to - curve.from;
        offset = curve.from + change * (1 - Math.cos(Math.PI * t)) / 2;
        derivative = change * Math.PI * Math.sin(Math.PI * t) / (2 * (curve.end - curve.start));
        return { offset, derivative };
      }
      offset = curve.to;
    }
    return { offset, derivative };
  }

  function trackPoint(s) {
    const track = trackOffsetAt(s);
    const x = W / 2 + TRACK_SHIFT_X + track.offset;
    const y = 690 - s;
    const dx = track.derivative;
    const length = Math.hypot(dx, -1);
    return { x, y, tx: dx / length, ty: -1 / length, nx: 1 / length, ny: dx / length };
  }

  // Mede a distância real percorrida sobre a curva, não apenas a diferença vertical.
  function trackArcLength(a, b) {
    const steps = 16;
    const step = (b - a) / steps;
    let total = 0;
    for (let i = 0; i <= steps; i++) {
      const s = a + step * i;
      const derivative = trackOffsetAt(s).derivative;
      const weight = (i === 0 || i === steps) ? 1 : (i % 2 ? 4 : 2);
      total += weight * Math.hypot(1, derivative);
    }
    return Math.abs(step) * total / 3;
  }

  // Encontra o ponto anterior que mantém o mesmo comprimento de engate nas curvas.
  function trackSBehind(frontS, distance) {
    let low = frontS - distance * 2;
    let high = frontS;
    for (let i = 0; i < 28; i++) {
      const mid = (low + high) / 2;
      if (trackArcLength(mid, frontS) > distance) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  }

  function worldToScreen(p, cameraY) {
    return { x: p.x, y: p.y - cameraY + H * 0.56 };
  }

  function seeded(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function drawLateralAtmosphere(cameraY) {
    // Faixas translúcidas nas bordas: a tonalidade acompanha a região atravessada.
    const cameraWorld = cameraY - H * .56;
    const firstRow = Math.floor(cameraWorld / 32);
    const lastRow = Math.ceil((cameraWorld + H) / 32);
    for (let row = firstRow; row <= lastRow; row++) {
      const worldY = row * 32 + 16;
      const s = 690 - worldY;
      let tint = "rgba(116, 151, 105, 0.17)";
      if (s >= 1820 && s < 2665) tint = "rgba(170, 151, 91, 0.17)";
      else if (s >= 2665 && s < 2948) tint = "rgba(54, 91, 62, 0.20)";
      else if (s >= 2948 && s < 3260) tint = "rgba(72, 139, 166, 0.22)";
      else if (s >= 3260 && s < 5200) tint = "rgba(190, 150, 190, 0.17)";
      else if (s >= 9000) tint = "rgba(154, 132, 101, 0.20)";
      else if (s >= 8250) tint = "rgba(158, 153, 137, 0.18)";
      else if (s >= 7380) tint = "rgba(211, 143, 174, 0.19)";
      else if (s >= 5200) tint = "rgba(164, 126, 101, 0.18)";
      const screenY = row * 32 - cameraWorld;
      ctx.fillStyle = tint;
      ctx.fillRect(0, screenY, 112, 33);
      ctx.fillRect(W - 112, screenY, 112, 33);
      const fadeLeft = ctx.createLinearGradient(82, 0, 150, 0);
      fadeLeft.addColorStop(0, tint);
      fadeLeft.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = fadeLeft;
      ctx.fillRect(82, screenY, 68, 33);
      const fadeRight = ctx.createLinearGradient(W - 150, 0, W - 82, 0);
      fadeRight.addColorStop(0, "rgba(0,0,0,0)");
      fadeRight.addColorStop(1, tint);
      ctx.fillStyle = fadeRight;
      ctx.fillRect(W - 150, screenY, 68, 33);
    }
  }

  function drawGround(cameraY) {
    // Gramado natural em vista superior: textura orgânica, variações de luz e tufos de grama.
    const base = ctx.createLinearGradient(0, 0, W, H);
    base.addColorStop(0, "#28552a");
    base.addColorStop(0.28, "#559332");
    base.addColorStop(0.58, "#70ad38");
    base.addColorStop(1, "#3e782c");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    const cameraWorld = cameraY - H * .56;
    const firstRow = Math.floor(cameraWorld / 24);
    const lastRow = Math.ceil((cameraWorld + H) / 24);

    for (let row = firstRow; row <= lastRow; row++) {
      const worldY = row * 24 + 12;
      const screenY = worldY - cameraWorld;
      for (let col = 0; col < 34; col++) {
        const seed = row * 197 + col * 83;
        const r = seeded(seed);
        const x = col * 24 + seeded(seed + 7) * 10 - 5;
        const y = screenY + seeded(seed + 11) * 12 - 6;

        // Manchas suaves de grama em tons naturais, sem padrão quadriculado.
        if (r > .30) {
          const radius = 5 + seeded(seed + 17) * 13;
          const patch = ctx.createRadialGradient(x, y, 1, x, y, radius);
          patch.addColorStop(0, r > .72 ? "rgba(145,190,65,.20)" : "rgba(25,75,28,.13)");
          patch.addColorStop(1, "rgba(40,95,30,0)");
          ctx.fillStyle = patch;
          ctx.beginPath();
          ctx.ellipse(x, y, radius * 1.35, radius * .85, seeded(seed + 23) * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }

        // Pequenas lâminas de grama com iluminação lateral.
        if (r > .48) {
          const blades = 3 + Math.floor(seeded(seed + 31) * 4);
          for (let k = 0; k < blades; k++) {
            const bx = x + (seeded(seed + k * 13) - .5) * 18;
            const by = y + (seeded(seed + k * 19) - .5) * 15;
            const h = 2 + seeded(seed + k * 29) * 5;
            ctx.strokeStyle = k % 2 ? "rgba(177,211,91,.42)" : "rgba(24,72,25,.35)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx, by + h);
            ctx.quadraticCurveTo(bx - 2, by + 1, bx + (seeded(seed + k * 37) - .5) * 5, by - h);
            ctx.stroke();
          }
        }
      }
    }

    // Vinheta muito discreta nas bordas, inspirada na iluminação da referência.
    const shade = ctx.createRadialGradient(W * .5, H * .48, 170, W * .5, H * .48, 590);
    shade.addColorStop(0, "rgba(190,225,95,0)");
    shade.addColorStop(1, "rgba(10,38,17,.25)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTree(x, y, variant = 0) {
    const tone = Math.abs(variant) % 3;
    const dark = ["#173f22", "#1c4825", "#204b28"][tone];
    const mid = ["#287033", "#327b35", "#3b8238"][tone];
    const light = ["#65a83d", "#78b744", "#8ac34b"][tone];
    ctx.save(); ctx.translate(x,y);
    ctx.fillStyle="rgba(13,34,17,.34)";
    ctx.beginPath();ctx.ellipse(5,17,29,13,-.12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#65472d";ctx.beginPath();ctx.ellipse(0,5,6,8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=dark;
    for(const b of [[-13,0,20,17],[10,1,21,18],[-3,-10,23,19],[-18,-10,15,15],[17,-11,16,15],[0,9,19,13]]){
      ctx.beginPath();ctx.ellipse(b[0],b[1],b[2],b[3],0,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle=mid;
    for(const b of [[-12,-3,16,13],[8,-4,17,14],[-1,-13,17,13],[-19,-9,10,10],[18,-12,10,10],[1,7,13,9]]){
      ctx.beginPath();ctx.ellipse(b[0],b[1],b[2],b[3],0,0,Math.PI*2);ctx.fill();
    }
    const glow=ctx.createRadialGradient(-9,-14,1,-7,-10,29);
    glow.addColorStop(0,"rgba(190,224,104,.68)");glow.addColorStop(.48,light);glow.addColorStop(1,"rgba(74,142,48,0)");
    ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(-7,-9,23,19,-.25,0,Math.PI*2);ctx.fill();
    for(let i=0;i<11;i++){
      const a=i*Math.PI*2/11+tone*.19;
      ctx.save();ctx.translate(Math.cos(a)*15,Math.sin(a)*12-3);ctx.rotate(a+Math.PI/2);
      ctx.fillStyle=i%3===0?"#8bc64a":i%3===1?mid:"#4d9639";
      ctx.beginPath();ctx.ellipse(0,-8,4.2,11,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="rgba(205,231,130,.42)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,1);ctx.lineTo(0,-15);ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle="rgba(211,235,137,.75)";
    for(const p of [[-13,-16,2.1],[5,-18,1.6],[15,-6,1.8]]){ctx.beginPath();ctx.arc(p[0],p[1],p[2],0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  function drawFarmPlot(x, y, variant) {
    // Talhão mais amplo, com terra arada, linhas de cultivo densas e plantas individualizadas.
    const cropPalettes = [
      {soil:"#80633e", dark:"#536d32", mid:"#7d963d", light:"#c0b85c"},
      {soil:"#765b3b", dark:"#4c7138", mid:"#699345", light:"#a9bd58"},
      {soil:"#8a6942", dark:"#657b36", mid:"#a19b45", light:"#d0bb65"}
    ];
    const palette = cropPalettes[Math.abs(variant) % cropPalettes.length];
    ctx.fillStyle = "rgba(23,31,20,.32)";
    ctx.beginPath(); ctx.roundRect(x-73,y-87,146,174,6); ctx.fill();
    ctx.fillStyle = "#5d4932";
    ctx.beginPath(); ctx.roundRect(x-70,y-88,140,176,5); ctx.fill();
    ctx.fillStyle = palette.soil;
    ctx.beginPath(); ctx.roundRect(x-65,y-83,130,166,3); ctx.fill();

    // Sulcos profundos e pequenas pedras no solo entre as fileiras.
    for(let row=0;row<12;row++){
      const yy=y-73+row*12.4;
      ctx.strokeStyle="rgba(48,37,25,.52)";ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(x-58,yy+5);ctx.lineTo(x+58,yy+5);ctx.stroke();
      ctx.strokeStyle="rgba(202,166,111,.36)";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x-58,yy+7);ctx.lineTo(x+58,yy+7);ctx.stroke();
      for(let col=0;col<15;col++){
        const cx=x-55+col*7.8;
        const sway=Math.sin((row*17+col*11+variant)*.7)*1.7;
        const height=4+(col+row+variant)%3;
        ctx.fillStyle=palette.dark;
        ctx.beginPath();ctx.ellipse(cx,yy+sway,2.7,height,((col%3)-1)*.13,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=palette.mid;
        ctx.beginPath();ctx.ellipse(cx-1,yy-1+sway,1.8,height*.72,-.18,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=palette.light;ctx.lineWidth=.8;
        ctx.beginPath();ctx.moveTo(cx,yy+2+sway);ctx.lineTo(cx-1.5,yy-height+1+sway);ctx.stroke();
        if((row*3+col+variant)%7===0){
          ctx.fillStyle="rgba(231,211,125,.88)";
          ctx.fillRect(cx+2,yy-4+sway,2,2);
        }
      }
    }
    // Borda de terra batida e pequenas marcas de pneus na entrada.
    ctx.fillStyle="#b99a69";ctx.fillRect(x-10,y+77,20,8);
    ctx.fillStyle="rgba(66,48,30,.4)";
    ctx.fillRect(x-7,y+77,2,7);ctx.fillRect(x+5,y+77,2,7);

    // Cerca de madeira com mourões destacados e duas travessas.
    ctx.strokeStyle="#4d3827";ctx.lineWidth=4;ctx.strokeRect(x-69,y-87,138,174);
    ctx.strokeStyle="#b18b5d";ctx.lineWidth=2;
    ctx.strokeRect(x-67,y-85,134,170);
    for(let px=-62;px<=62;px+=17){
      for(const edge of [-1,1]){
        const py=edge*86;
        ctx.fillStyle="#d0ad7c";ctx.fillRect(x+px-2,y+py-3,4,7);
        ctx.fillStyle="#60462e";ctx.fillRect(x+px-1,y+py-2,2,5);
      }
    }
    for(let py=-76;py<=76;py+=17){
      for(const edge of [-1,1]){
        ctx.fillStyle="#d0ad7c";ctx.fillRect(x+edge*68-3,y+py-2,6,4);
        ctx.fillStyle="#60462e";ctx.fillRect(x+edge*68-2,y+py-1,4,2);
      }
    }
    // Porteira de acesso no lado inferior.
    ctx.fillStyle="#4c3928";ctx.fillRect(x-13,y+83,26,5);
    ctx.fillStyle="#c5a174";ctx.fillRect(x-11,y+82,22,2);
  }

  function drawFarmBuilding(x, y) {
    // Casa de fazenda com telhado em duas águas, beiral, varanda e sombra projetada.
    ctx.fillStyle = "rgba(22, 30, 23, .34)";
    ctx.beginPath(); ctx.ellipse(x + 5, y + 22, 42, 25, -.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#8d795c";
    ctx.fillRect(x - 34, y - 15, 70, 49);
    ctx.fillStyle = "#d6c29a";
    ctx.fillRect(x - 29, y - 20, 60, 48);
    ctx.fillStyle = "#a34e3b";
    ctx.beginPath();
    ctx.moveTo(x - 36, y - 18); ctx.lineTo(x, y - 43); ctx.lineTo(x + 38, y - 18);
    ctx.lineTo(x + 32, y + 1); ctx.lineTo(x - 31, y + 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#c87550";
    ctx.beginPath(); ctx.moveTo(x - 30, y - 19); ctx.lineTo(x, y - 39); ctx.lineTo(x + 31, y - 19); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(245, 190, 133, .65)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 38); ctx.lineTo(x, y - 19); ctx.stroke();
    ctx.fillStyle = "#72513a"; ctx.fillRect(x - 9, y + 1, 18, 27);
    ctx.fillStyle = "#a8c4bd"; ctx.fillRect(x - 25, y - 10, 10, 11); ctx.fillRect(x + 15, y - 10, 10, 11);
    ctx.strokeStyle = "#eee0bf"; ctx.lineWidth = 2;
    ctx.strokeRect(x - 25, y - 10, 10, 11); ctx.strokeRect(x + 15, y - 10, 10, 11);
    ctx.fillStyle = "#8a795e"; ctx.fillRect(x - 34, y + 28, 70, 5);
    ctx.fillStyle = "#d7c39c"; ctx.fillRect(x - 27, y + 33, 55, 4);
    // Chaminé e pequeno caminho de acesso.
    ctx.fillStyle = "#6a5140"; ctx.fillRect(x + 18, y - 36, 8, 15);
    ctx.fillStyle = "#b7a28a"; ctx.fillRect(x + 16, y - 38, 12, 3);
    ctx.fillStyle = "#b49a70";
    ctx.beginPath(); ctx.moveTo(x - 5, y + 37); ctx.lineTo(x + 8, y + 37); ctx.lineTo(x + 24, y + 66); ctx.lineTo(x - 22, y + 66); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(236, 216, 174, .5)"; ctx.fillRect(x - 13, y + 44, 25, 2);
  }

  function drawFarmAnimals(x, y) {
    // Curral fechado com porteira, cocho e bebedouro; os animais caminham em pequenos percursos.
    ctx.fillStyle="rgba(22,30,20,.32)";
    ctx.beginPath();ctx.ellipse(x+5,y+8,66,48,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#9a8058";ctx.fillRect(x-61,y-39,122,78);
    ctx.fillStyle="#b39a6c";ctx.fillRect(x-57,y-35,114,70);
    ctx.fillStyle="#88704d";
    for(let i=0;i<7;i++){
      const gx=x-48+i*16;
      ctx.fillRect(gx,y-34,3,68);
      ctx.fillRect(gx,y-33,2,66);
    }
    ctx.fillStyle="#5a422d";ctx.fillRect(x-62,y-40,124,5);ctx.fillRect(x-62,y+35,124,5);
    ctx.fillStyle="#d0ad7c";ctx.fillRect(x-12,y+34,24,6);
    // Cocho de alimentação e bebedouro metálico.
    ctx.fillStyle="#63452f";ctx.fillRect(x-47,y-27,33,9);
    ctx.fillStyle="#c4a16a";ctx.fillRect(x-45,y-26,29,5);
    ctx.fillStyle="#607f83";ctx.fillRect(x+28,y+17,20,12);
    ctx.fillStyle="#9bc2bd";ctx.fillRect(x+30,y+19,16,7);
    ctx.fillStyle="rgba(225,244,225,.7)";ctx.fillRect(x+32,y+20,10,2);

    const t=(state.lastTime||0)*.001;
    const animals=[
      {ox:-25,oy:-11,phase:0,tone:0},
      {ox:15,oy:-10,phase:2.1,tone:1},
      {ox:-5,oy:17,phase:4.2,tone:0},
      {ox:34,oy:-3,phase:1.2,tone:1}
    ];
    for(const a of animals){
      const ax=x+a.ox+Math.sin(t*.72+a.phase)*8;
      const ay=y+a.oy+Math.cos(t*.55+a.phase)*5;
      ctx.save();ctx.translate(ax,ay);
      ctx.rotate(Math.sin(t*.65+a.phase)*.12);
      ctx.fillStyle="rgba(25,30,21,.25)";
      ctx.beginPath();ctx.ellipse(2,5,10,6,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=a.tone?"#b6aa8c":"#eee7d2";
      ctx.beginPath();ctx.ellipse(0,0,9,6,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=a.tone?"#4e493d":"#6a5544";
      ctx.beginPath();ctx.ellipse(6,-1,4,3.5,0,0,Math.PI*2);ctx.fill();
      ctx.fillRect(-5,-4,3,3);ctx.fillRect(1,1,3,2);
      ctx.strokeStyle="#55483a";ctx.lineWidth=1.5;
      const step=Math.sin(t*5+a.phase)*1.5;
      for(const leg of [[-5,3],[4,3]]){ctx.beginPath();ctx.moveTo(leg[0],leg[1]);ctx.lineTo(leg[0]+step,leg[1]+4);ctx.stroke();}
      ctx.restore();
    }
  }

  function drawFarmTractor(x,y,phase=0) {
    // Trator agrícola animado, com pneus, cabine envidraçada e arado traseiro.
    const t=(state.lastTime||0)*.001;
    const travel=Math.sin(t*.34+phase);
    const tx=x+travel*24, ty=y+Math.cos(t*.23+phase)*8;
    ctx.save();ctx.translate(tx,ty);
    ctx.rotate(Math.sin(t*.25+phase)*.035);
    // Sulcos recém-abertos atrás do implemento.
    ctx.strokeStyle="rgba(54,39,25,.55)";ctx.lineWidth=2;
    for(let i=-2;i<=2;i++){
      ctx.beginPath();ctx.moveTo(-35+i*4,16);ctx.lineTo(-35+i*4,45);ctx.stroke();
    }
    // Arado e braços hidráulicos.
    ctx.strokeStyle="#4b5149";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(0,11);ctx.lineTo(-3,25);ctx.lineTo(-30,30);ctx.stroke();
    ctx.fillStyle="#555d54";ctx.fillRect(-43,27,29,5);
    for(let i=0;i<4;i++){
      ctx.fillStyle="#7b6c4d";ctx.beginPath();ctx.moveTo(-42+i*8,32);ctx.lineTo(-38+i*8,42);ctx.lineTo(-35+i*8,32);ctx.closePath();ctx.fill();
    }
    // Chassi.
    ctx.fillStyle="rgba(20,25,18,.35)";ctx.fillRect(-20,-12,43,32);
    ctx.fillStyle="#b64b2d";ctx.fillRect(-16,-14,34,27);
    ctx.fillStyle="#e0a04a";ctx.fillRect(-13,-12,28,3);
    // Rodas grandes e pequenas com sulcos.
    for(const side of [-1,1]){
      ctx.fillStyle="#202522";ctx.beginPath();ctx.ellipse(side*15,8,7,13,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#74766a";ctx.lineWidth=1.3;
      for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(side*15-5,8+k*4);ctx.lineTo(side*15+5,8+k*4);ctx.stroke();}
      ctx.fillStyle="#aaa58d";ctx.beginPath();ctx.arc(side*15,8,3.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#252a25";ctx.beginPath();ctx.ellipse(side*10,-12,4.2,7,0,0,Math.PI*2);ctx.fill();
    }
    // Capô e cabine.
    ctx.fillStyle="#d65a32";ctx.fillRect(-7,-19,18,20);
    ctx.fillStyle="#354d4d";ctx.fillRect(-5,-27,14,12);
    ctx.fillStyle="#9bc2bd";ctx.fillRect(-3,-25,10,8);
    ctx.strokeStyle="#d6d0b7";ctx.lineWidth=1.5;ctx.strokeRect(-5,-27,14,12);
    ctx.fillStyle="#f2d27a";ctx.fillRect(7,-17,3,3);
    ctx.restore();
  }

  function drawFarmShed(x,y,variant=0) {
    // Galpão/celeiro com telhado metálico, portas largas e área de carga.
    const roof=variant%2?"#526d70":"#8c5541";
    ctx.fillStyle="rgba(23,29,21,.32)";ctx.fillRect(x-45,y-36,96,82);
    ctx.fillStyle="#c6b18b";ctx.fillRect(x-42,y-39,88,76);
    ctx.fillStyle=variant%2?"#b9b6a2":"#d4c39d";ctx.fillRect(x-37,y-34,78,66);
    ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(x-48,y-35);ctx.lineTo(x,y-57);ctx.lineTo(x+51,y-35);ctx.lineTo(x+44,y-22);ctx.lineTo(x-43,y-22);ctx.closePath();ctx.fill();
    ctx.strokeStyle="rgba(224,210,174,.58)";ctx.lineWidth=2;
    for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(x+i*11,y-39-i%2*2);ctx.lineTo(x+i*11,y-24);ctx.stroke();}
    ctx.fillStyle="#654b35";ctx.fillRect(x-17,y-4,34,36);
    ctx.fillStyle="#9d8059";ctx.fillRect(x-15,y-2,14,32);ctx.fillRect(x+1,y-2,14,32);
    ctx.strokeStyle="#d5bd91";ctx.lineWidth=2;ctx.strokeRect(x-15,y-2,14,32);ctx.strokeRect(x+1,y-2,14,32);
    ctx.fillStyle="#71847c";ctx.fillRect(x-31,y-20,12,11);ctx.fillRect(x+19,y-20,12,11);
    ctx.fillStyle="#c5a875";ctx.fillRect(x-35,y+37,70,5);
    ctx.fillStyle="rgba(218,199,157,.48)";ctx.fillRect(x-28,y+43,56,3);
  }

  function drawFarmRegion(cameraY) {
    // Propriedade agrícola ampliada: talhões, curral, tratores e galpões distribuídos pelo vale.
    const plots=[
      {s:2110,side:-1,variant:0},{s:2236,side:1,variant:1},
      {s:2496,side:1,variant:2},{s:2650,side:-1,variant:1},
      {s:2782,side:-1,variant:2},{s:2940,side:1,variant:0},
      {s:3068,side:-1,variant:1}
    ];
    for(const plot of plots){
      const q=worldToScreen(trackPoint(plot.s),cameraY);
      if(q.y < -150 || q.y > H+150) continue;
      const x=q.x+plot.side*180;
      drawFarmPlot(x,q.y,plot.variant);
      if([2110,2496,2782].includes(plot.s)) drawFarmTractor(x,q.y,plot.s*.001);
    }

    const house=worldToScreen(trackPoint(2652),cameraY);
    if(house.y>-100&&house.y<H+100) drawFarmBuilding(house.x-185,house.y+35);

    const animals=worldToScreen(trackPoint(2380),cameraY);
    if(animals.y>-100&&animals.y<H+100) drawFarmAnimals(animals.x+160,animals.y+45);

    // Galpões em pontos distintos da propriedade, com pátio de manobra.
    const sheds=[
      {s:2200,side:-1,d:305,v:0},
      {s:2700,side:1,d:310,v:1},
      {s:3010,side:-1,d:310,v:0}
    ];
    for(const shed of sheds){
      const p=worldToScreen(trackPoint(shed.s),cameraY);
      const x=p.x+shed.side*shed.d;
      if(p.y>-130&&p.y<H+130&&x>70&&x<W-70){
        ctx.fillStyle="#9a8059";ctx.beginPath();ctx.ellipse(x,p.y+63,56,25,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="rgba(220,198,151,.35)";ctx.fillRect(x-35,p.y+59,70,3);
        drawFarmShed(x,p.y,shed.v);
      }
    }

    // Silo de grãos com cobertura cônica, base e escada lateral.
    const silo=worldToScreen(trackPoint(2990),cameraY);
    if(silo.y>-100&&silo.y<H+100){
      const sx=silo.x+190, sy=silo.y-24;
      ctx.fillStyle="rgba(26,31,24,.28)";ctx.beginPath();ctx.ellipse(sx+3,sy+25,18,7,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle="#c8c8b5";ctx.fillRect(sx-13,sy-1,26,43);
      ctx.fillStyle="#e0dfca";ctx.fillRect(sx-10,sy+2,5,36);
      ctx.fillStyle="#8e9990";ctx.beginPath();ctx.moveTo(sx-16,sy);ctx.lineTo(sx,sy-12);ctx.lineTo(sx+16,sy);ctx.closePath();ctx.fill();
      ctx.fillStyle="#7c5540";ctx.fillRect(sx-17,sy-3,34,5);
      ctx.strokeStyle="#69766e";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx+17,sy+5);ctx.lineTo(sx+17,sy+36);ctx.stroke();
      for(let yy=sy+8;yy<sy+36;yy+=6)ctx.fillRect(sx+13,yy,8,2);
    }
  }


  function drawForestTree(x, y, variant = 0) {
    const tone=Math.abs(variant)%3;
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle="rgba(10,30,16,.36)";ctx.beginPath();ctx.ellipse(5,17,27,12,-.1,0,Math.PI*2);ctx.fill();
    const layers=[
      [-12,0,18,15,["#153d22","#194426","#204b2a"][tone]],
      [10,1,19,15,["#1d512b","#245a2d","#285f32"][tone]],
      [-2,-10,21,17,["#286b32","#317536","#397b39"][tone]],
      [-17,-9,13,12,"#245d2c"],[17,-10,13,12,"#34763a"]
    ];
    for(const l of layers){ctx.fillStyle=l[4];ctx.beginPath();ctx.ellipse(l[0],l[1],l[2],l[3],0,0,Math.PI*2);ctx.fill();}
    const shine=ctx.createRadialGradient(-9,-14,1,-7,-9,26);
    shine.addColorStop(0,"rgba(174,220,91,.75)");shine.addColorStop(.5,"rgba(105,170,57,.58)");shine.addColorStop(1,"rgba(52,116,43,0)");
    ctx.fillStyle=shine;ctx.beginPath();ctx.ellipse(-7,-9,22,18,-.2,0,Math.PI*2);ctx.fill();
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9+tone*.23;ctx.save();ctx.translate(Math.cos(a)*14,Math.sin(a)*11-4);ctx.rotate(a+Math.PI/2);ctx.fillStyle=i%2?"#6eae42":"#8ac34c";ctx.beginPath();ctx.ellipse(0,-6,3.5,9,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    ctx.restore();
  }
  function drawForestShrub(x, y, variant = 0) {
    const tone=Math.abs(variant)%3;
    const dark=["#24552c","#285d30","#1f4e29"][tone];
    const mid=["#43833a","#4d8d3e","#397a37"][tone];
    const light=["#8fbd4b","#a0c957","#7eae43"][tone];
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle="rgba(13,35,17,.28)";ctx.beginPath();ctx.ellipse(3,8,21,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=dark;
    for(const b of [[-10,0,12,8],[2,-3,13,10],[12,1,10,7],[-2,5,13,7],[-15,3,7,6]]){ctx.beginPath();ctx.ellipse(b[0],b[1],b[2],b[3],0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=mid;
    for(const b of [[-9,-3,9,7],[3,-7,10,8],[12,-2,7,6],[-1,2,9,6]]){ctx.beginPath();ctx.ellipse(b[0],b[1],b[2],b[3],-.2,0,Math.PI*2);ctx.fill();}
    const glint=ctx.createRadialGradient(-5,-8,1,-4,-6,17);
    glint.addColorStop(0,light);glint.addColorStop(1,"rgba(125,178,64,0)");
    ctx.fillStyle=glint;ctx.beginPath();ctx.ellipse(-4,-5,15,11,-.25,0,Math.PI*2);ctx.fill();
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ctx.save();ctx.translate(Math.cos(a)*9,Math.sin(a)*5-3);ctx.rotate(a+Math.PI/2);ctx.fillStyle=i%2?"#a6ce5d":"#6da943";ctx.beginPath();ctx.ellipse(0,-4,2.6,6,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    if(variant%3===0){ctx.fillStyle="#e6d17b";ctx.beginPath();ctx.arc(8,-5,2,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  function drawForestRegion(cameraY) {
    // A mata começa depois dos talhões e se adensa gradualmente ao longo do trecho final.
    const cameraWorld = cameraY - H * .56;
    const first = Math.floor((cameraWorld - 180) / 104);
    const last = Math.ceil((cameraWorld + H + 180) / 104);

    for (let row = first; row <= last; row++) {
      const s = 690 - (row * 104 + 52);
      if (s < 3146 || s > 3460) continue;
      // Reserva apenas a margem imediata do rio; o restante da floresta permanece.
      if (s >= 3400 && s <= 3460) continue;
      const p = trackPoint(s);
      const y = row * 104 + 52 - cameraWorld;
      const density = Math.min(1, Math.max(0.35, (s - 3146) / 260));

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

  function drawFlowerField(cameraY) {
    // Campo aberto e contínuo: somente flores e vegetação baixa, sem árvores.
    const cameraWorld = cameraY - H * .56;
    const firstRow = Math.floor((cameraWorld - 120) / 48);
    const lastRow = Math.ceil((cameraWorld + H + 120) / 48);
    const colors = ["#e7d45d", "#e9a4bd", "#f1eee0", "#b9a0d8", "#e28b55", "#f2c6df"];

    for (let row = firstRow; row <= lastRow; row++) {
      const yWorld = row * 48 + 24;
      const s = 690 - yWorld;
      if (s < 3780 || s > 5650) continue;
      const p = trackPoint(s);
      const y = yWorld - cameraWorld;

      for (let col = 0; col < 20; col++) {
        const seed = row * 251 + col * 83;
        const x = col * 42 + (seeded(seed) - .5) * 24;
        if (Math.abs(x - p.x) < 72 || x < 4 || x > W - 4) continue;

        if (seeded(seed + 9) > .35) {
          ctx.fillStyle = seeded(seed + 17) > .5 ? "#86a95b" : "#91ad61";
          ctx.fillRect(x - 13, y - 9, 26, 18);
        }

        for (let i = 0; i < 5; i++) {
          const fx = x + (seeded(seed + 30 + i * 7) - .5) * 38;
          const fy = y + (seeded(seed + 31 + i * 11) - .5) * 32;
          if (Math.abs(fx - p.x) < 67) continue;
          ctx.fillStyle = colors[Math.floor(seeded(seed + 32 + i * 13) * colors.length)];
          ctx.fillRect(fx, fy, 4, 4);
          ctx.fillStyle = "#f8edb2";
          ctx.fillRect(fx + 1, fy - 2, 2, 2);
        }
      }
    }
  }


  function drawTownHouse(x, y, variant = 0, garage = false) {
    // Residência vista de cima com telhado de telhas, beirais, varanda e garagem.
    const walls = ["#d9c49e","#c7d0bd","#d8b5a2","#d8d0ad"];
    const roofs = ["#a95543","#876653","#667985","#b57a49"];
    const wall = walls[variant % walls.length];
    const roof = roofs[variant % roofs.length];
    const shadow = "rgba(25,31,27,.28)";

    // Lote gramado e sombra geral da construção.
    ctx.fillStyle = shadow;
    ctx.fillRect(x-61,y-45,garage?145:116,99);
    ctx.fillStyle = variant%2 ? "#78945d" : "#719052";
    ctx.fillRect(x-60,y-48,garage?143:116,94);
    // Pequenos canteiros laterais e grama em manchas.
    ctx.fillStyle = "#8eaa69";
    ctx.fillRect(x-54,y-42,18,8);
    ctx.fillRect(x+18,y+25,24,8);
    ctx.fillStyle = "#66864d";
    ctx.fillRect(x-50,y-39,9,3);
    ctx.fillRect(x+27,y+29,11,3);

    // Calçada frontal segmentada e guia de concreto.
    ctx.fillStyle = "#aaa99d";
    ctx.fillRect(x-62,y+39,garage?147:119,12);
    ctx.fillStyle = "#d8d4c6";
    ctx.fillRect(x-62,y+39,garage?147:119,3);
    ctx.fillStyle = "#b9b6a8";
    for(let t=0;t<(garage?9:7);t++) ctx.fillRect(x-56+t*16,y+44,1,6);
    // Rampa de acesso ao portão.
    if(garage){
      ctx.fillStyle = "#b6ae99";
      ctx.fillRect(x+43,y+28,27,17);
      ctx.fillStyle = "#d0c8b4";
      ctx.fillRect(x+46,y+30,21,13);
      ctx.fillStyle = "rgba(80,75,64,.18)";
      ctx.fillRect(x+48,y+32,17,2);
    }

    // Garagem integrada à casa, com cobertura e portão basculante detalhado.
    if(garage){
      ctx.fillStyle = "#655f54";
      ctx.fillRect(x+36,y-8,39,44);
      ctx.fillStyle = "#c9c0aa";
      ctx.fillRect(x+39,y-10,34,39);
      ctx.fillStyle = "#817f76";
      ctx.fillRect(x+42,y+9,28,19);
      ctx.fillStyle = "#a9a79d";
      for(let k=0;k<5;k++) ctx.fillRect(x+43,y+11+k*3,26,1);
      ctx.fillStyle = "#e2d8c2";
      ctx.fillRect(x+40,y-9,32,3);
      ctx.fillStyle = "#4b4b45";
      ctx.fillRect(x+53,y+5,5,2);
      // Arandela sobre a garagem.
      ctx.fillStyle = "#e8d79a";
      ctx.fillRect(x+52,y-14,7,3);
    }

    // Fundação e paredes com face iluminada e face em sombra.
    ctx.fillStyle = "#756b5a";
    ctx.fillRect(x-36,y-27,74,57);
    ctx.fillStyle = wall;
    ctx.fillRect(x-33,y-31,68,53);
    ctx.fillStyle = "rgba(255,255,255,.24)";
    ctx.fillRect(x-31,y-29,5,47);
    ctx.fillStyle = "rgba(63,52,43,.24)";
    ctx.fillRect(x+29,y-27,5,46);
    // Rodapé de pedra e pequenas marcas de alvenaria.
    ctx.fillStyle = "#9c927e";
    ctx.fillRect(x-32,y+16,64,5);
    ctx.fillStyle = "rgba(255,255,255,.17)";
    for(let k=0;k<4;k++) ctx.fillRect(x-27+k*16,y+18,8,1);

    // Telhado com duas águas, beirais espessos e textura de telhas.
    ctx.fillStyle = shadow;
    ctx.fillRect(x-41,y-41,83,54);
    ctx.fillStyle = "#55483e";
    ctx.fillRect(x-40,y-43,80,50);
    ctx.fillStyle = roof;
    ctx.fillRect(x-37,y-42,74,42);
    ctx.fillStyle = "rgba(255,220,183,.24)";
    ctx.fillRect(x-34,y-40,68,4);
    ctx.fillStyle = "rgba(40,32,29,.23)";
    ctx.fillRect(x-37,y-3,74,4);
    // Fiadas de telhas, com alternância para não parecer uma superfície lisa.
    for(let row=0;row<5;row++){
      const yy=y-34+row*7;
      ctx.fillStyle = row%2 ? "rgba(45,30,25,.18)" : "rgba(255,205,165,.13)";
      ctx.fillRect(x-34,yy,68,2);
      for(let col=0;col<8;col++){
        const xx=x-32+col*9+(row%2?4:0);
        if(xx<x+33) ctx.fillRect(xx,yy+2,1,3);
      }
    }
    // Cumeeira e calhas.
    ctx.fillStyle = "#59483d";
    ctx.fillRect(x-3,y-42,6,42);
    ctx.fillStyle = "rgba(255,231,194,.35)";
    ctx.fillRect(x-2,y-40,2,37);
    ctx.fillStyle = "#77756c";
    ctx.fillRect(x-39,y+1,78,2);

    // Chaminé, caixa d'água/ventilação e claraboia.
    ctx.fillStyle = "#51483f";
    ctx.fillRect(x+18,y-35,11,11);
    ctx.fillStyle = "#8e8371";
    ctx.fillRect(x+20,y-34,7,7);
    ctx.fillStyle = "#6b7773";
    ctx.fillRect(x-27,y-30,12,8);
    ctx.fillStyle = "#a9c0bd";
    ctx.fillRect(x-25,y-29,8,5);

    // Janelas com moldura, vidro refletivo e divisórias.
    for(const wx of [x-25,x+14]){
      ctx.fillStyle = "#675d4e";
      ctx.fillRect(wx-2,y-16,14,13);
      ctx.fillStyle = "#9fc5c7";
      ctx.fillRect(wx,y-15,10,10);
      ctx.fillStyle = "rgba(255,255,255,.48)";
      ctx.fillRect(wx+1,y-14,3,7);
      ctx.fillStyle = "#e8dfc8";
      ctx.fillRect(wx+4,y-15,1,10);
      ctx.fillRect(wx,y-10,10,1);
    }
    // Porta, pequeno alpendre e degrau.
    ctx.fillStyle = "#8b7659";
    ctx.fillRect(x-7,y-1,16,25);
    ctx.fillStyle = "#51483b";
    ctx.fillRect(x-5,y+1,12,21);
    ctx.fillStyle = "#c5a45d";
    ctx.fillRect(x+4,y+10,2,3);
    ctx.fillStyle = "#d0c5ad";
    ctx.fillRect(x-10,y+22,22,5);
    // Vasos junto à entrada.
    ctx.fillStyle = "#9b684e";
    ctx.fillRect(x-15,y+18,5,6);
    ctx.fillRect(x+14,y+18,5,6);
    ctx.fillStyle = "#5e8b4f";
    ctx.fillRect(x-15,y+15,5,4);
    ctx.fillRect(x+14,y+15,5,4);

    // Muro baixo, pilares e portão de pedestres na frente do lote.
    ctx.fillStyle = "#d7cfb9";
    ctx.fillRect(x-58,y+34,garage?92:111,3);
    for(let post=-57;post<=(garage?31:52);post+=18){
      ctx.fillStyle = "#eee5d1";
      ctx.fillRect(x+post,y+31,4,8);
      ctx.fillStyle = "#b6ad98";
      ctx.fillRect(x+post,y+31,4,2);
    }
    // Arbustos e pequenas flores.
    ctx.fillStyle = "#3e7548";
    ctx.fillRect(x-53,y-26,13,12);
    ctx.fillRect(x+ (garage?77:43),y-26,12,13);
    ctx.fillStyle = "#86ae61";
    ctx.fillRect(x-50,y-29,8,7);
    ctx.fillRect(x+(garage?80:46),y-29,7,7);
    ctx.fillStyle = "#e7c1a0";
    ctx.fillRect(x-48,y-21,2,2);
    ctx.fillRect(x+ (garage?82:48),y-21,2,2);
  }
  function drawTownShop(x, y, variant = 0) {
    // Fachada comercial com cobertura, marquise, vitrines e calçada larga.
    const awning = variant%2 ? "#477b85" : "#b45d45";
    const wall = variant%2 ? "#d7d0b8" : "#e0cba7";
    ctx.fillStyle = "rgba(22,31,27,.3)";
    ctx.fillRect(x-52,y-42,108,88);
    ctx.fillStyle = "#78945b";
    ctx.fillRect(x-54,y-45,108,84);
    // Passeio em frente à loja.
    ctx.fillStyle = "#bdb9aa";
    ctx.fillRect(x-55,y+33,110,12);
    ctx.fillStyle = "#e2ddce";
    ctx.fillRect(x-55,y+33,110,3);
    for(let i=0;i<8;i++){
      ctx.fillStyle = "#a5a293";
      ctx.fillRect(x-49+i*14,y+39,1,5);
    }
    // Corpo do prédio e paredes laterais com sombra.
    ctx.fillStyle = "#756b5c";
    ctx.fillRect(x-43,y-31,88,67);
    ctx.fillStyle = wall;
    ctx.fillRect(x-40,y-35,82,65);
    ctx.fillStyle = "rgba(255,255,255,.2)";
    ctx.fillRect(x-38,y-32,5,56);
    ctx.fillStyle = "rgba(55,47,38,.2)";
    ctx.fillRect(x+36,y-30,5,55);
    // Telhado plano com platibanda e equipamento no topo.
    ctx.fillStyle = "#4d5351";
    ctx.fillRect(x-45,y-44,91,17);
    ctx.fillStyle = "#727a75";
    ctx.fillRect(x-42,y-43,85,11);
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.fillRect(x-39,y-41,78,2);
    ctx.fillStyle = "#9a9b8e";
    ctx.fillRect(x+22,y-40,12,7);
    ctx.fillStyle = "#535b59";
    ctx.fillRect(x+25,y-38,6,3);
    // Marquise saliente e toldo listrado.
    ctx.fillStyle = "rgba(25,29,27,.28)";
    ctx.fillRect(x-44,y-17,89,12);
    ctx.fillStyle = awning;
    ctx.fillRect(x-43,y-20,87,10);
    for(let i=0;i<7;i++){
      ctx.fillStyle = i%2 ? "#f0dfb4" : awning;
      ctx.fillRect(x-41+i*12,y-10,11,7);
    }
    // Letreiro com moldura e pequenas letras simuladas.
    ctx.fillStyle = "#51483e";
    ctx.fillRect(x-26,y-32,53,10);
    ctx.fillStyle = "#f2e5bd";
    ctx.fillRect(x-24,y-31,49,7);
    ctx.fillStyle = "#6b5a43";
    for(let i=0;i<5;i++) ctx.fillRect(x-18+i*8,y-29,4,3);
    // Vitrines com reflexo, moldura e divisórias.
    for(const wx of [x-31,x+11]){
      ctx.fillStyle = "#4d5551";
      ctx.fillRect(wx-2,y-5,22,23);
      ctx.fillStyle = "#91b9bb";
      ctx.fillRect(wx,y-3,18,19);
      ctx.fillStyle = "rgba(255,255,255,.52)";
      ctx.fillRect(wx+2,y-2,4,15);
      ctx.fillStyle = "#d9d4c5";
      ctx.fillRect(wx+9,y-3,1,19);
      // Prateleiras e produtos coloridos no interior.
      ctx.fillStyle = "#d9b36c";
      ctx.fillRect(wx+2,y+8,4,3);
      ctx.fillStyle = "#b66b4d";
      ctx.fillRect(wx+10,y+3,5,4);
    }
    // Porta de vidro, puxador e degrau.
    ctx.fillStyle = "#394b4b";
    ctx.fillRect(x-7,y+1,14,28);
    ctx.fillStyle = "#83aeb1";
    ctx.fillRect(x-5,y+3,10,23);
    ctx.fillStyle = "rgba(255,255,255,.4)";
    ctx.fillRect(x-4,y+4,2,17);
    ctx.fillStyle = "#d6bd7c";
    ctx.fillRect(x+2,y+14,2,3);
    ctx.fillStyle = "#aaa493";
    ctx.fillRect(x-11,y+28,22,4);
    // Arandelas e vasos na fachada.
    ctx.fillStyle = "#f3d991";
    ctx.fillRect(x-36,y-24,4,4);
    ctx.fillRect(x+34,y-24,4,4);
    ctx.fillStyle = "#a06c4f";
    ctx.fillRect(x-39,y+22,7,7);
    ctx.fillRect(x+32,y+22,7,7);
    ctx.fillStyle = "#4f824b";
    ctx.fillRect(x-38,y+18,5,5);
    ctx.fillRect(x+33,y+18,5,5);
  }
  function drawTownTree(x, y, variant = 0) {
    // Copa em camadas e sombra deslocada para dar altura ao paisagismo.
    ctx.fillStyle = "rgba(30,42,29,.25)";
    ctx.fillRect(x - 17, y + 9, 38, 17);
    ctx.fillStyle = "#594b39";
    ctx.fillRect(x - 3, y - 1, 7, 20);
    ctx.fillStyle = variant % 2 ? "#397447" : "#477f4b";
    ctx.fillRect(x - 16, y - 16, 33, 31);
    ctx.fillStyle = variant % 2 ? "#75a85b" : "#83ad62";
    ctx.fillRect(x - 11, y - 21, 23, 23);
    ctx.fillStyle = "rgba(220,239,174,.35)";
    ctx.fillRect(x - 8, y - 17, 8, 6);
  }

  function drawTownLamp(x, y) {
    ctx.fillStyle = "rgba(20,25,23,.25)";
    ctx.fillRect(x + 3, y + 5, 10, 5);
    ctx.fillStyle = "#454b49";
    ctx.fillRect(x, y - 8, 4, 15);
    ctx.fillStyle = "#252e2d";
    ctx.fillRect(x - 4, y - 11, 12, 7);
    ctx.fillStyle = "#f5df91";
    ctx.fillRect(x - 2, y - 9, 8, 3);
    ctx.fillStyle = "rgba(255,225,140,.13)";
    ctx.fillRect(x - 8, y - 15, 20, 15);
  }

  function drawTownCar(x, y, color = "#547b91") {
    // Automóvel compacto com carroceria facetada, vidros, rodas e faróis.
    ctx.fillStyle = "rgba(18,24,23,.3)";
    ctx.fillRect(x-12,y-17,26,41);
    // Pneus laterais.
    ctx.fillStyle = "#252b2d";
    ctx.fillRect(x-12,y-11,3,9);
    ctx.fillRect(x+10,y-11,3,9);
    ctx.fillRect(x-12,y+5,3,9);
    ctx.fillRect(x+10,y+5,3,9);
    // Para-choques e carroceria.
    ctx.fillStyle = "#343c3d";
    ctx.fillRect(x-11,y-19,23,40);
    ctx.fillStyle = color;
    ctx.fillRect(x-9,y-18,19,36);
    ctx.fillStyle = "rgba(255,255,255,.25)";
    ctx.fillRect(x-8,y-16,3,28);
    ctx.fillStyle = "rgba(25,30,31,.2)";
    ctx.fillRect(x+7,y-15,2,29);
    // Capô e porta-malas em tons diferentes.
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(x-7,y-16,14,7);
    ctx.fillStyle = "rgba(20,27,30,.16)";
    ctx.fillRect(x-7,y+11,14,5);
    // Para-brisa e vidro traseiro.
    ctx.fillStyle = "#344d55";
    ctx.fillRect(x-8,y-8,17,10);
    ctx.fillRect(x-8,y+4,17,6);
    ctx.fillStyle = "#a9c9cb";
    ctx.fillRect(x-7,y-7,15,8);
    ctx.fillStyle = "#78999e";
    ctx.fillRect(x-7,y+5,15,4);
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.fillRect(x-6,y-6,4,5);
    ctx.fillRect(x-6,y+5,4,2);
    // Divisória central, retrovisores e luzes.
    ctx.fillStyle = "#252f32";
    ctx.fillRect(x,y-7,1,17);
    ctx.fillRect(x-12,y-8,3,4);
    ctx.fillRect(x+10,y-8,3,4);
    ctx.fillStyle = "#f4e7b9";
    ctx.fillRect(x-8,y-18,5,2);
    ctx.fillRect(x+4,y-18,5,2);
    ctx.fillStyle = "#c65e4c";
    ctx.fillRect(x-8,y+17,5,2);
    ctx.fillRect(x+4,y+17,5,2);
    // Maçanetas.
    ctx.fillStyle = "rgba(245,235,210,.65)";
    ctx.fillRect(x+8,y-2,2,3);
    ctx.fillRect(x+8,y+7,2,3);
  }
  function drawTownRoad(cameraY, s, crossing = false) {
    const p = worldToScreen(trackPoint(s), cameraY);
    const half = crossing ? 31 : 24;
    // Rua de paralelepípedos com base, meio-fio e pedras assentadas individualmente.
    ctx.fillStyle = "rgba(25,29,27,.22)";
    ctx.fillRect(0, p.y - half - 5, W, (half + 5) * 2);
    ctx.fillStyle = "#555951";
    ctx.fillRect(0, p.y - half - 2, W, half * 2 + 4);
    ctx.fillStyle = "#827f73";
    ctx.fillRect(0, p.y - half, W, half * 2);
    for (let row = -half + 2, r = 0; row < half - 1; row += 8, r++) {
      const offset = r % 2 ? 7 : 0;
      for (let x = -12 + offset; x < W + 12; x += 16) {
        const tone = (Math.floor((x + 12) / 16) * 7 + r * 11 + Math.round(s)) % 5;
        const colors = ["#999487","#8d897d","#a29d8e","#858276","#969183"];
        ctx.fillStyle = "rgba(39,42,38,.42)";
        ctx.fillRect(x + 1, p.y + row + 1, 14, 6);
        ctx.fillStyle = colors[(tone + 5) % 5];
        ctx.fillRect(x, p.y + row, 13, 5.5);
        ctx.fillStyle = "rgba(232,225,207,.22)";
        ctx.fillRect(x + 1, p.y + row, 10, 1);
      }
    }
    // Meio-fio e calçadas contínuas dos dois lados da rua.
    for (const side of [-1, 1]) {
      const curbY = p.y + side * (half + 2);
      ctx.fillStyle = "#565b54";
      ctx.fillRect(0, curbY - 2, W, 5);
      ctx.fillStyle = "#c2bdae";
      ctx.fillRect(0, curbY + side * 3, W, 12);
      ctx.fillStyle = "#e0dacb";
      ctx.fillRect(0, curbY + side * 3, W, 2);
      for (let x = 0; x < W; x += 24) {
        ctx.fillStyle = "rgba(105,103,91,.35)";
        ctx.fillRect(x, curbY + side * 7, 1, 8);
      }
      ctx.fillStyle = "#8c8a7d";
      ctx.fillRect(0, curbY - 1, W, 1);
    }
    // Sarjetas e grelhas de drenagem.
    ctx.fillStyle = "#4c514b";
    for (let x = 55; x < W; x += 170) {
      const gy = p.y - half - 5;
      ctx.fillRect(x, gy, 13, 4);
      ctx.fillRect(x + 2, gy + 1, 9, 1);
      ctx.fillRect(x + 2, p.y + half + 2, 13, 4);
    }
    if (crossing) {
      // Faixas de retenção antes da passagem, sem interferir na geometria da via.
      ctx.fillStyle = "rgba(246,239,218,.86)";
      ctx.fillRect(0, p.y - half - 1, W, 2);
      ctx.fillRect(0, p.y + half - 1, W, 2);
      drawTownCrossingEquipment(p, s);
    }
  }

  function drawTownCrossingDeck(cameraY, s) {
    // Painéis de concreto/asfalto assentados ao redor dos trilhos na passagem de nível.
    // A placa é desenhada sobre o lastro e os dois trilhos são redesenhados por cima.
    const raw = trackPoint(s);
    const p = worldToScreen(raw, cameraY);
    const angle = Math.atan2(raw.ty, raw.tx);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.fillStyle = "rgba(22,25,23,.35)";
    ctx.fillRect(-39, -40, 78, 80);
    ctx.fillStyle = "#686b64";
    ctx.fillRect(-37, -38, 74, 76);
    ctx.fillStyle = "#aaa99d";
    ctx.fillRect(-35, -36, 70, 72);
    // Painéis segmentados e juntas de dilatação.
    for (let x = -32; x <= 24; x += 14) {
      ctx.fillStyle = x % 2 ? "#b8b5a8" : "#a6a69b";
      ctx.fillRect(x, -34, 12, 68);
      ctx.fillStyle = "rgba(65,69,64,.3)";
      ctx.fillRect(x + 12, -34, 1, 68);
    }
    // Canaletas de proteção e flangeways junto aos trilhos.
    for (const railY of [-11, 11]) {
      ctx.fillStyle = "#454b48";
      ctx.fillRect(-36, railY - 4, 72, 2);
      ctx.fillRect(-36, railY + 3, 72, 2);
      ctx.fillStyle = "#c3c7bd";
      ctx.fillRect(-36, railY - 1.5, 72, 3);
      ctx.fillStyle = "#f0eee2";
      ctx.fillRect(-34, railY - 1.5, 68, .8);
      ctx.fillStyle = "#343b39";
      for (let x = -29; x <= 29; x += 14) {
        ctx.fillRect(x, railY - 5, 3, 10);
      }
    }
    ctx.strokeStyle = "rgba(245,239,220,.65)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-35, -36, 70, 72);
    ctx.restore();
  }

  function drawTownCrossingEquipment(p, crossingS) {
    // Cancelas duplas com braços listrados, acionamento mecânico e luzes intermitentes.
    // O fechamento acompanha a aproximação do trem sem alterar trilhos ou circulação.
    const trainS = START_S + state.trackOffset;
    const distance = Math.abs(trainS - crossingS);
    const amount = Math.max(0, Math.min(1, (470 - distance) / 190));
    const closed = amount * amount * (3 - 2 * amount);
    const blink = Math.floor((state.lastTime || 0) / 360) % 2 === 0;

    // Linhas de retenção dos veículos, uma de cada lado da ferrovia.
    ctx.fillStyle = "rgba(244,239,218,.9)";
    ctx.fillRect(p.x - 105, p.y - 29, 3, 58);
    ctx.fillRect(p.x + 102, p.y - 29, 3, 58);
    ctx.fillStyle = "rgba(45,48,43,.28)";
    ctx.fillRect(p.x - 109, p.y - 29, 2, 58);
    ctx.fillRect(p.x + 105, p.y - 29, 2, 58);

    for (const side of [-1, 1]) {
      const x = p.x + side * 57;

      // Base de concreto e pedestal amarelo/preto.
      ctx.fillStyle = "rgba(20,25,24,.28)";
      ctx.beginPath();
      ctx.ellipse(x + 2, p.y + 5, 19, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#777a70";
      ctx.fillRect(x - 12, p.y - 12, 24, 25);
      ctx.fillStyle = "#c8c8b8";
      ctx.fillRect(x - 10, p.y - 10, 20, 19);
      ctx.fillStyle = "#d5a92f";
      ctx.fillRect(x - 8, p.y - 8, 16, 15);
      ctx.fillStyle = "#343b38";
      ctx.fillRect(x - 8, p.y - 2, 16, 4);

      // Caixa do motor e articulação do braço.
      ctx.fillStyle = "#303b3b";
      ctx.fillRect(x - 13, p.y - 21, 26, 14);
      ctx.fillStyle = "#697775";
      ctx.fillRect(x - 11, p.y - 20, 22, 4);
      ctx.fillStyle = "#202a2a";
      ctx.fillRect(x - 4, p.y - 18, 8, 11);
      ctx.fillStyle = "#d7d9ca";
      ctx.fillRect(x - 2, p.y - 16, 4, 7);

      // Poste de advertência com cruz de Santo André.
      ctx.fillStyle = "rgba(25,29,26,.25)";
      ctx.fillRect(x + side * 24 - 5, p.y - 63, 12, 69);
      ctx.fillStyle = "#e8e4d4";
      ctx.fillRect(x + side * 24 - 3, p.y - 65, 8, 67);
      ctx.fillStyle = "#b53d32";
      ctx.fillRect(x + side * 24 - 3, p.y - 54, 8, 7);
      ctx.fillRect(x + side * 24 - 3, p.y - 39, 8, 7);
      ctx.fillStyle = "#f0e8d2";
      ctx.fillRect(x + side * 24 - 13, p.y - 61, 28, 6);
      ctx.fillRect(x + side * 24 - 13, p.y - 49, 28, 6);
      ctx.save();
      ctx.translate(x + side * 24 + 1, p.y - 55);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = "#f2eee0";
      ctx.fillRect(-3, -17, 6, 34);
      ctx.fillStyle = "#b83e34";
      ctx.fillRect(-3, -17, 6, 7);
      ctx.fillRect(-3, 10, 6, 7);
      ctx.restore();

      // Faróis vermelhos alternados.
      ctx.fillStyle = "#252c2a";
      ctx.fillRect(x - 13, p.y - 35, 26, 12);
      ctx.fillStyle = blink && closed > .02 ? "#ff4b3e" : "#7d2926";
      ctx.beginPath();
      ctx.arc(x - 7, p.y - 29, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = !blink && closed > .02 ? "#ff4b3e" : "#7d2926";
      ctx.beginPath();
      ctx.arc(x + 7, p.y - 29, 4, 0, Math.PI * 2);
      ctx.fill();
      if (closed > .02) {
        ctx.fillStyle = blink ? "rgba(255,65,48,.16)" : "rgba(255,65,48,.08)";
        ctx.beginPath();
        ctx.arc(x - 7, p.y - 29, 11, 0, Math.PI * 2);
        ctx.fill();
      }

      // Braço: horizontal quando aberto e transversal à rua quando fechado.
      const pivotX = x;
      // Os braços abertos apontam para o centro da rua; ao fechar, ambos descem.
      const openAngle = side < 0 ? 0 : Math.PI;
      // Teste de orientação: o braço do lado esquerdo usa rotação inversa.
      const closedAngle = side < 0 ? -Math.PI / 2 : Math.PI / 2;
      const angle = openAngle + (closedAngle - openAngle) * closed;
      ctx.save();
      ctx.translate(pivotX, p.y - 13);
      ctx.rotate(angle);
      ctx.fillStyle = "rgba(20,24,22,.3)";
      ctx.fillRect(1, -4, 79, 11);
      ctx.fillStyle = "#eee9d8";
      ctx.fillRect(0, -5, 78, 9);
      ctx.fillStyle = "#c23d32";
      for (let stripe = 0; stripe < 5; stripe++) {
        ctx.beginPath();
        ctx.moveTo(8 + stripe * 14, -5);
        ctx.lineTo(16 + stripe * 14, -5);
        ctx.lineTo(10 + stripe * 14, 4);
        ctx.lineTo(2 + stripe * 14, 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "#f7f0dc";
      ctx.fillRect(74, -6, 5, 11);
      ctx.fillStyle = "#303936";
      ctx.fillRect(-3, -7, 8, 14);
      ctx.restore();
    }
  }

  function drawTownPark(x, y) {
    // Praça pública com passeio perimetral, caminhos, canteiros e mobiliário.
    ctx.fillStyle = "rgba(20,29,24,.3)";
    ctx.fillRect(x-82,y-79,164,160);
    ctx.fillStyle = "#bdb9a9";
    ctx.fillRect(x-84,y-82,164,160);
    ctx.fillStyle = "#d9d3c2";
    ctx.fillRect(x-80,y-78,156,152);
    ctx.fillStyle = "#709456";
    ctx.fillRect(x-73,y-71,142,138);
    // Gramado com manchas de textura.
    ctx.fillStyle = "rgba(180,204,125,.24)";
    for(let i=0;i<12;i++) ctx.fillRect(x-64+(i%4)*34,y-60+Math.floor(i/4)*39,13,5);
    // Caminhos em cruz com bordas e paginação.
    ctx.fillStyle = "#b5aa91";
    ctx.fillRect(x-11,y-69,23,132);
    ctx.fillRect(x-69,y-11,133,23);
    ctx.fillStyle = "#dfd4bb";
    ctx.fillRect(x-8,y-67,17,128);
    ctx.fillRect(x-67,y-8,128,17);
    ctx.fillStyle = "#bdb49e";
    for(let py=y-60;py<y+56;py+=13) ctx.fillRect(x-7,py,15,1);
    for(let px=x-60;px<x+56;px+=13) ctx.fillRect(px,y-7,1,15);
    // Canteiro central e fonte circular.
    ctx.fillStyle = "#426f46";
    ctx.fillRect(x-30,y-30,61,61);
    ctx.fillStyle = "#8eb36a";
    ctx.fillRect(x-25,y-25,51,51);
    ctx.fillStyle = "#557f50";
    ctx.fillRect(x-20,y-20,41,41);
    ctx.fillStyle = "#6b9da0";
    ctx.fillRect(x-12,y-12,25,25);
    ctx.fillStyle = "#c0e0d8";
    ctx.fillRect(x-7,y-7,15,15);
    ctx.fillStyle = "rgba(255,255,255,.45)";
    ctx.fillRect(x-5,y-6,4,4);
    // Quatro canteiros floridos nos cantos.
    for(const [dx,dy] of [[-48,-47],[47,-47],[-48,47],[47,47]]){
      ctx.fillStyle = "#527d49";
      ctx.fillRect(x+dx-8,y+dy-7,17,15);
      ctx.fillStyle = "#e5b5c3";
      ctx.fillRect(x+dx-4,y+dy-3,3,3);
      ctx.fillStyle = "#f0d28b";
      ctx.fillRect(x+dx+2,y+dy+1,3,3);
    }
    // Bancos, árvores, lixeiras e postes.
    drawParkBench(x-43,y-42);
    drawParkBench(x+43,y+43);
    drawParkBench(x+43,y-42);
    drawParkBench(x-43,y+43);
    drawTownTree(x-54,y+8,1);
    drawTownTree(x+54,y-8,0);
    ctx.fillStyle = "#4b6660";
    ctx.fillRect(x+55,y+19,8,12);
    ctx.fillStyle = "#d7d2bd";
    ctx.fillRect(x+54,y+17,10,3);
    drawTownLamp(x-55,y-10);
    drawTownLamp(x+55,y+10);
    // Placa de identificação da praça.
    ctx.fillStyle = "#51483d";
    ctx.fillRect(x-8,y+64,17,4);
    ctx.fillStyle = "#e8dfc8";
    ctx.fillRect(x-7,y+61,15,3);
  }
  function drawTownLongSidewalk(cameraY, side) {
    // Calçada longitudinal acompanhando a ferrovia, em frente às casas do bairro.
    const start = 5730, end = 7330, step = 18, halfWidth = 7;
    const inner = [], outer = [];
    for (let s = start; s <= end; s += step) {
      const p = trackPoint(s);
      const offset = side * 126;
      const cx = p.x + p.nx * offset;
      const cy = p.y + p.ny * offset - cameraY + H * .56;
      inner.push({x:cx-p.nx*halfWidth,y:cy-p.ny*halfWidth});
      outer.push({x:cx+p.nx*halfWidth,y:cy+p.ny*halfWidth});
    }
    ctx.beginPath();
    ctx.moveTo(inner[0].x, inner[0].y);
    for (const p of inner.slice(1)) ctx.lineTo(p.x,p.y);
    for (let i=outer.length-1;i>=0;i--) ctx.lineTo(outer[i].x,outer[i].y);
    ctx.closePath();
    ctx.fillStyle = "rgba(35,39,35,.25)";
    ctx.translate(0,0);
    ctx.fill();
    ctx.strokeStyle = "#77796f";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Piso claro, placas e juntas transversais.
    ctx.beginPath();
    ctx.moveTo(inner[0].x,inner[0].y);
    for (const p of inner.slice(1)) ctx.lineTo(p.x,p.y);
    for (let i=outer.length-1;i>=0;i--) ctx.lineTo(outer[i].x,outer[i].y);
    ctx.closePath();
    ctx.fillStyle = "#c9c4b3";
    ctx.fill();
    ctx.strokeStyle = "rgba(239,233,218,.75)";
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let s=start+22;s<end;s+=22) {
      const p=trackPoint(s);
      const x=p.x+ p.nx*side*126;
      const y=p.y+ p.ny*side*126-cameraY+H*.56;
      ctx.strokeStyle="rgba(91,91,82,.32)";
      ctx.lineWidth=1;
      ctx.beginPath();
      ctx.moveTo(x-p.nx*halfWidth,y-p.ny*halfWidth);
      ctx.lineTo(x+p.nx*halfWidth,y+p.ny*halfWidth);
      ctx.stroke();
    }
    // Guia tátil discreta junto ao lado voltado para a rua.
    ctx.strokeStyle="#e5dfd0";
    ctx.lineWidth=1.5;
    ctx.beginPath();
    for(let i=0;i<outer.length;i++){const p=outer[i];if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);}
    ctx.stroke();
  }

  function drawTownRegion(cameraY) {
    // Bairro mais povoado: duas fileiras de lotes, comércio, praça e ruas.
    const buildings = [
      // Primeira fileira: casas e lojas próximas às ruas locais.
      {s:5740,side:-1,d:160,v:0,garage:true},{s:5825,side:1,d:175,v:1,garage:true},
      {s:5940,side:-1,d:260,v:2,garage:true},{s:6035,side:1,d:265,v:3,garage:true},
      {s:6160,side:-1,d:165,shop:true,v:0},{s:6285,side:1,d:170,shop:true,v:1},
      {s:6410,side:-1,d:270,v:1,garage:true},{s:6515,side:1,d:260,v:2,garage:true},
      {s:6650,side:-1,d:170,v:3,garage:true},{s:6750,side:1,d:175,v:0,garage:true},
      {s:6900,side:-1,d:260,v:2,garage:true},{s:7010,side:1,d:265,v:1,garage:true},
      {s:7140,side:-1,d:165,v:1,garage:true},{s:7220,side:1,d:175,v:3,garage:true},
      // Casas adicionais para preencher o bairro.
      {s:5850,side:-1,d:175,v:2,garage:true},{s:5915,side:1,d:180,v:3,garage:true},
      {s:6090,side:-1,d:180,v:1,garage:true},{s:6135,side:1,d:185,v:0,garage:true},
      {s:6350,side:-1,d:185,v:0,garage:true},{s:6385,side:1,d:185,v:2,garage:true},
      {s:6580,side:-1,d:180,v:2,garage:true},{s:6615,side:1,d:185,v:3,garage:true},
      {s:6820,side:-1,d:185,v:0,garage:true},{s:6860,side:1,d:185,v:1,garage:true},
      {s:7060,side:-1,d:180,v:3,garage:true},{s:7100,side:1,d:185,v:2,garage:true},
      {s:7270,side:-1,d:185,v:1,garage:true},{s:7310,side:1,d:185,v:0,garage:true},
      // Segunda fileira de casas, dando profundidade ao bairro.
      {s:5790,side:-1,d:315,v:3},{s:5895,side:1,d:320,v:0},
      {s:6060,side:-1,d:320,v:2},{s:6200,side:1,d:320,v:1},
      {s:6440,side:-1,d:325,v:3},{s:6560,side:1,d:325,v:0},
      {s:6780,side:-1,d:320,v:1},{s:6970,side:1,d:325,v:2},
      {s:7180,side:-1,d:320,v:0},{s:7290,side:1,d:320,v:3}
    ];

    // A praça ocupa um lote próprio entre as quadras centrais.
    const parkPoint = worldToScreen(trackPoint(6720), cameraY);
    const parkX = parkPoint.x - 250;
    if (parkPoint.y > -180 && parkPoint.y < H + 180 && parkX > 90 && parkX < W - 90) {
      drawTownPark(parkX, parkPoint.y);
    }

    // Calçadas longitudinais ligam os trechos de passeio entre as casas e as ruas.
    drawTownLongSidewalk(cameraY, -1);
    drawTownLongSidewalk(cameraY, 1);

    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      const p = worldToScreen(trackPoint(b.s), cameraY);
      if (p.y < -180 || p.y > H + 180) continue;
      const x = p.x + b.side * b.d;
      if (x < 75 || x > W - 75) continue;
      if (b.shop) drawTownShop(x, p.y, b.v);
      else drawTownHouse(x, p.y, b.v, !!b.garage);
    }

    // Ruas do bairro e passagem de nível original.
    drawTownRoad(cameraY, 5920, false);
    drawTownRoad(cameraY, 6300, true);
    drawTownRoad(cameraY, 6680, false);

    // Pequenos trechos de calçada conectam as entradas dos lotes às ruas.
    const sidewalks = [
      {s:5800,side:-1,d:110},{s:5900,side:1,d:115},{s:6070,side:-1,d:115},
      {s:6180,side:1,d:115},{s:6420,side:-1,d:115},{s:6540,side:1,d:115},
      {s:6760,side:-1,d:115},{s:6880,side:1,d:115},{s:7080,side:-1,d:115},
      {s:7200,side:1,d:115}
    ];
    for (const item of sidewalks) {
      const p = worldToScreen(trackPoint(item.s), cameraY);
      const x = p.x + item.side * item.d;
      if (p.y < -40 || p.y > H + 40 || x < 10 || x > W - 110) continue;
      ctx.fillStyle = "#c9c4b3";
      ctx.fillRect(x - 24, p.y - 5, 48, 10);
      ctx.fillStyle = "#e3ddcc";
      ctx.fillRect(x - 24, p.y - 5, 48, 2);
    }

    // Árvores, postes e veículos estacionados pelo bairro.
    const props = [
      {s:5780,side:-1,d:72,type:"tree"},{s:5880,side:1,d:82,type:"tree"},
      {s:6000,side:-1,d:92,type:"lamp"},{s:6080,side:1,d:88,type:"tree"},
      {s:6195,side:-1,d:88,type:"car"},{s:6260,side:1,d:88,type:"lamp"},
      {s:6400,side:-1,d:92,type:"tree"},{s:6550,side:1,d:92,type:"car"},
      {s:6630,side:-1,d:86,type:"lamp"},{s:6780,side:1,d:90,type:"tree"},
      {s:6910,side:-1,d:92,type:"car"},{s:7060,side:1,d:90,type:"lamp"},
      {s:7160,side:-1,d:82,type:"tree"},{s:7240,side:1,d:86,type:"tree"},
      {s:5960,side:1,d:335,type:"tree"},{s:6120,side:-1,d:345,type:"tree"},
      {s:6460,side:1,d:345,type:"lamp"},{s:6600,side:-1,d:345,type:"tree"},
      {s:7000,side:-1,d:345,type:"lamp"},{s:7150,side:1,d:345,type:"tree"}
    ];
    for (let i = 0; i < props.length; i++) {
      const item = props[i];
      const p = worldToScreen(trackPoint(item.s), cameraY);
      if (p.y < -100 || p.y > H + 100) continue;
      const x = p.x + item.side * item.d;
      if (x < 18 || x > W - 18) continue;
      if (item.type === "tree") drawTownTree(x,p.y,i);
      else if (item.type === "lamp") drawTownLamp(x,p.y);
      else drawTownCar(x,p.y, i % 2 ? "#b45d45" : "#547b91");
    }
  }

  function drawCherryTree(x, y, variant = 0) {
    // Cerejeira vista de cima, com copa rosa em camadas e tronco discreto.
    ctx.fillStyle = "rgba(55, 48, 49, 0.22)";
    ctx.fillRect(x - 19, y + 13, 40, 8);
    ctx.fillStyle = "#705443";
    ctx.fillRect(x - 3, y + 1, 7, 15);
    ctx.fillStyle = variant % 2 ? "#d987aa" : "#e69abb";
    ctx.fillRect(x - 17, y - 13, 34, 27);
    ctx.fillStyle = variant % 3 ? "#f0b4cb" : "#f4c1d3";
    ctx.fillRect(x - 12, y - 19, 24, 24);
    ctx.fillStyle = "#f8d9e4";
    ctx.fillRect(x - 7, y - 15, 7, 6);
    ctx.fillRect(x + 5, y - 5, 6, 5);
  }

  function drawParkBench(x, y) {
    // Banco de madeira com encosto, visto de cima.
    ctx.fillStyle = "rgba(40, 42, 35, .22)";
    ctx.fillRect(x - 16, y + 5, 34, 5);
    ctx.fillStyle = "#594331";
    ctx.fillRect(x - 14, y - 7, 29, 5);
    ctx.fillStyle = "#a8784d";
    ctx.fillRect(x - 14, y - 1, 29, 8);
    ctx.fillStyle = "#4c392b";
    ctx.fillRect(x - 11, y + 7, 3, 6);
    ctx.fillRect(x + 8, y + 7, 3, 6);
  }

  function drawChalet(x, y, variant = 0) {
    // Chalé de madeira com telhado inclinado estilizado, varanda e janelas.
    const roof = variant % 2 ? "#765044" : "#8a5145";
    ctx.fillStyle = "rgba(40, 42, 35, .25)";
    ctx.fillRect(x - 42, y - 24, 88, 67);
    ctx.fillStyle = "#8d765b";
    ctx.fillRect(x - 36, y - 18, 74, 53);
    ctx.fillStyle = "#c7a77b";
    ctx.fillRect(x - 31, y - 13, 64, 43);
    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.moveTo(x - 43, y - 16);
    ctx.lineTo(x, y - 43);
    ctx.lineTo(x + 45, y - 16);
    ctx.lineTo(x + 37, y + 1);
    ctx.lineTo(x - 36, y + 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#d8b98b";
    ctx.fillRect(x - 7, y + 7, 14, 23);
    ctx.fillStyle = "#9fc4c5";
    ctx.fillRect(x - 25, y + 5, 11, 10);
    ctx.fillRect(x + 14, y + 5, 11, 10);
    ctx.fillStyle = "#76533b";
    ctx.fillRect(x - 22, y + 33, 44, 5);
    ctx.fillRect(x - 17, y + 38, 4, 7);
    ctx.fillRect(x + 13, y + 38, 4, 7);
  }

  function drawCherryGroveRoad(cameraY) {
    // Rua vertical de paralelepípedos ligando o bosque ao bairro urbano.
    const anchor = worldToScreen(trackPoint(7775), cameraY);
    const x = anchor.x - 350;
    const edgeA = 690 - 7380 - cameraY + H * .56;
    const edgeB = 690 - 8170 - cameraY + H * .56;
    const top = Math.min(edgeA, edgeB);
    const bottom = Math.max(edgeA, edgeB);
    const roadWidth = 58;

    // Sombra, calçadas, meio-fios e leito da rua.
    ctx.fillStyle = "rgba(27,31,28,.24)";
    ctx.fillRect(x - 47, top, 94, bottom - top);
    ctx.fillStyle = "#c5c0b1";
    ctx.fillRect(x - 46, top, 92, bottom - top);
    ctx.fillStyle = "#555951";
    ctx.fillRect(x - roadWidth / 2 - 3, top, roadWidth + 6, bottom - top);
    ctx.fillStyle = "#827f73";
    ctx.fillRect(x - roadWidth / 2, top, roadWidth, bottom - top);

    // Pedras em fiadas alternadas, mantendo o desenho da rua vertical.
    const firstRow = Math.floor(7380 / 9);
    const lastRow = Math.ceil(8170 / 9);
    for (let row = firstRow; row <= lastRow; row++) {
      const worldS = row * 9;
      const sy = 690 - worldS - cameraY + H * .56;
      if (sy < top - 10 || sy > bottom + 10) continue;
      const offset = row % 2 ? 7 : 0;
      for (let col = 0; col < 4; col++) {
        const sx = x - roadWidth / 2 + 2 + col * 14 + offset;
        if (sx > x + roadWidth / 2 - 2) continue;
        const colors = ["#999487", "#8d897d", "#a29d8e", "#858276", "#969183"];
        const tone = (row * 7 + col * 11) % colors.length;
        ctx.fillStyle = "rgba(39,42,38,.38)";
        ctx.fillRect(sx + 1, sy + 1, 12, 7);
        ctx.fillStyle = colors[tone];
        ctx.fillRect(sx, sy, 11, 6);
        ctx.fillStyle = "rgba(232,225,207,.22)";
        ctx.fillRect(sx + 1, sy, 8, 1);
      }
    }

    // Guias claras nas bordas e passeios laterais.
    for (const side of [-1, 1]) {
      const curbX = x + side * (roadWidth / 2 + 2);
      ctx.fillStyle = "#555b54";
      ctx.fillRect(curbX - 2, top, 5, bottom - top);
      ctx.fillStyle = "#e0dacb";
      ctx.fillRect(curbX + side * 3, top, 12, bottom - top);
      ctx.fillStyle = "#c2bdae";
      ctx.fillRect(curbX + side * 3, top, 12, bottom - top);
      ctx.fillStyle = "rgba(105,103,91,.32)";
      for (let y = top; y < bottom; y += 24) {
        ctx.fillRect(curbX + side * 3, y, 12, 1);
      }
    }
  }

  function drawCherryGroveOuterSidewalk(cameraY) {
    // Calçada longitudinal no lado oposto do bosque, contornando a fileira externa.
    const anchor = worldToScreen(trackPoint(7775), cameraY);
    const x = anchor.x + 365;
    const edgeA = 690 - 7380 - cameraY + H * .56;
    const edgeB = 690 - 8170 - cameraY + H * .56;
    const top = Math.min(edgeA, edgeB);
    const bottom = Math.max(edgeA, edgeB);

    ctx.fillStyle = "rgba(27,31,28,.2)";
    ctx.fillRect(x - 12, top, 28, bottom - top);
    ctx.fillStyle = "#c5c0b1";
    ctx.fillRect(x - 10, top, 24, bottom - top);
    ctx.fillStyle = "#e2ddcf";
    ctx.fillRect(x - 9, top, 2, bottom - top);
    ctx.fillStyle = "#aaa596";
    for (let y = top + 8; y < bottom; y += 22) {
      ctx.fillRect(x - 9, y, 22, 1);
    }
    ctx.fillStyle = "#77796f";
    ctx.fillRect(x - 12, top, 2, bottom - top);
    ctx.fillRect(x + 14, top, 2, bottom - top);
  }

  function drawCherryFloatingPetals(cameraY) {
    // Pétalas em suspensão: brisa constante e turbulência adicional provocada pelo trem.
    const cameraWorld = cameraY - H * .56;
    const visibleStartS = 690 - (cameraWorld + H);
    const visibleEndS = 690 - cameraWorld;
    if (visibleEndS < 7380 || visibleStartS > 8170) return;

    const t = (state.lastTime || 0) / 1000;
    const trainWake = Math.min(1, state.speed / 55);
    const travel = state.direction === 0 ? 0 : state.direction;
    for (let i = 0; i < 46; i++) {
      const seedX = seeded(i * 17 + 5);
      const seedY = seeded(i * 31 + 9);
      const sway = Math.sin(t * (1.1 + seedX) + i) * (9 + trainWake * 13);
      const driftX = t * (8 + trainWake * 27) * (i % 2 ? 1 : -1);
      const driftY = t * (11 + trainWake * 22) * (travel || 1);
      const x = ((seedX * (W + 36) + driftX + sway + 18) % (W + 36) + (W + 36)) % (W + 36) - 18;
      const y = ((seedY * (H + 36) + driftY + 18) % (H + 36) + (H + 36)) % (H + 36) - 18;
      const size = 2 + seeded(i * 47) * 2.2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(t * 1.7 + i * 2) * .9);
      ctx.fillStyle = i % 4 === 0 ? "rgba(255,226,237,.94)" : "rgba(239,158,190,.9)";
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 1.35, size * .7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawCherryGroveRegion(cameraY) {
    // Bosque muito mais fechado de cerejeiras, com rua vertical e pétalas caídas.
    const cameraWorld = cameraY - H * .56;
    const first = Math.floor((cameraWorld - 180) / 48);
    const last = Math.ceil((cameraWorld + H + 180) / 48);

    // Rua de paralelepípedos no lado esquerdo e calçada externa no lado oposto do bosque.
    drawCherryGroveRoad(cameraY);
    drawCherryGroveOuterSidewalk(cameraY);

    for (let row = first; row <= last; row++) {
      const yWorld = row * 48 + 24;
      const s = 690 - yWorld;
      if (s < 7380 || s > 8170) continue;
      const p = trackPoint(s);
      const y = yWorld - cameraWorld;
      const roadX = p.x - 350;

      for (const side of [-1, 1]) {
        const jitter = seeded(row * 131 + side * 17);
        // Quatro fileiras escalonadas por lado para criar um bosque bem mais abundante.
        const distances = [178, 235, 295, 350];
        for (let layer = 0; layer < distances.length; layer++) {
          const variation = (seeded(row * 197 + side * 31 + layer * 53) - .5) * 34;
          const x = p.x + side * (distances[layer] + variation);
          const probability = layer === 0 ? .96 : layer === 1 ? .92 : layer === 2 ? .86 : .72;
          const allowed = x > 22 && x < W - 22 && Math.abs(x - roadX) > 66;
          if (allowed && seeded(row * 89 + side * 43 + layer * 17) < probability) {
            const offsetY = (seeded(row * 71 + layer * 29 + side) - .5) * 36;
            drawCherryTree(x, y + offsetY, row + layer + side);
          }
        }

        // Tapetes mais densos de pétalas espalhadas entre as árvores.
        const petalX = p.x + side * 125;
        if (petalX > 8 && petalX < W - 8) {
          for (let k = 0; k < 25; k++) {
            const px = petalX + (seeded(row * 43 + k * 19 + side) - .5) * 82;
            const py = y + (seeded(row * 61 + k * 23) - .5) * 72;
            ctx.fillStyle = k % 3 === 0 ? "rgba(255,218,232,.92)" : "rgba(232,145,179,.9)";
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(seeded(row * 71 + k * 13) * Math.PI);
            ctx.fillRect(-2, -1, 4, 2.5);
            ctx.restore();
          }
        }
      }
    }

    drawCherryFloatingPetals(cameraY);
    // Bancos removidos a pedido; permanecem as cerejeiras, calçadas e a rua.
  }

  function drawFinalStationBuilding(x, y, variant = 0) {
    // Prédio amplo da estação, visto de cima, com saguão, cobertura e plataforma de acesso.
    const wall = variant % 2 ? "#d8d0b9" : "#d7c39c";
    const roof = variant % 2 ? "#526b73" : "#8c5546";
    ctx.fillStyle = "rgba(35, 43, 36, .28)";
    ctx.fillRect(x - 65, y - 78, 132, 158);
    ctx.fillStyle = "#a99a7b";
    ctx.fillRect(x - 62, y - 75, 124, 150);
    ctx.fillStyle = wall;
    ctx.fillRect(x - 56, y - 69, 112, 138);
    ctx.fillStyle = roof;
    ctx.fillRect(x - 67, y - 73, 134, 76);
    ctx.fillStyle = variant % 2 ? "#d9c69b" : "#b9c2bd";
    ctx.fillRect(x - 51, y - 63, 102, 8);
    ctx.fillStyle = "#344b50";
    ctx.fillRect(x - 10, y + 8, 20, 48);
    ctx.fillStyle = "#9fc3c7";
    ctx.fillRect(x - 43, y + 9, 19, 17);
    ctx.fillRect(x + 24, y + 9, 19, 17);
    ctx.fillStyle = "#eee4cb";
    ctx.fillRect(x - 47, y - 43, 94, 5);
    ctx.fillStyle = "#6f6554";
    ctx.fillRect(x - 35, y + 60, 70, 8);
    ctx.fillStyle = "#d7c9a8";
    ctx.fillRect(x - 31, y + 68, 4, 9);
    ctx.fillRect(x + 27, y + 68, 4, 9);
  }

  function drawFinalStationRegion(cameraY) {
    // Estação terminal em trecho reto, com dois prédios grandes de cada lado da ferrovia.
    const centerS = 8440;
    const center = worldToScreen(trackPoint(centerS), cameraY);
    if (center.y > -260 && center.y < H + 260) {
      for (const side of [-1, 1]) {
        const platformX = center.x + side * 43;
        ctx.fillStyle = "#aaa18b";
        ctx.fillRect(platformX - 17, center.y - 205, 34, 410);
        ctx.fillStyle = "#d9cba9";
        ctx.fillRect(platformX - 17, center.y - 205, 4, 410);
        ctx.fillStyle = "#766f60";
        for (let y = center.y - 185; y < center.y + 190; y += 34) ctx.fillRect(platformX - 10, y, 20, 2);
      }
    }
    const buildings = [
      {s: 8360, side: -1, d: 220, v: 0},
      {s: 8560, side: -1, d: 235, v: 1},
      {s: 8360, side: 1, d: 220, v: 1},
      {s: 8560, side: 1, d: 235, v: 0}
    ];
    for (const b of buildings) {
      const p = worldToScreen(trackPoint(b.s), cameraY);
      const x = p.x + b.side * b.d;
      if (p.y > -150 && p.y < H + 150 && x > 75 && x < W - 75) drawFinalStationBuilding(x, p.y, b.v);
    }
  }

  function drawBusTerminalBuilding(x, y) {
    // Rodoviária rural com cobertura ampla, saguão e baias para ônibus.
    ctx.fillStyle = "rgba(39, 43, 37, .28)";
    ctx.fillRect(x - 100, y - 75, 204, 154);
    ctx.fillStyle = "#c9b995";
    ctx.fillRect(x - 96, y - 72, 196, 145);
    ctx.fillStyle = "#d9d2bd";
    ctx.fillRect(x - 86, y - 61, 176, 123);
    ctx.fillStyle = "#49636b";
    ctx.fillRect(x - 91, y - 66, 186, 48);
    ctx.fillStyle = "#e0c99c";
    ctx.fillRect(x - 80, y - 57, 164, 7);
    ctx.fillStyle = "#394b4c";
    ctx.fillRect(x - 22, y + 3, 44, 59);
    ctx.fillStyle = "#9fc4c5";
    ctx.fillRect(x - 72, y - 7, 34, 28);
    ctx.fillRect(x + 38, y - 7, 34, 28);
    for (let i = 0; i < 2; i++) {
      const bx = x + 112 + i * 39;
      ctx.fillStyle = "#6f776e";
      ctx.fillRect(bx - 15, y - 67, 30, 137);
      ctx.fillStyle = i ? "#d9b34f" : "#4d8290";
      ctx.fillRect(bx - 11, y - 55, 22, 112);
      ctx.fillStyle = "#263d45";
      for (let wy = -43; wy <= 30; wy += 19) ctx.fillRect(bx - 9, y + wy, 18, 10);
      ctx.fillStyle = "#e8e0c9";
      ctx.fillRect(bx - 11, y - 57, 22, 5);
    }
  }

  function drawBusTerminalRegion(cameraY) {
    // Estrada de chão horizontal atravessando a área da rodoviária.
    const road = worldToScreen(trackPoint(9460), cameraY);
    if (road.y > -90 && road.y < H + 90) {
      ctx.fillStyle = "#8b7655";
      ctx.fillRect(0, road.y - 38, W, 76);
      ctx.fillStyle = "#b39a70";
      ctx.fillRect(0, road.y - 38, W, 6);
      ctx.fillRect(0, road.y + 32, W, 6);
      ctx.fillStyle = "rgba(226, 207, 165, .55)";
      for (let x = 20; x < W; x += 82) ctx.fillRect(x, road.y - 2, 42, 4);
      ctx.fillStyle = "rgba(91, 73, 49, .28)";
      ctx.fillRect(0, road.y - 17, W, 3);
      ctx.fillRect(0, road.y + 14, W, 3);
    }
    const terminal = worldToScreen(trackPoint(9600), cameraY);
    const terminalX = terminal.x - 225;
    if (terminal.y > -180 && terminal.y < H + 180 && terminalX > 120 && terminalX < W - 180) {
      drawBusTerminalBuilding(terminalX, terminal.y);
    }
  }

  function drawRiverLakeRegion(cameraY) {
    // Rio transversal ao vale, com margens irregulares, leito profundo e correnteza para a direita.
    const riverS = 3468;
    const riverPoint = trackPoint(riverS);
    const riverY = worldToScreen({ x: 0, y: riverPoint.y }, cameraY).y;
    const t = (state.lastTime || 0) * 0.001;
    const flow = (t * 58) % 96;

    // Margem de terra úmida e barrancos com recortes naturais.
    ctx.fillStyle = "#756b4d";
    ctx.beginPath();
    ctx.moveTo(0, riverY - 105);
    for (let x = 0; x <= W; x += 24) {
      const edge = Math.sin(x * .021) * 8 + Math.sin(x * .057) * 4;
      ctx.lineTo(x, riverY - 70 + edge);
    }
    for (let x = W; x >= 0; x -= 24) {
      const edge = Math.sin(x * .018 + 1.2) * 10 + Math.sin(x * .049) * 4;
      ctx.lineTo(x, riverY + 76 + edge);
    }
    ctx.closePath();
    ctx.fill();

    // Faixa de areia, cascalho e terra exposta nas duas margens.
    for (let x = 8; x < W; x += 43) {
      const wobble = Math.sin(x * .13) * 5;
      ctx.fillStyle = x % 3 ? "#a99a70" : "#c0ad7d";
      ctx.beginPath();
      ctx.ellipse(x, riverY - 66 + wobble, 9 + (x % 4), 3.2, -.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 19, riverY + 69 - wobble, 7 + (x % 3), 2.8, .1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Água em camadas: borda rasa turquesa, corpo azul e canal central mais escuro.
    ctx.fillStyle = "#4d9b9d";
    ctx.beginPath();
    ctx.moveTo(0, riverY - 72);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, riverY - 59 + Math.sin(x * .018) * 8 + Math.sin(x * .043) * 3);
    for (let x = W; x >= 0; x -= 20) ctx.lineTo(x, riverY + 61 + Math.sin(x * .016 + 1.4) * 9 + Math.sin(x * .039) * 3);
    ctx.closePath();
    ctx.fill();

    const waterGradient = ctx.createLinearGradient(0, riverY - 54, 0, riverY + 56);
    waterGradient.addColorStop(0, "#438e9e");
    waterGradient.addColorStop(.34, "#28758e");
    waterGradient.addColorStop(.72, "#24647f");
    waterGradient.addColorStop(1, "#397f91");
    ctx.fillStyle = waterGradient;
    ctx.beginPath();
    ctx.moveTo(0, riverY - 58);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, riverY - 49 + Math.sin(x * .018) * 8 + Math.sin(x * .043) * 3);
    for (let x = W; x >= 0; x -= 20) ctx.lineTo(x, riverY + 51 + Math.sin(x * .016 + 1.4) * 9 + Math.sin(x * .039) * 3);
    ctx.closePath();
    ctx.fill();

    // Faixas de correnteza: cada segmento avança continuamente da esquerda para a direita.
    for (let row = 0; row < 9; row++) {
      const y = riverY - 42 + row * 10 + Math.sin(row * 1.7) * 3;
      const offset = (flow + row * 17) % 112;
      for (let n = -1; n < 9; n++) {
        const x = n * 112 + offset;
        const length = 22 + ((row * 13 + n * 7 + 300) % 34);
        ctx.strokeStyle = row % 3 === 0 ? "rgba(188,232,222,.48)" : "rgba(116,194,195,.32)";
        ctx.lineWidth = row % 3 === 0 ? 2 : 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y + Math.sin((x + t * 28) * .035) * 1.8);
        ctx.quadraticCurveTo(x + length * .48, y - 1.5, x + length, y + Math.sin((x + length) * .025) * 1.4);
        ctx.stroke();
      }
    }

    // Pequenas ondulações e espuma junto às pedras das margens.
    for (let i = 0; i < 18; i++) {
      const x = (i * 53 + flow * .72) % (W + 35) - 15;
      const y = riverY + Math.sin(i * 2.4) * 48;
      ctx.strokeStyle = "rgba(205,235,220,.42)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 3 + (i % 3), .15, Math.PI * .9);
      ctx.stroke();
    }

    // Deck de madeira na margem, com dois pescadores voltados para a correnteza.
    const dockX = 112;
    const dockY = riverY + 35;
    ctx.fillStyle = "rgba(22,34,30,.32)";
    ctx.beginPath();
    ctx.ellipse(dockX + 83, dockY + 31, 91, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    // Estrutura elevada, suportes e tábuas individuais.
    ctx.fillStyle = "#514332";
    ctx.fillRect(dockX + 8, dockY + 12, 150, 9);
    ctx.fillRect(dockX + 15, dockY + 51, 7, 17);
    ctx.fillRect(dockX + 145, dockY + 51, 7, 17);
    ctx.fillStyle = "#956d45";
    ctx.beginPath();
    ctx.moveTo(dockX, dockY + 3);
    ctx.lineTo(dockX + 166, dockY + 3);
    ctx.lineTo(dockX + 153, dockY + 53);
    ctx.lineTo(dockX + 12, dockY + 53);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 7; i++) {
      const yy = dockY + 8 + i * 6;
      ctx.strokeStyle = i % 2 ? "#c49a65" : "#6e5138";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dockX + 5 + i * .8, yy);
      ctx.lineTo(dockX + 161 - i * .8, yy);
      ctx.stroke();
      ctx.fillStyle = "rgba(42,32,23,.35)";
      ctx.fillRect(dockX + 28, yy + 2, 2, 2);
      ctx.fillRect(dockX + 126, yy + 2, 2, 2);
    }
    // Dois pescadores com roupas diferentes, chapéus, braços e varas lançadas sobre a água.
    const anglers = [
      {x:dockX+49, y:dockY+26, shirt:"#d5a34f", pants:"#354b50", hat:"#59452f", rod:-24},
      {x:dockX+112, y:dockY+27, shirt:"#668b70", pants:"#39434a", hat:"#b18a50", rod:18}
    ];
    for (const person of anglers) {
      ctx.save();
      ctx.translate(person.x, person.y);
      // Sombra dos pés sobre as tábuas.
      ctx.fillStyle = "rgba(31,29,23,.3)";
      ctx.beginPath(); ctx.ellipse(0,17,9,3,0,0,Math.PI*2); ctx.fill();
      // Pernas e botas.
      ctx.strokeStyle = person.pants; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-3,7); ctx.lineTo(-5,16); ctx.moveTo(3,7); ctx.lineTo(5,16); ctx.stroke();
      ctx.fillStyle = "#302f2a";
      ctx.fillRect(-8,15,6,3); ctx.fillRect(3,15,6,3);
      // Tronco e cabeça.
      ctx.fillStyle = person.shirt;
      ctx.beginPath(); ctx.roundRect(-7,-5,14,14,3); ctx.fill();
      ctx.fillStyle = "#c58e68";
      ctx.beginPath(); ctx.arc(0,-11,5,0,Math.PI*2); ctx.fill();
      // Chapéu de pescador.
      ctx.fillStyle = person.hat;
      ctx.beginPath(); ctx.ellipse(0,-15,8,2.5,0,0,Math.PI*2); ctx.fill();
      ctx.fillRect(-5,-19,10,4);
      // Braço estendido segurando a vara.
      ctx.strokeStyle = person.shirt; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(4,-1); ctx.lineTo(10,-6); ctx.stroke();
      const tipX = person.rod;
      const tipY = -48;
      ctx.strokeStyle = "#493b2c"; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(8,-6); ctx.quadraticCurveTo(tipX*.45,-28,tipX,tipY); ctx.stroke();
      ctx.strokeStyle = "rgba(225,235,218,.8)"; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.moveTo(tipX,tipY); ctx.lineTo(tipX+7,tipY+34); ctx.stroke();
      ctx.restore();
    }
    // Pequenas boias sobre a água, alinhadas às linhas de pesca.
    ctx.fillStyle = "#e9d5a0";
    ctx.beginPath(); ctx.ellipse(dockX+56,riverY+7,2,4,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(dockX+130,riverY+15,2,4,0,0,Math.PI*2); ctx.fill();
  }

  function drawBridge(cameraY) {
    // Ponte ferroviária reforçada; usa o traçado original sem deslocar trilhos ou composição.
    const centerS = 3468;
    const a = trackPoint(centerS - 88);
    const b = trackPoint(centerS + 88);
    const corners = [
      { x: a.x + a.nx * 34, y: a.y + a.ny * 34 },
      { x: b.x + b.nx * 34, y: b.y + b.ny * 34 },
      { x: b.x - b.nx * 34, y: b.y - b.ny * 34 },
      { x: a.x - a.nx * 34, y: a.y - a.ny * 34 }
    ].map(p => worldToScreen(p, cameraY));

    const polygon = (points, fill) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
      ctx.fill();
    };

    // Sombra projetada e maciço inferior da estrutura.
    polygon(corners.map(p => ({x:p.x+7,y:p.y+9})), "rgba(24,35,34,.38)");
    polygon(corners, "#39494a");

    // Longarinas laterais em aço escuro e faces superiores iluminadas.
    for (const side of [-1, 1]) {
      const p1 = worldToScreen({x:a.x+a.nx*side*34,y:a.y+a.ny*side*34},cameraY);
      const p2 = worldToScreen({x:b.x+b.nx*side*34,y:b.y+b.ny*side*34},cameraY);
      ctx.strokeStyle = "#293b40"; ctx.lineWidth = 8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.stroke();
      ctx.strokeStyle = "#82908a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p1.x+side*2,p1.y); ctx.lineTo(p2.x+side*2,p2.y); ctx.stroke();
    }

    // Piso de concreto/aço com placas e juntas regulares.
    const deck = corners.map((p,i) => ({x:p.x+(i===0||i===3?5:-5),y:p.y}));
    polygon(deck, "#77796f");
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const left = {x:corners[0].x+(corners[1].x-corners[0].x)*t,y:corners[0].y+(corners[1].y-corners[0].y)*t};
      const right = {x:corners[3].x+(corners[2].x-corners[3].x)*t,y:corners[3].y+(corners[2].y-corners[3].y)*t};
      ctx.strokeStyle = i % 2 ? "rgba(31,43,43,.35)" : "rgba(208,196,164,.28)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(left.x,left.y); ctx.lineTo(right.x,right.y); ctx.stroke();
    }

    // Vigas transversais aparentes sob o tabuleiro.
    for (const s of [centerS-72,centerS-36,centerS,centerS+36,centerS+72]) {
      const p = worldToScreen(trackPoint(s),cameraY);
      ctx.fillStyle = "#344448";
      ctx.fillRect(p.x-43,p.y-7,86,14);
      ctx.fillStyle = "#a2a092";
      ctx.fillRect(p.x-39,p.y-6,78,2);
      ctx.fillStyle = "rgba(20,29,30,.35)";
      ctx.fillRect(p.x-43,p.y+5,86,3);
    }

    // Pilares de sustentação descendo até o leito, fora da faixa dos trilhos.
    for (const side of [-1,1]) {
      const p = worldToScreen({x:a.x+a.nx*side*27,y:a.y+a.ny*side*27},cameraY);
      ctx.fillStyle = "#59615b";
      ctx.beginPath();
      ctx.moveTo(p.x-8,p.y-5); ctx.lineTo(p.x+8,p.y-5);
      ctx.lineTo(p.x+12,p.y+70); ctx.lineTo(p.x-12,p.y+70);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#85877b";
      ctx.fillRect(p.x-6,p.y+2,4,59);
      ctx.fillStyle = "#343f40";
      ctx.fillRect(p.x-15,p.y+66,30,7);
    }

    // Guarda-corpos metálicos, montantes e refletores de manutenção.
    for (const side of [-1,1]) {
      const p1 = worldToScreen({x:a.x+a.nx*side*31,y:a.y+a.ny*side*31},cameraY);
      const p2 = worldToScreen({x:b.x+b.nx*side*31,y:b.y+b.ny*side*31},cameraY);
      ctx.strokeStyle = "#c0bca8"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(p1.x,p1.y-8); ctx.lineTo(p2.x,p2.y-8); ctx.stroke();
      ctx.strokeStyle = "#424e4d"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p1.x,p1.y-15); ctx.lineTo(p2.x,p2.y-15); ctx.stroke();
      for (let i=0;i<=8;i++) {
        const t=i/8, x=p1.x+(p2.x-p1.x)*t, y=p1.y+(p2.y-p1.y)*t;
        ctx.fillStyle="#59635e"; ctx.fillRect(x-1.5,y-15,3,16);
      }
    }
  }

  function drawInitialGrassTuft(x, y, variant = 0) {
    // Pequenas touceiras para quebrar a repetição do gramado sem poluir a cena.
    const shade = variant % 2 ? "#527a45" : "#5d8549";
    ctx.fillStyle = "rgba(38, 59, 35, 0.18)";
    ctx.fillRect(x - 5, y + 3, 13, 3);
    ctx.fillStyle = shade;
    ctx.fillRect(x - 4, y - 1, 2, 5);
    ctx.fillRect(x, y - 4, 2, 8);
    ctx.fillRect(x + 4, y, 2, 4);
    ctx.fillStyle = "#a0b96a";
    ctx.fillRect(x, y - 3, 2, 3);
  }

  function drawScenery(cameraY) {
    // Vegetação própria do trecho inicial, posicionada em coordenadas do percurso.
    // Mantém árvores e arbustos visíveis dos dois lados sem invadir os trilhos.
    for (let s = 90; s <= 1810; s += 105) {
      const p = worldToScreen(trackPoint(s), cameraY);
      if (p.y < -100 || p.y > H + 100) continue;

      for (const side of [-1, 1]) {
        const variation = seeded(s * 3 + side * 71);
        const baseDistance = 150 + variation * 45;
        const treeX = p.x + side * baseDistance;
        const treeY = p.y + (seeded(s + side * 113) - 0.5) * 42;
        if (treeX > 24 && treeX < W - 24) {
          drawTree(treeX, treeY, Math.floor(s + side));
        }

        const secondDistance = 235 + seeded(s * 7 + side * 29) * 55;
        const secondX = p.x + side * secondDistance;
        const secondY = p.y + (seeded(s * 11 + side * 37) - 0.5) * 58;
        if (secondX > 20 && secondX < W - 20) {
          drawTree(secondX, secondY, Math.floor(s + side + 5));
        }

        const shrubX = p.x + side * (105 + seeded(s * 13 + side * 43) * 25);
        const shrubY = p.y + 35 + seeded(s * 17 + side * 53) * 28;
        if (shrubX > 12 && shrubX < W - 12) {
          drawForestShrub(shrubX, shrubY, Math.floor(s + side));
        }

        // Touceiras intermediárias criam uma transição mais natural entre grama e árvores.
        for (let tuft = 0; tuft < 2; tuft++) {
          const distance = 72 + seeded(s * 19 + side * 31 + tuft * 13) * 58;
          const tuftX = p.x + side * distance;
          const tuftY = p.y + (seeded(s * 23 + side * 47 + tuft * 17) - 0.5) * 76;
          if (Math.abs(tuftX - p.x) > 66 && tuftX > 8 && tuftX < W - 8) {
            drawInitialGrassTuft(tuftX, tuftY, Math.floor(s + tuft));
          }
        }
      }
    }
  }


  function drawRock(x, y, variant = 0) {
    // Pedras pequenas em pixel art, com sombra e faces iluminadas.
    const size = 0.72 + (Math.abs(variant) % 4) * 0.16;
    const w = 5.5 * size, h = 3.8 * size;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(25, 39, 24, .28)";
    ctx.beginPath(); ctx.ellipse(2, h + 2, w + 2, h * .62, -.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ["#686b5c", "#77796a", "#817d70", "#656f68"][Math.abs(variant) % 4];
    ctx.beginPath();
    ctx.moveTo(-w, 1); ctx.lineTo(-w * .58, -h * .72); ctx.lineTo(w * .18, -h);
    ctx.lineTo(w, -h * .25); ctx.lineTo(w * .72, h * .62); ctx.lineTo(-w * .55, h * .72);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(220, 218, 190, .48)";
    ctx.beginPath(); ctx.moveTo(-w * .58, -h * .72); ctx.lineTo(w * .18, -h);
    ctx.lineTo(w * .48, -h * .34); ctx.lineTo(-w * .25, -h * .18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(42, 52, 43, .28)";
    ctx.fillRect(-w * .25, h * .2, w * .9, Math.max(1, h * .22));
    ctx.restore();
  }

  function drawSmallPlant(x, y, variant = 0) {
    // Plantas baixas com folhas em direções variadas e brilho discreto.
    const tone = Math.abs(variant) % 3;
    const greens = ["#5e913f", "#6c9c45", "#789f4d"];
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "rgba(31, 54, 28, .22)";
    ctx.beginPath(); ctx.ellipse(1, 4, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = greens[tone]; ctx.lineWidth = 2; ctx.lineCap = "round";
    const leaves = [[-5, 1, -8, -5], [-2, 1, -3, -8], [1, 1, 4, -7], [3, 2, 8, -4]];
    for (const leaf of leaves) {
      ctx.beginPath(); ctx.moveTo(0, 3);
      ctx.quadraticCurveTo(leaf[0], leaf[1], leaf[2], leaf[3]); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(190, 220, 128, .72)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-2, 1); ctx.lineTo(-3, -6); ctx.moveTo(3, 2); ctx.lineTo(7, -3); ctx.stroke();
    if (variant % 5 === 0) { ctx.fillStyle = "#e6d17b"; ctx.fillRect(-1, -9, 3, 3); }
    ctx.restore();
  }

  function drawGroundDetails(cameraY) {
    // Detalhes decorativos em áreas verdes; posições determinísticas para não piscar.
    const cameraWorld = cameraY - H * .56;
    const first = Math.floor((cameraWorld - 130) / 76);
    const last = Math.ceil((cameraWorld + H + 130) / 76);
    for (let row = first; row <= last; row++) {
      const worldY = row * 76 + 38;
      const s = 690 - worldY;
      const inOpeningField = s >= 110 && s <= 1760;
      const inFlowerField = s >= 3780 && s <= 5650;
      const inForestEdge = s >= 3146 && s <= 3400;
      if (!inOpeningField && !inFlowerField && !inForestEdge) continue;
      const p = trackPoint(s), screenY = worldY - cameraWorld;
      for (const side of [-1, 1]) {
        const seed = row * 313 + side * 977;
        const distance = 88 + seeded(seed + 3) * 132;
        const x = p.x + side * distance + (seeded(seed + 5) - .5) * 25;
        const y = screenY + (seeded(seed + 7) - .5) * 42;
        if (x < 12 || x > W - 12 || Math.abs(x - p.x) < 78) continue;
        if (seeded(seed + 11) > .46) drawRock(x, y, Math.floor(seed + 13));
        if (seeded(seed + 17) > .25) {
          const plantX = x + side * (10 + seeded(seed + 19) * 18);
          const plantY = y + 8 + seeded(seed + 23) * 13;
          if (plantX > 10 && plantX < W - 10) drawSmallPlant(plantX, plantY, Math.floor(seed + 29));
        }
      }
    }
  }

  function drawRails(cameraY) {
    const trainS = START_S + state.trackOffset;
    const start = Math.max(0, trainS - 500);
    const end = Math.min(START_S + TRACK_LENGTH + 700, trainS + 700);

    // Lastro: camadas suaves acompanham exatamente o eixo ferroviário existente.
    // A geometria do traçado e os pontos de referência não são modificados.
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const drawBed = (width, color) => {
      ctx.beginPath();
      for (let s = start; s <= end; s += 5) {
        const q = worldToScreen(trackPoint(s), cameraY);
        if (s === start) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    };
    drawBed(46, "rgba(28, 31, 27, .20)");
    drawBed(42, "#756b58");
    drawBed(37, "#91846b");
    drawBed(31, "#a09378");

    // Textura discreta de brita, distribuída ao redor do eixo sem invadir os trilhos.
    const firstGravelS = Math.ceil(start / 13) * 13;
    for (let s = firstGravelS; s <= end; s += 13) {
      const p = trackPoint(s);
      const q = worldToScreen(p, cameraY);
      for (const side of [-1, 1]) {
        const seed = Math.floor(s * .73 + (side + 2) * 41);
        const lateral = side * (16 + ((seed * 17) % 9));
        const along = ((seed * 7) % 7) - 3;
        const x = q.x + p.nx * lateral + p.tx * along;
        const y = q.y + p.ny * lateral + p.ty * along;
        ctx.fillStyle = seed % 3 === 0 ? "rgba(224,211,181,.48)" : "rgba(48,48,40,.24)";
        ctx.beginPath();
        ctx.ellipse(x, y, 1.5 + (seed % 2) * .5, 1, Math.atan2(p.ty,p.tx), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Dormentes de madeira: corpo facetado, bordas suavizadas e veio discreto.
    const firstSleeperS = Math.ceil(start / 18) * 18;
    for (let s = firstSleeperS; s <= end; s += 18) {
      const p = trackPoint(s);
      const q = worldToScreen(p, cameraY);
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(Math.atan2(p.ty, p.tx) + Math.PI / 2);

      ctx.fillStyle = "rgba(20, 20, 16, .30)";
      ctx.beginPath();
      ctx.roundRect(-24, -4, 48, 9, 2);
      ctx.fill();

      const wood = ctx.createLinearGradient(0, -4, 0, 4);
      wood.addColorStop(0, "#493a2c");
      wood.addColorStop(.24, "#806044");
      wood.addColorStop(.68, "#684d37");
      wood.addColorStop(1, "#3d3329");
      ctx.fillStyle = wood;
      ctx.beginPath();
      ctx.roundRect(-23, -4, 46, 8, 1.8);
      ctx.fill();

      ctx.strokeStyle = "rgba(205, 165, 111, .48)";
      ctx.lineWidth = .7;
      ctx.beginPath();
      ctx.moveTo(-19, -2.5);
      ctx.lineTo(19, -2.5);
      ctx.moveTo(-15, 1.5);
      ctx.lineTo(15, 1.5);
      ctx.stroke();
      ctx.strokeStyle = "rgba(24, 24, 20, .45)";
      ctx.beginPath();
      ctx.moveTo(-20, 3);
      ctx.lineTo(20, 3);
      ctx.stroke();

      // Placas metálicas e grampos de fixação em cada apoio do trilho.
      for (const side of [-1, 1]) {
        const x = side * 11;
        ctx.fillStyle = "#303a39";
        ctx.beginPath();
        ctx.roundRect(x - 3.8, -3.3, 7.6, 6.6, 1);
        ctx.fill();
        const plate = ctx.createLinearGradient(x - 3, -3, x + 3, 3);
        plate.addColorStop(0, "#c0c4b9");
        plate.addColorStop(.45, "#737e79");
        plate.addColorStop(1, "#394542");
        ctx.fillStyle = plate;
        ctx.beginPath();
        ctx.roundRect(x - 3, -2.5, 6, 5, .8);
        ctx.fill();
        ctx.fillStyle = "#d7d5c8";
        ctx.fillRect(x - 2, -2, 1.2, 1.2);
        ctx.fillRect(x + 1, 1, 1.2, 1.2);
        ctx.strokeStyle = "#252d2c";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x - 2.2, -1.5);
        ctx.lineTo(x - 1.2, -2.7);
        ctx.moveTo(x + 2.2, 1.5);
        ctx.lineTo(x + 1.2, 2.7);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Trilhos: sombra, alma escura, patim e boleto com reflexo longitudinal.
    for (const side of [-1, 1]) {
      const railPath = (offset) => {
        ctx.beginPath();
        for (let s = start; s <= end; s += 5) {
          const p = trackPoint(s);
          const q = worldToScreen({
            x: p.x + p.nx * side * offset,
            y: p.y + p.ny * side * offset
          }, cameraY);
          if (s === start) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y);
        }
      };

      railPath(11);
      ctx.strokeStyle = "rgba(17, 22, 22, .55)";
      ctx.lineWidth = 8;
      ctx.stroke();

      railPath(11);
      ctx.strokeStyle = "#303b3d";
      ctx.lineWidth = 6;
      ctx.stroke();

      railPath(11);
      const steel = ctx.createLinearGradient(0, 0, 0, 1);
      steel.addColorStop(0, "#e0e2d9");
      steel.addColorStop(.24, "#aeb8b4");
      steel.addColorStop(.62, "#737f7d");
      steel.addColorStop(1, "#394647");
      ctx.strokeStyle = steel;
      ctx.lineWidth = 3.4;
      ctx.stroke();

      railPath(11);
      ctx.strokeStyle = "rgba(255,255,245,.72)";
      ctx.lineWidth = .85;
      ctx.stroke();
    }
  }

  function drawWagon(s, index, cameraY) {
    const p = trackPoint(s);
    const q = worldToScreen(p, cameraY);
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.rotate(Math.atan2(p.ty, p.tx) + Math.PI / 2 + (state.direction < 0 ? Math.PI : 0));

    // Sombra e chassi: mantém a mesma área visual e o mesmo centro do vagão.
    ctx.fillStyle = "rgba(7, 15, 17, .34)";
    ctx.beginPath();
    ctx.roundRect(-16, -22, 33, 47, 4);
    ctx.fill();

    const chassis = ctx.createLinearGradient(-15, 0, 15, 0);
    chassis.addColorStop(0, "#172124");
    chassis.addColorStop(.5, "#46504e");
    chassis.addColorStop(1, "#182124");
    ctx.fillStyle = chassis;
    ctx.beginPath();
    ctx.roundRect(-15, -23, 30, 46, 3);
    ctx.fill();

    // Truques, rodas e caixas de rolamento nas duas extremidades.
    for (const y of [-16, 15]) {
      ctx.fillStyle = "#11191b";
      ctx.beginPath();
      ctx.roundRect(-16, y - 4, 32, 9, 2);
      ctx.fill();
      for (const x of [-14, 14]) {
        ctx.fillStyle = "#090f11";
        ctx.beginPath();
        ctx.arc(x, y, 3.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#78827d";
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#c0c4b8";
        ctx.fillRect(x - .55, y - .55, 1.1, 1.1);
      }
      ctx.fillStyle = "#8b9388";
      ctx.fillRect(-10, y - 1, 20, 2);
    }

    // Laterais azuis com facetas de luz e sombra.
    const side = ctx.createLinearGradient(-14, 0, 14, 0);
    side.addColorStop(0, "#19394e");
    side.addColorStop(.16, "#315f7a");
    side.addColorStop(.52, index % 2 ? "#477d98" : "#3e718d");
    side.addColorStop(.86, "#2b5871");
    side.addColorStop(1, "#17364a");
    ctx.fillStyle = side;
    ctx.beginPath();
    ctx.moveTo(-12, -22);
    ctx.lineTo(12, -22);
    ctx.lineTo(14, -18);
    ctx.lineTo(14, 18);
    ctx.lineTo(11, 22);
    ctx.lineTo(-11, 22);
    ctx.lineTo(-14, 18);
    ctx.lineTo(-14, -18);
    ctx.closePath();
    ctx.fill();

    // Filetes de acabamento nas bordas externas.
    ctx.strokeStyle = "rgba(190, 220, 226, .58)";
    ctx.lineWidth = .8;
    ctx.beginPath();
    ctx.moveTo(-11, -20.5);
    ctx.lineTo(10, -20.5);
    ctx.lineTo(12.5, -17);
    ctx.lineTo(12.5, 17);
    ctx.stroke();
    ctx.strokeStyle = "rgba(9, 25, 34, .72)";
    ctx.beginPath();
    ctx.moveTo(-13, -17);
    ctx.lineTo(-13, 17);
    ctx.lineTo(-10, 20);
    ctx.lineTo(10, 20);
    ctx.stroke();

    // Teto central em painéis, com relevo discreto e corredor longitudinal.
    const roof = ctx.createLinearGradient(-10, 0, 10, 0);
    roof.addColorStop(0, "#8e9b9b");
    roof.addColorStop(.18, "#d4d4c7");
    roof.addColorStop(.52, "#eee9d8");
    roof.addColorStop(.84, "#c4c5b9");
    roof.addColorStop(1, "#747f80");
    ctx.fillStyle = roof;
    ctx.beginPath();
    ctx.roundRect(-9.5, -18, 19, 36, 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,245,.72)";
    ctx.lineWidth = .7;
    ctx.beginPath();
    ctx.moveTo(-7, -16);
    ctx.lineTo(-7, 16);
    ctx.moveTo(7, -16);
    ctx.lineTo(7, 16);
    ctx.stroke();

    // Painéis e grelhas do teto: pequenos detalhes técnicos vistos de cima.
    for (const y of [-13, -5, 5, 13]) {
      ctx.fillStyle = "rgba(82, 94, 91, .42)";
      ctx.fillRect(-5.5, y - 1.4, 11, 2.8);
      ctx.fillStyle = "rgba(255,255,245,.52)";
      ctx.fillRect(-4.5, y - 1, 9, .65);
      ctx.strokeStyle = "rgba(72, 82, 79, .48)";
      ctx.lineWidth = .55;
      ctx.beginPath();
      ctx.moveTo(-3.5, y);
      ctx.lineTo(3.5, y);
      ctx.stroke();
    }

    // Fileiras de janelas laterais com moldura, vidro e reflexo.
    for (let wy = -14; wy <= 10; wy += 8) {
      for (const x of [-11.8, 7.8]) {
        ctx.fillStyle = "#152b36";
        ctx.beginPath();
        ctx.roundRect(x - .4, wy - .5, 4.5, 6.5, .8);
        ctx.fill();
        const glass = ctx.createLinearGradient(x, wy, x + 3, wy + 6);
        glass.addColorStop(0, "#d2e7e1");
        glass.addColorStop(.42, "#80b8c4");
        glass.addColorStop(1, "#315968");
        ctx.fillStyle = glass;
        ctx.beginPath();
        ctx.roundRect(x, wy, 3.2, 5.2, .5);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.58)";
        ctx.fillRect(x + .5, wy + .5, .8, 2.4);
      }
    }

    // Faixas de identificação nas cabeceiras e detalhes de engate.
    const trim = ctx.createLinearGradient(-12, 0, 12, 0);
    trim.addColorStop(0, "#743a32");
    trim.addColorStop(.5, "#d16a4f");
    trim.addColorStop(1, "#71372f");
    ctx.fillStyle = trim;
    ctx.fillRect(-12, -22, 24, 2.4);
    ctx.fillRect(-12, 19.6, 24, 2.4);
    ctx.fillStyle = "#d9c18a";
    ctx.fillRect(-8, -21, 16, .7);
    ctx.fillRect(-8, 20.3, 16, .7);

    // Engates centrais visíveis na vista superior, com haste, cabeça e pino metálico.
    for (const end of [-1, 1]) {
      const y0 = end * 21;
      const y1 = end * 27;
      ctx.strokeStyle = "rgba(0,0,0,.48)";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(0, y1);
      ctx.stroke();
      ctx.strokeStyle = "#303a39";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(0, y1);
      ctx.stroke();
      ctx.fillStyle = "#aeb5aa";
      ctx.beginPath();
      ctx.roundRect(-2.2, y1 - end * 1.8, 4.4, 3.6, 1);
      ctx.fill();
      ctx.fillStyle = "#e0d9c5";
      ctx.fillRect(-.65, y1 - end * 1.2, 1.3, 1.5);
    }

    ctx.restore();
  }

  function drawLocomotive(s, cameraY) {
    const p = trackPoint(s);
    const q = worldToScreen(p, cameraY);
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.rotate(Math.atan2(p.ty, p.tx) + Math.PI / 2 + (state.direction < 0 ? Math.PI : 0));

    // Silhueta e chassi: mesmas dimensões e mesmo ponto de ancoragem do modelo original.
    ctx.fillStyle = "rgba(8, 17, 15, .38)";
    ctx.beginPath();
    ctx.roundRect(-17, -28, 36, 64, 5);
    ctx.fill();

    // Estrutura inferior e truques, com volumes separados para leitura mecânica.
    const under = ctx.createLinearGradient(-16, 0, 16, 0);
    under.addColorStop(0, "#171f20");
    under.addColorStop(.48, "#46504d");
    under.addColorStop(1, "#171f20");
    ctx.fillStyle = under;
    ctx.beginPath();
    ctx.roundRect(-16, -30, 32, 64, 4);
    ctx.fill();

    ctx.fillStyle = "#11191a";
    ctx.fillRect(-17, -24, 34, 10);
    ctx.fillRect(-17, 12, 34, 12);
    ctx.fillStyle = "#59615b";
    ctx.fillRect(-15, -22, 30, 2);
    ctx.fillRect(-15, 20, 30, 2);

    // Rodados laterais: rodas, eixos e caixas de rolamento.
    for (const y of [-19, 17]) {
      for (const x of [-15, 15]) {
        ctx.fillStyle = "#101718";
        ctx.beginPath();
        ctx.roundRect(x - 2.5, y - 5, 5, 10, 1.5);
        ctx.fill();
        ctx.fillStyle = "#737b75";
        ctx.fillRect(x - 1.5, y - 3, 3, 6);
        ctx.fillStyle = "#b1b5a9";
        ctx.fillRect(x - .7, y - 2, 1.4, 4);
      }
    }
    ctx.fillStyle = "#8b9389";
    ctx.fillRect(-11, -17, 22, 2);
    ctx.fillRect(-11, 16, 22, 2);

    // Carenagem diesel principal: contorno facetado e sombreado lateral.
    const shell = ctx.createLinearGradient(-14, 0, 14, 0);
    shell.addColorStop(0, "#7f302b");
    shell.addColorStop(.16, "#b94437");
    shell.addColorStop(.52, "#d45b47");
    shell.addColorStop(.84, "#b13d33");
    shell.addColorStop(1, "#702a28");
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.moveTo(-11, -31);
    ctx.lineTo(11, -31);
    ctx.lineTo(14, -26);
    ctx.lineTo(14, 25);
    ctx.lineTo(10, 30);
    ctx.lineTo(-10, 30);
    ctx.lineTo(-14, 25);
    ctx.lineTo(-14, -26);
    ctx.closePath();
    ctx.fill();

    // Filetes de contorno e reflexo superior para dar espessura à carenagem.
    ctx.strokeStyle = "rgba(255, 207, 164, .72)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-11, -29.5);
    ctx.lineTo(10, -29.5);
    ctx.lineTo(12.5, -25);
    ctx.lineTo(12.5, 23);
    ctx.stroke();
    ctx.strokeStyle = "rgba(48, 18, 18, .72)";
    ctx.beginPath();
    ctx.moveTo(-13, -24);
    ctx.lineTo(-13, 24);
    ctx.lineTo(-9, 28);
    ctx.lineTo(9, 28);
    ctx.stroke();

    // Faixa de identificação e frisos metálicos.
    const gold = ctx.createLinearGradient(0, -28, 0, -21);
    gold.addColorStop(0, "#ffe09a");
    gold.addColorStop(.45, "#e5b44e");
    gold.addColorStop(1, "#9c6c2c");
    ctx.fillStyle = gold;
    ctx.fillRect(-13, -27, 26, 5);
    ctx.fillStyle = "rgba(255, 238, 190, .78)";
    ctx.fillRect(-11, -26, 22, 1);
    ctx.fillStyle = "#6e4a2b";
    ctx.fillRect(-13, -22, 26, 1);

    // Cabine e para-brisa dianteiro, preservando a posição da janela original.
    ctx.fillStyle = "#172a2b";
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.lineTo(10, -18);
    ctx.lineTo(9, 4);
    ctx.lineTo(-9, 4);
    ctx.closePath();
    ctx.fill();
    const glass = ctx.createLinearGradient(-7, -16, 7, -7);
    glass.addColorStop(0, "#d4e8d8");
    glass.addColorStop(.42, "#86b6b5");
    glass.addColorStop(1, "#315d64");
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(-7, -15);
    ctx.lineTo(7, -15);
    ctx.lineTo(6, -7);
    ctx.lineTo(-6, -7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(231, 245, 225, .85)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, -7);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.34)";
    ctx.fillRect(-6, -14, 2, 5);

    // Tampa do motor e grelhas de ventilação na parte traseira da cabine.
    ctx.fillStyle = "#762d29";
    ctx.fillRect(-10, 7, 20, 15);
    ctx.fillStyle = "#d8d0b8";
    ctx.fillRect(-10, 8, 20, 12);
    ctx.fillStyle = "#a6a18e";
    ctx.fillRect(-9, 9, 18, 1);
    for (let y = 12; y <= 18; y += 3) {
      ctx.fillStyle = "#555c56";
      ctx.fillRect(-7, y, 14, 1);
      ctx.fillStyle = "rgba(255,255,255,.42)";
      ctx.fillRect(-7, y, 14, .6);
    }
    ctx.fillStyle = "#6f746b";
    ctx.fillRect(-2, 9, 4, 11);

    // Plataformas laterais, corrimãos e pequenos elementos de manutenção.
    ctx.fillStyle = "#252e2d";
    ctx.fillRect(-15, -17, 2, 34);
    ctx.fillRect(13, -17, 2, 34);
    ctx.fillStyle = "#d2a34b";
    ctx.fillRect(-15, -16, 2, 31);
    ctx.fillRect(13, -16, 2, 31);
    ctx.fillStyle = "#e8c16c";
    for (const y of [-12, -4, 4, 12]) {
      ctx.fillRect(-14, y, 1, 2);
      ctx.fillRect(13, y, 1, 2);
    }

    // Faróis dianteiros com aro, lente e halo luminoso discreto.
    for (const x of [-8, 8]) {
      ctx.fillStyle = "rgba(255, 224, 142, .20)";
      ctx.beginPath();
      ctx.arc(x, -32, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#55432b";
      ctx.fillRect(x - 2.5, -34, 5, 4);
      ctx.fillStyle = "#fff0b4";
      ctx.fillRect(x - 1.7, -33, 3.4, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - .7, -33, 1.4, 1);
    }

    // Engate traseiro reforçado e engate dianteiro, visíveis de cima.
    ctx.fillStyle = "rgba(0,0,0,.48)";
    ctx.fillRect(-5, 28, 10, 9);
    ctx.fillStyle = "#252f30";
    ctx.fillRect(-3.2, 28, 6.4, 8);
    ctx.fillStyle = "#aeb5aa";
    ctx.fillRect(-2.2, 33, 4.4, 3);
    ctx.fillStyle = "#d8d4c4";
    ctx.fillRect(-.7, 33.5, 1.4, 1.4);
    ctx.fillStyle = "#303a38";
    ctx.fillRect(-3, -35, 6, 5);
    ctx.fillStyle = "#aeb5aa";
    ctx.fillRect(-2, -36, 4, 2);
    ctx.fillStyle = "#d0ad63";
    ctx.fillRect(-12, 26, 3, 2);
    ctx.fillRect(9, 26, 3, 2);

    ctx.restore();
  }

  function drawTrain(cameraY) {
    // O primeiro vagão respeita o comprimento maior da locomotiva; os demais
    // mantêm 48 unidades de distância real ao longo do trilho, inclusive nas curvas.
    const trainS = START_S + state.trackOffset;
    for (let i = PASSENGER_WAGON_COUNT; i >= 1; i--) {
      const distanceBehind = 54 + (i - 1) * TRAIN_SPACING;
      const wagonS = trackSBehind(trainS, distanceBehind);
      drawWagon(wagonS, i, cameraY);
    }
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

  function render(dt = 1 / 60) {
    const targetCameraY = trackPoint(START_S + state.trackOffset).y;
    // Suavização independente da taxa de quadros: reduz pequenas variações
    // no deslocamento vertical sem alterar a velocidade real do trem.
    if (state.cameraY === null) state.cameraY = targetCameraY;
    const cameraBlend = 1 - Math.exp(-28 * Math.max(0, dt));
    state.cameraY += (targetCameraY - state.cameraY) * cameraBlend;
    const cameraY = state.cameraY;
    drawGround(cameraY);
    drawLateralAtmosphere(cameraY);
    drawGroundDetails(cameraY);
    // Vegetação inicial restaurada; as demais regiões mantêm seus cenários próprios.
    drawScenery(cameraY);
    drawFarmRegion(cameraY);
    drawForestRegion(cameraY);
    drawFlowerField(cameraY);
    drawTownRegion(cameraY);
    drawCherryGroveRegion(cameraY);
    drawFinalStationRegion(cameraY);
    drawBusTerminalRegion(cameraY);
    // Água é desenhada depois da vegetação para nunca deixar árvores sobre o rio ou o lago.
    drawRiverLakeRegion(cameraY);
    drawBridge(cameraY);
    drawRails(cameraY);
    drawTownCrossingDeck(cameraY, 6300);
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
      state.speed=Math.min(limit,state.speed+(0.40+state.throttlePoint*0.125)*dt);
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
    if(state.distance<845)regionName.textContent="Estação de partida";else if(state.distance<1820)regionName.textContent="Campo verde";else if(state.distance<2665)regionName.textContent="Fazendas e plantações";else if(state.distance<2948)regionName.textContent="Floresta";else if(state.distance<3260)regionName.textContent="Rios, lagos e pontes";else if(state.distance<5200)regionName.textContent="Campos floridos";else if(state.distance<7380)regionName.textContent="Cidade do interior";else if(state.distance<7800)regionName.textContent="Bosque de cerejeiras";else if(state.distance<8900)regionName.textContent="Estação final";else regionName.textContent="Rodoviária";
    render(dt);
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