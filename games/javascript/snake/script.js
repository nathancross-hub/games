const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const scoreText = document.querySelector("#score");
const startBtn = document.querySelector("#startBtn");
const restartBtn = document.querySelector("#restartBtn");

let tileSize = 20;
let tileCount = canvas.width / tileSize;

let snake;
let food;
let dx;
let dy;
let score;
let gameLoop;
let gameRunning;

function resetGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    dx = 1;
    dy = 0;
    score = 0;
    gameRunning = false;
    scoreText.textContent = score;

    clearInterval(gameLoop);
    drawGame();
}

function startGame() {
    if (gameRunning) {
        return;
    }

    gameRunning = true;
    gameLoop = setInterval(updateGame, 100);
}

function updateGame() {
    moveSnake();

    if (hitWall() || hitSelf()) {
        endGame();
        return;
    }

    if (snake[0].x === food.x && snake[0].y === food.y) {
        score++;
        scoreText.textContent = score;
        placeFood();
    } else {
        snake.pop();
    }

    drawGame();
}

function moveSnake() {
    let head = {
        x: snake[0].x + dx,
        y: snake[0].y + dy
    };

    snake.unshift(head);
}

function drawGame() {
    ctx.fillStyle = "#07140c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawFood();
    drawSnake();
}

function drawGrid() {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";

    for (let i = 0; i < tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * tileSize);
        ctx.lineTo(canvas.width, i * tileSize);
        ctx.stroke();
    }
}

function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
        if (i === 0) {
            ctx.fillStyle = "#6cff9c";
        } else {
            ctx.fillStyle = "#37b865";
        }

        ctx.fillRect(
            snake[i].x * tileSize,
            snake[i].y * tileSize,
            tileSize - 2,
            tileSize - 2
        );
    }
}

function drawFood() {
    ctx.fillStyle = "#ff4d4d";

    ctx.beginPath();
    ctx.arc(
        food.x * tileSize + tileSize / 2,
        food.y * tileSize + tileSize / 2,
        tileSize / 2.5,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

function placeFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };

    for (let part of snake) {
        if (part.x === food.x && part.y === food.y) {
            placeFood();
        }
    }
}

function hitWall() {
    return (
        snake[0].x < 0 ||
        snake[0].x >= tileCount ||
        snake[0].y < 0 ||
        snake[0].y >= tileCount
    );
}

function hitSelf() {
    for (let i = 1; i < snake.length; i++) {
        if (
            snake[0].x === snake[i].x &&
            snake[0].y === snake[i].y
        ) {
            return true;
        }
    }

    return false;
}

function endGame() {
    clearInterval(gameLoop);
    gameRunning = false;

    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
        "Game Over",
        canvas.width / 2,
        canvas.height / 2 - 10
    );

    ctx.font = "18px Arial";

    ctx.fillText(
        "Score: " + score,
        canvas.width / 2,
        canvas.height / 2 + 25
    );
}

document.addEventListener("keydown", function(event) {
    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
    ) {
        event.preventDefault();
    }
});

document.addEventListener("keydown", function(event) {

    if (
        (event.key === "ArrowUp" || event.key.toLowerCase() === "w") &&
        dy !== 1
    ) {
        dx = 0;
        dy = -1;
    }

    if (
        (event.key === "ArrowDown" || event.key.toLowerCase() === "s") &&
        dy !== -1
    ) {
        dx = 0;
        dy = 1;
    }

    if (
        (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") &&
        dx !== 1
    ) {
        dx = -1;
        dy = 0;
    }

    if (
        (event.key === "ArrowRight" || event.key.toLowerCase() === "d") &&
        dx !== -1
    ) {
        dx = 1;
        dy = 0;
    }
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);

resetGame();