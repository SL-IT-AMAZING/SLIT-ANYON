import {
  Box,
  Button,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";

export function DialogPreview() {
  const {
    isOpen: isOpen1,
    onOpen: onOpen1,
    onClose: onClose1,
  } = useDisclosure();
  const {
    isOpen: isOpen2,
    onOpen: onOpen2,
    onClose: onClose2,
  } = useDisclosure();
  const {
    isOpen: isOpen3,
    onOpen: onOpen3,
    onClose: onClose3,
  } = useDisclosure();

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="md" mb={2}>
          Modals
        </Heading>
        <Text color="gray.600">Modal dialogs and overlays</Text>
      </Box>

      <Stack spacing={4}>
        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={2}>
            Basic Modal
          </Text>
          <Button colorScheme="brand" onClick={onOpen1}>
            Open Modal
          </Button>
        </Box>

        <Modal isOpen={isOpen1} onClose={onClose1}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Modal Title</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              This is a basic modal dialog. You can put any content here.
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose1}>
                Close
              </Button>
              <Button colorScheme="brand">Save</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={2}>
            Centered Modal
          </Text>
          <Button colorScheme="blue" onClick={onOpen2}>
            Open Centered Modal
          </Button>
        </Box>

        <Modal isOpen={isOpen2} onClose={onClose2} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Centered Modal</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={3}>
                <Text>This modal is centered on the screen.</Text>
                <Text>It has various content sections.</Text>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" mr={3} onClick={onClose2}>
                Cancel
              </Button>
              <Button colorScheme="blue">Confirm</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={2}>
            Scrollable Modal
          </Text>
          <Button colorScheme="green" onClick={onOpen3}>
            Open Scrollable Modal
          </Button>
        </Box>

        <Modal isOpen={isOpen3} onClose={onClose3} scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Scrollable Modal</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={2}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <Text key={i}>
                    This is line {i + 1}. The modal scrolls when content is too
                    long.
                  </Text>
                ))}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose3}>
                Close
              </Button>
              <Button colorScheme="green">Action</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Stack>
    </Stack>
  );
}
