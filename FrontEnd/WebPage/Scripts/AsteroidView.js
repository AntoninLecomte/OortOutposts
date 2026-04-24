import { GameData } from "../../Game_data/GameData.js";
import { NetworkHandler } from "./Network.js";
import { UI_Button, UI_Window } from "./UI.js";

/** Class linking and organizing all handlers and instances */
class AsteroidViewEngine{
    /** 
    * @param {HTMLElement} parentHTML - Html element in which the asteroid view is to be inserted
    * @param {GameData} gameData - The game data object containing all data about the game world
    * @param {NetworkHandler} networkHandler - NetworkHandler object providing utils to communicate with the server
    */
    constructor(parentHTML, gameData, networkHandler) {
        this.HTML = parentHTML;
        this.gameData = gameData;
        this.asteroid = gameData.cluster.asteroids[0];
        this.networkHandler = networkHandler;

        this.ui = new UI_Asteroid(this)
    }
}

/** Class storing DOM structure and fonctions for the asteroid view UI */
class UI_Asteroid {
    /** 
    * @param {AsteroidViewEngine} parentEngine - Engine storing all handlers and useful objects
    */
    constructor(parentEngine) {
        this.parentEngine = parentEngine;
        this.gameData = parentEngine.gameData;

        let UI_asteroidObject = this
        fetch("WebPage/HTML/UI_Asteroid.html")
        .then((response) => response.text())
        .then((text) => {
            let parser = new DOMParser();
            let DOM = parser.parseFromString(text, 'text/html');
            UI_asteroidObject.receivedHTML(DOM);
        });

        // Display static elements
        this.refreshStaticElements()

        // Start periodic update:
        setInterval(function(self){
            self.getChangesFromServer();
        },3000,this)
    }
    /** 
    * Function executed at reception of the UI html code
    * @param {Document} DOM - Received HML document
    */
    receivedHTML(DOM){
        this.mainDiv = DOM.querySelector("#UI_Asteroid");
        this.parentEngine.HTML.appendChild(this.mainDiv);
        
        // Create window and associated button objects
        this.windows = {
            "Log": [],
            "Queue": [],
            "Construction": [],
            "Shipyard": [],
        }
        for (var w in this.windows){
            this.windows[w] = [
                new UI_Window(document.querySelector("#Window_"+w)), 
                new UI_Button(document.querySelector("#Button_"+w),this,this.windowButtonClicked)
            ]
        }

        this.refresh();

        // Open window {DEV}
        this.windows["Shipyard"][0].open();
    }
    windowButtonClicked(button){
        for (var w in this.windows){
            if (button != this.windows[w][1]){
                this.windows[w][0].close(); // Close windows that are not related
                this.windows[w][1].setState("OFF") // Off the buttons that are not related 
            }else{
                if (button.state == "ON"){
                    this.windows[w][0].open();
                }else{
                    this.windows[w][0].close();
                }
            }
        }
    }

    /** Update static data, run only once at page loading */
    refreshStaticElements(){
        
    }

    /** Asks server for any updates and show result */
    getChangesFromServer(){
        this.parentEngine.networkHandler.updateGameObjectData(this.parentEngine.asteroid,this,this.refresh);
    }
    /** Refresh displayed information to match gamedata state */
    refresh(){
        this.updateTimeStamp();
        this.updateRessources();
        this.updateLog();

        this.updateConstructionPicks();
        this.updateSpaceshipsPicks();
        this.updateConstructionQueue();
    }

    /** Update timestamp */
    updateTimeStamp(){
        var sec_num = (new Date().getTime() - this.parentEngine.asteroid.exportTimestamp.getTime())/1000;
        sec_num = Math.round(sec_num/30)*30; // Round to 30 seconds

        var hours   = Math.floor(Math.abs(sec_num) / 3600);
        var minutes = Math.floor((Math.abs(sec_num)  - (hours * 3600)) / 60);
        var seconds = Math.round(Math.abs(sec_num)  - (hours * 3600) - (minutes * 60));

        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        
        var timestampStr;
        if (sec_num < 0)  {timestampStr = "+ "+hours+':'+minutes+':'+seconds}
        if (sec_num == 0)  {timestampStr = "Real time"}
        if (sec_num > 0)  {timestampStr = "- "+hours+':'+minutes+':'+seconds}

        document.getElementById("TimeStamp").innerHTML = timestampStr;
    }

    /** Update ressources level */
    updateRessources(){
        const stringMinerals = Math.round(this.parentEngine.asteroid.ressourceMinerals*10)/10+" ("+ Math.round(this.parentEngine.asteroid.mineralsGeneration*10)/10+"/h)";
        const stringWater = Math.round(this.parentEngine.asteroid.ressourceWater*10)/10+" ("+ Math.round(this.parentEngine.asteroid.waterGeneration*10)/10+"/h)";
        const stringEnergy = "("+ Math.round(this.parentEngine.asteroid.energyGeneration*10)/10+"/h)";

        document.getElementById("ressourceMinerals").querySelector(".UI_RessourceP").innerHTML = stringMinerals;
        document.getElementById("ressourceWater").querySelector(".UI_RessourceP").innerHTML = stringWater;
        document.getElementById("ressourceEnergy").querySelector(".UI_RessourceP").innerHTML = stringEnergy;
    }

    /** Updates the logs in reference with game data*/
    updateLog(){
        for (var ev=this.parentEngine.asteroid.events.length-1; ev>0; ev--){
            const eventOb = this.parentEngine.asteroid.events[ev];
            const newNode = document.getElementById("LogEventItemFactory").cloneNode(true);
            newNode.classList.remove("UI_Factory");
            // Get date format
            newNode.querySelector(".LogEventTimeText").innerHTML = eventOb.timestamp.toLocaleDateString() + " " + eventOb.timestamp.toLocaleTimeString();
            newNode.querySelector(".LogEventText").innerHTML = gameConfig.strings_EN["ConstructionComplete"].replace("{}", eventOb.construction.name);
            document.getElementById("LogEventItemFactory").parentElement.appendChild(newNode);
        }
    }

    /** Updates the construction queue in reference with game data */
    updateConstructionQueue(){
        // Update status
        if (this.parentEngine.asteroid.constructionsQueue.length == 0){
            document.getElementById("ConstructionsQueueLabel").innerHTML = gameConfig.strings_EN["EmptyConstructionsQueue"];
            document.getElementById("ConstructionsQueueLabel").style.display = "block";
            document.getElementById("ConstructionsQueueLabel").style.color = gameConfig.colors["warning"];
        }else{
            document.getElementById("ConstructionsQueueLabel").style.display = "none";
        }

        // Remove existing elements
        this.UI_constructionQueueItems = [];
        var previousItems = document.getElementById("ConstructionQueueDiv").querySelectorAll(".QueueItem");
        previousItems.forEach(function (el){
            if (el.id != "QueueItemFactory"){
                el.remove(el);
            }
        });

        // Recreate items:
        for (var item in this.parentEngine.asteroid.constructionsQueue){
            const constructionOb = this.parentEngine.asteroid.constructionsQueue[item];

            const newNode = document.getElementById("QueueItemFactory").cloneNode(true);
            newNode.id = "";
            document.getElementById("ConstructionQueueDiv").appendChild(newNode);
            const newQueueItem = new UI_QueueItem(this.parentEngine, newNode, constructionOb, this.parentEngine.asteroid.constructionsQueue);
            this.UI_constructionQueueItems.push(newQueueItem)
        }

        // Update buttons:
        for (var item in this.UI_constructionQueueItems){
            this.UI_constructionQueueItems[item].updateButtons()
        }
    }

    /**
     * Updates the available constructions in reference with game data
     */
    updateConstructionPicks(){
        // Remove existing elements
        this.UI_constructionPicks = [];
        var previousItems = document.getElementById("ConstructionPicksDiv").querySelectorAll(".PickItem");
        previousItems.forEach(function (el){
            if (el.id != "PickItemFactory"){
                el.remove(el);
            }
        });

        // Recreate elements
        for (var constructionID in this.gameData.constructionsTypes){
            const newNode = document.getElementById("PickItemFactory").cloneNode(true);
            newNode.id = "";
            document.getElementById("ConstructionPicksDiv").appendChild(newNode);
            this.UI_constructionPicks[constructionID] = new UI_Pick_Construction(this.parentEngine, newNode, this.gameData.constructionsTypes[constructionID]);
        }
    }
    /**
     * Update the available spaceships in reference with game data
     */
    updateSpaceshipsPicks(){
        // Remove existing elements
        this.UI_spaceshipPicks = {};
        var previousItems = document.getElementById("SpaceshipPicksDiv").querySelectorAll(".PickItem");
        previousItems.forEach(function (el){
            if (el.id != "PickItemFactory"){
                el.remove(el);
            }
        });

        // Recreate elements
        for (var spaceshipID in this.gameData.spaceshipsTypes){
            const newNode = document.getElementById("PickItemFactory").cloneNode(true);
            newNode.id = "";
            document.getElementById("SpaceshipPicksDiv").appendChild(newNode);
            this.UI_spaceshipPicks[spaceshipID] = new UI_Pick_Spaceship(this.parentEngine ,newNode, this.gameData.spaceshipsTypes[spaceshipID]);
        }
    }
}

/**
* Class storing DOM structure and fonctions for a construction queue item
*/
class UI_QueueItem{
   /** 
    * @param {AsteroidViewEngine} parentEngine - Engine storing all handlers and useful objects
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    * @param {Construction} targetOb - Game data Construction object
    * @param {Array} queueList - The parent array for swap
    */
    constructor(parentEngine, HTMLRoot, targetOb, queueList){
        this.parentEngine = parentEngine;
        this.HTMLRoot = HTMLRoot;
        this.targetOb = targetOb;
        this.queueList = queueList;

        this.HTMLRoot.classList.remove("UI_Factory");
        this.HTMLRoot.querySelector(".DurationText").innerHTML = targetOb.constructedEnergy;
        this.HTMLRoot.querySelector(".Name").innerHTML = targetOb.name;

        this.upButton = new UI_Button(this.HTMLRoot.querySelectorAll(".UI_Button")[0],this,this.upButtonClicked);
        this.upButton = new UI_Button(this.HTMLRoot.querySelectorAll(".UI_Button")[1],this,this.downButtonClicked);
        this.deleteButton = new UI_Button(this.HTMLRoot.querySelectorAll(".UI_Button")[2],this,this.deleteButtonClicked);

        this.HTMLRoot.style.top = "0px";
    }
    updateButtons(){
        // Disable buttons for extremities:
        if (this.queueList.indexOf(this.targetOb) == 0){
            this.HTMLRoot.querySelectorAll(".UI_Button")[0].UI_ob.setState("DISABLED");
        }else{
            this.HTMLRoot.querySelectorAll(".UI_Button")[0].UI_ob.setState("OFF");
        }
        if (this.queueList.indexOf(this.targetOb) == this.queueList.length-1){
            this.HTMLRoot.querySelectorAll(".UI_Button")[1].UI_ob.setState("DISABLED");
        }else{
            this.HTMLRoot.querySelectorAll(".UI_Button")[1].UI_ob.setState("OFF");
        }
    }
    upButtonClicked(){
        var objectTo = null;
        if (this.targetOb instanceof Construction){
            const indexFrom = this.parentEngine.ui.UI_constructionQueueItems.indexOf(this);
            objectTo = this.parentEngine.ui.UI_constructionQueueItems[indexFrom-1];
        }
        if (this.targetOb instanceof Spaceship){
            const indexFrom = this.parentEngine.ui.UI_spaceshipsQueueItems.indexOf(this);
            objectTo = this.parentEngine.ui.UI_spaceshipsQueueItems[indexFrom-1];
        }
        // Send command:
            this.parentEngine.networkHandler.sendCommand(
            "swapQueueObjects",
            {
                "gameObjectID":this.targetOb.gameObjectId,
                "gameObjectID2":objectTo.targetOb.gameObjectId,
                "asteroidID":this.parentEngine.asteroid.gameObjectId
            },
            this,
            this.upCallback
        );
        
    }
    upCallback(){
        this.upButton.setState("OFF");

        const exchangeTarget = this.HTMLRoot.previousElementSibling;
        const yOffset = exchangeTarget.getBoundingClientRect().top - this.HTMLRoot.getBoundingClientRect().top;
        this.HTMLRoot.style.top = yOffset+"px";
        exchangeTarget.style.top = -yOffset+"px";

        setTimeout(function(self){
            self.parentEngine.ui.getChangesFromServer();
        },300,this);
        
    }
    downButtonClicked(){
        var objectTo = null;
        var objectTo = null;
        if (this.targetOb instanceof Construction){
            const indexFrom = this.parentEngine.ui.UI_constructionQueueItems.indexOf(this);
            objectTo = this.parentEngine.ui.UI_constructionQueueItems[indexFrom+1];
        }
        if (this.targetOb instanceof Spaceship){
            const indexFrom = this.parentEngine.ui.UI_spaceshipsQueueItems.indexOf(this);
            objectTo = this.parentEngine.ui.UI_spaceshipsQueueItems[indexFrom+1];
        }
        // Send command:
            this.parentEngine.networkHandler.sendCommand(
            "swapQueueObjects",
            {
                "gameObjectID":this.targetOb.gameObjectId,
                "gameObjectID2":objectTo.targetOb.gameObjectId,
                "asteroidID":this.parentEngine.asteroid.gameObjectId
            },
            this,
            this.downCallback
        );
        
    }
    downCallback(){
        this.upButton.setState("OFF");

        const exchangeTarget = this.HTMLRoot.nextElementSibling;
        const yOffset = exchangeTarget.getBoundingClientRect().top - this.HTMLRoot.getBoundingClientRect().top;
        this.HTMLRoot.style.top = yOffset+"px";
        exchangeTarget.style.top = -yOffset+"px";

        setTimeout(function(self){
            self.parentEngine.ui.getChangesFromServer();
        },300,this);
        
    }

    deleteButtonClicked(){
        this.parentEngine.networkHandler.sendCommand(
            "cancelConstruction",
            {
                "gameObjectID":this.targetOb.gameObjectId, 
                "asteroidID":this.parentEngine.asteroid.gameObjectId
            },
            this,
            this.deleteCallback
        );
    }
    deleteCallback(){
        this.deleteButton.setState("OFF");
        this.parentEngine.ui.getChangesFromServer();
    }
}

/**
* UI element allowing details visualization and addition to queue
*/
class UI_Pick{
    /** 
    * @param {AsteroidViewEngine} parentEngine - Engine storing all handlers and useful objects
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    */
    constructor(parentEngine,HTMLRoot){
        this.parentEngine = parentEngine;
        this.HTMLRoot = HTMLRoot;

        this.HTMLRoot.classList.remove("UI_Factory");

        // Add button behavior
        this.HTMLRoot.querySelector(".AddToQueueButtonText").innerHTML = "▲ " + gameConfig.strings_EN["AddToQueue"] + " ▲";
        this.addButton = new UI_Button(this.HTMLRoot.querySelector(".UI_Button"),this,this.addToQueue);

        this.numberFrames = {};
    }
    /** 
    * Creates a UI number frame, to be populated later by ressources
    * @param {string} frameID - Frame ID to be added to the new frame HTML element
    * @param {string} frameTitle - The frame title to be displayed
    */
    addFrame(frameID,frameTitle){
        const newFrame = this.HTMLRoot.querySelector("#NumberFrameFactory").cloneNode(true);
        newFrame.classList.add(frameID);
        newFrame.classList.remove("UI_Factory");
        newFrame.querySelector(".NumberFrameTitle").innerHTML = frameTitle;
        this.HTMLRoot.querySelector("#NumberFrameFactory").parentElement.appendChild(newFrame);
    }
    /** 
    * Creates a UI number frame, to be populated later by ressources
    * @param {string} frameID - The frameID parent to add the ressource to
    * @param {string} ressourceID - The ressource ID
    * @param {number} value - The value to display
    */
    addRessourceToFrame(frameID,ressourceID,value){
        const newRes = this.HTMLRoot.querySelector("#NumberFrameRessourceFactory").cloneNode(true);
        newRes.classList.add(ressourceID);
        newRes.classList.remove("UI_Factory");
        newRes.querySelector(".UI_RessourceImg").src = "./WebPage/Media/Ressources/"+ressourceID+".png";
        newRes.querySelector(".UI_RessourceP").innerHTML = value;
        this.HTMLRoot.querySelector("."+frameID).querySelector(".NumberFrameContent").appendChild(newRes);
    }
    /** Sends a command to add pick to queue*/
    addToQueue(){
        if (this instanceof UI_Pick_Construction){
             this.parentEngine.networkHandler.sendCommand(
                "addConstructionToQueue",
                {
                    "constructionTypeID":this.construction.constructionTypeID, 
                    "asteroidID":this.parentEngine.asteroid.gameObjectId
                },
                this,
                this.addToQueueCallback
            );
        }
        if (this instanceof UI_Pick_Spaceship){
             this.parentEngine.networkHandler.sendCommand(
                "addSpaceShipToQueue",
                {
                    "spaceshipTypeID":this.spaceship.spaceshipTypeID, 
                    "asteroidID":this.parentEngine.asteroid.gameObjectId
                },
                this,
                this.addToQueueCallback
            );
        }
    }
    /** Answer from addToQueue*/
    addToQueueCallback(){
        this.addButton.setState("OFF");
        this.parentEngine.ui.getChangesFromServer();
    }
}

/**
* @extends UI_Pick Derived UI_Pick to fit Construction picking
*/
class UI_Pick_Construction extends UI_Pick{
    /** 
    * @param {AsteroidViewEngine} parentEngine - Engine storing all handlers and useful objects
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    * @param {Construction} construction - Target construction object
    */
    constructor(parentEngine,HTMLRoot, construction) {
        super(parentEngine,HTMLRoot);
        this.construction = construction;

        this.HTMLRoot.querySelector(".Name").innerHTML = this.construction.name;
        this.HTMLRoot.querySelector(".Description").innerHTML = this.construction.description;

        const characteristics = {
            "ConstructionCost":{
                "costMinerals":"MINERALS",
                "costWater":"WATER",
                "costEnergy":"Energy",
            },
            "ConstructionGeneration":{
                "generationMinerals":"MINERALS",
                "generationWater":"WATER",
                "generationEnergy":"Energy",
            },
            "ConstructionDefense":{
                "maxStructurePoints":"STRUCTURE",
                "shield":"SHIELD",
                "firePower":"FIRE_POWER",
            },
        }

        for (var frameTitle in characteristics){
            var isEmpty = true;
            for (var field in characteristics[frameTitle]){
                if (this.parentEngine.gameData.constructionsData[construction.constructionTypeID][field] != undefined){
                    isEmpty = false;
                    break;
                }
            }
            if (!isEmpty){
                this.addFrame(frameTitle,gameConfig.strings_EN[frameTitle]);
                 for (var field in characteristics[frameTitle]){
                    if (this.parentEngine.gameData.constructionsData[construction.constructionTypeID][field] != undefined){
                        this.addRessourceToFrame(
                            frameTitle,
                            characteristics[frameTitle][field],
                            this.parentEngine.gameData.constructionsData[construction.constructionTypeID][field]
                        );
                    }
                 }
            }
        }
    }
}

/**
* @extends UI_Pick Derived UI_Pick to fit Spaceship picking
*/
class UI_Pick_Spaceship extends UI_Pick{
    /** 
    * @param {AsteroidViewEngine} parentEngine - Engine storing all handlers and useful objects
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    * @param {Spaceship} spaceship - Target spaceship object
    */
    constructor(parentEngine, HTMLRoot, spaceship) {
        super(parentEngine,HTMLRoot);
        this.spaceship = spaceship;

        this.HTMLRoot.querySelector(".Name").innerHTML = this.spaceship.name;
        this.HTMLRoot.querySelector(".Description").innerHTML = this.spaceship.description;

        const characteristics = {
            "ConstructionCost":{
                "costMinerals":"MINERALS",
                "costWater":"WATER",
                "costEnergy":"Energy",
            },
            "SpaceshipNavigation":{
                "speed":"SPEED",
                "range":"RANGE",
                "waterConsumption":"WATER",
            },
            "SpaceshipCombat":{
                "maxStructurePoints":"STRUCTURE",
                "shield":"SHIELD",
                "initiative":"INITIATIVE",
                "firePower":"FIRE_POWER",
            },
            "SpaceshipCargo":{
                "maxCargo":"CARGO",
            },
        }

        for (var frameTitle in characteristics){
            var isEmpty = true;
            for (var field in characteristics[frameTitle]){
                if (this.parentEngine.gameData.spaceshipsData[spaceship.spaceshipTypeID][field] != undefined){
                    isEmpty = false;
                    break;
                }
            }
            if (!isEmpty){
                this.addFrame(frameTitle,gameConfig.strings_EN[frameTitle]);
                 for (var field in characteristics[frameTitle]){
                    if (this.parentEngine.gameData.spaceshipsData[spaceship.spaceshipTypeID][field] != undefined){
                        this.addRessourceToFrame(
                            frameTitle,
                            characteristics[frameTitle][field],
                            this.parentEngine.gameData.spaceshipsData[spaceship.spaceshipTypeID][field]
                        );
                    }
                 }
            }
        }
    }
}

export {AsteroidViewEngine}