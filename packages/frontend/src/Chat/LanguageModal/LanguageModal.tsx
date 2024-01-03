import { Alert, LoadingOverlay, Modal, Button, Group, Box, MultiSelect } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';

import { User } from '../../App';

interface Props {
    opened: boolean
    onClose: () => void
    user: User
}

const languages = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'jp', label: '日本語' },
]

export default function _({ user, opened, onClose }: Props) {
    const [loading, { open: openLoading, close: closeLoading }] = useDisclosure(false);
    const [error, { open: openError, close: closeError }] = useDisclosure(false);

    const form = useForm({
        initialValues: {
            languages: user.languages ?? [],
        }
    });
    form.setInitialValues({ languages: user.languages ?? [] });

  const submit = async (languages: string[]): Promise<boolean> => {
    // return true if error, false if success
    if (error) {
        closeError()
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL!}/user`, {
      method: "POST",
      body: JSON.stringify({ languages }),
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

    return (
        <Modal opened={opened} onClose={() => {
            form.reset();
            onClose();
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
                    const hasError = await submit(values.languages);
                    closeLoading();
                    if (hasError) {
                        openError()
                    } else {
                        onClose()
                    }
                })}>
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
                </form>
            </Box>
        </Modal>
    )
}