/**
 * compare two semver version strings, returning -1, 0, or 1
 *
 * The return value can be fed straight into [].sort.
 *
 * @param {string} version1 semver version 1
 * @param {string} version2 semver version 2
 * @returns {number} 1 if version 1 is highest, 0 if equal and -1 if version 2 is highest
 */
export function semverCompare(version1: string, version2: string) {
	let pa = version1.split(".");
	let pb = version2.split(".");
	for (let i = 0; i < 3; i++) {
		let na = Number(pa[i]);
		let nb = Number(pb[i]);
		if (na > nb) return 1;
		if (nb > na) return -1;
		if (!Number.isNaN(na) && Number.isNaN(nb)) return 1;
		if (Number.isNaN(na) && !Number.isNaN(nb)) return -1;
	}
	return 0;
}
