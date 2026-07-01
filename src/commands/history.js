import { select, text, isCancel, spinner, note } from '@clack/prompts';
import chalk from 'chalk';
import { getGit, isRepo } from '../lib/git.js';

export const config = { requireGit: true };

export default async function() {
  const git = getGit();

  const action = await select({
    message: 'History & Undo Manager:',
    options: [
      { value: 'log', label: ' ≡  View Commit History' },
      { value: 'undo', label: ' ↺  Undo Last Commit (Keep code changes)' },
      { value: 'stash', label: ' ⊞  Stash Current Changes' },
      { value: 'pop', label: ' ⊟  Pop Stashed Changes' },
      { value: 'back', label: ' ↤  Back to Menu' }
    ]
  });

  if (isCancel(action) || action === 'back') return;

  const s = spinner();

  try {
    switch (action) {
      case 'log':
        const log = await git.log({ maxCount: 5 });
        console.log('\n' + chalk.bold.cyan('--- Recent Commits ---'));
        log.all.forEach(commit => {
          console.log(`${chalk.yellow(commit.hash.substring(0, 7))} - ${chalk.white(commit.message)} ${chalk.gray(`(${commit.date})`)}`);
        });
        console.log('');
        break;

      case 'undo':
        const undoConfirm = await select({
          message: chalk.yellow('Are you sure you want to undo the last commit? Your code changes will remain staged.'),
          options: [
            { value: 'yes', label: 'Yes, Undo Last Commit' },
            { value: 'no', label: 'Cancel' }
          ]
        });
        
        if (undoConfirm === 'yes') {
          s.start('Undoing last commit...');
          await git.reset(['--soft', 'HEAD~1']);
          s.stop(chalk.green('✓ Last commit undone. Your files are staged and ready to be modified.'));
        }
        break;

      case 'stash':
        const status = await git.status();
        if (status.files.length === 0) {
          note(chalk.yellow('No changes to stash.'));
        } else {
          const stashMessage = await text({
            message: 'Stash message (optional):',
            placeholder: 'WIP: fixing bug'
          });
          
          if (!isCancel(stashMessage)) {
            s.start('Stashing changes...');
            if (stashMessage) {
              await git.stash(['save', stashMessage]);
            } else {
              await git.stash();
            }
            s.stop(chalk.green('✓ Changes successfully stashed.'));
          }
        }
        break;

      case 'pop':
        s.start('Checking stashes...');
        const stashList = await git.stashList();
        
        if (stashList.all.length === 0) {
          s.stop(chalk.yellow('No stashes found.'));
        } else {
          s.stop('Stashes found.');
          const stashOptions = stashList.all.map((stash, index) => ({
            value: index,
            label: `stash@{${index}}: ${stash.message}`
          }));
          
          const stashToPop = await select({
            message: 'Select a stash to pop:',
            options: stashOptions
          });
          
          if (!isCancel(stashToPop)) {
            s.start('Popping stash...');
            await git.stash(['pop', `stash@{${stashToPop}}`]);
            s.stop(chalk.green('✓ Stash applied successfully.'));
          }
        }
        break;
    }
  } catch (err) {
    s.stop(chalk.red('Operation failed.'));
    console.error(chalk.red(err.message));
  }

  await text({ message: 'Press Enter to return to menu...' });
}
