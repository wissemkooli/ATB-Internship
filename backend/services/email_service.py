import html
import os
import smtplib
import ssl
from datetime import date, datetime
from decimal import Decimal
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
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
        cardholder_name = _normalize_value(card_data.get("cardholder_name"))
        card_number = _normalize_value(card_data.get("card_number"))
        card_type = _normalize_value(card_data.get("card_type"), uppercase=True)
        expiration_date = _normalize_value(card_data.get("expiration_date"))

        rows_html = "".join(
            [
                _build_info_row("Titulaire", cardholder_name, 0),
                _build_info_row("Numéro de carte", card_number, 1),
                _build_info_row("Type", card_type, 2),
                _build_info_row("Date d'expiration", expiration_date, 3),
            ]
        )

        html_body = f"""
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>ATB — Votre carte bancaire est disponible</title>
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
                                                SYSTÈME DE NOTIFICATIONS
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="background:#F9F9F9;border-bottom:1px solid #EEE;padding:14px 25px;">
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                        <tr>
                                            <td style="color:#C8005A;font-size:16px;font-weight:700;">
                                                Votre carte bancaire est prête
                                            </td>
                                            <td align="right" style="color:#777777;font-size:12px;">
                                                {_format_timestamp()}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:25px 25px 0 25px;">
                                    <div style="color:#1A1A1A;font-size:14px;line-height:1.7;font-weight:400;">
                                        Madame, Monsieur {cardholder_name},
                                    </div>
                                    <div style="margin-top:10px;color:#555555;font-size:13px;line-height:1.7;">
                                        Nous avons le plaisir de vous informer que votre carte bancaire est désormais disponible et prête à être retirée dans votre agence ATB.
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:25px;">
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                        {rows_html}
                                    </table>
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:22px;">
                                        <tr>
                                            
                                        </tr>
                                    </table>
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                                        <tr>
                                            <td style="background:#FFF8F0;border-left:4px solid #C8005A;border-radius:6px;padding:14px 18px;color:#555555;font-size:13px;line-height:1.7;">
                                                Veuillez vous présenter à votre agence ATB muni(e) de votre carte d'identité nationale afin de procéder au retrait de votre carte.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="background:#F4F4F4;padding:16px 25px;font-size:11px;color:#999999;text-align:center;line-height:1.6;">
                                    Cet email a été envoyé automatiquement suite à votre demande de carte bancaire ATB.<br />
                                    Pour toute question, contactez votre agence.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        return _send_html_email("ATB — Votre carte bancaire est disponible", html_body)
    except Exception as exc:
        print(f"Card notification build failed: {exc}")
        return False


def send_check_added_notification(check_data: dict, operator_username: str, drawer_name: str) -> bool:
    try:
        client_name = _normalize_value(check_data.get("client_name"))
        check_number = _normalize_value(check_data.get("check_number"))
        montant = _normalize_value(check_data.get("montant"), currency=True)
        carnet_size = _normalize_value(check_data.get("carnet_size"))

        rows_html = "".join(
            [
                _build_info_row("Titulaire", client_name, 0),
                _build_info_row("Numéro de chèque", check_number, 1),
                _build_info_row("Montant", f"{montant} TND", 2),
                _build_info_row("Carnet", f"{carnet_size} chèques", 3),
            ]
        )

        html_body = f"""
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>ATB — Votre chéquier est disponible</title>
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
                                                SYSTÈME DE NOTIFICATIONS
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="background:#F9F9F9;border-bottom:1px solid #EEE;padding:14px 25px;">
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                        <tr>
                                            <td style="color:#C8005A;font-size:16px;font-weight:700;">
                                                Votre chéquier est prêt
                                            </td>
                                            <td align="right" style="color:#777777;font-size:12px;">
                                                {_format_timestamp()}
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:25px 25px 0 25px;">
                                    <div style="color:#1A1A1A;font-size:14px;line-height:1.7;font-weight:400;">
                                        Madame, Monsieur {client_name},
                                    </div>
                                    <div style="margin-top:10px;color:#555555;font-size:13px;line-height:1.7;">
                                        Nous avons le plaisir de vous informer que votre chéquier est désormais disponible et prêt à être retiré dans votre agence ATB.
                                    </div>
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
                                                <span style="display:inline-block;background:#FFF0F5;color:#C8005A;border:1px solid #F4A0C0;border-radius:20px;padding:8px 22px;font-size:13px;font-weight:600;">
                                                    🏦 Votre chéquier est disponible dans votre agence ATB
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:20px;">
                                        <tr>
                                            <td style="background:#FFF8F0;border-left:4px solid #C8005A;border-radius:6px;padding:14px 18px;color:#555555;font-size:13px;line-height:1.7;">
                                                Veuillez vous présenter à votre agence ATB muni(e) de votre carte d'identité nationale afin de procéder au retrait de votre chéquier.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="background:#F4F4F4;padding:16px 25px;font-size:11px;color:#999999;text-align:center;line-height:1.6;">
                                    Cet email a été envoyé automatiquement suite à votre demande de chéquier ATB.<br />
                                    Pour toute question, contactez votre agence.
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        return _send_html_email("ATB — Votre chéquier est disponible", html_body)
    except Exception as exc:
        print(f"Check notification build failed: {exc}")
        return False
