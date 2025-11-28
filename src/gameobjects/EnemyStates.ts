/**
 * Enemy state definitions and constants for W.A.V.E.S game.
 * Defines the state machine states available to all enemy types.
 *
 * This follows the same pattern as PlayerStates.ts, providing a simple
 * priority-based state system for enemy behavior management.
 */

/**
 * Enum representing all possible states an enemy can be in.
 * States are managed by priority to handle overlapping conditions.
 */
export enum EnemyState {
    /**
     * DYING state - Enemy death animation and cleanup.
     * Highest priority - cannot be interrupted once started.
     * Reserved for future implementation.
     */
    DYING = 'DYING',

    /**
     * STUNNED state - Enemy is temporarily disabled by player wave attack.
     * Medium priority - can be stunned from normal state.
     * Reserved for future wave attack mechanic implementation.
     */
    STUNNED = 'STUNNED',

    /**
     * NORMAL state - Enemy performing standard behavior.
     * Lowest priority - default active state.
     * Each enemy type implements their own normal behavior:
     * - PatrolEnemy: horizontal patrol with edge detection
     * - TurretEnemy: stationary with projectile shooting
     */
    NORMAL = 'NORMAL'
}

/**
 * Priority values for each state.
 * Higher numbers indicate higher priority.
 * Used to resolve conflicts when multiple states could be active.
 *
 * Priority order: DYING > STUNNED > NORMAL
 */
export const ENEMY_STATE_PRIORITY: Record<EnemyState, number> = {
    [EnemyState.DYING]: 3,
    [EnemyState.STUNNED]: 2,
    [EnemyState.NORMAL]: 1
};
