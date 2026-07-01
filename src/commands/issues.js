import { select, text, isCancel, spinner } from '@clack/prompts';
import chalk from 'chalk';
import open from 'open';
import { getRepoInfo, isRepo } from '../lib/git.js';
import { getOctokit } from '../lib/github.js';

export default async function manageIssues() {
  const repoExists = await isRepo();
  if (!repoExists) {
    console.log(chalk.red('No git repo found in this folder.'));
    await text({ message: 'Press Enter to return...' });
    return;
  }

  const repoInfo = await getRepoInfo();
  if (!repoInfo) {
    console.log(chalk.red('No GitHub remote "origin" found.'));
    await text({ message: 'Press Enter to return...' });
    return;
  }

  const action = await select({
    message: 'Issues:',
    options: [
      { value: 'view', label: 'View open issues' },
      { value: 'create', label: 'Create new issue' },
      { value: 'back', label: 'Back' }
    ]
  });

  if (isCancel(action) || action === 'back') return;

  const octokit = getOctokit();

  if (action === 'create') {
    const title = await text({ message: 'Issue Title:' });
    if (isCancel(title) || !title) return manageIssues();

    const body = await text({ message: 'Issue Body (optional):' });
    if (isCancel(body)) return manageIssues();

    const s = spinner();
    s.start('Creating Issue...');
    try {
      const { data: issue } = await octokit.rest.issues.create({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        title,
        body
      });
      s.stop(chalk.green(`✓ Issue created: ${issue.html_url}`));
      await text({ message: 'Press Enter to return...' });
    } catch (err) {
      s.stop(chalk.red('Failed to create issue'));
      console.error(chalk.red(err.message));
      await text({ message: 'Press Enter to return...' });
    }
    return manageIssues();
  }

  if (action === 'view') {
    const s = spinner();
    s.start('Fetching open issues...');
    try {
      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        state: 'open'
      });
      s.stop();

      // Filter out PRs, as GitHub API returns PRs as issues too
      const actualIssues = issues.filter(i => !i.pull_request);

      if (actualIssues.length === 0) {
        console.log(chalk.yellow('No open issues.'));
        await text({ message: 'Press Enter to return...' });
        return manageIssues();
      }

      const issueSelection = await select({
        message: 'Select an issue to open in browser:',
        options: [
          ...actualIssues.map(i => ({
            value: i.html_url,
            label: `#${i.number} ${i.title} (by ${i.user.login})`
          })),
          { value: 'back', label: 'Back' }
        ]
      });

      if (isCancel(issueSelection) || issueSelection === 'back') return manageIssues();

      await open(issueSelection);
      return manageIssues();
    } catch (err) {
      s.stop(chalk.red('Failed to fetch issues'));
      console.error(chalk.red(err.message));
      await text({ message: 'Press Enter to return...' });
      return manageIssues();
    }
  }
}
