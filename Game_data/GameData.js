class GameData {
    constructor(parameters) {
        /**
         * Collection of constructions static fields information
         * @type {JSON}
         */
        this.constructionData = {};
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

        this.loadconstructionData();
        this.loadSpaceshipData();
        this.generateWorld();
    }

     /** 
    * Generate a cluster of asteroids
    * */
    generateWorld(){
        this.cluster = new Cluster(this);
    }

    /** 
    * DEV to be later integrated on server side
    * */
    loadconstructionData(){
        const ob = this;
        var xmlhttp=new XMLHttpRequest();
        xmlhttp.open("GET","./Game_data/Constructions.json",false);
        xmlhttp.send();
        if (xmlhttp.status==200 && xmlhttp.readyState == 4 )
        {
            this.constructionData = JSON.parse(xmlhttp.responseText);
            for (var constructionID in this.constructionData){
                this.constructionsTypes[constructionID] = new Construction(this,null,constructionID);
            }
            for (var constructionID in this.constructionData){
                this.constructionsTypes[constructionID+"1"] = new Construction(this,null,constructionID);
            }
        }
    }

    /** 
    * DEV to be later integrated on server side
    * */
    loadSpaceshipData(){
        const ob = this;
        var xmlhttp=new XMLHttpRequest();
        xmlhttp.open("GET","./Game_data/Spaceships.json",false);
        xmlhttp.send();
        if (xmlhttp.status==200 && xmlhttp.readyState == 4 )
        {
            this.spaceshipData = JSON.parse(xmlhttp.responseText);
            for (var spaceshipID in this.spaceshipData){
                this.spaceshipsTypes[spaceshipID] = new Spaceship(this,spaceshipID);
            }
            for (var spaceshipID in this.spaceshipData){
                this.spaceshipsTypes[spaceshipID+"1"] = new Spaceship(this,spaceshipID);
            }
        }
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
        this.generateRessources(100,100)
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
    constructor(gameData, x,y,id) {
        this.gameData = gameData;
        this.id = id
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
         * The asteroid constructions queue list
         * @type {Construction[]}
         */
        this.constructionQueue = [];

        /**
         * The asteroid spaceships queue list
         * @type {Spaceship[]}
         */
        this.spaceshipsQueue = [];

        // this.generateShapePoints(200,500,1);
        this.DEV_generateEvents();
        this.DEV_generateQueue();

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
    DEV_generateEvents(){
        
        for (var i=0; i<50;i++){
            const newConstruction = new Construction(this.gameData, this, "DEV");
            this.addEvent(new ConstructionCompleteEvent(this.gameData, newConstruction))
        }
    }
    DEV_generateQueue(){
        for (var i=0; i<10;i++){
            const newConstruction = new Construction(this.gameData, this, "DEV");
            this.constructionQueue.push(newConstruction);
        }
        for (var i=0; i<10;i++){
            const newSpaceShip = new Spaceship(this.gameData, "DEV");
            this.spaceshipsQueue.push(newSpaceShip);
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
    * @param {String} constructionID - Construction ID, one per type of construction
    */
   constructor(gameData, asteroid, constructionID) {
        this.gameData = gameData;
        /**
        * The construction parent asteroid
        * @type {Asteroid}
        */
        this.asteroid = asteroid;
        this.constructionID = constructionID;

        // Default values. To be overriden by JSON data from gamedata.
        /**
         * Construction name
         * @type {string}
         */
        this.name = "DEV_DEFAULT_NAME";
        /**
         * Construction description in picker
         * @type {string}
         */
        this.description = "DEV_DEFAULT_DESCRIPTION";

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
        
        // DEV - Pick random id
        const keys = Object.keys(this.gameData.constructionData);
        this.constructionID = keys[ keys.length * Math.random() << 0];
        
        // Load static fields
        const statics = this.gameData.constructionData[this.constructionID];
        for (var field in statics){
            this[field] = statics[field];
        }

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
}

/**
* Class representing a spacecraft
*/
class Spaceship {
    /**
    * Spaceship creation function
    * @param {GameData} gameData - GameData object storing all variables
    * @param {String} spaceshipID - spaceship ID, one per type of spaceship
    */
   constructor(gameData, spaceshipID) {
        this.gameData = gameData;
        this.spaceshipID = spaceshipID;

        // Default values. To be overriden by JSON data from gamedata.
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
        

        // DEV - Pick random id
        const keys = Object.keys(this.gameData.spaceshipData);
        this.spaceshipID = keys[ keys.length * Math.random() << 0];
        
        // Load static fields
        const statics = this.gameData.spaceshipData[this.spaceshipID];
        for (var field in statics){
            this[field] = statics[field];
        }

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
}

export {GameData, Cluster, Asteroid, GameEvent, ConstructionCompleteEvent, Construction, Spaceship}