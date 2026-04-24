class GameData {
    constructor() {
        /** @type {Date} - Game start date and time */
        this.startDate = new Date();
        /** @type {number} - Elapsed seconds since game start */
        this.elapsedSeconds = 0;
        /** @type {Date} - Game current date */
        this.currentDate = new Date();
        /** @type {number} - Time in s, between two iterations of the game world */
        this.iterationLoopTime = 3;
        /** @type {number} - {DEV} allowing time multiplication for dev purposes */
        this.DEV_timeMultiplier = 0;//3600/this.iterationLoopTime;
        
        /** @type {integer} - Incremental counter to allow individual unique ids for all game objects */
        this.gameObjectCurrentID = 0;
         /** @type {GameObject[]} - Flat list of all gameobjects */
        this.gameObjectsFlatList = [];


        /** @type {JSON} - Collection of constructions static fields information */
        this.constructionsData = {};
        /** @type {Construction{}} - Collection of default constructions */
        this.constructionsTypes = {};


        /** @type {JSON} - Collection of spaceships static fields information */
        this.spaceshipsData = {};
        /** @type {Spaceship{}} - Collection of default spaceships */
        this.spaceshipsTypes = {};

        /** @type {Cluster} - The game cluster */
        this.cluster = null;
    }

     /** 
    * Generate a cluster of asteroids
    * */
    generateWorld(){
        this.cluster = new Cluster(this);
        this.cluster.spawnAsteroids();
        console.log("Generated world")
    }

    /** 
    * Create reference objets from static data fields
    * */
    createObjectTypes(){
        for (var constructionTypeID in this.constructionsData){
            this.constructionsTypes[constructionTypeID] = new Construction(this,null,constructionTypeID);
        }
        for (var spaceshipTypeID in this.spaceshipsData){
            this.spaceshipsTypes[spaceshipTypeID] = new Spaceship(this,null,spaceshipTypeID);
        }
    }

    /** 
    * Returns the instance of the object with gameObjectId
    * @param {object} JSONData - An {object} structure containing all fields.
    * */
    getGameObjectById(gameObjectId){
        for (var ob in this.gameObjectsFlatList){
            if (this.gameObjectsFlatList[ob].gameObjectId == gameObjectId){
                return this.gameObjectsFlatList[ob];
            }
        }
        throw new Error("No object found for gameObjectId "+gameObjectId);
    }

    /** Starts iterating to propagate the game state through time */
    startIterationLoopTime(){
        this.loopInterval = setInterval(function(self){self.runLoopIteration()},this.iterationLoopTime*1000,this);
    }
    /** Runs a loop to propagate the game state through time */
    runLoopIteration(){
        const dt = this.iterationLoopTime * this.DEV_timeMultiplier;
        this.elapsedSeconds += dt;
        this.currentDate = new Date(this.startDate.getTime()+this.elapsedSeconds*1000);
        this.cluster.runLoopIteration(dt);
    }


    /** 
    * Export all dynamic fields relative to game state to JSON
    * @param {Date} timestamp - Only data occuring before timestamp will be returned
    * @returns {object} - An {object} structure containing all fields.
    * */
    exportJSON(timestamp){
        var data = {};

        data.gameObjectCurrentID = this.gameObjectCurrentID;

        data.startDate        = this.startDate.toISOString();
        data.elapsedSeconds   = this.elapsedSeconds;
        data.currentDate      = this.currentDate.toISOString();

        data.cluster = this.cluster.exportJSON(timestamp);

        return data;
    }

    /** 
    * Load all dynamic fields relative to game state from JSON to this object
    * @param {object} JSONData - An {object} structure containing all fields.
    * */
    loadJSON(JSONData){
        this.gameObjectCurrentID = JSONData.gameObjectCurrentID;

        this.startDate      = new Date(Date.parse(JSONData.startDate));
        this.elapsedSeconds = JSONData.elapsedSeconds;
        this.currentDate    = new Date(Date.parse(JSONData.currentDate));

        this.cluster = new Cluster(this);
        this.cluster.loadJSON(JSONData["cluster"]);
    }
}

/**
* All game objects share this class
*/
class GameObject{
    constructor(gameData){
        this.gameData = gameData;
        /** @type {integer} - A unique identifier for this gameObject */
        this.gameObjectId;
        /** @type {Date} - The timestamp at which this gameObject had been exported */
        this.exportTimestamp;
    }
    /** Attribute a new unique gameObjectID to this object */
    attributeNewId(){
        this.gameObjectId = this.gameData.gameObjectCurrentID;
        console.log(this.constructor.name+ " "+this.gameObjectId);
        this.gameData.gameObjectsFlatList.push(this);
        this.gameData.gameObjectCurrentID ++;
    }
    exportJSON(timestamp){
        this.exportTimestamp = timestamp;
        return {"gameObjectId":this.gameObjectId,"timestamp":timestamp.toISOString()};
    }
    loadJSON(data){
        this.gameObjectId = data.gameObjectId;
        this.gameData.gameObjectsFlatList.push(this);
        this.exportTimestamp = new Date(Date.parse(data.timestamp));
    }
    delete(){
         // Remove itself from the flat list
        for (var ob in this.gameData.gameObjectsFlatList){
            if (this.gameData.gameObjectsFlatList[ob].gameObjectId == this.gameObjectId){
                this.gameData.gameObjectsFlatList.splice(ob,1);
            }
        }
    }
}

/**
* Store functions related to cluster of asteroids generation
*/
class Cluster{
     /** 
    * Cluster creation function
    * @param {GameData} gameData - GameData object storing all variables
    */
    constructor(gameData) {
        this.gameData = gameData;
        /**
         * The cluster list of asteroids
         * @type {Asteroid[]}
         */
        this.asteroids = [];
        this.minX = 0;
        this.maxX = 0;
        this.minY = 0;
        this.maxY = 0;
    }

    spawnAsteroids(){
        const coords = this.generateAsteroidsCoordinates(1, 1, 0.2, 3);
        for (var asteroid in coords){
            this.createAsteroid(new Asteroid(this.gameData, coords[asteroid][0], coords[asteroid][1]));
        }
    }

    /** Add an asteroid to the cluster and register it with unique ID @param {Asteroid} - The asteroid to be added */
    createAsteroid(asteroid){
        this.asteroids.push(asteroid);
        asteroid.attributeNewId();
    }
    
    /** 
    * Generates coordinates with a set of given constraints
    * @param {integer} n_asteroids - Number of asteroids to be generated
    * @param {number} mapRadius - Map radius, in LightMinutes
    * @param {number} minDistance - Min distance between two asteroids, LightMinutes
    * @param {number} distanceVariation - Distance variation, in ratio of the minDistance
    * @return {Array} Returns an Array of coordinates
    */
    generateAsteroidsCoordinates(n_asteroids, mapRadius, minDistance, distanceVariation) {
        this.mapRadius = mapRadius;
        while (true) {
                var asteroidsCoordinates = [];
                var tries = 0;
                var x = 0;
                var y = 0;
                asteroidsCoordinates.push([x,y]);
                var asteroidCount = 1;
            while (tries < 10000) { // Try 10000 times
                tries++;
                var newHeading = Math.random()*2*Math.PI;
                var newDistance = minDistance+Math.random()*(minDistance*distanceVariation);
                x = x+Math.cos(newHeading)*newDistance;
                y = y+Math.sin(newHeading)*newDistance;

                // Check if the new asteroid is far enough from the others
                var tooClose = false;
                
                for (var asteroid in asteroidsCoordinates) {
                    var distance = Math.sqrt(Math.pow(x-asteroidsCoordinates[asteroid][0],2)+Math.pow(y-asteroidsCoordinates[asteroid][1],2));
                    if (distance < minDistance) {
                        tooClose = true;
                        break;
                    }                
                }

                // Check if the new asteroid is not too far from the center of the map
                var tooFar = false;
                var distanceFromCenter = Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
                if (distanceFromCenter > mapRadius) {
                    tooFar = true;
                    break;
                }

                // If no astroid is breaking the distance constraint, add a new asteroid
                if (!tooClose && !tooFar) {
                    if (asteroidCount >= n_asteroids) {
                        return asteroidsCoordinates;
                    }
                    asteroidsCoordinates.push([x,y]);
                    asteroidCount++;
                }

                if (x < this.minX) {this.minX = x;}
                if (x > this.maxX) {this.maxX = x;}
                if (y < this.minY) {this.minY = y;}
                if (y > this.maxY) {this.maxY = y;}
            }
        }
    }

    /** Runs a loop to propagate the game state through time 
     * @param {number} dt - Elapsed seconds since last loop
    */
    runLoopIteration(dt){
        for (var asteroid in this.asteroids){
            this.asteroids[asteroid].runLoopIteration(dt);
        }
    }

    /** 
    * Export all dynamic fields relative to game state to JSON
    * @param {Date} timestamp - Only data occuring before timestamp will be returned
    * @returns {object} - An {object} structure containing all fields.
    * */
    exportJSON(timestamp){
        var data = {};
        data.asteroids = [];
        for (var ast in this.asteroids){
            data["asteroids"].push(this.asteroids[ast].exportJSON(timestamp));
        }
        return data;
    }
    /** 
    * Load all dynamic fields relative to game state from JSON to this object
    * @param {object} JSONData - An {object} structure containing all fields.
    * */
    loadJSON(JSONData){
        this.asteroids = [];
        for (var asteroid in JSONData["asteroids"]){
            const newAsteroid = new Asteroid(this.gameData, null, null, null);
            newAsteroid.loadJSON(JSONData["asteroids"][asteroid]);
            this.asteroids.push(newAsteroid);
        }
    }
}

/**
* Class storing all vars and functions related to an Asteroid
*/
class Asteroid extends GameObject{
    /** 
    * Asteroid creation function
    * @param {GameData} gameData - GameData object storing all variables
    * @param {number} x - X coordinate of the asteroid
    * @param {number} y - Y coordinate of the asteroid
    */
    constructor(gameData, x,y) {
        super(gameData);

        this.gameData.asteroidCurrentID ++;

        /** @type {number} - X coordiate of this asteroid */
        this.x = x;
        /** @type {number} - Y coordiate of this asteroid */
        this.y = y;
        /** @type {number} - Diameter of the asteroid in km */
        this.size = 50;

        /** @type {number} - Minerals stored in this asteroid in tons */
        this.ressourceMinerals = 10; 
        /** @type {number} - Water stored in this asteroid in tons */
        this.ressourceWater = 10; 

        /** @type {number} - Mineral production in tons per hour */
        this.mineralsGeneration = -1;
        /** @type {number} - Water production in tons per hour */
        this.waterGeneration = -1; 
        /** @type {number} - Energy production in kW */
        this.energyGeneration = -1;

        /** @type {GameEvent[]} - The asteroid list of events */
        this.events = [];
        
        /** @type {GameObject[]} - The asteroid constructions queue list */
        this.constructionsQueue = [];
        /** @type {string} - The asteroid constructions queue status, either IDLE, RUNNING or BLOCKED_RESSOURCES*/
        this.constructionsQueueStatus = "IDLE";

        /** @type {Construction[]} - The asteroid completed constructions */
        this.constructions = [];
        /** @type {Spaceship[]} - List of spaceships based to this asteroid */
        this.spaceships = [];

        // this.generateShapePoints(200,500,1);
        // this.DEV_generateEvents();
        // this.DEV_generateQueue();
    }

    /** Updates the ressources production rates according to the asteroid constructions */
    updateRessourceProduction(){
        this.mineralsGeneration = 1;
        this.waterGeneration = 0.1;
        this.energyGeneration = 1;

        for (var construction in this.constructions){
            this.mineralsGeneration += this.constructions[construction].generationMinerals;
            this.waterGeneration += this.constructions[construction].generationWater;
            this.energyGeneration += this.constructions[construction].generationEnergy;
        }
    }
    /** 
    * @summary Generate noisy circular pattern to represent the asteroid shape
    * @param {number} minSize Minimal base radius, km
    * @param {number} maxSize Maximal base radius, km
    * @param {number} randomness Between 0 and 1, the higher the weirdest
    * @param {number} pointDensity Number of points per km radius
    * @return {Array} Returns the generated points, and store them to the asteroid object
    */
    generateShapePoints(minSize, maxSize, randomness, pointDensity=1/4){
        this.maxRadius = 0

        this.baseRadius = minSize+Math.random()*(maxSize-minSize);
        this.numPoints = 2*Math.round(this.baseRadius*pointDensity/2) // Mutliple of 2 for mirror
        
        // Create array
        this.points = [];
        for (var i = 0; i < this.numPoints; i++) {
            this.points.push([-this.numPoints/2+i,0]);
        }
        // Add random sinusoids to the points
        for (var i = 0; i < 10; i++) {
            var factor = Math.random()*(20+50*randomness);
            var frequency = 5+Math.random()*(25+25*randomness);
            for (var p = 0; p < this.numPoints/2; p++) {
                this.points[p][1] += factor * Math.sin(this.points[p][0] / frequency);
            }
        }
        // Trim the points crossing 0
        for (var p = 0; p < 5; p++) {
            this.points[p][1] = this.points[5][1]*Math.pow(p/5,2/3);
        }
        // Mirror the points
        for (var i = 0; i < this.numPoints/2; i++) {
            this.points[this.numPoints/2+i][1] = -this.points[this.numPoints/2-i][1];
        }
        // Circularize
        for (var p = 0; p < this.numPoints; p++) {
            const dist = (this.baseRadius-this.points[p][1])
            if (dist > this.maxRadius) {this.maxRadius = dist}
            this.points[p][0] = Math.cos(p/this.numPoints*2*Math.PI)*dist;
            this.points[p][1] = Math.sin(p/this.numPoints*2*Math.PI)*dist;
        }
    }
    /** 
    * Add an event to this asteroid
    * @param {GameEvent} event - Event object to be added
    */
    addEvent(event){
        this.events.push(event);
    }

    /** 
    * Add a construction to this asteroid construction queue and register unique id
    * @param {string} constructionTypeID - Construction type to be added
    */
    addConstructionToQueue(constructionTypeID){
        const newConstruction = new Construction(this.gameData, this, constructionTypeID);
        newConstruction.attributeNewId();
        this.constructionsQueue.push(newConstruction);
    }
    /** 
    * Add a spaceship to this asteroid construction queue and register unique id
    * @param {string} spaceshipTypeID - Spaceship type to be added
    */
    addSpaceshipToQueue(spaceshipTypeID){
        const newSpaceShip = new Spaceship(this.gameData, this, spaceshipTypeID);
        newSpaceShip.attributeNewId();
        this.constructionsQueue.push(newSpaceShip);
    }
    /** 
    * Remove a game object from this asteroid construction list
    * @param {GameObject} gameObject - Game object to be removed
    */
    cancelConstruction(gameObject){
        this.constructionsQueue.splice(this.constructionsQueue.indexOf(gameObject),1);
    }

    /** 
    * Swaps two elements from a queue
    * @param {GameObject} gameObject - First object
    * @param {GameObject} gameObject2 - second object
    */
    swapQueueObjects(gameObject, gameObject2){
        const switchCopy = gameObject;
        const index = this.constructionsQueue.indexOf(gameObject);
        const index2 = this.constructionsQueue.indexOf(gameObject2);
        this.constructionsQueue[index] = gameObject2;
        this.constructionsQueue[index2] = switchCopy;
    }

    /** Runs a loop to propagate the game state through time 
     * @param {number} dt - Elapsed seconds since last loop
    */
    runLoopIteration(dt){
        this.updateRessourceProduction();

        // Ressources
        this.ressourceMinerals += this.mineralsGeneration*dt/3600;
        this.ressourceWater += this.waterGeneration*dt/3600;

        // Energy ratios
        const energyConstruction = 1*this.energyGeneration*dt;
        const energyShipyard = 0*dt;
        const energyScience = 0*dt;

        // Construction
        if (this.constructionsQueue.length > 0){
            this.constructionsQueue[0].constructedEnergy += energyConstruction;
            if (this.constructionsQueue[0].constructedEnergy >= this.constructionsQueue[0].costEnergy){
                if (this.constructionsQueue[0].constructor.name == "Construction"){
                    this.constructions.push(this.constructionsQueue[0]);
                }
                if (this.constructionsQueue[0].constructor.name == "Spaceship"){
                    this.spaceships.push(this.constructionsQueue[0]);
                }
                this.constructionsQueue.splice(0,1);
            }
        }
    }

    /** 
    * Export all dynamic fields relative to game state to JSON
    * @param {Date} timestamp - Only data occuring before timestamp will be returned
    * @returns {object} - An {object} structure containing all fields.
    * */
    exportJSON(timestamp){      
        var data = super.exportJSON(timestamp);
        data.x = this.x;
        data.y = this.y;

        data.ressourceMinerals           = this.ressourceMinerals;
        data.ressourceWater              = this.ressourceWater;
        data.mineralsGeneration = this.mineralsGeneration;
        data.waterGeneration    = this.waterGeneration;
        data.energyGeneration   = this.energyGeneration;

        data["constructions"] = [];
        for (var construction in this.constructions){
            data["constructions"].push(this.constructions[construction].exportJSON(timestamp))
        }
        data["constructionsQueue"] = [];
        for (var construction in this.constructionsQueue){
            data["constructionsQueue"].push(this.constructionsQueue[construction].exportJSON(timestamp))
        }

        data["spaceships"] = [];
        for (var spaceship in this.spaceships){
            data["spaceships"].push(this.spaceships[spaceship].exportJSON(timestamp))
        }

        return data;
    }

    /** 
    * Load all dynamic fields relative to game state from JSON to this object
    * @param {object} JSONData - An {object} structure containing all fields.
    * */
    loadJSON(JSONData){
        super.loadJSON(JSONData);
        this.x = JSONData.x;
        this.y = JSONData.x;

        this.ressourceMinerals           = JSONData.ressourceMinerals;
        this.ressourceWater              = JSONData.ressourceWater;
        this.mineralsGeneration = JSONData.mineralsGeneration;
        this.waterGeneration    = JSONData.waterGeneration;
        this.energyGeneration   = JSONData.energyGeneration;

        this.constructions = [];
        for (var construction in JSONData.constructions){
            const newConstruction = new Construction(this.gameData, this, null);
            newConstruction.loadJSON(JSONData.constructions[construction]);
            newConstruction.loadStaticFields();
            this.constructions.push(newConstruction);
        }
        this.constructionsQueue = [];
        for (var construction in JSONData.constructionsQueue){
            var newConstruction;
            if (JSONData.constructionsQueue[construction].constructionTypeID == undefined){
                newConstruction = new Spaceship(this.gameData, this, null);
            }
            if (JSONData.constructionsQueue[construction].spaceshipTypeID == undefined){
                newConstruction = new Construction(this.gameData, this, null);
            }
            newConstruction.loadJSON(JSONData.constructionsQueue[construction]);
            newConstruction.loadStaticFields();
            this.constructionsQueue.push(newConstruction);
        }

        this.spaceships = [];
        for (var spaceship in JSONData.spaceships){
            const newSpaceship = new Spaceship(this.gameData, this, null);
            newSpaceship.loadJSON(JSONData.spaceships[spaceship]);
            newSpaceship.loadStaticFields();
            this.spaceships.push(newSpaceship);
        }
    }
}

/**
* Datastructure of an event
*/
class GameEvent {
    /** 
    * GameEvent creation function
    * @param {GameData} gameData - GameData object storing all variables
    * @param {Date} timestamp - A date of occurence
    * @param {Object} location - An object with the location of occurence: Asteroid, coordinates
    */
    constructor(gameData, timestamp, location) {
        this.gameData = gameData;
        this.timestamp = timestamp;
        this.location = location;
    }
}

/**
* Event to be fired when a construction is complete 
* @extends GameEvent
*/
class ConstructionCompleteEvent extends GameEvent {
    /** 
    * ConstructionCompleteEvent creation function
    * @param {GameData} gameData - GameData object storing all variables
    * @param {Construction} construction - Event target object, or null
    */
    constructor(gameData, construction) {
        super(gameData, construction.constructionDate, construction.asteroid);
        this.construction = construction;
    }
}

/**
* Class representing a building
*/
class Construction extends GameObject {
    /**
    * Construction creation function
    * @param {GameData} gameData - GameData object storing all variables
    * @param {Asteroid} asteroid - Parent asteroid object
    * @param {String} constructionTypeID - Construction ID, one per type of construction
    */
    constructor(gameData, asteroid, constructionTypeID) {
        super(gameData);
        /**
        * The construction parent asteroid
        * @type {Asteroid}
        */
        this.asteroid = asteroid;

        this.constructionTypeID = constructionTypeID;

        // Default values. To be overriden by JSON data from gamedata.
        /** @type {string} - Construction name */
        this.name = "{DEFAULT}_NAME";
        /** @type {string} - Construction description in picker */
        this.description = "{DEFAULT}_DESCRIPTION";

        /** @type {number} - Total energy required for initial construction */
        this.costEnergy = 1;
        /** @type {number} - Total minerals required for initial construction */
        this.costMinerals = 0;
        /** @type {number} - Total water required for initial construction */
        this.costWater = 0;
        /** @type {number} - Produced energy by cycle */
        this.generationEnergy = 0;
        /** @type {number} - Produced minerals by cycle */
        this.generationMinerals = 0;
        /** @type {number} - Produced water by cycle */
        this.generationWater = 0;

        /** @type {number} - Construction intial structure points */
        this.maxStructurePoints = 0;
        /** @type {number} - Shield reducing incoming damage */
        this.shield = 0;
        /** * @type {number} - Damage dealt to ennemy units shield and structure points */
        this.firePower = 0;

        // Update fields with static data:
        this.loadStaticFields();


        // Initialize dynamic fields
        /** @type {Date} Construction date */
        this.constructionDate = new Date();
        /** @type {number} - Amount of energy used for construction (progress) */
        this.constructedEnergy = 0;
        /** @type {number} - Remaining structure points */
        this.structurePoints = this.maxStructurePoints;
    }

     /** Load all type related static fields */
    loadStaticFields(){
        const statics = this.gameData.constructionsData[this.constructionTypeID];
        for (var field in statics){
            this[field] = statics[field];
        }
    }

    /** 
    * Export all dynamic fields relative to game state to JSON
    * @param {Date} timestamp - Only data occuring before timestamp will be returned
    * @returns {object} - An {object} structure containing all fields.
    * */
    exportJSON(timestamp){
        var data = super.exportJSON(timestamp);
        data.constructionTypeID = this.constructionTypeID;
        data.constructionDate = this.constructionDate;
        data.constructedEnergy = this.constructedEnergy;
        data.structurePoints = this.structurePoints;
        return data;
    }
    /** 
    * Load all dynamic fields relative to game state from JSON to this object
    * @param {object} JSONData - An {object} structure containing all fields.
    * */
    loadJSON(JSONData){
        super.loadJSON(JSONData);
        this.constructionTypeID = JSONData.constructionTypeID;
        this.constructionDate = Date.parse(JSONData.constructionDate);
        this.constructedEnergy = JSONData.constructedEnergy;
        this.structurePoints = JSONData.structurePoints;
    }
}

/**
* Class representing a spacecraft
*/
class Spaceship extends GameObject{
    /**
    * Spaceship creation function
    * @param {GameData} gameData - GameData object storing all variables
    * @param {Asteroid} asteroid - The asteroid where the spaceship is based
    * @param {String} spaceshipTypeID - spaceship ID, one per type of spaceship
    */
   constructor(gameData, asteroid, spaceshipTypeID) {
        super(gameData);
        this.asteroid = asteroid;
        this.spaceshipTypeID = spaceshipTypeID;

        // Default values. To be overriden by JSON data from gamedata.
        /** @type {string} - Spaceship name */
        this.name = "{DEFAULT}_NAME";
        /** @type {string} - Spaceship description in picker */
        this.description = "{DEFAULT}_DESCRIPTION";
        /** @type {number} - Total energy required for initial construction */
        this.costEnergy = 1;
        /** @type {number} - Total minerals required for initial construction */
        this.costMinerals = 0;
        /** @type {number} - Total water required for initial construction */
        this.costWater = 0;

        /** @type {number} - Ability to start firing before ennemy units */
        this.initiative = 0;
        /** @type {number} - Spaceship intial structure points */
        this.maxStructurePoints = 0;
        /** @type {number} - Shield reducing incoming damage */
        this.shield = 0;
        /** @type {number} - Damage dealt to ennemy units shield and structure points */
        this.firePower = 0;

        /** @type {number} - Spaceship speed */
        this.speed = 0;
        /** @type {number} - Water consumption in T/distance */
        this.waterConsumption = 0;
        /** @type {number} - Range in distance */
        this.range = 0;

        /** @type {number} - Spaceship cargo capacity in kg */
        this.maxCargo = 0;

        // Load static data
        this.loadStaticFields();

        // Initialize dynamic fields
        /** @type {Date} - Construction date */
        this.constructionDate = new Date();
        /** @type {number} - Amount of accumulated energy (tracks construction progress) */
        this.constructedEnergy = 0;
        /** @type {number} - Remaining structure points */
        this.structurePoints = this.maxStructurePoints;
    }

     /** Load all type related static fields */
    loadStaticFields(){
        const statics = this.gameData.spaceshipsData[this.spaceshipTypeID];
        for (var field in statics){
            this[field] = statics[field];
        }
    }

    /** 
    * Export all dynamic fields relative to game state to JSON
    * @param {Date} timestamp - Only data occuring before timestamp will be returned
    * @returns {object} - An {object} structure containing all fields.
    * */
    exportJSON(timestamp){
        var data = super.exportJSON(timestamp);
        data.spaceshipTypeID = this.spaceshipTypeID;
        data.constructionDate = this.constructionDate;
        data.constructedEnergy = this.constructedEnergy;
        data.structurePoints = this.structurePoints;
        return data;
    }
    /** 
    * Load all dynamic fields relative to game state from JSON to this object
    * @param {object} JSONData - An {object} structure containing all fields.
    * */
    loadJSON(JSONData){
        super.loadJSON(JSONData);
        this.spaceshipTypeID = JSONData.spaceshipTypeID;
        this.constructionDate = Date.parse(JSONData.constructionDate);
        this.constructedEnergy = JSONData.constructedEnergy;
        this.structurePoints = JSONData.structurePoints;
    }
}

export {GameData, GameObject, Cluster, Asteroid, GameEvent, ConstructionCompleteEvent, Construction, Spaceship}