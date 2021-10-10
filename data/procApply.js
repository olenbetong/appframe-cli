import { Procedure } from "@olenbetong/data-object";

export default (client) =>
  new Procedure({
    client,
    articleId: "af-updater",
    procedureId: "procApply",
  });
