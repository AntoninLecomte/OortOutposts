const parentDiv = document.getElementById("gameDiv");

import {SCENE_Asteroid} from "./Scenes/Scene_asteroid.js"
import {SCENE_Map} from "./Scenes/Scene_map.js"
import {GameData} from "./GameData.js"

window.gameData = new GameData();
window.gameData.generateWorld();

var config = {
        type: Phaser.AUTO,
        width: parentDiv.getBoundingClientRect().width+1,
        height: parentDiv.getBoundingClientRect().height+1,
        scene: SCENE_Asteroid,
        parent:parentDiv
    };

var game = new Phaser.Game(config);