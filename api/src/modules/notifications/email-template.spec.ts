import { renderEmail } from './email-template'

describe('renderEmail', () => {
  it('escapa o conteúdo e inclui o botão', () => {
    const html = renderEmail({
      title: 'Spotify <script>',
      body: 'Cobra R$ 21,90 & mais',
      cta: { label: 'Abrir', url: 'http://localhost:5173/assinaturas' }
    })
    expect(html).toContain('Spotify &lt;script&gt;')
    expect(html).toContain('R$ 21,90 &amp; mais')
    expect(html).toContain('href="http://localhost:5173/assinaturas"')
  })
})
