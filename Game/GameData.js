class GameData {
    constructor(parameters) {
        this.cluster = new Cluster();
    }
    generateWorld() {
        this.cluster.generateAsteroids(12, 1, 0.2, 3);
    }
}

/**
* Store functions related to cluster of asteroids generation
*/
class Cluster {
    constructor() {
        this.asteroids = [];
        this.minX = 0;
        this.maxX = 0;
        this.minY = 0;
        this.maxY = 0;
    }
    
    /** 
    * Generates asteroids with a set of given constraints
    * @param {integer} n_asteroids - Number of asteroids to be generated
    * @param {number} mapRadius - Map radius, in LightMinutes
    * @param {number} minDistance - Min distance between two asteroids, LightMinutes
    * @param {number} distanceVariation - Distance variation, in ratio of the minDistance
    * @return {Array} Returns an Array of generated asteroids
    */
    generateAsteroids(n_asteroids, mapRadius, minDistance, distanceVariation) {
        this.mapRadius = mapRadius;
        while (true) {
                this.asteroids = [];
                var tries = 0;
                var x = 0;
                var y = 0;
                this.asteroids.push(new Asteroid(x,y,1));
                var asteroidCount = 1;
            while (tries < 10000) { // Try 10000 times
                tries++;
                var newHeading = Math.random()*2*Math.PI;
                var newDistance = minDistance+Math.random()*(minDistance*distanceVariation);
                x = x+Math.cos(newHeading)*newDistance;
                y = y+Math.sin(newHeading)*newDistance;

                // Check if the new asteroid is far enough from the others
                var tooClose = false;
                
                for (var asteroid in this.asteroids) {
                    var distance = Math.sqrt(Math.pow(x-this.asteroids[asteroid].x,2)+Math.pow(y-this.asteroids[asteroid].y,2));
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
                    this.asteroids.push(new Asteroid(x,y,asteroidCount));
                    asteroidCount++;
                    if (asteroidCount >= n_asteroids) {
                        return this.asteroids;
                    }
                }

                if (x < this.minX) {this.minX = x;}
                if (x > this.maxX) {this.maxX = x;}
                if (y < this.minY) {this.minY = y;}
                if (y > this.maxY) {this.maxY = y;}
            }
        }
    }
}

class Asteroid {
    constructor(x,y,id) {
        this.id = id
        this.x = x;
        this.y = y;
        this.size = 50 //km, diameter
        this.startRessources = {
            "WATER": 10000, // kg,
            "RAW_MINERALS": 10000, // kg
        }

        this.generateShapePoints(200,500,id/12);
        console.log(id)

    /** 
    * Brief description of the function here.
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
}

export {GameData, Cluster, Asteroid}