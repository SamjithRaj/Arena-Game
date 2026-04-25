document.addEventListener('DOMContentLoaded', () => {
    
    // UI Elements
    const loadingScreen = document.getElementById('loadingScreen');
    const mainMenu = document.getElementById('mainMenu');
    const gameContainer = document.getElementById('gameContainer');
    const gameUI = document.getElementById('gameUI');
    const gameOverDiv = document.getElementById('gameOver');
    
    // Components
    const colorBtns = document.querySelectorAll('.colorBtn');
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');
    const envSelect = document.getElementById('environmentSelect');

    const updateHealthDisplay = () => {
        const playerHealthDiv = document.getElementById('playerHealth');
        const aiHealthDiv = document.getElementById('aiHealth');
        const pWeaponIcon = document.getElementById('playerWeaponIcon');
        const aWeaponIcon = document.getElementById('aiWeaponIcon');

        // Color UI variable
        document.documentElement.style.setProperty('--player-color', window.GameCore.player.color);

        playerHealthDiv.innerHTML = '';
        aiHealthDiv.innerHTML = '';

        for (let i = 0; i < 10; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.innerHTML = '❤';
            if (i >= window.GameCore.player.health) heart.classList.add('empty');
            playerHealthDiv.appendChild(heart);
        }

        for (let i = 0; i < 10; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.innerHTML = '❤';
            if (i >= window.GameCore.ai.health) heart.classList.add('empty');
            aiHealthDiv.appendChild(heart);
        }

        pWeaponIcon.innerText = window.GameCore.player.weapon?.symbol || '';
        aWeaponIcon.innerText = window.GameCore.ai.weapon?.symbol || '';
    };

    const handleGameOver = (result) => {
        window.GameState.gameStarted = false;
        if (window.GameState.animationId) {
            cancelAnimationFrame(window.GameState.animationId);
        }
        
        const gameOverText = document.getElementById('gameOverText');
        gameOverDiv.className = `glass-panel ${result}`;
        gameOverText.textContent = result === 'win' ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED';
        gameOverDiv.style.display = 'block';
    };

    const loop = () => {
        if (!window.GameState.gameStarted) return;
        
        window.GameCore.update();
        
        window.GameRenderer.clear();
        window.GameRenderer.drawBackground(window.GameState.selectedEnv);
        window.GameRenderer.drawWeapons();
        window.GameRenderer.drawHearts(window.GameCore.hearts);
        window.GameRenderer.drawProjectiles();
        window.GameRenderer.drawEntity(window.GameCore.player, window.GameState.time);
        window.GameRenderer.drawEntity(window.GameCore.ai, window.GameState.time);
        
        window.GameState.animationId = requestAnimationFrame(loop);
    };

    // Binding Inputs
    window.addEventListener('keydown', e => {
        window.GameState.keys[e.key.toLowerCase()] = true;

        if (e.key === ' ' && window.GameCore.player && window.GameCore.player.weapon && window.GameCore.player.weapon.type === 'ranged' && window.GameCore.player.shootCooldown <= 0) {
            window.WeaponSystem.shootWeapon(window.GameCore.player, window.GameCore.ai);
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', e => {
        window.GameState.keys[e.key.toLowerCase()] = false;
    });

    // UI Events
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            window.GameState.selectedColor = btn.dataset.color;
        });
    });

    const startGame = () => {
        window.GameState.selectedEnv = envSelect.value;
        mainMenu.style.display = 'none';
        gameOverDiv.style.display = 'none';
        gameContainer.style.display = 'block';
        gameUI.style.display = 'flex';
        
        window.GameRenderer.init('gameCanvas');
        window.GameCore.init(updateHealthDisplay, handleGameOver);
        
        window.GameState.gameStarted = true;
        loop();
    };

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);

    // Initial load screen timeout
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainMenu.style.display = 'flex';
        }, 500);
    }, 1500); // Fake load delay to read "Allocating Memory"
});
