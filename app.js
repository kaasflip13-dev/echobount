// ============================================================
// ECHOBOUND — THE LOST SIGNAL
// Tank + Alien Edition
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas ? mapCanvas.getContext("2d") : null;

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;

window.addEventListener("resize", () => {
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;

    if (mapCanvas) {
        mapCanvas.width = Math.min(700, W - 60);
        mapCanvas.height = Math.min(700, H - 150);
    }
});

// ============================================================
// HELPERS
// ============================================================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function angleTo(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

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
let missionTarget = 15;

let gameTime = 0;
let weather = "clear";

let keys = {};
let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let trees = [];
let rocks = [];
let buildings = [];
let doors = [];
let loot = [];
let npcs = [];

let lastTime = performance.now();

// ============================================================
// PLAYER / TANK
// ============================================================

const player = {
    x: 0,
    y: 0,

    radius: 24,

    speed: 210,
    sprintSpeed: 310,

    angle: 0,
    turretAngle: 0,

    health: 100,
    maxHealth: 100,

    energy: 100,
    maxEnergy: 100,

    dashCooldown: 0,
    invincible: 0,

    weapon: 0,

    reloadTimer: 0,
    fireCooldown: 0,

    trackOffset: 0
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

// ============================================================
// COLORS
// ============================================================

const groundColors = [
    "#11191b",
    "#121c1d",
    "#101718",
    "#151e1f"
];

const alienColors = [
    "#55e6b2",
    "#7dff5a",
    "#8b7cff",
    "#5ce1e6",
    "#c77dff"
];

// ============================================================
// INPUT
// ============================================================

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if (e.key === " ") {
        e.preventDefault();

        if (gameRunning && !paused) {
            dash();
        }
    }

    if (e.key.toLowerCase() === "r") {
        reload();
    }

    if (e.key === "Escape") {
        if (gameRunning) {
            togglePause();
        }
    }

    if (e.key === "1") {
        player.weapon = 0;
    }

    if (e.key === "2") {
        player.weapon = 1;
    }

    if (e.key === "3") {
        player.weapon = 2;
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
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
// MENU BUTTONS
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
    newGameButton.addEventListener("click", () => {
        startNewGame();
    });
}

if (loadGameButton) {
    loadGameButton.addEventListener("click", () => {
        loadGame();
    });
}

if (achievementsButton) {
    achievementsButton.addEventListener("click", () => {
        showAchievements();
    });
}

if (controlsButton) {
    controlsButton.addEventListener("click", () => {
        showControls();
    });
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
    saveButton.addEventListener("click", () => {
        saveGame();
    });
}

if (quitButton) {
    quitButton.addEventListener("click", () => {
        quitToMenu();
    });
}

// ============================================================
// START GAME
// ============================================================

function startNewGame() {
    score = 0;
    kills = 0;
    credits = 0;
    xp = 0;
    level = 1;

    missionProgress = 0;

    player.x = 0;
    player.y = 0;

    player.health = player.maxHealth;
    player.energy = player.maxEnergy;

    player.weapon = 0;

    for (const weapon of weapons) {
        weapon.ammo = weapon.maxAmmo;
    }

    bullets = [];
    enemyBullets = [];
    enemies = [];
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

    updateHUD();
}

// ============================================================
// WORLD GENERATION
// ============================================================

function generateWorld() {
    trees = [];
    rocks = [];
    buildings = [];
    doors = [];
    loot = [];
    npcs = [];
    enemies = [];

    // -----------------------------
    // BUILDINGS
    // -----------------------------

    const buildingPositions = [
        [-1500, -900],
        [1000, -1400],
        [-1900, 900],
        [1200, 1000],
        [0, 1800],
        [1900, -200],
        [-3000, -200],
        [3000, 1300],
        [-3100, 1700]
    ];

    for (const p of buildingPositions) {
        const width = random(260, 430);
        const height = random(220, 360);

        buildings.push({
            x: p[0],
            y: p[1],
            w: width,
            h: height
        });

        // door
        doors.push({
            x: p[0] + width / 2 - 30,
            y: p[1] + height - 8,
            w: 60,
            h: 20,
            open: false
        });
    }

    // -----------------------------
    // TREES
    // -----------------------------

    for (let i = 0; i < 170; i++) {
        const p = randomWorldPosition();

        if (!nearBuildings(p.x, p.y, 100)) {
            trees.push({
                x: p.x,
                y: p.y,
                size: random(18, 38),
                type: randomInt(0, 2)
            });
        }
    }

    // -----------------------------
    // ROCKS
    // -----------------------------

    for (let i = 0; i < 100; i++) {
        const p = randomWorldPosition();

        if (!nearBuildings(p.x, p.y, 80)) {
            rocks.push({
                x: p.x,
                y: p.y,
                size: random(12, 32)
            });
        }
    }

    // -----------------------------
    // LOOT
    // -----------------------------

    for (let i = 0; i < 40; i++) {
        const p = randomWorldPosition();

        loot.push({
            x: p.x,
            y: p.y,
            type: Math.random() < 0.5 ? "energy" : "credits",
            collected: false,
            pulse: random(0, Math.PI * 2)
        });
    }

    // -----------------------------
    // NPCs
    // -----------------------------

    const npcColors = [
        "#527a78",
        "#765b4c",
        "#596b83",
        "#6f6a4d",
        "#704f62"
    ];

    const hairColors = [
        "#292321",
        "#3b3029",
        "#55463a",
        "#1e2526",
        "#806548"
    ];

    const skinColors = [
        "#c58e6b",
        "#d39b73",
        "#a96f50",
        "#e0ad83"
    ];

    for (let i = 0; i < 18; i++) {
        const p = randomWorldPosition();

        npcs.push({
            x: p.x,
            y: p.y,

            radius: 12,

            angle: Math.random() * Math.PI * 2,

            speed: random(10, 25),

            changeTimer: random(1, 4),

            clothing:
                npcColors[
                    Math.floor(
                        Math.random() *
                        npcColors.length
                    )
                ],

            hair:
                hairColors[
                    Math.floor(
                        Math.random() *
                        hairColors.length
                    )
                ],

            skin:
                skinColors[
                    Math.floor(
                        Math.random() *
                        skinColors.length
                    )
                ]
        });
    }

    // -----------------------------
    // INITIAL ALIENS
    // -----------------------------

    for (let i = 0; i < 3; i++) {
        spawnAlien();
    }

    weather = ["clear", "rain", "fog"][
        randomInt(0, 2)
    ];
}

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

function nearBuildings(x, y, distance) {
    for (const b of buildings) {
        const cx = clamp(x, b.x, b.x + b.w);
        const cy = clamp(y, b.y, b.y + b.h);

        if (dist(x, y, cx, cy) < distance) {
            return true;
        }
    }

    return false;
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

    return (
        dx * dx +
        dy * dy <
        radius * radius
    );
}

function blocked(
    x,
    y,
    radius = player.radius
) {
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

function hasLineOfSight(
    x1,
    y1,
    x2,
    y2
) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const distance = Math.hypot(
        dx,
        dy
    );

    const steps = Math.max(
        20,
        Math.ceil(distance / 12)
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
// ALIEN SPAWNING
// ============================================================

function spawnAlien() {
    if (
        enemies.length >= MAX_ENEMIES
    ) {
        return;
    }

    let p;

    for (let attempt = 0; attempt < 30; attempt++) {
        p = randomWorldPosition();

        if (
            dist(
                p.x,
                p.y,
                player.x,
                player.y
            ) > 700 &&
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

        radius: elite ? 31 : 25,

        health: elite ? 8 : 3,

        maxHealth: elite ? 8 : 3,

        speed: elite
            ? random(55, 80)
            : random(35, 60),

        angle: random(
            -Math.PI,
            Math.PI
        ),

        shootCooldown: random(
            1,
            3
        ),

        attackTimer: 0,

        elite,

        type: elite
            ? "guardian"
            : Math.random() < 0.3
                ? "crawler"
                : "stalker",

        pulse: random(
            0,
            Math.PI * 2
        )
    });
}

// ============================================================
// PLAYER UPDATE
// ============================================================

function updatePlayer(dt) {
    let dx = 0;
    let dy = 0;

    if (keys["w"]) dy -= 1;
    if (keys["s"]) dy += 1;
    if (keys["a"]) dx -= 1;
    if (keys["d"]) dx += 1;

    const length = Math.hypot(dx, dy);

    if (length > 0) {
        dx /= length;
        dy /= length;

        const sprint =
            keys["shift"] &&
            player.energy > 0;

        const speed = sprint
            ? player.sprintSpeed
            : player.speed;

        if (sprint) {
            player.energy -= 22 * dt;
        } else {
            player.energy += 12 * dt;
        }

        player.energy = clamp(
            player.energy,
            0,
            player.maxEnergy
        );

        const nx =
            player.x +
            dx * speed * dt;

        const ny =
            player.y +
            dy * speed * dt;

        if (
            !blocked(
                nx,
                player.y
            )
        ) {
            player.x = nx;
        }

        if (
            !blocked(
                player.x,
                ny
            )
        ) {
            player.y = ny;
        }

        player.angle = Math.atan2(
            dy,
            dx
        );

        player.trackOffset +=
            speed * dt * 0.04;
    } else {
        player.energy += 15 * dt;

        player.energy = clamp(
            player.energy,
            0,
            player.maxEnergy
        );
    }

    const worldMouse =
        screenToWorld(
            mouse.x,
            mouse.y
        );

    player.turretAngle =
        angleTo(
            player.x,
            player.y,
            worldMouse.x,
            worldMouse.y
        );

    player.fireCooldown -= dt;

    if (
        player.reloadTimer > 0
    ) {
        player.reloadTimer -= dt;

        if (
            player.reloadTimer <= 0
        ) {
            const weapon =
                weapons[player.weapon];

            weapon.ammo =
                weapon.maxAmmo;
        }
    }

    player.dashCooldown -= dt;

    player.invincible -= dt;

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
        dx = Math.cos(
            player.turretAngle
        );

        dy = Math.sin(
            player.turretAngle
        );
    }

    const length = Math.hypot(
        dx,
        dy
    );

    dx /= length;
    dy /= length;

    for (let i = 0; i < 12; i++) {
        const t = i / 12;

        const px =
            player.x +
            dx * 130 * t;

        const py =
            player.y +
            dy * 130 * t;

        if (
            !blocked(
                px,
                py
            )
        ) {
            player.x = px;
            player.y = py;
        }
    }

    player.energy -= 35;
    player.dashCooldown = 1.4;
    player.invincible = 0.35;

    createParticles(
        player.x,
        player.y,
        20
    );
}

// ============================================================
// SHOOTING
// ============================================================

function shoot() {
    const weapon =
        weapons[player.weapon];

    if (
        player.fireCooldown > 0
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

    const spread =
        player.weapon === 1
            ? random(-0.08, 0.08)
            : 0;

    const angle =
        player.turretAngle +
        spread;

    const startDistance = 35;

    bullets.push({
        x:
            player.x +
            Math.cos(angle) *
            startDistance,

        y:
            player.y +
            Math.sin(angle) *
            startDistance,

        oldX:
            player.x +
            Math.cos(angle) *
            startDistance,

        oldY:
            player.y +
            Math.sin(angle) *
            startDistance,

        vx:
            Math.cos(angle) *
            weapon.speed,

        vy:
            Math.sin(angle) *
            weapon.speed,

        damage:
            weapon.damage,

        life: 1.5,

        radius:
            player.weapon === 2
                ? 6
                : 4,

        type: player.weapon
    });

    createParticles(
        player.x +
        Math.cos(angle) * 32,

        player.y +
        Math.sin(angle) * 32,

        5
    );
}

function reload() {
    if (
        player.reloadTimer > 0
    ) {
        return;
    }

    const weapon =
        weapons[player.weapon];

    if (
        weapon.ammo >=
        weapon.maxAmmo
    ) {
        return;
    }

    player.reloadTimer = 0.9;
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

        b.oldX = b.x;
        b.oldY = b.y;

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        b.life -= dt;

        let removeBullet = false;

        // Building collision
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

        // Alien collision
        for (
            let j = enemies.length - 1;
            j >= 0;
            j--
        ) {
            const enemy =
                enemies[j];

            const d = dist(
                b.x,
                b.y,
                enemy.x,
                enemy.y
            );

            if (
                d <
                enemy.radius +
                b.radius
            ) {
                enemy.health -=
                    b.damage;

                createParticles(
                    b.x,
                    b.y,
                    7
                );

                removeBullet = true;

                if (
                    enemy.health <= 0
                ) {
                    kills++;

                    score += enemy.elite
                        ? 100
                        : 25;

                    credits += enemy.elite
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
                        enemy.elite
                            ? 25
                            : 16
                    );

                    enemies.splice(
                        j,
                        1
                    );

                    setTimeout(
                        spawnAlien,
                        500
                    );

                    if (
                        kills === 1
                    ) {
                        unlockAchievement(
                            "FIRST CONTACT"
                        );
                    }

                    if (
                        kills === 10
                    ) {
                        unlockAchievement(
                            "ALIEN HUNTER"
                        );
                    }
                }

                break;
            }
        }

        if (
            removeBullet ||
            b.life <= 0
        ) {
            bullets.splice(i, 1);
        }
    }
}

// ============================================================
// ENEMY BULLETS
// ============================================================

function shootEnemy(enemy) {
    const angle =
        angleTo(
            enemy.x,
            enemy.y,
            player.x,
            player.y
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

function updateEnemyBullets(dt) {
    for (
        let i = enemyBullets.length - 1;
        i >= 0;
        i--
    ) {
        const b =
            enemyBullets[i];

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        b.life -= dt;

        let remove = false;

        // Buildings stop alien shots
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
            enemyBullets.splice(i, 1);
            continue;
        }

        const d = dist(
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
// ALIEN AI
// ============================================================

function updateEnemies(dt) {
    for (const enemy of enemies) {
        enemy.pulse += dt * 3;

        const d = dist(
            enemy.x,
            enemy.y,
            player.x,
            player.y
        );

        const angle =
            angleTo(
                enemy.x,
                enemy.y,
                player.x,
                player.y
            );

        enemy.angle = angle;

        // Chase player
        if (d > 180) {
            const nx =
                enemy.x +
                Math.cos(angle) *
                enemy.speed *
                dt;

            const ny =
                enemy.y +
                Math.sin(angle) *
                enemy.speed *
                dt;

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

        // Attack player at close range
        if (d < 65) {
            enemy.attackTimer -= dt;

            if (
                enemy.attackTimer <= 0
            ) {
                if (
                    player.invincible <=
                    0
                ) {
                    player.health -=
                        enemy.elite
                            ? 18
                            : 10;

                    player.invincible =
                        0.5;

                    createParticles(
                        player.x,
                        player.y,
                        12
                    );
                }

                enemy.attackTimer = 1;
            }
        }

        // Shooting
        enemy.shootCooldown -= dt;

        if (
            enemy.shootCooldown <= 0 &&
            d < 1000
        ) {
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

            enemy.shootCooldown =
                random(
                    1.2,
                    2.8
                );

            if (enemy.elite) {
                enemy.shootCooldown *=
                    0.7;
            }
        }
    }
}

// ============================================================
// NPCS
// ============================================================

function updateNPCs(dt) {
    for (const npc of npcs) {
        npc.changeTimer -= dt;

        if (
            npc.changeTimer <= 0
        ) {
            npc.angle = random(
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

function updateLoot(dt) {
    for (const item of loot) {
        if (item.collected) {
            continue;
        }

        item.pulse += dt * 3;

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
                "credits"
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
                12
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
                150
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

            life: random(
                0.2,
                0.7
            ),

            maxLife: 0.7,

            size: random(
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

        if (
            p.life <= 0
        ) {
            particles.splice(
                i,
                1
            );
        }
    }
}

// ============================================================
// XP / LEVEL
// ============================================================

function addXP(amount) {
    xp += amount;

    const required =
        level * 100;

    if (
        xp >= required
    ) {
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
// DRAW WORLD
// ============================================================

function drawWorld() {
    const topLeft =
        screenToWorld(
            0,
            0
        );

    const bottomRight =
        screenToWorld(
            W,
            H
        );

    ctx.fillStyle =
        groundColors[0];

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    // Ground grid
    const grid = 100;

    ctx.strokeStyle =
        "rgba(100,180,170,0.05)";

    ctx.lineWidth = 1;

    const startX =
        Math.floor(
            topLeft.x / grid
        ) * grid;

    const startY =
        Math.floor(
            topLeft.y / grid
        ) * grid;

    for (
        let x = startX;
        x < bottomRight.x;
        x += grid
    ) {
        const sx =
            worldToScreen(
                x,
                0
            ).x;

        ctx.beginPath();
        ctx.moveTo(
            sx,
            0
        );

        ctx.lineTo(
            sx,
            H
        );

        ctx.stroke();
    }

    for (
        let y = startY;
        y < bottomRight.y;
        y += grid
    ) {
        const sy =
            worldToScreen(
                0,
                y
            ).y;

        ctx.beginPath();
        ctx.moveTo(
            0,
            sy
        );

        ctx.lineTo(
            W,
            sy
        );

        ctx.stroke();
    }

    // Trees
    for (const tree of trees) {
        if (
            tree.x < topLeft.x - 100 ||
            tree.x > bottomRight.x + 100 ||
            tree.y < topLeft.y - 100 ||
            tree.y > bottomRight.y + 100
        ) {
            continue;
        }

        drawTree(tree);
    }

    // Rocks
    for (const rock of rocks) {
        drawRock(rock);
    }

    // Buildings
    for (const building of buildings) {
        drawBuilding(building);
    }

    // Doors
    for (const door of doors) {
        drawDoor(door);
    }

    // Loot
    for (const item of loot) {
        if (!item.collected) {
            drawLoot(item);
        }
    }

    // NPCs
    for (const npc of npcs) {
        drawNPC(npc);
    }

    // Aliens
    for (const enemy of enemies) {
        drawAlien(enemy);
    }

    // Bullets
    for (const b of bullets) {
        drawBullet(b);
    }

    for (const b of enemyBullets) {
        drawEnemyBullet(b);
    }

    // Player tank
    drawTank();

    // Particles
    drawParticles();
}

// ============================================================
// TREE
// ============================================================

function drawTree(tree) {
    const p =
        worldToScreen(
            tree.x,
            tree.y
        );

    ctx.save();

    ctx.translate(
        p.x,
        p.y
    );

    // shadow
    ctx.fillStyle =
        "rgba(0,0,0,0.3)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        tree.size * 0.7,
        tree.size * 0.8,
        tree.size * 0.3,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // trunk
    ctx.fillStyle =
        "#493b2d";

    ctx.fillRect(
        -tree.size * 0.18,
        0,
        tree.size * 0.36,
        tree.size * 0.9
    );

    // foliage
    ctx.fillStyle =
        "#183d36";

    ctx.beginPath();

    ctx.arc(
        0,
        -tree.size * 0.15,
        tree.size * 0.65,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#235447";

    ctx.beginPath();

    ctx.arc(
        -tree.size * 0.3,
        -tree.size * 0.25,
        tree.size * 0.35,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#2c6854";

    ctx.beginPath();

    ctx.arc(
        tree.size * 0.3,
        -tree.size * 0.3,
        tree.size * 0.3,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

// ============================================================
// ROCK
// ============================================================

function drawRock(rock) {
    const p =
        worldToScreen(
            rock.x,
            rock.y
        );

    ctx.save();

    ctx.translate(
        p.x,
        p.y
    );

    ctx.fillStyle =
        "rgba(0,0,0,0.25)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        rock.size * 0.4,
        rock.size,
        rock.size * 0.35,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#343d3e";

    ctx.beginPath();

    ctx.moveTo(
        -rock.size,
        rock.size * 0.3
    );

    ctx.lineTo(
        -rock.size * 0.5,
        -rock.size * 0.7
    );

    ctx.lineTo(
        rock.size * 0.4,
        -rock.size * 0.6
    );

    ctx.lineTo(
        rock.size,
        rock.size * 0.2
    );

    ctx.lineTo(
        rock.size * 0.4,
        rock.size * 0.65
    );

    ctx.lineTo(
        -rock.size * 0.6,
        rock.size * 0.6
    );

    ctx.closePath();

    ctx.fill();

    ctx.restore();
}

// ============================================================
// BUILDING
// ============================================================

function drawBuilding(building) {
    const p =
        worldToScreen(
            building.x,
            building.y
        );

    ctx.save();

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.fillRect(
        p.x + 12,
        p.y + 14,
        building.w,
        building.h
    );

    ctx.fillStyle =
        "#252e31";

    ctx.fillRect(
        p.x,
        p.y,
        building.w,
        building.h
    );

    ctx.strokeStyle =
        "#506064";

    ctx.lineWidth = 3;

    ctx.strokeRect(
        p.x,
        p.y,
        building.w,
        building.h
    );

    // roof lines
    ctx.strokeStyle =
        "rgba(130,180,175,0.25)";

    ctx.lineWidth = 2;

    for (
        let x = 20;
        x < building.w;
        x += 45
    ) {
        ctx.beginPath();

        ctx.moveTo(
            p.x + x,
            p.y
        );

        ctx.lineTo(
            p.x + x,
            p.y + building.h
        );

        ctx.stroke();
    }

    // windows
    ctx.fillStyle =
        "#75b8b2";

    for (
        let x = 25;
        x < building.w - 30;
        x += 65
    ) {
        ctx.fillRect(
            p.x + x,
            p.y + 35,
            25,
            18
        );
    }

    ctx.restore();
}

// ============================================================
// DOOR
// ============================================================

function drawDoor(door) {
    const p =
        worldToScreen(
            door.x,
            door.y
        );

    ctx.save();

    ctx.fillStyle =
        door.open
            ? "#3f7770"
            : "#161c1e";

    ctx.fillRect(
        p.x,
        p.y,
        door.w,
        door.h
    );

    ctx.strokeStyle =
        "#6e9290";

    ctx.strokeRect(
        p.x,
        p.y,
        door.w,
        door.h
    );

    ctx.restore();
}

// ============================================================
// LOOT
// ============================================================

function drawLoot(item) {
    const p =
        worldToScreen(
            item.x,
            item.y
        );

    const pulse =
        Math.sin(
            item.pulse
        ) * 3;

    ctx.save();

    ctx.translate(
        p.x,
        p.y
    );

    ctx.fillStyle =
        item.type ===
        "credits"
            ? "#d8b65a"
            : "#62d9d1";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        7 + pulse,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
        "rgba(255,255,255,0.6)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        12 + pulse,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
}

// ============================================================
// TANK PLAYER
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

    // Rotate hull in movement direction
    ctx.rotate(
        player.angle
    );

    // -------------------------
    // Shadow
    // -------------------------

    ctx.fillStyle =
        "rgba(0,0,0,0.45)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        8,
        31,
        21,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // -------------------------
    // Left track
    // -------------------------

    ctx.fillStyle =
        "#151a1c";

    ctx.roundRect(
        -28,
        -25,
        56,
        13,
        5
    );

    ctx.fill();

    // -------------------------
    // Right track
    // -------------------------

    ctx.roundRect(
        -28,
        12,
        56,
        13,
        5
    );

    ctx.fill();

    // Track details
    ctx.strokeStyle =
        "#465154";

    ctx.lineWidth = 2;

    for (
        let x = -22;
        x <= 22;
        x += 11
    ) {
        ctx.beginPath();

        ctx.moveTo(
            x,
            -24
        );

        ctx.lineTo(
            x,
            -14
        );

        ctx.moveTo(
            x,
            14
        );

        ctx.lineTo(
            x,
            24
        );

        ctx.stroke();
    }

    // -------------------------
    // Tank hull
    // -------------------------

    ctx.fillStyle =
        "#405451";

    ctx.beginPath();

    ctx.roundRect(
        -25,
        -16,
        50,
        32,
        8
    );

    ctx.fill();

    ctx.strokeStyle =
        "#728682";

    ctx.lineWidth = 2;

    ctx.stroke();

    // armor plate
    ctx.fillStyle =
        "#536864";

    ctx.beginPath();

    ctx.roundRect(
        -17,
        -12,
        34,
        24,
        6
    );

    ctx.fill();

    // -------------------------
    // Turret
    // -------------------------

    ctx.save();

    ctx.rotate(
        player.turretAngle -
        player.angle
    );

    // cannon shadow
    ctx.fillStyle =
        "#111617";

    ctx.fillRect(
        5,
        -5,
        42,
        10
    );

    // cannon
    ctx.fillStyle =
        "#71827f";

    ctx.fillRect(
        5,
        -4,
        43,
        8
    );

    // cannon end
    ctx.fillStyle =
        "#26302f";

    ctx.fillRect(
        42,
        -6,
        9,
        12
    );

    // turret
    ctx.fillStyle =
        "#61746f";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        15,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
        "#93a7a1";

    ctx.lineWidth = 2;

    ctx.stroke();

    // turret light
    ctx.fillStyle =
        "#68d8cc";

    ctx.beginPath();

    ctx.arc(
        5,
        -7,
        2.5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // -------------------------
    // Tank lights
    // -------------------------

    ctx.fillStyle =
        "#65d6ca";

    ctx.beginPath();

    ctx.arc(
        22,
        -8,
        3,
        0,
        Math.PI * 2
    );

    ctx.arc(
        22,
        8,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // Invincibility effect
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
            35,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }
}

// ============================================================
// ALIEN
// ============================================================

function drawAlien(enemy) {
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
        "rgba(0,0,0,0.4)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        enemy.radius * 0.65,
        enemy.radius * 0.9,
        enemy.radius * 0.35,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    if (
        enemy.type ===
        "crawler"
    ) {
        drawCrawlerAlien(
            enemy,
            pulse
        );
    } else if (
        enemy.type ===
        "guardian"
    ) {
        drawGuardianAlien(
            enemy,
            pulse
        );
    } else {
        drawStalkerAlien(
            enemy,
            pulse
        );
    }

    // Health bar
    const barWidth =
        enemy.radius * 2;

    const healthPercent =
        enemy.health /
        enemy.maxHealth;

    ctx.fillStyle =
        "rgba(0,0,0,0.65)";

    ctx.fillRect(
        -barWidth / 2,
        -enemy.radius - 14,
        barWidth,
        5
    );

    ctx.fillStyle =
        enemy.elite
            ? "#b78cff"
            : "#62e6b5";

    ctx.fillRect(
        -barWidth / 2,
        -enemy.radius - 14,
        barWidth *
        healthPercent,
        5
    );

    ctx.restore();
}

// ============================================================
// STALKER ALIEN
// ============================================================

function drawStalkerAlien(
    enemy,
    pulse
) {
    const color =
        enemy.elite
            ? "#9d78ff"
            : "#51d8a9";

    // Body
    ctx.fillStyle =
        color;

    ctx.beginPath();

    ctx.ellipse(
        0,
        4,
        enemy.radius * 0.62,
        enemy.radius * 0.75,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Head
    ctx.fillStyle =
        enemy.elite
            ? "#b48cff"
            : "#6cebc0";

    ctx.beginPath();

    ctx.ellipse(
        0,
        -enemy.radius * 0.42,
        enemy.radius * 0.72,
        enemy.radius * 0.52,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Eyes
    ctx.fillStyle =
        "#07100e";

    ctx.beginPath();

    ctx.ellipse(
        -enemy.radius * 0.27,
        -enemy.radius * 0.42,
        enemy.radius * 0.18,
        enemy.radius * 0.27,
        -0.2,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        enemy.radius * 0.27,
        -enemy.radius * 0.42,
        enemy.radius * 0.18,
        enemy.radius * 0.27,
        0.2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Eye glow
    ctx.fillStyle =
        "#d9fff6";

    ctx.beginPath();

    ctx.arc(
        -enemy.radius * 0.27,
        -enemy.radius * 0.46,
        2,
        0,
        Math.PI * 2
    );

    ctx.arc(
        enemy.radius * 0.27,
        -enemy.radius * 0.46,
        2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Arms
    ctx.strokeStyle =
        color;

    ctx.lineWidth = 6;

    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(
        -enemy.radius * 0.5,
        0
    );

    ctx.lineTo(
        -enemy.radius * 0.95,
        10 + pulse
    );

    ctx.moveTo(
        enemy.radius * 0.5,
        0
    );

    ctx.lineTo(
        enemy.radius * 0.95,
        10 - pulse
    );

    ctx.stroke();

    // Alien legs
    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.moveTo(
        -8,
        enemy.radius * 0.55
    );

    ctx.lineTo(
        -14,
        enemy.radius
    );

    ctx.moveTo(
        8,
        enemy.radius * 0.55
    );

    ctx.lineTo(
        14,
        enemy.radius
    );

    ctx.stroke();

    // Antennas
    ctx.strokeStyle =
        "#8fffe0";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        -7,
        -enemy.radius * 0.8
    );

    ctx.lineTo(
        -12,
        -enemy.radius * 1.15
    );

    ctx.moveTo(
        7,
        -enemy.radius * 0.8
    );

    ctx.lineTo(
        12,
        -enemy.radius * 1.15
    );

    ctx.stroke();

    ctx.fillStyle =
        "#bffff0";

    ctx.beginPath();

    ctx.arc(
        -12,
        -enemy.radius * 1.15,
        3,
        0,
        Math.PI * 2
    );

    ctx.arc(
        12,
        -enemy.radius * 1.15,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

// ============================================================
// CRAWLER ALIEN
// ============================================================

function drawCrawlerAlien(
    enemy,
    pulse
) {
    const color =
        "#58d6c0";

    // Main body
    ctx.fillStyle =
        color;

    ctx.beginPath();

    ctx.ellipse(
        0,
        4,
        enemy.radius * 0.75,
        enemy.radius * 0.45,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Head
    ctx.fillStyle =
        "#72ead0";

    ctx.beginPath();

    ctx.arc(
        0,
        -8,
        enemy.radius * 0.4,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Large eye
    ctx.fillStyle =
        "#111a19";

    ctx.beginPath();

    ctx.arc(
        0,
        -9,
        enemy.radius * 0.25,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#eaffff";

    ctx.beginPath();

    ctx.arc(
        -2,
        -11,
        2.5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Tentacles
    ctx.strokeStyle =
        color;

    ctx.lineWidth = 4;

    ctx.lineCap = "round";

    for (
        let i = -2;
        i <= 2;
        i++
    ) {
        ctx.beginPath();

        ctx.moveTo(
            i * 8,
            10
        );

        ctx.quadraticCurveTo(
            i * 13,
            18 + pulse,
            i * 17,
            25
        );

        ctx.stroke();
    }
}

// ============================================================
// GUARDIAN ALIEN
// ============================================================

function drawGuardianAlien(
    enemy,
    pulse
) {
    const color =
        "#a879ff";

    // Outer body
    ctx.fillStyle =
        "#3e285f";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        enemy.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Armor
    ctx.strokeStyle =
        color;

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        enemy.radius - 4,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    // Head
    ctx.fillStyle =
        "#b98cff";

    ctx.beginPath();

    ctx.ellipse(
        0,
        -9,
        enemy.radius * 0.55,
        enemy.radius * 0.42,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Eyes
    ctx.fillStyle =
        "#170d24";

    ctx.beginPath();

    ctx.ellipse(
        -8,
        -9,
        5,
        7,
        -0.2,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        8,
        -9,
        5,
        7,
        0.2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Core
    ctx.fillStyle =
        "#e0c8ff";

    ctx.beginPath();

    ctx.arc(
        0,
        6,
        6 + pulse * 0.4,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Shoulder plates
    ctx.fillStyle =
        "#634391";

    ctx.fillRect(
        -enemy.radius - 3,
        -4,
        10,
        18
    );

    ctx.fillRect(
        enemy.radius - 7,
        -4,
        10,
        18
    );

    // Energy lines
    ctx.strokeStyle =
        "#d4a9ff";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        -14,
        8
    );

    ctx.lineTo(
        14,
        8
    );

    ctx.stroke();
}

// ============================================================
// NPC DRAW
// ============================================================

function drawNPC(npc) {
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

    const walking =
        Math.sin(
            performance.now() *
            0.008 +
            npc.x * 0.01
        );

    // Shadow
    ctx.fillStyle =
        "rgba(0,0,0,0.28)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        15,
        11,
        5,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Legs
    ctx.strokeStyle =
        "#20282b";

    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    ctx.beginPath();

    ctx.moveTo(
        -4,
        7
    );

    ctx.lineTo(
        -5 +
        walking * 3,
        17
    );

    ctx.moveTo(
        4,
        7
    );

    ctx.lineTo(
        5 -
        walking * 3,
        17
    );

    ctx.stroke();

    // Body
    ctx.fillStyle =
        npc.clothing;

    ctx.beginPath();

    ctx.roundRect(
        -9,
        -2,
        18,
        15,
        5
    );

    ctx.fill();

    // Jacket detail
    ctx.strokeStyle =
        "rgba(255,255,255,0.15)";

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.moveTo(
        0,
        0
    );

    ctx.lineTo(
        0,
        11
    );

    ctx.stroke();

    // Arms
    ctx.strokeStyle =
        npc.skin;

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.moveTo(
        -8,
        1
    );

    ctx.lineTo(
        -12,
        8 +
        walking * 2
    );

    ctx.moveTo(
        8,
        1
    );

    ctx.lineTo(
        12,
        8 -
        walking * 2
    );

    ctx.stroke();

    // Neck
    ctx.fillStyle =
        npc.skin;

    ctx.fillRect(
        -4,
        -7,
        8,
        7
    );

    // Head
    ctx.beginPath();

    ctx.arc(
        0,
        -12,
        9,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Hair
    ctx.fillStyle =
        npc.hair;

    ctx.beginPath();

    ctx.arc(
        0,
        -15,
        9,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();

    // Eyes
    ctx.fillStyle =
        "#202020";

    ctx.beginPath();

    ctx.arc(
        -3,
        -12,
        1.2,
        0,
        Math.PI * 2
    );

    ctx.arc(
        3,
        -12,
        1.2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Shoes
    ctx.fillStyle =
        "#171b1c";

    ctx.beginPath();

    ctx.ellipse(
        -6 +
        walking * 3,
        18,
        5,
        3,
        0,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        6 -
        walking * 3,
        18,
        5,
        3,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

// ============================================================
// BULLET DRAW
// ============================================================

function drawBullet(b) {
    const p =
        worldToScreen(
            b.x,
            b.y
        );

    ctx.save();

    ctx.translate(
        p.x,
        p.y
    );

    ctx.rotate(
        Math.atan2(
            b.vy,
            b.vx
        )
    );

    ctx.fillStyle =
        b.type === 2
            ? "#d6c17b"
            : "#6ee8dc";

    ctx.shadowBlur = 10;
    ctx.shadowColor =
        b.type === 2
            ? "#d6c17b"
            : "#6ee8dc";

    ctx.fillRect(
        -7,
        -2,
        14,
        4
    );

    ctx.restore();
}

function drawEnemyBullet(b) {
    const p =
        worldToScreen(
            b.x,
            b.y
        );

    ctx.save();

    ctx.translate(
        p.x,
        p.y
    );

    ctx.fillStyle =
        "#b78cff";

    ctx.shadowBlur = 14;
    ctx.shadowColor =
        "#b78cff";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        b.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}

// ============================================================
// PARTICLE DRAW
// ============================================================

function drawParticles() {
    for (const p of particles) {
        const screen =
            worldToScreen(
                p.x,
                p.y
            );

        const alpha =
            clamp(
                p.life /
                p.maxLife,
                0,
                1
            );

        ctx.fillStyle =
            `rgba(110,230,215,${alpha})`;

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
}

// ============================================================
// CAMERA
// ============================================================

function updateCamera() {
    camera.x +=
        (player.x -
            camera.x) *
        0.12;

    camera.y +=
        (player.y -
            camera.y) *
        0.12;
}

function worldToScreen(
    x,
    y
) {
    return {
        x:
            x -
            camera.x +
            W / 2,

        y:
            y -
            camera.y +
            H / 2
    };
}

function screenToWorld(
    x,
    y
) {
    return {
        x:
            x -
            W / 2 +
            camera.x,

        y:
            y -
            H / 2 +
            camera.y
    };
}

// ============================================================
// WEATHER
// ============================================================

function drawWeather() {
    if (weather === "rain") {
        ctx.strokeStyle =
            "rgba(130,190,210,0.22)";

        ctx.lineWidth = 1;

        for (let i = 0; i < 130; i++) {
            const x =
                (i * 83 +
                    gameTime * 350) %
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
                y + 16
            );

            ctx.stroke();
        }
    }

    if (weather === "fog") {
        const gradient =
            ctx.createRadialGradient(
                W / 2,
                H / 2,
                100,
                W / 2,
                H / 2,
                Math.max(W, H) * 0.7
            );

        gradient.addColorStop(
            0,
            "rgba(100,130,130,0)"
        );

        gradient.addColorStop(
            1,
            "rgba(80,110,110,0.25)"
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
}

// ============================================================
// DAY / NIGHT
// ============================================================

function drawLighting() {
    const cycle =
        (gameTime % 120) /
        120;

    const sun =
        Math.sin(
            cycle *
            Math.PI *
            2
        );

    if (sun < 0) {
        const darkness =
            Math.abs(sun) *
            0.42;

        ctx.fillStyle =
            `rgba(5,10,20,${darkness})`;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );
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

    const killsElement =
        document.getElementById(
            "kills"
        );

    const creditsElement =
        document.getElementById(
            "credits"
        );

    const ammoElement =
        document.getElementById(
            "ammo"
        );

    const objectiveElement =
        document.getElementById(
            "objective"
        );

    const zoneElement =
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

    if (killsElement) {
        killsElement.textContent =
            `KILLS: ${kills}`;
    }

    if (creditsElement) {
        creditsElement.textContent =
            `CREDITS: ${credits}`;
    }

    if (ammoElement) {
        const weapon =
            weapons[player.weapon];

        ammoElement.textContent =
            player.reloadTimer > 0
                ? "RELOADING..."
                : `${weapon.ammo} / ∞`;
    }

    if (objectiveElement) {
        objectiveElement.textContent =
            missionProgress >=
            missionTarget
                ? "SIGNAL FOUND"
                : `FIND THE SIGNAL • ${missionProgress}/${missionTarget}`;
    }

    if (zoneElement) {
        zoneElement.textContent =
            `SECTOR ${level} • ${weather.toUpperCase()}`;
    }
}

// ============================================================
// PAUSE
// ============================================================

function togglePause() {
    paused = !paused;

    if (pauseMenu) {
        pauseMenu.style.display =
            paused
                ? "flex"
                : "none";
    }
}

// ============================================================
// SAVE / LOAD
// ============================================================

function saveGame() {
    const saveData = {
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
        xp,
        level,
        missionProgress,

        weapons: weapons.map(
            weapon => ({
                ammo: weapon.ammo
            })
        )
    };

    localStorage.setItem(
        "echoboundSave",
        JSON.stringify(
            saveData
        )
    );

    if (typeof alert === "function") {
        alert(
            "RUN SAVED!"
        );
    }
}

function loadGame() {
    const raw =
        localStorage.getItem(
            "echoboundSave"
        );

    if (!raw) {
        if (typeof alert === "function") {
            alert(
                "NO SAVE FOUND."
            );
        }

        return;
    }

    try {
        const data =
            JSON.parse(raw);

        score =
            data.score || 0;

        kills =
            data.kills || 0;

        credits =
            data.credits || 0;

        xp =
            data.xp || 0;

        level =
            data.level || 1;

        missionProgress =
            data.missionProgress || 0;

        generateWorld();

        player.x =
            data.player?.x || 0;

        player.y =
            data.player?.y || 0;

        player.health =
            data.player?.health ??
            player.maxHealth;

        player.energy =
            data.player?.energy ??
            player.maxEnergy;

        player.weapon =
            data.player?.weapon || 0;

        if (data.weapons) {
            data.weapons.forEach(
                (savedWeapon, i) => {
                    if (
                        weapons[i] &&
                        typeof savedWeapon.ammo ===
                        "number"
                    ) {
                        weapons[i].ammo =
                            savedWeapon.ammo;
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
        console.error(
            error
        );

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

const achievementList = [
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
    const achievements =
        getAchievements();

    if (
        achievements.includes(name)
    ) {
        return;
    }

    achievements.push(name);

    localStorage.setItem(
        "echoboundAchievements",
        JSON.stringify(
            achievements
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
    const achievements =
        getAchievements();

    let text =
        "ACHIEVEMENTS\n\n";

    for (
        const achievement
        of achievementList
    ) {
        text +=
            achievements.includes(
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
        "WASD = Move tank\n" +
        "SHIFT = Sprint\n" +
        "MOUSE = Aim\n" +
        "LEFT CLICK = Shoot\n" +
        "R = Reload\n" +
        "SPACE = Dash\n" +
        "1 = Pulse\n" +
        "2 = Burst\n" +
        "3 = Cannon\n" +
        "ESC = Pause"
    );
}

// ============================================================
// MAP
// ============================================================

function drawMap() {
    if (!mapCtx) {
        return;
    }

    const map =
        document.getElementById(
            "map"
        );

    if (
        !map ||
        getComputedStyle(map).display ===
        "none"
    ) {
        return;
    }

    const mw =
        mapCanvas.width;

    const mh =
        mapCanvas.height;

    mapCtx.fillStyle =
        "#101719";

    mapCtx.fillRect(
        0,
        0,
        mw,
        mh
    );

    const scale =
        Math.min(
            mw / WORLD_W,
            mh / WORLD_H
        );

    function mx(x) {
        return (
            mw / 2 +
            x * scale
        );
    }

    function my(y) {
        return (
            mh / 2 +
            y * scale
        );
    }

    // Buildings
    mapCtx.fillStyle =
        "#39494a";

    for (const b of buildings) {
        mapCtx.fillRect(
            mx(b.x),
            my(b.y),
            b.w * scale,
            b.h * scale
        );
    }

    // Aliens
    for (const enemy of enemies) {
        mapCtx.fillStyle =
            enemy.elite
                ? "#a879ff"
                : "#58d6b4";

        mapCtx.beginPath();

        mapCtx.arc(
            mx(enemy.x),
            my(enemy.y),
            5,
            0,
            Math.PI * 2
        );

        mapCtx.fill();
    }

    // Player
    mapCtx.fillStyle =
        "#74e5db";

    mapCtx.beginPath();

    mapCtx.arc(
        mx(player.x),
        my(player.y),
        7,
        0,
        Math.PI * 2
    );

    mapCtx.fill();
}

// ============================================================
// MAP BUTTON
// ============================================================

const closeMap =
    document.getElementById(
        "closeMap"
    );

if (closeMap) {
    closeMap.addEventListener(
        "click",
        () => {
            const map =
                document.getElementById(
                    "map"
                );

            if (map) {
                map.style.display =
                    "none";
            }
        }
    );
}

// Press M to open map
window.addEventListener(
    "keydown",
    e => {
        if (
            e.key.toLowerCase() ===
            "m"
        ) {
            const map =
                document.getElementById(
                    "map"
                );

            if (map) {
                map.style.display =
                    getComputedStyle(map)
                        .display ===
                    "none"
                        ? "flex"
                        : "none";

                drawMap();
            }
        }
    }
);

// ============================================================
// GAME OVER
// ============================================================

function gameOver() {
    gameRunning = false;
    paused = false;

    mouse.down = false;

    if (typeof alert === "function") {
        alert(
            "TANK DESTROYED\n\n" +
            `KILLS: ${kills}\n` +
            `SCORE: ${score}\n` +
            `LEVEL: ${level}`
        );
    }

    if (menu) {
        menu.style.display =
            "flex";
    }
}

// ============================================================
// MAIN UPDATE
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
    updateCamera();

    if (
        player.health <= 0
    ) {
        player.health = 0;
        gameOver();
    }

    updateHUD();
}

// ============================================================
// MAIN DRAW
// ============================================================

function draw() {
    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    drawWorld();
    drawWeather();
    drawLighting();

    // Crosshair
    if (gameRunning) {
        drawCrosshair();
    }

    drawMap();
}

// ============================================================
// CROSSHAIR
// ============================================================

function drawCrosshair() {
    ctx.save();

    ctx.strokeStyle =
        "rgba(130,240,225,0.8)";

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

    ctx.beginPath();

    ctx.arc(
        mouse.x,
        mouse.y,
        2,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
}

// ============================================================
// GAME LOOP
// ============================================================

function gameLoop(now) {
    let dt =
        (now - lastTime) /
        1000;

    lastTime = now;

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
// START
// ============================================================

generateWorld();

updateHUD();

requestAnimationFrame(
    gameLoop
);
