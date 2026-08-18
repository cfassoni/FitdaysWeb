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
