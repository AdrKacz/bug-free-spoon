import '@chatui/core/es/styles/index.less';
import Chat, { Bubble, useMessages } from '@chatui/core';
import '@chatui/core/dist/index.css';
import { useEffect } from 'react';

const group = '123'; // Only one group for now
const user = (Math.floor(Math.random() * 1e9)).toString(10).padStart(9, '0');

export default function App() {
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

      const response = await fetch(`${process.env.REACT_APP_API_URL!}/messages/${group}/${from}`);
      if (!response.ok) {
        console.error(response);
        return
      }

      const data = await response.json();
  
      data.forEach((msg: any) => {
        appendMsg({
          type: 'text',
          content: { text: msg.text },
          position: msg.user === user ? 'right' : 'left',
          createdAt: new Date(msg.createdAt).getTime(),
        });
      });
    }

    const interval = setInterval(getPreviousMessages, 500); // Run every 500ms
  
    return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
  }, [messages, appendMsg])

  const handleSend = async (type: any, val: any) => {
    if (!(type === 'text' && val.trim())) {
      return
    }
    const response = await fetch(`${process.env.REACT_APP_API_URL!}/message/${group}`, {
      method: "POST",
      body: JSON.stringify({ text: val, user }),
    })

    if (!response.ok) {
      console.error(response);
      return
    }
    // setTyping(true);

    // setTimeout(() => {
    //   appendMsg({
    //     type: 'text',
    //     content: { text: 'Blah Blah' },
    //   });
    // }, 1000);
  }

  const renderMessageContent = (msg: any) => {
    const { content } = msg;
    return <Bubble content={content.text} />;
  }

  return (
    <Chat
      locale='fr-FR'
      navbar={{ title: 'Bug Free Spoon' }}
      messages={messages}
      renderMessageContent={renderMessageContent}
      onSend={handleSend}
      placeholder='...'
    />
  );
};