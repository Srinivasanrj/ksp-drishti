# Zoho Catalyst Agent Knowledge Base (AKB)

## Knowledge ID
CATALYST-ADDITIONAL-001

## Title
Additional Services & QuickML Pipeline — Extended Platform Analysis

## Source
Zoho Catalyst Workspace UI Screenshots (Additional Services Panel) + QuickML Pipeline Architecture

## Evidence Level
Verified from Workspace UI (Screenshot) + Platform Technical Specs

## Confidence
High

## Importance
Critical

---

# Purpose

This document covers five additional Zoho Catalyst platform services discovered from the workspace UI — **DevOps**, **SmartBrowz**, **ConvoKraft**, **Signals**, and **Slate** — as well as an expanded analysis of the **QuickML Pipeline** (Datasets -> Pipelines -> Models -> Endpoints) workflow applicable to building a crime prediction engine for the KSP Sentinel platform.

---

# Workspace Hierarchy (Full Platform Map)

```text
Catalyst Project (KSPCrimeIntell)
|
|-- QuickML                        [documented: Quick_ml.md]
|   |-- Core ML Pipeline
|   |   |-- Datasets
|   |   |-- Pipelines              <- NEW: Expanded analysis below
|   |   |-- Models
|   |   `-- Endpoints
|   |-- Generative AI (LLM, RAG, Knowledge Base)
|   `-- Zia NLP (TTS, ASR, Translation)
|
|-- Zia AI                         [documented: Zai.md]
|   |-- Image (Face, OCR, Identity, Moderation, Objects, Barcode)
|   `-- Text (Auto ML, Text Analytics)
|
|-- Cloud Scale                    [documented: cloud_scale.md]
|   |-- Storage (Data Store, NoSQL, File Store, Stratus, Cache, Search)
|   |-- Security (Auth, API Gateway, Connections)
|   |-- Triggers (Cron)
|   `-- Notify (Mail, Push)
|
|-- Serverless                     [documented: serverless_module.md]
|   |-- Functions (FaaS -- Python, Node.js, Java)
|   |-- Security Rules
|   `-- AppSail (Long-running PaaS)
|
|-- DevOps                         <- NEW (this document)
|-- SmartBrowz                     <- NEW (this document)
|-- ConvoKraft                     <- NEW (this document)
|-- Signals                        <- NEW (this document)
`-- Slate                          <- NEW (this document)
```

---

# Part 1 - Additional Services Analysis

---

## Service 1: DevOps

### Platform Description
> "Access our application monitoring, integration and testing tools."

### Purpose
Provides the operational observability, CI/CD integration, and testing infrastructure for Catalyst applications. It is the platform inner-loop developer toolchain -- monitoring function invocations, tracking errors, managing deployment pipelines, and running integration tests without leaving the Catalyst console.

### Capabilities
| Capability Area | Description |
|---|---|
| **Application Monitoring** | Real-time metrics on Function invocations, latency, error rates, memory usage |
| **Integration Tools** | Connectors for CI/CD pipelines (GitHub Actions, Bitbucket, GitLab) |
| **Testing Tools** | Function invocation test console, endpoint health checks, mock request builder |
| **Logging** | Centralized structured log aggregation across Functions and AppSail |
| **Alerts** | Threshold-based alerting for failures, latency breaches, resource limits |

### KSP Sentinel Applicability
| Use Case | Fit | Notes |
|---|---|---|
| Monitor chat API latency | HIGH | Track /chat endpoint response times in production |
| Alert on LLM call failures | HIGH | Get notified when GLM-4.7 returns errors |
| Test new Function endpoints | MEDIUM | Before deploying new analytics agents |
| CI/CD for AppSail (Flask backend) | MEDIUM | Automate backend deployment on push |

### Agent Reasoning Rules
- IF deploying to production and need uptime monitoring -> DevOps Monitoring
- IF running automated tests on Functions before release -> DevOps Testing Tools
- IF connecting a Git repository for automated deploy on commit -> DevOps Integration

---

## Service 2: SmartBrowz

### Platform Description
> "Connect and manage headless browsers in Catalyst cloud."

### Purpose
Provides a cloud-hosted headless browser automation environment. SmartBrowz runs real browser instances (Chromium-based) inside Catalyst infrastructure -- enabling web scraping, screenshot capture, PDF generation from URLs, form automation, and end-to-end browser testing -- all triggered from Serverless Functions without managing browser binary installations.

### Capabilities
| Capability | Description |
|---|---|
| **Headless Browser Instances** | Cloud-managed Chromium browser instances on demand |
| **Web Scraping** | Extract structured data from rendered (JavaScript-heavy) web pages |
| **Screenshot Capture** | Capture full-page or viewport screenshots of any URL |
| **PDF Generation** | Render any URL or HTML content to a PDF document |
| **Form Automation** | Programmatically fill and submit web forms |
| **E2E Testing** | Automated browser test scripts (Playwright/Puppeteer-compatible) |
| **Session Management** | Stateful browser sessions across multiple page interactions |

### KSP Sentinel Applicability
| Use Case | Fit | Notes |
|---|---|---|
| Scrape public crime news from Karnataka news portals | HIGH | Better than RSS -- handles JS-rendered pages |
| Auto-generate PDF reports of crime dashboards | HIGH | Render the React dashboard to PDF for officer briefings |
| Scrape court order portals or NCRB publications | MEDIUM | Extract structured data from government portals |
| Capture evidence screenshots from social media posts | MEDIUM | Screenshot archival for investigation records |

### Agent Reasoning Rules
- IF the target page renders via JavaScript and RSS/fetch fails -> SmartBrowz (not requests)
- IF generating a styled PDF from a rendered dashboard URL -> SmartBrowz (not jsPDF)
- IF testing frontend UI flows automatically -> SmartBrowz E2E tests

---

## Service 3: ConvoKraft

### Platform Description
> "Create and embed conversational bots in your application."

### Purpose
A no-code / low-code conversational bot builder native to Zoho Catalyst. Enables creation of rule-based, NLP-powered, or LLM-backed chatbot flows that can be embedded directly into web applications, mobile apps, or messaging channels. Works in conjunction with QuickML LLM Serving and Knowledge Base for context-aware answers.

### Capabilities
| Capability | Description |
|---|---|
| **Bot Flow Builder** | Visual drag-and-drop conversation flow designer |
| **LLM Integration** | Connect bots to hosted GLM-4.7-Flash or Qwen models |
| **Knowledge Base Grounding** | Wire bot to existing RAG Knowledge Base for document Q&A |
| **Embedding** | Embed bot widget into any web/mobile application via SDK |
| **Multichannel** | Deploy on web chat, WhatsApp, Slack, or custom channels |
| **Intent Recognition** | Built-in NLP for intent matching without custom ML |
| **Conversation State** | Maintains multi-turn conversation context natively |
| **Handoff Logic** | Escalate to human agent or external system when bot confidence is low |

### KSP Sentinel Applicability
| Use Case | Fit | Notes |
|---|---|---|
| Replace current stateless /chat with a ConvoKraft bot | CRITICAL | Solves the context-aware conversation gap identified in eval |
| e-Complaint guided intake bot | HIGH | Walk complainant through FIR filing step-by-step |
| Multilingual (Kannada + English) bot | HIGH | Native LLM + Zia TTS/ASR handles both |
| Bot for public citizen crime reporting | MEDIUM | Embeddable public-facing widget |

> NOTE: ConvoKraft directly solves the #4 most critical gap from the problem statement eval -- context-aware conversations. Current project is stateless; ConvoKraft maintains session state natively without custom session management code.

### Agent Reasoning Rules
- IF building a multi-turn conversational interface -> ConvoKraft (not a custom stateless /chat endpoint)
- IF needing Kannada + English voice bot -> ConvoKraft + Zia TTS/ASR
- IF guided user intake forms (complaint/FIR) -> ConvoKraft flow builder

---

## Service 4: Signals

### Platform Description
> "Modernize your application with our serverless event bus service."

### Purpose
Catalyst Signals is a fully managed, serverless event bus / message broker. It decouples producers (event publishers) from consumers (event handlers) using a publish-subscribe model -- similar to AWS EventBridge or Google Pub/Sub. It enables real-time event-driven architectures where different services react to events without polling or direct coupling.

### Capabilities
| Capability | Description |
|---|---|
| **Event Publishing** | Emit custom events from Functions, AppSail, or external webhooks |
| **Event Subscriptions** | Subscribe Functions or endpoints to specific event types |
| **Fan-out** | One event triggers multiple subscriber Functions simultaneously |
| **Event Filtering** | Route events to specific handlers based on payload attributes |
| **Guaranteed Delivery** | At-least-once delivery with retry semantics |
| **Dead Letter Queue** | Failed events captured for inspection and reprocessing |
| **Async Decoupling** | Producers do not wait for consumer completion |

### KSP Sentinel Applicability
| Use Case | Fit | Notes |
|---|---|---|
| Crime alert pipeline: new case -> trigger analysis -> alert officer | CRITICAL | Event-driven early warning system (solves problem statement goal #5) |
| New complaint submitted -> trigger NLP analysis + route to station | HIGH | Decoupled complaint processing pipeline |
| News article ingested -> trigger RAG indexing + pattern match | HIGH | Live intelligence pipeline |
| Mule trail detection -> trigger financial fraud alert | MEDIUM | Multi-step fraud detection chain |
| Sync Data Store writes -> invalidate Cache segments | MEDIUM | Cache coherency without polling |

### Agent Reasoning Rules
- IF any two services need to communicate without direct HTTP calls -> Signals
- IF building a real-time alert/notification pipeline -> Signals (emit event -> Function -> Mail/Push)
- IF scaling a multi-step processing workflow -> Signals fan-out pattern

---

## Service 5: Slate

### Platform Description
> "Deploy your client applications seamlessly with Slate."

### Purpose
Catalyst Slate is a managed static/SPA hosting platform -- the Catalyst-native equivalent of Netlify, Vercel, or Firebase Hosting. It hosts client-side applications (React, Vue, Angular, plain HTML/JS) on Catalyst CDN infrastructure with zero server configuration.

### Capabilities
| Capability | Description |
|---|---|
| **Static Site Hosting** | Host HTML, CSS, JS, and asset files on global CDN |
| **SPA Support** | React, Vue, Angular apps with client-side routing support |
| **Custom Domains** | Map custom domain names to hosted applications |
| **Automatic HTTPS** | TLS certificates provisioned and managed automatically |
| **Build Integration** | Connect to Git repos for automatic build-on-push |
| **CDN Distribution** | Global edge network for low-latency asset delivery |
| **Versioned Deployments** | Rollback to previous deployment versions |
| **Environment Variables** | Inject build-time environment variables |

### KSP Sentinel Applicability
| Use Case | Fit | Notes |
|---|---|---|
| Host the Vite/React frontend (current frontend/ directory) | CRITICAL | Replace running npm run dev locally -- production hosting |
| Serve officer-facing dashboard on ksp-sentinel.catalyst.zoho.com | HIGH | Secure HTTPS out of the box |
| Roll back a broken frontend build instantly | HIGH | Versioned deployments |
| Host public e-Complaint portal as a separate Slate app | MEDIUM | Separate public-facing from internal officer portal |

> Deployment Plan: Frontend (D:\DATATHON\DATATHON\frontend) -> npm run build -> upload dist/ to Slate. Backend Flask app -> AppSail. This completes the full production deployment of KSP Sentinel on Catalyst infrastructure.

---

# Part 2 - QuickML Pipeline (Expanded Analysis)

## What the Pipeline Actually Does

The QuickML Pipeline is a no-code ML workflow orchestrator. It takes raw tabular data through a sequence of processing stages to produce a trained, deployable prediction model.

### Pipeline Stages

```text
[Datasets] -> [Pipeline Tasks] -> [Trained Model] -> [Endpoint (REST API)]
```

| Stage | Description | Applicable Tools |
|---|---|---|
| **Data Ingestion** | Import CSV/JSON from local upload, S3, BigQuery, Snowflake, Zoho Analytics | Upload CrimeStatistics monthly data |
| **Data Preprocessing** | Handle missing values, normalize, encode categoricals, feature engineering | Auto-handled by QuickML |
| **Algorithm Selection** | Auto-select or manually choose: Regression, Classification, Time-Series Forecasting | Select Time-Series Forecasting for crime prediction |
| **Training** | Automated hyperparameter tuning, cross-validation | Platform managed |
| **Model Evaluation** | Accuracy, RMSE, confusion matrix, feature importance scores | Visible in QuickML dashboard |
| **Endpoint Deployment** | One-click publish as REST API endpoint | Callable from Flask backend or Functions |

### KSP Sentinel Crime Prediction Pipeline

```text
Input Dataset: CrimeStatistics (Month, Year, Crime_Category, Subcategory, Cases)
      |
      v
[QuickML Dataset Upload]
      |
      v
[Pipeline: Time-Series Forecasting Task]
  - Feature: crime_month, crime_year, crime_category
  - Target: case_count
  - Algorithm: Auto (ARIMA / Prophet / XGBoost TS)
      |
      v
[Trained Model: Crime Volume Forecaster]
      |
      v
[Endpoint: POST /predict -> { category, month, year } -> { predicted_cases }]
      |
      v
[Flask Route: /api/predict_crime -> calls QuickML Endpoint]
      |
      v
[Frontend: Predictive Analytics Panel]
```

This directly fills the Predictive analytics & early warnings gap from the problem statement evaluation -- currently rated NOT MET.

---

# Part 3 - Gap Closure Map (Problem Statement vs. Catalyst Services)

| Problem Statement Gap | Catalyst Service That Closes It | Effort |
|---|---|---|
| Context-aware conversations (NOT MET) | ConvoKraft | Low -- embed bot, replace /chat |
| Predictive analytics (NOT MET) | QuickML Pipeline -> Time-Series Model | Medium -- upload data, configure pipeline |
| Proactive crime prevention alerts (NOT MET) | Signals Event Bus -> Push Notifications | Medium -- publish event on threshold breach |
| Role-based secure access (PARTIAL) | Cloud Scale Auth + Security Rules | Medium |
| Kannada NL querying (PARTIAL) | Zia NLP (Translation + ASR) + ConvoKraft | Medium |
| Criminal network visualization real data (NOT MET) | QuickML Auto ML + Data Store new tables | High |
| Production hosting (dev-only now) | Slate (frontend) + AppSail (backend) | Low -- build and deploy |
| Live news monitoring quality | SmartBrowz (replaces RSS) | Low -- targeted scrape |
| Audit trail (PARTIAL) | Data Store audit_log table + DevOps logging | Low |

---

# Architectural Model (Full Catalyst-Native KSP Sentinel)

```text
[ Karnataka Police Officer / Citizen ]
              |
              v
       [ Slate -- React Frontend ]
              |
    +---------+-----------+
    v                     v
[ConvoKraft Bot]    [AppSail -- Flask Backend]
(Kannada + English)       |
    |             +-------+-------+------------------+
    |             v       v                          v
    |      [QuickML RAG] [Data Store]   [QuickML Endpoint]
    |      (Crime PDFs)  (ZCQL Queries) (Crime Prediction)
    |             |       |
    |             +-------+----> [Signals Event Bus]
    |                               |
    |                    +----------+----------+
    |                    v                     v
    |            [Serverless Functions]  [Mail / Push Alert]
    |            (Analysis, NLP, Zia)    (Early Warning)
    |
    +--> [SmartBrowz] (News Scraping -> Intelligence Feed)
    +--> [DevOps] (Monitoring, Alerts, Logging)
```

---

# Retrieval Tags

Catalyst, DevOps, SmartBrowz, ConvoKraft, Signals, Slate, Event Bus, Headless Browser, Conversational Bot, SPA Hosting, CDN, QuickML, Pipeline, ML Workflow, Time-Series Forecasting, Crime Prediction, Predictive Analytics, Early Warning, KSP Sentinel, Karnataka Police, Production Deployment

---

## Knowledge Cross-References

| Document | ID | Coverage |
|---|---|---|
| Quick_ml.md | CATALYST-QUICKML-001 | LLM, RAG, Knowledge Base, Zia NLP |
| Zai.md | CATALYST-ZIA-001 | Face, OCR, Identity, Object, Text Analytics |
| cloud_scale.md | CATALYST-CLOUDSCALE-001 | Storage, Auth, API Gateway, Cron, Notify |
| serverless_module.md | CATALYST-SERVERLESS-001 | Functions, AppSail, Security Rules |
| console_test.md | -- | OAuth Self Client / Token Exchange Flow |
