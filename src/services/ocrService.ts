/**
 * OCR Service - API client for invoice extraction
 */

// Backend API URL - defaults to localhost:5000
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://invoice1-backend.onrender.com';


export interface ExtractedItem {
    id: string;
    itemName: string;
    quantity: string;
    rate: string;
    amount: string;
}

export interface OCRHeader {
    customerName: string;
    slNo: string;
    date: string;
}

export interface OCRResponse {
    success: boolean;
    error?: string;
    header: OCRHeader;
    items: ExtractedItem[];
}

/**
 * Extract invoice items from an image file
 * @param imageFile - The image file to process
 * @returns Promise with extracted data
 */
export async function extractInvoiceItems(imageFile: File): Promise<OCRResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch(`${API_BASE_URL}/api/extract`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data: OCRResponse = await response.json();
        return data;
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Cannot connect to OCR server. Please ensure the backend is running on port 5000.');
        }
        throw error;
    }
}

/**
 * Extract invoice items from a base64 encoded image
 * @param base64Image - Base64 encoded image data (with or without data URL prefix)
 * @returns Promise with extracted data
 */
export async function extractInvoiceFromBase64(base64Image: string): Promise<OCRResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/extract-base64`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64Image }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data: OCRResponse = await response.json();
        return data;
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Cannot connect to OCR server. Please ensure the backend is running on port 5000.');
        }
        throw error;
    }
}

/**
 * Check if the OCR API server is healthy
 * @returns Promise with health status
 */
export async function checkApiHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
            const data = await response.json();
            return data.status === 'healthy';
        }
        return false;
    } catch {
        return false;
    }
}
