// Game state and constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const PLAYER_SPEED = 5;
const ENEMY_SPEED = 2;
const MAX_ENEMIES = 5;
const EXP_TO_LEVEL_UP = 100;
const GAME_REPO_URL = "https://techs-targe.github.io/simple-rpg-game/game.html";

// Enemy types
const ENEMY_TYPES = {
    BLUE: {
        color: 'blue',
        hpMultiplier: 3.0,      // ~60 HP (3 hits @ 20 damage)
        attackMultiplier: 0.5,  // Weak attack
        expMultiplier: 0.7,     // Less experience
        speedMultiplier: 1.2,   // Fast
        spawnChance: 0.5,       // 50% chance (common)
        knockbackResistance: 0.0, // No resistance
        knockbackMultiplier: 1.5,  // Gets knocked back more than normal
        playerKnockbackStrength: 0.5, // Weak knockback to player
        minLevel: 1            // Available from level 1
    },
    RED: {
        color: 'red',
        hpMultiplier: 10.0,     // ~200 HP (10 hits @ 20 damage)
        attackMultiplier: 1.0,  // Medium attack
        expMultiplier: 1.0,     // Normal experience
        speedMultiplier: 1.0,   // Normal speed
        spawnChance: 0.35,      // 35% chance
        knockbackResistance: 0.3, // 30% resistance to knockback
        knockbackMultiplier: 1.0,  // Normal knockback
        playerKnockbackStrength: 1.0, // Medium knockback to player
        minLevel: 3            // Available from level 3
    },
    BLACK: {
        color: 'black',
        hpMultiplier: 30.0,     // ~600 HP (30 hits @ 20 damage)
        attackMultiplier: 1.8,  // Strong attack
        expMultiplier: 2.5,     // More experience
        speedMultiplier: 0.7,   // Slower
        spawnChance: 0.15,      // 15% chance (rare)
        knockbackResistance: 0.8, // 80% resistance to knockback
        knockbackMultiplier: 0.2,  // Barely moves when hit
        playerKnockbackStrength: 2.0, // Strong knockback to player
        minLevel: 7            // Available from level 7
    },
    WHITE: {
        color: 'white',
        hpMultiplier: 60.0,     // ~1200 HP (60 hits @ 20 damage)
        attackMultiplier: 3.0,  // Very strong attack
        expMultiplier: 5.0,     // Massive experience
        speedMultiplier: 0.8,   // Moderately slow
        spawnChance: 0.05,      // 5% chance (very rare)
        knockbackResistance: 0.95, // Almost immune to knockback
        knockbackMultiplier: 0.1,  // Barely moves when hit
        playerKnockbackStrength: 3.0, // Very strong knockback to player
        minLevel: 15           // Available from level 15
    }
};

// Player data
const player = {
    x: GAME_WIDTH / 2 - 20,
    y: GAME_HEIGHT / 2 - 20,
    width: 40,
    height: 40,
    hp: 100,
    maxHp: 100,
    attack: 20,
    level: 1,
    exp: 0,
    isAttacking: false,
    healCooldown: 0,
    healCooldownBase: 10, // Base cooldown time in seconds
    healAmountMultiplier: 1.0, // Multiplier for heal amount
    healEffects: [], // Array of ongoing heal effects { amount, remaining, total }
    invincibilityDuration: 1500, // 1.5 seconds of invincibility per enemy after taking damage
    invincibleToEnemies: {}, // Dictionary to track which enemies player is invincible to
    swordAngle: 0, // Current angle of the sword in degrees
    swordLength: 30, // Length of the sword in pixels
    swordHitbox: { width: 30, height: 5 }, // Sword dimensions
    direction: 'right', // Current facing direction: 'up', 'right', 'down', 'left'
    lastMoveDirection: 'right', // Track the last direction the player moved
    attackDirection: 'right', // Direction player was facing when attack started
    isKnockedBack: false, // Is player currently being knocked back
    knockbackDuration: 300, // Duration of knockback in milliseconds
    knockbackResistance: 0.2, // Player has some resistance to knockback
    knockbackStrengthMultiplier: 1.0, // Player's knockback strength against enemies
    combo: 0, // Current combo count
    maxCombo: 0, // Highest combo reached
    comboTimeout: null, // Timeout for resetting combo
    isMoving: false, // Is player currently moving
    prevX: 0, // Previous X position to track movement
    prevY: 0, // Previous Y position to track movement
    dashAttackMultiplier: 2.0, // Damage multiplier when attacking while moving
    swordTipMultiplier: 2.0, // Damage multiplier when hitting with sword tip
    movingDefenseMultiplier: 2.0, // Damage multiplier when taking damage while moving
    gems: 0, // Number of available gems for bonuses
    choosingBonus: false // Whether player is currently choosing a level-up bonus
};

// Enemies array
let enemies = [];

// Game state
let gameActive = true;
let keysPressed = {};
let lastEnemySpawn = 0;
let enemyIdCounter = 0; // Counter to generate unique enemy IDs
let cheatClickCount = 0; // Counter for cheat mode activation

// Currently active animation timer IDs
let activeAnimationTimers = [];

// DOM Elements
const gameScreen = document.getElementById('game-screen');
const playerElement = document.getElementById('player');
const swordElement = document.getElementById('sword');
const playerHpElement = document.getElementById('player-hp');
const playerLevelElement = document.getElementById('player-level');
const playerExpElement = document.getElementById('player-exp');
const attackBtn = document.getElementById('attack-btn');
const healBtn = document.getElementById('heal-btn');
const restartBtn = document.getElementById('restart-btn');
const gemsContainer = document.getElementById('gems-container');
const levelBonusContainer = document.getElementById('level-bonus');
const bonusHpBtn = document.getElementById('bonus-hp');
const bonusHealBtn = document.getElementById('bonus-heal');
const bonusAttackBtn = document.getElementById('bonus-attack');
const bonusKnockbackBtn = document.getElementById('bonus-knockback');

// Simple game loop ID
let gameLoopId = null;

// Initialize game - completely simplified
function initGame() {
    // Stop existing loop
    if (gameLoopId !== null) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    
    // Set game to active state
    gameActive = true;
    
    // Set player position before initialization
    player.x = GAME_WIDTH / 2 - 20;
    player.y = GAME_HEIGHT / 2 - 20;
    
    // Initialize player position (with rounded rendering)
    updatePlayerPosition();
    
    // Clear enemies
    enemies.forEach(enemy => {
        if (enemy.element) {
            enemy.element.remove();
        }
    });
    enemies = [];
    
    // Remove game over elements if they exist
    const gameOverText = gameScreen.querySelector('.game-over-text');
    if (gameOverText) {
        gameOverText.remove();
    }
    
    // Remove share container if it exists
    const shareContainer = gameScreen.querySelector('.share-container');
    if (shareContainer) {
        shareContainer.remove();
    }
    
    // Completely reset player to initial values
    // Reset position to center
    player.x = GAME_WIDTH / 2 - 20;
    player.y = GAME_HEIGHT / 2 - 20;
    player.width = 40;
    player.height = 40;
    
    // Reset stats
    player.hp = 100;
    player.maxHp = 100;
    player.exp = 0;
    player.level = 1;
    player.attack = 20;
    
    // Reset parameters
    player.healCooldownBase = 10;
    player.healAmountMultiplier = 1.0;
    player.knockbackResistance = 0.2;
    player.knockbackStrengthMultiplier = 1.0;
    player.dashAttackMultiplier = 2.0;
    player.swordTipMultiplier = 2.0;
    player.movingDefenseMultiplier = 2.0;
    
    // Reset state
    player.invincibleToEnemies = {};
    player.isKnockedBack = false;
    player.isAttacking = false;
    player.direction = 'right';
    player.lastMoveDirection = 'right';
    player.attackDirection = 'right';
    player.healCooldown = 0;
    player.healEffects = []; // Clear all heal over time effects
    player.isMoving = false;
    
    // Reset movement tracking
    player.prevX = player.x;
    player.prevY = player.y;
    
    // Reset items and combo
    player.gems = 3; // Start with 3 gems
    player.choosingBonus = false;
    player.combo = 0;
    player.maxCombo = 0;
    if (player.comboTimeout) {
        clearTimeout(player.comboTimeout);
        player.comboTimeout = null;
    }
    // Only reset opacity; leave transform handling to updatePlayerPosition
    playerElement.style.opacity = '1';
    
    // Reset key states (fixes speed issues on restart)
    // Overwrite with a completely empty object
    keysPressed = Object.create(null);
    // Explicitly release all keys
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowDown' }));
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));
    document.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
    
    // Reset cheat mode counter
    cheatClickCount = 0;
    
    // Reset enemy spawn timers
    lastEnemySpawn = 0;
    enemyIdCounter = 0;
    
    // Clear all active animation timers
    activeAnimationTimers.forEach(timerId => {
        clearTimeout(timerId);
    });
    activeAnimationTimers = [];
    
    // Clear gems container
    gemsContainer.innerHTML = '';
    
    // Add 3 gems as initial gems (create elements directly without using the dedicated function)
    for (let i = 0; i < 3; i++) {
        const gem = document.createElement('div');
        gem.className = 'gem';
        gemsContainer.appendChild(gem);
    }
    
    // Set bonus selection to disabled state
    hideBonusSelection();
    
    // Update heal button text based on multiplier
    if (player.healAmountMultiplier > 1.0) {
        healBtn.textContent = `Heal (x${player.healAmountMultiplier.toFixed(1)})`;
    } else {
        healBtn.textContent = 'Heal';
    }
    
    updateStatusBar();
    
    // Update position once more to ensure proper display
    updatePlayerPosition();
    
    // Start a new game loop
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Update player position on screen
function updatePlayerPosition() {
    // Round position to integers to prevent shaking caused by decimal point discrepancies
    const roundedX = Math.round(player.x);
    const roundedY = Math.round(player.y);
    
    // Set current position to CSS variables (can be used independently from transform)
    playerElement.style.setProperty('--player-x', `${roundedX}px`);
    playerElement.style.setProperty('--player-y', `${roundedY}px`);
    
    // Traditional position setting - this method may cause trembling/shaking, so it's not recommended
    playerElement.style.left = `${roundedX}px`;
    playerElement.style.top = `${roundedY}px`;
    
    // Update player's facing direction class
    playerElement.classList.remove('facing-right', 'facing-left', 'facing-up', 'facing-down');
    playerElement.classList.add(`facing-${player.direction}`);
}

// Update status bar
function updateStatusBar() {
    // Round HP to integer for display
    playerHpElement.textContent = Math.floor(player.hp);
    playerLevelElement.textContent = player.level;
    playerExpElement.textContent = player.exp;
    
    // Update player health bar
    const healthPercent = Math.max(0, player.hp / player.maxHp * 100);
    const playerHealthBar = playerElement.querySelector('.player-health-bar');
    if (playerHealthBar) {
        playerHealthBar.style.width = `${healthPercent}%`;
        
        // Change health bar color based on remaining health
        if (healthPercent < 30) {
            playerHealthBar.style.backgroundColor = '#c0392b'; // Dark red
            playerHealthBar.classList.add('player-health-low'); // Add pulsing animation for low health
        } else if (healthPercent < 60) {
            playerHealthBar.style.backgroundColor = '#e67e22'; // Orange
            playerHealthBar.classList.remove('player-health-low'); // Remove pulsing animation
        } else {
            playerHealthBar.style.backgroundColor = '#e74c3c'; // Regular red
            playerHealthBar.classList.remove('player-health-low'); // Remove pulsing animation
        }
    }
    
    // Update player status to show invincibility
    playerElement.classList.toggle('invincible', player.isInvincible);
}

// Show damage text above an entity
function showDamageText(x, y, damage, isCritical = false) {
    const damageText = document.createElement('div');
    damageText.className = 'damage-text';
    if (isCritical) {
        damageText.classList.add('critical-damage');
    }
    damageText.textContent = damage;
    damageText.style.left = `${x}px`;
    damageText.style.top = `${y - 20}px`;
    gameScreen.appendChild(damageText);
    
    // Remove the element after animation completes
    const timerId = setTimeout(() => {
        damageText.remove();
        // Remove this timer ID from the array
        const index = activeAnimationTimers.indexOf(timerId);
        if (index > -1) {
            activeAnimationTimers.splice(index, 1);
        }
    }, 1000);
    
    // Track the timer ID
    activeAnimationTimers.push(timerId);
}

// Move player based on key presses
function movePlayer() {
    // If player is being knocked back, don't allow manual movement
    if (player.isKnockedBack) {
        return;
    }
    
    // Store previous position to detect movement
    player.prevX = player.x;
    player.prevY = player.y;
    
    if (keysPressed['ArrowUp'] && player.y > 0) {
        player.y -= PLAYER_SPEED;
        player.lastMoveDirection = 'up';
    }
    if (keysPressed['ArrowDown'] && player.y < GAME_HEIGHT - player.height) {
        player.y += PLAYER_SPEED;
        player.lastMoveDirection = 'down';
    }
    if (keysPressed['ArrowLeft'] && player.x > 0) {
        player.x -= PLAYER_SPEED;
        player.lastMoveDirection = 'left';
    }
    if (keysPressed['ArrowRight'] && player.x < GAME_WIDTH - player.width) {
        player.x += PLAYER_SPEED;
        player.lastMoveDirection = 'right';
    }
    
    // Set the current direction to the last moved direction and check if moving
    if (player.x !== player.prevX || player.y !== player.prevY) {
        player.direction = player.lastMoveDirection;
        player.isMoving = true;
        
        // Add a visual class for moving player
        playerElement.classList.add('moving');
    } else {
        player.isMoving = false;
        playerElement.classList.remove('moving');
    }
    
    updatePlayerPosition();
}

// Create a new enemy
function spawnEnemy() {
    if (enemies.length >= MAX_ENEMIES) return;
    
    const now = Date.now();
    if (now - lastEnemySpawn < 2000) return; // Spawn every 2 seconds max
    
    lastEnemySpawn = now;
    
    // Filter enemy types available at player's current level
    const availableTypes = [];
    let totalSpawnChance = 0;
    
    // Add enemy types to the available pool based on player level
    Object.values(ENEMY_TYPES).forEach(type => {
        if (player.level >= type.minLevel) {
            availableTypes.push(type);
            totalSpawnChance += type.spawnChance;
        }
    });
    
    // Select random enemy type from available ones
    const randomValue = Math.random() * totalSpawnChance;
    let cumulativeChance = 0;
    let enemyType = ENEMY_TYPES.BLUE; // Default fallback
    
    for (const type of availableTypes) {
        cumulativeChance += type.spawnChance;
        if (randomValue <= cumulativeChance) {
            enemyType = type;
            break;
        }
    }
    
    // Base stats for calculation
    const baseHp = 30 + (player.level * 5);
    const baseAttack = 5 + (player.level * 2);
    const baseExp = 20 + (player.level * 5);
    
    // Find a position that doesn't overlap with existing enemies
    let x, y;
    let attempts = 0;
    const maxAttempts = 20; // Maximum attempts to find a non-overlapping position
    const enemySize = 30;
    let validPosition = false;
    
    // Keep trying positions until we find a valid one or run out of attempts
    while (!validPosition && attempts < maxAttempts) {
        attempts++;
        
        // Generate a random position
        x = Math.random() * (GAME_WIDTH - enemySize);
        y = Math.random() * (GAME_HEIGHT - enemySize);
        
        // Also avoid spawning too close to the player
        const playerDistance = Math.sqrt(
            Math.pow(x - player.x, 2) + 
            Math.pow(y - player.y, 2)
        );
        
        // Don't spawn too close to player (minimum 150px away)
        if (playerDistance < 150) {
            continue;
        }
        
        // Check if this position overlaps with any existing enemy
        validPosition = true;
        for (const existingEnemy of enemies) {
            if (
                x < existingEnemy.x + existingEnemy.width &&
                x + enemySize > existingEnemy.x &&
                y < existingEnemy.y + existingEnemy.height &&
                y + enemySize > existingEnemy.y
            ) {
                validPosition = false;
                break;
            }
        }
    }
    
    // If we couldn't find a valid position after max attempts, just use the last generated position
    
    // Create enemy data with type-specific attributes
    const enemy = {
        id: 'enemy_' + (++enemyIdCounter), // Assign a unique ID to each enemy
        x: x,
        y: y,
        width: enemySize,
        height: enemySize,
        hp: Math.floor(baseHp * enemyType.hpMultiplier),
        attack: Math.floor(baseAttack * enemyType.attackMultiplier),
        exp: Math.floor(baseExp * enemyType.expMultiplier),
        speed: ENEMY_SPEED * enemyType.speedMultiplier,
        type: enemyType,
        isKnockedBack: false,
        isHit: false, // Flag to track if enemy was already hit in this attack frame
        knockbackDuration: 300, // Duration of knockback in milliseconds
        knockbackDistance: 60 * enemyType.knockbackMultiplier, // Base distance adjusted by enemy type
        knockbackResistance: enemyType.knockbackResistance // Resistance to knockback (0-1)
    };
    
    // Create enemy element
    const enemyElement = document.createElement('div');
    enemyElement.className = 'enemy';
    enemyElement.style.left = enemy.x + 'px';
    enemyElement.style.top = enemy.y + 'px';
    enemyElement.style.backgroundColor = enemyType.color;
    enemyElement.dataset.enemyType = enemyType.color;
    
    // Add health indicator (visible for all types)
    const healthBar = document.createElement('div');
    healthBar.className = 'enemy-health';
    healthBar.style.width = '100%';
    enemyElement.appendChild(healthBar);
    
    gameScreen.appendChild(enemyElement);
    
    enemy.element = enemyElement;
    enemies.push(enemy);
}

// Move enemies toward player and handle enemy collision avoidance
function moveEnemies() {
    // First pass: Calculate new positions based on player tracking
    const newPositions = [];
    
    enemies.forEach(enemy => {
        // Only calculate new position if not being knocked back
        if (!enemy.isKnockedBack) {
            let newX = enemy.x;
            let newY = enemy.y;
            
            // Simple AI to move toward player
            if (enemy.x < player.x) newX += enemy.speed;
            if (enemy.x > player.x) newX -= enemy.speed;
            if (enemy.y < player.y) newY += enemy.speed;
            if (enemy.y > player.y) newY -= enemy.speed;
            
            // Keep within game bounds
            newX = Math.max(0, Math.min(GAME_WIDTH - enemy.width, newX));
            newY = Math.max(0, Math.min(GAME_HEIGHT - enemy.height, newY));
            
            newPositions.push({ enemy, newX, newY });
        } else {
            // Knocked back enemies don't move in this phase
            newPositions.push({ enemy, newX: enemy.x, newY: enemy.y });
        }
    });
    
    // Second pass: Resolve collisions
    for (let i = 0; i < newPositions.length; i++) {
        const pos1 = newPositions[i];
        
        // Skip knocked back enemies for collision avoidance
        if (pos1.enemy.isKnockedBack) continue;
        
        let collisionX = 0;
        let collisionY = 0;
        let collisionCount = 0;
        
        // Check collisions with other enemies
        for (let j = 0; j < newPositions.length; j++) {
            if (i === j) continue; // Skip self
            
            const pos2 = newPositions[j];
            
            // Check if these two enemies would overlap
            const wouldOverlap = 
                pos1.newX < pos2.newX + pos2.enemy.width &&
                pos1.newX + pos1.enemy.width > pos2.newX &&
                pos1.newY < pos2.newY + pos2.enemy.height &&
                pos1.newY + pos1.enemy.height > pos2.newY;
            
            if (wouldOverlap) {
                // Calculate overlap amount and direction
                const centerX1 = pos1.newX + (pos1.enemy.width / 2);
                const centerY1 = pos1.newY + (pos1.enemy.height / 2);
                const centerX2 = pos2.newX + (pos2.enemy.width / 2);
                const centerY2 = pos2.newY + (pos2.enemy.height / 2);
                
                // Direction to move away from the other enemy
                const dirX = centerX1 - centerX2;
                const dirY = centerY1 - centerY2;
                
                // Normalize and add to total collision response
                const length = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
                collisionX += dirX / length;
                collisionY += dirY / length;
                collisionCount++;
            }
        }
        
        // Apply collision avoidance if needed
        if (collisionCount > 0) {
            const avoidanceStrength = pos1.enemy.speed * 1.5; // Slightly stronger than normal movement
            
            // Apply movement in the average direction away from collisions
            pos1.newX += (collisionX / collisionCount) * avoidanceStrength;
            pos1.newY += (collisionY / collisionCount) * avoidanceStrength;
            
            // Keep within game bounds
            pos1.newX = Math.max(0, Math.min(GAME_WIDTH - pos1.enemy.width, pos1.newX));
            pos1.newY = Math.max(0, Math.min(GAME_HEIGHT - pos1.enemy.height, pos1.newY));
        }
    }
    
    // Apply the new positions and update the DOM
    newPositions.forEach(pos => {
        pos.enemy.x = pos.newX;
        pos.enemy.y = pos.newY;
        
        // Update enemy position in DOM
        pos.enemy.element.style.left = pos.enemy.x + 'px';
        pos.enemy.element.style.top = pos.enemy.y + 'px';
    });
}

// Calculate sword hitbox position based on player position and attack direction
function getSwordHitbox() {
    // Center of the player (pivot point for the sword)
    const pivotX = player.x + player.width / 2;
    const pivotY = player.y + player.height / 2;
    
    // Determine the direction of the sword based on the attack direction
    let swordTipX, swordTipY;
    
    // Use the locked attack direction, not the current direction
    switch(player.attackDirection) {
        case 'right':
            swordTipX = pivotX + player.swordLength;
            swordTipY = pivotY;
            break;
        case 'left':
            swordTipX = pivotX - player.swordLength;
            swordTipY = pivotY;
            break;
        case 'up':
            swordTipX = pivotX;
            swordTipY = pivotY - player.swordLength;
            break;
        case 'down':
            swordTipX = pivotX;
            swordTipY = pivotY + player.swordLength;
            break;
    }
    
    // Add a thickness to the sword hitbox for better collision detection
    const swordThickness = 10;
    
    // Create a consistent hitbox size regardless of direction
    let hitboxX, hitboxY, hitboxWidth, hitboxHeight;
    
    if (player.attackDirection === 'right' || player.attackDirection === 'left') {
        // Horizontal sword
        hitboxX = Math.min(pivotX, swordTipX);
        hitboxY = pivotY - swordThickness/2;
        hitboxWidth = Math.abs(swordTipX - pivotX);
        hitboxHeight = swordThickness;
    } else {
        // Vertical sword
        hitboxX = pivotX - swordThickness/2;
        hitboxY = Math.min(pivotY, swordTipY);
        hitboxWidth = swordThickness;
        hitboxHeight = Math.abs(swordTipY - pivotY);
    }
    
    // Return a rectangle that represents the sword's hitbox
    return {
        x: hitboxX,
        y: hitboxY,
        width: hitboxWidth,
        height: hitboxHeight
    };
}

// Check for collisions between player and enemies
function checkCollisions() {
    enemies.forEach((enemy, index) => {
        // Check for player body collision with enemy
        const playerBodyCollision = 
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y;
        
        // Check for sword collision with enemy when attacking
        let swordCollision = false;
        if (player.isAttacking) {
            const swordHitbox = getSwordHitbox();
            swordCollision = 
                swordHitbox.x < enemy.x + enemy.width &&
                swordHitbox.x + swordHitbox.width > enemy.x &&
                swordHitbox.y < enemy.y + enemy.height &&
                swordHitbox.y + swordHitbox.height > enemy.y;
        }
        
        // Handle player attack (only sword collision applies damage)
        if (swordCollision && !enemy.isHit) {
            // Mark this enemy as already hit in this frame
            enemy.isHit = true;
            
            // Calculate damage multipliers
            let damageMultiplier = 1.0;
            let damageType = "";
            
            // Check if player was moving during attack (dash attack)
            const wasMovingDuringAttack = 
                Math.abs(player.x - player.prevX) > 0.5 || 
                Math.abs(player.y - player.prevY) > 0.5;
                
            if (wasMovingDuringAttack) {
                damageMultiplier *= player.dashAttackMultiplier;
                damageType += "DASH ATTACK! ";
            }
            
            // Check for sword tip hit (timing-based)
            // We check the angle to determine if it's at the end of the swing
            // This is during the 'swing forward' part of the animation
            const isSwordTipHit = 
                player.swordAngle > 30 && 
                player.swordAngle < 70;
                
            if (isSwordTipHit) {
                damageMultiplier *= player.swordTipMultiplier;
                damageType += "SWORD TIP HIT! ";
            }
            
            // Calculate final damage
            const damage = Math.floor(player.attack * damageMultiplier);
            
            // Player is attacking and sword hit the enemy
            const originalHp = enemy.hp;
            enemy.hp -= damage;
            
            // Show damage text above enemy
            const enemyCenterX = enemy.x + enemy.width / 2;
            const enemyCenterY = enemy.y;
            showDamageText(enemyCenterX, enemyCenterY, damage, damageMultiplier > 1);
            
            // Determine knockback strength based on movement
            const knockbackMultiplier = wasMovingDuringAttack ? 2.0 : 1.0;
            
            // Apply knockback based on attack direction, not current direction
            applyKnockback(enemy, player.attackDirection, knockbackMultiplier);
            
            // Message with damage type if any multipliers were applied
            if (damageMultiplier > 1) {
                enemy.element.classList.add('critical-hit');
                setTimeout(() => {
                    enemy.element.classList.remove('critical-hit');
                }, 300);
            }
                
                // Update health bar
                const healthPercent = Math.max(0, enemy.hp / originalHp * 100);
                const healthBar = enemy.element.querySelector('.enemy-health');
                if (healthBar) {
                    healthBar.style.width = `${healthPercent}%`;
                    
                    // Change health bar color based on remaining health
                    if (healthPercent < 30) {
                        healthBar.style.backgroundColor = 'red';
                    } else if (healthPercent < 60) {
                        healthBar.style.backgroundColor = 'orange';
                    }
                }
                
                if (enemy.hp <= 0) {
                    // Enemy defeated
                    
                    // Increase combo counter
                    increaseCombo();
                    
                    // Apply combo multiplier to experience
                    const comboMultiplier = getComboExpMultiplier();
                    
                    // Increase experience for critical hits
                    let critExpMultiplier = 1.0;
                    if (damageMultiplier > 1) {
                        // Increase experience bonus based on damage multiplier (maximum 4x)
                        critExpMultiplier = Math.min(4.0, damageMultiplier);
                        showDamageText(enemyCenterX, enemyCenterY - 50, `CRITICAL! EXP x${critExpMultiplier.toFixed(1)}`, true);
                    }
                    
                    const baseExp = enemy.exp;
                    // Apply both combo and critical multipliers
                    const totalExp = Math.floor(baseExp * comboMultiplier * critExpMultiplier);
                    
                    // Show EXP gained with multiplier indicator
                    let expText = `+${totalExp} EXP`;
                    
                    // Include both multipliers in the display
                    if (comboMultiplier > 1 || critExpMultiplier > 1) {
                        expText += ` (`;
                        if (comboMultiplier > 1) expText += `Combo x${comboMultiplier.toFixed(1)}`;
                        if (comboMultiplier > 1 && critExpMultiplier > 1) expText += `, `;
                        if (critExpMultiplier > 1) expText += `Crit x${critExpMultiplier.toFixed(1)}`;
                        expText += `)`;
                        showDamageText(enemyCenterX, enemyCenterY - 25, expText, true);
                    } else {
                        showDamageText(enemyCenterX, enemyCenterY - 25, expText, false);
                    }
                    
                    player.exp += totalExp;
                    enemy.element.remove();
                    enemies.splice(index, 1);
                    
                    // Check for level up
                    if (player.exp >= EXP_TO_LEVEL_UP * player.level) {
                        levelUp();
                    }
                } else {
                    // Enemy hit
                    if (damageMultiplier > 1) {
                        const knockbackInfo = wasMovingDuringAttack ? "KNOCK! " : "";
                        showDamageText(enemyCenterX, enemyCenterY - 40, `${knockbackInfo}CRIT!`, true);
                    } else if (wasMovingDuringAttack) {
                        showDamageText(enemyCenterX, enemyCenterY - 40, "KNOCK!", false);
                    }
                    
                    // Visual feedback
                    enemy.element.style.backgroundColor = 'orange';
                    setTimeout(() => {
                        if (enemy.element) {
                            enemy.element.style.backgroundColor = enemy.type.color;
                        }
                    }, 200);
                }
        }
        
        // Handle player taking damage (separate condition from attack)
        // Check if player is invincible to this specific enemy
        const isInvincibleToThisEnemy = player.invincibleToEnemies[enemy.id];
        
        if (!isInvincibleToThisEnemy && !player.isKnockedBack && playerBodyCollision) {
            // Calculate damage based on movement
            let damageMultiplier = 1.0;
            let damage = enemy.attack;
            
            // Check if player is moving (takes more damage)
            if (player.isMoving) {
                damageMultiplier = player.movingDefenseMultiplier;
                damage = Math.floor(enemy.attack * damageMultiplier);
            }
            
            // Apply damage
            player.hp -= damage;
            
            // Show damage text above player
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y;
            showDamageText(playerCenterX, playerCenterY, `-${damage}`, damageMultiplier > 1);
            
            // Break combo when taking damage
            breakCombo();
            
            // Visual feedback
            playerElement.style.backgroundColor = 'lightblue';
            setTimeout(() => {
                playerElement.style.backgroundColor = 'blue';
            }, 200);
            
            // Apply knockback to player based on enemy type and position
            // Calculate direction from enemy to player
            let knockbackDirection;
            if (Math.abs(enemy.x - player.x) > Math.abs(enemy.y - player.y)) {
                // Horizontal collision is more significant
                knockbackDirection = enemy.x < player.x ? 'left' : 'right';
            } else {
                // Vertical collision is more significant
                knockbackDirection = enemy.y < player.y ? 'up' : 'down';
            }
            applyPlayerKnockback(knockbackDirection, enemy.type.playerKnockbackStrength);
            
            // Make player invincible to this specific enemy
            player.invincibleToEnemies[enemy.id] = true;
            
            // Visual invincibility effect - only show if this is the first enemy making player invincible
            const anyInvincible = Object.keys(player.invincibleToEnemies).length === 1;
            if (anyInvincible) {
                // Add invincible class for visual effect
                playerElement.classList.add('invincible');
                
                // Flashing effect during invincibility
                let flashCount = 0;
                const flashInterval = setInterval(() => {
                    flashCount++;
                    playerElement.style.opacity = flashCount % 2 === 0 ? '1' : '0.3';
                    
                    // Stop flashing when no more invincibility
                    if (flashCount >= 10 || Object.keys(player.invincibleToEnemies).length === 0) {
                        clearInterval(flashInterval);
                    }
                }, player.invincibilityDuration / 10);
            }
            
            // Remove invincibility from this enemy after duration
            setTimeout(() => {
                delete player.invincibleToEnemies[enemy.id];
                
                // If no more invincibility to any enemies, reset appearance
                if (Object.keys(player.invincibleToEnemies).length === 0) {
                    playerElement.classList.remove('invincible');
                    playerElement.style.opacity = '1';
                }
            }, player.invincibilityDuration);
            
            if (player.hp <= 0) {
                gameOver();
            }
        }
        
    });
    
    // Update status display whenever collision checking is done
    updateStatusBar();
}

// Apply knockback to player
function applyPlayerKnockback(fromDirection, strength) {
    // If player is already being knocked back or is invincible, don't apply another knockback
    if (player.isKnockedBack || player.isInvincible) return;
    
    // Apply knockback resistance - if random number is less than resistance, skip knockback
    if (Math.random() < player.knockbackResistance) {
        return;
    }
    
    player.isKnockedBack = true;
    
    // Visual indicator for knockback
    playerElement.classList.add('knocked-back');
    
    // Calculate opposite direction to knock player back from the attack source
    let knockbackDirection = '';
    switch(fromDirection) {
        case 'right': knockbackDirection = 'left'; break;
        case 'left': knockbackDirection = 'right'; break;
        case 'up': knockbackDirection = 'down'; break;
        case 'down': knockbackDirection = 'up'; break;
    }
    
    // Calculate knockback distance based on strength (30-60px)
    const baseKnockback = 30 + (strength * 15);
    
    // Determine knockback vector
    let knockbackX = 0;
    let knockbackY = 0;
    
    switch(knockbackDirection) {
        case 'right': knockbackX = baseKnockback; break;
        case 'left': knockbackX = -baseKnockback; break;
        case 'up': knockbackY = -baseKnockback; break;
        case 'down': knockbackY = baseKnockback; break;
    }
    
    // Apply knockback in steps for smoother movement
    const knockbackSteps = 5;
    const stepDuration = player.knockbackDuration / knockbackSteps;
    const stepX = knockbackX / knockbackSteps;
    const stepY = knockbackY / knockbackSteps;
    
    let stepsCompleted = 0;
    const knockbackInterval = setInterval(() => {
        // Apply movement with boundary checking
        const newX = player.x + stepX;
        const newY = player.y + stepY;
        
        // Check boundaries
        if (newX >= 0 && newX <= GAME_WIDTH - player.width) {
            player.x = newX;
        }
        if (newY >= 0 && newY <= GAME_HEIGHT - player.height) {
            player.y = newY;
        }
        
        // Update position (rounding decimal point discrepancies)
        updatePlayerPosition();
        
        stepsCompleted++;
        if (stepsCompleted >= knockbackSteps) {
            clearInterval(knockbackInterval);
        }
    }, stepDuration);
    
    // End knockback effect after duration
    setTimeout(() => {
        player.isKnockedBack = false;
        playerElement.classList.remove('knocked-back');
    }, player.knockbackDuration);
}

// Apply knockback to enemy based on direction and multiplier
function applyKnockback(enemy, direction, knockbackMultiplier = 1.0) {
    // Calculate effective resistance based on player's knockback strength
    // Higher player knockback strength reduces enemy resistance
    // New formula: effectiveResistance = originalResistance * (1 / sqrt(knockbackStrengthMultiplier))
    // This creates a more gradual reduction in resistance
    // Example: knockbackStrengthMultiplier of 4.0 reduces resistance to 50% instead of 25%
    const effectiveResistance = enemy.knockbackResistance / Math.sqrt(Math.max(1, player.knockbackStrengthMultiplier));
    
    // Apply effective knockback resistance - if random number is less than effective resistance, skip knockback
    if (Math.random() < effectiveResistance) {
        // Show a visual indicator for resistance
        enemy.element.classList.add('resisted-knockback');
        
        // Show resistance value as text if it's a strong enemy
        if (enemy.knockbackResistance > 0.5) {
            const enemyCenterX = enemy.x + enemy.width / 2;
            const enemyCenterY = enemy.y;
            showDamageText(enemyCenterX, enemyCenterY - 20, `RESIST: ${Math.round(effectiveResistance * 100)}%`, false);
        }
        
        setTimeout(() => {
            enemy.element.classList.remove('resisted-knockback');
        }, 300);
        return;
    }
    
    enemy.isKnockedBack = true;
    
    // Visual indicator for knockback
    enemy.element.classList.add('knocked-back');
    
    // If this is a strong knockback (from dash attack), add a special class
    if (knockbackMultiplier > 1.0) {
        enemy.element.classList.add('strong-knockback');
        setTimeout(() => {
            enemy.element.classList.remove('strong-knockback');
        }, 500);
    }
    
    // Calculate knockback direction
    let knockbackX = 0;
    let knockbackY = 0;
    
    // Base knockback distance - increased for more impact
    // Now also consider player's knockback strength multiplier, but with a more gradual curve
    // Using Math.sqrt for a more gradual increase in knockback power
    const knockbackPower = 1 + Math.sqrt(player.knockbackStrengthMultiplier - 1) * 0.5;
    const baseKnockback = enemy.knockbackDistance * knockbackMultiplier * knockbackPower;
    
    switch(direction) {
        case 'right':
            knockbackX = baseKnockback;
            break;
        case 'left':
            knockbackX = -baseKnockback;
            break;
        case 'up':
            knockbackY = -baseKnockback;
            break;
        case 'down':
            knockbackY = baseKnockback;
            break;
    }
    
    // Apply knockback movement with quick start and slowing end (easing)
    const knockbackSteps = 8;
    const totalDuration = enemy.knockbackDuration;
    const stepDurations = [];
    
    // Calculate a curve for the movement (fast start, slow end)
    for (let i = 0; i < knockbackSteps; i++) {
        // Exponential decay - faster at start, slower at end
        stepDurations[i] = totalDuration * (1 - Math.pow(0.7, i + 1)) / 3;
    }
    
    // Implement the knockback with variable step timing
    let currentStep = 0;
    const applyStep = () => {
        if (currentStep >= knockbackSteps) {
            return;
        }
        
        // Calculate the progress of this step (0-1)
        const progress = (knockbackSteps - currentStep) / knockbackSteps;
        
        // Apply movement with boundary checking
        const stepX = knockbackX * progress / knockbackSteps;
        const stepY = knockbackY * progress / knockbackSteps;
        
        const newX = enemy.x + stepX;
        const newY = enemy.y + stepY;
        
        // Check boundaries
        if (newX >= 0 && newX <= GAME_WIDTH - enemy.width) {
            enemy.x = newX;
        }
        if (newY >= 0 && newY <= GAME_HEIGHT - enemy.height) {
            enemy.y = newY;
        }
        
        // Update position with subtle rotation for more impact
        const rotation = (currentStep % 2 === 0) ? 5 : -5;
        enemy.element.style.left = enemy.x + 'px';
        enemy.element.style.top = enemy.y + 'px';
        enemy.element.style.transform = `scale(1.2) rotate(${rotation}deg)`;
        
        currentStep++;
        
        // Schedule next step
        if (currentStep < knockbackSteps) {
            setTimeout(applyStep, stepDurations[currentStep]);
        }
    };
    
    // Start the knockback animation
    applyStep();
    
    // End knockback after duration
    setTimeout(() => {
        enemy.isKnockedBack = false;
        enemy.element.classList.remove('knocked-back');
        enemy.element.style.transform = 'none';
    }, enemy.knockbackDuration);
}

// Combo system functions
function increaseCombo() {
    // Increase combo count
    player.combo++;
    
    // Update max combo if needed
    if (player.combo > player.maxCombo) {
        player.maxCombo = player.combo;
    }
    
    // Reset combo timeout
    if (player.comboTimeout) {
        clearTimeout(player.comboTimeout);
    }
    
    // Set new timeout - combo resets after 5 seconds of no kills
    player.comboTimeout = setTimeout(() => {
        // Only show combo break message for combos of 3 or more
        if (player.combo >= 3) {
            const centerX = player.x + player.width / 2;
            const centerY = player.y - 30;
            showDamageText(centerX, centerY, `COMBO BREAK! x${player.combo}`, false);
        }
        
        player.combo = 0;
    }, 5000);
    
    // Show combo count for combos of 2 or more
    if (player.combo >= 2) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y - 30;
        showDamageText(centerX, centerY, `COMBO x${player.combo}!`, true);
    }
}

function breakCombo() {
    // Only show break message for combos of 3 or more
    if (player.combo >= 3) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y - 30;
        showDamageText(centerX, centerY, `COMBO BREAK! x${player.combo}`, false);
    }
    
    // Reset combo
    player.combo = 0;
    
    // Clear timeout
    if (player.comboTimeout) {
        clearTimeout(player.comboTimeout);
        player.comboTimeout = null;
    }
}

// Calculate combo multiplier for experience
function getComboExpMultiplier() {
    // No bonus for combos less than 2
    if (player.combo < 2) return 1.0;
    
    // Special bonus for combos of 100 or more
    if (player.combo >= 100) {
        return 20.0; // 20x experience for combo 100+
    }
    
    // Formula: 1.0 + (combo-1) * 0.1
    // Combo 2 = 1.1x, Combo 3 = 1.2x, etc.
    // Cap at 10.0x (combo 91-99)
    return Math.min(10.0, 1.0 + (player.combo - 1) * 0.1);
}

// Add a gem to the container
function addGem() {
    const gem = document.createElement('div');
    gem.className = 'gem';
    gemsContainer.appendChild(gem);
    player.gems++;
}

// Remove a gem from the container
function removeGem() {
    if (player.gems > 0 && gemsContainer.children.length > 0) {
        gemsContainer.removeChild(gemsContainer.lastChild);
        player.gems--;
        return true;
    }
    return false;
}

// Show level-up bonus selection (enable it)
function showBonusSelection() {
    if (player.gems > 0) {
        // Enable the bonus selection panel
        levelBonusContainer.classList.remove('disabled');
        
        // Enable all bonus buttons
        const bonusButtons = levelBonusContainer.querySelectorAll('.bonus-button');
        bonusButtons.forEach(button => {
            button.disabled = false;
        });
        
        player.choosingBonus = true;
        // No longer pause the game
    }
}

// Hide level-up bonus selection (disable it)
function hideBonusSelection() {
    // Add disabled class to the container
    levelBonusContainer.classList.add('disabled');
    
    // Disable all bonus buttons
    const bonusButtons = levelBonusContainer.querySelectorAll('.bonus-button');
    bonusButtons.forEach(button => {
        button.disabled = true;
    });
    
    player.choosingBonus = false;
}

// Apply selected bonus
function applyBonus(bonusType) {
    // Multiple safety checks
    if (player.gems <= 0 || levelBonusContainer.classList.contains('disabled') || !player.choosingBonus) {
        // Additional protection against developer tools manipulation
        hideBonusSelection();
        return;
    }
    
    // Show bonus effect at player position
    let bonusText = '';
    
    // Always heal 30% of max HP when using a gem
    const healAmount = Math.floor(player.maxHp * 0.3);
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    
    // Show healing amount slightly above player
    showDamageText(player.x + player.width / 2, player.y - 30, `+${healAmount}`, true);
    
    switch(bonusType) {
        case 'hp':
            player.maxHp += 20;
            player.hp += 20; // Additional 20 HP on top of the heal
            bonusText = 'HP +20!';
            break;
        case 'heal':
            // Switch to healing amount increase if cooldown is 3 seconds or less
            if (player.healCooldownBase <= 3) {
                player.healAmountMultiplier += 0.2;
                bonusText = 'HEAL +20%!';
            } else {
                player.healCooldownBase = Math.max(3, player.healCooldownBase - 1);
                bonusText = 'HEAL -1s!';
            }
            break;
        case 'attack':
            player.attack += 5;
            bonusText = 'ATK +5!';
            break;
        case 'knockback':
            player.knockbackResistance += 0.05; // Reduced from 0.1 to 0.05 (5% per level)
            player.knockbackStrengthMultiplier += 0.2; // Reduced from 0.5 to 0.2 (20% per level)
            bonusText = 'RESIST/KNOCK+!';
            break;
    }
    
    // Show the bonus text above player
    const centerX = player.x + player.width / 2;
    const centerY = player.y - 10;
    showDamageText(centerX, centerY, bonusText, true);
    
    // Remove a gem
    removeGem();
    
    // Only hide bonus selection if no more gems
    if (player.gems <= 0) {
        hideBonusSelection();
    }
    updateStatusBar();
}

// Level up player
function levelUp() {
    player.level++;
    
    // Increase maximum HP
    const oldMaxHp = player.maxHp;
    player.maxHp += 20;
    
    // Heal HP (20% of maximum HP)
    const healAmount = Math.floor(player.maxHp * 0.2);
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    
    // Display healing amount
    const playerCenterX = player.x + player.width / 2;
    const healTextY = player.y - 20;
    showDamageText(playerCenterX, healTextY, `+${healAmount} HP`, true);
    
    // Increase attack power
    player.attack += 5;
    
    // Add a gem for the level up
    addGem();
    
    // Show level up text above player
    // Offset position slightly to prevent overlap
    const levelUpTextY = player.y - 40;
    showDamageText(playerCenterX, levelUpTextY, `LEVEL UP! ${player.level}`, true);
    
    updateStatusBar();
    
    // Show the bonus selection panel
    showBonusSelection();
}

// Game over
function gameOver() {
    gameActive = false;
    
    // Capture game screen for sharing before adding game over overlay
    captureGameScreenForSharing();
    
    // Show game over text in the center of the screen
    const gameOverText = document.createElement('div');
    gameOverText.className = 'game-over-text';
    gameOverText.textContent = 'Game Over!';
    gameScreen.appendChild(gameOverText);
    
    // Create share dialog overlay
    const shareDialog = document.createElement('div');
    shareDialog.className = 'share-dialog';
    
    // Create share container
    const shareContainer = document.createElement('div');
    shareContainer.className = 'share-container';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = '✕';
    closeButton.addEventListener('click', () => {
        shareDialog.remove();
    });
    
    // Create share title element
    const shareTitle = document.createElement('div');
    shareTitle.className = 'share-title';
    shareTitle.textContent = 'Game Over';
    
    // Create share text element
    const shareText = document.createElement('div');
    shareText.className = 'share-text';
    shareText.textContent = `You reached Level ${player.level} with ${player.exp} Experience Points!`;
    
    // Create game screenshot container
    const screenshotContainer = document.createElement('div');
    screenshotContainer.className = 'screenshot-container';
    screenshotContainer.style.marginBottom = '15px';
    screenshotContainer.style.textAlign = 'center';
    
    // Create screenshot element
    const screenshot = document.createElement('div');
    screenshot.id = 'game-screenshot';
    screenshot.style.width = '90%';
    screenshot.style.maxWidth = '300px';
    screenshot.style.height = '150px';
    screenshot.style.margin = '0 auto';
    screenshot.style.backgroundImage = `url('images/gamescreen1.png')`;
    screenshot.style.backgroundSize = 'cover';
    screenshot.style.backgroundPosition = 'center';
    screenshot.style.borderRadius = '8px';
    screenshot.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
    screenshot.style.position = 'relative';
    screenshot.style.overflow = 'hidden';
    
    // Add overlay with score on the screenshot
    const scoreOverlay = document.createElement('div');
    scoreOverlay.style.position = 'absolute';
    scoreOverlay.style.bottom = '0';
    scoreOverlay.style.left = '0';
    scoreOverlay.style.width = '100%';
    scoreOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    scoreOverlay.style.color = 'white';
    scoreOverlay.style.padding = '5px';
    scoreOverlay.style.textAlign = 'center';
    scoreOverlay.style.fontSize = '12px';
    scoreOverlay.innerHTML = `Level ${player.level} | EXP ${player.exp}`;
    
    screenshot.appendChild(scoreOverlay);
    screenshotContainer.appendChild(screenshot);
    
    // Add help text
    const screenshotHelp = document.createElement('div');
    screenshotHelp.style.fontSize = '12px';
    screenshotHelp.style.color = '#666';
    screenshotHelp.style.marginTop = '5px';
    screenshotHelp.textContent = 'Take a screenshot of this to share your score with the image!';
    screenshotContainer.appendChild(screenshotHelp);
    
    // Create buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'share-buttons';
    
    // Create share button for X (Twitter)
    const shareButton = document.createElement('button');
    shareButton.className = 'share-button';
    
    // Add X (Twitter) icon
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.innerHTML = '✖';  // X icon
    
    shareButton.appendChild(icon);
    shareButton.appendChild(document.createTextNode('Share on X'));
    
    // Add click event for sharing
    shareButton.addEventListener('click', shareToX);
    
    // Create restart button
    const restartButton = document.createElement('button');
    restartButton.className = 'share-button restart-button';
    restartButton.textContent = 'Restart Game';
    
    // Add click event for restart
    restartButton.addEventListener('click', () => {
        shareDialog.remove();
        initGame();
    });
    
    // Assemble the buttons
    buttonsContainer.appendChild(shareButton);
    buttonsContainer.appendChild(restartButton);
    
    // Assemble the container
    shareContainer.appendChild(closeButton);
    shareContainer.appendChild(shareTitle);
    shareContainer.appendChild(shareText);
    shareContainer.appendChild(screenshotContainer); // Add screenshot container
    shareContainer.appendChild(buttonsContainer);
    
    // Add to dialog and then to document body (not game screen)
    shareDialog.appendChild(shareContainer);
    document.body.appendChild(shareDialog);
}

// Function to capture game screen for sharing
function captureGameScreenForSharing() {
    // This function could use html2canvas or similar library to capture the actual game screen
    // For now, we'll use the existing screenshot image
    
    // In a full implementation, you would add something like:
    /*
    if (typeof html2canvas !== 'undefined') {
        html2canvas(gameScreen).then(canvas => {
            const dataUrl = canvas.toDataURL('image/png');
            // Store this dataUrl to use in the share dialog
            window.gameScreenshotUrl = dataUrl;
        });
    }
    */
}

// Function to share score to X (Twitter)
function shareToX() {
    // Create share text
    const shareText = `I reached Level ${player.level} and earned ${player.exp} EXP in Simple RPG Game!`;
    
    // Check if Web Share API is available and supports sharing files
    if (navigator.share && navigator.canShare) {
        try {
            // Try to use Screenshot API if available (not widely supported)
            if (window.navigator.mediaDevices && window.navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({video: true})
                    .then(stream => {
                        const track = stream.getVideoTracks()[0];
                        const imageCapture = new ImageCapture(track);
                        
                        return imageCapture.grabFrame()
                            .then(imageBitmap => {
                                const canvas = document.createElement('canvas');
                                canvas.width = imageBitmap.width;
                                canvas.height = imageBitmap.height;
                                const ctx = canvas.getContext('2d');
                                ctx.drawImage(imageBitmap, 0, 0);
                                
                                return new Promise(resolve => {
                                    canvas.toBlob(blob => {
                                        resolve(blob);
                                        track.stop();
                                    }, 'image/png');
                                });
                            });
                    })
                    .then(blob => {
                        const file = new File([blob], 'screenshot.png', {type: 'image/png'});
                        
                        const shareData = {
                            title: 'Simple RPG Game Score',
                            text: shareText,
                            url: GAME_REPO_URL,
                            files: [file]
                        };
                        
                        if (navigator.canShare(shareData)) {
                            navigator.share(shareData);
                        } else {
                            // Fallback to URL-based sharing
                            fallbackShare();
                        }
                    })
                    .catch(error => {
                        console.error('Screenshot error:', error);
                        fallbackShare();
                    });
            } else {
                // No screenshot API, use fallback
                fallbackShare();
            }
        } catch (error) {
            console.error('Sharing error:', error);
            fallbackShare();
        }
    } else {
        // Web Share API not available, use fallback
        fallbackShare();
    }
    
    // Fallback to traditional URL sharing
    function fallbackShare() {
        // Create image URL - use the image path for the landing page
        const imageUrl = 'https://techs-targe.github.io/simple-rpg-game/images/gamescreen1.png';
        
        // Mention the image is available in the tweet text
        const fullShareText = `${shareText}\nCheck out the screenshot on the game page!`;
        
        // Create share URL with text and game URL
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}&url=${encodeURIComponent(GAME_REPO_URL)}`;
        
        // Open share dialog in a new window
        window.open(shareUrl, '_blank', 'width=550,height=420');
    }
}

// Attack function
function attack() {
    if (!gameActive || player.isAttacking) return;
    
    player.isAttacking = true;
    playerElement.style.backgroundColor = 'darkblue';
    
    // Reset all enemy hit flags before a new attack
    enemies.forEach(enemy => {
        enemy.isHit = false;
    });
    
    // Store the current direction and movement status at the moment of attack
    player.attackDirection = player.direction;
    const wasMoving = player.isMoving;
    
    // Visual indicator if this is a dash attack
    if (wasMoving) {
        playerElement.classList.add('dash-attack');
        setTimeout(() => {
            playerElement.classList.remove('dash-attack');
        }, 500);
    }
    
    // Common settings for sword animation
    const startAngle = -45;
    const endAngle = 45;
    
    // Position the sword based on player's direction
    positionSword();
    
    // Record direction at the start of attack (fixed)
    const initialDirection = player.attackDirection;
    
    // Show the sword
    swordElement.style.display = 'block';
    
    // Start with the wind-up position
    player.swordAngle = startAngle;
    updateSwordTransform(initialDirection); // Use fixed direction
    swordElement.style.transition = 'transform 200ms ease-out';
    
    // Function to update sword position (fixed position version)
    const fixedPositionSword = () => {
        // Determine position using direction at the start of attack
        positionSword(initialDirection);
    };
    
    // Position update timer - using fixed direction version
    const updateInterval = setInterval(fixedPositionSword, 16); // ~60fps
    
    // Swing forward after a delay
    setTimeout(() => {
        player.swordAngle = endAngle;
        updateSwordTransform(initialDirection); // Use fixed direction
        swordElement.style.transition = 'transform 150ms ease-in';
        
        // Check position also when changing angle
        fixedPositionSword();
    }, 200);
    
    // End attack after the full animation duration
    setTimeout(() => {
        // Hide the sword
        swordElement.style.display = 'none';
        
        // Reset player color
        playerElement.style.backgroundColor = 'blue';
        
        // End attack state
        player.isAttacking = false;
        
        // Stop updating sword position
        clearInterval(updateInterval);
        
        // Reset sword angle (without transition)
        setTimeout(() => {
            swordElement.style.transition = 'none';
            player.swordAngle = 0;
        }, 50);
    }, 500);
    
    // Function to position the sword based on player's position and direction
    function positionSword(forcedDirection = null) {
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        
        // Use specified direction if provided in arguments, otherwise use current direction
        const direction = forcedDirection || player.attackDirection;
        
        switch(direction) {
            case 'right':
                // Right: Sword extends from right side of player
                swordElement.style.left = `${player.x + player.width}px`;
                swordElement.style.top = `${playerCenterY - 3}px`;
                swordElement.style.transformOrigin = 'left center';
                // Use horizontal sword as is
                swordElement.style.width = '30px';
                swordElement.style.height = '6px';
                // Remove up/down classes
                swordElement.classList.remove('sword-up', 'sword-down');
                break;
                
            case 'left':
                // Left: Sword extends from left side of player
                swordElement.style.left = `${player.x}px`;
                swordElement.style.top = `${playerCenterY - 3}px`;
                swordElement.style.transformOrigin = 'left center';
                // Use horizontal sword as is
                swordElement.style.width = '30px';
                swordElement.style.height = '6px';
                // Remove up/down classes
                swordElement.classList.remove('sword-up', 'sword-down');
                break;
                
            case 'up':
                // Up: Sword extending from top of player
                // Position with slight offset from center
                swordElement.style.left = `${playerCenterX - 3}px`;
                swordElement.style.top = `${player.y - 30}px`;
                swordElement.style.transformOrigin = 'center bottom';
                // Swap width and height to make it vertical
                swordElement.style.width = '6px';
                swordElement.style.height = '30px';
                
                // Apply upward-facing class
                swordElement.classList.remove('sword-down');
                swordElement.classList.add('sword-up');
                break;
                
            case 'down':
                // Down: Sword extending from bottom of player
                // Position with slight offset from center
                swordElement.style.left = `${playerCenterX - 3}px`;
                swordElement.style.top = `${player.y + player.height}px`;
                swordElement.style.transformOrigin = 'center top';
                // Swap width and height to make it vertical
                swordElement.style.width = '6px';
                swordElement.style.height = '30px';
                
                // Apply downward-facing class
                swordElement.classList.remove('sword-up');
                swordElement.classList.add('sword-down');
                break;
        }
    }
    
    // Function to update sword transform/rotation based on direction and current angle
    function updateSwordTransform(forcedDirection = null) {
        // Use specified direction if provided in arguments, otherwise use current direction
        const direction = forcedDirection || player.attackDirection;
        
        switch(direction) {
            case 'right':
                swordElement.style.transform = `rotate(${player.swordAngle}deg)`;
                break;
                
            case 'left':
                // For left direction, we flip the sword and adjust the angle
                swordElement.style.transform = `rotate(${180 + player.swordAngle}deg)`;
                break;
                
            case 'up':
                // For upward direction, since width and height are swapped, just rotate
                swordElement.style.transform = `rotate(${player.swordAngle}deg)`;
                break;
                
            case 'down':
                // For downward direction, since width and height are swapped, just rotate
                swordElement.style.transform = `rotate(${player.swordAngle}deg)`;
                break;
        }
    }
}

// Heal function
function heal() {
    if (!gameActive || player.healCooldown > 0) return;
    
    // Calculate total heal amount with multiplier
    const healAmount = player.maxHp * 0.3 * player.healAmountMultiplier;
    
    // Add a healing over time effect
    // Heal over 10 seconds (approximately 600 frames)
    const framesForHeal = 600;
    player.healEffects.push({
        amount: healAmount,
        remaining: framesForHeal,
        total: framesForHeal
    });
    
    // Show healing start message
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y;
    showDamageText(playerCenterX, playerCenterY, `HEAL +${Math.floor(healAmount)}`, true);
    
    // Add a visual effect to the player
    playerElement.classList.add('healing');
    setTimeout(() => {
        playerElement.classList.remove('healing');
    }, 10000); // Same as the healing duration
    
    updateStatusBar();
    
    // Set cooldown using the dynamic healCooldownBase
    player.healCooldown = player.healCooldownBase;
    healBtn.disabled = true;
    
    const cooldownInterval = setInterval(() => {
        player.healCooldown--;
        healBtn.textContent = `Heal (${player.healCooldown})`;
        
        if (player.healCooldown <= 0) {
            clearInterval(cooldownInterval);
            healBtn.disabled = false;
            // Show healing multiplier if it's increased
            if (player.healAmountMultiplier > 1.0) {
                healBtn.textContent = `Heal (x${player.healAmountMultiplier.toFixed(1)})`;
            } else {
                healBtn.textContent = 'Heal';
            }
        }
    }, 1000);
}

// Process healing over time effects
function processHealEffects() {
    // Return if no healing effects
    if (player.healEffects.length === 0) return;
    
    // Process each healing effect
    for (let i = player.healEffects.length - 1; i >= 0; i--) {
        const effect = player.healEffects[i];
        
        // Calculate how much to heal this frame
        // Calculate healing amount per frame for a 10-second recovery
        const tickAmount = effect.amount / effect.total;
        
        // Apply healing (up to max HP)
        if (player.hp < player.maxHp) {
            // Add healing amount but don't exceed max HP
            const oldHp = player.hp;
            player.hp = Math.min(player.maxHp, player.hp + tickAmount);
            
            // Calculate how much was actually healed this tick
            const actualHeal = player.hp - oldHp;
            
            // Visual effect - only show every 20 frames to avoid spam
            if (Math.random() < 0.05 && actualHeal > 0) {
                const healX = player.x + player.width / 2 + (Math.random() * 20 - 10);
                const healY = player.y + (Math.random() * 10);
                // Show integer healing amount for larger heals, + for smaller amounts
                const healText = actualHeal > 0.5 ? "+" + Math.round(actualHeal) : "+";
                showDamageText(healX, healY, healText, false);
            }
        }
        
        // Reduce remaining time
        effect.remaining--;
        
        // Remove effect if done
        if (effect.remaining <= 0) {
            player.healEffects.splice(i, 1);
        }
    }
    
    // Update UI
    updateStatusBar();
}

// Game loop - simplified
function gameLoop() {
    // Do not process if the game has ended
    if (!gameActive) {
        return;
    }
    
    // Game processing
    movePlayer();
    moveEnemies();
    checkCollisions();
    spawnEnemy();
    processHealEffects();
    
    // Request next frame
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Function to use a gem if available
function useGem() {
    if (player.gems > 0) {
        showBonusSelection();
    } else {
        // Show message above player
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y - 20;
        showDamageText(playerCenterX, playerCenterY, 'NO GEMS!', false);
        
        // Ensure the bonus selection is disabled
        hideBonusSelection();
        
        // Add a visual shake effect to the bonus panel to indicate it's unavailable
        levelBonusContainer.classList.add('shake-effect');
        setTimeout(() => {
            levelBonusContainer.classList.remove('shake-effect');
        }, 500);
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
    
    // Attack when spacebar is pressed
    if (e.key === ' ' || e.code === 'Space') {
        attack();
    }
    
    // Heal when H key is pressed
    if (e.key === 'h' || e.key === 'H') {
        heal();
    }
    
    // Use gem when G key is pressed
    if (e.key === 'g' || e.key === 'G') {
        useGem();
    }
    
    // Restart game when R key is pressed
    if (e.key === 'r' || e.key === 'R') {
        e.preventDefault(); // Prevent the default action
        
        // Reset all movement keys to prevent speed bug
        keysPressed = Object.create(null);
        
        // Simply initialize directly
        initGame();
    }
    
    // Number keys for bonus selection (only if player is choosing bonus and has gems)
    if (player.choosingBonus && player.gems > 0 && !levelBonusContainer.classList.contains('disabled')) {
        if (e.key === '1') {
            applyBonus('hp');
        } else if (e.key === '2') {
            applyBonus('heal');
        } else if (e.key === '3') {
            applyBonus('attack');
        } else if (e.key === '4') {
            applyBonus('knockback');
        }
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});

// Game control buttons
attackBtn.addEventListener('click', attack);
healBtn.addEventListener('click', heal);
// Simply call initialization directly
restartBtn.addEventListener('click', initGame);

// Bonus buttons
bonusHpBtn.addEventListener('click', () => applyBonus('hp'));
bonusHealBtn.addEventListener('click', () => applyBonus('heal'));
bonusAttackBtn.addEventListener('click', () => applyBonus('attack'));
bonusKnockbackBtn.addEventListener('click', () => applyBonus('knockback'));

// Cheat mode function
function activateCheatMode() {
    // Play a success sound
    const audio = new Audio('data:audio/wav;base64,UklGRl9vAQBXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTtvAQAAAAAAAAAAAAAAAAD///////////////////////////9sbGz///////////9MTEz///////////8UFBQICAgAAAAAAAAMDAwYGBgAAAAAAAAAAAAUFBT///////////////////+AgID///////+MjIyEhIT///////////9UVFT///////////9AQED///////////9QUFBISEj///////////9YWFj///////////84ODj///////////9QUFBAQEDw8PD///////+cnJyUlJT///////////9wcHD///////////8gICDw8PD///////8AAAD///////////8AAAD///////+kpKT///////+srKysrKz///////////+UlJT///////////9wcHD///////////9ISEj///////8=');
    audio.volume = 0.3;
    audio.play();
    
    // Add 255 gems
    for (let i = 0; i < 255; i++) {
        addGem();
    }
    
    // Show feedback
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    showDamageText(centerX, centerY, "CHEAT ACTIVATED! +255 GEMS", true);
    
    // Reset the click counter to make it harder to activate again
    cheatClickCount = -32;
    
    // Show the bonus selection UI
    showBonusSelection();
}

// Add click event to Level label for cheat mode
playerLevelElement.parentElement.addEventListener('click', function() {
    cheatClickCount++;
    
    // Small visual feedback
    this.style.transform = 'scale(1.2)';
    setTimeout(() => {
        this.style.transform = 'scale(1)';
    }, 100);
    
    // If clicked 16 times, activate cheat mode
    if (cheatClickCount >= 16) {
        activateCheatMode();
    } else if (cheatClickCount > 0 && cheatClickCount % 4 === 0) {
        // Give small audio feedback every 4 clicks
        const clickAudio = new Audio('data:audio/wav;base64,UklGRpYEAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YXIEAAAAAP//Y2NjZmZmaGhoaWlpaWlpaWlpaWhoaGdnZ2VlZWNjY2FhYV9fX11dXVtbW1lZWVdXV1VVVVNTUlFRUU9PT01NTUtLS0lJSUdHR0ZGRkREREJCQkFBQT8/Pz4+Pj09PTw8PDo6Ojk5OTg4ODc3NzY2NjU1NTQ0NDMzMzIyMjExMTAwMC8vLy4uLi0tLSwsLCsrKyoqKikpKSgoKCcnJyYmJiUlJSQkJCMjIyIiIiEhISAgIB8fHx4eHh0dHRwcHBsbGxoaGhkZGRgYGBcXFxYWFhUVFRQUFBMTExISEhERERAQEA8PDw4ODg0NDQwMDAsLCwoKCgkJCQgICAcHBwYGBgUFBQQEBAMDAwICAgEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQICAgMDAwQEBAUFBQYGBgcHBwgICAkJCQoKCgsLCwwMDA0NDQ4ODg8PDxAQEBEREf////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8AAP//Y2NjZmZmaGhoaWlpaWlpaWlpaWhoaGdnZ2VlZWNjY2FhYV9fX11dXVtbW1lZWVdXV1VVVVNTUlFRUU9PT01NTUtLS0lJSUdHR0ZGRkREREJCQkFBQT8/Pz4+Pj09PTw8PDo6Ojk5OTg4ODc3NzY2NjU1NTQ0NDMzMzIyMjExMTAwMC8vLy4uLi0tLSwsLCsrKyoqKikpKSgoKCcnJyYmJiUlJSQkJCMjIyIiIiEhISAgIB8fHx4eHh0dHRwcHBsbGxoaGhkZGRgYGBcXFxYWFhUVFRQUFBMTExISEhERERAQEA8PDw4ODg0NDQwMDAsLCwoKCgkJCQgICAcHBwYGBgUFBQQEBAMDAwICAgEBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAQICAgMDAwQEBAUFBQYGBgcHBwgICAkJCQoKCgsLCwwMDA0NDQ4ODg8PDxAQEBEREf//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////');
        clickAudio.volume = 0.2;
        clickAudio.play();
    }
});

// Start the game when loaded - using direct initialization
window.addEventListener('load', initGame);