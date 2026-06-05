import os
import httpx
from fastapi import HTTPException

async def highlight_card(row: int, col: int):
    # Note: A .env.example file does not exist in this project.
    # The ESP32_IP must be defined in the .env file (e.g., ESP32_IP=192.168.1.xxx)
    esp32_ip = os.getenv("ESP32_IP")
    if not esp32_ip:
        raise HTTPException(
            status_code=503,
            detail="ESP32_IP is not configured in the environment variables."
        )

    url = f"http://{esp32_ip}/light?row={row}&col={col}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            response.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=503,
            detail="Connection to ESP32 timed out."
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Failed to connect to ESP32. Is it powered on and on the same network?"
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=503,
            detail=f"ESP32 returned an error: {e.response.status_code} {e.response.text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"An unexpected error occurred while contacting ESP32: {str(e)}"
        )
