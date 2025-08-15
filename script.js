// Game Canvas and Context
const canvas = document.getElementById('gameCanvas');
if (!canvas) {
    console.error('Canvas element not found!');
    document.body.innerHTML = '<h1>Error: Canvas not found</h1>';
} else {
    console.log('Canvas found successfully');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
    console.error('Canvas context not available!');
    document.body.innerHTML = '<h1>Error: Canvas context not available</h1>';
} else {
    console.log('Canvas context created successfully');
}

// Image loading system
const gameImages = {
    fisherman: null,
    shrimpSmall: null,
    shrimpMedium: null,
    shrimpLarge: null,
    trashCan: null,
    trashWeed: null,
    hook: null,
    rod: null
};

// Load images function
function loadImages() {
    // Only try to load images that actually exist
    const imageList = [
        { key: 'fisherman', src: 'images/fisherman.png' },
        { key: 'shrimpSmall', src: 'images/shrimp-small.png' },
        { key: 'shrimpMedium', src: 'images/shrimp-medium.png' },
        { key: 'shrimpLarge', src: 'images/shrimp-large.png' }
    ];
    
    let loadedCount = 0;
    const totalImages = imageList.length;
    
    imageList.forEach(item => {
        const img = new Image();
        img.onload = () => {
            loadedCount++;
            console.log(`Loaded: ${item.src}`);
            if (loadedCount === totalImages) {
                console.log('Images loaded, starting game!');
                startGame();
            }
        };
        img.onerror = () => {
            console.log(`Failed to load: ${item.src} - Using canvas drawing instead`);
            loadedCount++;
            if (loadedCount === totalImages) {
                console.log('Starting game with canvas drawings');
                startGame();
            }
        };
        img.src = item.src;
        gameImages[item.key] = img;
    });
}

// Game state
let gameState = {
    score: 0,
    timeLeft: 60,
    isGameOver: false,
    isCharging: false,
    isCasting: false,
    isReeling: false,
    powerLevel: 0,
    maxPower: 100,
    powerChargeSpeed: 2
};

// Player
const player = {
    x: 0,
    y: 170, // Standing on the pier
    width: 80, // Huge fisherman
    height: 160, // Huge fisherman
    rodLength: 100, // Longer rod for better visibility
    rodAngle: -Math.PI / 6 // More horizontal angle
};

// Fishing line and hook with realistic physics
const fishingLine = {
    x: 0,
    y: 0,
    hookX: 0,
    hookY: 0,
    velocityX: 0,
    velocityY: 0,
    isInWater: false,
    sinkSpeed: 1,
    reelSpeed: 3,
    maxDepth: 500,
    gravity: 0.3,
    airResistance: 0.98,
    waterResistance: 0.95
};

// Shrimps array
let shrimps = [];
const shrimpTypes = [
    { size: 15, speed: 2, points: 10, color: '#FF6B6B' }, // Small, fast, low points
    { size: 25, speed: 1.5, points: 20, color: '#4ECDC4' }, // Medium
    { size: 35, speed: 1, points: 35, color: '#45B7D1', weight: 60 } // Large, slow, high points, heavy
];

// Trash items
let trashItems = [];
const trashTypes = [
    { size: 20, speed: 0.5, points: -25, color: '#FF0000', type: 'bomb' },
    { size: 15, speed: 0.3, points: -3, color: '#228B22', type: 'weed' }
];

// Water waves
let waves = [];
for (let i = 0; i < 10; i++) {
    waves.push({
        x: i * 100,
        y: 300,
        amplitude: 5,
        frequency: 0.02,
        phase: i * 0.5
    });
}

// Particle system for catch effects
let particles = [];

// Sound effects (using Web Audio API)
let audioContext;
let sounds = {};

// Initialize audio
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create splash sound
        sounds.splash = () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        };
        
        // Create pop sound for catching
        sounds.pop = () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        };
        
        // Create explosion sound for bomb
        sounds.explosion = () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        };
    } catch (e) {
        console.log('Audio not supported');
    }
}

    // Initialize game
    function initGame() {
        gameState.score = 0;
        gameState.timeLeft = 60;
        gameState.isGameOver = false;
        gameState.isCharging = false;
        gameState.isCasting = false;
        gameState.isReeling = false;
        gameState.powerLevel = 0;
        
        // Reset fishing line physics
        fishingLine.velocityX = 0;
        fishingLine.velocityY = 0;
        fishingLine.isInWater = false;
        
        shrimps = [];
        trashItems = [];
        
        // Create initial shrimps
        for (let i = 0; i < 8; i++) {
            spawnShrimp();
        }
        
        // Create initial trash
        for (let i = 0; i < 3; i++) {
            spawnTrash();
        }
        
        updateUI();
        document.getElementById('gameOver').classList.add('hidden');
    }

// Spawn a new shrimp
function spawnShrimp() {
    const type = shrimpTypes[Math.floor(Math.random() * shrimpTypes.length)];
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    shrimps.push({
        x: direction > 0 ? -50 : canvas.width + 50,
        y: 350 + Math.random() * 200,
        size: type.size,
        speed: type.speed * direction,
        points: type.points,
        color: type.color,
        weight: type.weight || type.size, // Use weight property if available
        direction: direction,
        caught: false,
        wigglePhase: Math.random() * Math.PI * 2
    });
}

// Spawn trash
function spawnTrash() {
    const type = trashTypes[Math.floor(Math.random() * trashTypes.length)];
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    trashItems.push({
        x: direction > 0 ? -50 : canvas.width + 50,
        y: 350 + Math.random() * 200,
        size: type.size,
        speed: type.speed * direction,
        points: type.points,
        color: type.color,
        type: type.type,
        direction: direction,
        caught: false
    });
}

// Update UI elements
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('timer').textContent = gameState.timeLeft;
    document.getElementById('power-fill').style.width = gameState.powerLevel + '%';
}

// Draw background (fisherman theme)
function drawBackground() {
    // Sky gradient - early morning fishing atmosphere
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#FFB347'); // Warm orange sunrise
    gradient.addColorStop(0.3, '#FFD700'); // Golden hour
    gradient.addColorStop(0.6, '#87CEEB'); // Light blue sky
    gradient.addColorStop(1, '#4682B4'); // Deep blue water
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw distant mountains/hills
    ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(100, 150);
    ctx.lineTo(200, 180);
    ctx.lineTo(300, 140);
    ctx.lineTo(400, 160);
    ctx.lineTo(500, 130);
    ctx.lineTo(600, 170);
    ctx.lineTo(700, 145);
    ctx.lineTo(800, 160);
    ctx.lineTo(canvas.width, 180);
    ctx.lineTo(canvas.width, 300);
    ctx.lineTo(0, 300);
    ctx.closePath();
    ctx.fill();
    
    // Draw fishing pier/dock
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 280, canvas.width, 20);
    
    // Pier posts
    ctx.fillStyle = '#654321';
    for (let i = 0; i < 8; i++) {
        const x = i * 100 + 20;
        ctx.fillRect(x, 270, 8, 30);
    }
    
    // Draw some realistic clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 4; i++) {
        const x = (i * 250 + Date.now() * 0.005) % (canvas.width + 300) - 150;
        const y = 40 + i * 25;
        drawRealisticCloud(x, y, 80 + i * 30);
    }
    
    // Draw seagulls
    drawSeagulls();
    
    // Draw fishing equipment on pier
    drawFishingEquipment();
}

// Draw a realistic cloud
function drawRealisticCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.25, 0, Math.PI * 2);
    ctx.arc(x + size * 0.25, y, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y, size * 0.3, 0, Math.PI * 2);
    ctx.arc(x + size * 0.75, y, size * 0.25, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.15, size * 0.25, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y - size * 0.1, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
}

// Draw seagulls
function drawSeagulls() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 3; i++) {
        const x = (i * 300 + Date.now() * 0.003) % (canvas.width + 100) - 50;
        const y = 80 + i * 20;
        
        // Seagull body
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Seagull wings
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x - 4, y - 3);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 4, y - 3);
        ctx.lineTo(x + 8, y);
        ctx.stroke();
    }
}

// Draw fishing equipment on pier
function drawFishingEquipment() {
    // Fishing bucket
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(650, 260, 30, 20);
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.strokeRect(650, 260, 30, 20);
    
    // Bucket handle
    ctx.beginPath();
    ctx.arc(665, 250, 8, 0, Math.PI, false);
    ctx.stroke();
    
    // Fishing net
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(700, 270);
    ctx.lineTo(720, 250);
    ctx.lineTo(740, 270);
    ctx.stroke();
    
    // Net mesh
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(700 + i * 10, 270);
        ctx.lineTo(720 + i * 10, 250);
        ctx.stroke();
    }
    
    // Fishing line spool
    ctx.fillStyle = '#654321';
    ctx.fillRect(750, 265, 20, 10);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;
    ctx.strokeRect(750, 265, 20, 10);
    
    // Spool center
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(755, 268, 10, 4);
}

// Draw water with waves (fisherman theme)
function drawWater() {
    // Water surface with depth
    const waterGradient = ctx.createLinearGradient(0, 300, 0, canvas.height);
    waterGradient.addColorStop(0, 'rgba(70, 130, 180, 0.8)'); // Surface
    waterGradient.addColorStop(0.5, 'rgba(25, 25, 112, 0.9)'); // Middle depth
    waterGradient.addColorStop(1, 'rgba(0, 0, 128, 1)'); // Deep water
    
    ctx.fillStyle = waterGradient;
    ctx.fillRect(0, 300, canvas.width, canvas.height - 300);
    
    // Animated waves with more detail
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let x = 0; x <= canvas.width; x += 4) {
        const waveY = 300 + Math.sin(x * 0.025 + Date.now() * 0.003) * 10;
        if (x === 0) {
            ctx.moveTo(x, waveY);
        } else {
            ctx.lineTo(x, waveY);
        }
    }
    ctx.stroke();
    
    // Secondary wave layer
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let x = 0; x <= canvas.width; x += 3) {
        const waveY = 308 + Math.sin(x * 0.02 + Date.now() * 0.002) * 6;
        if (x === 0) {
            ctx.moveTo(x, waveY);
        } else {
            ctx.lineTo(x, waveY);
        }
    }
    ctx.stroke();
    
    // Water reflections
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const x = (i * 200 + Date.now() * 0.001) % canvas.width;
        ctx.moveTo(x, 300);
        ctx.lineTo(x + 50, 350);
        ctx.stroke();
    }
    
    // Draw underwater plants/seaweed
    drawUnderwaterPlants();
}

// Draw player (realistic fisherman)
function drawPlayer() {
    const x = player.x;
    const y = player.y;
    
    // Try to use custom fisherman image first
    if (gameImages.fisherman && gameImages.fisherman.complete) {
        ctx.save();
        ctx.translate(x + player.width / 2, y + player.height / 2);
        ctx.drawImage(gameImages.fisherman, -player.width / 2, -player.height / 2, player.width, player.height);
        ctx.restore();
    } else {
        // Fallback to canvas drawing
        // Fisherman's body (overalls)
        ctx.fillStyle = '#2E4A62';
        ctx.fillRect(x, y + 20, player.width, player.height - 20);
        
        // Overalls straps
        ctx.fillStyle = '#2E4A62';
        ctx.fillRect(x + 5, y + 15, 8, 15);
        ctx.fillRect(x + player.width - 13, y + 15, 8, 15);
        
        // Fisherman's shirt
        ctx.fillStyle = '#E8B4A0';
        ctx.fillRect(x + 2, y + 25, player.width - 4, 15);
        
        // Fisherman's head
        ctx.fillStyle = '#FFE4B5';
        ctx.beginPath();
        ctx.arc(x + player.width / 2, y - 5, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Hat
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(x + player.width / 2, y - 15, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + player.width / 2 - 12, y - 15, 24, 8);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + player.width / 2 - 5, y - 8, 2, 0, Math.PI * 2);
        ctx.arc(x + player.width / 2 + 5, y - 8, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.arc(x + player.width / 2, y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Arms
        ctx.fillStyle = '#E8B4A0';
        ctx.fillRect(x - 5, y + 30, 8, 25);
        ctx.fillRect(x + player.width - 3, y + 30, 8, 25);
        
        // Hands
        ctx.fillStyle = '#FFE4B5';
        ctx.beginPath();
        ctx.arc(x - 2, y + 55, 6, 0, Math.PI * 2);
        ctx.arc(x + player.width + 2, y + 55, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Fishing line starts from fisherman's hand (no visible rod)
    const rodEndX = x + player.width / 2 + 35; // Start from right hand (huge fisherman)
    const rodEndY = y + 115; // Hand position (huge fisherman)
    
    // Fishing line - ONLY when casting or reeling
    if (gameState.isCasting || gameState.isReeling) {
        // Calculate line tension based on caught items
        let lineColor = '#000';
        let lineWidth = 1;
        
        if (gameState.isReeling) {
            // Check total weight of caught items
            let totalWeight = 0;
            shrimps.forEach(shrimp => {
                if (shrimp.caught) totalWeight += shrimp.size;
            });
            trashItems.forEach(trash => {
                if (trash.caught) totalWeight += trash.size;
            });
            
            // Change line appearance based on weight - more dramatic
            if (totalWeight > 80) {
                lineColor = '#FF0000'; // Red for very heavy load
                lineWidth = 4;
            } else if (totalWeight > 50) {
                lineColor = '#FF6600'; // Orange for heavy load
                lineWidth = 3;
            } else if (totalWeight > 20) {
                lineColor = '#FFAA00'; // Light orange for medium load
                lineWidth = 2;
            }
        }
        
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(rodEndX, rodEndY); // Start from rod tip
        ctx.lineTo(fishingLine.hookX, fishingLine.hookY);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Hook (try custom hook image first)
    if (gameState.isCasting || gameState.isReeling) {
        if (gameImages.hook && gameImages.hook.complete) {
            ctx.drawImage(gameImages.hook, fishingLine.hookX - 8, fishingLine.hookY - 8, 16, 16);
        } else {
            // Fallback to canvas drawing
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(fishingLine.hookX, fishingLine.hookY, 6, 0, Math.PI * 2);
            ctx.fill();
            
            // Hook shape
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(fishingLine.hookX, fishingLine.hookY, 10, 0, Math.PI, false);
            ctx.stroke();
            
            // Hook barb
            ctx.beginPath();
            ctx.moveTo(fishingLine.hookX + 8, fishingLine.hookY - 2);
            ctx.lineTo(fishingLine.hookX + 12, fishingLine.hookY - 4);
            ctx.stroke();
        }
    }
}

    // Draw shrimps (realistic)
    function drawShrimps() {
        shrimps.forEach(shrimp => {
            if (shrimp.caught) {
                // Draw caught shrimp with struggle animation
                const struggleOffset = Math.sin(Date.now() * 0.01) * 3;
                ctx.save();
                ctx.translate(shrimp.x + struggleOffset, shrimp.y);
                ctx.scale(shrimp.direction, 1);
                
                // Try to use custom shrimp image based on size
                let shrimpImage = null;
                if (shrimp.size <= 15 && gameImages.shrimpSmall && gameImages.shrimpSmall.complete) {
                    shrimpImage = gameImages.shrimpSmall;
                } else if (shrimp.size <= 25 && gameImages.shrimpMedium && gameImages.shrimpMedium.complete) {
                    shrimpImage = gameImages.shrimpMedium;
                } else if (shrimp.size > 25 && gameImages.shrimpLarge && gameImages.shrimpLarge.complete) {
                    shrimpImage = gameImages.shrimpLarge;
                }
                
                if (shrimpImage) {
                    // Use custom image with adjusted sizing
                    let imageSize;
                    if (shrimp.size <= 15) {
                        imageSize = 100; // Small shrimp - bigger
                    } else if (shrimp.size <= 25) {
                        imageSize = 120; // Medium shrimp - keep same
                    } else {
                        imageSize = 140; // Large shrimp - smaller
                    }
                    ctx.drawImage(shrimpImage, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
                } else {
                    // Fallback to canvas drawing for caught shrimp
                    ctx.fillStyle = shrimp.color;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, shrimp.size, shrimp.size * 0.6, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
                return;
            }
        
        ctx.save();
        ctx.translate(shrimp.x, shrimp.y);
        ctx.scale(shrimp.direction, 1);
        
        // Try to use custom shrimp image based on size
        let shrimpImage = null;
        if (shrimp.size <= 15 && gameImages.shrimpSmall && gameImages.shrimpSmall.complete) {
            shrimpImage = gameImages.shrimpSmall;
        } else if (shrimp.size <= 25 && gameImages.shrimpMedium && gameImages.shrimpMedium.complete) {
            shrimpImage = gameImages.shrimpMedium;
        } else if (shrimp.size > 25 && gameImages.shrimpLarge && gameImages.shrimpLarge.complete) {
            shrimpImage = gameImages.shrimpLarge;
        }
        
        if (shrimpImage) {
            // Use custom image with adjusted sizing
            let imageSize;
            if (shrimp.size <= 15) {
                imageSize = 100; // Small shrimp - bigger
            } else if (shrimp.size <= 25) {
                imageSize = 120; // Medium shrimp - keep same
            } else {
                imageSize = 140; // Large shrimp - smaller
            }
            ctx.drawImage(shrimpImage, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
        } else {
            // Fallback to canvas drawing
            // Shrimp body segments
            const segmentCount = 5;
            for (let i = 0; i < segmentCount; i++) {
                const segmentX = -i * shrimp.size * 0.3;
                const segmentSize = shrimp.size * (1 - i * 0.1);
                
                ctx.fillStyle = shrimp.color;
                ctx.beginPath();
                ctx.ellipse(segmentX, 0, segmentSize, segmentSize * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Segment outline
                ctx.strokeStyle = '#8B0000';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            
            // Shrimp tail (fan-shaped)
            ctx.fillStyle = shrimp.color;
            ctx.beginPath();
            ctx.moveTo(-shrimp.size * 1.5, 0);
            ctx.lineTo(-shrimp.size * 1.8, -shrimp.size * 0.4);
            ctx.lineTo(-shrimp.size * 1.6, 0);
            ctx.lineTo(-shrimp.size * 1.8, shrimp.size * 0.4);
            ctx.closePath();
            ctx.fill();
            
            // Tail outline
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Shrimp antennae (longer and more realistic)
            ctx.strokeStyle = shrimp.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(shrimp.size * 0.4, -shrimp.size * 0.3);
            ctx.quadraticCurveTo(shrimp.size * 0.8, -shrimp.size * 0.6, shrimp.size * 1.2, -shrimp.size * 0.4);
            ctx.moveTo(shrimp.size * 0.4, shrimp.size * 0.3);
            ctx.quadraticCurveTo(shrimp.size * 0.8, shrimp.size * 0.6, shrimp.size * 1.2, shrimp.size * 0.4);
            ctx.stroke();
            
            // Shrimp eyes (more detailed)
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(shrimp.size * 0.5, -shrimp.size * 0.25, 3, 0, Math.PI * 2);
            ctx.arc(shrimp.size * 0.5, shrimp.size * 0.25, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Eye highlights
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(shrimp.size * 0.5 - 1, -shrimp.size * 0.25 - 1, 1, 0, Math.PI * 2);
            ctx.arc(shrimp.size * 0.5 - 1, shrimp.size * 0.25 - 1, 1, 0, Math.PI * 2);
            ctx.fill();
            
            // Shrimp legs (small details)
            ctx.strokeStyle = shrimp.color;
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const legX = -i * shrimp.size * 0.2;
                ctx.beginPath();
                ctx.moveTo(legX, -shrimp.size * 0.3);
                ctx.lineTo(legX - 3, -shrimp.size * 0.4);
                ctx.moveTo(legX, shrimp.size * 0.3);
                ctx.lineTo(legX - 3, shrimp.size * 0.4);
                ctx.stroke();
            }
        }
        
        // Wiggle animation (more realistic)
        const wiggle = Math.sin(shrimp.wigglePhase + Date.now() * 0.01) * 2;
        ctx.translate(0, wiggle);
        
        ctx.restore();
    });
}

// Draw trash items
function drawTrash() {
    trashItems.forEach(trash => {
        if (trash.caught) return;
        
        // Try to use custom trash image
        if (trash.type === 'bomb' && gameImages.trashCan && gameImages.trashCan.complete) {
            ctx.drawImage(gameImages.trashCan, trash.x - trash.size/2, trash.y - trash.size/2, trash.size, trash.size);
        } else if (trash.type === 'weed' && gameImages.trashWeed && gameImages.trashWeed.complete) {
            ctx.drawImage(gameImages.trashWeed, trash.x - trash.size/2, trash.y - trash.size/2, trash.size, trash.size);
        } else {
            // Fallback to canvas drawing
            ctx.fillStyle = trash.color;
            
            if (trash.type === 'bomb') {
                // Draw bomb
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(trash.x, trash.y, trash.size/2, 0, Math.PI * 2);
                ctx.fill();
                
                // Bomb fuse
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(trash.x, trash.y - trash.size/2);
                ctx.lineTo(trash.x + 8, trash.y - trash.size/2 - 8);
                ctx.lineTo(trash.x + 12, trash.y - trash.size/2 - 4);
                ctx.stroke();
                
                // Bomb highlight
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(trash.x - 3, trash.y - 3, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Sparkle effect
                const time = Date.now() * 0.01;
                const sparkleX = trash.x + Math.sin(time) * 3;
                const sparkleY = trash.y - trash.size/2 - 8 + Math.cos(time) * 2;
                ctx.fillStyle = '#FFFF00';
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
                ctx.fill();
                
            } else if (trash.type === 'weed') {
                // Draw weed
                ctx.beginPath();
                ctx.arc(trash.x, trash.y, trash.size/2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#006400';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    });
}

// Update game logic
function updateGame() {
    if (gameState.isGameOver) return;
    
    // Update timer
    if (gameState.timeLeft <= 0) {
        endGame();
        return;
    }
    
    // Update power charging
    if (gameState.isCharging && gameState.powerLevel < gameState.maxPower) {
        gameState.powerLevel += gameState.powerChargeSpeed;
        updateUI();
    }
    
    // Update fishing line with realistic physics
    if (gameState.isCasting) {
        // Apply physics when hook is in air
        if (!fishingLine.isInWater) {
            // Apply gravity
            fishingLine.velocityY += fishingLine.gravity;
            
            // Apply air resistance
            fishingLine.velocityX *= fishingLine.airResistance;
            fishingLine.velocityY *= fishingLine.airResistance;
            
            // Update position
            fishingLine.hookX += fishingLine.velocityX;
            fishingLine.hookY += fishingLine.velocityY;
            
            // Check if hook hit water
            if (fishingLine.hookY >= 300) {
                fishingLine.isInWater = true;
                fishingLine.velocityY *= 0.3; // Reduce velocity when entering water
                if (sounds.splash) sounds.splash();
            }
        } else {
            // Hook is in water - apply water physics
            fishingLine.velocityY += fishingLine.gravity * 0.5; // Reduced gravity in water
            fishingLine.velocityX *= fishingLine.waterResistance;
            fishingLine.velocityY *= fishingLine.waterResistance;
            
            // Update position
            fishingLine.hookX += fishingLine.velocityX;
            fishingLine.hookY += fishingLine.velocityY;
            
            // Check if hook reached max depth
            if (fishingLine.hookY >= fishingLine.maxDepth) {
                gameState.isCasting = false;
                gameState.isReeling = true;
            }
        }
    }
    
    if (gameState.isReeling) {
        // Reel the hook back to the fisherman's hand
        const rodEndX = player.x + player.width / 2 + 35; // Right hand position (huge fisherman)
        const rodEndY = player.y + 115; // Hand position (huge fisherman)
        
        // Calculate direction to rod tip
        const dx = rodEndX - fishingLine.hookX;
        const dy = rodEndY - fishingLine.hookY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            // Calculate reel speed based on caught items
            let baseSpeed = fishingLine.reelSpeed;
            let caughtItems = 0;
            let totalWeight = 0;
            
            // Check for caught shrimps and calculate weight
            shrimps.forEach(shrimp => {
                if (shrimp.caught) {
                    caughtItems++;
                    // Use weight property if available, otherwise use size
                    if (shrimp.weight) {
                        totalWeight += shrimp.weight; // Use specific weight for large shrimps
                    } else {
                        totalWeight += shrimp.size; // Use size for small/medium shrimps
                    }
                }
            });
            
            // Check for caught trash
            trashItems.forEach(trash => {
                if (trash.caught) {
                    caughtItems++;
                    totalWeight += trash.size;
                }
            });
            
            // Slow down based on total weight - much more dramatic
            let finalSpeed = baseSpeed;
            if (totalWeight > 0) {
                            // Balanced slowdown: more weight = slower reeling but still playable
            const weightFactor = Math.max(0.4, 1 - (totalWeight / 150)); // Minimum 40% speed, more balanced
            finalSpeed = baseSpeed * weightFactor;
            }
            
            // Move hook towards rod tip with adjusted speed
            const moveX = (dx / distance) * finalSpeed;
            const moveY = (dy / distance) * finalSpeed;
            
            fishingLine.hookX += moveX;
            fishingLine.hookY += moveY;
        } else {
            // Hook reached rod tip - collect all caught items
            let totalPoints = 0;
            
            // Process caught shrimps
            shrimps.forEach(shrimp => {
                if (shrimp.caught) {
                    totalPoints += shrimp.points;
                    // Create final catch effect
                    createCatchEffect(rodEndX, rodEndY, shrimp.color);
                }
            });
            
            // Process caught trash
            trashItems.forEach(trash => {
                if (trash.caught) {
                    totalPoints += trash.points;
                    // Create final catch effect
                    createCatchEffect(rodEndX, rodEndY, trash.color);
                }
            });
            
            // Remove caught items
            shrimps = shrimps.filter(shrimp => !shrimp.caught);
            trashItems = trashItems.filter(trash => !trash.caught);
            
            // Add points to score
            if (totalPoints !== 0) {
                gameState.score += totalPoints;
                updateUI();
            }
            
            // Reset fishing state
            gameState.isReeling = false;
            fishingLine.isInWater = false;
            fishingLine.velocityX = 0;
            fishingLine.velocityY = 0;
        }
    }
    
    // Update shrimps
    shrimps.forEach(shrimp => {
        if (!shrimp.caught) {
            shrimp.x += shrimp.speed;
            shrimp.wigglePhase += 0.1;
            
            // Remove shrimps that go off screen
            if (shrimp.x < -100 || shrimp.x > canvas.width + 100) {
                const index = shrimps.indexOf(shrimp);
                if (index > -1) {
                    shrimps.splice(index, 1);
                    spawnShrimp();
                }
            }
        } else {
            // Follow the hook when caught
            shrimp.x = fishingLine.hookX;
            shrimp.y = fishingLine.hookY;
        }
    });
    
    // Update trash
    trashItems.forEach(trash => {
        if (!trash.caught) {
            trash.x += trash.speed;
            
            // Remove trash that goes off screen
            if (trash.x < -100 || trash.x > canvas.width + 100) {
                const index = trashItems.indexOf(trash);
                if (index > -1) {
                    trashItems.splice(index, 1);
                    spawnTrash();
                }
            }
        } else {
            // Follow the hook when caught
            trash.x = fishingLine.hookX;
            trash.y = fishingLine.hookY;
        }
    });
    
    // Check collisions
    if (gameState.isCasting || gameState.isReeling) {
        checkCollisions();
    }
}

// Check collisions between hook and items
function checkCollisions() {
    const hookRadius = 10;
    
    // Check shrimp collisions
    shrimps.forEach(shrimp => {
        if (!shrimp.caught) {
            const distance = Math.sqrt(
                Math.pow(fishingLine.hookX - shrimp.x, 2) + 
                Math.pow(fishingLine.hookY - shrimp.y, 2)
            );
            
            if (distance < hookRadius + shrimp.size) {
                shrimp.caught = true;
                if (sounds.pop) sounds.pop();
                createCatchEffect(fishingLine.hookX, fishingLine.hookY, shrimp.color);
            }
        }
    });
    
    // Check trash collisions
    trashItems.forEach(trash => {
        if (!trash.caught) {
            const distance = Math.sqrt(
                Math.pow(fishingLine.hookX - trash.x, 2) + 
                Math.pow(fishingLine.hookY - trash.y, 2)
            );
            
            if (distance < hookRadius + trash.size) {
                trash.caught = true;
                if (sounds.pop) sounds.pop();
                
                // Special effect for bomb
                if (trash.type === 'bomb') {
                    // Play explosion sound
                    if (sounds.explosion) sounds.explosion();
                    
                    // Create explosion effect
                    for (let i = 0; i < 25; i++) {
                        particles.push({
                            x: fishingLine.hookX,
                            y: fishingLine.hookY,
                            vx: (Math.random() - 0.5) * 12,
                            vy: (Math.random() - 0.5) * 12,
                            life: 1.0,
                            decay: 0.03,
                            size: Math.random() * 6 + 3,
                            color: ['#FF0000', '#FF6600', '#FFFF00', '#FFAA00'][Math.floor(Math.random() * 4)]
                        });
                    }
                } else {
                    createCatchEffect(fishingLine.hookX, fishingLine.hookY, trash.color);
                }
            }
        }
    });
}

// Main render function
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw game elements
    drawBackground();
    drawWater();
    drawShrimps();
    drawTrash();
    drawPlayer();
    updateParticles(); // Draw particles
}

// Game loop
function gameLoop() {
    updateGame();
    render();
    requestAnimationFrame(gameLoop);
}

// End game
function endGame() {
    gameState.isGameOver = true;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('gameOver').classList.remove('hidden');
}

// Timer function
function updateTimer() {
    if (!gameState.isGameOver && gameState.timeLeft > 0) {
        gameState.timeLeft--;
        updateUI();
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }
}

// Event listeners
document.addEventListener('keydown', (e) => {
    if (gameState.isGameOver) return;
    
    if (e.code === 'Space') {
        e.preventDefault();
        
        if (!gameState.isCasting && !gameState.isReeling) {
            // Start charging
            gameState.isCharging = true;
        } else if (gameState.isCasting) {
            // Start reeling
            gameState.isCasting = false;
            gameState.isReeling = true;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (gameState.isGameOver) return;
    
    if (e.code === 'Space' && gameState.isCharging) {
        // Cast the line
        gameState.isCharging = false;
        gameState.isCasting = true;
        
        // Calculate initial velocity based on power and angle
        const power = gameState.powerLevel / gameState.maxPower;
        const castSpeed = power * 15 + 5; // Speed between 5-20
        const castAngle = -Math.PI / 6; // More horizontal cast angle
        
        // Set initial position at rod tip
        const rodEndX = player.x + player.width / 2 + Math.cos(player.rodAngle) * player.rodLength;
        const rodEndY = player.y + Math.sin(player.rodAngle) * player.rodLength;
        
        fishingLine.hookX = rodEndX;
        fishingLine.hookY = rodEndY;
        
        // Set initial velocity
        fishingLine.velocityX = Math.cos(castAngle) * castSpeed;
        fishingLine.velocityY = Math.sin(castAngle) * castSpeed;
        
        gameState.powerLevel = 0;
        updateUI();
    }
});

// Mouse/touch support
canvas.addEventListener('mousedown', (e) => {
    if (gameState.isGameOver) return;
    
    if (!gameState.isCasting && !gameState.isReeling) {
        gameState.isCharging = true;
    } else if (gameState.isCasting) {
        gameState.isCasting = false;
        gameState.isReeling = true;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (gameState.isGameOver) return;
    
    if (gameState.isCharging) {
        gameState.isCharging = false;
        gameState.isCasting = true;
        
        // Calculate initial velocity based on power and angle
        const power = gameState.powerLevel / gameState.maxPower;
        const castSpeed = power * 15 + 5; // Speed between 5-20
        const castAngle = -Math.PI / 6; // More horizontal cast angle
        
        // Set initial position at rod tip
        const rodEndX = player.x + player.width / 2 + Math.cos(player.rodAngle) * player.rodLength;
        const rodEndY = player.y + Math.sin(player.rodAngle) * player.rodLength;
        
        fishingLine.hookX = rodEndX;
        fishingLine.hookY = rodEndY;
        
        // Set initial velocity
        fishingLine.velocityX = Math.cos(castAngle) * castSpeed;
        fishingLine.velocityY = Math.sin(castAngle) * castSpeed;
        
        gameState.powerLevel = 0;
        updateUI();
    }
});

// Touch support for mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.isGameOver) return;
    
    if (!gameState.isCasting && !gameState.isReeling) {
        gameState.isCharging = true;
    } else if (gameState.isCasting) {
        gameState.isCasting = false;
        gameState.isReeling = true;
    }
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (gameState.isGameOver) return;
    
    if (gameState.isCharging) {
        gameState.isCharging = false;
        gameState.isCasting = true;
        
        const castDistance = (gameState.powerLevel / gameState.maxPower) * 400 + 100;
        const castAngle = -Math.PI / 6;
        
        fishingLine.hookX = player.x + player.width / 2 + 35; // Right hand position (huge fisherman)
        fishingLine.hookY = player.y + 115; // Hand position (huge fisherman)
        
        gameState.powerLevel = 0;
        updateUI();
    }
});

// Play again button
document.getElementById('playAgainBtn').addEventListener('click', () => {
    initGame();
});

// Initialize and start the game
function startGame() {
    console.log('Starting game...');
    
    if (!canvas || !ctx) {
        console.error('Cannot start game: Canvas not available');
        return;
    }
    
    try {
        initAudio();
        initGame();
        gameLoop();
        setInterval(updateTimer, 1000);
        console.log('Game started successfully');
    } catch (error) {
        console.error('Error starting game:', error);
        document.body.innerHTML = '<h1>Error starting game: ' + error.message + '</h1>';
    }
}

// Start the game when page loads
window.addEventListener('load', loadImages);

// Draw underwater plants/seaweed
function drawUnderwaterPlants() {
    ctx.strokeStyle = 'rgba(34, 139, 34, 0.6)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 8; i++) {
        const x = i * 100 + 20;
        const plantHeight = 30 + Math.random() * 20;
        
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.quadraticCurveTo(x + 10, canvas.height - plantHeight * 0.5, x, canvas.height - plantHeight);
        ctx.stroke();
        
        // Plant leaves
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - plantHeight * 0.7);
        ctx.lineTo(x - 8, canvas.height - plantHeight * 0.8);
        ctx.moveTo(x, canvas.height - plantHeight * 0.5);
        ctx.lineTo(x + 6, canvas.height - plantHeight * 0.6);
        ctx.stroke();
    }
}

// Create particle effect when item is caught
function createCatchEffect(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            decay: 0.02,
            size: Math.random() * 4 + 2,
            color: color
        });
    }
}

// Update and draw particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Update life
        particle.life -= particle.decay;
        
        // Remove dead particles
        if (particle.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
