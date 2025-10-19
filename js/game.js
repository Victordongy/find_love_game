// Main game script
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded - initializing game...");
    
    // Check if Phaser is loaded
    if (typeof Phaser === 'undefined') {
        console.error("ERROR: Phaser library not loaded!");
        document.getElementById('game-container').innerHTML = '<div style="color: red; padding: 20px;">ERROR: Phaser library failed to load</div>';
        return;
    }
    
    console.log("Phaser loaded successfully, version:", Phaser.VERSION);
    
    // Check if gameConfig is available
    if (typeof gameConfig === 'undefined') {
        console.error("ERROR: Game config not found!");
        document.getElementById('game-container').innerHTML = '<div style="color: red; padding: 20px;">ERROR: Game config not found</div>';
        return;
    }
    
    if (typeof BaseWorldScene === 'undefined') {
        console.error("ERROR: BaseWorldScene not loaded!");
        document.getElementById('game-container').innerHTML = '<div style="color: red; padding: 20px;">ERROR: Base scene not loaded</div>';
        return;
    }

    if (typeof Hud === 'undefined') {
        console.error("ERROR: Hud not loaded!");
        document.getElementById('game-container').innerHTML = '<div style="color: red; padding: 20px;">ERROR: HUD not loaded</div>';
        return;
    }

    // Check if all scene classes are loaded
    const sceneClasses = [BootScene, PreloadScene, MenuScene, GameScene, EndScene];
    const sceneNames = ['BootScene', 'PreloadScene', 'MenuScene', 'GameScene', 'EndScene'];
    
    for (let i = 0; i < sceneClasses.length; i++) {
        if (typeof sceneClasses[i] === 'undefined') {
            console.error(`ERROR: ${sceneNames[i]} not loaded!`);
            document.getElementById('game-container').innerHTML = `<div style="color: red; padding: 20px;">ERROR: ${sceneNames[i]} not loaded</div>`;
            return;
        }
    }
    
    console.log("All scenes loaded successfully");
    
    // Build the complete config with scenes
    const config = {
        ...gameConfig,
        scene: [
            BootScene,
            PreloadScene,
            MenuScene,
            GameScene,
            EndScene
        ]
    };
    
    console.log("Config built successfully");
    
    try {
        // Create game instance
        const game = new Phaser.Game(config);
        console.log("Phaser game instance created successfully!");
        
        // Handle mobile controls if needed
        createMobileControls();
        
        console.log("Find Love game initialized successfully!");
    } catch (error) {
        console.error("ERROR creating Phaser game:", error);
        document.getElementById('game-container').innerHTML = `<div style="color: red; padding: 20px;">ERROR: ${error.message}</div>`;
    }
});

// Create mobile controls if on touch device
function createMobileControls() {
    // Check if we're on a touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints) {
        const gameContainer = document.getElementById('game-container');
        
        // Create mobile control buttons
        const mobileControls = document.createElement('div');
        mobileControls.className = 'mobile-controls';
        
        const buttonUp = createButton('↑');
        const buttonLeft = createButton('←');
        const buttonDown = createButton('↓');
        const buttonRight = createButton('→');
        
        mobileControls.appendChild(buttonLeft);
        mobileControls.appendChild(buttonUp);
        mobileControls.appendChild(buttonDown);
        mobileControls.appendChild(buttonRight);
        
        gameContainer.appendChild(mobileControls);
        
        // Set up button press logic
        setupTouchControls(buttonUp, 'up');
        setupTouchControls(buttonLeft, 'left');
        setupTouchControls(buttonDown, 'down');
        setupTouchControls(buttonRight, 'right');
    }
}

function createButton(text) {
    const button = document.createElement('button');
    button.innerText = text;
    return button;
}

function setupTouchControls(button, direction) {
    // Send key events to Phaser
    button.addEventListener('touchstart', function(e) {
        e.preventDefault();
        // Emit synthetic keyboard event that Phaser will pick up
        simulateKeyEvent(direction, true);
    });
    
    button.addEventListener('touchend', function(e) {
        e.preventDefault();
        // Release key
        simulateKeyEvent(direction, false);
    });
}

function simulateKeyEvent(direction, isDown) {
    // Map direction to key code
    const keyCode = {
        'up': 38, // Arrow Up
        'left': 37, // Arrow Left
        'down': 40, // Arrow Down
        'right': 39 // Arrow Right
    }[direction];
    
    // Create synthetic keyboard event
    const eventName = isDown ? 'keydown' : 'keyup';
    const event = new KeyboardEvent(eventName, {
        bubbles: true,
        cancelable: true,
        keyCode: keyCode
    });
    
    document.dispatchEvent(event);
}
