import { select, multiselect, text, isCancel, spinner, note, outro } from '@clack/prompts';
import chalk from 'chalk';
import { getGit, isRepo } from '../lib/git.js';

export default async function() {
  const repoExists = await isRepo();
  if (!repoExists) {
    console.log(chalk.red('No git repo found in this folder. Use Create New Repo first.'));
    await text({ message: 'Press Enter to return to menu...' });
    return;
  }

  const git = getGit();
  const s = spinner();
  s.start('Checking for changes...');
  const status = await git.status();
  s.stop();

  if (status.files.length === 0) {
    console.log(chalk.yellow('Nothing to commit. Everything is up to date.'));
    await text({ message: 'Press Enter to return to menu...' });
    return;
  }

  const fileOptions = status.files.map(file => {
    let type = file.index === '?' ? 'A' : file.index.trim() || file.working_dir.trim();
    if (type === '??') type = 'A';
    return {
      value: file.path,
      label: `${chalk.yellow(type.padEnd(2))} ${file.path}`
    };
  });

  const filesToStage = await multiselect({
    message: 'Select files to commit (Space to select, Enter to confirm):',
    options: fileOptions,
    required: true
  });

  if (isCancel(filesToStage)) return;

  const commitType = await select({
    message: 'Commit type (Conventional Commits):',
    options: [
      { value: 'feat', label: 'feat: A new feature' },
      { value: 'fix', label: 'fix: A bug fix' },
      { value: 'docs', label: 'docs: Documentation only changes' },
      { value: 'style', label: 'style: Formatting, missing semi colons, etc' },
      { value: 'refactor', label: 'refactor: Code change that neither fixes a bug nor adds a feature' },
      { value: 'perf', label: 'perf: Code change that improves performance' },
      { value: 'test', label: 'test: Adding missing tests or correcting existing tests' },
      { value: 'chore', label: 'chore: Changes to build process or auxiliary tools' }
    ]
  });

  if (isCancel(commitType)) return;

  const commitMessage = await text({
    message: 'Commit message subject:',
    placeholder: 'add interactive staging'
  });

  if (isCancel(commitMessage)) return;

  const message = `${commitType}: ${commitMessage}`;

  s.start('Committing and pushing...');
  try {
    // Stage selected files individually
    for (const file of filesToStage) {
      await git.add(file);
    }
    s.message(`Staged ${filesToStage.length} file(s)`);
    
    await git.commit(message);
    s.message(`Committed: "${message}"`);
    
    const branchInfo = await git.branchLocal();
    const branch = branchInfo.current;
    
    await git.push(['-u', 'origin', branch]);
    s.stop(chalk.green(`✓ Pushed to ${branch}`));
    
    await text({ message: 'Press Enter to return to menu...' });
  } catch (err) {
    s.stop(chalk.red('Failed'));
    console.error(chalk.red(err.message));
    await text({ message: 'Press Enter to return to menu...' });
  }
}
