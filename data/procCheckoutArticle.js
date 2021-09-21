import { ProcedureAPI } from "@olenbetong/data-object/node";

const procCheckoutArticle = new ProcedureAPI({
  procedureId: "sstp_WebSiteCMS_CheckOutArticle",
  fields: [{ name: "HostName" }, { name: "ArticleID" }, { name: "Forced" }],
});

export default procCheckoutArticle;
