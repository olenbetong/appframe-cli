import { Procedure } from "@olenbetong/data-object/node";

export default (client) =>
  new Procedure({
    client,
    articleId: "af-bundle",
    procedureId: "procBundleToProd",
  });
