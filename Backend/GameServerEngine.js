import { GameData } from "../Game_data/GameData.js";
import { readFileSync, writeFileSync } from 'fs';
import {createServer} from 'http';

// DEV
import { Asteroid } from "../Game_data/GameData.js";

class GameServerEngine {
    constructor() {
        this.currentGameData = new GameData();
        this.loadStaticData();
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

class Server{
    constructor(gameData){
        /**
         * @type {GameData}
         */
        this.gameData = gameData;
        this.ip = "localhost";
        this.port = 3000;
        this.start();
    }
    start(){
        this.serverOb = createServer(this.processURL);
        console.log("Started server on "+this.ip+":"+this.port)
        this.serverOb.listen(this.port);
    }
    processURL(request, response){
        if (request.url.includes("Game/Command/")){
            server.processGameGET(request,response);
        }
    }
    processGameGET(request, response){
        const urlParams = new URLSearchParams(request.url);
        // try{
            //  Get targets from parameters
            /** @type {Asteroid} */
            const targetAsteroid = server.gameData.cluster.asteroids[urlParams.get("asteroidID")];

            // Execute action
            if (request.url.includes("addConstructionToQueue")){
                targetAsteroid.addConstructionToQueue(urlParams.get("constructionTypeID"));
                gameServerEngine.saveDynamicData();
            }
        
            if (request.url.includes("removeConstructionFromQueue")){
                targetAsteroid.removeConstructionFromQueue(urlParams.get("position"));
            }

            if (request.url.includes("addspaceshipToQueue")){
                targetAsteroid.addSpaceshipToQueue(urlParams.get("spaceshipTypeID"));
                gameServerEngine.saveDynamicData();
            }
        
            if (request.url.includes("removeSpaceshipFromQueue")){
                targetAsteroid.removeSpaceshipFromQueue(urlParams.get("position"));
            }

            gameServerEngine.saveDynamicData();
            response.end("Ok");
        // }
        // catch (e){
        //     response.end(e.name+" - "+e.message);
        // }
    }
}

const gameServerEngine = new GameServerEngine();
const server = new Server(gameServerEngine.currentGameData);