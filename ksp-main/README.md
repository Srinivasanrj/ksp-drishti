# 🛡️ KARNATAKA STATE POLICE — SENTINEL AI COMMAND PLATFORM

> **State Crime Records Bureau (SCRB) • Multi-Agent Intelligence & Command Console**  
> *Empowering 1,100+ Police Stations across Karnataka with Real-Time Crime Analytics, RAG SOP Guidance, Tactical Interrogation Co-Pilot, and Sec 65B Certified Court Evidence Generation.*

---

## 🌟 Executive Summary

**KSP Sentinel AI** is an enterprise-grade AI command platform engineered for the **Karnataka State Police (KSP)**. Built on a multi-agent supervisor architecture, it integrates natural language Text-to-SQL database analytics, Retrieval-Augmented Generation (RAG) for law enforcement SOPs, crime pattern matching, money mule tracking, and automated digital evidence generation compliant with **Section 65B of the Indian Evidence Act / Section 63 BSA 2023**.

---

## ✨ Key Features & Capabilities

### 1. 🤖 Multi-Agent Supervisor Intelligence Pipeline
- 📊 **Analytics Agent (`\analytics`)**: Converts natural language crime questions into syntactically valid SQLite queries. Generates standardized 3-part analytics outputs (Executive Summary, GFM Breakdown Table with percentage shares & bold total row, and Concluding Insight).
- 📄 **Document Agent (`\document`)**: Searches the pre-indexed Zoho Catalyst RAG Knowledge Store for official SOPs, FIR guidelines, Zero FIR procedures, IT Act statutes, and case files with inline bracketed document citations.
- 🔍 **Pattern Agent (`\pattern`)**: Senior Interrogation Specialist & Tactical Investigation Co-Pilot. Analyzes case narratives dynamically to generate 4-6 targeted follow-up interrogation questions and branching decision trees.
- 🕵️ **Intelligence Agent (`\intel`)**: Tracks financial crime networks, money mule accounts, UPI ID trails, and cross-district syndicates.
- 🛡️ **General Command Agent**: Answers general police law definitions, CrPC/BNSS section explanations, and command operations guidelines.

### 2. 🏛️ Multi-Division Command Consoles
Dedicated command consoles for Karnataka State Police administrative ranges:
- 🔵 **Bengaluru Division Console** (Capital Sector Command)
- 🟣 **Mysuru Division Console** (Southern Range Command)
- 🟢 **Belagavi Division Console** (Northern Range Command)
- 🟡 **Kalaburagi Division Console** (Kalyana-Karnataka Command)
- 🛡️ **State Control Room HQ Console** (SCRB Headquarters Command)

### 3. 📊 Interactive Visual Chart Analytics Dashboard Modal
- **Full-Screen Dark Glass Overlay**: High-resolution interactive visual portal rendered directly to the top-level viewport.
- **Multiple Visual Formats**: Instant toggle between **Combo (Bar + Pie)**, **Bar Chart**, **Pie Chart**, **Doughnut**, and **Trend Line**.
- **Sec 65B Evidence Certificate**: Displays unique SHA-256 Query Hash, Data Signatures, and Timestamp verification for legal court admissibility.
- **1-Click Export Suite**:
  - 📥 **Download Chart PNG**: Lossless image export.
  - 📄 **Export PDF**: Official KSP court evidence document compilation.
  - 📊 **CSV Export**: Raw dataset export.

### 4. 📝 Citizen e-Complaint & FIR Registration Wizard
- Digital complaint intake wizard with automated station assignment, offense severity rating, and instant electronic acknowledgment generation.

---

## 🛠️ Technology Stack

| Layer | Technologies & Frameworks |
| :--- | :--- |
| **Frontend** | React 18, Vite, Vanilla CSS Design System, Leaflet GIS Maps, Chart.js, Lucide Icons, jsPDF |
| **Backend** | Python 3.10+, Flask, SQLite3 DB Engine, Requests, Threading |
| **AI / LLM Engine** | Zoho Catalyst QuickML (GLM-4.7B Flash LLM), Zoho Catalyst RAG Knowledge Search |
| **Authentication** | Multi-Division Officer OAuth Session Management, Local Storage & Session State Routing |

---

## 📁 Repository Structure

```
DATATHON/
├── backend/
│   ├── app.py                      # Flask API Application Server
│   ├── routes.py                   # Supervisor Agent Routing & API Endpoints
│   ├── analytics_agent.py          # Text-to-SQL & Chart Payload Engine
│   ├── pattern_agent.py            # Tactical Interrogation & Pattern Engine
│   ├── llm.py                      # Zoho Catalyst QuickML API Connector
│   ├── prompts.py                  # System Prompts & Formatting Guidelines
│   ├── rag_engine.py               # Document RAG Search & Indexing Engine
│   └── database.py                 # SQLite Database Manager
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.jsx             # Main Application Router
│   │   │   ├── Chatbot.jsx         # Division-Aware AI Assistant
│   │   │   ├── ChartAnalysisModal.jsx # Full-Screen Chart & Sec 65B Modal
│   │   │   ├── BengaluruHeadDashboard.jsx
│   │   │   ├── MysuruHeadDashboard.jsx
│   │   │   ├── BelagaviHeadDashboard.jsx
│   │   │   └── KalaburagiHeadDashboard.jsx
│   │   ├── index.css               # Core Design System & Tokens
│   │   └── main.jsx                # React Root Entry Point
├── datathon_dataset/               # KSP Crime Datasets (2024, 2025, Cyber)
├── zoho_data/                      # Knowledge Base Documents & SOP PDFs
├── requirements.txt                # Python Backend Dependencies
└── README.md                       # Project Documentation
```

---

## 🚀 Installation & Setup Guide

### 1. Prerequisites
- **Node.js** (v18.0 or higher)
- **Python** (v3.10 or higher)
- **Git**

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r ../requirements.txt

# Start the Flask API server
python app.py
```
*Backend server runs on `http://127.0.0.1:5000`*

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend application opens on `http://localhost:5173`*

---

## 🔒 Sec 65B Compliance & Legal Admissibility

All analytics outputs, chart visualizations, and digital evidence packets generated by **KSP Sentinel AI** are automatically stamped with:
- **Cryptographic SHA-256 Hash Signature**
- **ISO 8601 Timestamp Verification**
- **Sec 65B Compliance Certificate** under Section 65B of the Indian Evidence Act, 1872 / Section 63 of Bharatiya Sakshya Adhiniyam (BSA) 2023.

---

## 📄 License & Attribution

Developed for the **Karnataka State Police (KSP) SCRB Datathon 2026**.  
*All Rights Reserved — State Crime Records Bureau (SCRB), Bengaluru, Karnataka.*
