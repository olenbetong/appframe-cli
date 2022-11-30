import prompts from "prompts";

import { FieldDefinition } from "@olenbetong/appframe-data";

import { Command } from "./lib/Command.js";
import { Server } from "./lib/Server.js";
import { importJson } from "./lib/importJson.js";

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
    output += `import { generateApiDataObject${
      options.sortOrder ? ", SortOrder" : ""
    } } from "@olenbetong/appframe-data";`;

    if (options.expose) {
      output += `\nimport { expose } from "@olenbetong/appframe-core";`;
    }
    output += "\n\n";
  }

  if (options.master && options.master.indexOf(":") > 0) {
    let [name, path] = options.master.split(":");
    output += `import { ${name} } from "${path}";\n\n`;
  }

  if (options.types) {
    output += types + "\n\n";
  }

  if (options.sortOrder) {
    let sorts = options.sortOrder.split(",");
    let sortPrefix = options.global ? "af.data.SortOrder." : "SortOrder.";

    if (sorts.length) {
      sortOrder = `
    sortOrder: [${sorts
      .map((sort) => {
        let [field, order = "asc"] = sort.split(":");
        switch (order.toLocaleLowerCase()) {
          case "asc":
            order = "Asc";
            break;
          case "desc":
            order = "Desc";
            break;
          case "ascnullslast":
            order = "AscNullsLast";
            break;
          case "descnullsfirst":
            order = "DescNullsFirst";
            break;
        }
        return `{ ${field}: ${sortPrefix}${order} }`;
      })
      .join(", ")}],`;
    }
  }

  let masterObject = "";
  let linkFields = "";
  if (options.master && options.linkFields) {
    masterObject = `\n  masterDataObject: ${options.master.split(":")[0]},`;

    let fields = options.linkFields.split(",");

    linkFields = `\n  linkFields: {\n    ${fields
      .map((field) => {
        let [thisField, masterField] = field.split(":");
        return `${thisField}: "${masterField ?? thisField}",`;
      })
      .join("\n    ")}\n  },`;
  }

  let uniqueName = options.unique ? `\n  uniqueName: "${options.unique}",` : "";

  output += `export const ${options.id} = ${api}({
  resource: "${name}",${uniqueName}
  id: "${options.id}",${masterObject}${linkFields}
  allowUpdate: ${options.permissions?.includes("U") ?? false},
  allowInsert: ${options.permissions?.includes("I") ?? false},
  allowDelete: ${options.permissions?.includes("D") ?? false},
  dynamicLoading: ${options.dynamic || false},
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

  if (options.expose) {
    let id = typeof options.expose === "string" ? options.expose : options.id;
    if (options.global) {
      output += `\naf.common.expose("af.article.dataObjects.${id}", ${options.id});\n`;
    } else {
      output += `\nexpose("af.article.dataObjects.${id}", ${options.id});\n`;
    }
  }

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
  if (flags) command += ` -${flags}`;
  if (options.fields) command += ` --fields ${options.fields}`;
  if (options.maxRecords) command += ` --max-records ${options.maxRecords}`;
  if (options.sortOrder) command += ` --sort-order ${options.sortOrder}`;
  if (options.permissions) command += ` --permissions ${options.permissions}`;
  if (options.master) command += ` --master ${options.master}`;
  if (options.linkFields) command += ` --link-fields ${options.linkFields}`;
  if (options.expose)
    command += ` --expose${
      typeof options.expose === "string" ? ` ${options.expose}` : ""
    }`;
  if (options.dynamic) command += ` --dynamic`;

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
  master?: string;
  linkFields?: string;
  expose?: string | boolean;
  dynamic: boolean;
  unique?: string;
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
    "-b, --master <masterDataObject>",
    "Name of data object to set as master data object"
  )
  .option(
    "-l, --link-fields <linkFields>",
    "Comma separated list of fields to bind to master data object. Either name of field that is in both data objects, or <field>:<field in master data object> (e.g. MainGroup_ID:ID)"
  )
  .option(
    "-s, --sort-order <sortOrder>",
    "Comma separated list of sort orders with format <field>:<sort order>, e.g. Created:Desc, or just field name for ascending sort"
  )
  .option("-d, --dynamic", "Flag to make the data object dynamic loading")
  .option(
    "-e, --expose [id]",
    "Expose the data object on global af.article.dataObjects. If id is not given, the data object ID is used"
  )
  .option(
    "-u, --unique <id>",
    "Unique table name to use when performing updates/delete"
  )
  .action(getResourceDefinition);
await program.parseAsync(process.argv);
