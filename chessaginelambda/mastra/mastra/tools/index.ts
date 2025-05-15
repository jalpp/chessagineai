import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { calculateDeep,  getBoardState } from "./state";
import { generateChessAnalysis, getChessEvaluation } from "./fish";

const CastleRightsSchema = z.object({
  queenside: z.boolean(),
  kingside: z.boolean(),
});

const BoardStateSchema = z.object({
  fen: z.string(),
  validfen: z.boolean(),
  whitecastlerights: CastleRightsSchema,
  blackcastlerights: CastleRightsSchema,
  legalMoves: z.array(z.string()),
  whitematerialcount: z.number(),
  blackmaterialcount: z.number(),
  isCheckmate: z.boolean(),
  isStalemate: z.boolean(),
  isGameOver: z.boolean(),
  moveNumber: z.number(),
  sidetomove: z.string(),
});

const InvalidBoardStateSchema = z.object({
  fen: z.string(),
  validfen: z.literal(false),
});


export const chessBoardStateTool = createTool({
  id: "get-chessboard-state",
  description:
    "Get the given fen's chess board state, like legal moves, chess board view, castling rights etc",
  inputSchema: z.object({
    fen: z.string().describe("FEN string representing the board position"),
  }),
  outputSchema: z.object({
    boardstate: z.union([BoardStateSchema, InvalidBoardStateSchema]),
  }),
  execute: async ({ context }) => {
    const boardState = getBoardState(context.fen);
    return { boardstate: boardState };
  },
});

export const chessBoardMoveCalculateTool = createTool({
  id: "get-chessboard-state",
  description:
    "Get the future chess board state for given current fen, and future legal chess move",
  inputSchema: z.object({
    fen: z.string().describe("FEN string representing the current board position"),
    move: z.string().describe("The future move")
  }),
  outputSchema: z.object({
    boardstate: z.union([BoardStateSchema, InvalidBoardStateSchema]),
  }),
  execute: async ({ context }) => {
    const boardState = calculateDeep(context.fen, context.move);
    return { boardstate: boardState };
  },
});

export const getStockfishAnalysisTool = createTool({
  id: "get-stockfish-",
  description:
    "Analyze a given chess position using Stockfish and provide best move, reasoning, and varition, speech Eval and number Eval",
  inputSchema: z.object({
    fen: z.string().describe("FEN string representing the board position"),
    depth: z.number().min(12).describe("Search depth for Stockfish engine"),
  }),
  outputSchema: z.object({
    bestMove: z.string().describe("the best move for current side"),
    reasoning: z.string().describe("the reasoning behind the move"),
    numberEval: z.number().describe("the engine eval in number form"),
    speechEval: z.string().describe("A general text eval for engine eval"),
    topLine: z
      .string()
      .describe(
        "The top varation that would play out according to Stockfish in UCI format"
      ),
  }),
  execute: async ({ context }) => {
    const evaluation = await getChessEvaluation(context.fen, context.depth);
    return generateChessAnalysis(evaluation, context.fen);
  },
});


export const validateFENTool = createTool({
    id: "validate-fen",
    description: "Validate a FEN string to check if it represents a valid chess position",
    inputSchema: z.object({
        fen: z.string().describe("FEN string representing the board position"),
    }),
    outputSchema: z.object({
        isValid: z.boolean().describe("Indicates if the FEN string is valid"),
        message: z.string().optional().describe("Error message if the FEN is invalid"),
    }),
    execute: async ({ context }) => {
        const { fen } = context;
        try {
            const boardState = getBoardState(fen);
            return { isValid: boardState.validfen, message: boardState.validfen ? undefined : "Invalid FEN string" };
        } catch (error) {
            return { isValid: false, message: "An error occurred while validating the FEN" };
        }
    },
});

