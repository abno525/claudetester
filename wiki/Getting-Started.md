# Getting Started

This guide walks you through setting up and running Minecraft CAPTCHA locally.

## Prerequisites

- **Node.js** 18+ (recommended) or compatible runtime
- **npm** or **yarn** package manager
- A modern web browser (Chrome, Firefox, Edge, Safari)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/abno525/claudetester.git
cd claudetester
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000` in your browser.

## Project Structure

```
claudetester/
├── wiki/              # This documentation
├── main.md            # Project description
├── todo.md            # Development task list
├── src/               # Source code (to be implemented)
│   ├── client/        # Frontend crafting table UI
│   ├── server/        # Backend verification logic
│   └── shared/        # Shared types and recipes
└── package.json       # Project manifest
```

> **Note**: The `src/` directory and build tooling are not yet created. See [todo.md](../todo.md) for implementation progress.

## Quick Test

Once the project is implemented, you can verify it works by:

1. Loading the CAPTCHA widget in a browser
2. Dragging items into the crafting grid
3. Crafting the requested item
4. Observing the verification cookie being set

## Next Steps

- Read the [Architecture](Architecture.md) overview to understand the system design
- Check the [Crafting System](Crafting-System.md) docs to learn how recipe validation works
- See the [Integration Guide](Integration-Guide.md) to embed the CAPTCHA in your app
