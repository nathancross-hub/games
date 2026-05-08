const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const playerScoreText = document.querySelector("#playerScore");
const computerScoreText = document.querySelector("#computerScore");

const resultBox = document.querySelector("#resultBox");
const resultTitle = document.querySelector("#resultTitle");
const resultMessage = document.querySelector("#resultMessage");

const startBtn = document.querySelector("#startBtn");
const restartBtn = document.querySelector("#restartBtn");

let player;
let computer;
let ball;

let playerScore;
let computerScore;

let upPressed = false;
let downPressed = false;

let gameRunning = false;
let gameOver = false;

let animationId;

const winningScore = 5;

function resetGame() {
    player = {
        x: 25,
        y: canvas.height / 2 - 50,
        width: 14,
        height: 100,
        speed: 7
    };

    computer = {
        x: canvas.width - 39,
        y: canvas.height / 2 - 50,
        width: 14,
        height: 100,
        speed: 3.8
    };

    ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: 14,
        speedX: 8,
        speedY: 6
    };

    playerScore = 0;
    computerScore = 0;

    gameRunning = false;
    gameOver = false;

    playerScoreText.textContent = playerScore;
    computerScoreText.textContent = computerScore;

    resultBox.className = "result-box";
    resultTitle.textContent = "";
    resultMessage.textContent = "";

    cancelAnimationFrame(animationId);

    drawGame();
}

function startGame() {
    if (gameRunning || gameOver) {
        return;
    }

    resultBox.className = "result-box";

    gameRunning = true;
    gameLoop();
}

function gameLoop() {
    updateGame();
    drawGame();

    if (gameRunning) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function updateGame() {
    movePlayer();
    moveComputer();
    moveBall();
    checkPaddleCollision();
    checkScore();
}

function movePlayer() {
    if (upPressed) {
        player.y -= player.speed;
    }

    if (downPressed) {
        player.y += player.speed;
    }

    if (player.y < 0) {
        player.y = 0;
    }

    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
    }
}

function moveComputer() {
    let computerCenter = computer.y + computer.height / 2;
    let mistake = Math.random() * 30 - 15;

    if (computerCenter < ball.y + mistake - 35) {
        computer.y += computer.speed;
    }

    if (computerCenter > ball.y + mistake + 35) {
        computer.y -= computer.speed;
    }

    if (computer.y < 0) {
        computer.y = 0;
    }

    if (computer.y + computer.height > canvas.height) {
        computer.y = canvas.height - computer.height;
    }
}

function moveBall() {
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    if (
        ball.y - ball.size / 2 <= 0 ||
        ball.y + ball.size / 2 >= canvas.height
    ) {
        ball.speedY *= -1;
    }
}

function checkPaddleCollision() {
    if (
        ball.x - ball.size / 2 < player.x + player.width &&
        ball.x + ball.size / 2 > player.x &&
        ball.y + ball.size / 2 > player.y &&
        ball.y - ball.size / 2 < player.y + player.height
    ) {
        ball.speedX = Math.abs(ball.speedX);

        let hitSpot = ball.y - (player.y + player.height / 2);
        ball.speedY = hitSpot * 0.08;
    }

    if (
        ball.x + ball.size / 2 > computer.x &&
        ball.x - ball.size / 2 < computer.x + computer.width &&
        ball.y + ball.size / 2 > computer.y &&
        ball.y - ball.size / 2 < computer.y + computer.height
    ) {
        ball.speedX = -Math.abs(ball.speedX);

        let hitSpot = ball.y - (computer.y + computer.height / 2);
        ball.speedY = hitSpot * 0.08;
    }
}

function checkScore() {
    if (ball.x < 0) {
        computerScore++;
        computerScoreText.textContent = computerScore;
        resetBall(-1);
    }

    if (ball.x > canvas.width) {
        playerScore++;
        playerScoreText.textContent = playerScore;
        resetBall(1);
    }

    if (
        playerScore >= winningScore ||
        computerScore >= winningScore
    ) {
        endGame();
    }
}

function resetBall(direction) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;

    ball.speedX = 6 * direction;
    ball.speedY = Math.random() * 6 - 3;
}

function drawGame() {
    ctx.fillStyle = "#050914";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawCenterLine();
    drawPaddles();
    drawBall();

    if (!gameRunning && !gameOver) {
        drawStartText();
    }
}

function drawCenterLine() {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);
}

function drawPaddles() {
    ctx.fillStyle = "#6cd7ff";

    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(computer.x, computer.y, computer.width, computer.height);
}

function drawBall() {
    ctx.fillStyle = "white";

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawStartText() {
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";

    ctx.fillText("Press Start", canvas.width / 2, canvas.height / 2 - 10);

    ctx.font = "16px Arial";

    ctx.fillText(
        "Use W/S or Arrow Keys",
        canvas.width / 2,
        canvas.height / 2 + 25
    );
}

function endGame() {
    gameRunning = false;
    gameOver = true;

    cancelAnimationFrame(animationId);

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "38px Arial";
    ctx.textAlign = "center";

    if (playerScore > computerScore) {
        ctx.fillText("You Win!", canvas.width / 2, canvas.height / 2 - 15);

        resultTitle.textContent = "You Win!";
        resultMessage.textContent = "Nice job. You beat the computer.";
        resultBox.className = "result-box show win";
    } else {
        ctx.fillText("Computer Wins!", canvas.width / 2, canvas.height / 2 - 15);

        resultTitle.textContent = "You Lost";
        resultMessage.textContent = "The computer got you this time. Hit restart and try again.";
        resultBox.className = "result-box show lose";
    }

    ctx.font = "18px Arial";

    ctx.fillText(
        "Final Score: " + playerScore + " : " + computerScore,
        canvas.width / 2,
        canvas.height / 2 + 25
    );
}

document.addEventListener("keydown", function(event) {
    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
    ) {
        event.preventDefault();
    }

    if (
        event.key === "ArrowUp" ||
        event.key.toLowerCase() === "w"
    ) {
        upPressed = true;
    }

    if (
        event.key === "ArrowDown" ||
        event.key.toLowerCase() === "s"
    ) {
        downPressed = true;
    }
});

document.addEventListener("keyup", function(event) {
    if (
        event.key === "ArrowUp" ||
        event.key.toLowerCase() === "w"
    ) {
        upPressed = false;
    }

    if (
        event.key === "ArrowDown" ||
        event.key.toLowerCase() === "s"
    ) {
        downPressed = false;
    }
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);

resetGame();