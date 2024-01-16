import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'
import { 
    ChatContainer,
    MessageList,
    Message,
    MessageInput,
    // Avatar,
    MessageModel,
} from '@chatscope/chat-ui-kit-react';

import { useListState } from '@mantine/hooks';

import { User } from '../../App';

import { useEffect } from 'react';

interface Props {
    user: User;
}

const group = '123' // Only one group for now

export default function _({user}: Props) {
    const [messages, handlers] = useListState<Omit<MessageModel, 'position'>>()

    useEffect(() => {
        const getPreviousMessages = async () => {
            // Get latest timestamp
            const latestMessage = messages[messages.length - 1];
            let from = '1970-01-01T00:00:00.000Z';
            if (latestMessage && typeof latestMessage.sentTime === 'string') {
                const fromDate = new Date(latestMessage.sentTime)
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
                handlers.append({
                // Display the original message if the message is from the current user
                message: msg.user === user.userID ? msg.originalText : msg.text,
                direction: msg.user === user.userID ? 'outgoing' : 'incoming',
                sentTime: msg.createdAt,
                sender: msg.user
                });
            });
        }

        const interval = setInterval(getPreviousMessages, 500); // Run every 500ms

        return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
    }, [handlers, messages, user.session, user.userID])

    const handleSend = async (text: string) => {
        if (text.match(/(&nbsp;)+ <br>/)) {
            return
        }

        console.log('Use session', user.session)

        const response = await fetch(`${process.env.REACT_APP_API_URL!}/message/${group}`, {
            method: "POST",
            body: JSON.stringify({ text }),
            headers: {
              Authorization: `Bearer ${user.session}`,
            },
          })
      
          if (!response.ok) {
            console.error(response);
            return
          }
    }

    const models: MessageModel[] = []
    const seen = new Set<number>()
    for (const message of messages) {
        const key = new Date(message.sentTime!).getTime()
        if (seen.has(key)) {
            continue // prevent duplicates
        }
        seen.add(key)

        if (models.length > 0) {
            if (models[models.length - 1].sender !== message.sender) {
                if (models[models.length - 1].position === 'first') {
                    models[models.length - 1].position = 'single'
                } else {
                    models[models.length - 1].position = 'last'
                }
                models.push({...message, position: 'first' })
            } else {
                models.push({...message, position: 'normal' })
            }
        } else {
            models.push({...message, position: 'first' })
        }
    }

    if (models.length > 0) {
        if (models[models.length - 1].position === 'first') {
            models[models.length - 1].position = 'single'
        } else {
            models[models.length - 1].position = 'last'
        }
    }

    return (
        <ChatContainer>
            <MessageList>
                {models.map((model) => (
                    <Message key={new Date(model.sentTime!).getTime()} model={model} />
                ))}
            </MessageList>
            <MessageInput
                placeholder='Aa'
                onSend={handleSend}
            />
        </ChatContainer>
    )
}