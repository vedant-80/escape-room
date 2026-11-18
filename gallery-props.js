import * as THREE from 'three';

export const exitWidth = 1.4;
export const exitHeight = 2.5;
export const exitZ = -4;
export const exitKey = { id: 'brass', label: 'Brass key', color: 0xd6ab55 };

export function box(parent, color, size, position) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({ color }),
  );
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

export function print(parent, texture, width, height, position) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 }),
  );
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

export function addKey(parent, key, position, inspectKey) {
  const prop = new THREE.Group();
  prop.position.set(...position);
  const material = new THREE.MeshStandardMaterial({ color: key.color, metalness: 0.45, roughness: 0.38 });
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.009, 8, 20), material);
  bow.rotation.x = -Math.PI / 2;
  bow.position.set(-0.067, 0.012, 0);
  prop.add(bow);
  box(prop, key.color, [0.143, 0.019, 0.023], [0.03, 0.012, 0]);
  box(prop, key.color, [0.023, 0.019, 0.045], [0.08, 0.012, 0.012]);
  box(prop, key.color, [0.018, 0.019, 0.031], [0.049, 0.012, 0.008]);
  const hitArea = box(prop, key.color, [0.24, 0.03, 0.115], [0, 0.009, 0]);
  hitArea.material.visible = false;
  const action = { label: `Inspect ${key.label.toLowerCase()}`, inspect: () => inspectKey(key, prop) };
  for (const mesh of prop.children) mesh.userData = action;
  parent.add(prop);
  return prop;
}

export function buildExit(scene, inspect) {
  const frame = 0x493528;
  for (const side of [-1, 1]) {
    box(scene, frame, [0.08, exitHeight + 0.06, 0.13], [side * (exitWidth / 2 + 0.035), exitHeight / 2 + 0.01, exitZ + 0.015]);
  }
  box(scene, frame, [exitWidth + 0.15, 0.105, 0.13], [0, exitHeight + 0.04, exitZ + 0.015]);

  const hinge = new THREE.Group();
  hinge.position.set(-exitWidth / 2 + 0.018, 0, exitZ + 0.025);
  scene.add(hinge);
  const doorWidth = exitWidth - 0.036;
  box(hinge, 0x674b37, [doorWidth, exitHeight - 0.035, 0.07], [doorWidth / 2, exitHeight / 2, 0]);
  for (const y of [0.58, 1.78]) {
    box(hinge, 0x785843, [0.96, 0.81, 0.022], [doorWidth / 2, y, 0.038]);
  }
  box(hinge, 0xb09565, [0.085, 0.17, 0.025], [doorWidth - 0.19, 1.03, 0.046]);
  box(hinge, 0xd2b681, [0.14, 0.034, 0.06], [doorWidth - 0.23, 1.06, 0.083]);
  const action = { label: 'Try the exit door', inspect };
  for (const mesh of hinge.children) mesh.userData = action;
  return hinge;
}

function lamp(parent, [x, y, z], height, intensity) {
  const brass = 0x9d8054;
  box(parent, brass, [0.27, 0.034, 0.25], [x, y + 0.018, z]);
  box(parent, brass, [0.035, height, 0.035], [x, y + height / 2, z]);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.135, 0.24, 0.26, 16, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xf4ddbd, emissive: 0xffc782, emissiveIntensity: 0.27, side: THREE.DoubleSide,
    }),
  );
  shade.position.set(x, y + height, z);
  parent.add(shade);
  const light = new THREE.PointLight(0xffd5a1, intensity, 2.6);
  light.position.set(x, y + height - 0.12, z);
  parent.add(light);
}

export function furnishGallery(scene, { makePaper, inspectNote, inspectKey }) {
  const wooden = 0x513a2c;
  const green = 0x435d50;
  const obstacles = [];

  function furniture(x, z, width, depth, rotation = 0) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    scene.add(group);
    const sideways = Math.abs(rotation) === Math.PI / 2;
    obstacles.push({ x, z, halfWidth: (sideways ? depth : width) / 2, halfDepth: (sideways ? width : depth) / 2 });
    return group;
  }

  function table(group, width, depth, height) {
    box(group, wooden, [width, 0.085, depth], [0, height - 0.043, 0]);
    for (const x of [-width / 2 + 0.065, width / 2 - 0.065]) {
      for (const z of [-depth / 2 + 0.06, depth / 2 - 0.06]) {
        box(group, wooden, [0.075, height - 0.07, 0.075], [x, (height - 0.07) / 2, z]);
      }
    }
  }

  const console = furniture(-2.72, 2.68, 1.48, 0.57, Math.PI);
  table(console, 1.48, 0.57, 0.88);
  lamp(console, [-0.5, 0.88, -0.07], 0.48, 1.05);
  const notes = [
    { x: -0.14, angle: -0.18, color: 0xffe29a, front: ['Hey dere cutie ♡'], body: 'BEEPMETEXTMECALLMEIFYOUWANNAREACHME!' },
    { x: 0.19, angle: 0.14, color: 0xffc9c8, front: ['For later'], body: 'Damn you look so fine trying to solve this puzzle ;)' },
  ];
  for (const note of notes) {
    const paper = print(console, makePaper(note.front), 0.25, 0.17, [note.x, 0.886, 0.1]);
    paper.material.color.setHex(note.color);
    paper.rotation.x = -Math.PI / 2;
    paper.rotateZ(note.angle);
    paper.userData = { label: 'Read sticky note', inspect: () => inspectNote(note.body) };
  }
  addKey(console, { id: 'silver', label: 'Silver key', color: 0xc2c8ce }, [0.5, 0.882, 0.04], inspectKey);

  const sideTable = furniture(2.83, -1.47, 0.53, 0.55);
  table(sideTable, 0.53, 0.55, 0.68);
  addKey(sideTable, { id: 'iron', label: 'Iron key', color: 0x6a7075 }, [0.03, 0.682, 0.05], inspectKey);
  const floorLamp = furniture(3.38, -2.6, 0.34, 0.34);
  lamp(floorLamp, [0, 0, 0], 1.66, 1.8);

  for (const [x, z, rotation] of [[2.96, -0.65, -Math.PI / 2], [-3.36, 1.12, Math.PI / 2]]) {
    const chair = furniture(x, z, 0.57, 0.57, rotation);
    table(chair, 0.57, 0.57, 0.46);
    box(chair, green, [0.49, 0.06, 0.49], [0, 0.48, 0]);
    for (const sign of [-1, 1]) box(chair, wooden, [0.067, 0.52, 0.068], [sign * 0.22, 0.69, -0.235]);
    box(chair, green, [0.46, 0.29, 0.065], [0, 0.8, -0.235]);
  }
  const bench = furniture(-3.4, -2, 1.28, 0.48, Math.PI / 2);
  table(bench, 1.28, 0.48, 0.47);
  box(bench, green, [1.2, 0.07, 0.41], [0, 0.5, 0]);

  return (x, z, clearance) => obstacles.some(prop =>
    Math.abs(x - prop.x) < prop.halfWidth + clearance && Math.abs(z - prop.z) < prop.halfDepth + clearance);
}
