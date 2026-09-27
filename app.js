const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;

let gameRunning = false;
let paused = false;

let keys = {};

let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

let player = null;
let enemies = [];
let bullets = [];
let particles = [];
let pickups = [];

let camera = {
    x: 0,
    y: 0
};


/* =========================================
   CANVAS
========================================= */

window.addEventListener("resize", function () {

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;

});


/* =========================================
   BUTTON FUNCTIONS
========================================= */

function newGame() {

    player = {
        x: 1000,
        y: 1000,

        radius: 18,

        speed: 3.5,

        health: 100,
        maxHealth: 100,

        energy: 100,
        maxEnergy: 100,

        ammo: 12,

        kills: 0,

        credits: 0,

        cooldown: 0,
        dashCooldown: 0,
        invincible: 0
    };

    enemies = [];
    bullets = [];
    particles = [];
    pickups = [];

    for (let i = 0; i < 20; i++) {
        createEnemy();
    }

    gameRunning = true;
    paused = false;

    document.getElementById("menu").style.display = "none";
    document.getElementById("pause").style.display = "none";

    updateHUD();
}


function continueGame() {

    const save =
        localStorage.getItem("echobound_save");

    if (!save) {

        alert(
            "Je hebt nog geen opgeslagen game."
        );

        return;
    }

    try {

        const data = JSON.parse(save);

        player = data.player;

        enemies = [];
        bullets = [];
        particles = [];
        pickups = [];

        for (let i = 0; i < 20; i++) {
            createEnemy();
        }

        gameRunning = true;
        paused = false;

        document.getElementById(
            "menu"
        ).style.display = "none";

        updateHUD();

    } catch (error) {

        console.error(error);

        alert(
            "De save kon niet worden geladen."
        );
    }
}


function saveGame() {

    if (!player) {

        alert(
            "Je bent nog geen game gestart."
        );

        return;
    }

    localStorage.setItem(
        "echobound_save",
        JSON.stringify({
            player: player
        })
    );

    showAchievement(
        "GAME SAVED"
    );
}


/* =========================================
   MENU BUTTONS
========================================= */

document.getElementById(
    "newGame"
).addEventListener(
    "click",
    function () {

        newGame();

    }
);


document.getElementById(
    "loadGame"
).addEventListener(
    "click",
    function () {

        continueGame();

    }
);


document.getElementById(
    "achievementsButton"
).addEventListener(
    "click",
    function () {

        alert(
            "ACHIEVEMENTS\n\n" +

            "FIRST ENCOUNTER\n" +
            "Versla je eerste vijand.\n\n" +

            "TEN ECHOES\n" +
            "Versla 10 vijanden.\n\n" +

            "GAME SAVED\n" +
            "Sla je game op."
        );

    }
);


document.getElementById(
    "controlsButton"
).addEventListener(
    "click",
    function () {

        alert(
            "BESTURING\n\n" +

            "W A S D = bewegen\n\n" +

            "MUIS = richten\n\n" +

            "LINKERMUISKNOP = schieten\n\n" +

            "SPACE = dash\n\n" +

            "ESC = pauze\n\n" +

            "M = kaart"
        );

    }
);


/* =========================================
   PAUSE BUTTONS
========================================= */

document.getElementById(
    "resume"
).addEventListener(
    "click",
    function () {

        paused = false;

        document.getElementById(
            "pause"
        ).style.display = "none";

    }
);


document.getElementById(
    "save"
).addEventListener(
    "click",
    function () {

        saveGame();

    }
);


document.getElementById(
    "quit"
).addEventListener(
    "click",
    function () {

        saveGame();

        gameRunning = false;
        paused = false;

        document.getElementById(
            "pause"
        ).style.display = "none";

        document.getElementById(
            "menu"
        ).style.display = "flex";

    }
);


/* =========================================
   KEYBOARD
========================================= */

window.addEventListener(
    "keydown",
    function (event) {

        keys[event.key.toLowerCase()] = true;

        if (
            event.key.toLowerCase() === "escape"
        ) {

            if (gameRunning) {

                paused = !paused;

                document.getElementById(
                    "pause"
                ).style.display =
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

        keys[event.key.toLowerCase()] = false;

    }
);


/* =========================================
   MOUSE
========================================= */

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


/* =========================================
   ENEMIES
========================================= */

function createEnemy() {

    let x;
    let y;

    do {

        x =
            Math.random() * 2000;

        y =
            Math.random() * 2000;

    } while (
        Math.hypot(
            x - player.x,
            y - player.y
        ) < 400
    );


    enemies.push({

        x: x,
        y: y,

        radius: 17,

        speed:
            0.6 +
            Math.random() * 0.5,

        hp: 2,

        cooldown:
            Math.random() * 100
    });
}


/* =========================================
   SHOOT
========================================= */

function shoot() {

    if (
        !player ||
        player.cooldown > 0
    ) {
        return;
    }

    if (player.ammo <= 0) {

        player.ammo = 12;

        return;
    }


    player.ammo--;

    player.cooldown = 10;


    const worldX =
        camera.x + mouse.x;

    const worldY =
        camera.y + mouse.y;


    const angle =
        Math.atan2(
            worldY - player.y,
            worldX - player.x
        );


    bullets.push({

        x: player.x,

        y: player.y,

        vx:
            Math.cos(angle) * 10,

        vy:
            Math.sin(angle) * 10,

        enemy: false,

        life: 100
    });
}


/* =========================================
   UPDATE PLAYER
========================================= */

function updatePlayer() {

    let dx = 0;
    let dy = 0;


    if (keys["w"]) dy--;
    if (keys["s"]) dy++;
    if (keys["a"]) dx--;
    if (keys["d"]) dx++;


    if (dx !== 0 || dy !== 0) {

        const length =
            Math.hypot(dx, dy);

        dx /= length;
        dy /= length;

        player.x +=
            dx * player.speed;

        player.y +=
            dy * player.speed;
    }


    /* DASH */

    if (
        keys[" "] &&
        player.dashCooldown <= 0 &&
        player.energy >= 25 &&
        (dx !== 0 || dy !== 0)
    ) {

        player.x += dx * 120;
        player.y += dy * 120;

        player.energy -= 25;

        player.dashCooldown = 60;

        createParticles(
            player.x,
            player.y,
            15
        );
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
            player.energy + 0.1
        );


    player.x =
        Math.max(
            20,
            Math.min(
                1980,
                player.x
            )
        );


    player.y =
        Math.max(
            20,
            Math.min(
                1980,
                player.y
            )
        );
}


/* =========================================
   UPDATE ENEMIES
========================================= */

function updateEnemies() {

    for (const enemy of enemies) {

        const dx =
            player.x - enemy.x;

        const dy =
            player.y - enemy.y;

        const distance =
            Math.hypot(dx, dy);


        if (distance > 50) {

            enemy.x +=
                dx / distance *
                enemy.speed;

            enemy.y +=
                dy / distance *
                enemy.speed;
        }


        if (distance < 500) {

            enemy.cooldown--;

            if (enemy.cooldown <= 0) {

                enemy.cooldown =
                    100 +
                    Math.random() * 100;


                const angle =
                    Math.atan2(
                        player.y - enemy.y,
                        player.x - enemy.x
                    );


                bullets.push({

                    x: enemy.x,

                    y: enemy.y,

                    vx:
                        Math.cos(angle) * 4,

                    vy:
                        Math.sin(angle) * 4,

                    enemy: true,

                    life: 130
                });
            }
        }


        if (
            distance <
            player.radius +
            enemy.radius
        ) {

            damagePlayer(0.3);
        }
    }
}


/* =========================================
   BULLETS
========================================= */

function updateBullets() {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];


        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        bullet.life--;


        if (bullet.enemy) {

            if (
                Math.hypot(
                    bullet.x - player.x,
                    bullet.y - player.y
                ) <
                player.radius + 5
            ) {

                damagePlayer(8);

                bullets.splice(i, 1);

                continue;
            }

        } else {

            let hit = false;


            for (
                let j = enemies.length - 1;
                j >= 0;
                j--
            ) {

                const enemy =
                    enemies[j];


                if (
                    Math.hypot(
                        bullet.x - enemy.x,
                        bullet.y - enemy.y
                    ) <
                    enemy.radius + 5
                ) {

                    enemy.hp--;

                    createParticles(
                        enemy.x,
                        enemy.y,
                        6
                    );

                    hit = true;


                    if (enemy.hp <= 0) {

                        player.kills++;

                        player.credits += 10;

                        enemies.splice(
                            j,
                            1
                        );

                        if (
                            player.kills === 1
                        ) {

                            showAchievement(
                                "FIRST ENCOUNTER"
                            );
                        }

                        if (
                            player.kills === 10
                        ) {

                            showAchievement(
                                "TEN ECHOES"
                            );
                        }

                        createEnemy();
                    }

                    break;
                }
            }


            if (hit) {

                bullets.splice(i, 1);

                continue;
            }
        }


        if (bullet.life <= 0) {

            bullets.splice(i, 1);
        }
    }
}


/* =========================================
   DAMAGE
========================================= */

function damagePlayer(amount) {

    if (
        player.invincible > 0
    ) {
        return;
    }


    player.health -= amount;

    player.invincible = 30;


    if (player.health <= 0) {

        player.health = 0;

        gameOver();
    }
}


/* =========================================
   GAME OVER
========================================= */

function gameOver() {

    gameRunning = false;


    setTimeout(
        function () {

            const retry =
                confirm(
                    "GAME OVER\n\n" +
                    "Kills: " +
                    player.kills +
                    "\nCredits: " +
                    player.credits +
                    "\n\nOpnieuw spelen?"
                );


            if (retry) {

                newGame();

            } else {

                document.getElementById(
                    "menu"
                ).style.display = "flex";
            }

        },
        100
    );
}


/* =========================================
   PARTICLES
========================================= */

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
            Math.random() * 3;


        particles.push({

            x: x,
            y: y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life: 30
        });
    }
}


function updateParticles() {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            particles[i];

        p.x += p.vx;
        p.y += p.vy;

        p.life--;

        if (p.life <= 0) {

            particles.splice(i, 1);
        }
    }
}


/* =========================================
   CAMERA
========================================= */

function updateCamera() {

    camera.x =
        player.x -
        W / 2;

    camera.y =
        player.y -
        H / 2;

}


/* =========================================
   DRAW WORLD
========================================= */

function drawWorld() {

    ctx.fillStyle =
        "#101820";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    const size = 100;


    for (
        let x = -100;
        x < W + 100;
        x += size
    ) {

        for (
            let y = -100;
            y < H + 100;
            y += size
        ) {

            const wx =
                x + camera.x;

            const wy =
                y + camera.y;


            const zone =
                Math.floor(
                    wx / 500
                ) +
                Math.floor(
                    wy / 500
                );


            if (
                zone % 3 === 0
            ) {

                ctx.fillStyle =
                    "#17242b";

            } else if (
                zone % 3 === 1
            ) {

                ctx.fillStyle =
                    "#182a29";

            } else {

                ctx.fillStyle =
                    "#1d252d";
            }


            ctx.fillRect(
                x,
                y,
                size,
                size
            );
        }
    }


    /* GRID */

    ctx.strokeStyle =
        "rgba(130,190,220,0.07)";

    ctx.lineWidth = 1;


    for (
        let x = 0;
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
        let y = 0;
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
}


/* =========================================
   DRAW PLAYER
========================================= */

function drawPlayer() {

    const x =
        player.x -
        camera.x;

    const y =
        player.y -
        camera.y;


    const angle =
        Math.atan2(
            camera.y +
            mouse.y -
            player.y,

            camera.x +
            mouse.x -
            player.x
        );


    ctx.fillStyle =
        "rgba(0,0,0,0.4)";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 12,
        24,
        10,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        player.invincible > 0
            ? "#ffffff"
            : "#76cfff";


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
        "#dff6ff";

    ctx.lineWidth = 5;

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
}


/* =========================================
   DRAW ENEMIES
========================================= */

function drawEnemies() {

    for (const enemy of enemies) {

        const x =
            enemy.x -
            camera.x;

        const y =
            enemy.y -
            camera.y;


        ctx.fillStyle =
            "#b96cff";


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
            "#e3c1ff";

        ctx.lineWidth = 2;

        ctx.stroke();


        /* HP */

        ctx.fillStyle =
            "#111";

        ctx.fillRect(
            x - 18,
            y - 27,
            36,
            4
        );


        ctx.fillStyle =
            "#d88cff";

        ctx.fillRect(
            x - 18,
            y - 27,
            18 * enemy.hp,
            4
        );
    }
}


/* =========================================
   DRAW BULLETS
========================================= */

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
                ? "#ff936f"
                : "#78d8ff";


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


/* =========================================
   DRAW PARTICLES
========================================= */

function drawParticles() {

    for (const p of particles) {

        ctx.fillStyle =
            "#9ee6ff";

        ctx.globalAlpha =
            p.life / 30;

        ctx.fillRect(
            p.x - camera.x,
            p.y - camera.y,
            4,
            4
        );
    }

    ctx.globalAlpha = 1;
}


/* =========================================
   HUD
========================================= */

function updateHUD() {

    if (!player) {
        return;
    }


    document.getElementById(
        "healthBar"
    ).style.width =
        (
            player.health /
            player.maxHealth *
            100
        ) + "%";


    document.getElementById(
        "energyBar"
    ).style.width =
        (
            player.energy /
            player.maxEnergy *
            100
        ) + "%";


    document.getElementById(
        "ammo"
    ).textContent =
        player.ammo + " / ∞";


    document.getElementById(
        "objective"
    ).textContent =
        "EXPLORE • KILLS: " +
        player.kills +
        " • CREDITS: " +
        player.credits;
}


/* =========================================
   MAIN LOOP
========================================= */

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

    updateParticles();

    updateCamera();


    if (mouse.down) {
        shoot();
    }


    updateHUD();
}


function draw() {

    drawWorld();


    if (!player) {
        return;
    }


    drawParticles();

    drawBullets();

    drawEnemies();

    drawPlayer();
}


function gameLoop() {

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );
}


gameLoop();


/* =========================================
   ACHIEVEMENT
========================================= */

function showAchievement(name) {

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


    setTimeout(
        function () {

            box.classList.remove(
                "show"
            );

        },
        3000
    );
}
