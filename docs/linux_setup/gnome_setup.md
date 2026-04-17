# GNOME Setup

> Configurações do GNOME 42 em notebook corporativo com monitor externo.
> Todas as mudanças são por usuário (não afetam outros usuários do sistema).

## 1. Teclado

Layout US International (cedilha e acentos funcionam):

```bash
gsettings set org.gnome.desktop.input-sources sources "[('xkb', 'us+intl')]"
```

## 2. Extensões

### Instalar gerenciador de extensões

```bash
sudo apt install gnome-shell-extension-manager
```

### Instalar Forge (tiling manager i3-like)

Forge é uma extensão GNOME Shell que adiciona tiling de janelas sem alterar profundamente o sistema.

Extensão disponível em: https://github.com/forge-ext/forge (branch `legacy` para GNOME 42)
Requer logout/login após instalação para ativar.

## 3. Workspaces

### Workspaces fixos (6) com independência por monitor

Workspaces dinâmicos são removidos automaticamente quando ficam vazios, o que
quebra os atalhos Win+1..9. Workspaces fixos resolvem isso.

```bash
gsettings set org.gnome.mutter dynamic-workspaces false
gsettings set org.gnome.desktop.wm.preferences num-workspaces 6
# Cada monitor tem seus próprios workspaces independentes
gsettings set org.gnome.mutter workspaces-only-on-primary false
```

## 4. Atalhos

Todos os atalhos usam a tecla `Super` (tecla Windows).

### Navegação entre workspaces

| Atalho | Ação |
|--------|------|
| `Win+1..6` | Ir para workspace 1..6 |
| `Win+Shift+1..6` | Mover janela para workspace 1..6 |

```bash
# Limpar conflitos com dash-to-dock e switch-to-application
for i in $(seq 1 9); do
  gsettings set org.gnome.shell.keybindings switch-to-application-$i "[]"
  gsettings set org.gnome.shell.extensions.dash-to-dock app-hotkey-$i "[]"
done

# Configurar atalhos de workspace
for i in $(seq 1 6); do
  gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-$i "['<Super>$i']"
  gsettings set org.gnome.desktop.wm.keybindings move-to-workspace-$i "['<Super><Shift>$i']"
done
```

### Foco entre janelas (Forge, estilo vim)

| Atalho | Ação |
|--------|------|
| `Win+H` | Focar janela à esquerda |
| `Win+L` | Focar janela à direita |
| `Win+K` | Focar janela acima |
| `Win+J` | Focar janela abaixo |

Esses atalhos já vêm configurados no Forge, mas conflitam com atalhos do GNOME
que precisam ser limpos:

```bash
# Limpar conflito: Super+H = minimizar (GNOME)
gsettings set org.gnome.desktop.wm.keybindings minimize "[]"
# Limpar conflito: Super+L = bloquear tela (GNOME)
gsettings set org.gnome.settings-daemon.plugins.media-keys screensaver "[]"
```

### Fechar janela

| Atalho | Ação |
|--------|------|
| `Win+Q` | Fechar janela focada |

```bash
# Limpar conflito: Super+Q = atalho do dash-to-dock
gsettings set org.gnome.shell.extensions.dash-to-dock shortcut "[]"
gsettings set org.gnome.shell.extensions.dash-to-dock shortcut-text ''
# Configurar Win+Q para fechar
gsettings set org.gnome.desktop.wm.keybindings close "['<Super>q']"
```

### Aplicar mudanças de atalhos

Após configurar atalhos do Forge, recarregue a extensão:

```bash
gnome-extensions disable forge@jmmaranan.com && gnome-extensions enable forge@jmmaranan.com
```

## 5. Animações

Desativa todas as animações do GNOME (transições de workspace, abrir apps, etc.).
Sem impacto em performance — workspaces são apenas organizadores lógicos.

```bash
gsettings set org.gnome.desktop.interface enable-animations false
```
