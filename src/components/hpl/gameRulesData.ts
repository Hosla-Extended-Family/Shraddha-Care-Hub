export interface GameRules {
  en: string[];
  bn: string[];
}

export const GAME_RULES: Record<string, GameRules> = {
  "Carrom": {
    en: [
      "Each team gets alternate turns to flick the striker.",
      "Pocket all your assigned coins (black or white) before the opponent.",
      "The Queen must be pocketed and then covered in the next shot.",
      "If the striker goes into the pocket, it's a foul — one coin is returned.",
      "The team that pockets all their coins first wins the round.",
    ],
    bn: [
      "প্রতিটি দল পালা করে স্ট্রাইকার ছুড়বে।",
      "প্রতিপক্ষের আগে আপনার নির্ধারিত গুটি (কালো বা সাদা) পকেটে ফেলুন।",
      "রানি পকেটে ফেলার পর পরবর্তী শটে কভার করতে হবে।",
      "স্ট্রাইকার পকেটে গেলে ফাউল — একটি গুটি ফেরত আসবে।",
      "যে দল আগে সব গুটি পকেটে ফেলবে, তারা জিতবে।",
    ],
  },
  "Ludo": {
    en: [
      "Each player rolls the dice and moves their tokens accordingly.",
      "A six is required to bring a token out of the starting area.",
      "Landing on an opponent's token sends it back to the start.",
      "Safe spots protect tokens from being captured.",
      "The first player to move all four tokens to the home wins.",
    ],
    bn: [
      "প্রতিটি খেলোয়াড় ছক্কা গুটি চালবে ডাইস অনুযায়ী।",
      "ঘর থেকে গুটি বের করতে ছয় লাগবে।",
      "প্রতিপক্ষের গুটিতে পড়লে সেটি আবার শুরুতে ফিরে যাবে।",
      "সেফ স্পটে গুটি নিরাপদ থাকে।",
      "যে খেলোয়াড় আগে চারটি গুটি ঘরে তুলবে সে জিতবে।",
    ],
  },
  "Chess": {
    en: [
      "Each player starts with 16 pieces and takes turns moving one piece.",
      "The goal is to checkmate the opponent's King.",
      "Each piece has unique movement rules (Rook, Bishop, Knight, etc.).",
      "Castling, en passant, and pawn promotion are special moves.",
      "The game ends in checkmate, stalemate, or draw by agreement.",
    ],
    bn: [
      "প্রতিটি খেলোয়াড় ১৬টি ঘুঁটি নিয়ে শুরু করে এবং পালা করে চালে।",
      "লক্ষ্য হলো প্রতিপক্ষের রাজাকে চেকমেট করা।",
      "প্রতিটি ঘুঁটির আলাদা চালের নিয়ম আছে (নৌকা, হাতি, ঘোড়া ইত্যাদি)।",
      "ক্যাসলিং, এন প্যাসান্ট এবং পদোন্নতি বিশেষ চাল।",
      "খেলা চেকমেট, স্টেলমেট বা ড্র-এ শেষ হয়।",
    ],
  },
  "Foosball": {
    en: [
      "Two teams control rows of miniature players on rods.",
      "Spin the rods to kick the ball towards the opponent's goal.",
      "Spinning the rod 360° before striking is not allowed.",
      "Each goal counts as one point.",
      "The team with the most goals at the end of the match wins.",
    ],
    bn: [
      "দুটি দল রডে লাগানো মিনিয়েচার খেলোয়াড় নিয়ন্ত্রণ করে।",
      "রড ঘুরিয়ে বলকে প্রতিপক্ষের গোলে পাঠান।",
      "মারার আগে রড ৩৬০° ঘোরানো নিষিদ্ধ।",
      "প্রতিটি গোল এক পয়েন্ট।",
      "ম্যাচ শেষে সবচেয়ে বেশি গোলের দল জিতবে।",
    ],
  },
  "Slow Walk": {
    en: [
      "Participants walk as slowly as possible on a straight track.",
      "Both feet must remain on the ground — no stopping or standing still.",
      "Continuous motion is mandatory; hesitation leads to disqualification.",
      "The last person to cross the finish line wins!",
      "Balance and patience are the keys to victory.",
    ],
    bn: [
      "অংশগ্রহণকারীরা সোজা ট্র্যাকে যতটা সম্ভব ধীরে হাঁটবে।",
      "দুই পা মাটিতে থাকবে — থামা বা দাঁড়িয়ে থাকা যাবে না।",
      "অবিচ্ছিন্ন চলন বাধ্যতামূলক; দ্বিধায় অযোগ্য।",
      "যে সবার শেষে ফিনিশ লাইন পার করবে সে জিতবে!",
      "ভারসাম্য ও ধৈর্যই জয়ের চাবিকাঠি।",
    ],
  },
  "Marble Spoon": {
    en: [
      "Each participant holds a spoon in their mouth with a marble on it.",
      "Walk or race to the finish line without dropping the marble.",
      "Hands must not touch the spoon or marble during the race.",
      "If the marble falls, the participant must restart or is eliminated.",
      "The first person to cross the finish line with the marble wins.",
    ],
    bn: [
      "প্রতিটি অংশগ্রহণকারী মুখে চামচে মার্বেল রেখে দৌড়াবে।",
      "মার্বেল না ফেলে ফিনিশ লাইনে পৌঁছাতে হবে।",
      "দৌড়ের সময় হাত দিয়ে চামচ বা মার্বেল ধরা যাবে না।",
      "মার্বেল পড়ে গেলে আবার শুরু করতে হবে বা বাদ।",
      "মার্বেল সহ প্রথম ফিনিশ লাইন পার করলে জয়।",
    ],
  },
  "Badminton": {
    en: [
      "Played as singles or doubles on a rectangular court with a net.",
      "The shuttle must be served diagonally to the opponent's side.",
      "A rally ends when the shuttle hits the ground or a fault occurs.",
      "Points are scored by landing the shuttle on the opponent's court.",
      "The first player/team to reach the target score wins the game.",
    ],
    bn: [
      "আয়তক্ষেত্রাকার কোর্টে নেটসহ একক বা জোড়ায় খেলা হয়।",
      "শাটল কোণাকুণিভাবে প্রতিপক্ষের দিকে সার্ভ করতে হবে।",
      "শাটল মাটিতে পড়লে বা ফল্ট হলে র‍্যালি শেষ।",
      "প্রতিপক্ষের কোর্টে শাটল ফেললে পয়েন্ট।",
      "লক্ষ্য স্কোরে প্রথম পৌঁছানো দল/খেলোয়াড় জিতবে।",
    ],
  },
  "Memory Game": {
    en: [
      "Cards are placed face-down on a table in a grid pattern.",
      "Players take turns flipping two cards at a time.",
      "If the two cards match, the player keeps them and gets another turn.",
      "If they don't match, both cards are flipped back face-down.",
      "The player with the most matched pairs at the end wins.",
    ],
    bn: [
      "কার্ডগুলো উল্টো করে টেবিলে সাজানো থাকে।",
      "খেলোয়াড়রা পালা করে দুটি কার্ড উল্টাবে।",
      "দুটি কার্ড মিললে খেলোয়াড় সেগুলো রাখবে ও আবার চান্স পাবে।",
      "না মিললে দুটি কার্ড আবার উল্টে যাবে।",
      "সবচেয়ে বেশি জোড়া মেলানো খেলোয়াড় জিতবে।",
    ],
  },
  "Gaaner Lorai": {
    en: [
      "Two teams compete in a singing battle (Antakshari-style).",
      "Each team must sing a song starting with the last letter of the previous song.",
      "A time limit is given to start the song — failing means elimination.",
      "Songs must be recognizable and at least a few lines long.",
      "The team that keeps going the longest wins the battle!",
    ],
    bn: [
      "দুটি দল গানের লড়াইয়ে প্রতিযোগিতা করে (অন্তাক্ষরী ধাঁচে)।",
      "আগের গানের শেষ অক্ষর দিয়ে পরের গান শুরু করতে হবে।",
      "গান শুরু করার জন্য নির্দিষ্ট সময় — ব্যর্থ হলে বাদ।",
      "গান চেনা হতে হবে এবং অন্তত কয়েক লাইন গাইতে হবে।",
      "যে দল সবচেয়ে বেশিক্ষণ টিকে থাকবে, তারা জিতবে!",
    ],
  },
  "Bucket Ball": {
    en: [
      "Players take turns throwing balls into a bucket from a set distance.",
      "Each successful throw scores one point.",
      "Players get a fixed number of throws per round.",
      "The bucket may be placed at varying distances for difficulty.",
      "The player/team with the highest score wins.",
    ],
    bn: [
      "খেলোয়াড়রা নির্দিষ্ট দূরত্ব থেকে বালতিতে বল ছুড়বে।",
      "প্রতিটি সফল ছোড়ায় এক পয়েন্ট।",
      "প্রতি রাউন্ডে নির্দিষ্ট সংখ্যক ছোড়ার সুযোগ।",
      "কঠিন করতে বালতি বিভিন্ন দূরত্বে রাখা হতে পারে।",
      "সর্বোচ্চ স্কোরের খেলোয়াড়/দল জিতবে।",
    ],
  },
  "Saankh Bajano": {
    en: [
      "Participants blow a conch shell (Shankha) to produce sound.",
      "Judged on sound quality, duration, and loudness.",
      "Each participant gets a set number of attempts.",
      "Traditional and cultural significance adds to the spirit of the game.",
      "The longest or most resonant conch blow wins!",
    ],
    bn: [
      "অংশগ্রহণকারীরা শঙ্খ বাজিয়ে শব্দ তৈরি করবে।",
      "শব্দের গুণমান, সময়কাল ও জোরের উপর বিচার হবে।",
      "প্রতিটি অংশগ্রহণকারী নির্দিষ্ট সংখ্যক সুযোগ পাবে।",
      "ঐতিহ্যবাহী ও সাংস্কৃতিক গুরুত্ব খেলার চেতনা বাড়ায়।",
      "সবচেয়ে দীর্ঘ বা সুরেলা শঙ্খধ্বনি জিতবে!",
    ],
  },
  "Antakshari": {
    en: [
      "Teams take turns singing songs based on the last letter of the previous song.",
      "Each team gets a limited time to start their song.",
      "Songs must be from recognized film/folk music.",
      "Repeating a previously sung song leads to disqualification for that round.",
      "The team surviving the most rounds wins!",
    ],
    bn: [
      "দলগুলো আগের গানের শেষ অক্ষর দিয়ে গান গাইবে।",
      "প্রতি দলকে নির্দিষ্ট সময়ের মধ্যে গান শুরু করতে হবে।",
      "গান সিনেমা/লোকগীতি থেকে হতে হবে।",
      "আগে গাওয়া গান পুনরাবৃত্তি করলে সেই রাউন্ডে বাদ।",
      "সবচেয়ে বেশি রাউন্ড টিকে থাকা দল জিতবে!",
    ],
  },
  "Popular Song Guess": {
    en: [
      "A short clip or hummed melody of a popular song is played.",
      "Teams must guess the name of the song correctly.",
      "Faster correct guesses earn more points.",
      "Wrong answers get no points; play passes to the next team.",
      "The team with the highest score at the end wins.",
    ],
    bn: [
      "জনপ্রিয় গানের একটি ছোট ক্লিপ বা সুর বাজানো হবে।",
      "দলকে সঠিকভাবে গানের নাম বলতে হবে।",
      "দ্রুত সঠিক উত্তরে বেশি পয়েন্ট।",
      "ভুল উত্তরে কোনো পয়েন্ট নেই; পরের দলের সুযোগ।",
      "শেষে সর্বোচ্চ স্কোরের দল জিতবে।",
    ],
  },
  "Create Song/Poem": {
    en: [
      "Participants are given a topic or theme on the spot.",
      "They must compose an original song or poem within a time limit.",
      "Creativity, relevance to the theme, and presentation are judged.",
      "Performances can be solo or in teams.",
      "The most creative and expressive entry wins!",
    ],
    bn: [
      "অংশগ্রহণকারীদের ঘটনাস্থলে একটি বিষয় দেওয়া হবে।",
      "নির্দিষ্ট সময়ের মধ্যে মৌলিক গান বা কবিতা রচনা করতে হবে।",
      "সৃজনশীলতা, বিষয়ের সঙ্গে প্রাসঙ্গিকতা ও উপস্থাপনা বিচার হবে।",
      "একক বা দলগতভাবে পরিবেশন করা যাবে।",
      "সবচেয়ে সৃজনশীল ও অভিব্যক্তিপূর্ণ এন্ট্রি জিতবে!",
    ],
  },
  "Quiz": {
    en: [
      "Questions are asked from general knowledge, current affairs, and culture.",
      "Teams/individuals buzz in or raise hands to answer.",
      "Correct answers earn points; wrong answers may have negative marking.",
      "Multiple rounds with increasing difficulty.",
      "The team/individual with the most points wins.",
    ],
    bn: [
      "সাধারণ জ্ঞান, সমসাময়িক ঘটনা ও সংস্কৃতি থেকে প্রশ্ন করা হবে।",
      "দল/ব্যক্তি বাজার বা হাত তুলে উত্তর দেবে।",
      "সঠিক উত্তরে পয়েন্ট; ভুলে নেগেটিভ মার্কিং হতে পারে।",
      "ক্রমবর্ধমান কঠিন একাধিক রাউন্ড।",
      "সর্বোচ্চ পয়েন্টের দল/ব্যক্তি জিতবে।",
    ],
  },
  "Word Making": {
    en: [
      "Players are given a set of random letters.",
      "Form as many meaningful words as possible within the time limit.",
      "Longer words score more points.",
      "Only dictionary-valid words are accepted.",
      "The player/team with the highest total score wins.",
    ],
    bn: [
      "খেলোয়াড়দের কিছু এলোমেলো অক্ষর দেওয়া হবে।",
      "নির্দিষ্ট সময়ে যতটা সম্ভব অর্থপূর্ণ শব্দ তৈরি করুন।",
      "বড় শব্দে বেশি পয়েন্ট।",
      "শুধু অভিধানে থাকা শব্দ গৃহীত হবে।",
      "সর্বোচ্চ মোট স্কোরের খেলোয়াড়/দল জিতবে।",
    ],
  },
  "Online Presence": {
    en: [
      "Participants join a virtual session and engage actively.",
      "Points are awarded for participation, responses, and interaction.",
      "Activities may include trivia, discussions, or group tasks.",
      "Camera-on participation may earn bonus points.",
      "The most active participant or team wins!",
    ],
    bn: [
      "অংশগ্রহণকারীরা ভার্চুয়াল সেশনে যোগ দিয়ে সক্রিয়ভাবে অংশ নেবে।",
      "অংশগ্রহণ, প্রতিক্রিয়া ও মিথস্ক্রিয়ার জন্য পয়েন্ট।",
      "কার্যক্রমে ট্রিভিয়া, আলোচনা বা দলগত কাজ থাকতে পারে।",
      "ক্যামেরা চালু রাখলে বোনাস পয়েন্ট পেতে পারেন।",
      "সবচেয়ে সক্রিয় অংশগ্রহণকারী বা দল জিতবে!",
    ],
  },
  "Such Suto": {
    en: [
      "A traditional needle-and-thread game testing speed and precision.",
      "Participants must thread a needle as quickly as possible.",
      "Multiple rounds with increasingly smaller needle eyes.",
      "Steady hands and sharp eyes are essential!",
      "The fastest participant to complete all rounds wins.",
    ],
    bn: [
      "সুচে সুতো পরানোর গতি ও নির্ভুলতা পরীক্ষার খেলা।",
      "যত দ্রুত সম্ভব সুচে সুতো পরাতে হবে।",
      "ক্রমশ ছোট সুচের ছিদ্রে একাধিক রাউন্ড।",
      "স্থির হাত ও তীক্ষ্ণ চোখ অপরিহার্য!",
      "সব রাউন্ড দ্রুততম সময়ে শেষ করা ব্যক্তি জিতবে।",
    ],
  },
  "TAT": {
    en: [
      "A picture or image is shown to the participants.",
      "They must create a story or description based on the image.",
      "Creativity, coherence, and expression are judged.",
      "A time limit is given for each response.",
      "The most imaginative and well-told story wins!",
    ],
    bn: [
      "অংশগ্রহণকারীদের একটি ছবি দেখানো হবে।",
      "ছবির উপর ভিত্তি করে গল্প বা বর্ণনা তৈরি করতে হবে।",
      "সৃজনশীলতা, সামঞ্জস্য ও অভিব্যক্তি বিচার হবে।",
      "প্রতিটি উত্তরের জন্য নির্দিষ্ট সময়সীমা।",
      "সবচেয়ে কল্পনাপ্রসূত ও সুন্দর গল্প জিতবে!",
    ],
  },
  "Yes No Guess": {
    en: [
      "One player thinks of something (person, place, or thing).",
      "Others can only ask yes/no questions to guess what it is.",
      "A limited number of questions are allowed.",
      "The guesser who identifies it with the fewest questions wins.",
      "Great for sharpening deduction and logical thinking!",
    ],
    bn: [
      "একজন খেলোয়াড় কিছু ভাববে (ব্যক্তি, স্থান বা বস্তু)।",
      "অন্যরা শুধু হ্যাঁ/না প্রশ্ন করে অনুমান করবে।",
      "সীমিত সংখ্যক প্রশ্ন করার সুযোগ।",
      "সবচেয়ে কম প্রশ্নে সঠিক অনুমানকারী জিতবে।",
      "যুক্তি ও অনুমান ক্ষমতা ধারালো করার দারুণ খেলা!",
    ],
  },
  "Song Quiz": {
    en: [
      "A portion of a song is played or sung by the host.",
      "Teams must identify the song title and/or singer.",
      "Buzzing in first with the correct answer earns full points.",
      "Hints may be given after a timeout for partial points.",
      "The team with the highest score wins the quiz!",
    ],
    bn: [
      "গানের একটি অংশ বাজানো বা গাওয়া হবে।",
      "দলকে গানের নাম এবং/অথবা শিল্পীর নাম বলতে হবে।",
      "প্রথমে সঠিক উত্তর দিলে পূর্ণ পয়েন্ট।",
      "সময় শেষে ইঙ্গিত দেওয়া হতে পারে আংশিক পয়েন্টের জন্য।",
      "সর্বোচ্চ স্কোরের দল কুইজ জিতবে!",
    ],
  },
  "Song Quiz - Individual": {
    en: [
      "Same as Song Quiz but played individually, not in teams.",
      "Each participant answers independently without discussion.",
      "Points are tracked per person across all rounds.",
      "Speed and accuracy both matter for scoring.",
      "The individual with the most points is crowned the winner!",
    ],
    bn: [
      "গান ধরো-র মতোই, তবে দলের বদলে একক প্রতিযোগিতা।",
      "প্রতিটি অংশগ্রহণকারী আলোচনা ছাড়া স্বতন্ত্রভাবে উত্তর দেবে।",
      "সব রাউন্ডে ব্যক্তিগত পয়েন্ট হিসাব করা হবে।",
      "গতি ও নির্ভুলতা দুটোই স্কোরিংয়ে গুরুত্বপূর্ণ।",
      "সর্বোচ্চ পয়েন্টের ব্যক্তি বিজয়ী হবে!",
    ],
  },
  "Gita Shloka": {
    en: [
      "Participants recite shlokas (verses) from the Bhagavad Gita.",
      "Judged on pronunciation, rhythm, and clarity.",
      "Bonus points for explaining the meaning of the shloka.",
      "Can be performed individually or as a group.",
      "The most accurate and expressive recitation wins!",
    ],
    bn: [
      "অংশগ্রহণকারীরা ভগবদ্গীতার শ্লোক আবৃত্তি করবে।",
      "উচ্চারণ, ছন্দ ও স্পষ্টতার উপর বিচার হবে।",
      "শ্লোকের অর্থ ব্যাখ্যা করলে বোনাস পয়েন্ট।",
      "একক বা দলগতভাবে পরিবেশন করা যাবে।",
      "সবচেয়ে নির্ভুল ও অভিব্যক্তিপূর্ণ আবৃত্তি জিতবে!",
    ],
  },
};
