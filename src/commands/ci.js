import { select, isCancel, spinner, note, confirm, text } from '@clack/prompts';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { getGit, isRepo } from '../lib/git.js';

export default async function setupCI() {
  const repoExists = await isRepo();
  if (!repoExists) {
    console.log(chalk.red('No git repo found in this folder.'));
    await text({ message: 'Press Enter to return...' });
    return;
  }

  const workflow = await select({
    message: 'Select CI/CD Workflow to bootstrap:',
    options: [
      { value: 'node', label: 'Node.js (Install, Lint, Test)' },
      { value: 'python', label: 'Python (Install, Lint, Test)' },
      { value: 'docker', label: 'Docker (Build & Push)' },
      { value: 'cancel', label: 'Cancel' }
    ]
  });

  if (isCancel(workflow) || workflow === 'cancel') return;

  const workflowsDir = path.join(process.cwd(), '.github', 'workflows');
  if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
  }

  let ymlContent = '';
  let filename = '';

  if (workflow === 'node') {
    filename = 'node.js.yml';
    ymlContent = `name: Node.js CI

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test
`;
  } else if (workflow === 'python') {
    filename = 'python-app.yml';
    ymlContent = `name: Python application

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4
    - name: Set up Python 3.10
      uses: actions/setup-python@v3
      with:
        python-version: "3.10"
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install flake8 pytest
        if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
    - name: Lint with flake8
      run: |
        flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
        flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
    - name: Test with pytest
      run: |
        pytest
`;
  } else if (workflow === 'docker') {
    filename = 'docker-publish.yml';
    ymlContent = `name: Docker

on:
  push:
    branches: [ "main", "master" ]
    tags: [ 'v*.*.*' ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Build the Docker image
        run: docker build . --file Dockerfile --tag my-image-name:$(date +%s)
`;
  }

  const filePath = path.join(workflowsDir, filename);
  fs.writeFileSync(filePath, ymlContent);

  console.log(chalk.green(`✓ Created ${path.join('.github', 'workflows', filename)}`));

  const pushNow = await confirm({
    message: 'Commit and push this workflow to GitHub now?',
    initialValue: true
  });

  if (!isCancel(pushNow) && pushNow) {
    const s = spinner();
    const git = getGit();
    s.start('Committing and pushing workflow...');
    try {
      await git.add(path.join('.github', 'workflows', filename));
      await git.commit('ci: setup github actions workflow');
      
      const branchInfo = await git.branchLocal();
      await git.push(['-u', 'origin', branchInfo.current]);
      s.stop(chalk.green('✓ Pushed to GitHub. CI is now active!'));
    } catch (err) {
      s.stop(chalk.red('Failed to push'));
      console.error(chalk.red(err.message));
    }
  }

  await text({ message: 'Press Enter to return...' });
}
