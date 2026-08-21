<div align="center">
  <pre>
  ___ _   _ ___ _  _ ___ _____ 
 | _ \ | | / __| || |_ _|_   _|
 |  _/ |_| \__ \ __ || |  | |  
 |_|  \___/|___/_||_|___| |_|  
  </pre>
  <h1>PushIt CLI - The Ultimate AI-Powered Git Workflow Automation Tool</h1>
  <p><b>Next-Gen Interactive GitHub CLI for Terminal Productivity, AI Commit Messages, and Smart File Staging</b></p>

  [![npm version](https://img.shields.io/npm/v/pushit-cli.svg?style=flat-square&color=blue)](https://www.npmjs.com/package/pushit-cli)
  [![Node.js Git CLI](https://img.shields.io/node/v/pushit-cli.svg?style=flat-square&color=green)]()
  [![License](https://img.shields.io/npm/l/pushit-cli.svg?style=flat-square&color=yellow)](#license)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)]()
  [![GitHub Workflow Automation](https://img.shields.io/badge/GitHub-Workflow_Automation-black?style=flat-square&logo=github)]()

  <br />

  **⭐ If you find PushIt CLI helpful, please give it a Star on GitHub! ⭐**
</div>

---

## 🚀 Overview: The Best GitHub CLI for Developer Productivity

**PushIt CLI** is a terminal-native, highly interactive command-line interface designed to supercharge your developer productivity and automate your daily Git workflow. 

Tired of typing endless `git add`, `git commit -m`, and `git push` commands? Struggling to write meaningful commit messages? PushIt CLI solves this by abstracting the raw, complex Git commands and GitHub REST API interactions into a beautiful, centralized dashboard directly in your terminal.

Whether you are looking for an **AI commit generator**, a robust **Git undo manager**, or an **interactive staging environment**, PushIt CLI is the definitive developer tool for you.

## ✨ Core Features

*   🤖 **AI-Powered Commit Messages**: Automatically analyze your `git diff` and generate conventional, context-aware commit subjects (`feat`, `fix`, `chore`, etc.). Never struggle with writing a commit message again!
*   🗂️ **Interactive File Staging**: Say goodbye to blind `git add .` commands. Use our beautiful multi-select buffer interface to precisely choose which modified or untracked files enter your staging area.
*   ⏪ **Git Undo Manager (Time Travel)**: Safely perform soft resets to revert your `HEAD` pointer while preserving your working tree. Isolate uncommitted changes into the stash stack and restore them interactively.
*   🐙 **GitHub API Integration**: Instantly initialize remote repositories, fetch repository metadata, and bootstrap `.gitignore` and `LICENSE` files without ever opening your browser.
*   ⚡ **Terminal Native & Blazing Fast**: Built on modern Node.js ES6 modules, utilizing a highly optimized, lazy-loaded architecture.

## 🛠️ Installation & Setup

PushIt CLI requires **Node.js (v18.0.0+)** and a local **Git** installation.

To install globally via NPM:

```bash
npm install -g pushit-cli
```

### Quick Start

Launch the interactive dashboard anywhere in your terminal by running the `pushit` command, or use the ultra-fast `pi` alias:

```bash
# Launch the interactive GitHub workflow interface
pi
```

*Note: On your first run, PushIt CLI will securely authenticate with GitHub using the OAuth Device Flow. Your token is encrypted and persisted locally for seamless future sessions.*

## 📐 System Architecture

PushIt CLI is engineered for maximum performance, fault tolerance, and extensibility. It utilizes a modular, middleware-driven core architecture.

```mermaid
graph TD
    subgraph Terminal Interface
        CLI[PushIt CLI Entrypoint `pi`]
        Prompts[Clack Interactive Prompts]
        Spinner[Ora Loading State]
    end

    subgraph Core Routing Engine
        Router[Dynamic ES6 Import Router]
        Middleware[Pre-flight Git/Network Validation]
        Error[Global Exception Handler]
    end

    subgraph Operations & Automation
        GitOps[Simple-Git Core Operations]
        GitHubAPI[Octokit REST API Client]
        AIEngine[Diff Parser & Commit Generator]
    end

    CLI --> Router
    Router --> Middleware
    Middleware --> Prompts
    
    Prompts --> GitOps
    Prompts --> GitHubAPI
    Prompts --> AIEngine
    
    GitOps --> Error
    GitHubAPI --> Error
    AIEngine --> Error

    style Terminal Interface fill:#e3f2fd,stroke:#90caf9
    style Core Routing Engine fill:#f1f8e9,stroke:#aed581
    style Operations & Automation fill:#fff3e0,stroke:#ffb74d
```

### Architectural Highlights:
1.  **Dynamic Command Registry**: Commands are not bundled into a monolithic block. Instead, `src/commands/*.js` modules are lazy-loaded at runtime, ensuring split-second startup times regardless of how many features are added.
2.  **Pre-Flight Validation Middleware**: Before executing a git command, the router intercepts execution to validate your directory state (e.g., verifying you are actually inside a `.git` repository).
3.  **Global Exception Handling**: All synchronous and asynchronous errors are caught centrally, ensuring your terminal never crashes leaving orphaned background processes.

## 🆚 Why PushIt CLI vs Raw Git?

| Feature | Raw Git Commands | PushIt CLI |
| :--- | :--- | :--- |
| **Staging Files** | Manual `git add <file>` | Visual multi-select checkboxes |
| **Commit Messages** | Manual typing, prone to bad formatting | Automated AI-generated conventional commits |
| **Creating Repos** | Requires opening GitHub in a browser | 1-click remote init via GitHub API |
| **Undoing Mistakes** | Complex `git reset --soft HEAD~1` | Interactive menu-driven Undo Manager |

## 🤝 Development & Contributing

Want to contribute to the best Node.js Git CLI? We'd love your help! 

```bash
# 1. Clone the repository
git clone https://github.com/abhijeetnardele24-hash/pushit-cli.git
cd pushit-cli

# 2. Install dependencies
npm install

# 3. Link the package globally for local testing
npm link

# 4. Run the local build
pi
```

Don't forget to **Star** the repository if you found it useful!

## 📄 License

This software is distributed under the [MIT License](LICENSE). 

---
*Keywords: GitHub CLI, Git workflow automation, AI commit messages, Terminal productivity, Git undo manager, Interactive staging, Developer tools, Node.js Git CLI, Automated GitHub workflow, Pushit CLI.*
