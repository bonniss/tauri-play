import { ActionIcon, Button, Input, Modal } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FunctionComponent } from 'react'
import { Form, defineConfig } from '~/components/form'
import { updateProject } from '~/lib/db/domain/projects'
import { ANIMAL_ICON_OPTIONS } from '~/lib/project/name'
import {
  parseProjectSettings,
  stringifyProjectSettings,
} from '~/lib/project/settings'
import { useAppProvider } from '../layout/AppProvider'

const editProjectForm = defineConfig<{
  description: string
  icon: string
  name: string
}>({
  name: {
    type: 'text',
    label: 'common.name',
    description: 'project.create.name',
    rules: {
      required: true,
      minLength: 1,
      maxLength: 200,
    },
    props: {
      size: 'lg',
      autoFocus: true,
    },
  },
  icon: {
    type: 'inline',
    label: 'common.icon',
    render: ({ value, onChange }) => (
      <Input.Wrapper label="Icon">
        <div className="mt-2 flex flex-wrap gap-2">
          {ANIMAL_ICON_OPTIONS.map((option) => (
            <ActionIcon
              key={`${option.value}-${option.icon}`}
              size="input-md"
              title={option.label}
              variant={value === option.icon ? 'light' : 'default'}
              onClick={() => onChange?.(option.icon)}
            >
              {option.icon}
            </ActionIcon>
          ))}
        </div>
      </Input.Wrapper>
    ),
  },
  description: {
    type: 'longText',
    label: 'common.description',
    description: 'project.create.description',
    rules: {
      maxLength: 5000,
    },
    props: {
      preview: 'edit',
    },
  },
})

interface ProjectEditModalProps {
  currentSettings: string
  defaultValues: {
    description: string
    icon: string
    name: string
  }
  onClose: () => void
  onSuccess?: () => void | Promise<void>
  opened: boolean
  projectId: string
}

const ProjectEditModal: FunctionComponent<ProjectEditModalProps> = ({
  currentSettings,
  defaultValues,
  onClose,
  onSuccess,
  opened,
  projectId,
}) => {
  const { t } = useAppProvider()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({
      description,
      icon,
      name,
    }: {
      description: string
      icon: string
      name: string
    }) => {
      const nextSettings = stringifyProjectSettings({
        ...parseProjectSettings(currentSettings),
        icon,
      })
      await updateProject({
        projectId,
        name: name.trim(),
        description: description.trim() || null,
        settings: nextSettings,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] })
      await onSuccess?.()
      onClose()
    },
  })

  return (
    <Modal onClose={onClose} opened={opened} size="lg" title={t('project.edit.title')}>
      <Form
        key={`${projectId}-${String(opened)}`}
        config={editProjectForm}
        defaultValues={defaultValues}
        onSubmit={async (data) => {
          await mutation.mutateAsync(data)
        }}
        renderRoot={({ children, onSubmit }) => (
          <form className="space-y-3" onSubmit={onSubmit}>
            {children}
          </form>
        )}
      >
        <div className="mt-4 flex justify-end gap-3">
          <Button onClick={onClose} type="button" variant="default">
            {t('common.cancel')}
          </Button>
          <Button loading={mutation.isPending} type="submit">
            {t('common.save')}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}

export default ProjectEditModal
