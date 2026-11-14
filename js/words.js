/** English word concepts, tagged for themes. */
const CONCEPTS = [
  { id: "apple", word: "apple", tags: ["everyday", "food", "classic"] },
  { id: "cat", word: "cat", tags: ["everyday", "animals", "classic"] },
  { id: "dog", word: "dog", tags: ["everyday", "animals", "classic"] },
  { id: "house", word: "house", tags: ["everyday", "classic"] },
  { id: "car", word: "car", tags: ["everyday", "classic", "city"] },
  { id: "book", word: "book", tags: ["everyday", "classic"] },
  { id: "phone", word: "phone", tags: ["everyday", "tech", "classic"] },
  { id: "chair", word: "chair", tags: ["everyday", "classic"] },
  { id: "clock", word: "clock", tags: ["everyday", "classic"] },
  { id: "key", word: "key", tags: ["everyday", "classic"] },
  { id: "umbrella", word: "umbrella", tags: ["everyday", "classic", "city"] },
  { id: "glasses", word: "glasses", tags: ["everyday", "classic"] },
  { id: "shoe", word: "shoe", tags: ["everyday", "classic"] },
  { id: "backpack", word: "backpack", tags: ["everyday", "classic"] },
  { id: "toothbrush", word: "toothbrush", tags: ["everyday"] },
  { id: "pillow", word: "pillow", tags: ["everyday"] },
  { id: "mirror", word: "mirror", tags: ["everyday"] },
  { id: "ladder", word: "ladder", tags: ["everyday"] },
  { id: "balloon", word: "balloon", tags: ["everyday", "party"] },
  { id: "gift", word: "gift", tags: ["everyday", "party"] },
  { id: "pizza", word: "pizza", tags: ["food", "kitchen-chaos", "candy-chaos", "party"] },
  { id: "sushi", word: "sushi", tags: ["food", "kitchen-chaos", "neon-tokyo"] },
  { id: "ice-cream", word: "ice cream", tags: ["food", "candy-chaos", "party"] },
  { id: "cake", word: "cake", tags: ["food", "candy-chaos", "party"] },
  { id: "tea", word: "tea", tags: ["food", "kitchen-chaos", "everyday"] },
  { id: "coffee", word: "coffee", tags: ["food", "kitchen-chaos", "city"] },
  { id: "banana", word: "banana", tags: ["food", "classic"] },
  { id: "watermelon", word: "watermelon", tags: ["food", "classic"] },
  { id: "hamburger", word: "hamburger", tags: ["food", "kitchen-chaos", "party"] },
  { id: "soup", word: "soup", tags: ["food", "kitchen-chaos"] },
  { id: "frying-pan", word: "frying pan", tags: ["food", "kitchen-chaos"] },
  { id: "chef", word: "chef", tags: ["food", "kitchen-chaos"] },
  { id: "candy", word: "candy", tags: ["food", "candy-chaos"] },
  { id: "lollipop", word: "lollipop", tags: ["food", "candy-chaos"] },
  { id: "popcorn", word: "popcorn", tags: ["food", "party", "candy-chaos"] },
  { id: "fox", word: "fox", tags: ["animals", "forest-folklore", "nature"] },
  { id: "bear", word: "bear", tags: ["animals", "forest-folklore", "nature"] },
  { id: "owl", word: "owl", tags: ["animals", "forest-folklore", "nature"] },
  { id: "frog", word: "frog", tags: ["animals", "nature", "classic"] },
  { id: "penguin", word: "penguin", tags: ["animals", "winter-fairy", "nature"] },
  { id: "octopus", word: "octopus", tags: ["animals", "ocean-deep"] },
  { id: "shark", word: "shark", tags: ["animals", "ocean-deep"] },
  { id: "dolphin", word: "dolphin", tags: ["animals", "ocean-deep"] },
  { id: "jellyfish", word: "jellyfish", tags: ["animals", "ocean-deep"] },
  { id: "butterfly", word: "butterfly", tags: ["animals", "nature", "forest-folklore"] },
  { id: "mushroom", word: "mushroom", tags: ["nature", "forest-folklore", "food"] },
  { id: "tree", word: "tree", tags: ["nature", "forest-folklore", "classic"] },
  { id: "flower", word: "flower", tags: ["nature", "classic"] },
  { id: "cactus", word: "cactus", tags: ["nature", "desert-mirage"] },
  { id: "camel", word: "camel", tags: ["animals", "desert-mirage"] },
  { id: "pyramid", word: "pyramid", tags: ["travel", "desert-mirage"] },
  { id: "volcano", word: "volcano", tags: ["nature", "classic"] },
  { id: "rainbow", word: "rainbow", tags: ["nature", "classic", "candy-chaos"] },
  { id: "snowman", word: "snowman", tags: ["winter-fairy", "nature"] },
  { id: "snowflake", word: "snowflake", tags: ["winter-fairy", "nature"] },
  { id: "rocket", word: "rocket", tags: ["space", "cosmic-doodle", "tech"] },
  { id: "alien", word: "alien", tags: ["space", "cosmic-doodle", "fantasy"] },
  { id: "planet", word: "planet", tags: ["space", "cosmic-doodle"] },
  { id: "astronaut", word: "astronaut", tags: ["space", "cosmic-doodle"] },
  { id: "ufo", word: "UFO", tags: ["space", "cosmic-doodle"] },
  { id: "star", word: "star", tags: ["space", "cosmic-doodle", "classic"] },
  { id: "moon", word: "moon", tags: ["space", "cosmic-doodle", "night"] },
  { id: "dragon", word: "dragon", tags: ["fantasy", "forest-folklore", "cosmic-doodle"] },
  { id: "wizard", word: "wizard", tags: ["fantasy", "forest-folklore", "winter-fairy"] },
  { id: "unicorn", word: "unicorn", tags: ["fantasy", "candy-chaos", "winter-fairy"] },
  { id: "ghost", word: "ghost", tags: ["fantasy", "classic"] },
  { id: "vampire", word: "vampire", tags: ["fantasy"] },
  { id: "mermaid", word: "mermaid", tags: ["fantasy", "ocean-deep"] },
  { id: "castle", word: "castle", tags: ["fantasy", "classic"] },
  { id: "sword", word: "sword", tags: ["fantasy"] },
  { id: "magic-wand", word: "magic wand", tags: ["fantasy", "winter-fairy"] },
  { id: "subway", word: "subway", tags: ["city", "neon-tokyo", "travel"] },
  { id: "skyscraper", word: "skyscraper", tags: ["city", "neon-tokyo"] },
  { id: "traffic-light", word: "traffic light", tags: ["city", "classic"] },
  { id: "taxi", word: "taxi", tags: ["city", "neon-tokyo"] },
  { id: "headphones", word: "headphones", tags: ["tech", "classic", "neon-tokyo"] },
  { id: "robot", word: "robot", tags: ["tech", "cosmic-doodle", "arcade-lava"] },
  { id: "computer", word: "computer", tags: ["tech", "classic"] },
  { id: "camera", word: "camera", tags: ["tech", "classic"] },
  { id: "game-controller", word: "game controller", tags: ["tech", "arcade-lava", "party"] },
  { id: "arcade", word: "arcade", tags: ["arcade-lava", "party", "city"] },
  { id: "pixel", word: "pixel", tags: ["arcade-lava", "tech"] },
  { id: "neon-sign", word: "neon sign", tags: ["neon-tokyo", "night", "city"] },
  { id: "airplane", word: "airplane", tags: ["travel", "classic"] },
  { id: "boat", word: "boat", tags: ["travel", "ocean-deep", "classic"] },
  { id: "lighthouse", word: "lighthouse", tags: ["travel", "ocean-deep"] },
  { id: "suitcase", word: "suitcase", tags: ["travel", "classic"] },
  { id: "map", word: "map", tags: ["travel", "classic", "desert-mirage"] },
  { id: "compass", word: "compass", tags: ["travel", "desert-mirage"] },
  { id: "beach", word: "beach", tags: ["travel", "ocean-deep"] },
  { id: "palm-tree", word: "palm tree", tags: ["travel", "desert-mirage", "ocean-deep"] },
  { id: "disco-ball", word: "disco ball", tags: ["party", "arcade-lava", "candy-chaos"] },
  { id: "microphone", word: "microphone", tags: ["party", "classic"] },
  { id: "guitar", word: "guitar", tags: ["party", "classic"] },
  { id: "skateboard", word: "skateboard", tags: ["classic", "city", "party"] },
  { id: "soccer-ball", word: "soccer ball", tags: ["classic", "party"] },
  { id: "crown", word: "crown", tags: ["fantasy", "classic", "party"] },
  { id: "mustache", word: "mustache", tags: ["classic", "party"] },
  { id: "toilet", word: "toilet", tags: ["classic", "party", "everyday"] },
  { id: "socks", word: "socks", tags: ["everyday", "classic", "winter-fairy"] },
  { id: "scarf", word: "scarf", tags: ["winter-fairy", "everyday"] },
  { id: "mittens", word: "mittens", tags: ["winter-fairy", "everyday"] },
  { id: "campfire", word: "campfire", tags: ["nature", "forest-folklore"] },
  { id: "tent", word: "tent", tags: ["nature", "travel", "forest-folklore"] },
  { id: "flashlight", word: "flashlight", tags: ["everyday", "night"] },
  { id: "spider", word: "spider", tags: ["animals", "classic"] },
  { id: "bee", word: "bee", tags: ["animals", "nature"] },
  { id: "snail", word: "snail", tags: ["animals", "nature"] },
  { id: "eagle", word: "eagle", tags: ["animals", "nature"] },
  { id: "whale", word: "whale", tags: ["animals", "ocean-deep"] },
  { id: "treasure", word: "treasure", tags: ["fantasy", "ocean-deep", "desert-mirage"] },
  { id: "pirate", word: "pirate", tags: ["fantasy", "ocean-deep", "party"] }
];

const AVATAR_COLORS = [
  "#2ec4a6", "#4ea8de", "#ff6b5a", "#ffc857", "#7bdff2",
  "#b388eb", "#90be6d", "#f9844a", "#43aa8b", "#577590",
  "#ff85a1", "#5ce1ff", "#e09f3e", "#7c5cff"
];

const AVATAR_HATS = ["none", "cap", "crown", "beanie", "party", "flower"];

function normalizeGuess(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, "")
    .replace(/\s+/g, " ");
}

function conceptAnswers(concept) {
  return [concept.word].filter(Boolean).map(normalizeGuess);
}

function displayWord(concept) {
  return concept?.word || "";
}

function drawerLabel(concept) {
  return displayWord(concept);
}

function parseCustomWords(text) {
  return String(text || "")
    .split(",")
    .map((w) => w.trim().replace(/\s+/g, " "))
    .filter((w) => w.length >= 1 && w.length <= 32)
    .map((w) => ({
      id: "custom:" + normalizeGuess(w),
      word: w,
      tags: ["custom"],
      custom: true
    }));
}

function conceptsForTheme(themeId) {
  const theme = typeof getTheme === "function" ? getTheme(themeId) : null;
  const tags = theme?.tags || [];
  if (!themeId || themeId === "classic") {
    return CONCEPTS.slice();
  }
  const matched = CONCEPTS.filter((c) =>
    c.tags.some((t) => t === themeId || tags.includes(t))
  );
  const extras = CONCEPTS.filter((c) => c.tags.includes("classic")).slice(0, 25);
  const map = new Map();
  [...matched, ...extras].forEach((c) => map.set(c.id, c));
  return Array.from(map.values());
}

function buildWordPool({ customWords, customOnly, themeId }) {
  const custom = parseCustomWords(customWords);
  if (customOnly) {
    if (custom.length < 10) {
      throw new Error("Need at least 10 custom words when using custom-only mode.");
    }
    return custom;
  }
  return [...conceptsForTheme(themeId), ...custom];
}

function pickConcepts(pool, count, used = new Set()) {
  const available = pool.filter((c) => !used.has(c.id));
  const source = available.length >= count ? available : pool.slice();
  const shuffled = source.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function wordBlank(word, revealed = []) {
  const parts = [];
  for (let i = 0; i < String(word).length; i++) {
    const ch = word[i];
    if (ch === " ") {
      // Clear gap between words (won't collapse with white-space: pre-wrap)
      parts.push("\u00A0\u00A0");
      continue;
    }
    if (ch === "-" || ch === "'") {
      parts.push(ch);
      continue;
    }
    parts.push(revealed.includes(i) ? ch.toUpperCase() : "_");
  }
  return parts.join(" ");
}

function isCloseGuess(guess, concept) {
  const g = normalizeGuess(guess);
  if (!g) return false;
  return conceptAnswers(concept).some((ans) => {
    if (g === ans) return false;
    if (Math.abs(g.length - ans.length) > 2) return false;
    const distance = levenshtein(g, ans);
    return distance > 0 && distance <= Math.max(1, Math.floor(ans.length / 4));
  });
}

function matchesConcept(guess, concept) {
  const g = normalizeGuess(guess);
  return conceptAnswers(concept).includes(g);
}

function levenshtein(a, b) {
  const m = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) m[i][0] = i;
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
    }
  }
  return m[a.length][b.length];
}

function hintIndices(word, hintCount, already = []) {
  const candidates = [];
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (ch === " " || ch === "-" || ch === "'" || already.includes(i)) continue;
    candidates.push(i);
  }
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, hintCount);
}

const DEFAULT_WORDS = CONCEPTS.map((c) => c.word);
