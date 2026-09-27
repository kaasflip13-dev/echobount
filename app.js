const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;

window.addEventListener("resize", () => {
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;
});


/* =========================================
   GAME STATE
========================================= */

let gameRunning = false;
let paused = false;
let mapOpen = false;

let keys = {};

let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

let world = null;
let player = null;

let bullets = [];
let enemies = [];
let particles = [];
let pickups = [];

let camera = {
    x: 0,
    y: 0
};

let time = 0;

let unlockedAchievements = [];


/* =========================================
   WORLD
========================================= */

function createWorld() {

    return {
        width: 4200,
        height: 4200,

        zones: [
            {
                x: 0,
                y: 0,
                w: 1400,
                h: 1400,
                name: "THE QUIET FIELD",
                color: "#18252a"
            },

            {
                x: 1400,
                y: 0,
                w: 1400,
                h: 1400,
                name: "GLASS MARSH",
                color: "#15272a"
            },

            {
                x: 2800,
                y: 0,
                w: 1400,
                h: 1400,
                name: "THE RIFT",
                color: "#261b2a"
            },

            {
                x: 0,
                y: 1400,
                w: 1400,
                h: 1400,
                name: "OLD GARDENS",
                color: "#17271f"
            },

            {
                x: 1400,
                y: 1400,
                w: 1400,
                h: 1400,
                name: "THE SILENT CITY",
                color: "#20252c"
            },

            {
                x: 2800,
                y: 1400,
                w: 1400,
                h: 1400,
                name: "ASHEN RIDGE",
                color: "#29231e"
            },

            {
                x: 0,
                y: 2800,
                w: 1400,
                h: 1400,
                name: "BLUE WOODS",
                color: "#15232c"
            },

            {
                x: 1400,
                y: 2800,
                w: 1400,
                h: 1400,
                name: "THE DEEP",
                color: "#101b26"
            },

            {
                x: 2800,
                y: 2800,
                w: 1400,
                h: 1400,
                name: "SIGNAL ZERO",
                color: "#241c29"
            }
        ]
    };
}


/* =========================================
   PLAYER
========================================= */

function createPlayer() {

    return {
        x: 700,
        y: 700,

        r: 18,

        speed: 3.4,

        health: 100,
        maxHealth: 100,

        energy: 100,
        maxEnergy: 100,

        ammo: 12,
        maxAmmo: 12,

        credits: 0,
        kills: 0,
        signals: 0,

        fireCooldown: 0,
        dashCooldown: 0,
        invincible: 0
    };
}


/* =========================================
   START NEW GAME
========================================= */

function startGame() {

    world = createWorld();
    player = createPlayer();

    bullets = [];
    enemies = [];
    particles = [];
    pickups = [];

    time = 0;

    spawnInitialEnemies();

    gameRunning = true;
    paused = false;
    mapOpen = false;

    hide("menu");
    hide("pause");
    hide("map");

    updateHUD();
}


/* =========================================
   LOAD GAME
========================================= */

function loadGame() {

    const raw = localStorage.getItem("echobound_save");

    if (!raw) {
        alert("Er is nog geen opgeslagen run.");
        return;
    }

    try {

        const data = JSON.parse(raw);

        world = createWorld();
        player = createPlayer();

        player.x = Number(data.x) || 700;
        player.y = Number(data.y) || 700;

        player.health =
            Number(data.health) || 100;

        player.energy =
            Number(data.energy) || 100;

        player.ammo =
            Number(data.ammo) || 12;

        player.credits =
            Number(data.credits) || 0;

        player.kills =
            Number(data.kills) || 0;

        player.signals =
            Number(data.signals) || 0;

        bullets = [];
        enemies = [];
        particles = [];
        pickups = [];

        spawnInitialEnemies();

        gameRunning = true;
        paused = false;
        mapOpen = false;

        hide("menu");
        hide("pause");
        hide("map");

        updateHUD();

    } catch (error) {

        console.error(error);

        alert("Het savebestand kon niet worden geladen.");
    }
}


/* =========================================
   SAVE
========================================= */

function saveGame() {

    if (!player) {
        return;
    }

    const data = {
        x: player.x,
        y: player.y,

        health: player.health,
        energy: player.energy,

        ammo: player.ammo,

        credits: player.credits,
        kills: player.kills,
        signals: player.signals
    };

    localStorage.setItem(
        "echobound_save",
        JSON.stringify(data)
    );

    showAchievement("RUN SAVED");
}


/* =========================================
   ENEMIES
========================================= */

function spawnInitialEnemies() {

    for (let i = 0; i < 25; i++) {
        spawnEnemy();
    }
}


function spawnEnemy() {

    let x;
    let y;

    do {

        x = Math.random() * world.width;
        y = Math.random() * world.height;

    } while (
        distance(
            x,
            y,
            player.x,
            player.y
        ) < 500
    );

    enemies.push({

        x: x,
        y: y,

        r: 17,

        speed:
            0.7 +
            Math.random() * 0.7,

        hp: 2,
        maxHp: 2,

        cooldown:
            Math.random() * 150,

        phase:
            Math.random() *
            Math.PI *
            2
    });
}


/* =========================================
   PICKUPS
========================================= */

function spawnPickup(x, y) {

    pickups.push({

        x: x,
        y: y,

        type:
            Math.random() < 0.5
                ? "energy"
                : "credit",

        r: 9,

        phase:
            Math.random() *
            Math.PI *
            2
    });
}


/* =========================================
   INPUT
========================================= */

window.addEventListener("keydown", (event) => {

    const key = event.key.toLowerCase();

    keys[key] = true;

    if (key === "m") {

        event.preventDefault();

        toggleMap();
    }

    if (key === "escape") {

        event.preventDefault();

        if (mapOpen) {
            toggleMap();
        } else {
            togglePause();
        }
    }
});


window.addEventListener("keyup", (event) => {

    keys[event.key.toLowerCase()] = false;
});


canvas.addEventListener("mousemove", (event) => {

    const rect = canvas.getBoundingClientRect();

    mouse.x =
        event.clientX -
        rect.left;

    mouse.y =
        event.clientY -
        rect.top;
});


canvas.addEventListener("mousedown", (event) => {

    if (event.button === 0) {
        mouse.down = true;
    }
});


window.addEventListener("mouseup", (event) => {

    if (event.button === 0) {
        mouse.down = false;
    }
});


/* =========================================
   SHOOT
========================================= */

function shoot() {

    if (!player) {
        return;
    }

    if (player.fireCooldown > 0) {
        return;
    }

    if (player.ammo <= 0) {

        player.ammo = player.maxAmmo;

        return;
    }

    player.ammo--;

    player.fireCooldown = 10;

    const worldMouseX =
        camera.x + mouse.x;

    const worldMouseY =
        camera.y + mouse.y;

    const angle =
        Math.atan2(
            worldMouseY - player.y,
            worldMouseX - player.x
        );

    bullets.push({

        x: player.x,
        y: player.y,

        vx:
            Math.cos(angle) * 10,

        vy:
            Math.sin(angle) * 10,

        life: 80,

        enemy: false
    });
}


/* =========================================
   UPDATE
========================================= */

function update() {

    if (
        !gameRunning ||
        paused ||
        mapOpen ||
        !player
    ) {
        return;
    }

    time++;

    updatePlayer();
    updateBullets();
    updateEnemies();
    updatePickups();
    updateParticles();
    updateCamera();

    if (mouse.down) {
        shoot();
    }

    updateHUD();
}


/* =========================================
   PLAYER
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
        player.energy >= 25
    ) {

        let dashX = dx;
        let dashY = dy;

        if (
            dashX !== 0 ||
            dashY !== 0
        ) {

            player.x +=
                dashX * 130;

            player.y +=
                dashY * 130;

            player.energy -= 25;

            player.dashCooldown = 70;

            burst(
                player.x,
                player.y,
                14
            );
        }
    }


    if (player.dashCooldown > 0) {
        player.dashCooldown--;
    }

    if (player.fireCooldown > 0) {
        player.fireCooldown--;
    }

    if (player.invincible > 0) {
        player.invincible--;
    }


    player.energy =
        Math.min(
            player.maxEnergy,
            player.energy + 0.12
        );


    player.x =
        Math.max(
            30,
            Math.min(
                world.width - 30,
                player.x
            )
        );

    player.y =
        Math.max(
            30,
            Math.min(
                world.height - 30,
                player.y
            )
        );
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

        const bullet = bullets[i];

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        bullet.life--;

        let hit = false;


        /* ENEMY BULLET */

        if (bullet.enemy) {

            if (
                distance(
                    bullet.x,
                    bullet.y,
                    player.x,
                    player.y
                ) <
                player.r + 6
            ) {

                damagePlayer(8);

                hit = true;
            }
        }


        /* PLAYER BULLET */

        else {

            for (
                let j = enemies.length - 1;
                j >= 0;
                j--
            ) {

                const enemy = enemies[j];

                if (
                    distance(
                        bullet.x,
                        bullet.y,
                        enemy.x,
                        enemy.y
                    ) <
                    enemy.r + 5
                ) {

                    enemy.hp--;

                    burst(
                        enemy.x,
                        enemy.y,
                        5
                    );

                    hit = true;


                    if (enemy.hp <= 0) {

                        player.kills++;

                        spawnPickup(
                            enemy.x,
                            enemy.y
                        );

                        enemies.splice(j, 1);

                        checkAchievements();

                        if (enemies.length < 15) {
                            spawnEnemy();
                        }
                    }

                    break;
                }
            }
        }


        if (
            hit ||
            bullet.life <= 0 ||
            bullet.x < 0 ||
            bullet.y < 0 ||
            bullet.x > world.width ||
            bullet.y > world.height
        ) {

            bullets.splice(i, 1);
        }
    }
}


/* =========================================
   ENEMIES UPDATE
========================================= */

function updateEnemies() {

    for (const enemy of enemies) {

        const dx =
            player.x - enemy.x;

        const dy =
            player.y - enemy.y;

        const d =
            Math.hypot(dx, dy);


        if (d > 45) {

            enemy.x +=
                (dx / d) *
                enemy.speed;

            enemy.y +=
                (dy / d) *
                enemy.speed;
        }


        enemy.phase += 0.04;

        enemy.cooldown--;


        if (
            d < 500 &&
            enemy.cooldown <= 0
        ) {

            enemy.cooldown =
                120 +
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

                life: 130,

                enemy: true
            });
        }


        if (
            d <
            player.r + enemy.r
        ) {

            damagePlayer(0.35);
        }
    }
}


/* =========================================
   PICKUPS
========================================= */

function updatePickups() {

    for (
        let i = pickups.length - 1;
        i >= 0;
        i--
    ) {

        const pickup = pickups[i];

        pickup.phase += 0.05;


        if (
            distance(
                player.x,
                player.y,
                pickup.x,
                pickup.y
            ) <
            player.r +
            pickup.r +
            8
        ) {

            if (
                pickup.type === "energy"
            ) {

                player.energy =
                    Math.min(
                        player.maxEnergy,
                        player.energy + 35
                    );

            } else {

                player.credits += 10;
            }


            burst(
                pickup.x,
                pickup.y,
                10
            );

            pickups.splice(i, 1);
        }
    }
}


/* =========================================
   DAMAGE
========================================= */

function damagePlayer(amount) {

    if (
        !player ||
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

    setTimeout(() => {

        const again = confirm(
            "RUN ENDED\n\n" +
            "Kills: " +
            player.kills +
            "\nCredits: " +
            player.credits +
            "\n\nOpnieuw proberen?"
        );


        if (again) {

            startGame();

        } else {

            show("menu");
        }

    }, 100);
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


    camera.x =
        Math.max(
            0,
            Math.min(
                world.width - W,
                camera.x
            )
        );


    camera.y =
        Math.max(
            0,
            Math.min(
                world.height - H,
                camera.y
            )
        );
}


/* =========================================
   PARTICLES
========================================= */

function burst(x, y, count) {

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            Math.random() * 3 + 1;


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
                30 +
                Math.random() * 30,

            size:
                2 +
                Math.random() * 3
        });
    }
}


function updateParticles() {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            particles[i];

        particle.x += particle.vx;
        particle.y += particle.vy;

        particle.vx *= 0.96;
        particle.vy *= 0.96;

        particle.life--;


        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}


/* =========================================
   DRAW
========================================= */

function draw() {

    ctx.clearRect(
        0,
        0,
        W,
        H
    );


    if (!world || !player) {
        return;
    }

    drawWorld();
    drawPickups();
    drawEnemies();
    drawBullets();
    drawParticles();
    drawPlayer();
}


/* =========================================
   WORLD DRAW
========================================= */

function drawWorld() {

    ctx.fillStyle = "#080e14";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    for (const zone of world.zones) {

        ctx.fillStyle =
            zone.color;

        ctx.fillRect(
            zone.x - camera.x,
            zone.y - camera.y,
            zone.w,
            zone.h
        );
    }


    /* GRID */

    ctx.strokeStyle =
        "rgba(120,170,200,0.06)";

    ctx.lineWidth = 1;

    const grid = 100;


    for (
        let x =
            Math.floor(
                camera.x / grid
            ) * grid;

        x < camera.x + W;

        x += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x - camera.x,
            0
        );

        ctx.lineTo(
            x - camera.x,
            H
        );

        ctx.stroke();
    }


    for (
        let y =
            Math.floor(
                camera.y / grid
            ) * grid;

        y < camera.y + H;

        y += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y - camera.y
        );

        ctx.lineTo(
            W,
            y - camera.y
        );

        ctx.stroke();
    }
}


/* =========================================
   PLAYER DRAW
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


    /* SHADOW */

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(
        x,
        y + 10,
        22,
        9,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* BODY */

    ctx.fillStyle =
        player.invincible > 0
            ? "#ffffff"
            : "#9bd7ff";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        player.r,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* WEAPON */

    ctx.strokeStyle =
        "#dff5ff";

    ctx.lineWidth = 5;

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
}


/* =========================================
   ENEMY DRAW
========================================= */

function drawEnemies() {

    for (const enemy of enemies) {

        const x =
            enemy.x -
            camera.x;

        const y =
            enemy.y -
            camera.y;


        const pulse =
            Math.sin(
                enemy.phase
            ) * 2;


        ctx.fillStyle =
            "#c77cff";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            enemy.r + pulse,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.strokeStyle =
            "#e8c9ff";

        ctx.lineWidth = 2;

        ctx.stroke();


        /* HEALTH BAR */

        ctx.fillStyle =
            "#111";

        ctx.fillRect(
            x - 18,
            y - 28,
            36,
            4
        );


        ctx.fillStyle =
            "#d98cff";

        ctx.fillRect(
            x - 18,
            y - 28,
            36 *
            (enemy.hp / enemy.maxHp),
            4
        );
    }
}


/* =========================================
   BULLET DRAW
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
                ? "#ff8a6b"
                : "#83dcff";


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            bullet.enemy ? 4 : 5,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


/* =========================================
   PICKUP DRAW
========================================= */

function drawPickups() {

    for (const pickup of pickups) {

        const x =
            pickup.x -
            camera.x;

        const y =
            pickup.y -
            camera.y +
            Math.sin(
                pickup.phase
            ) * 4;


        ctx.fillStyle =
            pickup.type === "energy"
                ? "#66d9ff"
                : "#ffe47a";


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            pickup.r,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


/* =========================================
   PARTICLE DRAW
========================================= */

function drawParticles() {

    for (const particle of particles) {

        ctx.globalAlpha =
            Math.max(
                0,
                particle.life / 50
            );

        ctx.fillStyle =
            "#a7ddff";

        ctx.fillRect(
            particle.x - camera.x,
            particle.y - camera.y,
            particle.size,
            particle.size
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


    const healthBar =
        document.getElementById(
            "healthBar"
        );

    const energyBar =
        document.getElementById(
            "energyBar"
        );

    const ammo =
        document.getElementById(
            "ammo"
        );

    const location =
        document.getElementById(
            "location"
        );

    const objective =
        document.getElementById(
            "objective"
        );


    if (healthBar) {

        healthBar.style.width =
            (
                player.health /
                player.maxHealth *
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


    if (ammo) {

        ammo.textContent =
            player.ammo + " / ∞";
    }


    const zone = getZone();


    if (
        zone &&
        location
    ) {

        location.textContent =
            zone.name;
    }


    if (objective) {

        objective.textContent =
            "Explore the sector • Kills: " +
            player.kills +
            " • Credits: " +
            player.credits;
    }
}


/* =========================================
   ZONE
========================================= */

function getZone() {

    if (!world || !player) {
        return null;
    }


    return world.zones.find(
        zone =>

            player.x >= zone.x &&
            player.x < zone.x + zone.w &&
            player.y >= zone.y &&
            player.y < zone.y + zone.h
    );
}


/* =========================================
   MAP
========================================= */

function toggleMap() {

    if (!gameRunning) {
        return;
    }


    mapOpen =
        !mapOpen;


    const map =
        document.getElementById(
            "map"
        );


    if (map) {

        map.style.display =
            mapOpen
                ? "flex"
                : "none";
    }


    if (mapOpen) {
        drawMap();
    }
}


function drawMap() {

    if (!world || !player) {
        return;
    }


    const rect =
        mapCanvas.getBoundingClientRect();


    mapCanvas.width =
        rect.width;

    mapCanvas.height =
        rect.height;


    mapCtx.clearRect(
        0,
        0,
        mapCanvas.width,
        mapCanvas.height
    );


    const scale =
        Math.min(
            mapCanvas.width /
                world.width,

            mapCanvas.height /
                world.height
        ) * 0.9;


    const offsetX =
        (
            mapCanvas.width -
            world.width * scale
        ) / 2;


    const offsetY =
        (
            mapCanvas.height -
            world.height * scale
        ) / 2;


    for (const zone of world.zones) {

        mapCtx.fillStyle =
            zone.color;

        mapCtx.fillRect(
            offsetX +
            zone.x * scale,

            offsetY +
            zone.y * scale,

            zone.w * scale,
            zone.h * scale
        );


        mapCtx.strokeStyle =
            "#526b7d";

        mapCtx.strokeRect(
            offsetX +
            zone.x * scale,

            offsetY +
            zone.y * scale,

            zone.w * scale,
            zone.h * scale
        );
    }


    /* PLAYER */

    mapCtx.fillStyle =
        "#ffffff";

    mapCtx.beginPath();

    mapCtx.arc(
        offsetX +
        player.x * scale,

        offsetY +
        player.y * scale,

        7,

        0,
        Math.PI * 2
    );

    mapCtx.fill();
}


/* =========================================
   PAUSE
========================================= */

function togglePause() {

    if (!gameRunning) {
        return;
    }


    paused =
        !paused;


    const pause =
        document.getElementById(
            "pause"
        );


    if (pause) {

        pause.style.display =
            paused
                ? "flex"
                : "none";
    }
}


/* =========================================
   ACHIEVEMENTS
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


    if (!box || !nameBox) {
        return;
    }


    nameBox.textContent =
        name;


    box.classList.add("show");


    setTimeout(() => {

        box.classList.remove("show");

    }, 3000);
}


function checkAchievements() {

    if (
        player.kills >= 1 &&
        !unlockedAchievements.includes(
            "FIRST ENCOUNTER"
        )
    ) {

        unlockedAchievements.push(
            "FIRST ENCOUNTER"
        );

        showAchievement(
            "FIRST ENCOUNTER"
        );
    }


    if (
        player.kills >= 10 &&
        !unlockedAchievements.includes(
            "TEN ECHOES"
        )
    ) {

        unlockedAchievements.push(
            "TEN ECHOES"
        );

        showAchievement(
            "TEN ECHOES"
        );
    }
}


/* =========================================
   HELPER FUNCTIONS
========================================= */

function distance(
    x1,
    y1,
    x2,
    y2
) {

    return Math.hypot(
        x1 - x2,
        y1 - y2
    );
}


function show(id) {

    const element =
        document.getElementById(id);

    if (element) {
        element.style.display = "flex";
    }
}


function hide(id) {

    const element =
        document.getElementById(id);

    if (element) {
        element.style.display = "none";
    }
}


/* =========================================
   BUTTONS
========================================= */

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


/* NEW GAME */

if (newGameButton) {

    newGameButton.onclick = function () {

        startGame();

    };
}


/* CONTINUE */

if (loadGameButton) {

    loadGameButton.onclick = function () {

        loadGame();

    };
}


/* ACHIEVEMENTS */

if (achievementsButton) {

    achievementsButton.onclick = function () {

        alert(
            "ACHIEVEMENTS\n\n" +

            "FIRST ENCOUNTER\n" +
            "Versla je eerste vijand.\n\n" +

            "TEN ECHOES\n" +
            "Versla 10 vijanden.\n\n" +

            "RUN SAVED\n" +
            "Sla je run op."
        );

    };
}


/* CONTROLS */

if (controlsButton) {

    controlsButton.onclick = function () {

        alert(
            "BESTURING\n\n" +

            "WASD = bewegen\n" +

            "Muis = richten\n" +

            "Linkermuisknop = schieten\n" +

            "SPACE = dash\n" +

            "M = kaart\n" +

            "ESC = pauze"
        );

    };
}


/* RESUME */

if (resumeButton) {

    resumeButton.onclick = function () {

        togglePause();

    };
}


/* SAVE */

if (saveButton) {

    saveButton.onclick = function () {

        saveGame();

    };
}


/* QUIT */

if (quitButton) {

    quitButton.onclick = function () {

        if (player) {
            saveGame();
        }

        gameRunning = false;
        paused = false;
        mapOpen = false;

        hide("pause");
        hide("map");
        show("menu");

    };
}


/* =========================================
   GAME LOOP
========================================= */

function gameLoop() {

    update();

    draw();

    requestAnimationFrame(
        gameLoop
    );
}


/* =========================================
   START LOOP
========================================= */

gameLoop();
