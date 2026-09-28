"use strict";

/* =====================================================
   ECHOBOUND — THE LOST SIGNAL
   STABLE GAME VERSION
===================================================== */


/* =====================================================
   CANVAS
===================================================== */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas ? mapCanvas.getContext("2d") : null;

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;


/* =====================================================
   GAME STATE
===================================================== */

let gameRunning = false;
let paused = false;

let player = null;

let enemies = [];
let bullets = [];
let particles = [];
let pickups = [];

let boss = null;

let cameraX = 0;
let cameraY = 0;

let keys = {};

let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};


/* =====================================================
   WORLD
===================================================== */

const WORLD_W = 2400;
const WORLD_H = 2400;


/* =====================================================
   WALLS
===================================================== */

const walls = [

    { x: 500, y: 350, w: 420, h: 55 },

    { x: 1010, y: 250, w: 55, h: 500 },

    { x: 1370, y: 500, w: 500, h: 55 },

    { x: 1490, y: 950, w: 55, h: 550 },

    { x: 800, y: 1500, w: 540, h: 55 },

    { x: 390, y: 1030, w: 55, h: 460 },

    { x: 1080, y: 980, w: 55, h: 300 },

    { x: 600, y: 1840, w: 470, h: 55 },

    { x: 1740, y: 1680, w: 450, h: 55 },

    { x: 1850, y: 760, w: 55, h: 440 },

    { x: 140, y: 720, w: 300, h: 45 },

    { x: 1920, y: 350, w: 270, h: 45 }

];


/* =====================================================
   DOORS
===================================================== */

const doorData = [

    {
        x: 930,
        y: 690,
        w: 90,
        h: 35,
        open: false
    },

    {
        x: 1340,
        y: 900,
        w: 35,
        h: 105,
        open: false
    },

    {
        x: 710,
        y: 1465,
        w: 105,
        h: 35,
        open: false
    },

    {
        x: 1450,
        y: 1490,
        w: 35,
        h: 110,
        open: false
    },

    {
        x: 1700,
        y: 1640,
        w: 105,
        h: 35,
        open: false
    }

];


let doors = [];


/* =====================================================
   SWITCHES
===================================================== */

const switchData = [

    {
        x: 850,
        y: 650,
        door: 0
    },

    {
        x: 1290,
        y: 850,
        door: 1
    },

    {
        x: 650,
        y: 1400,
        door: 2
    },

    {
        x: 1580,
        y: 1570,
        door: 3
    },

    {
        x: 1600,
        y: 1725,
        door: 4
    }

];


let switches = [];


/* =====================================================
   WEAPONS
===================================================== */

const weapons = [

    {
        name: "PULSE",
        damage: 1,
        cooldown: 9,
        speed: 12,
        count: 1,
        spread: 0,
        ammo: 12,
        color: "#77dcff"
    },

    {
        name: "BLASTER",
        damage: 1.5,
        cooldown: 5,
        speed: 15,
        count: 1,
        spread: 0.025,
        ammo: 18,
        color: "#b3efff"
    },

    {
        name: "SHOTGUN",
        damage: 0.7,
        cooldown: 22,
        speed: 10,
        count: 7,
        spread: 0.32,
        ammo: 8,
        color: "#ffc274"
    },

    {
        name: "ARC",
        damage: 4,
        cooldown: 17,
        speed: 17,
        count: 1,
        spread: 0,
        ammo: 6,
        color: "#d89cff"
    }

];


/* =====================================================
   SKINS
===================================================== */

const skins = [

    {
        name: "CYAN",
        color: "#71cfff"
    },

    {
        name: "VIOLET",
        color: "#c789ff"
    },

    {
        name: "AMBER",
        color: "#ffbf6b"
    },

    {
        name: "GHOST",
        color: "#e8edf2"
    },

    {
        name: "NEON",
        color: "#70ffc5"
    },

    {
        name: "EMBER",
        color: "#ff786b"
    }

];


let selectedSkin =
    Number(
        localStorage.getItem(
            "echobound_skin"
        ) || 0
    );


let difficulty =
    localStorage.getItem(
        "echobound_difficulty"
    ) || "normal";


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

    arsenal: false,

    switchMaster: false

};


/* =====================================================
   STATS
===================================================== */

let stats = {

    runs: 0,

    totalKills: 0,

    totalBosses: 0,

    totalShots: 0,

    totalDamage: 0,

    totalDistance: 0,

    highestLevel: 1

};


/* =====================================================
   SAVE
===================================================== */

const SAVE_KEY =
    "echobound_stable_save_1";


/* =====================================================
   HELPERS
===================================================== */

function byId(id) {

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


function dist(
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


function random(
    min,
    max
) {

    return (
        min +
        Math.random() *
        (
            max -
            min
        )
    );

}


function difficultyMultiplier() {

    if (
        difficulty ===
        "easy"
    ) {

        return 0.75;

    }

    if (
        difficulty ===
        "hard"
    ) {

        return 1.3;

    }

    return 1;

}


/* =====================================================
   WORLD OBJECT RESET
===================================================== */

function resetWorld() {

    doors =
        doorData.map(
            door => ({
                ...door
            })
        );


    switches =
        switchData.map(
            sw => ({
                ...sw,
                active: false
            })
        );

}


resetWorld();


/* =====================================================
   COLLISION
===================================================== */

function circleRectHit(
    cx,
    cy,
    radius,
    rect
) {

    const closestX =
        clamp(
            cx,
            rect.x,
            rect.x + rect.w
        );


    const closestY =
        clamp(
            cy,
            rect.y,
            rect.y + rect.h
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


function obstacles() {

    return walls.concat(

        doors.filter(
            door =>
                !door.open
        )

    );

}


function isBlocked(
    x,
    y,
    radius
) {

    for (
        const obstacle
        of obstacles()
    ) {

        if (
            circleRectHit(
                x,
                y,
                radius,
                obstacle
            )
        ) {

            return true;

        }

    }

    return false;

}


function moveNormal(
    entity,
    dx,
    dy
) {

    const nextX =
        entity.x + dx;


    if (
        !isBlocked(
            nextX,
            entity.y,
            entity.radius
        )
    ) {

        entity.x =
            nextX;

    }


    const nextY =
        entity.y + dy;


    if (
        !isBlocked(
            entity.x,
            nextY,
            entity.radius
        )
    ) {

        entity.y =
            nextY;

    }


    entity.x =
        clamp(
            entity.x,
            entity.radius,
            WORLD_W -
            entity.radius
        );


    entity.y =
        clamp(
            entity.y,
            entity.radius,
            WORLD_H -
            entity.radius
        );

}


function bulletHitsWall(
    x1,
    y1,
    x2,
    y2
) {

    for (
        const obstacle
        of obstacles()
    ) {

        const minX =
            Math.min(
                x1,
                x2
            );


        const maxX =
            Math.max(
                x1,
                x2
            );


        const minY =
            Math.min(
                y1,
                y2
            );


        const maxY =
            Math.max(
                y1,
                y2
            );


        if (

            maxX >= obstacle.x &&

            minX <=
                obstacle.x +
                obstacle.w &&

            maxY >= obstacle.y &&

            minY <=
                obstacle.y +
                obstacle.h

        ) {

            return true;

        }

    }

    return false;

}


/* =====================================================
   AUDIO
===================================================== */

let audioContext =
    null;


function startAudio() {

    if (
        audioContext
    ) {

        return;

    }


    const AudioClass =
        window.AudioContext ||
        window.webkitAudioContext;


    if (
        !AudioClass
    ) {

        return;

    }


    audioContext =
        new AudioClass();

}


function sound(
    frequency,
    duration
) {

    if (
        !audioContext
    ) {

        return;

    }


    const oscillator =
        audioContext
            .createOscillator();


    const gain =
        audioContext
            .createGain();


    oscillator.type =
        "square";


    oscillator.frequency.value =
        frequency;


    gain.gain.value =
        0.025;


    oscillator.connect(
        gain
    );


    gain.connect(
        audioContext
            .destination
    );


    oscillator.start();


    gain.gain
        .exponentialRampToValueAtTime(

            0.0001,

            audioContext.currentTime +
            duration

        );


    oscillator.stop(

        audioContext.currentTime +
        duration

    );

}


/* =====================================================
   MENU / EXTRA UI
===================================================== */

function addExtraButtons() {

    const menuButtons =
        document.querySelector(
            ".menuButtons"
        );


    if (
        !menuButtons
    ) {

        return;

    }


    if (
        !byId(
            "skinsButton"
        )
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.id =
            "skinsButton";


        button.className =
            "menuButton";


        button.textContent =
            "SKINS";


        menuButtons.appendChild(
            button
        );


        button.onclick =
            openSkins;

    }


    if (
        !byId(
            "statsButton"
        )
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.id =
            "statsButton";


        button.className =
            "menuButton";


        button.textContent =
            "STATS";


        menuButtons.appendChild(
            button
        );


        button.onclick =
            openStats;

    }


    if (
        !byId(
            "difficultyButton"
        )
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.id =
            "difficultyButton";


        button.className =
            "menuButton";


        menuButtons.appendChild(
            button
        );


        button.onclick =
            openDifficulty;

    }


    updateDifficultyButton();

}


function updateDifficultyButton() {

    const button =
        byId(
            "difficultyButton"
        );


    if (
        button
    ) {

        button.textContent =
            "DIFFICULTY: " +
            difficulty
                .toUpperCase();

    }

}


/* =====================================================
   EXTRA CSS
===================================================== */

function addExtraCSS() {

    if (
        byId(
            "echoStableCSS"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "echoStableCSS";


    style.textContent = `

        #crosshairStable {
            position:fixed;
            width:18px;
            height:18px;
            border:1px solid rgba(190,240,255,.9);
            border-radius:50%;
            transform:translate(-50%,-50%);
            pointer-events:none;
            z-index:100;
        }

        #stableLevelHud {
            position:fixed;
            left:50%;
            bottom:18px;
            transform:translateX(-50%);
            width:270px;
            text-align:center;
            pointer-events:none;
            z-index:50;
        }

        #stableLevelText {
            color:#9edfff;
            font-size:10px;
            letter-spacing:3px;
            margin-bottom:5px;
        }

        #stableXpBar {
            height:7px;
            background:#081219;
            border:1px solid #355468;
            border-radius:4px;
            overflow:hidden;
        }

        #stableXpFill {
            width:0%;
            height:100%;
            background:#6bddff;
        }

        #stableBossHud {
            position:fixed;
            top:75px;
            left:50%;
            transform:translateX(-50%);
            width:min(550px,72vw);
            text-align:center;
            pointer-events:none;
            z-index:70;
            display:none;
        }

        #stableBossName {
            color:#ffb18b;
            font-size:12px;
            letter-spacing:4px;
            margin-bottom:5px;
        }

        #stableBossBar {
            height:12px;
            background:#150d0c;
            border:1px solid #714d41;
            border-radius:5px;
            overflow:hidden;
        }

        #stableBossFill {
            width:100%;
            height:100%;
            background:#ff7658;
        }

        .stablePanel {
            position:fixed;
            inset:0;
            z-index:3000;
            display:flex;
            align-items:center;
            justify-content:center;
            background:rgba(2,7,11,.97);
            padding:20px;
        }

        .stablePanelBox {
            width:min(850px,95vw);
            max-height:90vh;
            overflow-y:auto;
            padding:32px;
            background:
                linear-gradient(
                    145deg,
                    #152b38,
                    #08131a
                );
            border:1px solid #4d7182;
            border-radius:20px;
            box-shadow:0 30px 100px rgba(0,0,0,.8);
        }

        .stablePanelBox h2 {
            color:white;
            font-size:36px;
            letter-spacing:4px;
            margin-bottom:8px;
        }

        .stablePanelBox p {
            color:#839aa7;
            margin-bottom:22px;
        }

        .stableBack {
            padding:10px 18px;
            color:white;
            background:#172d3a;
            border:1px solid #4d6f7e;
            border-radius:8px;
            cursor:pointer;
        }

        .stableGrid {
            display:grid;
            grid-template-columns:
                repeat(2,minmax(0,1fr));
            gap:14px;
            margin-bottom:20px;
        }

        .stableChoice {
            padding:18px;
            color:white;
            background:#0d1b23;
            border:1px solid #2a4654;
            border-radius:12px;
            cursor:pointer;
        }

        .stableChoice.active {
            border-color:#6bd8ff;
            background:#173240;
        }

        .stableChoice small {
            color:#7f96a3;
        }

        .stableSkinGrid {
            display:grid;
            grid-template-columns:
                repeat(3,1fr);
            gap:12px;
            margin-bottom:20px;
        }

        .stableSkin {
            padding:14px;
            color:white;
            text-align:center;
            background:#0d1b23;
            border:1px solid #2b4653;
            border-radius:12px;
            cursor:pointer;
        }

        .stableSkin.active {
            border-color:#6ed7ff;
        }

        .stableSkinPreview {
            width:55px;
            height:55px;
            border-radius:50%;
            margin:0 auto 10px;
        }

        .stableStats {
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:10px;
            margin-bottom:20px;
        }

        .stableStat {
            display:flex;
            justify-content:space-between;
            padding:12px;
            background:#0d1b23;
            border:1px solid #2a4653;
            border-radius:8px;
            color:#d9edf5;
        }

        .stableAchievementGrid {
            display:grid;
            grid-template-columns:
                repeat(2,minmax(0,1fr));
            gap:13px;
        }

        .stableAchievement {
            display:grid;
            grid-template-columns:48px 1fr auto;
            align-items:center;
            gap:12px;
            min-height:100px;
            padding:15px;
            background:#0d1b23;
            border:1px solid #294552;
            border-radius:12px;
        }

        .stableAchievement.unlocked {
            border-color:#63cef6;
            background:#14303d;
        }

        .stableAchievementIcon {
            width:46px;
            height:46px;
            display:flex;
            align-items:center;
            justify-content:center;
            color:#556d78;
            background:#081218;
            border:1px solid #334d59;
            border-radius:10px;
            font-size:21px;
        }

        .stableAchievement.unlocked
        .stableAchievementIcon {
            color:#78dcff;
        }

        .stableAchievement h3 {
            color:#e5f5fb;
            font-size:14px;
            letter-spacing:1px;
            margin-bottom:5px;
        }

        .stableAchievement p {
            margin:0;
            color:#788f9d;
            font-size:12px;
        }

        .stableAchievement b {
            color:#5c707b;
            font-size:9px;
            letter-spacing:2px;
        }

        .stableAchievement.unlocked b {
            color:#6ed6ff;
        }

        @media(max-width:700px) {

            .stableAchievementGrid,
            .stableGrid,
            .stableStats {
                grid-template-columns:1fr;
            }

            .stableSkinGrid {
                grid-template-columns:1fr 1fr;
            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =====================================================
   EXTRA HUD
===================================================== */

function createExtraHUD() {

    if (
        !byId(
            "crosshairStable"
        )
    ) {

        const crosshair =
            document.createElement(
                "div"
            );


        crosshair.id =
            "crosshairStable";


        document.body.appendChild(
            crosshair
        );

    }


    if (
        !byId(
            "stableLevelHud"
        )
    ) {

        const hud =
            document.createElement(
                "div"
            );


        hud.id =
            "stableLevelHud";


        hud.innerHTML = `

            <div id="stableLevelText">
                LEVEL 1
            </div>

            <div id="stableXpBar">
                <div id="stableXpFill"></div>
            </div>

        `;


        document.body.appendChild(
            hud
        );

    }


    if (
        !byId(
            "stableBossHud"
        )
    ) {

        const hud =
            document.createElement(
                "div"
            );


        hud.id =
            "stableBossHud";


        hud.innerHTML = `

            <div id="stableBossName">
                ECHO WARDEN
            </div>

            <div id="stableBossBar">
                <div id="stableBossFill"></div>
            </div>

        `;


        document.body.appendChild(
            hud
        );

    }

}


/* =====================================================
   NEW GAME
===================================================== */

function startNewGame() {

    startAudio();


    if (
        audioContext &&
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();

    }


    stats.runs++;


    createPlayer();


    enemies = [];

    bullets = [];

    particles = [];

    pickups = [];

    boss = null;


    resetWorld();


    /*
        BELANGRIJK:
        Monsters worden nu bewust
        in de buurt geplaatst.
    */

    const positions = [

        {
            x: 820,
            y: 1100
        },

        {
            x: 1550,
            y: 1100
        },

        {
            x: 900,
            y: 1350
        },

        {
            x: 1500,
            y: 1350
        },

        {
            x: 1000,
            y: 900
        },

        {
            x: 1400,
            y: 900
        },

        {
            x: 1100,
            y: 1600
        },

        {
            x: 1400,
            y: 1600
        }

    ];


    for (
        const pos of positions
    ) {

        if (
            !isBlocked(
                pos.x,
                pos.y,
                20
            )
        ) {

            createEnemyAt(
                pos.x,
                pos.y
            );

        }

    }


    /*
        Extra random monsters
    */

    for (
        let i = enemies.length;
        i < 14;
        i++
    ) {

        createEnemy();

    }


    gameRunning =
        true;

    paused =
        false;


    mouse.down =
        false;


    byId("menu")
        .style.display =
        "none";


    byId("pause")
        .style.display =
        "none";


    byId("map")
        .style.display =
        "none";


    if (
        byId(
            "stableBossHud"
        )
    ) {

        byId(
            "stableBossHud"
        ).style.display =
            "none";

    }


    updateHUD();


    sound(
        300,
        0.12
    );

}


/* =====================================================
   CREATE PLAYER
===================================================== */

function createPlayer() {

    player = {

        x: 1200,
        y: 1200,

        radius: 18,

        speed: 4,

        health: 100,
        maxHealth: 100,

        energy: 100,
        maxEnergy: 100,

        weapon: 0,

        ammo:
            weapons[0].ammo,

        kills: 0,

        credits: 0,

        xp: 0,

        level: 1,

        cooldown: 0,

        dashCooldown: 0,

        dashTimer: 0,

        invincible: 0,

        distance: 0

    };

}


/* =====================================================
   CREATE ENEMY
===================================================== */

function createEnemyAt(
    x,
    y
) {

    const types = [

        "normal",

        "fast",

        "shield",

        "flying",

        "flanker",

        "flee",

        "cover"

    ];


    const type =
        types[
            Math.floor(
                Math.random() *
                types.length
            )
        ];


    const enemy = {

        x: x,

        y: y,

        radius: 17,

        speed: 0.8,

        hp: 2,

        maxHp: 2,

        shield: 0,

        cooldown:
            random(
                60,
                120
            ),

        type: type,

        strafe:
            Math.random() <
            0.5
                ? -1
                : 1,

        coverX: null,

        coverY: null

    };


    if (
        type ===
        "fast"
    ) {

        enemy.speed =
            1.25;

    }


    if (
        type ===
        "shield"
    ) {

        enemy.radius =
            20;

        enemy.hp =
            4;

        enemy.maxHp =
            4;

        enemy.shield =
            4;

    }


    if (
        type ===
        "flying"
    ) {

        enemy.radius =
            15;

        enemy.speed =
            1.1;

    }


    if (
        type ===
        "flanker"
    ) {

        enemy.speed =
            1;

    }


    if (
        type ===
        "flee"
    ) {

        enemy.hp =
            3;

        enemy.maxHp =
            3;

        enemy.speed =
            1;

    }


    if (
        type ===
        "cover"
    ) {

        enemy.hp =
            4;

        enemy.maxHp =
            4;

        enemy.speed =
            0.65;

    }


    enemies.push(
        enemy
    );

}


function createEnemy() {

    if (
        !player
    ) {

        return;

    }


    let tries =
        0;


    while (
        tries < 300
    ) {

        tries++;


        const angle =
            Math.random() *
            Math.PI *
            2;


        const d =
            random(
                500,
                900
            );


        const x =
            clamp(

                player.x +
                Math.cos(angle) *
                d,

                60,

                WORLD_W -
                60

            );


        const y =
            clamp(

                player.y +
                Math.sin(angle) *
                d,

                60,

                WORLD_H -
                60

            );


        if (
            !isBlocked(
                x,
                y,
                22
            )
        ) {

            createEnemyAt(
                x,
                y
            );

            return;

        }

    }


    createEnemyAt(
        700,
        700
    );

}


/* =====================================================
   PLAYER UPDATE
===================================================== */

function updatePlayer() {

    if (
        !player
    ) {

        return;

    }


    let dx = 0;
    let dy = 0;


    if (
        keys["w"] ||
        keys["arrowup"]
    ) {

        dy--;

    }


    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {

        dy++;

    }


    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        dx--;

    }


    if (
        keys["d"] ||
        keys["arrowright"]
    ) {

        dx++;

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
            player.dashTimer >
            0
        ) {

            speed =
                11;

            player.dashTimer--;

        }


        const beforeX =
            player.x;


        const beforeY =
            player.y;


        moveNormal(

            player,

            dx *
            speed,

            dy *
            speed

        );


        player.distance +=

            dist(

                beforeX,
                beforeY,

                player.x,
                player.y

            );


        stats.totalDistance +=

            dist(

                beforeX,
                beforeY,

                player.x,
                player.y

            );


        if (
            player.distance >
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


    /*
        DASH
    */

    if (

        keys["space"] &&

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

        player.dashCooldown =
            70;

        player.energy -=
            25;

        player.invincible =
            25;

        keys["space"] =
            false;

        createParticles(
            player.x,
            player.y,
            25
        );

        sound(
            700,
            0.08
        );

    }


    if (
        player.cooldown >
        0
    ) {

        player.cooldown--;

    }


    if (
        player.dashCooldown >
        0
    ) {

        player.dashCooldown--;

    }


    if (
        player.invincible >
        0
    ) {

        player.invincible--;

    }


    player.energy =
        Math.min(

            player.maxEnergy,

            player.energy +
            0.12

        );


    /*
        SWITCH
    */

    if (
        keys["e"]
    ) {

        useSwitch();

        keys["e"] =
            false;

    }

}


/* =====================================================
   SWITCH
===================================================== */

function useSwitch() {

    let nearest =
        null;

    let nearestDistance =
        Infinity;


    for (
        const sw of switches
    ) {

        const d =
            dist(

                player.x,
                player.y,

                sw.x,
                sw.y

            );


        if (
            d < 55 &&
            d <
            nearestDistance
        ) {

            nearest =
                sw;

            nearestDistance =
                d;

        }

    }


    if (
        !nearest
    ) {

        return;

    }


    const door =
        doors[
            nearest.door
        ];


    if (
        !door
    ) {

        return;

    }


    door.open =
        !door.open;


    nearest.active =
        door.open;


    if (
        doors.every(
            d => d.open
        ) &&
        !achievements.switchMaster
    ) {

        achievements.switchMaster =
            true;

        showAchievement(
            "SWITCH MASTER"
        );

        updateAchievementsPage();

    }


    sound(
        door.open
            ? 560
            : 220,

        0.1
    );

}


/* =====================================================
   ENEMY UPDATE
===================================================== */

function updateEnemies() {

    const diff =
        difficultyMultiplier();


    for (
        const enemy of enemies
    ) {

        if (
            !player
        ) {

            continue;

        }


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
            d === 0
        ) {

            continue;

        }


        let mx =
            dx /
            d;


        let my =
            dy /
            d;


        /*
            NORMAL
        */

        if (
            enemy.type ===
            "normal"
        ) {

            if (
                d > 70
            ) {

                moveNormal(

                    enemy,

                    mx *
                    enemy.speed *
                    diff,

                    my *
                    enemy.speed *
                    diff

                );

            }

        }


        /*
            FAST
        */

        else if (
            enemy.type ===
            "fast"
        ) {

            if (
                d > 60
            ) {

                moveNormal(

                    enemy,

                    mx *
                    enemy.speed *
                    diff,

                    my *
                    enemy.speed *
                    diff

                );

            }

        }


        /*
            SHIELD
        */

        else if (
            enemy.type ===
            "shield"
        ) {

            if (
                d > 160
            ) {

                moveNormal(

                    enemy,

                    mx *
                    enemy.speed *
                    diff,

                    my *
                    enemy.speed *
                    diff

                );

            }

        }


        /*
            FLANKER
        */

        else if (
            enemy.type ===
            "flanker"
        ) {

            const sideAngle =
                Math.atan2(
                    dy,
                    dx
                ) +
                (
                    Math.PI /
                    2
                ) *
                enemy.strafe;


            const sx =
                Math.cos(
                    sideAngle
                );


            const sy =
                Math.sin(
                    sideAngle
                );


            if (
                d > 150
            ) {

                moveNormal(

                    enemy,

                    mx *
                    enemy.speed *
                    diff,

                    my *
                    enemy.speed *
                    diff

                );

            } else {

                moveNormal(

                    enemy,

                    sx *
                    enemy.speed *
                    diff,

                    sy *
                    enemy.speed *
                    diff

                );

            }

        }


        /*
            FLEE
        */

        else if (
            enemy.type ===
            "flee"
        ) {

            if (
                enemy.hp <
                enemy.maxHp
            ) {

                moveNormal(

                    enemy,

                    -mx *
                    enemy.speed *
                    diff,

                    -my *
                    enemy.speed *
                    diff

                );

            } else if (
                d > 250
            ) {

                moveNormal(

                    enemy,

                    mx *
                    enemy.speed *
                    diff,

                    my *
                    enemy.speed *
                    diff

                );

            }

        }


        /*
            COVER
        */

        else if (
            enemy.type ===
            "cover"
        ) {

            if (
                enemy.coverX ===
                null
            ) {

                const wall =
                    walls[
                        Math.floor(
                            Math.random() *
                            walls.length
                        )
                    ];


                enemy.coverX =
                    clamp(

                        wall.x +
                        wall.w / 2,

                        50,

                        WORLD_W -
                        50

                    );


                enemy.coverY =
                    clamp(

                        wall.y +
                        wall.h / 2,

                        50,

                        WORLD_H -
                        50

                    );

            }


            const cdx =
                enemy.coverX -
                enemy.x;


            const cdy =
                enemy.coverY -
                enemy.y;


            const cd =
                Math.hypot(
                    cdx,
                    cdy
                );


            if (
                cd > 40
            ) {

                moveNormal(

                    enemy,

                    cdx /
                    cd *
                    enemy.speed,

                    cdy /
                    cd *
                    enemy.speed

                );

            }

        }


        /*
            FLYING
        */

        else if (
            enemy.type ===
            "flying"
        ) {

            if (
                d > 120
            ) {

                enemy.x +=
                    mx *
                    enemy.speed *
                    diff;


                enemy.y +=
                    my *
                    enemy.speed *
                    diff;

            }

        }


        /*
            SHOOT
        */

        enemy.cooldown--;


        if (
            enemy.cooldown <=
            0 &&
            d < 720
        ) {

            enemy.cooldown =
                random(
                    80,
                    150
                ) /
                diff;


            const angle =
                Math.atan2(
                    dy,
                    dx
                );


            bullets.push({

                x:
                    enemy.x,

                y:
                    enemy.y,

                vx:
                    Math.cos(
                        angle
                    ) *
                    3.1,

                vy:
                    Math.sin(
                        angle
                    ) *
                    3.1,

                enemy:
                    true,

                damage:
                    enemy.type ===
                    "shield"
                        ? 7
                        : 8,

                life:
                    190

            });

        }


        /*
            CONTACT
        */

        if (
            d <
            player.radius +
            enemy.radius
        ) {

            damagePlayer(
                0.4 *
                diff
            );

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


    const places = [

        {
            x: 220,
            y: 220
        },

        {
            x:
                WORLD_W -
                220,

            y:
                220
        },

        {
            x:
                WORLD_W -
                220,

            y:
                WORLD_H -
                220
        },

        {
            x:
                220,

            y:
                WORLD_H -
                220
        }

    ];


    const place =
        places[
            Math.floor(
                Math.random() *
                places.length
            )
        ];


    const hp =
        160 +
        player.level *
        30;


    boss = {

        x:
            place.x,

        y:
            place.y,

        radius:
            42,

        hp:
            hp,

        maxHp:
            hp,

        cooldown:
            70

    };


    byId(
        "stableBossHud"
    ).style.display =
        "block";


    showAchievement(
        "BOSS INCOMING"
    );


    sound(
        80,
        0.3
    );

}


function updateBoss() {

    if (
        !boss
    ) {

        return;

    }


    const diff =
        difficultyMultiplier();


    const dx =
        player.x -
        boss.x;


    const dy =
        player.y -
        boss.y;


    const d =
        Math.hypot(
            dx,
            dy
        );


    if (
        d > 130
    ) {

        moveNormal(

            boss,

            dx /
            d *
            0.5 *
            diff,

            dy /
            d *
            0.5 *
            diff

        );

    }


    boss.cooldown--;


    if (
        boss.cooldown <=
        0
    ) {

        boss.cooldown =
            60 /
            diff;


        const angle =
            Math.atan2(
                dy,
                dx
            );


        for (
            let i = 0;
            i < 9;
            i++
        ) {

            const a =
                angle +
                (
                    i - 4
                ) *
                0.13;


            bullets.push({

                x:
                    boss.x,

                y:
                    boss.y,

                vx:
                    Math.cos(a) *
                    3.7,

                vy:
                    Math.sin(a) *
                    3.7,

                enemy:
                    true,

                damage:
                    10,

                life:
                    220

            });

        }

    }


    if (
        d <
        player.radius +
        boss.radius
    ) {

        damagePlayer(
            1 *
            diff
        );

    }


    byId(
        "stableBossFill"
    ).style.width =

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
   SHOOT
===================================================== */

function shoot() {

    if (
        !player ||
        !gameRunning ||
        paused ||
        player.cooldown >
        0
    ) {

        return;

    }


    const weapon =
        weapons[
            player.weapon
        ];


    if (
        player.ammo <= 0
    ) {

        player.ammo =
            weapon.ammo;

        sound(
            150,
            0.06
        );

        return;

    }


    player.ammo--;


    player.cooldown =
        weapon.cooldown;


    stats.totalShots++;


    const targetX =
        cameraX +
        mouse.x;


    const targetY =
        cameraY +
        mouse.y;


    const baseAngle =
        Math.atan2(

            targetY -
            player.y,

            targetX -
            player.x

        );


    for (
        let i = 0;
        i < weapon.count;
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

            enemy:
                false,

            damage:
                weapon.damage,

            life:
                100,

            color:
                weapon.color

        });

    }


    createParticles(

        player.x +
        Math.cos(baseAngle) *
        25,

        player.y +
        Math.sin(baseAngle) *
        25,

        weapon.count > 1
            ? 7
            : 4

    );


    sound(

        player.weapon ===
        2
            ? 120
            : player.weapon ===
                3
                ? 700
                : 430,

        0.04

    );

}


/* =====================================================
   BULLET UPDATE
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
                5
            );


            bullets.splice(
                i,
                1
            );


            continue;

        }


        if (

            bullet.life <= 0 ||

            bullet.x < 0 ||

            bullet.y < 0 ||

            bullet.x >
            WORLD_W ||

            bullet.y >
            WORLD_H

        ) {

            bullets.splice(
                i,
                1
            );


            continue;

        }


        /* ENEMY BULLET */

        if (
            bullet.enemy
        ) {

            if (

                dist(

                    bullet.x,
                    bullet.y,

                    player.x,
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


        }


        /* PLAYER BULLET */

        else {

            let destroyed =
                false;


            for (
                let j =
                    enemies.length - 1;

                j >= 0;

                j--
            ) {

                const enemy =
                    enemies[j];


                if (

                    dist(

                        bullet.x,
                        bullet.y,

                        enemy.x,
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


                    stats.totalDamage +=
                        damage;


                    createParticles(
                        enemy.x,
                        enemy.y,
                        8
                    );


                    destroyed =
                        true;


                    if (
                        enemy.hp <=
                        0
                    ) {

                        killEnemy(
                            j
                        );

                    }


                    break;

                }

            }


            if (
                !destroyed &&
                boss
            ) {

                if (

                    dist(

                        bullet.x,
                        bullet.y,

                        boss.x,
                        boss.y

                    )

                    <

                    boss.radius +
                    8

                ) {

                    boss.hp -=
                        bullet.damage;


                    stats.totalDamage +=
                        bullet.damage;


                    createParticles(
                        boss.x,
                        boss.y,
                        8
                    );


                    destroyed =
                        true;


                    if (
                        boss.hp <=
                        0
                    ) {

                        killBoss();

                    }

                }

            }


            if (
                destroyed
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
   KILL ENEMY
===================================================== */

function killEnemy(
    index
) {

    const enemy =
        enemies[index];


    player.kills++;

    stats.totalKills++;


    player.credits +=

        enemy.type ===
        "shield"
            ? 25
            : enemy.type ===
                "cover"
                ? 20
                : 10;


    addXP(
        25
    );


    createParticles(
        enemy.x,
        enemy.y,
        18
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
        player.kills >=
        10 &&
        !achievements.tenEchoes
    ) {

        achievements.tenEchoes =
            true;


        showAchievement(
            "TEN ECHOES"
        );

    }


    enemies.splice(
        index,
        1
    );


    createEnemy();


    if (

        player.kills >=
        10 &&

        !boss

    ) {

        spawnBoss();

    }


    updateAchievementsPage();

}


/* =====================================================
   KILL BOSS
===================================================== */

function killBoss() {

    if (
        !boss
    ) {

        return;

    }


    stats.totalBosses++;


    player.credits +=
        250;


    addXP(
        200
    );


    achievements.bossSlayer =
        true;


    createParticles(
        boss.x,
        boss.y,
        60
    );


    boss =
        null;


    byId(
        "stableBossHud"
    ).style.display =
        "none";


    showAchievement(
        "BOSS SLAYER"
    );


    for (
        let i = 0;
        i < 4;
        i++
    ) {

        createEnemy();

    }


    updateAchievementsPage();

}


/* =====================================================
   XP
===================================================== */

function xpNeeded() {

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
        xpNeeded()
    ) {

        player.xp -=
            xpNeeded();


        player.level++;


        player.maxHealth +=
            10;


        player.maxEnergy +=
            10;


        player.health =
            player.maxHealth;


        player.energy =
            player.maxEnergy;


        stats.highestLevel =
            Math.max(

                stats.highestLevel,

                player.level

            );


        if (
            player.level >=
            5
        ) {

            achievements.levelFive =
                true;

        }


        showAchievement(
            "LEVEL " +
            player.level
        );


        sound(
            720,
            0.15
        );

    }


    updateAchievementsPage();

}


/* =====================================================
   DAMAGE PLAYER
===================================================== */

function damagePlayer(
    amount
) {

    if (
        !player ||
        player.invincible >
        0
    ) {

        return;

    }


    player.health -=
        amount;


    player.invincible =
        25;


    createParticles(
        player.x,
        player.y,
        8
    );


    if (
        player.health <=
        0
    ) {

        player.health =
            0;


        gameOver();

    }

}


/* =====================================================
   GAME OVER
===================================================== */

function gameOver() {

    gameRunning =
        false;


    paused =
        false;


    mouse.down =
        false;


    setTimeout(

        function () {

            const again =
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
                again
            ) {

                startNewGame();

            } else {

                byId(
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


        if (

            dist(

                pickup.x,
                pickup.y,

                player.x,
                player.y

            )

            <

            35

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

        particles.push({

            x:
                x,

            y:
                y,

            vx:
                (
                    Math.random() -
                    0.5
                ) * 4,

            vy:
                (
                    Math.random() -
                    0.5
                ) * 4,

            life:
                30,

            size:
                random(
                    2,
                    4
                )

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


        p.vx *=
            0.97;


        p.vy *=
            0.97;


        p.life--;


        if (
            p.life <=
            0
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


    cameraX =
        clamp(

            player.x -
            W / 2,

            0,

            Math.max(
                0,
                WORLD_W -
                W
            )

        );


    cameraY =
        clamp(

            player.y -
            H / 2,

            0,

            Math.max(
                0,
                WORLD_H -
                H
            )

        );

}


/* =====================================================
   DRAW WORLD
===================================================== */

function drawWorld() {

    ctx.fillStyle =
        "#09141b";


    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    const grid =
        100;


    for (
        let x =
            -(cameraX % grid);

        x < W;

        x +=
            grid

    ) {

        ctx.strokeStyle =
            "rgba(110,190,220,.06)";


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
            -(cameraY % grid);

        y < H;

        y +=
            grid

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

}


/* =====================================================
   DRAW WALLS
===================================================== */

function drawWalls() {

    for (
        const wall of walls
    ) {

        const x =
            wall.x -
            cameraX;


        const y =
            wall.y -
            cameraY;


        ctx.fillStyle =
            "rgba(0,0,0,.45)";


        ctx.fillRect(

            x + 6,
            y + 7,

            wall.w,
            wall.h

        );


        ctx.fillStyle =
            "#1a2b35";


        ctx.fillRect(

            x,
            y,

            wall.w,
            wall.h

        );


        ctx.strokeStyle =
            "#527d8e";


        ctx.lineWidth =
            2;


        ctx.strokeRect(

            x,
            y,

            wall.w,
            wall.h

        );


        ctx.fillStyle =
            "rgba(100,220,255,.32)";


        if (
            wall.w >
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


/* =====================================================
   DRAW DOORS
===================================================== */

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
            cameraX;


        const y =
            door.y -
            cameraY;


        ctx.fillStyle =
            "#563b30";


        ctx.fillRect(

            x,
            y,

            door.w,
            door.h

        );


        ctx.strokeStyle =
            "#ffb36f";


        ctx.lineWidth =
            2;


        ctx.strokeRect(

            x,
            y,

            door.w,
            door.h

        );

    }

}


/* =====================================================
   DRAW SWITCHES
===================================================== */

function drawSwitches() {

    for (
        const sw of switches
    ) {

        const x =
            sw.x -
            cameraX;


        const y =
            sw.y -
            cameraY;


        ctx.fillStyle =

            sw.active

                ? "#69ddff"

                : "#b17255";


        ctx.fillRect(

            x - 7,
            y - 7,

            14,
            14

        );


        ctx.strokeStyle =
            "white";


        ctx.strokeRect(

            x - 7,
            y - 7,

            14,
            14

        );


        if (

            dist(

                player.x,
                player.y,

                sw.x,
                sw.y

            ) < 55

        ) {

            ctx.fillStyle =
                "#c4efff";


            ctx.font =
                "12px Arial";


            ctx.fillText(
                "E",
                x + 12,
                y - 10
            );

        }

    }

}


/* =====================================================
   DRAW PLAYER
===================================================== */

function drawPlayer() {

    const x =
        player.x -
        cameraX;


    const y =
        player.y -
        cameraY;


    const targetX =
        cameraX +
        mouse.x;


    const targetY =
        cameraY +
        mouse.y;


    const angle =
        Math.atan2(

            targetY -
            player.y,

            targetX -
            player.x

        );


    ctx.fillStyle =
        "rgba(0,0,0,.4)";


    ctx.beginPath();


    ctx.ellipse(

        x,
        y + 14,

        24,
        8,

        0,
        0,
        Math.PI * 2

    );


    ctx.fill();


    const skin =
        skins[
            selectedSkin
        ] ||
        skins[0];


    ctx.fillStyle =

        player.invincible >
        0

            ? "#ffffff"

            : skin.color;


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
        "#eefcff";


    ctx.lineWidth =
        5;


    ctx.beginPath();


    ctx.moveTo(
        x,
        y
    );


    ctx.lineTo(

        x +
        Math.cos(angle) *
        32,

        y +
        Math.sin(angle) *
        32

    );


    ctx.stroke();


    ctx.fillStyle =
        "#ffffff";


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
            cameraX;


        const y =
            enemy.y -
            cameraY;


        let color =
            "#bd6dff";


        if (
            enemy.type ===
            "fast"
        ) {

            color =
                "#ff779f";

        }


        if (
            enemy.type ===
            "shield"
        ) {

            color =
                "#69d6ff";

        }


        if (
            enemy.type ===
            "flying"
        ) {

            color =
                "#6de2b0";

        }


        if (
            enemy.type ===
            "flanker"
        ) {

            color =
                "#e18eff";

        }


        if (
            enemy.type ===
            "flee"
        ) {

            color =
                "#ff8eb4";

        }


        if (
            enemy.type ===
            "cover"
        ) {

            color =
                "#d49b6a";

        }


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
            "#f9ecff";


        ctx.lineWidth =
            2;


        ctx.stroke();


        if (
            enemy.shield >
            0
        ) {

            ctx.strokeStyle =
                "#8deaff";


            ctx.lineWidth =
                4;


            ctx.beginPath();


            ctx.arc(

                x,
                y,

                enemy.radius +
                6,

                0,
                Math.PI * 2

            );


            ctx.stroke();

        }


        ctx.fillStyle =
            "white";


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
            "#080d12";


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
        cameraX;


    const y =
        boss.y -
        cameraY;


    ctx.fillStyle =
        "rgba(255,100,70,.2)";


    ctx.beginPath();


    ctx.arc(

        x,
        y,

        boss.radius +
        16,

        0,
        Math.PI * 2

    );


    ctx.fill();


    ctx.fillStyle =
        "#ff7658";


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
        "#ffe5dc";


    ctx.lineWidth =
        3;


    ctx.stroke();


    ctx.fillStyle =
        "white";


    ctx.beginPath();


    ctx.arc(

        x,
        y,

        7,

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

        ctx.fillStyle =

            bullet.enemy

                ? "#ff9e7d"

                : bullet.color;


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


/* =====================================================
   DRAW PARTICLES
===================================================== */

function drawParticles() {

    for (
        const p of particles
    ) {

        ctx.globalAlpha =
            p.life /
            30;


        ctx.fillStyle =
            "#9eeaff";


        ctx.fillRect(

            p.x -
            cameraX,

            p.y -
            cameraY,

            p.size,

            p.size

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


    const x =
        player.x -
        cameraX;


    const y =
        player.y -
        cameraY;


    const gradient =
        ctx.createRadialGradient(

            x,
            y,
            50,

            x,
            y,

            Math.max(
                W,
                H
            ) *
            0.75

        );


    gradient.addColorStop(

        0,

        "rgba(0,0,0,0)"

    );


    gradient.addColorStop(

        0.45,

        "rgba(0,0,0,.12)"

    );


    gradient.addColorStop(

        1,

        "rgba(0,0,0,.67)"

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
   PICKUPS DRAW
===================================================== */

function drawPickups() {

    for (
        const pickup of pickups
    ) {

        ctx.fillStyle =

            pickup.type ===
            "energy"

                ? "#63e0ff"

                : "#ffd261";


        ctx.fillRect(

            pickup.x -
            cameraX -
            7,

            pickup.y -
            cameraY -
            7,

            14,
            14

        );

    }

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
        byId(
            "healthBar"
        )
    ) {

        byId(
            "healthBar"
        ).style.width =
            health + "%";

    }


    if (
        byId(
            "energyBar"
        )
    ) {

        byId(
            "energyBar"
        ).style.width =
            energy + "%";

    }


    if (
        byId(
            "ammo"
        )
    ) {

        byId(
            "ammo"
        ).textContent =

            player.ammo +
            " / " +
            weapons[
                player.weapon
            ].ammo;

    }


    if (
        byId(
            "kills"
        )
    ) {

        byId(
            "kills"
        ).textContent =

            "KILLS: " +
            player.kills;

    }


    if (
        byId(
            "credits"
        )
    ) {

        byId(
            "credits"
        ).textContent =

            "CREDITS: " +
            player.credits;

    }


    if (
        byId(
            "zone"
        )
    ) {

        byId(
            "zone"
        ).textContent =

            "LEVEL " +
            player.level +
            " • " +
            weapons[
                player.weapon
            ].name;

    }


    if (
        byId(
            "objective"
        )
    ) {

        byId(
            "objective"
        ).textContent =

            boss

                ? "DEFEAT THE ECHO WARDEN"

                : "EXPLORE THE SECTOR";

    }


    if (
        byId(
            "stableLevelText"
        )
    ) {

        byId(
            "stableLevelText"
        ).textContent =

            "LEVEL " +
            player.level +
            " • " +
            weapons[
                player.weapon
            ].name;

    }


    if (
        byId(
            "stableXpFill"
        )
    ) {

        byId(
            "stableXpFill"
        ).style.width =

            clamp(

                player.xp /
                xpNeeded() *
                100,

                0,
                100

            ) +

            "%";

    }


    if (
        byId(
            "crosshairStable"
        )
    ) {

        byId(
            "crosshairStable"
        ).style.left =
            mouse.x +
            "px";


        byId(
            "crosshairStable"
        ).style.top =
            mouse.y +
            "px";

    }

}


/* =====================================================
   ACHIEVEMENT POPUP
===================================================== */

let achievementTimeout =
    null;


function showAchievement(
    name
) {

    const box =
        byId(
            "achievement"
        );


    const label =
        byId(
            "achievementName"
        );


    if (
        !box ||
        !label
    ) {

        return;

    }


    label.textContent =
        name;


    box.classList.add(
        "show"
    );


    clearTimeout(
        achievementTimeout
    );


    achievementTimeout =
        setTimeout(

            function () {

                box.classList.remove(
                    "show"
                );

            },

            2500

        );

}


/* =====================================================
   ACHIEVEMENTS PAGE
===================================================== */

function createAchievementsPage() {

    if (
        byId(
            "achievementsPageStable"
        )
    ) {

        return;

    }


    const page =
        document.createElement(
            "div"
        );


    page.id =
        "achievementsPageStable";


    page.className =
        "stablePanel";


    page.style.display =
        "none";


    page.innerHTML = `

        <div class="stablePanelBox">

            <div class="achievementsTop"
                 style="
                    display:flex;
                    justify-content:space-between;
                    gap:20px;
                 ">

                <div>

                    <div
                        style="
                            color:#79d5ff;
                            font-size:11px;
                            letter-spacing:5px;
                            margin-bottom:7px;
                        "
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
                    class="stableBack"
                    id="stableAchievementBack"
                >
                    BACK
                </button>

            </div>


            <div
                class="stableAchievementGrid"
            >

                ${achievementCard(
                    "achievementFirstEcho",
                    "◆",
                    "FIRST ECHO",
                    "Versla je eerste vijand."
                )}

                ${achievementCard(
                    "achievementTenEchoes",
                    "◆",
                    "TEN ECHOES",
                    "Versla 10 vijanden."
                )}

                ${achievementCard(
                    "achievementFirstSave",
                    "⬡",
                    "FIRST SAVE",
                    "Sla een run op."
                )}

                ${achievementCard(
                    "achievementExplorer",
                    "✦",
                    "EXPLORER",
                    "Leg 5000 meter af."
                )}

                ${achievementCard(
                    "achievementBoss",
                    "◉",
                    "BOSS SLAYER",
                    "Versla een boss."
                )}

                ${achievementCard(
                    "achievementLevel",
                    "↑",
                    "LEVEL FIVE",
                    "Bereik level 5."
                )}

                ${achievementCard(
                    "achievementArsenal",
                    "✚",
                    "ARSENAL",
                    "Gebruik alle wapens."
                )}

                ${achievementCard(
                    "achievementSwitch",
                    "⚡",
                    "SWITCH MASTER",
                    "Open alle deuren."
                )}

            </div>

        </div>

    `;


    document.body.appendChild(
        page
    );


    byId(
        "stableAchievementBack"
    ).onclick =
        closeAchievements;

}


function achievementCard(
    id,
    icon,
    title,
    description
) {

    return `

        <div
            class="stableAchievement"
            id="${id}"
        >

            <div
                class="stableAchievementIcon"
            >
                ${icon}
            </div>

            <div>

                <h3>
                    ${title}
                </h3>

                <p>
                    ${description}
                </p>

            </div>

            <b>
                LOCKED
            </b>

        </div>

    `;

}


function openAchievements() {

    createAchievementsPage();


    byId(
        "achievementsPageStable"
    ).style.display =
        "flex";


    updateAchievementsPage();

}


function closeAchievements() {

    if (
        byId(
            "achievementsPageStable"
        )
    ) {

        byId(
            "achievementsPageStable"
        ).style.display =
            "none";

    }

}


function updateAchievementCard(
    id,
    unlocked
) {

    const card =
        byId(id);


    if (
        !card
    ) {

        return;

    }


    const status =
        card.querySelector(
            "b"
        );


    card.classList.toggle(
        "unlocked",
        unlocked
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


function updateAchievementsPage() {

    updateAchievementCard(

        "achievementFirstEcho",

        achievements.firstEcho

    );


    updateAchievementCard(

        "achievementTenEchoes",

        achievements.tenEchoes

    );


    updateAchievementCard(

        "achievementFirstSave",

        achievements.firstSave

    );


    updateAchievementCard(

        "achievementExplorer",

        achievements.explorer

    );


    updateAchievementCard(

        "achievementBoss",

        achievements.bossSlayer

    );


    updateAchievementCard(

        "achievementLevel",

        achievements.levelFive

    );


    updateAchievementCard(

        "achievementArsenal",

        achievements.arsenal

    );


    updateAchievementCard(

        "achievementSwitch",

        achievements.switchMaster

    );

}


/* =====================================================
   SKINS
===================================================== */

function openSkins() {

    removeStablePanel();


    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "stableDynamicPanel";


    panel.className =
        "stablePanel";


    panel.innerHTML = `

        <div class="stablePanelBox">

            <h2>
                SKINS
            </h2>

            <p>
                Kies je speler.
            </p>

            <div
                class="stableSkinGrid"
            >

                ${skins.map(
                    (
                        skin,
                        index
                    ) => `

                    <div
                        class="
                            stableSkin
                            ${
                                selectedSkin ===
                                index
                                    ? "active"
                                    : ""
                            }
                        "
                        data-skin="${index}"
                    >

                        <div
                            class="stableSkinPreview"
                            style="
                                background:
                                ${skin.color};
                            "
                        ></div>

                        <b>
                            ${skin.name}
                        </b>

                    </div>

                `
                ).join("")}

            </div>

            <button
                class="stableBack"
                id="stablePanelBack"
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
            ".stableSkin"
        )
        .forEach(
            item => {

                item.onclick =
                    function () {

                        selectedSkin =
                            Number(
                                item.dataset.skin
                            );


                        localStorage.setItem(

                            "echobound_skin",

                            selectedSkin

                        );


                        openSkins();

                    };

            }
        );


    byId(
        "stablePanelBack"
    ).onclick =
        removeStablePanel;

}


function removeStablePanel() {

    const panel =
        byId(
            "stableDynamicPanel"
        );


    if (
        panel
    ) {

        panel.remove();

    }

}


/* =====================================================
   STATS
===================================================== */

function openStats() {

    removeStablePanel();


    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "stableDynamicPanel";


    panel.className =
        "stablePanel";


    const rows = [

        [
            "RUNS",
            stats.runs
        ],

        [
            "TOTAL KILLS",
            stats.totalKills
        ],

        [
            "TOTAL BOSSES",
            stats.totalBosses
        ],

        [
            "SHOTS",
            stats.totalShots
        ],

        [
            "DAMAGE",
            Math.floor(
                stats.totalDamage
            )
        ],

        [
            "DISTANCE",
            Math.floor(
                stats.totalDistance
            )
        ],

        [
            "HIGHEST LEVEL",
            stats.highestLevel
        ],

        [
            "DIFFICULTY",
            difficulty.toUpperCase()
        ]

    ];


    panel.innerHTML = `

        <div class="stablePanelBox">

            <h2>
                STATS
            </h2>

            <p>
                Je totale voortgang.
            </p>

            <div class="stableStats">

                ${rows.map(
                    row => `

                    <div class="stableStat">

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
                class="stableBack"
                id="stablePanelBack"
            >
                BACK
            </button>

        </div>

    `;


    document.body.appendChild(
        panel
    );


    byId(
        "stablePanelBack"
    ).onclick =
        removeStablePanel;

}


/* =====================================================
   DIFFICULTY
===================================================== */

function openDifficulty() {

    removeStablePanel();


    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "stableDynamicPanel";


    panel.className =
        "stablePanel";


    const values = [

        [
            "easy",
            "Rustigere vijanden."
        ],

        [
            "normal",
            "Normale uitdaging."
        ],

        [
            "hard",
            "Sterkere vijanden."
        ]

    ];


    panel.innerHTML = `

        <div class="stablePanelBox">

            <h2>
                DIFFICULTY
            </h2>

            <p>
                Kies de moeilijkheid.
            </p>

            <div class="stableGrid">

                ${values.map(
                    item => `

                    <div
                        class="
                            stableChoice
                            ${
                                difficulty ===
                                item[0]
                                    ? "active"
                                    : ""
                            }
                        "
                        data-difficulty="${item[0]}"
                    >

                        <b>
                            ${item[0].toUpperCase()}
                        </b>

                        <br><br>

                        <small>
                            ${item[1]}
                        </small>

                    </div>

                `
                ).join("")}

            </div>

            <button
                class="stableBack"
                id="stablePanelBack"
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
            ".stableChoice"
        )
        .forEach(
            item => {

                item.onclick =
                    function () {

                        difficulty =
                            item.dataset
                                .difficulty;


                        localStorage.setItem(

                            "echobound_difficulty",

                            difficulty

                        );


                        updateDifficultyButton();


                        openDifficulty();

                    };

            }
        );


    byId(
        "stablePanelBack"
    ).onclick =
        removeStablePanel;

}


/* =====================================================
   SAVE / LOAD
===================================================== */

function saveGame() {

    if (
        !player
    ) {

        alert(
            "Start eerst een run."
        );

        return;

    }


    const data = {

        player:

            player,

        achievements:

            achievements,

        stats:

            stats,

        difficulty:

            difficulty,

        selectedSkin:

            selectedSkin,

        doors:

            doors

    };


    localStorage.setItem(

        SAVE_KEY,

        JSON.stringify(
            data
        )

    );


    achievements.firstSave =
        true;


    showAchievement(
        "FIRST SAVE"
    );


    updateAchievementsPage();


    sound(
        550,
        0.08
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
            "Er is nog geen save."
        );

        return;

    }


    try {

        const data =
            JSON.parse(
                raw
            );


        player =
            data.player;


        achievements =
            {

                ...achievements,

                ...(data.achievements ||
                    {})

            };


        stats =
            {

                ...stats,

                ...(data.stats ||
                    {})

            };


        difficulty =
            data.difficulty ||
            difficulty;


        selectedSkin =
            typeof
            data.selectedSkin ===
            "number"

                ? data.selectedSkin

                : selectedSkin;


        resetWorld();


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


        if (
            isBlocked(
                player.x,
                player.y,
                player.radius
            )
        ) {

            player.x =
                1200;

            player.y =
                1200;

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


        gameRunning =
            true;


        paused =
            false;


        mouse.down =
            false;


        byId(
            "menu"
        ).style.display =
            "none";


        byId(
            "pause"
        ).style.display =
            "none";


        byId(
            "map"
        ).style.display =
            "none";


        updateDifficultyButton();


        updateHUD();


    } catch (
        error
    ) {

        console.error(
            error
        );


        alert(
            "De save kon niet worden geladen."
        );

    }

}


/* =====================================================
   KEYBOARD
===================================================== */

window.addEventListener(
    "keydown",
    function (event) {

        const key =
            event.key.toLowerCase();


        keys[key] =
            true;


        if (
            event.code ===
            "Space"
        ) {

            event.preventDefault();

            keys["space"] =
                true;

        }


        if (
            key === "1"
        ) {

            selectWeapon(
                0
            );

        }


        if (
            key === "2"
        ) {

            selectWeapon(
                1
            );

        }


        if (
            key === "3"
        ) {

            selectWeapon(
                2
            );

        }


        if (
            key === "4"
        ) {

            selectWeapon(
                3
            );

        }


        if (
            key === "m" &&
            gameRunning &&
            !paused
        ) {

            const map =
                byId(
                    "map"
                );


            map.style.display =

                map.style.display ===
                "flex"

                    ? "none"

                    : "flex";


            if (
                map.style.display ===
                "flex"
            ) {

                drawMap();

            }

        }


        if (
            key ===
            "escape"
        ) {

            if (
                byId(
                    "achievementsPageStable"
                ) &&
                byId(
                    "achievementsPageStable"
                ).style.display ===
                "flex"
            ) {

                closeAchievements();

                return;

            }


            if (
                byId(
                    "stableDynamicPanel"
                )
            ) {

                removeStablePanel();

                return;

            }


            if (
                byId(
                    "map"
                ).style.display ===
                "flex"
            ) {

                byId(
                    "map"
                ).style.display =
                    "none";

                return;

            }


            if (
                gameRunning
            ) {

                paused =
                    !paused;


                byId(
                    "pause"
                ).style.display =
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
        ] =
            false;


        if (
            event.code ===
            "Space"
        ) {

            keys["space"] =
                false;

        }

    }
);


/* =====================================================
   MOUSE
===================================================== */

document.addEventListener(
    "mousemove",
    function (event) {

        mouse.x =
            event.clientX;


        mouse.y =
            event.clientY;

    }
);


/*
    We gebruiken document in plaats
    van alleen canvas.
    Daardoor werkt schieten
    betrouwbaarder.
*/

document.addEventListener(
    "mousedown",
    function (event) {

        if (
            event.button ===
            0
        ) {

            mouse.down =
                true;

            startAudio();

        }

    }
);


document.addEventListener(
    "mouseup",
    function (event) {

        if (
            event.button ===
            0
        ) {

            mouse.down =
                false;

        }

    }
);


/* =====================================================
   WEAPON
===================================================== */

function selectWeapon(
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


    player.ammo =
        Math.min(

            player.ammo,

            weapons[index].ammo

        );


    updateHUD();


    if (

        index === 3 &&

        !achievements.arsenal

    ) {

        achievements.arsenal =
            true;

        showAchievement(
            "ARSENAL"
        );

        updateAchievementsPage();

    }


    sound(
        300 +
        index * 110,
        0.05
    );

}


/* =====================================================
   MAP
===================================================== */

if (
    byId(
        "closeMap"
    )
) {

    byId(
        "closeMap"
    ).onclick =
        function () {

            byId(
                "map"
            ).style.display =
                "none";

        };

}


function drawMap() {

    if (
        !mapCanvas ||
        !mapCtx ||
        !player
    ) {

        return;

    }


    const width =
        mapCanvas.clientWidth ||
        600;


    const height =
        mapCanvas.clientHeight ||
        500;


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


    const sx =
        width /
        WORLD_W;


    const sy =
        height /
        WORLD_H;


    for (
        const wall of walls
    ) {

        mapCtx.fillStyle =
            "#3c5a68";


        mapCtx.fillRect(

            wall.x * sx,

            wall.y * sy,

            wall.w * sx,

            wall.h * sy

        );

    }


    for (
        const door of doors
    ) {

        if (
            door.open
        ) {

            continue;

        }


        mapCtx.fillStyle =
            "#a36b4b";


        mapCtx.fillRect(

            door.x * sx,

            door.y * sy,

            door.w * sx,

            door.h * sy

        );

    }


    mapCtx.fillStyle =
        "#bb6cff";


    for (
        const enemy of enemies
    ) {

        mapCtx.beginPath();


        mapCtx.arc(

            enemy.x * sx,

            enemy.y * sy,

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
            "#ff7658";


        mapCtx.beginPath();


        mapCtx.arc(

            boss.x * sx,

            boss.y * sy,

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

        player.x * sx,

        player.y * sy,

        6,

        0,
        Math.PI * 2

    );


    mapCtx.fill();

}


/* =====================================================
   BUTTON EVENTS
===================================================== */

if (
    byId(
        "newGame"
    )
) {

    byId(
        "newGame"
    ).onclick =
        startNewGame;

}


if (
    byId(
        "loadGame"
    )
) {

    byId(
        "loadGame"
    ).onclick =
        loadGame;

}


if (
    byId(
        "achievementsButton"
    )
) {

    byId(
        "achievementsButton"
    ).onclick =
        openAchievements;

}


if (
    byId(
        "controlsButton"
    )
) {

    byId(
        "controlsButton"
    ).onclick =
        function () {

            alert(

                "BESTURING\n\n" +

                "W A S D = bewegen\n\n" +

                "MUIS = richten\n\n" +

                "LINKERMUISKNOP = schieten\n\n" +

                "1 - 4 = wapens\n\n" +

                "SPACE = dash\n\n" +

                "E = schakelaar\n\n" +

                "M = kaart\n\n" +

                "ESC = pauze"

            );

        };

}


if (
    byId(
        "resume"
    )
) {

    byId(
        "resume"
    ).onclick =
        function () {

            paused =
                false;


            byId(
                "pause"
            ).style.display =
                "none";

        };

}


if (
    byId(
        "save"
    )
) {

    byId(
        "save"
    ).onclick =
        saveGame;

}


if (
    byId(
        "quit"
    )
) {

    byId(
        "quit"
    ).onclick =
        function () {

            saveGame();


            gameRunning =
                false;


            paused =
                false;


            mouse.down =
                false;


            byId(
                "pause"
            ).style.display =
                "none";


            byId(
                "map"
            ).style.display =
                "none";


            closeAchievements();


            byId(
                "menu"
            ).style.display =
                "flex";

        };

}


/* =====================================================
   UPDATE
===================================================== */

function update() {

    if (
        !gameRunning ||
        paused ||
        !player
    ) {

        return;

    }


    updatePlayer();

    updateEnemies();

    updateBoss();

    updateBullets();

    updatePickups();

    updateParticles();

    updateCamera();


    if (
        mouse.down
    ) {

        shoot();

    }


    updateHUD();

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
   MAIN LOOP
===================================================== */

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );

}


/* =====================================================
   STARTUP
===================================================== */

addExtraCSS();

createExtraHUD();

addExtraButtons();

createAchievementsPage();

updateDifficultyButton();

updateHUD();

gameLoop();
