const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const scoreText = document.querySelector("#score");
const livesText = document.querySelector("#lives");
const waveText = document.querySelector("#wave");
const powerText = document.querySelector("#power");

const messageBox = document.querySelector("#messageBox");
const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");

const startBtn = document.querySelector("#startBtn");
const restartBtn = document.querySelector("#restartBtn");

let player;
let bullets;
let enemyBullets;
let enemies;
let powerUps;
let stars;
let boss;

let score;
let lives;
let wave;

let leftPressed = false;
let rightPressed = false;
let spacePressed = false;

let gameRunning = false;
let gameOver = false;

let animationId;
let enemyDirection;
let enemySpeed;
let enemyDropDistance;
let enemyShootTimer;

let activePower;
let powerTimer;

function resetGame() {
    player = {
        x: canvas.width / 2 - 22,
        y: canvas.height - 55,
        width: 44,
        height: 26,
        speed: 6,
        reload: 0,
        reloadMax: 18
    };

    bullets = [];
    enemyBullets = [];
    enemies = [];
    powerUps = [];
    stars = [];
    boss = null;

    score = 0;
    lives = 3;
    wave = 1;

    enemyDirection = 1;
    enemySpeed = 0.5;
    enemyDropDistance = 18;
    enemyShootTimer = 0;

    activePower = "None";
    powerTimer = 0;

    gameRunning = false;
    gameOver = false;

    makeStars();
    makeWave();
    updateStats();
    hideMessage();

    cancelAnimationFrame(animationId);
    drawGame();
}

function startGame() {
    if (gameOver) {
        return;
    }

    gameRunning = true;
    hideMessage();
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
    updateBullets();
    moveEnemies();
    moveBoss();
    enemyShoot();
    updatePowerUps();
    updatePowerTimer();
    checkCollisions();

    if (enemies.length === 0 && boss === null) {
        nextWave();
    }
}

function movePlayer() {
    if (leftPressed) {
        player.x -= player.speed;
    }

    if (rightPressed) {
        player.x += player.speed;
    }

    if (player.x < 0) {
        player.x = 0;
    }

    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }

    if (player.reload > 0) {
        player.reload--;
    }

    if (spacePressed && player.reload === 0) {
        shootPlayerBullet();
        player.reload = player.reloadMax;
    }
}

function shootPlayerBullet() {
    if (activePower === "Triple Shot") {
        bullets.push(makePlayerBullet(player.x + player.width / 2 - 3, player.y, -1.5));
        bullets.push(makePlayerBullet(player.x + player.width / 2 - 3, player.y, 0));
        bullets.push(makePlayerBullet(player.x + player.width / 2 - 3, player.y, 1.5));
    } else {
        bullets.push(makePlayerBullet(player.x + player.width / 2 - 3, player.y, 0));
    }
}

function makePlayerBullet(x, y, speedX) {
    return {
        x: x,
        y: y,
        width: 6,
        height: 14,
        speed: 8,
        speedX: speedX
    };
}

function updateBullets() {
    for (let bullet of bullets) {
        bullet.y -= bullet.speed;
        bullet.x += bullet.speedX;
    }

    for (let bullet of enemyBullets) {
        bullet.y += bullet.speed;
    }

    bullets = bullets.filter(function(bullet) {
        return bullet.y + bullet.height > 0 && bullet.x > -20 && bullet.x < canvas.width + 20;
    });

    enemyBullets = enemyBullets.filter(function(bullet) {
        return bullet.y < canvas.height;
    });
}

function makeWave() {
    enemies = [];
    boss = null;

    if (wave % 3 === 0) {
        makeBoss();
    } else {
        makeEnemies();
    }
}

function makeEnemies() {
    let rows = Math.min(3 + wave, 6);
    let cols = 9;
    let startX = 90;
    let startY = 65;
    let gapX = 62;
    let gapY = 42;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let type = getEnemyType(row);

            enemies.push({
                x: startX + col * gapX,
                y: startY + row * gapY,
                width: type.width,
                height: type.height,
                health: type.health,
                maxHealth: type.health,
                points: type.points,
                color: type.color,
                eyeColor: type.eyeColor,
                name: type.name
            });
        }
    }
}

function getEnemyType(row) {
    if (wave >= 4 && row === 0) {
        return {
            name: "tank",
            width: 42,
            height: 28,
            health: 3,
            points: 35,
            color: "#ff9f1c",
            eyeColor: "#050713"
        };
    }

    if (wave >= 2 && row <= 1) {
        return {
            name: "strong",
            width: 38,
            height: 26,
            health: 2,
            points: 20,
            color: "#ff5d73",
            eyeColor: "#050713"
        };
    }

    return {
        name: "normal",
        width: 36,
        height: 24,
        health: 1,
        points: 10 + row * 5,
        color: "#a8ff78",
        eyeColor: "#050713"
    };
}

function makeBoss() {
    boss = {
        x: canvas.width / 2 - 80,
        y: 70,
        width: 160,
        height: 70,
        health: 12 + wave * 3,
        maxHealth: 12 + wave * 3,
        speed: 2 + wave * 0.15,
        direction: 1,
        shootTimer: 0,
        points: 250 + wave * 50
    };

    showMessage(
        "Boss Wave",
        "Wave " + wave + ": defeat the mothership."
    );
}

function moveEnemies() {
    if (enemies.length === 0) {
        return;
    }

    let shouldDrop = false;

    for (let enemy of enemies) {
        enemy.x += enemyDirection * enemySpeed;
    }

    for (let enemy of enemies) {
        if (
            enemy.x <= 20 ||
            enemy.x + enemy.width >= canvas.width - 20
        ) {
            shouldDrop = true;
        }
    }

    if (shouldDrop) {
        enemyDirection *= -1;

        for (let enemy of enemies) {
            enemy.y += enemyDropDistance;
        }
    }

    for (let enemy of enemies) {
        if (enemy.y + enemy.height >= player.y) {
            endGame("Invaded", "The aliens reached your base.");
        }
    }
}

function moveBoss() {
    if (boss === null) {
        return;
    }

    boss.x += boss.speed * boss.direction;

    if (boss.x <= 20 || boss.x + boss.width >= canvas.width - 20) {
        boss.direction *= -1;
        boss.y += 12;
    }

    boss.shootTimer++;

    let bossShootRate = Math.max(45 - wave * 2, 20);

    if (boss.shootTimer >= bossShootRate) {
        boss.shootTimer = 0;

        enemyBullets.push({
            x: boss.x + boss.width / 2 - 4,
            y: boss.y + boss.height,
            width: 8,
            height: 16,
            speed: 5 + wave * 0.2
        });

        enemyBullets.push({
            x: boss.x + 25,
            y: boss.y + boss.height,
            width: 7,
            height: 14,
            speed: 4.5 + wave * 0.2
        });

        enemyBullets.push({
            x: boss.x + boss.width - 32,
            y: boss.y + boss.height,
            width: 7,
            height: 14,
            speed: 4.5 + wave * 0.2
        });
    }

    if (boss.y + boss.height >= player.y) {
        endGame("Crushed", "The boss reached your base.");
    }
}

function enemyShoot() {
    enemyShootTimer++;

    let shootRate = Math.max(65 - wave * 6, 25);

    if (enemyShootTimer < shootRate) {
        return;
    }

    enemyShootTimer = 0;

    if (enemies.length === 0) {
        return;
    }

    let shooter = enemies[Math.floor(Math.random() * enemies.length)];

    enemyBullets.push({
        x: shooter.x + shooter.width / 2 - 3,
        y: shooter.y + shooter.height,
        width: 6,
        height: 14,
        speed: 4 + wave * 0.25
    });
}

function updatePowerUps() {
    for (let powerUp of powerUps) {
        powerUp.y += powerUp.speed;
    }

    powerUps = powerUps.filter(function(powerUp) {
        return powerUp.y < canvas.height;
    });
}

function updatePowerTimer() {
    if (activePower === "None") {
        return;
    }

    powerTimer--;

    if (powerTimer <= 0) {
        activePower = "None";
        player.reloadMax = 18;
        updateStats();
    }
}

function spawnPowerUp(x, y) {
    let chance = Math.random();

    if (chance > 0.2) {
        return;
    }

    let type;

    if (chance < 0.07) {
        type = "Rapid Fire";
    } else if (chance < 0.14) {
        type = "Triple Shot";
    } else {
        type = "Extra Life";
    }

    powerUps.push({
        x: x,
        y: y,
        width: 28,
        height: 28,
        speed: 2.5,
        type: type
    });
}

function activatePower(type) {
    if (type === "Extra Life") {
        lives++;
        showMessage("Extra Life", "You gained one life.");
        updateStats();
        return;
    }

    activePower = type;
    powerTimer = 420;

    if (type === "Rapid Fire") {
        player.reloadMax = 7;
        showMessage("Rapid Fire", "Shoot faster for a few seconds.");
    }

    if (type === "Triple Shot") {
        player.reloadMax = 15;
        showMessage("Triple Shot", "Fire three bullets at once.");
    }

    updateStats();
}

function checkCollisions() {
    checkBulletEnemyCollisions();
    checkBulletBossCollisions();
    checkEnemyBulletPlayerCollisions();
    checkPowerUpCollisions();
}

function checkBulletEnemyCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (touching(bullets[i], enemies[j])) {
                enemies[j].health--;
                bullets.splice(i, 1);

                if (enemies[j].health <= 0) {
                    score += enemies[j].points;
                    spawnPowerUp(enemies[j].x + enemies[j].width / 2, enemies[j].y);
                    enemies.splice(j, 1);
                    updateStats();
                }

                break;
            }
        }
    }
}

function checkBulletBossCollisions() {
    if (boss === null) {
        return;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        if (touching(bullets[i], boss)) {
            boss.health--;
            bullets.splice(i, 1);

            if (boss.health <= 0) {
                score += boss.points;
                spawnPowerUp(boss.x + boss.width / 2, boss.y + boss.height / 2);
                boss = null;
                updateStats();
                break;
            }
        }
    }
}

function checkEnemyBulletPlayerCollisions() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (touching(enemyBullets[i], player)) {
            enemyBullets.splice(i, 1);
            lives--;

            updateStats();

            if (lives <= 0) {
                endGame("Game Over", "Your ship was destroyed.");
                return;
            }
        }
    }
}

function checkPowerUpCollisions() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        if (touching(powerUps[i], player)) {
            activatePower(powerUps[i].type);
            powerUps.splice(i, 1);
        }
    }
}

function touching(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function nextWave() {
    wave++;
    enemySpeed += 0.18;
    enemyBullets = [];
    bullets = [];
    powerUps = [];

    updateStats();

    makeWave();

    showMessage(
        "Wave " + wave,
        wave % 3 === 0
            ? "Boss wave incoming."
            : "New enemy formation incoming."
    );
}

function drawGame() {
    ctx.fillStyle = "#050713";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawStars();
    drawPlayer();
    drawBullets();
    drawEnemyBullets();
    drawEnemies();
    drawBoss();
    drawPowerUps();

    if (!gameRunning && !gameOver) {
        drawStartScreen();
    }
}

function drawStars() {
    ctx.fillStyle = "rgba(255,255,255,0.65)";

    for (let star of stars) {
        ctx.fillRect(star.x, star.y, star.size, star.size);

        star.y += star.speed;

        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = "#78f3ff";
    ctx.fillRect(player.x, player.y + 8, player.width, player.height - 8);

    ctx.fillStyle = "white";
    ctx.fillRect(player.x + player.width / 2 - 6, player.y, 12, 12);

    ctx.fillStyle = "#2bcbff";
    ctx.fillRect(player.x + 8, player.y + player.height - 4, 8, 8);
    ctx.fillRect(player.x + player.width - 16, player.y + player.height - 4, 8, 8);
}

function drawBullets() {
    ctx.fillStyle = "#ffd166";

    for (let bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

function drawEnemyBullets() {
    ctx.fillStyle = "#ff5d73";

    for (let bullet of enemyBullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

function drawEnemies() {
    for (let enemy of enemies) {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        ctx.fillStyle = enemy.eyeColor;
        ctx.fillRect(enemy.x + 8, enemy.y + 7, 6, 6);
        ctx.fillRect(enemy.x + enemy.width - 14, enemy.y + 7, 6, 6);

        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x - 4, enemy.y + 6, 4, 10);
        ctx.fillRect(enemy.x + enemy.width, enemy.y + 6, 4, 10);

        if (enemy.health > 1) {
            ctx.fillStyle = "white";
            ctx.font = "11px Arial";
            ctx.textAlign = "center";
            ctx.fillText(enemy.health, enemy.x + enemy.width / 2, enemy.y + enemy.height - 5);
        }
    }
}

function drawBoss() {
    if (boss === null) {
        return;
    }

    ctx.fillStyle = "#9b5de5";
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);

    ctx.fillStyle = "#ff5d73";
    ctx.fillRect(boss.x + 25, boss.y + 20, 22, 15);
    ctx.fillRect(boss.x + boss.width - 47, boss.y + 20, 22, 15);

    ctx.fillStyle = "#050713";
    ctx.fillRect(boss.x + 35, boss.y + 24, 8, 8);
    ctx.fillRect(boss.x + boss.width - 43, boss.y + 24, 8, 8);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(boss.x, boss.y - 12, boss.width, 7);

    ctx.fillStyle = "#ff5d73";
    ctx.fillRect(
        boss.x,
        boss.y - 12,
        boss.width * (boss.health / boss.maxHealth),
        7
    );
}

function drawPowerUps() {
    for (let powerUp of powerUps) {
        if (powerUp.type === "Rapid Fire") {
            ctx.fillStyle = "#ffd166";
        } else if (powerUp.type === "Triple Shot") {
            ctx.fillStyle = "#78f3ff";
        } else {
            ctx.fillStyle = "#a8ff78";
        }

        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);

        ctx.fillStyle = "#050713";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";

        if (powerUp.type === "Rapid Fire") {
            ctx.fillText("R", powerUp.x + 14, powerUp.y + 20);
        } else if (powerUp.type === "Triple Shot") {
            ctx.fillText("T", powerUp.x + 14, powerUp.y + 20);
        } else {
            ctx.fillText("+", powerUp.x + 14, powerUp.y + 20);
        }
    }
}

function drawStartScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "34px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Space Invaders", canvas.width / 2, canvas.height / 2 - 45);

    ctx.font = "18px Arial";
    ctx.fillText("Press Start, move with A/D, shoot with Space", canvas.width / 2, canvas.height / 2);
    ctx.fillText("Boss every 3 waves. Catch power-ups.", canvas.width / 2, canvas.height / 2 + 32);
}

function endGame(title, message) {
    gameRunning = false;
    gameOver = true;

    cancelAnimationFrame(animationId);

    showMessage(
        title,
        message + " Final score: " + score + "."
    );

    drawGame();

    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "38px Arial";
    ctx.textAlign = "center";
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 15);

    ctx.font = "18px Arial";
    ctx.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 2 + 25);
}

function makeStars() {
    stars = [];

    for (let i = 0; i < 80; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.6 + 0.2
        });
    }
}

function updateStats() {
    scoreText.textContent = score;
    livesText.textContent = lives;
    waveText.textContent = wave;

    if (activePower === "None") {
        powerText.textContent = "None";
    } else {
        powerText.textContent = activePower;
    }
}

function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
    messageBox.classList.add("show");
}

function hideMessage() {
    messageBox.classList.remove("show");
}

document.addEventListener("keydown", function(event) {
    if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === " "
    ) {
        event.preventDefault();
    }

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        leftPressed = true;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        rightPressed = true;
    }

    if (event.key === " ") {
        spacePressed = true;
    }
});

document.addEventListener("keyup", function(event) {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        leftPressed = false;
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        rightPressed = false;
    }

    if (event.key === " ") {
        spacePressed = false;
    }
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);

resetGame();