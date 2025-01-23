import React, { useEffect, useState, useCallback } from 'react';
import { Play, Pause, RefreshCw, Settings, Trophy, Star, Zap, Crown, Waves, Shield } from 'lucide-react';

const COLORS = [
  '#8A2BE2',
  '#FF1493',
  '#4169E1',
  '#32CD32',
  '#FFD700',
];

const WAVE_PATTERNS = {
  NORMAL: 'normal',
  SPLIT: 'split',
  ZIGZAG: 'zigzag',
  CHAOS: 'chaos',
} as const;

type WavePattern = typeof WAVE_PATTERNS[keyof typeof WAVE_PATTERNS];

interface GridCellProps {
  isActive: boolean;
  color: string;
  onClick: () => void;
  isTarget?: boolean;
}

function App() {
  const [grid, setGrid] = useState<boolean[][]>([]);
  const [currentColor, setCurrentColor] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(100);
  const [direction, setDirection] = useState(1);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [targetCell, setTargetCell] = useState<{ row: number; col: number } | null>(null);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [wavePattern, setWavePattern] = useState<WavePattern>(WAVE_PATTERNS.NORMAL);
  const [difficulty, setDifficulty] = useState(1);
  const [powerUpActive, setPowerUpActive] = useState(false);

  const rows = 15;
  const cols = 20;
  const waveWidth = 6;

  const createEmptyGrid = useCallback(() => {
    return Array(rows).fill(null).map(() => Array(cols).fill(false));
  }, [rows, cols]);

  const initializeGrid = useCallback(() => {
    setGrid(createEmptyGrid());
    setScore(0);
    setLevel(1);
    setCombo(0);
    setLives(3);
    setGameOver(false);
    setSpeed(100);
    setWavePattern(WAVE_PATTERNS.NORMAL);
    setDifficulty(1);
    setPowerUpActive(false);
  }, [createEmptyGrid]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  const generateNewTarget = useCallback(() => {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    setTargetCell({ row, col });
  }, [rows, cols]);

  useEffect(() => {
    if (isPlaying && !gameOver) {
      generateNewTarget();
    }
  }, [isPlaying, gameOver, generateNewTarget]);

  const updateWavePattern = useCallback((position: number, newGrid: boolean[][]) => {
    switch (wavePattern) {
      case WAVE_PATTERNS.SPLIT:
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < waveWidth; j++) {
            const col1 = (position + j) % cols;
            const col2 = ((cols - 1) - (position + j)) % cols;
            newGrid[i][col1] = true;
            newGrid[i][col2] = true;
          }
        }
        break;

      case WAVE_PATTERNS.ZIGZAG:
        for (let i = 0; i < rows; i++) {
          const offset = Math.sin(i * 0.5) * 3;
          for (let j = 0; j < waveWidth; j++) {
            const col = Math.floor((position + j + offset + cols) % cols);
            if (col >= 0 && col < cols) {
              newGrid[i][col] = true;
            }
          }
        }
        break;

      case WAVE_PATTERNS.CHAOS:
        for (let i = 0; i < rows; i++) {
          const offset = Math.random() * 4 - 2;
          for (let j = 0; j < waveWidth; j++) {
            const col = Math.floor((position + j + offset + cols) % cols);
            if (col >= 0 && col < cols) {
              newGrid[i][col] = true;
            }
          }
        }
        break;

      default:
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < waveWidth; j++) {
            const col = direction === 1
              ? (position + j) % cols
              : ((cols - 1) - (position + j)) % cols;
            newGrid[i][col] = true;
          }
        }
    }
  }, [wavePattern, rows, cols, direction, waveWidth]);

  useEffect(() => {
    let intervalId: number;
    let colorIntervalId: number;
    let targetCheckId: number;
    let powerUpTimeoutId: number;

    if (isPlaying && !gameOver) {
      let position = 0;
      intervalId = window.setInterval(() => {
        setGrid(prevGrid => {
          const newGrid = Array(rows).fill(null).map(() => Array(cols).fill(false));
          updateWavePattern(position, newGrid);
          return newGrid;
        });

        position = (position + 1) % cols;

        if (position === 0) {
          setDirection(prev => prev * -1);
        }
      }, speed);

      colorIntervalId = window.setInterval(() => {
        setCurrentColor(prev => (prev + 1) % COLORS.length);
      }, 1500);

      targetCheckId = window.setInterval(() => {
        if (targetCell && !powerUpActive) {
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameOver(true);
              setHighScore(current => Math.max(current, score));
            }
            return newLives;
          });
          generateNewTarget();
        }
      }, 3000 / difficulty);


      powerUpTimeoutId = window.setInterval(() => {
        if (Math.random() < 0.1) {
          setPowerUpActive(true);
          setTimeout(() => setPowerUpActive(false), 5000);
        }
      }, 15000);
    }

    return () => {
      window.clearInterval(intervalId);
      window.clearInterval(colorIntervalId);
      window.clearInterval(targetCheckId);
      window.clearInterval(powerUpTimeoutId);
    };
  }, [isPlaying, speed, rows, cols, direction, gameOver, targetCell, generateNewTarget, score,
    updateWavePattern, difficulty, powerUpActive]);


  const handleCellClick = (row: number, col: number) => {
    if (!isPlaying || gameOver || !targetCell) return;

    if (row === targetCell.row && col === targetCell.col && grid[row][col]) {
      // Successful hit
      const basePoints = 100;
      const comboMultiplier = Math.min(combo + 1, 5);
      const levelMultiplier = level;
      const difficultyMultiplier = difficulty;
      const points = basePoints * comboMultiplier * levelMultiplier * difficultyMultiplier;

      setScore(prev => prev + points);
      setCombo(prev => prev + 1);


      if ((score + points) >= level * 1000) {
        setLevel(prev => {
          const newLevel = prev + 1;

          if (newLevel % 3 === 0) {
            setDifficulty(d => Math.min(d + 0.5, 3));
            setSpeed(s => Math.max(s * 0.9, 50));
          }
          if (newLevel % 5 === 0) {
            const patterns = Object.values(WAVE_PATTERNS);
            const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
            setWavePattern(randomPattern);
          }
          return newLevel;
        });
      }

      generateNewTarget();
    } else {

      setCombo(0);
      if (!powerUpActive) {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameOver(true);
            setHighScore(current => Math.max(current, score));
          }
          return newLives;
        });
      }
    }
  };

  const GridCell: React.FC<GridCellProps> = ({ isActive, color, onClick, isTarget }) => (
    <div
      onClick={onClick}
      className={`w-5 h-5 border border-gray-800 transition-all duration-150 cursor-pointer
        ${isActive ? 'scale-100' : 'scale-95'}
        ${isTarget ? 'animate-pulse' : ''}`}
      style={{
        backgroundColor: isActive ? color : '#1a1a1a',
        boxShadow: isTarget ? `0 0 10px ${color}` : 'none',
      }}
    />
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Wave Runner
            </h1>
            <p className="text-gray-400">Click the glowing cells in sync with the wave!</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
              disabled={gameOver}
            >
              {isPlaying ? (
                <>
                  <Pause size={18} /> Pause
                </>
              ) : (
                <>
                  <Play size={18} /> Play
                </>
              )}
            </button>
            <button
              onClick={initializeGrid}
              className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              <RefreshCw size={18} /> New Game
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-800">
              {gameOver ? (
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
                  <p className="text-xl mb-4">Final Score: {score}</p>
                  <button
                    onClick={initializeGrid}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Play Again
                  </button>
                </div>
              ) : (
                <div
                  className="grid gap-[2px]"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    maxWidth: 'fit-content',
                    margin: '0 auto'
                  }}
                >
                  {grid.map((row, i) =>
                    row.map((cell, j) => (
                      <GridCell
                        key={`${i}-${j}`}
                        isActive={cell}
                        color={COLORS[currentColor]}
                        onClick={() => handleCellClick(i, j)}
                        isTarget={targetCell?.row === i && targetCell?.col === j}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-72">
            <div className="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-800 mb-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500" />
                Score Board
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Score:</span>
                  <span className="text-2xl font-bold">{score}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">High Score:</span>
                  <span className="text-xl text-yellow-500">{highScore}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Level:</span>
                  <div className="flex items-center gap-1">
                    <Crown size={16} className="text-yellow-500" />
                    <span>{level}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Combo:</span>
                  <div className="flex items-center gap-1">
                    <Zap size={16} className="text-blue-500" />
                    <span>x{combo}</span>
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  {[...Array(lives)].map((_, i) => (
                    <Star key={i} size={20} className="text-red-500 fill-red-500" />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-800">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Settings size={20} />
                Game Stats
              </h2>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Waves size={16} />
                  <span>Pattern: {wavePattern}</span>
                </div>
                <p>Wave Speed: {Math.round(100 - (speed - 50) / 1.5)}%</p>
                <p>Difficulty: {difficulty.toFixed(1)}x</p>
                <p>Direction: {direction === 1 ? 'Right' : 'Left'}</p>
                <p>Points Multiplier: x{Math.min(combo + 1, 5) * level * difficulty}</p>
                {powerUpActive && (
                  <div className="flex items-center gap-2 text-green-400">
                    <Shield size={16} />
                    <span>Shield Active!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;


