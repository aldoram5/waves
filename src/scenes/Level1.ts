
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import Player from '../gameobjects/Player';
import PatrolEnemy from '../gameobjects/PatrolEnemy';
import TurretEnemy from '../gameobjects/TurretEnemy';
import EnemyProjectile from '../gameobjects/EnemyProjectile';
/* END-USER-IMPORTS */

export default class Level1 extends Phaser.Scene {

	constructor() {
		super("Level1");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// floor
		const floor = this.add.rectangle(0, 675, 128, 128);
		floor.scaleX = 10.014984733442693;
		floor.scaleY = 0.35242533493618;
		floor.setOrigin(0, 0);
		floor.isFilled = true;
		floor.fillColor = 0;
		floor.isStroked = true;
		floor.strokeColor = 2293248;
		floor.lineWidth = 5;

		// ceiling
		const ceiling = this.add.rectangle(0, 0, 128, 128);
		ceiling.scaleX = 10.014984733442693;
		ceiling.scaleY = 0.35242533493618;
		ceiling.setOrigin(0, 0);
		ceiling.isFilled = true;
		ceiling.fillColor = 0;
		ceiling.isStroked = true;
		ceiling.strokeColor = 2293248;
		ceiling.lineWidth = 5;

		// leftwall
		const leftwall = this.add.rectangle(0, 0, 128, 128);
		leftwall.scaleX = 0.3;
		leftwall.scaleY = 5.7;
		leftwall.setOrigin(0, 0);
		leftwall.isFilled = true;
		leftwall.fillColor = 0;
		leftwall.isStroked = true;
		leftwall.strokeColor = 2293248;
		leftwall.lineWidth = 5;

		// rightwall
		const rightwall = this.add.rectangle(1239, 0, 128, 128);
		rightwall.scaleX = 0.3;
		rightwall.scaleY = 5.7;
		rightwall.setOrigin(0, 0);
		rightwall.isFilled = true;
		rightwall.fillColor = 0;
		rightwall.isStroked = true;
		rightwall.strokeColor = 2293248;
		rightwall.lineWidth = 5;

		// platform1
		const platform1 = this.add.rectangle(43, 515, 128, 128);
		platform1.scaleX = 7;
		platform1.scaleY = 0.35242533493618;
		platform1.setOrigin(0, 0);
		platform1.isFilled = true;
		platform1.fillColor = 0;
		platform1.isStroked = true;
		platform1.strokeColor = 2293248;
		platform1.lineWidth = 5;

		// platform2
		const platform2 = this.add.rectangle(348, 355, 128, 128);
		platform2.scaleX = 7;
		platform2.scaleY = 0.35242533493618;
		platform2.setOrigin(0, 0);
		platform2.isFilled = true;
		platform2.fillColor = 0;
		platform2.isStroked = true;
		platform2.strokeColor = 2293248;
		platform2.lineWidth = 5;

		// platform3
		const platform3 = this.add.rectangle(43, 195, 128, 128);
		platform3.scaleX = 7;
		platform3.scaleY = 0.35242533493618;
		platform3.setOrigin(0, 0);
		platform3.isFilled = true;
		platform3.fillColor = 0;
		platform3.isStroked = true;
		platform3.strokeColor = 2293248;
		platform3.lineWidth = 5;

		this.events.emit("scene-awake");
	}

	/* START-USER-CODE */

	private player!: Player;
	private patrolEnemies: PatrolEnemy[] = [];
	private turretEnemies: TurretEnemy[] = [];
	private projectiles: EnemyProjectile[] = [];

	create() {
		this.editorCreate();

		// Get all platforms (rectangles created by editor)
		const platforms = this.getPlatforms();

		// Enable physics on all platforms
		platforms.forEach(platform => {
			this.physics.add.existing(platform, true); // Static bodies
			const body = platform.body as Phaser.Physics.Arcade.StaticBody;
			body.updateFromGameObject(); // Match body to rectangle bounds
		});

		// Create player at starting position (on the floor platform)
		// Floor is at y=675, player needs to be above it
		this.player = new Player(this, 200, 630);

		// Setup one-way platform collisions (can jump through from below)
		// Only the floor, ceiling, and walls should be solid from all directions
		const floor = platforms.find(p => p.y > 650); // Floor is at y=675
		const ceiling = platforms.find(p => p.y === 0); // Ceiling at top
		const walls = platforms.filter(p => p.scaleX < 1); // Walls are narrow

		// Solid collisions for floor, ceiling, and walls
		if (floor) this.physics.add.collider(this.player, floor);
		if (ceiling) this.physics.add.collider(this.player, ceiling);
		walls.forEach(wall => {
			this.physics.add.collider(this.player, wall);
		});

		// One-way platform collisions for middle platforms
		const oneWayPlatforms = platforms.filter(p =>
			p !== floor && p !== ceiling && !walls.includes(p)
		);
		oneWayPlatforms.forEach(platform => {
			this.physics.add.collider(
				this.player,
				platform,
				undefined, // No collision callback
				this.oneWayPlatformCheck, // Process callback for one-way collision
				this
			);
		});

		// Create patrol enemies on platforms
		// Pass all platforms to enemies for edge detection
		// Enemy on platform1 (middle-left platform at y=575)
		const enemy1 = new PatrolEnemy(this, 500, 530, platforms);
		this.patrolEnemies.push(enemy1);

		// Enemy on platform2 (upper-right platform at y=458)
		const enemy2 = new PatrolEnemy(this, 700, 413, platforms);
		this.patrolEnemies.push(enemy2);

		// Create turret enemies at strategic positions
		// Turret on middle-right platform
		const turret1 = new TurretEnemy(this, 900, 465, this.player);
		this.turretEnemies.push(turret1);

		// Turret on platform1 (top most platform on the left)
		const turret2 = new TurretEnemy(this, 300, 145, this.player);
		this.turretEnemies.push(turret2);

		// Setup patrol enemy collisions with platforms
		this.patrolEnemies.forEach(enemy => {
			// Solid collisions for floor, ceiling, and walls
			if (floor) this.physics.add.collider(enemy, floor);
			if (ceiling) this.physics.add.collider(enemy, ceiling);
			walls.forEach(wall => {
				this.physics.add.collider(enemy, wall);
			});

			// One-way platform collisions for middle platforms
			oneWayPlatforms.forEach(platform => {
				this.physics.add.collider(enemy, platform);
			});

			// Enemy-player collision detection
			// Using overlap instead of collider to avoid physical collision
			this.physics.add.overlap(
				this.player,
				enemy,
				undefined, // No collision callback needed
				this.checkEnemyPlayerCollision, // Process callback
				this
			);
		});

		// Setup turret enemy collisions (only player overlap, no platform collisions)
		this.turretEnemies.forEach(turret => {
			// Turret-player collision detection
			this.physics.add.overlap(
				this.player,
				turret,
				undefined,
				this.checkEnemyPlayerCollision,
				this
			);
		});

		// Listen for projectile firing events from turrets
		this.events.on('turret-fired-projectile', (projectile: EnemyProjectile) => {
			this.projectiles.push(projectile);

			// Store colliders/overlaps for cleanup
			const colliders: Phaser.Physics.Arcade.Collider[] = [];

			// Projectile-platform collisions (destroy projectile on hit)
			if (floor) {
				colliders.push(this.physics.add.collider(projectile, floor, () => {
					projectile.destroyProjectile();
				}));
			}
			if (ceiling) {
				colliders.push(this.physics.add.collider(projectile, ceiling, () => {
					projectile.destroyProjectile();
				}));
			}
			walls.forEach(wall => {
				colliders.push(this.physics.add.collider(projectile, wall, () => {
					projectile.destroyProjectile();
				}));
			});
			oneWayPlatforms.forEach(platform => {
				colliders.push(this.physics.add.collider(projectile, platform, () => {
					projectile.destroyProjectile();
				}));
			});

			// Projectile-player overlap (kill player unless hiding)
			colliders.push(
				this.physics.add.overlap(
					this.player,
					projectile,
					() => {
						projectile.destroyProjectile();
					},
					this.checkProjectilePlayerCollision,
					this
				)
			);

			// Cleanup projectile from array and colliders when destroyed
			projectile.on('projectile-destroyed', () => {
				colliders.forEach(c => c.destroy());
				const index = this.projectiles.indexOf(projectile);
				if (index > -1) {
					this.projectiles.splice(index, 1);
				}
			});

		// Listen for player death event to trigger respawn
		this.events.on('player-died', () => {
			this.player.respawn();
		});
	}

	/**
	 * Get all rectangle game objects in the scene to use as platforms.
	 * These are created by Phaser Editor's editorCreate method.
	 *
	 * @returns Array of rectangle game objects to enable physics on
	 */
	private getPlatforms(): Phaser.GameObjects.Rectangle[] {
		const allObjects = this.children.list;
		const platforms = allObjects.filter(obj =>
			obj instanceof Phaser.GameObjects.Rectangle
		) as Phaser.GameObjects.Rectangle[];
		return platforms;
	}

	/**
	 * Process callback for enemy-player collision.
	 * Only triggers player death if player is NOT hiding.
	 * When hiding (down arrow held), player is immune to enemy damage.
	 *
	 * @param player The player body or game object
	 * @param enemy The enemy body or game object
	 * @returns False to avoid physical collision
	 */
	private checkEnemyPlayerCollision(
		player: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
		enemy: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
	): boolean {
		// Only kill player if NOT hiding
		if (!this.player.isHiding()) {
			this.player.die();
		}
		// Return false to avoid physical collision (no pushing/bouncing)
		return false;
	}

	/**
	 * Process callback for projectile-player collision.
	 * Only triggers player death if player is NOT hiding.
	 * Projectile is destroyed in the collision callback.
	 *
	 * @param player The player body or game object
	 * @param projectile The projectile body or game object
	 * @returns False to avoid physical collision
	 */
	private checkProjectilePlayerCollision(
		player: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
		projectile: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
	): boolean {
		// Only kill player if NOT hiding
		if (!this.player.isHiding()) {
			this.player.die();
		}
		// Return false to avoid physical collision (no pushing/bouncing)
		return false;
	}

	/**
	 * Process callback for one-way platforms.
	 * Only allows collision when player is falling from above.
	 * Allows jumping through platforms from below (like Snow Bros, Bubble Bobble).
	 *
	 * @param player The player body or game object
	 * @param platform The platform body or game object
	 * @returns True to allow collision, false to pass through
	 */
	private oneWayPlatformCheck(
		player: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
		platform: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
	): boolean {
		const playerBody = 'body' in player ? player.body as Phaser.Physics.Arcade.Body : player as Phaser.Physics.Arcade.Body;
		const platformBody = 'body' in platform ? platform.body as Phaser.Physics.Arcade.StaticBody : platform as Phaser.Physics.Arcade.StaticBody;

		// Get the bottom of the player's collision box (previous frame position)
		const playerPrevBottom = playerBody.prev.y + playerBody.height;

		// Get the top of the platform
		const platformTop = platformBody.y;

		// Only collide if:
		// 1. Player is falling or stationary (velocity.y >= 0)
		// 2. Player's PREVIOUS bottom position was above the platform top
		// This allows jumping through from below while landing from above
		// A small tolerance (+5 pixels) is added to account for minor inaccuracies
		return playerBody.velocity.y >= 0 && playerPrevBottom <= platformTop + 5;
	}

	update() {
		// Track platform contact for jumping/falling states
		const body = this.player.body as Phaser.Physics.Arcade.Body;
		this.player.setOnPlatform(body.blocked.down || body.touching.down);
		// Update player state machine and animations
		this.player?.update();

		// Update patrol enemies
		this.patrolEnemies.forEach(enemy => {
			enemy.update();
		});

		// Update turret enemies
		this.turretEnemies.forEach(turret => {
			turret.update();
		});

		// Projectiles are velocity-based, no update needed
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
