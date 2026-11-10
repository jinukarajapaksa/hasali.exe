const xoxBoardEl = document.querySelector('#xoxBoard');
const xoxMessage = document.querySelector('#xoxMessage');
const xoxStatus = document.querySelector('#xoxStatus');
const xoxTurn = document.querySelector('#xoxTurn');
let xoxBoard = Array(9).fill('');
let xoxOver = false;
let xoxActive = true;
let xoxLast = -1;
let xoxWinningLine = [];
const xoxScore = { wins: 0, losses: 0, draws: 0 };
const xoxLines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function xoxResult(board) {
  for (const line of xoxLines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a], line };
  }
  return board.every(Boolean) ? { winner: 'draw', line: [] } : null;
}

function xoxRender() {
  xoxBoardEl.innerHTML = '';
  xoxBoard.forEach((mark, index) => {
    const cell = document.createElement('button');
    cell.className = 'xox-cell';
    cell.type = 'button';
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', mark ? `Square ${index + 1}: ${mark}` : `Empty square ${index + 1}`);
    cell.textContent = mark;
    if (mark) cell.classList.add(mark === 'X' ? 'x-mark' : 'o-mark');
    if (index === xoxLast) cell.classList.add('place');
    if (xoxWinningLine.includes(index)) cell.classList.add('win');
    cell.disabled = Boolean(mark) || xoxOver || !xoxActive;
    cell.addEventListener('click', () => xoxPlayerMove(index));
    xoxBoardEl.append(cell);
  });
}

function xoxUpdateScore() {
  document.querySelector('#xoxWins').textContent = xoxScore.wins;
  document.querySelector('#xoxLosses').textContent = xoxScore.losses;
  document.querySelector('#xoxDraws').textContent = xoxScore.draws;
}

function xoxFinish(result) {
  xoxOver = true;
  xoxActive = false;
  xoxWinningLine = result.line;
  if (result.winner === 'X') {
    xoxScore.wins++;
    playSfx('win');
    xoxMessage.textContent = 'AYYYYYY';
    xoxStatus.textContent = 'YOU WIN';
    xoxTurn.textContent = 'X TAKES IT';
  } else if (result.winner === 'O') {
    xoxScore.losses++;
    playSfx('lose');
    xoxMessage.textContent = ':('; 
    xoxStatus.textContent = 'COMPUTER WINS';
    xoxTurn.textContent = 'O TAKES IT';
  } else {
    xoxScore.draws++;
    playSfx('draw');
    xoxMessage.textContent = 'Anna right';
    xoxStatus.textContent = 'DRAW GAME';
    xoxTurn.textContent = 'NOBODY BLINKED';
  }
  xoxUpdateScore();
  xoxRender();
}

function xoxMinimax(board, depth, maximizing) {
  const result = xoxResult(board);
  if (result) {
    if (result.winner === 'O') return 10 - depth;
    if (result.winner === 'X') return depth - 10;
    return 0;
  }
  const open = board.map((mark, index) => mark ? null : index).filter(index => index !== null);
  if (maximizing) {
    let best = -Infinity;
    open.forEach(index => { board[index] = 'O'; best = Math.max(best, xoxMinimax(board, depth + 1, false)); board[index] = ''; });
    return best;
  }
  let best = Infinity;
  open.forEach(index => { board[index] = 'X'; best = Math.min(best, xoxMinimax(board, depth + 1, true)); board[index] = ''; });
  return best;
}

function xoxComputerMove() {
  if (xoxOver) return;
  const open = xoxBoard.map((mark, index) => mark ? null : index).filter(index => index !== null);
  if (!open.length) return;
  let bestScore = -Infinity;
  let bestMoves = [];
  open.forEach(index => {
    xoxBoard[index] = 'O';
    const score = xoxMinimax(xoxBoard, 0, false);
    xoxBoard[index] = '';
    if (score > bestScore) { bestScore = score; bestMoves = [index]; }
    else if (score === bestScore) bestMoves.push(index);
  });
  const move = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  xoxBoard[move] = 'O';
  playSfx('move');
  xoxLast = move;
  const result = xoxResult(xoxBoard);
  if (result) xoxFinish(result);
  else { xoxActive = true; xoxStatus.textContent = 'Run it back'; xoxTurn.textContent = 'YOUR TURN / X'; xoxRender(); }
}

function xoxPlayerMove(index) {
  if (xoxOver || !xoxActive || xoxBoard[index]) return;
  xoxBoard[index] = 'X';
  playSfx('move');
  xoxLast = index;
  const result = xoxResult(xoxBoard);
  if (result) { xoxFinish(result); return; }
  xoxActive = false;
  xoxStatus.textContent = 'COMPUTER THINKING';
  xoxTurn.textContent = 'O IS PLOTTING';
  xoxRender();
  setTimeout(xoxComputerMove, 320);
}

function xoxNewGame(playSound = false) {
  xoxBoard = Array(9).fill('');
  xoxOver = false;
  xoxActive = true;
  xoxLast = -1;
  xoxWinningLine = [];
  xoxStatus.textContent = 'Run it back';
  xoxTurn.textContent = 'YOUR TURN / X';
  xoxMessage.textContent = 'Run it back';
  if (playSound) playSfx('reset');
  xoxRender();
}

function xoxShareText() {
  return `HASALI.EXE — XOX\nWins: ${xoxScore.wins} | Losses: ${xoxScore.losses} | Draws: ${xoxScore.draws}\n\nCan u beat my score?\n${location.href.split('#')[0]}`;
}

async function xoxShareScore() {
  const text = xoxShareText();
  try {
    if (navigator.share) { await navigator.share({ title: 'HASALI.EXE — XOX', text }); toast('score shared <3'); }
    else throw new Error('share unavailable');
  } catch (error) {
    if (error && error.name === 'AbortError') return;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else { const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.append(area); area.select(); document.execCommand('copy'); area.remove(); }
      toast('score copied <3');
    } catch { toast('could not copy — try again'); }
  }
}

document.querySelector('#xoxAgain').addEventListener('click', () => xoxNewGame(true));
document.querySelector('#xoxShare').addEventListener('click', () => { playSfx('share'); xoxShareScore(); });
xoxUpdateScore();
xoxNewGame();
