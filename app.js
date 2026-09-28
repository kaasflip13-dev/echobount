"use strict";

/* =========================================================
   ECHOBOUND — THE LOST SIGNAL
   GRAPHICS UPGRADE 1
   Complete app.js
========================================================= */

(() => {

    /* -----------------------------------------------------
       VOORKOM DAT APP.JS TWEE KEER WORDT GELADEN
    ----------------------------------------------------- */

    if (window.__ECHOBOUND_LOADED__) {
        console.warn("EchoBound app.js is al geladen.");
        return;
    }

    window.__ECHOBOUND_LOADED__ = true;


    /* =====================================================
       CANVAS
    ===================================================== */

    const canvas = document.getElementById("game");

    if (!canvas) {
        console.error("Canvas #game ontbreekt.");
        return;
    }

    const ctx = canvas.getContext("2d");

    const mapCanvas = document.getElementById("mapCanvas");
    const mapCtx = mapCanvas
        ? mapCanvas.getContext("2d")
        : null;


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
    let floatingTexts = [];

    let keys = {};

    let camera = {
        x: 0,
        y: 0
    };

    let screenShake = 0;

    let time = 0;

    let lastTime = performance.now();


    /* =====================================================
       MOUSE
    ===================================================== */

    const mouse = {
        x: W / 2,
        y: H / 2,
        down: false
    };


    /* =====================================================
       WORLD
    ===================================================== */

    const WORLD_WIDTH = 3000;
    const WORLD_HEIGHT = 3000;


    /* =====================================================
       WALLS / GEBOUWEN
    ===================================================== */

    const walls = [

        {
            x: 280,
            y: 320,
            w: 650,
            h: 55
        },

        {
            x: 1080,
            y: 220,
            w: 55,
            h: 620
        },

        {
            x: 1380,
            y: 300,
            w: 700,
            h: 55
        },

        {
            x: 2180,
            y: 400,
            w: 55,
            h: 600
        },

        {
            x: 380,
            y: 950,
            w: 55,
            h: 620
        },

        {
            x: 520,
            y: 1480,
            w: 680,
            h: 55
        },

        {
            x: 1380,
            y: 900,
            w: 620,
            h: 55
        },

        {
            x: 1780,
            y: 930,
            w: 55,
            h: 560
        },

        {
            x: 1150,
            y: 1700,
            w: 55,
            h: 650
        },

        {
            x: 1300,
            y: 1900,
            w: 680,
            h: 55
        },

        {
            x: 2220,
            y: 1600,
            w: 55,
            h: 650
        },

        {
            x: 400,
            y: 2250,
            w: 700,
            h: 55
        }

    ];


    /* =====================================================
       DECORATIEVE OBJECTEN
    ===================================================== */

    const scenery = [];

    function createScenery() {

        scenery.length = 0;

        for (let i = 0; i < 150; i++) {

            const x =
                50 +
                Math.random() *
                (WORLD_WIDTH - 100);

            const y =
                50 +
                Math.random() *
                (WORLD_HEIGHT - 100);

            let insideWall = false;

            for (const wall of walls) {

                if (
                    x > wall.x - 35 &&
                    x < wall.x + wall.w + 35 &&
                    y > wall.y - 35 &&
                    y < wall.y + wall.h + 35
                ) {

                    insideWall = true;
                    break;

                }

            }

            if (insideWall) {
                continue;
            }

            const type =
                Math.random() < 0.72
                    ? "plant"
                    : "rock";

            scenery.push({

                x,
                y,

                type,

                size:
                    8 +
                    Math.random() * 20,

                rotation:
                    Math.random() *
                    Math.PI *
                    2,

                depth:
                    0.7 +
                    Math.random() * 0.6

            });

        }

    }

    createScenery();


    /* =====================================================
       ACHIEVEMENTS
    ===================================================== */

    let achievements = {

        firstEcho: false,
        tenEchoes: false,
        firstSave: false,
        explorer: false,
        survivor: false,
        dashMaster: false

    };


    /* =====================================================
       SAVE
    ===================================================== */

    const SAVE_KEY =
        "echobound_graphics_upgrade_save";


    /* =====================================================
       HTML ELEMENTS
    ===================================================== */

    const menu =
        document.getElementById("menu");

    const pauseMenu =
        document.getElementById("pause");

    const mapMenu =
        document.getElementById("map");

    const achievementToast =
        document.getElementById("achievement");

    const newGameButton =
        document.getElementById("newGame");

    const loadGameButton =
        document.getElementById("loadGame");

    const achievementsButton =
        document.getElementById("achievementsButton");

    const controlsButton =
        document.getElementById("controlsButton");

    const resumeButton =
        document.getElementById("resume");

    const saveButton =
        document.getElementById("save");

    const quitButton =
        document.getElementById("quit");

    const closeMapButton =
        document.getElementById("closeMap");


    /* =====================================================
       RESIZE
    ===================================================== */

    window.addEventListener("resize", () => {

        W = window.innerWidth;
        H = window.innerHeight;

        canvas.width = W;
        canvas.height = H;

        if (
            mapMenu &&
            mapMenu.style.display === "flex"
        ) {

            drawMap();

        }

    });


    /* =====================================================
       INPUT RESET
    ===================================================== */

    function resetInput() {

        keys = {};
        mouse.down = false;

    }


    window.addEventListener("blur", resetInput);


    /* =====================================================
       COLLISION
    ===================================================== */

    function circleIntersectsRect(
        x,
        y,
        radius,
        rect
    ) {

        const closestX =
            Math.max(
                rect.x,
                Math.min(
                    x,
                    rect.x + rect.w
                )
            );

        const closestY =
            Math.max(
                rect.y,
                Math.min(
                    y,
                    rect.y + rect.h
                )
            );

        const dx =
            x - closestX;

        const dy =
            y - closestY;

        return (
            dx * dx +
            dy * dy <
            radius * radius
        );

    }


    function positionFree(
        x,
        y,
        radius
    ) {

        if (
            x - radius < 0 ||
            x + radius > WORLD_WIDTH ||
            y - radius < 0 ||
            y + radius > WORLD_HEIGHT
        ) {

            return false;

        }

        for (const wall of walls) {

            if (
                circleIntersectsRect(
                    x,
                    y,
                    radius,
                    wall
                )
            ) {

                return false;

            }

        }

        return true;

    }


    /* =====================================================
       LINE OF SIGHT / BULLET WALL COLLISION
    ===================================================== */

    function segmentIntersectsRect(
        x1,
        y1,
        x2,
        y2,
        rect
    ) {

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

            if (Math.abs(p[i]) < 0.00001) {

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


    function lineHitsWall(
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


    /* =====================================================
       NEW GAME
    ===================================================== */

    if (newGameButton) {

        newGameButton.addEventListener(
            "click",
            startNewGame
        );

    }


    function startNewGame() {

        player = {

            x: 1500,
            y: 1500,

            radius: 18,

            speed: 3.7,

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

            dashX: 0,
            dashY: 0,

            invincible: 0,

            distance: 0,

            shots: 0,

            damageTaken: 0

        };


        enemies = [];
        bullets = [];
        particles = [];
        pickups = [];
        floatingTexts = [];


        screenShake = 0;


        resetInput();


        for (
            let i = 0;
            i < 20;
            i++
        ) {

            createEnemy();

        }


        gameRunning = true;
        paused = false;


        if (menu) {
            menu.style.display = "none";
        }

        if (pauseMenu) {
            pauseMenu.style.display = "none";
        }

        if (mapMenu) {
            mapMenu.style.display = "none";
        }


        updateCamera();
        updateHUD();


        createParticles(
            player.x,
            player.y,
            35
        );


        console.log(
            "EchoBound: nieuwe run gestart"
        );

    }


    /* =====================================================
       LOAD GAME
    ===================================================== */

    if (loadGameButton) {

        loadGameButton.addEventListener(
            "click",
            loadGame
        );

    }


    function loadGame() {

        const saved =
            localStorage.getItem(
                SAVE_KEY
            );

        if (!saved) {

            showMessage(
                "NO SAVE DATA",
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
                    "Player ontbreekt"
                );
            }


            /* Oude saves aanvullen */

            player.maxHealth ??= 100;
            player.maxEnergy ??= 100;
            player.health ??= 100;
            player.energy ??= 100;
            player.radius ??= 18;
            player.speed ??= 3.7;
            player.ammo ??= 12;
            player.kills ??= 0;
            player.credits ??= 0;
            player.cooldown ??= 0;
            player.dashCooldown ??= 0;
            player.dashTimer ??= 0;
            player.invincible ??= 0;
            player.distance ??= 0;
            player.shots ??= 0;
            player.damageTaken ??= 0;


            if (data.achievements) {

                achievements = {
                    ...achievements,
                    ...data.achievements
                };

            }


            enemies = [];
            bullets = [];
            particles = [];
            pickups = [];
            floatingTexts = [];


            for (
                let i = 0;
                i < 20;
                i++
            ) {

                createEnemy();

            }


            gameRunning = true;
            paused = false;


            resetInput();


            if (menu) {
                menu.style.display = "none";
            }


            updateCamera();
            updateHUD();


            showMessage(
                "RUN LOADED",
                "Je opgeslagen game is geladen."
            );


        } catch (error) {

            console.error(error);

            showMessage(
                "SAVE ERROR",
                "De opgeslagen game kon niet worden geladen."
            );

        }

    }


    /* =====================================================
       SAVE GAME
    ===================================================== */

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveGame
        );

    }


    function saveGame() {

        if (!player) {
            return;
        }


        const data = {

            player: player,

            achievements: achievements

        };


        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(data)
        );


        if (
            !achievements.firstSave
        ) {

            achievements.firstSave = true;

            showAchievement(
                "FIRST SAVE"
            );

        } else {

            showMessage(
                "GAME SAVED",
                "Je run is opgeslagen."
            );

        }

    }


    /* =====================================================
       ACHIEVEMENTS SCREEN
    ===================================================== */

    if (achievementsButton) {

        achievementsButton.addEventListener(
            "click",
            openAchievements
        );

    }


    function openAchievements() {

        const old =
            document.getElementById(
                "achievementScreen"
            );

        if (old) {
            old.remove();
        }


        const screen =
            document.createElement("div");

        screen.id =
            "achievementScreen";


        Object.assign(
            screen.style,
            {
                position: "fixed",
                inset: "0",
                zIndex: "1000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(3,8,13,.97)",
                fontFamily: "Arial, sans-serif"
            }
        );


        const panel =
            document.createElement("div");


        Object.assign(
            panel.style,
            {
                width: "min(760px, 90vw)",
                maxHeight: "86vh",
                overflowY: "auto",
                padding: "35px",
                borderRadius: "20px",
                background:
                    "linear-gradient(145deg,#172d3d,#071118)",
                border:
                    "1px solid #4f8da9",
                boxShadow:
                    "0 30px 100px rgba(0,0,0,.8)"
            }
        );


        const title =
            document.createElement("h1");


        title.textContent =
            "ACHIEVEMENTS";


        Object.assign(
            title.style,
            {
                textAlign: "center",
                color: "#7bdcff",
                letterSpacing: "6px",
                marginTop: "0",
                marginBottom: "8px"
            }
        );


        panel.appendChild(title);


        const subtitle =
            document.createElement("p");


        subtitle.textContent =
            "YOUR PROGRESS";


        Object.assign(
            subtitle.style,
            {
                textAlign: "center",
                color: "#698390",
                letterSpacing: "3px",
                marginBottom: "28px"
            }
        );


        panel.appendChild(subtitle);


        const data = [

            {
                key: "firstEcho",
                name: "FIRST ECHO",
                text: "Versla je eerste monster.",
                progress:
                    player
                        ? Math.min(player.kills, 1) + " / 1"
                        : "0 / 1"
            },

            {
                key: "tenEchoes",
                name: "TEN ECHOES",
                text: "Versla 10 monsters.",
                progress:
                    player
                        ? Math.min(player.kills, 10) + " / 10"
                        : "0 / 10"
            },

            {
                key: "firstSave",
                name: "FIRST SAVE",
                text: "Sla je eerste run op.",
                progress:
                    achievements.firstSave
                        ? "COMPLETED"
                        : "LOCKED"
            },

            {
                key: "explorer",
                name: "EXPLORER",
                text: "Leg 5000 meter af.",
                progress:
                    player
                        ? Math.min(
                            Math.floor(
                                player.distance
                            ),
                            5000
                        ) +
                        " / 5000"
                        : "0 / 5000"
            },

            {
                key: "survivor",
                name: "SURVIVOR",
                text: "Bereik 20 kills.",
                progress:
                    player
                        ? Math.min(
                            player.kills,
                            20
                        ) +
                        " / 20"
                        : "0 / 20"
            },

            {
                key: "dashMaster",
                name: "DASH MASTER",
                text: "Gebruik de dash tijdens een run.",
                progress:
                    achievements.dashMaster
                        ? "COMPLETED"
                        : "LOCKED"
            }

        ];


        for (const item of data) {

            const unlocked =
                achievements[item.key];


            const card =
                document.createElement("div");


            Object.assign(
                card.style,
                {
                    padding: "18px",
                    marginBottom: "12px",
                    borderRadius: "12px",
                    border:
                        unlocked
                            ? "1px solid #58c9ed"
                            : "1px solid #263d49",
                    background:
                        unlocked
                            ? "rgba(50,150,190,.14)"
                            : "rgba(0,0,0,.22)"
                }
            );


            const name =
                document.createElement("div");


            name.textContent =
                (unlocked ? "✓ " : "□ ") +
                item.name;


            Object.assign(
                name.style,
                {
                    color:
                        unlocked
                            ? "#79dcff"
                            : "#71818b",
                    fontWeight: "bold",
                    fontSize: "17px"
                }
            );


            const description =
                document.createElement("div");


            description.textContent =
                item.text;


            Object.assign(
                description.style,
                {
                    color: "#899da7",
                    marginTop: "6px",
                    fontSize: "13px"
                }
            );


            const progress =
                document.createElement("div");


            progress.textContent =
                item.progress;


            Object.assign(
                progress.style,
                {
                    color: "#b8d5df",
                    marginTop: "8px",
                    fontSize: "12px"
                }
            );


            card.appendChild(name);
            card.appendChild(description);
            card.appendChild(progress);


            panel.appendChild(card);

        }


        const close =
            document.createElement("button");


        close.textContent =
            "TERUG";


        Object.assign(
            close.style,
            {
                width: "100%",
                padding: "14px",
                marginTop: "10px",
                borderRadius: "9px",
                border: "1px solid #68cbed",
                background: "#1d506a",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "15px"
            }
        );


        close.addEventListener(
            "click",
            () => screen.remove()
        );


        panel.appendChild(close);

        screen.appendChild(panel);

        document.body.appendChild(screen);

    }


    /* =====================================================
       CONTROLS SCREEN
    ===================================================== */

    if (controlsButton) {

        controlsButton.addEventListener(
            "click",
            openControls
        );

    }


    function openControls() {

        const old =
            document.getElementById(
                "controlsScreen"
            );

        if (old) {
            old.remove();
        }


        const screen =
            document.createElement("div");


        screen.id =
            "controlsScreen";


        Object.assign(
            screen.style,
            {
                position: "fixed",
                inset: "0",
                zIndex: "1000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(3,8,13,.97)",
                fontFamily: "Arial, sans-serif"
            }
        );


        const panel =
            document.createElement("div");


        Object.assign(
            panel.style,
            {
                width: "min(620px, 88vw)",
                padding: "35px",
                borderRadius: "20px",
                background:
                    "linear-gradient(145deg,#172d3d,#071118)",
                border:
                    "1px solid #4f8da9",
                boxShadow:
                    "0 30px 100px rgba(0,0,0,.8)"
            }
        );


        panel.innerHTML = `
            <h1 style="
                text-align:center;
                color:#7bdcff;
                letter-spacing:5px;
                margin-top:0;
            ">
                CONTROLS
            </h1>

            <div style="
                color:#a9bdc7;
                line-height:2;
                font-size:16px;
            ">
                <b style="color:#fff">W A S D</b>
                — Bewegen<br>

                <b style="color:#fff">MUIS</b>
                — Richten<br>

                <b style="color:#fff">LINKERMUIS</b>
                — Schieten<br>

                <b style="color:#fff">SPACE</b>
                — Dash<br>

                <b style="color:#fff">M</b>
                — Sector map<br>

                <b style="color:#fff">ESC</b>
                — Pauze
            </div>
        `;


        const close =
            document.createElement("button");


        close.textContent =
            "TERUG";


        Object.assign(
            close.style,
            {
                width: "100%",
                marginTop: "25px",
                padding: "14px",
                borderRadius: "9px",
                border: "1px solid #68cbed",
                background: "#1d506a",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer"
            }
        );


        close.onclick =
            () => screen.remove();


        panel.appendChild(close);

        screen.appendChild(panel);

        document.body.appendChild(screen);

    }


    /* =====================================================
       PAUSE
    ===================================================== */

    if (resumeButton) {

        resumeButton.addEventListener(
            "click",
            () => {

                paused = false;

                if (pauseMenu) {
                    pauseMenu.style.display = "none";
                }

            }
        );

    }


    if (quitButton) {

        quitButton.addEventListener(
            "click",
            () => {

                if (player) {
                    saveGame();
                }

                gameRunning = false;
                paused = false;

                resetInput();

                if (pauseMenu) {
                    pauseMenu.style.display = "none";
                }

                if (mapMenu) {
                    mapMenu.style.display = "none";
                }

                if (menu) {
                    menu.style.display = "flex";
                }

            }
        );

    }


    /* =====================================================
       KEYBOARD
    ===================================================== */

    window.addEventListener(
        "keydown",
        event => {

            const key =
                event.key.toLowerCase();

            keys[key] = true;


            if (
                event.code === "Space"
            ) {

                keys.space = true;

                event.preventDefault();

            }


            if (
                [
                    "KeyW",
                    "KeyA",
                    "KeyS",
                    "KeyD",
                    "KeyM",
                    "Space"
                ].includes(event.code)
            ) {

                event.preventDefault();

            }


            if (
                event.key === "Escape"
            ) {

                const achievementScreen =
                    document.getElementById(
                        "achievementScreen"
                    );

                const controlsScreen =
                    document.getElementById(
                        "controlsScreen"
                    );


                if (achievementScreen) {

                    achievementScreen.remove();

                    return;

                }


                if (controlsScreen) {

                    controlsScreen.remove();

                    return;

                }


                if (gameRunning) {

                    togglePause();

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
        event => {

            const key =
                event.key.toLowerCase();

            keys[key] = false;


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
        event => {

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
        event => {

            if (
                event.button === 0
            ) {

                mouse.down = true;

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


    canvas.addEventListener(
        "contextmenu",
        event => {

            event.preventDefault();

        }
    );


    /* =====================================================
       PAUSE FUNCTION
    ===================================================== */

    function togglePause() {

        paused =
            !paused;


        if (pauseMenu) {

            pauseMenu.style.display =
                paused
                    ? "flex"
                    : "none";

        }

    }


    /* =====================================================
       ENEMY CREATION
    ===================================================== */

    function createEnemy() {

        if (!player) {
            return;
        }


        let x = 0;
        let y = 0;

        let valid = false;


        for (
            let attempt = 0;
            attempt < 300;
            attempt++
        ) {

            x =
                70 +
                Math.random() *
                (WORLD_WIDTH - 140);

            y =
                70 +
                Math.random() *
                (WORLD_HEIGHT - 140);


            const distance =
                Math.hypot(
                    x - player.x,
                    y - player.y
                );


            if (
                distance < 500
            ) {
                continue;
            }


            if (
                positionFree(
                    x,
                    y,
                    25
                )
            ) {

                valid = true;
                break;

            }

        }


        if (!valid) {
            return;
        }


        const random =
            Math.random();


        let enemy;


        if (
            random > 0.84
        ) {

            enemy = {

                x,
                y,

                radius: 24,

                speed: 0.52,

                hp: 6,
                maxHp: 6,

                cooldown:
                    80 +
                    Math.random() * 90,

                type: "heavy",

                hitFlash: 0,

                wander: Math.random() * 6

            };

        }

        else if (
            random > 0.58
        ) {

            enemy = {

                x,
                y,

                radius: 19,

                speed: 0.76,

                hp: 3,
                maxHp: 3,

                cooldown:
                    60 +
                    Math.random() * 100,

                type: "mid",

                hitFlash: 0,

                wander: Math.random() * 6

            };

        }

        else {

            enemy = {

                x,
                y,

                radius: 16,

                speed: 0.98,

                hp: 2,
                maxHp: 2,

                cooldown:
                    70 +
                    Math.random() * 110,

                type: "light",

                hitFlash: 0,

                wander: Math.random() * 6

            };

        }


        enemies.push(enemy);

    }


    /* =====================================================
       PLAYER UPDATE
    ===================================================== */

    function updatePlayer() {

        if (!player) {
            return;
        }


        let dx = 0;
        let dy = 0;


        if (keys.w) {
            dy -= 1;
        }

        if (keys.s) {
            dy += 1;
        }

        if (keys.a) {
            dx -= 1;
        }

        if (keys.d) {
            dx += 1;
        }


        let moving =
            dx !== 0 ||
            dy !== 0;


        if (moving) {

            const length =
                Math.hypot(
                    dx,
                    dy
                );

            dx /= length;
            dy /= length;

        }


        /* DASH */

        if (
            keys.space &&
            player.dashCooldown <= 0 &&
            player.energy >= 25 &&
            moving
        ) {

            player.dashTimer = 13;

            player.dashX = dx;
            player.dashY = dy;

            player.energy -= 25;

            player.dashCooldown = 65;

            player.invincible = 25;

            achievements.dashMaster = true;

            keys.space = false;


            createParticles(
                player.x,
                player.y,
                30
            );


            screenShake = 4;

        }


        let speed =
            player.speed;


        let moveX = 0;
        let moveY = 0;


        if (
            player.dashTimer > 0
        ) {

            speed = 11;

            moveX =
                player.dashX *
                speed;

            moveY =
                player.dashY *
                speed;

            player.dashTimer--;

        }

        else if (moving) {

            moveX =
                dx * speed;

            moveY =
                dy * speed;

        }


        const oldX =
            player.x;

        const oldY =
            player.y;


        if (
            positionFree(
                player.x + moveX,
                player.y,
                player.radius
            )
        ) {

            player.x += moveX;

        }


        if (
            positionFree(
                player.x,
                player.y + moveY,
                player.radius
            )
        ) {

            player.y += moveY;

        }


        const actualDistance =
            Math.hypot(
                player.x - oldX,
                player.y - oldY
            );


        player.distance +=
            actualDistance;


        if (
            player.distance >= 5000 &&
            !achievements.explorer
        ) {

            achievements.explorer = true;

            showAchievement(
                "EXPLORER"
            );

        }


        if (
            player.cooldown > 0
        ) {

            player.cooldown--;

        }


        if (
            player.dashCooldown > 0
        ) {

            player.dashCooldown--;

        }


        if (
            player.invincible > 0
        ) {

            player.invincible--;

        }


        player.energy =
            Math.min(
                player.maxEnergy,
                player.energy + 0.12
            );

    }


    /* =====================================================
       SHOOTING
    ===================================================== */

    function shoot() {

        if (
            !player ||
            !gameRunning ||
            paused
        ) {

            return;

        }


        if (
            player.cooldown > 0
        ) {

            return;

        }


        if (
            player.ammo <= 0
        ) {

            player.ammo = 12;

            showMessage(
                "RELOADED",
                "Pulse weapon ready."
            );

            return;

        }


        const worldMouseX =
            camera.x +
            mouse.x;


        const worldMouseY =
            camera.y +
            mouse.y;


        const angle =
            Math.atan2(
                worldMouseY - player.y,
                worldMouseX - player.x
            );


        player.ammo--;

        player.shots++;

        player.cooldown = 8;


        const startX =
            player.x +
            Math.cos(angle) *
            28;


        const startY =
            player.y +
            Math.sin(angle) *
            28;


        bullets.push({

            x: startX,
            y: startY,

            oldX: startX,
            oldY: startY,

            vx:
                Math.cos(angle) *
                12,

            vy:
                Math.sin(angle) *
                12,

            enemy: false,

            life: 130

        });


        createMuzzleFlash(
            startX,
            startY,
            angle
        );


        createParticles(
            startX,
            startY,
            5
        );

    }


    /* =====================================================
       ENEMY UPDATE
    ===================================================== */

    function updateEnemies() {

        if (!player) {
            return;
        }


        for (const enemy of enemies) {

            const dx =
                player.x -
                enemy.x;

            const dy =
                player.y -
                enemy.y;


            const distance =
                Math.hypot(
                    dx,
                    dy
                );


            /* FLASH */

            if (
                enemy.hitFlash > 0
            ) {

                enemy.hitFlash--;

            }


            /* MOVEMENT */

            if (
                distance > 80 &&
                distance > 0
            ) {

                const angle =
                    Math.atan2(
                        dy,
                        dx
                    );


                const wave =
                    Math.sin(
                        time * 0.002 +
                        enemy.wander
                    ) *
                    0.15;


                const moveAngle =
                    angle + wave;


                const moveX =
                    Math.cos(
                        moveAngle
                    ) *
                    enemy.speed;


                const moveY =
                    Math.sin(
                        moveAngle
                    ) *
                    enemy.speed;


                if (
                    positionFree(
                        enemy.x + moveX,
                        enemy.y,
                        enemy.radius
                    )
                ) {

                    enemy.x += moveX;

                }


                if (
                    positionFree(
                        enemy.x,
                        enemy.y + moveY,
                        enemy.radius
                    )
                ) {

                    enemy.y += moveY;

                }

            }


            /* SHOOT */

            if (
                distance < 750
            ) {

                enemy.cooldown--;


                if (
                    enemy.cooldown <= 0
                ) {

                    enemy.cooldown =
                        100 +
                        Math.random() *
                        110;


                    if (
                        !lineHitsWall(
                            enemy.x,
                            enemy.y,
                            player.x,
                            player.y
                        )
                    ) {

                        const angle =
                            Math.atan2(
                                player.y -
                                enemy.y,

                                player.x -
                                enemy.x
                            );


                        let bulletSpeed =
                            3.1;


                        if (
                            enemy.type === "mid"
                        ) {

                            bulletSpeed =
                                3.5;

                        }


                        if (
                            enemy.type === "heavy"
                        ) {

                            bulletSpeed =
                                2.7;

                        }


                        bullets.push({

                            x: enemy.x,
                            y: enemy.y,

                            oldX: enemy.x,
                            oldY: enemy.y,

                            vx:
                                Math.cos(angle) *
                                bulletSpeed,

                            vy:
                                Math.sin(angle) *
                                bulletSpeed,

                            enemy: true,

                            life: 220

                        });


                        createParticles(
                            enemy.x,
                            enemy.y,
                            4
                        );

                    }

                }

            }


            /* CONTACT DAMAGE */

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


            bullet.oldX =
                bullet.x;

            bullet.oldY =
                bullet.y;


            bullet.x +=
                bullet.vx;

            bullet.y +=
                bullet.vy;


            bullet.life--;


            /* WALL */

            if (
                lineHitsWall(
                    bullet.oldX,
                    bullet.oldY,
                    bullet.x,
                    bullet.y
                )
            ) {

                createImpact(
                    bullet.x,
                    bullet.y
                );


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
                    Math.hypot(
                        bullet.x -
                        player.x,

                        bullet.y -
                        player.y
                    )
                    <
                    player.radius + 7
                ) {

                    damagePlayer(8);


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
                        Math.hypot(
                            bullet.x -
                            enemy.x,

                            bullet.y -
                            enemy.y
                        )
                        <
                        enemy.radius + 7
                    ) {

                        enemy.hp--;

                        enemy.hitFlash =
                            5;


                        createImpact(
                            bullet.x,
                            bullet.y
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
                bullet.x > WORLD_WIDTH ||
                bullet.y > WORLD_HEIGHT
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

    function enemyDefeated(
        index
    ) {

        const enemy =
            enemies[index];


        if (!enemy) {
            return;
        }


        player.kills++;


        if (
            enemy.type === "heavy"
        ) {

            player.credits += 35;

        }

        else if (
            enemy.type === "mid"
        ) {

            player.credits += 20;

        }

        else {

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
            player.kills >= 20 &&
            !achievements.survivor
        ) {

            achievements.survivor = true;

            showAchievement(
                "SURVIVOR"
            );

        }


        floatingTexts.push({

            x: enemy.x,
            y: enemy.y - 30,

            text:
                "+" +
                (
                    enemy.type === "heavy"
                        ? 35
                        : enemy.type === "mid"
                            ? 20
                            : 10
                ),

            life: 50

        });


        createParticles(
            enemy.x,
            enemy.y,
            25
        );


        screenShake = 3;


        if (
            Math.random() < 0.30
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

    }


    /* =====================================================
       DAMAGE PLAYER
    ===================================================== */

    function damagePlayer(
        amount
    ) {

        if (
            player.invincible > 0
        ) {

            return;

        }


        player.health -= amount;

        player.damageTaken +=
            amount;

        player.invincible = 30;


        screenShake = 7;


        createParticles(
            player.x,
            player.y,
            12
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

        resetInput();


        const old =
            document.getElementById(
                "gameOverScreen"
            );

        if (old) {
            old.remove();
        }


        const screen =
            document.createElement("div");


        screen.id =
            "gameOverScreen";


        Object.assign(
            screen.style,
            {
                position: "fixed",
                inset: "0",
                zIndex: "1100",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(2,6,10,.94)",
                fontFamily: "Arial, sans-serif"
            }
        );


        const panel =
            document.createElement("div");


        Object.assign(
            panel.style,
            {
                width: "min(500px, 88vw)",
                padding: "35px",
                textAlign: "center",
                borderRadius: "20px",
                background:
                    "linear-gradient(145deg,#1a2830,#080f14)",
                border:
                    "1px solid #55717d",
                boxShadow:
                    "0 30px 100px rgba(0,0,0,.9)"
            }
        );


        panel.innerHTML = `
            <div style="
                color:#ff9b78;
                font-size:13px;
                letter-spacing:4px;
                margin-bottom:10px;
            ">
                SIGNAL LOST
            </div>

            <h1 style="
                color:#ffffff;
                letter-spacing:5px;
                margin:0 0 25px;
            ">
                RUN ENDED
            </h1>

            <div style="
                color:#9eb2bd;
                line-height:2;
                margin-bottom:25px;
            ">
                KILLS: ${player.kills}<br>
                CREDITS: ${player.credits}
            </div>
        `;


        const retry =
            document.createElement("button");


        retry.textContent =
            "NEW RUN";


        styleMenuButton(
            retry
        );


        retry.onclick =
            () => {

                screen.remove();

                startNewGame();

            };


        const menuButton =
            document.createElement("button");


        menuButton.textContent =
            "MAIN MENU";


        styleMenuButton(
            menuButton
        );


        menuButton.onclick =
            () => {

                screen.remove();

                if (menu) {
                    menu.style.display = "flex";
                }

            };


        panel.appendChild(retry);
        panel.appendChild(menuButton);

        screen.appendChild(panel);

        document.body.appendChild(screen);

    }


    function styleMenuButton(
        button
    ) {

        Object.assign(
            button.style,
            {
                display: "block",
                width: "100%",
                padding: "14px",
                marginTop: "10px",
                borderRadius: "9px",
                border:
                    "1px solid #62cbed",
                background:
                    "#1e526c",
                color: "white",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "15px"
            }
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
                distance < 38
            ) {

                if (
                    pickup.type ===
                    "energy"
                ) {

                    player.energy =
                        Math.min(
                            player.maxEnergy,
                            player.energy + 35
                        );


                    showFloatingText(
                        player.x,
                        player.y,
                        "+ENERGY"
                    );

                }

                else {

                    player.credits += 25;


                    showFloatingText(
                        player.x,
                        player.y,
                        "+25 CREDITS"
                    );

                }


                createParticles(
                    pickup.x,
                    pickup.y,
                    12
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
                0.5 +
                Math.random() *
                4;


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
                    35,

                maxLife: 55,

                size:
                    1.5 +
                    Math.random() *
                    4,

                type:
                    Math.random() <
                    0.75
                        ? "energy"
                        : "smoke"

            });

        }

    }


    function createImpact(
        x,
        y
    ) {

        createParticles(
            x,
            y,
            10
        );

        screenShake =
            Math.max(
                screenShake,
                2
            );

    }


    function createMuzzleFlash(
        x,
        y,
        angle
    ) {

        for (
            let i = 0;
            i < 8;
            i++
        ) {

            const spread =
                angle +
                (Math.random() - 0.5) *
                0.8;


            particles.push({

                x,
                y,

                vx:
                    Math.cos(spread) *
                    (3 + Math.random() * 4),

                vy:
                    Math.sin(spread) *
                    (3 + Math.random() * 4),

                life:
                    8 +
                    Math.random() * 8,

                maxLife: 16,

                size:
                    2 +
                    Math.random() * 3,

                type: "flash"

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


            p.vx *= 0.96;
            p.vy *= 0.96;


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
       FLOATING TEXT
    ===================================================== */

    function showFloatingText(
        x,
        y,
        text
    ) {

        floatingTexts.push({

            x,
            y,

            text,

            life: 50

        });

    }


    function updateFloatingTexts() {

        for (
            let i =
                floatingTexts.length - 1;

            i >= 0;

            i--
        ) {

            const text =
                floatingTexts[i];


            text.y -= 0.5;

            text.life--;


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


    function drawFloatingTexts() {

        ctx.textAlign =
            "center";


        ctx.font =
            "bold 13px Arial";


        for (const text of floatingTexts) {

            ctx.globalAlpha =
                Math.max(
                    0,
                    text.life / 50
                );


            ctx.fillStyle =
                "#8fe5ff";


            ctx.fillText(
                text.text,

                text.x -
                camera.x,

                text.y -
                camera.y
            );

        }


        ctx.globalAlpha = 1;

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
       WORLD DRAW
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


        const grid =
            100;


        const startX =
            Math.floor(
                camera.x / grid
            ) * grid;


        const startY =
            Math.floor(
                camera.y / grid
            ) * grid;


        for (
            let worldX = startX;

            worldX <
            camera.x + W + grid;

            worldX += grid
        ) {

            for (
                let worldY = startY;

                worldY <
                camera.y + H + grid;

                worldY += grid
            ) {

                const screenX =
                    worldX -
                    camera.x;


                const screenY =
                    worldY -
                    camera.y;


                const zone =
                    (
                        Math.floor(
                            worldX / 500
                        ) +
                        Math.floor(
                            worldY / 500
                        )
                    ) % 5;


                const colors = [

                    "#0c181d",
                    "#0e1b21",
                    "#101d23",
                    "#0b171d",
                    "#111c20"

                ];


                ctx.fillStyle =
                    colors[zone];


                ctx.fillRect(
                    screenX,
                    screenY,
                    grid,
                    grid
                );

            }

        }


        /* Fijne lijnen */

        ctx.strokeStyle =
            "rgba(110,190,220,.045)";

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


        drawScenery();

        drawWalls();


        /* Wereldgrens */

        ctx.strokeStyle =
            "rgba(90,190,230,.35)";

        ctx.lineWidth = 5;


        ctx.strokeRect(
            -camera.x,
            -camera.y,
            WORLD_WIDTH,
            WORLD_HEIGHT
        );

    }


    /* =====================================================
       SCENERY
    ===================================================== */

    function drawScenery() {

        for (const object of scenery) {

            const x =
                object.x -
                camera.x;

            const y =
                object.y -
                camera.y;


            if (
                x < -50 ||
                y < -50 ||
                x > W + 50 ||
                y > H + 50
            ) {

                continue;

            }


            ctx.save();

            ctx.translate(
                x,
                y
            );

            ctx.rotate(
                object.rotation
            );


            if (
                object.type ===
                "plant"
            ) {

                drawPlant(
                    object.size
                );

            } else {

                drawRock(
                    object.size
                );

            }


            ctx.restore();

        }

    }


    function drawPlant(
        size
    ) {

        ctx.fillStyle =
            "rgba(12,35,35,.8)";


        ctx.beginPath();

        ctx.ellipse(
            0,
            3,
            size,
            size * 0.55,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.strokeStyle =
            "rgba(70,130,115,.55)";


        ctx.lineWidth = 2;


        for (
            let i = -1;
            i <= 1;
            i++
        ) {

            ctx.beginPath();

            ctx.moveTo(
                0,
                7
            );

            ctx.lineTo(
                i * size * 0.6,
                -size
            );

            ctx.stroke();

        }

    }


    function drawRock(
        size
    ) {

        ctx.fillStyle =
            "#26343a";


        ctx.beginPath();

        ctx.moveTo(
            -size,
            size * 0.5
        );

        ctx.lineTo(
            -size * 0.5,
            -size * 0.6
        );

        ctx.lineTo(
            size * 0.5,
            -size
        );

        ctx.lineTo(
            size,
            size * 0.2
        );

        ctx.lineTo(
            size * 0.4,
            size
        );

        ctx.closePath();

        ctx.fill();


        ctx.strokeStyle =
            "#465961";

        ctx.lineWidth = 1;

        ctx.stroke();

    }


    /* =====================================================
       WALL DRAW
    ===================================================== */

    function drawWalls() {

        for (const wall of walls) {

            const x =
                wall.x -
                camera.x;


            const y =
                wall.y -
                camera.y;


            /* shadow */

            ctx.fillStyle =
                "rgba(0,0,0,.45)";


            ctx.fillRect(
                x + 9,
                y + 9,
                wall.w,
                wall.h
            );


            /* buitenkant */

            ctx.fillStyle =
                "#132832";


            ctx.fillRect(
                x,
                y,
                wall.w,
                wall.h
            );


            /* binnenlaag */

            ctx.fillStyle =
                "#1a3542";


            ctx.fillRect(
                x + 5,
                y + 5,
                Math.max(
                    0,
                    wall.w - 10
                ),
                Math.max(
                    0,
                    wall.h - 10
                )
            );


            /* rand */

            ctx.strokeStyle =
                "#4b8297";

            ctx.lineWidth = 2;


            ctx.strokeRect(
                x,
                y,
                wall.w,
                wall.h
            );


            /* lichtlijn */

            ctx.strokeStyle =
                "rgba(100,210,240,.55)";


            ctx.lineWidth = 2;


            if (
                wall.w > wall.h
            ) {

                ctx.beginPath();

                ctx.moveTo(
                    x + 12,
                    y + wall.h / 2
                );

                ctx.lineTo(
                    x + wall.w - 12,
                    y + wall.h / 2
                );

                ctx.stroke();

            }

            else {

                ctx.beginPath();

                ctx.moveTo(
                    x + wall.w / 2,
                    y + 12
                );

                ctx.lineTo(
                    x + wall.w / 2,
                    y + wall.h - 12
                );

                ctx.stroke();

            }

        }

    }


    /* =====================================================
       LIGHTING
    ===================================================== */

    function drawLighting() {

        if (!player) {
            return;
        }


        /*
           Donkere laag
           met een zachte cirkel
           rond de speler.
        */

        const px =
            player.x -
            camera.x;


        const py =
            player.y -
            camera.y;


        const gradient =
            ctx.createRadialGradient(
                px,
                py,
                50,
                px,
                py,
                Math.max(
                    W,
                    H
                ) * 0.65
            );


        gradient.addColorStop(
            0,
            "rgba(0,0,0,0)"
        );


        gradient.addColorStop(
            0.25,
            "rgba(0,0,0,.08)"
        );


        gradient.addColorStop(
            0.65,
            "rgba(0,0,0,.34)"
        );


        gradient.addColorStop(
            1,
            "rgba(0,0,0,.70)"
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            0,
            0,
            W,
            H
        );


        /* spelerlicht */

        const light =
            ctx.createRadialGradient(
                px,
                py,
                5,
                px,
                py,
                250
            );


        light.addColorStop(
            0,
            "rgba(100,210,255,.16)"
        );


        light.addColorStop(
            0.35,
            "rgba(80,190,230,.07)"
        );


        light.addColorStop(
            1,
            "rgba(0,0,0,0)"
        );


        ctx.fillStyle =
            light;


        ctx.beginPath();

        ctx.arc(
            px,
            py,
            250,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    /* =====================================================
       PICKUPS DRAW
    ===================================================== */

    function drawPickups() {

        for (const pickup of pickups) {

            const x =
                pickup.x -
                camera.x;


            const y =
                pickup.y -
                camera.y;


            const pulse =
                1 +
                Math.sin(
                    time * 0.005
                ) * 0.15;


            ctx.save();


            ctx.translate(
                x,
                y
            );


            ctx.rotate(
                time * 0.002
            );


            const color =
                pickup.type === "energy"
                    ? "#61dfff"
                    : "#ffd45e";


            ctx.globalAlpha =
                0.16;


            ctx.fillStyle =
                color;


            ctx.beginPath();

            ctx.arc(
                0,
                0,
                25 * pulse,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.globalAlpha =
                1;


            ctx.fillStyle =
                color;


            ctx.beginPath();

            ctx.moveTo(
                0,
                -9
            );

            ctx.lineTo(
                9,
                0
            );

            ctx.lineTo(
                0,
                9
            );

            ctx.lineTo(
                -9,
                0
            );

            ctx.closePath();

            ctx.fill();


            ctx.strokeStyle =
                "#ffffff";

            ctx.lineWidth = 1;

            ctx.stroke();


            ctx.restore();

        }

    }


    /* =====================================================
       PLAYER DRAW
    ===================================================== */

    function drawPlayer() {

        if (!player) {
            return;
        }


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
                targetY - player.y,
                targetX - player.x
            );


        /* shadow */

        ctx.fillStyle =
            "rgba(0,0,0,.5)";


        ctx.beginPath();

        ctx.ellipse(
            x,
            y + 18,
            27,
            10,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /* outer glow */

        ctx.globalAlpha =
            0.18;


        ctx.fillStyle =
            "#63d9ff";


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            34,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.globalAlpha =
            1;


        /* body */

        ctx.fillStyle =
            player.invincible > 0
                ? "#ffffff"
                : "#4bbde8";


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
            "#d8f7ff";

        ctx.lineWidth = 2;

        ctx.stroke();


        /* armor detail */

        ctx.strokeStyle =
            "rgba(10,50,70,.7)";

        ctx.lineWidth = 3;


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            11,
            0,
            Math.PI * 2
        );

        ctx.stroke();


        /* weapon */

        ctx.strokeStyle =
            "#d9f8ff";

        ctx.lineWidth = 7;


        ctx.beginPath();

        ctx.moveTo(
            x,
            y
        );

        ctx.lineTo(
            x +
            Math.cos(angle) * 33,

            y +
            Math.sin(angle) * 33
        );

        ctx.stroke();


        /* weapon glow */

        ctx.strokeStyle =
            "rgba(90,220,255,.3)";

        ctx.lineWidth = 13;


        ctx.beginPath();

        ctx.moveTo(
            x,
            y
        );

        ctx.lineTo(
            x +
            Math.cos(angle) * 30,

            y +
            Math.sin(angle) * 30
        );

        ctx.stroke();


        /* core */

        ctx.fillStyle =
            "#f4fdff";


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
       ENEMY DRAW
    ===================================================== */

    function drawEnemies() {

        for (const enemy of enemies) {

            const x =
                enemy.x -
                camera.x;


            const y =
                enemy.y -
                camera.y;


            let color =
                "#bd6cff";


            let glow =
                "#7d43a8";


            if (
                enemy.type === "mid"
            ) {

                color =
                    "#d18aff";

                glow =
                    "#934fc1";

            }


            if (
                enemy.type === "heavy"
            ) {

                color =
                    "#ff986d";

                glow =
                    "#a84e39";

            }


            /* shadow */

            ctx.fillStyle =
                "rgba(0,0,0,.5)";


            ctx.beginPath();

            ctx.ellipse(
                x,
                y + 16,
                enemy.radius + 6,
                9,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();


            /* glow */

            ctx.globalAlpha =
                0.16;


            ctx.fillStyle =
                glow;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                enemy.radius + 13,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.globalAlpha =
                1;


            /* body */

            ctx.fillStyle =
                enemy.hitFlash > 0
                    ? "#ffffff"
                    : color;


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
                "#f5dcff";

            ctx.lineWidth = 2;

            ctx.stroke();


            /* inner core */

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


            /* health background */

            ctx.fillStyle =
                "rgba(0,0,0,.7)";


            ctx.fillRect(
                x - 23,
                y -
                enemy.radius -
                16,
                46,
                5
            );


            /* health */

            ctx.fillStyle =
                color;


            ctx.fillRect(
                x - 23,
                y -
                enemy.radius -
                16,

                46 *
                (
                    enemy.hp /
                    enemy.maxHp
                ),

                5
            );

        }

    }


    /* =====================================================
       BULLETS DRAW
    ===================================================== */

    function drawBullets() {

        for (const bullet of bullets) {

            const x =
                bullet.x -
                camera.x;


            const y =
                bullet.y -
                camera.y;


            const angle =
                Math.atan2(
                    bullet.vy,
                    bullet.vx
                );


            const color =
                bullet.enemy
                    ? "#ff956f"
                    : "#72e0ff";


            /* trail */

            ctx.strokeStyle =
                color;

            ctx.globalAlpha =
                0.25;

            ctx.lineWidth = 4;


            ctx.beginPath();

            ctx.moveTo(
                x -
                Math.cos(angle) * 18,
                y -
                Math.sin(angle) * 18
            );

            ctx.lineTo(
                x,
                y
            );

            ctx.stroke();


            ctx.globalAlpha =
                1;


            /* bullet */

            ctx.fillStyle =
                color;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                4,
                0,
                Math.PI * 2
            );

            ctx.fill();


            /* glow */

            ctx.globalAlpha =
                0.2;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                11,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.globalAlpha =
                1;

        }

    }


    /* =====================================================
       PARTICLES DRAW
    ===================================================== */

    function drawParticles() {

        for (const p of particles) {

            ctx.globalAlpha =
                Math.max(
                    0,
                    p.life /
                    p.maxLife
                );


            if (
                p.type === "smoke"
            ) {

                ctx.fillStyle =
                    "#61757c";

            }

            else if (
                p.type === "flash"
            ) {

                ctx.fillStyle =
                    "#d9f9ff";

            }

            else {

                ctx.fillStyle =
                    "#83e4ff";

            }


            ctx.fillRect(
                p.x -
                camera.x,

                p.y -
                camera.y,

                p.size,

                p.size
            );

        }


        ctx.globalAlpha = 1;

    }


    /* =====================================================
       CROSSHAIR
    ===================================================== */

    function drawCrosshair() {

        if (!gameRunning) {
            return;
        }


        if (paused) {
            return;
        }


        const size =
            8 +
            Math.sin(
                time * 0.008
            ) * 1;


        ctx.strokeStyle =
            "rgba(210,245,255,.8)";

        ctx.lineWidth = 1.5;


        ctx.beginPath();

        ctx.moveTo(
            mouse.x - size - 5,
            mouse.y
        );

        ctx.lineTo(
            mouse.x - size,
            mouse.y
        );

        ctx.moveTo(
            mouse.x + size,
            mouse.y
        );

        ctx.lineTo(
            mouse.x + size + 5,
            mouse.y
        );

        ctx.moveTo(
            mouse.x,
            mouse.y - size - 5
        );

        ctx.lineTo(
            mouse.x,
            mouse.y - size
        );

        ctx.moveTo(
            mouse.x,
            mouse.y + size
        );

        ctx.lineTo(
            mouse.x,
            mouse.y + size + 5
        );

        ctx.stroke();


        ctx.fillStyle =
            "#ffffff";


        ctx.beginPath();

        ctx.arc(
            mouse.x,
            mouse.y,
            1.5,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    /* =====================================================
       HUD
    ===================================================== */

    function updateHUD() {

        if (!player) {
            return;
        }


        const healthPercent =
            Math.max(
                0,
                player.health /
                player.maxHealth *
                100
            );


        const energyPercent =
            Math.max(
                0,
                player.energy /
                player.maxEnergy *
                100
            );


        const healthBar =
            document.getElementById(
                "healthBar"
            );


        const energyBar =
            document.getElementById(
                "energyBar"
            );


        if (healthBar) {

            healthBar.style.width =
                healthPercent +
                "%";

        }


        if (energyBar) {

            energyBar.style.width =
                energyPercent +
                "%";

        }


        const ammo =
            document.getElementById(
                "ammo"
            );


        if (ammo) {

            ammo.textContent =
                player.ammo +
                " / ∞";

        }


        const kills =
            document.getElementById(
                "kills"
            );


        if (kills) {

            kills.textContent =
                "KILLS: " +
                player.kills;

        }


        const credits =
            document.getElementById(
                "credits"
            );


        if (credits) {

            credits.textContent =
                "CREDITS: " +
                player.credits;

        }


        const zone =
            document.getElementById(
                "zone"
            );


        if (zone) {

            zone.textContent =
                "SECTOR " +
                (
                    Math.floor(
                        player.x / 600
                    ) + 1
                ) +
                "-" +
                (
                    Math.floor(
                        player.y / 600
                    ) + 1
                );

        }


        const objective =
            document.getElementById(
                "objective"
            );


        if (objective) {

            if (
                player.kills === 0
            ) {

                objective.textContent =
                    "FIND THE SIGNAL";

            }

            else if (
                player.kills < 5
            ) {

                objective.textContent =
                    "EXPLORE THE SECTOR";

            }

            else if (
                player.kills < 15
            ) {

                objective.textContent =
                    "FOLLOW THE ECHOES";

            }

            else {

                objective.textContent =
                    "THE SIGNAL IS CLOSE";

            }

        }

    }


    /* =====================================================
       ACHIEVEMENT TOAST
    ===================================================== */

    let achievementTimer = null;


    function showAchievement(
        name
    ) {

        if (!achievementToast) {
            return;
        }


        const nameBox =
            document.getElementById(
                "achievementName"
            );


        if (nameBox) {

            nameBox.textContent =
                name;

        }


        achievementToast.classList.add(
            "show"
        );


        if (achievementTimer) {

            clearTimeout(
                achievementTimer
            );

        }


        achievementTimer =
            setTimeout(
                () => {

                    achievementToast.classList.remove(
                        "show"
                    );

                },
                3000
            );

    }


    /* =====================================================
       SMALL MESSAGE
    ===================================================== */

    function showMessage(
        title,
        text
    ) {

        const old =
            document.getElementById(
                "echoMessage"
            );


        if (old) {
            old.remove();
        }


        const message =
            document.createElement("div");


        message.id =
            "echoMessage";


        Object.assign(
            message.style,
            {
                position: "fixed",
                left: "50%",
                bottom: "35px",
                transform: "translateX(-50%)",
                zIndex: "1200",
                minWidth: "260px",
                padding: "15px 20px",
                textAlign: "center",
                borderRadius: "10px",
                background:
                    "rgba(8,20,28,.96)",
                border:
                    "1px solid #4b90aa",
                boxShadow:
                    "0 10px 40px rgba(0,0,0,.6)",
                fontFamily:
                    "Arial, sans-serif"
            }
        );


        message.innerHTML = `
            <div style="
                color:#7bdcff;
                font-weight:bold;
                letter-spacing:2px;
                margin-bottom:5px;
            ">
                ${title}
            </div>

            <div style="
                color:#a7bbc4;
                font-size:13px;
            ">
                ${text}
            </div>
        `;


        document.body.appendChild(
            message
        );


        setTimeout(
            () => {

                if (message) {
                    message.remove();
                }

            },
            2500
        );

    }


    /* =====================================================
       MAP
    ===================================================== */

    if (closeMapButton) {

        closeMapButton.addEventListener(
            "click",
            closeMap
        );

    }


    function toggleMap() {

        if (!mapMenu) {
            return;
        }


        if (
            mapMenu.style.display ===
            "flex"
        ) {

            closeMap();

        }

        else {

            openMap();

        }

    }


    function openMap() {

        if (!mapMenu) {
            return;
        }


        mapMenu.style.display =
            "flex";


        drawMap();

    }


    function closeMap() {

        if (!mapMenu) {
            return;
        }


        mapMenu.style.display =
            "none";

    }


    /* =====================================================
       MAP DRAW
    ===================================================== */

    function drawMap() {

        if (
            !mapCanvas ||
            !mapCtx ||
            !player
        ) {

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


        const sx =
            width /
            WORLD_WIDTH;


        const sy =
            height /
            WORLD_HEIGHT;


        /* grid */

        mapCtx.strokeStyle =
            "rgba(100,180,220,.12)";


        mapCtx.lineWidth = 1;


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
                y * sy
            );

            mapCtx.lineTo(
                width,
                y * sy
            );

            mapCtx.stroke();

        }


        /* walls */

        mapCtx.fillStyle =
            "#31596c";

        mapCtx.strokeStyle =
            "#72c9e8";


        for (const wall of walls) {

            mapCtx.fillRect(
                wall.x * sx,
                wall.y * sy,
                wall.w * sx,
                wall.h * sy
            );


            mapCtx.strokeRect(
                wall.x * sx,
                wall.y * sy,
                wall.w * sx,
                wall.h * sy
            );

        }


        /* scenery */

        mapCtx.fillStyle =
            "#29483f";


        for (const object of scenery) {

            mapCtx.fillRect(
                object.x * sx - 1,
                object.y * sy - 1,
                3,
                3
            );

        }


        /* enemies */

        mapCtx.fillStyle =
            "#c46dff";


        for (const enemy of enemies) {

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


        /* player */

        mapCtx.fillStyle =
            "#75ddff";


        mapCtx.beginPath();

        mapCtx.arc(
            player.x * sx,
            player.y * sy,
            7,
            0,
            Math.PI * 2
        );

        mapCtx.fill();


        mapCtx.strokeStyle =
            "#ffffff";

        mapCtx.lineWidth = 2;

        mapCtx.stroke();

    }


    /* =====================================================
       MAIN UPDATE
    ===================================================== */

    function update(
        delta
    ) {

        if (
            !gameRunning ||
            paused ||
            !player
        ) {

            return;

        }


        updatePlayer();

        updateEnemies();

        updateBullets();

        updatePickups();

        updateParticles();

        updateFloatingTexts();

        updateCamera();


        if (mouse.down) {

            shoot();

        }


        if (
            screenShake > 0
        ) {

            screenShake *=
                0.85;

            if (
                screenShake < 0.1
            ) {

                screenShake = 0;

            }

        }


        updateHUD();

    }


    /* =====================================================
       MAIN DRAW
    ===================================================== */

    function draw() {

        ctx.save();


        /* screen shake */

        if (
            screenShake > 0
        ) {

            ctx.translate(
                (Math.random() - 0.5) *
                screenShake,

                (Math.random() - 0.5) *
                screenShake
            );

        }


        drawWorld();


        if (player) {

            drawPickups();

            drawParticles();

            drawBullets();

            drawEnemies();

            drawPlayer();

            drawFloatingTexts();

            drawLighting();

        }


        ctx.restore();


        drawCrosshair();

    }


    /* =====================================================
       GAME LOOP
    ===================================================== */

    function gameLoop(
        now
    ) {

        const delta =
            Math.min(
                32,
                now - lastTime
            );


        lastTime =
            now;


        time =
            now;


        update(delta);

        draw();


        requestAnimationFrame(
            gameLoop
        );

    }


    requestAnimationFrame(
        gameLoop
    );


    /* =====================================================
       INITIAL HUD
    ===================================================== */

    updateHUD();


    console.log(
        "EchoBound Graphics Upgrade geladen."
    );

})();
