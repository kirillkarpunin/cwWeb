import {mapManager} from "./mapManager.js";
import {spriteManager} from "./spriteManager.js";
import {eventManager} from "./eventManager.js";
import {aiManager} from "./aiManager.js"
import {BearTrap, Coin, Goblin, GoldBar, HealingPotion, Player, Skeleton, Slime, Sword, Vampire, Exit, SuperHealingPotion, SuperAxe, King} from "./models.js"
import {canvas, ctx, endGame} from "./game.js";
import {soundManager} from "./soundManager.js";

export let gameManager = {
    factory: {},
    entities: [],
    player: null,
    loop: null,

    initPlayer: function (entity) {
        this.player = entity
        this.player.isMoving = false
    },

    kill: function (entity) {
        let index = this.entities.indexOf(entity)
        if (index > -1) {
            this.entities.splice(index, 1)
        }
    },

    draw: function (ctx) {
        mapManager.drawMap(ctx)

        for (const entity of this.entities) {
            entity.draw(ctx)
        }

        mapManager.drawMap(ctx, true)

        if (this.player) {
            this.drawInfo(ctx, this.player, 50, 50)

            let creature = mapManager.getCreatureNearby(this.player)
            if (creature) {
                this.drawInfo(ctx, creature, 300, 90)
            }
        }
    },

    drawInfo: function (ctx, entity, xCoordOnCanvas, yCoordOnCanvas) {
        ctx.font = "30px Arial"
        ctx.fillStyle = "black"
        ctx.strokeStyle = "white"

        if (entity !== this.player) {
            ctx.fillText(entity.type, xCoordOnCanvas, yCoordOnCanvas - 40)
            ctx.strokeText(entity.type, xCoordOnCanvas, yCoordOnCanvas - 40)
        }

        ctx.fillText(`Health: ${entity.health}`, xCoordOnCanvas, yCoordOnCanvas)
        ctx.fillText(`Score: ${entity.score}`, xCoordOnCanvas, yCoordOnCanvas + 30)
        ctx.fillText(`Damage: ${entity.damage}`, xCoordOnCanvas, yCoordOnCanvas + 60)
        ctx.fill()

        ctx.strokeText(`Health: ${entity.health}`, xCoordOnCanvas, yCoordOnCanvas)
        ctx.strokeText(`Score: ${entity.score}`, xCoordOnCanvas, yCoordOnCanvas + 30)
        ctx.strokeText(`Damage: ${entity.damage}`, xCoordOnCanvas, yCoordOnCanvas + 60)

        ctx.stroke()
    },

    update: function () {
        if (this.player === null) {
            return
        }

        if (this.player.isDead()) {
            this.gameOver()
        }

        if (!this.player.isMoving) {
            if (eventManager.actions["Up"]) {
                eventManager.actions["Up"] = false
                this.player.moveY = -1

                this.player.isMoving = true

            } else if (eventManager.actions["Down"]) {
                eventManager.actions["Down"] = false
                this.player.moveY = 1

                this.player.isMoving = true

            } else if (eventManager.actions["Left"]) {
                eventManager.actions["Left"] = false
                this.player.moveX = -1

                this.player.isMoving = true

            } else if (eventManager.actions["Right"]) {
                eventManager.actions["Right"] = false
                this.player.moveX = 1

                this.player.isMoving = true

            } else {
                this.player.isMoving = false
            }

            if (this.player.isMoving) {
                setTimeout(() => {
                    this.player.isMoving = false
                }, 200)
            }
        } else {
            if (!eventManager.actions["Up"] && !eventManager.actions["Down"] && !eventManager.actions["Left"] && !eventManager.actions["Right"]) {
                this.player.isMoving = false
            }
        }

        for (const entity of this.entities) {
            try {
                entity.update()
            } catch (e) {
                console.log(`Error updating ${entity.type}: ${e}`)
            }
        }

        mapManager.centerView(this.player.posX, this.player.posY)

        this.draw(ctx)

        for (const entity of this.entities) {
            entity.moveX = 0
            entity.moveY = 0
            entity.offsetX = 0
            entity.offsetY = 0
        }
    },

    loadAll: function () {
        mapManager.view.width = canvas.width
        mapManager.view.height = canvas.height

        mapManager.loadMap("level1.json");
        spriteManager.loadAtlas("sprites.json", "../Texture/spritesheet.png")

        this.factory["Player"] = new Player()
        this.factory["BearTrap"] = new BearTrap()
        this.factory["Coin"] = new Coin()
        this.factory["GoldBar"] = new GoldBar()
        this.factory["HealingPotion"] = new HealingPotion()
        this.factory["Sword"] = new Sword()
        this.factory["Slime"] = new Slime()
        this.factory["Vampire"] = new Vampire()
        this.factory["Goblin"] = new Goblin()
        this.factory["Skeleton"] = new Skeleton()
        this.factory["Exit"] = new Exit()
        this.factory["SuperHealingPotion"] = new SuperHealingPotion()
        this.factory["SuperAxe"] = new SuperAxe()
        this.factory["King"] = new King()

        mapManager.parseEntities()

        gameManager.draw(ctx)

        eventManager.setup()
        soundManager.init()

        soundManager.play("ambient", {isLooped: true, volume: 0.85})
    },

    play: function () {
        this.loadAll()
        aiManager.startAI()

        this.loop = setInterval(() => {
            this.update()
        }, 50)
    },

    loadNextLevel: function () {
        soundManager.stopAll()
        soundManager.play("next")

        let playerData = this.player
        this.entities = []

        mapManager.resetMap()
        mapManager.loadMap("level2.json")
        mapManager.parseEntities()

        this.restorePlayerData(playerData)

        soundManager.play("ambient2", {isLooped: true, volume: 0.85})
    },

    restorePlayerData: function(data) {
        if (!mapManager.allImagesLoaded || !mapManager.jsonLoaded) {
            setTimeout(() => {
                this.restorePlayerData(data)
            }, 100)
        }

        this.player.health = data.health
        this.player.score = data.score
        this.player.damage = data.damage
    },

    gameOver: function () {
        soundManager.stopAll()
        soundManager.play("gameover")

        clearInterval(this.loop)
        aiManager.stopAI()

        endGame()
    },

    victory: function () {
        soundManager.stopAll()
        soundManager.play("victory")

        clearInterval(this.loop)
        aiManager.stopAI()

        endGame()
    }
}