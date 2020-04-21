import Phaser from "phaser"

class MyScene extends Phaser.Scene {
    preload() {
        this.cameras
    }
    
}

let a: Phaser.Types.Core.GameConfig

let game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 800,
    height: 600,
})

