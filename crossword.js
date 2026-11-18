const entries = [
  { answer: 'RAISINGCANES', row: 1, column: 1, direction: 'down',
    clue: 'Where was your first hangout with Bubs after June 2nd?' },
  { answer: 'CUPCAKES', row: 2, column: 4, direction: 'down',
    clue: 'What food have you and Bubs baked together? (Hint: won against Banko and Saloni.)' },
  { answer: 'REDVELVET', row: 11, column: 0, direction: 'across',
    clue: 'What’s your favorite kind of cake?' },
  { answer: 'GRAPEVINEMILLS', row: 0, column: 13, direction: 'down',
    clue: 'Where was your first kiss with Bubs?' },
  { answer: 'SHANTI', row: 9, column: 4, direction: 'across',
    clue: 'What’s the middle word of the Bollywood movie you’re in the middle of watching with Bubs?' },
  { answer: 'LAPECORABIANCA', row: 2, column: 0, direction: 'across',
    clue: 'What’s the name of the restaurant you went to when Bubs visited you in NYC for the first time?' },
  { answer: 'ROBODUCK', row: 0, column: 8, direction: 'down',
    clue: 'What is the least favorite nickname Bubs has given you?' },
];

const tags = new Map([
  ['11,5', 'D'],
  ['3,8', 'U'],
  ['5,13', 'C'],
  ['8,4', 'K'],
]);
const codeOrder = 'DUCK';

function cellKey(row, column) {
  return `${row},${column}`;
}

function createLayout() {
  const cells = new Map();
  const starts = new Map();
  const words = [...entries].sort((a, b) => a.row - b.row || a.column - b.column).map(entry => {
    const start = cellKey(entry.row, entry.column);
    if (!starts.has(start)) starts.set(start, starts.size + 1);
    const word = { ...entry, number: starts.get(start), cells: [] };
    for (const [offset, letter] of Array.from(entry.answer).entries()) {
      const row = entry.row + (entry.direction === 'down' ? offset : 0);
      const column = entry.column + (entry.direction === 'across' ? offset : 0);
      const key = cellKey(row, column);
      if (!cells.has(key)) cells.set(key, { row, column, letter, words: [], tag: tags.get(key) });
      const cell = cells.get(key);
      cell.words.push(word);
      word.cells.push(cell);
    }
    return word;
  });
  return { cells, starts, words };
}

const arrowOffsets = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

export function createCrossword() {
  const { cells, starts, words } = createLayout();
  const taggedLetters = new Map(Array.from(tags, ([key, tag]) => [tag, cells.get(key).letter]));
  const code = Array.from(codeOrder, tag => taggedLetters.get(tag)).join('');
  const rows = Math.max(...Array.from(cells.values(), cell => cell.row)) + 1;
  const columns = Math.max(...Array.from(cells.values(), cell => cell.column)) + 1;
  const panel = document.createElement('div');
  panel.className = 'crossword-panel';
  const instructions = document.createElement('p');
  instructions.textContent = `Fill in the answers without spaces or punctuation. Read the letters you wrote in the tagged squares in ${Array.from(codeOrder).join(', ')} order. Those four letters open the ring box on the corner photo desk.`;
  const layout = document.createElement('div');
  layout.className = 'crossword-layout';
  const grid = document.createElement('div');
  grid.className = 'crossword-grid';
  grid.style.setProperty('--crossword-columns', columns);
  grid.setAttribute('role', 'group');
  grid.setAttribute('aria-label', 'Crossword squares');
  const clues = document.createElement('div');
  clues.className = 'crossword-clues';
  let activeWord;
  let activeInput;

  function selectWord(word) {
    if (activeWord === word) return;
    if (activeWord) {
      activeWord.button.setAttribute('aria-pressed', 'false');
      for (const cell of activeWord.cells) cell.input.classList.remove('is-current-word');
    }
    activeWord = word;
    word.button.setAttribute('aria-pressed', 'true');
    for (const cell of word.cells) cell.input.classList.add('is-current-word');
  }

  for (const direction of ['across', 'down']) {
    const heading = document.createElement('h3');
    heading.textContent = direction === 'across' ? 'Across' : 'Down';
    clues.append(heading);
    for (const word of words.filter(word => word.direction === direction)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = `crossword-clue-${direction}-${word.number}`;
      button.textContent = `${word.number}. ${word.clue}`;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        selectWord(word);
        (word.cells.find(cell => !cell.input.value) ?? word.cells[0]).input.focus();
      });
      clues.append(button);
      word.button = button;
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const key = cellKey(row, column);
      const cell = cells.get(key);
      const square = document.createElement('div');
      square.className = 'crossword-square';
      grid.append(square);
      if (!cell) continue;

      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.autocomplete = 'off';
      input.autocapitalize = 'characters';
      input.spellcheck = false;
      input.tabIndex = -1;
      const wordNames = cell.words.map(word => `${word.number} ${word.direction}`).join(' and ');
      const coordinate = `Row ${row + 1}, column ${column + 1}, ${wordNames}`;
      input.setAttribute('aria-label', cell.tag ? `${coordinate}, tag ${cell.tag}` : coordinate);
      input.setAttribute('aria-describedby', cell.words.map(word => word.button.id).join(' '));
      cell.input = input;
      square.append(input);
      for (const [className, value] of [['crossword-number', starts.get(key)], ['crossword-tag', cell.tag]]) {
        if (!value) continue;
        const marker = document.createElement('span');
        marker.className = className;
        marker.textContent = value;
        marker.setAttribute('aria-hidden', 'true');
        square.append(marker);
      }
      if (cell.tag) square.classList.add('is-tagged');

      input.addEventListener('focus', () => {
        if (activeInput) activeInput.tabIndex = -1;
        activeInput = input;
        input.tabIndex = 0;
        if (!cell.words.includes(activeWord)) selectWord(cell.words[0]);
        input.select();
      });
      input.addEventListener('input', () => {
        input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
        if (input.value) activeWord?.cells[activeWord.cells.indexOf(cell) + 1]?.input.focus();
      });
      input.addEventListener('keydown', event => {
        const offset = arrowOffsets[event.key];
        if (offset) {
          event.preventDefault();
          const direction = offset[0] ? 'down' : 'across';
          const word = cell.words.find(candidate => candidate.direction === direction);
          if (word) selectWord(word);
          cells.get(cellKey(row + offset[0], column + offset[1]))?.input.focus();
        } else if (event.key === 'Backspace' && !input.value) {
          activeWord?.cells[activeWord.cells.indexOf(cell) - 1]?.input.focus();
        }
      });
    }
  }
  activeInput = words[0].cells[0].input;
  activeInput.tabIndex = 0;
  layout.append(grid, clues);
  panel.append(instructions, layout);
  return { panel, code };
}
