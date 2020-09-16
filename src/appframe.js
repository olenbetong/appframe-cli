const AppframeClient = require("@olenbetong/appframe-client");

class AppframeApiClient extends AppframeClient {
  async __apiRequest(options) {
    let requestOptions = {
      ...options,
      fields: options.fields?.map((field) => (typeof field === "string" ? { name: field } : field)),
    };

    let body = JSON.stringify(requestOptions);
    let reqOptions = {
      body,
      headers: {
        // 'Content-Length': body.length,
        "Content-Type": "application/json; charset=utf-8",
      },
    };

    let response = await this.post("api/data", reqOptions);

    if (response.success) {
      return response.success;
    }

    return response;
  }

  async retrieve(resourceName, parameters) {
    return this.__apiRequest({
      operation: "retrieve",
      resourceName,
      ...parameters,
    });
  }

  async create(resourceName, parameters) {
    return this.__apiRequest({
      operation: "create",
      resourceName,
      uniqueName: parameters?.uniqueName ?? resourceName,
      excludeFieldNames: false,
      ...parameters,
    });
  }

  async update(resourceName, PrimKey, parameters) {
    return this.__apiRequest({
      operation: "update",
      resourceName,
      uniqueName: parameters?.uniqueName ?? resourceName,
      excludeFieldNames: false,
      PrimKey,
      ...parameters,
    });
  }

  async destroy(resourceName, PrimKey, parameters = {}) {
    return this.__apiRequest({
      operation: "destroy",
      resourceName,
      uniqueName: parameters.uniqueName ?? resourceName,
      excludeFieldNames: false,
      PrimKey,
      ...parameters,
    });
  }

  async execute(resourceName, PrimKey, parameters) {
    return this.__apiRequest({
      operation: "execute",
      resourceName,
      excludeFieldNames: true,
      ...parameters,
    });
  }

  async getItemIfExists(resourceName, options) {
    try {
      let record = await this.retrieve(resourceName, options);

      if (record.length === 0) {
        return false;
      }

      return record[0];
    } catch (ex) {
      console.error(ex);
      return false;
    }
  }

  async getSiteComponent(hostName, path) {
    return await this.getItemIfExists("stbv_WebSiteCMS_Components", {
      fields: ["HostName", "Path", "Content", "ContentTest"],
      filterString: `[HostName] = '${hostName}' AND [Path] = '${path}'`,
    });
  }

  async getSiteStyle(hostName, name) {
    return await this.getItemIfExists("stbv_WebSiteCMS_Styles", {
      fields: ["HostName", "Name", "StyleContent", "StyleContentTest"],
      filterString: `[HostName] = '${hostName}' AND [Name] = '${name}'`,
    });
  }

  async getSiteScript(hostName, name) {
    return await this.getItemIfExists("stbv_WebSiteCMS_Scripts", {
      fields: ["HostName", "Name", "ScriptContent", "ScriptContentTest"],
      filterString: `[HostName] = '${hostName}' AND [Name] = '${name}'`,
    });
  }

  async getArticleScript(hostName, name) {
    return await this.getItemIfExists("stbv_WebSiteCMS_Scripts", {
      fields: ["HostName", "Name", "ScriptContent", "ScriptContentTest"],
      filterString: `[HostName] = '${hostName}' AND [Name] = '${name}'`,
    });
  }
}

module.exports = {
  AppframeApiClient,
};
