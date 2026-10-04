```javascript
// ============================================================
// ECHOBOUND — THE LOST SIGNAL
// COMPLETE APP.JS
// ============================================================

// ------------------------------------------------------------
// CANVAS
// ------------------------------------------------------------

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// ------------------------------------------------------------
// GAME STATE
// ------------------------------------------------------------

let gameRunning = false;
let gamePaused = false;
let gameOver = false;

let score = 0;
let kills = 0;
let credits = 0;

let lastTime = 0;

// ------------------------------------------------------------
// WORLD
// ------------------------------------------------------------

const WORLD_WIDTH = 6000;
const WORLD_HEIGHT = 6000;

const camera = {
    x: 0,
    y: 0
};

// ------------------------------------------------------------
// PLAYER / TANK
// ------------------------------------------------------------

const player = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,

    width: 72,
    height: 52,

    angle: 0,

    speed: 260,
    reverseSpeed: 150,
    turnSpeed: 2.4,

    health: 100,
    maxHealth: 100,

    energy: 100,
    maxEnergy: 100,

    ammo: 12,
    maxAmmo: 12,

    reloadTime: 1.5,
    reloadTimer: 0,
    reloading: false,

    shootCooldown: 0,

    cannonAngle: 0
};

// ------------------------------------------------------------
// INPUT
// ------------------------------------------------------------

const keys = {};

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;

    if (event.key === "Escape") {
        togglePause();
    }

    if (event.key.toLowerCase() === "r") {
        startReload();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

// ------------------------------------------------------------
// MOUSE
// ------------------------------------------------------------

const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    down: false
};

canvas.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;

    updateCannonDirection();
});

canvas.addEventListener("mousedown", () => {
    mouse.down = true;
});

canvas.addEventListener("mouseup", () => {
    mouse.down = false;
});

// ------------------------------------------------------------
// TERRAIN
// ------------------------------------------------------------

const trees = [];
const rocks = [];
const bushes = [];
const buildings = [];
const enemies = [];
const bullets = [];
const particles = [];

// ------------------------------------------------------------
// RANDOM HELPER
// ------------------------------------------------------------

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// ------------------------------------------------------------
// CREATE WORLD
// ------------------------------------------------------------

function createWorld() {

    trees.length = 0;
    rocks.length = 0;
    bushes.length = 0;
    buildings.length = 0;

    // TREES
    for (let i = 0; i < 180; i++) {

        trees.push({
            x: random(100, WORLD_WIDTH - 100),
            y: random(100, WORLD_HEIGHT - 100),
            radius: random(18, 32)
        });
    }

    // ROCKS
    for (let i = 0; i < 140; i++) {

        rocks.push({
            x: random(100, WORLD_WIDTH - 100),
            y: random(100, WORLD_HEIGHT - 100),
            radius: random(10, 25)
        });
    }

    // BUSHES
    for (let i = 0; i < 220; i++) {

        bushes.push({
            x: random(100, WORLD_WIDTH - 100),
            y: random(100, WORLD_HEIGHT - 100),
            radius: random(7, 16)
        });
    }

    // BUILDINGS
    for (let i = 0; i < 25; i++) {

        const width = randomInt(180, 360);
        const height = randomInt(140, 300);

        buildings.push({
            x: random(300, WORLD_WIDTH - 500),
            y: random(300, WORLD_HEIGHT - 500),
            width,
            height
        });
    }
}

// ------------------------------------------------------------
// ENEMIES
// ------------------------------------------------------------

function createEnemy() {

    const angle = random(0, Math.PI * 2);
    const spawnDistance = random(700, 1400);

    const enemy = {

        x: player.x + Math.cos(angle) * spawnDistance,
        y: player.y + Math.sin(angle) * spawnDistance,

        radius: 25,

        health: 30,
        maxHealth: 30,

        speed: random(60, 90),

        attackCooldown: random(0, 2),

        type: Math.random() < 0.5 ? "crawler" : "guardian"
    };

    enemy.x = Math.max(100, Math.min(WORLD_WIDTH - 100, enemy.x));
    enemy.y = Math.max(100, Math.min(WORLD_HEIGHT - 100, enemy.y));

    enemies.push(enemy);
}

// ------------------------------------------------------------
// START GAME
// ------------------------------------------------------------

function startGame() {

    gameRunning = true;
    gamePaused = false;
    gameOver = false;

    score = 0;
    kills = 0;
    credits = 0;

    player.x = WORLD_WIDTH / 2;
    player.y = WORLD_HEIGHT / 2;

    player.angle = 0;
    player.cannonAngle = 0;

    player.health = player.maxHealth;
    player.energy = player.maxEnergy;

    player.ammo = player.maxAmmo;
    player.reloading = false;
    player.reloadTimer = 0;

    enemies.length = 0;
    bullets.length = 0;
    particles.length = 0;

    createWorld();

    for (let i = 0; i < 8; i++) {
        createEnemy();
    }

    hideElement("menu");
    showElement("hud");

    requestAnimationFrame(gameLoop);
}

// ------------------------------------------------------------
// PAUSE
// ------------------------------------------------------------

function togglePause() {

    if (!gameRunning || gameOver) {
        return;
    }

    gamePaused = !gamePaused;

    const pauseScreen = document.getElementById("pause");

    if (pauseScreen) {
        pauseScreen.style.display = gamePaused ? "flex" : "none";
    }
}

// ------------------------------------------------------------
// GAME OVER
// ------------------------------------------------------------

function endGame() {

    gameOver = true;
    gameRunning = false;

    const menu = document.getElementById("menu");

    if (menu) {
        menu.style.display = "flex";

        const title = menu.querySelector("h1");

        if (title) {
            title.textContent = "SIGNAL LOST";
        }
    }

    const startButton = document.querySelector("#menu button");

    if (startButton) {
        startButton.textContent = "NEW RUN";
    }
}

// ------------------------------------------------------------
// MOVEMENT
// ------------------------------------------------------------

function updatePlayer(delta) {

    if (keys["a"] || keys["arrowleft"]) {
        player.angle -= player.turnSpeed * delta;
    }

    if (keys["d"] || keys["arrowright"]) {
        player.angle += player.turnSpeed * delta;
    }

    let movement = 0;

    if (keys["w"] || keys["arrowup"]) {
        movement = player.speed;
    }

    if (keys["s"] || keys["arrowdown"]) {
        movement = -player.reverseSpeed;
    }

    if (movement !== 0) {

        const nextX =
            player.x +
            Math.cos(player.angle) *
            movement *
            delta;

        const nextY =
            player.y +
            Math.sin(player.angle) *
            movement *
            delta;

        if (!collidesWithBuilding(nextX, nextY, player.width * 0.35)) {

            player.x = nextX;
            player.y = nextY;
        }
    }

    player.x = Math.max(50, Math.min(WORLD_WIDTH - 50, player.x));
    player.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, player.y));
}

// ------------------------------------------------------------
// CANNON AIM
// ------------------------------------------------------------

function updateCannonDirection() {

    const worldMouse = screenToWorld(mouse.x, mouse.y);

    player.cannonAngle = Math.atan2(
        worldMouse.y - player.y,
        worldMouse.x - player.x
    );
}

// ------------------------------------------------------------
// SCREEN TO WORLD
// ------------------------------------------------------------

function screenToWorld(screenX, screenY) {

    return {
        x: screenX - canvas.width / 2 + camera.x,
        y: screenY - canvas.height / 2 + camera.y
    };
}

// ------------------------------------------------------------
// SHOOTING
// ------------------------------------------------------------

function updateShooting(delta) {

    if (player.shootCooldown > 0) {
        player.shootCooldown -= delta;
    }

    if (player.reloading) {
        player.reloadTimer -= delta;

        if (player.reloadTimer <= 0) {
            finishReload();
        }

        return;
    }

    if (mouse.down && player.shootCooldown <= 0) {
        shoot();
    }
}

// ------------------------------------------------------------
// SHOOT
// ------------------------------------------------------------

function shoot() {

    if (player.ammo <= 0) {
        startReload();
        return;
    }

    player.ammo--;

    player.shootCooldown = 0.22;

    const barrelLength = 70;

    const startX =
        player.x +
        Math.cos(player.cannonAngle) *
        barrelLength;

    const startY =
        player.y +
        Math.sin(player.cannonAngle) *
        barrelLength;

    bullets.push({

        x: startX,
        y: startY,

        vx: Math.cos(player.cannonAngle) * 850,
        vy: Math.sin(player.cannonAngle) * 850,

        radius: 6,

        damage: 15,

        life: 1.5
    });

    createMuzzleFlash(startX, startY);
}

// ------------------------------------------------------------
// RELOAD
// ------------------------------------------------------------

function startReload() {

    if (player.reloading) {
        return;
    }

    if (player.ammo >= player.maxAmmo) {
        return;
    }

    player.reloading = true;
    player.reloadTimer = player.reloadTime;
}

function finishReload() {

    player.reloading = false;
    player.ammo = player.maxAmmo;
}

// ------------------------------------------------------------
// BULLETS
// ------------------------------------------------------------

function updateBullets(delta) {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const bullet = bullets[i];

        bullet.x += bullet.vx * delta;
        bullet.y += bullet.vy * delta;

        bullet.life -= delta;

        if (bullet.life <= 0) {
            bullets.splice(i, 1);
            continue;
        }

        if (
            bullet.x < 0 ||
            bullet.y < 0 ||
            bullet.x > WORLD_WIDTH ||
            bullet.y > WORLD_HEIGHT
        ) {
            bullets.splice(i, 1);
            continue;
        }

        if (collidesWithBuilding(bullet.x, bullet.y, bullet.radius)) {

            createHitEffect(bullet.x, bullet.y);

            bullets.splice(i, 1);
            continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {

            const enemy = enemies[j];

            const d = Math.hypot(
                bullet.x - enemy.x,
                bullet.y - enemy.y
            );

            if (d < enemy.radius + bullet.radius) {

                enemy.health -= bullet.damage;

                createHitEffect(bullet.x, bullet.y);

                bullets.splice(i, 1);

                if (enemy.health <= 0) {

                    kills++;
                    score += 100;
                    credits += 25;

                    createExplosion(enemy.x, enemy.y);

                    enemies.splice(j, 1);

                    setTimeout(() => {
                        if (gameRunning && !gameOver) {
                            createEnemy();
                        }
                    }, 1200);
                }

                break;
            }
        }
    }
}

// ------------------------------------------------------------
// ENEMIES
// ------------------------------------------------------------

function updateEnemies(delta) {

    for (const enemy of enemies) {

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        const distanceToPlayer = Math.hypot(dx, dy);

        if (distanceToPlayer > 100) {

            const directionX = dx / distanceToPlayer;
            const directionY = dy / distanceToPlayer;

            const nextX =
                enemy.x +
                directionX *
                enemy.speed *
                delta;

            const nextY =
                enemy.y +
                directionY *
                enemy.speed *
                delta;

            if (!collidesWithBuilding(nextX, nextY, enemy.radius)) {

                enemy.x = nextX;
                enemy.y = nextY;
            }
        }

        enemy.attackCooldown -= delta;

        if (
            distanceToPlayer < 500 &&
            enemy.attackCooldown <= 0
        ) {

            if (hasLineOfSight(enemy, player)) {

                player.health -= 5;

                enemy.attackCooldown = 1.2;

                createHitEffect(player.x, player.y);

                if (player.health <= 0) {
                    endGame();
                    return;
                }
            }
        }
    }
}

// ------------------------------------------------------------
// COLLISION WITH BUILDINGS
// ------------------------------------------------------------

function collidesWithBuilding(x, y, radius) {

    for (const building of buildings) {

        const closestX = Math.max(
            building.x,
            Math.min(x, building.x + building.width)
        );

        const closestY = Math.max(
            building.y,
            Math.min(y, building.y + building.height)
        );

        const dx = x - closestX;
        const dy = y - closestY;

        if (dx * dx + dy * dy < radius * radius) {
            return true;
        }
    }

    return false;
}

// ------------------------------------------------------------
// LINE OF SIGHT
// ------------------------------------------------------------

function hasLineOfSight(a, b) {

    const steps = 40;

    for (let i = 1; i < steps; i++) {

        const t = i / steps;

        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;

        if (collidesWithBuilding(x, y, 3)) {
            return false;
        }
    }

    return true;
}

// ------------------------------------------------------------
// PARTICLES
// ------------------------------------------------------------

function createMuzzleFlash(x, y) {

    for (let i = 0; i < 6; i++) {

        particles.push({
            x,
            y,
            vx: random(-80, 80),
            vy: random(-80, 80),
            life: 0.25,
            size: random(3, 8)
        });
    }
}

function createHitEffect(x, y) {

    for (let i = 0; i < 8; i++) {

        particles.push({
            x,
            y,
            vx: random(-120, 120),
            vy: random(-120, 120),
            life: 0.35,
            size: random(2, 6)
        });
    }
}

function createExplosion(x, y) {

    for (let i = 0; i < 20; i++) {

        particles.push({
            x,
            y,
            vx: random(-180, 180),
            vy: random(-180, 180),
            life: random(0.4, 0.9),
            size: random(3, 9)
        });
    }
}

function updateParticles(delta) {

    for (let i = particles.length - 1; i >= 0; i--) {

        const particle = particles[i];

        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;

        particle.life -= delta;

        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// ------------------------------------------------------------
// CAMERA
// ------------------------------------------------------------

function updateCamera() {

    // Camera stays centered on the tank.
    // This means the tank is always the center of the view.

    camera.x = player.x;
    camera.y = player.y;
}

// ------------------------------------------------------------
// DRAW WORLD
// ------------------------------------------------------------

function drawWorld() {

    ctx.fillStyle = "#172019";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // WORLD GRID

    const gridSize = 100;

    ctx.strokeStyle = "rgba(255,255,255,0.025)";
    ctx.lineWidth = 1;

    const startX =
        Math.floor(
            (camera.x - canvas.width / 2) /
            gridSize
        ) * gridSize;

    const startY =
        Math.floor(
            (camera.y - canvas.height / 2) /
            gridSize
        ) * gridSize;

    for (
        let x = startX;
        x < camera.x + canvas.width / 2;
        x += gridSize
    ) {

        const screenX =
            x - camera.x + canvas.width / 2;

        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvas.height);
        ctx.stroke();
    }

    for (
        let y = startY;
        y < camera.y + canvas.height / 2;
        y += gridSize
    ) {

        const screenY =
            y - camera.y + canvas.height / 2;

        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvas.width, screenY);
        ctx.stroke();
    }

    drawBushes();
    drawRocks();
    drawTrees();
    drawBuildings();
}

// ------------------------------------------------------------
// WORLD POSITION
// ------------------------------------------------------------

function worldToScreen(x, y) {

    return {
        x: x - camera.x + canvas.width / 2,
        y: y - camera.y + canvas.height / 2
    };
}

// ------------------------------------------------------------
// TREES
// ------------------------------------------------------------

function drawTrees() {

    for (const tree of trees) {

        const p = worldToScreen(tree.x, tree.y);

        if (
            p.x < -100 ||
            p.y < -100 ||
            p.x > canvas.width + 100 ||
            p.y > canvas.height + 100
        ) {
            continue;
        }

        // shadow

        ctx.fillStyle = "rgba(0,0,0,0.25)";

        ctx.beginPath();
        ctx.ellipse(
            p.x,
            p.y + tree.radius * 0.8,
            tree.radius * 1.2,
            tree.radius * 0.45,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // trunk

        ctx.fillStyle = "#4a3324";

        ctx.fillRect(
            p.x - 6,
            p.y,
            12,
            tree.radius * 1.2
        );

        // leaves

        ctx.fillStyle = "#2d6b3b";

        ctx.beginPath();
        ctx.arc(
            p.x,
            p.y,
            tree.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#3e8650";

        ctx.beginPath();
        ctx.arc(
            p.x - tree.radius * 0.35,
            p.y - tree.radius * 0.2,
            tree.radius * 0.45,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

// ------------------------------------------------------------
// ROCKS
// ------------------------------------------------------------

function drawRocks() {

    for (const rock of rocks) {

        const p = worldToScreen(rock.x, rock.y);

        ctx.fillStyle = "#5d6264";

        ctx.beginPath();
        ctx.arc(
            p.x,
            p.y,
            rock.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.fillStyle = "#777d80";

        ctx.beginPath();
        ctx.arc(
            p.x - rock.radius * 0.25,
            p.y - rock.radius * 0.25,
            rock.radius * 0.35,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

// ------------------------------------------------------------
// BUSHES
// ------------------------------------------------------------

function drawBushes() {

    for (const bush of bushes) {

        const p = worldToScreen(bush.x, bush.y);

        ctx.fillStyle = "#25542f";

        ctx.beginPath();
        ctx.arc(
            p.x,
            p.y,
            bush.radius,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

// ------------------------------------------------------------
// BUILDINGS
// ------------------------------------------------------------

function drawBuildings() {

    for (const building of buildings) {

        const p = worldToScreen(
            building.x,
            building.y
        );

        ctx.fillStyle = "#303941";

        ctx.fillRect(
            p.x,
            p.y,
            building.width,
            building.height
        );

        ctx.strokeStyle = "#65717a";
        ctx.lineWidth = 4;

        ctx.strokeRect(
            p.x,
            p.y,
            building.width,
            building.height
        );

        // windows

        ctx.fillStyle = "#1b2429";

        const windowSize = 28;

        for (
            let x = p.x + 35;
            x < p.x + building.width - 20;
            x += 60
        ) {

            for (
                let y = p.y + 35;
                y < p.y + building.height - 20;
                y += 60
            ) {

                ctx.fillRect(
                    x,
                    y,
                    windowSize,
                    windowSize
                );
            }
        }
    }
}

// ------------------------------------------------------------
// DRAW PLAYER TANK
// ------------------------------------------------------------

function drawPlayer() {

    const p = worldToScreen(
        player.x,
        player.y
    );

    ctx.save();

    ctx.translate(p.x, p.y);

    // tank rotation

    ctx.rotate(player.angle);

    // shadow

    ctx.fillStyle = "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        12,
        46,
        30,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // tracks

    ctx.fillStyle = "#202529";

    ctx.fillRect(
        -40,
        -25,
        80,
        12
    );

    ctx.fillRect(
        -40,
        13,
        80,
        12
    );

    // tank body

    ctx.fillStyle = "#657d6b";

    ctx.beginPath();

    ctx.roundRect(
        -34,
        -20,
        68,
        40,
        8
    );

    ctx.fill();

    // armor

    ctx.strokeStyle = "#9caf9f";
    ctx.lineWidth = 3;

    ctx.stroke();

    ctx.restore();

    // turret separately
    // this allows the turret to aim with the mouse

    ctx.save();

    ctx.translate(p.x, p.y);

    ctx.rotate(player.cannonAngle);

    // turret

    ctx.fillStyle = "#4e6255";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        22,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // cannon

    ctx.fillStyle = "#29312d";

    ctx.fillRect(
        0,
        -6,
        70,
        12
    );

    // cannon end

    ctx.fillStyle = "#171c1a";

    ctx.fillRect(
        62,
        -8,
        14,
        16
    );

    ctx.restore();
}

// ------------------------------------------------------------
// DRAW ENEMIES
// ------------------------------------------------------------

function drawEnemies() {

    for (const enemy of enemies) {

        const p = worldToScreen(
            enemy.x,
            enemy.y
        );

        // body

        ctx.fillStyle =
            enemy.type === "crawler"
                ? "#6c4b83"
                : "#8b6a37";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // core

        ctx.fillStyle = "#d6dce0";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            7,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // health bar

        const healthWidth = 50;

        ctx.fillStyle = "#1b1d1e";

        ctx.fillRect(
            p.x - healthWidth / 2,
            p.y - enemy.radius - 12,
            healthWidth,
            6
        );

        ctx.fillStyle = "#65c96b";

        ctx.fillRect(
            p.x - healthWidth / 2,
            p.y - enemy.radius - 12,
            healthWidth *
            (enemy.health / enemy.maxHealth),
            6
        );
    }
}

// ------------------------------------------------------------
// DRAW BULLETS
// ------------------------------------------------------------

function drawBullets() {

    for (const bullet of bullets) {

        const p = worldToScreen(
            bullet.x,
            bullet.y
        );

        ctx.fillStyle = "#d9f4ff";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ------------------------------------------------------------
// DRAW PARTICLES
// ------------------------------------------------------------

function drawParticles() {

    for (const particle of particles) {

        const p = worldToScreen(
            particle.x,
            particle.y
        );

        ctx.globalAlpha =
            Math.max(0, particle.life);

        ctx.fillStyle = "#d5e2df";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            particle.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}

// ------------------------------------------------------------
// HUD
// ------------------------------------------------------------

function updateHUD() {

    setText("health", Math.max(0, Math.floor(player.health)));
    setText("energy", Math.max(0, Math.floor(player.energy)));
    setText("ammo", player.ammo);
    setText("kills", kills);
    setText("credits", credits);
    setText("score", score);

    const healthBar = document.getElementById("healthBar");

    if (healthBar) {

        healthBar.style.width =
            `${Math.max(0, player.health)}%`;
    }

    const energyBar = document.getElementById("energyBar");

    if (energyBar) {

        energyBar.style.width =
            `${Math.max(0, player.energy)}%`;
    }
}

// ------------------------------------------------------------
// ENERGY
// ------------------------------------------------------------

function updateEnergy(delta) {

    if (
        keys["shift"] &&
        player.energy > 0
    ) {

        player.energy -= 25 * delta;
    } else {

        player.energy += 15 * delta;
    }

    player.energy =
        Math.max(
            0,
            Math.min(
                player.maxEnergy,
                player.energy
            )
        );
}

// ------------------------------------------------------------
// DRAW
// ------------------------------------------------------------

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    drawWorld();
    drawBullets();
    drawEnemies();
    drawPlayer();
    drawParticles();
}

// ------------------------------------------------------------
// GAME LOOP
// ------------------------------------------------------------

function gameLoop(timestamp) {

    if (!gameRunning) {
        return;
    }

    const delta =
        Math.min(
            (timestamp - lastTime) / 1000,
            0.05
        );

    lastTime = timestamp;

    if (!gamePaused && !gameOver) {

        updatePlayer(delta);
        updateCannonDirection();
        updateShooting(delta);
        updateBullets(delta);
        updateEnemies(delta);
        updateParticles(delta);
        updateEnergy(delta);
        updateCamera();
        updateHUD();

        draw();
    }

    requestAnimationFrame(gameLoop);
}

// ------------------------------------------------------------
// UI HELPERS
// ------------------------------------------------------------

function showElement(id) {

    const element = document.getElementById(id);

    if (element) {
        element.style.display = "";
    }
}

function hideElement(id) {

    const element = document.getElementById(id);

    if (element) {
        element.style.display = "none";
    }
}

function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

// ------------------------------------------------------------
// MENU BUTTON
// ------------------------------------------------------------

function connectStartButton() {

    const buttons =
        document.querySelectorAll("button");

    buttons.forEach(button => {

        const text =
            button.textContent
                .trim()
                .toLowerCase();

        if (
            text === "start" ||
            text === "new run" ||
            text === "start game"
        ) {

            button.addEventListener(
                "click",
                startGame
            );
        }
    });
}

// ------------------------------------------------------------
// SAVE SYSTEM
// ------------------------------------------------------------

function saveGame(slot = 1) {

    const saveData = {

        player: {
            x: player.x,
            y: player.y,
            health: player.health,
            energy: player.energy,
            ammo: player.ammo
        },

        score,
        kills,
        credits,

        savedAt: Date.now()
    };

    localStorage.setItem(
        `echobound_save_${slot}`,
        JSON.stringify(saveData)
    );
}

// ------------------------------------------------------------
// LOAD SYSTEM
// ------------------------------------------------------------

function loadGame(slot = 1) {

    const data =
        localStorage.getItem(
            `echobound_save_${slot}`
        );

    if (!data) {
        return false;
    }

    try {

        const saveData =
            JSON.parse(data);

        player.x =
            saveData.player.x;

        player.y =
            saveData.player.y;

        player.health =
            saveData.player.health;

        player.energy =
            saveData.player.energy;

        player.ammo =
            saveData.player.ammo;

        score =
            saveData.score || 0;

        kills =
            saveData.kills || 0;

        credits =
            saveData.credits || 0;

        return true;

    } catch (error) {

        console.error(
            "Save file could not be loaded:",
            error
        );

        return false;
    }
}

// ------------------------------------------------------------
// AUTO SAVE
// ------------------------------------------------------------

setInterval(() => {

    if (gameRunning && !gameOver) {
        saveGame(1);
    }

}, 10000);

// ------------------------------------------------------------
// STARTUP
// ------------------------------------------------------------

createWorld();

connectStartButton();

console.log(
    "ECHOBOUND loaded successfully."
);

```
