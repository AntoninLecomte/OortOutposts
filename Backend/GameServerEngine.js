import { GameData } from "../Game_data/GameData.js";
import { readFileSync, writeFileSync } from 'fs';

class GameServerEngine {
    constructor() {
        this.currentGameData = new GameData();
        this.loadStaticData();

        this.createNewGame();
        this.saveDynamicData();
        this.loadDynamicData();
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
        writeFileSync('./Backend/Saved_Game.json', JSON.stringify(this.currentGameData.exportJSON(), null, 4));
    }
    /**
     * Loads a game data state from a JSON file
     */
    loadDynamicData(){
        const JSONData = JSON.parse(readFileSync('./Backend/Saved_Game.json',"utf8"));
        this.currentGameData.loadJSON(JSONData);
    }
}

const gameServerEngine = new GameServerEngine();