import { Modal, TextInput, Checkbox, Button, Group, Box, MultiSelect } from '@mantine/core';
import { useForm } from '@mantine/form';

interface Props {
    opened: boolean
    onClose: () => void
}

const languages = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'jp', label: '日本語' },
]

export default function _({ opened, onClose }: Props) {
    const form = useForm({
        initialValues: {
            languages: [],
        }
    });

    return (
        <Modal opened={opened} onClose={onClose}>
           <Box maw={340} mx="auto">
                <form onSubmit={form.onSubmit((values) => {
                    console.log(values)
                    // TODO: Send to backend
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