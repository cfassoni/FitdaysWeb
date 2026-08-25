interface EmailContentStrings {
  reg_subject: string;
  reg_title: string;
  reg_msg: string;
  change_subject: string;
  change_title: string;
  change_msg: string;
  or_click: string;
  button_text: string;
  expiry_notice: string;
  reset_subject: string;
  reset_title: string;
  reset_msg: string;
  reset_button: string;
  reset_or_click: string;
  reset_expiry_notice: string;
  changed_subject: string;
  changed_title: string;
  changed_msg: string;
  changed_warning: string;
  data_del_subject: string;
  data_del_title: string;
  data_del_msg: string;
  data_del_note: string;
  account_del_subject: string;
  account_del_title: string;
  account_del_msg: string;
  account_del_notice: string;
  team: string;
}

const EMAIL_CONTENT: Record<string, EmailContentStrings> = {
  en: {
    reg_subject: "Your Recomp Pro verification code",
    reg_title: "Welcome to Recomp Pro!",
    reg_msg: "Thank you for signing up. Please enter the following 6-digit verification code to activate your account:",
    change_subject: "Confirm your new email address - Recomp Pro",
    change_title: "Verify your new email address",
    change_msg: "You requested to update your email address on Recomp Pro. Please enter the following verification code:",
    or_click: "Or click the button below to automatically verify your email:",
    button_text: "Verify Email Address",
    expiry_notice: "This verification code will expire in 24 hours. If you did not request this, please ignore this email.",
    reset_subject: "Reset your Recomp Pro password",
    reset_title: "Reset your password",
    reset_msg: "You requested to reset your password. Enter the 6-digit code below or click the button to set a new password:",
    reset_button: "Reset Password",
    reset_or_click: "Or click the button below to directly reset your password:",
    reset_expiry_notice: "This password reset code and link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.",
    changed_subject: "Your Recomp Pro password was changed",
    changed_title: "Password Changed Successfully",
    changed_msg: "The password for your Recomp Pro account was recently changed. If you made this change, no further action is required.",
    changed_warning: "If you did NOT make this change, please reset your password immediately or contact support.",
    data_del_subject: "Your Recomp Pro measurement data has been deleted",
    data_del_title: "Data Deletion Confirmation",
    data_del_msg: "As requested, all your workout records, health measurements, uploaded reports, and shared links have been permanently deleted from Recomp Pro.",
    data_del_note: "Your user account and profile settings remain active. If you did not request this, please change your password immediately and contact support.",
    account_del_subject: "Your Recomp Pro account has been deleted",
    account_del_title: "Account Deleted",
    account_del_msg: "Your Recomp Pro account and all associated personal data have been permanently removed in accordance with your request.",
    account_del_notice: "In compliance with GDPR / LGPD regulations, all records, reports, files, and profile details have been permanently erased. Thank you for using Recomp Pro.",
    team: "The Recomp Pro Team",
  },
  pt: {
    reg_subject: "Seu código de verificação do Recomp Pro",
    reg_title: "Bem-vindo ao Recomp Pro!",
    reg_msg: "Obrigado por se cadastrar. Insira o código de verificação de 6 dígitos abaixo para ativar sua conta:",
    change_subject: "Confirmação de alteração de e-mail - Recomp Pro",
    change_title: "Verifique seu novo endereço de e-mail",
    change_msg: "Você solicitou a alteração do seu e-mail no Recomp Pro. Insira o seguinte código de verificação:",
    or_click: "Ou clique no botão abaixo para verificar seu e-mail automaticamente:",
    button_text: "Verificar E-mail",
    expiry_notice: "Este código de verificação expira em 24 horas. Se você não solicitou este cadastro, desconsidere esta mensagem.",
    reset_subject: "Redefinir sua senha do Recomp Pro",
    reset_title: "Redefinição de senha",
    reset_msg: "Você solicitou a redefinição da sua senha. Insira o código de 6 dígitos abaixo ou clique no botão para cadastrar uma nova senha:",
    reset_button: "Redefinir Senha",
    reset_or_click: "Ou clique no botão abaixo para redefinir sua senha diretamente:",
    reset_expiry_notice: "Este código e link de redefinição expiram em 1 hora. Se você não solicitou a redefinição de senha, desconsidere esta mensagem.",
    changed_subject: "Sua senha do Recomp Pro foi alterada",
    changed_title: "Senha alterada com sucesso",
    changed_msg: "A senha da sua conta Recomp Pro foi alterada recentemente. Se você realizou esta alteração, nenhuma ação é necessária.",
    changed_warning: "Se você NÃO realizou essa alteração, redefina sua senha imediatamente ou entre em contato com o suporte.",
    data_del_subject: "Seus dados de medição do Recomp Pro foram excluídos",
    data_del_title: "Confirmação de exclusão de dados",
    data_del_msg: "Conforme solicitado, todos os seus registros de treino, medições corporais, relatórios enviados e links compartilhados foram excluídos permanentemente do Recomp Pro.",
    data_del_note: "Sua conta e configurações de perfil continuam ativas. Se você não solicitou esta exclusão, altere sua senha imediatamente e contate o suporte.",
    account_del_subject: "Sua conta do Recomp Pro foi excluída",
    account_del_title: "Conta excluída",
    account_del_msg: "Sua conta Recomp Pro e todos os dados pessoais associados foram removidos permanentemente conforme solicitado.",
    account_del_notice: "Em conformidade com a LGPD e GDPR, todos os registros, relatórios, arquivos e dados do perfil foram apagados definitivamente. Obrigado por utilizar o Recomp Pro.",
    team: "Equipe Recomp Pro",
  },
  es: {
    reg_subject: "Tu código de verificación de Recomp Pro",
    reg_title: "¡Bienvenido a Recomp Pro!",
    reg_msg: "Gracias por registrarte. Ingresa el siguiente código de verificación de 6 dígitos para activar tu cuenta:",
    change_subject: "Confirmación de cambio de correo - Recomp Pro",
    change_title: "Verifica tu nueva dirección de correo",
    change_msg: "Has solicitado actualizar tu correo en Recomp Pro. Ingresa el siguiente código de verificación:",
    or_click: "O haz clic en el botón de abajo para verificar tu correo automáticamente:",
    button_text: "Verificar Correo",
    expiry_notice: "Este código de verificación expirará en 24 horas. Si no solicitaste esto, puedes ignorar este mensaje.",
    reset_subject: "Restablecer tu contraseña de Recomp Pro",
    reset_title: "Restablece tu contraseña",
    reset_msg: "Has solicitado restablecer tu contraseña. Ingresa el siguiente código de 6 dígitos o haz clic en el botón para establecer una nueva contraseña:",
    reset_button: "Restablecer Contraseña",
    reset_or_click: "O haz clic en el botón de abajo para restablecer tu contraseña directamente:",
    reset_expiry_notice: "Este código y enlace de restablecimiento expirarán en 1 hora. Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje.",
    changed_subject: "Tu contraseña de Recomp Pro ha sido cambiada",
    changed_title: "Contraseña cambiada con éxito",
    changed_msg: "La contraseña de tu cuenta Recomp Pro ha sido modificada recientemente. Si realizaste este cambio, no es necesario hacer nada más.",
    changed_warning: "Si NO realizaste este cambio, restablece tu contraseña de inmediato o ponte en contacto con el soporte.",
    data_del_subject: "Tus datos de mediciones de Recomp Pro han sido eliminados",
    data_del_title: "Confirmación de eliminación de datos",
    data_del_msg: "Según lo solicitado, todos tus registros de entrenamiento, mediciones corporales, reportes subidos y enlaces compartidos han sido eliminados permanentemente de Recomp Pro.",
    data_del_note: "Tu cuenta y configuración de perfil permanecen activas. Si no realizaste esta solicitud, cambia tu contraseña de inmediato y contacta a soporte.",
    account_del_subject: "Tu cuenta de Recomp Pro ha sido eliminada",
    account_del_title: "Cuenta eliminada",
    account_del_msg: "Tu cuenta de Recomp Pro y todos los datos personales asociados han sido eliminados permanentemente de acuerdo con tu solicitud.",
    account_del_notice: "En cumplimiento de las normativas GDPR y LGPD, todos los registros, reportes, archivos y detalles de perfil han sido borrados de forma permanente. Gracias por usar Recomp Pro.",
    team: "El Equipo de Recomp Pro",
  },
};

function getEmailLang(langCode?: string | null): string {
  if (!langCode) return "en";
  const lang = langCode.toLowerCase().split("-")[0];
  return EMAIL_CONTENT[lang] ? lang : "en";
}

async function dispatchMailgun(to: string, subject: string, text: string, html: string): Promise<boolean> {
  const apiKey = (process.env.MAILGUN_API_KEY || "").trim().replace(/^api:/, "");
  const domain = (process.env.MAILGUN_DOMAIN || "").trim().replace(/\/$/, "");
  const apiBaseUrl = (process.env.MAILGUN_API_BASE_URL || "https://api.mailgun.net/v3").trim().replace(/\/$/, "");
  const mailFrom = (process.env.MAIL_FROM_ADDRESS || "").trim();

  // If no credentials, log to console (development/test fallback)
  if (!apiKey || !domain) {
    console.log("\n" + "=".repeat(70));
    console.log(` [EMAIL SERVICE - DEV FALLBACK]`);
    console.log(` To: ${to}`);
    console.log(` Subject: ${subject}`);
    console.log(` Body:\n${text}`);
    console.log("=".repeat(70) + "\n");
    return true;
  }

  const base = apiBaseUrl.endsWith("/v3") ? apiBaseUrl : `${apiBaseUrl}/v3`;
  const url = `${base}/${domain}/messages`;
  const from = mailFrom || (domain.includes("sandbox") ? `Mailgun Sandbox <postmaster@${domain}>` : `Recomp Pro <noreply@${domain}>`);

  const formData = new URLSearchParams();
  formData.append("from", from);
  formData.append("to", to);
  formData.append("subject", subject);
  formData.append("text", text);
  formData.append("html", html);

  const authHeader = `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[MAILGUN ERROR] HTTP ${res.status}: ${errText}`);
      return false;
    }

    console.log(`[MAILGUN] Email successfully sent to ${to}`);
    return true;
  } catch (err) {
    console.error(`[MAILGUN ERROR] Failed to send email to ${to}:`, err);
    return false;
  }
}

export async function sendVerificationEmail(
  toEmail: string,
  code: string,
  language: string = "en",
  isEmailChange: boolean = false
): Promise<boolean> {
  const lang = getEmailLang(language);
  const strings = EMAIL_CONTENT[lang];
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const verificationUrl = `${appUrl}/verify-email?email=${encodeURIComponent(toEmail)}&code=${code}`;

  const subject = isEmailChange ? strings.change_subject : strings.reg_subject;
  const title = isEmailChange ? strings.change_title : strings.reg_title;
  const msg = isEmailChange ? strings.change_msg : strings.reg_msg;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: bold; color: #6366f1; letter-spacing: -0.5px; }
    .code-box { background-color: #f1f5f9; border-radius: 8px; padding: 18px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: monospace; color: #0f172a; margin: 24px 0; }
    .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; font-weight: 600; text-decoration: none; margin: 12px 0; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Recomp Pro</div>
      <h2 style="color: #0f172a; margin-top: 12px;">${title}</h2>
    </div>
    <p>${msg}</p>
    <div class="code-box">${code}</div>
    <p style="text-align: center; margin: 24px 0 12px 0;">${strings.or_click}</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="btn" target="_blank">${strings.button_text}</a>
    </div>
    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">${strings.expiry_notice}</p>
    <div class="footer">
      &copy; Recomp Pro &bull; ${strings.team}
    </div>
  </div>
</body>
</html>`;

  const text = `${title}\n\n${msg}\n\nVerification Code: ${code}\n\nOr verify directly by opening this link:\n${verificationUrl}\n\n${strings.expiry_notice}\n`;

  return dispatchMailgun(toEmail, subject, text, html);
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string,
  code: string,
  language: string = "en"
): Promise<boolean> {
  const lang = getEmailLang(language);
  const strings = EMAIL_CONTENT[lang];
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 22px; font-weight: bold; color: #6366f1; letter-spacing: -0.5px; }
    .code-box { background-color: #f1f5f9; border-radius: 8px; padding: 18px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: monospace; color: #0f172a; margin: 24px 0; }
    .btn { display: inline-block; background-color: #6366f1; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; font-weight: 600; text-decoration: none; margin: 12px 0; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Recomp Pro</div>
      <h2 style="color: #0f172a; margin-top: 12px;">${strings.reset_title}</h2>
    </div>
    <p>${strings.reset_msg}</p>
    <div class="code-box">${code}</div>
    <p style="text-align: center; margin: 24px 0 12px 0;">${strings.reset_or_click}</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn" target="_blank">${strings.reset_button}</a>
    </div>
    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">${strings.reset_expiry_notice}</p>
    <div class="footer">
      &copy; Recomp Pro &bull; ${strings.team}
    </div>
  </div>
</body>
</html>`;

  const text = `${strings.reset_title}\n\n${strings.reset_msg}\n\nReset Code: ${code}\n\nOr reset directly:\n${resetUrl}\n\n${strings.reset_expiry_notice}\n`;

  return dispatchMailgun(toEmail, strings.reset_subject, text, html);
}

export async function sendPasswordChangedEmail(toEmail: string, language: string = "en"): Promise<boolean> {
  const lang = getEmailLang(language);
  const strings = EMAIL_CONTENT[lang];

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 24px; color: #1e293b;">
  <div style="max-width: 540px; margin: 0 auto; background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
    <h2>${strings.changed_title}</h2>
    <p>${strings.changed_msg}</p>
    <p style="color: #ef4444; font-size: 13px;">${strings.changed_warning}</p>
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
    <small style="color: #64748b;">Recomp Pro &bull; ${strings.team}</small>
  </div>
</body>
</html>`;

  return dispatchMailgun(toEmail, strings.changed_subject, `${strings.changed_title}\n\n${strings.changed_msg}\n\n${strings.changed_warning}`, html);
}

export async function sendDataDeletedEmail(toEmail: string, language: string = "en"): Promise<boolean> {
  const lang = getEmailLang(language);
  const strings = EMAIL_CONTENT[lang];

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 24px; color: #1e293b;">
  <div style="max-width: 540px; margin: 0 auto; background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
    <h2>${strings.data_del_title}</h2>
    <p>${strings.data_del_msg}</p>
    <p style="color: #64748b; font-size: 13px;">${strings.data_del_note}</p>
  </div>
</body>
</html>`;

  return dispatchMailgun(toEmail, strings.data_del_subject, `${strings.data_del_title}\n\n${strings.data_del_msg}\n\n${strings.data_del_note}`, html);
}

export async function sendAccountDeletedEmail(toEmail: string, language: string = "en"): Promise<boolean> {
  const lang = getEmailLang(language);
  const strings = EMAIL_CONTENT[lang];

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 24px; color: #1e293b;">
  <div style="max-width: 540px; margin: 0 auto; background: #fff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
    <h2>${strings.account_del_title}</h2>
    <p>${strings.account_del_msg}</p>
    <p style="color: #64748b; font-size: 13px;">${strings.account_del_notice}</p>
  </div>
</body>
</html>`;

  return dispatchMailgun(toEmail, strings.account_del_subject, `${strings.account_del_title}\n\n${strings.account_del_msg}\n\n${strings.account_del_notice}`, html);
}
