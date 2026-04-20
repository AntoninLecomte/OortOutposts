
import { GameData, GameEvent } from "../FrontEnd/Game_data/GameData.js";
import { readFileSync, writeFileSync } from 'fs';
import {createServer} from 'http';
import * as path from 'node:path';


class GameServerEngine {
    constructor() {
        this.currentGameData = new GameData();
        this.loadStaticData();
        // this.loadDynamicData();
        this.createNewGame();
        this.saveDynamicData();

       this.currentGameData.startIterationLoopTime()
    }
    createNewGame(){
        this.currentGameData.generateWorld();
    }
    /**
     * Loads static data from JSON files into the current gameData object
     */
    loadStaticData(){
        this.currentGameData.constructionsData = JSON.parse(readFileSync("./Frontend/Game_data/Constructions.json", "utf8"));
        this.currentGameData.spaceshipsData = JSON.parse(readFileSync("./Frontend/Game_data/Spaceships.json", "utf8"));
        this.currentGameData.createObjectTypes();
    }
    /**
     * Saves a game data state in a JSON file
     */
    saveDynamicData(){
        writeFileSync('./Backend/Saved_Game.json', JSON.stringify(this.currentGameData.exportJSON(this.currentGameData.currentDate), null, 4));
    }
    /**
     * Loads a game data state from a JSON file
     */
    loadDynamicData(){
        const JSONData = JSON.parse(readFileSync('./Backend/Saved_Game.json',"utf8"));
        this.currentGameData.loadJSON(JSONData);
        console.log("Loaded dynamic data")
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

        /**
         * @type {string{}} - List of mymes types
         */
        this.MIME_TYPES = {
            default: "application/octet-stream",
            html: "text/html; charset=UTF-8",
            js: "text/javascript",
            css: "text/css",
            png: "image/png",
            jpg: "image/jpeg",
            gif: "image/gif",
            ico: "image/x-icon",
            svg: "image/svg+xml",
        };
        /**
         * @type {string} - Path to static files root
         */
        this.staticPath = path.join(process.cwd(), "./FrontEnd");
        console.log("Static path: "+this.staticPath);


        this.start();
    }
    start(){
        this.serverOb = createServer(this.processURL);
        console.log("Started server on "+this.ip+":"+this.port)
        this.serverOb.listen(this.port);
    }
    processURL(request, response){
        if (request.url.includes("command/")){
            server.processGameGET(request,response);
        }
        else{
            server.serveFile(request, response)
        }
    }
    serveFile(request, response){
        try{
            // console.info("file requested: "+request.url)
            const ext = request.url.split(".")[request.url.split(".").length-1];
            const mimeType = server.MIME_TYPES[ext] || server.MIME_TYPES.default;
            response.writeHead(200, { "Content-Type": mimeType });
            const filePath = path.join(server.staticPath, request.url);
            response.end(readFileSync(filePath));
        }
        catch(er){
            // console.error(er);
        }
        
    }  
    processGameGET(request, response){
        console.log(request.url.split("command/")[1])
        const queryString = request.url.split("/")[request.url.split("/").length-1];
        const urlParams = new URLSearchParams(queryString);
        //  Get targets from parameters
        /** @type {GameData} */
        const gameData = server.gameData;

        var targetAsteroid; /** @type {Asteroid} */
        if (urlParams.get("asteroidID") != null){
            targetAsteroid = gameData.getGameObjectById(urlParams.get("asteroidID"))
        }
        

        // Execute action
        if (request.url.includes("getGameData")){
            return response.end(JSON.stringify(gameData.exportJSON(gameData.currentDate), null, 4));
        }
        if (request.url.includes("getGameObjectData")){
            const targetGameObject = gameData.getGameObjectById(urlParams.get("gameObjectID"));
            return response.end(JSON.stringify(targetGameObject.exportJSON(gameData.currentDate), null, 4));
        }


        if (request.url.includes("addConstructionToQueue")){
            targetAsteroid.addConstructionToQueue(urlParams.get("constructionTypeID"));
            gameServerEngine.saveDynamicData();
        }
        if (request.url.includes("addSpaceShipToQueue")){
            targetAsteroid.addSpaceshipToQueue(urlParams.get("spaceshipTypeID"));
            gameServerEngine.saveDynamicData();
        }
        if (request.url.includes("swapQueueObjects")){
            const targetGameObject = gameData.getGameObjectById(urlParams.get("gameObjectID"));
            const targetGameObject2 = gameData.getGameObjectById(urlParams.get("gameObjectID2"));
            targetAsteroid.swapQueueObjects(targetGameObject, targetGameObject2);
            gameServerEngine.saveDynamicData();
        }
    
        if (request.url.includes("deleteObject")){
            const targetGameObject = gameData.getGameObjectById(urlParams.get("gameObjectID"));
            targetGameObject.delete();
            gameServerEngine.saveDynamicData();
        }
        response.end("Ok");
    }
}

const gameServerEngine = new GameServerEngine();
const server = new Server(gameServerEngine.currentGameData);