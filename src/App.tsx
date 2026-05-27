import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { synth } from './audio';

const INITIAL_BOARD = [
  2, 2, 2, 2, // Row 0 (AI - Black)
  0, 0, 0, 0,
  0, 0, 0, 0,
  1, 1, 1, 1  // Row 3 (Player - White)
];

type PieceType = { id: string, type: 1 | 2, pos: number };

const INITIAL_PIECES: PieceType[] = [
  { id: 'b0', type: 2, pos: 0 },
  { id: 'b1', type: 2, pos: 1 },
  { id: 'b2', type: 2, pos: 2 },
  { id: 'b3', type: 2, pos: 3 },
  { id: 'w0', type: 1, pos: 12 },
  { id: 'w1', type: 1, pos: 13 },
  { id: 'w2', type: 1, pos: 14 },
  { id: 'w3', type: 1, pos: 15 },
];

const WINNING_LINES = [
  [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], // Rows
  [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], // Cols
  [0, 5, 10, 15], [3, 6, 9, 12] // Diagonals
];

function getValidMoves(board: number[], playerColor: number) {
  let moves = [];
  for (let i = 0; i < 16; i++) {
    if (board[i] === playerColor) {
      let r = Math.floor(i / 4);
      let c = i % 4;
      if (r > 0 && board[i - 4] === 0) moves.push({ from: i, to: i - 4 });
      if (r < 3 && board[i + 4] === 0) moves.push({ from: i, to: i + 4 });
      if (c > 0 && board[i - 1] === 0) moves.push({ from: i, to: i - 1 });
      if (c < 3 && board[i + 1] === 0) moves.push({ from: i, to: i + 1 });
    }
  }
  return moves;
}

function checkWinSilent(board: number[]) {
  for (let line of WINNING_LINES) {
    if (board[line[0]] === 2 && board[line[1]] === 2 && board[line[2]] === 2 && board[line[3]] === 2) {
      if (line[0] !== 0 || line[1] !== 1 || line[2] !== 2 || line[3] !== 3) return 2;
    }
    if (board[line[0]] === 1 && board[line[1]] === 1 && board[line[2]] === 1 && board[line[3]] === 1) {
      if (line[0] !== 12 || line[1] !== 13 || line[2] !== 14 || line[3] !== 15) return 1;
    }
  }
  return 0;
}

function evaluateLines(board: number[]) {
  let score = 0;
  for (let line of WINNING_LINES) {
    let aiCount = 0;
    let plCount = 0;
    for (let i of line) {
      if (board[i] === 2) aiCount++;
      else if (board[i] === 1) plCount++;
    }
    if (aiCount === 3 && plCount === 0) score += 50;
    else if (aiCount === 2 && plCount === 0) score += 10;
    else if (aiCount === 1 && plCount === 0) score += 2;
    
    if (plCount === 3 && aiCount === 0) score -= 50;
    else if (plCount === 2 && aiCount === 0) score -= 10;
    else if (plCount === 1 && aiCount === 0) score -= 2;
  }
  return score;
}

function evaluate(board: number[]) {
  let winner = checkWinSilent(board);
  if (winner === 2) return 1000;
  if (winner === 1) return -1000;

  let score = 0;
  const centerNodes = [5, 6, 9, 10];
  for (let i of centerNodes) {
    if (board[i] === 2) score += 5;
    if (board[i] === 1) score -= 5;
  }
  score += evaluateLines(board);
  return score;
}

function minimax(board: number[], depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
  let winner = checkWinSilent(board);
  if (winner === 2) return 1000 + depth;
  if (winner === 1) return -1000 - depth;

  if (depth === 0) return evaluate(board);

  if (isMaximizing) {
    let maxEval = -Infinity;
    const moves = getValidMoves(board, 2);
    if (moves.length === 0) return 0;
    for (let i = 0; i < moves.length; i++) {
      let m = moves[i];
      board[m.from] = 0; board[m.to] = 2;
      let ev = minimax(board, depth - 1, alpha, beta, false);
      board[m.from] = 2; board[m.to] = 0;

      if (ev > maxEval) maxEval = ev;
      if (ev > alpha) alpha = ev;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    const moves = getValidMoves(board, 1);
    if (moves.length === 0) return 0;
    for (let i = 0; i < moves.length; i++) {
      let m = moves[i];
      board[m.from] = 0; board[m.to] = 1;
      let ev = minimax(board, depth - 1, alpha, beta, true);
      board[m.from] = 1; board[m.to] = 0;

      if (ev < minEval) minEval = ev;
      if (ev < beta) beta = ev;
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getBestMove(board: number[], level: number) {
  let depth = 5;
  if (level > 4) depth = 6;
  if (level > 9) depth = 7;
  if (level > 14) depth = 8;

  let bestScore = -Infinity;
  let bestMove = null;
  const moves = getValidMoves(board, 2);

  moves.sort(() => Math.random() - 0.5);

  for (let m of moves) {
    board[m.from] = 0;
    board[m.to] = 2;
    let score = minimax(board, depth - 1, -Infinity, Infinity, false);
    board[m.from] = 2;
    board[m.to] = 0;

    if (score > bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }
  return bestMove;
}

const RetroButton = ({ children, onClick, disabled = false, color = 'green', className = '' }: any) => {
  const colors: Record<string, string> = {
    green: 'border-[#39ff14] text-[#39ff14] hover:shadow-[0_0_15px_#39ff14,inset_0_0_10px_#39ff14]',
    red: 'border-[#ff073a] text-[#ff073a] hover:shadow-[0_0_15px_#ff073a,inset_0_0_10px_#ff073a]',
    yellow: 'border-[#ffff00] text-[#ffff00] hover:shadow-[0_0_15px_#ffff00,inset_0_0_10px_#ffff00]',
    cyan: 'border-[#00ffff] text-[#00ffff] hover:shadow-[0_0_15px_#00ffff,inset_0_0_10px_#00ffff]',
    gray: 'border-gray-500 text-gray-500',
  };
  const baseColors: Record<string, string> = {
    green: 'rgba(57,255,20,0.1)',
    red: 'rgba(255,7,58,0.1)',
    yellow: 'rgba(255,255,0,0.1)',
    cyan: 'rgba(0,255,255,0.1)',
    gray: 'transparent',
  }
  const c = disabled ? colors.gray : (colors[color] || colors.green);
  const hoverBg = disabled ? baseColors.gray : (baseColors[color] || baseColors.green);
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`font-pixel w-full px-4 py-4 text-center border-4 transition-all duration-300 ${c}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'active:scale-95 font-bold'} ${className}`}
      style={!disabled ? { 
        textShadow: `0 0 5px currentColor`,
        boxShadow: disabled ? 'none' : '0 0 5px currentColor',
      } : {}}
      onMouseEnter={(e) => { !disabled && (e.currentTarget.style.backgroundColor = hoverBg) }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {children}
    </button>
  );
};

function Game({ level, onBack, onWin }: { level: number, onBack: () => void, onWin: (lvl: number) => void }) {
  const [board, setBoard] = useState<number[]>([...INITIAL_BOARD]);
  const [pieces, setPieces] = useState<PieceType[]>([...INITIAL_PIECES]);
  const [turn, setTurn] = useState<number>(1);
  const [playerMoves, setPlayerMoves] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [status, setStatus] = useState<'playing' | 'win' | 'lose'>('playing');
  const [message, setMessage] = useState<string>('');
  const [history, setHistory] = useState<{board: number[], pieces: PieceType[], playerMoves: number}[]>([]);

  useEffect(() => {
    if (status !== 'playing') return;

    const moves = getValidMoves(board, turn);
    if (moves.length === 0) {
      const oppMoves = getValidMoves(board, turn === 1 ? 2 : 1);
      if (oppMoves.length === 0) {
        setStatus('lose');
        setMessage('双方死锁，平局结束！');
        return;
      }
      setMessage(turn === 1 ? '你被卡住无法移动，跳过回合！' : '电脑无法移动，跳过回合！');
      const timer = setTimeout(() => {
        setMessage('');
        setTurn(turn === 1 ? 2 : 1);
      }, 1500);
      return () => clearTimeout(timer);
    }

    if (turn === 2 && status === 'playing') {
      const timer = setTimeout(() => {
        let aiTarget = getBestMove([...board], level);
        if (aiTarget) {
          let newBoard = [...board];
          newBoard[aiTarget.from] = 0;
          newBoard[aiTarget.to] = 2;
          
          setPieces(prev => prev.map(p => p.pos === aiTarget!.from ? { ...p, pos: aiTarget!.to } : p));
          setBoard(newBoard);
          synth.playMoveSound();

          let winner = checkWinSilent(newBoard);
          if (winner === 2) {
            setStatus('lose');
            setMessage('黑方（电脑）四子连线，你输了！');
          } else {
            setMessage('');
            setTurn(1);
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [turn, status, board, level]);

  const handleNodeClick = (i: number) => {
    if (turn !== 1 || status !== 'playing') return;

    if (board[i] === 1) {
      setSelectedNode(i);
      return;
    }

    if (selectedNode !== null && board[i] === 0) {
      let r1 = Math.floor(selectedNode / 4);
      let c1 = selectedNode % 4;
      let r2 = Math.floor(i / 4);
      let c2 = i % 4;

      let isAdjacent = (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);
      if (!isAdjacent) return;

      let newBoard = [...board];
      newBoard[selectedNode] = 0;
      newBoard[i] = 1;
      let newMoves = playerMoves + 1;

      setHistory(prev => [...prev, {
        board: [...board],
        pieces: [...pieces],
        playerMoves
      }]);

      setPieces(prev => prev.map(p => p.pos === selectedNode ? { ...p, pos: i } : p));
      setPlayerMoves(newMoves);
      setBoard(newBoard);
      setSelectedNode(null);
      synth.playMoveSound();

      let winner = checkWinSilent(newBoard);
      if (winner === 1) {
        setStatus('win');
        setMessage(`系统破解成功！\n你用了 ${newMoves} 步将死了电脑！成功通过第 ${level} 关！`);
      } else {
        setMessage('');
        setTurn(2);
      }
    }
  };

  const resetGame = () => {
    setBoard([...INITIAL_BOARD]);
    setPieces([...INITIAL_PIECES]);
    setTurn(1);
    setPlayerMoves(0);
    setSelectedNode(null);
    setStatus('playing');
    setMessage('');
    setHistory([]);
  };

  const undoMove = () => {
    if (history.length === 0 || status !== 'playing' || turn !== 1) return;
    const previous = history[history.length - 1];
    setBoard(previous.board);
    setPieces(previous.pieces);
    setPlayerMoves(previous.playerMoves);
    setSelectedNode(null);
    setHistory(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="flex justify-between items-end w-[320px] h-[64px] mb-4 shrink-0">
        <div className="flex flex-col justify-end h-full">
          <h2 className="text-xl font-pixel mb-2 text-[#00ffff] leading-none" style={{ textShadow: '0 0 5px #00ffff' }}>第 {level} 关</h2>
          <div className="text-[10px] font-pixel border border-[#39ff14] text-[#39ff14] px-2 py-1 inline-block whitespace-nowrap" style={{ boxShadow: '0 0 5px #39ff14, inset 0 0 5px #39ff14', textShadow: '0 0 5px #39ff14' }}>
            {turn === 1 && status === 'playing' ? '> 你的回合' : '> 电脑思考中...'}
          </div>
        </div>
        <div className="text-right font-pixel flex flex-col justify-end h-full text-[#39ff14]" style={{ textShadow: `0 0 5px currentColor` }}>
          <div className="text-[10px] text-gray-400 mb-2 leading-none tracking-widest text-right">步数</div>
          <div className="text-2xl leading-none">{playerMoves}</div>
        </div>
      </div>

      <div className="relative border-4 border-[#ff073a] bg-[#0d0e15] mb-6 select-none" style={{ width: 320, height: 320, boxShadow: '0 0 15px #ff073a, inset 0 0 15px #ff073a' }}>
        {/* Grid Background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 320">
          <defs>
            <linearGradient id="gridGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff073a" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#39ff14" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#00ffff" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={320} height={320} fill="url(#gridGlow)" />
          {[0, 1, 2, 3].map(i => (
            <line key={`h-${i}`} x1="40" y1={40 + i * 80} x2="280" y2={40 + i * 80} stroke="#ff073a" strokeWidth="2" strokeOpacity="0.5" style={{ filter: 'drop-shadow(0 0 3px #ff073a)' }} />
          ))}
          {[0, 1, 2, 3].map(i => (
            <line key={`v-${i}`} x1={40 + i * 80} y1="40" x2={40 + i * 80} y2="280" stroke="#ff073a" strokeWidth="2" strokeOpacity="0.5" style={{ filter: 'drop-shadow(0 0 3px #ff073a)' }} />
          ))}
        </svg>

        {board.map((stone, i) => {
          let r = Math.floor(i / 4);
          let c = i % 4;
          let x = 40 + c * 80;
          let y = 40 + r * 80;

          let isValidTarget = false;
          if (selectedNode !== null && stone === 0) {
            let sr = Math.floor(selectedNode / 4);
            let sc = selectedNode % 4;
            if ((Math.abs(sr - r) === 1 && sc === c) || (Math.abs(sc - c) === 1 && sr === r)) {
              isValidTarget = true;
            }
          }

          return (
            <div
              key={`node-${i}`}
              className={`absolute flex items-center justify-center cursor-pointer ${isValidTarget ? 'z-20' : 'z-10'}`}
              style={{ left: x, top: y, width: 48, height: 48, transform: 'translate(-50%, -50%)' }}
              onClick={() => handleNodeClick(i)}
            >
              <div className="w-2 h-2 bg-[#ff073a] opacity-50 rounded-full pointer-events-none absolute" style={{ boxShadow: '0 0 5px #ff073a' }} />

              {isValidTarget && turn === 1 && (
                <>
                  <div className="absolute w-10 h-10 bg-transparent rounded-none border border-[#39ff14] animate-pulse opacity-60 pointer-events-none" style={{ boxShadow: '0 0 10px #39ff14, inset 0 0 10px #39ff14' }} />
                </>
              )}
            </div>
          )
        })}

        {pieces.map(piece => {
          let r = Math.floor(piece.pos / 4);
          let c = piece.pos % 4;
          let x = 40 + c * 80;
          let y = 40 + r * 80;

          let isSelected = selectedNode === piece.pos;

          return (
            <motion.div
              key={piece.id}
              initial={false}
              animate={{ x, y }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className={`absolute flex items-center justify-center z-30 ${piece.type === 1 && turn === 1 && status === 'playing' ? 'cursor-pointer' : ''}`}
              style={{ left: 0, top: 0, width: 48, height: 48, marginLeft: -24, marginTop: -24 }}
              onClick={(e) => { e.stopPropagation(); handleNodeClick(piece.pos); }}
            >
              {piece.type === 1 && (
                <div className={`absolute w-10 h-10 border-2 border-[#39ff14] bg-[#1a1c29] transition-transform flex items-center justify-center ${isSelected ? 'scale-110 translate-y-[-2px]' : ''}`} style={{ boxShadow: isSelected ? '0 0 20px #39ff14, inset 0 0 10px #39ff14' : '0 0 5px #39ff14, inset 0 0 5px #39ff14' }}>
                  <div className="w-4 h-4 bg-[#39ff14]" style={{ boxShadow: '0 0 10px #39ff14' }} />
                </div>
              )}
              {piece.type === 2 && (
                <div className="absolute w-10 h-10 border-2 border-[#ff073a] bg-[#1a1c29] flex items-center justify-center transition-transform" style={{ boxShadow: '0 0 5px #ff073a, inset 0 0 5px #ff073a' }}>
                  <div className="w-4 h-4 border-2 border-[#ff073a] rotate-45" style={{ boxShadow: '0 0 10px #ff073a' }} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="h-[64px] w-[320px] mb-2 flex flex-col justify-center shrink-0">
        <div className="flex gap-4 w-full mb-2">
          <RetroButton onClick={undoMove} disabled={history.length === 0 || status !== 'playing' || turn !== 1} color="yellow" className="py-2 text-[10px]">悔棋 ↶</RetroButton>
          <RetroButton onClick={resetGame} color="cyan" className="py-2 text-[10px]">重新开始 ↻</RetroButton>
        </div>
        
        {message && status === 'playing' && (
          <div className="border border-[#00ffff] bg-[#00ffff]/10 p-2 font-pixel text-center w-full text-[10px] text-[#00ffff] leading-relaxed" style={{ textShadow: '0 0 5px #00ffff', boxShadow: '0 0 10px #00ffff, inset 0 0 5px #00ffff' }}>
            {message}
          </div>
        )}
      </div>

      {status !== 'playing' && (
        <div className="absolute inset-0 bg-[#0d0e15]/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className={`bg-[#0d0e15] border-[3px] p-8 flex flex-col items-center text-center max-w-[340px] w-full ${status==='win'? 'border-[#39ff14]' : 'border-[#ff073a]'}`} style={{ boxShadow: `0 0 20px ${status==='win' ? '#39ff14' : '#ff073a'}, inset 0 0 20px ${status==='win' ? '#39ff14' : '#ff073a'}` }}>
            <h3 className={`text-2xl font-pixel mb-4 ${status === 'win' ? 'text-[#39ff14]' : 'text-[#ff073a]'}`} style={{ textShadow: `0 0 10px currentColor` }}>
              {status === 'win' ? '系统破解！挑战成功' : '协议失败！再接再厉'}
            </h3>
            <p className="font-cyber text-xl mb-8 whitespace-pre-wrap text-[#00ffff]" style={{ textShadow: '0 0 5px #00ffff' }}>{message}</p>
            <div className="flex flex-col gap-4 w-full">
              {status === 'win' && level < 20 && (
                <RetroButton onClick={() => onWin(level)} color="green">
                  进入下一关 ➔
                </RetroButton>
              )}
              {status === 'win' && level === 20 && (
                <RetroButton onClick={() => onWin(level)} color="yellow">
                  🎉 全部通关！
                </RetroButton>
              )}
              {status === 'lose' && (
                <RetroButton onClick={resetGame} color="green">再试一次 ↺</RetroButton>
              )}
              <RetroButton onClick={onBack} color="red">
                返回菜单
              </RetroButton>
            </div>
          </div>
        </div>
      )}

      <div className="w-[320px]">
        <RetroButton onClick={onBack} color="red" className="w-full text-xs">放弃任务</RetroButton>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<'menu' | 'levels' | 'game'>('menu');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    return parseInt(localStorage.getItem('pixelFourUnlocked') || '1');
  });
  const [bgmOn, setBgmOn] = useState(false);
  const [sfxOn, setSfxOn] = useState(true);
  const [volume, setVolume] = useState(50);

  const toggleBgm = () => {
    synth.toggleBgm();
    setBgmOn(synth.bgmOn);
  };
  
  const toggleSfx = () => {
    synth.toggleSfx();
    setSfxOn(synth.sfxOn);
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    synth.setVolume(val / 100);
  };

  const handleWin = (wonLevel: number) => {
    if (wonLevel === unlockedLevel && wonLevel < 20) {
      setUnlockedLevel(wonLevel + 1);
      localStorage.setItem('pixelFourUnlocked', (wonLevel + 1).toString());
    }
    if (wonLevel < 20) {
      setCurrentLevel(wonLevel + 1);
    } else {
      setView('levels');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-8 font-pixel select-none overflow-hidden transition-colors duration-500">
      
      {/* Heavy stylized pixel borders reset */}
      <style>{`
        * { box-sizing: border-box; }
      `}</style>
      
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <button 
            onClick={toggleBgm}
            className={`px-3 py-1 font-cyber transition-all text-xs border-2 ${bgmOn ? 'text-[#00ffff] border-[#00ffff] hover:bg-[#00ffff]/20' : 'text-gray-500 border-gray-500 hover:bg-gray-800'}`}
            style={bgmOn ? { textShadow: '0 0 5px #00ffff', boxShadow: '0 0 5px #00ffff' } : {}}
          >
            {bgmOn ? '■ 音乐: 开' : '▶ 音乐: 关'}
          </button>
          <button 
            onClick={toggleSfx}
            className={`px-3 py-1 font-cyber transition-all text-xs border-2 ${sfxOn ? 'text-[#39ff14] border-[#39ff14] hover:bg-[#39ff14]/20' : 'text-gray-500 border-gray-500 hover:bg-gray-800'}`}
            style={sfxOn ? { textShadow: '0 0 5px #39ff14', boxShadow: '0 0 5px #39ff14' } : {}}
          >
            {sfxOn ? '■ 音效: 开' : '▶ 音效: 关'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#00ffff] font-cyber">音量</span>
          <input 
            type="range" 
            min="0" max="100" 
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-gray-700 appearance-none outline-none accent-[#00ffff]"
            style={{ boxShadow: '0 0 5px #00ffff' }}
          />
        </div>
      </div>

      {view === 'menu' && (
        <div className="flex flex-col items-center mt-6 w-full max-w-[480px]">
          <h1 className="text-7xl font-sans italic font-black mb-2 text-[#fff] tracking-widest text-center" style={{ textShadow: '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 80px #00ffff, 0 0 90px #00ffff', fontFamily: "'Arial Black', sans-serif" }}>
            摘星盘
          </h1>
          <h2 className="text-sm font-pixel text-[#ff073a] tracking-widest mb-12" style={{ textShadow: '0 0 5px #ff073a' }}>
            赛博破解版
          </h2>

          <div className="border-[3px] border-[#ff073a] p-8 w-full relative" style={{ boxShadow: '0 0 10px #ff073a, inset 0 0 10px #ff073a' }}>
            <h3 className="text-xl font-pixel text-[#39ff14] text-center mb-8" style={{ textShadow: '0 0 5px #39ff14' }}>
              选择模式
            </h3>
          
            <div className="flex flex-col gap-4 w-full px-8">
              {unlockedLevel > 1 && (
                <RetroButton onClick={() => { setCurrentLevel(unlockedLevel); setView('game'); }} color="green" className="text-xl">
                  继续游戏 ▶
                </RetroButton>
              )}
              <RetroButton 
                onClick={() => { 
                  setUnlockedLevel(1); 
                  localStorage.setItem('pixelFourUnlocked', '1'); 
                  setCurrentLevel(1); 
                  setView('game'); 
                }} 
                color="red" 
                className="text-xl"
              >
                {unlockedLevel > 1 ? '重新开始' : '开始游戏'}
              </RetroButton>
              <RetroButton onClick={() => setView('levels')} color="yellow" className="text-xl">
                选择关卡
              </RetroButton>
            </div>

            <div className="mt-12 text-center text-sm font-cyber text-gray-300 tracking-widest space-y-2 opacity-80">
              <p>白子先手</p>
              <p>每次移动一格</p>
              <p>四子连线即为胜利</p>
            </div>
          </div>
          
          <div className="mt-16 text-xs font-cyber text-gray-600">
            © 3X3 LINE — 像素版
          </div>
        </div>
      )}

      {view === 'levels' && (
        <div className="flex flex-col items-center w-full max-w-md px-4 mt-8">
          <h2 className="text-3xl font-pixel mb-8 text-[#00ffff] text-center pb-2" style={{ textShadow: '0 0 10px #00ffff' }}>关卡选择</h2>
          <div className="grid grid-cols-4 gap-4 mb-10 w-[320px]">
            {Array.from({ length: 20 }, (_, i) => i + 1).map(l => (
              <RetroButton
                key={l}
                disabled={l > unlockedLevel}
                color={l === unlockedLevel ? "cyan" : "green"}
                onClick={() => { setCurrentLevel(l); setView('game'); }}
                className={`h-16 ${l > unlockedLevel ? '' : 'hover:scale-105'} p-0`}
              >
                <div className="flex flex-col items-center justify-center">
                   <div className="text-lg">{l}</div>
                </div>
              </RetroButton>
            ))}
          </div>
          <div className="w-[320px]">
             <RetroButton onClick={() => setView('menu')} color="red" className="w-full">返回主菜单</RetroButton>
          </div>
        </div>
      )}

      {view === 'game' && (
        <Game
          key={currentLevel}
          level={currentLevel}
          onBack={() => setView('levels')}
          onWin={handleWin}
        />
      )}
    </div>
  )
}
