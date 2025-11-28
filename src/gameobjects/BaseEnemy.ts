import Phaser from 'phaser';
import { EnemyState } from './EnemyStates';

/**
 * Abstract base class for all enemy types in W.A.V.E.S game.
 * Implements a state machine pattern similar to the Player class.
 *
 * This provides a consistent state management system across all enemy types
 * and future-proofs the codebase for gameplay mechanics like:
 * - Stun effects from player wave attacks
 * - Death animations
 * - Status effects
 *
 * Child classes must implement:
 * - updateNormalState() - Enemy-specific behavior in NORMAL state
 * - updateStunnedState() - Enemy-specific behavior in STUNNED state
 * - enterNormalState() - Setup when entering NORMAL state
 * - exitNormalState() - Cleanup when exiting NORMAL state
 * - enterStunnedState() - Setup when entering STUNNED state
 * - exitStunnedState() - Cleanup when exiting STUNNED state
 */
export default abstract class BaseEnemy extends Phaser.Physics.Arcade.Sprite {

    // State management
    protected currentState: EnemyState;
    protected previousState: EnemyState;

    // Stun timer management
    protected stunTimer: number = 0;
    protected stunDuration: number = 300; // 5 seconds at 60fps

    // Death animation system
    protected deathTimer: number = 0;
    protected deathDuration: number = 30; // 0.5 seconds at 60fps (30 frames)
    protected startScale: number = 1.0;

    /**
     * Constructor for base enemy.
     * Child classes should call this via super() with their specific texture.
     *
     * @param scene The scene this enemy belongs to
     * @param x Initial X position
     * @param y Initial Y position
     * @param texture The texture key for this enemy type
     */
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Initialize state to NORMAL
        this.currentState = EnemyState.NORMAL;
        this.previousState = EnemyState.NORMAL;
    }

    /**
     * Main update loop for the enemy.
     * Called every frame by the scene.
     * Implements the state machine pattern:
     * 1. Evaluate what state we should be in
     * 2. Transition to new state if different from current
     * 3. Update current state logic
     *
     * This method follows the exact same pattern as Player.update()
     */
    public update(): void {
        // Evaluate what state we should be in based on current conditions
        const desiredState = this.evaluateState();

        // Transition to new state if different from current
        if (desiredState !== this.currentState) {
            this.exitState(this.currentState);
            this.previousState = this.currentState;
            this.currentState = desiredState;
            this.enterState(this.currentState);
        }

        // Update current state logic
        this.updateState(this.currentState);
    }

    /**
     * Evaluate which state the enemy should be in based on current conditions.
     * Uses simple priority system:
     * - DYING state cannot be interrupted
     * - STUNNED state has medium priority
     * - NORMAL state is default
     *
     * Child classes can override this to add custom state evaluation logic.
     *
     * @returns The state the enemy should transition to
     */
    protected evaluateState(): EnemyState {
        // DYING state - highest priority, cannot be interrupted
        if (this.currentState === EnemyState.DYING) {
            return EnemyState.DYING;
        }

        // STUNNED state - medium priority
        // Check if stun timer is active
        if (this.stunTimer > 0) {
            return EnemyState.STUNNED;
        }

        // NORMAL state - default
        return EnemyState.NORMAL;
    }

    /**
     * Called when entering a new state.
     * Delegates to state-specific enter methods that child classes must implement.
     *
     * @param state The state being entered
     */
    protected enterState(state: EnemyState): void {
        switch (state) {
            case EnemyState.NORMAL:
                this.enterNormalState();
                break;

            case EnemyState.STUNNED:
                this.enterStunnedState();
                break;

            case EnemyState.DYING:
                this.enterDyingState();
                break;
        }
    }

    /**
     * Called when exiting a state.
     * Delegates to state-specific exit methods that child classes must implement.
     *
     * @param state The state being exited
     */
    protected exitState(state: EnemyState): void {
        switch (state) {
            case EnemyState.NORMAL:
                this.exitNormalState();
                break;

            case EnemyState.STUNNED:
                this.exitStunnedState();
                break;

            case EnemyState.DYING:
                this.exitDyingState();
                break;
        }
    }

    /**
     * Update logic for the current state.
     * Delegates to state-specific update methods that child classes must implement.
     *
     * @param state The current active state
     */
    protected updateState(state: EnemyState): void {
        switch (state) {
            case EnemyState.NORMAL:
                this.updateNormalState();
                break;

            case EnemyState.STUNNED:
                this.updateStunnedState();
                break;

            case EnemyState.DYING:
                this.updateDyingState();
                break;
        }
    }

    /**
     * Public API: Trigger stun effect on this enemy.
     * Called when player hits enemy with wave attack.
     * Transitions enemy to STUNNED state.
     *
     * Reserved for future wave attack mechanic implementation.
     */
    public stun(): void {
        if (this.currentState !== EnemyState.DYING) {
            // Reset stun timer to full duration (resets if already stunned)
            this.stunTimer = this.stunDuration;

            // Only transition to STUNNED if not already in that state
            if (this.currentState !== EnemyState.STUNNED) {
                this.currentState = EnemyState.STUNNED;
                this.enterState(EnemyState.STUNNED);
            }
        }
    }

    /**
     * Public API: Trigger death sequence on this enemy.
     * Called when player's spout attack hits enemy.
     * Transitions enemy to DYING state and starts scale-down animation.
     * Enemy will be destroyed after animation completes.
     */
    public die(): void {
        // Only allow death if not already dying
        if (this.currentState !== EnemyState.DYING) {
            this.currentState = EnemyState.DYING;
            this.enterState(EnemyState.DYING);
        }
    }

    /**
     * Public API: Get current state.
     * Useful for debugging and external state checks.
     *
     * @returns The current state of the enemy
     */
    public getState(): EnemyState {
        return this.currentState;
    }

    // Abstract methods that child classes MUST implement

    /**
     * Update logic specific to NORMAL state.
     * Each enemy type implements their own behavior:
     * - PatrolEnemy: horizontal patrol with edge detection
     * - TurretEnemy: player tracking and projectile shooting
     */
    protected abstract updateNormalState(): void;

    /**
     * Update logic specific to STUNNED state.
     * Decrements stun timer each frame.
     * Child classes should call super.updateStunnedState() and add their own logic.
     */
    protected updateStunnedState(): void {
        // Decrement stun timer
        if (this.stunTimer > 0) {
            this.stunTimer--;
        }
    }

    /**
     * Update logic specific to DYING state.
     * Animates scale-down from 1.0 to 0.0 over 30 frames (0.5 seconds).
     * Destroys the enemy sprite when animation completes.
     */
    protected updateDyingState(): void {
        // Increment death timer
        this.deathTimer++;

        // Calculate scale progress (1.0 -> 0.0 over deathDuration frames)
        const progress = this.deathTimer / this.deathDuration;
        const currentScale = this.startScale * (1.0 - progress);

        // Apply scale to sprite
        this.setScale(currentScale, currentScale);

        // Check if animation complete
        if (this.deathTimer >= this.deathDuration) {
            this.destroy();
        }
    }

    /**
     * Setup when entering NORMAL state.
     * Typically: reset to default texture, resume movement.
     */
    protected abstract enterNormalState(): void;

    /**
     * Cleanup when exiting NORMAL state.
     * Typically: minimal cleanup needed.
     */
    protected abstract exitNormalState(): void;

    /**
     * Setup when entering STUNNED state.
     * Typically: switch to stun texture, stop movement, start stun timer.
     */
    protected abstract enterStunnedState(): void;

    /**
     * Cleanup when exiting STUNNED state.
     * Typically: reset to normal texture, resume movement.
     */
    protected abstract exitStunnedState(): void;

    /**
     * Setup when entering DYING state.
     * Shows stun sprite, disables collision, and initializes death animation.
     * Child classes can override to add specific cleanup (stop tweens, etc).
     */
    protected enterDyingState(): void {
        // Switch to stun sprite for death animation
        // (using stun texture as the "defeated" look)
        const stunTexture = this.texture.key.includes('enemy2') ? 'enemy2-stun' : 'enemy-stun';
        this.setTexture(stunTexture);

        // Disable collision so enemy doesn't interact with player/projectiles
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.enable = false;

        // Stop all physics movement
        body.setVelocity(0, 0);

        // Initialize death timer
        this.deathTimer = 0;
        this.startScale = this.scaleX; // Store current scale
    }

    /**
     * Cleanup when exiting DYING state.
     * Typically: destroy the enemy sprite.
     * Reserved for future implementation.
     */
    protected exitDyingState(): void {
        // Default implementation does nothing
        // Child classes can override if needed
    }
}
