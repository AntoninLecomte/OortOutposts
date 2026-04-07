import { GameData } from "../Game_data/GameData.js";
import { readFileSync, writeFileSync } from 'fs';

class GameServerEngine {
    constructor() {
        this.currentGameData = new GameData();
        this.loadStaticData();

        this.createNewGame();
        this.saveDynamicData();
    }
    createNewGame(){
        this.currentGameData.generateWorld();
    }
    /**
     * Loads static data from JSON files into the current gameData object
     */
    loadStaticData(){
        this.currentGameData.constructionData = JSON.parse(readFileSync("./Game_data/Constructions.json", "utf8"));
        this.currentGameData.spaceshipsData = JSON.parse(readFileSync("./Game_data/Spaceships.json", "utf8"));
        this.currentGameData.createObjectTypes();
    }
    /**
     * Saves a game data state in a JSON file
     */
    saveDynamicData(){
        writeFileSync('./Backend/Saved_Game.json', JSON.stringify(this.currentGameData.getJSON(), null, 4));
    }
}

const gameServerEngine = new GameServerEngine();