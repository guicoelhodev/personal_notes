# GNOME Setup

> GNOME 42 configuration on a corporate laptop with an external monitor.
> All changes are per-user (do not affect other system users).

## 1. Keyboard

US International layout (cedilla and accents work):

```bash
gsettings set org.gnome.desktop.input-sources sources "[('xkb', 'us+intl')]"
```

## 2. Extensions

### Install extension manager

```bash
sudo apt install gnome-shell-extension-manager
```

### Install Forge (i3-like tiling manager)

Forge is a GNOME Shell extension that adds window tiling without deep system changes.

Available at: https://github.com/forge-ext/forge (branch `legacy` for GNOME 42)
Requires logout/login after installation to activate.

## 3. Workspaces

### Static workspaces (6) with per-monitor independence

Dynamic workspaces are automatically removed when empty, which breaks
the Win+1..9 shortcuts. Static workspaces fix this.

```bash
gsettings set org.gnome.mutter dynamic-workspaces false
gsettings set org.gnome.desktop.wm.preferences num-workspaces 6
# Each monitor has its own independent workspaces
gsettings set org.gnome.mutter workspaces-only-on-primary false
```

## 4. Shortcuts

All shortcuts use the `Super` key (Windows key).

### Workspace navigation

| Shortcut | Action |
|----------|--------|
| `Win+1..6` | Go to workspace 1..6 |
| `Win+Shift+1..6` | Move window to workspace 1..6 |

```bash
# Clear conflicts with dash-to-dock and switch-to-application
for i in $(seq 1 9); do
  gsettings set org.gnome.shell.keybindings switch-to-application-$i "[]"
  gsettings set org.gnome.shell.extensions.dash-to-dock app-hotkey-$i "[]"
done

# Configure workspace shortcuts
for i in $(seq 1 6); do
  gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-$i "['<Super>$i']"
  gsettings set org.gnome.desktop.wm.keybindings move-to-workspace-$i "['<Super><Shift>$i']"
done
```

### Window focus (Forge, vim-style)

| Shortcut | Action |
|----------|--------|
| `Win+H` | Focus window to the left |
| `Win+L` | Focus window to the right |
| `Win+K` | Focus window above |
| `Win+J` | Focus window below |

These shortcuts come pre-configured in Forge, but conflict with GNOME
shortcuts that need to be cleared:

```bash
# Clear conflict: Super+H = minimize (GNOME)
gsettings set org.gnome.desktop.wm.keybindings minimize "[]"
# Clear conflict: Super+L = lock screen (GNOME)
gsettings set org.gnome.settings-daemon.plugins.media-keys screensaver "[]"
```

### Toggle maximize

| Shortcut | Action |
|----------|--------|
| `Win+F` | Toggle maximize/restore window |

```bash
gsettings set org.gnome.desktop.wm.keybindings toggle-maximized "['<Super>f']"
```

### Close window

| Shortcut | Action |
|----------|--------|
| `Win+Q` | Close focused window |

```bash
# Clear conflict: Super+Q = dash-to-dock shortcut
gsettings set org.gnome.shell.extensions.dash-to-dock shortcut "[]"
gsettings set org.gnome.shell.extensions.dash-to-dock shortcut-text ''
# Configure Win+Q to close
gsettings set org.gnome.desktop.wm.keybindings close "['<Super>q']"
```

### Apply shortcut changes

After configuring Forge shortcuts, reload the extension:

```bash
gnome-extensions disable forge@jmmaranan.com && gnome-extensions enable forge@jmmaranan.com
```

## 5. Animations

Disables all GNOME animations (workspace transitions, app open, etc.).
No performance impact — workspaces are just logical organizers.

```bash
gsettings set org.gnome.desktop.interface enable-animations false
```
