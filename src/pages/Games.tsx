import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import ribbonAbstract from "@/assets/ribbon-abstract.jpg";
import hplPoster from "@/assets/HPL-poster.jpeg";
import { PictureWordMatch } from "@/components/games/PictureWordMatch";
const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const winningLineMap: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
  "0-1-2": { x1: 10, y1: 16.5, x2: 90, y2: 16.5 },
  "3-4-5": { x1: 10, y1: 50, x2: 90, y2: 50 },
  "6-7-8": { x1: 10, y1: 83.5, x2: 90, y2: 83.5 },
  "0-3-6": { x1: 16.5, y1: 10, x2: 16.5, y2: 90 },
  "1-4-7": { x1: 50, y1: 10, x2: 50, y2: 90 },
  "2-5-8": { x1: 83.5, y1: 10, x2: 83.5, y2: 90 },
  "0-4-8": { x1: 12, y1: 12, x2: 88, y2: 88 },
  "2-4-6": { x1: 88, y1: 12, x2: 12, y2: 88 },
};

type Player = "X" | "O";

type CellValue = Player | null;

function getWinner(board: CellValue[]) {
  for (const [a, b, c] of winningCombos) {
    const value = board[a];
    if (value && value === board[b] && value === board[c]) {
      return value;
    }
  }
  return null;
}

function getWinnerLine(board: CellValue[]) {
  for (const [a, b, c] of winningCombos) {
    const value = board[a];
    if (value && value === board[b] && value === board[c]) {
      const key = `${a}-${b}-${c}`;
      return { winner: value, line: winningLineMap[key] };
    }
  }
  return { winner: null, line: null };
}

function getBestMove(board: CellValue[], aiPlayer: Player, humanPlayer: Player) {
  const availableMoves = board
    .map((value, index) => (value === null ? index : null))
    .filter((value): value is number => value !== null);

  const checkWinner = (current: CellValue[]) => getWinner(current);

  const minimax = (current: CellValue[], isMaximizing: boolean): { score: number; move?: number } => {
    const winner = checkWinner(current);
    if (winner === aiPlayer) return { score: 10 };
    if (winner === humanPlayer) return { score: -10 };
    if (current.every((cell) => cell !== null)) return { score: 0 };

    const moves = current
      .map((value, index) => (value === null ? index : null))
      .filter((value): value is number => value !== null);

    if (isMaximizing) {
      let best = { score: -Infinity, move: moves[0] };
      for (const move of moves) {
        const next = [...current];
        next[move] = aiPlayer;
        const result = minimax(next, false);
        if (result.score > best.score) {
          best = { score: result.score, move };
        }
      }
      return best;
    }

    let best = { score: Infinity, move: moves[0] };
    for (const move of moves) {
      const next = [...current];
      next[move] = humanPlayer;
      const result = minimax(next, true);
      if (result.score < best.score) {
        best = { score: result.score, move };
      }
    }
    return best;
  };

  // Make the AI occasionally pick a non-optimal move so the game stays winnable.
  const shouldMakeMistake = Math.random() < 0.4;

  if (availableMoves.length === 0) return null;

  if (shouldMakeMistake) {
    const safeMoves = availableMoves.filter((move) => {
      const nextBoard = [...board];
      nextBoard[move] = aiPlayer;
      const remaining = nextBoard
        .map((value, index) => (value === null ? index : null))
        .filter((value): value is number => value !== null);

      // Avoid moves that let the human win immediately on the next turn.
      return remaining.every((humanMove) => {
        const humanBoard = [...nextBoard];
        humanBoard[humanMove] = humanPlayer;
        return getWinner(humanBoard) !== humanPlayer;
      });
    });

    const pool = safeMoves.length > 0 ? safeMoves : availableMoves;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return minimax(board, true).move ?? availableMoves[0];
}

export default function Games() {
  const [gameMode, setGameMode] = useState<"friend" | "computer">("computer");
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");

  const { winner, line: winningLine } = useMemo(() => getWinnerLine(board), [board]);
  const isDraw = useMemo(() => !winner && board.every((cell) => cell !== null), [board, winner]);

  const handleCellClick = (index: number) => {
    if (board[index] || winner) return;
    if (gameMode === "computer" && currentPlayer === "O") return;
    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;
    setBoard(nextBoard);
    setCurrentPlayer((prev) => (prev === "X" ? "O" : "X"));
  };

  const resetTicTacToe = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
  };

  useEffect(() => {
    if (gameMode !== "computer") return;
    if (winner || isDraw) return;
    if (currentPlayer !== "O") return;

    const bestMove = getBestMove(board, "O", "X");
    if (bestMove === null || bestMove === undefined) return;

    const timeoutId = window.setTimeout(() => {
      setBoard((prev) => {
        if (prev[bestMove] !== null) return prev;
        const nextBoard = [...prev];
        nextBoard[bestMove] = "O";
        return nextBoard;
      });
      setCurrentPlayer("X");
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [board, currentPlayer, gameMode, isDraw, winner]);

  const maxAttempts = 7;
  const [targetNumber, setTargetNumber] = useState(() => Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState("We picked a number between 1 and 100. Can you guess it?");
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameWon, setIsGameWon] = useState(false);
  const [previousGuesses, setPreviousGuesses] = useState<number[]>([]);

  const remainingAttempts = Math.max(maxAttempts - attempts, 0);

  useEffect(() => {
    if (!isGameWon) return;
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      scalar: 1.1,
      colors: ["#22c55e", "#16a34a", "#14b8a6", "#38bdf8", "#facc15"],
    });
  }, [isGameWon]);

  const handleGuess = () => {
    const numericGuess = Number(guess);
    if (isGameOver) return;
    if (!Number.isFinite(numericGuess) || numericGuess < 1 || numericGuess > 100) {
      setFeedback("Enter your guess between 1 and 100.");
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setPreviousGuesses((prev) => [...prev, numericGuess]);

    if (numericGuess === targetNumber) {
      setFeedback(`Correct! You got it in ${nextAttempts} attempt${nextAttempts === 1 ? "" : "s"}.`);
      setIsGameWon(true);
      setIsGameOver(true);
    } else if (numericGuess < targetNumber) {
      setFeedback("Too low. Try a higher number.");
    } else {
      setFeedback("Too high. Try a lower number.");
    }

    if (nextAttempts >= maxAttempts && numericGuess !== targetNumber) {
      setFeedback(`Out of attempts! The number was ${targetNumber}.`);
      setIsGameOver(true);
      setIsGameWon(false);
    }
  };

  const resetNumberGuessing = () => {
    setTargetNumber(Math.floor(Math.random() * 100) + 1);
    setGuess("");
    setAttempts(0);
    setFeedback("We picked a number between 1 and 100. Can you guess it?");
    setIsGameOver(false);
    setIsGameWon(false);
    setPreviousGuesses([]);
  };

  return (
    <Layout>
      <section
        className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-16"
        style={{ backgroundImage: `url(${ribbonAbstract})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-background/40" />
        <style>
          {`@keyframes draw-line { to { stroke-dashoffset: 0; } }`}
        </style>
        <div className="relative container px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" duration={900}>
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Play & Connect</p>
              <h1 className="mt-4 font-serif text-3xl lg:text-4xl font-bold text-foreground">Games for Elders</h1>
              <p className="mt-4 text-muted-foreground">
                Gentle, brain-friendly games designed for focus, fun, and sharing moments together.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={150} duration={900}>
            <div className="mt-10 flex flex-col items-center gap-4">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary">
                Hosla Premiere League
              </div>
              <div className="w-full max-w-md overflow-hidden rounded-3xl border border-primary/20 bg-background/80 shadow-lg">
                <img
                  src={hplPoster}
                  alt="Hosla Premiere League event poster"
                  className="h-auto w-full object-cover"
                  loading="lazy"
                />
                <div className="px-4 py-3 text-center text-sm text-muted-foreground">
                  Join us for the Hosla Premiere League — cheer, connect, and play together.
                </div>
              </div>
              <Button asChild size="lg" className="shadow-md">
                <a
                  href="https://forms.gle/LQvaRz7msRf4TQUx7"
                  target="_blank"
                  rel="noreferrer"
                >
                  https://forms.gle/LQvaRz7msRf4TQUx7
                </a>
              </Button>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={250} duration={900}>
            <div className="mt-12">
              <Tabs defaultValue="tic-tac-toe" className="w-full">
              <div className="flex justify-center">
                <TabsList className="bg-background shadow-sm flex-wrap h-auto gap-1 p-1">
                  <TabsTrigger value="tic-tac-toe">Tic Tac Toe</TabsTrigger>
                  <TabsTrigger value="number-guess">Number Guessing</TabsTrigger>
                  <TabsTrigger value="picture-word">Picture Match</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="tic-tac-toe">
                <Card className="mt-6 overflow-hidden border-primary/20 shadow-lg">
                  <CardHeader>
                    <CardTitle>Classic Tic Tac Toe</CardTitle>
                    <CardDescription>Take turns and enjoy a quick match together.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
                      <div className="w-full lg:hidden">
                        <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/30 p-3">
                          <Button
                            type="button"
                            size="sm"
                            variant={gameMode === "friend" ? "default" : "outline"}
                            onClick={() => {
                              setGameMode("friend");
                              resetTicTacToe();
                            }}
                          >
                            Play with Friend
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={gameMode === "computer" ? "default" : "outline"}
                            onClick={() => {
                              setGameMode("computer");
                              resetTicTacToe();
                            }}
                          >
                            Play with Computer
                          </Button>
                        </div>
                      </div>
                      <div className="w-full max-w-sm mx-auto rounded-3xl bg-[#780000] p-6 shadow-2xl">
                        <div className="relative grid grid-cols-3 gap-3">
                          {board.map((value, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleCellClick(index)}
                              className={cn(
                                "h-20 w-20 rounded-2xl border-2 text-3xl font-bold flex items-center justify-center transition-all duration-200 shadow-md",
                                value
                                  ? "border-[#fdf0d5] bg-[#fdf0d5]"
                                  : "border-[#fdf0d5]/60 text-[#fdf0d5] bg-[#780000] hover:bg-[#fdf0d5]/10",
                              )}
                              aria-label={`Cell ${index + 1}`}
                            >
                              <span
                                className={cn(
                                  "transition-colors",
                                  value === "X" ? "text-[#c1121f]" : "text-[#003049]",
                                )}
                              >
                                {value ?? ""}
                              </span>
                            </button>
                          ))}
                          {winner && winningLine && (
                            <svg
                              className="pointer-events-none absolute inset-0 h-full w-full"
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                            >
                              <line
                                x1={winningLine.x1}
                                y1={winningLine.y1}
                                x2={winningLine.x2}
                                y2={winningLine.y2}
                                stroke="#ef4444"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray="120"
                                strokeDashoffset="120"
                                style={{ animation: "draw-line 400ms ease-out forwards" }}
                              />
                            </svg>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 text-center lg:text-left">
                        <div className="hidden lg:flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 p-3">
                          <Button
                            type="button"
                            size="sm"
                            variant={gameMode === "friend" ? "default" : "outline"}
                            onClick={() => {
                              setGameMode("friend");
                              resetTicTacToe();
                            }}
                          >
                            Play with Friend
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={gameMode === "computer" ? "default" : "outline"}
                            onClick={() => {
                              setGameMode("computer");
                              resetTicTacToe();
                            }}
                          >
                            Play with Computer
                          </Button>
                        </div>
                        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                          {winner
                            ? `${winner} wins!`
                            : isDraw
                              ? "It's a draw."
                              : gameMode === "computer"
                                ? currentPlayer === "X"
                                  ? "Your turn"
                                  : "Computer's turn"
                                : `${currentPlayer}'s turn`}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tip: Try to block your opponent and aim for three in a row.
                        </p>
                        <Button onClick={resetTicTacToe} className="shadow-sm">
                          Reset Game
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="number-guess">
                <Card className="mt-6 overflow-hidden border-primary/20 shadow-lg">
                  <CardHeader>
                    <CardTitle>Number Guessing</CardTitle>
                    <CardDescription>We picked a number (1-100). Guess it before you run out of attempts.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
                      <div className="space-y-4">
                        <Label htmlFor="guess">Your guess</Label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Input
                            id="guess"
                            type="number"
                            min={1}
                            max={100}
                            value={guess}
                            onChange={(event) => setGuess(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                handleGuess();
                              }
                            }}
                            className="sm:max-w-[200px] text-lg font-semibold"
                            disabled={isGameOver}
                          />
                          <Button onClick={handleGuess} disabled={isGameOver} className="shadow-sm">
                            Submit
                          </Button>
                          <Button variant="outline" onClick={resetNumberGuessing}>
                            Reset
                          </Button>
                        </div>
                        <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                              Attempts: {attempts} / {maxAttempts}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-600">
                              Remaining: {remainingAttempts}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all",
                                isGameWon ? "bg-emerald-500" : "bg-primary",
                              )}
                              style={{ width: `${(remainingAttempts / maxAttempts) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Tip: Try to narrow the range with each guess.</p>
                          {previousGuesses.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground">Previous guesses</p>
                              <div className="flex flex-wrap gap-2">
                                {previousGuesses.map((value, index) => {
                                  const isCorrect = value === targetNumber;
                                  const isHigher = value > targetNumber;
                                  return (
                                    <span
                                      key={`${value}-${index}`}
                                      className={cn(
                                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                                        isCorrect
                                          ? "bg-emerald-500/15 text-emerald-700"
                                          : isHigher
                                            ? "bg-rose-500/10 text-rose-600"
                                            : "bg-sky-500/10 text-sky-600",
                                      )}
                                    >
                                      {value}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className={cn(
                          "rounded-2xl border border-dashed p-6 text-center transition-all shadow-inner",
                          isGameWon
                            ? "border-emerald-400/70 bg-emerald-500/10"
                            : isGameOver
                              ? "border-destructive/50 bg-destructive/10"
                              : "border-primary/40 bg-primary/5",
                        )}
                      >
                        <p className="text-lg font-semibold">{feedback}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {isGameOver
                            ? "Press reset to play again."
                            : "Invite a friend to guess together!"}
                        </p>
                        {!isGameOver && (
                          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                            <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2">
                              Guess range: 1-100
                            </div>
                            <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2">
                              Max attempts: {maxAttempts}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="picture-word">
                <div className="mt-6">
                  <PictureWordMatch />
                </div>
              </TabsContent>
              </Tabs>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
}
