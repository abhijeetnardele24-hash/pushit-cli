import { text, select, confirm, spinner, note, isCancel, outro } from '@clack/prompts';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { getOctokit } from '../lib/github.js';
import { getGit, isRepo } from '../lib/git.js';
import { getUsername } from '../lib/config.js';

export default async function() {
  const folderName = path.basename(process.cwd());

  const name = await text({
    message: 'Repo name:',
    defaultValue: folderName,
    placeholder: folderName
  });
  if (isCancel(name)) return;

  const description = await text({
    message: 'Description (optional):',
  });
  if (isCancel(description)) return;

  const visibility = await select({
    message: 'Visibility:',
    options: [
      { value: 'public', label: 'Public' },
      { value: 'private', label: 'Private' }
    ]
  });
  if (isCancel(visibility)) return;

  const initReadme = await select({
    message: 'Initialize with README?',
    options: [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' }
    ]
  });
  if (isCancel(initReadme)) return;

  const gitignore = await select({
    message: 'Add .gitignore for:',
    options: [
      { value: 'Node', label: 'Node.js' },
      { value: 'Python', label: 'Python' },
      { value: 'Android', label: 'Android' },
      { value: 'Java', label: 'Java' },
      { value: 'none', label: 'None' }
    ]
  });
  if (isCancel(gitignore)) return;

  const license = await select({
    message: 'Add License:',
    options: [
      { value: 'mit', label: 'MIT' },
      { value: 'apache', label: 'Apache 2.0' },
      { value: 'gpl', label: 'GPL 3.0' },
      { value: 'none', label: 'None' }
    ]
  });
  if (isCancel(license)) return;

  console.log(); // empty line

  const s = spinner();
  const octokit = getOctokit();
  const git = getGit();

  try {
    s.start('Creating GitHub repository...');
    
    const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
      name: name || folderName,
      description: description || '',
      private: visibility === 'private'
    });
    s.stop(chalk.green('✓ GitHub repo created'));

    s.start('Initializing local git...');
    const repoExists = await isRepo();
    if (!repoExists) {
      await git.init();
    }
    s.stop(chalk.green('✓ Git initialized locally'));

    if (gitignore !== 'none') {
      s.start('Adding .gitignore...');
      // Fetch gitignore template from github API
      const { data: template } = await octokit.rest.gitignore.getTemplate({
        name: gitignore
      });
      fs.writeFileSync('.gitignore', template.source);
      s.stop(chalk.green('✓ .gitignore added'));
    }

    if (initReadme) {
      s.start('Adding README.md...');
      if (!fs.existsSync('README.md')) {
        fs.writeFileSync('README.md', `# ${name || folderName}\n\n${description || ''}`);
      }
      s.stop(chalk.green('✓ README.md added'));
    }

    if (license !== 'none') {
      s.start('Adding License...');
      // Simple licenses
      let licenseText = '';
      const year = new Date().getFullYear();
      const author = getUsername();
      if (license === 'mit') {
        licenseText = `MIT License\n\nCopyright (c) ${year} ${author}\n\nPermission is hereby granted... (truncated for simplicity, in a real app fetch from API)`;
        // Real app: fetch from Github
        const { data: lic } = await octokit.rest.licenses.get({ license });
        licenseText = lic.body.replace('[year]', year).replace('[fullname]', author);
      } else {
        const { data: lic } = await octokit.rest.licenses.get({ license: license === 'apache' ? 'apache-2.0' : 'gpl-3.0' });
        licenseText = lic.body;
      }
      fs.writeFileSync('LICENSE', licenseText);
      s.stop(chalk.green('✓ License file added'));
    }

    s.start('Making first commit...');
    await git.add('.');
    await git.commit('Initial commit');
    s.stop(chalk.green('✓ First commit made: "Initial commit"'));

    s.start('Setting remote origin...');
    const remotes = await git.getRemotes();
    if (remotes.find(r => r.name === 'origin')) {
      await git.removeRemote('origin');
    }
    await git.addRemote('origin', repo.clone_url);
    s.stop(chalk.green('✓ Remote origin set'));

    s.start('Pushing to GitHub...');
    await git.branch(['-M', 'main']);
    await git.push(['-u', 'origin', 'main']);
    s.stop(chalk.green('✓ Pushed to GitHub'));

    note(`Live at: ${repo.html_url}`);
    
    await text({
      message: 'Press Enter to return to menu...'
    });

  } catch (err) {
    s.stop(chalk.red('Failed'));
    console.error(chalk.red(err.message));
    await text({ message: 'Press Enter to return to menu...' });
  }
}
