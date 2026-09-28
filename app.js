"use strict";

/* =====================================================
   ECHOBOUND — THE LOST SIGNAL
   Complete game JavaScript
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

let camera = {
    x: 0,
    y: 0
};

let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};


/* =====================================================
   WORLD
===================================================== */

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 2400;


/* =====================================================
   MUREN
===================================================== */

const walls = [

    { x: 520, y: 420, w: 430, h: 55 },

    { x: 1040, y: 300, w: 55, h: 520 },

    { x: 1370, y: 520, w: 480, h: 55 },

    { x: 1480, y: 980, w: 55, h: 570 },

    { x: 820, y: 1500, w: 520, h: 55 },

    { x: 410, y: 1050, w: 55, h: 430 },

    { x: 1080, y: 1000, w: 55, h: 300 },

    { x: 610, y: 1850, w: 460, h: 55 },

    { x: 1760, y: 1680, w: 430, h: 55 },

    { x: 1860, y: 760, w: 55, h: 430 }

];


/* =====================================================
   SAVE DATA
===================================================== */

const SAVE_KEY = "echobound_save_v3";


let achievements = {

    firstEcho: false,

    tenEchoes: false,

    firstSave: false,

    explorer: false

};


/* =====================================================
   COLLISION
===================================================== */

function circleIntersectsRect(
    cx,
    cy,
    radius,
    rect
) {

    const closestX =
        Math.max(
            rect.x,
            Math.min(
                cx,
                rect.x + rect.w
            )
        );


    const closestY =
        Math.max(
            rect.y,
            Math.min(
                cy,
                rect.y + rect.h
            )
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


/*
    Controleert of een kogel
    een muur doorkruist.
*/

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
        )
        ||
        pointInRect(
            x2,
            y2,
            rect
        )
    ) {

        return true;

    }


    const dx = x2 - x1;
    const dy = y2 - y1;


    let tMin = 0;
    let tMax = 1;


    const values = [

        [-dx, x1 - rect.x],

        [dx, rect.x + rect.w - x1],

        [-dy, y1 - rect.y],

        [dy, rect.y + rect.h - y1]

    ];


    for (
        const [p, q]
        of values
    ) {

        if (p === 0) {

            if (q < 0) {

                return false;

            }

            continue;

        }


        const t =
            q / p;


        if (p < 0) {

            if (t > tMax) {

                return false;

            }


            if (t > tMin) {

                tMin = t;

            }

        } else {

            if (t < tMin) {

                return false;

            }


            if (t < tMax) {

                tMax = t;

            }

        }

    }


    return true;

}


function collidesWithWall(
    x,
    y,
    radius
) {

    for (
        const wall
        of walls
    ) {

        if (
            circleIntersectsRect(
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


/*
    Beweging met collision.
*/

function moveCircleWithCollision(
    entity,
    dx,
    dy
) {

    const nextX =
        entity.x + dx;


    const nextY =
        entity.y + dy;


    /*
        Eerst X
    */

    if (
        !collidesWithWall(
            nextX,
            entity.y,
            entity.radius
        )
    ) {

        entity.x = nextX;

    }


    /*
        Daarna Y
    */

    if (
        !collidesWithWall(
            entity.x,
            nextY,
            entity.radius
        )
    ) {

        entity.y = nextY;

    }


    /*
        Wereldgrenzen
    */

    entity.x =
        Math.max(
            entity.radius,

            Math.min(
                WORLD_WIDTH -
                entity.radius,

                entity.x
            )
        );


    entity.y =
        Math.max(
            entity.radius,

            Math.min(
                WORLD_HEIGHT -
                entity.radius,

                entity.y
            )
        );

}


/*
    Kogel tegen muur?
*/

function bulletHitsWall(
    x1,
    y1,
    x2,
    y2
) {

    for (
        const wall
        of walls
    ) {

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
   BUTTONS
===================================================== */

const newGameButton =
    document.getElementById(
        "newGame"
    );


const loadGameButton =
    document.getElementById(
        "loadGame"
    );


const achievementsButton =
    document.getElementById(
        "achievementsButton"
    );


const controlsButton =
    document.getElementById(
        "controlsButton"
    );


const resumeButton =
    document.getElementById(
        "resume"
    );


const saveButton =
    document.getElementById(
        "save"
    );


const quitButton =
    document.getElementById(
        "quit"
    );


const closeMapButton =
    document.getElementById(
        "closeMap"
    );


/* =====================================================
   NEW GAME
===================================================== */

newGameButton.addEventListener(
    "click",
    startNewGame
);


function startNewGame() {

    player = {

        x: WORLD_WIDTH / 2,

        y: WORLD_HEIGHT / 2,

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

    mouse.down = false;


    /*
        Vijanden maken
    */

    for (
        let i = 0;
        i < 18;
        i++
    ) {

        createEnemy();

    }


    gameRunning = true;

    paused = false;


    document.getElementById(
        "menu"
    ).style.display = "none";


    document.getElementById(
        "pause"
    ).style.display = "none";


    document.getElementById(
        "map"
    ).style.display = "none";


    updateHUD();

}


/* =====================================================
   CONTINUE
===================================================== */

loadGameButton.addEventListener(
    "click",
    loadGame
);


function loadGame() {

    const save =
        localStorage.getItem(
            SAVE_KEY
        );


    if (!save) {

        alert(
            "Er is nog geen opgeslagen run."
        );

        return;

    }


    try {

        const data =
            JSON.parse(save);


        player =
            data.player;


        if (!player) {

            throw new Error(
                "Geen speler gevonden."
            );

        }


        /*
            Oude saves aanvullen
        */

        player.radius =
            player.radius || 18;


        player.maxHealth =
            player.maxHealth || 100;


        player.maxEnergy =
            player.maxEnergy || 100;


        player.speed =
            player.speed || 3.5;


        player.ammo =
            typeof player.ammo === "number"
                ? player.ammo
                : 12;


        player.kills =
            typeof player.kills === "number"
                ? player.kills
                : 0;


        player.credits =
            typeof player.credits === "number"
                ? player.credits
                : 0;


        player.cooldown = 0;

        player.dashCooldown = 0;

        player.dashTimer = 0;

        player.invincible = 0;

        player.distance =
            player.distance || 0;


        if (data.achievements) {

            achievements = {

                ...achievements,

                ...data.achievements

            };

        }


        /*
            Mocht de speler in een muur
            staan door een oude save.
        */

        if (
            collidesWithWall(
                player.x,
                player.y,
                player.radius
            )
        ) {

            player.x =
                WORLD_WIDTH / 2;


            player.y =
                WORLD_HEIGHT / 2;

        }


        enemies = [];

        bullets = [];

        particles = [];

        pickups = [];

        mouse.down = false;


        for (
            let i = 0;
            i < 18;
            i++
        ) {

            createEnemy();

        }


        gameRunning = true;

        paused = false;


        document.getElementById(
            "menu"
        ).style.display = "none";


        document.getElementById(
            "pause"
        ).style.display = "none";


        document.getElementById(
            "map"
        ).style.display = "none";


        updateHUD();

    } catch (error) {

        console.error(error);

        alert(
            "De opgeslagen game kon niet worden geladen."
        );

    }

}


/* =====================================================
   SAVE
===================================================== */

saveButton.addEventListener(
    "click",
    saveGame
);


function saveGame() {

    if (!player) {

        alert(
            "Je hebt nog geen run gestart."
        );

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

}


/* =====================================================
   ACHIEVEMENTS
===================================================== */

achievementsButton.addEventListener(
    "click",
    showAchievements
);


function showAchievements() {

    let text =
        "ACHIEVEMENTS\n\n";


    text +=
        achievements.firstEcho
            ? "✓ FIRST ECHO\n"
            : "□ FIRST ECHO\n";


    text +=
        "Versla je eerste vijand.\n\n";


    text +=
        achievements.tenEchoes
            ? "✓ TEN ECHOES\n"
            : "□ TEN ECHOES\n";


    text +=
        "Versla 10 vijanden.\n\n";


    text +=
        achievements.firstSave
            ? "✓ FIRST SAVE\n"
            : "□ FIRST SAVE\n";


    text +=
        "Sla je run op.\n\n";


    text +=
        achievements.explorer
            ? "✓ EXPLORER\n"
            : "□ EXPLORER\n";


    text +=
        "Leg een grote afstand af.";


    alert(text);

}


/* =====================================================
   CONTROLS
===================================================== */

controlsButton.addEventListener(
    "click",
    function () {

        alert(

            "BESTURING\n\n" +

            "W A S D\n" +
            "Bewegen\n\n" +

            "MUIS\n" +
            "Richten\n\n" +

            "LINKERMUISKNOP\n" +
            "Schieten\n\n" +

            "SPACE\n" +
            "Dash\n\n" +

            "M\n" +
            "Kaart\n\n" +

            "ESC\n" +
            "Pauzeren\n\n" +

            "MUREN\n" +
            "Blokkeren beweging en kogels"

        );

    }
);


/* =====================================================
   PAUSE
===================================================== */

resumeButton.addEventListener(
    "click",
    function () {

        paused = false;


        document.getElementById(
            "pause"
        ).style.display =
            "none";

    }
);


quitButton.addEventListener(
    "click",
    function () {

        if (player) {

            saveGame();

        }


        gameRunning = false;

        paused = false;

        mouse.down = false;


        document.getElementById(
            "pause"
        ).style.display =
            "none";


        document.getElementById(
            "map"
        ).style.display =
            "none";


        document.getElementById(
            "menu"
        ).style.display =
            "flex";

    }
);


/* =====================================================
   KEYBOARD
===================================================== */

window.addEventListener(
    "keydown",
    function (event) {

        const key =
            event.key.toLowerCase();


        keys[key] = true;


        /*
            SPACE
        */

        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            keys.space = true;

        }


        /*
            ESC
        */

        if (
            key === "escape"
        ) {

            if (gameRunning) {

                if (
                    document.getElementById(
                        "map"
                    ).style.display === "flex"
                ) {

                    closeMap();

                    return;

                }


                paused =
                    !paused;


                document.getElementById(
                    "pause"
                ).style.display =
                    paused
                        ? "flex"
                        : "none";

            }

        }


        /*
            MAP
        */

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

            mouse.down = true;

        }

    }
);


window.addEventListener(
    "mouseup",
    function (event) {

        if (
            event.button === 0
        ) {

            mouse.down = false;

        }

    }
);


/* =====================================================
   MAP
===================================================== */

closeMapButton.addEventListener(
    "click",
    closeMap
);


function toggleMap() {

    const map =
        document.getElementById(
            "map"
        );


    if (
        map.style.display === "flex"
    ) {

        closeMap();

    } else {

        openMap();

    }

}


function openMap() {

    document.getElementById(
        "map"
    ).style.display =
        "flex";


    drawMap();

}


function closeMap() {

    document.getElementById(
        "map"
    ).style.display =
        "none";

}


/* =====================================================
   CREATE ENEMY
===================================================== */

function createEnemy() {

    if (!player) {

        return;

    }


    let x = 0;
    let y = 0;

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
            ) < 400

            ||

            collidesWithWall(
                x,
                y,
                22
            )

        )

        &&

        attempts < 200

    );


    const type =
        Math.random();


    let enemy;


    if (
        type > 0.85
    ) {

        enemy = {

            x: x,

            y: y,

            radius: 21,

            speed: 0.55,

            hp: 4,

            maxHp: 4,

            cooldown:
                60 +
                Math.random() *
                80,

            type: "heavy"

        };

    }


    else if (
        type > 0.6
    ) {

        enemy = {

            x: x,

            y: y,

            radius: 18,

            speed: 0.75,

            hp: 3,

            maxHp: 3,

            cooldown:
                60 +
                Math.random() *
                80,

            type: "mid"

        };

    }


    else {

        enemy = {

            x: x,

            y: y,

            radius: 16,

            speed: 0.9,

            hp: 2,

            maxHp: 2,

            cooldown:
                80 +
                Math.random() *
                100,

            type: "light"

        };

    }


    enemies.push(
        enemy
    );

}


/* =====================================================
   PLAYER
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


    if (
        dx !== 0 ||
        dy !== 0
    ) {

        const length =
            Math.hypot(
                dx,
                dy
            );


        dx /= length;

        dy /= length;


        let speed =
            player.speed;


        /*
            DASH
        */

        if (
            player.dashTimer > 0
        ) {

            speed = 11;

            player.dashTimer--;

        }


        const oldX =
            player.x;


        const oldY =
            player.y;


        moveCircleWithCollision(

            player,

            dx * speed,

            dy * speed

        );


        const moved =
            Math.hypot(

                player.x - oldX,

                player.y - oldY

            );


        player.distance +=
            moved;


        if (
            player.distance > 5000 &&
            !achievements.explorer
        ) {

            achievements.explorer =
                true;


            showAchievement(
                "EXPLORER"
            );

        }

    }


    /*
        DASH START
    */

    if (

        keys.space &&

        player.dashCooldown <= 0 &&

        player.energy >= 25 &&

        (
            dx !== 0 ||
            dy !== 0
        )

    ) {

        player.dashTimer = 10;

        player.energy -= 25;

        player.dashCooldown = 70;

        player.invincible = 25;


        createParticles(
            player.x,
            player.y,
            25
        );


        keys.space = false;

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
   SHOOT
===================================================== */

function shoot() {

    if (
        !player ||
        player.cooldown > 0 ||
        paused
    ) {

        return;

    }


    if (
        player.ammo <= 0
    ) {

        player.ammo = 12;

        return;

    }


    player.ammo--;

    player.cooldown = 9;


    const worldX =
        camera.x +
        mouse.x;


    const worldY =
        camera.y +
        mouse.y;


    const angle =
        Math.atan2(

            worldY -
            player.y,

            worldX -
            player.x

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
            11,

        vy:
            Math.sin(angle) *
            11,

        enemy: false,

        life: 100

    });


    createParticles(

        player.x +
        Math.cos(angle) *
        25,

        player.y +
        Math.sin(angle) *
        25,

        4

    );

}


/* =====================================================
   ENEMIES
===================================================== */

function updateEnemies() {

    for (
        const enemy
        of enemies
    ) {

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


        /*
            Vijanden lopen ook
            niet door muren.
        */

        if (
            distance > 65 &&
            distance > 0
        ) {

            moveCircleWithCollision(

                enemy,

                dx /
                distance *
                enemy.speed,

                dy /
                distance *
                enemy.speed

            );

        }


        /*
            SHOOT
        */

        if (
            distance < 650
        ) {

            enemy.cooldown--;


            if (
                enemy.cooldown <= 0
            ) {

                enemy.cooldown =
                    100 +
                    Math.random() *
                    100;


                const angle =
                    Math.atan2(

                        player.y -
                        enemy.y,

                        player.x -
                        enemy.x

                    );


                let speed =
                    3.3;


                if (
                    enemy.type ===
                    "mid"
                ) {

                    speed = 3.7;

                }


                if (
                    enemy.type ===
                    "heavy"
                ) {

                    speed = 3.0;

                }


                bullets.push({

                    x:
                        enemy.x,

                    y:
                        enemy.y,

                    vx:
                        Math.cos(angle) *
                        speed,

                    vy:
                        Math.sin(angle) *
                        speed,

                    enemy: true,

                    life: 160

                });

            }

        }


        /*
            CONTACT
        */

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


        const oldX =
            bullet.x;


        const oldY =
            bullet.y;


        bullet.x +=
            bullet.vx;


        bullet.y +=
            bullet.vy;


        bullet.life--;


        /*
            MUUR HIT
        */

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
                6

            );


            bullets.splice(
                i,
                1
            );


            continue;

        }


        /*
            ENEMY BULLET
        */

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

                player.radius + 6

            ) {

                damagePlayer(8);


                bullets.splice(
                    i,
                    1
                );


                continue;

            }

        }


        /*
            PLAYER BULLET
        */

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


        /*
            BULLET VERWIJDEREN
        */

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


    player.kills++;


    if (
        enemy.type ===
        "heavy"
    ) {

        player.credits +=
            30;

    }

    else if (
        enemy.type ===
        "mid"
    ) {

        player.credits +=
            20;

    }

    else {

        player.credits +=
            10;

    }


    /*
        Achievement 1
    */

    if (
        !achievements.firstEcho
    ) {

        achievements.firstEcho =
            true;


        showAchievement(
            "FIRST ECHO"
        );

    }


    /*
        Achievement 2
    */

    if (

        player.kills >= 10 &&

        !achievements.tenEchoes

    ) {

        achievements.tenEchoes =
            true;


        showAchievement(
            "TEN ECHOES"
        );

    }


    /*
        Pickup
    */

    if (
        Math.random() < 0.25
    ) {

        pickups.push({

            x:
                enemy.x,

            y:
                enemy.y,

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
        !player ||
        player.invincible > 0 ||
        !gameRunning
    ) {

        return;

    }


    player.health -=
        amount;


    player.invincible =
        30;


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

    gameRunning =
        false;


    mouse.down =
        false;


    setTimeout(

        function () {

            const retry =
                confirm(

                    "GAME OVER\n\n" +

                    "KILLS: " +
                    player.kills +

                    "\nCREDITS: " +
                    player.credits +

                    "\n\nOpnieuw spelen?"

                );


            if (retry) {

                startNewGame();

            }

            else {

                document.getElementById(
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

                        player.energy +
                        30

                    );

            }

            else {

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

                WORLD_WIDTH -
                W,

                camera.x

            )

        );


    camera.y =
        Math.max(

            0,

            Math.min(

                WORLD_HEIGHT -
                H,

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


    const gridSize =
        100;


    const startX =

        Math.floor(

            camera.x /
            gridSize

        ) *

        gridSize;


    const startY =

        Math.floor(

            camera.y /
            gridSize

        ) *

        gridSize;


    for (

        let worldX =
            startX;

        worldX <
            camera.x +
            W +
            gridSize;

        worldX +=
            gridSize

    ) {

        for (

            let worldY =
                startY;

            worldY <
                camera.y +
                H +
                gridSize;

            worldY +=
                gridSize

        ) {

            const screenX =
                worldX -
                camera.x;


            const screenY =
                worldY -
                camera.y;


            const sector =

                Math.floor(
                    worldX /
                    500
                )

                +

                Math.floor(
                    worldY /
                    500
                );


            if (
                sector % 4 === 0
            ) {

                ctx.fillStyle =
                    "#111f25";

            }

            else if (
                sector % 4 === 1
            ) {

                ctx.fillStyle =
                    "#122329";

            }

            else if (
                sector % 4 === 2
            ) {

                ctx.fillStyle =
                    "#151e27";

            }

            else {

                ctx.fillStyle =
                    "#101b23";

            }


            ctx.fillRect(

                screenX,
                screenY,

                gridSize,
                gridSize

            );

        }

    }


    /*
        GRID
    */

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


    /*
        MUREN
    */

    drawWalls();


    /*
        WORLD BORDER
    */

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

    const pulse =

        0.35 +

        Math.sin(
            performance.now() /
            450
        ) *

        0.08;


    for (
        const wall
        of walls
    ) {

        const x =
            wall.x -
            camera.x;


        const y =
            wall.y -
            camera.y;


        /*
            Shadow
        */

        ctx.fillStyle =
            "rgba(0,0,0,0.45)";


        ctx.fillRect(

            x + 6,
            y + 8,

            wall.w,
            wall.h

        );


        /*
            Wall body
        */

        ctx.fillStyle =
            "#1b2c37";


        ctx.fillRect(

            x,
            y,

            wall.w,
            wall.h

        );


        /*
            Outer border
        */

        ctx.strokeStyle =
            "#4e7a8c";


        ctx.lineWidth = 2;


        ctx.strokeRect(

            x,
            y,

            wall.w,
            wall.h

        );


        /*
            Energy stripe
        */

        ctx.fillStyle =
            `rgba(104,220,255,${pulse})`;


        if (
            wall.w >= wall.h
        ) {

            ctx.fillRect(

                x + 8,

                y +
                wall.h / 2 -
                2,

                wall.w - 16,

                4

            );

        }

        else {

            ctx.fillRect(

                x +
                wall.w / 2 -
                2,

                y + 8,

                4,

                wall.h - 16

            );

        }


        /*
            Kleine platen
        */

        ctx.strokeStyle =
            "rgba(190,230,240,0.16)";


        ctx.lineWidth = 1;


        if (
            wall.w >= wall.h
        ) {

            for (

                let px =
                    x + 24;

                px <
                    x +
                    wall.w -
                    10;

                px += 48

            ) {

                ctx.beginPath();


                ctx.moveTo(

                    px,
                    y + 7

                );


                ctx.lineTo(

                    px,

                    y +
                    wall.h -
                    7

                );


                ctx.stroke();

            }

        }

        else {

            for (

                let py =
                    y + 24;

                py <
                    y +
                    wall.h -
                    10;

                py += 48

            ) {

                ctx.beginPath();


                ctx.moveTo(

                    x + 7,
                    py

                );


                ctx.lineTo(

                    x +
                    wall.w -
                    7,

                    py

                );


                ctx.stroke();

            }

        }

    }

}


/* =====================================================
   DRAW PICKUPS
===================================================== */

function drawPickups() {

    for (
        const pickup
        of pickups
    ) {

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
            performance.now() /
            500
        );


        if (
            pickup.type ===
            "energy"
        ) {

            ctx.fillStyle =
                "#60dfff";

        }

        else {

            ctx.fillStyle =
                "#ffd35c";

        }


        ctx.fillRect(

            -7,
            -7,

            14,
            14

        );


        ctx.strokeStyle =
            "rgba(255,255,255,0.8)";


        ctx.lineWidth = 1;


        ctx.strokeRect(

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

    const x =
        player.x -
        camera.x;


    const y =
        player.y -
        camera.y;


    const worldMouseX =
        camera.x +
        mouse.x;


    const worldMouseY =
        camera.y +
        mouse.y;


    const angle =
        Math.atan2(

            worldMouseY -
            player.y,

            worldMouseX -
            player.x

        );


    /*
        Shadow
    */

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";


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


    /*
        Energy ring
    */

    ctx.strokeStyle =
        "rgba(90,210,255,0.25)";


    ctx.lineWidth = 3;


    ctx.beginPath();


    ctx.arc(

        x,
        y,

        26,

        0,
        Math.PI * 2

    );


    ctx.stroke();


    /*
        Player
    */

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


    /*
        Weapon
    */

    ctx.strokeStyle =
        "#e8f8ff";


    ctx.lineWidth = 6;


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


    /*
        Core
    */

    ctx.fillStyle =
        "#dff8ff";


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
        const enemy
        of enemies
    ) {

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
            enemy.type ===
            "mid"
        ) {

            color =
                "#d18cff";


            glow =
                "#934cc7";

        }


        if (
            enemy.type ===
            "heavy"
        ) {

            color =
                "#ff9c69";


            glow =
                "#bc6240";

        }


        /*
            Shadow
        */

        ctx.fillStyle =
            "rgba(0,0,0,0.4)";


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


        /*
            Glow
        */

        ctx.fillStyle =
            glow;


        ctx.globalAlpha =
            0.18;


        ctx.beginPath();


        ctx.arc(

            x,
            y,

            enemy.radius + 9,

            0,
            Math.PI * 2

        );


        ctx.fill();


        ctx.globalAlpha =
            1;


        /*
            Body
        */

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


        /*
            Border
        */

        ctx.strokeStyle =
            "#f1d7ff";


        ctx.lineWidth = 2;


        ctx.stroke();


        /*
            Eye
        */

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


        /*
            Health
        */

        ctx.fillStyle =
            "#080c10";


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
   DRAW BULLETS
===================================================== */

function drawBullets() {

    for (
        const bullet
        of bullets
    ) {

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
            0.25;


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

    for (
        const p
        of particles
    ) {

        ctx.globalAlpha =

            Math.max(

                0,

                p.life /
                40

            );


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


    document.getElementById(
        "healthBar"
    ).style.width =
        healthPercent + "%";


    document.getElementById(
        "energyBar"
    ).style.width =
        energyPercent + "%";


    document.getElementById(
        "ammo"
    ).textContent =

        player.ammo +
        " / ∞";


    document.getElementById(
        "kills"
    ).textContent =

        "KILLS: " +
        player.kills;


    document.getElementById(
        "credits"
    ).textContent =

        "CREDITS: " +
        player.credits;


    const zoneX =

        Math.floor(
            player.x /
            600
        ) + 1;


    const zoneY =

        Math.floor(
            player.y /
            600
        ) + 1;


    document.getElementById(
        "zone"
    ).textContent =

        "SECTOR " +
        zoneX +
        "-" +
        zoneY;


    if (
        player.kills === 0
    ) {

        document.getElementById(
            "objective"
        ).textContent =
            "FIND THE SIGNAL";

    }

    else if (
        player.kills < 5
    ) {

        document.getElementById(
            "objective"
        ).textContent =
            "EXPLORE THE SECTOR";

    }

    else {

        document.getElementById(
            "objective"
        ).textContent =
            "FOLLOW THE ECHOES";

    }

}


/* =====================================================
   ACHIEVEMENT POPUP
===================================================== */

let achievementTimer =
    null;


function showAchievement(
    name
) {

    const box =
        document.getElementById(
            "achievement"
        );


    const nameBox =
        document.getElementById(
            "achievementName"
        );


    nameBox.textContent =
        name;


    box.classList.add(
        "show"
    );


    if (
        achievementTimer
    ) {

        clearTimeout(
            achievementTimer
        );

    }


    achievementTimer =

        setTimeout(

            function () {

                box.classList.remove(
                    "show"
                );

            },

            3000

        );

}


/* =====================================================
   MAP DRAW
===================================================== */

function drawMap() {

    const rect =
        mapCanvas.getBoundingClientRect();


    const width =
        Math.max(

            300,

            Math.floor(
                rect.width
            )

        );


    const height =
        Math.max(

            250,

            Math.floor(
                rect.height
            )

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


    const scaleX =
        width /
        WORLD_WIDTH;


    const scaleY =
        height /
        WORLD_HEIGHT;


    /*
        GRID
    */

    mapCtx.strokeStyle =
        "rgba(100,180,220,0.12)";


    mapCtx.lineWidth = 1;


    for (

        let x = 0;

        x <= WORLD_WIDTH;

        x += 200

    ) {

        mapCtx.beginPath();


        mapCtx.moveTo(

            x *
            scaleX,

            0

        );


        mapCtx.lineTo(

            x *
            scaleX,

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

            y *
            scaleY

        );


        mapCtx.lineTo(

            width,

            y *
            scaleY

        );


        mapCtx.stroke();

    }


    /*
        MUREN
    */

    for (
        const wall
        of walls
    ) {

        const x =
            wall.x *
            scaleX;


        const y =
            wall.y *
            scaleY;


        const w =
            wall.w *
            scaleX;


        const h =
            wall.h *
            scaleY;


        mapCtx.fillStyle =
            "#395765";


        mapCtx.fillRect(

            x,
            y,
            w,
            h

        );


        mapCtx.strokeStyle =
            "#76d8ff";


        mapCtx.lineWidth = 1.5;


        mapCtx.strokeRect(

            x,
            y,
            w,
            h

        );

    }


    /*
        ENEMIES
    */

    mapCtx.fillStyle =
        "#b86cff";


    for (
        const enemy
        of enemies
    ) {

        mapCtx.beginPath();


        mapCtx.arc(

            enemy.x *
            scaleX,

            enemy.y *
            scaleY,

            3,

            0,
            Math.PI * 2

        );


        mapCtx.fill();

    }


    /*
        PLAYER
    */

    mapCtx.fillStyle =
        "#72d8ff";


    mapCtx.beginPath();


    mapCtx.arc(

        player.x *
        scaleX,

        player.y *
        scaleY,

        6,

        0,
        Math.PI * 2

    );


    mapCtx.fill();


    mapCtx.strokeStyle =
        "#dff9ff";


    mapCtx.lineWidth = 2;


    mapCtx.stroke();

}


/* =====================================================
   UPDATE
===================================================== */

function update() {

    if (
        !gameRunning ||
        paused
    ) {

        return;

    }


    updatePlayer();

    updateEnemies();

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
