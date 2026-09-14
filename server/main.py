from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="ISRO Privacy Browser Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class AgentRequest(BaseModel):
    page_title: str
    elements: list
    sanitized_context: list

@app.get("/")
def home():
    return {
        "status": "running",
        "message": "ISRO Browser Agent Server"
    }

@app.post("/analyze")
def analyze(request: AgentRequest):
    for element in request.elements:
        if (
            element.get("type") == "button"
            and element.get("text", "").lower() == "next"
        ):
            return {
                "action": "click",
                "target": "Next",
                "reason": "Safe Next button detected"
            }

    return {
        "action": "none",
        "target": None,
        "reason": "No safe action found"
    }