import React from 'react';
import { ChakraProvider, Box, Container, Heading, Text, VStack, Link, Image, Center } from '@chakra-ui/react';
import { Widget } from './components/Widget';

function App() {
  return (
    <ChakraProvider>
      <Box bg="gray.50" minH="100vh" py={10}>
        <Container maxW="container.md">
          <VStack spacing={8} align="center">
            <Center fontSize="5xl">🪙</Center>
            <Heading as="h1" size="xl" textAlign="center">
              Hedera Widget with HashPack
            </Heading>
            
            <Text textAlign="center" color="gray.600" maxW="600px">
              This widget allows you to connect to your HashPack wallet and interact with the Hedera network.
              You can send HBAR or make donations directly from the interface.
            </Text>
            
            <Box
              w="100%"
              bg="white"
              borderRadius="lg"
              boxShadow="lg"
              overflow="hidden"
              p={[2, 4]}
            >
              <Widget
                donationAddress="0.0.2"
                projectName="Hedera Widget"
                defaultTab={0}
              />
            </Box>
            
            <Text fontSize="sm" color="gray.500">
              Note: This is running on the Hedera Testnet. Transactions will not affect your mainnet balance.
            </Text>
            
            <Link href="https://docs.hedera.com/hedera" isExternal color="blue.500" fontSize="sm">
              Learn more about Hedera
            </Link>
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;
