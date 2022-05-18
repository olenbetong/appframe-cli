import { copyFile } from "node:fs/promises";

import { importJson } from "../lib/importJson.js";

import { Command } from "commander";
import prompts from "prompts";
function getProjectFile(file) {
  return new URL(file, `file://${process.cwd()}/`);
}

function getCLIFile(file) {
  return new URL(file, import.meta.url);
}

const { templates } = await importJson("../data/templates.json");

async function updateTemplate(template) {
  let templateList;

  if (!template) {
    let question = {
      type: "multiselect",
      name: "template",
      message: "Which template file would you like to update?",
      choices: Object.keys(templates).map((template) => ({
        title: template.title,
        value: template,
      })),
      onState: (state) => {
        if (state.aborted) {
          process.nextTick(() => {
            process.exit();
          });
        }
      },
    };
    let result = await prompts(question);

    templateList = result.template;
  } else {
    templateList = [template];
  }

  for (let template of templateList) {
    console.log(`Updating file (${template})...`);
    await copyFile(
      getCLIFile(templates[template].source),
      getProjectFile(templates[template].target)
    );
  }
}

const appPkg = await importJson("../package.json");
const program = new Command();
program
  .version(appPkg.version)
  .argument("[template]", "The template file you want to update")
  .action(updateTemplate);

await program.parseAsync(process.argv);
