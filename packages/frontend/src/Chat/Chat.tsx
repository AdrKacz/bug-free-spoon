import { Helmet } from "react-helmet";
import { User } from '../App';

import Chat from './Chat/Chat'
import LanguageModal from './ProfileModal/ProfileModal';

import { Avatar } from '@chatscope/chat-ui-kit-react';

import {
  Text,
  AppShell,
  Card,
  Center,
  Burger,
  Group,
  NavLink,
  Stack,
  Indicator
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import IconLogout from './IconLogout';
import IconProfile from './IconProfile';

interface Props {
    signOut: () => Promise<void>;
    user: User;
}

export default function _({ signOut, user }: Props) {
  const [openedNavbar, { toggle: toggleNavbar }] = useDisclosure();
  const [openedModal, { open: openModal, close: closeModal }] = useDisclosure(false);
  
  const userHasLanguages = user.languages && user.languages.length > 0;

  return (
    <AppShell
      h="100%"
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !openedNavbar }}}
    >
      <Helmet>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, viewport-fit=cover"
          />
      </Helmet>
      <AppShell.Header>
        <Group h="100%" gap={0}>
        <Group px="md" style={{"flex-grow": "1"}}>
          <Indicator color='red' position="top-start" withBorder processing hiddenFrom="sm" disabled={userHasLanguages || openedNavbar}>
            <Burger opened={openedNavbar} onClick={toggleNavbar} hiddenFrom="sm" size="sm" />
          </Indicator>
          <Text size="lg" fw={500}>Bug Free Spoon</Text>
       </Group>
       <Group px="md" justify="flex-end">
          <Avatar src={user.picture}/>
       </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={0}>
            <NavLink
            component="button"
            onClick={openModal}
            label="Update profile"
            leftSection={
              <Indicator color='red' position="top-start" withBorder processing disabled={userHasLanguages}>
                <IconProfile />
              </Indicator>}
          />
        </Stack>
        <Stack h="100%" justify="flex-end" gap={0}>
          <NavLink
            c='red'
            component="button"
            onClick={signOut}
            label="Logout"
            leftSection={<IconLogout />}
          />
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main h="100%">
        <LanguageModal user={user} opened={openedModal} onClose={closeModal} />
        <Center h="100%">
          <Card
            shadow="md"
            radius="xs"
            w={{ base: '100%', sm: '95%' }}
            h={{ base: '100%', sm: '90%' }}
            p="0"
          >
            <Card.Section h="100%" m="0">
              <Chat user={user}/>
            </Card.Section>
          </Card>
        </Center>
      </AppShell.Main>
    </AppShell>
  );
};