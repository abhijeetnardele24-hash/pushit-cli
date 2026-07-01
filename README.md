# pushit-cli 🚀

A complete, production-ready CLI tool that lets you manage your entire GitHub workflow interactively from the terminal. Zero browser needed after initial setup!

## Features

- 🆕 **Create new repository**: Interactively create a repo, add README/License/gitignore, and push in one go.
- 📤 **Smart Commit & Push**: Interactive file staging with conventional commits (`feat:`, `fix:`) support built-in.
- 🚀 **Setup CI/CD**: One-click bootstrap of GitHub Actions workflows for Node.js, Python, or Docker.
- 🐛 **Issue Management**: View open issues and create new ones directly from the CLI.
- 📋 **List my repositories**: View a formatted table of your repos and manage them (rename, delete, toggle visibility).
- 🌿 **Manage branches**: Create, switch, and delete branches easily.
- 🔀 **Pull Requests**: Create and view open Pull Requests right from your terminal.
- 📝 **Generate README**: Bootstrap a professional README.md enriched with dynamic badges.
- ⚙️ **Settings**: Manage your GitHub credentials securely.

## Installation

Install globally using npm:

```bash
npm install -g pushit-cli
```

## Usage

Simply run:

```bash
pushit
\`\`\`

On your first run, you'll be asked for your GitHub Personal Access Token (with \`repo\`, \`delete_repo\`, and \`user\` scopes). It will be saved securely in your OS keychain/config store and you won't be prompted again.

## Requirements

- Node.js v18+

## License

MIT
