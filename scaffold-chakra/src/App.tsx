import { AddIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Container,
  Divider,
  HStack,
  Heading,
  Input,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { MadeWithAnyon } from "./components/made-with-anyon";

function App() {
  const [count, setCount] = useState(0);
  const [input, setInput] = useState("");
  const toast = useToast();

  const handleIncrement = () => {
    setCount((c) => c + 1);
    toast({
      title: "Count incremented!",
      status: "success",
      duration: 2,
      isClosable: true,
    });
  };

  const handleAddItem = () => {
    if (input.trim()) {
      toast({
        title: `Added: ${input}`,
        status: "info",
        duration: 2,
        isClosable: true,
      });
      setInput("");
    }
  };

  return (
    <Container maxW="md" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Center>
          <Heading as="h1" size="2xl" color="blue.600">
            Chakra UI v2
          </Heading>
        </Center>

        <Divider />

        {/* Counter Card */}
        <Card borderWidth="1px" borderColor="gray.200" boxShadow="md">
          <CardHeader>
            <Heading size="md">Counter Demo</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <Box textAlign="center">
                <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                  {count}
                </Text>
              </Box>
              <HStack spacing={3}>
                <Button
                  colorScheme="blue"
                  onClick={handleIncrement}
                  leftIcon={<AddIcon />}
                >
                  Increment
                </Button>
                <Badge colorScheme={count > 5 ? "orange" : "gray"}>
                  {count > 5 ? "High" : "Low"}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Input Card */}
        <Card borderWidth="1px" borderColor="gray.200" boxShadow="md">
          <CardHeader>
            <Heading size="md">Add Item</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <Input
                placeholder="Enter text..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddItem();
                }}
                size="md"
              />
              <Button
                w="full"
                colorScheme="green"
                onClick={handleAddItem}
                isDisabled={!input.trim()}
              >
                Add
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Divider />

        {/* Info Box */}
        <Box
          bg="blue.50"
          p={4}
          borderRadius="md"
          borderLeft="4px"
          borderColor="blue.500"
        >
          <Text fontSize="sm" color="blue.900">
            ✨ This scaffold uses <strong>Chakra UI v2</strong> with React 18
            and Vite for fast development and production builds.
          </Text>
        </Box>

        <MadeWithAnyon />
      </VStack>
    </Container>
  );
}

export default App;
