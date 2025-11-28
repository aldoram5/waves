import Phaser from 'phaser';
import BaseEnemy from './BaseEnemy';

/**
 * Patrol enemy for W.A.V.E.S game.
 * Extends BaseEnemy to provide state management capabilities.
 *
 * Basic patrol behavior:
 * - Moves horizontally on platforms
 * - Detects walls and platform edges using raycasting
 * - Rotates 90 degrees when changing direction
 * - Simple back-and-forth patrol pattern
 *
 * This is a refactored version of the original Enemy.ts class,
 * now extending BaseEnemy for consistent state management across all enemy types.
 */
export default class PatrolEnemy extends BaseEnemy {

    // Movement constants
    private static readonly MOVE_SPEED = 50; // Pixels per second
    private static readonly EDGE_CHECK_DISTANCE = 20; // Distance ahead to check for platform edge
    private static readonly ROTATION_SPEED = 90; // Degrees per second of rotation while moving
    private static readonly TURN_DURATION = 200; // Duration for 90-degree turn (milliseconds)

    // Collision box constants
    private static readonly BODY_SIZE = 110; // Collision box size (square)
    private static readonly BODY_OFFSET = 9; // Offset to center collision box

    // Visual constants
    private static readonly DEPTH = 5; // Render depth (enemy layer)

    // Edge detection constants
    private static readonly EDGE_Y_OFFSET = 5; // Check slightly below enemy's feet
    private static readonly EDGE_RAY_LENGTH = 10; // Short ray to detect immediate platform below

    // Turn animation constants
    private static readonly TURN_ANGLE = 90; // Degrees to rotate during turn

    // Movement state
    private direction: -1 | 1; // -1 = left, 1 = right
    private isTurning: boolean; // True during direction change animation

    // Reference to platforms for edge detection
    private platforms: Phaser.GameObjects.GameObject[];

    constructor(scene: Phaser.Scene, x: number, y: number, platforms: Phaser.GameObjects.GameObject[]) {
        // Create sprite with 'enemy-base' texture
        super(scene, x, y, 'enemy-base');

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
        body.setSize(PatrolEnemy.BODY_SIZE, PatrolEnemy.BODY_SIZE);
        body.setOffset(PatrolEnemy.BODY_OFFSET, PatrolEnemy.BODY_OFFSET); // Center the collision box

        // Prevent enemy from leaving screen
        body.setCollideWorldBounds(true);

        // No bounce on collision
        body.setBounce(0);

        // No drag - constant movement speed
        body.setDrag(0, 0);

        // Set initial velocity based on direction
        body.setVelocityX(this.direction * PatrolEnemy.MOVE_SPEED);

        // Set depth layer
        this.setDepth(PatrolEnemy.DEPTH); // Enemy layer
    }

    /**
     * Update logic specific to NORMAL state.
     * Handles movement, collision detection, and continuous rotation animation.
     * This contains all the logic from the original Enemy.update() method.
     */
    protected updateNormalState(): void {
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
            if (Math.abs(body.velocity.x) < PatrolEnemy.MOVE_SPEED - 1) {
                body.setVelocityX(this.direction * PatrolEnemy.MOVE_SPEED);
            }
        }

        // Continuous rolling animation while moving
        // Rotate based on movement direction and speed
        // At 60fps, this rotates ROTATION_SPEED degrees per second
        const rotationPerFrame = (PatrolEnemy.ROTATION_SPEED / 60) * this.direction;
        this.angle += rotationPerFrame;
    }

    /**
     * Update logic specific to STUNNED state.
     * Stops all movement and rotation.
     * Calls base class to decrement stun timer.
     */
    protected updateStunnedState(): void {
        // Call base class to decrement stun timer
        super.updateStunnedState();

        const body = this.body as Phaser.Physics.Arcade.Body;

        // Stop movement while stunned
        body.setVelocityX(0);

        // No rotation while stunned (angle stays frozen)
    }

    /**
     * Setup when entering NORMAL state.
     * Reset to normal texture and resume movement.
     */
    protected enterNormalState(): void {
        // Ensure enemy-base texture is active
        this.setTexture('enemy-base');

        // Resume movement
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(this.direction * PatrolEnemy.MOVE_SPEED);
    }

    /**
     * Cleanup when exiting NORMAL state.
     * Minimal cleanup needed for patrol enemy.
     */
    protected exitNormalState(): void {
        // Stop movement when exiting normal state
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(0);
    }

    /**
     * Setup when entering STUNNED state.
     * Switch to stun texture and stop movement.
     */
    protected enterStunnedState(): void {
        // Switch to stunned texture
        this.setTexture('enemy-stun');

        // Stop all movement
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(0);

        // Stun timer is set by base class stun() method
    }

    /**
     * Cleanup when exiting STUNNED state.
     * Return to normal texture and resume movement.
     */
    protected exitStunnedState(): void {
        // Return to normal texture
        this.setTexture('enemy-base');

        // Resume movement
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(this.direction * PatrolEnemy.MOVE_SPEED);
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
            ? body.right + PatrolEnemy.EDGE_CHECK_DISTANCE
            : body.left - PatrolEnemy.EDGE_CHECK_DISTANCE;

        // Check from slightly below the enemy's feet
        const checkY = body.bottom + PatrolEnemy.EDGE_Y_OFFSET;

        // Cast a ray downward to check for platform
        const rayLength = PatrolEnemy.EDGE_RAY_LENGTH; // Short ray to detect immediate platform below

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

        // Calculate target angle for turn (add or subtract 90 degrees)
        // The direction of rotation matches the new movement direction
        const rotationChange = this.direction === 1 ? PatrolEnemy.TURN_ANGLE : -PatrolEnemy.TURN_ANGLE;
        const targetAngle = this.angle + rotationChange;

        // Quick turn animation
        this.scene.tweens.add({
            targets: this,
            angle: targetAngle,
            duration: PatrolEnemy.TURN_DURATION,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                // Resume movement after turn
                body.setVelocityX(this.direction * PatrolEnemy.MOVE_SPEED);
                this.isTurning = false;
            }
        });
    }

    /**
     * Setup when entering DYING state.
     * Stops all rotation tweens before calling base implementation.
     */
    protected enterDyingState(): void {
        // Stop all rotation animations
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(this);
        }

        // Reset turning flag
        this.isTurning = false;

        // Call base implementation for common death setup
        super.enterDyingState();
    }

    /**
     * Cleanup when exiting DYING state.
     * Called right before enemy is destroyed.
     */
    protected exitDyingState(): void {
        // No specific cleanup needed for patrol enemy
    }

    /**
     * Clean up resources when enemy is destroyed.
     */
    destroy(fromScene?: boolean): void {
        // Clean up any remaining tweens
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(this);
        }
        super.destroy(fromScene);
    }
}
