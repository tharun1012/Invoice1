"""
Flask API Server for Bill/Invoice OCR Extraction
"""

import os
import tempfile
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

from ocr_service import process_bill_image

app = Flask(__name__)

# ✅ ENABLE CORS FOR ALL ROUTES & ORIGINS (REQUIRED FOR BROWSER)
CORS(app)

# Configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'heic'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Invoice OCR API",
        "version": "1.0.0"
    })


@app.route('/api/extract', methods=['POST'])
def extract_invoice():
    if 'image' not in request.files:
        return jsonify({"success": False, "error": "No image uploaded"}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"success": False, "error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Unsupported file type"}), 400

    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, secure_filename(file.filename))
    file.save(temp_path)

    result = {
        "success": False,
        "error": "OCR timeout",
        "header": {},
        "items": []
    }

    def run_ocr():
        nonlocal result
        result = process_bill_image(temp_path)

    t = threading.Thread(target=run_ocr)
    t.start()
    t.join(timeout=25)  # ⏱️ Render free-tier safe

    try:
        os.remove(temp_path)
        os.rmdir(temp_dir)
    except:
        pass

    if t.is_alive():
        return jsonify({
            "success": False,
            "error": "OCR processing timed out"
        }), 504

    if result.get("success"):
        return jsonify(result), 200

    return jsonify(result), 422


@app.route('/api/extract-base64', methods=['POST'])
def extract_base64():
    return jsonify({
        "success": False,
        "error": "Not implemented"
    }), 501


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
