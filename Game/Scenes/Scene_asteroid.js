class SCENE_Asteroid extends Phaser.Scene
{
    graphics;

    create ()
    {
        this.scale = 15;

        // Center camera on the cluster
        var camera = this.cameras.main;
        camera.centerOnX(0);
        camera.centerOnY(0);
        // // Zoom camera to fit the cluster
        const zoomFactor = camera.width/200/this.scale;
        camera.setZoom(zoomFactor*0.4);
        
        // Draw all circles
        // var a=0
        // for (var x=0; x<4; x++){
        //     for (var y=0; y<3; y++){
        //         this.drawAsteroidCircle((-150+100*x)*this.scale, (-100+100*y)*this.scale, window.gameData.cluster.asteroids[a]);
        //         a++;
        //     }
        // }
        

        
    }

    drawAsteroidCircle(x,y,asteroid){
        this.add.circle(x,y,asteroid.baseRadius,gameConfig.colors["foreground"])
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

export {SCENE_Asteroid}