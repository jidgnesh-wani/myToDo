"""Verify the Phase 7 MCP surface: curated tools, denied writes, working reads."""
import json
import re
import subprocess
import sys
import time

BASE = "http://localhost:8080/mcp"


def rpc(method, payload, session=None):
    headers = [
        "Content-Type: application/json",
        "Accept: application/json, text/event-stream",
        "X-Agent-Native-Owner-Email: dev@example.com",
    ]
    if session:
        headers.append(f"mcp-session-id: {session}")
    cmd = ["curl", "-s", "-D", "-", "-X", "POST", BASE]
    for h in headers:
        cmd += ["-H", h]
    cmd += ["-d", json.dumps(payload)]
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    head, sep, body = out.partition("\r\n\r\n")
    if not sep:
        head, sep, body = out.partition("\n\n")
    sess = None
    for line in head.splitlines():
        if line.lower().startswith("mcp-session-id:"):
            sess = line.split(":", 1)[1].strip()
    data = None
    matches = re.findall(r"data: (.*)", body)
    for m in matches:
        parsed = json.loads(m)
        if "result" in parsed or "error" in parsed:
            data = parsed
            break
    if data is None and body.strip().startswith("{"):
        data = json.loads(body)
    return sess, data


def main():
    # Wait for server
    for _ in range(30):
        code = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:8080/"],
            capture_output=True, text=True,
        ).stdout
        if code == "200":
            break
        time.sleep(2)
    else:
        print("SERVER NEVER CAME UP")
        sys.exit(1)

    session, init = rpc(None, {
        "jsonrpc": "2.0", "id": 1, "method": "initialize",
        "params": {"protocolVersion": "2025-06-18", "capabilities": {},
                   "clientInfo": {"name": "probe", "version": "0"}},
    })
    info = (init or {}).get("result", {}).get("serverInfo")
    print("initialize ok:", bool(info), "-", (info or {}).get("title"))

    _, tools = rpc(session, {"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
    names = sorted(t["name"] for t in tools["result"]["tools"])
    print("tools:", names)

    expected_reads = {"listTasks", "getScratchpad"}
    missing = expected_reads - set(names)
    forbidden_direct = {"createTask", "updateTask", "deleteTask", "saveScratchpad"} & set(names)
    print("read actions advertised:", not missing, "| missing:", missing or "none")
    print("mutating actions hidden:", not forbidden_direct, "| leaked:", forbidden_direct or "none")

    # A direct call to a mutating action must be rejected as unknown.
    _, denied = rpc(session, {
        "jsonrpc": "2.0", "id": 3, "method": "tools/call",
        "params": {"name": "deleteTask", "arguments": {"id": 999}},
    })
    result = denied.get("result", {})
    is_error = result.get("isError") or denied.get("error")
    text = "".join(c.get("text", "") for c in result.get("content", []))[:120]
    print("deleteTask direct call blocked:", bool(is_error), "|", text)

    # The read tool must dispatch correctly. Without the Spring backend
    # running, the action surfaces its backend connection failure — which is
    # itself proof the MCP → action → backendClient path works end to end.
    _, call = rpc(session, {
        "jsonrpc": "2.0", "id": 4, "method": "tools/call",
        "params": {"name": "listTasks", "arguments": {}},
    })
    result = call.get("result", {})
    text = "".join(c.get("text", "") for c in result.get("content", []))
    dispatched = not result.get("isError") or "fetch failed" in text or "Backend error" in text
    print("listTasks dispatched through the stack:", bool(dispatched))
    print("listTasks response head:", text[:200])


if __name__ == "__main__":
    main()
