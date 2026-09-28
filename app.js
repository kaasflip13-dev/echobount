"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

canvas.width = W;
canvas.height = H;

let gameRunning = false;
let paused = false;

let keys = {};
let player = null;

let enemies = [];
let bullets = [];
let particles = [];
let pickups = [];

let boss = null;

let camera = {
    x: 0,
    y: 0
};

let mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 2400;

const SAVE_KEY = "echobound_save_final";

let achievements = {
    firstEcho: false,
    tenEchoes: false,
    firstSave: false,
    explorer: false,
    bossSlayer: false
};

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

/* =========================
   HELPERS
========================= */

function id(name) {
    return document.getElementById(name);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function circleWallCollision(x, y, radius, wall) {

    const closestX = clamp(
        x,
        wall.x,
        wall.x + wall.w
    );

    const closestY = clamp(
        y,
        wall.y,
        wall.y + wall.h
    );

    const dx = x - closestX;
    const dy = y - closestY;

    return (
        dx * dx +
        dy * dy <
        radius * radius
    );
}

function hitWall(x, y, radius) {

    for (const wall of walls) {

        if (
            circleWallCollision(
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

function moveEntity(entity, dx, dy) {

    const nextX = entity.x + dx;

    if (
        !hitWall(
            nextX,
            entity.y,
            entity.radius
        )
    ) {
        entity.x = nextX;
    }

    const nextY = entity.y + dy;

    if (
        !hitWall(
            entity.x,
            nextY,
            entity.radius
        )
    ) {
        entity.y = nextY;
    }

    entity.x = clamp(
        entity.x,
        entity.radius,
        WORLD_WIDTH - entity.radius
    );

    entity.y = clamp(
        entity.y,
        entity.radius,
        WORLD_HEIGHT - entity.radius
    );
}

function bulletHitsWall(x1, y1, x2, y2) {

    for (const wall of walls) {

        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        if (
            maxX >= wall.x &&
            minX <= wall.x + wall.w &&
            maxY >= wall.y &&
            minY <= wall.y + wall.h
        ) {
            return true;
        }
    }

    return false;
}

/* =========================
   ACHIEVEMENTS
========================= */

function makeAchievementsPage() {

    if (id("achievementsPage")) {
        return;
    }

    const page = document.createElement("div");

    page.id = "achievementsPage";

    page.innerHTML = `
        <div class="achievementWindow">

            <div class="achievementHeader">
                <div>
                    <div class="achievementLogo">
                        ECHOBOUND
                    </div>

                    <h1>ACHIEVEMENTS</h1>

                    <p>
                        Bekijk wat je hebt vrijgespeeld.
                    </p>
                </div>

                <button id="achievementBack">
                    BACK
                </button>
            </div>

            <div class="achievementList">

                <div class="achievementItem" id="achievement1">
                    <div class="achievementSymbol">◆</div>

                    <div>
                        <h3>FIRST ECHO</h3>
                        <p>Versla je eerste vijand.</p>
                    </div>

                    <b>LOCKED</b>
                </div>

                <div class="achievementItem" id="achievement2">
                    <div class="achievementSymbol">◆</div>

                    <div>
                        <h3>TEN ECHOES</h3>
                        <p>Versla 10 vijanden.</p>
                    </div>

                    <b>LOCKED</b>
                </div>

                <div class="achievementItem" id="achievement3">
                    <div class="achievementSymbol">◆</div>

                    <div>
                        <h3>FIRST SAVE</h3>
                        <p>Sla een run op.</p>
                    </div>

                    <b>LOCKED</b>
                </div>

                <div class="achievementItem" id="achievement4">
                    <div class="achievementSymbol">◆</div>

                    <div>
                        <h3>EXPLORER</h3>
                        <p>Leg 5000 meter af.</p>
                    </div>

                    <b>LOCKED</b>
                </div>

                <div class="achievementItem" id="achievement5">
                    <div class="achievementSymbol">◆</div>

                    <div>
                        <h3>BOSS SLAYER</h3>
                        <p>Versla een boss.</p>
                    </div>

                    <b>LOCKED</b>
                </div>

            </div>
        </div>
    `;

    document.body.appendChild(page);

    const style = document.createElement("style");

    style.textContent = `
        #achievementsPage {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: none;
            align-items: center;
            justify-content: center;
            background: #050b10;
            padding: 20px;
        }

        .achievementWindow {
            width: min(850px, 95vw);
            padding: 35px;
            background:
                linear-gradient(
                    145deg,
                    #152b39,
                    #08131b
                );
            border: 1px solid #4f7c91;
            border-radius: 20px;
            box-shadow:
                0 30px 100px rgba(0,0,0,.8);
        }

        .achievementHeader {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            gap: 20px;
        }

        .achievementLogo {
            color: #76d5ff;
            font-size: 11px;
            letter-spacing: 5px;
        }

        .achievementHeader h1 {
            margin: 8px 0;
            color: white;
            font-size: 38px;
            letter-spacing: 4px;
        }

        .achievementHeader p {
            color: #849cab;
        }

        #achievementBack {
            padding: 11px 18px;
            color: white;
            background: #152b39;
            border: 1px solid #4d6f7f;
            border-radius: 8px;
            cursor: pointer;
        }

        #achievementBack:hover {
            background: #234456;
            border-color: #76d5ff;
        }

        .achievementList {
            display: grid;
            gap: 12px;
        }

        .achievementItem {
            display: grid;
            grid-template-columns: 55px 1fr auto;
            align-items: center;
            gap: 15px;
            padding: 16px;
            background: #0d1b23;
            border: 1px solid #2b4654;
            border-radius: 12px;
        }

        .achievementItem.unlocked {
            border-color: #67d0fa;
            background: #14303e;
        }

        .achievementSymbol {
            width: 45px;
            height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            background: #081219;
            color: #526c79;
            font-size: 22px;
        }

        .achievementItem.unlocked .achievementSymbol {
            color: #76d5ff;
        }

        .achievementItem h3 {
            color: white;
            font-size: 14px;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }

        .achievementItem p {
            color: #78909d;
            font-size: 12px;
        }

        .achievementItem b {
            color: #60727d;
            font-size: 9px;
            letter-spacing: 2px;
        }

        .achievementItem.unlocked b {
            color: #70d6ff;
        }

        @media(max-width:700px) {
            .achievementHeader {
                flex-direction: column;
            }

            .achievementHeader h1 {
                font-size: 29px;
            }

            .achievementWindow {
                padding: 20px;
            }
        }
    `;

    document.head.appendChild(style);

    id("achievementBack").onclick =
        closeAchievements;
}

function openAchievements() {

    makeAchievementsPage();

    id("achievementsPage").style.display =
        "flex";

    updateAchievements();

}

function closeAchievements() {

    if (
        id("achievementsPage")
    ) {

        id("achievementsPage")
            .style.display =
            "none";
    }
}

function updateAchievement(
    elementId,
    unlocked
) {

    const element =
        id(elementId);

    if (!element) {
        return;
    }

    const status =
        element.querySelector("b");

    if (unlocked) {

        element.classList.add(
            "unlocked"
        );

        status.textContent =
            "UNLOCKED";

    } else {

        element.classList.remove(
            "unlocked"
        );

        status.textContent =
            "LOCKED";
    }
}

function updateAchievements() {

    updateAchievement(
        "achievement1",
        achievements.firstEcho
    );

    updateAchievement(
        "achievement2",
        achievements.tenEchoes
    );

    updateAchievement(
        "achievement3",
        achievements.firstSave
    );

    updateAchievement(
        "achievement4",
        achievements.explorer
    );

    updateAchievement(
        "achievement5",
        achievements.bossSlayer
    );
}

/* =========================
   PLAYER
========================= */

function createPlayer() {

    player = {

        x: 1200,
        y: 1200,

        radius: 18,

        speed: 3.5,

        health: 100,
        maxHealth: 100,

        energy: 100,
        maxEnergy: 100,

        ammo: 12,

        kills: 0,
        credits: 0,

        xp: 0,
        level: 1,

        weapon: 0,

        cooldown: 0,
        dashCooldown: 0,
        dashTime: 0,

        invincible: 0,

        distance: 0
    };
}

/* =========================
   ENEMIES
========================= */

function createEnemy() {

    let x;
    let y;

    let tries = 0;

    do {

        x =
            70 +
            Math.random() *
            (WORLD_WIDTH - 140);

        y =
            70 +
            Math.random() *
            (WORLD_HEIGHT - 140);

        tries++;

    } while (

        (
            Math.hypot(
                x - player.x,
                y - player.y
            ) < 400

            ||

            hitWall(
                x,
                y,
                20
            )
        )

        &&

        tries < 200
    );

    const types = [
        "normal",
        "fast",
        "shield",
        "flying"
    ];

    const type =
        types[
            Math.floor(
                Math.random() *
                types.length
            )
        ];

    let enemy = {

        x,
        y,

        radius: 17,

        speed: 0.75,

        hp: 2,
        maxHp: 2,

        cooldown:
            80 +
            Math.random() *
            100,

        type,

        shield:
            type === "shield"
                ? 3
                : 0
    };

    if (
        type === "fast"
    ) {

        enemy.speed = 1.2;

    }

    if (
        type === "flying"
    ) {

        enemy.speed = 1.1;

        enemy.radius = 15;

    }

    if (
        type === "shield"
    ) {

        enemy.hp = 3;

        enemy.maxHp = 3;

        enemy.radius = 20;

    }

    enemies.push(enemy);
}

/* =========================
   BOSS
========================= */

function createBoss() {

    if (boss) {
        return;
    }

    boss = {

        x: 200,

        y: 200,

        radius: 38,

        hp: 150,

        maxHp: 150,

        cooldown: 80

    };

    if (
        id("bossHud")
    ) {

        id("bossHud").style.display =
            "block";
    }

}

/* =========================
   SHOOT
========================= */

const weapons = [

    {
        name: "PULSE",
        cooldown: 9,
        damage: 1,
        bullets: 1,
        spread: 0,
        speed: 11
    },

    {
        name: "BLASTER",
        cooldown: 5,
        damage: 1,
        bullets: 1,
        spread: 0,
        speed: 14
    },

    {
        name: "SHOTGUN",
        cooldown: 22,
        damage: 0.7,
        bullets: 7,
        spread: 0.35,
        speed: 10
    },

    {
        name: "LASER",
        cooldown: 15,
        damage: 3,
        bullets: 1,
        spread: 0,
        speed: 16
    }
];

function shoot() {

    if (
        !player ||
        player.cooldown > 0
    ) {

        return;
    }

    const weapon =
        weapons[player.weapon];

    player.cooldown =
        weapon.cooldown;

    if (
        player.ammo <= 0
    ) {

        player.ammo = 12;

        return;
    }

    player.ammo--;

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

    for (
        let i = 0;
        i < weapon.bullets;
        i++
    ) {

        const shotAngle =
            angle +
            (
                Math.random() -
                0.5
            ) *
            weapon.spread;

        bullets.push({

            x:
                player.x +
                Math.cos(
                    shotAngle
                ) *
                22,

            y:
                player.y +
                Math.sin(
                    shotAngle
                ) *
                22,

            vx:
                Math.cos(
                    shotAngle
                ) *
                weapon.speed,

            vy:
                Math.sin(
                    shotAngle
                ) *
                weapon.speed,

            enemy: false,

            damage:
                weapon.damage,

            life: 100
        });
    }
}

/* =========================
   PLAYER UPDATE
========================= */

function updatePlayer() {

    let dx = 0;
    let dy = 0;

    if (keys.w) dy--;
    if (keys.s) dy++;
    if (keys.a) dx--;
    if (keys.d) dx++;

    if (
        dx !== 0 ||
        dy !== 0
    ) {

        const length =
            Math.hypot(dx, dy);

        dx /= length;
        dy /= length;

        let speed =
            player.speed;

        if (
            player.dashTime > 0
        ) {

            speed = 11;

            player.dashTime--;

        }

        const oldX =
            player.x;

        const oldY =
            player.y;

        moveEntity(
            player,
            dx * speed,
            dy * speed
        );

        player.distance +=
            Math.hypot(
                player.x - oldX,
                player.y - oldY
            );

        if (
            player.distance > 5000 &&
            !achievements.explorer
        ) {

            achievements.explorer =
                true;

            showAchievement(
                "EXPLORER"
            );

            updateAchievements();

        }

    }

    if (
        keys.space &&
        player.dashCooldown <= 0 &&
        player.energy >= 25 &&
        (
            dx !== 0 ||
            dy !== 0
        )
    ) {

        player.dashTime = 10;

        player.dashCooldown = 70;

        player.energy -= 25;

        player.invincible = 25;

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

/* =========================
   ENEMIES UPDATE
========================= */

function updateEnemies() {

    for (
        const enemy of enemies
    ) {

        const dx =
            player.x - enemy.x;

        const dy =
            player.y - enemy.y;

        const distance =
            Math.hypot(dx, dy);

        if (
            distance > 70
        ) {

            if (
                enemy.type === "flying"
            ) {

                enemy.x +=
                    dx /
                    distance *
                    enemy.speed;

                enemy.y +=
                    dy /
                    distance *
                    enemy.speed;

            } else {

                moveEntity(

                    enemy,

                    dx /
                    distance *
                    enemy.speed,

                    dy /
                    distance *
                    enemy.speed

                );
            }
        }

        enemy.cooldown--;

        if (
            enemy.cooldown <= 0 &&
            distance < 700
        ) {

            enemy.cooldown =
                90 +
                Math.random() * 90;

            const angle =
                Math.atan2(
                    player.y - enemy.y,
                    player.x - enemy.x
                );

            bullets.push({

                x: enemy.x,

                y: enemy.y,

                vx:
                    Math.cos(angle) *
                    3,

                vy:
                    Math.sin(angle) *
                    3,

                enemy: true,

                damage: 8,

                life: 180
            });

        }

        if (
            distance <
            player.radius +
            enemy.radius
        ) {

            damagePlayer(0.4);

        }

    }
}

/* =========================
   BOSS UPDATE
========================= */

function updateBoss() {

    if (!boss) {
        return;
    }

    const dx =
        player.x - boss.x;

    const dy =
        player.y - boss.y;

    const distance =
        Math.hypot(dx, dy);

    if (
        distance > 120
    ) {

        moveEntity(

            boss,

            dx /
            distance *
            0.55,

            dy /
            distance *
            0.55

        );

    }

    boss.cooldown--;

    if (
        boss.cooldown <= 0
    ) {

        boss.cooldown =
            55;

        const angle =
            Math.atan2(
                player.y - boss.y,
                player.x - boss.x
            );

        for (
            let i = 0;
            i < 7;
            i++
        ) {

            const a =
                angle +
                (
                    i - 3
                ) *
                0.16;

            bullets.push({

                x: boss.x,

                y: boss.y,

                vx:
                    Math.cos(a) * 3.5,

                vy:
                    Math.sin(a) * 3.5,

                enemy: true,

                damage: 10,

                life: 200

            });
        }
    }

    if (
        distance <
        player.radius +
        boss.radius
    ) {

        damagePlayer(1);

    }

    if (
        id("bossFill")
    ) {

        id("bossFill").style.width =
            clamp(
                boss.hp /
                boss.maxHp *
                100,
                0,
                100
            ) + "%";

    }
}

/* =========================
   BULLETS UPDATE
========================= */

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

        if (
            bulletHitsWall(
                oldX,
                oldY,
                bullet.x,
                bullet.y
            )
        ) {

            bullets.splice(
                i,
                1
            );

            continue;
        }

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

            continue;
        }

        if (
            bullet.enemy
        ) {

            if (
                Math.hypot(
                    bullet.x - player.x,
                    bullet.y - player.y
                ) <
                player.radius + 5
            ) {

                damagePlayer(
                    bullet.damage
                );

                bullets.splice(
                    i,
                    1
                );

                continue;
            }

        } else {

            let destroyed =
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
                    ) <
                    enemy.radius + 6
                ) {

                    let damage =
                        bullet.damage;

                    if (
                        enemy.shield > 0
                    ) {

                        enemy.shield--;

                        damage *= 0.4;

                    }

                    enemy.hp -=
                        damage;

                    destroyed = true;

                    if (
                        enemy.hp <= 0
                    ) {

                        killEnemy(j);

                    }

                    break;
                }

            }

            if (
                boss &&
                !destroyed &&
                Math.hypot(
                    bullet.x -
                    boss.x,

                    bullet.y -
                    boss.y
                ) <
                boss.radius + 6
            ) {

                boss.hp -=
                    bullet.damage;

                destroyed = true;

                if (
                    boss.hp <= 0
                ) {

                    killBoss();

                }

            }

            if (
                destroyed
            ) {

                bullets.splice(
                    i,
                    1
                );

                continue;
            }
        }
    }
}

/* =========================
   KILLS
========================= */

function killEnemy(index) {

    const enemy =
        enemies[index];

    player.kills++;

    player.credits +=
        enemy.type === "shield"
            ? 20
            : 10;

    player.xp += 20;

    if (
        !achievements.firstEcho
    ) {

        achievements.firstEcho =
            true;

        showAchievement(
            "FIRST ECHO"
        );

    }

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

    enemies.splice(
        index,
        1
    );

    createEnemy();

    if (
        player.kills === 12 &&
        !boss
    ) {

        createBoss();

    }

    checkLevel();

    updateAchievements();

}

function killBoss() {

    boss = null;

    player.credits +=
        200;

    player.xp +=
        100;

    achievements.bossSlayer =
        true;

    if (
        id("bossHud")
    ) {

        id("bossHud").style.display =
            "none";
    }

    showAchievement(
        "BOSS SLAYER"
    );

    checkLevel();

    updateAchievements();

}

/* =========================
   LEVEL
========================= */

function checkLevel() {

    const need =
        player.level * 100;

    if (
        player.xp >= need
    ) {

        player.xp -= need;

        player.level++;

        player.maxHealth +=
            10;

        player.health =
            player.maxHealth;

        player.maxEnergy +=
            10;

        player.energy =
            player.maxEnergy;

        showAchievement(
            "LEVEL " +
            player.level
        );

    }
}

/* =========================
   DAMAGE
========================= */

function damagePlayer(
    amount
) {

    if (
        player.invincible > 0
    ) {

        return;
    }

    player.health -=
        amount;

    player.invincible =
        25;

    if (
        player.health <= 0
    ) {

        player.health =
            0;

        gameOver();
    }
}

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

            if (
                retry
            ) {

                startGame();

            } else {

                id("menu")
                    .style.display =
                    "flex";

            }

        },
        100
    );
}

/* =========================
   PARTICLES
========================= */

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

        particles.push({

            x,
            y,

            vx:
                (
                    Math.random() -
                    0.5
                ) * 4,

            vy:
                (
                    Math.random() -
                    0.5
                ) * 4,

            life: 30

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

/* =========================
   DRAW
========================= */

function updateCamera() {

    camera.x =
        clamp(
            player.x -
            W / 2,
            0,
            Math.max(
                0,
                WORLD_WIDTH - W
            )
        );

    camera.y =
        clamp(
            player.y -
            H / 2,
            0,
            Math.max(
                0,
                WORLD_HEIGHT - H
            )
        );

}

function drawWorld() {

    ctx.fillStyle =
        "#0a151c";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    const grid = 100;

    for (
        let x =
            -(camera.x % grid);

        x < W;

        x += grid
    ) {

        ctx.strokeStyle =
            "rgba(100,180,220,.06)";

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
            -(camera.y % grid);

        y < H;

        y += grid
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

    drawWalls();

}

function drawWalls() {

    for (
        const wall of walls
    ) {

        const x =
            wall.x -
            camera.x;

        const y =
            wall.y -
            camera.y;

        ctx.fillStyle =
            "#1b2d37";

        ctx.fillRect(
            x,
            y,
            wall.w,
            wall.h
        );

        ctx.strokeStyle =
            "#5d91a7";

        ctx.lineWidth =
            2;

        ctx.strokeRect(
            x,
            y,
            wall.w,
            wall.h
        );

        ctx.fillStyle =
            "rgba(100,220,255,.35)";

        if (
            wall.w > wall.h
        ) {

            ctx.fillRect(
                x + 8,
                y +
                wall.h / 2 -
                2,
                wall.w - 16,
                4
            );

        } else {

            ctx.fillRect(
                x +
                wall.w / 2 -
                2,
                y + 8,
                4,
                wall.h - 16
            );
        }

    }
}

function drawPlayer() {

    const x =
        player.x -
        camera.x;

    const y =
        player.y -
        camera.y;

    ctx.fillStyle =
        player.invincible > 0
            ? "white"
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

    const targetX =
        camera.x +
        mouse.x;

    const targetY =
        camera.y +
        mouse.y;

    const angle =
        Math.atan2(
            targetY -
            player.y,
            targetX -
            player.x
        );

    ctx.strokeStyle =
        "white";

    ctx.lineWidth =
        6;

    ctx.beginPath();

    ctx.moveTo(
        x,
        y
    );

    ctx.lineTo(

        x +
        Math.cos(angle) *
        30,

        y +
        Math.sin(angle) *
        30

    );

    ctx.stroke();

}

function drawEnemies() {

    for (
        const enemy of enemies
    ) {

        const x =
            enemy.x -
            camera.x;

        const y =
            enemy.y -
            camera.y;

        let color =
            "#bb70ff";

        if (
            enemy.type === "fast"
        ) {
            color = "#ff78a5";
        }

        if (
            enemy.type === "shield"
        ) {
            color = "#69cfff";
        }

        if (
            enemy.type === "flying"
        ) {
            color = "#72e4b0";
        }

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

        if (
            enemy.shield > 0
        ) {

            ctx.strokeStyle =
                "#8ae7ff";

            ctx.lineWidth =
                3;

            ctx.stroke();

        }

        ctx.fillStyle =
            "white";

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            4,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }
}

function drawBoss() {

    if (
        !boss
    ) {
        return;
    }

    const x =
        boss.x -
        camera.x;

    const y =
        boss.y -
        camera.y;

    ctx.fillStyle =
        "rgba(255,100,70,.2)";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        boss.radius + 15,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#ff7659";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        boss.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

}

function drawBullets() {

    for (
        const bullet of bullets
    ) {

        ctx.fillStyle =
            bullet.enemy
                ? "#ff9b78"
                : "#7be0ff";

        ctx.beginPath();

        ctx.arc(

            bullet.x -
            camera.x,

            bullet.y -
            camera.y,

            5,

            0,
            Math.PI * 2

        );

        ctx.fill();

    }
}

function drawParticles() {

    for (
        const p of particles
    ) {

        ctx.globalAlpha =
            p.life / 30;

        ctx.fillStyle =
            "#9feaff";

        ctx.fillRect(

            p.x -
            camera.x,

            p.y -
            camera.y,

            4,
            4

        );
    }

    ctx.globalAlpha = 1;
}

/* =========================
   HUD
========================= */

function updateHUD() {

    if (
        !player
    ) {
        return;
    }

    if (
        id("healthBar")
    ) {

        id("healthBar").style.width =
            player.health /
            player.maxHealth *
            100 +
            "%";

    }

    if (
        id("energyBar")
    ) {

        id("energyBar").style.width =
            player.energy /
            player.maxEnergy *
            100 +
            "%";

    }

    if (
        id("ammo")
    ) {

        id("ammo").textContent =
            player.ammo +
            " / ∞";

    }

    if (
        id("kills")
    ) {

        id("kills").textContent =
            "KILLS: " +
            player.kills;

    }

    if (
        id("credits")
    ) {

        id("credits").textContent =
            "CREDITS: " +
            player.credits;

    }

    if (
        id("zone")
    ) {

        id("zone").textContent =
            "LEVEL " +
            player.level;

    }

}

/* =========================
   SAVE
========================= */

function saveGame() {

    if (
        !player
    ) {
        return;
    }

    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({

            player,
            achievements

        })
    );

    if (
        !achievements.firstSave
    ) {

        achievements.firstSave =
            true;

        showAchievement(
            "FIRST SAVE"
        );

        updateAchievements();

    } else {

        showAchievement(
            "GAME SAVED"
        );

    }
}

/* =========================
   START
========================= */

function startGame() {

    createPlayer();

    enemies = [];
    bullets = [];
    particles = [];
    pickups = [];

    boss = null;

    for (
        let i = 0;
        i < 16;
        i++
    ) {

        createEnemy();

    }

    gameRunning =
        true;

    paused =
        false;

    mouse.down =
        false;

    id("menu").style.display =
        "none";

    id("pause").style.display =
        "none";

    id("map").style.display =
        "none";

    closeAchievements();

    updateHUD();
}

/* =========================
   BUTTONS
========================= */

if (
    id("newGame")
) {

    id("newGame").onclick =
        startGame;

}

if (
    id("loadGame")
) {

    id("loadGame").onclick =
        function () {

            const save =
                localStorage.getItem(
                    SAVE_KEY
                );

            if (!save) {

                alert(
                    "Er is nog geen opgeslagen game."
                );

                return;

            }

            try {

                const data =
                    JSON.parse(save);

                player =
                    data.player;

                achievements =
                    data.achievements ||
                    achievements;

                enemies = [];
                bullets = [];
                particles = [];
                pickups = [];

                for (
                    let i = 0;
                    i < 16;
                    i++
                ) {

                    createEnemy();

                }

                gameRunning =
                    true;

                paused =
                    false;

                id("menu").style.display =
                    "none";

                updateHUD();

            } catch (
                error
            ) {

                alert(
                    "Save kon niet worden geladen."
                );

            }

        };

}

if (
    id("achievementsButton")
) {

    id("achievementsButton").onclick =
        openAchievements;

}

if (
    id("controlsButton")
) {

    id("controlsButton").onclick =
        function () {

            alert(

                "BESTURING\n\n" +

                "W A S D = bewegen\n\n" +

                "MUIS = richten\n\n" +

                "LINKERMUISKNOP = schieten\n\n" +

                "1 2 3 4 = wapens\n\n" +

                "SPACE = dash\n\n" +

                "ESC = pauze"

            );

        };

}

if (
    id("resume")
) {

    id("resume").onclick =
        function () {

            paused =
                false;

            id("pause").style.display =
                "none";

        };

}

if (
    id("save")
) {

    id("save").onclick =
        saveGame;

}

if (
    id("quit")
) {

    id("quit").onclick =
        function () {

            saveGame();

            gameRunning =
                false;

            id("pause").style.display =
                "none";

            id("menu").style.display =
                "flex";

        };

}

if (
    id("closeMap")
) {

    id("closeMap").onclick =
        function () {

            id("map").style.display =
                "none";

        };

}

/* =========================
   KEYBOARD
========================= */

window.addEventListener(
    "keydown",
    function (event) {

        const key =
            event.key.toLowerCase();

        keys[key] =
            true;

        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            keys.space =
                true;

        }

        if (
            key === "1"
        ) {
            player &&
            (player.weapon = 0);
        }

        if (
            key === "2"
        ) {
            player &&
            (player.weapon = 1);
        }

        if (
            key === "3"
        ) {
            player &&
            (player.weapon = 2);
        }

        if (
            key === "4"
        ) {
            player &&
            (player.weapon = 3);
        }

        if (
            key === "m" &&
            gameRunning &&
            !paused
        ) {

            const map =
                id("map");

            map.style.display =
                map.style.display ===
                "flex"
                    ? "none"
                    : "flex";

            if (
                map.style.display ===
                "flex"
            ) {

                drawMap();

            }

        }

        if (
            key === "escape"
        ) {

            if (
                id("achievementsPage") &&
                id("achievementsPage")
                    .style.display ===
                    "flex"
            ) {

                closeAchievements();

                return;

            }

            if (
                gameRunning
            ) {

                paused =
                    !paused;

                id("pause").style.display =
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

        keys[
            event.key.toLowerCase()
        ] = false;

        if (
            event.code === "Space"
        ) {

            keys.space =
                false;

        }

    }
);

/* =========================
   MOUSE
========================= */

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
            event.button === 0
        ) {

            mouse.down =
                true;

        }

    }
);

window.addEventListener(
    "mouseup",
    function (event) {

        if (
            event.button === 0
        ) {

            mouse.down =
                false;

        }

    }
);

/* =========================
   MAP
========================= */

function drawMap() {

    if (
        !mapCanvas ||
        !player
    ) {
        return;
    }

    const rect =
        mapCanvas.getBoundingClientRect();

    mapCanvas.width =
        Math.max(
            300,
            rect.width
        );

    mapCanvas.height =
        Math.max(
            250,
            rect.height
        );

    mapCtx.fillStyle =
        "#061019";

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

    for (
        const wall of walls
    ) {

        mapCtx.fillStyle =
            "#395765";

        mapCtx.fillRect(

            wall.x * sx,
            wall.y * sy,
            wall.w * sx,
            wall.h * sy

        );

    }

    mapCtx.fillStyle =
        "#72d8ff";

    mapCtx.beginPath();

    mapCtx.arc(

        player.x * sx,
        player.y * sy,

        6,

        0,
        Math.PI * 2

    );

    mapCtx.fill();

}

/* =========================
   ACHIEVEMENT POPUP
========================= */

function showAchievement(
    name
) {

    const box =
        id("achievement");

    const label =
        id("achievementName");

    if (
        !box ||
        !label
    ) {
        return;
    }

    label.textContent =
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
        2500
    );
}

/* =========================
   LOOP
========================= */

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

    updateBoss();

    updateBullets();

    updateParticles();

    updateCamera();

    if (
        mouse.down
    ) {

        shoot();

    }

    updateHUD();

}

function draw() {

    drawWorld();

    if (
        !player
    ) {
        return;
    }

    drawParticles();

    drawBullets();

    drawEnemies();

    drawBoss();

    drawPlayer();

}

function loop() {

    update();

    draw();

    requestAnimationFrame(
        loop
    );

}

makeAchievementsPage();

loop();

updateHUD();
