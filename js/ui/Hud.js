class Hud {
    constructor(scene, totalHearts) {
        this.scene = scene;
        this.totalHearts = totalHearts;

        this.heartsCollectedText = scene.add.text(16, 16, this.buildHeartLabel(0), {
            fontSize: '24px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });
        this.heartsCollectedText.setScrollFactor(0);

        this.instructionsText = scene.add.text(16, 550, '←→=Walk | ↑=Jump | ↓=Small hop | J=Force Jump | SPACE=Reset', {
            fontSize: '16px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 3
        });
        this.instructionsText.setScrollFactor(0);
    }

    buildHeartLabel(collected) {
        if (typeof this.totalHearts === 'number' && this.totalHearts > 0) {
            return `Hearts: ${collected}/${this.totalHearts}`;
        }
        return `Hearts: ${collected}`;
    }

    updateHearts(collected, totalHearts = this.totalHearts) {
        this.totalHearts = totalHearts;
        this.heartsCollectedText.setText(this.buildHeartLabel(collected));
    }
}

