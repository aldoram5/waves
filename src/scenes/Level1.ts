
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import Player from '../gameobjects/Player';
import PatrolEnemy from '../gameobjects/PatrolEnemy';
import TurretEnemy from '../gameobjects/TurretEnemy';
import EnemyProjectile from '../gameobjects/EnemyProjectile';
import WaveAttackProjectile from '../gameobjects/WaveAttackProjectile';
import SpoutProjectile from '../gameobjects/SpoutProjectile';
import { EnemyState } from '../gameobjects/EnemyStates';
/* END-USER-IMPORTS */

export default class Level1 extends Phaser.Scene {

	constructor() {
		super("Level1");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// ceiling
		const ceiling = this.add.rectangle(0, 0, 1280, 40);
		ceiling.setOrigin(0, 0);
		ceiling.isFilled = true;
		ceiling.fillColor = 0;
		ceiling.isStroked = true;
		ceiling.strokeColor = 2293248;
		ceiling.lineWidth = 5;

		// leftwall
		const leftwall = this.add.rectangle(0, 0, 40, 720);
		leftwall.setOrigin(0, 0);
		leftwall.isFilled = true;
		leftwall.fillColor = 0;
		leftwall.isStroked = true;
		leftwall.strokeColor = 2293248;
		leftwall.lineWidth = 5;

		// rightwall
		const rightwall = this.add.rectangle(1239, 0, 40, 720);
		rightwall.setOrigin(0, 0);
		rightwall.isFilled = true;
		rightwall.fillColor = 0;
		rightwall.isStroked = true;
		rightwall.strokeColor = 2293248;
		rightwall.lineWidth = 5;

		// platform1
		const platform1 = this.add.rectangle(43, 515, 890, 40);
		platform1.setOrigin(0, 0);
		platform1.isFilled = true;
		platform1.fillColor = 0;
		platform1.isStroked = true;
		platform1.strokeColor = 2293248;
		platform1.lineWidth = 5;

		// platform2
		const platform2 = this.add.rectangle(348, 355, 890, 40);
		platform2.setOrigin(0, 0);
		platform2.isFilled = true;
		platform2.fillColor = 0;
		platform2.isStroked = true;
		platform2.strokeColor = 2293248;
		platform2.lineWidth = 5;

		// platform3
		const platform3 = this.add.rectangle(43, 195, 890, 40);
		platform3.setOrigin(0, 0);
		platform3.isFilled = true;
		platform3.fillColor = 0;
		platform3.isStroked = true;
		platform3.strokeColor = 2293248;
		platform3.lineWidth = 5;

		// floor
		const floor = this.add.rectangle(0, 680, 1280, 40);
		floor.setOrigin(0, 0);
		floor.isFilled = true;
		floor.fillColor = 0;
		floor.isStroked = true;
		floor.strokeColor = 2293248;
		floor.lineWidth = 4;

		this.events.emit("scene-awake");
	}

	/* START-USER-CODE */

	private player!: Player;
	private patrolEnemies: PatrolEnemy[] = [];
	private turretEnemies: TurretEnemy[] = [];
	private projectiles: EnemyProjectile[] = [];
	private waveProjectiles: WaveAttackProjectile[] = [];
	private spoutProjectiles: SpoutProjectile[] = [];

	// Win condition tracking
	private totalEnemyCount: number = 4; // 2 patrol + 2 turret enemies
	private defeatedEnemyCount: number = 0;

	private turretFiredProjectileCallback: (projectile: EnemyProjectile) => void;
	private playerDiedCallback: () => void;

	create() {
		this.editorCreate();

		// Reset win condition tracking
		this.defeatedEnemyCount = 0;

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
		this.player = new Player(this, 200, 635);

		// Setup one-way platform collisions (can jump through from below)
		// Only the floor, ceiling, and walls should be solid from all directions
		const floor = platforms.find(p => p.y > 650); // Floor is at y=675
		const ceiling = platforms.find(p => p.y === 0); // Ceiling at top
		const walls = platforms.filter(p => p.width === 40); // Walls are narrow

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
		enemy1.on('destroy', () => {
			const index = this.patrolEnemies.indexOf(enemy1);
			if (index > -1) this.patrolEnemies.splice(index, 1);
			this.onEnemyDefeated();
		});

		// Enemy on platform2 (upper-right platform at y=458)
		const enemy2 = new PatrolEnemy(this, 700, 413, platforms);
		this.patrolEnemies.push(enemy2);
		enemy2.on('destroy', () => {
			const index = this.patrolEnemies.indexOf(enemy2);
			if (index > -1) this.patrolEnemies.splice(index, 1);
			this.onEnemyDefeated();
		});

		// Create turret enemies at strategic positions
		// Turret on middle-right platform
		const turret1 = new TurretEnemy(this, 900, 465, this.player);
		this.turretEnemies.push(turret1);
		turret1.on('destroy', () => {
			const index = this.turretEnemies.indexOf(turret1);
			if (index > -1) this.turretEnemies.splice(index, 1);
			this.onEnemyDefeated();
		});

		// Turret on platform1 (top most platform on the left)
		const turret2 = new TurretEnemy(this, 300, 145, this.player);
		this.turretEnemies.push(turret2);
		turret2.on('destroy', () => {
			const index = this.turretEnemies.indexOf(turret2);
			if (index > -1) this.turretEnemies.splice(index, 1);
			this.onEnemyDefeated();
		});

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

		this.turretFiredProjectileCallback = (projectile: EnemyProjectile) => {
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

			// Cleanup projectile from array when destroyed
			projectile.on('projectile-destroyed', () => {
				colliders.forEach(c => c.destroy());
				const index = this.projectiles.indexOf(projectile);
				if (index > -1) {
					this.projectiles.splice(index, 1);
				}
			});
		};

		// Listen for projectile firing events from turrets
		this.events.on('turret-fired-projectile', this.turretFiredProjectileCallback);

		// Listen for wave attack firing events from player
		this.events.on('player-fired-wave', (waveProjectile: WaveAttackProjectile) => {
			this.waveProjectiles.push(waveProjectile);

			// Setup collisions ONLY with walls (left and right walls)
			// Ignore floor, ceiling, and platforms - wave travels freely
			const platforms = this.getPlatforms();
			const walls = platforms.filter(p => p.width === 40); // Walls are narrow

			// Only collide with walls - wave is destroyed on contact
			walls.forEach(wall => {
				this.physics.add.collider(waveProjectile, wall, () => {
					waveProjectile.destroyProjectile();
				});
			});

			// Setup overlap with all enemies (stun on contact, single-target)
			this.patrolEnemies.forEach(enemy => {
				this.physics.add.overlap(waveProjectile, enemy, () => {
					enemy.stun();
					waveProjectile.destroyProjectile();
				});
			});

			this.turretEnemies.forEach(turret => {
				this.physics.add.overlap(waveProjectile, turret, () => {
					turret.stun();
					waveProjectile.destroyProjectile();
				});
			});

			// Cleanup when wave is destroyed
			waveProjectile.once('wave-destroyed', () => {
				const index = this.waveProjectiles.indexOf(waveProjectile);
				if (index > -1) {
					this.waveProjectiles.splice(index, 1);
				}
			});
		});

		// Listen for spout attack firing events from player
		this.events.on('player-fired-spout', (spoutProjectile: SpoutProjectile) => {
			this.spoutProjectiles.push(spoutProjectile);

			// Setup collisions with ALL platforms
			const platforms = this.getPlatforms();
			const floor = platforms.find(p => p.y > 650); // Floor is at y=675
			const ceiling = platforms.find(p => p.y === 0); // Ceiling at top
			const walls = platforms.filter(p => p.width === 40); // Walls are narrow
			const oneWayPlatforms = platforms.filter(p => p !== floor && p !== ceiling && !walls.includes(p));

			// Walls count toward bounce limit
			walls.forEach(wall => {
				this.physics.add.collider(spoutProjectile, wall, () => {
					spoutProjectile.onWallBounce(); // Count this bounce
				});
			});

			// Floor, ceiling, and platforms just bounce - don't count toward limit
			if (floor) {
				this.physics.add.collider(spoutProjectile, floor);
			}
			if (ceiling) {
				this.physics.add.collider(spoutProjectile, ceiling);
			}
			oneWayPlatforms.forEach(platform => {
				this.physics.add.collider(spoutProjectile, platform);
			});

			// Setup overlap with all enemies (defeat on contact, piercing attack)
			this.patrolEnemies.forEach((enemy, index) => {
				this.physics.add.overlap(spoutProjectile, enemy, () => {
					// Only trigger death if enemy is not already dying
					if (enemy.getState() !== EnemyState.DYING) {
						// Trigger death animation (scale-down over 0.5 seconds)
						enemy.die();

						// Enemy will be removed from array when it's destroyed
						// Keep in array so update() continues to run death animation
					}

					// Spout continues after hitting enemy (piercing)
				});
			});

			this.turretEnemies.forEach((turret, index) => {
				this.physics.add.overlap(spoutProjectile, turret, () => {
					// Only trigger death if enemy is not already dying
					if (turret.getState() !== EnemyState.DYING) {
						// Trigger death animation (scale-down over 0.5 seconds)
						turret.die();

						// Enemy will be removed from array when it's destroyed
						// Keep in array so update() continues to run death animation
					}

					// Spout continues after hitting enemy (piercing)
				});
			});

			// Cleanup when spout is destroyed
			spoutProjectile.once('spout-destroyed', () => {
				const index = this.spoutProjectiles.indexOf(spoutProjectile);
				if (index > -1) {
					this.spoutProjectiles.splice(index, 1);
				}
			});
		});

		// Listen for player inhaling to apply suction to stunned enemies
		this.events.on('player-inhaling', (playerX: number, playerY: number) => {
			// Check all patrol enemies
			this.patrolEnemies.forEach(enemy => {
				if (enemy.getState() === EnemyState.STUNNED) {
					const distance = Phaser.Math.Distance.Between(playerX, playerY, enemy.x, enemy.y);

					// Keep stunned during suction
					enemy.stun();

					if (distance < Player.INHALE_SUCTION_RADIUS) { // Suction radius
						// Apply velocity toward player (only X axis - let gravity handle Y)
						const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, playerX, playerY);
						const velocityX = Math.cos(angle) * Player.INHALE_SUCTION_POWER; // Suction power

						const body = enemy.body as Phaser.Physics.Arcade.Body;
						body.setVelocityX(velocityX);
						// Don't override velocityY - let gravity and platform collision handle vertical movement

						// Check if close enough to swallow (80 pixels)
						if (distance < Player.SWALLOW_DISTANCE_THRESHOLD) {
							this.player.swallowEnemy(enemy);

							// Remove from scene
							const index = this.patrolEnemies.indexOf(enemy);
							if (index > -1) {
								this.patrolEnemies.splice(index, 1);
							}
							enemy.destroy();
						}
					}
				}
			});

			// Check all turret enemies
			this.turretEnemies.forEach(turret => {
				if (turret.getState() === EnemyState.STUNNED) {
					const distance = Phaser.Math.Distance.Between(playerX, playerY, turret.x, turret.y);

					if (distance < Player.INHALE_SUCTION_RADIUS) { // Suction radius
						// Apply velocity toward player (only X axis - turrets have no gravity anyway)
						const angle = Phaser.Math.Angle.Between(turret.x, turret.y, playerX, playerY);
						const velocityX = Math.cos(angle) * Player.INHALE_SUCTION_POWER; // Suction power
						const velocityY = Math.sin(angle) * Player.INHALE_SUCTION_POWER; // Still need Y for turrets since they're immovable
						const body = turret.body as Phaser.Physics.Arcade.Body;
						body.setVelocity(velocityX, velocityY);

						// Check if close enough to swallow (80 pixels)
						if (distance < Player.SWALLOW_DISTANCE_THRESHOLD) {
							this.player.swallowEnemy(turret);

							// Remove from scene
							const index = this.turretEnemies.indexOf(turret);
							if (index > -1) {
								this.turretEnemies.splice(index, 1);
							}
							turret.destroy();
						}
					}
				}
			});
		});

		this.playerDiedCallback = () => {
			// Get swallowed enemies before respawn clears them
			const swallowedEnemies = this.player.getSwallowManager().releaseAllEnemies();

			// Respawn each swallowed enemy at original position
			swallowedEnemies.forEach(enemyData => {
				if (enemyData.type === 'patrol') {
					// Recreate patrol enemy
					const enemy = new PatrolEnemy(this, enemyData.x, enemyData.y, this.getPlatforms());
					this.patrolEnemies.push(enemy);

					// Add destroy listener to remove from array
					enemy.on('destroy', () => {
						const index = this.patrolEnemies.indexOf(enemy);
						if (index > -1) this.patrolEnemies.splice(index, 1);
					});

					// Setup collisions
					const platforms = this.getPlatforms();
					const floor = platforms.find(p => p.y > 650);
					const ceiling = platforms.find(p => p.y === 0);
					const walls = platforms.filter(p => p.scaleX < 1);
					const oneWayPlatforms = platforms.filter(p => p !== floor && p !== ceiling && !walls.includes(p));

					if (floor) this.physics.add.collider(enemy, floor);
					if (ceiling) this.physics.add.collider(enemy, ceiling);
					walls.forEach(wall => this.physics.add.collider(enemy, wall));
					oneWayPlatforms.forEach(platform => {
						this.physics.add.collider(enemy, platform, undefined, this.oneWayPlatformCheck, this);
					});
					this.physics.add.overlap(this.player, enemy, undefined, this.checkEnemyPlayerCollision, this);
				} else {
					// Recreate turret enemy
					const turret = new TurretEnemy(this, enemyData.x, enemyData.y, this.player);
					this.turretEnemies.push(turret);

					// Add destroy listener to remove from array
					turret.on('destroy', () => {
						const index = this.turretEnemies.indexOf(turret);
						if (index > -1) this.turretEnemies.splice(index, 1);
					});

					// Setup collision
					this.physics.add.overlap(this.player, turret, undefined, this.checkEnemyPlayerCollision, this);
				}
			});

			// Now respawn the player
			this.player.respawn();
		}
		// Listen for player death event to trigger respawn
		this.events.on('player-died', this.playerDiedCallback);
		// Listen for the scene shutdown event to perform cleanup
		this.events.once('shutdown', this.cleanup, this);
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
		// Get the actual enemy object
		const enemyObj = (enemy as Phaser.Types.Physics.Arcade.GameObjectWithBody).body.gameObject as PatrolEnemy | TurretEnemy;

		// Only kill player if NOT hiding AND enemy is NOT stunned
		if (!this.player.isHiding() && enemyObj.getState() !== EnemyState.STUNNED) {
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

		// Update wave projectiles
		this.waveProjectiles.forEach(wave => {
			wave.update();
		});

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

	cleanup(): void {
		// Cleanup turret projectile event listener
		this.events.off('turret-fired-projectile', this.turretFiredProjectileCallback);
		this.events.off('player-died', this.playerDiedCallback);

		// Destroy all enemies to clean up their event listeners
		this.patrolEnemies.forEach(enemy => {
			if (enemy && enemy.scene) {
				enemy.destroy();
			}
		});
		this.turretEnemies.forEach(turret => {
			if (turret && turret.scene) {
				turret.destroy();
			}
		});

		// Clear arrays
		this.patrolEnemies = [];
		this.turretEnemies = [];
		this.projectiles = [];
		this.waveProjectiles = [];
		this.spoutProjectiles = [];
	}

	/**
	 * Called when an enemy is defeated (destroyed).
	 * Increments defeat counter and checks for win condition.
	 */
	private onEnemyDefeated(): void {
		this.defeatedEnemyCount++;

		// Check win condition
		if (this.defeatedEnemyCount >= this.totalEnemyCount) {
			this.triggerWinCondition();
		}
	}

	/**
	 * Triggers the win condition when all enemies are defeated.
	 * Pauses physics and launches the WinPopup scene.
	 */
	private triggerWinCondition(): void {
		// Pause physics to freeze the game
		this.physics.pause();

		// Launch WinPopup scene as an overlay
		this.scene.launch('WinPopup');
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
