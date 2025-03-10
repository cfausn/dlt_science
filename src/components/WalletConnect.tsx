import React, { useEffect, useRef } from 'react';
import {
  Button,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  Box,
  Spinner,
  Link,
  useToast,
  ButtonGroup,
  Flex,
  Tooltip,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { useHashPack } from '../hooks/useHashPack';
import { ExternalLinkIcon, RepeatIcon } from '@chakra-ui/icons';
import { HashConnectConnectionState } from 'hashconnect';

// Debug logger for wallet connection
const logConnection = (message: string, data?: any) => {
  console.log(`[WalletConnect] ${message}`, data || '');
};

// Add a helper function for number formatting
const formatBalance = (balance: number | null, isUSDC: boolean): string => {
  if (balance === null) return '0.00';
  
  // For USDC, use 2 decimal places and add commas
  if (isUSDC) {
    return balance.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  }
  
  // For HBAR, keep 4 decimal places
  return balance.toFixed(4);
};

export const WalletConnect: React.FC = () => {
  const toast = useToast();
  const hasShownConnectedToast = useRef(false);
  const hasShownDisconnectToast = useRef(false);
  const previousConnectionState = useRef<string | null>(null);
  
  const {
    connect,
    disconnect,
    connectionState,
    accountId,
    accountBalance,
    usdcBalance,
    availableExtension,
    initializationError,
    loadingBalance
  } = useHashPack();

  const isConnected = connectionState === HashConnectConnectionState.Connected.toString() || connectionState === HashConnectConnectionState.Paired.toString();
  const isConnecting = connectionState === HashConnectConnectionState.Connecting.toString();

  // Track connection state changes and show appropriate notifications
  useEffect(() => {
    // Skip on the first render
    if (previousConnectionState.current === null) {
      previousConnectionState.current = connectionState;
      logConnection("Initial connection state", connectionState);
      return;
    }
    
    // Log all connection state changes
    logConnection("Connection state changed", {
      from: previousConnectionState.current,
      to: connectionState,
      accountId
    });
    
    // Show connect toast when newly connected
    if ((connectionState === HashConnectConnectionState.Connected.toString() || 
         connectionState === HashConnectConnectionState.Paired.toString()) && 
         accountId && 
         !hasShownConnectedToast.current) {
      
      // Mark that we've shown the connected toast
      hasShownConnectedToast.current = true;
      hasShownDisconnectToast.current = false; // Reset disconnect toast flag
      
      logConnection("Showing connected toast", { accountId });
      
      // Show a single success toast
      toast({
        title: 'Connected to HashPack',
        description: `Account: ${accountId}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } 
    // Show disconnect toast when newly disconnected
    else if (connectionState === HashConnectConnectionState.Disconnected.toString() && 
              previousConnectionState.current !== HashConnectConnectionState.Disconnected.toString() && 
              !hasShownDisconnectToast.current) {
      
      // Mark that we've shown the disconnect toast
      hasShownDisconnectToast.current = true;
      hasShownConnectedToast.current = false; // Reset connect toast flag
      
      logConnection("Showing disconnected toast");
      
      // Show a single disconnect toast
      toast({
        title: 'Disconnected from HashPack',
        description: 'Wallet has been disconnected',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
    
    // Update previous state
    previousConnectionState.current = connectionState;
  }, [connectionState, accountId, toast]);

  // Handle reconnect
  const handleReconnect = async () => {
    logConnection("Attempting to reconnect");
    
    try {
      // First disconnect to clear any stale state
      await disconnect();
      
      // Wait a moment before reconnecting
      setTimeout(async () => {
        try {
          await connect();
          logConnection("Reconnect initiated");
        } catch (reconnectError) {
          logConnection("Reconnect failed", reconnectError);
          toast({
            title: 'Reconnect Failed',
            description: 'Could not reconnect to HashPack. Please try again.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      }, 500);
    } catch (error) {
      logConnection("Disconnect before reconnect failed", error);
    }
  };

  // Format account ID for display (shortening it if needed)
  const formatAccountId = (id: string) => {
    if (id.length <= 15) return id;
    return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`;
  };

  // Render appropriate UI based on connection state
  const renderConnectionUI = () => {
    if (initializationError) {
      return (
        <Box textAlign="center">
          <Text color="red.500" fontWeight="bold" mb={2}>
            Wallet Connection
          </Text>
          <Text fontSize="sm" mb={3}>
            {initializationError}
          </Text>
          <Text fontSize="xs" color="gray.500">
            Please install the HashPack wallet extension to use this feature.
          </Text>
          <Button
            as="a"
            href="https://www.hashpack.app/download"
            target="_blank"
            size="sm"
            colorScheme="purple"
            mt={2}
          >
            Install HashPack Wallet
          </Button>
        </Box>
      );
    } else if (isConnected && accountId) {
      return (
        <Flex direction="column">
          <Flex justify="space-between" align="center" mb={2}>
            <Text fontWeight="bold" color="purple.700">
              Wallet Connected
            </Text>
            <Button
              size="xs"
              colorScheme="red"
              variant="outline"
              onClick={disconnect}
            >
              Disconnect
            </Button>
          </Flex>
          
          <Tooltip label={accountId}>
            <Text fontSize="sm" isTruncated>
              Account: {formatAccountId(accountId)}
            </Text>
          </Tooltip>
          
          <Box mt={2}>
            <HStack spacing={2} mb={1}>
              <Text fontSize="sm">Balances:</Text>
              {loadingBalance && <Spinner size="xs" color="purple.500" />}
            </HStack>
            
            {/* HBAR Balance */}
            <Flex justify="space-between" align="center">
              <HStack>
                <Badge colorScheme="purple" px={2} py={1} borderRadius="md">ℏ</Badge>
                <Text fontSize="sm">HBAR</Text>
              </HStack>
              
              <Text fontSize="sm" fontWeight="medium">
                {accountBalance !== null 
                  ? formatBalance(accountBalance, false)
                  : loadingBalance 
                    ? '—' 
                    : '0.0000'
                }
              </Text>
            </Flex>
            
            {/* USDC Balance */}
            <Flex justify="space-between" align="center" mt={1}>
              <HStack>
                <Badge colorScheme="green" px={2} py={1} borderRadius="md">$</Badge>
                <Text fontSize="sm">USDC</Text>
              </HStack>
              
              <Text fontSize="sm" fontWeight="medium">
                {usdcBalance !== null 
                  ? formatBalance(usdcBalance, true)
                  : loadingBalance 
                    ? '—' 
                    : '0.00'
                }
              </Text>
            </Flex>
          </Box>
        </Flex>
      );
    } else {
      return (
        <Flex direction="column" align="center">
          <Text fontWeight="bold" mb={2} textAlign="center">
            Connect Your Wallet
          </Text>
          <Text fontSize="sm" mb={3} textAlign="center" color="gray.600">
            Connect your HashPack wallet to make a donation
          </Text>
          <Button
            colorScheme="purple"
            onClick={connect}
            isDisabled={!availableExtension}
            isLoading={isConnecting}
            loadingText="Connecting..."
            width="100%"
          >
            Connect HashPack
          </Button>
        </Flex>
      );
    }
  };

  return (
    <Box
      p={3}
      bg="white"
      borderRadius="md"
      boxShadow="sm"
      borderWidth="1px"
      width="100%"
    >
      {renderConnectionUI()}
    </Box>
  );
}; 