Here is the structured Agent Knowledge Base (AKB) documentation compiled from your uploaded Zoho Catalyst **QuickML** console screenshots:

---

# Zoho Catalyst Agent Knowledge Base (AKB)

## Knowledge ID

CATALYST-QUICKML-001

## Title

QuickML & Generative AI Platform Overview (ML Pipelines, LLMs, RAG & NLP Models)

## Source

Zoho Catalyst Workspace Screenshots (`image_d805e0.png` through `image_d85b77.png`)

## Evidence Level

Verified from Workspace UI & Platform Technical Specs

## Confidence

High

## Importance

Critical

---

# Purpose

The **QuickML** module within Zoho Catalyst provides an end-to-end machine learning and generative AI orchestration platform. It enables developers to manage ML workflows (dataset ingestion, training pipelines, model hosting, inference endpoints) as well as modern Generative AI pipelines (LLM serving, Retrieval-Augmented Generation / RAG, vector Knowledge Bases, and pre-trained Zia NLP models).

---

# Workspace Hierarchy

```text
Catalyst Project (KSPCrimeIntell)
└── QuickML
    ├── CORE ML PIPELINE
    │   ├── Home (Overview Dashboard for Pipelines, Models & Datasets)
    │   ├── Datasets (Data Ingestion & Import Management)
    │   ├── Pipelines (Sequence of Workflow & ML Tasks)
    │   ├── Models (Trained Predictive Algorithms & Depicters)
    │   └── Endpoints (Published Inference Interfaces & Testing)
    │
    ├── GENERATIVE AI
    │   ├── LLM Serving (Hosted Foundation LLMs: GLM-4.7-Flash, Qwen 3.6-35B Vision, etc.)
    │   ├── RAG (Retrieval-Augmented Generation Pipeline Setup)
    │   └── Knowledge Base (Vectorized Document Store for Contextual AI Grounding)
    │
    └── ZIA (ADVANCED NLP)
        └── Trained NLP Models
            ├── Text-to-Audio Synthesis (Speech Generation)
            ├── Text Translation (Multi-Language Conversion)
            └── Audio-to-Text Transcription (Speech Recognition)

```

---

# Verified UI Observations

### Active Module Group

* QuickML (Machine Learning & Generative AI Suite)

### Core ML Services

* **Home**: Overview metrics for active Pipelines, Models, Recent Datasets, and Recent Pipelines.
* **Datasets**: Data repository hub supporting file uploads and imports directly from Zoho Services or third-party storage/cloud providers (e.g., AWS, GCP, Azure, Snowflake, BigQuery icons visible).
* **Pipelines**: Task/workflow sequence builder used to configure raw data into trained ML outputs.
* **Models**: Visual representation and registry of trained algorithms generating predictions based on ingested dataset structures.
* **Endpoints**: Deployment layer providing hosted interfaces to test and publish generated ML models for production API calls.

### Generative AI Services

* **LLM Serving**:
* Active Models: `GLM-4.7-Flash` (Mixture-of-Experts LLM) and `Qwen 3.6 - 35B Vision Language` (Multimodal MoE model with 3B active parameters).
* Platform Notice: Deprecation alert for `Qwen 2.5-14B Instruct`, `Qwen 2.5-7B Coder`, and `Qwen 2.5-7B Vision Language` models with a migration deadline set to **July 31, 2026**.


* **RAG (Retrieval-Augmented Generation)**: Orchestration flow combining LLMs with grounded internal documents to produce context-aware answers.
* Step 1: Select an LLM.
* Step 2: Upload documents (PDFs, text files, structured datasets) into the document store.
* Step 3: Query via chat interfaces.
* Step 4: Receive contextual answers retrieved from the vector store.


* **Knowledge Base**: Document repository backing RAG pipelines.
* Active Documents Verified: Multiple crime analytics PDFs uploaded (e.g., `crime 41`, `crime 39`, `crime 37`, `crime 42`, `crime 38`, `crime 40`, `crime 31`, `crime 36`) tagged with unique Document IDs (e.g., `Doc ID: 340700000004238`).
* Tools available: `RAG API` code access and `Upload` button.



### Zia Advanced NLP Services

* **Trained NLP Models**:
* **Text-to-Audio Synthesis**: Generates high-quality spoken audio from input text (supports multiple regional Indian languages).
* **Text Translation**: Translates text between source and target regional or global languages.
* **Audio-to-Text Transcription**: Transcribes audio speech recordings back into textual transcripts with domain-specific accuracy.



---

# Component Analysis

## 1. QuickML Core Engine

### Datasets

* **Purpose**: Centralized ingestion point for training data.
* **Capabilities**: Direct connectors to enterprise databases, Zoho platforms, S3/cloud storage, or CSV/JSON file uploads.

### Pipelines & Models

* **Purpose**: No-code/low-code workflow creation for feature engineering, model training, evaluation, and hyperparameter tuning.

### Endpoints

* **Purpose**: Managed API hosting for trained predictive models, providing REST endpoints with built-in versioning and testing consoles.

---

## 2. Generative AI Platform

### LLM Serving

* **Purpose**: Turnkey hosting of open/foundation Large Language Models and Vision-Language models without infrastructure management.
* **Best Use Cases**: Conversational agents, code generation, multimodal image parsing, and automated summarization.

### RAG & Knowledge Base

* **Purpose**: Grounding LLMs on enterprise internal documents (e.g., legal files, policy manuals, crime reports) to prevent hallucinations and enable semantic question answering.

---

## 3. Zia Speech & Translation NLP

### Speech & Translation Suite

* **Purpose**: Specialized multimodal NLP primitives tailored for multilingual communication and audio processing.
* **Best Use Cases**: Multilingual voice applications, automated call transcriptions, cross-language customer support, and local language accessibility.

---

# Architectural Model

```text
[ Data Sources / Documents / Audio ]
                  │
                  ▼
          [ QuickML Suite ]
                  │
   ┌──────────────┼─────────────────────────┬─────────────────────────┐
   ▼              ▼                         ▼                         ▼
[ Datasets ]  [ Knowledge Base ]   [ Foundation LLMs ]      [ Trained NLP Models ]
   │          (Vector Documents)   (GLM-4.7 / Qwen Vision)  (TTS / Transcription)
   ▼              │                         │                         │
[ Pipelines ]     └────────────┬────────────┘                         │
   │                           ▼                                      │
   ▼                        [ RAG ]                                   │
[ Models ]                     │                                      │
   │                           │                                      │
   └───────────────────────────┼──────────────────────────────────────┘
                               ▼
                       [ Endpoints / APIs ]
                               │
                               ▼
                   [ Serverless Applications ]

```

---

# Agent Reasoning Rules

Rule 1
IF a custom predictive/classification task requires raw data ingestion and custom model training
THEN import data via **Datasets**, build a workflow in **Pipelines**, train a **Model**, and publish an **Endpoint**.

Rule 2
IF the application requires querying custom enterprise documents (PDFs/Text) using AI natural language
THEN upload documents to the **Knowledge Base** and connect them through the **RAG** service using hosted **LLM Serving**.

Rule 3
IF text needs to be synthesized into natural spoken voice or audio speech needs transcribing
THEN use **Zia Trained NLP Models** (**Text-to-Audio Synthesis** or **Audio-to-Text Transcription**).

Rule 4
IF translating text across Indian regional or international languages
THEN call **Zia Text Translation**.

Rule 5
IF choosing an LLM model for Generative AI or RAG tasks
THEN prefer `GLM-4.7-Flash` or `Qwen 3.6 - 35B Vision Language` (and avoid deprecated models like `Qwen 2.5-14B` prior to the July 31, 2026 deprecation window).

---

# Decision Flow

```text
Need Machine Learning or Generative AI?
│
├── Custom Tabular / Predictive Model?
│   ├── Step 1: Upload ────────> Datasets
│   ├── Step 2: Configure ─────> Pipelines
│   ├── Step 3: Train ─────────> Models
│   └── Step 4: Deploy ────────> Endpoints
│
├── Document Q&A / Knowledge Grounding?
│   ├── Step 1: Upload Docs ───> Knowledge Base
│   ├── Step 2: Select Model ──> LLM Serving
│   └── Step 3: Query ─────────> RAG Pipeline
│
└── Language & Speech Processing?
    ├── Speech to Text ────────> Audio-to-Text Transcription
    ├── Text to Speech ────────> Text-to-Audio Synthesis
    └── Cross-Language ────────> Text Translation

```

---

# Retrieval Tags

QuickML, Generative AI, RAG, Knowledge Base, LLM Serving, GLM-4.7-Flash, Qwen Vision, Datasets, Pipelines, Models, Endpoints, Text-to-Audio Synthesis, Text Translation, Audio-to-Text Transcription, Vector Search, Catalyst AI