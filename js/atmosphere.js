// js/atmosphere.js — 3 time-of-day presets, sky dome, stars, drifting clouds, flying birds & night fireflies

window.SkyAtmosphere = (function () {
  function buildAtmosphere(scene) {
    const group = new THREE.Group();
    group.name = 'SkyAtmosphere';

    // 1. Lights
    const hemiLight = new THREE.HemisphereLight('#b5e2ff', '#4d6b3c', 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight('#fff6e5', 1.35);
    sunLight.position.set(42, 58, 32);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 160;
    const d = 46;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // 2. Sky Gradient Dome
    const skyUniforms = {
      topColor: { value: new THREE.Color('#6baed6') },
      bottomColor: { value: new THREE.Color('#dcecf7') }
    };
    const skyMat = new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos).y;
          float t = clamp(h * 0.5 + 0.5, 0.0, 1.0);
          gl_FragColor = vec4(mix(bottomColor, topColor, pow(t, 0.75)), 1.0);
        }
      `
    });
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(260, 24, 16), skyMat);
    group.add(skyDome);

    // 3. Starfield (visible at night/dusk)
    const starCount = 650;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 210;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.cos(phi);
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 1.35,
      transparent: true,
      opacity: 0
    });
    const stars = new THREE.Points(starGeo, starMat);
    group.add(stars);

    // 4. Clustered Low-Poly Cloud Banks
    const clouds = [];
    const cloudMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.95,
      metalness: 0.0
    });
    const cloudSphere = new THREE.SphereGeometry(1, 10, 8);

    for (let c = 0; c < 22; c++) {
      const cluster = new THREE.Group();
      const puffs = 4 + Math.floor(Math.random() * 4);
      for (let p = 0; p < puffs; p++) {
        const s = 2.6 + Math.random() * 3.4;
        const m = new THREE.Mesh(cloudSphere, cloudMat);
        m.scale.set(s * 1.25, s * 0.85, s);
        m.position.set((p - puffs / 2) * 3.1, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 2.5);
        cluster.add(m);
      }
      const angle = (c / 22) * Math.PI * 2 + Math.random() * 0.2;
      const dist = 70 + Math.random() * 45;
      const cy = c % 3 === 0 ? -20 + Math.random() * 6 : 16 + Math.random() * 20;
      cluster.position.set(Math.cos(angle) * dist, cy, Math.sin(angle) * dist);
      cluster.userData = { angle, dist, speed: 0.008 + Math.random() * 0.008, baseY: cy };
      group.add(cluster);
      clouds.push(cluster);
    }

    // 5. Flying Birds (daytime & dusk)
    const birds = [];
    const birdMat = new THREE.MeshBasicMaterial({ color: '#2b333d', side: THREE.DoubleSide });
    for (let b = 0; b < 10; b++) {
      const bird = new THREE.Group();
      const wingGeo = new THREE.BoxGeometry(0.45, 0.04, 0.14);
      const leftW = new THREE.Mesh(wingGeo, birdMat);
      leftW.position.x = -0.22;
      const rightW = new THREE.Mesh(wingGeo, birdMat);
      rightW.position.x = 0.22;
      bird.add(leftW, rightW);

      const angle = (b / 10) * Math.PI * 2;
      const radius = 18 + Math.random() * 18;
      bird.userData = {
        angle,
        radius,
        y: 16 + Math.random() * 9,
        speed: 0.22 + Math.random() * 0.12,
        leftW,
        rightW,
        phase: Math.random() * Math.PI * 2
      };
      group.add(bird);
      birds.push(bird);
    }

    // 6. Night Fireflies
    const fireflyCount = 45;
    const fireflies = [];
    const ffMat = new THREE.MeshBasicMaterial({
      color: '#c9ff6b',
      transparent: true,
      opacity: 0
    });
    const ffGeo = new THREE.SphereGeometry(0.11, 6, 6);
    for (let i = 0; i < fireflyCount; i++) {
      const ff = new THREE.Mesh(ffGeo, ffMat);
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 24;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const baseY = window.SkyTerrain.getTerrainHeight(x, z) + 0.8 + Math.random() * 1.8;
      ff.position.set(x, baseY, z);
      ff.userData = { baseX: x, baseY, baseZ: z, phase: Math.random() * Math.PI * 2 };
      group.add(ff);
      fireflies.push(ff);
    }

    scene.add(group);

    function setTimeMode(mode) {
      if (mode === 'day') {
        // Bright, cheerful Animal Crossing blue sky
        skyUniforms.topColor.value.set('#3895e8');
        skyUniforms.bottomColor.value.set('#e2f4ff');
        scene.fog = new THREE.FogExp2('#d5eefa', 0.0006);
        hemiLight.color.set('#cceaff');
        hemiLight.groundColor.set('#558a2d');
        hemiLight.intensity = 0.65;
        sunLight.color.set('#fffbf0');
        sunLight.intensity = 1.45;
        sunLight.position.set(40, 55, 30);
        cloudMat.color.set('#ffffff');
        starMat.opacity = 0;
        ffMat.opacity = 0;
        birds.forEach((b) => (b.visible = true));
      } else if (mode === 'dusk') {
        skyUniforms.topColor.value.set('#4e4d7a');
        skyUniforms.bottomColor.value.set('#f7a474');
        scene.fog = new THREE.FogExp2('#e89f78', 0.0034);
        hemiLight.color.set('#ffc599');
        hemiLight.groundColor.set('#4f3b31');
        hemiLight.intensity = 0.72;
        sunLight.color.set('#ff9955');
        sunLight.intensity = 1.45;
        sunLight.position.set(-55, 18, -32);
        cloudMat.color.set('#ffd2b8');
        starMat.opacity = 0.25;
        ffMat.opacity = 0.25;
        birds.forEach((b) => (b.visible = true));
      } else {
        // night
        skyUniforms.topColor.value.set('#081024');
        skyUniforms.bottomColor.value.set('#1a2b4c');
        scene.fog = new THREE.FogExp2('#101c36', 0.0038);
        hemiLight.color.set('#3d5a8a');
        hemiLight.groundColor.set('#141c24');
        hemiLight.intensity = 0.42;
        sunLight.color.set('#9ec0ff');
        sunLight.intensity = 0.48;
        sunLight.position.set(-30, 50, -35);
        cloudMat.color.set('#223456');
        starMat.opacity = 0.92;
        ffMat.opacity = 0.85;
        birds.forEach((b) => (b.visible = false));
      }
    }

    setTimeMode('day');

    return {
      setTimeMode,
      update(dt, elapsed) {
        clouds.forEach((c) => {
          c.userData.angle += dt * c.userData.speed;
          c.position.x = Math.cos(c.userData.angle) * c.userData.dist;
          c.position.z = Math.sin(c.userData.angle) * c.userData.dist;
          c.position.y = c.userData.baseY + Math.sin(elapsed * 0.4 + c.userData.angle) * 0.5;
        });

        birds.forEach((b) => {
          if (!b.visible) return;
          b.userData.angle += dt * b.userData.speed;
          const nx = Math.cos(b.userData.angle) * b.userData.radius;
          const nz = Math.sin(b.userData.angle) * b.userData.radius;
          b.position.set(nx, b.userData.y + Math.sin(elapsed * 1.5 + b.userData.phase) * 0.6, nz);
          b.rotation.y = -b.userData.angle;
          const flap = Math.sin(elapsed * 10 + b.userData.phase) * 0.55;
          b.userData.leftW.rotation.z = flap;
          b.userData.rightW.rotation.z = -flap;
        });

        fireflies.forEach((ff) => {
          ff.position.x = ff.userData.baseX + Math.sin(elapsed * 1.1 + ff.userData.phase) * 0.8;
          ff.position.y = ff.userData.baseY + Math.sin(elapsed * 1.8 + ff.userData.phase) * 0.45;
          ff.position.z = ff.userData.baseZ + Math.cos(elapsed * 0.9 + ff.userData.phase) * 0.8;
        });
      }
    };
  }

  return { buildAtmosphere };
})();
