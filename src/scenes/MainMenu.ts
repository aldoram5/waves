
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
		const wAVELOGO = this.add.image(-176, -254, "WAVELOGO");
		wAVELOGO.setOrigin(0, 0);

		// text_1
		const text_1 = this.add.text(350, 136, "", {});
		text_1.text = "PRESS ANY KEY TO START";
		text_1.setStyle({ "fontSize": "36px", "fontStyle": "bold italic", "shadow.color": "#fbf7f7ff", "shadow.blur": 2, "shadow.stroke": true, "shadow.fill": true });

		// whale_left
		this.add.image(71, 274, "whale1");

		// whale_jump
		this.add.image(143, 565, "whale-jump2");

		// whale_right
		const whale_right = this.add.image(246, 274, "whale1");
		whale_right.scaleX = -1;

		// whale_jump_1
		this.add.image(383, 563, "whale-tail2");

		// whale_right_1
		const whale_right_1 = this.add.image(1095, 346, "waveattack");
		whale_right_1.scaleX = -1.2;
		whale_right_1.scaleY = 1.2;

		// whale_right_2
		const whale_right_2 = this.add.image(1013, 356, "whale1");
		whale_right_2.scaleX = -1;

		// whale_right_3
		const whale_right_3 = this.add.image(1194, 351, "enemy2-look");
		whale_right_3.scaleX = -1;

		// whale_right_5
		const whale_right_5 = this.add.image(1149, 552, "whale-inhale1");
		whale_right_5.scaleX = 1.5;
		whale_right_5.scaleY = 1.5;

		// whale_right_6
		const whale_right_6 = this.add.image(1040, 596, "enemy2-stun");
		whale_right_6.scaleX = 0.5;
		whale_right_6.scaleY = 0.5;

		// instruction_text
		const instruction_text = this.add.text(8, 205, "", {});
		instruction_text.text = "MOVE WITH LEFT/RIGHT ARROWS";
		instruction_text.setStyle({ "fontSize": "22px", "shadow.color": "#fbf7f7ff", "shadow.blur": 2 });

		// instruction_text_1
		const instruction_text_1 = this.add.text(8, 629, "", {});
		instruction_text_1.text = "JUMP WITH SPACEBAR  HIDE WITH DOWN ARROW";
		instruction_text_1.setStyle({ "fontSize": "22px", "shadow.color": "#fbf7f7ff", "shadow.blur": 2 });

		// instruction_text_2
		const instruction_text_2 = this.add.text(930, 410, "", {});
		instruction_text_2.text = "USE Z TO RELEASE YOUR WAVE";
		instruction_text_2.setStyle({ "fontSize": "22px", "shadow.color": "#fbf7f7ff", "shadow.blur": 2 });

		// instruction_text_3
		const instruction_text_3 = this.add.text(907, 481, "", {});
		instruction_text_3.text = "STUN ENEMIES WITH IT ...";
		instruction_text_3.setStyle({ "fontSize": "22px", "shadow.color": "#fbf7f7ff", "shadow.blur": 2 });

		// instruction_text_4
		const instruction_text_4 = this.add.text(909, 633, "", {});
		instruction_text_4.text = "USE X TO INHALE THEM AND ";
		instruction_text_4.setStyle({ "fontSize": "22px", "shadow.color": "#fbf7f7ff", "shadow.blur": 2 });

		// instruction_text_5
		const instruction_text_5 = this.add.text(884, 670, "", {});
		instruction_text_5.text = "SPIT THEM OUT WITH X AS WELL!";
		instruction_text_5.setStyle({ "fontSize": "22px", "shadow.color": "#fbf7f7ff", "shadow.blur": 2 });

		this.events.emit("scene-awake");
	}

	/* START-USER-CODE */

	// Write your code here

	create() {

		this.editorCreate();

		// Start Level1 when any key is pressed
		this.input.keyboard?.once('keydown', () => {
			this.scene.start("Level1");
		});
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
