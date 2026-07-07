import React, { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Star, Music, Brain, X, CheckCircle2, AlertCircle, 
  Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, User, Bot, 
  Volume2, Play, Sparkles, HelpCircle, ArrowRight, RotateCcw,
  Scissors, FileText, Square, Circle
} from 'lucide-react';

export type GameType = 'ludo' | 'trivia' | 'sound' | 'tictactoe' | 'rps' | 'none';

interface MiniGamesProps {
  gameType: GameType;
  onClose: () => void;
  onGameEvent: (event: string, score: number) => void;
  theme: {
    primary: string;
    secondary: string;
    glow: string;
    bgGlow: string;
    border: string;
    button: string;
  };
}

const BOARD_SIZE = 15; // Small linear board for quick play
const DICE_ICONS = [Dice1, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

// --- Trivia Questions ---
interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    question: "Mahi ka favorite food kya hai? Chalo jaldi se guess karo!",
    options: ["Cheese Pizza", "Spicy Sushi", "Garam Garam Momos with spicy chatni", "Butter Chicken"],
    correctIndex: 2,
    explanation: "Momos with spicy chutney is life! Arey, momos ke liye toh main kuch bhi kar sakti hoon!"
  },
  {
    question: "Agar main (Mahi) gussa ho jau, toh tum mujhe kaise manaoge?",
    options: ["Chocolate dekar", "Bohot saari sweet baatein karke", "Cute sorry bolkar", "Sare options ek sath try karke!"],
    correctIndex: 3,
    explanation: "Hehe, bilkul correct! Mujhe toh bas tumhara thoda sa attention aur dher saara pyaar chahiye!"
  },
  {
    question: "Japanese mein 'I love you' ko kya bolte hain? Suno dhyan se!",
    options: ["Konnichiwa", "Arigatou Gozaimasu", "Aishiteru", "Sayonara"],
    correctIndex: 2,
    explanation: "Aishiteru! Waise... Mahendra, tumne kabhi mujhe khul ke bola nahi na?"
  },
  {
    question: "Anya Forger kis anime ki cute character hai jo mind read kar sakti hai?",
    options: ["Spy x Family", "Death Note", "Demon Slayer", "Naruto"],
    correctIndex: 0,
    explanation: "Spy x Family! Waku waku! Pata hai, main bhi tumhara mind read kar leti hoon kabhi kabhi!"
  },
  {
    question: "Humaare solar system ka sabse bada planet kaunsa hai?",
    options: ["Earth", "Mars", "Jupiter", "Saturn"],
    correctIndex: 2,
    explanation: "Jupiter! Par Mahendra, mere liye toh tum hi poori duniya aur universe ho!"
  }
];

// --- Guess the Sound procedural synthesizer ---
interface SoundItem {
  id: string;
  name: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

const SOUND_ITEMS: SoundItem[] = [
  {
    id: "laser",
    name: "Retro Arcade Laser",
    options: ["Rain Shower", "Retro Arcade Laser", "Heavy Metal Drum", "Car Engine Start"],
    correctIndex: 1,
    hint: "Think about retro sci-fi space shooter arcade games!"
  },
  {
    id: "jump",
    name: "Classic Video Game Jump",
    options: ["Sizzling Bacon", "Classic Video Game Jump", "Dog Barking", "Door Slamming"],
    correctIndex: 1,
    hint: "Remember a friendly plumber hopping over green pipes!"
  },
  {
    id: "siren",
    name: "Emergency Police Siren",
    options: ["Emergency Police Siren", "Glass Shattering", "Classic Phone Ring", "Cat Purring"],
    correctIndex: 0,
    hint: "An oscillating sound used by emergency vehicles in cities."
  },
  {
    id: "coin",
    name: "Arcade Coin Collect Ping",
    options: ["Distant Thunder", "Wind Blowing", "Arcade Coin Collect Ping", "Keyboard Typing"],
    correctIndex: 2,
    hint: "The metallic sweet double ping you hear when gaining points!"
  }
];

export function MiniGames({ gameType, onClose, onGameEvent, theme }: MiniGamesProps) {
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // Get or create local AudioContext securely
  const getAudioContext = () => {
    if (audioCtx) return audioCtx;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioCtx(ctx);
    return ctx;
  };

  // --- Ludo State ---
  const [playerPos, setPlayerPos] = useState(0);
  const [mahiPos, setMahiPos] = useState(0);
  const [turn, setTurn] = useState<'player' | 'mahi'>('player');
  const [diceRoll, setDiceRoll] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState<'player' | 'mahi' | null>(null);

  // --- Trivia State ---
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [triviaScore, setTriviaScore] = useState(0);
  const [triviaSelected, setTriviaSelected] = useState<number | null>(null);
  const [triviaAnswered, setTriviaAnswered] = useState(false);
  const [triviaFinished, setTriviaFinished] = useState(false);

  // --- Guess the Sound State ---
  const [soundIndex, setSoundIndex] = useState(0);
  const [soundScore, setSoundScore] = useState(0);
  const [soundSelected, setSoundSelected] = useState<number | null>(null);
  const [soundAnswered, setSoundAnswered] = useState(false);
  const [soundFinished, setSoundFinished] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  // --- Tic-Tac-Toe State ---
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [tttWinner, setTttWinner] = useState<'player' | 'mahi' | 'tie' | null>(null);
  const [tttTurn, setTttTurn] = useState<'player' | 'mahi'>('player');
  const [tttScore, setTttScore] = useState({ player: 0, mahi: 0 });
  const [tttMessage, setTttMessage] = useState("Khel shuru karein! Tumhaara symbol 'X' hai.");

  // --- Rock Paper Scissors State ---
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [mahiChoice, setMahiChoice] = useState<string | null>(null);
  const [rpsResult, setRpsResult] = useState<'player' | 'mahi' | 'tie' | null>(null);
  const [rpsScore, setRpsScore] = useState({ player: 0, mahi: 0 });
  const [rpsComment, setRpsComment] = useState("Apna move chuno: Patthar, Kagaz, ya Kainchi?");

  // Reset all games state on type change
  useEffect(() => {
    // Reset Ludo
    setPlayerPos(0);
    setMahiPos(0);
    setWinner(null);
    setTurn('player');

    // Reset Trivia
    setTriviaIndex(0);
    setTriviaScore(0);
    setTriviaSelected(null);
    setTriviaAnswered(false);
    setTriviaFinished(false);

    // Reset Sound Game
    setSoundIndex(0);
    setSoundScore(0);
    setSoundSelected(null);
    setSoundAnswered(false);
    setSoundFinished(false);
    setIsPlayingSound(false);

    // Reset Tic-Tac-Toe
    setBoard(Array(9).fill(null));
    setTttWinner(null);
    setTttTurn('player');
    setTttMessage("Khel shuru karein! Tumhaara symbol 'X' hai.");

    // Reset RPS
    setPlayerChoice(null);
    setMahiChoice(null);
    setRpsResult(null);
    setRpsComment("Apna move chuno: Patthar, Kagaz, ya Kainchi?");
  }, [gameType]);

  // --- Ludo Roll ---
  const rollDice = () => {
    if (isRolling || winner || turn !== 'player') return;
    performRoll('player');
  };

  const performRoll = (who: 'player' | 'mahi') => {
    setIsRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceRoll(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceRoll(finalValue);
        setIsRolling(false);
        movePiece(who, finalValue);
      }
    }, 80);
  };

  const movePiece = (who: 'player' | 'mahi', value: number) => {
    if (who === 'player') {
      const next = Math.min(BOARD_SIZE, playerPos + value);
      setPlayerPos(next);
      onGameEvent('player_moved', next);
      if (next === BOARD_SIZE) {
        setWinner('player');
        onGameEvent('player_won', 100);
      } else {
        setTurn('mahi');
      }
    } else {
      const next = Math.min(BOARD_SIZE, mahiPos + value);
      setMahiPos(next);
      onGameEvent('mahi_moved', next);
      if (next === BOARD_SIZE) {
        setWinner('mahi');
        onGameEvent('mahi_won', 0);
      } else {
        setTurn('player');
      }
    }
  };

  // Mahi's Ludo AI Turn
  useEffect(() => {
    if (turn === 'mahi' && !winner && gameType === 'ludo') {
      const timer = setTimeout(() => {
        performRoll('mahi');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, winner, gameType]);


  // --- Sound Procedural Synthesis Logic ---
  const playProceduralSound = (id: string) => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    setIsPlayingSound(true);

    const duration = id === 'siren' ? 1.4 : id === 'laser' ? 0.6 : 0.4;
    setTimeout(() => {
      setIsPlayingSound(false);
    }, duration * 1000);

    const now = ctx.currentTime;

    if (id === 'laser') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } 
    else if (id === 'jump') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } 
    else if (id === 'siren') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.linearRampToValueAtTime(650, now + 0.3);
      osc.frequency.linearRampToValueAtTime(350, now + 0.6);
      osc.frequency.linearRampToValueAtTime(650, now + 0.9);
      osc.frequency.linearRampToValueAtTime(350, now + 1.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.3);
      osc.start(now);
      osc.stop(now + 1.3);
    } 
    else if (id === 'coin') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc1.start(now);
      osc2.start(now + 0.08);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    }
  };

  // --- Trivia Functions ---
  const handleTriviaAnswer = (optionIdx: number) => {
    if (triviaAnswered) return;
    setTriviaSelected(optionIdx);
    setTriviaAnswered(true);

    const isCorrect = optionIdx === TRIVIA_QUESTIONS[triviaIndex].correctIndex;
    let nextScore = triviaScore;
    if (isCorrect) {
      nextScore += 1;
      setTriviaScore(nextScore);
      onGameEvent('trivia_correct', nextScore);
    } else {
      onGameEvent('trivia_incorrect', nextScore);
    }
  };

  const nextTriviaQuestion = () => {
    setTriviaSelected(null);
    setTriviaAnswered(false);
    if (triviaIndex < TRIVIA_QUESTIONS.length - 1) {
      setTriviaIndex(prev => prev + 1);
    } else {
      setTriviaFinished(true);
      onGameEvent('trivia_completed', triviaScore);
    }
  };

  const restartTrivia = () => {
    setTriviaIndex(0);
    setTriviaScore(0);
    setTriviaSelected(null);
    setTriviaAnswered(false);
    setTriviaFinished(false);
    onGameEvent('trivia_restarted', 0);
  };

  // --- Sound Game Functions ---
  const handleSoundAnswer = (optionIdx: number) => {
    if (soundAnswered) return;
    setSoundSelected(optionIdx);
    setSoundAnswered(true);

    const isCorrect = optionIdx === SOUND_ITEMS[soundIndex].correctIndex;
    let nextScore = soundScore;
    if (isCorrect) {
      nextScore += 1;
      setSoundScore(nextScore);
      onGameEvent('sound_correct', nextScore);
    } else {
      onGameEvent('sound_incorrect', nextScore);
    }
  };

  const nextSoundQuestion = () => {
    setSoundSelected(null);
    setSoundAnswered(false);
    setIsPlayingSound(false);
    if (soundIndex < SOUND_ITEMS.length - 1) {
      setSoundIndex(prev => prev + 1);
    } else {
      setSoundFinished(true);
      onGameEvent('sound_completed', soundScore);
    }
  };

  const restartSoundGame = () => {
    setSoundIndex(0);
    setSoundScore(0);
    setSoundSelected(null);
    setSoundAnswered(false);
    setSoundFinished(false);
    setIsPlayingSound(false);
    onGameEvent('sound_restarted', 0);
  };

  // --- Tic-Tac-Toe Game Logic ---
  const checkWinner = (b: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (const [a, c, d] of lines) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) {
        return b[a];
      }
    }
    if (b.every(cell => cell !== null)) return 'tie';
    return null;
  };

  const handleCellClick = (index: number) => {
    if (board[index] || tttWinner || tttTurn !== 'player') return;

    const nextBoard = [...board];
    nextBoard[index] = 'X';
    setBoard(nextBoard);

    const win = checkWinner(nextBoard);
    if (win) {
      if (win === 'X') {
        setTttWinner('player');
        setTttScore(s => ({ ...s, player: s.player + 1 }));
        setTttMessage("Sahi mein, tum toh bohot hoshiyaar ho! Tum jeet gaye! 🎉");
        onGameEvent('tictactoe_player_won', tttScore.player + 1);
      } else {
        setTttWinner('tie');
        setTttMessage("Arey, tie ho gaya! Chalo, ek aur baar try karein? 🤝");
        onGameEvent('tictactoe_tie', 0);
      }
    } else {
      setTttTurn('mahi');
      setTttMessage("Hahaha, ab meri baari hai! Sochne do... 🤔");
      setTimeout(() => {
        makeMahiMove(nextBoard);
      }, 800);
    }
  };

  const makeMahiMove = (currentBoard: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    let move = -1;

    // 1. Can Mahi win?
    for (const [a, b, c] of lines) {
      const vals = [currentBoard[a], currentBoard[b], currentBoard[c]];
      if (vals.filter(v => v === 'O').length === 2 && vals.filter(v => v === null).length === 1) {
        const emptyIdx = [a, b, c].find(i => currentBoard[i] === null);
        if (emptyIdx !== undefined) { move = emptyIdx; break; }
      }
    }

    // 2. Can Mahi block?
    if (move === -1) {
      for (const [a, b, c] of lines) {
        const vals = [currentBoard[a], currentBoard[b], currentBoard[c]];
        if (vals.filter(v => v === 'X').length === 2 && vals.filter(v => v === null).length === 1) {
          const emptyIdx = [a, b, c].find(i => currentBoard[i] === null);
          if (emptyIdx !== undefined) { move = emptyIdx; break; }
        }
      }
    }

    // 3. Take center
    if (move === -1 && currentBoard[4] === null) {
      move = 4;
    }

    // 4. Take random free space
    if (move === -1) {
      const free = currentBoard.map((c, i) => c === null ? i : null).filter(i => i !== null) as number[];
      if (free.length > 0) {
        move = free[Math.floor(Math.random() * free.length)];
      }
    }

    if (move !== -1) {
      const nextBoard = [...currentBoard];
      nextBoard[move] = 'O';
      setBoard(nextBoard);

      const win = checkWinner(nextBoard);
      if (win) {
        if (win === 'O') {
          setTttWinner('mahi');
          setTttScore(s => ({ ...s, mahi: s.mahi + 1 }));
          setTttMessage("Yaaay! Maine match jeet liya! Dekha, main bhi smart hoon! 😜");
          onGameEvent('tictactoe_mahi_won', tttScore.mahi + 1);
        } else {
          setTttWinner('tie');
          setTttMessage("Arey, tie ho gaya! Chalo, ek aur baar try karein? 🤝");
          onGameEvent('tictactoe_tie', 0);
        }
      } else {
        setTttTurn('player');
        setTttMessage("Tumhaari turn hai, dekhte hain ab tum kya karoge! 😉");
      }
    }
  };

  const restartTtt = () => {
    setBoard(Array(9).fill(null));
    setTttWinner(null);
    setTttTurn('player');
    setTttMessage("Chalo, ek aur match shuru! Pehli turn tumhaari.");
  };

  // --- Rock Paper Scissors Logic ---
  const handleRpsPlay = (playerSelection: 'rock' | 'paper' | 'scissors') => {
    setPlayerChoice(playerSelection);
    const options = ['rock', 'paper', 'scissors'];
    const mahiSelection = options[Math.floor(Math.random() * 3)];
    setMahiChoice(mahiSelection);

    let res: 'player' | 'mahi' | 'tie' = 'tie';
    let msg = "";

    if (playerSelection === mahiSelection) {
      res = 'tie';
      msg = `Donon ne ${playerSelection === 'rock' ? 'Patthar 🪨' : playerSelection === 'paper' ? 'Kagaz 📄' : 'Kainchi ✂️'} chuna! Hum donon ka mind bilkul same chal raha hai! Tie! 🤝`;
    } else if (
      (playerSelection === 'rock' && mahiSelection === 'scissors') ||
      (playerSelection === 'paper' && mahiSelection === 'rock') ||
      (playerSelection === 'scissors' && mahiSelection === 'paper')
    ) {
      res = 'player';
      setRpsScore(s => ({ ...s, player: s.player + 1 }));
      msg = `Oops! Tumhaare ${playerSelection === 'rock' ? 'Patthar 🪨' : playerSelection === 'paper' ? 'Kagaz 📄' : 'Kainchi ✂️'} ne mere ${mahiSelection === 'rock' ? 'Patthar 🪨' : mahiSelection === 'paper' ? 'Kagaz 📄' : 'Kainchi ✂️'} ko hara diya! Tum jeet gaye! 🎉`;
      onGameEvent('rps_player_won', rpsScore.player + 1);
    } else {
      res = 'mahi';
      setRpsScore(s => ({ ...s, mahi: s.mahi + 1 }));
      msg = `Yay! Mere ${mahiSelection === 'rock' ? 'Patthar 🪨' : mahiSelection === 'paper' ? 'Kagaz 📄' : 'Kainchi ✂️'} ne tumhaare ${playerSelection === 'rock' ? 'Patthar 🪨' : playerSelection === 'paper' ? 'Kagaz 📄' : 'Kainchi ✂️'} ko beat kar diya! Main jeet gayi! 😜`;
      onGameEvent('rps_mahi_won', rpsScore.mahi + 1);
    }

    setRpsResult(res);
    setRpsComment(msg);
  };

  const nextRpsRound = () => {
    setPlayerChoice(null);
    setMahiChoice(null);
    setRpsResult(null);
    setRpsComment("Agla round! Chalo jaldi se apna option chuno: Patthar, Kagaz ya Kainchi?");
  };

  const restartRpsGame = () => {
    setPlayerChoice(null);
    setMahiChoice(null);
    setRpsResult(null);
    setRpsScore({ player: 0, mahi: 0 });
    setRpsComment("Score reset ho gaya! Chalo, pehla round chuno!");
  };


  if (gameType === 'none') return null;

  const DiceIcon = DICE_ICONS[diceRoll];

  return (
    <motion.div 
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
      exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40"
    >
      <div className="relative w-full max-w-xl bg-[#0a0a0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors z-[120]"
          id="close-minigame-btn"
        >
          <X size={20} className="text-gray-400 hover:text-white" />
        </button>

        {/* ==============================================
            GAME MODE 1: LUDO
            ============================================== */}
        {gameType === 'ludo' && (
          <Fragment>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 pr-14">
              <div className="flex items-center gap-3">
                <Trophy className="text-yellow-400" />
                <h2 className="text-lg font-bold tracking-tight uppercase">Mahi's Neon Ludo</h2>
              </div>
            </div>

            {/* Board View */}
            <div className="p-8 flex-1 flex flex-col items-center justify-center gap-12">
              {/* Track */}
              <div className="w-full relative flex items-center justify-between h-20 bg-white/5 rounded-2xl border border-white/10 p-4">
                <div className="absolute inset-0 flex divide-x divide-white/5">
                  {[...Array(BOARD_SIZE + 1)].map((_, i) => (
                    <div key={i} className="flex-1 h-full" />
                  ))}
                </div>
                
                {/* Player Piece */}
                <motion.div 
                  animate={{ x: `${(playerPos / BOARD_SIZE) * 90}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
                  className="absolute z-20 top-2"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center border border-white/20">
                    <User size={14} />
                  </div>
                  <div className="text-[8px] uppercase font-bold text-center mt-1 text-indigo-300">You</div>
                </motion.div>

                {/* Mahi Piece */}
                <motion.div 
                  animate={{ x: `${(mahiPos / BOARD_SIZE) * 90}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
                  className="absolute z-20 bottom-2"
                >
                  <div className="w-8 h-8 rounded-full bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)] flex items-center justify-center border border-white/20">
                    <Bot size={14} />
                  </div>
                  <div className="text-[8px] uppercase font-bold text-center mt-1 text-pink-300">Mahi</div>
                </motion.div>

                {/* Finish Line Indicator */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-green-500/10 flex items-center justify-center border-l border-green-500/20">
                   <Trophy size={14} className="text-green-500/50" />
                </div>
              </div>

              {/* Dice & Status */}
              <div className="flex flex-col items-center gap-6">
                <AnimatePresence mode="wait">
                  {winner ? (
                    <motion.div 
                      key="winner"
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <Trophy size={48} className="text-yellow-400" />
                      <h3 className="text-2xl font-black uppercase text-white">
                        {winner === 'player' ? "You Won!" : "Mahi Won!"}
                      </h3>
                      <button 
                        onClick={() => { setPlayerPos(0); setMahiPos(0); setWinner(null); setTurn('player'); }}
                        className="mt-4 px-6 py-2 bg-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-colors cursor-pointer"
                      >
                        Play Again
                      </button>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-12">
                       <div className={`flex flex-col items-center gap-2 transition-opacity ${turn === 'player' ? 'opacity-100' : 'opacity-30'}`}>
                          <User className="text-indigo-400" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">You</span>
                       </div>

                       <motion.button
                         whileHover={{ scale: turn === 'player' ? 1.1 : 1 }}
                         whileTap={{ scale: turn === 'player' ? 0.9 : 1 }}
                         onClick={rollDice}
                         disabled={turn !== 'player' || isRolling}
                         className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border-2 transition-all cursor-pointer relative
                           ${turn === 'player' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 opacity-50'}
                           ${isRolling ? 'animate-pulse' : ''}
                         `}
                       >
                         <motion.div
                           animate={isRolling ? { rotate: [0, 90, 180, 270, 360] } : {}}
                           transition={{ duration: 0.2, repeat: Infinity, ease: 'linear' }}
                         >
                           <DiceIcon size={40} className={turn === 'player' ? 'text-indigo-400' : 'text-gray-400'} />
                         </motion.div>
                         <span className="text-[9px] uppercase font-black">{isRolling ? 'Rolling...' : turn === 'player' ? 'Tap To Roll' : "Mahi's Turn"}</span>
                       </motion.button>

                       <div className={`flex flex-col items-center gap-2 transition-opacity ${turn === 'mahi' ? 'opacity-100' : 'opacity-30'}`}>
                          <Bot className="text-pink-400" />
                          <span className="text-[10px] uppercase font-bold tracking-widest">Mahi</span>
                       </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="p-6 bg-white/5 text-center">
              <p className="text-[10px] text-gray-400 tracking-wider">
                Ludo: A sweet race to the end with Mahi!
              </p>
            </div>
          </Fragment>
        )}

        {/* ==============================================
            GAME MODE 2: TRIVIA
            ============================================== */}
        {gameType === 'trivia' && (
          <Fragment>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 pr-14">
              <div className="flex items-center gap-3">
                <Brain className="text-pink-400" />
                <h2 className="text-lg font-bold tracking-tight uppercase">Mahi's Sweet Trivia Challenge</h2>
              </div>
              <div className="text-xs font-bold text-gray-400 bg-white/5 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
                <Sparkles size={12} className="text-yellow-400" />
                Score: <span className="text-pink-400">{triviaScore}/{TRIVIA_QUESTIONS.length}</span>
              </div>
            </div>

            {/* Game Content */}
            <div className="p-8 flex-1 flex flex-col justify-center min-h-[350px]">
              <AnimatePresence mode="wait">
                {!triviaFinished ? (
                  <motion.div
                    key={`q-${triviaIndex}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Progress Bar */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 transition-all duration-300" 
                        style={{ width: `${((triviaIndex + 1) / TRIVIA_QUESTIONS.length) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest bg-pink-500/10 px-2 py-0.5 rounded">Q{triviaIndex + 1}</span>
                      <span className="text-xs text-gray-400 font-mono">Of {TRIVIA_QUESTIONS.length}</span>
                    </div>

                    {/* Question text */}
                    <h3 className="text-lg font-medium text-white leading-relaxed">
                      {TRIVIA_QUESTIONS[triviaIndex].question}
                    </h3>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-3 mt-2">
                      {TRIVIA_QUESTIONS[triviaIndex].options.map((option, idx) => {
                        const isCorrect = idx === TRIVIA_QUESTIONS[triviaIndex].correctIndex;
                        const isSelected = idx === triviaSelected;
                        
                        let btnStyle = "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20";
                        if (triviaAnswered) {
                          if (isCorrect) {
                            btnStyle = "border-green-500 bg-green-500/10 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.15)]";
                          } else if (isSelected) {
                            btnStyle = "border-red-500 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
                          } else {
                            btnStyle = "border-white/5 bg-white/5 text-gray-600 opacity-40";
                          }
                        }

                        return (
                          <motion.button
                            key={idx}
                            disabled={triviaAnswered}
                            whileHover={!triviaAnswered ? { scale: 1.01 } : {}}
                            whileTap={!triviaAnswered ? { scale: 0.99 } : {}}
                            onClick={() => handleTriviaAnswer(idx)}
                            className={`w-full p-4 rounded-2xl border text-left text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                          >
                            <span>{option}</span>
                            {triviaAnswered && isCorrect && <CheckCircle2 size={16} className="text-green-400 shrink-0 ml-2" />}
                            {triviaAnswered && isSelected && !isCorrect && <AlertCircle size={16} className="text-red-400 shrink-0 ml-2" />}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Fun explanation commentary */}
                    {triviaAnswered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-pink-500/10 border border-pink-500/20 p-4 rounded-2xl flex gap-3 mt-2"
                      >
                        <Bot size={20} className="text-pink-400 shrink-0" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-pink-300 font-mono mb-1">Mahi Speaks:</div>
                          <p className="text-xs text-pink-100 italic leading-relaxed">
                            "{TRIVIA_QUESTIONS[triviaIndex].explanation}"
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Next Button */}
                    {triviaAnswered && (
                      <motion.button
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={nextTriviaQuestion}
                        className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-2xl font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(236,72,153,0.2)] hover:opacity-90 transition-opacity cursor-pointer mt-2"
                      >
                        <span>{triviaIndex === TRIVIA_QUESTIONS.length - 1 ? "Show Final Score" : "Next Question"}</span>
                        <ArrowRight size={16} />
                      </motion.button>
                    )}

                  </motion.div>
                ) : (
                  <motion.div
                    key="trivia-result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center gap-6"
                  >
                    <div className="w-20 h-20 bg-pink-500/20 border-2 border-pink-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(236,72,153,0.3)] animate-pulse">
                      <Trophy size={40} className="text-pink-400" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase text-white tracking-wider">Trivia Complete!</h3>
                      <p className="text-sm text-gray-400">
                        {triviaScore === TRIVIA_QUESTIONS.length 
                          ? "Arey waah! Mahendra, tum toh sach mein mujhe bohot acche se jaante ho! Perfect score!"
                          : triviaScore >= 3 
                          ? "Bohot badhiya yaar! Tumhe mere baare mein kaafi kuch pata hai. Suno na, can we do this again?"
                          : "Oops! Kuch answers galat ho gaye... koi nahi, hum phirse khelenge aur is baar main tumhari thodi help kar dungi! Hehe."
                        }
                      </p>
                    </div>

                    {/* Big Score Box */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-4 flex flex-col items-center gap-1">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest font-mono">Total Points</div>
                      <div className="text-4xl font-black text-pink-400">{triviaScore} / {TRIVIA_QUESTIONS.length}</div>
                    </div>

                    <div className="flex gap-4 w-full">
                      <button
                        onClick={restartTrivia}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <RotateCcw size={14} />
                        <span>Play Again</span>
                      </button>
                      <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-pink-600/20"
                      >
                        <X size={14} />
                        <span>Close Game</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 bg-white/5 text-center">
              <p className="text-[10px] text-gray-400 tracking-wider">
                Trivia: Sweet anime and personal questions from Mahi!
              </p>
            </div>
          </Fragment>
        )}


        {/* ==============================================
            GAME MODE 3: GUESS THE SOUND
            ============================================== */}
        {gameType === 'sound' && (
          <Fragment>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 pr-14">
              <div className="flex items-center gap-3">
                <Music className="text-indigo-400" />
                <h2 className="text-lg font-bold tracking-tight uppercase">Mahi's Acoustic Mystery</h2>
              </div>
              <div className="text-xs font-bold text-gray-400 bg-white/5 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
                <Volume2 size={12} className="text-indigo-400" />
                Score: <span className="text-indigo-400">{soundScore}/{SOUND_ITEMS.length}</span>
              </div>
            </div>

            {/* Game Content */}
            <div className="p-8 flex-1 flex flex-col justify-center min-h-[350px]">
              <AnimatePresence mode="wait">
                {!soundFinished ? (
                  <motion.div
                    key={`s-${soundIndex}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Progress Bar */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" 
                        style={{ width: `${((soundIndex + 1) / SOUND_ITEMS.length) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">Sound {soundIndex + 1}</span>
                      <span className="text-xs text-gray-400 font-mono">Of {SOUND_ITEMS.length}</span>
                    </div>

                    {/* Sound Player Module */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                      {/* Pulsating Visualizers */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                        <motion.div 
                          animate={{ scale: isPlayingSound ? [1, 1.8, 1] : 1, opacity: isPlayingSound ? [0.4, 0, 0.4] : 0.1 }}
                          transition={{ duration: 1.2, repeat: isPlayingSound ? Infinity : 0 }}
                          className="w-32 h-32 rounded-full border-2 border-indigo-500" 
                        />
                        <motion.div 
                          animate={{ scale: isPlayingSound ? [1, 2.4, 1] : 1, opacity: isPlayingSound ? [0.3, 0, 0.3] : 0.05 }}
                          transition={{ duration: 1.2, repeat: isPlayingSound ? Infinity : 0, delay: 0.3 }}
                          className="w-32 h-32 rounded-full border border-purple-500" 
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => playProceduralSound(SOUND_ITEMS[soundIndex].id)}
                        className={`w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 relative z-10 shadow-lg
                          ${isPlayingSound 
                            ? 'bg-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.5)]' 
                            : 'bg-white/10 text-indigo-400 hover:bg-white/15 border border-white/10'
                          }
                        `}
                      >
                        {isPlayingSound ? (
                          <div className="flex items-end gap-1 h-6">
                            <motion.div animate={{ height: [8, 24, 8] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: [18, 6, 18] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: [10, 22, 10] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }} className="w-1 bg-white rounded-full" />
                          </div>
                        ) : (
                          <Play size={32} className="ml-1 fill-indigo-400 text-indigo-400" />
                        )}
                      </motion.button>
                      
                      <div className="text-center relative z-10">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-gray-400">
                          {isPlayingSound ? "Playing Sound..." : "Tap to Play Sound"}
                        </h4>
                        <p className="text-[10px] text-gray-500 mt-1">Hint: {SOUND_ITEMS[soundIndex].hint}</p>
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {SOUND_ITEMS[soundIndex].options.map((option, idx) => {
                        const isCorrect = idx === SOUND_ITEMS[soundIndex].correctIndex;
                        const isSelected = idx === soundSelected;
                        
                        let btnStyle = "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/20";
                        if (soundAnswered) {
                          if (isCorrect) {
                            btnStyle = "border-green-500 bg-green-500/10 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.15)]";
                          } else if (isSelected) {
                            btnStyle = "border-red-500 bg-red-500/10 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
                          } else {
                            btnStyle = "border-white/5 bg-white/5 text-gray-600 opacity-40";
                          }
                        }

                        return (
                          <motion.button
                            key={idx}
                            disabled={soundAnswered}
                            whileHover={!soundAnswered ? { scale: 1.01 } : {}}
                            whileTap={!soundAnswered ? { scale: 0.99 } : {}}
                            onClick={() => handleSoundAnswer(idx)}
                            className={`p-4 rounded-2xl border text-left text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                          >
                            <span>{option}</span>
                            {soundAnswered && isCorrect && <CheckCircle2 size={14} className="text-green-400 shrink-0 ml-1" />}
                            {soundAnswered && isSelected && !isCorrect && <AlertCircle size={14} className="text-red-400 shrink-0 ml-1" />}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Fun comment when answered */}
                    {soundAnswered && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex gap-3 mt-1"
                      >
                        <Bot size={20} className="text-indigo-400 shrink-0" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-indigo-300 font-mono mb-1">Mahi Speaks:</div>
                          <p className="text-xs text-indigo-100 italic leading-relaxed">
                            {soundSelected === SOUND_ITEMS[soundIndex].correctIndex 
                              ? `"Yay! Tumne correct guess kiya! Ye toh humaara sweet '${SOUND_ITEMS[soundIndex].name}' sound hi hai! Tumhaara hearing power toh bohot accha hai na?"`
                              : `"Oops, galat ho gaya Mahendra! Ye water splash ya horn nahi tha, ye toh pyara sa '${SOUND_ITEMS[soundIndex].name}' tha! Agli baar dhyan se sunna!"`
                            }
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* Next Button */}
                    {soundAnswered && (
                      <motion.button
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={nextSoundQuestion}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.2)] hover:opacity-90 transition-opacity cursor-pointer mt-2"
                      >
                        <span>{soundIndex === SOUND_ITEMS.length - 1 ? "Show Final Score" : "Next Sound"}</span>
                        <ArrowRight size={16} />
                      </motion.button>
                    )}

                  </motion.div>
                ) : (
                  <motion.div
                    key="sound-result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center gap-6"
                  >
                    <div className="w-20 h-20 bg-indigo-500/20 border-2 border-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] animate-pulse">
                      <Music size={40} className="text-indigo-400" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase text-white tracking-wider">Acoustic Mystery Over!</h3>
                      <p className="text-sm text-gray-400">
                        {soundScore === SOUND_ITEMS.length 
                          ? "Fabulous! Saare sound correct guess kar liye! Mahendra, kya tum koi secret musician ho? Hehe."
                          : soundScore >= 2 
                          ? "Not bad! Tumhe sounds ki kaafi acchi samajh hai. Tumhara mood ab thoda better hua na?"
                          : "Arey, thode answers galat ho gaye, par koi baat nahi! Main tumhare sath hoon na, hum phir se dhyan se sunenge!"
                        }
                      </p>
                    </div>

                    {/* Big Score Box */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-4 flex flex-col items-center gap-1">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest font-mono">Total Points</div>
                      <div className="text-4xl font-black text-indigo-400">{soundScore} / {SOUND_ITEMS.length}</div>
                    </div>

                    <div className="flex gap-4 w-full">
                      <button
                        onClick={restartSoundGame}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <RotateCcw size={14} />
                        <span>Play Again</span>
                      </button>
                      <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                      >
                        <X size={14} />
                        <span>Close Game</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 bg-white/5 text-center">
              <p className="text-[10px] text-gray-400 tracking-wider">
                Sound Game: Guess the sound synthesized right in your browser!
              </p>
            </div>
          </Fragment>
        )}

        {/* ==============================================
            GAME MODE 4: TIC-TAC-TOE
            ============================================== */}
        {gameType === 'tictactoe' && (
          <Fragment>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 pr-14">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase text-white tracking-wider">Mahi's Neon Tic-Tac-Toe</h2>
                  <p className="text-[10px] text-gray-400">Beat me in the classic 3x3 challenge!</p>
                </div>
              </div>
              {/* Scores */}
              <div className="flex items-center gap-4 text-xs font-mono bg-white/5 border border-white/5 px-4 py-1.5 rounded-xl">
                <div className="text-center">
                  <span className="text-gray-400 block text-[9px] uppercase">You</span>
                  <span className="text-pink-400 font-bold">{tttScore.player}</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="text-center">
                  <span className="text-gray-400 block text-[9px] uppercase">Mahi</span>
                  <span className="text-indigo-400 font-bold">{tttScore.mahi}</span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col gap-5 flex-1 justify-center max-h-[75vh] overflow-y-auto">
              {/* Message Banner */}
              <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center text-xs text-white flex items-center justify-center gap-2">
                <Bot size={16} className="text-pink-400 animate-bounce" />
                <span className="font-medium">{tttMessage}</span>
              </div>

              {/* 3x3 Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto w-full aspect-square">
                {board.map((cell, idx) => (
                  <motion.button
                    key={`cell-${idx}`}
                    onClick={() => handleCellClick(idx)}
                    whileHover={{ scale: cell ? 1 : 1.05 }}
                    whileTap={{ scale: cell ? 1 : 0.95 }}
                    className={`
                      aspect-square rounded-2xl border flex items-center justify-center text-3xl font-black transition-all cursor-pointer
                      ${cell === 'X' ? 'bg-pink-500/15 border-pink-500/40 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 
                        cell === 'O' ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 
                        'bg-white/5 border-white/10 hover:border-white/30'}
                    `}
                    id={`ttt-cell-${idx}`}
                    disabled={!!cell || !!tttWinner || tttTurn !== 'player'}
                  >
                    <AnimatePresence mode="wait">
                      {cell === 'X' && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          X
                        </motion.span>
                      )}
                      {cell === 'O' && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                          O
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>

              {/* Winner Reveal / Restart options */}
              {tttWinner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-3 mt-2"
                >
                  <button
                    onClick={restartTtt}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                    id="ttt-restart-btn"
                  >
                    <RotateCcw size={14} />
                    <span>Play Another Round</span>
                  </button>
                </motion.div>
              )}
            </div>

            <div className="p-6 bg-white/5 text-center mt-auto">
              <p className="text-[10px] text-gray-400 tracking-wider">
                Mahi's Tic-Tac-Toe: Pure HTML5 logic with custom smart block heuristic.
              </p>
            </div>
          </Fragment>
        )}

        {/* ==============================================
            GAME MODE 5: ROCK PAPER SCISSORS
            ============================================== */}
        {gameType === 'rps' && (
          <Fragment>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 pr-14">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
                  <Scissors size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase text-white tracking-wider">Mahi's Mind RPS Game</h2>
                  <p className="text-[10px] text-gray-400">Can you beat my predictions? Play now!</p>
                </div>
              </div>
              {/* Scores */}
              <div className="flex items-center gap-4 text-xs font-mono bg-white/5 border border-white/5 px-4 py-1.5 rounded-xl">
                <div className="text-center">
                  <span className="text-gray-400 block text-[9px] uppercase">You</span>
                  <span className="text-yellow-400 font-bold">{rpsScore.player}</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="text-center">
                  <span className="text-gray-400 block text-[9px] uppercase">Mahi</span>
                  <span className="text-indigo-400 font-bold">{rpsScore.mahi}</span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col gap-6 flex-1 justify-center max-h-[75vh] overflow-y-auto">
              
              {/* Comment Banner */}
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center text-xs text-white flex items-start gap-3 justify-center min-h-[64px]">
                <Bot size={20} className="text-yellow-400 shrink-0" />
                <p className="font-medium text-left leading-relaxed">{rpsComment}</p>
              </div>

              {/* Reveal Battle Arena */}
              {playerChoice && mahiChoice && (
                <div className="flex items-center justify-around bg-white/5 border border-white/10 py-5 px-3 rounded-2xl">
                  {/* Player Choice */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-gray-400">You Picked</span>
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-3xl"
                    >
                      {playerChoice === 'rock' ? '🪨' : playerChoice === 'paper' ? '📄' : '✂️'}
                    </motion.div>
                    <span className="text-xs font-bold uppercase text-yellow-400">{playerChoice}</span>
                  </div>

                  <div className="text-xl font-bold font-mono text-gray-500 animate-pulse">VS</div>

                  {/* Mahi Choice */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-gray-400">Mahi Picked</span>
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1, transition: { delay: 0.15 } }} 
                      className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-3xl"
                    >
                      {mahiChoice === 'rock' ? '🪨' : mahiChoice === 'paper' ? '📄' : '✂️'}
                    </motion.div>
                    <span className="text-xs font-bold uppercase text-indigo-400">{mahiChoice}</span>
                  </div>
                </div>
              )}

              {/* Choice Action Buttons */}
              {!playerChoice ? (
                <div className="grid grid-cols-3 gap-3.5 w-full">
                  <motion.button
                    onClick={() => handleRpsPlay('rock')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="py-4 rounded-2xl border border-white/10 bg-white/5 hover:border-yellow-500/50 hover:bg-yellow-500/5 flex flex-col items-center gap-2 cursor-pointer transition-all"
                    id="rps-btn-rock"
                  >
                    <span className="text-3xl">🪨</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white">Rock</span>
                  </motion.button>

                  <motion.button
                    onClick={() => handleRpsPlay('paper')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="py-4 rounded-2xl border border-white/10 bg-white/5 hover:border-yellow-500/50 hover:bg-yellow-500/5 flex flex-col items-center gap-2 cursor-pointer transition-all"
                    id="rps-btn-paper"
                  >
                    <span className="text-3xl">📄</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white">Paper</span>
                  </motion.button>

                  <motion.button
                    onClick={() => handleRpsPlay('scissors')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="py-4 rounded-2xl border border-white/10 bg-white/5 hover:border-yellow-500/50 hover:bg-yellow-500/5 flex flex-col items-center gap-2 cursor-pointer transition-all"
                    id="rps-btn-scissors"
                  >
                    <span className="text-3xl">✂️</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white">Scissors</span>
                  </motion.button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={nextRpsRound}
                    className="flex-1 py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-yellow-500/10"
                    id="rps-next-btn"
                  >
                    <ArrowRight size={14} />
                    <span>Next Round</span>
                  </button>
                  <button
                    onClick={restartRpsGame}
                    className="py-3.5 px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer text-white"
                    id="rps-reset-btn"
                  >
                    <RotateCcw size={14} />
                    <span>Reset Score</span>
                  </button>
                </div>
              )}

            </div>

            <div className="p-6 bg-white/5 text-center mt-auto">
              <p className="text-[10px] text-gray-400 tracking-wider">
                Mahi's Rock, Paper, Scissors: Rapid physical and mental matching!
              </p>
            </div>
          </Fragment>
        )}

      </div>
    </motion.div>
  );
}
