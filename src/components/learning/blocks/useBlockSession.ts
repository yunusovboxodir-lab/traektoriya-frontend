import { useState, useCallback, useRef } from 'react';
import type { LessonBlock } from '../../../api/learning';

export interface BlockSession {
  currentIndex: number;
  correct: number;
  total: number;
  startTime: number;
  isComplete: boolean;
  advance: () => void;
  recordAnswer: (isCorrect: boolean) => void;
  getScore: () => number;
  getElapsedSeconds: () => number;
}

export function useBlockSession(blocks: LessonBlock[], onComplete: (score: number, timeSeconds: number) => void): BlockSession {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const startTimeRef = useRef(Date.now());

  const getScore = useCallback(() => {
    if (total === 0) return 100;
    return Math.round((correct / total) * 100);
  }, [correct, total]);

  const getElapsedSeconds = useCallback(() => {
    return Math.round((Date.now() - startTimeRef.current) / 1000);
  }, []);

  const advance = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= blocks.length) {
      setIsComplete(true);
      onComplete(getScore(), getElapsedSeconds());
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, blocks.length, onComplete, getScore, getElapsedSeconds]);

  const recordAnswer = useCallback((isCorrect: boolean) => {
    setTotal(prev => prev + 1);
    if (isCorrect) {
      setCorrect(prev => prev + 1);
    }
  }, []);

  return {
    currentIndex,
    correct,
    total,
    startTime: startTimeRef.current,
    isComplete,
    advance,
    recordAnswer,
    getScore,
    getElapsedSeconds,
  };
}
