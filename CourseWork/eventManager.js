export let eventManager = {
    bind: [],
    actions: [],

    setup: function () {
        this.bind["KeyW"] = "Up"
        this.bind["KeyS"] = "Down"
        this.bind["KeyA"] = "Left"
        this.bind["KeyD"] = "Right"

        document.body.addEventListener("keydown", (event) => {
            this.onKeyDown(event)
        })
        document.body.addEventListener("keyup", (event) => {
            this.onKeyUp(event)
        })
    },

    onKeyDown: function (event) {
        let action = this.bind[event.code]

        if (action) {
            this.actions[action] = true
        }
    },

    onKeyUp: function (event) {
        let action = this.bind[event.code]

        if (action) {
            this.actions[action] = false
        }
    }
}