
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class MainMenu extends Phaser.Scene {

	constructor() {
		super("MainMenu");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// wAVELOGO
		const wAVELOGO = this.add.image(-195, -233, "WAVELOGO");
		wAVELOGO.setOrigin(0, 0);

		// text_1
		const text_1 = this.add.text(380, 605, "", {});
		text_1.text = "PRESS ANY KEY TO START";
		text_1.setStyle({ "fontSize": "36px", "fontStyle": "bold italic", "shadow.color": "#fbf7f7ff", "shadow.blur": 2, "shadow.stroke": true, "shadow.fill": true });

		this.events.emit("scene-awake");
	}

	/* START-USER-CODE */

	// Write your code here

	create() {

		this.editorCreate();
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
