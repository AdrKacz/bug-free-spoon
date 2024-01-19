import { Stack, Avatar, Alert, LoadingOverlay, Modal, Button, Group, Box, MultiSelect, ActionIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMantineTheme } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';

import { languages } from './languages';

import { User } from '../../App';

import IconRefresh from './IconRefresh';

interface Props {
    opened: boolean
    onClose: () => void
    user: User
}

export default function _({ user, opened, onClose }: Props) {
    const [loading, { open: openLoading, close: closeLoading }] = useDisclosure(false);
    const [error, { open: openError, close: closeError }] = useDisclosure(false);
    const small = useMediaQuery(`(max-width: ${useMantineTheme().breakpoints.sm})`)

    const form = useForm({
        initialValues: {
            picture: user.picture,
            languages: user.languages ?? [],
        },
        validate: {
            languages: (value) => (value.length === 0 ? "You must choose at least one language" : null)
        }
    });
    form.setInitialValues({ picture: user.picture, languages: user.languages ?? [] });

  const submit = async ({ picture, languages } : {picture: string, languages: string[]}): Promise<boolean> => {
    // return true if error, false if success
    if (error) {
        closeError()
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL!}/user`, {
      method: "POST",
      body: JSON.stringify({ picture, languages }),
      headers: {
        Authorization: `Bearer ${user.session}`,
      },
    })

    if (!response.ok) {
        console.error(response);
        return true
    }
    await user.syncSession();
    return false
  }

  const randomAvatar = () => {
    const seed = `${Math.random().toString(36).slice(2, 11)}-${Math.random().toString(36).slice(2, 11)}`
    return `https://api.dicebear.com/7.x/personas/svg?seed=${seed}`
  }

    return (
        <Modal fullScreen={small} opened={opened} onClose={() => {
            if ((user.languages ?? []).length > 0) {
                form.reset();
                onClose();
            } else {
                form.validate()
                if (form.isValid()) {
                    form.setFieldError('languages', 'You must submit at least one language')
                }
            }
        }}>
           <Box maw={400} mx="auto">
                <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                {error && (  
                <Alert variant="light" color="red" title="Error" >
                    We are sorry, but we are currently experiencing some issues with our servers. Please try again later.
                </Alert>
                )}
                <form onSubmit={form.onSubmit(async (values) => {
                    console.log(values)
                    openLoading();
                    const hasError = await submit(values);
                    closeLoading();
                    if (hasError) {
                        openError()
                    } else {
                        onClose()
                    }
                })}>
                    <Stack>
                        <Group>
                            <Avatar size="xl" src={form.getInputProps('picture').value} />
                            <ActionIcon
                                variant="filled"
                                aria-label="Refresh"
                                onClick={() => {
                                    form.setFieldValue('picture', randomAvatar())
                                }}
                            >
                                <IconRefresh />
                            </ActionIcon>
                        </Group>  
                        <MultiSelect
                            label="What languages do you speak?"
                            placeholder="Pick languages"
                            data={languages}
                            searchable
                            hidePickedOptions
                            {...form.getInputProps('languages')}
                        />
                        <Group justify="flex-end" mt="md">
                            <Button type="submit">Submit</Button>
                        </Group>
                    </Stack>
                </form>
            </Box>
        </Modal>
    )
}