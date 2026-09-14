# ISRO Privacy Browser Agent

A privacy-first browser automation prototype built for Smart India Hackathon.

**Problem Statement:** 26171 — On-device Visual Perception for Light-weight Browser Agents
**Organization:** Indian Space Research Organisation (ISRO)
**Theme:** Smart Automation

## Overview

AI browser agents typically work by sending a user's screen content to a remote AI model, which then decides what action to take next. This creates a privacy risk, since that screen content can contain sensitive personal information.

This project takes a different approach: perception and privacy filtering happen **locally, on the user's own device**. The browser extension reads the page, detects sensitive information (emails, phone numbers, passwords, card numbers, Aadhaar-style numbers, names, addresses), and redacts it before anything is transmitted. Only a sanitized summary is sent to a lightweight reasoning server, which returns a structured action. That action is validated locally before it is executed.

**Pipeline:** Perceive locally → Redact locally → Reason (on a local server) → Validate and act locally.

## Project structure

```
ISRO-BROWSER-AGENT/
├── extension/       Chrome extension (manifest.json, content.js, popup.html, popup.js)
├── server/          Local FastAPI reasoning server (main.py)
├── demo/            Demo webpage with fictional PII for testing
├── tests/           No-PII test page (false-positive check)
```

## Setup instructions

### 1. Prerequisites
- Python 3.x (with "Add to PATH" enabled during install)
- Node.js (for Live Server / general tooling)
- Google Chrome

### 2. Start the local reasoning server
```bash
cd server
python -m venv venv
.\venv\Scripts\Activate.ps1        # Windows PowerShell
pip install fastapi uvicorn
uvicorn main:app --reload
```
Server runs at `http://127.0.0.1:8000`. Leave this running.

### 3. Load the Chrome extension
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension` folder

### 4. Run the demo
1. Open `demo/demo.html` in Chrome (e.g. via Live Server at `127.0.0.1:5500/demo/demo.html`)
2. Open DevTools (F12) → Console to see the detection/sanitization/action pipeline live
3. Click the extension icon in the toolbar to view the **Privacy Dashboard**

## Privacy dashboard

The extension popup displays a live summary of each run:
- Local perception, PII detection, and redaction status
- Confirmation that no raw screenshot was ever sent
- Confirmation that only sanitized context was sent to the server
- The result of local action validation and execution
- Number of PII items detected
- End-to-end latency in milliseconds

## Testing

| Test | Page | PII Expected | Result |
|---|---|---|---|
| No PII | `tests/no_pii.html` | None | 0 items detected |
| Mixed PII | `demo/demo.html` | Name, email, phone, address, card, Aadhaar, password field, email field | 9 items detected |

**Metrics (on above test set):** 100% detection rate, 0% false positive rate, 8–15ms average latency.

## Scope

**Implemented:**
- Local, DOM-based page perception
- Rule-based PII detection (email, phone, password, card number, Aadhaar-style number, name, address)
- Local redaction — sensitive values never leave the device
- Lightweight local reasoning server (FastAPI)
- Local validation of any action before it is executed
- Privacy dashboard showing exactly what the system detected, sent, and did

**Out of scope for this prototype:**
- **OCR (image-based text detection):** Partially implemented — all required model files were bundled locally to satisfy the Chrome extension's security policy (Manifest V3 CSP). The implementation surfaced a deeper conflict between how the OCR library's worker threads load scripts and what the extension policy permits. This is documented here as a known limitation rather than shipped as a partially working feature.
- **On-device visual (pixel-level) perception, e.g. via ONNX Runtime Web / WebGPU:** Not attempted in this build. Identified as a natural next step for true visual perception, once the current DOM-based core is extended.

## Security notes
- Raw passwords, emails, phone numbers, card numbers, and Aadhaar-style numbers are never transmitted. Only sanitized labels (e.g. `[EMAIL]`, `[PASSWORD]`) are sent to the reasoning server.
- No screenshots are captured or transmitted as part of the core pipeline.
- Every action returned by the server is checked against an allowlist and validated locally before it is executed.
- All data used in the demo page is fictional and used solely for testing.

## Limitations

Detection rules are pattern-based (regex and field types) rather than a trained model, so they are tuned to the test data used here and would need broader coverage for production use on arbitrary real-world pages. Reported metrics reflect performance on this project's own test pages, not a general benchmark.
