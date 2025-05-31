from typing import Any, Optional
import httpx
import os
from mcp.server.fastmcp import FastMCP
from typing import Annotated
from pydantic import Field

# Environment variables for security
SCRIPT_URL = os.environ.get(
    "SCRIPT_URL"
)
SECRET_KEY = os.environ.get("SECRET_KEY")

# Initialize FastMCP server
mcp = FastMCP("jobsheet")

@mcp.tool()
def append_job_row(
    company: Annotated[str, Field(description="Company name")],
    role: Annotated[str, Field(description="Job title")],
    description: Annotated[
        Optional[str],
        Field(
            description="Job description and software qualifications, always include the responsibilities, minimum requirements and additional qualifications verbatim. there is no character limit in any of the fields"
        ),
    ],
    date: Annotated[
        Optional[str], Field(description="Current date in MM/DD/YYYY format")
    ],
    source: Annotated[
        Optional[str], Field(description="Source of the job posting")
    ],
) -> str:
    """
    Append a row to the Google Sheet via your Apps Script webhook.
    """
    payload = {
        "secret": SECRET_KEY,
        "company": company,
        "role": role,
        "description": description or "",
        "date": date or "",
        "source": source or "",
    }
    resp = httpx.post(SCRIPT_URL, json=payload)
    resp.raise_for_status()
    return resp.text

# Export the FastAPI app for Vercel
app = mcp.app

# For Vercel serverless functions
def handler(request):
    return app(request)