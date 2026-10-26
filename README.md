# 🛡️ KSP Sentinel AI — Multi-Agent Crime Intelligence Platform

> **Prototype built for the Karnataka State Police (KSP) Datathon 2026.**
> A multi-agent AI assistant that lets investigators query crime data in plain language, search police SOPs with RAG, spot crime patterns, and export charts with integrity metadata.

⚠️ *This is a hackathon prototype built on public and synthetic datasets. It is not an official Karnataka State Police product and is not deployed in production.*

---

## 🌟 Overview

Investigators often have to dig through separate databases, PDFs and spreadsheets to answer simple questions. **KSP Sentinel AI** puts these behind one chat interface. A supervisor router reads each question and sends it to a specialist agent: text-to-SQL analytics, document search, pattern analysis, or network intelligence.

---

## ✨ Key Features

### 1. 🤖 Multi-Agent Supervisor Pipeline
- 📊 **Analytics Agent:** converts natural-language crime questions into SQLite queries and returns a summary, a breakdown table and a chart payload.
- 📄 **Document Agent:** RAG search over SOPs, FIR guidelines, Zero FIR procedures and IT Act sections, with inline citations (Zoho Catalyst RAG).
- 🔍 **Pattern Agent:** analyzes a case narrative and suggests follow-up investigation questions and decision branches.
- 🕵️ **Intelligence Agent:** traces financial-crime links such as money-mule accounts, UPI trails and cross-district connections.
- 🗺️ **Spatial & Graph Agents** (in `ksp_dhrushtii2-rohith-sV0.1analysis_agent/`): geospatial hotspot analysis and network-link traversal.
- 🛡️ **General Agent:** answers general questions about police law and procedure (CrPC/BNSS).

### 2. 🏛️ Division Dashboards
Separate dashboards for the Bengaluru, Mysuru, Belagavi and Kalaburagi divisions, plus a state-level HQ view.

### 3. 📊 Chart Analytics Modal
- Combo (bar + pie), bar, pie, doughnut and trend-line views
- Export as PNG, PDF or CSV
- **Integrity metadata:** each export carries a SHA-256 hash of the query and data plus a timestamp, to support evidence-integrity workflows (Sec 65B-style). A real Sec 65B certificate still requires a signed declaration by a responsible officer.

### 4. 📝 Citizen & Police Portals
React prototypes for a citizen e-complaint wizard, police-initiated complaints and passport verification.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Leaflet (GIS maps), Chart.js, jsPDF |
| **Backend** | Python, Flask, SQLite, Node.js (Express server) |
| **AI / LLM** | Zoho Catalyst QuickML (LLM), Zoho Catalyst RAG |
| **Data** | KSP datathon datasets (2024, 2025, cyber crime), census and district map data, synthetic FIRs |

---

## 📁 Repository Structure

```
ksp-drishti/
├── ksp-main/                                   # Main platform
│   ├── backend/                                # Flask API (port 5000)
│   │   ├── app.py                              # Server entry point
│   │   ├── supervisor_router.py                # Routes questions to agents
│   │   ├── analytics_agent.py                  # Text-to-SQL + chart payloads
│   │   ├── pattern_agent.py                    # Pattern / investigation co-pilot
│   │   ├── memory_agent.py                     # Conversation memory
│   │   ├── rag_engine.py                       # Document RAG search
│   │   ├── llm.py                              # Zoho Catalyst QuickML connector
│   │   ├── prompts.py                          # System prompts
│   │   ├── create_database.py, ingest_*.py     # Database and document ingestion
│   │   ├── requirements.txt
│   │   └── .env.example
│   ├── frontend/                               # React + Vite dashboards and chatbot
│   ├── server/                                 # Node.js server (index.js)
│   ├── scripts/                                # Data cleaning, validation, synthetic FIR generation
│   ├── datathon_dataset/                       # Crime, census and map datasets
│   └── zoho_data/                              # SOP documents and synthetic data for RAG
├── ksp_dhrushtii2-rohith-sV0.1analysis_agent/  # Analysis agent module
│   ├── app/agents/                             # analytical, data_query, document, graph, pattern, spatial, federated, conversational
│   ├── server.py
│   └── run_ui.bat                              # Starts the chatbot UI (Vite)
├── e-complaint/                                # Citizen e-complaint portal (React component)
├── POLICE-INITIATED COMPLAINT/                 # Police-initiated complaint portal
└── passport_verification/                      # Passport verification portal
```

---

## 🚀 Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Zoho Catalyst account and API credentials for the LLM and RAG features

### 1. Backend (Flask)
```bash
cd ksp-main/backend
cp .env.example .env          # add your Zoho Catalyst credentials
pip install -r requirements.txt
python app.py                 # runs on http://localhost:5000
```

### 2. Frontend (React + Vite)
```bash
cd ksp-main/frontend
npm install
npm run dev                   # opens on http://localhost:5173
```

### 3. Analysis agent UI (optional)
```bash
cd ksp_dhrushtii2-rohith-sV0.1analysis_agent
cp .env.example .env
pip install -r requirements.txt
npm install
npm run dev
```

---

## 👥 Team & My Contribution

Built as a team for the **KSP Datathon 2026**.

<!-- TODO: add **My contribution:** ... (e.g. "Designed the supervisor router and analytics agent (text-to-SQL + chart generation), built the division dashboards in React, and wrote the data-ingestion scripts.") and **Teammates:** Name — role. Add a Screenshots section near the top too. -->

---

## 📄 License

Built for the KSP Datathon 2026 for educational and demonstration purposes. Datasets belong to their respective providers.
