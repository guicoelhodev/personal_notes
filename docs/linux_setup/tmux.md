# Tmux Setup

## Pre requisites

[Tmux Plugin Manager (tpm)](https://github.com/tmux-plugins/tpm) is required to manage the plugins listed in the config. After installing tpm and setting up `~/.tmux.conf`, press `prefix + I` (default `Ctrl+b` then `I`) to install all declared plugins.

## Configuration

- `~/.tmux.conf`
```tmux
set -g mouse on

bind-key v split-window -h
bind-key s split-window -v

bind-key h select-pane -L
bind-key j select-pane -D
bind-key k select-pane -U
bind-key l select-pane -R

set-option -g status-position bottom

# List of plugins
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-sensible'
set -g @plugin 'catppuccin/tmux'
set -g @plugin 'christoomey/vim-tmux-navigator'
set -g @plugin 'tmux-plugins/tmux-sessionist'

# Setup catppuccin 
set -g @catppuccin_flavour 'mocha'
set -g @catppuccin_window_left_separator ""
set -g @catppuccin_window_right_separator " "
set -g @catppuccin_window_middle_separator " █"
set -g @catppuccin_window_number_position "right"

set -g @catppuccin_window_default_fill "number"
set -g @catppuccin_window_default_text "#W"

set -g @catppuccin_window_current_fill "number"
set -g @catppuccin_window_current_text "#W"

set -g @catppuccin_status_modules_right "directory session"
set -g @catppuccin_status_left_separator  " "
set -g @catppuccin_status_right_separator ""
set -g @catppuccin_status_right_separator_inverse "no"
set -g @catppuccin_status_fill "icon"
set -g @catppuccin_status_connect_separator "no"

set -g @catppuccin_directory_text "#{pane_current_path}"

bind-key -r f run-shell "tmux new ~/.local/scripts/tmux-sessionizer"
bind-key o choose-session

# Initialize TMUX plugin manager (keep this line at the very bottom of tmux.conf)
run '~/.tmux/plugins/tpm/tpm'
```

## Sessionizer

Script to quickly create/switch tmux sessions from project directories using `fzf`.

- `~/.local/share/scripts/tmux-sessionizer`

```sh
#!/usr/bin/env bash

if [[ $# -eq 1 ]]; then
    selected=$1
else
    selected=$(find ~/Projects/ ~/Projects/personal -mindepth 1 -maxdepth 1 -type d | fzf) # Here you add your paths
fi

if [[ -z $selected ]]; then
    exit 0
fi

selected_name=$(basename "$selected" | tr . _)
tmux_running=$(pgrep tmux)

if [[ -z $TMUX ]] && [[ -z $tmux_running ]]; then
    tmux new-session -s $selected_name -c $selected
    exit 0
fi

if ! tmux has-session -t=$selected_name 2> /dev/null; then
    tmux new-session -ds $selected_name -c $selected
fi

if [[ -z $TMUX ]]; then
    tmux attach -t $selected_name
else
    tmux switch-client -t $selected_name
fi

```

## Keybinding

Add this to your `.zshrc` to bind `Ctrl+f` to launch the sessionizer:

```sh
bindkey -s ^f "~/.local/share/scripts/tmux-sessionizer\n"
```

## Keybindings Summary

| Key | Action |
|-----|--------|
| `prefix + v` | Split pane horizontally |
| `prefix + s` | Split pane vertically |
| `prefix + h/j/k/l` | Navigate between panes |
| `prefix + f` | Launch sessionizer |
| `prefix + o` | Choose existing session |

