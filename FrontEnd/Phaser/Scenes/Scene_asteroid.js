class SCENE_Asteroid extends Phaser.Scene
{
    create(){
        this.asteroid = GAME_DATA.cluster.asteroids[0]

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

        let UI_asteroidObject = this
        fetch("UI/HTML/UI_Asteroid.html")
        .then((response) => response.text())
        .then((text) => {
            let parser = new DOMParser();
            let DOM = parser.parseFromString(text, 'text/html');
            UI_asteroidObject.receivedHTML(DOM);
        });
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

        this.updateLog();
        this.updateConstructionQueue();
        this.updateConstructionPicks();
        this.updateSpaceshipsQueue();
        this.updateSpaceshipsPicks();


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

    /**
     * Updates the logs in reference with game data
     */
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

    /**
     * Updates the construction queue in reference with game data
     */
    updateConstructionQueue(){
        this.UI_constructionQueueItems = [];
        for (var construction in this.parentScene.asteroid.constructionQueue){
            const constructionOb = this.parentScene.asteroid.constructionQueue[construction];

            const newNode = document.getElementById("QueueItemFactory").cloneNode(true);
            document.getElementById("ConstructionQueueDiv").appendChild(newNode);
            const newQueueItem = new UI_QueueItem(newNode, constructionOb, this.parentScene.asteroid.constructionQueue);
            this.UI_constructionQueueItems.push(newQueueItem)

            new UI_Button(newNode.querySelectorAll(".UI_Button")[0],newQueueItem,newQueueItem.upButtonClicked);
            new UI_Button(newNode.querySelectorAll(".UI_Button")[1],newQueueItem,newQueueItem.downButtonClicked);
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
        this.UI_spaceshipsQueueItems = [];
        for (var spaceship in this.parentScene.asteroid.spaceshipsQueue){
            const spaceshipOb = this.parentScene.asteroid.spaceshipsQueue[spaceship];

            const newNode = document.getElementById("QueueItemFactory").cloneNode(true);
            document.getElementById("SpaceshipsQueueDiv").appendChild(newNode);
            const newSpaceshipQueueItem = new UI_QueueItem(newNode, spaceshipOb, this.parentScene.asteroid.spaceshipsQueue);
            this.UI_spaceshipsQueueItems.push(newSpaceshipQueueItem)

            new UI_Button(newNode.querySelectorAll(".UI_Button")[0],newSpaceshipQueueItem,newSpaceshipQueueItem.upButtonClicked);
            new UI_Button(newNode.querySelectorAll(".UI_Button")[1],newSpaceshipQueueItem,newSpaceshipQueueItem.downButtonClicked);
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
        this.UI_constructionPicks = {};
        for (var constructionID in GAME_DATA.constructionsTypes){
            const newNode = document.getElementById("PickItemFactory").cloneNode(true);
            document.getElementById("ConstructionPicksDiv").appendChild(newNode);
            this.UI_constructionPicks[constructionID] = new UI_Pick_Construction(newNode, gameData.constructionsTypes[constructionID]);
        }
    }
    /**
     * Update the available spaceships in reference with game data
     */
    updateSpaceshipsPicks(){
        this.UI_spaceshipPicks = {};
        for (var spaceshipID in GAME_DATA.spaceshipsTypes){
            const newNode = document.getElementById("PickItemFactory").cloneNode(true);
            document.getElementById("SpaceshipPicksDiv").appendChild(newNode);
            this.UI_spaceshipPicks[spaceshipID] = new UI_Pick_Spaceship(newNode, GAME_DATA.spaceshipsTypes[spaceshipID]);
        }
    }
}

/**
* Class storing DOM structure and fonctions for a construction queue item
*/
class UI_QueueItem{
    /** 
    * UI_QueueItem creation function
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    * @param {Construction} targetOb - Game data Construction object
    */
    constructor(HTMLRoot, targetOb, queueList){
        this.HTMLRoot = HTMLRoot;
        this.targetOb = targetOb;
        this.queueList = queueList;

        this.HTMLRoot.classList.remove("UI_Factory");
        this.HTMLRoot.querySelector(".DurationText").innerHTML = targetOb.constructedEnergy;
        this.HTMLRoot.querySelector(".Name").innerHTML = targetOb.name;

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
        const exchangeTarget = this.HTMLRoot.previousElementSibling;
        const yOffset = exchangeTarget.getBoundingClientRect().top - this.HTMLRoot.getBoundingClientRect().top;
        this.HTMLRoot.style.top = yOffset+"px";
        exchangeTarget.style.top = -yOffset+"px";
        setTimeout(function(self){
            self.HTMLRoot.querySelectorAll(".UI_Button")[0].UI_ob.setState("OFF");
        },300,this);
    }
    downButtonClicked(){
        const exchangeTarget = this.HTMLRoot.nextElementSibling;
        const yOffset = exchangeTarget.getBoundingClientRect().top - this.HTMLRoot.getBoundingClientRect().top;
        this.HTMLRoot.style.top = yOffset+"px";
        exchangeTarget.style.top = -yOffset+"px";
        setTimeout(function(self){
            self.HTMLRoot.querySelectorAll(".UI_Button")[1].UI_ob.setState("OFF");
        },300,this);
    }
}


/**
* UI element allowing details visualization and addition to queue
*/
class UI_Pick{
    /** 
    * UI_ConstructionPick creation function
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    */
    constructor(HTMLRoot){
        this.HTMLRoot = HTMLRoot;

        this.HTMLRoot.classList.remove("UI_Factory");

        // Add button behavior
        this.HTMLRoot.querySelector(".AddToQueueButtonText").innerHTML = "▲ " + gameConfig.strings_EN["AddToQueue"] + " ▲";
        this.addButton = new UI_Button( this.HTMLRoot.querySelector(".UI_Button"),null,null);

        this.numberFrames = {};

        // this.HTMLRoot.querySelector(".DefenseFrame").querySelector(".Structure").innerHTML = this.construction.maxStructurePoints;
        // this.HTMLRoot.querySelector(".DefenseFrame").querySelector(".Damage").innerHTML = this.construction.damage;
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
}

/**
* @extends UI_Pick
* Derived UI_Pick to fit Construction picking
*/
class UI_Pick_Construction extends UI_Pick{
    /** 
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    * @param {Construction} construction - Target construction object
    */
    constructor(HTMLRoot, construction) {
        super(HTMLRoot);
        this.construction = construction;

        this.HTMLRoot.querySelector(".Name").innerHTML = this.construction.name;
        this.HTMLRoot.querySelector(".Description").innerHTML = this.construction.description;

        this.addFrame("CostFrame",gameConfig.strings_EN["ConstructionCost"]);
        this.addRessourceToFrame("CostFrame","MINERALS",this.construction.costMinerals);
        this.addRessourceToFrame("CostFrame","WATER",this.construction.costWater);
        this.addRessourceToFrame("CostFrame","ENERGY",this.construction.costEnergy);

        this.addFrame("GenerationFrame",gameConfig.strings_EN["ConstructionGeneration"]);
        this.addRessourceToFrame("GenerationFrame","MINERALS",this.construction.generationMinerals);
        this.addRessourceToFrame("GenerationFrame","WATER",this.construction.generationWater);
        this.addRessourceToFrame("GenerationFrame","ENERGY",this.construction.generationEnergy);

        this.addFrame("DefenseFrame",gameConfig.strings_EN["ConstructionDefense"]);
        this.addRessourceToFrame("DefenseFrame","STRUCTURE",this.construction.maxStructurePoints);
        this.addRessourceToFrame("DefenseFrame","SHIELD",this.construction.shield);
        this.addRessourceToFrame("DefenseFrame","FIRE_POWER",this.construction.firePower);
    }
}

/**
* @extends UI_Pick
* Derived UI_Pick to fit Spaceship picking
*/
class UI_Pick_Spaceship extends UI_Pick{
    /** 
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    * @param {Spaceship} spaceship - Target spaceship object
    */
    constructor(HTMLRoot, spaceship) {
        super(HTMLRoot);
        this.spaceship = spaceship;

        this.HTMLRoot.querySelector(".Name").innerHTML = this.spaceship.name;
        this.HTMLRoot.querySelector(".Description").innerHTML = this.spaceship.description;

        this.addFrame("CostFrame",gameConfig.strings_EN["ConstructionCost"]);
        this.addRessourceToFrame("CostFrame","MINERALS",this.spaceship.costMinerals);
        this.addRessourceToFrame("CostFrame","WATER",this.spaceship.costWater);
        this.addRessourceToFrame("CostFrame","ENERGY",this.spaceship.costEnergy);

        this.addFrame("NavigationFrame",gameConfig.strings_EN["SpaceshipNavigation"]);
        this.addRessourceToFrame("NavigationFrame","SPEED",this.spaceship.speed);
        this.addRessourceToFrame("NavigationFrame","RANGE",this.spaceship.range);
        this.addRessourceToFrame("NavigationFrame","WATER",this.spaceship.waterConsumption);

        this.addFrame("CombatFrame",gameConfig.strings_EN["SpaceshipCombat"]);
        this.addRessourceToFrame("CombatFrame","STRUCTURE",this.spaceship.maxStructurePoints);
        this.addRessourceToFrame("CombatFrame","SHIELD",this.spaceship.shield);
        this.addRessourceToFrame("CombatFrame","INITIATIVE",this.spaceship.initiative);
        this.addRessourceToFrame("CombatFrame","FIRE_POWER",this.spaceship.firePower);

         this.addFrame("CargoFrame",gameConfig.strings_EN["SpaceshipCargo"]);
        this.addRessourceToFrame("CargoFrame","CARGO",this.spaceship.maxCargo);
    }
}
export {SCENE_Asteroid}