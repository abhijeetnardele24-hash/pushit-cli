<div align="center">
  <h1>🚀 PushIt CLI (v2.0)</h1>
  <p><b>The Easiest, Fastest, and Smartest Way to Manage Git and GitHub from your Terminal.</b></p>

  [![npm version](https://img.shields.io/npm/v/pushit-cli.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/pushit-cli)
  [![License](https://img.shields.io/npm/l/pushit-cli.svg?style=flat-square&color=yellow)](#license)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)]()
  
  <br />

  **If you find PushIt CLI helpful, please give it a Star on GitHub! ⭐**
</div>

---

## ⚡ What is PushIt CLI?

PushIt CLI (`pi`) is a completely interactive, terminal-native application designed to completely eliminate the friction of Git and GitHub workflows. 

Instead of typing out long, complex Git commands or struggling to write good commit messages, `pi` gives you a beautiful, keyboard-driven dashboard right in your terminal. **Just type `pi` and press Enter.**

---

## 🔥 New in v2.0

We completely rebuilt PushIt CLI from the ground up in **TypeScript** to be faster, more secure, and wildly more powerful.

- 🧠 **Bring-Your-Own-Key AI Commits:** Integrated directly with **Google Gemini 1.5 Flash**. The CLI instantly analyzes your `git diff` and intelligently writes 3 conventional commit message options for you.
- 🔌 **Zero-Config Local Mode:** GitHub authentication is now completely optional! Use `pi` for local Git branching, history, and pushing without ever needing a GitHub API token.
- 🪄 **Auto-Connect Empty Folders:** Ran `pi` in a folder that isn't a Git repo? No problem. The CLI automatically initializes the folder, asks for a GitHub URL, and securely connects them in seconds.
- 🎨 **Premium UI Polish:** Redesigned interface using modern cyan terminal aesthetics and Clack prompts for a buttery-smooth developer experience.

---

## 🛠️ Core Capabilities

- **Algorithmic AI Commit Generation**: Eliminates the mental overhead of writing commit messages by scanning your staged files and suggesting the perfect message.
- **Interactive File Staging**: A beautiful multi-select terminal buffer lets you meticulously choose exactly which files to stage (say goodbye to blindly running `git add .`).
- **History & Undo Manager**: Safely perform soft resets and manipulate your `HEAD` pointer without ever corrupting your working directory.
- **Automated Repository Bootstrapping**: Interfaces directly with the GitHub API to instantly create remote repositories, pull standard `.gitignore` profiles, and apply licensing templates in one click.
- **PRs, Issues, and CI/CD**: Manage your entire GitHub ecosystem without ever opening a web browser.

---

## 🚀 Installation & Setup

PushIt CLI is distributed as a global Node.js binary.

### 1. Global Installation
Install the package globally via NPM to register the `pi` command:

```bash
npm install -g pushit-cli
```

### 2. Getting Started
Navigate to any project directory (or a completely empty folder) and execute the CLI:

```bash
cd /your/project
pi
```

### 3. Enabling AI Commits (Optional)
1. Get a free API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Open `pi` in your terminal and select **Settings & Config** -> **Configure AI Commit Assistant**
3. Paste the key. The next time you run `pi push`, it will automatically analyze your code and suggest commit messages!

---

## 🏗️ Open Source Contribution

PushIt CLI is built by developers, for developers. We highly encourage you to contribute!

1. **Clone the Repository**
```bash
git clone https://github.com/abhijeetnardele24-hash/pushit-cli.git
cd pushit-cli
```

2. **Install & Build**
```bash
npm install
npm run build
```

3. **Symlink for Local Testing**
```bash
npm link
pi
```

---

## 📜 License

This software is distributed under the [MIT License](LICENSE).
