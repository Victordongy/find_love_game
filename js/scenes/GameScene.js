class GameScene extends BaseWorldScene {
    constructor() {
        super('GameScene', 'world1');
    }

    init(data) {
        // If a worldMap is specified in the data, use it; otherwise use default
        if (data && data.worldMap) {
            this.currentMap = data.worldMap;
        }
        // Call parent init
        super.init(data);
    }
}

