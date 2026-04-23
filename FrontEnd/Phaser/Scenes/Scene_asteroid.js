import { GameData, Construction, Spaceship } from "../../Game_data/GameData.js";
import { NetworkHandler } from "../../UI/Scripts/Network.js";
import { UI_Window, UI_Button } from "../../UI/Scripts/UI.js";

class SCENE_Asteroid extends Phaser.Scene
{
    constructor( ...args ){
        super({ key: 'SCENE_Asteroid', ...args })
    }
    /**
     * @param {Object} handlers - A collection with gameData and network handlers
     */
    create(handlers){
        /** @type {GameData} */
        this.gameData = handlers.gameData;
        /** @type {NetworkHandler} */
        this.networkHandler = handlers.networkHandler;
        this.asteroid = this.gameData.cluster.asteroids[0];
        console.log(this.asteroid);

        // Create UI DOM:
        this.UI_asteroid = new UI_Asteroid(window.gameDiv,this);

        this.scale = 15;

        const camera = this.cameras.main;
        camera.centerOnX(0);
        camera.centerOnY(0);
        const zoomFactor = camera.width/200/this.scale;
        camera.setZoom(zoomFactor*0.4);

        // Draw current asteroid
        this.drawAsteroidCircle(0,0,this.asteroid);
    }

    drawAsteroidCircle(x,y,asteroid){
        const graphics = this.add.graphics()
        graphics.lineStyle(20,gameConfig.colors["foreground"])
        graphics.strokeCircle(x,y,asteroid.baseRadius)
        this.add.circle()
    }
    
    drawAsteroidShape(x,y,asteroid) {
        for (var i = 0; i < asteroid.points.length; i++) {
            this.add.circle(x+asteroid.points[i][0], y+asteroid.points[i][1], 3, gameConfig.colors["foreground"]);
        }
        this.add.circle(x,y,15,gameConfig.colors["debug"])
        // this.add.line(0,0,0,0,0,5000,gameConfig.colors["debug"])
        // this.add.line(0,0,0,0,5000,0,gameConfig.colors["debug"])
    }
}

/**
* Class storing DOM structure and fonctions for the asteroid view UI
*/
class UI_Asteroid {
    /** 
    * UI_Asteroid creation function
    * @param {HTMLElement} parentHTML - HTML element to be attached to the UI js object
    * @param {SCENE_Asteroid} parentScene - Parent scene to access game data
    */
    constructor(parentHTML, parentScene) {
        this.parentHTML = parentHTML;
        this.parentScene = parentScene;
        this.gameData = parentScene.gameData;

        let UI_asteroidObject = this
        fetch("UI/HTML/UI_Asteroid.html")
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
        this.parentHTML.append(this.mainDiv);

        
        // Create window and associated button objects
        this.windows = {
            "Log": [],
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
        this.parentScene.networkHandler.updateGameObjectData(this.parentScene.asteroid,this,this.refresh);
    }
    /** Refresh displayed information to match gamedata state */
    refresh(){
        this.updateTimeStamp();
        this.updateRessources();
        this.updateLog();

        this.updateConstructionPicks();
        this.updateSpaceshipsPicks();
        this.updateConstructionQueue();
        this.updateSpaceshipsQueue();
    }

    /** Update timestamp */
    updateTimeStamp(){
        var sec_num = (new Date().getTime() - this.parentScene.asteroid.exportTimestamp.getTime())/1000;
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
        const stringMinerals = Math.round(this.parentScene.asteroid.ressourceMinerals*10)/10+" ("+ Math.round(this.parentScene.asteroid.mineralsGeneration*10)/10+"/h)";
        const stringWater = Math.round(this.parentScene.asteroid.ressourceWater*10)/10+" ("+ Math.round(this.parentScene.asteroid.waterGeneration*10)/10+"/h)";
        const stringEnergy = "("+ Math.round(this.parentScene.asteroid.energyGeneration*10)/10+"/h)";

        document.getElementById("ressourceMinerals").querySelector(".UI_RessourceP").innerHTML = stringMinerals;
        document.getElementById("ressourceWater").querySelector(".UI_RessourceP").innerHTML = stringWater;
        document.getElementById("ressourceEnergy").querySelector(".UI_RessourceP").innerHTML = stringEnergy;
    }

    /** Updates the logs in reference with game data*/
    updateLog(){
        for (var ev=this.parentScene.asteroid.events.length-1; ev>0; ev--){
            const eventOb = this.parentScene.asteroid.events[ev];
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
        if (this.parentScene.asteroid.constructionsQueue.length == 0){
            document.getElementById("ConstructionsQueueLabel").innerHTML = gameConfig.strings_EN["EmptyConstructionsQueue"];
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
        for (var construction in this.parentScene.asteroid.constructionsQueue){
            const constructionOb = this.parentScene.asteroid.constructionsQueue[construction];

            const newNode = document.getElementById("QueueItemFactory").cloneNode(true);
            newNode.id = "";
            document.getElementById("ConstructionQueueDiv").appendChild(newNode);
            const newQueueItem = new UI_QueueItem(this.parentScene, newNode, constructionOb, this.parentScene.asteroid.constructionsQueue);
            this.UI_constructionQueueItems.push(newQueueItem)
        }
        // Update buttons:
        for (var item in this.UI_constructionQueueItems){
            this.UI_constructionQueueItems[item].updateButtons()
        }
    }
    /**
     * Updates the soaceships queue in reference with game data
     */
    updateSpaceshipsQueue(){
        // Update status
        if (this.parentScene.asteroid.spaceshipsQueue.length == 0){
            document.getElementById("SpaceshipsQueueLabel").innerHTML = gameConfig.strings_EN["EmptySpaceshipsQueue"];
        }else{
            document.getElementById("SpaceshipsQueueLabel").style.display = "none";
        }

        // Remove existing elements
        this.UI_spaceshipsQueueItems = [];
        var previousItems = document.getElementById("SpaceshipsQueueDiv").querySelectorAll(".QueueItem");
        previousItems.forEach(function (el){
            if (el.id != "QueueItemFactory"){
                el.remove(el);
            }
        });

        // Recreate items
        for (var spaceship in this.parentScene.asteroid.spaceshipsQueue){
            const spaceshipOb = this.parentScene.asteroid.spaceshipsQueue[spaceship];

            const newNode = document.getElementById("QueueItemFactory").cloneNode(true);
            newNode.id = "";
            document.getElementById("SpaceshipsQueueDiv").appendChild(newNode);
            const newQueueItem = new UI_QueueItem(this.parentScene, newNode, spaceshipOb, this.parentScene.asteroid.spaceshipsQueue);
            this.UI_spaceshipsQueueItems.push(newQueueItem)
        }
        // Update buttons:
        for (var item in this.UI_spaceshipsQueueItems){
            this.UI_spaceshipsQueueItems[item].updateButtons()
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
            this.UI_constructionPicks[constructionID] = new UI_Pick_Construction(this.parentScene, newNode, this.gameData.constructionsTypes[constructionID]);
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
            this.UI_spaceshipPicks[spaceshipID] = new UI_Pick_Spaceship(this.parentScene ,newNode, this.gameData.spaceshipsTypes[spaceshipID]);
        }
    }
}

/**
* Class storing DOM structure and fonctions for a construction queue item
*/
class UI_QueueItem{
    /** 
    * UI_QueueItem creation function
    * @param {SCENE_Asteroid} parentScene - Parent scene to access game data
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    * @param {Construction} targetOb - Game data Construction object
    * @param {Array} queueList - The parent array for swap
    */
    constructor(parentScene, HTMLRoot, targetOb, queueList){
        this.parentScene = parentScene;
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
            const indexFrom = this.parentScene.UI_asteroid.UI_constructionQueueItems.indexOf(this);
            objectTo = this.parentScene.UI_asteroid.UI_constructionQueueItems[indexFrom-1];
        }
        if (this.targetOb instanceof Spaceship){
            const indexFrom = this.parentScene.UI_asteroid.UI_spaceshipsQueueItems.indexOf(this);
            objectTo = this.parentScene.UI_asteroid.UI_spaceshipsQueueItems[indexFrom-1];
        }
        // Send command:
            this.parentScene.networkHandler.sendCommand(
            "swapQueueObjects",
            {
                "gameObjectID":this.targetOb.gameObjectId,
                "gameObjectID2":objectTo.targetOb.gameObjectId,
                "asteroidID":this.parentScene.asteroid.gameObjectId
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
            self.parentScene.UI_asteroid.getChangesFromServer();
        },300,this);
        
    }
    downButtonClicked(){
        var objectTo = null;
        var objectTo = null;
        if (this.targetOb instanceof Construction){
            const indexFrom = this.parentScene.UI_asteroid.UI_constructionQueueItems.indexOf(this);
            objectTo = this.parentScene.UI_asteroid.UI_constructionQueueItems[indexFrom+1];
        }
        if (this.targetOb instanceof Spaceship){
            const indexFrom = this.parentScene.UI_asteroid.UI_spaceshipsQueueItems.indexOf(this);
            objectTo = this.parentScene.UI_asteroid.UI_spaceshipsQueueItems[indexFrom+1];
        }
        // Send command:
            this.parentScene.networkHandler.sendCommand(
            "swapQueueObjects",
            {
                "gameObjectID":this.targetOb.gameObjectId,
                "gameObjectID2":objectTo.targetOb.gameObjectId,
                "asteroidID":this.parentScene.asteroid.gameObjectId
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
            self.parentScene.UI_asteroid.getChangesFromServer();
        },300,this);
        
    }

    deleteButtonClicked(){
        this.parentScene.networkHandler.sendCommand(
            "deleteObject",
            {
                "gameObjectID":this.targetOb.gameObjectId, 
                "asteroidID":this.parentScene.asteroid.gameObjectId
            },
            this,
            this.deleteCallback
        );
    }
    deleteCallback(){
        this.deleteButton.setState("OFF");
        this.parentScene.UI_asteroid.getChangesFromServer();
    }
}

/**
* UI element allowing details visualization and addition to queue
*/
class UI_Pick{
    /** 
    * UI_ConstructionPick creation function
    * @param {SCENE_Asteroid} parentScene - Parent scene to get access to data
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    */
    constructor(parentScene,HTMLRoot){
        this.parentScene = parentScene;
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
        newRes.querySelector(".UI_RessourceImg").src = "./UI/Media/Ressources/"+ressourceID+".png";
        newRes.querySelector(".UI_RessourceP").innerHTML = value;
        this.HTMLRoot.querySelector("."+frameID).querySelector(".NumberFrameContent").appendChild(newRes);
    }
    /** Sends a command to add pick to queue*/
    addToQueue(){
        if (this instanceof UI_Pick_Construction){
             this.parentScene.networkHandler.sendCommand(
                "addConstructionToQueue",
                {
                    "constructionTypeID":this.construction.constructionTypeID, 
                    "asteroidID":this.parentScene.asteroid.gameObjectId
                },
                this,
                this.addToQueueCallback
            );
        }
        if (this instanceof UI_Pick_Spaceship){
             this.parentScene.networkHandler.sendCommand(
                "addSpaceShipToQueue",
                {
                    "spaceshipTypeID":this.spaceship.spaceshipTypeID, 
                    "asteroidID":this.parentScene.asteroid.gameObjectId
                },
                this,
                this.addToQueueCallback
            );
        }
    }
    /** Answer from addToQueue*/
    addToQueueCallback(){
        this.addButton.setState("OFF");
        this.parentScene.UI_asteroid.getChangesFromServer();
    }
}

/**
* @extends UI_Pick Derived UI_Pick to fit Construction picking
*/
class UI_Pick_Construction extends UI_Pick{
    /** 
    * @param {SCENE_Asteroid} parentScene - Parent scene to get access to data
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    * @param {Construction} construction - Target construction object
    */
    constructor(parentScene,HTMLRoot, construction) {
        super(parentScene,HTMLRoot);
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
                if (this.parentScene.gameData.constructionsData[construction.constructionTypeID][field] != undefined){
                    isEmpty = false;
                    break;
                }
            }
            if (!isEmpty){
                this.addFrame(frameTitle,gameConfig.strings_EN[frameTitle]);
                 for (var field in characteristics[frameTitle]){
                    if (this.parentScene.gameData.constructionsData[construction.constructionTypeID][field] != undefined){
                        this.addRessourceToFrame(
                            frameTitle,
                            characteristics[frameTitle][field],
                            this.parentScene.gameData.constructionsData[construction.constructionTypeID][field]
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
    * @param {SCENE_Asteroid} parentScene - Parent scene to get access to data
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    * @param {Spaceship} spaceship - Target spaceship object
    */
    constructor(parentScene, HTMLRoot, spaceship) {
        super(parentScene,HTMLRoot);
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
                if (this.parentScene.gameData.spaceshipsData[spaceship.spaceshipTypeID][field] != undefined){
                    isEmpty = false;
                    break;
                }
            }
            if (!isEmpty){
                this.addFrame(frameTitle,gameConfig.strings_EN[frameTitle]);
                 for (var field in characteristics[frameTitle]){
                    if (this.parentScene.gameData.spaceshipsData[spaceship.spaceshipTypeID][field] != undefined){
                        this.addRessourceToFrame(
                            frameTitle,
                            characteristics[frameTitle][field],
                            this.parentScene.gameData.spaceshipsData[spaceship.spaceshipTypeID][field]
                        );
                    }
                 }
            }
        }
    }
}

export {SCENE_Asteroid}