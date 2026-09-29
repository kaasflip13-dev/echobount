// ECHOBOUND — TRUE 3D
// Muis bewegen = rondkijken
// Linkermuisknop = schieten
// WASD = bewegen

(async () => {
    const THREE = await import(
        "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"
    );

    // =========================
    // BASIS
    // =========================

    const canvas = document.getElementById("game");

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x071018);
    scene.fog = new THREE.FogExp2(0x071018, 0.012);

    const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    camera.position.set(0, 5, 10);

    // =========================
    // LICHT
    // =========================

    const ambient = new THREE.HemisphereLight(
        0x8bb8d9,
        0x10151c,
        1.5
    );

    scene.add(ambient);

    const sun = new THREE.DirectionalLight(
        0xffffff,
        2.2
    );

    sun.position.set(80, 120, 50);
    sun.castShadow = true;

    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;

    sun.shadow.camera.left = -150;
    sun.shadow.camera.right = 150;
    sun.shadow.camera.top = 150;
    sun.shadow.camera.bottom = -150;

    scene.add(sun);

    // =========================
    // WERELD
    // =========================

    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x18231f,
        roughness: 1
    });

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        groundMaterial
    );

    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;

    scene.add(ground);

    // =========================
    // WERELD OBJECTEN
    // =========================

    function makeTree(x, z, scale = 1) {

        const group = new THREE.Group();

        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.35 * scale,
                0.5 * scale,
                5 * scale,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x463225
            })
        );

        trunk.position.y = 2.5 * scale;
        trunk.castShadow = true;

        group.add(trunk);

        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(
                2.5 * scale,
                6 * scale,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x173b2a,
                roughness: 1
            })
        );

        leaves.position.y = 6 * scale;
        leaves.castShadow = true;

        group.add(leaves);

        group.position.set(x, 0, z);

        scene.add(group);
    }

    for (let i = 0; i < 160; i++) {

        const x = (Math.random() - 0.5) * 450;
        const z = (Math.random() - 0.5) * 450;

        if (Math.abs(x) < 25 && Math.abs(z) < 25) {
            continue;
        }

        makeTree(
            x,
            z,
            0.7 + Math.random() * 0.8
        );
    }

    // =========================
    // GEBOUWEN
    // =========================

    function makeBuilding(x, z) {

        const building = new THREE.Mesh(
            new THREE.BoxGeometry(
                10 + Math.random() * 8,
                8 + Math.random() * 8,
                10 + Math.random() * 8
            ),
            new THREE.MeshStandardMaterial({
                color: 0x303943,
                roughness: 0.8
            })
        );

        building.position.set(
            x,
            building.geometry.parameters.height / 2,
            z
        );

        building.castShadow = true;
        building.receiveShadow = true;

        scene.add(building);
    }

    for (let i = 0; i < 25; i++) {

        makeBuilding(
            (Math.random() - 0.5) * 350,
            (Math.random() - 0.5) * 350
        );
    }

    // =========================
    // SPELER
    // =========================

    const player = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(
            0.65,
            1.4,
            6,
            12
        ),
        new THREE.MeshStandardMaterial({
            color: 0x4d8cff,
            roughness: 0.55
        })
    );

    body.position.y = 1.4;
    body.castShadow = true;

    player.add(body);

    const visor = new THREE.Mesh(
        new THREE.BoxGeometry(
            0.8,
            0.35,
            0.15
        ),
        new THREE.MeshStandardMaterial({
            color: 0x8cecff,
            emissive: 0x123344
        })
    );

    visor.position.set(
        0,
        1.75,
        -0.55
    );

    player.add(visor);

    player.position.set(0, 0, 0);

    scene.add(player);

    // =========================
    // CAMERA
    // =========================

    let yaw = 0;
    let pitch = -0.25;

    const cameraDistance = 7;

    // BELANGRIJK:
    // Geen mousedown nodig.
    // De muis beweegt altijd de camera.

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    let lastMouseX = mouseX;
    let lastMouseY = mouseY;

    window.addEventListener("mousemove", (event) => {

        const dx = event.clientX - lastMouseX;
        const dy = event.clientY - lastMouseY;

        lastMouseX = event.clientX;
        lastMouseY = event.clientY;

        yaw -= dx * 0.004;
        pitch -= dy * 0.003;

        pitch = Math.max(
            -1.1,
            Math.min(0.8, pitch)
        );
    });

    // =========================
    // CAMERA POSITIE
    // =========================

    function updateCamera() {

        const horizontalDistance =
            cameraDistance * Math.cos(pitch);

        const x =
            player.position.x -
            Math.sin(yaw) *
            horizontalDistance;

        const z =
            player.position.z -
            Math.cos(yaw) *
            horizontalDistance;

        const y =
            player.position.y +
            3.2 -
            Math.sin(pitch) *
            cameraDistance;

        camera.position.lerp(
            new THREE.Vector3(x, y, z),
            0.15
        );

        camera.lookAt(
            player.position.x,
            player.position.y + 1.3,
            player.position.z
        );
    }

    // =========================
    // BESTURING
    // =========================

    const keys = {};

    window.addEventListener("keydown", (e) => {
        keys[e.code] = true;
    });

    window.addEventListener("keyup", (e) => {
        keys[e.code] = false;
    });

    // =========================
    // SCHIETEN
    // =========================

    const bullets = [];

    let canShoot = true;

    window.addEventListener("mousedown", (event) => {

        if (event.button === 0) {
            shoot();
        }
    });

    function shoot() {

        if (!canShoot) return;

        canShoot = false;

        setTimeout(() => {
            canShoot = true;
        }, 180);

        const bullet = new THREE.Mesh(
            new THREE.SphereGeometry(
                0.12,
                8,
                8
            ),
            new THREE.MeshBasicMaterial({
                color: 0x66eaff
            })
        );

        // Kogel komt vanaf speler
        bullet.position.copy(player.position);

        bullet.position.y += 1.4;

        // Richting waar camera naar kijkt
        const direction = new THREE.Vector3();

        camera.getWorldDirection(direction);

        bullet.userData.velocity =
            direction.multiplyScalar(1.8);

        bullets.push(bullet);

        scene.add(bullet);
    }

    // =========================
    // VIJANDEN
    // =========================

    const enemies = [];

    function spawnEnemy() {

        const enemy = new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.6,
                1.2,
                5,
                10
            ),
            new THREE.MeshStandardMaterial({
                color: 0xb24cff,
                emissive: 0x17001f
            })
        );

        const angle =
            Math.random() * Math.PI * 2;

        const distance =
            35 + Math.random() * 50;

        enemy.position.set(
            player.position.x +
            Math.cos(angle) * distance,

            1.2,

            player.position.z +
            Math.sin(angle) * distance
        );

        enemy.castShadow = true;

        enemy.userData.health = 3;

        enemies.push(enemy);

        scene.add(enemy);
    }

    for (let i = 0; i < 12; i++) {
        spawnEnemy();
    }

    // =========================
    // VIJANDEN BEWEGEN
    // =========================

    function updateEnemies() {

        for (const enemy of enemies) {

            const direction =
                new THREE.Vector3()
                    .subVectors(
                        player.position,
                        enemy.position
                    );

            direction.y = 0;

            const distance =
                direction.length();

            if (distance > 4) {

                direction.normalize();

                enemy.position.add(
                    direction.multiplyScalar(0.025)
                );
            }

            enemy.lookAt(
                player.position.x,
                enemy.position.y,
                player.position.z
            );
        }
    }

    // =========================
    // KOGELS
    // =========================

    function updateBullets() {

        for (
            let i = bullets.length - 1;
            i >= 0;
            i--
        ) {

            const bullet = bullets[i];

            bullet.position.add(
                bullet.userData.velocity
            );

            let hit = false;

            for (
                let j = enemies.length - 1;
                j >= 0;
                j--
            ) {

                const enemy = enemies[j];

                const distance =
                    bullet.position.distanceTo(
                        enemy.position
                    );

                if (distance < 1.2) {

                    enemy.userData.health--;

                    scene.remove(bullet);

                    bullets.splice(i, 1);

                    hit = true;

                    if (enemy.userData.health <= 0) {

                        scene.remove(enemy);

                        enemies.splice(j, 1);

                        setTimeout(
                            spawnEnemy,
                            1500
                        );
                    }

                    break;
                }
            }

            if (hit) continue;

            if (
                bullet.position.distanceTo(
                    player.position
                ) > 200
            ) {

                scene.remove(bullet);

                bullets.splice(i, 1);
            }
        }
    }

    // =========================
    // BEWEGEN
    // =========================

    const moveVector = new THREE.Vector3();

    function updatePlayer() {

        moveVector.set(0, 0, 0);

        if (keys["KeyW"]) {
            moveVector.z -= 1;
        }

        if (keys["KeyS"]) {
            moveVector.z += 1;
        }

        if (keys["KeyA"]) {
            moveVector.x -= 1;
        }

        if (keys["KeyD"]) {
            moveVector.x += 1;
        }

        if (moveVector.length() > 0) {

            moveVector.normalize();

            // Beweging volgt de camera
            const angle = yaw;

            const x =
                moveVector.x * Math.cos(angle) -
                moveVector.z * Math.sin(angle);

            const z =
                moveVector.x * Math.sin(angle) +
                moveVector.z * Math.cos(angle);

            const speed =
                keys["ShiftLeft"] ||
                keys["ShiftRight"]
                    ? 0.22
                    : 0.12;

            player.position.x += x * speed;
            player.position.z += z * speed;

            player.rotation.y = yaw;
        }
    }

    // =========================
    // HUD
    // =========================

    function updateHUD() {

        const health =
            document.getElementById("healthBar");

        const energy =
            document.getElementById("energyBar");

        if (health) {
            health.style.width = "100%";
        }

        if (energy) {
            energy.style.width = "100%";
        }

        const kills =
            document.getElementById("kills");

        if (kills) {
            kills.textContent =
                "ENEMIES: " + enemies.length;
        }

        const zone =
            document.getElementById("zone");

        if (zone) {
            zone.textContent =
                "UNKNOWN SECTOR";
        }
    }

    // =========================
    // MENU
    // =========================

    const menu =
        document.getElementById("menu");

    const hud =
        document.getElementById("hud");

    function startGame() {

        if (menu) {
            menu.style.display = "none";
        }

        if (hud) {
            hud.style.display = "block";
        }

        running = true;
    }

    const newGame =
        document.getElementById("newGame");

    if (newGame) {
        newGame.addEventListener(
            "click",
            startGame
        );
    }

    const loadGame =
        document.getElementById("loadGame");

    if (loadGame) {
        loadGame.addEventListener(
            "click",
            startGame
        );
    }

    // =========================
    // PAUSE
    // =========================

    let running = false;

    window.addEventListener("keydown", (e) => {

        if (e.code === "Escape") {

            running = !running;

            const pause =
                document.getElementById("pause");

            if (pause) {
                pause.style.display =
                    running ? "none" : "flex";
            }
        }
    });

    const resume =
        document.getElementById("resume");

    if (resume) {

        resume.addEventListener(
            "click",
            () => {

                running = true;

                const pause =
                    document.getElementById("pause");

                if (pause) {
                    pause.style.display = "none";
                }
            }
        );
    }

    // =========================
    // RESIZE
    // =========================

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

    // =========================
    // GAME LOOP
    // =========================

    function animate() {

        requestAnimationFrame(animate);

        if (running) {

            updatePlayer();
            updateCamera();
            updateEnemies();
            updateBullets();
            updateHUD();
        }

        renderer.render(
            scene,
            camera
        );
    }

    // Start camera
    updateCamera();

    animate();

})();
