import { dsTransactions } from "../data";

/**
 * Checks that there are no transactions with a different name than `name` that matches `filter`.
 * Log transactions (type = 98) are not counted. If there are other transactions, an error is thrown.
 *
 * @param {string} filter - Filter to use on transactions
 * @param {string} name - Name of the expected transaction.
 */
export async function checkOnlyOneTransaction(filter, name) {
  console.log("Getting transactions...");

  dsTransactions.setParameter("whereClause", filter);
  await dsTransactions.refreshDataSource();

  let transactions = dsTransactions.getDataLength();

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
