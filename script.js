// Confetti & Particle System
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationFrameId;

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Particle Class
class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'emoji', 'airplane', 'rect'
        this.size = Math.random() * 15 + 10;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * -10 - 5; // upward launch
        this.gravity = 0.25;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = Math.random() * 0.1 - 0.05;
        this.color = `hsl(${Math.random() * 360}, 90%, 60%)`;
        
        // Emojis list
        const emojis = ['🎂', '✈️', '🎉', '🥳', '🎈', '🍾', '🍕', '👑'];
        this.emoji = emojis[Math.floor(Math.random() * emojis.length)];
    }

    update() {
        this.speedY += this.gravity;
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.type === 'emoji') {
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, 0, 0);
        } else if (this.type === 'airplane') {
            // Draw a tiny paper airplane
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = varColor('--cyan');
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -this.size / 2);
            ctx.lineTo(this.size / 2, this.size / 2);
            ctx.lineTo(0, this.size / 4);
            ctx.lineTo(-this.size / 2, this.size / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            // Classic rect confetti
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        }

        ctx.restore();
    }
}

// Get CSS custom properties
function varColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#00F2FE';
}

function spawnConfetti(count = 100, x = canvas.width / 2, y = canvas.height * 0.7) {
    const types = ['emoji', 'airplane', 'rect'];
    for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        particles.push(new Particle(x, y, type));
    }
    
    if (!animationFrameId) {
        animateParticles();
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles = particles.filter(p => p.y < canvas.height + 50 && p.x > -50 && p.x < canvas.width + 50);
    
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(animateParticles);
    } else {
        animationFrameId = null;
    }
}

// Audio System (Web Audio API)
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Play Classic Cabin Chime (Two-tone)
function playCabinChime() {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    
    // First Tone: C#5 (554.37 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(554.37, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 1.2);
    
    // Second Tone: A4 (440.00 Hz) at 0.4 seconds delay
    const delay = 0.45;
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(440.00, now + delay);
    gain2.gain.setValueAtTime(0, now + delay);
    gain2.gain.linearRampToValueAtTime(0.15, now + delay + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.2);
    
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + delay);
    osc2.stop(now + delay + 1.2);
}

// Play low frequency engine rumble for turbulence
function playRumbleSound(durationMs = 2500) {
    initAudio();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const durationSec = durationMs / 1000;
    const bufferSize = audioCtx.sampleRate * durationSec;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill buffer with white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    
    // Lowpass filter for rumbling sound
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(80, audioCtx.currentTime); // very low rumble
    
    // Highpass filter to remove sub-bass muddy clicks
    const highpass = audioCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(20, audioCtx.currentTime);

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + durationSec);
    
    noiseSource.connect(filter);
    filter.connect(highpass);
    highpass.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    noiseSource.start();
    noiseSource.stop(audioCtx.currentTime + durationSec);
}

// TTS (Speech Synthesis) Captain's Voice
function speakAnnouncement(text) {
    if ('speechSynthesis' in window) {
        // Cancel current speech
        window.speechSynthesis.cancel();
        
        playCabinChime();
        
        // Wait for chime to start playing before speech begins
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95; // cruising pilot speed
            utterance.pitch = 0.9; // radio effect
            
            // Try to find a nice male / pilot-sounding English voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => 
                v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Natural') || v.name.includes('Google'))
            );
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        }, 800);
    } else {
        alert("Speech synthesis is not supported on this browser, but your Captain loves you anyway!");
    }
}

// Accessory Management
const accessoryButtons = document.querySelectorAll('.btn-control');
const accessories = document.querySelectorAll('.accessory');

accessoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const accessoryId = btn.getAttribute('data-accessory');
        const targetAccessory = document.getElementById(accessoryId);
        
        if (targetAccessory) {
            btn.classList.toggle('active');
            targetAccessory.classList.toggle('active');
            
            // Play a little switch click sound
            playBeepSound(600, 0.05, 0.05);
            
            // Spawn mini confetti around the cabin window
            const rect = document.querySelector('.cabin-window').getBoundingClientRect();
            spawnConfetti(15, rect.left + rect.width / 2, rect.top + rect.height / 2);
        }
    });
});

// Play a simple synthesizer beep
function playBeepSound(freq, duration, volume = 0.1) {
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        // AudioContext error or not allowed
    }
}

// Zoom-o-meter Slider Control
const zoomSlider = document.getElementById('zoom-slider');
const zoomValue = document.getElementById('zoom-value');
const zoomCaption = document.getElementById('zoom-caption');
const photo = document.querySelector('.birthday-photo');

const zoomCaptions = {
    1: "Cruising Altitude: Perfect Normal Selfie",
    2: "Turbulence Alert: Zooming into the genius mind",
    3: "Warning: Approaching Cabin Pressure limits",
    4: "Nasal Event Horizon: Gravitational pull of birthday cake detected",
    5: "HYPERSPACE: Maximum birthday energy achieved!"
};

zoomSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    zoomValue.textContent = `${value * 100}%`;
    zoomCaption.textContent = zoomCaptions[value] || "";
    
    // Apply transform scale on photo
    photo.style.transform = `scale(${1 + (value - 1) * 0.45})`;
    
    // Play pitch shifting sound
    playBeepSound(200 + (value * 80), 0.1, 0.05);
});

// Window click Confetti
document.querySelector('.cabin-window').addEventListener('click', (e) => {
    spawnConfetti(40, e.clientX, e.clientY);
    playBeepSound(880, 0.15, 0.1);
});

// Boarding Pass Builder real-time update
const inputName = document.getElementById('input-name');
const inputAge = document.getElementById('input-age');
const inputMsg = document.getElementById('input-msg');

const passName = document.getElementById('pass-name');
const passNameStub = document.getElementById('pass-name-stub');
const passFlight = document.getElementById('pass-flight');
const passFlightStub = document.getElementById('pass-flight-stub');
const passSeat = document.getElementById('pass-seat');
const passSeatStub = document.getElementById('pass-seat-stub');
const passMsg = document.getElementById('pass-msg');

function updateBoardingPass() {
    const name = inputName.value.trim() || "THE BIRTHDAY LEGEND";
    const age = inputAge.value.trim() || "99";
    const msg = inputMsg.value.trim() || "WISHING YOU A FLIGHT-TASTIC DAY!";
    
    passName.textContent = name.toUpperCase();
    passNameStub.textContent = name.length > 15 ? name.substring(0, 15).toUpperCase() + '...' : name.toUpperCase();
    
    passFlight.textContent = `HBD-${age}`;
    passFlightStub.textContent = `HBD-${age}`;
    
    // Fun Seat based on name length
    const seatChar = ['A', 'B', 'C', 'F'][name.length % 4];
    const seatNum = (name.length * 3) % 25 + 1;
    const seat = `${seatNum}${seatChar}`;
    passSeat.textContent = seat;
    passSeatStub.textContent = seat;
    
    passMsg.textContent = msg.toUpperCase();
}

inputName.addEventListener('input', updateBoardingPass);
inputAge.addEventListener('input', updateBoardingPass);
inputMsg.addEventListener('input', updateBoardingPass);

// Initial update
updateBoardingPass();

// TTS Button Events
document.getElementById('btn-takeoff').addEventListener('click', () => {
    const name = inputName.value.trim() || "Birthday Captain";
    speakAnnouncement(`Good evening passengers, this is your Captain speaking. We are cleared for immediate takeoff on Flight H B D. Destination is full party mode. Please make sure your seatbelt is secure, as we expect severe cake turbulence. Happy birthday to ${name}!`);
});

document.getElementById('btn-attendant').addEventListener('click', () => {
    const name = inputName.value.trim() || "Boss";
    speakAnnouncement(`Cabin crew, please prepare for immediate cake distribution. Bring out the candles and sparklers, and let us sing for ${name}!`);
});

document.getElementById('btn-vibes').addEventListener('click', () => {
    speakAnnouncement(`Attention passengers, we are currently entering a zone of extreme birthday vibes. Fasten seatbelt sign is turned on. Let the celebration begin!`);
});

// Turbulence Trigger
let turbulenceTimer;
const btnTurbulence = document.getElementById('btn-turbulence');

btnTurbulence.addEventListener('click', () => {
    if (document.body.classList.contains('turbulence-active')) return;
    
    document.body.classList.add('turbulence-active');
    btnTurbulence.textContent = "🌪️ CABIN SHAKING! HOLD ONTO CAKE!";
    
    // Play alarm beep and rumble
    playBeepSound(400, 0.5, 0.2);
    playRumbleSound(4000);
    
    // Shake window scale slightly
    const cabinWindow = document.querySelector('.cabin-window');
    cabinWindow.style.transform = 'scale(0.95)';
    
    // Spawn chaos confetti from corners
    let interval = setInterval(() => {
        spawnConfetti(20, Math.random() * window.innerWidth, 0);
    }, 300);

    setTimeout(() => {
        clearInterval(interval);
        document.body.classList.remove('turbulence-active');
        btnTurbulence.textContent = "🚨 TRIGGER CABIN TURBULENCE";
        cabinWindow.style.transform = 'scale(1)';
        speakAnnouncement("Turbulence has cleared. You may now unfasten your seatbelts and resume eating cake. Thank you for your cooperation.");
    }, 4000);
});

// Load Speech Voices to populate correctly (Chrome issue workaround)
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

// Initial landing confetti!
setTimeout(() => {
    const rect = document.querySelector('.cabin-window').getBoundingClientRect();
    spawnConfetti(70, rect.left + rect.width / 2, rect.top + rect.height / 2);
    
    // A nice start-up chime
    playBeepSound(523.25, 0.15, 0.05); // C5
    setTimeout(() => {
        playBeepSound(659.25, 0.3, 0.05); // E5
    }, 150);
}, 1000);
