// ============================================================
// ECHOBOUND — THE LOST SIGNAL
// Grote 3D versie
// ============================================================

(async () => {

    // ========================================================
    // THREE.JS
    // ========================================================

    const THREE = await import(
        "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"
    );

    // ========================================================
    // CANVAS
    // ========================================================

    const canvas = document.getElementById("game");

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    // ========================================================
    // SCENE
    // ========================================================

    const scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x071019);

    scene.fog = new THREE.FogExp2(
        0x071019,
        0.009
    );

    // ========================================================
    // CAMERA
    // ========================================================

    const camera =
        new THREE.PerspectiveCamera(
            70,
            window.innerWidth /
            window.innerHeight,
            0.1,
            1200
        );

    // ========================================================
    // LIGHTING
    // ========================================================

    const ambient =
        new THREE.HemisphereLight(
            0x9bbddd,
            0x10151b,
            1.5
        );

    scene.add(ambient);

    const sun =
        new THREE.DirectionalLight(
            0xffffff,
            2.2
        );

    sun.position.set(
        100,
        160,
        70
    );

    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    sun.shadow.camera.left = -250;
    sun.shadow.camera.right = 250;
    sun.shadow.camera.top = 250;
    sun.shadow.camera.bottom = -250;

    scene.add(sun);

    // ========================================================
    // GAME DATA
    // ========================================================

    const game = {

        running: false,

        health: 100,
        maxHealth: 100,

        energy: 100,
        maxEnergy: 100,

        armor: 0,
        maxArmor: 100,

        credits: 0,

        xp: 0,
        level: 1,

        kills: 0,

        ammo: 12,
        maxAmmo: 12,

        weapon: 0,

        mission: 0,

        weather: "clear",

        time: 0,

        bossAlive: false,

        saveSlot: 1
    };

    // ========================================================
    // WAPENS
    // ========================================================

    const weapons = [

        {
            name: "PULSE",
            damage: 1,
            fireRate: 180,
            ammo: 12,
            maxAmmo: 12,
            speed: 2.2
        },

        {
            name: "SCATTER",
            damage: 2,
            fireRate: 500,
            ammo: 6,
            maxAmmo: 6,
            speed: 1.8
        },

        {
            name: "RIFLE",
            damage: 2,
            fireRate: 100,
            ammo: 30,
            maxAmmo: 30,
            speed: 2.7
        },

        {
            name: "RAIL",
            damage: 5,
            fireRate: 900,
            ammo: 4,
            maxAmmo: 4,
            speed: 4
        },

        {
            name: "NOVA",
            damage: 10,
            fireRate: 1200,
            ammo: 2,
            maxAmmo: 2,
            speed: 3
        }
    ];

    // ========================================================
    // INVENTORY
    // ========================================================

    const inventory = {

        medkits: 2,
        energyCells: 2,
        armorPlates: 1,
        keys: 0,

        materials: 0,

        weapons: [
            true,
            false,
            false,
            false,
            false
        ]
    };

    // ========================================================
    // ACHIEVEMENTS
    // ========================================================

    const achievements = {

        firstKill: false,
        hunter: false,
        survivor: false,
        explorer: false,
        boss: false,
        rich: false,
        maxLevel: false
    };

    // ========================================================
    // PLAYER
    // ========================================================

    const player =
        new THREE.Group();

    scene.add(player);

    const playerBody =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.65,
                1.5,
                6,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x426fff,
                roughness: 0.5,
                metalness: 0.2
            })
        );

    playerBody.position.y = 1.5;

    playerBody.castShadow = true;

    player.add(playerBody);

    // ========================================================
    // PLAYER HELMET
    // ========================================================

    const helmet =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.68,
                16,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x252d39,
                metalness: 0.65,
                roughness: 0.3
            })
        );

    helmet.position.y = 2.35;

    helmet.castShadow = true;

    player.add(helmet);

    // ========================================================
    // VISOR
    // ========================================================

    const visor =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.8,
                0.28,
                0.12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x7eeeff,
                emissive: 0x153a55
            })
        );

    visor.position.set(
        0,
        2.35,
        -0.61
    );

    player.add(visor);

    // ========================================================
    // START POSITIE
    // ========================================================

    player.position.set(
        0,
        0,
        0
    );

    // ========================================================
    // CAMERA CONTROLS
    // ========================================================

    let yaw = 0;

    let pitch = -0.25;

    let lastMouseX =
        window.innerWidth / 2;

    let lastMouseY =
        window.innerHeight / 2;

    window.addEventListener(
        "mousemove",
        (event) => {

            const dx =
                event.clientX -
                lastMouseX;

            const dy =
                event.clientY -
                lastMouseY;

            lastMouseX =
                event.clientX;

            lastMouseY =
                event.clientY;

            yaw -= dx * 0.004;

            pitch -= dy * 0.003;

            pitch =
                Math.max(
                    -1.1,
                    Math.min(
                        0.8,
                        pitch
                    )
                );
        }
    );

    // ========================================================
    // CAMERA
    // ========================================================

    function updateCamera() {

        const distance = 7;

        const horizontal =
            distance *
            Math.cos(pitch);

        const x =
            player.position.x -
            Math.sin(yaw) *
            horizontal;

        const z =
            player.position.z -
            Math.cos(yaw) *
            horizontal;

        const y =
            player.position.y +
            3.3 -
            Math.sin(pitch) *
            distance;

        camera.position.lerp(
            new THREE.Vector3(
                x,
                y,
                z
            ),
            0.15
        );

        camera.lookAt(
            player.position.x,
            player.position.y + 1.3,
            player.position.z
        );
    }

    // ========================================================
    // GROUND
    // ========================================================

    const ground =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                600,
                600
            ),
            new THREE.MeshStandardMaterial({
                color: 0x18251f,
                roughness: 1
            })
        );

    ground.rotation.x =
        -Math.PI / 2;

    ground.receiveShadow = true;

    scene.add(ground);

    // ========================================================
    // ROCK
    // ========================================================

    function createRock(
        x,
        z,
        scale
    ) {

        const rock =
            new THREE.Mesh(
                new THREE.DodecahedronGeometry(
                    scale
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x343b40,
                    roughness: 1
                })
            );

        rock.position.set(
            x,
            scale * 0.5,
            z
        );

        rock.rotation.y =
            Math.random() * 5;

        rock.castShadow = true;

        rock.receiveShadow = true;

        scene.add(rock);
    }

    // ========================================================
    // TREE
    // ========================================================

    function createTree(
        x,
        z,
        scale
    ) {

        const tree =
            new THREE.Group();

        const trunk =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.35 * scale,
                    0.55 * scale,
                    5 * scale,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x49352a,
                    roughness: 1
                })
            );

        trunk.position.y =
            2.5 * scale;

        trunk.castShadow = true;

        tree.add(trunk);

        const leaves =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    2.6 * scale,
                    6 * scale,
                    9
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x153b29,
                    roughness: 1
                })
            );

        leaves.position.y =
            6 * scale;

        leaves.castShadow = true;

        tree.add(leaves);

        tree.position.set(
            x,
            0,
            z
        );

        scene.add(tree);
    }

    // ========================================================
    // WERELD GENEREREN
    // ========================================================

    for (
        let i = 0;
        i < 260;
        i++
    ) {

        const x =
            (Math.random() - 0.5) *
            520;

        const z =
            (Math.random() - 0.5) *
            520;

        if (
            Math.abs(x) < 25 &&
            Math.abs(z) < 25
        ) {
            continue;
        }

        createTree(
            x,
            z,
            0.7 +
            Math.random() *
            0.9
        );
    }

    // ========================================================
    // ROTSEN
    // ========================================================

    for (
        let i = 0;
        i < 120;
        i++
    ) {

        const x =
            (Math.random() - 0.5) *
            500;

        const z =
            (Math.random() - 0.5) *
            500;

        createRock(
            x,
            z,
            0.4 +
            Math.random() *
            1.2
        );
    }

    // ========================================================
    // GEBOUW
    // ========================================================

    function createBuilding(
        x,
        z
    ) {

        const width =
            10 +
            Math.random() * 14;

        const height =
            7 +
            Math.random() * 10;

        const depth =
            10 +
            Math.random() * 14;

        const building =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    width,
                    height,
                    depth
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x303944,
                    roughness: 0.8,
                    metalness: 0.15
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

        // Dak
        const roof =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    width + 0.5,
                    0.7,
                    depth + 0.5
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x171c22
                })
            );

        roof.position.set(
            x,
            height + 0.35,
            z
        );

        roof.castShadow = true;

        scene.add(roof);
    }

    // ========================================================
    // GEBOUWEN GENEREREN
    // ========================================================

    for (
        let i = 0;
        i < 30;
        i++
    ) {

        createBuilding(
            (Math.random() - 0.5) *
                420,

            (Math.random() - 0.5) *
                420
        );
    }

    // ========================================================
    // LICHTPALEN
    // ========================================================

    function createLamp(
        x,
        z
    ) {

        const pole =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.08,
                    0.12,
                    5,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x30343b,
                    metalness: 0.7
                })
            );

        pole.position.set(
            x,
            2.5,
            z
        );

        pole.castShadow = true;

        scene.add(pole);

        const light =
            new THREE.PointLight(
                0x72c9ff,
                8,
                18
            );

        light.position.set(
            x,
            5,
            z
        );

        scene.add(light);

        const bulb =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.18,
                    8,
                    8
                ),
                new THREE.MeshBasicMaterial({
                    color: 0x9beaff
                })
            );

        bulb.position.set(
            x,
            5,
            z
        );

        scene.add(bulb);
    }

    for (
        let i = 0;
        i < 35;
        i++
    ) {

        createLamp(
            (Math.random() - 0.5) *
                350,

            (Math.random() - 0.5) *
                350
        );
    }

    // ========================================================
    // VIJANDEN
    // ========================================================

    const enemies = [];

    const enemyTypes = {

        scout: {
            health: 3,
            speed: 0.035,
            size: 0.8,
            color: 0x9c4cff,
            damage: 5
        },

        hunter: {
            health: 6,
            speed: 0.025,
            size: 1,
            color: 0xff4f8a,
            damage: 8
        },

        brute: {
            health: 15,
            speed: 0.012,
            size: 1.7,
            color: 0xff744c,
            damage: 15
        },

        guardian: {
            health: 50,
            speed: 0.009,
            size: 2.4,
            color: 0x6d88ff,
            damage: 25
        }
    };

    // ========================================================
    // ENEMY CREATOR
    // ========================================================

    function spawnEnemy(
        typeName = "scout",
        distance = 40
    ) {

        const type =
            enemyTypes[typeName];

        const enemy =
            new THREE.Mesh(
                new THREE.IcosahedronGeometry(
                    type.size,
                    1
                ),
                new THREE.MeshStandardMaterial({
                    color: type.color,
                    emissive:
                        type.color,
                    emissiveIntensity:
                        0.15,
                    roughness: 0.45
                })
            );

        const angle =
            Math.random() *
            Math.PI * 2;

        enemy.position.set(
            player.position.x +
            Math.cos(angle) *
            distance,

            type.size,

            player.position.z +
            Math.sin(angle) *
            distance
        );

        enemy.castShadow = true;

        enemy.userData = {

            type: typeName,

            health: type.health,

            maxHealth: type.health,

            speed: type.speed,

            damage: type.damage,

            attackCooldown: 0,

            value:
                typeName === "brute"
                    ? 40
                    : typeName === "hunter"
                    ? 25
                    : 15
        };

        enemies.push(enemy);

        scene.add(enemy);
    }

    // ========================================================
    // START VIJANDEN
    // ========================================================

    for (
        let i = 0;
        i < 18;
        i++
    ) {

        spawnEnemy(
            "scout",
            45 +
            Math.random() * 45
        );
    }

    for (
        let i = 0;
        i < 7;
        i++
    ) {

        spawnEnemy(
            "hunter",
            50 +
            Math.random() * 50
        );
    }

    for (
        let i = 0;
        i < 3;
        i++
    ) {

        spawnEnemy(
            "brute",
            70 +
            Math.random() * 50
        );
    }

    // ========================================================
    // BOSS
    // ========================================================

    function spawnBoss() {

        if (game.bossAlive) {
            return;
        }

        game.bossAlive = true;

        spawnEnemy(
            "guardian",
            100
        );

        showMessage(
            "GUARDIAN DETECTED",
            "Een zware Echo nadert..."
        );
    }

    // ========================================================
    // PROJECTILES
    // ========================================================

    const bullets = [];

    let lastShot = 0;

    // ========================================================
    // MUIS SCHIETEN
    // ========================================================

    window.addEventListener(
        "mousedown",
        (event) => {

            if (
                event.button === 0 &&
                game.running
            ) {

                shoot();
            }
        }
    );

    // ========================================================
    // SCHIET FUNCTIE
    // ========================================================

    function shoot() {

        const weapon =
            weapons[game.weapon];

        const now =
            performance.now();

        if (
            now - lastShot <
            weapon.fireRate
        ) {
            return;
        }

        if (game.ammo <= 0) {

            reload();

            return;
        }

        lastShot = now;

        game.ammo--;

        // ====================================================
        // RICHTING
        // ====================================================

        const direction =
            new THREE.Vector3();

        camera.getWorldDirection(
            direction
        );

        // ====================================================
        // PULSE
        // ====================================================

        if (
            weapon.name ===
            "SCATTER"
        ) {

            for (
                let i = 0;
                i < 5;
                i++
            ) {

                createBullet(
                    direction,
                    weapon
                );
            }

        } else {

            createBullet(
                direction,
                weapon
            );
        }

        updateHUD();
    }

    // ========================================================
    // BULLET CREATOR
    // ========================================================

    function createBullet(
        direction,
        weapon
    ) {

        const bullet =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    weapon.name ===
                    "RAIL"
                        ? 0.18
                        : 0.1,
                    8,
                    8
                ),
                new THREE.MeshBasicMaterial({
                    color:
                        weapon.name ===
                        "RAIL"
                            ? 0xffffff
                            : 0x66eaff
                })
            );

        bullet.position.copy(
            camera.position
        );

        const spread =
            weapon.name ===
            "SCATTER"
                ? 0.07
                : 0;

        const velocity =
            direction.clone();

        velocity.x +=
            (Math.random() - 0.5) *
            spread;

        velocity.y +=
            (Math.random() - 0.5) *
            spread;

        velocity.z +=
            (Math.random() - 0.5) *
            spread;

        velocity.normalize();

        velocity.multiplyScalar(
            weapon.speed
        );

        bullet.userData = {

            velocity,

            damage:
                weapon.damage,

            life: 0
        };

        bullets.push(bullet);

        scene.add(bullet);
    }

    // ========================================================
    // HERLADEN
    // ========================================================

    function reload() {

        game.ammo =
            weapons[
                game.weapon
            ].maxAmmo;

        updateHUD();
    }

    window.addEventListener(
        "keydown",
        (event) => {

            if (
                event.code ===
                "KeyR"
            ) {

                reload();
            }
        }
    );

    // ========================================================
    // WAPENS WISSELEN
    // ========================================================

    window.addEventListener(
        "keydown",
        (event) => {

            const number =
                parseInt(
                    event.key
                );

            if (
                number >= 1 &&
                number <= 5
            ) {

                const index =
                    number - 1;

                if (
                    inventory.weapons[
                        index
                    ]
                ) {

                    game.weapon =
                        index;

                    game.ammo =
                        weapons[
                            index
                        ].maxAmmo;

                    updateHUD();
                }
            }
        }
    );

    // ========================================================
    // KOGELS UPDATE
    // ========================================================

    function updateBullets() {

        for (
            let i =
                bullets.length - 1;
            i >= 0;
            i--
        ) {

            const bullet =
                bullets[i];

            bullet.position.add(
                bullet.userData.velocity
            );

            bullet.userData.life++;

            let removed = false;

            // ================================================
            // HIT ENEMIES
            // ================================================

            for (
                let j =
                    enemies.length - 1;
                j >= 0;
                j--
            ) {

                const enemy =
                    enemies[j];

                const distance =
                    bullet.position.distanceTo(
                        enemy.position
                    );

                if (
                    distance <
                    enemy.geometry.parameters.radius *
                    1.5
                ) {

                    enemy.userData.health -=
                        bullet.userData.damage;

                    scene.remove(
                        bullet
                    );

                    bullets.splice(
                        i,
                        1
                    );

                    removed = true;

                    if (
                        enemy.userData.health <=
                        0
                    ) {

                        killEnemy(
                            enemy,
                            j
                        );
                    }

                    break;
                }
            }

            if (removed) {
                continue;
            }

            // ================================================
            // TE VER
            // ================================================

            if (
                bullet.userData.life >
                180
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

    // ========================================================
    // ENEMY KILL
    // ========================================================

    function killEnemy(
        enemy,
        index
    ) {

        const type =
            enemy.userData.type;

        scene.remove(
            enemy
        );

        enemies.splice(
            index,
            1
        );

        game.kills++;

        game.credits +=
            enemy.userData.value;

        game.xp +=
            type === "guardian"
                ? 250
                : type === "brute"
                ? 80
                : 30;

        inventory.materials +=
            Math.floor(
                Math.random() * 3
            ) + 1;

        if (
            !achievements.firstKill
        ) {

            achievements.firstKill =
                true;

            unlockAchievement(
                "FIRST ECHO"
            );
        }

        if (
            game.kills >= 10 &&
            !achievements.hunter
        ) {

            achievements.hunter =
                true;

            unlockAchievement(
                "ECHO HUNTER"
            );
        }

        if (
            type ===
            "guardian"
        ) {

            game.bossAlive =
                false;

            achievements.boss =
                true;

            unlockAchievement(
                "GUARDIAN FALLEN"
            );
        }

        checkLevel();

        updateHUD();
    }

    // ========================================================
    // XP / LEVEL
    // ========================================================

    function checkLevel() {

        const needed =
            game.level * 150;

        if (
            game.xp >= needed
        ) {

            game.xp -=
                needed;

            game.level++;

            game.maxHealth += 10;

            game.health =
                game.maxHealth;

            game.maxEnergy += 5;

            game.energy =
                game.maxEnergy;

            showMessage(
                "LEVEL UP",
                "Level " +
                game.level
            );

            if (
                game.level >= 10
            ) {

                achievements.maxLevel =
                    true;

                unlockAchievement(
                    "ECHO VETERAN"
                );
            }
        }
    }

    // ========================================================
    // BESTURING
    // ========================================================

    const keys = {};

    window.addEventListener(
        "keydown",
        (event) => {

            keys[event.code] =
                true;

            // ================================================
            // DASH
            // ================================================

            if (
                event.code ===
                "Space"
            ) {

                dash();
            }

            // ================================================
            // INVENTORY
            // ================================================

            if (
                event.code ===
                "KeyI"
            ) {

                togglePanel(
                    "inventoryPanel"
                );
            }

            // ================================================
            // SHOP
            // ================================================

            if (
                event.code ===
                "KeyB"
            ) {

                togglePanel(
                    "shopPanel"
                );
            }

            // ================================================
            // MISSIE
            // ================================================

            if (
                event.code ===
                "KeyJ"
            ) {

                togglePanel(
                    "missionPanel"
                );
            }
        }
    );

    window.addEventListener(
        "keyup",
        (event) => {

            keys[event.code] =
                false;
        }
    );

    // ========================================================
    // PLAYER MOVEMENT
    // ========================================================

    function updatePlayer() {

        const movement =
            new THREE.Vector3();

        if (
            keys["KeyW"]
        ) {
            movement.z -= 1;
        }

        if (
            keys["KeyS"]
        ) {
            movement.z += 1;
        }

        if (
            keys["KeyA"]
        ) {
            movement.x -= 1;
        }

        if (
            keys["KeyD"]
        ) {
            movement.x += 1;
        }

        if (
            movement.length() === 0
        ) {
            return;
        }

        movement.normalize();

        const angle =
            yaw;

        const x =
            movement.x *
                Math.cos(angle) -
            movement.z *
                Math.sin(angle);

        const z =
            movement.x *
                Math.sin(angle) +
            movement.z *
                Math.cos(angle);

        let speed =
            0.12;

        if (
            keys["ShiftLeft"] ||
            keys["ShiftRight"]
        ) {

            speed =
                0.22;

            game.energy =
                Math.max(
                    0,
                    game.energy -
                    0.12
                );

        } else {

            game.energy =
                Math.min(
                    game.maxEnergy,
                    game.energy +
                    0.04
                );
        }

        player.position.x +=
            x * speed;

        player.position.z +=
            z * speed;

        player.rotation.y =
            yaw;
    }

    // ========================================================
    // DASH
    // ========================================================

    let dashCooldown = 0;

    function dash() {

        if (
            dashCooldown > 0
        ) {
            return;
        }

        if (
            game.energy < 25
        ) {
            return;
        }

        game.energy -=
            25;

        dashCooldown =
            70;

        player.position.x +=
            Math.sin(yaw) * 6;

        player.position.z +=
            Math.cos(yaw) * 6;
    }

    // ========================================================
    // ENEMIES AI
    // ========================================================

    function updateEnemies() {

        for (
            const enemy of enemies
        ) {

            const direction =
                new THREE.Vector3();

            direction.subVectors(
                player.position,
                enemy.position
            );

            direction.y = 0;

            const distance =
                direction.length();

            // ================================================
            // BEWEGEN
            // ================================================

            if (
                distance > 3
            ) {

                direction.normalize();

                enemy.position.add(
                    direction.multiplyScalar(
                        enemy.userData.speed
                    )
                );
            }

            // ================================================
            // KI RICHTING
            // ================================================

            enemy.lookAt(
                player.position.x,
                enemy.position.y,
                player.position.z
            );

            // ================================================
            // AANVAL
            // ================================================

            if (
                distance < 3.2
            ) {

                if (
                    enemy.userData.attackCooldown <=
                    0
                ) {

                    damagePlayer(
                        enemy.userData.damage
                    );

                    enemy.userData.attackCooldown =
                        90;
                }
            }

            if (
                enemy.userData.attackCooldown >
                0
            ) {

                enemy.userData.attackCooldown--;
            }
        }
    }

    // ========================================================
    // PLAYER DAMAGE
    // ========================================================

    function damagePlayer(
        damage
    ) {

        if (
            game.armor > 0
        ) {

            const absorbed =
                Math.min(
                    game.armor,
                    damage
                );

            game.armor -=
                absorbed;

            damage -=
                absorbed;
        }

        game.health -=
            damage;

        if (
            game.health <= 0
        ) {

            game.health = 0;

            gameOver();
        }

        updateHUD();
    }

    // ========================================================
    // GAME OVER
    // ========================================================

    function gameOver() {

        game.running =
            false;

        showMessage(
            "RUN ENDED",
            "Je bent uitgeschakeld."
        );

        setTimeout(
            () => {

                player.position.set(
                    0,
                    0,
                    0
                );

                game.health =
                    game.maxHealth;

                game.energy =
                    game.maxEnergy;

                game.running =
                    true;

            },
            2500
        );
    }

    // ========================================================
    // ACHIEVEMENTS
    // ========================================================

    function unlockAchievement(
        name
    ) {

        showAchievement(
            name
        );
    }

    function showAchievement(
        name
    ) {

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

        setTimeout(
            () => {

                box.style.display =
                    "none";

            },
            3000
        );
    }

    // ========================================================
    // MISSIE
    // ========================================================

    const missions = [

        {
            title:
                "FIRST CONTACT",

            description:
                "Versla 5 Echo's.",

            target: 5
        },

        {
            title:
                "SIGNAL HUNTER",

            description:
                "Versla 15 Echo's.",

            target: 15
        },

        {
            title:
                "THE GUARDIAN",

            description:
                "Versla de Guardian.",

            target: 1
        }
    ];

    // ========================================================
    // SHOP
    // ========================================================

    function buyMedkit() {

        if (
            game.credits >= 50
        ) {

            game.credits -=
                50;

            inventory.medkits++;

            updateHUD();
        }
    }

    function buyArmor() {

        if (
            game.credits >= 100
        ) {

            game.credits -=
                100;

            game.armor =
                Math.min(
                    game.maxArmor,
                    game.armor + 50
                );

            updateHUD();
        }
    }

    // ========================================================
    // INVENTORY PANEL
    // ========================================================

    function createPanels() {

        // ================================================
        // CROSSHAIR
        // ================================================

        const crosshair =
            document.createElement(
                "div"
            );

        crosshair.id =
            "crosshair";

        crosshair.innerHTML =
            "+";

        document.body.appendChild(
            crosshair
        );

        // ================================================
        // MESSAGE
        // ================================================

        const message =
            document.createElement(
                "div"
            );

        message.id =
            "gameMessage";

        document.body.appendChild(
            message
        );

        // ================================================
        // INVENTORY
        // ================================================

        const inventoryPanel =
            document.createElement(
                "div"
            );

        inventoryPanel.id =
            "inventoryPanel";

        inventoryPanel.innerHTML = `
            <div class="panel">
                <h2>INVENTORY</h2>
                <p>Medkits: <span id="invMedkits">0</span></p>
                <p>Energy Cells: <span id="invEnergy">0</span></p>
                <p>Armor Plates: <span id="invArmor">0</span></p>
                <p>Keys: <span id="invKeys">0</span></p>
                <p>Materials: <span id="invMaterials">0</span></p>
                <button id="closeInventory">CLOSE</button>
            </div>
        `;

        document.body.appendChild(
            inventoryPanel
        );

        // ================================================
        // SHOP
        // ================================================

        const shopPanel =
            document.createElement(
                "div"
            );

        shopPanel.id =
            "shopPanel";

        shopPanel.innerHTML = `
            <div class="panel">
                <h2>SHOP</h2>
                <p>Credits: <span id="shopCredits">0</span></p>

                <button id="buyMedkit">
                    BUY MEDKIT — 50
                </button>

                <button id="buyArmor">
                    BUY ARMOR — 100
                </button>

                <button id="closeShop">
                    CLOSE
                </button>
            </div>
        `;

        document.body.appendChild(
            shopPanel
        );

        // ================================================
        // MISSIONS
        // ================================================

        const missionPanel =
            document.createElement(
                "div"
            );

        missionPanel.id =
            "missionPanel";

        missionPanel.innerHTML = `
            <div class="panel">
                <h2>MISSIONS</h2>
                <div id="missionText"></div>
                <button id="closeMission">
                    CLOSE
                </button>
            </div>
        `;

        document.body.appendChild(
            missionPanel
        );

        // ================================================
        // PANEL BUTTONS
        // ================================================

        document
            .getElementById(
                "closeInventory"
            )
            .onclick = () =>
                togglePanel(
                    "inventoryPanel"
                );

        document
            .getElementById(
                "closeShop"
            )
            .onclick = () =>
                togglePanel(
                    "shopPanel"
                );

        document
            .getElementById(
                "closeMission"
            )
            .onclick = () =>
                togglePanel(
                    "missionPanel"
                );

        document
            .getElementById(
                "buyMedkit"
            )
            .onclick =
                buyMedkit;

        document
            .getElementById(
                "buyArmor"
            )
            .onclick =
                buyArmor;
    }

    createPanels();

    // ========================================================
    // PANEL TOGGLE
    // ========================================================

    function togglePanel(
        id
    ) {

        const panel =
            document.getElementById(
                id
            );

        if (!panel) {
            return;
        }

        if (
            panel.style.display ===
            "flex"
        ) {

            panel.style.display =
                "none";

        } else {

            panel.style.display =
                "flex";

            updatePanels();
        }
    }

    // ========================================================
    // PANELS UPDATE
    // ========================================================

    function updatePanels() {

        const medkits =
            document.getElementById(
                "invMedkits"
            );

        if (medkits) {
            medkits.textContent =
                inventory.medkits;
        }

        const energy =
            document.getElementById(
                "invEnergy"
            );

        if (energy) {
            energy.textContent =
                inventory.energyCells;
        }

        const armor =
            document.getElementById(
                "invArmor"
            );

        if (armor) {
            armor.textContent =
                inventory.armorPlates;
        }

        const keysText =
            document.getElementById(
                "invKeys"
            );

        if (keysText) {
            keysText.textContent =
                inventory.keys;
        }

        const materials =
            document.getElementById(
                "invMaterials"
            );

        if (materials) {
            materials.textContent =
                inventory.materials;
        }

        const credits =
            document.getElementById(
                "shopCredits"
            );

        if (credits) {
            credits.textContent =
                game.credits;
        }

        const missionText =
            document.getElementById(
                "missionText"
            );

        if (missionText) {

            const mission =
                missions[
                    Math.min(
                        game.mission,
                        missions.length - 1
                    )
                ];

            missionText.innerHTML = `
                <h3>${mission.title}</h3>
                <p>${mission.description}</p>
                <p>Progress:
                    ${game.kills}
                    /
                    ${mission.target}
                </p>
            `;
        }
    }

    // ========================================================
    // MESSAGE
    // ========================================================

    function showMessage(
        title,
        text
    ) {

        const message =
            document.getElementById(
                "gameMessage"
            );

        if (!message) {
            return;
        }

        message.innerHTML = `
            <strong>${title}</strong>
            <br>
            ${text}
        `;

        message.style.opacity =
            "1";

        setTimeout(
            () => {

                message.style.opacity =
                    "0";

            },
            2500
        );
    }

    // ========================================================
    // HUD
    // ========================================================

    function updateHUD() {

        const health =
            document.getElementById(
                "healthBar"
            );

        if (health) {

            health.style.width =
                (
                    game.health /
                    game.maxHealth *
                    100
                ) + "%";
        }

        const energy =
            document.getElementById(
                "energyBar"
            );

        if (energy) {

            energy.style.width =
                (
                    game.energy /
                    game.maxEnergy *
                    100
                ) + "%";
        }

        const ammo =
            document.getElementById(
                "ammo"
            );

        if (ammo) {

            ammo.textContent =
                game.ammo +
                " / ∞";
        }

        const kills =
            document.getElementById(
                "kills"
            );

        if (kills) {

            kills.textContent =
                "KILLS: " +
                game.kills;
        }

        const credits =
            document.getElementById(
                "credits"
            );

        if (credits) {

            credits.textContent =
                "CREDITS: " +
                game.credits;
        }

        const objective =
            document.getElementById(
                "objective"
            );

        if (objective) {

            objective.textContent =
                missions[
                    Math.min(
                        game.mission,
                        missions.length - 1
                    )
                ].title;
        }

        const weapon =
            document.querySelector(
                ".weaponName"
            );

        if (weapon) {

            weapon.textContent =
                weapons[
                    game.weapon
                ].name;
        }

        updatePanels();
    }

    // ========================================================
    // SAVE SYSTEM
    // ========================================================

    function saveGame(
        slot
    ) {

        const data = {

            game: {
                ...game
            },

            inventory: {
                ...inventory,

                weapons:
                    [...inventory.weapons]
            },

            achievements: {
                ...achievements
            },

            position: {
                x:
                    player.position.x,

                y:
                    player.position.y,

                z:
                    player.position.z
            }
        };

        localStorage.setItem(
            "echobound_save_" +
            slot,

            JSON.stringify(
                data
            )
        );

        showMessage(
            "GAME SAVED",
            "Save slot " +
            slot
        );
    }

    // ========================================================
    // LOAD
    // ========================================================

    function loadGame(
        slot
    ) {

        const saved =
            localStorage.getItem(
                "echobound_save_" +
                slot
            );

        if (!saved) {

            showMessage(
                "NO SAVE",
                "Dit slot is leeg."
            );

            return;
        }

        const data =
            JSON.parse(
                saved
            );

        Object.assign(
            game,
            data.game
        );

        Object.assign(
            inventory,
            data.inventory
        );

        Object.assign(
            achievements,
            data.achievements
        );

        if (
            data.position
        ) {

            player.position.set(
                data.position.x,
                data.position.y,
                data.position.z
            );
        }

        game.running =
            true;

        hideMenu();

        updateHUD();
    }

    // ========================================================
    // SAVE HOTKEY
    // ========================================================

    window.addEventListener(
        "keydown",
        (event) => {

            if (
                event.code ===
                "F5"
            ) {

                event.preventDefault();

                saveGame(
                    game.saveSlot
                );
            }
        }
    );

    // ========================================================
    // MENU
    // ========================================================

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

    const newGame =
        document.getElementById(
            "newGame"
        );

    if (newGame) {

        newGame.onclick = () => {

            game.health =
                game.maxHealth;

            game.energy =
                game.maxEnergy;

            game.credits =
                0;

            game.xp =
                0;

            game.level =
                1;

            game.kills =
                0;

            player.position.set(
                0,
                0,
                0
            );

            game.running =
                true;

            hideMenu();

            updateHUD();
        };
    }

    const continueButton =
        document.getElementById(
            "loadGame"
        );

    if (continueButton) {

        continueButton.onclick =
            () => {

                loadGame(1);
            };
    }

    // ========================================================
    // ACHIEVEMENTS BUTTON
    // ========================================================

    const achievementButton =
        document.getElementById(
            "achievementsButton"
        );

    if (
        achievementButton
    ) {

        achievementButton.onclick =
            () => {

                showMessage(
                    "ACHIEVEMENTS",
                    getAchievementText()
                );
            };
    }

    function getAchievementText() {

        const list = [];

        if (
            achievements.firstKill
        ) {
            list.push(
                "✓ FIRST ECHO"
            );
        }

        if (
            achievements.hunter
        ) {
            list.push(
                "✓ ECHO HUNTER"
            );
        }

        if (
            achievements.boss
        ) {
            list.push(
                "✓ GUARDIAN FALLEN"
            );
        }

        if (
            achievements.maxLevel
        ) {
            list.push(
                "✓ ECHO VETERAN"
            );
        }

        if (
            list.length === 0
        ) {

            return "Nog geen achievements.";
        }

        return list.join(
            " • "
        );
    }

    // ========================================================
    // DYNAMISCHE CSS
    // ========================================================

    const style =
        document.createElement(
            "style"
        );

    style.textContent = `

        #crosshair {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 24px;
            font-family: Arial, sans-serif;
            z-index: 50;
            pointer-events: none;
            text-shadow:
                0 0 5px black,
                0 0 10px #66eaff;
        }

        #gameMessage {
            position: fixed;
            left: 50%;
            top: 20%;
            transform: translateX(-50%);
            padding: 18px 30px;
            background: rgba(5, 10, 18, 0.92);
            border: 1px solid rgba(100, 220, 255, 0.5);
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
            z-index: 500;
            opacity: 0;
            transition: opacity .3s;
            pointer-events: none;
            box-shadow:
                0 0 30px rgba(0,0,0,.5);
        }

        #gameMessage strong {
            font-size: 20px;
            color: #78eaff;
        }

        #inventoryPanel,
        #shopPanel,
        #missionPanel {

            display: none;

            position: fixed;

            inset: 0;

            align-items: center;

            justify-content: center;

            background:
                rgba(0,0,0,.65);

            z-index: 400;

            font-family: Arial, sans-serif;
        }

        .panel {

            min-width: 320px;

            max-width: 500px;

            padding: 30px;

            background:
                linear-gradient(
                    145deg,
                    #111b27,
                    #071018
                );

            border:
                1px solid
                rgba(100,220,255,.35);

            color: white;

            box-shadow:
                0 20px 70px
                rgba(0,0,0,.7);
        }

        .panel h2 {

            margin-top: 0;

            color: #7eeaff;

            letter-spacing: 4px;
        }

        .panel button {

            width: 100%;

            margin-top: 12px;

            padding: 12px;

            border: 1px solid
                rgba(120,220,255,.4);

            background:
                rgba(30,70,100,.5);

            color: white;

            cursor: pointer;
        }

        .panel button:hover {

            background:
                rgba(70,150,200,.7);
        }

    `;

    document.head.appendChild(
        style
    );

    // ========================================================
    // MAP / WORLD SPAWNING
    // ========================================================

    let lastSpawnX = 0;
    let lastSpawnZ = 0;

    function updateWorldSpawning() {

        const dx =
            player.position.x -
            lastSpawnX;

        const dz =
            player.position.z -
            lastSpawnZ;

        const distance =
            Math.sqrt(
                dx * dx +
                dz * dz
            );

        if (
            distance < 35
        ) {
            return;
        }

        lastSpawnX =
            player.position.x;

        lastSpawnZ =
            player.position.z;

        // Nieuwe vijanden
        for (
            let i = 0;
            i < 3;
            i++
        ) {

            const types = [
                "scout",
                "hunter",
                "brute"
            ];

            const type =
                types[
                    Math.floor(
                        Math.random() *
                        types.length
                    )
                ];

            spawnEnemy(
                type,
                55 +
                Math.random() *
                35
            );
        }

        // Boss soms
        if (
            game.kills >= 20 &&
            !game.bossAlive
        ) {

            spawnBoss();
        }
    }

    // ========================================================
    // DAG / NACHT
    // ========================================================

    function updateDayNight() {

        game.time +=
            0.0008;

        const cycle =
            Math.sin(
                game.time
            );

        sun.intensity =
            1.1 +
            Math.max(
                cycle,
                0
            ) * 1.5;

        ambient.intensity =
            0.7 +
            Math.max(
                cycle,
                0
            ) * 0.8;

        if (
            cycle < -0.2
        ) {

            scene.background =
                new THREE.Color(
                    0x02040b
                );

            scene.fog.color =
                new THREE.Color(
                    0x02040b
                );

        } else {

            scene.background =
                new THREE.Color(
                    0x071019
                );

            scene.fog.color =
                new THREE.Color(
                    0x071019
                );
        }
    }

    // ========================================================
    // RESIZE
    // ========================================================

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

    // ========================================================
    // PAUZE
    // ========================================================

    const resume =
        document.getElementById(
            "resume"
        );

    if (resume) {

        resume.onclick = () => {

            game.running =
                true;

            const pause =
                document.getElementById(
                    "pause"
                );

            if (pause) {
                pause.style.display =
                    "none";
            }
        };
    }

    // ========================================================
    // GAME LOOP
    // ========================================================

    function animate() {

        requestAnimationFrame(
            animate
        );

        if (
            game.running
        ) {

            updatePlayer();

            updateCamera();

            updateEnemies();

            updateBullets();

            updateWorldSpawning();

            updateDayNight();

            if (
                dashCooldown > 0
            ) {

                dashCooldown--;
            }
        }

        renderer.render(
            scene,
            camera
        );
    }

    // ========================================================
    // START
    // ========================================================

    updateCamera();

    updateHUD();

    animate();

})();
