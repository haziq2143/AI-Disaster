import nodemailer from 'nodemailer';

let transporter;

function createTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.SMTP_FROM?.trim();
  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Konfigurasi SMTP belum lengkap.');
  }
  if (Boolean(user) !== Boolean(password)) {
    throw new Error('SMTP_USER dan SMTP_PASSWORD harus dikonfigurasi bersama.');
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user ? { auth: { user, pass: password } } : {}),
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000
    });
  }
  return { transporter, from };
}

function getAppOrigin(request) {
  const configuredUrl = process.env.APP_BASE_URL?.trim();
  if (!configuredUrl && process.env.NODE_ENV === 'production') {
    throw new Error('APP_BASE_URL harus dikonfigurasi untuk mengirim tautan verifikasi.');
  }
  let appUrl;
  try {
    appUrl = new URL(configuredUrl || request.url);
  } catch {
    throw new Error('APP_BASE_URL tidak valid.');
  }
  if (!['http:', 'https:'].includes(appUrl.protocol) || appUrl.username || appUrl.password) {
    throw new Error('APP_BASE_URL harus berupa alamat HTTP(S) yang valid.');
  }
  if (process.env.NODE_ENV === 'production' && appUrl.protocol !== 'https:') {
    throw new Error('APP_BASE_URL production harus menggunakan HTTPS.');
  }
  return appUrl.origin;
}

export async function sendVerificationEmail({ email, token, request }) {
  const { transporter: mailer, from } = createTransporter();
  const verificationUrl = new URL(getAppOrigin(request));
  verificationUrl.hash = `verifyEmail=${token}`;
  const link = verificationUrl.href;

  await mailer.sendMail({
    from,
    to: email,
    subject: 'Verifikasi email AI Disaster Assistant',
    text: `Buka tautan berikut untuk memverifikasi email Anda. Tautan berlaku selama 24 jam:\n\n${link}\n\nJika Anda tidak membuat akun, abaikan email ini.`,
    html: `<p>Buka tautan berikut untuk memverifikasi email Anda. Tautan berlaku selama 24 jam:</p><p><a href="${link}">Verifikasi email</a></p><p>Jika Anda tidak membuat akun, abaikan email ini.</p>`
  });
}
