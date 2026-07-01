import { select, text, confirm, isCancel, spinner } from '@clack/prompts';
import chalk from 'chalk';
import { getUsername, getToken, clearConfig } from '../lib/config.js';
import { getOctokit } from '../lib/github.js';
import Conf from 'conf';

const config = new Conf({ projectName: 'pushit' });

export default async function settings() {
  const action = await select({
    message: 'Settings:',
    options: [
      { value: 'view', label: 'View connected account' },
      { value: 'reset', label: 'Reset GitHub credentials' },
      { value: 'branch', label: 'Change default branch name (main/master)' },
      { value: 'clear', label: 'Clear all pushit data' },
      { value: 'back', label: 'Back' }
    ]
  });

  if (isCancel(action) || action === 'back') return;

  if (action === 'view') {
    const s = spinner();
    s.start('Fetching account details...');
    try {
      const octokit = getOctokit();
      const { data: user } = await octokit.rest.users.getAuthenticated();
      s.stop();

      const token = getToken();
      const maskedToken = '*'.repeat(16) + token.slice(-4);

      console.log(chalk.cyan('\n--- Connected Account ---'));
      console.log(`Username: ${user.login}`);
      console.log(`Email:    ${user.email || 'Not public'}`);
      console.log(`Repos:    ${user.public_repos} public, ${user.total_private_repos || 0} private`);
      console.log(`Token:    ${maskedToken}`);
      console.log(chalk.cyan('-------------------------\n'));

    } catch (err) {
      s.stop(chalk.red('Failed to fetch account details'));
      console.error(chalk.red(err.message));
    }
    await text({ message: 'Press Enter to return...' });
    return settings();
  }

  if (action === 'reset') {
    console.log(chalk.yellow('Are you sure? You\'ll need to re-enter your token.'));
    const confirmReset = await select({
      message: 'Confirm reset:',
      options: [
        { value: true, label: 'Yes, reset' },
        { value: false, label: 'Cancel' }
      ]
    });
    
    if (!isCancel(confirmReset) && confirmReset) {
      config.delete('github_token');
      config.delete('github_username');
      console.log(chalk.green('Credentials reset. Please run pushit again to re-authenticate.'));
      process.exit(0);
    }
    return settings();
  }

  if (action === 'branch') {
    const currentDefault = config.get('default_branch', 'main');
    const newBranch = await text({
      message: 'New default branch name:',
      defaultValue: currentDefault,
      placeholder: currentDefault
    });
    
    if (!isCancel(newBranch) && newBranch) {
      config.set('default_branch', newBranch);
      console.log(chalk.green(`✓ Default branch set to ${newBranch}`));
    }
    await text({ message: 'Press Enter to return...' });
    return settings();
  }

  if (action === 'clear') {
    const confirmClear = await confirm({
      message: chalk.red('Are you SURE you want to clear ALL pushit data? This cannot be undone.'),
      initialValue: false
    });
    
    if (!isCancel(confirmClear) && confirmClear) {
      clearConfig();
      console.log(chalk.green('All pushit data cleared. Exiting.'));
      process.exit(0);
    }
    return settings();
  }
}
