#!/usr/bin/env node

import { intro, outro, text, isCancel, note, select, confirm } from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import gradient from 'gradient-string';
import { getToken, setToken, setUsername, getUsername } from './lib/config.js';
import { validateToken } from './lib/github.js';
import { authorizeDevice } from './lib/auth.js';
import { isRepo, initAndConnectRemote } from './lib/git.js';
import { CommandConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically read version from package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

export async function checkAuth(): Promise<void> {
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

  try {
    const commandModule = await import(`./commands/${action}.js`);
    const config: CommandConfig = commandModule.config || {};
    
    // Command Middleware: Check if it requires a git repo
    if (config.requireGit) {
      if (!(await isRepo())) {
        const wantsInit = await confirm({
          message: chalk.yellow('This folder is not a Git repository. Would you like to initialize it and connect to an existing remote repository?')
        });
        
        if (isCancel(wantsInit) || !wantsInit) {
          note(chalk.red('Error: This command requires you to be inside a Git repository.'));
          await text({ message: 'Press Enter to return to menu...' });
          return await mainMenu();
        }
        
        const remoteUrl = await text({
          message: 'Enter the GitHub repository URL (e.g. https://github.com/user/repo.git):',
          validate: (val) => val ? undefined : 'URL is required'
        });
        
        if (isCancel(remoteUrl)) {
          return await mainMenu();
        }
        
        console.log(chalk.cyan('Initializing and connecting...'));
        try {
          await initAndConnectRemote(remoteUrl as string);
          console.log(chalk.green('Successfully initialized and connected to remote repository!'));
        } catch (e: any) {
          note(chalk.red(`Failed to connect: ${e.message}`));
          await text({ message: 'Press Enter to return to menu...' });
          return await mainMenu();
        }
      }
    }

    // Command Middleware: Check if it requires GitHub Auth
    if (config.requireAuth) {
      await checkAuth();
    }

    // Execute the command
    await commandModule.default();
  } catch (error: any) {
    // Global catch-all for any command that crashes unexpectedly
    console.log('\n');
    note(chalk.red(`Fatal Error in command [${String(action)}]:\n${error?.message || error}`));
    await text({ message: 'Press Enter to safely return to menu...' });
  }
  
  // Return to main menu after action completes
  await mainMenu();
}

async function main() {
  const userStr = getUsername() || 'Local Mode';
  
  const asciiLogo = `
  ___ _   _ ___ _  _ ___ _____ 
 | _ \\ | | / __| || |_ _|_   _|
 |  _/ |_| \\__ \\ __ || |  | |  
 |_|  \\___/|___/_||_|___| |_|  
  `;
  
  console.log(chalk.cyanBright(asciiLogo));
  intro(chalk.bgCyan.black(` v${pkg.version} `) + chalk.dim(` · [${userStr}]`));
  
  await mainMenu();
}

main().catch(console.error);
