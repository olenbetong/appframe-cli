const { AppframeApiClient } = require("../../appframe");

class PublishClient extends AppframeApiClient {
  async publishItemToResource({ resourceName, fields: fieldsProp, filter, record, target, type }) {
    let fields = fieldsProp.find((f) => f === "PrimKey" || f.name === "PrimKey")
      ? fieldsProp
      : [...fieldsProp, "PrimKey"];
    let existing = await this.getItemIfExists(resourceName, { fields: ["PrimKey"], whereClause: filter });

    if (!existing) {
      console.log(`Creating '${target}'...`);
      const response = await this.create(resourceName, { fields, ...record });

      if (response.error) {
        throw new Error("Failed to create new record: " + response.error);
      }

      return true;
    } else {
      console.log(`Updating '${target}'...`);
      const { PrimKey } = existing;
      const status = await this.update(resourceName, PrimKey, {
        fields,
        ...record,
      });

      if (status.error) {
        console.error(`Failed to publish to ${type}: ${status.error}`);
      }

      return status instanceof Array;
    }
  }

  async getGlobalComponent(path) {
    return await this.getItemIfExists("stbv_WebSiteCMS_GlobalComponents", {
      fields: ["Path", "Content", "ContentTest"],
      filterString: `[Path] = '${path}'`,
    });
  }

  async publishToGlobalComponent(config) {
    let { extraFields, mode, target, sourceData, ...rest } = config;
    let fieldName = mode.toLowerCase() === "production" ? "Content" : "ContentTest";

    return await this.publishItemToResource({
      resourceName: "stbv_WebSiteCMS_GlobalComponents",
      target,
      fields: [fieldName, "Path"],
      record: { Path: target, [fieldName]: sourceData, ...extraFields },
      filter: `[Path] = '${target}'`,
      ...rest,
    });
  }

  async publishToSiteComponent(config) {
    let { extraFields, mode, hostname, target, sourceData, ...rest } = config;
    let fieldName = mode.toLowerCase() === "production" ? "Content" : "ContentTest";

    return await this.publishItemToResource({
      resourceName: "stbv_WebSiteCMS_Components",
      target,
      fields: [fieldName, "Path", "HostName"],
      record: { HostName: hostname, Path: target, [fieldName]: sourceData, ...extraFields },
      filter: `[HostName] = '${hostname}' AND [Path] = '${target}'`,
      ...rest,
    });
  }

  async publishToSiteStyle(config) {
    let { extraFields, mode, hostname, target, sourceData, ...rest } = config;
    let fieldName = mode.toLowerCase() === "production" ? "StyleContent" : "StyleContentTest";

    return await this.publishItemToResource({
      resourceName: "stbv_WebSiteCMS_Styles",
      target,
      fields: [fieldName, "Name", "HostName"],
      record: { HostName: hostname, Name: target, [fieldName]: sourceData, ...extraFields },
      filter: `[HostName] = '${hostname}' AND [Name] = '${target}'`,
      ...rest,
    });
  }

  async publishToSiteScript(config) {
    let { extraFields, mode, hostname, target, sourceData, ...rest } = config;
    let fieldName = mode.toLowerCase() === "production" ? "ScriptContent" : "ScriptContentTest";

    return await this.publishItemToResource({
      resourceName: "stbv_WebSiteCMS_Scripts",
      target,
      fields: [fieldName, "Name", "HostName"],
      record: { HostName: hostname, Name: target, [fieldName]: sourceData, ...extraFields },
      filter: `[HostName] = '${hostname}' AND [Name] = '${target}'`,
      ...rest,
    });
  }

  async publishToArticleScript(config) {
    let { exclude, hostname, target, targetArticleId, sourceData, ...rest } = config;
    let fieldName = "Script";
    let record = { ArticleID: targetArticleId, HostName: hostname, ID: target, [fieldName]: sourceData };
    if (exclude !== undefined) {
      record.Exclude = exclude;
    }

    return await this.publishItemToResource({
      resourceName: "stbv_WebSiteCMS_ArticlesScripts",
      target,
      fields: [fieldName, "Exclude", "ID", "HostName", "ArticleID"],
      record,
      filter: `[HostName] = '${hostname}' AND [ArticleID] = '${targetArticleId}' AND [ID] = '${target}'`,
      ...rest,
    });
  }

  async publishToArticleStyle(config) {
    let { exclude, hostname, target, targetArticleId, sourceData, ...rest } = config;
    let fieldName = "Style";
    let record = { ArticleID: targetArticleId, HostName: hostname, ID: target, [fieldName]: sourceData };
    if (exclude !== undefined) {
      record.Exclude = exclude;
    }

    return await this.publishItemToResource({
      resourceName: "stbv_WebSiteCMS_ArticlesStyles",
      target,
      fields: [fieldName, "Exclude", "ID", "HostName", "ArticleID"],
      record,
      filter: `[HostName] = '${hostname}' AND [ArticleID] = '${targetArticleId}' AND [ID] = '${target}'`,
      ...rest,
    });
  }
}

module.exports = {
  PublishClient,
};
