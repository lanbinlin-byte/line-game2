import React, { useState, useEffect } from 'react';

const INITIAL_BOARD = [
  2, 2, 2, 2, // Row 0 (AI - Black)
  0, 0, 0, 0,
  0, 0, 0, 0,
  1, 1, 1, 1  // Row 3 (Player - White)
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

const RetroButton = ({ children, onClick, disabled = false, active = false, className = '' }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-3 font-black border-4 border-black text-center transition-all active:translate-y-1 active:shadow-none
      ${disabled ? 'bg-gray-400 text-gray-600 cursor-not-allowed border-gray-600 opacity-80' :
        active ? 'bg-yellow-400 translate-y-1 shadow-none' :
          'bg-white hover:bg-yellow-100 shadow-[4px_4px_0_0_#000]'} ${className}`}
  >
    {children}
  </button>
);

function Game({ level, targetMoves, onBack, onWin }: { level: number, targetMoves: number, onBack: () => void, onWin: (lvl: number) => void }) {
  const [board, setBoard] = useState<number[]>([...INITIAL_BOARD]);
  const [turn, setTurn] = useState<number>(1);
  const [playerMoves, setPlayerMoves] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [status, setStatus] = useState<'playing' | 'win' | 'lose'>('playing');
  const [message, setMessage] = useState<string>('');

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
      if (!message) {
        setMessage('电脑行动中...');
      }
      const timer = setTimeout(() => {
        let aiTarget = getBestMove([...board], level);
        if (aiTarget) {
          let newBoard = [...board];
          newBoard[aiTarget.from] = 0;
          newBoard[aiTarget.to] = 2;
          setBoard(newBoard);

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

      setPlayerMoves(newMoves);
      setBoard(newBoard);
      setSelectedNode(null);

      let winner = checkWinSilent(newBoard);
      if (winner === 1) {
        if (newMoves >= targetMoves) {
          setStatus('win');
          setMessage(`完美杀局！\n经过 ${newMoves} 步的周旋，你终于将死了电脑！成功通过第 ${level} 关！`);
        } else {
          setStatus('lose');
          setMessage(`过早击杀！\n必须至少与电脑周旋 ${targetMoves} 步后才能杀它！当前才 ${newMoves} 步。任务失败！`);
        }
      } else if (newMoves === targetMoves) {
        setMessage(`步数达标！现在去连成四子吧！`);
        setTurn(2);
      } else {
        if (message.includes('步数达标')) {
            setMessage('');
        }
        setTurn(2);
      }
    }
  };

  const resetGame = () => {
    setBoard([...INITIAL_BOARD]);
    setTurn(1);
    setPlayerMoves(0);
    setSelectedNode(null);
    setStatus('playing');
    setMessage('');
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between items-end w-[320px] mb-4">
        <div>
          <h2 className="text-2xl font-black mb-1">第 {level} 关</h2>
          <div className="text-sm font-bold bg-white border-2 border-black px-2 py-1 inline-block shadow-[2px_2px_0_0_#000]">
            {turn === 1 && status === 'playing' ? '👉 你的回合' : '⏳ 电脑行动...'}
          </div>
        </div>
        <div className={`text-right font-black ${playerMoves >= targetMoves ? 'text-green-700' : 'text-blue-700'}`}>
          <div className="text-sm text-black">通关步数</div>
          <div className="text-3xl">{playerMoves}<span className="text-xl text-black"> / {targetMoves}</span></div>
        </div>
      </div>

      <div className="relative border-4 border-black bg-[#eedaab] shadow-[8px_8px_0_0_#000] mb-6 select-none" style={{ width: 320, height: 320 }}>
        {/* Grid Background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 320">
          {[0, 1, 2, 3].map(i => (
            <line key={`h-${i}`} x1="40" y1={40 + i * 80} x2="280" y2={40 + i * 80} stroke="#444" strokeWidth="4" />
          ))}
          {[0, 1, 2, 3].map(i => (
            <line key={`v-${i}`} x1={40 + i * 80} y1="40" x2={40 + i * 80} y2="280" stroke="#444" strokeWidth="4" />
          ))}
          <rect x={2} y={2} width={316} height={316} fill="none" stroke="black" strokeWidth="8" />
        </svg>

        {board.map((stone, i) => {
          let r = Math.floor(i / 4);
          let c = i % 4;
          let x = 40 + c * 80;
          let y = 40 + r * 80;

          let isSelected = selectedNode === i;
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
              key={i}
              className={`absolute flex items-center justify-center cursor-pointer ${isValidTarget ? 'z-20' : 'z-10'}`}
              style={{ left: x, top: y, width: 48, height: 48, transform: 'translate(-50%, -50%)' }}
              onClick={() => handleNodeClick(i)}
            >
              <div className="w-2.5 h-2.5 bg-black rounded-full pointer-events-none absolute" />

              {isValidTarget && turn === 1 && (
                <>
                  <div className="absolute w-8 h-8 bg-green-400 rounded-full animate-ping opacity-60" />
                  <div className="absolute w-8 h-8 bg-green-500 rounded-full opacity-80 border-2 border-black" />
                </>
              )}

              {stone === 1 && (
                <div className={`absolute w-10 h-10 rounded-full border-4 border-black bg-white transition-transform ${isSelected ? 'scale-110 shadow-[0_0_15px_rgba(255,255,255,1)] translate-y-[-4px]' : 'shadow-[2px_2px_0_0_#000] hover:scale-105'}`} />
              )}

              {stone === 2 && (
                <div className="absolute w-10 h-10 rounded-full border-4 border-black bg-neutral-800 shadow-[2px_2px_0_0_#000]" />
              )}
            </div>
          )
        })}
      </div>

      {message && status === 'playing' && (
        <div className="bg-rose-100 border-4 border-black p-3 font-bold text-center w-[320px] mb-4 shadow-[4px_4px_0_0_#000] text-sm text-red-700">
          {message}
        </div>
      )}

      {status !== 'playing' && (
        <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#eedaab] border-8 border-black p-8 flex flex-col items-center text-center shadow-[16px_16px_0_0_rgba(0,0,0,1)] max-w-[340px] w-full">
            <h3 className={`text-4xl font-black mb-4 drop-shadow-[2px_2px_0_rgba(255,255,255,1)] ${status === 'win' ? 'text-green-700' : 'text-red-700'}`}>
              {status === 'win' ? '挑战成功！' : '游戏结束'}
            </h3>
            <p className="font-bold text-lg mb-8 whitespace-pre-wrap">{message}</p>
            <div className="flex flex-col gap-4 w-full">
              {status === 'win' && level < 20 && (
                <RetroButton onClick={() => onWin(level)} className="bg-green-400 hover:bg-green-300">
                  进入下一关 ➔
                </RetroButton>
              )}
              {status === 'win' && level === 20 && (
                <RetroButton onClick={() => onWin(level)} className="bg-yellow-400">
                  🎉 返回主页
                </RetroButton>
              )}
              {status === 'lose' && (
                <RetroButton onClick={resetGame}>再试一次 ↺</RetroButton>
              )}
              <RetroButton onClick={onBack} className={status === 'win' ? '' : 'bg-red-400 hover:bg-red-300'}>
                返回关卡
              </RetroButton>
            </div>
          </div>
        </div>
      )}

      <div className="w-[320px]">
        <RetroButton onClick={onBack} className="w-full">🏳️ 放弃并返回</RetroButton>
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
    <div className="min-h-screen bg-sky-200 flex flex-col items-center py-8 font-sans select-none overflow-hidden text-black transition-colors duration-500">
      
      {/* Heavy stylized pixel borders reset */}
      <style>{`
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
      `}</style>

      {view === 'menu' && (
        <div className="flex flex-col items-center mt-12 w-full max-w-[400px]">
          <h1 className="text-5xl font-black mb-8 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] text-[#fff] tracking-widest text-center">
            四子像素棋<br />
            <span className="text-2xl mt-4 block text-yellow-300 drop-shadow-[2px_2px_0_rgba(0,0,0,1)] bg-black px-4 py-2 inline-block -rotate-2">
              绝命闯关
            </span>
          </h1>
          
          <div className="flex flex-col gap-5 w-full px-8">
            <RetroButton onClick={() => { setCurrentLevel(unlockedLevel); setView('game'); }} className="text-xl">
              {unlockedLevel > 1 ? '继续游戏 ▶' : '开始游戏 ▶'}
            </RetroButton>
            <RetroButton onClick={() => setView('levels')} className="text-xl">
              关卡选择 ☰
            </RetroButton>
          </div>

          <div className="mt-12 bg-white p-5 border-4 border-black text-sm w-[300px] shadow-[6px_6px_0_0_#000]">
            <h3 className="font-black mb-3 text-center text-lg bg-black text-white py-1">💡 游戏规则</h3>
            <ul className="list-disc pl-4 space-y-2 font-bold text-gray-800 tracking-tight leading-snug">
              <li>黑白双方各四子，<span className="text-blue-600">一次移一步</span>。率先四子连成一直线（横/竖/斜）者胜利。</li>
              <li>初始的连线状态不算作胜利！</li>
              <li><span className="text-red-600">极限挑战：</span>你必须在与电脑周旋至少<strong className="text-black text-base drop-shadow-[1px_1px_rgba(255,255,0,1)]"> 目标步数 </strong>之后，再连成四子才能通关！</li>
              <li>没到要求步数就提前连线<span className="text-red-600 font-bold text-lg">判负！</span>（直接结束！不可提早击杀）。</li>
            </ul>
          </div>
        </div>
      )}

      {view === 'levels' && (
        <div className="flex flex-col items-center w-full max-w-md px-4 mt-8">
          <h2 className="text-4xl font-black mb-8 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] text-white text-center pb-2">关卡选择</h2>
          <div className="grid grid-cols-4 gap-4 mb-10 w-[320px]">
            {Array.from({ length: 20 }, (_, i) => i + 1).map(l => (
              <RetroButton
                key={l}
                disabled={l > unlockedLevel}
                onClick={() => { setCurrentLevel(l); setView('game'); }}
                className={l > unlockedLevel ? 'h-16' : 'h-16 bg-white hover:scale-105 active:scale-95'}
              >
                <div className="flex flex-col items-center justify-center">
                   <div className="text-lg">{l}</div>
                   {l <= unlockedLevel && <div className="text-[10px] text-gray-500 font-bold">{l * 20}步</div>}
                </div>
              </RetroButton>
            ))}
          </div>
          <div className="w-[320px]">
             <RetroButton onClick={() => setView('menu')} className="w-full">返回主菜单</RetroButton>
          </div>
        </div>
      )}

      {view === 'game' && (
        <Game
          key={currentLevel}
          level={currentLevel}
          targetMoves={currentLevel * 20}
          onBack={() => setView('levels')}
          onWin={handleWin}
        />
      )}
    </div>
  )
}
