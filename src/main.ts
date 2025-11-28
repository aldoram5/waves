import Phaser from "phaser";
import Level1 from "./scenes/Level1";
import Preload from "./scenes/Preload";
import MainMenu from "./scenes/MainMenu";
import WinPopup from "./scenes/WinPopup";

class Boot extends Phaser.Scene {

    constructor() {
        super("Boot");
    }

    preload() {
    }

    create() {

       this.scene.start("Preload");
    }
}

window.addEventListener('load', function () {
	
	const game = new Phaser.Game({
		width: 1280,
		height: 720,
		backgroundColor: "#2f2f2f",
		parent: "game-container",
		fps: { target: 60 },
		scale: {
			mode: Phaser.Scale.ScaleModes.FIT,
			autoCenter: Phaser.Scale.Center.CENTER_BOTH
		},
		physics: {
			default: 'arcade',
			arcade: {
				gravity: { y: 800, x: 0 },
				debug: process.env.NODE_ENV === 'development' // Enable debug rendering during development
			}
		},
		scene: [Boot, Preload, MainMenu, Level1, WinPopup]
	});

	game.scene.start("Boot");
});