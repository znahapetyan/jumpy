import Phaser from 'phaser';

export default class Home extends Phaser.Scene {
    constructor() {
        super({
            key: 'Home',
        });
    }

    create() {
        const catchSound = this.sound.add('catchSound', {
            volume: 0.5,
        });

        this.add
            .rectangle(0, 0, this.game.renderer.width, this.game.renderer.height, 0x000000)
            .setOrigin(0, 0)
            .setAlpha(0.5);

        const playButton = this.add
            .bitmapText((this.game.renderer.width / 2) - 62, this.game.renderer.height / 2, 'scoreFont', 'PLAY')
            .setInteractive()
            .on('pointerup', () => {
                catchSound.play();

                this.scene.get('Game').setActive(true);
                this.scene.setVisible(false);
            });
    }
}
