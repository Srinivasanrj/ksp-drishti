# Zoho Catalyst Agent Knowledge Base (AKB)

## Knowledge ID

CATALYST-CLOUDSCALE-001

## Title

Cloud Scale Suite Overview (Storage, Security, Triggers & Messaging)

## Source

Zoho Catalyst Workspace Screenshots (`Screenshot 2026-07-24 231616.jpg` through `Screenshot 2026-07-24 232233.png`)

## Evidence Level

Verified from Workspace UI & Platform Technical Specs

## Confidence

High

## Importance

Critical

---

# Purpose

The **Cloud Scale** module provides the persistence, security, integration, and communication primitives for Zoho Catalyst applications. It handles relational data storage, unstructured key-value stores, object bucket storage, in-memory caching, full-text indexing, authentication, API proxying, OAuth integrations, and background scheduled triggers.

---

# Workspace Hierarchy

```text
Catalyst Project (KSPCrimeIntell)
└── Cloud Scale
    ├── STORAGE
    │   ├── Data Store (Relational DB / ZCQL)
    │   ├── NoSQL (Document / Non-Relational DB)
    │   ├── File Store (Directory-based File System)
    │   ├── Stratus (Enterprise S3-compatible Object Storage)
    │   ├── Cache (In-Memory Key-Value Store / Segments)
    │   └── Search (Full-Text Search Engine on Indexed Data Store Columns)
    │
    ├── SECURITY & IDENTITY
    │   ├── Authentication (Hosted & Embedded Native Auth)
    │   ├── API Gateway (Routing, Throttling, & Authorization Proxy)
    │   └── Connections (OAuth / Third-Party Integration Credentials)
    │
    ├── TRIGGERS
    │   └── Cron (Scheduled Time-based Job Execution)
    │
    └── NOTIFY
        ├── Mail
        └── Push Notifications

```

---

# Verified UI Observations

### Active Module Group

* Cloud Scale

### Storage Sub-services

* **Data Store**: Active table `CrimeStatistics` (Table ID: `54626000000013072`).
* Columns: `ROWID` (bigint), `CREATORID` (bigint, indexed), `CREATEDTIME` (datetime, indexed), `MODIFIEDTIME` (datetime, indexed), `crime_month` (text), `crime_year` (bigint), `crime_category` (text), `crime_subcategory` (text), `case_count` (bigint).
* Schema flags available per column: `Search Indexed`, `Is Unique`, `Is Mandatory`, `PII/ePHI`.
* Additional tools: ZCQL Console, Scopes & Permissions, Data View.


* **NoSQL**: Table creation interface for schema-less / unstructured data.
* **File Store**: Folder-based file storage structure.
* **Stratus**: Bucket-based object storage for media and large binary data. Supports third-party migration.
* **Cache**: In-memory caching grouped into Segments. Default Segment ID `54626000000013067` created by default.
* **Search**: Built-in full-text search over indexed Data Store columns. Node.js SDK snippet verified (`catalyst.initialize(req).search().executeSearchQuery(...)`). Columns currently indexed: `CrimeStatistics.CREATORID`.

### Security & Identity Sub-services

* **Authentication**: Native Catalyst Auth supporting Hosted Login and Embedded Login.
* **API Gateway**: Edge router between clients and Basic/Advanced I/O functions or Web Clients. Handles routing, throttling, and authentication.
* **Connections**: Integration hub managing OAuth tokens and credentials for internal/external service connections.

### Triggers & Notifications Sub-services

* **Cron**: Time-based scheduler to invoke functions or third-party HTTP endpoints.
* **Mail**: Native email notification engine.
* **Push Notifications**: Native push messaging engine.

---

# Component Analysis

## 1. Storage Services

### Data Store (Relational)

* **Purpose**: Managed relational database queried via ZCQL (Zoho Catalyst Query Language).
* **Characteristics**: Fixed schemas, row-level auto metadata (`ROWID`, `CREATORID`, `CREATEDTIME`, `MODIFIEDTIME`), default search indexing controls, PII/ePHI compliance tagging.
* **Best Use Cases**: Structured domain data, relational entities, transactional records (e.g., `CrimeStatistics`).

### NoSQL

* **Purpose**: Document/non-relational database for unstructured or flexible schemas.
* **Best Use Cases**: Dynamic metadata, variable JSON documents, fast horizontal scaling scenarios.

### File Store

* **Purpose**: Directory and folder-based file management system for application assets.
* **Best Use Cases**: Categorized static assets, hierarchical user file uploads, application documents.

### Stratus (Object Storage)

* **Purpose**: S3-compatible, bucket-level binary object storage for large-scale media and files.
* **Best Use Cases**: Media hosting, enterprise backups, raw data dumps, large compliance-heavy file storage.

### Cache

* **Purpose**: High-speed, in-memory key-value caching organized by Segments.
* **Best Use Cases**: Session management, rate-limiting counters, temporary API responses, frequently accessed database query results.

### Search Engine

* **Purpose**: Distributed text search interface across indexed Data Store columns.
* **Best Use Cases**: Global search bars, multi-column text queries, filtering records without raw ZCQL `LIKE` overhead.

---

## 2. Security & Identity Services

### Authentication

* **Purpose**: Managed identity provider (IdP) for end-user auth.
* **Deployment Modes**:
* *Hosted Login*: Pre-built, Catalyst-hosted login/signup interface.
* *Embedded Login*: Custom UI embedded directly into client applications using Catalyst SDKs.



### API Gateway

* **Purpose**: Unified entry point for client requests targeting Catalyst Functions or Web Clients.
* **Key Capabilities**: Request routing, IP/Time-based rate limiting & throttling, automatic JWT/API-key verification, endpoint abstraction.

### Connections

* **Purpose**: Credential vault for OAuth 2.0 and API keys required when connecting Catalyst Functions to Zoho apps or third-party APIs.

---

## 3. Triggers & Notification Services

### Cron

* **Purpose**: Automated time-based job scheduler.
* **Targets**: Internal Catalyst Functions, AppSail apps, or external HTTP webhooks.

### Mail & Push Notifications

* **Purpose**: Out-of-the-box communication channels for email alerts and mobile/browser notifications without third-party gateways (e.g., SendGrid/Twilio).

---

# Architectural Model

```text
[ Client / Web Browser / Mobile App ]
                 │
                 ▼
          [ API Gateway ]  ◄── (Secured by: Native Authentication)
                 │
        ┌────────┴────────┐
        ▼                 ▼
  [ Functions ]      [ AppSail ]
        │                 │
        ├─────────────────┼────────────────────────┐
        ▼                 ▼                        ▼
  [ Data Store ]     [ Cache ]            [ Stratus / File Store ]
 (ZCQL / Search)  (Segment Cache)        (Binary / Bucket Storage)
        │
        ▼
   [ Trigger ] ───> [ Cron ] ───> [ Mail / Push Notification ]

```

---

# Agent Reasoning Rules

Rule 1
IF structured data with fixed columns or relational links is needed
THEN use **Data Store** and query via ZCQL.

Rule 2
IF schema flexibility or arbitrary JSON objects are needed
THEN use **NoSQL**.

Rule 3
IF large binary files, media, or enterprise backups are being stored
THEN use **Stratus** (Bucket Storage).

Rule 4
IF folder/directory structured application files are needed
THEN use **File Store**.

Rule 5
IF transient data or fast key-value lookup is needed to reduce database load
THEN store items in **Cache** under specific **Segments**.

Rule 6
IF performing full-text search across database text fields
THEN enable `Search Indexed` on the column in **Data Store** and execute via **Search SDK**.

Rule 7
IF protecting backend functions from request spikes or unauthorized access
THEN deploy an **API Gateway** route with throttling and authentication enabled.

Rule 8
IF integrating with Zoho APIs or external OAuth services from Functions
THEN manage authorization tokens inside **Connections**.

Rule 9
IF executing asynchronous tasks on a recurring schedule (e.g., daily cleanup, report generation)
THEN configure a **Cron** trigger.

---

# Decision Flow

```text
Need Storage?
│
├── Relational / SQL? ─────────> Data Store
├── Flexible JSON Documents? ─> NoSQL
├── In-Memory Fast Lookup? ────> Cache (Segment)
├── Full-Text Search? ─────────> Search (Index Column first)
├── Folders & App Files? ──────> File Store
└── Large Objects / Buckets? ──> Stratus

Need API Security & Orchestration?
│
├── End-User Login? ───────────> Authentication (Hosted or Embedded)
├── Rate Limits / Routing? ────> API Gateway
└── Third-Party OAuth Keys? ───> Connections

Need Automation or Messaging?
│
├── Scheduled Tasks? ──────────> Cron
├── Send Emails? ──────────────> Mail Service
└── Push Alerts? ──────────────> Push Notifications

```

---

# Design Philosophy

Zoho Catalyst's **Cloud Scale** tier abstracts core cloud infrastructure into managed serverless primitives. Instead of provisioning database instances, Redis nodes, or S3 buckets manually, developers allocate resources declaratively through the console or CLI. Security (Auth, Gateway, Security Rules) and Storage (Data Store, Stratus, Cache) are natively coupled, ensuring zero-trust access control without custom networking middleware.

---

# Knowledge Graph

```text
Cloud Scale
├── Storage
│   ├── Data Store ──(Indexed By)──> Search
│   ├── NoSQL
│   ├── File Store
│   ├── Stratus
│   └── Cache (Segments)
├── Security & Identity
│   ├── Authentication ──(Validates)──> API Gateway
│   ├── API Gateway ─────(Routes To)──> Serverless Functions
│   └── Connections
├── Triggers
│   └── Cron ────────────(Invokes)───> Serverless Functions
└── Notify
    ├── Mail
    └── Push Notifications

```

---

# Agent Recommendations

* **Data Store Indexing**: Explicitly enable `Search Indexed` on text columns in Data Store if they will be queried via the `Search` API.
* **Cache Scoping**: Always organize cached keys under explicit `Segments` rather than dumping all keys into default namespaces.
* **API Defense**: Never expose raw serverless Function endpoints directly to public web clients; always front them with **API Gateway** to enforce rate limiting and authentication rules.
* **Credential Storage**: Never hardcode API keys or OAuth secrets inside Node.js, Python, or Java Function code; store them inside **Connections**.
* **Compliance**: Enable `PII/ePHI` flags on sensitive Data Store columns (e.g., citizen IDs, personal identifiers) to enforce platform compliance safeguards.

---

# Retrieval Tags

Catalyst, Cloud Scale, Data Store, ZCQL, NoSQL, File Store, Stratus, Cache, Segments, Search, Authentication, API Gateway, Connections, Cron, Mail, Push Notifications, Storage, Relational Database, Rate Limiting, Throttling