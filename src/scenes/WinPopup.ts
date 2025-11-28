/**
 * WinPopup scene for W.A.V.E.S game.
 * Overlay scene that displays victory message when all enemies are defeated.
 *
 * Features:
 * - Semi-transparent background overlay (alpha 0.7)
 * - "Congratulations!" title text
 * - "All enemies defeated!" message
 * - "Return to Main Menu" button
 * - Button click stops Level1, stops WinPopup, starts MainMenu
 */
export default class WinPopup extends Phaser.Scene {

    constructor() {
        super("WinPopup");
    }

    create(): void {
        // Get game dimensions
        const { width, height } = this.cameras.main;

        // Create semi-transparent overlay background
        const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
        overlay.setOrigin(0, 0);

        // Create congratulations title
        const congratsText = this.add.text(width / 2, height / 2 - 100, "Congratulations!", {
            fontSize: "64px",
            fontStyle: "bold",
            color: "#ffffff",
            stroke: "#000000",
            strokeThickness: 6,
            shadow: {
                color: "#000000",
                blur: 8,
                stroke: true,
                fill: true
            }
        });
        congratsText.setOrigin(0.5, 0.5);

        // Create victory message
        const messageText = this.add.text(width / 2, height / 2, "All enemies defeated!", {
            fontSize: "36px",
            color: "#ffff00",
            stroke: "#000000",
            strokeThickness: 4
        });
        messageText.setOrigin(0.5, 0.5);

        // Create "Return to Main Menu" button background
        const buttonBg = this.add.rectangle(width / 2, height / 2 + 100, 400, 80, 0x4444ff);
        buttonBg.setStrokeStyle(4, 0xffffff);
        buttonBg.setInteractive({ useHandCursor: true });

        // Create button text
        const buttonText = this.add.text(width / 2, height / 2 + 100, "Return to Main Menu", {
            fontSize: "32px",
            fontStyle: "bold",
            color: "#ffffff"
        });
        buttonText.setOrigin(0.5, 0.5);

        // Button hover effects
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x6666ff);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x4444ff);
        });

        // Button click handler
        buttonBg.on('pointerdown', () => {
            // Stop Level1 scene
            this.scene.stop('Level1');

            // Stop this popup scene
            this.scene.stop('WinPopup');

            // Start MainMenu scene
            this.scene.start('MainMenu');
        });
    }
}
