
// ===================================
// TILE RUSH - GAME ENGINE
// ===================================


// ===================================
// HTML ELEMENTS
// ===================================

const tileBoard = document.getElementById("tileBoard");
const tray = document.getElementById("tray");
const trayCount = document.getElementById("trayCount");

const scoreDisplay = document.getElementById("score");
const bestDisplay = document.getElementById("best");
const gameStatus = document.getElementById("gameStatus");
const timerDisplay = document.getElementById("timer");
const tileCountDisplay = document.getElementById("tileCountDisplay");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const quitBtn = document.getElementById("quitBtn");

const restartModal = document.getElementById("restartModal");
const cancelRestart = document.getElementById("cancelRestart");
const confirmRestart = document.getElementById("confirmRestart");

const quitModal = document.getElementById("quitModal");
const cancelQuit = document.getElementById("cancelQuit");
const confirmQuit = document.getElementById("confirmQuit");

const gameOverModal = document.getElementById("gameOverModal");
const difficultyModal = document.getElementById("difficultyModal");
const loadingModal = document.getElementById("loadingModal");

const gameOverMessage = document.getElementById("gameOverMessage");
const gameOverScore = document.getElementById("gameOverScore");
const gameOverBest = document.getElementById("gameOverBest");

const difficultyScore = document.getElementById("difficultyScore");
const difficultyComment = document.getElementById("difficultyComment");

const retryBtn = document.getElementById("retryBtn");
const continueBtn = document.getElementById("continueBtn");

const loadingBarFill = document.getElementById("loadingBarFill");
const loadingText = document.getElementById("loadingText");

const confettiContainer = document.getElementById("confettiContainer");


// ===================================
// GAME VARIABLES
// ===================================

let tiles = [];
let selectedTiles = [];

let score = 0;
let difficultyPoints = 0;
let difficulty = 1;

let bestScore = Number(localStorage.getItem("tileRushBest")) || 0;

let gameStarted = false;
let gamePaused = false;
let gameOver = false;
let transitionInProgress = false;

let timeLeft = 10;

let timerInterval = null;
let loadingInterval = null;
let confettiTimeout = null;

const fruits = ["🍓", "🍊", "🍇", "🍉", "🥝", "🍍"];


// ===================================
// RANDOM FUNCTIONS
// ===================================

function shuffle(array) {

    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}


function createPairedFruits(tileAmount) {

    const fruitOrder = shuffle(fruits);
    const pairedFruits = [];

    for (let i = 0; i < tileAmount / 2; i++) {

        const fruit = fruitOrder[i % fruitOrder.length];

        pairedFruits.push(fruit, fruit);
    }

    return shuffle(pairedFruits);
}


// ===================================
// ORIGINAL BOARD LAYOUTS
// ===================================

const boardLayouts = [

    {
        top: [
            { x: 2, y: 25 },
            { x: 27, y: 25 },
            { x: 52, y: 25 },
            { x: 77, y: 25 }
        ],

        middle: [
            { x: 2, y: 90 },
            { x: 27, y: 90 },
            { x: 52, y: 90 },
            { x: 77, y: 90 }
        ],

        exposed: [
            { x: 2, y: 220 },
            { x: 27, y: 220 },
            { x: 52, y: 220 },
            { x: 77, y: 220 }
        ]
    },

    {
        top: [
            { x: 14, y: 15 },
            { x: 55, y: 15 },
            { x: 14, y: 105 },
            { x: 55, y: 105 }
        ],

        middle: [
            { x: 14, y: 80 },
            { x: 55, y: 80 },
            { x: 14, y: 170 },
            { x: 55, y: 170 }
        ],

        exposed: [
            { x: 2, y: 250 },
            { x: 27, y: 250 },
            { x: 52, y: 250 },
            { x: 77, y: 250 }
        ]
    },

    {
        top: [
            { x: 5, y: 15 },
            { x: 29, y: 65 },
            { x: 53, y: 15 },
            { x: 77, y: 65 }
        ],

        middle: [
            { x: 5, y: 80 },
            { x: 29, y: 130 },
            { x: 53, y: 80 },
            { x: 77, y: 130 }
        ],

        exposed: [
            { x: 2, y: 250 },
            { x: 27, y: 250 },
            { x: 52, y: 250 },
            { x: 77, y: 250 }
        ]
    },

    {
        top: [
            { x: 2, y: 35 },
            { x: 27, y: 5 },
            { x: 52, y: 35 },
            { x: 77, y: 5 }
        ],

        middle: [
            { x: 2, y: 100 },
            { x: 27, y: 70 },
            { x: 52, y: 100 },
            { x: 77, y: 70 }
        ],

        exposed: [
            { x: 2, y: 230 },
            { x: 27, y: 260 },
            { x: 52, y: 230 },
            { x: 77, y: 260 }
        ]
    }

];


// ===================================
// CHECK TILE COVERAGE
// ===================================

function isTileCovered(tile) {

    const boardWidth = tileBoard.clientWidth;

    const tileWidth = tile.tileWidth || 21;
    const tileHeight = tile.tileHeight || 87;

    return tiles.some(other => {

        if (!other.active || other.layer <= tile.layer) {
            return false;
        }

        const otherWidth = other.tileWidth || 21;
        const otherHeight = other.tileHeight || 87;

        const tileLeft = tile.x / 100 * boardWidth;
        const tileRight = tileLeft + tileWidth / 100 * boardWidth;

        const tileTop = tile.y;
        const tileBottom = tileTop + tileHeight;

        const otherLeft = other.x / 100 * boardWidth;
        const otherRight = otherLeft + otherWidth / 100 * boardWidth;

        const otherTop = other.y;
        const otherBottom = otherTop + otherHeight;

        const overlapX = Math.max(
            0,
            Math.min(tileRight, otherRight) -
            Math.max(tileLeft, otherLeft)
        );

        const overlapY = Math.max(
            0,
            Math.min(tileBottom, otherBottom) -
            Math.max(tileTop, otherTop)
        );

        const overlapArea = overlapX * overlapY;

        const tileArea =
            (tileWidth / 100 * boardWidth) * tileHeight;

        return tileArea > 0 && overlapArea / tileArea >= 0.12;
    });
}


// ===================================
// CREATE A NEW BOARD
// ===================================

function createBoard() {

    tileBoard.innerHTML = "";

    tiles = [];
    selectedTiles = [];

    const tileCount = Math.min(
        12 + (difficulty - 1) * 2,
        50
    );

    const stackCount = Math.min(
        4 + Math.floor((difficulty - 1) / 2) * 2,
        20
    );

    const exposedCount = tileCount - stackCount * 2;

    if (tileCountDisplay) {
        tileCountDisplay.textContent = tileCount + " TILES";
    }

    const fruitPool = shuffle(fruits);

    // DIFFICULTY 1

    if (difficulty === 1) {

        const layout = boardLayouts[
            Math.floor(Math.random() * boardLayouts.length)
        ];

        const topFruits = fruitPool.slice(0, 4);

        const middleFruits = shuffle([
            fruitPool[4],
            fruitPool[4],
            fruitPool[5],
            fruitPool[5]
        ]);

        const exposedFruits = [...topFruits];

        layout.top.forEach((position, index) => {

            tiles.push({
                id: "top_" + index,
                fruit: topFruits[index],
                x: position.x,
                y: position.y,
                rotation: 0,
                layer: 2,
                active: true,
                tileWidth: 21,
                tileHeight: 87
            });

        });

        layout.middle.forEach((position, index) => {

            tiles.push({
                id: "middle_" + index,
                fruit: middleFruits[index],
                x: position.x,
                y: position.y,
                rotation: 0,
                layer: 1,
                active: true,
                tileWidth: 21,
                tileHeight: 87
            });

        });

        layout.exposed.forEach((position, index) => {

            tiles.push({
                id: "exposed_" + index,
                fruit: exposedFruits[index],
                x: position.x,
                y: position.y,
                rotation: 0,
                layer: 1,
                active: true,
                tileWidth: 21,
                tileHeight: 87
            });

        });

        tileBoard.style.height = "350px";

    } else {

        // HIGHER DIFFICULTIES

        const topFruits = createPairedFruits(stackCount);
        const middleFruits = createPairedFruits(stackCount);
        const exposedFruits = createPairedFruits(exposedCount);

        const columns = 5;
        const stackRows = Math.ceil(stackCount / columns);

        const stackPositions = [];

        for (let i = 0; i < stackCount; i++) {

            const row = Math.floor(i / columns);
            const column = i % columns;

            stackPositions.push({
                x: 2 + column * 19,
                y: 20 + row * 80
            });

        }

        // TOP TILES

        stackPositions.forEach((position, index) => {

            tiles.push({
                id: "top_" + index,
                fruit: topFruits[index],
                x: position.x,
                y: position.y,
                rotation: 0,
                layer: 2,
                active: true,
                tileWidth: 15,
                tileHeight: 48
            });

        });

        // MIDDLE TILES

        stackPositions.forEach((position, index) => {

            tiles.push({
                id: "middle_" + index,
                fruit: middleFruits[index],
                x: position.x,
                y: position.y + 35,
                rotation: 0,
                layer: 1,
                active: true,
                tileWidth: 15,
                tileHeight: 48
            });

        });

        // EXPOSED TILES

        const exposedColumns = 6;

        const exposedStartY = 20 + stackRows * 80 + 20;
        const rowGap = 55;

        const patternOffset = Math.floor(Math.random() * 3);

        exposedFruits.forEach((fruit, index) => {

            const column = index % exposedColumns;
            const row = Math.floor(index / exposedColumns);

            const x = 1 + column * 16 +
                (row % 2 === 1 ? patternOffset : 0);

            const y = exposedStartY + row * rowGap;

            tiles.push({
                id: "exposed_" + index,
                fruit: fruit,
                x: x,
                y: y,
                rotation: 0,
                layer: 1,
                active: true,
                tileWidth: 15,
                tileHeight: 48
            });

        });

        const exposedRows = Math.ceil(
            exposedCount / exposedColumns
        );

        const boardHeight =
            exposedStartY +
            (exposedRows - 1) * rowGap +
            48 + 30;

        tileBoard.style.height =
            Math.max(350, boardHeight) + "px";
    }

    drawBoard();
}


// ===================================
// DRAW THE BOARD
// ===================================

function drawBoard() {

    tileBoard.innerHTML = "";

    const orderedTiles = [...tiles].sort(
        (a, b) => a.layer - b.layer
    );

    orderedTiles.forEach(tile => {

        if (!tile.active) return;

        const element = document.createElement("div");

        element.className = tile.layer === 2
            ? "tile tile-top"
            : "tile tile-bottom";

        element.textContent = tile.fruit;

        const tileWidth = tile.tileWidth || 21;
        const tileHeight = tile.tileHeight || 87;

        element.style.setProperty("--x", tile.x + "%");
        element.style.setProperty("--y", tile.y + "px");
        element.style.setProperty("--layer", tile.layer);

        element.style.width = tileWidth + "%";
        element.style.height = tileHeight + "px";

        element.style.setProperty(
            "--rotation",
            tile.rotation + "deg"
        );

        if (isTileCovered(tile)) {
            element.classList.add("covered");
        }

        element.addEventListener("click", () => {
            selectTile(tile);
        });

        tileBoard.appendChild(element);
    });
}


// ===================================
// SELECT A TILE
// ===================================

function selectTile(tile) {

    if (!gameStarted || gamePaused || gameOver) return;

    if (!tile.active) return;

    if (isTileCovered(tile)) return;

    tile.active = false;

    selectedTiles.push(tile);

    drawBoard();
    drawTray();

    checkForMatch();
}


// ===================================
// DRAW THE TRAY
// ===================================

function drawTray() {

    const slots = tray.querySelectorAll(".tray-slot");

    slots.forEach((slot, index) => {

        slot.textContent = selectedTiles[index]
            ? selectedTiles[index].fruit
            : "";

    });

    trayCount.textContent = selectedTiles.length + "/4";
}


// ===================================
// CHECK FOR MATCHES
// ===================================

function checkForMatch() {

    let matchFound = false;

    for (let i = 0; i < selectedTiles.length; i++) {

        for (let j = i + 1; j < selectedTiles.length; j++) {

            if (selectedTiles[i].fruit === selectedTiles[j].fruit) {

                selectedTiles.splice(j, 1);
                selectedTiles.splice(i, 1);

                score += 10;
                difficultyPoints += 10;

                scoreDisplay.textContent = score;

                if (score > bestScore) {

                    bestScore = score;

                    localStorage.setItem(
                        "tileRushBest",
                        bestScore
                    );

                    bestDisplay.textContent = bestScore;
                }

                gameStatus.textContent = "Nice match! +10 points";

                matchFound = true;

                break;
            }
        }

        if (matchFound) break;
    }

    drawTray();
    drawBoard();

    if (selectedTiles.length >= 4) {
        endGame("Your tray is full!");
        return;
    }

    const remainingTiles = tiles.some(tile => tile.active);

    if (!remainingTiles) {

        if (selectedTiles.length === 0) {
            clearDifficulty();
        } else {
            endGame("No more tiles to match!");
        }
    }
}


// ===================================
// TIMER SYSTEM
// ===================================

function getTimeLimit() {

    if (difficulty < 25) return 10;

    if (difficulty < 35) return 20;

    return 30;
}


function updateTimerDisplay() {

    if (!timerDisplay) return;

    timerDisplay.textContent =
        "00:" + String(timeLeft).padStart(2, "0");
}


function startTimer() {

    clearInterval(timerInterval);

    timeLeft = getTimeLimit();

    updateTimerDisplay();

    timerInterval = setInterval(() => {

        if (gamePaused || !gameStarted || gameOver) {
            return;
        }

        timeLeft--;

        updateTimerDisplay();

        if (timeLeft <= 0) {

            clearInterval(timerInterval);

            endGame("Time's up!");
        }

    }, 1000);
}


// ===================================
// START GAME
// ===================================

function startGame() {

    clearTimeout(confettiTimeout);

    clearInterval(loadingInterval);
    clearInterval(timerInterval);

    confettiContainer.innerHTML = "";
    confettiContainer.style.display = "none";

    score = 0;
    difficultyPoints = 0;
    difficulty = 1;

    gameOver = false;
    gamePaused = false;
    gameStarted = true;
    transitionInProgress = false;

    scoreDisplay.textContent = score;

    gameStatus.textContent = "Find matching fruits!";

    startBtn.textContent = "Game Started";

    pauseBtn.textContent = "Ⅱ";
    pauseBtn.setAttribute("aria-label", "Pause game");

    gameOverModal.classList.remove("show");
    difficultyModal.classList.remove("show");
    loadingModal.classList.remove("show");
    restartModal.classList.remove("show");
    quitModal.classList.remove("show");

    startDifficulty();
}


// ===================================
// START A DIFFICULTY
// ===================================

function startDifficulty() {

    gameStarted = true;
    gamePaused = false;
    gameOver = false;

    difficultyPoints = 0;

    gameStatus.textContent = "Find matching fruits!";

    createBoard();
    drawTray();

    startBtn.textContent = "Game Started";

    pauseBtn.textContent = "Ⅱ";
    pauseBtn.setAttribute("aria-label", "Pause game");

    startTimer();
}


// ===================================
// DIFFICULTY CLEARED
// ===================================

function clearDifficulty() {

    if (transitionInProgress || gameOver) return;

    gameStarted = false;
    gamePaused = false;
    transitionInProgress = true;

    clearInterval(timerInterval);

    difficultyScore.textContent = difficultyPoints;

    const comments = [
        "Amazing! You've matched every fruit.",
        "Brilliant work! You're on a roll.",
        "Fantastic! Your matching skills are sharp.",
        "Wonderful! Keep that winning streak going."
    ];

    difficultyComment.textContent =
        comments[Math.floor(Math.random() * comments.length)];

    gameStatus.textContent = "Difficulty cleared!";

    launchConfetti();

    setTimeout(() => {
        difficultyModal.classList.add("show");
    }, 350);
}


// ===================================
// CONFETTI ANIMATION
// ===================================

function launchConfetti() {

    confettiContainer.innerHTML = "";
    confettiContainer.style.display = "block";

    const colors = [
        "#F4C96B",
        "#B99CF5",
        "#F28B82",
        "#8ED6B2",
        "#7CC7E8",
        "#F6E7C8",
        "#F5A6C8"
    ];

    for (let i = 0; i < 110; i++) {

        const piece = document.createElement("div");

        piece.className = "confetti-piece";

        piece.style.left = Math.random() * 100 + "%";

        piece.style.backgroundColor =
            colors[Math.floor(Math.random() * colors.length)];

        piece.style.animationDuration =
            (3 + Math.random() * 2) + "s";

        piece.style.animationDelay =
            (Math.random() * 0.8) + "s";

        piece.style.width =
            (6 + Math.random() * 6) + "px";

        piece.style.height =
            (9 + Math.random() * 9) + "px";

        piece.style.borderRadius =
            Math.random() > 0.5 ? "50%" : "2px";

        confettiContainer.appendChild(piece);
    }

    confettiTimeout = setTimeout(() => {

        confettiContainer.style.display = "none";
        confettiContainer.innerHTML = "";

    }, 5500);
}


// ===================================
// CONTINUE TO NEXT DIFFICULTY
// ===================================

continueBtn.addEventListener("click", () => {

    difficultyModal.classList.remove("show");

    clearTimeout(confettiTimeout);

    confettiContainer.style.display = "none";
    confettiContainer.innerHTML = "";

    showLoadingScreen();
});


// ===================================
// LOADING SCREEN
// ===================================

function showLoadingScreen() {

    loadingModal.classList.add("show");

    loadingBarFill.style.width = "0%";
    loadingText.textContent = "Please wait...";

    let progress = 0;

    clearInterval(loadingInterval);

    loadingInterval = setInterval(() => {

        progress += 2;

        loadingBarFill.style.width = progress + "%";

        if (progress >= 100) {

            clearInterval(loadingInterval);

            loadingText.textContent = "Ready!";

            setTimeout(() => {

                loadingModal.classList.remove("show");

                difficulty++;

                startDifficulty();

                transitionInProgress = false;

            }, 400);
        }

    }, 50);
}


// ===================================
// START BUTTON
// ===================================

startBtn.addEventListener("click", () => {

    if (transitionInProgress) return;

    if (!gameStarted || gameOver) {
        startGame();
    }
});


// ===================================
// GAME OVER
// ===================================

function endGame(message) {

    if (gameOver) return;

    gameOver = true;
    gameStarted = false;
    gamePaused = false;

    clearInterval(timerInterval);

    pauseBtn.textContent = "Ⅱ";
    pauseBtn.setAttribute("aria-label", "Pause game");

    gameStatus.textContent = message + " Game over!";

    gameOverMessage.textContent =
        message + " Don't give up. You can try again!";

    gameOverScore.textContent = score;
    gameOverBest.textContent = bestScore;

    startBtn.textContent = "Play Again";

    gameOverModal.classList.add("show");
}


// ===================================
// TRY AGAIN
// ===================================

retryBtn.addEventListener("click", () => {

    startGame();
});


// ===================================
// PAUSE / RESUME TOGGLE
// ===================================

pauseBtn.addEventListener("click", () => {

    if (!gameStarted || gameOver || transitionInProgress) {
        return;
    }

    gamePaused = !gamePaused;

    if (gamePaused) {

        pauseBtn.textContent = "▶";
        pauseBtn.setAttribute("aria-label", "Resume game");

        gameStatus.textContent = "Game paused.";

    } else {

        pauseBtn.textContent = "Ⅱ";
        pauseBtn.setAttribute("aria-label", "Pause game");

        gameStatus.textContent = "Find matching fruits!";
    }

    // No popup is opened.
    // The timer automatically freezes while paused.
});


// ===================================
// RESTART CONFIRMATION
// ===================================

restartBtn.addEventListener("click", () => {

    if (transitionInProgress) return;

    restartModal.classList.add("show");
});

cancelRestart.addEventListener("click", () => {

    restartModal.classList.remove("show");
});

confirmRestart.addEventListener("click", () => {

    restartModal.classList.remove("show");

    startGame();
});


// ===================================
// QUIT CONFIRMATION
// ===================================

quitBtn.addEventListener("click", () => {

    if (!gameStarted || gameOver || transitionInProgress) {
        return;
    }

    // Show confirmation, even if the game is paused.
    quitModal.classList.add("show");
});


// CANCEL QUIT

cancelQuit.addEventListener("click", () => {

    quitModal.classList.remove("show");
});


// CONFIRM QUIT

confirmQuit.addEventListener("click", () => {

    // Stop all running activities.
    clearInterval(timerInterval);
    clearInterval(loadingInterval);
    clearTimeout(confettiTimeout);

    // Reset game state.
    gameStarted = false;
    gamePaused = false;
    gameOver = false;
    transitionInProgress = false;

    difficulty = 1;
    score = 0;
    difficultyPoints = 0;
    selectedTiles = [];

    // Close all popups.
    quitModal.classList.remove("show");
    restartModal.classList.remove("show");
    gameOverModal.classList.remove("show");
    difficultyModal.classList.remove("show");
    loadingModal.classList.remove("show");

    // Remove confetti.
    confettiContainer.innerHTML = "";
    confettiContainer.style.display = "none";

    // Reset the display.
    scoreDisplay.textContent = "0";
    bestDisplay.textContent = bestScore;

    gameStatus.textContent = "Ready when you are.";

    startBtn.textContent = "START GAME";

    pauseBtn.textContent = "Ⅱ";
    pauseBtn.setAttribute("aria-label", "Pause game");

    // Reset the board and tray.
    timeLeft = getTimeLimit();
    updateTimerDisplay();

    createBoard();
    drawTray();
});


// ===================================
// INITIAL DISPLAY
// ===================================

bestDisplay.textContent = bestScore;

timeLeft = getTimeLimit();
updateTimerDisplay();

pauseBtn.textContent = "Ⅱ";

createBoard();
drawTray();
