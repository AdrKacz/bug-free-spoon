import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'
import { 
    ChatContainer,
    MessageList,
    Message,
    MessageInput,
    Avatar,
    MessageModel,
} from '@chatscope/chat-ui-kit-react';

import { useListState } from '@mantine/hooks';

export default function _() {
    const [messages, handlers] = useListState<MessageModel>()
    const handleSend = (text: string) => {
        handlers.append({
            message: text,
            direction: 'outgoing',
            position: 'normal'
        })
    }
    return (
        <ChatContainer>
            <MessageList>
                {messages.map((message, index) => (
                    <Message key={index} model={message} />
                ))}
            </MessageList>
            <MessageInput
                placeholder='Aa'
                onSend={handleSend}
            />
        </ChatContainer>
    )
}