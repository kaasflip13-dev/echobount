// ============================================================
// ECHOBOUND — THE LOST SIGNAL
// COMPLETE APP.JS
// TANK + GEBOUWEN + ALIENS + SPAWN + SCHIETEN
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
// WERELD
// ============================================================

const WORLD_W = 7000;
const WORLD_H = 7000;

let gameRunning = false;
let paused = false;
let lastTime = 0;

const keys = new Set();

const mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

// ============================================================
// INPUT
// ============================================================

window.addEventListener("keydown", e => {

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

    if (e.code === "KeyR") reload();

    if (e.code === "Digit1") player.weapon = 0;
    if (e.code === "Digit2") player.weapon = 1;
    if (e.code === "Digit3") player.weapon = 2;

    if (e.code === "Space") dash();

    if (e.code === "Escape") togglePause();
});

window.addEventListener("keyup", e => {
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

canvas.addEventListener("pointermove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener("pointerdown", e => {

    if (e.button === 0) {
        mouse.down = true;

        if (canvas.setPointerCapture) {
            canvas.setPointerCapture(e.pointerId);
        }
    }
});

window.addEventListener("pointerup", e => {

    if (e.button === 0) {
        mouse.down = false;
    }
});

canvas.addEventListener("contextmenu", e => {
    e.preventDefault();
});

// ============================================================
// HULPFUNCTIES
// ============================================================

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

// ============================================================
// SPELER — ZWARE TANK
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

    weapon: 0
};

// ============================================================
// WAPENS
// ============================================================

const weapons = [

    {
        name: "PULSE",
        damage: 2,
        fireRate: 0.15,
        speed: 1000,
        maxAmmo: 12,
        ammo: 12
    },

    {
        name: "BURST",
        damage: 3,
        fireRate: 0.28,
        speed: 1100,
        maxAmmo: 8,
        ammo: 8
    },

    {
        name: "CANNON",
        damage: 8,
        fireRate: 0.7,
        speed: 750,
        maxAmmo: 4,
        ammo: 4
    }
];

// ============================================================
// OBJECTEN
// ============================================================

const enemies = [];
const bullets = [];
const enemyBullets = [];
const particles = [];
const buildings = [];
const trees = [];
const rocks = [];
const loot = [];

// ============================================================
// ALIEN SETTINGS
// ============================================================

const MAX_ALIENS = 18;
const START_ALIENS = 9;

let alienSpawnTimer = 0;

// ============================================================
// GEBOUWEN
// ============================================================

const buildingPositions = [

    [-2800, -2300],
    [-1900, -2400],
    [-900, -2250],
    [100, -2400],
    [1100, -2300],
    [2100, -2450],

    [-3000, -1300],
    [-2050, -1350],
    [-1050, -1250],
    [0, -1400],
    [1100, -1300],
    [2250, -1400],

    [-2850, -300],
    [-1900, -450],
    [-950, -300],
    [100, -500],
    [1200, -350],
    [2300, -400],

    [-2900, 750],
    [-1900, 850],
    [-850, 700],
    [250, 850],
    [1300, 700],
    [2350, 850],

    [-2700, 1850],
    [-1650, 1950],
    [-550, 1800],
    [600, 1900],
    [1650, 1800],
    [2750, 1900],

    [-2200, 2800],
    [-900, 2700],
    [450, 2850],
    [1600, 2750]
];

function createBuildings() {

    buildings.length = 0;

    for (const position of buildingPositions) {

        buildings.push({

            x: WORLD_W / 2 + position[0],
            y: WORLD_H / 2 + position[1],

            w: random(240, 390),
            h: random(190, 320),

            type: Math.floor(random(0, 3))
        });
    }
}

// ============================================================
// NATUUR
// ============================================================

function createNature() {

    trees.length = 0;
    rocks.length = 0;

    for (let i = 0; i < 260; i++) {

        trees.push({

            x: random(150, WORLD_W - 150),
            y: random(150, WORLD_H - 150),

            radius: random(18, 34)
        });
    }

    for (let i = 0; i < 170; i++) {

        rocks.push({

            x: random(100, WORLD_W - 100),
            y: random(100, WORLD_H - 100),

            radius: random(9, 25)
        });
    }
}

// ============================================================
// ALIEN SPAWN
// ============================================================

function spawnAlien() {

    if (!gameRunning) return;

    if (enemies.length >= MAX_ALIENS) return;

    let x;
    let y;

    let attempts = 0;

    do {

        const angle =
            Math.random() * Math.PI * 2;

        const spawnDistance =
            random(850, 1700);

        x =
            player.x +
            Math.cos(angle) *
            spawnDistance;

        y =
            player.y +
            Math.sin(angle) *
            spawnDistance;

        attempts++;

    } while (

        (
            x < 100 ||
            x > WORLD_W - 100 ||
            y < 100 ||
            y > WORLD_H - 100
        ) &&
        attempts < 40
    );

    x = clamp(x, 100, WORLD_W - 100);
    y = clamp(y, 100, WORLD_H - 100);

    const roll = Math.random();

    let type;
    let health;
    let speed;
    let radius;

    // ELITE
    if (roll < 0.15) {

        type = "guardian";
        health = 18;
        speed = 48;
        radius = 38;

    }

    // SNEL
    else if (roll < 0.45) {

        type = "crawler";
        health = 5;
        speed = 88;
        radius = 25;

    }

    // NORMAAL
    else {

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

        hitFlash: 0
    });
}

// ============================================================
// STARTALIENS
// ============================================================

function spawnStartingAliens() {

    enemies.length = 0;

    for (let i = 0; i < START_ALIENS; i++) {

        spawnAlien();
    }
}

// ============================================================
// AUTOMATISCHE SPAWN
// ============================================================

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
// SPELER
// ============================================================

function updatePlayer(dt) {

    if (player.fireCooldown > 0) {
        player.fireCooldown -= dt;
    }

    if (player.reloadTimer > 0) {
        player.reloadTimer -= dt;
    }

    if (player.dashCooldown > 0) {
        player.dashCooldown -= dt;
    }

    if (player.invincible > 0) {
        player.invincible -= dt;
    }

    let dx = 0;
    let dy = 0;

    if (keys.has("KeyW")) dy--;
    if (keys.has("KeyS")) dy++;
    if (keys.has("KeyA")) dx--;
    if (keys.has("KeyD")) dx++;

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

        const newX =
            player.x + dx * speed * dt;

        const newY =
            player.y + dy * speed * dt;

        if (!collidesWithBuilding(
            newX,
            player.y,
            player.radius
        )) {
            player.x = newX;
        }

        if (!collidesWithBuilding(
            player.x,
            newY,
            player.radius
        )) {
            player.y = newY;
        }
    }

    player.x =
        clamp(
            player.x,
            50,
            WORLD_W - 50
        );

    player.y =
        clamp(
            player.y,
            50,
            WORLD_H - 50
        );

    player.turretAngle =
        Math.atan2(
            mouse.y - H / 2,
            mouse.x - W / 2
        );

    // Schieten terwijl je beweegt
    if (
        mouse.down &&
        player.reloadTimer <= 0
    ) {
        shoot();
    }

    // Energie herstellen
    player.energy =
        Math.min(
            player.maxEnergy,
            player.energy + 10 * dt
        );
}

// ============================================================
// GEBOUW COLLISION
// ============================================================

function collidesWithBuilding(x, y, radius) {

    for (const building of buildings) {

        const closestX =
            clamp(
                x,
                building.x,
                building.x + building.w
            );

        const closestY =
            clamp(
                y,
                building.y,
                building.y + building.h
            );

        const dx =
            x - closestX;

        const dy =
            y - closestY;

        if (
            dx * dx +
            dy * dy <
            radius * radius
        ) {
            return true;
        }
    }

    return false;
}

// ============================================================
// DASH
// ============================================================

function dash() {

    if (!gameRunning || paused) return;

    if (player.dashCooldown > 0) return;

    if (player.energy < 25) return;

    let dx = 0;
    let dy = 0;

    if (keys.has("KeyW")) dy--;
    if (keys.has("KeyS")) dy++;
    if (keys.has("KeyA")) dx--;
    if (keys.has("KeyD")) dx++;

    const length = Math.hypot(dx, dy);

    if (length === 0) return;

    dx /= length;
    dy /= length;

    const distance = 300;

    const newX =
        player.x + dx * distance;

    const newY =
        player.y + dy * distance;

    if (!collidesWithBuilding(
        newX,
        newY,
        player.radius
    )) {

        player.x =
            clamp(
                newX,
                50,
                WORLD_W - 50
            );

        player.y =
            clamp(
                newY,
                50,
                WORLD_H - 50
            );
    }

    player.energy -= 25;

    player.dashCooldown = 1;

    createParticles(
        player.x,
        player.y,
        20
    );
}

// ============================================================
// SCHIETEN
// ============================================================

function shoot() {

    const weapon =
        weapons[player.weapon];

    if (player.fireCooldown > 0) {
        return;
    }

    if (weapon.ammo <= 0) {

        reload();

        return;
    }

    weapon.ammo--;

    player.fireCooldown =
        weapon.fireRate;

    const angle =
        player.turretAngle;

    const startX =
        player.x +
        Math.cos(angle) *
        55;

    const startY =
        player.y +
        Math.sin(angle) *
        55;

    bullets.push({

        x: startX,
        y: startY,

        vx:
            Math.cos(angle) *
            weapon.speed,

        vy:
            Math.sin(angle) *
            weapon.speed,

        damage:
            weapon.damage,

        radius:
            weapon.name === "CANNON"
                ? 9
                : 5,

        life: 1.5
    });

    createParticles(
        startX,
        startY,
        5
    );
}

// ============================================================
// RELOAD
// ============================================================

function reload() {

    const weapon =
        weapons[player.weapon];

    if (player.reloadTimer > 0) return;

    if (weapon.ammo >= weapon.maxAmmo) return;

    player.reloadTimer = 1;

    setTimeout(() => {

        weapon.ammo =
            weapon.maxAmmo;

    }, 1000);
}

// ============================================================
// ALIENS UPDATEN
// ============================================================

function updateEnemies(dt) {

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const alien = enemies[i];

        alien.animation += dt * 4;

        alien.attackCooldown -= dt;
        alien.shootCooldown -= dt;

        if (alien.hitFlash > 0) {
            alien.hitFlash -= dt;
        }

        const dx =
            player.x - alien.x;

        const dy =
            player.y - alien.y;

        const dist =
            Math.hypot(dx, dy);

        if (dist > 0) {

            const nx =
                dx / dist;

            const ny =
                dy / dist;

            // Aliens lopen naar speler
            if (dist > 90) {

                const nextX =
                    alien.x +
                    nx *
                    alien.speed *
                    dt;

                const nextY =
                    alien.y +
                    ny *
                    alien.speed *
                    dt;

                if (
                    !collidesWithBuilding(
                        nextX,
                        nextY,
                        alien.radius
                    )
                ) {

                    alien.x = nextX;
                    alien.y = nextY;

                } else {

                    // Alien probeert om gebouw heen
                    alien.x +=
                        -ny *
                        alien.speed *
                        dt;

                    alien.y +=
                        nx *
                        alien.speed *
                        dt;
                }
            }

            // Contact attack
            if (
                dist < 90 &&
                alien.attackCooldown <= 0
            ) {

                damagePlayer(
                    alien.type === "guardian"
                        ? 12
                        : 7
                );

                alien.attackCooldown = 1;
            }

            // Guardian schiet
            if (
                alien.type === "guardian" &&
                dist < 850 &&
                alien.shootCooldown <= 0
            ) {

                enemyShoot(alien);

                alien.shootCooldown = 2.2;
            }
        }
    }
}

// ============================================================
// ALIEN PROJECTIEL
// ============================================================

function enemyShoot(alien) {

    const angle =
        Math.atan2(
            player.y - alien.y,
            player.x - alien.x
        );

    enemyBullets.push({

        x: alien.x,
        y: alien.y,

        vx:
            Math.cos(angle) *
            360,

        vy:
            Math.sin(angle) *
            360,

        radius: 7,

        damage: 8,

        life: 3
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
        10
    );

    if (player.health <= 0) {

        player.health = 0;

        gameOver();
    }
}

// ============================================================
// BULLETS
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

        // Gebouw geraakt
        if (
            collidesWithBuilding(
                bullet.x,
                bullet.y,
                bullet.radius
            )
        ) {

            createParticles(
                bullet.x,
                bullet.y,
                5
            );

            remove = true;
        }

        // Alien geraakt
        if (!remove) {

            for (
                let j = enemies.length - 1;
                j >= 0;
                j--
            ) {

                const alien =
                    enemies[j];

                const d =
                    Math.hypot(
                        bullet.x -
                            alien.x,

                        bullet.y -
                            alien.y
                    );

                if (
                    d <
                    bullet.radius +
                    alien.radius
                ) {

                    alien.health -=
                        bullet.damage;

                    alien.hitFlash =
                        0.12;

                    createParticles(
                        alien.x,
                        alien.y,
                        7
                    );

                    remove = true;

                    if (
                        alien.health <= 0
                    ) {

                        destroyAlien(j);
                    }

                    break;
                }
            }
        }

        if (
            bullet.life <= 0 ||
            bullet.x < 0 ||
            bullet.x > WORLD_W ||
            bullet.y < 0 ||
            bullet.y > WORLD_H
        ) {

            remove = true;
        }

        if (remove) {

            bullets.splice(i, 1);
        }
    }
}

// ============================================================
// ALIEN VERNIETIGEN
// ============================================================

function destroyAlien(index) {

    const alien =
        enemies[index];

    createParticles(
        alien.x,
        alien.y,
        25
    );

    enemies.splice(index, 1);

    // Nieuwe alien wordt automatisch
    // door de spawn-functie gemaakt.
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

        const d =
            Math.hypot(
                bullet.x -
                    player.x,

                bullet.y -
                    player.y
            );

        if (
            d <
            bullet.radius +
            player.radius
        ) {

            damagePlayer(
                bullet.damage
            );

            enemyBullets.splice(
                i,
                1
            );

            continue;
        }

        if (
            bullet.life <= 0 ||
            bullet.x < 0 ||
            bullet.x > WORLD_W ||
            bullet.y < 0 ||
            bullet.y > WORLD_H
        ) {

            enemyBullets.splice(
                i,
                1
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
            Math.random() *
            Math.PI *
            2;

        const speed =
            random(40, 180);

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
                random(0.3, 0.8),

            size:
                random(2, 7)
        });
    }
}

function updateParticles(dt) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            particles[i];

        p.x +=
            p.vx * dt;

        p.y +=
            p.vy * dt;

        p.vx *= 0.95;
        p.vy *= 0.95;

        p.life -= dt;

        if (p.life <= 0) {

            particles.splice(
                i,
                1
            );
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
// WERELD TEKENEN
// ============================================================

function drawWorld(camera) {

    // Achtergrond
    ctx.fillStyle = "#101719";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    // Grond
    ctx.fillStyle = "#182124";

    ctx.fillRect(
        -camera.x,
        -camera.y,
        WORLD_W,
        WORLD_H
    );

    // Raster
    ctx.strokeStyle =
        "rgba(120,150,150,0.08)";

    ctx.lineWidth = 1;

    const grid = 100;

    const startX =
        Math.floor(
            camera.x / grid
        ) * grid;

    const startY =
        Math.floor(
            camera.y / grid
        ) * grid;

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

    // Bomen
    for (const tree of trees) {

        const sx =
            tree.x -
            camera.x;

        const sy =
            tree.y -
            camera.y;

        if (
            sx < -50 ||
            sx > W + 50 ||
            sy < -50 ||
            sy > H + 50
        ) continue;

        ctx.fillStyle = "#263d32";

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            tree.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle =
            "#48614f";

        ctx.lineWidth = 2;

        ctx.stroke();

        // Stam
        ctx.fillStyle = "#4a4032";

        ctx.fillRect(
            sx - 4,
            sy + 12,
            8,
            15
        );
    }

    // Rotsen
    for (const rock of rocks) {

        const sx =
            rock.x -
            camera.x;

        const sy =
            rock.y -
            camera.y;

        if (
            sx < -40 ||
            sx > W + 40 ||
            sy < -40 ||
            sy > H + 40
        ) continue;

        ctx.fillStyle = "#4b5659";

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            rock.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle =
            "#697579";

        ctx.stroke();
    }

    // Gebouwen
    for (const building of buildings) {

        const sx =
            building.x -
            camera.x;

        const sy =
            building.y -
            camera.y;

        if (
            sx < -500 ||
            sx > W + 500 ||
            sy < -500 ||
            sy > H + 500
        ) continue;

        // Schaduw
        ctx.fillStyle =
            "rgba(0,0,0,0.35)";

        ctx.fillRect(
            sx + 12,
            sy + 14,
            building.w,
            building.h
        );

        // Gebouw
        ctx.fillStyle =
            building.type === 0
                ? "#303c40"
                : building.type === 1
                    ? "#39454a"
                    : "#273337";

        ctx.fillRect(
            sx,
            sy,
            building.w,
            building.h
        );

        // Rand
        ctx.strokeStyle =
            "#718085";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            sx,
            sy,
            building.w,
            building.h
        );

        // Dak
        ctx.fillStyle =
            "#202a2d";

        ctx.fillRect(
            sx + 12,
            sy + 12,
            building.w - 24,
            30
        );

        // Ramen
        for (
            let wx = sx + 25;
            wx < sx + building.w - 25;
            wx += 45
        ) {

            for (
                let wy = sy + 65;
                wy < sy + building.h - 25;
                wy += 45
            ) {

                ctx.fillStyle =
                    "rgba(150,210,215,0.35)";

                ctx.fillRect(
                    wx,
                    wy,
                    20,
                    13
                );
            }
        }

        // Deur
        ctx.fillStyle =
            "#171f22";

        ctx.fillRect(
            sx +
                building.w / 2 -
                14,

            sy +
                building.h -
                48,

            28,
            48
        );
    }
}

// ============================================================
// MOOIE TANK TEKENEN
// ============================================================

function drawPlayer() {

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

    // --------------------------------------------------------
    // RIJDERSPOREN
    // --------------------------------------------------------

    ctx.fillStyle = "#171c1e";

    ctx.roundRect(
        -48,
        -37,
        96,
        15,
        7
    );

    ctx.fill();

    ctx.roundRect(
        -48,
        22,
        96,
        15,
        7
    );

    ctx.fill();

    // --------------------------------------------------------
    // TANK LICHAAM
    // --------------------------------------------------------

    ctx.fillStyle = "#53666b";

    ctx.beginPath();

    ctx.roundRect(
        -45,
        -30,
        90,
        60,
        13
    );

    ctx.fill();

    ctx.strokeStyle =
        "#a5b5b8";

    ctx.lineWidth = 3;

    ctx.stroke();

    // --------------------------------------------------------
    // PANTSERPLATEN
    // --------------------------------------------------------

    ctx.fillStyle =
        "#354448";

    ctx.beginPath();

    ctx.roundRect(
        -34,
        -22,
        68,
        44,
        9
    );

    ctx.fill();

    ctx.strokeStyle =
        "#61757a";

    ctx.stroke();

    // --------------------------------------------------------
    // KOEPEL
    // --------------------------------------------------------

    ctx.fillStyle =
        "#71858a";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        25,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
        "#b3c2c5";

    ctx.lineWidth = 3;

    ctx.stroke();

    // --------------------------------------------------------
    // KANON
    // --------------------------------------------------------

    ctx.fillStyle =
        "#aebdc0";

    ctx.fillRect(
        15,
        -8,
        65,
        16
    );

    ctx.fillStyle =
        "#354448";

    ctx.fillRect(
        65,
        -10,
        15,
        20
    );

    // --------------------------------------------------------
    // ANTENNE
    // --------------------------------------------------------

    ctx.strokeStyle =
        "#91a4a8";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.moveTo(
        -12,
        -20
    );

    ctx.lineTo(
        -24,
        -48
    );

    ctx.stroke();

    ctx.fillStyle =
        "#9cc9c3";

    ctx.beginPath();

    ctx.arc(
        -24,
        -48,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // --------------------------------------------------------
    // LICHT
    // --------------------------------------------------------

    ctx.fillStyle =
        "#b8e8df";

    ctx.beginPath();

    ctx.arc(
        -30,
        -15,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

// ============================================================
// MOOIE ALIENS
// ============================================================

function drawEnemies(camera) {

    for (const alien of enemies) {

        const sx =
            alien.x -
            camera.x;

        const sy =
            alien.y -
            camera.y;

        if (
            sx < -100 ||
            sx > W + 100 ||
            sy < -100 ||
            sy > H + 100
        ) continue;

        const bob =
            Math.sin(
                alien.animation
            ) * 3;

        ctx.save();

        ctx.translate(
            sx,
            sy + bob
        );

        // ====================================================
        // GUARDIAN
        // ====================================================

        if (
            alien.type === "guardian"
        ) {

            // Energieveld
            ctx.strokeStyle =
                "rgba(143,103,255,0.35)";

            ctx.lineWidth = 5;

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                alien.radius + 12,
                0,
                Math.PI * 2
            );

            ctx.stroke();

            // Groot lichaam
            ctx.fillStyle =
                alien.hitFlash > 0
                    ? "#ffffff"
                    : "#765bd1";

            ctx.beginPath();

            ctx.ellipse(
                0,
                0,
                37,
                31,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.strokeStyle =
                "#c9b9ff";

            ctx.lineWidth = 3;

            ctx.stroke();

            // Hoofd
            ctx.fillStyle =
                "#a18be8";

            ctx.beginPath();

            ctx.arc(
                0,
                -10,
                23,
                0,
                Math.PI * 2
            );

            ctx.fill();

            // Ogen
            drawAlienEyes(
                23
            );
        }

        // ====================================================
        // CRAWLER
        // ====================================================

        else if (
            alien.type === "crawler"
        ) {

            ctx.fillStyle =
                alien.hitFlash > 0
                    ? "#ffffff"
                    : "#37bcae";

            ctx.beginPath();

            ctx.ellipse(
                0,
                0,
                27,
                22,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.strokeStyle =
                "#8ff1e5";

            ctx.lineWidth = 2;

            ctx.stroke();

            // Poten
            ctx.strokeStyle =
                "#37bcae";

            ctx.lineWidth = 5;

            for (
                let i = 0;
                i < 6;
                i++
            ) {

                const a =
                    i *
                    Math.PI /
                    3;

                ctx.beginPath();

                ctx.moveTo(
                    Math.cos(a) * 13,
                    Math.sin(a) * 10
                );

                ctx.lineTo(
                    Math.cos(a) * 40,
                    Math.sin(a) * 32
                );

                ctx.stroke();
            }

            drawAlienEyes(
                20
            );
        }

        // ====================================================
        // STALKER
        // ====================================================

        else {

            ctx.fillStyle =
                alien.hitFlash > 0
                    ? "#ffffff"
                    : "#58a967";

            ctx.beginPath();

            ctx.ellipse(
                0,
                0,
                31,
                27,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.strokeStyle =
                "#a4e3ae";

            ctx.lineWidth = 3;

            ctx.stroke();

            // Schouders
            ctx.fillStyle =
                "#407f4d";

            ctx.beginPath();

            ctx.arc(
                -23,
                12,
                10,
                0,
                Math.PI * 2
            );

            ctx.arc(
                23,
                12,
                10,
                0,
                Math.PI * 2
            );

            ctx.fill();

            drawAlienEyes(
                25
            );
        }

        ctx.restore();

        // ====================================================
        // HEALTH BAR
        // ====================================================

        const barWidth =
            alien.radius * 2.2;

        const health =
            alien.health /
            alien.maxHealth;

        ctx.fillStyle =
            "rgba(0,0,0,0.7)";

        ctx.fillRect(
            sx -
                barWidth / 2,

            sy -
                alien.radius -
                18,

            barWidth,
            6
        );

        ctx.fillStyle =
            "#71df91";

        ctx.fillRect(
            sx -
                barWidth / 2,

            sy -
                alien.radius -
                18,

            barWidth *
                Math.max(
                    0,
                    health
                ),

            6
        );
    }
}

// ============================================================
// ALIEN OGEN
// ============================================================

function drawAlienEyes(size) {

    const eyeY =
        -size * 0.25;

    ctx.fillStyle =
        "#eafff4";

    ctx.beginPath();

    ctx.ellipse(
        -size * 0.38,
        eyeY,
        size * 0.17,
        size * 0.25,
        -0.2,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        size * 0.38,
        eyeY,
        size * 0.17,
        size * 0.25,
        0.2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#17211d";

    ctx.beginPath();

    ctx.arc(
        -size * 0.38,
        eyeY,
        size * 0.07,
        0,
        Math.PI * 2
    );

    ctx.arc(
        size * 0.38,
        eyeY,
        size * 0.07,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

// ============================================================
// BULLETS TEKENEN
// ============================================================

function drawBullets(camera) {

    for (const bullet of bullets) {

        const sx =
            bullet.x -
            camera.x;

        const sy =
            bullet.y -
            camera.y;

        ctx.fillStyle =
            "#dffaff";

        ctx.shadowBlur = 12;
        ctx.shadowColor =
            "#8eeaff";

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;
    }

    for (
        const bullet of enemyBullets
    ) {

        const sx =
            bullet.x -
            camera.x;

        const sy =
            bullet.y -
            camera.y;

        ctx.fillStyle =
            "#b57cff";

        ctx.shadowBlur = 12;
        ctx.shadowColor =
            "#9b65ff";

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

// ============================================================
// PARTICLES TEKENEN
// ============================================================

function drawParticles(camera) {

    for (const p of particles) {

        const sx =
            p.x -
            camera.x;

        const sy =
            p.y -
            camera.y;

        ctx.globalAlpha =
            Math.max(
                0,
                p.life
            );

        ctx.fillStyle =
            "#9de5d8";

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

    const weaponName =
        document.querySelector(
            ".weaponName"
        );

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

    if (weaponName) {

        weaponName.textContent =
            weapons[
                player.weapon
            ].name;
    }

    if (kills) {

        kills.textContent =
            `ALIENS: ${enemies.length}`;
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

    keys.clear();

    mouse.down = false;

    const pause =
        document.getElementById(
            "pause"
        );

    if (pause) {
        pause.style.display = "none";
    }

    setTimeout(() => {

        alert(
            "ECHOBOUND\n\n" +
            "Je tank is uitgeschakeld."
        );

        const menu =
            document.getElementById(
                "menu"
            );

        if (menu) {
            menu.style.display = "flex";
        }

    }, 100);
}

// ============================================================
// NIEUWE RUN
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

    bullets.length = 0;
    enemyBullets.length = 0;
    particles.length = 0;
    enemies.length = 0;

    weapons.forEach(
        weapon => {
            weapon.ammo =
                weapon.maxAmmo;
        }
    );

    createBuildings();
    createNature();

    alienSpawnTimer = 0;

    spawnStartingAliens();

    const menu =
        document.getElementById(
            "menu"
        );

    if (menu) {
        menu.style.display = "none";
    }

    const hud =
        document.getElementById(
            "hud"
        );

    if (hud) {
        hud.style.display = "block";
    }
}

// ============================================================
// BUTTONS
// ============================================================

const newGame =
    document.getElementById(
        "newGame"
    );

if (newGame) {

    newGame.addEventListener(
        "click",
        startGame
    );
}

const resume =
    document.getElementById(
        "resume"
    );

if (resume) {

    resume.addEventListener(
        "click",
        togglePause
    );
}

const quit =
    document.getElementById(
        "quit"
    );

if (quit) {

    quit.addEventListener(
        "click",
        () => {

            gameRunning = false;
            paused = false;

            keys.clear();
            mouse.down = false;

            const pause =
                document.getElementById(
                    "pause"
                );

            if (pause) {
                pause.style.display =
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

    dt = Math.min(
        dt,
        0.05
    );

    if (
        gameRunning &&
        !paused
    ) {

        updatePlayer(dt);

        updateEnemies(dt);

        updateBullets(dt);

        updateEnemyBullets(dt);

        updateParticles(dt);

        updateAlienSpawner(dt);

        updateHUD();
    }

    const camera =
        getCamera();

    drawWorld(camera);

    drawBullets(camera);

    drawEnemies(camera);

    drawParticles(camera);

    drawPlayer();

    requestAnimationFrame(
        gameLoop
    );
}

// ============================================================
// START LOOP
// ============================================================

requestAnimationFrame(
    gameLoop
);
