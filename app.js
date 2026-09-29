/* =========================================================
   ECHOBOUND — THE LOST SIGNAL
   Uitgebreide 3D-versie
   Geen bloed / gore
   ========================================================= */

(async () => {
"use strict";

/* =========================================================
   THREE.JS LADEN
   ========================================================= */

let THREE;

try {
    THREE = await import(
        "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"
    );
} catch (error) {
    document.body.innerHTML = `
        <div style="
            background:#05080d;
            color:white;
            min-height:100vh;
            padding:50px;
            font-family:Arial;
        ">
            <h1>EchoBound</h1>
            <p>Three.js kon niet worden geladen.</p>
            <p>Controleer je internetverbinding en probeer opnieuw.</p>
        </div>
    `;
    return;
}

/* =========================================================
   OUDE CANVAS VERWIJDEREN
   ========================================================= */

const oldCanvas = document.getElementById("game");

if (oldCanvas) {
    oldCanvas.remove();
}

const canvas = document.createElement("canvas");
canvas.id = "game";
document.body.prepend(canvas);

/* =========================================================
   RENDERER
   ========================================================= */

const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

/* =========================================================
   SCENE
   ========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x071017);

scene.fog = new THREE.FogExp2(
    0x071017,
    0.007
);

/* =========================================================
   CAMERA
   ========================================================= */

const camera = new THREE.PerspectiveCamera(
    67,
    window.innerWidth / window.innerHeight,
    0.1,
    900
);

camera.position.set(0, 8, 13);

/* =========================================================
   CLOCK
   ========================================================= */

const clock = new THREE.Clock();

/* =========================================================
   WORLD
   ========================================================= */

const world = new THREE.Group();
scene.add(world);

const environment = new THREE.Group();
const enemyGroup = new THREE.Group();
const projectileGroup = new THREE.Group();
const effectGroup = new THREE.Group();

world.add(environment);
world.add(enemyGroup);
world.add(projectileGroup);
world.add(effectGroup);

/* =========================================================
   GAME STATE
   ========================================================= */

const game = {

    running: false,
    paused: false,
    dead: false,

    saveSlot: 1,

    wave: 1,
    kills: 0,

    credits: 100,

    level: 1,
    xp: 0,
    nextXP: 100,

    health: 100,
    maxHealth: 100,

    armor: 40,
    maxArmor: 40,

    energy: 100,
    maxEnergy: 100,

    ammo: 18,
    maxAmmo: 18,

    weapon: 0,

    sector: "OUTER WILDS",

    objective: "FIND THE LOST SIGNAL",

    keys: 0,

    cores: 0,

    missionProgress: 0,

    bossDefeated: false,

    unlocked: {
        pulse: true,
        arc: false,
        burst: false
    },

    inventory: {
        medkit: 2,
        energyCell: 2,
        signalCore: 0
    },

    achievements: {
        firstEcho: false,
        collector: false,
        guardian: false,
        levelFive: false,
        explorer: false,
        weapons: false
    }

};

/* =========================================================
   INPUT
   ========================================================= */

const keys = {};

let mouseX = 0;
let mouseY = 0;

window.addEventListener("keydown", event => {

    keys[event.code] = true;

    if (event.code === "Escape") {
        togglePause();
    }

    if (event.code === "Space" && !event.repeat) {
        dash();
    }

    if (event.code === "KeyR") {
        reload();
    }

    if (event.code === "KeyI") {
        showInventory();
    }

    if (event.code === "KeyB") {
        showShop();
    }

    if (event.code === "KeyM") {
        showAchievements();
    }

    if (event.code === "KeyJ") {
        showMission();
    }

    if (event.code === "KeyE") {
        interact();
    }

    if (event.code === "Digit1") {
        changeWeapon(0);
    }

    if (event.code === "Digit2") {
        changeWeapon(1);
    }

    if (event.code === "Digit3") {
        changeWeapon(2);
    }

});

window.addEventListener("keyup", event => {
    keys[event.code] = false;
});

window.addEventListener("mousemove", event => {

    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

});

window.addEventListener("mousedown", event => {

    if (event.button === 0) {
        shoot();
    }

});

/* =========================================================
   MATERIAL HELPERS
   ========================================================= */

function material(color, roughness = 0.7, metalness = 0.1) {

    return new THREE.MeshStandardMaterial({
        color: color,
        roughness: roughness,
        metalness: metalness
    });

}

function createBox(
    color,
    width,
    height,
    depth
) {

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(
            width,
            height,
            depth
        ),
        material(color)
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;

}

function createCylinder(
    color,
    radius,
    height
) {

    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
            radius,
            radius,
            height,
            12
        ),
        material(color)
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;

}

function createGlow(
    color,
    intensity,
    distance
) {

    return new THREE.PointLight(
        color,
        intensity,
        distance
    );

}

/* =========================================================
   LIGHTING
   ========================================================= */

const hemiLight =
    new THREE.HemisphereLight(
        0x9ed8ff,
        0x10150f,
        1.4
    );

scene.add(hemiLight);

const sun =
    new THREE.DirectionalLight(
        0xc8e5ff,
        2.2
    );

sun.position.set(
    -100,
    130,
    80
);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -220;
sun.shadow.camera.right = 220;
sun.shadow.camera.top = 220;
sun.shadow.camera.bottom = -220;

scene.add(sun);

const moon =
    new THREE.DirectionalLight(
        0x506cff,
        0.25
    );

moon.position.set(
    100,
    80,
    -100
);

scene.add(moon);

/* =========================================================
   GROUND
   ========================================================= */

const ground =
    createBox(
        0x10191d,
        420,
        1,
        420
    );

ground.position.y = -0.6;

world.add(ground);

/* =========================================================
   GRID
   ========================================================= */

const grid =
    new THREE.GridHelper(
        420,
        84,
        0x24414b,
        0x15272d
    );

grid.position.y = -0.08;

grid.material.transparent = true;
grid.material.opacity = 0.22;

world.add(grid);

/* =========================================================
   PLAYER
   ========================================================= */

const player =
    new THREE.Group();

player.position.set(
    0,
    0,
    12
);

world.add(player);

/* BODY */

const playerBody =
    createBox(
        0x263d4a,
        1.5,
        1.7,
        1.1
    );

playerBody.position.y = 1.5;

player.add(playerBody);

/* HEAD */

const playerHead =
    createCylinder(
        0xb9c8d0,
        0.46,
        0.65
    );

playerHead.position.y = 2.7;

player.add(playerHead);

/* VISOR */

const visor =
    createBox(
        0x4de5ff,
        0.62,
        0.18,
        0.08
    );

visor.position.set(
    0,
    2.78,
    -0.43
);

player.add(visor);

/* WEAPON */

const playerWeapon =
    createBox(
        0x141b21,
        0.3,
        0.28,
        1.9
    );

playerWeapon.position.set(
    0.62,
    1.48,
    -0.95
);

player.add(playerWeapon);

/* PLAYER LIGHT */

const playerLight =
    createGlow(
        0x42eaff,
        2.4,
        13
    );

playerLight.position.y = 2;

player.add(playerLight);

/* RING */

const playerRing =
    new THREE.Mesh(
        new THREE.TorusGeometry(
            1.2,
            0.045,
            8,
            32
        ),
        new THREE.MeshBasicMaterial({
            color: 0x51eaff
        })
    );

playerRing.rotation.x =
    Math.PI / 2;

playerRing.position.y = 0.08;

player.add(playerRing);

/* =========================================================
   WEAPONS
   ========================================================= */

const weapons = [

    {
        name: "PULSE",
        damage: 28,
        fireRate: 0.18,
        speed: 65,
        pellets: 1,
        spread: 0.01
    },

    {
        name: "ARC",
        damage: 18,
        fireRate: 0.11,
        speed: 75,
        pellets: 3,
        spread: 0.04
    },

    {
        name: "BURST",
        damage: 22,
        fireRate: 0.3,
        speed: 70,
        pellets: 4,
        spread: 0.035
    }

];

let lastShot = 0;

/* =========================================================
   TREES
   ========================================================= */

function createTree(
    x,
    z,
    scale
) {

    const tree =
        new THREE.Group();

    tree.position.set(
        x,
        0,
        z
    );

    tree.scale.setScalar(scale);

    const trunk =
        createCylinder(
            0x4a3224,
            0.4,
            5
        );

    trunk.position.y = 2.5;

    tree.add(trunk);

    for (let i = 0; i < 3; i++) {

        const leaves =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    2.7 - i * 0.35,
                    4.3,
                    8
                ),
                material(
                    i === 0
                        ? 0x16382a
                        : 0x20533a
                )
            );

        leaves.position.y =
            4.3 + i * 1.35;

        leaves.castShadow = true;

        tree.add(leaves);

    }

    environment.add(tree);

}

/* =========================================================
   GENERATE FOREST
   ========================================================= */

for (let i = 0; i < 130; i++) {

    const x =
        (Math.random() - 0.5) * 390;

    const z =
        (Math.random() - 0.5) * 390;

    if (Math.hypot(x, z) < 32) {
        continue;
    }

    createTree(
        x,
        z,
        0.65 + Math.random() * 0.8
    );

}

/* =========================================================
   BUILDINGS
   ========================================================= */

function createBuilding(
    x,
    z,
    width,
    depth,
    height
) {

    const group =
        new THREE.Group();

    group.position.set(
        x,
        0,
        z
    );

    const body =
        createBox(
            0x27343a,
            width,
            height,
            depth
        );

    body.position.y =
        height / 2;

    group.add(body);

    const roof =
        createBox(
            0x11191d,
            width + 0.7,
            0.4,
            depth + 0.7
        );

    roof.position.y =
        height + 0.2;

    group.add(roof);

    for (let i = 0; i < 3; i++) {

        const window =
            createBox(
                0x58c9d7,
                1.3,
                1.4,
                0.12
            );

        window.position.set(
            -width * 0.25 + i * width * 0.25,
            height * 0.55,
            depth / 2 + 0.08
        );

        group.add(window);

    }

    environment.add(group);

}

/* =========================================================
   BUILDINGS
   ========================================================= */

createBuilding(
    -35,
    -35,
    16,
    13,
    8
);

createBuilding(
    42,
    -45,
    20,
    15,
    10
);

createBuilding(
    55,
    38,
    14,
    18,
    7
);

createBuilding(
    -55,
    48,
    24,
    12,
    9
);

/* =========================================================
   LAMPS
   ========================================================= */

function createLamp(
    x,
    z
) {

    const pole =
        createCylinder(
            0x303a40,
            0.14,
            5
        );

    pole.position.set(
        x,
        2.5,
        z
    );

    environment.add(pole);

    const light =
        createGlow(
            0x55eaff,
            2,
            17
        );

    light.position.set(
        x,
        5,
        z
    );

    environment.add(light);

    const bulb =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.22,
                12,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0xcfffff,
                emissive: 0x4deaff,
                emissiveIntensity: 5
            })
        );

    bulb.position.set(
        x,
        5,
        z
    );

    environment.add(bulb);

}

for (let i = 0; i < 32; i++) {

    createLamp(
        (Math.random() - 0.5) * 310,
        (Math.random() - 0.5) * 310
    );

}

/* =========================================================
   CRATES
   ========================================================= */

for (let i = 0; i < 70; i++) {

    const crate =
        createBox(
            0x674b2e,
            1.5,
            1.5,
            1.5
        );

    crate.position.set(
        (Math.random() - 0.5) * 350,
        0.75,
        (Math.random() - 0.5) * 350
    );

    crate.rotation.y =
        Math.random() * Math.PI;

    environment.add(crate);

}

/* =========================================================
   ENEMY CREATION
   ========================================================= */

function createEnemy(
    type,
    x,
    z
) {

    const data = {

        scout: {
            color: 0x58ead1,
            health: 35,
            speed: 3.2,
            damage: 7,
            range: 1
        },

        hunter: {
            color: 0xffc857,
            health: 60,
            speed: 2.5,
            damage: 10,
            range: 18
        },

        brute: {
            color: 0xff7254,
            health: 150,
            speed: 1.1,
            damage: 17,
            range: 3
        },

        sniper: {
            color: 0xd39cff,
            health: 45,
            speed: 1.4,
            damage: 14,
            range: 42
        },

        guardian: {
            color: 0x68aaff,
            health: 500,
            speed: 0.8,
            damage: 20,
            range: 55
        }

    }[type];

    const enemy =
        new THREE.Group();

    enemy.position.set(
        x,
        0,
        z
    );

    enemy.userData = {

        type: type,

        health: data.health,
        maxHealth: data.health,

        speed: data.speed,

        damage: data.damage,

        range: data.range,

        cooldown:
            1 + Math.random() * 2

    };

    const body =
        createBox(
            data.color,
            type === "guardian" ? 2.8 : 1.3,
            type === "guardian" ? 3.2 : 1.8,
            type === "guardian" ? 2.8 : 1.3
        );

    body.position.y =
        type === "guardian"
            ? 1.7
            : 1.2;

    enemy.add(body);

    const core =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                type === "guardian"
                    ? 0.65
                    : 0.3,
                12,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: data.color,
                emissive: data.color,
                emissiveIntensity: 3
            })
        );

    core.position.y =
        type === "guardian"
            ? 3.5
            : 2.2;

    enemy.add(core);

    const light =
        createGlow(
            data.color,
            type === "guardian"
                ? 3.5
                : 1.3,
            type === "guardian"
                ? 12
                : 7
        );

    light.position.y =
        type === "guardian"
            ? 2.5
            : 1.5;

    enemy.add(light);

    enemyGroup.add(enemy);

    return enemy;

}

/* =========================================================
   ENEMY SPAWNING
   ========================================================= */

function spawnEnemies() {

    const wanted =
        Math.min(
            8 + game.wave * 2,
            24
        );

    while (
        enemyGroup.children.length <
        wanted
    ) {

        const angle =
            Math.random() * Math.PI * 2;

        const distance =
            45 + Math.random() * 90;

        const x =
            player.position.x +
            Math.cos(angle) * distance;

        const z =
            player.position.z +
            Math.sin(angle) * distance;

        const roll =
            Math.random();

        let type;

        if (roll < 0.45) {
            type = "scout";
        } else if (roll < 0.72) {
            type = "hunter";
        } else if (roll < 0.88) {
            type = "sniper";
        } else {
            type = "brute";
        }

        createEnemy(
            x,
            z
        );

        enemyGroup.children[
            enemyGroup.children.length - 1
        ].userData.type = type;

    }

    /* BOSS */

    if (
        game.wave % 5 === 0 &&
        !game.bossDefeated &&
        !enemyGroup.children.some(
            e => e.userData.type === "guardian"
        )
    ) {

        const angle =
            Math.random() * Math.PI * 2;

        createEnemy(
            player.position.x +
            Math.cos(angle) * 80,

            player.position.z +
            Math.sin(angle) * 80
        );

        const boss =
            enemyGroup.children[
                enemyGroup.children.length - 1
            ];

        boss.userData.type =
            "guardian";

        boss.userData.health =
            500 + game.wave * 60;

        boss.userData.maxHealth =
            boss.userData.health;

        showMessage(
            "⚠ GUARDIAN DETECTED ⚠"
        );

    }

}

/* =========================================================
   PROJECTILES
   ========================================================= */

function createProjectile(
    position,
    direction,
    damage,
    enemyProjectile = false
) {

    const projectile =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                enemyProjectile
                    ? 0.14
                    : 0.11,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color:
                    enemyProjectile
                        ? 0xff7655
                        : 0x63efff
            })
        );

    projectile.position.copy(
        position
    );

    projectile.userData = {

        velocity:
            direction.clone(),

        damage: damage,

        enemy:
            enemyProjectile,

        life: 2

    };

    projectileGroup.add(
        projectile
    );

}

/* =========================================================
   SHOOTING
   ========================================================= */

function shoot() {

    if (
        !game.running ||
        game.paused ||
        game.dead
    ) {
        return;
    }

    const weapon =
        weapons[game.weapon];

    const now =
        performance.now() / 1000;

    if (
        now - lastShot <
        weapon.fireRate
    ) {
        return;
    }

    if (game.ammo <= 0) {

        showMessage(
            "RELOAD — R"
        );

        return;
    }

    lastShot = now;

    game.ammo--;

    const direction =
        new THREE.Vector3(
            0,
            0,
            -1
        ).applyQuaternion(
            player.quaternion
        );

    for (
        let i = 0;
        i < weapon.pellets;
        i++
    ) {

        const shotDirection =
            direction.clone();

        shotDirection.x +=
            (Math.random() - 0.5) *
            weapon.spread;

        shotDirection.y +=
            (Math.random() - 0.5) *
            weapon.spread;

        shotDirection.z +=
            (Math.random() - 0.5) *
            weapon.spread;

        shotDirection.normalize();

        createProjectile(

            player.position.clone().add(
                new THREE.Vector3(
                    0,
                    1.5,
                    -1
                )
            ),

            shotDirection.multiplyScalar(
                weapon.speed
            ),

            weapon.damage

        );

    }

}

/* =========================================================
   RELOAD
   ========================================================= */

function reload() {

    if (!game.running) {
        return;
    }

    game.ammo =
        game.maxAmmo;

    showMessage(
        "RELOADED"
    );

}

/* =========================================================
   ENEMY DAMAGE
   ========================================================= */

function damageEnemy(
    enemy,
    amount
) {

    enemy.userData.health -=
        amount;

    const mesh =
        enemy.children.find(
            object =>
                object.isMesh
        );

    if (mesh) {

        const oldScale =
            mesh.scale.clone();

        mesh.scale.setScalar(
            1.18
        );

        setTimeout(() => {

            mesh.scale.copy(
                oldScale
            );

        }, 80);

    }

    if (
        enemy.userData.health <= 0
    ) {

        defeatEnemy(enemy);

    }

}

/* =========================================================
   ENEMY DEFEATED
   ========================================================= */

function defeatEnemy(
    enemy
) {

    const type =
        enemy.userData.type;

    game.kills++;

    if (type === "guardian") {

        game.credits += 600;

        game.bossDefeated =
            true;

        game.achievements.guardian =
            true;

        showMessage(
            "GUARDIAN DEFEATED!"
        );

    } else {

        game.credits +=
            type === "brute"
                ? 100
                : 35;

    }

    addXP(
        type === "guardian"
            ? 500
            : 70
    );

    if (
        !game.achievements.firstEcho
    ) {

        game.achievements.firstEcho =
            true;

    }

    /* DROP */

    if (
        Math.random() < 0.22
    ) {

        game.inventory.signalCore++;

        game.cores++;

        showMessage(
            "SIGNAL CORE FOUND"
        );

    }

    enemy.remove();

    if (
        game.kills > 0 &&
        game.kills % 12 === 0
    ) {

        game.wave++;

        game.objective =
            "SURVIVE WAVE " +
            game.wave;

        showMessage(
            "WAVE " +
            game.wave
        );

    }

}

/* =========================================================
   XP
   ========================================================= */

function addXP(
    amount
) {

    game.xp += amount;

    while (
        game.xp >=
        game.nextXP
    ) {

        game.xp -=
            game.nextXP;

        game.level++;

        game.nextXP =
            Math.floor(
                game.nextXP * 1.35
            );

        game.maxHealth += 10;

        game.health =
            game.maxHealth;

        game.maxEnergy += 5;

        game.energy =
            game.maxEnergy;

        showMessage(
            "LEVEL UP — LEVEL " +
            game.level
        );

        if (
            game.level >= 5
        ) {

            game.achievements.levelFive =
                true;

        }

    }

}

/* =========================================================
   PLAYER DAMAGE
   ========================================================= */

function damagePlayer(
    amount
) {

    if (
        game.dead ||
        game.paused
    ) {
        return;
    }

    if (
        game.armor > 0
    ) {

        const armorDamage =
            Math.min(
                game.armor,
                amount
            );

        game.armor -=
            armorDamage;

        amount -=
            armorDamage;

    }

    game.health -=
        amount;

    if (
        game.health <= 0
    ) {

        game.health = 0;

        gameOver();

    }

}

/* =========================================================
   DASH
   ========================================================= */

function dash() {

    if (
        !game.running ||
        game.paused ||
        game.dead
    ) {
        return;
    }

    if (
        game.energy < 25
    ) {
        return;
    }

    game.energy -= 25;

    const direction =
        new THREE.Vector3(
            (keys.KeyD ? 1 : 0) -
            (keys.KeyA ? 1 : 0),

            0,

            (keys.KeyS ? 1 : 0) -
            (keys.KeyW ? 1 : 0)
        );

    if (
        direction.lengthSq() === 0
    ) {

        direction.set(
            0,
            0,
            -1
        ).applyQuaternion(
            player.quaternion
        );

    }

    direction.normalize();

    player.position.addScaledVector(
        direction,
        11
    );

    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const effect =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.09,
                    6,
                    6
                ),
                new THREE.MeshBasicMaterial({
                    color: 0x52eaff
                })
            );

        effect.position.copy(
            player.position
        );

        effect.position.y +=
            Math.random() * 2;

        effectGroup.add(
            effect
        );

        setTimeout(() => {
            effect.remove();
        }, 450);

    }

}

/* =========================================================
   CHANGE WEAPON
   ========================================================= */

function changeWeapon(
    weapon
) {

    if (
        weapon === 1 &&
        !game.unlocked.arc
    ) {

        showMessage(
            "ARC IS LOCKED"
        );

        return;
    }

    if (
        weapon === 2 &&
        !game.unlocked.burst
    ) {

        showMessage(
            "BURST IS LOCKED"
        );

        return;
    }

    game.weapon =
        weapon;

    showMessage(
        weapons[weapon].name
    );

}

/* =========================================================
   PLAYER UPDATE
   ========================================================= */

function updatePlayer(
    delta
) {

    if (
        game.paused ||
        !game.running ||
        game.dead
    ) {
        return;
    }

    const movement =
        new THREE.Vector3(

            (keys.KeyD ? 1 : 0) -
            (keys.KeyA ? 1 : 0),

            0,

            (keys.KeyS ? 1 : 0) -
            (keys.KeyW ? 1 : 0)

        );

    if (
        movement.lengthSq() > 0
    ) {

        movement.normalize();

        const speed = 10;

        player.position.addScaledVector(
            movement,
            speed * delta
        );

        player.rotation.y =
            Math.atan2(
                movement.x,
                movement.z
            );

    }

    player.position.x =
        THREE.MathUtils.clamp(
            player.position.x,
            -198,
            198
        );

    player.position.z =
        THREE.MathUtils.clamp(
            player.position.z,
            -198,
            198
        );

    game.energy =
        Math.min(
            game.maxEnergy,
            game.energy + 10 * delta
        );

}

/* =========================================================
   ENEMY UPDATE
   ========================================================= */

function updateEnemies(
    delta
) {

    if (
        game.paused ||
        !game.running ||
        game.dead
    ) {
        return;
    }

    for (
        const enemy of
        [...enemyGroup.children]
    ) {

        const data =
            enemy.userData;

        const dx =
            player.position.x -
            enemy.position.x;

        const dz =
            player.position.z -
            enemy.position.z;

        const distance =
            Math.hypot(
                dx,
                dz
            );

        /* DESPAWN TE VER */

        if (
            distance > 160
        ) {

            enemy.remove();

            continue;

        }

        /* BEWEGEN */

        if (
            distance >
            data.range
        ) {

            enemy.position.x +=
                dx / distance *
                data.speed *
                delta;

            enemy.position.z +=
                dz / distance *
                data.speed *
                delta;

        }

        /* RICHTING SPELER */

        enemy.rotation.y =
            Math.atan2(
                dx,
                dz
            );

        /* MELEE */

        if (
            distance < 4 &&
            data.type !== "sniper"
        ) {

            data.cooldown -=
                delta;

            if (
                data.cooldown <= 0
            ) {

                data.cooldown =
                    data.type === "guardian"
                        ? 0.9
                        : 1.5;

                damagePlayer(
                    data.damage
                );

            }

        }

        /* RANGED */

        else if (
            data.type !== "scout" &&
            distance <
            70
        ) {

            data.cooldown -=
                delta;

            if (
                data.cooldown <= 0
            ) {

                data.cooldown =
                    data.type === "guardian"
                        ? 0.8
                        : 1.8;

                const direction =
                    new THREE.Vector3(
                        dx,
                        0,
                        dz
                    ).normalize();

                createProjectile(

                    enemy.position.clone().add(
                        new THREE.Vector3(
                            0,
                            1.5,
                            0
                        )
                    ),

                    direction.multiplyScalar(
                        18
                    ),

                    data.damage,

                    true

                );

            }

        }

    }

}

/* =========================================================
   PROJECTILES UPDATE
   ========================================================= */

function updateProjectiles(
    delta
) {

    for (
        const projectile of
        [...projectileGroup.children]
    ) {

        const data =
            projectile.userData;

        projectile.position.addScaledVector(
            data.velocity,
            delta
        );

        data.life -=
            delta;

        if (
            data.life <= 0
        ) {

            projectile.remove();

            continue;

        }

        /* ENEMY BULLET */

        if (
            data.enemy
        ) {

            if (
                projectile.position.distanceTo(
                    player.position
                ) < 1.5
            ) {

                damagePlayer(
                    data.damage
                );

                projectile.remove();

            }

            continue;

        }

        /* PLAYER BULLET */

        for (
            const enemy of
            [...enemyGroup.children]
        ) {

            const target =
                enemy.position.clone();

            target.y +=
                enemy.userData.type ===
                "guardian"
                    ? 2
                    : 1;

            if (
                projectile.position.distanceTo(
                    target
                ) < 1.8
            ) {

                damageEnemy(
                    enemy,
                    data.damage
                );

                projectile.remove();

                break;

            }

        }

    }

}

/* =========================================================
   CAMERA
   ========================================================= */

const raycaster =
    new THREE.Raycaster();

const mouseNDC =
    new THREE.Vector2();

const mouseWorld =
    new THREE.Vector3();

function updateCamera(
    delta
) {

    const target =
        new THREE.Vector3(
            player.position.x,
            player.position.y + 2.2,
            player.position.z
        );

    const desired =
        new THREE.Vector3(
            player.position.x,
            player.position.y + 9,
            player.position.z + 12
        );

    camera.position.lerp(
        desired,
        1 - Math.pow(
            0.001,
            delta
        )
    );

    camera.lookAt(
        target
    );

    mouseNDC.set(
        mouseX,
        mouseY
    );

    raycaster.setFromCamera(
        mouseNDC,
        camera
    );

    const plane =
        new THREE.Plane(
            new THREE.Vector3(
                0,
                1,
                0
            ),
            0
        );

    raycaster.ray.intersectPlane(
        plane,
        mouseWorld
    );

    const dx =
        mouseWorld.x -
        player.position.x;

    const dz =
        mouseWorld.z -
        player.position.z;

    if (
        Math.hypot(dx, dz) > 1
    ) {

        player.rotation.y =
            Math.atan2(
                dx,
                dz
            );

    }

}

/* =========================================================
   SAVE
   ========================================================= */

function saveGame(
    slot = game.saveSlot
) {

    const saveData =
        JSON.stringify(game);

    localStorage.setItem(
        "echobound_save_" + slot,
        saveData
    );

    showMessage(
        "SAVE SLOT " +
        slot +
        " OPGESLAGEN"
    );

}

/* =========================================================
   LOAD
   ========================================================= */

function loadGame(
    slot
) {

    const raw =
        localStorage.getItem(
            "echobound_save_" + slot
        );

    if (!raw) {

        showMessage(
            "SAVE SLOT " +
            slot +
            " IS LEEG"
        );

        return false;

    }

    try {

        const data =
            JSON.parse(raw);

        Object.assign(
            game,
            data
        );

        game.saveSlot =
            slot;

        showMessage(
            "SAVE SLOT " +
            slot +
            " GELADEN"
        );

        return true;

    } catch (error) {

        showMessage(
            "SAVE KON NIET WORDEN GELADEN"
        );

        return false;

    }

}

/* =========================================================
   NEW GAME
   ========================================================= */

function newGame() {

    Object.assign(
        game,
        {

            running: true,
            paused: false,
            dead: false,

            saveSlot: 1,

            wave: 1,
            kills: 0,

            credits: 100,

            level: 1,
            xp: 0,
            nextXP: 100,

            health: 100,
            maxHealth: 100,

            armor: 40,
            maxArmor: 40,

            energy: 100,
            maxEnergy: 100,

            ammo: 18,
            maxAmmo: 18,

            weapon: 0,

            sector: "OUTER WILDS",

            objective: "FIND THE LOST SIGNAL",

            keys: 0,

            cores: 0,

            missionProgress: 0,

            bossDefeated: false

        }
    );

    game.unlocked = {
        pulse: true,
        arc: false,
        burst: false
    };

    game.inventory = {
        medkit: 2,
        energyCell: 2,
        signalCore: 0
    };

    game.achievements = {
        firstEcho: false,
        collector: false,
        guardian: false,
        levelFive: false,
        explorer: false,
        weapons: false
    };

    player.position.set(
        0,
        0,
        12
    );

    enemyGroup.clear();
    projectileGroup.clear();

    hideMenu();

    showMessage(
        "NEW RUN STARTED"
    );

    saveGame(1);

}

/* =========================================================
   GAME OVER
   ========================================================= */

function gameOver() {

    game.dead = true;

    const overlay =
        document.createElement(
            "div"
        );

    overlay.id =
        "gameOverOverlay";

    overlay.innerHTML = `

        <div class="gameOverBox">

            <div class="gameOverSmall">
                ECHOBOUND
            </div>

            <h1>
                SIGNAL LOST
            </h1>

            <p>
                Je run is afgelopen.
            </p>

            <p>
                LEVEL: ${game.level}
            </p>

            <p>
                KILLS: ${game.kills}
            </p>

            <button id="retryGame">
                TRY AGAIN
            </button>

            <button id="gameOverMenu">
                MENU
            </button>

        </div>

    `;

    document.body.appendChild(
        overlay
    );

    document.getElementById(
        "retryGame"
    ).onclick = () => {

        overlay.remove();

        newGame();

    };

    document.getElementById(
        "gameOverMenu"
    ).onclick = () => {

        overlay.remove();

        location.reload();

    };

}

/* =========================================================
   INTERACT
   ========================================================= */

function interact() {

    if (
        !game.running ||
        game.paused
    ) {
        return;
    }

    const distance =
        Math.hypot(
            player.position.x,
            player.position.z
        );

    if (
        distance < 25
    ) {

        game.keys++;

        game.objective =
            "FOLLOW THE SIGNAL";

        showMessage(
            "SIGNAL KEY ACQUIRED"
        );

        return;

    }

    showShop();

}

/* =========================================================
   INVENTORY
   ========================================================= */

function showInventory() {

    showPanel(
        "INVENTORY",
        `

        <p>
            ❤️ Medkits:
            ${game.inventory.medkit}
        </p>

        <p>
            ⚡ Energy Cells:
            ${game.inventory.energyCell}
        </p>

        <p>
            💠 Signal Cores:
            ${game.inventory.signalCore}
        </p>

        <p>
            🔑 Keys:
            ${game.keys}
        </p>

        <p>
            💰 Credits:
            ${game.credits}
        </p>

        <hr>

        <button onclick="
            window.echoHeal()
        ">
            USE MEDKIT
        </button>

        <button onclick="
            window.echoEnergy()
        ">
            USE ENERGY CELL
        </button>

        <button onclick="
            window.echoClose()
        ">
            CLOSE
        </button>

        `
    );

}

/* =========================================================
   INVENTORY ACTIONS
   ========================================================= */

window.echoHeal = function() {

    if (
        game.inventory.medkit > 0 &&
        game.health < game.maxHealth
    ) {

        game.inventory.medkit--;

        game.health =
            Math.min(
                game.maxHealth,
                game.health + 45
            );

        showMessage(
            "HEALTH RESTORED"
        );

        closePanel();

    }

};

window.echoEnergy = function() {

    if (
        game.inventory.energyCell > 0
    ) {

        game.inventory.energyCell--;

        game.energy =
            Math.min(
                game.maxEnergy,
                game.energy + 60
            );

        showMessage(
            "ENERGY RESTORED"
        );

        closePanel();

    }

};

/* =========================================================
   SHOP
   ========================================================= */

function showShop() {

    showPanel(
        "FIELD SHOP",
        `

        <p>
            Credits:
            ${game.credits}
        </p>

        <button onclick="
            window.echoBuy('medkit')
        ">
            MEDKIT — 120
        </button>

        <button onclick="
            window.echoBuy('armor')
        ">
            ARMOR +25 — 180
        </button>

        <button onclick="
            window.echoBuy('arc')
        ">
            ARC WEAPON — 350
        </button>

        <button onclick="
            window.echoBuy('burst')
        ">
            BURST WEAPON — 600
        </button>

        <button onclick="
            window.echoClose()
        ">
            CLOSE
        </button>

        `
    );

}

/* =========================================================
   SHOP ACTION
   ========================================================= */

window.echoBuy =
function(item) {

    const prices = {

        medkit: 120,
        armor: 180,
        arc: 350,
        burst: 600

    };

    const price =
        prices[item];

    if (
        game.credits <
        price
    ) {

        showMessage(
            "NOT ENOUGH CREDITS"
        );

        return;

    }

    game.credits -=
        price;

    if (
        item === "medkit"
    ) {

        game.inventory.medkit++;

    }

    if (
        item === "armor"
    ) {

        game.armor =
            Math.min(
                game.maxArmor,
                game.armor + 25
            );

    }

    if (
        item === "arc"
    ) {

        game.unlocked.arc =
            true;

    }

    if (
        item === "burst"
    ) {

        game.unlocked.burst =
            true;

    }

    if (
        game.unlocked.arc &&
        game.unlocked.burst
    ) {

        game.achievements.weapons =
            true;

    }

    showMessage(
        "PURCHASE COMPLETE"
    );

    showShop();

};

/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

function showAchievements() {

    showPanel(
        "ACHIEVEMENTS",
        `

        <p>
            ${game.achievements.firstEcho ? "✓" : "○"}
            FIRST ECHO
        </p>

        <p>
            ${game.achievements.collector ? "✓" : "○"}
            SIGNAL COLLECTOR
        </p>

        <p>
            ${game.achievements.guardian ? "✓" : "○"}
            GUARDIAN DOWN
        </p>

        <p>
            ${game.achievements.levelFive ? "✓" : "○"}
            LEVEL 5
        </p>

        <p>
            ${game.achievements.explorer ? "✓" : "○"}
            EXPLORER
        </p>

        <p>
            ${game.achievements.weapons ? "✓" : "○"}
            ARSENAL
        </p>

        <button onclick="
            window.echoClose()
        ">
            CLOSE
        </button>

        `
    );

}

/* =========================================================
   MISSION
   ========================================================= */

function showMission() {

    showPanel(
        "MISSION LOG",
        `

        <h3>
            ${game.objective}
        </h3>

        <p>
            Wave:
            ${game.wave}
        </p>

        <p>
            Enemies defeated:
            ${game.kills}
        </p>

        <p>
            Signal Cores:
            ${game.cores}
        </p>

        <p>
            Sector:
            ${game.sector}
        </p>

        <button onclick="
            window.echoClose()
        ">
            CLOSE
        </button>

        `
    );

}

/* =========================================================
   PANEL
   ========================================================= */

function showPanel(
    title,
    content
) {

    closePanel();

    const panel =
        document.createElement(
            "div"
        );

    panel.id =
        "echoPanel";

    panel.innerHTML = `

        <div class="echoPanelBox">

            <h2>
                ${title}
            </h2>

            ${content}

        </div>

    `;

    document.body.appendChild(
        panel
    );

}

function closePanel() {

    const panel =
        document.getElementById(
            "echoPanel"
        );

    if (panel) {
        panel.remove();
    }

}

window.echoClose =
    closePanel;

/* =========================================================
   PAUSE
   ========================================================= */

function togglePause() {

    if (
        !game.running ||
        game.dead
    ) {
        return;
    }

    game.paused =
        !game.paused;

    showMessage(
        game.paused
            ? "PAUSED"
            : "RESUMED"
    );

}

/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    text
) {

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "echoMessage";

    message.textContent =
        text;

    document.body.appendChild(
        message
    );

    setTimeout(() => {

        message.remove();

    }, 1800);

}

/* =========================================================
   MENU
   ========================================================= */

function hideMenu() {

    const menu =
        document.getElementById(
            "menu"
        );

    if (menu) {

        menu.style.display =
            "none";

    }

    const hud =
        document.getElementById(
            "hud"
        );

    if (hud) {

        hud.style.display =
            "block";

    }

}

/* =========================================================
   UI
   ========================================================= */

function updateUI() {

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

    const kills =
        document.getElementById(
            "kills"
        );

    const credits =
        document.getElementById(
            "credits"
        );

    const objective =
        document.getElementById(
            "objective"
        );

    const zone =
        document.getElementById(
            "zone"
        );

    if (healthBar) {

        healthBar.style.width =
            (
                game.health /
                game.maxHealth *
                100
            ) + "%";

    }

    if (energyBar) {

        energyBar.style.width =
            (
                game.energy /
                game.maxEnergy *
                100
            ) + "%";

    }

    if (ammo) {

        ammo.textContent =
            game.ammo +
            " / ∞";

    }

    if (kills) {

        kills.textContent =
            "KILLS: " +
            game.kills +
            " • LV " +
            game.level;

    }

    if (credits) {

        credits.textContent =
            "CREDITS: " +
            game.credits;

    }

    if (objective) {

        objective.textContent =
            game.objective +
            " • " +
            weapons[
                game.weapon
            ].name;

    }

    if (zone) {

        zone.textContent =
            game.sector +
            " • WAVE " +
            game.wave;

    }

}

/* =========================================================
   CUSTOM CSS
   ========================================================= */

const customStyle =
    document.createElement(
        "style"
    );

customStyle.textContent = `

#echoPanel {

    position:fixed;

    inset:0;

    z-index:9990;

    display:flex;

    justify-content:center;

    align-items:center;

    background:
        rgba(0,0,0,.55);

    font-family:Arial,sans-serif;

}

.echoPanelBox {

    width:min(420px,85vw);

    max-height:80vh;

    overflow:auto;

    padding:28px;

    background:
        linear-gradient(
            145deg,
            #09131c,
            #10232e
        );

    border:
        1px solid #3c8196;

    box-shadow:
        0 0 50px
        rgba(40,220,255,.18);

    color:#dffaff;

}

.echoPanelBox h2 {

    margin-top:0;

    color:#64eaff;

    letter-spacing:3px;

}

.echoPanelBox button {

    width:100%;

    padding:12px;

    margin-top:8px;

    border:
        1px solid #397083;

    background:#0d2632;

    color:#e5fbff;

    cursor:pointer;

    font-weight:bold;

}

.echoPanelBox button:hover {

    background:#164151;

}

.echoMessage {

    position:fixed;

    left:50%;

    top:16%;

    transform:
        translateX(-50%);

    z-index:9999;

    padding:
        14px 24px;

    background:
        rgba(4,14,22,.94);

    border:
        1px solid #55eaff;

    color:#e7fcff;

    font-family:Arial,sans-serif;

    font-size:14px;

    font-weight:bold;

    letter-spacing:2px;

    box-shadow:
        0 0 25px
        rgba(70,230,255,.25);

}

#gameOverOverlay {

    position:fixed;

    inset:0;

    z-index:10000;

    display:flex;

    align-items:center;

    justify-content:center;

    background:
        rgba(0,0,0,.82);

    font-family:Arial,sans-serif;

}

.gameOverBox {

    width:380px;

    max-width:85vw;

    padding:35px;

    text-align:center;

    background:
        linear-gradient(
            145deg,
            #09131b,
            #17262d
        );

    border:
        1px solid #4c8290;

    color:white;

}

.gameOverBox h1 {

    color:#66eaff;

    letter-spacing:5px;

}

.gameOverBox button {

    width:100%;

    padding:13px;

    margin-top:10px;

    background:#102d39;

    border:
        1px solid #4c8798;

    color:white;

    cursor:pointer;

}

`;

document.head.appendChild(
    customStyle
);

/* =========================================================
   MENU BUTTONS
   ========================================================= */

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

/* NEW GAME */

if (newGameButton) {

    newGameButton.onclick =
        newGame;

}

/* CONTINUE */

if (loadGameButton) {

    loadGameButton.onclick =
        () => {

            if (
                loadGame(1)
            ) {

                game.running =
                    true;

                game.dead =
                    false;

                hideMenu();

            }

        };

}

/* ACHIEVEMENTS */

if (achievementsButton) {

    achievementsButton.onclick =
        showAchievements;

}

/* CONTROLS */

if (controlsButton) {

    controlsButton.onclick =
        () => {

            showPanel(
                "CONTROLS",
                `

                <p>
                    <b>W A S D</b>
                    — bewegen
                </p>

                <p>
                    <b>MUIS</b>
                    — richten
                </p>

                <p>
                    <b>LINKERMUISKNOP</b>
                    — schieten
                </p>

                <p>
                    <b>R</b>
                    — herladen
                </p>

                <p>
                    <b>SPACE</b>
                    — dash
                </p>

                <p>
                    <b>1 / 2 / 3</b>
                    — wapens
                </p>

                <p>
                    <b>I</b>
                    — inventory
                </p>

                <p>
                    <b>B</b>
                    — shop
                </p>

                <p>
                    <b>M</b>
                    — achievements
                </p>

                <p>
                    <b>J</b>
                    — missies
                </p>

                <p>
                    <b>E</b>
                    — interact
                </p>

                <p>
                    <b>ESC</b>
                    — pauze
                </p>

                <button onclick="
                    window.echoClose()
                ">
                    CLOSE
                </button>

                `
            );

        };

}

/* RESUME */

if (resumeButton) {

    resumeButton.onclick =
        () => {

            game.paused =
                false;

        };

}

/* SAVE */

if (saveButton) {

    saveButton.onclick =
        () => {

            saveGame(
                game.saveSlot
            );

        };

}

/* QUIT */

if (quitButton) {

    quitButton.onclick =
        () => {

            location.reload();

        };

}

/* =========================================================
   ENVIRONMENT / DAG EN NACHT
   ========================================================= */

let worldTime = 0;

function updateEnvironment(
    delta
) {

    worldTime +=
        delta * 0.025;

    const day =
        (
            Math.sin(worldTime) +
            1
        ) / 2;

    sun.intensity =
        0.5 + day * 2;

    moon.intensity =
        0.15 +
        (1 - day) * 0.55;

    scene.fog.density =
        0.006 +
        (1 - day) * 0.004;

}

/* =========================================================
   ENEMY SPAWN TIMER
   ========================================================= */

let spawnTimer = 0;

/* =========================================================
   MAIN LOOP
   ========================================================= */

function animate() {

    requestAnimationFrame(
        animate
    );

    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );

    if (
        game.running &&
        !game.paused &&
        !game.dead
    ) {

        spawnTimer -=
            delta;

        if (
            spawnTimer <= 0
        ) {

            spawnTimer = 2;

            spawnEnemies();

        }

        updatePlayer(
            delta
        );

        updateEnemies(
            delta
        );

        updateProjectiles(
            delta
        );

        updateEnvironment(
            delta
        );

    }

    updateCamera(
        delta
    );

    updateUI();

    renderer.render(
        scene,
        camera
    );

}

/* =========================================================
   RESIZE
   ========================================================= */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);

/* =========================================================
   START
   ========================================================= */

const hud =
    document.getElementById(
        "hud"
    );

if (hud) {

    hud.style.display =
        "none";

}

animate();

})();
