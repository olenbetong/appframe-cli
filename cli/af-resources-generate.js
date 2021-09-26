import { Command } from "../lib/Command.js";
import { importJson } from "../lib/importJson.js";
import { Server } from "../lib/Server.js";

const appPkg = await importJson("../package.json");

function afTypeToTsType(type /*isProc = false*/) {
  switch (type) {
    case "int":
    case "decimal":
      return "number";
    case "bit":
      return "boolean";
    case "datetime2":
    case "datetime":
      return "datetime";
    case "date":
      return "date";
    default:
      return "string";
  }
}

function getProcedureDefinition(name, procDefinition) {
  let parameters = [];
  for (let parameter of procDefinition.Parameters) {
    parameters.push({
      name: parameter.ParamName,
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

function getDataObjectDefinition(name, viewDefinition) {
  let fields = [];
  for (let field of viewDefinition.Parameters) {
    fields.push({
      name: field.Name,
      type: afTypeToTsType(field.DataType),
      nullable: field.Nullable,
      computed: field.Computed,
      identity: field.Identity,
      hasDefault: field.HasDefault,
    });
  }

  return `
generateApiDataObject({
  resource: "${name}",
  id: "dsSomeDataObjectID",
  fields: ${JSON.stringify(fields, null, 2)},
  parameters: {
    maxRecords: 50,
  }
})
`;
}

async function getResourceDefinition(resourceName) {
  let server = new Server("dev.obet.no");
  await server.login();
  let resource = await server.getResourceArgument(resourceName);
  let definition = await server.getResourceDefinition(resource);
  console.log(
    definition.ObjectType === "V"
      ? getDataObjectDefinition(resource, definition)
      : getProcedureDefinition(resource, definition)
  );
}

const program = new Command();
program
  .version(appPkg.version)
  .addResourceArgument()
  .action(getResourceDefinition);
await program.parseAsync(process.argv);
