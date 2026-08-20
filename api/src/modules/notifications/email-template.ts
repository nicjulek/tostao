const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function renderEmail({ title, body, cta }: { title: string; body: string; cta?: { label: string; url: string } }): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background:#f3f4f1;font-family:Helvetica,Arial,sans-serif;color:#15201c">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f1;padding:32px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #dde1da;border-radius:16px">
            <tr>
              <td style="padding:28px 32px 0">
                <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#1f5c4a;vertical-align:middle"></span>
                <span style="font-size:18px;font-weight:700;vertical-align:middle;margin-left:8px">Tostão</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px">
                <h1 style="margin:0;font-size:24px;line-height:1.25;letter-spacing:-0.02em">${escape(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px;font-size:16px;line-height:1.55;color:#4a5852">${escape(body)}</td>
            </tr>
            ${
              cta
                ? `<tr><td style="padding:0 32px 28px"><a href="${escape(cta.url)}" style="display:inline-block;background:#1f5c4a;color:#f2f7f3;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">${escape(cta.label)}</a></td></tr>`
                : ''
            }
            <tr>
              <td style="padding:18px 32px;border-top:1px solid #dde1da;font-size:13px;color:#6f7c76">
                Você recebe este e-mail porque tem avisos de assinatura ligados no Tostão.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
