import { GameData, Construction, Spaceship } from "../../Game_data/GameData.js";
import { NetworkHandler } from "../../WebPage/Scripts/Network.js";
import { UI_Window, UI_Button } from "../../WebPage/Scripts/UI.js";

class SCENE_Asteroid extends Phaser.Scene
{
    constructor( ...args ){
        super({ key: 'SCENE_Asteroid', ...args })
    }
    /**
     * @param {Object} handlers - A collection with gameData and network handlers
     */
    create(handlers){
        /** @type {GameData} */
        this.gameData = handlers.gameData;
        /** @type {NetworkHandler} */
        this.networkHandler = handlers.networkHandler;
        this.asteroid = this.gameData.cluster.asteroids[0];
        console.log(this.asteroid);

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

export {SCENE_Asteroid}