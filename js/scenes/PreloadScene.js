class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
        this.readyCount = 0;
    }

    preload() {
        // Create loading bar
        let width = this.cameras.main.width;
        let height = this.cameras.main.height;
        
        // Set a solid color background for the loading screen
        this.cameras.main.setBackgroundColor('#ffb6c1');
        
        let progressBar = this.add.graphics();
        let progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        let loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        // Add status text
        let statusText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: 'Loading assets...',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        statusText.setOrigin(0.5, 0.5);
        
        // Loading progress events
        this.load.on('progress', function (value) {
            progressBar.clear();
            progressBar.fillStyle(0xff6b9d, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
            
            // Update status text with percentage
            statusText.setText(`Loading assets... ${Math.floor(value * 100)}%`);
        });
        
        this.load.on('fileprogress', function (file) {
            statusText.setText('Loading: ' + file.key);
        });
        
        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            statusText.setText('Ready! Starting game...');
        });
        
        // Set up error handling
        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file.key, file.src);
            statusText.setText(`Error loading: ${file.key} - Using fallback`);
            
            // Create fallback colored rectangles for missing images
            if (file.key === 'girl') {
                this.textures.generate('girl', { data: ['ff69b4'], pixelWidth: 32, pixelHeight: 64 });
            } else if (file.key === 'boy') {
                this.textures.generate('boy', { data: ['4169e1'], pixelWidth: 32, pixelHeight: 64 });
            } else if (file.key === 'platform') {
                this.textures.generate('platform', { data: ['8b4513'], pixelWidth: 64, pixelHeight: 32 });
            } else if (file.key === 'heart') {
                this.textures.generate('heart', { data: ['ff1493'], pixelWidth: 16, pixelHeight: 16 });
            }
        });
        
        // Load game assets
        // Load girl animation spritesheet (5 frames of walking animation)
        this.load.spritesheet('girl', 'assets/images/girl_animate_sheet.png', {
            frameWidth: 307,   // Each frame is 307px wide (1536/5 = 307.2, rounded)
            frameHeight: 1024  // Full height of the spritesheet
        });

        // Load boy using packed atlas (trimmed, no animation)
        this.load.atlas('boy', 'build/boy.png', 'build/boy.json');
        
        // Images
        this.load.image('background', 'assets/images/background.png');
        this.load.image('platform', 'assets/images/platform.png');
        this.load.image('heart', 'assets/images/heart.png');
        this.load.image('title', 'assets/images/title.png');
        
        // Commenting out all audio for now
        // this.load.audio('jump', 'assets/audio/jump.mp3');
        // this.load.audio('collect', 'assets/audio/collect.mp3');
        // this.load.audio('background-music', 'assets/audio/background-music.mp3');
        // this.load.audio('victory', 'assets/audio/victory.mp3');
    }
    
    create() {
        // Create girl animations from spritesheet
        if (this.textures.exists('girl')) {
            // Walking animation (all 5 frames)
            this.anims.create({
                key: 'girl-walk',
                frames: this.anims.generateFrameNumbers('girl', { start: 0, end: 4 }),
                frameRate: 10,
                repeat: -1
            });

            // Idle animation (just first frame)
            this.anims.create({
                key: 'girl-idle',
                frames: [{ key: 'girl', frame: 0 }],
                frameRate: 1
            });

            // Jump animation (middle frame)
            this.anims.create({
                key: 'girl-jump',
                frames: [{ key: 'girl', frame: 2 }],
                frameRate: 1
            });

            console.log('✅ Girl animations created: walk, idle, jump');
        }

        // Verify all textures loaded correctly
        console.log('Preload complete, verifying textures...');
        const requiredTextures = ['girl', 'boy', 'platform', 'heart'];
        requiredTextures.forEach(key => {
            if (!this.textures.exists(key)) {
                console.warn(`Texture '${key}' not found, creating fallback`);
                // Create fallback textures if missing
                if (key === 'girl') {
                    this.textures.generate('girl', { data: ['ff69b4'], pixelWidth: 32, pixelHeight: 64 });
                } else if (key === 'boy') {
                    this.textures.generate('boy', { data: ['4169e1'], pixelWidth: 32, pixelHeight: 64 });
                } else if (key === 'platform') {
                    this.textures.generate('platform', { data: ['8b4513'], pixelWidth: 64, pixelHeight: 32 });
                } else if (key === 'heart') {
                    this.textures.generate('heart', { data: ['ff1493'], pixelWidth: 16, pixelHeight: 16 });
                }
            } else {
                console.log(`✓ Texture '${key}' loaded successfully`);
            }
        });
        
        console.log('Starting menu scene');
        // Add a slight delay before transitioning to MenuScene for better user experience
        this.time.delayedCall(500, () => {
            this.scene.start('MenuScene');
        });
    }
}
