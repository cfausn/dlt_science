/**
 * Generates a link to view a transaction on HashScan explorer
 * @param transactionId - The transaction ID
 * @returns The URL to view the transaction on HashScan
 */
export const getTransactionExplorerLink = (transactionId: string): string => {
  // Format for testnet
  return `https://hashscan.io/testnet/transaction/${transactionId}`;
}; 