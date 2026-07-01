<div align="center">
  <pre>
  ___ _   _ ___ _  _ ___ _____ 
 | _ \ | | / __| || |_ _|_   _|
 |  _/ |_| \__ \ __ || |  | |  
 |_|  \___/|___/_||_|___| |_|  
  </pre>
  <p><b>Interactive CLI for GitHub Workflow Automation</b></p>

  [![npm version](https://img.shields.io/npm/v/pushit-cli.svg?style=flat-square)](https://www.npmjs.com/package/pushit-cli)
  [![License](https://img.shields.io/npm/l/pushit-cli.svg?style=flat-square)](#license)

  <br />
</div>

## Overview

`pushit-cli` is a terminal-native, interactive interface for executing complex GitHub operations. It abstracts conventional git commands and GitHub REST API interactions into a centralized dashboard, allowing developers to manage repository state, orchestrate pull requests, and automate commit generation without leaving the terminal environment.

## Installation

The package requires Node.js (v18.0.0 or higher) and a local Git installation.

```bash
npm install -g pushit-cli
```

### Execution

The CLI exports two bin aliases: `pushit` and the shorthand `pi`. 

```bash
# Launch the interactive interface
pi
```

On initial execution, the CLI will prompt for OAuth Device Flow authentication. The resulting token is encrypted and persisted locally for subsequent sessions.

## Core Capabilities

### Algorithmic Commit Generation
Integrates diff parsing to automatically infer conventional commit scopes and subjects (`feat`, `fix`, `chore`, etc.). This eliminates the manual overhead of writing commit messages while maintaining a pristine Git history.

### Granular File Staging
Overrides the default `git add .` behavior by exposing a multiselect buffer interface. This enables precise selection of modified or untracked files for the staging area prior to commit execution.

### State & History Management
Provides a wrapper around core Git reset and stash functionality:
- **Soft Resets:** Revert the `HEAD` pointer while preserving the working tree and index.
- **Stash Orchestration:** Isolate uncommitted changes into the stash stack and conditionally pop them via interactive selection.

### Repository Administration
Direct integration with the GitHub API allows for bulk fetching of repository metadata, instant remote repository initialization, and automated `.gitignore`/License bootstrapping.

## Architecture

The CLI is built on a modular, middleware-driven architecture to ensure scalability and fault tolerance:

- **Dynamic Command Registry:** Discards monolithic routing in favor of ES6 dynamic imports. Command modules (`src/commands/*.js`) are lazy-loaded at runtime based on the selection vector.
- **Pre-flight Middleware:** Commands export configuration objects (e.g., `export const config = { requireGit: true };`). The router intercepts execution, validating the current directory state against the configuration schema before yielding control.
- **Global Exception Handling:** A centralized runtime wrapper catches synchronous and asynchronous exceptions, preventing orphaned background processes and gracefully restoring the primary event loop.

## Development Setup

To run the CLI locally for development or contributions:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/pushit-cli.git
cd pushit-cli

# 2. Install dependencies
npm install

# 3. Link the package globally
npm link

# 4. Run the CLI
pi
```

## License

Distributed under the MIT License. See `LICENSE` for more information.
