import { Client, Procedure } from "@olenbetong/appframe-data";

export default (client: Client) =>
  new Procedure({
    client,
    articleId: "af-updater",
    procedureId: "procDeploy",
  });
