import Phaser from 'phaser';

/**
 * Enemy entity for W.A.V.E.S game.
 * Extends Phaser.Physics.Arcade.Sprite to provide physics-based movement.
 *
 * Basic patrol behavior:
 * - Moves horizontally on platforms
 * - Detects walls and platform edges using raycasting
 * - Rotates 90 degrees when changing direction
 * - Simple back-and-forth patrol pattern
 */
export default class Enemy extends Phaser.Physics.Arcade.Sprite {

    // Movement constants
    private static readonly MOVE_SPEED = 50;
    private static readonly EDGE_CHECK_DISTANCE = 20; // Distance ahead to check for platform edge
    private static readonly ROTATION_SPEED = 90; // Degrees per second of rotation while moving
    private static readonly TURN_DURATION = 200; // Duration for 90-degree turn when changing direction

    // Movement state
    private direction: -1 | 1; // -1 = left, 1 = right
    private isTurning: boolean; // True during direction change animation

    // Reference to platforms for edge detection
    private platforms: Phaser.GameObjects.GameObject[];

    constructor(scene: Phaser.Scene, x: number, y: number, platforms: Phaser.GameObjects.GameObject[]) {
        // Create sprite with 'enemy-base' texture
        super(scene, x, y, 'enemy-base');

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setDepth(5); // Enemy layer

        // Store platform references for edge detection
        this.platforms = platforms;

        // Initialize movement state
        this.direction = 1; // Start moving right
        this.isTurning = false;

        // Configure physics body
        this.setupPhysicsBody();
    }

    /**
     * Configure physics body properties for the enemy.
     * Called during construction to set up collision detection and movement physics.
     */
    private setupPhysicsBody(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // Enemy sprite is 128x128, set a reasonable collision box
        // Using a smaller size for better gameplay feel
        body.setSize(110, 110);
        body.setOffset(9, 9); // Center the collision box

        // Prevent enemy from leaving screen
        body.setCollideWorldBounds(true);

        // No bounce on collision
        body.setBounce(0);

        // No drag - constant movement speed
        body.setDrag(0, 0);

        // Set initial velocity based on direction
        body.setVelocityX(this.direction * Enemy.MOVE_SPEED);
    }

    /**
     * Main update loop for the Enemy.
     * Called every frame by the scene.
     * Handles movement, collision detection, and continuous rotation animation.
     */
    public update(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // Only check for obstacles if not currently turning
        if (!this.isTurning) {
            // Check for wall collision (world bounds or other solid objects)
            // If enemy hits world bounds or blocked by wall, change direction
            if (body.blocked.left || body.blocked.right) {
                this.changeDirection();
                return;
            }

            // Check for platform edge ahead
            if (this.isEdgeAhead()) {
                this.changeDirection();
                return;
            }

            // Maintain constant speed (in case it was altered by collision)
            if (Math.abs(body.velocity.x) < Enemy.MOVE_SPEED - 1) {
                body.setVelocityX(this.direction * Enemy.MOVE_SPEED);
            }
        }

        // Continuous rolling animation while moving
        // Rotate based on movement direction and speed
        // At 60fps, this rotates ROTATION_SPEED degrees per second
        const rotationPerFrame = (Enemy.ROTATION_SPEED / 60) * this.direction;
        this.angle += rotationPerFrame;
    }

    /**
     * Check if there's a platform edge ahead of the enemy.
     * Uses raycasting downward from a point ahead of the enemy.
     *
     * @returns True if edge detected (no platform ahead), false if platform continues
     */
    private isEdgeAhead(): boolean {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // Calculate check position ahead of the enemy
        // Check from the front edge of the collision box
        const checkX = this.direction === 1
            ? body.right + Enemy.EDGE_CHECK_DISTANCE
            : body.left - Enemy.EDGE_CHECK_DISTANCE;

        // Check from slightly below the enemy's feet
        const checkY = body.bottom + 5;

        // Cast a ray downward to check for platform
        const rayLength = 10; // Short ray to detect immediate platform below

        // Check if any platform exists at the check position
        for (const platform of this.platforms) {
            if (!platform.body) continue;

            const platformBody = platform.body as Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;

            // Check if the raycast position is above this platform
            // and within the platform's horizontal bounds
            if (checkX >= platformBody.left &&
                checkX <= platformBody.right &&
                checkY >= platformBody.top - rayLength &&
                checkY <= platformBody.bottom) {
                // Platform found ahead - no edge
                return false;
            }
        }

        // No platform found ahead - edge detected
        return true;
    }

    /**
     * Change the enemy's direction with a quick 90-degree turn animation.
     * Briefly pauses movement during the turn.
     */
    private changeDirection(): void {
        // Prevent multiple direction changes while turning
        if (this.isTurning) {
            return;
        }

        this.isTurning = true;
        const body = this.body as Phaser.Physics.Arcade.Body;

        // Stop movement during turn
        body.setVelocityX(0);

        // Reverse direction
        this.direction = this.direction === 1 ? -1 : 1;

        // Calculate target angle for turn (add 90 degrees)
        // The direction of rotation matches the new movement direction
        const rotationChange = this.direction === 1 ? 90 : -90;
        const targetAngle = this.angle + rotationChange;

        // Quick turn animation
        this.scene.tweens.add({
            targets: this,
            angle: targetAngle,
            duration: Enemy.TURN_DURATION,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                // Resume movement after turn
                body.setVelocityX(this.direction * Enemy.MOVE_SPEED);
                this.isTurning = false;
            }
        });
    }

    /**
     * Clean up resources when enemy is destroyed.
     */
    destroy(fromScene?: boolean): void {
        super.destroy(fromScene);
    }
}
