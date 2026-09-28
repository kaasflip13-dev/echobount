(() => {
"use strict";

/* =========================================================
   ECHOBOUND — THE LOST SIGNAL
   COMPLETE GAME ENGINE
   ========================================================= */

if (window.__ECHOBoundLoaded) return;
window.__ECHOBoundLoaded = true;

/* =========================================================
   DOM
   ========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

if (!canvas || !ctx) {
    document.body.innerHTML =
        "<h1 style='color:white;background:#05070a;padding:30px'>Game canvas ontbreekt.</h1>";
    return;
}

const menu = document.getElementById("menu");
const hud = document.getElementById("hud");
const pauseScreen = document.getElementById("pause");
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
const objectiveElement = document.getElementById("objective");
const zoneElement = document.getElementById("zone");
const killsElement = document.getElementById("kills");
const creditsElement = document.getElementById("credits");
const ammoElement = document.getElementById("ammo");

const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas ? mapCanvas.getContext("2d") : null;

canvas.tabIndex = 1;

/* =========================================================
   EXTRA CSS
   ========================================================= */

const extraStyle = document.createElement("style");

extraStyle.textContent = `
#extraUI {
    position:fixed;
    inset:0;
    pointer-events:none;
    z-index:400;
    font-family:Arial,sans-serif;
}

#crosshair {
    position:fixed;
    width:22px;
    height:22px;
    margin:-11px 0 0 -11px;
    border:1px solid rgba(120,220,255,.9);
    border-radius:50%;
    box-sizing:border-box;
    pointer-events:none;
}

#crosshair:before,
#crosshair:after {
    content:"";
    position:absolute;
    background:rgba(120,220,255,.8);
}

#crosshair:before {
    left:9px;
    top:-5px;
    width:2px;
    height:30px;
}

#crosshair:after {
    left:-5px;
    top:9px;
    width:30px;
    height:2px;
}

#gameInfo {
    position:fixed;
    left:20px;
    bottom:70px;
    color:#9db6c8;
    font-size:12px;
    letter-spacing:1px;
    text-shadow:0 2px 4px #000;
}

#levelInfo {
    position:fixed;
    left:20px;
    top:155px;
    color:#d9f5ff;
    font-size:13px;
    letter-spacing:1px;
}

#weaponInfo {
    position:fixed;
    right:25px;
    bottom:85px;
    color:#bfeeff;
    text-align:right;
    font-size:13px;
}

.overlayPanel {
    position:fixed;
    inset:0;
    display:none;
    align-items:center;
    justify-content:center;
    background:rgba(2,5,8,.86);
    pointer-events:auto;
    z-index:500;
}

.panelBox {
    width:min(850px,90vw);
    max-height:85vh;
    overflow:auto;
    background:
        linear-gradient(135deg,rgba(18,28,36,.98),rgba(5,10,15,.98));
    border:1px solid #496878;
    box-shadow:
        0 0 80px rgba(0,180,255,.08),
        inset 0 0 40px rgba(255,255,255,.02);
    padding:30px;
    color:#dcecf3;
}

.panelBox h2 {
    margin-top:0;
    color:#8edcff;
    letter-spacing:4px;
}

.panelButton {
    display:block;
    width:100%;
    margin:10px 0;
    padding:13px;
    background:#101d25;
    color:#ccefff;
    border:1px solid #345362;
    cursor:pointer;
    text-align:left;
    font-weight:bold;
}

.panelButton:hover {
    background:#18303d;
    border-color:#66d5ff;
}

.slotGrid {
    display:grid;
    grid-template-columns:repeat(3,1fr);
    gap:12px;
}

.slot {
    background:#0b141a;
    border:1px solid #304954;
    padding:18px;
    min-height:100px;
}

.slot strong {
    color:#7edcff;
}

.achievementGrid {
    display:grid;
    grid-template-columns:repeat(2,1fr);
    gap:10px;
}

.achievementCard {
    border:1px solid #304550;
    padding:14px;
    background:#0a1217;
}

.achievementCard.unlocked {
    border-color:#71cce9;
    box-shadow:inset 0 0 25px rgba(70,190,230,.08);
}

.achievementCard .name {
    font-weight:bold;
    color:#9de7ff;
}

.achievementCard .desc {
    color:#78909b;
    font-size:12px;
    margin-top:5px;
}

#interactHint {
    position:fixed;
    left:50%;
    bottom:110px;
    transform:translateX(-50%);
    color:#c9f4ff;
    background:rgba(3,8,12,.82);
    border:1px solid #446574;
    padding:10px 18px;
    font-size:12px;
    letter-spacing:1px;
    display:none;
}

#damageFlash {
    position:fixed;
    inset:0;
    background:rgba(255,80,50,.15);
    opacity:0;
    pointer-events:none;
    transition:opacity .1s;
}

#messageBox {
    position:fixed;
    left:50%;
    top:24%;
    transform:translate(-50%,-50%);
    color:#c8efff;
    background:rgba(4,10,14,.9);
    border:1px solid #4e7483;
    padding:14px 24px;
    letter-spacing:2px;
    font-size:13px;
    opacity:0;
    transition:opacity .2s;
    pointer-events:none;
}

#bossBar {
    position:fixed;
    left:50%;
    top:25px;
    transform:translateX(-50%);
    width:min(550px,70vw);
    display:none;
}

#bossName {
    color:#ffcc99;
    text-align:center;
    font-size:12px;
    letter-spacing:3px;
    margin-bottom:5px;
}

#bossOuter {
    height:10px;
    background:#161b20;
    border:1px solid #6b4a38;
}

#bossInner {
    height:100%;
    width:100%;
    background:#e07b48;
}

#weatherText {
    position:fixed;
    right:25px;
    top:125px;
    color:#718692;
    font-size:11px;
    letter-spacing:2px;
}

@media(max-width:700px){
    .achievementGrid,
    .slotGrid {
        grid-template-columns:1fr;
    }
}
`;

document.head.appendChild(extraStyle);

/* =========================================================
   EXTRA UI
   ========================================================= */

const extraUI = document.createElement("div");
extraUI.id = "extraUI";

extraUI.innerHTML = `
    <div id="crosshair"></div>

    <div id="levelInfo">
        LEVEL <span id="levelValue">1</span>
        &nbsp; • &nbsp;
        XP <span id="xpValue">0</span>/<span id="xpMax">100</span>
    </div>

    <div id="gameInfo">
        WASD / PIJLTJES = BEWEGEN
        &nbsp; • &nbsp;
        MOUSE = RICHTEN
        &nbsp; • &nbsp;
        CLICK = SCHIETEN
    </div>

    <div id="weaponInfo">
        <span id="weaponNameExtra">PULSE</span>
        <br>
        [1-6] WAPEN &nbsp; [R] HERLADEN
    </div>

    <div id="interactHint">
        [E] INTERACTEREN
    </div>

    <div id="damageFlash"></div>

    <div id="messageBox"></div>

    <div id="weatherText">CLEAR</div>

    <div id="bossBar">
        <div id="bossName">BOSS</div>
        <div id="bossOuter">
            <div id="bossInner"></div>
        </div>
    </div>
`;

document.body.appendChild(extraUI);

function makeOverlay(id, html) {
    const div = document.createElement("div");
    div.id = id;
    div.className = "overlayPanel";
    div.innerHTML = `<div class="panelBox">${html}</div>`;
    document.body.appendChild(div);
    return div;
}

const achievementsOverlay = makeOverlay(
    "achievementsOverlay",
    `
        <h2>ACHIEVEMENTS</h2>
        <div id="achievementGrid" class="achievementGrid"></div>
        <button class="panelButton" id="closeAchievements">TERUG</button>
    `
);

const controlsOverlay = makeOverlay(
    "controlsOverlay",
    `
        <h2>CONTROLS</h2>
        <p><b>W A S D</b> — bewegen</p>
        <p><b>PIJLTJES</b> — bewegen</p>
        <p><b>MOUSE</b> — richten</p>
        <p><b>LINKER MUISKNOP</b> — schieten</p>
        <p><b>SPACE</b> — dash</p>
        <p><b>E</b> — interactie / kist / deur</p>
        <p><b>1 t/m 6</b> — wapens</p>
        <p><b>R</b> — herladen</p>
        <p><b>M</b> — kaart</p>
        <p><b>I</b> — inventaris</p>
        <p><b>ESC</b> — pauze</p>
        <button class="panelButton" id="closeControls">TERUG</button>
    `
);

const inventoryOverlay = makeOverlay(
    "inventoryOverlay",
    `
        <h2>INVENTORY</h2>
        <div id="inventoryContent"></div>
        <button class="panelButton" id="closeInventory">SLUITEN</button>
    `
);

const saveOverlay = makeOverlay(
    "saveOverlay",
    `
        <h2>SAVE SLOTS</h2>
        <div class="slotGrid" id="slotGrid"></div>
        <button class="panelButton" id="closeSaveSlots">ANNULEREN</button>
    `
);

const gameOverOverlay = makeOverlay(
    "gameOverOverlay",
    `
        <h2>SIGNAL LOST</h2>
        <p id="gameOverText">Je run is voorbij.</p>
        <button class="panelButton" id="retryButton">OPNIEUW</button>
        <button class="panelButton" id="gameOverMenu">MENU</button>
    `
);

const victoryOverlay = makeOverlay(
    "victoryOverlay",
    `
        <h2>SIGNAL FOUND</h2>
        <p>Je hebt de verloren signalen bereikt.</p>
        <p id="victoryStats"></p>
        <button class="panelButton" id="victoryMenu">TERUG NAAR MENU</button>
    `
);

/* =========================================================
   SCREEN
   ========================================================= */

let W = window.innerWidth;
let H = window.innerHeight;

function resize() {
    W = window.innerWidth;
    H = window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (mapCanvas) {
        mapCanvas.width = 600;
        mapCanvas.height = 400;
    }
}

window.addEventListener("resize", resize);
resize();

/* =========================================================
   GAME CONSTANTS
   ========================================================= */

const WORLD_WIDTH = 5200;
const WORLD_HEIGHT = 4200;

const TILE = 100;

const MAX_ENEMIES = 55;
const MAX_PARTICLES = 500;

const PLAYER_RADIUS = 18;

const ENEMY_DETECT_RANGE = 950;
const ENEMY_SHOOT_RANGE = 600;

const SPAWN_MIN_DISTANCE = 650;
const SPAWN_MAX_DISTANCE = 1050;

/* =========================================================
   GAME STATE
   ========================================================= */

let state = "menu";

let lastTime = performance.now();
let elapsed = 0;

let mouseX = W / 2;
let mouseY = H / 2;

let mouseDown = false;

const keys = Object.create(null);

/* =========================================================
   ROBUST INPUT
   ========================================================= */

window.addEventListener("keydown", event => {
    keys[event.code] = true;

    if (event.key) {
        keys[event.key.toLowerCase()] = true;
    }

    const blocked = [
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Space"
    ];

    if (blocked.includes(event.code)) {
        event.preventDefault();
    }

    if (event.repeat) return;

    if (event.code === "Escape") {
        handleEscape();
    }

    if (event.code === "KeyM") {
        toggleMap();
    }

    if (event.code === "KeyI") {
        toggleInventory();
    }

    if (event.code === "KeyE") {
        interact();
    }

    if (event.code === "KeyR") {
        reload();
    }

    const number = Number(event.key);

    if (number >= 1 && number <= 6) {
        selectWeapon(number - 1);
    }
});

window.addEventListener("keyup", event => {
    keys[event.code] = false;

    if (event.key) {
        keys[event.key.toLowerCase()] = false;
    }
});

window.addEventListener("blur", () => {
    for (const key in keys) {
        keys[key] = false;
    }

    mouseDown = false;
});

function down(...names) {
    return names.some(name => keys[name]);
}

/* =========================================================
   MOUSE
   ========================================================= */

window.addEventListener("mousemove", event => {
    mouseX = event.clientX;
    mouseY = event.clientY;

    const crosshair = document.getElementById("crosshair");

    if (crosshair) {
        crosshair.style.left = mouseX + "px";
        crosshair.style.top = mouseY + "px";
    }
});

window.addEventListener("mousedown", event => {
    if (event.button === 0) {
        mouseDown = true;
    }
});

window.addEventListener("mouseup", event => {
    if (event.button === 0) {
        mouseDown = false;
    }
});

/* =========================================================
   AUDIO
   ========================================================= */

let audioContext = null;

function startAudio() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
    } catch (error) {
        audioContext = null;
    }
}

function sound(type) {
    if (!audioContext) return;

    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        let frequency = 200;
        let duration = .08;

        if (type === "shoot") {
            frequency = 380;
            duration = .045;
        }

        if (type === "hit") {
            frequency = 110;
            duration = .06;
        }

        if (type === "dash") {
            frequency = 80;
            duration = .16;
        }

        if (type === "pickup") {
            frequency = 650;
            duration = .12;
        }

        if (type === "level") {
            frequency = 520;
            duration = .25;
        }

        if (type === "boss") {
            frequency = 70;
            duration = .3;
        }

        osc.frequency.value = frequency;

        gain.gain.setValueAtTime(.035, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            .001,
            audioContext.currentTime + duration
        );

        osc.start();
        osc.stop(audioContext.currentTime + duration);
    } catch (error) {}
}

/* =========================================================
   UTILS
   ========================================================= */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function chance(value) {
    return Math.random() < value;
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
   SAVE DATA
   ========================================================= */

const SAVE_PREFIX = "echobound_save_";

const defaultMeta = {
    achievements: {},
    totalKills: 0,
    totalDistance: 0,
    weaponsUsed: {}
};

let meta = loadMeta();

function loadMeta() {
    try {
        const raw = localStorage.getItem("echobound_meta");

        if (!raw) return { ...defaultMeta };

        const parsed = JSON.parse(raw);

        return {
            ...defaultMeta,
            ...parsed,
            achievements: parsed.achievements || {},
            weaponsUsed: parsed.weaponsUsed || {}
        };
    } catch {
        return { ...defaultMeta };
    }
}

function saveMeta() {
    try {
        localStorage.setItem(
            "echobound_meta",
            JSON.stringify(meta)
        );
    } catch {}
}

function saveExists(slot) {
    try {
        return !!localStorage.getItem(SAVE_PREFIX + slot);
    } catch {
        return false;
    }
}

function saveGame(slot) {
    if (!player) return;

    const save = {
        version: 3,
        player: {
            x: player.x,
            y: player.y,
            hp: player.hp,
            energy: player.energy,
            level: player.level,
            xp: player.xp,
            credits: player.credits,
            kills: player.kills,
            shots: player.shots,
            dashes: player.dashes
        },

        sector: currentSector,
        discovered: [...discoveredSectors],

        inventory: { ...inventory },

        weapons: weapons.map(w => ({
            ammo: w.ammo,
            unlocked: w.unlocked
        })),

        mission: {
            signalFound: mission.signalFound,
            killsNeeded: mission.killsNeeded,
            kills: mission.kills
        },

        time: elapsed,
        savedAt: Date.now()
    };

    try {
        localStorage.setItem(
            SAVE_PREFIX + slot,
            JSON.stringify(save)
        );

        showMessage("RUN OPGESLAGEN IN SLOT " + slot);

        meta.achievements.firstSave = true;
        saveMeta();
        updateAchievements();
    } catch {
        showMessage("OPSLAAN MISLUKT");
    }
}

function loadGame(slot) {
    try {
        const raw = localStorage.getItem(SAVE_PREFIX + slot);

        if (!raw) {
            showMessage("SLOT IS LEEG");
            return false;
        }

        const save = JSON.parse(raw);

        resetWorld();

        player.x = Number(save.player.x) || 500;
        player.y = Number(save.player.y) || 500;
        player.hp = Number(save.player.hp) || player.maxHp;
        player.energy = Number(save.player.energy) || player.maxEnergy;
        player.level = Number(save.player.level) || 1;
        player.xp = Number(save.player.xp) || 0;
        player.credits = Number(save.player.credits) || 0;
        player.kills = Number(save.player.kills) || 0;
        player.shots = Number(save.player.shots) || 0;
        player.dashes = Number(save.player.dashes) || 0;

        currentSector = Number(save.sector) || 0;

        discoveredSectors.clear();

        if (Array.isArray(save.discovered)) {
            save.discovered.forEach(s => discoveredSectors.add(s));
        }

        inventory = {
            ...inventory,
            ...(save.inventory || {})
        };

        if (Array.isArray(save.weapons)) {
            save.weapons.forEach((w, i) => {
                if (!weapons[i]) return;

                weapons[i].ammo =
                    typeof w.ammo === "number"
                        ? w.ammo
                        : weapons[i].maxAmmo;

                weapons[i].unlocked =
                    !!w.unlocked;
            });
        }

        mission.signalFound =
            !!save.mission?.signalFound;

        mission.killsNeeded =
            Number(save.mission?.killsNeeded) || 8;

        mission.kills =
            Number(save.mission?.kills) || 0;

        elapsed = Number(save.time) || 0;

        discoverSector(currentSector, true);

        state = "playing";

        hideAllOverlays();

        menu.style.display = "none";
        pauseScreen.style.display = "none";
        hud.style.display = "block";

        showMessage("RUN GELADEN");

        return true;

    } catch (error) {
        console.error(error);
        showMessage("SAVE KON NIET WORDEN GELADEN");
        return false;
    }
}

/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

const achievementList = [
    {
        id: "firstEcho",
        name: "FIRST ECHO",
        description: "Versla je eerste monster."
    },
    {
        id: "tenEchoes",
        name: "TEN ECHOES",
        description: "Versla 10 monsters."
    },
    {
        id: "fiftyEchoes",
        name: "DEEP SIGNAL",
        description: "Versla 50 monsters."
    },
    {
        id: "firstSave",
        name: "ANCHOR",
        description: "Sla een run op."
    },
    {
        id: "explorer",
        name: "EXPLORER",
        description: "Leg 5000 meter af."
    },
    {
        id: "survivor",
        name: "SURVIVOR",
        description: "Bereik level 5."
    },
    {
        id: "arsenal",
        name: "ARSENAL",
        description: "Gebruik alle wapens."
    },
    {
        id: "boss",
        name: "BREAK THE GIANT",
        description: "Versla een boss."
    },
    {
        id: "signal",
        name: "THE SIGNAL",
        description: "Vind het verloren signal."
    },
    {
        id: "rich",
        name: "SALVAGER",
        description: "Verzamel 1000 credits."
    }
];

function unlockAchievement(id) {
    if (meta.achievements[id]) return;

    meta.achievements[id] = true;
    saveMeta();

    const achievement = achievementList.find(
        a => a.id === id
    );

    if (!achievement) return;

    const nameElement =
        document.getElementById("achievementName");

    if (nameElement) {
        nameElement.textContent = achievement.name;
    }

    const popup = document.getElementById("achievement");

    if (popup) {
        popup.style.display = "block";

        setTimeout(() => {
            popup.style.display = "none";
        }, 3000);
    }

    sound("level");
    updateAchievements();
}

function updateAchievements() {
    if (!player) return;

    meta.totalKills = Math.max(
        meta.totalKills || 0,
        player.kills
    );

    if (player.kills >= 1)
        unlockAchievement("firstEcho");

    if (player.kills >= 10)
        unlockAchievement("tenEchoes");

    if (player.kills >= 50)
        unlockAchievement("fiftyEchoes");

    if (meta.totalDistance >= 5000)
        unlockAchievement("explorer");

    if (player.level >= 5)
        unlockAchievement("survivor");

    if (player.credits >= 1000)
        unlockAchievement("rich");

    const allWeapons =
        weapons.every(w => meta.weaponsUsed[w.id]);

    if (allWeapons)
        unlockAchievement("arsenal");
}

function renderAchievementPanel() {
    const grid =
        document.getElementById("achievementGrid");

    if (!grid) return;

    grid.innerHTML = "";

    achievementList.forEach(a => {
        const unlocked =
            !!meta.achievements[a.id];

        const card =
            document.createElement("div");

        card.className =
            "achievementCard" +
            (unlocked ? " unlocked" : "");

        card.innerHTML = `
            <div class="name">
                ${unlocked ? "✓ " : "○ "}
                ${a.name}
            </div>
            <div class="desc">
                ${a.description}
            </div>
        `;

        grid.appendChild(card);
    });
}

/* =========================================================
   PLAYER
   ========================================================= */

let player;

function createPlayer() {
    return {
        x: 500,
        y: 500,

        radius: PLAYER_RADIUS,

        speed: 245,

        maxHp: 100,
        hp: 100,

        maxEnergy: 100,
        energy: 100,

        energyRegen: 18,

        level: 1,
        xp: 0,

        credits: 0,

        kills: 0,
        shots: 0,
        dashes: 0,

        invulnerable: 0,

        dashCooldown: 0,
        dashTimer: 0,

        angle: 0,

        damageBoost: 0,
        speedBoost: 0,

        flash: 0
    };
}

/* =========================================================
   WEAPONS
   ========================================================= */

const weapons = [
    {
        id: "pulse",
        name: "PULSE",
        damage: 25,
        speed: 900,
        fireRate: .18,
        maxAmmo: 12,
        ammo: 12,
        reload: 1.1,
        spread: .025,
        pellets: 1,
        color: "#77ddff"
    },

    {
        id: "burst",
        name: "BURST",
        damage: 18,
        speed: 1000,
        fireRate: .35,
        maxAmmo: 18,
        ammo: 18,
        reload: 1.3,
        spread: .055,
        pellets: 3,
        color: "#b0a4ff"
    },

    {
        id: "scatter",
        name: "SCATTER",
        damage: 12,
        speed: 850,
        fireRate: .7,
        maxAmmo: 6,
        ammo: 6,
        reload: 1.5,
        spread: .23,
        pellets: 7,
        color: "#ffd27a"
    },

    {
        id: "heavy",
        name: "HEAVY",
        damage: 60,
        speed: 720,
        fireRate: .75,
        maxAmmo: 5,
        ammo: 5,
        reload: 1.8,
        spread: .015,
        pellets: 1,
        color: "#ff9d62"
    },

    {
        id: "rail",
        name: "RAIL",
        damage: 120,
        speed: 1500,
        fireRate: 1.4,
        maxAmmo: 3,
        ammo: 3,
        reload: 2.1,
        spread: 0,
        pellets: 1,
        color: "#f4f6ff"
    },

    {
        id: "plasma",
        name: "PLASMA",
        damage: 40,
        speed: 650,
        fireRate: .3,
        maxAmmo: 10,
        ammo: 10,
        reload: 1.6,
        spread: .04,
        pellets: 1,
        color: "#70ffbd"
    }
];

let weaponIndex = 0;
let fireCooldown = 0;
let reloadTimer = 0;

function currentWeapon() {
    return weapons[weaponIndex];
}

function selectWeapon(index) {
    if (!weapons[index]) return;

    const weapon = weapons[index];

    if (!weapon.unlocked && index !== 0) {
        if (player && player.level < index + 1) {
            showMessage(
                "WAPEN VRIJGESPEELD OP LEVEL " +
                (index + 1)
            );
            return;
        }

        weapon.unlocked = true;
    }

    weaponIndex = index;

    if (meta.weaponsUsed) {
        meta.weaponsUsed[weapon.id] = true;
        saveMeta();
    }

    updateHUD();
}

function reload() {
    if (!player || state !== "playing") return;

    const weapon = currentWeapon();

    if (reloadTimer > 0) return;

    if (weapon.ammo >= weapon.maxAmmo) return;

    reloadTimer = weapon.reload;

    showMessage("HERLADEN...");
}

function finishReload() {
    const weapon = currentWeapon();

    weapon.ammo = weapon.maxAmmo;

    reloadTimer = 0;

    showMessage("KLAAR");
}

/* =========================================================
   WORLD
   ========================================================= */

let walls = [];
let doors = [];
let props = [];
let chests = [];
let terminals = [];
let beacons = [];

function buildWorld() {

    walls = [];

    /*
       BUITENRANDEN
    */

    walls.push({
        x: -50,
        y: -50,
        w: WORLD_WIDTH + 100,
        h: 50
    });

    walls.push({
        x: -50,
        y: WORLD_HEIGHT,
        w: WORLD_WIDTH + 100,
        h: 50
    });

    walls.push({
        x: -50,
        y: 0,
        w: 50,
        h: WORLD_HEIGHT
    });

    walls.push({
        x: WORLD_WIDTH,
        y: 0,
        w: 50,
        h: WORLD_HEIGHT
    });

    /*
       GROTE ZICHTBARE MUREN
    */

    const fixedWalls = [
        {x: 220, y: 350, w: 520, h: 55},
        {x: 850, y: 150, w: 55, h: 500},

        {x: 1200, y: 300, w: 500, h: 55},
        {x: 1850, y: 300, w: 55, h: 600},

        {x: 450, y: 800, w: 55, h: 600},
        {x: 700, y: 850, w: 550, h: 55},

        {x: 1450, y: 700, w: 55, h: 500},

        {x: 250, y: 1650, w: 700, h: 55},

        {x: 1100, y: 1450, w: 55, h: 500},

        {x: 1500, y: 1700, w: 600, h: 55},

        {x: 2050, y: 1250, w: 55, h: 600},

        {x: 2600, y: 400, w: 700, h: 55},
        {x: 3150, y: 450, w: 55, h: 500},

        {x: 2800, y: 1050, w: 500, h: 55},
        {x: 3500, y: 850, w: 55, h: 700},

        {x: 2350, y: 1900, w: 700, h: 55},
        {x: 3050, y: 2000, w: 55, h: 600},

        {x: 900, y: 2450, w: 700, h: 55},
        {x: 1600, y: 2500, w: 55, h: 550},

        {x: 2200, y: 3000, w: 600, h: 55},
        {x: 2800, y: 2850, w: 55, h: 600},

        {x: 3600, y: 2500, w: 650, h: 55},
        {x: 4200, y: 2050, w: 55, h: 650},

        {x: 3650, y: 1250, w: 600, h: 55},
        {x: 4300, y: 900, w: 55, h: 650}
    ];

    fixedWalls.forEach(w => {
        walls.push({
            ...w,
            type: "wall"
        });
    });

    /*
       DEUREN
    */

    doors = [
        {
            x: 740,
            y: 350,
            w: 110,
            h: 55,
            open: false
        },

        {
            x: 1450,
            y: 700,
            w: 55,
            h: 110,
            open: false
        },

        {
            x: 3050,
            y: 2000,
            w: 55,
            h: 110,
            open: false
        },

        {
            x: 3600,
            y: 1250,
            w: 110,
            h: 55,
            open: false
        }
    ];

    /*
       PROPS
    */

    props = [];

    for (let i = 0; i < 180; i++) {

        let x = random(100, WORLD_WIDTH - 100);
        let y = random(100, WORLD_HEIGHT - 100);

        if (nearWall(x, y, 50)) continue;

        const type =
            chance(.35)
                ? "crate"
                : chance(.45)
                    ? "rock"
                    : "plant";

        props.push({
            x,
            y,
            type,
            size: random(14, 35),
            rotation: random(0, Math.PI * 2)
        });
    }

    /*
       CHESTS
    */

    chests = [];

    for (let i = 0; i < 28; i++) {

        const p = findOpenPosition(400);

        if (!p) continue;

        chests.push({
            x: p.x,
            y: p.y,
            opened: false
        });
    }

    /*
       TERMINALS
    */

    terminals = [];

    for (let i = 0; i < 15; i++) {

        const p = findOpenPosition(450);

        if (!p) continue;

        terminals.push({
            x: p.x,
            y: p.y,
            used: false
        });
    }

    /*
       SIGNAL BEACONS
    */

    beacons = [
        {
            x: 4700,
            y: 3500,
            active: false
        },

        {
            x: 3900,
            y: 600,
            active: false
        },

        {
            x: 1200,
            y: 3600,
            active: false
        }
    ];
}

/* =========================================================
   COLLISION
   ========================================================= */

function circleRectCollision(circle, rect) {

    const nearestX =
        clamp(circle.x, rect.x, rect.x + rect.w);

    const nearestY =
        clamp(circle.y, rect.y, rect.y + rect.h);

    const dx = circle.x - nearestX;
    const dy = circle.y - nearestY;

    return dx * dx + dy * dy <
        circle.radius * circle.radius;
}

function solidDoors() {
    return doors.filter(d => !d.open);
}

function allSolids() {
    return walls.concat(solidDoors());
}

function collidesAt(x, y, radius) {

    const circle = {
        x,
        y,
        radius
    };

    for (const wall of allSolids()) {

        if (circleRectCollision(circle, wall)) {
            return true;
        }
    }

    return false;
}

function moveWithCollision(entity, dx, dy) {

    const oldX = entity.x;
    const oldY = entity.y;

    entity.x += dx;

    if (collidesAt(
        entity.x,
        entity.y,
        entity.radius
    )) {
        entity.x = oldX;
    }

    entity.y += dy;

    if (collidesAt(
        entity.x,
        entity.y,
        entity.radius
    )) {
        entity.y = oldY;
    }
}

function pointInWall(x, y) {

    for (const wall of allSolids()) {

        if (
            x >= wall.x &&
            x <= wall.x + wall.w &&
            y >= wall.y &&
            y <= wall.y + wall.h
        ) {
            return true;
        }
    }

    return false;
}

function lineBlocked(x1, y1, x2, y2) {

    const distance =
        Math.hypot(x2 - x1, y2 - y1);

    const steps =
        Math.ceil(distance / 18);

    for (let i = 1; i < steps; i++) {

        const t = i / steps;

        const x = lerp(x1, x2, t);
        const y = lerp(y1, y2, t);

        if (pointInWall(x, y)) {
            return true;
        }
    }

    return false;
}

function nearWall(x, y, distance) {

    for (const wall of walls) {

        const nearestX =
            clamp(x, wall.x, wall.x + wall.w);

        const nearestY =
            clamp(y, wall.y, wall.y + wall.h);

        if (
            Math.hypot(
                x - nearestX,
                y - nearestY
            ) < distance
        ) {
            return true;
        }
    }

    return false;
}

function findOpenPosition(minDistance = 0) {

    for (let attempt = 0; attempt < 100; attempt++) {

        const p = {
            x: random(150, WORLD_WIDTH - 150),
            y: random(150, WORLD_HEIGHT - 150)
        };

        if (collidesAt(p.x, p.y, 25)) {
            continue;
        }

        if (
            player &&
            Math.hypot(
                p.x - player.x,
                p.y - player.y
            ) < minDistance
        ) {
            continue;
        }

        return p;
    }

    return null;
}

/* =========================================================
   SECTORS
   ========================================================= */

let currentSector = 0;

const discoveredSectors = new Set();

function sectorFromPosition(x, y) {

    const sx = Math.floor(x / 1000);
    const sy = Math.floor(y / 1000);

    return sy * 6 + sx;
}

function sectorName(sector) {

    const names = [
        "ENTRY ZONE",
        "DARK INDUSTRIAL",
        "BROKEN FACILITY",
        "OVERGROWN SECTOR",
        "DEAD CHANNEL",
        "OLD REACTOR",
        "LOWER COMPLEX",
        "ECHO FIELDS",
        "SIGNAL CORRIDOR",
        "NORTH WASTES",
        "WESTERN RUINS",
        "DEEP SIGNAL",
        "ABANDONED GRID",
        "RED SECTOR",
        "FROZEN ARRAY",
        "LOST COMPLEX"
    ];

    return names[sector % names.length];
}

function discoverSector(sector, quiet = false) {

    if (discoveredSectors.has(sector)) {
        return;
    }

    discoveredSectors.add(sector);

    if (!quiet) {
        showMessage(
            "NIEUW GEBIED: " +
            sectorName(sector)
        );
    }

    spawnSectorEnemies(sector);
}

/* =========================================================
   ENEMIES
   ========================================================= */

const enemyTypes = {

    scout: {
        hp: 55,
        speed: 85,
        radius: 18,
        damage: 8,
        fireRate: 2.2,
        range: 450,
        color: "#7bdcff",
        reward: 20
    },

    hunter: {
        hp: 85,
        speed: 105,
        radius: 20,
        damage: 11,
        fireRate: 1.7,
        range: 500,
        color: "#bd91ff",
        reward: 35
    },

    guardian: {
        hp: 180,
        speed: 55,
        radius: 27,
        damage: 18,
        fireRate: 2.5,
        range: 550,
        color: "#ffb46e",
        reward: 70
    },

    sniper: {
        hp: 70,
        speed: 45,
        radius: 17,
        damage: 28,
        fireRate: 3.8,
        range: 850,
        color: "#ff779c",
        reward: 90
    },

    brute: {
        hp: 330,
        speed: 42,
        radius: 35,
        damage: 25,
        fireRate: 3.2,
        range: 450,
        color: "#ff884f",
        reward: 130
    },

    drone: {
        hp: 100,
        speed: 145,
        radius: 16,
        damage: 10,
        fireRate: 1.4,
        range: 480,
        color: "#7dffb2",
        reward: 60
    }
};

let enemies = [];

function chooseEnemyType() {

    const level =
        player ? player.level : 1;

    const roll = Math.random();

    if (level >= 8 && roll < .08)
        return "brute";

    if (level >= 5 && roll < .18)
        return "sniper";

    if (level >= 4 && roll < .32)
        return "guardian";

    if (roll < .55)
        return "hunter";

    if (roll < .75)
        return "drone";

    return "scout";
}

function createEnemy(x, y, typeName) {

    const type =
        enemyTypes[typeName] ||
        enemyTypes.scout;

    const difficulty =
        1 + Math.max(
            0,
            currentSector * .025
        );

    return {
        x,
        y,

        radius: type.radius,

        type: typeName,

        hp: type.hp * difficulty,
        maxHp: type.hp * difficulty,

        speed: type.speed * (
            1 + Math.min(.3, currentSector * .005)
        ),

        damage: type.damage * difficulty,

        fireRate: type.fireRate,

        shootCd: random(0.5, 2.5),

        color: type.color,

        reward: Math.floor(
            type.reward * difficulty
        ),

        angle: random(0, Math.PI * 2),

        wanderAngle: random(
            0,
            Math.PI * 2
        ),

        wanderTimer: random(1, 4),

        hitFlash: 0,

        dead: false
    };
}

/*
    BELANGRIJK:

    Monsters worden niet alleen bij het starten
    van de game gemaakt.

    Wanneer de speler naar een nieuwe sector loopt,
    worden daar automatisch nieuwe monsters geplaatst.
*/

function spawnSectorEnemies(sector) {

    if (!player) return;

    const existingNearby =
        enemies.filter(e => {
            return (
                Math.floor(e.x / 1000) +
                Math.floor(e.y / 1000) * 6
            ) === sector;
        }).length;

    const targetCount =
        clamp(
            5 + Math.floor(player.level * .8),
            5,
            12
        );

    const amount =
        Math.max(
            0,
            targetCount - existingNearby
        );

    for (let i = 0; i < amount; i++) {

        const position =
            findSpawnNearPlayerForSector(
                sector
            );

        if (!position) continue;

        enemies.push(
            createEnemy(
                position.x,
                position.y,
                chooseEnemyType()
            )
        );
    }
}

function findSpawnNearPlayerForSector(sector) {

    const sx = sector % 6;
    const sy = Math.floor(sector / 6);

    const minX = sx * 1000 + 100;
    const maxX = Math.min(
        WORLD_WIDTH - 100,
        sx * 1000 + 900
    );

    const minY = sy * 1000 + 100;
    const maxY = Math.min(
        WORLD_HEIGHT - 100,
        sy * 1000 + 900
    );

    for (let attempt = 0; attempt < 100; attempt++) {

        const p = {
            x: random(minX, maxX),
            y: random(minY, maxY)
        };

        if (collidesAt(p.x, p.y, 30))
            continue;

        if (Math.hypot(
            p.x - player.x,
            p.y - player.y
        ) < SPAWN_MIN_DISTANCE)
            continue;

        if (Math.hypot(
            p.x - player.x,
            p.y - player.y
        ) > SPAWN_MAX_DISTANCE)
            continue;

        if (lineBlocked(
            player.x,
            player.y,
            p.x,
            p.y
        )) {
            /*
               Monsters mogen achter muren
               verschijnen. Dat voorkomt dat
               ze recht voor je neus verschijnen.
            */
        }

        return p;
    }

    return null;
}

/*
   Dit zorgt ervoor dat als de speler ver weg loopt,
   de game monsters blijft genereren.
*/

function maintainDistantEnemies() {

    if (!player) return;

    if (enemies.length >= MAX_ENEMIES)
        return;

    const sector =
        sectorFromPosition(
            player.x,
            player.y
        );

    discoverSector(sector);

    /*
       Niet alleen de huidige sector.
       Ook aangrenzende gebieden kunnen
       alvast vijanden bevatten.
    */

    const sx = sector % 6;
    const sy = Math.floor(sector / 6);

    for (let oy = -1; oy <= 1; oy++) {

        for (let ox = -1; ox <= 1; ox++) {

            const nx = sx + ox;
            const ny = sy + oy;

            if (
                nx < 0 ||
                ny < 0 ||
                nx >= 6 ||
                ny >= 5
            ) {
                continue;
            }

            const nearbySector =
                ny * 6 + nx;

            if (
                nearbySector !== sector &&
                Math.random() > .35
            ) {
                continue;
            }

            const count =
                enemies.filter(e =>
                    sectorFromPosition(
                        e.x,
                        e.y
                    ) === nearbySector
                ).length;

            if (count < 3) {

                const position =
                    findSpawnNearPlayerForSector(
                        nearbySector
                    );

                if (position) {

                    enemies.push(
                        createEnemy(
                            position.x,
                            position.y,
                            chooseEnemyType()
                        )
                    );
                }
            }
        }
    }
}

/* =========================================================
   PROJECTILES
   ========================================================= */

let bullets = [];
let enemyBullets = [];

function shoot() {

    if (!player) return;

    if (state !== "playing") return;

    if (reloadTimer > 0) return;

    const weapon = currentWeapon();

    if (weapon.ammo <= 0) {

        sound("hit");
        reload();

        return;
    }

    if (fireCooldown > 0) return;

    weapon.ammo--;

    player.shots++;

    fireCooldown =
        weapon.fireRate;

    const worldMouse =
        screenToWorld(
            mouseX,
            mouseY
        );

    const baseAngle =
        Math.atan2(
            worldMouse.y - player.y,
            worldMouse.x - player.x
        );

    player.angle = baseAngle;

    const damageMultiplier =
        1 + player.damageBoost;

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
            x: player.x +
                Math.cos(angle) * 24,

            y: player.y +
                Math.sin(angle) * 24,

            vx: Math.cos(angle) *
                weapon.speed,

            vy: Math.sin(angle) *
                weapon.speed,

            damage:
                weapon.damage *
                damageMultiplier,

            life: 1.5,

            radius:
                weapon.id === "rail"
                    ? 4
                    : 3,

            color:
                weapon.color,

            weapon:
                weapon.id
        });
    }

    sound("shoot");
}

function enemyShoot(enemy) {

    if (!player) return;

    const angle =
        Math.atan2(
            player.y - enemy.y,
            player.x - enemy.x
        );

    enemyBullets.push({
        x: enemy.x,
        y: enemy.y,

        vx: Math.cos(angle) * 330,
        vy: Math.sin(angle) * 330,

        damage: enemy.damage,

        life: 2.5,

        radius: 5,

        color: enemy.color
    });
}

/* =========================================================
   PICKUPS
   ========================================================= */

let pickups = [];

const inventoryDefaults = {
    medkits: 2,
    energyCells: 3,
    scrap: 0,
    keys: 0
};

let inventory = {
    ...inventoryDefaults
};

function spawnPickup(x, y, type, amount = 1) {

    pickups.push({
        x,
        y,
        type,
        amount,
        life: 30,
        pulse: random(0, 10)
    });
}

function collectPickup(pickup) {

    if (pickup.type === "credit") {
        player.credits += pickup.amount;
    }

    if (pickup.type === "medkit") {
        inventory.medkits += pickup.amount;
    }

    if (pickup.type === "energy") {
        inventory.energyCells += pickup.amount;
    }

    if (pickup.type === "scrap") {
        inventory.scrap += pickup.amount;
    }

    sound("pickup");

    pickups =
        pickups.filter(
            p => p !== pickup
        );

    updateAchievements();
}

/* =========================================================
   PARTICLES
   ========================================================= */

let particles = [];

function particle(
    x,
    y,
    color,
    count = 5,
    speed = 80
) {

    for (let i = 0; i < count; i++) {

        if (particles.length >= MAX_PARTICLES)
            particles.shift();

        const angle =
            random(0, Math.PI * 2);

        const velocity =
            random(speed * .3, speed);

        particles.push({
            x,
            y,

            vx:
                Math.cos(angle) *
                velocity,

            vy:
                Math.sin(angle) *
                velocity,

            life: random(.25, .7),

            maxLife: .7,

            size: random(2, 6),

            color
        });
    }
}

/* =========================================================
   WEATHER
   ========================================================= */

let weather = "clear";

let weatherTimer = 0;

let rain = [];

function changeWeather() {

    const options = [
        "clear",
        "fog",
        "rain"
    ];

    weather =
        options[
            randomInt(
                0,
                options.length - 1
            )
        ];

    document.getElementById(
        "weatherText"
    ).textContent =
        weather.toUpperCase();

    if (weather === "rain") {

        rain = [];

        for (let i = 0; i < 250; i++) {

            rain.push({
                x: random(0, W),
                y: random(0, H),
                speed: random(500, 850)
            });
        }
    } else {
        rain = [];
    }
}

/* =========================================================
   MISSION
   ========================================================= */

const mission = {
    signalFound: false,
    killsNeeded: 8,
    kills: 0
};

function updateMission() {

    if (!player) return;

    if (
        !mission.signalFound &&
        mission.kills >=
        mission.killsNeeded
    ) {

        objectiveElement.textContent =
            "OBJECTIVE: FIND THE SIGNAL";
    }

    if (
        mission.signalFound
    ) {
        objectiveElement.textContent =
            "SIGNAL SECURED";
    } else {
        objectiveElement.textContent =
            "DEFEAT ECHOES: " +
            mission.kills +
            "/" +
            mission.killsNeeded;
    }
}

function checkBeacons() {

    if (!player || mission.signalFound)
        return;

    for (const beacon of beacons) {

        if (
            Math.hypot(
                player.x - beacon.x,
                player.y - beacon.y
            ) < 70
        ) {

            if (
                mission.kills >=
                mission.killsNeeded
            ) {

                mission.signalFound = true;
                beacon.active = true;

                unlockAchievement("signal");

                state = "victory";

                showVictory();

                sound("level");

                return;
            }
        }
    }
}

/* =========================================================
   CHESTS / INTERACTION
   ========================================================= */

function interact() {

    if (!player || state !== "playing")
        return;

    /*
       DEUREN
    */

    for (const door of doors) {

        if (
            Math.hypot(
                player.x -
                (door.x + door.w / 2),

                player.y -
                (door.y + door.h / 2)
            ) < 100
        ) {

            door.open = !door.open;

            showMessage(
                door.open
                    ? "DEUR GEOPEND"
                    : "DEUR GESLOTEN"
            );

            sound("pickup");

            return;
        }
    }

    /*
       CHESTS
    */

    for (const chest of chests) {

        if (chest.opened) continue;

        if (
            Math.hypot(
                player.x - chest.x,
                player.y - chest.y
            ) < 85
        ) {

            chest.opened = true;

            const reward =
                randomInt(30, 120);

            player.credits += reward;

            inventory.scrap +=
                randomInt(2, 8);

            if (chance(.25)) {
                inventory.medkits++;
            }

            particle(
                chest.x,
                chest.y,
                "#ffd36b",
                20,
                150
            );

            showMessage(
                "KIST: +" +
                reward +
                " CREDITS"
            );

            sound("pickup");

            return;
        }
    }

    /*
       TERMINALS
    */

    for (const terminal of terminals) {

        if (
            Math.hypot(
                player.x - terminal.x,
                player.y - terminal.y
            ) < 85
        ) {

            if (!terminal.used) {

                terminal.used = true;

                player.xp += 35;

                inventory.energyCells++;

                showMessage(
                    "TERMINAL GEACTIVEERD +35 XP"
                );

                sound("pickup");

                checkLevelUp();

            } else {

                showMessage(
                    "TERMINAL AL GEBRUIKT"
                );
            }

            return;
        }
    }
}

/* =========================================================
   PLAYER MOVEMENT
   ========================================================= */

function updatePlayer(dt) {

    if (!player) return;

    if (state !== "playing") return;

    let moveX = 0;
    let moveY = 0;

    /*
       BELANGRIJKE FIX:

       We controleren zowel event.code
       als de normale letter.
    */

    if (
        down(
            "KeyW",
            "w",
            "ArrowUp"
        )
    ) {
        moveY -= 1;
    }

    if (
        down(
            "KeyS",
            "s",
            "ArrowDown"
        )
    ) {
        moveY += 1;
    }

    if (
        down(
            "KeyA",
            "a",
            "ArrowLeft"
        )
    ) {
        moveX -= 1;
    }

    if (
        down(
            "KeyD",
            "d",
            "ArrowRight"
        )
    ) {
        moveX += 1;
    }

    if (moveX !== 0 || moveY !== 0) {

        const direction =
            normalize(
                moveX,
                moveY
            );

        let speed =
            player.speed *
            (1 + player.speedBoost);

        if (player.dashTimer > 0) {
            speed *= 4.5;
        }

        const oldX = player.x;
        const oldY = player.y;

        moveWithCollision(
            player,
            direction.x *
            speed *
            dt,

            direction.y *
            speed *
            dt
        );

        const moved =
            Math.hypot(
                player.x - oldX,
                player.y - oldY
            );

        meta.totalDistance += moved;

        player.dashes += moved;

        if (moved > 0) {
            player.angle =
                Math.atan2(
                    direction.y,
                    direction.x
                );
        }
    }

    /*
       ENERGY
    */

    player.energy =
        clamp(
            player.energy +
            player.energyRegen * dt,
            0,
            player.maxEnergy
        );

    /*
       DASH
    */

    if (
        down("Space") &&
        player.dashCooldown <= 0 &&
        player.energy >= 30
    ) {

        let dx = 0;
        let dy = 0;

        if (
            down("KeyW","w","ArrowUp")
        ) dy--;

        if (
            down("KeyS","s","ArrowDown")
        ) dy++;

        if (
            down("KeyA","a","ArrowLeft")
        ) dx--;

        if (
            down("KeyD","d","ArrowRight")
        ) dx++;

        if (dx === 0 && dy === 0) {

            const target =
                screenToWorld(
                    mouseX,
                    mouseY
                );

            const d =
                normalize(
                    target.x - player.x,
                    target.y - player.y
                );

            dx = d.x;
            dy = d.y;

        } else {

            const d =
                normalize(dx, dy);

            dx = d.x;
            dy = d.y;
        }

        player.energy -= 30;
        player.dashCooldown = 1;
        player.dashTimer = .16;
        player.invulnerable = .25;

        moveWithCollision(
            player,
            dx * 130,
            dy * 130
        );

        particle(
            player.x,
            player.y,
            "#74dfff",
            25,
            170
        );

        sound("dash");
    }

    if (player.dashCooldown > 0) {
        player.dashCooldown -= dt;
    }

    if (player.dashTimer > 0) {
        player.dashTimer -= dt;
    }

    if (player.invulnerable > 0) {
        player.invulnerable -= dt;
    }

    if (player.flash > 0) {
        player.flash -= dt;
    }
}

/* =========================================================
   CAMERA
   ========================================================= */

const camera = {
    x: 0,
    y: 0
};

function updateCamera() {

    if (!player) return;

    const targetX =
        player.x - W / 2;

    const targetY =
        player.y - H / 2;

    camera.x =
        lerp(
            camera.x,
            targetX,
            .12
        );

    camera.y =
        lerp(
            camera.y,
            targetY,
            .12
        );

    camera.x =
        clamp(
            camera.x,
            0,
            WORLD_WIDTH - W
        );

    camera.y =
        clamp(
            camera.y,
            0,
            WORLD_HEIGHT - H
        );
}

function screenToWorld(x, y) {

    return {
        x: x + camera.x,
        y: y + camera.y
    };
}

function worldToScreen(x, y) {

    return {
        x: x - camera.x,
        y: y - camera.y
    };
}

/* =========================================================
   ENEMY UPDATE
   ========================================================= */

function updateEnemies(dt) {

    if (!player) return;

    for (const enemy of enemies) {

        if (enemy.dead) continue;

        const dx =
            player.x - enemy.x;

        const dy =
            player.y - enemy.y;

        const distance =
            Math.hypot(dx, dy);

        /*
           MONSTERS BUITEN DEZE AFSTAND
           DOEN NIET ZOMAAR IETS.
        */

        if (
            distance <=
            ENEMY_DETECT_RANGE
        ) {

            enemy.angle =
                Math.atan2(
                    dy,
                    dx
                );

            /*
               Alleen bewegen als er geen
               directe botsing met de speler is.
            */

            if (
                distance >
                enemy.radius +
                player.radius +
                45
            ) {

                let moveX =
                    Math.cos(
                        enemy.angle
                    );

                let moveY =
                    Math.sin(
                        enemy.angle
                    );

                /*
                   Simpele muurvermijding
                */

                const futureX =
                    enemy.x +
                    moveX *
                    enemy.speed *
                    dt;

                const futureY =
                    enemy.y +
                    moveY *
                    enemy.speed *
                    dt;

                if (
                    !collidesAt(
                        futureX,
                        futureY,
                        enemy.radius
                    )
                ) {

                    enemy.x =
                        futureX;

                    enemy.y =
                        futureY;

                } else {

                    /*
                       Probeer zijwaarts
                    */

                    const sideX = -moveY;
                    const sideY = moveX;

                    const sx =
                        enemy.x +
                        sideX *
                        enemy.speed *
                        dt;

                    const sy =
                        enemy.y +
                        sideY *
                        enemy.speed *
                        dt;

                    if (
                        !collidesAt(
                            sx,
                            sy,
                            enemy.radius
                        )
                    ) {

                        enemy.x = sx;
                        enemy.y = sy;
                    }
                }
            }

            /*
               SCHIETEN

               Ze moeten dichtbij genoeg zijn
               en een zichtlijn hebben.
            */

            enemy.shootCd -= dt;

            if (
                distance <=
                Math.min(
                    ENEMY_SHOOT_RANGE,
                    enemy.range
                ) &&

                !lineBlocked(
                    enemy.x,
                    enemy.y,
                    player.x,
                    player.y
                ) &&

                enemy.shootCd <= 0
            ) {

                enemyShoot(enemy);

                enemy.shootCd =
                    enemy.fireRate +
                    random(-.3, .4);
            }

        } else {

            /*
               Ver weg:
               rustig rondlopen in plaats
               van meteen achter de speler
               aan te teleporteren.
            */

            enemy.wanderTimer -= dt;

            if (enemy.wanderTimer <= 0) {

                enemy.wanderTimer =
                    random(1, 4);

                enemy.wanderAngle =
                    random(
                        0,
                        Math.PI * 2
                    );
            }

            const wx =
                Math.cos(
                    enemy.wanderAngle
                );

            const wy =
                Math.sin(
                    enemy.wanderAngle
                );

            const nx =
                enemy.x +
                wx *
                enemy.speed *
                .25 *
                dt;

            const ny =
                enemy.y +
                wy *
                enemy.speed *
                .25 *
                dt;

            if (
                !collidesAt(
                    nx,
                    ny,
                    enemy.radius
                )
            ) {

                enemy.x = nx;
                enemy.y = ny;
            }
        }

        /*
           CONTACT DAMAGE
        */

        if (
            distance <
            enemy.radius +
            player.radius
        ) {

            damagePlayer(
                enemy.damage *
                dt
            );
        }

        if (enemy.hitFlash > 0) {
            enemy.hitFlash -= dt;
        }
    }

    /*
       Verwijder dode enemies
    */

    enemies =
        enemies.filter(
            e => !e.dead
        );
}

/* =========================================================
   BULLET UPDATE
   ========================================================= */

function updateBullets(dt) {

    for (const bullet of bullets) {

        bullet.x +=
            bullet.vx * dt;

        bullet.y +=
            bullet.vy * dt;

        bullet.life -= dt;

        if (
            bullet.life <= 0 ||
            pointInWall(
                bullet.x,
                bullet.y
            )
        ) {

            bullet.life = 0;

            particle(
                bullet.x,
                bullet.y,
                bullet.color,
                4,
                40
            );

            continue;
        }

        for (const enemy of enemies) {

            if (enemy.dead) continue;

            const d =
                Math.hypot(
                    bullet.x - enemy.x,
                    bullet.y - enemy.y
                );

            if (
                d <
                enemy.radius +
                bullet.radius
            ) {

                enemy.hp -=
                    bullet.damage;

                enemy.hitFlash = .1;

                bullet.life = 0;

                particle(
                    bullet.x,
                    bullet.y,
                    bullet.color,
                    7,
                    80
                );

                if (enemy.hp <= 0) {
                    killEnemy(enemy);
                }

                break;
            }
        }
    }

    bullets =
        bullets.filter(
            b => b.life > 0
        );

    /*
       ENEMY BULLETS
    */

    for (const bullet of enemyBullets) {

        bullet.x +=
            bullet.vx * dt;

        bullet.y +=
            bullet.vy * dt;

        bullet.life -= dt;

        if (
            bullet.life <= 0 ||
            pointInWall(
                bullet.x,
                bullet.y
            )
        ) {
            bullet.life = 0;
            continue;
        }

        if (player) {

            const d =
                Math.hypot(
                    bullet.x - player.x,
                    bullet.y - player.y
                );

            if (
                d <
                player.radius +
                bullet.radius
            ) {

                bullet.life = 0;

                damagePlayer(
                    bullet.damage
                );
            }
        }
    }

    enemyBullets =
        enemyBullets.filter(
            b => b.life > 0
        );
}

/* =========================================================
   ENEMY DEATH
   ========================================================= */

function killEnemy(enemy) {

    if (enemy.dead) return;

    enemy.dead = true;

    player.kills++;

    mission.kills++;

    player.xp +=
        Math.floor(
            enemy.reward * .7
        );

    player.credits +=
        enemy.reward;

    meta.totalKills =
        Math.max(
            meta.totalKills || 0,
            player.kills
        );

    particle(
        enemy.x,
        enemy.y,
        enemy.color,
        25,
        160
    );

    sound("hit");

    /*
       LOOT
    */

    if (chance(.55)) {

        spawnPickup(
            enemy.x,
            enemy.y,
            "credit",
            randomInt(5, 30)
        );
    }

    if (chance(.14)) {

        spawnPickup(
            enemy.x,
            enemy.y,
            "energy",
            1
        );
    }

    if (chance(.08)) {

        spawnPickup(
            enemy.x,
            enemy.y,
            "medkit",
            1
        );
    }

    if (chance(.18)) {

        spawnPickup(
            enemy.x,
            enemy.y,
            "scrap",
            randomInt(1, 3)
        );
    }

    checkLevelUp();

    updateAchievements();
}

/* =========================================================
   PLAYER DAMAGE
   ========================================================= */

function damagePlayer(amount) {

    if (!player) return;

    if (player.invulnerable > 0)
        return;

    player.hp -= amount;

    player.flash = .15;

    const flash =
        document.getElementById(
            "damageFlash"
        );

    if (flash) {

        flash.style.opacity = "1";

        setTimeout(() => {
            flash.style.opacity = "0";
        }, 70);
    }

    if (player.hp <= 0) {

        player.hp = 0;

        gameOver();

    }
}

/* =========================================================
   LEVELING
   ========================================================= */

function xpNeeded() {

    return 100 +
        (player.level - 1) *
        65;
}

function checkLevelUp() {

    if (!player) return;

    while (
        player.xp >= xpNeeded()
    ) {

        player.xp -= xpNeeded();

        player.level++;

        player.maxHp += 10;
        player.hp = player.maxHp;

        player.maxEnergy += 5;
        player.energy =
            player.maxEnergy;

        player.speed += 3;

        player.damageBoost += .025;

        sound("level");

        showMessage(
            "LEVEL UP! LEVEL " +
            player.level
        );

        if (
            player.level >= 2
        ) {
            weapons[1].unlocked = true;
        }

        if (
            player.level >= 3
        ) {
            weapons[2].unlocked = true;
        }

        if (
            player.level >= 4
        ) {
            weapons[3].unlocked = true;
        }

        if (
            player.level >= 5
        ) {
            weapons[4].unlocked = true;
        }

        if (
            player.level >= 6
        ) {
            weapons[5].unlocked = true;
        }
    }

    updateAchievements();
}

/* =========================================================
   INVENTORY
   ========================================================= */

function useMedkit() {

    if (
        !player ||
        inventory.medkits <= 0 ||
        player.hp >= player.maxHp
    ) return;

    inventory.medkits--;

    player.hp =
        Math.min(
            player.maxHp,
            player.hp + 40
        );

    showMessage(
        "MEDKIT GEBRUIKT"
    );

    sound("pickup");
}

function useEnergyCell() {

    if (
        !player ||
        inventory.energyCells <= 0 ||
        player.energy >= player.maxEnergy
    ) return;

    inventory.energyCells--;

    player.energy =
        Math.min(
            player.maxEnergy,
            player.energy + 50
        );

    showMessage(
        "ENERGIECEL GEBRUIKT"
    );

    sound("pickup");
}

function renderInventory() {

    const content =
        document.getElementById(
            "inventoryContent"
        );

    if (!content || !player)
        return;

    content.innerHTML = `
        <p>LEVEL: <b>${player.level}</b></p>
        <p>HP: <b>${Math.floor(player.hp)}/${player.maxHp}</b></p>
        <p>ENERGY: <b>${Math.floor(player.energy)}/${player.maxEnergy}</b></p>
        <p>CREDITS: <b>${player.credits}</b></p>
        <p>SCRAP: <b>${inventory.scrap}</b></p>
        <p>MEDKITS: <b>${inventory.medkits}</b></p>
        <p>ENERGIECELLEN: <b>${inventory.energyCells}</b></p>
        <p>KILLS: <b>${player.kills}</b></p>
        <hr>
        <p>1 — ${weapons[0].name}</p>
        <p>2 — ${weapons[1].name}</p>
        <p>3 — ${weapons[2].name}</p>
        <p>4 — ${weapons[3].name}</p>
        <p>5 — ${weapons[4].name}</p>
        <p>6 — ${weapons[5].name}</p>
    `;
}

/* =========================================================
   UPDATE PICKUPS
   ========================================================= */

function updatePickups(dt) {

    for (const pickup of pickups) {

        pickup.life -= dt;
        pickup.pulse += dt * 5;

        if (!player) continue;

        const d =
            Math.hypot(
                player.x - pickup.x,
                player.y - pickup.y
            );

        if (d < 55) {
            collectPickup(pickup);
        }
    }

    pickups =
        pickups.filter(
            p => p.life > 0
        );
}

/* =========================================================
   PARTICLE UPDATE
   ========================================================= */

function updateParticles(dt) {

    for (const p of particles) {

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        p.vx *= .97;
        p.vy *= .97;

        p.life -= dt;
    }

    particles =
        particles.filter(
            p => p.life > 0
        );
}

/* =========================================================
   GAME FLOW
   ========================================================= */

function resetWorld() {

    player = createPlayer();

    enemies = [];
    bullets = [];
    enemyBullets = [];
    pickups = [];
    particles = [];

    inventory = {
        ...inventoryDefaults
    };

    weapons.forEach(w => {
        w.ammo = w.maxAmmo;
    });

    weapons[0].unlocked = true;

    for (let i = 1; i < weapons.length; i++) {
        weapons[i].unlocked = false;
    }

    weaponIndex = 0;

    fireCooldown = 0;
    reloadTimer = 0;

    currentSector = 0;

    discoveredSectors.clear();

    mission.signalFound = false;
    mission.kills = 0;

    meta.totalDistance =
        meta.totalDistance || 0;

    buildWorld();

    discoverSector(0, true);

    /*
       Eerste groep monsters
    */

    for (let i = 0; i < 7; i++) {

        const p =
            findSpawnNearPlayerForSector(
                0
            );

        if (p) {

            enemies.push(
                createEnemy(
                    p.x,
                    p.y,
                    chooseEnemyType()
                )
            );
        }
    }

    camera.x = 0;
    camera.y = 0;

    changeWeather();

    elapsed = 0;
}

/* =========================================================
   NEW GAME
   ========================================================= */

function newGame() {

    startAudio();

    /*
       Reset alle toetsen zodat een oude
       ingedrukte toets niet blijft hangen.
    */

    for (const key in keys) {
        keys[key] = false;
    }

    mouseDown = false;

    resetWorld();

    state = "playing";

    menu.style.display = "none";

    pauseScreen.style.display = "none";

    hud.style.display = "block";

    hideAllOverlays();

    canvas.focus();

    showMessage("SIGNAL SEARCH STARTED");

    updateHUD();
}

/* =========================================================
   GAME OVER
   ========================================================= */

function gameOver() {

    state = "gameover";

    mouseDown = false;

    const text =
        document.getElementById(
            "gameOverText"
        );

    if (text && player) {

        text.textContent =
            "KILLS: " +
            player.kills +
            " • LEVEL: " +
            player.level +
            " • CREDITS: " +
            player.credits;
    }

    document.getElementById(
        "gameOverOverlay"
    ).style.display = "flex";
}

function showVictory() {

    const stats =
        document.getElementById(
            "victoryStats"
        );

    if (stats && player) {

        stats.textContent =
            "KILLS: " +
            player.kills +
            " • LEVEL: " +
            player.level +
            " • CREDITS: " +
            player.credits;
    }

    document.getElementById(
        "victoryOverlay"
    ).style.display = "flex";
}

/* =========================================================
   PAUSE
   ========================================================= */

function handleEscape() {

    if (
        state === "playing"
    ) {

        state = "paused";

        pauseScreen.style.display =
            "flex";

        return;
    }

    if (
        state === "paused"
    ) {

        state = "playing";

        pauseScreen.style.display =
            "none";
    }
}

/* =========================================================
   MAP
   ========================================================= */

function toggleMap() {

    if (
        state !== "playing" &&
        state !== "map"
    ) return;

    if (state === "playing") {

        state = "map";

        mapScreen.style.display =
            "flex";

        drawMap();

    } else {

        state = "playing";

        mapScreen.style.display =
            "none";
    }
}

function drawMap() {

    if (!mapCtx || !player)
        return;

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

    const sx =
        mapCanvas.width /
        WORLD_WIDTH;

    const sy =
        mapCanvas.height /
        WORLD_HEIGHT;

    /*
       Muren
    */

    mapCtx.fillStyle =
        "#40515a";

    for (const wall of walls) {

        mapCtx.fillRect(
            wall.x * sx,
            wall.y * sy,
            wall.w * sx,
            wall.h * sy
        );
    }

    /*
       ontdekte sectoren
    */

    for (const sector of discoveredSectors) {

        const x =
            (sector % 6) * 1000 * sx;

        const y =
            Math.floor(sector / 6) *
            1000 *
            sy;

        mapCtx.strokeStyle =
            "rgba(100,180,220,.25)";

        mapCtx.strokeRect(
            x,
            y,
            1000 * sx,
            1000 * sy
        );
    }

    /*
       enemies
    */

    mapCtx.fillStyle =
        "#ff6d65";

    for (const enemy of enemies) {

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

    /*
       player
    */

    mapCtx.fillStyle =
        "#80e7ff";

    mapCtx.beginPath();

    mapCtx.arc(
        player.x * sx,
        player.y * sy,
        5,
        0,
        Math.PI * 2
    );

    mapCtx.fill();

    /*
       beacons
    */

    mapCtx.fillStyle =
        "#ffe680";

    for (const beacon of beacons) {

        mapCtx.beginPath();

        mapCtx.arc(
            beacon.x * sx,
            beacon.y * sy,
            5,
            0,
            Math.PI * 2
        );

        mapCtx.fill();
    }
}

/* =========================================================
   UI
   ========================================================= */

function updateHUD() {

    if (!player) return;

    if (healthBar) {

        healthBar.style.width =
            (
                player.hp /
                player.maxHp *
                100
            ) + "%";
    }

    if (energyBar) {

        energyBar.style.width =
            (
                player.energy /
                player.maxEnergy *
                100
            ) + "%";
    }

    if (killsElement) {

        killsElement.textContent =
            "KILLS: " +
            player.kills;
    }

    if (creditsElement) {

        creditsElement.textContent =
            "CREDITS: " +
            player.credits;
    }

    if (zoneElement) {

        zoneElement.textContent =
            sectorName(
                currentSector
            );
    }

    if (ammoElement) {

        ammoElement.textContent =
            currentWeapon().ammo +
            " / " +
            currentWeapon().maxAmmo;
    }

    const level =
        document.getElementById(
            "levelValue"
        );

    const xp =
        document.getElementById(
            "xpValue"
        );

    const xpMax =
        document.getElementById(
            "xpMax"
        );

    if (level)
        level.textContent =
            player.level;

    if (xp)
        xp.textContent =
            Math.floor(player.xp);

    if (xpMax)
        xpMax.textContent =
            xpNeeded();

    const weaponName =
        document.getElementById(
            "weaponNameExtra"
        );

    if (weaponName) {

        weaponName.textContent =
            currentWeapon().name;
    }

    updateMission();
}

/* =========================================================
   MESSAGE
   ========================================================= */

let messageTimer = 0;

function showMessage(text) {

    const box =
        document.getElementById(
            "messageBox"
        );

    if (!box) return;

    box.textContent = text;
    box.style.opacity = "1";

    messageTimer = 2;
}

/* =========================================================
   OVERLAYS
   ========================================================= */

function hideAllOverlays() {

    document
        .querySelectorAll(".overlayPanel")
        .forEach(el => {
            el.style.display = "none";
        });
}

function toggleInventory() {

    if (!player) return;

    if (
        state === "playing"
    ) {

        state = "inventory";

        renderInventory();

        inventoryOverlay.style.display =
            "flex";

    } else if (
        state === "inventory"
    ) {

        state = "playing";

        inventoryOverlay.style.display =
            "none";
    }
}

/* =========================================================
   SAVE SLOTS UI
   ========================================================= */

function renderSaveSlots() {

    const grid =
        document.getElementById(
            "slotGrid"
        );

    if (!grid) return;

    grid.innerHTML = "";

    for (let i = 1; i <= 3; i++) {

        const exists =
            saveExists(i);

        const slot =
            document.createElement("div");

        slot.className = "slot";

        slot.innerHTML = `
            <strong>SLOT ${i}</strong>
            <p>
                ${exists
                    ? "RUN OPGESLAGEN"
                    : "LEEG"}
            </p>
            <button class="panelButton saveSlotButton">
                OPSLAAN
            </button>
        `;

        slot
            .querySelector(
                ".saveSlotButton"
            )
            .onclick = () => {

                saveGame(i);

                renderSaveSlots();
            };

        grid.appendChild(slot);
    }
}

/* =========================================================
   CONTINUE
   ========================================================= */

function continueGame() {

    for (let i = 1; i <= 3; i++) {

        if (saveExists(i)) {

            if (loadGame(i)) {
                return;
            }
        }
    }

    showMessage(
        "GEEN OPGESLAGEN RUN"
    );
}

/* =========================================================
   RENDER BACKGROUND
   ========================================================= */

function renderBackground() {

    /*
       Basisvloer
    */

    ctx.fillStyle =
        "#11191c";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    /*
       grote vloerblokken
    */

    const gridSize = 100;

    const startX =
        Math.floor(
            camera.x / gridSize
        ) * gridSize;

    const startY =
        Math.floor(
            camera.y / gridSize
        ) * gridSize;

    for (
        let x = startX;
        x < camera.x + W + gridSize;
        x += gridSize
    ) {

        for (
            let y = startY;
            y < camera.y + H + gridSize;
            y += gridSize
        ) {

            const p =
                worldToScreen(
                    x,
                    y
                );

            const variation =
                (
                    Math.abs(
                        Math.floor(x / gridSize) * 17 +
                        Math.floor(y / gridSize) * 31
                    ) % 5
                );

            ctx.fillStyle =
                variation % 2 === 0
                    ? "#141d20"
                    : "#172124";

            ctx.fillRect(
                p.x,
                p.y,
                gridSize,
                gridSize
            );

            ctx.strokeStyle =
                "rgba(130,160,170,.035)";

            ctx.strokeRect(
                p.x,
                p.y,
                gridSize,
                gridSize
            );
        }
    }

    /*
       kleine gronddetails
    */

    ctx.fillStyle =
        "rgba(100,150,160,.05)";

    for (let i = 0; i < 100; i++) {

        const x =
            ((i * 631) %
                WORLD_WIDTH);

        const y =
            ((i * 391) %
                WORLD_HEIGHT);

        const p =
            worldToScreen(x, y);

        ctx.fillRect(
            p.x,
            p.y,
            2,
            2
        );
    }
}

/* =========================================================
   RENDER PROPS
   ========================================================= */

function renderProps() {

    for (const prop of props) {

        const p =
            worldToScreen(
                prop.x,
                prop.y
            );

        if (
            p.x < -60 ||
            p.y < -60 ||
            p.x > W + 60 ||
            p.y > H + 60
        ) continue;

        ctx.save();

        ctx.translate(
            p.x,
            p.y
        );

        ctx.rotate(
            prop.rotation
        );

        if (prop.type === "crate") {

            ctx.fillStyle =
                "#5d4632";

            ctx.fillRect(
                -prop.size,
                -prop.size,
                prop.size * 2,
                prop.size * 2
            );

            ctx.strokeStyle =
                "#a1784e";

            ctx.strokeRect(
                -prop.size,
                -prop.size,
                prop.size * 2,
                prop.size * 2
            );

            ctx.strokeStyle =
                "rgba(255,255,255,.15)";

            ctx.beginPath();

            ctx.moveTo(
                -prop.size,
                -prop.size
            );

            ctx.lineTo(
                prop.size,
                prop.size
            );

            ctx.stroke();

        } else if (prop.type === "rock") {

            ctx.fillStyle =
                "#4b575a";

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                prop.size,
                0,
                Math.PI * 2
            );

            ctx.fill();

        } else {

            ctx.strokeStyle =
                "#426f61";

            ctx.lineWidth = 4;

            for (let i = 0; i < 4; i++) {

                ctx.beginPath();

                ctx.moveTo(
                    0,
                    0
                );

                ctx.lineTo(
                    random(
                        -prop.size,
                        prop.size
                    ),
                    -prop.size
                );

                ctx.stroke();
            }
        }

        ctx.restore();
    }
}

/* =========================================================
   RENDER WALLS
   ========================================================= */

function renderWalls() {

    for (const wall of walls) {

        const p =
            worldToScreen(
                wall.x,
                wall.y
            );

        if (
            p.x + wall.w < 0 ||
            p.y + wall.h < 0 ||
            p.x > W ||
            p.y > H
        ) continue;

        /*
           Schaduw
        */

        ctx.fillStyle =
            "rgba(0,0,0,.35)";

        ctx.fillRect(
            p.x + 8,
            p.y + 8,
            wall.w,
            wall.h
        );

        /*
           Muur
        */

        ctx.fillStyle =
            "#2c3c43";

        ctx.fillRect(
            p.x,
            p.y,
            wall.w,
            wall.h
        );

        /*
           duidelijke rand
        */

        ctx.strokeStyle =
            "#6b8b95";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            p.x,
            p.y,
            wall.w,
            wall.h
        );

        /*
           binnenlijn
        */

        ctx.strokeStyle =
            "rgba(180,230,240,.16)";

        ctx.lineWidth = 1;

        ctx.strokeRect(
            p.x + 5,
            p.y + 5,
            wall.w - 10,
            wall.h - 10
        );

        /*
           paneellijnen
        */

        if (wall.w > 100) {

            for (
                let x = 50;
                x < wall.w;
                x += 100
            ) {

                ctx.strokeStyle =
                    "rgba(0,0,0,.18)";

                ctx.beginPath();

                ctx.moveTo(
                    p.x + x,
                    p.y
                );

                ctx.lineTo(
                    p.x + x,
                    p.y + wall.h
                );

                ctx.stroke();
            }
        }
    }

    /*
       DEUREN
    */

    for (const door of doors) {

        const p =
            worldToScreen(
                door.x,
                door.y
            );

        ctx.fillStyle =
            door.open
                ? "rgba(80,220,170,.16)"
                : "#704d32";

        ctx.fillRect(
            p.x,
            p.y,
            door.w,
            door.h
        );

        ctx.strokeStyle =
            door.open
                ? "#65dcae"
                : "#d39a5c";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            p.x,
            p.y,
            door.w,
            door.h
        );
    }
}

/* =========================================================
   RENDER CHESTS / TERMINALS / BEACONS
   ========================================================= */

function renderObjects() {

    for (const chest of chests) {

        const p =
            worldToScreen(
                chest.x,
                chest.y
            );

        ctx.fillStyle =
            chest.opened
                ? "#39444a"
                : "#76572f";

        ctx.fillRect(
            p.x - 20,
            p.y - 15,
            40,
            30
        );

        ctx.strokeStyle =
            chest.opened
                ? "#66757b"
                : "#d1a357";

        ctx.strokeRect(
            p.x - 20,
            p.y - 15,
            40,
            30
        );

        if (!chest.opened) {

            ctx.fillStyle =
                "#ffe68a";

            ctx.fillRect(
                p.x - 3,
                p.y - 3,
                6,
                6
            );
        }
    }

    for (const terminal of terminals) {

        const p =
            worldToScreen(
                terminal.x,
                terminal.y
            );

        ctx.fillStyle =
            "#26353b";

        ctx.fillRect(
            p.x - 12,
            p.y - 25,
            24,
            50
        );

        ctx.fillStyle =
            terminal.used
                ? "#53636a"
                : "#65ddff";

        ctx.fillRect(
            p.x - 7,
            p.y - 17,
            14,
            8
        );
    }

    for (const beacon of beacons) {

        const p =
            worldToScreen(
                beacon.x,
                beacon.y
            );

        const pulse =
            1 +
            Math.sin(elapsed * 4) * .15;

        ctx.strokeStyle =
            beacon.active
                ? "#76ffc4"
                : "#ffdb73";

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            32 * pulse,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.fillStyle =
            beacon.active
                ? "#76ffc4"
                : "#ffdb73";

        ctx.fillRect(
            p.x - 7,
            p.y - 35,
            14,
            70
        );
    }
}

/* =========================================================
   RENDER PICKUPS
   ========================================================= */

function renderPickups() {

    for (const pickup of pickups) {

        const p =
            worldToScreen(
                pickup.x,
                pickup.y
            );

        let color =
            "#ffd46b";

        if (pickup.type === "medkit")
            color = "#ff827a";

        if (pickup.type === "energy")
            color = "#72e5ff";

        if (pickup.type === "scrap")
            color = "#a7b2b7";

        const pulse =
            1 +
            Math.sin(
                pickup.pulse
            ) * .15;

        ctx.fillStyle =
            color;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            7 * pulse,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowColor =
            color;

        ctx.shadowBlur = 12;

        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

/* =========================================================
   RENDER ENEMIES
   ========================================================= */

function renderEnemies() {

    for (const enemy of enemies) {

        const p =
            worldToScreen(
                enemy.x,
                enemy.y
            );

        if (
            p.x < -80 ||
            p.y < -80 ||
            p.x > W + 80 ||
            p.y > H + 80
        ) continue;

        ctx.save();

        /*
           schaduw
        */

        ctx.fillStyle =
            "rgba(0,0,0,.35)";

        ctx.beginPath();

        ctx.ellipse(
            p.x,
            p.y + enemy.radius * .8,
            enemy.radius,
            enemy.radius * .45,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /*
           body
        */

        ctx.fillStyle =
            enemy.hitFlash > 0
                ? "#ffffff"
                : enemy.color;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /*
           donkere kern
        */

        ctx.fillStyle =
            "rgba(5,10,14,.7)";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            enemy.radius * .48,
            0,
            Math.PI * 2
        );

        ctx.fill();

        /*
           richting
        */

        ctx.strokeStyle =
            enemy.color;

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.moveTo(
            p.x,
            p.y
        );

        ctx.lineTo(
            p.x +
            Math.cos(enemy.angle) *
            enemy.radius * 1.5,

            p.y +
            Math.sin(enemy.angle) *
            enemy.radius * 1.5
        );

        ctx.stroke();

        /*
           HP bar
        */

        const hp =
            clamp(
                enemy.hp /
                enemy.maxHp,
                0,
                1
            );

        ctx.fillStyle =
            "rgba(0,0,0,.6)";

        ctx.fillRect(
            p.x - enemy.radius,
            p.y - enemy.radius - 10,
            enemy.radius * 2,
            4
        );

        ctx.fillStyle =
            enemy.color;

        ctx.fillRect(
            p.x - enemy.radius,
            p.y - enemy.radius - 10,
            enemy.radius * 2 * hp,
            4
        );

        ctx.restore();
    }
}

/* =========================================================
   RENDER PLAYER
   ========================================================= */

function renderPlayer() {

    if (!player) return;

    const p =
        worldToScreen(
            player.x,
            player.y
        );

    ctx.save();

    /*
       schaduw
    */

    ctx.fillStyle =
        "rgba(0,0,0,.4)";

    ctx.beginPath();

    ctx.ellipse(
        p.x,
        p.y + 18,
        21,
        9,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
       dash glow
    */

    if (player.dashTimer > 0) {

        ctx.strokeStyle =
            "rgba(100,230,255,.5)";

        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            30,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }

    /*
       body
    */

    ctx.fillStyle =
        player.flash > 0
            ? "#ffffff"
            : "#d8e7ec";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
       armor
    */

    ctx.strokeStyle =
        "#62c7e5";

    ctx.lineWidth = 3;

    ctx.stroke();

    /*
       helm/core
    */

    ctx.fillStyle =
        "#20343d";

    ctx.beginPath();

    ctx.arc(
        p.x,
        p.y,
        9,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
       weapon direction
    */

    ctx.strokeStyle =
        currentWeapon().color;

    ctx.lineWidth = 6;

    ctx.beginPath();

    ctx.moveTo(
        p.x,
        p.y
    );

    ctx.lineTo(
        p.x +
        Math.cos(player.angle) *
        32,

        p.y +
        Math.sin(player.angle) *
        32
    );

    ctx.stroke();

    ctx.restore();
}

/* =========================================================
   RENDER BULLETS
   ========================================================= */

function renderBullets() {

    for (const bullet of bullets) {

        const p =
            worldToScreen(
                bullet.x,
                bullet.y
            );

        ctx.fillStyle =
            bullet.color;

        ctx.shadowColor =
            bullet.color;

        ctx.shadowBlur = 10;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;
    }

    for (const bullet of enemyBullets) {

        const p =
            worldToScreen(
                bullet.x,
                bullet.y
            );

        ctx.fillStyle =
            bullet.color;

        ctx.shadowColor =
            bullet.color;

        ctx.shadowBlur = 8;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

/* =========================================================
   RENDER PARTICLES
   ========================================================= */

function renderParticles() {

    for (const p of particles) {

        const s =
            worldToScreen(
                p.x,
                p.y
            );

        ctx.globalAlpha =
            clamp(
                p.life /
                p.maxLife,
                0,
                1
            );

        ctx.fillStyle =
            p.color;

        ctx.fillRect(
            s.x,
            s.y,
            p.size,
            p.size
        );
    }

    ctx.globalAlpha = 1;
}

/* =========================================================
   LIGHTING
   ========================================================= */

function renderLighting() {

    if (!player) return;

    /*
       Donkere overlay
    */

    const gradient =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            80,
            W / 2,
            H / 2,
            Math.max(W, H) * .75
        );

    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    gradient.addColorStop(
        .55,
        "rgba(0,0,0,.12)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,.55)"
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
       spelerlicht
    */

    const light =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            30,
            W / 2,
            H / 2,
            260
        );

    light.addColorStop(
        0,
        "rgba(80,210,255,.055)"
    );

    light.addColorStop(
        1,
        "rgba(80,210,255,0)"
    );

    ctx.fillStyle =
        light;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    /*
       mist
    */

    if (weather === "fog") {

        ctx.fillStyle =
            "rgba(130,160,165,.10)";

        ctx.fillRect(
            0,
            0,
            W,
            H
        );
    }
}

/* =========================================================
   WEATHER RENDER
   ========================================================= */

function renderWeather() {

    if (weather !== "rain")
        return;

    ctx.strokeStyle =
        "rgba(120,190,220,.22)";

    ctx.lineWidth = 1;

    for (const drop of rain) {

        ctx.beginPath();

        ctx.moveTo(
            drop.x,
            drop.y
        );

        ctx.lineTo(
            drop.x - 4,
            drop.y + 15
        );

        ctx.stroke();
    }
}

/* =========================================================
   UPDATE WEATHER
   ========================================================= */

function updateWeather(dt) {

    weatherTimer += dt;

    if (weatherTimer > 35) {

        weatherTimer = 0;

        changeWeather();
    }

    if (weather === "rain") {

        for (const drop of rain) {

            drop.y +=
                drop.speed * dt;

            drop.x -=
                drop.speed *
                .08 *
                dt;

            if (
                drop.y > H + 20
            ) {

                drop.y =
                    random(-100, 0);

                drop.x =
                    random(0, W);
            }
        }
    }
}

/* =========================================================
   INTERACTION HINT
   ========================================================= */

function updateInteractionHint() {

    const hint =
        document.getElementById(
            "interactHint"
        );

    if (!hint || !player) return;

    let nearby = false;

    for (const chest of chests) {

        if (
            !chest.opened &&
            Math.hypot(
                player.x - chest.x,
                player.y - chest.y
            ) < 85
        ) {
            nearby = true;
        }
    }

    for (const door of doors) {

        if (
            Math.hypot(
                player.x -
                (door.x + door.w / 2),

                player.y -
                (door.y + door.h / 2)
            ) < 100
        ) {
            nearby = true;
        }
    }

    for (const terminal of terminals) {

        if (
            Math.hypot(
                player.x - terminal.x,
                player.y - terminal.y
            ) < 85
        ) {
            nearby = true;
        }
    }

    hint.style.display =
        nearby
            ? "block"
            : "none";
}

/* =========================================================
   BOSS
   ========================================================= */

let boss = null;

function spawnBoss() {

    if (boss) return;

    const position =
        findSpawnNearPlayerForSector(
            currentSector
        );

    if (!position) return;

    boss = {
        x: position.x,
        y: position.y,

        radius: 55,

        hp:
            1800 +
            player.level * 120,

        maxHp:
            1800 +
            player.level * 120,

        speed: 35,

        damage: 30,

        shootCd: 1,

        angle: 0,

        active: true
    };

    enemies.push(
        boss
    );

    showMessage(
        "WARNING: LARGE ECHO DETECTED"
    );

    sound("boss");
}

function updateBoss(dt) {

    if (!boss || !player)
        return;

    if (boss.dead) {

        boss = null;

        document.getElementById(
            "bossBar"
        ).style.display = "none";

        return;
    }

    const dx =
        player.x - boss.x;

    const dy =
        player.y - boss.y;

    const distance =
        Math.hypot(dx, dy);

    boss.angle =
        Math.atan2(
            dy,
            dx
        );

    if (
        distance < 1300
    ) {

        if (
            distance > 180
        ) {

            const nx =
                boss.x +
                Math.cos(boss.angle) *
                boss.speed *
                dt;

            const ny =
                boss.y +
                Math.sin(boss.angle) *
                boss.speed *
                dt;

            if (
                !collidesAt(
                    nx,
                    ny,
                    boss.radius
                )
            ) {

                boss.x = nx;
                boss.y = ny;
            }
        }

        boss.shootCd -= dt;

        if (
            boss.shootCd <= 0 &&
            distance < 750 &&
            !lineBlocked(
                boss.x,
                boss.y,
                player.x,
                player.y
            )
        ) {

            for (
                let i = 0;
                i < 5;
                i++
            ) {

                const a =
                    boss.angle +
                    (i - 2) *
                    .12;

                enemyBullets.push({
                    x: boss.x,
                    y: boss.y,

                    vx:
                        Math.cos(a) *
                        300,

                    vy:
                        Math.sin(a) *
                        300,

                    damage:
                        boss.damage,

                    life: 3,

                    radius: 7,

                    color: "#ffad6b"
                });
            }

            boss.shootCd = 2.2;
        }
    }

    const bossBar =
        document.getElementById(
            "bossBar"
        );

    const bossInner =
        document.getElementById(
            "bossInner"
        );

    if (bossBar)
        bossBar.style.display =
            "block";

    if (bossInner)
        bossInner.style.width =
            clamp(
                boss.hp /
                boss.maxHp *
                100,
                0,
                100
            ) + "%";
}

/* =========================================================
   PATCH BOSS DAMAGE
   ========================================================= */

const originalKillEnemy = killEnemy;

killEnemy = function(enemy) {

    if (enemy === boss) {

        unlockAchievement("boss");

        player.credits += 500;

        player.xp += 250;

        enemy.dead = true;

        showMessage(
            "BOSS DEFEATED +500 CREDITS"
        );

        particle(
            enemy.x,
            enemy.y,
            "#ffb56b",
            70,
            250
        );

        checkLevelUp();

        return;
    }

    originalKillEnemy(enemy);
};

/* =========================================================
   PATCH BULLET BOSS HIT
   ========================================================= */

function handleBossBullets() {

    if (!boss || boss.dead)
        return;

    for (const bullet of bullets) {

        if (bullet.life <= 0)
            continue;

        const d =
            Math.hypot(
                bullet.x - boss.x,
                bullet.y - boss.y
            );

        if (
            d <
            boss.radius +
            bullet.radius
        ) {

            boss.hp -=
                bullet.damage;

            bullet.life = 0;

            particle(
                bullet.x,
                bullet.y,
                bullet.color,
                5,
                80
            );

            if (boss.hp <= 0) {
                killEnemy(boss);
            }
        }
    }
}

/* =========================================================
   BOSS SPAWN RULE
   ========================================================= */

let bossTimer = 0;

function updateBossSpawner(dt) {

    bossTimer += dt;

    if (
        !boss &&
        player &&
        player.level >= 5 &&
        player.kills >= 25 &&
        bossTimer > 20
    ) {

        bossTimer = 0;

        spawnBoss();
    }
}

/* =========================================================
   SHOOT / RELOAD UPDATE
   ========================================================= */

function updateWeapons(dt) {

    if (fireCooldown > 0) {
        fireCooldown -= dt;
    }

    if (reloadTimer > 0) {

        reloadTimer -= dt;

        if (reloadTimer <= 0) {
            finishReload();
        }
    }

    if (
        mouseDown &&
        state === "playing"
    ) {
        shoot();
    }
}

/* =========================================================
   SECTOR UPDATE
   ========================================================= */

function updateSector() {

    if (!player) return;

    const newSector =
        sectorFromPosition(
            player.x,
            player.y
        );

    if (
        newSector !==
        currentSector
    ) {

        currentSector =
            newSector;

        discoverSector(
            currentSector
        );

        /*
           Extra monsters bij ver reizen
        */

        spawnSectorEnemies(
            currentSector
        );

        /*
           Soms boss kans in diepe sector
        */

        if (
            player.level >= 5 &&
            currentSector >= 10 &&
            chance(.15)
        ) {

            spawnBoss();
        }
    }

    /*
       ALTIJD blijven aanvullen
       terwijl de speler verder loopt.
    */

    maintainDistantEnemies();
}

/* =========================================================
   MAIN UPDATE
   ========================================================= */

function update(dt) {

    if (state !== "playing") {

        updateParticles(dt);

        return;
    }

    elapsed += dt;

    updatePlayer(dt);

    updateCamera();

    updateWeapons(dt);

    updateEnemies(dt);

    updateBoss(dt);

    updateBossSpawner(dt);

    updateBullets(dt);

    handleBossBullets();

    updatePickups(dt);

    updateParticles(dt);

    updateWeather(dt);

    updateSector();

    updateInteractionHint();

    checkBeacons();

    if (messageTimer > 0) {

        messageTimer -= dt;

        if (messageTimer <= 0) {

            const box =
                document.getElementById(
                    "messageBox"
                );

            if (box) {
                box.style.opacity = "0";
            }
        }
    }

    updateHUD();
}

/* =========================================================
   MAIN RENDER
   ========================================================= */

function render() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    renderBackground();

    renderProps();

    renderObjects();

    renderPickups();

    renderWalls();

    renderEnemies();

    renderBullets();

    renderPlayer();

    renderParticles();

    renderLighting();

    renderWeather();
}

/* =========================================================
   GAME LOOP
   ========================================================= */

function loop(now) {

    const dt =
        Math.min(
            (now - lastTime) / 1000,
            .033
        );

    lastTime = now;

    update(dt);

    render();

    requestAnimationFrame(loop);
}

/* =========================================================
   BUTTONS
   ========================================================= */

if (newGameButton) {

    newGameButton.addEventListener(
        "click",
        newGame
    );
}

if (loadGameButton) {

    loadGameButton.addEventListener(
        "click",
        () => {

            startAudio();

            continueGame();
        }
    );
}

if (achievementsButton) {

    achievementsButton.addEventListener(
        "click",
        () => {

            renderAchievementPanel();

            achievementsOverlay.style.display =
                "flex";
        }
    );
}

if (controlsButton) {

    controlsButton.addEventListener(
        "click",
        () => {

            controlsOverlay.style.display =
                "flex";
        }
    );
}

if (resumeButton) {

    resumeButton.addEventListener(
        "click",
        () => {

            state = "playing";

            pauseScreen.style.display =
                "none";

            canvas.focus();
        }
    );
}

if (saveButton) {

    saveButton.addEventListener(
        "click",
        () => {

            renderSaveSlots();

            saveOverlay.style.display =
                "flex";
        }
    );
}

if (quitButton) {

    quitButton.addEventListener(
        "click",
        () => {

            state = "menu";

            mouseDown = false;

            pauseScreen.style.display =
                "none";

            hud.style.display =
                "none";

            menu.style.display =
                "flex";

            hideAllOverlays();
        }
    );
}

if (closeMapButton) {

    closeMapButton.addEventListener(
        "click",
        () => {

            if (state === "map") {
                state = "playing";
            }

            mapScreen.style.display =
                "none";
        }
    );
}

/* =========================================================
   EXTRA BUTTONS
   ========================================================= */

document
    .getElementById(
        "closeAchievements"
    )
    ?.addEventListener(
        "click",
        () => {
            achievementsOverlay.style.display =
                "none";
        }
    );

document
    .getElementById(
        "closeControls"
    )
    ?.addEventListener(
        "click",
        () => {
            controlsOverlay.style.display =
                "none";
        }
    );

document
    .getElementById(
        "closeInventory"
    )
    ?.addEventListener(
        "click",
        () => {

            inventoryOverlay.style.display =
                "none";

            if (state === "inventory") {
                state = "playing";
            }
        }
    );

document
    .getElementById(
        "closeSaveSlots"
    )
    ?.addEventListener(
        "click",
        () => {

            saveOverlay.style.display =
                "none";
        }
    );

document
    .getElementById(
        "retryButton"
    )
    ?.addEventListener(
        "click",
        () => {

            document.getElementById(
                "gameOverOverlay"
            ).style.display =
                "none";

            newGame();
        }
    );

document
    .getElementById(
        "gameOverMenu"
    )
    ?.addEventListener(
        "click",
        () => {

            document.getElementById(
                "gameOverOverlay"
            ).style.display =
                "none";

            state = "menu";

            hud.style.display =
                "none";

            menu.style.display =
                "flex";
        }
    );

document
    .getElementById(
        "victoryMenu"
    )
    ?.addEventListener(
        "click",
        () => {

            document.getElementById(
                "victoryOverlay"
            ).style.display =
                "none";

            state = "menu";

            hud.style.display =
                "none";

            menu.style.display =
                "flex";
        }
    );

/* =========================================================
   STARTUP
   ========================================================= */

player = createPlayer();

buildWorld();

hud.style.display = "none";

menu.style.display = "flex";

renderAchievementPanel();

updateHUD();

requestAnimationFrame(loop);

/* =========================================================
   DEBUG SAFETY
   ========================================================= */

window.addEventListener(
    "error",
    event => {
        console.error(
            "EchoBound error:",
            event.error || event.message
        );
    }
);

window.addEventListener(
    "unhandledrejection",
    event => {
        console.error(
            "EchoBound promise error:",
            event.reason
        );
    }
);

})();
