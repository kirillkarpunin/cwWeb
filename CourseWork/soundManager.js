import {gameManager} from "./gameManager.js";
import {mapManager} from "./mapManager.js";

export let soundManager = {
    sounds: {},
    allSoundsLoaded: false,

    context: null,
    gainNode: null,

    init: function () {
        this.context = new AudioContext()

        this.gainNode = this.context.createGain ? this.context.createGain() : this.context.createGainNode()
        this.gainNode.connect(this.context.destination)

        this.loadSoundArray([
            {name: "ambient", path: "../Sounds/ambient.wav"},
            {name: "ambient2", path: "../Sounds/ambient2.wav"},
            {name: "walk", path: "../Sounds/walk.wav"},
            {name: "die", path: "../Sounds/die.wav"},
            {name: "hurt", path: "../Sounds/hurt.wav"},
            {name: "collision", path: "../Sounds/collision.wav"},
            {name: "treasure", path: "../Sounds/treasure.wav"},
            {name: "item", path: "../Sounds/item.wav"},
            {name: "next", path: "../Sounds/next.wav"},
            {name: "victory", path: "../Sounds/victory.wav"},
            {name: "gameover", path: "../Sounds/gameover.wav"}
        ])
    },

    loadSound: function (soundName, soundPath, callbackFunc) {
        if (this.sounds[soundName]) {
            callbackFunc(this.sounds[soundName])
            return
        }

        let sound = {
            path: soundPath,
            buffer: null,
            isLoaded: false,
        }

        this.sounds[soundName] = sound

        let req = new XMLHttpRequest()

        req.open("GET", soundPath, true)
        req.responseType = "arraybuffer"

        req.onload = () => {
            this.context.decodeAudioData(req.response, (buffer) => {
                sound.buffer = buffer
                sound.isLoaded = true
                callbackFunc(sound)
            })
        }

        req.send()
    },

    loadSoundArray: function (soundsArray) {
        for (const sound of soundsArray) {
            this.loadSound(sound.name, sound.path, () => {
                if (soundsArray.length === Object.keys(this.sounds).length) {
                    for (const name in this.sounds) {
                        if (!this.sounds[name].isLoaded) {
                            return
                        }
                    }

                    this.allSoundsLoaded = true
                }
            })
        }
    },

    play: function (name, settings) {
        if (!this.allSoundsLoaded) {
            setTimeout(() => {
                this.play(name, settings)
            }, 100)
            return
        }

        let volume = 1
        let isLooped = false

        if (settings) {
            if (settings.volume) {
                volume = settings.volume
            }
            if (settings.isLooped) {
                isLooped = settings.isLooped
            }
        }

        let sound = this.sounds[name]
        if (sound === null) {
            return
        }

        let bufferSource = this.context.createBufferSource()
        bufferSource.buffer = sound.buffer
        bufferSource.loop = isLooped
        this.gainNode.gain.value = volume
        bufferSource.connect(this.gainNode)

        bufferSource.start(0)
    },

    playInWorld(name, posX, posY) {
        if (gameManager.player === null) {
            return
        }

        let soundArea = Math.max(mapManager.view.width, mapManager.view.height)

        let dx = Math.abs(gameManager.player.posX - posX)
        let dy = Math.abs(gameManager.player.posY - posY)

        let distance = Math.sqrt(dx * dx + dy * dy)

        let norm = distance / soundArea

        if (norm > 1) {
            norm = 1
        }
        let volume = 1.0 - norm

        if (volume <= 0) {
            return
        }

        this.play(name, {volume: volume, isLooped: false})
    },

    stopAll: function () {
        this.gainNode.disconnect()
        this.gainNode = this.context.createGain ? this.context.createGain() : this.context.createGainNode()
        this.gainNode.connect(this.context.destination)
    }
}