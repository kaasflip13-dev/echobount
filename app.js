/* =========================================================
   ECHOBOUND — THE LOST SIGNAL
   COMPLETE 3D APP.JS
   Tank survival game
   Geen bloed / gore
   ========================================================= */

(async function () {
    "use strict";

    /* =====================================================
       THREE.JS LADEN
       ===================================================== */

    const THREE = await import(
        "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js"
    );

    /* =====================================================
       HTML BASIS
       ===================================================== */

    let canvas = document.getElementById("game");

    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.id = "game";
        document.body.appendChild(canvas);
    }

    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.body.style.background = "#071018";

    /* =====================================================
       OUDE UI VERBERGEN
       ===================================================== */

    const oldUI = [
        "menu",
        "hud",
        "pause",
        "achievement",
        "gameOver",
        "startScreen"
    ];

    oldUI.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = "none";
        }
    });

    /* =====================================================
       RENDERER
       ===================================================== */

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    /* =====================================================
       SCENE
       ===================================================== */

    const scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x071018);

    scene.fog = new THREE.Fog(
        0x071018,
        80,
        430
    );

    /* =====================================================
       CAMERA
       ===================================================== */

    const camera =
        new THREE.PerspectiveCamera(
            65,
            window.innerWidth /
            window.innerHeight,
            0.1,
            1000
        );

    camera.position.set(
        0,
        8,
        13
    );

    /* =====================================================
       LICHT
       ===================================================== */

    const ambientLight =
        new THREE.HemisphereLight(
            0x9bbcff,
            0x182018,
            1.7
        );

    scene.add(ambientLight);

    const sun =
        new THREE.DirectionalLight(
            0xffffff,
            2.2
        );

    sun.position.set(
        100,
        140,
        80
    );

    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    sun.shadow.camera.left = -180;
    sun.shadow.camera.right = 180;
    sun.shadow.camera.top = 180;
    sun.shadow.camera.bottom = -180;

    scene.add(sun);

    /* =====================================================
       GAME STATE
       ===================================================== */

    let gameRunning = false;
    let paused = false;
    let gameEnded = false;

    let score = 0;
    let credits = 0;

    let enemiesDestroyed = 0;

    let mouseLocked = false;

    let mouseX = 0;
    let mouseY = 0;

    let cameraYaw = 0;
    let cameraPitch = 0.32;

    let shootCooldown = 0;

    let reloadTimer = 0;

    let spawnTimer = 2;

    /* =====================================================
       PLAYER
       ===================================================== */

    const player = {
        health: 100,
        maxHealth: 100,

        energy: 100,
        maxEnergy: 100,

        speed: 10,
        reverseSpeed: 5,

        turnSpeed: 2.3,

        ammo: 12,
        maxAmmo: 12,

        reloadTime: 1.7,

        position: new THREE.Vector3(
            0,
            0,
            0
        ),

        rotation: 0
    };

    /* =====================================================
       INPUT
       ===================================================== */

    const keys = {};

    window.addEventListener(
        "keydown",
        event => {

            keys[event.code] = true;

            if (
                event.code === "Escape"
            ) {
                togglePause();
            }

            if (
                event.code === "KeyR"
            ) {
                reload();
            }
        }
    );

    window.addEventListener(
        "keyup",
        event => {
            keys[event.code] = false;
        }
    );

    /* =====================================================
       TANK
       ===================================================== */

    const tank =
        new THREE.Group();

    scene.add(tank);

    tank.position.copy(
        player.position
    );

    /* BODY */

    const tankBody =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3.4,
                1.15,
                4.5
            ),
            new THREE.MeshStandardMaterial({
                color: 0x405a48,
                roughness: 0.82,
                metalness: 0.25
            })
        );

    tankBody.position.y = 1.05;

    tankBody.castShadow = true;
    tankBody.receiveShadow = true;

    tank.add(tankBody);

    /* FRONT */

    const frontArmor =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                3.0,
                0.65,
                1.0
            ),
            new THREE.MeshStandardMaterial({
                color: 0x506b56,
                roughness: 0.8
            })
        );

    frontArmor.position.set(
        0,
        1.28,
        -2.05
    );

    frontArmor.castShadow = true;

    tank.add(frontArmor);

    /* TANK TURRET */

    const turret =
        new THREE.Group();

    turret.position.y = 1.85;

    tank.add(turret);

    const turretBody =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                1.25,
                1.35,
                0.75,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x31473a,
                roughness: 0.72,
                metalness: 0.3
            })
        );

    turretBody.rotation.x =
        Math.PI / 2;

    turretBody.castShadow = true;

    turret.add(turretBody);

    /* CANNON */

    const cannon =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.22,
                0.28,
                4.5,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0x1d2522,
                roughness: 0.45,
                metalness: 0.65
            })
        );

    cannon.rotation.x =
        Math.PI / 2;

    cannon.position.z = -2.25;

    cannon.castShadow = true;

    turret.add(cannon);

    /* MUZZLE */

    const muzzle =
        new THREE.Object3D();

    muzzle.position.set(
        0,
        0,
        -4.5
    );

    turret.add(muzzle);

    /* WHEELS */

    const wheels = [];

    const wheelMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x161b19,
            roughness: 0.9
        });

    for (
        let side = -1;
        side <= 1;
        side += 2
    ) {

        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const wheel =
                new THREE.Mesh(
                    new THREE.CylinderGeometry(
                        0.55,
                        0.55,
                        0.38,
                        12
                    ),
                    wheelMaterial
                );

            wheel.rotation.z =
                Math.PI / 2;

            wheel.position.set(
                side * 1.75,
                0.65,
                -1.5 + i
            );

            wheel.castShadow = true;

            tank.add(wheel);

            wheels.push(wheel);
        }
    }

    /* TRACKS */

    const trackMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x111615,
            roughness: 0.95
        });

    for (
        let side = -1;
        side <= 1;
        side += 2
    ) {

        const track =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    0.45,
                    1.05,
                    4.7
                ),
                trackMaterial
            );

        track.position.set(
            side * 1.8,
            0.85,
            0
        );

        track.castShadow = true;

        tank.add(track);
    }

    /* =====================================================
       WORLD
       ===================================================== */

    const WORLD_SIZE = 360;

    /* GROUND */

    const ground =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                WORLD_SIZE,
                WORLD_SIZE
            ),
            new THREE.MeshStandardMaterial({
                color: 0x26352c,
                roughness: 1
            })
        );

    ground.rotation.x =
        -Math.PI / 2;

    ground.receiveShadow = true;

    scene.add(ground);

    /* GRID DETAILS */

    const grid =
        new THREE.GridHelper(
            WORLD_SIZE,
            90,
            0x31483a,
            0x26372d
        );

    grid.position.y = 0.015;

    scene.add(grid);

    /* =====================================================
       OBJECT ARRAYS
       ===================================================== */

    const buildings = [];
    const trees = [];
    const rocks = [];
    const enemies = [];
    const bullets = [];
    const effects = [];

    /* =====================================================
       BUILDING
       ===================================================== */

    function createBuilding(
        x,
        z,
        width,
        depth,
        height
    ) {

        const building =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    width,
                    height,
                    depth
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x39464a,
                    roughness: 0.9
                })
            );

        building.position.set(
            x,
            height / 2,
            z
        );

        building.castShadow = true;
        building.receiveShadow = true;

        scene.add(building);

        buildings.push({
            mesh: building,
            width: width,
            depth: depth
        });
    }

    createBuilding(
        -55,
        -40,
        28,
        22,
        8
    );

    createBuilding(
        55,
        -45,
        25,
        30,
        10
    );

    createBuilding(
        -65,
        55,
        34,
        25,
        7
    );

    createBuilding(
        65,
        60,
        30,
        26,
        9
    );

    createBuilding(
        0,
        75,
        22,
        20,
        6
    );

    createBuilding(
        0,
        -75,
        30,
        20,
        7
    );

    /* =====================================================
       TREE
       ===================================================== */

    function createTree(
        x,
        z,
        scale = 1
    ) {

        const tree =
            new THREE.Group();

        const trunk =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.35 * scale,
                    0.5 * scale,
                    3 * scale,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x574536,
                    roughness: 1
                })
            );

        trunk.position.y =
            1.5 * scale;

        trunk.castShadow = true;

        tree.add(trunk);

        const leaves =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    2.3 * scale,
                    8,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x34563b,
                    roughness: 1
                })
            );

        leaves.position.y =
            4 * scale;

        leaves.castShadow = true;

        tree.add(leaves);

        tree.position.set(
            x,
            0,
            z
        );

        scene.add(tree);

        trees.push(tree);
    }

    for (
        let i = 0;
        i < 70;
        i++
    ) {

        const x =
            THREE.MathUtils.randFloatSpread(
                WORLD_SIZE - 20
            );

        const z =
            THREE.MathUtils.randFloatSpread(
                WORLD_SIZE - 20
            );

        if (
            Math.abs(x) < 25 &&
            Math.abs(z) < 25
        ) {
            continue;
        }

        createTree(
            x,
            z,
            THREE.MathUtils.randFloat(
                0.7,
                1.25
            )
        );
    }

    /* =====================================================
       ROCKS
       ===================================================== */

    for (
        let i = 0;
        i < 80;
        i++
    ) {

        const x =
            THREE.MathUtils.randFloatSpread(
                WORLD_SIZE - 20
            );

        const z =
            THREE.MathUtils.randFloatSpread(
                WORLD_SIZE - 20
            );

        const rock =
            new THREE.Mesh(
                new THREE.DodecahedronGeometry(
                    THREE.MathUtils.randFloat(
                        0.4,
                        1.4
                    )
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x58615c,
                    roughness: 1
                })
            );

        rock.position.set(
            x,
            0.7,
            z
        );

        rock.scale.y =
            THREE.MathUtils.randFloat(
                0.5,
                1
            );

        rock.castShadow = true;

        scene.add(rock);

        rocks.push(rock);
    }

    /* =====================================================
       COLLISION
       ===================================================== */

    function collidesWithBuilding(
        x,
        z,
        radius = 2
    ) {

        for (
            const building of buildings
        ) {

            const bx =
                building.mesh.position.x;

            const bz =
                building.mesh.position.z;

            const halfW =
                building.width / 2;

            const halfD =
                building.depth / 2;

            if (
                x + radius > bx - halfW &&
                x - radius < bx + halfW &&
                z + radius > bz - halfD &&
                z - radius < bz + halfD
            ) {
                return true;
            }
        }

        return false;
    }

    /* =====================================================
       ENEMY
       ===================================================== */

    function createEnemy() {

        if (
            enemies.length >= 12
        ) {
            return;
        }

        let x;
        let z;

        do {

            x =
                THREE.MathUtils.randFloatSpread(
                    300
                );

            z =
                THREE.MathUtils.randFloatSpread(
                    300
                );

        } while (
            Math.hypot(
                x - tank.position.x,
                z - tank.position.z
            ) < 55 ||
            collidesWithBuilding(
                x,
                z,
                3
            )
        );

        const enemy =
            new THREE.Group();

        /* BODY */

        const body =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    2.8,
                    1.4,
                    3.5
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x6b4f72,
                    roughness: 0.75,
                    metalness: 0.2
                })
            );

        body.position.y = 1.1;

        body.castShadow = true;

        enemy.add(body);

        /* HEAD */

        const head =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    1.05,
                    12,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x9a73a2,
                    roughness: 0.8
                })
            );

        head.position.y = 2.5;

        head.castShadow = true;

        enemy.add(head);

        /* EYE */

        const eye =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.22,
                    8,
                    8
                ),
                new THREE.MeshBasicMaterial({
                    color: 0x7df6ff
                })
            );

        eye.position.set(
            0,
            2.6,
            -0.9
        );

        enemy.add(eye);

        enemy.position.set(
            x,
            0,
            z
        );

        enemy.userData = {
            health: 60,
            maxHealth: 60,
            speed: THREE.MathUtils.randFloat(
                2.2,
                3.7
            ),
            attackTimer: THREE.MathUtils.randFloat(
                1,
                3
            )
        };

        scene.add(enemy);

        enemies.push(enemy);
    }

    /* =====================================================
       ENEMY AIM / LINE OF SIGHT
       ===================================================== */

    function hasLineOfSight(
        enemyPosition,
        playerPosition
    ) {

        const direction =
            playerPosition
                .clone()
                .sub(enemyPosition);

        const distance =
            direction.length();

        direction.normalize();

        const raycaster =
            new THREE.Raycaster(
                enemyPosition.clone()
                    .add(new THREE.Vector3(
                        0,
                        1.5,
                        0
                    )),
                direction,
                0,
                distance
            );

        const objects =
            buildings.map(
                building =>
                    building.mesh
            );

        const hits =
            raycaster.intersectObjects(
                objects,
                false
            );

        return hits.length === 0;
    }

    /* =====================================================
       BULLET
       ===================================================== */

    function shoot() {

        if (!gameRunning) {
            return;
        }

        if (paused) {
            return;
        }

        if (gameEnded) {
            return;
        }

        if (reloadTimer > 0) {
            return;
        }

        if (shootCooldown > 0) {
            return;
        }

        if (player.ammo <= 0) {

            reload();

            return;
        }

        player.ammo--;

        shootCooldown = 0.28;

        /*

           BELANGRIJK:

           We gebruiken hier NIET simpelweg
           camera.getWorldDirection().

           Daardoor schoot de tank eerder de grond in
           wanneer je van boven keek.

           We maken eerst een ray vanuit het midden
           van het scherm en zoeken waar die de grond raakt.

        */

        const raycaster =
            new THREE.Raycaster();

        const screenCenter =
            new THREE.Vector2(
                0,
                0
            );

        raycaster.setFromCamera(
            screenCenter,
            camera
        );

        const groundPlane =
            new THREE.Plane(
                new THREE.Vector3(
                    0,
                    1,
                    0
                ),
                0
            );

        const aimPoint =
            new THREE.Vector3();

        const hit =
            raycaster.ray.intersectPlane(
                groundPlane,
                aimPoint
            );

        const start =
            new THREE.Vector3();

        muzzle.getWorldPosition(
            start
        );

        let direction;

        if (hit) {

            direction =
                aimPoint
                    .clone()
                    .sub(start);

        } else {

            direction =
                new THREE.Vector3();

            camera.getWorldDirection(
                direction
            );

            direction.y = 0;
        }

        /*
           Zorg ervoor dat een schot nooit
           extreem naar beneden kan wijzen.
        */

        if (
            direction.y < -0.35
        ) {

            direction.y = -0.35;
        }

        direction.normalize();

        /* BULLET */

        const bullet =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.18,
                    10,
                    10
                ),
                new THREE.MeshBasicMaterial({
                    color: 0x70eaff
                })
            );

        bullet.position.copy(
            start
        );

        bullet.userData = {

            velocity:
                direction.clone()
                    .multiplyScalar(55),

            life: 3,

            damage: 30
        };

        scene.add(bullet);

        bullets.push(
            bullet
        );

        createMuzzleFlash();

        player.energy =
            Math.max(
                0,
                player.energy - 1
            );

        updateHUD();
    }

    /* =====================================================
       MUZZLE FLASH
       ===================================================== */

    function createMuzzleFlash() {

        const flash =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.5,
                    8,
                    8
                ),
                new THREE.MeshBasicMaterial({
                    color: 0xffd36a,
                    transparent: true,
                    opacity: 0.9
                })
            );

        muzzle.getWorldPosition(
            flash.position
        );

        scene.add(flash);

        effects.push({
            object: flash,
            life: 0.08
        });
    }

    /* =====================================================
       RELOAD
       ===================================================== */

    function reload() {

        if (
            reloadTimer > 0
        ) {
            return;
        }

        if (
            player.ammo >=
            player.maxAmmo
        ) {
            return;
        }

        reloadTimer =
            player.reloadTime;

        updateHUD();
    }

    /* =====================================================
       DAMAGE ENEMY
       ===================================================== */

    function damageEnemy(
        enemy,
        damage
    ) {

        enemy.userData.health -=
            damage;

        enemy.scale.set(
            1.08,
            1.08,
            1.08
        );

        setTimeout(() => {

            if (enemy.parent) {

                enemy.scale.set(
                    1,
                    1,
                    1
                );
            }

        }, 80);

        if (
            enemy.userData.health <= 0
        ) {

            destroyEnemy(
                enemy
            );
        }
    }

    /* =====================================================
       DESTROY ENEMY
       ===================================================== */

    function destroyEnemy(
        enemy
    ) {

        const index =
            enemies.indexOf(
                enemy
            );

        if (
            index !== -1
        ) {

            enemies.splice(
                index,
                1
            );
        }

        scene.remove(
            enemy
        );

        score += 100;

        credits += 25;

        enemiesDestroyed++;

        updateHUD();
    }

    /* =====================================================
       UPDATE BULLETS
       ===================================================== */

    function updateBullets(
        delta
    ) {

        for (
            let i = bullets.length - 1;
            i >= 0;
            i--
        ) {

            const bullet =
                bullets[i];

            bullet.position.add(
                bullet.userData.velocity
                    .clone()
                    .multiplyScalar(
                        delta
                    )
            );

            bullet.userData.life -=
                delta;

            let removeBullet =
                false;

            /* BUILDING HIT */

            for (
                const building
                of buildings
            ) {

                const box =
                    new THREE.Box3()
                        .setFromObject(
                            building.mesh
                        );

                if (
                    box.containsPoint(
                        bullet.position
                    )
                ) {

                    removeBullet =
                        true;

                    break;
                }
            }

            /* ENEMY HIT */

            if (
                !removeBullet
            ) {

                for (
                    const enemy
                    of enemies
                ) {

                    const distance =
                        bullet.position.distanceTo(
                            enemy.position
                        );

                    if (
                        distance < 2.5
                    ) {

                        damageEnemy(
                            enemy,
                            bullet.userData.damage
                        );

                        removeBullet =
                            true;

                        break;
                    }
                }
            }

            if (
                bullet.userData.life <= 0
            ) {

                removeBullet =
                    true;
            }

            if (
                Math.abs(
                    bullet.position.x
                ) > 220 ||
                Math.abs(
                    bullet.position.z
                ) > 220
            ) {

                removeBullet =
                    true;
            }

            if (
                removeBullet
            ) {

                scene.remove(
                    bullet
                );

                bullets.splice(
                    i,
                    1
                );
            }
        }
    }

    /* =====================================================
       UPDATE ENEMIES
       ===================================================== */

    function updateEnemies(
        delta
    ) {

        for (
            const enemy
            of enemies
        ) {

            const toPlayer =
                tank.position
                    .clone()
                    .sub(
                        enemy.position
                    );

            const distance =
                toPlayer.length();

            if (
                distance > 4
            ) {

                toPlayer.normalize();

                const nextX =
                    enemy.position.x +
                    toPlayer.x *
                    enemy.userData.speed *
                    delta;

                const nextZ =
                    enemy.position.z +
                    toPlayer.z *
                    enemy.userData.speed *
                    delta;

                if (
                    !collidesWithBuilding(
                        nextX,
                        nextZ,
                        1.6
                    )
                ) {

                    enemy.position.x =
                        nextX;

                    enemy.position.z =
                        nextZ;
                }
            }

            enemy.lookAt(
                tank.position.x,
                enemy.position.y,
                tank.position.z
            );

            enemy.userData.attackTimer -=
                delta;

            if (
                enemy.userData.attackTimer <= 0
            ) {

                enemy.userData.attackTimer =
                    2.5;

                if (
                    distance < 35 &&
                    hasLineOfSight(
                        enemy.position,
                        tank.position
                    )
                ) {

                    player.health -=
                        7;

                    player.health =
                        Math.max(
                            0,
                            player.health
                        );

                    updateHUD();

                    if (
                        player.health <= 0
                    ) {

                        endGame();
                    }
                }
            }
        }
    }

    /* =====================================================
       TANK MOVEMENT
       ===================================================== */

    function updateTank(
        delta
    ) {

        if (
            !gameRunning ||
            paused ||
            gameEnded
        ) {
            return;
        }

        let move =
            0;

        if (
            keys["KeyW"] ||
            keys["ArrowUp"]
        ) {

            move = 1;
        }

        if (
            keys["KeyS"] ||
            keys["ArrowDown"]
        ) {

            move = -1;
        }

        let turn =
            0;

        if (
            keys["KeyA"] ||
            keys["ArrowLeft"]
        ) {

            turn = 1;
        }

        if (
            keys["KeyD"] ||
            keys["ArrowRight"]
        ) {

            turn = -1;
        }

        const currentSpeed =
            move >= 0
                ? player.speed
                : player.reverseSpeed;

        if (
            move !== 0
        ) {

            tank.rotation.y +=
                turn *
                player.turnSpeed *
                delta;

            const direction =
                new THREE.Vector3(
                    0,
                    0,
                    -1
                );

            direction.applyQuaternion(
                tank.quaternion
            );

            const nextPosition =
                tank.position
                    .clone()
                    .add(
                        direction.multiplyScalar(
                            move *
                            currentSpeed *
                            delta
                        )
                    );

            if (
                Math.abs(
                    nextPosition.x
                ) < WORLD_SIZE / 2 - 5 &&
                Math.abs(
                    nextPosition.z
                ) < WORLD_SIZE / 2 - 5 &&
                !collidesWithBuilding(
                    nextPosition.x,
                    nextPosition.z,
                    2.4
                )
            ) {

                tank.position.copy(
                    nextPosition
                );
            }
        }

        /*
           Als je alleen A/D gebruikt,
           draait de tank op zijn plek.
        */

        if (
            move === 0 &&
            turn !== 0
        ) {

            tank.rotation.y +=
                turn *
                player.turnSpeed *
                delta;
        }

        player.position.copy(
            tank.position
        );

        /* WHEELS */

        for (
            const wheel of wheels
        ) {

            if (
                move !== 0
            ) {

                wheel.rotation.x +=
                    move *
                    delta *
                    8;
            }
        }
    }

    /* =====================================================
       TURRET RICHTING
       ===================================================== */

    function updateTurret() {

        if (
            !gameRunning ||
            paused
        ) {
            return;
        }

        /*
           De turret kijkt naar de richting
           waar de camera heen kijkt.

           Alleen de horizontale richting
           wordt gebruikt voor de turret.
        */

        const cameraDirection =
            new THREE.Vector3();

        camera.getWorldDirection(
            cameraDirection
        );

        cameraDirection.y = 0;

        if (
            cameraDirection.lengthSq()
            < 0.001
        ) {
            return;
        }

        cameraDirection.normalize();

        const targetAngle =
            Math.atan2(
                -cameraDirection.x,
                -cameraDirection.z
            );

        let angle =
            targetAngle -
            tank.rotation.y;

        while (
            angle > Math.PI
        ) {
            angle -=
                Math.PI * 2;
        }

        while (
            angle < -Math.PI
        ) {
            angle +=
                Math.PI * 2;
        }

        turret.rotation.y =
            angle;
    }

    /* =====================================================
       CAMERA
       ===================================================== */

    function updateCamera(
        delta
    ) {

        const distance = 13;

        const height = 7;

        const offset =
            new THREE.Vector3(
                0,
                height,
                distance
            );

        const rotation =
            new THREE.Euler(
                cameraPitch,
                cameraYaw,
                0,
                "YXZ"
            );

        offset.applyEuler(
            rotation
        );

        const desiredPosition =
            tank.position
                .clone()
                .add(offset);

        camera.position.lerp(
            desiredPosition,
            1 -
            Math.pow(
                0.001,
                delta
            )
        );

        const target =
            tank.position
                .clone()
                .add(
                    new THREE.Vector3(
                        0,
                        1.3,
                        0
                    )
                );

        camera.lookAt(
            target
        );
    }

    /* =====================================================
       MOUSE CAMERA
       ===================================================== */

    window.addEventListener(
        "mousemove",
        event => {

            if (
                !mouseLocked
            ) {
                return;
            }

            cameraYaw -=
                event.movementX *
                0.0025;

            cameraPitch -=
                event.movementY *
                0.002;

            cameraPitch =
                THREE.MathUtils.clamp(
                    cameraPitch,
                    -0.15,
                    0.9
                );
        }
    );

    canvas.addEventListener(
        "click",
        () => {

            if (
                !gameRunning
            ) {
                return;
            }

            if (
                !mouseLocked
            ) {

                canvas.requestPointerLock();

                return;
            }

            shoot();
        }
    );

    document.addEventListener(
        "pointerlockchange",
        () => {

            mouseLocked =
                document.pointerLockElement
                === canvas;
        }
    );

    /* =====================================================
       HUD
       ===================================================== */

    const ui =
        document.createElement(
            "div"
        );

    ui.style.position =
        "fixed";

    ui.style.left = "0";
    ui.style.top = "0";
    ui.style.width = "100%";
    ui.style.height = "100%";

    ui.style.pointerEvents =
        "none";

    ui.style.fontFamily =
        "Arial, sans-serif";

    document.body.appendChild(
        ui
    );

    /* CROSSHAIR */

    const crosshair =
        document.createElement(
            "div"
        );

    crosshair.innerHTML =
        "+";

    crosshair.style.position =
        "absolute";

    crosshair.style.left =
        "50%";

    crosshair.style.top =
        "50%";

    crosshair.style.transform =
        "translate(-50%, -50%)";

    crosshair.style.color =
        "#ffffff";

    crosshair.style.fontSize =
        "32px";

    crosshair.style.fontWeight =
        "bold";

    crosshair.style.textShadow =
        "0 0 8px #000";

    ui.appendChild(
        crosshair
    );

    /* HUD */

    const hud =
        document.createElement(
            "div"
        );

    hud.style.position =
        "absolute";

    hud.style.left =
        "20px";

    hud.style.top =
        "20px";

    hud.style.background =
        "rgba(5,10,14,0.82)";

    hud.style.border =
        "1px solid #50706b";

    hud.style.borderRadius =
        "12px";

    hud.style.padding =
        "15px";

    hud.style.color =
        "white";

    hud.style.minWidth =
        "210px";

    hud.style.pointerEvents =
        "none";

    ui.appendChild(
        hud
    );

    const healthText =
        document.createElement(
            "div"
        );

    const energyText =
        document.createElement(
            "div"
        );

    const ammoText =
        document.createElement(
            "div"
        );

    const scoreText =
        document.createElement(
            "div"
        );

    const enemyText =
        document.createElement(
            "div"
        );

    const reloadText =
        document.createElement(
            "div"
        );

    hud.appendChild(
        healthText
    );

    hud.appendChild(
        energyText
    );

    hud.appendChild(
        ammoText
    );

    hud.appendChild(
        scoreText
    );

    hud.appendChild(
        enemyText
    );

    hud.appendChild(
        reloadText
    );

    /* =====================================================
       START SCREEN
       ===================================================== */

    const startScreen =
        document.createElement(
            "div"
        );

    startScreen.style.position =
        "fixed";

    startScreen.style.inset =
        "0";

    startScreen.style.display =
        "flex";

    startScreen.style.flexDirection =
        "column";

    startScreen.style.alignItems =
        "center";

    startScreen.style.justifyContent =
        "center";

    startScreen.style.background =
        "radial-gradient(circle, #1b3438, #060b0f)";

    startScreen.style.color =
        "white";

    startScreen.style.zIndex =
        "20";

    startScreen.style.fontFamily =
        "Arial, sans-serif";

    document.body.appendChild(
        startScreen
    );

    const title =
        document.createElement(
            "h1"
        );

    title.textContent =
        "ECHOBOUND";

    title.style.fontSize =
        "64px";

    title.style.letterSpacing =
        "10px";

    title.style.margin =
        "0 0 5px";

    startScreen.appendChild(
        title
    );

    const subtitle =
        document.createElement(
            "p"
        );

    subtitle.textContent =
        "THE LOST SIGNAL";

    subtitle.style.letterSpacing =
        "5px";

    subtitle.style.opacity =
        "0.7";

    startScreen.appendChild(
        subtitle
    );

    const startButton =
        document.createElement(
            "button"
        );

    startButton.textContent =
        "START GAME";

    startButton.style.marginTop =
        "30px";

    startButton.style.padding =
        "16px 45px";

    startButton.style.fontSize =
        "18px";

    startButton.style.fontWeight =
        "bold";

    startButton.style.color =
        "white";

    startButton.style.background =
        "#285b60";

    startButton.style.border =
        "1px solid #6bd5d0";

    startButton.style.borderRadius =
        "8px";

    startButton.style.cursor =
        "pointer";

    startScreen.appendChild(
        startButton
    );

    const controls =
        document.createElement(
            "p"
        );

    controls.innerHTML =
        "WASD = rijden<br>" +
        "Muis = camera<br>" +
        "Klik = schieten<br>" +
        "R = herladen<br>" +
        "ESC = pauze";

    controls.style.textAlign =
        "center";

    controls.style.lineHeight =
        "1.8";

    controls.style.opacity =
        "0.65";

    controls.style.marginTop =
        "30px";

    startScreen.appendChild(
        controls
    );

    /* =====================================================
       PAUSE SCREEN
       ===================================================== */

    const pauseScreen =
        document.createElement(
            "div"
        );

    pauseScreen.style.position =
        "fixed";

    pauseScreen.style.inset =
        "0";

    pauseScreen.style.display =
        "none";

    pauseScreen.style.alignItems =
        "center";

    pauseScreen.style.justifyContent =
        "center";

    pauseScreen.style.flexDirection =
        "column";

    pauseScreen.style.background =
        "rgba(0,0,0,0.72)";

    pauseScreen.style.color =
        "white";

    pauseScreen.style.zIndex =
        "15";

    document.body.appendChild(
        pauseScreen
    );

    const pauseTitle =
        document.createElement(
            "h1"
        );

    pauseTitle.textContent =
        "PAUSED";

    pauseScreen.appendChild(
        pauseTitle
    );

    const continueButton =
        document.createElement(
            "button"
        );

    continueButton.textContent =
        "CONTINUE";

    continueButton.style.padding =
        "14px 35px";

    continueButton.style.cursor =
        "pointer";

    pauseScreen.appendChild(
        continueButton
    );

    continueButton.onclick =
        () => {

            paused = false;

            pauseScreen.style.display =
                "none";

            updateHUD();
        };

    /* =====================================================
       GAME OVER
       ===================================================== */

    const gameOverScreen =
        document.createElement(
            "div"
        );

    gameOverScreen.style.position =
        "fixed";

    gameOverScreen.style.inset =
        "0";

    gameOverScreen.style.display =
        "none";

    gameOverScreen.style.alignItems =
        "center";

    gameOverScreen.style.justifyContent =
        "center";

    gameOverScreen.style.flexDirection =
        "column";

    gameOverScreen.style.background =
        "rgba(5,7,9,0.9)";

    gameOverScreen.style.color =
        "white";

    gameOverScreen.style.zIndex =
        "30";

    document.body.appendChild(
        gameOverScreen
    );

    const gameOverTitle =
        document.createElement(
            "h1"
        );

    gameOverTitle.textContent =
        "SIGNAL LOST";

    gameOverScreen.appendChild(
        gameOverTitle
    );

    const finalScore =
        document.createElement(
            "p"
        );

    gameOverScreen.appendChild(
        finalScore
    );

    const restartButton =
        document.createElement(
            "button"
        );

    restartButton.textContent =
        "NEW RUN";

    restartButton.style.padding =
        "15px 40px";

    restartButton.style.cursor =
        "pointer";

    gameOverScreen.appendChild(
        restartButton
    );

    /* =====================================================
       START GAME
       ===================================================== */

    startButton.onclick =
        () => {

            gameRunning = true;

            paused = false;

            gameEnded = false;

            startScreen.style.display =
                "none";

            tank.position.set(
                0,
                0,
                0
            );

            player.health =
                player.maxHealth;

            player.energy =
                player.maxEnergy;

            player.ammo =
                player.maxAmmo;

            score = 0;

            credits = 0;

            enemiesDestroyed = 0;

            cameraYaw = 0;

            cameraPitch = 0.32;

            for (
                const enemy of enemies
            ) {

                scene.remove(
                    enemy
                );
            }

            enemies.length = 0;

            for (
                let i = 0;
                i < 4;
                i++
            ) {

                createEnemy();
            }

            updateHUD();
        };

    /* =====================================================
       RESTART
       ===================================================== */

    restartButton.onclick =
        () => {

            gameOverScreen.style.display =
                "none";

            gameRunning = true;

            paused = false;

            gameEnded = false;

            tank.position.set(
                0,
                0,
                0
            );

            player.health =
                player.maxHealth;

            player.energy =
                player.maxEnergy;

            player.ammo =
                player.maxAmmo;

            reloadTimer = 0;

            score = 0;

            credits = 0;

            enemiesDestroyed = 0;

            for (
                const enemy of enemies
            ) {

                scene.remove(
                    enemy
                );
            }

            enemies.length = 0;

            for (
                let i = 0;
                i < 4;
                i++
            ) {

                createEnemy();
            }

            updateHUD();
        };

    /* =====================================================
       PAUSE
       ===================================================== */

    function togglePause() {

        if (
            !gameRunning ||
            gameEnded
        ) {
            return;
        }

        paused =
            !paused;

        if (
            paused
        ) {

            pauseScreen.style.display =
                "flex";

        } else {

            pauseScreen.style.display =
                "none";
        }
    }

    /* =====================================================
       GAME OVER
       ===================================================== */

    function endGame() {

        if (
            gameEnded
        ) {
            return;
        }

        gameEnded = true;

        gameRunning = false;

        paused = false;

        finalScore.textContent =
            "Score: " +
            score +
            "   |   Vijanden: " +
            enemiesDestroyed;

        gameOverScreen.style.display =
            "flex";
    }

    /* =====================================================
       HUD UPDATE
       ===================================================== */

    function updateHUD() {

        healthText.innerHTML =
            "❤️ Health: " +
            Math.ceil(
                player.health
            ) +
            " / " +
            player.maxHealth;

        energyText.innerHTML =
            "⚡ Energy: " +
            Math.ceil(
                player.energy
            ) +
            " / " +
            player.maxEnergy;

        ammoText.innerHTML =
            "🔫 Ammo: " +
            player.ammo +
            " / " +
            player.maxAmmo;

        scoreText.innerHTML =
            "⭐ Score: " +
            score +
            " | Credits: " +
            credits;

        enemyText.innerHTML =
            "👾 Enemies: " +
            enemies.length;

        if (
            reloadTimer > 0
        ) {

            reloadText.innerHTML =
                "RELOADING... " +
                reloadTimer.toFixed(1) +
                "s";

        } else {

            reloadText.innerHTML =
                "";
        }
    }

    /* =====================================================
       RESIZE
       ===================================================== */

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

    /* =====================================================
       MAIN LOOP
       ===================================================== */

    const clock =
        new THREE.Clock();

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
            gameRunning &&
            !paused &&
            !gameEnded
        ) {

            /* SHOOT COOLDOWN */

            if (
                shootCooldown > 0
            ) {

                shootCooldown -=
                    delta;
            }

            /* RELOAD */

            if (
                reloadTimer > 0
            ) {

                reloadTimer -=
                    delta;

                if (
                    reloadTimer <= 0
                ) {

                    reloadTimer = 0;

                    player.ammo =
                        player.maxAmmo;
                }
            }

            /* ENERGY */

            player.energy =
                Math.min(
                    player.maxEnergy,
                    player.energy +
                    delta * 2
                );

            updateTank(
                delta
            );

            updateTurret();

            updateCamera(
                delta
            );

            updateBullets(
                delta
            );

            updateEnemies(
                delta
            );

            /* SPAWN */

            spawnTimer -=
                delta;

            if (
                spawnTimer <= 0
            ) {

                spawnTimer = 4;

                createEnemy();
            }

            /* MUZZLE EFFECTS */

            for (
                let i = effects.length - 1;
                i >= 0;
                i--
            ) {

                const effect =
                    effects[i];

                effect.life -=
                    delta;

                effect.object.scale.multiplyScalar(
                    1 +
                    delta * 10
                );

                if (
                    effect.life <= 0
                ) {

                    scene.remove(
                        effect.object
                    );

                    effects.splice(
                        i,
                        1
                    );
                }
            }

            updateHUD();
        }

        renderer.render(
            scene,
            camera
        );
    }

    /* =====================================================
       BEGIN
       ===================================================== */

    updateCamera(
        0.016
    );

    updateHUD();

    animate();

})();
