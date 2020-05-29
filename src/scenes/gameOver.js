import Phaser from 'phaser';

export default class GameOver extends Phaser.Scene {
    constructor() {
        super({
            key: 'GameOver',
        });
    }

    create({ score }) {
        const catchSound = this.sound.add('catchSound', {
            volume: 0.5,
        });

        this.add
            .rectangle(0, 0, this.game.renderer.width, this.game.renderer.height, 0x000000)
            .setOrigin(0, 0)
            .setAlpha(0.5);

        this.add.bitmapText(
            this.game.renderer.width / 2 - 162,
            this.game.renderer.height / 2 - 50,
            'scoreFont',
            'SCORE: ' + score,
        );

        this.add
            .bitmapText(
                this.game.renderer.width / 2 - 162,
                this.game.renderer.height / 2,
                'scoreFont',
                'PLAY AGAIN',
            )
            .setInteractive()
            .on('pointerup', () => {
                catchSound.play();

                const gameScene = this.scene.get('Game');
                gameScene.setActive(true);
                this.scene.setVisible(false);
            });
    }
}
