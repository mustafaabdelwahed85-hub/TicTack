const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");
const resetScoreBtn = document.getElementById("resetScoreBtn");
const gameMode = document.getElementById("gameMode");
const difficulty = document.getElementById("difficulty");
const aiMessage = document.getElementById("aiMessage");
const botStatus = document.getElementById("botStatus");
const themeBtn = document.getElementById("themeBtn");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const playAgainBtn = document.getElementById("playAgainBtn");

const xScoreEl = document.getElementById("xScore");
const oScoreEl = document.getElementById("oScore");
const drawScoreEl = document.getElementById("drawScore");

let currentPlayer = "X";
let gameActive = true;
let board = ["", "", "", "", "", "", "", "", ""];

const humanPlayer = "X";
const aiPlayer = "O";

let score = JSON.parse(localStorage.getItem("ticTacToeScore")) || {
  x: 0,
  o: 0,
  draw: 0
};

const aiMessages = [
  "Nice move... but I saw that coming 👀",
  "Calculating your defeat 🤖",
  "Interesting choice, human 😎",
  "Let me think for 0.5 seconds...",
  "This board belongs to me 💀"
];

const winningConditions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

updateScore();

cells.forEach(cell => {
  cell.addEventListener("click", handleCellClick);
});

restartBtn.addEventListener("click", restartGame);
playAgainBtn.addEventListener("click", restartGame);

gameMode.addEventListener("change", () => {
  botStatus.textContent =
    gameMode.value === "ai" ? "🤖 AI Bot connected" : "🤖 AI Bot standby";
  restartGame();
});

difficulty.addEventListener("change", restartGame);

resetScoreBtn.addEventListener("click", () => {
  score = { x: 0, o: 0, draw: 0 };
  saveScore();
  updateScore();
});

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");
});

function handleCellClick(e) {
  const clickedIndex = Number(e.target.dataset.index);

  if (board[clickedIndex] !== "" || !gameActive) return;

  makeMove(clickedIndex, currentPlayer);

  if (checkResult()) return;

  if (gameMode.value === "ai") {
    currentPlayer = aiPlayer;
    statusText.textContent = "AI is thinking...";
    aiMessage.textContent = getRandomAIMessage();

    setTimeout(() => {
      const aiMove = getAIMove();

      if (aiMove !== undefined) {
        makeMove(aiMove, aiPlayer);
      }

      if (checkResult()) return;

      currentPlayer = humanPlayer;
      statusText.textContent = "Player X's Turn";
    }, 550);
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusText.textContent = `Player ${currentPlayer}'s Turn`;
  }
}

function makeMove(index, player) {
  board[index] = player;
  cells[index].textContent = player;
  cells[index].classList.add(player.toLowerCase());
}

function checkResult() {
  const result = getWinner(board);

  if (result.winner) {
    gameActive = false;

    result.combo.forEach(index => {
      cells[index].classList.add("winner");
    });

    if (result.winner === "X") score.x++;
    if (result.winner === "O") score.o++;

    saveScore();
    updateScore();

    const title =
      gameMode.value === "ai" && result.winner === aiPlayer
        ? "AI Wins 🤖"
        : `Player ${result.winner} Wins 🎉`;

    const text =
      gameMode.value === "ai" && result.winner === aiPlayer
        ? "The bot got you this time. Try again!"
        : "Great move! That was a clean win.";

    statusText.textContent = title;
    showModal(title, text);
    return true;
  }

  if (!board.includes("")) {
    gameActive = false;
    score.draw++;
    saveScore();
    updateScore();

    statusText.textContent = "It's a Draw 🤝";
    showModal("Draw Game 🤝", "No winner this round. Play again!");
    return true;
  }

  return false;
}

function getWinner(currentBoard) {
  for (const combo of winningConditions) {
    const [a, b, c] = combo;

    if (
      currentBoard[a] &&
      currentBoard[a] === currentBoard[b] &&
      currentBoard[b] === currentBoard[c]
    ) {
      return { winner: currentBoard[a], combo };
    }
  }

  return { winner: null, combo: [] };
}

function getAIMove() {
  if (difficulty.value === "easy") return getRandomMove();
  if (difficulty.value === "medium") return getMediumMove();
  return getBestMove();
}

function getRandomMove() {
  const emptyCells = board
    .map((cell, index) => (cell === "" ? index : null))
    .filter(index => index !== null);

  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function getMediumMove() {
  let move = findWinningMove(aiPlayer);
  if (move !== null) return move;

  move = findWinningMove(humanPlayer);
  if (move !== null) return move;

  if (board[4] === "") return 4;

  return getRandomMove();
}

function findWinningMove(player) {
  for (let i = 0; i < board.length; i++) {
    if (board[i] === "") {
      board[i] = player;

      if (getWinner(board).winner === player) {
        board[i] = "";
        return i;
      }

      board[i] = "";
    }
  }

  return null;
}

function getBestMove() {
  let bestScore = -Infinity;
  let bestMove;

  for (let i = 0; i < board.length; i++) {
    if (board[i] === "") {
      board[i] = aiPlayer;
      const score = minimax(board, 0, false);
      board[i] = "";

      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove;
}

function minimax(currentBoard, depth, isMaximizing) {
  const result = getWinner(currentBoard);

  if (result.winner === aiPlayer) return 10 - depth;
  if (result.winner === humanPlayer) return depth - 10;
  if (!currentBoard.includes("")) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;

    for (let i = 0; i < currentBoard.length; i++) {
      if (currentBoard[i] === "") {
        currentBoard[i] = aiPlayer;
        const score = minimax(currentBoard, depth + 1, false);
        currentBoard[i] = "";
        bestScore = Math.max(score, bestScore);
      }
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (let i = 0; i < currentBoard.length; i++) {
    if (currentBoard[i] === "") {
      currentBoard[i] = humanPlayer;
      const score = minimax(currentBoard, depth + 1, true);
      currentBoard[i] = "";
      bestScore = Math.min(score, bestScore);
    }
  }

  return bestScore;
}

function restartGame() {
  currentPlayer = "X";
  gameActive = true;
  board = ["", "", "", "", "", "", "", "", ""];
  statusText.textContent = "Player X's Turn";
  aiMessage.textContent = "New round started. Make your move.";

  cells.forEach(cell => {
    cell.textContent = "";
    cell.className = "cell";
  });

  modal.classList.add("hidden");
}

function showModal(title, text) {
  modalTitle.textContent = title;
  modalText.textContent = text;

  setTimeout(() => {
    modal.classList.remove("hidden");
  }, 700);
}

function getRandomAIMessage() {
  return aiMessages[Math.floor(Math.random() * aiMessages.length)];
}

function updateScore() {
  xScoreEl.textContent = score.x;
  oScoreEl.textContent = score.o;
  drawScoreEl.textContent = score.draw;
}

function saveScore() {
  localStorage.setItem("ticTacToeScore", JSON.stringify(score));
}