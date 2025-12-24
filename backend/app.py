"""
Flask API Server for Bill/Invoice OCR Extraction
"""

import os
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

from ocr_service import process_bill_image

app = Flask(__name__)

# ✅ CORS — allow frontend Render URL
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["https://invoice1-frontend.onrender.com"]
        }
    }
)

# Configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'heic'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "Invoice OCR API",
        "version": "1.0.0"
    })


@app.route("/api/extract", methods=["POST"])
def extract_invoice():
    if "image" not in request.files:
        return jsonify({"success": False, "error": "No image file"}), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"success": False, "error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Invalid file type"}), 400

    try:
        temp_dir = tempfile.mkdtemp()
        filename = secure_filename(file.filename)
        path = os.path.join(temp_dir, filename)
        file.save(path)

        try:
            result = process_bill_image(path)
            return jsonify(result), 200 if result.get("success") else 422
        finally:
            os.remove(path)
            os.rmdir(temp_dir)

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/extract-base64", methods=["POST"])
def extract_from_base64():
    import base64

    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"success": False, "error": "No image data"}), 400

    try:
        image_data = data["image"]
        if "," in image_data:
            image_data = image_data.split(",")[1]

        image_bytes = base64.b64decode(image_data)

        temp_dir = tempfile.mkdtemp()
        path = os.path.join(temp_dir, "image.jpg")

        with open(path, "wb") as f:
            f.write(image_bytes)

        try:
            result = process_bill_image(path)
            return jsonify(result), 200 if result.get("success") else 422
        finally:
            os.remove(path)
            os.rmdir(temp_dir)

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ✅ ONLY ONE main block — REQUIRED FOR RENDER
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
