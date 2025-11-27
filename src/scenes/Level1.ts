
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Level1 extends Phaser.Scene {

	constructor() {
		super("Level1");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// floor
		const floor = this.add.rectangle(0, 675, 128, 128);
		floor.scaleX = 10.014984733442693;
		floor.scaleY = 0.35242533493618;
		floor.setOrigin(0, 0);
		floor.isFilled = true;
		floor.fillColor = 0;
		floor.isStroked = true;
		floor.strokeColor = 2293248;
		floor.lineWidth = 5;

		// ceiling
		const ceiling = this.add.rectangle(0, 0, 128, 128);
		ceiling.scaleX = 10.014984733442693;
		ceiling.scaleY = 0.35242533493618;
		ceiling.setOrigin(0, 0);
		ceiling.isFilled = true;
		ceiling.fillColor = 0;
		ceiling.isStroked = true;
		ceiling.strokeColor = 2293248;
		ceiling.lineWidth = 5;

		// leftwall
		const leftwall = this.add.rectangle(0, 0, 128, 128);
		leftwall.scaleX = 0.3;
		leftwall.scaleY = 5.7;
		leftwall.setOrigin(0, 0);
		leftwall.isFilled = true;
		leftwall.fillColor = 0;
		leftwall.isStroked = true;
		leftwall.strokeColor = 2293248;
		leftwall.lineWidth = 5;

		// leftwall_1
		const leftwall_1 = this.add.rectangle(1239, 0, 128, 128);
		leftwall_1.scaleX = 0.3;
		leftwall_1.scaleY = 5.7;
		leftwall_1.setOrigin(0, 0);
		leftwall_1.isFilled = true;
		leftwall_1.fillColor = 0;
		leftwall_1.isStroked = true;
		leftwall_1.strokeColor = 2293248;
		leftwall_1.lineWidth = 5;

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
