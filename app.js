// ============================================================
// ECHOBOUND - THE LOST SIGNAL
// Nieuwe stabiele 3D versie
// ============================================================

(async function () {

    // --------------------------------------------------------
    // THREE.JS LADEN
    // --------------------------------------------------------

    let THREE;

    try {

        THREE = await import(
            "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"
        );

    } catch (error) {

        document.body.innerHTML = `
            <div style="
                color:white;
                background:#070b12;
                min-height:100vh;
                display:flex;
                align-items:center;
                justify-content:center;
                font-family:Arial;
                text-align:center;
                padding:30px;
            ">
                <div>
                    <h1>EchoBound kan niet starten</h1>
                    <p>Three.js kon niet worden geladen.</p>
                    <p>Controleer je internetverbinding en ververs de pagina.</p>
                </div>
            </div>
        `;

        console.error(error);
        return;
    }

    // --------------------------------------------------------
    // CANVAS
    // --------------------------------------------------------

    let canvas =
        document.getElementById("game");

    if (!canvas) {

        canvas =
            document.createElement("canvas");

        canvas.id = "game";

        document.body.prepend(canvas);
    }

    // --------------------------------------------------------
    // RENDERER
    // --------------------------------------------------------

    const renderer =
        new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );

    renderer.shadowMap.enabled = true;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    // --------------------------------------------------------
    // SCENE
    // --------------------------------------------------------

    const scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(0x08111b);

    scene.fog =
        new THREE.Fog(
            0x08111b,
            40,
            250
        );

    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------

    const camera =
        new THREE.PerspectiveCamera(
            70,
            window.innerWidth /
            window.innerHeight,
            0.1,
            500
        );

    // --------------------------------------------------------
    // LIGHT
    // --------------------------------------------------------

    const ambient =
        new THREE.HemisphereLight(
            0x9ccfff,
            0x182015,
            1.8
        );

    scene.add(ambient);

    const sun =
        new THREE.DirectionalLight(
            0xffffff,
            2
        );

    sun.position.set(
        50,
        100,
        40
    );

    sun.castShadow = true;

    sun.shadow.mapSize.width =
        1024;

    sun.shadow.mapSize.height =
        1024;

    scene.add(sun);

    // --------------------------------------------------------
    // GROUND
    // --------------------------------------------------------

    const ground =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                400,
                400
            ),
            new THREE.MeshStandardMaterial({
                color: 0x26352a,
                roughness: 1
            })
        );

    ground.rotation.x =
        -Math.PI / 2;

    ground.receiveShadow = true;

    scene.add(ground);

    // --------------------------------------------------------
    // PLAYER
    // --------------------------------------------------------

    const player =
        new THREE.Group();

    player.position.set(
        0,
        0,
        0
    );

    scene.add(player);

    // lichaam

    const body =
        new THREE.Mesh(
            new THREE.CapsuleGeometry(
                0.65,
                1.3,
                6,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x3675d6,
                roughness: 0.5,
                metalness: 0.2
            })
        );

    body.position.y =
        1.4;

    body.castShadow = true;

    player.add(body);

    // hoofd

    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.65,
                16,
                12
            ),
            new THREE.MeshStandardMaterial({
                color: 0x252c36,
                roughness: 0.4,
                metalness: 0.5
            })
        );

    head.position.y =
        2.35;

    head.castShadow = true;

    player.add(head);

    // visor

    const visor =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.8,
                0.3,
                0.15
            ),
            new THREE.MeshStandardMaterial({
                color: 0x5eeaff,
                emissive: 0x164455,
                emissiveIntensity: 1
            })
        );

    visor.position.set(
        0,
        2.35,
        -0.6
    );

    player.add(visor);

    // --------------------------------------------------------
    // CAMERA CONTROLE
    // --------------------------------------------------------

    let yaw = 0;

    let pitch = -0.25;

    let previousMouseX =
        window.innerWidth / 2;

    let previousMouseY =
        window.innerHeight / 2;

    window.addEventListener(
        "mousemove",
        function (event) {

            const dx =
                event.clientX -
                previousMouseX;

            const dy =
                event.clientY -
                previousMouseY;

            previousMouseX =
                event.clientX;

            previousMouseY =
                event.clientY;

            yaw -=
                dx * 0.004;

            pitch -=
                dy * 0.003;

            pitch =
                Math.max(
                    -1,
                    Math.min(
                        0.6,
                        pitch
                    )
                );
        }
    );

    // --------------------------------------------------------
    // CAMERA UPDATE
    // --------------------------------------------------------

    function updateCamera() {

        const distance = 7;

        const horizontal =
            Math.cos(pitch) *
            distance;

        const cameraX =
            player.position.x -
            Math.sin(yaw) *
            horizontal;

        const cameraZ =
            player.position.z -
            Math.cos(yaw) *
            horizontal;

        const cameraY =
            player.position.y +
            3 -
            Math.sin(pitch) *
            distance;

        camera.position.lerp(
            new THREE.Vector3(
                cameraX,
                cameraY,
                cameraZ
            ),
            0.15
        );

        camera.lookAt(
            player.position.x,
            player.position.y + 1.4,
            player.position.z
        );
    }

    // --------------------------------------------------------
    // TREES
    // --------------------------------------------------------

    function createTree(
        x,
        z
    ) {

        const tree =
            new THREE.Group();

        const trunk =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    0.3,
                    0.45,
                    4,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x493426
                })
            );

        trunk.position.y = 2;

        trunk.castShadow = true;

        tree.add(trunk);

        const leaves =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    2.3,
                    5,
                    8
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x17442d
                })
            );

        leaves.position.y = 5;

        leaves.castShadow = true;

        tree.add(leaves);

        tree.position.set(
            x,
            0,
            z
        );

        scene.add(tree);
    }

    // bomen maken

    for (
        let i = 0;
        i < 120;
        i++
    ) {

        const x =
            (Math.random() - 0.5) *
            300;

        const z =
            (Math.random() - 0.5) *
            300;

        if (
            Math.abs(x) < 15 &&
            Math.abs(z) < 15
        ) {
            continue;
        }

        createTree(
            x,
            z
        );
    }

    // --------------------------------------------------------
    // ROCKS
    // --------------------------------------------------------

    function createRock(
        x,
        z
    ) {

        const size =
            0.5 +
            Math.random() *
            1.3;

        const rock =
            new THREE.Mesh(
                new THREE.DodecahedronGeometry(
                    size,
                    0
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x444a4d,
                    roughness: 1
                })
            );

        rock.position.set(
            x,
            size * 0.6,
            z
        );

        rock.rotation.y =
            Math.random() * 6;

        rock.castShadow = true;

        scene.add(rock);
    }

    for (
        let i = 0;
        i < 80;
        i++
    ) {

        createRock(
            (Math.random() - 0.5) *
                300,

            (Math.random() - 0.5) *
                300
        );
    }

    // --------------------------------------------------------
    // ENEMIES
    // --------------------------------------------------------

    const enemies = [];

    function createEnemy() {

        const enemy =
            new THREE.Mesh(
                new THREE.IcosahedronGeometry(
                    1,
                    1
                ),
                new THREE.MeshStandardMaterial({
                    color: 0xa84cff,
                    emissive: 0x260035,
                    roughness: 0.45
                })
            );

        const angle =
            Math.random() *
            Math.PI *
            2;

        const distance =
            30 +
            Math.random() *
            50;

        enemy.position.set(
            Math.cos(angle) *
                distance,

            1,

            Math.sin(angle) *
                distance
        );

        enemy.castShadow = true;

        enemy.userData.health =
            3;

        enemy.userData.speed =
            0.025;

        enemies.push(enemy);

        scene.add(enemy);
    }

    for (
        let i = 0;
        i < 10;
        i++
    ) {

        createEnemy();
    }

    // --------------------------------------------------------
    // TOETSEN
    // --------------------------------------------------------

    const keys = {};

    window.addEventListener(
        "keydown",
        function (event) {

            keys[event.code] = true;

        }
    );

    window.addEventListener(
        "keyup",
        function (event) {

            keys[event.code] = false;

        }
    );

    // --------------------------------------------------------
    // PLAYER BEWEGEN
    // --------------------------------------------------------

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

        const x =
            movement.x *
                Math.cos(yaw) -
            movement.z *
                Math.sin(yaw);

        const z =
            movement.x *
                Math.sin(yaw) +
            movement.z *
                Math.cos(yaw);

        let speed = 0.12;

        if (
            keys["ShiftLeft"] ||
            keys["ShiftRight"]
        ) {

            speed = 0.22;
        }

        player.position.x +=
            x * speed;

        player.position.z +=
            z * speed;

        player.rotation.y =
            yaw;
    }

    // --------------------------------------------------------
    // BULLETS
    // --------------------------------------------------------

    const bullets = [];

    let lastShot = 0;

    window.addEventListener(
        "mousedown",
        function (event) {

            if (
                event.button === 0
            ) {

                shoot();
            }
        }
    );

    function shoot() {

        const now =
            performance.now();

        if (
            now - lastShot <
            180
        ) {

            return;
        }

        lastShot = now;

        const direction =
            new THREE.Vector3();

        camera.getWorldDirection(
            direction
        );

        const bullet =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    0.12,
                    8,
                    8
                ),
                new THREE.MeshBasicMaterial({
                    color: 0x63eaff
                })
            );

        bullet.position.copy(
            camera.position
        );

        bullet.userData.velocity =
            direction.multiplyScalar(
                1.8
            );

        bullets.push(bullet);

        scene.add(bullet);
    }

    // --------------------------------------------------------
    // BULLETS UPDATE
    // --------------------------------------------------------

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

            let hit = false;

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
                    distance < 1.5
                ) {

                    enemy.userData.health--;

                    scene.remove(
                        bullet
                    );

                    bullets.splice(
                        i,
                        1
                    );

                    hit = true;

                    if (
                        enemy.userData.health <= 0
                    ) {

                        scene.remove(
                            enemy
                        );

                        enemies.splice(
                            j,
                            1
                        );
                    }

                    break;
                }
            }

            if (hit) {
                continue;
            }

            if (
                bullet.position.distanceTo(
                    player.position
                ) > 200
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

    // --------------------------------------------------------
    // ENEMY AI
    // --------------------------------------------------------

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

            enemy.lookAt(
                player.position.x,
                enemy.position.y,
                player.position.z
            );
        }
    }

    // --------------------------------------------------------
    // START MENU
    // --------------------------------------------------------

    const menu =
        document.getElementById(
            "menu"
        );

    const hud =
        document.getElementById(
            "hud"
        );

    let running = false;

    const startButton =
        document.getElementById(
            "newGame"
        );

    if (startButton) {

        startButton.addEventListener(
            "click",
            function () {

                running = true;

                if (menu) {
                    menu.style.display =
                        "none";
                }

                if (hud) {
                    hud.style.display =
                        "block";
                }
            }
        );
    }

    // --------------------------------------------------------
    // HUD
    // --------------------------------------------------------

    if (hud) {

        hud.style.display =
            "none";
    }

    // --------------------------------------------------------
    // RESIZE
    // --------------------------------------------------------

    window.addEventListener(
        "resize",
        function () {

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

    // --------------------------------------------------------
    // GAME LOOP
    // --------------------------------------------------------

    function gameLoop() {

        requestAnimationFrame(
            gameLoop
        );

        if (running) {

            updatePlayer();

            updateCamera();

            updateEnemies();

            updateBullets();
        }

        renderer.render(
            scene,
            camera
        );
    }

    // --------------------------------------------------------
    // START
    // --------------------------------------------------------

    updateCamera();

    gameLoop();

})();
