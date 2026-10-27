import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Password hashing utilities using Node.js crypto.scryptSync
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, key] = stored.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const match = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, match);
}

// 30 Curated Puzzles (10 Easy, 10 Medium, 10 Hard)
export const SEED_PUZZLES = [
  // --- EASY MODE (Levels 1 - 10) ---
  {
    id: 1,
    category: 'easy',
    title: 'The Silent Globetrotter',
    question: 'What can travel all around the world while remaining trapped in a corner?',
    type: 'text',
    acceptedAnswers: ['stamp', 'a stamp', 'postage stamp', 'a postage stamp'],
    hints: ['You see it on letters and postcards.', 'It gets stamped before travel.', 'It sticks to the corner of an envelope.'],
    points: 100,
    enabled: true,
    order: 1
  },
  {
    id: 2,
    category: 'easy',
    title: 'The Doubling Chain',
    question: 'What number logically comes next in this sequence: 2, 4, 8, 16, 32, ___?',
    type: 'number',
    acceptedAnswers: ['64'],
    hints: ['Notice the operation between each step.', 'Each number is multiplied by two.', '32 doubled equals...?'],
    points: 100,
    enabled: true,
    order: 2
  },
  {
    id: 3,
    category: 'easy',
    title: 'The First Spark',
    question: 'You step into a freezing dark room with a single match. Inside are an oil lantern, a candle, and a fireplace. What must you light first?',
    type: 'text',
    acceptedAnswers: ['match', 'the match', 'a match'],
    hints: ['None of the room items can burn on their own.', 'Think about what is in your hand.', 'You cannot light anything without lighting the match first.'],
    points: 100,
    enabled: true,
    order: 3
  },
  {
    id: 4,
    category: 'easy',
    title: 'The Subtractive Word',
    question: 'What five-letter word has "one" left when you take two letters away?',
    type: 'text',
    acceptedAnswers: ['stone', 'alone'],
    hints: ['Look at the spelling of the word "one".', 'Remove the first two letters of a hard rock.', 'S-T-O-N-E without S-T leaves O-N-E.'],
    points: 100,
    enabled: true,
    order: 4
  },
  {
    id: 5,
    category: 'easy',
    title: 'The Grandfather Clock',
    question: 'A grandfather clock takes 6 seconds to strike 4 o\'clock. How many seconds will it take to strike 8 o\'clock?',
    type: 'number',
    acceptedAnswers: ['14', '14 seconds', '14s'],
    hints: ['Between 4 strikes, there are 3 time intervals (6 ÷ 3 = 2 seconds per interval).', 'Count the number of intervals between 8 strikes.', '8 strikes have 7 intervals: 7 × 2 seconds.'],
    points: 100,
    enabled: true,
    order: 5
  },
  {
    id: 6,
    category: 'easy',
    title: 'The Featherweight Challenge',
    question: 'What is as light as a feather, yet even the world\'s strongest athlete cannot hold it for more than 5 minutes?',
    type: 'text',
    acceptedAnswers: ['breath', 'their breath', 'his breath', 'her breath', 'a breath'],
    hints: ['You do it naturally thousands of times a day.', 'It is completely weightless air.', 'Try holding it right now!'],
    points: 100,
    enabled: true,
    order: 6
  },
  {
    id: 7,
    category: 'easy',
    title: 'The Inverted Symmetry',
    question: 'Which three-digit number composed of identical digits remains completely unchanged when rotated 180 degrees (upside down)?',
    type: 'number',
    acceptedAnswers: ['888'],
    hints: ['Digits like 1, 0, and 8 have rotational symmetry.', 'All three digits must be identical.', 'Three eights upside down are still three eights.'],
    points: 100,
    enabled: true,
    order: 7
  },
  {
    id: 8,
    category: 'easy',
    title: 'The River Crossing Choice',
    question: 'A farmer needs to cross a river with a fox, a goose, and grain. If left alone, the fox eats the goose, and the goose eats the grain. Which item must he row across FIRST?',
    type: 'text',
    acceptedAnswers: ['goose', 'the goose'],
    hints: ['Leaving the fox with grain is completely safe.', 'Neither the fox eats grain, nor grain eats fox.', 'Take the animal that eats grain and is eaten by the fox!'],
    points: 100,
    enabled: true,
    order: 8
  },
  {
    id: 9,
    category: 'easy',
    title: 'The Calendar Observation',
    question: 'Some months have 31 days; others have 30 days. How many months in a year have 28 days?',
    type: 'number',
    acceptedAnswers: ['12', 'all 12', 'all of them'],
    hints: ['Read carefully: having 28 days does not mean ONLY 28 days.', 'Does March have 28 days? Yes, and three more!', 'Every single month has at least 28 days.'],
    points: 100,
    enabled: true,
    order: 9
  },
  {
    id: 10,
    category: 'easy',
    title: 'The Counting Proverb',
    question: 'If two is company, and three is a crowd, what are four and five?',
    type: 'number',
    acceptedAnswers: ['9', 'nine'],
    hints: ['Don\'t think in idioms; think in basic arithmetic!', 'What is the sum of four and five?', '4 + 5 = ?'],
    points: 100,
    enabled: true,
    order: 10
  },

  // --- MEDIUM MODE (Levels 11 - 20) ---
  {
    id: 11,
    category: 'medium',
    title: 'The Word Count Cipher',
    question: 'In a secret logic cipher: 1 = 3, 2 = 3, 3 = 5, 4 = 4, 5 = 4, 6 = 3. What does 7 equal?',
    type: 'number',
    acceptedAnswers: ['5', 'five'],
    hints: ['Spell out the numbers as English words.', 'ONE has 3 letters. TWO has 3 letters. THREE has 5 letters.', 'How many letters are in the word "SEVEN"?'],
    points: 150,
    enabled: true,
    order: 11
  },
  {
    id: 12,
    category: 'medium',
    title: 'The Poison Bottle Protocol',
    question: 'A royal cellar has 8 wine bottles, exactly one of which is poisoned. A chemical test strip takes 24 hours to change color. What is the MINIMUM number of test strips needed to identify the exact poisoned bottle in 24 hours?',
    type: 'number',
    acceptedAnswers: ['3', 'three'],
    hints: ['Think about binary numbering representation.', 'Each test strip has 2 states: color change or no change.', '2 to the power of 3 equals 8.'],
    points: 150,
    enabled: true,
    order: 12
  },
  {
    id: 13,
    category: 'medium',
    title: 'The Cardinal Initial Sequence',
    question: 'What is the next letter in this sequence: O, T, T, F, F, S, S, E, ___?',
    type: 'text',
    acceptedAnswers: ['n', 'N'],
    hints: ['Read the letters aloud while counting from 1.', 'One, Two, Three, Four, Five, Six, Seven, Eight...', 'What is the first letter of "Nine"?'],
    points: 150,
    enabled: true,
    order: 13
  },
  {
    id: 14,
    category: 'medium',
    title: 'The Bookshelf Voyage',
    question: 'Volume 1 and Volume 2 stand side-by-side in order on a bookshelf. Each volume is 2 inches thick, including front and back covers of 0.25 inches each. A bookworm chews straight from the front cover of Volume 1 to the back cover of Volume 2. How many inches total did the bookworm travel?',
    type: 'number',
    acceptedAnswers: ['0.5', '0.5 inches', '1/2', 'half inch'],
    hints: ['Place two books side by side on a shelf and examine where the front cover of Vol 1 is.', 'The front cover of Volume 1 touches the back cover of Volume 2!', 'It only chewed through the two adjacent covers (0.25 + 0.25).'],
    points: 150,
    enabled: true,
    order: 14
  },
  {
    id: 15,
    category: 'medium',
    title: 'The Age Discrepancy',
    question: 'Alice is currently 12 years old. In 2 years, Alice will be twice as old as Bob was 2 years ago. How old is Bob today?',
    type: 'number',
    acceptedAnswers: ['9', 'nine'],
    hints: ['Alice in 2 years will be 14.', '14 is twice Bob\'s age from 2 years ago, meaning Bob was 7.', 'If Bob was 7 two years ago, how old is he today?'],
    points: 150,
    enabled: true,
    order: 15
  },
  {
    id: 16,
    category: 'medium',
    title: 'The Parking Bay Reversal',
    question: 'A car is parked in a row with visible spot numbers: 16, 06, 68, 88, [CAR], 98. What is the number of the parking spot under the car?',
    type: 'number',
    acceptedAnswers: ['87'],
    hints: ['The driver sees the numbers from the driver\'s seat when pulling in.', 'Turn your perspective upside down 180 degrees.', 'The sequence upside down is 86, 87, 88, 89, 90, 91.'],
    points: 150,
    enabled: true,
    order: 16
  },
  {
    id: 17,
    category: 'medium',
    title: 'The Counterfeit Gold Coin',
    question: 'You have 9 identical-looking gold coins, but one is a lighter counterfeit. What is the MINIMUM number of weighings on a two-pan balance scale guaranteed to identify the fake coin?',
    type: 'number',
    acceptedAnswers: ['2', 'two'],
    hints: ['Divide the 9 coins into 3 groups of 3 coins each.', 'Weigh group 1 vs group 2. If balanced, the fake is in group 3.', 'Weighing two coins from the suspect group of 3 isolates the fake in 1 more step.'],
    points: 150,
    enabled: true,
    order: 17
  },
  {
    id: 18,
    category: 'medium',
    title: 'The Elevator Inhabitant',
    question: 'A man lives on the 10th floor. On sunny days, he takes the elevator to the 7th floor and walks the rest. On rainy days or when others are in the elevator, he rides all the way to the 10th floor. Why does he do this?',
    type: 'text',
    acceptedAnswers: ['short', 'he is short', 'too short', 'dwarf', 'umbrella', 'he cannot reach the button', 'cannot reach'],
    hints: ['It is a physical limitation, not a fitness routine.', 'Why would an umbrella on rainy days help him?', 'He cannot reach the button for the 10th floor!'],
    points: 150,
    enabled: true,
    order: 18
  },
  {
    id: 19,
    category: 'medium',
    title: 'The Lateral Match Equality',
    question: 'In the matchstick equation "6 + 4 = 4", moving ONE matchstick transforms it into a true equation. If you move the vertical stick from the plus sign to the 6, what valid arithmetic equation results? (Format: X - Y = Z)',
    type: 'text',
    acceptedAnswers: ['8 - 4 = 4', '8-4=4'],
    hints: ['Removing the vertical stick from + leaves a minus sign -.', 'Placing that stick on 6 closes the upper right slot to form 8.', '8 minus 4 equals 4.'],
    points: 150,
    enabled: true,
    order: 19
  },
  {
    id: 20,
    category: 'medium',
    title: 'The Terra Incognita',
    question: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. I have roads, but no cars. What am I?',
    type: 'text',
    acceptedAnswers: ['map', 'a map', 'atlas', 'an atlas', 'world map'],
    hints: ['You unfold it to navigate.', 'It represents geographical territory.', 'Cartographers draw it.'],
    points: 150,
    enabled: true,
    order: 20
  },

  // --- HARD MODE (Levels 21 - 30) ---
  {
    id: 21,
    category: 'hard',
    title: 'The Zebra Puzzle Deduction',
    question: 'In the famous five-house logic puzzle: The Brit lives in the red house, the Swede keeps dogs, the Dane drinks tea, the Norwegian lives in the first house. Who owns the fish?',
    type: 'text',
    acceptedAnswers: ['german', 'the german', 'germany'],
    hints: ['Form a 5x5 grid of nationality, color, pet, beverage, and smokes.', 'The green house is to the left of the white house and its owner drinks coffee.', 'Through elimination, the German smokes Prince and keeps the fish.'],
    points: 200,
    enabled: true,
    order: 21
  },
  {
    id: 22,
    category: 'hard',
    title: 'The Non-Uniform Burning Ropes',
    question: 'You have two ropes, each taking exactly 60 minutes to burn completely, but they burn with inconsistent thickness (non-uniformly). By lighting Rope 1 at both ends and Rope 2 at one end, then lighting the other end of Rope 2 when Rope 1 burns out, what exact number of minutes can you measure?',
    type: 'number',
    acceptedAnswers: ['45', '45 minutes', '45 mins'],
    hints: ['Lighting a 60-minute rope at both ends burns it in exactly 30 minutes.', 'At 30 minutes, Rope 2 has 30 minutes of burn time remaining.', 'Lighting the second end of Rope 2 burns its remaining 30 minutes in 15 minutes: 30 + 15 = ?'],
    points: 200,
    enabled: true,
    order: 22
  },
  {
    id: 23,
    category: 'hard',
    title: 'The Monty Hall Strict Odds',
    question: 'You pick Door 1 out of 3 doors. The host, who knows what is behind each door, opens Door 3 revealing a goat. If you switch to Door 2, what is your exact mathematical probability of winning the sports car? (Express as a fraction, e.g., 2/3)',
    type: 'text',
    acceptedAnswers: ['2/3', '2 / 3', '0.67', '66.7%'],
    hints: ['Your initial choice had a 1/3 chance of being correct.', 'The remaining 2/3 probability was concentrated in the other two doors.', 'Since the host eliminates a losing door, that entire 2/3 probability shifts to the remaining closed door.'],
    points: 200,
    enabled: true,
    order: 23
  },
  {
    id: 24,
    category: 'hard',
    title: 'The Two Sand Hourglasses',
    question: 'You have only two hourglasses: a 7-minute timer and an 11-minute timer. What is the SHORTEST total elapsed time in minutes needed to measure exactly 15 minutes of boiling?',
    type: 'number',
    acceptedAnswers: ['15', '15 minutes'],
    hints: ['Start both timers simultaneously when boiling begins.', 'When the 7-minute timer runs out, 4 minutes remain in the 11-minute timer.', 'Flip the 7-minute timer at minute 11 (after 4 minutes have accumulated in it), running exactly 4 more minutes: 11 + 4 = 15.'],
    points: 200,
    enabled: true,
    order: 24
  },
  {
    id: 25,
    category: 'hard',
    title: 'The Epistemic Blue Eyes Logic',
    question: 'On an island with 100 blue-eyed and 100 brown-eyed logicians, everyone can see everyone else\'s eyes but does not know their own. A prophet announces: "I see someone with blue eyes." By induction, on which night will all 100 blue-eyed people leave together on the midnight ferry?',
    type: 'number',
    acceptedAnswers: ['100', '100th', 'the 100th night', '100th night'],
    hints: ['Consider base cases: if there was 1 blue-eyed person, they would leave on Night 1.', 'If there were 2, they would deduce it and leave on Night 2.', 'For N blue-eyed logicians, common knowledge takes N nights to resolve.'],
    points: 200,
    enabled: true,
    order: 25
  },
  {
    id: 26,
    category: 'hard',
    title: 'The Court of Knights and Knaves',
    question: 'On an island where Knights always tell the truth and Knaves always lie, Person A says: "Both of us are Knaves." Person B says nothing. What is Person A: Knight or Knave?',
    type: 'text',
    acceptedAnswers: ['knave', 'a knave'],
    hints: ['If Person A were a Knight, his statement would be true, meaning he would have to be a Knave (a contradiction).', 'Therefore Person A cannot be a Knight.', 'Since Person A is a Knave, his statement is false, which means Person B is a Knight!'],
    points: 200,
    enabled: true,
    order: 26
  },
  {
    id: 27,
    category: 'hard',
    title: 'The Exponential Chessboard Row',
    question: 'A sage asks for 1 grain of wheat on square 1, 2 grains on square 2, 4 on square 3, doubling each square. What is the TOTAL number of grains on the first 8 squares (the first complete row)?',
    type: 'number',
    acceptedAnswers: ['255'],
    hints: ['Sum = 1 + 2 + 4 + 8 + 16 + 32 + 64 + 128.', 'The sum of powers of 2 from 2^0 to 2^(n-1) equals 2^n - 1.', '2^8 - 1 = 256 - 1.'],
    points: 200,
    enabled: true,
    order: 27
  },
  {
    id: 28,
    category: 'hard',
    title: 'The Modular Dial Crypt',
    question: 'A 12-position radial dial starts pointing at 12. You rotate clockwise by 5, counter-clockwise by 8, clockwise by 11, and counter-clockwise by 4. What number does the dial point to?',
    type: 'number',
    acceptedAnswers: ['4', 'four'],
    hints: ['Calculate net movement: (+5) + (-8) + (+11) + (-4).', 'Net movement = +4 positions clockwise from 12.', '12 + 4 positions clockwise on a 12-hour clock face points to...?'],
    points: 200,
    enabled: true,
    order: 28
  },
  {
    id: 29,
    category: 'hard',
    title: 'The 100 Prisoners Light Switch',
    question: '100 prisoners are in solitary confinement. A switch room has one light bulb initially OFF. One prisoner is designated the "Counter". To ensure all 100 prisoners have visited the room, how many times must the designated Counter switch the light OFF?',
    type: 'number',
    acceptedAnswers: ['99', '99 times'],
    hints: ['Protocol: each of the other 99 prisoners turns the light ON the first time they enter and see it OFF.', 'The designated Counter turns the light OFF each time he finds it ON and adds 1 to his count.', 'When the Counter has turned it OFF 99 times, all 99 other prisoners have visited.'],
    points: 200,
    enabled: true,
    order: 29
  },
  {
    id: 30,
    category: 'hard',
    title: 'The Grandmaster Resonator',
    question: 'I speak without a voice and hear without ears. I have no physical body, but I come alive with the wind. The more you shout at me, the more clearly I return your words. What am I?',
    type: 'text',
    acceptedAnswers: ['echo', 'an echo'],
    hints: ['Sound waves bouncing off canyon walls.', 'It replicates what you say.', 'It repeats your own voice.'],
    points: 200,
    enabled: true,
    order: 30
  }
];

// Default Database Structure
const DEFAULT_DB = {
  users: [
    {
      id: 'admin-seed-id',
      fullName: 'System Administrator',
      username: 'admin',
      email: 'admin@thinkoutside.box',
      passwordHash: hashPassword('Admin@123'),
      role: 'admin',
      status: 'active',
      unlockedLevel: 30,
      totalScore: 5000,
      completedLevels: Array.from({ length: 30 }, (_, i) => i + 1),
      levelScores: {},
      createdAt: new Date().toISOString(),
      mustChangePassword: false
    }
  ],
  puzzles: SEED_PUZZLES,
  settings: {
    easyTimer: 90,
    mediumTimer: 120,
    hardTimer: 150,
    easyPoints: 100,
    mediumPoints: 150,
    hardPoints: 200,
    hintPenalty: 15,
    noHintsBonus: 25,
    speedBonus: 20,
    shuffleEasy: false,
    shuffleMedium: false,
    shuffleHard: false,
    rulesAnnouncement: 'Welcome to Think Outside the Box! Complete puzzles sequentially to unlock higher stages. Avoid hint penalties to maximize your tournament standing.'
  },
  sessions: [],
  passwordResets: []
};

// Database Instance
class DocumentDatabase {
  constructor() {
    this.data = null;
    this.lastMtime = 0;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stats = fs.statSync(DB_FILE);
        if (this.data && stats.mtimeMs <= this.lastMtime) {
          return;
        }
        this.lastMtime = stats.mtimeMs;
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.users) this.data.users = DEFAULT_DB.users;
        if (!this.data.puzzles || this.data.puzzles.length < 30) this.data.puzzles = DEFAULT_DB.puzzles;
        if (!this.data.settings) this.data.settings = DEFAULT_DB.settings;
        if (!this.data.sessions) this.data.sessions = [];
        if (!this.data.passwordResets) this.data.passwordResets = [];
      } else {
        this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
        this.save();
      }
    } catch (e) {
      console.error('Database load error, re-initializing default schema:', e);
      this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
      this.save();
    }
  }

  save() {
    try {
      const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
      if (fs.existsSync(DB_FILE)) {
        this.lastMtime = fs.statSync(DB_FILE).mtimeMs;
      }
    } catch (e) {
      console.error('Database save error:', e);
    }
  }

  // --- Collection Queries with Automatic On-Demand Sync ---
  getUsers() { this.load(); return this.data.users; }
  getUserById(id) { this.load(); return this.data.users.find(u => u.id === id); }
  getUserByUsername(username) {
    this.load();
    if (!username) return null;
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }
  getUserByEmail(email) {
    this.load();
    if (!email) return null;
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user) {
    this.load();
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id, updates) {
    this.load();
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  // --- Puzzles ---
  getPuzzles() { this.load(); return this.data.puzzles; }
  getPuzzleById(id) { this.load(); return this.data.puzzles.find(p => p.id === id); }

  updatePuzzle(id, updates) {
    this.load();
    const idx = this.data.puzzles.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.puzzles[idx] = { ...this.data.puzzles[idx], ...updates };
      this.save();
      return this.data.puzzles[idx];
    }
    return null;
  }

  addPuzzle(puzzle) {
    this.load();
    this.data.puzzles.push(puzzle);
    this.save();
    return puzzle;
  }

  deletePuzzle(id) {
    this.load();
    this.data.puzzles = this.data.puzzles.filter(p => p.id !== id);
    this.save();
  }

  // --- Settings ---
  getSettings() { this.load(); return this.data.settings; }
  updateSettings(updates) {
    this.load();
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }

  // --- Sessions ---
  createSession(userId, role) {
    this.load();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const session = { token, userId, role, expiresAt };
    this.data.sessions.push(session);
    this.save();
    return token;
  }

  getSession(token) {
    this.load();
    if (!token) return null;
    const session = this.data.sessions.find(s => s.token === token && s.expiresAt > Date.now());
    return session || null;
  }

  removeSession(token) {
    this.load();
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.save();
  }

  // --- Password Resets ---
  addPasswordReset(reset) {
    this.load();
    this.data.passwordResets.push(reset);
    this.save();
  }

  // Reset entire game (Admin action)
  resetAllGameProgress() {
    this.load();
    this.data.users.forEach(u => {
      if (u.role !== 'admin') {
        u.unlockedLevel = 1;
        u.totalScore = 0;
        u.completedLevels = [];
        u.levelScores = {};
      }
    });
    this.save();
  }
}

export const db = new DocumentDatabase();
