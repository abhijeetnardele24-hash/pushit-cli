import { select, text, isCancel, spinner, note } from '@clack/prompts';
import chalk from 'chalk';
import Table from 'cli-table3';
import open from 'open';
import { getOctokit } from '../lib/github.js';
import { getRepoInfo } from '../lib/git.js';

export default async function() {
  const repoInfo = await getRepoInfo();
  if (!repoInfo) {
    note(chalk.red('Not a GitHub repository.'));
    await text({ message: 'Press Enter to return...' });
    return;
  }

  const action = await select({
    message: 'Issues Options:',
    options: [
      { value: 'list', label: '[ ☰ ] List Issues' },
      { value: 'create', label: '[ + ] Create Issue' },
      { value: 'open', label: '[ ⚑ ] Open an Issue in Browser' },
      { value: 'back', label: '[ ↵ ] Back to main menu' }
    ]
  });

  if (isCancel(action) || action === 'back') return;

  const octokit = getOctokit();
  const s = spinner();

  if (action === 'list') {
    s.start('Fetching Issues...');
    const { data: issues } = await octokit.rest.issues.listForRepo({ owner: repoInfo.owner, repo: repoInfo.repo, state: 'all' });
    s.stop(chalk.green('✓ Issues fetched'));

    const actualIssues = issues.filter(i => !i.pull_request);

    if (actualIssues.length === 0) {
      console.log(chalk.gray('\nNo issues found.\n'));
    } else {
      const table = new Table({
        head: [chalk.cyan('ID'), chalk.cyan('Title'), chalk.cyan('Status'), chalk.cyan('Author')]
      });
      actualIssues.slice(0, 15).forEach(issue => {
        const status = issue.state === 'closed' ? chalk.red('Closed') : chalk.green('Open');
        table.push([`#${issue.number}`, issue.title.substring(0, 50), status, issue.user.login]);
      });
      console.log('\n' + table.toString() + '\n');
    }
    await text({ message: 'Press Enter to return...' });
  }

  if (action === 'open') {
    const issueNum = await text({ message: 'Enter Issue Number (e.g. 1):' });
    if (!isCancel(issueNum) && issueNum.trim() !== '') {
      await open(`https://github.com/${repoInfo.owner}/${repoInfo.repo}/issues/${issueNum}`);
    }
  }

  if (action === 'create') {
    let state = {
      title: '',
      body: ''
    };

    const askTitle = async () => {
      const res = await text({ message: 'Issue Title:', defaultValue: state.title });
      if (isCancel(res)) return false;
      state.title = res; return true;
    };
    const askBody = async () => {
      const res = await text({ message: 'Description:', defaultValue: state.body });
      if (isCancel(res)) return false;
      state.body = res; return true;
    };

    if (!(await askTitle())) return;
    if (!(await askBody())) return;

    // Review & Edit Loop
    while (true) {
      console.log();
      const table = new Table({
        head: [chalk.cyan('Field'), chalk.cyan('Value')]
      });
      table.push(
        ['Title', chalk.green(state.title)],
        ['Description', chalk.gray(state.body || '(empty)')]
      );
      console.log(chalk.bold.yellow('📝 Review Issue:'));
      console.log(table.toString());
      console.log();

      const editAction = await select({
        message: 'Does this look correct?',
        options: [
          { value: 'proceed', label: '🚀 Yes, Create Issue!' },
          { value: 'edit_title', label: '✏️  Edit Title' },
          { value: 'edit_body', label: '✏️  Edit Description' },
          { value: 'cancel', label: '❌ Cancel' }
        ]
      });

      if (isCancel(editAction) || editAction === 'cancel') return;
      if (editAction === 'proceed') break;
      
      if (editAction === 'edit_title') await askTitle();
      if (editAction === 'edit_body') await askBody();
    }

    try {
      s.start('Creating Issue...');
      const { data: issue } = await octokit.rest.issues.create({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        title: state.title,
        body: state.body
      });
      s.stop(chalk.green('✓ Issue created!'));
      note(`Live at: ${issue.html_url}`);
      await text({ message: 'Press Enter to return...' });
    } catch (err) {
      s.stop(chalk.red('Failed'));
      console.error(chalk.red(err.message));
      await text({ message: 'Press Enter to return...' });
    }
  }
}
