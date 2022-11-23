import { FieldDefinition } from "@olenbetong/appframe-data";
import prompts from "prompts";
import { Command } from "./lib/Command.js";
import { importJson } from "./lib/importJson.js";
import { Server } from "./lib/Server.js";

const appPkg = await importJson("../package.json");

/**
 * Convert Appframe (SQL) data types to typescript/field definition types
 * @param {string} type
 * @param {"ts" | "ts-proc" | "field"} dateStyle
 * @returns
 */
function afTypeToTsType(
  type: string | undefined,
  dateStyle: "ts" | "ts-proc" | "field" | boolean = false
) {
  switch (type) {
    case "bigint":
      return "bigint";
    case "int":
    case "decimal":
    case "smallint":
    case "tinyint":
    case "float":
    case "numeric":
      return "number";
    case "bit":
      return "boolean";
    case "datetime2":
    case "datetime":
    case "smalldatetime":
    case "date":
      if (dateStyle === "ts") {
        return "Date";
      } else if (dateStyle === "ts-proc") {
        return "string | Date";
      } else {
        return type === "date" ? "date" : "datetime";
      }
    default:
      return "string";
  }
}

function getProcedureDefinition(
  name: string,
  procDefinition: any,
  options: CLIOptions
) {
  let parameters = [];
  for (let parameter of procDefinition.Parameters) {
    parameters.push({
      name: parameter.ParamName,
      type: afTypeToTsType(parameter.DataType, "field"),
      hasDefault: parameter.has_default_value,
      required: !parameter.has_default_value && !parameter.is_nullable,
    });
  }

  let output = [`import { ProcedureAPI } from "@olenbetong/appframe-data";`];
  let paramTypeName = "ProcParams";

  if (options.types) {
    let typeOutput = [`export type ${paramTypeName} = {`];
    for (let parameter of procDefinition.Parameters) {
      typeOutput.push(
        `\t${parameter.ParamName}${
          parameter.has_default_value || parameter.is_nullable ? "?" : ""
        }: ${afTypeToTsType(parameter.DataType, "ts-proc")}`
      );
    }
    typeOutput.push("};");
    output.push(typeOutput.join("\n"));
  }

  output.push(`new ProcedureAPI${
    options.types ? `<${paramTypeName}, unknown>` : ""
  }({
  procedureId: "${name}",
  parameters: ${JSON.stringify(parameters, null, 2)},
  timeout: 30000
});`);

  return output.join("\n\n");
}

function getDataObjectDefinition(
  name: string,
  viewDefinition: any,
  options: CLIOptions
) {
  let fields = [];
  let includeFields =
    typeof options.fields === "string"
      ? options.fields?.split(",").filter((f) => !!f) ?? []
      : [];

  for (let field of viewDefinition.Parameters) {
    if (includeFields.length > 0 && !includeFields.includes(field.Name)) {
      continue;
    }

    let fieldDefinition: FieldDefinition = {
      name: field.Name,
      type: field.DataType,
      nullable: field.Nullable,
    };

    if (field.HasDefault) {
      fieldDefinition.hasDefault = true;
    }

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
  let sortOrder = "";

  // By convention data object name starts with ds, but their type
  // definitions should not.
  if (typeName.startsWith("ds")) {
    typeName = typeName.substring(2);
  }

  if (options.types) {
    api = `generateApiDataObject<${typeName}>`;

    let fieldTypes = "";
    for (let field of fields) {
      fieldTypes += `  ${field.name}: ${afTypeToTsType(field.type, "ts")}${
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
      'import { generateApiDataObject } from "@olenbetong/appframe-data";\n\n';
  }

  if (options.types) {
    output += types + "\n\n";
  }

  if (options.sortOrder) {
    let sorts = options.sortOrder.split(",");

    if (sorts.length) {
      sortOrder = `
    sortOrder: [${sorts
      .map((sort) => {
        let [field, order = "asc"] = sort.split(":");
        return `{ ${field}: "${order.toLowerCase()}" }`;
      })
      .join(", ")}],`;
    }
  }

  output += `export const ${options.id} = ${api}({
  resource: "${name}",
  id: "${options.id}",
  allowUpdate: ${options.permissions?.includes("U")},
  allowInsert: ${options.permissions?.includes("I")},
  allowDelete: ${options.permissions?.includes("D")},
  fields: ${JSON.stringify(
    fields.map((f) => {
      f.type = afTypeToTsType(f.type, "field");
      return f;
    }),
    null,
    2
  )
    .split("\n")
    .join("\n  ")},
  parameters: {
    maxRecords: ${options.maxRecords},${sortOrder}
  }
});
`;

  return output;
}

async function getResourceDefinition(
  resourceName: string,
  options: CLIOptions
) {
  let server = new Server("dev.obet.no");
  await server.login();
  let resource = await server.getResourceArgument(resourceName);
  let definition = await server.getResourceDefinition(resource);
  definition.Parameters = definition.Parameters.filter(
    (p: any) => !["CUT", "CDL"].includes(p.Name)
  );

  if (options.fields === true) {
    let response = await prompts([
      {
        type: "multiselect",
        name: "fields",
        message: "Select fields",
        choices: definition.Parameters.map((p: any) => ({ value: p.Name })),
      },
    ]);
    options.fields = response.fields.join(",");
  }

  let command = `af resources generate ${resource}`;
  let flags = "";
  if (options.id) command += ` --id ${options.id}`;
  if (options.global) flags += "g";
  if (options.types) flags += "t";
  if (flags) command += ` ${flags}`;
  if (options.fields) command += ` --fields ${options.fields}`;
  if (options.maxRecords) command += ` --max-records ${options.maxRecords}`;
  if (options.sortOrder) command += ` --sort-order ${options.sortOrder}`;
  if (options.permissions) command += ` --permissions ${options.permissions}`;

  console.log("/// auto-generated by CLI: " + command);
  command += console.log(
    definition.ObjectType === "V"
      ? getDataObjectDefinition(resource, definition, options)
      : getProcedureDefinition(resource, definition, options)
  );
}

type CLIOptions = {
  server: string;
  types?: boolean;
  global: boolean;
  id: string;
  fields: string | boolean;
  permissions?: string;
  maxRecords?: string;
  sortOrder?: string;
};

const program = new Command();
program
  .version(appPkg.version)
  .addResourceArgument()
  .option(
    "-i, --id <id>",
    "ID to use as name for the data object",
    "dsDataObject"
  )
  .option("-g, --global", "Use af.data globals to generate the data object")
  .option("-t, --types", "Include data object types")
  .option("-f, --fields [fields]", "Comma-separated list of fields to include")
  .option(
    "-p, --permissions <permissions>",
    "Permission to set on the data object (I = insert, U = update and D = delete; can be combined, for example IUD for all permissions)"
  )
  .option("-m, --max-records <maxRecords>", "Max records to fetch", "50")
  .option(
    "-s, --sort-order <sortOrder>",
    "Comma separated list of sort orders with format <field>:<sort order>, e.g. Created:Desc, or just field name for ascending sort"
  )
  .action(getResourceDefinition);
await program.parseAsync(process.argv);
