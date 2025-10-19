class WorldSelectionScene extends Phaser.Scene {
    constructor() {
        super('WorldSelectionScene');
        this.worlds = [
            {
                id: 'world1',
                name: 'Sky Isles',
                description: 'Begin your journey',
                difficulty: 1,
                color: 0x87CEEB,
                platforms: 10,
                hearts: 6
            },
            {
                id: 'world2',
                name: 'Canyon Crossing',
                description: 'Navigate the depths',
                difficulty: 2,
                color: 0xff8c69,
                platforms: 10,
                hearts: 8
            },
            {
                id: 'world3',
                name: 'Sunset Summit',
                description: 'Climb to new heights',
                difficulty: 3,
                color: 0xff6b9d,
                platforms: 12,
                hearts: 10
            },
            {
                id: 'world4',
                name: 'Twilight Odyssey',
                description: 'The ultimate challenge',
                difficulty: 4,
                color: 0x4b0082,
                platforms: 15,
                hearts: 13
            }
        ];
    }

    create() {
        const { width, height } = this.cameras.main;

        // Background
        this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

        // Title
        const title = this.add.text(width / 2, 60, 'Select Your Adventure', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Subtitle
        const subtitle = this.add.text(width / 2, 110, 'Choose a world to begin your journey', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#cccccc'
        }).setOrigin(0.5);

        // Create world cards
        const cardWidth = 220;
        const cardHeight = 280;
        const spacing = 30;
        const startX = (width - (cardWidth * 4 + spacing * 3)) / 2;
        const startY = 180;

        this.worlds.forEach((world, index) => {
            this.createWorldCard(
                world,
                startX + (cardWidth + spacing) * index,
                startY,
                cardWidth,
                cardHeight
            );
        });

        // Back button
        const backButton = this.add.text(40, height - 60, '← Back to Menu', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setInteractive({ useHandCursor: true });

        backButton.on('pointerover', () => {
            backButton.setStyle({ color: '#ff6b9d' });
            backButton.setScale(1.05);
        });

        backButton.on('pointerout', () => {
            backButton.setStyle({ color: '#ffffff' });
            backButton.setScale(1);
        });

        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Instructions
        const instructions = this.add.text(width / 2, height - 40, 'Click on a world to start playing!', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5);
    }

    createWorldCard(world, x, y, cardWidth, cardHeight) {
        // Card container
        const card = this.add.container(x, y);

        // Card background
        const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x2a2a3e)
            .setOrigin(0, 0)
            .setStrokeStyle(3, world.color, 0.8);

        // World color indicator (top bar)
        const colorBar = this.add.rectangle(0, 0, cardWidth, 40, world.color)
            .setOrigin(0, 0)
            .setAlpha(0.7);

        // World name
        const nameText = this.add.text(cardWidth / 2, 20, world.name, {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Description
        const descText = this.add.text(cardWidth / 2, 70, world.description, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: cardWidth - 20 }
        }).setOrigin(0.5);

        // Difficulty stars
        const starsY = 115;
        const starSpacing = 25;
        const totalStars = 4;
        const starsStartX = (cardWidth - (starSpacing * (totalStars - 1))) / 2;

        for (let i = 0; i < totalStars; i++) {
            const starX = starsStartX + i * starSpacing;
            const star = this.add.text(starX, starsY, '★', {
                fontSize: '20px',
                color: i < world.difficulty ? '#ffd700' : '#444444'
            }).setOrigin(0.5);
            card.add(star);
        }

        // Stats
        const statsY = 160;
        const platformsText = this.add.text(cardWidth / 2, statsY, `🏔️ ${world.platforms} Platforms`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        const heartsText = this.add.text(cardWidth / 2, statsY + 25, `💕 ${world.hearts} Hearts`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Play button
        const playButton = this.add.rectangle(
            cardWidth / 2,
            cardHeight - 40,
            160,
            45,
            world.color
        ).setOrigin(0.5);

        const playText = this.add.text(cardWidth / 2, cardHeight - 40, 'PLAY', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add all elements to card
        card.add([bg, colorBar, nameText, descText, platformsText, heartsText, playButton, playText]);

        // Make entire card interactive
        bg.setInteractive({ useHandCursor: true });

        // Hover effects
        bg.on('pointerover', () => {
            this.tweens.add({
                targets: card,
                y: y - 10,
                scale: 1.05,
                duration: 200,
                ease: 'Power2'
            });
            bg.setStrokeStyle(4, world.color, 1);
            playButton.setFillStyle(Phaser.Display.Color.GetColor(
                Math.min(255, Phaser.Display.Color.IntegerToRGB(world.color).r + 30),
                Math.min(255, Phaser.Display.Color.IntegerToRGB(world.color).g + 30),
                Math.min(255, Phaser.Display.Color.IntegerToRGB(world.color).b + 30)
            ));
        });

        bg.on('pointerout', () => {
            this.tweens.add({
                targets: card,
                y: y,
                scale: 1,
                duration: 200,
                ease: 'Power2'
            });
            bg.setStrokeStyle(3, world.color, 0.8);
            playButton.setFillStyle(world.color);
        });

        // Click to play
        bg.on('pointerdown', () => {
            // Flash effect
            this.tweens.add({
                targets: playButton,
                alpha: 0.5,
                yoyo: true,
                duration: 100,
                repeat: 2,
                onComplete: () => {
                    this.startWorld(world.id);
                }
            });
        });

        return card;
    }

    startWorld(worldId) {
        // Store selected world in registry
        this.registry.set('selectedWorld', worldId);

        // Start the game scene
        this.scene.start('GameScene', { worldMap: worldId });
    }
}
