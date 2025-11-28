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
        // Child classes should manage stun duration and transition back to NORMAL
        if (this.currentState === EnemyState.STUNNED) {
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
            this.currentState = EnemyState.STUNNED;
            this.enterState(EnemyState.STUNNED);
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
     * Typically: stop movement, show stun sprite, count down stun duration.
     */
    protected abstract updateStunnedState(): void;

    /**
     * Update logic specific to DYING state.
     * Typically: play death animation, handle cleanup.
     * Reserved for future implementation.
     */
    protected updateDyingState(): void {
        // Default implementation does nothing
        // Child classes can override if needed
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
     * Typically: start death animation, disable collision.
     * Reserved for future implementation.
     */
    protected enterDyingState(): void {
        // Default implementation does nothing
        // Child classes can override if needed
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
