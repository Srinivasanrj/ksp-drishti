import os
import logging
import requests
from pathlib import Path
from dotenv import load_dotenv, set_key

# Load environment variables from .env file
ENV_PATH = Path(__file__).resolve().parent / '.env'
if not ENV_PATH.exists():
    ENV_PATH = Path(__file__).resolve().parent.parent / 'server' / '.env'
load_dotenv(dotenv_path=ENV_PATH, override=True)

logger = logging.getLogger(__name__)

class Config:
    """Application configuration variables."""
    # Database configuration
    BASE_DIR = Path(__file__).resolve().parent
    DATABASE_PATH = BASE_DIR / 'crime.db'

    # Catalyst API
    CATALYST_PROJECT_ID   = os.getenv('CATALYST_PROJECT_ID')
    CATALYST_ORG_ID       = os.getenv('CATALYST_ORG_ID')
    CATALYST_ACCESS_TOKEN = os.getenv('CATALYST_ACCESS_TOKEN')
    CATALYST_REFRESH_TOKEN = os.getenv('CATALYST_REFRESH_TOKEN') or os.getenv('CATALYST_QUICKML_REFRESH_TOKEN')
    CATALYST_CLIENT_ID    = os.getenv('CATALYST_CLIENT_ID')
    CATALYST_CLIENT_SECRET = os.getenv('CATALYST_CLIENT_SECRET')

    _token_expires_at = 0
    TOKEN_TTL_SECONDS = 8 * 60 # 8 minutes

    @classmethod
    def get_access_token(cls) -> str:
        """
        Returns a valid access token, auto-refreshing on an 8-minute cycle.
        """
        import time
        now = time.time()
        if not cls.CATALYST_ACCESS_TOKEN or now >= cls._token_expires_at - 30:
            cls.refresh_access_token()
        return cls.CATALYST_ACCESS_TOKEN

    @classmethod
    def refresh_access_token(cls) -> bool:
        """
        Auto-refresh the Zoho OAuth access token using the refresh token.
        Enforces an 8-minute cycle.
        """
        import time
        if not cls.CATALYST_REFRESH_TOKEN or not cls.CATALYST_CLIENT_ID or not cls.CATALYST_CLIENT_SECRET:
            logger.error("Cannot refresh token: CATALYST_REFRESH_TOKEN, CLIENT_ID, or CLIENT_SECRET missing in .env")
            return False

        try:
            r = requests.post(
                'https://accounts.zoho.in/oauth/v2/token',
                params={
                    'refresh_token': cls.CATALYST_REFRESH_TOKEN,
                    'client_id'    : cls.CATALYST_CLIENT_ID,
                    'client_secret': cls.CATALYST_CLIENT_SECRET,
                    'grant_type'   : 'refresh_token'
                },
                timeout=15
            )
            data = r.json()
            new_token = data.get('access_token')

            if new_token:
                cls.CATALYST_ACCESS_TOKEN = new_token
                cls._token_expires_at = time.time() + cls.TOKEN_TTL_SECONDS
                # Persist to .env for next server restart
                set_key(str(ENV_PATH), 'CATALYST_ACCESS_TOKEN', new_token)
                logger.info(f"Zoho OAuth token auto-refreshed on 8-minute cycle.")
                return True
            else:
                logger.error(f"Token refresh failed: {data}")
                return False

        except Exception as e:
            logger.error(f"Exception during token refresh: {e}")
            return False
