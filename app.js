// ============================================================
// ECHOBOUND - THE LOST SIGNAL
// Nieuwe JavaScript versie
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
// GAME SETTINGS
// ============================================================

const WORLD_W = 7000;
const WORLD_H = 7000;

const MAX_ENEMIES = 12;

let gameRunning = false;
let paused = false;

let cameraX = 0;
let cameraY = 0;

let gameTime = 0;

let score = 0;
let kills = 0;
let credits = 0;
let level = 1;
let xp = 0;

let missionProgress = 0;
const missionTarget = 20;

// ============================================================
// INPUT
// ============================================================

const keys = new Set();

const mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

// Keyboard
window.addEventListener("keydown", e => {

    if (
        [
            "KeyW",
            "KeyA",
            "KeyS",
            "KeyD",
            "ShiftLeft",
            "ShiftRight",
            "Space"
        ].includes(e.code)
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

window.addEventListener("keyup", e => {
    keys.delete(e.code);
});

// Prevent stuck movement
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

// Mouse
canvas.addEventListener("pointermove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener("pointerdown", e => {

    if (e.button === 0) {
        mouse.down = true;

        if (
            canvas.setPointerCapture
        ) {
            canvas.setPointerCapture(
                e.pointerId
            );
        }
    }
});

window.addEventListener("pointerup", e => {

    if (e.button === 0) {
        mouse.down = false;
    }
});

canvas.addEventListener(
    "contextmenu",
    e => e.preventDefault()
);

// ============================================================
// PLAYER
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
// WEAPONS
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
// WORLD OBJECTS
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
// HELPERS
// ============================================================

function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

function random(min, max) {
    return Math.random() *
        (max - min) +
        min;
}

function distance(
    x1,
    y1,
    x2,
    y2
) {
    return Math.hypot(
        x2 - x1,
        y2 - y1
    );
}

// ============================================================
// MENU
// ============================================================

const menu =
    document.getElementById(
        "menu"
    );

const pauseMenu =
    document.getElementById(
        "pause"
    );

const newGameButton =
    document.getElementById(
        "newGame"
    );

const loadGameButton =
    document.getElementById(
        "loadGame"
    );

const achievementsButton =
    document.getElementById(
        "achievementsButton"
    );

const controlsButton =
    document.getElementById(
        "controlsButton"
    );

const resumeButton =
    document.getElementById(
        "resume"
    );

const saveButton =
    document.getElementById(
        "save"
    );

const quitButton =
    document.getElementById(
        "quit"
    );

if (newGameButton) {
    newGameButton.onclick =
        startNewGame;
}

if (loadGameButton) {
    loadGameButton.onclick =
        loadGame;
}

if (achievementsButton) {
    achievementsButton.onclick =
        showAchievements;
}

if (controlsButton) {
    controlsButton.onclick =
        showControls;
}

if (resumeButton) {
    resumeButton.onclick = () => {

        paused = false;

        if (pauseMenu) {
            pauseMenu.style.display =
                "none";
        }
    };
}

if (saveButton) {
    saveButton.onclick =
        saveGame;
}

if (quitButton) {
    quitButton.onclick =
        quitToMenu;
}

// ============================================================
// NEW GAME
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

    player.health =
        player.maxHealth;

    player.energy =
        player.maxEnergy;

    player.weapon = 0;

    player.fireCooldown = 0;
    player.reloadTimer = 0;
    player.dashCooldown = 0;

    for (const weapon of weapons) {
        weapon.ammo =
            weapon.maxAmmo;
    }

    bullets = [];
    enemyBullets = [];
    particles = [];

    generateWorld();

    // MORE ALIENS
    for (let i = 0; i < 10; i++) {
        spawnAlien();
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

    // MANY BUILDINGS
    const buildingPositions = [

        [-2800, -2200],
        [-1900, -2300],
        [-800, -2100],
        [400, -2300],
        [1600, -2100],
        [2700, -2300],

        [-3000, -1300],
        [-2000, -1200],
        [-900, -1300],
        [200, -1200],
        [1300, -1300],
        [2500, -1200],

        [-3000, -300],
        [-2100, -400],
        [-1100, -300],
        [0, -500],
        [1100, -350],
        [2200, -400],
        [3000, -300],

        [-2900, 700],
        [-1900, 800],
        [-800, 700],
        [300, 850],
        [1400, 700],
        [2500, 800],

        [-2800, 1800],
        [-1700, 1900],
        [-600, 1800],
        [600, 1900],
        [1700, 1800],
        [2800, 1900],

        [-2200, 2700],
        [-900, 2800],
        [400, 2700],
        [1600, 2800],

        // Extra central buildings
        [-500, 300],
        [500, 300],
        [-400, 1100],
        [700, 1200]

    ];

    for (
        const position
        of buildingPositions
    ) {

        const width =
            random(260, 400);

        const height =
            random(220, 330);

        buildings.push({

            x: position[0],
            y: position[1],

            w: width,
            h: height
        });

        doors.push({

            x:
                position[0] +
                width / 2 -
                30,

            y:
                position[1] +
                height -
                8,

            w: 60,
            h: 18,

            open: false
        });
    }

    // TREES
    for (
        let i = 0;
        i < 240;
        i++
    ) {

        const x =
            random(
                -WORLD_W / 2 + 100,
                WORLD_W / 2 - 100
            );

        const y =
            random(
                -WORLD_H / 2 + 100,
                WORLD_H / 2 - 100
            );

        if (
            !nearBuilding(
                x,
                y,
                100
            )
        ) {

            trees.push({

                x,
                y,

                size:
                    random(
                        18,
                        38
                    )
            });
        }
    }

    // ROCKS
    for (
        let i = 140;
        i--;
    ) {

        const x =
            random(
                -WORLD_W / 2,
                WORLD_W / 2
            );

        const y =
            random(
                -WORLD_H / 2,
                WORLD_H / 2
            );

        rocks.push({

            x,
            y,

            size:
                random(
                    12,
                    28
                )
        });
    }

    // LOOT
    for (
        let i = 0;
        i < 60;
        i++
    ) {

        loot.push({

            x:
                random(
                    -3000,
                    3000
                ),

            y:
                random(
                    -3000,
                    3000
                ),

            type:
                Math.random() <
                0.5
                    ? "energy"
                    : "credits",

            collected: false,

            pulse:
                random(
                    0,
                    Math.PI * 2
                )
        });
    }

    // NPCS
    for (
        let i = 0;
        i < 25;
        i++
    ) {

        npcs.push({

            x:
                random(
                    -3000,
                    3000
                ),

            y:
                random(
                    -3000,
                    3000
                ),

            angle:
                random(
                    0,
                    Math.PI * 2
                ),

            speed:
                random(
                    10,
                    25
                ),

            timer:
                random(
                    1,
                    4
                ),

            clothing:
                [
                    "#527a78",
                    "#765b4c",
                    "#596b83",
                    "#596d4d",
                    "#704f62"
                ][
                    Math.floor(
                        Math.random() *
                        5
                    )
                ]
        });
    }
}

// ============================================================
// BUILDING CHECK
// ============================================================

function nearBuilding(
    x,
    y,
    range
) {

    for (
        const building
        of buildings
    ) {

        const closestX =
            clamp(
                x,
                building.x,
                building.x +
                    building.w
            );

        const closestY =
            clamp(
                y,
                building.y,
                building.y +
                    building.h
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

function circleRectCollision(
    cx,
    cy,
    radius,
    rect
) {

    const closestX =
        clamp(
            cx,
            rect.x,
            rect.x +
                rect.w
        );

    const closestY =
        clamp(
            cy,
            rect.y,
            rect.y +
                rect.h
        );

    const dx =
        cx -
        closestX;

    const dy =
        cy -
        closestY;

    return (
        dx * dx +
        dy * dy
    ) <
    radius * radius;
}

function blocked(
    x,
    y,
    radius
) {

    const limitX =
        WORLD_W / 2 -
        radius;

    const limitY =
        WORLD_H / 2 -
        radius;

    if (
        x < -limitX ||
        x > limitX ||
        y < -limitY ||
        y > limitY
    ) {
        return true;
    }

    for (
        const building
        of buildings
    ) {

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

    return false;
}

// ============================================================
// PLAYER UPDATE
// ============================================================

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;

    // WASD
    if (keys.has("KeyW")) {
        dy--;
    }

    if (keys.has("KeyS")) {
        dy++;
    }

    if (keys.has("KeyA")) {
        dx--;
    }

    if (keys.has("KeyD")) {
        dx++;
    }

    const length =
        Math.hypot(
            dx,
            dy
        );

    if (length > 0) {

        dx /= length;
        dy /= length;

        const sprint =
            (
                keys.has(
                    "ShiftLeft"
                ) ||
                keys.has(
                    "ShiftRight"
                )
            ) &&
            player.energy > 0;

        const speed =
            sprint
                ? player.sprintSpeed
                : player.speed;

        if (sprint) {

            player.energy -=
                28 * dt;

        } else {

            player.energy +=
                16 * dt;
        }

        const newX =
            player.x +
            dx *
            speed *
            dt;

        const newY =
            player.y +
            dy *
            speed *
            dt;

        // X
        if (
            !blocked(
                newX,
                player.y,
                player.radius
            )
        ) {

            player.x =
                newX;
        }

        // Y
        if (
            !blocked(
                player.x,
                newY,
                player.radius
            )
        ) {

            player.y =
                newY;
        }

        player.angle =
            Math.atan2(
                dy,
                dx
            );

    } else {

        player.energy +=
            16 * dt;
    }

    player.energy =
        clamp(
            player.energy,
            0,
            player.maxEnergy
        );

    // Aim
    const target =
        screenToWorld(
            mouse.x,
            mouse.y
        );

    player.turretAngle =
        Math.atan2(
            target.y -
                player.y,
            target.x -
                player.x
        );

    // Timers
    player.fireCooldown -= dt;

    if (
        player.fireCooldown < 0
    ) {
        player.fireCooldown = 0;
    }

    if (
        player.reloadTimer > 0
    ) {

        player.reloadTimer -= dt;

        if (
            player.reloadTimer <= 0
        ) {

            weapons[
                player.weapon
            ].ammo =
                weapons[
                    player.weapon
                ].maxAmmo;

            player.reloadTimer = 0;
        }
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

    // Shoot while moving
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

    if (!gameRunning) {
        return;
    }

    if (
        player.dashCooldown > 0 ||
        player.energy < 35
    ) {
        return;
    }

    let dx = 0;
    let dy = 0;

    if (
        keys.has("KeyW")
    ) dy--;

    if (
        keys.has("KeyS")
    ) dy++;

    if (
        keys.has("KeyA")
    ) dx--;

    if (
        keys.has("KeyD")
    ) dx++;

    if (
        dx === 0 &&
        dy === 0
    ) {

        dx =
            Math.cos(
                player.turretAngle
            );

        dy =
            Math.sin(
                player.turretAngle
            );
    }

    const length =
        Math.hypot(
            dx,
            dy
        );

    dx /= length;
    dy /= length;

    const distanceDash = 150;

    const newX =
        player.x +
        dx *
        distanceDash;

    const newY =
        player.y +
        dy *
        distanceDash;

    if (
        !blocked(
            newX,
            player.y,
            player.radius
        )
    ) {

        player.x =
            newX;
    }

    if (
        !blocked(
            player.x,
            newY,
            player.radius
        )
    ) {

        player.y =
            newY;
    }

    player.energy -= 35;

    player.dashCooldown =
        1.2;

    player.invincible =
        0.35;

    createParticles(
        player.x,
        player.y,
        20
    );
}

// ============================================================
// SHOOT
// ============================================================

function shoot() {

    const weapon =
        weapons[
            player.weapon
        ];

    if (
        player.fireCooldown > 0 ||
        player.reloadTimer > 0
    ) {
        return;
    }

    if (
        weapon.ammo <= 0
    ) {

        reload();
        return;
    }

    weapon.ammo--;

    player.fireCooldown =
        weapon.fireRate;

    let angle =
        player.turretAngle;

    // Burst spread
    if (
        player.weapon === 1
    ) {

        angle +=
            random(
                -0.055,
                0.055
            );
    }

    const bulletSpeed =
        weapon.speed;

    bullets.push({

        x:
            player.x +
            Math.cos(angle) *
            42,

        y:
            player.y +
            Math.sin(angle) *
            42,

        vx:
            Math.cos(angle) *
            bulletSpeed,

        vy:
            Math.sin(angle) *
            bulletSpeed,

        damage:
            weapon.damage,

        radius:
            player.weapon === 2
                ? 7
                : 4,

        life: 1.6
    });

    createParticles(
        player.x +
            Math.cos(angle) *
            42,

        player.y +
            Math.sin(angle) *
            42,

        5
    );
}

// ============================================================
// RELOAD
// ============================================================

function reload() {

    const weapon =
        weapons[
            player.weapon
        ];

    if (
        player.reloadTimer > 0
    ) {
        return;
    }

    if (
        weapon.ammo >=
        weapon.maxAmmo
    ) {
        return;
    }

    player.reloadTimer =
        0.8;
}

// ============================================================
// BULLETS
// ============================================================

function updateBullets(dt) {

    for (
        let i =
            bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];

        bullet.x +=
            bullet.vx *
            dt;

        bullet.y +=
            bullet.vy *
            dt;

        bullet.life -= dt;

        let remove = false;

        // Building
        for (
            const building
            of buildings
        ) {

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

            bullets.splice(
                i,
                1
            );

            continue;
        }

        // Alien
        for (
            let j =
                enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy =
                enemies[j];

            if (
                distance(
                    bullet.x,
                    bullet.y,
                    enemy.x,
                    enemy.y
                ) <
                bullet.radius +
                enemy.radius
            ) {

                enemy.health -=
                    bullet.damage;

                createParticles(
                    bullet.x,
                    bullet.y,
                    8
                );

                remove = true;

                if (
                    enemy.health <= 0
                ) {

                    killAlien(
                        enemy
                    );

                    enemies.splice(
                        j,
                        1
                    );

                    setTimeout(
                        spawnAlien,
                        700
                    );
                }

                break;
            }
        }

        if (
            remove ||
            bullet.life <= 0
        ) {

            bullets.splice(
                i,
                1
            );
        }
    }
}

// ============================================================
// ALIEN SPAWN
// ============================================================

function spawnAlien() {

    if (
        !gameRunning ||
        enemies.length >=
            MAX_ENEMIES
    ) {
        return;
    }

    let x;
    let y;

    for (
        let tries = 0;
        tries < 50;
        tries++
    ) {

        x =
            random(
                -3300,
                3300
            );

        y =
            random(
                -3300,
                3300
            );

        if (
            distance(
                x,
                y,
                player.x,
                player.y
            ) > 700 &&
            !blocked(
                x,
                y,
                35
            )
        ) {
            break;
        }
    }

    const elite =
        Math.random() <
        0.18;

    const type =
        elite
            ? "guardian"
            : Math.random() <
                0.35
                ? "crawler"
                : "stalker";

    enemies.push({

        x,
        y,

        radius:
            elite
                ? 32
                : 25,

        health:
            elite
                ? 8
                : 3,

        maxHealth:
            elite
                ? 8
                : 3,

        speed:
            elite
                ? 60
                : type === "crawler"
                    ? 55
                    : 45,

        type,

        elite,

        shootCooldown:
            random(
                1,
                3
            ),

        attackCooldown: 0,

        pulse:
            random(
                0,
                Math.PI * 2
            )
    });
}

// ============================================================
// ALIENS
// ============================================================

function updateEnemies(dt) {

    for (
        const enemy
        of enemies
    ) {

        enemy.pulse +=
            dt * 3;

        const d =
            distance(
                enemy.x,
                enemy.y,
                player.x,
                player.y
            );

        const angle =
            Math.atan2(
                player.y -
                    enemy.y,
                player.x -
                    enemy.x
            );

        if (
            d > 180
        ) {

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

                enemy.x =
                    newX;
            }

            if (
                !blocked(
                    enemy.x,
                    newY,
                    enemy.radius
                )
            ) {

                enemy.y =
                    newY;
            }
        }

        // Attack
        enemy.attackCooldown -= dt;

        if (
            d < 75 &&
            enemy.attackCooldown <= 0
        ) {

            if (
                player.invincible <= 0
            ) {

                player.health -=
                    enemy.elite
                        ? 18
                        : 10;

                player.invincible =
                    0.4;

                createParticles(
                    player.x,
                    player.y,
                    10
                );
            }

            enemy.attackCooldown =
                1;
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

            shootEnemy(
                enemy
            );

            enemy.shootCooldown =
                enemy.elite
                    ? random(
                        0.8,
                        1.7
                    )
                    : random(
                        1.4,
                        2.8
                    );
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

    const dx =
        x2 - x1;

    const dy =
        y2 - y1;

    const d =
        Math.hypot(
            dx,
            dy
        );

    const steps =
        Math.ceil(
            d / 15
        );

    for (
        let i = 1;
        i < steps;
        i++
    ) {

        const t =
            i / steps;

        const x =
            x1 +
            dx * t;

        const y =
            y1 +
            dy * t;

        for (
            const building
            of buildings
        ) {

            if (
                x >=
                    building.x &&
                x <=
                    building.x +
                    building.w &&
                y >=
                    building.y &&
                y <=
                    building.y +
                    building.h
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
            player.y -
                enemy.y,
            player.x -
                enemy.x
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
        let i =
            enemyBullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            enemyBullets[i];

        bullet.x +=
            bullet.vx *
            dt;

        bullet.y +=
            bullet.vy *
            dt;

        bullet.life -= dt;

        let remove = false;

        for (
            const building
            of buildings
        ) {

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

            enemyBullets.splice(
                i,
                1
            );

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
            bullet.life <= 0
        ) {

            enemyBullets.splice(
                i,
                1
            );
        }
    }
}

// ============================================================
// NPC
// ============================================================

function updateNPCs(dt) {

    for (
        const npc
        of npcs
    ) {

        npc.timer -= dt;

        if (
            npc.timer <= 0
        ) {

            npc.angle =
                random(
                    0,
                    Math.PI * 2
                );

            npc.timer =
                random(
                    1,
                    4
                );
        }

        const nx =
            npc.x +
            Math.cos(
                npc.angle
            ) *
            npc.speed *
            dt;

        const ny =
            npc.y +
            Math.sin(
                npc.angle
            ) *
            npc.speed *
            dt;

        if (
            !blocked(
                nx,
                npc.y,
                11
            )
        ) {

            npc.x = nx;
        }

        if (
            !blocked(
                npc.x,
                ny,
                11
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

    for (
        const item
        of loot
    ) {

        if (
            item.collected
        ) {
            continue;
        }

        item.pulse +=
            dt * 4;

        if (
            distance(
                player.x,
                player.y,
                item.x,
                item.y
            ) < 40
        ) {

            item.collected =
                true;

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
                        player.energy +
                            35
                    );
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
        let i =
            particles.length - 1;
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
// CAMERA
// ============================================================

function updateCamera(dt) {

    cameraX +=
        (
            player.x -
            cameraX
        ) *
        Math.min(
            1,
            dt * 8
        );

    cameraY +=
        (
            player.y -
            cameraY
        ) *
        Math.min(
            1,
            dt * 8
        );
}

function worldToScreen(
    x,
    y
) {

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

function screenToWorld(
    x,
    y
) {

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
// DRAW WORLD
// ============================================================

function draw() {

    ctx.fillStyle =
        "#101719";

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

    drawCrosshair();
}

// ============================================================
// GRID
// ============================================================

function drawGrid() {

    const grid = 100;

    ctx.strokeStyle =
        "rgba(100,180,170,0.06)";

    ctx.lineWidth = 1;

    const startX =
        Math.floor(
            (
                cameraX -
                W / 2
            ) /
            grid
        ) *
        grid;

    const startY =
        Math.floor(
            (
                cameraY -
                H / 2
            ) /
            grid
        ) *
        grid;

    for (
        let x =
            startX;
        x <
            cameraX +
            W;
        x += grid
    ) {

        const p =
            worldToScreen(
                x,
                0
            );

        ctx.beginPath();

        ctx.moveTo(
            p.x,
            0
        );

        ctx.lineTo(
            p.x,
            H
        );

        ctx.stroke();
    }

    for (
        let y =
            startY;
        y <
            cameraY +
            H;
        y += grid
    ) {

        const p =
            worldToScreen(
                0,
                y
            );

        ctx.beginPath();

        ctx.moveTo(
            0,
            p.y
        );

        ctx.lineTo(
            W,
            p.y
        );

        ctx.stroke();
    }
}

// ============================================================
// TREES
// ============================================================

function drawTrees() {

    for (
        const tree
        of trees
    ) {

        const p =
            worldToScreen(
                tree.x,
                tree.y
            );

        if (
            p.x < -80 ||
            p.x > W + 80 ||
            p.y < -80 ||
            p.y > H + 80
        ) {
            continue;
        }

        ctx.fillStyle =
            "rgba(0,0,0,0.3)";

        ctx.beginPath();

        ctx.ellipse(
            p.x,
            p.y + 15,
            tree.size,
            tree.size *
                0.35,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#49372b";

        ctx.fillRect(
            p.x - 4,
            p.y - 5,
            8,
            tree.size
        );

        ctx.fillStyle =
            "#245548";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y - 15,
            tree.size *
                0.7,
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

    for (
        const rock
        of rocks
    ) {

        const p =
            worldToScreen(
                rock.x,
                rock.y
            );

        ctx.fillStyle =
            "#394547";

        ctx.beginPath();

        ctx.ellipse(
            p.x,
            p.y,
            rock.size,
            rock.size *
                0.6,
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

    for (
        const b
        of buildings
    ) {

        const p =
            worldToScreen(
                b.x,
                b.y
            );

        if (
            p.x > W ||
            p.x + b.w < 0 ||
            p.y > H ||
            p.y + b.h < 0
        ) {
            continue;
        }

        // Shadow
        ctx.fillStyle =
            "rgba(0,0,0,0.4)";

        ctx.fillRect(
            p.x + 12,
            p.y + 12,
            b.w,
            b.h
        );

        // Building
        ctx.fillStyle =
            "#293437";

        ctx.fillRect(
            p.x,
            p.y,
            b.w,
            b.h
        );

        // Border
        ctx.strokeStyle =
            "#627477";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            p.x,
            p.y,
            b.w,
            b.h
        );

        // Windows
        ctx.fillStyle =
            "#62bbb3";

        for (
            let x = 25;
            x <
            b.w - 30;
            x += 65
        ) {

            ctx.fillRect(
                p.x + x,
                p.y + 30,
                26,
                17
            );
        }

        // Roof detail
        ctx.strokeStyle =
            "#405054";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            p.x + 15,
            p.y + b.h / 2
        );

        ctx.lineTo(
            p.x + b.w - 15,
            p.y + b.h / 2
        );

        ctx.stroke();
    }
}

// ============================================================
// DOORS
// ============================================================

function drawDoors() {

    for (
        const door
        of doors
    ) {

        const p =
            worldToScreen(
                door.x,
                door.y
            );

        ctx.fillStyle =
            "#111719";

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

    for (
        const item
        of loot
    ) {

        if (
            item.collected
        ) {
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
            item.type ===
            "credits"
                ? "#e0bd5e"
                : "#62ded1";

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

    for (
        const npc
        of npcs
    ) {

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

        // Body
        ctx.fillStyle =
            npc.clothing;

        ctx.fillRect(
            -7,
            -1,
            14,
            15
        );

        // Head
        ctx.fillStyle =
            "#c58e6b";

        ctx.beginPath();

        ctx.arc(
            0,
            -9,
            7,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Hair
        ctx.fillStyle =
            "#272323";

        ctx.beginPath();

        ctx.arc(
            0,
            -12,
            7,
            Math.PI,
            Math.PI * 2
        );

        ctx.fill();

        // Legs
        ctx.strokeStyle =
            "#1b2224";

        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.moveTo(
            -3,
            13
        );

        ctx.lineTo(
            -4,
            20
        );

        ctx.moveTo(
            3,
            13
        );

        ctx.lineTo(
            4,
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

    for (
        const enemy
        of enemies
    ) {

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
            20,
            enemy.radius,
            9,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        if (
            enemy.type ===
            "crawler"
        ) {

            drawCrawler(
                enemy,
                pulse
            );

        } else if (
            enemy.type ===
            "guardian"
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

        // Health
        const barWidth =
            enemy.radius * 2;

        ctx.fillStyle =
            "rgba(0,0,0,0.7)";

        ctx.fillRect(
            -barWidth / 2,
            -enemy.radius - 15,
            barWidth,
            5
        );

        ctx.fillStyle =
            enemy.elite
                ? "#b48cff"
                : "#55dfb0";

        ctx.fillRect(
            -barWidth / 2,
            -enemy.radius - 15,
            barWidth *
                (
                    enemy.health /
                    enemy.maxHealth
                ),
            5
        );

        ctx.restore();
    }
}

// ============================================================
// STALKER ALIEN
// ============================================================

function drawStalker(
    enemy,
    pulse
) {

    const color =
        enemy.elite
            ? "#a17cff"
            : "#58dcb0";

    // Body
    ctx.fillStyle =
        color;

    ctx.beginPath();

    ctx.ellipse(
        0,
        5,
        enemy.radius *
            0.6,
        enemy.radius *
            0.7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Head
    ctx.beginPath();

    ctx.ellipse(
        0,
        -enemy.radius *
            0.45,
        enemy.radius *
            0.72,
        enemy.radius *
            0.5,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Eyes
    ctx.fillStyle =
        "#07110f";

    ctx.beginPath();

    ctx.ellipse(
        -8,
        -11,
        5,
        8,
        -0.2,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        8,
        -11,
        5,
        8,
        0.2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Eyes shine
    ctx.fillStyle =
        "#efffff";

    ctx.beginPath();

    ctx.arc(
        -9,
        -13,
        2,
        0,
        Math.PI * 2
    );

    ctx.arc(
        7,
        -13,
        2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Arms
    ctx.strokeStyle =
        color;

    ctx.lineWidth = 5;

    ctx.lineCap =
        "round";

    ctx.beginPath();

    ctx.moveTo(
        -12,
        0
    );

    ctx.lineTo(
        -23,
        14 +
            pulse
    );

    ctx.moveTo(
        12,
        0
    );

    ctx.lineTo(
        23,
        14 -
            pulse
    );

    ctx.stroke();

    // Antennas
    ctx.strokeStyle =
        "#baffef";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        -7,
        -24
    );

    ctx.lineTo(
        -13,
        -37
    );

    ctx.moveTo(
        7,
        -24
    );

    ctx.lineTo(
        13,
        -37
    );

    ctx.stroke();
}

// ============================================================
// CRAWLER ALIEN
// ============================================================

function drawCrawler(
    enemy,
    pulse
) {

    ctx.fillStyle =
        "#50d8bf";

    ctx.beginPath();

    ctx.ellipse(
        0,
        5,
        enemy.radius *
            0.75,
        enemy.radius *
            0.45,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Head
    ctx.fillStyle =
        "#78ead3";

    ctx.beginPath();

    ctx.arc(
        0,
        -8,
        11,
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
        -9,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#ecffff";

    ctx.beginPath();

    ctx.arc(
        -2,
        -11,
        2,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Tentacles
    ctx.strokeStyle =
        "#50d8bf";

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
            20 +
                pulse,
            i * 17,
            28
        );

        ctx.stroke();
    }
}

// ============================================================
// GUARDIAN ALIEN
// ============================================================

function drawGuardian(
    enemy,
    pulse
) {

    ctx.fillStyle =
        "#3b2759";

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
        "#b589ff";

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

    // Core
    ctx.fillStyle =
        "#e4cfff";

    ctx.beginPath();

    ctx.arc(
        0,
        8,
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

    // Shadow
    ctx.fillStyle =
        "rgba(0,0,0,0.45)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        10,
        38,
        24,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // Rotate hull
    ctx.rotate(
        player.angle
    );

    // Tracks
    ctx.fillStyle =
        "#13191b";

    ctx.beginPath();

    ctx.roundRect(
        -32,
        -29,
        64,
        15,
        5
    );

    ctx.fill();

    ctx.beginPath();

    ctx.roundRect(
        -32,
        14,
        64,
        15,
        5
    );

    ctx.fill();

    // Track lines
    ctx.strokeStyle =
        "#4c5b5d";

    ctx.lineWidth = 2;

    for (
        let x = -26;
        x <= 26;
        x += 13
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            -28
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
            28
        );

        ctx.stroke();
    }

    // Hull
    ctx.fillStyle =
        "#455b56";

    ctx.beginPath();

    ctx.roundRect(
        -27,
        -18,
        54,
        36,
        8
    );

    ctx.fill();

    ctx.strokeStyle =
        "#839692";

    ctx.lineWidth = 2;

    ctx.stroke();

    // Armor
    ctx.fillStyle =
        "#5c716b";

    ctx.beginPath();

    ctx.roundRect(
        -18,
        -13,
        36,
        26,
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
        "#121719";

    ctx.fillRect(
        0,
        -6,
        54,
        12
    );

    ctx.fillStyle =
        "#72847f";

    ctx.fillRect(
        8,
        -4,
        43,
        8
    );

    // Cannon end
    ctx.fillStyle =
        "#2c3836";

    ctx.fillRect(
        48,
        -8,
        9,
        16
    );

    // Turret
    ctx.fillStyle =
        "#637671";

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
        "#9badA7";

    ctx.stroke();

    // Turret light
    ctx.fillStyle =
        "#69ded2";

    ctx.beginPath();

    ctx.arc(
        6,
        -8,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // Lights
    ctx.fillStyle =
        "#66dad0";

    ctx.beginPath();

    ctx.arc(
        24,
        -9,
        3,
        0,
        Math.PI * 2
    );

    ctx.arc(
        24,
        9,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // Shield
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
            40,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }
}

// ============================================================
// DRAW BULLETS
// ============================================================

function drawBullets() {

    for (
        const bullet
        of bullets
    ) {

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
            "#6de6da";

        ctx.fillRect(
            -9,
            -2,
            18,
            4
        );

        ctx.restore();
    }
}

function drawEnemyBullets() {

    for (
        const bullet
        of enemyBullets
    ) {

        const p =
            worldToScreen(
                bullet.x,
                bullet.y
            );

        ctx.fillStyle =
            "#b98cff";

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
// PARTICLES
// ============================================================

function drawParticles() {

    for (
        const p
        of particles
    ) {

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
            "#73e4d7";

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
// CROSSHAIR
// ============================================================

function drawCrosshair() {

    if (!gameRunning) {
        return;
    }

    ctx.strokeStyle =
        "rgba(120,240,225,0.9)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        mouse.x - 12,
        mouse.y
    );

    ctx.lineTo(
        mouse.x - 4,
        mouse.y
    );

    ctx.moveTo(
        mouse.x + 4,
        mouse.y
    );

    ctx.lineTo(
        mouse.x + 12,
        mouse.y
    );

    ctx.moveTo(
        mouse.x,
        mouse.y - 12
    );

    ctx.lineTo(
        mouse.x,
        mouse.y - 4
    );

    ctx.moveTo(
        mouse.x,
        mouse.y + 4
    );

    ctx.lineTo(
        mouse.x,
        mouse.y + 12
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
            weapons[
                player.weapon
            ];

        ammo.textContent =
            player.reloadTimer > 0
                ? "RELOADING..."
                : `${weapon.name}  ${weapon.ammo} / ∞`;
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
            missionProgress >=
            missionTarget
                ? "SIGNAL FOUND"
                : `FIND THE SIGNAL • ${missionProgress}/${missionTarget}`;
    }

    if (zone) {

        zone.textContent =
            `SECTOR ${level}`;
    }
}

// ============================================================
// KILL ALIEN
// ============================================================

function killAlien(
    enemy
) {

    kills++;

    if (
        enemy.elite
    ) {

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
        enemy.x,
        enemy.y,
        enemy.elite
            ? 25
            : 16
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

// ============================================================
// XP
// ============================================================

function addXP(
    amount
) {

    xp += amount;

    const needed =
        level * 100;

    if (
        xp >= needed
    ) {

        xp -= needed;

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
// ACHIEVEMENTS
// ============================================================

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

function unlockAchievement(
    name
) {

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

    const achievements = [
        "FIRST CONTACT",
        "ALIEN HUNTER",
        "SCAVENGER",
        "LEVEL UP"
    ];

    const unlocked =
        getAchievements();

    let text =
        "ACHIEVEMENTS\n\n";

    for (
        const achievement
        of achievements
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

// ============================================================
// CONTROLS
// ============================================================

function showControls() {

    alert(
        "CONTROLS\n\n" +

        "W A S D = BEWEGEN\n" +
        "SHIFT = SNELLER\n" +
        "MUIS = RICHTEN\n" +
        "LINKERMUIS = SCHIETEN\n" +
        "R = HERLADEN\n" +
        "SPACE = DASH\n" +
        "1 = PULSE\n" +
        "2 = BURST\n" +
        "3 = CANNON\n" +
        "ESC = PAUZE"
    );
}

// ============================================================
// PAUSE
// ============================================================

function togglePause() {

    if (!gameRunning) {
        return;
    }

    paused = !paused;

    mouse.down = false;

    if (pauseMenu) {

        pauseMenu.style.display =
            paused
                ? "flex"
                : "none";
    }
}

// ============================================================
// SAVE
// ============================================================

function saveGame() {

    const data = {

        x: player.x,
        y: player.y,

        health:
            player.health,

        energy:
            player.energy,

        weapon:
            player.weapon,

        score,
        kills,
        credits,

        level,
        xp,

        missionProgress,

        ammo:
            weapons.map(
                w => w.ammo
            )
    };

    localStorage.setItem(
        "echoboundSave",
        JSON.stringify(data)
    );

    alert(
        "RUN SAVED!"
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

        player.x =
            data.x || 0;

        player.y =
            data.y || 0;

        player.health =
            data.health ||
            player.maxHealth;

        player.energy =
            data.energy ||
            player.maxEnergy;

        player.weapon =
            data.weapon || 0;

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
            data.missionProgress ||
            0;

        if (data.ammo) {

            data.ammo.forEach(
                (
                    ammo,
                    index
                ) => {

                    if (
                        weapons[index]
                    ) {

                        weapons[
                            index
                        ].ammo =
                            ammo;
                    }
                }
            );
        }

        for (
            let i = 0;
            i < 10;
            i++
        ) {

            spawnAlien();
        }

        gameRunning = true;
        paused = false;

        if (menu) {
            menu.style.display =
                "none";
        }

        updateHUD();

    } catch {

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

    keys.clear();

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
// GAME OVER
// ============================================================

function gameOver() {

    gameRunning = false;

    mouse.down = false;

    keys.clear();

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

function gameLoop(
    currentTime
) {

    let dt =
        (
            currentTime -
            lastTime
        ) / 1000;

    lastTime =
        currentTime;

    dt =
        Math.min(
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
