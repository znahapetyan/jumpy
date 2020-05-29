import Phaser from 'phaser';

import LoadingScene from 'scenes/loading';
import GameScene from 'scenes/game';
import HomeScene from 'scenes/home';
import GameOverScene from 'scenes/gameOver';

import './index.scss';

import * as serviceWorker from './serviceWorker';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'matter',
        matter: {
            gravity: {
                y: 0.8,
            },
            // debug: true,
        },
    },
    audio: {
        context: new window.AudioContext(),
    },
    scene: [LoadingScene, GameScene, HomeScene, GameOverScene],
};

new Phaser.Game(config);

serviceWorker.unregister();
