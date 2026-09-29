// ============================================================
// ECHOBOUND — THE LOST SIGNAL
// 2D VERSION
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;

// ============================================================
// GAME
// ============================================================

let running = false;
let paused = false;

let score = 0;
let kills = 0;
let wave = 1;
let credits = 0;

let health = 100;
const maxHealth = 100;

let energy = 100;
const maxEnergy = 100;

let cameraX = 0;
let cameraY = 0;

let mouseX = W / 2;
let mouseY = H / 2;

let lastTime = performance.now();

const keys = {};

const bullets = [];
const enemyBullets = [];
const enemies = [];
const particles = [];
const trees = [];
const rocks = [];
const buildings = [];
const loot = [];

// ============================================================
// WORLD
// ============================================================

const WORLD_WIDTH = 5000;
const WORLD_HEIGHT = 5000;

// ============================================================
// PLAYER
// ============================================================

const player = {
    x: 0,
    y: 0,

    radius: 18,

    speed: 250,

    angle: 0,

    shootCooldown: 0,

    dashCooldown: 0,

    ammo: 12,

    maxAmmo: 12
};

// ============================================================
// HELPERS
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

// ============================================================
// COLLISION WITH RECTANGLE
// ============================================================

function circleRectCollision(
    circleX,
    circleY,
    radius,
    rect
) {
    const closestX = Math.max(
        rect.x,
        Math.min(
            circleX,
            rect.x + rect.w
        )
    );

    const closestY = Math.max(
        rect.y,
        Math.min(
            circleY,
            rect.y + rect.h
        )
    );

    const dx =
        circleX - closestX;

    const dy =
        circleY - closestY;

    return (
        dx * dx +
        dy * dy <
        radius * radius
    );
}

// ============================================================
// CHECK WORLD COLLISION
// ============================================================

function canMoveTo(x, y) {

    // wereldgrenzen

    const limitX =
        WORLD_WIDTH / 2 - player.radius;

    const limitY =
        WORLD_HEIGHT / 2 - player.radius;

    if (
        x < -limitX ||
        x > limitX ||
        y < -limitY ||
        y > limitY
    ) {
        return false;
    }

    // gebouwen

    for (
        const building of buildings
    ) {

        if (
            circleRectCollision(
                x,
                y,
                player.radius,
                {
                    x:
                        building.x -
                        player.radius,

                    y:
                        building.y -
                        player.radius,

                    w:
                        building.w +
                        player.radius * 2,

                    h:
                        building.h +
                        player.radius * 2
                }
            )
        ) {

            return false;
        }
    }

    return true;
}

// ============================================================
// WORLD GENERATION
// ============================================================

function generateWorld() {

    trees.length = 0;
    rocks.length = 0;
    buildings.length = 0;
    loot.length = 0;

    // --------------------------------------------------------
    // BUILDINGS
    // --------------------------------------------------------

    for (let i = 0; i < 30; i++) {

        let tries = 0;
        let building;

        do {

            building = {

                x: random(
                    -WORLD_WIDTH / 2 + 300,
                    WORLD_WIDTH / 2 - 300
                ),

                y: random(
                    -WORLD_HEIGHT / 2 + 300,
                    WORLD_HEIGHT / 2 - 300
                ),

                w: random(120, 230),

                h: random(90, 180)
            };

            tries++;

        } while (
            (
                Math.abs(building.x) < 450 &&
                Math.abs(building.y) < 450
            ) &&
            tries < 100
        );

        buildings.push(building);
    }

    // --------------------------------------------------------
    // TREES
    // --------------------------------------------------------

    for (let i = 450; i--;) {

        const x = random(
            -WORLD_WIDTH / 2,
            WORLD_WIDTH / 2
        );

        const y = random(
            -WORLD_HEIGHT / 2,
            WORLD_HEIGHT / 2
        );

        if (
            Math.abs(x) < 350 &&
            Math.abs(y) < 350
        ) {
            continue;
        }

        trees.push({

            x,
            y,

            size: random(
                0.7,
                1.4
            )
        });
    }

    // --------------------------------------------------------
    // ROCKS
    // --------------------------------------------------------

    for (let i = 180; i--;) {

        rocks.push({

            x: random(
                -WORLD_WIDTH / 2,
                WORLD_WIDTH / 2
            ),

            y: random(
                -WORLD_HEIGHT / 2,
                WORLD_HEIGHT / 2
            ),

            size: random(
                10,
                28
            )
        });
    }

    // --------------------------------------------------------
    // LOOT
    // --------------------------------------------------------

    for (let i = 30; i--;) {

        loot.push({

            x: random(
                -WORLD_WIDTH / 2,
                WORLD_WIDTH / 2
            ),

            y: random(
                -WORLD_HEIGHT / 2,
                WORLD_HEIGHT / 2
            ),

            type:
                Math.random() < 0.5
                    ? "health"
                    : "energy",

            collected: false
        });
    }
}

// ============================================================
// ENEMIES
// ============================================================

const MAX_ENEMIES = 6;

function spawnEnemy() {

    if (
        enemies.length >= MAX_ENEMIES
    ) {
        return;
    }

    const angle =
        Math.random() *
        Math.PI *
        2;

    const spawnDistance =
        random(700, 1100);

    const enemy = {

        x:
            player.x +
            Math.cos(angle) *
            spawnDistance,

        y:
            player.y +
            Math.sin(angle) *
            spawnDistance,

        radius: 20,

        speed: random(
            45,
            70
        ),

        health: 3,

        maxHealth: 3,

        shootCooldown: random(
            2,
            4
        ),

        type:
            Math.random() < 0.12
                ? "elite"
                : "normal"
    };

    // Binnen wereld houden

    enemy.x =
        Math.max(
            -WORLD_WIDTH / 2 + 50,
            Math.min(
                WORLD_WIDTH / 2 - 50,
                enemy.x
            )
        );

    enemy.y =
        Math.max(
            -WORLD_HEIGHT / 2 + 50,
            Math.min(
                WORLD_HEIGHT / 2 - 50,
                enemy.y
            )
        );

    enemies.push(enemy);
}

// ============================================================
// PARTICLES
// ============================================================

function createParticles(
    x,
    y,
    amount = 8
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        particles.push({

            x,
            y,

            vx: random(
                -80,
                80
            ),

            vy: random(
                -80,
                80
            ),

            life: random(
                0.3,
                0.7
            ),

            maxLife: 0.7
        });
    }
}

// ============================================================
// SHOOT
// ============================================================

function shoot() {

    if (
        !running ||
        paused
    ) {
        return;
    }

    if (
        player.shootCooldown > 0
    ) {
        return;
    }

    if (
        player.ammo <= 0
    ) {
        reload();
        return;
    }

    player.ammo--;

    player.shootCooldown =
        0.18;

    bullets.push({

        x:
            player.x +
            Math.cos(player.angle) *
            25,

        y:
            player.y +
            Math.sin(player.angle) *
            25,

        vx:
            Math.cos(player.angle) *
            850,

        vy:
            Math.sin(player.angle) *
            850,

        life: 1.2,

        damage: 1
    });
}

// ============================================================
// RELOAD
// ============================================================

function reload() {

    player.ammo =
        player.maxAmmo;
}

// ============================================================
// DASH
// ============================================================

function dash() {

    if (
        !running ||
        paused
    ) {
        return;
    }

    if (
        player.dashCooldown > 0
    ) {
        return;
    }

    if (
        energy < 25
    ) {
        return;
    }

    energy -= 25;

    const dashDistance = 150;

    const newX =
        player.x +
        Math.cos(player.angle) *
        dashDistance;

    const newY =
        player.y +
        Math.sin(player.angle) *
        dashDistance;

    if (
        canMoveTo(
            newX,
            newY
        )
    ) {

        player.x =
            newX;

        player.y =
            newY;
    }

    player.dashCooldown =
        1.5;

    createParticles(
        player.x,
        player.y,
        15
    );
}

// ============================================================
// INPUT
// ============================================================

window.addEventListener(
    "keydown",
    event => {

        keys[event.code] =
            true;

        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            dash();
        }

        if (
            event.code === "KeyR"
        ) {

            reload();
        }

        if (
            event.code === "Escape"
        ) {

            togglePause();
        }
    }
);

window.addEventListener(
    "keyup",
    event => {

        keys[event.code] =
            false;
    }
);

canvas.addEventListener(
    "mousemove",
    event => {

        mouseX =
            event.clientX;

        mouseY =
            event.clientY;

        updateAim();
    }
);

canvas.addEventListener(
    "mousedown",
    event => {

        if (
            event.button === 0
        ) {

            shoot();
        }
    }
);

// ============================================================
// AIM
// ============================================================

function updateAim() {

    const playerScreenX =
        player.x -
        cameraX;

    const playerScreenY =
        player.y -
        cameraY;

    player.angle =
        Math.atan2(
            mouseY -
                playerScreenY,

            mouseX -
                playerScreenX
        );
}

// ============================================================
// PLAYER MOVEMENT
// ============================================================

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;

    if (
        keys["KeyW"]
    ) {
        dy--;
    }

    if (
        keys["KeyS"]
    ) {
        dy++;
    }

    if (
        keys["KeyA"]
    ) {
        dx--;
    }

    if (
        keys["KeyD"]
    ) {
        dx++;
    }

    if (
        dx === 0 &&
        dy === 0
    ) {
        return;
    }

    const length =
        Math.hypot(
            dx,
            dy
        );

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

    // --------------------------------------------------------
    // X bewegen
    // --------------------------------------------------------

    const newX =
        player.x +
        dx *
        speed *
        dt;

    if (
        canMoveTo(
            newX,
            player.y
        )
    ) {

        player.x =
            newX;
    }

    // --------------------------------------------------------
    // Y bewegen
    // --------------------------------------------------------

    const newY =
        player.y +
        dy *
        speed *
        dt;

    if (
        canMoveTo(
            player.x,
            newY
        )
    ) {

        player.y =
            newY;
    }
}

// ============================================================
// CAMERA
// ============================================================

function updateCamera() {

    cameraX =
        player.x -
        W / 2;

    cameraY =
        player.y -
        H / 2;
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

        bullet.life -=
            dt;

        let remove =
            bullet.life <= 0;

        for (
            let j =
                enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy =
                enemies[j];

            const d =
                Math.hypot(
                    bullet.x -
                        enemy.x,

                    bullet.y -
                        enemy.y
                );

            if (
                d <
                enemy.radius + 5
            ) {

                enemy.health--;

                createParticles(
                    bullet.x,
                    bullet.y,
                    5
                );

                remove =
                    true;

                if (
                    enemy.health <= 0
                ) {

                    kills++;

                    score +=
                        enemy.type ===
                        "elite"
                            ? 50
                            : 20;

                    credits +=
                        enemy.type ===
                        "elite"
                            ? 15
                            : 5;

                    createParticles(
                        enemy.x,
                        enemy.y,
                        15
                    );

                    enemies.splice(
                        j,
                        1
                    );
                }

                break;
            }
        }

        if (remove) {

            bullets.splice(
                i,
                1
            );
        }
    }
}

// ============================================================
// ENEMY COLLISION WITH BUILDINGS
// ============================================================

function enemyCanMoveTo(
    enemy,
    x,
    y
) {

    const oldX =
        enemy.x;

    const oldY =
        enemy.y;

    enemy.x = x;
    enemy.y = y;

    let blocked = false;

    for (
        const building of buildings
    ) {

        if (
            circleRectCollision(
                x,
                y,
                enemy.radius,
                building
            )
        ) {

            blocked = true;
            break;
        }
    }

    enemy.x =
        oldX;

    enemy.y =
        oldY;

    return !blocked;
}

// ============================================================
// ENEMIES
// ============================================================

function updateEnemies(dt) {

    for (
        const enemy of enemies
    ) {

        const dx =
            player.x -
            enemy.x;

        const dy =
            player.y -
            enemy.y;

        const d =
            Math.hypot(
                dx,
                dy
            );

        if (
            d > 100 &&
            d > 0
        ) {

            const moveX =
                enemy.x +
                (dx / d) *
                enemy.speed *
                dt;

            const moveY =
                enemy.y +
                (dy / d) *
                enemy.speed *
                dt;

            if (
                enemyCanMoveTo(
                    enemy,
                    moveX,
                    enemy.y
                )
            ) {

                enemy.x =
                    moveX;
            }

            if (
                enemyCanMoveTo(
                    enemy,
                    enemy.x,
                    moveY
                )
            ) {

                enemy.y =
                    moveY;
            }
        }

        enemy.shootCooldown -=
            dt;

        if (
            enemy.shootCooldown <= 0 &&
            d < 650
        ) {

            enemy.shootCooldown =
                enemy.type === "elite"
                    ? 2
                    : 3;

            const angle =
                Math.atan2(
                    player.y -
                        enemy.y,

                    player.x -
                        enemy.x
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

                life: 3
            });
        }

        if (
            d <
            player.radius +
            enemy.radius
        ) {

            health -=
                12 *
                dt;
        }
    }

    // --------------------------------------------------------
    // MAXIMAAL 6 BOTS
    // --------------------------------------------------------

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

    // nieuwe wave

    if (
        kills >=
        wave * 10
    ) {

        wave++;
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

        const bullet =
            enemyBullets[i];

        bullet.x +=
            bullet.vx *
            dt;

        bullet.y +=
            bullet.vy *
            dt;

        bullet.life -=
            dt;

        const d =
            Math.hypot(
                bullet.x -
                    player.x,

                bullet.y -
                    player.y
            );

        if (
            d <
            player.radius
        ) {

            health -= 8;

            createParticles(
                player.x,
                player.y,
                5
            );

            enemyBullets.splice(
                i,
                1
            );

            continue;
        }

        if (
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
// LOOT
// ============================================================

function updateLoot() {

    for (
        const item of loot
    ) {

        if (
            item.collected
        ) {
            continue;
        }

        const d =
            Math.hypot(
                player.x -
                    item.x,

                player.y -
                    item.y
            );

        if (
            d < 35
        ) {

            item.collected =
                true;

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

            else {

                energy =
                    Math.min(
                        maxEnergy,
                        energy + 40
                    );
            }

            credits += 10;
        }
    }
}

// ============================================================
// PARTICLES
// ============================================================

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
            p.vx *
            dt;

        p.y +=
            p.vy *
            dt;

        p.life -=
            dt;

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
// DRAW WORLD
// ============================================================

function drawWorld() {

    ctx.fillStyle =
        "#101a17";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    // --------------------------------------------------------
    // GRID
    // --------------------------------------------------------

    const grid = 100;

    const startX =
        Math.floor(
            cameraX /
            grid
        ) *
        grid;

    const startY =
        Math.floor(
            cameraY /
            grid
        ) *
        grid;

    ctx.strokeStyle =
        "rgba(255,255,255,0.025)";

    for (
        let x = startX;
        x <
        cameraX +
        W +
        grid;
        x += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x -
                cameraX,
            0
        );

        ctx.lineTo(
            x -
                cameraX,
            H
        );

        ctx.stroke();
    }

    for (
        let y = startY;
        y <
        cameraY +
        H +
        grid;
        y += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y -
                cameraY
        );

        ctx.lineTo(
            W,
            y -
                cameraY
        );

        ctx.stroke();
    }

    // --------------------------------------------------------
    // BUILDINGS
    // --------------------------------------------------------

    for (
        const building of buildings
    ) {

        const x =
            building.x -
            cameraX;

        const y =
            building.y -
            cameraY;

        if (
            x < -300 ||
            x > W + 300 ||
            y < -300 ||
            y > H + 300
        ) {
            continue;
        }

        // muur

        ctx.fillStyle =
            "#303944";

        ctx.fillRect(
            x,
            y,
            building.w,
            building.h
        );

        // rand

        ctx.strokeStyle =
            "#6c7887";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            x,
            y,
            building.w,
            building.h
        );

        // dak

        ctx.fillStyle =
            "#202833";

        ctx.fillRect(
            x + 8,
            y + 8,
            building.w - 16,
            12
        );

        // ramen

        ctx.fillStyle =
            "#6e9eb5";

        const windows =
            Math.max(
                1,
                Math.floor(
                    building.w / 55
                )
            );

        for (
            let i = 0;
            i < windows;
            i++
        ) {

            ctx.fillRect(
                x +
                    20 +
                    i * 50,

                y + 35,

                25,
                20
            );
        }
    }

    // --------------------------------------------------------
    // ROCKS
    // --------------------------------------------------------

    for (
        const rock of rocks
    ) {

        const x =
            rock.x -
            cameraX;

        const y =
            rock.y -
            cameraY;

        if (
            x < -60 ||
            x > W + 60 ||
            y < -60 ||
            y > H + 60
        ) {
            continue;
        }

        ctx.fillStyle =
            "#4a5357";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            rock.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    // --------------------------------------------------------
    // TREES
    // --------------------------------------------------------

    for (
        const tree of trees
    ) {

        const x =
            tree.x -
            cameraX;

        const y =
            tree.y -
            cameraY;

        if (
            x < -100 ||
            x > W + 100 ||
            y < -100 ||
            y > H + 100
        ) {
            continue;
        }

        const size =
            32 *
            tree.size;

        // schaduw

        ctx.fillStyle =
            "rgba(0,0,0,0.25)";

        ctx.beginPath();

        ctx.ellipse(
            x,
            y + 20,
            size,
            size * 0.4,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // stam

        ctx.fillStyle =
            "#493527";

        ctx.fillRect(
            x - 5,
            y - 5,
            10,
            30
        );

        // bladeren

        ctx.fillStyle =
            "#174d31";

        ctx.beginPath();

        ctx.arc(
            x,
            y - 25,
            size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#267247";

        ctx.beginPath();

        ctx.arc(
            x -
                size * 0.35,

            y -
                35,

            size * 0.55,

            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    // --------------------------------------------------------
    // LOOT
    // --------------------------------------------------------

    for (
        const item of loot
    ) {

        if (
            item.collected
        ) {
            continue;
        }

        const x =
            item.x -
            cameraX;

        const y =
            item.y -
            cameraY;

        ctx.fillStyle =
            item.type ===
            "health"
                ? "#55df70"
                : "#42cfff";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            10,
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
// DRAW BULLETS
// ============================================================

function drawBullets() {

    for (
        const bullet of bullets
    ) {

        ctx.fillStyle =
            "#6eeaff";

        ctx.beginPath();

        ctx.arc(
            bullet.x -
                cameraX,

            bullet.y -
                cameraY,

            5,

            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    for (
        const bullet of enemyBullets
    ) {

        ctx.fillStyle =
            "#ff9b42";

        ctx.beginPath();

        ctx.arc(
            bullet.x -
                cameraX,

            bullet.y -
                cameraY,

            5,

            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ============================================================
// DRAW ENEMIES
// ============================================================

function drawEnemies() {

    for (
        const enemy of enemies
    ) {

        const x =
            enemy.x -
            cameraX;

        const y =
            enemy.y -
            cameraY;

        const color =
            enemy.type ===
            "elite"
                ? "#d15cff"
                : "#8748e8";

        // schaduw

        ctx.fillStyle =
            "rgba(0,0,0,0.35)";

        ctx.beginPath();

        ctx.ellipse(
            x,
            y + 18,
            enemy.radius,
            8,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // bot

        ctx.fillStyle =
            color;

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
            "#ffffff";

        ctx.beginPath();

        ctx.arc(
            x - 7,
            y - 4,
            4,
            0,
            Math.PI * 2
        );

        ctx.arc(
            x + 7,
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
            y - 32,
            44,
            5
        );

        ctx.fillStyle =
            "#61e36e";

        ctx.fillRect(
            x - 22,
            y - 32,
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
// DRAW PLAYER
// ============================================================

function drawPlayer() {

    const x =
        player.x -
        cameraX;

    const y =
        player.y -
        cameraY;

    // schaduw

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 20,
        22,
        9,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // speler

    ctx.fillStyle =
        "#4389e8";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // vizier

    ctx.fillStyle =
        "#6eeaff";

    ctx.beginPath();

    ctx.arc(
        x +
            Math.cos(
                player.angle
            ) * 7,

        y +
            Math.sin(
                player.angle
            ) * 7,

        7,

        0,
        Math.PI * 2
    );

    ctx.fill();

    // wapen

    ctx.save();

    ctx.translate(
        x,
        y
    );

    ctx.rotate(
        player.angle
    );

    ctx.fillStyle =
        "#222b38";

    ctx.fillRect(
        5,
        -4,
        30,
        8
    );

    ctx.restore();
}

// ============================================================
// DRAW PARTICLES
// ============================================================

function drawParticles() {

    for (
        const p of particles
    ) {

        ctx.globalAlpha =
            Math.max(
                0,
                p.life /
                p.maxLife
            );

        ctx.fillStyle =
            "#7eeaff";

        ctx.beginPath();

        ctx.arc(
            p.x -
                cameraX,

            p.y -
                cameraY,

            3,
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

    const killsText =
        document.getElementById(
            "kills"
        );

    const creditsText =
        document.getElementById(
            "credits"
        );

    const ammoText =
        document.getElementById(
            "ammo"
        );

    const zoneText =
        document.getElementById(
            "zone"
        );

    if (healthBar) {

        healthBar.style.width =
            `${Math.max(
                0,
                health /
                    maxHealth *
                    100
            )}%`;
    }

    if (energyBar) {

        energyBar.style.width =
            `${Math.max(
                0,
                energy /
                    maxEnergy *
                    100
            )}%`;
    }

    if (killsText) {

        killsText.textContent =
            `KILLS: ${kills}`;
    }

    if (creditsText) {

        creditsText.textContent =
            `CREDITS: ${credits}`;
    }

    if (ammoText) {

        ammoText.textContent =
            `${player.ammo} / ∞`;
    }

    if (zoneText) {

        zoneText.textContent =
            `SECTOR ${wave}`;
    }
}

// ============================================================
// PAUSE
// ============================================================

function togglePause() {

    if (!running) {
        return;
    }

    paused =
        !paused;

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
// START GAME
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

function startGame() {

    running = true;
    paused = false;

    player.x = 0;
    player.y = 0;

    player.ammo =
        player.maxAmmo;

    health =
        maxHealth;

    energy =
        maxEnergy;

    credits = 0;
    kills = 0;
    score = 0;
    wave = 1;

    bullets.length = 0;
    enemyBullets.length = 0;
    enemies.length = 0;
    particles.length = 0;

    generateWorld();

    // slechts 4 bots bij de start

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        spawnEnemy();
    }

    updateCamera();

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
        function () {

            localStorage.setItem(
                "echoboundSave",
                JSON.stringify({

                    x: player.x,
                    y: player.y,

                    health,
                    energy,

                    credits,
                    kills,
                    wave
                })
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
        }
    );
}

// ============================================================
// LOAD
// ============================================================

const loadGame =
    document.getElementById(
        "loadGame"
    );

if (loadGame) {

    loadGame.addEventListener(
        "click",
        function () {

            const save =
                localStorage.getItem(
                    "echoboundSave"
                );

            startGame();

            if (!save) {
                return;
            }

            try {

                const data =
                    JSON.parse(
                        save
                    );

                player.x =
                    Number(data.x) || 0;

                player.y =
                    Number(data.y) || 0;

                health =
                    Number(
                        data.health
                    ) ||
                    maxHealth;

                energy =
                    Number(
                        data.energy
                    ) ||
                    maxEnergy;

                credits =
                    Number(
                        data.credits
                    ) || 0;

                kills =
                    Number(
                        data.kills
                    ) || 0;

                wave =
                    Number(
                        data.wave
                    ) || 1;

                updateCamera();

            } catch (error) {

                console.error(
                    "Save kon niet geladen worden.",
                    error
                );
            }
        }
    );
}

// ============================================================
// RESUME
// ============================================================

const resumeButton =
    document.getElementById(
        "resume"
    );

if (resumeButton) {

    resumeButton.addEventListener(
        "click",
        function () {

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

// ============================================================
// QUIT
// ============================================================

const quitButton =
    document.getElementById(
        "quit"
    );

if (quitButton) {

    quitButton.addEventListener(
        "click",
        function () {

            running = false;
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
        function () {

            alert(
                "ACHIEVEMENTS\n\n" +
                "⭐ FIRST ECHO\n" +
                "Kill your first bot.\n\n" +
                "⭐ SIGNAL HUNTER\n" +
                "Reach wave 5.\n\n" +
                "⭐ SURVIVOR\n" +
                "Get 25 kills."
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
        function () {

            alert(
                "CONTROLS\n\n" +
                "W A S D = bewegen\n" +
                "Muis = richten\n" +
                "Linkermuisknop = schieten\n" +
                "R = herladen\n" +
                "SHIFT = rennen\n" +
                "SPACE = dash\n" +
                "ESC = pauze"
            );
        }
    );
}

// ============================================================
// GAME OVER
// ============================================================

function gameOver() {

    running = false;

    const menu =
        document.getElementById(
            "menu"
        );

    if (menu) {

        menu.style.display =
            "flex";
    }

    alert(
        "RUN ENDED\n\n" +
        `Kills: ${kills}\n` +
        `Credits: ${credits}\n` +
        `Wave: ${wave}`
    );
}

// ============================================================
// UPDATE
// ============================================================

function update(dt) {

    if (
        !running ||
        paused
    ) {
        return;
    }

    player.shootCooldown =
        Math.max(
            0,
            player.shootCooldown -
            dt
        );

    player.dashCooldown =
        Math.max(
            0,
            player.dashCooldown -
            dt
        );

    energy =
        Math.min(
            maxEnergy,
            energy +
            10 * dt
        );

    updatePlayer(dt);

    updateCamera();

    updateBullets(dt);

    updateEnemies(dt);

    updateEnemyBullets(dt);

    updateLoot();

    updateParticles(dt);

    updateAim();

    updateHUD();

    if (
        health <= 0
    ) {

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

    drawWorld();

    drawBullets();

    drawEnemies();

    drawParticles();

    drawPlayer();
}

// ============================================================
// GAME LOOP
// ============================================================

function loop(time) {

    const dt =
        Math.min(
            (time -
                lastTime) /
                1000,
            0.05
        );

    lastTime =
        time;

    update(dt);

    draw();

    requestAnimationFrame(
        loop
    );
}

// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
    "resize",
    function () {

        W =
            window.innerWidth;

        H =
            window.innerHeight;

        canvas.width =
            W;

        canvas.height =
            H;

        updateCamera();
    }
);

// ============================================================
// INITIALIZE
// ============================================================

generateWorld();

updateCamera();

updateHUD();

loop(
    performance.now()
);
