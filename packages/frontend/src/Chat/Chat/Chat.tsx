import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'
import {
    ChatContainer,
    MessageList,
    Message,
    MessageInput,
    MessageModel,
    Avatar,
    TypingIndicator
} from '@chatscope/chat-ui-kit-react';

import { useListState, useSetState, usePrevious, useInputState, useDisclosure } from '@mantine/hooks';

import { User } from '../../App';

import { useEffect } from 'react';

interface Props {
    user: User;
}

const group = '123' // Only one group for now

export default function _({user}: Props) {
    const [message, setMessage] = useInputState('');
    const [isTyping, {open: isTypingOpen, close: isTypingClose}] = useDisclosure(false)

    const previousUser = usePrevious(user)
    const [messages, handlers] = useListState<Omit<MessageModel, 'position'>>()
    const [users, setState] = useSetState<Record<string, any>>({})

    useEffect(() => {
        const getPreviousMessages = async () => {
            // Get latest timestamp
            const currentLanguages = (user.languages ?? []).sort().join(',')
            const previousLanguages = (previousUser?.languages ?? []).sort().join(',')
            if (previousUser && currentLanguages !== previousLanguages) {
                handlers.setState([]) // reset if new languages
            }
            let from = '1970-01-01T00:00:00.000Z';
            const latestMessage = messages[messages.length - 1];
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

            const data: {messages: any[], isTyping: boolean} = await response.json();
            console.log('Data', data)
            data.messages.forEach((msg: any) => {
                // Add message
                handlers.append({
                // Display the original message if the message is from the current user
                message: msg.user.userID === user.userID ? msg.originalText : msg.text,
                direction: msg.user.userID === user.userID ? 'outgoing' : 'incoming',
                sentTime: msg.createdAt,
                sender: msg.user.userID
                });

                // Update user if needed
                if (typeof users[msg.user] === 'undefined') {
                    setState({[msg.user.userID]: msg.user})
                }
            });

            if (data.isTyping) {
                isTypingOpen()
            } else {
                isTypingClose()
            }
        }

        const setTypingIndicator = async () => {
            const msg = message.replaceAll('<br>', '').replaceAll('&nbsp;', ' ')
            console.log('Typing', msg.length > 0)
            const response = await fetch(`${process.env.REACT_APP_API_URL!}/user/typing`, {
                method: "POST",
                body: JSON.stringify({ group, isTyping: msg.length > 0 }),
                headers: {
                  Authorization: `Bearer ${user.session}`,
                },
              })
          
              if (!response.ok) {
                console.error(response);
                return
              }
        }

        const intervals = [
            setInterval(getPreviousMessages, 500), // Run every 500ms
            setInterval(setTypingIndicator, 500), // Run every 500ms
        ]

        return () => {
            intervals.forEach(clearInterval)
         } // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
    }, [setState, users, handlers, messages, user, previousUser, message, isTypingOpen, isTypingClose])

    const handleSend = async (text: string) => {
        setMessage('')
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
            <MessageList
                typingIndicator={isTyping ? <TypingIndicator content="Someone is typing" /> : null}
            >
                {models.map((model) => {
                    if (model.direction === 'incoming') {
                        if (model.position === 'last' || model.position === 'single') {
                            return (
                                <Message key={new Date(model.sentTime!).getTime()} model={model}>
                                    <Avatar src={users[model.sender!].picture} />
                                </Message>
                            )
                        } else {
                            return <Message key={new Date(model.sentTime!).getTime()} model={model} avatarSpacer />
                        }  
                    } else {
                        return <Message key={new Date(model.sentTime!).getTime()} model={model} />
                    }               
                })}
            </MessageList>
            <MessageInput
                value={message}
                attachButton={false}
                placeholder='Aa'
                onSend={handleSend}
                onChange={setMessage}
            />
        </ChatContainer>
    )
}