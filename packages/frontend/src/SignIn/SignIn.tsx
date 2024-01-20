import {
  Text,
  Paper,
  Group,
  Center,
  LoadingOverlay
} from '@mantine/core';
import { GoogleButton } from './GoogleButton';

export default function _() {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const tokenA = params.get("token");

    const tokenB = localStorage.getItem("session");
    const loading = typeof tokenA === "string" || typeof tokenB == "string";
    return (
        <Center h="100%">
            <Paper pos="relative" shadow="md" radius="md" p="xl" withBorder>
                <LoadingOverlay
                    visible={loading}
                    zIndex={1000}
                    overlayProps={{ radius: "sm", blur: 2 }}
                    loaderProps={{ color: 'gray' }}
                    />
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
