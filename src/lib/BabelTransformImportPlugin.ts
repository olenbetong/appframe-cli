import babel from "@babel/core";
import * as t from "@babel/types";

const AF_REACT_SPECIFIERS = [
	"useDebounce",
	"userSearchParamState",
	"usePersistedState",
];

function addSpecifiersOrCreateImportDeclaration(
	path: babel.NodePath<babel.types.ImportDeclaration>,
	moduleName: string,
	specifiers: (
		| babel.types.ImportSpecifier
		| babel.types.ImportDefaultSpecifier
		| babel.types.ImportNamespaceSpecifier
	)[],
) {
	if (specifiers.length > 0) {
		let parent = path.parent as babel.types.Program;
		let importDeclaration: babel.types.ImportDeclaration | undefined =
			parent.body.find(
				(n) =>
					n.type === "ImportDeclaration" &&
					n.source.value === moduleName,
			) as babel.types.ImportDeclaration | undefined;

		if (!importDeclaration) {
			importDeclaration = t.importDeclaration(
				specifiers,
				t.stringLiteral(moduleName),
			);
			path.insertAfter(importDeclaration);
		} else {
			specifiers.forEach((s) => importDeclaration?.specifiers.push(s));
		}
	}
}

export function BabelTransformImportPlugin({
	onChange,
}: {
	onChange: () => void;
}): babel.PluginObj {
	return {
		visitor: {
			ImportDeclaration(path) {
				let replacements: Record<string, string> = {
					"@olenbetong/data-object": "@olenbetong/appframe-data",
					"@olenbetong/react-data-object-connect":
						"@olenbetong/appframe-react",
					"@olenbetong/utils": "@olenbetong/appframe-core",
					"@olenbetong/common": "@olenbetong/appframe-core",
					"@olenbetong/value-toggle": "@olenbetong/synergi-react",
					"@olenbetong/date-navigator": "@olenbetong/synergi-react",
					"@olenbetong/color-card": "@olenbetong/synergi-react",
				};

				let sourceName = path.node.source.value;
				if (sourceName === "@olenbetong/ob-react") {
					let afReactSpecifiers: babel.types.ImportSpecifier[] = [];
					let obReactSpecifiers: babel.types.ImportSpecifier[] = [];

					for (let specifier of path.node.specifiers) {
						if ("imported" in specifier) {
							let { imported } = specifier;
							let name =
								imported.type === "Identifier"
									? imported.name
									: imported.value;
							if (AF_REACT_SPECIFIERS.includes(name)) {
								afReactSpecifiers.push(specifier);
							} else {
								obReactSpecifiers.push(specifier);
							}
						}
					}

					addSpecifiersOrCreateImportDeclaration(
						path,
						"@olenbetong/appframe-react",
						afReactSpecifiers,
					);
					addSpecifiersOrCreateImportDeclaration(
						path,
						"@olenbetong/synergi-react",
						obReactSpecifiers,
					);
					path.remove();
					onChange();
				} else if (Object.keys(replacements).includes(sourceName)) {
					addSpecifiersOrCreateImportDeclaration(
						path,
						replacements[sourceName],
						path.node.specifiers,
					);
					path.remove();
					onChange();
				}
			},
		},
	};
}
