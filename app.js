// ============================================================
// ECHOBOUND — THE LOST SIGNAL
// 2D versie
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;

// ============================================================
// GAME STATE
// ============================================================

let running = false;
let paused = false;

let score = 0;
let kills = 0;
let wave = 1;

let health = 100;
let maxHealth = 100;

let energy = 100;
let maxEnergy = 100;

let credits = 0;

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
// PLAYER
// ============================================================

const player = {
    x: 0,
    y: 0,

    radius: 18,

    speed: 260,

    angle: 0,

    shootCooldown: 0,

    dashCooldown: 0,

    ammo: 12,

    maxAmmo: 12
};

// ============================================================
// WORLD
// ============================================================

const WORLD_WIDTH = 5000;
const WORLD_HEIGHT = 5000;

// ============================================================
// RANDOM HELPERS
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
// WORLD GENERATION
// ============================================================

function generateWorld() {

    trees.length = 0;
    rocks.length = 0;
    buildings.length = 0;
    loot.length = 0;

    // bomen
    for (let i = 0; i < 500; i++) {

        const x = random(
            -WORLD_WIDTH / 2,
            WORLD_WIDTH / 2
        );

        const y = random(
            -WORLD_HEIGHT / 2,
            WORLD_HEIGHT / 2
        );

        if (
            Math.abs(x) < 400 &&
            Math.abs(y) < 400
        ) {
            continue;
        }

        trees.push({
            x,
            y,
            size: random(0.7, 1.4)
        });
    }

    // rotsen
    for (let i = 0; i < 250; i++) {

        rocks.push({
            x: random(
                -WORLD_WIDTH / 2,
                WORLD_WIDTH / 2
            ),

            y: random(
                -WORLD_HEIGHT / 2,
                WORLD_HEIGHT / 2
            ),

            size: random(10, 30)
        });
    }

    // gebouwen
    for (let i = 0; i < 35; i++) {

        buildings.push({
            x: random(
                -WORLD_WIDTH / 2 + 300,
                WORLD_WIDTH / 2 - 300
            ),

            y: random(
                -WORLD_HEIGHT / 2 + 300,
                WORLD_HEIGHT / 2 - 300
            ),

            w: random(100, 220),

            h: random(80, 170)
        });
    }

    // loot
    for (let i = 0; i < 40; i++) {

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
                    ? "energy"
                    : "health",

            collected: false
        });
    }
}

// ============================================================
// ENEMIES
// ============================================================

function spawnEnemy() {

    const angle =
        Math.random() *
        Math.PI *
        2;

    const distanceFromPlayer =
        random(500, 900);

    const enemy = {

        x:
            player.x +
            Math.cos(angle) *
            distanceFromPlayer,

        y:
            player.y +
            Math.sin(angle) *
            distanceFromPlayer,

        radius: 20,

        speed: random(55, 90),

        health: 3,

        maxHealth: 3,

        shootCooldown: random(1, 3),

        type:
            Math.random() < 0.15
                ? "elite"
                : "normal"
    };

    enemies.push(enemy);
}

function createWave() {

    const amount =
        4 + wave * 2;

    for (
        let i = 0;
        i < amount;
        i++
    ) {
        spawnEnemy();
    }
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

            vx: random(-80, 80),

            vy: random(-80, 80),

            life: random(0.3, 0.7),

            maxLife: 0.7
        });
    }
}

// ============================================================
// SHOOT
// ============================================================

function shoot() {

    if (!running || paused) {
        return;
    }

    if (player.shootCooldown > 0) {
        return;
    }

    if (player.ammo <= 0) {
        reload();
        return;
    }

    player.ammo--;

    player.shootCooldown = 0.18;

    const angle =
        player.angle;

    bullets.push({

        x:
            player.x +
            Math.cos(angle) * 25,

        y:
            player.y +
            Math.sin(angle) * 25,

        vx:
            Math.cos(angle) * 850,

        vy:
            Math.sin(angle) * 850,

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

    if (!running || paused) {
        return;
    }

    if (player.dashCooldown > 0) {
        return;
    }

    if (energy < 25) {
        return;
    }

    energy -= 25;

    player.x +=
        Math.cos(player.angle) *
        180;

    player.y +=
        Math.sin(player.angle) *
        180;

    player.dashCooldown = 1.5;

    createParticles(
        player.x,
        player.y,
        20
    );
}

// ============================================================
// INPUT
// ============================================================

window.addEventListener(
    "keydown",
    event => {

        keys[event.code] = true;

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

        keys[event.code] = false;
    }
);

canvas.addEventListener(
    "mousemove",
    event => {

        mouseX = event.clientX;
        mouseY = event.clientY;

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
        player.x - cameraX;

    const playerScreenY =
        player.y - cameraY;

    player.angle =
        Math.atan2(
            mouseY - playerScreenY,
            mouseX - playerScreenX
        );
}

// ============================================================
// PLAYER MOVEMENT
// ============================================================

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;

    if (keys["KeyW"]) {
        dy -= 1;
    }

    if (keys["KeyS"]) {
        dy += 1;
    }

    if (keys["KeyA"]) {
        dx -= 1;
    }

    if (keys["KeyD"]) {
        dx += 1;
    }

    if (
        dx !== 0 ||
        dy !== 0
    ) {

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

        player.x +=
            dx * speed * dt;

        player.y +=
            dy * speed * dt;
    }

    const limitX =
        WORLD_WIDTH / 2 - 50;

    const limitY =
        WORLD_HEIGHT / 2 - 50;

    player.x =
        Math.max(
            -limitX,
            Math.min(
                limitX,
                player.x
            )
        );

    player.y =
        Math.max(
            -limitY,
            Math.min(
                limitY,
                player.y
            )
        );
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
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];

        bullet.x +=
            bullet.vx * dt;

        bullet.y +=
            bullet.vy * dt;

        bullet.life -= dt;

        let removeBullet =
            bullet.life <= 0;

        for (
            let j = enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy =
                enemies[j];

            const d =
                Math.hypot(
                    bullet.x - enemy.x,
                    bullet.y - enemy.y
                );

            if (
                d <
                enemy.radius + 5
            ) {

                enemy.health -=
                    bullet.damage;

                createParticles(
                    bullet.x,
                    bullet.y,
                    5
                );

                removeBullet = true;

                if (
                    enemy.health <= 0
                ) {

                    kills++;

                    score +=
                        enemy.type === "elite"
                            ? 50
                            : 20;

                    credits +=
                        enemy.type === "elite"
                            ? 15
                            : 5;

                    createParticles(
                        enemy.x,
                        enemy.y,
                        15
                    );

                    if (
                        Math.random() < 0.25
                    ) {

                        loot.push({
                            x: enemy.x,
                            y: enemy.y,
                            type:
                                Math.random() <
                                0.5
                                    ? "health"
                                    : "energy",
                            collected: false
                        });
                    }

                    enemies.splice(
                        j,
                        1
                    );
                }

                break;
            }
        }

        if (removeBullet) {

            bullets.splice(
                i,
                1
            );
        }
    }
}

// ============================================================
// ENEMY UPDATE
// ============================================================

function updateEnemies(dt) {

    for (
        const enemy of enemies
    ) {

        const dx =
            player.x - enemy.x;

        const dy =
            player.y - enemy.y;

        const d =
            Math.hypot(dx, dy);

        if (
            d > 100
        ) {

            enemy.x +=
                (dx / d) *
                enemy.speed *
                dt;

            enemy.y +=
                (dy / d) *
                enemy.speed *
                dt;
        }

        enemy.shootCooldown -=
            dt;

        if (
            enemy.shootCooldown <= 0 &&
            d < 700
        ) {

            enemy.shootCooldown =
                enemy.type === "elite"
                    ? 1
                    : 2;

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
                    260,

                vy:
                    Math.sin(angle) *
                    260,

                life: 3
            });
        }

        if (
            d <
            player.radius +
            enemy.radius
        ) {

            health -=
                15 * dt;
        }
    }

    // nieuwe vijanden wanneer er weinig zijn

    if (
        enemies.length <
        Math.max(3, wave)
    ) {

        spawnEnemy();
    }

    if (
        kills >=
        wave * 10
    ) {

        wave++;

        createWave();
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
            bullet.vx * dt;

        bullet.y +=
            bullet.vy * dt;

        bullet.life -=
            dt;

        const d =
            Math.hypot(
                bullet.x - player.x,
                bullet.y - player.y
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
                player.x - item.x,
                player.y - item.y
            );

        if (
            d < 35
        ) {

            item.collected =
                true;

            if (
                item.type === "health"
            ) {

                health =
                    Math.min(
                        maxHealth,
                        health + 30
                    );
            }

            if (
                item.type === "energy"
            ) {

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
// PARTICLES UPDATE
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
            p.vx * dt;

        p.y +=
            p.vy * dt;

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
// DRAW WORLD
// ============================================================

function drawWorld() {

    ctx.fillStyle =
        "#101b17";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    // grid

    const grid = 100;

    const startX =
        Math.floor(cameraX / grid) *
        grid;

    const startY =
        Math.floor(cameraY / grid) *
        grid;

    ctx.strokeStyle =
        "rgba(255,255,255,0.025)";

    ctx.lineWidth = 1;

    for (
        let x = startX;
        x < cameraX + W + grid;
        x += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x - cameraX,
            0
        );

        ctx.lineTo(
            x - cameraX,
            H
        );

        ctx.stroke();
    }

    for (
        let y = startY;
        y < cameraY + H + grid;
        y += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y - cameraY
        );

        ctx.lineTo(
            W,
            y - cameraY
        );

        ctx.stroke();
    }

    // buildings

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

        ctx.fillStyle =
            "#303944";

        ctx.fillRect(
            x,
            y,
            building.w,
            building.h
        );

        ctx.strokeStyle =
            "#536170";

        ctx.strokeRect(
            x,
            y,
            building.w,
            building.h
        );

        ctx.fillStyle =
            "#17202a";

        ctx.fillRect(
            x + 15,
            y + 15,
            25,
            20
        );
    }

    // rocks

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
            x < -50 ||
            x > W + 50 ||
            y < -50 ||
            y > H + 50
        ) {
            continue;
        }

        ctx.fillStyle =
            "#4b5557";

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

    // trees

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
            x < -80 ||
            x > W + 80 ||
            y < -100 ||
            y > H + 100
        ) {
            continue;
        }

        const size =
            32 *
            tree.size;

        // shadow

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

        // trunk

        ctx.fillStyle =
            "#493527";

        ctx.fillRect(
            x - 5,
            y - 5,
            10,
            30
        );

        // crown

        ctx.fillStyle =
            "#1d5637";

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
            x - size * 0.35,
            y - 35,
            size * 0.55,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    // loot

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
            item.type === "health"
                ? "#52e36b"
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

        const x =
            bullet.x -
            cameraX;

        const y =
            bullet.y -
            cameraY;

        ctx.fillStyle =
            "#6ee7ff";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    for (
        const bullet of enemyBullets
    ) {

        const x =
            bullet.x -
            cameraX;

        const y =
            bullet.y -
            cameraY;

        ctx.fillStyle =
            "#ff9b42";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
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
            enemy.type === "elite"
                ? "#d15cff"
                : "#8b4cff";

        ctx.fillStyle =
            "rgba(0,0,0,0.3)";

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

        // health bar

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
                (enemy.health /
                    enemy.maxHealth),
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

    // shadow

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

    // body

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

    // visor

    ctx.fillStyle =
        "#6eeaff";

    ctx.beginPath();

    ctx.arc(
        x +
            Math.cos(player.angle) *
            7,

        y +
            Math.sin(player.angle) *
            7,

        7,

        0,
        Math.PI * 2
    );

    ctx.fill();

    // weapon

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
// PARTICLES DRAW
// ============================================================

function drawParticles() {

    for (
        const p of particles
    ) {

        const x =
            p.x -
            cameraX;

        const y =
            p.y -
            cameraY;

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
            x,
            y,
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
                health / maxHealth * 100
            )}%`;
    }

    if (energyBar) {

        energyBar.style.width =
            `${Math.max(
                0,
                energy / maxEnergy * 100
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
// MENU BUTTONS
// ============================================================

const newGame =
    document.getElementById(
        "newGame"
    );

if (newGame) {

    newGame.onclick =
        startGame;
}

function startGame() {

    running = true;
    paused = false;

    player.x = 0;
    player.y = 0;

    health = maxHealth;

    energy = maxEnergy;

    credits = 0;

    kills = 0;

    score = 0;

    wave = 1;

    player.ammo =
        player.maxAmmo;

    enemies.length = 0;

    bullets.length = 0;

    enemyBullets.length = 0;

    particles.length = 0;

    generateWorld();

    createWave();

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
// CONTINUE
// ============================================================

const loadGame =
    document.getElementById(
        "loadGame"
    );

if (loadGame) {

    loadGame.onclick =
        function () {

            startGame();

            const save =
                localStorage.getItem(
                    "echoboundSave"
                );

            if (!save) {
                return;
            }

            try {

                const data =
                    JSON.parse(save);

                player.x =
                    data.x || 0;

                player.y =
                    data.y || 0;

                health =
                    data.health ||
                    maxHealth;

                energy =
                    data.energy ||
                    maxEnergy;

                credits =
                    data.credits ||
                    0;

                kills =
                    data.kills ||
                    0;

                wave =
                    data.wave ||
                    1;

            } catch (error) {

                console.error(
                    "Save kon niet worden geladen",
                    error
                );
            }
        };
}

// ============================================================
// SAVE
// ============================================================

const saveButton =
    document.getElementById(
        "save"
    );

if (saveButton) {

    saveButton.onclick =
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
        };
}

// ============================================================
// RESUME
// ============================================================

const resumeButton =
    document.getElementById(
        "resume"
    );

if (resumeButton) {

    resumeButton.onclick =
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
        };
}

// ============================================================
// QUIT
// ============================================================

const quitButton =
    document.getElementById(
        "quit"
    );

if (quitButton) {

    quitButton.onclick =
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
        };
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

const achievementsButton =
    document.getElementById(
        "achievementsButton"
    );

if (achievementsButton) {

    achievementsButton.onclick =
        function () {

            alert(
                "ACHIEVEMENTS\n\n" +
                "⭐ FIRST ECHO\n" +
                "Kill your first enemy.\n\n" +
                "⭐ SIGNAL HUNTER\n" +
                "Reach wave 5.\n\n" +
                "⭐ SURVIVOR\n" +
                "Get 25 kills."
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
        };
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
            energy + 10 * dt
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
            (time - lastTime) /
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
    }
);

// ============================================================
// START
// ============================================================

generateWorld();

updateCamera();

updateHUD();

loop(
    performance.now()
);
