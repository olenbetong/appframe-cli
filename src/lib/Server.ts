import chalk from "chalk";
import { config } from "dotenv";
import { fileFromPath } from "formdata-node/file-from-path";
import prompts, { PromptObject } from "prompts";

import {
  Client,
  DataObject,
  FileUploader,
  Procedure,
  ProcedureAPI,
  SortOrder,
} from "@olenbetong/data-object";

import {
  getApplyProcedure,
  getArticlesDataObject,
  getArticlesPermissionsDataObject,
  getArticlesVersionsDataObject,
  getBundlesDataObject,
  getBundlesProjectsDataObject,
  getCheckoutArticleProcedure,
  getCreateArticleProcedure,
  getCreateFirstBundleVersionProcedure,
  getDataResourcesDataObject,
  getDeployProcedure,
  getGenerateProcedure,
  getNamespacesDataObject,
  getPublishArticleProcedure,
  getPublishBundleProcedure,
  getPublishWebAssetProcedure,
  getSiteScriptsDataObject,
  getSiteStylesDataObject,
  getTemplatesDataObject,
  getTransactionsDataObject,
  getCopyDatasourcesFromDevProcedure,
} from "../data/index.js";

config({ path: process.cwd() + "/.env" });
let { APPFRAME_LOGIN: envUsername, APPFRAME_PWD: envPassword } = process.env;

const isInteractive = process.stdout.isTTY;

export class Server {
  private hostname: string;
  private username: string;
  private password: string;
  readonly client: Client;
  readonly dsArticles: DataObject<any>;
  readonly dsArticlesPermissions: DataObject<any>;
  readonly dsArticlesVersions: DataObject<any>;
  readonly dsBundles: DataObject<any>;
  readonly dsBundlesProjects: DataObject<any>;
  readonly dsDataResources: DataObject<any>;
  readonly dsNamespaces: DataObject<any>;
  readonly dsSiteScripts: DataObject<any>;
  readonly dsSiteStyles: DataObject<any>;
  readonly dsTemplates: DataObject<any>;
  readonly dsTransactions: DataObject<any>;
  readonly procApply: Procedure<any, any>;
  readonly procCheckoutArticle: ProcedureAPI<any, any>;
  readonly procCreateArticle: ProcedureAPI<any, any>;
  readonly procCreateFirstBundleVersion: ProcedureAPI<any, any>;
  readonly procCopyDataSourcesFromDev: ProcedureAPI<any, any>;
  readonly procDeploy: Procedure<any, any>;
  readonly procGenerate: Procedure<any, any>;
  readonly procPublishArticle: ProcedureAPI<any, any>;
  readonly procPublishBundle: Procedure<any, any>;
  readonly procPublishWebAsset: ProcedureAPI<any, any>;

  /**
   * Creates a server instance. If username or password is not provided, will attempt to look for
   * environment variables APPFRAME_LOGIN and APPFRAME_PWD. If username or password is still missing,
   * the login method will prompt the user if running in a TTY environment.
   *
   * @param {string} [hostname] Hostname of the server (default: dev.obet.no)
   * @param {string} [username] Appframe username
   * @param {string} [password] Appframe password
   */
  constructor(hostname?: string, username?: string, password?: string) {
    this.hostname = hostname ?? "dev.obet.no";
    this.username = username ?? envUsername ?? "";
    this.password = password ?? envPassword ?? "";
    this.client = new Client(this.hostname);
    this.dsArticles = getArticlesDataObject(this.client);
    this.dsArticlesPermissions = getArticlesPermissionsDataObject(this.client);
    this.dsArticlesVersions = getArticlesVersionsDataObject(this.client);
    this.dsBundles = getBundlesDataObject(this.client);
    this.dsBundlesProjects = getBundlesProjectsDataObject(this.client);
    this.dsDataResources = getDataResourcesDataObject(this.client);
    this.dsNamespaces = getNamespacesDataObject(this.client);
    this.dsSiteScripts = getSiteScriptsDataObject(this.client);
    this.dsSiteStyles = getSiteStylesDataObject(this.client);
    this.dsTemplates = getTemplatesDataObject(this.client);
    this.dsTransactions = getTransactionsDataObject(this.client);
    this.procApply = getApplyProcedure(this.client);
    this.procCheckoutArticle = getCheckoutArticleProcedure(this.client);
    this.procCreateArticle = getCreateArticleProcedure(this.client);
    this.procCreateFirstBundleVersion = getCreateFirstBundleVersionProcedure(
      this.client
    );
    this.procCopyDataSourcesFromDev = getCopyDatasourcesFromDevProcedure(
      this.client
    );
    this.procDeploy = getDeployProcedure(this.client);
    this.procGenerate = getGenerateProcedure(this.client);
    this.procPublishArticle = getPublishArticleProcedure(this.client);
    this.procPublishBundle = getPublishBundleProcedure(this.client);
    this.procPublishWebAsset = getPublishWebAssetProcedure(this.client);
  }

  logServerMessage(message: string) {
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
        let questions: PromptObject<"username" | "password">[] = [
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

  async addDataResource(id: string, name?: string) {
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
  async apply(namespace?: string | number) {
    let params: any = {};

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
   * @param {string | number} namespace - Limit check to a single namespace
   */
  async assertOnlyOneTransaction(
    filter: string,
    name: string,
    namespace: string | number
  ) {
    let transactions = await this.getTransactions(filter, namespace);

    if (transactions.length > 1) {
      // Allow multiple transactions if they are all for the current article
      for (let record of transactions) {
        if (record.Name !== name) {
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
    } else if (transactions.length === 0) {
      throw Error(
        "No transactions found. Check if there is a versioning problem with the article."
      );
    }
  }

  async addArticlePermission({
    hostname,
    articleId,
    roleId,
  }: {
    hostname: string;
    articleId: string;
    roleId: number;
  }) {
    this.logServerMessage(
      `Adding role ${roleId} to article ${articleId}'s permissions...`
    );
    this.dsArticlesPermissions.setCurrentIndex(-1);
    await this.dsArticlesPermissions.save({
      ArticleID: articleId,
      RoleID: roleId,
      HostName: hostname,
    });
  }

  async checkoutArticle(hostname: string, article: string) {
    this.logServerMessage(`Checking out article (${hostname}/${article})...`);
    await this.procCheckoutArticle.executeAsync({
      HostName: hostname,
      ArticleID: article,
      Forced: true,
    });
  }

  async createArticle({
    namespaceId,
    hostname,
    id,
    htmlContent,
    title,
    template,
  }: {
    namespaceId: string | number;
    hostname: string;
    id: string;
    htmlContent: string;
    title: string;
    template: string;
  }) {
    this.logServerMessage(`Creating article ${hostname}/${id}...`);
    await this.procCreateArticle.executeAsync({
      HostName: hostname,
      ArticleID: id,
      HTMLContent: htmlContent,
      NamespaceID: namespaceId,
      Title: title,
      TemplateID: template ?? null,
      ParentArticleID: null,
    });
  }

  async deleteDataResource(id: string) {
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
   * @param {number | string} [namespace] ID of the namespace to deploy
   */
  async deploy(namespace?: string | number) {
    let params: any = {};

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
      throw Error(`${result.status} ${result.statusText}`);
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
  async download(namespace: string) {
    let url = "/api/ob-deploy/download";
    if (namespace) {
      let n = await this.getNamespace(namespace);
      url += "/1/" + n.Name;
      this.logServerMessage(`Downloading updates (${n.Name})...`);
    } else {
      this.logServerMessage(`Downloading updates...`);
    }

    let attempt = 1;
    let retry = true;

    while (retry) {
      try {
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
          throw Error(`${result.status} ${result.statusText}`);
        }

        retry = false;
      } catch (error) {
        if (attempt >= 3) {
          throw error;
        }
        this.logServerMessage(
          `Failed to download transactions from ${this.hostname} (${
            (error as Error).message
          }). Retrying in 1 second...`
        );
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Generates transactions for the given namespace, or all namespaces if no ID is given.
   *
   * @param {number | string} [namespace] ID of the namespace to generate transactions in
   */
  async generate(namespace?: number | string) {
    let params: any = {};

    if (namespace) {
      let n = await this.getNamespace(namespace);
      params.Namespace_ID = n.ID;
      this.logServerMessage(`Generating transactions (${n.Name})...`);
    } else {
      this.logServerMessage("Generating transactions...");
    }

    await this.procGenerate.execute(params);
  }

  async getArticle(hostname: string, article: string) {
    let { dsArticles } = this;
    this.logServerMessage(
      `Getting article information (${hostname}/${article})...`
    );
    let articles = (await dsArticles.dataHandler.retrieve({
      whereClause: `[HostName] = '${hostname}' AND [ArticleID] = '${article}'`,
    })) as any[];

    return articles[0];
  }

  /**
   * Gets the bundle version for the given bundle with version 0
   *
   * @param {string} bundle Name of the bundle
   */
  async getBundle(bundle: string) {
    let { dsBundles } = this;
    this.logServerMessage(`Getting bundle (${bundle})...`);
    dsBundles.setParameter(
      "whereClause",
      `[Name] = '${bundle}' AND [Version] = 0`
    );
    await dsBundles.refreshDataSource();

    if (dsBundles.getDataLength() === 0) {
      return undefined;
    }

    return dsBundles.getData(0);
  }

  /**
   *
   * @param {string | number} namespace Name or ID of the namespace
   * @returns
   */
  async getNamespace(namespace: string | number) {
    let { dsNamespaces } = this;
    let filter: string = "";
    if (typeof namespace === "string") {
      filter = `[Name] = '${namespace}'`;
    } else if (typeof namespace === "number") {
      filter = `[ID] = ${namespace}`;
    }

    let namespaces = (await dsNamespaces.dataHandler.retrieve({
      whereClause: filter,
    })) as any[];

    return namespaces[0];
  }

  /**
   * Get namespace argument from the command line, or let the user select from a list
   * if they didn't provide one.
   *
   * @param {string | undefined} namespace Namespace argument from the command line
   * @param {any} options Command options, potentially including an `all` property
   * @returns {Promise<string>} Namespace name
   */
  async getNamespaceArgument(
    namespace?: string,
    options: any = {}
  ): Promise<string> {
    let { dsNamespaces } = this;

    if (!namespace && !options.all) {
      if (process.stdout.isTTY) {
        dsNamespaces.setParameter("maxRecords", -1);
        dsNamespaces.setParameter("sortOrder", [
          { GroupName: SortOrder.Asc },
          { Name: SortOrder.Asc },
        ]);
        await dsNamespaces.refreshDataSource();

        let question: PromptObject<"namespace"> = {
          type: "autocomplete",
          name: "namespace",
          message: "Select namespace",
          choices: dsNamespaces.getData().map((r) => ({
            title: r.GroupName ? `${r.Name} (${r.GroupName})` : r.Name,
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

    return namespace ?? "";
  }

  /**
   * Get resource name argument for commands. If a name is not provided by
   * the user, create a prompt with autocomplete to let them select it.
   * @param {string | undefined} resourceArg Resource argument from command line
   * @returns {Promise<string>} Resource name
   */
  async getResourceArgument(resourceArg?: string): Promise<string> {
    if (resourceArg) return resourceArg;

    if (isInteractive) {
      let resources = await this.getResources();
      let question: PromptObject<"resource"> = {
        type: "autocomplete",
        name: "resource",
        message: "Select the resource you want to view",
        choices: resources.map(
          (resource: { Name: string; DBObjectID: string }) => ({
            title: resource.Name,
            value: resource.DBObjectID,
          })
        ),
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

    throw Error("Resource must be provided if not in interactive mode");
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
      data.success.sort((a: any, z: any) => {
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
  async getResourceDefinition(name: string) {
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
   * @param {string | number} [namespace] Name or ID of namespace to limit to
   * @returns List of transactions matching filter and namespace
   */
  async getTransactions(
    filterOrType: string = "apply",
    namespace?: string | number
  ) {
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
   * Creates a bundle project
   *
   * @param {string} name Name of the bundle
   * @param {number} namespaceId ID of the namespace to add the bundle to
   */
  async createBundle(name: string, namespaceId: number) {
    this.logServerMessage(`Creating bundle (${name})...`);
    this.dsBundlesProjects.setCurrentIndex(-1);
    let newBundle = await this.dsBundlesProjects.save({
      Name: name,
      Namespace_ID: namespaceId,
    });
    if (newBundle && newBundle.ID) {
      this.logServerMessage(`Created bundle ${name} with ID ${newBundle.ID}.`);
      this.logServerMessage(`Creating bundle version...`);
      await this.procCreateFirstBundleVersion.execute({
        project_id: newBundle.ID,
      });
    }

    return newBundle;
  }

  /**
   * Publishes a bundle
   *
   * @param {number} projectId Project ID for the bundle
   * @param {number} versionId ID for the project version to publish
   * @param {string} description Description to set on the new version
   */
  async publishBundle(
    projectId: number,
    versionId: number,
    description: string
  ) {
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
  async publishArticle(hostname: string, articleId: string, version: string) {
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
    dsTransactions.setParameter("sortOrder", [{ Version: SortOrder.Desc }]);
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
   * Publishes a template
   *
   * @param {string} hostname Hostname where the template is
   * @param {string} templateId ID of the template to publish
   * @param {string} version Version comments to set as description
   */
  async publishTemplate(hostname: string, templateId: string, version: string) {
    await this.publishWebAsset(hostname, templateId, "Template", version);
  }

  /**
   * Publishes a site script
   *
   * @param {string} hostname Hostname where the site script is
   * @param {string} scriptId ID of the site script to publish
   * @param {string} version Version comments to set as description
   */
  async publishSiteScript(hostname: string, scriptId: string, version: string) {
    await this.publishWebAsset(hostname, scriptId, "Script", version);
  }

  /**
   * Publishes a site style
   *
   * @param {string} hostname Hostname where the site style is
   * @param {string} styleId ID of the site style to publish
   * @param {string} version Version comments to set as description
   */
  async publishSiteStyle(hostname: string, styleId: string, version: string) {
    await this.publishWebAsset(hostname, styleId, "Style", version);
  }

  /**
   * Publish a web asset (template, script or style)
   *
   * @param {string} hostname Hostname where the asset is located
   * @param {string} name Name of the asset
   * @param {"Template" | "Script" | "Style"} type Type of asset to publish
   * @param {string} description Description of the update
   */
  async publishWebAsset(
    hostname: string,
    name: string,
    type: "Template" | "Script" | "Style",
    description: string
  ) {
    this.logServerMessage(
      `Publishing ${type.toLocaleLowerCase()} '${hostname}/${name}'...`
    );
    await this.procPublishWebAsset.execute({
      Hostname: hostname,
      Name: name,
      Type: type,
      Description: description,
      IssueID: null,
    });
  }

  /**
   * Uploads a zip file to an AF bundle project
   *
   * @param {number} projectId ID for the bundle project
   * @param {number} versionId Version ID for version 0 of the bundle
   * @param {string} file Path to the zip file
   */
  async uploadBundle(projectId: string, versionId: number, file: string) {
    this.logServerMessage(`Uploading bundle file '${file}'...`);
    // @ts-ignore
    let uploader = new FileUploader({
      route: `/api/bundle-push/${versionId}`,
      client: this.client,
    });

    let zipFile = await fileFromPath(file);
    // @ts-ignore
    await uploader.upload(zipFile, { Project_ID: projectId });
  }

  /**
   * Uploads a template
   *
   * @param {string} hostname Hostname where the template is
   * @param {string} templateId ID of the template to upload
   * @param {string | undefined} content Content to upload for production use (undefined will not modify existing template)
   * @param {string | undefined} contentTest Content to upload for test mode use (undefined will not modify existing template)
   */
  async uploadTemplate(
    hostname: string,
    templateId: string,
    content?: string,
    contentTest?: string
  ) {
    this.logServerMessage(`Getting template '${hostname}/${templateId}'...`);
    this.dsTemplates.setParameter(
      "whereClause",
      `[HostName] = '${hostname}' AND [Name] = '${templateId}'`
    );
    await this.dsTemplates.refreshDataSource();

    if (this.dsTemplates.getDataLength() === 0) {
      this.logServerMessage(
        `Template '${hostname}/${templateId}' not found. Creating...`
      );
      this.dsTemplates.setCurrentIndex(-1);
      this.dsTemplates.currentRow("HostName", hostname);
      this.dsTemplates.currentRow("Name", templateId);
    }

    if (content !== undefined) {
      this.dsTemplates.currentRow("HTMLContent", content);
    }
    if (contentTest !== undefined) {
      this.dsTemplates.currentRow("HTMLContentTest", contentTest);
    }

    this.logServerMessage(`Saving template '${hostname}/${templateId}'...`);
    await this.dsTemplates.endEdit();
  }

  /**
   * Uploads a site script
   *
   * @param {string} hostname Hostname where the site script is
   * @param {string} scriptId ID of the site script to upload
   * @param {string | undefined} content Content to upload for production use (undefined will not modify existing script)
   * @param {string | undefined} contentTest Content to upload for test mode use (undefined will not modify existing script)
   */
  async uploadSiteScript(
    hostname: string,
    scriptId: string,
    content?: string,
    contentTest?: string
  ) {
    this.logServerMessage(`Getting site script '${hostname}/${scriptId}'...`);
    this.dsSiteScripts.setParameter(
      "whereClause",
      `[HostName] = '${hostname}' AND [Name] = '${scriptId}'`
    );
    await this.dsSiteScripts.refreshDataSource();

    if (this.dsSiteScripts.getDataLength() === 0) {
      this.logServerMessage(
        `Site script '${hostname}/${scriptId}' not found. Creating...`
      );
      this.dsSiteScripts.setCurrentIndex(-1);
      this.dsSiteScripts.currentRow("HostName", hostname);
      this.dsSiteScripts.currentRow("Name", scriptId);
    }

    if (content !== undefined) {
      this.dsSiteScripts.currentRow("ScriptContent", content);
    }
    if (contentTest !== undefined) {
      this.dsSiteScripts.currentRow("ScriptContentTest", contentTest);
    }

    this.logServerMessage(`Saving site script '${hostname}/${scriptId}'...`);
    await this.dsSiteScripts.endEdit();
  }

  /**
   * Uploads a site style
   *
   * @param {string} hostname Hostname where the site style is
   * @param {string} styleId ID of the site style to upload
   * @param {string | undefined} content Content to upload for production use (undefined will not modify existing stylesheet)
   * @param {string | undefined} contentTest Content to upload for test mode use (undefined will not modify existing stylesheet)
   */
  async uploadSiteStyle(
    hostname: string,
    styleId: string,
    content?: string,
    contentTest?: string
  ) {
    this.logServerMessage(`Getting site style '${hostname}/${styleId}'...`);
    this.dsSiteStyles.setParameter(
      "whereClause",
      `[HostName] = '${hostname}' AND [Name] = '${styleId}'`
    );
    await this.dsSiteStyles.refreshDataSource();

    if (this.dsSiteStyles.getDataLength() === 0) {
      this.logServerMessage(
        `Site style '${hostname}/${styleId}' not found. Creating...`
      );
      this.dsSiteStyles.setCurrentIndex(-1);
      this.dsSiteStyles.currentRow("HostName", hostname);
      this.dsSiteStyles.currentRow("Name", styleId);
    }

    if (content !== undefined) {
      this.dsSiteStyles.currentRow("StyleContent", content);
    }
    if (contentTest !== undefined) {
      this.dsSiteStyles.currentRow("StyleContentTest", contentTest);
    }

    this.logServerMessage(`Saving site style '${hostname}/${styleId}'...`);
    await this.dsSiteStyles.endEdit();
  }

  /**
   * Copy data objects and fields for an article from dev server.
   * This is used to enable running CRA dev environments against the
   * stage server. Instead of publishing the article to update data objects
   * on stage, we can copy the data objects and fields from the dev server
   * directly.
   *
   * @param {string} hostname
   * @param {string} articleId
   */
  async copyDatasourcesFromDev(hostname: string, articleId: string) {
    this.logServerMessage(
      `Copying datasources from dev for '${hostname}/${articleId}'...`
    );
    await this.procCopyDataSourcesFromDev.execute({
      Hostname: hostname,
      ArticleId: articleId,
    });
  }

  fetch(url: string | RequestInit, init?: RequestInit) {
    return this.client.fetch(url, init);
  }
}