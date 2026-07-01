import { select, text, confirm, isCancel, spinner } from '@clack/prompts';
import chalk from 'chalk';
import { getGit, isRepo } from '../lib/git.js';

export default async function manageBranches() {
  const repoExists = await isRepo();
  if (!repoExists) {
    console.log(chalk.red('No git repo found in this folder.'));
    await text({ message: 'Press Enter to return to menu...' });
    return;
  }

  const git = getGit();
  const branches = await git.branchLocal();
  const currentBranch = branches.current;
  const branchList = branches.all;

  const action = await select({
    message: `Manage branches (Current: ${chalk.green(currentBranch)}):`,
    options: [
      { value: 'view', label: 'View all branches' },
      { value: 'create', label: 'Create new branch' },
      { value: 'switch', label: 'Switch to branch' },
      { value: 'delete', label: 'Delete branch' },
      { value: 'back', label: 'Back' }
    ]
  });

  if (isCancel(action) || action === 'back') return;

  if (action === 'view') {
    console.log(chalk.cyan('\nLocal branches:'));
    branchList.forEach(b => {
      if (b === currentBranch) {
        console.log(`  * ${chalk.green(b)}`);
      } else {
        console.log(`    ${b}`);
      }
    });
    console.log();
    await text({ message: 'Press Enter to return...' });
    return manageBranches();
  }

  if (action === 'create') {
    const newBranch = await text({ message: 'New branch name:' });
    if (isCancel(newBranch) || !newBranch) return manageBranches();

    const switchNow = await confirm({ message: 'Switch to this branch immediately?', initialValue: true });
    if (isCancel(switchNow)) return manageBranches();

    const s = spinner();
    s.start('Creating branch...');
    try {
      if (switchNow) {
        await git.checkoutLocalBranch(newBranch);
        s.stop(chalk.green(`✓ Created and switched to ${newBranch}`));
      } else {
        await git.branch([newBranch]);
        s.stop(chalk.green(`✓ Created branch ${newBranch}`));
      }
    } catch (err) {
      s.stop(chalk.red('Failed to create branch'));
      console.error(chalk.red(err.message));
    }
    await text({ message: 'Press Enter to return...' });
    return manageBranches();
  }

  if (action === 'switch') {
    if (branchList.length <= 1) {
      console.log(chalk.yellow('No other branches to switch to.'));
      await text({ message: 'Press Enter to return...' });
      return manageBranches();
    }

    const targetBranch = await select({
      message: 'Select branch to switch to:',
      options: branchList.filter(b => b !== currentBranch).map(b => ({ value: b, label: b }))
    });
    if (isCancel(targetBranch)) return manageBranches();

    const s = spinner();
    s.start(`Switching to ${targetBranch}...`);
    try {
      await git.checkout(targetBranch);
      s.stop(chalk.green(`✓ Switched to ${targetBranch}`));
    } catch (err) {
      s.stop(chalk.red('Failed to switch branch'));
      console.error(chalk.red(err.message));
    }
    await text({ message: 'Press Enter to return...' });
    return manageBranches();
  }

  if (action === 'delete') {
    if (branchList.length <= 1) {
      console.log(chalk.yellow('Cannot delete the only branch.'));
      await text({ message: 'Press Enter to return...' });
      return manageBranches();
    }

    const targetBranch = await select({
      message: 'Select branch to delete:',
      options: branchList.filter(b => b !== currentBranch).map(b => ({ value: b, label: b }))
    });
    if (isCancel(targetBranch)) return manageBranches();

    const confirmDelete = await confirm({ message: `Are you sure you want to delete ${targetBranch}?`, initialValue: false });
    if (isCancel(confirmDelete) || !confirmDelete) return manageBranches();

    const s = spinner();
    s.start(`Deleting ${targetBranch}...`);
    try {
      await git.deleteLocalBranch(targetBranch);
      s.stop(chalk.green(`✓ Deleted branch ${targetBranch}`));
    } catch (err) {
      s.stop(chalk.red('Failed to delete branch'));
      console.error(chalk.red(err.message));
    }
    await text({ message: 'Press Enter to return...' });
    return manageBranches();
  }
}
