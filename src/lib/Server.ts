import chalk from "chalk";
import { config } from "dotenv";
import { fileFromPath } from "formdata-node/file-from-path";
import prompts, { PromptObject } from "prompts";

import {
	Client,
	DataHandler,
	FileUploader,
	ProcedureBase,
	SortOrder,
} from "@olenbetong/appframe-data";

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
	DataResourcesParametersRecord,
	getDataResourcesParametersDataObject,
} from "../data/index.js";

config({ path: process.cwd() + "/.env" });
let { APPFRAME_LOGIN: envUsername, APPFRAME_PWD: envPassword } = process.env;

const isInteractive = process.stdout.isTTY;

export class Server {
	private hostname: string;
	private username: string;
	private password: string;
	readonly client: Client;
	readonly dsArticles: DataHandler<any>;
	readonly dsArticlesPermissions: DataHandler<any>;
	readonly dsArticlesVersions: DataHandler<any>;
	readonly dsBundles: DataHandler<any>;
	readonly dsBundlesProjects: DataHandler<any>;
	readonly dsDataResources: DataHandler<any>;
	readonly dsDataResourcesParameters: DataHandler<DataResourcesParametersRecord>;
	readonly dsNamespaces: DataHandler<any>;
	readonly dsSiteScripts: DataHandler<any>;
	readonly dsSiteStyles: DataHandler<any>;
	readonly dsTemplates: DataHandler<any>;
	readonly dsTransactions: DataHandler<any>;
	readonly procApply: ProcedureBase<any, any>;
	readonly procCheckoutArticle: ProcedureBase<any, any>;
	readonly procCreateArticle: ProcedureBase<any, any>;
	readonly procCreateFirstBundleVersion: ProcedureBase<any, any>;
	readonly procCopyDataSourcesFromDev: ProcedureBase<any, any>;
	readonly procDeploy: ProcedureBase<any, any>;
	readonly procGenerate: ProcedureBase<any, any>;
	readonly procPublishArticle: ProcedureBase<any, any>;
	readonly procPublishBundle: ProcedureBase<any, any>;
	readonly procPublishWebAsset: ProcedureBase<any, any>;

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
		this.dsDataResourcesParameters = getDataResourcesParametersDataObject(
			this.client,
		);
		this.dsNamespaces = getNamespacesDataObject(this.client);
		this.dsSiteScripts = getSiteScriptsDataObject(this.client);
		this.dsSiteStyles = getSiteStylesDataObject(this.client);
		this.dsTemplates = getTemplatesDataObject(this.client);
		this.dsTransactions = getTransactionsDataObject(this.client);
		this.procApply = getApplyProcedure(this.client);
		this.procCheckoutArticle = getCheckoutArticleProcedure(this.client);
		this.procCreateArticle = getCreateArticleProcedure(this.client);
		this.procCreateFirstBundleVersion = getCreateFirstBundleVersionProcedure(
			this.client,
		);
		this.procCopyDataSourcesFromDev = getCopyDatasourcesFromDevProcedure(
			this.client,
		);
		this.procDeploy = getDeployProcedure(this.client);
		this.procGenerate = getGenerateProcedure(this.client);
		this.procPublishArticle = getPublishArticleProcedure(this.client);
		this.procPublishBundle = getPublishBundleProcedure(this.client);
		this.procPublishWebAsset = getPublishWebAssetProcedure(this.client);
	}

	private getHostPrefix() {
		let colorFn = chalk.bgRed;
		if (this.hostname.startsWith("dev")) {
			colorFn = chalk.bgGreen;
		} else if (this.hostname.startsWith("stage")) {
			colorFn = chalk.bgYellow;
		}

		let hostname = this.hostname.replace(/(\.obet\.no|\.olenbetong\.no)/g, "");

		return colorFn(`[${hostname}]`);
	}

	async logAsyncTask<T>(
		task: Promise<T>,
		runningMessage: string,
		completedMessage?: string | ((param: Awaited<T>) => string | undefined),
	): Promise<T> {
		if (isInteractive) {
			let start = performance.now();

			process.stdout.clearLine(0);
			process.stdout.cursorTo(0);
			process.stdout.write(`${this.getHostPrefix()} ${runningMessage}`);

			let interval = setInterval(() => {
				process.stdout.write(".");
			}, 250);

			try {
				let result = await task;

				process.stdout.clearLine(0);
				process.stdout.cursorTo(0);
				process.stdout.write(
					`${this.getHostPrefix()} ${
						(typeof completedMessage === "function"
							? completedMessage(result)
							: completedMessage) ?? runningMessage
					} (${Math.floor(performance.now() - start)}ms)\n`,
				);

				return result;
			} catch (error) {
				process.stdout.write("\n");
				throw error;
			} finally {
				clearInterval(interval);
			}
		}

		return await task;
	}

	logServerMessage(message: string) {
		if (isInteractive) {
			console.log(`${this.getHostPrefix()} ${message}`);
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

		let task = this.client.login(this.username, this.password);

		return await this.logAsyncTask(task, "Logging in", "Logged in");
	}

	async addDataResource(id: string, name?: string) {
		await this.logAsyncTask(
			this.dsDataResources.create({
				DBObjectID: id,
				Name: name,
			}),
			`Adding data resource (${id})`,
			`Data resource added (${id})`,
		);
	}

	/**
	 * Applies updates matching the namespace, or all updates if no namespace is given
	 *
	 * @param {string | number | undefined} namespace limit apply updates to a namespace (ID or name)
	 */
	async apply(namespace?: string | number) {
		let params: any = {};
		let message: string;

		if (namespace) {
			let n = await this.getNamespace(namespace);
			params.Namespaces = String(n.ID);
			message = `Applying updates (${n.Name})`;
		} else {
			message = "Applying updates";
		}

		let task = this.procApply.execute(params);
		return await this.logAsyncTask(task, message, "Updates applied");
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
		namespace: string | number,
	) {
		let transactions = await this.getTransactions(filter, namespace);

		if (transactions.length > 1) {
			// Allow multiple transactions if they are all for the current article
			for (let record of transactions) {
				if (record.Name !== name) {
					console.table(
						transactions.map((r) => ({
							Namespace: r.Namespace,
							Name: r.Name,
							CreatedBy: r.CreatedBy,
							LocalCreatedBy: r.LocalCreatedBy,
						})),
					);
					throw Error(
						"Found more than 1 transaction. Deploy have to be done manually.",
					);
				}
			}
		} else if (transactions.length === 0) {
			throw Error(
				"No transactions found. Check if there is a versioning problem with the article.",
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
		await this.logAsyncTask(
			this.dsArticlesPermissions.create({
				ArticleID: articleId,
				RoleID: roleId,
				HostName: hostname,
			}),
			`Adding role ${roleId} to article ${articleId}'s permissions`,
		);
	}

	async checkoutArticle(hostname: string, article: string) {
		await this.logAsyncTask(
			this.procCheckoutArticle.execute({
				HostName: hostname,
				ArticleID: article,
				Forced: true,
			}),
			`Checking out article (${hostname}/${article})`,
			`Article (${hostname}/${article}) checked out`,
		);
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
		await this.logAsyncTask(
			this.procCreateArticle.execute({
				HostName: hostname,
				ArticleID: id,
				HTMLContent: htmlContent,
				NamespaceID: namespaceId,
				Title: title,
				TemplateID: template ?? null,
				ParentArticleID: null,
			}),
			`Creating article ${hostname}/${id}`,
			`Article ${hostname}/${id} created`,
		);
	}

	async deleteDataResource(id: string) {
		let { dsDataResources } = this;
		let resource = await this.getResourceDefinition(id);
		let resourceRecord = await dsDataResources.retrieve({
			whereClause: `[DBObjectID] = '${resource.DBObjectID}'`,
			maxRecords: -1,
		});

		if (resourceRecord.length === 1) {
			await this.logAsyncTask(
				dsDataResources.destroy({
					PrimKey: resourceRecord[0].PrimKey,
				}),
				`Deleting '${resourceRecord[0].DBObjectID}'`,
				`'${resourceRecord[0].DBObjectID}' deleted`,
			);
		} else {
			this.logServerMessage(
				chalk.red(
					`Expected 1 resource to match '${id}'. Found ${resourceRecord.length}`,
				),
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
		let message: string;

		if (namespace) {
			let n = await this.getNamespace(namespace);
			params.Namespace_ID = n.ID;
			message = `Deploying (${n.Name})`;
		} else {
			message = "Deploying";
		}

		await this.logAsyncTask(this.procDeploy.execute(params), message);
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
		let message: string;

		if (namespace) {
			let n = await this.getNamespace(namespace);
			url += "/1/" + n.Name;
			message = `Downloading updates (${n.Name})`;
		} else {
			message = `Downloading updates`;
		}

		let attempt = 1;
		let retry = true;

		while (retry) {
			try {
				let result = await this.logAsyncTask(
					this.client.afFetch(url, {
						method: "POST",
					}),
					message,
				);

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
					}). Retrying in 1 second...`,
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
		let { dsNamespaces } = this;
		let params: any = {};
		let namespaces: any[];

		if (namespace) {
			let n = await this.getNamespace(namespace);
			namespaces = [n];
			params.Namespace_ID = n.ID;
		} else {
			namespaces = await dsNamespaces.retrieve({
				maxRecords: -1,
				whereClause: "[GroupName] IS NULL OR [GroupName] <> 'AF'",
				sortOrder: [{ Name: SortOrder.Asc }],
			});
		}

		if (namespaces.length === 0) {
			this.logServerMessage(chalk.yellow("No namespaces found"));
			return;
		}

		for (let namespace of namespaces) {
			params = {
				Namespace_ID: namespace.ID,
			};

			await this.logAsyncTask(
				this.procGenerate.execute(params),
				`Generating transactions (${namespace.Name})`,
				`Transactions generated (${namespace.Name})`,
			);
		}
	}

	async getArticle(hostname: string, article: string) {
		let { dsArticles } = this;
		this.logServerMessage(
			`Getting article information (${hostname}/${article})...`,
		);
		let articles = await dsArticles.retrieve({
			whereClause: `[HostName] = '${hostname}' AND [ArticleID] = '${article}'`,
		});

		return articles[0];
	}

	/**
	 * Gets the bundle version for the given bundle with version 0
	 *
	 * @param {string} bundleName Name of the bundle
	 */
	async getBundle(bundleName: string) {
		let { dsBundles } = this;
		let bundle = await this.logAsyncTask(
			dsBundles.retrieve({
				maxRecords: 1,
				whereClause: `[Name] = '${bundleName}' AND [Version] = 0`,
			}),
			`Getting bundle (${bundleName})`,
		);

		return bundle[0];
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

		let namespaces = await dsNamespaces.retrieve({
			whereClause: filter,
			sortOrder: [{ GroupName: SortOrder.Asc, Name: SortOrder.Asc }],
		});

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
		options: any = {},
	): Promise<string> {
		let { dsNamespaces } = this;

		if (!namespace && !options.all) {
			if (process.stdout.isTTY) {
				let namespaces = await dsNamespaces.retrieve({
					maxRecords: -1,
					sortOrder: [{ GroupName: SortOrder.Asc }, { Name: SortOrder.Asc }],
				});

				let question: PromptObject<"namespace"> = {
					type: "autocomplete",
					name: "namespace",
					message: "Select namespace",
					choices: namespaces.map((r) => ({
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
						"Namespace must be provided if --all is not set in a non-interactive environment",
					),
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
					}),
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
		let response = await this.logAsyncTask(
			this.client.afFetch("/api/data", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					operation: "resource-definition",
					resourceName: name,
				}),
			}),
			`Getting resource definition (${name})`,
		);

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
		namespace?: string | number,
	) {
		let filter = [filterOrType];
		if (filterOrType === "apply") {
			filter = ["[Status] IN (0, 2) AND [IsLocal] = 0"];
		} else if (filterOrType === "deploy") {
			filter = ["(([Status] = 0 AND [IsLocal] = 1) OR [Status] = 1)"];
		}

		filter.push("[Type] <> 98");

		let message: string;

		if (namespace) {
			let n = await this.getNamespace(namespace);
			filter.push(`[Namespace] = '${n.Name}'`);
			message = `Getting transactions (${n.Name})`;
		} else {
			message = `Getting transactions`;
		}

		let { dsTransactions } = this;
		let task = dsTransactions.retrieve({
			whereClause: filter.filter(Boolean).join(" AND "),
			maxRecords: -1,
		});

		let transactions = await this.logAsyncTask(task, message);

		return transactions.map((r) => ({
			Namespace: r.Namespace,
			Name: r.Name,
			CreatedBy: r.CreatedByName,
			LocalCreatedBy: r.LocalCreatedBy,
			Status: r.Status,
			LastError: r.LastError,
		}));
	}

	/**
	 * Creates a bundle project
	 *
	 * @param {string} name Name of the bundle
	 * @param {number} namespaceId ID of the namespace to add the bundle to
	 */
	async createBundle(name: string, namespaceId: number) {
		let newBundle = await this.logAsyncTask(
			this.dsBundlesProjects.create({
				Name: name,
				Namespace_ID: namespaceId,
			}),
			`Creating bundle (${name})`,
			(newBundle) => {
				if (newBundle && newBundle.ID) {
					return `Bundle '${name}' created with ID ${newBundle.ID}.`;
				}
			},
		);

		if (newBundle && newBundle.ID) {
			await this.logAsyncTask(
				this.procCreateFirstBundleVersion.execute({
					project_id: newBundle.ID,
				}),
				`Creating bundle version`,
			);
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
		description: string,
	) {
		await this.logAsyncTask(
			this.procPublishBundle.execute({
				description,
				issueid: null,
				project_id: projectId,
				ver_id: versionId,
			}),
			"Publishing bundle",
			"Bundle published",
		);
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

		let { dsArticles, dsTransactions } = this;
		let articleVersions = await dsArticles.retrieve({
			whereClause: `[HostName] = '${hostname}' AND [ArticleDevID] = '${articleId}'`,
			maxRecords: 1,
			sortOrder: [{ ArticleVersion: SortOrder.Desc }],
		});
		let transactions = await dsTransactions.retrieve({
			whereClause: `[Name] = '${hostname}/${articleId}'`,
			maxRecords: -1,
			sortOrder: [{ Version: SortOrder.Desc }],
		});

		// When we restore dev server, we sometimes get a mismatch between article versions
		// and transaction versions. To be able to generate a transaction, we have to publish
		// the app until the latest article version is higher than the latest transaction
		// version.
		if (transactions.length > 0 && articleVersions.length > 0) {
			let transactionVersion = transactions[0].Version;
			let articleVersion = Number(articleVersions[0].ArticleId.split(".")[1]);

			this.logServerMessage(
				`Last published version: ${Number(articleVersion)}`,
			);
			this.logServerMessage(
				`Last transaction version: ${Number(transactionVersion)}`,
			);

			do {
				await this.logAsyncTask(
					this.procPublishArticle.execute({
						FromHostName: hostname,
						FromArticle: articleId,
						ToArticle: articleId,
						Description: version,
					}),
					`Publishing app (${version})`,
					`App published (${version})`,
				);

				articleVersions = await dsArticles.retrieve({
					whereClause: `[HostName] = '${hostname}' AND [ArticleDevID] = '${articleId}'`,
					maxRecords: 1,
					sortOrder: [{ ArticleVersion: SortOrder.Desc }],
				});

				articleVersion = Number(articleVersions[0].ArticleId.split(".")[1]);
			} while (articleVersion <= transactionVersion);
		} else {
			await this.logAsyncTask(
				this.procPublishArticle.execute({
					FromHostName: hostname,
					FromArticle: articleId,
					ToArticle: articleId,
					Description: version,
				}),
				`Publishing app (${version})`,
				`App published (${version})`,
			);
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
		description: string,
	) {
		await this.logAsyncTask(
			this.procPublishWebAsset.execute({
				Hostname: hostname,
				Name: name,
				Type: type,
				Description: description,
				IssueID: null,
			}),
			`Publishing ${type.toLocaleLowerCase()} '${hostname}/${name}'`,
			`Published ${type.toLocaleLowerCase()} '${hostname}/${name}'`,
		);
	}

	/**
	 * Uploads a zip file to an AF bundle project
	 *
	 * @param {number} projectId ID for the bundle project
	 * @param {number} versionId Version ID for version 0 of the bundle
	 * @param {string} file Path to the zip file
	 */
	async uploadBundle(projectId: string, versionId: number, file: string) {
		let run = async () => {
			// @ts-ignore
			let uploader = new FileUploader({
				route: `/api/bundle-push/${versionId}`,
				client: this.client,
			});

			let zipFile = await fileFromPath(file);
			// @ts-ignore
			await uploader.upload(zipFile, { Project_ID: projectId });
		};

		await this.logAsyncTask(
			run(),
			`Uploading bundle file '${file}'`,
			`Uploaded bundle file '${file}'`,
		);
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
		contentTest?: string,
	) {
		let template = await this.logAsyncTask(
			this.dsTemplates.retrieve({
				whereClause: `[HostName] = '${hostname}' AND [Name] = '${templateId}'`,
				maxRecords: 1,
			}),
			`Getting template '${hostname}/${templateId}'`,
		);

		let updates: any = {};
		if (content !== undefined) {
			updates.HTMLContent = content;
		}

		if (contentTest !== undefined) {
			updates.HTMLContentTest = contentTest;
		}

		if (template.length === 0) {
			await this.logAsyncTask(
				this.dsTemplates.create({
					HostName: hostname,
					Name: templateId,
					...updates,
				}),
				`Creating template '${hostname}/${templateId}'`,
				`Template '${hostname}/${templateId}' created`,
			);
		} else {
			await this.logAsyncTask(
				this.dsTemplates.update({
					PrimKey: template[0].PrimKey,
					...updates,
				}),
				`Updating template '${hostname}/${templateId}'`,
				`Template '${hostname}/${templateId}' updated`,
			);
		}
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
		contentTest?: string,
	) {
		this.logServerMessage(`Getting site script '${hostname}/${scriptId}'...`);
		let siteScripts = await this.dsSiteScripts.retrieve({
			whereClause: `[HostName] = '${hostname}' AND [Name] = '${scriptId}'`,
			maxRecords: 1,
		});

		let updates: any = {};
		if (content !== undefined) {
			updates.ScriptContent = content;
		}

		if (contentTest !== undefined) {
			updates.ScriptContentTest = contentTest;
		}

		if (siteScripts.length === 0) {
			await this.logAsyncTask(
				this.dsSiteScripts.create({
					HostName: hostname,
					Name: scriptId,
					...updates,
				}),
				`Site script '${hostname}/${scriptId}' not found. Creating..`,
				`Site script '${hostname}/${scriptId}' created`,
			);
		} else {
			await this.logAsyncTask(
				this.dsSiteScripts.update({
					PrimKey: siteScripts[0].PrimKey,
					...updates,
				}),
				`Updating site script '${hostname}/${scriptId}'`,
				`Site script '${hostname}/${scriptId}' updated`,
			);
		}
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
		contentTest?: string,
	) {
		let siteStyle = await this.logAsyncTask(
			this.dsSiteStyles.retrieve({
				whereClause: `[HostName] = '${hostname}' AND [Name] = '${styleId}'`,
				maxRecords: 1,
			}),
			`Getting site style '${hostname}/${styleId}'`,
		);

		let updates: any = {};
		if (content !== undefined) {
			updates.StyleContent = content;
		}

		if (contentTest !== undefined) {
			updates.StyleContentTest = contentTest;
		}

		if (siteStyle.length === 0) {
			await this.logAsyncTask(
				this.dsSiteStyles.create({
					HostName: hostname,
					Name: styleId,
					...updates,
				}),
				`Creating site style '${hostname}/${styleId}'`,
				`Site style '${hostname}/${styleId}' created`,
			);
		} else {
			await this.logAsyncTask(
				this.dsSiteStyles.update({
					PrimKey: siteStyle[0].PrimKey,
					...updates,
				}),
				`Updating site style '${hostname}/${styleId}'`,
				`Site style '${hostname}/${styleId}' updated`,
			);
		}
	}

	/**
	 * Copy data objects and fields for an article from dev server.
	 * This is used to enable running Vite dev environments against the
	 * stage server. Instead of publishing the article to update data objects
	 * on stage, we can copy the data objects and fields from the dev server
	 * directly.
	 *
	 * @param {string} hostname
	 * @param {string} articleId
	 */
	async copyDatasourcesFromDev(hostname: string, articleId: string) {
		await this.logAsyncTask(
			this.procCopyDataSourcesFromDev.execute({
				Hostname: hostname,
				ArticleId: articleId,
			}),
			`Copying data sources from dev for '${hostname}/${articleId}'`,
			`Data sources for '${hostname}/${articleId}' copied from dev`,
		);
	}

	fetch(url: string | RequestInit, init?: RequestInit) {
		return this.client.fetch(url, init);
	}
}
