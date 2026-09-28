"use strict";

/* =====================================================
   ECHOBOUND — THE LOST SIGNAL
   COMPLETE + STABLE VERSION
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
   STATE
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
   WALLS
===================================================== */

const walls = [
    { x: 520, y: 420, w: 430, h: 55 },
    { x: 1040, y: 300, w: 55, h: 520 },
    { x: 1370, y: 520, w: 480, h: 55 },
    { x: 1480, y: 980, w: 55, h: 570 },
    { x: 820, y: 1500, w: 520, h: 55 },
    { x: 410, y: 1050, w: 55, h: 430 },
    { x: 1080, y: 1000, w: 55, h: 300 },
    { x: 610, y: 1850, w: 460, h: 55 },
    { x: 1760, y: 1680, w: 430, h: 55 },
    { x: 1860, y: 760, w: 55, h: 430 }
];

/* =====================================================
   SAVE
===================================================== */

const SAVE_KEY = "echobound_save_v5";

let achievements = {
    firstEcho: false,
    tenEchoes: false,
    firstSave: false,
    explorer: false
};

/* =====================================================
   DOM HELPERS
===================================================== */

function get(id) {
    return document.getElementById(id);
}

/* =====================================================
   ACHIEVEMENTS PAGE
===================================================== */

function createAchievementsPage() {

    if (get("achievementsScreen")) {
        return;
    }

    const screen = document.createElement("div");

    screen.id = "achievementsScreen";

    screen.innerHTML = `
        <div class="achievementsWindow">

            <div class="achievementsTop">

                <div>
                    <div class="achievementLogo">
                        ECHOBOUND
                    </div>

                    <h2>
                        ACHIEVEMENTS
                    </h2>

                    <p>
                        Bekijk je voortgang.
                    </p>
                </div>

                <button id="dynamicCloseAchievements">
                    BACK
                </button>

            </div>

            <div class="achievementCards">

                <div class="dynamicAchievement" id="cardFirstEcho">
                    <div class="dynamicIcon">◈</div>

                    <div class="dynamicText">
                        <h3>FIRST ECHO</h3>
                        <p>Versla je eerste vijand.</p>
                    </div>

                    <div class="dynamicStatus">
                        LOCKED
                    </div>
                </div>

                <div class="dynamicAchievement" id="cardTenEchoes">
                    <div class="dynamicIcon">◆</div>

                    <div class="dynamicText">
                        <h3>TEN ECHOES</h3>
                        <p>Versla 10 vijanden.</p>
                    </div>

                    <div class="dynamicStatus">
                        LOCKED
                    </div>
                </div>

                <div class="dynamicAchievement" id="cardFirstSave">
                    <div class="dynamicIcon">⬡</div>

                    <div class="dynamicText">
                        <h3>FIRST SAVE</h3>
                        <p>Sla je run op.</p>
                    </div>

                    <div class="dynamicStatus">
                        LOCKED
                    </div>
                </div>

                <div class="dynamicAchievement" id="cardExplorer">
                    <div class="dynamicIcon">✦</div>

                    <div class="dynamicText">
                        <h3>EXPLORER</h3>
                        <p>Leg 5000 meter af.</p>
                    </div>

                    <div class="dynamicStatus">
                        LOCKED
                    </div>
                </div>

            </div>

        </div>
    `;

    document.body.appendChild(screen);

    injectAchievementCSS();

    get("dynamicCloseAchievements").addEventListener(
        "click",
        function () {
            closeAchievements();
        }
    );
}

function injectAchievementCSS() {

    if (get("dynamicAchievementCSS")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "dynamicAchievementCSS";

    style.textContent = `
        #achievementsScreen {
            position: fixed;
            inset: 0;
            z-index: 500;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background:
                radial-gradient(
                    circle at center,
                    #193746 0%,
                    #0b1720 45%,
                    #03070b 100%
                );
        }

        .achievementsWindow {
            width: min(900px, 95vw);
            max-height: 90vh;
            overflow-y: auto;
            padding: 35px;
            background:
                linear-gradient(
                    145deg,
                    #142936,
                    #08121a
                );
            border: 1px solid #4b7184;
            border-radius: 20px;
            box-shadow:
                0 30px 100px rgba(0,0,0,0.8);
        }

        .achievementsTop {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 30px;
        }

        .achievementLogo {
            color: #78cfff;
            font-size: 11px;
            font-weight: bold;
            letter-spacing: 5px;
            margin-bottom: 8px;
        }

        .achievementsTop h2 {
            color: #f4fbff;
            font-size: 38px;
            letter-spacing: 4px;
            margin: 0;
        }

        .achievementsTop p {
            color: #8199a8;
            margin-top: 8px;
            font-size: 14px;
        }

        #dynamicCloseAchievements {
            padding: 10px 18px;
            color: white;
            background: #162a38;
            border: 1px solid #4c6877;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
        }

        #dynamicCloseAchievements:hover {
            border-color: #77d4ff;
            background: #214457;
        }

        .achievementCards {
            display: grid;
            grid-template-columns:
                repeat(2, minmax(0, 1fr));
            gap: 15px;
        }

        .dynamicAchievement {
            display: grid;
            grid-template-columns:
                52px 1fr auto;
            align-items: center;
            gap: 15px;
            min-height: 105px;
            padding: 16px;
            background: #0e1c25;
            border: 1px solid #294351;
            border-radius: 13px;
        }

        .dynamicAchievement.unlocked {
            background: #14303e;
            border-color: #5ec7f3;
            box-shadow:
                0 0 20px rgba(80,190,240,0.08);
        }

        .dynamicIcon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 11px;
            border: 1px solid #344f5d;
            color: #536977;
            background: #08131a;
            font-size: 23px;
        }

        .dynamicAchievement.unlocked .dynamicIcon {
            color: #7addff;
            border-color: #54a8ca;
        }

        .dynamicText h3 {
            color: #e4f3fa;
            font-size: 14px;
            letter-spacing: 1.5px;
            margin-bottom: 6px;
        }

        .dynamicText p {
            color: #768d9b;
            font-size: 12px;
        }

        .dynamicStatus {
            color: #5d717d;
            font-size: 9px;
            font-weight: bold;
            letter-spacing: 2px;
        }

        .dynamicAchievement.unlocked .dynamicStatus {
            color: #70d7ff;
        }

        @media (max-width: 700px) {
            .achievementCards {
                grid-template-columns: 1fr;
            }

            .achievementsWindow {
                padding: 20px;
            }

            .achievementsTop h2 {
                font-size: 29px;
            }
        }
    `;

    document.head.appendChild(style);
}

function showAchievements() {

    createAchievementsPage();

    get("achievementsScreen").style.display = "flex";

    updateAchievementsPage();
}

function closeAchievements() {

    const screen = get("achievementsScreen");

    if (screen) {
        screen.style.display = "none";
    }
}

function updateAchievementsPage() {

    createAchievementsPage();

    updateAchievementCard(
        "cardFirstEcho",
        achievements.firstEcho
    );

    updateAchievementCard(
        "cardTenEchoes",
        achievements.tenEchoes
    );

    updateAchievementCard(
        "cardFirstSave",
        achievements.firstSave
    );

    updateAchievementCard(
        "cardExplorer",
        achievements.explorer
    );
}

function updateAchievementCard(id, unlocked) {

    const card = get(id);

    if (!card) {
        return;
    }

    const status =
        card.querySelector(".dynamicStatus");

    if (unlocked) {

        card.classList.add("unlocked");

        if (status) {
            status.textContent = "UNLOCKED";
        }

    } else {

        card.classList.remove("unlocked");

        if (status) {
            status.textContent = "LOCKED";
        }
    }
}

/* =====================================================
   BUTTON SETUP
===================================================== */

const newGameButton = get("newGame");
const loadGameButton = get("loadGame");
const achievementsButton =
    get("achievementsButton");
const controlsButton =
    get("controlsButton");
const resumeButton = get("resume");
const saveButton = get("save");
const quitButton = get("quit");
const closeMapButton = get("closeMap");

if (newGameButton) {
    newGameButton.addEventListener(
        "click",
        startNewGame
    );
}

if (loadGameButton) {
    loadGameButton.addEventListener(
        "click",
        loadGame
    );
}

if (achievementsButton) {
    achievementsButton.addEventListener(
        "click",
        showAchievements
    );
}

if (controlsButton) {
    controlsButton.addEventListener(
        "click",
        showControls
    );
}

if (resumeButton) {
    resumeButton.addEventListener(
        "click",
        resumeGame
    );
}

if (saveButton) {
    saveButton.addEventListener(
        "click",
        saveGame
    );
}

if (quitButton) {
    quitButton.addEventListener(
        "click",
        quitToMenu
    );
}

if (closeMapButton) {
    closeMapButton.addEventListener(
        "click",
        closeMap
    );
}

/* =====================================================
   NEW GAME
===================================================== */

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

    mouse.down = false;

    for (let i = 0; i < 18; i++) {
        createEnemy();
    }

    gameRunning = true;
    paused = false;

    get("menu").style.display = "none";
    get("pause").style.display = "none";
    get("map").style.display = "none";

    closeAchievements();

    updateHUD();
}

/* =====================================================
   LOAD GAME
===================================================== */

function loadGame() {

    const saved =
        localStorage.getItem(SAVE_KEY);

    if (!saved) {

        alert(
            "Er is nog geen opgeslagen run."
        );

        return;
    }

    try {

        const data =
            JSON.parse(saved);

        player = data.player;

        if (!player) {
            throw new Error(
                "Player missing"
            );
        }

        player.radius =
            player.radius || 18;

        player.speed =
            player.speed || 3.5;

        player.maxHealth =
            player.maxHealth || 100;

        player.maxEnergy =
            player.maxEnergy || 100;

        player.health =
            typeof player.health === "number"
                ? player.health
                : 100;

        player.energy =
            typeof player.energy === "number"
                ? player.energy
                : 100;

        player.ammo =
            typeof player.ammo === "number"
                ? player.ammo
                : 12;

        player.kills =
            typeof player.kills === "number"
                ? player.kills
                : 0;

        player.credits =
            typeof player.credits === "number"
                ? player.credits
                : 0;

        player.distance =
            player.distance || 0;

        player.cooldown = 0;
        player.dashCooldown = 0;
        player.dashTimer = 0;
        player.invincible = 0;

        if (data.achievements) {

            achievements = {
                ...achievements,
                ...data.achievements
            };
        }

        if (
            collidesWithWall(
                player.x,
                player.y,
                player.radius
            )
        ) {

            player.x =
                WORLD_WIDTH / 2;

            player.y =
                WORLD_HEIGHT / 2;
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
        mouse.down = false;

        get("menu").style.display = "none";

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

function saveGame() {

    if (!player) {

        alert(
            "Start eerst een game."
        );

        return;
    }

    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
            player: player,
            achievements: achievements
        })
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

    updateAchievementsPage();
}

/* =====================================================
   CONTROLS
===================================================== */

function showControls() {

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

/* =====================================================
   PAUSE
===================================================== */

function resumeGame() {

    paused = false;

    get("pause").style.display =
        "none";
}

function quitToMenu() {

    if (player) {
        saveGame();
    }

    gameRunning = false;
    paused = false;
    mouse.down = false;

    get("pause").style.display =
        "none";

    get("map").style.display =
        "none";

    closeAchievements();

    get("menu").style.display =
        "flex";
}

/* =====================================================
   COLLISION
===================================================== */

function circleIntersectsRect(
    cx,
    cy,
    radius,
    rect
) {

    const closestX =
        Math.max(
            rect.x,
            Math.min(
                cx,
                rect.x + rect.w
            )
        );

    const closestY =
        Math.max(
            rect.y,
            Math.min(
                cy,
                rect.y + rect.h
            )
        );

    const dx =
        cx - closestX;

    const dy =
        cy - closestY;

    return (
        dx * dx +
        dy * dy <
        radius * radius
    );
}

function collidesWithWall(
    x,
    y,
    radius
) {

    for (const wall of walls) {

        if (
            circleIntersectsRect(
                x,
                y,
                radius,
                wall
            )
        ) {

            return true;
        }
    }

    return false;
}

function pointInRect(
    x,
    y,
    rect
) {

    return (
        x >= rect.x &&
        x <= rect.x + rect.w &&
        y >= rect.y &&
        y <= rect.y + rect.h
    );
}

function segmentIntersectsRect(
    x1,
    y1,
    x2,
    y2,
    rect
) {

    if (
        pointInRect(
            x1,
            y1,
            rect
        )
        ||
        pointInRect(
            x2,
            y2,
            rect
        )
    ) {

        return true;
    }

    const dx = x2 - x1;
    const dy = y2 - y1;

    let t0 = 0;
    let t1 = 1;

    const p = [
        -dx,
        dx,
        -dy,
        dy
    ];

    const q = [
        x1 - rect.x,
        rect.x + rect.w - x1,
        y1 - rect.y,
        rect.y + rect.h - y1
    ];

    for (let i = 0; i < 4; i++) {

        if (p[i] === 0) {

            if (q[i] < 0) {
                return false;
            }

        } else {

            const r =
                q[i] / p[i];

            if (p[i] < 0) {

                if (r > t1) {
                    return false;
                }

                if (r > t0) {
                    t0 = r;
                }

            } else {

                if (r < t0) {
                    return false;
                }

                if (r < t1) {
                    t1 = r;
                }
            }
        }
    }

    return true;
}

function bulletHitsWall(
    x1,
    y1,
    x2,
    y2
) {

    for (const wall of walls) {

        if (
            segmentIntersectsRect(
                x1,
                y1,
                x2,
                y2,
                wall
            )
        ) {

            return true;
        }
    }

    return false;
}

function moveCircle(
    entity,
    dx,
    dy
) {

    const nextX =
        entity.x + dx;

    const nextY =
        entity.y + dy;

    if (
        !collidesWithWall(
            nextX,
            entity.y,
            entity.radius
        )
    ) {

        entity.x = nextX;
    }

    if (
        !collidesWithWall(
            entity.x,
            nextY,
            entity.radius
        )
    ) {

        entity.y = nextY;
    }

    entity.x =
        Math.max(
            entity.radius,
            Math.min(
                WORLD_WIDTH -
                entity.radius,
                entity.x
            )
        );

    entity.y =
        Math.max(
            entity.radius,
            Math.min(
                WORLD_HEIGHT -
                entity.radius,
                entity.y
            )
        );
}

/* =====================================================
   KEYBOARD
===================================================== */

window.addEventListener(
    "keydown",
    function (event) {

        const key =
            event.key.toLowerCase();

        keys[key] = true;

        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            keys.space = true;
        }

        if (
            key === "escape"
        ) {

            const achievementScreen =
                get("achievementsScreen");

            const map =
                get("map");

            if (
                achievementScreen &&
                achievementScreen.style.display === "flex"
            ) {

                closeAchievements();

                return;
            }

            if (
                map &&
                map.style.display === "flex"
            ) {

                closeMap();

                return;
            }

            if (gameRunning) {

                paused = !paused;

                get("pause").style.display =
                    paused
                        ? "flex"
                        : "none";
            }
        }

        if (
            key === "m" &&
            gameRunning &&
            !paused
        ) {

            toggleMap();
        }
    }
);

window.addEventListener(
    "keyup",
    function (event) {

        keys[
            event.key.toLowerCase()
        ] = false;

        if (
            event.code === "Space"
        ) {

            keys.space = false;
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

        if (
            event.button === 0 &&
            gameRunning &&
            !paused
        ) {

            mouse.down = true;
        }
    }
);

window.addEventListener(
    "mouseup",
    function (event) {

        if (
            event.button === 0
        ) {

            mouse.down = false;
        }
    }
);

/* =====================================================
   MAP
===================================================== */

function toggleMap() {

    const map = get("map");

    if (!map) {
        return;
    }

    if (
        map.style.display === "flex"
    ) {

        closeMap();

    } else {

        openMap();
    }
}

function openMap() {

    const map = get("map");

    if (!map) {
        return;
    }

    map.style.display = "flex";

    drawMap();
}

function closeMap() {

    const map = get("map");

    if (!map) {
        return;
    }

    map.style.display = "none";
}

/* =====================================================
   ENEMIES
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

        (

            Math.hypot(
                x - player.x,
                y - player.y
            ) < 400

            ||

            collidesWithWall(
                x,
                y,
                22
            )

        )

        &&

        attempts < 200
    );

    const random =
        Math.random();

    let enemy;

    if (random > 0.85) {

        enemy = {

            x: x,
            y: y,

            radius: 21,

            speed: 0.55,

            hp: 4,
            maxHp: 4,

            cooldown:
                60 +
                Math.random() *
                80,

            type: "heavy"
        };

    } else if (random > 0.6) {

        enemy = {

            x: x,
            y: y,

            radius: 18,

            speed: 0.75,

            hp: 3,
            maxHp: 3,

            cooldown:
                60 +
                Math.random() *
                80,

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
                Math.random() *
                100,

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

    if (keys.w) {
        dy--;
    }

    if (keys.s) {
        dy++;
    }

    if (keys.a) {
        dx--;
    }

    if (keys.d) {
        dx++;
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
            player.dashTimer > 0
        ) {

            speed = 11;

            player.dashTimer--;
        }

        const oldX =
            player.x;

        const oldY =
            player.y;

        moveCircle(
            player,
            dx * speed,
            dy * speed
        );

        player.distance +=
            Math.hypot(
                player.x - oldX,
                player.y - oldY
            );

        if (
            player.distance >= 5000 &&
            !achievements.explorer
        ) {

            achievements.explorer = true;

            showAchievement(
                "EXPLORER"
            );

            updateAchievementsPage();
        }
    }

    if (

        keys.space &&

        player.dashCooldown <= 0 &&

        player.energy >= 25 &&

        (
            dx !== 0 ||
            dy !== 0
        )

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

        keys.space = false;
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
}

/* =====================================================
   SHOOT
===================================================== */

function shoot() {

    if (
        !player ||
        player.cooldown > 0 ||
        paused
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
   ENEMY UPDATE
===================================================== */

function updateEnemies() {

    for (
        const enemy of enemies
    ) {

        const dx =
            player.x -
            enemy.x;

        const dy =
            player.y -
            enemy.y;

        const distance =
            Math.hypot(dx, dy);

        if (
            distance > 65 &&
            distance > 0
        ) {

            moveCircle(

                enemy,

                dx /
                distance *
                enemy.speed,

                dy /
                distance *
                enemy.speed

            );
        }

        if (
            distance < 650
        ) {

            enemy.cooldown--;

            if (
                enemy.cooldown <= 0
            ) {

                enemy.cooldown =
                    100 +
                    Math.random() *
                    100;

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
                    speed = 3;
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

        const oldX =
            bullet.x;

        const oldY =
            bullet.y;

        bullet.x +=
            bullet.vx;

        bullet.y +=
            bullet.vy;

        bullet.life--;

        /* WALL */

        if (
            bulletHitsWall(
                oldX,
                oldY,
                bullet.x,
                bullet.y
            )
        ) {

            createParticles(
                bullet.x,
                bullet.y,
                7
            );

            bullets.splice(
                i,
                1
            );

            continue;
        }

        /* ENEMY BULLET */

        if (bullet.enemy) {

            if (

                Math.hypot(
                    bullet.x -
                    player.x,

                    bullet.y -
                    player.y
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

        } else {

            /* PLAYER BULLET */

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

            bullet.x >
            WORLD_WIDTH ||

            bullet.y >
            WORLD_HEIGHT

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

    if (
        enemy.type === "heavy"
    ) {

        player.credits += 30;

    } else if (
        enemy.type === "mid"
    ) {

        player.credits += 20;

    } else {

        player.credits += 10;
    }

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

    updateAchievementsPage();
}

/* =====================================================
   DAMAGE
===================================================== */

function damagePlayer(amount) {

    if (
        !player ||
        player.invincible > 0 ||
        !gameRunning
    ) {

        return;
    }

    player.health -=
        amount;

    player.invincible =
        30;

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
    paused = false;
    mouse.down = false;

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

                get("menu").style.display =
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

        if (
            distance < 35
        ) {

            if (
                pickup.type ===
                "energy"
            ) {

                player.energy =
                    Math.min(
                        player.maxEnergy,
                        player.energy + 30
                    );

            } else {

                player.credits += 25;
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
            Math.random() * 3.5;

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
                Math.random() * 3
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

        p.x += p.vx;
        p.y += p.vy;

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

    if (!player) {
        return;
    }

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
        let worldX = startX;
        worldX <
        camera.x + W + gridSize;
        worldX += gridSize
    ) {

        for (
            let worldY = startY;
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
                    worldX / 500
                ) +
                Math.floor(
                    worldY / 500
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

    drawWalls();

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
   DRAW WALLS
===================================================== */

function drawWalls() {

    const pulse =
        0.30 +
        Math.sin(
            performance.now() / 450
        ) * 0.08;

    for (const wall of walls) {

        const x =
            wall.x -
            camera.x;

        const y =
            wall.y -
            camera.y;

        /* Shadow */

        ctx.fillStyle =
            "rgba(0,0,0,0.45)";

        ctx.fillRect(
            x + 6,
            y + 8,
            wall.w,
            wall.h
        );

        /* Body */

        ctx.fillStyle =
            "#1b2c37";

        ctx.fillRect(
            x,
            y,
            wall.w,
            wall.h
        );

        /* Border */

        ctx.strokeStyle =
            "#4e7a8c";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            x,
            y,
            wall.w,
            wall.h
        );

        /* Energy line */

        ctx.fillStyle =
            `rgba(104,220,255,${pulse})`;

        if (
            wall.w >= wall.h
        ) {

            ctx.fillRect(
                x + 8,
                y + wall.h / 2 - 2,
                wall.w - 16,
                4
            );

        } else {

            ctx.fillRect(
                x + wall.w / 2 - 2,
                y + 8,
                4,
                wall.h - 16
            );
        }
    }
}

/* =====================================================
   DRAW PICKUPS
===================================================== */

function drawPickups() {

    for (
        const pickup of pickups
    ) {

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

        ctx.fillStyle =

            pickup.type === "energy"

                ? "#60dfff"

                : "#ffd35c";

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
        Math.cos(angle) * 31,

        y +
        Math.sin(angle) * 31
    );

    ctx.stroke();

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

    for (
        const enemy of enemies
    ) {

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

        ctx.fillStyle =
            glow;

        ctx.globalAlpha = 0.18;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            enemy.radius + 9,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.globalAlpha = 1;

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

        ctx.strokeStyle =
            "#f1d7ff";

        ctx.lineWidth = 2;

        ctx.stroke();

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

    for (
        const bullet of bullets
    ) {

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

        ctx.globalAlpha = 0.25;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            10,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

/* =====================================================
   DRAW PARTICLES
===================================================== */

function drawParticles() {

    for (
        const p of particles
    ) {

        ctx.globalAlpha =
            Math.max(
                0,
                p.life / 40
            );

        ctx.fillStyle =
            "#9feaff";

        ctx.fillRect(
            p.x - camera.x,
            p.y - camera.y,
            p.size,
            p.size
        );
    }

    ctx.globalAlpha = 1;
}

/* =====================================================
   HUD
===================================================== */

function updateHUD() {

    if (!player) {
        return;
    }

    const health =
        Math.max(
            0,
            player.health /
            player.maxHealth *
            100
        );

    const energy =
        Math.max(
            0,
            player.energy /
            player.maxEnergy *
            100
        );

    const healthBar =
        get("healthBar");

    const energyBar =
        get("energyBar");

    const ammo =
        get("ammo");

    const kills =
        get("kills");

    const credits =
        get("credits");

    const zone =
        get("zone");

    const objective =
        get("objective");

    if (healthBar) {
        healthBar.style.width =
            health + "%";
    }

    if (energyBar) {
        energyBar.style.width =
            energy + "%";
    }

    if (ammo) {
        ammo.textContent =
            player.ammo + " / ∞";
    }

    if (kills) {
        kills.textContent =
            "KILLS: " +
            player.kills;
    }

    if (credits) {
        credits.textContent =
            "CREDITS: " +
            player.credits;
    }

    if (zone) {

        const zoneX =
            Math.floor(
                player.x / 600
            ) + 1;

        const zoneY =
            Math.floor(
                player.y / 600
            ) + 1;

        zone.textContent =
            "SECTOR " +
            zoneX +
            "-" +
            zoneY;
    }

    if (objective) {

        if (player.kills === 0) {

            objective.textContent =
                "FIND THE SIGNAL";

        } else if (
            player.kills < 5
        ) {

            objective.textContent =
                "EXPLORE THE SECTOR";

        } else {

            objective.textContent =
                "FOLLOW THE ECHOES";
        }
    }
}

/* =====================================================
   ACHIEVEMENT POPUP
===================================================== */

let achievementTimer = null;

function showAchievement(name) {

    const box =
        get("achievement");

    const nameBox =
        get("achievementName");

    if (
        !box ||
        !nameBox
    ) {
        return;
    }

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

    if (!player || !mapCanvas) {
        return;
    }

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

    /* WALLS */

    for (
        const wall of walls
    ) {

        mapCtx.fillStyle =
            "#395765";

        mapCtx.fillRect(

            wall.x * scaleX,

            wall.y * scaleY,

            wall.w * scaleX,

            wall.h * scaleY

        );

        mapCtx.strokeStyle =
            "#76d8ff";

        mapCtx.strokeRect(

            wall.x * scaleX,

            wall.y * scaleY,

            wall.w * scaleX,

            wall.h * scaleY

        );
    }

    /* ENEMIES */

    mapCtx.fillStyle =
        "#b86cff";

    for (
        const enemy of enemies
    ) {

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
   GAME LOOP
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

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );
}

gameLoop();

updateHUD();
