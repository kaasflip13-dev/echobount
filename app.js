// ============================================================
// ECHOBOUND — THE LOST SIGNAL
// TANK + ALIENS — STABLE VERSION
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;

window.addEventListener("resize", () => {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
});

// ============================================================
// WORLD
// ============================================================

const WORLD_W = 7000;
const WORLD_H = 7000;
const MAX_ENEMIES = 5;

let gameRunning = false;
let paused = false;

let cameraX = 0;
let cameraY = 0;

let score = 0;
let kills = 0;
let credits = 0;
let level = 1;
let xp = 0;

let missionProgress = 0;
const missionTarget = 15;

let gameTime = 0;

const keys = {};

const mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

// ============================================================
// PLAYER TANK
// ============================================================

const player = {
    x: 0,
    y: 0,

    radius: 24,

    speed: 220,
    sprintSpeed: 320,

    angle: 0,
    turretAngle: 0,

    health: 100,
    maxHealth: 100,

    energy: 100,
    maxEnergy: 100,

    invincible: 0,
    dashCooldown: 0,

    weapon: 0,
    fireCooldown: 0,
    reloadTimer: 0
};

// ============================================================
// WEAPONS
// ============================================================

const weapons = [
    {
        name: "PULSE",
        damage: 1,
        fireRate: 0.18,
        bulletSpeed: 900,
        maxAmmo: 12,
        ammo: 12
    },
    {
        name: "BURST",
        damage: 1,
        fireRate: 0.32,
        bulletSpeed: 950,
        maxAmmo: 8,
        ammo: 8
    },
    {
        name: "CANNON",
        damage: 3,
        fireRate: 0.65,
        bulletSpeed: 700,
        maxAmmo: 4,
        ammo: 4
    }
];

// ============================================================
// OBJECTS
// ============================================================

let buildings = [];
let doors = [];
let trees = [];
let rocks = [];
let loot = [];
let npcs = [];

let enemies = [];
let bullets = [];
let enemyBullets = [];
let particles = [];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function randomPosition() {
    return {
        x: random(-WORLD_W / 2 + 100, WORLD_W / 2 - 100),
        y: random(-WORLD_H / 2 + 100, WORLD_H / 2 - 100)
    };
}

// ============================================================
// INPUT
// ============================================================

// KEYBOARD
window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    keys[key] = true;

    // Don't let space scroll the page
    if (event.code === "Space") {
        event.preventDefault();

        if (gameRunning && !paused) {
            dash();
        }
    }

    if (key === "r") {
        reload();
    }

    if (key === "1") {
        player.weapon = 0;
    }

    if (key === "2") {
        player.weapon = 1;
    }

    if (key === "3") {
        player.weapon = 2;
    }

    if (key === "escape") {
        togglePause();
    }
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

// MOUSE
canvas.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});

canvas.addEventListener("mousedown", (event) => {
    if (event.button === 0) {
        mouse.down = true;
    }
});

window.addEventListener("mouseup", (event) => {
    if (event.button === 0) {
        mouse.down = false;
    }
});

// Make sure movement never gets stuck
window.addEventListener("blur", () => {
    for (const key in keys) {
        keys[key] = false;
    }

    mouse.down = false;
});

// ============================================================
// MENU
// ============================================================

const menu = document.getElementById("menu");
const pauseMenu = document.getElementById("pause");

const newGameButton = document.getElementById("newGame");
const loadGameButton = document.getElementById("loadGame");
const achievementsButton = document.getElementById("achievementsButton");
const controlsButton = document.getElementById("controlsButton");

const resumeButton = document.getElementById("resume");
const saveButton = document.getElementById("save");
const quitButton = document.getElementById("quit");

if (newGameButton) {
    newGameButton.addEventListener("click", startNewGame);
}

if (loadGameButton) {
    loadGameButton.addEventListener("click", loadGame);
}

if (achievementsButton) {
    achievementsButton.addEventListener("click", showAchievements);
}

if (controlsButton) {
    controlsButton.addEventListener("click", showControls);
}

if (resumeButton) {
    resumeButton.addEventListener("click", () => {
        paused = false;

        if (pauseMenu) {
            pauseMenu.style.display = "none";
        }
    });
}

if (saveButton) {
    saveButton.addEventListener("click", saveGame);
}

if (quitButton) {
    quitButton.addEventListener("click", quitToMenu);
}

// ============================================================
// START NEW GAME
// ============================================================

function startNewGame() {
    score = 0;
    kills = 0;
    credits = 0;
    level = 1;
    xp = 0;
    missionProgress = 0;

    player.x = 0;
    player.y = 0;
    player.health = player.maxHealth;
    player.energy = player.maxEnergy;
    player.weapon = 0;
    player.fireCooldown = 0;
    player.reloadTimer = 0;
    player.dashCooldown = 0;

    for (const weapon of weapons) {
        weapon.ammo = weapon.maxAmmo;
    }

    bullets = [];
    enemyBullets = [];
    particles = [];

    generateWorld();

    gameRunning = true;
    paused = false;

    if (menu) {
        menu.style.display = "none";
    }

    if (pauseMenu) {
        pauseMenu.style.display = "none";
    }

    // Focus the canvas so keyboard input works immediately
    canvas.focus();

    updateHUD();
}

// ============================================================
// WORLD GENERATION
// ============================================================

function generateWorld() {
    buildings = [];
    doors = [];
    trees = [];
    rocks = [];
    loot = [];
    npcs = [];
    enemies = [];

    // BUILDINGS
    const buildingPositions = [
        [-1500, -900],
        [1000, -1400],
        [-1900, 900],
        [1200, 1000],
        [0, 1800],
        [1900, -200],
        [-3000, -200],
        [3000, 1300]
    ];

    for (const position of buildingPositions) {
        const width = random(280, 420);
        const height = random(220, 340);

        buildings.push({
            x: position[0],
            y: position[1],
            w: width,
            h: height
        });

        doors.push({
            x: position[0] + width / 2 - 30,
            y: position[1] + height - 8,
            w: 60,
            h: 18,
            open: false
        });
    }

    // TREES
    for (let i = 0; i < 160; i++) {
        const p = randomPosition();

        if (!nearBuilding(p.x, p.y, 100)) {
            trees.push({
                x: p.x,
                y: p.y,
                size: random(18, 36)
            });
        }
    }

    // ROCKS
    for (let i = 0; i < 100; i++) {
        const p = randomPosition();

        if (!nearBuilding(p.x, p.y, 70)) {
            rocks.push({
                x: p.x,
                y: p.y,
                size: random(12, 28)
            });
        }
    }

    // LOOT
    for (let i = 0; i < 35; i++) {
        const p = randomPosition();

        loot.push({
            x: p.x,
            y: p.y,
            type: Math.random() < 0.5 ? "energy" : "credits",
            collected: false,
            pulse: random(0, Math.PI * 2)
        });
    }

    // NPCs
    for (let i = 0; i < 18; i++) {
        const p = randomPosition();

        npcs.push({
            x: p.x,
            y: p.y,
            radius: 11,
            angle: random(0, Math.PI * 2),
            speed: random(10, 24),
            timer: random(1, 4),
            clothing: [
                "#527a78",
                "#765b4c",
                "#596b83",
                "#6f6a4d",
                "#704f62"
            ][Math.floor(Math.random() * 5)]
        });
    }

    // ALIENS
    for (let i = 0; i < 3; i++) {
        spawnAlien();
    }
}

function nearBuilding(x, y, range) {
    for (const building of buildings) {
        const closestX = clamp(
            x,
            building.x,
            building.x + building.w
        );

        const closestY = clamp(
            y,
            building.y,
            building.y + building.h
        );

        if (
            distance(
                x,
                y,
                closestX,
                closestY
            ) < range
        ) {
            return true;
        }
    }

    return false;
}

// ============================================================
// COLLISION
// ============================================================

function circleRectCollision(cx, cy, radius, rect) {
    const closestX = clamp(
        cx,
        rect.x,
        rect.x + rect.w
    );

    const closestY = clamp(
        cy,
        rect.y,
        rect.y + rect.h
    );

    const dx = cx - closestX;
    const dy = cy - closestY;

    return (
        dx * dx + dy * dy <
        radius * radius
    );
}

function blocked(x, y, radius) {
    const limitX = WORLD_W / 2 - radius;
    const limitY = WORLD_H / 2 - radius;

    if (
        x < -limitX ||
        x > limitX ||
        y < -limitY ||
        y > limitY
    ) {
        return true;
    }

    for (const building of buildings) {
        if (
            circleRectCollision(
                x,
                y,
                radius,
                building
            )
        ) {
            return true;
        }
    }

    for (const door of doors) {
        if (
            !door.open &&
            circleRectCollision(
                x,
                y,
                radius,
                door
            )
        ) {
            return true;
        }
    }

    return false;
}

// ============================================================
// PLAYER MOVEMENT
// ============================================================

function updatePlayer(dt) {
    // IMPORTANT:
    // Movement is completely independent from shooting.

    let moveX = 0;
    let moveY = 0;

    if (keys["w"]) {
        moveY -= 1;
    }

    if (keys["s"]) {
        moveY += 1;
    }

    if (keys["a"]) {
        moveX -= 1;
    }

    if (keys["d"]) {
        moveX += 1;
    }

    const length = Math.hypot(
        moveX,
        moveY
    );

    if (length > 0) {
        moveX /= length;
        moveY /= length;

        const sprinting =
            keys["shift"] &&
            player.energy > 0;

        const speed = sprinting
            ? player.sprintSpeed
            : player.speed;

        if (sprinting) {
            player.energy -= 25 * dt;
        } else {
            player.energy += 15 * dt;
        }

        player.energy = clamp(
            player.energy,
            0,
            player.maxEnergy
        );

        const newX =
            player.x +
            moveX *
            speed *
            dt;

        const newY =
            player.y +
            moveY *
            speed *
            dt;

        // X and Y are checked separately.
        // This makes movement much more reliable.
        if (
            !blocked(
                newX,
                player.y,
                player.radius
            )
        ) {
            player.x = newX;
        }

        if (
            !blocked(
                player.x,
                newY,
                player.radius
            )
        ) {
            player.y = newY;
        }

        player.angle = Math.atan2(
            moveY,
            moveX
        );
    } else {
        player.energy += 15 * dt;

        player.energy = clamp(
            player.energy,
            0,
            player.maxEnergy
        );
    }

    // Aim at mouse
    const mouseWorld =
        screenToWorld(
            mouse.x,
            mouse.y
        );

    player.turretAngle =
        Math.atan2(
            mouseWorld.y - player.y,
            mouseWorld.x - player.x
        );

    // Shooting timer
    if (player.fireCooldown > 0) {
        player.fireCooldown -= dt;
    }

    // Reload timer
    if (player.reloadTimer > 0) {
        player.reloadTimer -= dt;

        if (player.reloadTimer <= 0) {
            weapons[player.weapon].ammo =
                weapons[player.weapon].maxAmmo;

            player.reloadTimer = 0;
        }
    }

    // Dash cooldown
    if (player.dashCooldown > 0) {
        player.dashCooldown -= dt;
    }

    if (player.invincible > 0) {
        player.invincible -= dt;
    }

    // Shooting does NOT stop movement
    if (
        mouse.down &&
        player.reloadTimer <= 0
    ) {
        shoot();
    }
}

// ============================================================
// DASH
// ============================================================

function dash() {
    if (
        player.dashCooldown > 0 ||
        player.energy < 35
    ) {
        return;
    }

    let dx = 0;
    let dy = 0;

    if (keys["w"]) dy -= 1;
    if (keys["s"]) dy += 1;
    if (keys["a"]) dx -= 1;
    if (keys["d"]) dx += 1;

    if (
        dx === 0 &&
        dy === 0
    ) {
        dx = Math.cos(player.turretAngle);
        dy = Math.sin(player.turretAngle);
    }

    const length = Math.hypot(dx, dy);

    if (length === 0) {
        return;
    }

    dx /= length;
    dy /= length;

    const dashDistance = 140;

    const newX =
        player.x +
        dx *
        dashDistance;

    const newY =
        player.y +
        dy *
        dashDistance;

    if (
        !blocked(
            newX,
            player.y,
            player.radius
        )
    ) {
        player.x = newX;
    }

    if (
        !blocked(
            player.x,
            newY,
            player.radius
        )
    ) {
        player.y = newY;
    }

    player.energy -= 35;
    player.dashCooldown = 1.2;
    player.invincible = 0.35;

    createParticles(
        player.x,
        player.y,
        18
    );
}

// ============================================================
// SHOOT
// ============================================================

function shoot() {
    const weapon =
        weapons[player.weapon];

    if (
        player.fireCooldown > 0 ||
        player.reloadTimer > 0
    ) {
        return;
    }

    if (weapon.ammo <= 0) {
        reload();
        return;
    }

    weapon.ammo--;

    player.fireCooldown =
        weapon.fireRate;

    let angle =
        player.turretAngle;

    // Small spread for BURST
    if (player.weapon === 1) {
        angle += random(-0.06, 0.06);
    }

    const start = 38;

    bullets.push({
        x:
            player.x +
            Math.cos(angle) *
            start,

        y:
            player.y +
            Math.sin(angle) *
            start,

        vx:
            Math.cos(angle) *
            weapon.bulletSpeed,

        vy:
            Math.sin(angle) *
            weapon.bulletSpeed,

        damage: weapon.damage,

        radius:
            player.weapon === 2
                ? 6
                : 4,

        life: 1.5,

        type: player.weapon
    });

    createParticles(
        player.x +
        Math.cos(angle) *
        38,

        player.y +
        Math.sin(angle) *
        38,

        5
    );
}

// ============================================================
// RELOAD
// ============================================================

function reload() {
    const weapon =
        weapons[player.weapon];

    if (
        player.reloadTimer > 0 ||
        weapon.ammo >= weapon.maxAmmo
    ) {
        return;
    }

    player.reloadTimer = 0.8;
}

// ============================================================
// BULLET UPDATE
// ============================================================

function updateBullets(dt) {
    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {
        const bullet = bullets[i];

        bullet.x +=
            bullet.vx * dt;

        bullet.y +=
            bullet.vy * dt;

        bullet.life -= dt;

        let remove = false;

        // Building collision
        for (const building of buildings) {
            if (
                circleRectCollision(
                    bullet.x,
                    bullet.y,
                    bullet.radius,
                    building
                )
            ) {
                createParticles(
                    bullet.x,
                    bullet.y,
                    8
                );

                remove = true;
                break;
            }
        }

        if (remove) {
            bullets.splice(i, 1);
            continue;
        }

        // Alien collision
        for (
            let j = enemies.length - 1;
            j >= 0;
            j--
        ) {
            const alien = enemies[j];

            if (
                distance(
                    bullet.x,
                    bullet.y,
                    alien.x,
                    alien.y
                ) <
                bullet.radius +
                alien.radius
            ) {
                alien.health -=
                    bullet.damage;

                createParticles(
                    bullet.x,
                    bullet.y,
                    7
                );

                remove = true;

                if (
                    alien.health <= 0
                ) {
                    killAlien(
                        alien
                    );

                    enemies.splice(
                        j,
                        1
                    );

                    setTimeout(
                        spawnAlien,
                        600
                    );
                }

                break;
            }
        }

        if (
            remove ||
            bullet.life <= 0
        ) {
            bullets.splice(i, 1);
        }
    }
}

// ============================================================
// KILL ALIEN
// ============================================================

function killAlien(alien) {
    kills++;

    if (alien.elite) {
        score += 100;
        credits += 30;
        addXP(40);
    } else {
        score += 25;
        credits += 8;
        addXP(15);
    }

    missionProgress++;

    createParticles(
        alien.x,
        alien.y,
        alien.elite ? 25 : 16
    );

    if (kills === 1) {
        unlockAchievement(
            "FIRST CONTACT"
        );
    }

    if (kills === 10) {
        unlockAchievement(
            "ALIEN HUNTER"
        );
    }
}

// ============================================================
// SPAWN ALIEN
// ============================================================

function spawnAlien() {
    if (
        enemies.length >= MAX_ENEMIES ||
        !gameRunning
    ) {
        return;
    }

    let p = randomPosition();

    for (let i = 0; i < 30; i++) {
        p = randomPosition();

        if (
            distance(
                p.x,
                p.y,
                player.x,
                player.y
            ) > 800 &&
            !blocked(
                p.x,
                p.y,
                30
            )
        ) {
            break;
        }
    }

    const elite =
        Math.random() < 0.22;

    enemies.push({
        x: p.x,
        y: p.y,

        radius:
            elite ? 31 : 25,

        health:
            elite ? 8 : 3,

        maxHealth:
            elite ? 8 : 3,

        speed:
            elite
                ? 65
                : 45,

        elite,

        type:
            elite
                ? "guardian"
                : Math.random() < 0.35
                    ? "crawler"
                    : "stalker",

        shootCooldown:
            random(1, 3),

        attackCooldown: 0,

        pulse: random(
            0,
            Math.PI * 2
        )
    });
}

// ============================================================
// ENEMY UPDATE
// ============================================================

function updateEnemies(dt) {
    for (const enemy of enemies) {
        enemy.pulse += dt * 3;

        const d =
            distance(
                enemy.x,
                enemy.y,
                player.x,
                player.y
            );

        const angle =
            Math.atan2(
                player.y - enemy.y,
                player.x - enemy.x
            );

        // Chase
        if (d > 180) {
            const newX =
                enemy.x +
                Math.cos(angle) *
                enemy.speed *
                dt;

            const newY =
                enemy.y +
                Math.sin(angle) *
                enemy.speed *
                dt;

            if (
                !blocked(
                    newX,
                    enemy.y,
                    enemy.radius
                )
            ) {
                enemy.x = newX;
            }

            if (
                !blocked(
                    enemy.x,
                    newY,
                    enemy.radius
                )
            ) {
                enemy.y = newY;
            }
        }

        // Close attack
        if (enemy.attackCooldown > 0) {
            enemy.attackCooldown -= dt;
        }

        if (
            d < 70 &&
            enemy.attackCooldown <= 0
        ) {
            if (
                player.invincible <= 0
            ) {
                player.health -=
                    enemy.elite
                        ? 18
                        : 10;

                player.invincible = 0.45;

                createParticles(
                    player.x,
                    player.y,
                    10
                );
            }

            enemy.attackCooldown = 1;
        }

        // Shoot
        enemy.shootCooldown -= dt;

        if (
            enemy.shootCooldown <= 0 &&
            d < 1000 &&
            hasLineOfSight(
                enemy.x,
                enemy.y,
                player.x,
                player.y
            )
        ) {
            shootEnemy(enemy);

            enemy.shootCooldown =
                enemy.elite
                    ? random(0.8, 1.8)
                    : random(1.4, 2.8);
        }
    }
}

// ============================================================
// LINE OF SIGHT
// ============================================================

function hasLineOfSight(
    x1,
    y1,
    x2,
    y2
) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const distanceValue =
        Math.hypot(dx, dy);

    const steps =
        Math.max(
            10,
            Math.ceil(
                distanceValue / 15
            )
        );

    for (
        let i = 1;
        i < steps;
        i++
    ) {
        const t = i / steps;

        const x =
            x1 + dx * t;

        const y =
            y1 + dy * t;

        for (const building of buildings) {
            if (
                x >= building.x &&
                x <= building.x + building.w &&
                y >= building.y &&
                y <= building.y + building.h
            ) {
                return false;
            }
        }
    }

    return true;
}

// ============================================================
// ENEMY SHOOT
// ============================================================

function shootEnemy(enemy) {
    const angle =
        Math.atan2(
            player.y - enemy.y,
            player.x - enemy.x
        );

    const speed =
        enemy.elite
            ? 360
            : 300;

    enemyBullets.push({
        x: enemy.x,
        y: enemy.y,

        vx:
            Math.cos(angle) *
            speed,

        vy:
            Math.sin(angle) *
            speed,

        radius:
            enemy.elite
                ? 7
                : 5,

        damage:
            enemy.elite
                ? 12
                : 7,

        life: 3
    });
}

// ============================================================
// ENEMY BULLETS
// ============================================================

function updateEnemyBullets(dt) {
    for (
        let i = enemyBullets.length - 1;
        i >= 0;
        i--
    ) {
        const bullet =
            enemyBullets[i];

        bullet.x +=
            bullet.vx * dt;

        bullet.y +=
            bullet.vy * dt;

        bullet.life -= dt;

        let remove = false;

        // Buildings block alien shots
        for (const building of buildings) {
            if (
                circleRectCollision(
                    bullet.x,
                    bullet.y,
                    bullet.radius,
                    building
                )
            ) {
                remove = true;

                createParticles(
                    bullet.x,
                    bullet.y,
                    5
                );

                break;
            }
        }

        if (remove) {
            enemyBullets.splice(i, 1);
            continue;
        }

        if (
            distance(
                bullet.x,
                bullet.y,
                player.x,
                player.y
            ) <
            bullet.radius +
            player.radius
        ) {
            if (
                player.invincible <= 0
            ) {
                player.health -=
                    bullet.damage;

                player.invincible = 0.4;

                createParticles(
                    player.x,
                    player.y,
                    10
                );
            }

            remove = true;
        }

        if (
            remove ||
            bullet.life <= 0
        ) {
            enemyBullets.splice(i, 1);
        }
    }
}

// ============================================================
// NPC UPDATE
// ============================================================

function updateNPCs(dt) {
    for (const npc of npcs) {
        npc.timer -= dt;

        if (npc.timer <= 0) {
            npc.angle =
                random(
                    0,
                    Math.PI * 2
                );

            npc.timer =
                random(1, 4);
        }

        const newX =
            npc.x +
            Math.cos(npc.angle) *
            npc.speed *
            dt;

        const newY =
            npc.y +
            Math.sin(npc.angle) *
            npc.speed *
            dt;

        if (
            !blocked(
                newX,
                npc.y,
                npc.radius
            )
        ) {
            npc.x = newX;
        }

        if (
            !blocked(
                npc.x,
                newY,
                npc.radius
            )
        ) {
            npc.y = newY;
        }
    }
}

// ============================================================
// LOOT
// ============================================================

function updateLoot(dt) {
    for (const item of loot) {
        if (item.collected) {
            continue;
        }

        item.pulse += dt * 4;

        if (
            distance(
                player.x,
                player.y,
                item.x,
                item.y
            ) < 35
        ) {
            item.collected = true;

            if (
                item.type === "credits"
            ) {
                credits += 10;

                unlockAchievement(
                    "SCAVENGER"
                );
            } else {
                player.energy =
                    Math.min(
                        player.maxEnergy,
                        player.energy + 35
                    );
            }

            createParticles(
                item.x,
                item.y,
                10
            );
        }
    }
}

// ============================================================
// PARTICLES
// ============================================================

function createParticles(
    x,
    y,
    amount
) {
    for (
        let i = 0;
        i < amount;
        i++
    ) {
        const angle =
            random(
                0,
                Math.PI * 2
            );

        const speed =
            random(
                30,
                140
            );

        particles.push({
            x,
            y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life:
                random(
                    0.2,
                    0.7
                ),

            size:
                random(
                    2,
                    5
                )
        });
    }
}

function updateParticles(dt) {
    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {
        const p = particles[i];

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        p.vx *= 0.96;
        p.vy *= 0.96;

        p.life -= dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// ============================================================
// XP
// ============================================================

function addXP(amount) {
    xp += amount;

    const required =
        level * 100;

    if (xp >= required) {
        xp -= required;

        level++;

        player.maxHealth += 5;
        player.health =
            player.maxHealth;

        player.maxEnergy += 5;
        player.energy =
            player.maxEnergy;

        unlockAchievement(
            "LEVEL UP"
        );
    }
}

// ============================================================
// CAMERA
// ============================================================

function updateCamera(dt) {
    cameraX +=
        (player.x - cameraX) *
        Math.min(1, dt * 8);

    cameraY +=
        (player.y - cameraY) *
        Math.min(1, dt * 8);
}

function worldToScreen(x, y) {
    return {
        x:
            x -
            cameraX +
            W / 2,

        y:
            y -
            cameraY +
            H / 2
    };
}

function screenToWorld(x, y) {
    return {
        x:
            x -
            W / 2 +
            cameraX,

        y:
            y -
            H / 2 +
            cameraY
    };
}

// ============================================================
// DRAW
// ============================================================

function draw() {
    ctx.fillStyle = "#101719";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    drawGrid();
    drawTrees();
    drawRocks();
    drawBuildings();
    drawDoors();
    drawLoot();
    drawNPCs();
    drawEnemies();
    drawBullets();
    drawEnemyBullets();
    drawTank();
    drawParticles();
    drawWeather();
    drawCrosshair();
}

function drawGrid() {
    const grid = 100;

    ctx.strokeStyle =
        "rgba(90,160,155,0.06)";

    ctx.lineWidth = 1;

    const startX =
        Math.floor(
            (cameraX - W / 2) /
            grid
        ) *
        grid;

    const startY =
        Math.floor(
            (cameraY - H / 2) /
            grid
        ) *
        grid;

    for (
        let x = startX;
        x < cameraX + W;
        x += grid
    ) {
        const screen =
            worldToScreen(
                x,
                0
            );

        ctx.beginPath();

        ctx.moveTo(
            screen.x,
            0
        );

        ctx.lineTo(
            screen.x,
            H
        );

        ctx.stroke();
    }

    for (
        let y = startY;
        y < cameraY + H;
        y += grid
    ) {
        const screen =
            worldToScreen(
                0,
                y
            );

        ctx.beginPath();

        ctx.moveTo(
            0,
            screen.y
        );

        ctx.lineTo(
            W,
            screen.y
        );

        ctx.stroke();
    }
}

// ============================================================
// TREES
// ============================================================

function drawTrees() {
    for (const tree of trees) {
        const p =
            worldToScreen(
                tree.x,
                tree.y
            );

        if (
            p.x < -100 ||
            p.x > W + 100 ||
            p.y < -100 ||
            p.y > H + 100
        ) {
            continue;
        }

        ctx.fillStyle =
            "rgba(0,0,0,0.3)";

        ctx.beginPath();

        ctx.ellipse(
            p.x,
            p.y + tree.size * 0.5,
            tree.size,
            tree.size * 0.35,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#4a372b";

        ctx.fillRect(
            p.x - 4,
            p.y,
            8,
            tree.size
        );

        ctx.fillStyle =
            "#245448";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y - 10,
            tree.size * 0.7,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#32705b";

        ctx.beginPath();

        ctx.arc(
            p.x - 8,
            p.y - 17,
            tree.size * 0.35,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ============================================================
// ROCKS
// ============================================================

function drawRocks() {
    for (const rock of rocks) {
        const p =
            worldToScreen(
                rock.x,
                rock.y
            );

        ctx.fillStyle =
            "#354041";

        ctx.beginPath();

        ctx.ellipse(
            p.x,
            p.y,
            rock.size,
            rock.size * 0.65,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ============================================================
// BUILDINGS
// ============================================================

function drawBuildings() {
    for (const b of buildings) {
        const p =
            worldToScreen(
                b.x,
                b.y
            );

        ctx.fillStyle =
            "rgba(0,0,0,0.4)";

        ctx.fillRect(
            p.x + 12,
            p.y + 12,
            b.w,
            b.h
        );

        ctx.fillStyle =
            "#273134";

        ctx.fillRect(
            p.x,
            p.y,
            b.w,
            b.h
        );

        ctx.strokeStyle =
            "#596a6d";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            p.x,
            p.y,
            b.w,
            b.h
        );

        // windows
        ctx.fillStyle =
            "#6bbeb5";

        for (
            let x = 25;
            x < b.w - 30;
            x += 65
        ) {
            ctx.fillRect(
                p.x + x,
                p.y + 30,
                25,
                16
            );
        }
    }
}

// ============================================================
// DOORS
// ============================================================

function drawDoors() {
    for (const door of doors) {
        const p =
            worldToScreen(
                door.x,
                door.y
            );

        ctx.fillStyle =
            door.open
                ? "#477d77"
                : "#151b1d";

        ctx.fillRect(
            p.x,
            p.y,
            door.w,
            door.h
        );

        ctx.strokeStyle =
            "#789491";

        ctx.strokeRect(
            p.x,
            p.y,
            door.w,
            door.h
        );
    }
}

// ============================================================
// LOOT
// ============================================================

function drawLoot() {
    for (const item of loot) {
        if (item.collected) {
            continue;
        }

        const p =
            worldToScreen(
                item.x,
                item.y
            );

        const pulse =
            Math.sin(
                item.pulse
            ) * 3;

        ctx.fillStyle =
            item.type === "credits"
                ? "#d8b65a"
                : "#65ded1";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            7 + pulse,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ============================================================
// NPCS
// ============================================================

function drawNPCs() {
    for (const npc of npcs) {
        const p =
            worldToScreen(
                npc.x,
                npc.y
            );

        ctx.save();

        ctx.translate(
            p.x,
            p.y
        );

        ctx.rotate(
            npc.angle
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.3)";

        ctx.beginPath();

        ctx.ellipse(
            0,
            12,
            10,
            4,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Body
        ctx.fillStyle =
            npc.clothing;

        ctx.beginPath();

        ctx.roundRect(
            -8,
            -2,
            16,
            16,
            5
        );

        ctx.fill();

        // Head
        ctx.fillStyle =
            "#c58e6b";

        ctx.beginPath();

        ctx.arc(
            0,
            -11,
            8,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Hair
        ctx.fillStyle =
            "#292321";

        ctx.beginPath();

        ctx.arc(
            0,
            -14,
            8,
            Math.PI,
            Math.PI * 2
        );

        ctx.fill();

        // Legs
        ctx.strokeStyle =
            "#1d2325";

        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.moveTo(
            -4,
            12
        );

        ctx.lineTo(
            -5,
            20
        );

        ctx.moveTo(
            4,
            12
        );

        ctx.lineTo(
            5,
            20
        );

        ctx.stroke();

        ctx.restore();
    }
}

// ============================================================
// ALIENS
// ============================================================

function drawEnemies() {
    for (const enemy of enemies) {
        const p =
            worldToScreen(
                enemy.x,
                enemy.y
            );

        ctx.save();

        ctx.translate(
            p.x,
            p.y
        );

        const pulse =
            Math.sin(
                enemy.pulse
            ) * 2;

        // Shadow
        ctx.fillStyle =
            "rgba(0,0,0,0.35)";

        ctx.beginPath();

        ctx.ellipse(
            0,
            enemy.radius * 0.65,
            enemy.radius,
            enemy.radius * 0.3,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        if (
            enemy.type === "crawler"
        ) {
            drawCrawler(
                enemy,
                pulse
            );
        } else if (
            enemy.type === "guardian"
        ) {
            drawGuardian(
                enemy,
                pulse
            );
        } else {
            drawStalker(
                enemy,
                pulse
            );
        }

        // Health bar
        const width =
            enemy.radius * 2;

        ctx.fillStyle =
            "rgba(0,0,0,0.7)";

        ctx.fillRect(
            -width / 2,
            -enemy.radius - 14,
            width,
            5
        );

        ctx.fillStyle =
            enemy.elite
                ? "#b68cff"
                : "#5ce0b2";

        ctx.fillRect(
            -width / 2,
            -enemy.radius - 14,
            width *
            (enemy.health /
                enemy.maxHealth),
            5
        );

        ctx.restore();
    }
}

// ============================================================
// STALKER
// ============================================================

function drawStalker(enemy, pulse) {
    const color =
        enemy.elite
            ? "#9e7cff"
            : "#55dcb0";

    // Body
    ctx.fillStyle =
        color;

    ctx.beginPath();

    ctx.ellipse(
        0,
        5,
        enemy.radius * 0.6,
        enemy.radius * 0.7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Head
    ctx.beginPath();

    ctx.ellipse(
        0,
        -enemy.radius * 0.45,
        enemy.radius * 0.72,
        enemy.radius * 0.5,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Eyes
    ctx.fillStyle =
        "#07110e";

    ctx.beginPath();

    ctx.ellipse(
        -enemy.radius * 0.25,
        -enemy.radius * 0.45,
        5,
        8,
        -0.2,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        enemy.radius * 0.25,
        -enemy.radius * 0.45,
        5,
        8,
        0.2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Eye shine
    ctx.fillStyle =
        "#eaffff";

    ctx.beginPath();

    ctx.arc(
        -enemy.radius * 0.27,
        -enemy.radius * 0.5,
        2,
        0,
        Math.PI * 2
    );

    ctx.arc(
        enemy.radius * 0.27,
        -enemy.radius * 0.5,
        2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Arms
    ctx.strokeStyle =
        color;

    ctx.lineWidth = 5;

    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(
        -12,
        0
    );

    ctx.lineTo(
        -22,
        12 + pulse
    );

    ctx.moveTo(
        12,
        0
    );

    ctx.lineTo(
        22,
        12 - pulse
    );

    ctx.stroke();

    // Antennas
    ctx.strokeStyle =
        "#a5ffe8";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        -7,
        -25
    );

    ctx.lineTo(
        -13,
        -37
    );

    ctx.moveTo(
        7,
        -25
    );

    ctx.lineTo(
        13,
        -37
    );

    ctx.stroke();

    ctx.fillStyle =
        "#c7fff2";

    ctx.beginPath();

    ctx.arc(
        -13,
        -37,
        3,
        0,
        Math.PI * 2
    );

    ctx.arc(
        13,
        -37,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

// ============================================================
// CRAWLER
// ============================================================

function drawCrawler(enemy, pulse) {
    ctx.fillStyle =
        "#55d9c0";

    ctx.beginPath();

    ctx.ellipse(
        0,
        5,
        enemy.radius * 0.75,
        enemy.radius * 0.45,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Head
    ctx.fillStyle =
        "#79ead3";

    ctx.beginPath();

    ctx.arc(
        0,
        -7,
        enemy.radius * 0.38,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Eye
    ctx.fillStyle =
        "#101919";

    ctx.beginPath();

    ctx.arc(
        0,
        -8,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#eaffff";

    ctx.beginPath();

    ctx.arc(
        -2,
        -10,
        2.5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Tentacles
    ctx.strokeStyle =
        "#55d9c0";

    ctx.lineWidth = 4;

    for (
        let i = -2;
        i <= 2;
        i++
    ) {
        ctx.beginPath();

        ctx.moveTo(
            i * 8,
            9
        );

        ctx.quadraticCurveTo(
            i * 13,
            20 + pulse,
            i * 17,
            27
        );

        ctx.stroke();
    }
}

// ============================================================
// GUARDIAN
// ============================================================

function drawGuardian(enemy, pulse) {
    ctx.fillStyle =
        "#3c275b";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        enemy.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
        "#aa7cff";

    ctx.lineWidth = 5;

    ctx.stroke();

    // Head
    ctx.fillStyle =
        "#b68aff";

    ctx.beginPath();

    ctx.ellipse(
        0,
        -10,
        18,
        14,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Eyes
    ctx.fillStyle =
        "#160d20";

    ctx.beginPath();

    ctx.ellipse(
        -8,
        -10,
        5,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        8,
        -10,
        5,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Energy core
    ctx.fillStyle =
        "#e4cfff";

    ctx.beginPath();

    ctx.arc(
        0,
        7,
        7 + pulse,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

// ============================================================
// TANK
// ============================================================

function drawTank() {
    const p =
        worldToScreen(
            player.x,
            player.y
        );

    ctx.save();

    ctx.translate(
        p.x,
        p.y
    );

    // Tank shadow
    ctx.fillStyle =
        "rgba(0,0,0,0.45)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        8,
        35,
        24,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Rotate tank body
    ctx.rotate(
        player.angle
    );

    // LEFT TRACK
    ctx.fillStyle =
        "#14191b";

    ctx.beginPath();

    ctx.roundRect(
        -30,
        -27,
        60,
        14,
        5
    );

    ctx.fill();

    // RIGHT TRACK
    ctx.beginPath();

    ctx.roundRect(
        -30,
        13,
        60,
        14,
        5
    );

    ctx.fill();

    // Track details
    ctx.strokeStyle =
        "#4c595b";

    ctx.lineWidth = 2;

    for (
        let x = -24;
        x <= 24;
        x += 12
    ) {
        ctx.beginPath();

        ctx.moveTo(
            x,
            -26
        );

        ctx.lineTo(
            x,
            -15
        );

        ctx.moveTo(
            x,
            15
        );

        ctx.lineTo(
            x,
            26
        );

        ctx.stroke();
    }

    // Tank body
    ctx.fillStyle =
        "#435653";

    ctx.beginPath();

    ctx.roundRect(
        -26,
        -17,
        52,
        34,
        8
    );

    ctx.fill();

    ctx.strokeStyle =
        "#7c908b";

    ctx.lineWidth = 2;

    ctx.stroke();

    // Armor
    ctx.fillStyle =
        "#596d68";

    ctx.beginPath();

    ctx.roundRect(
        -17,
        -12,
        34,
        24,
        6
    );

    ctx.fill();

    // Turret
    ctx.save();

    ctx.rotate(
        player.turretAngle -
        player.angle
    );

    // Cannon
    ctx.fillStyle =
        "#111719";

    ctx.fillRect(
        2,
        -5,
        48,
        10
    );

    ctx.fillStyle =
        "#728580";

    ctx.fillRect(
        8,
        -4,
        40,
        8
    );

    // Cannon end
    ctx.fillStyle =
        "#293331";

    ctx.fillRect(
        45,
        -7,
        9,
        14
    );

    // Turret
    ctx.fillStyle =
        "#637671";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        16,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
        "#9aacA6";

    ctx.stroke();

    // Light
    ctx.fillStyle =
        "#67ddd1";

    ctx.beginPath();

    ctx.arc(
        5,
        -7,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // Tank lights
    ctx.fillStyle =
        "#63d8cd";

    ctx.beginPath();

    ctx.arc(
        23,
        -8,
        3,
        0,
        Math.PI * 2
    );

    ctx.arc(
        23,
        8,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // Shield effect
    if (
        player.invincible > 0
    ) {
        ctx.strokeStyle =
            "rgba(100,240,230,0.8)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            38,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }
}

// ============================================================
// BULLETS DRAW
// ============================================================

function drawBullets() {
    for (const bullet of bullets) {
        const p =
            worldToScreen(
                bullet.x,
                bullet.y
            );

        ctx.save();

        ctx.translate(
            p.x,
            p.y
        );

        ctx.rotate(
            Math.atan2(
                bullet.vy,
                bullet.vx
            )
        );

        ctx.fillStyle =
            bullet.type === 2
                ? "#e1c16b"
                : "#6de7dc";

        ctx.fillRect(
            -8,
            -2,
            16,
            4
        );

        ctx.restore();
    }
}

function drawEnemyBullets() {
    for (const bullet of enemyBullets) {
        const p =
            worldToScreen(
                bullet.x,
                bullet.y
            );

        ctx.fillStyle =
            "#b78cff";

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

// ============================================================
// PARTICLES DRAW
// ============================================================

function drawParticles() {
    for (const p of particles) {
        const screen =
            worldToScreen(
                p.x,
                p.y
            );

        ctx.globalAlpha =
            clamp(
                p.life,
                0,
                1
            );

        ctx.fillStyle =
            "#6fe4d7";

        ctx.beginPath();

        ctx.arc(
            screen.x,
            screen.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}

// ============================================================
// WEATHER
// ============================================================

function drawWeather() {
    if (
        Math.floor(gameTime / 30) % 3 === 1
    ) {
        ctx.strokeStyle =
            "rgba(120,190,220,0.2)";

        for (
            let i = 0;
            i < 100;
            i++
        ) {
            const x =
                (i * 83 +
                    gameTime * 300) %
                W;

            const y =
                (i * 47 +
                    gameTime * 500) %
                H;

            ctx.beginPath();

            ctx.moveTo(
                x,
                y
            );

            ctx.lineTo(
                x - 4,
                y + 15
            );

            ctx.stroke();
        }
    }
}

// ============================================================
// CROSSHAIR
// ============================================================

function drawCrosshair() {
    if (!gameRunning) {
        return;
    }

    ctx.strokeStyle =
        "rgba(120,240,225,0.85)";

    ctx.lineWidth = 1.5;

    ctx.beginPath();

    ctx.moveTo(
        mouse.x - 10,
        mouse.y
    );

    ctx.lineTo(
        mouse.x - 3,
        mouse.y
    );

    ctx.moveTo(
        mouse.x + 3,
        mouse.y
    );

    ctx.lineTo(
        mouse.x + 10,
        mouse.y
    );

    ctx.moveTo(
        mouse.x,
        mouse.y - 10
    );

    ctx.lineTo(
        mouse.x,
        mouse.y - 3
    );

    ctx.moveTo(
        mouse.x,
        mouse.y + 3
    );

    ctx.lineTo(
        mouse.x,
        mouse.y + 10
    );

    ctx.stroke();
}

// ============================================================
// HUD
// ============================================================

function updateHUD() {
    const healthBar =
        document.getElementById(
            "healthBar"
        );

    const energyBar =
        document.getElementById(
            "energyBar"
        );

    const ammo =
        document.getElementById(
            "ammo"
        );

    const killsText =
        document.getElementById(
            "kills"
        );

    const creditsText =
        document.getElementById(
            "credits"
        );

    const objective =
        document.getElementById(
            "objective"
        );

    const zone =
        document.getElementById(
            "zone"
        );

    if (healthBar) {
        healthBar.style.width =
            `${clamp(
                player.health /
                player.maxHealth *
                100,
                0,
                100
            )}%`;
    }

    if (energyBar) {
        energyBar.style.width =
            `${clamp(
                player.energy /
                player.maxEnergy *
                100,
                0,
                100
            )}%`;
    }

    if (ammo) {
        const weapon =
            weapons[player.weapon];

        ammo.textContent =
            player.reloadTimer > 0
                ? "RELOADING..."
                : `${weapon.ammo} / ∞`;
    }

    if (killsText) {
        killsText.textContent =
            `KILLS: ${kills}`;
    }

    if (creditsText) {
        creditsText.textContent =
            `CREDITS: ${credits}`;
    }

    if (objective) {
        objective.textContent =
            missionProgress >= missionTarget
                ? "SIGNAL FOUND"
                : `FIND THE SIGNAL • ${missionProgress}/${missionTarget}`;
    }

    if (zone) {
        zone.textContent =
            `SECTOR ${level}`;
    }
}

// ============================================================
// PAUSE
// ============================================================

function togglePause() {
    if (!gameRunning) {
        return;
    }

    paused = !paused;

    if (pauseMenu) {
        pauseMenu.style.display =
            paused
                ? "flex"
                : "none";
    }

    if (paused) {
        mouse.down = false;
    }
}

// ============================================================
// SAVE
// ============================================================

function saveGame() {
    const data = {
        player: {
            x: player.x,
            y: player.y,
            health: player.health,
            energy: player.energy,
            weapon: player.weapon
        },

        score,
        kills,
        credits,
        level,
        xp,
        missionProgress,

        ammo: weapons.map(
            weapon => weapon.ammo
        )
    };

    localStorage.setItem(
        "echoboundSave",
        JSON.stringify(data)
    );

    alert("RUN SAVED!");
}

// ============================================================
// LOAD
// ============================================================

function loadGame() {
    const saved =
        localStorage.getItem(
            "echoboundSave"
        );

    if (!saved) {
        alert(
            "NO SAVE FOUND."
        );

        return;
    }

    try {
        const data =
            JSON.parse(saved);

        generateWorld();

        score =
            data.score || 0;

        kills =
            data.kills || 0;

        credits =
            data.credits || 0;

        level =
            data.level || 1;

        xp =
            data.xp || 0;

        missionProgress =
            data.missionProgress || 0;

        player.x =
            data.player.x || 0;

        player.y =
            data.player.y || 0;

        player.health =
            data.player.health ||
            player.maxHealth;

        player.energy =
            data.player.energy ||
            player.maxEnergy;

        player.weapon =
            data.player.weapon || 0;

        if (data.ammo) {
            data.ammo.forEach(
                (ammo, index) => {
                    if (
                        weapons[index]
                    ) {
                        weapons[index].ammo =
                            ammo;
                    }
                }
            );
        }

        gameRunning = true;
        paused = false;

        if (menu) {
            menu.style.display =
                "none";
        }

        if (pauseMenu) {
            pauseMenu.style.display =
                "none";
        }

        updateHUD();

    } catch (error) {
        console.error(error);

        alert(
            "SAVE DATA IS CORRUPTED."
        );
    }
}

// ============================================================
// QUIT
// ============================================================

function quitToMenu() {
    gameRunning = false;
    paused = false;

    mouse.down = false;

    if (pauseMenu) {
        pauseMenu.style.display =
            "none";
    }

    if (menu) {
        menu.style.display =
            "flex";
    }
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

const achievements = [
    "FIRST CONTACT",
    "ALIEN HUNTER",
    "SCAVENGER",
    "LEVEL UP"
];

function getAchievements() {
    try {
        return JSON.parse(
            localStorage.getItem(
                "echoboundAchievements"
            )
        ) || [];
    } catch {
        return [];
    }
}

function unlockAchievement(name) {
    const unlocked =
        getAchievements();

    if (
        unlocked.includes(name)
    ) {
        return;
    }

    unlocked.push(name);

    localStorage.setItem(
        "echoboundAchievements",
        JSON.stringify(
            unlocked
        )
    );

    const box =
        document.getElementById(
            "achievement"
        );

    const nameElement =
        document.getElementById(
            "achievementName"
        );

    if (
        box &&
        nameElement
    ) {
        nameElement.textContent =
            name;

        box.style.display =
            "block";

        setTimeout(() => {
            box.style.display =
                "none";
        }, 3000);
    }
}

function showAchievements() {
    const unlocked =
        getAchievements();

    let text =
        "ACHIEVEMENTS\n\n";

    for (
        const achievement of achievements
    ) {
        text +=
            unlocked.includes(
                achievement
            )
                ? `✓ ${achievement}\n`
                : `○ ${achievement}\n`;
    }

    alert(text);
}

function showControls() {
    alert(
        "CONTROLS\n\n" +
        "W A S D = Bewegen\n" +
        "SHIFT = Sneller rijden\n" +
        "MUIS = Richten\n" +
        "LINKERMUIS = Schieten\n" +
        "R = Herladen\n" +
        "SPACE = Dash\n" +
        "1 = Pulse\n" +
        "2 = Burst\n" +
        "3 = Cannon\n" +
        "ESC = Pauze"
    );
}

// ============================================================
// GAME OVER
// ============================================================

function gameOver() {
    gameRunning = false;
    paused = false;
    mouse.down = false;

    alert(
        "TANK DESTROYED\n\n" +
        `KILLS: ${kills}\n` +
        `SCORE: ${score}\n` +
        `LEVEL: ${level}`
    );

    if (menu) {
        menu.style.display =
            "flex";
    }
}

// ============================================================
// GAME UPDATE
// ============================================================

function update(dt) {
    if (
        !gameRunning ||
        paused
    ) {
        return;
    }

    gameTime += dt;

    updatePlayer(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateEnemyBullets(dt);
    updateNPCs(dt);
    updateLoot(dt);
    updateParticles(dt);
    updateCamera(dt);

    if (
        player.health <= 0
    ) {
        player.health = 0;
        gameOver();
    }

    updateHUD();
}

// ============================================================
// GAME LOOP
// ============================================================

let lastTime =
    performance.now();

function gameLoop(time) {
    let dt =
        (time - lastTime) /
        1000;

    lastTime = time;

    // Prevent huge jumps if browser freezes
    dt = Math.min(
        dt,
        0.05
    );

    update(dt);
    draw();

    requestAnimationFrame(
        gameLoop
    );
}

// ============================================================
// INITIALIZE
// ============================================================

generateWorld();
updateHUD();

requestAnimationFrame(
    gameLoop
);
