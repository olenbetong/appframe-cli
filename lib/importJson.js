import { readFile } from "node:fs/promises";

/**
 * Node.js doesn't support JSON imports yet, so this is a simple
 * function that reads a JSON file from disk and returns the parsed
 * content.
 *
 * @param {string} url Path to import json from
 * @param {boolean} useCwd Set to true to import the path relative to the current working directory
 * @returns JSON content
 */
export async function importJson(url, useCwd = false) {
  let completeUrl = new URL(
    url,
    useCwd ? `file://${process.cwd()}/` : import.meta.url
  );
  return JSON.parse(await readFile(completeUrl));
}
