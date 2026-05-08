const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const moneyText = document.querySelector("#money");
const fuelText = document.querySelector("#fuel");
const cargoText = document.querySelector("#cargo");
const depthText = document.querySelector("#depth");

const messageBox = document.querySelector("#messageBox");
const messageTitle = document.querySelector("#messageTitle");
const messageText = document.querySelector("#messageText");

const startBtn = document.querySelector("#startBtn");
const upgradeBtn = document.querySelector("#upgradeBtn");
const restartBtn = document.querySelector("#restartBtn");

const tileSize = 40;
const cols = canvas.width / tileSize;
const rows = 90;
const visibleRows = canvas.height / tileSize;

let world = [];
let miner;
let money;
let fuel;
let maxFuel;
let tankLevel;
let cargo;
let maxCargo;
let cameraY;
let gameRunning;
let gameOver;

const blockInfo = {
    dirt: {
        color: "#6b3f22",
        value: 0,
        fuelCost: 1,
        cargo: 0
    },
    stone: {
        color: "#555555",
        value: 0,
        fuelCost: 2,
        cargo: 0
    },
    coal: {
        color: "#202020",
        value: 8,
        fuelCost: 2,
        cargo: 5
    },
    iron: {
        color: "#b66b35",
        value: 18,
        fuelCost: 3,
        cargo: 8
    },
    gold: {
        color: "#d6a829",
        value: 45,
        fuelCost: 3,
        cargo: 12
    },
    diamond: {
        color: "#58d6ff",
        value: 120,
        fuelCost: 4,
        cargo: 18
    }
};

function resetGame() {
    world = [];

    money = 0;
    maxFuel = 100;
    fuel = maxFuel;
    tankLevel = 1;

    cargo = 0;
    maxCargo = 50;

    cameraY = 0;
    gameRunning = false;
    gameOver = false;

    miner = {
        x: Math.floor(cols / 2),
        y: 0
    };

    upgradeBtn.textContent = "Upgrade Tank: $150";

    makeWorld();
    updateStats();
    hideMessage();
    drawGame();
}

function makeWorld() {
    for (let y = 0; y < rows; y++) {
        let row = [];

        for (let x = 0; x < cols; x++) {
            if (y === 0) {
                row.push("air");
            } else {
                row.push(randomBlock(y));
            }
        }

        world.push(row);
    }
}

function randomBlock(y) {
    let chance = Math.random();

    if (y < 8) {
        if (chance < 0.82) {
            return "dirt";
        }

        if (chance < 0.97) {
            return "stone";
        }

        return "coal";
    }

    if (y < 25) {
        if (chance < 0.55) {
            return "dirt";
        }

        if (chance < 0.84) {
            return "stone";
        }

        if (chance < 0.96) {
            return "coal";
        }

        return "iron";
    }

    if (y < 50) {
        if (chance < 0.38) {
            return "dirt";
        }

        if (chance < 0.72) {
            return "stone";
        }

        if (chance < 0.86) {
            return "coal";
        }

        if (chance < 0.96) {
            return "iron";
        }

        return "gold";
    }

    if (chance < 0.28) {
        return "dirt";
    }

    if (chance < 0.66) {
        return "stone";
    }

    if (chance < 0.78) {
        return "coal";
    }

    if (chance < 0.91) {
        return "iron";
    }

    if (chance < 0.985) {
        return "gold";
    }

    return "diamond";
}

function startGame() {
    if (gameOver) {
        return;
    }

    gameRunning = true;

    showMessage(
        "Go Mine!",
        "Only ores make money. Return to the surface to sell cargo and refill fuel."
    );
}

function upgradeTank() {
    let upgradeCost = tankLevel * 150;

    if (miner.y !== 0) {
        showMessage(
            "Return to Surface",
            "You can only upgrade your tank at the surface."
        );

        return;
    }

    if (money < upgradeCost) {
        showMessage(
            "Not Enough Money",
            "You need $" + upgradeCost + " to upgrade your fuel tank."
        );

        return;
    }

    money -= upgradeCost;
    tankLevel++;
    maxFuel += 50;
    fuel = maxFuel;

    upgradeBtn.textContent = "Upgrade Tank: $" + tankLevel * 150;

    updateStats();

    showMessage(
        "Tank Upgraded",
        "Your max fuel is now " + maxFuel + "."
    );
}

function moveMiner(dx, dy) {
    if (!gameRunning || gameOver) {
        return;
    }

    let newX = miner.x + dx;
    let newY = miner.y + dy;

    if (
        newX < 0 ||
        newX >= cols ||
        newY < 0 ||
        newY >= rows
    ) {
        return;
    }

    let targetBlock = world[newY][newX];
    let fuelCost = getMoveFuelCost(newY, targetBlock);

    if (targetBlock !== "air") {
        if (!canCarry(targetBlock)) {
            showMessage(
                "Cargo Full",
                "Return to the surface to sell your ore before mining more."
            );

            return;
        }
    }

    fuel -= fuelCost;

    if (fuel <= 0) {
        fuel = 0;
        updateStats();
        drawGame();
        endGame();
        return;
    }

    if (targetBlock !== "air") {
        if (blockInfo[targetBlock].value > 0) {
            money += blockInfo[targetBlock].value;
            cargo += blockInfo[targetBlock].cargo;
        }

        world[newY][newX] = "air";
    }

    miner.x = newX;
    miner.y = newY;

    if (miner.y === 0) {
        fuel = maxFuel;
        cargo = 0;

        showMessage(
            "Surface Reached",
            "Fuel refilled and cargo sold."
        );
    } else {
        hideMessage();
    }

    updateCamera();
    updateStats();
    drawGame();
}

function canCarry(block) {
    return cargo + blockInfo[block].cargo <= maxCargo;
}

function getMoveFuelCost(newY, block) {
    let depthCost = 1;

    if (newY >= 20) {
        depthCost = 2;
    }

    if (newY >= 45) {
        depthCost = 3;
    }

    if (newY >= 70) {
        depthCost = 4;
    }

    if (block !== "air") {
        return depthCost + blockInfo[block].fuelCost;
    }

    return depthCost;
}

function updateCamera() {
    let targetCamera = miner.y - Math.floor(visibleRows / 2);

    if (targetCamera < 0) {
        targetCamera = 0;
    }

    if (targetCamera > rows - visibleRows) {
        targetCamera = rows - visibleRows;
    }

    cameraY = targetCamera;
}

function updateStats() {
    moneyText.textContent = "$" + money;
    fuelText.textContent = fuel + " / " + maxFuel;
    cargoText.textContent = cargo + " / " + maxCargo;
    depthText.textContent = miner.y;
}

function drawGame() {
    ctx.fillStyle = "#1b0d06";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawWorld();
    drawMiner();
    drawSurfaceLine();

    if (!gameRunning && !gameOver) {
        drawStartScreen();
    }
}

function drawWorld() {
    for (let y = 0; y < visibleRows; y++) {
        for (let x = 0; x < cols; x++) {
            let worldY = y + cameraY;
            let block = world[worldY][x];

            drawBlock(block, x * tileSize, y * tileSize, worldY);
        }
    }
}

function drawBlock(block, screenX, screenY, worldY) {
    if (block === "air") {
        if (worldY === 0) {
            ctx.fillStyle = "#87ceeb";
        } else {
            ctx.fillStyle = "#1b0d06";
        }

        ctx.fillRect(screenX, screenY, tileSize, tileSize);
        return;
    }

    ctx.fillStyle = blockInfo[block].color;
    ctx.fillRect(screenX, screenY, tileSize, tileSize);

    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.strokeRect(screenX, screenY, tileSize, tileSize);

    if (block === "coal") {
        drawOreDot(screenX, screenY, "#000000");
    }

    if (block === "iron") {
        drawOreDot(screenX, screenY, "#ff9955");
    }

    if (block === "gold") {
        drawOreDot(screenX, screenY, "#ffe066");
    }

    if (block === "diamond") {
        drawOreDot(screenX, screenY, "#b8f3ff");
    }
}

function drawOreDot(x, y, color) {
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(x + 14, y + 15, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + 27, y + 26, 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawMiner() {
    let screenX = miner.x * tileSize;
    let screenY = (miner.y - cameraY) * tileSize;

    ctx.fillStyle = "#ffd166";
    ctx.fillRect(screenX + 8, screenY + 10, 24, 22);

    ctx.fillStyle = "#2b2b2b";
    ctx.fillRect(screenX + 9, screenY + 29, 8, 8);
    ctx.fillRect(screenX + 23, screenY + 29, 8, 8);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(screenX + 14, screenY + 15, 5, 5);
    ctx.fillRect(screenX + 22, screenY + 15, 5, 5);

    ctx.fillStyle = "#c27a2c";
    ctx.fillRect(screenX + 11, screenY + 6, 18, 6);
}

function drawSurfaceLine() {
    if (cameraY === 0) {
        ctx.fillStyle = "#3fa34d";
        ctx.fillRect(0, tileSize - 6, canvas.width, 6);
    }
}

function drawStartScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "34px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Mini Miner", canvas.width / 2, canvas.height / 2 - 45);

    ctx.font = "18px Arial";
    ctx.fillText("Press Start, then use WASD or Arrow Keys", canvas.width / 2, canvas.height / 2);
    ctx.fillText("Return to the surface to sell cargo and refuel", canvas.width / 2, canvas.height / 2 + 32);
}

function endGame() {
    gameRunning = false;
    gameOver = true;

    showMessage(
        "Out of Fuel",
        "Game over. You finished with $" + money + "."
    );

    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "34px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Out of Fuel", canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = "18px Arial";
    ctx.fillText("Final Money: $" + money, canvas.width / 2, canvas.height / 2 + 18);
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
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
    ) {
        event.preventDefault();
    }

    if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
        moveMiner(0, -1);
    }

    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
        moveMiner(0, 1);
    }

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        moveMiner(-1, 0);
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        moveMiner(1, 0);
    }
});

startBtn.addEventListener("click", startGame);
upgradeBtn.addEventListener("click", upgradeTank);
restartBtn.addEventListener("click", resetGame);

resetGame();