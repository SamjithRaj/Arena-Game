window.WeaponSystem = {
    weapons: [],
    projectiles: [],
    weaponSpawnTimer: 0,
    
    weaponTypes: [
        { name: 'sword', damage: 2, color: '#c0c0c0', symbol: '⚔️', type: 'melee', range: 0 },
        { name: 'hammer', damage: 3, color: '#8b4513', symbol: '🔨', type: 'melee', range: 0, knockback: 8 },
        { name: 'axe', damage: 2, color: '#696969', symbol: '🪓', type: 'melee', range: 0 },
        { name: 'spear', damage: 2, color: '#4169e1', symbol: '🗡️', type: 'melee', range: 30 },
        // Shotgun: wider spread (0.6 instead of 0.3), 12 pellets
        { name: 'shotgun', damage: 1, color: '#8b0000', symbol: '🔫', image: window.GameAssets.shotgunImg, type: 'ranged', range: 150, spread: 0.6, pellets: 12, recoil: 12 },
        // Pistol: infinite range (Infinity), 1 bullet, no fall off
        { name: 'pistol', damage: 1, color: '#2f4f4f', symbol: '🔫', image: window.GameAssets.pistolImg, type: 'ranged', range: Infinity, spread: 0.0, pellets: 1, recoil: 3 },
        // Shield: adds an aura
        { name: 'shield', damage: 0, color: '#4169e1', symbol: '🛡️', type: 'defense', durability: 5, blockDamage: true }
    ],

    spawnWeapon(centerX, centerY, arenaRadius) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (arenaRadius - 100);
        const weapon = {
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            type: this.weaponTypes[Math.floor(Math.random() * this.weaponTypes.length)],
            rotation: 0,
            timer: 210
        };
        this.weapons.push(weapon);
        if (window.GameCore && window.GameCore.spawnParticles) {
            window.GameCore.spawnParticles(weapon.x, weapon.y, weapon.type.color, 'ring');
        }
    },

    shootWeapon(shooter, target) {
        const weapon = shooter.weapon;
        if (!weapon) return;
        
        const baseAngle = Math.atan2(target.y - shooter.y, target.x - shooter.x);
        
        if (weapon.name === 'shotgun') {
            for (let i = 0; i < weapon.pellets; i++) {
                const spreadAngle = baseAngle + (Math.random() - 0.5) * weapon.spread;
                const speed = 12;
                this.projectiles.push({
                    x: shooter.x,
                    y: shooter.y,
                    vx: Math.cos(spreadAngle) * speed,
                    vy: Math.sin(spreadAngle) * speed,
                    damage: weapon.damage,
                    owner: shooter,
                    range: weapon.range,
                    traveled: 0,
                    radius: 3
                });
            }
            shooter.shootCooldown = 40;
            const recoilAngle = Math.atan2(shooter.y - target.y, shooter.x - target.x);
            shooter.vx += Math.cos(recoilAngle) * weapon.recoil;
            shooter.vy += Math.sin(recoilAngle) * weapon.recoil;
            shooter.weapon = null; // discard
            
        } else if (weapon.name === 'pistol') {
            const spreadAngle = baseAngle; // precise
            const speed = 18; // slightly faster
            this.projectiles.push({
                x: shooter.x,
                y: shooter.y,
                vx: Math.cos(spreadAngle) * speed,
                vy: Math.sin(spreadAngle) * speed,
                damage: weapon.damage,
                owner: shooter,
                range: weapon.range, // Infinity
                traveled: 0,
                radius: 4
            });
            shooter.shootCooldown = 8;
            const recoilAngle = Math.atan2(shooter.y - target.y, shooter.x - target.x);
            shooter.vx += Math.cos(recoilAngle) * weapon.recoil;
            shooter.vy += Math.sin(recoilAngle) * weapon.recoil;
            shooter.weapon = null; // discard
        }
    }
};
