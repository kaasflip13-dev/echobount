// ============================================================
// ECHOBOUND — THE LOST SIGNAL
// COMPLETE APP.JS
// MOOIERE GROND + TANK + GEBOUWEN + ALIENS + SPAWN + SCHIETEN
// Geen bloed / gore
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;

// ============================================================
// WORLD
// ============================================================

const WORLD_W = 7000;
const WORLD_H = 7000;

let gameRunning = false;
let paused = false;
let lastTime = 0;

const camera = {
    x: 0,
    y: 0
};

// ============================================================
// HELPERS
// ============================================================

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

// ============================================================
// INPUT
// ============================================================

const keys = new Set();

const mouse = {
    x: W / 2,
    y: H / 2,
    worldX: 0,
    worldY: 0,
    down: false
};

window.addEventListener("keydown", (event) => {
    keys.add(event.code);

    if (
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "ArrowDown" ||
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight"
    ) {
        event.preventDefault();
    }

    if (event.code === "Escape") {
        if (gameRunning) {
            togglePause();
        }
    }

    if (event.code === "KeyR") {
        reload();
    }

    if (event.code === "Digit1") {
        player.weapon = 0;
    }

    if (event.code === "Digit2") {
        player.weapon = 1;
    }

    if (event.code === "Digit3") {
        player.weapon = 2;
    }
});

window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
});

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

window.addEventListener("resize", () => {
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;
});

// ============================================================
// PLAYER
// ============================================================

const player = {
    x: WORLD_W / 2,
    y: WORLD_H / 2,

    radius: 32,

    speed: 220,
    sprintSpeed: 310,

    turretAngle: 0,

    health: 100,
    maxHealth: 100,

    energy: 100,
    maxEnergy: 100,

    fireCooldown: 0,
    reloadTimer: 0,
    dashCooldown: 0,
    invincible: 0,

    weapon: 0,

    kills: 0,
    credits: 0
};

// ============================================================
// WEAPONS
// ============================================================

const weapons = [
    {
        name: "PULSE",
        damage: 2,
        fireRate: 0.15,
        speed: 1000,
        maxAmmo: 12,
        ammo: 12,
        size: 5
    },

    {
        name: "BURST",
        damage: 3,
        fireRate: 0.28,
        speed: 1100,
        maxAmmo: 8,
        ammo: 8,
        size: 6
    },

    {
        name: "CANNON",
        damage: 8,
        fireRate: 0.7,
        speed: 750,
        maxAmmo: 4,
        ammo: 4,
        size: 9
    }
];

// ============================================================
// OBJECT ARRAYS
// ============================================================

const buildings = [];
const trees = [];
const rocks = [];
const groundDetails = [];
const alienSpawns = [];

const bullets = [];
const enemyBullets = [];
const enemies = [];
const particles = [];

// ============================================================
// ALIEN SETTINGS
// ============================================================

const MAX_ALIENS = 18;
const START_ALIENS = 9;

let alienSpawnTimer = 0;

// ============================================================
// BUILDINGS
// ============================================================

function createBuildings() {
    buildings.length = 0;

    const positions = [
        [650, 650],
        [1300, 500],
        [1950, 850],
        [2700, 500],
        [3500, 750],
        [4450, 550],
        [5300, 900],
        [6100, 650],

        [500, 1750],
        [1350, 1600],
        [2200, 1900],
        [3100, 1600],
        [4050, 1800],
        [5000, 1650],
        [5900, 1850],

        [700, 2900],
        [1550, 2750],
        [2500, 3000],
        [3500, 2750],
        [4550, 3000],
        [5650, 2800],

        [550, 4050],
        [1500, 4200],
        [2450, 3950],
        [3450, 4250],
        [4500, 4000],
        [5600, 4200],

        [800, 5400],
        [1800, 5300],
        [2850, 5600],
        [3900, 5300],
        [5000, 5550],
        [6100, 5300]
    ];

    for (const [x, y] of positions) {
        const w = random(240, 390);
        const h = random(190, 320);

        buildings.push({
            x,
            y,
            w,
            h,

            rotation: random(-0.025, 0.025),

            wallType: randomInt(0, 2),
            roofType: randomInt(0, 2),

            windows: randomInt(4, 9),
            doorSide: randomInt(0, 3),

            glow: random(0, Math.PI * 2)
        });
    }
}

// ============================================================
// TREES
// ============================================================

function createTrees() {
    trees.length = 0;

    for (let i = 0; i < 280; i++) {
        let x;
        let y;
        let tries = 0;

        do {
            x = random(100, WORLD_W - 100);
            y = random(100, WORLD_H - 100);
            tries++;
        } while (
            collidesWithBuilding(x, y, 70) &&
            tries < 50
        );

        trees.push({
            x,
            y,
            size: random(20, 42),
            type: randomInt(0, 2),
            rotation: random(0, Math.PI * 2)
        });
    }
}

// ============================================================
// ROCKS
// ============================================================

function createRocks() {
    rocks.length = 0;

    for (let i = 0; i < 190; i++) {
        let x;
        let y;
        let tries = 0;

        do {
            x = random(60, WORLD_W - 60);
            y = random(60, WORLD_H - 60);
            tries++;
        } while (
            collidesWithBuilding(x, y, 45) &&
            tries < 50
        );

        rocks.push({
            x,
            y,
            size: random(8, 28),
            rotation: random(0, Math.PI * 2),
            shape: randomInt(0, 2)
        });
    }
}

// ============================================================
// GROUND DETAILS
// ============================================================

function createGroundDetails() {
    groundDetails.length = 0;

    // Kleine steentjes
    for (let i = 0; i < 850; i++) {
        const x = random(20, WORLD_W - 20);
        const y = random(20, WORLD_H - 20);

        groundDetails.push({
            type: "pebble",
            x,
            y,
            size: random(1, 4),
            rotation: random(0, Math.PI * 2),
            shade: random(0, 1)
        });
    }

    // Kleine planten
    for (let i = 0; i < 520; i++) {
        const x = random(20, WORLD_W - 20);
        const y = random(20, WORLD_H - 20);

        groundDetails.push({
            type: "plant",
            x,
            y,
            size: random(3, 10),
            rotation: random(0, Math.PI * 2),
            shade: random(0, 1)
        });
    }

    // Kleine paarse buitenaardse planten
    for (let i = 0; i < 160; i++) {
        const x = random(50, WORLD_W - 50);
        const y = random(50, WORLD_H - 50);

        groundDetails.push({
            type: "alienPlant",
            x,
            y,
            size: random(5, 13),
            rotation: random(0, Math.PI * 2),
            shade: random(0, 1)
        });
    }
}

// ============================================================
// COLLISION
// ============================================================

function collidesWithBuilding(x, y, radius) {
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

        const dx = x - closestX;
        const dy = y - closestY;

        if (dx * dx + dy * dy < radius * radius) {
            return true;
        }
    }

    return false;
}

// ============================================================
// ALIEN SPAWNING
// ============================================================

function spawnAlien() {
    if (!gameRunning) return;
    if (enemies.length >= MAX_ALIENS) return;

    let x;
    let y;
    let attempts = 0;

    do {
        const angle = Math.random() * Math.PI * 2;
        const spawnDistance = random(850, 1700);

        x =
            player.x +
            Math.cos(angle) * spawnDistance;

        y =
            player.y +
            Math.sin(angle) * spawnDistance;

        attempts++;

    } while (
        (
            x < 100 ||
            x > WORLD_W - 100 ||
            y < 100 ||
            y > WORLD_H - 100 ||
            collidesWithBuilding(x, y, 50)
        ) &&
        attempts < 60
    );

    x = clamp(x, 100, WORLD_W - 100);
    y = clamp(y, 100, WORLD_H - 100);

    const roll = Math.random();

    let type;
    let health;
    let speed;
    let radius;

    if (roll < 0.15) {
        type = "guardian";
        health = 18;
        speed = 48;
        radius = 38;
    } else if (roll < 0.45) {
        type = "crawler";
        health = 5;
        speed = 88;
        radius = 25;
    } else {
        type = "stalker";
        health = 8;
        speed = 58;
        radius = 30;
    }

    enemies.push({
        x,
        y,

        type,

        radius,

        health,
        maxHealth: health,

        speed,

        attackCooldown: random(0, 1),

        shootCooldown: random(1, 3),

        animation: random(0, Math.PI * 2),

        hitFlash: 0,

        rotation: 0
    });
}

function spawnStartingAliens() {
    for (let i = 0; i < START_ALIENS; i++) {
        spawnAlien();
    }
}

function updateAlienSpawner(dt) {
    if (!gameRunning || paused) return;

    alienSpawnTimer -= dt;

    if (alienSpawnTimer <= 0) {
        alienSpawnTimer = 1.2;

        if (enemies.length < MAX_ALIENS) {
            spawnAlien();
        }
    }
}

// ============================================================
// PARTICLES
// ============================================================

function createParticles(
    x,
    y,
    amount,
    type = "energy"
) {
    for (let i = 0; i < amount; i++) {
        const angle = random(0, Math.PI * 2);
        const speed = random(40, 180);

        particles.push({
            x,
            y,

            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,

            life: random(0.3, 0.8),
            maxLife: 0.8,

            size: random(2, 6),

            type
        });
    }
}

// ============================================================
// SHOOTING
// ============================================================

function shoot() {
    if (!gameRunning || paused) return;

    const weapon = weapons[player.weapon];

    if (player.reloadTimer > 0) return;

    if (weapon.ammo <= 0) {
        reload();
        return;
    }

    if (player.fireCooldown > 0) return;

    weapon.ammo--;

    player.fireCooldown = weapon.fireRate;

    const angle = player.turretAngle;

    const startDistance = 46;

    bullets.push({
        x:
            player.x +
            Math.cos(angle) * startDistance,

        y:
            player.y +
            Math.sin(angle) * startDistance,

        vx: Math.cos(angle) * weapon.speed,

        vy: Math.sin(angle) * weapon.speed,

        damage: weapon.damage,

        size: weapon.size,

        life: 2
    });

    createParticles(
        player.x + Math.cos(angle) * 40,
        player.y + Math.sin(angle) * 40,
        4,
        "muzzle"
    );
}

function reload() {
    if (!gameRunning || paused) return;

    const weapon = weapons[player.weapon];

    if (weapon.ammo >= weapon.maxAmmo) return;

    if (player.reloadTimer > 0) return;

    player.reloadTimer = 0.9;
}

// ============================================================
// ENEMY SHOOTING
// ============================================================

function enemyShoot(enemy) {
    const angle = Math.atan2(
        player.y - enemy.y,
        player.x - enemy.x
    );

    enemyBullets.push({
        x: enemy.x + Math.cos(angle) * enemy.radius,
        y: enemy.y + Math.sin(angle) * enemy.radius,

        vx: Math.cos(angle) * 330,
        vy: Math.sin(angle) * 330,

        life: 5,

        size: 7
    });
}

// ============================================================
// PLAYER MOVEMENT
// ============================================================

function updatePlayer(dt) {
    let moveX = 0;
    let moveY = 0;

    if (keys.has("KeyW") || keys.has("ArrowUp")) {
        moveY -= 1;
    }

    if (keys.has("KeyS") || keys.has("ArrowDown")) {
        moveY += 1;
    }

    if (keys.has("KeyA") || keys.has("ArrowLeft")) {
        moveX -= 1;
    }

    if (keys.has("KeyD") || keys.has("ArrowRight")) {
        moveX += 1;
    }

    const length = Math.hypot(moveX, moveY);

    if (length > 0) {
        moveX /= length;
        moveY /= length;
    }

    let speed = player.speed;

    if (
        keys.has("ShiftLeft") ||
        keys.has("ShiftRight")
    ) {
        speed = player.sprintSpeed;
    }

    if (
        keys.has("Space") &&
        player.dashCooldown <= 0 &&
        length > 0 &&
        player.energy >= 20
    ) {
        player.energy -= 20;

        player.dashCooldown = 0.8;

        const dashDistance = 150;

        const newX =
            player.x +
            moveX * dashDistance;

        const newY =
            player.y +
            moveY * dashDistance;

        if (
            !collidesWithBuilding(
                newX,
                player.y,
                player.radius
            )
        ) {
            player.x = newX;
        }

        if (
            !collidesWithBuilding(
                player.x,
                newY,
                player.radius
            )
        ) {
            player.y = newY;
        }

        createParticles(
            player.x,
            player.y,
            16,
            "dash"
        );
    }

    const newX =
        player.x +
        moveX * speed * dt;

    const newY =
        player.y +
        moveY * speed * dt;

    if (
        !collidesWithBuilding(
            newX,
            player.y,
            player.radius
        )
    ) {
        player.x = newX;
    }

    if (
        !collidesWithBuilding(
            player.x,
            newY,
            player.radius
        )
    ) {
        player.y = newY;
    }

    player.x = clamp(
        player.x,
        player.radius,
        WORLD_W - player.radius
    );

    player.y = clamp(
        player.y,
        player.radius,
        WORLD_H - player.radius
    );

    // Energie langzaam terug
    player.energy += 18 * dt;
    player.energy = clamp(
        player.energy,
        0,
        player.maxEnergy
    );
}

// ============================================================
// AIM
// ============================================================

function updateAim() {
    mouse.worldX =
        mouse.x +
        camera.x;

    mouse.worldY =
        mouse.y +
        camera.y;

    player.turretAngle = Math.atan2(
        mouse.worldY - player.y,
        mouse.worldX - player.x
    );
}

// ============================================================
// PLAYER COMBAT UPDATE
// ============================================================

function updatePlayerCombat(dt) {
    player.fireCooldown -= dt;

    if (player.fireCooldown < 0) {
        player.fireCooldown = 0;
    }

    player.dashCooldown -= dt;

    if (player.dashCooldown < 0) {
        player.dashCooldown = 0;
    }

    player.invincible -= dt;

    if (player.invincible < 0) {
        player.invincible = 0;
    }

    if (mouse.down && player.reloadTimer <= 0) {
        shoot();
    }

    if (player.reloadTimer > 0) {
        player.reloadTimer -= dt;

        if (player.reloadTimer <= 0) {
            const weapon = weapons[player.weapon];

            weapon.ammo = weapon.maxAmmo;

            player.reloadTimer = 0;
        }
    }
}

// ============================================================
// BULLETS
// ============================================================

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;

        bullet.life -= dt;

        if (
            bullet.x < 0 ||
            bullet.x > WORLD_W ||
            bullet.y < 0 ||
            bullet.y > WORLD_H ||
            bullet.life <= 0
        ) {
            bullets.splice(i, 1);
            continue;
        }

        if (
            collidesWithBuilding(
                bullet.x,
                bullet.y,
                bullet.size
            )
        ) {
            createParticles(
                bullet.x,
                bullet.y,
                6,
                "impact"
            );

            bullets.splice(i, 1);
            continue;
        }

        let hitEnemy = false;

        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];

            const d = distance(
                bullet.x,
                bullet.y,
                enemy.x,
                enemy.y
            );

            if (d < enemy.radius + bullet.size) {
                enemy.health -= bullet.damage;

                enemy.hitFlash = 0.1;

                createParticles(
                    bullet.x,
                    bullet.y,
                    8,
                    "energy"
                );

                bullets.splice(i, 1);

                hitEnemy = true;

                if (enemy.health <= 0) {
                    killAlien(j);
                }

                break;
            }
        }

        if (hitEnemy) {
            continue;
        }
    }
}

// ============================================================
// KILL ALIEN
// ============================================================

function killAlien(index) {
    const enemy = enemies[index];

    if (!enemy) return;

    createParticles(
        enemy.x,
        enemy.y,
        24,
        "alienDeath"
    );

    player.kills++;

    if (enemy.type === "guardian") {
        player.credits += 15;
    } else if (enemy.type === "crawler") {
        player.credits += 4;
    } else {
        player.credits += 7;
    }

    enemies.splice(index, 1);
}

// ============================================================
// ENEMY UPDATE
// ============================================================

function updateEnemies(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        enemy.animation += dt * 4;

        enemy.attackCooldown -= dt;
        enemy.shootCooldown -= dt;
        enemy.hitFlash -= dt;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        const d = Math.hypot(dx, dy);

        if (d > 0) {
            enemy.rotation = Math.atan2(dy, dx);
        }

        // Guardian schiet
        if (
            enemy.type === "guardian" &&
            d < 850 &&
            enemy.shootCooldown <= 0
        ) {
            enemy.shootCooldown = random(1.5, 2.5);

            enemyShoot(enemy);
        }

        // Bewegingsrichting
        let moveX = 0;
        let moveY = 0;

        if (d > enemy.radius + player.radius + 10) {
            moveX = dx / d;
            moveY = dy / d;
        }

        let speed = enemy.speed;

        if (enemy.type === "crawler") {
            speed *= 1.15;
        }

        // Eerst horizontaal proberen
        const newX =
            enemy.x +
            moveX * speed * dt;

        if (
            !collidesWithBuilding(
                newX,
                enemy.y,
                enemy.radius
            )
        ) {
            enemy.x = newX;
        }

        // Daarna verticaal
        const newY =
            enemy.y +
            moveY * speed * dt;

        if (
            !collidesWithBuilding(
                enemy.x,
                newY,
                enemy.radius
            )
        ) {
            enemy.y = newY;
        }

        // Aanvallen
        if (
            d <
                enemy.radius +
                    player.radius +
                    15 &&
            enemy.attackCooldown <= 0
        ) {
            enemy.attackCooldown =
                enemy.type === "crawler"
                    ? 0.65
                    : 1.1;

            damagePlayer(
                enemy.type === "guardian"
                    ? 12
                    : enemy.type === "crawler"
                    ? 6
                    : 8
            );
        }

        enemy.x = clamp(
            enemy.x,
            enemy.radius,
            WORLD_W - enemy.radius
        );

        enemy.y = clamp(
            enemy.y,
            enemy.radius,
            WORLD_H - enemy.radius
        );
    }
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
        const bullet = enemyBullets[i];

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;

        bullet.life -= dt;

        if (
            bullet.life <= 0 ||
            bullet.x < 0 ||
            bullet.x > WORLD_W ||
            bullet.y < 0 ||
            bullet.y > WORLD_H
        ) {
            enemyBullets.splice(i, 1);
            continue;
        }

        if (
            collidesWithBuilding(
                bullet.x,
                bullet.y,
                bullet.size
            )
        ) {
            createParticles(
                bullet.x,
                bullet.y,
                5,
                "impact"
            );

            enemyBullets.splice(i, 1);
            continue;
        }

        const d = distance(
            bullet.x,
            bullet.y,
            player.x,
            player.y
        );

        if (d < player.radius + bullet.size) {
            damagePlayer(9);

            createParticles(
                bullet.x,
                bullet.y,
                8,
                "impact"
            );

            enemyBullets.splice(i, 1);
        }
    }
}

// ============================================================
// DAMAGE PLAYER
// ============================================================

function damagePlayer(amount) {
    if (player.invincible > 0) return;

    player.health -= amount;

    player.invincible = 0.35;

    createParticles(
        player.x,
        player.y,
        12,
        "hit"
    );

    if (player.health <= 0) {
        player.health = 0;

        gameOver();
    }
}

// ============================================================
// PARTICLE UPDATE
// ============================================================

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
// CAMERA
// ============================================================

function updateCamera() {
    camera.x =
        player.x -
        W / 2;

    camera.y =
        player.y -
        H / 2;

    camera.x = clamp(
        camera.x,
        0,
        WORLD_W - W
    );

    camera.y = clamp(
        camera.y,
        0,
        WORLD_H - H
    );
}

// ============================================================
// BEAUTIFUL GROUND
// ============================================================

function drawGround() {
    /*
        De wereld wordt opgebouwd uit meerdere lagen:

        1. donkere basis
        2. grote zachte kleurvelden
        3. raster / terreinpatroon
        4. kleine gronddetails
        5. planten
        6. stenen
    */

    const startX =
        Math.floor(camera.x / 100) * 100;

    const startY =
        Math.floor(camera.y / 100) * 100;

    const endX =
        camera.x + W + 100;

    const endY =
        camera.y + H + 100;

    // --------------------------------------------------------
    // BASIS
    // --------------------------------------------------------

    ctx.fillStyle = "#17251d";

    ctx.fillRect(
        camera.x,
        camera.y,
        W,
        H
    );

    // --------------------------------------------------------
    // GROTE GRONDVLAKKEN
    // --------------------------------------------------------

    ctx.save();

    ctx.globalAlpha = 0.22;

    for (
        let x = startX - 300;
        x < endX;
        x += 300
    ) {
        for (
            let y = startY - 300;
            y < endY;
            y += 300
        ) {
            const wave =
                Math.sin(
                    x * 0.002 +
                    y * 0.001
                ) * 0.5 +
                0.5;

            if (wave > 0.5) {
                ctx.fillStyle = "#29452f";
            } else {
                ctx.fillStyle = "#203a29";
            }

            ctx.beginPath();

            ctx.arc(
                x + 100,
                y + 100,
                150,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }

    ctx.restore();

    // --------------------------------------------------------
    // TERREINTEGELS
    // --------------------------------------------------------

    ctx.save();

    for (
        let x = startX;
        x < endX;
        x += 100
    ) {
        for (
            let y = startY;
            y < endY;
            y += 100
        ) {
            const seed =
                Math.sin(
                    x * 12.9898 +
                    y * 78.233
                ) *
                43758.5453;

            const value =
                seed -
                Math.floor(seed);

            if (value > 0.72) {
                ctx.fillStyle =
                    "rgba(80,110,66,0.08)";
            } else if (value > 0.42) {
                ctx.fillStyle =
                    "rgba(15,30,20,0.07)";
            } else {
                ctx.fillStyle =
                    "rgba(110,125,75,0.045)";
            }

            ctx.fillRect(
                x,
                y,
                100,
                100
            );
        }
    }

    ctx.restore();

    // --------------------------------------------------------
    // KLEINE GRASSTREPEN
    // --------------------------------------------------------

    ctx.save();

    for (
        let x = startX - 50;
        x < endX + 50;
        x += 34
    ) {
        for (
            let y = startY - 50;
            y < endY + 50;
            y += 34
        ) {
            const seed =
                Math.sin(
                    x * 4.123 +
                    y * 9.731
                ) *
                10000;

            const value =
                seed -
                Math.floor(seed);

            if (value > 0.76) {
                ctx.strokeStyle =
                    "rgba(105,145,79,0.18)";

                ctx.lineWidth = 1;

                ctx.beginPath();

                ctx.moveTo(
                    x,
                    y + 4
                );

                ctx.lineTo(
                    x - 2,
                    y - 4
                );

                ctx.moveTo(
                    x + 3,
                    y + 4
                );

                ctx.lineTo(
                    x + 5,
                    y - 3
                );

                ctx.stroke();
            }
        }
    }

    ctx.restore();

    // --------------------------------------------------------
    // PADEN
    // --------------------------------------------------------

    drawGroundPaths();

    // --------------------------------------------------------
    // DETAILS
    // --------------------------------------------------------

    drawGroundDetails();
}

// ============================================================
// GROUND PATHS
// ============================================================

function drawGroundPaths() {
    ctx.save();

    ctx.lineCap = "round";

    // Hoofdpad
    ctx.strokeStyle = "rgba(110,100,73,0.16)";
    ctx.lineWidth = 130;

    ctx.beginPath();

    ctx.moveTo(
        200,
        WORLD_H / 2
    );

    ctx.bezierCurveTo(
        1500,
        WORLD_H / 2 - 180,
        2600,
        WORLD_H / 2 + 220,
        3900,
        WORLD_H / 2 - 50
    );

    ctx.bezierCurveTo(
        4900,
        WORLD_H / 2 - 300,
        5800,
        WORLD_H / 2 + 160,
        6800,
        WORLD_H / 2
    );

    ctx.stroke();

    // Vertical zijpad
    ctx.strokeStyle = "rgba(105,95,69,0.12)";
    ctx.lineWidth = 95;

    ctx.beginPath();

    ctx.moveTo(
        WORLD_W / 2,
        100
    );

    ctx.bezierCurveTo(
        WORLD_W / 2 - 250,
        1400,
        WORLD_W / 2 + 230,
        2800,
        WORLD_W / 2,
        3900
    );

    ctx.bezierCurveTo(
        WORLD_W / 2 - 200,
        5000,
        WORLD_W / 2 + 250,
        5900,
        WORLD_W / 2,
        6900
    );

    ctx.stroke();

    ctx.restore();
}

// ============================================================
// GROUND DETAILS
// ============================================================

function drawGroundDetails() {
    const visibleLeft = camera.x - 100;
    const visibleRight = camera.x + W + 100;
    const visibleTop = camera.y - 100;
    const visibleBottom = camera.y + H + 100;

    for (const detail of groundDetails) {
        if (
            detail.x < visibleLeft ||
            detail.x > visibleRight ||
            detail.y < visibleTop ||
            detail.y > visibleBottom
        ) {
            continue;
        }

        ctx.save();

        ctx.translate(
            detail.x,
            detail.y
        );

        ctx.rotate(detail.rotation);

        if (detail.type === "pebble") {
            const size = detail.size;

            ctx.fillStyle =
                detail.shade > 0.5
                    ? "rgba(120,128,103,0.40)"
                    : "rgba(55,65,55,0.45)";

            ctx.beginPath();

            ctx.ellipse(
                0,
                0,
                size,
                size * 0.65,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        if (detail.type === "plant") {
            const size = detail.size;

            ctx.strokeStyle =
                "rgba(92,130,73,0.55)";

            ctx.lineWidth = 1.5;

            ctx.beginPath();

            ctx.moveTo(0, 4);
            ctx.lineTo(-size * 0.5, -size);

            ctx.moveTo(0, 4);
            ctx.lineTo(size * 0.3, -size * 1.2);

            ctx.moveTo(0, 4);
            ctx.lineTo(size * 0.8, -size * 0.4);

            ctx.stroke();
        }

        if (detail.type === "alienPlant") {
            const size = detail.size;

            ctx.strokeStyle =
                "rgba(118,168,116,0.65)";

            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(
                0,
                size
            );

            ctx.quadraticCurveTo(
                -size,
                0,
                -size * 0.5,
                -size
            );

            ctx.moveTo(
                0,
                size
            );

            ctx.quadraticCurveTo(
                size,
                0,
                size * 0.5,
                -size
            );

            ctx.stroke();

            ctx.fillStyle =
                "rgba(150,190,120,0.55)";

            ctx.beginPath();

            ctx.arc(
                0,
                -size,
                size * 0.28,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        ctx.restore();
    }
}

// ============================================================
// DRAW ROCKS
// ============================================================

function drawRocks() {
    for (const rock of rocks) {
        if (
            rock.x < camera.x - 100 ||
            rock.x > camera.x + W + 100 ||
            rock.y < camera.y - 100 ||
            rock.y > camera.y + H + 100
        ) {
            continue;
        }

        ctx.save();

        ctx.translate(
            rock.x,
            rock.y
        );

        ctx.rotate(rock.rotation);

        // Schaduw
        ctx.fillStyle =
            "rgba(0,0,0,0.30)";

        ctx.beginPath();

        ctx.ellipse(
            5,
            7,
            rock.size * 1.1,
            rock.size * 0.65,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Steen
        ctx.fillStyle =
            rock.shape === 0
                ? "#4d5a51"
                : "#5b6257";

        ctx.beginPath();

        ctx.moveTo(
            -rock.size,
            rock.size * 0.2
        );

        ctx.lineTo(
            -rock.size * 0.55,
            -rock.size * 0.75
        );

        ctx.lineTo(
            rock.size * 0.25,
            -rock.size
        );

        ctx.lineTo(
            rock.size,
            -rock.size * 0.2
        );

        ctx.lineTo(
            rock.size * 0.55,
            rock.size * 0.75
        );

        ctx.lineTo(
            -rock.size * 0.35,
            rock.size
        );

        ctx.closePath();

        ctx.fill();

        // Lichtvlak
        ctx.fillStyle =
            "rgba(170,180,160,0.18)";

        ctx.beginPath();

        ctx.moveTo(
            -rock.size * 0.55,
            -rock.size * 0.7
        );

        ctx.lineTo(
            rock.size * 0.2,
            -rock.size * 0.9
        );

        ctx.lineTo(
            rock.size * 0.55,
            -rock.size * 0.2
        );

        ctx.lineTo(
            -rock.size * 0.15,
            -rock.size * 0.25
        );

        ctx.closePath();

        ctx.fill();

        ctx.restore();
    }
}

// ============================================================
// DRAW TREES
// ============================================================

function drawTrees() {
    for (const tree of trees) {
        if (
            tree.x < camera.x - 100 ||
            tree.x > camera.x + W + 100 ||
            tree.y < camera.y - 100 ||
            tree.y > camera.y + H + 100
        ) {
            continue;
        }

        ctx.save();

        ctx.translate(
            tree.x,
            tree.y
        );

        ctx.rotate(tree.rotation);

        const s = tree.size;

        // Schaduw
        ctx.fillStyle =
            "rgba(0,0,0,0.25)";

        ctx.beginPath();

        ctx.ellipse(
            4,
            9,
            s * 1.2,
            s * 0.6,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Stam
        ctx.fillStyle = "#51483b";

        ctx.fillRect(
            -s * 0.18,
            -s * 0.2,
            s * 0.36,
            s
        );

        // Kroon
        ctx.fillStyle =
            tree.type === 0
                ? "#294a31"
                : "#365c37";

        ctx.beginPath();

        ctx.arc(
            0,
            -s * 0.55,
            s * 0.72,
            0,
            Math.PI * 2
        );

        ctx.arc(
            -s * 0.45,
            -s * 0.2,
            s * 0.5,
            0,
            Math.PI * 2
        );

        ctx.arc(
            s * 0.45,
            -s * 0.2,
            s * 0.5,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Licht
        ctx.fillStyle =
            "rgba(115,160,91,0.25)";

        ctx.beginPath();

        ctx.arc(
            -s * 0.25,
            -s * 0.65,
            s * 0.32,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}

// ============================================================
// DRAW BUILDINGS
// ============================================================

function drawBuildings() {
    for (const building of buildings) {
        if (
            building.x + building.w <
                camera.x - 100 ||
            building.x >
                camera.x + W + 100 ||
            building.y + building.h <
                camera.y - 100 ||
            building.y >
                camera.y + H + 100
        ) {
            continue;
        }

        ctx.save();

        const cx =
            building.x +
            building.w / 2;

        const cy =
            building.y +
            building.h / 2;

        ctx.translate(cx, cy);

        ctx.rotate(building.rotation);

        const x =
            -building.w / 2;

        const y =
            -building.h / 2;

        // Grote schaduw
        ctx.fillStyle =
            "rgba(0,0,0,0.38)";

        ctx.fillRect(
            x + 18,
            y + 22,
            building.w,
            building.h
        );

        // Achterste rand
        ctx.fillStyle =
            "#182229";

        ctx.fillRect(
            x - 8,
            y - 8,
            building.w + 16,
            building.h + 16
        );

        // Muur
        if (building.wallType === 0) {
            ctx.fillStyle = "#34434a";
        } else if (building.wallType === 1) {
            ctx.fillStyle = "#3e4d52";
        } else {
            ctx.fillStyle = "#29383e";
        }

        ctx.fillRect(
            x,
            y,
            building.w,
            building.h
        );

        // Verticale panelen
        ctx.strokeStyle =
            "rgba(130,155,160,0.16)";

        ctx.lineWidth = 3;

        for (
            let px = x + 35;
            px < x + building.w;
            px += 45
        ) {
            ctx.beginPath();

            ctx.moveTo(
                px,
                y
            );

            ctx.lineTo(
                px,
                y + building.h
            );

            ctx.stroke();
        }

        // Dak
        if (building.roofType === 0) {
            ctx.fillStyle = "#202d34";
        } else {
            ctx.fillStyle = "#26343b";
        }

        ctx.fillRect(
            x - 10,
            y - 14,
            building.w + 20,
            22
        );

        // Daklichten
        ctx.fillStyle =
            "rgba(105,175,181,0.45)";

        ctx.fillRect(
            x + building.w * 0.2,
            y - 10,
            building.w * 0.16,
            10
        );

        ctx.fillRect(
            x + building.w * 0.64,
            y - 10,
            building.w * 0.16,
            10
        );

        // Ramen
        const windowCount =
            building.windows;

        const spacing =
            building.w /
            (windowCount + 1);

        for (let i = 1; i <= windowCount; i++) {
            const wx =
                x +
                spacing * i -
                8;

            const wy =
                y +
                building.h * 0.28;

            ctx.fillStyle =
                "rgba(100,188,195,0.17)";

            ctx.fillRect(
                wx,
                wy,
                16,
                28
            );

            ctx.strokeStyle =
                "rgba(120,205,210,0.42)";

            ctx.lineWidth = 2;

            ctx.strokeRect(
                wx,
                wy,
                16,
                28
            );
        }

        // Deur
        const doorX =
            building.doorSide === 0
                ? x + building.w * 0.2
                : building.doorSide === 1
                ? x + building.w * 0.5
                : x + building.w * 0.75;

        const doorY =
            y +
            building.h -
            58;

        ctx.fillStyle = "#172128";

        ctx.fillRect(
            doorX - 14,
            doorY,
            28,
            58
        );

        ctx.fillStyle =
            "rgba(99,184,191,0.35)";

        ctx.fillRect(
            doorX - 9,
            doorY + 8,
            18,
            4
        );

        // Neon lijn
        ctx.strokeStyle =
            "rgba(99,210,208,0.3)";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            x + 5,
            y + 6
        );

        ctx.lineTo(
            x + building.w - 5,
            y + 6
        );

        ctx.stroke();

        ctx.restore();
    }
}

// ============================================================
// DRAW PLAYER TANK
// ============================================================

function drawPlayer() {
    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );

    // Schaduw
    ctx.fillStyle =
        "rgba(0,0,0,0.45)";

    ctx.beginPath();

    ctx.ellipse(
        8,
        12,
        42,
        28,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Tank body
    ctx.fillStyle = "#25353c";

    ctx.beginPath();

    ctx.roundRect(
        -38,
        -25,
        76,
        50,
        12
    );

    ctx.fill();

    ctx.strokeStyle =
        "#62777a";

    ctx.lineWidth = 3;

    ctx.stroke();

    // Zijpanelen
    ctx.fillStyle = "#18262c";

    ctx.fillRect(
        -34,
        -19,
        12,
        38
    );

    ctx.fillRect(
        22,
        -19,
        12,
        38
    );

    // Midden
    ctx.fillStyle = "#344b50";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        25,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Turret draaien naar muis
    ctx.rotate(
        player.turretAngle
    );

    // Kanon
    ctx.fillStyle = "#52676b";

    ctx.fillRect(
        5,
        -8,
        45,
        16
    );

    ctx.fillStyle = "#18272d";

    ctx.fillRect(
        42,
        -5,
        16,
        10
    );

    // Turret
    ctx.fillStyle = "#3e575b";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        17,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
        "#7e9697";

    ctx.lineWidth = 2;

    ctx.stroke();

    // Energie lampje
    ctx.fillStyle =
        "rgba(100,220,215,0.9)";

    ctx.beginPath();

    ctx.arc(
        5,
        -8,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // Schade-flash
    if (player.invincible > 0) {
        ctx.save();

        ctx.globalAlpha =
            player.invincible * 1.5;

        ctx.strokeStyle =
            "#9fe7e2";

        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            45,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.restore();
    }
}

// ============================================================
// DRAW ALIENS
// ============================================================

function drawEnemies() {
    for (const enemy of enemies) {
        if (
            enemy.x < camera.x - 100 ||
            enemy.x > camera.x + W + 100 ||
            enemy.y < camera.y - 100 ||
            enemy.y > camera.y + H + 100
        ) {
            continue;
        }

        ctx.save();

        ctx.translate(
            enemy.x,
            enemy.y
        );

        ctx.rotate(
            enemy.rotation
        );

        const pulse =
            Math.sin(
                enemy.animation
            ) * 2;

        // Schaduw
        ctx.save();

        ctx.rotate(
            -enemy.rotation
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.35)";

        ctx.beginPath();

        ctx.ellipse(
            5,
            8,
            enemy.radius * 1.1,
            enemy.radius * 0.6,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();

        // ====================================================
        // CRAWLER
        // ====================================================

        if (enemy.type === "crawler") {
            ctx.fillStyle =
                enemy.hitFlash > 0
                    ? "#d6ffff"
                    : "#557d69";

            ctx.beginPath();

            ctx.ellipse(
                0,
                0,
                enemy.radius + pulse,
                enemy.radius * 0.72,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.strokeStyle =
                "#9abca7";

            ctx.lineWidth = 3;

            ctx.stroke();

            // Poten
            ctx.strokeStyle =
                "#3c5a4c";

            ctx.lineWidth = 5;

            for (
                let i = -1;
                i <= 1;
                i++
            ) {
                ctx.beginPath();

                ctx.moveTo(
                    -10,
                    i * 10
                );

                ctx.lineTo(
                    -32,
                    i * 16
                );

                ctx.stroke();

                ctx.beginPath();

                ctx.moveTo(
                    10,
                    i * 10
                );

                ctx.lineTo(
                    32,
                    i * 16
                );

                ctx.stroke();
            }

            // Ogen
            ctx.fillStyle =
                "#d9ffbd";

            ctx.beginPath();

            ctx.arc(
                14,
                -8,
                4,
                0,
                Math.PI * 2
            );

            ctx.arc(
                14,
                8,
                4,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        // ====================================================
        // STALKER
        // ====================================================

        if (enemy.type === "stalker") {
            ctx.fillStyle =
                enemy.hitFlash > 0
                    ? "#d6ffff"
                    : "#416e68";

            ctx.beginPath();

            ctx.ellipse(
                0,
                0,
                enemy.radius * 0.75,
                enemy.radius,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.strokeStyle =
                "#8fb5a8";

            ctx.lineWidth = 3;

            ctx.stroke();

            // Kop
            ctx.fillStyle =
                "#5b8b7c";

            ctx.beginPath();

            ctx.ellipse(
                10,
                0,
                18,
                21,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();

            // Ogen
            ctx.fillStyle =
                "#c9ffbe";

            ctx.beginPath();

            ctx.arc(
                16,
                -8,
                5,
                0,
                Math.PI * 2
            );

            ctx.arc(
                16,
                8,
                5,
                0,
                Math.PI * 2
            );

            ctx.fill();

            // Armen
            ctx.strokeStyle =
                "#507d70";

            ctx.lineWidth = 7;

            ctx.beginPath();

            ctx.moveTo(
                0,
                -14
            );

            ctx.lineTo(
                -24,
                -25
            );

            ctx.stroke();

            ctx.beginPath();

            ctx.moveTo(
                0,
                14
            );

            ctx.lineTo(
                -24,
                25
            );

            ctx.stroke();
        }

        // ====================================================
        // GUARDIAN
        // ====================================================

        if (enemy.type === "guardian") {
            ctx.fillStyle =
                enemy.hitFlash > 0
                    ? "#dfffff"
                    : "#4f6178";

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
                "#9eb8c9";

            ctx.lineWidth = 4;

            ctx.stroke();

            // Pantser
            ctx.fillStyle =
                "#263c52";

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                enemy.radius * 0.65,
                0,
                Math.PI * 2
            );

            ctx.fill();

            // Kern
            ctx.fillStyle =
                "rgba(120,215,225,0.8)";

            ctx.beginPath();

            ctx.arc(
                10,
                0,
                8 + pulse,
                0,
                Math.PI * 2
            );

            ctx.fill();

            // Ring
            ctx.strokeStyle =
                "rgba(160,225,230,0.5)";

            ctx.lineWidth = 3;

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                enemy.radius * 0.8,
                -0.7,
                0.7
            );

            ctx.stroke();
        }

        ctx.restore();

        // ====================================================
        // HEALTH BAR
        // ====================================================

        const barWidth =
            enemy.radius * 2.2;

        const healthPercent =
            enemy.health /
            enemy.maxHealth;

        ctx.fillStyle =
            "rgba(0,0,0,0.55)";

        ctx.fillRect(
            enemy.x - barWidth / 2,
            enemy.y -
                enemy.radius -
                15,
            barWidth,
            5
        );

        ctx.fillStyle =
            "#79c9b4";

        ctx.fillRect(
            enemy.x - barWidth / 2,
            enemy.y -
                enemy.radius -
                15,
            barWidth *
                clamp(
                    healthPercent,
                    0,
                    1
                ),
            5
        );
    }
}

// ============================================================
// DRAW BULLETS
// ============================================================

function drawBullets() {
    for (const bullet of bullets) {
        ctx.save();

        ctx.translate(
            bullet.x,
            bullet.y
        );

        const angle =
            Math.atan2(
                bullet.vy,
                bullet.vx
            );

        ctx.rotate(angle);

        // Licht
        ctx.fillStyle =
            "rgba(120,230,220,0.18)";

        ctx.beginPath();

        ctx.ellipse(
            -8,
            0,
            18,
            7,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Kogel
        ctx.fillStyle =
            "#c4ffff";

        ctx.beginPath();

        ctx.roundRect(
            -bullet.size,
            -bullet.size / 2,
            bullet.size * 3,
            bullet.size,
            3
        );

        ctx.fill();

        ctx.restore();
    }
}

// ============================================================
// DRAW ENEMY BULLETS
// ============================================================

function drawEnemyBullets() {
    for (const bullet of enemyBullets) {
        ctx.save();

        ctx.translate(
            bullet.x,
            bullet.y
        );

        ctx.fillStyle =
            "#a7bfff";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            bullet.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "rgba(120,160,255,0.2)";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            bullet.size * 2,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}

// ============================================================
// DRAW PARTICLES
// ============================================================

function drawParticles() {
    for (const p of particles) {
        const alpha =
            clamp(
                p.life / p.maxLife,
                0,
                1
            );

        ctx.save();

        ctx.globalAlpha = alpha;

        if (p.type === "alienDeath") {
            ctx.fillStyle =
                "#9ce0c3";
        } else if (p.type === "dash") {
            ctx.fillStyle =
                "#9ee8df";
        } else if (p.type === "muzzle") {
            ctx.fillStyle =
                "#d5ffff";
        } else if (p.type === "hit") {
            ctx.fillStyle =
                "#b9e5df";
        } else {
            ctx.fillStyle =
                "#8ecdc5";
        }

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
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

    const kills =
        document.getElementById(
            "kills"
        );

    const credits =
        document.getElementById(
            "credits"
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

    const weapon =
        weapons[player.weapon];

    if (ammo) {
        if (player.reloadTimer > 0) {
            ammo.textContent =
                "RELOADING...";
        } else {
            ammo.textContent =
                `${weapon.ammo} / ∞`;
        }
    }

    if (kills) {
        kills.textContent =
            `KILLS: ${player.kills}`;
    }

    if (credits) {
        credits.textContent =
            `CREDITS: ${player.credits}`;
    }

    if (zone) {
        const distanceFromCenter =
            distance(
                player.x,
                player.y,
                WORLD_W / 2,
                WORLD_H / 2
            );

        if (distanceFromCenter < 700) {
            zone.textContent =
                "SIGNAL CORE";
        } else if (
            distanceFromCenter < 1700
        ) {
            zone.textContent =
                "INNER SECTOR";
        } else if (
            distanceFromCenter < 2900
        ) {
            zone.textContent =
                "OUTER SECTOR";
        } else {
            zone.textContent =
                "UNKNOWN SECTOR";
        }
    }
}

// ============================================================
// DRAW WORLD
// ============================================================

function drawWorld() {
    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    ctx.save();

    ctx.translate(
        -camera.x,
        -camera.y
    );

    // Grond eerst
    drawGround();

    // Kleine natuur
    drawRocks();

    drawTrees();

    // Gebouwen
    drawBuildings();

    // Projectielen
    drawBullets();

    drawEnemyBullets();

    // Aliens
    drawEnemies();

    // Tank
    drawPlayer();

    // Particles bovenop
    drawParticles();

    ctx.restore();

    // Vignette
    drawVignette();
}

// ============================================================
// VIGNETTE
// ============================================================

function drawVignette() {
    const gradient =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            Math.min(W, H) * 0.25,
            W / 2,
            H / 2,
            Math.max(W, H) * 0.75
        );

    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0.34)"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );
}

// ============================================================
// GAME START
// ============================================================

function startGame() {
    gameRunning = true;
    paused = false;

    player.x =
        WORLD_W / 2;

    player.y =
        WORLD_H / 2;

    player.health =
        player.maxHealth;

    player.energy =
        player.maxEnergy;

    player.fireCooldown = 0;
    player.reloadTimer = 0;
    player.dashCooldown = 0;
    player.invincible = 0;

    player.kills = 0;
    player.credits = 0;

    bullets.length = 0;
    enemyBullets.length = 0;
    particles.length = 0;
    enemies.length = 0;

    weapons.forEach(
        (weapon) => {
            weapon.ammo =
                weapon.maxAmmo;
        }
    );

    createBuildings();
    createTrees();
    createRocks();
    createGroundDetails();

    alienSpawnTimer = 0;

    spawnStartingAliens();

    const menu =
        document.getElementById(
            "menu"
        );

    if (menu) {
        menu.style.display =
            "none";
    }

    const hud =
        document.getElementById(
            "hud"
        );

    if (hud) {
        hud.style.display =
            "block";
    }

    const pause =
        document.getElementById(
            "pause"
        );

    if (pause) {
        pause.style.display =
            "none";
    }
}

// ============================================================
// PAUSE
// ============================================================

function togglePause() {
    if (!gameRunning) return;

    paused = !paused;

    const pause =
        document.getElementById(
            "pause"
        );

    if (pause) {
        pause.style.display =
            paused
                ? "flex"
                : "none";
    }
}

// ============================================================
// GAME OVER
// ============================================================

function gameOver() {
    gameRunning = false;
    paused = false;

    mouse.down = false;

    const hud =
        document.getElementById(
            "hud"
        );

    if (hud) {
        hud.style.display =
            "none";
    }

    const pause =
        document.getElementById(
            "pause"
        );

    if (pause) {
        pause.style.display =
            "flex";
    }

    const pauseBox =
        pause
            ? pause.querySelector(
                ".pauseBox"
            )
            : null;

    if (pauseBox) {
        pauseBox.innerHTML = `
            <div class="pauseSmall">
                ECHOBOUND
            </div>

            <h2>RUN ENDED</h2>

            <p style="
                color:#aebbbb;
                margin:10px 0 20px;
            ">
                The signal is still out there.
            </p>

            <button
                id="restartGame"
                class="menuButton main"
            >
                NEW RUN
            </button>

            <button
                id="returnMenu"
                class="menuButton"
            >
                MAIN MENU
            </button>
        `;

        const restart =
            document.getElementById(
                "restartGame"
            );

        if (restart) {
            restart.addEventListener(
                "click",
                () => {
                    startGame();
                }
            );
        }

        const returnMenu =
            document.getElementById(
                "returnMenu"
            );

        if (returnMenu) {
            returnMenu.addEventListener(
                "click",
                () => {
                    location.reload();
                }
            );
        }
    }
}

// ============================================================
// MENU BUTTONS
// ============================================================

const newGameButton =
    document.getElementById(
        "newGame"
    );

if (newGameButton) {
    newGameButton.addEventListener(
        "click",
        () => {
            startGame();
        }
    );
}

const resumeButton =
    document.getElementById(
        "resume"
    );

if (resumeButton) {
    resumeButton.addEventListener(
        "click",
        () => {
            paused = false;

            const pause =
                document.getElementById(
                    "pause"
                );

            if (pause) {
                pause.style.display =
                    "none";
            }
        }
    );
}

const quitButton =
    document.getElementById(
        "quit"
    );

if (quitButton) {
    quitButton.addEventListener(
        "click",
        () => {
            gameRunning = false;
            paused = false;

            const pause =
                document.getElementById(
                    "pause"
                );

            if (pause) {
                pause.style.display =
                    "none";
            }

            const hud =
                document.getElementById(
                    "hud"
                );

            if (hud) {
                hud.style.display =
                    "none";
            }

            const menu =
                document.getElementById(
                    "menu"
                );

            if (menu) {
                menu.style.display =
                    "flex";
            }
        }
    );
}

// ============================================================
// SAVE
// ============================================================

const saveButton =
    document.getElementById(
        "save"
    );

if (saveButton) {
    saveButton.addEventListener(
        "click",
        () => {
            try {
                const saveData = {
                    x: player.x,
                    y: player.y,
                    health: player.health,
                    energy: player.energy,
                    kills: player.kills,
                    credits: player.credits,
                    weapon: player.weapon,

                    ammo: weapons.map(
                        weapon =>
                            weapon.ammo
                    )
                };

                localStorage.setItem(
                    "echoboundSave",
                    JSON.stringify(
                        saveData
                    )
                );

                saveButton.textContent =
                    "SAVED!";

                setTimeout(
                    () => {
                        saveButton.textContent =
                            "SAVE RUN";
                    },
                    1200
                );
            } catch (error) {
                console.log(
                    "Save error:",
                    error
                );
            }
        }
    );
}

// ============================================================
// LOAD
// ============================================================

const loadButton =
    document.getElementById(
        "loadGame"
    );

if (loadButton) {
    loadButton.addEventListener(
        "click",
        () => {
            try {
                const raw =
                    localStorage.getItem(
                        "echoboundSave"
                    );

                if (!raw) {
                    startGame();
                    return;
                }

                const saveData =
                    JSON.parse(raw);

                startGame();

                player.x =
                    clamp(
                        Number(
                            saveData.x
                        ) ||
                            WORLD_W / 2,
                        player.radius,
                        WORLD_W -
                            player.radius
                    );

                player.y =
                    clamp(
                        Number(
                            saveData.y
                        ) ||
                            WORLD_H / 2,
                        player.radius,
                        WORLD_H -
                            player.radius
                    );

                player.health =
                    clamp(
                        Number(
                            saveData.health
                        ) ||
                            player.maxHealth,
                        0,
                        player.maxHealth
                    );

                player.energy =
                    clamp(
                        Number(
                            saveData.energy
                        ) ||
                            player.maxEnergy,
                        0,
                        player.maxEnergy
                    );

                player.kills =
                    Number(
                        saveData.kills
                    ) || 0;

                player.credits =
                    Number(
                        saveData.credits
                    ) || 0;

                player.weapon =
                    clamp(
                        Number(
                            saveData.weapon
                        ) || 0,
                        0,
                        weapons.length - 1
                    );

                if (
                    Array.isArray(
                        saveData.ammo
                    )
                ) {
                    weapons.forEach(
                        (
                            weapon,
                            index
                        ) => {
                            if (
                                typeof saveData
                                    .ammo[index] ===
                                "number"
                            ) {
                                weapon.ammo =
                                    clamp(
                                        saveData
                                            .ammo[
                                            index
                                        ],
                                        0,
                                        weapon.maxAmmo
                                    );
                            }
                        }
                    );
                }
            } catch (error) {
                console.log(
                    "Load error:",
                    error
                );

                startGame();
            }
        }
    );
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

const achievementsButton =
    document.getElementById(
        "achievementsButton"
    );

if (achievementsButton) {
    achievementsButton.addEventListener(
        "click",
        () => {
            alert(
                "ACHIEVEMENTS\n\n" +
                "FIRST SIGNAL — Find the lost signal\n" +
                "FIRST ECHO — Defeat your first alien\n" +
                "HUNTER — Defeat 10 aliens\n" +
                "SURVIVOR — Stay alive\n" +
                "GUARDIAN DOWN — Defeat a Guardian"
            );
        }
    );
}

// ============================================================
// CONTROLS
// ============================================================

const controlsButton =
    document.getElementById(
        "controlsButton"
    );

if (controlsButton) {
    controlsButton.addEventListener(
        "click",
        () => {
            alert(
                "CONTROLS\n\n" +
                "WASD / Pijltjes = bewegen\n" +
                "Muis = richten\n" +
                "Linkermuisknop = schieten\n" +
                "R = herladen\n" +
                "SHIFT = sneller bewegen\n" +
                "SPACE = dash\n" +
                "1 / 2 / 3 = wapens wisselen\n" +
                "ESC = pauzeren"
            );
        }
    );
}

// ============================================================
// MAIN UPDATE
// ============================================================

function update(dt) {
    if (!gameRunning) return;
    if (paused) return;

    updateAim();

    updatePlayer(dt);

    updatePlayerCombat(dt);

    updateAlienSpawner(dt);

    updateEnemies(dt);

    updateBullets(dt);

    updateEnemyBullets(dt);

    updateParticles(dt);

    updateCamera();

    updateHUD();
}

// ============================================================
// GAME LOOP
// ============================================================

function gameLoop(time) {
    if (!lastTime) {
        lastTime = time;
    }

    let dt =
        (time - lastTime) /
        1000;

    lastTime = time;

    // Voorkom enorme sprong na tabblad wisselen
    dt = clamp(
        dt,
        0,
        0.05
    );

    update(dt);

    drawWorld();

    requestAnimationFrame(
        gameLoop
    );
}

// ============================================================
// INITIAL SCREEN
// ============================================================

const hud =
    document.getElementById(
        "hud"
    );

if (hud) {
    hud.style.display =
        "none";
}

const pause =
    document.getElementById(
        "pause"
    );

if (pause) {
    pause.style.display =
        "none";
}

// ============================================================
// START LOOP
// ============================================================

requestAnimationFrame(
    gameLoop
);
