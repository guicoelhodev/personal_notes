import { readFile, readdir } from "fs/promises";
import { join } from "path";

const DOCS_PATH = join(process.cwd(), 'src/docs/');

async function walkDir(
  dir: string,
  basePath = "",
): Promise<{ path: string; type: string; sha: string }[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const result: { path: string; type: string; sha: string }[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      result.push({ path: relativePath + "/", type: "tree", sha: "local" });
      result.push(...(await walkDir(fullPath, relativePath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      result.push({ path: relativePath, type: "blob", sha: "local" });
    }
  }

  return result;
}

export async function GET({ params }) {
  const { path } = params;

  try {
    if (!path) {
      const entries = await walkDir(DOCS_PATH);
      return new Response(JSON.stringify(entries), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const decodedPath = decodeURIComponent(path);
    const filePath = join(DOCS_PATH, decodedPath);

    if (!filePath.startsWith(DOCS_PATH)) {
      return new Response(JSON.stringify({ error: "Invalid path" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const content = await readFile(filePath, "utf-8");
    return new Response(content, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: any) {
    const status = error?.code === "ENOENT" ? 404 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
