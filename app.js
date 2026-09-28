(() => {
"use strict";

/* =========================================================
   ECHOBOUND — THE LOST SIGNAL
   EXTENDED EDITION
   ---------------------------------------------------------
   Top-down sci-fi survival game
   Geen bloed / geen gore
   ========================================================= */

if (window.__ECHOboundLoaded) return;
window.__ECHOboundLoaded = true;

/* =========================================================
   DOM
   ========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

if (!canvas || !ctx) {
    console.error("EchoBound: canvas #game ontbreekt.");
    return;
}

const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const pauseScreen = document.getElementById("pause");

const newGameButton = document.getElementById("newGame");
const loadGameButton = document.getElementById("loadGame");
const achievementsButton =
    document.getElementById("achievementsButton");
const controlsButton =
    document.getElementById("controlsButton");

const resumeButton = document.getElementById("resume");
const saveButton = document.getElementById("save");
const quitButton = document.getElementById("quit");

const closeMapButton =
    document.getElementById("closeMap");

const healthBar =
    document.getElementById("healthBar");

const energyBar =
    document.getElementById("energyBar");

const objectiveText =
    document.getElementById("objective");

const zoneText =
    document.getElementById("zone");

const killsText =
    document.getElementById("kills");

const creditsText =
    document.getElementById("credits");

const ammoText =
    document.getElementById("ammo");

/* =========================================================
   CANVAS
   ========================================================= */

let W = window.innerWidth;
let H = window.innerHeight;

function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* =========================================================
   CONSTANTS
   ========================================================= */

const WORLD_WIDTH = 4200;
const WORLD_HEIGHT = 4200;

const SAVE_KEY = "echobound_extended_save";
const SETTINGS_KEY = "echobound_extended_settings";

const TAU = Math.PI * 2;

const COLORS = {
    background: "#070b10",
    floor: "#101821",
    floor2: "#131d27",
    wall: "#29343e",
    wallTop: "#3d4b56",
    wallDark: "#182129",
    cyan: "#54e7ff",
    blue: "#5d8cff",
    green: "#64f5a1",
    yellow: "#ffd86b",
    orange: "#ff9b55",
    red: "#ff647c",
    purple: "#b487ff",
    white: "#eef8ff"
};

/* =========================================================
   INPUT
   ========================================================= */

const keys = Object.create(null);

let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

window.addEventListener("keydown", event => {

    keys[event.code] = true;

    if (
        event.code === "Space" ||
        event.code === "KeyW" ||
        event.code === "KeyA" ||
        event.code === "KeyS" ||
        event.code === "KeyD"
    ) {
        event.preventDefault();
    }

    if (event.code === "Escape") {

        if (state.gameOver) {
            return;
        }

        if (state.running) {
            togglePause();
        }

    }

    if (event.code === "KeyM") {

        if (state.running && !state.gameOver) {
            toggleMap();
        }

    }

    if (event.code === "Digit1") {
        equipWeapon(0);
    }

    if (event.code === "Digit2") {
        equipWeapon(1);
    }

    if (event.code === "Digit3") {
        equipWeapon(2);
    }

    if (event.code === "Digit4") {
        equipWeapon(3);
    }

});

window.addEventListener("keyup", event => {
    keys[event.code] = false;
});

window.addEventListener("blur", () => {
    resetInput();
});

canvas.addEventListener("mousemove", event => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});

canvas.addEventListener("mousedown", event => {

    if (event.button === 0) {
        mouse.down = true;
    }

});

window.addEventListener("mouseup", event => {

    if (event.button === 0) {
        mouse.down = false;
    }

});

function resetInput() {

    for (const key in keys) {
        keys[key] = false;
    }

    mouse.down = false;
}

/* =========================================================
   GAME STATE
   ========================================================= */

const state = {

    running: false,
    paused: false,
    gameOver: false,

    time: 0,

    wave: 1,

    sector: 0,

    kills: 0,

    credits: 0,

    distance: 0,

    shots: 0,

    hits: 0,

    enemiesDefeated: 0,

    chestsOpened: 0,

    bossesDefeated: 0,

    roomsCleared: 0,

    missionProgress: 0,

    missionTarget: 5,

    weatherTime: 0,

    weatherIntensity: 0.35,

    cameraShake: 0,

    currentWeapon: 0,

    mapOpen: false,

    saveSlot: 0,

    lastSave: 0,

    notificationTimer: 0,

    notificationText: "",

    notificationColor: COLORS.cyan

};

/* =========================================================
   PLAYER
   ========================================================= */

const player = {

    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,

    radius: 17,

    speed: 235,

    maxHealth: 100,
    health: 100,

    maxEnergy: 100,
    energy: 100,

    energyRegen: 24,

    armor: 0,

    fireCooldown: 0,

    dashCooldown: 0,

    dashTimer: 0,

    invulnerable: 0,

    recoil: 0,

    angle: 0,

    moving: false,

    animation: 0,

    creditsMultiplier: 1,

    damageMultiplier: 1,

    speedMultiplier: 1,

    pickupRadius: 85,

    shield: 0,

    shieldMax: 50,

    abilityCooldown: 0,

    abilityTimer: 0,

    dashDistance: 230,

    dashes: 1

};

/* =========================================================
   WEAPONS
   ========================================================= */

const weapons = [

    {
        name: "PULSE",
        damage: 20,
        fireRate: 0.19,
        bulletSpeed: 760,
        spread: 0.025,
        pellets: 1,
        energy: 0,
        color: "#62eaff",
        magazine: 12,
        ammo: 12,
        reload: 1.1,
        reloadTimer: 0,
        unlocked: true
    },

    {
        name: "BURST",
        damage: 13,
        fireRate: 0.075,
        bulletSpeed: 830,
        spread: 0.055,
        pellets: 1,
        energy: 0,
        color: "#9e86ff",
        magazine: 30,
        ammo: 30,
        reload: 1.45,
        reloadTimer: 0,
        unlocked: true
    },

    {
        name: "ARC",
        damage: 42,
        fireRate: 0.5,
        bulletSpeed: 680,
        spread: 0.015,
        pellets: 1,
        energy: 8,
        color: "#ffcf68",
        magazine: 6,
        ammo: 6,
        reload: 1.8,
        reloadTimer: 0,
        unlocked: true
    },

    {
        name: "NOVA",
        damage: 18,
        fireRate: 0.72,
        bulletSpeed: 540,
        spread: 0.28,
        pellets: 7,
        energy: 15,
        color: "#ff7fb5",
        magazine: 5,
        ammo: 5,
        reload: 2.0,
        reloadTimer: 0,
        unlocked: false
    }

];

/* =========================================================
   ARRAYS
   ========================================================= */

const enemies = [];
const bullets = [];
const enemyBullets = [];
const particles = [];
const pickups = [];
const walls = [];
const doors = [];
const props = [];
const lights = [];
const chests = [];
const terminals = [];
const zones = [];
const effects = [];
const rain = [];
const floatingTexts = [];

/* =========================================================
   RANDOM
   ========================================================= */

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function choose(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(a, b) {

    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);

}

function angleBetween(a, b) {
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

/* =========================================================
   AUDIO
   ========================================================= */

let audioContext = null;

function initAudio() {

    if (audioContext) return;

    try {

        audioContext =
            new (window.AudioContext ||
                window.webkitAudioContext)();

    } catch (error) {

        audioContext = null;

    }

}

function sound(
    frequency = 440,
    duration = 0.06,
    type = "sine",
    volume = 0.025
) {

    if (!audioContext) return;

    try {

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(
            volume,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(
            audioContext.currentTime + duration
        );

    } catch (error) {}

}

/* =========================================================
   SAVE DATA
   ========================================================= */

const defaultSave = {

    version: 4,

    player: {
        health: 100,
        energy: 100,
        armor: 0,
        credits: 0
    },

    progress: {
        kills: 0,
        wave: 1,
        sector: 0,
        distance: 0,
        missionProgress: 0
    },

    weapons: [
        true,
        true,
        true,
        false
    ],

    achievements: {},

    slots: [

        {
            used: false
        },

        {
            used: false
        },

        {
            used: false
        }

    ]

};

let saveData = loadSaveData();

function cloneDefaultSave() {

    return JSON.parse(
        JSON.stringify(defaultSave)
    );

}

function normalizeSave(data) {

    const base = cloneDefaultSave();

    if (!data || typeof data !== "object") {
        return base;
    }

    if (data.version) {
        base.version = data.version;
    }

    if (data.player) {
        Object.assign(base.player, data.player);
    }

    if (data.progress) {
        Object.assign(
            base.progress,
            data.progress
        );
    }

    if (Array.isArray(data.weapons)) {

        data.weapons.forEach(
            (value, index) => {

                if (index < base.weapons.length) {
                    base.weapons[index] = !!value;
                }

            }
        );

    }

    if (data.achievements) {
        base.achievements =
            data.achievements;
    }

    if (Array.isArray(data.slots)) {

        data.slots.forEach(
            (slot, index) => {

                if (index < 3 && slot) {
                    base.slots[index] = slot;
                }

            }
        );

    }

    return base;

}

function loadSaveData() {

    try {

        const raw =
            localStorage.getItem(SAVE_KEY);

        if (!raw) {
            return cloneDefaultSave();
        }

        return normalizeSave(
            JSON.parse(raw)
        );

    } catch (error) {

        console.warn(
            "Save data kon niet geladen worden.",
            error
        );

        return cloneDefaultSave();

    }

}

function saveSaveData() {

    try {

        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(saveData)
        );

        state.lastSave = Date.now();

    } catch (error) {

        console.warn(
            "Opslaan mislukt.",
            error
        );

    }

}

/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

const achievements = {

    firstEcho: {
        title: "FIRST ECHO",
        description: "Versla je eerste vijand."
    },

    tenEchoes: {
        title: "TEN SIGNALS",
        description: "Versla 10 vijanden."
    },

    fiftyEchoes: {
        title: "SIGNAL HUNTER",
        description: "Versla 50 vijanden."
    },

    hundredEchoes: {
        title: "ECHO BREAKER",
        description: "Versla 100 vijanden."
    },

    firstSave: {
        title: "ANCHOR",
        description: "Sla je run op."
    },

    explorer: {
        title: "EXPLORER",
        description: "Leg 5.000 meter af."
    },

    deepExplorer: {
        title: "DEEP EXPLORER",
        description: "Leg 20.000 meter af."
    },

    survivor: {
        title: "SURVIVOR",
        description: "Bereik wave 5."
    },

    veteran: {
        title: "VETERAN",
        description: "Bereik wave 10."
    },

    arsenal: {
        title: "ARSENAL",
        description: "Gebruik alle wapens."
    },

    collector: {
        title: "COLLECTOR",
        description: "Open 5 kisten."
    },

    bossHunter: {
        title: "SIGNAL BREAKER",
        description: "Versla een boss."
    },

    wealthy: {
        title: "SALVAGER",
        description: "Verzamel 1.000 credits."
    },

    survivorNoDamage: {
        title: "CLEAN SIGNAL",
        description: "Bereik wave 3 zonder schade."
    }

};

function isAchievementUnlocked(id) {
    return !!saveData.achievements[id];
}

function unlockAchievement(id) {

    if (!achievements[id]) return;

    if (isAchievementUnlocked(id)) return;

    saveData.achievements[id] = true;

    saveSaveData();

    showAchievement(
        achievements[id].title
    );

    sound(740, 0.08, "triangle", 0.04);
    sound(980, 0.14, "triangle", 0.03);

}

function checkAchievements() {

    if (state.kills >= 1) {
        unlockAchievement("firstEcho");
    }

    if (state.kills >= 10) {
        unlockAchievement("tenEchoes");
    }

    if (state.kills >= 50) {
        unlockAchievement("fiftyEchoes");
    }

    if (state.kills >= 100) {
        unlockAchievement("hundredEchoes");
    }

    if (state.distance >= 5000) {
        unlockAchievement("explorer");
    }

    if (state.distance >= 20000) {
        unlockAchievement("deepExplorer");
    }

    if (state.wave >= 5) {
        unlockAchievement("survivor");
    }

    if (state.wave >= 10) {
        unlockAchievement("veteran");
    }

    if (state.credits >= 1000) {
        unlockAchievement("wealthy");
    }

    if (state.chestsOpened >= 5) {
        unlockAchievement("collector");
    }

    if (state.bossesDefeated >= 1) {
        unlockAchievement("bossHunter");
    }

    const usedAll =
        weapons.every(
            weapon =>
                weapon.unlocked &&
                weapon._used
        );

    if (usedAll) {
        unlockAchievement("arsenal");
    }

}

/* =========================================================
   UI HELPERS
   ========================================================= */

function showAchievement(title) {

    const box =
        document.getElementById("achievement");

    const name =
        document.getElementById("achievementName");

    if (!box || !name) return;

    name.textContent = title;

    box.classList.remove("show");

    void box.offsetWidth;

    box.classList.add("show");

    setTimeout(() => {

        box.classList.remove("show");

    }, 3200);

}

function notify(
    text,
    color = COLORS.cyan,
    duration = 2200
) {

    state.notificationText = text;
    state.notificationColor = color;
    state.notificationTimer = duration;

}

function updateNotification(dt) {

    if (state.notificationTimer > 0) {
        state.notificationTimer -= dt * 1000;
    }

}

function createNotificationUI() {

    if (document.getElementById(
        "extendedNotification"
    )) {
        return;
    }

    const div =
        document.createElement("div");

    div.id = "extendedNotification";

    div.style.position = "fixed";
    div.style.left = "50%";
    div.style.bottom = "90px";
    div.style.transform =
        "translateX(-50%) translateY(15px)";
    div.style.padding =
        "12px 22px";
    div.style.border =
        "1px solid rgba(100,230,255,.5)";
    div.style.background =
        "rgba(5,10,16,.88)";
    div.style.color = "#eafaff";
    div.style.fontFamily =
        "Arial,sans-serif";
    div.style.letterSpacing =
        "2px";
    div.style.fontSize =
        "12px";
    div.style.zIndex =
        "500";
    div.style.opacity =
        "0";
    div.style.pointerEvents =
        "none";
    div.style.transition =
        "all .2s ease";

    document.body.appendChild(div);

}

function updateNotificationUI() {

    const div =
        document.getElementById(
            "extendedNotification"
        );

    if (!div) return;

    if (
        state.notificationTimer > 0 &&
        state.notificationText
    ) {

        div.textContent =
            state.notificationText;

        div.style.borderColor =
            state.notificationColor;

        div.style.opacity = "1";

        div.style.transform =
            "translateX(-50%) translateY(0)";

    } else {

        div.style.opacity = "0";

        div.style.transform =
            "translateX(-50%) translateY(15px)";

    }

}

/* =========================================================
   WORLD GENERATION
   ========================================================= */

function clearWorld() {

    walls.length = 0;
    doors.length = 0;
    props.length = 0;
    lights.length = 0;
    chests.length = 0;
    terminals.length = 0;
    zones.length = 0;

}

function addWall(x, y, w, h) {

    walls.push({
        x,
        y,
        w,
        h,
        type: "wall"
    });

}

function addDoor(
    x,
    y,
    w,
    h,
    vertical = false
) {

    doors.push({

        x,
        y,
        w,
        h,

        vertical,

        open: false,

        locked: false,

        progress: 0,

        auto: true

    });

}

function addProp(
    x,
    y,
    type,
    scale = 1
) {

    props.push({

        x,
        y,
        type,
        scale,

        rotation: random(
            0,
            TAU
        )

    });

}

function addLight(
    x,
    y,
    radius,
    color,
    intensity = 1
) {

    lights.push({

        x,
        y,
        radius,
        color,
        intensity,

        flicker: random(
            0,
            TAU
        )

    });

}

function addChest(x, y) {

    chests.push({

        x,
        y,

        opened: false,

        glow: random(
            0,
            TAU
        )

    });

}

function addTerminal(x, y) {

    terminals.push({

        x,
        y,

        used: false,

        progress: 0

    });

}

function addZone(
    x,
    y,
    w,
    h,
    name,
    color
) {

    zones.push({

        x,
        y,
        w,
        h,

        name,
        color

    });

}

function generateWorld() {

    clearWorld();

    /*
       Buitenmuren
    */

    addWall(
        80,
        80,
        WORLD_WIDTH - 160,
        55
    );

    addWall(
        80,
        WORLD_HEIGHT - 135,
        WORLD_WIDTH - 160,
        55
    );

    addWall(
        80,
        80,
        55,
        WORLD_HEIGHT - 160
    );

    addWall(
        WORLD_WIDTH - 135,
        80,
        55,
        WORLD_HEIGHT - 160
    );

    /*
       Grote gebouwen
    */

    addWall(350, 320, 1000, 50);
    addWall(350, 320, 50, 600);
    addWall(1300, 320, 50, 600);

    addDoor(
        810,
        320,
        80,
        50
    );

    addDoor(
        350,
        570,
        50,
        80,
        true
    );

    addWall(
        350,
        870,
        1000,
        50
    );

    addWall(
        1550,
        350,
        50,
        1050
    );

    addWall(
        1550,
        350,
        850,
        50
    );

    addWall(
        2350,
        350,
        50,
        1050
    );

    addDoor(
        1950,
        350,
        90,
        50
    );

    addWall(
        1550,
        1350,
        850,
        50
    );

    /*
       Middencomplex
    */

    addWall(
        750,
        1150,
        50,
        850
    );

    addWall(
        750,
        1950,
        1200,
        50
    );

    addWall(
        1900,
        1500,
        50,
        500
    );

    addDoor(
        750,
        1520,
        50,
        90,
        true
    );

    addDoor(
        1200,
        1950,
        90,
        50
    );

    /*
       Oostelijk gebied
    */

    addWall(
        2700,
        600,
        850,
        50
    );

    addWall(
        2700,
        600,
        50,
        900
    );

    addWall(
        3500,
        600,
        50,
        900
    );

    addWall(
        2700,
        1450,
        850,
        50
    );

    addDoor(
        3100,
        600,
        100,
        50
    );

    /*
       Zuidelijke basis
    */

    addWall(
        300,
        2450,
        1100,
        50
    );

    addWall(
        300,
        2450,
        50,
        850
    );

    addWall(
        1350,
        2450,
        50,
        850
    );

    addWall(
        300,
        3250,
        1100,
        50
    );

    addDoor(
        820,
        2450,
        100,
        50
    );

    /*
       Zuid-oost gebouw
    */

    addWall(
        1750,
        2500,
        1000,
        50
    );

    addWall(
        1750,
        2500,
        50,
        750
    );

    addWall(
        2700,
        2500,
        50,
        750
    );

    addWall(
        1750,
        3200,
        1000,
        50
    );

    addDoor(
        2200,
        2500,
        100,
        50
    );

    /*
       Props
    */

    for (let i = 0; i < 80; i++) {

        const x =
            random(
                180,
                WORLD_WIDTH - 180
            );

        const y =
            random(
                180,
                WORLD_HEIGHT - 180
            );

        if (
            !pointInsideWall(
                x,
                y,
                35
            )
        ) {

            addProp(
                x,
                y,
                choose([
                    "crate",
                    "container",
                    "barrel",
                    "machine",
                    "rock",
                    "console"
                ]),
                random(
                    .7,
                    1.35
                )
            );

        }

    }

    /*
       Lichten
    */

    for (let i = 0; i < 55; i++) {

        const x =
            random(
                180,
                WORLD_WIDTH - 180
            );

        const y =
            random(
                180,
                WORLD_HEIGHT - 180
            );

        if (
            !pointInsideWall(
                x,
                y,
                25
            )
        ) {

            addLight(
                x,
                y,
                random(90, 180),
                choose([
                    "#4edfff",
                    "#7d8cff",
                    "#6effb0",
                    "#ffcf6b"
                ]),
                random(.4, 1)
            );

        }

    }

    /*
       Kisten
    */

    const chestPositions = [

        [520, 470],
        [1120, 470],
        [1740, 780],
        [2180, 900],
        [3050, 850],
        [3260, 1250],
        [520, 2800],
        [1050, 2950],
        [2050, 2900],
        [2480, 2900],
        [3700, 2200],
        [3200, 3500]

    ];

    chestPositions.forEach(
        position => {
            addChest(
                position[0],
                position[1]
            );
        }
    );

    /*
       Terminals
    */

    addTerminal(1000, 520);
    addTerminal(1800, 520);
    addTerminal(3000, 950);
    addTerminal(950, 2850);
    addTerminal(2250, 2850);

    /*
       Zones
    */

    addZone(
        150,
        150,
        1100,
        950,
        "OLD RESEARCH",
        "#54e7ff"
    );

    addZone(
        1450,
        200,
        1050,
        1250,
        "SIGNAL LAB",
        "#b487ff"
    );

    addZone(
        2600,
        450,
        1050,
        1150,
        "INDUSTRIAL YARD",
        "#ff9b55"
    );

    addZone(
        200,
        2250,
        1250,
        1150,
        "LOWER BASE",
        "#64f5a1"
    );

    addZone(
        1650,
        2300,
        1200,
        1050,
        "REACTOR BLOCK",
        "#ff647c"
    );

    addZone(
        2900,
        1800,
        1050,
        1700,
        "DEEP SECTOR",
        "#5d8cff"
    );

}

/* =========================================================
   COLLISION
   ========================================================= */

function circleRectCollision(
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

    const dx = cx - closestX;
    const dy = cy - closestY;

    return (
        dx * dx +
        dy * dy
        <
        radius * radius
    );

}

function pointInsideWall(
    x,
    y,
    radius = 0
) {

    for (const wall of walls) {

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

    for (const door of doors) {

        if (door.open) continue;

        if (
            circleRectCollision(
                x,
                y,
                radius,
                door
            )
        ) {
            return true;
        }

    }

    return false;

}

function moveWithCollision(
    entity,
    dx,
    dy,
    radius
) {

    const oldX = entity.x;
    const oldY = entity.y;

    entity.x += dx;

    if (
        pointInsideWall(
            entity.x,
            entity.y,
            radius
        )
    ) {
        entity.x = oldX;
    }

    entity.y += dy;

    if (
        pointInsideWall(
            entity.x,
            entity.y,
            radius
        )
    ) {
        entity.y = oldY;
    }

    entity.x = clamp(
        entity.x,
        140 + radius,
        WORLD_WIDTH - 140 - radius
    );

    entity.y = clamp(
        entity.y,
        140 + radius,
        WORLD_HEIGHT - 140 - radius
    );

}

function lineBlocked(
    x1,
    y1,
    x2,
    y2
) {

    const distanceValue =
        Math.hypot(
            x2 - x1,
            y2 - y1
        );

    const steps =
        Math.ceil(
            distanceValue / 20
        );

    for (
        let i = 0;
        i <= steps;
        i++
    ) {

        const t =
            i / steps;

        const x =
            x1 +
            (x2 - x1) * t;

        const y =
            y1 +
            (y2 - y1) * t;

        if (
            pointInsideWall(
                x,
                y,
                2
            )
        ) {
            return true;
        }

    }

    return false;

}

/* =========================================================
   ENEMY TYPES
   ========================================================= */

const enemyTypes = {

    scout: {

        name: "SCOUT",

        radius: 14,

        health: 45,

        speed: 120,

        damage: 8,

        fireRate: 1.7,

        range: 520,

        color: "#58e4ff",

        credits: 12

    },

    hunter: {

        name: "HUNTER",

        radius: 17,

        health: 90,

        speed: 88,

        damage: 12,

        fireRate: 1.25,

        range: 650,

        color: "#b47cff",

        credits: 22

    },

    guardian: {

        name: "GUARDIAN",

        radius: 24,

        health: 240,

        speed: 48,

        damage: 18,

        fireRate: 2.1,

        range: 700,

        color: "#ffad61",

        credits: 55

    },

    drone: {

        name: "DRONE",

        radius: 12,

        health: 35,

        speed: 165,

        damage: 7,

        fireRate: 1.1,

        range: 460,

        color: "#69ffae",

        credits: 15

    },

    phantom: {

        name: "PHANTOM",

        radius: 19,

        health: 120,

        speed: 135,

        damage: 14,

        fireRate: 1.5,

        range: 600,

        color: "#ff6f99",

        credits: 30

    },

    boss: {

        name: "SIGNAL WARDEN",

        radius: 48,

        health: 1600,

        speed: 35,

        damage: 24,

        fireRate: .7,

        range: 900,

        color: "#ffcc66",

        credits: 500

    }

};

/* =========================================================
   ENEMY CREATION
   ========================================================= */

function createEnemy(
    type,
    x,
    y
) {

    const base =
        enemyTypes[type];

    if (!base) return;

    const scale =
        1 +
        Math.max(
            0,
            state.wave - 1
        ) * .085;

    enemies.push({

        type,

        x,
        y,

        radius: base.radius,

        maxHealth:
            base.health * scale,

        health:
            base.health * scale,

        speed:
            base.speed *
            (1 +
                Math.min(
                    .45,
                    state.wave * .018
                )
            ),

        damage:
            base.damage *
            (1 +
                Math.min(
                    .55,
                    state.wave * .025
                )
            ),

        fireRate:
            base.fireRate *
            random(.85, 1.15),

        fireCooldown:
            random(.4, 1.6),

        color: base.color,

        credits: base.credits,

        angle: random(
            0,
            TAU
        ),

        animation: random(
            0,
            TAU
        ),

        strafe: Math.random() < .5
            ? -1
            : 1,

        state: "chase",

        hitFlash: 0,

        stun: 0,

        dead: false,

        bossPhase: 0

    });

}

function findSpawnPoint() {

    for (let tries = 0; tries < 100; tries++) {

        const x =
            random(
                180,
                WORLD_WIDTH - 180
            );

        const y =
            random(
                180,
                WORLD_HEIGHT - 180
            );

        const distanceFromPlayer =
            Math.hypot(
                x - player.x,
                y - player.y
            );

        if (
            distanceFromPlayer > 700 &&
            !pointInsideWall(
                x,
                y,
                40
            )
        ) {

            return {
                x,
                y
            };

        }

    }

    return {
        x: 300,
        y: 300
    };

}

function spawnEnemyWave() {

    const count =
        Math.min(
            5 +
            state.wave * 2,
            30
        );

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const spawn =
            findSpawnPoint();

        let type;

        const roll =
            Math.random();

        if (state.wave >= 8 &&
            roll < .08) {

            type = "phantom";

        } else if (
            state.wave >= 5 &&
            roll < .20
        ) {

            type = "guardian";

        } else if (
            roll < .52
        ) {

            type = "hunter";

        } else if (
            roll < .76
        ) {

            type = "drone";

        } else {

            type = "scout";

        }

        createEnemy(
            type,
            spawn.x,
            spawn.y
        );

    }

    notify(
        `WAVE ${state.wave} — ${count} CONTACTS`,
        COLORS.orange
    );

}

function spawnBoss() {

    const spawn =
        findSpawnPoint();

    createEnemy(
        "boss",
        spawn.x,
        spawn.y
    );

    notify(
        "SIGNAL WARDEN DETECTED",
        COLORS.yellow,
        3500
    );

    sound(
        90,
        .5,
        "sawtooth",
        .04
    );

}

/* =========================================================
   BULLETS
   ========================================================= */

function shootWeapon() {

    const weapon =
        weapons[state.currentWeapon];

    if (!weapon || !weapon.unlocked) {
        return;
    }

    if (weapon.reloadTimer > 0) {
        return;
    }

    if (player.fireCooldown > 0) {
        return;
    }

    if (weapon.ammo <= 0) {

        startReload();

        return;

    }

    if (
        weapon.energy >
        player.energy
    ) {
        return;
    }

    const worldMouse =
        screenToWorld(
            mouse.x,
            mouse.y
        );

    const baseAngle =
        Math.atan2(
            worldMouse.y - player.y,
            worldMouse.x - player.x
        );

    weapon.ammo--;

    player.energy -=
        weapon.energy;

    player.fireCooldown =
        weapon.fireRate;

    player.recoil =
        1;

    weapon._used = true;

    state.shots++;

    for (
        let i = 0;
        i < weapon.pellets;
        i++
    ) {

        const angle =
            baseAngle +
            random(
                -weapon.spread,
                weapon.spread
            );

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

            damage:
                weapon.damage *
                player.damageMultiplier,

            radius:
                weapon.pellets > 1
                    ? 3
                    : 4,

            life: 1.4,

            color:
                weapon.color,

            glow:
                12

        });

    }

    muzzleFlash(
        player.x +
        Math.cos(baseAngle) * 25,
        player.y +
        Math.sin(baseAngle) * 25,
        weapon.color,
        baseAngle
    );

    sound(
        state.currentWeapon === 2
            ? 150
            : state.currentWeapon === 3
                ? 210
                : 290,
        state.currentWeapon === 3
            ? .13
            : .055,
        "square",
        .025
    );

}

function startReload() {

    const weapon =
        weapons[state.currentWeapon];

    if (!weapon) return;

    if (
        weapon.reloadTimer > 0 ||
        weapon.ammo >= weapon.magazine
    ) {
        return;
    }

    weapon.reloadTimer =
        weapon.reload;

    notify(
        "RELOADING...",
        COLORS.yellow,
        800
    );

}

function updateWeapons(dt) {

    if (
        player.fireCooldown > 0
    ) {

        player.fireCooldown -= dt;

    }

    for (const weapon of weapons) {

        if (
            weapon.reloadTimer > 0
        ) {

            weapon.reloadTimer -= dt;

            if (
                weapon.reloadTimer <= 0
            ) {

                weapon.reloadTimer = 0;

                weapon.ammo =
                    weapon.magazine;

                sound(
                    620,
                    .07,
                    "triangle",
                    .025
                );

            }

        }

    }

}

function equipWeapon(index) {

    if (
        index < 0 ||
        index >= weapons.length
    ) {
        return;
    }

    const weapon =
        weapons[index];

    if (!weapon.unlocked) {

        notify(
            "WEAPON LOCKED",
            COLORS.red
        );

        return;

    }

    state.currentWeapon = index;

    notify(
        weapon.name,
        weapon.color,
        900
    );

    sound(
        520,
        .05,
        "triangle",
        .02
    );

}

/* =========================================================
   PLAYER
   ========================================================= */

function resetPlayer() {

    player.x = WORLD_WIDTH / 2;
    player.y = WORLD_HEIGHT / 2;

    player.health = player.maxHealth;

    player.energy =
        player.maxEnergy;

    player.armor = 0;

    player.shield =
        player.shieldMax;

    player.fireCooldown = 0;
    player.dashCooldown = 0;
    player.dashTimer = 0;
    player.invulnerable = 0;
    player.recoil = 0;

    player.animation = 0;

}

function updatePlayer(dt) {

    if (state.gameOver) {
        return;
    }

    let moveX = 0;
    let moveY = 0;

    if (
        keys.KeyW ||
        keys.ArrowUp
    ) {
        moveY -= 1;
    }

    if (
        keys.KeyS ||
        keys.ArrowDown
    ) {
        moveY += 1;
    }

    if (
        keys.KeyA ||
        keys.ArrowLeft
    ) {
        moveX -= 1;
    }

    if (
        keys.KeyD ||
        keys.ArrowRight
    ) {
        moveX += 1;
    }

    const direction =
        normalize(
            moveX,
            moveY
        );

    const moving =
        direction.x !== 0 ||
        direction.y !== 0;

    player.moving = moving;

    if (moving) {

        const speed =
            player.speed *
            player.speedMultiplier *
            dt;

        moveWithCollision(
            player,
            direction.x * speed,
            direction.y * speed,
            player.radius
        );

        state.distance +=
            Math.hypot(
                direction.x * speed,
                direction.y * speed
            );

        player.animation +=
            dt * 9;

    }

    const worldMouse =
        screenToWorld(
            mouse.x,
            mouse.y
        );

    player.angle =
        Math.atan2(
            worldMouse.y - player.y,
            worldMouse.x - player.x
        );

    player.energy =
        clamp(
            player.energy +
            player.energyRegen * dt,
            0,
            player.maxEnergy
        );

    player.shield =
        clamp(
            player.shield +
            dt * 5,
            0,
            player.shieldMax
        );

    if (
        player.invulnerable > 0
    ) {

        player.invulnerable -= dt;

    }

    if (
        player.dashCooldown > 0
    ) {

        player.dashCooldown -= dt;

    }

    if (
        player.abilityCooldown > 0
    ) {

        player.abilityCooldown -= dt;

    }

    if (keys.Space) {

        dashPlayer(
            direction
        );

    }

    if (mouse.down) {
        shootWeapon();
    }

    updateWeapons(dt);

    player.recoil =
        Math.max(
            0,
            player.recoil -
            dt * 7
        );

}

function dashPlayer(direction) {

    if (
        player.dashCooldown > 0 ||
        player.energy < 25
    ) {
        return;
    }

    let dx = direction.x;
    let dy = direction.y;

    if (
        dx === 0 &&
        dy === 0
    ) {

        dx =
            Math.cos(
                player.angle
            );

        dy =
            Math.sin(
                player.angle
            );

    }

    player.energy -= 25;

    player.dashCooldown = 1.1;

    player.invulnerable = .38;

    for (
        let i = 0;
        i < 14;
        i++
    ) {

        particles.push({

            x:
                player.x +
                random(-8, 8),

            y:
                player.y +
                random(-8, 8),

            vx:
                -dx *
                random(50, 160),

            vy:
                -dy *
                random(50, 160),

            life:
                random(.25, .55),

            maxLife:
                .55,

            size:
                random(3, 8),

            color:
                COLORS.cyan,

            alpha:
                1

        });

    }

    moveWithCollision(
        player,
        dx * player.dashDistance,
        dy * player.dashDistance,
        player.radius
    );

    state.cameraShake =
        Math.max(
            state.cameraShake,
            4
        );

    sound(
        180,
        .15,
        "sawtooth",
        .025
    );

}

/* =========================================================
   PLAYER DAMAGE
   ========================================================= */

function damagePlayer(amount) {

    if (
        player.invulnerable > 0 ||
        state.gameOver
    ) {
        return;
    }

    let remaining =
        amount;

    if (player.shield > 0) {

        const absorbed =
            Math.min(
                player.shield,
                remaining
            );

        player.shield -= absorbed;
        remaining -= absorbed;

    }

    if (remaining > 0) {

        const armorReduction =
            clamp(
                player.armor / 100,
                0,
                .55
            );

        remaining *=
            1 -
            armorReduction;

        player.health -=
            remaining;

    }

    player.invulnerable =
        .35;

    state.cameraShake =
        Math.max(
            state.cameraShake,
            8
        );

    floatingText(
        player.x,
        player.y - 30,
        `-${Math.round(amount)}`,
        COLORS.red
    );

    sound(
        100,
        .12,
        "sawtooth",
        .035
    );

    if (
        player.health <= 0
    ) {

        player.health = 0;

        gameOver();

    }

}

/* =========================================================
   ENEMY AI
   ========================================================= */

function updateEnemies(dt) {

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];

        if (enemy.dead) {

            enemies.splice(i, 1);

            continue;

        }

        enemy.animation +=
            dt * 4;

        enemy.hitFlash =
            Math.max(
                0,
                enemy.hitFlash -
                dt
            );

        enemy.stun =
            Math.max(
                0,
                enemy.stun -
                dt
            );

        enemy.fireCooldown -= dt;

        if (
            enemy.stun > 0
        ) {
            continue;
        }

        const distanceToPlayer =
            distance(
                enemy,
                player
            );

        const canSee =
            distanceToPlayer <
                enemyTypes[
                    enemy.type
                ].range &&
            !lineBlocked(
                enemy.x,
                enemy.y,
                player.x,
                player.y
            );

        /*
           Boss gedrag
        */

        if (
            enemy.type === "boss"
        ) {

            updateBoss(
                enemy,
                dt,
                distanceToPlayer,
                canSee
            );

            continue;

        }

        /*
           Normale AI
        */

        if (
            distanceToPlayer >
            300
        ) {

            enemy.state =
                "chase";

        } else if (
            distanceToPlayer <
            190
        ) {

            enemy.state =
                "retreat";

        } else {

            enemy.state =
                "strafe";

        }

        let dx = 0;
        let dy = 0;

        if (
            enemy.state ===
            "chase"
        ) {

            const dir =
                normalize(
                    player.x -
                    enemy.x,
                    player.y -
                    enemy.y
                );

            dx = dir.x;
            dy = dir.y;

        }

        if (
            enemy.state ===
            "retreat"
        ) {

            const dir =
                normalize(
                    enemy.x -
                    player.x,
                    enemy.y -
                    player.y
                );

            dx = dir.x;
            dy = dir.y;

        }

        if (
            enemy.state ===
            "strafe"
        ) {

            const dir =
                normalize(
                    player.x -
                    enemy.x,
                    player.y -
                    enemy.y
                );

            dx =
                -dir.y *
                enemy.strafe;

            dy =
                dir.x *
                enemy.strafe;

        }

        /*
           Kleine afstandsvermindering
           zodat vijanden niet allemaal
           exact bovenop elkaar komen.
        */

        for (
            const other of enemies
        ) {

            if (
                other === enemy ||
                other.dead
            ) {
                continue;
            }

            const d =
                distance(
                    enemy,
                    other
                );

            if (
                d < enemy.radius * 2.4 &&
                d > 0
            ) {

                const push =
                    normalize(
                        enemy.x -
                        other.x,
                        enemy.y -
                        other.y
                    );

                dx +=
                    push.x * .65;

                dy +=
                    push.y * .65;

            }

        }

        const movement =
            normalize(
                dx,
                dy
            );

        moveWithCollision(
            enemy,
            movement.x *
                enemy.speed *
                dt,
            movement.y *
                enemy.speed *
                dt,
            enemy.radius
        );

        /*
           Schieten
        */

        if (
            canSee &&
            enemy.fireCooldown <= 0
        ) {

            enemyShoot(
                enemy
            );

            enemy.fireCooldown =
                enemy.fireRate *
                random(
                    .8,
                    1.2
                );

        }

    }

}

function updateBoss(
    enemy,
    dt,
    distanceToPlayer,
    canSee
) {

    const healthRatio =
        enemy.health /
        enemy.maxHealth;

    if (
        healthRatio < .66 &&
        enemy.bossPhase < 1
    ) {

        enemy.bossPhase = 1;

        notify(
            "SIGNAL WARDEN PHASE II",
            COLORS.yellow,
            3000
        );

        for (
            let i = 0;
            i < 5;
            i++
        ) {

            const spawn =
                findSpawnPoint();

            createEnemy(
                choose([
                    "scout",
                    "drone",
                    "hunter"
                ]),
                spawn.x,
                spawn.y
            );

        }

    }

    if (
        healthRatio < .33 &&
        enemy.bossPhase < 2
    ) {

        enemy.bossPhase = 2;

        notify(
            "SIGNAL WARDEN PHASE III",
            COLORS.red,
            3000
        );

        enemy.speed *= 1.35;
        enemy.fireRate *= .65;

    }

    const dir =
        normalize(
            player.x -
            enemy.x,
            player.y -
            enemy.y
        );

    let dx = 0;
    let dy = 0;

    if (
        distanceToPlayer >
        420
    ) {

        dx = dir.x;
        dy = dir.y;

    } else {

        dx =
            -dir.y *
            Math.sin(
                state.time
            );

        dy =
            dir.x *
            Math.sin(
                state.time
            );

    }

    moveWithCollision(
        enemy,
        dx *
            enemy.speed *
            dt,
        dy *
            enemy.speed *
            dt,
        enemy.radius
    );

    if (
        canSee &&
        enemy.fireCooldown <= 0
    ) {

        bossShoot(
            enemy
        );

        enemy.fireCooldown =
            enemy.fireRate;

    }

}

function enemyShoot(enemy) {

    const angle =
        angleBetween(
            enemy,
            player
        );

    const spread =
        enemy.type === "drone"
            ? .12
            : .035;

    const finalAngle =
        angle +
        random(
            -spread,
            spread
        );

    const speed =
        enemy.type === "boss"
            ? 390
            : enemy.type === "drone"
                ? 470
                : 340;

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
            Math.cos(finalAngle) *
            speed,

        vy:
            Math.sin(finalAngle) *
            speed,

        radius:
            enemy.type === "boss"
                ? 8
                : 5,

        damage:
            enemy.damage,

        life:
            3,

        color:
            enemy.color

    });

    sound(
        130,
        .045,
        "square",
        .012
    );

}

function bossShoot(enemy) {

    const baseAngle =
        angleBetween(
            enemy,
            player
        );

    const count =
        enemy.bossPhase >= 2
            ? 11
            : 7;

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const spread =
            .8;

        const angle =
            baseAngle -
            spread / 2 +
            (spread /
                Math.max(
                    1,
                    count - 1
                )) *
                i;

        enemyBullets.push({

            x: enemy.x,
            y: enemy.y,

            vx:
                Math.cos(angle) *
                280,

            vy:
                Math.sin(angle) *
                280,

            radius: 7,

            damage:
                enemy.damage *
                .75,

            life: 3.5,

            color:
                COLORS.yellow

        });

    }

    for (
        let i = 0;
        i < 16;
        i++
    ) {

        particles.push({

            x: enemy.x,
            y: enemy.y,

            vx:
                random(-80, 80),

            vy:
                random(-80, 80),

            life:
                random(
                    .25,
                    .7
                ),

            maxLife:
                .7,

            size:
                random(
                    3,
                    9
                ),

            color:
                COLORS.yellow,

            alpha:
                1

        });

    }

}

/* =========================================================
   BULLET UPDATE
   ========================================================= */

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

        if (
            bullet.life <= 0 ||
            pointInsideWall(
                bullet.x,
                bullet.y,
                bullet.radius
            )
        ) {

            impactEffect(
                bullet.x,
                bullet.y,
                bullet.color
            );

            bullets.splice(
                i,
                1
            );

            continue;

        }

        let hit = false;

        for (
            const enemy of enemies
        ) {

            if (
                enemy.dead
            ) {
                continue;
            }

            const d =
                Math.hypot(
                    bullet.x -
                    enemy.x,
                    bullet.y -
                    enemy.y
                );

            if (
                d <
                bullet.radius +
                enemy.radius
            ) {

                hitEnemy(
                    enemy,
                    bullet.damage,
                    bullet.color
                );

                state.hits++;

                hit = true;

                break;

            }

        }

        if (hit) {

            bullets.splice(
                i,
                1
            );

        }

    }

}

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

        bullet.life -= dt;

        if (
            bullet.life <= 0 ||
            pointInsideWall(
                bullet.x,
                bullet.y,
                bullet.radius
            )
        ) {

            enemyBullets.splice(
                i,
                1
            );

            continue;

        }

        const d =
            Math.hypot(
                bullet.x -
                player.x,
                bullet.y -
                player.y
            );

        if (
            d <
            player.radius +
            bullet.radius
        ) {

            damagePlayer(
                bullet.damage
            );

            enemyBullets.splice(
                i,
                1
            );

        }

    }

}

/* =========================================================
   ENEMY DAMAGE
   ========================================================= */

function hitEnemy(
    enemy,
    damage,
    color
) {

    enemy.health -= damage;

    enemy.hitFlash = .08;

    enemy.stun =
        enemy.type === "boss"
            ? .015
            : .035;

    floatingText(
        enemy.x,
        enemy.y -
        enemy.radius -
        8,
        Math.round(damage),
        color
    );

    impactEffect(
        enemy.x,
        enemy.y,
        color
    );

    if (
        enemy.health <= 0
    ) {

        killEnemy(
            enemy
        );

    }

}

function killEnemy(enemy) {

    if (enemy.dead) {
        return;
    }

    enemy.dead = true;

    state.kills++;

    state.enemiesDefeated++;

    if (
        enemy.type === "boss"
    ) {

        state.bossesDefeated++;

        state.credits +=
            enemy.credits;

        notify(
            "SIGNAL WARDEN DEFEATED",
            COLORS.yellow,
            4000
        );

        unlockAchievement(
            "bossHunter"
        );

        for (
            let i = 0;
            i < 30;
            i++
        ) {

            particles.push({

                x:
                    enemy.x,

                y:
                    enemy.y,

                vx:
                    random(
                        -220,
                        220
                    ),

                vy:
                    random(
                        -220,
                        220
                    ),

                life:
                    random(
                        .4,
                        1.4
                    ),

                maxLife:
                    1.4,

                size:
                    random(
                        4,
                        12
                    ),

                color:
                    choose([
                        COLORS.yellow,
                        COLORS.cyan,
                        COLORS.purple
                    ]),

                alpha:
                    1

            });

        }

    } else {

        state.credits +=
            Math.round(
                enemy.credits *
                player.creditsMultiplier
            );

        if (
            Math.random() <
            .18
        ) {

            spawnPickup(
                enemy.x,
                enemy.y,
                choose([
                    "energy",
                    "credits",
                    "health",
                    "shield"
                ])
            );

        }

        if (
            Math.random() <
            .045
        ) {

            spawnPickup(
                enemy.x,
                enemy.y,
                "upgrade"
            );

        }

    }

    for (
        let i = 0;
        i < 10;
        i++
    ) {

        particles.push({

            x:
                enemy.x,

            y:
                enemy.y,

            vx:
                random(
                    -110,
                    110
                ),

            vy:
                random(
                    -110,
                    110
                ),

            life:
                random(
                    .25,
                    .75
                ),

            maxLife:
                .75,

            size:
                random(
                    2,
                    7
                ),

            color:
                enemy.color,

            alpha:
                1

        });

    }

    sound(
        enemy.type === "boss"
            ? 80
            : 220,
        enemy.type === "boss"
            ? .4
            : .08,
        "triangle",
        .025
    );

    checkAchievements();

    if (
        state.kills % 8 === 0
    ) {

        state.missionProgress++;

        if (
            state.missionProgress >=
            state.missionTarget
        ) {

            completeMission();

        }

    }

}

/* =========================================================
   PICKUPS
   ========================================================= */

function spawnPickup(
    x,
    y,
    type
) {

    pickups.push({

        x,
        y,

        type,

        radius: 11,

        life: 25,

        animation:
            random(
                0,
                TAU
            )

    });

}

function updatePickups(dt) {

    for (
        let i = pickups.length - 1;
        i >= 0;
        i--
    ) {

        const pickup =
            pickups[i];

        pickup.life -= dt;

        pickup.animation +=
            dt * 3;

        if (
            pickup.life <= 0
        ) {

            pickups.splice(
                i,
                1
            );

            continue;

        }

        const d =
            Math.hypot(
                player.x -
                pickup.x,
                player.y -
                pickup.y
            );

        if (
            d <
            player.pickupRadius
        ) {

            const dir =
                normalize(
                    player.x -
                    pickup.x,
                    player.y -
                    pickup.y
                );

            pickup.x +=
                dir.x *
                260 *
                dt;

            pickup.y +=
                dir.y *
                260 *
                dt;

        }

        if (
            d <
            player.radius +
            pickup.radius
        ) {

            collectPickup(
                pickup
            );

            pickups.splice(
                i,
                1
            );

        }

    }

}

function collectPickup(pickup) {

    switch (pickup.type) {

        case "health":

            player.health =
                clamp(
                    player.health + 25,
                    0,
                    player.maxHealth
                );

            notify(
                "+25 HEALTH",
                COLORS.green
            );

            break;

        case "energy":

            player.energy =
                clamp(
                    player.energy + 40,
                    0,
                    player.maxEnergy
                );

            notify(
                "+40 ENERGY",
                COLORS.cyan
            );

            break;

        case "shield":

            player.shield =
                clamp(
                    player.shield + 30,
                    0,
                    player.shieldMax
                );

            notify(
                "+30 SHIELD",
                COLORS.blue
            );

            break;

        case "credits":

            state.credits +=
                randomInt(
                    20,
                    65
                );

            notify(
                "CREDITS COLLECTED",
                COLORS.yellow
            );

            break;

        case "upgrade":

            applyRandomUpgrade();

            break;

    }

    sound(
        620,
        .08,
        "triangle",
        .025
    );

}

function applyRandomUpgrade() {

    const upgrades = [

        () => {
            player.maxHealth += 10;
            player.health += 10;
            notify(
                "UPGRADE: +10 MAX HEALTH",
                COLORS.green
            );
        },

        () => {
            player.maxEnergy += 10;
            player.energy += 10;
            notify(
                "UPGRADE: +10 MAX ENERGY",
                COLORS.cyan
            );
        },

        () => {
            player.speedMultiplier += .06;
            notify(
                "UPGRADE: MOVEMENT SPEED",
                COLORS.blue
            );
        },

        () => {
            player.damageMultiplier += .08;
            notify(
                "UPGRADE: DAMAGE",
                COLORS.red
            );
        },

        () => {
            player.creditsMultiplier += .15;
            notify(
                "UPGRADE: CREDIT BONUS",
                COLORS.yellow
            );
        },

        () => {
            player.armor += 8;
            notify(
                "UPGRADE: ARMOR",
                COLORS.purple
            );
        }

    ];

    choose(upgrades)();

}

/* =========================================================
   CHESTS
   ========================================================= */

function updateChests() {

    for (const chest of chests) {

        if (chest.opened) {
            continue;
        }

        const d =
            Math.hypot(
                player.x -
                chest.x,
                player.y -
                chest.y
            );

        if (d < 55) {

            if (keys.KeyE) {

                openChest(
                    chest
                );

                keys.KeyE = false;

            }

        }

    }

}

function openChest(chest) {

    if (chest.opened) {
        return;
    }

    chest.opened = true;

    state.chestsOpened++;

    state.credits +=
        randomInt(
            60,
            180
        );

    if (
        Math.random() <
        .25
    ) {

        applyRandomUpgrade();

    } else {

        spawnPickup(
            chest.x,
            chest.y,
            choose([
                "health",
                "energy",
                "shield"
            ])
        );

    }

    notify(
        "SUPPLY CACHE OPENED",
        COLORS.yellow
    );

    sound(
        420,
        .15,
        "triangle",
        .03
    );

    checkAchievements();

}

/* =========================================================
   TERMINALS
   ========================================================= */

function updateTerminals(dt) {

    for (const terminal of terminals) {

        if (terminal.used) {
            continue;
        }

        const d =
            Math.hypot(
                player.x -
                terminal.x,
                player.y -
                terminal.y
            );

        if (
            d < 65 &&
            keys.KeyE
        ) {

            terminal.progress +=
                dt;

            if (
                terminal.progress >= 1
            ) {

                terminal.used = true;

                state.missionProgress++;

                state.credits += 100;

                player.energy =
                    player.maxEnergy;

                notify(
                    "TERMINAL HACKED — +100 CREDITS",
                    COLORS.cyan,
                    2500
                );

                sound(
                    760,
                    .2,
                    "triangle",
                    .03
                );

                keys.KeyE = false;

            }

        } else {

            terminal.progress =
                Math.max(
                    0,
                    terminal.progress -
                    dt * 2
                );

        }

    }

}

/* =========================================================
   MISSIONS
   ========================================================= */

function completeMission() {

    state.missionProgress = 0;

    state.missionTarget =
        Math.min(
            20,
            state.missionTarget + 2
        );

    state.credits +=
        250;

    notify(
        "MISSION COMPLETE — +250 CREDITS",
        COLORS.yellow,
        3000
    );

    sound(
        700,
        .12,
        "triangle",
        .035
    );

    sound(
        950,
        .16,
        "triangle",
        .025
    );

}

/* =========================================================
   DOORS
   ========================================================= */

function updateDoors(dt) {

    for (const door of doors) {

        const d =
            Math.hypot(
                player.x -
                (
                    door.x +
                    door.w / 2
                ),
                player.y -
                (
                    door.y +
                    door.h / 2
                )
            );

        if (
            door.auto &&
            d < 140
        ) {

            door.open = true;

        }

        if (
            d > 190 &&
            door.auto
        ) {

            door.open = false;

        }

        if (door.open) {

            door.progress =
                Math.min(
                    1,
                    door.progress +
                    dt * 4
                );

        } else {

            door.progress =
                Math.max(
                    0,
                    door.progress -
                    dt * 4
                );

        }

    }

}

/* =========================================================
   PARTICLES
   ========================================================= */

function impactEffect(
    x,
    y,
    color
) {

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        particles.push({

            x,
            y,

            vx:
                random(
                    -60,
                    60
                ),

            vy:
                random(
                    -60,
                    60
                ),

            life:
                random(
                    .12,
                    .3
                ),

            maxLife:
                .3,

            size:
                random(
                    2,
                    5
                ),

            color,

            alpha: 1

        });

    }

}

function muzzleFlash(
    x,
    y,
    color,
    angle
) {

    effects.push({

        type: "muzzle",

        x,
        y,

        angle,

        color,

        life: .07,

        maxLife: .07

    });

}

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

        p.vx *=
            Math.pow(
                .05,
                dt
            );

        p.vy *=
            Math.pow(
                .05,
                dt
            );

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

function updateEffects(dt) {

    for (
        let i =
            effects.length - 1;
        i >= 0;
        i--
    ) {

        const effect =
            effects[i];

        effect.life -= dt;

        if (
            effect.life <= 0
        ) {

            effects.splice(
                i,
                1
            );

        }

    }

}

/* =========================================================
   FLOATING TEXT
   ========================================================= */

function floatingText(
    x,
    y,
    text,
    color
) {

    floatingTexts.push({

        x,
        y,

        text:
            String(text),

        color,

        life:
            1,

        maxLife:
            1

    });

}

function updateFloatingTexts(dt) {

    for (
        let i =
            floatingTexts.length - 1;
        i >= 0;
        i--
    ) {

        const text =
            floatingTexts[i];

        text.y -=
            28 * dt;

        text.life -= dt;

        if (
            text.life <= 0
        ) {

            floatingTexts.splice(
                i,
                1
            );

        }

    }

}

/* =========================================================
   WEATHER
   ========================================================= */

function createRain() {

    rain.length = 0;

    for (
        let i = 0;
        i < 450;
        i++
    ) {

        rain.push({

            x:
                Math.random() *
                W,

            y:
                Math.random() *
                H,

            length:
                random(
                    8,
                    20
                ),

            speed:
                random(
                    450,
                    750
                ),

            drift:
                random(
                    -60,
                    20
                )

        });

    }

}

function updateRain(dt) {

    for (const drop of rain) {

        drop.x +=
            drop.drift * dt;

        drop.y +=
            drop.speed * dt;

        if (
            drop.y >
            H + 30
        ) {

            drop.y =
                -30;

            drop.x =
                Math.random() *
                W;

        }

    }

}

/* =========================================================
   CAMERA
   ========================================================= */

const camera = {

    x: player.x,
    y: player.y,

    targetX: player.x,
    targetY: player.y,

    zoom: 1

};

function updateCamera(dt) {

    camera.targetX =
        player.x;

    camera.targetY =
        player.y;

    camera.x +=
        (
            camera.targetX -
            camera.x
        ) *
        Math.min(
            1,
            dt * 7
        );

    camera.y +=
        (
            camera.targetY -
            camera.y
        ) *
        Math.min(
            1,
            dt * 7
        );

}

function worldToScreen(
    x,
    y
) {

    let sx =
        (
            x -
            camera.x
        ) *
        camera.zoom +
        W / 2;

    let sy =
        (
            y -
            camera.y
        ) *
        camera.zoom +
        H / 2;

    if (
        state.cameraShake >
        0
    ) {

        sx +=
            random(
                -state.cameraShake,
                state.cameraShake
            );

        sy +=
            random(
                -state.cameraShake,
                state.cameraShake
            );

    }

    return {
        x: sx,
        y: sy
    };

}

function screenToWorld(
    x,
    y
) {

    return {

        x:
            (
                x -
                W / 2
            ) /
                camera.zoom +
            camera.x,

        y:
            (
                y -
                H / 2
            ) /
                camera.zoom +
            camera.y

    };

}

/* =========================================================
   RENDER — FLOOR
   ========================================================= */

function drawFloor() {

    ctx.fillStyle =
        COLORS.background;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    const grid =
        80;

    const startX =
        Math.floor(
            (
                camera.x -
                W /
                    2 /
                    camera.zoom
            ) /
                grid
        ) *
        grid;

    const startY =
        Math.floor(
            (
                camera.y -
                H /
                    2 /
                    camera.zoom
            ) /
                grid
        ) *
        grid;

    ctx.save();

    ctx.globalAlpha =
        .35;

    ctx.strokeStyle =
        "#24313a";

    ctx.lineWidth = 1;

    for (
        let x =
            startX;
        x <
        camera.x +
            W /
                2 /
                camera.zoom +
            grid;
        x += grid
    ) {

        const screen =
            worldToScreen(
                x,
                0
            );

        ctx.beginPath();

        ctx.moveTo(
            screen.x,
            0
        );

        ctx.lineTo(
            screen.x,
            H
        );

        ctx.stroke();

    }

    for (
        let y =
            startY;
        y <
        camera.y +
            H /
                2 /
                camera.zoom +
            grid;
        y += grid
    ) {

        const screen =
            worldToScreen(
                0,
                y
            );

        ctx.beginPath();

        ctx.moveTo(
            0,
            screen.y
        );

        ctx.lineTo(
            W,
            screen.y
        );

        ctx.stroke();

    }

    ctx.restore();

}

/* =========================================================
   RENDER — ZONES
   ========================================================= */

function drawZones() {

    for (const zone of zones) {

        const topLeft =
            worldToScreen(
                zone.x,
                zone.y
            );

        const bottomRight =
            worldToScreen(
                zone.x +
                zone.w,
                zone.y +
                zone.h
            );

        ctx.save();

        ctx.globalAlpha =
            .025;

        ctx.fillStyle =
            zone.color;

        ctx.fillRect(

            topLeft.x,
            topLeft.y,

            bottomRight.x -
                topLeft.x,

            bottomRight.y -
                topLeft.y

        );

        ctx.globalAlpha =
            .15;

        ctx.font =
            "bold 11px Arial";

        ctx.fillStyle =
            zone.color;

        ctx.fillText(
            zone.name,
            topLeft.x + 15,
            topLeft.y + 24
        );

        ctx.restore();

    }

}

/* =========================================================
   RENDER — WALLS
   ========================================================= */

function drawWalls() {

    for (const wall of walls) {

        const p =
            worldToScreen(
                wall.x,
                wall.y
            );

        const w =
            wall.w *
            camera.zoom;

        const h =
            wall.h *
            camera.zoom;

        ctx.save();

        ctx.fillStyle =
            COLORS.wallDark;

        ctx.fillRect(
            p.x + 5,
            p.y + 7,
            w,
            h
        );

        ctx.fillStyle =
            COLORS.wall;

        ctx.fillRect(
            p.x,
            p.y,
            w,
            h
        );

        ctx.fillStyle =
            COLORS.wallTop;

        ctx.fillRect(
            p.x,
            p.y,
            w,
            Math.min(
                8,
                h
            )
        );

        ctx.strokeStyle =
            "rgba(110,170,190,.18)";

        ctx.strokeRect(
            p.x,
            p.y,
            w,
            h
        );

        ctx.restore();

    }

}

function drawDoors() {

    for (const door of doors) {

        const p =
            worldToScreen(
                door.x,
                door.y
            );

        const w =
            door.w *
            camera.zoom;

        const h =
            door.h *
            camera.zoom;

        ctx.save();

        if (door.open) {

            ctx.globalAlpha =
                .25;

        }

        ctx.fillStyle =
            door.open
                ? COLORS.cyan
                : "#59656f";

        ctx.fillRect(
            p.x,
            p.y,
            w,
            h
        );

        ctx.strokeStyle =
            door.open
                ? COLORS.cyan
                : "#87939c";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            p.x,
            p.y,
            w,
            h
        );

        ctx.restore();

    }

}

/* =========================================================
   RENDER — PROPS
   ========================================================= */

function drawProps() {

    for (const prop of props) {

        const p =
            worldToScreen(
                prop.x,
                prop.y
            );

        const s =
            prop.scale *
            camera.zoom;

        ctx.save();

        ctx.translate(
            p.x,
            p.y
        );

        ctx.rotate(
            prop.rotation
        );

        switch (prop.type) {

            case "crate":

                ctx.fillStyle =
                    "#46525b";

                ctx.fillRect(
                    -18 * s,
                    -18 * s,
                    36 * s,
                    36 * s
                );

                ctx.strokeStyle =
                    "#76838b";

                ctx.strokeRect(
                    -18 * s,
                    -18 * s,
                    36 * s,
                    36 * s
                );

                ctx.strokeStyle =
                    "#2a3339";

                ctx.beginPath();

                ctx.moveTo(
                    -18 * s,
                    -18 * s
                );

                ctx.lineTo(
                    18 * s,
                    18 * s
                );

                ctx.moveTo(
                    18 * s,
                    -18 * s
                );

                ctx.lineTo(
                    -18 * s,
                    18 * s
                );

                ctx.stroke();

                break;

            case "container":

                ctx.fillStyle =
                    "#273e48";

                ctx.fillRect(
                    -28 * s,
                    -12 * s,
                    56 * s,
                    24 * s
                );

                ctx.strokeStyle =
                    "#4c7683";

                ctx.strokeRect(
                    -28 * s,
                    -12 * s,
                    56 * s,
                    24 * s
                );

                break;

            case "barrel":

                ctx.fillStyle =
                    "#38434a";

                ctx.beginPath();

                ctx.arc(
                    0,
                    0,
                    18 * s,
                    0,
                    TAU
                );

                ctx.fill();

                ctx.strokeStyle =
                    "#78868d";

                ctx.stroke();

                break;

            case "machine":

                ctx.fillStyle =
                    "#1d2930";

                ctx.fillRect(
                    -20 * s,
                    -25 * s,
                    40 * s,
                    50 * s
                );

                ctx.fillStyle =
                    COLORS.cyan;

                ctx.globalAlpha =
                    .5;

                ctx.fillRect(
                    -10 * s,
                    -12 * s,
                    20 * s,
                    5 * s
                );

                ctx.globalAlpha =
                    1;

                break;

            case "console":

                ctx.fillStyle =
                    "#172127";

                ctx.fillRect(
                    -20 * s,
                    -14 * s,
                    40 * s,
                    28 * s
                );

                ctx.fillStyle =
                    "#5eeaff";

                ctx.fillRect(
                    -12 * s,
                    -7 * s,
                    24 * s,
                    10 * s
                );

                break;

            case "rock":

                ctx.fillStyle =
                    "#303b42";

                ctx.beginPath();

                ctx.moveTo(
                    -20 * s,
                    10 * s
                );

                ctx.lineTo(
                    -9 * s,
                    -18 * s
                );

                ctx.lineTo(
                    15 * s,
                    -13 * s
                );

                ctx.lineTo(
                    23 * s,
                    10 * s
                );

                ctx.lineTo(
                    0,
                    20 * s
                );

                ctx.closePath();

                ctx.fill();

                break;

        }

        ctx.restore();

    }

}

/* =========================================================
   RENDER — LIGHTS
   ========================================================= */

function drawLights() {

    /*
       Donkere overlay met transparante
       lichtcirkels.
    */

    ctx.save();

    ctx.fillStyle =
        "rgba(2,5,9,.62)";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    ctx.globalCompositeOperation =
        "destination-out";

    for (const light of lights) {

        const p =
            worldToScreen(
                light.x,
                light.y
            );

        const radius =
            light.radius *
            camera.zoom;

        const gradient =
            ctx.createRadialGradient(
                p.x,
                p.y,
                0,
                p.x,
                p.y,
                radius
            );

        gradient.addColorStop(
            0,
            "rgba(255,255,255,.95)"
        );

        gradient.addColorStop(
            .35,
            "rgba(255,255,255,.5)"
        );

        gradient.addColorStop(
            1,
            "rgba(255,255,255,0)"
        );

        ctx.fillStyle =
            gradient;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            radius,
            0,
            TAU
        );

        ctx.fill();

    }

    /*
       Spelerlicht
    */

    const playerScreen =
        worldToScreen(
            player.x,
            player.y
        );

    const playerRadius =
        260 *
        camera.zoom;

    const playerGradient =
        ctx.createRadialGradient(
            playerScreen.x,
            playerScreen.y,
            0,
            playerScreen.x,
            playerScreen.y,
            playerRadius
        );

    playerGradient.addColorStop(
        0,
        "rgba(255,255,255,.9)"
    );

    playerGradient.addColorStop(
        .25,
        "rgba(255,255,255,.45)"
    );

    playerGradient.addColorStop(
        1,
        "rgba(255,255,255,0)"
    );

    ctx.fillStyle =
        playerGradient;

    ctx.beginPath();

    ctx.arc(
        playerScreen.x,
        playerScreen.y,
        playerRadius,
        0,
        TAU
    );

    ctx.fill();

    ctx.restore();

    /*
       Gekleurde lichtgloed
    */

    ctx.save();

    ctx.globalCompositeOperation =
        "screen";

    for (const light of lights) {

        const p =
            worldToScreen(
                light.x,
                light.y
            );

        const radius =
            light.radius *
            camera.zoom;

        const gradient =
            ctx.createRadialGradient(
                p.x,
                p.y,
                0,
                p.x,
                p.y,
                radius
            );

        gradient.addColorStop(
            0,
            hexToRgba(
                light.color,
                .16 *
                    light.intensity
            )
        );

        gradient.addColorStop(
            1,
            hexToRgba(
                light.color,
                0
            )
        );

        ctx.fillStyle =
            gradient;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            radius,
            0,
            TAU
        );

        ctx.fill();

    }

    ctx.restore();

}

function hexToRgba(
    hex,
    alpha
) {

    const value =
        hex.replace(
            "#",
            ""
        );

    const r =
        parseInt(
            value.substring(
                0,
                2
            ),
            16
        );

    const g =
        parseInt(
            value.substring(
                2,
                4
            ),
            16
        );

    const b =
        parseInt(
            value.substring(
                4,
                6
            ),
            16
        );

    return `rgba(${r},${g},${b},${alpha})`;

}

/* =========================================================
   RENDER — CHESTS
   ========================================================= */

function drawChests() {

    for (const chest of chests) {

        const p =
            worldToScreen(
                chest.x,
                chest.y
            );

        const pulse =
            Math.sin(
                state.time * 3 +
                chest.glow
            ) *
            .5 +
            .5;

        ctx.save();

        ctx.shadowBlur =
            15;

        ctx.shadowColor =
            COLORS.yellow;

        ctx.fillStyle =
            chest.opened
                ? "#344047"
                : "#765e29";

        ctx.fillRect(
            p.x - 18,
            p.y - 12,
            36,
            24
        );

        ctx.shadowBlur = 0;

        ctx.strokeStyle =
            chest.opened
                ? "#627078"
                : "#ffd86b";

        ctx.strokeRect(
            p.x - 18,
            p.y - 12,
            36,
            24
        );

        if (!chest.opened) {

            ctx.globalAlpha =
                .3 +
                pulse * .35;

            ctx.fillStyle =
                COLORS.yellow;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                30 +
                    pulse * 5,
                0,
                TAU
            );

            ctx.fill();

        }

        ctx.restore();

    }

}

/* =========================================================
   RENDER — TERMINALS
   ========================================================= */

function drawTerminals() {

    for (const terminal of terminals) {

        const p =
            worldToScreen(
                terminal.x,
                terminal.y
            );

        ctx.save();

        ctx.fillStyle =
            "#17232b";

        ctx.fillRect(
            p.x - 16,
            p.y - 24,
            32,
            48
        );

        ctx.strokeStyle =
            terminal.used
                ? "#4e6570"
                : COLORS.cyan;

        ctx.strokeRect(
            p.x - 16,
            p.y - 24,
            32,
            48
        );

        ctx.fillStyle =
            terminal.used
                ? "#51616a"
                : COLORS.cyan;

        ctx.fillRect(
            p.x - 9,
            p.y - 11,
            18,
            9
        );

        ctx.fillStyle =
            terminal.used
                ? "#51616a"
                : COLORS.green;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y + 10,
            4,
            0,
            TAU
        );

        ctx.fill();

        ctx.restore();

    }

}

/* =========================================================
   RENDER — PICKUPS
   ========================================================= */

function drawPickups() {

    for (const pickup of pickups) {

        const p =
            worldToScreen(
                pickup.x,
                pickup.y
            );

        const bob =
            Math.sin(
                pickup.animation
            ) * 4;

        let color =
            COLORS.cyan;

        if (
            pickup.type ===
            "health"
        ) {
            color =
                COLORS.green;
        }

        if (
            pickup.type ===
            "shield"
        ) {
            color =
                COLORS.blue;
        }

        if (
            pickup.type ===
            "credits"
        ) {
            color =
                COLORS.yellow;
        }

        if (
            pickup.type ===
            "upgrade"
        ) {
            color =
                COLORS.purple;
        }

        ctx.save();

        ctx.shadowBlur =
            18;

        ctx.shadowColor =
            color;

        ctx.fillStyle =
            color;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y + bob,
            8,
            0,
            TAU
        );

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.strokeStyle =
            "#ffffff";

        ctx.globalAlpha =
            .55;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y + bob,
            13,
            0,
            TAU
        );

        ctx.stroke();

        ctx.restore();

    }

}

/* =========================================================
   RENDER — BULLETS
   ========================================================= */

function drawBullets() {

    for (const bullet of bullets) {

        const p =
            worldToScreen(
                bullet.x,
                bullet.y
            );

        ctx.save();

        ctx.shadowBlur =
            bullet.glow ||
            10;

        ctx.shadowColor =
            bullet.color;

        ctx.fillStyle =
            bullet.color;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            bullet.radius *
                camera.zoom,
            0,
            TAU
        );

        ctx.fill();

        ctx.restore();

    }

    for (
        const bullet of enemyBullets
    ) {

        const p =
            worldToScreen(
                bullet.x,
                bullet.y
            );

        ctx.save();

        ctx.shadowBlur =
            16;

        ctx.shadowColor =
            bullet.color;

        ctx.fillStyle =
            bullet.color;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            bullet.radius *
                camera.zoom,
            0,
            TAU
        );

        ctx.fill();

        ctx.restore();

    }

}

/* =========================================================
   RENDER — ENEMIES
   ========================================================= */

function drawEnemies() {

    for (const enemy of enemies) {

        if (enemy.dead) {
            continue;
        }

        const p =
            worldToScreen(
                enemy.x,
                enemy.y
            );

        const pulse =
            Math.sin(
                enemy.animation
            ) *
            2;

        ctx.save();

        /*
           Glow
        */

        ctx.shadowBlur =
            enemy.type === "boss"
                ? 35
                : 18;

        ctx.shadowColor =
            enemy.color;

        ctx.fillStyle =
            enemy.hitFlash > 0
                ? "#ffffff"
                : enemy.color;

        /*
           Vorm
        */

        if (
            enemy.type ===
            "boss"
        ) {

            ctx.beginPath();

            for (
                let i = 0;
                i < 8;
                i++
            ) {

                const angle =
                    i *
                    TAU /
                    8 +
                    state.time *
                    .15;

                const radius =
                    enemy.radius +
                    Math.sin(
                        state.time * 2 +
                        i
                    ) *
                    4;

                const x =
                    p.x +
                    Math.cos(angle) *
                    radius;

                const y =
                    p.y +
                    Math.sin(angle) *
                    radius;

                if (i === 0) {
                    ctx.moveTo(
                        x,
                        y
                    );
                } else {
                    ctx.lineTo(
                        x,
                        y
                    );
                }

            }

            ctx.closePath();

            ctx.fill();

        } else {

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                enemy.radius +
                    pulse,
                0,
                TAU
            );

            ctx.fill();

        }

        ctx.shadowBlur = 0;

        /*
           Kern
        */

        ctx.fillStyle =
            "#071016";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            enemy.radius * .42,
            0,
            TAU
        );

        ctx.fill();

        /*
           Richting
        */

        const angle =
            angleBetween(
                enemy,
                player
            );

        ctx.strokeStyle =
            "#ffffff";

        ctx.globalAlpha =
            .7;

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            p.x +
                Math.cos(angle) *
                5,
            p.y +
                Math.sin(angle) *
                5
        );

        ctx.lineTo(
            p.x +
                Math.cos(angle) *
                enemy.radius *
                .75,
            p.y +
                Math.sin(angle) *
                enemy.radius *
                .75
        );

        ctx.stroke();

        /*
           Health bar
        */

        const barWidth =
            enemy.type === "boss"
                ? 110
                : 38;

        const healthRatio =
            clamp(
                enemy.health /
                enemy.maxHealth,
                0,
                1
            );

        ctx.fillStyle =
            "rgba(0,0,0,.65)";

        ctx.fillRect(
            p.x -
                barWidth / 2,
            p.y -
                enemy.radius -
                12,
            barWidth,
            4
        );

        ctx.fillStyle =
            enemy.color;

        ctx.fillRect(
            p.x -
                barWidth / 2,
            p.y -
                enemy.radius -
                12,
            barWidth *
                healthRatio,
            4
        );

        ctx.restore();

    }

}

/* =========================================================
   RENDER — PLAYER
   ========================================================= */

function drawPlayer() {

    const p =
        worldToScreen(
            player.x,
            player.y
        );

    ctx.save();

    const flicker =
        player.invulnerable > 0 &&
        Math.floor(
            player.invulnerable * 20
        ) % 2 === 0;

    ctx.globalAlpha =
        flicker
            ? .5
            : 1;

    /*
       Shield
    */

    if (
        player.shield > 0
    ) {

        ctx.strokeStyle =
            COLORS.cyan;

        ctx.globalAlpha =
            .3 +
            (
                player.shield /
                player.shieldMax
            ) *
            .4;

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            player.radius +
            8,
            0,
            TAU
        );

        ctx.stroke();

        ctx.globalAlpha =
            flicker
                ? .5
                : 1;

    }

    /*
       Glow
    */

    ctx.shadowBlur =
        22;

    ctx.shadowColor =
        COLORS.cyan;

    ctx.fillStyle =
        "#d9faff";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        player.radius -
            player.recoil * 3,
        0,
        TAU
    );

    ctx.fill();

    ctx.shadowBlur = 0;

    /*
       Body
    */

    ctx.fillStyle =
        "#182b35";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        player.radius -
            3,
        0,
        TAU
    );

    ctx.fill();

    ctx.strokeStyle =
        COLORS.cyan;

    ctx.lineWidth = 2;

    ctx.stroke();

    /*
       Weapon
    */

    const weaponLength =
        30 +
        player.recoil * 7;

    ctx.save();

    ctx.translate(
        p.x,
        p.y
    );

    ctx.rotate(
        player.angle
    );

    ctx.fillStyle =
        "#70828c";

    ctx.fillRect(
        2,
        -4,
        weaponLength,
        8
    );

    ctx.fillStyle =
        weapons[
            state.currentWeapon
        ].color;

    ctx.fillRect(
        weaponLength - 7,
        -3,
        8,
        6
    );

    ctx.restore();

    /*
       Energy core
    */

    ctx.fillStyle =
        COLORS.cyan;

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        5 +
            Math.sin(
                state.time * 5
            ),
        0,
        TAU
    );

    ctx.fill();

    ctx.restore();

}

/* =========================================================
   RENDER — PARTICLES
   ========================================================= */

function drawParticles() {

    for (const p of particles) {

        const screen =
            worldToScreen(
                p.x,
                p.y
            );

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

        ctx.fillStyle =
            p.color;

        ctx.beginPath();

        ctx.arc(
            screen.x,
            screen.y,
            p.size *
                camera.zoom,
            0,
            TAU
        );

        ctx.fill();

        ctx.restore();

    }

}

/* =========================================================
   RENDER — EFFECTS
   ========================================================= */

function drawEffects() {

    for (const effect of effects) {

        const p =
            worldToScreen(
                effect.x,
                effect.y
            );

        if (
            effect.type ===
            "muzzle"
        ) {

            const progress =
                1 -
                effect.life /
                    effect.maxLife;

            ctx.save();

            ctx.translate(
                p.x,
                p.y
            );

            ctx.rotate(
                effect.angle
            );

            ctx.globalAlpha =
                1 -
                progress;

            ctx.fillStyle =
                effect.color;

            ctx.shadowBlur =
                20;

            ctx.shadowColor =
                effect.color;

            ctx.beginPath();

            ctx.moveTo(
                0,
                0
            );

            ctx.lineTo(
                35,
                -9
            );

            ctx.lineTo(
                25,
                0
            );

            ctx.lineTo(
                35,
                9
            );

            ctx.closePath();

            ctx.fill();

            ctx.restore();

        }

    }

}

/* =========================================================
   RENDER — FLOATING TEXT
   ========================================================= */

function drawFloatingTexts() {

    for (
        const floating of floatingTexts
    ) {

        const p =
            worldToScreen(
                floating.x,
                floating.y
            );

        ctx.save();

        ctx.globalAlpha =
            clamp(
                floating.life /
                floating.maxLife,
                0,
                1
            );

        ctx.fillStyle =
            floating.color;

        ctx.font =
            "bold 13px Arial";

        ctx.textAlign =
            "center";

        ctx.fillText(
            floating.text,
            p.x,
            p.y
        );

        ctx.restore();

    }

}

/* =========================================================
   RENDER — WEATHER
   ========================================================= */

function drawRain() {

    if (
        state.weatherIntensity <= 0
    ) {
        return;
    }

    ctx.save();

    ctx.globalAlpha =
        .16 *
        state.weatherIntensity;

    ctx.strokeStyle =
        "#9ddcff";

    ctx.lineWidth = 1;

    for (const drop of rain) {

        ctx.beginPath();

        ctx.moveTo(
            drop.x,
            drop.y
        );

        ctx.lineTo(
            drop.x -
                5,
            drop.y +
                drop.length
        );

        ctx.stroke();

    }

    ctx.restore();

}

/* =========================================================
   RENDER — VIGNETTE
   ========================================================= */

function drawVignette() {

    const gradient =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            Math.min(
                W,
                H
            ) * .2,
            W / 2,
            H / 2,
            Math.max(
                W,
                H
            ) * .72
        );

    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
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

/* =========================================================
   RENDER — CROSSHAIR
   ========================================================= */

function drawCrosshair() {

    if (
        !state.running ||
        state.paused ||
        state.mapOpen
    ) {
        return;
    }

    ctx.save();

    ctx.translate(
        mouse.x,
        mouse.y
    );

    ctx.strokeStyle =
        COLORS.cyan;

    ctx.globalAlpha =
        .75;

    ctx.lineWidth = 1.5;

    const size = 9;

    ctx.beginPath();

    ctx.moveTo(
        -size,
        0
    );

    ctx.lineTo(
        -3,
        0
    );

    ctx.moveTo(
        size,
        0
    );

    ctx.lineTo(
        3,
        0
    );

    ctx.moveTo(
        0,
        -size
    );

    ctx.lineTo(
        0,
        -3
    );

    ctx.moveTo(
        0,
        size
    );

    ctx.lineTo(
        0,
        3
    );

    ctx.stroke();

    ctx.restore();

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

    drawFloor();

    drawZones();

    drawProps();

    drawWalls();

    drawDoors();

    drawChests();

    drawTerminals();

    drawPickups();

    drawBullets();

    drawEnemies();

    drawPlayer();

    drawParticles();

    drawEffects();

    drawFloatingTexts();

    drawLights();

    drawRain();

    drawVignette();

    drawCrosshair();

}

/* =========================================================
   HUD
   ========================================================= */

function updateHUD() {

    if (healthBar) {

        healthBar.style.width =
            `${clamp(
                player.health /
                player.maxHealth *
                100,
                0,
                100
            )}%`;

    }

    if (energyBar) {

        energyBar.style.width =
            `${clamp(
                player.energy /
                player.maxEnergy *
                100,
                0,
                100
            )}%`;

    }

    if (killsText) {

        killsText.textContent =
            `KILLS: ${state.kills}`;

    }

    if (creditsText) {

        creditsText.textContent =
            `CREDITS: ${Math.floor(
                state.credits
            )}`;

    }

    if (ammoText) {

        const weapon =
            weapons[
                state.currentWeapon
            ];

        if (
            weapon.reloadTimer > 0
        ) {

            ammoText.textContent =
                "RELOADING";

        } else {

            ammoText.textContent =
                `${weapon.ammo} / ∞`;

        }

    }

    if (zoneText) {

        const zone =
            getCurrentZone();

        zoneText.textContent =
            zone
                ? zone.name
                : "UNKNOWN SECTOR";

    }

    if (objectiveText) {

        objectiveText.textContent =
            `SIGNAL TRACE ${state.missionProgress}/${state.missionTarget}`;

    }

}

function getCurrentZone() {

    for (const zone of zones) {

        if (
            player.x >= zone.x &&
            player.x <=
                zone.x +
                zone.w &&
            player.y >= zone.y &&
            player.y <=
                zone.y +
                zone.h
        ) {

            return zone;

        }

    }

    return null;

}

/* =========================================================
   MAP
   ========================================================= */

function toggleMap() {

    state.mapOpen =
        !state.mapOpen;

    const map =
        document.getElementById(
            "map"
        );

    if (!map) {
        return;
    }

    map.style.display =
        state.mapOpen
            ? "flex"
            : "none";

    if (
        state.mapOpen
    ) {

        drawMap();

    }

}

function drawMap() {

    const mapCanvas =
        document.getElementById(
            "mapCanvas"
        );

    if (!mapCanvas) {
        return;
    }

    const mapCtx =
        mapCanvas.getContext(
            "2d"
        );

    const width =
        mapCanvas.width =
            760;

    const height =
        mapCanvas.height =
            520;

    mapCtx.fillStyle =
        "#081016";

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
        "rgba(100,230,255,.15)";

    for (
        let x = 0;
        x < width;
        x += 40
    ) {

        mapCtx.beginPath();

        mapCtx.moveTo(
            x,
            0
        );

        mapCtx.lineTo(
            x,
            height
        );

        mapCtx.stroke();

    }

    for (
        let y = 0;
        y < height;
        y += 40
    ) {

        mapCtx.beginPath();

        mapCtx.moveTo(
            0,
            y
        );

        mapCtx.lineTo(
            width,
            y
        );

        mapCtx.stroke();

    }

    mapCtx.fillStyle =
        "rgba(70,100,120,.7)";

    for (const wall of walls) {

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
        COLORS.yellow;

    for (const chest of chests) {

        if (!chest.opened) {

            mapCtx.fillRect(
                chest.x *
                    scaleX -
                    3,
                chest.y *
                    scaleY -
                    3,
                6,
                6
            );

        }

    }

    mapCtx.fillStyle =
        COLORS.red;

    for (const enemy of enemies) {

        if (!enemy.dead) {

            mapCtx.beginPath();

            mapCtx.arc(
                enemy.x *
                    scaleX,
                enemy.y *
                    scaleY,
                enemy.type ===
                    "boss"
                    ? 7
                    : 3,
                0,
                TAU
            );

            mapCtx.fill();

        }

    }

    mapCtx.fillStyle =
        COLORS.cyan;

    mapCtx.beginPath();

    mapCtx.arc(
        player.x *
            scaleX,
        player.y *
            scaleY,
        6,
        0,
        TAU
    );

    mapCtx.fill();

}

/* =========================================================
   ACHIEVEMENTS SCREEN
   ========================================================= */

function showAchievements() {

    let overlay =
        document.getElementById(
            "extendedAchievements"
        );

    if (!overlay) {

        overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "extendedAchievements";

        overlay.style.position =
            "fixed";

        overlay.style.inset =
            "0";

        overlay.style.zIndex =
            "1000";

        overlay.style.background =
            "rgba(3,7,11,.96)";

        overlay.style.display =
            "flex";

        overlay.style.alignItems =
            "center";

        overlay.style.justifyContent =
            "center";

        overlay.style.padding =
            "30px";

        document.body.appendChild(
            overlay
        );

    }

    overlay.innerHTML = "";

    const panel =
        document.createElement(
            "div"
        );

    panel.style.width =
        "min(900px, 95vw)";

    panel.style.maxHeight =
        "85vh";

    panel.style.overflow =
        "auto";

    panel.style.padding =
        "30px";

    panel.style.background =
        "#0d151d";

    panel.style.border =
        "1px solid rgba(84,231,255,.35)";

    panel.style.boxShadow =
        "0 0 60px rgba(84,231,255,.08)";

    const title =
        document.createElement(
            "h2"
        );

    title.textContent =
        "ACHIEVEMENTS";

    title.style.color =
        COLORS.cyan;

    title.style.letterSpacing =
        "5px";

    panel.appendChild(
        title
    );

    const grid =
        document.createElement(
            "div"
        );

    grid.style.display =
        "grid";

    grid.style.gridTemplateColumns =
        "repeat(auto-fit,minmax(220px,1fr))";

    grid.style.gap =
        "12px";

    for (
        const id in achievements
    ) {

        const achievement =
            achievements[id];

        const unlocked =
            isAchievementUnlocked(
                id
            );

        const card =
            document.createElement(
                "div"
            );

        card.style.padding =
            "18px";

        card.style.background =
            unlocked
                ? "rgba(84,231,255,.08)"
                : "rgba(255,255,255,.025)";

        card.style.border =
            `1px solid ${
                unlocked
                    ? "rgba(84,231,255,.4)"
                    : "rgba(255,255,255,.08)"
            }`;

        const name =
            document.createElement(
                "div"
            );

        name.textContent =
            unlocked
                ? achievement.title
                : "LOCKED";

        name.style.color =
            unlocked
                ? COLORS.cyan
                : "#68747c";

        name.style.fontWeight =
            "bold";

        name.style.letterSpacing =
            "2px";

        const description =
            document.createElement(
                "div"
            );

        description.textContent =
            achievement.description;

        description.style.marginTop =
            "8px";

        description.style.color =
            unlocked
                ? "#dceaf0"
                : "#59636a";

        card.appendChild(
            name
        );

        card.appendChild(
            description
        );

        grid.appendChild(
            card
        );

    }

    panel.appendChild(
        grid
    );

    const close =
        document.createElement(
            "button"
        );

    close.textContent =
        "CLOSE";

    close.style.marginTop =
        "24px";

    close.style.padding =
        "12px 28px";

    close.style.background =
        "transparent";

    close.style.color =
        COLORS.cyan;

    close.style.border =
        `1px solid ${COLORS.cyan}`;

    close.style.cursor =
        "pointer";

    close.onclick = () => {

        overlay.style.display =
            "none";

    };

    panel.appendChild(
        close
    );

    overlay.appendChild(
        panel
    );

    overlay.style.display =
        "flex";

}

/* =========================================================
   CONTROLS SCREEN
   ========================================================= */

function showControls() {

    let overlay =
        document.getElementById(
            "extendedControls"
        );

    if (!overlay) {

        overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "extendedControls";

        overlay.style.position =
            "fixed";

        overlay.style.inset =
            "0";

        overlay.style.zIndex =
            "1000";

        overlay.style.background =
            "rgba(3,7,11,.96)";

        overlay.style.display =
            "flex";

        overlay.style.alignItems =
            "center";

        overlay.style.justifyContent =
            "center";

        document.body.appendChild(
            overlay
        );

    }

    overlay.innerHTML = "";

    const panel =
        document.createElement(
            "div"
        );

    panel.style.width =
        "min(600px,90vw)";

    panel.style.padding =
        "35px";

    panel.style.background =
        "#0d151d";

    panel.style.border =
        "1px solid rgba(84,231,255,.35)";

    panel.innerHTML = `

        <h2 style="
            color:#54e7ff;
            letter-spacing:5px;
            margin-top:0;
        ">
            CONTROLS
        </h2>

        <div style="
            display:grid;
            grid-template-columns:140px 1fr;
            gap:14px;
            color:#d8e8ee;
            line-height:1.5;
        ">

            <b>W A S D</b>
            <span>Bewegen</span>

            <b>MOUSE</b>
            <span>Richten</span>

            <b>LEFT CLICK</b>
            <span>Schieten</span>

            <b>SPACE</b>
            <span>Dash</span>

            <b>E</b>
            <span>Kisten / terminals gebruiken</span>

            <b>1 - 4</b>
            <span>Wapen kiezen</span>

            <b>M</b>
            <span>Kaart</span>

            <b>ESC</b>
            <span>Pauzeren</span>

        </div>

    `;

    const close =
        document.createElement(
            "button"
        );

    close.textContent =
        "CLOSE";

    close.style.marginTop =
        "28px";

    close.style.padding =
        "12px 28px";

    close.style.background =
        "transparent";

    close.style.color =
        COLORS.cyan;

    close.style.border =
        `1px solid ${COLORS.cyan}`;

    close.style.cursor =
        "pointer";

    close.onclick = () => {

        overlay.style.display =
            "none";

    };

    panel.appendChild(
        close
    );

    overlay.appendChild(
        panel
    );

    overlay.style.display =
        "flex";

}

/* =========================================================
   SAVE / LOAD
   ========================================================= */

function saveGame(slot = 0) {

    if (
        slot < 0 ||
        slot > 2
    ) {
        slot = 0;
    }

    saveData.player = {

        health:
            player.health,

        energy:
            player.energy,

        armor:
            player.armor,

        credits:
            state.credits

    };

    saveData.progress = {

        kills:
            state.kills,

        wave:
            state.wave,

        sector:
            state.sector,

        distance:
            state.distance,

        missionProgress:
            state.missionProgress

    };

    saveData.weapons =
        weapons.map(
            weapon =>
                weapon.unlocked
        );

    saveData.slots[slot] = {

        used: true,

        date:
            new Date().toISOString(),

        wave:
            state.wave,

        kills:
            state.kills,

        credits:
            state.credits,

        sector:
            state.sector

    };

    saveData.activeSlot =
        slot;

    saveSaveData();

    unlockAchievement(
        "firstSave"
    );

    notify(
        `RUN SAVED — SLOT ${slot + 1}`,
        COLORS.green,
        1800
    );

}

function loadGame(slot = 0) {

    const saved =
        saveData.slots[slot];

    if (
        !saved ||
        !saved.used
    ) {

        notify(
            `SLOT ${slot + 1} IS EMPTY`,
            COLORS.red
        );

        return false;

    }

    state.kills =
        saved.kills ||
        0;

    state.wave =
        saved.wave ||
        1;

    state.credits =
        saved.credits ||
        0;

    state.sector =
        saved.sector ||
        0;

    state.distance =
        saveData.progress.distance ||
        0;

    state.missionProgress =
        saveData.progress
            .missionProgress ||
        0;

    player.health =
        clamp(
            saveData.player.health ||
            100,
            1,
            player.maxHealth
        );

    player.energy =
        clamp(
            saveData.player.energy ||
            100,
            0,
            player.maxEnergy
        );

    player.armor =
        saveData.player.armor ||
        0;

    weapons.forEach(
        (
            weapon,
            index
        ) => {

            weapon.unlocked =
                !!saveData.weapons[index];

        }
    );

    resetWorldEntities();

    state.running = true;
    state.paused = false;
    state.gameOver = false;

    menu.style.display =
        "none";

    if (hud) {
        hud.style.display =
            "block";
    }

    if (pauseScreen) {
        pauseScreen.style.display =
            "none";
    }

    resetInput();

    spawnEnemyWave();

    notify(
        `SLOT ${slot + 1} LOADED`,
        COLORS.green
    );

    return true;

}

/* =========================================================
   RESET ENTITIES
   ========================================================= */

function resetWorldEntities() {

    enemies.length = 0;
    bullets.length = 0;
    enemyBullets.length = 0;
    particles.length = 0;
    pickups.length = 0;
    effects.length = 0;
    floatingTexts.length = 0;

    for (const chest of chests) {
        chest.opened = false;
    }

    for (const terminal of terminals) {
        terminal.used = false;
        terminal.progress = 0;
    }

    for (const weapon of weapons) {

        weapon.ammo =
            weapon.magazine;

        weapon.reloadTimer =
            0;

    }

}

/* =========================================================
   NEW GAME
   ========================================================= */

function newGame() {

    initAudio();

    if (
        audioContext &&
        audioContext.state ===
            "suspended"
    ) {

        audioContext.resume();

    }

    state.running = true;
    state.paused = false;
    state.gameOver = false;

    state.time = 0;

    state.wave = 1;

    state.sector = 0;

    state.kills = 0;

    state.credits = 0;

    state.distance = 0;

    state.shots = 0;

    state.hits = 0;

    state.enemiesDefeated = 0;

    state.chestsOpened = 0;

    state.bossesDefeated = 0;

    state.roomsCleared = 0;

    state.missionProgress = 0;

    state.missionTarget = 5;

    state.currentWeapon = 0;

    player.maxHealth = 100;
    player.health = 100;

    player.maxEnergy = 100;
    player.energy = 100;

    player.armor = 0;

    player.speedMultiplier = 1;

    player.damageMultiplier = 1;

    player.creditsMultiplier = 1;

    player.shieldMax = 50;
    player.shield = 50;

    weapons.forEach(
        (weapon, index) => {

            weapon.ammo =
                weapon.magazine;

            weapon.reloadTimer =
                0;

            weapon._used =
                false;

            weapon.unlocked =
                index < 3;

        }
    );

    resetPlayer();

    resetWorldEntities();

    generateWorld();

    camera.x =
        player.x;

    camera.y =
        player.y;

    spawnEnemyWave();

    menu.style.display =
        "none";

    if (hud) {
        hud.style.display =
            "block";
    }

    if (pauseScreen) {
        pauseScreen.style.display =
            "none";
    }

    resetInput();

    notify(
        "SIGNAL LOST — FIND THE SOURCE",
        COLORS.cyan,
        3000
    );

    sound(
        440,
        .15,
        "triangle",
        .025
    );

}

/* =========================================================
   WAVE SYSTEM
   ========================================================= */

function updateWave() {

    if (
        !state.running ||
        state.gameOver
    ) {
        return;
    }

    if (
        enemies.length === 0
    ) {

        state.wave++;

        if (
            state.wave % 5 === 0
        ) {

            spawnBoss();

        } else {

            spawnEnemyWave();

        }

        if (
            state.wave === 3 &&
            player.health >=
                player.maxHealth
        ) {

            unlockAchievement(
                "survivorNoDamage"
            );

        }

    }

}

/* =========================================================
   GAME OVER
   ========================================================= */

function gameOver() {

    if (state.gameOver) {
        return;
    }

    state.gameOver = true;
    state.running = false;

    resetInput();

    showGameOver();

}

function showGameOver() {

    let overlay =
        document.getElementById(
            "extendedGameOver"
        );

    if (!overlay) {

        overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "extendedGameOver";

        overlay.style.position =
            "fixed";

        overlay.style.inset =
            "0";

        overlay.style.zIndex =
            "1200";

        overlay.style.background =
            "rgba(2,5,8,.93)";

        overlay.style.display =
            "flex";

        overlay.style.alignItems =
            "center";

        overlay.style.justifyContent =
            "center";

        document.body.appendChild(
            overlay
        );

    }

    overlay.innerHTML = `

        <div style="
            width:min(520px,90vw);
            padding:40px;
            background:#0d151d;
            border:1px solid rgba(255,100,124,.4);
            text-align:center;
            box-shadow:0 0 70px rgba(255,60,90,.08);
        ">

            <div style="
                color:#ff647c;
                letter-spacing:5px;
                font-size:13px;
            ">
                SIGNAL LOST
            </div>

            <h1 style="
                color:#edf8ff;
                letter-spacing:6px;
                font-size:42px;
                margin:15px 0;
            ">
                RUN ENDED
            </h1>

            <p style="
                color:#81919b;
            ">
                WAVE ${state.wave}
                &nbsp; • &nbsp;
                KILLS ${state.kills}
                &nbsp; • &nbsp;
                CREDITS ${Math.floor(
                    state.credits
                )}
            </p>

            <div style="
                display:flex;
                gap:12px;
                justify-content:center;
                margin-top:28px;
            ">

                <button
                    id="retryExtended"
                    style="
                        padding:14px 28px;
                        background:#54e7ff;
                        border:0;
                        cursor:pointer;
                        font-weight:bold;
                    "
                >
                    NEW RUN
                </button>

                <button
                    id="menuExtended"
                    style="
                        padding:14px 28px;
                        background:transparent;
                        color:#54e7ff;
                        border:1px solid #54e7ff;
                        cursor:pointer;
                    "
                >
                    MENU
                </button>

            </div>

        </div>

    `;

    overlay.style.display =
        "flex";

    document.getElementById(
        "retryExtended"
    ).onclick = () => {

        overlay.style.display =
            "none";

        newGame();

    };

    document.getElementById(
        "menuExtended"
    ).onclick = () => {

        overlay.style.display =
            "none";

        returnToMenu();

    };

}

/* =========================================================
   PAUSE
   ========================================================= */

function togglePause() {

    if (
        !state.running ||
        state.gameOver
    ) {
        return;
    }

    state.paused =
        !state.paused;

    if (pauseScreen) {

        pauseScreen.style.display =
            state.paused
                ? "flex"
                : "none";

    }

    resetInput();

}

function returnToMenu() {

    state.running = false;
    state.paused = false;
    state.gameOver = false;

    resetInput();

    if (hud) {
        hud.style.display =
            "none";
    }

    if (pauseScreen) {
        pauseScreen.style.display =
            "none";
    }

    if (menu) {
        menu.style.display =
            "flex";
    }

}

/* =========================================================
   GAME LOOP
   ========================================================= */

let lastTime =
    performance.now();

function gameLoop(now) {

    const rawDt =
        (now - lastTime) /
        1000;

    lastTime = now;

    const dt =
        Math.min(
            rawDt,
            .033
        );

    state.time += dt;

    if (
        state.running &&
        !state.paused &&
        !state.gameOver
    ) {

        update(dt);

    }

    updateNotification(dt);

    updateNotificationUI();

    render();

    requestAnimationFrame(
        gameLoop
    );

}

function update(dt) {

    state.cameraShake =
        Math.max(
            0,
            state.cameraShake -
            dt * 20
        );

    updatePlayer(dt);

    updateEnemies(dt);

    updateBullets(dt);

    updateEnemyBullets(dt);

    updatePickups(dt);

    updateChests();

    updateTerminals(dt);

    updateDoors(dt);

    updateParticles(dt);

    updateEffects(dt);

    updateFloatingTexts(dt);

    updateRain(dt);

    updateCamera(dt);

    updateWave();

    checkAchievements();

    updateHUD();

}

/* =========================================================
   BUTTON EVENTS
   ========================================================= */

if (newGameButton) {

    newGameButton.addEventListener(
        "click",
        () => {
            newGame();
        }
    );

}

if (loadGameButton) {

    loadGameButton.addEventListener(
        "click",
        () => {

            /*
               Laad automatisch het
               laatst gebruikte slot.
            */

            const slot =
                saveData.activeSlot ??
                0;

            if (
                !loadGame(slot)
            ) {

                /*
                   Als er nog geen save is,
                   starten we een nieuwe run.
                */

                newGame();

            }

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

            saveGame(
                saveData.activeSlot ??
                0
            );

        }
    );

}

if (quitButton) {

    quitButton.addEventListener(
        "click",
        () => {

            saveGame(
                saveData.activeSlot ??
                0
            );

            returnToMenu();

        }
    );

}

if (closeMapButton) {

    closeMapButton.addEventListener(
        "click",
        () => {

            state.mapOpen = false;

            const map =
                document.getElementById(
                    "map"
                );

            if (map) {
                map.style.display =
                    "none";
            }

        }
    );

}

/* =========================================================
   EXTRA UI
   ========================================================= */

function addExtendedHUD() {

    if (
        document.getElementById(
            "extendedHUD"
        )
    ) {
        return;
    }

    const hud =
        document.createElement(
            "div"
        );

    hud.id =
        "extendedHUD";

    hud.style.position =
        "fixed";

    hud.style.right =
        "20px";

    hud.style.bottom =
        "20px";

    hud.style.zIndex =
        "20";

    hud.style.pointerEvents =
        "none";

    hud.style.fontFamily =
        "Arial,sans-serif";

    hud.style.color =
        "#b9cbd2";

    hud.style.fontSize =
        "11px";

    hud.style.textAlign =
        "right";

    hud.innerHTML = `

        <div id="weaponExtended">
            PULSE
        </div>

        <div style="
            margin-top:5px;
            opacity:.55;
        ">
            1-4 WEAPONS
            &nbsp; • &nbsp;
            E INTERACT
        </div>

    `;

    document.body.appendChild(
        hud
    );

}

function updateExtendedHUD() {

    const weapon =
        document.getElementById(
            "weaponExtended"
        );

    if (!weapon) {
        return;
    }

    const current =
        weapons[
            state.currentWeapon
        ];

    weapon.textContent =
        `${current.name} — ${current.ammo}`;

    weapon.style.color =
        current.color;

}

/* =========================================================
   SAVE SLOT SCREEN
   ========================================================= */

function showSaveSlots() {

    let overlay =
        document.getElementById(
            "saveSlotsOverlay"
        );

    if (!overlay) {

        overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "saveSlotsOverlay";

        overlay.style.position =
            "fixed";

        overlay.style.inset =
            "0";

        overlay.style.zIndex =
            "1100";

        overlay.style.background =
            "rgba(2,6,10,.96)";

        overlay.style.display =
            "flex";

        overlay.style.alignItems =
            "center";

        overlay.style.justifyContent =
            "center";

        document.body.appendChild(
            overlay
        );

    }

    overlay.innerHTML = "";

    const panel =
        document.createElement(
            "div"
        );

    panel.style.width =
        "min(720px,92vw)";

    panel.style.padding =
        "30px";

    panel.style.background =
        "#0d151d";

    panel.style.border =
        "1px solid rgba(84,231,255,.35)";

    const title =
        document.createElement(
            "h2"
        );

    title.textContent =
        "SAVE SLOTS";

    title.style.color =
        COLORS.cyan;

    title.style.letterSpacing =
        "5px";

    panel.appendChild(
        title
    );

    const list =
        document.createElement(
            "div"
        );

    list.style.display =
        "grid";

    list.style.gap =
        "10px";

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const slot =
            saveData.slots[i];

        const button =
            document.createElement(
                "button"
            );

        button.style.padding =
            "18px";

        button.style.textAlign =
            "left";

        button.style.cursor =
            "pointer";

        button.style.background =
            slot.used
                ? "rgba(84,231,255,.06)"
                : "rgba(255,255,255,.03)";

        button.style.color =
            "#e9f8ff";

        button.style.border =
            "1px solid rgba(255,255,255,.1)";

        if (slot.used) {

            button.innerHTML =
                `
                <b>SLOT ${i + 1}</b>
                <br>
                WAVE ${slot.wave}
                • KILLS ${slot.kills}
                • CREDITS ${slot.credits}
                `;

        } else {

            button.innerHTML =
                `
                <b>SLOT ${i + 1}</b>
                <br>
                EMPTY
                `;

        }

        button.onclick = () => {

            if (
                slot.used
            ) {

                saveData.activeSlot =
                    i;

                saveSaveData();

                loadGame(i);

                overlay.style.display =
                    "none";

            } else {

                saveData.activeSlot =
                    i;

                saveSaveData();

                newGame();

                overlay.style.display =
                    "none";

            }

        };

        list.appendChild(
            button
        );

    }

    panel.appendChild(
        list
    );

    const close =
        document.createElement(
            "button"
        );

    close.textContent =
        "CLOSE";

    close.style.marginTop =
        "20px";

    close.style.padding =
        "12px 25px";

    close.style.background =
        "transparent";

    close.style.color =
        COLORS.cyan;

    close.style.border =
        `1px solid ${COLORS.cyan}`;

    close.onclick = () => {

        overlay.style.display =
            "none";

    };

    panel.appendChild(
        close
    );

    overlay.appendChild(
        panel
    );

}

/* =========================================================
   MENU — EXTRA SAVE BUTTON
   ========================================================= */

function addSaveSlotsButton() {

    const buttons =
        document.querySelector(
            ".menuButtons"
        );

    if (!buttons) {
        return;
    }

    if (
        document.getElementById(
            "saveSlotsButton"
        )
    ) {
        return;
    }

    const button =
        document.createElement(
            "button"
        );

    button.id =
        "saveSlotsButton";

    button.className =
        "menuButton";

    button.textContent =
        "SAVE SLOTS";

    button.onclick = () => {

        showSaveSlots();

    };

    buttons.appendChild(
        button
    );

}

/* =========================================================
   STARTUP
   ========================================================= */

function startup() {

    createNotificationUI();

    createRain();

    generateWorld();

    addExtendedHUD();

    addSaveSlotsButton();

    if (hud) {

        hud.style.display =
            "none";

    }

    if (pauseScreen) {

        pauseScreen.style.display =
            "none";

    }

    if (menu) {

        menu.style.display =
            "flex";

    }

    updateHUD();

    updateExtendedHUD();

    /*
       Update extended HUD
       regelmatig.
    */

    setInterval(
        updateExtendedHUD,
        100
    );

    requestAnimationFrame(
        gameLoop
    );

}

startup();

})();
