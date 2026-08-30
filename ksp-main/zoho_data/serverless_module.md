# Zoho Catalyst Agent Knowledge Base (AKB)

## Knowledge ID
CATALYST-SERVERLESS-001

## Title
Serverless Module Overview

## Source
Zoho Catalyst Workspace Screenshot

## Evidence Level
Verified from Workspace UI

## Confidence
High

## Importance
Critical

---

# Purpose

The **Serverless** module in Zoho Catalyst provides managed backend compute services. It separates short-lived event-driven execution (Functions) from long-running application hosting (AppSail), while Security Rules provide authorization and access control.

---

# Workspace Hierarchy

Catalyst Project
└── Serverless
    ├── Functions (FaaS)
    ├── Security Rules
    └── AppSail (Managed Compute)

---

# Verified UI Observations

### Active Module
- Serverless

### Available Components
- Functions
- Security Rules
- AppSail

### Current State
- No functions have been created.
- The dashboard displays a "Create Function" action.

### Supported Function Languages
- Java
- Node.js
- Python

### Project
- KSPCrimeIntell...

---

# Component Analysis

## Functions

### Purpose
Serverless Function-as-a-Service (FaaS) used for executing backend business logic.

### Best Use Cases
- REST APIs
- Webhooks
- Scheduled Jobs (Cron)
- Event Processing
- Database Operations
- Authentication Logic
- Notification Services

### Characteristics
- Stateless
- Auto Scaling
- Event Driven
- Short Execution Time
- Managed Runtime

---

## Security Rules

### Purpose
Controls authorization and access policies across Catalyst resources.

### Responsibilities
- Role-Based Access Control
- Permission Enforcement
- Resource Protection
- API Authorization
- Data Access Validation

---

## AppSail

### Purpose
Managed hosting environment for long-running backend applications.

### Best Use Cases
- Express.js
- FastAPI
- Flask
- Django
- Spring Boot
- Full REST APIs
- Persistent Backend Services

### Characteristics
- Long-running process
- Custom server
- Continuous execution
- Suitable for full-stack deployments

---

# Architectural Model

Serverless
├── Functions
│   ├── Java
│   ├── Node.js
│   └── Python
│
├── Security Rules
│
└── AppSail

Functions are intended for event-driven compute, while AppSail hosts continuously running applications.

---

# Agent Reasoning Rules

Rule 1
IF the user needs a lightweight backend endpoint
THEN recommend **Functions**.

Rule 2
IF the user needs a webhook
THEN recommend **Functions**.

Rule 3
IF the user needs scheduled execution
THEN recommend **Functions**.

Rule 4
IF the user needs a continuously running backend server
THEN recommend **AppSail**.

Rule 5
IF the user is deploying Flask, Django, Express, FastAPI, or Spring Boot
THEN recommend **AppSail**.

Rule 6
IF access control or permissions are required
THEN configure **Security Rules**.

---

# Decision Flow

Need Backend Logic?
│
├── Short-lived / Event-driven?
│       └── Functions
│
└── Long-running Application?
        └── AppSail

Need Authorization?
└── Security Rules

---

# Design Philosophy

Zoho Catalyst separates backend compute into two distinct models:

1. **Functions** for stateless, event-driven business logic.
2. **AppSail** for persistent application hosting.

This separation enables:
- Independent deployment
- Better scalability
- Lower operational overhead
- Cost optimization
- Modular microservice architecture

---

# Knowledge Graph

Catalyst
├── Serverless
│   ├── Functions
│   ├── Security Rules
│   └── AppSail
├── Datastore
├── File Store
├── Authentication
├── Cache
├── Event Bus
├── Search
└── Monitoring

---

# Agent Recommendations

When working inside a Catalyst project:

- Prefer **Functions** for APIs, business logic, webhooks, scheduled jobs, and lightweight backend processing.
- Prefer **AppSail** for complete backend services that require a continuously running server.
- Always enforce authorization using **Security Rules** when exposing protected resources.
- Keep business logic modular and avoid placing lightweight event-driven tasks inside long-running applications.
- Design solutions using Catalyst managed services instead of monolithic architectures whenever possible.

---

# Retrieval Tags

Catalyst, Serverless, Functions, FaaS, AppSail, Security Rules, Java, Node.js, Python, Backend, REST API, Webhook, Cron, Event Processing, Compute, Authorization, Access Control, Managed Runtime