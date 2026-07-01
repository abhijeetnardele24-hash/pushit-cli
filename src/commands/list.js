import { select, text, isCancel, spinner, note, multiselect } from '@clack/prompts';
import chalk from 'chalk';
import Table from 'cli-table3';
import open from 'open';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getOctokit } from '../lib/github.js';
import { getUsername } from '../lib/config.js';

const execAsync = promisify(exec);

function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " year" + (interval === 1 ? "" : "s") + " ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " month" + (interval === 1 ? "" : "s") + " ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " day" + (interval === 1 ? "" : "s") + " ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
  return Math.floor(seconds) + " seconds ago";
}

const PAGE_SIZE = 10;

export default async function listRepos(page = 0, allRepos = null) {
  const octokit = getOctokit();
  
  if (!allRepos) {
    const s = spinner();
    s.start('Fetching repositories...');
    try {
      allRepos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
        sort: 'updated',
        direction: 'desc',
        per_page: 100
      });
      s.stop();
    } catch (err) {
      s.stop(chalk.red('Failed to fetch repositories'));
      console.error(chalk.red(err.message));
      await text({ message: 'Press Enter to return to menu...' });
      return;
    }
  }

  if (allRepos.length === 0) {
    console.log(chalk.yellow('You have no repositories.'));
    await text({ message: 'Press Enter to return to menu...' });
    return;
  }

  const totalPages = Math.ceil(allRepos.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageRepos = allRepos.slice(start, end);

  const table = new Table({
    head: ['NAME', 'VISIBILITY', 'STARS', 'UPDATED'],
    style: {
      head: ['cyan'],
      border: ['gray']
    }
  });

  pageRepos.forEach(repo => {
    table.push([
      repo.name,
      repo.private ? 'Private' : 'Public',
      repo.private ? '—' : repo.stargazers_count,
      timeAgo(repo.updated_at)
    ]);
  });

  console.log(table.toString());
  console.log(chalk.gray(`Page ${page + 1} of ${totalPages} (Total Repos: ${allRepos.length})`));
  console.log();

  const options = [];
  
  if (page > 0) {
    options.push({ value: 'prev', label: '⬅️  Previous Page' });
  }
  if (page < totalPages - 1) {
    options.push({ value: 'next', label: '➡️  Next Page' });
  }

  options.push(...pageRepos.map(r => ({ value: r, label: r.name })));
  options.push({ value: 'bulk_delete', label: '🗑️  Bulk Delete Repositories' });
  options.push({ value: 'back', label: '⬅️  Back to main menu' });

  const repoSelection = await select({
    message: 'Select a repository to manage, or choose an action:',
    options
  });

  if (isCancel(repoSelection) || repoSelection === 'back') return;

  if (repoSelection === 'next') {
    return listRepos(page + 1, allRepos);
  }
  if (repoSelection === 'prev') {
    return listRepos(page - 1, allRepos);
  }
  if (repoSelection === 'bulk_delete') {
    return handleBulkDelete(allRepos);
  }

  // Selected a specific repo
  await manageRepo(repoSelection, page, allRepos);
}

async function handleBulkDelete(allRepos) {
  const selectedRepos = await multiselect({
    message: 'Select repositories to DELETE (Space to select, Enter to confirm):',
    options: allRepos.map(r => ({ value: r, label: r.name })),
    required: false
  });

  if (isCancel(selectedRepos) || selectedRepos.length === 0) {
    return listRepos(0, allRepos);
  }

  const confirmName = await text({
    message: chalk.red(`Type "DELETE" to confirm deletion of ${selectedRepos.length} repositories:`),
  });

  if (isCancel(confirmName) || confirmName !== 'DELETE') {
    console.log(chalk.yellow('Bulk deletion cancelled.'));
    await text({ message: 'Press Enter to return...' });
    return listRepos(0, allRepos);
  }

  const s = spinner();
  s.start(`Deleting ${selectedRepos.length} repositories...`);
  const octokit = getOctokit();
  const username = getUsername();

  let successCount = 0;
  for (const repo of selectedRepos) {
    try {
      await octokit.rest.repos.delete({
        owner: username,
        repo: repo.name
      });
      successCount++;
    } catch (err) {
      console.log(chalk.red(`Failed to delete ${repo.name}: ${err.message}`));
    }
  }

  s.stop(chalk.green(`✓ Successfully deleted ${successCount}/${selectedRepos.length} repositories.`));
  await text({ message: 'Press Enter to return...' });
  return listRepos(); // Re-fetch repos after deletion
}

async function manageRepo(repo, page, allRepos) {
  const action = await select({
    message: `Manage ${repo.name}:`,
    options: [
      { value: 'open', label: '🌐 Open in browser' },
      { value: 'clone', label: '⬇️  Clone to local machine' },
      { value: 'rename', label: '✏️  Rename this repo' },
      { value: 'toggle', label: repo.private ? '🔓 Make Public' : '🔒 Make Private' },
      { value: 'delete', label: '❌ Delete this repo' },
      { value: 'back', label: '⬅️  Back' }
    ]
  });

  if (isCancel(action) || action === 'back') return listRepos(page, allRepos);

  const octokit = getOctokit();
  const username = getUsername();

  if (action === 'open') {
    await open(repo.html_url);
    return manageRepo(repo, page, allRepos);
  }

  if (action === 'clone') {
    const s = spinner();
    s.start(`Cloning ${repo.name}...`);
    try {
      await execAsync(`git clone ${repo.clone_url}`);
      s.stop(chalk.green(`✓ Successfully cloned ${repo.name} into current directory.`));
      await text({ message: 'Press Enter to return...' });
    } catch (err) {
      s.stop(chalk.red('Failed to clone'));
      console.error(chalk.red(err.message));
      await text({ message: 'Press Enter to return...' });
    }
    return manageRepo(repo, page, allRepos);
  }

  if (action === 'delete') {
    const confirmName = await text({
      message: `Type "${repo.name}" to confirm deletion:`
    });
    if (isCancel(confirmName)) return manageRepo(repo, page, allRepos);
    
    if (confirmName === repo.name) {
      const s = spinner();
      s.start('Deleting repository...');
      try {
        await octokit.rest.repos.delete({
          owner: username,
          repo: repo.name
        });
        s.stop(chalk.green(`✓ Deleted ${repo.name}`));
        await text({ message: 'Press Enter to return...' });
        return listRepos(); // Re-fetch to reflect deletion
      } catch (err) {
        s.stop(chalk.red('Failed to delete'));
        console.error(chalk.red(err.message));
        await text({ message: 'Press Enter to return...' });
        return manageRepo(repo, page, allRepos);
      }
    } else {
      console.log(chalk.red('Name did not match. Deletion cancelled.'));
      await text({ message: 'Press Enter to return...' });
      return manageRepo(repo, page, allRepos);
    }
  }

  if (action === 'rename') {
    const newName = await text({
      message: 'New repository name:',
      defaultValue: repo.name
    });
    if (isCancel(newName) || !newName || newName === repo.name) return manageRepo(repo, page, allRepos);

    const s = spinner();
    s.start('Renaming repository...');
    try {
      const { data: updated } = await octokit.rest.repos.update({
        owner: username,
        repo: repo.name,
        name: newName
      });
      s.stop(chalk.green(`✓ Renamed to ${updated.name}`));
      await text({ message: 'Press Enter to return...' });
      return listRepos(); // Re-fetch to reflect rename
    } catch (err) {
      s.stop(chalk.red('Failed to rename'));
      console.error(chalk.red(err.message));
      await text({ message: 'Press Enter to return...' });
      return manageRepo(repo, page, allRepos);
    }
  }

  if (action === 'toggle') {
    const s = spinner();
    const newVisibility = !repo.private;
    s.start(`Making repository ${newVisibility ? 'Private' : 'Public'}...`);
    try {
      const { data: updated } = await octokit.rest.repos.update({
        owner: username,
        repo: repo.name,
        private: newVisibility
      });
      s.stop(chalk.green(`✓ Changed visibility to ${newVisibility ? 'Private' : 'Public'}`));
      await text({ message: 'Press Enter to return...' });
      return listRepos(); // Re-fetch
    } catch (err) {
      s.stop(chalk.red('Failed to change visibility'));
      console.error(chalk.red(err.message));
      await text({ message: 'Press Enter to return...' });
      return manageRepo(repo, page, allRepos);
    }
  }
}
