class EndScene extends Phaser.Scene {
    constructor() {
        super('EndScene');
    }

    init(data) {
        // Get data passed from game scene
        this.heartsCollected = data.heartsCollected || 0;
        if (typeof data.totalHearts === 'number') {
            this.totalHearts = data.totalHearts;
        } else {
            this.totalHearts = Math.max(data.heartsCollected || 0, 0);
        }
    }

    create() {
        // Add background with hearts
        this.createHeartBackground();
          // Create a romantic scene with boy and girl characters
        const boy = this.add.sprite(300, 350, 'boy');
        boy.setScale(3);
        // Use sprite animations if available, otherwise just show the static image
        if (this.anims.exists('boy-idle')) {
            boy.anims.play('boy-idle', true);
        }
        
        const girl = this.add.sprite(500, 350, 'girl');
        girl.setScale(3);
        // Use sprite animations if available, otherwise just show the static image
        if (this.anims.exists('girl-idle')) {
            girl.anims.play('girl-idle', true);
        }
        
        // Add big heart between characters
        const heartBig = this.add.image(400, 300, 'heart');
        heartBig.setScale(2);
        
        // Create pulsing effect for the heart
        this.tweens.add({
            targets: heartBig,
            scale: 2.2,
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Add celebration text
        const victoryTitle = this.add.text(400, 150, 'Happy Birthday!', {
            fontSize: '48px',
            fill: '#ff6b9d',
            stroke: '#000000',
            strokeThickness: 6
        });
        victoryTitle.setOrigin(0.5);
        
        // Hearts collected stats
        const heartsText = this.add.text(400, 220, `Hearts Collected: ${this.heartsCollected}/${this.totalHearts}`, {
            fontSize: '24px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });
        heartsText.setOrigin(0.5);
        
        // Personalized message
        const message = this.add.text(400, 450, 'To 筱菲:\n I love you to the moon and back!\nThank you for being in my life.', {
            fontSize: '28px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4,
            align: 'center',
            wordWrap: { width: 600 }
        });
        message.setOrigin(0.5);
        
        // Add restart button
        const restartButton = this.add.text(400, 530, 'Play Again', {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#ff6b9d',
            padding: {
                left: 20,
                right: 20,
                top: 10,
                bottom: 10
            }
        });
        restartButton.setOrigin(0.5);
        restartButton.setInteractive({ useHandCursor: true });
        
        // Button effects
        restartButton.on('pointerover', () => {
            restartButton.setScale(1.1);
        });
        
        restartButton.on('pointerout', () => {
            restartButton.setScale(1);
        });
        
        restartButton.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
      createHeartBackground() {
        // Add background color (pink)
        this.cameras.main.setBackgroundColor('#ffb6c1');
        
        // Add background image if available
        if (this.textures.exists('background')) {
            this.add.image(400, 300, 'background');
        }
        
        // Add floating hearts in background
        const numHearts = 10;
        for (let i = 0; i < numHearts; i++) {
            const x = Phaser.Math.Between(50, 750);
            const y = Phaser.Math.Between(50, 550);
            const scale = Phaser.Math.Between(2, 5) / 10;
            const alpha = Phaser.Math.Between(3, 8) / 10;
            
            // Only add hearts if the texture is available
            if (this.textures.exists('heart')) {
                const heart = this.add.image(x, y, 'heart');
                heart.setScale(scale);
                heart.setAlpha(alpha);
                
                // Simple animation to move heart upward
                this.tweens.add({
                    targets: heart,
                    y: y - 100,
                    alpha: 0,
                    duration: 3000,
                    yoyo: true,
                    repeat: -1
                });
            }        }
    }
}
