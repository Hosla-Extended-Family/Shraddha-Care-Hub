import { useCallback, useRef, useEffect } from "react";

// Audio context for generating sounds
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export function useGameSounds() {
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play a success/correct answer sound
  const playCorrect = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Pleasant ascending arpeggio
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.log("Audio not supported");
    }
  }, []);

  // Play a wrong answer sound
  const playWrong = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Low buzzer sound
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(150, ctx.currentTime);
      oscillator.frequency.setValueAtTime(100, ctx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.01, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log("Audio not supported");
    }
  }, []);

  // Play a single tick sound
  const playTick = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.01, ctx.currentTime + 0.05);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.log("Audio not supported");
    }
  }, []);

  // Play urgent tick (for last few seconds)
  const playUrgentTick = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.01, ctx.currentTime + 0.08);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.log("Audio not supported");
    }
  }, []);

  // Play victory fanfare
  const playVictory = useCallback(() => {
    try {
      const ctx = getAudioContext();
      
      // Play a celebratory ascending melody
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const durations = [0.15, 0.15, 0.15, 0.4];
      let time = ctx.currentTime;

      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(freq, time);

        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.setValueAtTime(0.01, time + durations[i] - 0.02);

        oscillator.start(time);
        oscillator.stop(time + durations[i]);

        time += durations[i];
      });
    } catch (e) {
      console.log("Audio not supported");
    }
  }, []);

  // Play game start sound
  const playGameStart = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, ctx.currentTime);
      oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.01, ctx.currentTime + 0.2);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.log("Audio not supported");
    }
  }, []);

  // Start ticking timer
  const startTicking = useCallback((isUrgent: boolean = false) => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
    }
    
    const tickFn = isUrgent ? playUrgentTick : playTick;
    tickFn();
    
    tickIntervalRef.current = setInterval(() => {
      tickFn();
    }, 1000);
  }, [playTick, playUrgentTick]);

  // Stop ticking
  const stopTicking = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, []);

  return {
    playCorrect,
    playWrong,
    playTick,
    playUrgentTick,
    playVictory,
    playGameStart,
    startTicking,
    stopTicking,
  };
}
