(() => {
"use strict";

/* =========================================================
   ECHOBOUND — THE LOST SIGNAL
   EXPANDED EDITION
   ========================================================= */

if (window.__ECHOboundExpandedLoaded) return;
window.__ECHOboundExpandedLoaded = true;

/* =========================================================
   DOM
   ========================================================= */

const canvas = document.getElementById("game");
if (!canvas) return;

const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const pauseScreen = document.getElementById("pause");
const achievementBox = document.getElementById("achievement");
const mapScreen = document.getElementById("map");
const mapCanvas = document.getElementById("mapCanvas");

const newGameBtn = document.getElementById("newGame");
const loadGameBtn = document.getElementById("loadGame");
const achievementsBtn = document.getElementById("achievementsButton");
const controlsBtn = document.getElementById("controlsButton");

const resumeBtn = document.getElementById("resume");
const saveBtn = document.getElementById("save");
const quitBtn = document.getElementById("quit");

const closeMapBtn = document.getElementById("closeMap");

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

function resize() {
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;

    if (mapCanvas) {
        mapCanvas.width = Math.min(850, W - 80);
        mapCanvas.height = Math.min(620, H - 160);
    }
}

window.addEventListener("resize", resize);
resize();

/* =========================================================
   EXTRA CSS
   ========================================================= */

const extraStyle = document.createElement("style");

extraStyle.textContent = `
#game {
    image-rendering: auto;
}

#extraUI {
    position:fixed;
    inset:0;
    pointer-events:none;
    z-index:500;
    font-family:Arial,Helvetica,sans-serif;
}

.extraPanel {
    position:absolute;
    left:50%;
    top:50%;
    transform:translate(-50%,-50%);
    width:min(900px,90vw);
    max-height:85vh;
    overflow:auto;
    background:
        linear-gradient(135deg,rgba(10,16,25,.98),rgba(4,8,14,.98));
    border:1px solid rgba(120,190,255,.45);
    box-shadow:
        0 0 60px rgba(0,140,255,.12),
        inset 0 0 40px rgba(80,150,255,.04);
    padding:28px;
    pointer-events:auto;
    color:#dcecff;
}

.extraPanel h2 {
    margin-top:0;
    letter-spacing:5px;
    font-size:28px;
}

.extraPanel button,
.saveSlot {
    display:block;
    width:100%;
    box-sizing:border-box;
    margin:10px 0;
    padding:14px;
    background:linear-gradient(180deg,#162b40,#0b1725);
    border:1px solid #37658a;
    color:#d9efff;
    cursor:pointer;
    text-align:left;
}

.extraPanel button:hover,
.saveSlot:hover {
    background:linear-gradient(180deg,#21415d,#102237);
    border-color:#7dc8ff;
}

.panelClose {
    float:right;
    width:auto!important;
    padding:8px 14px!important;
}

.gridList {
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
    gap:10px;
}

.card {
    background:rgba(255,255,255,.035);
    border:1px solid rgba(120,180,220,.16);
    padding:14px;
}

.card.locked {
    opacity:.38;
}

.card strong {
    display:block;
    color:#fff;
    margin-bottom:6px;
}

#toast {
    position:absolute;
    left:50%;
    top:82%;
    transform:translate(-50%,0);
    padding:12px 22px;
    background:rgba(5,12,20,.92);
    border:1px solid rgba(100,200,255,.4);
    color:#dff4ff;
    opacity:0;
    transition:.25s;
}

#toast.show {
    opacity:1;
}

#bossBar {
    position:absolute;
    left:50%;
    top:72px;
    transform:translateX(-50%);
    width:min(650px,70vw);
    display:none;
}

#bossName {
    text-align:center;
    letter-spacing:4px;
    font-weight:bold;
    color:#ffb8b8;
    margin-bottom:5px;
}

#bossBarOuter {
    height:12px;
    background:#150a0a;
    border:1px solid #8b4d4d;
}

#bossBarInner {
    height:100%;
    width:100%;
    background:linear-gradient(90deg,#ff4d4d,#ff9b5e);
}

#inventoryMini {
    position:absolute;
    right:20px;
    bottom:75px;
    font-size:12px;
    color:#9eb7c9;
    text-align:right;
}

#levelText {
    position:absolute;
    left:50%;
    top:16px;
    transform:translateX(-50%);
    color:#b8dfff;
    font-size:12px;
    letter-spacing:2px;
}

@media(max-width:700px) {
    .extraPanel {
        padding:18px;
    }
}
`;

document.head.appendChild(extraStyle);

const extraUI = document.createElement("div");
extraUI.id = "extraUI";

const toast = document.createElement("div");
toast.id = "toast";

const bossBar = document.createElement("div");
bossBar.id = "bossBar";

bossBar.innerHTML = `
    <div id="bossName">BOSS</div>
    <div id="bossBarOuter">
        <div id="bossBarInner"></div>
    </div>
`;

const levelText = document.createElement("div");
levelText.id = "levelText";

const inventoryMini = document.createElement("div");
inventoryMini.id = "inventoryMini";

extraUI.appendChild(toast);
extraUI.appendChild(bossBar);
extraUI.appendChild(levelText);
extraUI.appendChild(inventoryMini);

document.body.appendChild(extraUI);

/* =========================================================
   GAME CONSTANTS
   ========================================================= */

const WORLD = {
    width: 4200,
    height: 4200
};

const SAVE_KEY = "echobound_expanded_v3";

const MAX_PARTICLES = 900;

const keys = {};
const mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

let camera = {
    x: 0,
    y: 0,
    shake: 0
};

let gameState = "menu";
let lastTime = performance.now();

let particles = [];
let bullets = [];
let enemyBullets = [];
let enemies = [];
let pickups = [];
let walls = [];
let doors = [];
let props = [];
let terminals = [];
let chests = [];
let beacons = [];
let floatingTexts = [];

let currentSector = 0;
let wave = 1;
let missionProgress = 0;
let missionTarget = 10;

let weather = {
    rain: true,
    intensity: 0.25
};

let worldTime = 0;

let unlockedAchievements = {};

let saveSlots = [
    null,
    null,
    null
];

let activeSaveSlot = 0;

/* =========================================================
   PLAYER
   ========================================================= */

const player = {
    x: 600,
    y: 600,

    w: 30,
    h: 30,

    speed: 230,

    maxHealth: 100,
    health: 100,

    maxEnergy: 100,
    energy: 100,

    armor: 0,

    level: 1,
    xp: 0,
    nextXP: 100,

    credits: 0,
    kills: 0,

    dashCooldown: 0,
    dashTimer: 0,

    invincible: 0,

    fireCooldown: 0,

    weapon: "pulse",

    weaponsUnlocked: {
        pulse: true,
        burst: false,
        heavy: false,
        shotgun: false,
        rail: false,
        plasma: false
    },

    inventory: {
        medkit: 2,
        energyCell: 2,
        armorPlate: 0,
        keycardA: 0,
        keycardB: 0,
        dataCore: 0
    },

    upgrades: {
        damage: 0,
        speed: 0,
        maxHealth: 0,
        maxEnergy: 0,
        dash: 0,
        armor: 0
    },

    visitedDistance: 0,
    lastX: 600,
    lastY: 600,

    signalFound: false,
    finalBossDefeated: false
};

/* =========================================================
   WEAPONS
   ========================================================= */

const weapons = {
    pulse: {
        name: "PULSE",
        damage: 18,
        speed: 800,
        cooldown: 0.22,
        spread: 0.025,
        bullets: 1,
        energy: 0,
        color: "#8bdcff",
        size: 4
    },

    burst: {
        name: "BURST",
        damage: 13,
        speed: 850,
        cooldown: 0.38,
        spread: 0.055,
        bullets: 3,
        energy: 2,
        color: "#9bffce",
        size: 3
    },

    heavy: {
        name: "HEAVY",
        damage: 48,
        speed: 670,
        cooldown: 0.75,
        spread: 0.02,
        bullets: 1,
        energy: 5,
        color: "#ffc56b",
        size: 7
    },

    shotgun: {
        name: "SHOTGUN",
        damage: 15,
        speed: 720,
        cooldown: 0.9,
        spread: 0.3,
        bullets: 7,
        energy: 5,
        color: "#ffdc9c",
        size: 4
    },

    rail: {
        name: "RAIL",
        damage: 105,
        speed: 1400,
        cooldown: 1.25,
        spread: 0,
        bullets: 1,
        energy: 14,
        color: "#c8eaff",
        size: 5
    },

    plasma: {
        name: "PLASMA",
        damage: 30,
        speed: 500,
        cooldown: 0.32,
        spread: 0.04,
        bullets: 1,
        energy: 8,
        color: "#dba8ff",
        size: 8
    }
};

/* =========================================================
   ENEMY TYPES
   ========================================================= */

const enemyTypes = {

    scout: {
        name: "SCOUT",
        hp: 45,
        speed: 95,
        damage: 8,
        radius: 17,
        color: "#6fd0ff",
        shoot: true,
        cooldown: 2.3
    },

    hunter: {
        name: "HUNTER",
        hp: 80,
        speed: 125,
        damage: 12,
        radius: 20,
        color: "#ffce69",
        shoot: true,
        cooldown: 1.7
    },

    guardian: {
        name: "GUARDIAN",
        hp: 170,
        speed: 55,
        damage: 18,
        radius: 27,
        color: "#ff7c7c",
        shoot: true,
        cooldown: 1.2
    },

    sniper: {
        name: "SNIPER",
        hp: 90,
        speed: 40,
        damage: 27,
        radius: 19,
        color: "#cda4ff",
        shoot: true,
        cooldown: 3.2
    },

    brute: {
        name: "BRUTE",
        hp: 260,
        speed: 38,
        damage: 26,
        radius: 34,
        color: "#ff9866",
        shoot: false,
        cooldown: 0
    },

    drone: {
        name: "DRONE",
        hp: 65,
        speed: 145,
        damage: 10,
        radius: 15,
        color: "#70ffd2",
        shoot: true,
        cooldown: 1.5
    }
};

/* =========================================================
   SECTORS
   ========================================================= */

const sectors = [
    {
        name: "SECTOR 01 — OUTER RING",
        color: "#5fa8d3",
        minX: 0,
        minY: 0,
        maxX: 1400,
        maxY: 1400
    },
    {
        name: "SECTOR 02 — INDUSTRIAL",
        color: "#d19a55",
        minX: 1400,
        minY: 0,
        maxX: 2800,
        maxY: 1400
    },
    {
        name: "SECTOR 03 — RESEARCH",
        color: "#b38cff",
        minX: 2800,
        minY: 0,
        maxX: 4200,
        maxY: 1400
    },
    {
        name: "SECTOR 04 — FLOOD ZONE",
        color: "#4ed5bd",
        minX: 0,
        minY: 1400,
        maxX: 1400,
        maxY: 2800
    },
    {
        name: "SECTOR 05 — UNDERGROUND",
        color: "#7888a8",
        minX: 1400,
        minY: 1400,
        maxX: 2800,
        maxY: 2800
    },
    {
        name: "SECTOR 06 — SIGNAL CORE",
        color: "#ff6c79",
        minX: 2800,
        minY: 1400,
        maxX: 4200,
        maxY: 2800
    },
    {
        name: "SECTOR 07 — DEAD CITY",
        color: "#a6a6a6",
        minX: 0,
        minY: 2800,
        maxX: 1400,
        maxY: 4200
    },
    {
        name: "SECTOR 08 — FINAL ARRAY",
        color: "#e7d36a",
        minX: 1400,
        minY: 2800,
        maxX: 2800,
        maxY: 4200
    },
    {
        name: "SECTOR 09 — THE SOURCE",
        color: "#ff668d",
        minX: 2800,
        minY: 2800,
        maxX: 4200,
        maxY: 4200
    }
];

/* =========================================================
   UTILITY
   ========================================================= */

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function randi(min, max) {
    return Math.floor(rand(min, max + 1));
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleTo(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
}

function rectsOverlap(a, b) {
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}

function circleRectCollision(cx, cy, radius, rect) {
    const closestX = clamp(cx, rect.x, rect.x + rect.w);
    const closestY = clamp(cy, rect.y, rect.y + rect.h);

    const dx = cx - closestX;
    const dy = cy - closestY;

    return dx * dx + dy * dy < radius * radius;
}

function pointInRect(x, y, r) {
    return (
        x >= r.x &&
        x <= r.x + r.w &&
        y >= r.y &&
        y <= r.y + r.h
    );
}

/* =========================================================
   AUDIO
   ========================================================= */

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            audioCtx = null;
        }
    }

    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

function beep(freq = 440, duration = 0.08, type = "sine", volume = 0.035) {
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = freq;

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

function soundShoot() {
    beep(180, 0.05, "square", 0.025);
}

function soundHit() {
    beep(90, 0.08, "sawtooth", 0.025);
}

function soundPickup() {
    beep(720, 0.07, "sine", 0.035);
    setTimeout(() => beep(980, 0.08, "sine", 0.025), 45);
}

function soundDash() {
    beep(250, 0.13, "triangle", 0.04);
}

function soundLevel() {
    beep(500, 0.08, "sine", 0.035);
    setTimeout(() => beep(700, 0.08, "sine", 0.035), 80);
    setTimeout(() => beep(950, 0.12, "sine", 0.035), 160);
}

function soundBoss() {
    beep(70, 0.4, "sawtooth", 0.05);
}

/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = 0;

function showToast(text) {
    toast.textContent = text;
    toast.classList.add("show");

    toastTimer = 2.5;
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
        name: "ECHO HUNTER",
        description: "Defeat 50 enemies."
    },

    explorer: {
        name: "EXPLORER",
        description: "Travel 5,000 meters."
    },

    deepExplorer: {
        name: "DEEP EXPLORER",
        description: "Reach Sector 06."
    },

    survivor: {
        name: "SURVIVOR",
        description: "Reach wave 5."
    },

    arsenal: {
        name: "ARSENAL",
        description: "Unlock every weapon."
    },

    rich: {
        name: "RESOURCEFUL",
        description: "Collect 1,000 credits."
    },

    levelFive: {
        name: "ADAPTED",
        description: "Reach level 5."
    },

    bossHunter: {
        name: "BOSS HUNTER",
        description: "Defeat a boss."
    },

    signal: {
        name: "THE SIGNAL",
        description: "Find the lost signal."
    },

    source: {
        name: "THE SOURCE",
        description: "Defeat the final boss."
    },

    survivorNoDash: {
        name: "LAST STAND",
        description: "Survive a boss encounter."
    }
};

function unlockAchievement(id) {
    if (unlockedAchievements[id]) return;

    if (!achievements[id]) return;

    unlockedAchievements[id] = true;

    const achievement = achievements[id];

    if (achievementBox) {
        const name = document.getElementById("achievementName");

        if (name) {
            name.textContent = achievement.name;
        }

        achievementBox.style.display = "block";

        setTimeout(() => {
            achievementBox.style.display = "";
        }, 3200);
    }

    showToast("ACHIEVEMENT: " + achievement.name);
    beep(900, 0.12, "sine", 0.04);

    savePersistentData();
}

/* =========================================================
   SAVE SYSTEM
   ========================================================= */

function persistentData() {
    return {
        unlockedAchievements
    };
}

function savePersistentData() {
    try {
        localStorage.setItem(
            SAVE_KEY + "_global",
            JSON.stringify(persistentData())
        );
    } catch (e) {}
}

function loadPersistentData() {
    try {
        const raw = localStorage.getItem(SAVE_KEY + "_global");

        if (raw) {
            const data = JSON.parse(raw);

            if (data.unlockedAchievements) {
                unlockedAchievements = data.unlockedAchievements;
            }
        }
    } catch (e) {}
}

function makeSaveData() {
    return {
        version: 3,

        player: JSON.parse(JSON.stringify(player)),

        currentSector,
        wave,
        missionProgress,
        missionTarget,

        doors: doors.map(d => ({
            x: d.x,
            y: d.y,
            w: d.w,
            h: d.h,
            locked: d.locked,
            open: d.open,
            key: d.key
        })),

        chests: chests.map(c => ({
            x: c.x,
            y: c.y,
            opened: c.opened
        })),

        terminals: terminals.map(t => ({
            x: t.x,
            y: t.y,
            used: t.used
        })),

        beacons: beacons.map(b => ({
            x: b.x,
            y: b.y,
            active: b.active
        })),

        timestamp: Date.now()
    };
}

function saveSlot(slot = activeSaveSlot) {
    saveSlots[slot] = makeSaveData();

    try {
        localStorage.setItem(
            SAVE_KEY + "_slot_" + slot,
            JSON.stringify(saveSlots[slot])
        );
    } catch (e) {}

    showToast("RUN SAVED — SLOT " + (slot + 1));
    unlockAchievement("firstSave");
}

function loadSlot(slot) {
    try {
        const raw = localStorage.getItem(
            SAVE_KEY + "_slot_" + slot
        );

        if (!raw) {
            showToast("NO SAVE IN SLOT " + (slot + 1));
            return false;
        }

        const data = JSON.parse(raw);

        applySaveData(data);

        activeSaveSlot = slot;

        showToast("SAVE LOADED — SLOT " + (slot + 1));

        return true;

    } catch (e) {
        console.error(e);
        showToast("SAVE COULD NOT BE LOADED");
        return false;
    }
}

function applySaveData(data) {

    if (data.player) {
        Object.assign(player, data.player);

        player.inventory = Object.assign({
            medkit: 0,
            energyCell: 0,
            armorPlate: 0,
            keycardA: 0,
            keycardB: 0,
            dataCore: 0
        }, player.inventory || {});

        player.weaponsUnlocked = Object.assign({
            pulse: true,
            burst: false,
            heavy: false,
            shotgun: false,
            rail: false,
            plasma: false
        }, player.weaponsUnlocked || {});

        player.upgrades = Object.assign({
            damage: 0,
            speed: 0,
            maxHealth: 0,
            maxEnergy: 0,
            dash: 0,
            armor: 0
        }, player.upgrades || {});
    }

    currentSector = data.currentSector || 0;
    wave = data.wave || 1;
    missionProgress = data.missionProgress || 0;
    missionTarget = data.missionTarget || 10;

    if (data.doors) {
        for (const savedDoor of data.doors) {
            const door = doors.find(
                d =>
                    Math.abs(d.x - savedDoor.x) < 2 &&
                    Math.abs(d.y - savedDoor.y) < 2
            );

            if (door) {
                door.locked = savedDoor.locked;
                door.open = savedDoor.open;
            }
        }
    }

    if (data.chests) {
        for (const savedChest of data.chests) {
            const chest = chests.find(
                c =>
                    Math.abs(c.x - savedChest.x) < 2 &&
                    Math.abs(c.y - savedChest.y) < 2
            );

            if (chest) {
                chest.opened = savedChest.opened;
            }
        }
    }

    if (data.terminals) {
        for (const savedTerminal of data.terminals) {
            const terminal = terminals.find(
                t =>
                    Math.abs(t.x - savedTerminal.x) < 2 &&
                    Math.abs(t.y - savedTerminal.y) < 2
            );

            if (terminal) {
                terminal.used = savedTerminal.used;
            }
        }
    }

    if (data.beacons) {
        for (const savedBeacon of data.beacons) {
            const beacon = beacons.find(
                b =>
                    Math.abs(b.x - savedBeacon.x) < 2 &&
                    Math.abs(b.y - savedBeacon.y) < 2
            );

            if (beacon) {
                beacon.active = savedBeacon.active;
            }
        }
    }
}

/* =========================================================
   WORLD GENERATION
   ========================================================= */

function createWall(x, y, w, h, type = "concrete") {
    walls.push({
        x,
        y,
        w,
        h,
        type,
        visible: true
    });
}

function createDoor(x, y, w, h, key = null) {
    doors.push({
        x,
        y,
        w,
        h,
        key,
        locked: !!key,
        open: false,
        progress: 0
    });
}

function createProp(x, y, type, size = 30) {
    props.push({
        x,
        y,
        type,
        size,
        rotation: rand(0, Math.PI * 2)
    });
}

function createTerminal(x, y, key = "A") {
    terminals.push({
        x,
        y,
        key,
        used: false
    });
}

function createChest(x, y) {
    chests.push({
        x,
        y,
        opened: false
    });
}

function createBeacon(x, y) {
    beacons.push({
        x,
        y,
        active: false
    });
}

function buildWorld() {

    walls = [];
    doors = [];
    props = [];
    terminals = [];
    chests = [];
    beacons = [];

    /* OUTER WALLS */

    createWall(0, 0, WORLD.width, 35);
    createWall(0, WORLD.height - 35, WORLD.width, 35);
    createWall(0, 0, 35, WORLD.height);
    createWall(WORLD.width - 35, 0, 35, WORLD.height);

    /* MAJOR SECTOR WALLS */

    createWall(1380, 0, 40, 1050);
    createWall(1380, 1150, 40, 1250);
    createWall(1380, 2550, 40, 1650);

    createWall(2780, 0, 40, 1400);
    createWall(2780, 1500, 40, 2700);

    createWall(0, 1380, 1050, 40);
    createWall(1150, 1380, 1250, 40);
    createWall(2550, 1380, 1650, 40);

    createWall(0, 2780, 1400, 40);
    createWall(1420, 2780, 1360, 40);
    createWall(2820, 2780, 1380, 40);

    /* SECTOR DOORS */

    createDoor(1380, 1050, 40, 100, "A");
    createDoor(2780, 1400, 40, 100, "B");
    createDoor(1400, 2780, 100, 40, "B");
    createDoor(2780, 2780, 100, 40, "C");

    /* SECTOR 1 */

    createWall(250, 220, 720, 40);
    createWall(250, 220, 40, 430);
    createWall(930, 220, 40, 430);

    createWall(250, 610, 240, 40);
    createWall(610, 610, 360, 40);

    createWall(460, 820, 650, 40);
    createWall(460, 820, 40, 310);
    createWall(1070, 820, 40, 310);

    createWall(180, 1080, 400, 40);
    createWall(750, 1050, 400, 40);

    /* SECTOR 2 */

    createWall(1650, 180, 850, 40);
    createWall(1650, 180, 40, 420);
    createWall(2460, 180, 40, 420);

    createWall(1550, 680, 400, 45);
    createWall(2150, 680, 350, 45);

    createWall(1600, 900, 700, 45);
    createWall(1600, 900, 45, 350);
    createWall(2255, 900, 45, 350);

    createWall(1700, 1150, 350, 40);
    createWall(2150, 1150, 350, 40);

    /* SECTOR 3 */

    createWall(3050, 220, 800, 40);
    createWall(3050, 220, 40, 480);
    createWall(3810, 220, 40, 480);

    createWall(3000, 760, 350, 45);
    createWall(3600, 760, 250, 45);

    createWall(3150, 980, 650, 45);
    createWall(3150, 980, 45, 300);
    createWall(3755, 980, 45, 300);

    createWall(3000, 1200, 400, 40);
    createWall(3500, 1200, 350, 40);

    /* SECTOR 4 */

    createWall(180, 1600, 650, 40);
    createWall(180, 1600, 40, 520);
    createWall(790, 1600, 40, 520);

    createWall(300, 2250, 500, 45);
    createWall(300, 2250, 45, 300);
    createWall(755, 2250, 45, 300);

    createWall(900, 1800, 350, 45);
    createWall(900, 2150, 350, 45);

    /* SECTOR 5 */

    createWall(1600, 1600, 850, 45);
    createWall(1600, 1600, 45, 400);
    createWall(2405, 1600, 45, 400);

    createWall(1500, 2150, 500, 45);
    createWall(2250, 2150, 250, 45);

    createWall(1600, 2350, 850, 45);
    createWall(1600, 2350, 45, 300);
    createWall(2405, 2350, 45, 300);

    /* SECTOR 6 */

    createWall(3000, 1600, 850, 45);
    createWall(3000, 1600, 45, 400);
    createWall(3805, 1600, 45, 400);

    createWall(2900, 2150, 450, 45);
    createWall(3500, 2150, 350, 45);

    createWall(3100, 2400, 700, 45);
    createWall(3100, 2400, 45, 250);
    createWall(3755, 2400, 45, 250);

    /* SECTOR 7 */

    createWall(180, 3000, 850, 45);
    createWall(180, 3000, 45, 500);
    createWall(985, 3000, 45, 500);

    createWall(250, 3650, 700, 45);
    createWall(250, 3350, 45, 345);
    createWall(905, 3350, 45, 345);

    /* SECTOR 8 */

    createWall(1600, 3000, 850, 45);
    createWall(1600, 3000, 45, 500);
    createWall(2405, 3000, 45, 500);

    createWall(1500, 3650, 900, 45);
    createWall(1500, 3350, 45, 345);
    createWall(2355, 3350, 45, 345);

    /* SECTOR 9 */

    createWall(3000, 3000, 850, 45);
    createWall(3000, 3000, 45, 500);
    createWall(3805, 3000, 45, 500);

    createWall(2900, 3650, 1000, 45);
    createWall(2900, 3350, 45, 345);
    createWall(3855, 3350, 45, 345);

    /* PROPS */

    const propTypes = [
        "crate",
        "container",
        "generator",
        "console",
        "lamp",
        "barrel",
        "debris"
    ];

    for (let i = 0; i < 220; i++) {

        const x = rand(100, WORLD.width - 100);
        const y = rand(100, WORLD.height - 100);

        const p = {
            x,
            y,
            w: rand(22, 55),
            h: rand(22, 55)
        };

        let blocked = false;

        for (const wall of walls) {
            if (rectsOverlap(p, wall)) {
                blocked = true;
                break;
            }
        }

        if (!blocked) {
            createProp(
                x,
                y,
                propTypes[randi(0, propTypes.length - 1)],
                rand(22, 55)
            );
        }
    }

    /* TERMINALS */

    createTerminal(550, 470, "A");
    createTerminal(1850, 480, "B");
    createTerminal(3300, 500, "C");

    /* CHESTS */

    createChest(1100, 1100);
    createChest(2400, 1100);
    createChest(3650, 1100);
    createChest(1000, 2500);
    createChest(2350, 2500);
    createChest(3650, 2500);
    createChest(1100, 3900);
    createChest(2300, 3900);

    /* BEACONS */

    createBeacon(650, 1100);
    createBeacon(2050, 1150);
    createBeacon(3400, 1150);
    createBeacon(700, 2500);
    createBeacon(2050, 2500);
    createBeacon(3450, 2500);
    createBeacon(700, 3900);
    createBeacon(2050, 3900);
    createBeacon(3400, 3900);
}

/* =========================================================
   COLLISION
   ========================================================= */

function solidWalls() {

    const result = [];

    for (const wall of walls) {
        result.push(wall);
    }

    for (const door of doors) {
        if (!door.open) {
            result.push(door);
        }
    }

    return result;
}

function collidesPlayer(x, y) {

    const box = {
        x: x - player.w / 2,
        y: y - player.h / 2,
        w: player.w,
        h: player.h
    };

    for (const wall of solidWalls()) {
        if (rectsOverlap(box, wall)) {
            return true;
        }
    }

    return false;
}

function movePlayer(dx, dy) {

    const nx = player.x + dx;

    if (!collidesPlayer(nx, player.y)) {
        player.x = nx;
    }

    const ny = player.y + dy;

    if (!collidesPlayer(player.x, ny)) {
        player.y = ny;
    }

    player.x = clamp(
        player.x,
        55,
        WORLD.width - 55
    );

    player.y = clamp(
        player.y,
        55,
        WORLD.height - 55
    );
}

function lineBlocked(x1, y1, x2, y2) {

    const steps = Math.ceil(
        Math.hypot(x2 - x1, y2 - y1) / 20
    );

    for (let i = 0; i <= steps; i++) {

        const t = i / steps;

        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;

        for (const wall of solidWalls()) {

            if (pointInRect(x, y, wall)) {
                return true;
            }
        }
    }

    return false;
}

/* =========================================================
   PLAYER RESET
   ========================================================= */

function resetPlayer() {

    player.x = 600;
    player.y = 600;

    player.health = player.maxHealth;
    player.energy = player.maxEnergy;

    player.armor =
        player.upgrades.armor * 10;

    player.dashCooldown = 0;
    player.dashTimer = 0;

    player.invincible = 0;
    player.fireCooldown = 0;

    player.kills = 0;
    player.credits = 0;

    player.level = 1;
    player.xp = 0;
    player.nextXP = 100;

    player.inventory = {
        medkit: 2,
        energyCell: 2,
        armorPlate: 0,
        keycardA: 0,
        keycardB: 0,
        dataCore: 0
    };

    player.weaponsUnlocked = {
        pulse: true,
        burst: false,
        heavy: false,
        shotgun: false,
        rail: false,
        plasma: false
    };

    player.upgrades = {
        damage: 0,
        speed: 0,
        maxHealth: 0,
        maxEnergy: 0,
        dash: 0,
        armor: 0
    };

    player.weapon = "pulse";

    player.visitedDistance = 0;
    player.lastX = player.x;
    player.lastY = player.y;

    player.signalFound = false;
    player.finalBossDefeated = false;
}

/* =========================================================
   START GAME
   ========================================================= */

function startNewGame() {

    initAudio();

    resetPlayer();

    currentSector = 0;
    wave = 1;
    missionProgress = 0;
    missionTarget = 10;

    bullets = [];
    enemyBullets = [];
    enemies = [];
    pickups = [];
    particles = [];
    floatingTexts = [];

    buildWorld();

    gameState = "playing";

    menu.style.display = "none";

    if (pauseScreen) {
        pauseScreen.style.display = "none";
    }

    if (mapScreen) {
        mapScreen.style.display = "none";
    }

    spawnInitialEnemies();

    showToast("MISSION STARTED");

    updateHUD();
}

/* =========================================================
   SPAWN ENEMIES
   ========================================================= */

function spawnInitialEnemies() {

    enemies = [];

    for (let i = 0; i < 12; i++) {
        spawnEnemyNearSector(0);
    }
}

function randomPositionInSector(sectorIndex) {

    const s = sectors[
        clamp(sectorIndex, 0, sectors.length - 1)
    ];

    for (let attempt = 0; attempt < 80; attempt++) {

        const x = rand(s.minX + 90, s.maxX - 90);
        const y = rand(s.minY + 90, s.maxY - 90);

        if (
            Math.hypot(
                x - player.x,
                y - player.y
            ) < 450
        ) {
            continue;
        }

        if (collidesPlayer(x, y)) {
            continue;
        }

        let blocked = false;

        for (const wall of walls) {
            if (circleRectCollision(x, y, 25, wall)) {
                blocked = true;
                break;
            }
        }

        if (!blocked) {
            return { x, y };
        }
    }

    return {
        x: s.minX + 150,
        y: s.minY + 150
    };
}

function spawnEnemy(type = null, sectorIndex = currentSector) {

    if (!type) {

        const roll = Math.random();

        if (wave >= 8 && roll < 0.08) {
            type = "brute";
        } else if (wave >= 5 && roll < 0.16) {
            type = "sniper";
        } else if (roll < 0.3) {
            type = "guardian";
        } else if (roll < 0.58) {
            type = "hunter";
        } else if (roll < 0.75) {
            type = "drone";
        } else {
            type = "scout";
        }
    }

    const template = enemyTypes[type];

    if (!template) return;

    const pos = randomPositionInSector(sectorIndex);

    const scale = 1 + (wave - 1) * 0.08;

    enemies.push({
        id: Math.random(),

        type,

        x: pos.x,
        y: pos.y,

        radius: template.radius,

        hp: template.hp * scale,
        maxHp: template.hp * scale,

        speed:
            template.speed *
            (1 + Math.min(0.4, wave * 0.015)),

        damage: template.damage,

        color: template.color,

        cooldown: rand(0.2, template.cooldown || 1),

        flash: 0,

        angle: rand(0, Math.PI * 2),

        phase: rand(0, Math.PI * 2),

        alive: true,

        elite: Math.random() < Math.min(0.1, wave * 0.01)
    });
}

function spawnEnemyNearSector(sectorIndex) {
    spawnEnemy(null, sectorIndex);
}

/* =========================================================
   BOSS
   ========================================================= */

function spawnBoss() {

    const sector = sectors[currentSector];

    const x =
        (sector.minX + sector.maxX) / 2;

    const y =
        (sector.minY + sector.maxY) / 2;

    const boss = {
        id: Math.random(),

        type: "boss",

        x,
        y,

        radius: 70,

        hp: 2200 + wave * 180,
        maxHp: 2200 + wave * 180,

        speed: 55,

        damage: 32,

        color: "#ff5577",

        cooldown: 0.5,

        flash: 0,

        phase: 0,

        alive: true,

        boss: true
    };

    enemies.push(boss);

    bossBar.style.display = "block";

    soundBoss();

    showToast("WARNING — HOSTILE SIGNAL DETECTED");

    unlockAchievement("bossHunter");
}

/* =========================================================
   PICKUPS
   ========================================================= */

function spawnPickup(x, y, type = null) {

    if (!type) {

        const roll = Math.random();

        if (roll < 0.25) {
            type = "credits";
        } else if (roll < 0.45) {
            type = "health";
        } else if (roll < 0.65) {
            type = "energy";
        } else if (roll < 0.8) {
            type = "armor";
        } else if (roll < 0.92) {
            type = "xp";
        } else {
            type = "weapon";
        }
    }

    pickups.push({
        x,
        y,
        type,
        amount:
            type === "credits" ? randi(15, 60) :
            type === "xp" ? randi(20, 50) :
            1,

        life: 30,
        phase: rand(0, Math.PI * 2)
    });
}

function collectPickup(pickup) {

    if (pickup.type === "credits") {

        player.credits += pickup.amount;

        if (player.credits >= 1000) {
            unlockAchievement("rich");
        }

        showToast("+" + pickup.amount + " CREDITS");
    }

    if (pickup.type === "health") {

        player.health = Math.min(
            player.maxHealth,
            player.health + 30
        );

        showToast("HEALTH RESTORED");
    }

    if (pickup.type === "energy") {

        player.energy = Math.min(
            player.maxEnergy,
            player.energy + 35
        );

        showToast("ENERGY RESTORED");
    }

    if (pickup.type === "armor") {

        player.inventory.armorPlate++;

        showToast("ARMOR PLATE");
    }

    if (pickup.type === "xp") {

        gainXP(pickup.amount);
    }

    if (pickup.type === "weapon") {

        unlockRandomWeapon();
    }

    soundPickup();
}

/* =========================================================
   WEAPON UNLOCK
   ========================================================= */

function unlockRandomWeapon() {

    const locked = Object.keys(
        player.weaponsUnlocked
    ).filter(k => !player.weaponsUnlocked[k]);

    if (locked.length === 0) {
        player.credits += 100;
        showToast("+100 CREDITS");
        return;
    }

    const weapon = locked[
        randi(0, locked.length - 1)
    ];

    player.weaponsUnlocked[weapon] = true;

    showToast(
        "WEAPON UNLOCKED: " +
        weapons[weapon].name
    );

    const allUnlocked = Object.values(
        player.weaponsUnlocked
    ).every(Boolean);

    if (allUnlocked) {
        unlockAchievement("arsenal");
    }
}

/* =========================================================
   XP
   ========================================================= */

function gainXP(amount) {

    player.xp += amount;

    while (player.xp >= player.nextXP) {

        player.xp -= player.nextXP;

        player.level++;

        player.nextXP =
            Math.floor(player.nextXP * 1.28);

        player.maxHealth += 5;
        player.maxEnergy += 5;

        player.health = player.maxHealth;
        player.energy = player.maxEnergy;

        showToast(
            "LEVEL UP — LEVEL " +
            player.level
        );

        soundLevel();

        if (player.level >= 5) {
            unlockAchievement("levelFive");
        }
    }
}

/* =========================================================
   SHOOTING
   ========================================================= */

function shoot() {

    if (gameState !== "playing") return;

    const weapon = weapons[player.weapon];

    if (!weapon) return;

    if (player.fireCooldown > 0) return;

    if (player.energy < weapon.energy) {
        showToast("NOT ENOUGH ENERGY");
        player.fireCooldown = 0.2;
        return;
    }

    player.energy -= weapon.energy;

    player.fireCooldown = weapon.cooldown;

    const worldMouseX =
        mouse.x + camera.x;

    const worldMouseY =
        mouse.y + camera.y;

    const baseAngle = Math.atan2(
        worldMouseY - player.y,
        worldMouseX - player.x
    );

    for (let i = 0; i < weapon.bullets; i++) {

        const angle =
            baseAngle +
            rand(
                -weapon.spread,
                weapon.spread
            );

        bullets.push({
            x: player.x,
            y: player.y,

            vx: Math.cos(angle) * weapon.speed,
            vy: Math.sin(angle) * weapon.speed,

            damage:
                weapon.damage +
                player.upgrades.damage * 5,

            size: weapon.size,

            color: weapon.color,

            life: 1.6,

            rail: player.weapon === "rail",

            plasma:
                player.weapon === "plasma"
        });
    }

    createMuzzleFlash(
        player.x +
        Math.cos(baseAngle) * 20,
        player.y +
        Math.sin(baseAngle) * 20,
        weapon.color
    );

    soundShoot();
}

/* =========================================================
   ENEMY SHOOTING
   ========================================================= */

function enemyShoot(enemy) {

    const a = angleTo(enemy, player);

    const speed =
        enemy.boss ? 360 :
        enemy.type === "sniper" ? 520 :
        enemy.type === "guardian" ? 360 :
        300;

    enemyBullets.push({
        x: enemy.x,
        y: enemy.y,

        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,

        damage:
            enemy.boss ? 24 :
            enemy.damage,

        size:
            enemy.boss ? 8 : 5,

        color:
            enemy.boss ? "#ff6688" : enemy.color,

        life: 4
    });
}

/* =========================================================
   PARTICLES
   ========================================================= */

function addParticle(p) {

    if (particles.length >= MAX_PARTICLES) {
        particles.shift();
    }

    particles.push(p);
}

function createMuzzleFlash(x, y, color) {

    for (let i = 0; i < 9; i++) {

        addParticle({
            x,
            y,

            vx: rand(-90, 90),
            vy: rand(-90, 90),

            size: rand(2, 6),

            life: rand(.12, .3),
            maxLife: .3,

            color
        });
    }

    camera.shake =
        Math.min(9, camera.shake + 2);
}

function createExplosion(x, y, color = "#8fdcff") {

    for (let i = 0; i < 30; i++) {

        const a = rand(0, Math.PI * 2);
        const speed = rand(30, 260);

        addParticle({
            x,
            y,

            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,

            size: rand(2, 7),

            life: rand(.3, .9),
            maxLife: .9,

            color
        });
    }

    camera.shake =
        Math.min(16, camera.shake + 5);
}

/* =========================================================
   DAMAGE
   ========================================================= */

function damagePlayer(amount) {

    if (player.invincible > 0) return;

    let damage = amount;

    if (player.armor > 0) {

        const absorbed =
            Math.min(
                player.armor,
                damage * 0.45
            );

        player.armor -= absorbed;
        damage -= absorbed;
    }

    damage *= 1 -
        Math.min(
            0.35,
            player.upgrades.armor * 0.03
        );

    player.health -= damage;

    player.invincible = 0.35;

    camera.shake =
        Math.min(
            15,
            camera.shake + 5
        );

    soundHit();

    if (player.health <= 0) {

        player.health = 0;

        gameOver();
    }
}

/* =========================================================
   ENEMY DEATH
   ========================================================= */

function killEnemy(enemy) {

    if (!enemy.alive) return;

    enemy.alive = false;

    player.kills++;

    missionProgress++;

    player.credits +=
        enemy.boss ? 400 :
        enemy.type === "brute" ? 60 :
        enemy.type === "guardian" ? 45 :
        20;

    gainXP(
        enemy.boss ? 500 :
        enemy.type === "brute" ? 80 :
        35
    );

    createExplosion(
        enemy.x,
        enemy.y,
        enemy.color
    );

    if (Math.random() < 0.7) {
        spawnPickup(
            enemy.x,
            enemy.y
        );
    }

    if (player.kills >= 1) {
        unlockAchievement("firstEcho");
    }

    if (player.kills >= 10) {
        unlockAchievement("tenEchoes");
    }

    if (player.kills >= 50) {
        unlockAchievement("fiftyEchoes");
    }

    if (enemy.boss) {

        bossBar.style.display = "none";

        player.signalFound = true;

        unlockAchievement("signal");

        showToast(
            "BOSS DEFEATED — SIGNAL RECOVERED"
        );

        createBeacon(
            enemy.x,
            enemy.y
        );

        if (currentSector >= 8) {

            player.finalBossDefeated = true;

            unlockAchievement("source");

            victory();
        }
    }
}

/* =========================================================
   BULLET UPDATE
   ========================================================= */

function updateBullets(dt) {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const b = bullets[i];

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        b.life -= dt;

        let remove = false;

        for (const wall of solidWalls()) {

            if (
                pointInRect(
                    b.x,
                    b.y,
                    wall
                )
            ) {

                createExplosion(
                    b.x,
                    b.y,
                    b.color
                );

                remove = true;
                break;
            }
        }

        if (remove) {
            bullets.splice(i, 1);
            continue;
        }

        for (const enemy of enemies) {

            if (!enemy.alive) continue;

            const dx =
                b.x - enemy.x;

            const dy =
                b.y - enemy.y;

            const r =
                enemy.radius + b.size;

            if (
                dx * dx +
                dy * dy <
                r * r
            ) {

                enemy.hp -= b.damage;

                enemy.flash = 0.1;

                floatingTexts.push({
                    x: enemy.x,
                    y: enemy.y - enemy.radius,
                    text: "-" + Math.round(b.damage),
                    life: .7
                });

                createMuzzleFlash(
                    b.x,
                    b.y,
                    b.color
                );

                if (enemy.hp <= 0) {
                    killEnemy(enemy);
                }

                remove = true;
                break;
            }
        }

        if (
            b.life <= 0 ||
            b.x < 0 ||
            b.y < 0 ||
            b.x > WORLD.width ||
            b.y > WORLD.height
        ) {
            remove = true;
        }

        if (remove) {
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

        const b = enemyBullets[i];

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        b.life -= dt;

        let remove = false;

        for (const wall of solidWalls()) {

            if (
                pointInRect(
                    b.x,
                    b.y,
                    wall
                )
            ) {
                remove = true;
                break;
            }
        }

        if (!remove) {

            const dx =
                b.x - player.x;

            const dy =
                b.y - player.y;

            if (
                dx * dx +
                dy * dy <
                (player.w / 2 + b.size) ** 2
            ) {

                damagePlayer(b.damage);

                remove = true;
            }
        }

        if (b.life <= 0) {
            remove = true;
        }

        if (remove) {
            enemyBullets.splice(i, 1);
        }
    }
}

/* =========================================================
   ENEMY UPDATE
   ========================================================= */

function updateEnemies(dt) {

    for (const enemy of enemies) {

        if (!enemy.alive) continue;

        enemy.phase += dt;

        if (enemy.flash > 0) {
            enemy.flash -= dt;
        }

        const dx =
            player.x - enemy.x;

        const dy =
            player.y - enemy.y;

        const dist =
            Math.hypot(dx, dy);

        if (dist > 1) {

            let desiredAngle =
                Math.atan2(dy, dx);

            if (enemy.type === "sniper") {

                if (dist < 600) {
                    desiredAngle += Math.PI;
                }

            } else if (enemy.type === "brute") {

                desiredAngle =
                    Math.atan2(dy, dx);

            } else {

                desiredAngle +=
                    Math.sin(
                        worldTime * 1.5 +
                        enemy.phase
                    ) * 0.15;
            }

            const speed =
                enemy.speed *
                (enemy.boss ? 0.8 : 1);

            const vx =
                Math.cos(desiredAngle) *
                speed *
                dt;

            const vy =
                Math.sin(desiredAngle) *
                speed *
                dt;

            const oldX = enemy.x;
            const oldY = enemy.y;

            enemy.x += vx;

            if (
                circleHitsWalls(
                    enemy.x,
                    enemy.y,
                    enemy.radius
                )
            ) {
                enemy.x = oldX;
            }

            enemy.y += vy;

            if (
                circleHitsWalls(
                    enemy.x,
                    enemy.y,
                    enemy.radius
                )
            ) {
                enemy.y = oldY;
            }
        }

        enemy.cooldown -= dt;

        if (
            enemy.cooldown <= 0 &&
            enemy.type !== "brute"
        ) {

            if (
                dist < 950 &&
                !lineBlocked(
                    enemy.x,
                    enemy.y,
                    player.x,
                    player.y
                )
            ) {

                enemyShoot(enemy);

                enemy.cooldown =
                    enemy.boss
                        ? rand(.35, .8)
                        : enemyTypes[enemy.type].cooldown;
            }
        }

        if (
            dist <
            enemy.radius +
            player.w / 2
        ) {

            damagePlayer(
                enemy.damage * dt
            );
        }

        if (enemy.boss) {
            updateBoss(enemy, dt);
        }
    }

    enemies =
        enemies.filter(e => e.alive);

    const desiredEnemyCount =
        10 + Math.min(18, wave * 2);

    if (
        enemies.length <
        desiredEnemyCount &&
        Math.random() < dt * 0.7
    ) {

        spawnEnemy(
            null,
            currentSector
        );
    }
}

function circleHitsWalls(x, y, radius) {

    for (const wall of solidWalls()) {

        if (
            circleRectCollision(
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

/* =========================================================
   BOSS UPDATE
   ========================================================= */

function updateBoss(boss, dt) {

    boss.phase += dt;

    if (
        Math.floor(boss.phase) %
        4 === 0
    ) {

        if (
            Math.random() <
            dt * 0.8
        ) {

            for (let i = 0; i < 8; i++) {

                const angle =
                    (Math.PI * 2 / 8) * i;

                enemyBullets.push({
                    x: boss.x,
                    y: boss.y,

                    vx: Math.cos(angle) * 250,
                    vy: Math.sin(angle) * 250,

                    damage: 15,

                    size: 7,

                    color: "#ff7b9c",

                    life: 3
                });
            }
        }
    }

    bossBar.style.display = "block";

    const inner =
        document.getElementById("bossBarInner");

    const name =
        document.getElementById("bossName");

    if (inner) {
        inner.style.width =
            clamp(
                boss.hp / boss.maxHp * 100,
                0,
                100
            ) + "%";
    }

    if (name) {
        name.textContent =
            "HOSTILE SIGNAL — " +
            Math.round(boss.hp) +
            " HP";
    }
}

/* =========================================================
   PLAYER UPDATE
   ========================================================= */

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;

    if (keys.KeyW || keys.w) dy -= 1;
    if (keys.KeyS || keys.s) dy += 1;
    if (keys.KeyA || keys.a) dx -= 1;
    if (keys.KeyD || keys.d) dx += 1;

    const length =
        Math.hypot(dx, dy);

    if (length > 0) {

        dx /= length;
        dy /= length;

        const speed =
            player.speed +
            player.upgrades.speed * 18;

        movePlayer(
            dx * speed * dt,
            dy * speed * dt
        );

        const travelled =
            Math.hypot(
                player.x - player.lastX,
                player.y - player.lastY
            );

        player.visitedDistance +=
            travelled;

        player.lastX = player.x;
        player.lastY = player.y;

        if (player.visitedDistance >= 5000) {
            unlockAchievement("explorer");
        }
    }

    if (player.fireCooldown > 0) {
        player.fireCooldown -= dt;
    }

    if (player.dashCooldown > 0) {
        player.dashCooldown -= dt;
    }

    if (player.dashTimer > 0) {
        player.dashTimer -= dt;
    }

    if (player.invincible > 0) {
        player.invincible -= dt;
    }

    player.energy =
        Math.min(
            player.maxEnergy,
            player.energy + dt * 7
        );

    if (mouse.down) {
        shoot();
    }

    if (keys.Space) {
        keys.Space = false;
        dash();
    }
}

/* =========================================================
   DASH
   ========================================================= */

function dash() {

    if (gameState !== "playing") return;

    if (player.dashCooldown > 0) return;

    if (player.energy < 18) return;

    let dx = 0;
    let dy = 0;

    if (keys.KeyW) dy--;
    if (keys.KeyS) dy++;
    if (keys.KeyA) dx--;
    if (keys.KeyD) dx++;

    if (dx === 0 && dy === 0) {

        const worldMouseX =
            mouse.x + camera.x;

        const worldMouseY =
            mouse.y + camera.y;

        const a =
            Math.atan2(
                worldMouseY - player.y,
                worldMouseX - player.x
            );

        dx = Math.cos(a);
        dy = Math.sin(a);

    } else {

        const l = Math.hypot(dx, dy);

        dx /= l;
        dy /= l;
    }

    const distance =
        150 +
        player.upgrades.dash * 35;

    const steps = 12;

    for (let i = 0; i < steps; i++) {

        movePlayer(
            dx * distance / steps,
            dy * distance / steps
        );
    }

    player.energy -= 18;
    player.dashCooldown =
        Math.max(
            0.7,
            2.3 -
            player.upgrades.dash * .25
        );

    player.invincible = .35;

    createExplosion(
        player.x,
        player.y,
        "#72d7ff"
    );

    soundDash();
}

/* =========================================================
   WORLD INTERACTION
   ========================================================= */

function interact() {

    if (gameState !== "playing") return;

    /* DOORS */

    for (const door of doors) {

        const d =
            Math.hypot(
                player.x - door.x,
                player.y - door.y
            );

        if (
            d < 100 &&
            !door.open
        ) {

            if (!door.locked) {

                door.open = true;

                showToast("DOOR OPEN");

                continue;
            }

            if (door.key === "A" &&
                player.inventory.keycardA > 0) {

                player.inventory.keycardA--;

                door.locked = false;
                door.open = true;

                showToast("ACCESS CARD A ACCEPTED");
                continue;
            }

            if (door.key === "B" &&
                player.inventory.keycardB > 0) {

                player.inventory.keycardB--;

                door.locked = false;
                door.open = true;

                showToast("ACCESS CARD B ACCEPTED");
                continue;
            }

            showToast(
                "ACCESS REQUIRED: " +
                door.key
            );
        }
    }

    /* TERMINALS */

    for (const terminal of terminals) {

        const d =
            Math.hypot(
                player.x - terminal.x,
                player.y - terminal.y
            );

        if (
            d < 90 &&
            !terminal.used
        ) {

            terminal.used = true;

            if (terminal.key === "A") {
                player.inventory.keycardA++;
            }

            if (terminal.key === "B") {
                player.inventory.keycardB++;
            }

            if (terminal.key === "C") {
                player.inventory.dataCore++;
            }

            player.credits += 100;

            showToast(
                "TERMINAL HACKED — ACCESS GRANTED"
            );

            beep(600, .12, "sine", .04);
        }
    }

    /* CHESTS */

    for (const chest of chests) {

        const d =
            Math.hypot(
                player.x - chest.x,
                player.y - chest.y
            );

        if (
            d < 80 &&
            !chest.opened
        ) {

            chest.opened = true;

            const reward =
                Math.random();

            if (reward < .25) {
                player.inventory.medkit++;
                showToast("MEDKIT FOUND");
            } else if (reward < .5) {
                player.inventory.energyCell++;
                showToast("ENERGY CELL FOUND");
            } else if (reward < .7) {
                player.inventory.armorPlate++;
                showToast("ARMOR PLATE FOUND");
            } else if (reward < .9) {
                player.credits += 150;
                showToast("+150 CREDITS");
            } else {
                unlockRandomWeapon();
            }

            soundPickup();
        }
    }

    /* BEACONS */

    for (const beacon of beacons) {

        const d =
            Math.hypot(
                player.x - beacon.x,
                player.y - beacon.y
            );

        if (
            d < 100 &&
            !beacon.active
        ) {

            beacon.active = true;

            player.health =
                player.maxHealth;

            player.energy =
                player.maxEnergy;

            showToast("SIGNAL BEACON ACTIVATED");

            if (
                currentSector === 5
            ) {
                unlockAchievement("deepExplorer");
            }
        }
    }
}

/* =========================================================
   CONSUMABLES
   ========================================================= */

function useMedkit() {

    if (
        player.inventory.medkit <= 0
    ) {
        showToast("NO MEDKITS");
        return;
    }

    if (
        player.health >= player.maxHealth
    ) {
        return;
    }

    player.inventory.medkit--;

    player.health =
        Math.min(
            player.maxHealth,
            player.health + 55
        );

    showToast("MEDKIT USED");
}

function useEnergyCell() {

    if (
        player.inventory.energyCell <= 0
    ) {
        showToast("NO ENERGY CELLS");
        return;
    }

    player.inventory.energyCell--;

    player.energy =
        Math.min(
            player.maxEnergy,
            player.energy + 60
        );

    showToast("ENERGY CELL USED");
}

/* =========================================================
   SECTOR DETECTION
   ========================================================= */

function updateSector() {

    for (let i = 0; i < sectors.length; i++) {

        const s = sectors[i];

        if (
            player.x >= s.minX &&
            player.x <= s.maxX &&
            player.y >= s.minY &&
            player.y <= s.maxY
        ) {

            if (currentSector !== i) {

                currentSector = i;

                showToast(
                    "ENTERED " +
                    s.name
                );

                if (i >= 5) {
                    unlockAchievement("deepExplorer");
                }

                if (i === 8) {

                    if (
                        !enemies.some(
                            e => e.boss
                        )
                    ) {
                        spawnBoss();
                    }
                }
            }

            break;
        }
    }
}

/* =========================================================
   WAVE SYSTEM
   ========================================================= */

function updateWave() {

    if (
        player.kills > 0 &&
        player.kills % 10 === 0
    ) {

        const newWave =
            Math.floor(player.kills / 10) + 1;

        if (newWave > wave) {

            wave = newWave;

            showToast(
                "WAVE " +
                wave +
                " INCOMING"
            );

            if (wave >= 5) {
                unlockAchievement("survivor");
            }
        }
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

        const p = pickups[i];

        p.life -= dt;
        p.phase += dt * 2;

        const d =
            Math.hypot(
                player.x - p.x,
                player.y - p.y
            );

        if (d < 55) {

            collectPickup(p);

            pickups.splice(i, 1);

            continue;
        }

        if (p.life <= 0) {
            pickups.splice(i, 1);
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
   FLOATING TEXT
   ========================================================= */

function updateFloatingTexts(dt) {

    for (
        let i = floatingTexts.length - 1;
        i >= 0;
        i--
    ) {

        const f =
            floatingTexts[i];

        f.y -= 30 * dt;
        f.life -= dt;

        if (f.life <= 0) {
            floatingTexts.splice(i, 1);
        }
    }
}

/* =========================================================
   WEATHER
   ========================================================= */

const rainDrops = [];

for (let i = 0; i < 350; i++) {

    rainDrops.push({
        x: Math.random(),
        y: Math.random(),
        speed: rand(.3, .9),
        length: rand(8, 22)
    });
}

function updateWeather(dt) {

    for (const drop of rainDrops) {

        drop.y +=
            drop.speed *
            weather.intensity *
            dt;

        drop.x +=
            0.08 *
            weather.intensity *
            dt;

        if (drop.y > 1) {
            drop.y = 0;
            drop.x = Math.random();
        }

        if (drop.x > 1) {
            drop.x = 0;
        }
    }
}

/* =========================================================
   CAMERA
   ========================================================= */

function updateCamera() {

    const targetX =
        player.x - W / 2;

    const targetY =
        player.y - H / 2;

    camera.x +=
        (targetX - camera.x) * .12;

    camera.y +=
        (targetY - camera.y) * .12;

    camera.x =
        clamp(
            camera.x,
            0,
            WORLD.width - W
        );

    camera.y =
        clamp(
            camera.y,
            0,
            WORLD.height - H
        );
}

/* =========================================================
   HUD
   ========================================================= */

function updateHUD() {

    if (healthBar) {

        healthBar.style.width =
            clamp(
                player.health /
                player.maxHealth *
                100,
                0,
                100
            ) + "%";
    }

    if (energyBar) {

        energyBar.style.width =
            clamp(
                player.energy /
                player.maxEnergy *
                100,
                0,
                100
            ) + "%";
    }

    if (killsText) {
        killsText.textContent =
            "KILLS: " + player.kills;
    }

    if (creditsText) {
        creditsText.textContent =
            "CREDITS: " + player.credits;
    }

    if (zoneText) {

        zoneText.textContent =
            sectors[currentSector]
                ?.name ||
            "UNKNOWN SECTOR";
    }

    if (ammoText) {

        const weapon =
            weapons[player.weapon];

        ammoText.textContent =
            weapon.name +
            " • ENERGY " +
            Math.floor(player.energy);
    }

    if (objectiveText) {

        if (player.finalBossDefeated) {

            objectiveText.textContent =
                "SIGNAL RESTORED";

        } else if (currentSector >= 8) {

            objectiveText.textContent =
                "DEFEAT THE SOURCE";

        } else if (!player.signalFound) {

            objectiveText.textContent =
                "FIND THE LOST SIGNAL";

        } else {

            objectiveText.textContent =
                "RETURN TO THE SIGNAL CORE";
        }
    }

    levelText.textContent =
        "LEVEL " +
        player.level +
        "  •  XP " +
        Math.floor(player.xp) +
        "/" +
        player.nextXP;

    inventoryMini.innerHTML =
        "MEDKIT " +
        player.inventory.medkit +
        " &nbsp; ENERGY CELL " +
        player.inventory.energyCell +
        " &nbsp; ARMOR " +
        Math.floor(player.armor);
}

/* =========================================================
   DRAW HELPERS
   ========================================================= */

function screenX(x) {
    return x - camera.x;
}

function screenY(y) {
    return y - camera.y;
}

function roundedRect(
    context,
    x,
    y,
    w,
    h,
    r
) {

    context.beginPath();

    context.moveTo(x + r, y);

    context.arcTo(
        x + w,
        y,
        x + w,
        y + h,
        r
    );

    context.arcTo(
        x + w,
        y + h,
        x,
        y + h,
        r
    );

    context.arcTo(
        x,
        y + h,
        x,
        y,
        r
    );

    context.arcTo(
        x,
        y,
        x + w,
        y,
        r
    );

    context.closePath();
}

/* =========================================================
   DRAW FLOOR
   ========================================================= */

function drawFloor() {

    ctx.fillStyle = "#071019";
    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    const grid = 80;

    const startX =
        Math.floor(camera.x / grid) *
        grid;

    const startY =
        Math.floor(camera.y / grid) *
        grid;

    ctx.lineWidth = 1;

    for (
        let x = startX;
        x < camera.x + W + grid;
        x += grid
    ) {

        const sx =
            x - camera.x;

        ctx.strokeStyle =
            "rgba(110,160,190,.055)";

        ctx.beginPath();

        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, H);

        ctx.stroke();
    }

    for (
        let y = startY;
        y < camera.y + H + grid;
        y += grid
    ) {

        const sy =
            y - camera.y;

        ctx.strokeStyle =
            "rgba(110,160,190,.055)";

        ctx.beginPath();

        ctx.moveTo(0, sy);
        ctx.lineTo(W, sy);

        ctx.stroke();
    }

    /* sector tint */

    const s = sectors[currentSector];

    if (s) {

        const x =
            s.minX - camera.x;

        const y =
            s.minY - camera.y;

        const w =
            s.maxX - s.minX;

        const h =
            s.maxY - s.minY;

        const gradient =
            ctx.createLinearGradient(
                x,
                y,
                x + w,
                y + h
            );

        gradient.addColorStop(
            0,
            "rgba(60,120,180,.045)"
        );

        gradient.addColorStop(
            1,
            "rgba(0,0,0,.08)"
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
            x,
            y,
            w,
            h
        );
    }
}

/* =========================================================
   DRAW PROPS
   ========================================================= */

function drawProps() {

    for (const p of props) {

        const x =
            screenX(p.x);

        const y =
            screenY(p.y);

        if (
            x < -100 ||
            y < -100 ||
            x > W + 100 ||
            y > H + 100
        ) continue;

        ctx.save();

        ctx.translate(x, y);
        ctx.rotate(p.rotation);

        ctx.shadowBlur = 12;
        ctx.shadowColor =
            "rgba(0,0,0,.5)";

        if (p.type === "crate") {

            ctx.fillStyle = "#35434d";

            ctx.fillRect(
                -p.size / 2,
                -p.size / 2,
                p.size,
                p.size
            );

            ctx.strokeStyle =
                "#71818b";

            ctx.strokeRect(
                -p.size / 2,
                -p.size / 2,
                p.size,
                p.size
            );

            ctx.beginPath();

            ctx.moveTo(
                -p.size / 2,
                -p.size / 2
            );

            ctx.lineTo(
                p.size / 2,
                p.size / 2
            );

            ctx.stroke();

        } else if (p.type === "container") {

            ctx.fillStyle = "#263642";

            ctx.fillRect(
                -p.size,
                -p.size / 2,
                p.size * 2,
                p.size
            );

            ctx.strokeStyle =
                "#58707d";

            ctx.strokeRect(
                -p.size,
                -p.size / 2,
                p.size * 2,
                p.size
            );

            for (
                let i = -1;
                i <= 1;
                i++
            ) {

                ctx.fillStyle =
                    "rgba(130,180,200,.12)";

                ctx.fillRect(
                    i * p.size * .45,
                    -p.size / 2,
                    2,
                    p.size
                );
            }

        } else if (p.type === "generator") {

            ctx.fillStyle = "#1a2730";

            ctx.fillRect(
                -p.size / 2,
                -p.size / 2,
                p.size,
                p.size
            );

            ctx.fillStyle = "#68dfff";

            ctx.fillRect(
                -p.size * .25,
                -p.size * .25,
                p.size * .5,
                p.size * .18
            );

            ctx.fillStyle =
                "rgba(90,220,255,.2)";

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                p.size * .8,
                0,
                Math.PI * 2
            );

            ctx.fill();

        } else if (p.type === "console") {

            ctx.fillStyle = "#17222d";

            ctx.fillRect(
                -p.size / 2,
                -p.size / 2,
                p.size,
                p.size
            );

            ctx.fillStyle = "#77e4ff";

            ctx.fillRect(
                -p.size * .28,
                -p.size * .2,
                p.size * .56,
                p.size * .3
            );

        } else if (p.type === "lamp") {

            ctx.fillStyle = "#252d32";

            ctx.fillRect(
                -3,
                -p.size,
                6,
                p.size
            );

            ctx.fillStyle = "#ffe9a0";

            ctx.beginPath();

            ctx.arc(
                0,
                -p.size,
                7,
                0,
                Math.PI * 2
            );

            ctx.fill();

        } else if (p.type === "barrel") {

            ctx.fillStyle = "#354550";

            ctx.fillRect(
                -p.size * .35,
                -p.size * .5,
                p.size * .7,
                p.size
            );

            ctx.strokeStyle =
                "#7a8e98";

            ctx.strokeRect(
                -p.size * .35,
                -p.size * .5,
                p.size * .7,
                p.size
            );

        } else {

            ctx.fillStyle = "#29333a";

            ctx.beginPath();

            ctx.moveTo(
                -p.size,
                p.size / 2
            );

            ctx.lineTo(
                -p.size / 2,
                -p.size
            );

            ctx.lineTo(
                p.size,
                -p.size / 3
            );

            ctx.lineTo(
                p.size / 2,
                p.size
            );

            ctx.closePath();

            ctx.fill();
        }

        ctx.restore();
    }
}

/* =========================================================
   DRAW WALLS
   ========================================================= */

function drawWalls() {

    for (const wall of walls) {

        const x =
            screenX(wall.x);

        const y =
            screenY(wall.y);

        if (
            x > W ||
            y > H ||
            x + wall.w < 0 ||
            y + wall.h < 0
        ) continue;

        const gradient =
            ctx.createLinearGradient(
                x,
                y,
                x,
                y + wall.h
            );

        gradient.addColorStop(
            0,
            "#34424c"
        );

        gradient.addColorStop(
            .5,
            "#202c34"
        );

        gradient.addColorStop(
            1,
            "#121a20"
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
            x,
            y,
            wall.w,
            wall.h
        );

        ctx.strokeStyle =
            "#627783";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            x,
            y,
            wall.w,
            wall.h
        );

        /* strong visible edge */

        ctx.strokeStyle =
            "rgba(130,220,255,.15)";

        ctx.lineWidth = 1;

        ctx.beginPath();

        if (wall.w > wall.h) {

            ctx.moveTo(
                x,
                y + 3
            );

            ctx.lineTo(
                x + wall.w,
                y + 3
            );

        } else {

            ctx.moveTo(
                x + 3,
                y
            );

            ctx.lineTo(
                x + 3,
                y + wall.h
            );
        }

        ctx.stroke();

        /* panels */

        ctx.strokeStyle =
            "rgba(0,0,0,.25)";

        if (wall.w > wall.h) {

            for (
                let px = x + 25;
                px < x + wall.w;
                px += 45
            ) {

                ctx.beginPath();

                ctx.moveTo(
                    px,
                    y + 5
                );

                ctx.lineTo(
                    px,
                    y + wall.h - 5
                );

                ctx.stroke();
            }

        } else {

            for (
                let py = y + 25;
                py < y + wall.h;
                py += 45
            ) {

                ctx.beginPath();

                ctx.moveTo(
                    x + 5,
                    py
                );

                ctx.lineTo(
                    x + wall.w - 5,
                    py
                );

                ctx.stroke();
            }
        }
    }

    /* DOORS */

    for (const door of doors) {

        const x =
            screenX(door.x);

        const y =
            screenY(door.y);

        if (door.open) {

            ctx.strokeStyle =
                "rgba(80,220,255,.25)";

            ctx.lineWidth = 3;

            ctx.strokeRect(
                x,
                y,
                door.w,
                door.h
            );

        } else {

            const g =
                ctx.createLinearGradient(
                    x,
                    y,
                    x + door.w,
                    y + door.h
                );

            g.addColorStop(
                0,
                "#553d46"
            );

            g.addColorStop(
                1,
                "#211b20"
            );

            ctx.fillStyle = g;

            ctx.fillRect(
                x,
                y,
                door.w,
                door.h
            );

            ctx.strokeStyle =
                door.locked
                    ? "#ff7474"
                    : "#6cdcff";

            ctx.lineWidth = 3;

            ctx.strokeRect(
                x,
                y,
                door.w,
                door.h
            );

            ctx.fillStyle =
                door.locked
                    ? "#ff7474"
                    : "#6cdcff";

            ctx.fillRect(
                x + door.w / 2 - 3,
                y + door.h / 2 - 3,
                6,
                6
            );
        }
    }
}

/* =========================================================
   DRAW TERMINALS / CHESTS / BEACONS
   ========================================================= */

function drawWorldObjects() {

    for (const t of terminals) {

        const x = screenX(t.x);
        const y = screenY(t.y);

        ctx.save();

        ctx.translate(x, y);

        ctx.fillStyle = "#172a35";

        ctx.fillRect(
            -18,
            -20,
            36,
            40
        );

        ctx.strokeStyle =
            t.used
                ? "#4b6672"
                : "#69dcff";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            -18,
            -20,
            36,
            40
        );

        ctx.fillStyle =
            t.used
                ? "#3d5962"
                : "#7de7ff";

        ctx.fillRect(
            -11,
            -8,
            22,
            11
        );

        ctx.restore();
    }

    for (const c of chests) {

        const x = screenX(c.x);
        const y = screenY(c.y);

        ctx.save();

        ctx.translate(x, y);

        ctx.fillStyle =
            c.opened
                ? "#343b3e"
                : "#8c7044";

        ctx.fillRect(
            -22,
            -15,
            44,
            30
        );

        ctx.strokeStyle =
            c.opened
                ? "#68777b"
                : "#d9b86a";

        ctx.strokeRect(
            -22,
            -15,
            44,
            30
        );

        if (!c.opened) {

            ctx.fillStyle =
                "#f0ce73";

            ctx.fillRect(
                -4,
                -3,
                8,
                7
            );
        }

        ctx.restore();
    }

    for (const b of beacons) {

        const x = screenX(b.x);
        const y = screenY(b.y);

        const pulse =
            10 +
            Math.sin(
                worldTime * 4
            ) * 3;

        ctx.save();

        ctx.globalAlpha =
            b.active ? .18 : .07;

        ctx.fillStyle =
            b.active
                ? "#64eaff"
                : "#55707d";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            35 + pulse,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.globalAlpha = 1;

        ctx.fillStyle =
            b.active
                ? "#70edff"
                : "#506875";

        ctx.fillRect(
            x - 7,
            y - 26,
            14,
            52
        );

        ctx.strokeStyle =
            b.active
                ? "#a7f5ff"
                : "#708993";

        ctx.strokeRect(
            x - 7,
            y - 26,
            14,
            52
        );

        ctx.restore();
    }
}

/* =========================================================
   DRAW PICKUPS
   ========================================================= */

function drawPickups() {

    for (const p of pickups) {

        const x =
            screenX(p.x);

        const y =
            screenY(p.y) +
            Math.sin(p.phase) * 5;

        let color = "#fff";

        if (p.type === "credits") {
            color = "#f3d45f";
        }

        if (p.type === "health") {
            color = "#6cffb1";
        }

        if (p.type === "energy") {
            color = "#69dfff";
        }

        if (p.type === "armor") {
            color = "#b7c4ff";
        }

        if (p.type === "xp") {
            color = "#d798ff";
        }

        if (p.type === "weapon") {
            color = "#ff9ce4";
        }

        ctx.save();

        ctx.shadowBlur = 18;
        ctx.shadowColor = color;

        ctx.fillStyle = color;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            9,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}

/* =========================================================
   DRAW ENEMIES
   ========================================================= */

function drawEnemies() {

    for (const e of enemies) {

        if (!e.alive) continue;

        const x =
            screenX(e.x);

        const y =
            screenY(e.y);

        if (
            x < -100 ||
            y < -100 ||
            x > W + 100 ||
            y > H + 100
        ) continue;

        ctx.save();

        ctx.translate(x, y);

        const color =
            e.flash > 0
                ? "#ffffff"
                : e.color;

        ctx.shadowBlur =
            e.boss ? 30 : 14;

        ctx.shadowColor = color;

        if (e.boss) {

            ctx.fillStyle =
                "rgba(255,70,110,.15)";

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                e.radius + 20 +
                Math.sin(worldTime * 4) * 5,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.fillStyle = color;

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                e.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.strokeStyle =
                "#ffd0d8";

            ctx.lineWidth = 3;

            ctx.stroke();

            ctx.fillStyle = "#1b0d13";

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
                "#ffb4c4";

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                8,
                0,
                Math.PI * 2
            );

            ctx.fill();

        } else {

            ctx.fillStyle = color;

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                e.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.fillStyle =
                "rgba(10,20,25,.75)";

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                e.radius * .55,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.strokeStyle =
                "rgba(220,250,255,.55)";

            ctx.lineWidth = 2;

            ctx.stroke();

            /* eye/core */

            ctx.fillStyle = color;

            ctx.beginPath();

            ctx.arc(
                Math.cos(e.angle) *
                e.radius * .5,

                Math.sin(e.angle) *
                e.radius * .5,

                5,

                0,
                Math.PI * 2
            );

            ctx.fill();
        }

        ctx.restore();

        /* health bar */

        if (
            e.hp < e.maxHp &&
            !e.boss
        ) {

            const bw =
                e.radius * 2;

            const bh = 4;

            const bx =
                x - bw / 2;

            const by =
                y - e.radius - 12;

            ctx.fillStyle =
                "rgba(0,0,0,.65)";

            ctx.fillRect(
                bx,
                by,
                bw,
                bh
            );

            ctx.fillStyle =
                e.color;

            ctx.fillRect(
                bx,
                by,
                bw *
                clamp(
                    e.hp /
                    e.maxHp,
                    0,
                    1
                ),
                bh
            );
        }
    }
}

/* =========================================================
   DRAW PLAYER
   ========================================================= */

function drawPlayer() {

    const x =
        screenX(player.x);

    const y =
        screenY(player.y);

    const worldMouseX =
        mouse.x + camera.x;

    const worldMouseY =
        mouse.y + camera.y;

    const angle =
        Math.atan2(
            worldMouseY - player.y,
            worldMouseX - player.x
        );

    ctx.save();

    ctx.translate(x, y);

    ctx.rotate(angle);

    const flash =
        player.invincible > 0 &&
        Math.floor(
            worldTime * 25
        ) % 2 === 0;

    ctx.shadowBlur = 22;

    ctx.shadowColor =
        flash
            ? "#ffffff"
            : "#63dfff";

    /* outer suit */

    ctx.fillStyle =
        flash
            ? "#ffffff"
            : "#406579";

    roundedRect(
        ctx,
        -17,
        -14,
        34,
        28,
        8
    );

    ctx.fill();

    ctx.strokeStyle =
        "#a5eaff";

    ctx.lineWidth = 2;

    ctx.stroke();

    /* armor plate */

    ctx.fillStyle =
        "#263b49";

    roundedRect(
        ctx,
        -11,
        -10,
        22,
        20,
        5
    );

    ctx.fill();

    /* visor */

    ctx.fillStyle =
        "#8ceaff";

    ctx.fillRect(
        2,
        -7,
        12,
        14
    );

    /* weapon */

    ctx.fillStyle =
        weapons[player.weapon].color;

    ctx.fillRect(
        8,
        -3,
        25,
        6
    );

    ctx.restore();

    /* energy ring */

    ctx.save();

    ctx.globalAlpha = .18;

    ctx.strokeStyle =
        "#64ddff";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        27 +
        Math.sin(worldTime * 5) * 2,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
}

/* =========================================================
   DRAW BULLETS
   ========================================================= */

function drawBullets() {

    for (const b of bullets) {

        const x =
            screenX(b.x);

        const y =
            screenY(b.y);

        ctx.save();

        ctx.shadowBlur =
            b.rail ? 25 : 12;

        ctx.shadowColor =
            b.color;

        ctx.fillStyle =
            b.color;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            b.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }

    for (const b of enemyBullets) {

        const x =
            screenX(b.x);

        const y =
            screenY(b.y);

        ctx.save();

        ctx.shadowBlur = 15;
        ctx.shadowColor = b.color;

        ctx.fillStyle = b.color;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            b.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
}

/* =========================================================
   DRAW PARTICLES
   ========================================================= */

function drawParticles() {

    for (const p of particles) {

        const x =
            screenX(p.x);

        const y =
            screenY(p.y);

        const alpha =
            clamp(
                p.life /
                p.maxLife,
                0,
                1
            );

        ctx.globalAlpha = alpha;

        ctx.fillStyle = p.color;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}

/* =========================================================
   DRAW LIGHTING
   ========================================================= */

function drawLighting() {

    const darkness =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            80,
            W / 2,
            H / 2,
            Math.max(W, H) * .72
        );

    darkness.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    darkness.addColorStop(
        .5,
        "rgba(0,0,0,.08)"
    );

    darkness.addColorStop(
        1,
        "rgba(0,0,0,.58)"
    );

    ctx.fillStyle = darkness;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    /* player light */

    const px =
        screenX(player.x);

    const py =
        screenY(player.y);

    const light =
        ctx.createRadialGradient(
            px,
            py,
            10,
            px,
            py,
            350
        );

    light.addColorStop(
        0,
        "rgba(80,210,255,.11)"
    );

    light.addColorStop(
        .4,
        "rgba(40,130,180,.045)"
    );

    light.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    ctx.fillStyle = light;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    /* beacons */

    for (const b of beacons) {

        if (!b.active) continue;

        const x =
            screenX(b.x);

        const y =
            screenY(b.y);

        const g =
            ctx.createRadialGradient(
                x,
                y,
                0,
                x,
                y,
                220
            );

        g.addColorStop(
            0,
            "rgba(90,230,255,.12)"
        );

        g.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );

        ctx.fillStyle = g;

        ctx.fillRect(
            x - 220,
            y - 220,
            440,
            440
        );
    }
}

/* =========================================================
   DRAW RAIN
   ========================================================= */

function drawRain() {

    if (!weather.rain) return;

    ctx.strokeStyle =
        "rgba(120,190,230,.16)";

    ctx.lineWidth = 1;

    for (const drop of rainDrops) {

        const x =
            drop.x * W;

        const y =
            drop.y * H;

        ctx.beginPath();

        ctx.moveTo(
            x,
            y
        );

        ctx.lineTo(
            x - 4,
            y + drop.length
        );

        ctx.stroke();
    }
}

/* =========================================================
   DRAW FOG
   ========================================================= */

function drawFog() {

    const fog =
        ctx.createRadialGradient(
            W * .5,
            H * .5,
            100,
            W * .5,
            H * .5,
            Math.max(W, H) * .75
        );

    fog.addColorStop(
        0,
        "rgba(90,120,140,.015)"
    );

    fog.addColorStop(
        1,
        "rgba(90,120,140,.13)"
    );

    ctx.fillStyle = fog;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );
}

/* =========================================================
   CROSSHAIR
   ========================================================= */

function drawCrosshair() {

    if (gameState !== "playing") return;

    const x = mouse.x;
    const y = mouse.y;

    ctx.save();

    ctx.strokeStyle =
        "rgba(170,235,255,.9)";

    ctx.lineWidth = 1.5;

    ctx.beginPath();

    ctx.moveTo(x - 14, y);
    ctx.lineTo(x - 5, y);

    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 14, y);

    ctx.moveTo(x, y - 14);
    ctx.lineTo(x, y - 5);

    ctx.moveTo(x, y + 5);
    ctx.lineTo(x, y + 14);

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        4,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
}

/* =========================================================
   FLOATING TEXT DRAW
   ========================================================= */

function drawFloatingTexts() {

    ctx.textAlign = "center";
    ctx.font =
        "bold 14px Arial";

    for (const f of floatingTexts) {

        const x =
            screenX(f.x);

        const y =
            screenY(f.y);

        ctx.globalAlpha =
            clamp(
                f.life / .7,
                0,
                1
            );

        ctx.fillStyle =
            "#ffffff";

        ctx.fillText(
            f.text,
            x,
            y
        );
    }

    ctx.globalAlpha = 1;
}

/* =========================================================
   MAP
   ========================================================= */

function drawMap() {

    if (!mapCanvas) return;

    const mctx =
        mapCanvas.getContext("2d");

    const mw =
        mapCanvas.width;

    const mh =
        mapCanvas.height;

    mctx.clearRect(
        0,
        0,
        mw,
        mh
    );

    mctx.fillStyle =
        "#071019";

    mctx.fillRect(
        0,
        0,
        mw,
        mh
    );

    const sx =
        mw / WORLD.width;

    const sy =
        mh / WORLD.height;

    for (
        let i = 0;
        i < sectors.length;
        i++
    ) {

        const s = sectors[i];

        mctx.fillStyle =
            i === currentSector
                ? "rgba(100,190,255,.22)"
                : "rgba(80,100,120,.10)";

        mctx.fillRect(
            s.minX * sx,
            s.minY * sy,
            (s.maxX - s.minX) * sx,
            (s.maxY - s.minY) * sy
        );

        mctx.strokeStyle =
            "rgba(130,190,220,.25)";

        mctx.strokeRect(
            s.minX * sx,
            s.minY * sy,
            (s.maxX - s.minX) * sx,
            (s.maxY - s.minY) * sy
        );

        mctx.fillStyle =
            "#829baa";

        mctx.font =
            "11px Arial";

        mctx.fillText(
            "S" + (i + 1),
            (s.minX + 30) * sx,
            (s.minY + 20) * sy
        );
    }

    for (const wall of walls) {

        mctx.fillStyle =
            "rgba(170,190,200,.35)";

        mctx.fillRect(
            wall.x * sx,
            wall.y * sy,
            wall.w * sx,
            wall.h * sy
        );
    }

    for (const b of beacons) {

        mctx.fillStyle =
            b.active
                ? "#65eaff"
                : "#45616d";

        mctx.beginPath();

        mctx.arc(
            b.x * sx,
            b.y * sy,
            4,
            0,
            Math.PI * 2
        );

        mctx.fill();
    }

    mctx.fillStyle =
        "#ffffff";

    mctx.beginPath();

    mctx.arc(
        player.x * sx,
        player.y * sy,
        6,
        0,
        Math.PI * 2
    );

    mctx.fill();

    for (const e of enemies) {

        if (!e.alive) continue;

        mctx.fillStyle =
            e.boss
                ? "#ff5c79"
                : "#e56f6f";

        mctx.beginPath();

        mctx.arc(
            e.x * sx,
            e.y * sy,
            e.boss ? 5 : 2,
            0,
            Math.PI * 2
        );

        mctx.fill();
    }
}

/* =========================================================
   ACHIEVEMENT PANEL
   ========================================================= */

function showAchievements() {

    closeExtraPanel();

    const panel =
        document.createElement("div");

    panel.className =
        "extraPanel";

    panel.id =
        "dynamicPanel";

    panel.innerHTML = `
        <button class="panelClose">CLOSE</button>
        <h2>ACHIEVEMENTS</h2>
        <div class="gridList">
            ${Object.entries(achievements)
                .map(([id, a]) => `
                    <div class="card ${
                        unlockedAchievements[id]
                            ? ""
                            : "locked"
                    }">
                        <strong>
                            ${
                                unlockedAchievements[id]
                                    ? "✓ "
                                    : "○ "
                            }${a.name}
                        </strong>
                        <span>${a.description}</span>
                    </div>
                `)
                .join("")}
        </div>
    `;

    extraUI.appendChild(panel);

    panel
        .querySelector(".panelClose")
        .addEventListener(
            "click",
            closeExtraPanel
        );
}

function showControls() {

    closeExtraPanel();

    const panel =
        document.createElement("div");

    panel.className =
        "extraPanel";

    panel.id =
        "dynamicPanel";

    panel.innerHTML = `
        <button class="panelClose">CLOSE</button>
        <h2>CONTROLS</h2>

        <div class="gridList">

            <div class="card">
                <strong>MOVE</strong>
                WASD
            </div>

            <div class="card">
                <strong>AIM</strong>
                Mouse
            </div>

            <div class="card">
                <strong>SHOOT</strong>
                Left mouse button
            </div>

            <div class="card">
                <strong>DASH</strong>
                Space
            </div>

            <div class="card">
                <strong>INTERACT</strong>
                E
            </div>

            <div class="card">
                <strong>MAP</strong>
                M
            </div>

            <div class="card">
                <strong>MEDKIT</strong>
                Q
            </div>

            <div class="card">
                <strong>ENERGY CELL</strong>
                R
            </div>

            <div class="card">
                <strong>WEAPON</strong>
                1–6
            </div>

            <div class="card">
                <strong>PAUSE</strong>
                Escape
            </div>

        </div>
    `;

    extraUI.appendChild(panel);

    panel
        .querySelector(".panelClose")
        .addEventListener(
            "click",
            closeExtraPanel
        );
}

/* =========================================================
   SAVE PANEL
   ========================================================= */

function showSaveSlots() {

    closeExtraPanel();

    const panel =
        document.createElement("div");

    panel.className =
        "extraPanel";

    panel.id =
        "dynamicPanel";

    let html = `
        <button class="panelClose">CLOSE</button>
        <h2>SAVE SLOTS</h2>
    `;

    for (let i = 0; i < 3; i++) {

        let data = null;

        try {

            const raw =
                localStorage.getItem(
                    SAVE_KEY + "_slot_" + i
                );

            if (raw) {
                data = JSON.parse(raw);
            }

        } catch (e) {}

        if (data) {

            html += `
                <button
                    class="saveSlot"
                    data-slot="${i}"
                >
                    SLOT ${i + 1}
                    <br>
                    Sector ${
                        (data.currentSector || 0) + 1
                    }
                    • Level ${
                        data.player?.level || 1
                    }
                    • Kills ${
                        data.player?.kills || 0
                    }
                    <br>
                    ${new Date(
                        data.timestamp
                    ).toLocaleString()}
                </button>
            `;

        } else {

            html += `
                <button
                    class="saveSlot"
                    data-slot="${i}"
                >
                    SLOT ${i + 1}
                    <br>
                    EMPTY
                </button>
            `;
        }
    }

    panel.innerHTML = html;

    extraUI.appendChild(panel);

    panel
        .querySelector(".panelClose")
        .addEventListener(
            "click",
            closeExtraPanel
        );

    panel
        .querySelectorAll(".saveSlot")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const slot =
                        Number(
                            button.dataset.slot
                        );

                    if (gameState === "playing") {

                        activeSaveSlot =
                            slot;

                        saveSlot(slot);

                        showSaveSlots();

                    } else {

                        if (
                            loadSlot(slot)
                        ) {

                            gameState =
                                "playing";

                            menu.style.display =
                                "none";

                            closeExtraPanel();

                            spawnInitialEnemies();
                        }
                    }
                }
            );
        });
}

/* =========================================================
   INVENTORY PANEL
   ========================================================= */

function showInventory() {

    closeExtraPanel();

    const panel =
        document.createElement("div");

    panel.className =
        "extraPanel";

    panel.id =
        "dynamicPanel";

    const unlockedWeapons =
        Object.entries(
            player.weaponsUnlocked
        )
        .filter(
            ([key, value]) => value
        )
        .map(
            ([key]) =>
                `<div class="card">
                    <strong>
                        ${weapons[key].name}
                    </strong>
                    Damage:
                    ${weapons[key].damage}
                </div>`
        )
        .join("");

    panel.innerHTML = `
        <button class="panelClose">CLOSE</button>

        <h2>INVENTORY</h2>

        <div class="gridList">

            <div class="card">
                <strong>MEDKITS</strong>
                ${player.inventory.medkit}
            </div>

            <div class="card">
                <strong>ENERGY CELLS</strong>
                ${player.inventory.energyCell}
            </div>

            <div class="card">
                <strong>ARMOR PLATES</strong>
                ${player.inventory.armorPlate}
            </div>

            <div class="card">
                <strong>ACCESS A</strong>
                ${player.inventory.keycardA}
            </div>

            <div class="card">
                <strong>ACCESS B</strong>
                ${player.inventory.keycardB}
            </div>

            <div class="card">
                <strong>DATA CORE</strong>
                ${player.inventory.dataCore}
            </div>

        </div>

        <h2>WEAPONS</h2>

        <div class="gridList">
            ${unlockedWeapons}
        </div>

        <h2>UPGRADES</h2>

        <div class="gridList">

            <div class="card">
                <strong>DAMAGE</strong>
                ${player.upgrades.damage}
            </div>

            <div class="card">
                <strong>SPEED</strong>
                ${player.upgrades.speed}
            </div>

            <div class="card">
                <strong>HEALTH</strong>
                ${player.upgrades.maxHealth}
            </div>

            <div class="card">
                <strong>ENERGY</strong>
                ${player.upgrades.maxEnergy}
            </div>

            <div class="card">
                <strong>DASH</strong>
                ${player.upgrades.dash}
            </div>

            <div class="card">
                <strong>ARMOR</strong>
                ${player.upgrades.armor}
            </div>

        </div>
    `;

    extraUI.appendChild(panel);

    panel
        .querySelector(".panelClose")
        .addEventListener(
            "click",
            closeExtraPanel
        );
}

/* =========================================================
   EXTRA PANEL
   ========================================================= */

function closeExtraPanel() {

    const panel =
        document.getElementById(
            "dynamicPanel"
        );

    if (panel) {
        panel.remove();
    }
}

/* =========================================================
   PAUSE
   ========================================================= */

function pauseGame() {

    if (gameState !== "playing") return;

    gameState = "paused";

    pauseScreen.style.display =
        "flex";
}

function resumeGame() {

    if (gameState !== "paused") return;

    gameState = "playing";

    pauseScreen.style.display =
        "none";

    initAudio();
}

/* =========================================================
   GAME OVER
   ========================================================= */

function gameOver() {

    gameState = "gameover";

    mouse.down = false;

    for (const key in keys) {
        keys[key] = false;
    }

    const panel =
        document.createElement("div");

    panel.className =
        "extraPanel";

    panel.id =
        "dynamicPanel";

    panel.innerHTML = `
        <h2>RUN ENDED</h2>

        <p>
            The signal has gone silent.
        </p>

        <div class="gridList">

            <div class="card">
                <strong>KILLS</strong>
                ${player.kills}
            </div>

            <div class="card">
                <strong>LEVEL</strong>
                ${player.level}
            </div>

            <div class="card">
                <strong>CREDITS</strong>
                ${player.credits}
            </div>

            <div class="card">
                <strong>SECTOR</strong>
                ${currentSector + 1}
            </div>

        </div>

        <button id="retryGame">
            RETRY
        </button>

        <button id="gameOverMenu">
            MAIN MENU
        </button>
    `;

    extraUI.appendChild(panel);

    panel
        .querySelector("#retryGame")
        .addEventListener(
            "click",
            () => {

                panel.remove();

                resetPlayer();

                currentSector = 0;
                wave = 1;

                bullets = [];
                enemyBullets = [];
                enemies = [];
                pickups = [];
                particles = [];

                buildWorld();

                gameState =
                    "playing";

                spawnInitialEnemies();
            }
        );

    panel
        .querySelector("#gameOverMenu")
        .addEventListener(
            "click",
            () => {

                panel.remove();

                gameState = "menu";

                menu.style.display =
                    "flex";
            }
        );
}

/* =========================================================
   VICTORY
   ========================================================= */

function victory() {

    gameState = "victory";

    const panel =
        document.createElement("div");

    panel.className =
        "extraPanel";

    panel.id =
        "dynamicPanel";

    panel.innerHTML = `
        <h2>SIGNAL RESTORED</h2>

        <p>
            You reached the source and
            restored the lost signal.
        </p>

        <div class="gridList">

            <div class="card">
                <strong>LEVEL</strong>
                ${player.level}
            </div>

            <div class="card">
                <strong>KILLS</strong>
                ${player.kills}
            </div>

            <div class="card">
                <strong>CREDITS</strong>
                ${player.credits}
            </div>

        </div>

        <button id="victorySave">
            SAVE FINAL RUN
        </button>

        <button id="victoryMenu">
            MAIN MENU
        </button>
    `;

    extraUI.appendChild(panel);

    panel
        .querySelector("#victorySave")
        .addEventListener(
            "click",
            () => {
                saveSlot(activeSaveSlot);
            }
        );

    panel
        .querySelector("#victoryMenu")
        .addEventListener(
            "click",
            () => {

                panel.remove();

                gameState =
                    "menu";

                menu.style.display =
                    "flex";
            }
        );
}

/* =========================================================
   WEAPON SWITCHING
   ========================================================= */

function switchWeapon(number) {

    const list = [
        "pulse",
        "burst",
        "heavy",
        "shotgun",
        "rail",
        "plasma"
    ];

    const key =
        list[number - 1];

    if (!key) return;

    if (!player.weaponsUnlocked[key]) {

        showToast(
            "WEAPON LOCKED"
        );

        return;
    }

    player.weapon = key;

    showToast(
        "EQUIPPED: " +
        weapons[key].name
    );
}

/* =========================================================
   UPGRADES
   ========================================================= */

function buyUpgrade(type) {

    const costs = {
        damage: 150,
        speed: 180,
        maxHealth: 200,
        maxEnergy: 180,
        dash: 250,
        armor: 220
    };

    const cost =
        costs[type];

    if (!cost) return;

    if (player.credits < cost) {

        showToast(
            "NOT ENOUGH CREDITS"
        );

        return;
    }

    player.credits -= cost;

    player.upgrades[type]++;

    if (type === "maxHealth") {
        player.maxHealth += 10;
        player.health += 10;
    }

    if (type === "maxEnergy") {
        player.maxEnergy += 10;
        player.energy += 10;
    }

    if (type === "armor") {
        player.armor += 10;
    }

    showToast(
        "UPGRADE PURCHASED"
    );
}

/* =========================================================
   SHOP PANEL
   ========================================================= */

function showShop() {

    closeExtraPanel();

    const panel =
        document.createElement("div");

    panel.className =
        "extraPanel";

    panel.id =
        "dynamicPanel";

    const upgrades = [
        ["damage", "DAMAGE", 150],
        ["speed", "SPEED", 180],
        ["maxHealth", "MAX HEALTH", 200],
        ["maxEnergy", "MAX ENERGY", 180],
        ["dash", "DASH", 250],
        ["armor", "ARMOR", 220]
    ];

    panel.innerHTML = `
        <button class="panelClose">CLOSE</button>

        <h2>UPGRADE TERMINAL</h2>

        <p>
            CREDITS:
            <strong>
                ${player.credits}
            </strong>
        </p>

        ${upgrades.map(u => `
            <button
                class="upgradeButton"
                data-type="${u[0]}"
            >
                ${u[1]}
                — ${u[2]} CREDITS
            </button>
        `).join("")}
    `;

    extraUI.appendChild(panel);

    panel
        .querySelector(".panelClose")
        .addEventListener(
            "click",
            closeExtraPanel
        );

    panel
        .querySelectorAll(".upgradeButton")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    buyUpgrade(
                        button.dataset.type
                    );

                    showShop();
                }
            );
        });
}

/* =========================================================
   INPUT
   ========================================================= */

window.addEventListener(
    "keydown",
    event => {

        keys[event.code] = true;
        keys[event.key] = true;

        initAudio();

        if (
            event.code === "Escape"
        ) {

            if (
                gameState === "playing"
            ) {
                pauseGame();
            } else if (
                gameState === "paused"
            ) {
                resumeGame();
            }

            return;
        }

        if (
            event.code === "Space"
        ) {
            event.preventDefault();
        }

        if (
            event.code === "KeyE"
        ) {
            interact();
        }

        if (
            event.code === "KeyQ"
        ) {
            useMedkit();
        }

        if (
            event.code === "KeyR"
        ) {
            useEnergyCell();
        }

        if (
            event.code === "KeyM"
        ) {

            if (
                gameState === "playing"
            ) {

                mapScreen.style.display =
                    "flex";

                drawMap();
            }
        }

        if (
            event.code === "KeyI"
        ) {
            showInventory();
        }

        if (
            event.code === "KeyB"
        ) {
            showShop();
        }

        if (
            event.code.startsWith("Digit")
        ) {

            const number =
                Number(
                    event.code.replace(
                        "Digit",
                        ""
                    )
                );

            switchWeapon(number);
        }
    }
);

window.addEventListener(
    "keyup",
    event => {

        keys[event.code] = false;
        keys[event.key] = false;
    }
);

window.addEventListener(
    "blur",
    () => {

        mouse.down = false;

        for (const key in keys) {
            keys[key] = false;
        }
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

        if (event.button === 0) {

            mouse.down = true;

            initAudio();
        }
    }
);

window.addEventListener(
    "mouseup",
    event => {

        if (event.button === 0) {
            mouse.down = false;
        }
    }
);

/* =========================================================
   BUTTONS
   ========================================================= */

if (newGameBtn) {

    newGameBtn.addEventListener(
        "click",
        startNewGame
    );
}

if (loadGameBtn) {

    loadGameBtn.addEventListener(
        "click",
        () => {

            if (gameState === "menu") {
                showSaveSlots();
            }
        }
    );
}

if (achievementsBtn) {

    achievementsBtn.addEventListener(
        "click",
        showAchievements
    );
}

if (controlsBtn) {

    controlsBtn.addEventListener(
        "click",
        showControls
    );
}

if (resumeBtn) {

    resumeBtn.addEventListener(
        "click",
        resumeGame
    );
}

if (saveBtn) {

    saveBtn.addEventListener(
        "click",
        () => {
            saveSlot(activeSaveSlot);
        }
    );
}

if (quitBtn) {

    quitBtn.addEventListener(
        "click",
        () => {

            pauseScreen.style.display =
                "none";

            gameState = "menu";

            menu.style.display =
                "flex";

            mouse.down = false;
        }
    );
}

if (closeMapBtn) {

    closeMapBtn.addEventListener(
        "click",
        () => {

            mapScreen.style.display =
                "none";
        }
    );
}

/* =========================================================
   UPDATE
   ========================================================= */

function update(dt) {

    if (toastTimer > 0) {

        toastTimer -= dt;

        if (toastTimer <= 0) {
            toast.classList.remove(
                "show"
            );
        }
    }

    if (gameState !== "playing") {
        return;
    }

    worldTime += dt;

    updatePlayer(dt);
    updateBullets(dt);
    updateEnemyBullets(dt);
    updateEnemies(dt);
    updatePickups(dt);
    updateParticles(dt);
    updateFloatingTexts(dt);
    updateWeather(dt);
    updateSector();
    updateWave();
    updateCamera();

    updateHUD();
}

/* =========================================================
   RENDER
   ========================================================= */

function render() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    ctx.save();

    if (camera.shake > 0) {

        const sx =
            rand(
                -camera.shake,
                camera.shake
            );

        const sy =
            rand(
                -camera.shake,
                camera.shake
            );

        ctx.translate(
            sx,
            sy
        );

        camera.shake *= .82;

        if (camera.shake < .1) {
            camera.shake = 0;
        }
    }

    drawFloor();
    drawProps();
    drawWorldObjects();
    drawWalls();
    drawPickups();
    drawBullets();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawFloatingTexts();

    ctx.restore();

    drawLighting();
    drawFog();
    drawRain();
    drawCrosshair();
}

/* =========================================================
   MAIN LOOP
   ========================================================= */

function loop(now) {

    let dt =
        (now - lastTime) / 1000;

    lastTime = now;

    dt = clamp(
        dt,
        0,
        0.05
    );

    update(dt);
    render();

    requestAnimationFrame(loop);
}

/* =========================================================
   LOAD GLOBAL DATA
   ========================================================= */

loadPersistentData();

/* =========================================================
   INITIAL WORLD
   ========================================================= */

buildWorld();

updateHUD();

/* =========================================================
   INITIAL MENU STATE
   ========================================================= */

gameState = "menu";

if (hud) {
    hud.style.display = "none";
}

/* =========================================================
   GAME STATE VISIBILITY
   ========================================================= */

function updateVisibility() {

    if (!hud) return;

    hud.style.display =
        gameState === "playing"
            ? ""
            : "none";
}

const oldUpdateHUD = updateHUD;

function wrappedHUD() {
    oldUpdateHUD();
    updateVisibility();
}

updateVisibility();

/* =========================================================
   PATCH HUD UPDATER
   ========================================================= */

setInterval(
    () => {
        if (gameState === "playing") {
            updateVisibility();
        }
    },
    100
);

/* =========================================================
   START
   ========================================================= */

requestAnimationFrame(loop);

})();
