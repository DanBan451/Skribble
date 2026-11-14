const DEFAULT_WORDS = [
  "apple","airplane","alarm clock","alien","alligator","anchor","angel","ant",
  "avocado","backpack","balloon","banana","baseball","basketball","battery",
  "beach","bear","bed","bee","bicycle","binoculars","bird","birthday cake",
  "blanket","boat","book","boots","bottle","bow tie","brain","bread","bridge",
  "broccoli","broom","bubble","bucket","bus","butterfly","cactus","camera",
  "campfire","candle","candy","cannon","canoe","carrot","castle","cat",
  "caterpillar","cave","chair","cheese","cheetah","cherry","chicken","chimney",
  "chocolate","circus","clock","cloud","clown","coffee","compass","computer",
  "cookie","couch","cow","crab","crayon","crown","cupcake","dinosaur","dog",
  "dolphin","donut","dragon","drum","duck","dumbbell","eagle","ear","earth",
  "elephant","envelope","eye","feather","fence","fire","firetruck","fish",
  "flag","flashlight","flower","flute","football","forest","fountain","fox",
  "frog","galaxy","ghost","giraffe","glasses","globe","goat","gorilla",
  "grape","guitar","hammer","hamburger","hammerhead","hat","headphones",
  "hedgehog","helicopter","hose","hot dog","house","ice cream","igloo",
  "island","jacket","jellyfish","kangaroo","key","keyboard","kite","koala",
  "ladder","lamp","leaf","lemon","lighthouse","lightning","lion","lipstick",
  "llama","lollipop","magnet","mailbox","map","mermaid","microscope",
  "microwave","milk","mirror","monkey","moon","motorcycle","mountain","mouse",
  "mushroom","mustache","nail","necklace","ninja","notebook","octopus",
  "onion","orange","owl","paintbrush","panda","paperclip","parrot","peach",
  "peacock","pencil","penguin","piano","pickle","pie","pig","pillow","pinecone",
  "pineapple","pirate","pizza","planet","plant","platypus","pocket","popcorn",
  "popsicle","postcard","potato","pretzel","pumpkin","pyramid","rabbit",
  "raccoon","rainbow","rake","robot","rocket","roller coaster","rubber duck",
  "sailboat","sandwich","satellite","saxophone","scarecrow","scissors","shark",
  "sheep","shoe","skateboard","skeleton","skyscraper","slide","snail","snake",
  "snowflake","snowman","soap","soccer ball","socks","spider","spoon","star",
  "strawberry","submarine","suitcase","sun","sunglasses","surfboard","sushi",
  "swan","swing","sword","t-shirt","taco","teapot","telescope","tennis",
  "tent","tiger","toast","toilet","toothbrush","tornado","tractor","train",
  "tree","triangle","trombone","truck","turtle","umbrella","unicorn",
  "vacuum","vampire","violin","volcano","waffle","wagon","watermelon",
  "whale","wheel","windmill","window","wizard","wolf","zebra","zipper"
];

const AVATAR_COLORS = [
  "#2ec4a6", "#4ea8de", "#ff6b5a", "#ffc857", "#7bdff2",
  "#b388eb", "#90be6d", "#f9844a", "#43aa8b", "#577590"
];

function parseCustomWords(text) {
  return String(text || "")
    .split(",")
    .map((w) => w.trim().replace(/\s+/g, " "))
    .filter((w) => w.length >= 1 && w.length <= 32);
}

function pickWords(pool, count, used = new Set()) {
  const available = pool.filter((w) => !used.has(w.toLowerCase()));
  const source = available.length >= count ? available : pool.slice();
  const shuffled = source.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function buildWordPool(customText, customOnly) {
  const custom = parseCustomWords(customText);
  if (customOnly) {
    if (custom.length < 10) {
      throw new Error("Need at least 10 custom words when using custom-only mode.");
    }
    return custom;
  }
  return [...DEFAULT_WORDS, ...custom];
}

function wordBlank(word, revealed = []) {
  return word
    .split("")
    .map((ch, i) => {
      if (ch === " ") return " ";
      if (ch === "-") return "-";
      if (revealed.includes(i)) return ch.toUpperCase();
      return "_";
    })
    .join(" ");
}

function isCloseGuess(guess, word) {
  const g = guess.toLowerCase().trim();
  const w = word.toLowerCase().trim();
  if (!g || g === w) return false;
  if (Math.abs(g.length - w.length) > 2) return false;
  let distance = levenshtein(g, w);
  return distance > 0 && distance <= Math.max(1, Math.floor(w.length / 4));
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
    if (ch === " " || ch === "-" || already.includes(i)) continue;
    candidates.push(i);
  }
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, hintCount);
}
