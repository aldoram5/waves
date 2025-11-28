import Phaser from 'phaser';
import BaseEnemy from './BaseEnemy';
import Player from './Player';
import EnemyProjectile from './EnemyProjectile';

/**
 * Turret enemy for W.A.V.E.S game.
 * Stationary enemy that tracks player position and shoots projectiles.
 *
 * Behavior:
 * - Remains stationary at spawn position (no movement)
 * - Tracks player direction visually (flips sprite to face player)
 * - Shoots projectiles when player is within Y-axis detection range (50 pixels)
 * - Changes sprite when player is in range: enemy2 → enemy2-look
 * - One active projectile at a time
 * - 0.5 second cooldown after projectile destruction before next shot
 *
 * Uses event-based architecture to communicate with scene for collision setup.
 */
export default class TurretEnemy extends BaseEnemy {

    // Constants
    private static readonly Y_DETECTION_RANGE = 50;      // pixels
    private static readonly PROJECTILE_SPEED = 250;      // pixels/second (for reference)
    private static readonly SHOOT_COOLDOWN = 500;        // milliseconds (0.5 seconds)

    // Player reference for tracking
    private player: Player;

    // Projectile management
    private activeProjectile: EnemyProjectile | null;
    private lastShotTime: number;

    // Tracking state
    private isPlayerInRange: boolean;
    private isFacingLeft: boolean;

    /**
     * Create a new turret enemy.
     *
     * @param scene The scene this turret belongs to
     * @param x Spawn X position (turret remains stationary here)
     * @param y Spawn Y position (turret remains stationary here)
     * @param player Reference to player for tracking
     */
    constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
        // Create sprite with 'enemy2' texture
        super(scene, x, y, 'enemy2');

        // Store player reference
        this.player = player;

        // Initialize projectile management
        this.activeProjectile = null;
        this.lastShotTime = 0;

        // Initialize tracking state
        this.isPlayerInRange = false;
        this.isFacingLeft = false;

        // Configure physics body
        this.setupPhysicsBody();
    }

    /**
     * Configure physics body properties for the turret.
     * Turret is stationary with no gravity.
     */
    private setupPhysicsBody(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // Turret sprite is 128x128, set collision box
        body.setSize(100, 100);
        body.setOffset(14, 20);

        // Turret is stationary
        body.setImmovable(true);
        body.setVelocity(0, 0);

        // No gravity for stationary enemy
        body.setAllowGravity(false);

        // Set depth layer
        this.setDepth(5); // Same as other enemies
    }

    /**
     * Update logic specific to NORMAL state.
     * Handles player tracking, sprite switching, and projectile shooting.
     */
    protected updateNormalState(): void {
        // 1. Check Y-axis distance to player
        const yDistance = Math.abs(this.y - this.player.y);
        this.isPlayerInRange = yDistance <= TurretEnemy.Y_DETECTION_RANGE;

        // 2. Track player direction
        this.isFacingLeft = this.player.x < this.x;

        // Flip sprite toward player
        // setFlipX(false) = facing left (default)
        // setFlipX(true) = facing right (flipped)
        this.setFlipX(this.isFacingLeft);

        // 3. Update sprite based on range
        if (this.isPlayerInRange) {
            this.setTexture('enemy2-look');  // Tracking sprite
        } else {
            this.setTexture('enemy2');       // Idle sprite
        }

        // 4. Attempt to shoot
        this.attemptShoot();
    }

    /**
     * Update logic specific to STUNNED state.
     * Turret stops tracking and cannot shoot while stunned.
     * Reserved for future wave attack mechanic implementation.
     */
    protected updateStunnedState(): void {
        // Ensure idle sprite while stunned
        this.setTexture('enemy2-stun');

        // No shooting while stunned
        // TODO: Add stun duration timer and transition back to NORMAL after timeout
    }

    /**
     * Setup when entering NORMAL state.
     * Reset to idle texture.
     */
    protected enterNormalState(): void {
        this.setTexture('enemy2');
    }

    /**
     * Cleanup when exiting NORMAL state.
     * Minimal cleanup needed for turret.
     */
    protected exitNormalState(): void {
        // No special cleanup needed
    }

    /**
     * Setup when entering STUNNED state.
     * Switch to stun texture.
     */
    protected enterStunnedState(): void {
        this.setTexture('enemy2-stun');

        // TODO: Start stun timer
    }

    /**
     * Cleanup when exiting STUNNED state.
     * Return to normal texture.
     */
    protected exitStunnedState(): void {
        this.setTexture('enemy2');
    }

    /**
     * Attempt to shoot a projectile.
     * Only fires if all conditions are met:
     * - Player is within Y-axis range
     * - No active projectile
     * - Cooldown has expired
     */
    private attemptShoot(): void {
        if (!this.canShoot()) return;

        // Fire projectile
        const direction = this.isFacingLeft ? -1 : 1;
        const projectile = new EnemyProjectile(this.scene, this.x, this.y, direction);

        // Store reference
        this.activeProjectile = projectile;
        this.lastShotTime = this.scene.time.now;

        // Clear reference when projectile is destroyed
        projectile.on('projectile-destroyed', () => {
            this.activeProjectile = null;
        });

        // Notify scene for collision setup
        // Scene listens for this event and sets up platform/player collisions
        this.scene.events.emit('turret-fired-projectile', projectile);
    }

    /**
     * Check if the turret can shoot a projectile.
     * Enforces all shooting conditions:
     * - Player must be in Y-axis range
     * - Only one projectile active at a time
     * - Cooldown must be expired
     *
     * @returns True if can shoot, false otherwise
     */
    private canShoot(): boolean {
        // Player must be in Y range
        if (!this.isPlayerInRange) {
            return false;
        }

        // Only one projectile at a time
        if (this.activeProjectile !== null) {
            return false;
        }

        // Cooldown must be expired
        const timeSinceLastShot = this.scene.time.now - this.lastShotTime;
        if (timeSinceLastShot < TurretEnemy.SHOOT_COOLDOWN) {
            return false;
        }

        return true;
    }

    /**
     * Clean up resources when turret is destroyed.
     */
    destroy(fromScene?: boolean): void {
        // Clean up active projectile if exists
        if (this.activeProjectile && !this.activeProjectile.scene) {
            this.activeProjectile.destroy();
        }

        super.destroy(fromScene);
    }
}
