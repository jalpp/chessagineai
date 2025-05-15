import { Chess } from "chess.js";


export interface StockfishResponse {
  success: boolean;
  evaluation: number | null;
  mate: string | null;
  bestmove: string;
  continuation: string;
}

export const getChessEvaluation = async (fen: string, depth: number) => {
  const stockfishUrl = `https://stockfish.online/api/s/v2.php?fen=${fen}&depth=${depth}`;
  const response = await fetch(stockfishUrl);
  const data = (await response.json()) as StockfishResponse;

  return data;
};

const generateSpeechEval = (
  evalNumber: number,
  mateMove: string | null
) => {
  if (evalNumber === -100000) {
    return "Unknown";
  }

  let speech: string = "";
  const absEval: number = Math.abs(evalNumber);

  if (evalNumber < 0) {
    speech += "Black is";
  } else {
    speech += "White is";
  }

  if (mateMove != null) {
    speech += ` is winning the game in style with the move: ${mateMove}`;
    return speech;
  }

  if (isEvalInRange(0, 1, absEval)) {
    speech +=
      " equal and there is no real advantage both sides are playing equal";
  } else if (isEvalInRange(1, 2, absEval)) {
    speech +=
      " is better than otherside, still there is a chance the game can be equal if";
  } else if (isEvalInRange(2, 3, absEval)) {
    speech +=
      " is better with a value of a minor piece than otherside and favorite to play if played with perfect play";
  } else if (isEvalInRange(3, 5, absEval)) {
    speech +=
      " is better with a value of major piece like rook than otherside, and should win the game";
  } else if (isEvalInRange(5, 10, absEval)) {
    speech +=
      " is way better with a value of up being a queen, otherside should lose soon";
  } else {
    speech +=
      " is already winning by material value, but there could be a tactical theme ahead to even get better";
  }

  return speech;
};

const isEvalInRange = (
  lowerBound: number,
  higherBound: number,
  target: number
) => {
  return target > lowerBound && target < higherBound;
};

export const generateChessAnalysis = (data: StockfishResponse, fen: string) => {
    
  if (!data.bestmove) {
    return {
      bestMove: 'Unknown',
      reasoning: 'Insufficient data to determine best move.',
      mate: 'unknown',
      topLine: "unknown",
      numberEval: 0,
      speechEval: 'unknown',
      
    };
  }
  const chess = new Chess(fen);
  const bestMove = data.bestmove.split(' ')[1];
  const variation = data.continuation;
  const evalNumber = data.evaluation != null ? data.evaluation : -100000;
  const mate = data.mate;
  const moves = variation.split(' ');

  let sanBestMove = '';
  let sanVariation = '';

  chess.move(bestMove);
  
  const history = chess.history({verbose: true});

  sanBestMove = history[0].san;

  chess.load(fen);

  for(let i = 0; i < moves.length; i++){
     chess.move(moves[i]);
  }

  const varHistory = chess.history({verbose: true});

  for(let i = 0; i < varHistory.length; i++){
     sanVariation += `${varHistory[i].san} `
  }
  

  return {
    bestMove: sanBestMove || 'Unknown',
    reasoning: 'Based on Stockfish analysis, this move optimizes piece activity and position.',
    topLine: sanVariation,
    numberEval: evalNumber,
    speechEval: generateSpeechEval(evalNumber, mate),

  };
};


