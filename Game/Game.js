window.gameDiv = document.getElementById("gameDiv");

import {SCENE_Asteroid} from "./Scenes/Scene_asteroid.js"
import {SCENE_Map} from "./Scenes/Scene_map.js"


var config = {
        type: Phaser.AUTO,
        width: window.gameDiv.getBoundingClientRect().width+1,
        height: window.gameDiv.getBoundingClientRect().height+1,
        scene: SCENE_Asteroid,
        parent:window.gameDiv
    };

var game = new Phaser.Game(config);