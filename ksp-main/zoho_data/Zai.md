# Zoho Catalyst Agent Knowledge Base (AKB)

## Knowledge ID

CATALYST-ZIA-001

## Title

Zia AI Services & Intelligence Suite

## Source

Zoho Catalyst Workspace Screenshots (`Screenshot 2026-07-24 232427.png` through `Screenshot 2026-07-24 232540.png`)

## Evidence Level

Verified from Workspace UI & Platform Technical Specs

## Confidence

High

## Importance

Critical

---

# Purpose

The **Zia** module provides out-of-the-box machine learning, computer vision, document processing, and natural language processing capabilities within Zoho Catalyst. It enables serverless functions and client applications to execute complex AI inference tasks—such as biometric analysis, identity verification, content moderation, object localization, custom model prediction, and text sentiment extraction—without requiring external ML infrastructure or third-party AI API keys.

---

# Workspace Hierarchy

```text
Catalyst Project (KSPCrimeIntell)
└── Zia
    ├── IMAGE
    │   ├── Face Analytics (Age, Gender, Emotion, Advanced Detection)
    │   ├── OCR [BETA] (Text Extraction, Handwriting, Multi-Language)
    │   ├── Identity Scanner [BETA] (e-KYC, Aadhaar, PAN, Passbook, Cheque Verification)
    │   ├── Image Moderation (Explicit, Violence, Gore & Unsafe Content Detection)
    │   ├── Object Recognition (3D/2D Object Classification & Bounding Box Localization)
    │   └── Barcode Scanner (Barcodes & QR Code Parsing)
    │
    └── TEXT
        ├── Auto ML (Custom Model Training & Predictive Inference Pipelines)
        └── Text Analytics (Sentiment Analysis, Named Entity Recognition, Keyword Extraction)

```

---

# Verified UI Observations

### Active Module Group

* Zia AI Platform

### Image Intelligence Services

* **Face Analytics**: UI console provided with multi-language code templates (Java SDK, NodeJS SDK, Python SDK).
* Code snippet verified (`ZCFaceAnalyticsOptions` / `ZCML.getInstance().analyzeFace(file, options)`): Options include `.setAgeNeeded(true)`, `.setEmotionNeeded(true)`, `.setGenderNeeded(true)`, `.setAnalyseMode(ZCAnalyseMode.ADVANCED)`.


* **OCR [BETA]**: Character detection engine converting physical documents and images into digital text. Supports printed text, handwriting recognition, and multi-language parsing.
* **Identity Scanner [BETA]**: Ready-made e-KYC tool combining Zia OCR and Zia Facial Comparison. Directly targets legal document verification including Indian Aadhaar cards, PAN cards, bank passbooks, and cheques.
* **Image Moderation**: Safety classification engine detecting suggestive or explicit adult content, partial/full nudity, violence, gore, and bloodshed.
* **Object Recognition**: Computer vision service combining 3D modeling, component identification, and edge detection to perform multi-class object detection, image localization (bounding boxes), and confidence scoring.
* **Barcode Scanner**: Scanner service for extracting numeric/string data from 1D/2D barcodes and QR codes.

### Text & Predictive Machine Learning Services

* **Auto ML**: No-code/low-code model training workspace. Currently empty state ("Train your first Model").
* **Text Analytics**: Natural language processing service offering Sentiment Analysis, Named Entity Recognition (NER), and Keyword Extraction.

---

# Component Analysis

## 1. Computer Vision & Document Intelligence

### Face Analytics

* **Purpose**: Advanced facial feature parsing from uploaded image files or byte streams.
* **Outputs**: Facial count, age estimation, emotion detection (e.g., happy, sad, neutral), gender detection, and facial land-marking.
* **Best Use Cases**: User onboarding, demographic analytics, media tagging, security access verification.

### OCR (Optical Character Recognition)

* **Purpose**: Extracts structured and raw text from document scans, street signs, and images.
* **Capabilities**: Handles both clean machine-printed text and noisy human handwriting across multiple global languages.
* **Best Use Cases**: Invoice ingestion, automated form filling, document digitization pipelines.

### Identity Scanner (e-KYC)

* **Purpose**: Specialized composite engine combining OCR and Face Comparison for official identity proofing.
* **Capabilities**: Native validation templates for Indian national documents (Aadhaar, PAN) and financial instruments (Cheques, Passbooks).
* **Best Use Cases**: User identity verification, fintech onboarding, legal compliance, fraud detection.

### Image Moderation

* **Purpose**: Content safety gatekeeper to ensure user-uploaded images meet compliance guidelines.
* **Capabilities**: Automated flag generation for NSFW, adult content, graphic violence, and bloodshed.
* **Best Use Cases**: Profile picture uploads, social feed moderation, public forum uploads.

### Object Recognition

* **Purpose**: Detects and localizes individual objects within images.
* **Capabilities**: Multi-class tagging, boundary localization coordinates (bounding boxes), confidence percentages.
* **Best Use Cases**: Inventory counting, automated surveillance tagging, visual media cataloging.

---

## 2. Text Intelligence & Machine Learning

### Text Analytics

* **Purpose**: Unstructured text analysis engine converting natural language into structured insights.
* **Sub-Features**:
1. *Sentiment Analysis*: Determines tone (Positive, Negative, Neutral).
2. *Named Entity Recognition (NER)*: Categorizes tokens into people, organizations, locations, dates, and values.
3. *Keyword Extraction*: Highlights key topics and central themes.


* **Best Use Cases**: Customer support ticket routing, feedback/review classification, survey analysis.

### Auto ML

* **Purpose**: Custom machine learning pipeline builder to train, test, and deploy project-specific predictive models.
* **Best Use Cases**: Custom classification tasks, tabular data prediction, specialized domain scoring algorithms beyond default Zia capabilities.

---

# Architectural Model

```text
[ Incoming Image / Document / Text ]
                 │
                 ▼
       [ Serverless Function ]
                 │
  ┌──────────────┼──────────────────────────┬────────────────────────┐
  ▼              ▼                          ▼                        ▼
[ Zia Face ]   [ Zia Identity Scanner ]   [ Zia Image Moderation ] [ Zia Text Analytics ]
(Age, Emotion) (Aadhaar/PAN e-KYC)        (NSFW / Violence Check)  (Sentiment / NER)
  │              │                          │                        │
  └──────────────┴────────────┬─────────────┴────────────────────────┘
                              ▼
                [ Data Store / Event Bus ]

```

---

# Agent Reasoning Rules

Rule 1
IF the task requires verifying government identity documents (Aadhaar, PAN, Passbooks) or performing e-KYC
THEN call **Zia Identity Scanner**.

Rule 2
IF the task requires detecting faces, estimating age, or reading facial emotions
THEN use **Zia Face Analytics** with `ZCAnalyseMode.ADVANCED`.

Rule 3
IF extracting raw printed text or handwriting from generic images or documents
THEN use **Zia OCR**.

Rule 4
IF user-generated image content must be checked for explicit content, violence, or gore before saving
THEN pass the file through **Zia Image Moderation** prior to writing to **Stratus** or **File Store**.

Rule 5
IF bounding box positions or object classifications (e.g., cars, trees, items) are needed from an image
THEN execute **Zia Object Recognition**.

Rule 6
IF analyzing user feedback, support tickets, or survey text for sentiment and key entities
THEN run **Zia Text Analytics** (Sentiment + NER).

Rule 7
IF standard Zia APIs do not cover a specific prediction task and tabular ML models are needed
THEN train a custom model using **Zia Auto ML**.

---

# Decision Flow

```text
Need AI / Intelligence Logic?
│
├── Processing Images / Visual Media?
│   ├── Verifying Government ID / e-KYC? ───> Identity Scanner
│   ├── Reading Facial Traits / Emotion? ────> Face Analytics
│   ├── Extracting Text / Handwriting? ──────> OCR
│   ├── Moderating NSFW / Graphic Media? ───> Image Moderation
│   ├── Identifying Objects & Locations? ────> Object Recognition
│   └── Reading QR Codes / Barcodes? ────────> Barcode Scanner
│
└── Processing Text / Tabular Data?
    ├── Sentiment / Entities / Keywords? ────> Text Analytics
    └── Custom Machine Learning Model? ──────> Auto ML

```

---

# Design Philosophy

Zoho Catalyst embeds AI capabilities directly into its compute SDKs (`zcatalyst-sdk-node`, Java `ZCML`, Python SDK). Developers do not need to manage API tokens, external billing accounts, or complex python ML inference environments (like Torch or TensorFlow) for common AI tasks. All Zia processing executes within Catalyst's security boundaries, preserving data privacy while maintaining low latency between compute functions and AI engines.

---

# Knowledge Graph

```text
Zia Platform
├── Computer Vision
│   ├── Face Analytics ───────(Inference Via)──> Serverless Functions
│   ├── OCR ──────────────────(Feeds Into)────> Identity Scanner
│   ├── Identity Scanner ─────(Validates)─────> Data Store Records
│   ├── Image Moderation ────(Protects)──────> Stratus / File Store
│   ├── Object Recognition
│   └── Barcode Scanner
└── Text & Predictive Intelligence
    ├── Text Analytics ───────(Analyzes)──────> User Feedback / Chat Logs
    └── Auto ML ──────────────(Deploys To)────> Function Logic

```

---

# Agent Recommendations

* **e-KYC Processing**: Always prefer **Identity Scanner** over raw **OCR** when parsing structured ID proofs like Aadhaar or PAN, as Identity Scanner includes specialized document validation and facial matching logic out of the box.
* **Upload Moderation Pipeline**: Implement an automated trigger where file uploads to **Stratus** automatically trigger a serverless **Function** running **Image Moderation** before the file is marked as public or persistent.
* **Error Handling**: Account for confidence threshold scores returned in Zia responses (e.g., Object Recognition confidence ratings) to implement human-in-the-loop review fallback logic for low-confidence inference results.
* **SDK Import**: Import Zia modules via the official Catalyst SDK (`ZCML` in Java or equivalent Node/Python SDK instances) rather than invoking raw HTTP endpoints to ensure automated token rotation and request signing.

---

# Retrieval Tags

Catalyst, Zia, AI, Machine Learning, Face Analytics, OCR, Identity Scanner, e-KYC, Aadhaar, PAN, Image Moderation, Content Safety, Object Recognition, Barcode Scanner, Auto ML, Text Analytics, Sentiment Analysis, Named Entity Recognition, Computer Vision, NLP