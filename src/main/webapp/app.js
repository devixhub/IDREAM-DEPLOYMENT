(() => {
  const canvas = document.getElementById('universe');
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, stars = [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(180, Math.floor(width * height / 6500)) }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      r: Math.random() * 1.25 + .2, a: Math.random() * .65 + .15,
      speed: Math.random() * .22 + .035, phase: Math.random() * Math.PI * 2
    }));
  }
  function draw(time = 0) {
    ctx.clearRect(0, 0, width, height);
    for (const s of stars) {
      const twinkle = reducedMotion ? 1 : .65 + Math.sin(time * .001 * s.speed * 9 + s.phase) * .35;
      ctx.globalAlpha = s.a * twinkle;
      ctx.fillStyle = '#dcd5ff';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      if (!reducedMotion) { s.x -= s.speed * .12; if (s.x < 0) s.x = width; }
    }
    ctx.globalAlpha = 1;
    if (!reducedMotion) requestAnimationFrame(draw);
  }
  window.addEventListener('resize', () => { resize(); draw(); });
  resize(); draw();

  const clock = document.getElementById('clock');
  function updateClock() {
    clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
  }
  updateClock(); setInterval(updateClock, 1000);

  // A short synthesized sci-fi crackle; no external audio file is needed.
  let audioContext;
  function crackle() {
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      const now = audioContext.currentTime;
      const master = audioContext.createGain();
      master.gain.setValueAtTime(.0001, now);
      master.gain.exponentialRampToValueAtTime(.18, now + .012);
      master.gain.exponentialRampToValueAtTime(.0001, now + .24);
      master.connect(audioContext.destination);

      const buffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * .22), audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const envelope = Math.pow(1 - i / data.length, 2);
        data[i] = (Math.random() * 2 - 1) * envelope;
      }
      const noise = audioContext.createBufferSource();
      noise.buffer = buffer;
      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.setValueAtTime(1600, now); filter.Q.value = .8;
      noise.connect(filter); filter.connect(master); noise.start(now); noise.stop(now + .22);

      const tone = audioContext.createOscillator();
      const toneGain = audioContext.createGain();
      tone.type = 'sawtooth'; tone.frequency.setValueAtTime(170, now);
      tone.frequency.exponentialRampToValueAtTime(42, now + .19);
      toneGain.gain.setValueAtTime(.13, now); toneGain.gain.exponentialRampToValueAtTime(.0001, now + .2);
      tone.connect(toneGain); toneGain.connect(master); tone.start(now); tone.stop(now + .21);
    } catch (_) { /* Sound is decorative; the UI still works if audio is unavailable. */ }
  }

  const modal = document.getElementById('loginModal');
  const flash = document.getElementById('flash');
  const username = document.getElementById('username');
  function openModal() {
    crackle();
    flash.classList.remove('burst'); void flash.offsetWidth; flash.classList.add('burst');
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => username.focus(), 180);
  }
  function closeModal() {
    modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
    document.getElementById('enterButton').focus();
  }
  document.getElementById('enterButton').addEventListener('click', openModal);
  document.getElementById('closeModal').addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  document.getElementById('loginForm').addEventListener('submit', event => {
    event.preventDefault(); crackle();
    document.getElementById('formMessage').textContent = 'DEMO SEQUENCE COMPLETE — connect a real authentication service to enable login.';
  });
})();
