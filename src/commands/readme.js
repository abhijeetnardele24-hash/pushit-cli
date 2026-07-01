import { select, text, confirm, isCancel, spinner, note, outro } from '@clack/prompts';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { getGit, isRepo } from '../lib/git.js';

export default async function generateReadme() {
  const folderName = path.basename(process.cwd());

  const projectName = await text({
    message: 'Project name:',
    defaultValue: folderName,
    placeholder: folderName
  });
  if (isCancel(projectName)) return;

  const description = await text({
    message: 'One-line description:'
  });
  if (isCancel(description)) return;

  const install = await text({
    message: 'How to install:',
    placeholder: 'npm install'
  });
  if (isCancel(install)) return;

  const usage = await text({
    message: 'How to use:',
    placeholder: 'npm start'
  });
  if (isCancel(usage)) return;

  const license = await select({
    message: 'License:',
    options: [
      { value: 'MIT', label: 'MIT' },
      { value: 'Apache 2.0', label: 'Apache 2.0' },
      { value: 'GPL 3.0', label: 'GPL 3.0' },
      { value: 'None', label: 'None' }
    ]
  });
  if (isCancel(license)) return;

  const badges = `
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-${encodeURIComponent(license)}-green.svg)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
`;

  const readmeContent = `# ${projectName}
${badges}
> ${description}

## Installation

\`\`\`bash
${install}
\`\`\`

## Usage

\`\`\`bash
${usage}
\`\`\`
${license !== 'None' ? `\n## License\n\nThis project is licensed under the ${license} License.\n` : ''}`;

  console.log(chalk.cyan('\n--- README.md Preview ---'));
  console.log(readmeContent);
  console.log(chalk.cyan('-------------------------\n'));

  fs.writeFileSync('README.md', readmeContent);
  console.log(chalk.green('✓ README.md created locally.'));

  const pushNow = await confirm({
    message: 'Push this README to GitHub now?',
    initialValue: true
  });
  if (isCancel(pushNow)) return;

  if (pushNow) {
    const repoExists = await isRepo();
    if (!repoExists) {
      console.log(chalk.red('Not a git repository. Cannot push.'));
      await text({ message: 'Press Enter to return...' });
      return;
    }

    const s = spinner();
    const git = getGit();
    s.start('Committing and pushing README...');
    try {
      await git.add('README.md');
      await git.commit('docs: add README');
      
      const branchInfo = await git.branchLocal();
      await git.push(['-u', 'origin', branchInfo.current]);
      s.stop(chalk.green('✓ Pushed to GitHub'));
    } catch (err) {
      s.stop(chalk.red('Failed to push'));
      console.error(chalk.red(err.message));
    }
    await text({ message: 'Press Enter to return...' });
  }
}
