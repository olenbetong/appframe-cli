export function getProjectFile(file: string) {
	return new URL(file, `file://${process.cwd()}/`);
}
