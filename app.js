"use strict";


/* =====================================================
   ECHOBOUND — THE LOST SIGNAL
   Main game
===================================================== */


/* =====================================================
   CANVAS
===================================================== */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas.getContext("2d");


let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;


/* =====================================================
   GAME STATE
===================================================== */

let gameRunning = false;
let paused = false;

let keys = {};

let player = null;

let enemies = [];
let bullets = [];
let particles = [];
let pickups = [];

let camera = {
    x: 0,
    y: 0
};

let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};


/* =====================================================
   WORLD
===================================================== */

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 2400;


/* =====================================================
   SAVE DATA
===================================================== */

const SAVE_KEY = "echobound_save_v2";


let achievements = {
    firstEcho: false,
    tenEchoes: false,
    firstSave: false,
    explorer: false
};


/* =====================================================
   RESIZE
===================================================== */

window.addEventListener("resize", function () {

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;

});


/* =====================================================
   BUTTONS
===================================================== */

const newGameButton =
    document.getElementById("newGame");

const loadGameButton =
    document.getElementById("loadGame");

const achievementsButton =
    document.getElementById("achievementsButton");

const controlsButton =
    document.getElementById("controlsButton");

const resumeButton =
    document.getElementById("resume");

const saveButton =
    document.getElementById("save");

const quitButton =
    document.getElementById("quit");

const closeMapButton =
    document.getElementById("closeMap");


/* =====================================================
   NEW GAME
===================================================== */

newGameButton.addEventListener(
    "click",
    function () {

        startNewGame();

    }
);


function startNewGame() {

    player = {

        x: WORLD_WIDTH / 2,

        y: WORLD_HEIGHT / 2,

        radius: 18,

        speed: 3.5,

        maxHealth: 100,

        health: 100,

        maxEnergy: 100,

        energy: 100,

        ammo: 12,

        kills: 0,

        credits: 0,

        cooldown: 0,

        dashCooldown: 0,

        dashTimer: 0,

        invincible: 0,

        distance: 0

    };


    enemies = [];
    bullets = [];
    particles = [];
    pickups = [];


    for (let i = 0; i < 18; i++) {

        createEnemy();

    }


    gameRunning = true;
    paused = false;


    document.getElementById("menu").style.display =
        "none";

    document.getElementById("pause").style.display =
        "none";

    document.getElementById("map").style.display =
        "none";


    updateHUD();

}


/* =====================================================
   CONTINUE
===================================================== */

loadGameButton.addEventListener(
    "click",
    function () {

        loadGame();

    }
);


function loadGame() {

    const save =
        localStorage.getItem(SAVE_KEY);


    if (!save) {

        alert(
            "Er is nog geen opgeslagen run."
        );

        return;

    }


    try {

        const data =
            JSON.parse(save);


        player = data.player;


        if (!player) {

            throw new Error(
                "Geen speler gevonden."
            );

        }


        if (data.achievements) {

            achievements =
                data.achievements;

        }


        enemies = [];
        bullets = [];
        particles = [];
        pickups = [];


        for (let i = 0; i < 18; i++) {

            createEnemy();

        }


        gameRunning = true;
        paused = false;


        document.getElementById(
            "menu"
        ).style.display = "none";


        updateHUD();


    } catch (error) {

        console.error(error);

        alert(
            "De opgeslagen game kon niet worden geladen."
        );

    }

}


/* =====================================================
   SAVE
===================================================== */

saveButton.addEventListener(
    "click",
    function () {

        saveGame();

    }
);


function saveGame() {

    if (!player) {

        alert(
            "Je hebt nog geen run gestart."
        );

        return;

    }


    const data = {

        player: player,

        achievements: achievements

    };


    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(data)
    );


    if (!achievements.firstSave) {

        achievements.firstSave = true;

        showAchievement(
            "FIRST SAVE"
        );

    } else {

        showAchievement(
            "GAME SAVED"
        );

    }

}


/* =====================================================
   ACHIEVEMENTS BUTTON
===================================================== */

achievementsButton.addEventListener(
    "click",
    function () {

        showAchievements();

    }
);


function showAchievements() {

    let text =
        "ACHIEVEMENTS\n\n";


    text +=
        achievements.firstEcho
            ? "✓ FIRST ECHO\n"
            : "□ FIRST ECHO\n";

    text +=
        "Versla je eerste vijand.\n\n";


    text +=
        achievements.tenEchoes
            ? "✓ TEN ECHOES\n"
            : "□ TEN ECHOES\n";

    text +=
        "Versla 10 vijanden.\n\n";


    text +=
        achievements.firstSave
            ? "✓ FIRST SAVE\n"
            : "□ FIRST SAVE\n";

    text +=
        "Sla je run op.\n\n";


    text +=
        achievements.explorer
            ? "✓ EXPLORER\n"
            : "□ EXPLORER\n";

    text +=
        "Leg een grote afstand af.";


    alert(text);

}


/* =====================================================
   CONTROLS BUTTON
===================================================== */

controlsButton.addEventListener(
    "click",
    function () {

        alert(
            "BESTURING\n\n" +

            "W A S D\n" +
            "Bewegen\n\n" +

            "MUIS\n" +
            "Richten\n\n" +

            "LINKERMUISKNOP\n" +
            "Schieten\n\n" +

            "SPACE\n" +
            "Dash\n\n" +

            "M\n" +
            "Kaart\n\n" +

            "ESC\n" +
            "Pauzeren"
        );

    }
);


/* =====================================================
   PAUSE
===================================================== */

resumeButton.addEventListener(
    "click",
    function () {

        paused = false;

        document.getElementById(
            "pause"
        ).style.display = "none";

    }
);


quitButton.addEventListener(
    "click",
    function () {

        if (player) {

            saveGame();

        }


        gameRunning = false;
        paused = false;


        document.getElementById(
            "pause"
        ).style.display = "none";


        document.getElementById(
            "menu"
        ).style.display = "flex";

    }
);


/* =====================================================
   KEYBOARD
===================================================== */

window.addEventListener(
    "keydown",
    function (event) {

        const key =
            event.key.toLowerCase();


        keys[key] = true;


        /* SPACE */

        if (event.code === "Space") {

            keys["space"] = true;

        }


        /* ESC */

        if (key === "escape") {

            if (gameRunning) {

                paused = !paused;


                document.getElementById(
                    "pause"
                ).style.display =
                    paused
                        ? "flex"
                        : "none";

            }

        }


        /* MAP */

        if (key === "m") {

            if (
                gameRunning &&
                !paused
            ) {

                toggleMap();

            }

        }

    }
);


window.addEventListener(
    "keyup",
    function (event) {

        const key =
            event.key.toLowerCase();


        keys[key] = false;


        if (event.code === "Space") {

            keys["space"] = false;

        }

    }
);


/* =====================================================
   MOUSE
===================================================== */

canvas.addEventListener(
    "mousemove",
    function (event) {

        const rect =
            canvas.getBoundingClientRect();


        mouse.x =
            event.clientX -
            rect.left;


        mouse.y =
            event.clientY -
            rect.top;

    }
);


canvas.addEventListener(
    "mousedown",
    function (event) {

        if (event.button === 0) {

            mouse.down = true;

        }

    }
);


window.addEventListener(
    "mouseup",
    function (event) {

        if (event.button === 0) {

            mouse.down = false;

        }

    }
);


/* =====================================================
   MAP
===================================================== */

closeMapButton.addEventListener(
    "click",
    function () {

        closeMap();

    }
);


function toggleMap() {

    const map =
        document.getElementById("map");


    if (
        map.style.display === "flex"
    ) {

        closeMap();

    } else {

        openMap();

    }

}


function openMap() {

    document.getElementById(
        "map"
    ).style.display = "flex";


    drawMap();

}


function closeMap() {

    document.getElementById(
        "map"
    ).style.display = "none";

}


/* =====================================================
   CREATE ENEMY
===================================================== */

function createEnemy() {

    if (!player) {
        return;
    }


    let x;
    let y;

    let attempts = 0;


    do {

        x =
            80 +
            Math.random() *
            (WORLD_WIDTH - 160);


        y =
            80 +
            Math.random() *
            (WORLD_HEIGHT - 160);


        attempts++;


    } while (
        Math.hypot(
            x - player.x,
            y - player.y
        ) < 400 &&
        attempts < 100
    );


    const type =
        Math.random();


    let enemy;


    if (type > 0.85) {

        enemy = {

            x: x,
            y: y,

            radius: 21,

            speed: 0.55,

            hp: 4,

            maxHp: 4,

            cooldown:
                60 +
                Math.random() * 80,

            type: "heavy"

        };

    } else if (type > 0.6) {

        enemy = {

            x: x,
            y: y,

            radius: 18,

            speed: 0.75,

            hp: 3,

            maxHp: 3,

            cooldown:
                60 +
                Math.random() * 80,

            type: "mid"

        };

    } else {

        enemy = {

            x: x,
            y: y,

            radius: 16,

            speed: 0.9,

            hp: 2,

            maxHp: 2,

            cooldown:
                80 +
                Math.random() * 100,

            type: "light"

        };

    }


    enemies.push(enemy);

}


/* =====================================================
   PLAYER
===================================================== */

function updatePlayer() {

    let dx = 0;
    let dy = 0;


    if (keys["w"]) {
        dy -= 1;
    }

    if (keys["s"]) {
        dy += 1;
    }

    if (keys["a"]) {
        dx -= 1;
    }

    if (keys["d"]) {
        dx += 1;
    }


    if (dx !== 0 || dy !== 0) {

        const length =
            Math.hypot(dx, dy);


        dx /= length;
        dy /= length;


        let speed =
            player.speed;


        if (player.dashTimer > 0) {

            speed = 11;

            player.dashTimer--;

        }


        player.x +=
            dx * speed;


        player.y +=
            dy * speed;


        player.distance +=
            speed;


        if (
            player.distance > 5000 &&
            !achievements.explorer
        ) {

            achievements.explorer = true;

            showAchievement(
                "EXPLORER"
            );

        }

    }


    /* DASH */

    if (
        keys["space"] &&
        player.dashCooldown <= 0 &&
        player.energy >= 25 &&
        (dx !== 0 || dy !== 0)
    ) {

        player.dashTimer = 10;

        player.energy -= 25;

        player.dashCooldown = 70;

        player.invincible = 25;


        createParticles(
            player.x,
            player.y,
            25
        );


        keys["space"] = false;

    }


    if (player.cooldown > 0) {
        player.cooldown--;
    }


    if (player.dashCooldown > 0) {
        player.dashCooldown--;
    }


    if (player.invincible > 0) {
        player.invincible--;
    }


    player.energy =
        Math.min(
            player.maxEnergy,
            player.energy + 0.12
        );


    player.x =
        Math.max(
            player.radius,
            Math.min(
                WORLD_WIDTH -
                player.radius,
                player.x
            )
        );


    player.y =
        Math.max(
            player.radius,
            Math.min(
                WORLD_HEIGHT -
                player.radius,
                player.y
            )
        );

}


/* =====================================================
   SHOOT
===================================================== */

function shoot() {

    if (
        !player ||
        player.cooldown > 0
    ) {

        return;

    }


    if (player.ammo <= 0) {

        player.ammo = 12;

        return;

    }


    player.ammo--;

    player.cooldown = 9;


    const worldX =
        camera.x + mouse.x;


    const worldY =
        camera.y + mouse.y;


    const angle =
        Math.atan2(
            worldY - player.y,
            worldX - player.x
        );


    bullets.push({

        x:
            player.x +
            Math.cos(angle) * 22,

        y:
            player.y +
            Math.sin(angle) * 22,

        vx:
            Math.cos(angle) * 11,

        vy:
            Math.sin(angle) * 11,

        enemy: false,

        life: 100

    });


    createParticles(
        player.x +
        Math.cos(angle) * 25,

        player.y +
        Math.sin(angle) * 25,

        4
    );

}


/* =====================================================
   ENEMIES
===================================================== */

function updateEnemies() {

    for (const enemy of enemies) {

        const dx =
            player.x - enemy.x;


        const dy =
            player.y - enemy.y;


        const distance =
            Math.hypot(dx, dy);


        if (distance > 65) {

            enemy.x +=
                dx / distance *
                enemy.speed;


            enemy.y +=
                dy / distance *
                enemy.speed;

        }


        /* SHOOT */

        if (distance < 650) {

            enemy.cooldown--;


            if (enemy.cooldown <= 0) {

                enemy.cooldown =
                    100 +
                    Math.random() * 100;


                const angle =
                    Math.atan2(
                        player.y - enemy.y,
                        player.x - enemy.x
                    );


                let speed = 3.3;


                if (
                    enemy.type === "mid"
                ) {

                    speed = 3.7;

                }


                if (
                    enemy.type === "heavy"
                ) {

                    speed = 3.0;

                }


                bullets.push({

                    x: enemy.x,

                    y: enemy.y,

                    vx:
                        Math.cos(angle) *
                        speed,

                    vy:
                        Math.sin(angle) *
                        speed,

                    enemy: true,

                    life: 160

                });

            }

        }


        /* CONTACT */

        if (
            distance <
            player.radius +
            enemy.radius
        ) {

            damagePlayer(
                0.35
            );

        }

    }

}


/* =====================================================
   BULLETS
===================================================== */

function updateBullets() {

    for (
        let i =
            bullets.length - 1;

        i >= 0;

        i--
    ) {

        const bullet =
            bullets[i];


        bullet.x +=
            bullet.vx;


        bullet.y +=
            bullet.vy;


        bullet.life--;


        /* ENEMY BULLET */

        if (bullet.enemy) {

            if (
                Math.hypot(
                    bullet.x - player.x,
                    bullet.y - player.y
                ) <
                player.radius + 6
            ) {

                damagePlayer(8);

                bullets.splice(
                    i,
                    1
                );

                continue;

            }

        }


        /* PLAYER BULLET */

        else {

            let hit = false;


            for (
                let j =
                    enemies.length - 1;

                j >= 0;

                j--
            ) {

                const enemy =
                    enemies[j];


                if (
                    Math.hypot(
                        bullet.x -
                        enemy.x,

                        bullet.y -
                        enemy.y
                    ) <
                    enemy.radius + 7
                ) {

                    enemy.hp--;


                    createParticles(
                        enemy.x,
                        enemy.y,
                        8
                    );


                    hit = true;


                    if (
                        enemy.hp <= 0
                    ) {

                        enemyDefeated(
                            j
                        );

                    }


                    break;

                }

            }


            if (hit) {

                bullets.splice(
                    i,
                    1
                );

                continue;

            }

        }


        if (
            bullet.life <= 0 ||
            bullet.x < 0 ||
            bullet.y < 0 ||
            bullet.x > WORLD_WIDTH ||
            bullet.y > WORLD_HEIGHT
        ) {

            bullets.splice(
                i,
                1
            );

        }

    }

}


/* =====================================================
   ENEMY DEFEATED
===================================================== */

function enemyDefeated(index) {

    const enemy =
        enemies[index];


    player.kills++;

    player.credits +=
        enemy.type === "heavy"
            ? 30
            : enemy.type === "mid"
                ? 20
                : 10;


    if (
        !achievements.firstEcho
    ) {

        achievements.firstEcho = true;

        showAchievement(
            "FIRST ECHO"
        );

    }


    if (
        player.kills >= 10 &&
        !achievements.tenEchoes
    ) {

        achievements.tenEchoes = true;

        showAchievement(
            "TEN ECHOES"
        );

    }


    /* PICKUP */

    if (
        Math.random() < 0.25
    ) {

        pickups.push({

            x: enemy.x,

            y: enemy.y,

            type:
                Math.random() < 0.5
                    ? "energy"
                    : "credit"

        });

    }


    enemies.splice(
        index,
        1
    );


    createEnemy();

}


/* =====================================================
   DAMAGE PLAYER
===================================================== */

function damagePlayer(amount) {

    if (
        player.invincible > 0
    ) {

        return;

    }


    player.health -= amount;

    player.invincible = 30;


    createParticles(
        player.x,
        player.y,
        10
    );


    if (
        player.health <= 0
    ) {

        player.health = 0;

        gameOver();

    }

}


/* =====================================================
   GAME OVER
===================================================== */

function gameOver() {

    gameRunning = false;


    setTimeout(
        function () {

            const retry =
                confirm(
                    "GAME OVER\n\n" +

                    "KILLS: " +
                    player.kills +

                    "\nCREDITS: " +
                    player.credits +

                    "\n\nOpnieuw spelen?"
                );


            if (retry) {

                startNewGame();

            } else {

                document.getElementById(
                    "menu"
                ).style.display =
                    "flex";

            }

        },
        150
    );

}


/* =====================================================
   PICKUPS
===================================================== */

function updatePickups() {

    for (
        let i =
            pickups.length - 1;

        i >= 0;

        i--
    ) {

        const pickup =
            pickups[i];


        const distance =
            Math.hypot(
                pickup.x -
                player.x,

                pickup.y -
                player.y
            );


        if (distance < 35) {

            if (
                pickup.type ===
                "energy"
            ) {

                player.energy =
                    Math.min(
                        player.maxEnergy,

                        player.energy +
                        30
                    );

            } else {

                player.credits +=
                    25;

            }


            createParticles(
                pickup.x,
                pickup.y,
                10
            );


            pickups.splice(
                i,
                1
            );

        }

    }

}


/* =====================================================
   PARTICLES
===================================================== */

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
            Math.random() *
            3.5;


        particles.push({

            x: x,

            y: y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life:
                20 +
                Math.random() *
                20,

            size:
                2 +
                Math.random() *
                3

        });

    }

}


function updateParticles() {

    for (
        let i =
            particles.length - 1;

        i >= 0;

        i--
    ) {

        const p =
            particles[i];


        p.x +=
            p.vx;


        p.y +=
            p.vy;


        p.vx *= 0.97;
        p.vy *= 0.97;


        p.life--;


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


/* =====================================================
   CAMERA
===================================================== */

function updateCamera() {

    camera.x =
        player.x -
        W / 2;


    camera.y =
        player.y -
        H / 2;


    camera.x =
        Math.max(
            0,

            Math.min(
                WORLD_WIDTH - W,
                camera.x
            )
        );


    camera.y =
        Math.max(
            0,

            Math.min(
                WORLD_HEIGHT - H,
                camera.y
            )
        );

}


/* =====================================================
   DRAW WORLD
===================================================== */

function drawWorld() {

    ctx.fillStyle =
        "#0b151c";


    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    const gridSize = 100;


    const startX =
        Math.floor(
            camera.x /
            gridSize
        ) *
        gridSize;


    const startY =
        Math.floor(
            camera.y /
            gridSize
        ) *
        gridSize;


    for (
        let worldX =
            startX;

        worldX <
            camera.x + W + gridSize;

        worldX += gridSize
    ) {

        for (
            let worldY =
                startY;

            worldY <
                camera.y + H + gridSize;

            worldY += gridSize
        ) {

            const screenX =
                worldX -
                camera.x;


            const screenY =
                worldY -
                camera.y;


            const sector =
                Math.floor(
                    worldX /
                    500
                ) +
                Math.floor(
                    worldY /
                    500
                );


            if (
                sector % 4 === 0
            ) {

                ctx.fillStyle =
                    "#111f25";

            } else if (
                sector % 4 === 1
            ) {

                ctx.fillStyle =
                    "#122329";

            } else if (
                sector % 4 === 2
            ) {

                ctx.fillStyle =
                    "#151e27";

            } else {

                ctx.fillStyle =
                    "#101b23";

            }


            ctx.fillRect(
                screenX,
                screenY,
                gridSize,
                gridSize
            );

        }

    }


    /* GRID */

    ctx.strokeStyle =
        "rgba(120,190,220,0.06)";


    ctx.lineWidth = 1;


    for (
        let x =
            -(camera.x % 100);

        x < W;

        x += 100
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            H
        );

        ctx.stroke();

    }


    for (
        let y =
            -(camera.y % 100);

        y < H;

        y += 100
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            W,
            y
        );

        ctx.stroke();

    }


    /* WORLD BORDER */

    ctx.strokeStyle =
        "rgba(100,190,230,0.35)";

    ctx.lineWidth = 4;


    ctx.strokeRect(
        -camera.x,
        -camera.y,
        WORLD_WIDTH,
        WORLD_HEIGHT
    );

}


/* =====================================================
   DRAW PICKUPS
===================================================== */

function drawPickups() {

    for (const pickup of pickups) {

        const x =
            pickup.x -
            camera.x;


        const y =
            pickup.y -
            camera.y;


        ctx.save();


        ctx.translate(
            x,
            y
        );


        ctx.rotate(
            performance.now() /
            500
        );


        if (
            pickup.type ===
            "energy"
        ) {

            ctx.fillStyle =
                "#60dfff";

        } else {

            ctx.fillStyle =
                "#ffd35c";

        }


        ctx.fillRect(
            -7,
            -7,
            14,
            14
        );


        ctx.restore();

    }

}


/* =====================================================
   DRAW PLAYER
===================================================== */

function drawPlayer() {

    const x =
        player.x -
        camera.x;


    const y =
        player.y -
        camera.y;


    const worldMouseX =
        camera.x +
        mouse.x;


    const worldMouseY =
        camera.y +
        mouse.y;


    const angle =
        Math.atan2(
            worldMouseY -
            player.y,

            worldMouseX -
            player.x
        );


    /* SHADOW */

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";


    ctx.beginPath();


    ctx.ellipse(
        x,
        y + 15,
        25,
        9,
        0,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* ENERGY RING */

    ctx.strokeStyle =
        "rgba(90,210,255,0.25)";


    ctx.lineWidth = 3;


    ctx.beginPath();


    ctx.arc(
        x,
        y,
        26,
        0,
        Math.PI * 2
    );


    ctx.stroke();


    /* PLAYER */

    ctx.fillStyle =
        player.invincible > 0
            ? "#ffffff"
            : "#71cfff";


    ctx.beginPath();


    ctx.arc(
        x,
        y,
        player.radius,
        0,
        Math.PI * 2
    );


    ctx.fill();


    /* WEAPON */

    ctx.strokeStyle =
        "#e8f8ff";


    ctx.lineWidth = 6;


    ctx.beginPath();


    ctx.moveTo(
        x,
        y
    );


    ctx.lineTo(
        x +
        Math.cos(angle) *
        31,

        y +
        Math.sin(angle) *
        31
    );


    ctx.stroke();


    /* CORE */

    ctx.fillStyle =
        "#dff8ff";


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


/* =====================================================
   DRAW ENEMIES
===================================================== */

function drawEnemies() {

    for (const enemy of enemies) {

        const x =
            enemy.x -
            camera.x;


        const y =
            enemy.y -
            camera.y;


        let color =
            "#bd6dff";


        let glow =
            "#8b4bc0";


        if (
            enemy.type === "mid"
        ) {

            color =
                "#d18cff";

            glow =
                "#934cc7";

        }


        if (
            enemy.type === "heavy"
        ) {

            color =
                "#ff9c69";

            glow =
                "#bc6240";

        }


        /* SHADOW */

        ctx.fillStyle =
            "rgba(0,0,0,0.4)";


        ctx.beginPath();


        ctx.ellipse(
            x,
            y + 13,
            enemy.radius + 4,
            8,
            0,
            0,
            Math.PI * 2
        );


        ctx.fill();


        /* GLOW */

        ctx.fillStyle =
            glow;


        ctx.globalAlpha =
            0.18;


        ctx.beginPath();


        ctx.arc(
            x,
            y,
            enemy.radius + 9,
            0,
            Math.PI * 2
        );


        ctx.fill();


        ctx.globalAlpha =
            1;


        /* BODY */

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


        /* BORDER */

        ctx.strokeStyle =
            "#f1d7ff";


        ctx.lineWidth = 2;


        ctx.stroke();


        /* EYE */

        ctx.fillStyle =
            "#ffffff";


        ctx.beginPath();


        ctx.arc(
            x,
            y,
            4,
            0,
            Math.PI * 2
        );


        ctx.fill();


        /* HEALTH */

        ctx.fillStyle =
            "#080c10";


        ctx.fillRect(
            x - 20,
            y - enemy.radius - 12,
            40,
            4
        );


        ctx.fillStyle =
            color;


        ctx.fillRect(
            x - 20,
            y - enemy.radius - 12,

            40 *
            (
                enemy.hp /
                enemy.maxHp
            ),

            4
        );

    }

}


/* =====================================================
   DRAW BULLETS
===================================================== */

function drawBullets() {

    for (const bullet of bullets) {

        const x =
            bullet.x -
            camera.x;


        const y =
            bullet.y -
            camera.y;


        ctx.fillStyle =
            bullet.enemy
                ? "#ff9d78"
                : "#7be0ff";


        ctx.beginPath();


        ctx.arc(
            x,
            y,
            5,
            0,
            Math.PI * 2
        );


        ctx.fill();


        ctx.globalAlpha =
            0.25;


        ctx.beginPath();


        ctx.arc(
            x,
            y,
            10,
            0,
            Math.PI * 2
        );


        ctx.fill();


        ctx.globalAlpha =
            1;

    }

}


/* =====================================================
   DRAW PARTICLES
===================================================== */

function drawParticles() {

    for (const p of particles) {

        ctx.globalAlpha =
            Math.max(
                0,
                p.life / 40
            );


        ctx.fillStyle =
            "#9feaff";


        ctx.fillRect(
            p.x -
            camera.x,

            p.y -
            camera.y,

            p.size,

            p.size
        );

    }


    ctx.globalAlpha =
        1;

}


/* =====================================================
   HUD
===================================================== */

function updateHUD() {

    if (!player) {
        return;
    }


    const healthPercent =
        Math.max(
            0,
            player.health /
            player.maxHealth *
            100
        );


    const energyPercent =
        Math.max(
            0,
            player.energy /
            player.maxEnergy *
            100
        );


    document.getElementById(
        "healthBar"
    ).style.width =
        healthPercent + "%";


    document.getElementById(
        "energyBar"
    ).style.width =
        energyPercent + "%";


    document.getElementById(
        "ammo"
    ).textContent =
        player.ammo +
        " / ∞";


    document.getElementById(
        "kills"
    ).textContent =
        "KILLS: " +
        player.kills;


    document.getElementById(
        "credits"
    ).textContent =
        "CREDITS: " +
        player.credits;


    const zoneX =
        Math.floor(
            player.x /
            600
        ) + 1;


    const zoneY =
        Math.floor(
            player.y /
            600
        ) + 1;


    document.getElementById(
        "zone"
    ).textContent =
        "SECTOR " +
        zoneX +
        "-" +
        zoneY;


    if (
        player.kills === 0
    ) {

        document.getElementById(
            "objective"
        ).textContent =
            "FIND THE SIGNAL";

    } else if (
        player.kills < 5
    ) {

        document.getElementById(
            "objective"
        ).textContent =
            "EXPLORE THE SECTOR";

    } else {

        document.getElementById(
            "objective"
        ).textContent =
            "FOLLOW THE ECHOES";

    }

}


/* =====================================================
   ACHIEVEMENT POPUP
===================================================== */

let achievementTimer = null;


function showAchievement(name) {

    const box =
        document.getElementById(
            "achievement"
        );


    const nameBox =
        document.getElementById(
            "achievementName"
        );


    nameBox.textContent =
        name;


    box.classList.add(
        "show"
    );


    if (achievementTimer) {

        clearTimeout(
            achievementTimer
        );

    }


    achievementTimer =
        setTimeout(
            function () {

                box.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =====================================================
   MAP DRAW
===================================================== */

function drawMap() {

    const rect =
        mapCanvas.getBoundingClientRect();


    const width =
        Math.max(
            300,
            Math.floor(rect.width)
        );


    const height =
        Math.max(
            250,
            Math.floor(rect.height)
        );


    mapCanvas.width =
        width;


    mapCanvas.height =
        height;


    mapCtx.fillStyle =
        "#061019";


    mapCtx.fillRect(
        0,
        0,
        width,
        height
    );


    const scaleX =
        width /
        WORLD_WIDTH;


    const scaleY =
        height /
        WORLD_HEIGHT;


    /* GRID */

    mapCtx.strokeStyle =
        "rgba(100,180,220,0.12)";


    mapCtx.lineWidth = 1;


    for (
        let x = 0;

        x <= WORLD_WIDTH;

        x += 200
    ) {

        mapCtx.beginPath();

        mapCtx.moveTo(
            x * scaleX,
            0
        );

        mapCtx.lineTo(
            x * scaleX,
            height
        );

        mapCtx.stroke();

    }


    for (
        let y = 0;

        y <= WORLD_HEIGHT;

        y += 200
    ) {

        mapCtx.beginPath();

        mapCtx.moveTo(
            0,
            y * scaleY
        );

        mapCtx.lineTo(
            width,
            y * scaleY
        );

        mapCtx.stroke();

    }


    /* ENEMIES */

    mapCtx.fillStyle =
        "#b86cff";


    for (const enemy of enemies) {

        mapCtx.beginPath();


        mapCtx.arc(
            enemy.x * scaleX,
            enemy.y * scaleY,
            3,
            0,
            Math.PI * 2
        );


        mapCtx.fill();

    }


    /* PLAYER */

    mapCtx.fillStyle =
        "#72d8ff";


    mapCtx.beginPath();


    mapCtx.arc(
        player.x * scaleX,
        player.y * scaleY,
        6,
        0,
        Math.PI * 2
    );


    mapCtx.fill();


    mapCtx.strokeStyle =
        "#dff9ff";


    mapCtx.lineWidth = 2;


    mapCtx.stroke();


}


/* =====================================================
   UPDATE
===================================================== */

function update() {

    if (
        !gameRunning ||
        paused
    ) {

        return;

    }


    updatePlayer();

    updateEnemies();

    updateBullets();

    updatePickups();

    updateParticles();

    updateCamera();


    if (mouse.down) {

        shoot();

    }


    updateHUD();

}


/* =====================================================
   DRAW
===================================================== */

function draw() {

    drawWorld();


    if (!player) {

        return;

    }


    drawPickups();

    drawParticles();

    drawBullets();

    drawEnemies();

    drawPlayer();

}


/* =====================================================
   GAME LOOP
===================================================== */

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );

}


gameLoop();


/* =====================================================
   STARTUP
===================================================== */

updateHUD();
