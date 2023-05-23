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
  let typeOverrides: Record<string, string> = {};

  if (options.overrides) {
    options.overrides.split(",").forEach((override) => {
      let [param, type] = override.split(":");
      typeOverrides[param] = type;
    });
  }

  for (let parameter of procDefinition.Parameters) {
    parameters.push({
      name: parameter.ParamName,
      type: afTypeToTsType(parameter.TypeName, "field"),
      hasDefault: parameter.has_default_value,
      required: !parameter.has_default_value && !parameter.is_nullable,
    });
  }

  let output = [];
  if (!options.global) {
    output.push(`import { ProcedureAPI } from "@olenbetong/appframe-data";`);

    if (options.expose) {
      output.push(`import { expose } from "@olenbetong/appframe-core";`);
    }

    output.push("");
  }
  let paramTypeName = "ProcParams";
  let procName = "proc";
  if (options.id) {
    procName = options.id;
    paramTypeName = `${options.id}Params`;
    if (paramTypeName.startsWith("proc")) {
      paramTypeName = paramTypeName.substring(4);
    }
  }

  if (options.types) {
    let typeOutput = [`export type ${paramTypeName} = {`];
    for (let parameter of procDefinition.Parameters) {
      let type = typeOverrides[parameter.ParamName];
      let name = parameter.ParamName;

      if (!type) {
        type = afTypeToTsType(parameter.TypeName, "ts-proc");
      }

      if (parameter.has_default_value || parameter.is_nullable) {
        type += " | null";
        name += "?";
      }

      typeOutput.push(`\t${name}: ${type}`);
    }
    typeOutput.push("};");
    output.push(typeOutput.join("\n"));
    output.push("");
  }

  output.push(`export const ${procName} = new ${
    options.global ? "af." : ""
  }ProcedureAPI${options.types ? `<${paramTypeName}, unknown>` : ""}({
  procedureId: "${name}",
  parameters: ${JSON.stringify(parameters, null, 2)},
  timeout: 30000
});`);

  if (options.expose) {
    output.push("");
    output.push(
      `${
        options.global ? "af.common." : ""
      }expose("af.article.procedures.${procName}", ${procName}, { overwrite: true });`
    );
  }

  return output.join("\n");
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

  let aggregates: Record<string, string> = {};
  if (options.aggregates) {
    for (let aggregateDef of options.aggregates.split(",")) {
      let [field, aggregate] = aggregateDef.split(":");
      aggregates[field] = aggregate;
    }
  }

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

    if (aggregates[field.Name]) {
      fieldDefinition.aggregate = aggregates[field.Name];
    }

    fields.push(fieldDefinition);
  }

  let api = "generateApiDataObject";
  let types = "";
  let typeName = `${options.id}Record`;
  let typeOverrides: Record<string, string> = {};

  if (options.overrides) {
    options.overrides.split(",").forEach((override) => {
      let [param, type] = override.split(":");
      typeOverrides[param] = type;
    });
  }

  // By convention data object name starts with ds, but their type
  // definitions should not.
  if (typeName.startsWith("ds")) {
    typeName = typeName.substring(2);
  }

  if (options.types) {
    api = `generateApiDataObject<${typeName}>`;

    let fieldTypes = "";
    for (let field of fields) {
      let type = typeOverrides[field.name];
      if (!type) {
        type = afTypeToTsType(field.type, "ts");
        if (field.nullable) {
          type += " | null";
        }
      }

      fieldTypes += `  ${field.name}: ${type};\n`;
    }

    types = `export type ${typeName} = Readonly<{
${fieldTypes}}>`;
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

  let linkFields = "";

  let dsOptions: string[] = [];
  dsOptions.push(`resource: "${name}"`);
  if (options.unique) {
    dsOptions.push(`uniqueName: "${options.unique}"`);
  }
  dsOptions.push(`id: "${options.id}"`);
  if (options.master && options.linkFields) {
    dsOptions.push(`masterDataObject: ${options.master.split(":")[0]}`);

    let fields = options.linkFields.split(",");

    linkFields = `linkFields: {\n\t\t${fields
      .map((field) => {
        let [thisField, masterField] = field.split(":");
        return `${thisField}: "${masterField ?? thisField}",`;
      })
      .join("\n\t\t")}\n\t}`;

    dsOptions.push(linkFields);
  }
  dsOptions.push(`allowUpdate: ${options.permissions?.includes("U") ?? false}`);
  dsOptions.push(`allowInsert: ${options.permissions?.includes("I") ?? false}`);
  dsOptions.push(`allowDelete: ${options.permissions?.includes("D") ?? false}`);
  dsOptions.push(`dynamicLoading: ${options.dynamic || false}`);

  let fieldsOption = fields.map((field) => ({
    ...field,
    type: afTypeToTsType(field.type, "field"),
  }));
  dsOptions.push(
    `fields: ${JSON.stringify(fieldsOption, null, 2).split("\n").join("\n\t")}`
  );

  let parametersOption: string[] = [`maxRecords: ${options.maxRecords}`];

  if (options.sortOrder) {
    let sorts = options.sortOrder.split(",");
    let sortPrefix = options.global ? "af.data.SortOrder." : "SortOrder.";

    let sortOrder = sorts
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
      .join(", ");

    parametersOption.push(`sortOrder: [${sortOrder}]`);
  }

  if (options.groupBy) {
    parametersOption.push(
      `groupBy: ${JSON.stringify(options.groupBy.split(","))}`
    );
  }

  if (options.where) {
    parametersOption.push(`whereClause: "${options.where}"`);
  }

  if (options.distinct) {
    parametersOption.push(`distinctRows: true`);
  }

  dsOptions.push(`parameters: {\n\t\t${parametersOption.join(",\n\t\t")}\n\t}`);

  output += `export const ${options.id} = ${api}({
  ${dsOptions.join(",\n\t")}
});
`;

  if (options.expose) {
    let id = typeof options.expose === "string" ? options.expose : options.id;
    if (options.global) {
      output += `\naf.common.expose("af.article.dataObjects.${id}", ${options.id}, { overwrite: true });`;
    } else {
      output += `\nexpose("af.article.dataObjects.${id}", ${options.id}, { overwrite: true });`;
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

  let command: string[] = [`af resources generate ${resource}`];
  if (options.id) command.push(`--id ${options.id}`);
  if (options.unique) command.push(`--unique ${options.unique}`);
  if (options.global) command.push("--global");
  if (options.types) command.push("--types");
  if (options.maxRecords && definition.ObjectType !== "P")
    command.push(`--max-records ${options.maxRecords}`);
  if (options.sortOrder) command.push(`--sort-order ${options.sortOrder}`);
  if (options.permissions) command.push(`--permissions ${options.permissions}`);
  if (options.master) command.push(`--master ${options.master}`);
  if (options.linkFields) command.push(`--link-fields ${options.linkFields}`);
  if (options.expose)
    command.push(
      `--expose${
        typeof options.expose === "string" ? ` ${options.expose}` : ""
      }`
    );
  if (options.dynamic) command.push(`--dynamic`);
  if (options.overrides) command.push(`--overrides "${options.overrides}"`);
  if (options.distinct) command.push("--distinct");
  if (options.aggregates) command.push(`--aggregates ${options.aggregates}`);
  if (options.groupBy) command.push(`--group-by ${options.groupBy}`);
  if (options.where) command.push(`--where "${options.where}"`);
  if (options.fields) command.push(`--fields ${options.fields}`);

  console.log(`/*\nauto-generated by CLI:\n${command.join(" \\\n ")}\n*/`);
  console.log(
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
  overrides?: string;
  distinct?: boolean;
  aggregates?: string;
  groupBy?: string;
  where?: string;
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
  .option(
    "-o, --overrides <typeOverrides>",
    "Comma separated list of field/parameter type overrides with format <field>:<type>. E.g. BuildSites:[string][]"
  )
  .option("--group-by <fields>", "Comma separated list of fields to group by")
  .option(
    "--aggregates <fields>",
    "Comma separated list of aggregate binding for non-grouped fields, e.g. Quantity:SUM,Created:MAX"
  )
  .option("--distinct", "Data object should fetch distinct data")
  .option(
    "--where <whereClause>",
    "Initial where clause to set on the data object"
  )
  .action(getResourceDefinition);
await program.parseAsync(process.argv);
