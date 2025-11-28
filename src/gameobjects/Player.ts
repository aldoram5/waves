import Phaser from 'phaser';
import { PlayerState, STATE_PRIORITY, FRAME_DURATIONS, PLAYER_PHYSICS } from './PlayerStates';
import WaveAttackProjectile from './WaveAttackProjectile';
import SpoutProjectile from './SpoutProjectile';
import SwallowManager from './SwallowManager';
import BaseEnemy from './BaseEnemy';

/**
 * Player entity for W.A.V.E.S game.
 * Extends Phaser.Physics.Arcade.Sprite to provide physics-based movement.
 * Manages two visual components: the whale sprite (this sprite) and a separate wave sprite.
 *
 * The Player uses a state machine with 8 states:
 * - IDLE: Default state with idle animations
 * - MOVING: Horizontal movement with arrow keys
 * - HIDING: Whale shows tail, hides body (down arrow)
 * - JUMPING: Full jump sequence with 3 animation phases
 * - FALLING: Falling state when no platform below
 * - ATTACKING: Wave attack (Z button)
 * - INHALING: Inhale animation (X button held)
 * - DYING: Death sequence when taking damage
 *
 * State Priority: DYING > ATTACKING/INHALING > JUMPING > FALLING > HIDING > MOVING > IDLE
 */
export default class Player extends Phaser.Physics.Arcade.Sprite {

    // State management
    private currentState: PlayerState;
    private previousState: PlayerState;

    // Wave sprite (separate visual component)
    private waveSprite: Phaser.GameObjects.Sprite;
    private waveStartX: number; // X position where wave stays during jump
    private waveY: number; // Fixed Y position for wave (stays on platform level)

    // Input references
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
    private zKey: Phaser.Input.Keyboard.Key | null;
    private xKey: Phaser.Input.Keyboard.Key | null;

    // Animation frame counters
    private frameCounter: number;
    private currentWhaleFrame: number; // 0 or 1 for alternating frames
    private currentWaveFrame: number;  // 0 or 1 for wave1/wave2

    // Jump state tracking
    private jumpPhase: 'start' | 'air' | 'landing' | null;
    private landingFrameCount: number;

    // Platform collision tracking
    private isOnPlatform: boolean;

    // Death state tracking
    private deathScaleProgress: number;

    // Spawn position tracking
    private spawnX: number;
    private spawnY: number;

    // Swallow/Inhale system
    private swallowManager: SwallowManager;
    private inhaleSuctionRadius: number = 200; // Detection range in pixels
    private inhaleSuctionPower: number = 15; // Pull strength per frame

    // Spit timer system
    private spitTimer: number = 0;
    private spitTimerActive: boolean = false;
    private spitWarningFlash: Phaser.Tweens.Tween | null = null;
    private static readonly SPIT_TIMER_DURATION = 1200; // 20 seconds at 60fps
    private static readonly SPIT_WARNING_TIME = 300; // 5 seconds remaining

    // Display size constants
    private static readonly NORMAL_DISPLAY_SIZE = 128; // Normal whale sprite size (width and height)
    private static readonly ENLARGED_DISPLAY_SIZE = 192; // Enlarged size when enemies swallowed (1.5x scale)

    // Physics body constants (collision box)
    private static readonly BODY_WIDTH = 50; // Collision box width
    private static readonly BODY_HEIGHT = 40; // Collision box height
    private static readonly BODY_OFFSET_X = 40; // X offset to center collision box
    private static readonly BODY_OFFSET_Y = 70; // Y offset to position collision box

    constructor(scene: Phaser.Scene, x: number, y: number) {
        // Create sprite with 'whale1' as default texture
        super(scene, x, y, 'whale1');

        // Store spawn position for respawning
        this.spawnX = x;
        this.spawnY = y;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setDepth(10); // Player on top

        // Configure physics body
        this.setupPhysicsBody();

        // Create wave sprite (separate game object)
        this.waveSprite = scene.add.sprite(x, y + PLAYER_PHYSICS.WAVE_OFFSET_Y, 'wave1');
        this.waveSprite.setDepth(9); // Wave below player
        this.waveStartX = x;
        this.waveY = y + PLAYER_PHYSICS.WAVE_OFFSET_Y; // Wave stays at platform level

        // Initialize state
        this.currentState = PlayerState.IDLE;
        this.previousState = PlayerState.IDLE;

        // Initialize input
        this.cursors = scene.input.keyboard?.createCursorKeys() || null;
        this.zKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Z) || null;
        this.xKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.X) || null;

        // Initialize counters
        this.frameCounter = 0;
        this.currentWhaleFrame = 0;
        this.currentWaveFrame = 0;
        this.landingFrameCount = 0;
        this.jumpPhase = null;
        this.isOnPlatform = false;
        this.deathScaleProgress = 0;

        // Initialize swallow manager
        this.swallowManager = new SwallowManager();
    }

    /**
     * Configure physics body properties for the player.
     * Called during construction to set up collision detection and movement physics.
     */
    private setupPhysicsBody(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // Set collision box size (smaller than sprite for better feel)
        // Whale sprites are 128x128 with transparent padding
        body.setSize(Player.BODY_WIDTH, Player.BODY_HEIGHT);

        // Offset collision box to account for transparent padding in sprite
        // X offset centers horizontally, Y offset pushes down to whale's body
        body.setOffset(Player.BODY_OFFSET_X, Player.BODY_OFFSET_Y);

        // Prevent player from leaving screen
        body.setCollideWorldBounds(true);

        // No bounce on collision
        body.setBounce(0);

        // Horizontal drag for smooth stopping
        body.setDrag(600, 0);

        // Limit horizontal speed, allow full gravity
        body.setMaxVelocity(300, PLAYER_PHYSICS.MAX_FALL_SPEED);
    }

    /**
     * Main update loop for the Player.
     * Called every frame by the scene.
     * Handles state evaluation, state transitions, and rendering updates.
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

        // Update spit timer if active
        this.updateSpitTimer();

        // Update visual representations
        this.updateAnimations();
        this.updateWavePosition();
    }

    /**
     * Evaluate which state the player should be in based on current conditions.
     * Uses STATE_PRIORITY to resolve conflicts when multiple states could be active.
     *
     * @returns The state the player should transition to
     */
    private evaluateState(): PlayerState {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // DYING state - highest priority, cannot be interrupted
        if (this.currentState === PlayerState.DYING) {
            // Only exit DYING state when death animation completes
            if (this.deathScaleProgress >= 1.0) {
                // Death complete - respawn logic handled externally
                return PlayerState.DYING;
            }
            return PlayerState.DYING;
        }

        // ATTACKING state - Z key just pressed
        // Player can only attack when not jumping or falling
        if (this.zKey && Phaser.Input.Keyboard.JustDown(this.zKey)) {
            if (this.currentState !== PlayerState.JUMPING && this.currentState !== PlayerState.FALLING) {
                return PlayerState.ATTACKING;
            }
        }

        // ATTACKING state continuation - stay in state until animation completes
        if (this.currentState === PlayerState.ATTACKING) {
            if (this.frameCounter < FRAME_DURATIONS.ATTACK_INHALE) {
                return PlayerState.ATTACKING;
            }
            // Animation complete, fall through to other states
        }

        // INHALING state - X key held down
        // Player can only inhale when not jumping or falling
        if (this.xKey && this.xKey.isDown && this.currentState !== PlayerState.JUMPING && this.currentState !== PlayerState.FALLING) {
            return PlayerState.INHALING;
        }

        // JUMPING state - Space key just pressed while on platform
        if (this.cursors?.space && Phaser.Input.Keyboard.JustDown(this.cursors.space) &&
            this.isOnPlatform && this.currentState !== PlayerState.JUMPING) {
            return PlayerState.JUMPING;
        }
        // Extra check to ensure jump state remains active while ascending
        // we check -1 to allow for minor floating point inaccuracies
        if (body.velocity.y < -1){
            return PlayerState.JUMPING;
        }
        // JUMPING state continuation - stay in state until landing completes
        // FALLING state transitions to JUMPING if landing animation is playing
        if (this.currentState === PlayerState.JUMPING || this.currentState === PlayerState.FALLING) {
            // Still in jump/fall if not on platform, or if landing animation playing
            if (!this.isOnPlatform || this.jumpPhase === 'landing') {
                // Ternary to distinguish between JUMPING and FALLING phases
                // we check -1 to allow for minor floating point inaccuracies
                return body.velocity.y > -1 ? PlayerState.FALLING : PlayerState.JUMPING;
            }
            // Landing complete, fall through to other states
        }

        // FALLING state - not on platform and moving downward
        if (!this.isOnPlatform && body.velocity.y > 0 ) {
            return PlayerState.FALLING;
        }

        // We just landed - if we were FALLING, stay on FALLING to play landing animation
        if (this.isOnPlatform && (this.currentState === PlayerState.FALLING) && (this.jumpPhase !== null)) {
            return PlayerState.FALLING;
        }

        // HIDING state - Down arrow held while on platform
        if (this.cursors?.down?.isDown && this.isOnPlatform) {
            return PlayerState.HIDING;
        }

        // MOVING state - Left or Right arrow pressed while on platform
        if ((this.cursors?.left?.isDown || this.cursors?.right?.isDown) &&
            this.isOnPlatform) {
            return PlayerState.MOVING;
        }

        // SPECIAL CASE: If we just respawned from DYING, we stay in HIDING state
        // until the player moves or does something else
        if (this.previousState === PlayerState.DYING && this.currentState === PlayerState.HIDING) {
            return PlayerState.HIDING;
        }

        // IDLE state - default when no other conditions met
        return PlayerState.IDLE;
    }

    /**
     * Called when entering a new state.
     * Performs initialization and setup for the state.
     *
     * @param state The state being entered
     */
    private enterState(state: PlayerState): void {
        // Reset frame counter for all states
        this.frameCounter = 0;

        switch (state) {
            // @ts-ignore fall through intended
            case PlayerState.IDLE:
                // Reset to default textures
                this.setTexture('whale1');
                this.waveSprite.setTexture('wave1');
                this.currentWhaleFrame = 0;
                this.currentWaveFrame = 0;
                // Fall through to MOVING for shared setup

            case PlayerState.MOVING:
                // Reposition wave to match whale's position when becoming idle
                this.waveStartX = this.x;
                this.waveY = this.y + PLAYER_PHYSICS.WAVE_OFFSET_Y;
                // Continue idle animation while moving
                // Horizontal movement handled in updateState
                break;

            case PlayerState.HIDING:
                // Switch to tail textures
                this.setTexture('whale-tail1');
                this.currentWhaleFrame = 0;
                // Reposition wave to match whale's position when becoming idle
                this.waveStartX = this.x;
                this.waveY = this.y + PLAYER_PHYSICS.WAVE_OFFSET_Y;
                break;

            case PlayerState.JUMPING:
                // Start jump sequence
                this.jumpPhase = 'start';
                this.setTexture('whale-jump1');
                // Store wave X position at jump start (Y follows whale's platform)
                this.waveStartX = this.x;
                // Apply upward velocity
                const body = this.body as Phaser.Physics.Arcade.Body;
                body.setVelocityY(PLAYER_PHYSICS.JUMP_VELOCITY);
                // Hide wave sprite during jump
                this.waveSprite.setVisible(false);
                break;

            case PlayerState.FALLING:
                // Set falling texture (whale-jump2 upside down)
                this.setTexture('whale-jump2');
                this.setFlipY(true); // Flip vertically (scaleY = -1)
                // Ensure jumpPhase is set to air if falling without jumping
                if (this.jumpPhase === null) {
                    this.jumpPhase = 'air';
                }
                // Hide wave sprite during jump
                this.waveSprite.setVisible(false);
                break;

            case PlayerState.ATTACKING:
                // Show attack texture
                this.setTexture('whale-inhale2');
                // Spawn wave attack projectile
                this.spawnWaveAttack();
                break;

            case PlayerState.INHALING:
                // Start inhale animation
                this.setTexture('whale-inhale1');
                this.currentWhaleFrame = 0;
                // TODO: Activate inhale proximity detection
                break;

            case PlayerState.DYING:
                // Begin death sequence
                this.deathScaleProgress = 0;
                // Hide wave immediately
                this.waveSprite.setVisible(false);
                // TODO: Play death sound
                break;
        }
    }

    /**
     * Called when exiting a state.
     * Performs cleanup and resets state-specific properties.
     *
     * @param state The state being exited
     */
    private exitState(state: PlayerState): void {
        switch (state) {
            case PlayerState.HIDING:
                // Return to normal whale texture
                this.setTexture('whale1');
                break;

            case PlayerState.JUMPING:
                this.landingFrameCount = 0;
                break;

            case PlayerState.FALLING:
                // Reset jump tracking
                this.jumpPhase = null;
                // Reset vertical flip
                this.setFlipY(false);
                // Show wave sprite again
                this.waveSprite.setVisible(true);
                break;

            case PlayerState.ATTACKING:
                // Return to idle texture
                this.setTexture('whale1');
                break;

            case PlayerState.INHALING:
                // Return to idle texture
                this.setTexture('whale1');
                // TODO: Deactivate inhale proximity detection
                break;

            case PlayerState.DYING:
                // Reset visibility and scale when respawning
                this.setVisible(true);
                this.waveSprite.setVisible(true);
                this.setScale(1, 1);
                break;
        }
    }

    /**
     * Update logic for the current state.
     * Called every frame for the active state.
     * Handles state-specific behavior and physics.
     *
     * @param state The current active state
     */
    private updateState(state: PlayerState): void {
        // Horizontal movement allowed in most states (except DYING, HIDING, ATTACKING)
        if (state !== PlayerState.DYING && state !== PlayerState.HIDING && state !== PlayerState.ATTACKING) {
            this.handleHorizontalMovement();
        }

        switch (state) {
            case PlayerState.IDLE:
                // No special logic - animations handled in updateAnimations()
                // Drag naturally slows horizontal movement to zero
                break;

            case PlayerState.MOVING:
                // Horizontal movement already handled above
                // Animation continues in updateAnimations()
                break;

            case PlayerState.HIDING:
                // Tail animation handled in updateAnimations()
                break;

            case PlayerState.JUMPING:
                // Gravity handles downward velocity
                // Horizontal movement allowed
                // Update jump/fall logic
                this.updateJumpState();
                break;

            case PlayerState.FALLING:
                // Gravity handles downward velocity
                // Horizontal movement allowed
                // Landing detection handled in evaluateState
                // Update jump/fall logic
                this.updateJumpState();
                // Keep upright during landing
                if (this.jumpPhase === 'landing') {
                    this.setFlipY(false); 
                }
                break;

            case PlayerState.ATTACKING:
                // Attack animation duration handled in evaluateState
                break;

            case PlayerState.INHALING:
                // Allow movement while inhaling
                // Animation alternates in updateAnimations()
                // Emit inhaling event for scene to handle suction logic
                this.scene.events.emit('player-inhaling', this.x, this.y);
                break;

            case PlayerState.DYING:
                this.updateDeathState();
                break;
        }

        // Increment frame counter for animation timing
        this.frameCounter++;
    }

    /**
     * Handle horizontal movement based on arrow key input.
     * Applies velocity and updates sprite facing direction.
     * Called every frame for states that allow movement.
     */
    private handleHorizontalMovement(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        if (this.cursors?.left?.isDown) {
            body.setVelocityX(-PLAYER_PHYSICS.MOVE_SPEED);
            this.setFlipX(false); // Face left (normal orientation)
        } else if (this.cursors?.right?.isDown) {
            body.setVelocityX(PLAYER_PHYSICS.MOVE_SPEED);
            this.setFlipX(true); // Face right (flip horizontally)
        }
        // If neither key pressed, drag will slow player naturally
    }

    /**
     * Update logic specific to the JUMPING state.
     * Handles three-phase jump: start, air, landing.
     */
    private updateJumpState(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        switch (this.jumpPhase) {
            case 'start':
                // whale-jump1 plays for exactly JUMP_START frames (10)
                if (this.frameCounter >= FRAME_DURATIONS.JUMP_START) {
                    this.jumpPhase = 'air';
                    this.setTexture('whale-jump2');
                    this.frameCounter = 0; // Reset for next phase
                }
                break;

            case 'air':
                // whale-jump2 continues until player lands on platform
                // Landing detected by collision callback setting isOnPlatform = true
                if (this.isOnPlatform) {
                    this.jumpPhase = 'landing';
                    this.setTexture('whale-jump3');
                    this.frameCounter = 0;
                    this.landingFrameCount = 0;
                }
                break;

            case 'landing':
                // whale-jump3 plays for exactly JUMP_LANDING frames (15)
                this.landingFrameCount++;
                if (this.landingFrameCount >= FRAME_DURATIONS.JUMP_LANDING) {
                    // Landing complete - evaluateState will transition to IDLE/MOVING
                    this.jumpPhase = null;
                }
                break;
        }
    }

    /**
     * Update logic specific to the DYING state.
     * Compresses whale sprite vertically until scaleY reaches 0.
     */
    private updateDeathState(): void {
        const body = this.body as Phaser.Physics.Arcade.Body;

        // Stop all movement
        body.setVelocity(0, 0);

        // Compress scaleY over approximately 60 frames (1 second at 60fps)
        const compressionSpeed = 1 / 60;
        this.deathScaleProgress += compressionSpeed;

        // Apply scale compression
        const scaleY = Math.max(0, 1 - this.deathScaleProgress);
        this.setScale(this.scaleX, scaleY);

        if (this.deathScaleProgress >= 1.0) {
            // Death animation complete
            this.setVisible(false);
            // Emit event for scene to handle respawn
            this.scene.events.emit('player-died');
        }
    }

    /**
     * Update animations for whale and wave sprites based on current state.
     * Called every frame after state update.
     * Manages frame-based texture swapping for smooth animation.
     */
    private updateAnimations(): void {
        switch (this.currentState) {
            case PlayerState.IDLE:
                this.animateIdle();
                break;

            case PlayerState.MOVING:
                this.animateIdle(); // Use same animation as idle
                break;

            case PlayerState.HIDING:
                this.animateTail();
                break;

            case PlayerState.JUMPING:
                // Jump textures handled in updateJumpState()
                // No wave animation during jump
                break;

            case PlayerState.FALLING:
                // Falling texture (whale-jump2 flipped) set in enterState()
                // No animation updates needed
                break;

            case PlayerState.ATTACKING:
                // Attack texture (whale-inhale2) set in enterState()
                // No animation updates needed
                break;

            case PlayerState.INHALING:
                this.animateInhale();
                break;

            case PlayerState.DYING:
                // Death handled in updateDeathState()
                // No texture animation needed
                break;
        }

        // Wave animation (except during jump when it stays still)
        if (this.currentState !== PlayerState.JUMPING) {
            this.animateWave();
        }
    }

    /**
     * Animate whale between whale1 and whale2 textures.
     * Used for IDLE and MOVING states.
     * Swaps textures every IDLE_SWAP frames (20 frames at 60fps = 0.33 seconds).
     */
    private animateIdle(): void {
        // Swap every 20 frames
        if (this.frameCounter % FRAME_DURATIONS.IDLE_SWAP === 0 && this.frameCounter > 0) {
            this.currentWhaleFrame = 1 - this.currentWhaleFrame; // Toggle 0/1
            const texture = this.currentWhaleFrame === 0 ? 'whale1' : 'whale2';
            this.setTexture(texture);
        }
    }

    /**
     * Animate whale between whale-tail1 and whale-tail2 textures.
     * Used for HIDING state.
     * Swaps textures every TAIL_SWAP frames (15 frames at 60fps = 0.25 seconds).
     */
    private animateTail(): void {
        // Swap every 15 frames (slightly faster than idle)
        if (this.frameCounter % FRAME_DURATIONS.TAIL_SWAP === 0 && this.frameCounter > 0) {
            this.currentWhaleFrame = 1 - this.currentWhaleFrame; // Toggle 0/1
            const texture = this.currentWhaleFrame === 0 ? 'whale-tail1' : 'whale-tail2';
            this.setTexture(texture);
        }
    }

    /**
     * Animate whale between whale-inhale1 and whale-inhale2 textures.
     * Used for INHALING state (while X key held).
     * Swaps textures every INHALE_SWAP frames (8 frames at 60fps = 0.13 seconds).
     */
    private animateInhale(): void {
        // Swap every 12 frames (faster breathing effect)
        if (this.frameCounter % FRAME_DURATIONS.INHALE_SWAP === 0 && this.frameCounter > 0) {
            this.currentWhaleFrame = 1 - this.currentWhaleFrame; // Toggle 0/1
            const texture = this.currentWhaleFrame === 0 ? 'whale-inhale1' : 'whale-inhale2';
            this.setTexture(texture);
        }
    }

    /**
     * Animate wave sprite between wave1 and wave2 textures.
     * Matches whale animation timing (WAVE_SWAP frames).
     * Wave animation continues in all states except JUMPING and DYING.
     */
    private animateWave(): void {
        // Don't animate wave if it's hidden
        if (!this.waveSprite.visible) {
            return;
        }

        // Swap every 20 frames (matches idle animation)
        if (this.frameCounter % FRAME_DURATIONS.WAVE_SWAP === 0 && this.frameCounter > 0) {
            this.currentWaveFrame = 1 - this.currentWaveFrame; // Toggle 0/1
            const texture = this.currentWaveFrame === 0 ? 'wave1' : 'wave2';
            this.waveSprite.setTexture(texture);
        }
    }

    /**
     * Update wave sprite position based on whale position and current state.
     * Wave stays at a fixed Y position (platform level) and only moves on X axis.
     *
     * IDLE/MOVING/HIDING: Wave locks to whale position (both X and Y repositioned)
     * JUMPING/FALLING: Wave X locked at jump start, Y stays at platform level
     * Other states: Wave follows whale X, Y stays at platform level
     */
    private updateWavePosition(): void {
        switch (this.currentState) {
            case PlayerState.IDLE:
            case PlayerState.HIDING:
            case PlayerState.MOVING:
                // Wave locks to whale position - update both X and Y
                this.waveSprite.setPosition(
                    this.x,
                    this.waveY
                );
                break;

            case PlayerState.JUMPING:
            case PlayerState.FALLING:
                // Wave X stays at position where jump started, Y stays at platform level
                // Creates effect of whale jumping out of water
                this.waveSprite.setPosition(
                    this.waveStartX,
                    this.waveY
                );
                break;

            case PlayerState.DYING:
                // Wave already hidden in enterState()
                // No position update needed
                break;

            default:
                // All other states (HIDING, ATTACKING, INHALING):
                // Wave follows whale's X position only, Y stays at platform level
                this.waveSprite.setPosition(
                    this.x,
                    this.waveY
                );
                break;
        }
    }

    /**
     * Update whether player is currently on a platform.
     * Called by scene's collision detection system.
     *
     * @param onPlatform True if player is touching a platform from above
     */
    public setOnPlatform(onPlatform: boolean): void {
        this.isOnPlatform = onPlatform;
    }

    /**
     * Spawn a wave attack projectile or spout attack based on swallow count.
     * If enemies are swallowed (count > 0), fires spout attack instead of wave.
     * Emits 'player-fired-wave' or 'player-fired-spout' event for scene to handle collisions.
     */
    private spawnWaveAttack(): void {

        // Determine direction based on flipX (1 = right, -1 = left)
        // According to movement code: flipX = false is left, flipX = true is right
        const direction = this.flipX ? 1 : -1;

        // Check if player has swallowed enemies
        const swallowedCount = this.swallowManager.getCount();

        if (swallowedCount > 0) {
            // Fire spout attack instead of wave
            // Spawn spout projectile at player position
            const spoutProjectile = new SpoutProjectile(
                this.scene,
                this.x,
                this.y,
                direction,
                swallowedCount
            );

            // Reset player to normal display size immediately
            this.setDisplaySize(Player.NORMAL_DISPLAY_SIZE, Player.NORMAL_DISPLAY_SIZE);

            // Reset body size to ensure collision box stays correct
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setSize(Player.BODY_WIDTH, Player.BODY_HEIGHT);
            body.setOffset(Player.BODY_OFFSET_X, Player.BODY_OFFSET_Y);

            // Stop spit timer and clear warning flash
            this.spitTimerActive = false;
            this.spitTimer = 0;
            if (this.spitWarningFlash) {
                this.spitWarningFlash.destroy();
                this.spitWarningFlash = null;
            }
            this.clearTint();

            // Clear swallow manager (enemies are now in the spout)
            this.swallowManager.clear();

            // Emit scene event for collision setup
            this.scene.events.emit('player-fired-spout', spoutProjectile);
        } else {
            // Fire normal wave attack
            // Spawn wave projectile at player position
            const waveProjectile = new WaveAttackProjectile(
                this.scene,
                this.x,
                this.y,
                direction
            );

            // Emit scene event for collision setup
            this.scene.events.emit('player-fired-wave', waveProjectile);
        }
    }

    /**
     * Swallow an enemy that has been pulled in by inhale.
     * Stores enemy data in SwallowManager and scales player up.
     * Emits event for scene to handle enemy removal.
     *
     * @param enemy The enemy to swallow
     */
    public swallowEnemy(enemy: BaseEnemy): void {
        // Add enemy to swallow manager
        this.swallowManager.addEnemy(enemy);

        // Scale sprite to show player has enemies inside
        // Whale sprites are 128x128, scale to 192x192 (1.5x)
        this.setDisplaySize(Player.ENLARGED_DISPLAY_SIZE, Player.ENLARGED_DISPLAY_SIZE);

        // Update physics body to match new size
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(Player.BODY_WIDTH, Player.BODY_HEIGHT);
        body.setOffset(Player.BODY_OFFSET_X, Player.BODY_OFFSET_Y);

        // Start spit timer if this is the first enemy
        if (this.swallowManager.getCount() === 1) {
            this.spitTimer = Player.SPIT_TIMER_DURATION;
            this.spitTimerActive = true;
        }
        // Force position update to prevent sinking, we use half body height to adjust for offset
        this.setPosition(this.x, this.y - Player.BODY_HEIGHT/2); 

        // Emit event with count for scene tracking
        this.scene.events.emit('enemy-swallowed', this.swallowManager.getCount());
    }

    /**
     * Update the spit timer countdown and handle warning flash.
     * Called every frame when timer is active.
     */
    private updateSpitTimer(): void {
        if (!this.spitTimerActive) return;

        // Decrement timer
        this.spitTimer--;

        // Start red flash warning at 5 seconds remaining
        if (this.spitTimer <= Player.SPIT_WARNING_TIME && !this.spitWarningFlash) {
            // Create flashing red tint (4Hz = every 15 frames)
            this.spitWarningFlash = this.scene.tweens.add({
                targets: this,
                tint: { from: 0xffffff, to: 0xff0000 },
                duration: 125, // 250ms total cycle (125ms each way)
                yoyo: true,
                repeat: -1 // Infinite loop
            });
        }

        // Kill player if timer expires
        if (this.spitTimer <= 0) {
            this.die();
        }
    }

    /**
     * Trigger player death sequence.
     * Transitions to DYING state which cannot be interrupted.
     * This method is called when the player takes damage.
     */
    public die(): void {
        if (this.currentState !== PlayerState.DYING) {
            // Cancel spit timer flash if active
            if (this.spitWarningFlash) {
                this.spitWarningFlash.destroy();
                this.spitWarningFlash = null;
            }
            this.clearTint();

            this.currentState = PlayerState.DYING;
            this.enterState(PlayerState.DYING);
        }
    }

    /**
     * Check if the player is currently in HIDING state.
     * Used for collision detection - player is immune to damage while hiding.
     *
     * @returns True if player is in HIDING state, false otherwise
     */
    public isHiding(): boolean {
        return this.currentState === PlayerState.HIDING;
    }

    /**
     * Get the swallow manager for accessing swallowed enemy data.
     * Used by Level1 scene for enemy respawn logic.
     *
     * @returns The swallow manager instance
     */
    public getSwallowManager(): SwallowManager {
        return this.swallowManager;
    }

    /**
     * Respawn the player at the original spawn position.
     * Resets all state, physics, and visual properties.
     * Player starts in HIDING state after respawn.
     */
    public respawn(): void {
        // Reset position to spawn point
        this.setPosition(this.spawnX, this.spawnY);

        // Reset physics
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);

        // Reset visual state
        this.setVisible(true);
        this.setScale(1, 1);
        this.setDisplaySize(Player.NORMAL_DISPLAY_SIZE, Player.NORMAL_DISPLAY_SIZE); // Reset display size to original
        this.angle = 0;

        // Reset body size to ensure collision box is correct
        body.setSize(Player.BODY_WIDTH, Player.BODY_HEIGHT);
        body.setOffset(Player.BODY_OFFSET_X, Player.BODY_OFFSET_Y);
        
        // Reset vertical flip
        this.setFlipY(false);

        // Reset wave sprite
        this.waveSprite.setVisible(true);
        this.waveStartX = this.spawnX;
        this.waveY = this.spawnY + PLAYER_PHYSICS.WAVE_OFFSET_Y;

        // Force HIDING state
        this.currentState = PlayerState.HIDING;
        this.previousState = PlayerState.DYING;
        this.enterState(PlayerState.HIDING);

        // Reset death progress
        this.deathScaleProgress = 0;

        // Reset frame counters
        this.frameCounter = 0;
        this.jumpPhase = null;
        this.landingFrameCount = 0;

        // Reset spit timer and flash
        this.spitTimer = 0;
        this.spitTimerActive = false;
        if (this.spitWarningFlash) {
            this.spitWarningFlash.destroy();
            this.spitWarningFlash = null;
        }
        this.clearTint();

        // Clear swallow manager (enemies will be respawned by Level1)
        this.swallowManager.clear();
    }

    /**
     * Clean up resources when player is destroyed.
     * Ensures wave sprite is also destroyed to prevent memory leaks.
     */
    destroy(fromScene?: boolean): void {
        // Clean up wave sprite
        this.waveSprite.destroy(fromScene);
        super.destroy(fromScene);
    }
}
