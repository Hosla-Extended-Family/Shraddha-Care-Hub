// Game data with difficulty levels
export interface GameRound {
  id: number;
  difficulty: "easy" | "medium" | "hard";
  image: string;
  correctAnswer: string;
  options: string[];
  timeLimit: number; // in seconds
  points: number;
  category: string;
}

// Helper to create rounds
const createRound = (
  id: number,
  difficulty: "easy" | "medium" | "hard",
  image: string,
  correctAnswer: string,
  options: string[],
  category: string
): GameRound => ({
  id,
  difficulty,
  image,
  correctAnswer,
  options,
  timeLimit: difficulty === "easy" ? 15 : difficulty === "medium" ? 12 : 10,
  points: difficulty === "easy" ? 10 : difficulty === "medium" ? 20 : 25,
  category,
});

// ============ FRUITS & FOODS ============

  const fruitsFoodsSet1: GameRound[] = [
  createRound(1, "easy", "🍎", "Apple", ["Apple", "Orange", "Banana", "Mango"], "Fruits"),
  createRound(2, "medium", "🥭", "Mango", ["Papaya", "Mango", "Peach", "Apricot"], "Fruits"),
  createRound(3, "medium", "🍇", "Grapes", ["Berries", "Grapes", "Olives", "Cherries"], "Fruits"),
  createRound(4, "hard", "🥝", "Kiwi", ["Lime", "Guava", "Kiwi", "Gooseberry"], "Fruits"),
  createRound(5, "hard", "🫐", "Blueberry", ["Blackberry", "Blueberry", "Mulberry", "Elderberry"], "Fruits"),
];

const fruitsFoodsSet2: GameRound[] = [
  createRound(1, "easy", "🍌", "Banana", ["Banana", "Plantain", "Mango", "Papaya"], "Fruits"),
  createRound(2, "medium", "🍊", "Orange", ["Tangerine", "Orange", "Grapefruit", "Clementine"], "Fruits"),
  createRound(3, "medium", "🍓", "Strawberry", ["Strawberry", "Raspberry", "Cherry", "Cranberry"], "Fruits"),
  createRound(4, "hard", "🥥", "Coconut", ["Coconut", "Lychee", "Rambutan", "Longan"], "Fruits"),
  createRound(5, "hard", "🍑", "Peach", ["Apricot", "Nectarine", "Peach", "Plum"], "Fruits"),
];

const indianFoodSet: GameRound[] = [
  createRound(1, "easy", "🍚", "Rice", ["Rice", "Wheat", "Flour", "Oats"], "Indian Food"),
  createRound(2, "medium", "https://images.unsplash.com/photo-1601387434127-20979856e76e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "Roti", ["Naan", "Roti", "Paratha", "Puri"], "Indian Food"),
  createRound(3, "medium", "🍛", "Curry", ["Soup", "Curry", "Stew", "Gravy"], "Indian Food"),
  createRound(4, "hard", "https://images.unsplash.com/photo-1730191843435-073792ba22bc?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "Vada", ["Pakora", "Samosa", "Vada", "Bhaji"], "Indian Food"),
  createRound(5, "hard", "https://images.unsplash.com/photo-1697155406055-2db32d47ca07?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "Biryani", ["Pulao", "Biryani", "Khichdi", "Tehri"], "Indian Food"),
];

// ============ ANIMALS ============
const animalsSet1: GameRound[] = [
  createRound(1, "easy", "🐕", "Dog", ["Cat", "Dog", "Wolf", "Fox"], "Animals"),
  createRound(2, "medium", "🦁", "Lion", ["Tiger", "Lion", "Leopard", "Cheetah"], "Animals"),
  createRound(3, "medium", "🐘", "Elephant", ["Elephant", "Mammoth", "Rhino", "Hippo"], "Animals"),
  createRound(4, "hard", "🦊", "Fox", ["Wolf", "Coyote", "Fox", "Jackal"], "Animals"),
  createRound(5, "hard", "🦌", "Deer", ["Elk", "Moose", "Deer", "Antelope"], "Animals"),
];

const animalsSet2: GameRound[] = [
  createRound(1, "easy", "🐱", "Cat", ["Cat", "Kitten", "Lion", "Tiger"], "Animals"),
  createRound(2, "medium", "🐻", "Bear", ["Bear", "Panda", "Koala", "Sloth"], "Animals"),
  createRound(3, "medium", "🦒", "Giraffe", ["Giraffe", "Zebra", "Okapi", "Antelope"], "Animals"),
  createRound(4, "hard", "🦏", "Rhinoceros", ["Hippo", "Rhino", "Rhinoceros", "Buffalo"], "Animals"),
  createRound(5, "hard", "🦛", "Hippopotamus", ["Hippo", "Hippopotamus", "Rhino", "Elephant"], "Animals"),
];

const birdsSet: GameRound[] = [
  createRound(1, "easy", "🐦", "Bird", ["Bird", "Sparrow", "Finch", "Robin"], "Birds"),
  createRound(2, "medium", "🦅", "Eagle", ["Hawk", "Falcon", "Eagle", "Vulture"], "Birds"),
  createRound(3, "medium", "https://images.unsplash.com/photo-1606383070180-aa3c0a87cd28?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "Parrot", ["Macaw", "Parrot", "Cockatoo", "Parakeet"], "Birds"),
  createRound(4, "hard", "🦉", "Owl", ["Crow", "Raven", "Owl", "Hawk"], "Birds"),
  createRound(5, "hard", "🦚", "Peacock", ["Pheasant", "Peacock", "Turkey", "Quail"], "Birds"),
];

const seaCreaturesSet: GameRound[] = [
  createRound(1, "easy", "🐟", "Fish", ["Fish", "Salmon", "Tuna", "Cod"], "Sea Life"),
  createRound(2, "medium", "🐙", "Octopus", ["Squid", "Octopus", "Jellyfish", "Cuttlefish"], "Sea Life"),
  createRound(3, "medium", "🦈", "Shark", ["Shark", "Dolphin", "Whale", "Orca"], "Sea Life"),
  createRound(4, "hard", "🦑", "Squid", ["Octopus", "Squid", "Cuttlefish", "Nautilus"], "Sea Life"),
  createRound(5, "hard", "🦞", "Lobster", ["Crab", "Lobster", "Crawfish", "Shrimp"], "Sea Life"),
];

// ============ VEHICLES ============
const vehiclesSet1: GameRound[] = [
  createRound(1, "easy", "🚗", "Car", ["Car", "Van", "Bus", "Truck"], "Vehicles"),
  createRound(2, "medium", "🚌", "Bus", ["Car", "Bus", "Van", "Truck"], "Vehicles"),
  createRound(3, "medium", "✈️", "Airplane", ["Airplane", "Helicopter", "Jet", "Drone"], "Vehicles"),
  createRound(4, "hard", "🚢", "Cruise", ["Boat", "Ship", "Cruise", "Yacht"], "Vehicles"),
  createRound(5, "hard", "🚁", "Helicopter", ["Airplane", "Drone", "Helicopter", "Jet"], "Vehicles"),
]; 

const vehiclesSet2: GameRound[] = [
  createRound(1, "easy", "🚲", "Bicycle", ["Bicycle", "Motorcycle", "Scooter", "Tricycle"], "Vehicles"),
  createRound(2, "medium", "🏍️", "Motorcycle", ["Scooter", "Motorcycle", "Moped", "Bike"], "Vehicles"),
  createRound(3, "medium", "🚂", "Train", ["Metro", "Train", "Tram", "Subway"], "Vehicles"),
  createRound(4, "hard", "🚀", "Rocket", ["Missile", "Rocket", "Shuttle", "Satellite"], "Vehicles"),
  createRound(5, "hard", "https://plus.unsplash.com/premium_vector-1717732789864-1a6115f6d78a?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "Sailboat", ["Yacht", "Sailboat", "Catamaran", "Dinghy"], "Vehicles"),
];

// ============ BUILDINGS & PLACES ============
const buildingsSet: GameRound[] = [
  createRound(1, "easy", "🏠", "House", ["House", "Building", "Hut", "Tent"], "Buildings"),
  createRound(2, "medium", "🏥", "Hospital", ["Clinic", "Hospital", "Pharmacy", "Lab"], "Buildings"),
  createRound(3, "medium", "🏫", "School", ["College", "School", "University", "Academy"], "Buildings"),
  createRound(4, "hard", "https://images.unsplash.com/photo-1554907984-15263bfd63bd?auto=format&fit=crop&w=800&q=80", "Museum", ["Library", "Museum", "Gallery", "Palace"], "Buildings"),
  createRound(5, "hard", "🏰", "Castle", ["Fort", "Castle", "Palace", "Citadel"], "Buildings"),
];

  const indianMonumentsSet: GameRound[] = [
  createRound(1, "easy", "🕌", "Mosque", ["Temple", "Mosque", "Church", "Gurudwara"], "Indian Monuments"),
  createRound(2, "medium", "🛕", "Temple", ["Shrine", "Temple", "Pagoda", "Chapel"], "Indian Monuments"),
  createRound(3, "medium", "🏯", "Fort", ["Castle", "Fort", "Palace", "Citadel"], "Indian Monuments"),
  createRound(4, "hard", "⛩️", "Gateway", ["Arch", "Gateway", "Portal", "Entrance"], "Indian Monuments"),
  createRound(5, "hard", "🗼", "Tower", ["Minaret", "Tower", "Spire", "Pillar"], "Indian Monuments"),
];

// ============ NATURE ============
const natureSet: GameRound[] = [
  createRound(1, "easy", "🌞", "Sun", ["Sun", "Moon", "Star", "Planet"], "Nature"),
  createRound(2, "medium", "🌻", "Sunflower", ["Rose", "Sunflower", "Daisy", "Tulip"], "Nature"),
  createRound(3, "medium", "🌲", "Pine Tree", ["Oak", "Pine Tree", "Maple", "Birch"], "Nature"),
  createRound(4, "hard", "🌸", "Cherry Blossom", ["Lotus", "Cherry Blossom", "Hibiscus", "Jasmine"], "Nature"),
  createRound(5, "hard", "🍄", "Mushroom", ["Toadstool", "Mushroom", "Fungus", "Truffle"], "Nature"),
];

const weatherSet: GameRound[] = [
  createRound(1, "easy", "☀️", "Sunny", ["Sunny", "Bright", "Clear", "Hot"], "Weather"),
  createRound(2, "medium", "🌧️", "Rainy", ["Stormy", "Rainy", "Drizzly", "Wet"], "Weather"),
  createRound(3, "medium", "❄️", "Snowy", ["Icy", "Snowy", "Frosty", "Cold"], "Weather"),
  createRound(4, "hard", "🌪️", "Tornado", ["Cyclone", "Tornado", "Hurricane", "Typhoon"], "Weather"),
  createRound(5, "hard", "🌈", "Rainbow", ["Arc", "Rainbow", "Spectrum", "Prism"], "Weather"),
];

// ============ HOUSEHOLD ITEMS ============
const householdSet1: GameRound[] = [
  createRound(1, "easy", "🪑", "Chair", ["Chair", "Stool", "Bench", "Seat"], "Household"),
  createRound(2, "medium", "🛋️", "Sofa", ["Couch", "Sofa", "Divan", "Settee"], "Household"),
  createRound(3, "medium", "🪞", "Mirror", ["Glass", "Mirror", "Reflection", "Window"], "Household"),
  createRound(4, "hard", "🧹", "Broom", ["Brush", "Broom", "Mop", "Duster"], "Household"),
  createRound(5, "hard", "🪔", "Diya", ["Candle", "Diya", "Lamp", "Lantern"], "Household"),
];

const householdSet2: GameRound[] = [
  createRound(1, "easy", "🛏️", "Bed", ["Bed", "Cot", "Mattress", "Bunk"], "Household"),
  createRound(2, "medium", "🚿", "Shower", ["Bath", "Shower", "Faucet", "Tap"], "Household"),
  createRound(3, "medium", "📺", "Television", ["TV", "Television", "Monitor", "Screen"], "Household"),
  createRound(4, "hard", "🧊", "Ice Cube", ["Crystal", "Ice Cube", "Glacier", "Frost"], "Household"),
  createRound(5, "hard", "🪭", "Fan", ["Fan", "Blower", "Cooler", "Ventilator"], "Household"),
];

// ============ MUSICAL INSTRUMENTS ============
const musicSet: GameRound[] = [
  createRound(1, "easy", "🎸", "Guitar", ["Guitar", "Ukulele", "Bass", "Banjo"], "Music"),
  createRound(2, "medium", "🎹", "Piano", ["Piano", "Keyboard", "Organ", "Synthesizer"], "Music"),
  createRound(3, "medium", "🎺", "Trumpet", ["Horn", "Trumpet", "Trombone", "Bugle"], "Music"),
  createRound(4, "hard", "🎻", "Violin", ["Guitar", "Cello", "Violin", "Viola"], "Music"),
  createRound(5, "hard", "https://images.unsplash.com/photo-1597235506549-5392d2b7559a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "Tabla", ["Drum", "Tabla", "Dholak", "Mridangam"], "Music"),
];

// ============ SPORTS ============
const sportsSet: GameRound[] = [
  createRound(1, "easy", "⚽", "Football", ["Football", "Soccer", "Rugby", "Handball"], "Sports"),
  createRound(2, "medium", "🏏", "Cricket", ["Baseball", "Cricket", "Hockey", "Golf"], "Sports"),
  createRound(3, "medium", "🎾", "Tennis", ["Badminton", "Tennis", "Squash", "Racquetball"], "Sports"),
  createRound(4, "hard", "🏸", "Badminton", ["Tennis", "Badminton", "Squash", "Pickleball"], "Sports"),
  createRound(5, "hard", "🤿", "Diving", ["Swimming", "Diving", "Snorkeling", "Surfing"], "Sports"),
];

// ============ PROFESSIONS ============
const professionsSet: GameRound[] = [
  createRound(1, "easy", "👨‍⚕️", "Doctor", ["Doctor", "Nurse", "Surgeon", "Medic"], "Professions"),
  createRound(2, "medium", "👨‍🏫", "Teacher", ["Professor", "Teacher", "Instructor", "Tutor"], "Professions"),
  createRound(3, "medium", "👨‍🍳", "Chef", ["Cook", "Chef", "Baker", "Caterer"], "Professions"),
  createRound(4, "hard", "👨‍🔬", "Scientist", ["Chemist", "Scientist", "Researcher", "Physicist"], "Professions"),
  createRound(5, "hard", "👨‍🎨", "Artist", ["Painter", "Artist", "Sculptor", "Designer"], "Professions"),
];

// ============ EMOTIONS & EXPRESSIONS ============
const emotionsSet: GameRound[] = [
  createRound(1, "easy", "😊", "Happy", ["Happy", "Glad", "Joyful", "Pleased"], "Emotions"),
  createRound(2, "medium", "😢", "Sad", ["Upset", "Sad", "Unhappy", "Gloomy"], "Emotions"),
  createRound(3, "medium", "😴", "Sleepy", ["Tired", "Sleepy", "Drowsy", "Exhausted"], "Emotions"),
  createRound(4, "hard", "🤔", "Thinking", ["Pondering", "Thinking", "Wondering", "Contemplating"], "Emotions"),
  createRound(5, "hard", "😤", "Frustrated", ["Angry", "Frustrated", "Annoyed", "Irritated"], "Emotions"),
];

// ============ CELEBRATIONS ============
const celebrationsSet: GameRound[] = [
  createRound(1, "easy", "🎂", "Birthday Cake", ["Cake", "Birthday Cake", "Pastry", "Dessert"], "Celebrations"),
  createRound(2, "medium", "🎁", "Gift", ["Present", "Gift", "Package", "Parcel"], "Celebrations"),
  createRound(3, "medium", "🎆", "Fireworks", ["Sparklers", "Fireworks", "Crackers", "Rockets"], "Celebrations"),
  createRound(4, "hard", "🪅", "Piñata", ["Decoration", "Piñata", "Ornament", "Toy"], "Celebrations"),
  createRound(5, "hard", "🎊", "Confetti", ["Streamers", "Confetti", "Ribbons", "Tinsel"], "Celebrations"),
];

// ============ TOOLS ============
const toolsSet: GameRound[] = [
  createRound(1, "easy", "🔨", "Hammer", ["Hammer", "Mallet", "Gavel", "Club"], "Tools"),
  createRound(2, "medium", "🪛", "Screwdriver", ["Wrench", "Screwdriver", "Drill", "Pliers"], "Tools"),
  createRound(3, "medium", "✂️", "Scissors", ["Shears", "Scissors", "Clippers", "Cutters"], "Tools"),
  createRound(4, "hard", "🔧", "Wrench", ["Spanner", "Wrench", "Pliers", "Clamp"], "Tools"),
  createRound(5, "hard", "⚙️", "Gear", ["Cog", "Gear", "Wheel", "Sprocket"], "Tools"),
]; 

// All game sets combined
export const allGameSets: GameRound[][] = [
  fruitsFoodsSet1,
  fruitsFoodsSet2,
  indianFoodSet,
  animalsSet1,
  animalsSet2,
  birdsSet,
  seaCreaturesSet,
  vehiclesSet1,
  vehiclesSet2,
  buildingsSet,
  indianMonumentsSet,
  natureSet,
  weatherSet,
  householdSet1,
  householdSet2,
  musicSet,
  sportsSet,
  professionsSet,
  emotionsSet,
  celebrationsSet,
  toolsSet,
];

// Get a random game set
export const getRandomGameSet = (): GameRound[] => {
  const randomIndex = Math.floor(Math.random() * allGameSets.length);
  return allGameSets[randomIndex];
};

// Get category info for display
export const getCategoryInfo = (rounds: GameRound[]): string => {
  if (rounds.length === 0) return "Mixed";
  return rounds[0].category;
};
