import {
  Text,
  Paper,
  Group,
  PaperProps,
  Center
} from '@mantine/core';
import { GoogleButton } from './GoogleButton';

export default function _(props: PaperProps) {
  return (
    <Center h="100%">
        <Paper radius="md" p="xl" withBorder {...props}>
        <Text size="lg" fw={500}>
            Welcome to Bug Free Spoon
        </Text>

        <Group grow mb="md" mt="md">
            <GoogleButton
                // @ts-ignore
                component="a"
                href={`${process.env.REACT_APP_API_URL}/auth/google/authorize`}
                radius="xl"
            >Continue with Google</GoogleButton>
        </Group>
        </Paper>
    </Center>
  );
}