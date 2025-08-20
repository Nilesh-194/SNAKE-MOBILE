// Game configuration - EXACT original settings
const gameSettings = {
    easy: { foodCount: 2, speed: 150, theme: "green" },
    medium: { foodCount: 2, speed: 100, theme: "blue" }, 
    hard: { foodCount: 1, speed: 60, theme: "red" }
};

const gridSize = {
    rows: 40,
    cols: 40,
    totalPixels: 1600,
    containerSize: "400px"
};

const initialPosition = {
    row: 20,
    col: 1,
    pixelId: 761, // (20-1)*40 + 1 = 761
    direction: "RIGHT"
};

// Game state
let currentDifficulty = 'easy';
let snake = [];
let food = [];
let direction = 'RIGHT';
let nextDirection = 'RIGHT';
let score = 0;
let gameRunning = false;
let gamePaused = false;
let gameLoop = null;
let highScores = {
    easy: 0,
    medium: 0,
    hard: 0
};

// Device detection
function isMobileDevice() {
    const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const smallScreen = window.innerWidth <= 768;
    return userAgent || (hasTouch && smallScreen);
}

// Get pixel ID from row and column - EXACT original formula
function getPixelId(row, col) {
    return (row - 1) * 40 + col;
}

// Get row and column from pixel ID
function getRowCol(pixelId) {
    const row = Math.ceil(pixelId / 40);
    const col = pixelId - (row - 1) * 40;
    return { row, col };
}

// Initialize game
function init() {
    loadHighScores();
    createGameGrid();
    setupEventListeners();
    setupDeviceControls();
    showLevelSelection();
}

// Create the EXACT 40x40 grid with 1600 individual div elements
function createGameGrid() {
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.innerHTML = '';
    
    for (let i = 1; i <= gridSize.totalPixels; i++) {
        const pixel = document.createElement('div');
        pixel.id = `pixel${i}`;
        pixel.className = 'pixel';
        gameContainer.appendChild(pixel);
    }
}

// Setup device-specific controls
function setupDeviceControls() {
    const isMobile = isMobileDevice();
    const mobileElements = document.querySelectorAll('.mobile-only');
    const desktopElements = document.querySelectorAll('.desktop-only');
    
    mobileElements.forEach(el => {
        el.style.display = isMobile ? 'flex' : 'none';
    });
    
    desktopElements.forEach(el => {
        el.style.display = isMobile ? 'none' : 'block';
    });
}

// Setup event listeners
function setupEventListeners() {
    // Desktop keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    // Mobile touch controls - prevent default to avoid scrolling
    const touchButtons = [
        { id: 'btnUp', direction: 'UP' },
        { id: 'btnDown', direction: 'DOWN' },
        { id: 'btnLeft', direction: 'LEFT' },
        { id: 'btnRight', direction: 'RIGHT' }
    ];
    
    touchButtons.forEach(button => {
        const element = document.getElementById(button.id);
        if (element) {
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                changeDirection(button.direction);
                addPressEffect(e.target);
            }, { passive: false });
            
            element.addEventListener('click', (e) => {
                e.preventDefault();
                changeDirection(button.direction);
                addPressEffect(e.target);
            });
        }
    });
    
    // Mobile pause button
    const mobilePauseBtn = document.getElementById('mobilePauseBtn');
    if (mobilePauseBtn) {
        mobilePauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            togglePause();
            addPressEffect(e.target);
        }, { passive: false });
    }
    
    // Prevent context menu on mobile controls
    const mobileControls = document.getElementById('mobileControls');
    if (mobileControls) {
        mobileControls.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
}

function addPressEffect(element) {
    element.classList.add('pressed');
    setTimeout(() => {
        element.classList.remove('pressed');
    }, 100);
}

// Handle keyboard input - EXACT original controls
function handleKeyPress(e) {
    if (!gameRunning) return;
    
    switch(e.code) {
        case 'ArrowUp':
            e.preventDefault();
            changeDirection('UP');
            break;
        case 'ArrowDown':
            e.preventDefault();
            changeDirection('DOWN');
            break;
        case 'ArrowLeft':
            e.preventDefault();
            changeDirection('LEFT');
            break;
        case 'ArrowRight':
            e.preventDefault();
            changeDirection('RIGHT');
            break;
        case 'Space':
            e.preventDefault();
            togglePause();
            break;
    }
}

// Change direction with collision prevention
function changeDirection(newDirection) {
    if (!gameRunning || gamePaused) return;
    
    // Prevent snake from going backwards into itself
    const opposites = {
        'UP': 'DOWN',
        'DOWN': 'UP',
        'LEFT': 'RIGHT',
        'RIGHT': 'LEFT'
    };
    
    if (opposites[newDirection] !== direction) {
        nextDirection = newDirection;
    }
}

// Level selection
function selectDifficulty(difficulty) {
    currentDifficulty = difficulty;
    showGameScreen();
    startGame();
}

function showLevelSelection() {
    document.getElementById('levelSelection').classList.remove('hidden');
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    
    // Update high score display for current difficulty
    loadHighScores();
}

function showGameScreen() {
    document.getElementById('levelSelection').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    document.getElementById('gameOver').classList.add('hidden');
}

// Start game with EXACT original mechanics
function startGame() {
    resetGame();
    gameRunning = true;
    gamePaused = false;
    
    // EXACT original starting position: row 20, column 1 (pixel 761)
    snake = [{ row: initialPosition.row, col: initialPosition.col }];
    direction = initialPosition.direction;
    nextDirection = initialPosition.direction;
    score = 0;
    food = [];
    
    // Generate initial food based on difficulty
    const settings = gameSettings[currentDifficulty];
    for (let i = 0; i < settings.foodCount; i++) {
        generateFood();
    }
    
    updateDisplay();
    
    // Start game loop with difficulty-specific speed
    gameLoop = setInterval(gameStep, settings.speed);
}

function resetGame() {
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    
    gameRunning = false;
    gamePaused = false;
    
    // Clear all pixels
    for (let i = 1; i <= gridSize.totalPixels; i++) {
        const pixel = document.getElementById(`pixel${i}`);
        if (pixel) {
            pixel.className = 'pixel';
        }
    }
    
    document.getElementById('pauseIndicator').classList.add('hidden');
    
    // Reset mobile pause button
    const mobilePauseBtn = document.getElementById('mobilePauseBtn');
    if (mobilePauseBtn) mobilePauseBtn.innerHTML = '⏸️';
}

// Generate food avoiding snake body
function generateFood() {
    let attempts = 0;
    let newFood;
    
    do {
        newFood = {
            row: Math.floor(Math.random() * gridSize.rows) + 1,
            col: Math.floor(Math.random() * gridSize.cols) + 1
        };
        attempts++;
    } while (isPositionOccupied(newFood.row, newFood.col) && attempts < 100);
    
    if (attempts < 100) {
        food.push(newFood);
    }
}

function isPositionOccupied(row, col) {
    // Check snake body
    for (let segment of snake) {
        if (segment.row === row && segment.col === col) {
            return true;
        }
    }
    
    // Check existing food
    for (let foodItem of food) {
        if (foodItem.row === row && foodItem.col === col) {
            return true;
        }
    }
    
    return false;
}

// Main game step - EXACT original mechanics
function gameStep() {
    if (!gameRunning || gamePaused) return;
    
    // Update direction
    direction = nextDirection;
    
    // Calculate new head position
    const head = { ...snake[0] };
    
    switch (direction) {
        case 'UP':
            head.row--;
            break;
        case 'DOWN':
            head.row++;
            break;
        case 'LEFT':
            head.col--;
            break;
        case 'RIGHT':
            head.col++;
            break;
    }
    
    // Check wall collision
    if (head.row < 1 || head.row > gridSize.rows || head.col < 1 || head.col > gridSize.cols) {
        gameOver();
        return;
    }
    
    // Check self collision
    for (let segment of snake) {
        if (head.row === segment.row && head.col === segment.col) {
            gameOver();
            return;
        }
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check food collision
    let foodEaten = false;
    for (let i = food.length - 1; i >= 0; i--) {
        if (head.row === food[i].row && head.col === food[i].col) {
            food.splice(i, 1);
            score += 10;
            foodEaten = true;
            generateFood();
            break;
        }
    }
    
    // Remove tail if no food eaten
    if (!foodEaten) {
        snake.pop();
    }
    
    updateDisplay();
}

// Update visual display
function updateDisplay() {
    // Clear all pixels first
    for (let i = 1; i <= gridSize.totalPixels; i++) {
        const pixel = document.getElementById(`pixel${i}`);
        if (pixel) {
            pixel.className = 'pixel';
        }
    }
    
    // Draw snake body
    snake.forEach(segment => {
        const pixelId = getPixelId(segment.row, segment.col);
        const pixel = document.getElementById(`pixel${pixelId}`);
        if (pixel) {
            pixel.className = 'pixel snakeBodyPixel';
        }
    });
    
    // Draw food
    food.forEach(foodItem => {
        const pixelId = getPixelId(foodItem.row, foodItem.col);
        const pixel = document.getElementById(`pixel${pixelId}`);
        if (pixel) {
            pixel.className = 'pixel food';
        }
    });
    
    // Update score
    document.getElementById('score').textContent = score;
}

// Toggle pause
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    const pauseIndicator = document.getElementById('pauseIndicator');
    const mobilePauseBtn = document.getElementById('mobilePauseBtn');
    
    if (gamePaused) {
        pauseIndicator.classList.remove('hidden');
        if (mobilePauseBtn) mobilePauseBtn.innerHTML = '▶️';
    } else {
        pauseIndicator.classList.add('hidden');
        if (mobilePauseBtn) mobilePauseBtn.innerHTML = '⏸️';
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    gamePaused = false;
    
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    
    // Update high score for current difficulty
    if (score > highScores[currentDifficulty]) {
        highScores[currentDifficulty] = score;
        saveHighScores();
    }
    
    // Show game over screen
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
    
    // Reset pause button
    const mobilePauseBtn = document.getElementById('mobilePauseBtn');
    if (mobilePauseBtn) mobilePauseBtn.innerHTML = '⏸️';
    document.getElementById('pauseIndicator').classList.add('hidden');
}

// Restart game
function restartGame() {
    document.getElementById('gameOver').classList.add('hidden');
    showGameScreen();
    startGame();
}

// Back to menu - Fixed implementation
function backToMenu() {
    // Stop any running game
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
    
    // Reset game state
    gameRunning = false;
    gamePaused = false;
    
    // Clear the game grid
    resetGame();
    
    // Show level selection screen and hide others
    showLevelSelection();
}

// High score management - separate for each difficulty
function loadHighScores() {
    const saved = localStorage.getItem('snakeHighScores');
    if (saved) {
        try {
            highScores = JSON.parse(saved);
        } catch (e) {
            highScores = { easy: 0, medium: 0, hard: 0 };
        }
    }
    
    const currentScore = highScores[currentDifficulty] || 0;
    const highScoreElement = document.getElementById('highScore');
    if (highScoreElement) {
        highScoreElement.textContent = currentScore;
    }
}

function saveHighScores() {
    try {
        localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
    } catch (e) {
        console.warn('Could not save high scores to localStorage');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);