# Karnataka State Police Crime Intelligence Platform - Backend

This is the AI-powered backend for querying the crime statistics database using natural language. It utilizes Google Gemini to extract structured intents and format responses, while using parameterized SQL to interact with a SQLite database safely.

## Project Structure
- `app.py`: Main Flask application setup and logging configuration.
- `routes.py`: Contains the API endpoints, mainly `POST /chat`.
- `query_engine.py`: Takes structured intents and builds parameterized SQL queries.
- `database.py`: Handles SQLite database connections and query execution.
- `llm.py`: Interfaces with the Google Gemini API.
- `prompts.py`: Central store for LLM system prompts.
- `config.py`: Loads environment configurations.

## Setup & Installation

1. Make sure you have Python 3.13 installed.
2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Open the `.env` file and replace `YOUR_GEMINI_API_KEY_HERE` with your actual Google Gemini API key.

## How to Run

Start the Flask development server:
```bash
python app.py
```
The server will start at `http://127.0.0.1:5000/`.

## Testing with Postman

1. Open Postman.
2. Create a new `POST` request to `http://127.0.0.1:5000/chat`.
3. Go to the **Body** tab, select **raw**, and choose **JSON** format.
4. Paste the following payload:
   ```json
   {
       "query": "How many murder cases were reported in January 2026?"
   }
   ```
5. Click **Send**.
6. You should receive a JSON response containing the extracted intent, SQL, retrieved rows, and a conversational answer.

## Logs
The application generates logs in the `logs/application.log` file, recording incoming requests, parsed intents, SQL executions, and any errors.
