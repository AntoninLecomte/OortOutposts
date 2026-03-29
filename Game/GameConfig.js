class GameConfig {
    constructor(parameters) {
        this.colors = {
            "background": "rgb(0,0,0)",
            "foreground": "rgb(255,255,255)",
            "foreground_fade": "rgb(170,170,170)",
            "debug": "rgb(255,0,255)"
        }
        this.strings_EN = {
            "ConstructionComplete": "Construction completed: {} "
        }
    }
}

const gameConfig = new GameConfig()