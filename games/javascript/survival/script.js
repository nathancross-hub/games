const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const healthText = document.querySelector("#health");
const hungerText = document.querySelector("#hunger");
const dayText = document.querySelector("#day");
const timeText = document.querySelector("#time");
const killsText = document.querySelector("#kills");

const woodText = document.querySelector("#wood");
const stoneText = document.querySelector("#stone");
const foodText = document.querySelector("#food");
const meatText = document.querySelector("#meat");

const swordText = document.querySelector("#sword");
const axeText = document.querySelector("#axe");
const selectedItemText = document.querySelector("#selectedItem");

const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");

const startBtn = document.querySelector("#startBtn");
const selectWallBtn = document.querySelector("#selectWallBtn");
const selectTorchBtn = document.querySelector("#selectTorchBtn");
const placeBtn = document.querySelector("#placeBtn");
const moveTorchBtn = document.querySelector("#moveTorchBtn");
const swordBtn = document.querySelector("#swordBtn");
const axeBtn = document.querySelector("#axeBtn");
const restartBtn = document.querySelector("#restartBtn");

let worldWidth = 2600;
let worldHeight = 1900;

let player;
let camera;
let keys;

let trees;
let rocks;
let berryBushes;
let animals;
let enemies;
let walls;
let torches;
let particles;

let wood;
let stone;
let food;
let meat;
let health;
let hunger;
let day;
let timer;
let isNight;
let kills;

let hasSword;
let hasAxe;
let selectedBuild;

let gameRunning;
let gameOver;
let animationId;

let enemySpawnTimer;
let resourceRespawnTimer;
let animalSpawnTimer;
let attackCooldown;

function resetGame() {
    player = {
        x: worldWidth / 2,
        y: worldHeight / 2,
        size: 30,
        speed: 3.5,
        directionX: 0,
        directionY: -1,
        swing: 0
    };

    camera = { x: 0, y: 0 };
    keys = {};

    trees = [];
    rocks = [];
    berryBushes = [];
    animals = [];
    enemies = [];
    walls = [];
    torches = [];
    particles = [];

    wood = 0;
    stone = 0;
    food = 0;
    meat = 0;
    health = 100;
    hunger = 100;
    day = 1;
    timer = 0;
    isNight = false;
    kills = 0;

    hasSword = false;
    hasAxe = false;
    selectedBuild = "Wall";

    enemySpawnTimer = 0;
    resourceRespawnTimer = 0;
    animalSpawnTimer = 0;
    attackCooldown = 0;

    gameRunning = false;
    gameOver = false;

    makeWorld();
    updateCamera();
    updateStats();

    showMessage("Survive", "Gather, craft, build, hunt animals, and survive the night.");

    cancelAnimationFrame(animationId);
    drawGame();
}

function makeWorld() {
    for (let i = 0; i < 120; i++) {
        trees.push(makeResource("tree"));
    }

    for (let i = 0; i < 65; i++) {
        rocks.push(makeResource("rock"));
    }

    for (let i = 0; i < 40; i++) {
        berryBushes.push(makeResource("berry"));
    }

    for (let i = 0; i < 18; i++) {
        spawnAnimal();
    }
}

function makeResource(type) {
    return {
        x: Math.random() * (worldWidth - 100) + 50,
        y: Math.random() * (worldHeight - 100) + 50,
        type: type,
        size: type === "tree" ? 36 : 28
    };
}

function spawnAnimal() {
    animals.push({
        x: Math.random() * worldWidth,
        y: Math.random() * worldHeight,
        size: 28,
        direction: Math.random() * Math.PI * 2,
        moveTimer: 0,
        health: 2
    });
}

function startGame() {
    if (gameRunning || gameOver) {
        return;
    }

    gameRunning = true;
    showMessage("Day " + day, "Gather resources before night.");
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
    updateCamera();
    updateDayNight();
    updateHunger();
    updateEnemies();
    updateAnimals();
    updateResources();
    updateParticles();
    checkEnemyHits();

    if (attackCooldown > 0) {
        attackCooldown--;
    }

    if (player.swing > 0) {
        player.swing--;
    }

    updateStats();
}

function movePlayer() {
    let nextX = player.x;
    let nextY = player.y;

    if (keys["w"] || keys["ArrowUp"]) {
        nextY -= player.speed;
        player.directionX = 0;
        player.directionY = -1;
    }

    if (keys["s"] || keys["ArrowDown"]) {
        nextY += player.speed;
        player.directionX = 0;
        player.directionY = 1;
    }

    if (keys["a"] || keys["ArrowLeft"]) {
        nextX -= player.speed;
        player.directionX = -1;
        player.directionY = 0;
    }

    if (keys["d"] || keys["ArrowRight"]) {
        nextX += player.speed;
        player.directionX = 1;
        player.directionY = 0;
    }

    nextX = Math.max(player.size / 2, Math.min(worldWidth - player.size / 2, nextX));
    nextY = Math.max(player.size / 2, Math.min(worldHeight - player.size / 2, nextY));

    if (!touchingAnyWall(nextX, nextY, player.size)) {
        player.x = nextX;
        player.y = nextY;
    }
}

function updateCamera() {
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    camera.x = Math.max(0, Math.min(worldWidth - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(worldHeight - canvas.height, camera.y));
}

function updateDayNight() {
    timer++;

    if (timer === 900) {
        isNight = true;
        showMessage("Nightfall", "Enemies are coming. Use walls and torches.");
    }

    if (timer >= 1800) {
        timer = 0;
        isNight = false;
        day++;
        enemies = [];
        showMessage("Morning", "You survived the night.");
    }

    if (isNight) {
        enemySpawnTimer++;

        if (enemySpawnTimer > Math.max(85 - day * 4, 40)) {
            enemySpawnTimer = 0;
            spawnEnemy();
        }
    }
}

function updateHunger() {
    if (timer % 100 === 0) {
        hunger--;

        if (hunger < 0) {
            hunger = 0;
        }
    }

    if (hunger <= 0) {
        health -= 0.12;
    }

    if (health <= 0) {
        health = 0;
        endGame();
    }
}

function updateResources() {
    resourceRespawnTimer++;

    if (resourceRespawnTimer > 420) {
        resourceRespawnTimer = 0;

        if (trees.length < 120) {
            trees.push(makeResource("tree"));
        }

        if (rocks.length < 65) {
            rocks.push(makeResource("rock"));
        }

        if (berryBushes.length < 40) {
            berryBushes.push(makeResource("berry"));
        }
    }

    animalSpawnTimer++;

    if (animalSpawnTimer > 700) {
        animalSpawnTimer = 0;

        if (animals.length < 18) {
            spawnAnimal();
        }
    }
}

function spawnEnemy() {
    let side = Math.floor(Math.random() * 4);
    let x;
    let y;

    if (side === 0) {
        x = 0;
        y = Math.random() * worldHeight;
    } else if (side === 1) {
        x = worldWidth;
        y = Math.random() * worldHeight;
    } else if (side === 2) {
        x = Math.random() * worldWidth;
        y = 0;
    } else {
        x = Math.random() * worldWidth;
        y = worldHeight;
    }

    let type = "normal";
    let roll = Math.random();

    if (day >= 2 && roll < 0.25) {
        type = "fast";
    }

    if (day >= 3 && roll > 0.8) {
        type = "tank";
    }

    let enemy = {
        x: x,
        y: y,
        size: 24,
        speed: 1.2,
        health: 3,
        maxHealth: 3,
        damage: 0.18,
        type: type
    };

    if (type === "fast") {
        enemy.size = 20;
        enemy.speed = 2;
        enemy.health = 2;
        enemy.maxHealth = 2;
    }

    if (type === "tank") {
        enemy.size = 36;
        enemy.speed = 0.75;
        enemy.health = 8;
        enemy.maxHealth = 8;
    }

    enemies.push(enemy);
}

function updateEnemies() {
    for (let enemy of enemies) {
        let angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);

        let nextX = enemy.x + Math.cos(angle) * enemy.speed;
        let nextY = enemy.y + Math.sin(angle) * enemy.speed;

        let blocked = false;

        for (let wall of walls) {
            if (circleRectTouching(nextX, nextY, enemy.size, wall)) {
                wall.health -= enemy.type === "tank" ? 0.8 : 0.35;
                blocked = true;
            }
        }

        walls = walls.filter(function(wall) {
            return wall.health > 0;
        });

        for (let torch of torches) {
            if (distance(enemy.x, enemy.y, torch.x, torch.y) < 95) {
                nextX -= Math.cos(angle) * enemy.speed * 2;
                nextY -= Math.sin(angle) * enemy.speed * 2;
            }
        }

        if (!blocked) {
            enemy.x = nextX;
            enemy.y = nextY;
        }
    }
}

function updateAnimals() {
    for (let animal of animals) {
        animal.moveTimer--;

        if (animal.moveTimer <= 0) {
            animal.moveTimer = Math.random() * 100 + 40;
            animal.direction = Math.random() * Math.PI * 2;
        }

        animal.x += Math.cos(animal.direction) * 0.7;
        animal.y += Math.sin(animal.direction) * 0.7;

        animal.x = Math.max(20, Math.min(worldWidth - 20, animal.x));
        animal.y = Math.max(20, Math.min(worldHeight - 20, animal.y));
    }
}

function checkEnemyHits() {
    for (let enemy of enemies) {
        if (distance(enemy.x, enemy.y, player.x, player.y) < enemy.size / 2 + player.size / 2) {
            health -= enemy.damage;
        }
    }

    if (health <= 0) {
        health = 0;
        endGame();
    }
}

function gatherResource() {
    if (!gameRunning || gameOver) {
        return;
    }

    for (let i = trees.length - 1; i >= 0; i--) {
        if (distance(player.x, player.y, trees[i].x, trees[i].y) < 55) {
            trees.splice(i, 1);
            let amount = hasAxe ? 7 : 4;
            wood += amount;
            spawnParticles(player.x, player.y, "#8b5a2b");
            showMessage("Wood Collected", "+" + amount + " wood");
            return;
        }
    }

    for (let i = rocks.length - 1; i >= 0; i--) {
        if (distance(player.x, player.y, rocks[i].x, rocks[i].y) < 50) {
            rocks.splice(i, 1);
            let amount = hasAxe ? 5 : 3;
            stone += amount;
            spawnParticles(player.x, player.y, "#888");
            showMessage("Stone Collected", "+" + amount + " stone");
            return;
        }
    }

    for (let i = berryBushes.length - 1; i >= 0; i--) {
        if (distance(player.x, player.y, berryBushes[i].x, berryBushes[i].y) < 50) {
            berryBushes.splice(i, 1);
            food += 2;
            spawnParticles(player.x, player.y, "#ff4d6d");
            showMessage("Food Collected", "+2 berries");
            return;
        }
    }

    showMessage("Nothing Nearby", "Move closer to a tree, rock, or bush.");
}

function attack() {
    if (!gameRunning || gameOver || attackCooldown > 0) {
        return;
    }

    attackCooldown = hasSword ? 18 : 30;
    player.swing = 10;

    let range = hasSword ? 75 : 45;
    let damage = hasSword ? 3 : 1;

    for (let i = enemies.length - 1; i >= 0; i--) {
        let enemy = enemies[i];

        if (distance(player.x, player.y, enemy.x, enemy.y) < range) {
            enemy.health -= damage;
            spawnParticles(enemy.x, enemy.y, "#ff0000");

            let angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
            enemy.x += Math.cos(angle) * 25;
            enemy.y += Math.sin(angle) * 25;

            if (enemy.health <= 0) {
                enemies.splice(i, 1);
                kills++;
                wood += 1;
                stone += 1;
                food += 1;
                showMessage("Enemy Defeated", "+1 wood, +1 stone, +1 food");
            }

            return;
        }
    }

    for (let i = animals.length - 1; i >= 0; i--) {
        let animal = animals[i];

        if (distance(player.x, player.y, animal.x, animal.y) < range) {
            animal.health -= damage;
            spawnParticles(animal.x, animal.y, "#ffffff");

            if (animal.health <= 0) {
                animals.splice(i, 1);
                meat += 2;
                showMessage("Animal Hunted", "+2 meat");
            }

            return;
        }
    }
}

function eatFood() {
    if (!gameRunning || gameOver) {
        return;
    }

    if (meat > 0) {
        meat--;
        hunger += 40;
        health += 8;
        showMessage("Meat Eaten", "+40 hunger and +8 health");
    } else if (food > 0) {
        food--;
        hunger += 20;
        showMessage("Berries Eaten", "+20 hunger");
    } else {
        showMessage("No Food", "Gather berries or hunt animals.");
    }

    if (hunger > 100) {
        hunger = 100;
    }

    if (health > 100) {
        health = 100;
    }
}

function buildSelected() {
    if (!gameRunning || gameOver) {
        return;
    }

    let placeX = player.x + player.directionX * 50 - 20;
    let placeY = player.y + player.directionY * 50 - 20;

    if (selectedBuild === "Wall") {
        if (wood < 5) {
            showMessage("Not Enough Wood", "Need 5 wood.");
            return;
        }

        wood -= 5;

        walls.push({
            x: placeX,
            y: placeY,
            width: 40,
            height: 40,
            health: 120
        });

        spawnParticles(placeX, placeY, "#8b5a2b");
        showMessage("Wall Placed", "Placed in front of you.");
    } else {
        if (wood < 4 || stone < 2) {
            showMessage("Not Enough Resources", "Need 4 wood and 2 stone.");
            return;
        }

        wood -= 4;
        stone -= 2;

        torches.push({
            x: player.x + player.directionX * 50,
            y: player.y + player.directionY * 50,
            size: 28
        });

        spawnParticles(placeX, placeY, "#ffcc00");
        showMessage("Torch Placed", "Torches can be picked up and moved.");
    }
}

function pickupTorch() {
    if (!gameRunning || gameOver) {
        return;
    }

    for (let i = torches.length - 1; i >= 0; i--) {
        if (distance(player.x, player.y, torches[i].x, torches[i].y) < 55) {
            torches.splice(i, 1);
            wood += 2;
            stone += 1;
            showMessage("Torch Picked Up", "+2 wood and +1 stone");
            return;
        }
    }

    showMessage("No Torch Nearby", "Move closer to a torch.");
}

function craftSword() {
    if (!gameRunning || gameOver) {
        return;
    }

    if (hasSword) {
        showMessage("Already Crafted", "You already have a sword.");
        return;
    }

    if (wood < 6 || stone < 6) {
        showMessage("Not Enough Resources", "Need 6 wood and 6 stone.");
        return;
    }

    wood -= 6;
    stone -= 6;
    hasSword = true;
    showMessage("Sword Crafted", "Your attacks are stronger and visible.");
}

function craftAxe() {
    if (!gameRunning || gameOver) {
        return;
    }

    if (hasAxe) {
        showMessage("Already Crafted", "You already have an axe.");
        return;
    }

    if (wood < 5 || stone < 3) {
        showMessage("Not Enough Resources", "Need 5 wood and 3 stone.");
        return;
    }

    wood -= 5;
    stone -= 3;
    hasAxe = true;
    showMessage("Axe Crafted", "You gather more resources.");
}

function spawnParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 5 + 2,
            color: color,
            speedX: (Math.random() - 0.5) * 5,
            speedY: (Math.random() - 0.5) * 5,
            life: 30
        });
    }
}

function updateParticles() {
    for (let particle of particles) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.life--;
    }

    particles = particles.filter(function(particle) {
        return particle.life > 0;
    });
}

function endGame() {
    gameRunning = false;
    gameOver = true;
    cancelAnimationFrame(animationId);

    showMessage("Game Over", "You survived until day " + day + " with " + kills + " kills.");

    drawGame();

    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "42px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 15);

    ctx.font = "18px Arial";
    ctx.fillText("You survived until day " + day, canvas.width / 2, canvas.height / 2 + 25);
}

function drawGame() {
    drawGround();
    drawResources();
    drawTorches();
    drawWalls();
    drawAnimals();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawGhostPlacement();
    drawNightOverlay();
    drawMinimap();

    if (!gameRunning && !gameOver) {
        drawStartScreen();
    }
}

function worldToScreenX(x) {
    return x - camera.x;
}

function worldToScreenY(y) {
    return y - camera.y;
}

function drawGround() {
    ctx.fillStyle = "#1f6b35";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";

    let gridSize = 40;
    let startX = -camera.x % gridSize;
    let startY = -camera.y % gridSize;

    for (let x = startX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = startY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawResources() {
    for (let tree of trees) {
        let x = worldToScreenX(tree.x);
        let y = worldToScreenY(tree.y);

        if (!onScreen(x, y, 60)) continue;

        ctx.fillStyle = "#5b3517";
        ctx.fillRect(x - 6, y + 8, 12, 22);

        ctx.fillStyle = "#0f4f20";
        ctx.fillRect(x - 18, y - 20, 36, 36);

        ctx.fillStyle = "#1e7d32";
        ctx.fillRect(x - 26, y - 12, 18, 18);
        ctx.fillRect(x + 8, y - 12, 18, 18);
    }

    for (let rock of rocks) {
        let x = worldToScreenX(rock.x);
        let y = worldToScreenY(rock.y);

        if (!onScreen(x, y, 60)) continue;

        ctx.fillStyle = "#777";
        ctx.fillRect(x - 15, y - 15, 30, 30);

        ctx.fillStyle = "#999";
        ctx.fillRect(x - 8, y - 8, 10, 10);
    }

    for (let berry of berryBushes) {
        let x = worldToScreenX(berry.x);
        let y = worldToScreenY(berry.y);

        if (!onScreen(x, y, 60)) continue;

        ctx.fillStyle = "#145c25";
        ctx.fillRect(x - 16, y - 16, 32, 32);

        ctx.fillStyle = "#ff4d6d";
        ctx.fillRect(x - 8, y - 6, 6, 6);
        ctx.fillRect(x + 5, y + 4, 6, 6);
    }
}

function drawAnimals() {
    for (let animal of animals) {
        let x = worldToScreenX(animal.x);
        let y = worldToScreenY(animal.y);

        if (!onScreen(x, y, 60)) continue;

        ctx.fillStyle = "#d9c2a3";
        ctx.fillRect(x - 14, y - 10, 28, 20);

        ctx.fillStyle = "#b88a5a";
        ctx.fillRect(x + 8, y - 16, 12, 12);

        ctx.fillStyle = "#222";
        ctx.fillRect(x + 14, y - 12, 3, 3);
    }
}

function drawWalls() {
    for (let wall of walls) {
        let x = worldToScreenX(wall.x);
        let y = worldToScreenY(wall.y);

        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(x, y, wall.width, wall.height);

        ctx.strokeStyle = "#5d391a";
        ctx.strokeRect(x, y, wall.width, wall.height);

        ctx.fillStyle = "#9cff9c";
        ctx.fillRect(x, y - 6, wall.width * (wall.health / 120), 4);
    }
}

function drawTorches() {
    for (let torch of torches) {
        let x = worldToScreenX(torch.x);
        let y = worldToScreenY(torch.y);

        ctx.fillStyle = "rgba(255, 145, 0, 0.18)";
        ctx.fillRect(x - 95, y - 95, 190, 190);

        ctx.fillStyle = "#5b3517";
        ctx.fillRect(x - 5, y + 6, 10, 26);

        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(x - 12, y - 12, 24, 24);

        ctx.fillStyle = "#ff5d00";
        ctx.fillRect(x - 7, y - 4, 14, 14);
    }
}

function drawEnemies() {
    for (let enemy of enemies) {
        let x = worldToScreenX(enemy.x);
        let y = worldToScreenY(enemy.y);

        if (!onScreen(x, y, 80)) continue;

        if (enemy.type === "fast") {
            ctx.fillStyle = "#ff9f1c";
        } else if (enemy.type === "tank") {
            ctx.fillStyle = "#6f1d1b";
        } else {
            ctx.fillStyle = "#8b1e1e";
        }

        ctx.fillRect(x - enemy.size / 2, y - enemy.size / 2, enemy.size, enemy.size);

        ctx.fillStyle = "white";
        ctx.fillRect(x - 7, y - 5, 4, 4);
        ctx.fillRect(x + 3, y - 5, 4, 4);

        ctx.fillStyle = "#9cff9c";
        ctx.fillRect(
            x - enemy.size / 2,
            y - enemy.size / 2 - 8,
            enemy.size * (enemy.health / enemy.maxHealth),
            4
        );
    }
}

function drawPlayer() {
    let x = worldToScreenX(player.x);
    let y = worldToScreenY(player.y);

    ctx.fillStyle = "#ffd166";
    ctx.fillRect(x - 12, y - 14, 24, 28);

    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(x - 8, y + 9, 7, 7);
    ctx.fillRect(x + 1, y + 9, 7, 7);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 7, y - 7, 5, 5);
    ctx.fillRect(x + 2, y - 7, 5, 5);

    if (hasSword) {
        ctx.fillStyle = "#d9d9d9";

        let swordX = x + player.directionX * 22;
        let swordY = y + player.directionY * 22;

        if (player.directionX !== 0) {
            ctx.fillRect(swordX - 3, swordY - 18, 6, 36);
        } else {
            ctx.fillRect(swordX - 18, swordY - 3, 36, 6);
        }
    }

    if (player.swing > 0) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 40, y - 40, 80, 80);
    }
}

function drawParticles() {
    for (let particle of particles) {
        let x = worldToScreenX(particle.x);
        let y = worldToScreenY(particle.y);

        ctx.fillStyle = particle.color;
        ctx.fillRect(x, y, particle.size, particle.size);
    }
}

function drawGhostPlacement() {
    if (!gameRunning || gameOver) {
        return;
    }

    let x = worldToScreenX(player.x + player.directionX * 50 - 20);
    let y = worldToScreenY(player.y + player.directionY * 50 - 20);

    ctx.fillStyle = "rgba(255,255,255,0.25)";

    if (selectedBuild === "Wall") {
        ctx.fillRect(x, y, 40, 40);
    } else {
        ctx.fillRect(x + 6, y + 6, 28, 28);
    }
}

function drawNightOverlay() {
    if (!isNight) {
        return;
    }

    ctx.fillStyle = "rgba(0, 0, 45, 0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let torch of torches) {
        let x = worldToScreenX(torch.x);
        let y = worldToScreenY(torch.y);

        let glow = ctx.createRadialGradient(x, y, 10, x, y, 150);
        glow.addColorStop(0, "rgba(255, 196, 80, 0.4)");
        glow.addColorStop(1, "rgba(255, 196, 80, 0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, 150, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawMinimap() {
    let mapW = 150;
    let mapH = 105;
    let x = canvas.width - mapW - 15;
    let y = 15;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x, y, mapW, mapH);

    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.strokeRect(x, y, mapW, mapH);

    ctx.fillStyle = "#ffd166";
    ctx.fillRect(
        x + (player.x / worldWidth) * mapW - 3,
        y + (player.y / worldHeight) * mapH - 3,
        6,
        6
    );

    ctx.fillStyle = "#8b1e1e";

    for (let enemy of enemies) {
        ctx.fillRect(
            x + (enemy.x / worldWidth) * mapW - 2,
            y + (enemy.y / worldHeight) * mapH - 2,
            4,
            4
        );
    }
}

function drawStartScreen() {
    ctx.fillStyle = "rgba(0,0,0,0.68)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Survival", canvas.width / 2, canvas.height / 2 - 60);

    ctx.font = "18px Arial";
    ctx.fillText("Explore, gather, build, hunt, fight, and survive.", canvas.width / 2, canvas.height / 2 - 12);
    ctx.fillText("E = gather, Space = attack, F = eat", canvas.width / 2, canvas.height / 2 + 22);
}

function onScreen(x, y, margin) {
    return x > -margin &&
        x < canvas.width + margin &&
        y > -margin &&
        y < canvas.height + margin;
}

function touchingAnyWall(x, y, size) {
    for (let wall of walls) {
        if (circleRectTouching(x, y, size, wall)) {
            return true;
        }
    }

    return false;
}

function circleRectTouching(cx, cy, size, rect) {
    let closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
    let closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));

    let distanceX = cx - closestX;
    let distanceY = cy - closestY;

    return (distanceX * distanceX + distanceY * distanceY) < (size / 2) * (size / 2);
}

function distance(x1, y1, x2, y2) {
    let dx = x1 - x2;
    let dy = y1 - y2;

    return Math.sqrt(dx * dx + dy * dy);
}

function updateStats() {
    healthText.textContent = Math.floor(health);
    hungerText.textContent = Math.floor(hunger);
    dayText.textContent = day;
    timeText.textContent = isNight ? "Night" : "Day";
    killsText.textContent = kills;

    woodText.textContent = wood;
    stoneText.textContent = stone;
    foodText.textContent = food;
    meatText.textContent = meat;

    swordText.textContent = hasSword ? "Yes" : "No";
    axeText.textContent = hasAxe ? "Yes" : "No";
    selectedItemText.textContent = selectedBuild;
}

function showMessage(title, text) {
    messageTitle.textContent = title;
    messageText.textContent = text;
}

document.addEventListener("keydown", function(event) {
    let key = event.key.toLowerCase();

    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === " "
    ) {
        event.preventDefault();
    }

    keys[key] = true;
    keys[event.key] = true;

    if (key === "e") {
        gatherResource();
    }

    if (event.key === " ") {
        attack();
    }

    if (key === "f") {
        eatFood();
    }
});

document.addEventListener("keyup", function(event) {
    let key = event.key.toLowerCase();

    keys[key] = false;
    keys[event.key] = false;
});

startBtn.addEventListener("click", startGame);

selectWallBtn.addEventListener("click", function() {
    selectedBuild = "Wall";
    updateStats();
    showMessage("Wall Selected", "Press Place Selected to build a wall in front of you.");
});

selectTorchBtn.addEventListener("click", function() {
    selectedBuild = "Torch";
    updateStats();
    showMessage("Torch Selected", "Press Place Selected to place a torch in front of you.");
});

placeBtn.addEventListener("click", buildSelected);
moveTorchBtn.addEventListener("click", pickupTorch);
swordBtn.addEventListener("click", craftSword);
axeBtn.addEventListener("click", craftAxe);
restartBtn.addEventListener("click", resetGame);

resetGame();const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const healthText = document.querySelector("#health");
const hungerText = document.querySelector("#hunger");
const dayText = document.querySelector("#day");
const timeText = document.querySelector("#time");
const killsText = document.querySelector("#kills");

const woodText = document.querySelector("#wood");
const stoneText = document.querySelector("#stone");
const foodText = document.querySelector("#food");
const meatText = document.querySelector("#meat");

const swordText = document.querySelector("#sword");
const axeText = document.querySelector("#axe");
const selectedItemText = document.querySelector("#selectedItem");

const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");

const startBtn = document.querySelector("#startBtn");
const selectWallBtn = document.querySelector("#selectWallBtn");
const selectTorchBtn = document.querySelector("#selectTorchBtn");
const placeBtn = document.querySelector("#placeBtn");
const moveTorchBtn = document.querySelector("#moveTorchBtn");
const swordBtn = document.querySelector("#swordBtn");
const axeBtn = document.querySelector("#axeBtn");
const restartBtn = document.querySelector("#restartBtn");

let worldWidth = 2600;
let worldHeight = 1900;

let player;
let camera;
let keys;

let trees;
let rocks;
let berryBushes;
let animals;
let enemies;

let walls;
let torches;

let particles = [];

let wood;
let stone;
let food;
let meat;

let health;
let hunger;
let day;
let timer;
let isNight;

let kills;

let hasSword;
let hasAxe;

let selectedBuild = "Wall";

let gameRunning;
let gameOver;

let animationId;

let enemySpawnTimer;
let resourceRespawnTimer;
let animalSpawnTimer;

let attackCooldown;

function resetGame() {

    player = {
        x: worldWidth / 2,
        y: worldHeight / 2,
        size: 30,
        speed: 3.5,
        directionX: 0,
        directionY: -1,
        swing: 0
    };

    camera = {
        x: 0,
        y: 0
    };

    keys = {};

    trees = [];
    rocks = [];
    berryBushes = [];
    animals = [];
    enemies = [];

    walls = [];
    torches = [];

    particles = [];

    wood = 0;
    stone = 0;
    food = 0;
    meat = 0;

    health = 100;
    hunger = 100;

    day = 1;
    timer = 0;
    isNight = false;

    kills = 0;

    hasSword = false;
    hasAxe = false;

    enemySpawnTimer = 0;
    resourceRespawnTimer = 0;
    animalSpawnTimer = 0;

    attackCooldown = 0;

    gameRunning = false;
    gameOver = false;

    makeWorld();

    updateCamera();
    updateStats();

    showMessage(
        "Survive",
        "Gather, craft, build, hunt animals, and survive the night."
    );

    cancelAnimationFrame(animationId);

    drawGame();
}

function makeWorld() {

    for (let i = 0; i < 120; i++) {
        trees.push(makeResource("tree"));
    }

    for (let i = 0; i < 65; i++) {
        rocks.push(makeResource("rock"));
    }

    for (let i = 0; i < 40; i++) {
        berryBushes.push(makeResource("berry"));
    }

    for (let i = 0; i < 18; i++) {
        spawnAnimal();
    }
}

function makeResource(type) {

    return {
        x: Math.random() * (worldWidth - 100) + 50,
        y: Math.random() * (worldHeight - 100) + 50,
        type: type,
        size: type === "tree" ? 36 : 28
    };
}

function spawnAnimal() {

    animals.push({
        x: Math.random() * worldWidth,
        y: Math.random() * worldHeight,
        size: 26,
        direction: Math.random() * Math.PI * 2,
        moveTimer: 0,
        health: 2
    });
}

function startGame() {

    if (gameRunning || gameOver) {
        return;
    }

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
    updateCamera();

    updateDayNight();
    updateHunger();

    updateEnemies();
    updateAnimals();

    updateResources();
    updateParticles();

    checkEnemyHits();

    if (attackCooldown > 0) {
        attackCooldown--;
    }

    if (player.swing > 0) {
        player.swing--;
    }

    updateStats();
}

function movePlayer() {

    let nextX = player.x;
    let nextY = player.y;

    if (keys["w"] || keys["ArrowUp"]) {
        nextY -= player.speed;
        player.directionY = -1;
        player.directionX = 0;
    }

    if (keys["s"] || keys["ArrowDown"]) {
        nextY += player.speed;
        player.directionY = 1;
        player.directionX = 0;
    }

    if (keys["a"] || keys["ArrowLeft"]) {
        nextX -= player.speed;
        player.directionX = -1;
        player.directionY = 0;
    }

    if (keys["d"] || keys["ArrowRight"]) {
        nextX += player.speed;
        player.directionX = 1;
        player.directionY = 0;
    }

    nextX = Math.max(
        player.size / 2,
        Math.min(worldWidth - player.size / 2, nextX)
    );

    nextY = Math.max(
        player.size / 2,
        Math.min(worldHeight - player.size / 2, nextY)
    );

    if (!touchingAnyWall(nextX, nextY, player.size)) {
        player.x = nextX;
        player.y = nextY;
    }
}

function updateCamera() {

    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;

    camera.x = Math.max(
        0,
        Math.min(worldWidth - canvas.width, camera.x)
    );

    camera.y = Math.max(
        0,
        Math.min(worldHeight - canvas.height, camera.y)
    );
}

function updateDayNight() {

    timer++;

    if (timer === 900) {

        isNight = true;

        showMessage(
            "Nightfall",
            "Enemies are stronger at night."
        );
    }

    if (timer >= 1800) {

        timer = 0;

        isNight = false;

        day++;

        enemies = [];

        showMessage(
            "Morning",
            "You survived the night."
        );
    }

    if (isNight) {

        enemySpawnTimer++;

        if (enemySpawnTimer > Math.max(85 - day * 4, 40)) {

            enemySpawnTimer = 0;

            spawnEnemy();
        }
    }
}

function updateHunger() {

    if (timer % 100 === 0) {

        hunger--;

        if (hunger < 0) {
            hunger = 0;
        }
    }

    if (hunger <= 0) {

        health -= 0.12;
    }

    if (health <= 0) {

        health = 0;

        endGame();
    }
}

function updateResources() {

    resourceRespawnTimer++;

    if (resourceRespawnTimer > 420) {

        resourceRespawnTimer = 0;

        if (trees.length < 120) {
            trees.push(makeResource("tree"));
        }

        if (rocks.length < 65) {
            rocks.push(makeResource("rock"));
        }

        if (berryBushes.length < 40) {
            berryBushes.push(makeResource("berry"));
        }
    }

    animalSpawnTimer++;

    if (animalSpawnTimer > 700) {

        animalSpawnTimer = 0;

        if (animals.length < 18) {
            spawnAnimal();
        }
    }
}

function spawnEnemy() {

    let side = Math.floor(Math.random() * 4);

    let x;
    let y;

    if (side === 0) {
        x = 0;
        y = Math.random() * worldHeight;
    }

    else if (side === 1) {
        x = worldWidth;
        y = Math.random() * worldHeight;
    }

    else if (side === 2) {
        x = Math.random() * worldWidth;
        y = 0;
    }

    else {
        x = Math.random() * worldWidth;
        y = worldHeight;
    }

    let type = "normal";

    let roll = Math.random();

    if (day >= 2 && roll < 0.25) {
        type = "fast";
    }

    if (day >= 3 && roll > 0.8) {
        type = "tank";
    }

    let enemy = {
        x: x,
        y: y,
        size: 24,
        speed: 1.2,
        health: 3,
        maxHealth: 3,
        damage: 0.18,
        type: type
    };

    if (type === "fast") {

        enemy.size = 20;
        enemy.speed = 2;
        enemy.health = 2;
        enemy.maxHealth = 2;
    }

    if (type === "tank") {

        enemy.size = 36;
        enemy.speed = 0.75;
        enemy.health = 8;
        enemy.maxHealth = 8;
    }

    enemies.push(enemy);
}

function updateEnemies() {

    for (let enemy of enemies) {

        let angle = Math.atan2(
            player.y - enemy.y,
            player.x - enemy.x
        );

        let nextX =
            enemy.x + Math.cos(angle) * enemy.speed;

        let nextY =
            enemy.y + Math.sin(angle) * enemy.speed;

        let blocked = false;

        for (let wall of walls) {

            if (
                circleRectTouching(
                    nextX,
                    nextY,
                    enemy.size,
                    wall
                )
            ) {

                wall.health -=
                    enemy.type === "tank"
                    ? 0.8
                    : 0.35;

                blocked = true;
            }
        }

        walls = walls.filter(function(wall) {
            return wall.health > 0;
        });

        for (let torch of torches) {

            if (
                distance(
                    enemy.x,
                    enemy.y,
                    torch.x,
                    torch.y
                ) < 95
            ) {

                nextX -= Math.cos(angle) * enemy.speed * 2;
                nextY -= Math.sin(angle) * enemy.speed * 2;
            }
        }

        if (!blocked) {

            enemy.x = nextX;
            enemy.y = nextY;
        }
    }
}

function updateAnimals() {

    for (let animal of animals) {

        animal.moveTimer--;

        if (animal.moveTimer <= 0) {

            animal.moveTimer =
                Math.random() * 100 + 40;

            animal.direction =
                Math.random() * Math.PI * 2;
        }

        animal.x +=
            Math.cos(animal.direction) * 0.7;

        animal.y +=
            Math.sin(animal.direction) * 0.7;

        animal.x = Math.max(
            20,
            Math.min(worldWidth - 20, animal.x)
        );

        animal.y = Math.max(
            20,
            Math.min(worldHeight - 20, animal.y)
        );
    }
}

function checkEnemyHits() {

    for (let enemy of enemies) {

        if (
            distance(
                enemy.x,
                enemy.y,
                player.x,
                player.y
            ) <
            enemy.size / 2 + player.size / 2
        ) {

            health -= enemy.damage;
        }
    }
}

function gatherResource() {

    for (let i = trees.length - 1; i >= 0; i--) {

        if (
            distance(
                player.x,
                player.y,
                trees[i].x,
                trees[i].y
            ) < 55
        ) {

            trees.splice(i, 1);

            let amount =
                hasAxe ? 7 : 4;

            wood += amount;

            spawnParticles(
                player.x,
                player.y,
                "#8b5a2b"
            );

            showMessage(
                "Wood Collected",
                "+" + amount + " wood"
            );

            return;
        }
    }

    for (let i = rocks.length - 1; i >= 0; i--) {

        if (
            distance(
                player.x,
                player.y,
                rocks[i].x,
                rocks[i].y
            ) < 50
        ) {

            rocks.splice(i, 1);

            let amount =
                hasAxe ? 5 : 3;

            stone += amount;

            spawnParticles(
                player.x,
                player.y,
                "#888"
            );

            showMessage(
                "Stone Collected",
                "+" + amount + " stone"
            );

            return;
        }
    }

    for (let i = berryBushes.length - 1; i >= 0; i--) {

        if (
            distance(
                player.x,
                player.y,
                berryBushes[i].x,
                berryBushes[i].y
            ) < 50
        ) {

            berryBushes.splice(i, 1);

            food += 2;

            spawnParticles(
                player.x,
                player.y,
                "#ff4d6d"
            );

            showMessage(
                "Food Collected",
                "+2 berries"
            );

            return;
        }
    }
}

function attack() {

    if (attackCooldown > 0) {
        return;
    }

    attackCooldown =
        hasSword ? 18 : 30;

    player.swing = 10;

    let range =
        hasSword ? 75 : 45;

    let damage =
        hasSword ? 3 : 1;

    for (let i = enemies.length - 1; i >= 0; i--) {

        let enemy = enemies[i];

        if (
            distance(
                player.x,
                player.y,
                enemy.x,
                enemy.y
            ) < range
        ) {

            enemy.health -= damage;

            spawnParticles(
                enemy.x,
                enemy.y,
                "#ff0000"
            );

            let angle = Math.atan2(
                enemy.y - player.y,
                enemy.x - player.x
            );

            enemy.x += Math.cos(angle) * 25;
            enemy.y += Math.sin(angle) * 25;

            if (enemy.health <= 0) {

                enemies.splice(i, 1);

                kills++;

                wood += 1;
                stone += 1;

                showMessage(
                    "Enemy Defeated",
                    "+1 wood and +1 stone"
                );
            }
        }
    }

    for (let i = animals.length - 1; i >= 0; i--) {

        let animal = animals[i];

        if (
            distance(
                player.x,
                player.y,
                animal.x,
                animal.y
            ) < range
        ) {

            animal.health -= damage;

            spawnParticles(
                animal.x,
                animal.y,
                "#ffffff"
            );

            if (animal.health <= 0) {

                animals.splice(i, 1);

                meat += 2;

                showMessage(
                    "Animal Hunted",
                    "+2 meat"
                );
            }
        }
    }
}

function eatFood() {

    if (meat > 0) {

        meat--;

        hunger += 40;
        health += 8;

        showMessage(
            "Meat Eaten",
            "+40 hunger"
        );
    }

    else if (food > 0) {

        food--;

        hunger += 20;

        showMessage(
            "Berries Eaten",
            "+20 hunger"
        );
    }

    else {

        showMessage(
            "No Food",
            "Gather berries or hunt animals."
        );
    }

    if (hunger > 100) {
        hunger = 100;
    }

    if (health > 100) {
        health = 100;
    }
}

function buildSelected() {

    if (selectedBuild === "Wall") {

        if (wood < 5) {

            showMessage(
                "Not Enough Wood",
                "Need 5 wood."
            );

            return;
        }

        wood -= 5;

        walls.push({
            x:
                player.x +
                player.directionX * 45 -
                20,

            y:
                player.y +
                player.directionY * 45 -
                20,

            width: 40,
            height: 40,
            health: 120
        });

        spawnParticles(
            player.x,
            player.y,
            "#8b5a2b"
        );
    }

    else {

        if (wood < 4 || stone < 2) {

            showMessage(
                "Not Enough Resources",
                "Need 4 wood and 2 stone."
            );

            return;
        }

        wood -= 4;
        stone -= 2;

        torches.push({
            x:
                player.x +
                player.directionX * 45,

            y:
                player.y +
                player.directionY * 45,

            size: 28
        });

        spawnParticles(
            player.x,
            player.y,
            "#ffcc00"
        );
    }
}

function pickupTorch() {

    for (let i = torches.length - 1; i >= 0; i--) {

        if (
            distance(
                player.x,
                player.y,
                torches[i].x,
                torches[i].y
            ) < 55
        ) {

            torches.splice(i, 1);

            wood += 2;
            stone += 1;

            showMessage(
                "Torch Picked Up",
                "+2 wood +1 stone"
            );

            return;
        }
    }
}

function craftSword() {

    if (hasSword) {
        return;
    }

    if (wood < 6 || stone < 6) {

        showMessage(
            "Not Enough Resources",
            "Need 6 wood and 6 stone."
        );

        return;
    }

    wood -= 6;
    stone -= 6;

    hasSword = true;

    showMessage(
        "Sword Crafted",
        "Your attacks are stronger."
    );
}

function craftAxe() {

    if (hasAxe) {
        return;
    }

    if (wood < 5 || stone < 3) {

        showMessage(
            "Not Enough Resources",
            "Need 5 wood and 3 stone."
        );

        return;
    }

    wood -= 5;
    stone -= 3;

    hasAxe = true;

    showMessage(
        "Axe Crafted",
        "Gather more resources."
    );
}

function spawnParticles(x, y, color) {

    for (let i = 0; i < 12; i++) {

        particles.push({
            x: x,
            y: y,
            size: Math.random() * 5 + 2,
            color: color,
            speedX: (Math.random() - 0.5) * 5,
            speedY: (Math.random() - 0.5) * 5,
            life: 30
        });
    }
}

function updateParticles() {

    for (let particle of particles) {

        particle.x += particle.speedX;
        particle.y += particle.speedY;

        particle.life--;
    }

    particles = particles.filter(function(particle) {
        return particle.life > 0;
    });
}