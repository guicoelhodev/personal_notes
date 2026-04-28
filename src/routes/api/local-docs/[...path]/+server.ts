const docs = import.meta.glob("/src/lib/docs/**/*.md", {
  query: '?raw', // Isso é crucial para o Vite não tentar parsear o MD
  import: 'default',
  eager: true,
});

export async function GET({ params }) {
  const { path } = params;

  try {
    // 1. LISTAGEM (Se não houver path)
    if (!path) {
      const result: { path: string; type: string; sha: string }[] = [];
      const directories = new Set<string>();

      for (const fullPath in docs) {
        // Limpa o caminho: "/src/lib/docs/folder/file.md" -> "folder/file.md"
        const relativePath = fullPath.replace("/src/lib/docs/", "");
        result.push({ path: relativePath, type: "blob", sha: "local" });

        // Adiciona pastas à listagem
        const segments = relativePath.split("/");
        if (segments.length > 1) {
          directories.add(segments.slice(0, -1).join("/") + "/");
        }
      }

      // Une pastas e arquivos
      const finalResult = [
        ...Array.from(directories).map((d) => ({
          path: d,
          type: "tree",
          sha: "local",
        })),
        ...result,
      ];

      return new Response(JSON.stringify(finalResult), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. LEITURA DE ARQUIVO ESPECÍFICO
    const decodedPath = decodeURIComponent(path);
    // Reconstrói o caminho interno que o Vite conhece
    const internalPath = `/src/lib/docs/${decodedPath}`;

    const content = docs[internalPath];

    if (!content) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(content, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
