Using a **Self Client** is the fastest and most convenient method for generating temporary OAuth grant tokens to test your QuickML endpoints or RAG APIs locally (e.g., via Postman, cURL, or scripts).

---

## 🛠️ Step-by-Step Guide to Complete Your Test Setup

### Step 1: Generate the Grant Code

In your current screen (Zoho API Console):

1. **Scopes**: You have entered `QuickML.deployment.READ,ZohoCatalyst.mlkit.READ`.
2. **Code Expiry**: Selected as **3 minutes** (Keep in mind that this code expires quickly; you must exchange it for tokens before it expires).
3. **Description**: Add a quick note (e.g., `QuickML Local Endpoint Testing`).
4. **Click CREATE**.
5. **Copy the Generated Code** (this is your `grant_token`).

---

### Step 2: Exchange Code for Access Token

Perform a **`POST`** HTTP request to exchange your authorization code for an `access_token`:

#### **Request URL**

Choose the URL matching your region/data center domain:

* **US**: `[https://accounts.zoho.com/oauth/v2/token](https://accounts.zoho.com/oauth/v2/token)`
* **IN**: `[https://accounts.zoho.in/oauth/v2/token](https://accounts.zoho.in/oauth/v2/token)`
* **EU**: `[https://accounts.zoho.eu/oauth/v2/token](https://accounts.zoho.eu/oauth/v2/token)`

#### **Request Parameters (Form-Data / URL Encoded)**

```text
grant_type    = authorization_code
client_id     = <Copy from the 'Client Secret' tab in Self Client>
client_secret = <Copy from the 'Client Secret' tab in Self Client>
code          = <The authorization code generated in Step 1>

```

#### **Sample cURL Command**

```bash
curl -X POST "https://accounts.zoho.in/oauth/v2/token" \
  -d "grant_type=authorization_code" \
  -d "client_id=1000.XXXXXXXXXXXXXXXXXXXXXXXX" \
  -d "client_secret=XXXXXXXXXXXXXXXXXXXXXXXX" \
  -d "code=1000.XXXXXXXXXXXXXXXXXXXXXXXX"

```

---

### Step 3: Test Your QuickML Endpoint

Once you make the request above, you will receive a JSON response containing an **`access_token`** valid for 1 hour.

You can now call your **QuickML Endpoint** or **RAG API** by supplying the token in your headers:

```http
Authorization: Zoho-oauthtoken <your_access_token>
X-QUICKML-ENDPOINT-KEY: <your_endpoint_key>
Content-Type: application/json

```