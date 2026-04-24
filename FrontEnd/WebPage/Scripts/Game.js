/**
 * This script is executed on every pages. It loads data from the server and creates all required handlers.
 */

import {SCENE_Asteroid} from "../../Phaser/Scenes/Scene_asteroid.js"
import {SCENE_Map} from "../../Phaser/Scenes/Scene_map.js"

import { GameData } from "../../Game_data/GameData.js";
import { NetworkHandler } from "./Network.js";
import { AsteroidViewEngine } from "./AsteroidView.js";

// Load gameData object
const gameData = new GameData();

// Create network handler
const networkHandler = new NetworkHandler(gameData);

// Load static data:
var xmlHttp = new XMLHttpRequest();
xmlHttp.open( "GET", "Game_data/Constructions.json", false );
xmlHttp.send( null );
gameData.constructionsData = JSON.parse(xmlHttp.responseText);

xmlHttp = new XMLHttpRequest();
xmlHttp.open( "GET", "Game_data/Spaceships.json", false );
xmlHttp.send( null );
gameData.spaceshipsData = JSON.parse(xmlHttp.responseText);

gameData.createObjectTypes();

// Load dynamic data:
xmlHttp = new XMLHttpRequest();
xmlHttp.open( "GET", "command/getGameData/?gameID=0", false );
xmlHttp.send( null );
const gameDataJSON = JSON.parse(xmlHttp.responseText);
gameData.loadJSON(gameDataJSON);

// Start asteroid view:
const asteroidView = new AsteroidViewEngine(document.getElementById("mainDiv"), gameData, networkHandler);

// var config = {
//         type: Phaser.AUTO,
//         width: window.gameDiv.getBoundingClientRect().width+1,
//         height: window.gameDiv.getBoundingClientRect().height+1,
//         parent:window.gameDiv,
//         scene: [SCENE_Asteroid, SCENE_Map]
//     };

// var game = new Phaser.Game(config);
// game.scene.stop();
// game.scene.start("SCENE_Asteroid", {"gameData":gameData, "networkHandler":networkHandler});