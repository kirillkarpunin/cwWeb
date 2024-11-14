import {gameManager} from "./gameManager.js";

let zoom = 2

export let mapManager = {
    mapData: null,
    tileLayers: [],
    tileLayersAbove: [],
    widthInTiles: 0,
    heightInTiles: 0,
    tileSizeInPx: {width: 0, height: 0},
    mapSizeInPx: {width: 0, height: 0},
    tileSets: [],

    imageLoadCounter: 0,
    allImagesLoaded: false,
    jsonLoaded: false,

    view: {x: 0, y: 0, width: 0, height: 0},

    loadMap: function (path) {
        let req = new XMLHttpRequest()

        req.onreadystatechange = () => {
            if (req.readyState === 4 && req.status === 200) {
                this.parseMap(req.responseText)
            }
        }

        req.open("GET", path, true)
        req.send()
    },

    parseMap: function (mapStr) {
        this.mapData = JSON.parse(mapStr)

        this.widthInTiles = this.mapData.width
        this.heightInTiles = this.mapData.height

        this.tileSizeInPx.width = this.mapData.tilewidth * zoom
        this.tileSizeInPx.height = this.mapData.tileheight * zoom

        this.mapSizeInPx.width = this.widthInTiles * this.tileSizeInPx.width
        this.mapSizeInPx.height = this.heightInTiles * this.tileSizeInPx.height

        for (const tileSet of this.mapData.tilesets) {
            let img = new Image()

            img.onload = () => {
                this.imageLoadCounter++
                if (this.imageLoadCounter === this.mapData.tilesets.length) {
                    this.allImagesLoaded = true
                }
            }

            img.src = tileSet.image
            this.tileSets.push({
                firstgid: tileSet.firstgid,
                image: img,
                name: tileSet.name,

                widthInTiles: Math.floor(tileSet.imagewidth / tileSet.tilewidth),
                heightInTiles: Math.floor(tileSet.imageheight / tileSet.tileheight),

                tileSizeInPx: {
                    width: tileSet.tilewidth,
                    height: tileSet.tileheight
                },

                imageSizeInPx: {
                    width: tileSet.imagewidth,
                    height: tileSet.imageheight
                }
            })
        }

        let isAbove = false
        for (const layer of this.mapData.layers) {
            if (layer.type !== "tilelayer") {
                isAbove = true
                continue
            }

            if (isAbove) {
                this.tileLayersAbove.push(layer)
            }
            this.tileLayers.push(layer)
        }

        this.jsonLoaded = true
    },

    drawMap: function (ctx, above = false) {
        if (!this.allImagesLoaded || !this.jsonLoaded) {
            setTimeout(() => {
                this.drawMap(ctx)
            }, 100)
            return
        }

        let layers = this.tileLayers
        if (above) {
            layers = this.tileLayersAbove
        }
        for (const layer of layers) {
            for (let i = 0; i < layer.data.length; i++) {
                if (layer.data[i] === 0) {
                    continue
                }

                let tile = this.getTile(layer.data[i])

                let xTileOnCanvas = i % this.widthInTiles
                let yTileOnCanvas = Math.floor(i / this.widthInTiles)

                let xCoordOnCanvas = xTileOnCanvas * this.tileSizeInPx.width
                let yCoordOnCanvas = yTileOnCanvas * this.tileSizeInPx.height

                if (!this.isVisible(xCoordOnCanvas, yCoordOnCanvas, tile.size)) {
                    continue
                }

                xCoordOnCanvas -= this.view.x
                yCoordOnCanvas -= this.view.y

                ctx.drawImage(tile.image,
                    tile.xCoordInTileSet, tile.yCoordInTileSet, tile.size.width, tile.size.height,
                    xCoordOnCanvas, yCoordOnCanvas, this.tileSizeInPx.width, this.tileSizeInPx.height)
            }
        }
    },

    parseEntities: function () {
        if (!this.allImagesLoaded || !this.jsonLoaded) {
            setTimeout(() => {
                this.parseEntities()
            }, 100)
            return
        }

        for (const layer of this.mapData.layers) {
            if (layer.type !== "objectgroup") {
                continue
            }

            for (const obj of layer.objects) {
                try {
                    let entity = Object.create(Object.getPrototypeOf(gameManager.factory[obj.type]))
                    Object.assign(entity, gameManager.factory[obj.type])

                    entity.type = obj.type

                    entity.posX = obj.x * zoom
                    entity.posY = (obj.y - obj.height) * zoom

                    if (entity.posX % 32 !== 0 || entity.posY % 32 !== 0) {
                        console.log(`Entity placed wrongly: ${entity.type}`)
                    }

                    entity.size = {width: obj.width * zoom, height: obj.height * zoom}

                    gameManager.entities.push(entity)

                    if (entity.type === "Player") {
                        gameManager.initPlayer(entity)
                    }

                } catch (e) {
                    console.log(`Error creating ${obj.gid} ${obj.type}: ${e}`)
                }
            }
        }
    },

    getTile: function (tileIndex) {
        let tile = {
            image: null,
            size: null,
            xCoordInTileSet: 0,
            yCoordInTileSet: 0
        }

        let tileSet = this.getTileSet(tileIndex)
        let indexInTileSet = tileIndex - tileSet.firstgid

        let xTileInTileSet = indexInTileSet % tileSet.widthInTiles
        let yTileInTileSet = Math.floor(indexInTileSet / tileSet.widthInTiles)

        tile.xCoordInTileSet = xTileInTileSet * tileSet.tileSizeInPx.width
        tile.yCoordInTileSet = yTileInTileSet * tileSet.tileSizeInPx.height
        tile.size = tileSet.tileSizeInPx
        tile.image = tileSet.image

        return tile
    },

    getTileSet: function (tileIndex) {
        for (let i = this.tileSets.length - 1; i >= 0; i--) {
            if (this.tileSets[i].firstgid > tileIndex) {
                continue
            }

            return this.tileSets[i]
        }

        return null
    },

    isObstacleTile: function (xCoordOnCanvas, yCoordOnCanvas) {
        if (xCoordOnCanvas < 0 || yCoordOnCanvas < 0 || xCoordOnCanvas >= this.mapSizeInPx.width || yCoordOnCanvas >= this.mapSizeInPx.height) {
            return true
        }

        let index = Math.floor(yCoordOnCanvas / this.tileSizeInPx.height) * this.widthInTiles + Math.floor(xCoordOnCanvas / this.tileSizeInPx.width)

        for (const layer of this.tileLayers) {
            if (layer.name !== "walls" && layer.name !== "props_obstacle") {
                continue
            }

            if (layer.data[index] !== 0) {
                return true
            }
        }

        return false
    },

    entityAtTile: function (ignoredEntity, xCoordOnCanvas, yCoordOnCanvas) {
        for (const entity of gameManager.entities) {
            if (entity === ignoredEntity) {
                continue
            }

            if (xCoordOnCanvas + ignoredEntity.size.width <= entity.posX || yCoordOnCanvas + ignoredEntity.size.height <= entity.posY || xCoordOnCanvas >= entity.posX + entity.size.width || yCoordOnCanvas >= entity.posY + entity.size.height) {
                continue
            }

            return entity
        }

        return null
    },

    getCreatureNearby: function (entity) {
        let directions = [
            {x: 0, y: 1},
            {x: 1, y: 1},
            {x: 1, y: 0},
            {x: 1, y: -1},
            {x: 0, y: -1},
            {x: -1, y: -1},
            {x: -1, y: 0},
            {x: -1, y: 1}
        ]

        for (const d of directions) {
            let creature = this.entityAtTile(entity, entity.posX + d.x * entity.speed * entity.size.width, entity.posY + d.y * entity.speed * entity.size.height)

            if (creature && Object.getPrototypeOf(Object.getPrototypeOf(creature)).constructor.name === "Creature") {
                return creature
            }
        }

        return null
    },

    isVisible: function (xCoordOnCanvas, yCoordOnCanvas, size) {
        if (xCoordOnCanvas + size.width < this.view.x || xCoordOnCanvas > this.view.x + this.view.width) {
            return false
        }

        if (yCoordOnCanvas + size.height < this.view.y || yCoordOnCanvas > this.view.y + this.view.height) {
            return false
        }

        return true
    },

    centerView: function (xCoordOnCanvas, yCoordOnCanvas) {
        this.view.x = Math.max(Math.min(xCoordOnCanvas - Math.floor(this.view.width / 2), this.mapSizeInPx.width - this.view.width), 0)
        this.view.y = Math.max(Math.min(yCoordOnCanvas - Math.floor(this.view.height / 2), this.mapSizeInPx.height - this.view.height), 0)
    },

    resetMap: function () {
        this.mapData = null
        this.tileLayers = []
        this.tileLayersAbove = []
        this.widthInTiles = 0
        this.heightInTiles = 0
        this.tileSizeInPx = {width: 0, height: 0}
        this.mapSizeInPx = {width: 0, height: 0}
        this.tileSets = []

        this.imageLoadCounter = 0
        this.allImagesLoaded = false
        this.jsonLoaded = false
    }
}