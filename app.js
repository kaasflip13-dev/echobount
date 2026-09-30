// ============================================================
// ECHOBOUND — THE LOST SIGNAL
// COMPLETE APP.JS
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const mapCanvas = document.getElementById("mapCanvas");
const mapCtx = mapCanvas ? mapCanvas.getContext("2d") : null;

// ============================================================
// CANVAS
// ============================================================

let W = window.innerWidth;
let H = window.innerHeight;

function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W;
    canvas.height = H;

    if (mapCanvas) {
        mapCanvas.width = Math.min(900, W - 80);
        mapCanvas.height = Math.min(600, H - 150);
    }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ============================================================
// GAME STATE
// ============================================================

let gameRunning = false;
let paused = false;
let gameOver = false;
let shopOpen = false;
let mapOpen = false;

let lastTime = performance.now();

let worldTime = 0;

const WORLD_WIDTH = 7000;
const WORLD_HEIGHT = 7000;

// ============================================================
// CAMERA
// ============================================================

const camera = {
    x: 0,
    y: 0
};

// ============================================================
// INPUT
// ============================================================

const keys = {};

const mouse = {
    x: W / 2,
    y: H / 2,
    down: false
};

window.addEventListener("keydown", event => {

    keys[event.code] = true;

    if (
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "ArrowDown" ||
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight"
    ) {
        event.preventDefault();
    }

    // --------------------------------------------------------
    // ESCAPE
    // --------------------------------------------------------

    if (event.code === "Escape") {

        if (shopOpen) {
            closeShop();
            return;
        }

        if (mapOpen) {
            closeMap();
            return;
        }

        if (gameRunning) {
            togglePause();
        }

        return;
    }

    // --------------------------------------------------------
    // SHOP
    // --------------------------------------------------------

    if (event.code === "KeyE") {

        if (gameRunning && !paused && !gameOver) {

            if (shopOpen) {
                closeShop();
                return;
            }

            const d = distance(
                player.x,
                player.y,
                shop.x + shop.w / 2,
                shop.y + shop.h / 2
            );

            if (d < 260) {
                openShop();
            }
        }
    }

    // --------------------------------------------------------
    // MAP
    // --------------------------------------------------------

    if (event.code === "KeyM") {

        if (
            gameRunning &&
            !paused &&
            !shopOpen &&
            !gameOver
        ) {
            toggleMap();
        }
    }

    // --------------------------------------------------------
    // RELOAD
    // --------------------------------------------------------

    if (event.code === "KeyR") {

        if (
            gameRunning &&
            !paused &&
            !shopOpen &&
            !gameOver
        ) {
            reloadWeapon();
        }
    }

    // --------------------------------------------------------
    // WEAPONS
    // --------------------------------------------------------

    if (event.code === "Digit1") {
        switchWeapon(0);
    }

    if (event.code === "Digit2") {
        switchWeapon(1);
    }

    if (event.code === "Digit3") {
        switchWeapon(2);
    }

    // --------------------------------------------------------
    // DEBUG / NEW RUN
    // --------------------------------------------------------

    if (event.code === "Enter" && gameOver) {
        startGame();
    }
});

window.addEventListener("keyup", event => {
    keys[event.code] = false;
});

canvas.addEventListener("mousemove", event => {

    const rect = canvas.getBoundingClientRect();

    mouse.x =
        event.clientX - rect.left;

    mouse.y =
        event.clientY - rect.top;
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

// ============================================================
// PLAYER
// ============================================================

const player = {

    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,

    radius: 22,

    speed: 250,
    sprintSpeed: 390,

    health: 100,
    maxHealth: 100,

    energy: 100,
    maxEnergy: 100,

    credits: 0,

    angle: 0,

    dashTimer: 0,
    dashCooldown: 0,

    invulnerable: 0,

    shootTimer: 0,

    kills: 0
};

// ============================================================
// WEAPONS
// ============================================================

const weapons = [

    {
        name: "PULSE",
        damage: 18,
        fireRate: 0.20,
        bulletSpeed: 900,
        bulletSize: 5,
        maxAmmo: 12,
        ammo: 12,
        reloadTime: 1.2,
        reloadTimer: 0,
        color: "#67e8e0"
    },

    {
        name: "BURST",
        damage: 10,
        fireRate: 0.10,
        bulletSpeed: 1000,
        bulletSize: 4,
        maxAmmo: 24,
        ammo: 24,
        reloadTime: 1.5,
        reloadTimer: 0,
        color: "#f4dc78"
    },

    {
        name: "CANNON",
        damage: 55,
        fireRate: 0.75,
        bulletSpeed: 700,
        bulletSize: 9,
        maxAmmo: 6,
        ammo: 6,
        reloadTime: 1.8,
        reloadTimer: 0,
        color: "#ff9b65"
    }

];

let currentWeapon = 0;

// ============================================================
// WORLD OBJECTS
// ============================================================

const buildings = [];
const trees = [];
const rocks = [];
const groundDetails = [];

const bullets = [];
const enemyBullets = [];
const enemies = [];
const particles = [];

// ============================================================
// SHOP
// ============================================================

const shop = {

    x: 3150,
    y: 3500,

    w: 360,
    h: 260

};

// ============================================================
// SHOP UI
// ============================================================

function createShopUI() {

    if (document.getElementById("echoShop")) {
        return;
    }

    const shopUI = document.createElement("div");

    shopUI.id = "echoShop";

    shopUI.innerHTML = `

        <div class="echoShopOverlay">

            <div class="echoShopWindow">

                <div class="shopEyebrow">
                    ECHOBOUND // TRADING SYSTEM
                </div>

                <h2>SHOP</h2>

                <div id="shopCredits">
                    CREDITS: 0
                </div>

                <div class="shopItems">

                    <button id="buyHealth" class="shopItem">
                        <span>REPAIR HULL</span>
                        <b>20 CR</b>
                    </button>

                    <button id="buyEnergy" class="shopItem">
                        <span>ENERGY CELL</span>
                        <b>15 CR</b>
                    </button>

                    <button id="buyAmmo" class="shopItem">
                        <span>AMMO PACK</span>
                        <b>10 CR</b>
                    </button>

                    <button id="buyPulse" class="shopItem">
                        <span>PULSE UPGRADE</span>
                        <b>50 CR</b>
                    </button>

                    <button id="buyCannon" class="shopItem">
                        <span>CANNON UPGRADE</span>
                        <b>80 CR</b>
                    </button>

                </div>

                <div id="shopMessage"></div>

                <button id="closeShop" class="shopClose">
                    CLOSE [ESC]
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(shopUI);

    const style = document.createElement("style");

    style.textContent = `

        #echoShop {
            display:none;
        }

        .echoShopOverlay {
            position:fixed;
            inset:0;
            z-index:10000;

            display:flex;
            align-items:center;
            justify-content:center;

            background:
                radial-gradient(
                    circle,
                    rgba(20,80,90,.28),
                    rgba(2,7,10,.88)
                );

            font-family:Arial,sans-serif;
        }

        .echoShopWindow {
            width:min(520px,90vw);

            padding:30px;

            background:
                linear-gradient(
                    145deg,
                    #18272d,
                    #0c151a
                );

            border:1px solid #61dcd5;

            box-shadow:
                0 0 45px rgba(80,220,210,.18),
                inset 0 0 30px rgba(80,220,210,.04);

            color:#eaffff;
        }

        .shopEyebrow {
            color:#69ddd6;
            font-size:12px;
            letter-spacing:4px;
            margin-bottom:7px;
        }

        .echoShopWindow h2 {
            margin:0;
            font-size:38px;
            letter-spacing:5px;
        }

        #shopCredits {
            margin-top:8px;
            margin-bottom:22px;
            color:#9db9bb;
        }

        .shopItems {
            display:grid;
            gap:10px;
        }

        .shopItem {
            min-height:58px;

            padding:12px 16px;

            display:flex;
            align-items:center;
            justify-content:space-between;

            border:1px solid #3a555b;

            background:#16252a;

            color:#e9ffff;

            cursor:pointer;

            font-size:15px;
            font-weight:bold;

            transition:
                background .15s,
                border-color .15s,
                transform .15s;
        }

        .shopItem:hover {
            background:#20373d;
            border-color:#6adbd5;
            transform:translateY(-1px);
        }

        .shopItem b {
            color:#69ddd6;
        }

        #shopMessage {
            min-height:25px;

            margin-top:15px;

            text-align:center;

            color:#70e4db;

            font-weight:bold;
        }

        .shopClose {
            width:100%;

            margin-top:8px;
            padding:14px;

            border:1px solid #52686d;

            background:#202f34;

            color:#e7f7f6;

            cursor:pointer;

            font-weight:bold;
        }

        .shopClose:hover {
            border-color:#72ddd6;
        }
    `;

    document.head.appendChild(style);

    shopUI.style.display = "none";

    document
        .getElementById("closeShop")
        .addEventListener(
            "click",
            closeShop
        );

    document
        .getElementById("buyHealth")
        .addEventListener(
            "click",
            () => buyShopItem("health")
        );

    document
        .getElementById("buyEnergy")
        .addEventListener(
            "click",
            () => buyShopItem("energy")
        );

    document
        .getElementById("buyAmmo")
        .addEventListener(
            "click",
            () => buyShopItem("ammo")
        );

    document
        .getElementById("buyPulse")
        .addEventListener(
            "click",
            () => buyShopItem("pulse")
        );

    document
        .getElementById("buyCannon")
        .addEventListener(
            "click",
            () => buyShopItem("cannon")
        );
}

function openShop() {

    if (
        !gameRunning ||
        paused ||
        gameOver
    ) {
        return;
    }

    shopOpen = true;

    mouse.down = false;

    const ui =
        document.getElementById("echoShop");

    if (ui) {
        ui.style.display = "flex";
    }

    updateShopUI();
}

function closeShop() {

    shopOpen = false;

    const ui =
        document.getElementById("echoShop");

    if (ui) {
        ui.style.display = "none";
    }
}

function updateShopUI() {

    const credits =
        document.getElementById("shopCredits");

    if (credits) {
        credits.textContent =
            `CREDITS: ${player.credits}`;
    }
}

function shopMessage(message) {

    const element =
        document.getElementById("shopMessage");

    if (!element) {
        return;
    }

    element.textContent = message;

    setTimeout(() => {

        if (element.textContent === message) {
            element.textContent = "";
        }

    }, 1400);
}

function buyShopItem(item) {

    if (!shopOpen) {
        return;
    }

    let price = 0;

    if (item === "health") price = 20;
    if (item === "energy") price = 15;
    if (item === "ammo") price = 10;
    if (item === "pulse") price = 50;
    if (item === "cannon") price = 80;

    if (player.credits < price) {

        shopMessage(
            "NOT ENOUGH CREDITS"
        );

        return;
    }

    if (
        item === "health" &&
        player.health >= player.maxHealth
    ) {

        shopMessage(
            "HULL ALREADY FULL"
        );

        return;
    }

    if (
        item === "energy" &&
        player.energy >= player.maxEnergy
    ) {

        shopMessage(
            "ENERGY ALREADY FULL"
        );

        return;
    }

    if (
        item === "ammo" &&
        weapons.every(
            weapon =>
                weapon.ammo >= weapon.maxAmmo
        )
    ) {

        shopMessage(
            "AMMO ALREADY FULL"
        );

        return;
    }

    player.credits -= price;

    // --------------------------------------------------------
    // HEALTH
    // --------------------------------------------------------

    if (item === "health") {

        player.health =
            Math.min(
                player.maxHealth,
                player.health + 35
            );

        shopMessage(
            "HULL REPAIRED"
        );
    }

    // --------------------------------------------------------
    // ENERGY
    // --------------------------------------------------------

    if (item === "energy") {

        player.energy =
            Math.min(
                player.maxEnergy,
                player.energy + 40
            );

        shopMessage(
            "ENERGY RESTORED"
        );
    }

    // --------------------------------------------------------
    // AMMO
    // --------------------------------------------------------

    if (item === "ammo") {

        weapons.forEach(weapon => {

            weapon.ammo =
                weapon.maxAmmo;

        });

        shopMessage(
            "AMMO RESTOCKED"
        );
    }

    // --------------------------------------------------------
    // PULSE
    // --------------------------------------------------------

    if (item === "pulse") {

        weapons[0].damage += 1;

        shopMessage(
            "PULSE DAMAGE +1"
        );
    }

    // --------------------------------------------------------
    // CANNON
    // --------------------------------------------------------

    if (item === "cannon") {

        weapons[2].damage += 3;

        shopMessage(
            "CANNON DAMAGE +3"
        );
    }

    updateShopUI();
}

// ============================================================
// MAP
// ============================================================

function createMapUI() {

    const closeButton =
        document.getElementById("closeMap");

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeMap
        );
    }
}

function openMap() {

    const map =
        document.getElementById("map");

    if (!map) return;

    mapOpen = true;

    map.style.display = "flex";

    drawMap();
}

function closeMap() {

    const map =
        document.getElementById("map");

    mapOpen = false;

    if (map) {
        map.style.display = "none";
    }
}

function toggleMap() {

    if (mapOpen) {
        closeMap();
    } else {
        openMap();
    }
}

function drawMap() {

    if (!mapCtx || !mapCanvas) {
        return;
    }

    const mw = mapCanvas.width;
    const mh = mapCanvas.height;

    mapCtx.clearRect(
        0,
        0,
        mw,
        mh
    );

    mapCtx.fillStyle =
        "#091317";

    mapCtx.fillRect(
        0,
        0,
        mw,
        mh
    );

    const sx =
        mw / WORLD_WIDTH;

    const sy =
        mh / WORLD_HEIGHT;

    // Buildings

    buildings.forEach(building => {

        mapCtx.fillStyle =
            "#30444a";

        mapCtx.fillRect(
            building.x * sx,
            building.y * sy,
            building.w * sx,
            building.h * sy
        );
    });

    // Shop

    mapCtx.fillStyle =
        "#67e8e0";

    mapCtx.fillRect(
        shop.x * sx,
        shop.y * sy,
        shop.w * sx,
        shop.h * sy
    );

    // Enemies

    enemies.forEach(enemy => {

        mapCtx.fillStyle =
            "#c9829b";

        mapCtx.beginPath();

        mapCtx.arc(
            enemy.x * sx,
            enemy.y * sy,
            3,
            0,
            Math.PI * 2
        );

        mapCtx.fill();
    });

    // Player

    mapCtx.fillStyle =
        "#ffffff";

    mapCtx.beginPath();

    mapCtx.arc(
        player.x * sx,
        player.y * sy,
        6,
        0,
        Math.PI * 2
    );

    mapCtx.fill();

    // Shop label

    mapCtx.fillStyle =
        "#8be7e1";

    mapCtx.font =
        "bold 12px Arial";

    mapCtx.fillText(
        "SHOP",
        shop.x * sx,
        shop.y * sy - 6
    );
}

// ============================================================
// BUILDINGS
// ============================================================

function createBuildings() {

    buildings.length = 0;

    const positions = [

        [800, 700, 420, 260],
        [1550, 950, 360, 300],
        [2450, 700, 500, 260],

        [4200, 800, 440, 280],
        [5200, 1100, 360, 300],

        [900, 2500, 500, 300],
        [1900, 2700, 360, 260],

        [4500, 2500, 520, 280],
        [5600, 2900, 350, 340],

        [1100, 4700, 420, 300],
        [2200, 5200, 500, 280],

        [4300, 4700, 450, 300],
        [5400, 5200, 360, 280],

        [2850, 1800, 300, 300],
        [3800, 5600, 500, 280]

    ];

    positions.forEach(
        position => {

            buildings.push({

                x: position[0],
                y: position[1],

                w: position[2],
                h: position[3]

            });

        }
    );
}

// ============================================================
// TREES
// ============================================================

function createTrees() {

    trees.length = 0;

    for (
        let i = 0;
        i < 95;
        i++
    ) {

        const x =
            200 +
            Math.random() *
            (WORLD_WIDTH - 400);

        const y =
            200 +
            Math.random() *
            (WORLD_HEIGHT - 400);

        if (
            distance(
                x,
                y,
                player.x,
                player.y
            ) < 500
        ) {
            continue;
        }

        if (
            distance(
                x,
                y,
                shop.x,
                shop.y
            ) < 450
        ) {
            continue;
        }

        trees.push({

            x,
            y,

            radius:
                25 +
                Math.random() * 15

        });
    }
}

// ============================================================
// ROCKS
// ============================================================

function createRocks() {

    rocks.length = 0;

    for (
        let i = 0;
        i < 75;
        i++
    ) {

        const x =
            150 +
            Math.random() *
            (WORLD_WIDTH - 300);

        const y =
            150 +
            Math.random() *
            (WORLD_HEIGHT - 300);

        rocks.push({

            x,
            y,

            radius:
                10 +
                Math.random() * 18

        });
    }
}

// ============================================================
// GROUND DETAILS
// ============================================================

function createGroundDetails() {

    groundDetails.length = 0;

    for (
        let i = 0;
        i < 250;
        i++
    ) {

        groundDetails.push({

            x:
                Math.random() *
                WORLD_WIDTH,

            y:
                Math.random() *
                WORLD_HEIGHT,

            size:
                2 +
                Math.random() * 7,

            type:
                Math.floor(
                    Math.random() * 4
                )

        });
    }
}

// ============================================================
// ALIEN SPAWNS
// ============================================================

const alienSpawns = [];

function createAlienSpawns() {

    alienSpawns.length = 0;

    for (
        let i = 0;
        i < 18;
        i++
    ) {

        alienSpawns.push({

            x:
                500 +
                Math.random() *
                (WORLD_WIDTH - 1000),

            y:
                500 +
                Math.random() *
                (WORLD_HEIGHT - 1000)

        });
    }
}

// ============================================================
// COLLISION
// ============================================================

function circleRectCollision(
    cx,
    cy,
    radius,
    rect
) {

    const nearestX =
        Math.max(
            rect.x,
            Math.min(
                cx,
                rect.x + rect.w
            )
        );

    const nearestY =
        Math.max(
            rect.y,
            Math.min(
                cy,
                rect.y + rect.h
            )
        );

    const dx =
        cx - nearestX;

    const dy =
        cy - nearestY;

    return (
        dx * dx +
        dy * dy
        <
        radius * radius
    );
}

function collidesWithBuilding(
    x,
    y,
    radius
) {

    for (
        const building of buildings
    ) {

        if (
            circleRectCollision(
                x,
                y,
                radius,
                building
            )
        ) {
            return true;
        }
    }

    // SHOP COLLISION

    if (
        circleRectCollision(
            x,
            y,
            radius,
            shop
        )
    ) {
        return true;
    }

    return false;
}

function collidesWithTree(
    x,
    y,
    radius
) {

    for (const tree of trees) {

        if (
            distance(
                x,
                y,
                tree.x,
                tree.y
            )
            <
            radius + tree.radius
        ) {
            return true;
        }
    }

    return false;
}

function isBlocked(
    x,
    y,
    radius
) {

    if (
        x - radius < 0 ||
        y - radius < 0 ||
        x + radius > WORLD_WIDTH ||
        y + radius > WORLD_HEIGHT
    ) {
        return true;
    }

    if (
        collidesWithBuilding(
            x,
            y,
            radius
        )
    ) {
        return true;
    }

    return false;
}

// ============================================================
// PLAYER MOVEMENT
// ============================================================

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;

    if (
        keys["KeyW"] ||
        keys["ArrowUp"]
    ) {
        dy -= 1;
    }

    if (
        keys["KeyS"] ||
        keys["ArrowDown"]
    ) {
        dy += 1;
    }

    if (
        keys["KeyA"] ||
        keys["ArrowLeft"]
    ) {
        dx -= 1;
    }

    if (
        keys["KeyD"] ||
        keys["ArrowRight"]
    ) {
        dx += 1;
    }

    const length =
        Math.hypot(dx, dy);

    if (length > 0) {

        dx /= length;
        dy /= length;

        let speed =
            player.speed;

        if (
            keys["ShiftLeft"] ||
            keys["ShiftRight"]
        ) {

            if (player.energy > 0) {

                speed =
                    player.sprintSpeed;

                player.energy =
                    Math.max(
                        0,
                        player.energy -
                        18 * dt
                    );
            }
        } else {

            player.energy =
                Math.min(
                    player.maxEnergy,
                    player.energy +
                    8 * dt
                );
        }

        const nx =
            player.x +
            dx * speed * dt;

        const ny =
            player.y +
            dy * speed * dt;

        if (
            !isBlocked(
                nx,
                player.y,
                player.radius
            )
        ) {
            player.x = nx;
        }

        if (
            !isBlocked(
                player.x,
                ny,
                player.radius
            )
        ) {
            player.y = ny;
        }
    } else {

        player.energy =
            Math.min(
                player.maxEnergy,
                player.energy +
                12 * dt
            );
    }

    // DASH

    if (
        keys["Space"] &&
        player.dashCooldown <= 0 &&
        player.energy >= 30
    ) {

        keys["Space"] = false;

        let dashX = dx;
        let dashY = dy;

        if (
            dashX === 0 &&
            dashY === 0
        ) {

            dashX =
                Math.cos(
                    player.angle
                );

            dashY =
                Math.sin(
                    player.angle
                );
        }

        const dashDistance = 260;

        const nx =
            player.x +
            dashX *
            dashDistance;

        const ny =
            player.y +
            dashY *
            dashDistance;

        if (
            !isBlocked(
                nx,
                player.y,
                player.radius
            )
        ) {
            player.x = nx;
        }

        if (
            !isBlocked(
                player.x,
                ny,
                player.radius
            )
        ) {
            player.y = ny;
        }

        player.energy -= 30;

        player.dashCooldown = 1.2;

        player.invulnerable = 0.35;

        createParticles(
            player.x,
            player.y,
            "#67e8e0",
            15
        );
    }

    player.dashCooldown =
        Math.max(
            0,
            player.dashCooldown - dt
        );

    player.invulnerable =
        Math.max(
            0,
            player.invulnerable - dt
        );
}

// ============================================================
// PLAYER AIM
// ============================================================

function updateAim() {

    const worldMouseX =
        camera.x + mouse.x;

    const worldMouseY =
        camera.y + mouse.y;

    player.angle =
        Math.atan2(
            worldMouseY - player.y,
            worldMouseX - player.x
        );
}

// ============================================================
// SHOOTING
// ============================================================

function updateShooting(dt) {

    const weapon =
        weapons[currentWeapon];

    if (weapon.reloadTimer > 0) {

        weapon.reloadTimer -= dt;

        if (
            weapon.reloadTimer <= 0
        ) {

            weapon.ammo =
                weapon.maxAmmo;
        }

        return;
    }

    player.shootTimer -= dt;

    if (
        mouse.down &&
        player.shootTimer <= 0
    ) {

        if (weapon.ammo <= 0) {

            reloadWeapon();

            return;
        }

        shootWeapon();

        player.shootTimer =
            weapon.fireRate;
    }
}

function shootWeapon() {

    const weapon =
        weapons[currentWeapon];

    weapon.ammo--;

    const angle =
        player.angle;

    let count = 1;

    if (
        currentWeapon === 1
    ) {
        count = 3;
    }

    for (
        let i = 0;
        i < count;
        i++
    ) {

        let spread = 0;

        if (count > 1) {

            spread =
                (i - 1) *
                0.10;
        }

        bullets.push({

            x:
                player.x +
                Math.cos(
                    angle + spread
                ) * 30,

            y:
                player.y +
                Math.sin(
                    angle + spread
                ) * 30,

            vx:
                Math.cos(
                    angle + spread
                ) *
                weapon.bulletSpeed,

            vy:
                Math.sin(
                    angle + spread
                ) *
                weapon.bulletSpeed,

            damage:
                weapon.damage,

            radius:
                weapon.bulletSize,

            life: 2,

            color:
                weapon.color

        });
    }

    createParticles(
        player.x +
        Math.cos(angle) * 28,

        player.y +
        Math.sin(angle) * 28,

        weapon.color,

        currentWeapon === 2
            ? 10
            : 5
    );
}

function reloadWeapon() {

    const weapon =
        weapons[currentWeapon];

    if (
        weapon.ammo >=
        weapon.maxAmmo
    ) {
        return;
    }

    if (
        weapon.reloadTimer > 0
    ) {
        return;
    }

    weapon.reloadTimer =
        weapon.reloadTime;
}

function switchWeapon(index) {

    if (
        index < 0 ||
        index >= weapons.length
    ) {
        return;
    }

    currentWeapon = index;

    weapons.forEach(
        weapon => {
            weapon.reloadTimer = 0;
        }
    );
}

// ============================================================
// BULLETS
// ============================================================

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
            bullet.x < 0 ||
            bullet.y < 0 ||
            bullet.x > WORLD_WIDTH ||
            bullet.y > WORLD_HEIGHT
        ) {

            bullets.splice(i, 1);

            continue;
        }

        if (
            collidesWithBuilding(
                bullet.x,
                bullet.y,
                bullet.radius
            )
        ) {

            createParticles(
                bullet.x,
                bullet.y,
                bullet.color,
                4
            );

            bullets.splice(i, 1);

            continue;
        }

        let hit = false;

        for (
            let j = enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy =
                enemies[j];

            if (
                distance(
                    bullet.x,
                    bullet.y,
                    enemy.x,
                    enemy.y
                )
                <
                bullet.radius +
                enemy.radius
            ) {

                enemy.health -=
                    bullet.damage;

                createParticles(
                    bullet.x,
                    bullet.y,
                    bullet.color,
                    6
                );

                bullets.splice(i, 1);

                hit = true;

                if (
                    enemy.health <= 0
                ) {

                    killEnemy(
                        j
                    );
                }

                break;
            }
        }

        if (hit) {
            continue;
        }
    }
}

// ============================================================
// ENEMIES
// ============================================================

let alienSpawnTimer = 0;

const enemyTypes = {

    stalker: {

        health: 45,
        speed: 90,
        radius: 18,
        damage: 10,
        color: "#d56b91",
        credits: 8

    },

    crawler: {

        health: 25,
        speed: 135,
        radius: 14,
        damage: 7,
        color: "#79b86e",
        credits: 5

    },

    guardian: {

        health: 130,
        speed: 48,
        radius: 30,
        damage: 18,
        color: "#bd8cdb",
        credits: 25

    }

};

function spawnStartingAliens() {

    enemies.length = 0;

    for (
        let i = 0;
        i < 9;
        i++
    ) {

        spawnEnemy();
    }
}

function spawnEnemy() {

    if (enemies.length >= 18) {
        return;
    }

    let spawn = null;

    for (
        let attempt = 0;
        attempt < 30;
        attempt++
    ) {

        const point =
            alienSpawns[
                Math.floor(
                    Math.random() *
                    alienSpawns.length
                )
            ];

        if (!point) continue;

        if (
            distance(
                point.x,
                point.y,
                player.x,
                player.y
            ) > 900
        ) {

            spawn = point;

            break;
        }
    }

    if (!spawn) {
        return;
    }

    const roll =
        Math.random();

    let type = "stalker";

    if (roll < 0.25) {
        type = "crawler";
    }

    if (roll > 0.84) {
        type = "guardian";
    }

    const data =
        enemyTypes[type];

    enemies.push({

        type,

        x: spawn.x,
        y: spawn.y,

        radius: data.radius,

        health: data.health,
        maxHealth: data.health,

        speed: data.speed,

        damage: data.damage,

        color: data.color,

        credits: data.credits,

        shootTimer:
            1.5 +
            Math.random() * 2,

        attackTimer: 0
    });
}

function updateEnemies(dt) {

    alienSpawnTimer += dt;

    if (
        alienSpawnTimer > 2.5
    ) {

        alienSpawnTimer = 0;

        spawnEnemy();
    }

    for (
        const enemy of enemies
    ) {

        const dx =
            player.x - enemy.x;

        const dy =
            player.y - enemy.y;

        const dist =
            Math.hypot(
                dx,
                dy
            );

        if (dist <= 0) {
            continue;
        }

        const dirX =
            dx / dist;

        const dirY =
            dy / dist;

        // GUARDIAN SHOOTS

        if (
            enemy.type ===
            "guardian"
        ) {

            enemy.shootTimer -= dt;

            if (
                enemy.shootTimer <= 0 &&
                dist < 900
            ) {

                enemy.shootTimer =
                    2.4;

                enemyShoot(enemy);
            }
        }

        // MOVE

        if (dist > 65) {

            const moveX =
                enemy.x +
                dirX *
                enemy.speed *
                dt;

            const moveY =
                enemy.y +
                dirY *
                enemy.speed *
                dt;

            if (
                !isBlocked(
                    moveX,
                    enemy.y,
                    enemy.radius
                )
            ) {
                enemy.x = moveX;
            }

            if (
                !isBlocked(
                    enemy.x,
                    moveY,
                    enemy.radius
                )
            ) {
                enemy.y = moveY;
            }
        }

        // ATTACK PLAYER

        if (
            dist <
            enemy.radius +
            player.radius +
            8
        ) {

            enemy.attackTimer -= dt;

            if (
                enemy.attackTimer <= 0
            ) {

                enemy.attackTimer =
                    0.9;

                damagePlayer(
                    enemy.damage
                );
            }
        }
    }
}

function enemyShoot(enemy) {

    const angle =
        Math.atan2(
            player.y - enemy.y,
            player.x - enemy.x
        );

    enemyBullets.push({

        x:
            enemy.x +
            Math.cos(angle) *
            (enemy.radius + 5),

        y:
            enemy.y +
            Math.sin(angle) *
            (enemy.radius + 5),

        vx:
            Math.cos(angle) *
            330,

        vy:
            Math.sin(angle) *
            330,

        radius: 7,

        damage: 12,

        life: 4,

        color: "#d99ae8"

    });
}

// ============================================================
// ENEMY BULLETS
// ============================================================

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
            bullet.life <= 0
        ) {

            enemyBullets.splice(
                i,
                1
            );

            continue;
        }

        if (
            collidesWithBuilding(
                bullet.x,
                bullet.y,
                bullet.radius
            )
        ) {

            createParticles(
                bullet.x,
                bullet.y,
                bullet.color,
                5
            );

            enemyBullets.splice(
                i,
                1
            );

            continue;
        }

        if (
            distance(
                bullet.x,
                bullet.y,
                player.x,
                player.y
            )
            <
            bullet.radius +
            player.radius
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

// ============================================================
// DAMAGE PLAYER
// ============================================================

function damagePlayer(amount) {

    if (
        player.invulnerable > 0 ||
        gameOver
    ) {
        return;
    }

    player.health -= amount;

    player.invulnerable =
        0.45;

    createParticles(
        player.x,
        player.y,
        "#72d9d2",
        8
    );

    if (
        player.health <= 0
    ) {

        player.health = 0;

        endGame();
    }
}

// ============================================================
// KILL ENEMY
// ============================================================

function killEnemy(index) {

    const enemy =
        enemies[index];

    if (!enemy) {
        return;
    }

    player.kills++;

    player.credits +=
        enemy.credits;

    createParticles(
        enemy.x,
        enemy.y,
        enemy.color,
        18
    );

    enemies.splice(
        index,
        1
    );

    checkAchievements();
}

// ============================================================
// PARTICLES
// ============================================================

function createParticles(
    x,
    y,
    color,
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
            30 +
            Math.random() *
            150;

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
                0.25 +
                Math.random() *
                0.45,

            maxLife:
                0.7,

            size:
                2 +
                Math.random() *
                4,

            color

        });
    }
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
            0.96;

        p.vy *=
            0.96;

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

// ============================================================
// CAMERA
// ============================================================

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

// ============================================================
// DRAW GROUND
// ============================================================

function drawGround() {

    ctx.fillStyle =
        "#111b1c";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    const gridSize = 80;

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

    ctx.strokeStyle =
        "rgba(75,110,108,.13)";

    ctx.lineWidth = 1;

    for (
        let x = startX;
        x < camera.x + W + gridSize;
        x += gridSize
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
        let y = startY;
        y < camera.y + H + gridSize;
        y += gridSize
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

    // SMALL GROUND DETAILS

    for (
        const detail of groundDetails
    ) {

        if (
            detail.x <
                camera.x - 20 ||
            detail.x >
                camera.x + W + 20 ||
            detail.y <
                camera.y - 20 ||
            detail.y >
                camera.y + H + 20
        ) {
            continue;
        }

        const sx =
            detail.x -
            camera.x;

        const sy =
            detail.y -
            camera.y;

        ctx.fillStyle =
            "rgba(90,120,116,.20)";

        ctx.fillRect(
            sx,
            sy,
            detail.size,
            detail.size
        );
    }
}

// ============================================================
// DRAW ROCKS
// ============================================================

function drawRocks() {

    for (
        const rock of rocks
    ) {

        const sx =
            rock.x -
            camera.x;

        const sy =
            rock.y -
            camera.y;

        if (
            sx < -50 ||
            sx > W + 50 ||
            sy < -50 ||
            sy > H + 50
        ) {
            continue;
        }

        ctx.fillStyle =
            "rgba(0,0,0,.35)";

        ctx.beginPath();

        ctx.ellipse(
            sx + 6,
            sy + 8,
            rock.radius,
            rock.radius * .65,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
            "#39464a";

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            rock.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle =
            "#56676b";

        ctx.lineWidth = 2;

        ctx.stroke();
    }
}

// ============================================================
// DRAW TREES
// ============================================================

function drawTrees() {

    for (
        const tree of trees
    ) {

        const sx =
            tree.x -
            camera.x;

        const sy =
            tree.y -
            camera.y;

        if (
            sx < -80 ||
            sx > W + 80 ||
            sy < -80 ||
            sy > H + 80
        ) {
            continue;
        }

        // shadow

        ctx.fillStyle =
            "rgba(0,0,0,.32)";

        ctx.beginPath();

        ctx.ellipse(
            sx,
            sy + 18,
            tree.radius * 1.1,
            tree.radius * .55,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // trunk

        ctx.fillStyle =
            "#4a3c34";

        ctx.fillRect(
            sx - 7,
            sy - 3,
            14,
            30
        );

        // crown

        ctx.fillStyle =
            "#2d5149";

        ctx.beginPath();

        ctx.arc(
            sx,
            sy - 12,
            tree.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle =
            "#48796f";

        ctx.lineWidth = 2;

        ctx.stroke();

        ctx.fillStyle =
            "rgba(100,200,180,.10)";

        ctx.beginPath();

        ctx.arc(
            sx - 7,
            sy - 20,
            tree.radius * .4,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}

// ============================================================
// DRAW BUILDINGS
// ============================================================

function drawBuildings() {

    for (
        const building of buildings
    ) {

        const sx =
            building.x -
            camera.x;

        const sy =
            building.y -
            camera.y;

        if (
            sx + building.w < 0 ||
            sx > W ||
            sy + building.h < 0 ||
            sy > H
        ) {
            continue;
        }

        // shadow

        ctx.fillStyle =
            "rgba(0,0,0,.40)";

        ctx.fillRect(
            sx + 14,
            sy + 18,
            building.w,
            building.h
        );

        // outer

        ctx.fillStyle =
            "#111c21";

        ctx.fillRect(
            sx - 6,
            sy - 6,
            building.w + 12,
            building.h + 12
        );

        // building

        ctx.fillStyle =
            "#26373d";

        ctx.fillRect(
            sx,
            sy,
            building.w,
            building.h
        );

        // top strip

        ctx.fillStyle =
            "#18262b";

        ctx.fillRect(
            sx,
            sy,
            building.w,
            28
        );

        // lights

        for (
            let x = sx + 30;
            x < sx + building.w - 20;
            x += 75
        ) {

            ctx.fillStyle =
                "rgba(100,220,215,.25)";

            ctx.fillRect(
                x,
                sy + 50,
                45,
                28
            );

            ctx.strokeStyle =
                "rgba(100,220,215,.40)";

            ctx.strokeRect(
                x,
                sy + 50,
                45,
                28
            );
        }

        // border

        ctx.strokeStyle =
            "#42585e";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            sx,
            sy,
            building.w,
            building.h
        );
    }
}

// ============================================================
// DRAW SHOP
// ============================================================

function drawShop() {

    const sx =
        shop.x -
        camera.x;

    const sy =
        shop.y -
        camera.y;

    const cx =
        shop.x +
        shop.w / 2;

    const cy =
        shop.y +
        shop.h / 2;

    if (
        sx + shop.w < -100 ||
        sx > W + 100 ||
        sy + shop.h < -100 ||
        sy > H + 100
    ) {
        return;
    }

    ctx.save();

    // shadow

    ctx.fillStyle =
        "rgba(0,0,0,.50)";

    ctx.fillRect(
        sx + 18,
        sy + 22,
        shop.w,
        shop.h
    );

    // outer frame

    ctx.fillStyle =
        "#0b1519";

    ctx.fillRect(
        sx - 10,
        sy - 10,
        shop.w + 20,
        shop.h + 20
    );

    // main

    ctx.fillStyle =
        "#253940";

    ctx.fillRect(
        sx,
        sy,
        shop.w,
        shop.h
    );

    // neon outline

    ctx.strokeStyle =
        "#69ded7";

    ctx.lineWidth = 4;

    ctx.strokeRect(
        sx,
        sy,
        shop.w,
        shop.h
    );

    // roof

    ctx.fillStyle =
        "#17272d";

    ctx.fillRect(
        sx - 15,
        sy - 24,
        shop.w + 30,
        20
    );

    // windows

    for (
        let i = 0;
        i < 4;
        i++
    ) {

        const wx =
            sx +
            30 +
            i * 78;

        ctx.fillStyle =
            "rgba(80,205,205,.16)";

        ctx.fillRect(
            wx,
            sy + 78,
            48,
            48
        );

        ctx.strokeStyle =
            "rgba(100,225,220,.48)";

        ctx.lineWidth = 2;

        ctx.strokeRect(
            wx,
            sy + 78,
            48,
            48
        );
    }

    // door

    ctx.fillStyle =
        "#101b20";

    ctx.fillRect(
        sx +
        shop.w / 2 -
        32,

        sy +
        shop.h -
        92,

        64,
        92
    );

    ctx.strokeStyle =
        "#557277";

    ctx.strokeRect(
        sx +
        shop.w / 2 -
        32,

        sy +
        shop.h -
        92,

        64,
        92
    );

    // shop sign

    ctx.fillStyle =
        "#0c171b";

    ctx.fillRect(
        sx +
        shop.w / 2 -
        110,

        sy + 20,

        220,
        46
    );

    ctx.strokeStyle =
        "#6ce0d9";

    ctx.lineWidth = 2;

    ctx.strokeRect(
        sx +
        shop.w / 2 -
        110,

        sy + 20,

        220,
        46
    );

    ctx.fillStyle =
        "#9af2ec";

    ctx.font =
        "bold 25px Arial";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "SHOP",
        sx + shop.w / 2,
        sy + 43
    );

    // interaction text

    const d =
        distance(
            player.x,
            player.y,
            cx,
            cy
        );

    if (
        d < 260 &&
        gameRunning &&
        !paused &&
        !shopOpen
    ) {

        ctx.fillStyle =
            "rgba(5,15,18,.90)";

        ctx.fillRect(
            sx +
            shop.w / 2 -
            135,

            sy - 66,

            270,
            40
        );

        ctx.strokeStyle =
            "rgba(100,225,220,.65)";

        ctx.strokeRect(
            sx +
            shop.w / 2 -
            135,

            sy - 66,

            270,
            40
        );

        ctx.fillStyle =
            "#dcfffc";

        ctx.font =
            "bold 15px Arial";

        ctx.fillText(
            "PRESS E TO OPEN SHOP",

            sx +
            shop.w / 2,

            sy - 46
        );
    }

    ctx.restore();
}

// ============================================================
// DRAW BULLETS
// ============================================================

function drawBullets() {

    for (
        const bullet of bullets
    ) {

        const sx =
            bullet.x -
            camera.x;

        const sy =
            bullet.y -
            camera.y;

        ctx.shadowColor =
            bullet.color;

        ctx.shadowBlur = 12;

        ctx.fillStyle =
            bullet.color;

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

function drawEnemyBullets() {

    for (
        const bullet of enemyBullets
    ) {

        const sx =
            bullet.x -
            camera.x;

        const sy =
            bullet.y -
            camera.y;

        ctx.shadowColor =
            bullet.color;

        ctx.shadowBlur = 12;

        ctx.fillStyle =
            bullet.color;

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

// ============================================================
// DRAW ENEMIES
// ============================================================

function drawEnemies() {

    for (
        const enemy of enemies
    ) {

        const sx =
            enemy.x -
            camera.x;

        const sy =
            enemy.y -
            camera.y;

        if (
            sx < -80 ||
            sx > W + 80 ||
            sy < -80 ||
            sy > H + 80
        ) {
            continue;
        }

        // shadow

        ctx.fillStyle =
            "rgba(0,0,0,.40)";

        ctx.beginPath();

        ctx.ellipse(
            sx,
            sy + enemy.radius * .7,
            enemy.radius * 1.1,
            enemy.radius * .45,
            0,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // body

        ctx.fillStyle =
            enemy.color;

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // outline

        ctx.strokeStyle =
            "rgba(240,255,255,.45)";

        ctx.lineWidth = 2;

        ctx.stroke();

        // inner core

        ctx.fillStyle =
            "#162125";

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            enemy.radius * .42,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // health bar

        const barWidth =
            enemy.radius * 2.2;

        const health =
            Math.max(
                0,
                enemy.health /
                enemy.maxHealth
            );

        ctx.fillStyle =
            "rgba(0,0,0,.55)";

        ctx.fillRect(
            sx -
            barWidth / 2,

            sy -
            enemy.radius -
            12,

            barWidth,
            5
        );

        ctx.fillStyle =
            "#74d8d1";

        ctx.fillRect(
            sx -
            barWidth / 2,

            sy -
            enemy.radius -
            12,

            barWidth * health,
            5
        );
    }
}

// ============================================================
// DRAW PLAYER
// ============================================================

function drawPlayer() {

    const sx =
        player.x -
        camera.x;

    const sy =
        player.y -
        camera.y;

    ctx.save();

    ctx.translate(
        sx,
        sy
    );

    ctx.rotate(
        player.angle
    );

    // shadow

    ctx.fillStyle =
        "rgba(0,0,0,.40)";

    ctx.beginPath();

    ctx.ellipse(
        5,
        10,
        30,
        18,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    // body

    ctx.fillStyle =
        "#40555b";

    ctx.fillRect(
        -24,
        -19,
        48,
        38
    );

    // armor

    ctx.strokeStyle =
        "#82aaa9";

    ctx.lineWidth = 3;

    ctx.strokeRect(
        -24,
        -19,
        48,
        38
    );

    // front

    ctx.fillStyle =
        "#25373d";

    ctx.fillRect(
        5,
        -13,
        28,
        26
    );

    // cannon

    ctx.fillStyle =
        "#5c777c";

    ctx.fillRect(
        10,
        -6,
        38,
        12
    );

    // core

    ctx.fillStyle =
        "#6ce1da";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        8,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();

    // dash shield

    if (
        player.invulnerable > 0
    ) {

        ctx.strokeStyle =
            "rgba(105,230,220,.7)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            player.radius + 9,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }
}

// ============================================================
// PARTICLES DRAW
// ============================================================

function drawParticles() {

    for (
        const p of particles
    ) {

        const sx =
            p.x -
            camera.x;

        const sy =
            p.y -
            camera.y;

        const alpha =
            Math.max(
                0,
                p.life /
                p.maxLife
            );

        ctx.globalAlpha =
            alpha;

        ctx.fillStyle =
            p.color;

        ctx.beginPath();

        ctx.arc(
            sx,
            sy,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}

// ============================================================
// VIGNETTE
// ============================================================

function drawVignette() {

    const gradient =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            Math.min(W, H) * .20,

            W / 2,
            H / 2,
            Math.max(W, H) * .75
        );

    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,.50)"
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

// ============================================================
// WORLD DRAW
// ============================================================

function drawWorld() {

    drawGround();

    drawRocks();

    drawTrees();

    drawBuildings();

    drawShop();

    drawBullets();

    drawEnemyBullets();

    drawEnemies();

    drawPlayer();

    drawParticles();

    drawVignette();
}

// ============================================================
// HUD
// ============================================================

function updateHUD() {

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

    const zone =
        document.getElementById(
            "zone"
        );

    const weaponName =
        document.querySelector(
            ".weaponName"
        );

    if (healthBar) {

        healthBar.style.width =
            `${
                Math.max(
                    0,
                    player.health /
                    player.maxHealth
                ) * 100
            }%`;
    }

    if (energyBar) {

        energyBar.style.width =
            `${
                Math.max(
                    0,
                    player.energy /
                    player.maxEnergy
                ) * 100
            }%`;
    }

    if (ammo) {

        const weapon =
            weapons[currentWeapon];

        ammo.textContent =
            `${weapon.ammo} / ∞`;
    }

    if (kills) {

        kills.textContent =
            `KILLS: ${player.kills}`;
    }

    if (credits) {

        credits.textContent =
            `CREDITS: ${player.credits}`;
    }

    if (weaponName) {

        weaponName.textContent =
            weapons[
                currentWeapon
            ].name;
    }

    if (zone) {

        zone.textContent =
            getZoneName(
                player.x,
                player.y
            );
    }
}

function getZoneName(x, y) {

    if (
        distance(
            x,
            y,
            shop.x + shop.w / 2,
            shop.y + shop.h / 2
        ) < 500
    ) {
        return "TRADING OUTPOST";
    }

    if (
        x < 2300 &&
        y < 2300
    ) {
        return "NORTH RUINS";
    }

    if (
        x > 4500 &&
        y < 2300
    ) {
        return "EAST SECTOR";
    }

    if (
        x < 2300 &&
        y > 4500
    ) {
        return "SOUTH FOREST";
    }

    if (
        x > 4500 &&
        y > 4500
    ) {
        return "WESTERN WILDS";
    }

    return "UNKNOWN SECTOR";
}

// ============================================================
// PAUSE
// ============================================================

function togglePause() {

    if (
        !gameRunning ||
        gameOver
    ) {
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

    mouse.down = false;
}

function resumeGame() {

    paused = false;

    const pause =
        document.getElementById(
            "pause"
        );

    if (pause) {

        pause.style.display =
            "none";
    }
}

// ============================================================
// GAME OVER
// ============================================================

function endGame() {

    gameRunning = false;

    gameOver = true;

    paused = false;

    shopOpen = false;

    closeShop();

    showGameOverScreen();

    saveGame();
}

function showGameOverScreen() {

    let screen =
        document.getElementById(
            "gameOverScreen"
        );

    if (!screen) {

        screen =
            document.createElement(
                "div"
            );

        screen.id =
            "gameOverScreen";

        screen.innerHTML = `

            <div class="gameOverWindow">

                <div class="gameOverSmall">
                    ECHOBOUND
                </div>

                <h2>
                    SIGNAL LOST
                </h2>

                <p>
                    RUN TERMINATED
                </p>

                <div id="gameOverStats"></div>

                <button id="restartRun">
                    NEW RUN
                </button>

                <button id="gameOverMenu">
                    MAIN MENU
                </button>

            </div>
        `;

        document.body.appendChild(
            screen
        );

        const style =
            document.createElement(
                "style"
            );

        style.textContent = `

            #gameOverScreen {
                position:fixed;
                inset:0;
                z-index:11000;

                display:flex;
                align-items:center;
                justify-content:center;

                background:
                    radial-gradient(
                        circle,
                        rgba(45,80,90,.20),
                        rgba(0,0,0,.90)
                    );

                font-family:Arial,sans-serif;
            }

            .gameOverWindow {
                width:min(480px,90vw);
                padding:36px;

                text-align:center;

                background:#101c21;

                border:
                    1px solid
                    #5d777b;

                color:white;

                box-shadow:
                    0 0 40px
                    rgba(0,0,0,.6);
            }

            .gameOverSmall {
                color:#70ddd6;
                letter-spacing:5px;
                font-size:12px;
            }

            .gameOverWindow h2 {
                margin:
                    10px 0 5px;

                font-size:42px;
                letter-spacing:5px;
            }

            .gameOverWindow p {
                color:#8da4a6;
            }

            #gameOverStats {
                margin:
                    25px 0;

                line-height:2;

                color:#cce0df;
            }

            .gameOverWindow button {
                width:100%;
                padding:14px;
                margin-top:10px;

                border:
                    1px solid
                    #526b70;

                background:#1c3035;

                color:#eaffff;

                cursor:pointer;

                font-weight:bold;
            }

            .gameOverWindow button:hover {
                border-color:#72ded7;
                background:#253e44;
            }

        `;

        document.head.appendChild(
            style
        );

        document
            .getElementById(
                "restartRun"
            )
            .addEventListener(
                "click",
                () => {

                    screen.style.display =
                        "none";

                    startGame();
                }
            );

        document
            .getElementById(
                "gameOverMenu"
            )
            .addEventListener(
                "click",
                () => {

                    screen.style.display =
                        "none";

                    showMenu();
                }
            );
    }

    const stats =
        document.getElementById(
            "gameOverStats"
        );

    if (stats) {

        stats.innerHTML = `
            KILLS: ${player.kills}<br>
            CREDITS: ${player.credits}<br>
            WEAPON: ${weapons[currentWeapon].name}
        `;
    }

    screen.style.display =
        "flex";
}

// ============================================================
// SAVE SYSTEM
// ============================================================

const SAVE_KEY =
    "echobound_save_v4";

function saveGame() {

    const saveData = {

        player: {

            x: player.x,
            y: player.y,

            health: player.health,
            energy: player.energy,

            credits: player.credits,

            kills: player.kills

        },

        currentWeapon,

        weapons: weapons.map(
            weapon => ({

                name: weapon.name,

                damage: weapon.damage,

                ammo: weapon.ammo

            })
        ),

        achievements:
            achievementState

    };

    try {

        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(
                saveData
            )
        );

        setSaveStatus(
            "SAVE DATA: SAVED"
        );

    } catch (error) {

        setSaveStatus(
            "SAVE DATA: ERROR"
        );
    }
}

function loadGame() {

    try {

        const raw =
            localStorage.getItem(
                SAVE_KEY
            );

        if (!raw) {

            startGame();

            return;
        }

        const data =
            JSON.parse(raw);

        player.x =
            Number.isFinite(
                data.player?.x
            )
                ? data.player.x
                : WORLD_WIDTH / 2;

        player.y =
            Number.isFinite(
                data.player?.y
            )
                ? data.player.y
                : WORLD_HEIGHT / 2;

        player.health =
            Number.isFinite(
                data.player?.health
            )
                ? data.player.health
                : player.maxHealth;

        player.energy =
            Number.isFinite(
                data.player?.energy
            )
                ? data.player.energy
                : player.maxEnergy;

        player.credits =
            Number.isFinite(
                data.player?.credits
            )
                ? data.player.credits
                : 0;

        player.kills =
            Number.isFinite(
                data.player?.kills
            )
                ? data.player.kills
                : 0;

        if (
            Array.isArray(
                data.weapons
            )
        ) {

            data.weapons.forEach(
                (saved, i) => {

                    if (
                        weapons[i]
                    ) {

                        if (
                            Number.isFinite(
                                saved.damage
                            )
                        ) {

                            weapons[i].damage =
                                saved.damage;
                        }

                        if (
                            Number.isFinite(
                                saved.ammo
                            )
                        ) {

                            weapons[i].ammo =
                                Math.max(
                                    0,
                                    Math.min(
                                        weapons[i].maxAmmo,
                                        saved.ammo
                                    )
                                );
                        }
                    }
                }
            );
        }

        if (
            Number.isInteger(
                data.currentWeapon
            )
        ) {

            currentWeapon =
                Math.max(
                    0,
                    Math.min(
                        2,
                        data.currentWeapon
                    )
                );
        }

        if (
            data.achievements
        ) {

            Object.assign(
                achievementState,
                data.achievements
            );
        }

        startGame(
            true
        );

        setSaveStatus(
            "SAVE DATA: LOADED"
        );

    } catch (error) {

        startGame();

        setSaveStatus(
            "SAVE DATA: NEW RUN"
        );
    }
}

function setSaveStatus(text) {

    const status =
        document.getElementById(
            "saveStatus"
        );

    if (status) {
        status.textContent =
            text;
    }
}

// ============================================================
// ACHIEVEMENTS
// ============================================================

const achievementState = {

    firstKill: false,
    fiveKills: false,
    twentyKills: false,
    rich: false,
    shopVisit: false

};

function checkAchievements() {

    if (
        player.kills >= 1 &&
        !achievementState.firstKill
    ) {

        achievementState.firstKill =
            true;

        unlockAchievement(
            "FIRST ECHO"
        );
    }

    if (
        player.kills >= 5 &&
        !achievementState.fiveKills
    ) {

        achievementState.fiveKills =
            true;

        unlockAchievement(
            "FIVE ECHOES"
        );
    }

    if (
        player.kills >= 20 &&
        !achievementState.twentyKills
    ) {

        achievementState.twentyKills =
            true;

        unlockAchievement(
            "SIGNAL HUNTER"
        );
    }

    if (
        player.credits >= 100 &&
        !achievementState.rich
    ) {

        achievementState.rich =
            true;

        unlockAchievement(
            "WELL FUNDED"
        );
    }
}

function unlockAchievement(name) {

    const box =
        document.getElementById(
            "achievement"
        );

    const title =
        document.getElementById(
            "achievementName"
        );

    if (!box || !title) {
        return;
    }

    title.textContent =
        name;

    box.style.display =
        "block";

    setTimeout(() => {

        box.style.display =
            "none";

    }, 2500);
}

// ============================================================
// ACHIEVEMENT MENU
// ============================================================

function showAchievements() {

    let box =
        document.getElementById(
            "achievementMenu"
        );

    if (!box) {

        box =
            document.createElement(
                "div"
            );

        box.id =
            "achievementMenu";

        box.innerHTML = `

            <div class="achievementWindow">

                <div class="achievementSmall">
                    ECHOBOUND // ARCHIVE
                </div>

                <h2>ACHIEVEMENTS</h2>

                <div id="achievementList"></div>

                <button id="closeAchievements">
                    BACK
                </button>

            </div>
        `;

        document.body.appendChild(
            box
        );

        const style =
            document.createElement(
                "style"
            );

        style.textContent = `

            #achievementMenu {
                position:fixed;
                inset:0;
                z-index:12000;

                display:flex;
                align-items:center;
                justify-content:center;

                background:
                    rgba(0,0,0,.82);

                font-family:Arial,sans-serif;
            }

            .achievementWindow {
                width:min(560px,90vw);

                padding:30px;

                background:#111e23;

                border:
                    1px solid
                    #65d8d2;

                color:white;
            }

            .achievementSmall {
                color:#6ee0d8;
                letter-spacing:4px;
                font-size:12px;
            }

            .achievementWindow h2 {
                margin:
                    8px 0 20px;

                letter-spacing:4px;
            }

            .achievementRow {
                display:flex;
                justify-content:space-between;

                padding:15px;

                margin-bottom:8px;

                background:#1b2c31;

                border:
                    1px solid
                    #30484e;
            }

            .achievementDone {
                color:#75e2da;
            }

            .achievementLocked {
                color:#71878a;
            }

            #closeAchievements {
                width:100%;

                margin-top:16px;

                padding:14px;

                background:#24383d;

                border:
                    1px solid
                    #50676c;

                color:white;

                cursor:pointer;
            }

        `;

        document.head.appendChild(
            style
        );

        document
            .getElementById(
                "closeAchievements"
            )
            .addEventListener(
                "click",
                () => {

                    box.style.display =
                        "none";
                }
            );
    }

    const list =
        document.getElementById(
            "achievementList"
        );

    const achievements = [

        [
            "FIRST ECHO",
            "Defeat your first enemy",
            achievementState.firstKill
        ],

        [
            "FIVE ECHOES",
            "Defeat five enemies",
            achievementState.fiveKills
        ],

        [
            "SIGNAL HUNTER",
            "Defeat twenty enemies",
            achievementState.twentyKills
        ],

        [
            "WELL FUNDED",
            "Collect 100 credits",
            achievementState.rich
        ],

        [
            "TRADER",
            "Visit the trading shop",
            achievementState.shopVisit
        ]

    ];

    list.innerHTML =
        achievements.map(
            achievement => `

                <div class="achievementRow">

                    <span>
                        ${achievement[0]}
                        <small>
                            ${achievement[1]}
                        </small>
                    </span>

                    <strong class="${
                        achievement[2]
                            ? "achievementDone"
                            : "achievementLocked"
                    }">

                        ${
                            achievement[2]
                                ? "UNLOCKED"
                                : "LOCKED"
                        }

                    </strong>

                </div>

            `
        ).join("");

    box.style.display =
        "flex";
}

// ============================================================
// CONTROLS
// ============================================================

function showControls() {

    let box =
        document.getElementById(
            "controlsMenu"
        );

    if (!box) {

        box =
            document.createElement(
                "div"
            );

        box.id =
            "controlsMenu";

        box.innerHTML = `

            <div class="controlsWindow">

                <div class="controlsSmall">
                    ECHOBOUND // CONTROL SYSTEM
                </div>

                <h2>CONTROLS</h2>

                <div class="controlRow">
                    <b>W A S D</b>
                    <span>MOVE</span>
                </div>

                <div class="controlRow">
                    <b>MOUSE</b>
                    <span>AIM</span>
                </div>

                <div class="controlRow">
                    <b>LEFT CLICK</b>
                    <span>SHOOT</span>
                </div>

                <div class="controlRow">
                    <b>SPACE</b>
                    <span>DASH</span>
                </div>

                <div class="controlRow">
                    <b>SHIFT</b>
                    <span>SPRINT</span>
                </div>

                <div class="controlRow">
                    <b>R</b>
                    <span>RELOAD</span>
                </div>

                <div class="controlRow">
                    <b>1 / 2 / 3</b>
                    <span>WEAPONS</span>
                </div>

                <div class="controlRow">
                    <b>E</b>
                    <span>SHOP</span>
                </div>

                <div class="controlRow">
                    <b>M</b>
                    <span>MAP</span>
                </div>

                <div class="controlRow">
                    <b>ESC</b>
                    <span>PAUSE</span>
                </div>

                <button id="closeControls">
                    BACK
                </button>

            </div>
        `;

        document.body.appendChild(
            box
        );

        const style =
            document.createElement(
                "style"
            );

        style.textContent = `

            #controlsMenu {
                position:fixed;
                inset:0;
                z-index:12000;

                display:flex;
                align-items:center;
                justify-content:center;

                background:
                    rgba(0,0,0,.82);

                font-family:Arial,sans-serif;
            }

            .controlsWindow {
                width:min(500px,90vw);

                padding:30px;

                background:#111e23;

                border:
                    1px solid
                    #65d8d2;

                color:white;
            }

            .controlsSmall {
                color:#6ee0d8;
                letter-spacing:4px;
                font-size:12px;
            }

            .controlsWindow h2 {
                letter-spacing:4px;
            }

            .controlRow {
                display:flex;
                justify-content:space-between;

                padding:10px 12px;

                border-bottom:
                    1px solid
                    rgba(120,160,160,.12);
            }

            .controlRow b {
                color:#7ce4de;
            }

            .controlRow span {
                color:#9db0b2;
            }

            #closeControls {
                width:100%;
                padding:14px;
                margin-top:18px;

                background:#24383d;

                border:
                    1px solid
                    #526a70;

                color:white;

                cursor:pointer;
            }

        `;

        document.head.appendChild(
            style
        );

        document
            .getElementById(
                "closeControls"
            )
            .addEventListener(
                "click",
                () => {

                    box.style.display =
                        "none";
                }
            );
    }

    box.style.display =
        "flex";
}

// ============================================================
// MENU
// ============================================================

function showMenu() {

    gameRunning = false;

    paused = false;

    shopOpen = false;

    closeShop();

    const menu =
        document.getElementById(
            "menu"
        );

    const hud =
        document.getElementById(
            "hud"
        );

    const pause =
        document.getElementById(
            "pause"
        );

    if (menu) {
        menu.style.display =
            "flex";
    }

    if (hud) {
        hud.style.display =
            "none";
    }

    if (pause) {
        pause.style.display =
            "none";
    }
}

function hideMenu() {

    const menu =
        document.getElementById(
            "menu"
        );

    const hud =
        document.getElementById(
            "hud"
        );

    if (menu) {
        menu.style.display =
            "none";
    }

    if (hud) {
        hud.style.display =
            "block";
    }
}

// ============================================================
// START GAME
// ============================================================

function startGame(loadExisting = false) {

    gameOver = false;

    paused = false;

    shopOpen = false;

    mapOpen = false;

    closeShop();

    // reset world

    createBuildings();

    createTrees();

    createRocks();

    createGroundDetails();

    createAlienSpawns();

    createShopUI();

    createMapUI();

    bullets.length = 0;

    enemyBullets.length = 0;

    particles.length = 0;

    enemies.length = 0;

    alienSpawnTimer = 0;

    // player reset only for new game

    if (!loadExisting) {

        player.x =
            WORLD_WIDTH / 2;

        player.y =
            WORLD_HEIGHT / 2;

        player.health =
            player.maxHealth;

        player.energy =
            player.maxEnergy;

        player.credits = 0;

        player.kills = 0;

        player.dashCooldown = 0;

        player.invulnerable = 0;

        player.shootTimer = 0;

        currentWeapon = 0;

        weapons[0].ammo =
            weapons[0].maxAmmo;

        weapons[1].ammo =
            weapons[1].maxAmmo;

        weapons[2].ammo =
            weapons[2].maxAmmo;
    }

    spawnStartingAliens();

    gameRunning = true;

    gameOver = false;

    hideMenu();

    updateCamera();

    updateHUD();

    setSaveStatus(
        loadExisting
            ? "SAVE DATA: LOADED"
            : "SAVE DATA: LOCAL"
    );
}

// ============================================================
// MENU BUTTONS
// ============================================================

function setupMenuButtons() {

    const newGame =
        document.getElementById(
            "newGame"
        );

    const loadGame =
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

    const resume =
        document.getElementById(
            "resume"
        );

    const save =
        document.getElementById(
            "save"
        );

    const quit =
        document.getElementById(
            "quit"
        );

    if (newGame) {

        newGame.addEventListener(
            "click",
            () => {

                startGame(
                    false
                );
            }
        );
    }

    if (loadGame) {

        loadGame.addEventListener(
            "click",
            () => {

                loadGameData();
            }
        );
    }

    if (
        achievementsButton
    ) {

        achievementsButton.addEventListener(
            "click",
            showAchievements
        );
    }

    if (controlsButton) {

        controlsButton.addEventListener(
            "click",
            showControls
        );
    }

    if (resume) {

        resume.addEventListener(
            "click",
            resumeGame
        );
    }

    if (save) {

        save.addEventListener(
            "click",
            saveGame
        );
    }

    if (quit) {

        quit.addEventListener(
            "click",
            () => {

                saveGame();

                showMenu();
            }
        );
    }
}

// ============================================================
// LOAD GAME BUTTON
// ============================================================

function loadGameData() {

    const raw =
        localStorage.getItem(
            SAVE_KEY
        );

    if (!raw) {

        startGame();

        return;
    }

    loadGame();
}

// ============================================================
// SAVE BEFORE LEAVING
// ============================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (gameRunning) {
            saveGame();
        }
    }
);

// ============================================================
// DISTANCE
// ============================================================

function distance(
    x1,
    y1,
    x2,
    y2
) {

    return Math.hypot(
        x2 - x1,
        y2 - y1
    );
}

// ============================================================
// GAME UPDATE
// ============================================================

function update(dt) {

    if (!gameRunning) {
        return;
    }

    if (paused) {
        return;
    }

    // IMPORTANT:
    // The shop freezes the actual game.

    if (shopOpen) {

        updateHUD();

        return;
    }

    if (mapOpen) {

        updateHUD();

        return;
    }

    worldTime += dt;

    updateAim();

    updatePlayer(dt);

    updateShooting(dt);

    updateBullets(dt);

    updateEnemyBullets(dt);

    updateEnemies(dt);

    updateParticles(dt);

    updateCamera();

    updateHUD();

    if (
        player.credits >= 100
    ) {
        checkAchievements();
    }
}

// ============================================================
// MAIN LOOP
// ============================================================

function gameLoop(time) {

    let dt =
        (time - lastTime) /
        1000;

    lastTime = time;

    // Prevent huge jumps after tab switching

    dt =
        Math.min(
            dt,
            0.05
        );

    update(dt);

    ctx.clearRect(
        0,
        0,
        W,
        H
    );

    drawWorld();

    if (mapOpen) {
        drawMap();
    }

    requestAnimationFrame(
        gameLoop
    );
}

// ============================================================
// STARTUP
// ============================================================

setupMenuButtons();

createShopUI();

createMapUI();

showMenu();

requestAnimationFrame(
    gameLoop
);

// ============================================================
// END OF ECHOBOUND APP.JS
// ============================================================
