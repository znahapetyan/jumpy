import Phaser from 'phaser';

import player from 'assets/images/player.png';
import backgroundImage from 'assets/images/background.jpg';

import scoreFont from 'assets/fonts/retro/knight3.png';

import jumpSound from 'assets/sound/Oawaaa_3.mp3';
import catchSound from 'assets/sound/Vibrant_Game__Bling_1.mp3';
import backgroundMusic from 'assets/sound/Wormholes.mp3';

export default class Loading extends Phaser.Scene {
    constructor() {
        super({
            key: 'Loading',
        });
    }

    preload() {
        this.load.image('player', 'static/player.png');

        this.textures.addBase64('player', player);
        this.textures.addBase64('backgroundImage', backgroundImage);

        this.load.audio('jumpSound', [jumpSound]);
        this.load.audio('catchSound', [catchSound]);
        this.load.audio('backgroundMusic', [backgroundMusic]);

        this.textures.addBase64('scoreFont', scoreFont);
        this.cache.bitmapFont.add(
            'scoreFont',
            Phaser.GameObjects.RetroFont.Parse(this, {
                image: 'scoreFont',
                width: 31,
                height: 25,
                chars: Phaser.GameObjects.RetroFont.TEXT_SET6,
                charsPerRow: 10,
                spacing: { x: 1, y: 1 },
            }),
        );

        const loadingBar = this.add.graphics({
            fillStyle: {
                color: 0xe6019b,
            },
        });

        this.load.on('progress', (percent) => {
            loadingBar.fillRect(
                0,
                this.game.renderer.height / 2,
                this.game.renderer.width * percent,
                50,
            );
        });
    }

    create() {
        this.scene.start('Home');
        this.scene.start('Game');
        this.scene.remove();
    }
}
