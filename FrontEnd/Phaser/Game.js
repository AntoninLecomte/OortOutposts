window.gameDiv = document.getElementById("gameDiv");

import {SCENE_Asteroid} from "./Scenes/Scene_asteroid.js"
import {SCENE_Map} from "./Scenes/Scene_map.js"

import { GameData } from "../Game_data/GameData.js";


var config = {
        type: Phaser.AUTO,
        width: window.gameDiv.getBoundingClientRect().width+1,
        height: window.gameDiv.getBoundingClientRect().height+1,
        scene: SCENE_Asteroid,
        parent:window.gameDiv
    };


// Load gameData object
/**
 * @type {GameData}
 */
const GAME_DATA = new GameData();

// Load static data:
var xmlHttp = new XMLHttpRequest();
xmlHttp.open( "GET", "Game_data/Constructions.json", false ); // false for synchronous request
xmlHttp.send( null );
GAME_DATA.constructionsData = (xmlHttp.responseText);

xmlHttp = new XMLHttpRequest();
xmlHttp.open( "GET", "Game_data/Spaceships.json", false ); // false for synchronous request
xmlHttp.send( null );
GAME_DATA.spaceshipsData = (xmlHttp.responseText);

// Load dynamic data:
xmlHttp = new XMLHttpRequest();
xmlHttp.open( "GET", "command/getGameData/?gameID=0", false ); // false for synchronous request
xmlHttp.send( null );
const gameDataJSON = JSON.parse(xmlHttp.responseText);
GAME_DATA.loadJSON(gameDataJSON);

var game = new Phaser.Game(config);