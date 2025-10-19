// Game configuration template
// Note: The actual config with scenes will be built in game.js after scenes are loaded
const gameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    pixelArt: true, // crisp pixels (sets antialias=false & roundPixels=true) - like your example
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};
