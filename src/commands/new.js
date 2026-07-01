import { text, select, spinner, note, isCancel, outro } from '@clack/prompts';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { getOctokit } from '../lib/github.js';
import { getGit, isRepo } from '../lib/git.js';
import { getUsername } from '../lib/config.js';
import Table from 'cli-table3';

export default async function() {
  const folderName = path.basename(process.cwd());

  let state = {
    name: folderName,
    description: '',
    visibility: 'public',
    initReadme: true,
    gitignore: 'Node',
    license: 'mit'
  };

  const askName = async () => {
    const res = await text({ message: 'Repo name:', defaultValue: state.name, placeholder: folderName });
    if (isCancel(res)) return false;
    state.name = res; return true;
  };
  const askDesc = async () => {
    const res = await text({ message: 'Description (optional):', defaultValue: state.description });
    if (isCancel(res)) return false;
    state.description = res; return true;
  };
  const askVis = async () => {
    const res = await select({
      message: 'Visibility:',
      options: [{ value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }],
      initialValue: state.visibility
    });
    if (isCancel(res)) return false;
    state.visibility = res; return true;
  };
  const askReadme = async () => {
    const res = await select({
      message: 'Initialize with README?',
      options: [{ value: true, label: 'Yes' }, { value: false, label: 'No' }],
      initialValue: state.initReadme
    });
    if (isCancel(res)) return false;
    state.initReadme = res; return true;
  };
  const askGitignore = async () => {
    const res = await select({
      message: 'Add .gitignore for:',
      options: [{ value: 'Node', label: 'Node.js' }, { value: 'Python', label: 'Python' }, { value: 'Android', label: 'Android' }, { value: 'Java', label: 'Java' }, { value: 'none', label: 'None' }],
      initialValue: state.gitignore
    });
    if (isCancel(res)) return false;
    state.gitignore = res; return true;
  };
  const askLicense = async () => {
    const res = await select({
      message: 'Add License:',
      options: [{ value: 'mit', label: 'MIT' }, { value: 'apache', label: 'Apache 2.0' }, { value: 'gpl', label: 'GPL 3.0' }, { value: 'none', label: 'None' }],
      initialValue: state.license
    });
    if (isCancel(res)) return false;
    state.license = res; return true;
  };

  // Initial sequential flow
  if (!(await askName())) return;
  if (!(await askDesc())) return;
  if (!(await askVis())) return;
  if (!(await askReadme())) return;
  if (!(await askGitignore())) return;
  if (!(await askLicense())) return;

  // Review & Edit Loop
  while (true) {
    console.log();
    const table = new Table({
      head: [chalk.cyan('Setting'), chalk.cyan('Value')],
      chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': '', 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': '', 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': '', 'right': '' , 'right-mid': '' , 'middle': ' ' },
      style: { 'padding-left': 2, 'padding-right': 2 }
    });
    
    table.push(
      ['Name', chalk.green(state.name)],
      ['Description', chalk.green(state.description || '(none)')],
      ['Visibility', chalk.green(state.visibility)],
      ['README', chalk.green(state.initReadme ? 'Yes' : 'No')],
      ['.gitignore', chalk.green(state.gitignore)],
      ['License', chalk.green(state.license)]
    );
    console.log(chalk.bold.yellow('📝 Review Repository Details:'));
    console.log(table.toString());
    console.log();

    const action = await select({
      message: 'Does everything look correct?',
      options: [
        { value: 'proceed', label: '[ ✓ ] Yes, Create it!' },
        { value: 'edit_name', label: '[ ✎ ] Edit Name' },
        { value: 'edit_desc', label: '[ ✎ ] Edit Description' },
        { value: 'edit_vis', label: '[ ✎ ] Edit Visibility' },
        { value: 'edit_readme', label: '[ ✎ ] Edit README' },
        { value: 'edit_gitignore', label: '[ ✎ ] Edit .gitignore' },
        { value: 'edit_license', label: '[ ✎ ] Edit License' },
        { value: 'cancel', label: '[ ✕ ] Cancel' }
      ]
    });

    if (isCancel(action) || action === 'cancel') return;
    if (action === 'proceed') break;
    
    if (action === 'edit_name') await askName();
    if (action === 'edit_desc') await askDesc();
    if (action === 'edit_vis') await askVis();
    if (action === 'edit_readme') await askReadme();
    if (action === 'edit_gitignore') await askGitignore();
    if (action === 'edit_license') await askLicense();
  }

  console.log(); // empty line

  const s = spinner();
  const octokit = getOctokit();
  const git = getGit();

  try {
    s.start('Creating GitHub repository...');
    
    const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
      name: state.name || folderName,
      description: state.description || '',
      private: state.visibility === 'private'
    });
    s.stop(chalk.green('✓ GitHub repo created'));

    s.start('Initializing local git...');
    const repoExists = await isRepo();
    if (!repoExists) {
      await git.init();
    }
    s.stop(chalk.green('✓ Git initialized locally'));

    if (state.gitignore !== 'none') {
      s.start('Adding .gitignore...');
      const { data: template } = await octokit.rest.gitignore.getTemplate({
        name: state.gitignore
      });
      fs.writeFileSync('.gitignore', template.source);
      s.stop(chalk.green('✓ .gitignore added'));
    }

    if (state.initReadme) {
      s.start('Adding README.md...');
      if (!fs.existsSync('README.md')) {
        fs.writeFileSync('README.md', `# ${state.name || folderName}\n\n${state.description || ''}`);
      }
      s.stop(chalk.green('✓ README.md added'));
    }

    if (state.license !== 'none') {
      s.start('Adding License...');
      let licenseText = '';
      const year = new Date().getFullYear();
      const author = getUsername();
      if (state.license === 'mit') {
        const { data: lic } = await octokit.rest.licenses.get({ license: state.license });
        licenseText = lic.body.replace('[year]', year).replace('[fullname]', author);
      } else {
        const { data: lic } = await octokit.rest.licenses.get({ license: state.license === 'apache' ? 'apache-2.0' : 'gpl-3.0' });
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
    
    await text({ message: 'Press Enter to return to menu...' });

  } catch (err) {
    s.stop(chalk.red('Failed'));
    console.error(chalk.red(err.message));
    await text({ message: 'Press Enter to return to menu...' });
  }
}
