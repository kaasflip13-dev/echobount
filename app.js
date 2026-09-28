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

let boss = null;

let doors = [];
let switches = [];

let camera = {
    x: 0,
    y: 0
};

let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

let audioCtx = null;
let musicStarted = false;
let musicMuted = false;
let musicNodes = [];

let lastTime = performance.now();

/* =====================================================
   WORLD
===================================================== */

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 2400;

/* =====================================================
   SAVE
===================================================== */

const SAVE_KEY = "echobound_save_v6";

/* =====================================================
   STATS
===================================================== */

const stats = {

    totalKills: 0,

    bossesDefeated: 0,

    shots: 0,

    damage: 0,

    distance: 0,

    runs: 0

};

/* =====================================================
   ACHIEVEMENTS
===================================================== */

let achievements = {

    firstEcho: false,

    tenEchoes: false,

    firstSave: false,

    explorer: false,

    bossSlayer: false,

    levelFive: false,

    arsenal: false

};

/* =====================================================
   SETTINGS
===================================================== */

let settings = {

    difficulty:
        localStorage.getItem(
            "echobound_difficulty"
        ) || "normal",

    skin:
        Number(
            localStorage.getItem(
                "echobound_skin"
            ) || 0
        )

};

/* =====================================================
   WALLS
===================================================== */

const staticWalls = [

    {
        x: 520,
        y: 420,
        w: 430,
        h: 55
    },

    {
        x: 1040,
        y: 300,
        w: 55,
        h: 520
    },

    {
        x: 1370,
        y: 520,
        w: 480,
        h: 55
    },

    {
        x: 1480,
        y: 980,
        w: 55,
        h: 570
    },

    {
        x: 820,
        y: 1500,
        w: 520,
        h: 55
    },

    {
        x: 410,
        y: 1050,
        w: 55,
        h: 430
    },

    {
        x: 1080,
        y: 1000,
        w: 55,
        h: 300
    },

    {
        x: 610,
        y: 1850,
        w: 460,
        h: 55
    },

    {
        x: 1760,
        y: 1680,
        w: 430,
        h: 55
    },

    {
        x: 1860,
        y: 760,
        w: 55,
        h: 430
    }

];

/* =====================================================
   DOORS
===================================================== */

const doorBlueprints = [

    {
        id: 0,
        x: 960,
        y: 750,
        w: 120,
        h: 35,
        open: false
    },

    {
        id: 1,
        x: 1360,
        y: 970,
        w: 35,
        h: 120,
        open: false
    },

    {
        id: 2,
        x: 780,
        y: 1450,
        w: 120,
        h: 35,
        open: false
    },

    {
        id: 3,
        x: 1460,
        y: 1540,
        w: 35,
        h: 120,
        open: false
    },

    {
        id: 4,
        x: 1710,
        y: 1650,
        w: 120,
        h: 35,
        open: false
    },

    {
        id: 5,
        x: 400,
        y: 1480,
        w: 35,
        h: 120,
        open: false
    }

];

const switchBlueprints = [

    {
        id: 0,
        x: 900,
        y: 820,
        door: 0
    },

    {
        id: 1,
        x: 1420,
        y: 930,
        door: 1
    },

    {
        id: 2,
        x: 740,
        y: 1430,
        door: 2
    },

    {
        id: 3,
        x: 1550,
        y: 1600,
        door: 3
    },

    {
        id: 4,
        x: 1660,
        y: 1740,
        door: 4
    },

    {
        id: 5,
        x: 500,
        y: 1570,
        door: 5
    }

];

function resetWorldObjects() {

    doors =
        doorBlueprints.map(
            door => ({
                ...door
            })
        );

    switches =
        switchBlueprints.map(
            sw => ({
                ...sw,
                active: false
            })
        );

}

resetWorldObjects();

/* =====================================================
   HELPERS
===================================================== */

function el(id) {

    return document.getElementById(id);

}

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}

function randomBetween(
    min,
    max
) {

    return (
        min +
        Math.random() *
        (max - min)
    );

}

function distanceBetween(
    a,
    b
) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );

}

function angleBetween(
    a,
    b
) {

    return Math.atan2(
        b.y - a.y,
        b.x - a.x
    );

}

function difficultyScale() {

    if (
        settings.difficulty ===
        "easy"
    ) {

        return 0.8;

    }

    if (
        settings.difficulty ===
        "hard"
    ) {

        return 1.25;

    }

    return 1;

}

/* =====================================================
   COLLISION
===================================================== */

function pointInRect(
    x,
    y,
    rect
) {

    return (

        x >= rect.x &&

        x <=
        rect.x + rect.w &&

        y >= rect.y &&

        y <=
        rect.y + rect.h

    );

}

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

function activeObstacles() {

    return staticWalls.concat(
        doors.filter(
            door => !door.open
        )
    );

}

function collidesWall(
    x,
    y,
    radius
) {

    return activeObstacles().some(
        wall =>
            circleIntersectsRect(
                x,
                y,
                radius,
                wall
            )
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
        ) ||
        pointInRect(
            x2,
            y2,
            rect
        )
    ) {

        return true;

    }

    const dx =
        x2 - x1;

    const dy =
        y2 - y1;

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

        rect.x +
        rect.w -
        x1,

        y1 - rect.y,

        rect.y +
        rect.h -
        y1

    ];

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        if (
            p[i] === 0
        ) {

            if (
                q[i] < 0
            ) {

                return false;

            }

        } else {

            const r =
                q[i] /
                p[i];

            if (
                p[i] < 0
            ) {

                if (
                    r > t1
                ) {

                    return false;

                }

                if (
                    r > t0
                ) {

                    t0 = r;

                }

            } else {

                if (
                    r < t0
                ) {

                    return false;

                }

                if (
                    r < t1
                ) {

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

    return activeObstacles().some(
        wall =>
            segmentIntersectsRect(
                x1,
                y1,
                x2,
                y2,
                wall
            )
    );

}

function moveEntity(
    entity,
    dx,
    dy,
    flying = false
) {

    if (
        flying
    ) {

        entity.x += dx;
        entity.y += dy;

    } else {

        if (
            !collidesWall(
                entity.x + dx,
                entity.y,
                entity.radius
            )
        ) {

            entity.x += dx;

        }

        if (
            !collidesWall(
                entity.x,
                entity.y + dy,
                entity.radius
            )
        ) {

            entity.y += dy;

        }

    }

    entity.x =
        clamp(
            entity.x,
            entity.radius,
            WORLD_WIDTH -
            entity.radius
        );

    entity.y =
        clamp(
            entity.y,
            entity.radius,
            WORLD_HEIGHT -
            entity.radius
        );

}

/* =====================================================
   AUDIO
===================================================== */

function initAudio() {

    if (
        audioCtx
    ) {

        return;

    }

    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

    if (
        !AudioContextClass
    ) {

        return;

    }

    audioCtx =
        new AudioContextClass();

}

function playSfx(
    frequency = 440,
    duration = 0.06,
    type = "sine",
    volume = 0.03
) {

    if (
        musicMuted
    ) {

        return;

    }

    initAudio();

    if (
        !audioCtx
    ) {

        return;

    }

    const oscillator =
        audioCtx.createOscillator();

    const gain =
        audioCtx.createGain();

    oscillator.type =
        type;

    oscillator.frequency.value =
        frequency;

    gain.gain.value =
        volume;

    oscillator.connect(gain);

    gain.connect(
        audioCtx.destination
    );

    oscillator.start();

    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime +
        duration
    );

    oscillator.stop(
        audioCtx.currentTime +
        duration
    );

}

function startMusic() {

    if (
        musicStarted ||
        musicMuted
    ) {

        return;

    }

    initAudio();

    if (
        !audioCtx
    ) {

        return;

    }

    if (
        audioCtx.state ===
        "suspended"
    ) {

        audioCtx.resume();

    }

    const master =
        audioCtx.createGain();

    master.gain.value =
        0.015;

    master.connect(
        audioCtx.destination
    );

    const oscillator1 =
        audioCtx.createOscillator();

    const oscillator2 =
        audioCtx.createOscillator();

    oscillator1.type =
        "sine";

    oscillator2.type =
        "triangle";

    oscillator1.frequency.value =
        55;

    oscillator2.frequency.value =
        82;

    oscillator1.connect(
        master
    );

    oscillator2.connect(
        master
    );

    oscillator1.start();
    oscillator2.start();

    musicNodes = [

        oscillator1,
        oscillator2,
        master

    ];

    musicStarted = true;

}

/* =====================================================
   UI
===================================================== */

function createExtraUI() {

    if (
        !el("xpHud")
    ) {

        const xp =
            document.createElement(
                "div"
            );

        xp.id =
            "xpHud";

        xp.innerHTML = `

            <div id="levelText">
                LEVEL 1
            </div>

            <div class="xpBar">
                <div id="xpFill"></div>
            </div>

        `;

        document.body.appendChild(
            xp
        );

    }

    if (
        !el("bossHud")
    ) {

        const bossUI =
            document.createElement(
                "div"
            );

        bossUI.id =
            "bossHud";

        bossUI.style.display =
            "none";

        bossUI.innerHTML = `

            <div id="bossName">
                ECHO WARDEN
            </div>

            <div class="bossBar">
                <div id="bossFill"></div>
            </div>

        `;

        document.body.appendChild(
            bossUI
        );

    }

    if (
        !el("crosshair")
    ) {

        const crosshair =
            document.createElement(
                "div"
            );

        crosshair.id =
            "crosshair";

        document.body.appendChild(
            crosshair
        );

    }

    addMenuButtons();

    injectUIStyles();

}

function addMenuButtons() {

    const buttonBox =
        document.querySelector(
            ".menuButtons"
        );

    if (
        !buttonBox ||
        el("skinsButton")
    ) {

        return;

    }

    buttonBox.insertAdjacentHTML(

        "beforeend",

        `

        <button
            id="skinsButton"
            class="menuButton"
        >
            SKINS
        </button>

        <button
            id="statsButton"
            class="menuButton"
        >
            STATS
        </button>

        <button
            id="difficultyButton"
            class="menuButton"
        >
            DIFFICULTY
        </button>

        `

    );

}

function injectUIStyles() {

    if (
        el("upgradeCSS")
    ) {

        return;

    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "upgradeCSS";

    style.textContent = `

        #xpHud {

            position: fixed;

            left: 50%;

            bottom: 20px;

            transform:
                translateX(-50%);

            width: 260px;

            z-index: 30;

            text-align: center;

            pointer-events: none;

        }

        #levelText {

            color: #9fdfff;

            font-size: 10px;

            letter-spacing: 3px;

            margin-bottom: 4px;

        }

        .xpBar {

            height: 7px;

            background: #09131a;

            border:
                1px solid #335366;

            border-radius: 5px;

            overflow: hidden;

        }

        #xpFill {

            width: 0%;

            height: 100%;

            background: #64d9ff;

            box-shadow:
                0 0 12px #64d9ff;

        }

        #bossHud {

            position: fixed;

            left: 50%;

            top: 76px;

            transform:
                translateX(-50%);

            width:
                min(520px, 70vw);

            z-index: 35;

            text-align: center;

            pointer-events: none;

        }

        #bossName {

            color: #ffb18c;

            font-size: 12px;

            letter-spacing: 4px;

            margin-bottom: 6px;

        }

        .bossBar {

            height: 12px;

            background: #140d0c;

            border:
                1px solid #754c3b;

            border-radius: 6px;

            overflow: hidden;

        }

        #bossFill {

            width: 100%;

            height: 100%;

            background: #ff7b58;

        }

        #crosshair {

            position: fixed;

            width: 18px;

            height: 18px;

            border:
                1px solid
                rgba(180,235,255,.8);

            border-radius: 50%;

            transform:
                translate(-50%, -50%);

            z-index: 60;

            pointer-events: none;

        }

        .gamePanel {

            position: fixed;

            inset: 0;

            z-index: 500;

            display: flex;

            align-items: center;

            justify-content: center;

            background:
                rgba(2,7,12,.96);

            padding: 20px;

        }

        .gameWindow {

            width:
                min(760px, 94vw);

            padding: 30px;

            border:
                1px solid #466b7b;

            border-radius: 20px;

            background:
                linear-gradient(
                    145deg,
                    #142936,
                    #071119
                );

            box-shadow:
                0 30px 100px
                rgba(0,0,0,.8);

        }

        .gameWindow h2 {

            color: #f4fbff;

            font-size: 36px;

            letter-spacing: 4px;

            margin-bottom: 8px;

        }

        .gameWindow p {

            color: #8199a8;

            margin-bottom: 20px;

        }

        .panelGrid {

            display: grid;

            grid-template-columns:
                repeat(
                    3,
                    1fr
                );

            gap: 12px;

            margin: 20px 0;

        }

        .panelChoice {

            padding: 20px;

            text-align: center;

            background: #0d1b23;

            border:
                1px solid
                #334f5f;

            border-radius: 12px;

            color: white;

            cursor: pointer;

        }

        .panelChoice.selected {

            border-color:
                #6dd5ff;

            background:
                #173241;

        }

        .panelButton {

            padding:
                10px 18px;

            background:
                #152936;

            border:
                1px solid
                #48697a;

            color: white;

            border-radius: 8px;

            cursor: pointer;

        }

        .skinGrid {

            display: grid;

            grid-template-columns:
                repeat(
                    4,
                    1fr
                );

            gap: 12px;

            margin: 20px 0;

        }

        .skinOption {

            padding: 14px;

            text-align: center;

            background:
                #0d1b23;

            border:
                1px solid
                #294655;

            border-radius: 12px;

            cursor: pointer;

            color: white;

        }

        .skinOption.selected {

            border-color:
                #71d7ff;

        }

        .skinAvatar {

            width: 55px;

            height: 55px;

            margin:
                0 auto 10px;

            border-radius: 50%;

        }

        .statsGrid {

            display: grid;

            grid-template-columns:
                1fr 1fr;

            gap: 10px;

            margin: 20px 0;

        }

        .statRow {

            display: flex;

            justify-content:
                space-between;

            padding: 12px;

            color: #d9edf5;

            background:
                #0c1a22;

            border:
                1px solid
                #263f4d;

            border-radius: 8px;

        }

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
                    circle,
                    #193746,
                    #081119 70%
                );

        }

        .achievementsWindow {

            width:
                min(900px, 95vw);

            max-height: 90vh;

            overflow-y: auto;

            padding: 35px;

            background:
                linear-gradient(
                    145deg,
                    #142936,
                    #08121a
                );

            border:
                1px solid #4b7184;

            border-radius: 20px;

            box-shadow:
                0 30px 100px
                rgba(0,0,0,.8);

        }

        .achievementsTop {

            display: flex;

            justify-content:
                space-between;

            align-items:
                flex-start;

            gap: 20px;

            margin-bottom: 30px;

        }

        .achievementLogo {

            color: #78cfff;

            font-size: 11px;

            letter-spacing: 5px;

            margin-bottom: 8px;

        }

        .achievementsTop h2 {

            color: #f4fbff;

            font-size: 38px;

            letter-spacing: 4px;

        }

        .achievementsTop p {

            color: #8199a8;

            margin-top: 8px;

        }

        .achievementsTop button {

            padding:
                10px 18px;

            color: white;

            background:
                #162a38;

            border:
                1px solid #4c6877;

            border-radius: 8px;

            cursor: pointer;

        }

        .achievementCards {

            display: grid;

            grid-template-columns:
                repeat(
                    2,
                    minmax(0, 1fr)
                );

            gap: 15px;

        }

        .dynamicAchievement {

            display: grid;

            grid-template-columns:
                52px 1fr auto;

            align-items: center;

            gap: 15px;

            min-height: 100px;

            padding: 16px;

            background: #0e1c25;

            border:
                1px solid #294351;

            border-radius: 13px;

        }

        .dynamicAchievement.unlocked {

            background: #14303e;

            border-color: #5ec7f3;

        }

        .dynamicIcon {

            width: 48px;

            height: 48px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 11px;

            border:
                1px solid #344f5d;

            color: #536977;

            background: #08131a;

            font-size: 23px;

        }

        .dynamicAchievement.unlocked
        .dynamicIcon {

            color: #7addff;

            border-color:
                #54a8ca;

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

        .dynamicAchievement.unlocked
        .dynamicStatus {

            color: #70d7ff;

        }

        @media(
            max-width: 700px
        ) {

            .skinGrid,
            .panelGrid {

                grid-template-columns:
                    1fr 1fr;

            }

            .statsGrid {

                grid-template-columns:
                    1fr;

            }

            .achievementCards {

                grid-template-columns:
                    1fr;

            }

        }

    `;

    document.head.appendChild(
        style
    );

}

/* =====================================================
   MENU PANELS
===================================================== */

function openSkins() {

    removeGamePanel();

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "dynamicPanel";

    panel.className =
        "gamePanel";

    const names = [

        "CYAN",
        "VIOLET",
        "AMBER",
        "GHOST"

    ];

    const colors = [

        "#71cfff",
        "#c789ff",
        "#ffbf6b",
        "#e8edf2"

    ];

    panel.innerHTML = `

        <div class="gameWindow">

            <h2>SKINS</h2>

            <p>
                Kies het uiterlijk
                van je speler.
            </p>

            <div class="skinGrid">

                ${names.map(
                    (name, index) => `

                    <div
                        class="
                            skinOption
                            ${
                                settings.skin === index
                                    ? "selected"
                                    : ""
                            }
                        "
                        data-skin="${index}"
                    >

                        <div
                            class="skinAvatar"
                            style="
                                background:
                                ${colors[index]};
                            "
                        ></div>

                        <b>
                            ${name}
                        </b>

                    </div>

                `
                ).join("")}

            </div>

            <button
                class="panelButton"
                id="closePanel"
            >
                BACK
            </button>

        </div>

    `;

    document.body.appendChild(
        panel
    );

    panel
        .querySelectorAll(
            ".skinOption"
        )
        .forEach(
            option => {

                option.onclick =
                    function () {

                        settings.skin =
                            Number(
                                option.dataset.skin
                            );

                        localStorage.setItem(
                            "echobound_skin",
                            settings.skin
                        );

                        openSkins();

                    };

            }
        );

    el("closePanel").onclick =
        removeGamePanel;

}

function openStats() {

    removeGamePanel();

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "dynamicPanel";

    panel.className =
        "gamePanel";

    const rows = [

        [
            "TOTAL KILLS",
            stats.totalKills
        ],

        [
            "BOSSES",
            stats.bossesDefeated
        ],

        [
            "SHOTS FIRED",
            stats.shots
        ],

        [
            "DAMAGE",
            Math.floor(
                stats.damage
            )
        ],

        [
            "DISTANCE",
            Math.floor(
                stats.distance
            )
        ],

        [
            "RUNS",
            stats.runs
        ]

    ];

    panel.innerHTML = `

        <div class="gameWindow">

            <h2>STATS</h2>

            <div class="statsGrid">

                ${rows.map(
                    row => `

                    <div
                        class="statRow"
                    >

                        <span>
                            ${row[0]}
                        </span>

                        <b>
                            ${row[1]}
                        </b>

                    </div>

                `
                ).join("")}

            </div>

            <button
                class="panelButton"
                id="closePanel"
            >
                BACK
            </button>

        </div>

    `;

    document.body.appendChild(
        panel
    );

    el("closePanel").onclick =
        removeGamePanel;

}

function openDifficulty() {

    removeGamePanel();

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "dynamicPanel";

    panel.className =
        "gamePanel";

    const choices = [

        "easy",
        "normal",
        "hard"

    ];

    panel.innerHTML = `

        <div class="gameWindow">

            <h2>
                DIFFICULTY
            </h2>

            <p>
                Kies hoe sterk de
                vijanden zijn.
            </p>

            <div class="panelGrid">

                ${choices.map(
                    choice => `

                    <div
                        class="
                            panelChoice
                            ${
                                settings.difficulty === choice
                                    ? "selected"
                                    : ""
                            }
                        "
                        data-diff="${choice}"
                    >

                        ${choice.toUpperCase()}

                    </div>

                `
                ).join("")}

            </div>

            <button
                class="panelButton"
                id="closePanel"
            >
                BACK
            </button>

        </div>

    `;

    document.body.appendChild(
        panel
    );

    panel
        .querySelectorAll(
            ".panelChoice"
        )
        .forEach(
            choice => {

                choice.onclick =
                    function () {

                        settings.difficulty =
                            choice.dataset.diff;

                        localStorage.setItem(
                            "echobound_difficulty",
                            settings.difficulty
                        );

                        updateDifficultyButton();

                        openDifficulty();

                    };

            }
        );

    el("closePanel").onclick =
        removeGamePanel;

}

function removeGamePanel() {

    const panel =
        el("dynamicPanel");

    if (
        panel
    ) {

        panel.remove();

    }

}

function updateDifficultyButton() {

    const button =
        el("difficultyButton");

    if (
        button
    ) {

        button.textContent =
            "DIFFICULTY: " +
            settings.difficulty.toUpperCase();

    }

}

/* =====================================================
   ACHIEVEMENTS PAGE
===================================================== */

function createAchievementsPage() {

    if (
        el("achievementsScreen")
    ) {

        return;

    }

    const screen =
        document.createElement(
            "div"
        );

    screen.id =
        "achievementsScreen";

    screen.innerHTML = `

        <div
            class="achievementsWindow"
        >

            <div
                class="achievementsTop"
            >

                <div>

                    <div
                        class="achievementLogo"
                    >
                        ECHOBOUND
                    </div>

                    <h2>
                        ACHIEVEMENTS
                    </h2>

                    <p>
                        Bekijk je voortgang.
                    </p>

                </div>

                <button
                    id="
                        dynamicCloseAchievements
                    "
                >
                    BACK
                </button>

            </div>

            <div
                class="achievementCards"
            >

                <div
                    class="dynamicAchievement"
                    id="cardFirstEcho"
                >
                    <div
                        class="dynamicIcon"
                    >
                        ◈
                    </div>

                    <div
                        class="dynamicText"
                    >
                        <h3>
                            FIRST ECHO
                        </h3>

                        <p>
                            Versla je eerste vijand.
                        </p>
                    </div>

                    <div
                        class="dynamicStatus"
                    >
                        LOCKED
                    </div>
                </div>


                <div
                    class="dynamicAchievement"
                    id="cardTenEchoes"
                >
                    <div
                        class="dynamicIcon"
                    >
                        ◆
                    </div>

                    <div
                        class="dynamicText"
                    >
                        <h3>
                            TEN ECHOES
                        </h3>

                        <p>
                            Versla 10 vijanden.
                        </p>
                    </div>

                    <div
                        class="dynamicStatus"
                    >
                        LOCKED
                    </div>
                </div>


                <div
                    class="dynamicAchievement"
                    id="cardFirstSave"
                >
                    <div
                        class="dynamicIcon"
                    >
                        ⬡
                    </div>

                    <div
                        class="dynamicText"
                    >
                        <h3>
                            FIRST SAVE
                        </h3>

                        <p>
                            Sla je run op.
                        </p>
                    </div>

                    <div
                        class="dynamicStatus"
                    >
                        LOCKED
                    </div>
                </div>


                <div
                    class="dynamicAchievement"
                    id="cardExplorer"
                >
                    <div
                        class="dynamicIcon"
                    >
                        ✦
                    </div>

                    <div
                        class="dynamicText"
                    >
                        <h3>
                            EXPLORER
                        </h3>

                        <p>
                            Leg 5000 meter af.
                        </p>
                    </div>

                    <div
                        class="dynamicStatus"
                    >
                        LOCKED
                    </div>
                </div>


                <div
                    class="dynamicAchievement"
                    id="cardBoss"
                >
                    <div
                        class="dynamicIcon"
                    >
                        ☠
                    </div>

                    <div
                        class="dynamicText"
                    >
                        <h3>
                            BOSS SLAYER
                        </h3>

                        <p>
                            Versla een boss.
                        </p>
                    </div>

                    <div
                        class="dynamicStatus"
                    >
                        LOCKED
                    </div>
                </div>


                <div
                    class="dynamicAchievement"
                    id="cardLevel"
                >
                    <div
                        class="dynamicIcon"
                    >
                        ↑
                    </div>

                    <div
                        class="dynamicText"
                    >
                        <h3>
                            LEVEL FIVE
                        </h3>

                        <p>
                            Bereik level 5.
                        </p>
                    </div>

                    <div
                        class="dynamicStatus"
                    >
                        LOCKED
                    </div>
                </div>


                <div
                    class="dynamicAchievement"
                    id="cardArsenal"
                >
                    <div
                        class="dynamicIcon"
                    >
                        ✚
                    </div>

                    <div
                        class="dynamicText"
                    >
                        <h3>
                            ARSENAL
                        </h3>

                        <p>
                            Gebruik alle 4 wapens.
                        </p>
                    </div>

                    <div
                        class="dynamicStatus"
                    >
                        LOCKED
                    </div>
                </div>

            </div>

        </div>

    `;

    document.body.appendChild(
        screen
    );

    el(
        "dynamicCloseAchievements"
    ).onclick =
        closeAchievements;

}

function showAchievements() {

    createAchievementsPage();

    el(
        "achievementsScreen"
    ).style.display =
        "flex";

    updateAchievementsPage();

}

function closeAchievements() {

    const screen =
        el("achievementsScreen");

    if (
        screen
    ) {

        screen.style.display =
            "none";

    }

}

function updateAchievementsPage() {

    const mapping = {

        cardFirstEcho:
            achievements.firstEcho,

        cardTenEchoes:
            achievements.tenEchoes,

        cardFirstSave:
            achievements.firstSave,

        cardExplorer:
            achievements.explorer,

        cardBoss:
            achievements.bossSlayer,

        cardLevel:
            achievements.levelFive,

        cardArsenal:
            achievements.arsenal

    };

    Object.entries(
        mapping
    ).forEach(
        ([id, unlocked]) => {

            const card =
                el(id);

            if (
                !card
            ) {

                return;

            }

            card.classList.toggle(
                "unlocked",
                unlocked
            );

            const status =
                card.querySelector(
                    ".dynamicStatus"
                );

            if (
                status
            ) {

                status.textContent =
                    unlocked
                        ? "UNLOCKED"
                        : "LOCKED";

            }

        }
    );

}

/* =====================================================
   WEAPONS
===================================================== */

const weapons = [

    {
        name: "PULSE",
        cooldown: 9,
        damage: 1,
        shots: 1,
        speed: 11,
        spread: 0,
        life: 100
    },

    {
        name: "BLASTER",
        cooldown: 4,
        damage: 1,
        shots: 1,
        speed: 13,
        spread: 0.04,
        life: 90
    },

    {
        name: "SCATTER",
        cooldown: 20,
        damage: 0.65,
        shots: 7,
        speed: 10,
        spread: 0.36,
        life: 70
    },

    {
        name: "ARC",
        cooldown: 30,
        damage: 5,
        shots: 1,
        speed: 16,
        spread: 0,
        life: 80
    }

];

function switchWeapon(
    index
) {

    if (
        !player
    ) {

        return;

    }

    if (
        index < 0 ||
        index >= weapons.length
    ) {

        return;

    }

    player.weapon =
        index;

    player.usedWeapons[index] =
        true;

    if (
        player.usedWeapons.every(
            Boolean
        ) &&
        !achievements.arsenal
    ) {

        achievements.arsenal =
            true;

        showAchievement(
            "ARSENAL"
        );

        updateAchievementsPage();

    }

    updateHUD();

    playSfx(
        300 +
        index * 100,
        0.07,
        "square",
        0.04
    );

}

function shoot() {

    if (
        !player ||
        paused ||
        player.cooldown > 0
    ) {

        return;

    }

    const weapon =
        weapons[player.weapon];

    if (
        player.ammo <= 0
    ) {

        player.ammo = 12;

        playSfx(
            180,
            0.08,
            "sawtooth",
            0.03
        );

        return;

    }

    player.ammo--;

    player.cooldown =
        weapon.cooldown;

    stats.shots++;

    const worldMouseX =
        camera.x +
        mouse.x;

    const worldMouseY =
        camera.y +
        mouse.y;

    const baseAngle =
        Math.atan2(
            worldMouseY -
            player.y,

            worldMouseX -
            player.x
        );

    for (
        let i = 0;
        i < weapon.shots;
        i++
    ) {

        const angle =
            baseAngle +
            (
                Math.random() -
                0.5
            ) *
            weapon.spread;

        bullets.push({

            x:
                player.x +
                Math.cos(angle) *
                22,

            y:
                player.y +
                Math.sin(angle) *
                22,

            vx:
                Math.cos(angle) *
                weapon.speed,

            vy:
                Math.sin(angle) *
                weapon.speed,

            enemy: false,

            damage:
                weapon.damage,

            life:
                weapon.life

        });

    }

    createParticles(
        player.x +
        Math.cos(baseAngle) *
        25,

        player.y +
        Math.sin(baseAngle) *
        25,

        4
    );

    playSfx(
        player.weapon === 2
            ? 110
            : player.weapon === 3
                ? 680
                : 420,

        0.05,

        player.weapon === 2
            ? "sawtooth"
            : "square",

        0.025
    );

}

/* =====================================================
   NEW GAME
===================================================== */

function startNewGame() {

    initAudio();
    startMusic();

    stats.runs++;

    player = {

        x:
            WORLD_WIDTH / 2,

        y:
            WORLD_HEIGHT / 2,

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

        distance: 0,

        xp: 0,

        level: 1,

        weapon: 0,

        usedWeapons:
            [true, false, false, false]

    };

    enemies = [];

    bullets = [];

    particles = [];

    pickups = [];

    boss = null;

    resetWorldObjects();

    mouse.down = false;

    for (
        let i = 0;
        i < 14;
        i++
    ) {

        createEnemy();

    }

    gameRunning = true;

    paused = false;

    el("menu").style.display =
        "none";

    el("pause").style.display =
        "none";

    el("map").style.display =
        "none";

    closeAchievements();

    removeGamePanel();

    el("bossHud").style.display =
        "none";

    updateHUD();

    playSfx(
        220,
        0.15,
        "sawtooth",
        0.05
    );

}

/* =====================================================
   SAVE / LOAD
===================================================== */

function saveGame() {

    if (
        !player
    ) {

        alert(
            "Start eerst een game."
        );

        return;

    }

    localStorage.setItem(

        SAVE_KEY,

        JSON.stringify({

            player:
                player,

            achievements:
                achievements,

            stats:
                stats,

            settings:
                settings,

            doors:
                doors

        })

    );

    if (
        !achievements.firstSave
    ) {

        achievements.firstSave =
            true;

        showAchievement(
            "FIRST SAVE"
        );

    } else {

        showAchievement(
            "GAME SAVED"
        );

    }

    updateAchievementsPage();

    playSfx(
        520,
        0.09,
        "triangle",
        0.05
    );

}

function loadGame() {

    const raw =
        localStorage.getItem(
            SAVE_KEY
        );

    if (
        !raw
    ) {

        alert(
            "Er is nog geen opgeslagen run."
        );

        return;

    }

    try {

        const data =
            JSON.parse(raw);

        player =
            data.player;

        if (
            !player
        ) {

            throw new Error(
                "Player missing"
            );

        }

        achievements = {

            ...achievements,

            ...(data.achievements || {})

        };

        Object.assign(
            stats,
            data.stats || {}
        );

        settings = {

            ...settings,

            ...(data.settings || {})

        };

        resetWorldObjects();

        if (
            Array.isArray(
                data.doors
            )
        ) {

            doors =
                data.doors.map(
                    door => ({
                        ...door
                    })
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
            typeof player.health ===
            "number"
                ? player.health
                : 100;

        player.energy =
            typeof player.energy ===
            "number"
                ? player.energy
                : 100;

        player.ammo =
            typeof player.ammo ===
            "number"
                ? player.ammo
                : 12;

        player.kills =
            typeof player.kills ===
            "number"
                ? player.kills
                : 0;

        player.credits =
            typeof player.credits ===
            "number"
                ? player.credits
                : 0;

        player.xp =
            player.xp || 0;

        player.level =
            player.level || 1;

        player.weapon =
            player.weapon || 0;

        player.usedWeapons =
            player.usedWeapons ||
            [true, false, false, false];

        player.cooldown = 0;
        player.dashCooldown = 0;
        player.dashTimer = 0;
        player.invincible = 0;

        if (
            collidesWall(
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

        boss = null;

        for (
            let i = 0;
            i < 14;
            i++
        ) {

            createEnemy();

        }

        gameRunning = true;

        paused = false;

        mouse.down = false;

        el("menu").style.display =
            "none";

        el("pause").style.display =
            "none";

        el("map").style.display =
            "none";

        el("bossHud").style.display =
            "none";

        closeAchievements();

        removeGamePanel();

        updateDifficultyButton();

        updateHUD();

        startMusic();

    } catch (
        error
    ) {

        console.error(
            error
        );

        alert(
            "De opgeslagen game kon niet worden geladen."
        );

    }

}

/* =====================================================
   PAUSE
===================================================== */

function resumeGame() {

    paused = false;

    el("pause").style.display =
        "none";

}

function quitToMenu() {

    if (
        player
    ) {

        saveGame();

    }

    gameRunning = false;

    paused = false;

    mouse.down = false;

    el("pause").style.display =
        "none";

    el("map").style.display =
        "none";

    closeAchievements();

    removeGamePanel();

    el("menu").style.display =
        "flex";

}

/* =====================================================
   CONTROLS
===================================================== */

function showControls() {

    alert(

        "BESTURING\n\n" +

        "W A S D = bewegen\n\n" +

        "MUIS = richten\n\n" +

        "LINKERMUISKNOP = schieten\n\n" +

        "1-4 = wapens wisselen\n\n" +

        "SPACE = dash\n\n" +

        "E = schakelaar / deur\n\n" +

        "M = kaart\n\n" +

        "ESC = pauzeren"

    );

}

/* =====================================================
   ENEMIES
===================================================== */

function createEnemy() {

    if (
        !player
    ) {

        return;

    }

    let x;
    let y;

    let attempts = 0;

    do {

        x =
            randomBetween(
                80,
                WORLD_WIDTH - 80
            );

        y =
            randomBetween(
                80,
                WORLD_HEIGHT - 80
            );

        attempts++;

    } while (

        (

            distanceBetween(
                {
                    x,
                    y
                },
                player
            ) < 420

            ||

            collidesWall(
                x,
                y,
                24
            )

        )

        &&

        attempts < 300

    );

    const random =
        Math.random();

    let type;

    if (
        random > 0.88
    ) {

        type =
            "shield";

    } else if (
        random > 0.74
    ) {

        type =
            "flee";

    } else if (
        random > 0.60
    ) {

        type =
            "flank";

    } else if (
        random > 0.44
    ) {

        type =
            "flying";

    } else if (
        random > 0.28
    ) {

        type =
            "cover";

    } else {

        type =
            "light";

    }

    const configs = {

        light: {

            radius: 16,

            speed: 0.9,

            hp: 2

        },

        flank: {

            radius: 17,

            speed: 1.05,

            hp: 2

        },

        flee: {

            radius: 17,

            speed: 1,

            hp: 3

        },

        flying: {

            radius: 16,

            speed: 1.15,

            hp: 2

        },

        cover: {

            radius: 18,

            speed: 0.72,

            hp: 4

        },

        shield: {

            radius: 20,

            speed: 0.6,

            hp: 5,

            shield: 5

        }

    };

    const config =
        configs[type];

    enemies.push({

        x,

        y,

        radius:
            config.radius,

        speed:
            config.speed,

        hp:
            config.hp,

        maxHp:
            config.hp,

        cooldown:
            randomBetween(
                50,
                130
            ),

        type,

        shield:
            config.shield || 0,

        maxShield:
            config.shield || 0,

        coverTarget:
            null

    });

}

function updateEnemies(
    dt
) {

    const scale =
        difficultyScale();

    for (
        const enemy of enemies
    ) {

        const distance =
            distanceBetween(
                enemy,
                player
            );

        const angle =
            angleBetween(
                enemy,
                player
            );

        let moveX =
            Math.cos(angle);

        let moveY =
            Math.sin(angle);

        const flying =
            enemy.type ===
            "flying";

        if (
            enemy.type ===
            "flee" &&
            enemy.hp <=
            enemy.maxHp * 0.6
        ) {

            moveX =
                -moveX;

            moveY =
                -moveY;

        }

        if (
            enemy.type ===
            "flank" &&
            distance < 500
        ) {

            const side =
                angle +
                Math.PI / 2;

            moveX =
                Math.cos(side);

            moveY =
                Math.sin(side);

        }

        if (
            enemy.type ===
            "cover" &&
            distance < 520
        ) {

            if (
                !enemy.coverTarget ||
                Math.random() < 0.01
            ) {

                let nearest =
                    null;

                let best =
                    Infinity;

                for (
                    const wall
                    of staticWalls
                ) {

                    const targetX =
                        clamp(
                            enemy.x,
                            wall.x - 40,
                            wall.x +
                            wall.w +
                            40
                        );

                    const targetY =
                        clamp(
                            enemy.y,
                            wall.y - 40,
                            wall.y +
                            wall.h +
                            40
                        );

                    const d =
                        Math.hypot(
                            targetX -
                            enemy.x,

                            targetY -
                            enemy.y
                        );

                    if (
                        d < best
                    ) {

                        best = d;

                        nearest = {

                            x:
                                targetX,

                            y:
                                targetY

                        };

                    }

                }

                enemy.coverTarget =
                    nearest;

            }

            if (
                enemy.coverTarget
            ) {

                const coverAngle =
                    Math.atan2(

                        enemy.coverTarget.y -
                        enemy.y,

                        enemy.coverTarget.x -
                        enemy.x

                    );

                moveX =
                    Math.cos(
                        coverAngle
                    );

                moveY =
                    Math.sin(
                        coverAngle
                    );

            }

        }

        if (
            distance > 70
        ) {

            moveEntity(

                enemy,

                moveX *
                enemy.speed *
                scale *
                dt,

                moveY *
                enemy.speed *
                scale *
                dt,

                flying

            );

        }

        enemy.cooldown -=
            dt;

        if (
            distance < 750 &&
            enemy.cooldown <= 0
        ) {

            enemy.cooldown =
                randomBetween(
                    85,
                    150
                ) /
                scale;

            const bulletAngle =
                angleBetween(
                    enemy,
                    player
                );

            const speed =
                enemy.type ===
                "shield"
                    ? 2.7
                    : 3.2;

            bullets.push({

                x:
                    enemy.x,

                y:
                    enemy.y,

                vx:
                    Math.cos(
                        bulletAngle
                    ) *
                    speed,

                vy:
                    Math.sin(
                        bulletAngle
                    ) *
                    speed,

                enemy: true,

                damage:
                    enemy.type ===
                    "shield"
                        ? 7
                        : 8,

                life: 180

            });

            playSfx(
                190,
                0.035,
                "square",
                0.012
            );

        }

        if (
            distance <
            player.radius +
            enemy.radius
        ) {

            damagePlayer(
                0.3 *
                scale *
                dt
            );

        }

        if (
            enemy.type ===
            "shield" &&
            enemy.shield <
            enemy.maxShield &&
            Math.random() < 0.015
        ) {

            enemy.shield++;

        }

    }

}

/* =====================================================
   BOSS
===================================================== */

function spawnBoss() {

    if (
        boss
    ) {

        return;

    }

    const side =
        Math.floor(
            Math.random() * 4
        );

    let x;
    let y;

    if (
        side === 0
    ) {

        x = 180;

        y =
            randomBetween(
                200,
                WORLD_HEIGHT -
                200
            );

    } else if (
        side === 1
    ) {

        x =
            WORLD_WIDTH -
            180;

        y =
            randomBetween(
                200,
                WORLD_HEIGHT -
                200
            );

    } else if (
        side === 2
    ) {

        x =
            randomBetween(
                200,
                WORLD_WIDTH -
                200
            );

        y = 180;

    } else {

        x =
            randomBetween(
                200,
                WORLD_WIDTH -
                200
            );

        y =
            WORLD_HEIGHT -
            180;

    }

    const hp =
        120 +
        player.level *
        35;

    boss = {

        x,

        y,

        radius: 38,

        hp,

        maxHp: hp,

        cooldown: 60,

        phase: 0

    };

    el("bossHud").style.display =
        "block";

    showAchievement(
        "BOSS INCOMING"
    );

    playSfx(
        90,
        0.4,
        "sawtooth",
        0.07
    );

}

function updateBoss(
    dt
) {

    if (
        !boss
    ) {

        return;

    }

    const scale =
        difficultyScale();

    const distance =
        distanceBetween(
            boss,
            player
        );

    const angle =
        angleBetween(
            boss,
            player
        );

    boss.phase +=
        dt *
        0.02;

    if (
        distance > 140
    ) {

        moveEntity(

            boss,

            Math.cos(angle) *
            0.55 *
            scale *
            dt,

            Math.sin(angle) *
            0.55 *
            scale *
            dt

        );

    }

    boss.cooldown -=
        dt;

    if (
        boss.cooldown <= 0
    ) {

        boss.cooldown =
            65 /
            scale;

        const shotCount =
            boss.hp <
            boss.maxHp * 0.5
                ? 8
                : 5;

        for (
            let i = 0;
            i < shotCount;
            i++
        ) {

            const bulletAngle =
                angle +
                (
                    i -
                    (shotCount -
                    1) / 2
                ) *
                0.16;

            bullets.push({

                x:
                    boss.x,

                y:
                    boss.y,

                vx:
                    Math.cos(
                        bulletAngle
                    ) *
                    3.9,

                vy:
                    Math.sin(
                        bulletAngle
                    ) *
                    3.9,

                enemy: true,

                damage: 10,

                life: 220

            });

        }

        playSfx(
            75,
            0.18,
            "sawtooth",
            0.06
        );

    }

    if (
        distance <
        player.radius +
        boss.radius
    ) {

        damagePlayer(
            1 *
            scale *
            dt
        );

    }

    el("bossFill").style.width =
        clamp(
            boss.hp /
            boss.maxHp *
            100,
            0,
            100
        ) +
        "%";

}

/* =====================================================
   PLAYER
===================================================== */

function xpRequired() {

    return (
        100 +
        (
            player.level -
            1
        ) *
        75
    );

}

function addXP(
    amount
) {

    player.xp +=
        amount;

    while (
        player.xp >=
        xpRequired()
    ) {

        player.xp -=
            xpRequired();

        player.level++;

        player.maxHealth +=
            8;

        player.health =
            player.maxHealth;

        player.maxEnergy +=
            5;

        player.energy =
            player.maxEnergy;

        showAchievement(
            "LEVEL " +
            player.level
        );

        playSfx(
            700,
            0.15,
            "triangle",
            0.06
        );

        if (
            player.level >= 5 &&
            !achievements.levelFive
        ) {

            achievements.levelFive =
                true;

            updateAchievementsPage();

        }

    }

}

function updatePlayer(
    dt
) {

    let dx = 0;
    let dy = 0;

    if (
        keys.w
    ) {

        dy -= 1;

    }

    if (
        keys.s
    ) {

        dy += 1;

    }

    if (
        keys.a
    ) {

        dx -= 1;

    }

    if (
        keys.d
    ) {

        dx += 1;

    }

    if (
        dx !== 0 ||
        dy !== 0
    ) {

        const length =
            Math.hypot(
                dx,
                dy
            );

        dx /=
            length;

        dy /=
            length;

        let speed =
            player.speed;

        if (
            player.dashTimer > 0
        ) {

            speed = 11;

            player.dashTimer -=
                dt;

        }

        const oldX =
            player.x;

        const oldY =
            player.y;

        moveEntity(

            player,

            dx *
            speed *
            dt,

            dy *
            speed *
            dt

        );

        const moved =
            Math.hypot(

                player.x -
                oldX,

                player.y -
                oldY

            );

        player.distance +=
            moved;

        stats.distance +=
            moved;

    }

    if (

        keys.space &&

        player.dashCooldown <=
        0 &&

        player.energy >=
        25 &&

        (
            dx !== 0 ||
            dy !== 0
        )

    ) {

        player.dashTimer =
            10;

        player.energy -=
            25;

        player.dashCooldown =
            70;

        player.invincible =
            25;

        keys.space = false;

        createParticles(
            player.x,
            player.y,
            25
        );

        playSfx(
            800,
            0.08,
            "triangle",
            0.04
        );

    }

    if (
        player.cooldown >
        0
    ) {

        player.cooldown -=
            dt;

    }

    if (
        player.dashCooldown >
        0
    ) {

        player.dashCooldown -=
            dt;

    }

    if (
        player.invincible >
        0
    ) {

        player.invincible -=
            dt;

    }

    player.energy =
        Math.min(

            player.maxEnergy,

            player.energy +
            0.12 *
            dt

        );

    for (
        const sw of switches
    ) {

        const near =
            Math.hypot(
                player.x -
                sw.x,

                player.y -
                sw.y
            ) < 48;

        if (
            near &&
            keys.e
        ) {

            const door =
                doors.find(
                    d =>
                        d.id ===
                        sw.door
                );

            if (
                door
            ) {

                door.open =
                    !door.open;

                sw.active =
                    door.open;

                keys.e = false;

                playSfx(
                    560,
                    0.12,
                    "triangle",
                    0.05
                );

            }

        }

    }

    if (
        player.distance >=
        5000 &&
        !achievements.explorer
    ) {

        achievements.explorer =
            true;

        showAchievement(
            "EXPLORER"
        );

        updateAchievementsPage();

    }

}

/* =====================================================
   BULLETS
===================================================== */

function updateBullets(
    dt
) {

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
            bullet.vx *
            dt;

        bullet.y +=
            bullet.vy *
            dt;

        bullet.life -=
            dt;

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

            continue;

        }

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

            playSfx(
                120,
                0.025,
                "square",
                0.01
            );

            continue;

        }

        if (
            bullet.enemy
        ) {

            if (

                Math.hypot(

                    bullet.x -
                    player.x,

                    bullet.y -
                    player.y

                )

                <

                player.radius +
                6

            ) {

                damagePlayer(
                    bullet.damage
                );

                bullets.splice(
                    i,
                    1
                );

                continue;

            }

        } else {

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

                    )

                    <

                    enemy.radius +
                    7

                ) {

                    let damage =
                        bullet.damage;

                    if (
                        enemy.shield >
                        0
                    ) {

                        enemy.shield--;

                        damage *=
                            0.35;

                    }

                    enemy.hp -=
                        damage;

                    stats.damage +=
                        damage;

                    createParticles(
                        enemy.x,
                        enemy.y,
                        6
                    );

                    hit = true;

                    if (
                        enemy.hp <= 0
                    ) {

                        defeatEnemy(
                            j
                        );

                    }

                    break;

                }

            }

            if (
                !hit &&
                boss &&
                Math.hypot(

                    bullet.x -
                    boss.x,

                    bullet.y -
                    boss.y

                ) <

                boss.radius +
                7
            ) {

                boss.hp -=
                    bullet.damage;

                stats.damage +=
                    bullet.damage;

                createParticles(
                    boss.x,
                    boss.y,
                    8
                );

                hit = true;

                if (
                    boss.hp <= 0
                ) {

                    defeatBoss();

                }

            }

            if (
                hit
            ) {

                bullets.splice(
                    i,
                    1
                );

                continue;

            }

        }

    }

}

/* =====================================================
   ENEMY DEFEATED
===================================================== */

function defeatEnemy(
    index
) {

    const enemy =
        enemies[index];

    player.kills++;

    stats.totalKills++;

    if (
        enemy.type ===
        "shield"
    ) {

        player.credits +=
            25;

    } else if (
        enemy.type ===
        "cover"
    ) {

        player.credits +=
            20;

    } else {

        player.credits +=
            10;

    }

    addXP(
        enemy.type ===
            "shield"
            ? 45
            : 25
    );

    if (
        !achievements.firstEcho
    ) {

        achievements.firstEcho =
            true;

        showAchievement(
            "FIRST ECHO"
        );

    }

    if (

        player.kills >= 10 &&

        !achievements.tenEchoes

    ) {

        achievements.tenEchoes =
            true;

        showAchievement(
            "TEN ECHOES"
        );

    }

    if (
        Math.random() <
        0.24
    ) {

        pickups.push({

            x:
                enemy.x,

            y:
                enemy.y,

            type:
                Math.random() <
                0.5
                    ? "energy"
                    : "credit"

        });

    }

    enemies.splice(
        index,
        1
    );

    if (
        player.kills %
        12 ===
        0
    ) {

        spawnBoss();

    }

    createEnemy();

    updateAchievementsPage();

}

/* =====================================================
   BOSS DEFEATED
===================================================== */

function defeatBoss() {

    stats.bossesDefeated++;

    player.credits +=
        200;

    addXP(
        250
    );

    achievements.bossSlayer =
        true;

    createParticles(
        boss.x,
        boss.y,
        50
    );

    boss = null;

    el("bossHud").style.display =
        "none";

    showAchievement(
        "BOSS SLAYER"
    );

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        createEnemy();

    }

    playSfx(
        900,
        0.35,
        "triangle",
        0.08
    );

    updateAchievementsPage();

}

/* =====================================================
   DAMAGE / GAME OVER
===================================================== */

function damagePlayer(
    amount
) {

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
        20;

    createParticles(
        player.x,
        player.y,
        7
    );

    if (
        player.health <= 0
    ) {

        player.health =
            0;

        gameOver();

    }

}

function gameOver() {

    gameRunning =
        false;

    paused =
        false;

    mouse.down =
        false;

    setTimeout(

        function () {

            const retry =
                confirm(

                    "GAME OVER\n\n" +

                    "LEVEL: " +
                    player.level +

                    "\nKILLS: " +
                    player.kills +

                    "\nCREDITS: " +
                    player.credits +

                    "\n\nOpnieuw spelen?"

                );

            if (
                retry
            ) {

                startNewGame();

            } else {

                el("menu")
                    .style.display =
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

        if (

            Math.hypot(

                pickup.x -
                player.x,

                pickup.y -
                player.y

            ) < 35

        ) {

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

            playSfx(
                600,
                0.06,
                "triangle",
                0.03
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

            x,

            y,

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

function updateParticles(
    dt
) {

    for (
        let i =
            particles.length - 1;

        i >= 0;

        i--
    ) {

        const particle =
            particles[i];

        particle.x +=
            particle.vx *
            dt;

        particle.y +=
            particle.vy *
            dt;

        particle.vx *=
            0.97;

        particle.vy *=
            0.97;

        particle.life -=
            dt;

        if (
            particle.life <= 0
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

    if (
        !player
    ) {

        return;

    }

    camera.x =
        clamp(

            player.x -
            W / 2,

            0,

            Math.max(
                0,
                WORLD_WIDTH -
                W
            )

        );

    camera.y =
        clamp(

            player.y -
            H / 2,

            0,

            Math.max(
                0,
                WORLD_HEIGHT -
                H
            )

        );

}

/* =====================================================
   DRAW WORLD
===================================================== */

function drawWorld() {

    ctx.fillStyle =
        "#071015";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    const gridSize =
        100;

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
            camera.x +
            W +
            gridSize;

        worldX +=
            gridSize

    ) {

        for (

            let worldY =
                startY;

            worldY <
                camera.y +
                H +
                gridSize;

            worldY +=
                gridSize

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

            const backgrounds = [

                "#111f25",
                "#122329",
                "#151e27",
                "#101b23"

            ];

            ctx.fillStyle =
                backgrounds[
                    (
                        sector %
                        4 +
                        4
                    ) %
                    4
                ];

            ctx.fillRect(

                screenX,
                screenY,

                gridSize,
                gridSize

            );

        }

    }

    ctx.strokeStyle =
        "rgba(120,190,220,0.06)";

    ctx.lineWidth =
        1;

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

    drawDoors();

    drawSwitches();

    ctx.strokeStyle =
        "rgba(100,190,230,0.35)";

    ctx.lineWidth =
        4;

    ctx.strokeRect(

        -camera.x,
        -camera.y,

        WORLD_WIDTH,
        WORLD_HEIGHT

    );

}

function drawWalls() {

    for (
        const wall of staticWalls
    ) {

        const x =
            wall.x -
            camera.x;

        const y =
            wall.y -
            camera.y;

        ctx.fillStyle =
            "rgba(0,0,0,0.45)";

        ctx.fillRect(

            x + 6,
            y + 8,

            wall.w,
            wall.h

        );

        ctx.fillStyle =
            "#1b2c37";

        ctx.fillRect(

            x,
            y,

            wall.w,
            wall.h

        );

        ctx.strokeStyle =
            "#4e7a8c";

        ctx.lineWidth =
            2;

        ctx.strokeRect(

            x,
            y,

            wall.w,
            wall.h

        );

        ctx.fillStyle =
            "rgba(104,220,255,0.35)";

        if (
            wall.w >=
            wall.h
        ) {

            ctx.fillRect(

                x + 8,

                y +
                wall.h / 2 -
                2,

                wall.w - 16,

                4

            );

        } else {

            ctx.fillRect(

                x +
                wall.w / 2 -
                2,

                y + 8,

                4,

                wall.h - 16

            );

        }

    }

}

function drawDoors() {

    for (
        const door of doors
    ) {

        if (
            door.open
        ) {

            continue;

        }

        const x =
            door.x -
            camera.x;

        const y =
            door.y -
            camera.y;

        ctx.fillStyle =
            "#4d3328";

        ctx.fillRect(

            x,
            y,

            door.w,
            door.h

        );

        ctx.strokeStyle =
            "#ffb36c";

        ctx.lineWidth =
            2;

        ctx.strokeRect(

            x,
            y,

            door.w,
            door.h

        );

        ctx.fillStyle =
            "#ffc06d";

        if (
            door.w >=
            door.h
        ) {

            ctx.fillRect(

                x + 10,

                y +
                door.h / 2 -
                2,

                door.w - 20,

                4

            );

        } else {

            ctx.fillRect(

                x +
                door.w / 2 -
                2,

                y + 10,

                4,

                door.h - 20

            );

        }

    }

}

function drawSwitches() {

    for (
        const sw of switches
    ) {

        const x =
            sw.x -
            camera.x;

        const y =
            sw.y -
            camera.y;

        ctx.fillStyle =
            sw.active
                ? "#69ddff"
                : "#7b4d3d";

        ctx.fillRect(

            x - 7,
            y - 7,

            14,
            14

        );

        ctx.strokeStyle =
            "#e8faff";

        ctx.strokeRect(

            x - 7,
            y - 7,

            14,
            14

        );

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

            pickup.type ===
            "energy"

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

function getSkinColor() {

    const colors = [

        "#71cfff",
        "#c789ff",
        "#ffbf6b",
        "#e8edf2"

    ];

    return (
        colors[
            settings.skin
        ] ||
        colors[0]
    );

}

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

    ctx.lineWidth =
        3;

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

        player.invincible >
        0

            ? "#ffffff"

            : getSkinColor();

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

    ctx.lineWidth =
        6;

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
            enemy.type ===
            "shield"
        ) {

            color =
                "#5ec8ff";

            glow =
                "#2e7697";

        } else if (
            enemy.type ===
            "flee"
        ) {

            color =
                "#ff7aa8";

            glow =
                "#a73e63";

        } else if (
            enemy.type ===
            "flying"
        ) {

            color =
                "#8df0c9";

            glow =
                "#4aab82";

        } else if (
            enemy.type ===
            "cover"
        ) {

            color =
                "#d09a6b";

            glow =
                "#8d613b";

        } else if (
            enemy.type ===
            "flank"
        ) {

            color =
                "#e08dff";

            glow =
                "#9a55b7";

        }

        ctx.fillStyle =
            glow;

        ctx.globalAlpha =
            0.18;

        ctx.beginPath();

        ctx.arc(

            x,
            y,

            enemy.radius + 10,

            0,
            Math.PI * 2

        );

        ctx.fill();

        ctx.globalAlpha =
            1;

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
            "#f3e9ff";

        ctx.lineWidth =
            2;

        ctx.stroke();

        if (
            enemy.shield >
            0
        ) {

            ctx.strokeStyle =
                "#7de4ff";

            ctx.lineWidth =
                4;

            ctx.beginPath();

            ctx.arc(

                x,
                y,

                enemy.radius + 5,

                0,
                Math.PI * 2

            );

            ctx.stroke();

            ctx.lineWidth =
                1;

        }

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

            y -
            enemy.radius -
            12,

            40,
            4

        );

        ctx.fillStyle =
            color;

        ctx.fillRect(

            x - 20,

            y -
            enemy.radius -
            12,

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
   DRAW BOSS
===================================================== */

function drawBoss() {

    if (
        !boss
    ) {

        return;

    }

    const x =
        boss.x -
        camera.x;

    const y =
        boss.y -
        camera.y;

    ctx.fillStyle =
        "rgba(255,100,60,0.16)";

    ctx.beginPath();

    ctx.arc(

        x,
        y,

        boss.radius +
        18 +
        Math.sin(
            boss.phase
        ) *
        5,

        0,
        Math.PI * 2

    );

    ctx.fill();

    ctx.fillStyle =
        "#ff7657";

    ctx.beginPath();

    ctx.arc(

        x,
        y,

        boss.radius,

        0,
        Math.PI * 2

    );

    ctx.fill();

    ctx.strokeStyle =
        "#ffd6ca";

    ctx.lineWidth =
        3;

    ctx.stroke();

    ctx.fillStyle =
        "#ffffff";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        6,
        0,
        Math.PI * 2
    );

    ctx.fill();

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

    }

}

/* =====================================================
   DRAW PARTICLES
===================================================== */

function drawParticles() {

    for (
        const particle of particles
    ) {

        ctx.globalAlpha =

            Math.max(

                0,

                particle.life /
                40

            );

        ctx.fillStyle =
            "#9feaff";

        ctx.fillRect(

            particle.x -
            camera.x,

            particle.y -
            camera.y,

            particle.size,

            particle.size

        );

    }

    ctx.globalAlpha =
        1;

}

/* =====================================================
   LIGHTING
===================================================== */

function drawLighting() {

    if (
        !player
    ) {

        return;

    }

    const playerX =
        player.x -
        camera.x;

    const playerY =
        player.y -
        camera.y;

    const gradient =
        ctx.createRadialGradient(

            playerX,
            playerY,
            60,

            playerX,
            playerY,
            Math.max(W,H) *
            0.7

        );

    gradient.addColorStop(
        0,
        "rgba(3,7,10,0)"
    );

    gradient.addColorStop(
        0.45,
        "rgba(3,7,10,0.15)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0.72)"
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

/* =====================================================
   HUD
===================================================== */

function updateHUD() {

    if (
        !player
    ) {

        return;

    }

    const health =
        clamp(

            player.health /
            player.maxHealth *
            100,

            0,
            100

        );

    const energy =
        clamp(

            player.energy /
            player.maxEnergy *
            100,

            0,
            100

        );

    if (
        el("healthBar")
    ) {

        el("healthBar")
            .style.width =
            health + "%";

    }

    if (
        el("energyBar")
    ) {

        el("energyBar")
            .style.width =
            energy + "%";

    }

    if (
        el("ammo")
    ) {

        el("ammo")
            .textContent =
            player.ammo +
            " / ∞";

    }

    if (
        el("kills")
    ) {

        el("kills")
            .textContent =
            "KILLS: " +
            player.kills;

    }

    if (
        el("credits")
    ) {

        el("credits")
            .textContent =
            "CREDITS: " +
            player.credits;

    }

    if (
        el("zone")
    ) {

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

        el("zone")
            .textContent =

            "SECTOR " +
            zoneX +
            "-" +
            zoneY;

    }

    if (
        el("objective")
    ) {

        if (
            boss
        ) {

            el("objective")
                .textContent =
                "DEFEAT THE ECHO WARDEN";

        } else if (
            player.kills ===
            0
        ) {

            el("objective")
                .textContent =
                "FIND THE SIGNAL";

        } else if (
            player.kills < 5
        ) {

            el("objective")
                .textContent =
                "EXPLORE THE SECTOR";

        } else {

            el("objective")
                .textContent =
                "FOLLOW THE ECHOES";

        }

    }

    if (
        el("levelText")
    ) {

        el("levelText")
            .textContent =
            "LEVEL " +
            player.level +
            " • " +
            weapons[
                player.weapon
            ].name;

    }

    if (
        el("xpFill")
    ) {

        el("xpFill")
            .style.width =

            clamp(

                player.xp /
                xpRequired() *
                100,

                0,
                100

            ) +
            "%";

    }

    if (
        el("crosshair")
    ) {

        el("crosshair")
            .style.left =
            mouse.x +
            "px";

        el("crosshair")
            .style.top =
            mouse.y +
            "px";

    }

}

/* =====================================================
   ACHIEVEMENT POPUP
===================================================== */

let achievementTimer =
    null;

function showAchievement(
    name
) {

    const box =
        el("achievement");

    const nameBox =
        el("achievementName");

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

    clearTimeout(
        achievementTimer
    );

    achievementTimer =
        setTimeout(

            function () {

                box.classList.remove(
                    "show"
                );

            },

            2800

        );

}

/* =====================================================
   MAP
===================================================== */

function drawMap() {

    if (
        !player ||
        !mapCanvas
    ) {

        return;

    }

    const rect =
        mapCanvas.getBoundingClientRect();

    const width =
        Math.max(
            300,
            Math.floor(
                rect.width
            )
        );

    const height =
        Math.max(
            250,
            Math.floor(
                rect.height
            )
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

    mapCtx.lineWidth =
        1;

    for (

        let x = 0;

        x <=
            WORLD_WIDTH;

        x += 200

    ) {

        mapCtx.beginPath();

        mapCtx.moveTo(

            x *
            scaleX,

            0

        );

        mapCtx.lineTo(

            x *
            scaleX,

            height

        );

        mapCtx.stroke();

    }

    for (

        let y = 0;

        y <=
            WORLD_HEIGHT;

        y += 200

    ) {

        mapCtx.beginPath();

        mapCtx.moveTo(

            0,

            y *
            scaleY

        );

        mapCtx.lineTo(

            width,

            y *
            scaleY

        );

        mapCtx.stroke();

    }

    for (
        const wall
        of activeObstacles()
    ) {

        mapCtx.fillStyle =
            "#395765";

        mapCtx.fillRect(

            wall.x *
            scaleX,

            wall.y *
            scaleY,

            wall.w *
            scaleX,

            wall.h *
            scaleY

        );

    }

    mapCtx.fillStyle =
        "#b86cff";

    for (
        const enemy
        of enemies
    ) {

        mapCtx.beginPath();

        mapCtx.arc(

            enemy.x *
            scaleX,

            enemy.y *
            scaleY,

            3,

            0,
            Math.PI * 2

        );

        mapCtx.fill();

    }

    if (
        boss
    ) {

        mapCtx.fillStyle =
            "#ff7657";

        mapCtx.beginPath();

        mapCtx.arc(

            boss.x *
            scaleX,

            boss.y *
            scaleY,

            6,

            0,
            Math.PI * 2

        );

        mapCtx.fill();

    }

    mapCtx.fillStyle =
        "#72d8ff";

    mapCtx.beginPath();

    mapCtx.arc(

        player.x *
        scaleX,

        player.y *
        scaleY,

        6,

        0,
        Math.PI * 2

    );

    mapCtx.fill();

}

function openMap() {

    const map =
        el("map");

    if (
        !map
    ) {

        return;

    }

    map.style.display =
        "flex";

    drawMap();

}

function closeMap() {

    const map =
        el("map");

    if (
        map
    ) {

        map.style.display =
            "none";

    }

}

/* =====================================================
   INPUT
===================================================== */

window.addEventListener(
    "keydown",
    function (event) {

        const key =
            event.key.toLowerCase();

        keys[key] = true;

        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            keys.space = true;

        }

        if (
            key === "1"
        ) {

            switchWeapon(0);

        }

        if (
            key === "2"
        ) {

            switchWeapon(1);

        }

        if (
            key === "3"
        ) {

            switchWeapon(2);

        }

        if (
            key === "4"
        ) {

            switchWeapon(3);

        }

        if (
            key === "m" &&
            gameRunning &&
            !paused
        ) {

            const map =
                el("map");

            if (
                map.style.display ===
                "flex"
            ) {

                closeMap();

            } else {

                openMap();

            }

        }

        if (
            key === "escape"
        ) {

            const achievementsPage =
                el("achievementsScreen");

            if (
                achievementsPage &&
                achievementsPage.style.display ===
                "flex"
            ) {

                closeAchievements();

                return;

            }

            const dynamicPanel =
                el("dynamicPanel");

            if (
                dynamicPanel
            ) {

                removeGamePanel();

                return;

            }

            if (
                el("map").style.display ===
                "flex"
            ) {

                closeMap();

                return;

            }

            if (
                gameRunning
            ) {

                paused =
                    !paused;

                el("pause")
                    .style.display =
                    paused
                        ? "flex"
                        : "none";

            }

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
            event.code ===
            "Space"
        ) {

            keys.space = false;

        }

    }
);

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

            startMusic();

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
   BUTTONS
===================================================== */

function setupButtons() {

    if (
        el("newGame")
    ) {

        el("newGame").onclick =
            startNewGame;

    }

    if (
        el("loadGame")
    ) {

        el("loadGame").onclick =
            loadGame;

    }

    if (
        el("achievementsButton")
    ) {

        el(
            "achievementsButton"
        ).onclick =
            showAchievements;

    }

    if (
        el("controlsButton")
    ) {

        el("controlsButton").onclick =
            showControls;

    }

    if (
        el("resume")
    ) {

        el("resume").onclick =
            resumeGame;

    }

    if (
        el("save")
    ) {

        el("save").onclick =
            saveGame;

    }

    if (
        el("quit")
    ) {

        el("quit").onclick =
            quitToMenu;

    }

    if (
        el("closeMap")
    ) {

        el("closeMap").onclick =
            closeMap;

    }

    if (
        el("skinsButton")
    ) {

        el("skinsButton").onclick =
            openSkins;

    }

    if (
        el("statsButton")
    ) {

        el("statsButton").onclick =
            openStats;

    }

    if (
        el("difficultyButton")
    ) {

        el("difficultyButton").onclick =
            openDifficulty;

    }

}

/* =====================================================
   DRAW
===================================================== */

function draw() {

    drawWorld();

    if (
        !player
    ) {

        return;

    }

    drawPickups();

    drawParticles();

    drawBullets();

    drawEnemies();

    drawBoss();

    drawPlayer();

    drawLighting();

}

/* =====================================================
   UPDATE
===================================================== */

function update(
    dt
) {

    if (
        !gameRunning ||
        paused
    ) {

        return;

    }

    updatePlayer(
        dt
    );

    updateEnemies(
        dt
    );

    updateBoss(
        dt
    );

    updateBullets(
        dt
    );

    updatePickups();

    updateParticles(
        dt
    );

    updateCamera();

    if (
        mouse.down
    ) {

        shoot();

    }

    updateHUD();

}

/* =====================================================
   GAME LOOP
===================================================== */

function gameLoop(
    time
) {

    const dt =
        Math.min(

            2,

            (
                time -
                lastTime
            ) /
            16.666

        );

    lastTime =
        time;

    update(
        dt
    );

    draw();

    requestAnimationFrame(
        gameLoop
    );

}

/* =====================================================
   STARTUP
===================================================== */

createExtraUI();

createAchievementsPage();

setupButtons();

updateDifficultyButton();

updateHUD();

requestAnimationFrame(
    gameLoop
);
