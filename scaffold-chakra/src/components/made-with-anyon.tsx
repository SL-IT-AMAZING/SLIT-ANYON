import { Box, Flex, Link, Text } from "@chakra-ui/react";

export function MadeWithAnyon() {
  return (
    <Flex justify="center" align="center" mt={8}>
      <Box textAlign="center">
        <Text fontSize="sm" color="gray.600">
          Made with{" "}
          <Link
            href="https://anyon.sh"
            isExternal
            color="blue.500"
            fontWeight="semibold"
          >
            Anyon
          </Link>
        </Text>
      </Box>
    </Flex>
  );
}
