class GameData {
    constructor() {
        /**
         * Incremental counter to allow individual unique ids for asteroid objects
         * @type {integer}
         */
        this.asteroidCurrentID = 0;
        /**
         * Incremental counter to allow individual unique ids for construction objects
         * @type {integer}
         */
        this.constructionCurrentID = 0;
        /**
         * Incremental counter to allow individual unique ids for spaceship objects
         * @type {integer}
         */
        this.spaceshipCurrentID = 0;


        /**
         * Collection of constructions static fields information
         * @type {JSON}
         */
        this.constructionsData = {};
        /**
         * Collection of default constructions
         * @type {Construction{}}
         */
        this.constructionsTypes = {};


        /**
         * Collection of spaceships static fields information
         * @type {JSON}
         */
        this.spaceshipsData = {};
        /**
         * Collection of default spaceships
         * @type {Spaceship{}}
         */
        this.spaceshipsTypes = {};

        /**
         * The game cluster
         * @type {Cluster}
         */
        this.cluster = null;
    }

     /** 
    * Generate a cluster of asteroids
    * */
    generateWorld(){
        this.cluster = new Cluster(this);
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
    * Export all dynamic fields relative to game state to JSON
    * @returns {object} - An {object} structure containing all fields.
    * */
    exportJSON(){
        var data = {};
        data.asteroidCurrentID = this.asteroidCurrentID;
        data.constructionCurrentID = this.constructionCurrentID;
        data.spaceshipCurrentID = this.spaceshipCurrentID;
        data.cluster = this.cluster.exportJSON();

        return data;
    }

    /** 
    * Load all dynamic fields relative to game state from JSON to this object
    * @param {object} JSONData - An {object} structure containing all fields.
    * */
    loadJSON(JSONData){
        this.cluster = new Cluster(this);
        this.cluster.loadJSON(JSONData["cluster"]);
    }
}

/**
* Store functions related to cluster of asteroids generation
*/
class Cluster {
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

        const coords = this.generateAsteroidsCoordinates(1, 1, 0.2, 3);
        for (var asteroid in coords){
            this.asteroids.push(new Asteroid(this.gameData, coords[asteroid][0], coords[asteroid][1], asteroid));
        }
        this.generateRessources(100,100);
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
                    asteroidsCoordinates.push([x,y]);
                    asteroidCount++;
                    if (asteroidCount >= n_asteroids) {
                        return asteroidsCoordinates;
                    }
                }

                if (x < this.minX) {this.minX = x;}
                if (x > this.maxX) {this.maxX = x;}
                if (y < this.minY) {this.minY = y;}
                if (y > this.maxY) {this.maxY = y;}
            }
        }
    }

    /** 
    * Select a total amount of ressources and distribute them along asteroids
    * @param {number} startWater The total water ressource to be available across the cluster
    * @param {number} startMinerals The total minerals ressource to be available across the cluster
    * @param {number} totalRandomness The random factor to be applied to total ressources
    * @param {number} unitaryRandomness The random factor to be applied to individual asteroids
    */
    generateRessources(startWater, startMinerals, totalRandomness=0, unitaryRandomness=0.7) {
        this.startWaterTotal = startWater * (1+totalRandomness);
        this.startMineralsTotal = startMinerals * (1+totalRandomness);
        var waterRemaining = this.startWaterTotal;
        var mineralsRemaining = this.startMineralsTotal;
        for (var asteroid=0; asteroid<this.asteroids.length; asteroid++){
            var water=0;
            var minerals=0;
            if (asteroid < this.asteroids.length-1){
                water = waterRemaining/(this.asteroids.length-asteroid) * ((1-unitaryRandomness/2)+unitaryRandomness*Math.random());
                minerals = mineralsRemaining/(this.asteroids.length-asteroid) * ((1-unitaryRandomness/2)+unitaryRandomness*Math.random());

                waterRemaining -= water;
                mineralsRemaining -= minerals;
            }else{
                // Last asteroid takes all remaining ressources:
                water = waterRemaining;
                minerals = mineralsRemaining;
            }

            this.asteroids[asteroid].startRessources["WATER"] = water;
            this.asteroids[asteroid].startRessources["MINERALS"] = minerals;
            this.asteroids[asteroid].baseRadius = Math.pow(Math.pow(water,2)+Math.pow(minerals,2),1)*3;;
        }
        
    }

    /** 
    * Export all dynamic fields relative to game state to JSON
    * @returns {object} - An {object} structure containing all fields.
    * */
    exportJSON(){
        var data = {"asteroids":[]};
        for (var ast in this.asteroids){
            data["asteroids"].push(this.asteroids[ast].exportJSON());
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
class Asteroid {
    /** 
    * Asteroid creation function
    * @param {GameData} gameData - GameData object storing all variables
    * @param {number} x - X coordinate of the asteroid
    * @param {number} y - Y coordinate of the asteroid
    * @param {integer} id- Unique ID of the asteroid
    */
    constructor(gameData, x,y,asteroidID) {
        this.gameData = gameData;

        this.asteroidID = this.gameData.asteroidCurrentID;
        this.gameData.asteroidCurrentID ++;

        this.x = x;
        this.y = y;
        this.size = 50 //km, diameter
        this.startRessources = {
            "WATER": 0, // kg,
            "MINERALS": 0, // kg
        }

        /**
         * The asteroid list of events
         * @type {GameEvent[]}
         */
        this.events = [];


        /**
         * The asteroid completed constructions
         * @type {Construction[]}
         */
        this.constructions = [];

        /**
         * The asteroid constructions queue list
         * @type {Construction[]}
         */
        this.constructionsQueue = [];

        /**
         * List of spaceships based to this asteroid
         * @type {Spaceship[]}
         */
        this.spaceships = [];

        /**
         * The asteroid spaceships queue list
         * @type {Spaceship[]}
         */
        this.spaceshipsQueue = [];

        // this.generateShapePoints(200,500,1);
        // this.DEV_generateEvents();
        // this.DEV_generateQueue();

    /** 
    * @summary Generate noisy circular pattern to represent the asteroid shape
    * @param {number} minSize Minimal base radius, km
    * @param {number} maxSize Maximal base radius, km
    * @param {number} randomness Between 0 and 1, the higher the weirdest
    * @param {number} pointDensity Number of points per km radius
    * @return {Array} Returns the generated points, and store them to the asteroid object
    */}
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
    // DEV_generateEvents(){
        
    //     for (var i=0; i<50;i++){
    //         const newConstruction = new Construction(this.gameData, this, Object.keys(this.gameData.constructionData)[0]);
    //         this.addEvent(new ConstructionCompleteEvent(this.gameData, newConstruction))
    //     }
    // }
    // DEV_generateQueue(){
    //     for (var i=0; i<10;i++){
    //         const newConstruction = new Construction(this.gameData, this, Object.keys(this.gameData.constructionData)[0]);
    //         this.constructionsQueue.push(newConstruction);
    //     }
    //     for (var i=0; i<10;i++){
    //         const newSpaceShip = new Spaceship(this.gameData, this, Object.keys(this.gameData.spaceshipsData)[0]);
    //         this.spaceshipsQueue.push(newSpaceShip);
    //     }
    // }

    /** 
    * Add a construction to this asteroid construction queue
    * @param {string} constructionTypeID - Construction type to be added
    */
    addConstructionToQueue(constructionTypeID){
        this.constructionsQueue.push(new Construction(this.gameData, this, constructionTypeID));
    }
     /** 
    * Remove a construction from queue at specified position
    * @param {integer} position - Position in the queue to be deleted
    */
    removeConstructionFromQueue(position){
        this.constructionsQueue.splice(position,1);
    }

    /** 
    * Add a spaceship to this asteroid construction queue
    * @param {string} spaceshipTypeID - Spaceship type to be added
    */
    addSpaceshipToQueue(spaceshipTypeID){
        this.constructionsQueue.push(new Spaceship(this.gameData, this, spaceshipTypeID));
    }
     /** 
    * Remove a spaceship from queue at specified position
    * @param {integer} position - Position in the queue to be deleted
    */
    removeSpaceshipFromQueue(position){
        this.spaceshipsQueue.splice(position,1);
    }

    /** 
    * Export all dynamic fields relative to game state to JSON
    * @returns {object} - An {object} structure containing all fields.
    * */
    exportJSON(){
        var data = {};
        data.x = this.x;
        data.y = this.y;
        data.asteroidID = this.asteroidID;

        data["constructions"] = [];
        for (var construction in this.constructions){
            data["constructions"].push(this.constructions[construction].exportJSON())
        }
        data["constructionsQueue"] = [];
        for (var construction in this.constructionsQueue){
            data["constructionsQueue"].push(this.constructionsQueue[construction].exportJSON())
        }

        data["spaceships"] = [];
        for (var spaceship in this.spaceships){
            data["spaceships"].push(this.spaceships[spaceship].exportJSON())
        }
        data["spaceshipsQueue"] = [];
        for (var spaceship in this.spaceshipsQueue){
            data["spaceshipsQueue"].push(this.spaceshipsQueue[spaceship].exportJSON())
        }

        return data;
    }

    /** 
    * Load all dynamic fields relative to game state from JSON to this object
    * @param {object} JSONData - An {object} structure containing all fields.
    * */
    loadJSON(JSONData){
        this.x = JSONData.x;
        this.y = JSONData.x;
        this.asteroidID = JSONData.asteroidID;

        this.constructions = [];
        for (var construction in JSONData.constructions){
            const newConstruction = new Construction(this.gameData, this, null);
            newConstruction.loadJSON(JSONData.constructions[construction]);
            newConstruction.loadStaticFields();
            this.constructions.push(newConstruction);
        }
        this.constructionsQueue = [];
        for (var construction in JSONData.constructionsQueue){
            const newConstruction = new Construction(this.gameData, this, null);
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
        this.spaceshipsQueue = [];
        for (var spaceship in JSONData.constructionsQueue){
            const newSpaceship = new Construction(this.gameData, this, null);
            newSpaceship.loadJSON(JSONData.constructionsQueue[spaceship]);
            newSpaceship.loadStaticFields();
            this.spaceshipsQueue.push(newSpaceship);
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
class Construction {
    /**
    * Construction creation function
    * @param {GameData} gameData - GameData object storing all variables
    * @param {Asteroid} asteroid - Parent asteroid object
    * @param {String} constructionTypeID - Construction ID, one per type of construction
    */
   constructor(gameData, asteroid, constructionTypeID) {
        this.gameData = gameData;
        /**
        * The construction parent asteroid
        * @type {Asteroid}
        */
        this.asteroid = asteroid;

        this.constructionTypeID = constructionTypeID;

        /**
        * An unique ID to reference this construction object
        * @type {integer}
        */
        this.constructionID = this.gameData.constructionCurrentID;
        this.gameData.constructionCurrentID ++;

        // Default values. To be overriden by JSON data from gamedata.
        /**
         * Construction name
         * @type {string}
         */
        this.name = "{DEFAULT}_NAME";
        /**
         * Construction description in picker
         * @type {string}
         */
        this.description = "{DEFAULT}_DESCRIPTION";

        /**
         * Total energy required for initial construction
         * @type {number}
         */
        this.costEnergy = 0;
        /**
         * Total minerals required for initial construction
         * @type {number}
         */
        this.costMinerals = 0;
        /**
         * Total water required for initial construction
         * @type {number}
         */
        this.costWater = 0;
        /**
        * Produced energy by cycle
        * @type {number}
        */
        this.generationEnergy = 0;
        /**
        * Produced minerals by cycle
        * @type {number}
        */
        this.generationMinerals = 0;
        /**
        * Produced water by cycle
        * @type {number}
        */
        this.generationWater = 0;

        /**
        * Construction intial structure points
        * @type {number}
        */
        this.maxStructurePoints = 0;
        /**
        * Shield reducing incoming damage
        * @type {number}
        */
        this.shield = 0;
        /**
        * Damage dealt to ennemy units shield and structure points
        * @type {number}
        */
        this.firePower = 0;

        // Update fields with static data:
        this.loadStaticFields();


        // Initialize dynamic fields
        /**
        * Construction date
        * @type {Date}
        */
        this.constructionDate = new Date();
        /**
        * Amount of energy used for construction (progress)
        * @type {number}
        */
        this.constructedEnergy = 0;
        /**
        * Remaining structure points
        * @type {number}
        */
        this.structurePoints = this.maxStructurePoints;
    }

     /** 
    * Load all type related static fields
    * */
    loadStaticFields(){
        const statics = this.gameData.constructionsData[this.constructionTypeID];
        for (var field in statics){
            this[field] = statics[field];
        }
    }

     /** 
    * Export all dynamic fields relative to game state to JSON
    * @returns {object} - An {object} structure containing all fields.
    * */
    exportJSON(){
        var data = {};
        data.constructionID = this.constructionID;
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
        this.constructionID = JSONData.constructionID;
        this.constructionTypeID = JSONData.constructionTypeID;
        this.constructionDate = Date.parse(JSONData.constructionDate);
        this.constructedEnergy = JSONData.constructedEnergy;
        this.structurePoints = JSONData.structurePoints;
    }
}

/**
* Class representing a spacecraft
*/
class Spaceship {
    /**
    * Spaceship creation function
    * @param {GameData} gameData - GameData object storing all variables
    * @param {Asteroid} asteroid - The asteroid where the spaceship is based
    * @param {String} spaceshipTypeID - spaceship ID, one per type of spaceship
    */
   constructor(gameData, asteroid, spaceshipTypeID) {
        this.gameData = gameData;
        this.asteroid = asteroid;
        this.spaceshipTypeID = spaceshipTypeID;

        /**
        * An unique ID to reference this spaceship object
        * @type {integer}
        */
        this.spaceshipID = this.gameData.spaceshipCurrentID;
        this.gameData.spaceshipCurrentID ++;

        // Default values. To be overriden by JSON data from gamedata.
        /**
         * Spaceship name
         * @type {string}
         */
        this.name = "{DEFAULT}_NAME";
        /**
         * Spaceship description in picker
         * @type {string}
         */
        this.description = "{DEFAULT}_DESCRIPTION";
        /**
         * Total energy required for initial construction
         * @type {number}
         */
        this.costEnergy = 0;
        /**
         * Total minerals required for initial construction
         * @type {number}
         */
        this.costMinerals = 0;
        /**
         * Total water required for initial construction
         * @type {number}
         */
        this.costWater = 0;

        /**
        * Ability to start firing before ennemy units
        * @type {number}
        */
        this.initiative = 0;
        /**
        * spaceship intial structure points
        * @type {number}
        */
        this.maxStructurePoints = 0;
        /**
        * Shield reducing incoming damage
        * @type {number}
        */
        this.shield = 0;
        /**
        * Damage dealt to ennemy units shield and structure points
        * @type {number}
        */
        this.firePower = 0;

        /**
        * Spaceship speed
        * @type {number}
        */
        this.speed = 0;
        /**
        * Water consumption in T/distance
        * @type {number}
        */
        this.waterConsumption = 0;
        /**
        * Range in distance
        * @type {number}
        */
        this.range = 0;

        /**
        * Spaceship cargo capacity in kg
        * @type {number}
        */
        this.maxCargo = 0;

        // Load static data
        this.loadStaticFields();

        // Initialize dynamic fields
        /**
        * Construction date
        * @type {Date}
        */
        this.constructionDate = new Date();
        /**
        * Amount of energy used for construction (progress)
        * @type {number}
        */
        this.constructedEnergy = 0;
        /**
        * Remaining structure points
        * @type {number}
        */
        this.structurePoints = this.maxStructurePoints;
    }

     /** 
    * Load all type related static fields
    * */
    loadStaticFields(){
        const statics = this.gameData.spaceshipsData[this.spaceshipTypeID];
        for (var field in statics){
            
            this[field] = statics[field];
        }
    }

    /** 
    * Export all dynamic fields relative to game state to JSON
    * @returns {object} - An {object} structure containing all fields.
    * */
    exportJSON(){
        var data = {};
        data.spaceshipID = this.spaceshipID;
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
        this.spaceshipID = JSONData.spaceshipID;
        this.spaceshipTypeID = JSONData.spaceshipTypeID;
        this.constructionDate = Date.parse(JSONData.constructionDate);
        this.constructedEnergy = JSONData.constructedEnergy;
        this.structurePoints = JSONData.structurePoints;
    }
}

export {GameData, Cluster, Asteroid, GameEvent, ConstructionCompleteEvent, Construction, Spaceship}