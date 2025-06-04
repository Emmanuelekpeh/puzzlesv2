const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Chess } = require('chess.js');

// Adjust this path if your Komodo binary is elsewhere
const KOMODO_PATH = path.join(__dirname, '../server/engines/komodo/Windows/komodo-14.1-64bit.exe');
const PUZZLE_FILE = path.join(__dirname, '../src/data/lichess_puzzles.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data/komodo_validated_puzzles.json');

function startKomodo() {
  const komodo = spawn(KOMODO_PATH);
  komodo.stdin.setEncoding('utf-8');
  komodo.stdout.setEncoding('utf-8');
  komodo.stderr.on('data', data => console.error('[Komodo]', data.toString()));
  komodo.stdin.write('uci\n');
  komodo.stdin.write('isready\n');
  return komodo;
}

function getBestMove(komodo, fen, movetime = 2000) {
  return new Promise((resolve, reject) => {
    let output = '';
    let responded = false;
    const onData = (data) => {
      output += data;
      if (output.includes('bestmove') && !responded) {
        const match = output.match(/bestmove\s(\S+)/);
        if (match) {
          responded = true;
          komodo.stdout.removeListener('data', onData);
          resolve(match[1]);
        }
      }
    };
    komodo.stdout.on('data', onData);
    komodo.stdin.write(`position fen ${fen}\n`);
    komodo.stdin.write(`go movetime ${movetime}\n`);
    setTimeout(() => {
      if (!responded) {
        komodo.stdout.removeListener('data', onData);
        reject(new Error('Komodo did not respond in time'));
      }
    }, movetime + 2000);
  });
}

async function validatePuzzles() {
  const raw = fs.readFileSync(PUZZLE_FILE, 'utf-8');
  const data = JSON.parse(raw);
  const puzzles = data.puzzles;
  const komodo = startKomodo();
  const validated = [];

  for (let i = 0; i < puzzles.length; i++) {
    const puzzle = puzzles[i];
    const chess = new Chess(puzzle.fen);
    const correctedMoves = [];
    let valid = true;
    let fen = puzzle.fen;
    for (let j = 0; j < puzzle.moves.length; j++) {
      try {
        const bestMove = await getBestMove(komodo, fen);
        if (!bestMove) {
          valid = false;
          break;
        }
        // Compare Komodo's move to the puzzle's move
        if (bestMove !== puzzle.moves[j]) {
          valid = false;
        }
        // Play Komodo's move (not the original move)
        const moveObj = chess.move({
          from: bestMove.slice(0, 2),
          to: bestMove.slice(2, 4),
          promotion: bestMove.length > 4 ? bestMove[4] : undefined
        });
        if (!moveObj) {
          valid = false;
          break;
        }
        correctedMoves.push(bestMove);
        fen = chess.fen();
      } catch (err) {
        valid = false;
        break;
      }
    }
    // Copy puzzle, but use corrected moves
    validated.push({ ...puzzle, moves: correctedMoves });
    if ((i + 1) % 10 === 0) {
      console.log(`Validated ${i + 1}/${puzzles.length}`);
    }
  }
  komodo.kill();
  // Write output in the same format
  const output = { ...data, puzzles: validated };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nValidation complete. Output written to ${OUTPUT_FILE}`);
}

validatePuzzles(); 