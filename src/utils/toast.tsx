import { Box, HStack, Text, Link, UseToastOptions } from '@chakra-ui/react';

interface ToastWithLinkProps {
  title: string;
  description: string;
  url: string;
  status: 'success' | 'error' | 'warning' | 'info';
}

/**
 * Creates a toast notification with a clickable link
 * @param options - Toast options including title, description, URL, and status
 * @returns Toast configuration object
 */
export const createToastWithLink = ({ title, description, url, status }: ToastWithLinkProps): UseToastOptions => {
  return {
    title,
    duration: 6000,
    isClosable: true,
    status,
    position: 'top',
    render: () => (
      <Box
        color="white"
        p={3}
        bg={status === 'success' ? 'green.500' : 'red.500'}
        borderRadius="md"
        boxShadow="lg"
      >
        <HStack alignItems="flex-start">
          <Box color="green.500">✓</Box>
          <Box>
            <Text fontWeight="bold">{title}</Text>
            <Link href={url} isExternal color="white" textDecoration="underline">
              {description}
            </Link>
          </Box>
        </HStack>
      </Box>
    ),
  };
}; 