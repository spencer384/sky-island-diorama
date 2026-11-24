// js/main.js — Scene bootstrap, post-processing, 4 camera modes, HUD controls & animation loop

(function () {
  const container = document.getElementById('canvas-container');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.2, 600);
  camera.position.set(2, 24, 82);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.info.autoReset = false;
  container.appendChild(renderer.domElement);

  // Post-processing (RenderPass + UnrealBloomPass for night/dusk glow)
  const composer = new THREE.EffectComposer(renderer);
  const renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.0, // strength (adjusted per time mode)
    0.55,
    0.72
  );
  composer.addPass(bloomPass);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 3.5, 0);
  controls.minDistance = 12;
  controls.maxDistance = 140;
  controls.maxPolarAngle = Math.PI * 0.72;

  // Build world modules
  const trackCurve = window.SkyTrain.createTrackCurve();
  const terrainSys = window.SkyTerrain.buildIslandGroup(trackCurve);
  scene.add(terrainSys.group);

  const villageSys = window.SkyArchitecture.buildVillage(trackCurve);
  scene.add(villageSys.group);

  const trainSys = window.SkyTrain.buildTrainSystem(trackCurve);
  scene.add(trainSys.group);

  const airshipSys = window.SkyAirship.buildAirshipAndDock();
  scene.add(airshipSys.group);

  const atmosphereSys = window.SkyAtmosphere.buildAtmosphere(scene);

  // State
  let camMode = 'orbit'; // orbit | train3rd | train1st | airship
  let timeMode = 'day';  // day | dusk | night

  function setTimeMode(mode) {
    timeMode = mode;
    atmosphereSys.setTimeMode(mode);
    villageSys.setTimeMode(mode);
    trainSys.setTimeMode(mode);
    airshipSys.setTimeMode(mode);

    if (mode === 'day') {
      bloomPass.strength = 0.0;
      renderer.toneMappingExposure = 0.96;
    } else if (mode === 'dusk') {
      bloomPass.strength = 0.28;
      renderer.toneMappingExposure = 1.05;
    } else {
      bloomPass.strength = 0.65;
      renderer.toneMappingExposure = 1.15;
    }

    document.querySelectorAll('[data-time]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.time === mode);
    });
  }

  function setCameraMode(mode) {
    camMode = mode;
    controls.enabled = mode === 'orbit';
    if (mode === 'orbit') {
      camera.position.set(2, 24, 82);
      controls.target.set(2, 1.5, 0);
      controls.update();
    }
    document.querySelectorAll('[data-cam]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.cam === mode);
    });
  }

  // UI Event Listeners
  document.querySelectorAll('[data-cam]').forEach((btn) => {
    btn.addEventListener('click', () => setCameraMode(btn.dataset.cam));
  });

  document.querySelectorAll('[data-time]').forEach((btn) => {
    btn.addEventListener('click', () => setTimeMode(btn.dataset.time));
  });

  const speedSlider = document.getElementById('speed-slider');
  speedSlider.addEventListener('input', (e) => {
    trainSys.setSpeed(parseFloat(e.target.value));
  });

  function doWhistle() {
    trainSys.triggerWhistle();
    window.SkyAudio.playWhistle();
  }
  document.getElementById('whistle-btn').addEventListener('click', doWhistle);

  const toggleHudBtn = document.getElementById('toggle-hud-btn');
  function toggleHud() {
    const hidden = document.body.classList.toggle('hud-hidden');
    toggleHudBtn.textContent = hidden ? '显示面板' : '隐藏面板';
  }
  toggleHudBtn.addEventListener('click', toggleHud);

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === '1') setCameraMode('orbit');
    else if (k === '2') setCameraMode('train3rd');
    else if (k === '3') setCameraMode('train1st');
    else if (k === '4') setCameraMode('airship');
    else if (k === 'q') setTimeMode('day');
    else if (k === 'w') setTimeMode('dusk');
    else if (k === 'e') setTimeMode('night');
    else if (k === 'h') toggleHud();
    else if (e.code === 'Space') {
      e.preventDefault();
      doWhistle();
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  // Stats HUD counters
  const statFps = document.getElementById('stat-fps');
  const statCalls = document.getElementById('stat-calls');
  const statTris = document.getElementById('stat-tris');
  const statObjs = document.getElementById('stat-objs');

  let frameCount = 0;
  let fpsAccum = 0;
  let totalObjects = 0;
  scene.traverse(() => totalObjects++);
  statObjs.textContent = totalObjects;

  const clock = new THREE.Clock();
  const camTargetPos = new THREE.Vector3();
  const camLookAt = new THREE.Vector3();

  function updateCamera(dt) {
    if (camMode === 'orbit') {
      controls.update();
    } else if (camMode === 'train3rd') {
      camTargetPos.set(0, 4.2, -7.2);
      trainSys.loco.localToWorld(camTargetPos);
      camLookAt.set(0, 1.5, 6.0);
      trainSys.loco.localToWorld(camLookAt);
      camera.position.lerp(camTargetPos, Math.min(1, dt * 6));
      camera.lookAt(camLookAt);
    } else if (camMode === 'train1st') {
      camTargetPos.set(0, 2.25, 0.5);
      trainSys.loco.localToWorld(camTargetPos);
      camLookAt.set(0, 1.6, 12.0);
      trainSys.loco.localToWorld(camLookAt);
      camera.position.copy(camTargetPos);
      camera.lookAt(camLookAt);
    } else if (camMode === 'airship') {
      camTargetPos.set(-1.5, -3.3, 1.4);
      airshipSys.ship.localToWorld(camTargetPos);
      camera.position.lerp(camTargetPos, Math.min(1, dt * 5));
      camera.lookAt(0, 4.5, 0);
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    terrainSys.update(dt, elapsed);
    villageSys.update(dt);
    trainSys.update(dt);
    airshipSys.update(dt, elapsed);
    atmosphereSys.update(dt, elapsed);

    updateCamera(dt);
    renderer.info.reset();
    composer.render();

    // Update telemetry every 0.35s
    frameCount++;
    fpsAccum += dt;
    if (fpsAccum >= 0.35) {
      statFps.textContent = Math.round(frameCount / fpsAccum);
      statCalls.textContent = renderer.info.render.calls;
      const tris = renderer.info.render.triangles;
      statTris.textContent = tris >= 1000 ? (tris / 1000).toFixed(1) + 'k' : tris;
      frameCount = 0;
      fpsAccum = 0;
    }
  }

  setTimeMode('day');
  animate();
})();
