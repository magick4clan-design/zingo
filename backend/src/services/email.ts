import { config } from '../config';

interface SendVerificationEmailOptions {
  to: string;
  code: string;
  name?: string | null;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildVerificationEmail = ({ code, name }: SendVerificationEmailOptions) => {
  const safeName = name ? escapeHtml(name) : 'کاربر زینگو';

  return `
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;background:#0b1220;color:#f8fafc;padding:32px">
      <div style="max-width:560px;margin:auto;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:28px;padding:28px">
        <div style="font-size:24px;font-weight:900;color:#fb7185;margin-bottom:12px">زینگو</div>
        <h1 style="margin:0 0 12px;font-size:22px">تایید ایمیل حساب کاربری</h1>
        <p style="line-height:1.9;color:#cbd5e1">سلام ${safeName}، برای فعال‌سازی حساب کاربری‌ات در زینگو این کد را وارد کن:</p>
        <div style="direction:ltr;letter-spacing:10px;text-align:center;font-size:34px;font-weight:900;background:linear-gradient(135deg,#f43f5e,#f97316);border-radius:20px;padding:18px;margin:24px 0;color:white">
          ${code}
        </div>
        <p style="line-height:1.9;color:#94a3b8;font-size:13px">این کد فقط ${config.email.verificationCodeTtlMinutes} دقیقه اعتبار دارد. اگر تو این درخواست را ندادی، این ایمیل را نادیده بگیر.</p>
      </div>
    </div>
  `;
};

export const sendVerificationEmail = async (options: SendVerificationEmailOptions) => {
  const canSend = config.email.enabled && Boolean(config.email.resendApiKey);

  if (!canSend) {
    console.log(`[email:dev] Verification code for ${options.to}: ${options.code}`);
    return { sent: false, provider: 'dev-log' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.email.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.email.from,
      to: options.to,
      subject: 'کد فعال‌سازی حساب زینگو',
      html: buildVerificationEmail(options),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${errorText}`);
  }

  return { sent: true, provider: 'resend' };
};
