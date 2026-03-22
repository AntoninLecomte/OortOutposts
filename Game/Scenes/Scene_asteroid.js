class SCENE_Asteroid extends Phaser.Scene
{
    graphics;

    create ()
    {
        this.scale = 15;
        
        this.drawAsteroidShape(0,0, window.gameData.cluster.asteroids[0]);

        // Center camera on the cluster
        var camera = this.cameras.main;
        camera.centerOnX(0);
        camera.centerOnY(0);
        // // Zoom camera to fit the cluster
        const zoomFactor = camera.width/200/this.scale;
        camera.setZoom(zoomFactor*0.8);
    }
    
    drawAsteroidShape(x,y,asteroid) {
        for (var i = 0; i < asteroid.points.length; i++) {
            this.add.circle(x+asteroid.points[i][0], y+asteroid.points[i][1], 3, gameConfig.colors["foreground"]);
        }
    }
}

export {SCENE_Asteroid}