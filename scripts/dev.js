import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

// Start BE server in a new window (same behaviour as before)
spawn('cmd', ['/c', 'start', 'Leaderboard Server', 'server\\LeaderboardExtractorServer.exe'], {
  cwd: root,
  shell: false,
  detached: true,
  stdio: 'ignore',
});

// Start vite in the foreground
const vite = spawn('npx', ['vite'], {
  cwd: root,
  shell: true,
  stdio: 'inherit',
});

let exiting = false;

async function shutdown() {
  if (exiting) return;
  exiting = true;
  console.log('\nSending /quit to leaderboard server...');
  try {
    await fetch('http://localhost:8080/quit');
  } catch (_) {
    // Server may already be gone
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

vite.on('exit', (code) => {
  if (code !== null) shutdown();
});
