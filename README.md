# 🦐 Shrimp Catcher - Pond Adventure

A fun 2D fishing-style game where you catch shrimps in a peaceful pond! Built with HTML5 Canvas, CSS3, and vanilla JavaScript.

## 🎮 Game Features

### Core Gameplay
- **Power-based casting system**: Hold spacebar/mouse to charge power, release to cast
- **Realistic physics**: Parabolic trajectory with gravity and air resistance
- **Smart reeling**: Press spacebar/mouse again to reel in your catch
- **60-second timer**: Race against time to get the highest score

### Shrimp Varieties
- **Small Shrimps** (Red): Fast moving, 10 points
- **Medium Shrimps** (Teal): Moderate speed, 20 points  
- **Large Shrimps** (Blue): Slow moving, 35 points

### Obstacles
- **Tin Cans**: Brown squares that reduce your score by 5 points
- **Weeds**: Green circles that reduce your score by 3 points

### Visual & Audio
- **Peaceful pond background** with animated water waves
- **Cartoonish art style** with smooth animations
- **Sound effects**: Splash when line hits water, pop when catching items
- **Responsive design** that works on desktop and mobile
- **Custom image support**: Use your own drawings for characters and items

## 🎯 How to Play

### Controls
- **Desktop**: Use SPACEBAR to charge and cast
- **Mobile**: Tap and hold to charge, release to cast
- **Both**: Press SPACEBAR/tap again to reel in

### Gameplay Steps
1. **Charge Power**: Hold SPACEBAR (or click/tap) to fill the power meter
2. **Cast Line**: Release to cast the fishing line with realistic physics
3. **Wait for Catch**: The line sinks slowly - watch for shrimps to swim by
4. **Reel In**: Press SPACEBAR (or click/tap) again to reel in your catch
5. **Score Points**: Catch shrimps for points, avoid trash items
6. **Beat the Clock**: You have 60 seconds to get the highest score!

### Scoring System
- Small Shrimp: +10 points
- Medium Shrimp: +20 points  
- Large Shrimp: +35 points
- Tin Can: -5 points
- Weed: -3 points

## 🚀 How to Run

1. **Download** all files to a folder
2. **Open** `index.html` in any modern web browser
3. **Start playing** immediately - no installation required!

### File Structure
```
shrimp-catcher/
├── images/           # Custom images folder (optional)
│   ├── fisherman.png
│   ├── shrimp-small.png
│   ├── shrimp-medium.png
│   ├── shrimp-large.png
│   ├── trash-can.png
│   ├── trash-weed.png
│   ├── hook.png
│   └── rod.png
├── index.html        # Main HTML file
├── style.css         # Styling and responsive design
├── script.js         # Game logic and mechanics
└── README.md         # This file
```

## 🎨 Custom Images

The game supports custom images! Place your own drawings in the `images/` folder:

### Required Image Files:
- `fisherman.png` - Your fisherman character (60x80px recommended)
- `shrimp-small.png` - Small shrimp (30x30px recommended)
- `shrimp-medium.png` - Medium shrimp (50x50px recommended)
- `shrimp-large.png` - Large shrimp (70x70px recommended)
- `trash-can.png` - Tin can (40x40px recommended)
- `trash-weed.png` - Weed (30x30px recommended)
- `hook.png` - Fishing hook (16x16px recommended)
- `rod.png` - Fishing rod (80x10px recommended)

### Image Guidelines:
- **Format**: PNG with transparency
- **Size**: Recommended sizes above, but any size works
- **Style**: Cartoonish, colorful, matching the game theme
- **Fallback**: If images aren't found, the game uses canvas drawings

## 🛠️ Technical Details

### Built With
- **HTML5 Canvas API** for smooth 2D graphics
- **CSS3** for responsive design and animations
- **Vanilla JavaScript** for game logic
- **Web Audio API** for sound effects
- **Realistic physics** with gravity and air resistance

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### Performance Features
- **60 FPS** smooth animations
- **Responsive canvas** that adapts to screen size
- **Efficient collision detection**
- **Memory management** with object pooling
- **Image loading system** with fallback to canvas drawings

## 🎨 Art Style

The game features a **colorful cartoon aesthetic** with:
- Soft gradients for sky and water
- Animated clouds drifting across the sky
- Smooth wave animations on the water surface
- Cute shrimp characters with wiggle animations
- Simple but charming player character
- Support for custom artwork

## 🔧 Customization

You can easily modify the game by editing `script.js`:

### Adjust Difficulty
```javascript
// Change game duration
gameState.timeLeft = 90; // 90 seconds instead of 60

// Modify shrimp speeds
shrimpTypes[0].speed = 1.5; // Slower small shrimps

// Adjust scoring
shrimpTypes[2].points = 50; // More points for large shrimps
```

### Add New Features
- New shrimp types with different behaviors
- Power-ups that appear in the water
- Multiple fishing rods with different properties
- Weather effects that affect gameplay

## 🐛 Troubleshooting

### Game Won't Start
- Ensure all files are in the same folder
- Check that your browser supports HTML5 Canvas
- Try refreshing the page

### No Sound
- Some browsers require user interaction before playing audio
- Click anywhere on the game to enable sound
- Check your browser's audio settings

### Performance Issues
- Close other browser tabs to free up memory
- Try a different browser if problems persist
- Ensure your device meets minimum requirements

### Custom Images Not Loading
- Check that image files are in the `images/` folder
- Verify file names match exactly (case-sensitive)
- Use PNG format for best compatibility
- Game will use canvas drawings as fallback

## 📱 Mobile Support

The game is fully responsive and works great on mobile devices:
- Touch controls for casting and reeling
- Optimized UI layout for small screens
- Smooth performance on modern mobile browsers

## 🎉 Have Fun!

Enjoy catching shrimps in this peaceful pond adventure! The game is designed to be relaxing yet engaging, perfect for quick gaming sessions.

---

*Created with ❤️ using HTML5, CSS3, and JavaScript*
