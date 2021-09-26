import { Command } from "commander";
import { config } from "dotenv";

import { afFetch, login, setHostname } from "@olenbetong/data-object/node";
import { importJson } from "../lib/importJson.js";

config({ path: process.cwd() + "/.env" });

const { APPFRAME_LOGIN: username, APPFRAME_PWD: password } = process.env;
const appPkg = await importJson("../package.json");

const program = new Command();
program.version(appPkg.version);
program.option(
  "-r, --resource <resource>",
  "Name of the data API resource to generate a definition for"
);
program.option("-l, --list", "List available resources");
program.parse();

const options = program.opts();

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
  setHostname("dev.obet.no");
  await login(username, password);

  let response = await afFetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      operation: "resource-definition",
      resourceName,
    }),
  });

  let data = await response.json();

  if (data.success) {
    console.log(
      data.success.ObjectType === "V"
        ? getDataObjectDefinition(resourceName, data.success)
        : getProcedureDefinition(resourceName, data.success)
    );
  } else {
    throw Error(data.error);
  }
}

async function listAvailableResources() {
  setHostname("dev.obet.no");
  await login(username, password);

  let response = await afFetch("/api/data", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      operation: "listapi",
    }),
  });

  let data = await response.json();

  if (data.success) {
    data.success.sort((a, z) => {
      if (a.ObjectType === z.ObjectType) {
        return a.Name >= z.Name ? 1 : -1;
      } else if (a.ObjectType === "V") {
        return -1;
      } else {
        return 1;
      }
    });

    for (let resource of data.success) {
      let name = `${resource.ObjectType}: ${resource.Name}`;
      if (resource.Name !== resource.DBObjectID) {
        name += ` (${resource.DBObjectID})`;
      }

      console.log(name);
    }
  } else {
    throw Error(data.error);
  }
}

async function runProgram() {
  if (options.list) {
    await listAvailableResources();
  } else if (options.resource) {
    await getResourceDefinition(options.resource);
  }
}

runProgram().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
