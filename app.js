// ============================================================
// ECHOBOUND — THE LOST SIGNAL
// NIEUWE APP.JS MET WERKENDE ALIENS
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;

// ============================================================
// WERELD
// ============================================================

const WORLD_W = 7000;
const WORLD_H = 7000;

let gameRunning = false;
let paused = false;

let lastTime = 0;

// ============================================================
// INPUT
// ============================================================

const keys = new Set();

const mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

window.addEventListener("keydown", (e) => {

    if (
        e.code === "KeyW" ||
        e.code === "KeyA" ||
        e.code === "KeyS" ||
        e.code === "KeyD" ||
        e.code === "Space"
    ) {
        e.preventDefault();
    }

    keys.add(e.code);

    if (e.code === "KeyR") {
        reload();
    }

    if (e.code === "Digit1") {
        player.weapon = 0;
    }

    if (e.code === "Digit2") {
        player.weapon = 1;
    }

    if (e.code === "Digit3") {
        player.weapon = 2;
    }

    if (e.code === "Space") {
        dash();
    }

    if (e.code === "Escape") {
        togglePause();
    }
});

window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
});

window.addEventListener("blur", () => {
    keys.clear();
    mouse.down = false;
});

document.addEventListener("visibilitychange", () => {

    if (document.hidden) {
        keys.clear();
        mouse.down = false;
    }
});

canvas.addEventListener("pointermove", (e) => {

    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener("pointerdown", (e) => {

    if (e.button === 0) {

        mouse.down = true;

        if (canvas.setPointerCapture) {
            canvas.setPointerCapture(e.pointerId);
        }
    }
});

window.addEventListener("pointerup", (e) => {

    if (e.button === 0) {
        mouse.down = false;
    }
});

canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

window.addEventListener("resize", () => {

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;
});

// ============================================================
// HULPFUNCTIES
// ============================================================

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(a, b) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// ============================================================
// SPELER
// ============================================================

const player = {

    x: 0,
    y: 0,

    radius: 25,

    speed: 230,
    sprintSpeed: 340,

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
// WAPENS
// ============================================================

const weapons = [

    {
        name: "PULSE",
        damage: 1,
        fireRate: 0.16,
        speed: 900,
        maxAmmo: 12,
        ammo: 12
    },

    {
        name: "BURST",
        damage: 1,
        fireRate: 0.28,
        speed: 1000,
        maxAmmo: 8,
        ammo: 8
    },

    {
        name: "CANNON",
        damage: 4,
        fireRate: 0.65,
        speed: 700,
        maxAmmo: 4,
        ammo: 4
    }
];

// ============================================================
// ARRAYS
// ============================================================

const enemies = [];
const bullets = [];
const enemyBullets = [];
const particles = [];
const buildings = [];
const trees = [];
const rocks = [];
const loot = [];
const npcs = [];

// ============================================================
// ALIEN SPAWN INSTELLINGEN
// ============================================================

const MAX_ALIENS = 15;

let alienSpawnTimer = 0;

const STARTING_ALIENS = 8;

// ============================================================
// ALIEN SPAWN
// ============================================================

function spawnAlien() {

    if (!gameRunning) {
        return;
    }

    if (enemies.length >= MAX_ALIENS) {
        return;
    }

    let x;
    let y;

    let attempts = 0;

    do {

        const angle = Math.random() * Math.PI * 2;

        const spawnDistance = random(900, 1800);

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
            y > WORLD_H - 100
        ) &&
        attempts < 30
    );

    x = clamp(x, 100, WORLD_W - 100);
    y = clamp(y, 100, WORLD_H - 100);

    const typeRoll = Math.random();

    let type;
    let health;
    let speed;
    let radius;

    // GROTE ALIEN
    if (typeRoll < 0.15) {

        type = "guardian";

        health = 10;
        speed = 45;
        radius = 34;

    }

    // SNELLE ALIEN
    else if (typeRoll < 0.45) {

        type = "crawler";

        health = 3;
        speed = 85;
        radius = 22;

    }

    // NORMALE ALIEN
    else {

        type = "stalker";

        health = 4;
        speed = 55;
        radius = 27;
    }

    enemies.push({

        x: x,
        y: y,

        radius: radius,

        type: type,

        health: health,
        maxHealth: health,

        speed: speed,

        attackCooldown: random(0, 1),

        shootCooldown: random(1, 3),

        pulse: random(0, Math.PI * 2),

        hitFlash: 0
    });
}

// ============================================================
// ALIENS STARTEN
// ============================================================

function spawnStartingAliens() {

    enemies.length = 0;

    for (let i = 0; i < STARTING_ALIENS; i++) {

        spawnAlien();
    }
}

// ============================================================
// CONTINUE ALIENS SPAWNEN
// ============================================================

function updateAlienSpawner(dt) {

    if (!gameRunning || paused) {
        return;
    }

    alienSpawnTimer -= dt;

    if (alienSpawnTimer <= 0) {

        alienSpawnTimer = 1.5;

        if (enemies.length < MAX_ALIENS) {

            // 1 nieuwe alien
            spawnAlien();
        }
    }
}

// ============================================================
// SPELER BEWEGEN
// ============================================================

function updatePlayer(dt) {

    if (player.invincible > 0) {
        player.invincible -= dt;
    }

    if (player.dashCooldown > 0) {
        player.dashCooldown -= dt;
    }

    if (player.fireCooldown > 0) {
        player.fireCooldown -= dt;
    }

    if (player.reloadTimer > 0) {

        player.reloadTimer -= dt;

        if (player.reloadTimer <= 0) {

            const weapon = weapons[player.weapon];

            weapon.ammo = weapon.maxAmmo;
        }
    }

    let dx = 0;
    let dy = 0;

    if (keys.has("KeyW")) {
        dy -= 1;
    }

    if (keys.has("KeyS")) {
        dy += 1;
    }

    if (keys.has("KeyA")) {
        dx -= 1;
    }

    if (keys.has("KeyD")) {
        dx += 1;
    }

    const length = Math.hypot(dx, dy);

    if (length > 0) {

        dx /= length;
        dy /= length;

        let speed = player.speed;

        if (
            keys.has("ShiftLeft") ||
            keys.has("ShiftRight")
        ) {
            speed = player.sprintSpeed;
        }

        player.x += dx * speed * dt;
        player.y += dy * speed * dt;
    }

    player.x = clamp(
        player.x,
        40,
        WORLD_W - 40
    );

    player.y = clamp(
        player.y,
        40,
        WORLD_H - 40
    );

    // Richting naar muis
    const screenX = W / 2;
    const screenY = H / 2;

    player.turretAngle = Math.atan2(
        mouse.y - screenY,
        mouse.x - screenX
    );

    // Schieten
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

    if (!gameRunning || paused) {
        return;
    }

    if (player.dashCooldown > 0) {
        return;
    }

    if (player.energy < 25) {
        return;
    }

    let dx = 0;
    let dy = 0;

    if (keys.has("KeyW")) dy--;
    if (keys.has("KeyS")) dy++;
    if (keys.has("KeyA")) dx--;
    if (keys.has("KeyD")) dx++;

    const length = Math.hypot(dx, dy);

    if (length === 0) {
        return;
    }

    dx /= length;
    dy /= length;

    player.x += dx * 280;
    player.y += dy * 280;

    player.x = clamp(player.x, 40, WORLD_W - 40);
    player.y = clamp(player.y, 40, WORLD_H - 40);

    player.energy -= 25;

    player.dashCooldown = 1;

    createParticles(
        player.x,
        player.y,
        12
    );
}

// ============================================================
// SCHIETEN
// ============================================================

function shoot() {

    const weapon = weapons[player.weapon];

    if (player.fireCooldown > 0) {
        return;
    }

    if (weapon.ammo <= 0) {

        reload();

        return;
    }

    weapon.ammo--;

    player.fireCooldown = weapon.fireRate;

    const angle = player.turretAngle;

    const startX =
        player.x +
        Math.cos(angle) * 40;

    const startY =
        player.y +
        Math.sin(angle) * 40;

    bullets.push({

        x: startX,
        y: startY,

        vx: Math.cos(angle) * weapon.speed,
        vy: Math.sin(angle) * weapon.speed,

        damage: weapon.damage,

        life: 1.5,

        radius: weapon.name === "CANNON" ? 7 : 4
    });

    createParticles(
        startX,
        startY,
        3
    );
}

// ============================================================
// HERLADEN
// ============================================================

function reload() {

    const weapon = weapons[player.weapon];

    if (player.reloadTimer > 0) {
        return;
    }

    if (weapon.ammo >= weapon.maxAmmo) {
        return;
    }

    player.reloadTimer = 1;

    setTimeout(() => {

        weapon.ammo = weapon.maxAmmo;

    }, 1000);
}

// ============================================================
// ALIENS UPDATEN
// ============================================================

function updateEnemies(dt) {

    for (let i = enemies.length - 1; i >= 0; i--) {

        const enemy = enemies[i];

        enemy.attackCooldown -= dt;
        enemy.shootCooldown -= dt;

        if (enemy.hitFlash > 0) {
            enemy.hitFlash -= dt;
        }

        enemy.pulse += dt * 3;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        const distanceToPlayer =
            Math.hypot(dx, dy);

        if (distanceToPlayer > 0) {

            const nx = dx / distanceToPlayer;
            const ny = dy / distanceToPlayer;

            // Alien loopt naar speler
            if (distanceToPlayer > 80) {

                enemy.x +=
                    nx *
                    enemy.speed *
                    dt;

                enemy.y +=
                    ny *
                    enemy.speed *
                    dt;
            }

            // Alien valt speler aan
            if (
                distanceToPlayer < 75 &&
                enemy.attackCooldown <= 0
            ) {

                damagePlayer(
                    enemy.type === "guardian"
                        ? 12
                        : 7
                );

                enemy.attackCooldown = 1;
            }

            // Guardian kan schieten
            if (
                enemy.type === "guardian" &&
                distanceToPlayer < 800 &&
                enemy.shootCooldown <= 0
            ) {

                enemyShoot(enemy);

                enemy.shootCooldown = 2;
            }
        }

        enemy.x = clamp(
            enemy.x,
            50,
            WORLD_W - 50
        );

        enemy.y = clamp(
            enemy.y,
            50,
            WORLD_H - 50
        );
    }
}

// ============================================================
// ALIEN SCHIET
// ============================================================

function enemyShoot(enemy) {

    const angle = Math.atan2(
        player.y - enemy.y,
        player.x - enemy.x
    );

    enemyBullets.push({

        x: enemy.x,
        y: enemy.y,

        vx: Math.cos(angle) * 350,
        vy: Math.sin(angle) * 350,

        life: 3,

        radius: 6,

        damage: 8
    });
}

// ============================================================
// SPELER DAMAGE
// ============================================================

function damagePlayer(amount) {

    if (player.invincible > 0) {
        return;
    }

    player.health -= amount;

    player.invincible = 0.5;

    createParticles(
        player.x,
        player.y,
        8
    );

    if (player.health <= 0) {

        player.health = 0;

        gameOver();
    }
}

// ============================================================
// BULLETS UPDATEN
// ============================================================

function updateBullets(dt) {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = bullets[i];

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;

        bullet.life -= dt;

        let removeBullet =
            bullet.life <= 0;

        if (
            bullet.x < 0 ||
            bullet.x > WORLD_W ||
            bullet.y < 0 ||
            bullet.y > WORLD_H
        ) {
            removeBullet = true;
        }

        // Alien raken
        for (
            let j = enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy = enemies[j];

            const dx =
                bullet.x - enemy.x;

            const dy =
                bullet.y - enemy.y;

            const hitDistance =
                bullet.radius +
                enemy.radius;

            if (
                dx * dx +
                dy * dy <
                hitDistance * hitDistance
            ) {

                enemy.health -= bullet.damage;

                enemy.hitFlash = 0.12;

                createParticles(
                    enemy.x,
                    enemy.y,
                    5
                );

                removeBullet = true;

                if (enemy.health <= 0) {

                    killAlien(j);
                }

                break;
            }
        }

        if (removeBullet) {

            bullets.splice(i, 1);
        }
    }
}

// ============================================================
// ALIEN DOOD
// ============================================================

function killAlien(index) {

    const enemy = enemies[index];

    createParticles(
        enemy.x,
        enemy.y,
        18
    );

    enemies.splice(index, 1);

    // GEEN BLOED
    // Alleen energie-deeltjes.

    // De volgende spawn komt automatisch
    // via updateAlienSpawner().
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

        const dx =
            bullet.x - player.x;

        const dy =
            bullet.y - player.y;

        const hitDistance =
            bullet.radius +
            player.radius;

        if (
            dx * dx +
            dy * dy <
            hitDistance * hitDistance
        ) {

            damagePlayer(
                bullet.damage
            );

            enemyBullets.splice(i, 1);

            continue;
        }

        if (
            bullet.life <= 0 ||
            bullet.x < 0 ||
            bullet.x > WORLD_W ||
            bullet.y < 0 ||
            bullet.y > WORLD_H
        ) {

            enemyBullets.splice(i, 1);
        }
    }
}

// ============================================================
// PARTICLES
// ============================================================

function createParticles(x, y, amount) {

    for (let i = 0; i < amount; i++) {

        const angle =
            Math.random() * Math.PI * 2;

        const speed =
            random(30, 180);

        particles.push({

            x: x,
            y: y,

            vx:
                Math.cos(angle) * speed,

            vy:
                Math.sin(angle) * speed,

            life: random(0.25, 0.7),

            size: random(2, 6)
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
// CAMERA
// ============================================================

function getCamera() {

    return {

        x:
            player.x -
            W / 2,

        y:
            player.y -
            H / 2
    };
}

// ============================================================
// WERELD
// ============================================================

function createWorld() {

    buildings.length = 0;
    trees.length = 0;
    rocks.length = 0;

    // Gebouwen
    for (let i = 0; i < 35; i++) {

        buildings.push({

            x: random(200, WORLD_W - 200),

            y: random(200, WORLD_H - 200),

            w: random(180, 380),

            h: random(150, 300)
        });
    }

    // Bomen
    for (let i = 0; i < 180; i++) {

        trees.push({

            x: random(100, WORLD_W - 100),

            y: random(100, WORLD_H - 100),

            radius: random(18, 35)
        });
    }

    // Rotsen
    for (let i = 0; i < 100; i++) {

        rocks.push({

            x: random(100, WORLD_W - 100),

            y: random(100, WORLD_H - 100),

            radius: random(10, 25)
        });
    }
}

// ============================================================
// WERELD TEKENEN
// ============================================================

function drawWorld(camera) {

    ctx.fillStyle = "#10161a";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    // Raster
    ctx.strokeStyle =
        "rgba(80,100,105,0.12)";

    ctx.lineWidth = 1;

    const grid = 100;

    const startX =
        Math.floor(camera.x / grid) * grid;

    const startY =
        Math.floor(camera.y / grid) * grid;

    for (
        let x = startX;
        x < camera.x + W + grid;
        x += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x - camera.x,
            0
        );

        ctx.lineTo(
            x - camera.x,
            H
        );

        ctx.stroke();
    }

    for (
        let y = startY;
        y < camera.y + H + grid;
        y += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y - camera.y
        );

        ctx.lineTo(
            W,
            y - camera.y
        );

        ctx.stroke();
    }

    // Gebouwen
    for (const building of buildings) {

        const sx =
            building.x - camera.x;

        const sy =
            building.y - camera.y;

        if (
            sx < -500 ||
            sx > W + 500 ||
            sy < -500 ||
            sy > H + 500
        ) {
            continue;
        }

        ctx.fillStyle = "#252d31";

        ctx.fillRect(
            sx,
            sy,
            building.w,
            building.h
        );

        ctx.strokeStyle = "#4b5a5f";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            sx,
            sy,
            building.w,
            building.h
        );

        // Dak
        ctx.fillStyle = "#303b40";

        ctx.fillRect(
            sx + 15,
            sy + 15,
            building.w - 30,
            25
        );
    }

    // Bomen
    for (const tree of trees) {

        const sx =
            tree.x - camera.x;

        const sy =
            tree.y - camera.y;

        if (
            sx < -50 ||
            sx > W + 50 ||
            sy < -50 ||
            sy > H + 50
        ) {
            continue;
        }

        ctx.fillStyle = "#263a30";

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            tree.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = "#46624e";

        ctx.stroke();
    }

    // Rotsen
    for (const rock of rocks) {

        const sx =
            rock.x - camera.x;

        const sy =
            rock.y - camera.y;

        ctx.fillStyle = "#414b4e";

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            rock.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ============================================================
// SPELER TEKENEN
// ============================================================

function drawPlayer(camera) {

    const sx = W / 2;
    const sy = H / 2;

    ctx.save();

    ctx.translate(
        sx,
        sy
    );

    ctx.rotate(
        player.turretAngle
    );

    // Tank lichaam
    ctx.fillStyle = "#52636a";

    ctx.beginPath();

    ctx.roundRect(
        -28,
        -22,
        56,
        44,
        10
    );

    ctx.fill();

    ctx.strokeStyle = "#91a4aa";

    ctx.lineWidth = 3;

    ctx.stroke();

    // Pantser
    ctx.fillStyle = "#354348";

    ctx.fillRect(
        -19,
        -17,
        38,
        34
    );

    // Koepel
    ctx.fillStyle = "#71848a";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        15,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Kanon
    ctx.fillStyle = "#a5b3b6";

    ctx.fillRect(
        8,
        -5,
        38,
        10
    );

    ctx.restore();

    // Schade-indicatie
    if (player.invincible > 0) {

        ctx.strokeStyle =
            "rgba(255,255,255,0.8)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            35,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }
}

// ============================================================
// ALIENS TEKENEN
// ============================================================

function drawEnemies(camera) {

    for (const enemy of enemies) {

        const sx =
            enemy.x - camera.x;

        const sy =
            enemy.y - camera.y;

        if (
            sx < -100 ||
            sx > W + 100 ||
            sy < -100 ||
            sy > H + 100
        ) {
            continue;
        }

        ctx.save();

        ctx.translate(
            sx,
            sy
        );

        // ----------------------------------------------------
        // ALIEN KLEUR
        // ----------------------------------------------------

        if (enemy.hitFlash > 0) {

            ctx.fillStyle = "#ffffff";

        } else if (
            enemy.type === "guardian"
        ) {

            ctx.fillStyle = "#7b5cff";

        } else if (
            enemy.type === "crawler"
        ) {

            ctx.fillStyle = "#38c7b5";

        } else {

            ctx.fillStyle = "#66a86b";
        }

        // ----------------------------------------------------
        // ALIEN LICHAAM
        // ----------------------------------------------------

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = "#b8d8cf";

        ctx.lineWidth = 2;

        ctx.stroke();

        // ----------------------------------------------------
        // OGEN
        // ----------------------------------------------------

        const eyeOffset =
            enemy.radius * 0.35;

        ctx.fillStyle = "#dfffee";

        ctx.beginPath();

        ctx.arc(
            -eyeOffset,
            -5,
            5,
            0,
            Math.PI * 2
        );

        ctx.arc(
            eyeOffset,
            -5,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // ----------------------------------------------------
        // GUARDIAN
        // ----------------------------------------------------

        if (
            enemy.type === "guardian"
        ) {

            ctx.strokeStyle =
                "rgba(170,130,255,0.7)";

            ctx.lineWidth = 4;

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                enemy.radius + 8,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }

        // ----------------------------------------------------
        // CRAWLER POTENEN
        // ----------------------------------------------------

        if (
            enemy.type === "crawler"
        ) {

            ctx.strokeStyle = "#38c7b5";

            ctx.lineWidth = 4;

            for (let a = 0; a < 4; a++) {

                const angle =
                    a * Math.PI / 2;

                ctx.beginPath();

                ctx.moveTo(
                    Math.cos(angle) * 12,
                    Math.sin(angle) * 12
                );

                ctx.lineTo(
                    Math.cos(angle) * 35,
                    Math.sin(angle) * 35
                );

                ctx.stroke();
            }
        }

        ctx.restore();

        // ----------------------------------------------------
        // HEALTH BAR
        // ----------------------------------------------------

        const barWidth =
            enemy.radius * 2;

        const healthPercent =
            enemy.health /
            enemy.maxHealth;

        ctx.fillStyle =
            "rgba(0,0,0,0.6)";

        ctx.fillRect(
            sx - barWidth / 2,
            sy - enemy.radius - 13,
            barWidth,
            5
        );

        ctx.fillStyle = "#74d88b";

        ctx.fillRect(
            sx - barWidth / 2,
            sy - enemy.radius - 13,
            barWidth * healthPercent,
            5
        );
    }
}

// ============================================================
// BULLETS TEKENEN
// ============================================================

function drawBullets(camera) {

    for (const bullet of bullets) {

        const sx =
            bullet.x - camera.x;

        const sy =
            bullet.y - camera.y;

        ctx.fillStyle = "#d7f5ff";

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    // Alien projectielen
    for (const bullet of enemyBullets) {

        const sx =
            bullet.x - camera.x;

        const sy =
            bullet.y - camera.y;

        ctx.fillStyle = "#b77cff";

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ============================================================
// PARTICLES TEKENEN
// ============================================================

function drawParticles(camera) {

    for (const p of particles) {

        const sx =
            p.x - camera.x;

        const sy =
            p.y - camera.y;

        ctx.globalAlpha =
            Math.max(0, p.life);

        ctx.fillStyle = "#9bd8ce";

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}

// ============================================================
// HUD
// ============================================================

function updateHUD() {

    const healthBar =
        document.getElementById("healthBar");

    const energyBar =
        document.getElementById("energyBar");

    const ammo =
        document.getElementById("ammo");

    const kills =
        document.getElementById("kills");

    if (healthBar) {

        healthBar.style.width =
            `${Math.max(
                0,
                player.health /
                player.maxHealth *
                100
            )}%`;
    }

    if (energyBar) {

        energyBar.style.width =
            `${Math.max(
                0,
                player.energy /
                player.maxEnergy *
                100
            )}%`;
    }

    if (ammo) {

        const weapon =
            weapons[player.weapon];

        ammo.textContent =
            `${weapon.ammo} / ∞`;
    }

    if (kills) {

        kills.textContent =
            `ALIENS: ${enemies.length}`;
    }
}

// ============================================================
// GAME OVER
// ============================================================

function gameOver() {

    gameRunning = false;

    mouse.down = false;

    keys.clear();

    alert(
        "RUN ENDED\n\n" +
        "Je tank is uitgeschakeld."
    );
}

// ============================================================
// PAUZE
// ============================================================

function togglePause() {

    if (!gameRunning) {
        return;
    }

    paused = !paused;

    const pause =
        document.getElementById("pause");

    if (pause) {

        pause.style.display =
            paused ? "flex" : "none";
    }
}

// ============================================================
// NIEUWE GAME
// ============================================================

function startGame() {

    gameRunning = true;
    paused = false;

    player.x = WORLD_W / 2;
    player.y = WORLD_H / 2;

    player.health =
        player.maxHealth;

    player.energy =
        player.maxEnergy;

    player.reloadTimer = 0;

    player.fireCooldown = 0;

    weapons.forEach((weapon) => {

        weapon.ammo =
            weapon.maxAmmo;
    });

    bullets.length = 0;
    enemyBullets.length = 0;
    particles.length = 0;

    alienSpawnTimer = 0;

    createWorld();

    spawnStartingAliens();

    const menu =
        document.getElementById("menu");

    if (menu) {

        menu.style.display = "none";
    }

    const hud =
        document.getElementById("hud");

    if (hud) {

        hud.style.display = "block";
    }
}

// ============================================================
// BUTTONS
// ============================================================

const newGameButton =
    document.getElementById("newGame");

if (newGameButton) {

    newGameButton.addEventListener(
        "click",
        startGame
    );
}

const resumeButton =
    document.getElementById("resume");

if (resumeButton) {

    resumeButton.addEventListener(
        "click",
        togglePause
    );
}

const quitButton =
    document.getElementById("quit");

if (quitButton) {

    quitButton.addEventListener(
        "click",
        () => {

            gameRunning = false;
            paused = false;

            keys.clear();
            mouse.down = false;

            const pause =
                document.getElementById("pause");

            if (pause) {
                pause.style.display = "none";
            }

            const menu =
                document.getElementById("menu");

            if (menu) {
                menu.style.display = "flex";
            }
        }
    );
}

// ============================================================
// GAME LOOP
// ============================================================

function gameLoop(time) {

    if (!lastTime) {
        lastTime = time;
    }

    let dt =
        (time - lastTime) / 1000;

    lastTime = time;

    // Voorkomt enorme sprongen na lag
    dt = Math.min(dt, 0.05);

    if (gameRunning && !paused) {

        updatePlayer(dt);

        updateEnemies(dt);

        updateBullets(dt);

        updateEnemyBullets(dt);

        updateParticles(dt);

        updateAlienSpawner(dt);

        // Energie langzaam terug
        player.energy =
            Math.min(
                player.maxEnergy,
                player.energy + 12 * dt
            );

        updateHUD();
    }

    const camera =
        getCamera();

    drawWorld(camera);

    drawBullets(camera);

    drawEnemies(camera);

    drawParticles(camera);

    drawPlayer(camera);

    requestAnimationFrame(gameLoop);
}

// ============================================================
// START
// ============================================================

requestAnimationFrame(gameLoop);
