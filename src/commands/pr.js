import { select, text, isCancel, spinner } from '@clack/prompts';
import chalk from 'chalk';
import open from 'open';
import { getGit, isRepo, getRepoInfo } from '../lib/git.js';
import { getOctokit } from '../lib/github.js';

export default async function managePRs() {
  const repoExists = await isRepo();
  if (!repoExists) {
    console.log(chalk.red('No git repo found in this folder.'));
    await text({ message: 'Press Enter to return to menu...' });
    return;
  }

  const repoInfo = await getRepoInfo();
  if (!repoInfo) {
    console.log(chalk.red('No GitHub remote "origin" found.'));
    await text({ message: 'Press Enter to return to menu...' });
    return;
  }

  const action = await select({
    message: 'Pull Requests:',
    options: [
      { value: 'create', label: 'Create new PR' },
      { value: 'view', label: 'View open PRs' },
      { value: 'back', label: 'Back' }
    ]
  });

  if (isCancel(action) || action === 'back') return;

  const octokit = getOctokit();

  if (action === 'create') {
    const git = getGit();
    const branches = await git.branchLocal();
    const branchList = branches.all;

    const title = await text({ message: 'PR Title:' });
    if (isCancel(title) || !title) return managePRs();

    const description = await text({ message: 'Description (optional):' });
    if (isCancel(description)) return managePRs();

    const fromBranch = await select({
      message: 'From branch:',
      options: branchList.map(b => ({ value: b, label: b })),
      initialValue: branches.current
    });
    if (isCancel(fromBranch)) return managePRs();

    const intoBranch = await select({
      message: 'Into branch:',
      options: branchList.map(b => ({ value: b, label: b })),
      initialValue: branchList.includes('main') ? 'main' : (branchList.includes('master') ? 'master' : undefined)
    });
    if (isCancel(intoBranch)) return managePRs();

    const s = spinner();
    s.start('Creating Pull Request...');
    try {
      const { data: pr } = await octokit.rest.pulls.create({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        title,
        body: description,
        head: fromBranch,
        base: intoBranch
      });
      s.stop(chalk.green(`✓ PR created: ${pr.html_url}`));
      await text({ message: 'Press Enter to return...' });
    } catch (err) {
      s.stop(chalk.red('Failed to create PR'));
      console.error(chalk.red(err.message));
      await text({ message: 'Press Enter to return...' });
    }
    return managePRs();
  }

  if (action === 'view') {
    const s = spinner();
    s.start('Fetching open PRs...');
    try {
      const { data: prs } = await octokit.rest.pulls.list({
        owner: repoInfo.owner,
        repo: repoInfo.repo,
        state: 'open'
      });
      s.stop();

      if (prs.length === 0) {
        console.log(chalk.yellow('No open pull requests.'));
        await text({ message: 'Press Enter to return...' });
        return managePRs();
      }

      const prSelection = await select({
        message: 'Select a PR to open in browser:',
        options: [
          ...prs.map(pr => ({
            value: pr.html_url,
            label: `#${pr.number} ${pr.title} (by ${pr.user.login})`
          })),
          { value: 'back', label: 'Back' }
        ]
      });

      if (isCancel(prSelection) || prSelection === 'back') return managePRs();

      await open(prSelection);
      return managePRs();
    } catch (err) {
      s.stop(chalk.red('Failed to fetch PRs'));
      console.error(chalk.red(err.message));
      await text({ message: 'Press Enter to return...' });
      return managePRs();
    }
  }
}
