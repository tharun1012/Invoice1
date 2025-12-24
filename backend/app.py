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

# =========================
# CORS CONFIG (IMPORTANT)
# =========================
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "https://invoice1-frontend.onrender.com"
            ]
        }
    }
)

# =========================
# CONFIGURATION
# =========================
ALLOWED_EXTENSIONS = {
    "png", "jpg", "jpeg", "gif", "bmp", "webp", "heic"
}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB

app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH


def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


# =========================
# HEALTH CHECK
# =========================
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify(
        {
            "status": "healthy",
            "service": "Invoice OCR API",
            "version": "1.0.0",
        }
    )


# =========================
# FILE UPLOAD OCR (USED BY FRONTEND)
# =========================
@app.route("/api/extract", methods=["POST"])
def extract_invoice():
    if "image" not in request.files:
        return jsonify(
            {
                "success": False,
                "error": "No image file provided",
                "header": {},
                "items": [],
            }
        ), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify(
            {
                "success": False,
                "error": "No file selected",
                "header": {},
                "items": [],
            }
        ), 400

    if not allowed_file(file.filename):
        return jsonify(
            {
                "success": False,
                "error": "Unsupported file type",
                "header": {},
                "items": [],
            }
        ), 400

    temp_dir = tempfile.mkdtemp()
    filename = secure_filename(file.filename)
    temp_path = os.path.join(temp_dir, filename)

    try:
        file.save(temp_path)

        result = {
            "success": False,
            "error": "OCR timeout",
            "header": {},
            "items": [],
        }

        def run_ocr():
            nonlocal result
            result = process_bill_image(temp_path)

        # Run OCR in separate thread (Render-safe)
        t = threading.Thread(target=run_ocr)
        t.start()
        t.join(timeout=25)  # ⏱️ Render free tier safe limit

        if t.is_alive():
            return jsonify(
                {
                    "success": False,
                    "error": "OCR processing timed out (Render free tier limit)",
                    "header": {},
                    "items": [],
                }
            ), 504

        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 422

    except Exception as e:
        return jsonify(
            {
                "success": False,
                "error": f"Processing error: {str(e)}",
                "header": {},
                "items": [],
            }
        ), 500

    finally:
        try:
            os.remove(temp_path)
            os.rmdir(temp_dir)
        except Exception:
            pass


# =========================
# BASE64 OCR (OPTIONAL / NOT USED NOW)
# =========================
@app.route("/api/extract-base64", methods=["POST"])
def extract_from_base64():
    import base64

    data = request.get_json()
    if not data or "image" not in data:
        return jsonify(
            {
                "success": False,
                "error": "No image data provided",
                "header": {},
                "items": [],
            }
        ), 400

    try:
        image_data = data["image"]
        if "," in image_data:
            image_data = image_data.split(",")[1]

        image_bytes = base64.b64decode(image_data)

        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, "image.jpg")

        with open(temp_path, "wb") as f:
            f.write(image_bytes)

        result = process_bill_image(temp_path)

        if result.get("success"):
            return jsonify(result), 200
        else:
            return jsonify(result), 422

    except Exception as e:
        return jsonify(
            {
                "success": False,
                "error": f"Processing error: {str(e)}",
                "header": {},
                "items": [],
            }
        ), 500

    finally:
        try:
            os.remove(temp_path)
            os.rmdir(temp_dir)
        except Exception:
            pass


# =========================
# RENDER ENTRY POINT
# =========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
