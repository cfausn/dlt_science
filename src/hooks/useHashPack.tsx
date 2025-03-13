import { useState, useEffect, useCallback } from 'react';
import { HashConnect, HashConnectConnectionState } from 'hashconnect';
import { useToast, Box, Text, Link } from '@chakra-ui/react';
import { LedgerId, TransferTransaction, Hbar, AccountId, TokenId, TokenAssociateTransaction } from '@hashgraph/sdk';
import { ExternalLinkIcon } from '@chakra-ui/icons';

// Constants for the Widget
const GITHUB_PAGES_URL = "https://cfausn.github.io/dlt_science";

// HashConnect App metadata - NEVER CHANGE THIS URL
const appMetadata = {
  name: "Hedera Widget",
  description: "A donation widget for Hedera",
  icons: ["https://www.hashpack.app/img/favicon.png"],
  url: GITHUB_PAGES_URL // Use our GitHub Pages URL consistently
};

// WalletConnect project ID - from the docs
const PROJECT_ID = "f6a3801a25e49f0f2d8b589a5c3c42b0";

// USDC Token ID on Hedera Testnet
const USDC_TOKEN_ID = "0.0.5680205";

// Create a singleton instance outside the component for persistence
let hashconnect: HashConnect | null = null;
// The state variable has been removed as it's not currently used

// Debug logger for tracking connections
const debugConnection = (message: string, data?: any) => {
  console.log(`[HashConnect Debug] ${message}`, data || '');
};

// Token interfaces
export interface TokenBalance {
  tokenId: string;
  balance: number;
  symbol: string;
  decimals: number;
}

export interface TokenInfo {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const useHashPack = () => {
  const toast = useToast();
  
  // Connection state
  const [availableExtension, setAvailableExtension] = useState<boolean>(false);
  const [connectionState, setConnectionState] = useState<HashConnectConnectionState>(HashConnectConnectionState.Disconnected);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  
  // Token balances
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  
  // HashConnect specific data - pairingData variable removed as it's not currently used
  
  // Get USDC balance from token balances
  useEffect(() => {
    if (tokenBalances.length > 0) {
      const usdc = tokenBalances.find(token => token.tokenId === USDC_TOKEN_ID);
      if (usdc) {
        setUsdcBalance(usdc.balance);
      }
    }
  }, [tokenBalances]);
  
  // Fetch account balance from Hedera Mirror Node
  const fetchAccountBalance = useCallback(async (accountIdToFetch: string) => {
    setLoadingBalance(true);
    
    try {
      // Fetch HBAR balance
      const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountIdToFetch}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account info: ${response.statusText}`);
      }
      
      const accountData = await response.json();
      const balanceInTinybars = accountData.balance.balance || 0;
      const balanceInHbar = balanceInTinybars / 100000000;
      
      setAccountBalance(balanceInHbar);
      
      // Fetch token balances
      const tokenResponse = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountIdToFetch}/tokens`);
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        debugConnection("Token data received", tokenData);
        
        if (tokenData && tokenData.tokens) {
          const tokens: TokenBalance[] = [];
          
          // Process each token balance
          for (const token of tokenData.tokens) {
            try {
              // Get additional token info (symbol, name, decimals)
              const tokenInfoResponse = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/tokens/${token.token_id}`);
              if (tokenInfoResponse.ok) {
                const tokenInfo = await tokenInfoResponse.json();
                
                // Add to token balances
                tokens.push({
                  tokenId: token.token_id,
                  balance: token.balance / Math.pow(10, tokenInfo.decimals || 8),
                  symbol: tokenInfo.symbol || "UNKNOWN",
                  decimals: tokenInfo.decimals || 8
                });
                
                // Special handling for USDC
                if (token.token_id === USDC_TOKEN_ID) {
                  setUsdcBalance(token.balance / Math.pow(10, tokenInfo.decimals || 6));
                }
              }
            } catch (tokenError) {
              console.error(`Error fetching info for token ${token.token_id}:`, tokenError);
            }
          }
          
          setTokenBalances(tokens);
          debugConnection("Processed token balances", tokens);
        }
      }
    } catch (error) {
      console.error('Error fetching account balance:', error);
      toast({
        title: 'Balance Fetch Error',
        description: 'Could not retrieve your current balance. Please try again later.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingBalance(false);
    }
  }, [toast]);
  
  // Set up HashConnect events
  const setupHashConnectEvents = useCallback(() => {
    if (!hashconnect) return;
    
    // Pairing event
    hashconnect.pairingEvent.on((newPairing) => {
      debugConnection("Pairing event received", newPairing);
      
      // Save complete pairing data
      // setPairingData(newPairing);
      
      if (newPairing.accountIds && newPairing.accountIds.length > 0) {
        const connectedAccount = newPairing.accountIds[0];
        setAccountId(connectedAccount);
        setConnectionState(HashConnectConnectionState.Paired);
        
        fetchAccountBalance(connectedAccount);
        debugConnection("Account connected", connectedAccount);
      }
    });
    
    // Disconnection event
    hashconnect.disconnectionEvent.on((data) => {
      debugConnection("Disconnection event received", data);
      // setPairingData(null);
      setAccountId(null);
      setAccountBalance(null);
      setConnectionState(HashConnectConnectionState.Disconnected);
    });
    
    // Connection status change event
    hashconnect.connectionStatusChangeEvent.on((connectionStatus) => {
      debugConnection("Connection status change", connectionStatus);
      setConnectionState(connectionStatus);
    });
  }, [fetchAccountBalance]);
  
  // Initialize HashConnect
  useEffect(() => {
    const initHashConnect = async () => {
      try {
        debugConnection("Initializing HashConnect...");
        
        // Create a fresh instance with more robust initialization
        if (!hashconnect) {
          console.log("Creating new HashConnect instance with metadata:", {...appMetadata});
          
          // Create our custom metadata object that enforces our GitHub Pages URL
          const metadataWithEnforcedUrl = {
            ...appMetadata,
            url: GITHUB_PAGES_URL  // Ensure URL is always our GitHub Pages URL
          };
          
          try {
            // Create the HashConnect instance with our fixed URL metadata
            hashconnect = new HashConnect(LedgerId.TESTNET, PROJECT_ID, metadataWithEnforcedUrl, true);
            console.log("HashConnect constructor completed successfully");
            
            // Use type assertion to log the metadata
            const hashconnectAny = hashconnect as any;
            if (hashconnectAny && hashconnectAny.metadata) {
              console.log("Final metadata being used:", hashconnectAny.metadata);
            }
          } catch (initError) {
            console.error("Error in HashConnect constructor:", initError);
            throw initError;
          }
          debugConnection("Created HashConnect instance", {methods: Object.keys(hashconnect)});
        }
        
        // Setup events before initialization
        setupHashConnectEvents();
        
        // Initialize HashConnect with debugging
        let initData: any;
        try {
          console.log("About to call hashconnect.init()");
          initData = await hashconnect.init();
          console.log("HashConnect init() completed successfully");
          
          // Log the final state after initialization
          const hashconnectAny = hashconnect as any;
          if (hashconnectAny && hashconnectAny.metadata) {
            console.log("Post-init metadata:", hashconnectAny.metadata);
          }
        } catch (initError) {
          console.error("Error in hashconnect.init():", initError);
          throw initError;
        }
        
        debugConnection("HashConnect initialized with data", initData);
        
        // Save init data
        if (initData && initData.savedPairings && initData.savedPairings.length > 0) {
          const pairing = initData.savedPairings[0];
          debugConnection("Found saved pairing", pairing);
          
          if (pairing.accountIds && pairing.accountIds.length > 0) {
            const accountToSet = pairing.accountIds[0];
            setAccountId(accountToSet);
            setConnectionState(HashConnectConnectionState.Paired);
            fetchAccountBalance(accountToSet);
            debugConnection("Auto-connected with saved account", accountToSet);
          }
        }
        
        setAvailableExtension(true);
        setInitializationError(null);
      } catch (error) {
        console.error("HashConnect initialization error:", error);
        setInitializationError("Failed to initialize HashConnect");
        setConnectionState(HashConnectConnectionState.Disconnected);
      }
    };
    
    initHashConnect();
    
    // Cleanup on unmount
    return () => {
      // Any cleanup code here
    };
  }, [setupHashConnectEvents, fetchAccountBalance]);
  
  // Poll for balance updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const refreshBalances = () => {
      if (connectionState === HashConnectConnectionState.Paired && accountId) {
        debugConnection("Auto-refreshing balances");
        fetchAccountBalance(accountId);
      }
    };

    // Start polling when connected
    if (connectionState === HashConnectConnectionState.Paired && accountId) {
      // Initial fetch
      fetchAccountBalance(accountId);
      
      // Set up interval for regular updates (every 1 second)
      intervalId = setInterval(refreshBalances, 1000);
      debugConnection("Started balance auto-refresh");
    }

    // Clean up interval when connection state changes or component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        debugConnection("Stopped balance auto-refresh");
      }
    };
  }, [connectionState, accountId, fetchAccountBalance]);
  
  // Connect to HashPack wallet
  const connect = useCallback(async () => {
    if (!hashconnect) {
      debugConnection("HashConnect not initialized for connect");
      setInitializationError("HashConnect not initialized");
      return;
    }
    
    try {
      debugConnection("Opening HashPack connection modal...");
      console.log("HashConnect instance:", hashconnect);
      console.log("HashConnect methods available:", Object.keys(hashconnect));
      const hashconnectAny = hashconnect as any;
      if (hashconnectAny && hashconnectAny.metadata) {
        console.log("App metadata being used:", hashconnectAny.metadata);
      } else {
        console.log("App metadata being used:", appMetadata);
      }
      
      setConnectionState(HashConnectConnectionState.Connecting);
      
      // Check if HashPack is installed
      const isExtensionInstalled = await detectHashPackExtension();
      if (!isExtensionInstalled) {
        debugConnection("HashPack extension not detected");
        throw new Error("HashPack extension not detected");
      }
      
      // Open the pairing modal with additional logging
      try {
        hashconnect.openPairingModal();
        debugConnection("Pairing modal opened successfully");
      } catch (modalError) {
        console.error("Error opening pairing modal:", modalError);
        
        // Try to check if hashpack is available in window
        if ('hashconnect' in window) {
          console.log("Global HashConnect object is available, but modal failed to open");
        }
        
        // Re-throw to be caught by outer catch block
        throw modalError;
      }
    } catch (error) {
      console.error("Error connecting to HashPack:", error);
      setConnectionState(HashConnectConnectionState.Disconnected);
      
      // Show a user-friendly error message
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to HashPack. Is the extension installed?',
        status: 'error',
        duration: 5000,
        isClosable: true,
        render: () => (
          <Box p={3} bg="red.600" color="white" borderRadius="md">
            <Text fontWeight="bold">Connection Failed</Text>
            <Text mt={2}>Could not connect to HashPack wallet. Please make sure:</Text>
            <Text mt={1} fontSize="sm">• HashPack extension is installed</Text>
            <Text fontSize="sm">• You're using a supported browser (Chrome, Brave)</Text>
            <Link 
              href="https://www.hashpack.app/download" 
              isExternal 
              color="white" 
              textDecoration="underline"
              mt={2}
              display="block"
            >
              Install HashPack <ExternalLinkIcon mx="2px" />
            </Link>
          </Box>
        ),
      });
    }
  }, [toast]);
  
  // Helper function to detect if HashPack extension is installed
  const detectHashPackExtension = async (): Promise<boolean> => {
    // Check if the hashconnect global object exists
    if ('hashconnect' in window) {
      console.log("HashPack extension detected via global object");
      return true;
    }
    
    // Check if we can send a message to the extension
    try {
      // Create an event that hashpack might respond to
      const event = new CustomEvent('hashpack-detect', {
        detail: { ping: true }
      });
      window.dispatchEvent(event);
      
      // Wait a short time to see if hashpack responds
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // If we got this far without error, assume it's not installed
      return false;
    } catch (error) {
      console.error("Error detecting HashPack:", error);
      return false;
    }
  };
  
  // Disconnect from HashPack
  const disconnect = useCallback(async () => {
    if (!hashconnect) {
      debugConnection("Nothing to disconnect from");
      setConnectionState(HashConnectConnectionState.Disconnected);
      setAccountId(null);
      return;
    }
    
    try {
      debugConnection("Disconnecting from HashPack...");
      await hashconnect.disconnect();
      debugConnection("Disconnect completed");
      
      // Clear state
      // setPairingData(null);
      setAccountId(null);
      setAccountBalance(null);
      setConnectionState(HashConnectConnectionState.Disconnected);
    } catch (error) {
      console.error("Error disconnecting:", error);
      debugConnection("Error during disconnect", error);
    }
  }, []);
  
  // Execute a transaction using the getSigner approach from the docs
  const executeTransaction = useCallback(async (receiverId: string, amount: number, tokenId?: string) => {
    if (!hashconnect) {
      throw new Error('HashConnect not initialized');
    }
    
    if (!accountId) {
      throw new Error('No account connected');
    }
    
    try {
      setTransactionInProgress(true);
      
      // Log different messages based on token type
      if (tokenId) {
        debugConnection(`Creating transaction to send ${amount} ${tokenId} tokens from ${accountId} to ${receiverId}`);
      } else {
        debugConnection(`Creating transaction to send ${amount} HBAR from ${accountId} to ${receiverId}`);
      }
      
      try {
        // Convert string accountId to AccountId object for getSigner
        const fromAccountId = AccountId.fromString(accountId);
        const toAccountId = AccountId.fromString(receiverId);
        
        debugConnection("Creating transfer with accounts", {
          from: fromAccountId.toString(),
          to: toAccountId.toString(),
          amount: amount,
          tokenId: tokenId || "HBAR"
        });
        
        // Cast both the AccountId and the getSigner call to any to bypass type checking
        const signer = (hashconnect as any).getSigner(accountId);
        debugConnection("Got signer for account", accountId);
        
        // Create transaction based on token type
        let transaction;
        
        if (tokenId) {
          // Token transfer transaction
          const tokenIdObj = TokenId.fromString(tokenId);
          
          // Find token info to get decimals
          const tokenInfo = tokenBalances.find(t => t.tokenId === tokenId);
          let tokenDecimals = tokenInfo?.decimals || 8;
          
          // For the new USDC token, use 8 decimals like other tokens
          let rawAmount;
          if (tokenId === "0.0.5680205") { // New USDC token ID
            // Convert with 8 decimal places
            rawAmount = Math.round(amount * Math.pow(10, 8));
            debugConnection("USDC token with 8 decimals", {
              input: amount,
              decimals: 8,
              rawAmount: rawAmount
            });
          } else {
            // For other tokens, apply normal decimal conversion
            rawAmount = Math.round(amount * Math.pow(10, tokenDecimals));
            debugConnection("Standard token handling with decimals", {
              input: amount,
              decimals: tokenDecimals,
              rawAmount: rawAmount
            });
          }
          
          // Create the token transfer transaction with the raw amount
          transaction = new TransferTransaction()
            .addTokenTransfer(tokenIdObj, fromAccountId, -rawAmount)
            .addTokenTransfer(tokenIdObj, toAccountId, rawAmount)
            .setTransactionMemo(`Token Donation via Hedera Widget`);
          
          debugConnection("Token transfer transaction created", {
            tokenId: tokenIdObj.toString(),
            rawAmount: rawAmount,
            inputAmount: amount
          });
        } else {
          // HBAR transfer transaction is already handled in tinybars by the Hbar class
          // Hbar class automatically handles the conversion from HBAR to tinybars
          // 1 HBAR = 100,000,000 tinybars (8 decimal places)
          debugConnection("Creating HBAR transfer", {
            humanReadableAmount: amount,
            hbarClass: "Will automatically convert to tinybars"
          });
          
          // For HBAR transactions, the Hbar class automatically handles the conversion
          // and supports decimal values like 0.5 HBAR
          transaction = new TransferTransaction()
            .addHbarTransfer(fromAccountId, new Hbar(-amount))
            .addHbarTransfer(toAccountId, new Hbar(amount))
            .setTransactionMemo(`HBAR Donation via Hedera Widget`);
          
          debugConnection("HBAR transfer transaction created", {
            amount: amount,
            displayAmount: `${amount} HBAR`
          });
        }
        
        debugConnection("Transaction built", transaction);
        
        // Show a message to check the wallet
        toast({
          title: "Check Your Wallet",
          description: "Please check HashPack to approve the transaction",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
        
        // Perform the transaction with type assertions
        try {
          // First try the signer.execute approach
          debugConnection(`Attempting transaction with signer for ${tokenId ? 'token' : 'HBAR'}`);
          
          // Freeze the transaction with type assertion
          const frozen = await (transaction as any).freezeWithSigner(signer);
          debugConnection("Transaction frozen successfully");
          
          // Execute the transaction with type assertion
          const response = await (frozen as any).executeWithSigner(signer);
          debugConnection("Transaction executed successfully", response);
          
          // Extract transaction ID early, before any potential post-transaction errors
          let txId = '';
          try {
            txId = response.transactionId.toString();
          } catch (txIdError) {
            debugConnection("Error extracting transaction ID, using fallback", txIdError);
            txId = `manual-tx-${Date.now()}`;
          }
          
          debugConnection(`${tokenId ? 'Token' : 'HBAR'} transaction completed with ID: ${txId}`);
          
          // Handle post-transaction operations in a try-catch to prevent errors from affecting the result
          try {
            // Update balance after transaction
            setTimeout(() => {
              fetchAccountBalance(accountId);
            }, 3000);
          } catch (postTxError) {
            // Log but don't throw post-transaction errors
            debugConnection("Non-critical post-transaction error", postTxError);
          }
          
          // Return the transaction ID even if post-transaction operations fail
          return txId;
        } catch (signerError) {
          debugConnection(`Error with ${tokenId ? 'token' : 'HBAR'} signer approach`, signerError);
          throw signerError;
        }
      } catch (error: any) {
        debugConnection("Error with transaction", error);
        
        toast({
          title: "Transaction Issue",
          description: `Could not complete the transaction: ${error.message || 'Unknown error'}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        
        throw new Error(`Transaction failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      debugConnection("Transaction error", error);
      throw error;
    } finally {
      setTransactionInProgress(false);
    }
  }, [hashconnect, accountId, fetchAccountBalance, toast]);
  
  // Associate a token to the user's account
  const associateToken = useCallback(async (tokenId: string) => {
    if (!hashconnect || !accountId) {
      throw new Error('Not connected to HashPack');
    }
    
    try {
      setTransactionInProgress(true);
      debugConnection(`Creating token association for ${tokenId} with account ${accountId}`);
      
      // Convert string accountId to AccountId object
      const accountIdObj = AccountId.fromString(accountId);
      const tokenIdObj = TokenId.fromString(tokenId);
      
      // Cast both the AccountId and the getSigner call to any to bypass type checking
      const signer = (hashconnect as any).getSigner(accountId);
      debugConnection("Got signer for account", accountId);
      
      // Create association transaction
      const transaction = new TokenAssociateTransaction()
        .setAccountId(accountIdObj)
        .setTokenIds([tokenIdObj]);
      
      debugConnection("Association transaction built", transaction);
      
      // Show a message to check the wallet
      toast({
        title: "Check Your Wallet",
        description: "Please check HashPack to approve the token association",
        status: "info",
        duration: 5000,
        isClosable: true,
      });
      
      // Freeze and execute
      const frozen = await (transaction as any).freezeWithSigner(signer);
      const response = await (frozen as any).executeWithSigner(signer);
      
      debugConnection("Association transaction executed", response);
      
      // Show success message
      toast({
        title: "Token Associated",
        description: `Successfully associated token ${tokenId} with your account`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Update balance after transaction
      setTimeout(() => {
        fetchAccountBalance(accountId);
      }, 3000);
      
      return response.transactionId.toString();
    } catch (error: any) {
      debugConnection("Error associating token", error);
      
      toast({
        title: "Association Failed",
        description: `Could not associate token: ${error.message || 'Unknown error'}`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      throw error;
    } finally {
      setTransactionInProgress(false);
    }
  }, [hashconnect, accountId, fetchAccountBalance, toast]);
  
  return {
    connect,
    disconnect,
    connectionState: connectionState.toString(),
    accountId,
    accountBalance,
    usdcBalance,
    tokenBalances,
    availableExtension,
    initializationError,
    loadingBalance,
    executeTransaction,
    associateToken,
    transactionInProgress,
  };
}; 