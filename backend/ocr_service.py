"""
OCR Service Module
Extracts text and structured data from bill/invoice images using PaddleOCR.
"""

import cv2
import os
import re
import tempfile
from paddleocr import PaddleOCR


# Initialize PaddleOCR globally for reuse
_ocr_instance = None


def get_ocr():
    """Get or create PaddleOCR instance (singleton pattern)"""
    global _ocr_instance
    if _ocr_instance is None:
        _ocr_instance = PaddleOCR(use_angle_cls=True, lang='en')
    return _ocr_instance


def preprocess_image(input_path, denoise_strength=5, apply_otsu=False):
    """
    Preprocess bill image for better OCR accuracy.
    
    Args:
        input_path: Path to input image
        denoise_strength: Strength for denoising (default: 5)
        apply_otsu: Apply Otsu thresholding (default: False)
    
    Returns:
        Preprocessed image as numpy array, or None if failed
    """
    img = cv2.imread(input_path)
    if img is None:
        return None
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(
        gray, None, h=denoise_strength, 
        templateWindowSize=7, searchWindowSize=21
    )
    
    if apply_otsu:
        _, processed = cv2.threshold(
            denoised, 0, 255, 
            cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
    else:
        processed = denoised
    
    return processed


def extract_ocr_data(image_path):
    """
    Run OCR on image and extract text with coordinates.
    Supports both PaddleOCR 2.x and 3.x API formats.
    
    Returns:
        List of dicts with text, confidence, and bounding box info
    """
    ocr = get_ocr()
    
    # PaddleOCR can use either ocr() or predict() method
    try:
        results = ocr.ocr(image_path, cls=True)
    except Exception:
        results = ocr.predict(image_path)
    
    ocr_data = []
    
    if not results:
        return ocr_data
    
    # Handle different result formats
    # Format 1 (PaddleOCR 2.x): [[[box, (text, confidence)], ...]]
    # Format 2 (PaddleOCR 3.x): [{'rec_texts': [...], 'dt_polys': [...], ...}]
    
    if isinstance(results, list) and len(results) > 0:
        first_result = results[0]
        
        # Check if it's the new format (dict with rec_texts)
        if isinstance(first_result, dict) and 'rec_texts' in first_result:
            texts = first_result.get('rec_texts', [])
            polys = first_result.get('dt_polys', [])
            scores = first_result.get('rec_scores', [1.0] * len(texts))
            
            for i, (text, poly) in enumerate(zip(texts, polys)):
                confidence = scores[i] if i < len(scores) else 1.0
                
                x_coords = [point[0] for point in poly]
                y_coords = [point[1] for point in poly]
                
                x_min, x_max = min(x_coords), max(x_coords)
                y_min, y_max = min(y_coords), max(y_coords)
                
                ocr_data.append({
                    'text': str(text).strip(),
                    'confidence': float(confidence),
                    'x_min': float(x_min),
                    'x_max': float(x_max),
                    'y_min': float(y_min),
                    'y_max': float(y_max),
                    'x_center': (x_min + x_max) / 2,
                    'y_center': (y_min + y_max) / 2,
                    'width': x_max - x_min,
                    'height': y_max - y_min
                })
        
        # Old format (list of [box, (text, confidence)])
        elif isinstance(first_result, list):
            for page_result in results:
                if page_result is None:
                    continue
                for item in page_result:
                    if item is None or len(item) < 2:
                        continue
                    
                    box = item[0]
                    text_info = item[1]
                    
                    if isinstance(text_info, tuple) and len(text_info) >= 2:
                        text = str(text_info[0]).strip()
                        confidence = float(text_info[1])
                    else:
                        text = str(text_info).strip()
                        confidence = 1.0
                    
                    x_coords = [point[0] for point in box]
                    y_coords = [point[1] for point in box]
                    
                    x_min, x_max = min(x_coords), max(x_coords)
                    y_min, y_max = min(y_coords), max(y_coords)
                    
                    ocr_data.append({
                        'text': text,
                        'confidence': confidence,
                        'x_min': float(x_min),
                        'x_max': float(x_max),
                        'y_min': float(y_min),
                        'y_max': float(y_max),
                        'x_center': (x_min + x_max) / 2,
                        'y_center': (y_min + y_max) / 2,
                        'width': x_max - x_min,
                        'height': y_max - y_min
                    })
    
    # Sort by y-coordinate then x-coordinate
    ocr_data.sort(key=lambda x: (x['y_center'], x['x_center']))
    return ocr_data


def extract_header_info(ocr_data):
    """
    Extract header information (Name, Sl. No, Date) from OCR data.
    """
    header_info = {"name": "", "sl_no": "", "date": ""}
    
    # Limit search to top 300px
    header_zone = [item for item in ocr_data if item["y_center"] < 300]
    
    # Extract NAME (Left side)
    name_candidates = []
    for item in header_zone:
        x, y = item['x_center'], item['y_center']
        text = item['text'].strip()
        text_lower = text.lower()
        
        if x < 300 and 80 < y < 220:
            if not re.search(r'[a-zA-Z]', text) or len(text) <= 1:
                continue
            
            clean_text = text.replace('.', '').strip()
            exclude = ['darpan', 'glass', 'ply', 'concepts', 'email',
                      'phone', 'contact', 'www', '.com', 'sl', 'no',
                      'date', 'bill', 'mrp', 'particulars', 'qty',
                      'rate', 'total', '080', '297']
            
            is_noise = any(kw in text_lower for kw in exclude)
            
            if not is_noise and len(clean_text) >= 3:
                score = len(clean_text)
                if 40 <= x <= 150:
                    score += 5
                if 90 <= y <= 180:
                    score += 3
                
                name_candidates.append({
                    'text': clean_text,
                    'score': score,
                    'x': x,
                    'y': y
                })
    
    if name_candidates:
        best = max(name_candidates, key=lambda c: c['score'])
        header_info['name'] = best['text']
    
    # Extract SL. NO
    for i, item in enumerate(header_zone):
        text_lower = item['text'].lower().replace(' ', '').replace('.', '')
        
        if ('sl' in text_lower or 'si' in text_lower) and 'no' in text_lower:
            for j in range(i + 1, min(i + 6, len(header_zone))):
                next_item = header_zone[j]
                next_text = next_item['text'].strip()
                
                if re.match(r'^\d{2,6}$', next_text) and next_item['x_center'] > 700:
                    header_info['sl_no'] = next_text
                    break
            if header_info['sl_no']:
                break
    
    # Fallback for Sl. No
    if not header_info['sl_no']:
        for item in header_zone:
            if item['x_center'] > 800 and item['y_center'] < 150:
                text = item['text'].strip()
                if re.match(r'^\d{2,6}$', text):
                    header_info['sl_no'] = text
                    break
    
    # Extract DATE
    for item in header_zone:
        x = item['x_center']
        text = item['text'].strip()
        text_lower = text.lower()
        
        if 'date' in text_lower and x > 600:
            date_match = re.search(r'\.?(\d{1,2})[\|/\.\s]*(\d{1,2})[\|/\.\s]*(\d{2,4})', text)
            
            if date_match:
                day, month, year = date_match.groups()
                if len(year) == 2:
                    year = '20' + year if int(year) < 50 else '19' + year
                
                header_info['date'] = f"{day}/{month}/{year}"
                break
    
    # Date fallback
    if not header_info['date']:
        for item in header_zone:
            if item['x_center'] > 700 and item['y_center'] < 200:
                date_match = re.search(r'\.?(\d{1,2})[\|/\.\s]*(\d{1,2})[\|/\.\s]*(\d{2,4})', item['text'])
                if date_match:
                    day, month, year = date_match.groups()
                    if len(year) == 2:
                        year = '20' + year
                    header_info['date'] = f"{day}/{month}/{year}"
                    break
    
    return header_info


def find_table_start(data):
    """Find where the table data starts"""
    for i, item in enumerate(data):
        text = item['text'].lower().strip()
        if 'particulars' in text or ('qty' in text and 'rate' in text):
            return i + 5
    return 15


def group_into_rows(data, y_threshold=25):
    """Group OCR elements into rows based on y-coordinate proximity"""
    if not data:
        return []
    
    data_sorted = sorted(data, key=lambda x: x['y_center'])
    rows = []
    current_row = [data_sorted[0]]
    last_y = data_sorted[0]['y_center']
    
    for item in data_sorted[1:]:
        if abs(item['y_center'] - last_y) <= y_threshold:
            current_row.append(item)
        else:
            if current_row:
                current_row.sort(key=lambda x: x['x_center'])
                rows.append(current_row)
            current_row = [item]
            last_y = item['y_center']
    
    if current_row:
        current_row.sort(key=lambda x: x['x_center'])
        rows.append(current_row)
    
    return rows


def split_qty_rate(text):
    """Split combined qty and rate strings"""
    if not text or text.strip() == '':
        return '', ''
    
    text = text.strip()
    
    if '  ' in text:
        parts = re.split(r'\s{2,}', text)
        if len(parts) >= 2:
            return parts[0].strip(), ' '.join(parts[1:]).strip()
    
    match = re.match(r'^(\d+[a-zA-Z]*)[€$£¥](\d+)$', text)
    if match:
        return match.group(1), match.group(2)
    
    match = re.match(r'^(\d+[a-zA-Z]+)(\d+)$', text)
    if match:
        return match.group(1), match.group(2)
    
    if ' ' in text:
        parts = text.split()
        if len(parts) >= 2:
            return parts[0], ' '.join(parts[1:])
    
    if re.match(r'^\d+[a-zA-Z]+$', text):
        return text, ''
    
    return text, ''


def assign_to_columns(row_elements):
    """Assign elements to columns based on x-position"""
    has_typical_particulars = any(150 <= elem['x_center'] < 500 for elem in row_elements)
    
    columns = {
        'mrp': '',
        'particulars': '',
        'qty_rate': '',
        'total': ''
    }
    
    items_500_660 = []
    items_660_850 = []
    
    for elem in row_elements:
        x = elem['x_center']
        text = elem['text'].strip()
        
        if x < 150:
            columns['mrp'] = columns['mrp'] + ' ' + text if columns['mrp'] else text
        elif x < 500:
            columns['particulars'] = columns['particulars'] + ' ' + text if columns['particulars'] else text
        elif x < 660:
            items_500_660.append(text)
        elif x < 850:
            items_660_850.append(text)
        else:
            columns['total'] = columns['total'] + ' ' + text if columns['total'] else text
    
    if not has_typical_particulars and items_500_660:
        columns['particulars'] = items_500_660[0]
        if len(items_500_660) > 1:
            columns['qty_rate'] = ' '.join(items_500_660[1:])
    else:
        if items_500_660:
            columns['qty_rate'] = ' '.join(items_500_660)
    
    if items_660_850:
        if columns['qty_rate']:
            columns['qty_rate'] = columns['qty_rate'] + ' ' + ' '.join(items_660_850)
        else:
            columns['qty_rate'] = ' '.join(items_660_850)
    
    columns = {k: v.strip() for k, v in columns.items()}
    qty, rate = split_qty_rate(columns['qty_rate'])
    
    return {
        'mrp': columns['mrp'],
        'particulars': columns['particulars'],
        'qty': qty,
        'rate': rate,
        'total': columns['total']
    }


def process_bill_image(image_path):
    """
    Main function to process a bill image and extract structured data.
    
    Args:
        image_path: Path to the bill image
    
    Returns:
        Dictionary with header info and extracted items
    """
    # Preprocess and save to temp file
    processed = preprocess_image(image_path)
    if processed is None:
        return {
            'success': False,
            'error': 'Could not read image',
            'header': {},
            'items': []
        }
    
    # Save preprocessed image to temp file
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, 'preprocessed.jpg')
    cv2.imwrite(temp_path, processed)
    
    try:
        # Extract OCR data
        ocr_data = extract_ocr_data(temp_path)
        
        if not ocr_data:
            return {
                'success': False,
                'error': 'No text detected in image',
                'header': {},
                'items': []
            }
        
        # Extract header information
        header_info = extract_header_info(ocr_data)
        
        # Find table and process rows
        table_start = find_table_start(ocr_data)
        table_data = ocr_data[table_start:]
        table_rows = group_into_rows(table_data)
        
        # Process rows into items
        items = []
        for row_idx, row_elements in enumerate(table_rows):
            row_text = ' '.join([elem['text'] for elem in row_elements]).lower()
            
            # Skip headers and footers
            if any(header in row_text for header in ['particulars', 'qty', 'rate', 'total']) and row_idx < 3:
                continue
            
            if any(footer in row_text for footer in ['signature', 'total']) and 'sub' not in row_text:
                if row_text.count('total') > 0 and row_text.count('sub') == 0:
                    continue
            
            if len(row_text.strip()) < 2:
                continue
            
            row_data = assign_to_columns(row_elements)
            
            if row_data['particulars'] or row_data['total']:
                items.append({
                    'id': str(len(items) + 1),
                    'itemName': row_data['particulars'],
                    'quantity': row_data['qty'],
                    'rate': row_data['rate'],
                    'amount': row_data['total']
                })
        
        return {
            'success': True,
            'header': {
                'customerName': header_info['name'],
                'slNo': header_info['sl_no'],
                'date': header_info['date']
            },
            'items': items
        }
    
    finally:
        # Cleanup temp files
        try:
            os.remove(temp_path)
            os.rmdir(temp_dir)
        except:
            pass


if __name__ == '__main__':
    # Test with sample image
    import sys
    if len(sys.argv) > 1:
        result = process_bill_image(sys.argv[1])
        import json
        print(json.dumps(result, indent=2))
    else:
        print("Usage: python ocr_service.py <image_path>")
