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

