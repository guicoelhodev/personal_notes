# IA Notes

Base de resumos de referencia rapida das principais ferramentas e frameworks usados para criar projetos.

O objetivo e economizar **tokens de leitura e contexto** ao usar assistentes de IA (como Claude, ChatGPT, GLM, etc.) durante o desenvolvimento. Em vez de pedir ao modelo que leia a documentacao completa toda vez, basta fornecer o resumo relevante.

## Estrutura

```
threlte/
    threlte-core-guide.md   # @threlte/core - framework 3D para Svelte
    rapier-guide.md         # @threlte/rapier - fisica 3D (Rapier + Threlte)
```

Cada pasta representa uma ferramenta/framework, e cada arquivo e um resumo autonomo de um pacote ou modulo.

## Como usar

Ao iniciar uma sessao com um assistente de IA para trabalhar em um projeto, carregue o(s) resumo(s) relevante(s) como contexto. Exemplo:

> "Leia o arquivo `threlte/threlte-core-guide.md` e use-o como referencia para me ajudar a construir uma cena 3D."

Isso substitui a necessidade de o modelo buscar e ler a documentacao completa, economizando tokens e tempo.
