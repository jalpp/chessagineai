import { BISHOP, BLACK, Chess, Color, KING, KNIGHT, Move, PAWN, QUEEN, Square, validateFen, WHITE } from "chess.js";
import { z } from "zod";

interface CastleRights {
  queenside: boolean;
  kingside: boolean;
}

interface PositionalPawn {
  doublepawncount: number,
  isolatedpawncount: number,
  backwardpawncount: number,
  weaknessscore: number,
}

interface SpaceControl {
  centerspacecontolscore: number,
  flankspacecontrolscore: number,
  totalspacecontrolscore: number
}


export interface BoardState {
  fen: string;
  validfen: boolean;
  whitecastlerights: CastleRights;
  blackcastlerights: CastleRights;
  legalMoves: string[],
  whitematerialcount: number,
  blackmaterialcount: number,
  whitespacescore: SpaceControl,
  blackspacescore: SpaceControl,
  whitepositionalscore: PositionalPawn,
  blackpositionalscore: PositionalPawn,
  isCheckmate: boolean;
  isStalemate: boolean;
  isGameOver: boolean;
  moveNumber: number;
  sidetomove: string;
}

const BOARD_CENTRE: Square[] = ["c4","c5","d4","d5","e4","e5","f4","f5"];
const BOARD_FLANK: Square[] = ["a4", "a5", "b4", "b5", "h4", "h5", "g4", "g5"];

function getSpaceControl(fen: string, side: Color): number {
   let spaceMeasure = 0;
   const chess = new Chess(fen);
   for(const sq of BOARD_CENTRE){
     spaceMeasure += chess.attackers(sq, side).length;
   }

   return spaceMeasure;
}

function getFlankSpaceControl(fen: string, side: Color): number {
  let flankMeasure = 0;
  const chess = new Chess(fen);
  for(const sq of BOARD_FLANK){
    flankMeasure += chess.attackers(sq, side).length;
  }

  return flankMeasure;
}

function getSideMaterialCount(chess: Chess, side: Color): number {
  const mc = chess
  .board()
  .reduce(
    (count, row) =>
      count + row.filter((piece) => piece && piece.color === side).length,
    0
  );

  return mc
}

// Define valid chess squares
export const SquareEnum = z.enum([
  "a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8",
  "a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7",
  "a6", "b6", "c6", "d6", "e6", "f6", "g6", "h6",
  "a5", "b5", "c5", "d5", "e5", "f5", "g5", "h5",
  "a4", "b4", "c4", "d4", "e4", "f4", "g4", "h4",
  "a3", "b3", "c3", "d3", "e3", "f3", "g3", "h3",
  "a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2",
  "a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1",
]);

// Define valid piece symbols
export const PieceSymbolEnum = z.enum(["p", "n", "b", "r", "q", "k"]);

export const MoveSchema = z.object({
  color: z.enum(["w", "b"]),
  from: SquareEnum,
  to: SquareEnum,
  san: z.string(),
  flags: z.string(),
  piece: PieceSymbolEnum,
  lan: z.string(),
  captured: PieceSymbolEnum.optional(),
  promotion: PieceSymbolEnum.optional(),
  before: z.string(),
  after: z.string(),
});


function getSidePositionalCount(fen: string, side: Color): PositionalPawn {
  
  const chess = new Chess(fen);
  
  let pawnSquares = chess.findPiece({type: PAWN, color: side});
    const doublePawns = getDoublePawnCount(pawnSquares);
    const isolatedPawnCount = getSideIsolatedPawnCount(pawnSquares);
    const backwardpawncount = getSideBackwardPawnCount(pawnSquares, side);
    const totalPawns = pawnSquares.length;
    const weaknessscore = totalPawns > 0 
      ? Math.round(((doublePawns + isolatedPawnCount + backwardpawncount) / totalPawns) * 100) 
      : 0;

    const PawnPositionView: PositionalPawn = {
      doublepawncount: doublePawns,
      isolatedpawncount: isolatedPawnCount,
      backwardpawncount: backwardpawncount,
      weaknessscore: weaknessscore,
    };

    return PawnPositionView;

}


function getSideIsolatedPawnCount(pawnSquares: string[]): number {
  const pawnFiles = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  let pawnChain = pawnSquares.join('').split('');
  let isp = 0;
  for(const pawn of pawnChain){
      if(pawn === 'a'){
        if(!pawnChain.includes('b')){  // No 'b' pawn
           isp++;
        }
      }else if(pawn === 'h'){
        if(!pawnChain.includes('g')){  // No 'g' pawn
           isp++;
        }
      }else{
        const pawnIndex = pawnFiles.indexOf(pawn);
        if(!pawnChain.includes(pawnFiles[pawnIndex + 1]) && !pawnChain.includes(pawnFiles[pawnIndex - 1])){
         isp++;
        }
      }
  }
  return isp;
}


function getSideBackwardPawnCount(pawnSquares: string[], side: 'w' | 'b'): number {
  const pawnMap = new Map<string, number[]>();

  // Organize pawns by file (column)
  for (const square of pawnSquares) {
    const file = square[0];
    const rank = parseInt(square[1], 10);
    if (!pawnMap.has(file)) pawnMap.set(file, []);
    pawnMap.get(file)?.push(rank);
  }

  let backwardCount = 0;

  // Iterate over each file
  for (const [file, ranks] of pawnMap.entries()) {
    // Sort the ranks from highest to lowest
    ranks.sort((a, b) => b - a);

    const fileIndex = "abcdefgh".indexOf(file);

    // Get the highest-ranked pawns in adjacent files
    const leftRanks = fileIndex > 0 ? pawnMap.get("abcdefgh"[fileIndex - 1]) || [] : [];
    const rightRanks = fileIndex < 7 ? pawnMap.get("abcdefgh"[fileIndex + 1]) || [] : [];

    const highestLeft = Math.max(...leftRanks, 0);
    const highestRight = Math.max(...rightRanks, 0);

    // Check each pawn's rank on this file
    for (const rank of ranks) {
      // A pawn is backward if it's behind both left and right pawns and there's no pawn supporting it behind
      if (rank < highestLeft && rank < highestRight) {
        backwardCount++;
      }
    }
  }

  return backwardCount;
}



function getDoublePawnCount(pawnSqaures: string[]): number {
  const pawnChain = pawnSqaures.join('').split('');
  const evenFiles = pawnChain.filter((_, index) => index % 2 === 0);
  console.log(evenFiles);
  const counts = new Map<string, number>();
  let doublePawns = 0;

  for (const file of evenFiles) {
      counts.set(file, (counts.get(file) || 0) + 1);
  }

  for(const val of counts.values()){
     if(val > 1){
      doublePawns++;
     }
  }

  return doublePawns;
}



export function calculateDeep(fen: string, move: string): BoardState | { fen: string; validfen: false } {
    const chess = new Chess(fen);
    chess.move(move);
    return getBoardState(chess.fen());
}

export function getBoardState(fen: string): BoardState | { fen: string; validfen: false } {
  const chess = new Chess(fen);

  let validfen = validateFen(fen).ok;

  if (!validfen) {
    return { fen, validfen: false };
  }

  const whitecastlerights = {
    queenside: chess.getCastlingRights(WHITE)[QUEEN],
    kingside: chess.getCastlingRights(WHITE)[KING],
  };
  const blackcastlerights = {
    queenside: chess.getCastlingRights(BLACK)[QUEEN],
    kingside: chess.getCastlingRights(BLACK)[KING],
  };
  const legalMoves = chess.moves();
  const whitematerialcount = getSideMaterialCount(chess, WHITE);
  const blackmaterialcount = getSideMaterialCount(chess, BLACK);

  const isCheckmate = chess.isCheckmate();
  const isStalemate = chess.isStalemate();
  const isGameOver = chess.isGameOver();
  const moveNumber = chess.moveNumber();
  const sidetomove = chess.turn() === "w" ? "white" : "black";
  const whitecenterspacecontrol = getSpaceControl(fen, WHITE);
  const blackcenterspacecontrol = getSpaceControl(fen, BLACK);
  const whiteflankspacecontrol = getFlankSpaceControl(fen, WHITE);
  const blackflankspacecontrol = getFlankSpaceControl(fen, BLACK);
  const whitespacecontrol = whitecenterspacecontrol + whiteflankspacecontrol;
  const blackspacecontrol = blackcenterspacecontrol + blackflankspacecontrol;

  const whitespacescore: SpaceControl = {
    centerspacecontolscore: whitecenterspacecontrol,
    flankspacecontrolscore: whiteflankspacecontrol,
    totalspacecontrolscore: whitespacecontrol,
  };

  const blackspacescore: SpaceControl = {
    centerspacecontolscore: blackcenterspacecontrol,
    flankspacecontrolscore: blackflankspacecontrol,
    totalspacecontrolscore: blackspacecontrol,
  };

  return {
    fen,
    validfen,
    whitecastlerights,
    blackcastlerights,
    legalMoves,
    whitematerialcount,
    blackmaterialcount,
    whitespacescore,
    blackspacescore,
    whitepositionalscore: getSidePositionalCount(fen, WHITE),
    blackpositionalscore: getSidePositionalCount(fen, BLACK),
    isCheckmate,
    isStalemate,
    isGameOver,
    moveNumber,
    sidetomove,
  };
}
