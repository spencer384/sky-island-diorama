// js/train.js — Undulating circular railway, viaduct bridge, TRA CK124 2-6-2T steam locomotive & blue carriages

window.SkyTrain = (function () {
  function createTrackCurve() {
    const pts = [];
    const numPts = 32;
    for (let i = 0; i < numPts; i++) {
      const a = (i / numPts) * Math.PI * 2;
      const rx = 25.5 + 2.2 * Math.cos(a * 2);
      const rz = 24.5 + 1.8 * Math.sin(a * 3);
      const x = Math.cos(a) * rx;
      const z = Math.sin(a) * rz;
      let y = window.SkyTerrain.getTerrainHeight(x, z) + 0.25;

      if (z > 14 && Math.abs(x - window.SkyTerrain.getRiverX(z)) < 5.2) {
        y = Math.max(y, 2.55);
      }
      pts.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
  }

  function createNumberPlateTexture(text = 'CK124') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#181a1c';
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = '#d9a441';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 244, 84);
    ctx.fillStyle = '#fff8e6';
    ctx.font = 'bold 52px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 50);
    return new THREE.CanvasTexture(canvas);
  }

  function buildTrainSystem(trackCurve) {
    const group = new THREE.Group();
    group.name = 'RailwayAndTrain';

    // 1. Track sleepers (ties), twin rails & viaduct piers
    const tieGeo = new THREE.BoxGeometry(1.55, 0.12, 0.26);
    const tieMat = new THREE.MeshStandardMaterial({ color: '#5c4028', roughness: 0.92 });
    const railMat = new THREE.MeshStandardMaterial({ color: '#9ca5ad', roughness: 0.35, metalness: 0.75 });

    const totalLen = trackCurve.getLength();
    const tieCount = Math.floor(totalLen / 0.85);
    const up = new THREE.Vector3(0, 1, 0);

    const leftRailPts = [];
    const rightRailPts = [];

    for (let i = 0; i < tieCount; i++) {
      const u = i / tieCount;
      const pos = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const side = new THREE.Vector3().crossVectors(tan, up).normalize();

      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.copy(pos);
      const lookTarget = pos.clone().add(tan);
      tie.lookAt(lookTarget);
      tie.castShadow = true;
      tie.receiveShadow = true;
      group.add(tie);

      leftRailPts.push(pos.clone().addScaledVector(side, -0.46).add(new THREE.Vector3(0, 0.1, 0)));
      rightRailPts.push(pos.clone().addScaledVector(side, 0.46).add(new THREE.Vector3(0, 0.1, 0)));

      const groundY = window.SkyTerrain.getTerrainHeight(pos.x, pos.z);
      if (pos.y - groundY > 0.75 && i % 3 === 0) {
        const pierH = pos.y - groundY + 0.5;
        const pier = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, pierH, 0.65),
          new THREE.MeshStandardMaterial({ color: '#7b746a', roughness: 0.92 })
        );
        pier.position.set(pos.x, groundY + pierH / 2 - 0.3, pos.z);
        pier.lookAt(lookTarget.x, pier.position.y, lookTarget.z);
        pier.castShadow = true;
        pier.receiveShadow = true;
        group.add(pier);
      }
    }

    const leftCurve = new THREE.CatmullRomCurve3(leftRailPts, true);
    const rightCurve = new THREE.CatmullRomCurve3(rightRailPts, true);
    const leftRail = new THREE.Mesh(new THREE.TubeGeometry(leftCurve, 180, 0.055, 5, true), railMat);
    const rightRail = new THREE.Mesh(new THREE.TubeGeometry(rightCurve, 180, 0.055, 5, true), railMat);
    leftRail.castShadow = true;
    rightRail.castShadow = true;
    group.add(leftRail, rightRail);

    // 2. TRA CK124 2-6-2T Steam Locomotive
    const loco = new THREE.Group();
    const blackBody = new THREE.MeshStandardMaterial({ color: '#1b1e22', roughness: 0.42, metalness: 0.35 });
    const darkChassis = new THREE.MeshStandardMaterial({ color: '#2b2f35', roughness: 0.55, metalness: 0.45 });
    const bufferRed = new THREE.MeshStandardMaterial({ color: '#c8251e', roughness: 0.45 });
    const brassMat = new THREE.MeshStandardMaterial({ color: '#e6b446', roughness: 0.28, metalness: 0.7 });
    const silverRodMat = new THREE.MeshStandardMaterial({ color: '#cfd6de', roughness: 0.3, metalness: 0.75 });
    const traBlueMat = new THREE.MeshStandardMaterial({ color: '#1d4e89', roughness: 0.48 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: '#f4f6f8', roughness: 0.6 });
    const roofGrayMat = new THREE.MeshStandardMaterial({ color: '#6b727a', roughness: 0.65 });
    const windowGlowMat = new THREE.MeshStandardMaterial({
      color: '#ffe29a',
      emissive: '#ffaa33',
      emissiveIntensity: 0.0,
      roughness: 0.2
    });

    const plateTex = createNumberPlateTexture('CK124');
    const plateMat = new THREE.MeshStandardMaterial({ map: plateTex, roughness: 0.35, metalness: 0.3 });

    // Main frame
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.34, 3.35), darkChassis);
    chassis.position.set(0, 0.48, 0);
    chassis.castShadow = true;
    loco.add(chassis);

    // Iconic red front & rear buffer beams
    [1.68, -1.68].forEach((bz) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.3, 0.14), bufferRed);
      beam.position.set(0, 0.46, bz);
      loco.add(beam);
      // Left & right buffers
      [-0.42, 0.42].forEach((bx) => {
        const buf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8), silverRodMat);
        buf.rotation.x = Math.PI / 2;
        buf.position.set(bx, 0.46, bz + (bz > 0 ? 0.1 : -0.1));
        loco.add(buf);
      });
    });

    // Cylindrical black boiler
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.95, 16), blackBody);
    boiler.rotation.x = Math.PI / 2;
    boiler.position.set(0, 1.04, 0.5);
    boiler.castShadow = true;
    loco.add(boiler);

    // Brass boiler bands
    [-0.1, 0.45, 1.0].forEach((bz) => {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.465, 0.465, 0.05, 16), brassMat);
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 1.04, bz);
      loco.add(band);
    });

    // Side water tanks (signature of CK124 2-6-2T tank locomotive!)
    [-0.52, 0.52].forEach((tx) => {
      const tank = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.68, 1.32), blackBody);
      tank.position.set(tx, 0.96, 0.28);
      tank.castShadow = true;
      loco.add(tank);

      // Brass handrail along tank
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.25, 6), brassMat);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(tx + (tx > 0 ? 0.15 : -0.15), 1.18, 0.28);
      loco.add(rail);
    });

    // Steam dome & sand dome
    const steamDome = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.34, 12), blackBody);
    steamDome.position.set(0, 1.52, 0.45);
    loco.add(steamDome);
    const domeTop = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), blackBody);
    domeTop.position.set(0, 1.68, 0.45);
    loco.add(domeTop);

    const sandDome = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.34), blackBody);
    sandDome.position.set(0, 1.5, -0.05);
    loco.add(sandDome);

    // Smokestack with brass cap ring
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.65, 12), blackBody);
    stack.position.set(0, 1.68, 1.18);
    stack.castShadow = true;
    loco.add(stack);

    const stackRing = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.03, 6, 12), brassMat);
    stackRing.rotation.x = Math.PI / 2;
    stackRing.position.set(0, 2.0, 1.18);
    loco.add(stackRing);

    // Front smokebox door + CK124 front number plate
    const smokeDoor = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 14), darkChassis);
    smokeDoor.rotation.x = Math.PI / 2;
    smokeDoor.position.set(0, 1.04, 1.48);
    loco.add(smokeDoor);

    const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), plateMat);
    frontPlate.position.set(0, 1.04, 1.53);
    loco.add(frontPlate);

    // Cab + rear coal bunker
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.15, 1.0), blackBody);
    cab.position.set(0, 1.18, -0.85);
    cab.castShadow = true;
    loco.add(cab);

    const bunker = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.72, 0.5), blackBody);
    bunker.position.set(0, 0.96, -1.52);
    bunker.castShadow = true;
    loco.add(bunker);

    const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.12, 1.15), darkChassis);
    cabRoof.position.set(0, 1.78, -0.85);
    loco.add(cabRoof);

    // Side CK124 number plates & cab windows
    [-0.62, 0.62].forEach((wx) => {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), windowGlowMat);
      win.position.set(wx, 1.32, -0.82);
      win.rotation.y = wx > 0 ? Math.PI / 2 : -Math.PI / 2;
      loco.add(win);

      const sidePlate = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.17), plateMat);
      sidePlate.position.set(wx, 0.88, -0.82);
      sidePlate.rotation.y = wx > 0 ? Math.PI / 2 : -Math.PI / 2;
      loco.add(sidePlate);
    });

    // Headlight (mounted above smokebox)
    const headlightHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 10), blackBody);
    headlightHousing.rotation.x = Math.PI / 2;
    headlightHousing.position.set(0, 1.56, 1.45);
    loco.add(headlightHousing);

    const headlightBulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), windowGlowMat);
    headlightBulb.position.set(0, 1.56, 1.56);
    loco.add(headlightBulb);

    const headLight = new THREE.PointLight('#ffd27d', 0, 14, 1.7);
    headLight.position.set(0, 1.56, 1.9);
    loco.add(headLight);

    // 2-6-2 Wheel Arrangement + Side Connecting Rods
    const wheels = [];
    const sideRods = [];
    const driveWheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.1, 14);
    const smallWheelGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.1, 10);

    // 3 coupled driving wheels per side
    [-0.45, 0.25, 0.95].forEach((wz) => {
      [-0.58, 0.58].forEach((wx) => {
        const w = new THREE.Mesh(driveWheelGeo, bufferRed);
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, 0.34, wz);
        loco.add(w);
        wheels.push(w);
      });
    });

    // Leading & trailing pony wheels
    [-1.25, 1.45].forEach((wz) => {
      [-0.56, 0.56].forEach((wx) => {
        const w = new THREE.Mesh(smallWheelGeo, darkChassis);
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, 0.2, wz);
        loco.add(w);
        wheels.push(w);
      });
    });

    // Side connecting rods
    [-0.65, 0.65].forEach((rx) => {
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 1.55), silverRodMat);
      rod.position.set(rx, 0.28, 0.25);
      loco.add(rod);
      sideRods.push(rod);
    });

    group.add(loco);

    // 3. Two Classic TRA Blue Passenger Carriages (台鐵藍皮普快車)
    const carriages = [];
    for (let c = 0; c < 2; c++) {
      const car = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.24, 2.35), darkChassis);
      base.position.y = 0.36;
      car.add(base);

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.92, 2.2), traBlueMat);
      body.position.y = 0.94;
      body.castShadow = true;
      car.add(body);

      // Signature TRA white horizontal stripe
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.125, 0.11, 2.22), whiteMat);
      stripe.position.y = 0.7;
      car.add(stripe);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.18, 2.3), roofGrayMat);
      roof.position.y = 1.46;
      roof.castShadow = true;
      car.add(roof);

      // Windows on both sides
      [-0.56, 0.56].forEach((wx) => {
        [-0.65, 0, 0.65].forEach((wz) => {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.34), windowGlowMat);
          win.position.set(wx, 1.05, wz);
          win.rotation.y = wx > 0 ? Math.PI / 2 : -Math.PI / 2;
          car.add(win);
        });
      });

      [-0.78, 0.78].forEach((wz) => {
        [-0.56, 0.56].forEach((wx) => {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 10), darkChassis);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.24, wz);
          car.add(w);
          wheels.push(w);
        });
      });

      const carLight = new THREE.PointLight('#ffbe55', 0, 8, 2);
      carLight.position.set(0, 1.1, 0);
      car.add(carLight);
      car.userData.light = carLight;

      group.add(car);
      carriages.push(car);
    }

    // 4. Smoke Puff Particle System
    const smokePuffs = [];
    const smokeMat = new THREE.MeshStandardMaterial({
      color: '#f2f4f7',
      roughness: 1,
      transparent: true,
      opacity: 0.75
    });
    const smokeGeo = new THREE.DodecahedronGeometry(0.24, 1);
    for (let i = 0; i < 42; i++) {
      const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
      p.visible = false;
      p.userData = { life: 0, maxLife: 1.8, vel: new THREE.Vector3() };
      group.add(p);
      smokePuffs.push(p);
    }
    let smokeCursor = 0;
    let smokeTimer = 0;

    function spawnSmoke(speedMult = 1) {
      const p = smokePuffs[smokeCursor];
      smokeCursor = (smokeCursor + 1) % smokePuffs.length;
      const worldStack = new THREE.Vector3(0, 2.15, 1.18);
      loco.localToWorld(worldStack);
      p.position.copy(worldStack);
      p.scale.setScalar(0.55 + Math.random() * 0.35);
      p.material.opacity = 0.72;
      p.visible = true;
      p.userData.life = 0;
      p.userData.maxLife = 1.6 + Math.random() * 0.8;
      p.userData.vel.set(
        (Math.random() - 0.5) * 0.45,
        1.3 + Math.random() * 0.7 * speedMult,
        (Math.random() - 0.5) * 0.45
      );
    }

    let progress = 0.12;
    let speedMultiplier = 1.0;
    let rodPhase = 0;

    function placeOnTrack(obj, u) {
      const wrapped = ((u % 1) + 1) % 1;
      const pos = trackCurve.getPointAt(wrapped);
      const ahead = trackCurve.getPointAt((wrapped + 0.008) % 1);
      obj.position.copy(pos);
      obj.lookAt(ahead);
    }

    return {
      group,
      loco,
      setSpeed(v) {
        speedMultiplier = v;
      },
      triggerWhistle() {
        for (let i = 0; i < 8; i++) {
          spawnSmoke(1.6);
        }
      },
      setTimeMode(mode) {
        const isNight = mode === 'night';
        const isDusk = mode === 'dusk';
        windowGlowMat.emissiveIntensity = isNight ? 1.8 : isDusk ? 0.85 : 0.0;
        headLight.intensity = isNight ? 1.4 : isDusk ? 0.6 : 0.0;
        carriages.forEach((c) => {
          c.userData.light.intensity = isNight ? 0.55 : 0.0;
        });
        smokePuffs.forEach((p) => {
          p.material.color.set(isNight ? '#a7b6cc' : isDusk ? '#f5cbb2' : '#f2f4f7');
        });
      },
      update(dt) {
        const baseSpeed = 0.028;
        progress = (progress + dt * baseSpeed * speedMultiplier) % 1;

        placeOnTrack(loco, progress);
        placeOnTrack(carriages[0], progress - 0.020);
        placeOnTrack(carriages[1], progress - 0.037);

        // Rotate wheels & animate CK124 side connecting rods
        rodPhase += dt * 7.5 * speedMultiplier;
        wheels.forEach((w) => {
          w.rotation.x += dt * 7.5 * speedMultiplier;
        });
        sideRods.forEach((rod) => {
          rod.position.y = 0.30 + Math.sin(rodPhase) * 0.09;
          rod.position.z = 0.25 + Math.cos(rodPhase) * 0.09;
        });

        smokeTimer += dt * (0.4 + speedMultiplier);
        if (smokeTimer > 0.14) {
          smokeTimer = 0;
          spawnSmoke(1.0);
        }

        smokePuffs.forEach((p) => {
          if (!p.visible) return;
          p.userData.life += dt;
          const t = p.userData.life / p.userData.maxLife;
          if (t >= 1) {
            p.visible = false;
            return;
          }
          p.position.addScaledVector(p.userData.vel, dt);
          p.scale.setScalar(0.6 + t * 2.2);
          p.material.opacity = 0.7 * (1 - t);
        });
      }
    };
  }

  return {
    createTrackCurve,
    buildTrainSystem
  };
})();
