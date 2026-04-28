# Neovim Setup

Personal Neovim configuration using **lazy.nvim** as plugin manager. Leader key is `<Space>`.

Config repo: [guicoelhodev/nvim-setup](https://github.com/guicoelhodev/nvim-setup)

## Pre requisites

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install git gcc make unzip curl ripgrep fd-find nodejs npm
```

### Arch Linux

```bash
sudo pacman -S git gcc make unzip curl ripgrep fd nodejs npm
```

### Optional

#### Rust Toolchain

Required by **blink.cmp** to use the Rust-based fuzzy matcher for faster completion. Without it, blink.cmp falls back to a Lua implementation which is slower.

Link: https://rustup.rs

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### LazyGit

Is a terminal UI for Git. Used by `lazygit.nvim` — open it from Neovim with `<leader>g` to stage, commit, and manage branches without leaving the editor.

Link: https://github.com/jesseduffield/lazygit

```bash
curl -sLo lazygit.tar.gz "https://github.com/jesseduffield/lazygit/releases/download/v${LAZYGIT_VERSION}/lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz"
tar xf lazygit.tar.gz lazygit && sudo mv lazygit /usr/local/bin/
```

Ubuntu

```bash
sudo pacman -S lazygit
```

Arch

#### Yazi

Is a blazingly fast terminal file manager written in Rust. Used by `yazi.nvim` — open it with `fj` (current file) or `fa` (cwd) to browse and manage files directly from Neovim.

Link: https://github.com/sxyazi/yazi

```bash
cargo install --locked yazi-fm yazi-cli
```

Ubuntu

```bash
sudo pacman -S yazi
```

Arch

## Neovim Installation

### Ubuntu

```bash
sudo add-apt-repository ppa:neovim-ppa/unstable
sudo apt update
sudo apt install neovim
```

Or via AppImage (latest):

```bash
curl -LO https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.appimage
chmod u+x nvim-linux-x86_64.appimage
sudo mv nvim-linux-x86_64.appimage /usr/local/bin/nvim
```

### Arch

```bash
sudo pacman -S neovim
```

## Install Config

```bash
git clone https://github.com/guicoelhodev/nvim-setup ~/.config/nvim
nvim
```

## Features

### File Navigation

| Key | Mode | Description |
|---|---|---|
| `<Space>e` | Normal | Open Netrw file explorer |
| `<leader>ff` | Normal | Find files (Telescope) |
| `fw` | Normal | Live grep (Telescope) |
| `fj` | Normal | Open Yazi at current file |
| `fa` | Normal | Open Yazi in working directory |
| `<leader>g` | Normal | Open LazyGit |

### LSP

| Key | Mode | Description |
|---|---|---|
| `gd` | Normal | Go to definition (Telescope) |
| `K` | Normal | Hover documentation |
| `<C-k>` | Normal | Signature help |
| `gl` | Normal | Show diagnostic float |
| `<C-p>` | Normal | Next diagnostic |
| `<C-n>` | Normal | Previous diagnostic |

LSPs managed by Mason (auto-installed): `lua_ls`, `ts_ls`, `tailwindcss`, `cssls`, `html`, `angularls`, `dockerls`, `docker_compose_language_service`, `dotls`.

### Formatting

| Key | Mode | Description |
|---|---|---|
| `<C-s>` | Normal (no LSP) | Save file |
| `<C-s>` | Normal (LSP attached) | Format and save |
| `S` | Normal | Format (conform + LSP) and save |

Formatters: `prettier` (JS/TS/CSS/HTML/JSON/YAML/MD), `stylua` (Lua).

### Completion (blink.cmp + LuaSnip)

| Key | Mode | Description |
|---|---|---|
| `Tab` | Insert | Accept snippet expansion or select completion |
| `<C-h>` | Insert | Show documentation |

Sources: `lsp`, `path`, `snippets`, `buffer`.

### Editing

| Key | Mode | Description |
|---|---|---|
| `jj` | Insert | Exit insert mode |
| `C` | Normal | Change inner word |
| `T` | Normal | Find and replace (case-sensitive) |
| `ml` | Normal | Search for word under cursor |
| `P` | Visual | Paste without overwriting register |
| `Y` | Visual | Copy file context reference for AI (e.g. `@file.md#L10-20`) |

### Buffer / Window

| Key | Mode | Description |
|---|---|---|
| `<leader>x` | Normal | Close buffer |
| `<Space>x` | Normal | Close buffer |
| `<C-u>` | Normal | Source current file |

### Harpoon (quick file navigation)

| Key | Mode | Description |
|---|---|---|
| `wr` | Normal | Add file to Harpoon list |
| `we` | Normal | Toggle Harpoon menu |
| `wh` | Normal | Jump to file 1 |
| `wj` | Normal | Jump to file 2 |
| `wk` | Normal | Jump to file 3 |
| `wl` | Normal | Jump to file 4 |
| `wp` | Normal | Previous file |
| `wn` | Normal | Next file |

### Git

| Key | Mode | Description |
|---|---|---|
| `gb` | Normal | Toggle git blame |

### Misc

| Key | Mode | Description |
|---|---|---|
| `<F1>` | Normal (Yazi) | Show Yazi help |
| `e` | Normal (lspinfo) | Open diagnostic under cursor and close |

## Options

- Indent: 2 spaces
- Relative line numbers
- System clipboard integration (`unnamedplus`)
- No mode display in cmdline
- Rounded window borders
- Yank highlight on copy
