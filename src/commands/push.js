import { select, multiselect, text, isCancel, spinner, note, outro } from '@clack/prompts';
import chalk from 'chalk';
import { getGit, isRepo } from '../lib/git.js';

export const config = { requireGit: true };

export default async function() {
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

  const commitMethod = await select({
    message: 'How do you want to write your commit message?',
    options: [
      { value: 'manual', label: ' ⌨  Write manually' },
      { value: 'ai', label: ' ⎔  Auto-generate with AI' }
    ]
  });

  if (isCancel(commitMethod)) return;

  let message = '';

  if (commitMethod === 'ai') {
    const aiSpinner = spinner();
    aiSpinner.start(' ⎔  AI is analyzing your changes...');
    
    // Simulate AI thinking delay
    await new Promise(r => setTimeout(r, 1500));
    
    // Naive local "AI" algorithm based on filenames
    const hasPackageJson = filesToStage.some(f => f.includes('package.json'));
    const hasTests = filesToStage.some(f => f.includes('test') || f.includes('spec'));
    const hasDocs = filesToStage.some(f => f.includes('README') || f.includes('.md'));
    
    let type = 'feat';
    let subject = 'Update files';
    
    if (hasPackageJson) {
      type = 'chore';
      subject = 'Update dependencies and project config';
    } else if (hasTests) {
      type = 'test';
      subject = 'Add or update test suites';
    } else if (hasDocs) {
      type = 'docs';
      subject = 'Update documentation';
    } else {
      const firstFile = filesToStage[0].split('/').pop();
      type = 'feat';
      subject = `Update ${firstFile} and related components`;
    }
    
    message = `${type}: ${subject}`;
    aiSpinner.stop(chalk.green(`✓ AI Generated: "${message}"`));
    
    const confirm = await select({
      message: 'Use this commit message?',
      options: [
        { value: 'yes', label: 'Yes, proceed' },
        { value: 'no', label: 'No, let me write it' }
      ]
    });
    
    if (isCancel(confirm)) return;
    if (confirm === 'no') {
      message = ''; // Fall through to manual
    }
  }

  if (!message) {
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

    message = `${commitType}: ${commitMessage}`;
  }

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
