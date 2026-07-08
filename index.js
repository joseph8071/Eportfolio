/* ============================================================
   Joseph Alfartosy — Portfolio v3 interactions
   ============================================================ */

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ<>/_\\#@$%&*+=";

/* ---------- Toast ---------- */
const toast = (() => {
  const el = document.getElementById("toast");
  let timer;
  return (msg, ms = 2600) => {
    el.textContent = msg;
    el.classList.add("toast--show");
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove("toast--show"), ms);
  };
})();

/* ---------- Text scramble utility ---------- */
function scrambleText(el, finalText, duration = 600) {
  if (prefersReducedMotion) { el.textContent = finalText; return; }
  const start = performance.now();
  (function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const settled = Math.floor(finalText.length * t);
    el.textContent =
      finalText.slice(0, settled) +
      [...finalText.slice(settled)]
        .map((c) => (c === " " ? " " : CHARS[(Math.random() * CHARS.length) | 0]))
        .join("");
    if (t < 1) requestAnimationFrame(frame);
  })(start);
}

/* ---------- Preloader: percentage + scramble name + curtains ---------- */
(function initPreloader() {
  const preloader = document.getElementById("preloader");
  const pct = document.getElementById("preloaderPct");
  const fill = document.getElementById("preloaderFill");
  const name = document.getElementById("preloaderName");

  if (prefersReducedMotion) {
    preloader.classList.add("preloader--done");
    return;
  }

  scrambleText(name, "JOSEPH", 1100);

  let value = 0;
  const start = performance.now();
  const duration = 1500;
  (function step(now) {
    const t = Math.min((now - start) / duration, 1);
    value = Math.round(100 * (1 - Math.pow(1 - t, 3)));
    pct.textContent = value + "%";
    fill.style.width = value + "%";
    if (t < 1) requestAnimationFrame(step);
    else setTimeout(() => preloader.classList.add("preloader--done"), 200);
  })(start);
})();

/* ---------- Particle universe: depth layers + shooting stars ---------- */
(function initParticles() {
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [], stars = [];
  let width = 0, height = 0;
  const mouse = { x: null, y: null, radius: 170 };
  const PALETTE = ["150, 140, 255", "0, 210, 255", "255, 77, 141"];

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const count = Math.min(130, Math.floor((width * height) / 14000));
    particles = Array.from({ length: count }, () => {
      const depth = Math.random(); // 0 = far, 1 = near
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (0.15 + depth * 0.4),
        vy: (Math.random() - 0.5) * (0.15 + depth * 0.4),
        r: 0.4 + depth * 1.8,
        depth,
        color: PALETTE[(Math.random() * PALETTE.length) | 0],
      };
    });
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener("mouseout", () => { mouse.x = null; mouse.y = null; });

  function spawnStar() {
    stars.push({
      x: Math.random() * width * 0.8,
      y: Math.random() * height * 0.3,
      vx: 7 + Math.random() * 5,
      vy: 2.5 + Math.random() * 2,
      life: 1,
    });
  }

  function tick() {
    // self-heal if the viewport changed without firing a resize event
    if (width !== window.innerWidth || height !== window.innerHeight) resize();

    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // near particles are pushed by the cursor, far ones barely move
      if (mouse.x !== null) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < mouse.radius && dist > 0.01) {
          const force = ((mouse.radius - dist) / mouse.radius) * (0.4 + p.depth * 1.6);
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${0.25 + p.depth * 0.4})`;
      ctx.fill();
    }

    // constellation lines between near particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 130 * 130) {
          const alpha = 0.13 * (1 - d2 / (130 * 130)) * ((a.depth + b.depth) / 2 + 0.3);
          ctx.strokeStyle = `rgba(108, 92, 231, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // shooting stars
    if (Math.random() < 0.003 && stars.length < 2) spawnStar();
    stars = stars.filter((s) => s.life > 0);
    for (const s of stars) {
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.016;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 12, s.y - s.vy * 12);
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.85 * s.life})`);
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * 12, s.y - s.vy * 12);
      ctx.stroke();
    }

    requestAnimationFrame(tick);
  }

  resize();
  if (!prefersReducedMotion) tick();
})();

/* ---------- Custom cursor with contextual labels ---------- */
(function initCursor() {
  if (isTouch) return;
  const ring = document.getElementById("cursor");
  const label = document.getElementById("cursorLabel");
  const dot = document.getElementById("cursorDot");
  let rx = -100, ry = -100, tx = -100, ty = -100;

  window.addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    dot.style.left = tx + "px";
    dot.style.top = ty + "px";
  });

  (function follow() {
    rx += (tx - rx) * 0.16;
    ry += (ty - ry) * 0.16;
    ring.style.left = rx + "px";
    ring.style.top = ry + "px";
    requestAnimationFrame(follow);
  })();

  function bindCursor(root) {
    root.querySelectorAll("a, button, .skill, input, textarea, [data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        ring.classList.add("cursor--hover");
        if (el.dataset.cursor) {
          label.textContent = el.dataset.cursor;
          ring.classList.add("cursor--label");
        }
      });
      el.addEventListener("mouseleave", () => {
        ring.classList.remove("cursor--hover", "cursor--label");
      });
    });
  }
  bindCursor(document);
})();

/* ---------- Split letters with stagger ---------- */
(function initSplitLetters() {
  document.querySelectorAll("[data-splitletters]").forEach((el) => {
    const text = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-label", text);
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "split-letter";
      span.textContent = ch === " " ? " " : ch;
      span.style.setProperty("--d", 0.9 + i * 0.045 + "s");
      el.appendChild(span);
    });
  });
})();

/* ---------- Scramble on hover (nav links, logo) ---------- */
(function initScrambleHover() {
  if (prefersReducedMotion || isTouch) return;
  document.querySelectorAll("[data-scramble]").forEach((el) => {
    const target = el.querySelector(".scramble-target") || el;
    if (target.children.length) return; // skip elements with nested markup
    const original = target.textContent;
    el.addEventListener("mouseenter", () => scrambleText(target, original, 450));
  });
})();

/* ---------- Time-aware greeting ---------- */
(function initGreeting() {
  const h = new Date().getHours();
  const g = h < 5 ? "Up late? Hi, my name is"
    : h < 12 ? "Good morning — my name is"
    : h < 18 ? "Good afternoon — my name is"
    : "Good evening — my name is";
  document.getElementById("greeting").textContent = g;
})();

/* ---------- Typewriter ---------- */
(function initTypewriter() {
  const el = document.getElementById("typewriter");
  const phrases = [
    "the human mind.",
    "mental health research.",
    "how memory works.",
    "helping people.",
  ];
  if (prefersReducedMotion) { el.textContent = phrases[0]; return; }
  let phrase = 0, char = 0, deleting = false;

  (function type() {
    const current = phrases[phrase];
    char += deleting ? -1 : 1;
    el.textContent = current.slice(0, char);
    let delay = deleting ? 35 : 70;
    if (!deleting && char === current.length) { delay = 2000; deleting = true; }
    else if (deleting && char === 0) { deleting = false; phrase = (phrase + 1) % phrases.length; delay = 400; }
    setTimeout(type, delay);
  })();
})();

/* ---------- Scroll: progress, nav hide/show, active link, orbs, marquee skew ---------- */
(function initScroll() {
  const progress = document.getElementById("scrollProgress");
  const nav = document.getElementById("nav");
  const links = document.querySelectorAll(".nav__link");
  const sections = ["about", "research", "software", "contact"].map((id) => document.getElementById(id));
  const orbs = document.querySelectorAll(".orb");
  const marquee = document.getElementById("marquee");
  let lastY = 0, lastT = performance.now(), skew = 0;

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    const now = performance.now();
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    nav.classList.toggle("nav--scrolled", y > 40);
    // hide nav while scrolling down, reveal on scroll up
    nav.classList.toggle("nav--hidden", y > lastY && y > 320 && !document.body.classList.contains("menu-open"));

    // scroll-velocity skew on the marquee
    if (!prefersReducedMotion) {
      const velocity = (y - lastY) / Math.max(now - lastT, 1);
      skew = Math.max(-8, Math.min(8, velocity * 6));
      marquee.style.transform = `skewY(${skew * 0.25}deg)`;
      clearTimeout(marquee._reset);
      marquee._reset = setTimeout(() => { marquee.style.transform = "skewY(0deg)"; }, 140);

      orbs.forEach((orb) => {
        orb.style.transform = `translateY(${-y * parseFloat(orb.dataset.speed)}px)`;
      });
    }

    let active = null;
    for (const s of sections) {
      if (s.getBoundingClientRect().top < window.innerHeight * 0.4) active = s.id;
    }
    links.forEach((l) => l.classList.toggle("nav__link--active", l.dataset.section === active));

    lastY = y; lastT = now;
  }, { passive: true });
})();

/* ---------- Reveal on scroll + stat counters + terminal ---------- */
(function initReveal() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("reveal--visible"));
    document.querySelectorAll("[data-count]").forEach((el) => { el.textContent = el.dataset.count; });
    runTerminal();
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("reveal--visible");
      entry.target.querySelectorAll("[data-count]").forEach(animateCount);
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.15 });

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  // terminal types itself the first time it scrolls into view
  const termObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      runTerminal();
      termObserver.disconnect();
    }
  }, { threshold: 0.4 });
  termObserver.observe(document.getElementById("terminal"));

  function animateCount(el) {
    const target = +el.dataset.count;
    if (prefersReducedMotion) { el.textContent = target; return; }
    const duration = 1400;
    const start = performance.now();
    (function step(now) {
      const t = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    })(performance.now());
  }
})();

/* ---------- Self-typing terminal ---------- */
function runTerminal() {
  const code = document.getElementById("terminalCode");
  const lines = [
    { html: '<span class="t-green">$</span> whoami', type: true },
    { html: '<span class="t-blue">joseph_al_fartosy</span> — psych major, cs minor', type: false },
    { html: '<span class="t-green">$</span> cat focus.txt', type: true },
    { html: '<span class="t-yellow">mental health &amp; how the mind works ●</span>', type: false },
    { html: '<span class="t-green">$</span> ./keep_researching.sh', type: true },
  ];
  if (prefersReducedMotion) {
    code.innerHTML = lines.map((l) => l.html).join("\n") + "\n";
    return;
  }
  let li = 0;
  let done = "";
  (function nextLine() {
    if (li >= lines.length) return;
    const line = lines[li++];
    if (!line.type) {
      done += line.html + "\n";
      code.innerHTML = done;
      setTimeout(nextLine, 260);
      return;
    }
    // type command char by char (strip tags for typing, then swap in styled html)
    const tmp = document.createElement("div");
    tmp.innerHTML = line.html;
    const plain = tmp.textContent;
    let ci = 0;
    (function typeChar() {
      ci++;
      code.innerHTML = done + plain.slice(0, ci);
      if (ci < plain.length) setTimeout(typeChar, 34 + Math.random() * 40);
      else {
        done += line.html + "\n";
        code.innerHTML = done;
        setTimeout(nextLine, 420);
      }
    })();
  })();
}

/* ---------- 3D tilt + glow + glare + inner parallax ---------- */
(function initTilt() {
  if (prefersReducedMotion || isTouch) return;
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    const img = card.querySelector("[data-parallax]");
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      card.style.transform =
        `perspective(1100px) rotateY(${(px - 0.5) * 7}deg) rotateX(${(0.5 - py) * 7}deg)`;
      card.style.setProperty("--mx", px * 100 + "%");
      card.style.setProperty("--my", py * 100 + "%");
      card.style.setProperty("--glare-x", (1 - px) * 100 + "%");
      if (img) img.style.setProperty("--py", (0.5 - py) * 14 + "px");
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1100px) rotateY(0deg) rotateX(0deg)";
    });
  });
})();

/* ---------- Magnetic hover ---------- */
(function initMagnetic() {
  if (prefersReducedMotion || isTouch) return;
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = ""; });
  });
})();

/* ---------- Mobile menu ---------- */
(function initMobileMenu() {
  const burger = document.getElementById("burger");
  burger.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open);
  });
  document.querySelectorAll(".mobile-menu__link").forEach((link) => {
    link.addEventListener("click", () => {
      document.body.classList.remove("menu-open");
      burger.setAttribute("aria-expanded", "false");
    });
  });
})();

/* ---------- Command palette ---------- */
(function initPalette() {
  const palette = document.getElementById("palette");
  const input = document.getElementById("paletteInput");
  const list = document.getElementById("paletteList");
  const icon = (d) => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${d}</svg>`;

  const commands = [
    { label: "Go to About", hint: "01", icon: icon('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>'), run: () => location.hash = "#about" },
    { label: "Go to Research", hint: "02", icon: icon('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/>'), run: () => location.hash = "#research" },
    { label: "Go to Software", hint: "03", icon: icon('<path d="m8 8-5 4 5 4M16 8l5 4-5 4"/>'), run: () => location.hash = "#software" },
    { label: "Go to Contact", hint: "04", icon: icon('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6L22 7"/>'), run: () => location.hash = "#contact" },
    { label: "Back to top", hint: "↑", icon: icon('<path d="M12 19V5M6 11l6-6 6 6"/>'), run: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
    { label: "Open LinkedIn", hint: "↗", icon: icon('<rect x="3" y="3" width="18" height="18" rx="3"/>'), run: () => window.open("https://www.linkedin.com/in/josephalfartosy", "_blank") },
    { label: "Open GitHub", hint: "↗", icon: icon('<circle cx="12" cy="12" r="9"/>'), run: () => window.open("https://github.com/joseph8071", "_blank") },
    { label: "Download resume", hint: "pdf", icon: icon('<path d="M12 3v12M6 11l6 6 6-6M5 21h14"/>'), run: () => window.open("./assets/JosephAlfartosyResume.pdf", "_blank") },
    { label: "Copy email address", hint: "@", icon: icon('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'), run: copyEmail },
    { label: "Party mode 🎉", hint: "fun", icon: icon('<path d="M5 21 12 3l7 18-7-4-7 4z"/>'), run: () => startParty() },
  ];

  let filtered = commands;
  let active = 0;

  function render() {
    if (!filtered.length) {
      list.innerHTML = '<li class="palette__empty">no commands found :(</li>';
      return;
    }
    list.innerHTML = filtered
      .map((c, i) => `<li class="palette__item ${i === active ? "palette__item--active" : ""}" data-i="${i}">${c.icon}<span>${c.label}</span><span class="palette__item-hint">${c.hint}</span></li>`)
      .join("");
    list.querySelectorAll(".palette__item").forEach((li) => {
      li.addEventListener("mouseenter", () => { active = +li.dataset.i; render(); });
      li.addEventListener("click", () => select(+li.dataset.i));
    });
  }

  function select(i) {
    const cmd = filtered[i];
    close();
    if (cmd) cmd.run();
  }

  function open() {
    palette.classList.add("palette--open");
    input.value = "";
    filtered = commands;
    active = 0;
    render();
    setTimeout(() => input.focus(), 30);
  }
  function close() { palette.classList.remove("palette--open"); }

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    filtered = commands.filter((c) => c.label.toLowerCase().includes(q));
    active = 0;
    render();
  });

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      palette.classList.contains("palette--open") ? close() : open();
    } else if (palette.classList.contains("palette--open")) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); render(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); render(); }
      else if (e.key === "Enter") { e.preventDefault(); select(active); }
    }
  });

  document.getElementById("paletteHint").addEventListener("click", open);
  document.getElementById("paletteBackdrop").addEventListener("click", close);
})();

/* ---------- Copy email ---------- */
function copyEmail() {
  const email = "alfartos@ualberta.ca";
  const done = () => {
    const btn = document.getElementById("copyEmail");
    btn.classList.add("contact__email--copied");
    setTimeout(() => btn.classList.remove("contact__email--copied"), 2200);
    toast("email copied to clipboard ✓");
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(email).then(done).catch(() => { location.href = "mailto:" + email; });
  } else {
    location.href = "mailto:" + email;
  }
}
document.getElementById("copyEmail").addEventListener("click", copyEmail);

/* ---------- Party mode: konami code + confetti ---------- */
const startParty = (() => {
  const canvas = document.getElementById("fx-canvas");
  const ctx = canvas.getContext("2d");
  const COLORS = ["#6c5ce7", "#00d2ff", "#ff4d8d", "#febc2e", "#28c840", "#ffffff"];
  let pieces = [];
  let running = false;
  let stopAt = 0;

  function burst() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    for (let i = 0; i < 180; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 3,
        vy: 2.5 + Math.random() * 4,
        size: 5 + Math.random() * 7,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.25,
        color: COLORS[(Math.random() * COLORS.length) | 0],
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces = pieces.filter((p) => p.y < canvas.height + 30);
    for (const p of pieces) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (pieces.length || performance.now() < stopAt) requestAnimationFrame(tick);
    else {
      running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      document.body.classList.remove("party");
    }
  }

  return function startParty() {
    if (prefersReducedMotion) { toast("🎉 party mode (motion-reduced edition)"); return; }
    document.body.classList.add("party");
    toast("🎉 PARTY MODE ACTIVATED");
    burst();
    stopAt = performance.now() + 2500;
    if (!running) { running = true; tick(); }
    setTimeout(() => document.body.classList.remove("party"), 6000);
  };
})();

(function initKonami() {
  const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pos = 0;
  window.addEventListener("keydown", (e) => {
    pos = e.key === seq[pos] ? pos + 1 : (e.key === seq[0] ? 1 : 0);
    if (pos === seq.length) { pos = 0; startParty(); }
  });
  document.getElementById("secretBtn").addEventListener("click", startParty);
})();

/* ---------- Local time (America/Edmonton) ---------- */
(function initClock() {
  const el = document.getElementById("localTime");
  function update() {
    try {
      el.textContent = new Date().toLocaleTimeString("en-CA", {
        timeZone: "America/Edmonton", hour: "2-digit", minute: "2-digit",
      }) + " MT";
    } catch { el.textContent = new Date().toLocaleTimeString(); }
  }
  update();
  setInterval(update, 30000);
})();

/* ---------- Contact form (EmailJS) ---------- */
document.getElementById("contact__form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const submit = form.querySelector(".contact__submit");
  const label = form.querySelector(".contact__submit-label");
  const status = document.getElementById("contactStatus");

  submit.disabled = true;
  label.textContent = "Sending…";
  status.textContent = "";
  status.className = "contact__status";

  emailjs
    .sendForm("service_v0v27al", "template_3ewu0ty", form, "vWQOkn-EPhDyMs0tS")
    .then(() => {
      label.textContent = "Sent!";
      status.textContent = "> message received — talk soon.";
      status.classList.add("contact__status--ok");
      form.reset();
      startParty();
      setTimeout(() => { label.textContent = "Send it my way"; submit.disabled = false; }, 3500);
    })
    .catch(() => {
      label.textContent = "Send it my way";
      submit.disabled = false;
      status.textContent = "> service unavailable — email me at alfartos@ualberta.ca";
      status.classList.add("contact__status--err");
    });
});

/* ---------- Footer year + console easter egg ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

console.log(
  "%c👋 Hey, curious one!%c\n\nPoking around the console? That's very researcher of you.\nTry Ctrl+K — or the Konami code (↑↑↓↓←→←→BA).\n\n→ linkedin.com/in/josephalfartosy",
  "font-size:16px; font-weight:bold; background:linear-gradient(90deg,#00d2ff,#6c5ce7,#ff4d8d); -webkit-background-clip:text; color:transparent;",
  "font-size:12px; color:#9a9ab0;"
);
