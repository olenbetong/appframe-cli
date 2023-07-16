import chalk from "chalk";

function objHasKey(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
}
const funcRegex =
	/^function(?:\s+([a-zA-Z$_][a-zA-Z0-9$_]*))?\s*\(((?:(?:\s*[a-zA-Z$_][a-zA-Z0-9$_]*)(?:\s*,\s*[a-zA-Z$_][a-zA-Z0-9$_]*)*)?)\s*\)\s*\{((?:.|\n|\r)*)\}$/;
function parseFunc(func) {
	var match = func.toString().match(funcRegex);

	if (match === null) {
		throw new TypeError("Unable to parse function!");
	}

	return {
		name: match[1],
		args: match[2].split(","),
		body: match[3],
	};
}
function Namespace() {}

Namespace.prototype = Object.create(null);

function requireNamespace(root, namespace) {
	if (typeof root === "object") {
		if (typeof namespace === "string") {
			let path = namespace.split(".");
			return requireNamespace(root, path);
		} else if (Array.isArray(namespace)) {
			let current = root;

			for (let i = 0; i < namespace.length; i++) {
				current = current[namespace[i]] =
					current[namespace[i]] || new Namespace();
			}

			return current;
		} else {
			throw new TypeError("Invalid type of parameter 'namespace'");
		}
	} else {
		throw new TypeError("Invalid type of parameter 'root'");
	}
}

export function expose(name, value) {
	if (arguments.length !== 2) {
		throw new Error(
			"Incorrect number of arguments passed to the expose function!",
		);
	}

	if (Array.isArray(value)) {
		for (let func of value) {
			const { name: funcName } = parseFunc(func);

			if (funcName) {
				expose(name, func); // Expose func on namespace found in pName
			} else {
				throw new Error(
					"Unable to detect name of function! Name it, or only supply one function and include name in first parameter.",
				);
			}
		}
	} else {
		let keyName;
		let namespace;

		if (typeof value === "function") {
			keyName = parseFunc(value).name;
		}

		if (typeof name === "string") {
			let pathParts = name.split(".");

			if (keyName) {
				namespace = requireNamespace(globalThis, pathParts);
			} else {
				keyName = pathParts[pathParts.length - 1];
				namespace = requireNamespace(
					globalThis,
					pathParts.slice(0, pathParts.length - 1),
				);
			}
		} else if (
			keyName &&
			(typeof name === "object" || typeof name === "function")
		) {
			namespace = name;
		} else {
			throw new TypeError(
				"Invalid typeof parameter 'name', or unable to parse pValue!",
			);
		}

		if (objHasKey(namespace, keyName)) {
			// If class is already defined, warn or show an alert
			console.log(
				chalk.yellow(
					[name, keyName].join(".") + " is already defined!",
				),
			);
		} else {
			namespace[keyName] = value;
		}
	}
}
