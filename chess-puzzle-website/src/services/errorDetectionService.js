import { Chess } from 'chess.js';

/**
 * Analyzes a wrong move and provides contextual feedback
 */
export function analyzeWrongMove(position, userMove, correctMove, puzzle) {
  const chess = new Chess(position);
  
  // Try to make the user's move to analyze consequences
  let moveResult;
  try {
    moveResult = chess.move(userMove);
  } catch {
    return {
      type: 'illegal',
      message: 'Illegal move.'
    };
  }

  // Check various error patterns
  const hangsPiece = checkHangingPiece(chess, moveResult);
  if (hangsPiece) {
    return {
      type: 'hung_piece',
      message: 'That piece becomes vulnerable.'
    };
  }

  const missedMate = checkMissedMate(position, correctMove);
  if (missedMate) {
    return {
      type: 'missed_mate',
      message: 'There\'s a more forcing continuation.'
    };
  }

  const missedCheck = checkMissedCheck(position, correctMove);
  if (missedCheck) {
    return {
      type: 'missed_check',
      message: 'Consider more aggressive moves.'
    };
  }

  const wrongPiece = checkWrongPiece(userMove, correctMove);
  if (wrongPiece) {
    return {
      type: 'wrong_piece',
      message: 'Wrong piece. Think about piece coordination.'
    };
  }

  // Check if opponent has a strong counter
  const opponentThreat = checkOpponentThreats(chess);
  if (opponentThreat) {
    return {
      type: 'opponent_threat',
      message: 'Your opponent has a strong counter.'
    };
  }

  // Generic feedback with theme hint
  const themeHint = getThemeHint(puzzle);
  return {
    type: 'wrong_plan',
    message: `Incorrect. ${themeHint}`
  };
}

function checkHangingPiece(chess, moveResult) {
  // Check if the moved piece is now attacked and undefended
  const targetSquare = moveResult.to;
  const attackers = chess.attackers(
    chess.turn() === 'w' ? 'b' : 'w',
    targetSquare
  );

  if (attackers.length > 0) {
    const defenders = chess.attackers(chess.turn(), targetSquare);
    
    if (defenders.length === 0) {
      // Piece is hanging
      const piece = getPieceName(moveResult.piece);
      const capturingPiece = getSquareNotation(attackers[0]);
      return {
        piece,
        capture: capturingPiece
      };
    }
  }

  return null;
}

function checkMissedMate(position, correctMove) {
  // Check if the correct move leads to checkmate
  const chess = new Chess(position);
  const move = uciToMove(correctMove);
  
  if (!move) return null;

  try {
    chess.move(move);
    if (chess.isCheckmate()) {
      return 'checkmate in one';
    }
    
    // Check for mate in 2 (simplified)
    const responses = chess.moves();
    if (responses.length === 0) return null;
    
    let allLeadToMate = true;
    for (const response of responses) {
      const testChess = new Chess(chess.fen());
      testChess.move(response);
      
      const followUps = testChess.moves({ verbose: true });
      let hasMate = false;
      
      for (const followUp of followUps) {
        const testChess2 = new Chess(testChess.fen());
        testChess2.move(followUp);
        if (testChess2.isCheckmate()) {
          hasMate = true;
          break;
        }
      }
      
      if (!hasMate) {
        allLeadToMate = false;
        break;
      }
    }
    
    if (allLeadToMate && responses.length > 0) {
      return 'mate in 2';
    }
  } catch {
    return null;
  }

  return null;
}

function checkMissedCheck(position, correctMove) {
  const chess = new Chess(position);
  const move = uciToMove(correctMove);
  
  if (!move) return null;

  try {
    const result = chess.move(move);
    if (chess.inCheck()) {
      return result.san;
    }
  } catch {
    return null;
  }

  return null;
}

function checkWrongPiece(userMove, correctMove) {
  const userFrom = userMove.from;
  const correctFrom = correctMove.slice(0, 2);
  
  if (userFrom !== correctFrom) {
    // Different starting square
    const correctSquare = correctFrom;
    return `piece on ${correctSquare}`;
  }

  return null;
}

function checkOpponentThreats(chess) {
  // Check if opponent has immediate mate threats
  const opponentMoves = chess.moves({ verbose: true });
  
  for (const move of opponentMoves) {
    const testChess = new Chess(chess.fen());
    testChess.move(move);
    
    if (testChess.isCheckmate()) {
      return `${move.san} checkmate`;
    }
  }

  // Check for hanging pieces
  const board = chess.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece && piece.color === chess.turn()) {
        const square = String.fromCharCode(97 + j) + (8 - i);
        const attackers = chess.attackers(
          piece.color === 'w' ? 'b' : 'w',
          square
        );
        const defenders = chess.attackers(piece.color, square);
        
        if (attackers.length > 0 && defenders.length === 0) {
          const pieceName = getPieceName(piece.type);
          return `hanging ${pieceName}`;
        }
      }
    }
  }

  return null;
}

function getThemeHint(puzzle) {
  if (!puzzle.themes || puzzle.themes.length === 0) {
    return 'Look deeper.';
  }

  const theme = puzzle.themes[0].toLowerCase();
  
  const hints = {
    'fork': 'Think about attacking multiple targets.',
    'pin': 'Consider restricting opponent pieces.',
    'skewer': 'Attack valuable pieces first.',
    'discoveredattack': 'Consider piece movement revealing attacks.',
    'doublecheck': 'Multiple threats simultaneously.',
    'backrankmate': 'Examine the back rank.',
    'mate': 'Find the forced win.',
    'matein2': 'Calculate further ahead.',
    'hangingpiece': 'Look for undefended pieces.',
    'trappedpiece': 'Identify pieces with limited mobility.',
    'sacrifice': 'Material isn\'t everything.',
    'defensivemove': 'Defense first.'
  };

  return hints[theme] || 'Reconsider.';
}

function getPieceName(pieceType) {
  const names = {
    'p': 'pawn',
    'n': 'knight',
    'b': 'bishop',
    'r': 'rook',
    'q': 'queen',
    'k': 'king'
  };
  return names[pieceType] || 'piece';
}

function getSquareNotation(square) {
  return square;
}

function uciToMove(uci) {
  if (!uci || uci.length < 4) return null;
  const obj = { from: uci.slice(0, 2), to: uci.slice(2, 4) };
  if (uci.length > 4) obj.promotion = uci[4];
  return obj;
}

/**
 * Track error patterns for analysis
 */
export function classifyError(errorType, puzzleTheme) {
  return {
    errorType,
    puzzleTheme,
    timestamp: Date.now()
  };
}
