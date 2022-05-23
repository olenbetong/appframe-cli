import { Client, ProcedureAPI } from "@olenbetong/data-object";

export default (client: Client) =>
  new ProcedureAPI({
    client,
    procedureId: "sstp_WebSiteCMS_WebEditor_CreateArticle",
    parameters: [
      {
        name: "HostName",
        hasDefault: false,
        required: false,
      },
      {
        name: "ArticleID",
        hasDefault: false,
        required: false,
      },
      {
        name: "Title",
        hasDefault: false,
        required: false,
      },
      {
        name: "ParentArticleID",
        hasDefault: false,
        required: false,
      },
      {
        name: "ListOnFrontPage",
        hasDefault: false,
        required: false,
      },
      {
        name: "TemplateID",
        hasDefault: false,
        required: false,
      },
      {
        name: "HideFromNavigation",
        hasDefault: false,
        required: false,
      },
      {
        name: "HTMLContent",
        hasDefault: false,
        required: false,
      },
      {
        name: "DesignerType",
        hasDefault: false,
        required: false,
      },
      {
        name: "AllowEveryone",
        hasDefault: false,
        required: false,
      },
      {
        name: "AlwaysCopyTemplateID",
        hasDefault: false,
        required: false,
      },
      {
        name: "NamespaceID",
        hasDefault: false,
        required: false,
      },
    ],
  });
