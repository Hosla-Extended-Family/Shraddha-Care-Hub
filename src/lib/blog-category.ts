// Lightweight, client-side category inference from blog title + body.
// No schema change: categories are computed on the fly so existing blogs
// get categorized automatically based on the writing itself.

export type BlogCategory =
  | "life-family"
  | "health-wellness"
  | "nature-travel"
  | "faith-spirituality"
  | "poetry-art"
  | "reflections";

export const CATEGORY_META: { id: BlogCategory; label: string; labelBn: string }[] = [
  { id: "life-family",        label: "Life & Family",        labelBn: "জীবন ও পরিবার" },
  { id: "health-wellness",    label: "Health & Wellness",    labelBn: "স্বাস্থ্য ও সুস্থতা" },
  { id: "nature-travel",      label: "Nature & Travel",      labelBn: "প্রকৃতি ও ভ্রমণ" },
  { id: "faith-spirituality", label: "Faith & Spirituality", labelBn: "বিশ্বাস ও আধ্যাত্মিকতা" },
  { id: "poetry-art",         label: "Poetry & Art",         labelBn: "কবিতা ও শিল্প" },
  { id: "reflections",        label: "Reflections",          labelBn: "ভাবনা" },
];

// Keyword buckets. Matched against lower-cased title+body.
const KEYWORDS: Record<Exclude<BlogCategory, "reflections">, string[]> = {
  "life-family": [
    "family", "son", "daughter", "wife", "husband", "mother", "father",
    "grandchild", "grandma", "grandpa", "childhood", "school", "wedding",
    "home", "kitchen", "father-in-law", "mother-in-law", "sister", "brother",
    "মা", "বাবা", "ছেলে", "মেয়ে", "পরিবার", "স্ত্রী", "স্বামী", "নাতি", "নাতনি",
  ],
  "health-wellness": [
    "health", "doctor", "hospital", "medicine", "exercise", "walk", "walking",
    "yoga", "diabetes", "blood pressure", "arthritis", "recovery", "wellness",
    "diet", "sleep", "physiotherapy",
    "স্বাস্থ্য", "ডাক্তার", "হাসপাতাল", "ওষুধ", "যোগ", "ব্যায়াম",
  ],
  "nature-travel": [
    "travel", "journey", "trip", "mountain", "river", "sea", "beach", "forest",
    "village", "sunrise", "sunset", "garden", "monsoon", "bird", "trek",
    "temple visit", "pilgrimage",
    "ভ্রমণ", "নদী", "সমুদ্র", "পাহাড়", "গ্রাম", "বাগান", "বৃষ্টি",
  ],
  "faith-spirituality": [
    "god", "prayer", "temple", "puja", "durga", "krishna", "shiva", "ram",
    "gita", "devotion", "faith", "spiritual", "meditation", "blessing", "guru",
    "ঈশ্বর", "ভগবান", "পূজা", "প্রার্থনা", "মন্দির", "ধর্ম", "ভক্তি", "গীতা",
  ],
  "poetry-art": [
    "poem", "poetry", "verse", "stanza", "song", "rhyme", "sonnet",
    "painting", "sketch", "music", "raga", "tagore", "rabindra",
    "কবিতা", "গান", "ছন্দ", "চিত্র", "শিল্প", "রবীন্দ্র",
  ],
};

const KIND_MARKER_RE = /<!--kind:(poem|recitation|essay|other)-->/i;

export function inferCategory(title: string, body: string): BlogCategory {
  // Poems/recitations are auto-categorized under Poetry & Art regardless of keywords.
  const kindMatch = body.match(KIND_MARKER_RE);
  if (kindMatch && (kindMatch[1] === "poem" || kindMatch[1] === "recitation")) {
    return "poetry-art";
  }

  const text = `${title} ${body}`.toLowerCase();
  const scores: Record<string, number> = {};
  (Object.keys(KEYWORDS) as (keyof typeof KEYWORDS)[]).forEach((cat) => {
    let score = 0;
    for (const k of KEYWORDS[cat]) {
      if (text.includes(k.toLowerCase())) score += 1;
    }
    scores[cat] = score;
  });

  let best: BlogCategory = "reflections";
  let bestScore = 0;
  (Object.keys(scores) as BlogCategory[]).forEach((cat) => {
    if (scores[cat] > bestScore) { bestScore = scores[cat]; best = cat; }
  });
  return bestScore > 0 ? best : "reflections";
}
