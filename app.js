(() => {
    "use strict";

    // ============================================================
    // ECHOBOUND — THE LOST SIGNAL
    // Grote grafische/gameplay upgrade
    // ============================================================

    if (window.__ECHOboundLoaded) return;
    window.__ECHOboundLoaded = true;

    const canvas = document.getElementById("game");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    const mapCanvas = document.getElementById("mapCanvas");
    const mapCtx = mapCanvas ? mapCanvas.getContext("2d") : null;

    // ------------------------------------------------------------
    // CANVAS
    // ------------------------------------------------------------

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
            mapCanvas.width = 700;
            mapCanvas.height = 500;
        }
    }

    window.addEventListener("resize", resize);
    resize();

    // ------------------------------------------------------------
    // WORLD
    // ------------------------------------------------------------

    const WORLD_W = 2600;
    const WORLD_H = 2600;

    const walls = [
        { x: 220, y: 350, w: 520, h: 55 },
        { x: 850, y: 150, w: 55, h: 500 },
        { x: 1200, y: 300, w: 500, h: 55 },
        { x: 1850, y: 300, w: 55, h: 600 },

        { x: 450, y: 800, w: 55, h: 600 },
        { x: 700, y: 850, w: 550, h: 55 },
        { x: 1450, y: 700, w: 55, h: 500 },

        { x: 250, y: 1650, w: 700, h: 55 },
        { x: 1100, y: 1450, w: 55, h: 500 },
        { x: 1500, y: 1700, w: 600, h: 55 },
        { x: 2050, y: 1250, w: 55, h: 600 },

        { x: 1550, y: 1050, w: 300, h: 45 },
        { x: 950, y: 2150, w: 450, h: 45 },
        { x: 1700, y: 2150, w: 350, h: 45 },

        { x: 150, y: 1150, w: 200, h: 45 },
        { x: 2150, y: 600, w: 250, h: 45 }
    ];

    // ------------------------------------------------------------
    // SECTORS
    // ------------------------------------------------------------

    const sectors = [
        {
            name: "SECTOR 01 — OUTER RING",
            x: 0,
            y: 0,
            w: 850,
            h: 850
        },
        {
            name: "SECTOR 02 — INDUSTRIAL",
            x: 850,
            y: 0,
            w: 900,
            h: 900
        },
        {
            name: "SECTOR 03 — DEAD ZONE",
            x: 1750,
            y: 0,
            w: 850,
            h: 1100
        },
        {
            name: "SECTOR 04 — LOWER COMPLEX",
            x: 0,
            y: 850,
            w: 900,
            h: 1750
        },
        {
            name: "SECTOR 05 — CORE",
            x: 900,
            y: 900,
            w: 850,
            h: 850
        },
        {
            name: "SECTOR 06 — SIGNAL CORE",
            x: 1750,
            y: 1100,
            w: 850,
            h: 1500
        }
    ];

    function getSectorName(x, y) {
        for (const s of sectors) {
            if (
                x >= s.x &&
                x <= s.x + s.w &&
                y >= s.y &&
                y <= s.y + s.h
            ) {
                return s.name;
            }
        }

        return "UNKNOWN SECTOR";
    }

    // ------------------------------------------------------------
    // INPUT
    // ------------------------------------------------------------

    const keys = {};
    let mouseX = W / 2;
    let mouseY = H / 2;
    let mouseDown = false;

    window.addEventListener("keydown", e => {
        keys[e.code] = true;

        if (
            [
                "KeyW",
                "KeyA",
                "KeyS",
                "KeyD",
                "Space",
                "KeyM",
                "Escape"
            ].includes(e.code)
        ) {
            e.preventDefault();
        }

        if (e.code === "Escape") {
            if (game.running) togglePause();
        }

        if (e.code === "KeyM") {
            if (game.running) toggleMap();
        }

        if (e.code === "KeyR") {
            if (game.running) reload();
        }
    });

    window.addEventListener("keyup", e => {
        keys[e.code] = false;
    });

    window.addEventListener("blur", () => {
        mouseDown = false;

        for (const key in keys) {
            keys[key] = false;
        }
    });

    canvas.addEventListener("mousemove", e => {
        const rect = canvas.getBoundingClientRect();

        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener("mousedown", e => {
        if (e.button === 0) {
            mouseDown = true;

            if (game.running && !game.paused) {
                shoot();
            }
        }
    });

    window.addEventListener("mouseup", e => {
        if (e.button === 0) {
            mouseDown = false;
        }
    });

    // ------------------------------------------------------------
    // UTILITIES
    // ------------------------------------------------------------

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function distance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }

    function angleTo(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    function circleIntersectsRect(cx, cy, radius, r) {
        const closestX = clamp(cx, r.x, r.x + r.w);
        const closestY = clamp(cy, r.y, r.y + r.h);

        const dx = cx - closestX;
        const dy = cy - closestY;

        return dx * dx + dy * dy < radius * radius;
    }

    function isPositionFree(x, y, radius) {
        if (
            x - radius < 0 ||
            y - radius < 0 ||
            x + radius > WORLD_W ||
            y + radius > WORLD_H
        ) {
            return false;
        }

        for (const wall of walls) {
            if (circleIntersectsRect(x, y, radius, wall)) {
                return false;
            }
        }

        return true;
    }

    function lineIntersectsRect(x1, y1, x2, y2, rect) {
        let t0 = 0;
        let t1 = 1;

        const dx = x2 - x1;
        const dy = y2 - y1;

        const p = [-dx, dx, -dy, dy];
        const q = [
            x1 - rect.x,
            rect.x + rect.w - x1,
            y1 - rect.y,
            rect.y + rect.h - y1
        ];

        for (let i = 0; i < 4; i++) {
            if (p[i] === 0) {
                if (q[i] < 0) return false;
            } else {
                const r = q[i] / p[i];

                if (p[i] < 0) {
                    if (r > t1) return false;
                    if (r > t0) t0 = r;
                } else {
                    if (r < t0) return false;
                    if (r < t1) t1 = r;
                }
            }
        }

        return true;
    }

    function hasLineOfSight(x1, y1, x2, y2) {
        for (const wall of walls) {
            if (lineIntersectsRect(x1, y1, x2, y2, wall)) {
                return false;
            }
        }

        return true;
    }

    // ------------------------------------------------------------
    // SAVE DATA
    // ------------------------------------------------------------

    const SAVE_KEY = "echobound_save_v5";

    let achievements = {
        firstEcho: false,
        tenEchoes: false,
        firstSave: false,
        explorer: false,
        survivor: false,
        arsenal: false
    };

    function loadAchievements() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(SAVE_KEY + "_achievements")
            );

            if (saved) {
                achievements = {
                    ...achievements,
                    ...saved
                };
            }
        } catch (e) {
            console.warn("Achievement data could not be loaded.");
        }
    }

    function saveAchievements() {
        localStorage.setItem(
            SAVE_KEY + "_achievements",
            JSON.stringify(achievements)
        );
    }

    loadAchievements();

    // ------------------------------------------------------------
    // GAME STATE
    // ------------------------------------------------------------

    const game = {
        running: false,
        paused: false,
        gameOver: false,

        time: 0,

        kills: 0,
        credits: 0,

        distanceTravelled: 0,

        cameraX: 0,
        cameraY: 0,

        shake: 0,

        wave: 1,

        signalProgress: 0
    };

    const player = {
        x: 1300,
        y: 1300,

        radius: 18,

        speed: 3.1,

        health: 100,
        maxHealth: 100,

        energy: 100,
        maxEnergy: 100,

        angle: 0,

        weapon: "PULSE",

        ammo: 12,
        maxAmmo: 12,

        fireCooldown: 0,
        reloadTimer: 0,
        reloading: false,

        dashCooldown: 0,
        dashTimer: 0,

        invulnerable: 0
    };

    let enemies = [];
    let bullets = [];
    let enemyBullets = [];
    let particles = [];
    let pickups = [];
    let sparks = [];
    let decals = [];

    // ------------------------------------------------------------
    // WEAPONS
    // ------------------------------------------------------------

    const weapons = {
        PULSE: {
            name: "PULSE",
            damage: 25,
            fireRate: 180,
            bulletSpeed: 14,
            spread: 0.025,
            magazine: 12,
            color: "#72eaff"
        },

        BURST: {
            name: "BURST",
            damage: 16,
            fireRate: 260,
            bulletSpeed: 15,
            spread: 0.08,
            magazine: 24,
            color: "#ffe66b"
        },

        HEAVY: {
            name: "HEAVY",
            damage: 55,
            fireRate: 500,
            bulletSpeed: 12,
            spread: 0.018,
            magazine: 6,
            color: "#ff9c6b"
        }
    };

    function currentWeapon() {
        return weapons[player.weapon];
    }

    // ------------------------------------------------------------
    // ENEMIES
    // ------------------------------------------------------------

    const enemyTypes = {
        scout: {
            name: "SCOUT",
            radius: 15,
            speed: 1.45,
            health: 45,
            damage: 8,
            color: "#65ffb4",
            shootCooldown: 1700
        },

        hunter: {
            name: "HUNTER",
            radius: 20,
            speed: 1.05,
            health: 85,
            damage: 13,
            color: "#ffbd6e",
            shootCooldown: 1300
        },

        guardian: {
            name: "GUARDIAN",
            radius: 28,
            speed: 0.55,
            health: 190,
            damage: 20,
            color: "#ff6b83",
            shootCooldown: 2100
        }
    };

    function createEnemy(type, x, y) {
        const data = enemyTypes[type];

        return {
            type,

            x,
            y,

            radius: data.radius,

            speed: data.speed,

            health: data.health,
            maxHealth: data.health,

            damage: data.damage,

            color: data.color,

            shootCooldown: random(
                data.shootCooldown * 0.5,
                data.shootCooldown
            ),

            anim: random(0, Math.PI * 2),

            hitFlash: 0,

            strafe: Math.random() < 0.5 ? -1 : 1
        };
    }

    function spawnEnemy(type) {
        let x;
        let y;

        for (let tries = 0; tries < 100; tries++) {
            x = random(100, WORLD_W - 100);
            y = random(100, WORLD_H - 100);

            if (
                distance(x, y, player.x, player.y) > 550 &&
                isPositionFree(x, y, 35)
            ) {
                break;
            }
        }

        enemies.push(createEnemy(type, x, y));
    }

    function spawnWave() {
        const amount = 5 + Math.min(game.wave * 2, 18);

        for (let i = 0; i < amount; i++) {
            const roll = Math.random();

            let type = "scout";

            if (game.wave >= 2 && roll > 0.55) {
                type = "hunter";
            }

            if (game.wave >= 4 && roll > 0.87) {
                type = "guardian";
            }

            spawnEnemy(type);
        }
    }

    // ------------------------------------------------------------
    // PARTICLES
    // ------------------------------------------------------------

    function particle(x, y, vx, vy, life, size, color, gravity = 0) {
        particles.push({
            x,
            y,
            vx,
            vy,
            life,
            maxLife: life,
            size,
            color,
            gravity
        });
    }

    function muzzleFlash(x, y, angle, color) {
        for (let i = 0; i < 8; i++) {
            const a = angle + random(-0.45, 0.45);
            const speed = random(2, 7);

            particle(
                x,
                y,
                Math.cos(a) * speed,
                Math.sin(a) * speed,
                random(12, 22),
                random(2, 5),
                color
            );
        }

        game.shake = Math.min(game.shake + 2.5, 10);
    }

    function explosionEffect(x, y, color) {
        for (let i = 0; i < 25; i++) {
            const a = random(0, Math.PI * 2);
            const speed = random(1, 6);

            particle(
                x,
                y,
                Math.cos(a) * speed,
                Math.sin(a) * speed,
                random(20, 45),
                random(2, 6),
                color
            );
        }
    }

    // ------------------------------------------------------------
    // START / NEW GAME
    // ------------------------------------------------------------

    function resetPlayer() {
        player.x = 1300;
        player.y = 1300;

        player.health = player.maxHealth;
        player.energy = player.maxEnergy;

        player.angle = 0;

        player.weapon = "PULSE";

        player.ammo = weapons.PULSE.magazine;
        player.maxAmmo = weapons.PULSE.magazine;

        player.fireCooldown = 0;
        player.reloadTimer = 0;
        player.reloading = false;

        player.dashCooldown = 0;
        player.dashTimer = 0;

        player.invulnerable = 0;
    }

    function startNewGame() {
        hideAllScreens();

        resetPlayer();

        enemies = [];
        bullets = [];
        enemyBullets = [];
        particles = [];
        pickups = [];
        sparks = [];
        decals = [];

        game.running = true;
        game.paused = false;
        game.gameOver = false;

        game.time = 0;
        game.kills = 0;
        game.credits = 0;

        game.distanceTravelled = 0;

        game.wave = 1;
        game.signalProgress = 0;

        game.cameraX = player.x - W / 2;
        game.cameraY = player.y - H / 2;

        spawnWave();

        updateHUD();
    }

    // ------------------------------------------------------------
    // SAVE / LOAD
    // ------------------------------------------------------------

    function saveGame() {
        const data = {
            version: 5,

            player: {
                x: player.x,
                y: player.y,

                health: player.health,
                energy: player.energy,

                weapon: player.weapon,

                ammo: player.ammo
            },

            game: {
                kills: game.kills,
                credits: game.credits,
                distanceTravelled: game.distanceTravelled,
                wave: game.wave,
                signalProgress: game.signalProgress
            }
        };

        localStorage.setItem(SAVE_KEY, JSON.stringify(data));

        achievements.firstSave = true;
        saveAchievements();

        showToast("RUN SAVED", "Your progress has been saved.");

        updateHUD();
    }

    function loadGame() {
        const raw = localStorage.getItem(SAVE_KEY);

        if (!raw) {
            showToast("NO SAVE FOUND", "Start a new run first.");
            return;
        }

        try {
            const data = JSON.parse(raw);

            resetPlayer();

            if (data.player) {
                player.x = Number(data.player.x) || 1300;
                player.y = Number(data.player.y) || 1300;

                player.health = clamp(
                    Number(data.player.health) || 100,
                    1,
                    100
                );

                player.energy = clamp(
                    Number(data.player.energy) || 100,
                    0,
                    100
                );

                if (weapons[data.player.weapon]) {
                    player.weapon = data.player.weapon;
                }

                player.maxAmmo = weapons[player.weapon].magazine;

                player.ammo = clamp(
                    Number(data.player.ammo) || player.maxAmmo,
                    0,
                    player.maxAmmo
                );
            }

            if (data.game) {
                game.kills = Number(data.game.kills) || 0;
                game.credits = Number(data.game.credits) || 0;
                game.distanceTravelled =
                    Number(data.game.distanceTravelled) || 0;
                game.wave = Math.max(1, Number(data.game.wave) || 1);
                game.signalProgress =
                    Number(data.game.signalProgress) || 0;
            }

            enemies = [];
            bullets = [];
            enemyBullets = [];
            particles = [];
            pickups = [];
            sparks = [];
            decals = [];

            spawnWave();

            game.running = true;
            game.paused = false;
            game.gameOver = false;

            updateHUD();

            hideAllScreens();

            showToast("RUN LOADED", "Your saved run has been restored.");
        } catch (error) {
            console.error(error);

            showToast(
                "SAVE ERROR",
                "The save data could not be loaded."
            );
        }
    }

    // ------------------------------------------------------------
    // ACHIEVEMENTS
    // ------------------------------------------------------------

    const achievementInfo = [
        {
            id: "firstEcho",
            title: "FIRST ECHO",
            description: "Defeat your first enemy."
        },

        {
            id: "tenEchoes",
            title: "TEN ECHOES",
            description: "Defeat 10 enemies."
        },

        {
            id: "firstSave",
            title: "SAFE SIGNAL",
            description: "Save your first run."
        },

        {
            id: "explorer",
            title: "EXPLORER",
            description: "Travel 5000 world units."
        },

        {
            id: "survivor",
            title: "SURVIVOR",
            description: "Reach wave 5."
        },

        {
            id: "arsenal",
            title: "FULL ARSENAL",
            description: "Use every weapon."
        }
    ];

    function unlockAchievement(id) {
        if (!achievements[id]) {
            achievements[id] = true;

            saveAchievements();

            const info = achievementInfo.find(a => a.id === id);

            if (info) {
                showAchievementPopup(info.title);
            }
        }
    }

    function checkAchievements() {
        if (game.kills >= 1) {
            unlockAchievement("firstEcho");
        }

        if (game.kills >= 10) {
            unlockAchievement("tenEchoes");
        }

        if (game.distanceTravelled >= 5000) {
            unlockAchievement("explorer");
        }

        if (game.wave >= 5) {
            unlockAchievement("survivor");
        }
    }

    function ensureAchievementScreen() {
        if (document.getElementById("achievementScreen")) return;

        const style = document.createElement("style");

        style.textContent = `
            #achievementScreen {
                position: fixed;
                inset: 0;
                z-index: 700;
                display: none;
                align-items: center;
                justify-content: center;
                background:
                    radial-gradient(circle at center,
                    rgba(30,100,130,.18),
                    rgba(2,5,10,.96) 70%);
                backdrop-filter: blur(12px);
                font-family: Arial, sans-serif;
            }

            #achievementScreen.open {
                display: flex;
            }

            .achievementPanel {
                width: min(900px, 92vw);
                max-height: 85vh;
                overflow: auto;
                padding: 32px;
                border: 1px solid rgba(100,230,255,.35);
                background:
                    linear-gradient(
                        135deg,
                        rgba(10,20,28,.96),
                        rgba(4,8,14,.98)
                    );
                box-shadow:
                    0 0 60px rgba(0,210,255,.12),
                    inset 0 0 40px rgba(255,255,255,.025);
            }

            .achievementHeader {
                display:flex;
                justify-content:space-between;
                align-items:center;
                color:#6cecff;
                letter-spacing:4px;
                font-size:12px;
            }

            .achievementHeader button {
                border:1px solid rgba(100,230,255,.35);
                background:rgba(0,0,0,.3);
                color:#8eeeff;
                padding:9px 16px;
                cursor:pointer;
            }

            .achievementPanel h2 {
                margin:25px 0;
                color:white;
                font-size:34px;
                letter-spacing:7px;
            }

            .achievementGrid {
                display:grid;
                grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
                gap:14px;
            }

            .achievementCard {
                position:relative;
                padding:20px;
                min-height:115px;
                border:1px solid rgba(255,255,255,.08);
                background:rgba(255,255,255,.025);
            }

            .achievementCard.unlocked {
                border-color:rgba(70,240,200,.45);
                background:rgba(30,150,130,.08);
                box-shadow:inset 0 0 30px rgba(50,230,200,.04);
            }

            .achievementCard h3 {
                margin:0 0 9px;
                color:white;
                letter-spacing:2px;
            }

            .achievementCard p {
                margin:0;
                color:#81909b;
                font-size:13px;
                line-height:1.5;
            }

            .achievementStatus {
                position:absolute;
                right:15px;
                top:15px;
                font-size:10px;
                letter-spacing:2px;
                color:#4d5960;
            }

            .achievementCard.unlocked .achievementStatus {
                color:#56f5c4;
            }

            #infoOverlay {
                position:fixed;
                inset:0;
                z-index:710;
                display:none;
                align-items:center;
                justify-content:center;
                background:rgba(0,0,0,.82);
                backdrop-filter:blur(8px);
                font-family:Arial,sans-serif;
            }

            #infoOverlay.open {
                display:flex;
            }

            .infoPanel {
                width:min(600px,90vw);
                padding:35px;
                border:1px solid rgba(100,230,255,.3);
                background:#071017;
                color:white;
            }

            .infoPanel h2 {
                margin-top:0;
                color:#70eaff;
                letter-spacing:5px;
            }

            .controlRow {
                display:flex;
                justify-content:space-between;
                padding:13px 0;
                border-bottom:1px solid rgba(255,255,255,.06);
            }

            .controlKey {
                color:#fff;
            }

            .controlDesc {
                color:#78909b;
            }

            .infoClose {
                margin-top:25px;
                padding:12px 20px;
                background:transparent;
                border:1px solid #5edff7;
                color:#5edff7;
                cursor:pointer;
            }

            #gameOverScreen {
                position:fixed;
                inset:0;
                z-index:720;
                display:none;
                align-items:center;
                justify-content:center;
                background:
                    radial-gradient(circle,
                    rgba(90,20,30,.2),
                    rgba(2,4,7,.97) 70%);
                font-family:Arial,sans-serif;
            }

            #gameOverScreen.open {
                display:flex;
            }

            .gameOverPanel {
                width:min(600px,90vw);
                text-align:center;
                padding:45px;
                border:1px solid rgba(255,100,120,.3);
                background:rgba(5,9,14,.96);
                box-shadow:0 0 80px rgba(255,40,70,.08);
            }

            .gameOverPanel .small {
                color:#ff7187;
                letter-spacing:5px;
                font-size:11px;
            }

            .gameOverPanel h2 {
                color:white;
                font-size:52px;
                letter-spacing:8px;
                margin:15px 0 25px;
            }

            .gameStats {
                display:grid;
                grid-template-columns:repeat(2,1fr);
                gap:10px;
                margin-bottom:25px;
            }

            .gameStat {
                padding:15px;
                background:rgba(255,255,255,.035);
            }

            .gameStat span {
                display:block;
                color:#68757e;
                font-size:10px;
                letter-spacing:2px;
            }

            .gameStat strong {
                display:block;
                margin-top:6px;
                color:white;
                font-size:20px;
            }

            .gameButtons {
                display:flex;
                gap:10px;
                justify-content:center;
                flex-wrap:wrap;
            }

            .gameButtons button {
                padding:13px 20px;
                cursor:pointer;
                background:#0c1820;
                color:#9aefff;
                border:1px solid rgba(100,230,255,.35);
            }

            .gameButtons button:hover {
                background:#132b36;
            }

            #toast {
                position:fixed;
                left:50%;
                bottom:45px;
                transform:translate(-50%,30px);
                z-index:800;
                padding:15px 24px;
                min-width:240px;
                text-align:center;
                background:rgba(4,10,15,.95);
                border:1px solid rgba(100,230,255,.35);
                color:white;
                opacity:0;
                pointer-events:none;
                transition:.25s ease;
                font-family:Arial,sans-serif;
            }

            #toast.show {
                opacity:1;
                transform:translate(-50%,0);
            }

            .toastTitle {
                color:#70eaff;
                letter-spacing:3px;
                font-size:11px;
                margin-bottom:5px;
            }

            .toastText {
                color:#9aaab3;
                font-size:12px;
            }
        `;

        document.head.appendChild(style);

        const overlay = document.createElement("div");

        overlay.id = "achievementScreen";

        overlay.innerHTML = `
            <div class="achievementPanel">
                <div class="achievementHeader">
                    <span>ECHObound // DATABASE</span>
                    <button id="achievementClose">CLOSE</button>
                </div>

                <h2>ACHIEVEMENTS</h2>

                <div id="achievementList" class="achievementGrid"></div>
            </div>
        `;

        document.body.appendChild(overlay);

        document
            .getElementById("achievementClose")
            .addEventListener("click", closeAchievements);
    }

    function showAchievements() {
        ensureAchievementScreen();

        const screen = document.getElementById("achievementScreen");
        const list = document.getElementById("achievementList");

        list.innerHTML = "";

        for (const info of achievementInfo) {
            const unlocked = achievements[info.id];

            const card = document.createElement("div");

            card.className =
                "achievementCard" +
                (unlocked ? " unlocked" : "");

            card.innerHTML = `
                <div class="achievementStatus">
                    ${unlocked ? "UNLOCKED" : "LOCKED"}
                </div>

                <h3>${info.title}</h3>
                <p>${info.description}</p>
            `;

            list.appendChild(card);
        }

        screen.classList.add("open");
    }

    function closeAchievements() {
        const screen = document.getElementById("achievementScreen");

        if (screen) {
            screen.classList.remove("open");
        }
    }

    // ------------------------------------------------------------
    // CONTROLS SCREEN
    // ------------------------------------------------------------

    function showControls() {
        if (document.getElementById("infoOverlay")) {
            document.getElementById("infoOverlay").classList.add("open");
            return;
        }

        const overlay = document.createElement("div");

        overlay.id = "infoOverlay";

        overlay.innerHTML = `
            <div class="infoPanel">
                <h2>CONTROLS</h2>

                <div class="controlRow">
                    <span class="controlKey">W A S D</span>
                    <span class="controlDesc">MOVE</span>
                </div>

                <div class="controlRow">
                    <span class="controlKey">MOUSE</span>
                    <span class="controlDesc">AIM</span>
                </div>

                <div class="controlRow">
                    <span class="controlKey">LEFT CLICK</span>
                    <span class="controlDesc">SHOOT</span>
                </div>

                <div class="controlRow">
                    <span class="controlKey">R</span>
                    <span class="controlDesc">RELOAD</span>
                </div>

                <div class="controlRow">
                    <span class="controlKey">SPACE</span>
                    <span class="controlDesc">DASH</span>
                </div>

                <div class="controlRow">
                    <span class="controlKey">M</span>
                    <span class="controlDesc">MAP</span>
                </div>

                <div class="controlRow">
                    <span class="controlKey">ESC</span>
                    <span class="controlDesc">PAUSE</span>
                </div>

                <button class="infoClose" id="infoClose">
                    CLOSE
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.classList.add("open");

        document
            .getElementById("infoClose")
            .addEventListener("click", () => {
                overlay.classList.remove("open");
            });
    }

    // ------------------------------------------------------------
    // TOAST
    // ------------------------------------------------------------

    function showToast(title, text) {
        let toast = document.getElementById("toast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";

            toast.innerHTML = `
                <div class="toastTitle"></div>
                <div class="toastText"></div>
            `;

            document.body.appendChild(toast);
        }

        toast.querySelector(".toastTitle").textContent = title;
        toast.querySelector(".toastText").textContent = text;

        toast.classList.add("show");

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2200);
    }

    function showAchievementPopup(name) {
        const box = document.getElementById("achievement");

        if (!box) return;

        const nameEl = document.getElementById("achievementName");

        if (nameEl) {
            nameEl.textContent = name;
        }

        box.style.display = "block";

        clearTimeout(showAchievementPopup.timer);

        showAchievementPopup.timer = setTimeout(() => {
            box.style.display = "none";
        }, 3000);
    }

    // ------------------------------------------------------------
    // SHOOTING
    // ------------------------------------------------------------

    function shoot() {
        if (!game.running || game.paused || game.gameOver) {
            return;
        }

        if (player.reloading) return;

        const weapon = currentWeapon();

        if (player.fireCooldown > 0) return;

        if (player.ammo <= 0) {
            reload();
            return;
        }

        const angle = player.angle + random(
            -weapon.spread,
            weapon.spread
        );

        const startX =
            player.x +
            Math.cos(angle) * 27;

        const startY =
            player.y +
            Math.sin(angle) * 27;

        bullets.push({
            x: startX,
            y: startY,

            px: startX,
            py: startY,

            vx: Math.cos(angle) * weapon.bulletSpeed,
            vy: Math.sin(angle) * weapon.bulletSpeed,

            damage: weapon.damage,

            life: 90,

            color: weapon.color,

            size: weapon.name === "HEAVY" ? 4 : 2
        });

        player.ammo--;

        player.fireCooldown = weapon.fireRate;

        muzzleFlash(
            startX,
            startY,
            angle,
            weapon.color
        );

        if (player.ammo <= 0) {
            reload();
        }
    }

    function reload() {
        if (player.reloading) return;

        const weapon = currentWeapon();

        if (player.ammo >= weapon.magazine) return;

        player.reloading = true;
        player.reloadTimer = 850;
    }

    function updateReload(dt) {
        if (!player.reloading) return;

        player.reloadTimer -= dt;

        if (player.reloadTimer <= 0) {
            const weapon = currentWeapon();

            player.ammo = weapon.magazine;
            player.reloading = false;
        }
    }

    // ------------------------------------------------------------
    // DASH
    // ------------------------------------------------------------

    function dash() {
        if (
            player.dashCooldown > 0 ||
            player.energy < 25 ||
            player.dashTimer > 0
        ) {
            return;
        }

        let dx = 0;
        let dy = 0;

        if (keys.KeyW) dy -= 1;
        if (keys.KeyS) dy += 1;
        if (keys.KeyA) dx -= 1;
        if (keys.KeyD) dx += 1;

        if (dx === 0 && dy === 0) {
            dx = Math.cos(player.angle);
            dy = Math.sin(player.angle);
        } else {
            const length = Math.hypot(dx, dy);

            dx /= length;
            dy /= length;
        }

        for (let i = 0; i < 14; i++) {
            const t = i / 14;

            particle(
                player.x,
                player.y,
                -dx * random(1, 3),
                -dy * random(1, 3),
                random(12, 25),
                random(2, 5),
                "#6eeaff"
            );
        }

        const oldX = player.x;
        const oldY = player.y;

        const dashDistance = 130;

        const newX = player.x + dx * dashDistance;
        const newY = player.y + dy * dashDistance;

        if (isPositionFree(newX, newY, player.radius)) {
            player.x = newX;
            player.y = newY;
        } else {
            player.x = oldX + dx * 45;
            player.y = oldY + dy * 45;
        }

        player.energy -= 25;
        player.dashCooldown = 900;
        player.invulnerable = 250;

        game.shake = 5;
    }

    // ------------------------------------------------------------
    // PLAYER
    // ------------------------------------------------------------

    let previousPlayerX = player.x;
    let previousPlayerY = player.y;

    function updatePlayer(dt) {
        if (player.fireCooldown > 0) {
            player.fireCooldown -= dt;
        }

        if (player.dashCooldown > 0) {
            player.dashCooldown -= dt;
        }

        if (player.invulnerable > 0) {
            player.invulnerable -= dt;
        }

        player.energy = Math.min(
            player.maxEnergy,
            player.energy + dt * 0.015
        );

        if (keys.Space) {
            dash();
            keys.Space = false;
        }

        let dx = 0;
        let dy = 0;

        if (keys.KeyW) dy -= 1;
        if (keys.KeyS) dy += 1;
        if (keys.KeyA) dx -= 1;
        if (keys.KeyD) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);

            dx /= len;
            dy /= len;

            const speed = player.speed * (dt / 16.67);

            const oldX = player.x;
            const oldY = player.y;

            const nx = player.x + dx * speed;
            const ny = player.y + dy * speed;

            if (isPositionFree(nx, player.y, player.radius)) {
                player.x = nx;
            }

            if (isPositionFree(player.x, ny, player.radius)) {
                player.y = ny;
            }

            const moved = distance(
                oldX,
                oldY,
                player.x,
                player.y
            );

            game.distanceTravelled += moved;
        }

        const worldMouseX =
            mouseX +
            game.cameraX;

        const worldMouseY =
            mouseY +
            game.cameraY;

        player.angle = angleTo(
            player.x,
            player.y,
            worldMouseX,
            worldMouseY
        );

        if (mouseDown) {
            shoot();
        }

        updateReload(dt);

        previousPlayerX = player.x;
        previousPlayerY = player.y;
    }

    // ------------------------------------------------------------
    // PLAYER DAMAGE
    // ------------------------------------------------------------

    function damagePlayer(amount) {
        if (player.invulnerable > 0) return;

        player.health -= amount;

        player.invulnerable = 400;

        game.shake = 8;

        for (let i = 0; i < 12; i++) {
            particle(
                player.x,
                player.y,
                random(-3, 3),
                random(-3, 3),
                random(15, 30),
                random(2, 5),
                "#ffad66"
            );
        }

        if (player.health <= 0) {
            player.health = 0;

            endGame();
        }
    }

    // ------------------------------------------------------------
    // BULLETS
    // ------------------------------------------------------------

    function updateBullets(dt) {
        const factor = dt / 16.67;

        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];

            b.px = b.x;
            b.py = b.y;

            b.x += b.vx * factor;
            b.y += b.vy * factor;

            b.life -= factor;

            let remove = false;

            for (const wall of walls) {
                if (
                    lineIntersectsRect(
                        b.px,
                        b.py,
                        b.x,
                        b.y,
                        wall
                    )
                ) {
                    remove = true;

                    for (let s = 0; s < 7; s++) {
                        particle(
                            b.x,
                            b.y,
                            random(-2, 2),
                            random(-2, 2),
                            random(10, 25),
                            random(1, 3),
                            "#c9e5e8"
                        );
                    }

                    break;
                }
            }

            if (!remove) {
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const enemy = enemies[j];

                    if (
                        distance(
                            b.x,
                            b.y,
                            enemy.x,
                            enemy.y
                        ) <
                        enemy.radius + b.size
                    ) {
                        enemy.health -= b.damage;

                        enemy.hitFlash = 100;

                        for (let s = 0; s < 8; s++) {
                            particle(
                                b.x,
                                b.y,
                                random(-2.5, 2.5),
                                random(-2.5, 2.5),
                                random(12, 26),
                                random(1, 4),
                                "#ffe17a"
                            );
                        }

                        remove = true;

                        if (enemy.health <= 0) {
                            killEnemy(j);
                        }

                        break;
                    }
                }
            }

            if (
                b.life <= 0 ||
                b.x < 0 ||
                b.y < 0 ||
                b.x > WORLD_W ||
                b.y > WORLD_H
            ) {
                remove = true;
            }

            if (remove) {
                bullets.splice(i, 1);
            }
        }
    }

    function updateEnemyBullets(dt) {
        const factor = dt / 16.67;

        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];

            b.x += b.vx * factor;
            b.y += b.vy * factor;

            b.life -= factor;

            let remove = false;

            for (const wall of walls) {
                if (circleIntersectsRect(b.x, b.y, 3, wall)) {
                    remove = true;

                    for (let s = 0; s < 6; s++) {
                        particle(
                            b.x,
                            b.y,
                            random(-1.5, 1.5),
                            random(-1.5, 1.5),
                            random(10, 22),
                            random(1, 3),
                            "#ffba7a"
                        );
                    }

                    break;
                }
            }

            if (
                !remove &&
                distance(b.x, b.y, player.x, player.y) <
                    player.radius + 5
            ) {
                damagePlayer(b.damage);

                remove = true;
            }

            if (b.life <= 0) {
                remove = true;
            }

            if (remove) {
                enemyBullets.splice(i, 1);
            }
        }
    }

    // ------------------------------------------------------------
    // ENEMIES
    // ------------------------------------------------------------

    function updateEnemies(dt) {
        const factor = dt / 16.67;

        for (const enemy of enemies) {
            enemy.anim += dt * 0.004;

            if (enemy.hitFlash > 0) {
                enemy.hitFlash -= dt;
            }

            const dist = distance(
                enemy.x,
                enemy.y,
                player.x,
                player.y
            );

            if (dist > 190) {
                let dx =
                    (player.x - enemy.x) /
                    Math.max(dist, 1);

                let dy =
                    (player.y - enemy.y) /
                    Math.max(dist, 1);

                if (
                    enemy.type === "hunter" &&
                    dist < 500
                ) {
                    const sideX = -dy * enemy.strafe;
                    const sideY = dx * enemy.strafe;

                    dx =
                        dx * 0.7 +
                        sideX * 0.3;

                    dy =
                        dy * 0.7 +
                        sideY * 0.3;
                }

                const nx =
                    enemy.x +
                    dx *
                        enemy.speed *
                        factor;

                const ny =
                    enemy.y +
                    dy *
                        enemy.speed *
                        factor;

                if (
                    isPositionFree(
                        nx,
                        enemy.y,
                        enemy.radius
                    )
                ) {
                    enemy.x = nx;
                } else {
                    enemy.strafe *= -1;
                }

                if (
                    isPositionFree(
                        enemy.x,
                        ny,
                        enemy.radius
                    )
                ) {
                    enemy.y = ny;
                }
            }

            enemy.shootCooldown -= dt;

            if (
                enemy.shootCooldown <= 0 &&
                dist < 700 &&
                hasLineOfSight(
                    enemy.x,
                    enemy.y,
                    player.x,
                    player.y
                )
            ) {
                enemyShoot(enemy);

                const base =
                    enemyTypes[enemy.type]
                        .shootCooldown;

                enemy.shootCooldown =
                    random(base * 0.7, base * 1.3);
            }

            if (
                dist <
                enemy.radius +
                    player.radius +
                    3
            ) {
                damagePlayer(
                    enemy.damage * 0.012 * dt
                );
            }
        }
    }

    function enemyShoot(enemy) {
        const angle = angleTo(
            enemy.x,
            enemy.y,
            player.x,
            player.y
        );

        const spread =
            enemy.type === "scout"
                ? 0.09
                : enemy.type === "hunter"
                ? 0.045
                : 0.025;

        const finalAngle =
            angle + random(-spread, spread);

        enemyBullets.push({
            x: enemy.x,
            y: enemy.y,

            vx: Math.cos(finalAngle) *
                (enemy.type === "guardian"
                    ? 4
                    : 5),

            vy: Math.sin(finalAngle) *
                (enemy.type === "guardian"
                    ? 4
                    : 5),

            damage: enemy.damage,

            life: 150,

            color: enemy.color
        });

        for (let i = 0; i < 4; i++) {
            particle(
                enemy.x,
                enemy.y,
                random(-1.5, 1.5),
                random(-1.5, 1.5),
                random(8, 18),
                random(1, 3),
                enemy.color
            );
        }
    }

    function killEnemy(index) {
        const enemy = enemies[index];

        if (!enemy) return;

        game.kills++;

        game.credits +=
            enemy.type === "guardian"
                ? 50
                : enemy.type === "hunter"
                ? 25
                : 15;

        explosionEffect(
            enemy.x,
            enemy.y,
            enemy.color
        );

        decals.push({
            x: enemy.x,
            y: enemy.y,
            radius: enemy.radius * 1.7,
            alpha: 0.25
        });

        if (Math.random() < 0.28) {
            pickups.push({
                x: enemy.x,
                y: enemy.y,
                type:
                    Math.random() < 0.55
                        ? "energy"
                        : "credits",

                pulse: random(0, Math.PI * 2)
            });
        }

        enemies.splice(index, 1);

        checkAchievements();

        if (enemies.length === 0) {
            game.wave++;

            game.signalProgress += 15;

            spawnWave();
        }
    }

    // ------------------------------------------------------------
    // PICKUPS
    // ------------------------------------------------------------

    function updatePickups(dt) {
        for (let i = pickups.length - 1; i >= 0; i--) {
            const p = pickups[i];

            p.pulse += dt * 0.005;

            const dist = distance(
                p.x,
                p.y,
                player.x,
                player.y
            );

            if (dist < 70) {
                const a = angleTo(
                    p.x,
                    p.y,
                    player.x,
                    player.y
                );

                p.x += Math.cos(a) * 2;
                p.y += Math.sin(a) * 2;
            }

            if (dist < 24) {
                if (p.type === "energy") {
                    player.energy = Math.min(
                        player.maxEnergy,
                        player.energy + 35
                    );
                } else {
                    game.credits += 30;
                }

                for (let s = 0; s < 10; s++) {
                    particle(
                        p.x,
                        p.y,
                        random(-2, 2),
                        random(-2, 2),
                        random(15, 30),
                        random(1, 4),
                        p.type === "energy"
                            ? "#62eaff"
                            : "#ffe36e"
                    );
                }

                pickups.splice(i, 1);
            }
        }
    }

    // ------------------------------------------------------------
    // PARTICLE UPDATE
    // ------------------------------------------------------------

    function updateParticles(dt) {
        const factor = dt / 16.67;

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];

            p.x += p.vx * factor;
            p.y += p.vy * factor;

            p.vy += p.gravity * factor;

            p.life -= factor;

            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }

        for (let i = decals.length - 1; i >= 0; i--) {
            decals[i].alpha -= dt * 0.00002;

            if (decals[i].alpha <= 0) {
                decals.splice(i, 1);
            }
        }
    }

    // ------------------------------------------------------------
    // CAMERA
    // ------------------------------------------------------------

    function updateCamera() {
        const targetX =
            player.x - W / 2;

        const targetY =
            player.y - H / 2;

        game.cameraX +=
            (targetX - game.cameraX) * 0.12;

        game.cameraY +=
            (targetY - game.cameraY) * 0.12;

        game.cameraX = clamp(
            game.cameraX,
            0,
            Math.max(0, WORLD_W - W)
        );

        game.cameraY = clamp(
            game.cameraY,
            0,
            Math.max(0, WORLD_H - H)
        );
    }

    // ------------------------------------------------------------
    // DRAWING
    // ------------------------------------------------------------

    function drawBackground() {
        ctx.fillStyle = "#05090d";
        ctx.fillRect(0, 0, W, H);

        const startX =
            Math.floor(game.cameraX / 80) * 80;

        const startY =
            Math.floor(game.cameraY / 80) * 80;

        for (
            let x = startX;
            x < game.cameraX + W + 80;
            x += 80
        ) {
            for (
                let y = startY;
                y < game.cameraY + H + 80;
                y += 80
            ) {
                const sx =
                    x - game.cameraX;

                const sy =
                    y - game.cameraY;

                const noise =
                    Math.sin(x * 0.02) *
                    Math.cos(y * 0.015);

                const brightness =
                    9 + noise * 2;

                ctx.fillStyle =
                    `rgb(${brightness},${brightness + 3},${brightness + 6})`;

                ctx.fillRect(
                    sx,
                    sy,
                    80,
                    80
                );

                ctx.strokeStyle =
                    "rgba(110,150,160,.035)";

                ctx.strokeRect(
                    sx,
                    sy,
                    80,
                    80
                );
            }
        }

        // Subtle floor lines
        ctx.lineWidth = 1;

        ctx.strokeStyle =
            "rgba(100,220,240,.025)";

        for (
            let x = -(
                game.cameraX % 160
            );
            x < W;
            x += 160
        ) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }

        for (
            let y = -(
                game.cameraY % 160
            );
            y < H;
            y += 160
        ) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
    }

    function drawDecals() {
        for (const d of decals) {
            const x =
                d.x - game.cameraX;

            const y =
                d.y - game.cameraY;

            ctx.save();

            ctx.globalAlpha = d.alpha;

            const gradient =
                ctx.createRadialGradient(
                    x,
                    y,
                    0,
                    x,
                    y,
                    d.radius
                );

            gradient.addColorStop(
                0,
                "#6b7780"
            );

            gradient.addColorStop(
                1,
                "transparent"
            );

            ctx.fillStyle = gradient;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                d.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();
        }
    }

    function drawWalls() {
        for (const wall of walls) {
            const x =
                wall.x - game.cameraX;

            const y =
                wall.y - game.cameraY;

            if (
                x > W ||
                y > H ||
                x + wall.w < 0 ||
                y + wall.h < 0
            ) {
                continue;
            }

            // Shadow
            ctx.fillStyle =
                "rgba(0,0,0,.55)";

            ctx.fillRect(
                x + 8,
                y + 10,
                wall.w,
                wall.h
            );

            // Main wall
            const gradient =
                ctx.createLinearGradient(
                    x,
                    y,
                    x,
                    y + wall.h
                );

            gradient.addColorStop(
                0,
                "#34424a"
            );

            gradient.addColorStop(
                0.45,
                "#1b252c"
            );

            gradient.addColorStop(
                1,
                "#0e151a"
            );

            ctx.fillStyle = gradient;

            ctx.fillRect(
                x,
                y,
                wall.w,
                wall.h
            );

            // Top edge
            ctx.fillStyle =
                "rgba(130,230,240,.18)";

            ctx.fillRect(
                x,
                y,
                wall.w,
                2
            );

            // Technical panels
            if (wall.w > 100) {
                ctx.strokeStyle =
                    "rgba(160,210,220,.08)";

                for (
                    let px = x + 25;
                    px < x + wall.w;
                    px += 65
                ) {
                    ctx.beginPath();

                    ctx.moveTo(
                        px,
                        y + 7
                    );

                    ctx.lineTo(
                        px,
                        y + wall.h - 7
                    );

                    ctx.stroke();
                }
            }
        }
    }

    function drawPickups() {
        for (const p of pickups) {
            const x =
                p.x - game.cameraX;

            const y =
                p.y - game.cameraY;

            const pulse =
                Math.sin(p.pulse) * 3;

            const color =
                p.type === "energy"
                    ? "#63eaff"
                    : "#ffe16a";

            ctx.save();

            ctx.shadowBlur = 18;
            ctx.shadowColor = color;

            ctx.fillStyle = color;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                7 + pulse,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();

            ctx.strokeStyle =
                "rgba(255,255,255,.5)";

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                12 + pulse,
                0,
                Math.PI * 2
            );

            ctx.stroke();
        }
    }

    function drawBullets() {
        for (const b of bullets) {
            const x =
                b.x - game.cameraX;

            const y =
                b.y - game.cameraY;

            const tailX =
                x - b.vx * 0.7;

            const tailY =
                y - b.vy * 0.7;

            ctx.save();

            ctx.lineWidth =
                b.size;

            ctx.lineCap = "round";

            ctx.shadowBlur = 12;
            ctx.shadowColor = b.color;

            ctx.strokeStyle = b.color;

            ctx.beginPath();

            ctx.moveTo(tailX, tailY);
            ctx.lineTo(x, y);

            ctx.stroke();

            ctx.restore();
        }

        for (const b of enemyBullets) {
            const x =
                b.x - game.cameraX;

            const y =
                b.y - game.cameraY;

            ctx.save();

            ctx.shadowBlur = 12;
            ctx.shadowColor = b.color;

            ctx.fillStyle = b.color;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                4,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();
        }
    }

    function drawPlayer() {
        const x =
            player.x - game.cameraX;

        const y =
            player.y - game.cameraY;

        ctx.save();

        if (
            player.invulnerable > 0 &&
            Math.floor(
                player.invulnerable / 70
            ) %
                2 ===
                0
        ) {
            ctx.globalAlpha = 0.45;
        }

        // Light around player
        const glow =
            ctx.createRadialGradient(
                x,
                y,
                0,
                x,
                y,
                140
            );

        glow.addColorStop(
            0,
            "rgba(70,220,255,.12)"
        );

        glow.addColorStop(
            1,
            "rgba(70,220,255,0)"
        );

        ctx.fillStyle = glow;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            140,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Shadow
        ctx.fillStyle =
            "rgba(0,0,0,.65)";

        ctx.beginPath();

        ctx.ellipse(
            x,
            y + 12,
            25,
            10,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Body
        const body =
            ctx.createRadialGradient(
                x - 6,
                y - 8,
                2,
                x,
                y,
                25
            );

        body.addColorStop(
            0,
            "#9fd9e4"
        );

        body.addColorStop(
            0.35,
            "#42636d"
        );

        body.addColorStop(
            1,
            "#101c22"
        );

        ctx.fillStyle = body;

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
            "#75eaff";

        ctx.lineWidth = 1.5;

        ctx.stroke();

        // Direction
        const weaponX =
            x +
            Math.cos(player.angle) *
                29;

        const weaponY =
            y +
            Math.sin(player.angle) *
                29;

        ctx.strokeStyle =
            "#d7faff";

        ctx.lineWidth = 7;

        ctx.lineCap = "round";

        ctx.beginPath();

        ctx.moveTo(
            x +
                Math.cos(player.angle) *
                    7,
            y +
                Math.sin(player.angle) *
                    7
        );

        ctx.lineTo(
            weaponX,
            weaponY
        );

        ctx.stroke();

        ctx.lineWidth = 3;

        ctx.strokeStyle =
            currentWeapon().color;

        ctx.beginPath();

        ctx.moveTo(
            x +
                Math.cos(player.angle) *
                    10,
            y +
                Math.sin(player.angle) *
                    10
        );

        ctx.lineTo(
            weaponX + Math.cos(player.angle) * 5,
            weaponY + Math.sin(player.angle) * 5
        );

        ctx.stroke();

        ctx.restore();
    }

    function drawEnemies() {
        for (const enemy of enemies) {
            const x =
                enemy.x - game.cameraX;

            const y =
                enemy.y - game.cameraY;

            ctx.save();

            const scale =
                1 +
                Math.sin(enemy.anim) *
                    0.035;

            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Shadow
            ctx.fillStyle =
                "rgba(0,0,0,.6)";

            ctx.beginPath();

            ctx.ellipse(
                0,
                10,
                enemy.radius * 1.25,
                enemy.radius * 0.5,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();

            // Glow
            ctx.shadowBlur = 18;
            ctx.shadowColor = enemy.color;

            const gradient =
                ctx.createRadialGradient(
                    -5,
                    -7,
                    2,
                    0,
                    0,
                    enemy.radius
                );

            gradient.addColorStop(
                0,
                enemy.hitFlash > 0
                    ? "#ffffff"
                    : "#d6eef0"
            );

            gradient.addColorStop(
                0.35,
                enemy.color
            );

            gradient.addColorStop(
                1,
                "#10161b"
            );

            ctx.fillStyle = gradient;

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                enemy.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.shadowBlur = 0;

            ctx.strokeStyle =
                enemy.color;

            ctx.lineWidth = 1.5;

            ctx.stroke();

            // Core
            ctx.fillStyle =
                "#080d11";

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                enemy.radius * 0.32,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.fillStyle =
                enemy.color;

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                enemy.radius * 0.15,
                0,
                Math.PI * 2
            );

            ctx.fill();

            ctx.restore();

            // Health bar
            if (
                enemy.health <
                enemy.maxHealth
            ) {
                const barW =
                    enemy.radius * 2.2;

                const health =
                    enemy.health /
                    enemy.maxHealth;

                ctx.fillStyle =
                    "rgba(0,0,0,.7)";

                ctx.fillRect(
                    x - barW / 2,
                    y - enemy.radius - 10,
                    barW,
                    4
                );

                ctx.fillStyle =
                    enemy.color;

                ctx.fillRect(
                    x - barW / 2,
                    y - enemy.radius - 10,
                    barW * health,
                    4
                );
            }
        }
    }

    function drawParticles() {
        for (const p of particles) {
            const x =
                p.x - game.cameraX;

            const y =
                p.y - game.cameraY;

            const alpha =
                clamp(
                    p.life / p.maxLife,
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

    // ------------------------------------------------------------
    // LIGHTING
    // ------------------------------------------------------------

    function drawLighting() {
        const px =
            player.x - game.cameraX;

        const py =
            player.y - game.cameraY;

        const gradient =
            ctx.createRadialGradient(
                px,
                py,
                70,
                px,
                py,
                Math.max(W, H) * 0.75
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
            "rgba(0,0,0,.72)"
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );

        // Player light
        const light =
            ctx.createRadialGradient(
                px,
                py,
                10,
                px,
                py,
                260
            );

        light.addColorStop(
            0,
            "rgba(80,220,255,.07)"
        );

        light.addColorStop(
            1,
            "rgba(80,220,255,0)"
        );

        ctx.fillStyle = light;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );
    }

    function drawVignette() {
        const gradient =
            ctx.createRadialGradient(
                W / 2,
                H / 2,
                Math.min(W, H) * 0.25,
                W / 2,
                H / 2,
                Math.max(W, H) * 0.75
            );

        gradient.addColorStop(
            0,
            "rgba(0,0,0,0)"
        );

        gradient.addColorStop(
            1,
            "rgba(0,0,0,.5)"
        );

        ctx.fillStyle = gradient;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );
    }

    // ------------------------------------------------------------
    // MAP
    // ------------------------------------------------------------

    function toggleMap() {
        const map = document.getElementById("map");

        if (!map) return;

        if (
            map.style.display === "flex" ||
            map.style.display === "block"
        ) {
            closeMap();
        } else {
            openMap();
        }
    }

    function openMap() {
        const map = document.getElementById("map");

        if (!map) return;

        map.style.display = "flex";

        drawMap();
    }

    function closeMap() {
        const map = document.getElementById("map");

        if (!map) return;

        map.style.display = "none";
    }

    function drawMap() {
        if (!mapCanvas || !mapCtx) return;

        const mw = mapCanvas.width;
        const mh = mapCanvas.height;

        mapCtx.clearRect(
            0,
            0,
            mw,
            mh
        );

        mapCtx.fillStyle =
            "#061016";

        mapCtx.fillRect(
            0,
            0,
            mw,
            mh
        );

        const sx = mw / WORLD_W;
        const sy = mh / WORLD_H;

        for (const sector of sectors) {
            mapCtx.fillStyle =
                "rgba(50,130,150,.025)";

            mapCtx.fillRect(
                sector.x * sx,
                sector.y * sy,
                sector.w * sx,
                sector.h * sy
            );

            mapCtx.strokeStyle =
                "rgba(100,200,220,.07)";

            mapCtx.strokeRect(
                sector.x * sx,
                sector.y * sy,
                sector.w * sx,
                sector.h * sy
            );
        }

        mapCtx.fillStyle =
            "#26363e";

        for (const wall of walls) {
            mapCtx.fillRect(
                wall.x * sx,
                wall.y * sy,
                wall.w * sx,
                wall.h * sy
            );
        }

        for (const enemy of enemies) {
            mapCtx.fillStyle =
                enemy.color;

            mapCtx.beginPath();

            mapCtx.arc(
                enemy.x * sx,
                enemy.y * sy,
                4,
                0,
                Math.PI * 2
            );

            mapCtx.fill();
        }

        mapCtx.fillStyle =
            "#70eaff";

        mapCtx.beginPath();

        mapCtx.arc(
            player.x * sx,
            player.y * sy,
            6,
            0,
            Math.PI * 2
        );

        mapCtx.fill();

        mapCtx.strokeStyle =
            "rgba(112,234,255,.35)";

        mapCtx.beginPath();

        mapCtx.arc(
            player.x * sx,
            player.y * sy,
            20,
            0,
            Math.PI * 2
        );

        mapCtx.stroke();
    }

    // ------------------------------------------------------------
    // HUD
    // ------------------------------------------------------------

    function updateHUD() {
        const healthBar =
            document.getElementById("healthBar");

        const energyBar =
            document.getElementById("energyBar");

        const kills =
            document.getElementById("kills");

        const credits =
            document.getElementById("credits");

        const ammo =
            document.getElementById("ammo");

        const zone =
            document.getElementById("zone");

        const objective =
            document.getElementById("objective");

        if (healthBar) {
            healthBar.style.width =
                `${player.health}%`;
        }

        if (energyBar) {
            energyBar.style.width =
                `${player.energy}%`;
        }

        if (kills) {
            kills.textContent =
                `KILLS: ${game.kills}`;
        }

        if (credits) {
            credits.textContent =
                `CREDITS: ${game.credits}`;
        }

        if (ammo) {
            ammo.textContent =
                player.reloading
                    ? "RELOADING..."
                    : `${player.ammo} / ∞`;
        }

        if (zone) {
            zone.textContent =
                getSectorName(
                    player.x,
                    player.y
                );
        }

        if (objective) {
            objective.textContent =
                `SIGNAL: ${Math.min(
                    100,
                    game.signalProgress
                )}%`;
        }
    }

    // ------------------------------------------------------------
    // PAUSE
    // ------------------------------------------------------------

    function togglePause() {
        if (!game.running || game.gameOver) {
            return;
        }

        game.paused = !game.paused;

        const pause =
            document.getElementById("pause");

        if (pause) {
            pause.style.display =
                game.paused
                    ? "flex"
                    : "none";
        }

        if (game.paused) {
            mouseDown = false;
        }
    }

    // ------------------------------------------------------------
    // GAME OVER
    // ------------------------------------------------------------

    function createGameOverScreen() {
        if (document.getElementById("gameOverScreen")) {
            return;
        }

        const overlay =
            document.createElement("div");

        overlay.id = "gameOverScreen";

        overlay.innerHTML = `
            <div class="gameOverPanel">

                <div class="small">
                    SIGNAL CONNECTION LOST
                </div>

                <h2>RUN ENDED</h2>

                <div class="gameStats">

                    <div class="gameStat">
                        <span>KILLS</span>
                        <strong id="overKills">0</strong>
                    </div>

                    <div class="gameStat">
                        <span>CREDITS</span>
                        <strong id="overCredits">0</strong>
                    </div>

                    <div class="gameStat">
                        <span>WAVE</span>
                        <strong id="overWave">1</strong>
                    </div>

                    <div class="gameStat">
                        <span>DISTANCE</span>
                        <strong id="overDistance">0</strong>
                    </div>

                </div>

                <div class="gameButtons">
                    <button id="retryGame">
                        NEW RUN
                    </button>

                    <button id="overMenu">
                        MAIN MENU
                    </button>
                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        document
            .getElementById("retryGame")
            .addEventListener(
                "click",
                startNewGame
            );

        document
            .getElementById("overMenu")
            .addEventListener(
                "click",
                returnToMenu
            );
    }

    function endGame() {
        if (game.gameOver) return;

        game.gameOver = true;
        game.running = false;

        mouseDown = false;

        createGameOverScreen();

        document.getElementById(
            "overKills"
        ).textContent = game.kills;

        document.getElementById(
            "overCredits"
        ).textContent = game.credits;

        document.getElementById(
            "overWave"
        ).textContent = game.wave;

        document.getElementById(
            "overDistance"
        ).textContent =
            Math.floor(game.distanceTravelled);

        document
            .getElementById("gameOverScreen")
            .classList.add("open");
    }

    // ------------------------------------------------------------
    // MENU
    // ------------------------------------------------------------

    function hideAllScreens() {
        const menu =
            document.getElementById("menu");

        const pause =
            document.getElementById("pause");

        const map =
            document.getElementById("map");

        const gameOver =
            document.getElementById(
                "gameOverScreen"
            );

        if (menu) {
            menu.style.display = "none";
        }

        if (pause) {
            pause.style.display = "none";
        }

        if (map) {
            map.style.display = "none";
        }

        if (gameOver) {
            gameOver.classList.remove("open");
        }

        closeAchievements();

        const info =
            document.getElementById(
                "infoOverlay"
            );

        if (info) {
            info.classList.remove("open");
        }
    }

    function returnToMenu() {
        game.running = false;
        game.paused = false;
        game.gameOver = false;

        mouseDown = false;

        hideAllScreens();

        const menu =
            document.getElementById("menu");

        if (menu) {
            menu.style.display = "flex";
        }
    }

    // ------------------------------------------------------------
    // BUTTONS
    // ------------------------------------------------------------

    const newGameButton =
        document.getElementById("newGame");

    if (newGameButton) {
        newGameButton.addEventListener(
            "click",
            startNewGame
        );
    }

    const loadGameButton =
        document.getElementById("loadGame");

    if (loadGameButton) {
        loadGameButton.addEventListener(
            "click",
            loadGame
        );
    }

    const achievementsButton =
        document.getElementById(
            "achievementsButton"
        );

    if (achievementsButton) {
        achievementsButton.addEventListener(
            "click",
            showAchievements
        );
    }

    const controlsButton =
        document.getElementById(
            "controlsButton"
        );

    if (controlsButton) {
        controlsButton.addEventListener(
            "click",
            showControls
        );
    }

    const resumeButton =
        document.getElementById("resume");

    if (resumeButton) {
        resumeButton.addEventListener(
            "click",
            togglePause
        );
    }

    const saveButton =
        document.getElementById("save");

    if (saveButton) {
        saveButton.addEventListener(
            "click",
            saveGame
        );
    }

    const quitButton =
        document.getElementById("quit");

    if (quitButton) {
        quitButton.addEventListener(
            "click",
            returnToMenu
        );
    }

    const closeMapButton =
        document.getElementById("closeMap");

    if (closeMapButton) {
        closeMapButton.addEventListener(
            "click",
            closeMap
        );
    }

    // ------------------------------------------------------------
    // WEAPON SWITCHING
    // ------------------------------------------------------------

    window.addEventListener("keydown", e => {
        if (!game.running) return;

        if (e.code === "Digit1") {
            player.weapon = "PULSE";
            player.maxAmmo =
                weapons.PULSE.magazine;

            player.ammo =
                Math.min(
                    player.ammo,
                    player.maxAmmo
                );
        }

        if (e.code === "Digit2") {
            player.weapon = "BURST";
            player.maxAmmo =
                weapons.BURST.magazine;

            player.ammo =
                Math.min(
                    player.ammo,
                    player.maxAmmo
                );

            achievements.arsenal = true;
            saveAchievements();
        }

        if (e.code === "Digit3") {
            player.weapon = "HEAVY";
            player.maxAmmo =
                weapons.HEAVY.magazine;

            player.ammo =
                Math.min(
                    player.ammo,
                    player.maxAmmo
                );

            achievements.arsenal = true;
            saveAchievements();
        }

        updateHUD();
    });

    // ------------------------------------------------------------
    // UPDATE
    // ------------------------------------------------------------

    function update(dt) {
        if (!game.running) return;

        if (game.paused) return;

        if (game.gameOver) return;

        game.time += dt;

        updatePlayer(dt);

        updateEnemies(dt);

        updateBullets(dt);

        updateEnemyBullets(dt);

        updatePickups(dt);

        updateParticles(dt);

        updateCamera();

        if (game.shake > 0) {
            game.shake -= dt * 0.015;

            if (game.shake < 0) {
                game.shake = 0;
            }
        }

        checkAchievements();

        updateHUD();
    }

    // ------------------------------------------------------------
    // DRAW
    // ------------------------------------------------------------

    function draw() {
        ctx.clearRect(
            0,
            0,
            W,
            H
        );

        let shakeX = 0;
        let shakeY = 0;

        if (game.shake > 0) {
            shakeX =
                random(
                    -game.shake,
                    game.shake
                );

            shakeY =
                random(
                    -game.shake,
                    game.shake
                );
        }

        ctx.save();

        ctx.translate(
            shakeX,
            shakeY
        );

        drawBackground();

        drawDecals();

        drawWalls();

        drawPickups();

        drawBullets();

        drawEnemies();

        drawPlayer();

        drawParticles();

        ctx.restore();

        drawLighting();

        drawVignette();

        if (game.running && !game.paused) {
            drawCrosshair();
        }
    }

    function drawCrosshair() {
        const size = 9;

        ctx.save();

        ctx.strokeStyle =
            "rgba(120,235,255,.85)";

        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.moveTo(
            mouseX - size,
            mouseY
        );

        ctx.lineTo(
            mouseX - 3,
            mouseY
        );

        ctx.moveTo(
            mouseX + 3,
            mouseY
        );

        ctx.lineTo(
            mouseX + size,
            mouseY
        );

        ctx.moveTo(
            mouseX,
            mouseY - size
        );

        ctx.lineTo(
            mouseX,
            mouseY - 3
        );

        ctx.moveTo(
            mouseX,
            mouseY + 3
        );

        ctx.lineTo(
            mouseX,
            mouseY + size
        );

        ctx.stroke();

        ctx.restore();
    }

    // ------------------------------------------------------------
    // GAME LOOP
    // ------------------------------------------------------------

    let lastTime = performance.now();

    function gameLoop(now) {
        let dt = now - lastTime;

        lastTime = now;

        dt = clamp(dt, 0, 40);

        update(dt);

        draw();

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);

    // ------------------------------------------------------------
    // INITIAL STATE
    // ------------------------------------------------------------

    const menu =
        document.getElementById("menu");

    if (menu) {
        menu.style.display = "flex";
    }

    updateHUD();

    console.log(
        "ECHOBOUND loaded successfully."
    );
})();
