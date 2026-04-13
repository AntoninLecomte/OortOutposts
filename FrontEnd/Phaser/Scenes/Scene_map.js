class SCENE_Map extends Phaser.Scene
{
    graphics;

    create ()
    {
        this.scale = 1000; // Light minutes per pixel

        // Draw asteroids
        const cluster = window.gameData.cluster;
        for (var i in cluster.asteroids) {
            this.drawAsteroid(cluster.asteroids[i]);
        }

        // Center camera on the cluster
        var camera = this.cameras.main;
        camera.centerOnX((cluster.minX+cluster.maxX)/2*this.scale);
        camera.centerOnY((cluster.minY+cluster.maxY)/2*this.scale);
        // Zoom camera to fit the cluster
        const zoomFactor = Math.min(camera.width/(cluster.maxX-cluster.minX)/this.scale, camera.height/(cluster.maxY-cluster.minY)/this.scale);
        camera.setZoom(zoomFactor*0.8);
    }

    /**
    * Dev function. Draws the cluster boundary from mapRadius
    */
    drawBoundary(cluster) {
        this.graphics = this.add.graphics();  
        this.graphics.lineStyle(3, gameConfig.colors["debug"], 1);
        this.graphics.strokeCircle(0, 0, cluster.mapRadius*this.scale);
    }

    /**
    * Draws a point on the map at asteroid location
    */
    drawAsteroid(asteroid) {
        this.graphics = this.add.graphics();

        const thickness = 5;
        const alpha = 1;

        this.graphics.lineStyle(thickness, gameConfig.colors["foreground"], alpha);

        const radius = 15;

        this.graphics.strokeCircle(asteroid.x*this.scale, asteroid.y*this.scale, radius);
    }
}

export {SCENE_Map}