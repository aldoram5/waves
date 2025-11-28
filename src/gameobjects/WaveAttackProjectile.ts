export default class WaveAttackProjectile extends Phaser.Physics.Arcade.Sprite {
    // Movement constants
    private static readonly SPEED = 300; // Pixels per second
    private static readonly LIFESPAN_FRAMES = 300; // 5 seconds at 60fps
    private static readonly MAX_DISTANCE = 1500; // Maximum travel distance in pixels

    // Collision box constants
    private static readonly BODY_WIDTH = 100; // Collision box width
    private static readonly BODY_HEIGHT = 80; // Collision box height
    private static readonly BODY_OFFSET_X = 14; // X offset to center collision box
    private static readonly BODY_OFFSET_Y = 24; // Y offset to position collision box

    // Visual constants
    private static readonly DEPTH = 15; // Render depth (above most objects)
    private static readonly SCALE_BASE = 1.0; // Base X scale
    private static readonly SCALE_Y_MIN = 1.0; // Minimum Y scale
    private static readonly SCALE_Y_AMPLITUDE = 0.2; // Y scale oscillation amplitude (0.8 to 1.2)
    private static readonly WAVE_FREQUENCY = 0.01; // Sine wave frequency for Y-axis scaling

    private direction: number;
    private startX: number;
    private frameCount: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, direction: number) {
        super(scene, x, y, 'waveattack');

        this.direction = direction;
        this.startX = x;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setVelocityX(WaveAttackProjectile.SPEED * direction);

        // Collision box setup - smaller and centered on sprite
        body.setSize(WaveAttackProjectile.BODY_WIDTH, WaveAttackProjectile.BODY_HEIGHT);
        body.setOffset(WaveAttackProjectile.BODY_OFFSET_X, WaveAttackProjectile.BODY_OFFSET_Y);

        // Set initial scale and flip sprite based on direction
        this.setScale(WaveAttackProjectile.SCALE_BASE, WaveAttackProjectile.SCALE_BASE);

        // Flip sprite horizontally if shooting right (direction = 1)
        if (direction > 0) {
            this.setFlipX(true);
        }

        // Set depth to be above most objects
        this.setDepth(WaveAttackProjectile.DEPTH);

        // Make sure it's visible
        this.setVisible(true);
    }

    update(): void {
        // Increment frame counter
        this.frameCount++;

        // Harmonic Y-axis scaling animation using sine wave
        // Creates a "wave" visual effect by oscillating Y scale between 0.8 and 1.2
        const time = this.scene.time.now;
        const scaleY = WaveAttackProjectile.SCALE_Y_MIN +
                       WaveAttackProjectile.SCALE_Y_AMPLITUDE *
                       Math.sin(time * WaveAttackProjectile.WAVE_FREQUENCY);
        this.setScale(WaveAttackProjectile.SCALE_BASE, scaleY);

        // Check lifespan
        if (this.frameCount >= WaveAttackProjectile.LIFESPAN_FRAMES) {
            this.destroyProjectile();
            return;
        }

        // Check max distance
        const distanceTraveled = Math.abs(this.x - this.startX);
        if (distanceTraveled >= WaveAttackProjectile.MAX_DISTANCE) {
            this.destroyProjectile();
            return;
        }
    }

    public destroyProjectile(): void {
        this.emit('wave-destroyed');
        this.destroy();
    }

    destroy(fromScene?: boolean): void {
        super.destroy(fromScene);
    }
}
