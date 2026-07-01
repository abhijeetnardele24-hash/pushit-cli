#!/usr/bin/env node

import { intro, outro, text, password, isCancel, spinner, note, select } from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getToken, setToken, setUsername, getUsername } from './lib/config.js';
import { validateToken } from './lib/github.js';
import { authorizeDevice } from './lib/auth.js';
import { isRepo } from './lib/git.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically read version from package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

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
      { value: 'new', label: ' ⊕  Create new repository' },
      { value: 'push', label: ' ⇡  Commit & Push current folder' },
      { value: 'history', label: ' ↺  History & Undo Manager' },
      { value: 'list', label: ' ≡  List & Manage my repositories' },
      { value: 'branch', label: ' ᛦ  Manage branches' },
      { value: 'pr', label: ' ⇌  Pull Requests' },
      { value: 'issues', label: ' ⊙  Issues' },
      { value: 'ci', label: ' ⎔  GitHub Actions (CI/CD)' },
      { value: 'readme', label: ' ▤  Generate README' },
      { value: 'settings', label: ' ❖  Settings & Config' },
      { value: 'exit', label: ' ✕  Exit' }
    ]
  });

  if (isCancel(action) || action === 'exit') {
    outro('Goodbye!');
    process.exit(0);
  }

  // Global Error Handler & Dynamic Command Registry
  try {
    const commandModule = await import(`./commands/${action}.js`);
    
    // Command Middleware: Check if it requires a git repo
    if (commandModule.config?.requireGit) {
      if (!(await isRepo())) {
        note(chalk.red('Error: This command requires you to be inside a Git repository.'));
        await text({ message: 'Press Enter to return to menu...' });
        return await mainMenu();
      }
    }

    // Execute the command
    await commandModule.default();
  } catch (error) {
    // Global catch-all for any command that crashes unexpectedly
    console.log('\n');
    note(chalk.red(`Fatal Error in command [${action}]:\n${error.message}`));
    await text({ message: 'Press Enter to safely return to menu...' });
  }
  
  // Return to main menu after action completes
  await mainMenu();
}

async function main() {
  const userStr = getUsername() || 'GitHub CLI';
  
  const asciiLogo = `
  ___ _   _ ___ _  _ ___ _____ 
 | _ \\ | | / __| || |_ _|_   _|
 |  _/ |_| \\__ \\ __ || |  | |  
 |_|  \\___/|___/_||_|___| |_|  
  `;
  
  console.log(chalk.magentaBright(asciiLogo));
  intro(chalk.bgMagenta.black(` v${pkg.version} `) + chalk.dim(` · [${userStr}]`));
  
  await checkAuth();

  await mainMenu();
}

main().catch(console.error);
