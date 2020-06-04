import Phaser from 'phaser';

import { getRandomInt } from 'utils';

export default class Game extends Phaser.Scene {
    constructor() {
        super({
            key: 'Game',
        });
    }

    init() {
        this.isActive = false;

        this.holds = {};
        this.joint = null;
        this.isHolding = false;

        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore'), 0) || 0;

        this.firstCollide = true;

        this.hsv = Phaser.Display.Color.HSVColorWheel();

        this.config = {
            playWidth: 280,
            rowDistance: 250,
            body: {
                height: 100,
                width: 15,
            },
            playerPos: {
                X: 0,
                Y: 0,
            },
            playerHandRadius: 35,
            holdRadius: 7,
            viewOffsetX: 10,
            viewOffsetY: 10,
            zoomNormal: 0.8,
        };
    }

    create() {
        this.setBackGround();

        this.setScoreText();

        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.player = this.createPlayer();

        this.setHolds();

        this.tweens.addCounter({
            from: 0,
            to: 359,
            duration: 2000,
            repeat: -1,
            onUpdate: (tween) => {
                const color = this.hsv[Math.floor(tween.getValue())].color;

                Object.keys(this.holds).forEach((k) => {
                    this.holds[k].forEach((h) => {
                        h.strokeColor = color;
                    });
                });
            },
        });

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
        if (
            this.isActive &&
            (this.spacebar.isDown || this.input.activePointer.isDown) &&
            this.isHolding
        ) {
            this.matter.world.removeConstraint(this.joint);
            this.isHolding = false;

            const force = Math.max(0.15 - this.score * (0.15 / 30), 0);

            const angle = Phaser.Math.DegToRad(this.player.body.angle);
            this.player.body.applyForce({
                x: -force * Math.cos(angle),
                y: -force * Math.sin(angle),
            });

            this.jumpSound.play();
        }

        if (this.isHolding) {
            const velocity = Math.min(0.13 + this.score * (0.07 / 30), 0.2);
            this.player.body.setAngularVelocity(velocity);
        }

        if (this.actionCamera.worldView.bottom + 2 < this.player.body.body.position.y) {
            this.handleGameOver();
        }

        if (!this.isInViewPort(this.actionCamera, this.player.body.body)) {
            const { y } = this.player.body.body.position;
            if (this.actionCamera.worldView.centerY > y) {
                this.actionCamera.pan(0, y, 50, Phaser.Math.Easing.Cubic.InOut, true);
            }
        }
    }

    setActive(isActive) {
        this.isActive = isActive;
    }

    handleGameOver = () => {
        this.bestScore = Math.max(this.score, this.bestScore);
        localStorage.setItem('bestScore', this.bestScore);

        this.setActive(false);
        this.scene.run('GameOver', {
            score: this.score,
            bestScore: this.bestScore,
        });

        this.resetGame();
    };

    resetGame = () => {
        this.setHolds();

        this.matter.world.removeConstraint(this.joint);
        this.player.body.setAngularVelocity(0);
        this.player.body.setVelocity(0, 0);
        this.player.body.setPosition(this.config.playerPos.X, this.config.playerPos.Y);
        this.player.body.setAngle(0);

        this.isHolding = false;

        this.actionCamera.setScroll(
            -this.game.renderer.width / 2,
            -0.7 * this.game.renderer.height,
        );

        this.setScore(0);

        this.firstCollide = true;
    };

    setBackGround = () => {
        const { width, height } = this.game.renderer;

        this.backgroundImage = this.add.image(width / 2, height / 2, 'backgroundImage');

        const { width: bWidth, height: bHeight } = this.backgroundImage;

        const screenRatio = width / height;
        const imageRatio = bWidth / bHeight;

        let ratio = 0;
        if (screenRatio > imageRatio) {
            ratio = width / bWidth;
        } else {
            ratio = height / bHeight;
        }

        this.backgroundImage.setScale(ratio, ratio);
    };

    setScoreText = () => {
        this.currentScoreText = this.add.bitmapText(20, 20, 'mainFont', '', 40);
        this.bestScoreText = this.add.bitmapText(20, 50, 'mainFont', '', 40);

        this.setScore(0);

        this.currentScoreText.setScale(0.8);
        this.bestScoreText.setScale(0.8);
    };

    setScore = (score) => {
        this.score = score;

        this.currentScoreText.text = 'SCORE: ' + this.score;
        this.bestScoreText.text = 'BEST SCORE: ' + this.bestScore;
    };

    setCameras() {
        const { width, height } = this.game.renderer;

        this.actionCamera = this.cameras.add(0, 0, width, height);
        this.actionCamera.setScroll(0, -0.2 * height);
        this.actionCamera.ignore([this.backgroundImage, this.currentScoreText, this.bestScoreText]);

        this.actionCamera.zoomTo(this.config.zoomNormal, 300, Phaser.Math.Easing.Cubic.InOut, true);
    }

    setHolds = () => {
        Object.keys(this.holds).forEach((k) => {
            this.holds[k].forEach((h) => {
                h.destroy();
            });

            delete this.holds[k];
        });

        let rowLevel = 0;

        const top = -0.8 * this.game.renderer.height;

        while (rowLevel >= top) {
            if (!this.holds[rowLevel]) {
                this.holds[rowLevel] = this.createHoldRow(rowLevel);
            }

            rowLevel -= this.config.rowDistance;
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

        const top = camera.worldView.top - this.game.renderer.height;

        let rowLevel =
            Math.min(...Object.keys(this.holds).map((k) => parseInt(k, 10))) -
            this.config.rowDistance;

        while (rowLevel >= top) {
            this.holds[rowLevel] = this.createHoldRow(rowLevel);

            rowLevel -= this.config.rowDistance;
        }

        this.cameras.main.ignore([...Object.values(this.holds).flat(), this.player.body]);
    };

    createHoldRow = (y) => {
        const row = [];

        for (
            let x = -this.config.playWidth / 2;
            x <= this.config.playWidth / 2;
            x += this.config.playWidth / 2
        ) {
            row.push(this.createHold(x, y));
        }

        return row;
    };

    createHold = (x, y) => {
        return this.matter.add.gameObject(
            this.add.circle(x, y, this.config.holdRadius, 0xffffff).setStrokeStyle(4, 0xffffff),
            {
                isStatic: true,
                isSensor: true,
                level: Math.abs(y / this.config.rowDistance),
            },
        );
    };

    createPlayer = () => {
        const playerGroup = this.matter.body.nextGroup(true);

        const body = this.matter.add.image(
            this.config.playerPos.X,
            this.config.playerPos.Y,
            'player',
            null,
            {
                collisionFilter: { group: playerGroup },
                frictionAir: 0,
                density: 0.01,
                isSensor: true,
            },
        );

        const handSensor = this.matter.add.circle(
            this.config.playerPos.X,
            this.config.playerPos.Y - this.config.body.height / 2,
            this.config.playerHandRadius,
            {
                collisionFilter: { group: playerGroup },
                isSensor: true,
                density: 0.000001,
            },
        );

        handSensor.onCollideCallback = this.onHoldCollide;

        this.matter.add.constraint(body, handSensor, 0, 1, {
            pointA: { x: 0, y: -this.config.body.height / 2 },
        });

        return {
            body,
        };
    };

    updateHoldColor = () => {
        const color = this.hsv[getRandomInt(0, 359)].color;

        Object.keys(this.holds).forEach((k) => {
            this.holds[k].forEach((h) => {
                h.fillColor = color;
            });
        });
    };

    onHoldCollide = ({ bodyB }) => {
        if (!this.isHolding && !this.spacebar.isDown && !this.input.activePointer.isDown) {
            const angle = Phaser.Math.DegToRad(this.player.body.angle);

            const handX = (this.config.body.height / 2) * Math.sin(angle);
            const handY = -(this.config.body.height / 2) * Math.cos(angle);

            this.joint = this.matter.add.constraint(
                this.player.body,
                bodyB,
                this.config.holdRadius,
                1,
                {
                    pointA: { x: handX, y: handY },
                },
            );

            this.isHolding = true;

            const { y } = this.player.body.body.position;
            this.actionCamera.pan(
                0,
                y - 0.2 * this.game.renderer.height,
                this.firstCollide ? 0 : 300,
                Phaser.Math.Easing.Cubic.InOut,
                true,
            );

            this.addHolds(this.actionCamera);

            if (this.firstCollide) {
                this.firstCollide = false;
            } else {
                this.catchSound.play();

                this.setScore(Math.max(bodyB.level, this.score));

                // this.updateHoldColor();
            }
        }
    };

    isInViewPort = (
        camera,
        obj,
        offset = { x: this.config.viewOffsetX, y: this.config.viewOffsetY },
    ) => {
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
