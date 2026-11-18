import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { createClosingChecklist } from './checklist.js';
import { limestoneTexture, marbleTexture } from './gallery-surfaces.js';
import { exitHeight, exitWidth, exitZ } from './gallery-props.js';

const canvas = document.querySelector('canvas');
const game = document.querySelector('#game');
const welcomeScreen = document.querySelector('#welcome-screen');
const enterMuseum = document.querySelector('#enter-museum');
const loadingStatus = document.querySelector('#loading-status');
const endingScreen = document.querySelector('#ending-screen');
const endingTitle = document.querySelector('#ending-title');
const playAgain = document.querySelector('#play-again');
const controlsPanel = document.querySelector('#controls');
const controlHint = document.querySelector('#control-hint');
const lookButtons = document.querySelector('#look-buttons');
const crosshair = document.querySelector('#crosshair');
const inspectPrompt = document.querySelector('#inspect-prompt');

const roomHalfWidth = 4;
const roomHeight = 4;
const wallThickness = 0.1;
const movementLimit = roomHalfWidth - 0.35;
const passageDepth = 1.6;
const passageEnd = exitZ - passageDepth;
const eyeHeight = 1.65;
const walkSpeed = 2.6;
const turnSpeed = THREE.MathUtils.degToRad(95);
const turnStep = THREE.MathUtils.degToRad(15);
const pitchLimit = THREE.MathUtils.degToRad(89);
const lookDirections = new Map([
  ['ArrowLeft', [1, 0]],
  ['ArrowRight', [-1, 0]],
  ['ArrowUp', [0, 1]],
  ['ArrowDown', [0, -1]],
]);

async function startRoom() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, 1, 0.05, 30);
  camera.position.set(0, eyeHeight, 2.6);
  camera.rotation.order = 'YXZ';

  function box(surface, width, height, depth, x, y, z) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial(surface);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
  }

  const span = roomHalfWidth * 2;
  const wallOffset = roomHalfWidth + wallThickness / 2;
  const anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  const wall = { map: limestoneTexture(anisotropy), roughness: 0.9 };
  const floor = { map: marbleTexture(anisotropy), roughness: 0.42 };
  box(floor, span, wallThickness, span, 0, -wallThickness / 2, 0);
  box({ color: 0xc7bfae }, span, wallThickness, span, 0, roomHeight + wallThickness / 2, 0);
  box(wall, span, roomHeight, wallThickness, 0, roomHeight / 2, wallOffset);
  for (const offset of [-wallOffset, wallOffset]) {
    box(wall, wallThickness, roomHeight, span, offset, roomHeight / 2, 0);
  }

  const halfOpening = exitWidth / 2;
  const frontShape = new THREE.Shape([
    new THREE.Vector2(-roomHalfWidth, 0), new THREE.Vector2(-halfOpening, 0),
    new THREE.Vector2(-halfOpening, exitHeight), new THREE.Vector2(halfOpening, exitHeight),
    new THREE.Vector2(halfOpening, 0), new THREE.Vector2(roomHalfWidth, 0),
    new THREE.Vector2(roomHalfWidth, roomHeight), new THREE.Vector2(-roomHalfWidth, roomHeight),
  ]);
  const frontGeometry = new THREE.ShapeGeometry(frontShape);
  const positions = frontGeometry.attributes.position;
  const uv = frontGeometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(i, (positions.getX(i) + roomHalfWidth) / span, positions.getY(i) / roomHeight);
  }
  const frontWall = new THREE.Mesh(frontGeometry, new THREE.MeshStandardMaterial({ ...wall, side: THREE.DoubleSide }));
  frontWall.position.z = exitZ;
  scene.add(frontWall);

  const hall = { color: 0xc7b79f };
  const passageCenter = exitZ - passageDepth / 2;
  for (const side of [-1, 1]) {
    box(hall, wallThickness, exitHeight, passageDepth, side * (halfOpening + wallThickness / 2), exitHeight / 2, passageCenter);
  }
  box(hall, exitWidth, exitHeight, wallThickness, 0, exitHeight / 2, passageEnd);
  box({ color: 0xd3c6af }, exitWidth, wallThickness, passageDepth, 0, -wallThickness / 2, passageCenter);
  box(hall, exitWidth, wallThickness, passageDepth, 0, exitHeight + wallThickness / 2, passageCenter);
  const passageLight = new THREE.PointLight(0xffddb0, 1.35, 2.15);
  passageLight.position.set(0, exitHeight - 0.3, passageEnd + 0.35);
  scene.add(passageLight);

  scene.add(new THREE.HemisphereLight(0xfff0dc, 0xc5c1b9, 1.05));

  const { dialog, blocksMovement, updateProps } = await createClosingChecklist(scene, finishGame);
  const controls = new PointerLockControls(camera, canvas);
  controls.minPolarAngle = Math.PI / 2 - pitchLimit;
  controls.maxPolarAngle = Math.PI / 2 + pitchLimit;
  const movementKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD']);
  const heldKeys = new Set();
  const movement = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  raycaster.far = 3.25;
  const aim = new THREE.Vector2();
  let hintTimeout;

  function targetAt(x = 0, y = 0) {
    camera.updateMatrixWorld();
    raycaster.setFromCamera(aim.set(x, y), camera);
    return raycaster.intersectObjects(scene.children)[0]?.object.userData;
  }

  function inspect(target) {
    if (!target?.inspect) return false;
    heldKeys.clear();
    controlHint.classList.remove('is-visible');
    inspectPrompt.hidden = true;
    target.inspect();
    if (controls.isLocked) controls.unlock();
    return true;
  }

  function finishGame() {
    game.inert = true;
    heldKeys.clear();
    clearTimeout(hintTimeout);
    controlHint.classList.remove('is-visible');
    controlsPanel.hidden = true;
    crosshair.hidden = true;
    inspectPrompt.hidden = true;
    if (dialog.open) dialog.close();
    if (controls.isLocked) controls.unlock();
    endingScreen.hidden = false;
    endingTitle.focus({ preventScroll: true });
  }

  endingScreen.addEventListener('animationend', event => {
    if (event.target === endingScreen && event.animationName === 'anniversary-fade') {
      renderer.setAnimationLoop(null);
    }
  });
  playAgain.addEventListener('click', () => window.location.reload());

  function showControlHint(message) {
    clearTimeout(hintTimeout);
    controlHint.textContent = message;
    controlHint.classList.add('is-visible');
    hintTimeout = setTimeout(() => controlHint.classList.remove('is-visible'), 5000);
  }

  function turn(yaw, pitch) {
    camera.rotation.y += yaw;
    camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x + pitch, -pitchLimit, pitchLimit);
  }

  for (const button of lookButtons.querySelectorAll('button')) {
    const [yaw, pitch] = lookDirections.get(button.dataset.look);
    button.addEventListener('click', () => turn(yaw * turnStep, pitch * turnStep));
  }
  lookButtons.hidden = false;

  const supportsMouseLook = typeof canvas.requestPointerLock === 'function';
  const keyboardHint = 'WASD to move · Arrow keys to look · Click or press E to inspect';
  const unlockedHint = supportsMouseLook
    ? keyboardHint + ' · Click the room for mouse look'
    : keyboardHint;
  canvas.addEventListener('click', event => {
    if (dialog.open) return;
    if (controls.isLocked) {
      inspect(targetAt());
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    const y = 1 - (event.clientY - bounds.top) / bounds.height * 2;
    if (!inspect(targetAt(x, y)) && supportsMouseLook) controls.lock();
  });
  controls.addEventListener('lock', () => {
    controlsPanel.hidden = true;
    showControlHint('WASD to move · Click or press E to inspect · Esc to release cursor');
  });
  controls.addEventListener('unlock', () => {
    heldKeys.clear();
    if (game.inert) return;
    controlsPanel.hidden = false;
    if (!dialog.open) showControlHint(unlockedHint);
  });
  dialog.addEventListener('close', () => {
    if (!game.inert) canvas.focus({ preventScroll: true });
  });
  document.addEventListener('pointerlockerror', () => {
    if (!game.inert) showControlHint('Mouse look could not start · Click the room to retry');
  });
  window.addEventListener('keydown', (event) => {
    if (game.inert || dialog.open || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.code === 'Escape' && !event.repeat && !controls.isLocked) {
      showControlHint(unlockedHint);
    }
    if (event.code === 'KeyE' && !event.repeat && inspect(targetAt())) return;
    if (movementKeys.has(event.code) || lookDirections.has(event.code)) {
      heldKeys.add(event.code);
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => heldKeys.delete(event.code));
  window.addEventListener('blur', () => heldKeys.clear());

  function resize() {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  }

  window.addEventListener('resize', resize);
  resize();

  let previousTime;
  function animate(time) {
    const seconds = Math.min((time - (previousTime ?? time)) / 1000, 0.05);
    previousTime = time;
    updateProps(seconds);

    if (heldKeys.size > 0) {
      const yaw = Number(heldKeys.has('ArrowLeft')) - Number(heldKeys.has('ArrowRight'));
      const pitch = Number(heldKeys.has('ArrowUp')) - Number(heldKeys.has('ArrowDown'));
      turn(yaw * turnSpeed * seconds, pitch * turnSpeed * seconds);

      movement.set(
        Number(heldKeys.has('KeyD')) - Number(heldKeys.has('KeyA')),
        Number(heldKeys.has('KeyW')) - Number(heldKeys.has('KeyS')),
      ).normalize().multiplyScalar(walkSpeed * seconds);

      camera.updateMatrix();
      const { x, z } = camera.position;
      controls.moveRight(movement.x);
      controls.moveForward(movement.y);
      const nextX = THREE.MathUtils.clamp(camera.position.x, -movementLimit, movementLimit);
      camera.position.x = blocksMovement(nextX, z) ? x : nextX;
      const nextZ = THREE.MathUtils.clamp(camera.position.z, -movementLimit, movementLimit);
      camera.position.z = blocksMovement(camera.position.x, nextZ) ? z : nextZ;
    }

    if (!game.inert && !dialog.open) {
      const target = targetAt();
      inspectPrompt.hidden = !target?.label;
      if (target?.label) {
        const prompt = `E · ${target.label}`;
        if (inspectPrompt.textContent !== prompt) inspectPrompt.textContent = prompt;
      }
    }
    renderer.render(scene, camera);
  }

  renderer.render(scene, camera);
  enterMuseum.addEventListener('click', () => {
    welcomeScreen.hidden = true;
    game.inert = false;
    crosshair.hidden = false;
    canvas.focus({ preventScroll: true });
    showControlHint(unlockedHint);
    renderer.setAnimationLoop(animate);
  }, { once: true });
  enterMuseum.textContent = 'Enter the museum';
  enterMuseum.disabled = false;
}

startRoom().catch(error => {
  console.error(error);
  enterMuseum.hidden = true;
  loadingStatus.textContent = 'The museum could not load. Refresh the page or try a browser with WebGL enabled.';
});
