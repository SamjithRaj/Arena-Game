window.GameCore = {
    player: null,
    ai: null,
    hearts: [],
    heartSpawnTimer: 0,
    uiCallback: null,
    gameOverCallback: null,

    init(cb, goCb) {
        this.uiCallback = cb;
        this.gameOverCallback = goCb;
        this.resetGame();
    },

    resetGame() {
        const config = window.GameConfig;
        const R = window.GameRenderer;
        
        this.player = {
            x: R.centerX - 150, y: R.centerY, vx: 0, vy: 0,
            radius: config.PLAYER_RADIUS, color: window.GameState.selectedColor,
            health: 10, weapon: null, blinkTimer: 0, hurtTimer: 0, shootCooldown: 0
        };

        this.ai = {
            x: R.centerX + 150, y: R.centerY, vx: Math.random() * 4 - 2, vy: Math.random() * 4 - 2,
            radius: config.PLAYER_RADIUS, color: '#ff4444',
            health: 10, weapon: null, blinkTimer: 0, hurtTimer: 0, shootCooldown: 0, changeDirectionTimer: 0
        };

        window.WeaponSystem.weapons = [];
        window.WeaponSystem.projectiles = [];
        window.WeaponSystem.weaponSpawnTimer = 0;
        this.hearts = [];
        this.heartSpawnTimer = 0;
        this.particles = [];
        this.deathDelay = 0;
        window.GameState.time = 0;
        
        this.uiCallback();
    },

    handleBoundaryCollision(entity) {
        const R = window.GameRenderer;
        const dx = entity.x - R.centerX;
        const dy = entity.y - R.centerY;
        const dist = Math.hypot(dx, dy);

        if (dist + entity.radius > window.GameConfig.ARENA_RADIUS) {
            const angle = Math.atan2(dy, dx);
            entity.x = R.centerX + Math.cos(angle) * (window.GameConfig.ARENA_RADIUS - entity.radius);
            entity.y = R.centerY + Math.sin(angle) * (window.GameConfig.ARENA_RADIUS - entity.radius);

            const normalX = dx / dist; const normalY = dy / dist;
            const dotProduct = entity.vx * normalX + entity.vy * normalY;

            entity.vx = (entity.vx - 2 * dotProduct * normalX) * window.GameConfig.BOUNCE_DAMPING;
            entity.vy = (entity.vy - 2 * dotProduct * normalY) * window.GameConfig.BOUNCE_DAMPING;
        }
    },

    spawnParticles(x, y, color, type) {
        if (type === 'death') {
            for (let i = 0; i < 50; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 2;
                this.particles.push({
                    x: x, y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 10 + 5,
                    life: 60 + Math.random() * 30,
                    maxLife: 90,
                    color: color,
                    type: 'pixel'
                });
            }
        } else if (type === 'ring') {
            this.particles.push({
                x: x, y: y,
                radius: 10,
                maxRadius: 100,
                life: 30,
                maxLife: 30,
                color: color,
                type: 'ring'
            });
        }
    },

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life--;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            if (p.type === 'pixel') {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.95;
                p.vy *= 0.95;
            } else if (p.type === 'ring') {
                p.radius += (p.maxRadius - p.radius) * 0.15;
            }
        }
    },

    update() {
        if (!this.player.dead) {
            const keys = window.GameState.keys;
            const speedAmt = 0.4;
            if (keys['w']) this.player.vy -= speedAmt;
            if (keys['s']) this.player.vy += speedAmt;
            if (keys['a']) this.player.vx -= speedAmt;
            if (keys['d']) this.player.vx += speedAmt;

            const pSpeed = Math.hypot(this.player.vx, this.player.vy);
            if (pSpeed > 5) {
                this.player.vx = (this.player.vx / pSpeed) * 5;
                this.player.vy = (this.player.vy / pSpeed) * 5;
            }

            this.player.vx *= window.GameConfig.FRICTION;
            this.player.vy *= window.GameConfig.FRICTION;
            this.player.x += this.player.vx;
            this.player.y += this.player.vy;
            this.handleBoundaryCollision(this.player);
        }

        if (!this.ai.dead) {
            this.updateAI();
        }

        this.updateProjectiles();
        this.updateParticles();
        
        // Items
        if (!this.player.dead) this.checkWeaponPickup(this.player);
        if (!this.ai.dead) this.checkWeaponPickup(this.ai);
        
        // Hearts
        for (let i = this.hearts.length - 1; i >= 0; i--) {
            const h = this.hearts[i];
            const dxP = this.player.x - h.x, dyP = this.player.y - h.y;
            if (Math.hypot(dxP, dyP) < this.player.radius + window.GameConfig.HEART_SIZE) {
                this.player.health = Math.min(10, this.player.health + 3);
                this.hearts.splice(i, 1);
                this.uiCallback();
                continue;
            }
            const dxA = this.ai.x - h.x, dyA = this.ai.y - h.y;
            if (Math.hypot(dxA, dyA) < this.ai.radius + window.GameConfig.HEART_SIZE) {
                this.ai.health = Math.min(10, this.ai.health + 3);
                this.hearts.splice(i, 1);
                this.uiCallback();
            }
        }

        this.checkCombat();

        // Weapon Spawns
        window.WeaponSystem.weaponSpawnTimer++;
        if (window.WeaponSystem.weaponSpawnTimer >= 180 + Math.random() * 120) {
            window.WeaponSystem.spawnWeapon(window.GameRenderer.centerX, window.GameRenderer.centerY, window.GameConfig.ARENA_RADIUS);
            window.WeaponSystem.weaponSpawnTimer = 0;
        }
        
        // Age Weapons
        for (let i = window.WeaponSystem.weapons.length - 1; i >= 0; i--) {
            window.WeaponSystem.weapons[i].timer--;
            if (window.WeaponSystem.weapons[i].timer <= 0) {
                window.WeaponSystem.weapons.splice(i, 1);
            } else {
                window.WeaponSystem.weapons[i].rotation += 0.05;
            }
        }

        this.heartSpawnTimer++;
        if (this.heartSpawnTimer >= 480) {
            this.spawnHeart();
            this.heartSpawnTimer = 0;
        }

        this.player.blinkTimer = Math.max(0, this.player.blinkTimer - 1);
        this.player.hurtTimer = Math.max(0, this.player.hurtTimer - 1);
        if (this.player.shootCooldown > 0) this.player.shootCooldown--;
        
        this.ai.blinkTimer = Math.max(0, this.ai.blinkTimer - 1);
        this.ai.hurtTimer = Math.max(0, this.ai.hurtTimer - 1);
        if (this.ai.shootCooldown > 0) this.ai.shootCooldown--;

        window.GameState.time++;

        const checkDeath = (entity) => {
            if (entity.health <= 0 && !entity.dead) {
                entity.dead = true;
                this.spawnParticles(entity.x, entity.y, entity.color, 'death');
            }
        };
        checkDeath(this.player);
        checkDeath(this.ai);

        if (this.player.dead || this.ai.dead) {
            this. मृत्युDelay = (this. मृत्युDelay || 0) + 1; // wait, let's use deathDelay
            this.deathDelay++;
            if (this.deathDelay > 90) {
                this.gameOverCallback(this.player.health <= 0 ? 'lose' : 'win');
            }
        }
    },

    spawnHeart() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (window.GameConfig.ARENA_RADIUS - 100);
        this.hearts.push({
            x: window.GameRenderer.centerX + Math.cos(angle) * dist,
            y: window.GameRenderer.centerY + Math.sin(angle) * dist,
            pulse: 0
        });
    },

    updateAI() {
        const ai = this.ai;
        const player = this.player;
        const weapons = window.WeaponSystem.weapons;
        let movingToTarget = false;

        if (!ai.weapon && weapons.length > 0) {
            let nearest = null; let minDist = Infinity;
            for (let w of weapons) {
                let d = Math.hypot(w.x - ai.x, w.y - ai.y);
                if (d < minDist) { minDist = d; nearest = w; }
            }
            if (minDist > 0) {
                ai.vx += ((nearest.x - ai.x) / minDist) * 0.3;
                ai.vy += ((nearest.y - ai.y) / minDist) * 0.3;
                movingToTarget = true;
            }
        } else if (ai.weapon && player.health > 0) {
            const dx = player.x - ai.x, dy = player.y - ai.y;
            const dist = Math.hypot(dx, dy);

            if (ai.weapon.type === 'ranged') {
                if (dist > (ai.weapon.range === Infinity ? 400 : ai.weapon.range * 0.8)) {
                    ai.vx += (dx / dist) * 0.3; ai.vy += (dy / dist) * 0.3;
                    movingToTarget = true;
                } else if (dist < (ai.weapon.range === Infinity ? 200 : ai.weapon.range * 0.4)) {
                    ai.vx -= (dx / dist) * 0.3; ai.vy -= (dy / dist) * 0.3;
                    movingToTarget = true;
                }
                if (ai.shootCooldown <= 0) window.WeaponSystem.shootWeapon(ai, player);
            } else if (ai.weapon.type === 'melee') {
                if (dist > 60) {
                    ai.vx += (dx / dist) * 0.3; ai.vy += (dy / dist) * 0.3;
                    movingToTarget = true;
                }
            }
        }

        if (!movingToTarget) {
            ai.changeDirectionTimer--;
            if (ai.changeDirectionTimer <= 0) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 1 + Math.random() * 2;
                ai.vx += Math.cos(angle) * spd; ai.vy += Math.sin(angle) * spd;
                ai.changeDirectionTimer = 40 + Math.random() * 80;
            }
        }

        const maxSpeed = movingToTarget ? 6 : 5;
        const pd = Math.hypot(ai.vx, ai.vy);
        if (pd > maxSpeed) {
            ai.vx = (ai.vx / pd) * maxSpeed; ai.vy = (ai.vy / pd) * maxSpeed;
        }
        ai.vx *= window.GameConfig.FRICTION; ai.vy *= window.GameConfig.FRICTION;
        ai.x += ai.vx; ai.y += ai.vy;
        this.handleBoundaryCollision(ai);
    },

    updateProjectiles() {
        const projs = window.WeaponSystem.projectiles;
        const R = window.GameRenderer;
        for (let i = projs.length - 1; i >= 0; i--) {
            const p = projs[i];
            p.x += p.vx; p.y += p.vy;
            p.traveled += Math.hypot(p.vx, p.vy);

            if (Math.hypot(p.x - R.centerX, p.y - R.centerY) > window.GameConfig.ARENA_RADIUS || p.traveled > p.range) {
                projs.splice(i, 1); continue;
            }

            const targets = [this.player, this.ai];
            for (const t of targets) {
                if (t === p.owner) continue;
                if (Math.hypot(p.x - t.x, p.y - t.y) < t.radius) {
                    if (t.weapon && t.weapon.name === 'shield' && t.weapon.durability > 0) {
                        t.weapon.durability--;
                        if (t.weapon.durability <= 0) t.weapon = null;
                        this.uiCallback();
                    } else {
                        t.health -= p.damage; t.hurtTimer = 20;
                        const a = Math.atan2(p.y - t.y, p.x - t.x);
                        t.vx -= Math.cos(a) * 3; t.vy -= Math.sin(a) * 3;
                        this.uiCallback();
                    }
                    projs.splice(i, 1);
                    break;
                }
            }
        }
    },

    checkWeaponPickup(entity) {
        if (entity.dead) return;
        const wps = window.WeaponSystem.weapons;
        for (let i = wps.length - 1; i >= 0; i--) {
            if (Math.hypot(entity.x - wps[i].x, entity.y - wps[i].y) < entity.radius + window.GameConfig.WEAPON_SIZE) {
                entity.weapon = wps[i].type;
                if (this.spawnParticles) this.spawnParticles(wps[i].x, wps[i].y, wps[i].type.color, 'ring');
                wps.splice(i, 1);
                this.uiCallback();
            }
        }
    },

    checkCombat() {
        const dx = this.player.x - this.ai.x, dy = this.player.y - this.ai.y;
        const dist = Math.hypot(dx, dy);
        
        let pRange = this.player.weapon && this.player.weapon.type === 'melee' ? 10 : 0;
        let aRange = this.ai.weapon && this.ai.weapon.type === 'melee' ? 10 : 0;
        
        if (dist < this.player.radius + this.ai.radius + Math.max(pRange, aRange)) {
            if (this.player.weapon && this.player.weapon.type === 'melee' && this.player.blinkTimer <= 0) {
                if (this.ai.weapon && this.ai.weapon.name === 'shield' && this.ai.weapon.durability > 0) {
                    this.ai.weapon.durability--; if (this.ai.weapon.durability <= 0) this.ai.weapon = null;
                } else {
                    this.ai.health -= this.player.weapon.damage;
                    this.ai.blinkTimer = 30; this.ai.hurtTimer = 20;
                    const a = Math.atan2(dy, dx);
                    const k = this.player.weapon.knockback || 5;
                    this.ai.vx += Math.cos(a) * k; this.ai.vy += Math.sin(a) * k;
                    this.uiCallback();
                }
                if (this.player.weapon.name !== 'shield') this.player.weapon = null;
            }

            if (this.ai.weapon && this.ai.weapon.type === 'melee' && this.ai.blinkTimer <= 0) {
                if (this.player.weapon && this.player.weapon.name === 'shield' && this.player.weapon.durability > 0) {
                    this.player.weapon.durability--; if (this.player.weapon.durability <= 0) this.player.weapon = null;
                } else {
                    this.player.health -= this.ai.weapon.damage;
                    this.player.blinkTimer = 30; this.player.hurtTimer = 20;
                    const a = Math.atan2(-dy, -dx);
                    const k = this.ai.weapon.knockback || 5;
                    this.player.vx += Math.cos(a) * k; this.player.vy += Math.sin(a) * k;
                    this.uiCallback();
                }
                if (this.ai.weapon.name !== 'shield') this.ai.weapon = null;
            }
        }
    }
};
