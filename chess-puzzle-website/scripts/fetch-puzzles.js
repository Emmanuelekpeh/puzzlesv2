const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const DB_URL = 'https://database.lichess.org/lichess_db_puzzle.csv.zst';
const ZST_FILE = path.join(__dirname, '..', 'temp_puzzles.csv.zst');
const CSV_FILE = path.join(__dirname, '..', 'temp_puzzles.csv');
const OUT_FILE = path.join(__dirname, '..', 'src', 'data', 'lichess_puzzles.json');
const TARGET = 10000;
const MIN_POPULARITY = 60;
const MIN_PLAYS = 20;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const total = parseInt(res.headers['content-length'], 10);
      let dl = 0;
      res.on('data', (chunk) => {
        dl += chunk.length;
        if (total) {
          process.stdout.write(`\rDownloading: ${((dl / total) * 100).toFixed(1)}% (${(dl / 1024 / 1024).toFixed(1)} MB)`);
        }
      });
      res.pipe(file);
      file.on('finish', () => { file.close(); console.log('\nDownload complete.'); resolve(); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  // Download
  if (!fs.existsSync(ZST_FILE)) {
    console.log(`Downloading from ${DB_URL}...`);
    await download(DB_URL, ZST_FILE);
  } else {
    console.log('Using cached .zst file.');
  }

  // Decompress
  if (!fs.existsSync(CSV_FILE)) {
    console.log('Decompressing with zstd...');
    execSync(`zstd -d "${ZST_FILE}" -o "${CSV_FILE}" --force`, { stdio: 'inherit' });
  } else {
    console.log('Using cached CSV file.');
  }

  // Parse
  console.log(`Parsing CSV, collecting up to ${TARGET} valid puzzles...`);
  const puzzles = [];
  const stream = fs.createReadStream(CSV_FILE, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (!line.trim()) continue;

    const fields = line.split(',');
    if (fields.length < 9) continue;

    const puzzleId = fields[0];
    const fen = fields[1];
    const movesStr = fields[2];
    const rating = parseInt(fields[3], 10);
    const popularity = parseInt(fields[5], 10);
    const nbPlays = parseInt(fields[6], 10);
    const themes = fields[7] ? fields[7].split(' ').filter(Boolean) : [];
    const gameUrl = fields[8] || '';

    if (!fen || !movesStr) continue;

    const moves = movesStr.split(' ').filter(m => m && m.length >= 4);
    if (moves.length < 2) continue;
    if (isNaN(rating)) continue;
    if (popularity < MIN_POPULARITY) continue;
    if (nbPlays < MIN_PLAYS) continue;

    puzzles.push({
      id: puzzleId,
      fen,
      moves,
      rating,
      themes,
      popularity,
      nbPlays,
      gameUrl,
    });

    if (puzzles.length % 1000 === 0) {
      process.stdout.write(`\r${puzzles.length} valid puzzles found (scanned ${lineNum} lines)...`);
    }

    if (puzzles.length >= TARGET) {
      rl.close();
      break;
    }
  }

  console.log(`\nCollected ${puzzles.length} puzzles from ${lineNum} lines.`);

  // Rating distribution
  const buckets = { '<1200': 0, '1200-1599': 0, '1600-1999': 0, '2000+': 0 };
  for (const p of puzzles) {
    if (p.rating < 1200) buckets['<1200']++;
    else if (p.rating < 1600) buckets['1200-1599']++;
    else if (p.rating < 2000) buckets['1600-1999']++;
    else buckets['2000+']++;
  }
  console.log('Rating distribution:', buckets);

  // Save
  const output = {
    metadata: {
      source: 'Lichess Puzzle Database',
      processed_at: new Date().toISOString(),
      total_puzzles: puzzles.length,
      rating_range: {
        min: Math.min(...puzzles.map(p => p.rating)),
        max: Math.max(...puzzles.map(p => p.rating)),
      },
      themes: [...new Set(puzzles.flatMap(p => p.themes))].sort(),
    },
    puzzles,
  };

  const dir = path.dirname(OUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Saved ${puzzles.length} puzzles to ${OUT_FILE}`);

  // Cleanup
  console.log('Cleaning up temp files...');
  if (fs.existsSync(CSV_FILE)) fs.unlinkSync(CSV_FILE);
  if (fs.existsSync(ZST_FILE)) fs.unlinkSync(ZST_FILE);
  console.log('Done.');
}

main().catch(console.error);
