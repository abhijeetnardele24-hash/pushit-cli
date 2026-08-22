import { select, multiselect, text, isCancel, spinner, note, outro } from '@clack/prompts';
import chalk from 'chalk';
import { getGit, isRepo } from '../lib/git.js';
import { suggestCommits } from '../lib/ai.js';
import { getAiKey } from '../lib/config.js';

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

  const filesToStage = (await multiselect({
    message: 'Select files to commit (Space to select, Enter to confirm):',
    options: fileOptions,
    required: true
  })) as string[] | symbol;

  if (isCancel(filesToStage)) return;

  // Stage files immediately so we can get the cached diff
  s.start('Staging files...');
  for (const file of filesToStage) {
    await git.add(file);
  }
  s.stop(`Staged ${filesToStage.length} file(s)`);

  let finalMessage = '';
  
  const aiKey = getAiKey();
  if (aiKey) {
    s.start('Generating AI commit suggestions...');
    try {
      const diff = await git.diff(['--staged']);
      const suggestions = await suggestCommits(diff);
      s.stop('AI generated suggestions.');
      
      const aiChoice = await select({
        message: 'Select an AI-generated commit message (or write your own):',
        options: [
          ...suggestions.map(msg => ({ value: msg, label: `✨ ${msg}` })),
          { value: 'manual', label: '✏️  Write manually' }
        ]
      });

      if (isCancel(aiChoice)) return;
      if (aiChoice !== 'manual') {
        finalMessage = aiChoice as string;
      }
    } catch (err: any) {
      s.stop(chalk.yellow(`AI generation failed: ${err.message}`));
      // Fallback to manual
    }
  }

  if (!finalMessage) {
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

    finalMessage = `${commitType}: ${commitMessage}`;
  }

  s.start('Committing and pushing...');
  try {
    await git.commit(finalMessage);
    s.message(`Committed: "${finalMessage}"`);
    
    const branchInfo = await git.branchLocal();
    const branch = branchInfo.current;
    
    await git.push(['-u', 'origin', branch]);
    s.stop(chalk.green(`🚀 Pushed to ${branch}`));
    
    await text({ message: 'Press Enter to return to menu...' });
  } catch (err: any) {
    s.stop(chalk.red('Failed'));
    console.error(chalk.red(err.message));
    await text({ message: 'Press Enter to return to menu...' });
  }
}
