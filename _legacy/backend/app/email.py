import os
import logging
import urllib.parse
import httpx

logger = logging.getLogger("fitdaysweb.email")

MAILGUN_API_KEY = os.getenv("MAILGUN_API_KEY", "")
MAILGUN_DOMAIN = os.getenv("MAILGUN_DOMAIN", "")
MAILGUN_API_BASE_URL = os.getenv("MAILGUN_API_BASE_URL", "https://api.mailgun.net/v3").rstrip("/")
MAIL_FROM_ADDRESS = os.getenv("MAIL_FROM_ADDRESS", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

def get_mailgun_messages_url() -> str:
    raw_base = os.getenv("MAILGUN_API_BASE_URL", "https://api.mailgun.net/v3").rstrip("/")
    if not raw_base.endswith("/v3"):
        base = f"{raw_base}/v3"
    else:
        base = raw_base
    return f"{base}/{MAILGUN_DOMAIN}/messages"

def get_from_address() -> str:
    if MAIL_FROM_ADDRESS:
        return MAIL_FROM_ADDRESS
    domain = MAILGUN_DOMAIN or "fitdays.app"
    return f"FitdaysWeb <noreply@{domain}>"

EMAIL_CONTENT = {
    "en": {
        "reg_subject": "Your FitdaysWeb verification code",
        "reg_title": "Welcome to FitdaysWeb!",
        "reg_msg": "Thank you for signing up. Please enter the following 6-digit verification code to activate your account:",
        "change_subject": "Confirm your new email address - FitdaysWeb",
        "change_title": "Verify your new email address",
        "change_msg": "You requested to update your email address on FitdaysWeb. Please enter the following verification code:",
        "or_click": "Or click the button below to automatically verify your email:",
        "button_text": "Verify Email Address",
        "expiry_notice": "This verification code will expire in 24 hours. If you did not request this, please ignore this email.",
        "reset_subject": "Reset your FitdaysWeb password",
        "reset_title": "Reset your password",
        "reset_msg": "You requested to reset your password. Enter the 6-digit code below or click the button to set a new password:",
        "reset_button": "Reset Password",
        "reset_or_click": "Or click the button below to directly reset your password:",
        "reset_expiry_notice": "This password reset code and link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.",
        "changed_subject": "Your FitdaysWeb password was changed",
        "changed_title": "Password Changed Successfully",
        "changed_msg": "The password for your FitdaysWeb account was recently changed. If you made this change, no further action is required.",
        "changed_warning": "If you did NOT make this change, please reset your password immediately or contact support.",
        "data_del_subject": "Your FitdaysWeb measurement data has been deleted",
        "data_del_title": "Data Deletion Confirmation",
        "data_del_msg": "As requested, all your workout records, health measurements, uploaded reports, and shared links have been permanently deleted from FitdaysWeb.",
        "data_del_note": "Your user account and profile settings remain active. If you did not make this request, please change your password immediately and contact support.",
        "account_del_subject": "Your FitdaysWeb account has been deleted",
        "account_del_title": "Account Deleted",
        "account_del_msg": "Your FitdaysWeb account and all associated personal data have been permanently removed in accordance with your request.",
        "account_del_notice": "In compliance with GDPR / LGPD regulations, all records, reports, files, and profile details have been permanently erased. Thank you for using FitdaysWeb.",
        "team": "The FitdaysWeb Team"
    },
    "pt": {
        "reg_subject": "Seu código de verificação do FitdaysWeb",
        "reg_title": "Bem-vindo ao FitdaysWeb!",
        "reg_msg": "Obrigado por se cadastrar. Insira o código de verificação de 6 dígitos abaixo para ativar sua conta:",
        "change_subject": "Confirmação de alteração de e-mail - FitdaysWeb",
        "change_title": "Verifique seu novo endereço de e-mail",
        "change_msg": "Você solicitou a alteração do seu e-mail no FitdaysWeb. Insira o seguinte código de verificação:",
        "or_click": "Ou clique no botão abaixo para verificar seu e-mail automaticamente:",
        "button_text": "Verificar E-mail",
        "expiry_notice": "Este código de verificação expira em 24 horas. Se você não solicitou este cadastro, desconsidere esta mensagem.",
        "reset_subject": "Redefinir sua senha do FitdaysWeb",
        "reset_title": "Redefinição de senha",
        "reset_msg": "Você solicitou a redefinição da sua senha. Insira o código de 6 dígitos abaixo ou clique no botão para cadastrar uma nova senha:",
        "reset_button": "Redefinir Senha",
        "reset_or_click": "Ou clique no botão abaixo para redefinir sua senha diretamente:",
        "reset_expiry_notice": "Este código e link de redefinição expiram em 1 hora. Se você não solicitou a redefinição de senha, desconsidere esta mensagem.",
        "changed_subject": "Sua senha do FitdaysWeb foi alterada",
        "changed_title": "Senha alterada com sucesso",
        "changed_msg": "A senha da sua conta FitdaysWeb foi alterada recentemente. Se você realizou esta alteração, nenhuma ação é necessária.",
        "changed_warning": "Se você NÃO realizou essa alteração, redefina sua senha imediatamente ou entre em contato com o suporte.",
        "data_del_subject": "Seus dados de medição do FitdaysWeb foram excluídos",
        "data_del_title": "Confirmação de exclusão de dados",
        "data_del_msg": "Conforme solicitado, todos os seus registros de treino, medições corporais, relatórios enviados e links compartilhados foram excluídos permanentemente do FitdaysWeb.",
        "data_del_note": "Sua conta e configurações de perfil continuam ativas. Se você não solicitou esta exclusão, altere sua senha imediatamente e contate o suporte.",
        "account_del_subject": "Sua conta do FitdaysWeb foi excluída",
        "account_del_title": "Conta excluída",
        "account_del_msg": "Sua conta FitdaysWeb e todos os dados pessoais associados foram removidos permanentemente conforme solicitado.",
        "account_del_notice": "Em conformidade com a LGPD e GDPR, todos os registros, relatórios, arquivos e dados do perfil foram apagados definitivamente. Obrigado por utilizar o FitdaysWeb.",
        "team": "Equipe FitdaysWeb"
    },
    "es": {
        "reg_subject": "Tu código de verificación de FitdaysWeb",
        "reg_title": "¡Bienvenido a FitdaysWeb!",
        "reg_msg": "Gracias por registrarte. Ingresa el siguiente código de verificación de 6 dígitos para activar tu cuenta:",
        "change_subject": "Confirmación de cambio de correo - FitdaysWeb",
        "change_title": "Verifica tu nueva dirección de correo",
        "change_msg": "Has solicitado actualizar tu correo en FitdaysWeb. Ingresa el siguiente código de verificación:",
        "or_click": "O haz clic en el botón de abajo para verificar tu correo automáticamente:",
        "button_text": "Verificar Correo",
        "expiry_notice": "Este código de verificación expirará en 24 horas. Si no solicitaste esto, puedes ignorar este mensaje.",
        "reset_subject": "Restablecer tu contraseña de FitdaysWeb",
        "reset_title": "Restablece tu contraseña",
        "reset_msg": "Has solicitado restablecer tu contraseña. Ingresa el siguiente código de 6 dígitos o haz clic en el botón para establecer una nueva contraseña:",
        "reset_button": "Restablecer Contraseña",
        "reset_or_click": "O haz clic en el botón de abajo para restablecer tu contraseña directamente:",
        "reset_expiry_notice": "Este código y enlace de restablecimiento expirarán en 1 hora. Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje.",
        "changed_subject": "Tu contraseña de FitdaysWeb ha sido cambiada",
        "changed_title": "Contraseña cambiada con éxito",
        "changed_msg": "La contraseña de tu cuenta FitdaysWeb ha sido modificada recientemente. Si realizaste este cambio, no es necesario hacer nada más.",
        "changed_warning": "Si NO realizaste este cambio, restablece tu contraseña de inmediato o ponte en contacto con el soporte.",
        "data_del_subject": "Tus datos de mediciones de FitdaysWeb han sido eliminados",
        "data_del_title": "Confirmación de eliminación de datos",
        "data_del_msg": "Según lo solicitado, todos tus registros de entrenamiento, mediciones corporales, reportes subidos y enlaces compartidos han sido eliminados permanentemente de FitdaysWeb.",
        "data_del_note": "Tu cuenta y configuración de perfil permanecen activas. Si no realizaste esta solicitud, cambia tu contraseña de inmediato y contacta a soporte.",
        "account_del_subject": "Tu cuenta de FitdaysWeb ha sido eliminada",
        "account_del_title": "Cuenta eliminada",
        "account_del_msg": "Tu cuenta de FitdaysWeb y todos los datos personales asociados han sido eliminados permanentemente de acuerdo con tu solicitud.",
        "account_del_notice": "En cumplimiento de las normativas GDPR y LGPD, todos los registros, reportes, archivos y detalles de perfil han sido borrados de forma permanente. Gracias por usar FitdaysWeb.",
        "team": "El Equipo de FitdaysWeb"
    }
}

def get_email_lang(lang_code: str | None) -> str:
    if not lang_code:
        return "en"
    lang = lang_code.lower().split("-")[0]
    return lang if lang in EMAIL_CONTENT else "en"

def send_verification_email(
    to_email: str,
    code: str,
    language: str | None = "en",
    is_email_change: bool = False
) -> bool:
    """
    Send verification email containing a 6-digit OTP code and direct confirmation link.
    If Mailgun is not configured, logs to console (dev/test fallback).
    """
    api_key = os.getenv("MAILGUN_API_KEY", "").strip()
    domain = os.getenv("MAILGUN_DOMAIN", "").strip().strip("/")
    raw_base = os.getenv("MAILGUN_API_BASE_URL", "https://api.mailgun.net/v3").strip().rstrip("/")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").strip().rstrip("/")

    # Strip optional "api:" prefix if user pasted key as "api:key-..."
    if api_key.startswith("api:"):
        api_key = api_key[4:].strip()

    lang = get_email_lang(language)
    strings = EMAIL_CONTENT[lang]
    
    subject = strings["change_subject"] if is_email_change else strings["reg_subject"]
    title = strings["change_title"] if is_email_change else strings["reg_title"]
    msg = strings["change_msg"] if is_email_change else strings["reg_msg"]

    encoded_email = urllib.parse.quote(to_email)
    verification_url = f"{frontend_url}/verify-email?email={encoded_email}&code={code}"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }}
    .header {{ text-align: center; margin-bottom: 24px; }}
    .logo {{ font-size: 22px; font-weight: bold; color: #0284c7; letter-spacing: -0.5px; }}
    .code-box {{ background-color: #f1f5f9; border-radius: 8px; padding: 18px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: monospace; color: #0f172a; margin: 24px 0; }}
    .btn {{ display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; font-weight: 600; text-decoration: none; margin: 12px 0; }}
    .footer {{ margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FitdaysWeb</div>
      <h2 style="color: #0f172a; margin-top: 12px;">{title}</h2>
    </div>
    <p>{msg}</p>
    <div class="code-box">{code}</div>
    <p style="text-align: center; margin: 24px 0 12px 0;">{strings["or_click"]}</p>
    <div style="text-align: center;">
      <a href="{verification_url}" class="btn" target="_blank">{strings["button_text"]}</a>
    </div>
    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">{strings["expiry_notice"]}</p>
    <div class="footer">
      &copy; FitdaysWeb &bull; {strings["team"]}
    </div>
  </div>
</body>
</html>"""

    text_content = f"""{title}

{msg}

Verification Code: {code}

Or verify directly by opening this link in your browser:
{verification_url}

{strings["expiry_notice"]}
"""

    if not api_key or not domain:
        # Development / Testing fallback
        msg_banner = (
            f"\n" + "=" * 70 + "\n"
            f" [EMAIL SERVICE - DEV FALLBACK]\n"
            f" To: {to_email}\n"
            f" Subject: {subject}\n"
            f" 6-Digit Code: [ {code} ]\n"
            f" Direct Link: {verification_url}\n"
            + "=" * 70 + "\n"
        )
        print(msg_banner, flush=True)
        logging.getLogger("uvicorn.error").warning(
            f"[EMAIL DEV FALLBACK] Verification code for {to_email}: {code} | Link: {verification_url}"
        )
        return True

    # Real Mailgun API request
    try:
        if not raw_base.endswith("/v3"):
            base_url = f"{raw_base}/v3"
        else:
            base_url = raw_base
        
        url = f"{base_url}/{domain}/messages"
        auth = ("api", api_key)

        from_addr = os.getenv("MAIL_FROM_ADDRESS", "").strip()
        if not from_addr:
            if "sandbox" in domain:
                from_addr = f"Mailgun Sandbox <postmaster@{domain}>"
            else:
                from_addr = f"FitdaysWeb <noreply@{domain}>"

        data = {
            "from": from_addr,
            "to": to_email,
            "subject": subject,
            "text": text_content,
            "html": html_content,
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, auth=auth, data=data)
            response.raise_for_status()
            logging.getLogger("uvicorn.error").info(f"[MAILGUN] Verification email successfully sent to {to_email}")
            return True
    except httpx.HTTPStatusError as exc:
        err_msg = exc.response.text
        logging.getLogger("uvicorn.error").error(
            f"[MAILGUN ERROR] HTTP {exc.response.status_code} sending to {to_email} via {url}: {err_msg}"
        )
        logger.error(f"Mailgun HTTP {exc.response.status_code} error: {err_msg}")
        return False
    except Exception as exc:
        logging.getLogger("uvicorn.error").error(f"[MAILGUN ERROR] Failed to send email to {to_email}: {exc}")
        logger.error(f"Failed to send email via Mailgun to {to_email}: {exc}")
        return False

def send_password_reset_email(
    to_email: str,
    token: str,
    code: str,
    language: str | None = "en"
) -> bool:
    """
    Send password reset email containing a direct magic link and 6-digit OTP code.
    If Mailgun is not configured, logs to console (dev/test fallback).
    """
    api_key = os.getenv("MAILGUN_API_KEY", "").strip()
    domain = os.getenv("MAILGUN_DOMAIN", "").strip().strip("/")
    raw_base = os.getenv("MAILGUN_API_BASE_URL", "https://api.mailgun.net/v3").strip().rstrip("/")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").strip().rstrip("/")

    if api_key.startswith("api:"):
        api_key = api_key[4:].strip()

    lang = get_email_lang(language)
    strings = EMAIL_CONTENT[lang]

    subject = strings["reset_subject"]
    title = strings["reset_title"]
    msg = strings["reset_msg"]

    encoded_email = urllib.parse.quote(to_email)
    encoded_token = urllib.parse.quote(token)
    reset_url = f"{frontend_url}/reset-password?token={encoded_token}&email={encoded_email}"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }}
    .header {{ text-align: center; margin-bottom: 24px; }}
    .logo {{ font-size: 22px; font-weight: bold; color: #0284c7; letter-spacing: -0.5px; }}
    .code-box {{ background-color: #f1f5f9; border-radius: 8px; padding: 18px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: monospace; color: #0f172a; margin: 24px 0; }}
    .btn {{ display: inline-block; background-color: #0284c7; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; font-weight: 600; text-decoration: none; margin: 12px 0; }}
    .footer {{ margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FitdaysWeb</div>
      <h2 style="color: #0f172a; margin-top: 12px;">{title}</h2>
    </div>
    <p>{msg}</p>
    <div class="code-box">{code}</div>
    <p style="text-align: center; margin: 24px 0 12px 0;">{strings["reset_or_click"]}</p>
    <div style="text-align: center;">
      <a href="{reset_url}" class="btn" target="_blank">{strings["reset_button"]}</a>
    </div>
    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">{strings["reset_expiry_notice"]}</p>
    <div class="footer">
      &copy; FitdaysWeb &bull; {strings["team"]}
    </div>
  </div>
</body>
</html>"""

    text_content = f"""{title}

{msg}

Reset Code: {code}

Or reset your password directly by opening this link in your browser:
{reset_url}

{strings["reset_expiry_notice"]}
"""

    if not api_key or not domain:
        msg_banner = (
            f"\n" + "=" * 70 + "\n"
            f" [PASSWORD RESET SERVICE - DEV FALLBACK]\n"
            f" To: {to_email}\n"
            f" Subject: {subject}\n"
            f" 6-Digit Code: [ {code} ]\n"
            f" Reset Token: {token}\n"
            f" Reset Link: {reset_url}\n"
            + "=" * 70 + "\n"
        )
        print(msg_banner, flush=True)
        logging.getLogger("uvicorn.error").warning(
            f"[PASSWORD RESET DEV FALLBACK] Code: {code} | Token: {token} | Link: {reset_url}"
        )
        return True

    try:
        if not raw_base.endswith("/v3"):
            base_url = f"{raw_base}/v3"
        else:
            base_url = raw_base

        url = f"{base_url}/{domain}/messages"
        auth = ("api", api_key)

        from_addr = os.getenv("MAIL_FROM_ADDRESS", "").strip()
        if not from_addr:
            if "sandbox" in domain:
                from_addr = f"Mailgun Sandbox <postmaster@{domain}>"
            else:
                from_addr = f"FitdaysWeb <noreply@{domain}>"

        data = {
            "from": from_addr,
            "to": to_email,
            "subject": subject,
            "text": text_content,
            "html": html_content,
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, auth=auth, data=data)
            response.raise_for_status()
            logging.getLogger("uvicorn.error").info(f"[MAILGUN] Password reset email successfully sent to {to_email}")
            return True
    except httpx.HTTPStatusError as exc:
        err_msg = exc.response.text
        logging.getLogger("uvicorn.error").error(
            f"[MAILGUN ERROR] HTTP {exc.response.status_code} sending reset email to {to_email} via {url}: {err_msg}"
        )
        logger.error(f"Mailgun HTTP {exc.response.status_code} error: {err_msg}")
        return False
    except Exception as exc:
        logging.getLogger("uvicorn.error").error(f"[MAILGUN ERROR] Failed to send reset email to {to_email}: {exc}")
        logger.error(f"Failed to send reset email via Mailgun to {to_email}: {exc}")
        return False

def send_password_reset_confirmation_email(
    to_email: str,
    language: str | None = "en"
) -> bool:
    """
    Send security notification email confirming password has been changed.
    """
    api_key = os.getenv("MAILGUN_API_KEY", "").strip()
    domain = os.getenv("MAILGUN_DOMAIN", "").strip().strip("/")
    raw_base = os.getenv("MAILGUN_API_BASE_URL", "https://api.mailgun.net/v3").strip().rstrip("/")

    if api_key.startswith("api:"):
        api_key = api_key[4:].strip()

    lang = get_email_lang(language)
    strings = EMAIL_CONTENT[lang]

    subject = strings["changed_subject"]
    title = strings["changed_title"]
    msg = strings["changed_msg"]
    warning = strings["changed_warning"]

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px; color: #1e293b; }}
    .container {{ max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }}
    .header {{ text-align: center; margin-bottom: 24px; }}
    .logo {{ font-size: 22px; font-weight: bold; color: #0284c7; letter-spacing: -0.5px; }}
    .alert-box {{ background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; margin: 20px 0; border-radius: 4px; color: #991b1b; font-size: 13px; }}
    .footer {{ margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FitdaysWeb</div>
      <h2 style="color: #0f172a; margin-top: 12px;">{title}</h2>
    </div>
    <p>{msg}</p>
    <div class="alert-box">{warning}</div>
    <div class="footer">
      &copy; FitdaysWeb &bull; {strings["team"]}
    </div>
  </div>
</body>
</html>"""

    text_content = f"""{title}

{msg}

{warning}
"""

    if not api_key or not domain:
        msg_banner = (
            f"\n" + "=" * 70 + "\n"
            f" [PASSWORD CHANGED CONFIRMATION - DEV FALLBACK]\n"
            f" To: {to_email}\n"
            f" Subject: {subject}\n"
            f" Body: {msg}\n"
            f" Security Warning: {warning}\n"
            + "=" * 70 + "\n"
        )
        print(msg_banner, flush=True)
        logging.getLogger("uvicorn.error").info(f"[SECURITY EMAIL DEV FALLBACK] Password changed notification sent to {to_email}")
        return True

    try:
        if not raw_base.endswith("/v3"):
            base_url = f"{raw_base}/v3"
        else:
            base_url = raw_base

        url = f"{base_url}/{domain}/messages"
        auth = ("api", api_key)

        from_addr = os.getenv("MAIL_FROM_ADDRESS", "").strip()
        if not from_addr:
            if "sandbox" in domain:
                from_addr = f"Mailgun Sandbox <postmaster@{domain}>"
            else:
                from_addr = f"FitdaysWeb <noreply@{domain}>"

        data = {
            "from": from_addr,
            "to": to_email,
            "subject": subject,
            "text": text_content,
            "html": html_content,
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, auth=auth, data=data)
            response.raise_for_status()
            logging.getLogger("uvicorn.error").info(f"[MAILGUN] Password changed confirmation email sent to {to_email}")
            return True
    except Exception as exc:
        logging.getLogger("uvicorn.error").error(f"[MAILGUN ERROR] Failed to send password changed confirmation to {to_email}: {exc}")
        return False


def send_data_deletion_confirmation_email(to_email: str, language: str | None = "en") -> bool:
    lang = get_email_lang(language)
    strings = EMAIL_CONTENT[lang]

    subject = strings["data_del_subject"]
    title = strings["data_del_title"]
    msg = strings["data_del_msg"]
    note = strings["data_del_note"]

    api_key = MAILGUN_API_KEY
    domain = MAILGUN_DOMAIN
    raw_base = MAILGUN_API_BASE_URL

    html_content = f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 24px; line-height: 1.6; }}
    .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
    .header {{ margin-bottom: 24px; text-align: center; }}
    .logo {{ font-size: 22px; font-weight: bold; color: #0284c7; letter-spacing: -0.5px; }}
    .info-box {{ background-color: #f1f5f9; border-left: 4px solid #64748b; padding: 14px; margin: 20px 0; border-radius: 4px; color: #334155; font-size: 13px; }}
    .footer {{ margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FitdaysWeb</div>
      <h2 style="color: #0f172a; margin-top: 12px;">{title}</h2>
    </div>
    <p>{msg}</p>
    <div class="info-box">{note}</div>
    <div class="footer">
      &copy; FitdaysWeb &bull; {strings["team"]}
    </div>
  </div>
</body>
</html>"""

    text_content = f"""{title}

{msg}

{note}
"""

    if not api_key or not domain:
        msg_banner = (
            f"\n" + "=" * 70 + "\n"
            f" [DATA DELETION CONFIRMATION - DEV FALLBACK]\n"
            f" To: {to_email}\n"
            f" Subject: {subject}\n"
            f" Body: {msg}\n"
            f" Note: {note}\n"
            + "=" * 70 + "\n"
        )
        print(msg_banner, flush=True)
        logging.getLogger("uvicorn.error").info(f"[SECURITY EMAIL DEV FALLBACK] Data deletion notification sent to {to_email}")
        return True

    try:
        if not raw_base.endswith("/v3"):
            base_url = f"{raw_base}/v3"
        else:
            base_url = raw_base

        url = f"{base_url}/{domain}/messages"
        auth = ("api", api_key)

        from_addr = os.getenv("MAIL_FROM_ADDRESS", "").strip()
        if not from_addr:
            if "sandbox" in domain:
                from_addr = f"Mailgun Sandbox <postmaster@{domain}>"
            else:
                from_addr = f"FitdaysWeb <noreply@{domain}>"

        data = {
            "from": from_addr,
            "to": to_email,
            "subject": subject,
            "text": text_content,
            "html": html_content,
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, auth=auth, data=data)
            response.raise_for_status()
            logging.getLogger("uvicorn.error").info(f"[MAILGUN] Data deletion confirmation email sent to {to_email}")
            return True
    except Exception as exc:
        logging.getLogger("uvicorn.error").error(f"[MAILGUN ERROR] Failed to send data deletion confirmation to {to_email}: {exc}")
        return False


def send_account_deletion_confirmation_email(to_email: str, language: str | None = "en") -> bool:
    lang = get_email_lang(language)
    strings = EMAIL_CONTENT[lang]

    subject = strings["account_del_subject"]
    title = strings["account_del_title"]
    msg = strings["account_del_msg"]
    notice = strings["account_del_notice"]

    api_key = MAILGUN_API_KEY
    domain = MAILGUN_DOMAIN
    raw_base = MAILGUN_API_BASE_URL

    html_content = f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 24px; line-height: 1.6; }}
    .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
    .header {{ margin-bottom: 24px; text-align: center; }}
    .logo {{ font-size: 22px; font-weight: bold; color: #0284c7; letter-spacing: -0.5px; }}
    .info-box {{ background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; margin: 20px 0; border-radius: 4px; color: #991b1b; font-size: 13px; }}
    .footer {{ margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FitdaysWeb</div>
      <h2 style="color: #0f172a; margin-top: 12px;">{title}</h2>
    </div>
    <p>{msg}</p>
    <div class="info-box">{notice}</div>
    <div class="footer">
      &copy; FitdaysWeb &bull; {strings["team"]}
    </div>
  </div>
</body>
</html>"""

    text_content = f"""{title}

{msg}

{notice}
"""

    if not api_key or not domain:
        msg_banner = (
            f"\n" + "=" * 70 + "\n"
            f" [ACCOUNT DELETION CONFIRMATION - DEV FALLBACK]\n"
            f" To: {to_email}\n"
            f" Subject: {subject}\n"
            f" Body: {msg}\n"
            f" Notice: {notice}\n"
            + "=" * 70 + "\n"
        )
        print(msg_banner, flush=True)
        logging.getLogger("uvicorn.error").info(f"[SECURITY EMAIL DEV FALLBACK] Account deletion notification sent to {to_email}")
        return True

    try:
        if not raw_base.endswith("/v3"):
            base_url = f"{raw_base}/v3"
        else:
            base_url = raw_base

        url = f"{base_url}/{domain}/messages"
        auth = ("api", api_key)

        from_addr = os.getenv("MAIL_FROM_ADDRESS", "").strip()
        if not from_addr:
            if "sandbox" in domain:
                from_addr = f"Mailgun Sandbox <postmaster@{domain}>"
            else:
                from_addr = f"FitdaysWeb <noreply@{domain}>"

        data = {
            "from": from_addr,
            "to": to_email,
            "subject": subject,
            "text": text_content,
            "html": html_content,
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, auth=auth, data=data)
            response.raise_for_status()
            logging.getLogger("uvicorn.error").info(f"[MAILGUN] Account deletion confirmation email sent to {to_email}")
            return True
    except Exception as exc:
        logging.getLogger("uvicorn.error").error(f"[MAILGUN ERROR] Failed to send account deletion confirmation to {to_email}: {exc}")
        return False

