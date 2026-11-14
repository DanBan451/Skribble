const WORD_AI_SYSTEM = `You help create Skribble/Pictionary word lists.
Reply with ONLY a JSON array of 20 to 40 short English nouns/phrases that are easy to draw.
No numbering, no markdown, no explanation. Example: ["rocket","alien","pizza"]
Keep each item 1-32 characters. Avoid proper names that are too obscure.`;

async function generateWordsFromPrompt(prompt) {
  const idea = String(prompt || "").trim();
  if (!idea) throw new Error("Tell me what kind of words you want.");

  try {
    const words = await fetchAiWordList(idea);
    if (words.length >= 10) return words;
  } catch (_) {
    /* fall through to local */
  }
  return localWordIdeas(idea);
}

async function fetchAiWordList(idea) {
  const user = `Make a draw-and-guess word list for this vibe: ${idea}`;
  const res = await fetch("https://text.pollinations.ai/openai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: location.origin
    },
    body: JSON.stringify({
      model: "openai",
      messages: [
        { role: "system", content: WORD_AI_SYSTEM },
        { role: "user", content: user }
      ],
      temperature: 0.9
    })
  });

  if (!res.ok) {
    throw new Error("AI busy — using local word ideas instead.");
  }

  const data = await res.json();
  const text =
    data?.choices?.[0]?.message?.content ||
    data?.content ||
    (typeof data === "string" ? data : "");
  return parseWordListResponse(text);
}

function parseWordListResponse(text) {
  const raw = String(text || "").trim();
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  let list = [];
  if (jsonMatch) {
    try {
      list = JSON.parse(jsonMatch[0]);
    } catch (_) {
      list = [];
    }
  }
  if (!Array.isArray(list) || !list.length) {
    list = raw
      .split(/[\n,]/)
      .map((w) => w.replace(/^[\s\-*0-9.]+/, "").replace(/["']/g, "").trim())
      .filter(Boolean);
  }
  return cleanWordList(list);
}

function cleanWordList(list) {
  const out = [];
  const seen = new Set();
  list.forEach((item) => {
    const w = String(item || "").trim().replace(/\s+/g, " ");
    if (w.length < 1 || w.length > 32) return;
    const key = w.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(w);
  });
  return out;
}

/** Local fallback when the free AI endpoint is rate-limited. */
const LOCAL_PACKS = {
  space: ["rocket", "alien", "planet", "astronaut", "moon", "comet", "satellite", "spaceship", "black hole", "telescope", "galaxy", "meteor", "UFO", "space suit", "orbit", "solar panel", "mars rover", "constellation", "nebula", "space station"],
  ocean: ["shark", "octopus", "jellyfish", "whale", "dolphin", "coral", "submarine", "lighthouse", "anchor", "mermaid", "treasure chest", "pirate ship", "wave", "seashell", "scuba diver", "kraken", "starfish", "eel", "buoy", "tide pool"],
  food: ["pizza", "taco", "sushi", "hamburger", "ice cream", "donut", "pretzel", "waffle", "hot dog", "cupcake", "noodles", "avocado", "popcorn", "smoothie", "pancake", "burrito", "cookie", "cheese", "salad", "soup"],
  scary: ["ghost", "vampire", "zombie", "skeleton", "haunted house", "spider", "bat", "mummy", "werewolf", "graveyard", "pumpkin", "witch", "cauldron", "tombstone", "scarecrow", "monster", "coffin", "black cat", "full moon", "spider web"],
  animals: ["cat", "dog", "fox", "bear", "owl", "penguin", "giraffe", "elephant", "lion", "tiger", "monkey", "rabbit", "snake", "frog", "bee", "butterfly", "koala", "panda", "wolf", "eagle"],
  movies: ["popcorn", "ticket", "camera", "director chair", "red carpet", "superhero", "robot", "spaceship", "pirate", "detective", "crown", "sword", "mask", "stage light", "clapperboard", "villain", "magic wand", "treasure map", "time machine", "dragon"],
  school: ["backpack", "pencil", "notebook", "globe", "chalkboard", "calculator", "locker", "lunchbox", "ruler", "scissors", "glue", "eraser", "desk", "bus", "library", "microscope", "trophy", "report card", "bell", "teacher"],
  sports: ["soccer ball", "basketball", "tennis racket", "skateboard", "surfboard", "helmet", "trophy", "whistle", "goal post", "baseball bat", "hockey stick", "swim goggles", "finish line", "dumbbell", "yoga mat", "bowling pin", "frisbee", "volleyball", "ski", "medal"],
  winter: ["snowman", "snowflake", "scarf", "mittens", "sled", "ice skate", "hot cocoa", "fireplace", "penguin", "igloo", "beanie", "frost", "iceberg", "ski lift", "earmuffs", "boots", "candy cane", "pine tree", "blizzard", "ice cube"],
  city: ["taxi", "subway", "skyscraper", "traffic light", "neon sign", "bridge", "bus", "crosswalk", "fire hydrant", "street lamp", "mailbox", "apartment", "museum", "park bench", "bike rack", "hot dog stand", "elevator", "billboard", "fountain", "helicopter"]
};

function localWordIdeas(idea) {
  const q = idea.toLowerCase();
  const hits = [];
  Object.entries(LOCAL_PACKS).forEach(([key, words]) => {
    if (q.includes(key) || key.split("").some(() => false)) {
      /* noop keep simple */
    }
    const aliases = {
      space: ["space", "cosmo", "nasa", "planet", "alien", "rocket"],
      ocean: ["ocean", "sea", "beach", "fish", "pirate", "water"],
      food: ["food", "cook", "kitchen", "eat", "snack", "restaurant"],
      scary: ["scary", "horror", "spooky", "halloween", "creepy"],
      animals: ["animal", "zoo", "pet", "wildlife"],
      movies: ["movie", "film", "cinema", "hollywood", "hollywood"],
      school: ["school", "class", "teacher", "student"],
      sports: ["sport", "game", "athlete", "ball"],
      winter: ["winter", "snow", "cold", "christmas", "ice"],
      city: ["city", "urban", "street", "downtown", "tokyo", "night"]
    };
    const keys = aliases[key] || [key];
    if (keys.some((k) => q.includes(k))) hits.push(...words);
  });

  if (!hits.length) {
    // Mix a few packs based on hash of prompt
    const keys = Object.keys(LOCAL_PACKS);
    const a = keys[Math.abs(hashStr(q)) % keys.length];
    const b = keys[Math.abs(hashStr(q + "x")) % keys.length];
    hits.push(...LOCAL_PACKS[a], ...LOCAL_PACKS[b]);
  }

  const shuffled = cleanWordList(hits).sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 28);
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
