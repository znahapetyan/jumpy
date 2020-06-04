import Phaser from 'phaser';

export default class GameOver extends Phaser.Scene {
    constructor() {
        super({
            key: 'GameOver',
        });
    }

    create({ score, bestScore }) {
        const catchSound = this.sound.add('catchSound', {
            volume: 0.5,
        });

        this.add
            .rectangle(0, 0, this.game.renderer.width, this.game.renderer.height, 0x000000)
            .setOrigin(0, 0)
            .setAlpha(0.5);

        const scoreText = this.add.bitmapText(0, 0, 'scoreFont', 'SCORE: ' + score, 50);
        const scoreTextBounds = scoreText.getTextBounds(true);
        scoreText.setPosition(
            this.game.renderer.width / 2 - scoreTextBounds.global.width / 2,
            this.game.renderer.height / 2 - 180,
        );

        const bestText = this.add.bitmapText(0, 0, 'scoreFont', 'BEST SCORE: ' + bestScore, 50);
        const bestTextBounds = bestText.getTextBounds(true);
        bestText.setPosition(
            this.game.renderer.width / 2 - bestTextBounds.global.width / 2,
            this.game.renderer.height / 2 - 120,
        );

        const playText = this.add
            .bitmapText(0, 0, 'scoreFont', 'PLAY')
            .setInteractive()
            .on('pointerup', () => {
                catchSound.play();

                const gameScene = this.scene.get('Game');
                gameScene.setActive(true);
                this.scene.setVisible(false);
            });
        const playTextBounds = playText.getTextBounds(true);
        playText.setPosition(
            this.game.renderer.width / 2 - playTextBounds.global.width / 2,
            this.game.renderer.height / 2 + 20,
        );
    }
}
