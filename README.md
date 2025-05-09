# Simple RPG Game

A lightweight browser-based action RPG designed for casual gaming and time-killing fun. This simple game features engaging combat mechanics, different enemy types, and character progression with no installation required.

## About

This game was created as a fun time-killer that you can play directly in your browser. Perfect for short breaks or when you need a quick gaming session to pass the time. The simple yet engaging mechanics make it easy to pick up but challenging to master.

## How to Play

1. Open `index.html` in your web browser to start the game.

2. **Game Controls:**
   - Use **Arrow Keys** to move your character
   - Press **Spacebar** or click the Attack button to attack
   - Press **H** or click the Heal button to recover health over time
   - Press **G** to use collected gems for special bonuses
   - Press **R** or click Restart Game to start over

3. **Combat Mechanics:**
   - Attack enemies by hitting them with your sword
   - Different enemies have different stats (health, attack, speed, etc.)
   - Perform **Dash Attacks** by moving while attacking for 3x damage and enhanced knockback
   - Land **Sword Tip Hits** for 2x damage and fixed knockback that ignores enemy resistance
   - Combined techniques (moving + sword tip) deal 6x damage and 5x knockback with medium fixed knockback
   - Build **Combos** by defeating enemies in quick succession for bonus experience
   - **Critical Hits** give bonus experience (2-4x) when defeating enemies
   - Watch your positioning - you take **double damage** from backstab attacks when hit from behind
   - Use **Rock Obstacles** strategically - they block both enemy and player movement, but can be destroyed for gems

4. **Character Progression:**
   - Gain experience by defeating enemies
   - Level up to increase your stats and recover 20% of your max health
   - Collect gems when leveling up or by destroying rock obstacles
   - Use gems to purchase permanent bonuses:
     - **HP+20 [1]**: Increase max health by 20 points (press 1 to select)
     - **HEAL-1s/+20% [2]**: Decrease heal cooldown by 1s or increase healing amount by 20% (press 2 to select)
     - **ATK+5 [3]**: Increase attack damage by 5 points (press 3 to select)
     - **KNOCK/RESIST+ [4]**: Improve knockback resistance and strength (press 4 to select)
   - Rocks: New rock obstacles appear every 5 player levels

5. **Enemy Types:**
   - **Blue**: Fast, weak enemies with low health (Level 1+)
   - **Red**: Balanced enemies with medium stats (Level 3+)
   - **Black**: Slow, tough enemies with high health and attack (Level 7+)
   - **White**: Rare, very powerful enemies with massive health and damage (Level 15+)

## Tips

- Stay mobile to avoid enemy attacks, but be aware of enemy positions relative to your facing direction
- Keep an eye on your surroundings - you take double damage from backstab attacks from behind
- Use knockback strategically to create space between you and enemies
- Position yourself so you face multiple enemies at once to avoid backstabs 
- Time your healing for maximum effectiveness
- Save gems for when you need them most
- More powerful enemies give more experience
- Critical hits give bonus experience, so aim for them when defeating enemies
- Use rocks as barriers to control enemy movement and protect your back
- Break rocks to earn additional gems if you need quick upgrades
- Combine dash attacks with sword tip hits for maximum damage and knockback
- Use fixed knockback abilities against high-resistance enemies (like black/white enemies)

## Secret

Try clicking on "Level" multiple times for a surprise!

## Development

This game is built with pure JavaScript, HTML, and CSS. No external libraries or frameworks are required.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Enjoy the game!