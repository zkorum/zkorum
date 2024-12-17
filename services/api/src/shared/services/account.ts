/** **** WARNING: GENERATED FROM SHARED DIRECTORY, DO NOT MOFIFY THIS FILE DIRECTLY! **** **/
import { MAX_LENGTH_USERNAME } from "../shared.js";

export function generateRandomUsername() {
  const adjectives = [
    "happy", "sad", "angry", "excited", "nervous", "brave", "calm", "curious", "eager", "fearful",
    "gentle", "graceful", "joyful", "kind", "lively", "mysterious", "polite", "proud", "silly", "thoughtful",
    "witty", "zealous", "adventurous", "affectionate", "ambitious", "amused", "annoyed", "anxious", "arrogant", "ashamed",
    "astonished", "attentive", "bored", "bossy", "careful", "careless", "charming", "cheerful", "clumsy", "confident",
    "confused", "considerate", "content", "courageous", "creative", "critical", "cruel", "curious", "daring", "decisive",
    "delighted", "determined", "diligent", "disappointed", "disgusted", "distracted", "eager", "efficient", "elated", "embarrassed",
    "energetic", "enthusiastic", "envious", "exhausted", "fascinated", "fearless", "fierce", "frustrated", "generous", "gentle",
    "grateful", "greedy", "grumpy", "guilty", "happy", "helpful", "honest", "hopeful", "humble", "humorous",
    "impatient", "independent", "indifferent", "inquisitive", "inspired", "intelligent", "jealous", "jovial", "joyful", "kindhearted",
    "lazy", "lonely", "loving", "loyal", "mischievous", "motivated", "naughty", "neat", "nervous", "observant",
    "optimistic", "organized", "outgoing", "passionate", "patient", "peaceful", "perceptive", "persistent", "pessimistic", "playful",
    "polite", "practical", "proud", "punctual", "quiet", "reliable", "resourceful", "respectful", "responsible", "sarcastic",
    "satisfied", "sensitive", "serious", "shy", "sincere", "sociable", "spontaneous", "stubborn", "sympathetic", "talented",
    "thoughtful", "tolerant", "trustworthy", "understanding", "unpredictable", "versatile", "vigilant", "warmhearted", "witty", "zealous"
  ];

  const colors = ["Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Brown", "Black", "White", "Gray",
    "Cyan", "Magenta", "Maroon", "Olive", "Lime", "Teal", "Navy", "Coral", "Turquoise", "Lavender", "Beige", "Mint",
    "Peach", "Gold", "Silver", "Bronze", "Ivory", "Charcoal", "Indigo", "Violet", "Crimson", "Scarlet", "Emerald",
    "Sapphire", "Amber", "Ruby", "Topaz", "Aquamarine", "Periwinkle", "Fuchsia", "Plum", "Mauve", "Salmon", "Khaki",
    "Mustard", "Tangerine", "Azure", "Cerulean", "Chartreuse", "Burgundy", "Cobalt", "Copper", "Eggplant", "ForestGreen",
    "Honeydew", "Jade", "Lilac", "Mahogany", "Moss", "Ochre", "Papaya", "Pear", "Pine", "Raspberry", "Rose", "Sand",
    "Seafoam", "Slate", "Sunflower", "Tawny", "Thistle", "Umber", "Vanilla", "Wheat", "Wine", "Zaffre", "Amethyst",
    "Blush", "Carmine", "Denim", "Ecru", "Fern", "Ginger", "Hazel", "Ivory", "Jasmine", "Lemon", "Mango", "Nectarine",
    "Opal", "Quartz", "Raven", "Saffron", "Tangerine", "Ultramarine", "Verdigris", "Wisteria", "Xanadu", "YellowGreen"]

  const animals = [
    "Lion", "Tiger", "Elephant", "Giraffe", "Zebra", "Kangaroo", "Panda", "Koala", "Penguin", "Dolphin",
    "Whale", "Shark", "Octopus", "Jellyfish", "Starfish", "Seahorse", "Turtle", "Crocodile", "Alligator", "Snake",
    "Lizard", "Frog", "Toad", "Rabbit", "Hare", "Squirrel", "Chipmunk", "Beaver", "Otter", "Raccoon",
    "Fox", "Wolf", "Bear", "Deer", "Moose", "Elk", "Bison", "Buffalo", "Horse", "Donkey",
    "Camel", "Llama", "Alpaca", "Goat", "Sheep", "Cow", "Pig", "Chicken", "Duck", "Goose",
    "Turkey", "Peacock", "Parrot", "Sparrow", "Robin", "Eagle", "Hawk", "Falcon", "Owl", "Bat",
    "Butterfly", "Bee", "Ant", "Spider", "Scorpion", "Crab", "Lobster", "Shrimp", "Clam", "Oyster",
    "Snail", "Slug", "Worm", "Moth", "Dragonfly", "Grasshopper", "Cricket", "Beetle", "Ladybug", "Firefly",
    "Caterpillar", "Centipede", "Millipede", "Mole", "Hedgehog", "Porcupine", "Armadillo", "Skunk", "Badger", "Weasel",
    "Ferret", "Mongoose", "Meerkat", "Hyena", "Jackal", "Cheetah", "Leopard", "Jaguar", "Cougar", "Lynx"
  ];

  const getRandomWord = (wordList: string[]) => {
    return wordList[Math.floor(Math.random() * wordList.length)].toLowerCase();
  };

  const generateNumberString = (length: number) => {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    } return result;
  }

  let username = "";
  let foundUsername = false;
  for (let i = 0; i < 10000; i++) {
    const usernamePrefix = getRandomWord(adjectives) + "_" + getRandomWord(colors) + "_" + getRandomWord(animals) + "_";
    if (usernamePrefix.length < MAX_LENGTH_USERNAME - 1) {

      username = usernamePrefix;

      const numPaddingDigits = MAX_LENGTH_USERNAME - usernamePrefix.length;
      username += generateNumberString(numPaddingDigits);

      foundUsername = true;
      break;
    }
  }

  if (!foundUsername) {
    throw new Error("Failed to generate username");
  }

  return username;
}