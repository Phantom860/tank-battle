const GAME_CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    GRID_SIZE: 32,
    FPS: 60,
    
    TANK: {
        WIDTH: 32,
        HEIGHT: 32,
        SPEED: 2,
        ROTATION_SPEED: 3,
        MAX_HEALTH: 100,
        SHOOT_COOLDOWN: 300
    },
    
    ENEMY: {
        WIDTH: 32,
        HEIGHT: 32,
        SPEED: 1,
        ROTATION_SPEED: 2,
        MAX_HEALTH: 50,
        SHOOT_COOLDOWN: 1000,
        DETECTION_RANGE: 200
    },
    
    BULLET: {
        WIDTH: 4,
        HEIGHT: 8,
        SPEED: 5,
        DAMAGE: 25,
        LIFETIME: 2000
    },
    
    POWERUP: {
        WIDTH: 24,
        HEIGHT: 24,
        TYPES: {
            HEALTH: 'health',
            SPEED: 'speed',
            FIRE_RATE: 'fire_rate',
            DAMAGE: 'damage'
        },
        DURATION: 5000
    },
    
    TILE: {
        SIZE: 32,
        TYPES: {
            EMPTY: 0,
            WALL: 1,
            DESTRUCTIBLE_WALL: 2,
            WATER: 3,
            GRASS: 4
        }
    },
    
    COLORS: {
        PLAYER_TANK: '#00ff00',
        ENEMY_TANK: '#ff0000',
        BULLET: '#ffff00',
        WALL: '#666666',
        DESTRUCTIBLE_WALL: '#8B4513',
        WATER: '#0066cc',
        GRASS: '#228B22',
        POWERUP_HEALTH: '#ff4444',
        POWERUP_SPEED: '#4444ff',
        POWERUP_FIRE_RATE: '#ffff44',
        POWERUP_DAMAGE: '#ff44ff'
    },
    
    KEYS: {
        UP: 'KeyW',
        DOWN: 'KeyS',
        LEFT: 'KeyA',
        RIGHT: 'KeyD',
        SHOOT: 'Space'
    }
};

const TILE_COLORS = {
    [GAME_CONFIG.TILE.TYPES.EMPTY]: '#000000',
    [GAME_CONFIG.TILE.TYPES.WALL]: GAME_CONFIG.COLORS.WALL,
    [GAME_CONFIG.TILE.TYPES.DESTRUCTIBLE_WALL]: GAME_CONFIG.COLORS.DESTRUCTIBLE_WALL,
    [GAME_CONFIG.TILE.TYPES.WATER]: GAME_CONFIG.COLORS.WATER,
    [GAME_CONFIG.TILE.TYPES.GRASS]: GAME_CONFIG.COLORS.GRASS
};