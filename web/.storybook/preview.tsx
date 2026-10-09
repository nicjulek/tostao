import type { Preview } from '@storybook/react'
import '../src/styles/index.css'

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Tema',
      toolbar: {
        title: 'Tema',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Claro' },
          { value: 'dark', title: 'Escuro' }
        ],
        dynamicTitle: true
      }
    }
  },
  initialGlobals: { theme: 'light' },
  decorators: [
    (Story, context) => {
      document.documentElement.classList.toggle('dark', context.globals.theme === 'dark')
      return (
        <div className="bg-bg p-6 text-ink">
          <Story />
        </div>
      )
    }
  ],
  parameters: { layout: 'fullscreen', controls: { expanded: true } }
}

export default preview
