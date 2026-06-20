import html
import os
import smtplib
import ssl
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465
RECIPIENT_EMAIL = "atbinternship@yahoo.com"


def _format_timestamp() -> str:
    return datetime.now().strftime("%d/%m/%Y à %H:%M")


def _normalize_value(value: Any, *, uppercase: bool = False, currency: bool = False) -> str:
    if value is None:
        text = "-"
    elif hasattr(value, "value"):
        text = str(value.value)
    elif isinstance(value, datetime):
        text = value.strftime("%d/%m/%Y à %H:%M")
    elif isinstance(value, date):
        text = value.strftime("%d/%m/%Y")
    elif currency:
        text = f"{Decimal(str(value)):.2f}"
    else:
        text = str(value)

    if uppercase:
        text = text.upper()

    return html.escape(text)


def _build_info_row(label: str, value: str, index: int) -> str:
    background = "#FFFFFF" if index % 2 == 0 else "#FAFAFA"
    return f"""
        <tr style="background:{background};">
            <td style="padding:10px 0;border-bottom:1px solid #F0F0F0;color:#8A8A8A;font-size:12px;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;width:40%;vertical-align:top;">
                {html.escape(label)}
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #F0F0F0;color:#1A1A1A;font-size:14px;font-weight:600;vertical-align:top;">
                {value}
            </td>
        </tr>
    """


def _build_email_shell(title: str, timestamp: str, rows_html: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{html.escape(title)}</title>
    </head>
    <body style="margin:0;padding:0;background:#F4F4F4;font-family:Arial,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F4F4F4;padding:24px 12px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#FFFFFF;border-radius:10px;overflow:hidden;">
                        <tr>
                            <td style="background:#C8005A;padding:20px 25px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="color:#FFFFFF;font-size:22px;font-weight:700;vertical-align:middle;">
                                            ATB <span style="font-weight:400;">|</span> <span style="font-size:13px;font-weight:600;">البنك العربي التونسي</span>
                                        </td>
                                        <td align="right" style="color:#FFFFFF;font-size:11px;letter-spacing:2px;opacity:0.85;vertical-align:middle;font-weight:600;">
                                            NOTIFICATION SYSTÈME
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background:#F9F9F9;border-bottom:1px solid #EEE;padding:14px 25px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="color:#1A1A1A;font-size:16px;font-weight:700;">
                                            {html.escape(title)}
                                        </td>
                                        <td align="right" style="color:#777777;font-size:12px;">
                                            {html.escape(timestamp)}
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:25px;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    {rows_html}
                                </table>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;">
                                    <tr>
                                        <td align="center">
                                            <span style="display:inline-block;background:#E8F5E9;color:#2E7D32;border:1px solid #A5D6A7;border-radius:20px;padding:6px 20px;font-size:13px;font-weight:700;">
                                                ✓  Enregistré avec succès
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background:#F4F4F4;padding:16px 25px;font-size:11px;color:#999999;text-align:center;line-height:1.6;">
                                Ceci est un message automatique généré par le système ATB Card Manager.<br />
                                Ne pas répondre à cet email.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def _send_html_email(subject: str, html_body: str) -> bool:
    sender_email = os.getenv("SMTP_SENDER_EMAIL")
    sender_password = os.getenv("SMTP_SENDER_PASSWORD")

    if not sender_email or not sender_password:
        print("Email notification skipped: SMTP credentials are not configured.")
        return False

    try:
        message = MIMEMultipart("alternative")
        message["From"] = sender_email
        message["To"] = RECIPIENT_EMAIL
        message["Subject"] = str(Header(subject, "utf-8"))
        message.attach(MIMEText(html_body, "html", "utf-8"))

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, [RECIPIENT_EMAIL], message.as_string())

        return True
    except Exception as exc:
        print(f"Email notification failed: {exc}")
        return False


def send_card_added_notification(card_data: dict, operator_username: str, drawer_name: str) -> bool:
    try:
        rows_html = "".join(
            [
                _build_info_row("Opérateur", _normalize_value(operator_username), 0),
                _build_info_row("Tiroir", _normalize_value(drawer_name), 1),
                _build_info_row(
                    "Position",
                    f"Rangée {_normalize_value(card_data.get('row'))} — Colonne {_normalize_value(card_data.get('col'))}",
                    2,
                ),
                _build_info_row("Titulaire", _normalize_value(card_data.get("cardholder_name")), 3),
                _build_info_row("Numéro de carte", _normalize_value(card_data.get("card_number")), 4),
                _build_info_row("Type", _normalize_value(card_data.get("card_type"), uppercase=True), 5),
                _build_info_row("Expiration", _normalize_value(card_data.get("expiration_date")), 6),
            ]
        )

        html_body = _build_email_shell(
            "Nouvelle Carte Ajoutée",
            _format_timestamp(),
            rows_html,
        )
        return _send_html_email("ATB Card Manager - Nouvelle Carte Ajoutée", html_body)
    except Exception as exc:
        print(f"Card notification build failed: {exc}")
        return False


def send_check_added_notification(check_data: dict, operator_username: str, drawer_name: str) -> bool:
    try:
        rows_html = "".join(
            [
                _build_info_row("Opérateur", _normalize_value(operator_username), 0),
                _build_info_row("Tiroir", _normalize_value(drawer_name), 1),
                _build_info_row(
                    "Position",
                    f"Rangée {_normalize_value(check_data.get('row'))} — Colonne {_normalize_value(check_data.get('col'))}",
                    2,
                ),
                _build_info_row("Client", _normalize_value(check_data.get("client_name")), 3),
                _build_info_row("N° Chèque", _normalize_value(check_data.get("check_number")), 4),
                _build_info_row("Montant", f"{_normalize_value(check_data.get('montant'), currency=True)} TND", 5),
                _build_info_row(
                    "Carnet",
                    f"{_normalize_value(check_data.get('carnet_size'))} chèques",
                    6,
                ),
            ]
        )

        html_body = _build_email_shell(
            "Nouveau Chèque Ajouté",
            _format_timestamp(),
            rows_html,
        )
        return _send_html_email("ATB Card Manager - Nouveau Chèque Ajouté", html_body)
    except Exception as exc:
        print(f"Check notification build failed: {exc}")
        return False
