import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  Client,
  AccountId,
  TransferTransaction,
  Hbar,
  TokenId,
  AccountBalanceQuery,
  AccountInfoQuery,
  TransactionId
} from '@hashgraph/sdk'
import { ethers } from 'ethers'
import { 
  ethereumAddressToAccountId, 
  getTestnetClient, 
  HEDERA_NETWORK,
  USDC_TOKEN_ID
} from '../utils/hedera'
import useMetaMask from './useMetaMask'

// Constants
const POLLING_INTERVAL = 5000 // 5 seconds (reduced from 10 seconds)

interface HederaState {
  isInitialized: boolean
  error: string | null
  hbarBalance: string
  usdcBalance: string
}

// Helper function for logging in development only
const log = (message: string, data?: any) => {
  if (import.meta.env.DEV && message.startsWith('🚨')) { // Only log critical messages
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

export const useHederaState = () => {
  const [state, setState] = useState<HederaState>({
    isInitialized: false,
    error: null,
    hbarBalance: '0',
    usdcBalance: '0',
  });

  const { isConnected, account, chainId, isInitializing } = useMetaMask();
  const pollingInterval = useRef<number | null>(null);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceInitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const client = useMemo(() => getTestnetClient(), []);
  const hasInitializedRef = useRef(false);
  const previousAccountRef = useRef<string | null>(null);

  // Fetch account balances
  const fetchBalances = useCallback(async () => {
    if (!account || !isConnected || !client) {
      return;
    }

    try {
      const accountId = await ethereumAddressToAccountId(account);
      
      // Query the mirror node for the account info
      const response = await fetch(
        `${HEDERA_NETWORK.mirrorNode}/api/v1/accounts/${accountId.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch account balance');
      }

      const data = await response.json();

      // Get balance from the nested balance object
      const hbarBalance = (Number(data.balance.balance) / 100_000_000).toString();
      
      // Get USDC balance from token list if it exists
      const usdcBalance = data.balance.tokens
        ?.find((token: any) => token.token_id === USDC_TOKEN_ID)
        ?.balance.toString() || '0';

      // Create a new state object - don't merge with existing state
      const newState = {
        isInitialized: true,
        hbarBalance,
        usdcBalance,
        error: null,
      };
      
      // Set the state in a single update
      setState(newState);
      
      // Mark as initialized
      hasInitializedRef.current = true;
      
      return true;
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch balances',
      }));
      return false;
    }
  }, [account, isConnected, client, chainId]);

  // Force initialization directly - can be called from components
  const forceInitialize = useCallback(() => {
    if (isConnected && account) {
      // Set initialized state directly - don't merge with existing state
      setState({
        isInitialized: true,
        error: null,
        hbarBalance: state.hbarBalance,
        usdcBalance: state.usdcBalance
      });
      
      // Mark as initialized
      hasInitializedRef.current = true;
      
      // Fetch balances
      fetchBalances();
    }
  }, [isConnected, account, fetchBalances, state.hbarBalance, state.usdcBalance]);

  // Reset initialization state when account changes
  useEffect(() => {
    if (account !== previousAccountRef.current) {
      // Reset initialization state
      hasInitializedRef.current = false;
      setState(prev => ({
        ...prev,
        isInitialized: false,
        error: null,
        hbarBalance: '0',
        usdcBalance: '0',
      }));
      
      // Update previous account reference
      previousAccountRef.current = account;
      
      // If connected with a new account, initialize Hedera
      if (isConnected && account && !isInitializing) {
        initializeHedera();
      }
    }
  }, [account, isConnected, isInitializing]);

  // Skip initialization if MetaMask is still initializing
  useEffect(() => {
    if (isInitializing) {
      return;
    }

    if (isConnected && account && !hasInitializedRef.current) {
      initializeHedera();
    }
  }, [isInitializing, isConnected, account]);

  // Start/stop balance polling based on connection state

  // Get provider for MetaMask
  const getProvider = useCallback(() => {
    if (!window.ethereum) return null;
    return new ethers.providers.Web3Provider(window.ethereum as any);
  }, []);

  // Force initialization to complete after timeout
  const forceInitialization = useCallback(() => {
    log('⚠️ Forcing initialization to complete due to timeout');
    setState(prev => ({ 
      ...prev, 
      isInitialized: true,
      error: 'Network switching timed out, but you can still use the app. Some features may be limited.'
    }));
    
    // Clear the timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    // Attempt to fetch balances
    fetchBalances();
    
    // Mark as initialized
    hasInitializedRef.current = true;
  }, [fetchBalances]);

  // Initialize Hedera client
  const initializeHedera = useCallback(async () => {
    // Clear any existing timeouts
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    if (forceInitTimeoutRef.current) {
      clearTimeout(forceInitTimeoutRef.current);
      forceInitTimeoutRef.current = null;
    }

    if (!isConnected || !account) {
      // Handle disconnection
      hasInitializedRef.current = false;
      setState({
        isInitialized: false,
        error: null,
        hbarBalance: '0',
        usdcBalance: '0',
      });
      return;
    }

    // If already on Hedera network, fetch balances and set initialized
    if (chainId === HEDERA_NETWORK.chainId) {
      // Explicitly set isInitialized to false first to trigger UI updates
      setState(prev => ({
        ...prev,
        isInitialized: false,
      }));
      
      // Fetch balances which will set isInitialized to true when complete
      await fetchBalances();
      
      // Mark as initialized
      hasInitializedRef.current = true;
      
      return;
    }

    // If not on Hedera network, prompt to switch networks
    setState(prev => ({
      ...prev,
      error: `Please switch to Hedera network (Chain ID: ${HEDERA_NETWORK.chainId})`,
    }));

    // Set a timeout to force initialization after a delay even if network switch fails
    // This is a fallback in case the user ignores the network switch prompt
    forceInitTimeoutRef.current = setTimeout(() => {
      forceInitialization();
    }, 3000);
  }, [fetchBalances, isConnected, account, chainId, HEDERA_NETWORK.chainId]);

  // Helper function to create a human-readable message for signing
  const createSignableMessage = (transactionData: any): Uint8Array => {
    // Create a JSON representation of the transaction that's human-readable
    const messageObject = {
      ...transactionData,
      timestamp: new Date().toISOString(),
      notice: "This transaction will be executed on the Hedera testnet for demonstration purposes."
    };
    
    // Convert to string and then to bytes
    const messageString = JSON.stringify(messageObject, null, 2);
    return ethers.utils.toUtf8Bytes(messageString);
  };
  
  // Create a type for our simulated transaction response
  interface SimulatedTransactionResponse {
    getReceipt(): Promise<any>;
    transactionId: {
      toString(): string;
    };
  }

  // For testnet demo purposes only - allows us to simulate transaction execution
  // In a production environment, this would be handled by a server-side component
  const simulateTestnetTransaction = async (
    fromAccountId: AccountId,
    toAccountId: AccountId,
    amount: number | string,
    isToken: boolean = false,
    tokenId?: string
  ): Promise<SimulatedTransactionResponse> => {
    // Create a dummy transaction ID for display purposes
    const timestamp = Date.now() * 1000000;
    const nonce = Math.floor(Math.random() * 10000);
    const simulatedTxId = `${fromAccountId.toString()}@${timestamp}.${nonce}`;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Refresh balances to simulate the transaction effect
    await fetchBalances();
    
    // Return a simulated transaction response
    return {
      getReceipt: async () => ({ status: "SUCCESS" }),
      transactionId: {
        toString: () => simulatedTxId
      }
    };
  };

  // Send HBAR to another account
  const sendHbar = useCallback(
    async (
      toAddress: string,
      amount: number
    ): Promise<any> => {
      if (!account) {
        throw new Error('Wallet not connected');
      }

      if (!client) {
        throw new Error('Hedera client not initialized');
      }

      const provider = getProvider();
      if (!provider) {
        throw new Error('Provider not available');
      }

      try {
        const fromAccountId = await ethereumAddressToAccountId(account);
        const toAccountId = AccountId.fromString(toAddress);

        // Create a more descriptive memo
        const memo = `Send ${amount} HBAR to ${toAddress}`;
        
        // Create a human-readable transaction summary for approval
        const transactionData = {
          type: 'HBAR Transfer (Testnet)',
          description: 'Transaction Preview',
          from: fromAccountId.toString(),
          to: toAccountId.toString(),
          amount: `${amount} HBAR`,
          memo: memo,
          important: 'This is a testnet demo transaction and will be simulated.'
        };
        
        // Get user approval with a readable message
        const messageToSign = createSignableMessage(transactionData);
        await provider.getSigner().signMessage(messageToSign);
        
        // For testnet demo purposes, simulate the transaction
        // In a production environment, this would interact with a server-side signing service
        const response = await simulateTestnetTransaction(
          fromAccountId,
          toAccountId,
          amount
        );

        return response.transactionId;
      } catch (error) {
        console.error('Failed to send HBAR:', error);
        throw error;
      }
    },
    [account, client, fetchBalances, getProvider]
  );

  // Send tokens (e.g., USDC) to another account
  const sendToken = useCallback(
    async (
      toAddress: string,
      amount: number,
      tokenId: string = USDC_TOKEN_ID
    ): Promise<any> => {
      if (!account) {
        throw new Error('Wallet not connected');
      }

      if (!client) {
        throw new Error('Hedera client not initialized');
      }

      const provider = getProvider();
      if (!provider) {
        throw new Error('Provider not available');
      }

      try {
        const fromAccountId = await ethereumAddressToAccountId(account);
        const toAccountId = AccountId.fromString(toAddress);
        const token = TokenId.fromString(tokenId);

        // Create a readable token name - simple mapping for known tokens
        let tokenName = "Token";
        if (tokenId === USDC_TOKEN_ID) {
          tokenName = "USDC";
        }

        // Create a more descriptive memo
        const memo = `Send ${amount} ${tokenName} to ${toAddress}`;
        
        // Create a human-readable transaction summary for approval
        const transactionData = {
          type: `${tokenName} Transfer (Testnet)`,
          description: 'Transaction Preview',
          from: fromAccountId.toString(),
          to: toAccountId.toString(),
          tokenId: tokenId,
          amount: `${amount} ${tokenName}`,
          memo: memo,
          important: 'This is a testnet demo transaction and will be simulated.'
        };
        
        // Get user approval with a readable message
        const messageToSign = createSignableMessage(transactionData);
        await provider.getSigner().signMessage(messageToSign);
        
        // For testnet demo purposes, simulate the transaction
        // In a production environment, this would interact with a server-side signing service
        const response = await simulateTestnetTransaction(
          fromAccountId,
          toAccountId,
          amount,
          true,
          tokenId
        );

        return response.transactionId;
      } catch (error) {
        console.error('Failed to send token:', error);
        throw error;
      }
    },
    [account, client, fetchBalances, getProvider]
  );

  // Return the state and methods
  return {
    isInitialized: state.isInitialized,
    error: state.error,
    hbarBalance: state.hbarBalance,
    usdcBalance: state.usdcBalance,
    sendHbar,
    sendToken,
    forceInitialize
  }
}

export default useHederaState 