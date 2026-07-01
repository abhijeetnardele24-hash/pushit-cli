import { select, text, isCancel, spinner, note } from '@clack/prompts';
import chalk from 'chalk';
import Table from 'cli-table3';
import open from 'open';
import { getOctokit } from '../lib/github.js';
import { getRepoInfo, getGit } from '../lib/git.js';

export default async function() {
  const repoInfo = await getRepoInfo();
  if (!repoInfo) {
    note(chalk.red('Not a GitHub repository.'));
    await text({ message: 'Press Enter to return...' });
    return;
  }

  const action = await select({
    message: 'Pull Requests Options:',
    options: [
      { value: 'list', label: '[ ☰ ] List Pull Requests' },
      { value: 'create', label: '[ + ] Create Pull Request' },
      { value: 'open', label: '[ ↹ ] Open a PR in Browser' },
      { value: 'back', label: '[ ↵ ] Back to main menu' }
    ]
  });

  if (isCancel(action) || action === 'back') return;

  const octokit = getOctokit();
  const s = spinner();

  if (action === 'list') {
    s.start('Fetching Pull Requests...');
    const { data: prs } = await octokit.rest.pulls.list({ owner: repoInfo.owner, repo: repoInfo.repo, state: 'all' });
    s.stop(chalk.green('✓ Pull Requests fetched'));

    if (prs.length === 0) {
      console.log(chalk.gray('\nNo pull requests found.\n'));
    } else {
      const table = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('Title'), chalk.cyan('Status'), chalk.cyan('Author')]
      });
      prs.slice(0, 15).forEach(pr => {
        let status = chalk.green('Open');
        if (pr.state === 'closed') status = pr.merged_at ? chalk.magenta('Merged') : chalk.red('Closed');
        table.push([`#${pr.number}`, pr.title.substring(0, 50), status, pr.user.login]);
      });
      console.log('\n' + table.toString() + '\n');
    }
    await text({ message: 'Press Enter to return...' });
  }

  if (action === 'open') {
    const prNumber = await text({ message: 'Enter PR Number (e.g. 1):' });
    if (!isCancel(prNumber) && prNumber.trim() !== '') {
      await open(`https://github.com/${repoInfo.owner}/${repoInfo.repo}/pull/${prNumber}`);
    }
  }

  if (action === 'create') {
    const git = getGit();
    const branchSummary = await git.branchLocal();
    const currentBranch = branchSummary.current;

    let state = {
      title: '',
      body: '',
      head: currentBranch,
      base: 'main'
    };

    const askTitle = async () => {
      const res = await text({ message: 'PR Title:', defaultValue: state.title });
      if (isCancel(res)) return false;
      state.title = res; return true;
    };
    const askBody = async () => {
      const res = await text({ message: 'Description:', defaultValue: state.body });
      if (isCancel(res)) return false;
      state.body = res; return true;
    };
    const askBase = async () => {
      const res = await text({ message: 'Base branch (merging into):', defaultValue: state.base });
      if (isCancel(res)) return false;
      state.base = res; return true;
    };

    if (!(await askTitle())) return;
    if (!(await askBody())) return;
    if (!(await askBase())) return;

    // Review & Edit Loop
    while (true) {
      console.log();
      const table = new Table({
        head: [chalk.cyan('Field'), chalk.cyan('Value')]
      });
      table.push(
        ['Title', chalk.green(state.title)],
        ['Description', chalk.gray(state.body || '(empty)')],
        ['Merging from', chalk.yellow(state.head)],
        ['Merging into', chalk.magenta(state.base)]
      );
      console.log(chalk.bold.yellow('📝 Review Pull Request:'));
      console.log(table.toString());
      console.log();

      const editAction = await select({
        message: 'Does this look correct?',
        options: [
          { value: 'proceed', label: '🚀 Yes, Create PR!' },
          { value: 'edit_title', label: '✏️  Edit Title' },
          { value: 'edit_body', label: '✏️  Edit Description' },
          { value: 'edit_base', label: '✏️  Edit Base Branch' },
          { value: 'cancel', label: '❌ Cancel' }
        ]
      });

      if (isCancel(editAction) || editAction === 'cancel') return;
      if (editAction === 'proceed') break;
      
      if (editAction === 'edit_title') await askTitle();
      if (editAction === 'edit_body') await askBody();
      if (editAction === 'edit_base') await askBase();
    }

    try {
      s.start('Creating Pull Request...');
      const { data: pr } = await octokit.rest.pulls.create({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        title: state.title,
        body: state.body,
        head: state.head,
        base: state.base
      });
      s.stop(chalk.green('✓ Pull Request created!'));
      note(`Live at: ${pr.html_url}`);
      await text({ message: 'Press Enter to return...' });
    } catch (err) {
      s.stop(chalk.red('Failed'));
      console.error(chalk.red(err.message));
      await text({ message: 'Press Enter to return...' });
    }
  }
}
