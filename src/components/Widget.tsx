import React, { useState, useEffect } from 'react';
import { Box, VStack, Alert, AlertIcon, Text, Heading } from '@chakra-ui/react';
import { WalletConnect } from './WalletConnect';
import { DonateForm } from './DonateForm';
import { useHashPack } from '../hooks/useHashPack';
import { HashConnectConnectionState } from 'hashconnect';

interface WidgetProps {
  donationAddress?: string;
  projectName?: string;
}

export const Widget: React.FC<WidgetProps> = ({
  donationAddress = '0.0.2', // Default testnet treasury
  projectName = 'Hedera Widget'
}) => {
  const {
    connectionState,
    accountId,
    initializationError
  } = useHashPack();
  
  // Determine if we can show the donate form
  const canShowDonateForm = (
    (connectionState === HashConnectConnectionState.Connected.toString() || 
     connectionState === HashConnectConnectionState.Paired.toString()) && 
    accountId
  );
  
  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden" 
      p={4} 
      boxShadow="md"
      maxWidth="500px"
      margin="0 auto"
    >
      <VStack spacing={4} align="stretch">
        <Heading size="md" textAlign="center" mb={2}>
          {projectName}
        </Heading>
        
        {/* Always show wallet connect section */}
        <WalletConnect />
        
        {/* Show initialization errors if any */}
        {initializationError && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Text>{initializationError}</Text>
          </Alert>
        )}
        
        {/* Only show donate form when connected */}
        {canShowDonateForm ? (
          <DonateForm 
            donationAddress={donationAddress} 
            projectName={projectName}
          />
        ) : (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text>Please connect your wallet to make a donation</Text>
          </Alert>
        )}
        
        {/* Footer note */}
        <Text fontSize="xs" color="gray.500" textAlign="center" mt={2}>
          Running on Hedera Testnet. Transactions won't affect mainnet balance.
        </Text>
      </VStack>
    </Box>
  );
}; 