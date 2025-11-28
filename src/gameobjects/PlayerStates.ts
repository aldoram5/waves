/**
 * Defines all possible states for the Player entity.
 * States are prioritized with DYING having highest priority and IDLE having lowest.
 * The state machine evaluates conditions in priority order to determine the active state.
 */
export enum PlayerState {
    DYING = 'DYING',
    ATTACKING = 'ATTACKING',
    INHALING = 'INHALING',
    JUMPING = 'JUMPING',
    FALLING = 'FALLING',
    HIDING = 'HIDING',
    MOVING = 'MOVING',
    IDLE = 'IDLE'
}

/**
 * State priority values - higher numbers take precedence.
 * Used to determine which state should be active when multiple
 * conditions are met simultaneously.
 */
export const STATE_PRIORITY: Record<PlayerState, number> = {
    [PlayerState.DYING]: 8,
    [PlayerState.ATTACKING]: 7,
    [PlayerState.INHALING]: 7,
    [PlayerState.JUMPING]: 6,
    [PlayerState.FALLING]: 5,
    [PlayerState.HIDING]: 4,
    [PlayerState.MOVING]: 2,
    [PlayerState.IDLE]: 1
};

/**
 * Frame durations for various animations.
 * All values are in game frames at 60 FPS.
 *
 * Examples:
 * - 20 frames = 0.33 seconds
 * - 5 frames = 0.08 seconds
 */
export const FRAME_DURATIONS = {
    IDLE_SWAP: 20,           // Frames between whale1/whale2 swaps in IDLE state
    WAVE_SWAP: 20,           // Frames between wave1/wave2 swaps
    TAIL_SWAP: 15,           // Frames between tail1/tail2 swaps in HIDING state
    JUMP_START: 10,           // Duration of whale-jump1 at start of jump
    JUMP_LANDING: 15,         // Duration of whale-jump3 on landing
    ATTACK_INHALE: 5,        // Duration of whale-inhale2 attack animation
    INHALE_SWAP: 12           // Frames between inhale1/inhale2 while inhaling
};

/**
 * Movement and physics constants for the Player.
 * These values control how the player moves and interacts with the physics system.
 */
export const PLAYER_PHYSICS = {
    MOVE_SPEED: 200,         // Horizontal velocity when moving (pixels/second)
    JUMP_VELOCITY: -530,     // Upward velocity on jump (negative is up, pixels/second)
    MAX_FALL_SPEED: 800,     // Terminal velocity when falling (pixels/second)
    JUMP_HEIGHT: 200,        // Approximate jump height in pixels for reference only; not used in calculations or as a configurable parameter
    WAVE_OFFSET_Y: 5        // Vertical offset of wave sprite from whale position
};
