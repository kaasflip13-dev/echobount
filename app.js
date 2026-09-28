(() => {
"use strict";

if (window.__ECHOboundLoaded) return;
window.__ECHOboundLoaded = true;

/* =========================================================
   ECHOBOUND — THE LOST SIGNAL
   Complete game engine
   ========================================================= */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

if (!canvas || !ctx) {
    document.body.innerHTML =
        "<h1 style='color:white;background:#05070a;padding:30px'>Game canvas niet gevonden.</h1>";
    return;
}

/* =========================================================
   CANVAS
   ========================================================= */

let W = window.innerWidth;
let H = window.innerHeight;
let DPR = Math.min(window.devicePixelRatio || 1, 2);

function resize() {
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

window.addEventListener("resize", resize);
resize();

/* =========================================================
   EXTRA UI
   ========================================================= */

const extraStyle = document.createElement("style");

extraStyle.textContent = `
#extraHUD{
    position:fixed;
    left:50%;
    bottom:26px;
    transform:translateX(-50%);
    z-index:30;
    pointer-events:none;
    color:#dcecff;
    font-family:Arial,sans-serif;
    text-align:center;
    text-shadow:0 2px 8px #000;
}

#extraHUD .sector{
    font-size:11px;
    letter-spacing:4px;
    opacity:.65;
}

#extraHUD .mission{
    margin-top:5px;
    font-size:13px;
    letter-spacing:2px;
}

#crosshair{
    position:fixed;
    left:0;
    top:0;
    width:22px;
    height:22px;
    margin:-11px;
    z-index:40;
    pointer-events:none;
}

#crosshair:before,
#crosshair:after{
    content:"";
    position:absolute;
    background:#dff8ff;
    box-shadow:0 0 8px #6ee7ff;
}

#crosshair:before{
    width:2px;
    height:22px;
    left:10px;
}

#crosshair:after{
    width:22px;
    height:2px;
    top:10px;
}

#interact{
    position:fixed;
    left:50%;
    bottom:90px;
    transform:translateX(-50%);
    z-index:40;
    pointer-events:none;
    background:rgba(4,10,18,.75);
    border:1px solid rgba(110,220,255,.35);
    padding:8px 16px;
    border-radius:6px;
    color:#dffaff;
    font:12px Arial;
    letter-spacing:2px;
    opacity:0;
}

#gameMessage{
    position:fixed;
    left:50%;
    top:18%;
    transform:translateX(-50%);
    z-index:50;
    pointer-events:none;
    color:white;
    text-align:center;
    font-family:Arial,sans-serif;
    opacity:0;
    transition:opacity .25s;
    text-shadow:0 3px 15px black;
}

#gameMessage .big{
    font-size:30px;
    letter-spacing:7px;
    font-weight:bold;
}

#gameMessage .small{
    margin-top:8px;
    font-size:12px;
    letter-spacing:3px;
    color:#9fdfff;
}

#inventoryPanel,
#achievementPanel,
#savePanel,
#controlsPanel{
    position:fixed;
    inset:0;
    z-index:500;
    display:none;
    align-items:center;
    justify-content:center;
    background:rgba(1,4,8,.82);
    backdrop-filter:blur(12px);
}

.panelBox{
    width:min(720px,90vw);
    max-height:80vh;
    overflow:auto;
    padding:30px;
    border:1px solid rgba(110,220,255,.35);
    background:
      linear-gradient(135deg,rgba(15,30,45,.96),rgba(5,9,15,.97));
    box-shadow:
      0 30px 100px rgba(0,0,0,.8),
      inset 0 0 60px rgba(70,170,255,.04);
    color:#eaf7ff;
    font-family:Arial,sans-serif;
}

.panelBox h2{
    margin:0 0 20px;
    letter-spacing:5px;
    font-size:25px;
}

.panelGrid{
    display:grid;
    grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
    gap:10px;
}

.panelCard{
    padding:15px;
    background:rgba(255,255,255,.035);
    border:1px solid rgba(255,255,255,.08);
}

.panelCard strong{
    display:block;
    margin-bottom:7px;
}

.panelButton{
    margin-top:20px;
    padding:12px 20px;
    background:#102738;
    color:white;
    border:1px solid #3e89a8;
    cursor:pointer;
    letter-spacing:2px;
}

.panelButton:hover{
    background:#17425b;
}

.saveSlot{
    padding:18px;
    margin:10px 0;
    border:1px solid rgba(255,255,255,.1);
    background:rgba(255,255,255,.035);
    cursor:pointer;
}

.saveSlot:hover{
    border-color:#64cfff;
    background:rgba(70,180,255,.08);
}

#damageFlash{
    position:fixed;
    inset:0;
    z-index:25;
    pointer-events:none;
    background:rgba(255,50,50,.15);
    opacity:0;
}

#levelUp{
    position:fixed;
    left:50%;
    top:35%;
    transform:translate(-50%,-50%);
    z-index:60;
    pointer-events:none;
    text-align:center;
    color:white;
    opacity:0;
}

#levelUp .title{
    font-size:38px;
    letter-spacing:8px;
    font-weight:bold;
}

#levelUp .sub{
    margin-top:10px;
    letter-spacing:3px;
    color:#8fe8ff;
}

#weaponDisplay{
    position:fixed;
    right:30px;
    bottom:65px;
    z-index:20;
    pointer-events:none;
    text-align:right;
    color:white;
    font-family:Arial;
}

#weaponDisplay .name{
    font-size:18px;
    letter-spacing:4px;
}

#weaponDisplay .type{
    font-size:9px;
    opacity:.55;
    letter-spacing:3px;
}

#worldDebug{
    position:fixed;
    left:12px;
    bottom:10px;
    z-index:20;
    pointer-events:none;
    color:rgba(200,230,240,.45);
    font:10px monospace;
}
`;

document.head.appendChild(extraStyle);

function makeElement(id, html = "") {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement("div");
        el.id = id;
        document.body.appendChild(el);
    }
    el.innerHTML = html;
    return el;
}

const extraHUD = makeElement("extraHUD");
const crosshair = makeElement("crosshair");
const interactUI = makeElement("interact");
const messageUI = makeElement("gameMessage");
const damageFlash = makeElement("damageFlash");
const levelUpUI = makeElement("levelUp");

const inventoryPanel = makeElement("inventoryPanel", `
<div class="panelBox">
<h2>INVENTORY</h2>
<div id="inventoryContent"></div>
<button class="panelButton" id="closeInventory">CLOSE</button>
</div>`);

const achievementPanel = makeElement("achievementPanel", `
<div class="panelBox">
<h2>ACHIEVEMENTS</h2>
<div class="panelGrid" id="achievementContent"></div>
<button class="panelButton" id="closeAchievements">CLOSE</button>
</div>`);

const savePanel = makeElement("savePanel", `
<div class="panelBox">
<h2>SAVE RUN</h2>
<div id="saveSlots"></div>
<button class="panelButton" id="closeSave">CLOSE</button>
</div>`);

const controlsPanel = makeElement("controlsPanel", `
<div class="panelBox">
<h2>CONTROLS</h2>
<div class="panelGrid">
<div class="panelCard"><strong>W A S D</strong>Move</div>
<div class="panelCard"><strong>MOUSE</strong>Aim</div>
<div class="panelCard"><strong>LEFT CLICK</strong>Fire</div>
<div class="panelCard"><strong>SPACE</strong>Dash</div>
<div class="panelCard"><strong>E</strong>Interact</div>
<div class="panelCard"><strong>R</strong>Reload</div>
<div class="panelCard"><strong>1 - 6</strong>Weapons</div>
<div class="panelCard"><strong>M</strong>Map</div>
<div class="panelCard"><strong>I</strong>Inventory</div>
<div class="panelCard"><strong>ESC</strong>Pause</div>
</div>
<button class="panelButton" id="closeControls">CLOSE</button>
</div>`);

const worldDebug = makeElement("worldDebug");

/* =========================================================
   GAME STATE
   ========================================================= */

let state = "menu";

let time = 0;
let lastTime = performance.now();

let camera = {
    x: 0,
    y: 0,
    shake: 0
};

const WORLD_W = 7000;
const WORLD_H = 5200;

/* =========================================================
   INPUT
   ========================================================= */

const keys = Object.create(null);

let mouse = {
    x: W / 2,
    y: H / 2,
    worldX: 0,
    worldY: 0,
    down: false
};

function keyDown(...names) {
    return names.some(n => keys[n] === true);
}

window.addEventListener("keydown", e => {

    keys[e.code] = true;
    keys[e.key] = true;
    keys[e.key.toLowerCase()] = true;

    if (
        [
            "KeyW","KeyA","KeyS","KeyD",
            "ArrowUp","ArrowDown","ArrowLeft","ArrowRight",
            "Space"
        ].includes(e.code)
    ) {
        e.preventDefault();
    }

    if (e.repeat) return;

    if (e.code === "Escape") {
        if (state === "playing") {
            state = "paused";
            document.getElementById("pause").style.display = "flex";
        } else if (state === "paused") {
            resumeGame();
        }
    }

    if (state !== "playing") return;

    if (e.code === "KeyM") toggleMap();
    if (e.code === "KeyI") toggleInventory();

    if (e.code === "KeyR") reload();

    if (e.code === "KeyE") interact();

    if (e.code === "Digit1") selectWeapon(0);
    if (e.code === "Digit2") selectWeapon(1);
    if (e.code === "Digit3") selectWeapon(2);
    if (e.code === "Digit4") selectWeapon(3);
    if (e.code === "Digit5") selectWeapon(4);
    if (e.code === "Digit6") selectWeapon(5);
});

window.addEventListener("keyup", e => {
    keys[e.code] = false;
    keys[e.key] = false;
    keys[e.key.toLowerCase()] = false;
});

window.addEventListener("blur", () => {
    for (const k in keys) keys[k] = false;
    mouse.down = false;
});

window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener("mousedown", e => {
    if (e.button === 0) mouse.down = true;
});

window.addEventListener("mouseup", e => {
    if (e.button === 0) mouse.down = false;
});

window.addEventListener("contextmenu", e => e.preventDefault());

/* =========================================================
   AUDIO
   ========================================================= */

let audioCtx = null;

function audioStart() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch {}
    }

    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
    }
}

function sound(freq, duration = .05, type = "sine", volume = .035) {
    if (!audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            .001,
            audioCtx.currentTime + duration
        );

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch {}
}

/* =========================================================
   UTILITIES
   ========================================================= */

function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function random(a, b) {
    return a + Math.random() * (b - a);
}

function randomInt(a, b) {
    return Math.floor(random(a, b + 1));
}

function rectCircleCollide(circle, rect) {
    const x = clamp(circle.x, rect.x, rect.x + rect.w);
    const y = clamp(circle.y, rect.y, rect.y + rect.h);

    return Math.hypot(circle.x - x, circle.y - y) < circle.r;
}

function circleRectPush(circle, rect) {

    const x = clamp(circle.x, rect.x, rect.x + rect.w);
    const y = clamp(circle.y, rect.y, rect.y + rect.h);

    let dx = circle.x - x;
    let dy = circle.y - y;

    const d = Math.hypot(dx, dy);

    if (d < circle.r) {

        if (d === 0) {
            const left = Math.abs(circle.x - rect.x);
            const right = Math.abs(circle.x - (rect.x + rect.w));
            const top = Math.abs(circle.y - rect.y);
            const bottom = Math.abs(circle.y - (rect.y + rect.h));

            const smallest = Math.min(left, right, top, bottom);

            if (smallest === left) circle.x = rect.x - circle.r;
            else if (smallest === right) circle.x = rect.x + rect.w + circle.r;
            else if (smallest === top) circle.y = rect.y - circle.r;
            else circle.y = rect.y + rect.h + circle.r;

        } else {

            dx /= d;
            dy /= d;

            const push = circle.r - d;

            circle.x += dx * push;
            circle.y += dy * push;
        }

        return true;
    }

    return false;
}

function lineIntersectsRect(x1,y1,x2,y2,r) {

    const steps = Math.ceil(Math.hypot(x2-x1,y2-y1)/30);

    for(let i=0;i<=steps;i++){
        const t=i/steps;
        const x=lerp(x1,x2,t);
        const y=lerp(y1,y2,t);

        if(x>=r.x && x<=r.x+r.w &&
           y>=r.y && y<=r.y+r.h){
            return true;
        }
    }

    return false;
}

/* =========================================================
   WALLS
   ========================================================= */

const walls = [

    {x:300,y:300,w:1100,h:80,type:"wall"},
    {x:300,y:300,w:80,h:900,type:"wall"},

    {x:1700,y:250,w:80,h:1100,type:"wall"},
    {x:1700,y:250,w:1100,h:80,type:"wall"},

    {x:3200,y:350,w:1200,h:80,type:"wall"},
    {x:4320,y:350,w:80,h:1000,type:"wall"},

    {x:500,y:1600,w:80,h:1000,type:"wall"},
    {x:500,y:2520,w:1200,h:80,type:"wall"},

    {x:2100,y:1700,w:1100,h:80,type:"wall"},
    {x:2100,y:1700,w:80,h:1000,type:"wall"},

    {x:3600,y:1600,w:80,h:1200,type:"wall"},
    {x:3600,y:2720,w:1200,h:80,type:"wall"},

    {x:800,y:3400,w:1500,h:80,type:"wall"},
    {x:800,y:3400,w:80,h:1000,type:"wall"},

    {x:2700,y:3300,w:80,h:1100,type:"wall"},
    {x:2700,y:4320,w:1300,h:80,type:"wall"},

    {x:4500,y:3200,w:1000,h:80,type:"wall"},
    {x:5420,y:3200,w:80,h:1000,type:"wall"},

    {x:4700,y:1400,w:1000,h:80,type:"wall"},
    {x:4700,y:1400,w:80,h:900,type:"wall"}
];

/* =========================================================
   PROPS
   ========================================================= */

const props = [];

for(let i=0;i<220;i++){

    const x=random(100,WORLD_W-100);
    const y=random(100,WORLD_H-100);

    const p={
        x,
        y,
        size:random(12,35),
        type:Math.random()<.55?"crate":"rock",
        rotation:random(0,Math.PI*2)
    };

    let blocked=false;

    for(const w of walls){
        if(
            x>w.x-50 &&
            x<w.x+w.w+50 &&
            y>w.y-50 &&
            y<w.y+w.h+50
        ){
            blocked=true;
            break;
        }
    }

    if(!blocked) props.push(p);
}

/* =========================================================
   PLAYER
   ========================================================= */

const player = {

    x: 900,
    y: 900,

    r: 20,

    speed: 245,

    hp: 100,
    maxHp: 100,

    energy: 100,
    maxEnergy: 100,

    angle: 0,

    dash: 0,
    dashCooldown: 0,

    level: 1,
    xp: 0,
    xpNeed: 100,

    credits: 0,
    kills: 0,

    shots: 0,

    armor: 0,

    invincible: 0,

    weapon: 0,

    ammo: 12,

    inventory: {
        medkit: 2,
        energy: 2,
        scrap: 0,
        cores: 0
    },

    upgrades: {
        speed: 0,
        health: 0,
        energy: 0,
        damage: 0
    },

    distance: 0
};

/* =========================================================
   WEAPONS
   ========================================================= */

const weapons = [

    {
        name:"PULSE",
        damage:24,
        fireRate:.22,
        speed:900,
        spread:.015,
        pellets:1,
        maxAmmo:12,
        reload:1.1,
        color:"#75eaff"
    },

    {
        name:"BURST",
        damage:16,
        fireRate:.08,
        speed:1000,
        spread:.04,
        pellets:1,
        maxAmmo:24,
        reload:1.5,
        color:"#a8ffdf"
    },

    {
        name:"HEAVY",
        damage:55,
        fireRate:.65,
        speed:760,
        spread:.02,
        pellets:1,
        maxAmmo:6,
        reload:1.8,
        color:"#ffbf70"
    },

    {
        name:"SCATTER",
        damage:13,
        fireRate:.7,
        speed:720,
        spread:.24,
        pellets:7,
        maxAmmo:5,
        reload:1.7,
        color:"#ff8eae"
    },

    {
        name:"RAIL",
        damage:105,
        fireRate:1.2,
        speed:1600,
        spread:.005,
        pellets:1,
        maxAmmo:3,
        reload:2,
        color:"#d7b4ff"
    },

    {
        name:"PLASMA",
        damage:38,
        fireRate:.3,
        speed:650,
        spread:.06,
        pellets:2,
        maxAmmo:10,
        reload:1.6,
        color:"#72ff8d"
    }

];

let fireCooldown=0;
let reloadTimer=0;

/* =========================================================
   ENEMIES
   ========================================================= */

const enemies=[];
const bullets=[];
const enemyBullets=[];
const particles=[];
const pickups=[];
const effects=[];
const chests=[];
const terminals=[];

let spawnTimer=0;
let enemyId=1;

/* =========================================================
   ENEMY TYPES
   ========================================================= */

const enemyTypes = {

    scout:{
        hp:45,
        speed:85,
        radius:17,
        damage:8,
        range:550,
        fireRate:1.7,
        color:"#71f6ff",
        xp:25
    },

    hunter:{
        hp:75,
        speed:115,
        radius:20,
        damage:12,
        range:650,
        fireRate:1.3,
        color:"#ffbd66",
        xp:40
    },

    guardian:{
        hp:160,
        speed:48,
        radius:29,
        damage:18,
        range:500,
        fireRate:1.9,
        color:"#bd8cff",
        xp:80
    },

    sniper:{
        hp:65,
        speed:45,
        radius:18,
        damage:28,
        range:950,
        fireRate:2.8,
        color:"#ff6f9c",
        xp:90
    },

    drone:{
        hp:35,
        speed:150,
        radius:14,
        damage:7,
        range:450,
        fireRate:1.2,
        color:"#7cff9c",
        xp:35
    },

    brute:{
        hp:330,
        speed:35,
        radius:38,
        damage:25,
        range:400,
        fireRate:2.2,
        color:"#ff795f",
        xp:150
    }

};

/* =========================================================
   SPAWN SYSTEM
   ========================================================= */

/*
   BELANGRIJK:
   Monsters worden niet alleen aan het begin gemaakt.

   Elke keer dat de speler verder reist worden er opnieuw
   monsters rond de speler geplaatst.

   Daardoor blijven monsters verschijnen als je ver weg loopt.
*/

let lastSpawnX=player.x;
let lastSpawnY=player.y;
let totalSpawned=0;

function chooseEnemyType(){

    const roll=Math.random();

    if(player.level>=7 && roll<.08) return "brute";
    if(player.level>=5 && roll<.18) return "sniper";
    if(player.level>=4 && roll<.32) return "guardian";
    if(roll<.48) return "hunter";
    if(roll<.65) return "drone";

    return "scout";
}

function isBlocked(x,y,r=20){

    if(x<50 || y<50 || x>WORLD_W-50 || y>WORLD_H-50)
        return true;

    for(const w of walls){
        if(rectCircleCollide({x,y,r},w))
            return true;
    }

    return false;
}

function spawnEnemyNearPlayer(force=false){

    if(!force && enemies.length>=55)
        return;

    let tries=0;

    while(tries++<60){

        const angle=random(0,Math.PI*2);

        /*
          Monsters komen tussen ongeveer 650 en 1300 pixels
          van de speler. Daardoor zie je ze niet direct naast je
          verschijnen.
        */

        const distance=random(650,1300);

        const x=player.x+Math.cos(angle)*distance;
        const y=player.y+Math.sin(angle)*distance;

        if(x<80 || y<80 || x>WORLD_W-80 || y>WORLD_H-80)
            continue;

        if(isBlocked(x,y,30))
            continue;

        const typeName=chooseEnemyType();
        const type=enemyTypes[typeName];

        const e={

            id:enemyId++,

            x,
            y,

            r:type.radius,

            type:typeName,

            hp:type.hp*(1+player.level*.055),
            maxHp:type.hp*(1+player.level*.055),

            speed:type.speed*(1+Math.min(player.level*.012,.3)),

            damage:type.damage,

            range:type.range,

            fireRate:type.fireRate,

            fireCooldown:random(.4,2),

            color:type.color,

            xp:type.xp,

            angle:0,

            hit:0,

            wander:random(0,Math.PI*2),

            wanderTimer:random(1,4),

            alive:true,

            spawnTime:time

        };

        enemies.push(e);
        totalSpawned++;

        return e;
    }

    return null;
}

function maintainEnemies(){

    /*
      Dit is de belangrijkste fix.

      Zodra de speler ongeveer 450 pixels verder is gelopen,
      controleren we opnieuw de wereld.

      Dus:
      start -> monsters
      ver weg -> nieuwe monsters
      nog verder -> opnieuw nieuwe monsters
    */

    const moved=Math.hypot(
        player.x-lastSpawnX,
        player.y-lastSpawnY
    );

    if(moved>450){

        const amount=Math.min(
            5,
            2+Math.floor(player.level/3)
        );

        for(let i=0;i<amount;i++){
            spawnEnemyNearPlayer(true);
        }

        lastSpawnX=player.x;
        lastSpawnY=player.y;
    }

    /*
      Extra spawn timer.
    */

    spawnTimer-=dt;

    if(spawnTimer<=0){

        const desired=Math.min(
            18+player.level*3,
            55
        );

        if(enemies.length<desired){

            const amount=enemies.length<8 ? 3 : 1;

            for(let i=0;i<amount;i++){
                spawnEnemyNearPlayer(true);
            }
        }

        spawnTimer=Math.max(.7,2.5-player.level*.04);
    }

    /*
      Als de speler heel ver van een monster komt,
      verwijderen we dat monster.

      Daarna wordt het gebied opnieuw bevolkt.
      Hierdoor blijft de game performant.
    */

    for(let i=enemies.length-1;i>=0;i--){

        const e=enemies[i];

        const d=Math.hypot(
            e.x-player.x,
            e.y-player.y
        );

        if(d>1900){
            enemies.splice(i,1);
        }
    }
}

/* =========================================================
   PROJECTILES
   ========================================================= */

function shoot(){

    if(state!=="playing") return;

    if(reloadTimer>0) return;

    const weapon=weapons[player.weapon];

    if(fireCooldown>0) return;

    if(player.ammo<=0){

        reload();
        return;
    }

    player.ammo--;
    player.shots++;

    fireCooldown=weapon.fireRate;

    const angle=Math.atan2(
        mouse.worldY-player.y,
        mouse.worldX-player.x
    );

    player.angle=angle;

    for(let i=0;i<weapon.pellets;i++){

        const a=
            angle+
            random(-weapon.spread,weapon.spread);

        bullets.push({

            x:player.x+Math.cos(a)*28,
            y:player.y+Math.sin(a)*28,

            vx:Math.cos(a)*weapon.speed,
            vy:Math.sin(a)*weapon.speed,

            life:1.4,

            damage:
                weapon.damage+
                player.upgrades.damage*5,

            radius:weapon.pellets>1?4:5,

            color:weapon.color

        });
    }

    particlesBurst(
        player.x+Math.cos(angle)*28,
        player.y+Math.sin(angle)*28,
        weapon.color,
        weapon.pellets>1?5:3
    );

    camera.shake=Math.max(camera.shake,2);

    sound(
        weapon.pellets>3?90:
        weapon.name==="RAIL"?170:
        240,
        .05,
        "square",
        .025
    );
}

function reload(){

    if(reloadTimer>0) return;

    const weapon=weapons[player.weapon];

    if(player.ammo>=weapon.maxAmmo) return;

    reloadTimer=weapon.reload;

    sound(110,.08,"triangle",.02);
}

function finishReload(){

    player.ammo=weapons[player.weapon].maxAmmo;
    reloadTimer=0;

    sound(330,.1,"triangle",.025);
}

function selectWeapon(index){

    if(index<0 || index>=weapons.length) return;

    if(player.weapon===index) return;

    player.weapon=index;

    player.ammo=Math.min(
        player.ammo,
        weapons[index].maxAmmo
    );

    fireCooldown=.2;

    unlockAchievement("arsenal");

    updateWeaponUI();
}

/* =========================================================
   PLAYER MOVEMENT
   ========================================================= */

function movePlayer(dx,dy){

    /*
      Horizontaal en verticaal apart.

      Dit voorkomt dat een muur de hele beweging blokkeert.
    */

    const oldX=player.x;
    const oldY=player.y;

    player.x+=dx;

    for(const w of walls){
        circleRectPush(player,w);
    }

    player.x=clamp(
        player.x,
        player.r,
        WORLD_W-player.r
    );

    player.y+=dy;

    for(const w of walls){
        circleRectPush(player,w);
    }

    player.y=clamp(
        player.y,
        player.r,
        WORLD_H-player.r
    );

    const moved=Math.hypot(
        player.x-oldX,
        player.y-oldY
    );

    player.distance+=moved;

    if(moved>0){
        unlockAchievement("explorer");
    }
}

function updatePlayer(){

    let mx=0;
    let my=0;

    /*
      ROBUUSTE WASD FIX

      We lezen zowel event.code als letterwaarden.
    */

    if(
        keyDown("KeyW") ||
        keyDown("w") ||
        keyDown("W") ||
        keyDown("ArrowUp")
    ) my-=1;

    if(
        keyDown("KeyS") ||
        keyDown("s") ||
        keyDown("S") ||
        keyDown("ArrowDown")
    ) my+=1;

    if(
        keyDown("KeyA") ||
        keyDown("a") ||
        keyDown("A") ||
        keyDown("ArrowLeft")
    ) mx-=1;

    if(
        keyDown("KeyD") ||
        keyDown("d") ||
        keyDown("D") ||
        keyDown("ArrowRight")
    ) mx+=1;

    /*
      Normaliseren zodat diagonaal lopen niet sneller is.
    */

    if(mx!==0 || my!==0){

        const length=Math.hypot(mx,my);

        mx/=length;
        my/=length;

        let speed=
            player.speed+
            player.upgrades.speed*20;

        if(player.dash>0){
            speed*=4.8;
        }

        movePlayer(
            mx*speed*dt,
            my*speed*dt
        );
    }

    player.energy=
        clamp(
            player.energy+15*dt,
            0,
            player.maxEnergy+
            player.upgrades.energy*10
        );

    if(player.invincible>0)
        player.invincible-=dt;

    if(player.dashCooldown>0)
        player.dashCooldown-=dt;

    if(
        keyDown("Space") &&
        player.dashCooldown<=0 &&
        player.energy>=30 &&
        (mx!==0 || my!==0)
    ){

        player.energy-=30;
        player.dash=.16;
        player.dashCooldown=.75;
        player.invincible=.25;

        particlesBurst(
            player.x,
            player.y,
            "#76e7ff",
            18
        );

        sound(80,.15,"sawtooth",.035);
    }

    if(player.dash>0)
        player.dash-=dt;

    if(fireCooldown>0)
        fireCooldown-=dt;

    if(reloadTimer>0){

        reloadTimer-=dt;

        if(reloadTimer<=0)
            finishReload();
    }

    if(mouse.down)
        shoot();
}

/* =========================================================
   ENEMY AI
   ========================================================= */

function updateEnemies(){

    for(const e of enemies){

        if(!e.alive) continue;

        const dx=player.x-e.x;
        const dy=player.y-e.y;

        const distance=Math.hypot(dx,dy);

        e.angle=Math.atan2(dy,dx);

        if(e.hit>0)
            e.hit-=dt;

        /*
          Chase behavior.
        */

        if(distance<1300){

            let vx=0;
            let vy=0;

            if(distance>e.range*.62){

                vx=Math.cos(e.angle);
                vy=Math.sin(e.angle);

            }else{

                /*
                  Strafe rond de speler.
                */

                vx=
                    Math.cos(e.angle+Math.PI/2)*.65;

                vy=
                    Math.sin(e.angle+Math.PI/2)*.65;
            }

            /*
              Kleine variatie zodat monsters niet exact
              hetzelfde bewegen.
            */

            vx+=Math.cos(time*1.7+e.id)*.12;
            vy+=Math.sin(time*1.3+e.id)*.12;

            const length=Math.hypot(vx,vy)||1;

            vx/=length;
            vy/=length;

            const oldX=e.x;
            const oldY=e.y;

            e.x+=vx*e.speed*dt;
            e.y+=vy*e.speed*dt;

            for(const w of walls)
                circleRectPush(e,w);

            e.x=clamp(e.x,e.r,WORLD_W-e.r);
            e.y=clamp(e.y,e.r,WORLD_H-e.r);

            /*
              Bots kunnen elkaar niet helemaal overlappen.
            */

            for(const other of enemies){

                if(other===e) continue;

                const dd=Math.hypot(
                    e.x-other.x,
                    e.y-other.y
                );

                const min=e.r+other.r;

                if(dd<min && dd>0){

                    const push=(min-dd)*.08;

                    e.x+=(e.x-other.x)/dd*push;
                    e.y+=(e.y-other.y)/dd*push;
                }
            }
        }

        /*
          Schieten.
        */

        e.fireCooldown-=dt;

        if(
            distance<e.range &&
            e.fireCooldown<=0 &&
            hasLineOfSight(e.x,e.y,player.x,player.y)
        ){

            enemyShoot(e);

            e.fireCooldown=
                e.fireRate+
                random(-.25,.35);
        }

        /*
          Contact damage.
        */

        if(
            distance<e.r+player.r+3 &&
            player.invincible<=0
        ){

            damagePlayer(e.damage);

            const pushAngle=Math.atan2(
                player.y-e.y,
                player.x-e.x
            );

            player.x+=Math.cos(pushAngle)*15;
            player.y+=Math.sin(pushAngle)*15;
        }
    }
}

function enemyShoot(e){

    const angle=e.angle;

    enemyBullets.push({

        x:e.x+Math.cos(angle)*(e.r+5),
        y:e.y+Math.sin(angle)*(e.r+5),

        vx:Math.cos(angle)*390,
        vy:Math.sin(angle)*390,

        damage:e.damage,
        life:4,

        radius:5,
        color:e.color

    });

    particlesBurst(
        e.x+Math.cos(angle)*e.r,
        e.y+Math.sin(angle)*e.r,
        e.color,
        4
    );
}

/* =========================================================
   LINE OF SIGHT
   ========================================================= */

function hasLineOfSight(x1,y1,x2,y2){

    for(const w of walls){

        if(lineIntersectsRect(
            x1,y1,x2,y2,w
        )){
            return false;
        }
    }

    return true;
}

/* =========================================================
   DAMAGE
   ========================================================= */

function damagePlayer(amount){

    if(player.invincible>0) return;

    const reduced=Math.max(
        1,
        amount-player.armor
    );

    player.hp-=reduced;
    player.invincible=.55;

    damageFlash.style.opacity=.8;

    setTimeout(()=>{
        damageFlash.style.opacity=0;
    },100);

    camera.shake=7;

    particlesBurst(
        player.x,
        player.y,
        "#ff6578",
        8
    );

    sound(70,.12,"sawtooth",.04);

    if(player.hp<=0){
        gameOver();
    }
}

/* =========================================================
   BULLETS
   ========================================================= */

function updateBullets(){

    for(let i=bullets.length-1;i>=0;i--){

        const b=bullets[i];

        b.x+=b.vx*dt;
        b.y+=b.vy*dt;
        b.life-=dt;

        let remove=b.life<=0;

        if(
            b.x<0 ||
            b.y<0 ||
            b.x>WORLD_W ||
            b.y>WORLD_H
        ){
            remove=true;
        }

        for(const w of walls){

            if(
                b.x>w.x &&
                b.x<w.x+w.w &&
                b.y>w.y &&
                b.y<w.y+w.h
            ){
                remove=true;

                particlesBurst(
                    b.x,
                    b.y,
                    b.color,
                    5
                );

                break;
            }
        }

        if(remove){
            bullets.splice(i,1);
            continue;
        }

        for(const e of enemies){

            if(!e.alive) continue;

            const d=Math.hypot(
                b.x-e.x,
                b.y-e.y
            );

            if(d<e.r+b.radius){

                e.hp-=b.damage;
                e.hit=.12;

                particlesBurst(
                    b.x,
                    b.y,
                    e.color,
                    8
                );

                bullets.splice(i,1);

                if(e.hp<=0)
                    killEnemy(e);

                break;
            }
        }
    }
}

/* =========================================================
   ENEMY BULLETS
   ========================================================= */

function updateEnemyBullets(){

    for(let i=enemyBullets.length-1;i>=0;i--){

        const b=enemyBullets[i];

        b.x+=b.vx*dt;
        b.y+=b.vy*dt;
        b.life-=dt;

        let remove=b.life<=0;

        for(const w of walls){

            if(
                b.x>w.x &&
                b.x<w.x+w.w &&
                b.y>w.y &&
                b.y<w.y+w.h
            ){
                remove=true;
                break;
            }
        }

        if(
            Math.hypot(
                b.x-player.x,
                b.y-player.y
            )<
            player.r+b.radius
        ){

            damagePlayer(b.damage);
            remove=true;
        }

        if(remove)
            enemyBullets.splice(i,1);
    }
}

/* =========================================================
   KILL / XP
   ========================================================= */

function killEnemy(e){

    if(!e.alive) return;

    e.alive=false;

    player.kills++;
    player.credits+=randomInt(5,18);

    addXP(e.xp);

    particlesBurst(
        e.x,
        e.y,
        e.color,
        24
    );

    if(Math.random()<.25)
        spawnPickup(e.x,e.y);

    if(Math.random()<.08)
        player.inventory.cores++;

    unlockAchievement("firstEcho");

    if(player.kills>=10)
        unlockAchievement("tenEchoes");

    if(player.kills>=50)
        unlockAchievement("hunter");

    sound(150,.08,"triangle",.025);

    setTimeout(()=>{

        const index=enemies.indexOf(e);

        if(index!==-1)
            enemies.splice(index,1);

    },50);
}

function addXP(amount){

    player.xp+=amount;

    while(player.xp>=player.xpNeed){

        player.xp-=player.xpNeed;
        player.level++;

        player.xpNeed=
            Math.floor(player.xpNeed*1.3);

        player.maxHp+=5;
        player.hp=player.maxHp;

        player.maxEnergy+=5;
        player.energy=player.maxEnergy;

        levelUpUI.innerHTML=`
        <div class="title">LEVEL ${player.level}</div>
        <div class="sub">SYSTEM CAPACITY INCREASED</div>
        `;

        levelUpUI.style.opacity=1;

        setTimeout(()=>{
            levelUpUI.style.opacity=0;
        },1800);

        sound(440,.25,"sine",.04);

        if(player.level>=5)
            unlockAchievement("survivor");
    }
}

/* =========================================================
   PICKUPS
   ========================================================= */

function spawnPickup(x,y){

    const types=[
        "credit",
        "health",
        "energy",
        "scrap"
    ];

    const type=
        types[randomInt(0,types.length-1)];

    pickups.push({
        x,
        y,
        type,
        amount:
            type==="credit"?randomInt(5,25):
            type==="scrap"?randomInt(1,4):
            1,
        life:40,
        pulse:random(0,10)
    });
}

function updatePickups(){

    for(let i=pickups.length-1;i>=0;i--){

        const p=pickups[i];

        p.life-=dt;
        p.pulse+=dt*4;

        const d=Math.hypot(
            p.x-player.x,
            p.y-player.y
        );

        if(d<player.r+22){

            if(p.type==="credit")
                player.credits+=p.amount;

            if(p.type==="health")
                player.inventory.medkit++;

            if(p.type==="energy")
                player.inventory.energy++;

            if(p.type==="scrap")
                player.inventory.scrap+=p.amount;

            particlesBurst(
                p.x,
                p.y,
                "#a8f8ff",
                8
            );

            sound(600,.07,"sine",.02);

            pickups.splice(i,1);
            continue;
        }

        if(p.life<=0)
            pickups.splice(i,1);
    }
}

/* =========================================================
   PARTICLES
   ========================================================= */

function particlesBurst(x,y,color,count){

    for(let i=0;i<count;i++){

        const a=random(0,Math.PI*2);
        const speed=random(25,180);

        particles.push({

            x,
            y,

            vx:Math.cos(a)*speed,
            vy:Math.sin(a)*speed,

            life:random(.25,.8),
            maxLife:.8,

            size:random(1.5,4),

            color

        });
    }
}

function updateParticles(){

    for(let i=particles.length-1;i>=0;i--){

        const p=particles[i];

        p.x+=p.vx*dt;
        p.y+=p.vy*dt;

        p.vx*=.96;
        p.vy*=.96;

        p.life-=dt;

        if(p.life<=0)
            particles.splice(i,1);
    }
}

/* =========================================================
   CHESTS
   ========================================================= */

for(let i=0;i<28;i++){

    let x=random(150,WORLD_W-150);
    let y=random(150,WORLD_H-150);

    if(!isBlocked(x,y,35)){

        chests.push({
            x,
            y,
            opened:false
        });
    }
}

/* =========================================================
   TERMINALS
   ========================================================= */

for(let i=0;i<15;i++){

    let x=random(150,WORLD_W-150);
    let y=random(150,WORLD_H-150);

    if(!isBlocked(x,y,30)){

        terminals.push({
            x,
            y,
            used:false
        });
    }
}

/* =========================================================
   INTERACTION
   ========================================================= */

function interact(){

    let closest=null;
    let closestDistance=70;

    for(const chest of chests){

        if(chest.opened) continue;

        const d=Math.hypot(
            chest.x-player.x,
            chest.y-player.y
        );

        if(d<closestDistance){

            closestDistance=d;
            closest={
                type:"chest",
                object:chest
            };
        }
    }

    for(const terminal of terminals){

        if(terminal.used) continue;

        const d=Math.hypot(
            terminal.x-player.x,
            terminal.y-player.y
        );

        if(d<closestDistance){

            closestDistance=d;

            closest={
                type:"terminal",
                object:terminal
            };
        }
    }

    if(!closest) return;

    if(closest.type==="chest"){

        const chest=closest.object;

        chest.opened=true;

        const reward=randomInt(15,80);

        player.credits+=reward;
        player.inventory.scrap+=randomInt(1,8);

        particlesBurst(
            chest.x,
            chest.y,
            "#ffe78a",
            20
        );

        showMessage(
            "SUPPLY CACHE",
            "+"+reward+" CREDITS"
        );

        unlockAchievement("collector");

    }

    if(closest.type==="terminal"){

        const terminal=closest.object;

        terminal.used=true;

        player.inventory.cores++;
        player.credits+=100;

        showMessage(
            "SIGNAL TERMINAL",
            "DATA CORE RECOVERED"
        );

        unlockAchievement("terminal");
    }
}

/* =========================================================
   MESSAGE
   ========================================================= */

let messageTimer=0;

function showMessage(title,sub){

    messageUI.innerHTML=`
        <div class="big">${title}</div>
        <div class="small">${sub}</div>
    `;

    messageUI.style.opacity=1;
    messageTimer=2.4;
}

/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

const achievements={

    firstEcho:{
        name:"FIRST ECHO",
        desc:"Defeat your first enemy."
    },

    tenEchoes:{
        name:"TEN ECHOES",
        desc:"Defeat 10 enemies."
    },

    hunter:{
        name:"HUNTER",
        desc:"Defeat 50 enemies."
    },

    explorer:{
        name:"EXPLORER",
        desc:"Travel 5,000 meters."
    },

    survivor:{
        name:"SURVIVOR",
        desc:"Reach level 5."
    },

    arsenal:{
        name:"ARSENAL",
        desc:"Switch weapons."
    },

    collector:{
        name:"COLLECTOR",
        desc:"Open a supply cache."
    },

    terminal:{
        name:"SIGNAL TRACE",
        desc:"Activate a signal terminal."
    },

    firstSave:{
        name:"MEMORY",
        desc:"Save a run."
    },

    core:{
        name:"CORE HUNTER",
        desc:"Collect a data core."
    }

};

const unlocked=
    JSON.parse(
        localStorage.getItem("echoboundAchievements")||"{}"
    );

function unlockAchievement(id){

    if(!achievements[id]) return;
    if(unlocked[id]) return;

    unlocked[id]=true;

    localStorage.setItem(
        "echoboundAchievements",
        JSON.stringify(unlocked)
    );

    const a=achievements[id];

    const popup=document.getElementById("achievement");

    if(popup){

        document.getElementById("achievementName").textContent=
            a.name;

        popup.style.display="block";

        setTimeout(()=>{
            popup.style.display="none";
        },3000);
    }

    sound(700,.18,"sine",.035);
}

/* =========================================================
   INVENTORY
   ========================================================= */

function updateInventoryPanel(){

    const content=document.getElementById("inventoryContent");

    content.innerHTML=`

    <div class="panelGrid">

        <div class="panelCard">
            <strong>MEDKITS</strong>
            ${player.inventory.medkit}
        </div>

        <div class="panelCard">
            <strong>ENERGY CELLS</strong>
            ${player.inventory.energy}
        </div>

        <div class="panelCard">
            <strong>SCRAP</strong>
            ${player.inventory.scrap}
        </div>

        <div class="panelCard">
            <strong>DATA CORES</strong>
            ${player.inventory.cores}
        </div>

        <div class="panelCard">
            <strong>CREDITS</strong>
            ${player.credits}
        </div>

        <div class="panelCard">
            <strong>LEVEL</strong>
            ${player.level}
        </div>

    </div>

    <br>

    <div class="panelGrid">

        <div class="panelCard">
            <strong>SPEED</strong>
            Upgrade ${player.upgrades.speed}
        </div>

        <div class="panelCard">
            <strong>HEALTH</strong>
            Upgrade ${player.upgrades.health}
        </div>

        <div class="panelCard">
            <strong>ENERGY</strong>
            Upgrade ${player.upgrades.energy}
        </div>

        <div class="panelCard">
            <strong>DAMAGE</strong>
            Upgrade ${player.upgrades.damage}
        </div>

    </div>
    `;
}

function toggleInventory(){

    if(state!=="playing" && state!=="inventory")
        return;

    if(state==="inventory"){

        inventoryPanel.style.display="none";
        state="playing";

    }else{

        updateInventoryPanel();

        inventoryPanel.style.display="flex";
        state="inventory";
    }
}

/* =========================================================
   ACHIEVEMENT PANEL
   ========================================================= */

function showAchievements(){

    const content=
        document.getElementById("achievementContent");

    content.innerHTML="";

    for(const id in achievements){

        const a=achievements[id];

        const unlockedState=!!unlocked[id];

        const card=document.createElement("div");

        card.className="panelCard";

        card.innerHTML=`

        <strong>
        ${unlockedState?"✓ ":"◇ "}
        ${a.name}
        </strong>

        <span style="opacity:.65">
        ${a.desc}
        </span>

        `;

        content.appendChild(card);
    }

    achievementPanel.style.display="flex";
}

/* =========================================================
   MAP
   ========================================================= */

function drawMap(){

    const mapCanvas=document.getElementById("mapCanvas");

    if(!mapCanvas) return;

    const mw=420;
    const mh=300;

    mapCanvas.width=mw;
    mapCanvas.height=mh;

    const m=mapCanvas.getContext("2d");

    m.fillStyle="#071018";
    m.fillRect(0,0,mw,mh);

    const sx=mw/WORLD_W;
    const sy=mh/WORLD_H;

    /*
      Walls.
    */

    for(const w of walls){

        m.fillStyle="#334d5c";

        m.fillRect(
            w.x*sx,
            w.y*sy,
            w.w*sx,
            w.h*sy
        );
    }

    /*
      Chests.
    */

    for(const c of chests){

        if(!c.opened){

            m.fillStyle="#e9bd63";

            m.fillRect(
                c.x*sx-2,
                c.y*sy-2,
                4,
                4
            );
        }
    }

    /*
      Player.
    */

    m.fillStyle="#74e9ff";

    m.beginPath();

    m.arc(
        player.x*sx,
        player.y*sy,
        5,
        0,
        Math.PI*2
    );

    m.fill();

    /*
      Enemies.
    */

    m.fillStyle="#ff657c";

    for(const e of enemies){

        m.fillRect(
            e.x*sx-2,
            e.y*sy-2,
            4,
            4
        );
    }
}

function toggleMap(){

    const map=document.getElementById("map");

    if(!map) return;

    if(map.style.display==="flex"){

        map.style.display="none";
        state="playing";

    }else{

        drawMap();

        map.style.display="flex";
        state="map";
    }
}

/* =========================================================
   SAVE SYSTEM
   ========================================================= */

function saveGame(slot=1){

    const data={

        version:4,

        player:{
            x:player.x,
            y:player.y,
            hp:player.hp,
            maxHp:player.maxHp,
            energy:player.energy,
            maxEnergy:player.maxEnergy,
            level:player.level,
            xp:player.xp,
            xpNeed:player.xpNeed,
            credits:player.credits,
            kills:player.kills,
            armor:player.armor,
            weapon:player.weapon,
            ammo:player.ammo,
            distance:player.distance,
            inventory:player.inventory,
            upgrades:player.upgrades
        },

        chests:chests.map(c=>({
            x:c.x,
            y:c.y,
            opened:c.opened
        })),

        terminals:terminals.map(t=>({
            x:t.x,
            y:t.y,
            used:t.used
        })),

        savedAt:new Date().toLocaleString()
    };

    localStorage.setItem(
        "echoboundSave"+slot,
        JSON.stringify(data)
    );

    unlockAchievement("firstSave");

    showMessage(
        "RUN SAVED",
        "SLOT "+slot
    );
}

function loadGame(slot=1){

    const raw=
        localStorage.getItem(
            "echoboundSave"+slot
        );

    if(!raw){

        showMessage(
            "NO SAVE",
            "SLOT "+slot+" IS EMPTY"
        );

        return false;
    }

    try{

        const data=JSON.parse(raw);

        const p=data.player;

        player.x=p.x??900;
        player.y=p.y??900;

        player.hp=p.hp??100;
        player.maxHp=p.maxHp??100;

        player.energy=p.energy??100;
        player.maxEnergy=p.maxEnergy??100;

        player.level=p.level??1;
        player.xp=p.xp??0;
        player.xpNeed=p.xpNeed??100;

        player.credits=p.credits??0;
        player.kills=p.kills??0;

        player.armor=p.armor??0;

        player.weapon=
            clamp(
                p.weapon??0,
                0,
                weapons.length-1
            );

        player.ammo=
            p.ammo??
            weapons[player.weapon].maxAmmo;

        player.distance=p.distance??0;

        player.inventory=Object.assign(
            player.inventory,
            p.inventory||{}
        );

        player.upgrades=Object.assign(
            player.upgrades,
            p.upgrades||{}
        );

        if(Array.isArray(data.chests)){

            data.chests.forEach(saved=>{

                const c=chests.find(
                    x =>
                    Math.abs(x.x-saved.x)<1 &&
                    Math.abs(x.y-saved.y)<1
                );

                if(c) c.opened=saved.opened;
            });
        }

        if(Array.isArray(data.terminals)){

            data.terminals.forEach(saved=>{

                const t=terminals.find(
                    x =>
                    Math.abs(x.x-saved.x)<1 &&
                    Math.abs(x.y-saved.y)<1
                );

                if(t) t.used=saved.used;
            });
        }

        startGame();

        showMessage(
            "RUN RESTORED",
            "SLOT "+slot
        );

        return true;

    }catch(error){

        console.error(error);

        showMessage(
            "SAVE ERROR",
            "SAVE DATA COULD NOT BE LOADED"
        );

        return false;
    }
}

/* =========================================================
   SAVE PANEL
   ========================================================= */

function showSavePanel(){

    const slots=document.getElementById("saveSlots");

    slots.innerHTML="";

    for(let i=1;i<=3;i++){

        const raw=
            localStorage.getItem(
                "echoboundSave"+i
            );

        const div=document.createElement("div");

        div.className="saveSlot";

        if(raw){

            try{

                const data=JSON.parse(raw);

                div.innerHTML=`
                <strong>SLOT ${i}</strong><br>
                Level ${data.player.level}<br>
                Kills ${data.player.kills}<br>
                Credits ${data.player.credits}<br>
                <small>${data.savedAt||""}</small>
                `;

            }catch{

                div.innerHTML=
                    `<strong>SLOT ${i}</strong><br>Corrupt`;
            }

        }else{

            div.innerHTML=
                `<strong>SLOT ${i}</strong><br>
                 Empty — click to save`;
        }

        div.onclick=()=>{

            if(raw){
                saveGame(i);
            }else{
                saveGame(i);
            }
        };

        slots.appendChild(div);
    }

    savePanel.style.display="flex";
}

/* =========================================================
   GAME START
   ========================================================= */

function resetInput(){

    for(const k in keys)
        keys[k]=false;

    mouse.down=false;
}

function startGame(){

    audioStart();

    resetInput();

    state="playing";

    document.getElementById("menu").style.display="none";
    document.getElementById("pause").style.display="none";
    document.getElementById("map").style.display="none";

    inventoryPanel.style.display="none";
    achievementPanel.style.display="none";
    savePanel.style.display="none";
    controlsPanel.style.display="none";

    bullets.length=0;
    enemyBullets.length=0;
    particles.length=0;
    pickups.length=0;

    enemies.length=0;

    player.x=clamp(player.x,100,WORLD_W-100);
    player.y=clamp(player.y,100,WORLD_H-100);

    lastSpawnX=player.x;
    lastSpawnY=player.y;

    /*
      Direct bij starten een paar vijanden.
    */

    for(let i=0;i<8;i++)
        spawnEnemyNearPlayer(true);

    updateHUD();

    showMessage(
        "SIGNAL ONLINE",
        "ENTER THE UNKNOWN"
    );
}

function newGame(){

    player.x=900;
    player.y=900;

    player.hp=100;
    player.maxHp=100;

    player.energy=100;
    player.maxEnergy=100;

    player.level=1;
    player.xp=0;
    player.xpNeed=100;

    player.credits=0;
    player.kills=0;
    player.distance=0;

    player.armor=0;

    player.weapon=0;
    player.ammo=weapons[0].maxAmmo;

    player.inventory={
        medkit:2,
        energy:2,
        scrap:0,
        cores:0
    };

    player.upgrades={
        speed:0,
        health:0,
        energy:0,
        damage:0
    };

    for(const c of chests)
        c.opened=false;

    for(const t of terminals)
        t.used=false;

    startGame();
}

function resumeGame(){

    resetInput();

    state="playing";

    document.getElementById("pause").style.display="none";
}

/* =========================================================
   GAME OVER
   ========================================================= */

function gameOver(){

    state="gameover";

    resetInput();

    const pause=document.getElementById("pause");

    pause.style.display="flex";

    const box=pause.querySelector(".pauseBox");

    box.innerHTML=`

    <div class="pauseSmall">ECHOBOUND</div>

    <h2>SIGNAL LOST</h2>

    <p style="
      color:#9ab0bd;
      letter-spacing:2px;
      font-size:11px;
      margin-bottom:20px;
    ">
      LEVEL ${player.level}
      &nbsp; • &nbsp;
      KILLS ${player.kills}
      &nbsp; • &nbsp;
      CREDITS ${player.credits}
    </p>

    <button id="retryButton" class="menuButton main">
        RETRY
    </button>

    <button id="gameOverMenu" class="menuButton">
        MAIN MENU
    </button>

    `;

    document.getElementById("retryButton").onclick=()=>{
        box.innerHTML=`
        <div class="pauseSmall">ECHOBOUND</div>
        <h2>PAUSED</h2>
        <button id="resume" class="menuButton main">RESUME</button>
        <button id="save" class="menuButton">SAVE RUN</button>
        <button id="quit" class="menuButton">QUIT TO MENU</button>
        `;

        bindPauseButtons();

        newGame();
    };

    document.getElementById("gameOverMenu").onclick=()=>{
        returnToMenu();
    };
}

/* =========================================================
   MENU
   ========================================================= */

function returnToMenu(){

    resetInput();

    state="menu";

    document.getElementById("pause").style.display="none";
    document.getElementById("menu").style.display="flex";

    bullets.length=0;
    enemyBullets.length=0;
    enemies.length=0;

    const box=document.querySelector("#pause .pauseBox");

    if(box){

        box.innerHTML=`

        <div class="pauseSmall">ECHOBOUND</div>
        <h2>PAUSED</h2>

        <button id="resume" class="menuButton main">
            RESUME
        </button>

        <button id="save" class="menuButton">
            SAVE RUN
        </button>

        <button id="quit" class="menuButton">
            QUIT TO MENU
        </button>

        `;

        bindPauseButtons();
    }
}

/* =========================================================
   PAUSE BUTTONS
   ========================================================= */

function bindPauseButtons(){

    const resume=document.getElementById("resume");
    const save=document.getElementById("save");
    const quit=document.getElementById("quit");

    if(resume)
        resume.onclick=resumeGame;

    if(save)
        save.onclick=showSavePanel;

    if(quit)
        quit.onclick=returnToMenu;
}

bindPauseButtons();

/* =========================================================
   MENU BUTTONS
   ========================================================= */

const newGameButton=document.getElementById("newGame");
const loadGameButton=document.getElementById("loadGame");
const achievementsButton=document.getElementById("achievementsButton");
const controlsButton=document.getElementById("controlsButton");

if(newGameButton)
    newGameButton.onclick=()=>{
        newGame();
    };

if(loadGameButton)
    loadGameButton.onclick=()=>{
        showSavePanel();
    };

if(achievementsButton)
    achievementsButton.onclick=()=>{
        showAchievements();
    };

if(controlsButton)
    controlsButton.onclick=()=>{
        controlsPanel.style.display="flex";
    };

document.getElementById("closeAchievements").onclick=()=>{
    achievementPanel.style.display="none";
};

document.getElementById("closeInventory").onclick=()=>{
    inventoryPanel.style.display="none";
    state="playing";
};

document.getElementById("closeSave").onclick=()=>{
    savePanel.style.display="none";

    if(state==="save")
        state="playing";
};

document.getElementById("closeControls").onclick=()=>{
    controlsPanel.style.display="none";
};

/* =========================================================
   HUD
   ========================================================= */

function updateHUD(){

    const hpBar=document.getElementById("healthBar");
    const energyBar=document.getElementById("energyBar");

    if(hpBar){

        hpBar.style.width=
            clamp(
                player.hp/player.maxHp*100,
                0,
                100
            )+"%";
    }

    if(energyBar){

        energyBar.style.width=
            clamp(
                player.energy/player.maxEnergy*100,
                0,
                100
            )+"%";
    }

    const kills=document.getElementById("kills");

    if(kills)
        kills.textContent=
            "KILLS: "+player.kills;

    const credits=document.getElementById("credits");

    if(credits)
        credits.textContent=
            "CREDITS: "+player.credits;

    const ammo=document.getElementById("ammo");

    if(ammo){

        ammo.textContent=
            player.ammo+
            " / ∞";
    }

    const zone=document.getElementById("zone");

    if(zone)
        zone.textContent=getSectorName();

    extraHUD.innerHTML=`
        <div class="sector">${getSectorName()}</div>
        <div class="mission">
        SIGNAL DISTANCE: ${Math.floor(
            Math.hypot(
                player.x-3500,
                player.y-2600
            )
        )}m
        </div>
    `;

    worldDebug.textContent=
        "X:"+Math.floor(player.x)+
        " Y:"+Math.floor(player.y)+
        " | HOSTILES:"+enemies.length+
        " | LV:"+player.level;

    updateWeaponUI();
}

function updateWeaponUI(){

    const weapon=weapons[player.weapon];

    document.getElementById("weaponDisplay").innerHTML=`
        <div class="name">${weapon.name}</div>
        <div class="type">
        DAMAGE ${weapon.damage}
        &nbsp; • &nbsp;
        ${player.ammo}/${weapon.maxAmmo}
        </div>
    `;
}

const weaponDisplay=makeElement("weaponDisplay");

/* =========================================================
   SECTORS
   ========================================================= */

function getSectorName(){

    const x=player.x;
    const y=player.y;

    if(x<1700 && y<1500)
        return "SECTOR 01 — OUTER RING";

    if(x>=1700 && x<3300 && y<1500)
        return "SECTOR 02 — BLACK GRID";

    if(x>=3300 && y<1500)
        return "SECTOR 03 — DEAD CHANNEL";

    if(y>=1500 && y<3200)
        return "SECTOR 04 — INDUSTRIAL VEIL";

    if(y>=3200 && x<2700)
        return "SECTOR 05 — ASH DISTRICT";

    if(y>=3200 && x>=2700)
        return "SECTOR 06 — LOST CORE";

    return "UNKNOWN SECTOR";
}

/* =========================================================
   CAMERA
   ========================================================= */

function updateCamera(){

    camera.x=lerp(
        camera.x,
        player.x-W/2,
        1-Math.pow(.001,dt)
    );

    camera.y=lerp(
        camera.y,
        player.y-H/2,
        1-Math.pow(.001,dt)
    );

    camera.x=clamp(
        camera.x,
        0,
        WORLD_W-W
    );

    camera.y=clamp(
        camera.y,
        0,
        WORLD_H-H
    );
}

/* =========================================================
   WORLD DRAWING
   ========================================================= */

function drawWorld(){

    /*
      Mooie donkere vloer.
    */

    const gradient=ctx.createLinearGradient(
        0,0,W,H
    );

    gradient.addColorStop(0,"#09121a");
    gradient.addColorStop(.5,"#071016");
    gradient.addColorStop(1,"#03070b");

    ctx.fillStyle=gradient;
    ctx.fillRect(0,0,W,H);

    /*
      Floor grid.
    */

    ctx.strokeStyle="rgba(110,180,205,.055)";
    ctx.lineWidth=1;

    const grid=80;

    const startX=
        Math.floor(camera.x/grid)*grid;

    const startY=
        Math.floor(camera.y/grid)*grid;

    for(let x=startX;x<camera.x+W+grid;x+=grid){

        const sx=x-camera.x;

        ctx.beginPath();
        ctx.moveTo(sx,0);
        ctx.lineTo(sx,H);
        ctx.stroke();
    }

    for(let y=startY;y<camera.y+H+grid;y+=grid){

        const sy=y-camera.y;

        ctx.beginPath();
        ctx.moveTo(0,sy);
        ctx.lineTo(W,sy);
        ctx.stroke();
    }

    /*
      Sector patches.
    */

    drawSector(
        0,0,1700,1500,
        "rgba(40,100,125,.055)"
    );

    drawSector(
        1700,0,1600,1500,
        "rgba(100,60,125,.05)"
    );

    drawSector(
        3300,0,3700,1500,
        "rgba(100,70,45,.045)"
    );

    drawSector(
        0,3200,2700,2000,
        "rgba(30,110,80,.045)"
    );

    /*
      Props.
    */

    drawProps();

    /*
      Walls.
    */

    drawWalls();

    /*
      Chests.
    */

    drawChests();

    /*
      Terminals.
    */

    drawTerminals();

    /*
      Pickups.
    */

    drawPickups();

    /*
      Enemies.
    */

    drawEnemies();

    /*
      Bullets.
    */

    drawBullets();

    /*
      Player.
    */

    drawPlayer();

    /*
      Particles.
    */

    drawParticles();

    /*
      Lighting.
    */

    drawLighting();

    /*
      Weather.
    */

    drawWeather();
}

function drawSector(x,y,w,h,color){

    ctx.fillStyle=color;

    ctx.fillRect(
        x-camera.x,
        y-camera.y,
        w,
        h
    );
}

/* =========================================================
   WALL RENDERING
   ========================================================= */

function drawWalls(){

    for(const w of walls){

        const x=w.x-camera.x;
        const y=w.y-camera.y;

        if(
            x+w.w<0 ||
            y+w.h<0 ||
            x>W ||
            y>H
        ) continue;

        /*
          Shadow.
        */

        ctx.fillStyle="rgba(0,0,0,.55)";

        ctx.fillRect(
            x+9,
            y+10,
            w.w,
            w.h
        );

        /*
          Main material.
        */

        const g=ctx.createLinearGradient(
            x,y,
            x+w.w,y+w.h
        );

        g.addColorStop(0,"#263a46");
        g.addColorStop(.5,"#16252e");
        g.addColorStop(1,"#0c151c");

        ctx.fillStyle=g;

        ctx.fillRect(
            x,
            y,
            w.w,
            w.h
        );

        /*
          Edge.
        */

        ctx.strokeStyle="#52798a";
        ctx.lineWidth=2;

        ctx.strokeRect(
            x,
            y,
            w.w,
            w.h
        );

        /*
          Inner highlight.
        */

        ctx.strokeStyle="rgba(150,230,255,.16)";
        ctx.lineWidth=1;

        ctx.strokeRect(
            x+5,
            y+5,
            w.w-10,
            w.h-10
        );

        /*
          Tech lines.
        */

        ctx.strokeStyle="rgba(100,190,220,.08)";

        for(
            let line=x+20;
            line<x+w.w;
            line+=55
        ){

            if(w.w>w.h){

                ctx.beginPath();
                ctx.moveTo(line,y+8);
                ctx.lineTo(line,y+w.h-8);
                ctx.stroke();
            }
        }
    }
}

/* =========================================================
   PROPS
   ========================================================= */

function drawProps(){

    for(const p of props){

        const x=p.x-camera.x;
        const y=p.y-camera.y;

        if(
            x<-60 ||
            y<-60 ||
            x>W+60 ||
            y>H+60
        ) continue;

        ctx.save();

        ctx.translate(x,y);
        ctx.rotate(p.rotation);

        if(p.type==="crate"){

            ctx.fillStyle="#17242a";

            ctx.fillRect(
                -p.size,
                -p.size,
                p.size*2,
                p.size*2
            );

            ctx.strokeStyle="#49636d";
            ctx.lineWidth=2;

            ctx.strokeRect(
                -p.size,
                -p.size,
                p.size*2,
                p.size*2
            );

            ctx.strokeStyle="rgba(130,220,235,.18)";

            ctx.beginPath();
            ctx.moveTo(-p.size,-p.size);
            ctx.lineTo(p.size,p.size);
            ctx.moveTo(p.size,-p.size);
            ctx.lineTo(-p.size,p.size);
            ctx.stroke();

        }else{

            ctx.fillStyle="#172024";

            ctx.beginPath();

            ctx.moveTo(
                -p.size,
                p.size*.5
            );

            ctx.lineTo(
                -p.size*.4,
                -p.size
            );

            ctx.lineTo(
                p.size*.8,
                -p.size*.5
            );

            ctx.lineTo(
                p.size,
                p.size*.6
            );

            ctx.closePath();

            ctx.fill();

            ctx.strokeStyle="#384a4f";
            ctx.stroke();
        }

        ctx.restore();
    }
}

/* =========================================================
   CHESTS
   ========================================================= */

function drawChests(){

    for(const c of chests){

        if(
            c.x-camera.x<-40 ||
            c.y-camera.y<-40 ||
            c.x-camera.x>W+40 ||
            c.y-camera.y>H+40
        ) continue;

        const x=c.x-camera.x;
        const y=c.y-camera.y;

        ctx.save();

        ctx.translate(x,y);

        ctx.shadowBlur=14;
        ctx.shadowColor=
            c.opened?
            "transparent":
            "#e7c96b";

        ctx.fillStyle=
            c.opened?
            "#1b2429":
            "#59604c";

        ctx.fillRect(-20,-13,40,26);

        ctx.strokeStyle=
            c.opened?
            "#354047":
            "#e4ca70";

        ctx.strokeRect(-20,-13,40,26);

        if(!c.opened){

            ctx.fillStyle="#e8ce70";

            ctx.fillRect(-3,-13,6,26);
        }

        ctx.restore();
    }
}

/* =========================================================
   TERMINALS
   ========================================================= */

function drawTerminals(){

    for(const t of terminals){

        const x=t.x-camera.x;
        const y=t.y-camera.y;

        if(
            x<-50 ||
            y<-50 ||
            x>W+50 ||
            y>H+50
        ) continue;

        ctx.save();

        ctx.shadowBlur=18;
        ctx.shadowColor=
            t.used?
            "#314":
            "#65e7ff";

        ctx.fillStyle=
            t.used?
            "#1b2529":
            "#102a35";

        ctx.fillRect(
            x-12,
            y-25,
            24,
            50
        );

        ctx.strokeStyle=
            t.used?
            "#35464b":
            "#65e7ff";

        ctx.strokeRect(
            x-12,
            y-25,
            24,
            50
        );

        ctx.fillStyle=
            t.used?
            "#555":
            "#91f4ff";

        ctx.fillRect(
            x-6,
            y-15,
            12,
            5
        );

        ctx.restore();
    }
}

/* =========================================================
   PICKUPS
   ========================================================= */

function drawPickups(){

    for(const p of pickups){

        const x=p.x-camera.x;
        const y=p.y-camera.y;

        const size=
            5+
            Math.sin(p.pulse)*2;

        let color="#80eaff";

        if(p.type==="health") color="#ff738c";
        if(p.type==="energy") color="#7cffd0";
        if(p.type==="credit") color="#ffe477";
        if(p.type==="scrap") color="#bdcbd1";

        ctx.save();

        ctx.shadowBlur=18;
        ctx.shadowColor=color;

        ctx.fillStyle=color;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            size,
            0,
            Math.PI*2
        );

        ctx.fill();

        ctx.restore();
    }
}

/* =========================================================
   ENEMY RENDER
   ========================================================= */

function drawEnemies(){

    for(const e of enemies){

        const x=e.x-camera.x;
        const y=e.y-camera.y;

        if(
            x<-80 ||
            y<-80 ||
            x>W+80 ||
            y>H+80
        ) continue;

        ctx.save();

        ctx.translate(x,y);

        ctx.rotate(e.angle);

        ctx.shadowBlur=22;
        ctx.shadowColor=e.color;

        const bodyColor=
            e.hit>0?
            "#ffffff":
            e.color;

        ctx.fillStyle=bodyColor;

        /*
          Futuristische vorm.
        */

        ctx.beginPath();

        ctx.moveTo(e.r+6,0);
        ctx.lineTo(-e.r*.6,-e.r*.7);
        ctx.lineTo(-e.r,-e.r*.25);
        ctx.lineTo(-e.r,e.r*.25);
        ctx.lineTo(-e.r*.6,e.r*.7);
        ctx.closePath();

        ctx.fill();

        ctx.shadowBlur=0;

        ctx.fillStyle="#071018";

        ctx.beginPath();

        ctx.arc(
            e.r*.25,
            0,
            Math.max(3,e.r*.22),
            0,
            Math.PI*2
        );

        ctx.fill();

        /*
          Health bar.
        */

        ctx.rotate(-e.angle);

        const barW=e.r*2;

        ctx.fillStyle="rgba(0,0,0,.7)";

        ctx.fillRect(
            -barW/2,
            -e.r-10,
            barW,
            4
        );

        ctx.fillStyle=e.color;

        ctx.fillRect(
            -barW/2,
            -e.r-10,
            barW*(e.hp/e.maxHp),
            4
        );

        ctx.restore();
    }
}

/* =========================================================
   BULLET RENDER
   ========================================================= */

function drawBullets(){

    for(const b of bullets){

        const x=b.x-camera.x;
        const y=b.y-camera.y;

        ctx.save();

        ctx.shadowBlur=18;
        ctx.shadowColor=b.color;

        ctx.fillStyle=b.color;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            b.radius,
            0,
            Math.PI*2
        );

        ctx.fill();

        ctx.restore();
    }

    for(const b of enemyBullets){

        const x=b.x-camera.x;
        const y=b.y-camera.y;

        ctx.save();

        ctx.shadowBlur=15;
        ctx.shadowColor=b.color;

        ctx.fillStyle=b.color;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            b.radius,
            0,
            Math.PI*2
        );

        ctx.fill();

        ctx.restore();
    }
}

/* =========================================================
   PLAYER RENDER
   ========================================================= */

function drawPlayer(){

    const x=player.x-camera.x;
    const y=player.y-camera.y;

    const weapon=weapons[player.weapon];

    ctx.save();

    ctx.translate(x,y);

    ctx.rotate(player.angle);

    if(player.invincible>0){

        ctx.globalAlpha=
            .55+
            Math.sin(time*30)*.25;
    }

    /*
      Outer energy ring.
    */

    ctx.shadowBlur=30;
    ctx.shadowColor="#5fe7ff";

    ctx.strokeStyle="rgba(100,230,255,.55)";
    ctx.lineWidth=2;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        player.r+6+
        Math.sin(time*3)*2,
        0,
        Math.PI*2
    );

    ctx.stroke();

    /*
      Body.
    */

    ctx.fillStyle="#d9e6e8";

    ctx.beginPath();

    ctx.moveTo(25,0);
    ctx.lineTo(-14,-16);
    ctx.lineTo(-8,0);
    ctx.lineTo(-14,16);
    ctx.closePath();

    ctx.fill();

    /*
      Armor.
    */

    ctx.fillStyle="#20343d";

    ctx.beginPath();

    ctx.arc(
        -2,
        0,
        15,
        0,
        Math.PI*2
    );

    ctx.fill();

    /*
      Weapon.
    */

    ctx.fillStyle=weapon.color;

    ctx.fillRect(
        7,
        -4,
        27,
        8
    );

    ctx.restore();

    /*
      Dash ring.
    */

    if(player.dash>0){

        ctx.save();

        ctx.strokeStyle="rgba(110,230,255,.7)";
        ctx.lineWidth=3;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            35+player.dash*120,
            0,
            Math.PI*2
        );

        ctx.stroke();

        ctx.restore();
    }
}

/* =========================================================
   PARTICLE RENDER
   ========================================================= */

function drawParticles(){

    for(const p of particles){

        const x=p.x-camera.x;
        const y=p.y-camera.y;

        ctx.globalAlpha=
            clamp(
                p.life/p.maxLife,
                0,
                1
            );

        ctx.fillStyle=p.color;

        ctx.fillRect(
            x-p.size/2,
            y-p.size/2,
            p.size,
            p.size
        );
    }

    ctx.globalAlpha=1;
}

/* =========================================================
   LIGHTING
   ========================================================= */

function drawLighting(){

    /*
      Donkere overlay.
    */

    const lightCanvas=document.createElement("canvas");

    /*
      Alleen het zichtbare scherm gebruiken.
      Dit is bewust eenvoudig gehouden zodat de game
      ook op een Chromebook goed kan draaien.
    */

    ctx.save();

    ctx.fillStyle="rgba(0,3,7,.18)";
    ctx.fillRect(0,0,W,H);

    /*
      Player glow.
    */

    const px=player.x-camera.x;
    const py=player.y-camera.y;

    const gradient=ctx.createRadialGradient(
        px,
        py,
        20,
        px,
        py,
        360
    );

    gradient.addColorStop(
        0,
        "rgba(110,220,255,.13)"
    );

    gradient.addColorStop(
        .5,
        "rgba(60,130,180,.045)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    ctx.fillStyle=gradient;

    ctx.fillRect(
        px-360,
        py-360,
        720,
        720
    );

    ctx.restore();
}

/* =========================================================
   WEATHER
   ========================================================= */

const rain=[];

for(let i=0;i<180;i++){

    rain.push({
        x:random(0,W),
        y:random(0,H),
        speed:random(300,600),
        length:random(8,18)
    });
}

function drawWeather(){

    ctx.save();

    ctx.strokeStyle="rgba(120,190,220,.11)";
    ctx.lineWidth=1;

    for(const r of rain){

        r.y+=r.speed*dt;
        r.x-=r.speed*.12*dt;

        if(r.y>H+30){

            r.y=-30;
            r.x=random(0,W);
        }

        ctx.beginPath();

        ctx.moveTo(
            r.x,
            r.y
        );

        ctx.lineTo(
            r.x-5,
            r.y+r.length
        );

        ctx.stroke();
    }

    ctx.restore();
}

/* =========================================================
   CROSSHAIR
   ========================================================= */

function updateCrosshair(){

    crosshair.style.left=mouse.x+"px";
    crosshair.style.top=mouse.y+"px";
}

/* =========================================================
   MOUSE WORLD POSITION
   ========================================================= */

function updateMouseWorld(){

    mouse.worldX=
        mouse.x+
        camera.x;

    mouse.worldY=
        mouse.y+
        camera.y;

    player.angle=
        Math.atan2(
            mouse.worldY-player.y,
            mouse.worldX-player.x
        );
}

/* =========================================================
   INTERACTION UI
   ========================================================= */

function updateInteraction(){

    let near=false;

    for(const c of chests){

        if(c.opened) continue;

        if(
            Math.hypot(
                c.x-player.x,
                c.y-player.y
            )<75
        ){
            near=true;
            break;
        }
    }

    if(!near){

        for(const t of terminals){

            if(t.used) continue;

            if(
                Math.hypot(
                    t.x-player.x,
                    t.y-player.y
                )<75
            ){
                near=true;
                break;
            }
        }
    }

    if(near){

        interactUI.textContent=
            "E  INTERACT";

        interactUI.style.opacity=1;

    }else{

        interactUI.style.opacity=0;
    }
}

/* =========================================================
   GAME UPDATE
   ========================================================= */

let dt=.016;

function update(){

    if(state!=="playing")
        return;

    updateMouseWorld();

    updatePlayer();

    maintainEnemies();

    updateEnemies();

    updateBullets();

    updateEnemyBullets();

    updatePickups();

    updateParticles();

    updateCamera();

    updateInteraction();

    if(messageTimer>0){

        messageTimer-=dt;

        if(messageTimer<=0)
            messageUI.style.opacity=0;
    }

    updateHUD();
}

/* =========================================================
   DRAW
   ========================================================= */

function draw(){

    ctx.clearRect(0,0,W,H);

    const shakeX=
        camera.shake>0?
        random(-camera.shake,camera.shake):
        0;

    const shakeY=
        camera.shake>0?
        random(-camera.shake,camera.shake):
        0;

    camera.shake*=.88;

    if(camera.shake<.05)
        camera.shake=0;

    ctx.save();

    ctx.translate(
        shakeX,
        shakeY
    );

    drawWorld();

    ctx.restore();

    updateCrosshair();
}

/* =========================================================
   MAIN LOOP
   ========================================================= */

function loop(now){

    dt=
        Math.min(
            (now-lastTime)/1000,
            .033
        );

    lastTime=now;

    time+=dt;

    update();
    draw();

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

/* =========================================================
   INITIALIZATION
   ========================================================= */

function boot(){

    /*
      Startpositie camera.
    */

    camera.x=
        clamp(
            player.x-W/2,
            0,
            WORLD_W-W
        );

    camera.y=
        clamp(
            player.y-H/2,
            0,
            WORLD_H-H
        );

    updateHUD();

    updateWeaponUI();

    console.log(
        "ECHOBOUND loaded successfully."
    );
}

boot();

/* =========================================================
   SAFETY
   ========================================================= */

window.addEventListener("error",event=>{
    console.error(
        "EchoBound error:",
        event.error || event.message
    );
});

window.addEventListener(
    "unhandledrejection",
    event=>{
        console.error(
            "EchoBound promise error:",
            event.reason
        );
    }
);

})();
