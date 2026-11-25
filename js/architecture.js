// js/architecture.js — Clock tower, observatory, 3 windmills, cottages, watermill, train station, lookout, gazebo, footbridge & streetlamps

window.SkyArchitecture = (function () {
  function buildVillage(trackCurve) {
    const group = new THREE.Group();
    group.name = 'VillageArchitecture';

    const getH = window.SkyTerrain.getTerrainHeight;

    // Shared vibrant Animal Crossing style materials
    const creamWall = new THREE.MeshStandardMaterial({ color: '#fff5df', roughness: 0.65 });
    const woodWall = new THREE.MeshStandardMaterial({ color: '#f3c98b', roughness: 0.7 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: '#a0998f', roughness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: '#96603a', roughness: 0.75 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: '#683e20', roughness: 0.8 });
    const roofRed = new THREE.MeshStandardMaterial({ color: '#f04b4b', roughness: 0.45 });
    const roofOrange = new THREE.MeshStandardMaterial({ color: '#ff8a3d', roughness: 0.45 });
    const roofBlue = new THREE.MeshStandardMaterial({ color: '#38a3ff', roughness: 0.45 });
    const roofYellow = new THREE.MeshStandardMaterial({ color: '#ffd033', roughness: 0.45 });
    const roofGreen = new THREE.MeshStandardMaterial({ color: '#44c965', roughness: 0.45 });
    const roofPurple = new THREE.MeshStandardMaterial({ color: '#b066ff', roughness: 0.45 });
    const roofBrown = new THREE.MeshStandardMaterial({ color: '#8c532b', roughness: 0.65 });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: '#d98b48', roughness: 0.35, metalness: 0.25 });

    const glowMat = new THREE.MeshStandardMaterial({
      color: '#fff1c4',
      emissive: '#ffaa3b',
      emissiveIntensity: 0,
      roughness: 0.25
    });

    const nightLights = [];

    function addWarmLight(parent, x, y, z, intensity = 1.6, dist = 10) {
      const pl = new THREE.PointLight('#ffbb55', 0, dist, 1.8);
      pl.position.set(x, y, z);
      pl.userData.nightIntensity = intensity;
      parent.add(pl);
      nightLights.push(pl);
    }

    // 1. Central Clock / Bell Tower (-7, -3)
    (function buildClockTower() {
      const x = -7.5;
      const z = -2.5;
      const y = getH(x, z);
      const tower = new THREE.Group();

      const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 5.8, 2.6), creamWall);
      base.position.y = 2.9;
      base.castShadow = true;
      base.receiveShadow = true;
      tower.add(base);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(2.85, 0.3, 2.85), stoneMat);
      trim.position.y = 5.8;
      tower.add(trim);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.25, 2.8, 4), roofRed);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 7.35;
      roof.castShadow = true;
      tower.add(roof);

      // Spire finial
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.1, 1.1, 6), bronzeMat);
      spire.position.y = 9.1;
      tower.add(spire);

      // Clock face (front + back) with rim and hands
      [1.32, -1.32].forEach((cz) => {
        const sign = cz > 0 ? 1 : -1;
        const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.06, 6, 18), darkWoodMat);
        bezel.position.set(0, 4.4, cz);
        tower.add(bezel);

        const dial = new THREE.Mesh(
          new THREE.CircleGeometry(0.6, 16),
          new THREE.MeshStandardMaterial({ color: '#fcf8ef', roughness: 0.5 })
        );
        dial.position.set(0, 4.4, cz + 0.01 * sign);
        if (cz < 0) dial.rotation.y = Math.PI;
        tower.add(dial);

        const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.03), darkWoodMat);
        hourHand.position.set(0.08 * sign, 4.5, cz + 0.03 * sign);
        hourHand.rotation.z = -0.5;
        tower.add(hourHand);

        const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.46, 0.03), darkWoodMat);
        minHand.position.set(-0.12 * sign, 4.52, cz + 0.04 * sign);
        minHand.rotation.z = 0.7;
        tower.add(minHand);
      });

      // Glowing windows
      [2.2, 3.3].forEach((wy) => {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.75), glowMat);
        win.position.set(0, wy, 1.31);
        tower.add(win);
      });

      addWarmLight(tower, 0, 3.8, 2.0, 2.0, 12);
      tower.position.set(x, y - 0.1, z);
      group.add(tower);
    })();

    // 2. Observatory Dome (15.5, -5.5)
    (function buildObservatory() {
      const x = 15.5;
      const z = -5.5;
      const y = getH(x, z);
      const obs = new THREE.Group();

      const body = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 3.2, 16), creamWall);
      body.position.y = 1.6;
      body.castShadow = true;
      body.receiveShadow = true;
      obs.add(body);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(2.42, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        bronzeMat
      );
      dome.position.y = 3.2;
      dome.castShadow = true;
      obs.add(dome);

      // Slit rib + brass telescope barrel
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.2, 2.55), darkWoodMat);
      slit.position.set(0, 4.1, 0.6);
      obs.add(slit);

      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.2, 10), bronzeMat);
      scope.rotation.x = Math.PI / 3;
      scope.position.set(0, 4.5, 1.45);
      obs.add(scope);

      // Windows
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), glowMat);
        win.position.set(Math.sin(a) * 2.52, 1.6, Math.cos(a) * 2.52);
        win.rotation.y = a;
        obs.add(win);
      }

      addWarmLight(obs, 0, 2.0, 3.2, 1.6, 11);
      obs.position.set(x, y - 0.2, z);
      group.add(obs);
    })();

    // 3. Three Windmills
    const windmillSails = [];
    const windmillCoords = [
      { x: -16.5, z: -7.5, rot: 0.4 },
      { x: 11.5, z: 2.5, rot: -0.35 },
      { x: -5.5, z: -18.5, rot: 0.2 }
    ];
    windmillCoords.forEach((cfg) => {
      const y = getH(cfg.x, cfg.z);
      const wm = new THREE.Group();

      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.65, 4.6, 12), creamWall);
      body.position.y = 2.3;
      body.castShadow = true;
      body.receiveShadow = true;
      wm.add(body);

      // Balcony ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.08, 6, 16), woodMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 2.8;
      wm.add(ring);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.38, 1.4, 12), roofBrown);
      cap.position.y = 5.25;
      cap.castShadow = true;
      wm.add(cap);

      // Sails hub
      const hub = new THREE.Group();
      hub.position.set(0, 4.1, 1.25);

      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8), darkWoodMat);
      axle.rotation.x = Math.PI / 2;
      hub.add(axle);

      for (let b = 0; b < 4; b++) {
        const bladeGroup = new THREE.Group();
        bladeGroup.rotation.z = (b * Math.PI) / 2;

        const spar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 0.08), woodMat);
        spar.position.y = 1.3;
        bladeGroup.add(spar);

        const sail = new THREE.Mesh(
          new THREE.BoxGeometry(0.68, 2.0, 0.04),
          new THREE.MeshStandardMaterial({ color: '#f3ebd8', roughness: 0.85 })
        );
        sail.position.set(0.32, 1.55, 0.03);
        sail.castShadow = true;
        bladeGroup.add(sail);

        hub.add(bladeGroup);
      }

      wm.add(hub);
      windmillSails.push(hub);

      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), glowMat);
      win.position.set(0, 1.8, 1.52);
      wm.add(win);

      addWarmLight(wm, 0, 2.2, 2.2, 1.2, 9);
      wm.position.set(cfg.x, y - 0.15, cfg.z);
      wm.rotation.y = cfg.rot;
      group.add(wm);
    });

    // 4. Village Cottages (Cozy Animal Crossing style houses with round chimneys & colorful roofs)
    function createCottage(x, z, rotY, roofMat, scale = 1, hasWatermill = false) {
      const y = getH(x, z);
      const house = new THREE.Group();

      const walls = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.65, 2.0), creamWall);
      walls.position.y = 0.825;
      walls.castShadow = true;
      walls.receiveShadow = true;
      house.add(walls);

      // Cute wooden base trim
      const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.25, 2.08), woodMat);
      baseTrim.position.y = 0.125;
      house.add(baseTrim);

      // Rounded overhang roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.95, 1.45, 4), roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.1, 0.95, 1.0);
      roof.position.y = 2.35;
      roof.castShadow = true;
      house.add(roof);

      // Round cartoon chimney with white smoke puff
      const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.85, 8), stoneMat);
      chim.position.set(0.65, 2.45, -0.35);
      house.add(chim);
      const smokePuff = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 8),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, transparent: true, opacity: 0.85 })
      );
      smokePuff.position.set(0.65, 3.0, -0.35);
      house.add(smokePuff);

      // Cute rounded door & handle
      const door = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.95), darkWoodMat);
      door.position.set(0, 0.5, 1.01);
      house.add(door);
      const doorKnob = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 6, 6),
        new THREE.MeshStandardMaterial({ color: '#ffdd55', roughness: 0.3, metalness: 0.6 })
      );
      doorKnob.position.set(0.18, 0.5, 1.03);
      house.add(doorKnob);

      // Windows with cute wooden frames
      [-0.65, 0.65].forEach((wx) => {
        const frame = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.52), woodMat);
        frame.position.set(wx, 0.95, 1.008);
        house.add(frame);
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), glowMat);
        win.position.set(wx, 0.95, 1.015);
        house.add(win);
      });
      [-1.16, 1.16].forEach((sx) => {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.42), glowMat);
        win.position.set(sx, 0.95, 0);
        win.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
        house.add(win);
      });

      // Front porch flower box!
      const planter = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.25), woodMat);
      planter.position.set(0.65, 0.35, 1.12);
      house.add(planter);
      for (let p = 0; p < 3; p++) {
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 6, 6),
          new THREE.MeshStandardMaterial({ color: ['#ff3366', '#ffdd00', '#33aaff'][p], roughness: 0.5 })
        );
        flower.position.set(0.45 + p * 0.2, 0.48, 1.12);
        house.add(flower);
      }

      let wheel = null;
      if (hasWatermill) {
        wheel = new THREE.Group();
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.1, 8, 16), woodMat);
        rim.rotation.y = Math.PI / 2;
        wheel.add(rim);
        for (let i = 0; i < 6; i++) {
          const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.7, 0.16), darkWoodMat);
          spoke.rotation.x = (i * Math.PI) / 6;
          wheel.add(spoke);
        }
        wheel.position.set(1.35, 0.65, 0);
        house.add(wheel);
      }

      addWarmLight(house, 0, 1.2, 1.6, 1.35, 9);
      house.position.set(x, y - 0.1, z);
      house.rotation.y = rotY;
      house.scale.setScalar(scale);
      group.add(house);
      return wheel;
    }

    const watermillWheel = createCottage(-3.8, 7.2, 0.35, roofRed, 1.0, true);
    createCottage(-9.8, 3.2, 0.5, roofOrange, 0.95);
    createCottage(-5.5, 2.2, 0.15, roofYellow, 0.9);
    createCottage(3.5, 1.8, -0.45, roofBlue, 0.95);
    createCottage(4.5, -4.5, -0.2, roofGreen, 0.92);
    createCottage(-3.2, -7.8, 0.25, roofPurple, 0.88);
    createCottage(9.5, -9.5, -0.5, roofRed, 0.9);
    createCottage(-12.5, -3.5, 0.7, roofOrange, 0.85);

    // 5. Wooden Footbridge across the river in village center (z = 2.8)
    (function buildFootbridge() {
      const bz = 2.8;
      const bx = window.SkyTerrain.getRiverX(bz);
      const by = getH(bx, bz) + 0.85;
      const bridge = new THREE.Group();

      const deck = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.18, 1.35), woodMat);
      deck.castShadow = true;
      deck.receiveShadow = true;
      bridge.add(deck);

      [-0.6, 0.6].forEach((rz) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.08, 0.08), darkWoodMat);
        rail.position.set(0, 0.55, rz);
        bridge.add(rail);
        [-1.9, 0, 1.9].forEach((px) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.65, 0.1), darkWoodMat);
          post.position.set(px, 0.28, rz);
          bridge.add(post);
        });
      });

      bridge.position.set(bx, by, bz);
      group.add(bridge);
    })();

    // 6. Train Station along the front-left track
    (function buildTrainStation() {
      const u = 0.28; // front-left curve
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const side = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const pos = pt.clone().addScaledVector(side, -2.6);
      const y = getH(pos.x, pos.z);

      const station = new THREE.Group();
      const plat = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.35, 2.1), stoneMat);
      plat.position.y = 0.18;
      plat.receiveShadow = true;
      station.add(plat);

      [[-1.5, -0.8], [1.5, -0.8], [-1.5, 0.8], [1.5, 0.8]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.6, 0.14), darkWoodMat);
        post.position.set(px, 1.0, pz);
        station.add(post);
      });

      const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 2.5), roofRed);
      roof.position.y = 1.9;
      roof.castShadow = true;
      station.add(roof);

      // Station wooden bench & TRA-style signboard
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.45), woodMat);
      bench.position.set(-0.6, 0.48, -0.35);
      station.add(bench);

      const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 0.08), darkWoodMat);
      signPost.position.set(1.25, 0.8, -0.45);
      station.add(signPost);

      const signBoard = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.45, 0.08),
        new THREE.MeshStandardMaterial({ color: '#1b4b8a', roughness: 0.5 })
      );
      signBoard.position.set(1.25, 1.32, -0.45);
      station.add(signBoard);

      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), glowMat);
      lantern.position.set(0, 1.65, 0.6);
      station.add(lantern);
      addWarmLight(station, 0, 1.5, 0.8, 2.2, 12);

      station.position.set(pos.x, y - 0.05, pos.z);
      station.lookAt(pt.x, y - 0.05, pt.z);
      group.add(station);
    })();

    // 7. Wooden Lookout Tower (front-center-right)
    (function buildLookout() {
      const x = -0.5;
      const z = 19.5;
      const y = getH(x, z);
      const tower = new THREE.Group();

      [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(([px, pz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 0.14), darkWoodMat);
        leg.position.set(px, 1.6, pz);
        leg.castShadow = true;
        tower.add(leg);
      });

      const floor = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.15, 1.9), woodMat);
      floor.position.y = 2.3;
      tower.add(floor);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.1, 4), roofRed);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 3.7;
      roof.castShadow = true;
      tower.add(roof);

      addWarmLight(tower, 0, 2.8, 0, 1.2, 9);
      tower.position.set(x, y - 0.1, z);
      group.add(tower);
    })();

    // 8. Crater Lake Gazebo (-6.8, -17.5)
    (function buildGazebo() {
      const x = -6.8;
      const z = -17.5;
      const y = getH(x, z);
      const gaz = new THREE.Group();

      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.2, 6), stoneMat);
      base.position.y = 0.1;
      gaz.add(base);

      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6), darkWoodMat);
        post.position.set(Math.cos(a) * 0.95, 0.8, Math.sin(a) * 0.95);
        gaz.add(post);
      }

      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.45, 0.9, 6), roofRed);
      roof.position.y = 1.9;
      roof.castShadow = true;
      gaz.add(roof);

      addWarmLight(gaz, 0, 1.3, 0, 1.3, 8);
      gaz.position.set(x, y - 0.1, z);
      group.add(gaz);
    })();

    // 9. Streetlamps along the track
    const lampCount = 16;
    for (let i = 0; i < lampCount; i++) {
      const u = i / lampCount;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const side = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      const pos = pt.clone().addScaledVector(side, 1.75);
      const ly = getH(pos.x, pos.z);
      if (Math.abs(pos.y - ly) > 1.2) continue; // skip bridge

      const lamp = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.65, 6), darkWoodMat);
      post.position.y = 0.82;
      lamp.add(post);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.26), glowMat);
      head.position.y = 1.7;
      lamp.add(head);

      if (i % 2 === 0) {
        addWarmLight(lamp, 0, 1.7, 0, 1.1, 8.5);
      }
      lamp.position.set(pos.x, ly - 0.05, pos.z);
      group.add(lamp);
    }

    return {
      group,
      setTimeMode(mode) {
        const isNight = mode === 'night';
        const isDusk = mode === 'dusk';
        glowMat.emissiveIntensity = isNight ? 2.0 : isDusk ? 0.85 : 0.0;
        nightLights.forEach((pl) => {
          pl.intensity = isNight ? pl.userData.nightIntensity : isDusk ? pl.userData.nightIntensity * 0.35 : 0;
        });
      },
      update(dt) {
        windmillSails.forEach((hub, idx) => {
          hub.rotation.z += dt * (0.55 + idx * 0.08);
        });
        if (watermillWheel) {
          watermillWheel.rotation.x += dt * 1.4;
        }
      }
    };
  }

  return { buildVillage };
})();
