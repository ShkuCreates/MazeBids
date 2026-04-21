  // MazeBids Frontend JS - Real Discord Integration Ready

let audioCtx = null;
const sounds = {
    click: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAo'),
    coin: new Audio('data:audio/wav;base64,UklGRiQEAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAo'),
    success: new Audio('data:audio/wav;base64,UklGROoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAo')
};

document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    initParticles();
    initStatsCounters();
    initSmoothScroll();
    initSocialSounds();
    checkLoginStatus();
    handleQueryParams();
});

function checkLoginStatus() {
    fetch('/api/user', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                updateLoginButton(true);
                loadUserCoins(); // Load coins when logged in
            } else {
                updateLoginButton(false);
                document.getElementById('coins-amount') ? (document.getElementById('coins-amount').textContent = '0') : null;
            }
        }).catch(() => {
            updateLoginButton(false);
        });
}


    try {
        const res = await fetch('/api/user-data', { credentials: 'include' });
        const userData = await res.json();
        const coinsEl = document.getElementById('coins-amount');
        if (coinsEl) {
            coinsEl.textContent = userData.coins || 0;
        }
    } catch (e) {
        console.log('No user data yet');
    }
}
async function subscribeNotify() {
    try {
        playSound('success');
        await fetch('/api/subscribe-notify', {
            method: 'POST',
            credentials: 'include'
        });
        // Update UI
        const btn = document.querySelector('.notify-btn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check"></i> Subscribed!';
            btn.disabled = true;
        }
    } catch (e) {
        alert('Login required for notifications');
    }
}
function handleQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'success') {
        // Silent login success - no alert
        localStorage.setItem('loginShown', Date.now().toString());
        checkLoginStatus();
        playSound('success');
    }
}

function updateLoginButton(loggedIn) {
    const btn = document.querySelector('.discord-login-header');
    if (loggedIn) {
        btn.innerHTML = '<i class="fas fa-check"></i> Dashboard';
        btn.style.background = '#10B981';
        btn.onclick = () => window.location.href = '/dashboard';
    } else {
        btn.innerHTML = '<i class="fab fa-discord"></i> Login';
        btn.onclick = discordLogin;
    }
}

function discordLogin() {
    playSound('click');
    window.location.href = '/auth/discord?return_to=/';
}

function checkAuth(page) {
    playSound('click');
    window.location.href = `/auth/discord?return_to=/`;
}

function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    document.addEventListener('click', () => audioCtx?.resume(), { once: true });
}

function playSound(type) {
    const sound = sounds[type];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => synthBeep(type));
    } else {
        synthBeep(type);
    }
}

function synthBeep(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    let freq = 800;
    switch(type) {
        case 'coin': freq = 1000; break;
        case 'success': freq = 1200; break;
    }
    osc.frequency.value = freq;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            document.querySelector(a.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
            playSound('click');
        });
    });
}

function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const particles = Array(80).fill().map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.4 + 0.2,
        color: `hsl(260, 70%, ${50 + Math.random() * 30}%)`
    }));
    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        requestAnimationFrame(animate);
    };
    animate();
    addEventListener('resize', () => {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
    });
}

function initStatsCounters() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target.querySelector('.stat-number'));
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.6 });
    document.querySelectorAll('.stat-item').forEach(item => observer.observe(item));
}

function animateCounter(el) {
    const target = +el.dataset.target;
    let current = 0;
    const inc = target / 120;
    const timer = setInterval(() => {
        current += inc;
        if (current >= target) {
            el.textContent = target.toLocaleString() + (target > 999 ? 'K' : '+');
            clearInterval(timer);
            return;
        }
        el.textContent = Math.floor(current).toLocaleString();
        playSound('coin');
    }, 16);
}

function initSocialSounds() {
    document.querySelectorAll('.social-btn').forEach(btn => btn.addEventListener('mouseenter', () => playSound('coin')));
}

