class SCENE_Asteroid extends Phaser.Scene
{
    graphics;

    create (){
        // Create UI DOM:
        this.UI_asteroid = new UI_Asteroid(window.gameDiv,this);
    }

    /** 
    * @summary Draws initial view and sets camera when UI html has been received
    * @return {null} No return.
    */
    initialize(){
        // Set camera to fit remaining space from HUD
        console.log(this.UI_asteroid)
        const remainingWidth = document.body.offsetWidth - this.UI_asteroid.mainDiv.getBoundingClientRect().width;
        const height = document.body.offsetHeight;
        const camera = this.cameras.main;
        camera.setSize(remainingWidth,height);


        this.scale = 15;
        // Center camera on the cluster
        
        camera.centerOnX(0);
        camera.centerOnY(0);
        // // Zoom camera to fit the cluster
        const zoomFactor = camera.width/200/this.scale;
        camera.setZoom(zoomFactor*0.4);
        
        // Draw all asteroids
        // var a=0
        // for (var x=0; x<4; x++){
        //     for (var y=0; y<3; y++){
        //         this.drawAsteroidCircle((-150+100*x)*this.scale, (-100+100*y)*this.scale, window.gameData.cluster.asteroids[a]);
        //         a++;
        //     }
        // }
        
        // Draw current asteroid
        this.drawAsteroidCircle(0,0,window.gameData.cluster.asteroids[0])
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

/**
* Class storing DOM structure and fonctions for the asteroid view UI
*/
class UI_Asteroid {
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
    receivedHTML(DOM){
        this.mainDiv = DOM.querySelector("#UI_Asteroid");
        this.parentHTML.append(this.mainDiv);
        this.parentScene.initialize(); // Indicate the scene that its time to load
    }
}

export {SCENE_Asteroid}