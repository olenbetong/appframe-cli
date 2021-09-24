import chalk from "chalk";
import { config } from "dotenv";
import { fileFromPath } from "formdata-node/file-from-path";
import prompts from "prompts";

import { FileUploader } from "@olenbetong/data-object/node";
import { afFetch, login, setHostname } from "@olenbetong/data-object/node";

import {
  dsArticles,
  dsArticlesVersions,
  dsBundles,
  dsNamespaces,
  dsTransactions,
  procApply,
  procCheckoutArticle,
  procDeploy,
  procGenerate,
  procPublishArticle,
  procPublishBundle,
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
  }

  logServerMessage(message) {
    let colorFn = chalk.bgRed;
    if (this.hostname.startsWith("dev")) {
      colorFn = chalk.bgGreen;
    } else if (this.hostname.startsWith("stage")) {
      colorFn = chalk.bgYellow;
    }

    let hostname = this.hostname.replace(/(\.obet\.no|\.olenbetong\.no)/g, "");
    console.log(colorFn(`[${hostname}]`) + ` ${message}`);
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
    setHostname(this.hostname);
    return await login(this.username, this.password);
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

    setHostname(this.hostname);
    await procApply.execute(params);
  }

  /**
   * Checks that there are no transactions with a different name than `name` that matches `filter`.
   * Log transactions (type = 98) are not counted. If there are other transactions, an error is thrown.
   *
   * @param {string} filter - Filter to use on transactions
   * @param {string} name - Name of the expected transaction.
   */
  async assertOnlyOneTransaction(filter, name) {
    this.logServerMessage("Getting transactions...");
    setHostname(this.hostname);
    let transactions = await this.list(filter);

    if (transactions > 1) {
      // Allow multiple transactions if they are all for the current article
      for (let record of dsTransactions.getData()) {
        if (record.Name !== name && record.Type !== 98) {
          console.table(
            dsTransactions.map((r) => ({
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
    this.logServerMessage("Checking out article...");
    await procCheckoutArticle.executeAsync({
      HostName: hostname,
      ArticleID: article,
      Forced: true,
    });
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

    setHostname(this.hostname);
    await procDeploy.execute(params);
  }

  /**
   * Download updates for the given namespace
   * @param {string} namespace Name of the namespace to download
   */
  async download(namespace) {
    this.logServerMessage("Downloading updates...");
    let result = await afFetch(`/api/ob-deploy/download/1/${namespace}`, {
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

    setHostname(this.hostname);
    await procGenerate.execute(params);
  }

  async getArticle(hostname, article) {
    this.logServerMessage("Getting article information...");
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
    this.logServerMessage("Getting bundle...");
    setHostname(this.hostname);
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
    if (typeof namespace === "string") {
      dsNamespaces.setParameter("whereClause", `[Name] = '${namespace}'`);
    } else if (typeof namespace === "number") {
      dsNamespaces.setParameter("whereClause", `[ID] = ${namespace}`);
    }
    await dsNamespaces.refreshDataSource();

    return dsNamespaces.getData(0);
  }

  /**
   * Returns a list of transactions matching the filter or type. If a namespace
   * is given, will also limit to that namespace.
   *
   * @param {string} filterOrType SQL filter or type (apply/deploy) to get
   * @param {string | number | undefined} namespace Name or ID of namespace to limit to
   * @returns List of transactions matching filter and namespace
   */
  async list(filterOrType = "apply", namespace) {
    let filter = [filterOrType];
    if (filterOrType === "apply") {
      filter = ["[Status] IN (0, 2, 4) AND [IsLocal] = 0"];
    } else if (filterOrType === "deploy") {
      filter = ["(([Status] = 0 AND [IsLocal] = 1) OR [Status] = 1)"];
    }

    if (namespace) {
      let n = await this.getNamespace(namespace);
      filter.push(`[Namespace] = '${n.Name}'`);
      this.logServerMessage(`Getting transactions (${n.Name})...`);
    } else {
      this.logServerMessage(`Getting transactions...`);
    }

    setHostname(this.hostname);
    dsTransactions.setParameter(
      "whereClause",
      filter.filter(Boolean).join(" AND ")
    );
    await dsTransactions.refreshDataSource();

    return dsTransactions.map((r) => ({
      Namespace: r.Namespace,
      Name: r.Name,
      CreatedBy: r.CreatedBy,
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
    await procPublishBundle.executeAsync({
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
    console.log("Checking out article...");
    await procCheckoutArticle.executeAsync({
      HostName: hostname,
      ArticleID: articleId,
      Forced: true,
    });

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

      console.log(`Last published version: ${Number(articleVersion)}`);
      console.log(`Last transaction version: ${Number(transactionVersion)}`);

      while (articleVersion <= transactionVersion) {
        console.log(`Publishing app (v${version})...`);

        await procPublishArticle.execute({
          FromHostName: hostname,
          FromArticle: articleId,
          ToArticle: articleId,
          Description: "v" + version,
        });

        await dsArticlesVersions.refreshDataSource();
        articleVersion = Number(
          dsArticlesVersions.getData(0, "ArticleId").split(".")[1]
        );
      }
    } else {
      console.log(`Publishing app (v${version})...`);

      await procPublishArticle.execute({
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
    this.logServerMessage("Uploading bundle...");
    let uploader = new FileUploader({
      route: `/api/bundle-push/${versionId}`,
      hostname: this.hostname,
    });

    let zipFile = await fileFromPath(file);
    await uploader.upload(zipFile, { Project_ID: projectId });
  }
}
