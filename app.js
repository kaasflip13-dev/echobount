// ============================================================
// ECHOBOUND — THE LOST SIGNAL
// GROTE 2D OPEN WORLD
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = innerWidth;
let H = innerHeight;

canvas.width = W;
canvas.height = H;

window.addEventListener("resize", () => {
    W = innerWidth;
    H = innerHeight;
    canvas.width = W;
    canvas.height = H;
});

// ============================================================
// WERELD
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
let credits = 100;

let level = 1;
let xp = 0;
let xpNeeded = 100;

let health = 100;
let maxHealth = 100;

let energy = 100;
let maxEnergy = 100;

let dayTime = 8;
let weather = "clear";

let mission = "Find the lost signal";
let missionProgress = 0;

const keys = {};
const mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

// ============================================================
// SPELER
// ============================================================

const player = {
    x: 0,
    y: 0,

    radius: 17,

    speed: 230,

    angle: 0,

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

// ============================================================
// OBJECTEN
// ============================================================

const bullets = [];
const enemyBullets = [];
const enemies = [];
const npcs = [];
const buildings = [];
const trees = [];
const rocks = [];
const loot = [];
const particles = [];
const doors = [];

// ============================================================
// HULPFUNCTIES
// ============================================================

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function dist(x1, y1, x2, y2) {
    return Math.hypot(x1 - x2, y1 - y2);
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

// ============================================================
// COLLISION
// ============================================================

function circleRectCollision(cx, cy, radius, r) {

    const closestX = clamp(
        cx,
        r.x,
        r.x + r.w
    );

    const closestY = clamp(
        cy,
        r.y,
        r.y + r.h
    );

    const dx = cx - closestX;
    const dy = cy - closestY;

    return dx * dx + dy * dy < radius * radius;
}

function blocked(x, y, radius = player.radius) {

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
// WERELD MAKEN
// ============================================================

function generateWorld() {

    buildings.length = 0;
    trees.length = 0;
    rocks.length = 0;
    loot.length = 0;
    doors.length = 0;
    npcs.length = 0;

    // -----------------------------
    // GEBOUWEN
    // -----------------------------

    for (let i = 0; i < 42; i++) {

        let b;

        for (let tries = 0; tries < 50; tries++) {

            b = {
                x: random(
                    -WORLD_W / 2 + 300,
                    WORLD_W / 2 - 500
                ),

                y: random(
                    -WORLD_H / 2 + 300,
                    WORLD_H / 2 - 500
                ),

                w: random(120, 300),
                h: random(100, 230)
            };

            if (
                Math.abs(b.x) > 450 ||
                Math.abs(b.y) > 450
            ) {
                break;
            }
        }

        buildings.push(b);

        // deur aan gebouw
        doors.push({
            x: b.x + b.w / 2 - 20,
            y: b.y + b.h - 5,
            w: 40,
            h: 12,
            open: false
        });
    }

    // -----------------------------
    // BOMEN
    // -----------------------------

    for (let i = 850; i--;) {

        const x = random(
            -WORLD_W / 2,
            WORLD_W / 2
        );

        const y = random(
            -WORLD_H / 2,
            WORLD_H / 2
        );

        if (
            Math.abs(x) < 500 &&
            Math.abs(y) < 500
        ) {
            continue;
        }

        trees.push({
            x,
            y,
            size: random(0.7, 1.5)
        });
    }

    // -----------------------------
    // ROTSEN
    // -----------------------------

    for (let i = 350; i--;) {

        rocks.push({
            x: random(
                -WORLD_W / 2,
                WORLD_W / 2
            ),

            y: random(
                -WORLD_H / 2,
                WORLD_H / 2
            ),

            size: random(8, 30)
        });
    }

    // -----------------------------
    // LOOT
    // -----------------------------

    for (let i = 80; i--;) {

        loot.push({
            x: random(
                -WORLD_W / 2,
                WORLD_W / 2
            ),

            y: random(
                -WORLD_H / 2,
                WORLD_H / 2
            ),

            type:
                Math.random() < 0.35
                    ? "health"
                    : Math.random() < 0.5
                        ? "energy"
                        : "credits",

            collected: false
        });
    }

    // -----------------------------
    // NPC'S
    // -----------------------------

    for (let i = 18; i--;) {

        npcs.push({
            x: random(-2500, 2500),
            y: random(-2500, 2500),
            targetX: random(-2500, 2500),
            targetY: random(-2500, 2500),
            speed: random(20, 35)
        });
    }
}

// ============================================================
// VIJANDEN
// ============================================================

function spawnEnemy() {

    if (enemies.length >= MAX_ENEMIES) {
        return;
    }

    const angle =
        Math.random() *
        Math.PI *
        2;

    const distanceFromPlayer =
        random(650, 1000);

    let x =
        player.x +
        Math.cos(angle) *
        distanceFromPlayer;

    let y =
        player.y +
        Math.sin(angle) *
        distanceFromPlayer;

    x = clamp(
        x,
        -WORLD_W / 2 + 100,
        WORLD_W / 2 - 100
    );

    y = clamp(
        y,
        -WORLD_H / 2 + 100,
        WORLD_H / 2 - 100
    );

    enemies.push({
        x,
        y,

        radius: 19,

        speed: random(42, 65),

        health:
            3 + Math.floor(level / 3),

        maxHealth:
            3 + Math.floor(level / 3),

        cooldown: random(1.5, 3),

        elite:
            Math.random() < 0.15
    });
}

// ============================================================
// XP
// ============================================================

function addXP(amount) {

    xp += amount;

    while (xp >= xpNeeded) {

        xp -= xpNeeded;

        level++;

        xpNeeded =
            Math.floor(
                xpNeeded * 1.25
            );

        maxHealth += 10;
        health = maxHealth;

        maxEnergy += 5;
        energy = maxEnergy;
    }
}

// ============================================================
// SCHIETEN
// ============================================================

function shoot() {

    if (
        !gameRunning ||
        paused
    ) {
        return;
    }

    const weapon =
        weapons[player.weapon];

    if (weapon.ammo <= 0) {

        reload();

        return;
    }

    if (
        player.fireCooldown &&
        player.fireCooldown > 0
    ) {
        return;
    }

    weapon.ammo--;

    player.fireCooldown =
        weapon.fireRate;

    const spread =
        player.weapon === 1
            ? random(-0.06, 0.06)
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
}

function reload() {

    const weapon =
        weapons[player.weapon];

    weapon.ammo =
        weapon.maxAmmo;
}

// ============================================================
// DASH
// ============================================================

function dash() {

    if (
        player.dashCooldown > 0 ||
        energy < 25 ||
        paused
    ) {
        return;
    }

    energy -= 25;

    const distance = 140;

    const nx =
        player.x +
        Math.cos(player.angle) *
        distance;

    const ny =
        player.y +
        Math.sin(player.angle) *
        distance;

    if (!blocked(nx, ny)) {

        player.x = nx;
        player.y = ny;
    }

    player.dashCooldown = 1.3;

    player.invincible = 0.35;

    createParticles(
        player.x,
        player.y,
        18
    );
}

// ============================================================
// INPUT
// ============================================================

window.addEventListener(
    "keydown",
    e => {

        keys[e.code] = true;

        if (e.code === "Space") {
            e.preventDefault();
            dash();
        }

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

        if (e.code === "Escape") {
            togglePause();
        }
    }
);

window.addEventListener(
    "keyup",
    e => {
        keys[e.code] = false;
    }
);

canvas.addEventListener(
    "mousemove",
    e => {

        mouse.x = e.clientX;
        mouse.y = e.clientY;

        updateAim();
    }
);

canvas.addEventListener(
    "mousedown",
    e => {

        if (e.button === 0) {
            mouse.down = true;
        }
    }
);

canvas.addEventListener(
    "mouseup",
    e => {

        if (e.button === 0) {
            mouse.down = false;
        }
    }
);

// ============================================================
// AIM
// ============================================================

function updateAim() {

    const sx =
        player.x -
        camera.x;

    const sy =
        player.y -
        camera.y;

    player.angle =
        Math.atan2(
            mouse.y - sy,
            mouse.x - sx
        );
}

// ============================================================
// SPELER
// ============================================================

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;

    if (keys["KeyW"]) dy--;
    if (keys["KeyS"]) dy++;
    if (keys["KeyA"]) dx--;
    if (keys["KeyD"]) dx++;

    if (dx || dy) {

        const length =
            Math.hypot(dx, dy);

        dx /= length;
        dy /= length;

        let speed =
            player.speed;

        if (
            keys["ShiftLeft"] ||
            keys["ShiftRight"]
        ) {
            speed *= 1.45;
        }

        const nx =
            player.x +
            dx *
            speed *
            dt;

        const ny =
            player.y +
            dy *
            speed *
            dt;

        // X apart controleren
        if (
            !blocked(
                nx,
                player.y
            )
        ) {
            player.x = nx;
        }

        // Y apart controleren
        if (
            !blocked(
                player.x,
                ny
            )
        ) {
            player.y = ny;
        }
    }

    energy =
        Math.min(
            maxEnergy,
            energy + 8 * dt
        );

    if (
        player.fireCooldown > 0
    ) {
        player.fireCooldown -= dt;
    }

    if (
        player.dashCooldown > 0
    ) {
        player.dashCooldown -= dt;
    }

    if (
        player.invincible > 0
    ) {
        player.invincible -= dt;
    }

    if (mouse.down) {
        shoot();
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
}

// ============================================================
// VIJANDEN
// ============================================================

function updateEnemies(dt) {

    for (const enemy of enemies) {

        const dx =
            player.x -
            enemy.x;

        const dy =
            player.y -
            enemy.y;

        const d =
            Math.hypot(dx, dy);

        if (
            d > 120 &&
            d < 900
        ) {

            const nx =
                enemy.x +
                dx / d *
                enemy.speed *
                dt;

            const ny =
                enemy.y +
                dy / d *
                enemy.speed *
                dt;

            if (!blocked(
                nx,
                enemy.y,
                enemy.radius
            )) {
                enemy.x = nx;
            }

            if (!blocked(
                enemy.x,
                ny,
                enemy.radius
            )) {
                enemy.y = ny;
            }
        }

        enemy.cooldown -= dt;

        if (
            enemy.cooldown <= 0 &&
            d < 750
        ) {

            enemy.cooldown =
                enemy.elite
                    ? 1.8
                    : 3;

            const angle =
                Math.atan2(
                    player.y - enemy.y,
                    player.x - enemy.x
                );

            enemyBullets.push({

                x: enemy.x,
                y: enemy.y,

                vx:
                    Math.cos(angle) *
                    230,

                vy:
                    Math.sin(angle) *
                    230,

                life: 3,

                damage:
                    enemy.elite
                        ? 12
                        : 8
            });
        }

        if (
            d <
            player.radius +
            enemy.radius
        ) {

            if (
                player.invincible <= 0
            ) {

                health -=
                    15 * dt;
            }
        }
    }

    // bots blijven beperkt

    while (
        enemies.length <
        MAX_ENEMIES
    ) {
        spawnEnemy();

        if (
            enemies.length >=
            MAX_ENEMIES
        ) {
            break;
        }
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

        const b = bullets[i];

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        b.life -= dt;

        let hit = false;

        for (
            let j = enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy =
                enemies[j];

            if (
                dist(
                    b.x,
                    b.y,
                    enemy.x,
                    enemy.y
                ) <
                enemy.radius + 5
            ) {

                enemy.health -=
                    b.damage;

                createParticles(
                    b.x,
                    b.y,
                    6
                );

                hit = true;

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
            hit ||
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
        let i =
            enemyBullets.length - 1;
        i >= 0;
        i--
    ) {

        const b =
            enemyBullets[i];

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        b.life -= dt;

        if (
            dist(
                b.x,
                b.y,
                player.x,
                player.y
            ) <
            player.radius + 5
        ) {

            if (
                player.invincible <= 0
            ) {

                health -= b.damage;
            }

            createParticles(
                player.x,
                player.y,
                7
            );

            enemyBullets.splice(
                i,
                1
            );

            continue;
        }

        if (b.life <= 0) {

            enemyBullets.splice(
                i,
                1
            );
        }
    }
}

// ============================================================
// NPC'S
// ============================================================

function updateNPCs(dt) {

    for (const npc of npcs) {

        const dx =
            npc.targetX -
            npc.x;

        const dy =
            npc.targetY -
            npc.y;

        const d =
            Math.hypot(dx, dy);

        if (d < 30) {

            npc.targetX =
                random(
                    -3000,
                    3000
                );

            npc.targetY =
                random(
                    -3000,
                    3000
                );

            continue;
        }

        const nx =
            npc.x +
            dx / d *
            npc.speed *
            dt;

        const ny =
            npc.y +
            dy / d *
            npc.speed *
            dt;

        if (
            !blocked(
                nx,
                npc.y,
                12
            )
        ) {
            npc.x = nx;
        }

        if (
            !blocked(
                npc.x,
                ny,
                12
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

        if (
            dist(
                player.x,
                player.y,
                item.x,
                item.y
            ) < 35
        ) {

            item.collected = true;

            if (
                item.type ===
                "health"
            ) {

                health =
                    Math.min(
                        maxHealth,
                        health + 30
                    );
            }

            else if (
                item.type ===
                "energy"
            ) {

                energy =
                    Math.min(
                        maxEnergy,
                        energy + 40
                    );
            }

            else {

                credits += 25;
            }
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

        particles.push({

            x,
            y,

            vx:
                random(
                    -100,
                    100
                ),

            vy:
                random(
                    -100,
                    100
                ),

            life:
                random(
                    0.3,
                    0.8
                ),

            maxLife: 0.8
        });
    }
}

function updateParticles(dt) {

    for (
        let i =
            particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            particles[i];

        p.x += p.vx * dt;
        p.y += p.vy * dt;

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
// WEER
// ============================================================

function updateWeather(dt) {

    dayTime += dt * 0.03;

    if (dayTime >= 24) {
        dayTime = 0;
    }

    // langzaam veranderend weer

    if (
        Math.random() <
        0.0002
    ) {

        const types = [
            "clear",
            "rain",
            "fog"
        ];

        weather =
            types[
                Math.floor(
                    Math.random() *
                    types.length
                )
            ];
    }
}

// ============================================================
// ACHTERGROND
// ============================================================

function drawGround() {

    ctx.fillStyle =
        "#18251f";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    // zachte grondpatronen

    const grid = 80;

    const sx =
        Math.floor(
            camera.x / grid
        ) * grid;

    const sy =
        Math.floor(
            camera.y / grid
        ) * grid;

    ctx.strokeStyle =
        "rgba(120,150,130,0.035)";

    ctx.lineWidth = 1;

    for (
        let x = sx;
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
        let y = sy;
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
}

// ============================================================
// GEBOUWEN
// ============================================================

function drawBuildings() {

    for (const b of buildings) {

        const x =
            b.x -
            camera.x;

        const y =
            b.y -
            camera.y;

        if (
            x > W + 400 ||
            x + b.w < -400 ||
            y > H + 400 ||
            y + b.h < -400
        ) {
            continue;
        }

        // schaduw

        ctx.fillStyle =
            "rgba(0,0,0,0.3)";

        ctx.fillRect(
            x + 12,
            y + 14,
            b.w,
            b.h
        );

        // gebouw

        ctx.fillStyle =
            "#343c46";

        ctx.fillRect(
            x,
            y,
            b.w,
            b.h
        );

        // dak

        ctx.fillStyle =
            "#242b34";

        ctx.fillRect(
            x,
            y,
            b.w,
            18
        );

        // muren

        ctx.strokeStyle =
            "#77818c";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            x,
            y,
            b.w,
            b.h
        );

        // ramen

        const columns =
            Math.max(
                1,
                Math.floor(
                    b.w / 65
                )
            );

        const rows =
            Math.max(
                1,
                Math.floor(
                    b.h / 60
                )
            );

        for (
            let cx = 0;
            cx < columns;
            cx++
        ) {

            for (
                let cy = 0;
                cy < rows;
                cy++
            ) {

                ctx.fillStyle =
                    "rgba(110,190,220,0.7)";

                ctx.fillRect(
                    x +
                        20 +
                        cx * 60,

                    y +
                        35 +
                        cy * 55,

                    24,
                    22
                );
            }
        }

        // deur

        ctx.fillStyle =
            "#151b22";

        ctx.fillRect(
            x +
                b.w / 2 -
                18,

            y +
                b.h -
                50,

            36,
            50
        );
    }
}

// ============================================================
// BOMEN
// ============================================================

function drawTrees() {

    for (const tree of trees) {

        const x =
            tree.x -
            camera.x;

        const y =
            tree.y -
            camera.y;

        if (
            x < -100 ||
            x > W + 100 ||
            y < -100 ||
            y > H + 100
        ) {
            continue;
        }

        const s =
            28 *
            tree.size;

        // schaduw

        ctx.fillStyle =
            "rgba(0,0,0,0.25)";

        ctx.beginPath();

        ctx.ellipse(
            x,
            y + 22,
            s,
            s * 0.38,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // stam

        ctx.fillStyle =
            "#51382a";

        ctx.fillRect(
            x - 5,
            y - 3,
            10,
            30
        );

        // kroon

        ctx.fillStyle =
            "#123b27";

        ctx.beginPath();

        ctx.arc(
            x,
            y - 25,
            s,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#1c5c38";

        ctx.beginPath();

        ctx.arc(
            x - s * 0.35,
            y - 33,
            s * 0.58,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#2b7948";

        ctx.beginPath();

        ctx.arc(
            x + s * 0.25,
            y - 42,
            s * 0.45,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ============================================================
// ROTSEN
// ============================================================

function drawRocks() {

    for (const r of rocks) {

        const x =
            r.x -
            camera.x;

        const y =
            r.y -
            camera.y;

        if (
            x < -60 ||
            x > W + 60 ||
            y < -60 ||
            y > H + 60
        ) {
            continue;
        }

        ctx.fillStyle =
            "#535b5d";

        ctx.beginPath();

        ctx.ellipse(
            x,
            y,
            r.size,
            r.size * 0.7,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#747d7e";

        ctx.beginPath();

        ctx.arc(
            x - r.size * 0.25,
            y - r.size * 0.2,
            r.size * 0.35,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ============================================================
// NPC'S TEKENEN
// ============================================================

function drawNPCs() {

    for (const npc of npcs) {

        const x =
            npc.x -
            camera.x;

        const y =
            npc.y -
            camera.y;

        if (
            x < -50 ||
            x > W + 50 ||
            y < -50 ||
            y > H + 50
        ) {
            continue;
        }

        ctx.fillStyle =
            "#d4b27a";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            10,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#354f69";

        ctx.fillRect(
            x - 8,
            y + 7,
            16,
            15
        );
    }
}

// ============================================================
// LOOT TEKENEN
// ============================================================

function drawLoot() {

    for (const item of loot) {

        if (item.collected) {
            continue;
        }

        const x =
            item.x -
            camera.x;

        const y =
            item.y -
            camera.y;

        ctx.fillStyle =
            item.type === "health"
                ? "#56dc75"
                : item.type === "energy"
                    ? "#48cfff"
                    : "#ffd34d";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            9,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle =
            "#ffffff";

        ctx.stroke();
    }
}

// ============================================================
// VIJANDEN TEKENEN
// ============================================================

function drawEnemies() {

    for (const enemy of enemies) {

        const x =
            enemy.x -
            camera.x;

        const y =
            enemy.y -
            camera.y;

        // schaduw

        ctx.fillStyle =
            "rgba(0,0,0,0.3)";

        ctx.beginPath();

        ctx.ellipse(
            x,
            y + 18,
            22,
            8,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // lichaam

        ctx.fillStyle =
            enemy.elite
                ? "#b84dff"
                : "#7040c4";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // ogen

        ctx.fillStyle =
            "#f4ffff";

        ctx.beginPath();

        ctx.arc(
            x - 6,
            y - 4,
            4,
            0,
            Math.PI * 2
        );

        ctx.arc(
            x + 6,
            y - 4,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // healthbar

        ctx.fillStyle =
            "#111";

        ctx.fillRect(
            x - 22,
            y - 31,
            44,
            5
        );

        ctx.fillStyle =
            "#5ce17b";

        ctx.fillRect(
            x - 22,
            y - 31,
            44 *
            (
                enemy.health /
                enemy.maxHealth
            ),
            5
        );
    }
}

// ============================================================
// SPELER TEKENEN
// ============================================================

function drawPlayer() {

    const x =
        player.x -
        camera.x;

    const y =
        player.y -
        camera.y;

    // schaduw

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 20,
        23,
        9,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // lichaam

    ctx.fillStyle =
        "#3e83e7";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // helm

    ctx.fillStyle =
        "#9daebe";

    ctx.beginPath();

    ctx.arc(
        x,
        y - 5,
        11,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();

    // vizier

    ctx.fillStyle =
        "#62e7ff";

    ctx.beginPath();

    ctx.arc(
        x +
            Math.cos(player.angle) * 8,

        y +
            Math.sin(player.angle) * 8,

        6,

        0,
        Math.PI * 2
    );

    ctx.fill();

    // wapen

    ctx.save();

    ctx.translate(x, y);

    ctx.rotate(player.angle);

    ctx.fillStyle =
        "#202a35";

    ctx.fillRect(
        6,
        -4,
        30,
        8
    );

    ctx.restore();
}

// ============================================================
// BULLETS
// ============================================================

function drawBullets() {

    for (const b of bullets) {

        ctx.fillStyle =
            "#7cecff";

        ctx.beginPath();

        ctx.arc(
            b.x - camera.x,
            b.y - camera.y,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    for (const b of enemyBullets) {

        ctx.fillStyle =
            "#ff9d4d";

        ctx.beginPath();

        ctx.arc(
            b.x - camera.x,
            b.y - camera.y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ============================================================
// PARTICLES
// ============================================================

function drawParticles() {

    for (const p of particles) {

        ctx.globalAlpha =
            Math.max(
                0,
                p.life /
                p.maxLife
            );

        ctx.fillStyle =
            "#83eaff";

        ctx.beginPath();

        ctx.arc(
            p.x - camera.x,
            p.y - camera.y,
            3,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}

// ============================================================
// DAG / NACHT
// ============================================================

function drawDayNight() {

    let darkness = 0;

    if (
        dayTime < 6 ||
        dayTime > 20
    ) {

        darkness = 0.48;

    } else if (
        dayTime < 8 ||
        dayTime > 18
    ) {

        darkness = 0.2;
    }

    if (darkness > 0) {

        ctx.fillStyle =
            `rgba(5,10,25,${darkness})`;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );
    }
}

// ============================================================
// REGEN
// ============================================================

function drawWeather() {

    if (weather === "rain") {

        ctx.strokeStyle =
            "rgba(150,210,255,0.4)";

        for (let i = 0; i < 100; i++) {

            const x =
                Math.random() * W;

            const y =
                Math.random() * H;

            ctx.beginPath();

            ctx.moveTo(
                x,
                y
            );

            ctx.lineTo(
                x - 5,
                y + 18
            );

            ctx.stroke();
        }
    }

    if (weather === "fog") {

        ctx.fillStyle =
            "rgba(190,205,200,0.12)";

        ctx.fillRect(
            0,
            0,
            W,
            H
        );
    }
}

// ============================================================
// LICHTRADIUS
// ============================================================

function drawPlayerLight() {

    if (
        dayTime >= 7 &&
        dayTime <= 19
    ) {
        return;
    }

    const x =
        player.x -
        camera.x;

    const y =
        player.y -
        camera.y;

    const gradient =
        ctx.createRadialGradient(
            x,
            y,
            40,
            x,
            y,
            430
        );

    gradient.addColorStop(
        0,
        "rgba(255,240,190,0.15)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );
}

// ============================================================
// MINIMAP
// ============================================================

function drawMinimap() {

    const size = 170;

    const x =
        W - size - 20;

    const y = 20;

    ctx.fillStyle =
        "rgba(5,10,15,0.75)";

    ctx.fillRect(
        x,
        y,
        size,
        size
    );

    ctx.strokeStyle =
        "rgba(255,255,255,0.25)";

    ctx.strokeRect(
        x,
        y,
        size,
        size
    );

    // gebouwen

    for (const b of buildings) {

        const bx =
            x +
            (
                b.x +
                WORLD_W / 2
            ) /
            WORLD_W *
            size;

        const by =
            y +
            (
                b.y +
                WORLD_H / 2
            ) /
            WORLD_H *
            size;

        ctx.fillStyle =
            "#59636d";

        ctx.fillRect(
            bx,
            by,
            4,
            4
        );
    }

    // speler

    const px =
        x +
        (
            player.x +
            WORLD_W / 2
        ) /
        WORLD_W *
        size;

    const py =
        y +
        (
            player.y +
            WORLD_H / 2
        ) /
        WORLD_H *
        size;

    ctx.fillStyle =
        "#5cecff";

    ctx.beginPath();

    ctx.arc(
        px,
        py,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();
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
                health /
                maxHealth *
                100,
                0,
                100
            )}%`;
    }

    if (energyBar) {

        energyBar.style.width =
            `${clamp(
                energy /
                maxEnergy *
                100,
                0,
                100
            )}%`;
    }

    const weapon =
        weapons[player.weapon];

    if (ammo) {

        ammo.textContent =
            `${weapon.ammo} / ∞`;
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
            `${mission} (${missionProgress}/10)`;
    }

    if (zone) {

        zone.textContent =
            `LEVEL ${level} • ${weather.toUpperCase()}`;
    }
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
// NIEUW SPEL
// ============================================================

function startGame() {

    gameRunning = true;
    paused = false;

    player.x = 0;
    player.y = 0;

    health = 100;
    maxHealth = 100;

    energy = 100;
    maxEnergy = 100;

    credits = 100;

    score = 0;
    kills = 0;

    level = 1;
    xp = 0;
    xpNeeded = 100;

    dayTime = 8;

    weather = "clear";

    missionProgress = 0;

    enemies.length = 0;
    bullets.length = 0;
    enemyBullets.length = 0;
    particles.length = 0;

    for (const weapon of weapons) {
        weapon.ammo =
            weapon.maxAmmo;
    }

    generateWorld();

    // slechts vier bots

    for (let i = 0; i < 4; i++) {
        spawnEnemy();
    }

    updateCamera();

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
// SAVE
// ============================================================

function saveGame() {

    const data = {

        player: {
            x: player.x,
            y: player.y,
            weapon: player.weapon
        },

        health,
        maxHealth,

        energy,
        maxEnergy,

        credits,

        score,
        kills,

        level,
        xp,
        xpNeeded,

        dayTime,
        weather,

        missionProgress
    };

    localStorage.setItem(
        "echoboundSave",
        JSON.stringify(data)
    );
}

// ============================================================
// LOAD
// ============================================================

function loadGame() {

    const saved =
        localStorage.getItem(
            "echoboundSave"
        );

    startGame();

    if (!saved) {
        return;
    }

    try {

        const data =
            JSON.parse(saved);

        player.x =
            data.player.x;

        player.y =
            data.player.y;

        player.weapon =
            data.player.weapon || 0;

        health =
            data.health;

        maxHealth =
            data.maxHealth;

        energy =
            data.energy;

        maxEnergy =
            data.maxEnergy;

        credits =
            data.credits;

        score =
            data.score;

        kills =
            data.kills;

        level =
            data.level;

        xp =
            data.xp;

        xpNeeded =
            data.xpNeeded;

        dayTime =
            data.dayTime;

        weather =
            data.weather;

        missionProgress =
            data.missionProgress;

        updateCamera();

    } catch (error) {

        console.error(
            "Save kon niet geladen worden.",
            error
        );
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
    newGame.onclick =
        startGame;
}

const loadButton =
    document.getElementById(
        "loadGame"
    );

if (loadButton) {
    loadButton.onclick =
        loadGame;
}

const saveButton =
    document.getElementById(
        "save"
    );

if (saveButton) {

    saveButton.onclick =
        () => {

            saveGame();

            saveButton.textContent =
                "SAVED!";

            setTimeout(
                () => {

                    saveButton.textContent =
                        "SAVE RUN";

                },
                1000
            );
        };
}

const resumeButton =
    document.getElementById(
        "resume"
    );

if (resumeButton) {

    resumeButton.onclick =
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
        };
}

const quitButton =
    document.getElementById(
        "quit"
    );

if (quitButton) {

    quitButton.onclick =
        () => {

            gameRunning = false;
            paused = false;

            const pause =
                document.getElementById(
                    "pause"
                );

            const menu =
                document.getElementById(
                    "menu"
                );

            if (pause) {
                pause.style.display =
                    "none";
            }

            if (menu) {
                menu.style.display =
                    "flex";
            }
        };
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

const achievementButton =
    document.getElementById(
        "achievementsButton"
    );

if (achievementButton) {

    achievementButton.onclick =
        () => {

            alert(
                "ECHOBOUND ACHIEVEMENTS\n\n" +
                "⭐ FIRST ECHO\n" +
                "Maak je eerste kill.\n\n" +
                "⭐ HUNTER\n" +
                "Maak 25 kills.\n\n" +
                "⭐ EXPLORER\n" +
                "Loop ver de wereld in.\n\n" +
                "⭐ SURVIVOR\n" +
                "Bereik level 5."
            );
        };
}

// ============================================================
// CONTROLS
// ============================================================

const controlsButton =
    document.getElementById(
        "controlsButton"
    );

if (controlsButton) {

    controlsButton.onclick =
        () => {

            alert(
                "CONTROLS\n\n" +
                "W A S D = bewegen\n" +
                "SHIFT = rennen\n" +
                "MUIS = richten\n" +
                "LINKER MUIS = schieten\n" +
                "R = reload\n" +
                "1 = Pulse\n" +
                "2 = Burst\n" +
                "3 = Cannon\n" +
                "SPACE = dash\n" +
                "ESC = pauze"
            );
        };
}

// ============================================================
// GAME OVER
// ============================================================

function gameOver() {

    gameRunning = false;

    alert(
        "RUN ENDED\n\n" +
        "Kills: " +
        kills +
        "\nLevel: " +
        level +
        "\nCredits: " +
        credits
    );

    const menu =
        document.getElementById(
            "menu"
        );

    if (menu) {
        menu.style.display =
            "flex";
    }
}

// ============================================================
// UPDATE
// ============================================================

function update(dt) {

    if (
        !gameRunning ||
        paused
    ) {
        return;
    }

    updatePlayer(dt);

    updateCamera();

    updateEnemies(dt);

    updateBullets(dt);

    updateEnemyBullets(dt);

    updateNPCs(dt);

    updateLoot();

    updateParticles(dt);

    updateWeather(dt);

    updateAim();

    updateHUD();

    if (health <= 0) {

        health = 0;

        gameOver();
    }
}

// ============================================================
// DRAW
// ============================================================

function draw() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    drawGround();

    drawRocks();

    drawTrees();

    drawBuildings();

    drawLoot();

    drawNPCs();

    drawBullets();

    drawEnemies();

    drawParticles();

    drawPlayer();

    drawDayNight();

    drawPlayerLight();

    drawWeather();

    drawMinimap();
}

// ============================================================
// GAME LOOP
// ============================================================

let lastTime =
    performance.now();

function gameLoop(time) {

    const dt =
        Math.min(
            (time - lastTime) /
            1000,
            0.05
        );

    lastTime = time;

    update(dt);

    draw();

    requestAnimationFrame(
        gameLoop
    );
}

// ============================================================
// START
// ============================================================

generateWorld();

updateCamera();

updateHUD();

gameLoop(
    performance.now()
);
