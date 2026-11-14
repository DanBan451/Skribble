/** English word concepts, tagged for themes. */
const CONCEPTS = [
  // everyday
  { id: "apple", en: "apple", ru: "яблоко", uk: "яблуко", tags: ["everyday", "food", "classic"] },
  { id: "cat", en: "cat", ru: "кот", uk: "кіт", tags: ["everyday", "animals", "classic"] },
  { id: "dog", en: "dog", ru: "собака", uk: "собака", tags: ["everyday", "animals", "classic"] },
  { id: "house", en: "house", ru: "дом", uk: "будинок", tags: ["everyday", "classic"] },
  { id: "car", en: "car", ru: "машина", uk: "машина", tags: ["everyday", "classic", "city"] },
  { id: "book", en: "book", ru: "книга", uk: "книга", tags: ["everyday", "classic"] },
  { id: "phone", en: "phone", ru: "телефон", uk: "телефон", tags: ["everyday", "tech", "classic"] },
  { id: "chair", en: "chair", ru: "стул", uk: "стілець", tags: ["everyday", "classic"] },
  { id: "clock", en: "clock", ru: "часы", uk: "годинник", tags: ["everyday", "classic"] },
  { id: "key", en: "key", ru: "ключ", uk: "ключ", tags: ["everyday", "classic"] },
  { id: "umbrella", en: "umbrella", ru: "зонт", uk: "парасолька", tags: ["everyday", "classic", "city"] },
  { id: "glasses", en: "glasses", ru: "очки", uk: "окуляри", tags: ["everyday", "classic"] },
  { id: "shoe", en: "shoe", ru: "ботинок", uk: "черевик", tags: ["everyday", "classic"] },
  { id: "backpack", en: "backpack", ru: "рюкзак", uk: "рюкзак", tags: ["everyday", "classic"] },
  { id: "toothbrush", en: "toothbrush", ru: "зубная щётка", uk: "зубна щітка", tags: ["everyday"] },
  { id: "pillow", en: "pillow", ru: "подушка", uk: "подушка", tags: ["everyday"] },
  { id: "mirror", en: "mirror", ru: "зеркало", uk: "дзеркало", tags: ["everyday"] },
  { id: "ladder", en: "ladder", ru: "лестница", uk: "драбина", tags: ["everyday"] },
  { id: "balloon", en: "balloon", ru: "шарик", uk: "кулька", tags: ["everyday", "party"] },
  { id: "gift", en: "gift", ru: "подарок", uk: "подарунок", tags: ["everyday", "party"] },

  // food / kitchen
  { id: "pizza", en: "pizza", ru: "пицца", uk: "піца", tags: ["food", "kitchen-chaos", "candy-chaos", "party"] },
  { id: "sushi", en: "sushi", ru: "суши", uk: "суші", tags: ["food", "kitchen-chaos", "neon-tokyo"] },
  { id: "borscht", en: "borscht", ru: "борщ", uk: "борщ", tags: ["food", "kitchen-chaos"] },
  { id: "varenyky", en: "dumplings", ru: "пельмени", uk: "вареники", tags: ["food", "kitchen-chaos"] },
  { id: "ice-cream", en: "ice cream", ru: "мороженое", uk: "морозиво", tags: ["food", "candy-chaos", "party"] },
  { id: "cake", en: "cake", ru: "торт", uk: "торт", tags: ["food", "candy-chaos", "party"] },
  { id: "tea", en: "tea", ru: "чай", uk: "чай", tags: ["food", "kitchen-chaos", "everyday"] },
  { id: "coffee", en: "coffee", ru: "кофе", uk: "кава", tags: ["food", "kitchen-chaos", "city"] },
  { id: "banana", en: "banana", ru: "банан", uk: "банан", tags: ["food", "classic"] },
  { id: "watermelon", en: "watermelon", ru: "арбуз", uk: "кавун", tags: ["food", "classic"] },
  { id: "hamburger", en: "hamburger", ru: "гамбургер", uk: "гамбургер", tags: ["food", "kitchen-chaos", "party"] },
  { id: "soup", en: "soup", ru: "суп", uk: "суп", tags: ["food", "kitchen-chaos"] },
  { id: "frying-pan", en: "frying pan", ru: "сковорода", uk: "сковорідка", tags: ["food", "kitchen-chaos"] },
  { id: "chef", en: "chef", ru: "повар", uk: "кухар", tags: ["food", "kitchen-chaos"] },
  { id: "candy", en: "candy", ru: "конфета", uk: "цукерка", tags: ["food", "candy-chaos"] },
  { id: "lollipop", en: "lollipop", ru: "леденец", uk: "льодяник", tags: ["food", "candy-chaos"] },
  { id: "popcorn", en: "popcorn", ru: "попкорн", uk: "попкорн", tags: ["food", "party", "candy-chaos"] },

  // animals / nature
  { id: "fox", en: "fox", ru: "лиса", uk: "лисиця", tags: ["animals", "forest-folklore", "nature"] },
  { id: "bear", en: "bear", ru: "медведь", uk: "ведмідь", tags: ["animals", "forest-folklore", "nature"] },
  { id: "owl", en: "owl", ru: "сова", uk: "сова", tags: ["animals", "forest-folklore", "nature"] },
  { id: "frog", en: "frog", ru: "лягушка", uk: "жаба", tags: ["animals", "nature", "classic"] },
  { id: "penguin", en: "penguin", ru: "пингвин", uk: "пінгвін", tags: ["animals", "winter-fairy", "nature"] },
  { id: "octopus", en: "octopus", ru: "осьминог", uk: "восьминіг", tags: ["animals", "ocean-deep"] },
  { id: "shark", en: "shark", ru: "акула", uk: "акула", tags: ["animals", "ocean-deep"] },
  { id: "dolphin", en: "dolphin", ru: "дельфин", uk: "дельфін", tags: ["animals", "ocean-deep"] },
  { id: "jellyfish", en: "jellyfish", ru: "медуза", uk: "медуза", tags: ["animals", "ocean-deep"] },
  { id: "butterfly", en: "butterfly", ru: "бабочка", uk: "метелик", tags: ["animals", "nature", "forest-folklore"] },
  { id: "mushroom", en: "mushroom", ru: "гриб", uk: "гриб", tags: ["nature", "forest-folklore", "food"] },
  { id: "tree", en: "tree", ru: "дерево", uk: "дерево", tags: ["nature", "forest-folklore", "classic"] },
  { id: "flower", en: "flower", ru: "цветок", uk: "квітка", tags: ["nature", "classic"] },
  { id: "cactus", en: "cactus", ru: "кактус", uk: "кактус", tags: ["nature", "desert-mirage"] },
  { id: "camel", en: "camel", ru: "верблюд", uk: "верблюд", tags: ["animals", "desert-mirage"] },
  { id: "pyramid", en: "pyramid", ru: "пирамида", uk: "піраміда", tags: ["travel", "desert-mirage"] },
  { id: "volcano", en: "volcano", ru: "вулкан", uk: "вулкан", tags: ["nature", "classic"] },
  { id: "rainbow", en: "rainbow", ru: "радуга", uk: "веселка", tags: ["nature", "classic", "candy-chaos"] },
  { id: "snowman", en: "snowman", ru: "снеговик", uk: "сніговик", tags: ["winter-fairy", "nature"] },
  { id: "snowflake", en: "snowflake", ru: "снежинка", uk: "сніжинка", tags: ["winter-fairy", "nature"] },

  // space / fantasy
  { id: "rocket", en: "rocket", ru: "ракета", uk: "ракета", tags: ["space", "cosmic-doodle", "tech"] },
  { id: "alien", en: "alien", ru: "инопланетянин", uk: "інопланетянин", tags: ["space", "cosmic-doodle", "fantasy"] },
  { id: "planet", en: "planet", ru: "планета", uk: "планета", tags: ["space", "cosmic-doodle"] },
  { id: "astronaut", en: "astronaut", ru: "космонавт", uk: "космонавт", tags: ["space", "cosmic-doodle"] },
  { id: "ufo", en: "UFO", ru: "НЛО", uk: "НЛО", tags: ["space", "cosmic-doodle"] },
  { id: "star", en: "star", ru: "звезда", uk: "зірка", tags: ["space", "cosmic-doodle", "classic"] },
  { id: "moon", en: "moon", ru: "луна", uk: "місяць", tags: ["space", "cosmic-doodle", "night"] },
  { id: "dragon", en: "dragon", ru: "дракон", uk: "дракон", tags: ["fantasy", "forest-folklore", "cosmic-doodle"] },
  { id: "wizard", en: "wizard", ru: "волшебник", uk: "чарівник", tags: ["fantasy", "forest-folklore", "winter-fairy"] },
  { id: "unicorn", en: "unicorn", ru: "единорог", uk: "єдиноріг", tags: ["fantasy", "candy-chaos", "winter-fairy"] },
  { id: "ghost", en: "ghost", ru: "привидение", uk: "привид", tags: ["fantasy", "classic"] },
  { id: "vampire", en: "vampire", ru: "вампир", uk: "вампір", tags: ["fantasy"] },
  { id: "mermaid", en: "mermaid", ru: "русалка", uk: "русалка", tags: ["fantasy", "ocean-deep"] },
  { id: "castle", en: "castle", ru: "замок", uk: "замок", tags: ["fantasy", "classic"] },
  { id: "sword", en: "sword", ru: "меч", uk: "меч", tags: ["fantasy"] },
  { id: "magic-wand", en: "magic wand", ru: "волшебная палочка", uk: "чарівна паличка", tags: ["fantasy", "winter-fairy"] },

  // city / tech / night
  { id: "subway", en: "subway", ru: "метро", uk: "метро", tags: ["city", "neon-tokyo", "travel"] },
  { id: "skyscraper", en: "skyscraper", ru: "небоскрёб", uk: "хмарочос", tags: ["city", "neon-tokyo"] },
  { id: "traffic-light", en: "traffic light", ru: "светофор", uk: "світлофор", tags: ["city", "classic"] },
  { id: "taxi", en: "taxi", ru: "такси", uk: "таксі", tags: ["city", "neon-tokyo"] },
  { id: "headphones", en: "headphones", ru: "наушники", uk: "навушники", tags: ["tech", "classic", "neon-tokyo"] },
  { id: "robot", en: "robot", ru: "робот", uk: "робот", tags: ["tech", "cosmic-doodle", "arcade-lava"] },
  { id: "computer", en: "computer", ru: "компьютер", uk: "комп'ютер", tags: ["tech", "classic"] },
  { id: "camera", en: "camera", ru: "камера", uk: "камера", tags: ["tech", "classic"] },
  { id: "game-controller", en: "game controller", ru: "джойстик", uk: "джойстик", tags: ["tech", "arcade-lava", "party"] },
  { id: "arcade", en: "arcade", ru: "игровой автомат", uk: "ігровий автомат", tags: ["arcade-lava", "party", "city"] },
  { id: "pixel", en: "pixel", ru: "пиксель", uk: "піксель", tags: ["arcade-lava", "tech"] },
  { id: "neon-sign", en: "neon sign", ru: "неоновая вывеска", uk: "неонова вивіска", tags: ["neon-tokyo", "night", "city"] },
  { id: "umbrella-rain", en: "rainy street", ru: "дождливая улица", uk: "дощова вулиця", tags: ["neon-tokyo", "city", "night"] },

  // travel / ocean extras
  { id: "airplane", en: "airplane", ru: "самолёт", uk: "літак", tags: ["travel", "classic"] },
  { id: "boat", en: "boat", ru: "лодка", uk: "човен", tags: ["travel", "ocean-deep", "classic"] },
  { id: "lighthouse", en: "lighthouse", ru: "маяк", uk: "маяк", tags: ["travel", "ocean-deep"] },
  { id: "suitcase", en: "suitcase", ru: "чемодан", uk: "валіза", tags: ["travel", "classic"] },
  { id: "map", en: "map", ru: "карта", uk: "карта", tags: ["travel", "classic", "desert-mirage"] },
  { id: "compass", en: "compass", ru: "компас", uk: "компас", tags: ["travel", "desert-mirage"] },
  { id: "beach", en: "beach", ru: "пляж", uk: "пляж", tags: ["travel", "ocean-deep"] },
  { id: "palm-tree", en: "palm tree", ru: "пальма", uk: "пальма", tags: ["travel", "desert-mirage", "ocean-deep"] },

  // party / misc fun
  { id: "disco-ball", en: "disco ball", ru: "диско-шар", uk: "диско-куля", tags: ["party", "arcade-lava", "candy-chaos"] },
  { id: "microphone", en: "microphone", ru: "микрофон", uk: "мікрофон", tags: ["party", "classic"] },
  { id: "guitar", en: "guitar", ru: "гитара", uk: "гітара", tags: ["party", "classic"] },
  { id: "skateboard", en: "skateboard", ru: "скейтборд", uk: "скейтборд", tags: ["classic", "city", "party"] },
  { id: "soccer-ball", en: "soccer ball", ru: "футбольный мяч", uk: "футбольний м'яч", tags: ["classic", "party"] },
  { id: "crown", en: "crown", ru: "корона", uk: "корона", tags: ["fantasy", "classic", "party"] },
  { id: "mustache", en: "mustache", ru: "усы", uk: "вуса", tags: ["classic", "party"] },
  { id: "toilet", en: "toilet", ru: "унитаз", uk: "унітаз", tags: ["classic", "party", "everyday"] },
  { id: "socks", en: "socks", ru: "носки", uk: "шкарпетки", tags: ["everyday", "classic", "winter-fairy"] },
  { id: "scarf", en: "scarf", ru: "шарф", uk: "шарф", tags: ["winter-fairy", "everyday"] },
  { id: "mittens", en: "mittens", ru: "варежки", uk: "рукавички", tags: ["winter-fairy", "everyday"] },
  { id: "campfire", en: "campfire", ru: "костёр", uk: "багаття", tags: ["nature", "forest-folklore"] },
  { id: "tent", en: "tent", ru: "палатка", uk: "намет", tags: ["nature", "travel", "forest-folklore"] },
  { id: "flashlight", en: "flashlight", ru: "фонарик", uk: "ліхтарик", tags: ["everyday", "night"] },
  { id: "spider", en: "spider", ru: "паук", uk: "павук", tags: ["animals", "classic"] },
  { id: "bee", en: "bee", ru: "пчела", uk: "бджола", tags: ["animals", "nature"] },
  { id: "snail", en: "snail", ru: "улитка", uk: "равлик", tags: ["animals", "nature"] },
  { id: "eagle", en: "eagle", ru: "орёл", uk: "орел", tags: ["animals", "nature"] },
  { id: "whale", en: "whale", ru: "кит", uk: "кит", tags: ["animals", "ocean-deep"] },
  { id: "treasure", en: "treasure", ru: "сокровище", uk: "скарб", tags: ["fantasy", "ocean-deep", "desert-mirage"] },
  { id: "pirate", en: "pirate", ru: "пират", uk: "пірат", tags: ["fantasy", "ocean-deep", "party"] }
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
    .replace(/ё/g, "е")
    .replace(/[''`]/g, "")
    .replace(/\s+/g, " ");
}

function conceptAnswers(concept) {
  return [concept.en].filter(Boolean).map(normalizeGuess);
}

function displayWord(concept) {
  return concept?.en || "";
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
      en: w,
      ru: w,
      uk: w,
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
  // Always mix in some classics so pools stay large enough
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
  return String(word)
    .split("")
    .map((ch, i) => {
      if (ch === " ") return " ";
      if (ch === "-" || ch === "'") return ch;
      if (revealed.includes(i)) return ch.toUpperCase();
      return "_";
    })
    .join(" ");
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

// Back-compat alias used nowhere critical
const DEFAULT_WORDS = CONCEPTS.map((c) => c.en);
