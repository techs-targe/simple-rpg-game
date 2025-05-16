// Game state and constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const ROCK_COUNT = 3; // Initial number of rocks
const ROCK_SIZE = 50; // Size of rocks
const ROCK_MAX_HP = 100; // Rock durability

// Function to check if device is mobile
function isMobileDevice() {
    return window.innerWidth <= 600;
}

// Function to get effective game height
function getEffectiveGameHeight() {
    return isMobileDevice() ? 260 : 400;
}

// Add window resize listener for mobile adaptability
window.addEventListener('resize', function() {
    if (typeof gameActive !== 'undefined' && gameActive && typeof player !== 'undefined') {
        // Limit player position on resize
        const maxHeight = getEffectiveGameHeight() - player.height;
        if (player.y > maxHeight) {
            player.y = maxHeight;
            if (typeof updatePlayerPosition === 'function') {
                updatePlayerPosition();
            }
        }
    }
});
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

// Enemy movement pattern definitions
const MOVEMENT_PATTERNS = {
    // Blue enemy patterns
    BLUE_DIRECT: { id: 'blue_direct', name: 'Direct', description: 'Moves directly toward player' },
    BLUE_STATIONARY: { id: 'blue_stationary', name: 'Stationary', description: 'Stays in place' },
    BLUE_FLEE: { id: 'blue_flee', name: 'Flee', description: 'Moves away from player' },

    // Red enemy patterns
    RED_DIRECT: { id: 'red_direct', name: 'Direct', description: 'Moves directly toward player' },
    RED_ROCK_SEEKER: { id: 'red_rock_seeker', name: 'Rock Seeker', description: 'Moves toward nearest rock' },
    RED_BLACK_SEEKER: { id: 'red_black_seeker', name: 'Black Seeker', description: 'Moves toward nearest black enemy' },

    // Black enemy patterns
    BLACK_SLOW: { id: 'black_slow', name: 'Slow Approach', description: 'Slowly approaches player' },
    BLACK_WHITE_SEEKER: { id: 'black_white_seeker', name: 'White Seeker', description: 'Moves toward nearest white enemy' },
    BLACK_BLUE_SEEKER: { id: 'black_blue_seeker', name: 'Blue Seeker', description: 'Moves toward nearest blue enemy' },
    BLACK_STATIONARY: { id: 'black_stationary', name: 'Stationary', description: 'Stays in place' },

    // White enemy patterns
    WHITE_STATIONARY: { id: 'white_stationary', name: 'Stationary', description: 'Stays in place' },
    WHITE_RANDOM: { id: 'white_random', name: 'Random', description: 'Moves in random directions' },
    WHITE_ORTHOGONAL: { id: 'white_orthogonal', name: 'Orthogonal', description: 'Approaches player using only horizontal or vertical movements' }
};

// Array of patterns for each enemy type
const ENEMY_MOVEMENT_PATTERNS = {
    'blue': [MOVEMENT_PATTERNS.BLUE_DIRECT, MOVEMENT_PATTERNS.BLUE_STATIONARY, MOVEMENT_PATTERNS.BLUE_FLEE],
    'red': [MOVEMENT_PATTERNS.RED_DIRECT, MOVEMENT_PATTERNS.RED_ROCK_SEEKER, MOVEMENT_PATTERNS.RED_BLACK_SEEKER],
    'black': [MOVEMENT_PATTERNS.BLACK_SLOW, MOVEMENT_PATTERNS.BLACK_WHITE_SEEKER, MOVEMENT_PATTERNS.BLACK_BLUE_SEEKER, MOVEMENT_PATTERNS.BLACK_STATIONARY],
    'white': [MOVEMENT_PATTERNS.WHITE_STATIONARY, MOVEMENT_PATTERNS.WHITE_RANDOM, MOVEMENT_PATTERNS.WHITE_ORTHOGONAL]
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
    swordLength: 39, // Length of the sword in pixels (30 * 1.3 = 39)
    swordHitbox: { width: 39, height: 7 }, // Sword dimensions (increased by 30%)
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
    choosingBonus: false, // Whether player is currently choosing a level-up bonus

    // Bow and arrow properties
    arrows: 0, // Current number of arrows
    maxArrows: 30, // Maximum number of arrows (increased to 30)
    isDrawingBow: false, // Whether player is currently drawing the bow
    bowDrawStartTime: 0, // When the player started drawing the bow
    lastVKeyTime: 0, // For detecting double-tap
    bowDrawnLevel: 0, // Current power level of the drawn bow (0-4)
};

// Enemies array
let enemies = [];

// Rocks array (obstacles)
let rocks = [];

// Arrows array (projectiles)
let arrows = [];

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
const bowBtn = document.getElementById('bow-btn');
const restartBtn = document.getElementById('restart-btn');
const gemsContainer = document.getElementById('gems-container');
const levelBonusContainer = document.getElementById('level-bonus');
const bonusHpBtn = document.getElementById('bonus-hp');
const bonusHealBtn = document.getElementById('bonus-heal');
const bonusAttackBtn = document.getElementById('bonus-attack');
const bonusKnockbackBtn = document.getElementById('bonus-knockback');
const bonusArrowsBtn = document.getElementById('bonus-arrows');

// Simple game loop ID
let gameLoopId = null;

// Update the arrow count display
function updateArrowDisplay() {
    // Clear existing arrows
    arrowsContainer.innerHTML = '';

    // Create arrow indicators
    for (let i = 0; i < player.arrows; i++) {
        const arrowIndicator = document.createElement('div');
        arrowIndicator.className = 'arrow-indicator';
        arrowIndicator.style.width = '10px';
        arrowIndicator.style.height = '20px';
        arrowIndicator.style.margin = '2px';
        arrowIndicator.style.backgroundColor = '#8B4513';
        arrowIndicator.style.clipPath = 'polygon(50% 0%, 100% 33%, 75% 100%, 25% 100%, 0% 33%)';
        arrowsContainer.appendChild(arrowIndicator);
    }
}

// Start drawing the bow
function startDrawingBow() {
    if (player.arrows <= 0) return;

    // Set drawing state
    player.isDrawingBow = true;
    player.bowDrawStartTime = Date.now();
    player.bowDrawnLevel = 0;

    // Show bow element positioned based on player direction
    positionBow();
    bowElement.style.display = 'block';

    // Show charge indicator
    bowChargeIndicator.style.display = 'block';
    bowChargeIndicator.style.width = '0%';
    bowChargeIndicator.style.backgroundColor = BOW_POWER_LEVELS[0].color;

    // Show drawing message
    showDamageText(player.x + player.width/2, player.y - 20, "DRAWING...", false);
}

// Position the bow based on player direction
function positionBow() {
    if (!player.isDrawingBow) return;

    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    switch (player.direction) {
        case 'right':
            bowElement.style.left = `${player.x + player.width}px`;
            bowElement.style.top = `${playerCenterY - 20}px`;
            bowElement.style.transform = 'rotate(0deg)';
            bowElement.style.borderRadius = '10px 0 0 10px';
            bowElement.style.borderRight = 'none';
            bowElement.style.borderLeft = '2px solid #8B4513';
            break;
        case 'left':
            bowElement.style.left = `${player.x - 20}px`;
            bowElement.style.top = `${playerCenterY - 20}px`;
            bowElement.style.transform = 'rotate(180deg)';
            bowElement.style.borderRadius = '10px 0 0 10px';
            bowElement.style.borderRight = 'none';
            bowElement.style.borderLeft = '2px solid #8B4513';
            break;
        case 'up':
            bowElement.style.left = `${playerCenterX - 20}px`;
            bowElement.style.top = `${player.y - 20}px`;
            bowElement.style.transform = 'rotate(270deg)';
            bowElement.style.borderRadius = '10px 0 0 10px';
            bowElement.style.borderRight = 'none';
            bowElement.style.borderLeft = '2px solid #8B4513';
            break;
        case 'down':
            bowElement.style.left = `${playerCenterX - 20}px`;
            bowElement.style.top = `${player.y + player.height}px`;
            bowElement.style.transform = 'rotate(90deg)';
            bowElement.style.borderRadius = '10px 0 0 10px';
            bowElement.style.borderRight = 'none';
            bowElement.style.borderLeft = '2px solid #8B4513';
            break;
    }
}

// Function to reset bow styles and state
function resetBow() {
    player.isDrawingBow = false;

    // Reset bow element styles
    bowElement.style.display = 'none';
    bowElement.style.boxShadow = 'none';
    bowElement.style.backgroundColor = 'transparent';

    // Reset border styles to default for all directions
    bowElement.style.borderLeft = '2px solid #8B4513';
    bowElement.style.borderRight = 'none';
    bowElement.style.borderTop = '2px solid #8B4513';
    bowElement.style.borderBottom = '2px solid #8B4513';

    // Hide charge indicator
    bowChargeIndicator.style.display = 'none';
    bowChargeIndicator.style.width = '0%';
}

// Cancel bow drawing
function cancelBowDrawing() {
    if (!player.isDrawingBow) return;

    resetBow();
    showDamageText(player.x + player.width/2, player.y - 20, "CANCELLED", false);
}

// Update bow drawing in game loop
function updateBowDrawing() {
    if (!player.isDrawingBow) return;

    // No longer cancel bow drawing when moving
    // Instead position the bow based on player's current position
    if (player.isMoving) {
        positionBow();
    }

    // Calculate draw time
    const drawTime = Date.now() - player.bowDrawStartTime;

    // Find current power level
    let powerLevel = 0;
    for (let i = BOW_POWER_LEVELS.length - 1; i >= 0; i--) {
        if (drawTime >= BOW_POWER_LEVELS[i].threshold) {
            powerLevel = i;
            break;
        }
    }

    // Update player's current bow power level
    if (powerLevel !== player.bowDrawnLevel) {
        player.bowDrawnLevel = powerLevel;

        // Play sound or visual effect for level up
        const powerLevelText = ['WEAK', 'MEDIUM', 'STRONG', 'POWERFUL', 'MAXIMUM'][powerLevel];
        showDamageText(player.x + player.width/2, player.y - 20, powerLevelText, false);

        // Show speed reduction percentage
        const speedReductions = [0.7, 0.6, 0.5, 0.4, 0.3]; // Must match the values in movePlayer
        const speedPercent = Math.round(speedReductions[powerLevel] * 100);
        showDamageText(player.x + player.width/2, player.y - 40, `Speed: ${speedPercent}%`, false);
    }

    // Calculate charge percentage based on next threshold
    let chargePercent = 100;
    if (powerLevel < BOW_POWER_LEVELS.length - 1) {
        const currentThreshold = BOW_POWER_LEVELS[powerLevel].threshold;
        const nextThreshold = BOW_POWER_LEVELS[powerLevel + 1].threshold;
        const timeToNextLevel = nextThreshold - currentThreshold;
        const progress = drawTime - currentThreshold;
        chargePercent = Math.min(100, (progress / timeToNextLevel) * 100);
    }

    // Update visual charging indicator
    bowChargeIndicator.style.width = `${chargePercent}%`;
    bowChargeIndicator.style.backgroundColor = BOW_POWER_LEVELS[powerLevel].color;

    // Update bow appearance based on charge level
    const chargeColors = ['#964B00', '#B87333', '#CD7F32', '#FFC125', '#FFD700'];
    const borderWidth = 2 + powerLevel; // Thicker border for higher charge levels

    // Make the bow element match the power level
    bowElement.style.backgroundColor = `${chargeColors[powerLevel]}${Math.round(chargePercent/2) + 50}`; // Add transparency
    bowElement.style.boxShadow = `0 0 ${powerLevel * 3}px ${chargeColors[powerLevel]}`;

    // Update border width based on direction
    if (player.direction === 'right' || player.direction === 'left') {
        const borderSide = player.direction === 'right' ? 'borderLeft' : 'borderRight';
        bowElement.style[borderSide] = `${borderWidth}px solid ${chargeColors[powerLevel]}`;
    } else {
        const borderSide = player.direction === 'up' ? 'borderBottom' : 'borderTop';
        bowElement.style[borderSide] = `${borderWidth}px solid ${chargeColors[powerLevel]}`;
    }
}

// Shoot an arrow
function shootArrow() {
    if (!player.isDrawingBow || player.arrows <= 0) return;

    // Get the power level stats
    const powerLevel = player.bowDrawnLevel;
    const { damageMultiplier, speed, knockback, color } = BOW_POWER_LEVELS[powerLevel];

    // Create an arrow object
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    // Calculate direction vector based on player direction
    let dirX = 0;
    let dirY = 0;
    switch (player.direction) {
        case 'right': dirX = 1; dirY = 0; break;
        case 'left': dirX = -1; dirY = 0; break;
        case 'up': dirX = 0; dirY = -1; break;
        case 'down': dirX = 0; dirY = 1; break;
    }

    // Create the arrow object - position based on player direction and edge
    const arrowWidth = 10;
    const arrowHeight = 20;

    // Calculate arrow starting position based on player direction
    let arrowX, arrowY;

    switch (player.direction) {
        case 'right':
            // Right edge of player
            arrowX = player.x + player.width;
            arrowY = player.y + (player.height / 2) - (arrowHeight / 2);
            break;
        case 'left':
            // Left edge of player
            arrowX = player.x - arrowWidth;
            arrowY = player.y + (player.height / 2) - (arrowHeight / 2);
            break;
        case 'up':
            // Top edge of player
            arrowX = player.x + (player.width / 2) - (arrowWidth / 2);
            arrowY = player.y - arrowHeight;
            break;
        case 'down':
            // Bottom edge of player
            arrowX = player.x + (player.width / 2) - (arrowWidth / 2);
            arrowY = player.y + player.height;
            break;
    }

    const arrow = {
        x: arrowX,
        y: arrowY,
        width: arrowWidth,
        height: arrowHeight,
        dirX: dirX,
        dirY: dirY,
        speed: speed,
        damage: Math.floor(player.attack * damageMultiplier),
        knockback: knockback,
        color: color,
        distanceTraveled: 0,
        maxDistance: GAME_WIDTH * 1.5, // Maximum travel distance
        element: null,
        // Add penetration for max charge level (level 4)
        canPenetrate: powerLevel === 4
    };

    // Create visual element for the arrow
    const arrowElement = document.createElement('div');
    arrowElement.className = 'arrow';
    arrowElement.style.position = 'absolute';
    arrowElement.style.width = `${arrowWidth}px`;
    arrowElement.style.height = `${arrowHeight}px`;
    arrowElement.style.backgroundColor = color;
    arrowElement.style.clipPath = 'polygon(50% 0%, 100% 33%, 75% 100%, 25% 100%, 0% 33%)';

    // Rotate based on direction
    let rotation = 0;
    switch (player.direction) {
        case 'right': rotation = 90; break;
        case 'left': rotation = -90; break;
        case 'up': rotation = 0; break;
        case 'down': rotation = 180; break;
    }

    // Add glow to max power arrows
    if (powerLevel === 4) {
        arrowElement.style.boxShadow = `0 0 10px ${color}, 0 0 5px white`;
    }

    // Position and rotate the arrow directly for accuracy
    arrowElement.style.left = `${arrow.x}px`;
    arrowElement.style.top = `${arrow.y}px`;
    arrowElement.style.transform = `rotate(${rotation}deg)`;
    arrowElement.style.willChange = 'transform'; // Hint for browser optimization

    // Add to screen
    gameScreen.appendChild(arrowElement);
    arrow.element = arrowElement;

    // Add to arrows array
    arrows.push(arrow);

    // Show shooting effect with damage info
    const powerTexts = ["QUICK", "AIMED", "FOCUSED", "CHARGED", "PERFECT"];
    showDamageText(playerCenterX, playerCenterY - 30, `${powerTexts[powerLevel]} SHOT! (${arrow.damage})`, true);

    // Decrease arrow count
    player.arrows--;
    updateArrowDisplay();

    // Reset bow state
    resetBow();
}

// Move all active arrows
// Maximum number of arrows that can be active at once to avoid performance issues
const MAX_ACTIVE_ARROWS = 20;

function moveArrows() {
    // Limit the number of active arrows for performance
    if (arrows.length > MAX_ACTIVE_ARROWS) {
        // Remove oldest arrows that exceed the limit
        const arrowsToRemove = arrows.length - MAX_ACTIVE_ARROWS;
        for (let i = 0; i < arrowsToRemove; i++) {
            // Remove oldest arrow (first in array)
            if (arrows[0] && arrows[0].element) {
                arrows[0].element.remove();
            }
            arrows.shift();
        }
    }

    for (let i = arrows.length - 1; i >= 0; i--) {
        const arrow = arrows[i];

        // Move arrow
        arrow.x += arrow.dirX * arrow.speed;
        arrow.y += arrow.dirY * arrow.speed;
        arrow.distanceTraveled += arrow.speed;

        // Update element position directly for accuracy
        arrow.element.style.left = `${arrow.x}px`;
        arrow.element.style.top = `${arrow.y}px`;

        // Check if arrow is out of bounds or traveled too far
        if (
            arrow.x < -50 ||
            arrow.x > GAME_WIDTH + 50 ||
            arrow.y < -50 ||
            arrow.y > getEffectiveGameHeight() + 50 ||
            arrow.distanceTraveled > arrow.maxDistance
        ) {
            // Remove arrow element
            arrow.element.remove();

            // Remove from array
            arrows.splice(i, 1);
            continue;
        }

        // Check for collision with enemies
        for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];

            // Skip if enemy is already being knocked back
            if (enemy.isKnockedBack) continue;

            // Check for collision
            if (
                arrow.x < enemy.x + enemy.width &&
                arrow.x + arrow.width > enemy.x &&
                arrow.y < enemy.y + enemy.height &&
                arrow.y + arrow.height > enemy.y
            ) {
                // Apply damage to enemy
                const originalHp = enemy.hp;
                enemy.hp -= arrow.damage;

                // Show damage text above enemy
                const enemyCenterX = enemy.x + enemy.width / 2;
                const enemyCenterY = enemy.y;
                showDamageText(enemyCenterX, enemyCenterY, arrow.damage, true);

                // Check if enemy died
                if (enemy.hp <= 0) {
                    // Give player experience
                    player.exp += enemy.exp;

                    // Show experience gain
                    showDamageText(enemyCenterX, enemyCenterY - 20, `+${enemy.exp} EXP`, true);

                    // Level up if needed
                    if (player.exp >= EXP_TO_LEVEL_UP) {
                        levelUp();
                    }

                    // Remove the enemy element from display
                    enemy.element.remove();

                    // Remove from enemies array
                    const index = enemies.indexOf(enemy);
                    if (index > -1) {
                        enemies.splice(index, 1);
                    }
                } else {
                    // Update enemy's health bar
                    const healthBar = enemy.element.querySelector('.enemy-health');
                    if (healthBar) {
                        const healthPercent = Math.max(0, enemy.hp / originalHp * 100);
                        healthBar.style.width = `${healthPercent}%`;
                    }
                }

                // Apply knockback to enemy in the direction of the arrow
                const direction = player.direction; // Use the player's direction

                // Calculate knockback strength based on arrow power
                const knockbackMultiplier = arrow.knockback / 50; // Normalize to expected scale

                // Apply fixed knockback based on arrow power
                applyKnockback(enemy, direction, knockbackMultiplier, arrow.knockback/2);

                // If arrow can penetrate, continue flying
                if (arrow.canPenetrate) {
                    // Add visual effect to show penetration
                    arrow.element.style.filter = "brightness(130%) contrast(150%)";

                    // Skip to next enemy (continue flying)
                    continue;
                }
                // Otherwise remove the arrow
                else {
                    // Remove arrow element
                    arrow.element.remove();

                    // Remove from array
                    arrows.splice(i, 1);
                    break;
                }
            }
        }

        // Check for collision with rocks
        for (let j = 0; j < rocks.length; j++) {
            const rock = rocks[j];

            // Check for collision
            if (
                arrow.x < rock.x + rock.width &&
                arrow.x + arrow.width > rock.x &&
                arrow.y < rock.y + rock.height &&
                arrow.y + arrow.height > rock.y
            ) {
                // Apply damage to rock (half damage)
                damageRock(rock, Math.floor(arrow.damage / 2), true);

                // If arrow can penetrate, continue flying
                if (arrow.canPenetrate) {
                    // Add visual effect to show penetration
                    arrow.element.style.filter = "brightness(130%) contrast(150%)";

                    // Skip to next enemy (continue flying)
                    continue;
                }
                // Otherwise remove the arrow
                else {
                    // Remove arrow element
                    arrow.element.remove();

                    // Remove from array
                    arrows.splice(i, 1);
                    break;
                }
            }
        }
    }
}

// Initialize game - completely simplified
function initGame() {
    // Stop existing loop
    if (gameLoopId !== null) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    
    // Set game to active state
    gameActive = true;
    
    // Set player position at center of the screen
    player.x = GAME_WIDTH / 2 - player.width / 2;
    player.y = getEffectiveGameHeight() / 2 - player.height / 2;
    
    // Initialize player position (with rounded rendering)
    updatePlayerPosition();
    
    // Clear enemies
    enemies.forEach(enemy => {
        if (enemy.element) {
            enemy.element.remove();
        }
    });
    enemies = [];
    
    // Clear rocks
    rocks.forEach(rock => {
        if (rock.element) {
            rock.element.remove();
        }
    });
    rocks = [];
    
    // Place new rocks - adding one rock every 5 levels instead of 10
    const rockCount = ROCK_COUNT + Math.floor(player.level / 5);
    for (let i = 0; i < rockCount; i++) {
        createRock();
    }
    
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
    player.x = GAME_WIDTH / 2 - player.width / 2;
    player.y = getEffectiveGameHeight() / 2 - player.height / 2;
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

    // Reset bow and arrow properties
    player.arrows = 0; // Start with no arrows
    player.bowDrawStartTime = 0;
    player.bowDrawnLevel = 0;
    player.lastVKeyTime = 0;

    // Reset bow UI elements
    resetBow();

    // Clear all arrows from screen
    arrows.forEach(arrow => {
        if (arrow.element) arrow.element.remove();
    });
    arrows = [];

    // Update arrow display
    updateArrowDisplay();

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
    
    // Calculate potential new position
    let newX = player.x;
    let newY = player.y;

    // Calculate actual speed - reduced based on bow charge level
    let speedMultiplier = 1.0; // Default full speed
    if (player.isDrawingBow) {
        // Speed decreases as charge level increases
        const speedReductions = [0.7, 0.6, 0.5, 0.4, 0.3]; // 70%, 60%, 50%, 40%, 30%
        speedMultiplier = speedReductions[player.bowDrawnLevel];
    }
    const actualSpeed = PLAYER_SPEED * speedMultiplier;

    if (keysPressed['ArrowUp'] && player.y > 0) {
        newY -= actualSpeed;
        player.lastMoveDirection = 'up';
    }
    if (keysPressed['ArrowDown'] && player.y < getEffectiveGameHeight() - player.height) {
        newY += actualSpeed;
        player.lastMoveDirection = 'down';
    }
    if (keysPressed['ArrowLeft'] && player.x > 0) {
        newX -= actualSpeed;
        player.lastMoveDirection = 'left';
    }
    if (keysPressed['ArrowRight'] && player.x < GAME_WIDTH - player.width) {
        newX += actualSpeed;
        player.lastMoveDirection = 'right';
    }
    
    // Check for rock collisions
    let canMoveX = true;
    let canMoveY = true;
    
    // Check rock collisions for X and Y movement separately
    for (const rock of rocks) {
        // Check X movement collision
        if (
            newX < rock.x + rock.width &&
            newX + player.width > rock.x &&
            player.y < rock.y + rock.height &&
            player.y + player.height > rock.y
        ) {
            canMoveX = false;
        }
        
        // Check Y movement collision
        if (
            player.x < rock.x + rock.width &&
            player.x + player.width > rock.x &&
            newY < rock.y + rock.height &&
            newY + player.height > rock.y
        ) {
            canMoveY = false;
        }
    }
    
    // Apply movement if possible
    if (canMoveX) {
        player.x = newX;
    }
    if (canMoveY) {
        player.y = newY;
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

// Create a rock obstacle
function createRock() {
    // Find a position that doesn't overlap with existing rocks, enemies, or player
    let x, y;
    let attempts = 0;
    const maxAttempts = 30; // Maximum attempts to find a non-overlapping position
    let validPosition = false;
    
    // Keep trying positions until we find a valid one or run out of attempts
    while (!validPosition && attempts < maxAttempts) {
        attempts++;
        
        // Generate a random position
        x = Math.random() * (GAME_WIDTH - ROCK_SIZE);
        y = Math.random() * (getEffectiveGameHeight() - ROCK_SIZE);
        
        // Avoid spawning too close to the player (minimum 150px away from center)
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const rockCenterX = x + ROCK_SIZE / 2;
        const rockCenterY = y + ROCK_SIZE / 2;
        
        const playerDistance = Math.sqrt(
            Math.pow(rockCenterX - playerCenterX, 2) + 
            Math.pow(rockCenterY - playerCenterY, 2)
        );
        
        if (playerDistance < 150) {
            continue;
        }
        
        // Check if this position overlaps with any existing rock
        validPosition = true;
        for (const existingRock of rocks) {
            if (
                x < existingRock.x + existingRock.width &&
                x + ROCK_SIZE > existingRock.x &&
                y < existingRock.y + existingRock.height &&
                y + ROCK_SIZE > existingRock.y
            ) {
                validPosition = false;
                break;
            }
        }
        
        // Also check if this position overlaps with any existing enemy
        if (validPosition) {
            for (const enemy of enemies) {
                if (
                    x < enemy.x + enemy.width &&
                    x + ROCK_SIZE > enemy.x &&
                    y < enemy.y + enemy.height &&
                    y + ROCK_SIZE > enemy.y
                ) {
                    validPosition = false;
                    break;
                }
            }
        }
    }
    
    // If we couldn't find a valid position after max attempts, just use the last generated position
    
    // Create rock data
    const rock = {
        id: 'rock_' + rocks.length,
        x: x,
        y: y,
        width: ROCK_SIZE,
        height: ROCK_SIZE,
        hp: ROCK_MAX_HP,
        maxHp: ROCK_MAX_HP
    };
    
    // Create rock element
    const rockElement = document.createElement('div');
    rockElement.className = 'rock';
    rockElement.style.left = rock.x + 'px';
    rockElement.style.top = rock.y + 'px';
    rockElement.style.width = ROCK_SIZE + 'px';
    rockElement.style.height = ROCK_SIZE + 'px';
    
    // Add health indicator for rock
    const healthBar = document.createElement('div');
    healthBar.className = 'rock-health';
    healthBar.style.width = '100%';
    rockElement.appendChild(healthBar);
    
    gameScreen.appendChild(rockElement);
    
    rock.element = rockElement;
    rocks.push(rock);
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
    
    // Get effective game height for spawning
    
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
        y = Math.random() * (getEffectiveGameHeight() - enemySize);
        
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
        
        // Also check if this position overlaps with any existing rock
        if (validPosition) {
            for (const rock of rocks) {
                if (
                    x < rock.x + rock.width &&
                    x + enemySize > rock.x &&
                    y < rock.y + rock.height &&
                    y + enemySize > rock.y
                ) {
                    validPosition = false;
                    break;
                }
            }
        }
    }
    
    // If we couldn't find a valid position after max attempts, just use the last generated position
    
    // Select a random movement pattern for this enemy type
    const availablePatterns = ENEMY_MOVEMENT_PATTERNS[enemyType.color];
    const randomPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];

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
        movementPattern: randomPattern.id, // Assign the movement pattern
        isKnockedBack: false,
        isHit: false, // Flag to track if enemy was already hit in this attack frame
        knockbackDuration: 300, // Duration of knockback in milliseconds
        knockbackDistance: 60 * enemyType.knockbackMultiplier, // Base distance adjusted by enemy type
        knockbackResistance: enemyType.knockbackResistance, // Resistance to knockback (0-1)
        randomDirection: null, // For random movement pattern
        lastDirectionChange: 0 // For random movement pattern
    };

    // Create enemy element
    const enemyElement = document.createElement('div');
    enemyElement.className = 'enemy';
    enemyElement.style.left = enemy.x + 'px';
    enemyElement.style.top = enemy.y + 'px';
    enemyElement.style.backgroundColor = enemyType.color;
    enemyElement.dataset.enemyType = enemyType.color;
    enemyElement.dataset.movementPattern = randomPattern.id;
    enemyElement.title = `${enemyType.color} - ${randomPattern.name}: ${randomPattern.description}`;

    // Add health indicator (visible for all types)
    const healthBar = document.createElement('div');
    healthBar.className = 'enemy-health';
    healthBar.style.width = '100%';
    enemyElement.appendChild(healthBar);

    // Set initial pattern switch time
    enemy.lastPatternSwitch = Date.now();
    enemy.patternSwitchInterval = 5000 + Math.random() * 5000; // 5-10 seconds random interval

    gameScreen.appendChild(enemyElement);

    enemy.element = enemyElement;
    enemies.push(enemy);
}

// Move enemies toward player and handle enemy collision avoidance
function moveEnemies() {
    // First pass: Calculate new positions based on movement patterns
    const newPositions = [];
    const now = Date.now();

    enemies.forEach(enemy => {
        // Check if it's time to switch patterns
        if (now - enemy.lastPatternSwitch > enemy.patternSwitchInterval) {
            // Get available patterns for this enemy type
            const availablePatterns = ENEMY_MOVEMENT_PATTERNS[enemy.type.color];

            // Select a new random pattern (different from current if possible)
            let newPattern;
            if (availablePatterns.length > 1) {
                // Filter out current pattern to avoid selecting the same one
                const otherPatterns = availablePatterns.filter(pattern => pattern.id !== enemy.movementPattern);
                // If there are other patterns available, choose from them, otherwise choose from all
                if (otherPatterns.length > 0) {
                    newPattern = otherPatterns[Math.floor(Math.random() * otherPatterns.length)];
                } else {
                    newPattern = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
                }
            } else {
                // If only one pattern is available, use it
                newPattern = availablePatterns[0];
            }

            // Assign new pattern
            enemy.movementPattern = newPattern.id;

            // Update visual indication
            enemy.element.dataset.movementPattern = newPattern.id;
            enemy.element.title = `${enemy.type.color} - ${newPattern.name}: ${newPattern.description}`;

            // Set next switch time (5-10 seconds)
            enemy.lastPatternSwitch = now;
            enemy.patternSwitchInterval = 5000 + Math.random() * 5000;
        }

        // Only calculate new position if not being knocked back
        if (!enemy.isKnockedBack) {
            let newX = enemy.x;
            let newY = enemy.y;
            let moveVector = { x: 0, y: 0 };

            // Determine movement based on pattern
            switch (enemy.movementPattern) {
                // Blue enemy patterns
                case MOVEMENT_PATTERNS.BLUE_DIRECT.id:
                    // Move directly toward player (current basic behavior)
                    if (enemy.x < player.x) moveVector.x = enemy.speed;
                    if (enemy.x > player.x) moveVector.x = -enemy.speed;
                    if (enemy.y < player.y) moveVector.y = enemy.speed;
                    if (enemy.y > player.y) moveVector.y = -enemy.speed;
                    break;

                case MOVEMENT_PATTERNS.BLUE_STATIONARY.id:
                    // Stay in place (no movement)
                    moveVector = { x: 0, y: 0 };
                    break;

                case MOVEMENT_PATTERNS.BLUE_FLEE.id:
                    // Flee from player
                    const playerCenterX = player.x + player.width / 2;
                    const playerCenterY = player.y + player.height / 2;
                    const enemyCenterX = enemy.x + enemy.width / 2;
                    const enemyCenterY = enemy.y + enemy.height / 2;

                    moveVector = calculateMoveAwayVector(
                        enemyCenterX, enemyCenterY,
                        playerCenterX, playerCenterY,
                        enemy.speed
                    );
                    break;

                // Red enemy patterns
                case MOVEMENT_PATTERNS.RED_DIRECT.id:
                    // Move directly toward player (current basic behavior)
                    if (enemy.x < player.x) moveVector.x = enemy.speed;
                    if (enemy.x > player.x) moveVector.x = -enemy.speed;
                    if (enemy.y < player.y) moveVector.y = enemy.speed;
                    if (enemy.y > player.y) moveVector.y = -enemy.speed;
                    break;

                case MOVEMENT_PATTERNS.RED_ROCK_SEEKER.id:
                    // Move toward nearest rock
                    const nearestRock = findNearestRock(enemy.x, enemy.y);
                    if (nearestRock.rock) {
                        const rockCenterX = nearestRock.rock.x + nearestRock.rock.width / 2;
                        const rockCenterY = nearestRock.rock.y + nearestRock.rock.height / 2;

                        if (enemy.x < rockCenterX) moveVector.x = enemy.speed;
                        if (enemy.x > rockCenterX) moveVector.x = -enemy.speed;
                        if (enemy.y < rockCenterY) moveVector.y = enemy.speed;
                        if (enemy.y > rockCenterY) moveVector.y = -enemy.speed;
                    } else {
                        // If no rocks are found, move toward player
                        if (enemy.x < player.x) moveVector.x = enemy.speed;
                        if (enemy.x > player.x) moveVector.x = -enemy.speed;
                        if (enemy.y < player.y) moveVector.y = enemy.speed;
                        if (enemy.y > player.y) moveVector.y = -enemy.speed;
                    }
                    break;

                case MOVEMENT_PATTERNS.RED_BLACK_SEEKER.id:
                    // Move toward nearest black enemy
                    const nearestBlack = findNearestEnemyOfType(enemy.x, enemy.y, 'black', enemy.id);
                    if (nearestBlack.enemy) {
                        const blackCenterX = nearestBlack.enemy.x + nearestBlack.enemy.width / 2;
                        const blackCenterY = nearestBlack.enemy.y + nearestBlack.enemy.height / 2;

                        if (enemy.x < blackCenterX) moveVector.x = enemy.speed;
                        if (enemy.x > blackCenterX) moveVector.x = -enemy.speed;
                        if (enemy.y < blackCenterY) moveVector.y = enemy.speed;
                        if (enemy.y > blackCenterY) moveVector.y = -enemy.speed;
                    } else {
                        // If no black enemies are found, move toward player
                        if (enemy.x < player.x) moveVector.x = enemy.speed;
                        if (enemy.x > player.x) moveVector.x = -enemy.speed;
                        if (enemy.y < player.y) moveVector.y = enemy.speed;
                        if (enemy.y > player.y) moveVector.y = -enemy.speed;
                    }
                    break;

                // Black enemy patterns
                case MOVEMENT_PATTERNS.BLACK_SLOW.id:
                    // Slowly approach player (half speed)
                    if (enemy.x < player.x) moveVector.x = enemy.speed * 0.5;
                    if (enemy.x > player.x) moveVector.x = -enemy.speed * 0.5;
                    if (enemy.y < player.y) moveVector.y = enemy.speed * 0.5;
                    if (enemy.y > player.y) moveVector.y = -enemy.speed * 0.5;
                    break;

                case MOVEMENT_PATTERNS.BLACK_WHITE_SEEKER.id:
                    // Move toward nearest white enemy
                    const nearestWhite = findNearestEnemyOfType(enemy.x, enemy.y, 'white', enemy.id);
                    if (nearestWhite.enemy) {
                        const whiteCenterX = nearestWhite.enemy.x + nearestWhite.enemy.width / 2;
                        const whiteCenterY = nearestWhite.enemy.y + nearestWhite.enemy.height / 2;

                        if (enemy.x < whiteCenterX) moveVector.x = enemy.speed;
                        if (enemy.x > whiteCenterX) moveVector.x = -enemy.speed;
                        if (enemy.y < whiteCenterY) moveVector.y = enemy.speed;
                        if (enemy.y > whiteCenterY) moveVector.y = -enemy.speed;
                    } else {
                        // If no white enemies are found, move toward player
                        if (enemy.x < player.x) moveVector.x = enemy.speed;
                        if (enemy.x > player.x) moveVector.x = -enemy.speed;
                        if (enemy.y < player.y) moveVector.y = enemy.speed;
                        if (enemy.y > player.y) moveVector.y = -enemy.speed;
                    }
                    break;

                case MOVEMENT_PATTERNS.BLACK_BLUE_SEEKER.id:
                    // Move toward nearest blue enemy
                    const nearestBlue = findNearestEnemyOfType(enemy.x, enemy.y, 'blue', enemy.id);
                    if (nearestBlue.enemy) {
                        const blueCenterX = nearestBlue.enemy.x + nearestBlue.enemy.width / 2;
                        const blueCenterY = nearestBlue.enemy.y + nearestBlue.enemy.height / 2;

                        if (enemy.x < blueCenterX) moveVector.x = enemy.speed;
                        if (enemy.x > blueCenterX) moveVector.x = -enemy.speed;
                        if (enemy.y < blueCenterY) moveVector.y = enemy.speed;
                        if (enemy.y > blueCenterY) moveVector.y = -enemy.speed;
                    } else {
                        // If no blue enemies are found, move toward player
                        if (enemy.x < player.x) moveVector.x = enemy.speed;
                        if (enemy.x > player.x) moveVector.x = -enemy.speed;
                        if (enemy.y < player.y) moveVector.y = enemy.speed;
                        if (enemy.y > player.y) moveVector.y = -enemy.speed;
                    }
                    break;

                case MOVEMENT_PATTERNS.BLACK_STATIONARY.id:
                    // Stay in place (no movement)
                    moveVector = { x: 0, y: 0 };
                    break;

                // White enemy patterns
                case MOVEMENT_PATTERNS.WHITE_STATIONARY.id:
                    // Stay in place (no movement)
                    moveVector = { x: 0, y: 0 };
                    break;

                case MOVEMENT_PATTERNS.WHITE_RANDOM.id:
                    // Move in random directions
                    moveVector = calculateRandomMove(enemy, enemy.speed);
                    break;

                case MOVEMENT_PATTERNS.WHITE_ORTHOGONAL.id:
                    // Approach player orthogonally (horizontal or vertical only)
                    moveVector = calculateOrthogonalMove(
                        enemy.x, enemy.y,
                        player.x, player.y,
                        enemy.speed
                    );
                    break;

                default:
                    // Default: Move directly toward player
                    if (enemy.x < player.x) moveVector.x = enemy.speed;
                    if (enemy.x > player.x) moveVector.x = -enemy.speed;
                    if (enemy.y < player.y) moveVector.y = enemy.speed;
                    if (enemy.y > player.y) moveVector.y = -enemy.speed;
                    break;
            }

            // Apply movement vector
            newX += moveVector.x;
            newY += moveVector.y;

            // Keep within game bounds
            newX = Math.max(0, Math.min(GAME_WIDTH - enemy.width, newX));
            newY = Math.max(0, Math.min(getEffectiveGameHeight() - enemy.height, newY));

            // Check for rock collisions
            let canMoveX = true;
            let canMoveY = true;

            // Check rock collisions for X and Y movement separately
            for (const rock of rocks) {
                // Check X movement collision
                if (
                    newX < rock.x + rock.width &&
                    newX + enemy.width > rock.x &&
                    enemy.y < rock.y + rock.height &&
                    enemy.y + enemy.height > rock.y
                ) {
                    canMoveX = false;
                }

                // Check Y movement collision
                if (
                    enemy.x < rock.x + rock.width &&
                    enemy.x + enemy.width > rock.x &&
                    newY < rock.y + rock.height &&
                    newY + enemy.height > rock.y
                ) {
                    canMoveY = false;
                }
            }

            // Apply movement if possible
            if (!canMoveX) {
                newX = enemy.x;
            }
            if (!canMoveY) {
                newY = enemy.y;
            }

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
            pos1.newY = Math.max(0, Math.min(getEffectiveGameHeight() - pos1.enemy.height, pos1.newY));
            
            // Check for rock collisions after collision avoidance
            for (const rock of rocks) {
                if (
                    pos1.newX < rock.x + rock.width &&
                    pos1.newX + pos1.enemy.width > rock.x &&
                    pos1.newY < rock.y + rock.height &&
                    pos1.newY + pos1.enemy.height > rock.y
                ) {
                    // If collision with rock after avoidance, keep original position
                    pos1.newX = pos1.enemy.x;
                    pos1.newY = pos1.enemy.y;
                    break;
                }
            }
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
    const swordThickness = 13; // Increased by 30% (10 * 1.3 = 13)
    
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

// Check for collisions between player, enemies, and rocks
function checkCollisions() {
    // Check for sword collision with rocks when attacking
    if (player.isAttacking) {
        const swordHitbox = getSwordHitbox();
        
        rocks.forEach((rock, rockIndex) => {
            const swordRockCollision = 
                swordHitbox.x < rock.x + rock.width &&
                swordHitbox.x + swordHitbox.width > rock.x &&
                swordHitbox.y < rock.y + rock.height &&
                swordHitbox.y + swordHitbox.height > rock.y;
                
            if (swordRockCollision) {
                // Calculate damage multipliers
                let damageMultiplier = 1.0;
                
                // Check if player was moving during attack (dash attack) - now 3x damage
                const wasMovingDuringAttack = 
                    Math.abs(player.x - player.prevX) > 0.5 || 
                    Math.abs(player.y - player.prevY) > 0.5;
                    
                if (wasMovingDuringAttack) {
                    damageMultiplier *= 3.0; // Changed from 2.0 to 3.0
                }
                
                // Check for sword tip hit - still 2x damage
                const isSwordTipHit = 
                    player.swordAngle > 30 && 
                    player.swordAngle < 70;
                    
                if (isSwordTipHit) {
                    damageMultiplier *= 2.0;
                }
                
                // Note: if both conditions apply, it's 3.0 * 2.0 = 6.0x damage multiplier
                
                // Calculate rock damage (less than enemy damage)
                const damage = Math.floor((player.attack / 2) * damageMultiplier);
                
                // Damage the rock with isPlayerAttack flag set to true
                damageRock(rock, damage, true);
            }
        });
    }

    // Check for enemy collisions
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
            
            // Check if player was moving during attack (dash attack) - now 3x damage
            const wasMovingDuringAttack = 
                Math.abs(player.x - player.prevX) > 0.5 || 
                Math.abs(player.y - player.prevY) > 0.5;
                
            if (wasMovingDuringAttack) {
                damageMultiplier *= 3.0; // Changed from 2.0 to 3.0
                damageType += "DASH ATTACK! ";
            }
            
            // Check for sword tip hit (timing-based) - still 2x damage
            // We check the angle to determine if it's at the end of the swing
            // This is during the 'swing forward' part of the animation
            const isSwordTipHit = 
                player.swordAngle > 30 && 
                player.swordAngle < 70;
                
            if (isSwordTipHit) {
                damageMultiplier *= 2.0;
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
            
            // Determine knockback strength based on attack conditions
            let knockbackMultiplier = 1.0;
            let fixedKnockback = 0; // Fixed knockback amount that ignores resistance
            
            // When hitting with sword tip, knockback is 2x + small fixed knockback
            if (isSwordTipHit) {
                knockbackMultiplier = 2.0;
                fixedKnockback = 20; // Small fixed knockback
            }
            
            // When moving and hitting with sword tip, knockback is 5x + medium fixed knockback
            if (wasMovingDuringAttack && isSwordTipHit) {
                knockbackMultiplier = 5.0;
                fixedKnockback = 40; // Medium fixed knockback
            } 
            // When just moving (but not tip hit)
            else if (wasMovingDuringAttack) {
                knockbackMultiplier = 2.0;
            }
            
            // Apply knockback based on attack direction, not current direction
            applyKnockback(enemy, player.attackDirection, knockbackMultiplier, fixedKnockback);
            
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
            // Calculate damage based on movement and position
            let damageMultiplier = 1.0;
            let damage = enemy.attack;
            let damageType = "";
            
            // Check if player is moving (takes more damage)
            if (player.isMoving) {
                damageMultiplier = player.movingDefenseMultiplier;
                damageType += "MOVING! ";
            }
            
            // Check if attack is from behind (backstab - 2x damage)
            // This is determined by comparing the enemy's position relative to the player's facing direction
            let isBackstab = false;
            switch(player.direction) {
                case 'right':
                    isBackstab = enemy.x < player.x; // Enemy is to the left while player faces right
                    break;
                case 'left':
                    isBackstab = enemy.x > player.x; // Enemy is to the right while player faces left
                    break;
                case 'up':
                    isBackstab = enemy.y > player.y; // Enemy is below while player faces up
                    break;
                case 'down':
                    isBackstab = enemy.y < player.y; // Enemy is above while player faces down
                    break;
            }
            
            if (isBackstab) {
                damageMultiplier *= 2.0; // Double damage for backstab
                damageType += "BACKSTAB! ";
            }
            
            // Calculate final damage with all multipliers
            damage = Math.floor(enemy.attack * damageMultiplier);
            
            // Apply damage
            player.hp -= damage;

            // Show damage text above player
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y;

            // Only cancel bow drawing when hit from behind
            if (player.isDrawingBow && isBackstab) {
                cancelBowDrawing();
                showDamageText(playerCenterX, playerCenterY - 40, "BOW CANCELED - BACKSTABBED!", false);
            }
            showDamageText(playerCenterX, playerCenterY, `-${damage}`, damageMultiplier > 1);
            
            // Show backstab or moving damage message if applicable
            if (damageType) {
                showDamageText(playerCenterX, playerCenterY - 30, damageType, true);
            }
            
            // Break combo when taking damage
            breakCombo();
            
            // Visual feedback
            if (isBackstab) {
                // Special visual effect for backstab (red flash)
                playerElement.style.backgroundColor = 'crimson';
                playerElement.classList.add('backstabbed');
                setTimeout(() => {
                    playerElement.style.backgroundColor = 'blue';
                    playerElement.classList.remove('backstabbed');
                }, 400);
            } else {
                // Regular hit effect (blue flash)
                playerElement.style.backgroundColor = 'lightblue';
                setTimeout(() => {
                    playerElement.style.backgroundColor = 'blue';
                }, 200);
            }
            
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
        // Calculate new position
        const newX = player.x + stepX;
        const newY = player.y + stepY;
        
        // Check boundaries
        let canMoveX = newX >= 0 && newX <= GAME_WIDTH - player.width;
        let canMoveY = newY >= 0 && newY <= getEffectiveGameHeight() - player.height;
        
        // Check for rock collisions
        for (const rock of rocks) {
            // Check X movement collision
            if (
                newX < rock.x + rock.width &&
                newX + player.width > rock.x &&
                player.y < rock.y + rock.height &&
                player.y + player.height > rock.y
            ) {
                canMoveX = false;
                // Rock stops knockback immediately
                clearInterval(knockbackInterval);
                player.isKnockedBack = false;
                playerElement.classList.remove('knocked-back');
                
                // Damage the rock when player is knocked into it
                damageRock(rock, 10);
            }
            
            // Check Y movement collision
            if (
                player.x < rock.x + rock.width &&
                player.x + player.width > rock.x &&
                newY < rock.y + rock.height &&
                newY + player.height > rock.y
            ) {
                canMoveY = false;
                // Rock stops knockback immediately
                clearInterval(knockbackInterval);
                player.isKnockedBack = false;
                playerElement.classList.remove('knocked-back');
                
                // Damage the rock when player is knocked into it
                damageRock(rock, 10);
            }
        }
        
        // Apply movement if possible
        if (canMoveX) {
            player.x = newX;
        }
        if (canMoveY) {
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

// Damage a rock and update visuals
function damageRock(rock, damage, isPlayerAttack = false) {
    rock.hp -= damage;
    
    // Show damage text
    const rockCenterX = rock.x + rock.width / 2;
    const rockCenterY = rock.y;
    showDamageText(rockCenterX, rockCenterY, damage, false);
    
    // Visual feedback
    rock.element.classList.add('rock-hit');
    setTimeout(() => {
        rock.element.classList.remove('rock-hit');
    }, 200);
    
    // Update health bar
    const healthPercent = Math.max(0, rock.hp / rock.maxHp * 100);
    const healthBar = rock.element.querySelector('.rock-health');
    if (healthBar) {
        healthBar.style.width = `${healthPercent}%`;
        
        // Change health bar color based on remaining health
        if (healthPercent < 30) {
            healthBar.style.backgroundColor = 'red';
        } else if (healthPercent < 60) {
            healthBar.style.backgroundColor = 'orange';
        }
    }
    
    // Check if rock is destroyed
    if (rock.hp <= 0) {
        // Add visual effect for destruction
        const explosion = document.createElement('div');
        explosion.className = 'rock-explosion';
        explosion.style.left = rock.x + 'px';
        explosion.style.top = rock.y + 'px';
        gameScreen.appendChild(explosion);
        
        // Show destruction text
        showDamageText(rockCenterX, rockCenterY - 20, "DESTROYED!", true);
        
        // If destroyed by player attack, add a gem
        if (isPlayerAttack) {
            // Add gem to player
            addGem();
            
            // Show gem message
            showDamageText(rockCenterX, rockCenterY - 40, "+1 GEM!", true);
        }
        
        // Remove rock after explosion animation
        setTimeout(() => {
            if (explosion.parentNode) {
                explosion.remove();
            }
        }, 1000);
        
        // Remove rock from game
        if (rock.element.parentNode) {
            rock.element.remove();
        }
        
        // Remove from rocks array
        const index = rocks.indexOf(rock);
        if (index > -1) {
            rocks.splice(index, 1);
        }
    }
}

// Apply knockback to enemy based on direction and multiplier
function applyKnockback(enemy, direction, knockbackMultiplier = 1.0, fixedKnockback = 0) {
    // Calculate effective resistance based on player's knockback strength
    // Higher player knockback strength reduces enemy resistance
    // New formula: effectiveResistance = originalResistance * (1 / sqrt(knockbackStrengthMultiplier))
    // This creates a more gradual reduction in resistance
    // Example: knockbackStrengthMultiplier of 4.0 reduces resistance to 50% instead of 25%
    const effectiveResistance = enemy.knockbackResistance / Math.sqrt(Math.max(1, player.knockbackStrengthMultiplier));
    
    // Variable to track if knockback was resisted
    let knockbackResisted = false;
    
    // Only apply resistance check if there's no fixed knockback component
    // Otherwise the fixed knockback will always apply, and only the multiplier part can be resisted
    if (fixedKnockback === 0) {
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
            
            // If there's no fixed knockback, we can just return
            if (fixedKnockback === 0) {
                return;
            }
            
            // Otherwise mark as resisted but continue to apply fixed knockback
            knockbackResisted = true;
            knockbackMultiplier = 0; // Zero out the multiplier part since it was resisted
        }
    }
    
    enemy.isKnockedBack = true;
    
    // Visual indicator for knockback
    enemy.element.classList.add('knocked-back');
    
    // If this is a strong knockback, add a special class
    if (knockbackMultiplier > 1.0 || fixedKnockback > 0) {
        enemy.element.classList.add('strong-knockback');
        setTimeout(() => {
            enemy.element.classList.remove('strong-knockback');
        }, 500);
    }
    
    // Show fixed knockback text if applicable
    if (fixedKnockback > 0) {
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y;
        if (knockbackResisted) {
            showDamageText(enemyCenterX, enemyCenterY - 40, "FIXED KNOCKBACK!", true);
        } else {
            showDamageText(enemyCenterX, enemyCenterY - 40, "SUPER KNOCKBACK!", true);
        }
    }
    
    // Calculate knockback direction
    let knockbackX = 0;
    let knockbackY = 0;
    
    // Base knockback distance - increased for more impact
    // Now also consider player's knockback strength multiplier, but with a more gradual curve
    // Using Math.sqrt for a more gradual increase in knockback power
    const knockbackPower = 1 + Math.sqrt(player.knockbackStrengthMultiplier - 1) * 0.5;
    const baseKnockback = (enemy.knockbackDistance * knockbackMultiplier * knockbackPower) + fixedKnockback;
    
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
        let canMoveX = newX >= 0 && newX <= GAME_WIDTH - enemy.width;
        let canMoveY = newY >= 0 && newY <= getEffectiveGameHeight() - enemy.height;
        
        // Check for rock collisions
        for (const rock of rocks) {
            // Check X movement collision
            if (
                newX < rock.x + rock.width &&
                newX + enemy.width > rock.x &&
                enemy.y < rock.y + rock.height &&
                enemy.y + enemy.height > rock.y
            ) {
                canMoveX = false;
                // Rock stops knockback immediately
                enemy.isKnockedBack = false;
                enemy.element.classList.remove('knocked-back');
                
                // Damage the rock when enemy is knocked into it
                damageRock(rock, 5 + Math.floor(player.level / 2)); // Damage scales with player level
                return; // Exit the step function
            }
            
            // Check Y movement collision
            if (
                enemy.x < rock.x + rock.width &&
                enemy.x + enemy.width > rock.x &&
                newY < rock.y + rock.height &&
                newY + enemy.height > rock.y
            ) {
                canMoveY = false;
                // Rock stops knockback immediately
                enemy.isKnockedBack = false;
                enemy.element.classList.remove('knocked-back');
                
                // Damage the rock when enemy is knocked into it
                damageRock(rock, 5 + Math.floor(player.level / 2)); // Damage scales with player level
                return; // Exit the step function
            }
        }
        
        // Apply movement if possible
        if (canMoveX) {
            enemy.x = newX;
        }
        if (canMoveY) {
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
        if (enemy.isKnockedBack) { // Only if still in knockback state
            enemy.isKnockedBack = false;
            enemy.element.classList.remove('knocked-back');
            enemy.element.style.transform = 'none';
        }
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

    // Prevent selecting arrows bonus if it would exceed max arrows
    if (bonusType === 'arrows' && player.arrows + 10 > player.maxArrows) {
        showDamageText(player.x + player.width/2, player.y - 20, "ARROWS AT MAX CAPACITY!", false);
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
        case 'arrows':
            // Charge 10 arrows
            player.arrows = Math.min(player.maxArrows, player.arrows + 10);
            bonusText = 'ARROWS +10!';
            updateArrowDisplay();
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

    // Add 2 arrows for leveling up
    player.arrows = Math.min(player.maxArrows, player.arrows + 2);
    showDamageText(playerCenterX, healTextY - 20, "+2 ARROWS", true);
    updateArrowDisplay();
    
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

// Function to share score to X (Twitter)
function shareToX() {
    // Create share text
    const shareText = `I reached Level ${player.level} and earned ${player.exp} EXP in Simple RPG Game!`;
    
    // Create share URL with text and game URL
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(GAME_REPO_URL)}`;
    
    // Open share dialog in a new window
    window.open(shareUrl, '_blank', 'width=550,height=420');
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
                // Use horizontal sword as is (increased by 30%)
                swordElement.style.width = '39px';
                swordElement.style.height = '8px';
                // Remove up/down classes
                swordElement.classList.remove('sword-up', 'sword-down');
                break;
                
            case 'left':
                // Left: Sword extends from left side of player
                swordElement.style.left = `${player.x}px`;
                swordElement.style.top = `${playerCenterY - 3}px`;
                swordElement.style.transformOrigin = 'left center';
                // Use horizontal sword as is (increased by 30%)
                swordElement.style.width = '39px';
                swordElement.style.height = '8px';
                // Remove up/down classes
                swordElement.classList.remove('sword-up', 'sword-down');
                break;
                
            case 'up':
                // Up: Sword extending from top of player
                // Position with slight offset from center
                swordElement.style.left = `${playerCenterX - 3}px`;
                swordElement.style.top = `${player.y - 30}px`;
                swordElement.style.transformOrigin = 'center bottom';
                // Swap width and height to make it vertical (increased by 30%)
                swordElement.style.width = '8px';
                swordElement.style.height = '39px';

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
                // Swap width and height to make it vertical (increased by 30%)
                swordElement.style.width = '8px';
                swordElement.style.height = '39px';

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

// Helper functions for enemy movement patterns

// Function to find the nearest rock
function findNearestRock(enemyX, enemyY) {
    let nearestRock = null;
    let minDistance = Infinity;

    rocks.forEach(rock => {
        const rockCenterX = rock.x + rock.width / 2;
        const rockCenterY = rock.y + rock.height / 2;
        const enemyCenterX = enemyX + 15; // Enemy center (half of width 30)
        const enemyCenterY = enemyY + 15; // Enemy center (half of height 30)

        const distance = Math.sqrt(
            Math.pow(rockCenterX - enemyCenterX, 2) +
            Math.pow(rockCenterY - enemyCenterY, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestRock = rock;
        }
    });

    return { rock: nearestRock, distance: minDistance };
}

// Function to find the nearest enemy of a specific type
function findNearestEnemyOfType(enemyX, enemyY, targetType, selfId) {
    let nearestEnemy = null;
    let minDistance = Infinity;

    enemies.forEach(otherEnemy => {
        // Exclude self
        if (otherEnemy.id === selfId) return;

        // Only target enemies of the specified type
        if (otherEnemy.type.color !== targetType) return;

        const otherEnemyCenterX = otherEnemy.x + otherEnemy.width / 2;
        const otherEnemyCenterY = otherEnemy.y + otherEnemy.height / 2;
        const enemyCenterX = enemyX + 15;
        const enemyCenterY = enemyY + 15;

        const distance = Math.sqrt(
            Math.pow(otherEnemyCenterX - enemyCenterX, 2) +
            Math.pow(otherEnemyCenterY - enemyCenterY, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestEnemy = otherEnemy;
        }
    });

    return { enemy: nearestEnemy, distance: minDistance };
}

// Calculate vector to move away from target
function calculateMoveAwayVector(fromX, fromY, targetX, targetY, speed) {
    const dx = fromX - targetX;
    const dy = fromY - targetY;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;

    return {
        x: (dx / length) * speed,
        y: (dy / length) * speed
    };
}

// Calculate orthogonal movement (horizontal or vertical only)
function calculateOrthogonalMove(fromX, fromY, targetX, targetY, speed) {
    // Compare distances on x and y axes
    const dx = targetX - fromX;
    const dy = targetY - fromY;

    // Initialize movement vector
    let moveX = 0;
    let moveY = 0;

    // Alternate between horizontal/vertical movement
    // Based on position instead of timer
    const shouldMoveHorizontally = (Math.floor(fromX / 50) + Math.floor(fromY / 50)) % 2 === 0;

    if (shouldMoveHorizontally) {
        // Horizontal movement only
        moveX = dx > 0 ? speed : (dx < 0 ? -speed : 0);
    } else {
        // Vertical movement only
        moveY = dy > 0 ? speed : (dy < 0 ? -speed : 0);
    }

    return { x: moveX, y: moveY };
}

// Calculate random movement
function calculateRandomMove(enemy, speed) {
    // Update random direction every 6 seconds
    if (!enemy.randomDirection || Date.now() - (enemy.lastDirectionChange || 0) > 6000) {
        const angle = Math.random() * Math.PI * 2; // Random angle
        enemy.randomDirection = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
        enemy.lastDirectionChange = Date.now();
    }

    return {
        x: enemy.randomDirection.x * speed,
        y: enemy.randomDirection.y * speed
    };
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
    moveArrows();
    checkCollisions();
    spawnEnemy();
    processHealEffects();
    updateBowDrawing();

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

// Touch controls variables
let touchStartX = 0;
let touchStartY = 0;
let touchMoveX = 0;
let touchMoveY = 0;
let isTouching = false;
let touchThreshold = 30; // Minimum distance to consider as a swipe

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

    // Bow and arrow control with V key (single press)
    if (e.key === 'v' || e.key === 'V') {
        // If already drawing bow, shoot arrow
        if (player.isDrawingBow) {
            shootArrow();
        }
        // If not drawing and has arrows, start drawing
        else if (player.arrows > 0) {
            startDrawingBow();
        }
        // No arrows available
        else {
            showDamageText(player.x + player.width/2, player.y - 20, "NO ARROWS!", false);
        }
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
        } else if (e.key === '5') {
            applyBonus('arrows');
        }
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});

// Touch controls for mobile devices - enable for all devices for testing
// Set up touch controls after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const gameScreenElement = document.getElementById('game-screen');
    
    // Prevent default touch behavior to avoid scrolling while playing
    gameScreenElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    gameScreenElement.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // Touch start handler
    gameScreenElement.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        isTouching = true;
    });
    
    // Touch move handler for swipe movement
    gameScreenElement.addEventListener('touchmove', (e) => {
        if (!isTouching) return;
        
        const touch = e.touches[0];
        touchMoveX = touch.clientX;
        touchMoveY = touch.clientY;
        
        // Calculate delta movement
        const deltaX = touchMoveX - touchStartX;
        const deltaY = touchMoveY - touchStartY;
        
        // Determine movement direction
        if (Math.abs(deltaX) > touchThreshold || Math.abs(deltaY) > touchThreshold) {
            // Reset all keys first
            keysPressed['ArrowUp'] = false;
            keysPressed['ArrowDown'] = false;
            keysPressed['ArrowLeft'] = false;
            keysPressed['ArrowRight'] = false;
            
            // Set direction keys based on swipe
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal movement dominant
                if (deltaX > 0) {
                    keysPressed['ArrowRight'] = true;
                    player.direction = 'right';
                } else {
                    keysPressed['ArrowLeft'] = true;
                    player.direction = 'left';
                }
            } else {
                // Vertical movement dominant
                if (deltaY > 0) {
                    keysPressed['ArrowDown'] = true;
                    player.direction = 'down';
                } else {
                    keysPressed['ArrowUp'] = true;
                    player.direction = 'up';
                }
            }
            
            // Update start position for continuous movement
            touchStartX = touchMoveX;
            touchStartY = touchMoveY;
        }
    });
    
    // Touch end handler
    gameScreenElement.addEventListener('touchend', (e) => {
        // Stop all movement
        keysPressed['ArrowUp'] = false;
        keysPressed['ArrowDown'] = false;
        keysPressed['ArrowLeft'] = false;
        keysPressed['ArrowRight'] = false;
        isTouching = false;
        
        // If it was a short tap (not a long swipe), perform attack
        const deltaX = touchMoveX - touchStartX;
        const deltaY = touchMoveY - touchStartY;
        
        if (Math.abs(deltaX) < touchThreshold && Math.abs(deltaY) < touchThreshold) {
            attack();
        }
    });
    
    // Add touch handlers for buttons
    document.getElementById('attack-btn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        attack();
    });
    
    document.getElementById('heal-btn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        heal();
    });
    
    document.getElementById('restart-btn').addEventListener('touchstart', (e) => {
        e.preventDefault();
        initGame();
    });
    
    // Mobile-specific buttons
    const mobileHealBtn = document.getElementById('mobile-heal-btn');
    if (mobileHealBtn) {
        mobileHealBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            heal();
        });
    }
    
    const mobileBowBtn = document.getElementById('mobile-bow-btn');
    if (mobileBowBtn) {
        mobileBowBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleBowButton();
        });
    }

    const mobileGemBtn = document.getElementById('mobile-gem-btn');
    if (mobileGemBtn) {
        mobileGemBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            useGem();
        });
    }
});

// Game control buttons
attackBtn.addEventListener('click', attack);
healBtn.addEventListener('click', heal);
bowBtn.addEventListener('click', handleBowButton);
// Simply call initialization directly
restartBtn.addEventListener('click', initGame);

// Handle bow button click
function handleBowButton() {
    // If already drawing bow, shoot arrow
    if (player.isDrawingBow) {
        shootArrow();
    }
    // If not drawing and has arrows, start drawing
    else if (player.arrows > 0) {
        startDrawingBow();
    }
    // No arrows available
    else {
        showDamageText(player.x + player.width/2, player.y - 20, "NO ARROWS!", false);
    }
}

// Bonus buttons
bonusHpBtn.addEventListener('click', () => applyBonus('hp'));
bonusHealBtn.addEventListener('click', () => applyBonus('heal'));
bonusAttackBtn.addEventListener('click', () => applyBonus('attack'));
bonusKnockbackBtn.addEventListener('click', () => applyBonus('knockback'));
bonusArrowsBtn.addEventListener('click', () => applyBonus('arrows'));

// Track whether cheat mode has been used
let cheatModeUsed = false;

// Arrow UI container
const arrowsContainer = document.createElement('div');
arrowsContainer.id = 'arrows-container';
arrowsContainer.style.position = 'absolute';
arrowsContainer.style.top = '5px';
arrowsContainer.style.right = '5px';
arrowsContainer.style.display = 'flex';
arrowsContainer.style.flexDirection = 'column';
arrowsContainer.style.alignItems = 'flex-end';
gameScreen.appendChild(arrowsContainer);

// Bow charge indicator
const bowChargeIndicator = document.createElement('div');
bowChargeIndicator.id = 'bow-charge-indicator';
bowChargeIndicator.style.position = 'absolute';
bowChargeIndicator.style.display = 'none';
bowChargeIndicator.style.width = '0%';
bowChargeIndicator.style.height = '4px';
bowChargeIndicator.style.bottom = '-6px';
bowChargeIndicator.style.left = '0';
bowChargeIndicator.style.backgroundColor = '#ffaa00';
bowChargeIndicator.style.borderRadius = '2px';
bowChargeIndicator.style.transition = 'width 0.1s';
playerElement.appendChild(bowChargeIndicator);

// Bow element
const bowElement = document.createElement('div');
bowElement.id = 'bow';
bowElement.style.position = 'absolute';
bowElement.style.width = '20px';
bowElement.style.height = '40px';
bowElement.style.borderRadius = '10px 0 0 10px';
bowElement.style.border = '2px solid #8B4513';
bowElement.style.borderRight = 'none';
bowElement.style.backgroundColor = 'transparent';
bowElement.style.display = 'none';
bowElement.style.zIndex = '99';
gameScreen.appendChild(bowElement);

// Arrow drawing power levels with time thresholds
const BOW_POWER_LEVELS = [
    { threshold: 0, damageMultiplier: 0.5, speed: 2, knockback: 10, color: '#aaaaaa' }, // 0-1 seconds
    { threshold: 1000, damageMultiplier: 1.2, speed: 5, knockback: 20, color: '#ffaa00' }, // 1-3 seconds
    { threshold: 3000, damageMultiplier: 2.0, speed: 7, knockback: 30, color: '#ff5500' }, // 3-5 seconds
    { threshold: 5000, damageMultiplier: 4.0, speed: 10, knockback: 50, color: '#ff0000' }, // 5-10 seconds
    { threshold: 10000, damageMultiplier: 8.0, speed: 15, knockback: 100, color: '#ff00ff' } // 10+ seconds
];

// Cheat mode function
function activateCheatMode() {
    // Only allow cheat mode to be used once
    if (cheatModeUsed) {
        // Play a failure sound
        const failAudio = new Audio('data:audio/wav;base64,UklGRngEAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YVQEAAAAAPBkZGQfHx/BwcH///8AAAAAAACzs7P///+ampr///////8AAAD///////8AAACgoKD///8AAAAAAAD///8AAAD///////////////////8AAAD///8AAABVVVX///9sbGwAAAAAAAD///8AAAD///////////////////9AQED///8AAADMzMy+vr5RUVH///////////9mZmb///////+zs7P///8AAAD///8AAAD///////////8bGxv///8AAADMzMx3d3cAAAAfHx////////9VVVX///////////////8AAAD///8AAAD///////////8AAAD///8AAAAAAAAAAAAAAACrq6v///////////8AAAD///////////////////+Dg4P///////////////////////////////9mZmb///////////8AAAAAAAD///9ERET///////////////////8AAAAAAAAAAAAAAAD///8AAAAAAAAAAAAAAADMzMxEREQAAAAAAACHh4f///+SkpIAAAAAAAAAAAAhISHd3d3/// / ///8AAAD///8AAAD///8AAAC/v78AAAAoKCgAAAAAAAAAAACzs7P///+Hh4cAAADe3t7///8AAAD///////////8AAAD///8AAAD///8AAAD///8AAABQUE D///////////////////8AAAD///8AAAD////v7+/w8PC9vb3h4eH///////////8AAAD///8AAABVVVX///////////////////8AAAD///8AAAD///////////////////////////////9VVVX///////////8AAAD///8AAAAAAABiYmL///+jo6MAAAD///8AAAD///////////////+Dg4P///////////////////////////9mZmb///////////8AAAD///8AAAD////v7+/w8PA4ODjh4eH///////////8AAAD///////////+NjY3///////////////////8AAADa2to4ODgAAADAwMD////////x8fH///+GhoYAAAAAAAAAAAD///////////////////////////////9VVVX///////////8AAAD///8AAAA=');
        failAudio.volume = 0.3;
        failAudio.play();
        
        // Show message that cheat can only be used once
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;
        showDamageText(centerX, centerY, "CHEAT ALREADY USED!", false);
        
        // Reset the click counter
        cheatClickCount = 0;
        return;
    }
    
    // Play a success sound
    const audio = new Audio('data:audio/wav;base64,UklGRl9vAQBXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTtvAQAAAAAAAAAAAAAAAAD///////////////////////////9sbGz///////////9MTEz///////////8UFBQICAgAAAAAAAAMDAwYGBgAAAAAAAAAAAAUFBT///////////////////+AgID///////+MjIyEhIT///////////9UVFT///////////9AQED///////////9QUFBISEj///////////9YWFj///////////84ODj///////////9QUFBAQEDw8PD///////+cnJyUlJT///////////9wcHD///////////8gICDw8PD///////8AAAD///////////8AAAD///////+kpKT///////+srKysrKz///////////+UlJT///////////9wcHD///////////9ISEj///////8=');
    audio.volume = 0.3;
    audio.play();
    
    // Add 10 gems instead of 255
    for (let i = 0; i < 10; i++) {
        addGem();
    }
    
    // Show feedback
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    showDamageText(centerX, centerY, "CHEAT ACTIVATED! +10 GEMS", true);
    
    // Mark cheat mode as used
    cheatModeUsed = true;
    
    // Reset the click counter
    cheatClickCount = 0;
    
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

// Add rock CSS styles dynamically
function addRockStyles() {
    const rockStyles = document.createElement('style');
    rockStyles.textContent = `
        /* Rock (obstacle) styles */
        .rock {
            position: absolute;
            width: 50px;
            height: 50px;
            background-color: #555;
            border-radius: 8px;
            box-shadow: inset 0 0 10px #222, 0 0 5px rgba(0, 0, 0, 0.5);
            z-index: 50;
            overflow: hidden;
            transition: transform 0.2s;
        }
        
        .rock-health {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 4px;
            width: 100%;
            background-color: #27ae60;
            transition: width 0.3s, background-color 0.3s;
        }
        
        .rock-hit {
            animation: rock-hit 0.2s;
        }
        
        @keyframes rock-hit {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); background-color: #777; }
            100% { transform: scale(1); }
        }
        
        .rock-explosion {
            position: absolute;
            width: 60px;
            height: 60px;
            margin-left: -5px;
            margin-top: -5px;
            background-color: #555;
            border-radius: 50%;
            z-index: 100;
            animation: rock-explode 1s forwards;
            opacity: 1;
            pointer-events: none;
        }
        
        @keyframes rock-explode {
            0% { transform: scale(1); opacity: 1; }
            20% { transform: scale(1.2); background-color: #777; opacity: 0.9; }
            50% { transform: scale(1.5); background-color: #999; opacity: 0.7; box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); }
            100% { transform: scale(2); background-color: #aaa; opacity: 0; }
        }
        
        /* Backstab effect style */
        .backstabbed {
            animation: backstab-effect 0.4s ease-in-out;
            box-shadow: 0 0 20px red !important;
            z-index: 300;
        }
        
        @keyframes backstab-effect {
            0% { transform: scale(1); }
            30% { transform: scale(1.3) rotate(-5deg); }
            60% { transform: scale(1.2) rotate(5deg); }
            100% { transform: scale(1); }
        }
    `;
    
    document.head.appendChild(rockStyles);
}

// Start the game when loaded - using direct initialization
window.addEventListener('load', function() {
    // Add rock styles first
    addRockStyles();
    // Then initialize the game
    initGame();
});