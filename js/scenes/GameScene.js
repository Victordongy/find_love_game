class GameScene extends Phaser.Scene {    constructor() {
        super('GameScene');
        this.heartCount = 0;
        this.totalHearts = 6;
        this.gameStartTime = 0;
        this.canWin = false; // Prevent immediate win
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#87CEEB'); // Sky blue
        
        // Create parallax background
        this.createParallaxBackground();
        
        // Create platforms
        this.createPlatforms();
        
        // Create collectible hearts
        this.createHearts();        // Add boy character using packed sprite (empty space automatically removed!)
        this.boy = this.physics.add.sprite(50, 180, 'boy', 'boy.png'); // Use atlas texture
        this.boy.setOrigin(0.5, 1); // Set origin so feet are at anchor point
        this.boy.setScale(2); // Use whole integer scale for crisp pixels
        this.boy.setCollideWorldBounds(true);
        this.boy.body.setAllowGravity(false); // DISABLE gravity - keep him static
        this.boy.setBounce(0);
        this.boy.body.setImmovable(true);        // Create girl using spritesheet with animations
        this.player = this.physics.add.sprite(100, 550, 'girl', 0); // Use spritesheet frame 0
        this.player.setOrigin(0.5, 1); // KEY: Set origin so feet are at anchor point
        this.player.setBounce(0);
        this.player.setCollideWorldBounds(true);
        this.player.body.setGravityY(100);

        // SCALE ADJUSTMENT: Spritesheet is 307x1024 per frame
        // - 0.10 = 31px wide (original size, very small)
        // - 0.15 = 46px wide (current - better visibility)
        // - 0.20 = 61px wide (larger, if needed)
        // Adjust this value to make the girl bigger or smaller:
        const GIRL_SCALE = 0.15;
        this.player.setScale(GIRL_SCALE);

        // Start with idle animation
        this.player.play('girl-idle');

        // FIXED: Custom collision body to match girl's actual body shape
        // Spritesheet at 0.15 scale: 307*0.15=46px wide, 1024*0.15=154px tall
        // Girl's actual body is roughly centered, about 60% width and 25% height
        this.player.body.setSize(180, 250, true); // Collision box in sprite coordinates (before scaling)
        this.player.body.setOffset(60, 750); // Offset to position at girl's lower body/legs
        
        console.log('Using clean Phaser approach with setOrigin(0.5, 1) for proper feet positioning');
        
        // Camera follows player
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setBounds(0, -200, 1100, 800); // Match camera bounds with physics world bounds
        
        // Set physics world bounds - allow jumping higher by extending top boundary
        this.physics.world.setBounds(0, -200, 1100, 800); // Extended upward and downward for jumping
        
        // Set up collisions
        this.physics.add.collider(this.player, this.platforms, this.landOnPlatform, null, this);
        this.physics.add.collider(this.boy, this.platforms); // Add collider for the boy
        this.physics.add.overlap(this.player, this.hearts, this.collectHeart, null, this);
        this.physics.add.overlap(this.player, this.boy, this.reachBoy, null, this);        // Set up controls
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Add space key for emergency reset
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Add J key for force jump (debugging)
        this.jKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
        
        // Hearts collected counter
        this.heartsCollectedText = this.add.text(16, 16, 'Hearts: 0', { 
            fontSize: '24px', 
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });
        this.heartsCollectedText.setScrollFactor(0);        // Instructions
        this.instructionsText = this.add.text(16, 550, '←→=Walk | ↑=Jump | ↓=Small hop | J=Force Jump | SPACE=Reset', {
            fontSize: '16px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 3
        });this.instructionsText.setScrollFactor(0);        // Set game start time and enable winning after a short delay
        this.gameStartTime = this.time.now;
        this.time.delayedCall(3000, () => {
            this.canWin = true;
            console.log('Game ready - winning now enabled after 3 seconds');
        });        console.log('GameScene created with UPDATED collision system - NO CUSTOM COLLISION BOXES');
        console.log('Girl position:', this.player.x, this.player.y);
        console.log('Boy position (LEFT-UPPER):', this.boy.x, this.boy.y);
        console.log('Girl scale:', this.player.scaleX, this.player.scaleY);
        console.log('Boy scale:', this.boy.scaleX, this.boy.scaleY);
        console.log('Girl display size:', this.player.displayWidth, this.player.displayHeight);
        console.log('Girl collision box size:', this.player.body.width, this.player.body.height);
        console.log('Girl collision offset:', this.player.body.offset.x, this.player.body.offset.y);
        console.log('World bounds:', this.physics.world.bounds);

        // DISABLED: Physics debug mode (causes flashing green boxes)
        // Uncomment the line below if you need to debug collision boxes:
        // this.physics.world.createDebugGraphic();
    }
    update(time, delta) {
        // Check if player is on the ground/platform - simplified and more reliable detection
        const onGround = this.player.body.touching.down || this.player.body.blocked.down;
          // Debug: Log ground state occasionally
        if (Math.floor(time / 1000) % 2 === 0 && time % 100 < 16) {
            console.log('Player on ground:', onGround, 'Position:', this.player.x, this.player.y);
            console.log('Player velocity:', this.player.body.velocity.x, this.player.body.velocity.y);
        }
          // Emergency reset if player gets stuck
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            console.log('Emergency reset - moving player to safe position');
            this.player.setPosition(100, 400); // Match the corrected starting position
            this.player.setVelocity(0, 0);
        }
        
        // Force jump for debugging (J key)
        if (Phaser.Input.Keyboard.JustDown(this.jKey)) {
            console.log('FORCE JUMP! J key pressed');
            this.player.setVelocity(0, -600);
        }
          // Debug: Check if player is stuck (not moving despite velocity)
        if (Math.abs(this.player.body.velocity.x) > 50 && Math.abs(this.player.body.deltaX()) < 1) {
            console.log('PLAYER SEEMS STUCK! Velocity:', this.player.body.velocity.x, 'Delta:', this.player.body.deltaX());
            console.log('Player bounds:', this.player.body.left, this.player.body.right, this.player.body.top, this.player.body.bottom);
        }
          // Check if player fell off the screen and respawn at starting platform
        if (this.player.y > 700) { // Only respawn if player falls well below screen (more lenient)
            console.log('Player fell off screen - respawning at starting platform');
            this.player.setPosition(100, 400); // Match the corrected starting position
            this.player.setVelocity(0, 0);
            
            // Optional: Show respawn message
            const respawnText = this.add.text(100, 400, 'Respawned!', {
                fontSize: '20px',
                fill: '#ff0000',
                stroke: '#fff',
                strokeThickness: 2
            });
            respawnText.setScrollFactor(0); // Keep text fixed on screen
            
            // Remove the respawn message after 2 seconds
            this.time.delayedCall(2000, () => {
                respawnText.destroy();
            });
        }
        
        if (onGround) {
            // Walking controls when on ground
            if (this.cursors.left.isDown) {
                // Walk left
                this.player.setVelocityX(-150);
                this.player.setFlipX(true); // Flip sprite to face left
                this.player.play('girl-walk', true); // Play walk animation
                console.log('Walking LEFT!');
            }
            else if (this.cursors.right.isDown) {
                // Walk right
                this.player.setVelocityX(150);
                this.player.setFlipX(false); // Face right (default)
                this.player.play('girl-walk', true); // Play walk animation
                console.log('Walking RIGHT!');
            }
            else {
                // Stop walking when no left/right input
                this.player.setVelocityX(0);
                this.player.play('girl-idle', true); // Play idle animation
            }
            
            // Jumping controls (separate from walking)
            if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                console.log('UP KEY PRESSED! onGround:', onGround, 'Player Y velocity:', this.player.body.velocity.y);
                this.player.play('girl-jump', true); // Play jump animation
                // Jump straight up or in walking direction
                const walkingDirection = this.player.body.velocity.x;
                if (Math.abs(walkingDirection) > 50) {
                    // Jump in walking direction - optimized for better gravity balance
                    console.log('Jumping in walking direction!');
                    this.player.setVelocity(walkingDirection * 2.5, -550);
                } else {
                    // Jump straight up - optimized for better gravity balance
                    console.log('Jumping UP!');
                    this.player.setVelocity(0, -600);
                }
            }
            else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
                // Small hop (useful for precise positioning) - optimized velocity
                console.log('Small hop DOWN!');
                this.player.play('girl-jump', true); // Play jump animation
                this.player.setVelocity(0, -350);
            }
        }else {
            // Player is in the air - show jump animation
            this.player.play('girl-jump', true);
            // In air controls (better adjustments)
            if (this.cursors.left.isDown) {
                this.player.setVelocityX(this.player.body.velocity.x - 15);
            } else if (this.cursors.right.isDown) {
                this.player.setVelocityX(this.player.body.velocity.x + 15);
            }
            
            // Allow small vertical adjustment in air
            if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                if (this.player.body.velocity.y > -100) { // Only if not already jumping fast upward
                    this.player.setVelocityY(this.player.body.velocity.y - 100);
                    console.log('Air boost UP!');
                }
            }
        }
    }
    
    normalizeVector(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    }
    
    drawJumpArrow() {
        this.jumpArrow.clear();
        this.jumpArrow.lineStyle(4, 0xffffff);
        
        const startX = this.player.x;
        const startY = this.player.y - 30;
        const length = 40;
        const endX = startX + this.jumpDirection.x * length;
        const endY = startY + this.jumpDirection.y * length;
        
        // Draw arrow line
        this.jumpArrow.beginPath();
        this.jumpArrow.moveTo(startX, startY);
        this.jumpArrow.lineTo(endX, endY);
        this.jumpArrow.strokePath();
        
        // Draw arrowhead
        const headLength = 10;
        const headAngle = Math.PI / 6;
        const angle = Math.atan2(endY - startY, endX - startX);
        
        this.jumpArrow.beginPath();
        this.jumpArrow.moveTo(endX, endY);
        this.jumpArrow.lineTo(endX - headLength * Math.cos(angle - headAngle), endY - headLength * Math.sin(angle - headAngle));
        this.jumpArrow.moveTo(endX, endY);
        this.jumpArrow.lineTo(endX - headLength * Math.cos(angle + headAngle), endY - headLength * Math.sin(angle + headAngle));
        this.jumpArrow.strokePath();
    }
    
    createParallaxBackground() {
        // Create layered background for depth
        
        // Far background - mountains/hills
        for (let i = 0; i < 3; i++) {
            const mountain = this.add.triangle(
                Phaser.Math.Between(0, 1100),
                600,
                0, 0,
                Phaser.Math.Between(150, 250), 0,
                Phaser.Math.Between(75, 125), -Phaser.Math.Between(150, 250),
                0x4a5d4a,
                0.6
            );
            mountain.setScrollFactor(0.1); // Very slow parallax
        }
        
        // Mid background - distant hills
        for (let i = 0; i < 4; i++) {
            const hill = this.add.ellipse(
                Phaser.Math.Between(0, 1100),
                Phaser.Math.Between(400, 550),
                Phaser.Math.Between(200, 300),
                Phaser.Math.Between(100, 150),
                0x6b7c6b,
                0.5
            );
            hill.setScrollFactor(0.3);
        }
        
        // Add background image if available
        if (this.textures.exists('background')) {
            const bg = this.add.image(600, 300, 'background');
            bg.setScrollFactor(0.5); // Mid-layer parallax
        }
        
        // Cloud layers with different depths
        // Far clouds
        for (let i = 0; i < 3; i++) {
            const cloud = this.add.ellipse(
                Phaser.Math.Between(0, 1100),
                Phaser.Math.Between(30, 120),
                Phaser.Math.Between(80, 120),
                Phaser.Math.Between(40, 60),
                0xffffff,
                0.4
            );
            cloud.setScrollFactor(0.2);
            
            // Add subtle floating animation to clouds
            this.tweens.add({
                targets: cloud,
                x: cloud.x + Phaser.Math.Between(20, 50),
                duration: Phaser.Math.Between(15000, 25000),
                ease: 'Linear',
                repeat: -1,
                yoyo: true
            });
        }
        
        // Mid clouds
        for (let i = 0; i < 4; i++) {
            const cloud = this.add.ellipse(
                Phaser.Math.Between(0, 1100),
                Phaser.Math.Between(80, 180),
                Phaser.Math.Between(60, 100),
                Phaser.Math.Between(30, 50),
                0xffffff,
                0.6
            );
            cloud.setScrollFactor(0.4);
            
            // Slightly faster cloud movement
            this.tweens.add({
                targets: cloud,
                x: cloud.x + Phaser.Math.Between(30, 70),
                duration: Phaser.Math.Between(12000, 20000),
                ease: 'Linear',
                repeat: -1,
                yoyo: true
            });
        }
        
        // Near clouds
        for (let i = 0; i < 3; i++) {
            const cloud = this.add.ellipse(
                Phaser.Math.Between(0, 1100),
                Phaser.Math.Between(120, 220),
                Phaser.Math.Between(40, 80),
                Phaser.Math.Between(20, 40),
                0xffffff,
                0.8
            );
            cloud.setScrollFactor(0.6);
            
            // Fastest cloud movement for foreground clouds
            this.tweens.add({
                targets: cloud,
                x: cloud.x + Phaser.Math.Between(40, 80),
                duration: Phaser.Math.Between(8000, 15000),
                ease: 'Linear',
                repeat: -1,
                yoyo: true
            });
        }
        
        // Add some atmospheric particles
        for (let i = 0; i < 15; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(0, 1100),
                Phaser.Math.Between(0, 600),
                Phaser.Math.Between(1, 3),
                0xffffff,
                Phaser.Math.FloatBetween(0.1, 0.3)
            );
            particle.setScrollFactor(Phaser.Math.FloatBetween(0.3, 0.8));
            
            // Gentle floating particles
            this.tweens.add({
                targets: particle,
                y: particle.y - Phaser.Math.Between(50, 100),
                x: particle.x + Phaser.Math.Between(-20, 20),
                duration: Phaser.Math.Between(10000, 20000),
                ease: 'Sine.easeInOut',
                repeat: -1,
                yoyo: true
            });
        }
    }
    
    createPlatforms() {
        this.platforms = this.physics.add.staticGroup();
        
        // Store original Y positions for floating animation
        this.platformOriginalY = [];
        
        // Ground platform (starting area) - no floating for stability
        const groundPlatform = this.platforms.create(100, 550, 'platform').setScale(2.5, 1).refreshBody();
        this.platformOriginalY.push({ platform: groundPlatform, originalY: 550, floats: false });
        
        // Ascending platforms - going up and right with LARGE gaps requiring skilled jumping
        const platforms = [
            { x: 300, y: 480, scale: 1.2, floats: true },   // Platform 1: 200px gap, 70px up
            { x: 520, y: 400, scale: 1.2, floats: true },   // Platform 2: 220px gap, 80px up
            { x: 750, y: 310, scale: 1.2, floats: true },   // Platform 3: 230px gap, 90px up
            { x: 980, y: 200, scale: 1.2, floats: true },   // Platform 4: 230px gap, 110px up - PEAK
            
            // Descending and going left toward the boy - raised to clear jump path
            { x: 850, y: 120, scale: 1.2, floats: true },   // Platform 5: raised to y: 120 to clear jump path
            { x: 650, y: 80, scale: 1.2, floats: true },    // Platform 6: raised to y: 80 to clear jump path
            { x: 400, y: 110, scale: 1.2, floats: true },   // Platform 7: 250px gap left, 20px down
            { x: 180, y: 100, scale: 1.2, floats: true },   // Platform 8: 220px gap left, 10px down
            
            // Final platform for the boy (left-upper area) - BIG final jump, but stable
            { x: 50, y: 180, scale: 1.8, floats: false }    // Final platform: 130px gap left, 80px down
        ];
        
        platforms.forEach((platformData, index) => {
            const platform = this.platforms.create(platformData.x, platformData.y, 'platform')
                .setScale(platformData.scale, 1).refreshBody();
            
            this.platformOriginalY.push({ 
                platform: platform, 
                originalY: platformData.y, 
                floats: platformData.floats 
            });
            
            // Add floating animation to platforms that should float
            if (platformData.floats) {
                // Randomize floating parameters for each platform
                const floatAmount = Phaser.Math.Between(8, 15); // Random float distance
                const floatSpeed = Phaser.Math.Between(1500, 3000); // Random speed
                const initialDelay = index * 200; // Stagger the animations
                
                // Start floating animation after a delay
                this.time.delayedCall(initialDelay, () => {
                    this.tweens.add({
                        targets: platform,
                        y: platformData.y - floatAmount,
                        duration: floatSpeed,
                        ease: 'Sine.easeInOut',
                        yoyo: true,
                        repeat: -1,
                        onUpdate: () => {
                            // Update physics body position during animation
                            platform.body.updateFromGameObject();
                        }
                    });
                });
            }
        });
        
        // Style platforms with improved appearance
        this.platforms.children.entries.forEach(platform => {
            platform.setTint(0x8B4513); // Brown color - will be replaced with better tiles later
        });
    }
    
    createHearts() {
        this.hearts = this.physics.add.group();
        
        // Place hearts near platforms (positioned to guide the reorganized path)
        const heartPositions = [
            { x: 300, y: 450 },  // Near platform 1
            { x: 520, y: 370 },  // Near platform 2
            { x: 750, y: 280 },  // Near platform 3
            { x: 980, y: 170 },  // Near platform 4 (peak)
            { x: 650, y: 100 },  // Near platform 6 (descent)
            { x: 120, y: 60 }    // Near boy's area (reward heart)
        ];
        
        heartPositions.forEach(pos => {
            this.createHeart(pos.x, pos.y);
        });
    }
    
    createHeart(x, y) {
        if (this.textures.exists('heart')) {
            const heart = this.hearts.create(x, y, 'heart');
            heart.setScale(1.5);
            heart.body.setAllowGravity(false);
            
            // Add floating animation
            this.tweens.add({
                targets: heart,
                y: y - 10,
                duration: 1000,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    collectHeart(player, heart) {
        heart.destroy();
        this.heartCount++;
        this.heartsCollectedText.setText('Hearts: ' + this.heartCount);
        
        // Play collect sound if available
        if (this.sound.get('collect')) {
            this.sound.play('collect');
        }
        
        // Particle effect
        const particles = this.add.particles(heart.x, heart.y, 'heart', {
            scale: { start: 0.5, end: 0 },
            speed: { min: 50, max: 100 },
            lifespan: 500,
            quantity: 5
        });
        
        // Remove particles after animation
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
    }
      landOnPlatform(player, platform) {
        // Player landed on platform - debug info
        console.log('Player landed on platform at:', player.x, player.y);
        console.log('Platform position:', platform.x, platform.y);
        console.log('Player body bounds:', player.body.x, player.body.y, player.body.width, player.body.height);
    }reachBoy(player, boy) {
        // Check if enough time has passed to prevent immediate collision
        if (!this.canWin) {
            console.log('Too early to win - ignoring collision');
            return;
        }
        
        // Check if player has moved far enough from starting position
        const distanceMoved = Phaser.Math.Distance.Between(100, 400, player.x, player.y); // Updated starting position reference
        if (distanceMoved < 200) {
            console.log('Player hasn\'t moved far enough yet. Distance:', distanceMoved);
            return;
        }
        
        console.log('Player reached boy! Hearts collected:', this.heartCount);
        console.log('Player position:', player.x, player.y);
        console.log('Boy position:', boy.x, boy.y);
        console.log('Distance moved:', distanceMoved);
        
        // Victory! Transition to end scene
        this.scene.start('EndScene', { 
            heartsCollected: this.heartCount,
            totalHearts: this.totalHearts
        });
    }

}
