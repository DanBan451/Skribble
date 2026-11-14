const THEMES = [
  {
    id: "classic",
    name: "Classic Sketch",
    emoji: "✏️",
    blurb: "Clean paper & mint ink",
    tags: ["classic", "everyday"],
    style: {
      "--ink": "#1a2a33",
      "--ink-soft": "#2f4652",
      "--mint": "#2ec4a6",
      "--mint-deep": "#1a9f86",
      "--sun": "#ffc857",
      "--coral": "#ff6b5a",
      "--sky": "#4ea8de",
      "--bg": "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(78,168,222,.28), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 10%, rgba(255,200,87,.35), transparent 50%), linear-gradient(165deg, #dceee6, #f7faf8 45%, #e8f2ef)"
    }
  },
  {
    id: "neon-tokyo",
    name: "Neon Tokyo",
    emoji: "🌃",
    blurb: "Rain, kanji glow, midnight pink",
    tags: ["city", "night", "tech"],
    style: {
      "--ink": "#ffeefe",
      "--ink-soft": "#f0d7ff",
      "--mint": "#ff4ecd",
      "--mint-deep": "#c2189a",
      "--sun": "#ffe566",
      "--coral": "#ff6b9d",
      "--sky": "#5ce1ff",
      "--bg": "radial-gradient(circle at 20% 20%, rgba(255,78,205,.35), transparent 40%), radial-gradient(circle at 80% 0%, rgba(92,225,255,.3), transparent 45%), linear-gradient(160deg, #12061f, #241038 50%, #0b1c2c)"
    }
  },
  {
    id: "ocean-deep",
    name: "Ocean Deep",
    emoji: "🐙",
    blurb: "Kelp forests & bioluminescence",
    tags: ["ocean", "animals", "nature"],
    style: {
      "--ink": "#f2fffc",
      "--ink-soft": "#c9fff3",
      "--mint": "#2de2c5",
      "--mint-deep": "#14919b",
      "--sun": "#ffd166",
      "--coral": "#ef476f",
      "--sky": "#48cae4",
      "--bg": "radial-gradient(ellipse at 30% 10%, rgba(45,226,197,.25), transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(72,202,228,.3), transparent 45%), linear-gradient(180deg, #023047, #0077b6 55%, #00b4d8)"
    }
  },
  {
    id: "candy-chaos",
    name: "Candy Chaos",
    emoji: "🍬",
    blurb: "Sugar rush doodle party",
    tags: ["food", "party", "everyday"],
    style: {
      "--ink": "#3b1f4a",
      "--ink-soft": "#6b3d7a",
      "--mint": "#ff5d8f",
      "--mint-deep": "#e6397a",
      "--sun": "#ffd60a",
      "--coral": "#ff85a1",
      "--sky": "#7b2cbf",
      "--bg": "radial-gradient(circle at 10% 80%, rgba(255,214,10,.45), transparent 40%), radial-gradient(circle at 90% 10%, rgba(255,93,143,.4), transparent 40%), linear-gradient(135deg, #fff0f5, #ffe5ec 40%, #e0aaff)"
    }
  },
  {
    id: "forest-folklore",
    name: "Forest Folklore",
    emoji: "🦊",
    blurb: "Mossy myths & mushroom magic",
    tags: ["nature", "fantasy", "animals"],
    style: {
      "--ink": "#1e2f23",
      "--ink-soft": "#3d5a45",
      "--mint": "#74a57f",
      "--mint-deep": "#3d6b4f",
      "--sun": "#e9c46a",
      "--coral": "#e76f51",
      "--sky": "#8ab17d",
      "--bg": "radial-gradient(ellipse at 70% 0%, rgba(233,196,106,.35), transparent 45%), radial-gradient(ellipse at 0% 100%, rgba(116,165,127,.4), transparent 50%), linear-gradient(165deg, #d8f3dc, #f1faee 40%, #95d5b2)"
    }
  },
  {
    id: "cosmic-doodle",
    name: "Cosmic Doodle",
    emoji: "🚀",
    blurb: "Planets, rockets, weird aliens",
    tags: ["space", "fantasy", "tech"],
    style: {
      "--ink": "#f4f6ff",
      "--ink-soft": "#d7ddff",
      "--mint": "#7c5cff",
      "--mint-deep": "#5a3fd6",
      "--sun": "#ffd166",
      "--coral": "#ff6b6b",
      "--sky": "#4cc9f0",
      "--bg": "radial-gradient(circle at 15% 20%, rgba(124,92,255,.45), transparent 35%), radial-gradient(circle at 85% 15%, rgba(76,201,240,.3), transparent 40%), radial-gradient(circle at 50% 100%, rgba(255,107,107,.2), transparent 45%), linear-gradient(180deg, #0b1026, #1a1a40 60%, #16213e)"
    }
  },
  {
    id: "desert-mirage",
    name: "Desert Mirage",
    emoji: "🌵",
    blurb: "Sunbaked dunes & oasis vibes",
    tags: ["nature", "travel", "everyday"],
    style: {
      "--ink": "#3d2914",
      "--ink-soft": "#6b4f2f",
      "--mint": "#e09f3e",
      "--mint-deep": "#c77d1c",
      "--sun": "#fff3b0",
      "--coral": "#d62828",
      "--sky": "#4ea8de",
      "--bg": "radial-gradient(ellipse at 50% 0%, rgba(255,243,176,.55), transparent 50%), linear-gradient(180deg, #f4a261, #e9c46a 40%, #fefae0)"
    }
  },
  {
    id: "winter-fairy",
    name: "Winter Fairy",
    emoji: "❄️",
    blurb: "Frost glass & quiet magic",
    tags: ["fantasy", "nature", "winter"],
    style: {
      "--ink": "#1b3a4b",
      "--ink-soft": "#3d5a6c",
      "--mint": "#90e0ef",
      "--mint-deep": "#48cae4",
      "--sun": "#caf0f8",
      "--coral": "#ff8fab",
      "--sky": "#0077b6",
      "--bg": "radial-gradient(circle at 20% 10%, rgba(202,240,248,.8), transparent 40%), radial-gradient(circle at 90% 30%, rgba(144,224,239,.5), transparent 40%), linear-gradient(160deg, #edf6f9, #caf0f8 50%, #ade8f4)"
    }
  },
  {
    id: "arcade-lava",
    name: "Arcade Lava",
    emoji: "🕹️",
    blurb: "Pixel heat & coin-op chaos",
    tags: ["party", "tech", "everyday"],
    style: {
      "--ink": "#fff7ed",
      "--ink-soft": "#ffe2b8",
      "--mint": "#ff5400",
      "--mint-deep": "#ff006e",
      "--sun": "#ffbe0b",
      "--coral": "#fb5607",
      "--sky": "#3a86ff",
      "--bg": "radial-gradient(circle at 10% 0%, rgba(255,0,110,.4), transparent 40%), radial-gradient(circle at 100% 80%, rgba(58,134,255,.35), transparent 40%), linear-gradient(145deg, #1a0008, #3d0c11 40%, #1b1b2f)"
    }
  },
  {
    id: "kitchen-chaos",
    name: "Kitchen Chaos",
    emoji: "🍳",
    blurb: "Spatulas flying, soup erupting",
    tags: ["food", "everyday", "party"],
    style: {
      "--ink": "#2b2118",
      "--ink-soft": "#5c4634",
      "--mint": "#2a9d8f",
      "--mint-deep": "#1f7a6f",
      "--sun": "#e9c46a",
      "--coral": "#e76f51",
      "--sky": "#264653",
      "--bg": "radial-gradient(circle at 80% 10%, rgba(233,196,106,.5), transparent 40%), radial-gradient(circle at 10% 90%, rgba(231,111,81,.25), transparent 45%), linear-gradient(160deg, #fff1e6, #f8edeb 45%, #fae1dd)"
    }
  }
];

const THEME_NAME_BITS = {
  adjectives: ["Mysterious", "Spicy", "Glitchy", "Sleepy", "Electric", "Haunted", "Butter", "Velvet", "Chaotic", "Tiny", "Gigantic", "Secret"],
  nouns: ["Noodles", "Comets", "Frogs", "Subway", "Pillowfort", "Volcano", "Disco", "Library", "Spaceship", "Wizardry", "Traffic", "Cactus"]
};

function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

const THEME_MOTIFS = {
  classic: ["✏️", "⭐", "🎨", "🖌️"],
  "neon-tokyo": ["🌃", "💜", "✨", "🎌", "💧"],
  "ocean-deep": ["🐙", "🐠", "🫧", "🌊", "🐚"],
  "candy-chaos": ["🍬", "🍭", "🍩", "✨", "🍓"],
  "forest-folklore": ["🦊", "🍄", "🍃", "🦉", "✨"],
  "cosmic-doodle": ["🚀", "🪐", "⭐", "👽", "☄️"],
  "desert-mirage": ["🌵", "☀️", "🦂", "🏜️", "✨"],
  "winter-fairy": ["❄️", "🎄", "⛄", "✨", "🧊"],
  "arcade-lava": ["🕹️", "🔥", "👾", "💥", "⭐"],
  "kitchen-chaos": ["🍳", "🧂", "🧀", "🔥", "🥄"]
};

function applyTheme(id) {
  const theme = getTheme(id);
  const root = document.documentElement;
  Object.entries(theme.style).forEach(([key, value]) => {
    if (key === "--bg") {
      document.body.style.background = value;
    } else {
      root.style.setProperty(key, value);
    }
  });
  document.body.dataset.theme = theme.id;
  const dark = ["neon-tokyo", "ocean-deep", "cosmic-doodle", "arcade-lava"].includes(theme.id);
  document.body.classList.toggle("theme-dark", dark);
  const onHome = document.getElementById("screen-home")?.classList.contains("active");
  spawnThemeFx(theme.id, { active: !onHome });
  return theme;
}

function clearThemeFx() {
  const layer = document.getElementById("theme-fx");
  if (layer) layer.innerHTML = "";
}

function spawnThemeFx(themeId, { active = true } = {}) {
  const layer = document.getElementById("theme-fx");
  if (!layer) return;
  layer.innerHTML = "";
  if (!active) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  const motifs = THEME_MOTIFS[themeId] || THEME_MOTIFS.classic;
  const count = 10;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "fx-bit";
    el.textContent = motifs[i % motifs.length];
    el.style.left = `${6 + (i * 11) % 88}%`;
    el.style.top = `${72 + (i % 4) * 6}%`;
    el.style.animationDuration = `${22 + (i % 5) * 4}s`;
    el.style.animationDelay = `${i * 1.4}s`;
    el.style.fontSize = `${1.35 + (i % 3) * 0.3}rem`;
    el.style.setProperty("--drift", `${(i % 2 === 0 ? 1 : -1) * (14 + (i % 4) * 7)}px`);
    layer.appendChild(el);
  }
  // Soft atmospheric wash for immersion
  layer.style.setProperty("--wash", "1");
}

function randomThemeId(excludeId) {
  const pool = THEMES.filter((t) => t.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function inventThemeTitle() {
  const a = THEME_NAME_BITS.adjectives[Math.floor(Math.random() * THEME_NAME_BITS.adjectives.length)];
  const n = THEME_NAME_BITS.nouns[Math.floor(Math.random() * THEME_NAME_BITS.nouns.length)];
  return `${a} ${n}`;
}
