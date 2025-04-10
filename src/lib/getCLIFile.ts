export function getCLIFile(file: string) {
	return new URL(`../..${file}`, import.meta.url);
}
