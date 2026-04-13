
import { GameData } from "../FrontEnd/Game_data/GameData.js";
import { readFileSync, writeFileSync } from 'fs';
import {createServer} from 'http';
import * as path from 'node:path';


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
        this.currentGameData.constructionData = JSON.parse(readFileSync("./Frontend/Game_data/Constructions.json", "utf8"));
        this.currentGameData.spaceshipsData = JSON.parse(readFileSync("./Frontend/Game_data/Spaceships.json", "utf8"));
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
            console.info("file requested: "+request.url)
            const ext = request.url.split(".")[request.url.split(".").length-1];
            const mimeType = server.MIME_TYPES[ext] || server.MIME_TYPES.default;
            response.writeHead(200, { "Content-Type": mimeType });
            const filePath = path.join(server.staticPath, request.url);
            response.end(readFileSync(filePath));
        }
        catch(er){
            console.error(er);
        }
        
    }  
    processGameGET(request, response){
        const urlParams = new URLSearchParams(request.url);
        //  Get targets from parameters
        /** @type {GameData} */
        const gameData = server.gameData;
        /** @type {Asteroid} */
        const targetAsteroid = server.gameData.cluster.asteroids[urlParams.get("asteroidID")];

        // Execute action
        if (request.url.includes("getGameData")){
            return response.end(JSON.stringify(gameData.exportJSON(), null, 4));
        }


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
    }
}

const gameServerEngine = new GameServerEngine();
const server = new Server(gameServerEngine.currentGameData);