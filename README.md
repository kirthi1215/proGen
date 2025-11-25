# ProGen AI — Local gTTS server (deprecated)

The local Flask gTTS server has been removed from the recommended development workflow. Text-to-speech is now handled entirely within the frontend using the browser's Web Speech API (speechSynthesis) or optional cloud TTS providers (ElevenLabs).

Security note: This is a developer/local helper. In production you should secure the endpoint and API access appropriately.

Requirements
- Python 3.8+

Setup & run (Windows PowerShell):

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

This repository no longer depends on a server-side gTTS endpoint. The recommended approach is to use the browser's Web Speech API for TTS or use a cloud TTS provider configured in the frontend.

If you want, I can add a small Node.js proxy instead — gTTS is a Python library and is the fastest way to add basic Google-flavored TTS without real keys.