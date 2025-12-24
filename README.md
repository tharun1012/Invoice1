# Invoice OCR Application

An AI-powered invoice/bill extraction application that uses PaddleOCR to extract structured data from bill images.

## Features

- 📸 **Image Upload**: Upload bill/invoice images via file picker or camera
- 🤖 **OCR Extraction**: Automatically extract items, quantities, rates, and totals
- ✏️ **Editable Preview**: Review and edit extracted data before generating PDF
- 📄 **PDF Export**: Generate professional invoices in PDF format

## Architecture

```
┌─────────────────┐     HTTP/REST     ┌─────────────────┐
│  React Frontend │ ◄──────────────► │  Flask Backend  │
│   (Vite + TS)   │                   │   (Python)      │
└─────────────────┘                   └─────────────────┘
                                              │
                                              ▼
                                      ┌─────────────────┐
                                      │   PaddleOCR     │
                                      │   (ML Engine)   │
                                      └─────────────────┘
```

## Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.8+ (for backend)
- **pip** (Python package manager)

## Quick Start

### 1. Install Frontend Dependencies

```bash
npm install
```

### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 3. Start Both Servers (Single Command!)

```bash
npm run dev
```

This runs both:
- **Frontend** on `http://localhost:5173`
- **Backend** on `http://localhost:5000`

> You can also run them separately:
> - `npm run dev:frontend` - Frontend only
> - `npm run dev:backend` - Backend only

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/extract` | POST | Extract data from image file (multipart form) |
| `/api/extract-base64` | POST | Extract data from base64 image (JSON) |

### Example API Usage

```bash
# Health check
curl http://localhost:5000/api/health

# Extract from file
curl -X POST -F "image=@bill.jpg" http://localhost:5000/api/extract
```

## Project Structure

```
├── backend/
│   ├── app.py              # Flask API server
│   ├── ocr_service.py      # OCR processing logic
│   ├── requirements.txt    # Python dependencies
│   └── start_server.bat    # Windows startup script
├── src/
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── services/
│   │   └── ocrService.ts   # API client for OCR
│   └── types/              # TypeScript types
└── package.json
```

## Environment Variables

Create a `.env` file in the root directory if you need to customize:

```env
VITE_API_URL=http://localhost:5000
```

## Troubleshooting

### Backend won't start
- Ensure Python 3.8+ is installed: `python --version`
- Try installing dependencies manually: `pip install flask flask-cors paddleocr opencv-python`

### OCR not detecting text
- Ensure the image is clear and well-lit
- Try increasing image resolution
- Check that the bill format is similar to expected (tabular layout)

### CORS errors
- Verify the backend is running on port 5000
- Check that Flask-CORS is installed

## License

MIT
