const WORD_AI_SYSTEM = `You create Skribble / Pictionary word lists.
Rules:
- Reply with ONLY a JSON array of 22 to 32 strings.
- Every word must be clearly about the researched theme.
- Prefer VERY EASY things to draw: concrete nouns kids could sketch (animal, object, place feature, weather, vehicle, food).
- 1-3 words each, max 32 characters.
- No obscure proper names, no dates, no abstract ideas, no sentences.
Example: ["moose","snow","pipeline","bison","mountain"]`;

async function generateWordsFromPrompt(prompt) {
  const idea = String(prompt || "").trim();
  if (!idea) throw new Error("Tell me what kind of words you want.");

  const topic = cleanTopic(idea);
  const research = await researchTopic(topic);

  try {
    const words = await fetchAiWordList(topic, research);
    if (words.length >= 12) return words.slice(0, 32);
  } catch (_) {
    /* use research fallback */
  }

  const fromResearch = wordsFromResearch(topic, research);
  if (fromResearch.length >= 10) return fromResearch;
  throw new Error("Couldn’t find enough easy words for that theme. Try a clearer topic.");
}

function cleanTopic(idea) {
  return idea
    .replace(/^(i want|make|give me|create|need)\s+/i, "")
    .replace(/^(words?\s+about|a list of|themed?|theme)\s+/i, "")
    .replace(/\bwolds\b/gi, "words")
    .trim() || idea.trim();
}

async function researchTopic(topic) {
  const chunks = [];

  try {
    const searchUrl =
      "https://en.wikipedia.org/w/api.php?action=opensearch&limit=4&namespace=0&format=json&origin=*&search=" +
      encodeURIComponent(topic);
    const search = await fetch(searchUrl).then((r) => r.json());
    const titles = Array.isArray(search?.[1]) ? search[1].slice(0, 3) : [];

    for (const title of titles) {
      try {
        const sum = await fetch(
          "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title)
        ).then((r) => r.json());
        if (sum?.extract) chunks.push(`${title}: ${sum.extract}`);
        if (sum?.description) chunks.push(String(sum.description));
      } catch (_) {
        /* continue */
      }
    }
  } catch (_) {
    /* continue */
  }

  try {
    const ddg = await fetch(
      "https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&q=" +
        encodeURIComponent(topic)
    ).then((r) => r.json());
    if (ddg?.AbstractText) chunks.push(ddg.AbstractText);
    if (ddg?.Heading) chunks.push(String(ddg.Heading));
    const related = Array.isArray(ddg?.RelatedTopics) ? ddg.RelatedTopics : [];
    related.slice(0, 8).forEach((item) => {
      if (item?.Text) chunks.push(item.Text);
      if (Array.isArray(item?.Topics)) {
        item.Topics.slice(0, 4).forEach((t) => {
          if (t?.Text) chunks.push(t.Text);
        });
      }
    });
  } catch (_) {
    /* continue */
  }

  // Always blend in known easy theme seeds when keywords match
  chunks.push(seedHintsFor(topic).join(", "));

  return chunks.filter(Boolean).join("\n").slice(0, 3200);
}

async function fetchAiWordList(topic, research) {
  const user = `Theme: ${topic}

Web research notes:
${research || "(none)"}

Make an EASY draw-and-guess list strictly about this theme.`;

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
      temperature: 0.55
    })
  });

  if (!res.ok) throw new Error("AI busy");

  const data = await res.json();
  const text =
    data?.choices?.[0]?.message?.content ||
    data?.content ||
    (typeof data === "string" ? data : "");
  return filterEasyWords(parseWordListResponse(text), topic);
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
    if (w.length < 2 || w.length > 32) return;
    if (/^\d+$/.test(w)) return;
    const key = w.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(w);
  });
  return out;
}

const HARD_BLOCK = new Set([
  "the", "and", "for", "with", "from", "that", "this", "are", "was", "were",
  "have", "has", "been", "into", "over", "under", "about", "their", "they",
  "area", "city", "town", "community", "located", "known", "also", "many",
  "average", "temperature", "population", "history", "including", "during"
]);

/** Concrete, easy-to-draw nouns we prefer when mining research text. */
const EASY_BANK = [
  "moose", "bison", "buffalo", "bear", "wolf", "eagle", "salmon", "caribou", "sheep",
  "snow", "ice", "mountain", "river", "forest", "lake", "cabin", "campfire", "tent",
  "truck", "highway", "bridge", "pipeline", "airplane", "helicopter", "snowmobile",
  "sled", "ski", "boots", "mittens", "scarf", "beanie", "thermometer", "wind",
  "farm", "tractor", "barn", "potato", "cow", "horse", "dog", "gun", "fishing",
  "fish", "canoe", "boat", "campground", "pine tree", "aurora", "northern lights",
  "igloo", "snowman", "iceberg", "glacier",
  "mosquito", "signpost", "milepost", "roadhouse", "museum", "flag", "map",
  "compass", "backpack", "binoculars", "camera", "sunset", "star", "moon",
  "fireweed", "berry", "axe", "wood", "stove", "thermos", "hot cocoa",
  "magpie", "raven", "fox", "lynx"
];

function seedHintsFor(topic) {
  const q = topic.toLowerCase();
  const seeds = [];
  if (/alaska|delta junction|fairbanks|anchorage|juneau|denali/.test(q)) {
    seeds.push(
      "moose", "bison", "pipeline", "snow", "mountain", "cabin", "aurora",
      "salmon", "glacier", "highway", "mosquito", "sled dog", "ice", "bear",
      "caribou", "river", "pine tree", "snowmobile", "thermometer", "northern lights",
      "fishing", "boots", "scarf", "campfire", "eagle", "wolf", "truck", "tent"
    );
  }
  if (/ocean|sea|beach|marine/.test(q)) {
    seeds.push("shark", "whale", "boat", "wave", "seashell", "lighthouse", "fish", "anchor");
  }
  if (/kitchen|cook|food|restaurant/.test(q)) {
    seeds.push("pizza", "pan", "chef", "spoon", "cake", "egg", "soup", "knife");
  }
  if (/space|nasa|planet|astronaut/.test(q)) {
    seeds.push("rocket", "moon", "alien", "star", "planet", "astronaut", "satellite");
  }
  if (/halloween|spooky|scary|horror/.test(q)) {
    seeds.push("ghost", "pumpkin", "bat", "witch", "skeleton", "spider", "candy");
  }
  return seeds;
}

function wordsFromResearch(topic, research) {
  const text = `${topic}\n${research}`.toLowerCase();
  const found = [];

  EASY_BANK.forEach((word) => {
    const re = new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (re.test(text)) found.push(word);
  });

  seedHintsFor(topic).forEach((w) => found.push(w));

  // Pull short concrete tokens from research
  const tokens = text
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && t.length <= 12 && !HARD_BLOCK.has(t));

  const interesting = tokens.filter((t) =>
    EASY_BANK.some((e) => e.includes(t) || t.includes(e.split(" ")[0]))
  );
  interesting.forEach((t) => found.push(t));

  return filterEasyWords(cleanWordList(found), topic).slice(0, 28);
}

function filterEasyWords(list, topic) {
  const q = topic.toLowerCase();
  const seeds = new Set(seedHintsFor(topic).map((w) => w.toLowerCase()));
  const preferred = [];
  const rest = [];

  cleanWordList(list).forEach((w) => {
    const low = w.toLowerCase();
    if (HARD_BLOCK.has(low)) return;
    if (/\d/.test(w)) return;
    // Drop obviously off-theme movie/school junk unless requested
    if (!/school|movie|space|film/.test(q)) {
      if (/clapperboard|director chair|report card|locker|chalkboard/.test(low)) return;
      if (/nebula|constellation|mars rover|space suit|ufo/.test(low) && !/space|nasa|planet|alien/.test(q)) {
        return;
      }
    }
    if (seeds.has(low) || EASY_BANK.includes(low)) preferred.push(w);
    else rest.push(w);
  });

  // If theme has seeds, keep mostly on-theme preferred + a few rest
  if (seeds.size) {
    return cleanWordList([...preferred, ...rest]).slice(0, 30);
  }
  return cleanWordList([...preferred, ...rest]).slice(0, 30);
}
