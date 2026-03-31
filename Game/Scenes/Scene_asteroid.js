import {GameData} from "../../Game_data/GameData.js"
import {Construction} from "../../Game_data/GameData.js"
const gameData = new GameData();

class SCENE_Asteroid extends Phaser.Scene
{
    create(){
        this.asteroid = gameData.cluster.asteroids[0]

        // Create UI DOM:
        this.UI_asteroid = new UI_Asteroid(window.gameDiv,this);

        this.scale = 15;

        const camera = this.cameras.main;
        // Center camera on the cluster
        camera.centerOnX(0);
        camera.centerOnY(0);
        // // Zoom camera to fit the cluster
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
            "Energy": [],
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


        // Open window {DEV}
        this.windows["Construction"][0].open();
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
        for (var ev in this.parentScene.asteroid.events){
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

            const newNode = document.getElementById("ConstructionQueueItemFactory").cloneNode(true);
            document.getElementById("ConstructionQueueItemFactory").parentElement.appendChild(newNode);
            const newConstructionQueueItem = new UI_ConstructionQueueItem(newNode, constructionOb);
            this.UI_constructionQueueItems.push(newConstructionQueueItem)

            new UI_Button(newNode.querySelectorAll(".UI_Button")[0],newConstructionQueueItem,newConstructionQueueItem.upButtonClicked);
            new UI_Button(newNode.querySelectorAll(".UI_Button")[1],newConstructionQueueItem,newConstructionQueueItem.downButtonClicked);
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
        this.UI_constructionPicks = {};
        for (var constructionID in gameData.constructionsTypes){
            const newNode = document.getElementById("ConstructionPickFactory").cloneNode(true);
            document.getElementById("ConstructionPickFactory").parentElement.appendChild(newNode);
            this.UI_constructionPicks[constructionID] = new UI_ConstructionPick(newNode, gameData.constructionsTypes[constructionID]);
        }
    }
}

/**
* Class storing DOM structure and fonctions for a construction queue item
*/
class UI_ConstructionQueueItem{
    /** 
    * UI_ConstructionQueueItem creation function
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    * @param {Construction} constructionOb - Game data Construction object
    */
    constructor(HTMLRoot, constructionOb){
        this.HTMLRoot = HTMLRoot;
        this.constructionOb = constructionOb;

        this.HTMLRoot.classList.remove("UI_Factory");
        this.HTMLRoot.querySelector(".DurationText").innerHTML = constructionOb.constructedEnergy;
        this.HTMLRoot.querySelector(".ConstructionName").innerHTML = constructionOb.name;

        this.HTMLRoot.style.top = "0px";
    }
    updateButtons(){
        // Disable buttons for extremities:
        if (Array.from(this.HTMLRoot.parentNode.children).indexOf(this.HTMLRoot) == 2){
            this.HTMLRoot.querySelectorAll(".UI_Button")[0].UI_ob.setState("DISABLED");
        }else{
            this.HTMLRoot.querySelectorAll(".UI_Button")[0].UI_ob.setState("OFF");
        }
        if (Array.from(this.HTMLRoot.parentNode.children).indexOf(this.HTMLRoot) == this.HTMLRoot.parentNode.children.length-1){
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
class UI_ConstructionPick{
    /** 
    * UI_ConstructionPick creation function
    * @param {HTMLElement} HTMLRoot - Item root HTML element
    * @param {Construction} construction - Construction type unique identifier
    */
    constructor(HTMLRoot, construction){
        this.HTMLRoot = HTMLRoot;
        this.construction = construction;

        this.HTMLRoot.classList.remove("UI_Factory");
        this.HTMLRoot.querySelector(".ConstructionName").innerHTML = this.construction.name;
        this.HTMLRoot.querySelector(".DurationText").innerHTML = this.construction.constructedEnergy;
        this.HTMLRoot.querySelector(".Description").innerHTML = this.construction.description;

        // Add button behavior
        this.HTMLRoot.querySelector(".AddToQueueButtonText").innerHTML = "▲ " + gameConfig.strings_EN["AddToQueue"] + " ▲";
        this.addButton = new UI_Button( this.HTMLRoot.querySelector(".UI_Button"),null,null);

        // Set frame titles
        this.HTMLRoot.querySelector(".CostFrame").querySelector(".NumberFrameTitle").innerHTML = gameConfig.strings_EN["ConstructionCost"];
        this.HTMLRoot.querySelector(".GenerationFrame").querySelector(".NumberFrameTitle").innerHTML = gameConfig.strings_EN["ConstructionGeneration"];
        this.HTMLRoot.querySelector(".DefenseFrame").querySelector(".NumberFrameTitle").innerHTML = gameConfig.strings_EN["ConstructionDefense"];

        // Set frames values
        this.HTMLRoot.querySelector(".CostFrame").querySelector(".Energy").innerHTML = this.construction.costEnergy;
        this.HTMLRoot.querySelector(".CostFrame").querySelector(".Minerals").innerHTML = this.construction.costMinerals;
        this.HTMLRoot.querySelector(".CostFrame").querySelector(".Water").innerHTML = this.construction.costWater;
        this.HTMLRoot.querySelector(".GenerationFrame").querySelector(".Energy").innerHTML = this.construction.generationEnergy;
        this.HTMLRoot.querySelector(".GenerationFrame").querySelector(".Minerals").innerHTML = this.construction.generationMinerals;
        this.HTMLRoot.querySelector(".GenerationFrame").querySelector(".Water").innerHTML = this.construction.generationWater;
        this.HTMLRoot.querySelector(".DefenseFrame").querySelector(".Structure").innerHTML = this.construction.maxStructurePoints;
        this.HTMLRoot.querySelector(".DefenseFrame").querySelector(".Damage").innerHTML = this.construction.damage;
    }
}

export {SCENE_Asteroid}