export const puzzlePhoto = './assets/IMG_0913.jpeg';

const gridSize = 3;
const center = 4;
const startingOrder = [5, 0, 7, 2, 4, 8, 1, 6, 3];
const safeCode = 'BUBS';
const photoDescription = 'Bubs and Duck together with a bouquet of pink flowers.';

export function createPhotoPuzzle() {
  const order = [...startingOrder];
  let selected = null;
  let solved = false;
  let showingBack = false;
  const panel = document.createElement('div');
  panel.className = 'photo-puzzle';
  const instructions = document.createElement('p');
  instructions.textContent = 'Select two pieces to swap them. The center piece stays in place.';
  const grid = document.createElement('div');
  grid.className = 'photo-tiles';
  grid.setAttribute('role', 'group');
  grid.setAttribute('aria-label', 'Photograph pieces');
  const status = document.createElement('p');
  status.className = 'lock-feedback';
  status.setAttribute('role', 'status');
  const flip = document.createElement('button');
  flip.type = 'button';
  flip.className = 'inspection-action';
  flip.textContent = 'Turn the photo over';
  flip.hidden = true;

  const tiles = order.map((_, position) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.style.backgroundImage = `url("${puzzlePhoto}")`;
    tile.disabled = position === center;
    tile.addEventListener('click', () => {
      if (solved || position === center) return;
      if (selected === null) {
        selected = position;
        renderTiles();
        return;
      }
      if (position !== selected) {
        [order[position], order[selected]] = [order[selected], order[position]];
      }
      selected = null;
      solved = order.every((piece, index) => piece === index);
      if (solved) {
        instructions.textContent = 'Turn the restored photograph over to find the gallery safe code.';
        showRestoredPhoto();
        status.textContent = 'Photo restored. You can turn it over.';
        flip.focus();
      } else {
        renderTiles();
      }
    });
    grid.append(tile);
    return tile;
  });

  function renderTiles() {
    for (const [position, tile] of tiles.entries()) {
      const piece = order[position];
      tile.style.backgroundPosition = `${(piece % gridSize) * 50}% ${Math.floor(piece / gridSize) * 50}%`;
      tile.setAttribute('aria-pressed', String(selected === position));
      const row = Math.floor(position / gridSize) + 1;
      const column = position % gridSize + 1;
      tile.setAttribute('aria-label', position === center ? 'Fixed center piece' : `Photo piece at row ${row}, column ${column}`);
    }
  }

  function showRestoredPhoto() {
    grid.classList.add('is-restored');
    flip.hidden = false;
    flip.textContent = showingBack ? 'Show the front' : 'Turn the photo over';
    if (showingBack) {
      const back = document.createElement('div');
      back.className = 'photo-back';
      const heading = document.createElement('p');
      heading.textContent = 'For the gallery safe';
      const code = document.createElement('strong');
      code.textContent = safeCode;
      back.append(heading, code);
      grid.replaceChildren(back);
      status.textContent = `Gallery safe code: ${safeCode}`;
    } else {
      const photo = document.createElement('img');
      photo.src = puzzlePhoto;
      photo.alt = photoDescription;
      grid.replaceChildren(photo);
      status.textContent = '';
    }
  }

  flip.addEventListener('click', () => {
    if (!solved) return;
    showingBack = !showingBack;
    showRestoredPhoto();
  });
  renderTiles();
  panel.append(instructions, grid, status, flip);
  return { panel, code: safeCode };
}
