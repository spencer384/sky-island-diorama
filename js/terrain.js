// js/terrain.js — Floating Sky Island terrain, underbelly, crater lake, river, waterfall, islets & vegetation

window.SkyTerrain = (function () {
  const ISLAND_RADIUS = 36;
  const CRATER_X = -2;
  const CRATER_Z = -15;
  const CRATER_WATER_Y = 8.7;

  function getEdgeRadius(angle) {
    return (
      ISLAND_RADIUS +
      1.6 * Math.sin(angle * 3 + 0.4) +
      0.9 * Math.cos(angle * 5 - 0.8) +
      0.5 * Math.sin(angle * 7)
    );
  }

  function getRiverX(z) {
    // Curves gently from crater (-2, -11) through village (0, 0) to front-right cliff (8.5, 29)
    const t = Math.max(0, Math.min(1, (z + 11) / 40));
    return -2 + 10.5 * Math.pow(t, 1.35) + 1.4 * Math.sin(t * Math.PI * 2.0);
  }

  function getTerrainHeight(x, z) {
    const r = Math.hypot(x, z);
    const angle = Math.atan2(z, x);
    const maxR = getEdgeRadius(angle);
    const normR = r / maxR;

    if (normR > 1.08) return -5;

    // Base rolling meadow
    let h =
      2.2 +
      0.85 * Math.sin(x * 0.11 + 0.5) * Math.cos(z * 0.1 + 0.3) +
      0.45 * Math.cos((x + z) * 0.16);

    // Gentle dome falloff near island rim
    const rimFalloff = Math.max(0, Math.min(1, (1.0 - normR) / 0.22));
    h *= 0.35 + 0.65 * Math.pow(rimFalloff, 0.6);

    // Mountain & crater lake at back
    const dc = Math.hypot(x - CRATER_X, z - CRATER_Z);
    const mountain = 9.0 * Math.exp(-(dc * dc) / (2 * 9.5 * 9.5));
    h += mountain;

    // Carve crater basin
    if (dc < 6.2) {
      const craterFactor = Math.exp(-(dc * dc) / (2 * 3.1 * 3.1));
      h -= 3.6 * craterFactor;
    }

    // Secondary hill on right (for observatory & windmill)
    const dObs = Math.hypot(x - 16, z + 6);
    h += 2.6 * Math.exp(-(dObs * dObs) / (2 * 6.5 * 6.5));

    // Secondary hill on left (for windmill)
    const dLeft = Math.hypot(x + 17, z + 7);
    h += 2.1 * Math.exp(-(dLeft * dLeft) / (2 * 6.0 * 6.0));

    // Carve river channel from crater outlet to cliff edge
    if (z > -11.5 && z < 34) {
      const rx = getRiverX(z);
      const distToRiver = Math.abs(x - rx);
      if (distToRiver < 4.5) {
        const carve = Math.exp(-(distToRiver * distToRiver) / (2 * 1.65 * 1.65));
        const depth = z < -4 ? 1.5 : 1.15;
        h -= depth * carve;
      }
    }

    // Taper to 0 right at the edge
    if (normR > 0.92) {
      const t = Math.max(0, 1 - (normR - 0.92) / 0.12);
      h *= t;
    }

    return h;
  }

  function createWaterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, '#1e90d4');
    grad.addColorStop(0.5, '#42c4f5');
    grad.addColorStop(1, '#1e90d4');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    // White foam streaks
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * 236 + 10;
      const y = Math.random() * 512;
      const w = 2 + Math.random() * 6;
      const len = 18 + Math.random() * 48;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.22 + Math.random() * 0.45})`;
      ctx.fillRect(x, y, w, len);
      if (y + len > 512) {
        ctx.fillRect(x, y - 512, w, len);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 3);
    return tex;
  }

  function buildIslandGroup(trackCurve) {
    const group = new THREE.Group();
    group.name = 'SkyIslandTerrain';

    // 1. Top grassy terrain mesh (radial grid for clean circular rim)
    const radialSegs = 84;
    const ringSegs = 36;
    const positions = [];
    const colors = [];
    const indices = [];

    // Vibrant Animal Crossing grass & rock tones (rich emerald/lime greens, warm cookie/terracotta soils)
    const grassLow = new THREE.Color('#46b033');
    const grassHigh = new THREE.Color('#82e340');
    const grassHighlight = new THREE.Color('#a8f255');
    const rockSlope = new THREE.Color('#946f49');
    const riverBed = new THREE.Color('#3889a8');

    for (let ir = 0; ir <= ringSegs; ir++) {
      const frac = ir / ringSegs;
      for (let ia = 0; ia <= radialSegs; ia++) {
        const angle = (ia / radialSegs) * Math.PI * 2;
        const maxR = getEdgeRadius(angle);
        const r = frac * maxR;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const y = getTerrainHeight(x, z);
        positions.push(x, y, z);

        // Vertex color based on height & river proximity
        const c = grassLow.clone().lerp(grassHigh, Math.min(1, Math.max(0, (y - 1.5) / 6.0)));
        if (y > 6.5) {
          c.lerp(rockSlope, Math.min(0.65, (y - 6.5) / 4.5));
        }
        if (z > -11 && Math.abs(x - getRiverX(z)) < 1.8) {
          c.lerp(riverBed, 0.65);
        }
        if (frac > 0.94) {
          c.lerp(rockSlope, 0.55);
        }
        colors.push(c.r, c.g, c.b);
      }
    }

    const stride = radialSegs + 1;
    for (let ir = 0; ir < ringSegs; ir++) {
      for (let ia = 0; ia < radialSegs; ia++) {
        const a = ir * stride + ia;
        const b = (ir + 1) * stride + ia;
        const c = (ir + 1) * stride + (ia + 1);
        const d = ir * stride + (ia + 1);
        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }

    const topGeo = new THREE.BufferGeometry();
    topGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    topGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    topGeo.setIndex(indices);
    topGeo.computeVertexNormals();

    const topMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.02,
      flatShading: true
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.receiveShadow = true;
    topMesh.castShadow = true;
    group.add(topMesh);

    // 2. Rocky floating underbelly
    const underPos = [];
    const underCol = [];
    const underIdx = [];
    const uRings = 12;
    const uRad = 48;
    const rockDark = new THREE.Color('#4a3829');
    const rockMid = new THREE.Color('#6e533d');
    const rockLight = new THREE.Color('#86684e');

    for (let ir = 0; ir <= uRings; ir++) {
      const t = ir / uRings; // 0 at rim, 1 at bottom tip
      const depth = -Math.pow(t, 1.15) * 16.5;
      for (let ia = 0; ia <= uRad; ia++) {
        const angle = (ia / uRad) * Math.PI * 2;
        const maxR = getEdgeRadius(angle);
        const jitter =
          ir === 0 || ir === uRings
            ? 1.0
            : 0.86 + 0.24 * Math.sin(angle * 7 + ir * 2.1) * Math.cos(angle * 3 - ir);
        const r = maxR * (1 - Math.pow(t, 0.85)) * jitter;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const y = ir === 0 ? getTerrainHeight(x, z) - 0.15 : depth + (Math.sin(angle * 5 + ir) * 0.6 * (1 - t));
        underPos.push(x, y, z);

        const c = rockLight.clone().lerp(rockMid, t).lerp(rockDark, Math.max(0, t - 0.35));
        underCol.push(c.r, c.g, c.b);
      }
    }

    const uStride = uRad + 1;
    for (let ir = 0; ir < uRings; ir++) {
      for (let ia = 0; ia < uRad; ia++) {
        const a = ir * uStride + ia;
        const b = (ir + 1) * uStride + ia;
        const c = (ir + 1) * uStride + (ia + 1);
        const d = ir * uStride + (ia + 1);
        underIdx.push(a, b, d);
        underIdx.push(b, c, d);
      }
    }

    const underGeo = new THREE.BufferGeometry();
    underGeo.setAttribute('position', new THREE.Float32BufferAttribute(underPos, 3));
    underGeo.setAttribute('color', new THREE.Float32BufferAttribute(underCol, 3));
    underGeo.setIndex(underIdx);
    underGeo.computeVertexNormals();

    const underMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.04,
      flatShading: true,
      side: THREE.DoubleSide
    });
    const underMesh = new THREE.Mesh(underGeo, underMat);
    underMesh.castShadow = true;
    underMesh.receiveShadow = true;
    group.add(underMesh);

    // 2.5 Rocky skirt sealing the gap between top terrain rim and underbelly
    const skirtPos = [];
    const skirtCol = [];
    const skirtIdx = [];
    const skirtSegs = 72;
    for (let ia = 0; ia <= skirtSegs; ia++) {
      const angle = (ia / skirtSegs) * Math.PI * 2;
      const maxR = getEdgeRadius(angle);
      const x = Math.cos(angle) * maxR;
      const z = Math.sin(angle) * maxR;
      const topY = getTerrainHeight(x, z);
      const botY = topY - 1.8;

      skirtPos.push(x, topY, z);
      skirtPos.push(x * 0.985, botY, z * 0.985);

      skirtCol.push(rockLight.r, rockLight.g, rockLight.b);
      skirtCol.push(rockDark.r, rockDark.g, rockDark.b);

      if (ia < skirtSegs) {
        const a = ia * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        skirtIdx.push(a, b, d);
        skirtIdx.push(a, d, c);
      }
    }
    const skirtGeo = new THREE.BufferGeometry();
    skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtPos, 3));
    skirtGeo.setAttribute('color', new THREE.Float32BufferAttribute(skirtCol, 3));
    skirtGeo.setIndex(skirtIdx);
    skirtGeo.computeVertexNormals();
    const skirtMesh = new THREE.Mesh(skirtGeo, underMat);
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    group.add(skirtMesh);

    // 3. Hanging roots / vines under the island
    const vineMat = new THREE.MeshStandardMaterial({
      color: '#5a4632',
      roughness: 0.9
    });
    const vineCoords = [
      [-26, -3, 10, 7.5],
      [-23, -3.5, 13, 5.2],
      [-18, -5, -18, 6.8],
      [-8, -7, 22, 8.0],
      [15, -5.5, 20, 6.0],
      [25, -3.2, -9, 5.5],
      [-29, -2.5, -2, 6.2]
    ];
    vineCoords.forEach(([vx, vy, vz, len]) => {
      const vGeo = new THREE.CylinderGeometry(0.14, 0.03, len, 5);
      const vine = new THREE.Mesh(vGeo, vineMat);
      vine.position.set(vx, vy - len / 2, vz);
      vine.rotation.z = (Math.random() - 0.5) * 0.15;
      group.add(vine);
    });

    // 4. Water: Crater Lake + River Cascade + Cliff Waterfall
    const waterTex = createWaterTexture();
    const waterMat = new THREE.MeshStandardMaterial({
      map: waterTex,
      color: '#88dcff',
      roughness: 0.25,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9
    });

    // Crater lake disc
    const lakeGeo = new THREE.CircleGeometry(4.3, 28);
    const lakeMesh = new THREE.Mesh(lakeGeo, waterMat);
    lakeMesh.rotation.x = -Math.PI / 2;
    lakeMesh.position.set(CRATER_X, CRATER_WATER_Y, CRATER_Z);
    lakeMesh.receiveShadow = true;
    group.add(lakeMesh);

    // River ribbon from crater outlet (z = -11.2) to cliff edge
    const riverZStart = -11.2;
    let riverZEnd = 33.5;
    // Find exact cliff edge where river exits island
    for (let z = 24; z <= 36; z += 0.25) {
      const rx = getRiverX(z);
      const ang = Math.atan2(z, rx);
      if (Math.hypot(rx, z) >= getEdgeRadius(ang) - 0.3) {
        riverZEnd = z;
        break;
      }
    }

    const rSteps = 44;
    const rPos = [];
    const rUv = [];
    const rIdx = [];
    for (let i = 0; i <= rSteps; i++) {
      const t = i / rSteps;
      const z = riverZStart + (riverZEnd - riverZStart) * t;
      const cx = getRiverX(z);
      const width = 1.65 + 0.35 * Math.sin(t * Math.PI);
      const cy = getTerrainHeight(cx, z) + 0.22;
      rPos.push(cx - width, cy, z);
      rPos.push(cx + width, cy, z);
      rUv.push(0, t * 4);
      rUv.push(1, t * 4);
      if (i < rSteps) {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        rIdx.push(a, c, b);
        rIdx.push(b, c, d);
      }
    }
    const riverGeo = new THREE.BufferGeometry();
    riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(rPos, 3));
    riverGeo.setAttribute('uv', new THREE.Float32BufferAttribute(rUv, 2));
    riverGeo.setIndex(rIdx);
    riverGeo.computeVertexNormals();
    const riverMesh = new THREE.Mesh(riverGeo, waterMat);
    riverMesh.receiveShadow = true;
    group.add(riverMesh);

    // Plunging cliff waterfall
    const wfX = getRiverX(riverZEnd);
    const wfTopY = getTerrainHeight(wfX, riverZEnd) + 0.15;
    const wfHeight = 25;
    const wfGeo = new THREE.PlaneGeometry(3.4, wfHeight, 4, 12);
    const wfMesh = new THREE.Mesh(wfGeo, waterMat);
    wfMesh.position.set(wfX, wfTopY - wfHeight / 2, riverZEnd + 0.55);
    wfMesh.rotation.y = Math.atan2(wfX, riverZEnd) * 0.35;
    group.add(wfMesh);

    // Waterfall mist puffs at cliff top & bottom
    const mistPuffs = [];
    const mistMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 1,
      transparent: true,
      opacity: 0.45
    });
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.9 + Math.random() * 0.8, 8, 8), mistMat);
      m.position.set(
        wfX + (Math.random() - 0.5) * 3.0,
        wfTopY - wfHeight + 1.5 + Math.random() * 2.5,
        riverZEnd + 0.8 + (Math.random() - 0.5) * 2.0
      );
      m.userData.baseY = m.position.y;
      m.userData.phase = Math.random() * Math.PI * 2;
      group.add(m);
      mistPuffs.push(m);
    }

    // 5. Satellite floating mini-islands
    const islets = [];
    const isletConfigs = [
      { x: -45, y: 3.5, z: -10, s: 2.2 },
      { x: -49, y: -5.5, z: 9, s: 1.6 },
      { x: -39, y: -12.5, z: 24, s: 2.6 },
      { x: 47, y: 5.5, z: -16, s: 1.9 },
      { x: 39, y: -8.0, z: 27, s: 1.8 }
    ];
    isletConfigs.forEach((cfg, idx) => {
      const islet = new THREE.Group();
      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(cfg.s, cfg.s * 0.9, 0.7, 7),
        new THREE.MeshStandardMaterial({ color: '#61b342', roughness: 0.9, flatShading: true })
      );
      cap.position.y = 0.2;
      const base = new THREE.Mesh(
        new THREE.ConeGeometry(cfg.s * 0.92, cfg.s * 1.9, 7),
        new THREE.MeshStandardMaterial({ color: '#6b513b', roughness: 0.95, flatShading: true })
      );
      base.rotation.x = Math.PI;
      base.position.y = -cfg.s * 0.95;
      islet.add(cap, base);

      // Tiny tree on some islets
      if (idx % 2 === 0) {
        const tTrunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.16, 0.8, 5),
          new THREE.MeshStandardMaterial({ color: '#6d4c33', roughness: 0.9 })
        );
        tTrunk.position.y = 0.8;
        const tTop = new THREE.Mesh(
          new THREE.ConeGeometry(0.65, 1.6, 6),
          new THREE.MeshStandardMaterial({ color: '#2f8a3c', roughness: 0.85, flatShading: true })
        );
        tTop.position.y = 1.7;
        islet.add(tTrunk, tTop);
      }

      islet.position.set(cfg.x, cfg.y, cfg.z);
      islet.userData = { baseY: cfg.y, phase: idx * 1.3 };
      group.add(islet);
      islets.push(islet);
    });

    // 6. Cute Animal Crossing Style Trees, Shrubs, Fruit, Mushrooms & Flowers
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#7a4e2d', roughness: 0.85 });
    const acPineMats = [
      new THREE.MeshStandardMaterial({ color: '#1eb85a', roughness: 0.75, flatShading: false }),
      new THREE.MeshStandardMaterial({ color: '#2cd66d', roughness: 0.75, flatShading: false }),
      new THREE.MeshStandardMaterial({ color: '#4ee888', roughness: 0.75, flatShading: false })
    ];
    const acDeciduousMats = [
      new THREE.MeshStandardMaterial({ color: '#68d638', roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ color: '#82e848', roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ color: '#ff8fb1', roughness: 0.72 }) // Cherry blossom / Sakura tree!
    ];
    const fruitAppleMat = new THREE.MeshStandardMaterial({ color: '#ff3344', roughness: 0.35 });
    const fruitOrangeMat = new THREE.MeshStandardMaterial({ color: '#ff9514', roughness: 0.35 });
    const bushMat = new THREE.MeshStandardMaterial({ color: '#52c938', roughness: 0.8 });
    const rockMat = new THREE.MeshStandardMaterial({ color: '#8e8b82', roughness: 0.88, flatShading: false });
    const mushroomCapMat = new THREE.MeshStandardMaterial({ color: '#ff3855', roughness: 0.4 });
    const mushroomStemMat = new THREE.MeshStandardMaterial({ color: '#fff9ea', roughness: 0.6 });

    // Deterministic pseudo-random helper
    let seed = 42;
    function rand() {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    function isClearForProp(x, z) {
      const r = Math.hypot(x, z);
      const angle = Math.atan2(z, x);
      if (r > getEdgeRadius(angle) - 2.2) return false;
      if (Math.hypot(x - CRATER_X, z - CRATER_Z) < 6.4) return false;
      if (z > -12 && Math.abs(x - getRiverX(z)) < 3.4) return false;
      if (Math.hypot(x + 1, z - 2) < 9.5) return false;
      if (x > 26 && Math.abs(z - 2) < 4.5) return false;
      if (trackCurve) {
        for (let i = 0; i < 64; i++) {
          const pt = trackCurve.getPointAt(i / 64);
          if (Math.hypot(x - pt.x, z - pt.z) < 2.9) return false;
        }
      }
      return true;
    }

    // Chubby Tiered Pine (Animal Crossing Cedar)
    function addCutePineTree(x, z, scale) {
      const y = getTerrainHeight(x, z);
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 10), trunkMat);
      trunk.position.y = 0.6;
      trunk.castShadow = true;
      tree.add(trunk);

      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(1.35 - i * 0.3, 1.3 - i * 0.15, 12),
          acPineMats[i]
        );
        cone.position.y = 1.35 + i * 0.85;
        cone.castShadow = true;
        cone.receiveShadow = true;
        tree.add(cone);
      }
      tree.position.set(x, y - 0.1, z);
      tree.scale.setScalar(scale);
      tree.rotation.y = rand() * Math.PI * 2;
      group.add(tree);
    }

    // Plump Cloud-shaped Fruit/Hardwood Tree (Animal Crossing Oak/Fruit Tree)
    function addCuteHardwoodTree(x, z, scale, isSakura = false) {
      const y = getTerrainHeight(x, z);
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.4, 10), trunkMat);
      trunk.position.y = 0.7;
      trunk.castShadow = true;
      tree.add(trunk);

      const leafChoice = isSakura ? acDeciduousMats[2] : (rand() > 0.4 ? acDeciduousMats[0] : acDeciduousMats[1]);
      
      // Multi-sphere fluffy canopy
      const mainPuff = new THREE.Mesh(new THREE.SphereGeometry(1.2, 14, 12), leafChoice);
      mainPuff.position.y = 2.1;
      mainPuff.scale.set(1.15, 0.95, 1.15);
      mainPuff.castShadow = true;
      tree.add(mainPuff);

      const puffOffsets = [
        [0.65, 2.2, 0.5, 0.75],
        [-0.6, 2.3, 0.45, 0.7],
        [0.0, 2.45, -0.65, 0.72]
      ];
      puffOffsets.forEach(([px, py, pz, ps]) => {
        const subPuff = new THREE.Mesh(new THREE.SphereGeometry(ps, 10, 8), leafChoice);
        subPuff.position.set(px, py, pz);
        subPuff.castShadow = true;
        tree.add(subPuff);
      });

      // Cute hanging fruits on some trees!
      if (!isSakura && rand() > 0.4) {
        const fruitMat = rand() > 0.5 ? fruitAppleMat : fruitOrangeMat;
        const fruitGeo = new THREE.SphereGeometry(0.18, 8, 8);
        [
          [0.6, 1.7, 0.7],
          [-0.7, 1.75, 0.5],
          [0.1, 1.68, -0.85]
        ].forEach(([fx, fy, fz]) => {
          const fruit = new THREE.Mesh(fruitGeo, fruitMat);
          fruit.position.set(fx, fy, fz);
          tree.add(fruit);
        });
      }

      tree.position.set(x, y - 0.1, z);
      tree.scale.setScalar(scale);
      tree.rotation.y = rand() * Math.PI * 2;
      group.add(tree);
    }

    let placed = 0;
    let attempts = 0;
    while (placed < 165 && attempts < 1400) {
      attempts++;
      const angle = rand() * Math.PI * 2;
      const r = 4 + rand() * 31;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (!isClearForProp(x, z)) continue;

      const scale = 0.8 + rand() * 0.55;
      const treeType = rand();
      if (treeType < 0.45) {
        addCutePineTree(x, z, scale);
      } else if (treeType < 0.85) {
        addCuteHardwoodTree(x, z, scale, false);
      } else {
        addCuteHardwoodTree(x, z, scale * 1.1, true); // Sakura blossom tree
      }
      placed++;
    }

    // Smooth rounded river pebbles
    for (let i = 0; i < 40; i++) {
      const angle = rand() * Math.PI * 2;
      const r = 3 + rand() * 30;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (!isClearForProp(x, z)) continue;
      const y = getTerrainHeight(x, z);
      const rock = new THREE.Mesh(new THREE.SphereGeometry(0.35 + rand() * 0.35, 10, 8), rockMat);
      rock.position.set(x, y + 0.12, z);
      rock.scale.set(1.3, 0.65, 1.0);
      rock.rotation.set(0, rand() * Math.PI, 0);
      rock.castShadow = true;
      group.add(rock);
    }

    // Cute fairy-tale mushrooms (red with white dots)
    for (let i = 0; i < 35; i++) {
      const angle = rand() * Math.PI * 2;
      const r = 5 + rand() * 26;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (!isClearForProp(x, z)) continue;
      const y = getTerrainHeight(x, z);
      const mush = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.32, 8), mushroomStemMat);
      stem.position.y = 0.16;
      mush.add(stem);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mushroomCapMat);
      cap.position.y = 0.32;
      mush.add(cap);
      mush.position.set(x, y, z);
      mush.scale.setScalar(0.7 + rand() * 0.5);
      group.add(mush);
    }

    // Plump rounded flower beds (tulips / daisies / pansies)
    const flowerColors = ['#ff4d79', '#ffdd33', '#ffffff', '#4da6ff', '#a64dff'];
    for (let i = 0; i < 140; i++) {
      const angle = rand() * Math.PI * 2;
      const r = 2 + rand() * 30;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (Math.hypot(x - CRATER_X, z - CRATER_Z) < 5) continue;
      const y = getTerrainHeight(x, z);
      
      const flGroup = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 5), bushMat);
      stem.position.y = 0.11;
      flGroup.add(stem);

      const petalColor = flowerColors[i % flowerColors.length];
      const petalMat = new THREE.MeshStandardMaterial({ color: petalColor, roughness: 0.5 });
      const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), petalMat);
      bloom.position.y = 0.23;
      bloom.scale.set(1.2, 0.8, 1.2);
      flGroup.add(bloom);

      const center = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), fruitOrangeMat);
      center.position.y = 0.28;
      flGroup.add(center);

      flGroup.position.set(x, y + 0.02, z);
      group.add(flGroup);
    }

    // Lush rounded Animal Crossing bushes
    for (let i = 0; i < 55; i++) {
      const angle = rand() * Math.PI * 2;
      const r = 4 + rand() * 28;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      if (!isClearForProp(x, z)) continue;
      const y = getTerrainHeight(x, z);
      const bush = new THREE.Group();
      for (let b = 0; b < 3; b++) {
        const s = 0.38 + rand() * 0.22;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), bushMat);
        puff.position.set((b - 1) * 0.3, s * 0.7, (rand() - 0.5) * 0.22);
        puff.castShadow = true;
        bush.add(puff);
      }
      bush.position.set(x, y - 0.05, z);
      group.add(bush);
    }

    return {
      group,
      waterTex,
      mistPuffs,
      islets,
      update(dt, elapsed) {
        waterTex.offset.y -= dt * 0.75;
        islets.forEach((isl) => {
          isl.position.y = isl.userData.baseY + Math.sin(elapsed * 0.7 + isl.userData.phase) * 0.55;
        });
        mistPuffs.forEach((m) => {
          m.position.y = m.userData.baseY + Math.sin(elapsed * 1.8 + m.userData.phase) * 0.4;
        });
      }
    };
  }

  return {
    ISLAND_RADIUS,
    CRATER_X,
    CRATER_Z,
    CRATER_WATER_Y,
    getEdgeRadius,
    getRiverX,
    getTerrainHeight,
    buildIslandGroup
  };
})();
