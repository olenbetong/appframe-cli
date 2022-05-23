import { Client, Procedure } from "@olenbetong/data-object";

export default (client: Client) =>
  new Procedure({
    client,
    articleId: "af-updater",
    procedureId: "procDeploy",
  });
