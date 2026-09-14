console.log("ISRO Privacy Browser Agent loaded!");

function getPageElements() {
const elements = [];

document.querySelectorAll("button").forEach(button => {
elements.push({
type: "button",
text: button.innerText.trim()
});
});

document.querySelectorAll("input").forEach(input => {
elements.push({
type: "input",
inputType: input.type,
placeholder: input.placeholder
});
});

return elements;
}

function detectPII() {
const results = [];
const pageText = document.body.innerText;

const emails = pageText.match(
/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
);
if (emails) emails.forEach(value =>
results.push({type:"EMAIL", value})
);

const phones = pageText.match(
/(?:\+91[\s-]?)?[6-9]\d{9}/g
);
if (phones) phones.forEach(value =>
results.push({type:"PHONE", value})
);

const cards = pageText.match(
/\b(?:\d[ -]?){13,16}\b/g
);
if (cards) cards.forEach(value =>
results.push({type:"CARD_NUMBER", value})
);

const aadhaar = pageText.match(
/\b\d{4}\s?\d{4}\s?\d{4}\b/g
);
if (aadhaar) aadhaar.forEach(value =>
results.push({type:"AADHAAR_LIKE", value})
);

const addressMatch = pageText.match(
/Address:\s*(.+)/i
);
if (addressMatch) results.push({type:"ADDRESS", value: addressMatch[1]});

const nameMatch = pageText.match(
/Name:\s*(.+)/i
);
if (nameMatch) results.push({type:"NAME", value: nameMatch[1]});

document.querySelectorAll('input[type="password"]').forEach(() =>
results.push({type:"PASSWORD", value:"[PASSWORD]"})
);

document.querySelectorAll('input[type="email"]').forEach(() =>
results.push({type:"EMAIL_FIELD", value:"[EMAIL]"})
);

return results;
}

function createSanitizedContext() {
return detectPII().map(item => ({
type: item.type,
value: `[${item.type}]`
}));
}

function validateAction(action) {
const allowedActions = ["click", "scroll"];

if (!allowedActions.includes(action.action)) return false;

if (action.action === "click" && !action.target) return false;

return true;
}

function executeAction(action) {
if (action.action === "click") {
const buttons = document.querySelectorAll("button");

for (const button of buttons) {
if (
button.innerText.trim().toLowerCase() ===
action.target.toLowerCase()
) {
console.log("Executing safe action:", action);
button.click();
return;
}
}

console.log("Target not found:", action.target);
}
}

async function sendSanitizedContext() {
const startTime = performance.now();

const piiFound = detectPII();
const sanitized = createSanitizedContext();

const data = {
page_title: document.title,
elements: getPageElements(),
sanitized_context: sanitized
};

console.log("SAFE DATA BEING SENT:", data);

let result;
let actionValid = false;
let actionExecuted = false;

try {
const response = await fetch(
"http://127.0.0.1:8000/analyze",
{
method: "POST",
headers: {"Content-Type": "application/json"},
body: JSON.stringify(data)
}
);

result = await response.json();
console.log("SERVER ACTION:", result);

actionValid = validateAction(result);
if (actionValid) {
executeAction(result);
actionExecuted = true;
} else {
console.log("ACTION BLOCKED BY LOCAL VALIDATOR");
}
} catch (err) {
console.log("Server not reachable:", err);
}

const endTime = performance.now();
const latencyMs = Math.round(endTime - startTime);

const dashboardData = {
localPerception: true,
piiDetection: true,
redaction: true,
rawScreenshotSent: false,
sanitizedContext: true,
actionValidation: actionValid ? "PASS" : "BLOCKED",
execution: actionExecuted ? "PASS" : "NONE",
latencyMs: latencyMs,
piiCount: piiFound.length,
pageTitle: document.title,
lastRun: new Date().toLocaleTimeString()
};

chrome.storage.local.set({ dashboardData: dashboardData });
}

console.log("Local PII:", detectPII());
console.log("Sanitized:", createSanitizedContext());
sendSanitizedContext();