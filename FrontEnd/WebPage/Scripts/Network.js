import { GameObject } from "../../Game_data/GameData.js";
import { GameData } from "../../Game_data/GameData.js";


/**
* Class network queries functions
*/
class NetworkHandler{
    /** 
    * @param {GameData} gameData - A GameData object containing all game state information
    */
    constructor(gameData){
        this.gameData = gameData;
    }
    /**
    * Ask the server for updated data about the specified gameObject, and update its data structure with the answer
    * @param {GameObject} gameObject - The target object to refresh
    * @param {object} callbackTarget - Object on which run the callback
    * @param {function} callback - Function to be run after data update
    */
    updateGameObjectData(gameObject, callbackTarget, callback){
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.gameObject = gameObject;
        xmlHttp.callbackTarget = callbackTarget;
        xmlHttp.callback = callback;
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
                const data = JSON.parse(xmlHttp.responseText);
                this.gameObject.loadJSON(data);
                this.callback.call(this.callbackTarget,data);
            }
        }
        xmlHttp.open( "GET", "command/getGameObjectData/?gameObjectID="+gameObject.gameObjectId, true);
        xmlHttp.send(null);
    }

    /**
    * Execute command by sending it to the server
    * @param {string} command - The command as text
    * @param {object} params - The command parameters as an object
    * @param {object} callbackTarget - Object on which run the callback
    * @param {function} callback - Function to be run after data update
    */
    sendCommand(command, params,callbackTarget,callback){
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.callbackTarget = callbackTarget;
        xmlHttp.callback = callback;
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
                this.callback.call(this.callbackTarget,xmlHttp.responseText);
            }
        }
        var url = "command/"+command+"/?";
        for (var p in params){
            url += p + "=" + params[p]+"&";
        }
        xmlHttp.open( "GET", url, true);
        xmlHttp.send(null);
    }
}

export {NetworkHandler}