// End a work session: build, check, commit, pull your friend's latest work and push.
//
//   npm run end-work
//
// Stops before committing if the checks fail, and before pushing if the pull conflicts.
import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';

const git = (...args) => spawnSync('git', args, { encoding: 'utf8' });
// One command string: npm is npm.cmd on Windows, which needs a shell. Arguments are fixed, never user input.
const npm = (...args) => spawnSync(`npm ${args.join(' ')}`, { stdio: 'inherit', shell: true });

function stop(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

if (git('branch', '--show-current').stdout.trim() !== 'main') {
  stop('You are not on main. Run npm run start-work first, or switch with: git switch main');
}

console.log('Building...');
if (npm('run', 'build').status !== 0)
  stop('The build failed - see the errors above. Fix them and run npm run end-work again.');

console.log('Checking (lint, format, tests)...');
if (npm('run', 'verify').status !== 0) {
  stop(
    'The checks failed - see the errors above. Nothing was committed.\n' +
      'Tip: formatting errors can usually be fixed with: npm run format   and lint errors with: npm run lint:fix\n' +
      'Then run npm run end-work again.',
  );
}

const changes = git('status', '--short').stdout;
if (changes.trim()) {
  console.log('\nChanged files:\n' + changes);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const message = (await rl.question('Commit message (what did you change?): ')).trim();
  rl.close();
  if (!message) stop('No message given - nothing was committed.');

  git('add', '-A');
  if (/^\.env/m.test(git('diff', '--cached', '--name-only').stdout)) {
    git('reset');
    stop('A .env file was about to be committed. It holds secrets, so nothing was committed.');
  }
  const commit = git('commit', '-m', message);
  if (commit.status !== 0) stop('Commit failed:\n' + commit.stdout + commit.stderr);
  console.log('Committed.');
} else {
  console.log('\nNo changed files to commit.');
}

console.log("Getting your friend's latest changes...");
const pull = git('pull', '--no-rebase', '--no-edit');
process.stdout.write(pull.stdout);
if (pull.status !== 0) {
  const conflicts = git('diff', '--name-only', '--diff-filter=U').stdout.trim();
  if (conflicts) {
    stop(
      'Conflict: you and your friend changed the same lines in:\n  ' +
        conflicts.split('\n').join('\n  ') +
        '\n\nYour commit is safe, nothing was pushed. Either:\n' +
        '  - Fix it: open each file, find the <<<<<<< ======= >>>>>>> markers, keep the right version\n' +
        '    and delete the markers. Then run: git add -A && git commit --no-edit   and npm run end-work again.\n' +
        '  - Undo the pull and ask for help: git merge --abort',
    );
  }
  stop('Pull failed - nothing was pushed:\n' + pull.stderr);
}

if (git('rev-list', '--count', '@{u}..HEAD').stdout.trim() === '0') stop('Nothing new to push - you are up to date.');

console.log('Pushing...');
const push = git('push');
if (push.status !== 0) stop('Push failed - nothing was pushed:\n' + push.stderr);

console.log("\nPushed - tell your friend it's his turn.");
