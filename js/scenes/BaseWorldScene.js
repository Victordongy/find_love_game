class BaseWorldScene extends Phaser.Scene {
    constructor(key, worldKey = 'world1') {
        super(key);
        this.worldKey = worldKey;
    }

    init() {
        this.heartCount = 0;
        this.totalHearts = 0;
        this.canWin = false;
        this.gameStartTime = 0;
        this.respawnPoint = { x: 100, y: 400 };
        this.worldData = {};
    }

    create() {
        this.loadWorldData();
        this.configureBackground();
        this.buildPlatforms();
        this.buildHearts();
        this.createBoy();
        this.createPlayer();
        this.configureCameraAndWorld();
        this.setupCollisions();
        this.setupInput();
        this.hud = new Hud(this, this.totalHearts);
        this.scheduleWin();
    }

    update(time, delta) {
        const onGround = this.player.body.touching.down || this.player.body.blocked.down;
        this.handleEmergencyReset();
        this.handleDebugJump();
        this.handleRespawn();
        this.handleMovement(onGround, delta);
    }

    loadWorldData() {
        const data = this.cache.json.get(this.worldKey);
        if (!data) {
            console.warn(`World data '${this.worldKey}' missing - using defaults.`);
            this.worldData = {};
        } else {
            this.worldData = data;
        }

        const player = this.worldData.player || {};
        this.playerStart = player.start || { x: 100, y: 550 };
        this.respawnPoint = player.respawn || { x: 100, y: 400 };
        this.playerConfig = {
            speed: player.speed || 150,
            jumpVelocity: player.jumpVelocity || -600,
            directionalJumpMultiplier: player.directionalJumpMultiplier || 2.5,
            hopVelocity: player.hopVelocity || -350,
            scale: player.scale || 0.15,
            gravity: player.gravity || 100,
            body: player.body || { width: 180, height: 250, offsetX: 60, offsetY: 750 },
            airControl: player.airControl || {
                maxHorizontalSpeed: 200,
                acceleration: 200,
                decay: 80
            }
        };

        const boy = this.worldData.boy || {};
        this.boyConfig = {
            x: boy.x || 50,
            y: boy.y || 180,
            scale: boy.scale || 2,
            immovable: boy.immovable !== false
        };

        this.platformData = Array.isArray(this.worldData.platforms) ? this.worldData.platforms : [];
        this.heartData = Array.isArray(this.worldData.hearts) ? this.worldData.hearts : [];
        this.totalHearts = this.heartData.length;

        this.backgroundConfig = this.worldData.background || {};
        this.boundsConfig = this.worldData.bounds || {};
        this.metaConfig = this.worldData.meta || {};
    }

    configureBackground() {
        const skyColor = this.backgroundConfig.skyColor || '#87CEEB';
        this.cameras.main.setBackgroundColor(skyColor);
        this.createParallaxBackground();
    }

    buildPlatforms() {
        this.platforms = this.physics.add.staticGroup();
        this.platformData.forEach((platformData, index) => {
            const platform = this.platforms.create(
                platformData.x || 0,
                platformData.y || 0,
                'platform'
            );

            const scaleX = platformData.scaleX || platformData.scale || 1;
            const scaleY = platformData.scaleY || 1;
            platform.setScale(scaleX, scaleY).refreshBody();
            platform.setTint(0x8b4513);

            if (platformData.floats) {
                const floatConfig = platformData.float || {};
                const amount = floatConfig.amount || 10;
                const duration = floatConfig.duration || 2000;
                const delay = floatConfig.delay || index * 200;

                this.time.delayedCall(delay, () => {
                    this.tweens.add({
                        targets: platform,
                        y: (platformData.y || 0) - amount,
                        duration: duration,
                        ease: 'Sine.easeInOut',
                        yoyo: true,
                        repeat: -1,
                        onUpdate: () => platform.body.updateFromGameObject()
                    });
                });
            }
        });
    }

    buildHearts() {
        this.hearts = this.physics.add.group();
        this.heartData.forEach(heartConfig => {
            if (!this.textures.exists('heart')) {
                return;
            }
            const heart = this.hearts.create(heartConfig.x || 0, heartConfig.y || 0, 'heart');
            heart.setScale(1.5);
            heart.body.setAllowGravity(false);

            if (heartConfig.float) {
                const amount = heartConfig.float.amount || 10;
                const duration = heartConfig.float.duration || 1000;
                this.tweens.add({
                    targets: heart,
                    y: (heartConfig.y || 0) - amount,
                    duration,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
            }
        });
    }

    createBoy() {
        this.boy = this.physics.add.sprite(this.boyConfig.x, this.boyConfig.y, 'boy', 'boy.png');
        this.boy.setOrigin(0.5, 1);
        this.boy.setScale(this.boyConfig.scale);
        this.boy.setCollideWorldBounds(true);
        this.boy.body.setAllowGravity(false);
        this.boy.setBounce(0);
        this.boy.body.setImmovable(this.boyConfig.immovable);
    }

    createPlayer() {
        this.player = this.physics.add.sprite(this.playerStart.x, this.playerStart.y, 'girl', 0);
        this.player.setOrigin(0.5, 1);
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(this.playerConfig.gravity);
        this.player.setScale(this.playerConfig.scale);
        this.player.play('girl-idle');

        const body = this.playerConfig.body;
        this.player.body.setSize(body.width, body.height, true);
        this.player.body.setOffset(body.offsetX, body.offsetY);
    }

    configureCameraAndWorld() {
        const cameraBounds = this.boundsConfig.camera || { x: 0, y: -200, width: 1100, height: 800 };
        const worldBounds = this.boundsConfig.world || { x: 0, y: -200, width: 1100, height: 800 };

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setBounds(cameraBounds.x, cameraBounds.y, cameraBounds.width, cameraBounds.height);
        this.physics.world.setBounds(worldBounds.x, worldBounds.y, worldBounds.width, worldBounds.height);
    }

    setupCollisions() {
        this.physics.add.collider(this.player, this.platforms, this.landOnPlatform, null, this);
        this.physics.add.collider(this.boy, this.platforms);
        this.physics.add.overlap(this.player, this.hearts, this.collectHeart, null, this);
        this.physics.add.overlap(this.player, this.boy, this.reachBoy, null, this);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.jKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
    }

    scheduleWin() {
        const delay = this.metaConfig.winDelay || 3000;
        this.gameStartTime = this.time.now;
        this.time.delayedCall(delay, () => {
            this.canWin = true;
        });
    }

    handleEmergencyReset() {
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y);
            this.player.setVelocity(0, 0);
        }
    }

    handleDebugJump() {
        if (Phaser.Input.Keyboard.JustDown(this.jKey)) {
            this.player.setVelocity(0, this.playerConfig.jumpVelocity);
        }
    }

    handleRespawn() {
        const worldBounds = this.physics.world.bounds;
        if (this.player.y > worldBounds.y + worldBounds.height + 100) {
            this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y);
            this.player.setVelocity(0, 0);

            const respawnText = this.add.text(this.respawnPoint.x, this.respawnPoint.y, 'Respawned!', {
                fontSize: '20px',
                fill: '#ff0000',
                stroke: '#fff',
                strokeThickness: 2
            });
            respawnText.setScrollFactor(0);
            this.time.delayedCall(2000, () => respawnText.destroy());
        }
    }

    handleMovement(onGround, delta) {
        const speed = this.playerConfig.speed;
        const airControl = this.playerConfig.airControl;
        const maxAirSpeed = airControl.maxHorizontalSpeed;
        const acceleration = airControl.acceleration;
        const decay = airControl.decay;

        if (onGround) {
            if (this.cursors.left.isDown) {
                this.player.setVelocityX(-speed);
                this.player.setFlipX(true);
                this.player.play('girl-walk', true);
            } else if (this.cursors.right.isDown) {
                this.player.setVelocityX(speed);
                this.player.setFlipX(false);
                this.player.play('girl-walk', true);
            } else {
                this.player.setVelocityX(0);
                this.player.play('girl-idle', true);
            }

            if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                const walkingDirection = this.player.body.velocity.x;
                this.player.play('girl-jump', true);
                if (Math.abs(walkingDirection) > 50) {
                    this.player.setVelocity(
                        walkingDirection * this.playerConfig.directionalJumpMultiplier,
                        this.playerConfig.jumpVelocity
                    );
                } else {
                    this.player.setVelocityY(this.playerConfig.jumpVelocity);
                    this.player.setVelocityX(0);
                }
            } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
                this.player.play('girl-jump', true);
                this.player.setVelocityY(this.playerConfig.hopVelocity);
                this.player.setVelocityX(0);
            }
        } else {
            this.player.play('girl-jump', true);

            if (this.cursors.left.isDown) {
                const vx = Phaser.Math.Clamp(
                    this.player.body.velocity.x - acceleration * (delta / 1000),
                    -maxAirSpeed,
                    maxAirSpeed
                );
                this.player.setVelocityX(vx);
            } else if (this.cursors.right.isDown) {
                const vx = Phaser.Math.Clamp(
                    this.player.body.velocity.x + acceleration * (delta / 1000),
                    -maxAirSpeed,
                    maxAirSpeed
                );
                this.player.setVelocityX(vx);
            } else {
                const currentVx = this.player.body.velocity.x;
                if (Math.abs(currentVx) > 1) {
                    const decayAmount = decay * (delta / 1000);
                    const newVx = Math.abs(currentVx) - decayAmount;
                    this.player.setVelocityX(Math.sign(currentVx) * Math.max(newVx, 0));
                } else {
                    this.player.setVelocityX(0);
                }
            }

            if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.player.body.velocity.y > -100) {
                this.player.setVelocityY(this.player.body.velocity.y - 100);
            }
        }
    }

    collectHeart(player, heart) {
        heart.destroy();
        this.heartCount += 1;
        if (this.hud) {
            this.hud.updateHearts(this.heartCount, this.totalHearts);
        }

        if (this.sound.get('collect')) {
            this.sound.play('collect');
        }

        const particles = this.add.particles(heart.x, heart.y, 'heart', {
            scale: { start: 0.5, end: 0 },
            speed: { min: 50, max: 100 },
            lifespan: 500,
            quantity: 5
        });
        this.time.delayedCall(500, () => particles.destroy());
    }

    landOnPlatform(player, platform) {
        console.log('Player landed on platform at:', player.x, player.y);
        console.log('Platform position:', platform.x, platform.y);
    }

    reachBoy(player, boy) {
        if (!this.canWin) {
            return;
        }

        const distanceMoved = Phaser.Math.Distance.Between(
            this.playerStart.x,
            this.playerStart.y,
            player.x,
            player.y
        );
        if (distanceMoved < 200) {
            return;
        }

        this.scene.start('EndScene', {
            heartsCollected: this.heartCount,
            totalHearts: this.totalHearts
        });
    }

    createParallaxBackground() {
        const bg = this.backgroundConfig;

        // Mountains / far background
        const mountains = bg.mountains || {};
        const mountainCount = mountains.count || 3;
        for (let i = 0; i < mountainCount; i++) {
            const width = this.randomInRange(mountains.widthRange, 200);
            const height = this.randomInRange(mountains.heightRange, 200);
            const mountain = this.add.triangle(
                Phaser.Math.Between(0, 1100),
                600,
                0,
                0,
                width,
                0,
                width / 2,
                -height,
                Phaser.Display.Color.HexStringToColor(mountains.color || '#4a5d4a').color,
                mountains.alpha ?? 0.6
            );
            mountain.setScrollFactor(mountains.scrollFactor ?? 0.1);
        }

        // Hills / mid background
        const hills = bg.hills || {};
        const hillCount = hills.count || 4;
        for (let i = 0; i < hillCount; i++) {
            const hill = this.add.ellipse(
                Phaser.Math.Between(0, 1100),
                Phaser.Math.Between(400, 550),
                this.randomInRange(hills.widthRange, 250),
                this.randomInRange(hills.heightRange, 125),
                Phaser.Display.Color.HexStringToColor(hills.color || '#6b7c6b').color,
                hills.alpha ?? 0.5
            );
            hill.setScrollFactor(hills.scrollFactor ?? 0.3);
        }

        if (this.textures.exists('background')) {
            const image = this.add.image(600, 300, 'background');
            image.setScrollFactor(0.5);
        }

        const cloudLayers = Array.isArray(bg.cloudLayers) ? bg.cloudLayers : [];
        cloudLayers.forEach(layer => {
            const count = layer.count || 3;
            for (let i = 0; i < count; i++) {
                const width = this.randomInRange(layer.size?.width, 80);
                const height = this.randomInRange(layer.size?.height, 40);
                const y = Phaser.Math.Between(layer.yRange ? layer.yRange[0] : 30, layer.yRange ? layer.yRange[1] : 120);
                const cloud = this.add.ellipse(
                    Phaser.Math.Between(0, 1100),
                    y,
                    width,
                    height,
                    0xffffff,
                    layer.alpha ?? 0.5
                );
                cloud.setScrollFactor(layer.scrollFactor ?? 0.4);

                const duration = this.randomInRange(layer.duration, 15000);
                const offset = this.randomInRange(layer.offset, 40);
                this.tweens.add({
                    targets: cloud,
                    x: cloud.x + offset,
                    duration,
                    ease: 'Linear',
                    repeat: -1,
                    yoyo: true
                });
            }
        });

        const particles = bg.particles || {};
        const particleCount = particles.count || 15;
        for (let i = 0; i < particleCount; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, 1100),
                Phaser.Math.Between(0, 600),
                Phaser.Math.Between(1, 3),
                0xffffff,
                Phaser.Math.FloatBetween(
                    particles.alphaRange ? particles.alphaRange[0] : 0.1,
                    particles.alphaRange ? particles.alphaRange[1] : 0.3
                )
            );
            particle.setScrollFactor(
                Phaser.Math.FloatBetween(
                    particles.scrollFactorRange ? particles.scrollFactorRange[0] : 0.3,
                    particles.scrollFactorRange ? particles.scrollFactorRange[1] : 0.8
                )
            );

            const duration = this.randomInRange(particles.duration, 15000);
            const yOffset = this.randomInRange(particles.yOffset, 80);
            const xJitter = this.randomInRange(particles.xJitter, 20);
            this.tweens.add({
                targets: particle,
                y: particle.y - yOffset,
                x: particle.x + xJitter,
                duration,
                ease: 'Sine.easeInOut',
                repeat: -1,
                yoyo: true
            });
        }
    }

    randomInRange(range, fallback) {
        if (Array.isArray(range) && range.length === 2) {
            return Phaser.Math.Between(range[0], range[1]);
        }
        return fallback;
    }
}

