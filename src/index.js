#!/usr/bin/env node

import { intro, outro, text, password, isCancel, spinner, note, select } from '@clack/prompts';
import chalk from 'chalk';
import { getToken, setToken, setUsername, getUsername } from './lib/config.js';
import { validateToken } from './lib/github.js';
import { authorizeDevice } from './lib/auth.js';

async function checkAuth() {
  let token = getToken();
  let username = getUsername();

  if (!token) {
    token = await authorizeDevice();
    const validUser = await validateToken(token);
    if (!validUser) {
        console.error(chalk.red('Failed to validate the new token.'));
        process.exit(1);
    }
    setToken(token);
    setUsername(validUser.login);
    console.log(chalk.green(`\nSuccess! Authenticated as ${validUser.name || validUser.login}.`));
    console.log(chalk.green('Credentials saved securely. You won\'t be asked again.'));
  } else {
    // Silent validation on subsequent runs
    const validUser = await validateToken(token);
    if (!validUser) {
        console.log(chalk.red('Your saved GitHub token is invalid or expired.'));
        setToken(null);
        setUsername(null);
        return checkAuth(); // recurse to ask again
    }
  }
}

async function mainMenu() {
  const username = getUsername();
  
  const action = await select({
    message: 'What do you want to do?',
    options: [
      { value: 'new', label: 'Create new repository' },
      { value: 'push', label: 'Commit & Push current folder' },
      { value: 'list', label: 'List my repositories' },
      { value: 'branch', label: 'Manage branches' },
      { value: 'pr', label: 'Pull Requests' },
      { value: 'issues', label: 'Issues' },
      { value: 'ci', label: 'Setup CI/CD' },
      { value: 'readme', label: 'Generate README' },
      { value: 'settings', label: 'Settings' },
      { value: 'exit', label: 'Exit' }
    ]
  });

  if (isCancel(action) || action === 'exit') {
    outro('Goodbye!');
    process.exit(0);
  }

  // Route to commands
  switch (action) {
    case 'new':
      await import('./commands/new.js').then(m => m.default());
      break;
    case 'push':
      await import('./commands/push.js').then(m => m.default());
      break;
    case 'list':
      await import('./commands/list.js').then(m => m.default());
      break;
    case 'branch':
      await import('./commands/branch.js').then(m => m.default());
      break;
    case 'pr':
      await import('./commands/pr.js').then(m => m.default());
      break;
    case 'issues':
      await import('./commands/issues.js').then(m => m.default());
      break;
    case 'ci':
      await import('./commands/ci.js').then(m => m.default());
      break;
    case 'readme':
      await import('./commands/readme.js').then(m => m.default());
      break;
    case 'settings':
      await import('./commands/settings.js').then(m => m.default());
      break;
  }
  
  // Return to main menu after action completes
  await mainMenu();
}

async function main() {
  // Try to get username for banner, if not set use default
  const userStr = getUsername() || 'GitHub CLI';
  intro(chalk.bgCyan.black(` PUSHIT v1.0.0 `) + chalk.dim(`\n [${userStr}] · GitHub CLI `));
  
  await checkAuth();

  await mainMenu();
}

main().catch(console.error);
