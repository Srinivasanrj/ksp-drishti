"""
KSP Sentinel AI — Zoho Zia Speech-to-Text Service (SOLID: SRP)
==============================================================
Responsible exclusively for:
1. Validating incoming audio streams.
2. Managing Zoho OAuth token lifecycle (auto-refreshing access token via refresh token on 401).
3. Transcribing audio through Zoho Zia STT API.
"""
import logging
import os
import requests
from typing import Dict, Any, Optional

from app.config import (
    CATALYST_ORG_ID,
    ZIA_AUDIO_ENDPOINT,
    ZOHO_ACCESS_TOKEN,
    ZOHO_CLIENT_ID,
    ZOHO_CLIENT_SECRET,
    ZOHO_REFRESH_TOKEN,
)

log = logging.getLogger("standalone.service.zoho_stt")


class ZohoSTTService:
    def __init__(self):
        self.access_token = ZOHO_ACCESS_TOKEN
        self.refresh_token = ZOHO_REFRESH_TOKEN
        self.client_id = ZOHO_CLIENT_ID
        self.client_secret = ZOHO_CLIENT_SECRET
        self.org_id = CATALYST_ORG_ID
        self.endpoint_url = ZIA_AUDIO_ENDPOINT

    def refresh_access_token(self) -> Optional[str]:
        """Auto-refreshes OAuth access token using permanent refresh token."""
        if not (self.refresh_token and self.client_id and self.client_secret):
            log.warning("[ZohoSTTService] Missing credentials to refresh token")
            return None

        try:
            url = "https://accounts.zoho.in/oauth/v2/token"
            data = {
                "refresh_token": self.refresh_token,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "grant_type": "refresh_token"
            }
            res = requests.post(url, data=data, timeout=10)
            if res.status_code == 200:
                new_token = res.json().get("access_token")
                if new_token:
                    self.access_token = new_token
                    log.info("[ZohoSTTService] Zoho OAuth access token auto-refreshed successfully")
                    return new_token
            log.error(f"[ZohoSTTService] Token refresh failed ({res.status_code}): {res.text}")
        except Exception as e:
            log.error(f"[ZohoSTTService] Token refresh exception: {e}")
        return None

    def transcribe_audio(self, file_bytes: bytes, filename: str, language: str = "en") -> Dict[str, Any]:
        """
        Streams audio bytes to Zoho Zia Speech API with automatic OAuth token recovery.
        """
        content_type = "audio/mpeg" if filename.lower().endswith(".mp3") else "audio/wav"

        # Sanitize filename for Zoho Catalyst (alphanumeric + safe extension only)
        clean_ext = ".mp3" if filename.lower().endswith(".mp3") else ".wav"
        safe_zoho_filename = f"audio_recording{clean_ext}"

        for attempt in range(2):
            headers = {
                "CATALYST-ORG": str(self.org_id),
                "Authorization": f"Zoho-oauthtoken {self.access_token}"
            }
            files = {
                "file": (safe_zoho_filename, file_bytes, content_type)
            }
            data = {"language": language}

            try:
                log.info(f"[ZohoSTTService] Transcribing {len(file_bytes)} bytes via {self.endpoint_url} (attempt {attempt+1})")
                res = requests.post(self.endpoint_url, headers=headers, files=files, data=data, timeout=20)

                # Auto-refresh on 401 Unauthorized
                if res.status_code == 401 and attempt == 0:
                    log.warning("[ZohoSTTService] 401 Invalid Token. Triggering OAuth auto-refresh...")
                    new_token = self.refresh_access_token()
                    if new_token:
                        continue

                if res.status_code == 200:
                    res_json = res.json()
                    transcribed_text = res_json.get("text", "").strip()
                    proc_time = res_json.get("processing_time_ms", 0)
                    return {
                        "success": True,
                        "text": transcribed_text,
                        "language": res_json.get("language", language),
                        "processing_time_ms": proc_time,
                        "provider": "zoho_zia_speech"
                    }
                else:
                    log.error(f"[ZohoSTTService] API returned {res.status_code}: {res.text}")
                    return {
                        "success": False,
                        "status_code": res.status_code,
                        "error": res.text
                    }
            except Exception as e:
                log.error(f"[ZohoSTTService] Request exception: {e}")
                return {
                    "success": False,
                    "error": str(e)
                }

        return {"success": False, "error": "Zoho Zia STT failed after OAuth retry."}


# Global Singleton Service
zoho_stt_service = ZohoSTTService()
