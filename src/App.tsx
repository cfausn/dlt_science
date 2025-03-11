import { ChakraProvider, Box, Container, VStack, ThemeProvider, extendTheme } from '@chakra-ui/react';
import { Widget } from './components/Widget';

export interface WidgetConfig {
  receiverId?: string;
  title?: string;
  primaryColor?: string;
  showFooter?: boolean;
  testnet?: boolean;
  maxWidth?: string;
}

const defaultConfig: WidgetConfig = {
  receiverId: "0.0.5680094", // Default recipient account
  title: "Hedera Donation Widget",
  primaryColor: "#00a79d", // Hedera green
  showFooter: true,
  testnet: true,
  maxWidth: "500px"
};

function App(props: Partial<WidgetConfig> = {}) {
  // Merge default config with user provided config
  const config: WidgetConfig = { ...defaultConfig, ...props };
  
  // Create a custom theme with the provided primary color
  const theme = extendTheme({
    colors: {
      brand: {
        500: config.primaryColor,
      },
    },
  });

  return (
    <ChakraProvider theme={theme}>
      <Box bg="gray.50" minH="100vh" py={10}>
        <Container maxW="container.md">
          <VStack spacing={8} align="center">
            <Box
              w="100%"
              bg="white"
              borderRadius="lg"
              boxShadow="lg"
              overflow="hidden"
              p={[2, 4]}
              maxWidth={config.maxWidth}
            >
              <Widget 
                title={config.title}
                receiverId={config.receiverId}
                showFooter={config.showFooter}
                testnet={config.testnet}
              />
            </Box>
          </VStack>
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;
