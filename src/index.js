import * as serviceWorker from './serviceWorker';

import Phaser from 'phaser';

import { getRandomInt } from './utils';

import './index.scss';

import player from './assets/images/player.png';
import backgroundImage from './assets/images/background.jpg';

import scoreFont from './assets/fonts/retro/knight3.png';

import jumpSound from './assets/sound/Oawaaa_3.mp3';
import catchSound from './assets/sound/Vibrant_Game__Bling_1.mp3';
import backgroundMusic from './assets/sound/Wormholes.mp3';

const WIDTH = window.innerWidth; //800;
const HEIGHT = window.innerHeight; //600;

const PLAY_WIDTH = 280;
const ROW_DISTANCE = 250;

const BODY_LENGTH = 100;
// const BODY_WIDTH = 15;
const PLAYER_POS = {
    X: 0,
    Y: 0,
};
const PLAYER_HAND_RADIUS = 35;

const HOLD_RADIUS = 7;

const VIEW_OFFSET_X = 10;
const VIEW_OFFSET_Y = 10;

const ZOOM_NORMAL = 0.8;
// const ZOOM_FAR = 0.5;

class playGame extends Phaser.Scene {
    constructor() {
        super('PlayGame');

        this.config = config;

        this.holds = {};
        this.joint = null;
        this.isHolding = false;

        this.centerX = this.config.width / 2;
        this.centerY = this.config.height / 2;
        this.startY = 0.3 * this.config.height;

        this.score = 0;
        this.maxScore = 0;

        this.firstCollide = true;

        this.hsv = Phaser.Display.Color.HSVColorWheel();
        this.holdColorIndex = 0;
    }

    preload() {
        this.load.image('player', 'static/player.png');

        this.textures.addBase64('player', player);
        this.textures.addBase64('backgroundImage', backgroundImage);

        this.load.audio('jumpSound', [jumpSound]);
        this.load.audio('catchSound', [catchSound]);
        this.load.audio('backgroundMusic', [backgroundMusic]);

        this.textures.addBase64('scoreFont', scoreFont);

        const loadingBar = this.add.graphics({
            fillStyle: {
                color: 0xffffff,
            },
        });

        this.load
            .on('progress', (percent) => {
                loadingBar.fillRect(0, this.config.height / 2, this.config.width * percent, 50);
            })
            .on('complete', () => {
                loadingBar.setVisible(false);
            });
    }

    create() {
        this.setBackGround();

        this.setScoreText();

        this.cursors = this.input.keyboard.createCursorKeys();

        this.player = this.createPlayer();
        this.player.handSensor.onCollideCallback = this.onHoldCollide;

        this.setHolds();

        this.setCameras();

        this.jumpSound = this.sound.add('jumpSound', {
            volume: 0.5,
        });
        this.catchSound = this.sound.add('catchSound', {
            volume: 0.5,
        });

        this.sound.pauseOnBlur = false;
        this.sound.play('backgroundMusic', {
            volume: 0.3,
            loop: true,
        });
    }

    update() {
        if ((this.cursors.up.isDown || this.input.activePointer.isDown) && this.isHolding) {
            this.matter.world.removeConstraint(this.joint);
            this.isHolding = false;

            this.jumpSound.play();

            // this.actionCamera.zoomTo(ZOOM_FAR, 500, Phaser.Math.Easing.Cubic.InOut, true);
        }

        if (this.isHolding) {
            this.player.body.setAngularVelocity(0.2);
        }

        if (this.actionCamera.worldView.bottom + 2 < this.player.body.body.position.y) {
            this.resetGame();
        }

        if (!this.isInViewPort(this.actionCamera, this.player.body.body)) {
            const { y } = this.player.body.body.position;
            if (this.actionCamera.worldView.centerY > y) {
                this.actionCamera.pan(0, y, 50, Phaser.Math.Easing.Cubic.InOut, true);
            }
        }
    }

    resetGame = () => {
        // Remove old holds
        // Object.keys(this.holds).forEach((k) => {
        //     this.holds[k].forEach((h) => {
        //         h.destroy();
        //     });
        // });

        this.setHolds();

        this.matter.world.removeConstraint(this.joint);
        this.player.body.setAngularVelocity(0);
        this.player.body.setVelocity(0, 0);
        this.player.body.setPosition(PLAYER_POS.X, PLAYER_POS.Y);
        this.player.body.setAngle(0);
        // this.player.body.setStatic(true);

        this.isHolding = false;

        this.actionCamera.pan(0, 0, 0, Phaser.Math.Easing.Cubic.InOut, true);

        this.maxScore = Math.max(this.score, this.maxScore);

        this.setScore(0);

        this.firstCollide = true;
    };

    setBackGround = () => {
        this.backgroundImage = this.add.image(WIDTH / 2, HEIGHT / 2, 'backgroundImage');

        const { width, height } = this.backgroundImage;

        const screenRatio = WIDTH / HEIGHT;
        const imageRatio = width / height;

        let ratio = 0;
        if (screenRatio > imageRatio) {
            ratio = WIDTH / width;
        } else {
            ratio = HEIGHT / height;
        }

        this.backgroundImage.setScale(ratio, ratio);
    };

    setScoreText = () => {
        const config = {
            image: 'scoreFont',
            width: 31,
            height: 25,
            chars: Phaser.GameObjects.RetroFont.TEXT_SET6,
            charsPerRow: 10,
            spacing: { x: 1, y: 1 },
        };

        this.cache.bitmapFont.add('scoreFont', Phaser.GameObjects.RetroFont.Parse(this, config));

        this.currentScoreText = this.add.bitmapText(20, 20, 'scoreFont', 'SCORE:' + this.score);
        this.maxScoreText = this.add.bitmapText(20, 50, 'scoreFont', 'BEST SCORE:' + this.maxScore);

        this.currentScoreText.setScale(0.8);
        this.maxScoreText.setScale(0.8);
        // this.currentScoreText.setDepth(10000);
    };

    setScore = (score) => {
        this.score = score;

        this.currentScoreText.text = 'SCORE:' + this.score;
        this.maxScoreText.text = 'MAX SCORE:' + this.maxScore;
    };

    setCameras() {
        this.actionCamera = this.cameras.add(0, 0, this.config.width, this.config.height);
        this.actionCamera.pan(0, -0.3 * HEIGHT, 0);
        this.actionCamera.ignore([this.backgroundImage, this.currentScoreText, this.maxScoreText]);

        this.actionCamera.zoomTo(ZOOM_NORMAL, 300, Phaser.Math.Easing.Cubic.InOut, true);

        // const a = this.add.circle(400, 200, 80, 0x9966ff)

        // this.matter.add.circle(100, 100, 300, {
        //     isSensor: true,
        //     isStatic: true,
        //     render: {
        //         fillColor: 0x6666ff,
        //         fillOpacity: 1,
        //     },
        // });
        // console.log(
        //     'matter.add.circle',
        //     this.matter.add.polygon(0, 0, 12, 100, {
        //         isSensor: true,
        //         isStatic: true,
        //         render: {
        //             fillColor: 0x6666ff,
        //             fillOpacity: 1,
        //         },
        //     }),
        // );
        // console.log('matter.add.circle');
        // this.cameras.main.ignore([...Object.values(this.holds).flat(), this.player.body]);
    }

    setHolds = () => {
        Object.keys(this.holds).forEach((k) => {
            this.holds[k].forEach((h) => {
                h.destroy();
            });

            delete this.holds[k];
        });

        let rowLevel = 0;

        const top = -0.8 * this.config.height;

        while (rowLevel >= top) {
            if (!this.holds[rowLevel]) {
                this.holds[rowLevel] = this.createHoldRow(rowLevel);
            }

            rowLevel -= ROW_DISTANCE;
        }

        this.cameras.main.ignore([...Object.values(this.holds).flat(), this.player.body]);
    };

    addHolds = (camera) => {
        const bottom = camera.worldView.bottom;

        Object.keys(this.holds).forEach((k) => {
            if (k > bottom) {
                this.holds[k].forEach((h) => {
                    h.destroy();
                });

                delete this.holds[k];
            }
        });

        const top = camera.worldView.top - this.config.height;

        let rowLevel =
            Math.min(...Object.keys(this.holds).map((k) => parseInt(k, 10))) - ROW_DISTANCE;

        while (rowLevel >= top) {
            this.holds[rowLevel] = this.createHoldRow(rowLevel);

            rowLevel -= ROW_DISTANCE;
        }

        this.cameras.main.ignore([...Object.values(this.holds).flat(), this.player.body]);
    };

    createHoldRow = (y) => {
        const row = [];

        for (let x = -PLAY_WIDTH / 2; x <= PLAY_WIDTH / 2; x += PLAY_WIDTH / 2) {
            row.push(this.createHold(x, y));
        }

        return row;
    };

    createHold = (x, y) => {
        return this.matter.add.gameObject(this.add.circle(x, y, HOLD_RADIUS, 0xe6019b), {
            isStatic: true,
            isSensor: true,
        });

        // return this.matter.add.image(x, y, 'hold', null, {
        //     isStatic: true,
        //     isSensor: true,
        // });
    };

    createPlayer = () => {
        const playerGroup = this.matter.body.nextGroup(true);

        const body = this.matter.add.image(PLAYER_POS.X, PLAYER_POS.Y, 'player', null, {
            collisionFilter: { group: playerGroup },
            frictionAir: 0,
            density: 0.01,
            isSensor: true,
        });

        const handSensorX = PLAYER_POS.X;
        const handSensorY = PLAYER_POS.Y - BODY_LENGTH / 2;

        const handSensor = this.matter.add.circle(handSensorX, handSensorY, PLAYER_HAND_RADIUS, {
            collisionFilter: { group: playerGroup },
            isSensor: true,
            density: 0.000001,
        });

        this.matter.add.constraint(body, handSensor, 0, 1, {
            pointA: { x: 0, y: -BODY_LENGTH / 2 },
        });

        return {
            body,
            handSensor,
        };
    };

    updateHoldColor = () => {
        const color = this.hsv[getRandomInt(0, 360)].color;

        Object.keys(this.holds).forEach((k) => {
            this.holds[k].forEach((h) => {
                h.fillColor = color;
            });
        });
    };

    onHoldCollide = ({ bodyB }) => {
        if (!this.isHolding && !this.cursors.up.isDown && !this.input.activePointer.isDown) {
            const angle = Phaser.Math.DegToRad(this.player.body.angle);

            const handX = (BODY_LENGTH / 2) * Math.sin(angle);
            const handY = -(BODY_LENGTH / 2) * Math.cos(angle);

            this.joint = this.matter.add.constraint(this.player.body, bodyB, HOLD_RADIUS, 1, {
                pointA: { x: handX, y: handY },
            });

            this.isHolding = true;

            // this.actionCamera.zoomTo(ZOOM_NORMAL, 300, Phaser.Math.Easing.Cubic.InOut, true);

            const { y } = this.player.body.body.position;
            this.actionCamera.pan(0, y - 0.2 * HEIGHT, 300, Phaser.Math.Easing.Cubic.InOut, true);

            this.addHolds(this.actionCamera);

            this.catchSound.play();

            if (this.firstCollide) {
                this.firstCollide = false;
            } else {
                this.setScore(this.score + 1);
                this.updateHoldColor();
            }
        }
    };

    isInViewPort = (camera, obj, offset = { x: VIEW_OFFSET_X, y: VIEW_OFFSET_Y }) => {
        const { left, right, top, bottom } = camera.worldView;
        const { x, y } = obj.position;

        return (
            left + offset.x < x &&
            x < right - offset.x &&
            top + offset.y < y &&
            y < bottom - offset.y
        );
    };
}

const config = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
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
    scene: playGame,
};

new Phaser.Game(config);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
