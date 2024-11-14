import {mapManager} from "./mapManager.js";

export let spriteManager = {
    image: new Image(),
    sprites: [],

    imageLoaded: false,
    jsonLoaded: false,

    loadAtlas: function (atlasJSON, atlasImagePath) {
        let req = new XMLHttpRequest()

        req.onreadystatechange = () => {
            if (req.readyState === 4 && req.status === 200) {
                this.parseAtlas(req.responseText)
            }
        }

        req.open("GET", atlasJSON, true)
        req.send()

        this.loadImage(atlasImagePath)
    },

    parseAtlas: function (atlasStr) {
        let atlasJSON = JSON.parse(atlasStr)

        for (const name in atlasJSON.frames) {
            let sprite = atlasJSON.frames[name].frame

            this.sprites.push({
                name: name,
                xCoordInAtlas: sprite.x,
                yCoordInAtlas: sprite.y,
                size: {width: sprite.w, height: sprite.h}
            })
        }

        this.jsonLoaded = true
    },

    loadImage(atlasImagePath) {
        this.image.onload = () => {
            this.imageLoaded = true
        }

        this.image.src = atlasImagePath
    },

    drawSprite: function (ctx, type, xCoordOnCanvas, yCoordOnCanvas, size) {
        if (!this.imageLoaded || !this.jsonLoaded) {
            setTimeout(() => {
                this.drawSprite(ctx, type, xCoordOnCanvas, yCoordOnCanvas, size)
            }, 100)
            return
        }

        let sprite = this.getSprite(type)

        if (!mapManager.isVisible(xCoordOnCanvas, yCoordOnCanvas, size)) {
            return;
        }

        xCoordOnCanvas -= mapManager.view.x
        yCoordOnCanvas -= mapManager.view.y

        ctx.drawImage(this.image,
            sprite.xCoordInAtlas, sprite.yCoordInAtlas, sprite.size.width, sprite.size.height,
            xCoordOnCanvas, yCoordOnCanvas, size.width, size.height
        )
    },

    getSprite: function (name) {
        for (const sprite of this.sprites) {
            if (sprite.name === name) {
                return sprite
            }
        }

        return null
    }
}