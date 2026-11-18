import * as THREE from 'three';
import { createCrossword } from './crossword.js';
import { createPhotoPuzzle, puzzlePhoto } from './photo-puzzle.js';
import { addKey, box, buildExit, exitKey, furnishGallery, print } from './gallery-props.js';

const exhibits = {
  fossil: {
    title: 'Fossil Hall',
    number: '4',
    photo: './assets/IMG_1201.jpeg',
    description: 'Bubs and Duck beneath a tusked skeleton.',
    aspect: 3 / 4,
    position: [-3.96, 2.05, -0.9],
    rotation: Math.PI / 2,
  },
  entrance: {
    title: 'Museum Steps',
    number: '7',
    photo: './assets/IMG_5996.jpeg',
    description: 'Bubs and Duck outside the Met.',
    aspect: 4 / 3,
    position: [2.35, 2.05, -3.96],
    rotation: 0,
  },
  tree: {
    title: 'Grapevine Lights',
    number: '2',
    photo: './assets/IMG_7941.jpeg',
    description: 'Bubs and Duck in front of the Christmas tree in grapevine.',
    aspect: 3 / 4,
    position: [3.96, 2.05, 0.25],
    rotation: -Math.PI / 2,
  },
  neon: {
    title: 'The Great Gatsby',
    number: '6',
    photo: './assets/IMG_1399.jpeg',
    description: 'Bubs and Duck in New York outside The Great Gatsby.',
    aspect: 4 / 3,
    position: [2.05, 2.05, 3.96],
    rotation: Math.PI,
  },
};

const closingNotes = [
  'Check the photo with the tusked skeleton immediately after the photo on the museum steps.',
  'Check the photo with the Christmas tree sometime after the skeleton photo.',
  'The neon Broadway street photo is neither the first nor the last stop.',
];
const closingOrder = ['entrance', 'fossil', 'neon', 'tree'];

const deskPosition = { x: -1.18, z: 0.5 };
const deskWidth = 1.35;
const deskDepth = 0.72;
const closedDrawerZ = 0.31;
const drawerTravel = 0.34;
const drawerSpeed = 0.85;
const drawerHandleZ = 0.05;
const drawerHandleDepth = 0.065;
const safePosition = { x: -2.3, y: 1.1, z: -3.72 };
const safeClearance = 0.63;
const safeHingeZ = 0.22;
const safeDoorWidth = 0.74;
const safeDoorThickness = 0.055;
const safeOpenAngle = 1.2;
const exitOpenAngle = Math.PI / 2;
const photoDeskPosition = { x: 2.78, z: 2.82 };
const photoDeskWidth = 1.65;
const photoDeskDepth = 0.74;
const deskPhotos = [
  { src: './assets/IMG_1416.jpeg', alt: 'Bubs and Duck smiling together indoors.', width: 0.29, height: 0.39, x: -0.54 },
  { src: './assets/IMG_5681.jpeg', alt: 'Bubs and Duck dressed up together outdoors.', width: 0.30, height: 0.40, x: -0.14 },
  { src: './assets/IMG_8569.jpeg', alt: 'Bubs and Duck smiling together by the water.', width: 0.45, height: 0.34, x: 0.39 },
];

function addPictureLight(frame, width, height) {
  const brass = 0x886344;
  const fixtureY = height / 2 + 0.33;
  const fixtureZ = 0.53;
  const hoodWidth = width * 0.66;
  box(frame, brass, [0.16, 0.14, 0.045], [0, fixtureY, 0.02]);
  box(frame, brass, [0.047, 0.045, 0.48], [0, fixtureY, 0.28]);
  box(frame, brass, [hoodWidth, 0.087, 0.12], [0, fixtureY, fixtureZ]);
  const diffuser = new THREE.Mesh(
    new THREE.BoxGeometry(hoodWidth - 0.055, 0.012, 0.076),
    new THREE.MeshBasicMaterial({ color: 0xffe1ae }),
  );
  diffuser.position.set(0, fixtureY - 0.047, fixtureZ);
  frame.add(diffuser);

  const light = new THREE.SpotLight(0xffe2bd, 1, 3.4, 1.07, 0.85);
  light.position.set(0, fixtureY - 0.065, fixtureZ);
  light.target.position.set(0, 0.16, 0.04);
  frame.add(light, light.target);
}

function letteredPaper(lines, font = '54px Georgia, serif') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#f7f0df';
  context.fillRect(0, 0, 512, 256);
  context.strokeStyle = '#9a8965';
  context.lineWidth = 3;
  context.strokeRect(18, 18, 476, 220);
  context.fillStyle = '#183728';
  context.font = font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  lines.forEach((line, index) => {
    context.fillText(line, 256, 128 + (index - (lines.length - 1) / 2) * 61, 435);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildDesk(scene, { drawerAction, checklistAction, letterAction }) {
  const desk = new THREE.Group();
  desk.position.set(deskPosition.x, 0, deskPosition.z);
  scene.add(desk);
  const wood = 0x523828;
  const cabinetWood = 0x34251c;
  const runnerMetal = 0x9b8056;
  const trayWidth = 0.94;
  const trayDepth = 0.55;
  const trayWall = 0.04;
  const trayFront = 0.029;
  const trayCenterZ = trayFront - trayDepth / 2;

  box(desk, wood, [deskWidth, 0.09, deskDepth], [0, 0.94, 0]);
  box(desk, cabinetWood, [1.09, 0.06, 0.61], [0, 0.66, -0.035]);
  box(desk, cabinetWood, [1.09, 0.23, 0.055], [0, 0.805, -0.313]);
  for (const side of [-1, 1]) {
    box(desk, wood, [0.105, 0.9, 0.59], [side * 0.57, 0.45, 0]);
    box(desk, cabinetWood, [0.055, 0.23, 0.61], [side * 0.52, 0.805, -0.035]);
    box(desk, runnerMetal, [0.025, 0.033, 0.55], [side * (trayWidth / 2 + 0.012), 0.72, -0.013]);
  }

  const drawer = new THREE.Group();
  drawer.position.set(0, 0.79, closedDrawerZ);
  desk.add(drawer);
  box(drawer, wood, [1.05, 0.19, 0.065], [0, 0, 0]);
  box(drawer, 0xc6a773, [0.17, 0.035, drawerHandleDepth], [-0.12, 0, drawerHandleZ]);
  print(drawer, letteredPaper(['• • • •']), 0.18, 0.09, [0.35, 0, 0.037]);
  box(drawer, wood, [trayWidth, trayWall, trayDepth], [0, -0.071, trayCenterZ]);
  box(drawer, wood, [trayWidth, 0.13, trayWall], [0, -0.01, trayFront - trayDepth + trayWall / 2]);
  for (const side of [-1, 1]) {
    box(drawer, wood, [trayWall, 0.13, trayDepth], [side * (trayWidth - trayWall) / 2, -0.01, trayCenterZ]);
  }
  for (const part of drawer.children) part.userData = drawerAction;

  const note = print(desk, letteredPaper(['Closing', 'checklist']), 0.43, 0.26, [0.27, 0.991, 0.13]);
  note.rotation.x = -Math.PI / 2;
  note.userData = checklistAction;

  const letterCover = letteredPaper(['For Duck', '♡'], 'italic 60px "Segoe Print", "Bradley Hand", Georgia, serif');
  const letter = print(desk, letterCover, 0.35, 0.24, [-0.27, 0.991, 0.04]);
  letter.rotation.x = -Math.PI / 2;
  letter.rotateZ(-0.15);
  letter.userData = letterAction;
  return drawer;
}

function placeWorksheet(drawer, inspect) {
  const paper = print(drawer, letteredPaper(['Crossword', 'D  U  C  K']), 0.33, 0.17, [0.08, -0.046, -0.18]);
  paper.rotation.x = -Math.PI / 2;
  paper.userData = { label: 'Read crossword', inspect };
}

function buildSafe(scene, inspect) {
  const safe = new THREE.Group();
  safe.position.set(safePosition.x, safePosition.y, safePosition.z);
  scene.add(safe);
  box(safe, 0xb4aa96, [0.96, 0.66, 0.49], [0, -0.77, 0]);
  box(safe, 0xc5b9a2, [1.02, 0.08, 0.54], [0, -0.44, 0]);

  const steel = 0x344445;
  box(safe, steel, [0.88, 0.74, 0.07], [0, 0, -0.19]);
  for (const sign of [-1, 1]) {
    box(safe, steel, [0.065, 0.74, 0.42], [sign * 0.407, 0, 0]);
    box(safe, steel, [0.88, 0.065, 0.42], [0, sign * 0.337, 0]);
  }

  const door = new THREE.Group();
  door.position.set(-safeDoorWidth / 2, 0, safeHingeZ);
  safe.add(door);
  box(door, 0x516362, [safeDoorWidth, 0.61, safeDoorThickness], [safeDoorWidth / 2, 0, 0]);
  box(door, 0xb69b69, [0.11, 0.035, 0.075], [0.46, -0.08, 0.038]);
  print(door, letteredPaper(['A   B   C']), 0.16, 0.073, [0.54, 0.092, 0.03]);
  const action = { label: 'Inspect gallery safe', inspect };
  safe.traverse(part => { if (part.isMesh) part.userData = action; });
  return door;
}

async function buildPhotoDesk(scene, loader, inspectBox, inspectPhoto) {
  const desk = new THREE.Group();
  desk.position.set(photoDeskPosition.x, 0, photoDeskPosition.z);
  desk.rotation.y = Math.PI;
  scene.add(desk);
  const wood = 0x624532;
  box(desk, wood, [photoDeskWidth, 0.09, photoDeskDepth], [0, 0.94, 0]);
  box(desk, 0x523627, [1.48, 0.14, 0.07], [0, 0.84, 0.29]);
  for (const x of [-0.71, 0.71]) {
    for (const z of [-0.27, 0.27]) box(desk, wood, [0.095, 0.89, 0.095], [x, 0.445, z]);
  }

  const ringBox = new THREE.Group();
  ringBox.position.set(0.1, 0.986, 0.16);
  desk.add(ringBox);
  const velvet = 0x285342;
  box(ringBox, velvet, [0.32, 0.05, 0.26], [0, 0.025, 0]);
  for (const x of [-0.15, 0.15]) box(ringBox, velvet, [0.03, 0.075, 0.26], [x, 0.083, 0]);
  for (const z of [-0.118, 0.118]) box(ringBox, velvet, [0.30, 0.075, 0.026], [0, 0.083, z]);
  box(ringBox, 0xbda36c, [0.12, 0.057, 0.018], [0, 0.075, 0.139]);
  const lid = new THREE.Group();
  lid.position.set(0, 0.12, -0.13);
  ringBox.add(lid);
  box(lid, velvet, [0.33, 0.055, 0.27], [0, 0.027, 0.13]);
  const clasp = print(lid, letteredPaper(['• • • •']), 0.15, 0.065, [0, 0.056, 0.16]);
  clasp.rotation.x = -Math.PI / 2;
  const action = { label: 'Inspect the ring box', inspect: inspectBox };
  ringBox.traverse(part => { if (part.isMesh) part.userData = action; });

  await Promise.all(deskPhotos.map(async (photo, index) => {
    const texture = await loader.loadAsync(photo.src);
    texture.colorSpace = THREE.SRGBColorSpace;
    const frame = new THREE.Group();
    frame.position.set(photo.x, 1.011 + photo.height / 2, -0.19);
    frame.rotation.set(-0.17, (index - 1) * -0.13, 0);
    desk.add(frame);
    const border = box(frame, 0xae8e5f, [photo.width + 0.045, photo.height + 0.045, 0.048], [0, 0, 0]);
    const printMesh = print(frame, texture, photo.width, photo.height, [0, 0, 0.025]);
    border.userData = printMesh.userData = { label: 'Look at the desk photo', inspect: () => inspectPhoto(photo) };
  }));

  function placePhotoPieces(inspect) {
    const envelope = print(ringBox, letteredPaper(['For Duck']), 0.22, 0.15, [0, 0.064, 0.015]);
    envelope.rotation.x = -Math.PI / 2;
    envelope.userData = { label: 'Inspect the torn photo', inspect };
  }

  return { lid, placePhotoPieces };
}

export async function createClosingChecklist(scene, onExitUnlocked) {
  const dialog = document.querySelector('#inspection');
  const title = document.querySelector('#inspection-title');
  const content = document.querySelector('#inspection-content');
  const close = document.querySelector('#close-inspection');
  const form = document.querySelector('#drawer-form');
  const input = document.querySelector('#drawer-code');
  const feedback = document.querySelector('#drawer-feedback');
  const code = closingOrder.map(stop => exhibits[stop].number).join('');
  const crossword = createCrossword();
  const photoPuzzle = createPhotoPuzzle();
  let drawerOpened = false;
  let ringBoxOpened = false;
  let safeOpened = false;
  let doorOpened = false;
  let safeKey;
  const keys = new Map();

  function open(titleText, ...elements) {
    title.textContent = titleText;
    content.replaceChildren(...elements);
    form.hidden = true;
    feedback.textContent = '';
    if (!dialog.open) dialog.showModal();
  }

  function paragraph(text, className) {
    const element = document.createElement('p');
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function actionButton(text, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'inspection-action';
    button.textContent = text;
    button.addEventListener('click', action);
    return button;
  }

  function showChecklist() {
    const notes = document.createElement('ul');
    for (const note of closingNotes) {
      const item = document.createElement('li');
      item.textContent = note;
      notes.append(item);
    }
    open('Closing checklist',
      paragraph('Duck, work out tonight’s route. Check each of the four photos once.'),
      notes,
      paragraph('Enter the exhibit numbers in the order you’d visit them to open the curator’s drawer.'),
    );
  }

  function showBubsLetter() {
    const letter = document.createElement('div');
    letter.className = 'bubs-letter';
    letter.append(
      paragraph('Hey Duck,'),
      paragraph('I stepped out to use the bathroom, and now the security guards won’t let me back in! They did agree to pass you this note tho :D'),
      paragraph('I know you got da brains for a million escapes, so I am counting on you to solve this!'),
      paragraph('I lab you,\nBubs', 'bubs-signature'),
    );
    open('A note from Bubs', letter);
  }

  function showExhibit(exhibit) {
    const photo = document.createElement('img');
    photo.src = exhibit.photo;
    photo.alt = exhibit.description;
    open(exhibit.title, photo, paragraph(`Exhibit no. ${exhibit.number}`, 'exhibit-number'));
  }

  function showDeskPhoto(photo) {
    const image = document.createElement('img');
    image.src = photo.src;
    image.alt = photo.alt;
    open('Photo from the desk', image);
  }

  function showStickyNote(message) {
    open('Sticky note', paragraph(message, 'bubs-letter'));
  }

  function takeKey(key, prop) {
    if (keys.has(key.id)) return;
    keys.set(key.id, key);
    prop.removeFromParent();
    open(key.label, paragraph('Key picked up.'));
    title.focus();
  }

  function inspectKey(key, prop) {
    open(key.label, actionButton('Take key', () => takeKey(key, prop)));
  }

  function showExit() {
    if (doorOpened) return;
    if (keys.size === 0) {
      open('Exit door', paragraph('The door is locked.'));
      return;
    }
    const actions = document.createElement('div');
    actions.className = 'key-actions';
    const feedback = paragraph('', 'lock-feedback');
    feedback.setAttribute('role', 'status');
    for (const key of keys.values()) {
      actions.append(actionButton(`Try ${key.label.toLowerCase()}`, () => {
        if (key.id !== exitKey.id) {
          feedback.textContent = 'The key doesn’t turn.';
          return;
        }
        doorOpened = true;
        onExitUnlocked();
      }));
    }
    open('Exit door', actions, feedback);
  }

  function showCrossword() {
    open('Crossword from the drawer', crossword.panel);
    title.focus();
  }

  function showDrawer() {
    if (drawerOpened) {
      open('Drawer unlocked', paragraph('There’s a crossword inside the drawer.', 'drawer-success'),
        actionButton('Open crossword', showCrossword),
      );
      close.focus();
      return;
    }
    open('Curator’s drawer');
    input.value = '';
    form.hidden = false;
    input.focus();
  }

  function showLetterLock({ heading, inputId, expected, onUnlock }) {
    const lockForm = document.createElement('form');
    lockForm.className = 'letter-lock';
    const label = document.createElement('label');
    label.htmlFor = inputId;
    label.textContent = 'Four-letter code';
    const lockInput = document.createElement('input');
    lockInput.type = 'text';
    lockInput.id = inputId;
    lockInput.maxLength = 4;
    lockInput.pattern = '[A-Za-z]{4}';
    lockInput.autocomplete = 'off';
    lockInput.autocapitalize = 'characters';
    lockInput.spellcheck = false;
    lockInput.required = true;
    const unlock = document.createElement('button');
    unlock.type = 'submit';
    unlock.textContent = 'Unlock';
    const entry = document.createElement('div');
    entry.className = 'drawer-entry';
    entry.append(lockInput, unlock);
    const result = paragraph('', 'lock-feedback');
    result.setAttribute('role', 'status');
    lockForm.append(label, entry, result);
    lockForm.addEventListener('submit', event => {
      event.preventDefault();
      if (lockInput.value.toUpperCase() !== expected) {
        result.textContent = 'Incorrect code.';
        lockInput.select();
        return;
      }
      onUnlock();
    });
    open(heading, lockForm);
    lockInput.focus();
  }

  function showPhotoPuzzle() {
    open('The torn photograph', photoPuzzle.panel);
    title.focus();
  }

  function showRingBox() {
    if (ringBoxOpened) {
      open('Ring box unlocked', paragraph('There’s a torn photograph inside, tucked into an envelope marked For Duck.', 'drawer-success'),
        actionButton('Open the photograph', showPhotoPuzzle),
      );
      title.focus();
      return;
    }
    showLetterLock({
      heading: 'Ring box',
      inputId: 'ring-box-code',
      expected: crossword.code,
      onUnlock() {
        ringBoxOpened = true;
        photoDesk.placePhotoPieces(showPhotoPuzzle);
        showRingBox();
      },
    });
  }

  function showSafe() {
    if (safeOpened) {
      const actions = keys.has(exitKey.id)
        ? []
        : [actionButton('Take brass key', () => takeKey(exitKey, safeKey))];
      open('Safe unlocked', paragraph('The safe is open.', 'drawer-success'), ...actions);
      title.focus();
      return;
    }
    showLetterLock({
      heading: 'Gallery safe',
      inputId: 'safe-code',
      expected: photoPuzzle.code,
      onUnlock() {
        safeOpened = true;
        safeKey = addKey(safeDoor.parent, exitKey, [0, -0.303, 0.065], inspectKey);
        showSafe();
      },
    });
  }

  const drawer = buildDesk(scene, {
    drawerAction: { label: 'Inspect curator’s drawer', inspect: showDrawer },
    checklistAction: { label: 'Read closing checklist', inspect: showChecklist },
    letterAction: { label: 'Read the note from Bubs', inspect: showBubsLetter },
  });
  const safeDoor = buildSafe(scene, showSafe);
  const exitDoor = buildExit(scene, showExit);
  const blocksFurniture = furnishGallery(scene, {
    makePaper: letteredPaper, inspectNote: showStickyNote, inspectKey,
  });

  const loader = new THREE.TextureLoader();
  const exhibitLoads = Object.values(exhibits).map(async exhibit => {
    const texture = await loader.loadAsync(exhibit.photo);
    texture.colorSpace = THREE.SRGBColorSpace;
    const frame = new THREE.Group();
    frame.position.set(...exhibit.position);
    frame.rotation.y = exhibit.rotation;
    scene.add(frame);

    const height = exhibit.aspect > 1 ? 1.05 : 1.4;
    const width = height * exhibit.aspect;
    const action = { label: `Inspect ${exhibit.title}`, inspect: () => showExhibit(exhibit) };
    const border = box(frame, 0xad8c58, [width + 0.14, height + 0.14, 0.075], [0, 0, 0]);
    border.userData = action;
    const label = print(frame, letteredPaper([exhibit.title]), 0.67, 0.21, [0, -height / 2 - 0.25, 0.045]);
    label.userData = action;

    const photo = print(frame, texture, width, height, [0, 0, 0.04]);
    photo.userData = action;
    addPictureLight(frame, width, height);
  });
  const [photoDesk] = await Promise.all([
    buildPhotoDesk(scene, loader, showRingBox, showDeskPhoto),
    ...exhibitLoads,
  ]);
  const puzzlePreload = new Image();
  puzzlePreload.src = puzzlePhoto;

  close.addEventListener('click', () => dialog.close());
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (drawerOpened) return;
    if (input.value.trim() !== code) {
      feedback.textContent = 'Incorrect code.';
      input.select();
      return;
    }
    drawerOpened = true;
    placeWorksheet(drawer, showCrossword);
    showDrawer();
  });

  const openDrawerZ = closedDrawerZ + drawerTravel;
  const openHandleEdge = openDrawerZ + drawerHandleZ + drawerHandleDepth / 2;
  const openSafeEdge = safeHingeZ + Math.hypot(safeDoorWidth, safeDoorThickness / 2);
  function blocksMovement(x, z) {
    const clearance = 0.18;
    const atDesk = Math.abs(x - deskPosition.x) < deskWidth / 2 + clearance
      && z > deskPosition.z - deskDepth / 2 - clearance
      && z < deskPosition.z + openHandleEdge + clearance;
    const atSafe = Math.abs(x - safePosition.x) < safeClearance && z < safePosition.z + openSafeEdge + clearance;
    const atPhotoDesk = Math.abs(x - photoDeskPosition.x) < photoDeskWidth / 2 + clearance
      && Math.abs(z - photoDeskPosition.z) < photoDeskDepth / 2 + clearance;
    return atDesk || atSafe || atPhotoDesk || blocksFurniture(x, z, clearance);
  }

  function updateProps(seconds) {
    if (drawerOpened) {
      drawer.position.z = Math.min(openDrawerZ, drawer.position.z + drawerSpeed * seconds);
    }
    if (safeOpened) safeDoor.rotation.y = Math.max(-safeOpenAngle, safeDoor.rotation.y - 2.8 * seconds);
    if (ringBoxOpened) photoDesk.lid.rotation.x = Math.max(-1.25, photoDesk.lid.rotation.x - 3.5 * seconds);
    if (doorOpened) exitDoor.rotation.y = Math.min(exitOpenAngle, exitDoor.rotation.y + 2.6 * seconds);
  }

  return { dialog, blocksMovement, updateProps };
}
