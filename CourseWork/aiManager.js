import {gameManager} from "./gameManager.js";
import {mapManager} from "./mapManager.js";

export let aiManager = {
    loop: null,

    startAI: function () {
        this.loop = setInterval(() => {
            this.setNextActions()
        }, 750)
    },

    stopAI: function () {
        clearInterval(this.loop)
    },

    setNextActions: function () {
        for (const entity of gameManager.entities) {
            let type = Object.getPrototypeOf(Object.getPrototypeOf(entity)).constructor.name

            if (entity !== gameManager.player && type === "Creature") {
                switch (entity.type) {
                    case "Slime":
                        this.moveRandom(entity)
                        break

                    case "Vampire":
                        this.moveTowards(entity, gameManager.player)
                        break

                    case "Goblin":
                        let treasure = this.nearestTreasure(entity.posX, entity.posY)
                        if (treasure) {
                            this.moveTowards(entity, treasure)
                        } else {
                            this.moveRandom(entity)
                        }
                        break

                    case "Skeleton":
                        this.moveRandom(entity)
                        break
                }
            }
        }
    },

    moveRandom: function (entity) {
        let k = this.getRandomNumber(0, 3)

        switch (k) {
            case 0:
                entity.moveX = 1
                return
            case 1:
                entity.moveY = 1
                return
            case 2:
                entity.moveX = -1
                return
            case 3:
                entity.moveY = -1
                return
        }
    },

    moveTowards: function (entity, targetEntity) {
        if (entity.path === undefined || entity.path.x !== targetEntity.posX || entity.path.y !== targetEntity.posY) {
            entity.path = this.aStar(entity, targetEntity)
        }

        let newPosition
        if (entity.path.length > 1) {
            newPosition = entity.path.shift()
        } else {
            newPosition = entity.path[0]
        }

        if (entity.posX < newPosition.x) {
            entity.moveX = 1
        } else if (entity.posX > newPosition.x) {
            entity.moveX = -1
        } else if (entity.posY < newPosition.y) {
            entity.moveY = 1
        } else if (entity.posY > newPosition.y) {
            entity.moveY = -1
        }
    },

    aStar: function (entity, targetEntity) {
        let srcX = entity.posX
        let srcY = entity.posY

        let destX = targetEntity.posX
        let destY = targetEntity.posY

        let nodesToCheck = []
        let checkedPositions = new Set()

        let srcNode = new Node(srcX, srcY, 0, this.heuristicFunction(srcX, srcY, destX, destY))
        nodesToCheck.push(srcNode)

        while (nodesToCheck.length > 0) {
            if (checkedPositions.size > 10000) {
                console.log("a* overload")
                return [{x: gameManager.player.posX, y: gameManager.player.posY}]
            }

            nodesToCheck.sort((a, b) => {
                return a.f - b.f
            })

            let currNode = nodesToCheck.shift()
            checkedPositions.add(JSON.stringify({x: currNode.posX, y: currNode.posY}))

            if (currNode.posX === destX && currNode.posY === destY) {
                let path = []

                let tempNode = currNode
                while (tempNode) {
                    path.push({x: tempNode.posX, y: tempNode.posY})
                    tempNode = tempNode.parent
                }

                path = path.reverse()
                path.shift()
                return path
            }

            let positions = this.getAvailablePositions(currNode.posX, currNode.posY, entity)

            for (const position of positions) {
                if (checkedPositions.has(JSON.stringify(position))) {
                    continue
                }

                let g = currNode.g + 1
                let h = this.heuristicFunction(position.x, position.y, destX, destY)

                let neighbourNode = new Node(position.x, position.y, g, h, currNode)

                let existingNode = nodesToCheck.find(node => node.posX === neighbourNode.posX && node.posY === neighbourNode.posY)
                if (existingNode && existingNode.g <= neighbourNode.g) {
                    continue
                }

                nodesToCheck.push(neighbourNode)
            }
        }

        return []
    },

    nearestTreasure: function (posX, posY) {
        let treasure
        let distance

        for (const entity of gameManager.entities) {
            let type = Object.getPrototypeOf(Object.getPrototypeOf(entity)).constructor.name

            if (type !== "Treasure") {
                continue
            }

            let entityDistance = this.heuristicFunction(posX, posY, entity.posX, entity.posY)
            if (treasure === undefined || entityDistance < distance) {
                treasure = entity
                distance = entityDistance
            }
        }

        return treasure
    },

    heuristicFunction: function (aX, aY, bX, bY) {
        return Math.abs(aX - bX) + Math.abs(aY - bY)
    },

    getAvailablePositions: function (posX, posY, entity) {
        let directions = [
            {moveX: 0, moveY: 1},
            {moveX: 0, moveY: -1},
            {moveX: 1, moveY: 0},
            {moveX: -1, moveY: 0}
        ]

        let positions = []
        for (const d of directions) {
            let newPosX = posX + d.moveX * entity.speed * entity.size.width
            let newPosY = posY + d.moveY * entity.speed * entity.size.height

            if (!mapManager.isObstacleTile(newPosX, newPosY)) {
                positions.push({x: newPosX, y: newPosY})
            }
        }

        return positions
    },

    getRandomNumber: function (a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a
    }
}

class Node {
    constructor(posX, posY, g = 0, h = 0, parent = null) {
        this.posX = posX
        this.posY = posY
        this.g = g
        this.h = h
        this.f = this.g + this.h
        this.parent = parent
    }
}