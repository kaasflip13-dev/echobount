(() => {
"use strict";

/* =========================================================
   ECHOBOUND — THE LOST SIGNAL
   EXTENDED EDITION
   ========================================================= */

if (window.__ECHOboundExtendedLoaded) return;
window.__ECHOboundExtendedLoaded = true;

/* =========================================================
   DOM
   ========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

if (!canvas || !ctx) {
    console.error("EchoBound: canvas #game niet gevonden.");
    return;
}

const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const pauseScreen = document.getElementById("pause");
const achievementPopup = document.getElementById("achievement");
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

const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas ? mapCanvas.getContext("2d") : null;

/* =========================================================
   CONSTANTS
   ========================================================= */

const VERSION = 8;

const WORLD = {
    width: 3600,
    height: 3600
};

const PLAYER_RADIUS = 18;

const STORAGE_PREFIX = "echobound_extended_";

const COLORS = {
    background: "#080b10",
    floor: "#111820",
    floor2: "#151e27",
    wall: "#26323d",
    wallEdge: "#536573",
    metal: "#7c8b95",
    cyan: "#63e6ff",
    blue: "#3ca8ff",
    white: "#f2fbff",
    red: "#ff6b6b",
    orange: "#ffae57",
    yellow: "#ffe27a",
    green: "#65e68c",
    purple: "#b784ff"
};

/* =========================================================
   CANVAS
   ========================================================= */

let viewWidth = window.innerWidth;
let viewHeight = window.innerHeight;

let camera = {
    x: 0,
    y: 0,
    shake: 0
};

function resizeCanvas() {
    viewWidth = window.innerWidth;
    viewHeight = window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(viewWidth * dpr);
    canvas.height = Math.floor(viewHeight * dpr);

    canvas.style.width = viewWidth + "px";
    canvas.style.height = viewHeight + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (mapCanvas) {
        mapCanvas.width = Math.min(700, viewWidth - 80);
        mapCanvas.height = Math.min(700, viewHeight - 180);
    }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* =========================================================
   INPUT
   ========================================================= */

const keys = {};

const mouse = {
    x: viewWidth / 2,
    y: viewHeight / 2,
    down: false
};

window.addEventListener("keydown", event => {
    keys[event.code] = true;

    if (
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "ArrowDown" ||
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight"
    ) {
        event.preventDefault();
    }

    if (event.code === "Escape") {
        if (game.running) {
            togglePause();
        }
    }

    if (event.code === "KeyM") {
        if (game.running && !game.paused) {
            toggleMap();
        }
    }

    if (event.code === "KeyE") {
        if (game.running && !game.paused) {
            interact();
        }
    }

    if (event.code === "Digit1") equipWeapon(0);
    if (event.code === "Digit2") equipWeapon(1);
    if (event.code === "Digit3") equipWeapon(2);
    if (event.code === "Digit4") equipWeapon(3);
    if (event.code === "Digit5") equipWeapon(4);
    if (event.code === "Digit6") equipWeapon(5);
});

window.addEventListener("keyup", event => {
    keys[event.code] = false;
});

window.addEventListener("blur", () => {
    for (const key in keys) {
        keys[key] = false;
    }

    mouse.down = false;
});

window.addEventListener("mousemove", event => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});

window.addEventListener("mousedown", event => {
    if (event.button === 0) {
        mouse.down = true;
    }
});

window.addEventListener("mouseup", event => {
    if (event.button === 0) {
        mouse.down = false;
    }
});

canvas.addEventListener("contextmenu", event => {
    event.preventDefault();
});

/* =========================================================
   AUDIO
   ========================================================= */

let audioContext = null;

function initAudio() {
    if (!audioContext) {
        try {
            audioContext =
                new (window.AudioContext || window.webkitAudioContext)();
        } catch {
            audioContext = null;
        }
    }

    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume().catch(() => {});
    }
}

function sound(
    frequency = 440,
    duration = 0.06,
    type = "sine",
    volume = 0.035
) {
    if (!audioContext) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(volume, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch {}
}

/* =========================================================
   UTILITIES
   ========================================================= */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function choose(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleTo(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
}

function normalize(x, y) {
    const length = Math.hypot(x, y);

    if (!length) {
        return { x: 0, y: 0 };
    }

    return {
        x: x / length,
        y: y / length
    };
}

function rectsOverlap(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

function circleRectCollision(circle, rect) {
    const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
    const closestY = clamp(circle.y, rect.y, rect.y + rect.h);

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    return dx * dx + dy * dy < circle.radius * circle.radius;
}

function pointInRect(x, y, rect) {
    return (
        x >= rect.x &&
        x <= rect.x + rect.w &&
        y >= rect.y &&
        y <= rect.y + rect.h
    );
}

function formatNumber(value) {
    return Math.floor(value).toLocaleString("nl-NL");
}

/* =========================================================
   GAME STATE
   ========================================================= */

const game = {
    running: false,
    paused: false,
    gameOver: false,

    time: 0,
    wave: 1,

    kills: 0,
    credits: 0,

    distanceTravelled: 0,

    currentSector: 0,

    objective: "Find the signal",

    signalProgress: 0,
    signalRequired: 100,

    bossActive: false,

    weatherTime: 0,

    saveSlot: 1,

    message: "",
    messageTimer: 0
};

/* =========================================================
   PLAYER
   ========================================================= */

const player = {
    x: 450,
    y: 450,

    radius: PLAYER_RADIUS,

    speed: 235,

    health: 100,
    maxHealth: 100,

    energy: 100,
    maxEnergy: 100,

    armor: 25,
    maxArmor: 25,

    damageMultiplier: 1,

    fireCooldown: 0,
    dashCooldown: 0,

    invulnerable: 0,

    facing: 0,

    weaponIndex: 0,

    experience: 0,
    level: 1,

    upgrades: {
        health: 0,
        armor: 0,
        energy: 0,
        speed: 0,
        damage: 0
    }
};

/* =========================================================
   WEAPONS
   ========================================================= */

const weapons = [
    {
        name: "PULSE",
        damage: 18,
        fireRate: 0.18,
        bulletSpeed: 800,
        spread: 0.025,
        pellets: 1,
        energy: 0,
        color: "#63e6ff",
        sound: 620
    },

    {
        name: "BURST",
        damage: 13,
        fireRate: 0.42,
        bulletSpeed: 820,
        spread: 0.06,
        pellets: 3,
        energy: 2,
        color: "#7ac8ff",
        sound: 700
    },

    {
        name: "HEAVY",
        damage: 55,
        fireRate: 0.75,
        bulletSpeed: 670,
        spread: 0.02,
        pellets: 1,
        energy: 8,
        color: "#ffbd66",
        sound: 180
    },

    {
        name: "ARC",
        damage: 30,
        fireRate: 0.28,
        bulletSpeed: 730,
        spread: 0.08,
        pellets: 2,
        energy: 4,
        color: "#b784ff",
        sound: 340
    },

    {
        name: "NOVA",
        damage: 22,
        fireRate: 0.6,
        bulletSpeed: 600,
        spread: 0.4,
        pellets: 8,
        energy: 12,
        color: "#ff82c8",
        sound: 240
    },

    {
        name: "RAIL",
        damage: 120,
        fireRate: 1.35,
        bulletSpeed: 1500,
        spread: 0,
        pellets: 1,
        energy: 20,
        color: "#ffffff",
        sound: 950
    }
];

/* =========================================================
   ARRAYS
   ========================================================= */

let walls = [];
let doors = [];
let crates = [];
let lamps = [];
let terminals = [];
let pickups = [];
let enemies = [];
let bullets = [];
let enemyBullets = [];
let particles = [];
let rain = [];
let floatingTexts = [];
let shockwaves = [];
let lootBoxes = [];
let missionZones = [];
let beacons = [];
let coverObjects = [];

/* =========================================================
   SECTORS
   ========================================================= */

const sectors = [
    {
        name: "OUTER WASTELAND",
        x: 0,
        y: 0,
        w: 1200,
        h: 1200
    },

    {
        name: "INDUSTRIAL DISTRICT",
        x: 1200,
        y: 0,
        w: 1200,
        h: 1200
    },

    {
        name: "RESEARCH COMPLEX",
        x: 2400,
        y: 0,
        w: 1200,
        h: 1200
    },

    {
        name: "LOWER CITY",
        x: 0,
        y: 1200,
        w: 1200,
        h: 1200
    },

    {
        name: "SIGNAL FACILITY",
        x: 1200,
        y: 1200,
        w: 1200,
        h: 1200
    },

    {
        name: "DEEP ZONE",
        x: 2400,
        y: 1200,
        w: 1200,
        h: 1200
    },

    {
        name: "ABANDONED PORT",
        x: 0,
        y: 2400,
        w: 1200,
        h: 1200
    },

    {
        name: "BLACKOUT SECTOR",
        x: 1200,
        y: 2400,
        w: 1200,
        h: 1200
    },

    {
        name: "THE CORE",
        x: 2400,
        y: 2400,
        w: 1200,
        h: 1200
    }
];

/* =========================================================
   SAVE SYSTEM
   ========================================================= */

const DEFAULT_SAVE = {
    version: VERSION,

    achievements: {},

    bestKills: 0,
    bestWave: 0,
    totalCredits: 0,

    unlockedWeapons: [
        true,
        true,
        true,
        false,
        false,
        false
    ],

    upgrades: {
        health: 0,
        armor: 0,
        energy: 0,
        speed: 0,
        damage: 0
    }
};

let profile = loadProfile();

function cloneDefaultSave() {
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}

function loadProfile() {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + "profile");

        if (!raw) {
            return cloneDefaultSave();
        }

        const parsed = JSON.parse(raw);

        return {
            ...cloneDefaultSave(),
            ...parsed,
            upgrades: {
                ...DEFAULT_SAVE.upgrades,
                ...(parsed.upgrades || {})
            },
            achievements: {
                ...(parsed.achievements || {})
            }
        };
    } catch {
        return cloneDefaultSave();
    }
}

function saveProfile() {
    try {
        localStorage.setItem(
            STORAGE_PREFIX + "profile",
            JSON.stringify(profile)
        );
    } catch {
        console.warn("EchoBound: save failed.");
    }
}

function slotKey(slot) {
    return STORAGE_PREFIX + "slot_" + slot;
}

function saveRun(slot = game.saveSlot) {
    const data = {
        version: VERSION,

        player: {
            x: player.x,
            y: player.y,

            health: player.health,
            energy: player.energy,
            armor: player.armor,

            weaponIndex: player.weaponIndex,

            experience: player.experience,
            level: player.level
        },

        game: {
            time: game.time,
            wave: game.wave,
            kills: game.kills,
            credits: game.credits,

            distanceTravelled: game.distanceTravelled,

            currentSector: game.currentSector,

            objective: game.objective,

            signalProgress: game.signalProgress
        }
    };

    try {
        localStorage.setItem(slotKey(slot), JSON.stringify(data));

        game.saveSlot = slot;

        profile.bestKills = Math.max(
            profile.bestKills,
            game.kills
        );

        profile.bestWave = Math.max(
            profile.bestWave,
            game.wave
        );

        profile.totalCredits += game.credits;

        saveProfile();

        unlockAchievement("firstSave");

        showMessage("RUN SAVED — SLOT " + slot);

        sound(760, 0.08, "sine", 0.05);
        sound(980, 0.1, "sine", 0.035);

        return true;
    } catch {
        showMessage("SAVE FAILED");
        return false;
    }
}

function loadRun(slot = game.saveSlot) {
    try {
        const raw = localStorage.getItem(slotKey(slot));

        if (!raw) {
            showMessage("NO SAVE IN SLOT " + slot);
            return false;
        }

        const data = JSON.parse(raw);

        resetWorld();

        player.x = data.player.x;
        player.y = data.player.y;

        player.health = data.player.health;
        player.energy = data.player.energy;
        player.armor = data.player.armor;

        player.weaponIndex = data.player.weaponIndex || 0;

        player.experience = data.player.experience || 0;
        player.level = data.player.level || 1;

        game.time = data.game.time || 0;
        game.wave = data.game.wave || 1;
        game.kills = data.game.kills || 0;
        game.credits = data.game.credits || 0;

        game.distanceTravelled =
            data.game.distanceTravelled || 0;

        game.currentSector =
            data.game.currentSector || 0;

        game.objective =
            data.game.objective || "Find the signal";

        game.signalProgress =
            data.game.signalProgress || 0;

        game.saveSlot = slot;

        game.running = true;
        game.paused = false;
        game.gameOver = false;

        hideAllScreens();

        showMessage("RUN LOADED — SLOT " + slot);

        sound(420, 0.1, "triangle", 0.04);

        return true;
    } catch {
        showMessage("SAVE DATA ERROR");
        return false;
    }
}

/* =========================================================
   SAVE SLOT UI
   ========================================================= */

function getSlotInfo(slot) {
    try {
        const raw = localStorage.getItem(slotKey(slot));

        if (!raw) return null;

        const data = JSON.parse(raw);

        return {
            wave: data.game.wave,
            kills: data.game.kills,
            credits: data.game.credits,
            sector: data.game.currentSector
        };
    } catch {
        return null;
    }
}

/* =========================================================
   WORLD RESET
   ========================================================= */

function resetWorld() {
    walls = [];
    doors = [];
    crates = [];
    lamps = [];
    terminals = [];
    pickups = [];
    enemies = [];
    bullets = [];
    enemyBullets = [];
    particles = [];
    rain = [];
    floatingTexts = [];
    shockwaves = [];
    lootBoxes = [];
    missionZones = [];
    beacons = [];
    coverObjects = [];

    generateWorld();
    generateRain();
    generateMission();
}

/* =========================================================
   WORLD GENERATION
   ========================================================= */

function generateWorld() {

    /* outer boundaries */

    walls.push(
        {
            x: 0,
            y: 0,
            w: WORLD.width,
            h: 40,
            type: "boundary"
        },

        {
            x: 0,
            y: WORLD.height - 40,
            w: WORLD.width,
            h: 40,
            type: "boundary"
        },

        {
            x: 0,
            y: 0,
            w: 40,
            h: WORLD.height,
            type: "boundary"
        },

        {
            x: WORLD.width - 40,
            y: 0,
            w: 40,
            h: WORLD.height,
            type: "boundary"
        }
    );

    /* -----------------------------------------------------
       INDUSTRIAL BUILDINGS
       ----------------------------------------------------- */

    addBuilding(160, 170, 420, 250);
    addBuilding(720, 120, 340, 300);
    addBuilding(1350, 160, 440, 320);
    addBuilding(1900, 130, 400, 380);
    addBuilding(2600, 150, 430, 320);
    addBuilding(3100, 110, 350, 410);

    addBuilding(120, 760, 380, 310);
    addBuilding(650, 680, 520, 280);
    addBuilding(1350, 690, 380, 360);
    addBuilding(1900, 720, 450, 270);
    addBuilding(2550, 690, 500, 340);
    addBuilding(3140, 720, 330, 300);

    addBuilding(160, 1350, 450, 330);
    addBuilding(760, 1300, 330, 450);
    addBuilding(1340, 1350, 450, 330);
    addBuilding(1920, 1320, 370, 430);
    addBuilding(2500, 1350, 470, 300);
    addBuilding(3130, 1300, 330, 450);

    addBuilding(130, 1980, 420, 330);
    addBuilding(700, 1900, 420, 420);
    addBuilding(1320, 1980, 480, 330);
    addBuilding(1930, 1920, 390, 400);
    addBuilding(2520, 1980, 430, 320);
    addBuilding(3100, 1900, 360, 430);

    addBuilding(150, 2580, 450, 360);
    addBuilding(730, 2650, 350, 300);
    addBuilding(1350, 2550, 450, 360);
    addBuilding(1940, 2600, 370, 320);
    addBuilding(2520, 2520, 470, 390);
    addBuilding(3140, 2600, 330, 300);

    /* -----------------------------------------------------
       DOORS
       ----------------------------------------------------- */

    addDoor(580, 290, 45, 90);
    addDoor(705, 260, 45, 90);

    addDoor(1290, 290, 45, 90);
    addDoor(1800, 310, 45, 90);

    addDoor(2420, 290, 45, 90);
    addDoor(3050, 300, 45, 90);

    addDoor(530, 850, 45, 90);
    addDoor(1180, 810, 45, 90);

    addDoor(1290, 830, 45, 90);
    addDoor(2390, 830, 45, 90);

    addDoor(2450, 850, 45, 90);
    addDoor(3090, 850, 45, 90);

    /* -----------------------------------------------------
       CRATES
       ----------------------------------------------------- */

    for (let i = 0; i < 90; i++) {

        const x = random(80, WORLD.width - 80);
        const y = random(80, WORLD.height - 80);

        if (isPositionBlocked(x, y, 80)) {
            continue;
        }

        crates.push({
            x,
            y,
            w: randomInt(28, 52),
            h: randomInt(28, 52),

            rotation: random(-0.05, 0.05),

            health: 30,

            type: Math.random() < 0.25
                ? "supply"
                : "crate"
        });
    }

    /* -----------------------------------------------------
       LAMPS
       ----------------------------------------------------- */

    for (let x = 100; x < WORLD.width; x += 260) {

        for (let y = 100; y < WORLD.height; y += 260) {

            if (Math.random() < 0.7) {

                lamps.push({
                    x,
                    y,

                    radius: random(100, 170),

                    phase: random(0, Math.PI * 2),

                    broken: Math.random() < 0.12
                });
            }
        }
    }

    /* -----------------------------------------------------
       TERMINALS
       ----------------------------------------------------- */

    const terminalPositions = [
        [900, 550],
        [1600, 580],
        [2800, 580],
        [500, 1500],
        [1500, 1600],
        [2200, 1650],
        [2900, 1500],
        [900, 2900],
        [1700, 2900],
        [2900, 2900]
    ];

    terminalPositions.forEach(([x, y]) => {

        terminals.push({
            x,
            y,

            radius: 24,

            active: false,

            hacked: false,

            progress: 0
        });
    });

    /* -----------------------------------------------------
       COVER
       ----------------------------------------------------- */

    for (let i = 0; i < 80; i++) {

        const x = random(100, WORLD.width - 100);
        const y = random(100, WORLD.height - 100);

        if (isPositionBlocked(x, y, 80)) {
            continue;
        }

        coverObjects.push({
            x,
            y,

            w: randomInt(45, 90),
            h: randomInt(20, 45),

            rotation: random(0, Math.PI)
        });
    }
}

/* =========================================================
   BUILDINGS
   ========================================================= */

function addBuilding(x, y, w, h) {

    const thickness = 28;

    walls.push(
        {
            x,
            y,
            w,
            h: thickness,
            type: "building"
        },

        {
            x,
            y: y + h - thickness,
            w,
            h: thickness,
            type: "building"
        },

        {
            x,
            y,
            w: thickness,
            h,
            type: "building"
        },

        {
            x: x + w - thickness,
            y,
            w: thickness,
            h,
            type: "building"
        }
    );

    /* interior dividers */

    if (w > 350) {

        walls.push({
            x: x + w * 0.5,
            y: y + 30,
            w: thickness,
            h: h * 0.35,
            type: "interior"
        });

        walls.push({
            x: x + w * 0.5,
            y: y + h * 0.65,
            w: thickness,
            h: h * 0.35 - 30,
            type: "interior"
        });
    }
}

/* =========================================================
   DOORS
   ========================================================= */

function addDoor(x, y, w, h) {

    doors.push({
        x,
        y,
        w,
        h,

        open: false,

        progress: 0,

        locked: false
    });
}

/* =========================================================
   RAIN
   ========================================================= */

function generateRain() {

    rain = [];

    for (let i = 0; i < 500; i++) {

        rain.push({
            x: random(0, viewWidth),
            y: random(0, viewHeight),

            length: random(8, 24),

            speed: random(500, 900),

            alpha: random(0.08, 0.35)
        });
    }
}

/* =========================================================
   MISSION
   ========================================================= */

function generateMission() {

    missionZones = [
        {
            x: 3300,
            y: 3300,
            radius: 130,

            title: "SIGNAL SOURCE",

            completed: false
        },

        {
            x: 1700,
            y: 1650,
            radius: 100,

            title: "RELAY STATION",

            completed: false
        },

        {
            x: 2850,
            y: 1650,
            radius: 100,

            title: "DEEP SIGNAL",

            completed: false
        }
    ];

    beacons = [
        {
            x: 3300,
            y: 3300,

            active: true,

            pulse: 0
        },

        {
            x: 1700,
            y: 1650,

            active: false,

            pulse: 0
        },

        {
            x: 2850,
            y: 1650,

            active: false,

            pulse: 0
        }
    ];
}

/* =========================================================
   COLLISION WORLD
   ========================================================= */

function getSolidWalls() {

    const result = [...walls];

    for (const door of doors) {

        if (!door.open || door.progress < 0.9) {

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

function isPositionBlocked(x, y, radius = 20) {

    const circle = {
        x,
        y,
        radius
    };

    for (const wall of getSolidWalls()) {

        if (circleRectCollision(circle, wall)) {
            return true;
        }
    }

    return false;
}

function moveCircle(entity, dx, dy) {

    const oldX = entity.x;
    const oldY = entity.y;

    entity.x += dx;

    if (isPositionBlocked(entity.x, entity.y, entity.radius)) {
        entity.x = oldX;
    }

    entity.y += dy;

    if (isPositionBlocked(entity.x, entity.y, entity.radius)) {
        entity.y = oldY;
    }

    entity.x = clamp(
        entity.x,
        entity.radius + 45,
        WORLD.width - entity.radius - 45
    );

    entity.y = clamp(
        entity.y,
        entity.radius + 45,
        WORLD.height - entity.radius - 45
    );
}

/* =========================================================
   LINE OF SIGHT
   ========================================================= */

function lineHitsWall(x1, y1, x2, y2) {

    const distanceValue = Math.hypot(
        x2 - x1,
        y2 - y1
    );

    const steps = Math.ceil(distanceValue / 15);

    for (let i = 0; i <= steps; i++) {

        const t = i / steps;

        const x = lerp(x1, x2, t);
        const y = lerp(y1, y2, t);

        for (const wall of getSolidWalls()) {

            if (pointInRect(x, y, wall)) {
                return true;
            }
        }
    }

    return false;
}

/* =========================================================
   ENEMY TYPES
   ========================================================= */

const enemyTypes = {

    scout: {
        health: 55,
        speed: 130,
        damage: 8,
        radius: 15,
        color: "#ffbf69",
        fireRate: 2.2,
        range: 650,
        credits: 12
    },

    hunter: {
        health: 100,
        speed: 95,
        damage: 13,
        radius: 19,
        color: "#ff728a",
        fireRate: 1.6,
        range: 750,
        credits: 20
    },

    guardian: {
        health: 260,
        speed: 52,
        damage: 20,
        radius: 27,
        color: "#a889ff",
        fireRate: 1.15,
        range: 900,
        credits: 45
    },

    sniper: {
        health: 75,
        speed: 45,
        damage: 30,
        radius: 16,
        color: "#66d9ff",
        fireRate: 3.5,
        range: 1100,
        credits: 40
    },

    drone: {
        health: 85,
        speed: 155,
        damage: 11,
        radius: 14,
        color: "#66ffae",
        fireRate: 1.9,
        range: 600,
        credits: 25
    },

    elite: {
        health: 480,
        speed: 75,
        damage: 28,
        radius: 32,
        color: "#ffad66",
        fireRate: 0.9,
        range: 1000,
        credits: 100
    },

    boss: {
        health: 2500,
        speed: 50,
        damage: 40,
        radius: 58,
        color: "#ffffff",
        fireRate: 0.65,
        range: 1200,
        credits: 500
    }
};

/* =========================================================
   SPAWN ENEMY
   ========================================================= */

function spawnEnemy(type, x, y) {

    const info = enemyTypes[type];

    if (!info) return;

    if (x === undefined) {
        let attempts = 0;

        do {

            x = random(80, WORLD.width - 80);
            y = random(80, WORLD.height - 80);

            attempts++;

        } while (
            (
                distance(
                    { x, y },
                    player
                ) < 450 ||
                isPositionBlocked(x, y, info.radius)
            ) &&
            attempts < 100
        );
    }

    const scale =
        1 +
        game.wave * 0.045 +
        game.currentSector * 0.035;

    enemies.push({

        type,

        x,
        y,

        radius: info.radius,

        health: info.health * scale,
        maxHealth: info.health * scale,

        speed:
            info.speed *
            (1 + game.wave * 0.008),

        damage:
            info.damage *
            (1 + game.wave * 0.018),

        fireTimer:
            random(0.4, info.fireRate),

        fireRate:
            info.fireRate,

        range: info.range,

        color: info.color,

        credits: info.credits,

        angle: random(0, Math.PI * 2),

        wanderTimer: random(1, 4),

        stun: 0,

        flash: 0,

        hitTimer: 0,

        alive: true
    });
}

/* =========================================================
   SPAWN WAVE
   ========================================================= */

function spawnWave() {

    const amount =
        4 +
        game.wave * 2 +
        game.currentSector * 2;

    for (let i = 0; i < amount; i++) {

        const roll = Math.random();

        let type = "scout";

        if (game.wave >= 3 && roll > 0.55) {
            type = "hunter";
        }

        if (game.wave >= 5 && roll > 0.75) {
            type = "drone";
        }

        if (game.wave >= 7 && roll > 0.88) {
            type = "guardian";
        }

        if (game.wave >= 9 && roll > 0.95) {
            type = "sniper";
        }

        if (game.wave >= 12 && roll > 0.97) {
            type = "elite";
        }

        spawnEnemy(type);
    }

    if (game.wave % 5 === 0) {
        spawnBoss();
    }

    showMessage(
        "WAVE " +
        game.wave +
        " — HOSTILES DETECTED"
    );

    sound(150, 0.25, "sawtooth", 0.045);
}

/* =========================================================
   BOSS
   ========================================================= */

function spawnBoss() {

    if (game.bossActive) return;

    game.bossActive = true;

    let x = WORLD.width - 500;
    let y = WORLD.height - 500;

    if (distance({ x, y }, player) < 500) {
        x = 500;
        y = WORLD.height - 500;
    }

    spawnEnemy("boss", x, y);

    game.objective = "DEFEAT THE SIGNAL GUARDIAN";

    showMessage("WARNING — GUARDIAN DETECTED");

    camera.shake = 20;

    sound(60, 0.5, "sawtooth", 0.06);
}

/* =========================================================
   PICKUPS
   ========================================================= */

function spawnPickup(x, y, type) {

    pickups.push({

        x,
        y,

        radius: 13,

        type,

        life: 25,

        rotation: 0
    });
}

function spawnLoot(x, y) {

    const roll = Math.random();

    if (roll < 0.4) {
        spawnPickup(x, y, "health");
    } else if (roll < 0.65) {
        spawnPickup(x, y, "energy");
    } else if (roll < 0.85) {
        spawnPickup(x, y, "armor");
    } else {
        spawnPickup(x, y, "credits");
    }
}

/* =========================================================
   BULLETS
   ========================================================= */

function fireWeapon() {

    const weapon = weapons[player.weaponIndex];

    if (!weapon) return;

    if (player.fireCooldown > 0) return;

    if (player.energy < weapon.energy) {

        if (weapon.energy > 0) {
            showMessage("LOW ENERGY");
            sound(90, 0.08, "square", 0.025);
        }

        return;
    }

    player.energy -= weapon.energy;

    player.fireCooldown = weapon.fireRate;

    const baseAngle = player.facing;

    for (let i = 0; i < weapon.pellets; i++) {

        const angle =
            baseAngle +
            random(
                -weapon.spread,
                weapon.spread
            );

        bullets.push({

            x:
                player.x +
                Math.cos(angle) * 25,

            y:
                player.y +
                Math.sin(angle) * 25,

            vx:
                Math.cos(angle) *
                weapon.bulletSpeed,

            vy:
                Math.sin(angle) *
                weapon.bulletSpeed,

            radius:
                weapon.name === "RAIL"
                    ? 5
                    : 4,

            damage:
                weapon.damage *
                player.damageMultiplier,

            life: 1.5,

            color: weapon.color,

            trail: [],

            piercing:
                weapon.name === "RAIL"
        });
    }

    createMuzzleFlash();

    camera.shake =
        weapon.name === "HEAVY" ||
        weapon.name === "RAIL"
            ? 8
            : 3;

    sound(
        weapon.sound,
        weapon.name === "RAIL" ? 0.16 : 0.05,
        weapon.name === "HEAVY" ? "sawtooth" : "square",
        weapon.name === "RAIL" ? 0.07 : 0.035
    );
}

/* =========================================================
   ENEMY SHOOTING
   ========================================================= */

function enemyShoot(enemy) {

    const angle = angleTo(enemy, player);

    const spread =
        enemy.type === "sniper"
            ? 0.008
            : 0.04;

    const finalAngle =
        angle +
        random(-spread, spread);

    const speed =
        enemy.type === "sniper"
            ? 720
            : enemy.type === "boss"
                ? 420
                : 380;

    enemyBullets.push({

        x:
            enemy.x +
            Math.cos(finalAngle) *
            (enemy.radius + 5),

        y:
            enemy.y +
            Math.sin(finalAngle) *
            (enemy.radius + 5),

        vx:
            Math.cos(finalAngle) * speed,

        vy:
            Math.sin(finalAngle) * speed,

        radius:
            enemy.type === "boss"
                ? 7
                : 5,

        damage:
            enemy.damage,

        life: 3,

        color:
            enemy.type === "sniper"
                ? "#66d9ff"
                : enemy.type === "boss"
                    ? "#ffffff"
                    : "#ff667f"
    });

    sound(
        enemy.type === "boss"
            ? 100
            : 180,
        0.04,
        "triangle",
        0.012
    );
}

/* =========================================================
   PLAYER MOVEMENT
   ========================================================= */

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;

    if (keys.KeyW || keys.ArrowUp) dy -= 1;
    if (keys.KeyS || keys.ArrowDown) dy += 1;
    if (keys.KeyA || keys.ArrowLeft) dx -= 1;
    if (keys.KeyD || keys.ArrowRight) dx += 1;

    const normalized = normalize(dx, dy);

    let speed =
        player.speed *
        (1 + player.upgrades.speed * 0.06);

    if (keys.ShiftLeft || keys.ShiftRight) {
        speed *= 1.15;
    }

    const moveX = normalized.x * speed * dt;
    const moveY = normalized.y * speed * dt;

    moveCircle(player, moveX, moveY);

    game.distanceTravelled +=
        Math.hypot(moveX, moveY);

    if (normalized.x !== 0 || normalized.y !== 0) {

        player.facing =
            Math.atan2(
                mouseWorldY() - player.y,
                mouseWorldX() - player.x
            );
    }

    if (keys.Space && player.dashCooldown <= 0) {
        dash();
    }

    if (mouse.down) {
        fireWeapon();
    }

    player.fireCooldown =
        Math.max(
            0,
            player.fireCooldown - dt
        );

    player.dashCooldown =
        Math.max(
            0,
            player.dashCooldown - dt
        );

    player.invulnerable =
        Math.max(
            0,
            player.invulnerable - dt
        );

    player.energy =
        clamp(
            player.energy + 9 * dt,
            0,
            player.maxEnergy
        );
}

/* =========================================================
   DASH
   ========================================================= */

function dash() {

    if (player.energy < 20) {
        return;
    }

    player.energy -= 20;

    player.dashCooldown = 1.15;

    player.invulnerable = 0.35;

    const targetX = mouseWorldX();
    const targetY = mouseWorldY();

    const direction = normalize(
        targetX - player.x,
        targetY - player.y
    );

    for (let i = 0; i < 12; i++) {

        const spread = random(-0.5, 0.5);

        createParticle(
            player.x,
            player.y,
            -direction.x * random(80, 180) + random(-30, 30),
            -direction.y * random(80, 180) + random(-30, 30),
            random(0.2, 0.5),
            random(2, 5),
            "#63e6ff"
        );
    }

    moveCircle(
        player,
        direction.x * 170,
        direction.y * 170
    );

    camera.shake = 7;

    sound(90, 0.12, "sawtooth", 0.045);
}

/* =========================================================
   ENEMY AI
   ========================================================= */

function updateEnemies(dt) {

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        enemy.fireTimer -= dt;
        enemy.wanderTimer -= dt;

        enemy.flash =
            Math.max(
                0,
                enemy.flash - dt
            );

        enemy.stun =
            Math.max(
                0,
                enemy.stun - dt
            );

        if (enemy.stun > 0) {
            continue;
        }

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;

        const dist = Math.hypot(dx, dy);

        let moveX = 0;
        let moveY = 0;

        if (dist < enemy.range) {

            const direction = normalize(dx, dy);

            if (dist > 300) {

                moveX = direction.x;
                moveY = direction.y;

            } else if (dist < 180) {

                moveX = -direction.x;
                moveY = -direction.y;

            } else {

                const side = {
                    x: -direction.y,
                    y: direction.x
                };

                moveX = side.x;
                moveY = side.y;
            }

            if (
                enemy.fireTimer <= 0 &&
                !lineHitsWall(
                    enemy.x,
                    enemy.y,
                    player.x,
                    player.y
                )
            ) {

                enemyShoot(enemy);

                enemy.fireTimer =
                    enemy.fireRate *
                    random(0.8, 1.2);
            }

        } else {

            if (enemy.wanderTimer <= 0) {

                enemy.angle =
                    random(
                        0,
                        Math.PI * 2
                    );

                enemy.wanderTimer =
                    random(1, 3);
            }

            moveX = Math.cos(enemy.angle);
            moveY = Math.sin(enemy.angle);
        }

        const movement = normalize(
            moveX,
            moveY
        );

        moveCircle(
            enemy,
            movement.x *
                enemy.speed *
                dt,

            movement.y *
                enemy.speed *
                dt
        );
    }
}

/* =========================================================
   BULLET UPDATE
   ========================================================= */

function updateBullets(dt) {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const bullet = bullets[i];

        bullet.life -= dt;

        bullet.trail.push({
            x: bullet.x,
            y: bullet.y
        });

        if (bullet.trail.length > 6) {
            bullet.trail.shift();
        }

        const nextX =
            bullet.x +
            bullet.vx * dt;

        const nextY =
            bullet.y +
            bullet.vy * dt;

        let hitWall = false;

        for (const wall of getSolidWalls()) {

            if (
                pointInRect(
                    nextX,
                    nextY,
                    wall
                )
            ) {

                hitWall = true;
                break;
            }
        }

        if (hitWall) {

            createImpact(
                bullet.x,
                bullet.y,
                bullet.color
            );

            bullets.splice(i, 1);

            continue;
        }

        bullet.x = nextX;
        bullet.y = nextY;

        let removed = false;

        for (const enemy of enemies) {

            if (!enemy.alive) continue;

            const d =
                Math.hypot(
                    bullet.x - enemy.x,
                    bullet.y - enemy.y
                );

            if (
                d <
                bullet.radius +
                enemy.radius
            ) {

                enemy.health -=
                    bullet.damage;

                enemy.flash = 0.08;

                createHitSpark(
                    bullet.x,
                    bullet.y,
                    bullet.color
                );

                floatingTexts.push({
                    x: enemy.x,
                    y: enemy.y - enemy.radius - 8,

                    text:
                        "-" +
                        Math.round(
                            bullet.damage
                        ),

                    life: 0.65,

                    color: bullet.color
                });

                if (
                    enemy.health <= 0
                ) {

                    killEnemy(enemy);
                }

                if (!bullet.piercing) {

                    bullets.splice(i, 1);

                    removed = true;
                }

                break;
            }
        }

        if (removed) continue;

        if (
            bullet.life <= 0 ||
            bullet.x < 0 ||
            bullet.y < 0 ||
            bullet.x > WORLD.width ||
            bullet.y > WORLD.height
        ) {

            bullets.splice(i, 1);
        }
    }
}

/* =========================================================
   ENEMY BULLET UPDATE
   ========================================================= */

function updateEnemyBullets(dt) {

    for (
        let i = enemyBullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = enemyBullets[i];

        bullet.life -= dt;

        const nextX =
            bullet.x +
            bullet.vx * dt;

        const nextY =
            bullet.y +
            bullet.vy * dt;

        let blocked = false;

        for (const wall of getSolidWalls()) {

            if (
                pointInRect(
                    nextX,
                    nextY,
                    wall
                )
            ) {

                blocked = true;
                break;
            }
        }

        if (blocked) {

            createImpact(
                bullet.x,
                bullet.y,
                bullet.color
            );

            enemyBullets.splice(i, 1);

            continue;
        }

        bullet.x = nextX;
        bullet.y = nextY;

        const d =
            Math.hypot(
                bullet.x - player.x,
                bullet.y - player.y
            );

        if (
            d <
            bullet.radius +
            player.radius
        ) {

            damagePlayer(
                bullet.damage
            );

            enemyBullets.splice(i, 1);

            continue;
        }

        if (
            bullet.life <= 0 ||
            bullet.x < 0 ||
            bullet.y < 0 ||
            bullet.x > WORLD.width ||
            bullet.y > WORLD.height
        ) {

            enemyBullets.splice(i, 1);
        }
    }
}

/* =========================================================
   ENEMY DEATH
   ========================================================= */

function killEnemy(enemy) {

    if (!enemy.alive) return;

    enemy.alive = false;

    game.kills++;

    game.credits += enemy.credits;

    profile.bestKills =
        Math.max(
            profile.bestKills,
            game.kills
        );

    const particleCount =
        enemy.type === "boss"
            ? 60
            : 20;

    for (let i = 0; i < particleCount; i++) {

        createParticle(
            enemy.x,
            enemy.y,
            random(-180, 180),
            random(-180, 180),
            random(0.3, 0.9),
            random(2, 7),
            enemy.color
        );
    }

    shockwaves.push({
        x: enemy.x,
        y: enemy.y,

        radius: 10,

        maxRadius:
            enemy.type === "boss"
                ? 220
                : 70,

        life: 0.5,

        maxLife: 0.5,

        color: enemy.color
    });

    spawnLoot(enemy.x, enemy.y);

    if (enemy.type === "boss") {

        game.bossActive = false;

        game.objective =
            "RECONNECT THE SIGNAL";

        game.wave++;

        showMessage(
            "GUARDIAN DESTROYED"
        );

        unlockAchievement("guardian");

    } else {

        unlockAchievement("firstEcho");

        if (game.kills >= 10) {
            unlockAchievement("tenEchoes");
        }

        if (game.kills >= 50) {
            unlockAchievement("fiftyEchoes");
        }
    }

    sound(
        enemy.type === "boss"
            ? 70
            : 220,
        enemy.type === "boss"
            ? 0.35
            : 0.08,
        "sawtooth",
        0.045
    );
}

/* =========================================================
   DAMAGE PLAYER
   ========================================================= */

function damagePlayer(amount) {

    if (player.invulnerable > 0) {
        return;
    }

    let remaining = amount;

    if (player.armor > 0) {

        const armorDamage =
            Math.min(
                player.armor,
                remaining * 0.65
            );

        player.armor -= armorDamage;

        remaining -= armorDamage;
    }

    player.health -= remaining;

    player.invulnerable = 0.15;

    camera.shake = 8;

    createImpact(
        player.x,
        player.y,
        "#ff6575"
    );

    sound(
        90,
        0.08,
        "square",
        0.04
    );

    if (player.health <= 0) {

        player.health = 0;

        endGame();
    }
}

/* =========================================================
   PICKUP UPDATE
   ========================================================= */

function updatePickups(dt) {

    for (
        let i = pickups.length - 1;
        i >= 0;
        i--
    ) {

        const pickup = pickups[i];

        pickup.life -= dt;

        pickup.rotation += dt * 2;

        const d =
            Math.hypot(
                pickup.x - player.x,
                pickup.y - player.y
            );

        if (d < 60) {

            const direction =
                normalize(
                    player.x - pickup.x,
                    player.y - pickup.y
                );

            pickup.x +=
                direction.x *
                220 *
                dt;

            pickup.y +=
                direction.y *
                220 *
                dt;
        }

        if (d < 25) {

            collectPickup(pickup);

            pickups.splice(i, 1);

            continue;
        }

        if (pickup.life <= 0) {
            pickups.splice(i, 1);
        }
    }
}

/* =========================================================
   COLLECT PICKUP
   ========================================================= */

function collectPickup(pickup) {

    if (pickup.type === "health") {

        player.health =
            clamp(
                player.health + 25,
                0,
                player.maxHealth
            );

        showMessage("HEALTH +25");
    }

    if (pickup.type === "energy") {

        player.energy =
            clamp(
                player.energy + 35,
                0,
                player.maxEnergy
            );

        showMessage("ENERGY +35");
    }

    if (pickup.type === "armor") {

        player.armor =
            clamp(
                player.armor + 20,
                0,
                player.maxArmor
            );

        showMessage("ARMOR +20");
    }

    if (pickup.type === "credits") {

        game.credits += 50;

        showMessage("CREDITS +50");
    }

    createPickupEffect(
        pickup.x,
        pickup.y
    );

    sound(850, 0.07, "sine", 0.04);
}

/* =========================================================
   INTERACTION
   ========================================================= */

function interact() {

    let interacted = false;

    for (const door of doors) {

        const center = {
            x: door.x + door.w / 2,
            y: door.y + door.h / 2
        };

        if (
            distance(
                player,
                center
            ) < 75
        ) {

            if (!door.locked) {

                door.open =
                    !door.open;

                showMessage(
                    door.open
                        ? "DOOR OPEN"
                        : "DOOR CLOSED"
                );

                sound(
                    door.open
                        ? 450
                        : 250,
                    0.12,
                    "square",
                    0.025
                );

                interacted = true;
            }
        }
    }

    for (const terminal of terminals) {

        if (
            distance(
                player,
                terminal
            ) < 75
        ) {

            terminal.active = true;

            terminal.progress += 25;

            if (
                terminal.progress >= 100
            ) {

                terminal.progress = 100;

                terminal.hacked = true;

                game.credits += 75;

                game.signalProgress =
                    clamp(
                        game.signalProgress + 20,
                        0,
                        game.signalRequired
                    );

                showMessage(
                    "TERMINAL CONNECTED"
                );

                unlockAchievement("hacker");
            } else {

                showMessage(
                    "CONNECTING " +
                    terminal.progress +
                    "%"
                );
            }

            interacted = true;
        }
    }

    if (!interacted) {
        showMessage("NOTHING TO INTERACT WITH");
    }
}

/* =========================================================
   MISSION UPDATE
   ========================================================= */

function updateMission(dt) {

    const target =
        missionZones[
            game.currentSector %
            missionZones.length
        ];

    if (!target) return;

    if (
        distance(
            player,
            target
        ) <
        target.radius
    ) {

        if (!target.completed) {

            target.completed = true;

            game.signalProgress += 25;

            game.credits += 100;

            game.objective =
                "SIGNAL LINK " +
                Math.min(
                    100,
                    game.signalProgress
                ) +
                "%";

            showMessage(
                "SIGNAL LINK ESTABLISHED"
            );

            unlockAchievement("signal");

            createSignalBurst(
                target.x,
                target.y
            );
        }
    }

    if (
        game.signalProgress >=
        game.signalRequired
    ) {

        game.signalProgress = 0;

        game.currentSector =
            Math.min(
                sectors.length - 1,
                game.currentSector + 1
            );

        game.wave++;

        game.objective =
            "ENTER " +
            sectors[
                game.currentSector
            ].name;

        showMessage(
            "SECTOR UNLOCKED"
        );

        unlockAchievement(
            "explorer"
        );

        spawnWave();
    }
}

/* =========================================================
   UPDATE GAME
   ========================================================= */

function update(dt) {

    if (!game.running) return;

    if (game.paused) return;

    if (game.gameOver) return;

    game.time += dt;

    game.weatherTime += dt;

    if (game.messageTimer > 0) {
        game.messageTimer -= dt;
    }

    updatePlayer(dt);

    updateEnemies(dt);

    updateBullets(dt);

    updateEnemyBullets(dt);

    updatePickups(dt);

    updateParticles(dt);

    updateRain(dt);

    updateFloatingTexts(dt);

    updateShockwaves(dt);

    updateDoors(dt);

    updateMission(dt);

    updateCamera(dt);

    cleanupEnemies();

    if (
        enemies.filter(
            e => e.alive
        ).length === 0 &&
        !game.bossActive
    ) {

        game.wave++;

        if (game.wave % 3 === 0) {
            game.credits += 100;
            showMessage("SECTOR CLEAR — BONUS +100");
        }

        spawnWave();
    }

    updateHUD();

    if (game.distanceTravelled > 5000) {
        unlockAchievement("traveler");
    }

    if (game.wave >= 5) {
        unlockAchievement("survivor");
    }

    if (player.level >= 5) {
        unlockAchievement("levelFive");
    }
}

/* =========================================================
   CLEANUP ENEMIES
   ========================================================= */

function cleanupEnemies() {

    enemies =
        enemies.filter(
            enemy => enemy.alive
        );
}

/* =========================================================
   DOOR UPDATE
   ========================================================= */

function updateDoors(dt) {

    for (const door of doors) {

        const target =
            door.open
                ? 1
                : 0;

        door.progress =
            lerp(
                door.progress,
                target,
                dt * 8
            );
    }
}

/* =========================================================
   CAMERA
   ========================================================= */

function updateCamera(dt) {

    const targetX =
        player.x -
        viewWidth / 2;

    const targetY =
        player.y -
        viewHeight / 2;

    camera.x =
        lerp(
            camera.x,
            targetX,
            dt * 5
        );

    camera.y =
        lerp(
            camera.y,
            targetY,
            dt * 5
        );

    camera.x =
        clamp(
            camera.x,
            0,
            WORLD.width - viewWidth
        );

    camera.y =
        clamp(
            camera.y,
            0,
            WORLD.height - viewHeight
        );

    camera.shake =
        Math.max(
            0,
            camera.shake - dt * 20
        );
}

/* =========================================================
   PARTICLES
   ========================================================= */

function createParticle(
    x,
    y,
    vx,
    vy,
    life,
    size,
    color
) {

    particles.push({

        x,
        y,

        vx,
        vy,

        life,
        maxLife: life,

        size,

        color,

        gravity: random(-20, 20)
    });
}

function createImpact(
    x,
    y,
    color
) {

    for (let i = 0; i < 12; i++) {

        const angle =
            random(
                0,
                Math.PI * 2
            );

        const speed =
            random(50, 180);

        createParticle(
            x,
            y,

            Math.cos(angle) * speed,
            Math.sin(angle) * speed,

            random(0.15, 0.45),

            random(2, 5),

            color
        );
    }

    shockwaves.push({
        x,
        y,

        radius: 4,

        maxRadius: 30,

        life: 0.22,

        maxLife: 0.22,

        color
    });
}

function createHitSpark(
    x,
    y,
    color
) {

    for (let i = 0; i < 5; i++) {

        createParticle(
            x,
            y,

            random(-100, 100),
            random(-100, 100),

            random(0.1, 0.3),

            random(1, 3),

            color
        );
    }
}

function createMuzzleFlash() {

    for (let i = 0; i < 5; i++) {

        createParticle(
            player.x +
                Math.cos(player.facing) *
                25,

            player.y +
                Math.sin(player.facing) *
                25,

            Math.cos(player.facing) *
                random(50, 140) +
                random(-20, 20),

            Math.sin(player.facing) *
                random(50, 140) +
                random(-20, 20),

            random(0.05, 0.18),

            random(2, 5),

            weapons[
                player.weaponIndex
            ].color
        );
    }
}

function createPickupEffect(x, y) {

    for (let i = 0; i < 18; i++) {

        const angle =
            random(
                0,
                Math.PI * 2
            );

        createParticle(
            x,
            y,

            Math.cos(angle) *
                random(30, 120),

            Math.sin(angle) *
                random(30, 120),

            random(0.25, 0.6),

            random(2, 5),

            "#ffffff"
        );
    }
}

function createSignalBurst(x, y) {

    for (let i = 0; i < 80; i++) {

        const angle =
            random(
                0,
                Math.PI * 2
            );

        const speed =
            random(50, 350);

        createParticle(
            x,
            y,

            Math.cos(angle) * speed,
            Math.sin(angle) * speed,

            random(0.5, 1.4),

            random(2, 6),

            choose([
                "#63e6ff",
                "#ffffff",
                "#b784ff"
            ])
        );
    }

    shockwaves.push({
        x,
        y,

        radius: 10,

        maxRadius: 300,

        life: 1,

        maxLife: 1,

        color: "#63e6ff"
    });
}

function updateParticles(dt) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p = particles[i];

        p.life -= dt;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        p.vx *= 0.97;
        p.vy *= 0.97;

        p.vy += p.gravity * dt;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

/* =========================================================
   SHOCKWAVES
   ========================================================= */

function updateShockwaves(dt) {

    for (
        let i = shockwaves.length - 1;
        i >= 0;
        i--
    ) {

        const s = shockwaves[i];

        s.life -= dt;

        s.radius =
            lerp(
                s.radius,
                s.maxRadius,
                dt * 7
            );

        if (s.life <= 0) {
            shockwaves.splice(i, 1);
        }
    }
}

/* =========================================================
   FLOATING TEXT
   ========================================================= */

function updateFloatingTexts(dt) {

    for (
        let i = floatingTexts.length - 1;
        i >= 0;
        i--
    ) {

        const t =
            floatingTexts[i];

        t.life -= dt;

        t.y -= 30 * dt;

        if (t.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

/* =========================================================
   RAIN UPDATE
   ========================================================= */

function updateRain(dt) {

    for (const drop of rain) {

        drop.y +=
            drop.speed * dt;

        drop.x -=
            drop.speed *
            0.18 *
            dt;

        if (
            drop.y >
            viewHeight + 40
        ) {

            drop.y =
                random(-100, -20);

            drop.x =
                random(0, viewWidth);
        }
    }
}

/* =========================================================
   RENDER
   ========================================================= */

function render() {

    ctx.clearRect(
        0,
        0,
        viewWidth,
        viewHeight
    );

    ctx.save();

    let shakeX = 0;
    let shakeY = 0;

    if (camera.shake > 0) {

        shakeX =
            random(
                -camera.shake,
                camera.shake
            );

        shakeY =
            random(
                -camera.shake,
                camera.shake
            );
    }

    ctx.translate(
        -camera.x + shakeX,
        -camera.y + shakeY
    );

    drawWorld();

    drawMissionZones();

    drawLamps();

    drawCover();

    drawCrates();

    drawDoors();

    drawTerminals();

    drawPickups();

    drawLoot();

    drawBeacons();

    drawBullets();

    drawEnemyBullets();

    drawEnemies();

    drawPlayer();

    drawParticles();

    drawShockwaves();

    drawFloatingTexts();

    ctx.restore();

    drawLighting();

    drawRain();

    drawScreenVignette();

    drawCrosshair();

    drawMessage();
}

/* =========================================================
   WORLD RENDER
   ========================================================= */

function drawWorld() {

    ctx.fillStyle =
        COLORS.background;

    ctx.fillRect(
        0,
        0,
        WORLD.width,
        WORLD.height
    );

    const grid = 80;

    ctx.lineWidth = 1;

    for (
        let x = 0;
        x <= WORLD.width;
        x += grid
    ) {

        ctx.strokeStyle =
            x % 400 === 0
                ? "rgba(100,130,150,0.13)"
                : "rgba(100,130,150,0.045)";

        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD.height);

        ctx.stroke();
    }

    for (
        let y = 0;
        y <= WORLD.height;
        y += grid
    ) {

        ctx.strokeStyle =
            y % 400 === 0
                ? "rgba(100,130,150,0.13)"
                : "rgba(100,130,150,0.045)";

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(WORLD.width, y);

        ctx.stroke();
    }

    /* sector lines */

    ctx.lineWidth = 2;

    for (let i = 1; i < 3; i++) {

        const x = i * 1200;

        ctx.strokeStyle =
            "rgba(100,220,255,0.09)";

        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD.height);

        ctx.stroke();
    }

    for (let i = 1; i < 3; i++) {

        const y = i * 1200;

        ctx.strokeStyle =
            "rgba(100,220,255,0.09)";

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(WORLD.width, y);

        ctx.stroke();
    }

    /* road strips */

    ctx.fillStyle =
        "rgba(90,110,125,0.055)";

    for (
        let x = 600;
        x < WORLD.width;
        x += 1200
    ) {

        ctx.fillRect(
            x - 35,
            0,
            70,
            WORLD.height
        );
    }

    for (
        let y = 600;
        y < WORLD.height;
        y += 1200
    ) {

        ctx.fillRect(
            0,
            y - 35,
            WORLD.width,
            70
        );
    }
}

/* =========================================================
   WALLS
   ========================================================= */

function drawWalls() {

    for (const wall of walls) {

        ctx.fillStyle =
            wall.type === "boundary"
                ? "#172029"
                : "#202b34";

        ctx.fillRect(
            wall.x,
            wall.y,
            wall.w,
            wall.h
        );

        ctx.strokeStyle =
            "#4d606d";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            wall.x,
            wall.y,
            wall.w,
            wall.h
        );

        if (
            wall.type !==
            "boundary"
        ) {

            ctx.fillStyle =
                "rgba(150,180,195,0.05)";

            for (
                let x =
                    wall.x + 12;
                x <
                    wall.x +
                    wall.w;
                x += 24
            ) {

                ctx.fillRect(
                    x,
                    wall.y + 5,
                    8,
                    Math.max(
                        3,
                        wall.h - 10
                    )
                );
            }
        }
    }
}

/* =========================================================
   BUILDINGS
   ========================================================= */

function drawBuildings() {

    for (const sector of sectors) {

        ctx.strokeStyle =
            "rgba(140,170,190,0.05)";

        ctx.lineWidth = 1;

        ctx.strokeRect(
            sector.x + 15,
            sector.y + 15,
            sector.w - 30,
            sector.h - 30
        );
    }

    drawWalls();
}

/* =========================================================
   CRATES
   ========================================================= */

function drawCrates() {

    for (const crate of crates) {

        ctx.save();

        ctx.translate(
            crate.x,
            crate.y
        );

        ctx.rotate(
            crate.rotation
        );

        ctx.fillStyle =
            crate.type === "supply"
                ? "#334d57"
                : "#38413d";

        ctx.fillRect(
            -crate.w / 2,
            -crate.h / 2,
            crate.w,
            crate.h
        );

        ctx.strokeStyle =
            crate.type === "supply"
                ? "#6cc5d5"
                : "#73786e";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            -crate.w / 2,
            -crate.h / 2,
            crate.w,
            crate.h
        );

        ctx.beginPath();

        ctx.moveTo(
            -crate.w / 2,
            -crate.h / 2
        );

        ctx.lineTo(
            crate.w / 2,
            crate.h / 2
        );

        ctx.moveTo(
            crate.w / 2,
            -crate.h / 2
        );

        ctx.lineTo(
            -crate.w / 2,
            crate.h / 2
        );

        ctx.stroke();

        ctx.restore();
    }
}

/* =========================================================
   COVER
   ========================================================= */

function drawCover() {

    for (const cover of coverObjects) {

        ctx.save();

        ctx.translate(
            cover.x,
            cover.y
        );

        ctx.rotate(
            cover.rotation
        );

        ctx.fillStyle =
            "#20292f";

        ctx.fillRect(
            -cover.w / 2,
            -cover.h / 2,
            cover.w,
            cover.h
        );

        ctx.strokeStyle =
            "#56656c";

        ctx.strokeRect(
            -cover.w / 2,
            -cover.h / 2,
            cover.w,
            cover.h
        );

        ctx.restore();
    }
}

/* =========================================================
   DOORS
   ========================================================= */

function drawDoors() {

    for (const door of doors) {

        const offset =
            door.progress *
            door.w;

        ctx.save();

        ctx.fillStyle =
            "#1b242c";

        ctx.fillRect(
            door.x -
                offset,
            door.y,
            door.w,
            door.h
        );

        ctx.strokeStyle =
            "#728590";

        ctx.strokeRect(
            door.x -
                offset,
            door.y,
            door.w,
            door.h
        );

        ctx.fillStyle =
            door.open
                ? "#65e68c"
                : "#ffbd66";

        ctx.fillRect(
            door.x +
                door.w / 2 -
                offset,
            door.y + 10,
            4,
            door.h - 20
        );

        ctx.restore();
    }
}

/* =========================================================
   LAMPS
   ========================================================= */

function drawLamps() {

    for (const lamp of lamps) {

        const flicker =
            lamp.broken
                ? 0
                : 0.75 +
                  Math.sin(
                      game.time * 4 +
                      lamp.phase
                  ) *
                  0.1;

        ctx.fillStyle =
            lamp.broken
                ? "#303840"
                : "#a9cbd0";

        ctx.beginPath();

        ctx.arc(
            lamp.x,
            lamp.y,
            5,
            0,
            Math.PI * 2
        );

        ctx.fill();

        if (!lamp.broken) {

            ctx.strokeStyle =
                "rgba(100,220,255," +
                flicker * 0.2 +
                ")";

            ctx.beginPath();

            ctx.arc(
                lamp.x,
                lamp.y,
                15,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }
    }
}

/* =========================================================
   TERMINALS
   ========================================================= */

function drawTerminals() {

    for (const terminal of terminals) {

        ctx.save();

        ctx.translate(
            terminal.x,
            terminal.y
        );

        ctx.fillStyle =
            "#16242b";

        ctx.fillRect(
            -18,
            -22,
            36,
            44
        );

        ctx.strokeStyle =
            terminal.hacked
                ? "#65e68c"
                : "#63e6ff";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            -18,
            -22,
            36,
            44
        );

        ctx.fillStyle =
            terminal.hacked
                ? "#65e68c"
                : "#63e6ff";

        ctx.fillRect(
            -10,
            -12,
            20,
            4
        );

        ctx.fillRect(
            -10,
            -4,
            14,
            4
        );

        ctx.fillRect(
            -10,
            4,
            18,
            4
        );

        if (
            distance(
                player,
                terminal
            ) < 100
        ) {

            ctx.fillStyle =
                "#ffffff";

            ctx.font =
                "12px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                terminal.hacked
                    ? "CONNECTED"
                    : "PRESS E",
                0,
                -34
            );
        }

        ctx.restore();
    }
}

/* =========================================================
   BEACONS
   ========================================================= */

function drawBeacons() {

    for (const beacon of beacons) {

        beacon.pulse += 0.03;

        ctx.save();

        ctx.translate(
            beacon.x,
            beacon.y
        );

        const pulse =
            1 +
            Math.sin(
                beacon.pulse
            ) *
            0.15;

        ctx.strokeStyle =
            beacon.active
                ? "rgba(99,230,255,0.5)"
                : "rgba(120,130,140,0.15)";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            35 * pulse,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.fillStyle =
            beacon.active
                ? "#63e6ff"
                : "#39444c";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            8,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}

/* =========================================================
   MISSION ZONES
   ========================================================= */

function drawMissionZones() {

    for (const zone of missionZones) {

        if (zone.completed) continue;

        const pulse =
            Math.sin(
                game.time * 3
            ) *
            0.15;

        ctx.strokeStyle =
            "rgba(99,230,255," +
            (0.25 + pulse) +
            ")";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(
            zone.x,
            zone.y,
            zone.radius,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.setLineDash([
            10,
            10
        ]);

        ctx.beginPath();

        ctx.arc(
            zone.x,
            zone.y,
            zone.radius + 15,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.setLineDash([]);

        ctx.fillStyle =
            "rgba(99,230,255,0.08)";

        ctx.beginPath();

        ctx.arc(
            zone.x,
            zone.y,
            zone.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        if (
            distance(
                player,
                zone
            ) < zone.radius + 80
        ) {

            ctx.fillStyle =
                "#c9f8ff";

            ctx.font =
                "bold 14px Arial";

            ctx.textAlign =
                "center";

            ctx.fillText(
                zone.title,
                zone.x,
                zone.y -
                zone.radius -
                15
            );
        }
    }
}

/* =========================================================
   PICKUPS
   ========================================================= */

function drawPickups() {

    for (const pickup of pickups) {

        ctx.save();

        ctx.translate(
            pickup.x,
            pickup.y
        );

        ctx.rotate(
            pickup.rotation
        );

        let color =
            "#ffffff";

        if (pickup.type === "health") {
            color = "#ff6b7a";
        }

        if (pickup.type === "energy") {
            color = "#63e6ff";
        }

        if (pickup.type === "armor") {
            color = "#b784ff";
        }

        if (pickup.type === "credits") {
            color = "#ffe27a";
        }

        ctx.shadowBlur = 18;
        ctx.shadowColor = color;

        ctx.fillStyle = color;

        ctx.beginPath();

        ctx.moveTo(
            0,
            -12
        );

        ctx.lineTo(
            10,
            0
        );

        ctx.lineTo(
            0,
            12
        );

        ctx.lineTo(
            -10,
            0
        );

        ctx.closePath();

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

/* =========================================================
   LOOT
   ========================================================= */

function drawLoot() {

    for (const loot of lootBoxes) {

        ctx.fillStyle =
            "#3a4148";

        ctx.fillRect(
            loot.x - 15,
            loot.y - 12,
            30,
            24
        );

        ctx.strokeStyle =
            "#a5b3bc";

        ctx.strokeRect(
            loot.x - 15,
            loot.y - 12,
            30,
            24
        );
    }
}

/* =========================================================
   BULLETS DRAW
   ========================================================= */

function drawBullets() {

    for (const bullet of bullets) {

        ctx.strokeStyle =
            bullet.color;

        ctx.lineWidth =
            bullet.radius * 1.5;

        ctx.beginPath();

        if (bullet.trail.length > 1) {

            const first =
                bullet.trail[0];

            ctx.moveTo(
                first.x,
                first.y
            );

            for (
                let i = 1;
                i < bullet.trail.length;
                i++
            ) {

                ctx.lineTo(
                    bullet.trail[i].x,
                    bullet.trail[i].y
                );
            }

            ctx.lineTo(
                bullet.x,
                bullet.y
            );
        } else {

            ctx.moveTo(
                bullet.x,
                bullet.y
            );

            ctx.lineTo(
                bullet.x -
                    bullet.vx * 0.02,
                bullet.y -
                    bullet.vy * 0.02
            );
        }

        ctx.stroke();

        ctx.fillStyle =
            "#ffffff";

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

/* =========================================================
   ENEMY BULLETS
   ========================================================= */

function drawEnemyBullets() {

    for (const bullet of enemyBullets) {

        ctx.shadowBlur = 12;
        ctx.shadowColor =
            bullet.color;

        ctx.fillStyle =
            bullet.color;

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

/* =========================================================
   ENEMIES
   ========================================================= */

function drawEnemies() {

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        ctx.save();

        ctx.translate(
            enemy.x,
            enemy.y
        );

        const angle =
            angleTo(
                enemy,
                player
            );

        ctx.rotate(angle);

        ctx.shadowBlur = 14;
        ctx.shadowColor =
            enemy.color;

        if (enemy.type === "boss") {

            drawBoss(enemy);

        } else if (
            enemy.type === "guardian" ||
            enemy.type === "elite"
        ) {

            drawHeavyEnemy(enemy);

        } else if (
            enemy.type === "drone"
        ) {

            drawDrone(enemy);

        } else if (
            enemy.type === "sniper"
        ) {

            drawSniper(enemy);

        } else {

            drawStandardEnemy(enemy);
        }

        ctx.shadowBlur = 0;

        ctx.restore();

        drawEnemyHealth(enemy);
    }
}

/* =========================================================
   STANDARD ENEMY
   ========================================================= */

function drawStandardEnemy(enemy) {

    ctx.fillStyle =
        enemy.flash > 0
            ? "#ffffff"
            : enemy.color;

    ctx.beginPath();

    ctx.moveTo(
        enemy.radius,
        0
    );

    ctx.lineTo(
        -enemy.radius * 0.7,
        enemy.radius * 0.8
    );

    ctx.lineTo(
        -enemy.radius * 0.7,
        -enemy.radius * 0.8
    );

    ctx.closePath();

    ctx.fill();

    ctx.strokeStyle =
        "#101820";

    ctx.lineWidth = 2;

    ctx.stroke();

    ctx.fillStyle =
        "#101820";

    ctx.beginPath();

    ctx.arc(
        2,
        0,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

/* =========================================================
   HEAVY ENEMY
   ========================================================= */

function drawHeavyEnemy(enemy) {

    ctx.fillStyle =
        enemy.flash > 0
            ? "#ffffff"
            : enemy.color;

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
        "#111820";

    ctx.lineWidth = 3;

    ctx.stroke();

    ctx.strokeStyle =
        "rgba(255,255,255,0.5)";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        enemy.radius * 0.55,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.fillStyle =
        "#111820";

    ctx.fillRect(
        0,
        -5,
        enemy.radius + 10,
        10
    );
}

/* =========================================================
   DRONE
   ========================================================= */

function drawDrone(enemy) {

    const pulse =
        Math.sin(
            game.time * 7 +
            enemy.x
        ) *
        3;

    ctx.fillStyle =
        enemy.flash > 0
            ? "#ffffff"
            : enemy.color;

    ctx.beginPath();

    ctx.moveTo(
        enemy.radius + pulse,
        0
    );

    ctx.lineTo(
        0,
        enemy.radius
    );

    ctx.lineTo(
        -enemy.radius,
        0
    );

    ctx.lineTo(
        0,
        -enemy.radius
    );

    ctx.closePath();

    ctx.fill();

    ctx.strokeStyle =
        "#0b1015";

    ctx.stroke();

    ctx.fillStyle =
        "#0b1015";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

/* =========================================================
   SNIPER
   ========================================================= */

function drawSniper(enemy) {

    ctx.fillStyle =
        enemy.flash > 0
            ? "#ffffff"
            : enemy.color;

    ctx.fillRect(
        -enemy.radius,
        -enemy.radius * 0.65,
        enemy.radius * 2,
        enemy.radius * 1.3
    );

    ctx.strokeStyle =
        "#101820";

    ctx.strokeRect(
        -enemy.radius,
        -enemy.radius * 0.65,
        enemy.radius * 2,
        enemy.radius * 1.3
    );

    ctx.fillStyle =
        "#101820";

    ctx.fillRect(
        0,
        -3,
        enemy.radius + 15,
        6
    );
}

/* =========================================================
   BOSS
   ========================================================= */

function drawBoss(enemy) {

    const pulse =
        Math.sin(
            game.time * 2
        ) *
        4;

    ctx.fillStyle =
        enemy.flash > 0
            ? "#ffffff"
            : "#d7e9f0";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        enemy.radius + pulse,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
        "#63e6ff";

    ctx.lineWidth = 5;

    ctx.stroke();

    ctx.strokeStyle =
        "#26323d";

    ctx.lineWidth = 7;

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        const a =
            i *
            Math.PI /
            2;

        ctx.beginPath();

        ctx.moveTo(
            Math.cos(a) * 30,
            Math.sin(a) * 30
        );

        ctx.lineTo(
            Math.cos(a) * 65,
            Math.sin(a) * 65
        );

        ctx.stroke();
    }

    ctx.fillStyle =
        "#0a1015";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        22,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#63e6ff";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();
}

/* =========================================================
   ENEMY HEALTH
   ========================================================= */

function drawEnemyHealth(enemy) {

    if (
        enemy.health >=
        enemy.maxHealth
    ) return;

    const width =
        enemy.radius * 2.8;

    const height = 5;

    const x =
        enemy.x -
        width / 2;

    const y =
        enemy.y -
        enemy.radius -
        13;

    ctx.fillStyle =
        "rgba(0,0,0,0.7)";

    ctx.fillRect(
        x,
        y,
        width,
        height
    );

    ctx.fillStyle =
        enemy.type === "boss"
            ? "#63e6ff"
            : "#ff667f";

    ctx.fillRect(
        x,
        y,
        width *
            clamp(
                enemy.health /
                enemy.maxHealth,
                0,
                1
            ),
        height
    );
}

/* =========================================================
   PLAYER DRAW
   ========================================================= */

function drawPlayer() {

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );

    ctx.rotate(
        player.facing
    );

    const flicker =
        player.invulnerable > 0
            ? 0.5 +
              Math.sin(
                  game.time * 30
              ) *
              0.5
            : 1;

    ctx.globalAlpha =
        flicker;

    ctx.shadowBlur = 25;

    ctx.shadowColor =
        "#63e6ff";

    ctx.fillStyle =
        "#8befff";

    ctx.beginPath();

    ctx.moveTo(
        27,
        0
    );

    ctx.lineTo(
        -15,
        -15
    );

    ctx.lineTo(
        -8,
        0
    );

    ctx.lineTo(
        -15,
        15
    );

    ctx.closePath();

    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 2;

    ctx.stroke();

    ctx.fillStyle =
        "#16232c";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        9,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#63e6ff";

    ctx.beginPath();

    ctx.arc(
        3,
        0,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /* energy ring */

    ctx.strokeStyle =
        "rgba(99,230,255,0.45)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        25 +
            Math.sin(
                game.time * 4
            ) *
            2,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
}

/* =========================================================
   PARTICLES DRAW
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

        ctx.globalAlpha =
            alpha;

        ctx.fillStyle =
            p.color;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}

/* =========================================================
   SHOCKWAVE DRAW
   ========================================================= */

function drawShockwaves() {

    for (const s of shockwaves) {

        const alpha =
            clamp(
                s.life /
                s.maxLife,
                0,
                1
            );

        ctx.strokeStyle =
            s.color.replace(
                ")",
                "," +
                alpha +
                ")"
            );

        ctx.globalAlpha =
            alpha;

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            s.x,
            s.y,
            s.radius,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }

    ctx.globalAlpha = 1;
}

/* =========================================================
   FLOATING TEXT DRAW
   ========================================================= */

function drawFloatingTexts() {

    for (const t of floatingTexts) {

        ctx.globalAlpha =
            clamp(
                t.life / 0.65,
                0,
                1
            );

        ctx.fillStyle =
            t.color;

        ctx.font =
            "bold 14px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            t.text,
            t.x,
            t.y
        );
    }

    ctx.globalAlpha = 1;
}

/* =========================================================
   LIGHTING
   ========================================================= */

function drawLighting() {

    const gradient =
        ctx.createRadialGradient(
            viewWidth / 2,
            viewHeight / 2,
            50,
            viewWidth / 2,
            viewHeight / 2,
            Math.max(
                viewWidth,
                viewHeight
            ) * 0.8
        );

    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    gradient.addColorStop(
        0.6,
        "rgba(0,0,0,0.18)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0.65)"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        viewWidth,
        viewHeight
    );
}

/* =========================================================
   RAIN DRAW
   ========================================================= */

function drawRain() {

    ctx.save();

    ctx.lineWidth = 1;

    for (const drop of rain) {

        ctx.strokeStyle =
            "rgba(150,210,230," +
            drop.alpha +
            ")";

        ctx.beginPath();

        ctx.moveTo(
            drop.x,
            drop.y
        );

        ctx.lineTo(
            drop.x - 4,
            drop.y + drop.length
        );

        ctx.stroke();
    }

    ctx.restore();
}

/* =========================================================
   VIGNETTE
   ========================================================= */

function drawScreenVignette() {

    const gradient =
        ctx.createRadialGradient(
            viewWidth / 2,
            viewHeight / 2,
            viewHeight * 0.15,
            viewWidth / 2,
            viewHeight / 2,
            viewHeight * 0.75
        );

    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0.45)"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        viewWidth,
        viewHeight
    );
}

/* =========================================================
   CROSSHAIR
   ========================================================= */

function drawCrosshair() {

    if (
        !game.running ||
        game.paused
    ) return;

    const size =
        mouse.down
            ? 11
            : 8;

    ctx.strokeStyle =
        "#dffcff";

    ctx.lineWidth = 1.5;

    ctx.beginPath();

    ctx.moveTo(
        mouse.x - size,
        mouse.y
    );

    ctx.lineTo(
        mouse.x + size,
        mouse.y
    );

    ctx.moveTo(
        mouse.x,
        mouse.y - size
    );

    ctx.lineTo(
        mouse.x,
        mouse.y + size
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        mouse.x,
        mouse.y,
        3,
        0,
        Math.PI * 2
    );

    ctx.stroke();
}

/* =========================================================
   MESSAGE
   ========================================================= */

function drawMessage() {

    if (
        game.messageTimer <= 0 ||
        !game.message
    ) return;

    ctx.save();

    ctx.textAlign =
        "center";

    ctx.font =
        "bold 15px Arial";

    ctx.fillStyle =
        "#dffcff";

    ctx.shadowBlur = 10;

    ctx.shadowColor =
        "#63e6ff";

    ctx.fillText(
        game.message,
        viewWidth / 2,
        viewHeight - 90
    );

    ctx.restore();
}

function showMessage(text) {

    game.message =
        String(text);

    game.messageTimer =
        2.5;
}

/* =========================================================
   WORLD MOUSE
   ========================================================= */

function mouseWorldX() {
    return (
        mouse.x +
        camera.x
    );
}

function mouseWorldY() {
    return (
        mouse.y +
        camera.y
    );
}

/* =========================================================
   HUD
   ========================================================= */

function updateHUD() {

    if (healthBar) {

        healthBar.style.width =
            (
                player.health /
                player.maxHealth *
                100
            ) +
            "%";
    }

    if (energyBar) {

        energyBar.style.width =
            (
                player.energy /
                player.maxEnergy *
                100
            ) +
            "%";
    }

    if (objectiveText) {

        objectiveText.textContent =
            game.objective;
    }

    if (zoneText) {

        zoneText.textContent =
            sectors[
                game.currentSector
            ]?.name ||
            "UNKNOWN SECTOR";
    }

    if (killsText) {

        killsText.textContent =
            "KILLS: " +
            game.kills;
    }

    if (creditsText) {

        creditsText.textContent =
            "CREDITS: " +
            game.credits;
    }

    if (ammoText) {

        const weapon =
            weapons[
                player.weaponIndex
            ];

        ammoText.textContent =
            weapon.name +
            " / ∞";
    }
}

/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

const achievements = {

    firstEcho: {
        name: "FIRST ECHO",
        description: "Defeat your first enemy."
    },

    tenEchoes: {
        name: "TEN ECHOES",
        description: "Defeat 10 enemies."
    },

    fiftyEchoes: {
        name: "FIFTY ECHOES",
        description: "Defeat 50 enemies."
    },

    firstSave: {
        name: "MEMORY CORE",
        description: "Save your first run."
    },

    traveler: {
        name: "LONG DISTANCE",
        description: "Travel 5,000 units."
    },

    survivor: {
        name: "SURVIVOR",
        description: "Reach wave 5."
    },

    guardian: {
        name: "SIGNAL BREAKER",
        description: "Defeat a Guardian."
    },

    hacker: {
        name: "CONNECTED",
        description: "Hack a terminal."
    },

    signal: {
        name: "THE SIGNAL",
        description: "Connect a signal relay."
    },

    levelFive: {
        name: "UPLINKED",
        description: "Reach level 5."
    },

    arsenal: {
        name: "FULL ARSENAL",
        description: "Unlock every weapon."
    },

    explorer: {
        name: "DEEP EXPLORER",
        description: "Reach another sector."
    },

    noFear: {
        name: "NO FEAR",
        description: "Defeat a boss without dying."
    },

    wealthy: {
        name: "SALVAGER",
        description: "Collect 1,000 credits."
    },

    master: {
        name: "ECHOBOUND",
        description: "Unlock 10 achievements."
    }
};

function unlockAchievement(id) {

    if (!achievements[id]) return;

    if (profile.achievements[id]) {
        return;
    }

    profile.achievements[id] =
        true;

    saveProfile();

    showAchievement(
        achievements[id]
    );

    const unlocked =
        Object.keys(
            profile.achievements
        ).length;

    if (
        unlocked >= 10 &&
        id !== "master"
    ) {

        setTimeout(() => {
            unlockAchievement("master");
        }, 500);
    }
}

function showAchievement(data) {

    if (!achievementPopup) return;

    const name =
        document.getElementById(
            "achievementName"
        );

    if (name) {
        name.textContent =
            data.name;
    }

    achievementPopup.classList.add(
        "show"
    );

    setTimeout(() => {

        achievementPopup.classList.remove(
            "show"
        );

    }, 3500);
}

/* =========================================================
   ACHIEVEMENT SCREEN
   ========================================================= */

function showAchievements() {

    removeDynamicPanel();

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "dynamicAchievements";

    panel.className =
        "dynamicPanel";

    panel.innerHTML = `
        <div class="dynamicPanelInner">
            <div class="dynamicTitle">
                ECHOBOUND
            </div>

            <h2>ACHIEVEMENTS</h2>

            <div class="achievementGrid"></div>

            <button class="dynamicButton" id="closeAchievements">
                BACK
            </button>
        </div>
    `;

    document.body.appendChild(
        panel
    );

    const grid =
        panel.querySelector(
            ".achievementGrid"
        );

    Object.entries(
        achievements
    ).forEach(
        ([id, achievement]) => {

            const unlocked =
                !!profile.achievements[id];

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "achievementCard " +
                (
                    unlocked
                        ? "unlocked"
                        : "locked"
                );

            card.innerHTML = `
                <div class="achievementIcon">
                    ${unlocked ? "◆" : "◇"}
                </div>

                <div>
                    <strong>
                        ${achievement.name}
                    </strong>

                    <span>
                        ${achievement.description}
                    </span>
                </div>
            `;

            grid.appendChild(card);
        }
    );

    panel.querySelector(
        "#closeAchievements"
    ).onclick = () => {

        panel.remove();

        if (menu) {
            menu.style.display =
                "flex";
        }
    };

    if (menu) {
        menu.style.display =
            "none";
    }
}

/* =========================================================
   CONTROLS SCREEN
   ========================================================= */

function showControls() {

    removeDynamicPanel();

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "dynamicControls";

    panel.className =
        "dynamicPanel";

    panel.innerHTML = `
        <div class="dynamicPanelInner controlsPanel">
            <div class="dynamicTitle">
                ECHOBOUND
            </div>

            <h2>CONTROLS</h2>

            <div class="controlRow">
                <b>W A S D</b>
                <span>MOVE</span>
            </div>

            <div class="controlRow">
                <b>MOUSE</b>
                <span>AIM</span>
            </div>

            <div class="controlRow">
                <b>LEFT CLICK</b>
                <span>FIRE</span>
            </div>

            <div class="controlRow">
                <b>SPACE</b>
                <span>DASH</span>
            </div>

            <div class="controlRow">
                <b>E</b>
                <span>INTERACT</span>
            </div>

            <div class="controlRow">
                <b>M</b>
                <span>MAP</span>
            </div>

            <div class="controlRow">
                <b>ESC</b>
                <span>PAUSE</span>
            </div>

            <div class="controlRow">
                <b>1 — 6</b>
                <span>CHANGE WEAPON</span>
            </div>

            <button class="dynamicButton" id="closeControls">
                BACK
            </button>
        </div>
    `;

    document.body.appendChild(
        panel
    );

    panel.querySelector(
        "#closeControls"
    ).onclick = () => {

        panel.remove();

        if (menu) {
            menu.style.display =
                "flex";
        }
    };

    if (menu) {
        menu.style.display =
            "none";
    }
}

/* =========================================================
   DYNAMIC CSS
   ========================================================= */

function injectExtendedCSS() {

    if (
        document.getElementById(
            "echoboundExtendedCSS"
        )
    ) return;

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "echoboundExtendedCSS";

    style.textContent = `
        .dynamicPanel {
            position:fixed;
            inset:0;
            z-index:1000;
            display:flex;
            align-items:center;
            justify-content:center;
            background:
                radial-gradient(
                    circle at center,
                    rgba(25,55,68,.92),
                    rgba(3,7,11,.98)
                );
            font-family:Arial,sans-serif;
            color:#e8fbff;
        }

        .dynamicPanelInner {
            width:min(1000px,90vw);
            max-height:88vh;
            overflow:auto;
            padding:42px;
            border:1px solid rgba(120,210,235,.3);
            background:
                linear-gradient(
                    145deg,
                    rgba(20,30,38,.97),
                    rgba(8,13,18,.98)
                );
            box-shadow:
                0 30px 100px rgba(0,0,0,.7),
                inset 0 0 50px rgba(80,200,230,.035);
        }

        .dynamicTitle {
            color:#63e6ff;
            letter-spacing:7px;
            font-size:12px;
            margin-bottom:5px;
        }

        .dynamicPanel h2 {
            margin-top:0;
            font-size:38px;
            letter-spacing:4px;
        }

        .achievementGrid {
            display:grid;
            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(280px,1fr)
                );
            gap:12px;
            margin:25px 0;
        }

        .achievementCard {
            display:flex;
            gap:15px;
            padding:18px;
            border:1px solid rgba(150,180,195,.16);
            background:rgba(255,255,255,.025);
            transition:.2s;
        }

        .achievementCard.unlocked {
            border-color:rgba(99,230,255,.45);
            background:rgba(99,230,255,.055);
        }

        .achievementCard.locked {
            opacity:.38;
        }

        .achievementIcon {
            font-size:27px;
            color:#63e6ff;
        }

        .achievementCard strong {
            display:block;
            letter-spacing:1px;
            margin-bottom:6px;
        }

        .achievementCard span {
            display:block;
            color:#9db0ba;
            font-size:13px;
            line-height:1.4;
        }

        .dynamicButton {
            width:100%;
            padding:15px;
            background:#13232c;
            color:#e8fbff;
            border:1px solid rgba(99,230,255,.4);
            cursor:pointer;
            font-weight:bold;
            letter-spacing:2px;
        }

        .dynamicButton:hover {
            background:#1c3845;
            border-color:#63e6ff;
        }

        .controlsPanel {
            max-width:650px;
        }

        .controlRow {
            display:flex;
            justify-content:space-between;
            padding:14px 4px;
            border-bottom:1px solid rgba(255,255,255,.08);
        }

        .controlRow b {
            color:#63e6ff;
        }

        .controlRow span {
            color:#a8b7be;
        }
    `;

    document.head.appendChild(
        style
    );
}

/* =========================================================
   REMOVE DYNAMIC PANEL
   ========================================================= */

function removeDynamicPanel() {

    const ids = [
        "dynamicAchievements",
        "dynamicControls",
        "dynamicGameOver",
        "dynamicSaveSlots"
    ];

    ids.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.remove();
        }
    });
}

/* =========================================================
   MAP
   ========================================================= */

function toggleMap() {

    if (!mapScreen) return;

    const visible =
        mapScreen.style.display ===
        "flex";

    mapScreen.style.display =
        visible
            ? "none"
            : "flex";

    if (!visible) {
        drawMap();
    }
}

function drawMap() {

    if (!mapCanvas || !mapCtx) {
        return;
    }

    const w =
        mapCanvas.width;

    const h =
        mapCanvas.height;

    mapCtx.clearRect(
        0,
        0,
        w,
        h
    );

    mapCtx.fillStyle =
        "#071016";

    mapCtx.fillRect(
        0,
        0,
        w,
        h
    );

    const scale =
        Math.min(
            w / WORLD.width,
            h / WORLD.height
        );

    mapCtx.save();

    mapCtx.translate(
        (w -
            WORLD.width *
            scale) /
            2,

        (h -
            WORLD.height *
            scale) /
            2
    );

    mapCtx.scale(
        scale,
        scale
    );

    for (const sector of sectors) {

        mapCtx.fillStyle =
            sector.name ===
            sectors[
                game.currentSector
            ].name
                ? "rgba(99,230,255,.15)"
                : "rgba(100,130,145,.05)";

        mapCtx.fillRect(
            sector.x,
            sector.y,
            sector.w,
            sector.h
        );

        mapCtx.strokeStyle =
            "rgba(130,180,195,.18)";

        mapCtx.strokeRect(
            sector.x,
            sector.y,
            sector.w,
            sector.h
        );
    }

    for (const wall of walls) {

        mapCtx.fillStyle =
            "#26343d";

        mapCtx.fillRect(
            wall.x,
            wall.y,
            wall.w,
            wall.h
        );
    }

    for (const enemy of enemies) {

        mapCtx.fillStyle =
            "#ff6479";

        mapCtx.beginPath();

        mapCtx.arc(
            enemy.x,
            enemy.y,
            Math.max(
                8,
                enemy.radius
            ),
            0,
            Math.PI * 2
        );

        mapCtx.fill();
    }

    mapCtx.fillStyle =
        "#63e6ff";

    mapCtx.beginPath();

    mapCtx.arc(
        player.x,
        player.y,
        18,
        0,
        Math.PI * 2
    );

    mapCtx.fill();

    for (const zone of missionZones) {

        if (zone.completed) continue;

        mapCtx.strokeStyle =
            "#63e6ff";

        mapCtx.beginPath();

        mapCtx.arc(
            zone.x,
            zone.y,
            zone.radius,
            0,
            Math.PI * 2
        );

        mapCtx.stroke();
    }

    mapCtx.restore();
}

/* =========================================================
   PAUSE
   ========================================================= */

function togglePause() {

    if (!game.running) {
        return;
    }

    game.paused =
        !game.paused;

    if (pauseScreen) {

        pauseScreen.style.display =
            game.paused
                ? "flex"
                : "none";
    }

    if (!game.paused) {
        initAudio();
    }
}

/* =========================================================
   GAME OVER
   ========================================================= */

function endGame() {

    if (game.gameOver) return;

    game.gameOver = true;

    game.running = false;

    mouse.down = false;

    for (const key in keys) {
        keys[key] = false;
    }

    if (
        game.kills >
        profile.bestKills
    ) {

        profile.bestKills =
            game.kills;
    }

    if (
        game.wave >
        profile.bestWave
    ) {

        profile.bestWave =
            game.wave;
    }

    saveProfile();

    showGameOver();

    sound(
        60,
        0.5,
        "sawtooth",
        0.06
    );
}

/* =========================================================
   GAME OVER SCREEN
   ========================================================= */

function showGameOver() {

    removeDynamicPanel();

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "dynamicGameOver";

    panel.className =
        "dynamicPanel";

    panel.innerHTML = `
        <div class="dynamicPanelInner"
             style="max-width:620px;text-align:center">

            <div class="dynamicTitle">
                SIGNAL LOST
            </div>

            <h2>RUN TERMINATED</h2>

            <div style="
                display:grid;
                grid-template-columns:
                    repeat(2,1fr);
                gap:12px;
                margin:25px 0;
            ">

                <div style="
                    padding:20px;
                    border:1px solid rgba(255,255,255,.1);
                ">
                    <small>WAVE</small>
                    <strong style="
                        display:block;
                        font-size:30px;
                        margin-top:8px;
                    ">
                        ${game.wave}
                    </strong>
                </div>

                <div style="
                    padding:20px;
                    border:1px solid rgba(255,255,255,.1);
                ">
                    <small>KILLS</small>
                    <strong style="
                        display:block;
                        font-size:30px;
                        margin-top:8px;
                    ">
                        ${game.kills}
                    </strong>
                </div>

                <div style="
                    padding:20px;
                    border:1px solid rgba(255,255,255,.1);
                ">
                    <small>CREDITS</small>
                    <strong style="
                        display:block;
                        font-size:30px;
                        margin-top:8px;
                    ">
                        ${game.credits}
                    </strong>
                </div>

                <div style="
                    padding:20px;
                    border:1px solid rgba(255,255,255,.1);
                ">
                    <small>SECTOR</small>
                    <strong style="
                        display:block;
                        font-size:18px;
                        margin-top:8px;
                    ">
                        ${
                            sectors[
                                game.currentSector
                            ].name
                        }
                    </strong>
                </div>
            </div>

            <button
                class="dynamicButton"
                id="retryRun">
                RETRY
            </button>

            <br><br>

            <button
                class="dynamicButton"
                id="gameOverMenu">
                MAIN MENU
            </button>
        </div>
    `;

    document.body.appendChild(
        panel
    );

    panel.querySelector(
        "#retryRun"
    ).onclick = () => {

        panel.remove();

        startNewGame();
    };

    panel.querySelector(
        "#gameOverMenu"
    ).onclick = () => {

        panel.remove();

        returnToMenu();
    };
}

/* =========================================================
   START NEW GAME
   ========================================================= */

function startNewGame() {

    initAudio();

    resetWorld();

    player.x = 450;
    player.y = 450;

    player.health =
        100 +
        profile.upgrades.health *
        15;

    player.maxHealth =
        100 +
        profile.upgrades.health *
        15;

    player.energy =
        100 +
        profile.upgrades.energy *
        15;

    player.maxEnergy =
        100 +
        profile.upgrades.energy *
        15;

    player.armor =
        25 +
        profile.upgrades.armor *
        10;

    player.maxArmor =
        25 +
        profile.upgrades.armor *
        10;

    player.speed =
        235 +
        profile.upgrades.speed *
        10;

    player.damageMultiplier =
        1 +
        profile.upgrades.damage *
        0.08;

    player.weaponIndex = 0;

    player.experience = 0;
    player.level = 1;

    game.running = true;
    game.paused = false;
    game.gameOver = false;

    game.time = 0;
    game.wave = 1;

    game.kills = 0;
    game.credits = 0;

    game.distanceTravelled = 0;

    game.currentSector = 0;

    game.objective =
        "FIND THE SIGNAL";

    game.signalProgress = 0;

    game.bossActive = false;

    game.saveSlot = 1;

    if (menu) {
        menu.style.display =
            "none";
    }

    if (pauseScreen) {
        pauseScreen.style.display =
            "none";
    }

    if (mapScreen) {
        mapScreen.style.display =
            "none";
    }

    removeDynamicPanel();

    spawnWave();

    showMessage(
        "SIGNAL DETECTED"
    );

    sound(
        500,
        0.12,
        "sine",
        0.04
    );
}

/* =========================================================
   RETURN MENU
   ========================================================= */

function returnToMenu() {

    game.running = false;
    game.paused = false;
    game.gameOver = false;

    mouse.down = false;

    for (const key in keys) {
        keys[key] = false;
    }

    if (pauseScreen) {
        pauseScreen.style.display =
            "none";
    }

    if (mapScreen) {
        mapScreen.style.display =
            "none";
    }

    removeDynamicPanel();

    if (menu) {
        menu.style.display =
            "flex";
    }
}

/* =========================================================
   HIDE SCREENS
   ========================================================= */

function hideAllScreens() {

    if (menu) {
        menu.style.display =
            "none";
    }

    if (pauseScreen) {
        pauseScreen.style.display =
            "none";
    }

    if (mapScreen) {
        mapScreen.style.display =
            "none";
    }

    removeDynamicPanel();
}

/* =========================================================
   SAVE SLOT SCREEN
   ========================================================= */

function showSaveSlots() {

    removeDynamicPanel();

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "dynamicSaveSlots";

    panel.className =
        "dynamicPanel";

    panel.innerHTML = `
        <div class="dynamicPanelInner"
             style="max-width:650px">

            <div class="dynamicTitle">
                ECHOBOUND
            </div>

            <h2>SAVE SLOTS</h2>

            <div id="slotList"></div>

            <button
                class="dynamicButton"
                id="closeSlots">
                BACK
            </button>
        </div>
    `;

    document.body.appendChild(
        panel
    );

    const list =
        panel.querySelector(
            "#slotList"
        );

    for (let slot = 1; slot <= 3; slot++) {

        const info =
            getSlotInfo(slot);

        const button =
            document.createElement(
                "button"
            );

        button.style.cssText = `
            width:100%;
            padding:18px;
            margin-bottom:10px;
            text-align:left;
            color:#e8fbff;
            background:rgba(255,255,255,.035);
            border:1px solid rgba(120,180,200,.2);
            cursor:pointer;
        `;

        if (info) {

            button.innerHTML = `
                <b>SLOT ${slot}</b>
                <br>
                WAVE ${info.wave}
                &nbsp; • &nbsp;
                KILLS ${info.kills}
                &nbsp; • &nbsp;
                CREDITS ${info.credits}
            `;

        } else {

            button.innerHTML = `
                <b>SLOT ${slot}</b>
                <br>
                EMPTY
            `;
        }

        button.onclick = () => {

            game.saveSlot =
                slot;

            saveRun(slot);

            panel.remove();
        };

        list.appendChild(
            button
        );
    }

    panel.querySelector(
        "#closeSlots"
    ).onclick = () => {

        panel.remove();
    };
}

/* =========================================================
   LOAD SLOT SCREEN
   ========================================================= */

function showLoadSlots() {

    removeDynamicPanel();

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "dynamicSaveSlots";

    panel.className =
        "dynamicPanel";

    panel.innerHTML = `
        <div class="dynamicPanelInner"
             style="max-width:650px">

            <div class="dynamicTitle">
                ECHOBOUND
            </div>

            <h2>CONTINUE</h2>

            <div id="loadSlotList"></div>

            <button
                class="dynamicButton"
                id="closeLoadSlots">
                BACK
            </button>
        </div>
    `;

    document.body.appendChild(
        panel
    );

    const list =
        panel.querySelector(
            "#loadSlotList"
        );

    for (let slot = 1; slot <= 3; slot++) {

        const info =
            getSlotInfo(slot);

        const button =
            document.createElement(
                "button"
            );

        button.style.cssText = `
            width:100%;
            padding:18px;
            margin-bottom:10px;
            text-align:left;
            color:#e8fbff;
            background:rgba(255,255,255,.035);
            border:1px solid rgba(120,180,200,.2);
            cursor:pointer;
        `;

        if (info) {

            button.innerHTML = `
                <b>SLOT ${slot}</b>
                <br>
                WAVE ${info.wave}
                &nbsp; • &nbsp;
                KILLS ${info.kills}
                &nbsp; • &nbsp;
                CREDITS ${info.credits}
            `;

            button.onclick = () => {

                panel.remove();

                loadRun(slot);
            };

        } else {

            button.innerHTML = `
                <b>SLOT ${slot}</b>
                <br>
                EMPTY
            `;

            button.disabled = true;
            button.style.opacity = "0.35";
            button.style.cursor = "default";
        }

        list.appendChild(
            button
        );
    }

    panel.querySelector(
        "#closeLoadSlots"
    ).onclick = () => {

        panel.remove();

        if (menu) {
            menu.style.display =
                "flex";
        }
    };

    if (menu) {
        menu.style.display =
            "none";
    }
}

/* =========================================================
   WEAPON EQUIP
   ========================================================= */

function equipWeapon(index) {

    if (!game.running) return;

    if (!profile.unlockedWeapons[index]) {

        showMessage(
            "WEAPON LOCKED"
        );

        return;
    }

    if (
        !weapons[index]
    ) return;

    player.weaponIndex =
        index;

    showMessage(
        weapons[index].name
    );

    checkArsenalAchievement();

    sound(
        500 + index * 80,
        0.05,
        "sine",
        0.025
    );
}

function checkArsenalAchievement() {

    const allUnlocked =
        profile.unlockedWeapons.every(
            value => value
        );

    if (allUnlocked) {
        unlockAchievement(
            "arsenal"
        );
    }
}

/* =========================================================
   WEAPON UNLOCKS
   ========================================================= */

function unlockWeaponsByProgress() {

    if (
        game.wave >= 4
    ) {

        profile.unlockedWeapons[3] =
            true;
    }

    if (
        game.wave >= 8
    ) {

        profile.unlockedWeapons[4] =
            true;
    }

    if (
        game.wave >= 12
    ) {

        profile.unlockedWeapons[5] =
            true;
    }

    saveProfile();

    checkArsenalAchievement();
}

/* =========================================================
   LEVEL SYSTEM
   ========================================================= */

function addExperience(amount) {

    player.experience += amount;

    const required =
        player.level *
        100;

    if (
        player.experience >=
        required
    ) {

        player.experience -=
            required;

        player.level++;

        player.maxHealth += 5;

        player.health =
            player.maxHealth;

        player.maxEnergy += 5;

        player.energy =
            player.maxEnergy;

        showMessage(
            "LEVEL UP — " +
            player.level
        );

        createSignalBurst(
            player.x,
            player.y
        );

        sound(
            700,
            0.18,
            "triangle",
            0.05
        );
    }
}

/* =========================================================
   AUTO LEVEL XP
   ========================================================= */

function awardEnemyXP(enemy) {

    const xp = {

        scout: 15,
        hunter: 25,
        guardian: 50,
        sniper: 40,
        drone: 30,
        elite: 100,
        boss: 500

    }[enemy.type] || 10;

    addExperience(xp);
}

/* =========================================================
   UPGRADE SYSTEM
   ========================================================= */

function upgradeStat(stat) {

    const cost =
        100 +
        profile.upgrades[stat] *
        100;

    if (
        game.credits <
        cost
    ) {

        showMessage(
            "NOT ENOUGH CREDITS"
        );

        return;
    }

    game.credits -= cost;

    profile.upgrades[stat]++;

    applyProfileUpgrades();

    saveProfile();

    showMessage(
        stat.toUpperCase() +
        " UPGRADED"
    );
}

function applyProfileUpgrades() {

    player.maxHealth =
        100 +
        profile.upgrades.health *
        15;

    player.maxEnergy =
        100 +
        profile.upgrades.energy *
        15;

    player.maxArmor =
        25 +
        profile.upgrades.armor *
        10;

    player.speed =
        235 +
        profile.upgrades.speed *
        10;

    player.damageMultiplier =
        1 +
        profile.upgrades.damage *
        0.08;

    player.health =
        clamp(
            player.health,
            0,
            player.maxHealth
        );

    player.energy =
        clamp(
            player.energy,
            0,
            player.maxEnergy
        );

    player.armor =
        clamp(
            player.armor,
            0,
            player.maxArmor
        );
}

/* =========================================================
   EVENT BUTTONS
   ========================================================= */

if (newGameButton) {

    newGameButton.addEventListener(
        "click",
        () => {

            initAudio();

            startNewGame();
        }
    );
}

if (loadGameButton) {

    loadGameButton.addEventListener(
        "click",
        () => {

            initAudio();

            showLoadSlots();
        }
    );
}

if (achievementsButton) {

    achievementsButton.addEventListener(
        "click",
        () => {

            showAchievements();
        }
    );
}

if (controlsButton) {

    controlsButton.addEventListener(
        "click",
        () => {

            showControls();
        }
    );
}

if (resumeButton) {

    resumeButton.addEventListener(
        "click",
        () => {

            togglePause();
        }
    );
}

if (saveButton) {

    saveButton.addEventListener(
        "click",
        () => {

            showSaveSlots();
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

            if (mapScreen) {
                mapScreen.style.display =
                    "none";
            }
        }
    );
}

/* =========================================================
   PERIODIC PROGRESS
   ========================================================= */

let progressTimer = 0;

function updateProgressSystems(dt) {

    progressTimer += dt;

    if (
        progressTimer < 1
    ) return;

    progressTimer = 0;

    unlockWeaponsByProgress();

    if (
        game.credits >=
        1000
    ) {

        unlockAchievement(
            "wealthy"
        );
    }

    applyProfileUpgrades();
}

/* =========================================================
   EXTEND UPDATE
   ========================================================= */

const originalUpdate =
    update;

function extendedUpdate(dt) {

    originalUpdate(dt);

    if (
        game.running &&
        !game.paused
    ) {

        updateProgressSystems(
            dt
        );

        for (const enemy of enemies) {

            if (!enemy.alive) continue;

            if (
                enemy.hitTimer > 0
            ) {

                enemy.hitTimer -=
                    dt;
            }
        }
    }
}

/* =========================================================
   LOOP
   ========================================================= */

let lastTime = performance.now();

function loop(timestamp) {

    const rawDt =
        (timestamp -
            lastTime) /
        1000;

    lastTime = timestamp;

    const dt =
        clamp(
            rawDt,
            0,
            0.05
        );

    extendedUpdate(dt);

    render();

    requestAnimationFrame(
        loop
    );
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

injectExtendedCSS();

resetWorld();

updateHUD();

if (menu) {
    menu.style.display =
        "flex";
}

if (pauseScreen) {
    pauseScreen.style.display =
        "none";
}

if (mapScreen) {
    mapScreen.style.display =
        "none";
}

/* =========================================================
   FIRST FRAME
   ========================================================= */

requestAnimationFrame(
    loop
);

/* =========================================================
   EXTRA SAFETY
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (game.running) {

            try {

                profile.bestKills =
                    Math.max(
                        profile.bestKills,
                        game.kills
                    );

                profile.bestWave =
                    Math.max(
                        profile.bestWave,
                        game.wave
                    );

                saveProfile();

            } catch {}
        }
    }
);

/* =========================================================
   DEBUG COMMANDS
   ========================================================= */

window.EchoBound = {

    start: startNewGame,

    save: saveRun,

    load: loadRun,

    achievements:
        showAchievements,

    controls:
        showControls,

    state: game,

    player,

    enemies,

    weapons,

    profile
};

})();
