# tools to install:
# install streamlit openai requests
#/Users/akhil/.pyenv/versions/3.10.11/bin/python -m pip install streamlit --upgrade
#/Users/akhil/.pyenv/versions/3.10.11/bin/streamlit run mcp_tool_orchestrator.py

# can be extended to scale to any number of tools
# MCP token for confluence
# https://id.atlassian.com/manage-profile/security/api-tokens


import streamlit as st
import requests
from openai import OpenAI
from requests.auth import HTTPBasicAuth

import os

client = OpenAI(api_key="")

# Tool 1: GitHub repo fetcher
def get_github_repo_info(repo_full_name):
    #url = f"https://api.github.com/repos/{repo_full_name}"
    url = "https://api.github.com/repos/akkhil2012/ArtificialIntelligence"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    return {"error": f"GitHub error: {response.status_code}"}

# Tool 2: Dummy REST API
def get_dummy_posts():
    url = "https://dummy.restapiexample.com/"
    response = requests.get(url)
    return response.json()[:5]

# MCP-style function that decides what tools to call
def mcp_router(user_input):
    tools = {
        "github": get_github_repo_info,
        "rest": get_dummy_posts
    }



    prompt = f"""
You are an AI that receives a user input and decides which tools to call.

Tools:
- github: for anything related to repositories
- rest: for fetching placeholder posts

User input: "{user_input}"

Respond in JSON like:
{{"tools_to_call": [{{"name": "github", "args": "openai/openai-python"}}]}}
"""

    try:
        chat_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}  # Request JSON response
        )
        
        # Get the response content
        response_content = chat_response.choices[0].message.content
        print(f"Raw response: {response_content}")  # Debug print
        
        # Try to parse the response as JSON
        try:
            import json
            tool_plan = json.loads(response_content)
            # Ensure the response has the expected structure
            if not isinstance(tool_plan, dict) or "tools_to_call" not in tool_plan:
                return {"error": f"Unexpected response format: {response_content}"}
            return tool_plan
        except json.JSONDecodeError as e:
            return {"error": f"Failed to parse JSON response: {e}\nResponse: {response_content}"}
            
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        return {"error": f"API request failed: {str(e)}\n{error_details}"}
        
# Streamlit UI
st.title("🔗 MCP Protocol Demo: Tool Orchestration with ChatGPT Plus")

user_input = st.text_input("Ask something (e.g. 'show me openai repo', 'get latest posts'):")

if st.button("Run"):
    if not user_input:
        st.warning("Please enter a query.")
    else:
        st.write("🧠 Deciding with GPT...")
        plan = mcp_router(user_input)

        if "error" in plan:
            st.error(plan["error"])
        else:
            st.json(plan)
            st.write("🔧 Running tools...")

            for tool in plan.get("tools_to_call", []):
                tool_name = tool["name"]
                args = tool.get("args", None)
                if tool_name == "github" and args:
                    st.subheader(f"📁 GitHub Repo: {args}")
                    st.json(get_github_repo_info(args))
                elif tool_name == "rest":
                    st.subheader("🌐 REST API Posts")
                    st.json(get_dummy_posts())
                else:
                    st.warning(f"Unknown or missing args for tool: {tool_name}")
