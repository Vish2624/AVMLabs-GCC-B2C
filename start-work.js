// Start a work session: get the latest main from GitHub before you change anything.
//
//   npm run start-work
//
// Stops if you have uncommitted changes, so nothing of yours is overwritten.
import { spawnSync } from 'node:child_process';

const git = (...args) => spawnSync('git', args, { encoding: 'utf8' });
// One command string: npm is npm.cmd on Windows, which needs a shell. Arguments are fixed, never user input.
const npm = (...args) => spawnSync(`npm ${args.join(' ')}`, { stdio: 'inherit', shell: true });

function stop(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

const changes = git('status', '--porcelain').stdout.trim();
if (changes) {
  stop(
    'You have changes that are not committed yet:\n\n' +
      git('status', '--short').stdout +
      '\nChoose one, then run npm run start-work again:\n' +
      '  - Keep and share them:   npm run end-work\n' +
      '  - Put them aside:        git stash          (bring them back later with: git stash pop)\n' +
      '  - Throw them away:       git restore . && git clean -fd   (cannot be undone)',
  );
}

console.log('Switching to main...');
const branch = git('branch', '--show-current').stdout.trim();
if (branch !== 'main' && git('switch', 'main').status !== 0) stop('Could not switch to main.');

console.log('Getting the latest changes from GitHub...');
const pull = git('pull', '--ff-only');
process.stdout.write(pull.stdout);
if (pull.status !== 0) {
  process.stderr.write(pull.stderr);
  stop(
    'Could not pull. Usually this means you have commits that were never pushed,\n' +
      'and your friend has pushed new work since. Run npm run end-work to merge and push yours first.',
  );
}

console.log('Installing packages...');
if (npm('install').status !== 0) stop('npm install failed - see the errors above.');

console.log('\nReady. Run: npm run dev   (site: http://localhost:3000, admin: http://localhost:3000/admin/)');
