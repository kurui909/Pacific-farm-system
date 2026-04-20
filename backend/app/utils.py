import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def send_reset_email(email: str, full_name: str, token: str):
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD, settings.EMAIL_FROM]):
        print("Email settings not configured. Reset link:", f"{settings.FRONTEND_URL}/reset-password?token={token}")
        return

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "SmartPoultry Password Reset"
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = email

    text = (
        f"Hello {full_name},\n\n"
        "We received a request to reset your SmartPoultry password.\n\n"
        f"Use this link to reset your password:\n{reset_link}\n\n"
        "This link will expire in 1 hour.\n\n"
        "If you did not request this change, please ignore this email.\n"
        "Thank you,\nThe SmartPoultry Team"
    )

    html = (
        f"<div style='font-family: sans-serif; color: #111;'>"
        f"<h2 style='color: #1d4ed8;'>Hello {full_name},</h2>"
        "<p>We received a request to reset your SmartPoultry password.</p>"
        f"<p><a href='{reset_link}' style='display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;'>Reset password</a></p>"
        "<p>This link will expire in 1 hour.</p>"
        "<p>If you did not request this change, simply ignore this email.</p>"
        "<p>Thanks,<br/>SmartPoultry Team</p>"
        "</div>"
    )

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)

def send_welcome_email(email: str, full_name: str, login_url: str, password: str | None = None):
    if not all([settings.SMTP_HOST, settings.SMTP_USER, settings.SMTP_PASSWORD, settings.EMAIL_FROM]):
        print("Email settings not configured. Welcome email for:", email)
        print("Login URL:", login_url)
        if password:
            print("Password:", password)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Welcome to SmartPoultry"
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = email

    password_note = (
        f"\nYour temporary password is: {password}\n"
        "Please change it after logging in."
        if password
        else ""
    )

    text = (
        f"Hello {full_name},\n\n"
        "Your SmartPoultry account has been created.\n"
        f"Login here: {login_url}\n"
        f"{password_note}\n"
        "If you did not expect this email, please contact your administrator."
    )

    html = (
        f"<p>Hello <strong>{full_name}</strong>,</p>"
        "<p>Your SmartPoultry account has been created.</p>"
        f"<p><a href=\"{login_url}\">Click here to login</a></p>"
        f"{'<p><strong>Temporary password:</strong> ' + password + '</p>' if password else ''}"
        "<p>If you did not expect this email, please contact your administrator.</p>"
    )

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)