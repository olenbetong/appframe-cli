import { Command } from "../lib/Command.js";
import { importJson } from "../lib/importJson.js";
import { Server } from "../lib/Server.js";

const appPkg = await importJson("../package.json");

function afTypeToTsType(type, isProc = false) {
  switch (type) {
    case "int":
    case "decimal":
      return "number";
    case "bit":
      return "boolean";
    case "datetime2":
    case "datetime":
    case "date":
      return isProc ? "string | Date" : "Date";
    default:
      return "string";
  }
}

function getProcedureDefinition(name, procDefinition, options) {
  let parameters = [];
  for (let parameter of procDefinition.Parameters) {
    parameters.push({
      name: parameter.ParamName,
      type: afTypeToTsType(parameter.DataType, true),
      hasDefault: parameter.has_default_value,
      required: !parameter.has_default_value && !parameter.is_nullable,
    });
  }

  return `
new ProcedureAPI({
  procedureId: "${name}",
  parameters: ${JSON.stringify(parameters, null, 2)},
  timeout: 30
});
  `;
}

function getDataObjectDefinition(name, viewDefinition, options) {
  let fields = [];
  let includeFields = options.fields?.split(",").filter((f) => !!f) ?? [];

  for (let field of viewDefinition.Parameters) {
    if (includeFields.length > 0 && !includeFields.includes(field.Name)) {
      continue;
    }

    let fieldDefinition = {
      name: field.Name,
      type: afTypeToTsType(field.DataType, false),
      nullable: field.Nullable,
      hasDefault: field.HasDefault,
    };
    if (field.Computed) {
      fieldDefinition.computed = true;
    }
    if (field.Identity) {
      fieldDefinition.identity = true;
    }

    fields.push(fieldDefinition);
  }

  let api = "generateApiDataObject";
  let types = "";
  let typeName = `${options.id}Record`;

  // By convention data object name starts with ds, but their type
  // definitions should not.
  if (typeName.startsWith("ds")) {
    typeName = typeName.substr(2);
  }

  if (options.types) {
    api = `generateApiDataObject<${typeName}>`;

    let fieldTypes = "";
    for (let field of fields) {
      fieldTypes += `  ${field.name}: ${field.type}${
        field.nullable ? " | null" : ""
      };\n`;
    }

    types = `export type ${typeName} = {
${fieldTypes}}`;
  }

  if (options.global) {
    api = `af.data.${api}`;
  }

  let output = "";
  if (!options.global) {
    output +=
      'import { generateApiDataObject } from "@olenbetong/data-object";\n\n';
  }

  if (options.types) {
    output += types + "\n\n";
  }

  output += `export const ${options.id} = ${api}({
  resource: "${name}",
  id: "${options.id}",
  allowUpdate: false,
  allowInsert: false,
  allowDelete: false,
  fields: ${JSON.stringify(fields, null, 2).split("\n").join("\n  ")},
  parameters: {
    maxRecords: 50,
  }
});
`;

  return output;
}

async function getResourceDefinition(resourceName, options) {
  let server = new Server("dev.obet.no");
  await server.login();
  let resource = await server.getResourceArgument(resourceName);
  let definition = await server.getResourceDefinition(resource);
  console.log(
    definition.ObjectType === "V"
      ? getDataObjectDefinition(resource, definition, options)
      : getProcedureDefinition(resource, definition, options)
  );
}

const program = new Command();
program
  .version(appPkg.version)
  .addResourceArgument()
  .option(
    "-i, --id <id>",
    "ID to use as name for the data object",
    "dsSomeDataObjectID"
  )
  .option("-g, --global", "Use af.data globals to generate the data object")
  .option("-t, --types", "Include data object types")
  .option("-f, --fields <fields>", "Comma-separated list of fields to include")
  .action(getResourceDefinition);
await program.parseAsync(process.argv);
