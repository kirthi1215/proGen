from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from gtts import gTTS
import io
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/gtts', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'No text provided'}), 400

        text = data['text']
        lang = data.get('lang', 'en')

        # Generate speech
        tts = gTTS(text=text, lang=lang, slow=False)

        # Save to in-memory buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)

        return send_file(
            audio_buffer,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name='speech.mp3'
        )

    except Exception as e:
        print(f"TTS Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
