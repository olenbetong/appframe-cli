import chalk from "chalk";
import { config } from "dotenv";
import { fileFromPath } from "formdata-node/file-from-path";
import prompts from "prompts";

import { FileUploader } from "@olenbetong/data-object/node";
import { Client } from "@olenbetong/data-object/node";

import {
  getArticlesDataObject,
  getArticlesVersionsDataObject,
  getBundlesDataObject,
  getDataResourcesDataObject,
  getNamespacesDataObject,
  getTransactionsDataObject,
  getApplyProcedure,
  getCheckoutArticleProcedure,
  getDeployProcedure,
  getGenerateProcedure,
  getPublishArticleProcedure,
  getPublishBundleProcedure,
} from "../data/index.js";

config({ path: process.cwd() + "/.env" });
let { APPFRAME_LOGIN: envUsername, APPFRAME_PWD: envPassword } = process.env;

const isInteractive = process.stdout.isTTY;

export class Server {
  /**
   * Creates a server instance. If username or password is not provided, will attempt to look for
   * environment variables APPFRAME_LOGIN and APPFRAME_PWD. If username or password is still missing,
   * the login method will prompt the user if running in a TTY environment.
   *
   * @param {string | undefined} hostname Hostname of the server (default: dev.obet.no)
   * @param {string | undefined} username Appframe username
   * @param {string | undefined} password Appframe password
   */
  constructor(hostname, username, password) {
    this.hostname = hostname ?? "dev.obet.no";
    this.username = username ?? envUsername;
    this.password = password ?? envPassword;
    this.client = new Client(this.hostname);
    this.dsArticles = getArticlesDataObject(this.client);
    this.dsArticlesVersion = getArticlesVersionsDataObject(this.client);
    this.dsBundles = getBundlesDataObject(this.client);
    this.dsDataResources = getDataResourcesDataObject(this.client);
    this.dsNamespaces = getNamespacesDataObject(this.client);
    this.dsTransactions = getTransactionsDataObject(this.client);
    this.procApply = getApplyProcedure(this.client);
    this.procCheckoutArticle = getCheckoutArticleProcedure(this.client);
    this.procDeploy = getDeployProcedure(this.client);
    this.procGenerate = getGenerateProcedure(this.client);
    this.procPublishArticle = getPublishArticleProcedure(this.client);
    this.procPublishBundle = getPublishBundleProcedure(this.client);
  }

  logServerMessage(message) {
    if (isInteractive) {
      let colorFn = chalk.bgRed;
      if (this.hostname.startsWith("dev")) {
        colorFn = chalk.bgGreen;
      } else if (this.hostname.startsWith("stage")) {
        colorFn = chalk.bgYellow;
      }

      let hostname = this.hostname.replace(
        /(\.obet\.no|\.olenbetong\.no)/g,
        ""
      );
      console.log(colorFn(`[${hostname}]`) + ` ${message}`);
    }
  }

  async login() {
    if (isInteractive) {
      if (!this.username || !this.password) {
        let questions = [
          {
            type: "text",
            name: "username",
            message: "What is your Appframe username?",
            initial: this.username,
          },
          {
            type: "password",
            name: "password",
            message: "What is you Appframe password?",
          },
        ];
        let { username, password } = await prompts(questions);
        this.username = username;
        this.password = password;
      }
    }

    if (!this.username) {
      throw Error("No username provided.");
    }
    if (!this.password) {
      throw Error("No password provided.");
    }

    this.logServerMessage("Logging in...");
    return await this.client.login(this.username, this.password);
  }

  async addDataResource(id, name) {
    this.logServerMessage(`Adding data resource (${id})...`);
    this.dsDataResources.setCurrentIndex(-1);
    await this.dsDataResources.save({
      DBObjectID: id,
      Name: name,
    });
  }

  /**
   * Applies updates matching the namespace, or all updates if no namespace is given
   *
   * @param {string | number | undefined} namespace limit apply updates to a namespace (ID or name)
   */
  async apply(namespace) {
    let params = {};

    if (namespace) {
      let n = await this.getNamespace(namespace);
      params.Namespaces = String(n.ID);
      this.logServerMessage(`Applying updates (${n.Name})...`);
    } else {
      this.logServerMessage("Applying updates...");
    }

    await this.procApply.execute(params);
  }

  /**
   * Checks that there are no transactions with a different name than `name` that matches `filter`.
   * Log transactions (type = 98) are not counted. If there are other transactions, an error is thrown.
   *
   * @param {string} filter - Filter to use on transactions
   * @param {string} name - Name of the expected transaction.
   */
  async assertOnlyOneTransaction(filter, name) {
    let transactions = await this.getTransactions(filter);

    if (transactions > 1) {
      // Allow multiple transactions if they are all for the current article
      for (let record of this.dsTransactions.getData()) {
        if (record.Name !== name && record.Type !== 98) {
          console.table(
            this.dsTransactions.map((r) => ({
              Namespace: r.Namespace,
              Name: r.Name,
              CreatedBy: r.CreatedBy,
              LocalCreatedBy: r.LocalCreatedBy,
            }))
          );
          throw Error(
            "Found more than 1 transaction. Deploy have to be done manually."
          );
        }
      }
    } else if (transactions === 0) {
      throw Error(
        "No transactions found. Check if there is a versioning problem with the article."
      );
    }
  }

  async checkoutArticle(hostname, article) {
    this.logServerMessage(`Checking out article (${hostname}/${article})...`);
    await this.procCheckoutArticle.executeAsync({
      HostName: hostname,
      ArticleID: article,
      Forced: true,
    });
  }

  async deleteDataResource(id) {
    let { dsDataResources } = this;
    let resource = await this.getResourceDefinition(id);
    dsDataResources.setParameter(
      "whereClause",
      `[DBObjectID] = '${resource.DBObjectID}'`
    );
    await dsDataResources.refreshDataSource();

    if (dsDataResources.getDataLength() === 1) {
      dsDataResources.setCurrentIndex(0);
      this.logServerMessage(
        `Deleting '${dsDataResources.currentRow("DBObjectID")}'...`
      );
      await dsDataResources.deleteCurrentRow();
    } else {
      this.logServerMessage(
        chalk.red(
          `Expected 1 resource to match '${id}'. Found ${dsDataResources.getDataLength()}`
        )
      );
      process.exit(1);
    }
  }

  /**
   * Deploys the selected namespace, or all namespaces if none is
   * provided.
   * @param {number | string | undefined} namespaceId ID of the namespace to deploy
   */
  async deploy(namespace) {
    let params = {};

    if (namespace) {
      let n = await this.getNamespace(namespace);
      params.Namespace_ID = n.ID;
      this.logServerMessage(`Deploying (${n.Name})...`);
    } else {
      this.logServerMessage("Deploying...");
    }

    await this.procDeploy.execute(params);
  }

  /**
   * Check for updates to download
   */
  async checkForUpdates() {
    this.logServerMessage(`Checking for updates...`);
    let url = "/api/ob-deploy/checkForUpdates";

    let result = await this.client.afFetch(url, {
      method: "POST",
    });

    if (!result.ok) {
      throw Error(`${result.status} ${result.statusTest}`);
    }

    let data = await result.json();

    if (data?.error) {
      throw Error(data.error);
    }

    return Object.keys(data)
      .filter((n) => data[n] > 0)
      .map((n) => ({ Namespace: n, Updates: data[n] }));
  }

  /**
   * Download updates for the given namespace
   * @param {string} namespace Name of the namespace to download
   */
  async download(namespace) {
    let url = "/api/ob-deploy/download";
    if (namespace) {
      let n = await this.getNamespace(namespace);
      url += "/1/" + n.Name;
      this.logServerMessage(`Downloading updates (${n.Name})...`);
    } else {
      this.logServerMessage(`Downloading updates...`);
    }

    let result = await this.client.afFetch(url, {
      method: "POST",
    });

    if (result.headers.get("Content-Type")?.includes("json")) {
      let data = await result.json();

      if (data?.error) {
        throw Error(data.error);
      }
    }

    if (!result.ok) {
      throw Error(`${result.status} ${result.statusTest}`);
    }
  }

  /**
   * Generates transactions for the given namespace, or all namespaces if no ID is given.
   *
   * @param {number | string | undefined} namespace ID of the namespace to generate transactions in
   */
  async generate(namespace) {
    let params = {};

    if (namespace) {
      let n = await this.getNamespace(namespace);
      params.Namespace_ID = n.ID;
      this.logServerMessage(`Generating transactions (${n.Name})...`);
    } else {
      this.logServerMessage("Generating transactions...");
    }

    await this.procGenerate.execute(params);
  }

  async getArticle(hostname, article) {
    let { dsArticles } = this;
    this.logServerMessage(
      `Getting article information (${hostname}/${article})...`
    );
    dsArticles.setParameter(
      "whereClause",
      `[HostName] = '${hostname}' AND [ArticleId] = '${article}  '`
    );
    await dsArticles.refreshDataSource();

    return dsArticles.getData(0);
  }

  /**
   * Gets the bundle version for the given bundle with version 0
   *
   * @param {string} bundle Name of the bundle
   */
  async getBundle(bundle) {
    let { dsBundles } = this;
    this.logServerMessage(`Getting bundle (${bundle})...`);
    dsBundles.setParameter(
      "whereClause",
      `[Name] = '${bundle}' AND [Version] = 0`
    );
    await dsBundles.refreshDataSource();

    return dsBundles.getData(0);
  }

  /**
   *
   * @param {string | number} namespace Name or ID of the namespace
   * @returns
   */
  async getNamespace(namespace) {
    let { dsNamespaces } = this;
    if (typeof namespace === "string") {
      dsNamespaces.setParameter("whereClause", `[Name] = '${namespace}'`);
    } else if (typeof namespace === "number") {
      dsNamespaces.setParameter("whereClause", `[ID] = ${namespace}`);
    }
    await dsNamespaces.refreshDataSource();

    return dsNamespaces.getData(0);
  }

  /**
   * Get namespace argument from the command line, or let the user select from a list
   * if they didn't provide one.
   *
   * @param {string | undefined} namespace Namespace argument from the command line
   * @param {any} options Command options, potentially including an `all` property
   * @returns {Promise<string>} Namespace name
   */
  async getNamespaceArgument(namespace, options = {}) {
    let { dsNamespaces } = this;

    if (!namespace && !options.all) {
      if (process.stdout.isTTY) {
        dsNamespaces.setParameter("maxRecords", -1);
        dsNamespaces.setParameter("sortOrder", [
          { GroupTitle: "Asc" },
          { Name: "Asc" },
        ]);
        await dsNamespaces.refreshDataSource();

        let question = {
          type: "autocomplete",
          name: "namespace",
          message: "Select namespace",
          choices: dsNamespaces.getData().map((r) => ({
            title: r.GroupTitle ? `${r.Name} (${r.GroupTitle})` : r.Name,
            value: r.Name,
          })),
          onState: (state) => {
            if (state.aborted) {
              process.nextTick(() => {
                process.exit(0);
              });
            }
          },
        };

        let result = await prompts(question);
        return result.namespace;
      } else {
        console.log(
          chalk.red(
            "Namespace must be provided if --all is not set in a non-interactive environment"
          )
        );
        process.exit(0);
      }
    }

    return namespace;
  }

  /**
   * Get resource name argument for commands. If a name is not provided by
   * the user, create a prompt with autocomplete to let them select it.
   * @param {string | undefined} resourceArg Resource argument from command line
   * @returns {Promise<string>} Resource name
   */
  async getResourceArgument(resourceArg) {
    if (resourceArg) return resourceArg;

    if (isInteractive) {
      let resources = await this.getResources();
      let question = {
        type: "autocomplete",
        name: "resource",
        message: "Select the resource you want to view",
        choices: resources.map((resource) => ({
          title: resource.Name,
          value: resource.DBObjectID,
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
      return result.resource;
    }
  }

  async getResources() {
    let response = await this.client.afFetch("/api/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        operation: "listapi",
      }),
    });

    let data = await response.json();

    if (data.success) {
      data.success.sort((a, z) => {
        if (a.ObjectType === z.ObjectType) {
          return a.Name >= z.Name ? 1 : -1;
        } else if (a.ObjectType === "V") {
          return -1;
        } else {
          return 1;
        }
      });

      return data.success;
    } else {
      throw Error(data.error);
    }
  }

  /**
   * Get the definition of a data resource.
   *
   * @param {string} name Name of the data resource
   */
  async getResourceDefinition(name) {
    this.logServerMessage(`Getting resource definition (${name})...`);
    let response = await this.client.afFetch("/api/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        operation: "resource-definition",
        resourceName: name,
      }),
    });

    let data = await response.json();

    if (data.success) {
      return data.success;
    } else {
      throw Error(data.error);
    }
  }

  /**
   * Returns a list of transactions matching the filter or type. If a namespace
   * is given, will also limit to that namespace.
   *
   * @param {string} filterOrType SQL filter or type (apply/deploy) to get
   * @param {string | number | undefined} namespace Name or ID of namespace to limit to
   * @returns List of transactions matching filter and namespace
   */
  async getTransactions(filterOrType = "apply", namespace) {
    let filter = [filterOrType];
    if (filterOrType === "apply") {
      filter = ["[Status] IN (0, 2, 4) AND [IsLocal] = 0"];
    } else if (filterOrType === "deploy") {
      filter = ["(([Status] = 0 AND [IsLocal] = 1) OR [Status] = 1)"];
    }

    filter.push("[Type] <> 98");

    if (namespace) {
      let n = await this.getNamespace(namespace);
      filter.push(`[Namespace] = '${n.Name}'`);
      this.logServerMessage(`Getting transactions (${n.Name})...`);
    } else {
      this.logServerMessage(`Getting transactions...`);
    }

    let { dsTransactions } = this;
    dsTransactions.setParameter(
      "whereClause",
      filter.filter(Boolean).join(" AND ")
    );
    await dsTransactions.refreshDataSource();

    return dsTransactions.map((r) => ({
      Namespace: r.Namespace,
      Name: r.Name,
      CreatedBy: r.CreatedByName,
      LocalCreatedBy: r.LocalCreatedBy,
    }));
  }

  /**
   * Publishes a bundle
   *
   * @param {number} projectId Project ID for the bundle
   * @param {number} versionId ID for the project version to publish
   * @param {string} description Description to set on the new version
   */
  async publishBundle(projectId, versionId, description) {
    this.logServerMessage("Publishing bundle...");
    await this.procPublishBundle.executeAsync({
      description,
      issueid: null,
      project_id: projectId,
      ver_id: versionId,
    });
  }

  /**
   * Publishes an article. If there is a mismatch between the latest transaction version
   * and the latest article version, the article will be published multiple times until
   * a transaction can be generated.
   *
   * @param {string} hostname Hostname of the article to publish
   * @param {string} articleId ID of the article to publish
   * @param {string} version Version comments to set as description
   */
  async publishArticle(hostname, articleId, version) {
    await this.checkoutArticle(hostname, articleId);

    let { dsArticlesVersions, dsTransactions } = this;
    dsArticlesVersions.setParameter(
      "whereClause",
      `[HostName] = '${hostname}' AND [ArticleId] LIKE '${articleId}.___'`
    );
    await dsArticlesVersions.refreshDataSource();

    dsTransactions.setParameter(
      "whereClause",
      `[Name] = '${hostname}/${articleId}'`
    );
    dsTransactions.setParameter("sortOrder", [{ Version: "desc" }]);
    await dsTransactions.refreshDataSource();

    // When we restore dev server, we sometimes get a mismatch between article versions
    // and transaction versions. To be able to generate a transaction, we have to publish
    // the app until the latest article version is higher than the latest transaction
    // version.
    if (
      dsTransactions.getDataLength() > 0 &&
      dsArticlesVersions.getDataLength() > 0
    ) {
      let transactionVersion = dsTransactions.getData(0, "Version");
      let articleVersion = Number(
        dsArticlesVersions.getData(0, "ArticleId").split(".")[1]
      );

      this.logServerMessage(
        `Last published version: ${Number(articleVersion)}`
      );
      this.logServerMessage(
        `Last transaction version: ${Number(transactionVersion)}`
      );

      while (articleVersion <= transactionVersion) {
        this.logServerMessage(`Publishing app (${version})...`);

        await this.procPublishArticle.execute({
          FromHostName: hostname,
          FromArticle: articleId,
          ToArticle: articleId,
          Description: version,
        });

        await dsArticlesVersions.refreshDataSource();
        articleVersion = Number(
          dsArticlesVersions.getData(0, "ArticleId").split(".")[1]
        );
      }
    } else {
      this.logServerMessage(`Publishing app (v${version})...`);

      await this.procPublishArticle.execute({
        FromHostName: hostname,
        FromArticle: articleId,
        ToArticle: articleId,
        Description: "v" + version,
      });
    }
  }

  /**
   * Uploads a zip file to an AF bundle project
   *
   * @param {number} projectId ID for the bundle project
   * @param {number} versionId Version ID for version 0 of the bundle
   * @param {string} file Path to the zip file
   */
  async uploadBundle(projectId, versionId, file) {
    this.logServerMessage(`Uploading bundle file '${file}'...`);
    let uploader = new FileUploader({
      route: `/api/bundle-push/${versionId}`,
      hostname: this.hostname,
    });

    let zipFile = await fileFromPath(file);
    await uploader.upload(zipFile, { Project_ID: projectId });
  }

  fetch(url, init) {
    return this.client.fetch(url, init);
  }
}
