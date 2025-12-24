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

# Allow all origins for development (CORS)
from flask_cors import CORS

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


# Configuration
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'heic'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max

app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Invoice OCR API',
        'version': '1.0.0'
    })


@app.route('/api/extract', methods=['POST'])
def extract_invoice():
    """
    Extract invoice data from uploaded image.
    
    Expects multipart form data with 'image' file field.
    
    Returns:
        JSON with extracted header info and line items
    """
    # Check if file was uploaded
    if 'image' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No image file provided',
            'header': {},
            'items': []
        }), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected',
            'header': {},
            'items': []
        }), 400
    
    if not allowed_file(file.filename):
        return jsonify({
            'success': False,
            'error': f'File type not allowed. Supported: {", ".join(ALLOWED_EXTENSIONS)}',
            'header': {},
            'items': []
        }), 400
    
    try:
        # Save uploaded file to temp location
        temp_dir = tempfile.mkdtemp()
        filename = secure_filename(file.filename)
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        try:
            # Process the image
            result = process_bill_image(temp_path)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 422
        
        finally:
            # Cleanup temp file
            try:
                os.remove(temp_path)
                os.rmdir(temp_dir)
            except:
                pass
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Processing error: {str(e)}',
            'header': {},
            'items': []
        }), 500


@app.route('/api/extract-base64', methods=['POST'])
def extract_from_base64():
    """
    Extract invoice data from base64 encoded image.
    
    Expects JSON with 'image' field containing base64 data.
    
    Returns:
        JSON with extracted header info and line items
    """
    import base64
    
    data = request.get_json()
    
    if not data or 'image' not in data:
        return jsonify({
            'success': False,
            'error': 'No image data provided',
            'header': {},
            'items': []
        }), 400
    
    try:
        # Decode base64 image
        image_data = data['image']
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        
        # Save to temp file
        temp_dir = tempfile.mkdtemp()
        temp_path = os.path.join(temp_dir, 'image.jpg')
        
        with open(temp_path, 'wb') as f:
            f.write(image_bytes)
        
        try:
            # Process the image
            result = process_bill_image(temp_path)
            
            if result['success']:
                return jsonify(result), 200
            else:
                return jsonify(result), 422
        
        finally:
            # Cleanup
            try:
                os.remove(temp_path)
                os.rmdir(temp_dir)
            except:
                pass
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Processing error: {str(e)}',
            'header': {},
            'items': []
        }), 500


if __name__ == '__main__':
    print("=" * 50)
    print("Invoice OCR API Server")
    print("=" * 50)
    print("Endpoints:")
    print("  GET  /api/health     - Health check")
    print("  POST /api/extract    - Extract from file upload")
    print("  POST /api/extract-base64 - Extract from base64")
    print("=" * 50)
    
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
