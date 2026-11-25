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
      { s: 2236, side: -1, variant: 0 },
      { s: 2496, side: 1, variant: 1 },
      { s: 2782, side: -1, variant: 1 },
      { s: 3068, side: 1, variant: 0 }
    ];
    for (const plot of plots) {
      const q = worldToScreen(trackPoint(plot.s), cameraY);
      if (q.y < -110 || q.y > H + 110) continue;
      drawFarmPlot(q.x + plot.side * 178, q.y, plot.variant);
    }
    const barn = worldToScreen(trackPoint(2652), cameraY);
    if (barn.y > -70 && barn.y < H + 70) drawFarmBuilding(barn.x - 185, barn.y + 35);
    const animals = worldToScreen(trackPoint(2380), cameraY);
    if (animals.y > -50 && animals.y < H + 50) drawFarmAnimals(animals.x + 155, animals.y + 48);
    const silo = worldToScreen(trackPoint(2990), cameraY);
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

    // Carro de passageiros visto de cima, com teto claro e janelas laterais.
    ctx.fillStyle = "#252c2b";
    ctx.fillRect(-15, -23, 30, 46);
    ctx.fillStyle = index % 2 ? "#315d78" : "#376b86";
    ctx.fillRect(-13, -22, 26, 44);
    ctx.fillStyle = "#d9d5c5";
    ctx.fillRect(-10, -19, 20, 38);
    ctx.fillStyle = "#b84f3e";
    ctx.fillRect(-13, -22, 26, 3);
    ctx.fillRect(-13, 19, 26, 3);

    // Fileiras de janelas ao longo dos dois lados do salão.
    for (let wy = -14; wy <= 10; wy += 8) {
      ctx.fillStyle = "#263f4b";
      ctx.fillRect(-12, wy, 4, 6);
      ctx.fillRect(8, wy, 4, 6);
      ctx.fillStyle = "#8fb8c1";
      ctx.fillRect(-11, wy + 1, 2, 4);
      ctx.fillRect(9, wy + 1, 2, 4);
    }

    // Corredor central e truques nas extremidades.
    ctx.fillStyle = "#b5b3a5";
    ctx.fillRect(-2, -15, 4, 30);
    ctx.fillStyle = "#343b3a";
    ctx.fillRect(-16, -17, 4, 9);
    ctx.fillRect(12, -17, 4, 9);
    ctx.fillRect(-16, 8, 4, 9);
    ctx.fillRect(12, 8, 4, 9);
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