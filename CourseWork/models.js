import {spriteManager} from "./spriteManager.js";
import {physicsManager} from "./physicsManager.js";
import {gameManager} from "./gameManager.js";
import {soundManager} from "./soundManager.js";

class Entity {
    constructor() {
        this.type = "defaultType"

        this.posX = 0
        this.posY = 0

        this.moveX = 0
        this.moveY = 0

        this.offsetX = 0
        this.offsetY = 0

        this.size = {width: 0, height: 0}
    }

    draw(ctx) {
        spriteManager.drawSprite(ctx, this.type, this.posX + this.offsetX, this.posY + this.offsetY, this.size)
    }

    update() {
        physicsManager.update(this)
    }

    kill() {
        gameManager.kill(this)
    }
}

// ---------------------

class Creature extends Entity {
    constructor(health, damage, speed, score) {
        super();

        this.health = health
        this.damage = damage
        this.speed = speed
        this.score = score
    }

    onTouchEntity(entity) {
        let type = Object.getPrototypeOf(Object.getPrototypeOf(entity)).constructor.name

        switch (type) {
            case "Treasure":
                soundManager.playInWorld("treasure", this.posX, this.posY)

                this.earnScore(entity.value)
                entity.kill()
                break

            case "Trap":
                this.takeDamage(entity.damage, entity)
                entity.kill()
                break

            case "HealthBonus":
                this.heal(entity.healing)
                entity.kill()
                break

            case "DamageBonus":
                this.upgradeWeapon(entity.strength)
                entity.kill()
                break

            case "Creature":
                this.takeDamage(entity.damage, entity)
                entity.takeDamage(this.damage, this)
                break

            case "System":
                if (this !== gameManager.player) {
                    return
                }

                entity.kill()

                setTimeout(() => {
                    gameManager.loadNextLevel()
                }, 400)
                break
        }
    }

    heal(healing) {
        soundManager.playInWorld("item", this.posX, this.posY)
        this.health += healing
    }

    takeDamage(damage, enemy) {
        this.health -= damage

        if (this.isDead()) {
            enemy.earnScore(this.score)
            soundManager.playInWorld("die", this.posX, this.posY)
            this.kill()

            if (this.type === "King") {
                setTimeout(() => {
                    gameManager.victory()
                }, 400)
            }

        } else {
            soundManager.playInWorld("hurt", this.posX, this.posY)
        }
    }

    earnScore(value) {
        this.score += value
    }

    upgradeWeapon(strength) {
        soundManager.playInWorld("item", this.posX, this.posY)
        this.damage += strength
    }

    isDead() {
        return this.health <= 0
    }
}

export class Player extends Creature {
    constructor() {
        super(10, 1, 1, 0);
    }
}

export class Slime extends Creature {
    constructor() {
        super(3, 1, 1, 5);
    }
}

export class Vampire extends Creature {
    constructor() {
        super(15, 3, 1, 50);
    }
}

export class Goblin extends Creature {
    constructor() {
        super(5, 1, 1, 0);
    }
}

export class Skeleton extends Creature {
    constructor() {
        super(7, 4, 1, 12);

    }
}

export class King extends Creature {
    constructor() {
        super(999, 999, 0, 999);
    }
}

// ---------------------

class Treasure extends Entity {
    constructor(value) {
        super()

        this.value = value
    }
}

export class Coin extends Treasure {
    constructor() {
        super(1);
    }
}

export class GoldBar extends Treasure {
    constructor() {
        super(10);
    }
}

// ---------------------

class Trap extends Entity {
    constructor(damage) {
        super();

        this.damage = damage
        this.score = 0
    }

    earnScore(value) {
        this.score += value
    }
}

export class BearTrap extends Trap {
    constructor() {
        super(2);
    }

}

// ---------------------

class HealthBonus extends Entity {
    constructor(healing) {
        super();

        this.healing = healing
    }
}

export class HealingPotion extends HealthBonus {
    constructor() {
        super(5);
    }
}

export class SuperHealingPotion extends HealthBonus {
    constructor() {
        super(999);
    }
}

// ---------------------

class DamageBonus extends Entity {
    constructor(strength) {
        super();

        this.strength = strength
    }
}

export class Sword extends DamageBonus {
    constructor() {
        super(1);
    }
}

export class SuperAxe extends DamageBonus {
    constructor() {
        super(999);
    }
}

// ---------------------

class System extends Entity {
    constructor() {
        super();
    }
}

export class Exit extends System {
    constructor() {
        super();
    }
}