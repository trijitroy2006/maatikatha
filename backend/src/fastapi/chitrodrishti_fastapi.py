"""
ChitroDrishti FastAPI Service — Visual Crop Disease Triage
Run: uvicorn chitrodrishti_fastapi:app --port 8001
Requires: pip install fastapi uvicorn google-generativeai pillow
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import base64, json, os
from io import BytesIO

app = FastAPI(title='ChitroDrishti Vision API', version='1.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)


class DiagnoseRequest(BaseModel):
    image_base64: str
    location_weather_context: str = 'West Bengal, India. Kharif season.'


SYSTEM_PROMPT = """
You are a senior plant pathologist specializing in Indian agricultural crops (rice, wheat, potato, tomato, jute, mustard).
Analyze the crop image and return ONLY a valid JSON object with no markdown:
{
  "disease_name": "specific disease name or Healthy",
  "confidence_pct": 85,
  "severity": "mild|moderate|severe|critical",
  "symptoms_observed": ["symptom1", "symptom2"],
  "bengali_remedy": "remedy in Bengali script",
  "recommended_fungicide": "specific product and dosage",
  "immediate_action": "what to do right now",
  "off_topic": false
}
"""


@app.post('/ai/vision-diagnose')
async def vision_diagnose(req: DiagnoseRequest):
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail='GEMINI_API_KEY not configured')

    try:
        genai.configure(api_key=api_key)

        # Decode base64 image
        b64_data = req.image_base64
        if ',' in b64_data:
            b64_data = b64_data.split(',', 1)[1]
        image_bytes = base64.b64decode(b64_data)

        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = f"{SYSTEM_PROMPT}\n\nLocation/Weather Context: {req.location_weather_context}"

        response = model.generate_content([
            prompt,
            {'mime_type': 'image/jpeg', 'data': image_bytes}
        ])

        text = response.text.strip()
        if text.startswith('```'):
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]

        result = json.loads(text)
        result['powered_by'] = 'gemini-1.5-flash'
        return result

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail='AI returned invalid JSON')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'ChitroDrishti'}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8001)
