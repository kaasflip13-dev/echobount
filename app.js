"use strict";

/* =====================================================
   ECHOBOUND — THE LOST SIGNAL
   COMPLETE EXTENDED APP.JS
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

let lastTime = performance.now();

let audioContext = null;
let musicStarted = false;
let musicMuted = false;
let musicMaster = null;


/* =====================================================
   WORLD
===================================================== */

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 2400;


/* =====================================================
   WALLS
===================================================== */

const walls = [

    { x: 500, y: 360, w: 430, h: 55 },

    { x: 1010, y: 240, w: 55, h: 520 },

    { x: 1370, y: 500, w: 500, h: 55 },

    { x: 1490, y: 950, w: 55, h: 580 },

    { x: 780, y: 1500, w: 560, h: 55 },

    { x: 390, y: 1030, w: 55, h: 480 },

    { x: 1090, y: 980, w: 55, h: 300 },

    { x: 580, y: 1840, w: 500, h: 55 },

    { x: 1730, y: 1680, w: 470, h: 55 },

    { x: 1850, y: 760, w: 55, h: 450 },

    { x: 150, y: 720, w: 300, h: 45 },

    { x: 1900, y: 350, w: 300, h: 45 }

];


/* =====================================================
   DOORS
===================================================== */

const doorBlueprints = [

    {
        id: 0,
        x: 940,
        y: 700,
        w: 95,
        h: 34,
        open: false
    },

    {
        id: 1,
        x: 1345,
        y: 930,
        w: 34,
        h: 110,
        open: false
    },

    {
        id: 2,
        x: 720,
        y: 1462,
        w: 105,
        h: 34,
        open: false
    },

    {
        id: 3,
        x: 1450,
        y: 1520,
        w: 34,
        h: 115,
        open: false
    },

    {
        id: 4,
        x: 1690,
        y: 1642,
        w: 110,
        h: 34,
        open: false
    },

    {
        id: 5,
        x: 365,
        y: 1500,
        w: 34,
        h: 115,
        open: false
    }

];

const switchBlueprints = [

    {
        id: 0,
        x: 860,
        y: 690,
        doorId: 0,
        active: false
    },

    {
        id: 1,
        x: 1300,
        y: 880,
        doorId: 1,
        active: false
    },

    {
        id: 2,
        x: 670,
        y: 1390,
        doorId: 2,
        active: false
    },

    {
        id: 3,
        x: 1580,
        y: 1580,
        doorId: 3,
        active: false
    },

    {
        id: 4,
        x: 1590,
        y: 1740,
        doorId: 4,
        active: false
    },

    {
        id: 5,
        x: 475,
        y: 1640,
        doorId: 5,
        active: false
    }

];


/* =====================================================
   WEAPONS
===================================================== */

const weapons = [

    {
        name: "PULSE",
        damage: 1,
        cooldown: 9,
        bulletSpeed: 12,
        bullets: 1,
        spread: 0,
        ammoMax: 12,
        color: "#7be0ff"
    },

    {
        name: "BLASTER",
        damage: 1.5,
        cooldown: 5,
        bulletSpeed: 15,
        bullets: 1,
        spread: 0.03,
        ammoMax: 18,
        color: "#a4f1ff"
    },

    {
        name: "SHOTGUN",
        damage: 0.7,
        cooldown: 23,
        bulletSpeed: 10,
        bullets: 7,
        spread: 0.34,
        ammoMax: 8,
        color: "#ffbf7a"
    },

    {
        name: "ARC",
        damage: 4,
        cooldown: 18,
        bulletSpeed: 17,
        bullets: 1,
        spread: 0,
        ammoMax: 6,
        color: "#d59cff"
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
        ),

    music:
        localStorage.getItem(
            "echobound_music"
        ) !== "off"

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

    arsenal: false,

    switchMaster: false

};


/* =====================================================
   LIFETIME STATS
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
   WORLD RESET
===================================================== */

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
                ...sw
            })
        );

}


/* =====================================================
   HELPERS
===================================================== */

function $(id) {

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


function random(
    min,
    max
) {

    return (
        min +
        Math.random() *
        (max - min)
    );

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


/* =====================================================
   DIFFICULTY
===================================================== */

function difficultyMultiplier() {

    if (
        settings.difficulty ===
        "easy"
    ) {

        return 0.75;

    }

    if (
        settings.difficulty ===
        "hard"
    ) {

        return 1.3;

    }

    return 1;

}


/* =====================================================
   COLLISION
===================================================== */

function circleRectCollision(
    cx,
    cy,
    radius,
    rect
) {

    const nearestX =
        clamp(
            cx,
            rect.x,
            rect.x + rect.w
        );

    const nearestY =
        clamp(
            cy,
            rect.y,
            rect.y + rect.h
        );

    const dx =
        cx - nearestX;

    const dy =
        cy - nearestY;

    return (
        dx * dx +
        dy * dy <=
        radius * radius
    );

}


function activeObstacles() {

    return walls.concat(

        doors.filter(
            door =>
                !door.open
        )

    );

}


function collidesWithObstacle(
    x,
    y,
    radius
) {

    for (
        const obstacle of
        activeObstacles()
    ) {

        if (
            circleRectCollision(
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


function bulletHitsObstacle(
    x1,
    y1,
    x2,
    y2
) {

    for (
        const obstacle of
        activeObstacles()
    ) {

        if (
            segmentIntersectsRect(
                x1,
                y1,
                x2,
                y2,
                obstacle
            )
        ) {

            return true;

        }

    }

    return false;

}


/* =====================================================
   ENTITY MOVEMENT
===================================================== */

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
            !collidesWithObstacle(
                entity.x + dx,
                entity.y,
                entity.radius
            )
        ) {

            entity.x += dx;

        }

        if (
            !collidesWithObstacle(
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


function playSound(
    frequency,
    duration,
    type = "sine",
    volume = 0.03
) {

    if (
        !settings.music
    ) {

        return;

    }

    initAudio();

    if (
        !audioContext
    ) {

        return;

    }

    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();

    }

    const osc =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    osc.type =
        type;

    osc.frequency.value =
        frequency;

    gain.gain.value =
        volume;

    osc.connect(gain);

    gain.connect(
        audioContext.destination
    );

    osc.start();

    gain.gain.exponentialRampToValueAtTime(

        0.0001,

        audioContext.currentTime +
        duration

    );

    osc.stop(

        audioContext.currentTime +
        duration

    );

}


function startMusic() {

    if (
        musicStarted ||
        !settings.music
    ) {

        return;

    }

    initAudio();

    if (
        !audioContext
    ) {

        return;

    }

    if (
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();

    }

    musicMaster =
        audioContext.createGain();

    musicMaster.gain.value =
        0.012;

    musicMaster.connect(
        audioContext.destination
    );

    const bass =
        audioContext.createOscillator();

    const drone =
        audioContext.createOscillator();

    bass.type =
        "sine";

    drone.type =
        "triangle";

    bass.frequency.value =
        55;

    drone.frequency.value =
        82;

    bass.connect(
        musicMaster
    );

    drone.connect(
        musicMaster
    );

    bass.start();

    drone.start();

    musicStarted = true;

}


/* =====================================================
   RESIZE
===================================================== */

window.addEventListener(
    "resize",
    function () {

        W =
            window.innerWidth;

        H =
            window.innerHeight;

        canvas.width = W;
        canvas.height = H;

    }
);


/* =====================================================
   PLAYER
===================================================== */

function createPlayer() {

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

        ammo:
            weapons[0].ammoMax,

        weapon: 0,

        kills: 0,

        credits: 0,

        xp: 0,

        level: 1,

        cooldown: 0,

        dashCooldown: 0,

        dashTimer: 0,

        invincible: 0,

        distance: 0,

        switchesUsed: 0

    };

}


/* =====================================================
   XP / LEVELS
===================================================== */

function xpForNextLevel() {

    return (
        100 +
        (
            player.level -
            1
        ) *
        60
    );

}


function addXP(
    amount
) {

    player.xp +=
        amount;

    while (
        player.xp >=
        xpForNextLevel()
    ) {

        player.xp -=
            xpForNextLevel();

        player.level++;

        player.maxHealth +=
            10;

        player.maxEnergy +=
            8;

        player.health =
            player.maxHealth;

        player.energy =
            player.maxEnergy;

        stats.highestLevel =
            Math.max(
                stats.highestLevel,
                player.level
            );

        playSound(
            720,
            0.15,
            "triangle",
            0.05
        );

        showAchievement(
            "LEVEL " +
            player.level
        );

        if (
            player.level >=
            5 &&
            !achievements.levelFive
        ) {

            achievements.levelFive =
                true;

            updateAchievementsPage();

        }

    }

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

    let x = 0;
    let y = 0;

    let tries = 0;

    do {

        x =
            random(
                80,
                WORLD_WIDTH -
                80
            );

        y =
            random(
                80,
                WORLD_HEIGHT -
                80
            );

        tries++;

    } while (

        (

            distance(
                x,
                y,
                player.x,
                player.y
            ) <
            400

            ||

            collidesWithObstacle(
                x,
                y,
                24
            )

        )

        &&

        tries < 300

    );

    const roll =
        Math.random();

    let type =
        "normal";

    if (
        roll > 0.86
    ) {

        type =
            "shield";

    } else if (
        roll > 0.70
    ) {

        type =
            "flanker";

    } else if (
        roll > 0.56
    ) {

        type =
            "flee";

    } else if (
        roll > 0.42
    ) {

        type =
            "flying";

    } else if (
        roll > 0.28
    ) {

        type =
            "cover";

    } else if (
        roll > 0.14
    ) {

        type =
            "fast";

    }

    const enemy = {

        x,
        y,

        radius: 17,

        speed: 0.75,

        hp: 2,

        maxHp: 2,

        cooldown:
            random(
                70,
                140
            ),

        type,

        shield:
            type === "shield"
                ? 4
                : 0,

        coverX: null,

        coverY: null,

        strafe:
            Math.random() <
            0.5
                ? -1
                : 1

    };

    if (
        type === "fast"
    ) {

        enemy.speed =
            1.15;

        enemy.hp =
            2;

    }

    if (
        type === "shield"
    ) {

        enemy.radius =
            20;

        enemy.hp =
            4;

        enemy.maxHp =
            4;

    }

    if (
        type === "flying"
    ) {

        enemy.radius =
            15;

        enemy.speed =
            1.1;

    }

    if (
        type === "cover"
    ) {

        enemy.speed =
            0.65;

        enemy.hp =
            4;

        enemy.maxHp =
            4;

    }

    if (
        type === "flee"
    ) {

        enemy.speed =
            0.95;

        enemy.hp =
            3;

        enemy.maxHp =
            3;

    }

    if (
        type === "flanker"
    ) {

        enemy.speed =
            1;

        enemy.hp =
            2;

        enemy.maxHp =
            2;

    }

    enemies.push(
        enemy
    );

}


/* =====================================================
   ENEMY AI
===================================================== */

function updateEnemies() {

    const diff =
        difficultyMultiplier();

    for (
        const enemy of enemies
    ) {

        const dx =
            player.x -
            enemy.x;

        const dy =
            player.y -
            enemy.y;

        const dist =
            Math.hypot(
                dx,
                dy
            );

        if (
            dist === 0
        ) {

            continue;

        }

        let dirX =
            dx / dist;

        let dirY =
            dy / dist;

        let flying =
            enemy.type ===
            "flying";


        /* -------------------------
           NORMAL
        ------------------------- */

        if (
            enemy.type ===
            "normal"
        ) {

            if (
                dist > 70
            ) {

                moveEntity(

                    enemy,

                    dirX *
                    enemy.speed *
                    diff,

                    dirY *
                    enemy.speed *
                    diff

                );

            }

        }


        /* -------------------------
           FAST
        ------------------------- */

        else if (
            enemy.type ===
            "fast"
        ) {

            if (
                dist > 60
            ) {

                moveEntity(

                    enemy,

                    dirX *
                    enemy.speed *
                    diff,

                    dirY *
                    enemy.speed *
                    diff

                );

            }

        }


        /* -------------------------
           SHIELD
        ------------------------- */

        else if (
            enemy.type ===
            "shield"
        ) {

            if (
                dist > 150
            ) {

                moveEntity(

                    enemy,

                    dirX *
                    enemy.speed *
                    diff,

                    dirY *
                    enemy.speed *
                    diff

                );

            }

        }


        /* -------------------------
           FLANKER
        ------------------------- */

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

            const sideX =
                Math.cos(
                    sideAngle
                );

            const sideY =
                Math.sin(
                    sideAngle
                );

            if (
                dist >
                170
            ) {

                moveEntity(

                    enemy,

                    dirX *
                    enemy.speed *
                    diff,

                    dirY *
                    enemy.speed *
                    diff

                );

            } else {

                moveEntity(

                    enemy,

                    sideX *
                    enemy.speed *
                    diff,

                    sideY *
                    enemy.speed *
                    diff

                );

            }

        }


        /* -------------------------
           FLEE
        ------------------------- */

        else if (
            enemy.type ===
            "flee"
        ) {

            if (
                enemy.hp <=
                enemy.maxHp *
                0.6
            ) {

                moveEntity(

                    enemy,

                    -dirX *
                    enemy.speed *
                    diff,

                    -dirY *
                    enemy.speed *
                    diff

                );

            } else if (
                dist > 260
            ) {

                moveEntity(

                    enemy,

                    dirX *
                    enemy.speed *
                    diff,

                    dirY *
                    enemy.speed *
                    diff

                );

            }

        }


        /* -------------------------
           COVER AI
        ------------------------- */

        else if (
            enemy.type ===
            "cover"
        ) {

            if (
                enemy.coverX === null
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

                        player.x,

                        wall.x - 100,

                        wall.x +
                        wall.w +
                        100

                    );

                enemy.coverY =
                    clamp(

                        player.y,

                        wall.y - 100,

                        wall.y +
                        wall.h +
                        100

                    );

            }

            const coverDX =
                enemy.coverX -
                enemy.x;

            const coverDY =
                enemy.coverY -
                enemy.y;

            const coverDist =
                Math.hypot(
                    coverDX,
                    coverDY
                );

            if (
                coverDist > 30
            ) {

                moveEntity(

                    enemy,

                    coverDX /
                    coverDist *
                    enemy.speed,

                    coverDY /
                    coverDist *
                    enemy.speed

                );

            }

        }


        /* -------------------------
           FLYING
        ------------------------- */

        else if (
            flying
        ) {

            if (
                dist > 120
            ) {

                enemy.x +=
                    dirX *
                    enemy.speed *
                    diff;

                enemy.y +=
                    dirY *
                    enemy.speed *
                    diff;

            }

        }


        /* -------------------------
           SHOOTING
        ------------------------- */

        enemy.cooldown--;

        if (
            enemy.cooldown <= 0 &&
            dist < 750
        ) {

            enemy.cooldown =
                random(
                    90,
                    160
                ) /
                diff;

            const angle =
                Math.atan2(
                    player.y -
                    enemy.y,

                    player.x -
                    enemy.x
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

            playSound(
                180,
                0.035,
                "square",
                0.01
            );

        }


        /* -------------------------
           CONTACT
        ------------------------- */

        if (
            dist <
            player.radius +
            enemy.radius
        ) {

            damagePlayer(
                0.35 *
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

    const positions = [

        {
            x: 220,
            y: 220
        },

        {
            x:
                WORLD_WIDTH -
                220,

            y: 220
        },

        {
            x:
                WORLD_WIDTH -
                220,

            y:
                WORLD_HEIGHT -
                220
        },

        {
            x: 220,

            y:
                WORLD_HEIGHT -
                220
        }

    ];

    const pos =
        positions[
            Math.floor(
                Math.random() *
                positions.length
            )
        ];

    const health =
        170 +
        player.level *
        30;

    boss = {

        x:
            pos.x,

        y:
            pos.y,

        radius: 42,

        hp:
            health,

        maxHp:
            health,

        cooldown: 80,

        angle: 0

    };

    if (
        $("bossHud")
    ) {

        $("bossHud")
            .style.display =
            "block";

    }

    showAchievement(
        "BOSS INCOMING"
    );

    playSound(
        75,
        0.3,
        "sawtooth",
        0.07
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

    const dist =
        Math.hypot(
            dx,
            dy
        );

    boss.angle +=
        0.025;

    if (
        dist > 150
    ) {

        moveEntity(

            boss,

            dx /
            dist *
            0.55 *
            diff,

            dy /
            dist *
            0.55 *
            diff

        );

    }

    boss.cooldown--;

    if (
        boss.cooldown <= 0
    ) {

        boss.cooldown =
            65 /
            diff;

        const centerAngle =
            Math.atan2(
                dy,
                dx
            );

        const numberShots =
            boss.hp <
            boss.maxHp *
            0.5
                ? 10
                : 7;

        for (
            let i = 0;
            i < numberShots;
            i++
        ) {

            const angle =
                centerAngle +
                (
                    i -
                    (
                        numberShots -
                        1
                    ) /
                    2
                ) *
                0.12;

            bullets.push({

                x:
                    boss.x,

                y:
                    boss.y,

                vx:
                    Math.cos(angle) *
                    3.8,

                vy:
                    Math.sin(angle) *
                    3.8,

                enemy:
                    true,

                damage: 10,

                life: 220

            });

        }

        playSound(
            90,
            0.14,
            "sawtooth",
            0.04
        );

    }

    if (
        dist <
        player.radius +
        boss.radius
    ) {

        damagePlayer(
            0.9 *
            diff
        );

    }

    if (
        $("bossFill")
    ) {

        $("bossFill")
            .style.width =
            clamp(
                boss.hp /
                boss.maxHp *
                100,

                0,
                100

            ) +
            "%";

    }

}


/* =====================================================
   SHOOT
===================================================== */

function shoot() {

    if (
        !player ||
        player.cooldown >
        0 ||
        paused ||
        !gameRunning
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
            weapon.ammoMax;

        playSound(
            140,
            0.06,
            "square",
            0.02
        );

        return;

    }

    player.ammo--;

    player.cooldown =
        weapon.cooldown;

    stats.totalShots++;


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
        i < weapon.bullets;
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
                weapon.bulletSpeed,

            vy:
                Math.sin(angle) *
                weapon.bulletSpeed,

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

        weapon.bullets > 1
            ? 8
            : 4

    );

    playSound(

        player.weapon === 2
            ? 120
            : player.weapon === 3
                ? 680
                : 430,

        player.weapon === 2
            ? 0.08
            : 0.045,

        player.weapon === 2
            ? "sawtooth"
            : "square",

        0.025

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


        /* WALL / DOOR */

        if (
            bulletHitsObstacle(

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

            playSound(
                110,
                0.025,
                "square",
                0.008
            );

            continue;

        }


        /* OUTSIDE */

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


        /* ENEMY BULLET */

        if (
            bullet.enemy
        ) {

            if (

                distance(

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

            let hit =
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

                    distance(

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
                        6
                    );

                    hit = true;


                    if (
                        enemy.hp <= 0
                    ) {

                        killEnemy(
                            j
                        );

                    }

                    break;

                }

            }


            if (
                !hit &&
                boss
            ) {

                if (

                    distance(

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

                    hit = true;


                    if (
                        boss.hp <= 0
                    ) {

                        killBoss();

                    }

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


    if (
        Math.random() <
        0.25
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


    createParticles(
        enemy.x,
        enemy.y,
        15
    );


    enemies.splice(
        index,
        1
    );


    createEnemy();


    if (
        player.kills %
        12 ===
        0 &&
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
        250
    );

    achievements.bossSlayer =
        true;

    createParticles(
        boss.x,
        boss.y,
        60
    );

    boss = null;


    if (
        $("bossHud")
    ) {

        $("bossHud")
            .style.display =
            "none";

    }


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

    playSound(
        850,
        0.35,
        "triangle",
        0.07
    );

    updateAchievementsPage();

}


/* =====================================================
   PLAYER DAMAGE
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

    playSound(
        140,
        0.08,
        "sawtooth",
        0.02
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

            distance(

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

            createParticles(
                pickup.x,
                pickup.y,
                10
            );

            pickups.splice(
                i,
                1
            );

            playSound(
                620,
                0.06,
                "triangle",
                0.025
            );

        }

    }

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
        keys.w
    ) {

        dy--;

    }

    if (
        keys.s
    ) {

        dy++;

    }

    if (
        keys.a
    ) {

        dx--;

    }

    if (
        keys.d
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


        const oldX =
            player.x;

        const oldY =
            player.y;


        moveEntity(

            player,

            dx * speed,

            dy * speed

        );


        player.distance +=

            distance(

                oldX,
                oldY,

                player.x,
                player.y

            );


        stats.totalDistance +=

            distance(

                oldX,
                oldY,

                player.x,
                player.y

            );


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


    /* DASH */

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

        player.dashCooldown =
            70;

        player.energy -=
            25;

        player.invincible =
            25;

        keys.space =
            false;

        createParticles(
            player.x,
            player.y,
            25
        );

        playSound(
            800,
            0.09,
            "triangle",
            0.04
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


    /* SWITCHES */

    if (
        keys.e
    ) {

        useNearestSwitch();

        keys.e =
            false;

    }

}


/* =====================================================
   SWITCHES / DOORS
===================================================== */

function useNearestSwitch() {

    let nearest =
        null;

    let nearestDistance =
        Infinity;

    for (
        const sw of switches
    ) {

        const d =
            distance(

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
        doors.find(
            d =>
                d.id ===
                nearest.doorId
        );


    if (
        !door
    ) {

        return;

    }


    door.open =
        !door.open;

    nearest.active =
        door.open;

    player.switchesUsed++;


    playSound(
        door.open
            ? 580
            : 260,

        0.11,

        "square",

        0.04

    );


    if (
        player.switchesUsed >=
        6 &&
        !achievements.switchMaster
    ) {

        achievements.switchMaster =
            true;

        showAchievement(
            "SWITCH MASTER"
        );

        updateAchievementsPage();

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

        const a =
            Math.random() *
            Math.PI *
            2;

        const speed =
            Math.random() *
            4;

        particles.push({

            x,

            y,

            vx:
                Math.cos(a) *
                speed,

            vy:
                Math.sin(a) *
                speed,

            life:
                random(
                    15,
                    35
                ),

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
        "#081218";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    const grid =
        100;


    const startX =
        Math.floor(
            camera.x /
            grid
        ) *
        grid;


    const startY =
        Math.floor(
            camera.y /
            grid
        ) *
        grid;


    for (
        let x =
            startX;

        x <
            camera.x +
            W +
            grid;

        x +=
            grid

    ) {

        for (
            let y =
                startY;

            y <
                camera.y +
                H +
                grid;

            y +=
                grid

        ) {

            const sector =
                Math.abs(

                    Math.floor(
                        x / 500
                    ) +

                    Math.floor(
                        y / 500
                    )

                ) % 4;


            const colors = [

                "#111e24",

                "#122329",

                "#151e27",

                "#101b23"

            ];


            ctx.fillStyle =
                colors[sector];


            ctx.fillRect(

                x -
                camera.x,

                y -
                camera.y,

                grid,
                grid

            );

        }

    }


    /* GRID */

    ctx.strokeStyle =
        "rgba(120,190,220,0.06)";

    ctx.lineWidth =
        1;


    for (
        let x =
            -(camera.x % 100);

        x < W;

        x +=
            100

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

        y +=
            100

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
        "rgba(100,190,230,0.4)";

    ctx.lineWidth =
        4;


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

    for (
        const wall of walls
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

            x + 7,
            y + 8,

            wall.w,
            wall.h

        );


        ctx.fillStyle =
            "#1a2d37";

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
            "rgba(100,220,255,0.3)";


        if (
            wall.w >
            wall.h
        ) {

            ctx.fillRect(

                x + 9,

                y +
                wall.h / 2 -
                2,

                wall.w - 18,

                4

            );

        } else {

            ctx.fillRect(

                x +
                wall.w / 2 -
                2,

                y + 9,

                4,

                wall.h - 18

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
            camera.x;

        const y =
            door.y -
            camera.y;


        ctx.fillStyle =
            "#54372d";

        ctx.fillRect(

            x,
            y,

            door.w,
            door.h

        );


        ctx.strokeStyle =
            "#ffb16c";

        ctx.lineWidth =
            2;

        ctx.strokeRect(

            x,
            y,

            door.w,
            door.h

        );


        ctx.fillStyle =
            "#ffc875";


        if (
            door.w >
            door.h
        ) {

            ctx.fillRect(

                x + 9,

                y +
                door.h / 2 -
                2,

                door.w - 18,

                4

            );

        } else {

            ctx.fillRect(

                x +
                door.w / 2 -
                2,

                y + 9,

                4,

                door.h - 18

            );

        }

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
            camera.x;

        const y =
            sw.y -
            camera.y;


        ctx.fillStyle =

            sw.active
                ? "#6de2ff"
                : "#b47758";


        ctx.fillRect(

            x - 7,
            y - 7,

            14,
            14

        );


        ctx.strokeStyle =
            "#e8fbff";

        ctx.lineWidth =
            1;

        ctx.strokeRect(

            x - 7,
            y - 7,

            14,
            14

        );


        if (

            distance(
                player.x,
                player.y,
                sw.x,
                sw.y
            ) < 55

        ) {

            ctx.fillStyle =
                "#b9efff";

            ctx.font =
                "11px Arial";

            ctx.fillText(

                "E",

                x + 12,
                y - 10

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


        const size =
            8 +
            Math.sin(
                performance.now() /
                180
            ) *
            2;


        ctx.fillStyle =

            pickup.type ===
            "energy"

                ? "#65e1ff"

                : "#ffd15e";


        ctx.fillRect(

            x - size / 2,

            y - size / 2,

            size,

            size

        );

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


    const targetX =
        camera.x +
        mouse.x;

    const targetY =
        camera.y +
        mouse.y;


    const angle =
        Math.atan2(

            targetY -
            player.y,

            targetX -
            player.x

        );


    /* SHADOW */

    ctx.fillStyle =
        "rgba(0,0,0,0.4)";

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


    /* DASH GLOW */

    if (
        player.dashTimer >
        0
    ) {

        ctx.strokeStyle =
            "rgba(100,220,255,.6)";

        ctx.lineWidth =
            5;

        ctx.beginPath();

        ctx.arc(

            x,
            y,

            28,

            0,
            Math.PI * 2

        );

        ctx.stroke();

    }


    /* BODY */

    let color =
        skins[
            settings.skin
        ]
            ? skins[
                settings.skin
              ].color

            : "#71cfff";


    if (
        player.invincible >
        0
    ) {

        color =
            "#ffffff";

    }


    ctx.fillStyle =
        color;

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
        "#e9fbff";

    ctx.lineWidth =
        2;

    ctx.stroke();


    /* WEAPON */

    ctx.strokeStyle =
        "#eefcff";

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


    /* CORE */

    ctx.fillStyle =
        "#f6ffff";

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


        if (
            enemy.type ===
            "fast"
        ) {

            color =
                "#ff769d";

        }

        if (
            enemy.type ===
            "shield"
        ) {

            color =
                "#65d5ff";

        }

        if (
            enemy.type ===
            "flying"
        ) {

            color =
                "#73e8b8";

        }

        if (
            enemy.type ===
            "cover"
        ) {

            color =
                "#d49a6a";

        }

        if (
            enemy.type ===
            "flee"
        ) {

            color =
                "#ff8bb5";

        }

        if (
            enemy.type ===
            "flanker"
        ) {

            color =
                "#e391ff";

        }


        /* SHADOW */

        ctx.fillStyle =
            "rgba(0,0,0,.35)";

        ctx.beginPath();

        ctx.ellipse(

            x,
            y + 13,

            enemy.radius + 3,
            7,

            0,
            0,
            Math.PI * 2

        );

        ctx.fill();


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


        ctx.strokeStyle =
            "#f7eaff";

        ctx.lineWidth =
            2;

        ctx.stroke();


        /* SHIELD */

        if (
            enemy.shield >
            0
        ) {

            ctx.strokeStyle =
                "#8beaff";

            ctx.lineWidth =
                4;

            ctx.beginPath();

            ctx.arc(

                x,
                y,

                enemy.radius + 6,

                0,
                Math.PI * 2

            );

            ctx.stroke();

        }


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
        camera.x;

    const y =
        boss.y -
        camera.y;


    const pulse =
        Math.sin(
            performance.now() /
            180
        ) *
        5;


    ctx.fillStyle =
        "rgba(255,100,70,.16)";

    ctx.beginPath();

    ctx.arc(

        x,
        y,

        boss.radius +
        18 +
        pulse,

        0,
        Math.PI * 2

    );

    ctx.fill();


    ctx.fillStyle =
        "#ff7758";

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
        "#ffe4db";

    ctx.lineWidth =
        3;

    ctx.stroke();


    ctx.fillStyle =
        "#ffffff";

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

        const x =
            bullet.x -
            camera.x;

        const y =
            bullet.y -
            camera.y;


        ctx.fillStyle =

            bullet.enemy
                ? "#ff9b78"
                : bullet.color;


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
        const p of particles
    ) {

        ctx.globalAlpha =
            p.life /
            35;

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
        camera.x;

    const y =
        player.y -
        camera.y;


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
            0.8

        );


    gradient.addColorStop(

        0,
        "rgba(0,0,0,0)"

    );


    gradient.addColorStop(

        0.5,
        "rgba(0,0,0,.16)"

    );


    gradient.addColorStop(

        1,
        "rgba(0,0,0,.72)"

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
        $("healthBar")
    ) {

        $("healthBar")
            .style.width =
            health + "%";

    }


    if (
        $("energyBar")
    ) {

        $("energyBar")
            .style.width =
            energy + "%";

    }


    if (
        $("ammo")
    ) {

        $("ammo")
            .textContent =

            player.ammo +
            " / " +
            weapons[
                player.weapon
            ].ammoMax;

    }


    if (
        $("kills")
    ) {

        $("kills")
            .textContent =
            "KILLS: " +
            player.kills;

    }


    if (
        $("credits")
    ) {

        $("credits")
            .textContent =
            "CREDITS: " +
            player.credits;

    }


    if (
        $("zone")
    ) {

        $("zone")
            .textContent =

            "LEVEL " +
            player.level +
            " • " +
            weapons[
                player.weapon
            ].name;

    }


    if (
        $("objective")
    ) {

        if (
            boss
        ) {

            $("objective")
                .textContent =
                "DEFEAT THE ECHO WARDEN";

        } else if (
            player.kills ===
            0
        ) {

            $("objective")
                .textContent =
                "FIND THE SIGNAL";

        } else if (
            player.kills < 6
        ) {

            $("objective")
                .textContent =
                "EXPLORE THE SECTOR";

        } else {

            $("objective")
                .textContent =
                "FOLLOW THE ECHOES";

        }

    }


    if (
        $("levelText")
    ) {

        $("levelText")
            .textContent =

            "LEVEL " +
            player.level +
            "  •  " +
            weapons[
                player.weapon
            ].name;

    }


    if (
        $("xpFill")
    ) {

        $("xpFill")
            .style.width =

            clamp(

                player.xp /
                xpForNextLevel() *
                100,

                0,
                100

            ) +

            "%";

    }


    if (
        $("crosshair")
    ) {

        $("crosshair")
            .style.left =
            mouse.x +
            "px";

        $("crosshair")
            .style.top =
            mouse.y +
            "px";

    }

}


/* =====================================================
   ACHIEVEMENT POPUP
===================================================== */

let popupTimer = null;


function showAchievement(
    name
) {

    const box =
        $("achievement");

    const label =
        $("achievementName");


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
        popupTimer
    );


    popupTimer =
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
   ACHIEVEMENTS SCREEN
===================================================== */

function createAchievementsScreen() {

    if (
        $("achievementsScreen")
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

                <button
                    id="achievementBack"
                >
                    BACK
                </button>

            </div>


            <div class="achievementCards">

                <div
                    class="achievementCard"
                    id="achievementFirstEcho"
                >

                    <div class="achievementIcon">
                        ◆
                    </div>

                    <div>
                        <h3>
                            FIRST ECHO
                        </h3>

                        <p>
                            Versla je eerste vijand.
                        </p>
                    </div>

                    <b>
                        LOCKED
                    </b>

                </div>


                <div
                    class="achievementCard"
                    id="achievementTenEchoes"
                >

                    <div class="achievementIcon">
                        ◆
                    </div>

                    <div>
                        <h3>
                            TEN ECHOES
                        </h3>

                        <p>
                            Versla 10 vijanden.
                        </p>
                    </div>

                    <b>
                        LOCKED
                    </b>

                </div>


                <div
                    class="achievementCard"
                    id="achievementFirstSave"
                >

                    <div class="achievementIcon">
                        ⬡
                    </div>

                    <div>
                        <h3>
                            FIRST SAVE
                        </h3>

                        <p>
                            Sla een run op.
                        </p>
                    </div>

                    <b>
                        LOCKED
                    </b>

                </div>


                <div
                    class="achievementCard"
                    id="achievementExplorer"
                >

                    <div class="achievementIcon">
                        ✦
                    </div>

                    <div>
                        <h3>
                            EXPLORER
                        </h3>

                        <p>
                            Leg 5000 meter af.
                        </p>
                    </div>

                    <b>
                        LOCKED
                    </b>

                </div>


                <div
                    class="achievementCard"
                    id="achievementBoss"
                >

                    <div class="achievementIcon">
                        ◉
                    </div>

                    <div>
                        <h3>
                            BOSS SLAYER
                        </h3>

                        <p>
                            Versla een boss.
                        </p>
                    </div>

                    <b>
                        LOCKED
                    </b>

                </div>


                <div
                    class="achievementCard"
                    id="achievementLevel"
                >

                    <div class="achievementIcon">
                        ↑
                    </div>

                    <div>
                        <h3>
                            LEVEL FIVE
                        </h3>

                        <p>
                            Bereik level 5.
                        </p>
                    </div>

                    <b>
                        LOCKED
                    </b>

                </div>


                <div
                    class="achievementCard"
                    id="achievementArsenal"
                >

                    <div class="achievementIcon">
                        ✚
                    </div>

                    <div>
                        <h3>
                            ARSENAL
                        </h3>

                        <p>
                            Gebruik alle wapens.
                        </p>
                    </div>

                    <b>
                        LOCKED
                    </b>

                </div>


                <div
                    class="achievementCard"
                    id="achievementSwitchMaster"
                >

                    <div class="achievementIcon">
                        ⚡
                    </div>

                    <div>
                        <h3>
                            SWITCH MASTER
                        </h3>

                        <p>
                            Activeer alle schakelaars.
                        </p>
                    </div>

                    <b>
                        LOCKED
                    </b>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        screen
    );


    injectExtraCSS();


    $("achievementBack").onclick =
        closeAchievements;

}


function openAchievements() {

    createAchievementsScreen();

    $("achievementsScreen")
        .style.display =
        "flex";

    updateAchievementsPage();

}


function closeAchievements() {

    if (
        $("achievementsScreen")
    ) {

        $("achievementsScreen")
            .style.display =
            "none";

    }

}


function updateAchievementCard(
    id,
    unlocked
) {

    const card =
        $(id);

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
        "achievementSwitchMaster",
        achievements.switchMaster
    );

}


/* =====================================================
   EXTRA UI
===================================================== */

function createExtraUI() {

    if (
        !$("xpHud")
    ) {

        const xpHud =
            document.createElement(
                "div"
            );

        xpHud.id =
            "xpHud";

        xpHud.innerHTML = `

            <div id="levelText">
                LEVEL 1
            </div>

            <div class="xpBar">
                <div id="xpFill"></div>
            </div>

        `;

        document.body.appendChild(
            xpHud
        );

    }


    if (
        !$("bossHud")
    ) {

        const bossHud =
            document.createElement(
                "div"
            );

        bossHud.id =
            "bossHud";

        bossHud.style.display =
            "none";

        bossHud.innerHTML = `

            <div id="bossName">
                ECHO WARDEN
            </div>

            <div class="bossBar">
                <div id="bossFill"></div>
            </div>

        `;

        document.body.appendChild(
            bossHud
        );

    }


    if (
        !$("crosshair")
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


    addMenuExtraButtons();

    injectExtraCSS();

}


/* =====================================================
   EXTRA MENU BUTTONS
===================================================== */

function addMenuExtraButtons() {

    const box =
        document.querySelector(
            ".menuButtons"
        );


    if (
        !box
    ) {

        return;

    }


    if (
        !$("skinsButton")
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

        box.appendChild(
            button
        );

        button.onclick =
            openSkins;

    }


    if (
        !$("statsButton")
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

        box.appendChild(
            button
        );

        button.onclick =
            openStats;

    }


    if (
        !$("difficultyButton")
    ) {

        const button =
            document.createElement(
                "button"
            );

        button.id =
            "difficultyButton";

        button.className =
            "menuButton";

        button.textContent =
            "DIFFICULTY";

        box.appendChild(
            button
        );

        button.onclick =
            openDifficulty;

    }


    updateDifficultyButton();

}


/* =====================================================
   PANEL CSS
===================================================== */

function injectExtraCSS() {

    if (
        $("echoExtraCSS")
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );

    style.id =
        "echoExtraCSS";


    style.textContent = `

        #xpHud {
            position: fixed;
            z-index: 50;
            left: 50%;
            bottom: 18px;
            transform: translateX(-50%);
            width: 270px;
            pointer-events: none;
            text-align: center;
        }

        #levelText {
            color: #9fdfff;
            font-size: 10px;
            letter-spacing: 3px;
            margin-bottom: 5px;
        }

        .xpBar {
            width: 100%;
            height: 7px;
            background: #08131a;
            border: 1px solid #335366;
            border-radius: 5px;
            overflow: hidden;
        }

        #xpFill {
            width: 0%;
            height: 100%;
            background: #64d9ff;
            box-shadow: 0 0 12px #64d9ff;
        }

        #bossHud {
            position: fixed;
            z-index: 55;
            left: 50%;
            top: 74px;
            width: min(540px, 72vw);
            transform: translateX(-50%);
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
            background: #150d0c;
            border: 1px solid #734d40;
            border-radius: 6px;
            overflow: hidden;
        }

        #bossFill {
            width: 100%;
            height: 100%;
            background: #ff7658;
        }

        #crosshair {
            position: fixed;
            width: 18px;
            height: 18px;
            border: 1px solid rgba(180,235,255,.85);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: 100;
            pointer-events: none;
        }

        #achievementsScreen {
            position: fixed;
            inset: 0;
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            background:
                radial-gradient(
                    circle at center,
                    #1a3847 0%,
                    #0a151d 55%,
                    #020508 100%
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
                    #142b38,
                    #081219
                );
            border: 1px solid #4e7788;
            border-radius: 20px;
            box-shadow:
                0 30px 100px rgba(0,0,0,.8);
        }

        .achievementsTop {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 28px;
        }

        .achievementLogo {
            color: #78d5ff;
            font-size: 11px;
            letter-spacing: 5px;
            margin-bottom: 7px;
        }

        .achievementsTop h2 {
            margin: 0;
            color: white;
            font-size: 38px;
            letter-spacing: 4px;
        }

        .achievementsTop p {
            margin-top: 8px;
            color: #8199a8;
        }

        #achievementBack {
            padding: 10px 18px;
            color: white;
            background: #172c38;
            border: 1px solid #4d6e7d;
            border-radius: 8px;
            cursor: pointer;
        }

        #achievementBack:hover {
            background: #234759;
            border-color: #73d6ff;
        }

        .achievementCards {
            display: grid;
            grid-template-columns:
                repeat(2, minmax(0, 1fr));
            gap: 14px;
        }

        .achievementCard {
            display: grid;
            grid-template-columns:
                50px 1fr auto;
            align-items: center;
            gap: 14px;
            min-height: 100px;
            padding: 16px;
            background: #0d1b23;
            border: 1px solid #294452;
            border-radius: 13px;
        }

        .achievementCard.unlocked {
            background: #14303d;
            border-color: #62cdf7;
            box-shadow:
                0 0 22px rgba(70,190,240,.08);
        }

        .achievementIcon {
            width: 46px;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #536a76;
            background: #081219;
            border: 1px solid #334c58;
            border-radius: 10px;
            font-size: 21px;
        }

        .achievementCard.unlocked .achievementIcon {
            color: #7addff;
            border-color: #58aac8;
        }

        .achievementCard h3 {
            margin-bottom: 5px;
            color: #e5f4fa;
            font-size: 14px;
            letter-spacing: 1px;
        }

        .achievementCard p {
            color: #778e9b;
            font-size: 12px;
        }

        .achievementCard b {
            color: #5d717b;
            font-size: 9px;
            letter-spacing: 2px;
        }

        .achievementCard.unlocked b {
            color: #70d5ff;
        }

        .echoPanel {
            position: fixed;
            inset: 0;
            z-index: 1100;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(2,7,11,.96);
        }

        .echoPanelBox {
            width: min(760px, 95vw);
            max-height: 90vh;
            overflow-y: auto;
            padding: 30px;
            background:
                linear-gradient(
                    145deg,
                    #142a38,
                    #08131b
                );
            border: 1px solid #4c7181;
            border-radius: 18px;
            box-shadow:
                0 30px 100px rgba(0,0,0,.8);
        }

        .echoPanelBox h2 {
            margin-bottom: 8px;
            color: white;
            font-size: 34px;
            letter-spacing: 4px;
        }

        .echoPanelBox p {
            color: #819aa8;
            margin-bottom: 18px;
        }

        .echoGrid {
            display: grid;
            grid-template-columns:
                repeat(3, 1fr);
            gap: 12px;
            margin: 18px 0;
        }

        .echoChoice {
            padding: 18px;
            text-align: center;
            color: white;
            background: #0d1b23;
            border: 1px solid #2b4755;
            border-radius: 12px;
            cursor: pointer;
        }

        .echoChoice.selected {
            border-color: #70d5ff;
            background: #173241;
        }

        .echoButton {
            padding: 10px 18px;
            color: white;
            background: #172d3a;
            border: 1px solid #4b6b7a;
            border-radius: 8px;
            cursor: pointer;
        }

        .skinGrid {
            display: grid;
            grid-template-columns:
                repeat(3, 1fr);
            gap: 12px;
            margin: 20px 0;
        }

        .skinChoice {
            padding: 15px;
            text-align: center;
            color: white;
            background: #0d1b23;
            border: 1px solid #2b4755;
            border-radius: 12px;
            cursor: pointer;
        }

        .skinChoice.selected {
            border-color: #6fd7ff;
        }

        .skinPreview {
            width: 55px;
            height: 55px;
            margin: 0 auto 10px;
            border-radius: 50%;
        }

        .statsList {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 18px 0;
        }

        .statsRow {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            color: #d8ebf3;
            background: #0d1b23;
            border: 1px solid #294452;
            border-radius: 8px;
        }

        @media(max-width:700px) {

            .achievementCards {
                grid-template-columns: 1fr;
            }

            .achievementsWindow {
                padding: 20px;
            }

            .achievementsTop {
                flex-direction: column;
            }

            .echoGrid,
            .skinGrid,
            .statsList {
                grid-template-columns: 1fr 1fr;
            }

        }

    `;

    document.head.appendChild(
        style
    );

}


/* =====================================================
   SKINS
===================================================== */

function openSkins() {

    removePanel();

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "echoPanel";

    panel.className =
        "echoPanel";


    panel.innerHTML = `

        <div class="echoPanelBox">

            <h2>
                SKINS
            </h2>

            <p>
                Kies het uiterlijk van je speler.
            </p>

            <div class="skinGrid">

                ${skins.map(
                    (skin, index) => `

                    <div
                        class="skinChoice
                        ${
                            settings.skin === index
                                ? "selected"
                                : ""
                        }"
                        data-skin="${index}"
                    >

                        <div
                            class="skinPreview"
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
                class="echoButton"
                id="closeEchoPanel"
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
            ".skinChoice"
        )
        .forEach(
            choice => {

                choice.onclick =
                    function () {

                        settings.skin =
                            Number(
                                choice.dataset.skin
                            );

                        localStorage.setItem(
                            "echobound_skin",
                            settings.skin
                        );

                        openSkins();

                    };

            }
        );


    $("closeEchoPanel").onclick =
        removePanel;

}


/* =====================================================
   STATS PANEL
===================================================== */

function openStats() {

    removePanel();


    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "echoPanel";

    panel.className =
        "echoPanel";


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
            "BOSSES",
            stats.totalBosses
        ],

        [
            "SHOTS FIRED",
            stats.totalShots
        ],

        [
            "TOTAL DAMAGE",
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
            "CURRENT DIFFICULTY",
            settings.difficulty.toUpperCase()
        ]

    ];


    panel.innerHTML = `

        <div class="echoPanelBox">

            <h2>
                STATS
            </h2>

            <p>
                Je totale voortgang.
            </p>

            <div class="statsList">

                ${rows.map(
                    row => `

                    <div class="statsRow">

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
                class="echoButton"
                id="closeEchoPanel"
            >
                BACK
            </button>

        </div>

    `;


    document.body.appendChild(
        panel
    );


    $("closeEchoPanel").onclick =
        removePanel;

}


/* =====================================================
   DIFFICULTY PANEL
===================================================== */

function openDifficulty() {

    removePanel();


    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "echoPanel";

    panel.className =
        "echoPanel";


    const values = [

        [
            "easy",
            "Minder schade en rustigere vijanden."
        ],

        [
            "normal",
            "Normale uitdaging."
        ],

        [
            "hard",
            "Snellere en sterkere vijanden."
        ]

    ];


    panel.innerHTML = `

        <div class="echoPanelBox">

            <h2>
                DIFFICULTY
            </h2>

            <p>
                Kies de moeilijkheid.
            </p>

            <div class="echoGrid">

                ${values.map(
                    item => `

                    <div
                        class="
                            echoChoice
                            ${
                                settings.difficulty === item[0]
                                    ? "selected"
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
                class="echoButton"
                id="closeEchoPanel"
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
            ".echoChoice"
        )
        .forEach(
            choice => {

                choice.onclick =
                    function () {

                        settings.difficulty =
                            choice.dataset
                                .difficulty;

                        localStorage.setItem(
                            "echobound_difficulty",
                            settings.difficulty
                        );

                        updateDifficultyButton();

                        openDifficulty();

                    };

            }
        );


    $("closeEchoPanel").onclick =
        removePanel;

}


function updateDifficultyButton() {

    const button =
        $("difficultyButton");

    if (
        button
    ) {

        button.textContent =
            "DIFFICULTY: " +
            settings.difficulty
                .toUpperCase();

    }

}


function removePanel() {

    const panel =
        $("echoPanel");

    if (
        panel
    ) {

        panel.remove();

    }

}


/* =====================================================
   SAVE / LOAD
===================================================== */

const SAVE_KEY =
    "echobound_complete_save";


function saveGame() {

    if (
        !player
    ) {

        alert(
            "Start eerst een run."
        );

        return;

    }


    const saveData = {

        player,

        achievements,

        stats,

        settings,

        doors

    };


    localStorage.setItem(

        SAVE_KEY,

        JSON.stringify(
            saveData
        )

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


    playSound(
        540,
        0.08,
        "triangle",
        0.04
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
            "Er is nog geen opgeslagen game."
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


        achievements = {

            ...achievements,

            ...(data.achievements || {})

        };


        stats = {

            ...stats,

            ...(data.stats || {})

        };


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
            player.radius ||
            18;

        player.speed =
            player.speed ||
            3.5;

        player.maxHealth =
            player.maxHealth ||
            100;

        player.maxEnergy =
            player.maxEnergy ||
            100;

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

        player.level =
            player.level ||
            1;

        player.weapon =
            player.weapon ||
            0;

        player.xp =
            player.xp ||
            0;

        player.cooldown =
            0;

        player.dashCooldown =
            0;

        player.dashTimer =
            0;

        player.invincible =
            0;


        enemies = [];

        bullets = [];

        particles = [];

        pickups = [];

        boss = null;


        if (
            collidesWithObstacle(
                player.x,
                player.y,
                player.radius
            )
        ) {

            player.x =
                WORLD_WIDTH /
                2;

            player.y =
                WORLD_HEIGHT /
                2;

        }


        for (
            let i = 0;
            i < 16;
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


        $("menu").style.display =
            "none";


        $("pause").style.display =
            "none";


        $("map").style.display =
            "none";


        closeAchievements();

        removePanel();


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
   NEW GAME
===================================================== */

function startNewGame() {

    initAudio();

    startMusic();


    stats.runs++;


    createPlayer();


    enemies = [];

    bullets = [];

    particles = [];

    pickups = [];


    boss = null;


    resetWorldObjects();


    for (
        let i = 0;
        i < 16;
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


    $("menu").style.display =
        "none";

    $("pause").style.display =
        "none";

    $("map").style.display =
        "none";


    closeAchievements();

    removePanel();


    if (
        $("bossHud")
    ) {

        $("bossHud")
            .style.display =
            "none";

    }


    updateHUD();

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

                $("menu").style.display =
                    "flex";

            }

        },

        150

    );

}


/* =====================================================
   MAP
===================================================== */

function drawMap() {

    if (
        !mapCanvas ||
        !player
    ) {

        return;

    }


    const rect =
        mapCanvas.getBoundingClientRect();


    mapCanvas.width =
        Math.max(
            300,
            Math.floor(
                rect.width
            )
        );


    mapCanvas.height =
        Math.max(
            250,
            Math.floor(
                rect.height
            )
        );


    mapCtx.fillStyle =
        "#061019";


    mapCtx.fillRect(

        0,
        0,

        mapCanvas.width,
        mapCanvas.height

    );


    const sx =
        mapCanvas.width /
        WORLD_WIDTH;


    const sy =
        mapCanvas.height /
        WORLD_HEIGHT;


    mapCtx.strokeStyle =
        "rgba(100,180,220,.12)";

    mapCtx.lineWidth =
        1;


    for (
        let x = 0;
        x <= WORLD_WIDTH;
        x += 200
    ) {

        mapCtx.beginPath();

        mapCtx.moveTo(
            x * sx,
            0
        );

        mapCtx.lineTo(
            x * sx,
            mapCanvas.height
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
            y * sy
        );

        mapCtx.lineTo(
            mapCanvas.width,
            y * sy
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

            wall.x * sx,

            wall.y * sy,

            wall.w * sx,

            wall.h * sy

        );

    }


    /* DOORS */

    for (
        const door of doors
    ) {

        if (
            door.open
        ) {

            continue;

        }


        mapCtx.fillStyle =
            "#9b6648";


        mapCtx.fillRect(

            door.x * sx,

            door.y * sy,

            door.w * sx,

            door.h * sy

        );

    }


    /* SWITCHES */

    mapCtx.fillStyle =
        "#75dfff";


    for (
        const sw of switches
    ) {

        mapCtx.beginPath();

        mapCtx.arc(

            sw.x * sx,

            sw.y * sy,

            3,

            0,
            Math.PI * 2

        );

        mapCtx.fill();

    }


    /* ENEMIES */

    mapCtx.fillStyle =
        "#bd6dff";


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


    /* BOSS */

    if (
        boss
    ) {

        mapCtx.fillStyle =
            "#ff7758";


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


    /* PLAYER */

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
   INPUT
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

            keys.space =
                true;

        }


        /* WEAPONS */

        if (
            key === "1"
        ) {

            switchWeapon(
                0
            );

        }

        if (
            key === "2"
        ) {

            switchWeapon(
                1
            );

        }

        if (
            key === "3"
        ) {

            switchWeapon(
                2
            );

        }

        if (
            key === "4"
        ) {

            switchWeapon(
                3
            );

        }


        /* MAP */

        if (
            key === "m" &&
            gameRunning &&
            !paused
        ) {

            const map =
                $("map");


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


        /* ESC */

        if (
            key ===
            "escape"
        ) {

            if (
                $("achievementsScreen") &&
                $("achievementsScreen")
                    .style.display ===
                    "flex"
            ) {

                closeAchievements();

                return;

            }


            if (
                $("echoPanel")
            ) {

                removePanel();

                return;

            }


            if (
                $("map").style.display ===
                "flex"
            ) {

                $("map").style.display =
                    "none";

                return;

            }


            if (
                gameRunning
            ) {

                paused =
                    !paused;


                $("pause")
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

        const key =
            event.key.toLowerCase();


        keys[key] =
            false;


        if (
            event.code ===
            "Space"
        ) {

            keys.space =
                false;

        }

    }
);


/* =====================================================
   SWITCH WEAPON
===================================================== */

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


    player.ammo =
        Math.min(

            player.ammo,

            weapons[index]
                .ammoMax

        );


    playSound(
        300 +
        index *
        100,

        0.05,

        "square",

        0.025
    );


}


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

            mouse.down =
                true;

            initAudio();
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

            mouse.down =
                false;

        }

    }
);


/* =====================================================
   MENU BUTTONS
===================================================== */

if (
    $("newGame")
) {

    $("newGame").onclick =
        startNewGame;

}


if (
    $("loadGame")
) {

    $("loadGame").onclick =
        loadGame;

}


if (
    $("achievementsButton")
) {

    $("achievementsButton")
        .onclick =
        openAchievements;

}


if (
    $("controlsButton")
) {

    $("controlsButton")
        .onclick =
        function () {

            alert(

                "BESTURING\n\n" +

                "W A S D\n" +
                "Bewegen\n\n" +

                "MUIS\n" +
                "Richten\n\n" +

                "LINKERMUISKNOP\n" +
                "Schieten\n\n" +

                "1 - 4\n" +
                "Wapens wisselen\n\n" +

                "SPACE\n" +
                "Dash\n\n" +

                "E\n" +
                "Schakelaars / deuren\n\n" +

                "M\n" +
                "Kaart\n\n" +

                "ESC\n" +
                "Pauze"

            );

        };

}


if (
    $("resume")
) {

    $("resume").onclick =
        function () {

            paused =
                false;

            $("pause")
                .style.display =
                "none";

        };

}


if (
    $("save")
) {

    $("save").onclick =
        saveGame;

}


if (
    $("quit")
) {

    $("quit").onclick =
        function () {

            saveGame();

            gameRunning =
                false;

            paused =
                false;

            mouse.down =
                false;

            $("pause")
                .style.display =
                "none";

            $("menu")
                .style.display =
                "flex";

        };

}


if (
    $("closeMap")
) {

    $("closeMap").onclick =
        function () {

            $("map")
                .style.display =
                "none";

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
   GAME LOOP
===================================================== */

function gameLoop(
    time
) {

    lastTime =
        time;


    update();

    draw();


    requestAnimationFrame(
        gameLoop
    );

}


/* =====================================================
   STARTUP
===================================================== */

resetWorldObjects();

createExtraUI();

createAchievementsScreen();

updateDifficultyButton();

updateHUD();

requestAnimationFrame(
    gameLoop
);
