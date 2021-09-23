import { readFile } from "node:fs/promises";

export async function importJson(url, useCwd = false) {
  let completeUrl = new URL(
    url,
    useCwd ? `file://${process.cwd()}/` : import.meta.url
  );
  return JSON.parse(await readFile(completeUrl));
}
