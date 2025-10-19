/**
 * FIND LOVE - A Birthday Platformer Game
 * Clean, single-file implementation
 */

// ============================================================================
// GAME CONFIGURATION
// ============================================================================
const CONFIG = {
    // Display settings
    width: 1200,
    height: 600,
    pixelArt: false,  // Disabled for smoother sprite rendering

    // Character settings
    girlScale: 0.15,        // Adjust to make girl bigger/smaller
    boyScale: 0.10,         // Boy sprite scaled to match girl size

    // Physics
    gravity: 800,
    playerSpeed: 200,
    jumpVelocity: -600,

    // Game settings
    totalHearts: 6,
    winDelay: 3000,         // Delay before allowing win (ms)
};

// ============================================================================
// GAME CLASS - Main game logic
// ============================================================================
class FindLoveGame {
    constructor() {
        this.heartCount = 0;
        this.canWin = false;

        // Create Phaser game instance
        const config = {
            type: Phaser.AUTO,
            width: CONFIG.width,
            height: CONFIG.height,
            parent: 'game-container',
            backgroundColor: '#87CEEB',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: CONFIG.gravity },
                    debug: false  // Set to true to see collision boxes
                }
            },
            scene: {
                preload: this.preload.bind(this),
                create: this.create.bind(this),
                update: this.update.bind(this)
            },
            render: {
                pixelArt: CONFIG.pixelArt
            }
        };

        this.game = new Phaser.Game(config);
    }

    // ========================================================================
    // PRELOAD - Load all assets
    // ========================================================================
    preload() {
        const scene = this.game.scene.scenes[0];

        // Show loading text
        this.loadingText = scene.add.text(CONFIG.width / 2, CONFIG.height / 2, 'Loading...', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // Progress bar
        scene.load.on('progress', (value) => {
            this.loadingText.setText('Loading... ' + Math.floor(value * 100) + '%');
        });

        // Error handling
        scene.load.on('loaderror', (file) => {
            console.error('❌ Error loading:', file.key, file.src);
            this.loadingText.setText('Error loading: ' + file.key + '\nCheck console (F12)');
            this.loadingText.setColor('#ff0000');
        });

        // Complete - destroy loading text
        scene.load.on('complete', () => {
            console.log('✅ All assets loaded successfully!');
            if (this.loadingText) {
                this.loadingText.destroy();
            }
        });

        // Load sprites
        console.log('📦 Loading girl animation spritesheet (ORIGINAL)...');
        scene.load.spritesheet('girl', 'assets/images/girl_animate_sheet.png?v=' + Date.now(), {
            frameWidth: 256,  // 1536px / 6 frames = 256px per frame
            frameHeight: 1024
        });

        console.log('📦 Loading boy sprite...');
        scene.load.image('boy', 'assets/images/boy.png');  // Use original (not build version)

        console.log('📦 Loading platform...');
        scene.load.image('platform', 'assets/images/platform.png');

        console.log('📦 Loading heart...');
        scene.load.image('heart', 'assets/images/heart.png');

        console.log('📦 Loading background...');
        scene.load.image('background', 'assets/images/background.png');
    }

    // ========================================================================
    // CREATE - Set up game objects
    // ========================================================================
    create() {
        const scene = this.game.scene.scenes[0];

        // Create animations
        this.createAnimations(scene);

        // Create background
        this.createBackground(scene);

        // Create platforms
        this.createPlatforms(scene);

        // Create characters
        this.createGirl(scene);
        this.createBoy(scene);

        // Create hearts
        this.createHearts(scene);

        // Set up controls
        this.cursors = scene.input.keyboard.createCursorKeys();

        // Set up UI
        this.createUI(scene);

        // Set up collisions
        this.setupCollisions(scene);

        // Enable winning after delay
        scene.time.delayedCall(CONFIG.winDelay, () => {
            this.canWin = true;
        });

        // Camera follows player
        scene.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        scene.cameras.main.setBounds(0, -200, 1200, 800);
        scene.physics.world.setBounds(0, -200, 1200, 800);
    }

    // ========================================================================
    // CREATE ANIMATIONS
    // ========================================================================
    createAnimations(scene) {
        // Walking animation (use all 6 frames!)
        scene.anims.create({
            key: 'walk',
            frames: scene.anims.generateFrameNumbers('girl', { start: 0, end: 5 }),
            frameRate: 15,  // Increased from 10 to 15 for smoother animation
            repeat: -1
        });

        // Idle animation
        scene.anims.create({
            key: 'idle',
            frames: [{ key: 'girl', frame: 0 }],
            frameRate: 1
        });

        // Jump animation (middle frame of 6)
        scene.anims.create({
            key: 'jump',
            frames: [{ key: 'girl', frame: 3 }],
            frameRate: 1
        });
    }

    // ========================================================================
    // CREATE BACKGROUND
    // ========================================================================
    createBackground(scene) {
        // Sky color is set in game config

        // Add clouds (constrained within bounds to prevent edge flickering)
        for (let i = 0; i < 5; i++) {
            const cloudWidth = Phaser.Math.Between(80, 120);
            const cloud = scene.add.ellipse(
                Phaser.Math.Between(cloudWidth / 2, CONFIG.width - cloudWidth / 2),
                Phaser.Math.Between(30, 150),
                cloudWidth,
                Phaser.Math.Between(40, 60),
                0xffffff,
                0.6
            );
            cloud.setScrollFactor(0.3);

            // Animate clouds
            scene.tweens.add({
                targets: cloud,
                x: cloud.x + Phaser.Math.Between(30, 70),
                duration: Phaser.Math.Between(10000, 20000),
                ease: 'Linear',
                repeat: -1,
                yoyo: true
            });
        }
    }

    // ========================================================================
    // CREATE PLATFORMS - With Vertical Elevators!
    // ========================================================================
    createPlatforms(scene) {
        this.platforms = scene.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        // FIXED LEVEL DESIGN - Proper spacing, no merging!
        // Flow: Start → Right (step up) → Elevator UP → Left (to boy)
        const platformData = [
            // STARTING ZONE (bottom-left)
            { x: 120, y: 550, scale: 1.3, type: 'static' },  // 1. Girl starts here

            // ASCENDING PATH (going right, stepping up)
            { x: 400, y: 450, scale: 1.3, type: 'static' },  // 2. First step up (100px higher, well separated)
            { x: 680, y: 350, scale: 1.3, type: 'static' },  // 3. Second step up (100px higher)

            // ELEVATOR ZONE (visible on screen!)
            { x: 950, y: 340, scale: 1.5, type: 'elevator', range: 170, speed: 2500 },  // 4. Elevator UP!

            // TOP LEVEL (going left toward boy - SEPARATED Y values!)
            { x: 700, y: 180, scale: 1.5, type: 'static' },  // 5. Top platform (after elevator, moved away from elevator)
            { x: 500, y: 150, scale: 1.5, type: 'static' },  // 6. Middle platform (30px higher)
            { x: 200, y: 120, scale: 2, type: 'static' },    // 7. Boy's platform (GOAL! 30px higher)
        ];

        platformData.forEach((data, index) => {
            const platform = this.platforms.create(data.x, data.y, 'platform')
                .setScale(data.scale, 1.2)  // Taller platforms for better visibility
                .setTint(0x8B4513);

            platform.body.setImmovable(true);
            platform.body.setAllowGravity(false);

            // Store original position for elevators
            platform.originalY = data.y;

            // Add elevator movement
            if (data.type === 'elevator') {
                scene.time.delayedCall(index * 300, () => {
                    scene.tweens.add({
                        targets: platform,
                        y: data.y - data.range,  // Move up by range
                        duration: data.speed,
                        ease: 'Sine.easeInOut',
                        yoyo: true,
                        repeat: -1,
                        onUpdate: () => {
                            // Update physics body during animation
                            platform.body.y = platform.y - (platform.displayHeight / 2);
                        }
                    });
                });

                // Visual indicator for elevators (different tint)
                platform.setTint(0xA0522D);  // Lighter brown for elevators
            }
        });
    }

    // ========================================================================
    // CREATE GIRL CHARACTER
    // ========================================================================
    createGirl(scene) {
        this.player = scene.physics.add.sprite(120, 520, 'girl', 0);  // Start on platform 1
        this.player.setOrigin(0.5, 1);  // Anchor at bottom-center (feet position)
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(CONFIG.girlScale);
        this.player.play('idle');

        // Collision box for pixel art sprite (256x1024 frame)
        // Crown starts at Y=274 (solid pixels), feet at Y=815
        // Visible character is 542px tall (Y=274 to Y=815)
        this.player.body.setSize(
            180,   // Width of visible character
            542    // Height: from crown top to feet (Y=274 to Y=815)
        );
        this.player.body.setOffset(38, 274);  // Start collision box at crown top (Y=274)
    }

    // ========================================================================
    // CREATE BOY CHARACTER
    // ========================================================================
    createBoy(scene) {
        this.boy = scene.physics.add.sprite(200, 110, 'boy');  // On platform 7 (top-left GOAL!)
        this.boy.setOrigin(0.5, 1);
        this.boy.setScale(CONFIG.boyScale);
        this.boy.setCollideWorldBounds(true);
        this.boy.body.setAllowGravity(false);
        this.boy.body.setImmovable(true);
    }

    // ========================================================================
    // CREATE HEARTS
    // ========================================================================
    createHearts(scene) {
        this.hearts = scene.physics.add.group();

        // Hearts positioned along the path (updated for new platform positions)
        const heartPositions = [
            { x: 400, y: 420 },  // 1. On first step platform (y=450)
            { x: 680, y: 320 },  // 2. On second step platform (y=350)
            { x: 950, y: 280 },  // 3. On elevator (y=340, will move with it!)
            { x: 700, y: 150 },  // 4. On top platform (y=180)
            { x: 500, y: 120 },  // 5. Middle top platform (y=150)
            { x: 200, y: 90 }    // 6. Near boy on platform 7 (y=120)
        ];

        heartPositions.forEach(pos => {
            const heart = this.hearts.create(pos.x, pos.y, 'heart');
            heart.setScale(1.5);
            heart.body.setAllowGravity(false);

            // Floating animation
            scene.tweens.add({
                targets: heart,
                y: pos.y - 10,
                duration: 1000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        });
    }

    // ========================================================================
    // CREATE UI
    // ========================================================================
    createUI(scene) {
        // Hearts counter
        this.heartsText = scene.add.text(16, 16, 'Hearts: 0', {
            fontSize: '24px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });
        this.heartsText.setScrollFactor(0);

        // Instructions
        this.instructionsText = scene.add.text(16, 550, '←→ Walk | ↑ Jump', {
            fontSize: '18px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 3
        });
        this.instructionsText.setScrollFactor(0);
    }

    // ========================================================================
    // SETUP COLLISIONS
    // ========================================================================
    setupCollisions(scene) {
        scene.physics.add.collider(this.player, this.platforms);
        scene.physics.add.collider(this.boy, this.platforms);
        scene.physics.add.overlap(this.player, this.hearts, this.collectHeart, null, this);

        // Store boy collider reference so we can remove it on win (prevents freeze!)
        this.boyCollider = scene.physics.add.overlap(this.player, this.boy, this.reachBoy, null, this);
    }

    // ========================================================================
    // UPDATE - Game loop
    // ========================================================================
    update() {
        // If game is won, don't update (prevents freeze!)
        if (!this.cursors) return;

        const scene = this.game.scene.scenes[0];

        // Check if on ground
        const onGround = this.player.body.touching.down || this.player.body.blocked.down;

        // Handle movement
        if (onGround) {
            if (this.cursors.left.isDown) {
                this.player.setVelocityX(-CONFIG.playerSpeed);
                this.player.setFlipX(true);
                this.player.play('walk', true);
            } else if (this.cursors.right.isDown) {
                this.player.setVelocityX(CONFIG.playerSpeed);
                this.player.setFlipX(false);
                this.player.play('walk', true);
            } else {
                this.player.setVelocityX(0);
                this.player.play('idle', true);
            }

            // Jump
            if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                this.player.setVelocityY(CONFIG.jumpVelocity);
                this.player.play('jump', true);
            }
        } else {
            // In air - only play jump animation if not already playing to prevent flickering
            if (this.player.anims.currentAnim?.key !== 'jump') {
                this.player.play('jump');
            }

            // Air control
            if (this.cursors.left.isDown) {
                this.player.setVelocityX(this.player.body.velocity.x - 15);
            } else if (this.cursors.right.isDown) {
                this.player.setVelocityX(this.player.body.velocity.x + 15);
            }
        }

        // Respawn if fell off
        if (this.player.y > 700) {
            this.player.setPosition(100, 520);  // Back to start platform
            this.player.setVelocity(0, 0);
        }
    }

    // ========================================================================
    // COLLECT HEART
    // ========================================================================
    collectHeart(player, heart) {
        heart.destroy();
        this.heartCount++;
        this.heartsText.setText('Hearts: ' + this.heartCount);
    }

    // ========================================================================
    // REACH BOY (WIN CONDITION)
    // ========================================================================
    reachBoy(player, boy) {
        if (!this.canWin) return;

        // Prevent multiple triggers (freeze fix!)
        this.canWin = false;

        const scene = this.game.scene.scenes[0];

        // Stop player
        this.player.setVelocity(0, 0);
        this.player.body.setAllowGravity(false);

        // Disable physics overlap (prevent continued collision detection)
        scene.physics.world.removeCollider(this.boyCollider);

        // Show victory message
        const victoryText = scene.add.text(CONFIG.width / 2, CONFIG.height / 2,
            `You Found Love!\n\nHearts Collected: ${this.heartCount}/${CONFIG.totalHearts}`, {
            fontSize: '48px',
            fill: '#ff1493',
            stroke: '#fff',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);
        victoryText.setScrollFactor(0);

        // Disable controls
        this.cursors = null;

        console.log('🎉 VICTORY! Game won!');
    }
}

// ============================================================================
// START GAME
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    new FindLoveGame();
});
