import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { Clock, Trophy, Star, RefreshCw, CheckCircle2, XCircle, Zap, Volume2, VolumeX } from "lucide-react";
import { useGameSounds } from "@/hooks/use-game-sounds";
import { GameRound, getRandomGameSet, getCategoryInfo } from "./gameData";

type GameState = "idle" | "playing" | "roundEnd" | "gameOver";

export function PictureWordMatch() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [currentRounds, setCurrentRounds] = useState<GameRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [roundResults, setRoundResults] = useState<{ correct: boolean; points: number; timeTaken: number }[]>([]);
  const [streak, setStreak] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const lastTimeRef = useRef<number>(0);

  const { 
    playCorrect, 
    playWrong, 
    playTick, 
    playUrgentTick, 
    playVictory, 
    playGameStart 
  } = useGameSounds();

  const currentRound = currentRounds[currentRoundIndex];
  const totalRounds = currentRounds.length;
  const maxPossibleScore = currentRounds.reduce((sum, r) => sum + r.points, 0);

  // Timer effect with sound
  useEffect(() => {
    if (gameState !== "playing" || timeLeft <= 0 || !currentRound) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAnswer(null);
          return 0;
        }
        
        // Play tick sound
        if (soundEnabled && prev !== lastTimeRef.current) {
          if (prev <= 4) {
            playUrgentTick();
          } else {
            playTick();
          }
        }
        lastTimeRef.current = prev - 1;
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft, currentRound, soundEnabled, playTick, playUrgentTick]);

  const startGame = useCallback(() => {
    const newRounds = getRandomGameSet();
    setCurrentRounds(newRounds);
    setCurrentRoundIndex(0);
    setScore(0);
    setRoundResults([]);
    setStreak(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTimeLeft(newRounds[0].timeLimit);
    lastTimeRef.current = newRounds[0].timeLimit;
    setGameState("playing");
    
    if (soundEnabled) {
      playGameStart();
    }
  }, [soundEnabled, playGameStart]);

  const handleAnswer = useCallback((answer: string | null) => {
    if (gameState !== "playing" || !currentRound) return;

    const isAnswerCorrect = answer === currentRound.correctAnswer;
    const timeTaken = currentRound.timeLimit - timeLeft;
    
    setSelectedAnswer(answer);
    setIsCorrect(isAnswerCorrect);
    setGameState("roundEnd");

    if (isAnswerCorrect) {
      const timeBonus = Math.floor((timeLeft / currentRound.timeLimit) * 5);
      const streakBonus = streak >= 2 ? Math.floor(currentRound.points * 0.1 * streak) : 0;
      const totalPoints = currentRound.points + timeBonus + streakBonus;
      
      setScore((prev) => prev + totalPoints);
      setStreak((prev) => prev + 1);
      setRoundResults((prev) => [...prev, { correct: true, points: totalPoints, timeTaken }]);

      if (soundEnabled) {
        playCorrect();
      }

      confetti({
        particleCount: 80 + streak * 20,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#22c55e", "#16a34a", "#14b8a6", "#38bdf8", "#facc15"],
      });
    } else {
      setStreak(0);
      setRoundResults((prev) => [...prev, { correct: false, points: 0, timeTaken }]);
      
      if (soundEnabled) {
        playWrong();
      }
    }
  }, [gameState, currentRound, timeLeft, streak, soundEnabled, playCorrect, playWrong]);

  const nextRound = useCallback(() => {
    if (currentRoundIndex < totalRounds - 1) {
      const nextIndex = currentRoundIndex + 1;
      setCurrentRoundIndex(nextIndex);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setTimeLeft(currentRounds[nextIndex].timeLimit);
      lastTimeRef.current = currentRounds[nextIndex].timeLimit;
      setGameState("playing");
    } else {
      setGameState("gameOver");
      
      if (soundEnabled) {
        playVictory();
      }
      
      if (score > maxPossibleScore * 0.6) {
        const duration = 2000;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ["#22c55e", "#16a34a", "#facc15"],
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#22c55e", "#16a34a", "#facc15"],
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
      }
    }
  }, [currentRoundIndex, totalRounds, currentRounds, score, maxPossibleScore, soundEnabled, playVictory]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
      case "medium": return "bg-amber-500/20 text-amber-700 border-amber-500/30";
      case "hard": return "bg-rose-500/20 text-rose-700 border-rose-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getScoreGrade = () => {
    const percentage = (score / maxPossibleScore) * 100;
    if (percentage >= 90) return { grade: "A+", message: "Outstanding! You're a word wizard!", color: "text-emerald-600" };
    if (percentage >= 75) return { grade: "A", message: "Excellent work! Very impressive!", color: "text-emerald-500" };
    if (percentage >= 60) return { grade: "B", message: "Great job! Keep practicing!", color: "text-blue-500" };
    if (percentage >= 40) return { grade: "C", message: "Good effort! Try again!", color: "text-amber-500" };
    return { grade: "D", message: "Keep trying! Practice makes perfect!", color: "text-rose-500" };
  };

  const isImageSource = (value: string) => {
    if (!value) return false;
    return (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/") ||
      /\.(png|jpe?g|webp|gif|svg)$/i.test(value)
    );
  };

  // Idle state - Show start screen
  if (gameState === "idle") {
    return (
      <Card className="overflow-hidden border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🖼️</span>
                Picture to Word Match
              </CardTitle>
              <CardDescription>Match images with the correct words. Test your visual memory!</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="shrink-0"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-2xl">
              {["🍎", "🏠", "🚢"].map((emoji, i) => (
                <div key={i} className="aspect-square rounded-xl bg-background shadow-sm flex items-center justify-center text-4xl">
                  {emoji}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">How to Play</h3>
              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  <span>Look at the picture and choose the matching word</span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                  <span>Answer quickly for bonus points!</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 text-violet-500 shrink-0" />
                  <span>Build streaks for extra points!</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", getDifficultyColor("easy"))}>
                Easy: 10 pts
              </span>
              <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", getDifficultyColor("medium"))}>
                Medium: 20 pts
              </span>
              <span className={cn("px-3 py-1 rounded-full text-xs font-medium border", getDifficultyColor("hard"))}>
                Hard: 25 pts
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Categories include: Fruits, Animals, Vehicles, Sports, Music, Indian Food & more!
            </p>

            <Button size="lg" onClick={startGame} className="w-full max-w-xs shadow-lg">
              <Star className="mr-2 h-5 w-5" />
              Start Game
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Game Over state
  if (gameState === "gameOver") {
    const { grade, message, color } = getScoreGrade();
    const correctCount = roundResults.filter(r => r.correct).length;
    const category = getCategoryInfo(currentRounds);

    return (
      <Card className="overflow-hidden border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              Game Complete!
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
          <CardDescription>Category: {category}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="relative">
              <div className={cn("text-7xl font-bold", color)}>{grade}</div>
              <p className="mt-2 text-muted-foreground">{message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <div className="text-3xl font-bold text-primary">{score}</div>
                <div className="text-xs text-muted-foreground">Total Points</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                <div className="text-3xl font-bold text-emerald-600">{correctCount}/{totalRounds}</div>
                <div className="text-xs text-muted-foreground">Correct Answers</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Round Breakdown</h4>
              <div className="flex justify-center gap-2">
                {roundResults.map((result, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
                      result.correct 
                        ? "bg-emerald-500/20 text-emerald-700" 
                        : "bg-rose-500/20 text-rose-700"
                    )}
                  >
                    {result.correct ? result.points : "✗"}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={startGame} className="shadow-sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Play Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Playing / Round End states
  if (!currentRound) return null;

  return (
    <Card className="overflow-hidden border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Round {currentRoundIndex + 1}/{totalRounds}</CardTitle>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", getDifficultyColor(currentRound.difficulty))}>
              {currentRound.difficulty}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {currentRound.category}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            {streak >= 2 && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-500/20 text-violet-700 text-xs font-semibold animate-pulse">
                <Zap className="h-3 w-3" />
                {streak}x Streak!
              </span>
            )}
            <span className="flex items-center gap-1 font-semibold text-primary">
              <Trophy className="h-4 w-4" />
              {score} pts
            </span>
          </div>
        </div>
        
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Time remaining
            </span>
            <span className={cn("font-mono font-bold", timeLeft <= 3 && gameState === "playing" ? "text-rose-500 animate-pulse" : "")}>
              {timeLeft}s
            </span>
          </div>
          <Progress 
            value={(timeLeft / currentRound.timeLimit) * 100} 
            className="h-2"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="max-w-lg mx-auto space-y-6">
          <div className={cn(
            "relative aspect-square max-w-[200px] mx-auto rounded-2xl flex items-center justify-center transition-all duration-300",
            "bg-gradient-to-br from-muted/50 to-muted shadow-lg border-2",
            gameState === "roundEnd" && isCorrect && "border-emerald-500 shadow-emerald-500/20",
            gameState === "roundEnd" && !isCorrect && "border-rose-500 shadow-rose-500/20",
            gameState === "playing" && "border-primary/20"
          )}>
            {isImageSource(currentRound.image) ? (
              <img
                src={currentRound.image}
                alt={currentRound.correctAnswer}
                className="h-full w-full rounded-2xl object-contain p-4"
                loading="lazy"
              />
            ) : (
              <span className="text-8xl sm:text-9xl select-none">{currentRound.image}</span>
            )}
            
            {gameState === "roundEnd" && (
              <div className={cn(
                "absolute inset-0 rounded-2xl flex items-center justify-center",
                isCorrect ? "bg-emerald-500/10" : "bg-rose-500/10"
              )}>
                {isCorrect ? (
                  <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-scale-in" />
                ) : (
                  <XCircle className="h-16 w-16 text-rose-500 animate-scale-in" />
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {currentRound.options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === currentRound.correctAnswer;
              const showResult = gameState === "roundEnd";

              return (
                <button
                  key={option}
                  onClick={() => gameState === "playing" && handleAnswer(option)}
                  disabled={gameState !== "playing"}
                  className={cn(
                    "relative p-4 rounded-xl text-lg font-semibold transition-all duration-200",
                    "border-2 shadow-sm hover:shadow-md",
                    !showResult && "bg-background hover:bg-muted/50 border-border/60 hover:border-primary/40",
                    !showResult && "active:scale-95",
                    showResult && isCorrectOption && "bg-emerald-500/20 border-emerald-500 text-emerald-700",
                    showResult && isSelected && !isCorrectOption && "bg-rose-500/20 border-rose-500 text-rose-700",
                    showResult && !isSelected && !isCorrectOption && "opacity-50",
                    gameState !== "playing" && "cursor-default"
                  )}
                >
                  {option}
                  {showResult && isCorrectOption && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600" />
                  )}
                  {showResult && isSelected && !isCorrectOption && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-rose-600" />
                  )}
                </button>
              );
            })}
          </div>

          {gameState === "roundEnd" && (
            <div className="text-center space-y-4 animate-fade-in">
              <p className={cn("text-lg font-semibold", isCorrect ? "text-emerald-600" : "text-rose-600")}>
                {isCorrect 
                  ? `Correct! +${roundResults[roundResults.length - 1]?.points || 0} points` 
                  : `The answer was: ${currentRound.correctAnswer}`}
              </p>
              <Button onClick={nextRound} className="shadow-sm">
                {currentRoundIndex < totalRounds - 1 ? "Next Round" : "See Results"}
              </Button>
            </div>
          )}

          <div className="flex justify-center gap-2 pt-2">
            {currentRounds.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  i < currentRoundIndex && roundResults[i]?.correct && "bg-emerald-500",
                  i < currentRoundIndex && !roundResults[i]?.correct && "bg-rose-500",
                  i === currentRoundIndex && "bg-primary ring-2 ring-primary/30",
                  i > currentRoundIndex && "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
