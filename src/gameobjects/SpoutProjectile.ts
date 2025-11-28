import Phaser from 'phaser';

/**
 * Spout projectile for W.A.V.E.S game.
 * Bouncing water ball that contains swallowed enemies.
 *
 * Behavior:
 * - Travels horizontally with gravity enabled
 * - Bounces off walls and ceiling (bounce count = swallowedCount + 1)
 * - Destroys immediately on floor collision (no bounce)
 * - Defeats enemies on contact (triggers DYING state)
 * - Scaled to 2.0x for visual impact
 * - Emits 'spout-destroyed' event for cleanup
 *
 * Bounce System:
 * - Tracks bounces via worldbounds event
 * - Wall/ceiling collision increments bounce counter
 * - Floor collision destroys immediately
 * - Auto-destroys when bounce limit reached
 */
export default class SpoutProjectile extends Phaser.Physics.Arcade.Sprite {

    // Movement constants
    private static readonly SPEED = 400; // Horizontal speed in pixels per second
    private static readonly INITIAL_JUMP = -100; // Initial upward velocity to clear platform

    // Visual constants
    private static readonly SCALE = 1.5; // Sprite scale (reduced from 2.0 to avoid collision issues)
    private static readonly DEPTH = 20; // Render depth (above player)

    // Collision box constants (adjusted for 1.5x scale)
    private static readonly BODY_WIDTH = 60; // Collision box width
    private static readonly BODY_HEIGHT = 45; // Collision box height
    private static readonly BODY_OFFSET_X = 34; // X offset to center collision box
    private static readonly BODY_OFFSET_Y = 42; // Y offset to position collision box

    // Bounce physics constants
    private static readonly BOUNCE_X = 1.0; // Perfect horizontal bounce (100% energy retained)
    private static readonly BOUNCE_Y = 0.5; // Half vertical bounce (50% energy retained)

    private direction: number;
    private bounceLimit: number;
    private bounceCount: number = 0;

    /**
     * Create a new spout projectile.
     *
     * @param scene The scene this projectile belongs to
     * @param x Initial X position (player position)
     * @param y Initial Y position (player position)
     * @param direction Horizontal direction: -1 for left, 1 for right
     * @param swallowedEnemyCount Number of enemies inside (determines bounce limit)
     */
    constructor(scene: Phaser.Scene, x: number, y: number, direction: number, swallowedEnemyCount: number) {
        // Create sprite with 'whale-ball' texture
        super(scene, x, y, 'whale-ball');

        this.direction = direction;
        this.bounceLimit = swallowedEnemyCount + 1;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Configure physics body
        this.setupPhysicsBody();

        // Set scale for visual impact
        this.setScale(SpoutProjectile.SCALE);

        // Set depth layer (above player)
        this.setDepth(SpoutProjectile.DEPTH);

        // Set initial velocity with small upward jump to avoid immediate platform collision
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(direction * SpoutProjectile.SPEED);
        body.setVelocityY(SpoutProjectile.INITIAL_JUMP);

        // Flip sprite if going left
        this.setFlipX(direction === -1);
    }

    /**
     * Configure physics body properties for the projectile.
     * Enables gravity and perfect bounce physics.
     */
    private setupPhysicsBody(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // Collision box - adjusted for sprite scale
        // Base sprite is 128x128, scaled to 192x192 (1.5x)
        // Use smaller hitbox centered on sprite
        body.setSize(SpoutProjectile.BODY_WIDTH, SpoutProjectile.BODY_HEIGHT);
        body.setOffset(SpoutProjectile.BODY_OFFSET_X, SpoutProjectile.BODY_OFFSET_Y);

        // Enable gravity (uses scene default: 800)
        body.setAllowGravity(true);

        // Tailored bounce physics - retains 100% energy on collision on X axis, 50% on Y axis
        body.setBounce(SpoutProjectile.BOUNCE_X, SpoutProjectile.BOUNCE_Y);

        // Don't use world bounds - we'll track bounces via platform collisions
        body.setCollideWorldBounds(false);
    }

    /**
     * Called when spout collides with a WALL (left or right boundary).
     * Only wall bounces count toward the bounce limit.
     * Floor, ceiling, and platform bounces are free and don't count.
     */
    public onWallBounce(): void {
        // Increment bounce counter only for wall hits
        this.bounceCount++;

        // Check if bounce limit reached
        if (this.bounceCount >= this.bounceLimit) {
            this.destroyProjectile();
        }
    }

    /**
     * Destroy the projectile and emit cleanup event.
     * Called when bounce limit reached, floor hit, or enemy collision.
     *
     * Emits 'spout-destroyed' event for scene cleanup.
     */
    public destroyProjectile(): void {
        // Emit event before destruction so listeners can react
        this.emit('spout-destroyed');

        // Destroy the sprite
        this.destroy();
    }

    /**
     * Clean up resources when projectile is destroyed.
     */
    destroy(fromScene?: boolean): void {
        super.destroy(fromScene);
    }
}
