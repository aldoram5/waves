import BaseEnemy from './BaseEnemy';

/**
 * Interface representing data for a swallowed enemy.
 * Stores minimal information needed to respawn the enemy later.
 */
interface SwallowedEnemyData {
    type: string; // 'patrol' or 'turret'
    x: number;
    y: number;
}

/**
 * Manages swallowed enemy data for the Player.
 * Tracks which enemies have been swallowed and stores their respawn information.
 * Used for player death respawn logic and spout attack mechanics.
 */
export default class SwallowManager {
    private swallowedEnemies: SwallowedEnemyData[] = [];

    /**
     * Add an enemy to the swallowed list.
     * Stores the enemy's type and original position for potential respawning.
     *
     * @param enemy The enemy to swallow
     */
    public addEnemy(enemy: BaseEnemy): void {
        // Determine enemy type based on texture
        const type = enemy.texture.key.includes('enemy2') ? 'turret' : 'patrol';

        // Store enemy data
        this.swallowedEnemies.push({
            type,
            x: enemy.x,
            y: enemy.y
        });
    }

    /**
     * Get the number of swallowed enemies.
     *
     * @returns Count of swallowed enemies
     */
    public getCount(): number {
        return this.swallowedEnemies.length;
    }

    /**
     * Release all swallowed enemies and return their data.
     * Used when player dies or when spout attack is fired.
     *
     * @returns Array of enemy data for respawning
     */
    public releaseAllEnemies(): SwallowedEnemyData[] {
        const enemies = [...this.swallowedEnemies];
        this.swallowedEnemies = [];
        return enemies;
    }

    /**
     * Clear all swallowed enemies without returning data.
     * Used when enemies are successfully spouted and defeated.
     */
    public clear(): void {
        this.swallowedEnemies = [];
    }
}
