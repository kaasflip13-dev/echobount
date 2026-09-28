"use strict";

/* =====================================================
   ECHOBOUND — THE LOST SIGNAL
   COMPLETE APP.JS
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

let player = null;

let enemies = [];
let bullets = [];
let particles = [];
let pickups = [];

let keys = {};

let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

let camera = {
    x: 0,
    y: 0
};


/* =====================================================
   WORLD
===================================================== */

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 2400;


/* =====================================================
   WALLS
===================================================== */

const walls = [

    { x: 350, y: 350, w: 500, h: 45 },
    { x: 1050, y: 300, w: 45, h: 500 },

    { x: 1450, y: 350, w: 500, h: 45 },
    { x: 1900, y: 400, w: 45, h: 500 },

    { x: 400, y: 950, w: 45, h: 500 },
    { x: 550, y: 1400, w: 550, h: 45 },

    { x: 1250, y: 850, w: 500, h: 45 },
    { x: 1700, y: 900, w: 45, h: 450 },

    { x: 1200, y: 1550, w: 45, h: 500 },
    { x: 1350, y: 1750, w: 500, h: 45 },

    { x: 1950, y: 1500, w: 45, h: 500 },

    { x: 500, y: 2050, w: 600, h: 45 }
];


/* =====================================================
   SAVE
===================================================== */

const SAVE_KEY = "echobound_save_complete_v1";


let achievements = {

    firstEcho: false,
    tenEchoes: false,
    firstSave: false,
    explorer: false,
    survivor: false

};


/* =====================================================
   RESIZE
===================================================== */

window.addEventListener("resize", function () {

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;

});


/* =====================================================
   HTML ELEMENTS
===================================================== */

const menu =
    document.getElementById("menu");

const pauseMenu =
    document.getElementById("pause");

const mapMenu =
    document.getElementById("map");

const achievementBox =
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
   SAFETY CHECK
===================================================== */

console.log("EchoBound app.js geladen");


/* =====================================================
   NEW GAME BUTTON
===================================================== */

if (newGameButton) {

    newGameButton.addEventListener(
        "click",
        function () {

            startNewGame();

        }
    );

}


/* =====================================================
   NEW GAME
===================================================== */

function startNewGame() {

    player = {

        x: 1200,
        y: 1200,

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

        distance: 0

    };


    enemies = [];
    bullets = [];
    particles = [];
    pickups = [];


    /*
       Maak monsters
    */

    for (let i = 0; i < 18; i++) {

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


    console.log(
        "Nieuwe game gestart"
    );

}


/* =====================================================
   CONTINUE BUTTON
===================================================== */

if (loadGameButton) {

    loadGameButton.addEventListener(
        "click",
        function () {

            loadGame();

        }
    );

}


/* =====================================================
   LOAD GAME
===================================================== */

function loadGame() {

    const saved =
        localStorage.getItem(
            SAVE_KEY
        );


    if (!saved) {

        alert(
            "Er is nog geen opgeslagen game."
        );

        return;

    }


    try {

        const data =
            JSON.parse(saved);


        player = data.player;


        if (!player) {

            throw new Error(
                "Speler ontbreekt."
            );

        }


        if (data.achievements) {

            achievements =
                data.achievements;

        }


        enemies = [];
        bullets = [];
        particles = [];
        pickups = [];


        for (let i = 0; i < 18; i++) {

            createEnemy();

        }


        gameRunning = true;
        paused = false;


        if (menu) {
            menu.style.display = "none";
        }


        updateCamera();
        updateHUD();


    } catch (error) {

        console.error(error);

        alert(
            "De opgeslagen game kon niet worden geladen."
        );

    }

}


/* =====================================================
   SAVE BUTTON
===================================================== */

if (saveButton) {

    saveButton.addEventListener(
        "click",
        function () {

            saveGame();

        }
    );

}


/* =====================================================
   SAVE GAME
===================================================== */

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


    if (!achievements.firstSave) {

        achievements.firstSave = true;

        showAchievement(
            "FIRST SAVE"
        );

    } else {

        showAchievement(
            "GAME SAVED"
        );

    }

}


/* =====================================================
   ACHIEVEMENTS BUTTON
===================================================== */

if (achievementsButton) {

    achievementsButton.addEventListener(
        "click",
        function () {

            openAchievements();

        }
    );

}


/* =====================================================
   ACHIEVEMENTS IN WEBSITE
===================================================== */

function openAchievements() {

    let existing =
        document.getElementById(
            "achievementScreen"
        );


    if (existing) {

        existing.remove();

    }


    const screen =
        document.createElement("div");


    screen.id =
        "achievementScreen";


    screen.style.position =
        "fixed";

    screen.style.left =
        "0";

    screen.style.top =
        "0";

    screen.style.width =
        "100%";

    screen.style.height =
        "100%";

    screen.style.zIndex =
        "500";

    screen.style.background =
        "rgba(3,8,13,0.98)";

    screen.style.display =
        "flex";

    screen.style.alignItems =
        "center";

    screen.style.justifyContent =
        "center";


    const box =
        document.createElement("div");


    box.style.width =
        "min(700px, 90vw)";

    box.style.maxHeight =
        "85vh";

    box.style.overflow =
        "auto";

    box.style.padding =
        "35px";

    box.style.background =
        "linear-gradient(145deg,#172b3a,#08121a)";

    box.style.border =
        "1px solid #52758a";

    box.style.borderRadius =
        "20px";

    box.style.boxShadow =
        "0 30px 100px rgba(0,0,0,.8)";


    const title =
        document.createElement("h1");


    title.textContent =
        "ACHIEVEMENTS";


    title.style.textAlign =
        "center";

    title.style.color =
        "#75d5ff";

    title.style.letterSpacing =
        "5px";

    title.style.marginBottom =
        "25px";


    box.appendChild(title);


    const list = [

        [
            "FIRST ECHO",
            "Versla je eerste monster.",
            achievements.firstEcho
        ],

        [
            "TEN ECHOES",
            "Versla 10 monsters.",
            achievements.tenEchoes
        ],

        [
            "FIRST SAVE",
            "Sla je game voor het eerst op.",
            achievements.firstSave
        ],

        [
            "EXPLORER",
            "Leg een grote afstand af.",
            achievements.explorer
        ],

        [
            "SURVIVOR",
            "Bereik 20 kills.",
            achievements.survivor
        ]

    ];


    for (const achievement of list) {

        const row =
            document.createElement("div");


        row.style.padding =
            "18px";

        row.style.marginBottom =
            "10px";

        row.style.borderRadius =
            "10px";

        row.style.border =
            achievement[2]
                ? "1px solid #5bbddd"
                : "1px solid #293d49";

        row.style.background =
            achievement[2]
                ? "rgba(60,150,190,.15)"
                : "rgba(0,0,0,.2)";


        const name =
            document.createElement("div");


        name.textContent =
            (achievement[2] ? "✓ " : "□ ") +
            achievement[0];


        name.style.fontWeight =
            "bold";

        name.style.color =
            achievement[2]
                ? "#7ddcff"
                : "#71818b";

        name.style.fontSize =
            "17px";


        const description =
            document.createElement("div");


        description.textContent =
            achievement[1];


        description.style.marginTop =
            "6px";

        description.style.color =
            "#91a6b2";

        description.style.fontSize =
            "13px";


        row.appendChild(name);

        row.appendChild(description);

        box.appendChild(row);

    }


    const close =
        document.createElement("button");


    close.textContent =
        "TERUG";


    close.style.display =
        "block";

    close.style.width =
        "100%";

    close.style.marginTop =
        "20px";

    close.style.padding =
        "14px";

    close.style.background =
        "#245b78";

    close.style.color =
        "white";

    close.style.border =
        "1px solid #6cccf3";

    close.style.borderRadius =
        "9px";

    close.style.cursor =
        "pointer";

    close.style.fontWeight =
        "bold";

    close.style.fontSize =
        "15px";


    close.onclick =
        function () {

            screen.remove();

        };


    box.appendChild(close);

    screen.appendChild(box);

    document.body.appendChild(screen);

}


/* =====================================================
   CONTROLS
===================================================== */

if (controlsButton) {

    controlsButton.addEventListener(
        "click",
        function () {

            alert(
                "BESTURING\n\n" +
                "W A S D = bewegen\n\n" +
                "MU IS = richten\n\n" +
                "LINKERMUIS = schieten\n\n" +
                "SPACE = dash\n\n" +
                "M = map\n\n" +
                "ESC = pauze"
            );

        }
    );

}


/* =====================================================
   PAUSE
===================================================== */

if (resumeButton) {

    resumeButton.addEventListener(
        "click",
        function () {

            paused = false;

            if (pauseMenu) {

                pauseMenu.style.display =
                    "none";

            }

        }
    );

}


if (quitButton) {

    quitButton.addEventListener(
        "click",
        function () {

            if (player) {

                saveGame();

            }


            gameRunning = false;

            paused = false;


            if (pauseMenu) {

                pauseMenu.style.display =
                    "none";

            }


            if (menu) {

                menu.style.display =
                    "flex";

            }

        }
    );

}


/* =====================================================
   KEYBOARD
===================================================== */

window.addEventListener(
    "keydown",
    function (event) {

        const key =
            event.key.toLowerCase();


        keys[key] = true;


        if (event.code === "Space") {

            keys.space = true;

            event.preventDefault();

        }


        if (key === "escape") {

            if (gameRunning) {

                togglePause();

            }

        }


        if (key === "m") {

            if (
                gameRunning &&
                !paused
            ) {

                toggleMap();

            }

        }

    }
);


window.addEventListener(
    "keyup",
    function (event) {

        const key =
            event.key.toLowerCase();


        keys[key] = false;


        if (event.code === "Space") {

            keys.space = false;

        }

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

        if (event.button === 0) {

            mouse.down = true;

        }

    }
);


window.addEventListener(
    "mouseup",
    function (event) {

        if (event.button === 0) {

            mouse.down = false;

        }

    }
);


/* =====================================================
   COLLISION HELPERS
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
        dy * dy
        <
        radius * radius
    );

}


/* =====================================================
   LINE / WALL COLLISION
===================================================== */

function segmentIntersectsRect(
    x1,
    y1,
    x2,
    y2,
    rect
) {

    const steps =
        12;


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
            x >= rect.x &&
            x <= rect.x + rect.w &&
            y >= rect.y &&
            y <= rect.y + rect.h
        ) {

            return true;

        }

    }


    return false;

}


/* =====================================================
   PLAYER CAN MOVE
===================================================== */

function playerCanMoveTo(
    x,
    y
) {

    if (
        x - player.radius < 0 ||
        x + player.radius > WORLD_WIDTH ||
        y - player.radius < 0 ||
        y + player.radius > WORLD_HEIGHT
    ) {

        return false;

    }


    for (const wall of walls) {

        if (
            circleIntersectsRect(
                x,
                y,
                player.radius,
                wall
            )
        ) {

            return false;

        }

    }


    return true;

}


/* =====================================================
   ENEMY CAN MOVE
===================================================== */

function enemyCanMoveTo(
    enemy,
    x,
    y
) {

    for (const wall of walls) {

        if (
            circleIntersectsRect(
                x,
                y,
                enemy.radius,
                wall
            )
        ) {

            return false;

        }

    }


    return true;

}


/* =====================================================
   CREATE ENEMY
===================================================== */

function createEnemy() {

    if (!player) {

        return;

    }


    let x;
    let y;

    let attempts = 0;


    do {

        x =
            80 +
            Math.random() *
            (WORLD_WIDTH - 160);


        y =
            80 +
            Math.random() *
            (WORLD_HEIGHT - 160);


        attempts++;


    } while (

        (
            Math.hypot(
                x - player.x,
                y - player.y
            ) < 450

            ||

            walls.some(
                wall =>
                    circleIntersectsRect(
                        x,
                        y,
                        25,
                        wall
                    )
            )
        )

        &&

        attempts < 200

    );


    const random =
        Math.random();


    let enemy;


    if (random > 0.85) {

        enemy = {

            x: x,
            y: y,

            radius: 23,

            speed: 0.55,

            hp: 5,

            maxHp: 5,

            cooldown:
                80 +
                Math.random() * 80,

            type: "heavy"

        };

    }

    else if (random > 0.60) {

        enemy = {

            x: x,
            y: y,

            radius: 19,

            speed: 0.75,

            hp: 3,

            maxHp: 3,

            cooldown:
                70 +
                Math.random() * 80,

            type: "mid"

        };

    }

    else {

        enemy = {

            x: x,
            y: y,

            radius: 16,

            speed: 0.95,

            hp: 2,

            maxHp: 2,

            cooldown:
                70 +
                Math.random() * 100,

            type: "light"

        };

    }


    enemies.push(enemy);

}


/* =====================================================
   PLAYER UPDATE
===================================================== */

function updatePlayer() {

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

        player.dashTimer = 12;

        player.energy -= 25;

        player.dashCooldown = 70;

        player.invincible = 25;

        keys.space = false;


        createParticles(
            player.x,
            player.y,
            25
        );

    }


    let speed =
        player.speed;


    if (player.dashTimer > 0) {

        speed = 11;

        player.dashTimer--;

    }


    if (moving) {

        const moveX =
            dx * speed;


        const moveY =
            dy * speed;


        /*
           Eerst horizontaal.
           Daarna verticaal.
           Hierdoor kan je langs muren lopen.
        */

        if (
            playerCanMoveTo(
                player.x + moveX,
                player.y
            )
        ) {

            player.x += moveX;

        }


        if (
            playerCanMoveTo(
                player.x,
                player.y + moveY
            )
        ) {

            player.y += moveY;

        }


        player.distance +=
            speed;


        if (
            player.distance >= 5000 &&
            !achievements.explorer
        ) {

            achievements.explorer = true;

            showAchievement(
                "EXPLORER"
            );

        }

    }


    if (player.cooldown > 0) {

        player.cooldown--;

    }


    if (player.dashCooldown > 0) {

        player.dashCooldown--;

    }


    if (player.invincible > 0) {

        player.invincible--;

    }


    player.energy =
        Math.min(
            player.maxEnergy,
            player.energy + 0.12
        );

}


/* =====================================================
   SHOOT
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

    player.cooldown = 9;


    bullets.push({

        x:
            player.x +
            Math.cos(angle) *
            25,

        y:
            player.y +
            Math.sin(angle) *
            25,

        oldX:
            player.x,

        oldY:
            player.y,

        vx:
            Math.cos(angle) * 11,

        vy:
            Math.sin(angle) * 11,

        enemy: false,

        life: 120

    });


    createParticles(
        player.x +
        Math.cos(angle) * 25,

        player.y +
        Math.sin(angle) * 25,

        4
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


        /* MOVE */

        if (
            distance > 70 &&
            distance > 0
        ) {

            const moveX =
                dx /
                distance *
                enemy.speed;


            const moveY =
                dy /
                distance *
                enemy.speed;


            if (
                enemyCanMoveTo(
                    enemy,
                    enemy.x + moveX,
                    enemy.y
                )
            ) {

                enemy.x += moveX;

            }


            if (
                enemyCanMoveTo(
                    enemy,
                    enemy.x,
                    enemy.y + moveY
                )
            ) {

                enemy.y += moveY;

            }

        }


        /* SHOOT */

        if (
            distance < 700
        ) {

            enemy.cooldown--;


            if (
                enemy.cooldown <= 0
            ) {

                enemy.cooldown =
                    100 +
                    Math.random() *
                    100;


                /*
                   Enemy kan alleen schieten
                   als er geen muur tussen zit.
                */

                let blocked =
                    false;


                for (const wall of walls) {

                    if (
                        segmentIntersectsRect(
                            enemy.x,
                            enemy.y,
                            player.x,
                            player.y,
                            wall
                        )
                    ) {

                        blocked = true;

                        break;

                    }

                }


                if (!blocked) {

                    const angle =
                        Math.atan2(
                            player.y - enemy.y,
                            player.x - enemy.x
                        );


                    let speed = 3.2;


                    if (
                        enemy.type === "mid"
                    ) {

                        speed = 3.5;

                    }


                    if (
                        enemy.type === "heavy"
                    ) {

                        speed = 2.8;

                    }


                    bullets.push({

                        x: enemy.x,

                        y: enemy.y,

                        oldX: enemy.x,

                        oldY: enemy.y,

                        vx:
                            Math.cos(angle) *
                            speed,

                        vy:
                            Math.sin(angle) *
                            speed,

                        enemy: true,

                        life: 180

                    });

                }

            }

        }


        /* CONTACT */

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

        let hitWall =
            false;


        for (const wall of walls) {

            if (
                segmentIntersectsRect(
                    bullet.oldX,
                    bullet.oldY,
                    bullet.x,
                    bullet.y,
                    wall
                )
            ) {

                hitWall = true;

                break;

            }

        }


        if (hitWall) {

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


        /* ENEMY BULLET */

        if (bullet.enemy) {

            if (
                Math.hypot(
                    bullet.x - player.x,
                    bullet.y - player.y
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


                    createParticles(
                        enemy.x,
                        enemy.y,
                        8
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

function enemyDefeated(index) {

    const enemy =
        enemies[index];


    if (!enemy) {

        return;

    }


    player.kills++;


    if (
        enemy.type === "heavy"
    ) {

        player.credits += 30;

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


    if (
        Math.random() < 0.25
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


    createParticles(
        enemy.x,
        enemy.y,
        18
    );


    enemies.splice(
        index,
        1
    );


    createEnemy();

}


/* =====================================================
   PLAYER DAMAGE
===================================================== */

function damagePlayer(amount) {

    if (
        player.invincible > 0
    ) {

        return;

    }


    player.health -= amount;

    player.invincible = 30;


    createParticles(
        player.x,
        player.y,
        10
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

    mouse.down = false;


    setTimeout(
        function () {

            const again =
                confirm(
                    "GAME OVER\n\n" +
                    "KILLS: " +
                    player.kills +
                    "\nCREDITS: " +
                    player.credits +
                    "\n\nOpnieuw spelen?"
                );


            if (again) {

                startNewGame();

            }

            else {

                if (menu) {

                    menu.style.display =
                        "flex";

                }

            }

        },
        200
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
            distance < 35
        ) {

            if (
                pickup.type ===
                "energy"
            ) {

                player.energy =
                    Math.min(
                        player.maxEnergy,
                        player.energy + 30
                    );

            }

            else {

                player.credits += 25;

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

            x: x,

            y: y,

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


        p.vx *= 0.97;

        p.vy *= 0.97;


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
   DRAW WORLD
===================================================== */

function drawWorld() {

    ctx.fillStyle =
        "#0b151c";


    ctx.fillRect(
        0,
        0,
        W,
        H
    );


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
        let worldX = startX;

        worldX <
        camera.x + W + gridSize;

        worldX += gridSize
    ) {

        for (
            let worldY = startY;

            worldY <
            camera.y + H + gridSize;

            worldY += gridSize
        ) {

            const screenX =
                worldX -
                camera.x;


            const screenY =
                worldY -
                camera.y;


            const sector =
                Math.floor(
                    worldX / 500
                ) +
                Math.floor(
                    worldY / 500
                );


            const colors = [
                "#111f25",
                "#122329",
                "#151e27",
                "#101b23"
            ];


            ctx.fillStyle =
                colors[
                    ((sector % 4) + 4) % 4
                ];


            ctx.fillRect(
                screenX,
                screenY,
                gridSize,
                gridSize
            );

        }

    }


    /* GRID */

    ctx.strokeStyle =
        "rgba(120,190,220,0.06)";


    ctx.lineWidth = 1;


    for (
        let x =
            -(camera.x % 100);

        x < W;

        x += 100
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);

        ctx.lineTo(x, H);

        ctx.stroke();

    }


    for (
        let y =
            -(camera.y % 100);

        y < H;

        y += 100
    ) {

        ctx.beginPath();

        ctx.moveTo(0, y);

        ctx.lineTo(W, y);

        ctx.stroke();

    }


    drawWalls();


    /* BORDER */

    ctx.strokeStyle =
        "rgba(100,190,230,0.35)";

    ctx.lineWidth = 4;


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
            x + 7,
            y + 7,
            wall.w,
            wall.h
        );


        /* body */

        ctx.fillStyle =
            "#172d3a";


        ctx.fillRect(
            x,
            y,
            wall.w,
            wall.h
        );


        /* border */

        ctx.strokeStyle =
            "#4b8199";


        ctx.lineWidth = 3;


        ctx.strokeRect(
            x,
            y,
            wall.w,
            wall.h
        );


        /* energy line */

        ctx.strokeStyle =
            "#65c9ed";


        ctx.lineWidth = 2;


        if (wall.w > wall.h) {

            ctx.beginPath();

            ctx.moveTo(
                x + 10,
                y + wall.h / 2
            );

            ctx.lineTo(
                x + wall.w - 10,
                y + wall.h / 2
            );

            ctx.stroke();

        }

        else {

            ctx.beginPath();

            ctx.moveTo(
                x + wall.w / 2,
                y + 10
            );

            ctx.lineTo(
                x + wall.w / 2,
                y + wall.h - 10
            );

            ctx.stroke();

        }

    }

}


/* =====================================================
   DRAW PICKUPS
===================================================== */

function drawPickups() {

    for (const pickup of pickups) {

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
            performance.now() / 500
        );


        ctx.fillStyle =
            pickup.type === "energy"
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


    const mouseWorldX =
        camera.x +
        mouse.x;


    const mouseWorldY =
        camera.y +
        mouse.y;


    const angle =
        Math.atan2(
            mouseWorldY - player.y,
            mouseWorldX - player.x
        );


    /* shadow */

    ctx.fillStyle =
        "rgba(0,0,0,.4)";


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


    /* ring */

    ctx.strokeStyle =
        "rgba(90,210,255,.3)";

    ctx.lineWidth = 3;


    ctx.beginPath();

    ctx.arc(
        x,
        y,
        27,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    /* body */

    ctx.fillStyle =
        player.invincible > 0
            ? "#ffffff"
            : "#71cfff";


    ctx.beginPath();

    ctx.arc(
        x,
        y,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* weapon */

    ctx.strokeStyle =
        "#e8f8ff";

    ctx.lineWidth = 7;


    ctx.beginPath();

    ctx.moveTo(
        x,
        y
    );

    ctx.lineTo(
        x +
        Math.cos(angle) * 32,

        y +
        Math.sin(angle) * 32
    );

    ctx.stroke();


    /* core */

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

    for (const enemy of enemies) {

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
            enemy.type === "mid"
        ) {

            color =
                "#d18cff";

            glow =
                "#934cc7";

        }


        if (
            enemy.type === "heavy"
        ) {

            color =
                "#ff9c69";

            glow =
                "#bc6240";

        }


        /* shadow */

        ctx.fillStyle =
            "rgba(0,0,0,.4)";


        ctx.beginPath();

        ctx.ellipse(
            x,
            y + 13,
            enemy.radius + 4,
            8,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();


        /* glow */

        ctx.globalAlpha =
            .18;


        ctx.fillStyle =
            glow;


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


        /* body */

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
            "#f1d7ff";

        ctx.lineWidth = 2;

        ctx.stroke();


        /* eye */

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


        /* health */

        ctx.fillStyle =
            "#080c10";


        ctx.fillRect(
            x - 20,
            y - enemy.radius - 12,
            40,
            4
        );


        ctx.fillStyle =
            color;


        ctx.fillRect(
            x - 20,
            y - enemy.radius - 12,

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
   DRAW BULLETS
===================================================== */

function drawBullets() {

    for (const bullet of bullets) {

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


        ctx.globalAlpha =
            .25;


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            10,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.globalAlpha =
            1;

    }

}


/* =====================================================
   DRAW PARTICLES
===================================================== */

function drawParticles() {

    for (const p of particles) {

        ctx.globalAlpha =
            Math.max(
                0,
                p.life / 40
            );


        ctx.fillStyle =
            "#9feaff";


        ctx.fillRect(
            p.x - camera.x,
            p.y - camera.y,
            p.size,
            p.size
        );

    }


    ctx.globalAlpha =
        1;

}


/* =====================================================
   HUD
===================================================== */

function updateHUD() {

    if (!player) {

        return;

    }


    const health =
        Math.max(
            0,
            player.health /
            player.maxHealth *
            100
        );


    const energy =
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
            health + "%";

    }


    if (energyBar) {

        energyBar.style.width =
            energy + "%";

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
            (Math.floor(player.x / 600) + 1) +
            "-" +
            (Math.floor(player.y / 600) + 1);

    }


    const objective =
        document.getElementById(
            "objective"
        );


    if (objective) {

        if (player.kills === 0) {

            objective.textContent =
                "FIND THE SIGNAL";

        }

        else if (player.kills < 5) {

            objective.textContent =
                "EXPLORE THE SECTOR";

        }

        else {

            objective.textContent =
                "FOLLOW THE ECHOES";

        }

    }

}


/* =====================================================
   ACHIEVEMENT POPUP
===================================================== */

let achievementTimer = null;


function showAchievement(name) {

    if (
        !achievementBox
    ) {

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


    achievementBox.classList.add(
        "show"
    );


    if (achievementTimer) {

        clearTimeout(
            achievementTimer
        );

    }


    achievementTimer =
        setTimeout(
            function () {

                achievementBox.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =====================================================
   MAP
===================================================== */

if (closeMapButton) {

    closeMapButton.addEventListener(
        "click",
        function () {

            closeMap();

        }
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
   DRAW MAP
===================================================== */

function drawMap() {

    if (!player) {

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


    /* GRID */

    mapCtx.strokeStyle =
        "rgba(100,180,220,.12)";


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


    /* WALLS */

    mapCtx.fillStyle =
        "#31576a";


    mapCtx.strokeStyle =
        "#6bc7eb";


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


    /* ENEMIES */

    mapCtx.fillStyle =
        "#c06cff";


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


    /* PLAYER */

    mapCtx.fillStyle =
        "#72d8ff";


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

    updateBullets();

    updatePickups();

    updateParticles();

    updateCamera();


    if (mouse.down) {

        shoot();

    }


    updateHUD();

}


/* =====================================================
   DRAW
===================================================== */

function draw() {

    drawWorld();


    if (!player) {

        return;

    }


    drawPickups();

    drawParticles();

    drawBullets();

    drawEnemies();

    drawPlayer();

}


/* =====================================================
   GAME LOOP
===================================================== */

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );

}


gameLoop();


/* =====================================================
   STARTUP
===================================================== */

updateHUD();

console.log(
    "EchoBound is klaar."
);
