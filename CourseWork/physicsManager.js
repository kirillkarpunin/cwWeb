import {mapManager} from "./mapManager.js";
import {soundManager} from "./soundManager.js";

let offsetPx = 15

export let physicsManager = {
    update: function (entity) {
        if (entity.moveX === 0 && entity.moveY === 0) {
            return "stop"
        }

        let newPosX = entity.posX + entity.moveX * entity.speed * entity.size.width
        let newPosY = entity.posY + entity.moveY * entity.speed * entity.size.height

        let isObstacle = mapManager.isObstacleTile(newPosX, newPosY)
        if (isObstacle) {

            entity.offsetX = entity.moveX * offsetPx
            entity.offsetY = entity.moveY * offsetPx

            soundManager.playInWorld("collision", entity.posX, entity.posY)

            return "break"
        }

        let entityAt = mapManager.entityAtTile(entity, newPosX, newPosY)
        if (entityAt !== null && entity.onTouchEntity) {
            entity.onTouchEntity(entityAt)
        }

        entityAt = mapManager.entityAtTile(entity, newPosX, newPosY)
        if (entityAt !== null) {

            entity.offsetX = entity.moveX * offsetPx
            entity.offsetY = entity.moveY * offsetPx

            return "break"
        }

        soundManager.playInWorld("walk", entity.posX, entity.posY)

        entity.posX = Math.max(Math.min(newPosX, mapManager.mapSizeInPx.width - entity.size.width), 0)
        entity.posY = Math.max(Math.min(newPosY, mapManager.mapSizeInPx.height - entity.size.height), 0)

        return "move"
    }
}