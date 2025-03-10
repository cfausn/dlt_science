import { Client, AccountId } from '@hashgraph/sdk'

// Hedera Testnet network configuration
export const HEDERA_NETWORK = {
  chainId: '0x128',
  chainName: 'Hedera Testnet',
  nativeCurrency: {
    name: 'HBAR',
    symbol: 'HBAR',
    decimals: 18
  },
  rpcUrls: ['https://testnet.hashio.io/api'],
  blockExplorerUrls: ['https://hashscan.io/testnet'],
  mirrorNode: 'https://testnet.mirrornode.hedera.com'
}

// Token IDs
export const USDC_TOKEN_ID = '0.0.2276691' // Testnet USDC token ID

// Helper function for logging in development only
const log = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

// Get a client for Hedera testnet
export const getTestnetClient = () => {
  // Create a client for Hedera Testnet
  const client = Client.forTestnet();
  
  // For development/testing, we can set up a default operator account
  // This allows for certain operations that don't require user signature
  // but we'll override this with the user's account for transactions
  if (import.meta.env.DEV) {
    try {
      // Set an operator with an account ID that has a private key in DER 
      // format to sign transactions that require an operator signature
      // For demo purposes only - this should be your own testnet account
      const operatorId = AccountId.fromString('0.0.3');
      // This would typically come from environment variables
      // NOT using a real private key here - this is just a placeholder
      const operatorKey = 'NOT_A_REAL_KEY';
      
      if (operatorKey !== 'NOT_A_REAL_KEY') {
        client.setOperator(operatorId, operatorKey);
      }
    } catch (error) {
      console.warn('Failed to set operator on Hedera client:', error);
    }
  }
  
  return client;
}

// Convert Ethereum address to Hedera Account ID
export const ethereumAddressToAccountId = async (ethereumAddress: string): Promise<AccountId> => {
  // Remove '0x' prefix if present and ensure lowercase
  const cleanAddress = ethereumAddress.toLowerCase().replace('0x', '')
  
  try {
    // Query the mirror node to get the account info
    const response = await fetch(
      `${HEDERA_NETWORK.mirrorNode}/api/v1/accounts/${cleanAddress}`
    )
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Mirror node error:', errorData)
      throw new Error(`Failed to fetch account from mirror node: ${response.status}`)
    }

    const data = await response.json()
    log('Mirror node response:', data)
    
    // Check if we got an account back
    if (!data.account) {
      throw new Error('No Hedera account found for this Ethereum address')
    }

    // Use the account ID directly
    return AccountId.fromString(data.account)
  } catch (error) {
    console.error('Error converting Ethereum address:', error)
    throw error
  }
}

// Format AccountId to string
export const formatAccountId = (accountId: AccountId): string => {
  return accountId.toString()
}

// Format HBAR balance from tinybars to HBAR
export const formatHbarBalance = (tinybarBalance: number): string => {
  return (tinybarBalance / 100_000_000).toFixed(4)
}

// Create an explorer link for a transaction
export const getTransactionExplorerLink = (transactionId: string): string => {
  // For testnet transactions, use HashScan testnet explorer
  return `${HEDERA_NETWORK.blockExplorerUrls[0]}/transaction/${transactionId}`;
} 