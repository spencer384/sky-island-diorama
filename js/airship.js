// js/airship.js — Wooden sky dock & moored zeppelin airship with glowing gondola

window.SkyAirship = (function () {
  function buildAirshipAndDock() {
    const group = new THREE.Group();
    group.name = 'AirshipAndDock';

    const woodMat = new THREE.MeshStandardMaterial({ color: '#6e492c', roughness: 0.9 });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: '#472f1c', roughness: 0.92 });

    // 1. Wooden Pier / Dock extending from right cliff edge (x = 32..44, z = 2)
    const dock = new THREE.Group();
    const startX = 31.5;
    const dockLen = 13.0;
    const dockY = window.SkyTerrain.getTerrainHeight(31.5, 2.0) + 0.5;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(dockLen, 0.25, 2.4), woodMat);
    deck.position.set(startX + dockLen / 2, dockY, 2.0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    dock.add(deck);

    // Tall wooden stilts/pilings
    for (let px = startX + 1.5; px <= startX + dockLen - 0.5; px += 2.8) {
      [-1.0, 1.0].forEach((pz) => {
        const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 8.5, 6), darkWoodMat);
        piling.position.set(px, dockY - 3.6, 2.0 + pz);
        piling.castShadow = true;
        dock.add(piling);
      });
    }

    // Dock lantern at the tip
    const lanternGlowMat = new THREE.MeshStandardMaterial({
      color: '#ffe6a3',
      emissive: '#ffaa33',
      emissiveIntensity: 0
    });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 6), darkWoodMat);
    post.position.set(startX + dockLen - 0.4, dockY + 0.8, 3.0);
    dock.add(post);

    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.28), lanternGlowMat);
    lantern.position.set(startX + dockLen - 0.4, dockY + 1.65, 3.0);
    dock.add(lantern);

    const dockLight = new THREE.PointLight('#ffbb55', 0, 12, 1.8);
    dockLight.position.set(startX + dockLen - 0.4, dockY + 1.7, 3.0);
    dock.add(dockLight);

    group.add(dock);

    // 2. Zeppelin Airship hovering beside dock
    const ship = new THREE.Group();
    const tanMat = new THREE.MeshStandardMaterial({ color: '#d8c296', roughness: 0.72 });
    const goldMat = new THREE.MeshStandardMaterial({ color: '#b98f46', roughness: 0.55, metalness: 0.2 });
    const finMat = new THREE.MeshStandardMaterial({ color: '#8f4736', roughness: 0.75 });

    // Striped balloon hull
    const hullGeo = new THREE.SphereGeometry(3.2, 24, 16);
    hullGeo.scale(2.55, 0.92, 0.92);
    const hull = new THREE.Mesh(hullGeo, tanMat);
    hull.castShadow = true;
    ship.add(hull);

    // Decorative bands around hull
    [-4.2, -1.6, 1.4, 4.2].forEach((bx) => {
      const rScale = Math.sqrt(Math.max(0.15, 1 - Math.pow(bx / 8.1, 2)));
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(2.94 * rScale, 0.08, 6, 24),
        goldMat
      );
      band.rotation.y = Math.PI / 2;
      band.position.x = bx;
      ship.add(band);
    });

    // Tail fins
    const finTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 0.12), finMat);
    finTop.position.set(-6.5, 1.2, 0);
    ship.add(finTop);

    const finBot = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.12), finMat);
    finBot.position.set(-6.5, -1.1, 0);
    ship.add(finBot);

    [-1.2, 1.2].forEach((fz) => {
      const sideFin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 1.3), finMat);
      sideFin.position.set(-6.5, 0, fz);
      ship.add(sideFin);
    });

    // Gondola cabin suspended underneath
    const gondola = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.15, 1.45), woodMat);
    gondola.position.set(0.3, -3.55, 0);
    gondola.castShadow = true;
    ship.add(gondola);

    // Suspension cables
    [[-1.4, -0.5], [1.9, -0.5], [-1.4, 0.5], [1.9, 0.5]].forEach(([cx, cz]) => {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 4), darkWoodMat);
      cable.position.set(cx, -2.6, cz);
      ship.add(cable);
    });

    // Gondola glowing windows
    [-0.75, 0.75].forEach((wz) => {
      [-1.1, 0, 1.1].forEach((wx) => {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.42), lanternGlowMat);
        win.position.set(0.3 + wx, -3.5, wz);
        if (wz < 0) win.rotation.y = Math.PI;
        ship.add(win);
      });
    });

    const cabinLight = new THREE.PointLight('#ffbe55', 0, 14, 1.8);
    cabinLight.position.set(0.3, -3.6, 0);
    ship.add(cabinLight);

    // Rear propeller
    const prop = new THREE.Group();
    prop.position.set(-1.95, -3.55, 0);
    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.18), darkWoodMat);
    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 1.2), darkWoodMat);
    prop.add(blade1, blade2);
    ship.add(prop);

    const baseShipPos = new THREE.Vector3(44.0, dockY + 5.8, -1.5);
    ship.position.copy(baseShipPos);
    ship.rotation.y = -0.22;
    group.add(ship);

    return {
      group,
      ship,
      setTimeMode(mode) {
        const isNight = mode === 'night';
        const isDusk = mode === 'dusk';
        lanternGlowMat.emissiveIntensity = isNight ? 2.1 : isDusk ? 0.9 : 0;
        dockLight.intensity = isNight ? 1.8 : isDusk ? 0.6 : 0;
        cabinLight.intensity = isNight ? 2.2 : isDusk ? 0.7 : 0;
      },
      update(dt, elapsed) {
        ship.position.y = baseShipPos.y + Math.sin(elapsed * 0.85) * 0.45;
        ship.rotation.z = Math.sin(elapsed * 0.6) * 0.025;
        prop.rotation.x += dt * 10.0;
      }
    };
  }

  return { buildAirshipAndDock };
})();
