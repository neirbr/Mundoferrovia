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
  const TRACK_LENGTH = 10400; // Inclui a cidade, o bosque, a estação final e a rodoviária.
  const START_S = 520; // Posição inicial da locomotiva junto à plataforma.
  const TRAIN_SPACING = 48;
  const PASSENGER_WAGON_COUNT = 8;
  const MAX_SPEED = 82;
  const SPEED_LIMITS = [0,15,25,35,45,55,65,75,100];
  const state = {distance:0,trackOffset:0,speed:0,direction:0,throttlePoint:0,brake:0,emergency:false,emergencyStopped:false,paused:false,lastTime:0};

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


  function drawTownHouse(x, y, variant = 0) {
    // Construções simples vistas de cima, com quintal e telhado colorido.
    const wall = ["#d8c49a", "#c9d1bd", "#d6b2a0", "#d7cfaa"][variant % 4];
    const roof = ["#a64f3d", "#8b6650", "#6e7880", "#b47a45"][variant % 4];
    ctx.fillStyle = "rgba(39, 49, 35, .25)";
    ctx.fillRect(x - 33, y - 24, 70, 55);
    ctx.fillStyle = "#66844e";
    ctx.fillRect(x - 38, y - 31, 76, 63);
    ctx.fillStyle = wall;
    ctx.fillRect(x - 29, y - 23, 58, 46);
    ctx.fillStyle = roof;
    ctx.fillRect(x - 32, y - 28, 64, 38);
    ctx.fillStyle = "#d6b78a";
    ctx.fillRect(x - 27, y - 25, 54, 5);
    ctx.fillStyle = "#51483b";
    ctx.fillRect(x - 6, y - 4, 13, 27);
    ctx.fillStyle = "#a9c5c1";
    ctx.fillRect(x - 23, y - 14, 9, 9);
    ctx.fillRect(x + 14, y - 14, 9, 9);
    ctx.fillStyle = "#e2d6b9";
    ctx.fillRect(x - 35, y + 32, 70, 3);
    // Pequena árvore no quintal.
    ctx.fillStyle = "#376b43";
    ctx.fillRect(x + 37, y - 23, 15, 17);
    ctx.fillStyle = "#80a75b";
    ctx.fillRect(x + 41, y - 27, 7, 7);
  }

  function drawTownShop(x, y, variant = 0) {
    ctx.fillStyle = "#66844e";
    ctx.fillRect(x - 42, y - 32, 86, 68);
    ctx.fillStyle = "#d8c9a7";
    ctx.fillRect(x - 34, y - 25, 70, 53);
    ctx.fillStyle = variant % 2 ? "#477b85" : "#b45d45";
    ctx.fillRect(x - 38, y - 31, 78, 25);
    ctx.fillStyle = "#f0dfb4";
    for (let i = 0; i < 6; i++) ctx.fillRect(x - 34 + i * 13, y - 9, 9, 4);
    ctx.fillStyle = "#354b4b";
    ctx.fillRect(x - 9, y + 3, 19, 25);
    ctx.fillStyle = "#a9c9c5";
    ctx.fillRect(x - 29, y + 1, 14, 13);
    ctx.fillRect(x + 15, y + 1, 14, 13);
  }

  function drawTownRoad(cameraY, s, crossing = false) {
    const p = worldToScreen(trackPoint(s), cameraY);
    // Rua transversal à ferrovia; o desenho acompanha a posição do trilho sem alterá-lo.
    ctx.fillStyle = "#77766d";
    ctx.fillRect(0, p.y - (crossing ? 31 : 24), W, crossing ? 62 : 48);
    ctx.fillStyle = "#b6ad91";
    ctx.fillRect(0, p.y - (crossing ? 35 : 28), W, 5);
    ctx.fillRect(0, p.y + (crossing ? 30 : 23), W, 5);
    ctx.fillStyle = "#d6c99f";
    for (let x = 18; x < W; x += 76) ctx.fillRect(x, p.y - 1, 34, 3);
    if (crossing) {
      // Marcas de alerta da passagem de nível, posicionadas nos dois lados da via.
      for (const side of [-1, 1]) {
        const x = p.x + side * 52;
        ctx.fillStyle = "#e8dfc8";
        ctx.fillRect(x - 15, p.y - 28, 7, 22);
        ctx.fillRect(x - 5, p.y - 28, 7, 22);
        ctx.fillRect(x + 5, p.y - 28, 7, 22);
        ctx.fillStyle = "#d7b34f";
        ctx.fillRect(x - 4, p.y - 48, 8, 18);
        ctx.fillStyle = "#b4483b";
        ctx.fillRect(x - 3, p.y - 45, 6, 5);
      }
    }
  }

  function drawTownRegion(cameraY) {
    // Pequena cidade do interior: casas e comércios dos dois lados da ferrovia.
    const buildings = [
      {s: 5740, side:-1, d:160, v:0}, {s: 5825, side:1, d:175, v:1},
      {s: 5940, side:-1, d:260, v:2}, {s: 6035, side:1, d:265, v:3},
      {s: 6160, side:-1, d:165, shop:true, v:0}, {s: 6285, side:1, d:170, shop:true, v:1},
      {s: 6410, side:-1, d:270, v:1}, {s: 6515, side:1, d:260, v:2},
      {s: 6650, side:-1, d:170, v:3}, {s: 6750, side:1, d:175, v:0},
      {s: 6900, side:-1, d:260, v:2}, {s: 7010, side:1, d:265, v:1},
      {s: 7140, side:-1, d:165, v:1}, {s: 7220, side:1, d:175, v:3}
    ];
    for (const b of buildings) {
      const p = worldToScreen(trackPoint(b.s), cameraY);
      if (p.y < -100 || p.y > H + 100) continue;
      const x = p.x + b.side * b.d;
      if (x < 50 || x > W - 50) continue;
      if (b.shop) drawTownShop(x, p.y, b.v);
      else drawTownHouse(x, p.y, b.v);
    }
    drawTownRoad(cameraY, 5920, false);
    drawTownRoad(cameraY, 6300, true);
    drawTownRoad(cameraY, 6680, false);
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

  function drawCherryGroveRegion(cameraY) {
    // Bosque de cerejeiras após a cidade, com clareiras, bancos e pequenos chalés.
    const cameraWorld = cameraY - H * .56;
    const first = Math.floor((cameraWorld - 180) / 112);
    const last = Math.ceil((cameraWorld + H + 180) / 112);

    for (let row = first; row <= last; row++) {
      const yWorld = row * 112 + 56;
      const s = 690 - yWorld;
      if (s < 7380 || s > 8170) continue;
      const p = trackPoint(s);
      const y = yWorld - cameraWorld;

      for (const side of [-1, 1]) {
        const jitter = seeded(row * 131 + side * 17);
        const x1 = p.x + side * (178 + jitter * 30);
        const x2 = p.x + side * (285 + seeded(row * 197 + side * 31) * 32);
        if (x1 > 25 && x1 < W - 25) drawCherryTree(x1, y + (jitter - .5) * 28, row);
        if (x2 > 25 && x2 < W - 25 && seeded(row * 89 + side * 43) > .22) {
          drawCherryTree(x2, y + 28 + (jitter - .5) * 24, row + 1);
        }
        // Flores caídas formam pequenos tapetes nas clareiras.
        const petalX = p.x + side * 125;
        if (petalX > 8 && petalX < W - 8) {
          ctx.fillStyle = "rgba(239, 170, 197, .85)";
          for (let k = 0; k < 5; k++) {
            const px = petalX + (seeded(row * 43 + k * 19 + side) - .5) * 55;
            const py = y + (seeded(row * 61 + k * 23) - .5) * 46;
            ctx.fillRect(px, py, 3, 3);
          }
        }
      }
    }

    const benches = [
      {s: 7480, side: -1, d: 112}, {s: 7660, side: 1, d: 120},
      {s: 7890, side: -1, d: 118}, {s: 8070, side: 1, d: 112}
    ];
    for (const b of benches) {
      const p = worldToScreen(trackPoint(b.s), cameraY);
      if (p.y > -60 && p.y < H + 60) drawParkBench(p.x + b.side * b.d, p.y);
    }

    // Os chalés foram retirados; permanecem somente as cerejeiras e os bancos.
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
    // Somente o rio transversal ao vale, passando sob a ponte.
    const riverS = 3468;
    const riverPoint = trackPoint(riverS);
    const riverY = worldToScreen({ x: 0, y: riverPoint.y }, cameraY).y;
    ctx.fillStyle = "#9b956d";
    ctx.beginPath();
    ctx.moveTo(0, riverY - 82);
    for (let x = 0; x <= W; x += 40) {
      const wave = Math.sin(x * 0.018) * 9 + Math.sin(x * 0.043) * 4;
      ctx.lineTo(x, riverY - 67 + wave);
    }
    for (let x = W; x >= 0; x -= 40) {
      const wave = Math.sin(x * 0.016 + 1.4) * 10 + Math.sin(x * 0.039) * 4;
      ctx.lineTo(x, riverY + 72 + wave);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#397f9a";
    ctx.beginPath();
    ctx.moveTo(0, riverY - 67);
    for (let x = 0; x <= W; x += 40) {
      ctx.lineTo(x, riverY - 57 + Math.sin(x * 0.018) * 9 + Math.sin(x * 0.043) * 4);
    }
    for (let x = W; x >= 0; x -= 40) {
      ctx.lineTo(x, riverY + 59 + Math.sin(x * 0.016 + 1.4) * 10 + Math.sin(x * 0.039) * 4);
    }
    ctx.closePath();
    ctx.fill();

    // Reflexos simples sobre a água.
    ctx.fillStyle = "rgba(183, 220, 215, 0.55)";
    for (let i = 0; i < 13; i++) {
      const x = 28 + i * 61;
      const y = riverY + Math.sin(i * 2.1) * 28;
      ctx.fillRect(x, y, 22 + (i % 3) * 7, 3);
    }


  }

  function drawBridge(cameraY) {
    // Tabuleiro acompanha a geometria existente da ferrovia; os trilhos permanecem intactos.
    const centerS = 3468;
    const a = trackPoint(centerS - 88);
    const b = trackPoint(centerS + 88);
    const corners = [
      { x: a.x + a.nx * 34, y: a.y + a.ny * 34 },
      { x: b.x + b.nx * 34, y: b.y + b.ny * 34 },
      { x: b.x - b.nx * 34, y: b.y - b.ny * 34 },
      { x: a.x - a.nx * 34, y: a.y - a.ny * 34 }
    ].map(p => worldToScreen(p, cameraY));

    ctx.fillStyle = "#554c3d";
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#88785c";
    ctx.beginPath();
    ctx.moveTo(corners[0].x + 5, corners[0].y);
    ctx.lineTo(corners[1].x + 5, corners[1].y);
    ctx.lineTo(corners[2].x - 5, corners[2].y);
    ctx.lineTo(corners[3].x - 5, corners[3].y);
    ctx.closePath();
    ctx.fill();

    // Travessas estruturais nas extremidades da ponte.
    for (const s of [centerS - 72, centerS + 72]) {
      const p = worldToScreen(trackPoint(s), cameraY);
      ctx.fillStyle = "#4b4438";
      ctx.fillRect(p.x - 39, p.y - 5, 78, 10);
      ctx.fillStyle = "#b49a70";
      ctx.fillRect(p.x - 34, p.y - 4, 68, 3);
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

    // Engates compactos, sem alterar o espaçamento entre os veículos.
    ctx.fillStyle = "#202a2b";
    ctx.fillRect(-4, -24, 8, 3);
    ctx.fillRect(-4, 21, 8, 3);
    ctx.fillStyle = "#a7aaa0";
    ctx.fillRect(-2, -25, 4, 2);
    ctx.fillRect(-2, 23, 4, 2);

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

    // Engates e para-choques compactos nas extremidades.
    ctx.fillStyle = "#303a38";
    ctx.fillRect(-8, 29, 16, 3);
    ctx.fillRect(-5, -31, 10, 2);
    ctx.fillStyle = "#9ba096";
    ctx.fillRect(-3, 31, 6, 2);
    ctx.fillStyle = "#d0ad63";
    ctx.fillRect(-12, 26, 3, 2);
    ctx.fillRect(9, 26, 3, 2);

    ctx.restore();
  }

  function drawTrain(cameraY) {
    // Os vagões seguem pontos anteriores do mesmo traçado, cada um com orientação própria.
    const trainS = START_S + state.trackOffset;
    for (let i = PASSENGER_WAGON_COUNT; i >= 1; i--) drawWagon(trainS - i * TRAIN_SPACING, i, cameraY);
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