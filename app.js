// ============================================================
// ECHOBOUND — THE LOST SIGNAL
// Complete 2D game
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas.getContext("2d");

// ============================================================
// WORLD
// ============================================================

const WORLD_W = 7000;
const WORLD_H = 7000;

const MAX_ENEMIES = 5;

let camera = {
    x: 0,
    y: 0
};

let gameRunning = false;
let paused = false;

let score = 0;
let kills = 0;
let credits = 0;
let xp = 0;
let level = 1;

let missionProgress = 0;
const missionTarget = 25;

let weather = "clear";
let timeOfDay = 0.25;

let reloadTimer = 0;

// ============================================================
// PLAYER
// ============================================================

const player = {
    x: 0,
    y: 0,

    radius: 17,

    speed: 230,

    angle: 0,

    health: 100,
    maxHealth: 100,

    energy: 100,
    maxEnergy: 100,

    dashCooldown: 0,
    invincible: 0,

    weapon: 0
};

// ============================================================
// WEAPONS
// ============================================================

const weapons = [
    {
        name: "PULSE",
        damage: 1,
        fireRate: 0.18,
        speed: 850,
        ammo: 12,
        maxAmmo: 12
    },

    {
        name: "BURST",
        damage: 1,
        fireRate: 0.32,
        speed: 900,
        ammo: 8,
        maxAmmo: 8
    },

    {
        name: "CANNON",
        damage: 3,
        fireRate: 0.65,
        speed: 650,
        ammo: 4,
        maxAmmo: 4
    }
];

let fireCooldown = 0;

// ============================================================
// OBJECTS
// ============================================================

const bullets = [];
const enemyBullets = [];

const enemies = [];
const buildings = [];
const doors = [];
const trees = [];
const rocks = [];
const loot = [];
const npcs = [];
const particles = [];

// ============================================================
// INPUT
// ============================================================

const keys = {};

let mouse = {
    x: 0,
    y: 0,
    down: false
};

window.addEventListener("keydown", e => {

    keys[e.key.toLowerCase()] = true;

    if (e.key === " ") {
        dash();
        e.preventDefault();
    }

    if (e.key.toLowerCase() === "r") {
        reload();
    }

    if (e.key === "Escape") {
        togglePause();
    }

    if (e.key >= "1" && e.key <= "3") {
        player.weapon = Number(e.key) - 1;
        updateHUD();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", e => {

    const rect = canvas.getBoundingClientRect();

    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;

    const worldX =
        mouse.x - canvas.width / 2 + camera.x;

    const worldY =
        mouse.y - canvas.height / 2 + camera.y;

    player.angle =
        Math.atan2(
            worldY - player.y,
            worldX - player.x
        );
});

canvas.addEventListener("mousedown", e => {

    if (e.button === 0) {
        mouse.down = true;
    }
});

window.addEventListener("mouseup", e => {

    if (e.button === 0) {
        mouse.down = false;
    }
});

// ============================================================
// UTILITIES
// ============================================================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function dist(x1, y1, x2, y2) {

    return Math.hypot(
        x2 - x1,
        y2 - y1
    );
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function circleRectCollision(cx, cy, radius, r) {

    const closestX =
        clamp(cx, r.x, r.x + r.w);

    const closestY =
        clamp(cy, r.y, r.y + r.h);

    const dx = cx - closestX;
    const dy = cy - closestY;

    return (
        dx * dx +
        dy * dy <
        radius * radius
    );
}

// ============================================================
// WALL / BUILDING COLLISION
// ============================================================

function blocked(x, y, radius = player.radius) {

    const limitX =
        WORLD_W / 2 - radius;

    const limitY =
        WORLD_H / 2 - radius;

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

        if (!door.open) {

            if (
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
    }

    return false;
}

// ============================================================
// LINE OF SIGHT
// ============================================================
// TRUE  = vijand kan speler zien
// FALSE = muur/gebouw blokkeert zicht
// ============================================================

function hasLineOfSight(x1, y1, x2, y2) {

    const dx = x2 - x1;
    const dy = y2 - y1;

    const distance =
        Math.hypot(dx, dy);

    // Meer controlepunten bij grotere afstand
    const steps = Math.max(
        20,
        Math.ceil(distance / 12)
    );

    for (let i = 1; i < steps; i++) {

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
// RANDOM WORLD POSITION
// ============================================================

function randomWorldPosition() {

    return {
        x: random(
            -WORLD_W / 2 + 100,
            WORLD_W / 2 - 100
        ),

        y: random(
            -WORLD_H / 2 + 100,
            WORLD_H / 2 - 100
        )
    };
}

// ============================================================
// WORLD GENERATION
// ============================================================

function generateWorld() {

    buildings.length = 0;
    doors.length = 0;
    trees.length = 0;
    rocks.length = 0;
    loot.length = 0;
    npcs.length = 0;

    // --------------------------------------------------------
    // BUILDINGS
    // --------------------------------------------------------

    for (let i = 0; i < 42; i++) {

        let position;
        let valid = false;

        let attempts = 0;

        while (!valid && attempts < 100) {

            attempts++;

            position =
                randomWorldPosition();

            const building = {

                x: position.x,
                y: position.y,

                w: random(180, 360),
                h: random(150, 300),

                type:
                    Math.random() > 0.7
                        ? "large"
                        : "normal"
            };

            valid = true;

            for (const other of buildings) {

                if (
                    building.x <
                        other.x + other.w + 100 &&
                    building.x +
                        building.w + 100 >
                        other.x &&
                    building.y <
                        other.y + other.h + 100 &&
                    building.y +
                        building.h + 100 >
                        other.y
                ) {
                    valid = false;
                    break;
                }
            }

            if (valid) {

                buildings.push(
                    building
                );

                doors.push({

                    x:
                        building.x +
                        building.w / 2 -
                        20,

                    y:
                        building.y +
                        building.h -
                        8,

                    w: 40,
                    h: 16,

                    open: false,

                    building
                });
            }
        }
    }

    // --------------------------------------------------------
    // TREES
    // --------------------------------------------------------

    for (let i = 0; i < 850; i++) {

        const p =
            randomWorldPosition();

        if (!blocked(p.x, p.y, 18)) {

            trees.push({

                x: p.x,
                y: p.y,

                radius: random(14, 27),

                phase:
                    Math.random() *
                    Math.PI *
                    2
            });
        }
    }

    // --------------------------------------------------------
    // ROCKS
    // --------------------------------------------------------

    for (let i = 0; i < 350; i++) {

        const p =
            randomWorldPosition();

        if (!blocked(p.x, p.y, 15)) {

            rocks.push({

                x: p.x,
                y: p.y,

                radius: random(8, 22)
            });
        }
    }

    // --------------------------------------------------------
    // LOOT
    // --------------------------------------------------------

    for (let i = 0; i < 80; i++) {

        const p =
            randomWorldPosition();

        loot.push({

            x: p.x,
            y: p.y,

            collected: false,

            type:
                Math.random() > 0.5
                    ? "credits"
                    : "energy"
        });
    }

    // --------------------------------------------------------
    // NPCS
    // --------------------------------------------------------

    for (let i = 0; i < 18; i++) {

        const p =
            randomWorldPosition();

        npcs.push({

            x: p.x,
            y: p.y,

            radius: 12,

            angle:
                Math.random() *
                Math.PI * 2,

            speed: random(10, 25),

            changeTimer:
                random(1, 4)
        });
    }
}

// ============================================================
// RESET GAME
// ============================================================

function resetGame() {

    player.x = 0;
    player.y = 0;

    player.health =
        player.maxHealth;

    player.energy =
        player.maxEnergy;

    player.weapon = 0;

    score = 0;
    kills = 0;
    credits = 0;

    xp = 0;
    level = 1;

    missionProgress = 0;

    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    particles.length = 0;

    fireCooldown = 0;
    reloadTimer = 0;

    generateWorld();

    for (let i = 0; i < 4; i++) {
        spawnEnemy();
    }

    gameRunning = true;
    paused = false;

    hideElement("menu");
    hideElement("pause");

    showElement("hud");

    updateHUD();
}

// ============================================================
// ENEMIES
// ============================================================

function spawnEnemy() {

    if (enemies.length >= MAX_ENEMIES) {
        return;
    }

    let p;
    let attempts = 0;

    do {

        p = randomWorldPosition();

        attempts++;

    } while (
        (
            dist(
                p.x,
                p.y,
                player.x,
                player.y
            ) < 700 ||
            blocked(
                p.x,
                p.y,
                20
            )
        ) &&
        attempts < 100
    );

    const elite =
        Math.random() < 0.15;

    enemies.push({

        x: p.x,
        y: p.y,

        radius:
            elite ? 24 : 19,

        speed:
            elite ? 75 : 48,

        health:
            elite ? 5 : 2,

        maxHealth:
            elite ? 5 : 2,

        elite,

        shootCooldown:
            random(1, 3),

        angle: 0
    });
}

// ============================================================
// ENEMY UPDATE
// ============================================================

function updateEnemies(dt) {

    while (
        enemies.length <
        Math.min(
            MAX_ENEMIES,
            3 + Math.floor(level / 2)
        )
    ) {
        spawnEnemy();
    }

    for (const enemy of enemies) {

        const dx =
            player.x - enemy.x;

        const dy =
            player.y - enemy.y;

        const distance =
            Math.hypot(dx, dy);

        if (distance > 0) {

            enemy.angle =
                Math.atan2(dy, dx);
        }

        // ----------------------------------------------------
        // MOVEMENT
        // ----------------------------------------------------

        if (distance > 260) {

            const moveX =
                Math.cos(enemy.angle) *
                enemy.speed *
                dt;

            const moveY =
                Math.sin(enemy.angle) *
                enemy.speed *
                dt;

            const nx =
                enemy.x + moveX;

            const ny =
                enemy.y + moveY;

            if (
                !blocked(
                    nx,
                    enemy.y,
                    enemy.radius
                )
            ) {
                enemy.x = nx;
            }

            if (
                !blocked(
                    enemy.x,
                    ny,
                    enemy.radius
                )
            ) {
                enemy.y = ny;
            }
        }

        // ----------------------------------------------------
        // SHOOTING
        // ----------------------------------------------------

        enemy.shootCooldown -= dt;

        if (
            enemy.shootCooldown <= 0 &&
            distance < 1000
        ) {

            // BELANGRIJK:
            // De vijand mag alleen schieten als hij
            // daadwerkelijk zicht heeft op de speler.
            if (
                hasLineOfSight(
                    enemy.x,
                    enemy.y,
                    player.x,
                    player.y
                )
            ) {

                shootEnemy(enemy);
            }

            // Ook als er een muur tussen zit,
            // wordt de cooldown opnieuw ingesteld.
            enemy.shootCooldown =
                random(1.2, 2.8);

            if (enemy.elite) {

                enemy.shootCooldown *= 0.7;
            }
        }
    }
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
            : 280;

    enemyBullets.push({

        x: enemy.x,
        y: enemy.y,

        vx:
            Math.cos(angle) *
            speed,

        vy:
            Math.sin(angle) *
            speed,

        life: 4,

        damage:
            enemy.elite
                ? 14
                : 8,

        radius:
            enemy.elite
                ? 6
                : 4
    });
}

// ============================================================
// PLAYER MOVEMENT
// ============================================================

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;

    if (keys["w"]) dy--;
    if (keys["s"]) dy++;
    if (keys["a"]) dx--;
    if (keys["d"]) dx++;

    if (dx !== 0 || dy !== 0) {

        const length =
            Math.hypot(dx, dy);

        dx /= length;
        dy /= length;

        let speed =
            player.speed;

        if (
            keys["shift"] &&
            player.energy > 0
        ) {

            speed *= 1.65;

            player.energy -=
                25 * dt;
        } else {

            player.energy +=
                12 * dt;
        }

        const nx =
            player.x +
            dx * speed * dt;

        const ny =
            player.y +
            dy * speed * dt;

        if (
            !blocked(
                nx,
                player.y,
                player.radius
            )
        ) {
            player.x = nx;
        }

        if (
            !blocked(
                player.x,
                ny,
                player.radius
            )
        ) {
            player.y = ny;
        }

    } else {

        player.energy +=
            18 * dt;
    }

    player.energy =
        clamp(
            player.energy,
            0,
            player.maxEnergy
        );

    if (player.invincible > 0) {
        player.invincible -= dt;
    }

    if (player.dashCooldown > 0) {
        player.dashCooldown -= dt;
    }
}

// ============================================================
// DASH
// ============================================================

function dash() {

    if (
        !gameRunning ||
        paused ||
        player.dashCooldown > 0 ||
        player.energy < 30
    ) {
        return;
    }

    let dx = 0;
    let dy = 0;

    if (keys["w"]) dy--;
    if (keys["s"]) dy++;
    if (keys["a"]) dx--;
    if (keys["d"]) dx++;

    if (dx === 0 && dy === 0) {

        dx =
            Math.cos(
                player.angle
            );

        dy =
            Math.sin(
                player.angle
            );
    }

    const length =
        Math.hypot(dx, dy);

    dx /= length;
    dy /= length;

    const distance = 170;

    const steps = 20;

    for (let i = 0; i < steps; i++) {

        const nx =
            player.x +
            dx *
            distance *
            ((i + 1) / steps);

        const ny =
            player.y +
            dy *
            distance *
            ((i + 1) / steps);

        if (
            blocked(
                nx,
                ny,
                player.radius
            )
        ) {
            break;
        }

        player.x = nx;
        player.y = ny;
    }

    player.energy -= 30;

    player.dashCooldown = 1.2;

    player.invincible = 0.25;

    createParticles(
        player.x,
        player.y,
        20
    );
}

// ============================================================
// SHOOT PLAYER
// ============================================================

function shoot() {

    if (
        !gameRunning ||
        paused ||
        reloadTimer > 0 ||
        fireCooldown > 0
    ) {
        return;
    }

    const weapon =
        weapons[player.weapon];

    if (weapon.ammo <= 0) {

        reload();

        return;
    }

    weapon.ammo--;

    fireCooldown =
        weapon.fireRate;

    const spread =
        player.weapon === 1
            ? random(-0.12, 0.12)
            : 0;

    const angle =
        player.angle +
        spread;

    bullets.push({

        x:
            player.x +
            Math.cos(angle) *
            24,

        y:
            player.y +
            Math.sin(angle) *
            24,

        vx:
            Math.cos(angle) *
            weapon.speed,

        vy:
            Math.sin(angle) *
            weapon.speed,

        damage:
            weapon.damage,

        life: 1.5
    });

    createParticles(
        player.x +
            Math.cos(angle) * 24,

        player.y +
            Math.sin(angle) * 24,

        3
    );
}

// ============================================================
// RELOAD
// ============================================================

function reload() {

    const weapon =
        weapons[player.weapon];

    if (
        reloadTimer > 0 ||
        weapon.ammo >= weapon.maxAmmo
    ) {
        return;
    }

    reloadTimer = 1.2;
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

        const b =
            bullets[i];

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        b.life -= dt;

        let removeBullet = false;

        // ----------------------------------------------------
        // WALL COLLISION
        // ----------------------------------------------------

        for (const building of buildings) {

            if (
                circleRectCollision(
                    b.x,
                    b.y,
                    4,
                    building
                )
            ) {

                createParticles(
                    b.x,
                    b.y,
                    8
                );

                removeBullet = true;

                break;
            }
        }

        if (removeBullet) {

            bullets.splice(i, 1);

            continue;
        }

        // ----------------------------------------------------
        // ENEMY COLLISION
        // ----------------------------------------------------

        for (
            let j = enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy =
                enemies[j];

            const d =
                dist(
                    b.x,
                    b.y,
                    enemy.x,
                    enemy.y
                );

            if (
                d <
                enemy.radius + 5
            ) {

                enemy.health -=
                    b.damage;

                createParticles(
                    b.x,
                    b.y,
                    6
                );

                removeBullet = true;

                if (
                    enemy.health <= 0
                ) {

                    kills++;

                    score +=
                        enemy.elite
                            ? 100
                            : 25;

                    credits +=
                        enemy.elite
                            ? 30
                            : 8;

                    addXP(
                        enemy.elite
                            ? 40
                            : 15
                    );

                    missionProgress++;

                    createParticles(
                        enemy.x,
                        enemy.y,
                        18
                    );

                    enemies.splice(
                        j,
                        1
                    );
                }

                break;
            }
        }

        if (
            removeBullet ||
            b.life <= 0
        ) {

            bullets.splice(
                i,
                1
            );
        }
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

        const b =
            enemyBullets[i];

        const oldX = b.x;
        const oldY = b.y;

        b.x +=
            b.vx * dt;

        b.y +=
            b.vy * dt;

        b.life -= dt;

        let remove = false;

        // ----------------------------------------------------
        // WALL COLLISION
        // ----------------------------------------------------

        for (const building of buildings) {

            if (
                circleRectCollision(
                    b.x,
                    b.y,
                    b.radius,
                    building
                )
            ) {

                createParticles(
                    b.x,
                    b.y,
                    5
                );

                remove = true;

                break;
            }
        }

        if (remove) {

            enemyBullets.splice(
                i,
                1
            );

            continue;
        }

        // ----------------------------------------------------
        // PLAYER COLLISION
        // ----------------------------------------------------

        const d =
            dist(
                b.x,
                b.y,
                player.x,
                player.y
            );

        if (
            d <
            player.radius +
            b.radius
        ) {

            if (
                player.invincible <= 0
            ) {

                player.health -=
                    b.damage;

                player.invincible =
                    0.4;

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
            b.life <= 0
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

    for (let i = 0; i < amount; i++) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            random(30, 150);

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
                random(0.25, 0.7),

            maxLife:
                0.7,

            size:
                random(2, 5)
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

        p.vx *= 0.96;
        p.vy *= 0.96;

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
// NPCS
// ============================================================

function updateNPCs(dt) {

    for (const npc of npcs) {

        npc.changeTimer -= dt;

        if (npc.changeTimer <= 0) {

            npc.angle =
                random(
                    0,
                    Math.PI * 2
                );

            npc.changeTimer =
                random(1, 4);
        }

        const nx =
            npc.x +
            Math.cos(npc.angle) *
            npc.speed *
            dt;

        const ny =
            npc.y +
            Math.sin(npc.angle) *
            npc.speed *
            dt;

        if (
            !blocked(
                nx,
                npc.y,
                npc.radius
            )
        ) {
            npc.x = nx;
        }

        if (
            !blocked(
                npc.x,
                ny,
                npc.radius
            )
        ) {
            npc.y = ny;
        }
    }
}

// ============================================================
// LOOT
// ============================================================

function updateLoot() {

    for (const item of loot) {

        if (item.collected) {
            continue;
        }

        const d =
            dist(
                player.x,
                player.y,
                item.x,
                item.y
            );

        if (d < 35) {

            item.collected = true;

            if (
                item.type ===
                "credits"
            ) {

                credits +=
                    Math.floor(
                        random(
                            5,
                            30
                        )
                    );

            } else {

                player.energy =
                    clamp(
                        player.energy + 30,
                        0,
                        player.maxEnergy
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
// GAME UPDATE
// ============================================================

function update(dt) {

    if (
        !gameRunning ||
        paused
    ) {
        return;
    }

    updatePlayer(dt);

    if (mouse.down) {
        shoot();
    }

    if (fireCooldown > 0) {
        fireCooldown -= dt;
    }

    if (reloadTimer > 0) {

        reloadTimer -= dt;

        if (reloadTimer <= 0) {

            const weapon =
                weapons[player.weapon];

            weapon.ammo =
                weapon.maxAmmo;
        }
    }

    updateEnemies(dt);

    updateBullets(dt);

    updateEnemyBullets(dt);

    updateNPCs(dt);

    updateLoot();

    updateParticles(dt);

    // Day/night cycle
    timeOfDay +=
        dt * 0.003;

    if (timeOfDay >= 1) {
        timeOfDay -= 1;
    }

    // Weather
    if (Math.random() < dt * 0.002) {

        const weatherTypes = [
            "clear",
            "rain",
            "fog"
        ];

        weather =
            weatherTypes[
                Math.floor(
                    Math.random() *
                    weatherTypes.length
                )
            ];
    }

    camera.x =
        player.x;

    camera.y =
        player.y;

    if (player.health <= 0) {

        player.health = 0;

        gameOver();
    }

    updateHUD();
}

// ============================================================
// DRAW WORLD
// ============================================================

function drawWorld() {

    ctx.fillStyle =
        "#111b18";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.save();

    ctx.translate(
        canvas.width / 2 -
            camera.x,

        canvas.height / 2 -
            camera.y
    );

    // --------------------------------------------------------
    // GROUND
    // --------------------------------------------------------

    ctx.fillStyle =
        "#17231e";

    ctx.fillRect(
        -WORLD_W / 2,
        -WORLD_H / 2,
        WORLD_W,
        WORLD_H
    );

    // Grid / terrain details
    drawGroundDetails();

    // --------------------------------------------------------
    // ROCKS
    // --------------------------------------------------------

    for (const rock of rocks) {

        if (
            dist(
                rock.x,
                rock.y,
                player.x,
                player.y
            ) > 1000
        ) {
            continue;
        }

        ctx.fillStyle =
            "#454b48";

        ctx.beginPath();

        ctx.arc(
            rock.x,
            rock.y,
            rock.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    // --------------------------------------------------------
    // TREES
    // --------------------------------------------------------

    for (const tree of trees) {

        if (
            dist(
                tree.x,
                tree.y,
                player.x,
                player.y
            ) > 1100
        ) {
            continue;
        }

        drawTree(tree);
    }

    // --------------------------------------------------------
    // BUILDINGS
    // --------------------------------------------------------

    for (const building of buildings) {

        if (
            dist(
                building.x +
                    building.w / 2,

                building.y +
                    building.h / 2,

                player.x,
                player.y
            ) > 1300
        ) {
            continue;
        }

        drawBuilding(building);
    }

    // --------------------------------------------------------
    // DOORS
    // --------------------------------------------------------

    for (const door of doors) {

        ctx.fillStyle =
            door.open
                ? "#7c8f78"
                : "#303b38";

        ctx.fillRect(
            door.x,
            door.y,
            door.w,
            door.h
        );
    }

    // --------------------------------------------------------
    // LOOT
    // --------------------------------------------------------

    for (const item of loot) {

        if (item.collected) {
            continue;
        }

        ctx.fillStyle =
            item.type ===
            "credits"
                ? "#e6c85c"
                : "#5cd6ff";

        ctx.beginPath();

        ctx.arc(
            item.x,
            item.y,
            8,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    // --------------------------------------------------------
    // NPCS
    // --------------------------------------------------------

    for (const npc of npcs) {

        ctx.fillStyle =
            "#6ea4a1";

        ctx.beginPath();

        ctx.arc(
            npc.x,
            npc.y,
            npc.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    // --------------------------------------------------------
    // ENEMIES
    // --------------------------------------------------------

    for (const enemy of enemies) {

        drawEnemy(enemy);
    }

    // --------------------------------------------------------
    // PLAYER BULLETS
    // --------------------------------------------------------

    for (const b of bullets) {

        ctx.strokeStyle =
            "#d9ffff";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.moveTo(
            b.x,
            b.y
        );

        ctx.lineTo(
            b.x -
                b.vx * 0.02,

            b.y -
                b.vy * 0.02
        );

        ctx.stroke();
    }

    // --------------------------------------------------------
    // ENEMY BULLETS
    // --------------------------------------------------------

    for (const b of enemyBullets) {

        ctx.fillStyle =
            "#ff9a54";

        ctx.beginPath();

        ctx.arc(
            b.x,
            b.y,
            b.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    // --------------------------------------------------------
    // PARTICLES
    // --------------------------------------------------------

    for (const p of particles) {

        ctx.globalAlpha =
            Math.max(
                0,
                p.life /
                    p.maxLife
            );

        ctx.fillStyle =
            "#b7e4df";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;

    // --------------------------------------------------------
    // PLAYER
    // --------------------------------------------------------

    drawPlayer();

    ctx.restore();

    drawLighting();

    drawWeather();

    drawMinimap();
}

// ============================================================
// GROUND DETAILS
// ============================================================

function drawGroundDetails() {

    const startX =
        Math.floor(
            (camera.x - 900) /
            80
        ) * 80;

    const startY =
        Math.floor(
            (camera.y - 700) /
            80
        ) * 80;

    ctx.strokeStyle =
        "rgba(130,160,145,0.08)";

    ctx.lineWidth = 1;

    for (
        let x = startX;
        x < camera.x + 900;
        x += 80
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            camera.y - 700
        );

        ctx.lineTo(
            x,
            camera.y + 700
        );

        ctx.stroke();
    }

    for (
        let y = startY;
        y < camera.y + 700;
        y += 80
    ) {

        ctx.beginPath();

        ctx.moveTo(
            camera.x - 900,
            y
        );

        ctx.lineTo(
            camera.x + 900,
            y
        );

        ctx.stroke();
    }
}

// ============================================================
// DRAW TREE
// ============================================================

function drawTree(tree) {

    const sway =
        Math.sin(
            performance.now() * 0.001 +
            tree.phase
        ) * 2;

    // Shadow
    ctx.fillStyle =
        "rgba(0,0,0,0.25)";

    ctx.beginPath();

    ctx.ellipse(
        tree.x,
        tree.y + 18,
        tree.radius,
        tree.radius * 0.45,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Trunk
    ctx.fillStyle =
        "#594b38";

    ctx.fillRect(
        tree.x - 5,
        tree.y,
        10,
        28
    );

    // Crown
    ctx.fillStyle =
        "#31533d";

    ctx.beginPath();

    ctx.arc(
        tree.x + sway,
        tree.y - 8,
        tree.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#3d684b";

    ctx.beginPath();

    ctx.arc(
        tree.x - 7 + sway,
        tree.y - 13,
        tree.radius * 0.55,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

// ============================================================
// DRAW BUILDING
// ============================================================

function drawBuilding(building) {

    // Shadow
    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.fillRect(
        building.x + 10,
        building.y + 10,
        building.w,
        building.h
    );

    // Main building
    ctx.fillStyle =
        "#343d3b";

    ctx.fillRect(
        building.x,
        building.y,
        building.w,
        building.h
    );

    // Roof
    ctx.fillStyle =
        "#252d2b";

    ctx.fillRect(
        building.x - 4,
        building.y - 6,
        building.w + 8,
        12
    );

    // Windows
    ctx.fillStyle =
        "#6e8d88";

    const windowCount =
        Math.max(
            2,
            Math.floor(
                building.w / 80
            )
        );

    for (
        let i = 0;
        i < windowCount;
        i++
    ) {

        const wx =
            building.x +
            25 +
            i * 70;

        if (
            wx <
            building.x +
                building.w -
                30
        ) {

            ctx.fillRect(
                wx,
                building.y + 35,
                25,
                20
            );
        }
    }

    // Door
    ctx.fillStyle =
        "#1e2524";

    ctx.fillRect(
        building.x +
            building.w / 2 -
            20,

        building.y +
            building.h -
            50,

        40,
        50
    );
}

// ============================================================
// DRAW ENEMY
// ============================================================

function drawEnemy(enemy) {

    ctx.save();

    ctx.translate(
        enemy.x,
        enemy.y
    );

    ctx.rotate(
        enemy.angle
    );

    ctx.fillStyle =
        enemy.elite
            ? "#b06aff"
            : "#d65b64";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        enemy.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#202526";

    ctx.fillRect(
        5,
        -4,
        enemy.radius + 8,
        8
    );

    ctx.restore();

    // Health bar
    const barWidth =
        enemy.radius * 2;

    const healthPercent =
        enemy.health /
        enemy.maxHealth;

    ctx.fillStyle =
        "rgba(0,0,0,0.5)";

    ctx.fillRect(
        enemy.x - barWidth / 2,
        enemy.y -
            enemy.radius -
            12,
        barWidth,
        5
    );

    ctx.fillStyle =
        "#79d6a3";

    ctx.fillRect(
        enemy.x - barWidth / 2,
        enemy.y -
            enemy.radius -
            12,
        barWidth *
            healthPercent,
        5
    );
}

// ============================================================
// DRAW PLAYER
// ============================================================

function drawPlayer() {

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );

    ctx.rotate(
        player.angle
    );

    if (
        player.invincible > 0 &&
        Math.floor(
            player.invincible * 20
        ) % 2 === 0
    ) {
        ctx.globalAlpha = 0.45;
    }

    // Body
    ctx.fillStyle =
        "#77d4c8";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Weapon
    ctx.fillStyle =
        "#d9e4df";

    ctx.fillRect(
        7,
        -5,
        30,
        10
    );

    ctx.restore();

    ctx.globalAlpha = 1;
}

// ============================================================
// LIGHTING
// ============================================================

function drawLighting() {

    const darkness =
        getNightAmount();

    if (darkness <= 0) {
        return;
    }

    const gradient =
        ctx.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            80,

            canvas.width / 2,
            canvas.height / 2,
            650
        );

    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    gradient.addColorStop(
        0.45,
        `rgba(5,10,20,${darkness * 0.15})`
    );

    gradient.addColorStop(
        1,
        `rgba(3,7,15,${darkness * 0.78})`
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}

function getNightAmount() {

    const sun =
        Math.sin(
            timeOfDay *
            Math.PI *
            2
        );

    return clamp(
        0.65 - sun,
        0,
        1
    );
}

// ============================================================
// WEATHER
// ============================================================

function drawWeather() {

    if (weather === "rain") {

        ctx.strokeStyle =
            "rgba(150,190,220,0.25)";

        ctx.lineWidth = 1;

        for (let i = 0; i < 120; i++) {

            const x =
                Math.random() *
                canvas.width;

            const y =
                Math.random() *
                canvas.height;

            ctx.beginPath();

            ctx.moveTo(
                x,
                y
            );

            ctx.lineTo(
                x - 5,
                y + 20
            );

            ctx.stroke();
        }
    }

    if (weather === "fog") {

        ctx.fillStyle =
            "rgba(180,200,190,0.08)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }
}

// ============================================================
// MINIMAP
// ============================================================

function drawMinimap() {

    const size = 180;

    const x =
        canvas.width -
        size -
        20;

    const y = 20;

    mapCtx.clearRect(
        0,
        0,
        mapCanvas.width,
        mapCanvas.height
    );

    mapCanvas.width = size;
    mapCanvas.height = size;

    mapCtx.fillStyle =
        "#111917";

    mapCtx.fillRect(
        0,
        0,
        size,
        size
    );

    const scale =
        size /
        WORLD_W;

    // Buildings
    mapCtx.fillStyle =
        "#56645f";

    for (const building of buildings) {

        mapCtx.fillRect(

            (building.x +
                WORLD_W / 2) *
                scale,

            (building.y +
                WORLD_H / 2) *
                scale,

            building.w * scale,
            building.h * scale
        );
    }

    // Enemies
    mapCtx.fillStyle =
        "#d85f6b";

    for (const enemy of enemies) {

        mapCtx.beginPath();

        mapCtx.arc(

            (enemy.x +
                WORLD_W / 2) *
                scale,

            (enemy.y +
                WORLD_H / 2) *
                scale,

            3,

            0,
            Math.PI * 2
        );

        mapCtx.fill();
    }

    // Player
    mapCtx.fillStyle =
        "#7ce0d3";

    mapCtx.beginPath();

    mapCtx.arc(

        (player.x +
            WORLD_W / 2) *
            scale,

        (player.y +
            WORLD_H / 2) *
            scale,

        4,

        0,
        Math.PI * 2
    );

    mapCtx.fill();

    // Position map on screen
    ctx.drawImage(
        mapCanvas,
        x,
        y
    );
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

    const killsElement =
        document.getElementById(
            "kills"
        );

    const creditsElement =
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
            (
                player.health /
                player.maxHealth *
                100
            ) + "%";
    }

    if (energyBar) {

        energyBar.style.width =
            (
                player.energy /
                player.maxEnergy *
                100
            ) + "%";
    }

    if (ammo) {

        const weapon =
            weapons[player.weapon];

        ammo.textContent =
            reloadTimer > 0
                ? "RELOADING..."
                : `${weapon.ammo} / ∞`;
    }

    if (killsElement) {

        killsElement.textContent =
            `KILLS: ${kills}`;
    }

    if (creditsElement) {

        creditsElement.textContent =
            `CREDITS: ${credits}`;
    }

    if (objective) {

        objective.textContent =
            missionProgress >= missionTarget
                ? "SIGNAL LOCATED"
                : `FIND THE SIGNAL • ${missionProgress}/${missionTarget}`;
    }

    if (zone) {

        zone.textContent =
            `SECTOR ${level}`;
    }

    const weaponName =
        document.querySelector(
            ".weaponName"
        );

    if (weaponName) {

        weaponName.textContent =
            weapons[
                player.weapon
            ].name;
    }
}

// ============================================================
// XP / LEVEL
// ============================================================

function addXP(amount) {

    xp += amount;

    const needed =
        level * 100;

    if (xp >= needed) {

        xp -= needed;

        level++;

        player.maxHealth += 10;

        player.maxEnergy += 5;

        player.health =
            player.maxHealth;

        player.energy =
            player.maxEnergy;

        showAchievement(
            "LEVEL UP"
        );
    }
}

// ============================================================
// ACHIEVEMENT
// ============================================================

function showAchievement(name) {

    const box =
        document.getElementById(
            "achievement"
        );

    const nameElement =
        document.getElementById(
            "achievementName"
        );

    if (!box || !nameElement) {
        return;
    }

    nameElement.textContent =
        name;

    box.classList.add(
        "show"
    );

    setTimeout(() => {

        box.classList.remove(
            "show"
        );

    }, 2500);
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
            maxHealth: player.maxHealth,
            energy: player.energy,
            maxEnergy: player.maxEnergy,
            weapon: player.weapon
        },

        score,
        kills,
        credits,
        xp,
        level,
        missionProgress,

        weapons:
            weapons.map(
                weapon => ({
                    ammo:
                        weapon.ammo
                })
            )
    };

    localStorage.setItem(
        "echobound_save",
        JSON.stringify(data)
    );

    showAchievement(
        "RUN SAVED"
    );
}

// ============================================================
// LOAD
// ============================================================

function loadGame() {

    const saved =
        localStorage.getItem(
            "echobound_save"
        );

    if (!saved) {

        alert(
            "Er is nog geen opgeslagen run."
        );

        return;
    }

    try {

        const data =
            JSON.parse(saved);

        generateWorld();

        player.x =
            data.player.x;

        player.y =
            data.player.y;

        player.health =
            data.player.health;

        player.maxHealth =
            data.player.maxHealth;

        player.energy =
            data.player.energy;

        player.maxEnergy =
            data.player.maxEnergy;

        player.weapon =
            data.player.weapon;

        score =
            data.score;

        kills =
            data.kills;

        credits =
            data.credits;

        xp =
            data.xp;

        level =
            data.level;

        missionProgress =
            data.missionProgress;

        if (data.weapons) {

            data.weapons.forEach(
                (savedWeapon, i) => {

                    if (
                        weapons[i] &&
                        savedWeapon
                    ) {

                        weapons[i].ammo =
                            savedWeapon.ammo;
                    }
                }
            );
        }

        bullets.length = 0;
        enemyBullets.length = 0;
        particles.length = 0;
        enemies.length = 0;

        for (let i = 0; i < 4; i++) {
            spawnEnemy();
        }

        gameRunning = true;
        paused = false;

        hideElement("menu");
        hideElement("pause");

        showElement("hud");

        updateHUD();

    } catch (error) {

        console.error(error);

        alert(
            "De save kon niet worden geladen."
        );
    }
}

// ============================================================
// GAME OVER
// ============================================================

function gameOver() {

    gameRunning = false;

    setTimeout(() => {

        alert(
            `RUN ENDED\n\nKills: ${kills}\nCredits: ${credits}\nLevel: ${level}`
        );

        showElement("menu");
        hideElement("hud");

    }, 100);
}

// ============================================================
// PAUSE
// ============================================================

function togglePause() {

    if (!gameRunning) {
        return;
    }

    paused =
        !paused;

    if (paused) {

        showElement("pause");

    } else {

        hideElement("pause");
    }
}

// ============================================================
// UI HELPERS
// ============================================================

function showElement(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.style.display =
        id === "hud"
            ? "block"
            : "flex";
}

function hideElement(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.style.display =
        "none";
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

            resetGame();
        }
    );
}

const loadGameButton =
    document.getElementById(
        "loadGame"
    );

if (loadGameButton) {

    loadGameButton.addEventListener(
        "click",
        () => {

            loadGame();
        }
    );
}

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
                "• FIRST ECHO — Start your first run\n" +
                "• LEVEL UP — Reach a new level\n" +
                "• RUN SAVED — Save your run\n" +
                "• SIGNAL HUNTER — Find the signal"
            );
        }
    );
}

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
                "WASD — Move\n" +
                "SHIFT — Sprint\n" +
                "MOUSE — Aim\n" +
                "LEFT CLICK — Shoot\n" +
                "R — Reload\n" +
                "SPACE — Dash\n" +
                "1 / 2 / 3 — Weapons\n" +
                "ESC — Pause"
            );
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

            hideElement("pause");
        }
    );
}

const saveButton =
    document.getElementById(
        "save"
    );

if (saveButton) {

    saveButton.addEventListener(
        "click",
        () => {

            saveGame();
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

            paused = false;
            gameRunning = false;

            hideElement("pause");
            hideElement("hud");

            showElement("menu");
        }
    );
}

const closeMapButton =
    document.getElementById(
        "closeMap"
    );

if (closeMapButton) {

    closeMapButton.addEventListener(
        "click",
        () => {

            hideElement("map");
        }
    );
}

// ============================================================
// RESIZE
// ============================================================

function resize() {

    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;
}

window.addEventListener(
    "resize",
    resize
);

resize();

// ============================================================
// GAME LOOP
// ============================================================

let lastTime =
    performance.now();

function gameLoop(now) {

    const dt =
        Math.min(
            (now - lastTime) /
                1000,
            0.05
        );

    lastTime = now;

    update(dt);

    drawWorld();

    requestAnimationFrame(
        gameLoop
    );
}

requestAnimationFrame(
    gameLoop
);

// ============================================================
// START STATE
// ============================================================

hideElement("hud");
hideElement("pause");
hideElement("map");

showElement("menu");

updateHUD();
