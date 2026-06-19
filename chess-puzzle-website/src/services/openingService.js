import { Chess } from 'chess.js';

// Lichess Opening Explorer API
const EXPLORER_BASE = 'https://explorer.lichess.org';

/**
 * Opening Service - Handles opening database queries and training
 */

/**
 * Fetch opening data from Lichess Explorer
 * @param {string} fen - Position FEN
 * @param {string[]} moves - UCI move sequence
 * @param {object} options - Query options (speeds, ratings, etc.)
 * @returns {Promise<object>} Opening data with moves, stats, and names
 */
export async function fetchOpeningPosition(fen, moves = [], options = {}) {
  const {
    variant = 'standard',
    speeds = ['blitz', 'rapid', 'classical'],
    ratings = ['1600', '1800', '2000', '2200', '2500'],
    since = '2015-01',
    database = 'lichess' // 'lichess', 'masters', or 'player'
  } = options;

  const params = new URLSearchParams({
    variant,
    fen: fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  });

  // Add array parameters
  speeds.forEach(speed => params.append('speeds[]', speed));
  ratings.forEach(rating => params.append('ratings[]', rating));
  
  // Add move sequence if provided
  if (moves.length > 0) {
    params.append('play', moves.join(','));
  }

  if (since) params.append('since', since);

  const url = `${EXPLORER_BASE}/${database}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return parseOpeningResponse(data);
  } catch (error) {
    console.error('Error fetching opening data:', error);
    return null;
  }
}

/**
 * Parse Lichess API response
 */
function parseOpeningResponse(data) {
  if (!data) return null;

  const moves = (data.moves || []).map(move => ({
    uci: move.uci,
    san: move.san,
    white: move.white || 0,
    draws: move.draws || 0,
    black: move.black || 0,
    averageRating: move.averageRating || 0,
    total: (move.white || 0) + (move.draws || 0) + (move.black || 0),
    popularity: 0 // Will calculate below
  }));

  // Calculate popularity percentages
  const totalGames = moves.reduce((sum, m) => sum + m.total, 0);
  moves.forEach(move => {
    move.popularity = totalGames > 0 ? ((move.total / totalGames) * 100).toFixed(1) : 0;
    move.winRate = {
      white: move.total > 0 ? ((move.white / move.total) * 100).toFixed(1) : 0,
      draws: move.total > 0 ? ((move.draws / move.total) * 100).toFixed(1) : 0,
      black: move.total > 0 ? ((move.black / move.total) * 100).toFixed(1) : 0
    };
  });

  // Sort by popularity
  moves.sort((a, b) => b.total - a.total);

  return {
    moves,
    opening: data.opening || { eco: '', name: 'Starting Position' },
    totalGames: totalGames,
    recentGames: data.recentGames || [],
    topGames: data.topGames || []
  };
}

/**
 * Get opening name and ECO code for a position
 */
export async function getOpeningName(moves) {
  if (!moves || moves.length === 0) {
    return { eco: 'A00', name: 'Starting Position' };
  }

  const game = new Chess();
  moves.forEach(move => {
    try {
      game.move(move);
    } catch (e) {
      console.error('Invalid move:', move);
    }
  });

  const fen = game.fen();
  const data = await fetchOpeningPosition(fen, moves);
  
  return data?.opening || { eco: '', name: 'Unknown Opening' };
}

/**
 * Get popular opening lines (for exploration)
 */
export async function getPopularOpenings(color = 'white', limit = 20) {
  const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const data = await fetchOpeningPosition(startingFen, []);
  
  if (!data || !data.moves) return [];

  const openings = [];
  
  // Get top moves from starting position
  const topMoves = data.moves.slice(0, 5);
  
  for (const move of topMoves) {
    const game = new Chess();
    game.move(move.san);
    
    // Get responses to this move
    const response = await fetchOpeningPosition(game.fen(), [move.uci]);
    
    openings.push({
      firstMove: move,
      name: response?.opening?.name || 'Unknown',
      eco: response?.opening?.eco || '',
      responses: response?.moves?.slice(0, 5) || []
    });
  }

  return openings.slice(0, limit);
}

/**
 * Opening Training Line - represents a sequence of moves to practice
 */
export class OpeningLine {
  constructor(moves, name, eco, color, description = '') {
    this.moves = moves; // Array of UCI moves
    this.name = name;
    this.eco = eco;
    this.color = color; // 'white' or 'black'
    this.description = description;
    this.id = `${eco}_${color}_${moves.join('_')}`;
  }

  async getPosition(moveIndex) {
    const game = new Chess();
    for (let i = 0; i <= moveIndex && i < this.moves.length; i++) {
      game.move(this.moves[i]);
    }
    return game.fen();
  }

  async getNextMove(currentPosition) {
    // Find which move we're on
    const game = new Chess();
    let moveIndex = -1;
    
    for (let i = 0; i < this.moves.length; i++) {
      if (game.fen() === currentPosition) {
        moveIndex = i;
        break;
      }
      try {
        game.move(this.moves[i]);
      } catch (e) {
        break;
      }
    }

    if (moveIndex === -1 || moveIndex >= this.moves.length - 1) {
      return null; // Line complete or position not found
    }

    return this.moves[moveIndex + 1];
  }

  isComplete(currentPosition) {
    const finalGame = new Chess();
    this.moves.forEach(move => finalGame.move(move));
    return finalGame.fen() === currentPosition;
  }
}

/**
 * Generate training lines from opening name
 */
export async function generateTrainingLines(openingName, color = 'both', depth = 10) {
  // This will be expanded to parse opening databases
  // For now, return empty array - will be populated from Lichess data
  return [];
}

/**
 * Get move explanations and tactical ideas
 */
export function getMoveExplanation(openingName, moveIndex, move) {
  // Opening-specific move explanations
  const explanations = {
    'Sicilian Defense': {
      'c5': 'Fighting for central control and avoiding symmetry',
      'Nf3': 'Developing while preparing d4 to challenge the center',
      'd6': 'Preparing to develop the dark-squared bishop',
      'd4': 'Opening the center and leading to sharp tactical play',
    },
    'King\'s Indian Defense': {
      'g6': 'Preparing to fianchetto the bishop on the long diagonal',
      'Bg7': 'The key piece in King\'s Indian structures',
      'd6': 'Solid pawn structure preparing for counterplay',
    },
    'London System': {
      'Bf4': 'The signature move - developing before e3 locks it in',
      'e3': 'Building a solid pawn structure',
      'Nbd2': 'Flexible knight placement supporting the center',
    }
  };

  // Check if we have specific explanation
  for (const [opening, moves] of Object.entries(explanations)) {
    if (openingName.includes(opening) && moves[move]) {
      return moves[move];
    }
  }

  // Generic explanations
  if (moveIndex < 3) {
    return 'Developing pieces and controlling the center';
  } else if (moveIndex < 6) {
    return 'Continuing development and preparing for middlegame';
  } else {
    return 'Executing the opening plan';
  }
}

export default {
  fetchOpeningPosition,
  getOpeningName,
  getPopularOpenings,
  generateTrainingLines,
  OpeningLine,
  getMoveExplanation
};
