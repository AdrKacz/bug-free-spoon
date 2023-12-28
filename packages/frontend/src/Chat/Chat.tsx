import '@chatui/core/es/styles/index.less';
import Chat, { Bubble, useMessages } from '@chatui/core';
import '@chatui/core/dist/index.css';

import { Helmet } from "react-helmet";

import { useEffect } from 'react';
import { User } from '../App';

import {
  AppShell,
  Card,
  Center,
  Burger,
  Group,
  NavLink,
  Stack
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import IconLogout from './IconLogout';

const group = '123'; // Only one group for now

interface Props {
    signOut: () => Promise<void>;
    user: User;
}

export default function _({ signOut, user }: Props) {
  const [opened, { toggle }] = useDisclosure();
  const { messages, appendMsg } = useMessages([]);

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
          content: { text: msg.text },
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

  return (
    <AppShell
      h="100%"
      header={{ height: 60 }}
      navbar={{ width: 200, breakpoint: 'sm', collapsed: { mobile: !opened }}}
    >
      <Helmet>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, viewport-fit=cover"
          />
      </Helmet>
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          Bug Free Spoon
       </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap={0}>
            <NavLink
              component="button"
              label="Menu item 1"
            />
            <NavLink
              component="button"
              label="Menu item 2"
            />
            <NavLink
              component="button"
              label="Menu item 3"
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
        <Center h="100%">
          <Card
            shadow="md"
            radius="xs"
            w="95%"
            h="90%"
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