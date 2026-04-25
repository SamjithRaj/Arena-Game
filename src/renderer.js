window.GameRenderer = {
    canvas: null,
    ctx: null,
    centerX: 0,
    centerY: 0,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    },

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawBackground(env) {
        if (env === 'fuji' && window.GameAssets.bgImages.fuji.complete && window.GameAssets.bgImages.fuji.naturalWidth) {
            this.ctx.drawImage(window.GameAssets.bgImages.fuji, 0, 0, this.canvas.width, this.canvas.height);
        } else if (env === 'ocean' && window.GameAssets.bgImages.ocean.complete && window.GameAssets.bgImages.ocean.naturalWidth) {
            this.ctx.drawImage(window.GameAssets.bgImages.ocean, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Default Holo Arena
            this.ctx.fillStyle = '#0a0f1e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw Arena bounds
        this.ctx.strokeStyle = 'rgba(0, 217, 255, 0.5)';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, window.GameConfig.ARENA_RADIUS, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.strokeStyle = 'rgba(0, 217, 255, 0.1)';
        this.ctx.lineWidth = 2;
        for (let i = 1; i < 4; i++) {
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, window.GameConfig.ARENA_RADIUS * (i / 4), 0, Math.PI * 2);
            this.ctx.stroke();
        }
    },

    drawEntity(entity, time) {
        const ctx = this.ctx;
        if (entity.blinkTimer > 0 && Math.floor(entity.blinkTimer / 5) % 2 === 0) {
            return;
        }

        // Draw shield aura protective bubbling layer!
        if (entity.weapon && entity.weapon.name === 'shield') {
            ctx.save();
            ctx.translate(entity.x, entity.y);
            const pulse = 1 + Math.sin(time * 0.1) * 0.05;
            ctx.scale(pulse, pulse);
            ctx.beginPath();
            ctx.arc(0, 0, entity.radius + 15, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(65, 105, 225, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(65, 105, 225, 0.8)';
            ctx.lineWidth = 3;
            // Bubble detail dots
            ctx.setLineDash([5, 15]);
            ctx.stroke();
            ctx.restore();
        }

        ctx.save();
        ctx.translate(entity.x, entity.y);
        ctx.shadowColor = entity.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = entity.color;
        ctx.beginPath();
        ctx.arc(0, 0, entity.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Face drawing
        const eyeOffset = 8, eyeY = -5;
        const pupilOffset = Math.sin(time * 0.05) * 2;
        if (entity.hurtTimer > 0) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-eyeOffset - 4, eyeY - 4); ctx.lineTo(-eyeOffset + 4, eyeY + 4);
            ctx.moveTo(-eyeOffset + 4, eyeY - 4); ctx.lineTo(-eyeOffset - 4, eyeY + 4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(eyeOffset - 4, eyeY - 4); ctx.lineTo(eyeOffset + 4, eyeY + 4);
            ctx.moveTo(eyeOffset + 4, eyeY - 4); ctx.lineTo(eyeOffset - 4, eyeY + 4);
            ctx.stroke();
        } else {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(-eyeOffset, eyeY, 6, 0, Math.PI * 2);
            ctx.arc(eyeOffset, eyeY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-eyeOffset + pupilOffset, eyeY, 3, 0, Math.PI * 2);
            ctx.arc(eyeOffset + pupilOffset, eyeY, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Current Weapon Display on Entity
        if (entity.weapon) {
            ctx.save();
            ctx.translate(entity.radius, -entity.radius);
            
            // Sword scaled up 50%
            if (entity.weapon.name === 'sword') {
                ctx.scale(1.5, 1.5);
            }

            if (entity.weapon.image) {
                ctx.drawImage(entity.weapon.image, 0, -15, 30, 30);
            } else {
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(entity.weapon.symbol, 15, 0);
            }
            
            if (entity.weapon.name === 'shield') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = '12px Arial';
                ctx.fillText(entity.weapon.durability, 15, 20);
            }
            ctx.restore();
        }
        ctx.restore();
    },

    drawWeapons() {
        const ctx = this.ctx;
        for (let i = window.WeaponSystem.weapons.length - 1; i >= 0; i--) {
            const w = window.WeaponSystem.weapons[i];
            ctx.save();
            ctx.translate(w.x, w.y);
            ctx.rotate(w.rotation);
            if (w.timer > 60 || Math.floor(w.timer / 10) % 2 === 0) {
                if (w.type.name === 'sword') {
                    ctx.scale(1.5, 1.5); // sword larger on ground too
                }

                if (w.type.image) {
                    ctx.drawImage(w.type.image, -15, -15, 30, 30);
                } else {
                    ctx.font = '25px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(w.type.symbol, 0, 0);
                }
            }
            ctx.restore();
        }
    },

    drawProjectiles() {
        const ctx = this.ctx;
        for (const p of window.WeaponSystem.projectiles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.atan2(p.vy, p.vx));
            if (window.GameAssets.bulletImg.complete && window.GameAssets.bulletImg.naturalWidth) {
                ctx.drawImage(window.GameAssets.bulletImg, -10, -5, 20, 10);
            } else {
                ctx.fillStyle = '#ff0';
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    },

    drawHearts(hearts) {
        const ctx = this.ctx;
        hearts.forEach(heart => {
            heart.pulse += 0.1;
            const scale = 1 + Math.sin(heart.pulse) * 0.2;
            ctx.save();
            ctx.translate(heart.x, heart.y);
            ctx.scale(scale, scale);
            ctx.font = '25px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❤', 0, 0);
            ctx.restore();
        });
    }
};
