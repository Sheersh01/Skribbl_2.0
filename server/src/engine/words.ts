/**
 * Picks `n` distinct words from `pool`, preferring ones not used yet this game.
 * Falls back to used words if the pool runs dry.
 */
export function pickWords(pool: readonly string[], n: number, used: ReadonlySet<string>, random = Math.random): string[] {
  const unique = [...new Set(pool)];
  const fresh = shuffle(unique.filter((w) => !used.has(w)), random);
  const stale = shuffle(unique.filter((w) => used.has(w)), random);
  return [...fresh, ...stale].slice(0, n);
}

function shuffle<T>(arr: T[], random: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Original built-in English word list: concrete, drawable things and actions. */
export const EN_WORDS: string[] = [
  // animals
  'cat', 'dog', 'fish', 'bird', 'horse', 'cow', 'pig', 'sheep', 'goat', 'chicken',
  'duck', 'frog', 'snake', 'turtle', 'rabbit', 'mouse', 'elephant', 'giraffe', 'lion', 'tiger',
  'zebra', 'monkey', 'bear', 'panda', 'koala', 'kangaroo', 'penguin', 'owl', 'eagle', 'parrot',
  'flamingo', 'peacock', 'shark', 'whale', 'dolphin', 'octopus', 'jellyfish', 'crab', 'lobster', 'snail',
  'spider', 'bee', 'butterfly', 'ladybug', 'ant', 'mosquito', 'bat', 'camel', 'hippo', 'rhino',
  'crocodile', 'squirrel', 'hedgehog', 'fox', 'wolf', 'deer', 'moose', 'llama', 'sloth', 'seal',
  'unicorn', 'dragon', 'dinosaur', 'worm', 'caterpillar', 'swan', 'starfish', 'seahorse', 'raccoon', 'skunk',

  // food & drink
  'apple', 'banana', 'orange', 'lemon', 'grapes', 'strawberry', 'watermelon', 'pineapple', 'cherry', 'pear',
  'peach', 'coconut', 'carrot', 'potato', 'tomato', 'onion', 'corn', 'broccoli', 'mushroom', 'pumpkin',
  'pepper', 'cucumber', 'bread', 'cheese', 'egg', 'bacon', 'sausage', 'pizza', 'burger', 'hot dog',
  'sandwich', 'taco', 'sushi', 'noodles', 'spaghetti', 'soup', 'salad', 'popcorn', 'french fries', 'pancake',
  'waffle', 'donut', 'cookie', 'cake', 'cupcake', 'pie', 'ice cream', 'chocolate', 'candy', 'lollipop',
  'honey', 'milk', 'coffee', 'tea', 'juice', 'lemonade', 'cereal', 'pretzel', 'birthday cake', 'jelly',

  // home & everyday objects
  'house', 'door', 'window', 'roof', 'chair', 'table', 'bed', 'sofa', 'lamp', 'clock',
  'mirror', 'bathtub', 'toilet', 'shower', 'sink', 'fridge', 'oven', 'toaster', 'kettle', 'microwave',
  'fork', 'spoon', 'knife', 'plate', 'cup', 'bowl', 'bottle', 'candle', 'key', 'lock',
  'umbrella', 'backpack', 'suitcase', 'wallet', 'glasses', 'sunglasses', 'hat', 'crown', 'shoe', 'boot',
  'sock', 'shirt', 'dress', 'scarf', 'glove', 'tie', 'belt', 'ring', 'necklace', 'watch',
  'book', 'pencil', 'pen', 'scissors', 'ruler', 'paintbrush', 'envelope', 'stamp', 'calendar', 'magnet',
  'phone', 'computer', 'keyboard', 'television', 'camera', 'headphones', 'battery', 'light bulb', 'robot', 'remote',
  'broom', 'bucket', 'ladder', 'hammer', 'saw', 'screwdriver', 'toothbrush', 'comb', 'pillow', 'blanket',
  'balloon', 'gift', 'kite', 'teddy bear', 'puzzle', 'dice', 'yo-yo', 'trophy', 'medal', 'flag',

  // vehicles & transport
  'car', 'bus', 'truck', 'train', 'bicycle', 'motorcycle', 'scooter', 'skateboard', 'airplane', 'helicopter',
  'rocket', 'boat', 'sailboat', 'submarine', 'ship', 'tractor', 'ambulance', 'fire truck', 'taxi', 'hot air balloon',
  'canoe', 'tank', 'parachute', 'traffic light', 'bridge', 'tunnel', 'gas station', 'anchor', 'wheel', 'steering wheel',

  // places & buildings
  'castle', 'tower', 'lighthouse', 'pyramid', 'igloo', 'tent', 'barn', 'school', 'hospital', 'church',
  'library', 'museum', 'zoo', 'farm', 'park', 'playground', 'beach', 'island', 'desert', 'jungle',
  'forest', 'mountain', 'volcano', 'cave', 'waterfall', 'river', 'lake', 'ocean', 'city', 'skyscraper',
  'treehouse', 'windmill', 'fountain', 'swimming pool', 'stadium', 'airport', 'prison', 'haunted house', 'campfire', 'well',

  // nature & weather
  'sun', 'moon', 'star', 'cloud', 'rain', 'snow', 'rainbow', 'lightning', 'tornado', 'wind',
  'tree', 'flower', 'rose', 'sunflower', 'cactus', 'palm tree', 'leaf', 'grass', 'mushroom cloud', 'rock',
  'fire', 'ice', 'wave', 'earth', 'planet', 'comet', 'snowman', 'puddle', 'sunset', 'shooting star',

  // people, jobs & fantasy
  'baby', 'king', 'queen', 'prince', 'princess', 'pirate', 'ninja', 'wizard', 'witch', 'ghost',
  'zombie', 'vampire', 'mermaid', 'fairy', 'alien', 'astronaut', 'cowboy', 'clown', 'chef', 'doctor',
  'nurse', 'teacher', 'police officer', 'firefighter', 'farmer', 'artist', 'scientist', 'detective', 'superhero', 'knight',
  'santa', 'skeleton', 'mummy', 'giant', 'elf', 'snow angel', 'magician', 'lifeguard', 'mailman', 'pilot',

  // body
  'eye', 'ear', 'nose', 'mouth', 'tooth', 'tongue', 'hand', 'foot', 'finger', 'leg',
  'arm', 'heart', 'brain', 'bone', 'beard', 'mustache', 'hair', 'knee', 'elbow', 'muscle',

  // sports & hobbies
  'football', 'basketball', 'tennis', 'baseball', 'golf', 'bowling', 'boxing', 'karate', 'surfing', 'skiing',
  'ice skating', 'fishing', 'camping', 'chess', 'guitar', 'piano', 'drum', 'violin', 'trumpet', 'microphone',
  'painting', 'dancing', 'singing', 'gardening', 'knitting', 'yoga', 'juggling', 'swimming', 'running', 'cooking',

  // actions & situations
  'sleeping', 'crying', 'laughing', 'sneezing', 'yawning', 'jumping', 'climbing', 'flying', 'falling', 'reading',
  'writing', 'eating', 'drinking', 'thinking', 'waving', 'hugging', 'kissing', 'fighting', 'hiding', 'shopping',
  'traffic jam', 'birthday party', 'wedding', 'picnic', 'sandcastle', 'snowball fight', 'pillow fight', 'sunburn', 'nightmare', 'homework',

  // misc
  'map', 'treasure', 'coin', 'money', 'bomb', 'sword', 'shield', 'bow and arrow', 'cannon', 'telescope',
  'magnifying glass', 'compass', 'hourglass', 'mailbox', 'trash can', 'fence', 'gate', 'chimney', 'stairs', 'elevator',
  'spaceship', 'satellite', 'globe', 'piggy bank', 'snow globe', 'jack-o-lantern', 'scarecrow', 'totem pole', 'wishbone', 'boomerang',
];
