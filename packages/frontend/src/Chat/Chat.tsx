import '@chatui/core/es/styles/index.less';
import Chat, { Bubble, useMessages } from '@chatui/core';
import '@chatui/core/dist/index.css';

import { Helmet } from "react-helmet";

import { useEffect } from 'react';
import { User } from '../App';

import LanguageModal from './LanguageModal/LanguageModal';

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
import IconLanguage from './IconLanguage';

const group = '123'; // Only one group for now

interface Props {
    signOut: () => Promise<void>;
    user: User;
}

export default function _({ signOut, user }: Props) {
  const [openedNavbar, { toggle: toggleNavbar }] = useDisclosure();
  const { messages, appendMsg } = useMessages([]);
  const [openedModal, { open: openModal, close: closeModal }] = useDisclosure(false);
  
  useEffect(() => {
    const getPreviousMessages = async () => {
      // Get latest timestamp
      const latestMessage = messages[messages.length - 1];
      let from = '1970-01-01T00:00:00.000Z';
      if (latestMessage && typeof latestMessage.createdAt === 'number') {
        const fromDate = new Date(latestMessage.createdAt)
        fromDate.setUTCMilliseconds(fromDate.getUTCMilliseconds() + 1);
        from = fromDate.toISOString();
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL!}/messages/${group}/${from}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${user.session}`,
          }
      });
      if (!response.ok) {
        console.error(response);
        return
      }

      const data = await response.json();
  
      data.forEach((msg: any) => {
        appendMsg({
          type: 'text',
          // TODO: Add something so user click on "Update my languages"
          // Display the original message if the message is from the current user
          content: { text: msg.user === user.userID ? msg.originalText : msg.text },
          position: msg.user === user.userID ? 'right' : 'left',
          createdAt: new Date(msg.createdAt).getTime(),
        });
      });
    }

    const interval = setInterval(getPreviousMessages, 500); // Run every 500ms
  
    return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
  }, [messages, appendMsg, user.userID, user.session])

  const handleSend = async (type: any, val: any) => {
    if (!(type === 'text' && val.trim())) {
      return
    }

    console.log('Use session', user.session)
    const response = await fetch(`${process.env.REACT_APP_API_URL!}/message/${group}`, {
      method: "POST",
      body: JSON.stringify({ text: val }),
      headers: {
        Authorization: `Bearer ${user.session}`,
      },
    })

    if (!response.ok) {
      console.error(response);
      return
    }
  }

  const renderMessageContent = (msg: any) => {
    const { content } = msg;
    return <Bubble content={content.text} />;
  }

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
        <Group h="100%" px="md">
          <Indicator color='red' position="top-start" withBorder processing hiddenFrom="sm" disabled={userHasLanguages || openedNavbar}>
            <Burger opened={openedNavbar} onClick={toggleNavbar} hiddenFrom="sm" size="sm" />
          </Indicator>
          <Text size="lg" fw={500}>Bug Free Spoon</Text>
       </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={0}>
            <NavLink
            component="button"
            onClick={openModal}
            label="Choose languages"
            leftSection={
              <Indicator color='red' position="top-start" withBorder processing disabled={userHasLanguages}>
                <IconLanguage />
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
              <Chat
                  locale='fr-FR'
                  messages={messages}
                  renderMessageContent={renderMessageContent}
                  onSend={handleSend}
                  placeholder='...'
              />
            </Card.Section>
          </Card>
        </Center>
      </AppShell.Main>
    </AppShell>
  );
};