class CollisionSystem {
    constructor() {
        this.bullets = [];
        this.tanks = [];
        this.enemies = [];
        this.powerUps = [];
    }

    update(bullets, tanks, enemies, powerUps, map, game) {
        this.bullets = bullets;
        this.tanks = tanks;
        this.enemies = enemies;
        this.powerUps = powerUps;

        this.checkBulletCollisions(map, game);
        this.checkTankCollisions(game);
        this.checkPowerUpCollisions(game);
    }

    checkBulletCollisions(map, game) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (!bullet.active) continue;

            if (map.checkBulletCollision(bullet)) {
                bullet.onHit();
                continue;
            }

            let hit = false;
            const allTanks = [...this.tanks, ...this.enemies];

            for (const tank of allTanks) {
                if (!tank.active || tank === bullet.owner) continue;

                if (checkCollision(bullet.getBounds(), tank.getBounds())) {
                    tank.takeDamage(bullet.damage);
                    bullet.onHit();
                    hit = true;

                    if (bullet.owner && bullet.owner.isPlayer && !tank.active) {
                        game.addScore(tank instanceof Tank ? 100 : 50);
                    }

                    break;
                }
            }

            if (hit) {
                this.bullets.splice(i, 1);
            }
        }
    }

    checkTankCollisions(game) {
        // 坦克之间允许重叠，不再进行碰撞分离
        // 这样可以避免重叠时的抽搐现象
    }

    checkPowerUpCollisions(game) {
        const player = game.player;
        if (!player || !player.active) return;

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (!powerUp.active) continue;

            if (checkCollision(player.getBounds(), powerUp.getBounds())) {
                powerUp.apply(player);
                powerUp.active = false;
                this.powerUps.splice(i, 1);
                game.addScore(25);
            }
        }
    }

    cleanUp() {
        this.bullets = this.bullets.filter(bullet => bullet.active);
        this.tanks = this.tanks.filter(tank => tank.active);
        this.enemies = this.enemies.filter(enemy => enemy.active);
        this.powerUps = this.powerUps.filter(powerUp => powerUp.active);
    }
}