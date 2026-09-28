(() => {
"use strict";

/* =========================================================
   ECHOBOUND — THE LOST SIGNAL
   COMPLETE APP.JS
   ========================================================= */

if (window.__ECHOboundLoaded) return;
window.__ECHOboundLoaded = true;

/* =========================================================
   DOM
   ========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas ? mapCanvas.getContext("2d") : null;

const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const pauseScreen = document.getElementById("pause");
const achievementPopup = document.getElementById("achievement");
const achievementName = document.getElementById("achievementName");
const mapScreen = document.getElementById("map");

const newGameButton = document.getElementById("newGame");
const loadGameButton = document.getElementById("loadGame");
const achievementsButton = document.getElementById("achievementsButton");
const controlsButton = document.getElementById("controlsButton");

const resumeButton = document.getElementById("resume");
const saveButton = document.getElementById("save");
const quitButton = document.getElementById("quit");

const closeMapButton = document.getElementById("closeMap");

const healthBar = document.getElementById("healthBar");
const energyBar = document.getElementById("energyBar");
const objectiveText = document.getElementById("objective");
const zoneText = document.getElementById("zone");
const killsText = document.getElementById("kills");
const creditsText = document.getElementById("credits");
const ammoText = document.getElementById("ammo");

/* =========================================================
   CANVAS
   ========================================================= */

let W = window.innerWidth;
let H = window.innerHeight;

function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;

    if (canvas) {
        canvas.width = W;
        canvas.height = H;
    }

    if (mapCanvas) {
        mapCanvas.width = 700;
        mapCanvas.height = 500;
    }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* =========================================================
   WORLD
   ========================================================= */

const WORLD = {
    width: 3200,
    height: 2600
};

const CAMERA = {
    x: 0,
    y: 0,
    shake: 0
};

/* =========================================================
   GAME STATE
   ========================================================= */

let gameRunning = false;
let paused = false;
let gameOver = false;
let victory = false;

let currentSlot = 1;

let kills = 0;
let credits = 0;
let wave = 1;
let distanceTravelled = 0;

let elapsed = 0;
let lastTime = performance.now();

let currentSector = 0;

let bullets = [];
let enemyBullets = [];
let enemies = [];
let particles = [];
let pickups = [];
let doors = [];
let chests = [];
let terminals = [];
let beacons = [];
let props = [];
let floatingTexts = [];

let keys = {};
let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

/* =========================================================
   UTILS
   ========================================================= */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
}

function dist(ax, ay, bx, by) {
    return Math.hypot(bx - ax, by - ay);
}

function angleBetween(ax, ay, bx, by) {
    return Math.atan2(by - ay, bx - ax);
}

function rectContains(rect, x, y) {
    return (
        x >= rect.x &&
        x <= rect.x + rect.w &&
        y >= rect.y &&
        y <= rect.y + rect.h
    );
}

function circleRectCollision(cx, cy, radius, rect) {
    const nearestX = clamp(cx, rect.x, rect.x + rect.w);
    const nearestY = clamp(cy, rect.y, rect.y + rect.h);

    const dx = cx - nearestX;
    const dy = cy - nearestY;

    return dx * dx + dy * dy < radius * radius;
}

function formatNumber(n) {
    return Math.floor(n).toLocaleString("nl-NL");
}

/* =========================================================
   AUDIO
   ========================================================= */

let audioContext = null;

function initAudio() {
    if (audioContext) return;

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        audioContext = null;
    }
}

function sound(type) {
    if (!audioContext) return;

    try {
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        const now = audioContext.currentTime;

        if (type === "shoot") {
            osc.type = "square";
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.07);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.start(now);
            osc.stop(now + 0.08);
        }

        if (type === "hit") {
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            osc.start(now);
            osc.stop(now + 0.1);
        }

        if (type === "pickup") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.18);

            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.start(now);
            osc.stop(now + 0.2);
        }

        if (type === "dash") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.start(now);
            osc.stop(now + 0.15);
        }

        if (type === "door") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);

            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

            osc.start(now);
            osc.stop(now + 0.25);
        }
    } catch (e) {
        /* Audio is optional. */
    }
}

/* =========================================================
   WALLS
   ========================================================= */

/*
   BELANGRIJK:
   Alle muren hieronder worden:
   1. gebruikt voor collision
   2. zichtbaar getekend
   3. voorzien van schaduw
   4. voorzien van een duidelijke rand

   Daardoor zijn er geen "onzichtbare muren".
*/

const walls = [

    /* WEST SECTOR */

    {
        x: 180,
        y: 260,
        w: 720,
        h: 70,
        name: "West Wall A"
    },

    {
        x: 180,
        y: 260,
        w: 70,
        h: 650,
        name: "West Wall B"
    },

    {
        x: 830,
        y: 260,
        w: 70,
        h: 650,
        name: "West Wall C"
    },

    {
        x: 180,
        y: 840,
        w: 720,
        h: 70,
        name: "West Wall D"
    },

    {
        x: 1050,
        y: 180,
        w: 70,
        h: 520,
        name: "West Center Wall"
    },

    {
        x: 1050,
        y: 700,
        w: 650,
        h: 70,
        name: "West Center Bottom"
    },

    /* NORTH CENTER */

    {
        x: 1250,
        y: 180,
        w: 800,
        h: 70,
        name: "North Center"
    },

    {
        x: 1250,
        y: 180,
        w: 70,
        h: 480,
        name: "North Center Left"
    },

    {
        x: 1980,
        y: 180,
        w: 70,
        h: 480,
        name: "North Center Right"
    },

    /* EAST SECTOR */

    {
        x: 2200,
        y: 300,
        w: 720,
        h: 70,
        name: "East Top"
    },

    {
        x: 2200,
        y: 300,
        w: 70,
        h: 700,
        name: "East Left"
    },

    {
        x: 2850,
        y: 300,
        w: 70,
        h: 700,
        name: "East Right"
    },

    {
        x: 2200,
        y: 930,
        w: 720,
        h: 70,
        name: "East Bottom"
    },

    /* CENTER */

    {
        x: 1200,
        y: 950,
        w: 650,
        h: 65,
        name: "Center Upper"
    },

    {
        x: 1200,
        y: 950,
        w: 65,
        h: 550,
        name: "Center Left"
    },

    {
        x: 1785,
        y: 950,
        w: 65,
        h: 550,
        name: "Center Right"
    },

    /* SOUTH WEST */

    {
        x: 180,
        y: 1200,
        w: 700,
        h: 70,
        name: "South West Top"
    },

    {
        x: 180,
        y: 1200,
        w: 70,
        h: 700,
        name: "South West Left"
    },

    {
        x: 810,
        y: 1200,
        w: 70,
        h: 700,
        name: "South West Right"
    },

    {
        x: 180,
        y: 1830,
        w: 700,
        h: 70,
        name: "South West Bottom"
    },

    /* SOUTH */

    {
        x: 1050,
        y: 1700,
        w: 750,
        h: 70,
        name: "South Center Top"
    },

    {
        x: 1050,
        y: 1700,
        w: 70,
        h: 600,
        name: "South Center Left"
    },

    {
        x: 1730,
        y: 1700,
        w: 70,
        h: 600,
        name: "South Center Right"
    },

    {
        x: 1050,
        y: 2230,
        w: 750,
        h: 70,
        name: "South Center Bottom"
    },

    /* SOUTH EAST */

    {
        x: 1950,
        y: 1350,
        w: 800,
        h: 70,
        name: "South East Top"
    },

    {
        x: 1950,
        y: 1350,
        w: 70,
        h: 650,
        name: "South East Left"
    },

    {
        x: 2680,
        y: 1350,
        w: 70,
        h: 650,
        name: "South East Right"
    },

    {
        x: 1950,
        y: 1930,
        w: 800,
        h: 70,
        name: "South East Bottom"
    }
];

/* =========================================================
   DOORS
   ========================================================= */

doors = [

    {
        x: 505,
        y: 260,
        w: 70,
        h: 70,
        vertical: false,
        open: true,
        locked: false
    },

    {
        x: 830,
        y: 540,
        w: 70,
        h: 100,
        vertical: true,
        open: true,
        locked: false
    },

    {
        x: 1450,
        y: 180,
        w: 100,
        h: 70,
        vertical: false,
        open: true,
        locked: false
    },

    {
        x: 2200,
        y: 580,
        w: 70,
        h: 110,
        vertical: true,
        open: true,
        locked: false
    },

    {
        x: 510,
        y: 1200,
        w: 90,
        h: 70,
        vertical: false,
        open: true,
        locked: false
    },

    {
        x: 1380,
        y: 1700,
        w: 100,
        h: 70,
        vertical: false,
        open: true,
        locked: false
    },

    {
        x: 1950,
        y: 1600,
        w: 70,
        h: 110,
        vertical: true,
        open: true,
        locked: false
    },

    {
        x: 2680,
        y: 1600,
        w: 70,
        h: 110,
        vertical: true,
        open: true,
        locked: false
    }
];

/* =========================================================
   PLAYER
   ========================================================= */

const player = {
    x: 600,
    y: 550,

    radius: 18,

    speed: 230,

    maxHealth: 100,
    health: 100,

    maxEnergy: 100,
    energy: 100,

    angle: 0,

    dashTimer: 0,
    dashCooldown: 0,

    invulnerable: 0,

    shootCooldown: 0,

    weaponIndex: 0,

    credits: 0,

    armor: 0,

    inventory: {
        medkits: 2,
        energyCells: 3
    },

    upgrades: {
        speed: 0,
        health: 0,
        energy: 0,
        damage: 0
    }
};

/* =========================================================
   WEAPONS
   ========================================================= */

const weapons = [

    {
        name: "PULSE",
        damage: 20,
        speed: 850,
        cooldown: 0.18,
        spread: 0.02,
        pellets: 1,
        energy: 0,
        color: "#70e8ff"
    },

    {
        name: "BURST",
        damage: 14,
        speed: 900,
        cooldown: 0.09,
        spread: 0.05,
        pellets: 1,
        energy: 1,
        color: "#9f8cff"
    },

    {
        name: "HEAVY",
        damage: 48,
        speed: 700,
        cooldown: 0.48,
        spread: 0.025,
        pellets: 1,
        energy: 2,
        color: "#ffb84d"
    },

    {
        name: "SCATTER",
        damage: 11,
        speed: 650,
        cooldown: 0.55,
        spread: 0.24,
        pellets: 7,
        energy: 3,
        color: "#ffdf78"
    },

    {
        name: "RAIL",
        damage: 85,
        speed: 1500,
        cooldown: 0.9,
        spread: 0,
        pellets: 1,
        energy: 8,
        color: "#ff6cf7"
    },

    {
        name: "PLASMA",
        damage: 35,
        speed: 620,
        cooldown: 0.35,
        spread: 0.03,
        pellets: 1,
        energy: 5,
        color: "#73ff9b"
    }
];

/* =========================================================
   ENEMY TYPES
   ========================================================= */

const enemyTypes = {

    scout: {
        health: 40,
        speed: 80,
        radius: 16,
        damage: 8,
        cooldown: 2.0,
        color: "#ff6875",
        credits: 10
    },

    hunter: {
        health: 70,
        speed: 105,
        radius: 18,
        damage: 12,
        cooldown: 1.5,
        color: "#ff9c5a",
        credits: 18
    },

    guardian: {
        health: 170,
        speed: 45,
        radius: 27,
        damage: 20,
        cooldown: 2.4,
        color: "#b56cff",
        credits: 40
    },

    sniper: {
        health: 60,
        speed: 35,
        radius: 15,
        damage: 30,
        cooldown: 3.2,
        color: "#5eb5ff",
        credits: 35
    },

    brute: {
        health: 280,
        speed: 30,
        radius: 34,
        damage: 30,
        cooldown: 3.5,
        color: "#ff5d39",
        credits: 65
    },

    drone: {
        health: 50,
        speed: 130,
        radius: 13,
        damage: 10,
        cooldown: 1.2,
        color: "#6fffd2",
        credits: 25
    }
};

/* =========================================================
   ENEMY CLASS
   ========================================================= */

function createEnemy(type, x, y) {

    const data = enemyTypes[type];

    return {
        type,
        x,
        y,

        radius: data.radius,

        health: data.health,
        maxHealth: data.health,

        speed: data.speed,

        damage: data.damage,

        cooldown: rand(0.5, data.cooldown),

        angle: 0,

        hitFlash: 0,

        wanderAngle: rand(0, Math.PI * 2),

        wanderTimer: rand(1, 4),

        strafeDirection: Math.random() > 0.5 ? 1 : -1,

        dead: false,

        color: data.color,

        credits: data.credits
    };
}

/* =========================================================
   PICKUPS
   ========================================================= */

function createPickup(type, x, y) {

    return {
        type,
        x,
        y,
        radius: 12,
        pulse: rand(0, Math.PI * 2),
        life: 30
    };
}

/* =========================================================
   PROPS
   ========================================================= */

function createProps() {

    props = [];

    const locations = [

        [360, 430, "crate"],
        [710, 420, "crate"],
        [370, 710, "barrel"],
        [690, 700, "terminal"],

        [1350, 400, "crate"],
        [1740, 420, "barrel"],
        [1850, 520, "crate"],

        [2420, 450, "crate"],
        [2720, 470, "barrel"],
        [2450, 800, "crate"],
        [2750, 800, "terminal"],

        [350, 1400, "crate"],
        [680, 1500, "barrel"],
        [420, 1700, "crate"],

        [1280, 1850, "crate"],
        [1580, 2000, "barrel"],
        [1450, 2150, "crate"],

        [2150, 1500, "crate"],
        [2450, 1550, "barrel"],
        [2200, 1800, "crate"],
        [2500, 1800, "terminal"]
    ];

    for (const item of locations) {

        props.push({
            x: item[0],
            y: item[1],
            type: item[2],
            w: item[2] === "barrel" ? 34 : 50,
            h: item[2] === "barrel" ? 34 : 42,
            rotation: rand(-0.08, 0.08)
        });
    }
}

/* =========================================================
   CHESTS
   ========================================================= */

function createChests() {

    chests = [

        {
            x: 520,
            y: 500,
            opened: false
        },

        {
            x: 1500,
            y: 450,
            opened: false
        },

        {
            x: 2550,
            y: 600,
            opened: false
        },

        {
            x: 500,
            y: 1500,
            opened: false
        },

        {
            x: 1450,
            y: 2000,
            opened: false
        },

        {
            x: 2350,
            y: 1650,
            opened: false
        }
    ];
}

/* =========================================================
   TERMINALS
   ========================================================= */

function createTerminals() {

    terminals = [

        {
            x: 700,
            y: 700,
            active: false,
            used: false
        },

        {
            x: 2750,
            y: 800,
            active: false,
            used: false
        },

        {
            x: 2500,
            y: 1800,
            active: false,
            used: false
        }
    ];
}

/* =========================================================
   BEACONS
   ========================================================= */

function createBeacons() {

    beacons = [

        {
            x: 600,
            y: 550,
            active: true
        },

        {
            x: 1550,
            y: 500,
            active: false
        },

        {
            x: 2550,
            y: 650,
            active: false
        },

        {
            x: 500,
            y: 1550,
            active: false
        },

        {
            x: 1450,
            y: 2050,
            active: false
        },

        {
            x: 2350,
            y: 1650,
            active: false
        }
    ];
}

/* =========================================================
   PARTICLES
   ========================================================= */

function spawnParticle(x, y, options = {}) {

    particles.push({

        x,
        y,

        vx: options.vx ?? rand(-50, 50),
        vy: options.vy ?? rand(-50, 50),

        life: options.life ?? rand(0.2, 0.6),
        maxLife: options.life ?? rand(0.2, 0.6),

        size: options.size ?? rand(2, 5),

        color: options.color ?? "#ffffff",

        glow: options.glow ?? false
    });
}

function explosion(x, y, color = "#70e8ff", amount = 20) {

    for (let i = 0; i < amount; i++) {

        const angle = rand(0, Math.PI * 2);
        const speed = rand(50, 220);

        spawnParticle(x, y, {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: rand(0.2, 0.7),
            size: rand(2, 6),
            color,
            glow: true
        });
    }
}

/* =========================================================
   FLOATING TEXT
   ========================================================= */

function floatingText(text, x, y, color = "#ffffff") {

    floatingTexts.push({
        text,
        x,
        y,
        life: 1,
        color
    });
}

/* =========================================================
   COLLISION
   ========================================================= */

function getCollisionWalls() {

    const result = [];

    for (const wall of walls) {
        result.push(wall);
    }

    for (const door of doors) {

        if (!door.open) {

            result.push({
                x: door.x,
                y: door.y,
                w: door.w,
                h: door.h
            });
        }
    }

    return result;
}

function collidesWithWalls(x, y, radius) {

    const collisionWalls = getCollisionWalls();

    for (const wall of collisionWalls) {

        if (circleRectCollision(x, y, radius, wall)) {
            return true;
        }
    }

    return false;
}

function moveWithCollision(entity, dx, dy) {

    const oldX = entity.x;
    const oldY = entity.y;

    entity.x += dx;

    if (
        collidesWithWalls(
            entity.x,
            entity.y,
            entity.radius
        )
    ) {
        entity.x = oldX;
    }

    entity.y += dy;

    if (
        collidesWithWalls(
            entity.x,
            entity.y,
            entity.radius
        )
    ) {
        entity.y = oldY;
    }

    entity.x = clamp(
        entity.x,
        entity.radius,
        WORLD.width - entity.radius
    );

    entity.y = clamp(
        entity.y,
        entity.radius,
        WORLD.height - entity.radius
    );
}

/* =========================================================
   LINE OF SIGHT
   ========================================================= */

function lineIntersectsRect(x1, y1, x2, y2, rect) {

    const steps = Math.ceil(
        dist(x1, y1, x2, y2) / 10
    );

    for (let i = 0; i <= steps; i++) {

        const t = i / steps;

        const x = lerp(x1, x2, t);
        const y = lerp(y1, y2, t);

        if (rectContains(rect, x, y)) {
            return true;
        }
    }

    return false;
}

function hasLineOfSight(x1, y1, x2, y2) {

    for (const wall of getCollisionWalls()) {

        if (
            lineIntersectsRect(
                x1,
                y1,
                x2,
                y2,
                wall
            )
        ) {
            return false;
        }
    }

    return true;
}

/* =========================================================
   SHOOTING
   ========================================================= */

function getCurrentWeapon() {
    return weapons[player.weaponIndex];
}

function shoot() {

    if (!gameRunning || paused || gameOver) {
        return;
    }

    const weapon = getCurrentWeapon();

    if (player.shootCooldown > 0) {
        return;
    }

    if (player.energy < weapon.energy) {
        return;
    }

    player.energy -= weapon.energy;

    player.shootCooldown = weapon.cooldown;

    for (let i = 0; i < weapon.pellets; i++) {

        const spread =
            (Math.random() - 0.5) *
            weapon.spread;

        const angle =
            player.angle +
            spread;

        bullets.push({

            x: player.x +
                Math.cos(angle) * 24,

            y: player.y +
                Math.sin(angle) * 24,

            vx: Math.cos(angle) * weapon.speed,

            vy: Math.sin(angle) * weapon.speed,

            damage:
                weapon.damage +
                player.upgrades.damage * 5,

            life: 2,

            color: weapon.color,

            size:
                weapon.name === "RAIL"
                    ? 5
                    : 3
        });
    }

    CAMERA.shake =
        Math.max(
            CAMERA.shake,
            weapon.name === "RAIL" ? 8 : 3
        );

    explosion(
        player.x + Math.cos(player.angle) * 25,
        player.y + Math.sin(player.angle) * 25,
        weapon.color,
        weapon.name === "RAIL" ? 10 : 4
    );

    sound("shoot");
}

/* =========================================================
   DAMAGE PLAYER
   ========================================================= */

function damagePlayer(amount) {

    if (player.invulnerable > 0) {
        return;
    }

    let finalDamage = amount;

    if (player.armor > 0) {

        const blocked =
            Math.min(
                player.armor,
                Math.ceil(amount * 0.35)
            );

        player.armor -= blocked;
        finalDamage -= blocked;
    }

    player.health -= finalDamage;

    player.invulnerable = 0.35;

    CAMERA.shake = 12;

    floatingText(
        "-" + Math.ceil(finalDamage),
        player.x,
        player.y - 30,
        "#ff7070"
    );

    if (player.health <= 0) {

        player.health = 0;

        endGame();
    }
}

/* =========================================================
   ENEMY SHOOT
   ========================================================= */

function enemyShoot(enemy) {

    const angle =
        angleBetween(
            enemy.x,
            enemy.y,
            player.x,
            player.y
        );

    enemyBullets.push({

        x: enemy.x +
            Math.cos(angle) * enemy.radius,

        y: enemy.y +
            Math.sin(angle) * enemy.radius,

        vx: Math.cos(angle) * 280,

        vy: Math.sin(angle) * 280,

        damage: enemy.damage,

        life: 5,

        radius: 5,

        color: enemy.color
    });

    explosion(
        enemy.x,
        enemy.y,
        enemy.color,
        3
    );
}

/* =========================================================
   SPAWN ENEMIES
   ========================================================= */

function spawnWave() {

    const amount =
        5 +
        wave * 2;

    enemies = [];

    const possibleTypes = [
        "scout",
        "hunter"
    ];

    if (wave >= 2) {
        possibleTypes.push("guardian");
    }

    if (wave >= 3) {
        possibleTypes.push("sniper");
    }

    if (wave >= 4) {
        possibleTypes.push("drone");
    }

    if (wave >= 5) {
        possibleTypes.push("brute");
    }

    for (let i = 0; i < amount; i++) {

        let x;
        let y;

        let tries = 0;

        do {

            x = rand(100, WORLD.width - 100);
            y = rand(100, WORLD.height - 100);

            tries++;

        } while (
            (
                dist(
                    x,
                    y,
                    player.x,
                    player.y
                ) < 500 ||
                collidesWithWalls(x, y, 35)
            ) &&
            tries < 100
        );

        const type =
            possibleTypes[
                randInt(
                    0,
                    possibleTypes.length - 1
                )
            ];

        enemies.push(
            createEnemy(
                type,
                x,
                y
            )
        );
    }
}

/* =========================================================
   ENEMY AI
   ========================================================= */

function updateEnemy(enemy, dt) {

    if (enemy.dead) return;

    enemy.cooldown -= dt;
    enemy.hitFlash -= dt;
    enemy.wanderTimer -= dt;

    const distanceToPlayer =
        dist(
            enemy.x,
            enemy.y,
            player.x,
            player.y
        );

    const angleToPlayer =
        angleBetween(
            enemy.x,
            enemy.y,
            player.x,
            player.y
        );

    enemy.angle = angleToPlayer;

    let moveX = 0;
    let moveY = 0;

    if (
        enemy.type === "scout" ||
        enemy.type === "hunter" ||
        enemy.type === "drone"
    ) {

        if (distanceToPlayer > 240) {

            moveX =
                Math.cos(angleToPlayer);

            moveY =
                Math.sin(angleToPlayer);

        } else {

            moveX =
                Math.cos(
                    angleToPlayer +
                    Math.PI / 2 *
                    enemy.strafeDirection
                );

            moveY =
                Math.sin(
                    angleToPlayer +
                    Math.PI / 2 *
                    enemy.strafeDirection
                );
        }
    }

    if (enemy.type === "guardian") {

        if (distanceToPlayer > 320) {

            moveX =
                Math.cos(angleToPlayer);

            moveY =
                Math.sin(angleToPlayer);
        }
    }

    if (enemy.type === "sniper") {

        if (distanceToPlayer < 550) {

            moveX =
                -Math.cos(angleToPlayer);

            moveY =
                -Math.sin(angleToPlayer);
        }
    }

    if (enemy.type === "brute") {

        if (distanceToPlayer > 90) {

            moveX =
                Math.cos(angleToPlayer);

            moveY =
                Math.sin(angleToPlayer);
        }
    }

    if (
        enemy.wanderTimer <= 0 &&
        distanceToPlayer > 700
    ) {

        enemy.wanderAngle =
            rand(
                0,
                Math.PI * 2
            );

        enemy.wanderTimer =
            rand(1, 3);
    }

    if (
        distanceToPlayer > 700
    ) {

        moveX =
            Math.cos(enemy.wanderAngle);

        moveY =
            Math.sin(enemy.wanderAngle);
    }

    const length =
        Math.hypot(moveX, moveY);

    if (length > 0) {

        moveX /= length;
        moveY /= length;

        moveWithCollision(
            enemy,
            moveX *
            enemy.speed *
            dt,

            moveY *
            enemy.speed *
            dt
        );
    }

    if (
        distanceToPlayer < 850 &&
        hasLineOfSight(
            enemy.x,
            enemy.y,
            player.x,
            player.y
        )
    ) {

        if (enemy.cooldown <= 0) {

            enemyShoot(enemy);

            enemy.cooldown =
                enemyTypes[
                    enemy.type
                ].cooldown *
                rand(0.75, 1.25);
        }
    }
}

/* =========================================================
   UPDATE BULLETS
   ========================================================= */

function updateBullets(dt) {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = bullets[i];

        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;

        bullet.life -= dt;

        let remove = false;

        for (const wall of getCollisionWalls()) {

            if (
                rectContains(
                    wall,
                    bullet.x,
                    bullet.y
                )
            ) {

                explosion(
                    bullet.x,
                    bullet.y,
                    bullet.color,
                    5
                );

                remove = true;
                break;
            }
        }

        if (!remove) {

            for (const enemy of enemies) {

                if (enemy.dead) continue;

                if (
                    dist(
                        bullet.x,
                        bullet.y,
                        enemy.x,
                        enemy.y
                    ) <
                    enemy.radius +
                    bullet.size
                ) {

                    enemy.health -= bullet.damage;

                    enemy.hitFlash = 0.12;

                    explosion(
                        bullet.x,
                        bullet.y,
                        bullet.color,
                        7
                    );

                    sound("hit");

                    if (enemy.health <= 0) {

                        killEnemy(enemy);
                    }

                    remove = true;

                    break;
                }
            }
        }

        if (
            bullet.life <= 0 ||
            bullet.x < 0 ||
            bullet.y < 0 ||
            bullet.x > WORLD.width ||
            bullet.y > WORLD.height
        ) {

            remove = true;
        }

        if (remove) {
            bullets.splice(i, 1);
        }
    }
}

/* =========================================================
   UPDATE ENEMY BULLETS
   ========================================================= */

function updateEnemyBullets(dt) {

    for (
        let i = enemyBullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            enemyBullets[i];

        bullet.x +=
            bullet.vx * dt;

        bullet.y +=
            bullet.vy * dt;

        bullet.life -= dt;

        let remove = false;

        for (const wall of getCollisionWalls()) {

            if (
                rectContains(
                    wall,
                    bullet.x,
                    bullet.y
                )
            ) {

                explosion(
                    bullet.x,
                    bullet.y,
                    bullet.color,
                    5
                );

                remove = true;
                break;
            }
        }

        if (!remove) {

            if (
                dist(
                    bullet.x,
                    bullet.y,
                    player.x,
                    player.y
                ) <
                player.radius +
                bullet.radius
            ) {

                damagePlayer(
                    bullet.damage
                );

                remove = true;
            }
        }

        if (bullet.life <= 0) {
            remove = true;
        }

        if (remove) {
            enemyBullets.splice(i, 1);
        }
    }
}

/* =========================================================
   KILL ENEMY
   ========================================================= */

function killEnemy(enemy) {

    if (enemy.dead) return;

    enemy.dead = true;

    kills++;

    credits += enemy.credits;

    player.credits += enemy.credits;

    explosion(
        enemy.x,
        enemy.y,
        enemy.color,
        25
    );

    floatingText(
        "+" + enemy.credits,
        enemy.x,
        enemy.y - 25,
        "#ffd76b"
    );

    if (Math.random() < 0.18) {

        pickups.push(
            createPickup(
                "health",
                enemy.x,
                enemy.y
            )
        );
    }

    if (Math.random() < 0.18) {

        pickups.push(
            createPickup(
                "energy",
                enemy.x,
                enemy.y
            )
        );
    }

    if (Math.random() < 0.08) {

        pickups.push(
            createPickup(
                "credit",
                enemy.x,
                enemy.y
            )
        );
    }

    checkAchievements();
}

/* =========================================================
   PICKUPS
   ========================================================= */

function updatePickups(dt) {

    for (
        let i = pickups.length - 1;
        i >= 0;
        i--
    ) {

        const pickup =
            pickups[i];

        pickup.life -= dt;
        pickup.pulse += dt * 4;

        if (
            dist(
                pickup.x,
                pickup.y,
                player.x,
                player.y
            ) <
            pickup.radius +
            player.radius
        ) {

            if (pickup.type === "health") {

                player.health =
                    Math.min(
                        player.maxHealth,
                        player.health + 25
                    );

                floatingText(
                    "+25 HP",
                    player.x,
                    player.y - 25,
                    "#6cff8d"
                );
            }

            if (pickup.type === "energy") {

                player.energy =
                    Math.min(
                        player.maxEnergy,
                        player.energy + 30
                    );

                floatingText(
                    "+30 ENERGY",
                    player.x,
                    player.y - 25,
                    "#6ce8ff"
                );
            }

            if (pickup.type === "credit") {

                credits += 50;
                player.credits += 50;

                floatingText(
                    "+50",
                    player.x,
                    player.y - 25,
                    "#ffd86c"
                );
            }

            sound("pickup");

            pickups.splice(i, 1);

            continue;
        }

        if (pickup.life <= 0) {

            pickups.splice(i, 1);
        }
    }
}

/* =========================================================
   CHESTS
   ========================================================= */

function updateChests() {

    for (const chest of chests) {

        if (chest.opened) continue;

        if (
            dist(
                chest.x,
                chest.y,
                player.x,
                player.y
            ) < 55
        ) {

            chest.opened = true;

            const reward =
                randInt(20, 80);

            credits += reward;
            player.credits += reward;

            player.energy =
                Math.min(
                    player.maxEnergy,
                    player.energy + 20
                );

            explosion(
                chest.x,
                chest.y,
                "#ffd45f",
                15
            );

            floatingText(
                "+" + reward + " CREDITS",
                chest.x,
                chest.y - 30,
                "#ffd45f"
            );

            sound("pickup");
        }
    }
}

/* =========================================================
   TERMINALS
   ========================================================= */

function updateTerminals() {

    for (const terminal of terminals) {

        if (terminal.used) continue;

        if (
            dist(
                terminal.x,
                terminal.y,
                player.x,
                player.y
            ) < 70
        ) {

            terminal.active = true;

            if (keys["KeyE"]) {

                terminal.used = true;

                credits += 100;
                player.credits += 100;

                floatingText(
                    "+100 CREDITS",
                    terminal.x,
                    terminal.y - 30,
                    "#66eaff"
                );

                explosion(
                    terminal.x,
                    terminal.y,
                    "#66eaff",
                    20
                );

                sound("pickup");

                keys["KeyE"] = false;
            }
        }
    }
}

/* =========================================================
   DOORS
   ========================================================= */

function updateDoors() {

    for (const door of doors) {

        if (
            dist(
                door.x + door.w / 2,
                door.y + door.h / 2,
                player.x,
                player.y
            ) < 85
        ) {

            if (keys["KeyE"]) {

                if (!door.locked) {

                    door.open =
                        !door.open;

                    sound("door");

                    keys["KeyE"] = false;
                }
            }
        }
    }
}

/* =========================================================
   PLAYER UPDATE
   ========================================================= */

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;

    if (
        keys["KeyW"] ||
        keys["ArrowUp"]
    ) {
        dy -= 1;
    }

    if (
        keys["KeyS"] ||
        keys["ArrowDown"]
    ) {
        dy += 1;
    }

    if (
        keys["KeyA"] ||
        keys["ArrowLeft"]
    ) {
        dx -= 1;
    }

    if (
        keys["KeyD"] ||
        keys["ArrowRight"]
    ) {
        dx += 1;
    }

    const length =
        Math.hypot(dx, dy);

    if (length > 0) {

        dx /= length;
        dy /= length;

        const speed =
            player.speed +
            player.upgrades.speed * 20;

        moveWithCollision(
            player,
            dx * speed * dt,
            dy * speed * dt
        );

        distanceTravelled +=
            speed * dt;
    }

    if (
        keys["Space"] &&
        player.dashCooldown <= 0 &&
        player.energy >= 20 &&
        length > 0
    ) {

        player.energy -= 20;

        player.dashCooldown = 1.2;
        player.invulnerable = 0.35;

        moveWithCollision(
            player,
            dx * 170,
            dy * 170
        );

        explosion(
            player.x,
            player.y,
            "#70e8ff",
            18
        );

        sound("dash");

        keys["Space"] = false;
    }

    player.dashCooldown -= dt;
    player.invulnerable -= dt;
    player.shootCooldown -= dt;

    player.energy =
        Math.min(
            player.maxEnergy +
            player.upgrades.energy * 15,
            player.energy + dt * 8
        );

    player.angle =
        Math.atan2(
            mouse.y - H / 2,
            mouse.x - W / 2
        );

    if (mouse.down) {
        shoot();
    }
}

/* =========================================================
   CAMERA
   ========================================================= */

function updateCamera() {

    const targetX =
        player.x -
        W / 2;

    const targetY =
        player.y -
        H / 2;

    CAMERA.x =
        lerp(
            CAMERA.x,
            targetX,
            0.1
        );

    CAMERA.y =
        lerp(
            CAMERA.y,
            targetY,
            0.1
        );

    CAMERA.x =
        clamp(
            CAMERA.x,
            0,
            Math.max(0, WORLD.width - W)
        );

    CAMERA.y =
        clamp(
            CAMERA.y,
            0,
            Math.max(0, WORLD.height - H)
        );

    if (CAMERA.shake > 0) {

        CAMERA.x +=
            rand(
                -CAMERA.shake,
                CAMERA.shake
            );

        CAMERA.y +=
            rand(
                -CAMERA.shake,
                CAMERA.shake
            );

        CAMERA.shake *= 0.88;

        if (CAMERA.shake < 0.1) {
            CAMERA.shake = 0;
        }
    }
}

/* =========================================================
   WEATHER
   ========================================================= */

const rain = [];

for (let i = 0; i < 180; i++) {

    rain.push({
        x: rand(0, W),
        y: rand(0, H),
        speed: rand(500, 850),
        length: rand(8, 20),
        alpha: rand(0.1, 0.35)
    });
}

function updateRain(dt) {

    for (const drop of rain) {

        drop.x -= drop.speed * 0.08 * dt;
        drop.y += drop.speed * dt;

        if (
            drop.y > H + 30 ||
            drop.x < -30
        ) {

            drop.x =
                rand(
                    0,
                    W + 100
                );

            drop.y =
                rand(
                    -H,
                    -20
                );
        }
    }
}

/* =========================================================
   PARTICLE UPDATE
   ========================================================= */

function updateParticles(dt) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p = particles[i];

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        p.vx *= 0.97;
        p.vy *= 0.97;

        p.life -= dt;

        if (p.life <= 0) {

            particles.splice(i, 1);
        }
    }
}

/* =========================================================
   FLOATING TEXT UPDATE
   ========================================================= */

function updateFloatingTexts(dt) {

    for (
        let i = floatingTexts.length - 1;
        i >= 0;
        i--
    ) {

        const text =
            floatingTexts[i];

        text.y -= 30 * dt;
        text.life -= dt;

        if (text.life <= 0) {

            floatingTexts.splice(i, 1);
        }
    }
}

/* =========================================================
   SECTOR
   ========================================================= */

function updateSector() {

    let newSector = 0;

    if (
        player.x < 1000 &&
        player.y < 1000
    ) {
        newSector = 0;
    }
    else if (
        player.x >= 1000 &&
        player.x < 2100 &&
        player.y < 900
    ) {
        newSector = 1;
    }
    else if (
        player.x >= 2100 &&
        player.y < 1100
    ) {
        newSector = 2;
    }
    else if (
        player.x < 1000 &&
        player.y >= 1100
    ) {
        newSector = 3;
    }
    else if (
        player.x >= 1000 &&
        player.x < 1900 &&
        player.y >= 1500
    ) {
        newSector = 4;
    }
    else {
        newSector = 5;
    }

    currentSector = newSector;
}

/* =========================================================
   SECTOR NAMES
   ========================================================= */

const sectorNames = [
    "WEST OUTPOST",
    "CENTRAL ARCHIVE",
    "EAST COMPLEX",
    "OVERGROWN DISTRICT",
    "LOWER FACILITY",
    "SIGNAL CHAMBER"
];

/* =========================================================
   OBJECTIVE
   ========================================================= */

function updateObjective() {

    if (kills < 5) {

        objectiveText.textContent =
            "SURVIVE THE ECHOES";

    } else if (currentSector < 5) {

        objectiveText.textContent =
            "SEARCH THE NEXT SECTOR";

    } else {

        objectiveText.textContent =
            "FIND THE LOST SIGNAL";
    }
}

/* =========================================================
   HUD
   ========================================================= */

function updateHUD() {

    if (!healthBar) return;

    const maxHealth =
        player.maxHealth +
        player.upgrades.health * 20;

    const maxEnergy =
        player.maxEnergy +
        player.upgrades.energy * 15;

    healthBar.style.width =
        clamp(
            player.health / maxHealth * 100,
            0,
            100
        ) + "%";

    energyBar.style.width =
        clamp(
            player.energy / maxEnergy * 100,
            0,
            100
        ) + "%";

    if (zoneText) {

        zoneText.textContent =
            sectorNames[currentSector] ||
            "UNKNOWN SECTOR";
    }

    if (killsText) {

        killsText.textContent =
            "KILLS: " +
            kills;
    }

    if (creditsText) {

        creditsText.textContent =
            "CREDITS: " +
            formatNumber(credits);
    }

    if (ammoText) {

        const weapon =
            getCurrentWeapon();

        ammoText.textContent =
            weapon.name +
            " / ∞";
    }
}

/* =========================================================
   BACKGROUND
   ========================================================= */

function drawBackground() {

    ctx.fillStyle = "#070b10";
    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    const gridSize = 80;

    const startX =
        -(
            CAMERA.x %
            gridSize
        );

    const startY =
        -(
            CAMERA.y %
            gridSize
        );

    ctx.strokeStyle =
        "rgba(90,120,145,0.08)";

    ctx.lineWidth = 1;

    for (
        let x = startX;
        x < W;
        x += gridSize
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
        let y = startY;
        y < H;
        y += gridSize
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
}

/* =========================================================
   WORLD FLOOR
   ========================================================= */

function drawWorldFloor() {

    ctx.save();

    ctx.translate(
        -CAMERA.x,
        -CAMERA.y
    );

    ctx.fillStyle = "#111920";

    ctx.fillRect(
        0,
        0,
        WORLD.width,
        WORLD.height
    );

    /* Large floor sections */

    ctx.fillStyle =
        "rgba(40,70,82,0.25)";

    for (
        let x = 0;
        x < WORLD.width;
        x += 320
    ) {

        for (
            let y = 0;
            y < WORLD.height;
            y += 320
        ) {

            ctx.fillRect(
                x + 4,
                y + 4,
                312,
                312
            );
        }
    }

    /* Floor lines */

    ctx.strokeStyle =
        "rgba(130,170,190,0.07)";

    ctx.lineWidth = 2;

    for (
        let x = 0;
        x <= WORLD.width;
        x += 80
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            WORLD.height
        );

        ctx.stroke();
    }

    for (
        let y = 0;
        y <= WORLD.height;
        y += 80
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            WORLD.width,
            y
        );

        ctx.stroke();
    }

    ctx.restore();
}

/* =========================================================
   WALL DRAWING
   ========================================================= */

function drawWall(wall) {

    const x =
        wall.x -
        CAMERA.x;

    const y =
        wall.y -
        CAMERA.y;

    /*
       SCHADUW
    */

    ctx.fillStyle =
        "rgba(0,0,0,0.55)";

    ctx.fillRect(
        x + 9,
        y + 11,
        wall.w,
        wall.h
    );

    /*
       BUITENSTE RAND
    */

    ctx.fillStyle =
        "#25333d";

    ctx.fillRect(
        x,
        y,
        wall.w,
        wall.h
    );

    /*
       LICHTE BOVENKANT
    */

    ctx.fillStyle =
        "#516875";

    ctx.fillRect(
        x,
        y,
        wall.w,
        Math.min(
            7,
            wall.h
        )
    );

    /*
       DONKERE ONDERKANT
    */

    ctx.fillStyle =
        "#111920";

    ctx.fillRect(
        x,
        y + wall.h - 8,
        wall.w,
        8
    );

    /*
       RAND
    */

    ctx.strokeStyle =
        "#78919d";

    ctx.lineWidth = 2;

    ctx.strokeRect(
        x + 1,
        y + 1,
        wall.w - 2,
        wall.h - 2
    );

    /*
       PANELEN
    */

    if (wall.w > 100) {

        ctx.strokeStyle =
            "rgba(160,190,200,0.18)";

        ctx.lineWidth = 1;

        for (
            let px = x + 30;
            px < x + wall.w - 20;
            px += 55
        ) {

            ctx.beginPath();

            ctx.moveTo(
                px,
                y + 9
            );

            ctx.lineTo(
                px,
                y + wall.h - 9
            );

            ctx.stroke();
        }
    }

    /*
       HELDERE HOEKEN
    */

    ctx.fillStyle =
        "#9ab0b9";

    ctx.fillRect(
        x,
        y,
        4,
        wall.h
    );

    ctx.fillRect(
        x,
        y,
        wall.w,
        4
    );
}

/* =========================================================
   DRAW ALL WALLS
   ========================================================= */

function drawWalls() {

    for (const wall of walls) {

        drawWall(wall);
    }

    drawDoors();
}

/* =========================================================
   DOOR DRAWING
   ========================================================= */

function drawDoors() {

    for (const door of doors) {

        const x =
            door.x -
            CAMERA.x;

        const y =
            door.y -
            CAMERA.y;

        if (door.open) {

            /*
              OPEN DOOR:
              de deuropening blijft duidelijk zichtbaar
            */

            ctx.strokeStyle =
                "#55d9ff";

            ctx.lineWidth = 4;

            ctx.strokeRect(
                x + 5,
                y + 5,
                door.w - 10,
                door.h - 10
            );

            ctx.fillStyle =
                "rgba(70,220,255,0.08)";

            ctx.fillRect(
                x,
                y,
                door.w,
                door.h
            );

        } else {

            /*
              GESLOTEN DEUR
            */

            ctx.fillStyle =
                "#334a55";

            ctx.fillRect(
                x,
                y,
                door.w,
                door.h
            );

            ctx.fillStyle =
                "#6a8b97";

            if (door.vertical) {

                ctx.fillRect(
                    x + 7,
                    y,
                    8,
                    door.h
                );

                ctx.fillRect(
                    x + door.w - 15,
                    y,
                    8,
                    door.h
                );

            } else {

                ctx.fillRect(
                    x,
                    y + 7,
                    door.w,
                    8
                );

                ctx.fillRect(
                    x,
                    y + door.h - 15,
                    door.w,
                    8
                );
            }

            ctx.strokeStyle =
                "#a1c4cf";

            ctx.lineWidth = 2;

            ctx.strokeRect(
                x,
                y,
                door.w,
                door.h
            );

            /*
              DEUR LICHT
            */

            const gradient =
                ctx.createLinearGradient(
                    x,
                    y,
                    x + door.w,
                    y + door.h
                );

            gradient.addColorStop(
                0,
                "rgba(90,220,255,0.12)"
            );

            gradient.addColorStop(
                0.5,
                "rgba(255,255,255,0.03)"
            );

            gradient.addColorStop(
                1,
                "rgba(90,220,255,0.12)"
            );

            ctx.fillStyle =
                gradient;

            ctx.fillRect(
                x,
                y,
                door.w,
                door.h
            );
        }
    }
}

/* =========================================================
   PROPS DRAWING
   ========================================================= */

function drawProps() {

    for (const prop of props) {

        const x =
            prop.x -
            CAMERA.x;

        const y =
            prop.y -
            CAMERA.y;

        ctx.save();

        ctx.translate(
            x,
            y
        );

        ctx.rotate(
            prop.rotation
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.4)";

        ctx.fillRect(
            -prop.w / 2 + 5,
            -prop.h / 2 + 7,
            prop.w,
            prop.h
        );

        if (prop.type === "crate") {

            ctx.fillStyle =
                "#785d42";

            ctx.fillRect(
                -prop.w / 2,
                -prop.h / 2,
                prop.w,
                prop.h
            );

            ctx.strokeStyle =
                "#b39168";

            ctx.lineWidth = 3;

            ctx.strokeRect(
                -prop.w / 2,
                -prop.h / 2,
                prop.w,
                prop.h
            );

            ctx.beginPath();

            ctx.moveTo(
                -prop.w / 2,
                -prop.h / 2
            );

            ctx.lineTo(
                prop.w / 2,
                prop.h / 2
            );

            ctx.moveTo(
                prop.w / 2,
                -prop.h / 2
            );

            ctx.lineTo(
                -prop.w / 2,
                prop.h / 2
            );

            ctx.stroke();
        }

        if (prop.type === "barrel") {

            ctx.fillStyle =
                "#374c57";

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                prop.w / 2,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.strokeStyle =
                "#8da5ae";

            ctx.lineWidth = 3;

            ctx.stroke();

            ctx.strokeStyle =
                "#1d2930";

            ctx.lineWidth = 5;

            ctx.beginPath();

            ctx.moveTo(
                -prop.w / 2,
                -5
            );

            ctx.lineTo(
                prop.w / 2,
                -5
            );

            ctx.moveTo(
                -prop.w / 2,
                6
            );

            ctx.lineTo(
                prop.w / 2,
                6
            );

            ctx.stroke();
        }

        if (prop.type === "terminal") {

            ctx.fillStyle =
                "#1b2c35";

            ctx.fillRect(
                -25,
                -30,
                50,
                60
            );

            ctx.strokeStyle =
                "#70ddff";

            ctx.lineWidth = 3;

            ctx.strokeRect(
                -25,
                -30,
                50,
                60
            );

            ctx.fillStyle =
                "#55dfff";

            ctx.fillRect(
                -17,
                -18,
                34,
                18
            );

            ctx.fillStyle =
                "#89f7ff";

            ctx.fillRect(
                -14,
                -14,
                28,
                4
            );
        }

        ctx.restore();
    }
}

/* =========================================================
   CHEST DRAWING
   ========================================================= */

function drawChests() {

    for (const chest of chests) {

        const x =
            chest.x -
            CAMERA.x;

        const y =
            chest.y -
            CAMERA.y;

        ctx.save();

        ctx.translate(
            x,
            y
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.45)";

        ctx.fillRect(
            -24,
            13,
            48,
            12
        );

        ctx.fillStyle =
            chest.opened
                ? "#3e4d53"
                : "#8a6334";

        ctx.fillRect(
            -24,
            -10,
            48,
            30
        );

        ctx.strokeStyle =
            chest.opened
                ? "#6f8a91"
                : "#d2a15a";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            -24,
            -10,
            48,
            30
        );

        if (!chest.opened) {

            ctx.fillStyle =
                "#ffd36c";

            ctx.fillRect(
                -4,
                0,
                8,
                12
            );

        } else {

            ctx.strokeStyle =
                "#8da5ad";

            ctx.beginPath();

            ctx.moveTo(
                -22,
                -10
            );

            ctx.lineTo(
                -14,
                -30
            );

            ctx.lineTo(
                20,
                -22
            );

            ctx.stroke();
        }

        ctx.restore();
    }
}

/* =========================================================
   BEACON DRAWING
   ========================================================= */

function drawBeacons() {

    for (const beacon of beacons) {

        const x =
            beacon.x -
            CAMERA.x;

        const y =
            beacon.y -
            CAMERA.y;

        ctx.save();

        const pulse =
            Math.sin(
                elapsed * 3
            ) * 4;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            30 + pulse,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            beacon.active
                ? "rgba(90,220,255,0.08)"
                : "rgba(130,140,150,0.04)";

        ctx.fill();

        ctx.fillStyle =
            "#1b2930";

        ctx.fillRect(
            x - 12,
            y - 12,
            24,
            30
        );

        ctx.strokeStyle =
            beacon.active
                ? "#70e8ff"
                : "#5b6b73";

        ctx.lineWidth = 3;

        ctx.strokeRect(
            x - 12,
            y - 12,
            24,
            30
        );

        ctx.beginPath();

        ctx.arc(
            x,
            y - 16,
            6,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            beacon.active
                ? "#70e8ff"
                : "#58666d";

        ctx.fill();

        ctx.restore();
    }
}

/* =========================================================
   ENEMY DRAWING
   ========================================================= */

function drawEnemy(enemy) {

    if (enemy.dead) return;

    const x =
        enemy.x -
        CAMERA.x;

    const y =
        enemy.y -
        CAMERA.y;

    ctx.save();

    ctx.translate(
        x,
        y
    );

    ctx.rotate(
        enemy.angle
    );

    /*
       Shadow
    */

    ctx.fillStyle =
        "rgba(0,0,0,0.45)";

    ctx.beginPath();

    ctx.ellipse(
        4,
        7,
        enemy.radius * 1.1,
        enemy.radius * 0.55,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
       Body
    */

    ctx.fillStyle =
        enemy.hitFlash > 0
            ? "#ffffff"
            : enemy.color;

    if (
        enemy.type === "brute"
    ) {

        ctx.fillRect(
            -enemy.radius,
            -enemy.radius,
            enemy.radius * 2,
            enemy.radius * 2
        );

    } else {

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    /*
       Outer armor
    */

    ctx.strokeStyle =
        "#dce9ed";

    ctx.globalAlpha = 0.45;

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        enemy.radius,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.globalAlpha = 1;

    /*
       Direction
    */

    ctx.fillStyle =
        "#ffffff";

    ctx.fillRect(
        5,
        -3,
        enemy.radius + 7,
        6
    );

    /*
       Core
    */

    ctx.fillStyle =
        "#0a1115";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        Math.max(
            4,
            enemy.radius * 0.28
        ),
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    /*
       Health bar
    */

    const barWidth =
        enemy.radius * 2.4;

    const healthPercent =
        clamp(
            enemy.health /
            enemy.maxHealth,
            0,
            1
        );

    ctx.fillStyle =
        "rgba(0,0,0,0.7)";

    ctx.fillRect(
        x - barWidth / 2,
        y - enemy.radius - 12,
        barWidth,
        5
    );

    ctx.fillStyle =
        enemy.color;

    ctx.fillRect(
        x - barWidth / 2,
        y - enemy.radius - 12,
        barWidth *
        healthPercent,
        5
    );
}

/* =========================================================
   PLAYER DRAWING
   ========================================================= */

function drawPlayer() {

    const x =
        player.x -
        CAMERA.x;

    const y =
        player.y -
        CAMERA.y;

    ctx.save();

    ctx.translate(
        x,
        y
    );

    ctx.rotate(
        player.angle
    );

    /*
       Shadow
    */

    ctx.fillStyle =
        "rgba(0,0,0,0.5)";

    ctx.beginPath();

    ctx.ellipse(
        5,
        9,
        22,
        11,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
       Body
    */

    const bodyGradient =
        ctx.createRadialGradient(
            -5,
            -5,
            2,
            0,
            0,
            25
        );

    bodyGradient.addColorStop(
        0,
        "#d8f7ff"
    );

    bodyGradient.addColorStop(
        0.35,
        "#75cfe5"
    );

    bodyGradient.addColorStop(
        1,
        "#1a4a5a"
    );

    ctx.fillStyle =
        bodyGradient;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
       Armor ring
    */

    ctx.strokeStyle =
        "#b9f5ff";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        player.radius + 2,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    /*
       Weapon
    */

    ctx.fillStyle =
        getCurrentWeapon().color;

    ctx.fillRect(
        8,
        -5,
        32,
        10
    );

    ctx.fillStyle =
        "#dffaff";

    ctx.fillRect(
        25,
        -3,
        18,
        6
    );

    /*
       Core
    */

    ctx.fillStyle =
        "#ffffff";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    /*
       Dash shield
    */

    if (
        player.invulnerable > 0
    ) {

        ctx.strokeStyle =
            "rgba(90,230,255,0.8)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            27 +
            Math.sin(
                elapsed * 15
            ) * 3,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }
}

/* =========================================================
   BULLET DRAWING
   ========================================================= */

function drawBullets() {

    for (const bullet of bullets) {

        const x =
            bullet.x -
            CAMERA.x;

        const y =
            bullet.y -
            CAMERA.y;

        ctx.save();

        ctx.shadowBlur = 15;
        ctx.shadowColor =
            bullet.color;

        ctx.fillStyle =
            bullet.color;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            bullet.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }

    for (const bullet of enemyBullets) {

        const x =
            bullet.x -
            CAMERA.x;

        const y =
            bullet.y -
            CAMERA.y;

        ctx.save();

        ctx.shadowBlur = 10;
        ctx.shadowColor =
            bullet.color;

        ctx.fillStyle =
            bullet.color;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}

/* =========================================================
   PARTICLE DRAWING
   ========================================================= */

function drawParticles() {

    for (const p of particles) {

        const alpha =
            clamp(
                p.life /
                p.maxLife,
                0,
                1
            );

        ctx.save();

        ctx.globalAlpha =
            alpha;

        if (p.glow) {

            ctx.shadowBlur = 12;
            ctx.shadowColor =
                p.color;
        }

        ctx.fillStyle =
            p.color;

        ctx.beginPath();

        ctx.arc(
            p.x - CAMERA.x,
            p.y - CAMERA.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}

/* =========================================================
   FLOATING TEXT DRAWING
   ========================================================= */

function drawFloatingTexts() {

    for (const item of floatingTexts) {

        ctx.save();

        ctx.globalAlpha =
            clamp(
                item.life,
                0,
                1
            );

        ctx.font =
            "bold 14px Arial";

        ctx.textAlign =
            "center";

        ctx.fillStyle =
            item.color;

        ctx.fillText(
            item.text,
            item.x - CAMERA.x,
            item.y - CAMERA.y
        );

        ctx.restore();
    }
}

/* =========================================================
   LIGHTING
   ========================================================= */

function drawLighting() {

    const gradient =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            80,
            W / 2,
            H / 2,
            Math.max(W, H) * 0.75
        );

    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    gradient.addColorStop(
        0.55,
        "rgba(0,0,0,0.18)"
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

    /*
       Player light
    */

    const light =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            20,
            W / 2,
            H / 2,
            250
        );

    light.addColorStop(
        0,
        "rgba(100,220,255,0.12)"
    );

    light.addColorStop(
        0.4,
        "rgba(60,150,190,0.04)"
    );

    light.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    ctx.fillStyle =
        light;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );
}

/* =========================================================
   RAIN DRAWING
   ========================================================= */

function drawRain() {

    ctx.save();

    ctx.strokeStyle =
        "rgba(130,190,220,0.22)";

    ctx.lineWidth = 1;

    for (const drop of rain) {

        ctx.globalAlpha =
            drop.alpha;

        ctx.beginPath();

        ctx.moveTo(
            drop.x,
            drop.y
        );

        ctx.lineTo(
            drop.x - 5,
            drop.y +
            drop.length
        );

        ctx.stroke();
    }

    ctx.restore();
}

/* =========================================================
   CROSSHAIR
   ========================================================= */

function drawCrosshair() {

    if (!gameRunning) return;

    ctx.save();

    ctx.translate(
        mouse.x,
        mouse.y
    );

    ctx.strokeStyle =
        "#bcefff";

    ctx.lineWidth = 1.5;

    ctx.beginPath();

    ctx.moveTo(
        -12,
        0
    );

    ctx.lineTo(
        -4,
        0
    );

    ctx.moveTo(
        4,
        0
    );

    ctx.lineTo(
        12,
        0
    );

    ctx.moveTo(
        0,
        -12
    );

    ctx.lineTo(
        0,
        -4
    );

    ctx.moveTo(
        0,
        4
    );

    ctx.lineTo(
        0,
        12
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        4,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
}

/* =========================================================
   MAP
   ========================================================= */

function drawMap() {

    if (!mapCtx) return;

    mapCtx.clearRect(
        0,
        0,
        mapCanvas.width,
        mapCanvas.height
    );

    mapCtx.fillStyle =
        "#081016";

    mapCtx.fillRect(
        0,
        0,
        mapCanvas.width,
        mapCanvas.height
    );

    const scaleX =
        mapCanvas.width /
        WORLD.width;

    const scaleY =
        mapCanvas.height /
        WORLD.height;

    /*
       Walls on map
    */

    for (const wall of walls) {

        mapCtx.fillStyle =
            "#50636c";

        mapCtx.fillRect(
            wall.x * scaleX,
            wall.y * scaleY,
            wall.w * scaleX,
            wall.h * scaleY
        );
    }

    /*
       Doors
    */

    for (const door of doors) {

        mapCtx.fillStyle =
            door.open
                ? "#54dfff"
                : "#a57955";

        mapCtx.fillRect(
            door.x * scaleX,
            door.y * scaleY,
            door.w * scaleX,
            door.h * scaleY
        );
    }

    /*
       Chests
    */

    for (const chest of chests) {

        mapCtx.fillStyle =
            "#ffd66d";

        mapCtx.fillRect(
            chest.x * scaleX - 3,
            chest.y * scaleY - 3,
            6,
            6
        );
    }

    /*
       Player
    */

    mapCtx.fillStyle =
        "#ffffff";

    mapCtx.beginPath();

    mapCtx.arc(
        player.x * scaleX,
        player.y * scaleY,
        6,
        0,
        Math.PI * 2
    );

    mapCtx.fill();

    /*
       Enemies
    */

    for (const enemy of enemies) {

        if (enemy.dead) continue;

        mapCtx.fillStyle =
            enemy.color;

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
}

/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

const achievementDefinitions = {

    firstEcho: {
        name: "FIRST ECHO",
        description: "Versla je eerste vijand."
    },

    tenEchoes: {
        name: "TEN ECHOES",
        description: "Versla 10 vijanden."
    },

    fiftyEchoes: {
        name: "ECHO HUNTER",
        description: "Versla 50 vijanden."
    },

    survivor: {
        name: "SURVIVOR",
        description: "Bereik wave 5."
    },

    explorer: {
        name: "EXPLORER",
        description: "Leg 5.000 meter af."
    },

    rich: {
        name: "SIGNAL RUNNER",
        description: "Verzamel 1.000 credits."
    },

    arsenal: {
        name: "ARSENAL",
        description: "Gebruik alle wapens."
    },

    chestHunter: {
        name: "LOCKBREAKER",
        description: "Open alle kisten."
    },

    terminalUser: {
        name: "SYSTEM ACCESS",
        description: "Gebruik alle terminals."
    },

    survivorElite: {
        name: "ELITE SURVIVOR",
        description: "Bereik wave 10."
    },

    firstSave: {
        name: "BACKUP",
        description: "Sla een run op."
    }
};

let achievements = {};

function loadAchievements() {

    try {

        achievements =
            JSON.parse(
                localStorage.getItem(
                    "echoboundAchievements"
                )
            ) || {};

    } catch (e) {

        achievements = {};
    }
}

function unlockAchievement(id) {

    if (achievements[id]) return;

    achievements[id] = true;

    localStorage.setItem(
        "echoboundAchievements",
        JSON.stringify(achievements)
    );

    const achievement =
        achievementDefinitions[id];

    if (!achievement) return;

    showAchievement(
        achievement.name
    );
}

let achievementTimeout = null;

function showAchievement(name) {

    if (!achievementPopup) return;

    achievementName.textContent =
        name;

    achievementPopup.style.display =
        "block";

    achievementPopup.classList.remove(
        "achievementShow"
    );

    void achievementPopup.offsetWidth;

    achievementPopup.classList.add(
        "achievementShow"
    );

    clearTimeout(
        achievementTimeout
    );

    achievementTimeout =
        setTimeout(() => {

            achievementPopup.style.display =
                "none";

        }, 3500);
}

function checkAchievements() {

    if (kills >= 1) {
        unlockAchievement(
            "firstEcho"
        );
    }

    if (kills >= 10) {
        unlockAchievement(
            "tenEchoes"
        );
    }

    if (kills >= 50) {
        unlockAchievement(
            "fiftyEchoes"
        );
    }

    if (wave >= 5) {
        unlockAchievement(
            "survivor"
        );
    }

    if (wave >= 10) {
        unlockAchievement(
            "survivorElite"
        );
    }

    if (distanceTravelled >= 5000) {
        unlockAchievement(
            "explorer"
        );
    }

    if (credits >= 1000) {
        unlockAchievement(
            "rich"
        );
    }

    if (
        weaponsUsed.size >=
        weapons.length
    ) {

        unlockAchievement(
            "arsenal"
        );
    }

    if (
        chests.length > 0 &&
        chests.every(
            chest => chest.opened
        )
    ) {

        unlockAchievement(
            "chestHunter"
        );
    }

    if (
        terminals.length > 0 &&
        terminals.every(
            terminal => terminal.used
        )
    ) {

        unlockAchievement(
            "terminalUser"
        );
    }
}

const weaponsUsed = new Set();

/* =========================================================
   SAVE SYSTEM
   ========================================================= */

function saveKey(slot) {

    return (
        "echoboundSave_" +
        slot
    );
}

function saveGame(slot = currentSlot) {

    const data = {

        version: 4,

        player: {
            x: player.x,
            y: player.y,
            health: player.health,
            energy: player.energy,
            weaponIndex: player.weaponIndex,
            credits: player.credits,
            armor: player.armor,
            upgrades: player.upgrades,
            inventory: player.inventory
        },

        kills,
        credits,
        wave,
        distanceTravelled,

        doors: doors.map(
            door => ({
                open: door.open,
                locked: door.locked
            })
        ),

        chests: chests.map(
            chest => ({
                opened: chest.opened
            })
        ),

        terminals: terminals.map(
            terminal => ({
                used: terminal.used
            })
        ),

        timestamp:
            Date.now()
    };

    try {

        localStorage.setItem(
            saveKey(slot),
            JSON.stringify(data)
        );

        currentSlot = slot;

        unlockAchievement(
            "firstSave"
        );

        return true;

    } catch (e) {

        return false;
    }
}

function loadGame(slot = currentSlot) {

    try {

        const raw =
            localStorage.getItem(
                saveKey(slot)
            );

        if (!raw) {
            return false;
        }

        const data =
            JSON.parse(raw);

        if (!data) {
            return false;
        }

        if (data.player) {

            player.x =
                Number(data.player.x) ||
                600;

            player.y =
                Number(data.player.y) ||
                550;

            player.health =
                Number(data.player.health) ||
                100;

            player.energy =
                Number(data.player.energy) ||
                100;

            player.weaponIndex =
                clamp(
                    Number(
                        data.player.weaponIndex
                    ) || 0,
                    0,
                    weapons.length - 1
                );

            player.credits =
                Number(
                    data.player.credits
                ) || 0;

            player.armor =
                Number(
                    data.player.armor
                ) || 0;

            if (data.player.upgrades) {

                player.upgrades = {
                    ...player.upgrades,
                    ...data.player.upgrades
                };
            }

            if (data.player.inventory) {

                player.inventory = {
                    ...player.inventory,
                    ...data.player.inventory
                };
            }
        }

        kills =
            Number(data.kills) || 0;

        credits =
            Number(data.credits) || 0;

        wave =
            Math.max(
                1,
                Number(data.wave) || 1
            );

        distanceTravelled =
            Number(
                data.distanceTravelled
            ) || 0;

        if (Array.isArray(data.doors)) {

            data.doors.forEach(
                (saved, index) => {

                    if (
                        doors[index]
                    ) {

                        doors[index].open =
                            saved.open !== false;

                        doors[index].locked =
                            saved.locked === true;
                    }
                }
            );
        }

        if (Array.isArray(data.chests)) {

            data.chests.forEach(
                (saved, index) => {

                    if (
                        chests[index]
                    ) {

                        chests[index].opened =
                            saved.opened === true;
                    }
                }
            );
        }

        if (Array.isArray(data.terminals)) {

            data.terminals.forEach(
                (saved, index) => {

                    if (
                        terminals[index]
                    ) {

                        terminals[index].used =
                            saved.used === true;
                    }
                }
            );
        }

        currentSlot = slot;

        return true;

    } catch (e) {

        return false;
    }
}

function hasSave(slot) {

    return !!localStorage.getItem(
        saveKey(slot)
    );
}

/* =========================================================
   ACHIEVEMENTS SCREEN
   ========================================================= */

function openAchievements() {

    const existing =
        document.getElementById(
            "achievementsOverlay"
        );

    if (existing) {
        existing.remove();
    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "achievementsOverlay";

    overlay.innerHTML = `

        <div class="extraPanel">

            <div class="extraHeader">
                <span>ACHIEVEMENTS</span>
                <button id="closeAchievements">
                    CLOSE
                </button>
            </div>

            <div class="achievementGrid">

                ${Object.entries(
                    achievementDefinitions
                ).map(
                    ([id, item]) => {

                        const unlocked =
                            !!achievements[id];

                        return `
                            <div class="achievementCard ${unlocked ? "unlocked" : "locked"}">

                                <div class="achievementIcon">
                                    ${unlocked ? "◆" : "?"}
                                </div>

                                <div>
                                    <strong>
                                        ${item.name}
                                    </strong>

                                    <p>
                                        ${item.description}
                                    </p>

                                    <small>
                                        ${
                                            unlocked
                                                ? "UNLOCKED"
                                                : "LOCKED"
                                        }
                                    </small>
                                </div>

                            </div>
                        `;
                    }
                ).join("")}

            </div>

        </div>
    `;

    document.body.appendChild(
        overlay
    );

    injectExtraStyles();

    document
        .getElementById(
            "closeAchievements"
        )
        .addEventListener(
            "click",
            () => {
                overlay.remove();
            }
        );
}

/* =========================================================
   CONTROLS SCREEN
   ========================================================= */

function openControls() {

    const existing =
        document.getElementById(
            "controlsOverlay"
        );

    if (existing) {
        existing.remove();
    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "controlsOverlay";

    overlay.innerHTML = `

        <div class="extraPanel controlsPanel">

            <div class="extraHeader">
                <span>CONTROLS</span>
                <button id="closeControls">
                    CLOSE
                </button>
            </div>

            <div class="controlsList">

                <div>
                    <b>W A S D</b>
                    <span>Move</span>
                </div>

                <div>
                    <b>MOUSE</b>
                    <span>Aim</span>
                </div>

                <div>
                    <b>LEFT CLICK</b>
                    <span>Shoot</span>
                </div>

                <div>
                    <b>SPACE</b>
                    <span>Dash</span>
                </div>

                <div>
                    <b>E</b>
                    <span>Doors / terminals</span>
                </div>

                <div>
                    <b>1 - 6</b>
                    <span>Change weapon</span>
                </div>

                <div>
                    <b>M</b>
                    <span>Map</span>
                </div>

                <div>
                    <b>ESC</b>
                    <span>Pause</span>
                </div>

            </div>

        </div>
    `;

    document.body.appendChild(
        overlay
    );

    injectExtraStyles();

    document
        .getElementById(
            "closeControls"
        )
        .addEventListener(
            "click",
            () => {
                overlay.remove();
            }
        );
}

/* =========================================================
   EXTRA STYLES
   ========================================================= */

function injectExtraStyles() {

    if (
        document.getElementById(
            "echoboundExtraStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "echoboundExtraStyles";

    style.textContent = `

        #achievementsOverlay,
        #controlsOverlay,
        #gameOverOverlay {

            position: fixed;
            inset: 0;

            z-index: 1000;

            display: flex;

            align-items: center;
            justify-content: center;

            background:
                radial-gradient(
                    circle at center,
                    rgba(25,50,65,0.5),
                    rgba(2,6,9,0.96)
                );

            backdrop-filter:
                blur(8px);

            font-family:
                Arial,
                sans-serif;

            color: #e8f7fb;
        }

        .extraPanel {

            width: min(
                900px,
                calc(100vw - 40px)
            );

            max-height:
                calc(100vh - 60px);

            overflow-y: auto;

            padding: 25px;

            background:
                linear-gradient(
                    145deg,
                    rgba(17,31,39,0.98),
                    rgba(7,14,19,0.98)
                );

            border:
                1px solid
                rgba(130,220,245,0.35);

            box-shadow:
                0 30px 80px
                rgba(0,0,0,0.7);

            border-radius: 12px;
        }

        .extraHeader {

            display: flex;

            align-items: center;
            justify-content: space-between;

            margin-bottom: 22px;

            font-size: 22px;

            letter-spacing:
                4px;

            font-weight: 700;
        }

        .extraHeader button {

            border:
                1px solid
                rgba(130,220,245,0.4);

            background:
                rgba(60,120,140,0.12);

            color:
                #bfefff;

            padding:
                9px 15px;

            cursor: pointer;

            border-radius: 6px;
        }

        .achievementGrid {

            display: grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(240px, 1fr)
                );

            gap: 12px;
        }

        .achievementCard {

            display: flex;

            gap: 14px;

            padding: 15px;

            border-radius: 8px;

            background:
                rgba(255,255,255,0.025);

            border:
                1px solid
                rgba(255,255,255,0.08);
        }

        .achievementCard.locked {

            opacity: 0.42;
        }

        .achievementCard.unlocked {

            border-color:
                rgba(100,225,255,0.45);

            box-shadow:
                inset 0 0 30px
                rgba(70,200,255,0.05);
        }

        .achievementIcon {

            width: 42px;
            height: 42px;

            display: flex;

            align-items: center;
            justify-content: center;

            border-radius: 50%;

            background:
                rgba(100,220,255,0.08);

            color:
                #8feaff;

            font-size: 20px;

            flex-shrink: 0;
        }

        .achievementCard strong {

            display: block;

            margin-bottom: 5px;

            letter-spacing:
                1px;
        }

        .achievementCard p {

            margin: 0 0 6px;

            color:
                #9db0b8;

            font-size: 13px;
        }

        .achievementCard small {

            color:
                #62dcff;

            font-size: 10px;

            letter-spacing:
                1px;
        }

        .controlsList {

            display: grid;

            gap: 8px;
        }

        .controlsList div {

            display: flex;

            justify-content:
                space-between;

            align-items: center;

            padding: 14px;

            border-radius: 7px;

            background:
                rgba(255,255,255,0.035);
        }

        .controlsList b {

            color:
                #9ceaff;

            min-width: 130px;
        }

        .controlsList span {

            color:
                #b5c3c8;
        }

        #gameOverOverlay {

            z-index: 2000;
        }

        .gameOverPanel {

            text-align: center;

            width:
                min(520px, calc(100vw - 40px));

            padding: 40px;

            border:
                1px solid
                rgba(255,100,100,0.35);

            background:
                rgba(8,13,17,0.97);

            border-radius: 14px;

            box-shadow:
                0 30px 100px
                rgba(0,0,0,0.8);
        }

        .gameOverPanel h2 {

            margin:
                0 0 10px;

            font-size: 42px;

            letter-spacing:
                6px;
        }

        .gameOverPanel p {

            color:
                #9caeb5;

            margin-bottom:
                28px;
        }

        .gameOverButtons {

            display: flex;

            gap: 10px;

            justify-content: center;

            flex-wrap: wrap;
        }

        .gameOverButtons button {

            border:
                1px solid
                rgba(110,220,245,0.4);

            background:
                rgba(60,130,150,0.12);

            color:
                #dff9ff;

            padding:
                13px 22px;

            border-radius: 7px;

            cursor: pointer;

            font-weight: 700;
        }

        .gameOverButtons button:hover {

            background:
                rgba(70,180,210,0.2);
        }
    `;

    document.head.appendChild(
        style
    );
}

/* =========================================================
   GAME OVER
   ========================================================= */

function endGame() {

    if (gameOver) return;

    gameOver = true;
    gameRunning = false;
    mouse.down = false;

    resetKeys();

    createGameOverScreen();
}

function createGameOverScreen() {

    const old =
        document.getElementById(
            "gameOverOverlay"
        );

    if (old) {
        old.remove();
    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "gameOverOverlay";

    overlay.innerHTML = `

        <div class="gameOverPanel">

            <div style="
                color:#ff7777;
                letter-spacing:5px;
                font-size:12px;
                margin-bottom:12px;
            ">
                SIGNAL LOST
            </div>

            <h2>RUN ENDED</h2>

            <p>
                Kills: ${kills}<br>
                Credits: ${formatNumber(credits)}<br>
                Wave: ${wave}
            </p>

            <div class="gameOverButtons">

                <button id="retryGame">
                    RETRY
                </button>

                <button id="saveAfterDeath">
                    SAVE RUN
                </button>

                <button id="gameOverMenu">
                    MENU
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(
        overlay
    );

    injectExtraStyles();

    document
        .getElementById(
            "retryGame"
        )
        .addEventListener(
            "click",
            () => {

                overlay.remove();

                startNewGame();
            }
        );

    document
        .getElementById(
            "saveAfterDeath"
        )
        .addEventListener(
            "click",
            () => {

                saveGame(
                    currentSlot
                );
            }
        );

    document
        .getElementById(
            "gameOverMenu"
        )
        .addEventListener(
            "click",
            () => {

                overlay.remove();

                returnToMenu();
            }
        );
}

/* =========================================================
   RESET GAME
   ========================================================= */

function resetGameState() {

    bullets = [];
    enemyBullets = [];
    enemies = [];
    particles = [];
    pickups = [];
    floatingTexts = [];

    kills = 0;
    credits = 0;
    wave = 1;
    distanceTravelled = 0;

    currentSector = 0;

    player.x = 600;
    player.y = 550;

    player.health =
        player.maxHealth;

    player.energy =
        player.maxEnergy;

    player.weaponIndex = 0;

    player.credits = 0;
    player.armor = 0;

    player.upgrades = {
        speed: 0,
        health: 0,
        energy: 0,
        damage: 0
    };

    player.inventory = {
        medkits: 2,
        energyCells: 3
    };

    player.shootCooldown = 0;
    player.dashCooldown = 0;
    player.invulnerable = 0;

    weaponsUsed.clear();

    for (const door of doors) {

        door.open = true;
        door.locked = false;
    }

    createChests();
    createTerminals();
    createBeacons();
    createProps();
}

/* =========================================================
   START NEW GAME
   ========================================================= */

function startNewGame() {

    initAudio();

    const overlay =
        document.getElementById(
            "gameOverOverlay"
        );

    if (overlay) {
        overlay.remove();
    }

    resetGameState();

    gameOver = false;
    victory = false;
    paused = false;
    gameRunning = true;

    menu.style.display =
        "none";

    pauseScreen.style.display =
        "none";

    mapScreen.style.display =
        "none";

    spawnWave();

    updateHUD();

    checkAchievements();
}

/* =========================================================
   CONTINUE
   ========================================================= */

function continueGame() {

    initAudio();

    resetGameState();

    const loaded =
        loadGame(
            currentSlot
        );

    if (!loaded) {

        startNewGame();

        return;
    }

    gameOver = false;
    victory = false;
    paused = false;
    gameRunning = true;

    menu.style.display =
        "none";

    pauseScreen.style.display =
        "none";

    mapScreen.style.display =
        "none";

    spawnWave();

    updateHUD();
}

/* =========================================================
   MENU
   ========================================================= */

function returnToMenu() {

    gameRunning = false;
    paused = false;
    gameOver = false;

    resetKeys();

    mouse.down = false;

    menu.style.display =
        "flex";

    pauseScreen.style.display =
        "none";

    mapScreen.style.display =
        "none";

    const gameOverOverlay =
        document.getElementById(
            "gameOverOverlay"
        );

    if (gameOverOverlay) {
        gameOverOverlay.remove();
    }
}

/* =========================================================
   PAUSE
   ========================================================= */

function togglePause() {

    if (
        !gameRunning ||
        gameOver
    ) {
        return;
    }

    paused =
        !paused;

    pauseScreen.style.display =
        paused
            ? "flex"
            : "none";

    if (paused) {
        mouse.down = false;
    }
}

/* =========================================================
   MAP
   ========================================================= */

function toggleMap() {

    if (
        !gameRunning ||
        paused ||
        gameOver
    ) {
        return;
    }

    const visible =
        mapScreen.style.display ===
        "flex";

    mapScreen.style.display =
        visible
            ? "none"
            : "flex";

    if (!visible) {

        drawMap();

        mouse.down = false;
    }
}

/* =========================================================
   KEYBOARD
   ========================================================= */

function resetKeys() {

    keys = {};
}

window.addEventListener(
    "keydown",
    event => {

        keys[event.code] = true;

        if (
            event.code === "Escape"
        ) {

            if (
                document.getElementById(
                    "achievementsOverlay"
                )
            ) {

                document
                    .getElementById(
                        "achievementsOverlay"
                    )
                    .remove();

                return;
            }

            if (
                document.getElementById(
                    "controlsOverlay"
                )
            ) {

                document
                    .getElementById(
                        "controlsOverlay"
                    )
                    .remove();

                return;
            }

            togglePause();
        }

        if (
            event.code === "KeyM"
        ) {

            toggleMap();
        }

        if (
            gameRunning &&
            !paused
        ) {

            if (
                event.code === "Digit1"
            ) {
                player.weaponIndex = 0;
            }

            if (
                event.code === "Digit2"
            ) {
                player.weaponIndex = 1;
            }

            if (
                event.code === "Digit3"
            ) {
                player.weaponIndex = 2;
            }

            if (
                event.code === "Digit4"
            ) {
                player.weaponIndex = 3;
            }

            if (
                event.code === "Digit5"
            ) {
                player.weaponIndex = 4;
            }

            if (
                event.code === "Digit6"
            ) {
                player.weaponIndex = 5;
            }

            if (
                event.code.startsWith(
                    "Digit"
                )
            ) {

                weaponsUsed.add(
                    player.weaponIndex
                );

                checkAchievements();
            }
        }

        if (
            [
                "Space",
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight"
            ].includes(
                event.code
            )
        ) {

            event.preventDefault();
        }
    }
);

window.addEventListener(
    "keyup",
    event => {

        keys[event.code] = false;
    }
);

window.addEventListener(
    "blur",
    () => {

        resetKeys();

        mouse.down = false;
    }
);

/* =========================================================
   MOUSE
   ========================================================= */

window.addEventListener(
    "mousemove",
    event => {

        mouse.x =
            event.clientX;

        mouse.y =
            event.clientY;
    }
);

window.addEventListener(
    "mousedown",
    event => {

        if (
            event.button === 0
        ) {

            mouse.down = true;

            initAudio();
        }
    }
);

window.addEventListener(
    "mouseup",
    event => {

        if (
            event.button === 0
        ) {

            mouse.down = false;
        }
    }
);

/* =========================================================
   BUTTONS
   ========================================================= */

if (newGameButton) {

    newGameButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            startNewGame();
        }
    );
}

if (loadGameButton) {

    loadGameButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            continueGame();
        }
    );
}

if (achievementsButton) {

    achievementsButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openAchievements();
        }
    );
}

if (controlsButton) {

    controlsButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openControls();
        }
    );
}

if (resumeButton) {

    resumeButton.addEventListener(
        "click",
        () => {

            paused = false;

            pauseScreen.style.display =
                "none";
        }
    );
}

if (saveButton) {

    saveButton.addEventListener(
        "click",
        () => {

            saveGame(
                currentSlot
            );
        }
    );
}

if (quitButton) {

    quitButton.addEventListener(
        "click",
        () => {

            returnToMenu();
        }
    );
}

if (closeMapButton) {

    closeMapButton.addEventListener(
        "click",
        () => {

            mapScreen.style.display =
                "none";
        }
    );
}

/* =========================================================
   GAME UPDATE
   ========================================================= */

function update(dt) {

    if (
        !gameRunning ||
        paused ||
        gameOver
    ) {
        return;
    }

    elapsed += dt;

    updatePlayer(dt);

    updateEnemyBullets(dt);

    updateBullets(dt);

    for (const enemy of enemies) {

        updateEnemy(
            enemy,
            dt
        );
    }

    enemies =
        enemies.filter(
            enemy =>
                !enemy.dead
        );

    updatePickups(dt);

    updateChests();

    updateTerminals();

    updateDoors();

    updateParticles(dt);

    updateFloatingTexts(dt);

    updateRain(dt);

    updateCamera();

    updateSector();

    updateObjective();

    updateHUD();

    /*
       Nieuwe wave
    */

    if (
        enemies.length === 0
    ) {

        wave++;

        if (wave >= 10) {

            checkAchievements();
        }

        spawnWave();
    }

    checkAchievements();
}

/* =========================================================
   RENDER
   ========================================================= */

function render() {

    if (!ctx) return;

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    drawBackground();

    drawWorldFloor();

    /*
       WORLD OBJECTS
    */

    drawBeacons();

    drawProps();

    drawChests();

    /*
       MUREN WORDEN HIER GETEKEND
       EN ZIJN DUS ALTIJD ZICHTBAAR
    */

    drawWalls();

    /*
       PICKUPS
    */

    for (const pickup of pickups) {

        const x =
            pickup.x -
            CAMERA.x;

        const y =
            pickup.y -
            CAMERA.y;

        const pulse =
            Math.sin(
                pickup.pulse
            ) * 3;

        let color =
            "#ffffff";

        if (
            pickup.type ===
            "health"
        ) {
            color = "#63ff87";
        }

        if (
            pickup.type ===
            "energy"
        ) {
            color = "#62dfff";
        }

        if (
            pickup.type ===
            "credit"
        ) {
            color = "#ffd365";
        }

        ctx.save();

        ctx.shadowBlur = 15;
        ctx.shadowColor =
            color;

        ctx.fillStyle =
            color;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            8 + pulse,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }

    /*
       ENEMIES
    */

    for (const enemy of enemies) {

        drawEnemy(enemy);
    }

    /*
       BULLETS
    */

    drawBullets();

    /*
       PLAYER
    */

    drawPlayer();

    /*
       PARTICLES
    */

    drawParticles();

    /*
       FLOATING TEXT
    */

    drawFloatingTexts();

    /*
       LIGHTING
    */

    drawLighting();

    /*
       RAIN
    */

    drawRain();

    /*
       CROSSHAIR
    */

    drawCrosshair();
}

/* =========================================================
   GAME LOOP
   ========================================================= */

function gameLoop(time) {

    const dt =
        Math.min(
            0.033,
            (time - lastTime) / 1000
        );

    lastTime = time;

    update(dt);

    render();

    requestAnimationFrame(
        gameLoop
    );
}

/* =========================================================
   INITIALIZE
   ========================================================= */

loadAchievements();

createProps();
createChests();
createTerminals();
createBeacons();

injectExtraStyles();

if (hud) {

    hud.style.pointerEvents =
        "none";
}

/*
   Start render loop immediately.
*/

requestAnimationFrame(
    gameLoop
);

/* =========================================================
   DEBUG HELPERS
   ========================================================= */

window.ECHObound = {

    player,

    walls,

    doors,

    enemies,

    startNewGame,

    saveGame,

    loadGame,

    resetGameState
};

})();
