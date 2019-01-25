const { AppframeDataClient } = require("../../appframe");

class PublishClient extends AppframeDataClient {
  async publishItemToDataObject(config) {
    const {
      createArticleId,
      createDataObjectId,
      domain,
      extraFields,
      fieldName,
      filter,
      item,
      primKeyIndex,
      sourceData,
      target,
      type,
      updateArticleId,
      updateDataObjectId
    } = config;

    const commonOptions = {
      articleId: createArticleId,
      dataObjectId: createDataObjectId,
      domain
    };

    const getItemOptions = {
      ...commonOptions,
      filter
    };

    try {
      let record = await this.getItemIfExists(getItemOptions);

      if (!record) {
        console.log(`Creating '${target}'...`);
        const createOptions = {
          ...commonOptions,
          item
        };

        const response = await this.createItem(createOptions);

        if (response.error || !(response instanceof Array)) {
          throw new Error("Failed to create new record.");
        }

        record = response;
      } else {
        console.log(`Updating '${target}'...`);
      }

      const primKey = record[primKeyIndex];
      const putDataOptions = {
        ...commonOptions,
        articleId: updateArticleId,
        dataObjectId: updateDataObjectId,
        data: typeof extraFields === "object" ? { [fieldName]: sourceData, ...extraFields } : sourceData,
        fieldName,
        primKey
      };

      const status = await this.updateItem(putDataOptions);

      if (status.error) {
        console.error(`Failed to publish to ${type}: ${status.error}`);
      }

      return status instanceof Array;
    } catch (ex) {
      console.error(`Failed to publish to ${type}: ${ex.message}`);

      return false;
    }
  }

  async publishToGlobalComponent(config) {
    const { mode, target } = config;

    return await this.publishItemToDataObject({
      ...config,
      createArticleId: "components",
      createDataObjectId: "dsComponents",
      fieldName: mode.toLowerCase() === "production" ? "Content" : "ContentTest",
      filter: `[Path] = '${target}'`,
      item: {
        Path: target
      },
      primKeyIndex: 3,
      updateArticleId: "components-editor",
      updateDataObjectId: "dsComponent"
    });
  }

  async publishToSiteComponent(config) {
    const { hostname, mode, target } = config;

    return await this.publishItemToDataObject({
      ...config,
      createArticleId: "components",
      createDataObjectId: "dsSiteComponents",
      fieldName: mode.toLowerCase() === "production" ? "Content" : "ContentTest",
      filter: `[HostName] = '${hostname}' AND [Path] = '${target}'`,
      item: {
        HostName: hostname,
        Path: target
      },
      primKeyIndex: 0,
      updateArticleId: "components",
      updateDataObjectId: "dsSiteComponents"
    });
  }

  async publishToSiteStyle(config) {
    const { hostname, mode, target } = config;

    return await this.publishItemToDataObject({
      ...config,
      createArticleId: "sitesetup",
      createDataObjectId: "dsStyles",
      fieldName: mode.toLowerCase() === "production" ? "StyleContent" : "StyleContentTest",
      filter: `[HostName] = '${hostname}' AND [Name] = '${target}'`,
      item: {
        Name: target,
        HostName: hostname
      },
      primKeyIndex: 4,
      updateArticleId: "sitesetup-stylesheet",
      updateDataObjectId: "dsStylesheet"
    });
  }

  async publishToSiteScript(config) {
    const { hostname, mode, target } = config;

    return await this.publishItemToDataObject({
      ...config,
      createArticleId: "sitesetup",
      createDataObjectId: "dsScripts",
      fieldName: mode.toLowerCase() === "production" ? "ScriptContent" : "ScriptContentTest",
      filter: `[HostName] = '${hostname}' AND [Name] = '${target}'`,
      item: {
        Name: target,
        HostName: hostname
      },
      primKeyIndex: 4,
      updateArticleId: "sitesetup-script",
      updateDataObjectId: "dsScript"
    });
  }

  async publishToArticleScript(config) {
    const { exclude = false, hostname, target, targetArticleId } = config;

    return await this.publishItemToDataObject({
      ...config,
      createArticleId: "appdesigner",
      createDataObjectId: "dsScripts",
      extraFields: { Exclude: exclude },
      fieldName: "Script",
      filter: `[HostName] = '${hostname}' AND [ArticleID] = '${targetArticleId}' AND [ID] = '${target}'`,
      item: {
        ArticleID: targetArticleId,
        ID: target,
        HostName: hostname
      },
      primKeyIndex: 4,
      updateArticleId: "appdesigner-script",
      updateDataObjectId: "dsScripts"
    });
  }

  async publishToArticleStyle(config) {
    const { domain, hostname, source, sourceData, target, targetArticleId } = config;

    try {
      const record = await this.getItemIfExists({
        articleId: "appdesigner-css",
        domain,
        dataObjectId: "dsArticle",
        filter: `[HostName] = '${hostname}' AND [ArticleID] = '${targetArticleId}'`,
        hostname
      });

      if (record) {
        const startString = `/***** @appframe-publish-start: ${target} ---- ****/`;
        const endString = `/***** @appframe-publish-end: '${target}' ---- ****/`;
        let [, , , css, primKey] = record;

        const startIdx = css.indexOf(startString);
        const endIdx = css.indexOf(endString) + endString.length;

        if (css.indexOf(startString) < 0) {
          console.log(`Inserting styles from '${source}' in article '${targetArticleId}'...`);
          css += `\n\n${startString}\n${sourceData}\n${endString}\n\n`;
        } else {
          console.log(`Updating styles from '${source}' in article '${targetArticleId}'...`);
          const before = css.substring(0, startIdx);
          const after = css.substring(endIdx);

          css = `${before}${startString}\n${sourceData}\n${endString}${after}`;
        }

        const status = await this.updateItem({
          articleId: "appdesigner-css",
          dataObjectId: "dsArticle",
          data: css,
          domain,
          fieldName: "CSS",
          hostname,
          primKey
        });

        return status instanceof Array ? true : false;
      } else {
        console.error(`Article '${targetArticleId}' not found in host '${hostname}'. Can't publish style.`);

        return false;
      }
    } catch (ex) {
      console.error(ex.message);

      return false;
    }
  }
}

module.exports = {
  PublishClient
};
