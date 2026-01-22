const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d");
const scoreText = document.querySelector("#scoreText");
const resetButton = document.getElementById("resetButton");
const gameWidth = gameBoard.width;
const gameHeight = gameBoard.height;

const boardBackground = "#101018"; // was "white"
const snakeColor = "#7cff6b";     // main fill
const snakeBorder = "#2a7a2a";    // darker outline for separation

const foodColor = "#ffd700";       // was "red"

const unitSize = 25;

let running = false;
let xVelocity = unitSize;
let yVelocity = 0;
let foodX;
let foodY;
let score = 0;

let snake = [
    { x: unitSize * 2, y: 0 },
    { x: unitSize, y: 0 },
    { x: 0, y: 0 }
];


// ==== CRT Retro Render Setup ====
const RENDER_SCALE = 3; // 2–4 (higher = chunkier pixels)

const off = document.createElement('canvas');
off.width = Math.floor(gameWidth / RENDER_SCALE);
off.height = Math.floor(gameHeight / RENDER_SCALE);
const octx = off.getContext('2d', { alpha: false });
octx.imageSmoothingEnabled = false;

// Drawing context alias used by draw functions
let dctx = octx;

// Retro palette
const retro = {
    bg: "#101018",
    snake: "#7cff6b",
    food: "#ffd700",
    hud: "#c7c7ff",
    font: "18px 'VT323', monospace"
};

// Helpers to map world → low-res
const toLow = v => Math.floor(v / RENDER_SCALE);
const u = v => Math.max(1, Math.floor(v / RENDER_SCALE));

const highScoreEl = document.getElementById("highScoreText");
let highScore = Number(sessionStorage.getItem("snakeHighScore") || 0);

// show stored high score on load
if (highScoreEl) highScoreEl.textContent = highScore;



// Scanline overlay on main canvas
function drawScanlines() {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#000";
    for (let y = 0; y < gameHeight; y += 2) ctx.fillRect(0, y, gameWidth, 1);
    ctx.restore();
}



window.addEventListener("keydown", changeDirection);


resetButton.addEventListener("click", resetGame);




gameStart();


function gameStart() {
    running = true;
    scoreText.textContent = score;
    createFood();
    drawFood();
    nextTick();
};

function nextTick() {
    if (running) {
        setTimeout(() => {
            clearBoard();   // draw to offscreen low-res
            drawFood();     // offscreen
            moveSnake();
            drawSnake();    // offscreen


            // Blit to main canvas scaled up, then overlay scanlines
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(off, 0, 0, off.width, off.height, 0, 0, gameWidth, gameHeight);
            drawScanlines();

            checkGameOver();
            nextTick();
        }, 75);
    } else {
        displayGameOver();
    }
}


function clearBoard() {
    dctx.fillStyle = boardBackground;
    dctx.fillRect(0, 0, off.width, off.height);
}


function createFood() {
    function randomFood(min, max) {
        const randNum = Math.round((Math.random() * (max - min) + min) / unitSize) * unitSize;
        return randNum;
    }
    foodX = randomFood(0, gameWidth - unitSize);
    foodY = randomFood(0, gameWidth - unitSize);
};

function drawFood() {
    dctx.fillStyle = foodColor;
    dctx.fillRect(toLow(foodX), toLow(foodY), u(unitSize), u(unitSize));
}


function moveSnake() {
    const head = {
        x: snake[0].x + xVelocity,
        y: snake[0].y + yVelocity
    }

    snake.unshift(head);

    //if food was eaten
    if (snake[0].x == foodX && snake[0].y == foodY) {
        score += 1;
        scoreText.textContent = score;

        // update high score
        if (score > highScore) {
            highScore = score;
            sessionStorage.setItem("snakeHighScore", String(highScore));
            if (highScoreEl) highScoreEl.textContent = highScore;
        }

        createFood();
    }
    else {
        snake.pop();
    }
};

function drawSnake() {
    dctx.fillStyle = snakeColor;
    dctx.strokeStyle = snakeBorder;
    snake.forEach(p => {
        dctx.fillRect(toLow(p.x), toLow(p.y), u(unitSize), u(unitSize));
        if (snakeBorder !== "transparent") {
            dctx.strokeRect(toLow(p.x), toLow(p.y), u(unitSize), u(unitSize));
        }
    });
}


function changeDirection(event) {
    const keyPressed = event.keyCode;
    const LEFT = 37;
    const UP = 38;
    const RIGHT = 39;
    const DOWN = 40;

    const goingUp = (yVelocity == -unitSize);
    const goingDown = (yVelocity == unitSize);
    const goingRight = (xVelocity == unitSize);
    const goingLeft = (xVelocity == -unitSize);

    switch (true) {
        case (keyPressed == LEFT && !goingRight):
            xVelocity = -unitSize;
            yVelocity = 0;
            break;
        case (keyPressed == UP && !goingDown):
            xVelocity = 0;
            yVelocity = -unitSize;
            break;
        case (keyPressed == RIGHT && !goingLeft):
            xVelocity = unitSize;
            yVelocity = 0;
            break;
        case (keyPressed == DOWN && !goingUp):
            xVelocity = -0;
            yVelocity = unitSize;
            break;
    }
};

function checkGameOver() {
    switch (true) {
        case (snake[0].x < 0):
            running = false;
            break;
        case (snake[0].x >= gameWidth):
            running = false;
            break;
        case (snake[0].y < 0):
            running = false;
            break;
        case (snake[0].y >= gameHeight):
            running = false;
            break;
    }
    for (let i = 1; i < snake.length; i += 1) {
        if (snake[i].x == snake[0].x && snake[i].y == snake[0].y) {
            running = false;
        }
    }
};
function displayGameOver() {
    ctx.font = "bold 64px VT323, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#e8e8ff";
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    ctx.lineWidth = 8;




    running = false;
    document.getElementById("gameOverOverlay").classList.add("active");
    gameBoard.classList.add("is-gameover");


};

function resetGame() {
    score = 0;
    xVelocity = unitSize;
    yVelocity = 0;
    snake = [
        { x: unitSize * 2, y: 0 },
        { x: unitSize, y: 0 },
        { x: 0, y: 0 }
    ];
    gameStart();
    document.getElementById("gameOverOverlay").classList.remove("active");
    gameBoard.classList.remove("is-gameover");

};


