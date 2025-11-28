import Phaser from 'phaser';

/**
 * Enemy projectile for W.A.V.E.S game.
 * Simple horizontal-traveling projectile fired by TurretEnemy.
 *
 * Behavior:
 * - Travels horizontally at constant speed (250 pixels/second)
 * - No gravity applied
 * - Auto-destroys on wall/platform collision
 * - Auto-destroys on player collision
 * - Auto-destroys on world bounds exit
 * - Emits 'projectile-destroyed' event for cleanup
 *
 * Uses velocity-based movement, so no update() method needed.
 */
export default class EnemyProjectile extends Phaser.Physics.Arcade.Sprite {

    // Movement constant
    private static readonly SPEED = 250; // pixels/second

    /**
     * Create a new enemy projectile.
     *
     * @param scene The scene this projectile belongs to
     * @param x Initial X position (turret position)
     * @param y Initial Y position (turret position)
     * @param direction Horizontal direction: -1 for left, 1 for right
     */
    constructor(scene: Phaser.Scene, x: number, y: number, direction: -1 | 1) {
        // Create sprite with 'enemyAttackwhale' texture
        super(scene, x, y, 'enemyAttackwhale');

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Configure physics body
        this.setupPhysicsBody();

        // Set depth layer (same as enemies)
        this.setDepth(5);

        // Set velocity based on direction
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(direction * EnemyProjectile.SPEED);

        // Flip sprite if going left
        // Default sprite faces right, so flip when going left
        this.setFlipX(direction === -1);
    }

    /**
     * Configure physics body properties for the projectile.
     * Called during construction to set up collision detection and movement physics.
     */
    private setupPhysicsBody(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // Projectile collision box
        // Adjust based on actual sprite dimensions
        // enemyAttackwhale.png is 128x128, but active area is smaller
        body.setSize(80, 60);
        body.setOffset(24, 34);

        // No gravity - projectile travels horizontally
        body.setAllowGravity(false);

        // Enable world bounds collision for auto-destroy
        body.setCollideWorldBounds(true);
        body.onWorldBounds = true;

        // Listen for world bounds collision
        this.scene.physics.world.on('worldbounds', (worldBody: Phaser.Physics.Arcade.Body) => {
            if (worldBody.gameObject === this) {
                this.destroyProjectile();
            }
        }, this);
    }

    /**
     * Destroy the projectile and emit cleanup event.
     * Called when projectile hits wall, player, or exits world bounds.
     *
     * Emits 'projectile-destroyed' event for the turret to clear its reference
     * and for the scene to remove from projectile array.
     */
    public destroyProjectile(): void {
        // Emit event before destruction so listeners can react
        this.emit('projectile-destroyed');

        // Destroy the sprite
        this.destroy();
    }

    /**
     * Clean up resources when projectile is destroyed.
     * Removes world bounds listener to prevent memory leaks.
     */
    destroy(fromScene?: boolean): void {
        // Remove world bounds listener
        this.scene.physics.world.off('worldbounds', undefined, this);

        super.destroy(fromScene);
    }
}
