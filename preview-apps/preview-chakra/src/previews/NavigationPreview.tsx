import {
  Box,
  Heading,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from "@chakra-ui/react";

export function NavigationPreview() {
  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="md" mb={2}>
          Navigation
        </Heading>
        <Text color="gray.600">Tabs and navigation components</Text>
      </Box>

      <Stack spacing={4}>
        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={2}>
            Basic Tabs
          </Text>
          <Tabs>
            <TabList>
              <Tab>Tab 1</Tab>
              <Tab>Tab 2</Tab>
              <Tab>Tab 3</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Box p={4}>
                  <Heading size="sm" mb={2}>
                    First Tab
                  </Heading>
                  <Text>This is the content of the first tab.</Text>
                </Box>
              </TabPanel>
              <TabPanel>
                <Box p={4}>
                  <Heading size="sm" mb={2}>
                    Second Tab
                  </Heading>
                  <Text>This is the content of the second tab.</Text>
                </Box>
              </TabPanel>
              <TabPanel>
                <Box p={4}>
                  <Heading size="sm" mb={2}>
                    Third Tab
                  </Heading>
                  <Text>This is the content of the third tab.</Text>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>

        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={2}>
            Soft Tabs
          </Text>
          <Tabs variant="soft-rounded">
            <TabList>
              <Tab>Home</Tab>
              <Tab>About</Tab>
              <Tab>Contact</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Text>Home content goes here.</Text>
              </TabPanel>
              <TabPanel>
                <Text>About content goes here.</Text>
              </TabPanel>
              <TabPanel>
                <Text>Contact content goes here.</Text>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>

        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={2}>
            Enclosed Tabs
          </Text>
          <Tabs variant="enclosed">
            <TabList>
              <Tab>Profile</Tab>
              <Tab>Settings</Tab>
              <Tab>Security</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Stack spacing={2}>
                  <Text fontWeight="medium">User Profile</Text>
                  <Text fontSize="sm" color="gray.600">
                    Manage your profile information here.
                  </Text>
                </Stack>
              </TabPanel>
              <TabPanel>
                <Stack spacing={2}>
                  <Text fontWeight="medium">Settings</Text>
                  <Text fontSize="sm" color="gray.600">
                    Configure your preferences here.
                  </Text>
                </Stack>
              </TabPanel>
              <TabPanel>
                <Stack spacing={2}>
                  <Text fontWeight="medium">Security</Text>
                  <Text fontSize="sm" color="gray.600">
                    Manage your security settings here.
                  </Text>
                </Stack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>

        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={2}>
            Line Tabs (Vertical)
          </Text>
          <Tabs variant="line" orientation="vertical">
            <TabList minW="150px">
              <Tab>Option 1</Tab>
              <Tab>Option 2</Tab>
              <Tab>Option 3</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Text>Option 1 is selected.</Text>
              </TabPanel>
              <TabPanel>
                <Text>Option 2 is selected.</Text>
              </TabPanel>
              <TabPanel>
                <Text>Option 3 is selected.</Text>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Stack>
    </Stack>
  );
}
