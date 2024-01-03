import { LoadingOverlay, Modal, Button, Group, Box, MultiSelect } from '@mantine/core';
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

    const form = useForm({
        initialValues: {
            languages: user.languages ?? [],
        }
    });
    form.setInitialValues({ languages: user.languages ?? [] });

  const submit = async (languages: string[]) => {
    openLoading();
    console.log(languages)
    const response = await fetch(`${process.env.REACT_APP_API_URL!}/user`, {
      method: "POST",
      body: JSON.stringify({ languages }),
      headers: {
        Authorization: `Bearer ${user.session}`,
      },
    })

    if (!response.ok) {
        console.error(response);
        // TODO: Handle error
    }
    await user.syncSession();
    closeLoading(); 
  }

    return (
        <Modal opened={opened} onClose={() => {
            form.reset();
            onClose();
        }}>
           <Box maw={340} mx="auto">
                <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
                <form onSubmit={form.onSubmit((values) => {
                    console.log(values)
                    submit(values.languages)
                    onClose()
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