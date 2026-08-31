import { BRAND_NAME } from '@/constants/brand.constant.js';

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

const PAGE_BG = '#f4f4f5';
const CARD_BG = '#ffffff';
const TEXT = '#18181b';
const MUTED = '#71717a';
const BORDER = '#e4e4e7';
const BUTTON_BG = '#18181b';
const BUTTON_TEXT = '#ffffff';
const ACCENT = '#f97316';

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderTransactionalEmail(input: {
  preheader: string;
  heading: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaUrl: string;
  footer: string;
}): string {
  const heading = escapeHtml(input.heading);
  const preheader = escapeHtml(input.preheader);
  const ctaLabel = escapeHtml(input.ctaLabel);
  const ctaUrl = escapeHtml(input.ctaUrl);
  const footer = escapeHtml(input.footer);
  const paragraphs = input.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${TEXT};">${escapeHtml(p)}</p>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr>
            <td style="padding:0 8px 20px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              ${escapeHtml(BRAND_NAME)}
            </td>
          </tr>
          <tr>
            <td style="background:${CARD_BG};border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
              <div style="height:3px;background:${ACCENT};line-height:3px;font-size:0;">&nbsp;</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 32px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                    <h1 style="margin:0 0 16px;font-size:22px;line-height:28px;font-weight:600;color:${TEXT};">${heading}</h1>
                    ${paragraphs}
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
                      <tr>
                        <td style="border-radius:8px;background:${BUTTON_BG};">
                          <a href="${ctaUrl}" style="display:inline-block;padding:12px 20px;font-size:14px;font-weight:600;color:${BUTTON_TEXT};text-decoration:none;">${ctaLabel}</a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 8px;font-size:12px;line-height:18px;color:${MUTED};">If the button doesn't work, paste this link into your browser:</p>
                    <p style="margin:0;font-size:12px;line-height:18px;word-break:break-all;">
                      <a href="${ctaUrl}" style="color:${ACCENT};text-decoration:underline;">${ctaUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 8px 0;font-size:12px;line-height:18px;color:${MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderTransactionalText(input: {
  heading: string;
  paragraphs: string[];
  ctaLabel: string;
  ctaUrl: string;
  footer: string;
}): string {
  return [
    input.heading,
    '',
    ...input.paragraphs,
    '',
    `${input.ctaLabel}:`,
    input.ctaUrl,
    '',
    input.footer,
  ].join('\n');
}
