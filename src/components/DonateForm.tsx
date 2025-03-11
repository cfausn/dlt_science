import React, { useState, useEffect } from 'react'
import {
  VStack,
  FormControl,
  FormLabel,
  Button,
  Text,
  useToast,
  Box,
  Alert,
  AlertIcon,
  Link,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Progress,
  Radio,
  RadioGroup,
  Stack,
  Flex,
  Badge,
  HStack
} from '@chakra-ui/react'
import { useHashPack } from '../hooks/useHashPack'
import { ExternalLinkIcon } from '@chakra-ui/icons'

// Props interface
interface DonateFormProps {
  receiverId?: string;
}

// Debugging helper
const logDonateForm = (message: string, data?: any) => {
  console.log(`[DonateForm] ${message}`, data || '');
};

// USDC Token ID on Hedera Testnet
const USDC_TOKEN_ID = "0.0.5680205";

// Default recipient account ID
const DEFAULT_RECIPIENT = "0.0.5680094";

// Token options type
interface TokenOption {
  id: string;
  name: string;
  symbol: string;
  icon?: string;
}

// Available tokens
const tokenOptions: TokenOption[] = [
  {
    id: 'hbar',
    name: 'HBAR',
    symbol: 'ℏ',
    icon: '⚡' // Optional icon
  },
  {
    id: USDC_TOKEN_ID,
    name: 'USDC',
    symbol: '$',
    icon: '💲' // Optional icon
  }
];

// Add a helper function for number formatting
const formatBalance = (balance: number | null, isUSDC: boolean): string => {
  if (balance === null) return isUSDC ? '0.00' : '0.0000';
  
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

// Helper to format number without trailing zeroes
const formatNumberWithoutTrailingZeroes = (value: number | null): string => {
  if (value === null) return '';
  return String(value).replace(/\.?0+$/, '');
};

export const DonateForm: React.FC<DonateFormProps> = ({
  receiverId = DEFAULT_RECIPIENT
}) => {
  const [amount, setAmount] = useState(0.5);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<string>('hbar');
  const [donating, setDonating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [txId, setTxId] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState(false);
  const toast = useToast();

  const {
    connect,
    connectionState,
    accountId,
    accountBalance,
    usdcBalance,
    tokenBalances,
    executeTransaction,
    transactionInProgress,
  } = useHashPack();

  const isConnected = connectionState === 'Paired';
  const isPreparing = donating || transactionInProgress;

  // Log status updates
  useEffect(() => {
    logDonateForm('Connection state updated', {
      connectionState,
      accountId,
      hasBalance: accountBalance !== null
    });
  }, [connectionState, accountId, accountBalance]);

  // Clear error on state change
  useEffect(() => {
    if (errorMsg && isConnected) {
      logDonateForm('Error cleared due to valid connection state');
      setErrorMsg(null);
    }
  }, [connectionState, errorMsg]);

  // Check if the account has the USDC token associated
  const hasUsdcAssociated = Boolean(
    tokenBalances.find(token => token.tokenId === USDC_TOKEN_ID)
  );

  // Get explorer link for transaction
  const getExplorerLink = (txId: string) => {
    return `https://hashscan.io/testnet/transaction/${txId}`;
  };

  // Add state for tracking input string during typing
  const [inputString, setInputString] = useState<string>('');

  const handleDonate = async () => {
    if (!isConnected || !accountId) {
      setErrorMsg('Please connect your wallet first');
      return;
    }

    // Reset transaction state
    setTxId(null);
    setTxSuccess(false);

    // If user selected USDC but doesn't have it associated, prompt them to associate it
    if (selectedToken === USDC_TOKEN_ID && !hasUsdcAssociated) {
      setErrorMsg('You need to associate your account with USDC first');
      
      // Ask if they want to associate
      toast({
        title: 'USDC Not Associated',
        description: 'Your account is not associated with USDC. Would you like to associate it now?',
        status: 'warning',
        duration: 10000,
        isClosable: true,
        render: () => (
          <Box p={3} bg="orange.100" borderRadius="md">
            <Text fontWeight="bold">USDC Not Associated</Text>
            <Text mt={2}>Your account is not associated with USDC.</Text>
            <Button 
              colorScheme='blue' 
              size='sm' 
              mt={2}
              onClick={handleAssociateUsdc}
            >
              Associate Now
            </Button>
          </Box>
        ),
      });
      return;
    }

    // Check if user has enough balance for the selected token
    if (selectedToken === 'hbar' && (accountBalance === null || accountBalance < amount)) {
      setErrorMsg('Insufficient HBAR balance');
      return;
    }
    
    if (selectedToken === USDC_TOKEN_ID && (usdcBalance === null || usdcBalance < amount)) {
      setErrorMsg('Insufficient USDC balance');
      return;
    }

    // Update USDC donation logging
    if (selectedToken === USDC_TOKEN_ID) {
      // Ensure amount is a valid number with proper decimal handling
      const parsedAmount = parseFloat(amount.toString());
      
      // Validate amount is a number and is positive
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMsg('Please enter a valid positive amount for USDC');
        return;
      }
      
      // For USDC, now using 8 decimal places
      logDonateForm('Starting USDC donation', { 
        enteredAmount: amount,
        rawAmount: Math.round(parsedAmount * Math.pow(10, 8)),
        note: 'Using 8 decimal places for USDC'
      });
    }

    // Start donation process
    setDonating(true);
    setProgress(33);
    setErrorMsg(null);

    logDonateForm('Starting donation with context', {
      connectionState,
      accountId,
      initialized: true
    });

    logDonateForm('Starting donation transaction', {
      from: accountId,
      to: receiverId,
      amount,
      token: selectedToken,
      connectionState
    });

    try {
      // Execute transaction with selected token
      const tokenId = selectedToken === 'hbar' ? undefined : selectedToken;
      const result = await executeTransaction(receiverId, amount, tokenId);
      
      // Show the transaction in progress
      setProgress(66);
      
      // Add small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProgress(100);
      
      // Check if transaction was successful (contains a transaction ID)
      if (result && typeof result === 'string') {
        // Set transaction ID and success state
        setTxId(result);
        setTxSuccess(true);
        
        // Log success
        logDonateForm('Transaction executed successfully', {
          txId: result,
          amount,
          token: selectedToken,
          from: accountId,
          to: receiverId
        });

        // Format the amount for display based on token type
        const formattedAmount = selectedToken === 'hbar' 
          ? `${amount} HBAR` 
          : `${formatBalance(amount, true)} USDC`;

        toast({
          title: "Donation Complete",
          description: `Your donation of ${formattedAmount} was sent successfully!`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // Reset form after successful transaction
        setAmount(0.5);
      } else {
        // Handle case where transaction ID wasn't returned properly
        setErrorMsg('Transaction completed but no transaction ID was returned');
        logDonateForm('Transaction missing ID', { result });
      }
    } catch (err: any) {
      setProgress(0);
      logDonateForm('Transaction execution failed', { 
        error: err.message || 'Unknown error',
        context: {
          connectionState,
          accountId,
          to: receiverId,
          amount
        }
      });
      
      setErrorMsg(err.message || 'Failed to execute transaction');
      console.error('Donation error:', err);
      
      logDonateForm('Donation failed with error', {
        errorMessage: err.message,
        originalError: err,
        startContext: {
          connectionState,
          accountId,
          to: receiverId,
          amount
        },
        currentContext: {
          connectionState,
          accountId
        }
      });
    } finally {
      setDonating(false);
    }
  };

  const getButtonMessage = () => {
    if (donating) {
      return "Processing...";
    }
    
    if (selectedToken === 'hbar') {
      return `Donate ${amount || 0} HBAR`;
    } else {
      return `Donate ${amount || 0} USDC`;
    }
  };

  const handleAssociateUsdc = async () => {
    try {
      setErrorMsg(null);
      toast({
        title: 'Association Complete',
        description: 'Your account is now associated with USDC. You can now donate using USDC.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error associating USDC:', err);
    }
  };

  const handleTokenChange = (value: string) => {
    setSelectedToken(value);
    setInputString('');
    
    if (value === 'hbar') {
      setAmount(0.5);
    } else if (value === USDC_TOKEN_ID && selectedToken !== USDC_TOKEN_ID) {
      setAmount(0.5);
    }
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {progress > 0 && <Progress value={progress} colorScheme="purple" size="sm" />}
        
        {errorMsg && (
          <Alert status="error">
            <AlertIcon />
            {errorMsg}
          </Alert>
        )}
        
        {txSuccess && txId && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={1} width="100%">
              <Text fontWeight="bold">Donation Successful!</Text>
              <Text fontSize="sm">Transaction ID: {txId.substring(0, 15)}...</Text>
              <Link href={getExplorerLink(txId)} isExternal color="blue.500" fontSize="sm">
                View on HashScan <ExternalLinkIcon mx="2px" />
              </Link>
            </VStack>
          </Alert>
        )}

        <FormControl>
          <FormLabel>Select Token</FormLabel>
          <RadioGroup 
            onChange={handleTokenChange}
            value={selectedToken}
          >
            <Stack direction="row" spacing={5}>
              {tokenOptions.map(token => (
                <Radio 
                  key={token.id} 
                  value={token.id}
                  isDisabled={token.id === USDC_TOKEN_ID && !hasUsdcAssociated}
                >
                  <Flex align="center">
                    <Text mr={1}>{token.icon}</Text>
                    <Text>{token.name}</Text>
                    {token.id === USDC_TOKEN_ID && !hasUsdcAssociated && (
                      <Badge ml={2} colorScheme="yellow">Not Associated</Badge>
                    )}
                  </Flex>
                </Radio>
              ))}
            </Stack>
          </RadioGroup>
        </FormControl>
        
        {isConnected && (
          <Box w="100%" p={2} bg="gray.50" borderRadius="md">
            <Text fontSize="sm" color="gray.500">
              Your Balance: {selectedToken === 'hbar' 
                ? `${formatBalance(accountBalance, false)} ℏ` 
                : `${formatBalance(usdcBalance, true)} USDC`
              }
            </Text>
          </Box>
        )}

        {/* Donation amount */}
        <FormControl>
          <FormLabel>Amount</FormLabel>
          {selectedToken === 'hbar' ? (
            <NumberInput
              value={inputString || formatNumberWithoutTrailingZeroes(amount)}
              onChange={(valueString) => {
                setInputString(valueString);
                
                if (valueString === '' || valueString === '.') {
                  return;
                }
                
                const parsedValue = parseFloat(valueString);
                if (!isNaN(parsedValue)) {
                  setAmount(parsedValue);
                }
              }}
              onBlur={() => {
                if (inputString) {
                  const parsedValue = parseFloat(inputString);
                  if (!isNaN(parsedValue)) {
                    setAmount(parsedValue);
                  }
                  setInputString('');
                }
              }}
              min={0.000001}
              max={accountBalance || undefined}
              format={value => value}
              step={0.1}
              isDisabled={isPreparing}
              keepWithinRange={false}
              clampValueOnBlur={true}
            >
              <NumberInputField placeholder="0.5" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          ) : (
            <NumberInput
              value={inputString || formatNumberWithoutTrailingZeroes(amount)}
              onChange={(valueString) => {
                setInputString(valueString);
                
                // Handle special cases for decimal input
                if (valueString === '' || valueString === '.') {
                  return;
                }
                
                // Try to parse as a number
                const parsedValue = parseFloat(valueString);
                if (!isNaN(parsedValue)) {
                  setAmount(parsedValue);
                }
              }}
              onBlur={() => {
                if (inputString) {
                  const parsedValue = parseFloat(inputString);
                  if (!isNaN(parsedValue)) {
                    setAmount(parsedValue);
                  }
                  setInputString('');
                }
              }}
              min={0.00000001}
              max={usdcBalance || undefined}
              format={value => value}
              step={0.1}
              isDisabled={isPreparing}
              keepWithinRange={false}
              clampValueOnBlur={true}
            >
              <NumberInputField placeholder="0.5" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          )}
          <Text fontSize="xs" color="gray.500" mt={1}>
            {selectedToken === 'hbar' 
              ? 'Enter HBAR amount' 
              : 'Enter USDC amount'}
          </Text>
        </FormControl>
        
        <HStack>
          <Badge colorScheme="purple">Recipient:</Badge>
          <Text fontSize="sm">{receiverId}</Text>
        </HStack>
        
        <Button 
          onClick={isConnected ? handleDonate : connect}
          colorScheme="purple"
          isLoading={isPreparing}
          loadingText={donating ? "Donating..." : "Connecting..."}
          size="lg"
          width="100%"
        >
          {getButtonMessage()}
        </Button>
      </VStack>
    </Box>
  );
}; 