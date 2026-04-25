window.GameConfig = {
    ARENA_RADIUS: 360,
    PLAYER_RADIUS: 30,
    FRICTION: 0.98,
    BOUNCE_DAMPING: 0.7,
    WEAPON_SIZE: 30,
    HEART_SIZE: 18,
    baseCanvasWidth: 1024,
    baseCanvasHeight: 768
};

window.GameState = {
    selectedColor: '#00d9ff',
    selectedEnv: 'arena',
    gameStarted: false,
    time: 0,
    animationId: null,
    keys: {}
};

window.GameAssets = {
    pistolImg: new Image(),
    shotgunImg: new Image(),
    bulletImg: new Image(),
    bgImages: {
        fuji: new Image(),
        ocean: new Image()
    },
    imagesLoaded: 0,
    totalImages: 3 // pistol, shotgun, bullet
};

window.GameAssets.pistolImg.src = 'pistol.png';
window.GameAssets.shotgunImg.src = 'shotgun.png';
window.GameAssets.bulletImg.src = 'bullet.png';
window.GameAssets.bgImages.fuji.src = 'mount_fuji.png';
window.GameAssets.bgImages.ocean.src = 'ocean.png';

window.GameAssets.bulletImg.onload = () => console.log('Bullet loaded');
