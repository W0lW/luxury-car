"""Hook Stop: trascrive la conversazione corrente (utente + risposte) in chat.md.
Ogni sessione ha una sezione propria, riscritta a ogni fine turno; il resto del file resta intatto."""
import json, os, re, sys

def testo(content):
    if isinstance(content, str):
        return content
    parti = []
    for b in content or []:
        if isinstance(b, dict) and b.get("type") == "text":
            parti.append(b.get("text", ""))
    return "\n".join(parti)

def pulisci(t):
    t = re.sub(r"<(ide_[a-z_]+|system-reminder|command-[a-z]+|local-command-[a-z]+)>.*?</\1>", "", t, flags=re.S)
    return t.strip()

def main():
    dati = json.load(sys.stdin)
    trascritto = dati.get("transcript_path")
    sid = dati.get("session_id", "sconosciuta")
    progetto = os.environ.get("CLAUDE_PROJECT_DIR") or dati.get("cwd") or "."
    if not trascritto or not os.path.exists(trascritto):
        return
    righe = []
    with open(trascritto, encoding="utf-8") as f:
        for riga in f:
            try:
                r = json.loads(riga)
            except ValueError:
                continue
            if r.get("isSidechain") or r.get("isMeta") or r.get("type") not in ("user", "assistant"):
                continue
            msg = r.get("message") or {}
            c = msg.get("content")
            if r["type"] == "user" and isinstance(c, list) and any(isinstance(b, dict) and b.get("type") == "tool_result" for b in c):
                continue
            t = pulisci(testo(c))
            if not t:
                continue
            ora = (r.get("timestamp") or "")[:16].replace("T", " ")
            chi = "**Utente**" if r["type"] == "user" else "**Claude**"
            righe.append(f"{chi} ({ora}):\n\n{t}\n")
    inizio, fine = f"<!-- sessione:{sid} -->", f"<!-- fine:{sid} -->"
    sezione = f"{inizio}\n## Sessione {sid[:8]}\n\n" + "\n".join(righe) + f"\n{fine}"
    percorso = os.path.join(progetto, "chat.md")
    vecchio = open(percorso, encoding="utf-8").read() if os.path.exists(percorso) else "# Chat\n"
    if inizio in vecchio and fine in vecchio:
        a, b = vecchio.index(inizio), vecchio.index(fine) + len(fine)
        nuovo = vecchio[:a] + sezione + vecchio[b:]
    else:
        nuovo = vecchio.rstrip() + "\n\n" + sezione + "\n"
    with open(percorso, "w", encoding="utf-8") as f:
        f.write(nuovo)

if __name__ == "__main__":
    main()
