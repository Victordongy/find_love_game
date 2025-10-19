class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        console.log('BootScene: Starting preload...');
        // Load minimal assets needed for the loading screen
        this.load.image('loading-background', 'assets/images/loading-background.png');
        this.load.image('loading-bar', 'assets/images/loading-bar.png');
        
        // Add error handlers for missing assets
        this.load.on('loaderror', (fileObj) => {
            console.warn('BootScene - Error loading:', fileObj.key);
        });
    }

    create() {
        console.log('BootScene: Transitioning to PreloadScene');
        this.scene.start('PreloadScene');
    }
}
