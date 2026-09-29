/* ============================================
   SPACE TYPING - SESC Welcome Day Game
   Complete game logic: menus, canvas rendering,
   typing mechanics, scoring, and sound effects.
   ============================================ */

// ============================================
// WORD LISTS (space-themed!)
// ============================================
const WORDS = {
    easy: [
        'sun', 'star', 'moon', 'mars', 'ship', 'fuel', 'beam',
        'warp', 'void', 'dust', 'ring', 'nova', 'bolt', 'atom',
        'ray', 'orb', 'jet', 'pod', 'core', 'sky', 'arc', 'glow',
        'dark', 'fast', 'zoom', 'spin', 'rock', 'fire', 'wave',
        'zone', 'path', 'code', 'data', 'link', 'tech', 'byte',
        'chip', 'disk', 'unit', 'node', 'flux', 'ion', 'gas',
        'red', 'blue', 'cyan', 'dusk', 'dawn', 'apex', 'rift'
    ],
    medium: [
        'comet', 'orbit', 'lunar', 'solar', 'alien', 'laser',
        'space', 'pilot', 'radar', 'cargo', 'drone', 'probe',
        'earth', 'pluto', 'light', 'power', 'force', 'shield',
        'galaxy', 'cosmos', 'rocket', 'meteor', 'nebula', 'photon',
        'fusion', 'engine', 'signal', 'vector', 'plasma', 'quasar',
        'thrust', 'module', 'pulsar', 'wormhole', 'cipher', 'pixel',
        'server', 'debug', 'binary', 'matrix', 'surge', 'flare',
        'titan', 'venus', 'omega', 'delta', 'sigma', 'alpha'
    ],
    hard: [
        'asteroid', 'universe', 'gravity', 'quantum', 'eclipse',
        'orbital', 'nuclear', 'shuttle', 'station', 'captain',
        'reactor', 'starship', 'explorer', 'frontier', 'spectrum',
        'velocity', 'momentum', 'supernova', 'satellite', 'telescope',
        'astronaut', 'magnetar', 'radiation', 'navigate', 'commander',
        'thruster', 'particle', 'neutron', 'electron', 'protocol',
        'terminal', 'compiler', 'function', 'wormhole', 'lightyear',
        'antimatter', 'blackhole', 'singularity', 'interstellar',
        'atmosphere', 'spacetime', 'hyperdrive', 'frequency'
    ]
};

// ============================================
// DIFFICULTY CONFIG
// ============================================
const DIFFICULTY = {
    easy: {
        label: 'Easy',
        lives: 5,
        baseSpeed: 0.4,
        spawnInterval: 3200,
        maxAsteroids: 4,
        speedIncrease: 0.012,
        spawnDecrease: 40,
        minSpawnInterval: 1800,
        wordList: 'easy',
        color: '#b8bb26'
    },
    medium: {
        label: 'Medium',
        lives: 3,
        baseSpeed: 0.6,
        spawnInterval: 2600,
        maxAsteroids: 5,
        speedIncrease: 0.018,
        spawnDecrease: 50,
        minSpawnInterval: 1400,
        wordList: 'medium',
        color: '#fabd2f'
    },
    hard: {
        label: 'Hard',
        lives: 2,
        baseSpeed: 0.85,
        spawnInterval: 2200,
        maxAsteroids: 6,
        speedIncrease: 0.025,
        spawnDecrease: 60,
        minSpawnInterval: 1000,
        wordList: 'hard',
        color: '#fb4934'
    }
};

const GAME_DURATION = 60; // seconds

// ============================================
// GRUVBOX COLORS (for canvas)
// ============================================
const GRV = {
    bg:       '#1d2021',
    bg1:      '#3c3836',
    bg2:      '#504945',
    bg3:      '#665c54',
    fg:       '#ebdbb2',
    fg1:      '#d5c4a1',
    fg3:      '#a89984',
    fg4:      '#928374',
    red:      '#fb4934',
    green:    '#b8bb26',
    yellow:   '#fabd2f',
    blue:     '#83a598',
    purple:   '#d3869b',
    aqua:     '#8ec07c',
    orange:   '#fe8019'
};

// ============================================
// SOUND MANAGER (Web Audio API)
// ============================================
class SoundManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.muted = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not available');
        }
    }

    play(type) {
        if (!this.initialized || this.muted) return;
        try {
            this['_' + type]();
        } catch (e) { /* silent fail */ }
    }

    _shoot() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.12);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.start(t);
        osc.stop(t + 0.12);
    }

    _explode() {
        const t = this.ctx.currentTime;
        const len = 0.25;
        const bufferSize = this.ctx.sampleRate * len;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + len);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + len);
        source.start(t);
    }

    _hit() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.3);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    _type() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    _wrongType() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    _countdown() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    _countdownGo() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1100, t + 0.1);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    _victory() {
        const t = this.ctx.currentTime;
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + i * 0.12);
            gain.gain.setValueAtTime(0, t + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.1, t + i * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.3);
            osc.start(t + i * 0.12);
            osc.stop(t + i * 0.12 + 0.3);
        });
    }

    _gameover() {
        const t = this.ctx.currentTime;
        const notes = [440, 370, 311, 220];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t + i * 0.15);
            gain.gain.setValueAtTime(0, t + i * 0.15);
            gain.gain.linearRampToValueAtTime(0.08, t + i * 0.15 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.35);
            osc.start(t + i * 0.15);
            osc.stop(t + i * 0.15 + 0.35);
        });
    }
}

// ============================================
// STAR FIELD (background stars)
// ============================================
class StarField {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.resize();
        this.initStars();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initStars() {
        this.stars = [];
        const count = Math.floor((this.canvas.width * this.canvas.height) / 4000);
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.3 + 0.05,
                brightness: Math.random() * 0.5 + 0.5,
                twinkleSpeed: Math.random() * 0.02 + 0.005
            });
        }
    }

    update(time) {
        for (const star of this.stars) {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
            star.brightness = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const star of this.stars) {
            const alpha = star.brightness;
            this.ctx.fillStyle = `rgba(235, 219, 178, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}

// ============================================
// PARTICLE (explosion effects)
// ============================================
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1;
        this.decay = Math.random() * 0.025 + 0.015;
        this.size = Math.random() * 4 + 2;
        this.color = color || GRV.orange;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.03; // slight gravity
        this.life -= this.decay;
        this.size *= 0.98;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ============================================
// SCORE POPUP (floating text)
// ============================================
class ScorePopup {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color || GRV.yellow;
        this.life = 1;
        this.vy = -1.5;
    }

    update() {
        this.y += this.vy;
        this.vy *= 0.98;
        this.life -= 0.018;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.font = `bold 18px 'Orbitron', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1;
    }
}

// ============================================
// ASTEROID
// ============================================
class Asteroid {
    constructor(word, x, speed, canvasWidth) {
        this.word = word;
        this.speed = speed;
        this.radius = Math.max(30, word.length * 7 + 10);
        // Keep within canvas bounds
        this.x = Math.max(this.radius + 10, Math.min(x, canvasWidth - this.radius - 10));
        this.y = -this.radius - 20;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.015;
        this.targeted = false;
        this.matchedChars = 0;
        this.shape = this._generateShape();
        this.destroyed = false;
        this.opacity = 1;
    }

    _generateShape() {
        const points = [];
        const numPoints = 8 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            const r = this.radius * (0.75 + Math.random() * 0.25);
            points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
        }
        return points;
    }

    update(dt) {
        this.y += this.speed * dt;
        this.rotation += this.rotSpeed;
    }

    draw(ctx) {
        if (this.destroyed) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Targeted glow
        if (this.targeted) {
            ctx.shadowColor = GRV.blue;
            ctx.shadowBlur = 20;
        }

        // Draw asteroid body
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.moveTo(this.shape[0].x, this.shape[0].y);
        for (let i = 1; i < this.shape.length; i++) {
            ctx.lineTo(this.shape[i].x, this.shape[i].y);
        }
        ctx.closePath();

        // Fill with gradient
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        grad.addColorStop(0, this.targeted ? '#5a524c' : '#504945');
        grad.addColorStop(1, this.targeted ? '#3c3836' : '#282828');
        ctx.fillStyle = grad;
        ctx.fill();

        // Outline
        ctx.strokeStyle = this.targeted ? GRV.blue : GRV.bg3;
        ctx.lineWidth = this.targeted ? 2 : 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Reset rotation for text
        ctx.rotate(-this.rotation);

        // Draw word
        const fontSize = Math.min(16, Math.max(11, 140 / this.word.length));
        ctx.font = `bold ${fontSize}px 'Share Tech Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (this.matchedChars > 0) {
            // Draw matched chars in green
            const matched = this.word.substring(0, this.matchedChars);
            const remaining = this.word.substring(this.matchedChars);

            const fullWidth = ctx.measureText(this.word).width;
            const matchedWidth = ctx.measureText(matched).width;
            const startX = -fullWidth / 2;

            ctx.textAlign = 'left';
            ctx.fillStyle = GRV.green;
            ctx.fillText(matched, startX, 0);
            ctx.fillStyle = GRV.fg;
            ctx.fillText(remaining, startX + matchedWidth, 0);
        } else {
            ctx.fillStyle = GRV.fg;
            ctx.fillText(this.word, 0, 0);
        }

        ctx.restore();
    }
}

// ============================================
// LASER BEAM
// ============================================
class Laser {
    constructor(fromX, fromY, toX, toY) {
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
        this.progress = 0;
        this.life = 1;
        this.width = 3;
    }

    update() {
        this.progress = Math.min(1, this.progress + 0.15);
        if (this.progress >= 1) {
            this.life -= 0.08;
        }
    }

    draw(ctx) {
        if (this.life <= 0) return;

        const currentX = this.fromX + (this.toX - this.fromX) * this.progress;
        const currentY = this.fromY + (this.toY - this.fromY) * this.progress;

        ctx.save();
        ctx.globalAlpha = this.life;

        // Outer glow
        ctx.strokeStyle = GRV.aqua;
        ctx.lineWidth = this.width + 6;
        ctx.globalAlpha = this.life * 0.2;
        ctx.beginPath();
        ctx.moveTo(this.fromX, this.fromY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Main beam
        ctx.globalAlpha = this.life;
        ctx.strokeStyle = GRV.green;
        ctx.lineWidth = this.width;
        ctx.beginPath();
        ctx.moveTo(this.fromX, this.fromY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.fromX, this.fromY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        ctx.restore();
    }
}

// ============================================
// SHIP
// ============================================
class Ship {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = canvas.width / 2;
        this.y = canvas.height - 70;
        this.width = 40;
        this.height = 50;
        this.engineFlicker = 0;
        this.glowing = false;
    }

    resize() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height - 70;
    }

    update(time) {
        this.engineFlicker = Math.sin(time * 0.01) * 0.3 + 0.7;
    }

    draw(ctx) {
        const x = this.x;
        const y = this.y;

        ctx.save();

        // Engine flame
        const flameHeight = 15 + this.engineFlicker * 10;
        const flameGrad = ctx.createLinearGradient(x, y + 18, x, y + 18 + flameHeight);
        flameGrad.addColorStop(0, GRV.yellow);
        flameGrad.addColorStop(0.4, GRV.orange);
        flameGrad.addColorStop(1, 'rgba(251, 73, 52, 0)');

        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(x - 8, y + 18);
        ctx.quadraticCurveTo(x, y + 18 + flameHeight, x + 8, y + 18);
        ctx.fill();

        // Ship glow when targeting
        if (this.glowing) {
            ctx.shadowColor = GRV.blue;
            ctx.shadowBlur = 25;
        }

        // Main body
        ctx.beginPath();
        ctx.moveTo(x, y - 22);       // nose
        ctx.lineTo(x + 8, y - 5);    // right upper
        ctx.lineTo(x + 12, y + 8);   // right mid
        ctx.lineTo(x + 22, y + 18);  // right wing tip
        ctx.lineTo(x + 10, y + 14);  // right wing inner
        ctx.lineTo(x + 8, y + 18);   // right bottom
        ctx.lineTo(x - 8, y + 18);   // left bottom
        ctx.lineTo(x - 10, y + 14);  // left wing inner
        ctx.lineTo(x - 22, y + 18);  // left wing tip
        ctx.lineTo(x - 12, y + 8);   // left mid
        ctx.lineTo(x - 8, y - 5);    // left upper
        ctx.closePath();

        const bodyGrad = ctx.createLinearGradient(x, y - 22, x, y + 18);
        bodyGrad.addColorStop(0, '#83a598');
        bodyGrad.addColorStop(0.5, '#5d8a7d');
        bodyGrad.addColorStop(1, '#458588');
        ctx.fillStyle = bodyGrad;
        ctx.fill();
        ctx.strokeStyle = GRV.fg1;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Cockpit window
        ctx.beginPath();
        ctx.ellipse(x, y - 6, 4, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = GRV.yellow;
        ctx.fill();
        ctx.strokeStyle = GRV.fg;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Wing details
        ctx.strokeStyle = GRV.fg3;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(x - 16, y + 16);
        ctx.lineTo(x - 10, y + 6);
        ctx.moveTo(x + 16, y + 16);
        ctx.lineTo(x + 10, y + 6);
        ctx.stroke();

        ctx.restore();
    }
}

// ============================================
// MAIN GAME CLASS
// ============================================
class Game {
    constructor() {
        // DOM references
        this.screens = {
            menu: document.getElementById('menu-screen'),
            countdown: document.getElementById('countdown-screen'),
            game: document.getElementById('game-screen'),
            gameover: document.getElementById('gameover-screen')
        };

        this.bgCanvas = document.getElementById('bg-canvas');
        this.gameCanvas = document.getElementById('game-canvas');
        this.gameCtx = this.gameCanvas.getContext('2d');

        this.wordInput = document.getElementById('word-input');
        this.inputWrapper = document.getElementById('input-wrapper');
        this.inputTarget = document.getElementById('input-target');

        // Systems
        this.sound = new SoundManager();
        this.starField = new StarField(this.bgCanvas);
        this.ship = null;

        // Game state
        this.difficulty = 'easy';
        this.caseSensitive = false;
        this.state = 'menu'; // menu, countdown, playing, gameover
        this.animFrame = null;
        this.lastTime = 0;

        // Game objects
        this.asteroids = [];
        this.lasers = [];
        this.particles = [];
        this.popups = [];

        // Stats
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.wordsTyped = 0;
        this.totalKeystrokes = 0;
        this.lives = 0;
        this.maxLives = 0;
        this.timeRemaining = GAME_DURATION;
        this.gameStartTime = 0;
        this.elapsedTime = 0;

        // Spawn management
        this.spawnTimer = 0;
        this.currentSpawnInterval = 0;
        this.currentSpeed = 0;
        this.usedWords = new Set();

        // Target tracking
        this.currentTarget = null;

        // Init
        this._setupEventListeners();
        this._resize();
        this._startBackgroundLoop();
    }

    // ---- Setup ----

    _setupEventListeners() {
        // Resize
        window.addEventListener('resize', () => this._resize());

        // Difficulty buttons
        document.querySelectorAll('#difficulty-group .btn-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#difficulty-group .btn-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.value;
                this.sound.init();
                this.sound.play('type');
            });
        });

        // Case toggle
        document.getElementById('case-toggle').addEventListener('click', (e) => {
            const toggle = e.currentTarget;
            const pressed = toggle.getAttribute('aria-pressed') === 'true';
            toggle.setAttribute('aria-pressed', !pressed);
            this.caseSensitive = !pressed;
            this.sound.init();
            this.sound.play('type');
        });

        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.sound.init();
            this._startCountdown();
        });

        // Restart / Menu buttons
        document.getElementById('restart-btn').addEventListener('click', () => {
            this._startCountdown();
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this._showScreen('menu');
        });

        // Word input
        this.wordInput.addEventListener('input', () => this._onInput());

        // Prevent form submission on Enter
        this.wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') e.preventDefault();
        });
    }

    _resize() {
        this.starField.resize();
        this.starField.initStars();
        this.gameCanvas.width = window.innerWidth;
        this.gameCanvas.height = window.innerHeight;
        if (this.ship) this.ship.resize();
    }

    // ---- Screen Management ----

    _showScreen(name) {
        this.state = name;
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens[name].classList.add('active');
    }

    // ---- Background Stars Loop ----

    _startBackgroundLoop() {
        let time = 0;
        const loop = () => {
            time++;
            this.starField.update(time);
            this.starField.draw();
            requestAnimationFrame(loop);
        };
        loop();
    }

    // ---- Countdown ----

    _startCountdown() {
        this._showScreen('countdown');
        const display = document.getElementById('countdown-display');
        let count = 3;
        display.textContent = count;
        display.classList.remove('go-text');
        this.sound.play('countdown');

        const tick = () => {
            count--;
            if (count > 0) {
                display.textContent = count;
                display.classList.remove('go-text');
                display.style.animation = 'none';
                display.offsetHeight; // reflow
                display.style.animation = 'countPulse 0.8s ease-out';
                this.sound.play('countdown');
                setTimeout(tick, 900);
            } else if (count === 0) {
                display.textContent = 'GO!';
                display.classList.add('go-text');
                display.style.animation = 'none';
                display.offsetHeight;
                display.style.animation = 'countPulse 0.8s ease-out';
                this.sound.play('countdownGo');
                setTimeout(() => this._startGame(), 600);
            }
        };

        setTimeout(tick, 900);
    }

    // ---- Game Start ----

    _startGame() {
        const config = DIFFICULTY[this.difficulty];

        // Reset state
        this.asteroids = [];
        this.lasers = [];
        this.particles = [];
        this.popups = [];
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.wordsTyped = 0;
        this.totalKeystrokes = 0;
        this.lives = config.lives;
        this.maxLives = config.lives;
        this.timeRemaining = GAME_DURATION;
        this.gameStartTime = performance.now();
        this.elapsedTime = 0;
        this.spawnTimer = 0;
        this.currentSpawnInterval = config.spawnInterval;
        this.currentSpeed = config.baseSpeed;
        this.usedWords = new Set();
        this.currentTarget = null;
        this.wordInput.value = '';
        this.inputWrapper.classList.remove('correct', 'wrong');
        this.inputTarget.classList.remove('visible');
        this.inputTarget.textContent = '';

        // Create ship
        this.ship = new Ship(this.gameCanvas);

        // Setup HUD
        this._updateLivesDisplay();
        this._updateScoreDisplay();
        this._updateTimerDisplay();
        this._updateComboDisplay();

        // Difficulty badge
        const badge = document.getElementById('difficulty-badge');
        badge.innerHTML = `<i class="fas fa-gauge-high"></i> ${config.label}`;
        badge.style.color = config.color;
        badge.style.borderColor = config.color;

        // Show game screen and focus input
        this._showScreen('game');
        this.state = 'playing';
        this.lastTime = performance.now();

        // Focus input after a tiny delay to ensure screen is shown
        setTimeout(() => this.wordInput.focus(), 100);

        // Start game loop
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this._gameLoop();
    }

    // ---- Game Loop ----

    _gameLoop() {
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 16.667, 3); // normalize to ~60fps, cap at 3x
        this.lastTime = now;

        if (this.state !== 'playing') return;

        this.elapsedTime = (now - this.gameStartTime) / 1000;

        // Update timer
        this.timeRemaining = Math.max(0, GAME_DURATION - this.elapsedTime);
        this._updateTimerDisplay();

        if (this.timeRemaining <= 0) {
            this._endGame(true); // survived = victory!
            return;
        }

        // Increase difficulty over time
        this._scaleDifficulty();

        // Spawn asteroids
        this._spawnAsteroids(dt);

        // Update objects
        this._updateAsteroids(dt);
        this._updateLasers();
        this._updateParticles();
        this._updatePopups();
        this.ship.update(now);

        // Draw everything
        this._draw();

        this.animFrame = requestAnimationFrame(() => this._gameLoop());
    }

    _scaleDifficulty() {
        const config = DIFFICULTY[this.difficulty];
        const t = this.elapsedTime;

        // Gradually increase speed
        this.currentSpeed = config.baseSpeed + config.speedIncrease * t;

        // Gradually decrease spawn interval
        this.currentSpawnInterval = Math.max(
            config.minSpawnInterval,
            config.spawnInterval - config.spawnDecrease * t
        );
    }

    // ---- Spawn ----

    _spawnAsteroids(dt) {
        this.spawnTimer += dt * 16.667;

        if (this.spawnTimer >= this.currentSpawnInterval) {
            this.spawnTimer = 0;

            const config = DIFFICULTY[this.difficulty];
            if (this.asteroids.length >= config.maxAsteroids) return;

            const word = this._getRandomWord();
            if (!word) return;

            const x = Math.random() * (this.gameCanvas.width - 120) + 60;
            const speedVariation = 0.8 + Math.random() * 0.4;
            const asteroid = new Asteroid(word, x, this.currentSpeed * speedVariation, this.gameCanvas.width);
            this.asteroids.push(asteroid);
        }
    }

    _getRandomWord() {
        const config = DIFFICULTY[this.difficulty];
        const wordList = WORDS[config.wordList];

        // Try to find a word not already on screen
        const onScreenWords = new Set(this.asteroids.map(a => a.word));
        const available = wordList.filter(w => !onScreenWords.has(w));

        if (available.length === 0) {
            // All words in use, just pick a random one not on screen (from extended pool)
            return wordList[Math.floor(Math.random() * wordList.length)];
        }

        // Also try to avoid recently used words
        const fresh = available.filter(w => !this.usedWords.has(w));
        const pool = fresh.length > 0 ? fresh : available;

        const word = pool[Math.floor(Math.random() * pool.length)];
        this.usedWords.add(word);

        // Clear used words set when it gets too large
        if (this.usedWords.size > wordList.length * 0.7) {
            this.usedWords.clear();
        }

        return word;
    }

    // ---- Input Handling ----

    _onInput() {
        const typed = this.wordInput.value;
        this.totalKeystrokes++;

        if (!typed) {
            // Cleared input
            this._clearTarget();
            this.inputWrapper.classList.remove('correct', 'wrong');
            return;
        }

        // Find matching asteroid
        const match = this._findBestMatch(typed);

        if (match) {
            this.inputWrapper.classList.remove('wrong');
            this.inputWrapper.classList.add('correct');
            this.ship.glowing = true;

            // Update target highlighting
            this._setTarget(match, typed.length);

            // Check for complete match
            const wordToCompare = this.caseSensitive ? match.word : match.word.toLowerCase();
            const typedToCompare = this.caseSensitive ? typed : typed.toLowerCase();

            if (typedToCompare === wordToCompare) {
                // Word completed!
                this._destroyAsteroid(match);
                this.wordInput.value = '';
                this.inputWrapper.classList.remove('correct');
                this._clearTarget();
            } else {
                this.sound.play('type');
            }
        } else {
            // No match
            this.inputWrapper.classList.remove('correct');
            this.inputWrapper.classList.add('wrong');
            this.ship.glowing = false;
            this._clearTarget();
            this.sound.play('wrongType');
        }
    }

    _findBestMatch(typed) {
        const typedLower = this.caseSensitive ? typed : typed.toLowerCase();
        let bestMatch = null;
        let bestY = -Infinity;

        for (const asteroid of this.asteroids) {
            if (asteroid.destroyed) continue;
            const word = this.caseSensitive ? asteroid.word : asteroid.word.toLowerCase();
            if (word.startsWith(typedLower)) {
                if (asteroid.y > bestY) {
                    bestY = asteroid.y;
                    bestMatch = asteroid;
                }
            }
        }

        return bestMatch;
    }

    _setTarget(asteroid, matchedChars) {
        // Clear previous target
        if (this.currentTarget && this.currentTarget !== asteroid) {
            this.currentTarget.targeted = false;
            this.currentTarget.matchedChars = 0;
        }

        this.currentTarget = asteroid;
        asteroid.targeted = true;
        asteroid.matchedChars = matchedChars;

        // Show target indicator
        this.inputTarget.textContent = asteroid.word.toUpperCase();
        this.inputTarget.classList.add('visible');
    }

    _clearTarget() {
        if (this.currentTarget) {
            this.currentTarget.targeted = false;
            this.currentTarget.matchedChars = 0;
            this.currentTarget = null;
        }
        this.ship.glowing = false;
        this.inputTarget.classList.remove('visible');
        this.inputTarget.textContent = '';
    }

    // ---- Destroy Asteroid ----

    _destroyAsteroid(asteroid) {
        // Fire laser
        const laser = new Laser(this.ship.x, this.ship.y - 22, asteroid.x, asteroid.y);
        this.lasers.push(laser);

        // Create explosion particles
        const colors = [GRV.orange, GRV.yellow, GRV.red, GRV.fg];
        for (let i = 0; i < 20; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(asteroid.x, asteroid.y, color));
        }

        // Score calculation
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        const basePoints = asteroid.word.length * 10;
        const comboMultiplier = Math.min(this.combo, 10);
        const points = basePoints * comboMultiplier;
        this.score += points;
        this.wordsTyped++;

        // Score popup
        let popupText = `+${points}`;
        if (comboMultiplier > 1) popupText += ` (x${comboMultiplier})`;
        this.popups.push(new ScorePopup(asteroid.x, asteroid.y, popupText, GRV.yellow));

        // Update displays
        this._updateScoreDisplay();
        this._updateComboDisplay();

        // Mark destroyed and remove
        asteroid.destroyed = true;
        this.asteroids = this.asteroids.filter(a => a !== asteroid);

        // Sound
        this.sound.play('shoot');
        setTimeout(() => this.sound.play('explode'), 80);
    }

    // ---- Asteroid reaches bottom ----

    _asteroidReachedBottom(asteroid) {
        this.lives--;
        this.combo = 0;
        this._updateLivesDisplay();
        this._updateComboDisplay();

        // Screen shake
        const gameScreen = this.screens.game;
        gameScreen.classList.add('screen-shake');
        setTimeout(() => gameScreen.classList.remove('screen-shake'), 300);

        // Warning particles (red)
        for (let i = 0; i < 12; i++) {
            this.particles.push(new Particle(asteroid.x, asteroid.y, GRV.red));
        }

        // Popup
        this.popups.push(new ScorePopup(asteroid.x, asteroid.y - 20, 'MISSED!', GRV.red));

        this.sound.play('hit');

        // Check game over
        if (this.lives <= 0) {
            this._endGame(false);
        }
    }

    // ---- Update Functions ----

    _updateAsteroids(dt) {
        const deadZone = this.gameCanvas.height - 55;

        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroid = this.asteroids[i];
            asteroid.update(dt);

            if (asteroid.y >= deadZone) {
                if (asteroid === this.currentTarget) {
                    this._clearTarget();
                    this.wordInput.value = '';
                    this.inputWrapper.classList.remove('correct', 'wrong');
                }
                this.asteroids.splice(i, 1);
                this._asteroidReachedBottom(asteroid);
            }
        }
    }

    _updateLasers() {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            this.lasers[i].update();
            if (this.lasers[i].life <= 0) {
                this.lasers.splice(i, 1);
            }
        }
    }

    _updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    _updatePopups() {
        for (let i = this.popups.length - 1; i >= 0; i--) {
            this.popups[i].update();
            if (this.popups[i].life <= 0) {
                this.popups.splice(i, 1);
            }
        }
    }

    // ---- Draw ----

    _draw() {
        const ctx = this.gameCtx;
        const w = this.gameCanvas.width;
        const h = this.gameCanvas.height;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Draw targeting line
        if (this.currentTarget && !this.currentTarget.destroyed) {
            ctx.save();
            ctx.strokeStyle = GRV.blue;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.setLineDash([5, 10]);
            ctx.beginPath();
            ctx.moveTo(this.ship.x, this.ship.y - 22);
            ctx.lineTo(this.currentTarget.x, this.currentTarget.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // Draw asteroids
        for (const asteroid of this.asteroids) {
            asteroid.draw(ctx);
        }

        // Draw lasers
        for (const laser of this.lasers) {
            laser.draw(ctx);
        }

        // Draw particles
        for (const particle of this.particles) {
            particle.draw(ctx);
        }

        // Draw popups
        for (const popup of this.popups) {
            popup.draw(ctx);
        }

        // Draw ship
        if (this.ship) {
            this.ship.draw(ctx);
        }

        // Draw danger zone line
        const dangerY = h - 55;
        ctx.save();
        ctx.strokeStyle = GRV.red;
        ctx.globalAlpha = 0.15;
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, dangerY);
        ctx.lineTo(w, dangerY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    // ---- HUD Updates ----

    _updateScoreDisplay() {
        document.getElementById('score-display').textContent = this.score.toLocaleString();
    }

    _updateTimerDisplay() {
        const seconds = Math.ceil(this.timeRemaining);
        document.getElementById('timer-display').textContent = seconds;

        const timerItem = document.querySelector('.timer-item');
        const timerBar = document.getElementById('timer-bar');
        const percent = (this.timeRemaining / GAME_DURATION) * 100;
        timerBar.style.width = percent + '%';

        if (seconds <= 10) {
            timerItem.classList.add('warning');
            timerBar.classList.add('warning');
        } else {
            timerItem.classList.remove('warning');
            timerBar.classList.remove('warning');
        }
    }

    _updateLivesDisplay() {
        const container = document.getElementById('lives-display');
        let html = '';
        for (let i = 0; i < this.maxLives; i++) {
            if (i < this.lives) {
                html += '<i class="fas fa-heart"></i>';
            } else {
                html += '<i class="fas fa-heart lost"></i>';
            }
        }
        container.innerHTML = html;
    }

    _updateComboDisplay() {
        const container = document.getElementById('combo-container');
        const display = document.getElementById('combo-display');

        if (this.combo > 1) {
            container.style.opacity = '1';
            display.textContent = `x${this.combo}`;
            container.classList.add('active');
            setTimeout(() => container.classList.remove('active'), 300);
        } else {
            container.style.opacity = '0';
        }
    }

    // ---- End Game ----

    _endGame(survived) {
        this.state = 'gameover';
        if (this.animFrame) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }

        // Play appropriate sound
        setTimeout(() => {
            this.sound.play(survived ? 'victory' : 'gameover');
        }, 300);

        // Update game over screen
        const icon = document.getElementById('gameover-icon');
        const title = document.getElementById('gameover-title');
        const subtitle = document.getElementById('gameover-subtitle');

        if (survived) {
            icon.innerHTML = '<i class="fas fa-trophy"></i>';
            icon.className = 'gameover-icon victory';
            title.textContent = 'MISSION COMPLETE';
            title.style.color = GRV.yellow;
            subtitle.textContent = 'Outstanding work, pilot!';
        } else {
            icon.innerHTML = '<i class="fas fa-skull-crossbones"></i>';
            icon.className = 'gameover-icon defeat';
            title.textContent = 'MISSION FAILED';
            title.style.color = GRV.red;
            subtitle.textContent = 'The asteroids got you this time...';
        }

        // Stats
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-words').textContent = this.wordsTyped;
        const minutesPlayed = this.elapsedTime / 60;
        const wpm = minutesPlayed > 0 ? Math.round(this.wordsTyped / minutesPlayed) : 0;
        document.getElementById('final-wpm').textContent = wpm;
        document.getElementById('final-combo').textContent = this.maxCombo + 'x';

        // Show game over after brief delay
        setTimeout(() => {
            this._showScreen('gameover');
        }, 500);
    }
}

// ============================================
// INITIALIZE GAME
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});
