class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // Add background
        this.add.image(400, 300, 'background');
        
        // Add game title
        const title = this.add.image(400, 150, 'title');
        title.setScale(0.8);
        
        // Add start button
        const startButton = this.add.text(400, 350, 'START', { 
            font: '32px Arial', 
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        });
        startButton.setOrigin(0.5);
        startButton.setPadding(20);
        startButton.setInteractive({ useHandCursor: true });
        
        // Button effects
        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#ff6b9d' });
            startButton.setScale(1.1);
        });
        
        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#ffffff' });
            startButton.setScale(1);
        });
        
        startButton.on('pointerdown', () => {
            // Go to world selection
            this.scene.start('WorldSelectionScene');
        });
        
        // Add a bouncing heart
        const heart = this.add.image(400, 250, 'heart');
        heart.setScale(0.5);
        
        // Create a bouncing tween for the heart
        this.tweens.add({
            targets: heart,
            y: 280,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Add game instructions
        const instructions = this.add.text(400, 450, 'Use arrow keys to control jump direction and force', {
            font: '18px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center',
            wordWrap: { width: 600 }
        });
        instructions.setOrigin(0.5);
          // Start background music if it exists
        try {
            if (this.sound.get && this.cache.audio.exists('background-music')) {
                if (!this.sound.get('background-music')) {
                    const music = this.sound.add('background-music', {
                        volume: 0.5,
                        loop: true
                    });
                    music.play();
                }
            }
        } catch (e) {
            console.log('Background music could not be played: ', e);
        }
    }
}
