function renderDashboard(data) {
if (!data) return;

document.getElementById("localPerception").textContent = data.localPerception ? "ON" : "OFF";
document.getElementById("localPerception").className = "value " + (data.localPerception ? "on" : "off");

document.getElementById("piiDetection").textContent = data.piiDetection ? "ON" : "OFF";
document.getElementById("piiDetection").className = "value " + (data.piiDetection ? "on" : "off");

document.getElementById("redaction").textContent = data.redaction ? "ON" : "OFF";
document.getElementById("redaction").className = "value " + (data.redaction ? "on" : "off");

document.getElementById("rawScreenshot").textContent = data.rawScreenshotSent ? "YES" : "NO";
document.getElementById("rawScreenshot").className = "value " + (data.rawScreenshotSent ? "off" : "on");

document.getElementById("sanitizedContext").textContent = data.sanitizedContext ? "YES" : "NO";
document.getElementById("sanitizedContext").className = "value " + (data.sanitizedContext ? "on" : "off");

document.getElementById("actionValidation").textContent = data.actionValidation;
document.getElementById("actionValidation").className = "value " + (data.actionValidation === "PASS" ? "on" : "off");

document.getElementById("execution").textContent = data.execution;
document.getElementById("execution").className = "value " + (data.execution === "PASS" ? "on" : "off");

document.getElementById("piiCount").textContent = data.piiCount;
document.getElementById("latency").textContent = data.latencyMs + " ms";
document.getElementById("lastRun").textContent = data.lastRun;
}

chrome.storage.local.get("dashboardData", (result) => {
renderDashboard(result.dashboardData);
});

document.getElementById("start").addEventListener("click", async () => {
const [tab] = await chrome.tabs.query({
active: true,
currentWindow: true
});

chrome.scripting.executeScript({
target: {tabId: tab.id},
files: ["content.js"]
});

setTimeout(() => {
chrome.storage.local.get("dashboardData", (result) => {
renderDashboard(result.dashboardData);
});
}, 1000);
});

document.getElementById("ocrBtn").addEventListener("click", async () => {
const statusEl = document.getElementById("ocrStatus");
statusEl.textContent = "Capturing screenshot...";

try {
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

chrome.tabs.captureVisibleTab(null, { format: "png" }, async (dataUrl) => {
if (chrome.runtime.lastError || !dataUrl) {
statusEl.textContent = "Screenshot failed: " + (chrome.runtime.lastError?.message || "unknown error");
return;
}

statusEl.textContent = "Reading text from image (this can take a few seconds)...";

try {
const result = await Tesseract.recognize(dataUrl, "eng", {
workerPath: chrome.runtime.getURL("worker.min.js"),
corePath: chrome.runtime.getURL("tesseract-core-simd-lstm.wasm.js"),
langPath: chrome.runtime.getURL(""),
gzip: false
});
const extractedText = result.data.text;

const emails = extractedText.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
const phones = extractedText.match(/(?:\+91[\s-]?)?[6-9]\d{9}/g) || [];
const cards = extractedText.match(/\b(?:\d[ -]?){13,16}\b/g) || [];

const foundCount = emails.length + phones.length + cards.length;

statusEl.textContent =
`OCR complete. Found ${foundCount} PII item(s) inside the image (Emails: ${emails.length}, Phones: ${phones.length}, Card-like: ${cards.length}).`;

console.log("OCR extracted text:", extractedText);
console.log("OCR PII found:", { emails, phones, cards });
} catch (ocrErr) {
statusEl.textContent = "OCR processing failed: " + ocrErr.message;
console.log("OCR error:", ocrErr);
}
});
} catch (err) {
statusEl.textContent = "Error: " + err.message;
}
});