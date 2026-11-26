import { randomUUID } from "node:crypto";
import { open, readFile, rename, rm } from "node:fs/promises";
import { createInterface } from "node:readline";

const MIN = 1;
const MAX = 10;
const TOP_N = 10;
const WIDTH = 56;
const scoresPath = new URL("./leaderboard.json", import.meta.url);
const lockPath = new URL("./leaderboard.lock", import.meta.url);

type Player = {
  name: string;
  bestScore: number;
  gamesPlayed: number;
  lastPlayed: string;
};

// ---------- Terminal styling ----------

const color = Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;
const style = {
  title: (text: string) => color ? `\x1b[1;36m${text}\x1b[0m` : text,
  success: (text: string) => color ? `\x1b[32m${text}\x1b[0m` : text,
  muted: (text: string) => color ? `\x1b[2m${text}\x1b[0m` : text,
};

// ---------- Leaderboard storage ----------

function isPlayer(row: unknown): row is Player {
  if (typeof row !== "object" || row === null) return false;
  const player = row as Partial<Player>;
  return typeof player.name === "string" && player.name.trim().length > 0
    && typeof player.bestScore === "number" && Number.isInteger(player.bestScore) && player.bestScore <= 0
    && typeof player.gamesPlayed === "number" && Number.isInteger(player.gamesPlayed) && player.gamesPlayed > 0
    && typeof player.lastPlayed === "string" && Number.isFinite(Date.parse(player.lastPlayed));
}

async function loadScores(): Promise<Player[]> {
  try {
    const data: unknown = JSON.parse(await readFile(scoresPath, "utf8"));
    return Array.isArray(data) ? data.filter(isPlayer) : [];
  } catch {
    return [];
  }
}

function findPlayer(scores: Player[], name: string): Player | undefined {
  return scores.find((player) => player.name.toLowerCase() === name.toLowerCase());
}

async function saveScores(scores: Player[]): Promise<void> {
  const temporaryPath = new URL(`./leaderboard-${randomUUID()}.tmp`, import.meta.url);
  try {
    await Bun.write(temporaryPath, `${JSON.stringify(scores, null, 2)}\n`);
    for (let attempt = 0; ; attempt++) {
      try {
        await rename(temporaryPath, scoresPath);
        break;
      } catch (error) {
        // Windows can briefly block replacement while another process reads the file.
        const code = (error as NodeJS.ErrnoException).code;
        if ((code !== "EPERM" && code !== "EBUSY") || attempt >= 8) throw error;
        await Bun.sleep(25);
      }
    }
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => {});
  }
}

async function lockScores() {
  for (let attempt = 0; ; attempt++) {
    try {
      return await open(lockPath, "wx");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST" || attempt >= 40) throw error;
      await Bun.sleep(25);
    }
  }
}

async function recordScore(name: string, score: number) {
  const lock = await lockScores();
  try {
    const scores = await loadScores();
    let player = findPlayer(scores, name);
    const lastPlayed = new Date().toISOString();
    if (player) {
      player.bestScore = Math.max(player.bestScore, score);
      player.gamesPlayed++;
      player.lastPlayed = lastPlayed;
    } else {
      player = { name, bestScore: score, gamesPlayed: 1, lastPlayed };
      scores.push(player);
    }
    await saveScores(scores);
    return { scores, player };
  } finally {
    await lock.close();
    await rm(lockPath, { force: true });
  }
}

function showScores(scores: Player[], currentPlayer: Player | undefined): void {
  console.log(style.title("\nLeaderboard"));
  if (scores.length === 0) {
    console.log(style.muted("No scores yet."));
    return;
  }

  scores.sort((a, b) => b.bestScore - a.bestScore || a.name.localeCompare(b.name, "en"));
  const separator = style.muted("-".repeat(WIDTH));
  const printRow = (player: Player, index: number) => {
    const rank = `${index + 1}.`.padStart(5);
    const name = player.name.slice(0, 26).padEnd(26);
    const score = String(player.bestScore).padStart(7);
    const games = String(player.gamesPlayed).padStart(7);
    console.log(`${rank}  ${name}  ${score}  ${games}${player === currentPlayer ? " *" : ""}`);
  };

  console.log(" Rank  Player                       Score    Games");
  scores.slice(0, TOP_N).forEach(printRow);
  const currentRank = currentPlayer ? scores.indexOf(currentPlayer) : -1;
  if (currentPlayer && currentRank >= TOP_N) {
    console.log(separator);
    printRow(currentPlayer, currentRank);
  }
}

// ---------- Input ----------

const input = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: Boolean(process.stdin.isTTY && process.stdout.isTTY),
  crlfDelay: Infinity,
});
// The iterator keeps pending lines when input arrives faster than prompts.
const pending = input[Symbol.asyncIterator]();

async function readLine(prompt: string): Promise<string | undefined> {
  process.stdout.write(prompt);
  const line = await pending.next();
  if (!process.stdin.isTTY || line.done) process.stdout.write("\n");
  return line.done ? undefined : line.value.trim();
}

function isQuit(value: string): boolean {
  return ["q", "quit"].includes(value.toLowerCase());
}

// ---------- Game loop ----------

async function play(): Promise<void> {
  console.log(style.title("Guess the Number"));
  let name = await readLine("What is your name? ");
  while (name === "") name = await readLine("Please enter your name: ");
  if (name === undefined) return;

  let scores = await loadScores();
  const returningPlayer = findPlayer(scores, name);
  console.log(returningPlayer ? `Welcome back, ${returningPlayer.name}!` : `Welcome, ${name}!`);
  console.log(`Guess a number from ${MIN} to ${MAX}. Type q to quit.`);

  const secret = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN;
  let guesses = 0;
  let wrongGuesses = 0;

  while (true) {
    const answer = await readLine("Your guess: ");
    if (answer === undefined || isQuit(answer)) {
      console.log(`The number was ${secret}.`);
      break;
    }

    const guess = Number(answer);
    if (!/^\d+$/.test(answer) || !Number.isInteger(guess) || guess < MIN || guess > MAX) {
      console.log(`Enter a whole number from ${MIN} to ${MAX}.`);
      continue;
    }

    guesses++;
    if (guess === secret) {
      console.log(style.success(`Correct! The number was ${secret}.`));
      break;
    }

    wrongGuesses++;
    console.log(guess < secret ? "Higher" : "Lower");
  }

  let player = returningPlayer;
  if (guesses > 0) {
    const score = 0 - wrongGuesses;
    console.log(`Your score: ${score}`);

    try {
      ({ scores, player } = await recordScore(name, score));
    } catch {
      console.log(style.muted("Could not save the leaderboard."));
    }
  }

  showScores(scores, player);
}

try {
  await play();
} finally {
  input.close();
}
