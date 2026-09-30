"""
ShorraKhok FastAPI Service — Acoustic Pest Radar (Real FFT)
Run: uvicorn shorrakhok_fastapi:app --port 8002
Requires: pip install fastapi uvicorn numpy scipy
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import scipy.io.wavfile as wavfile
import io, struct

app = FastAPI(title='ShorraKhok Acoustic API', version='1.0.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

PEST_FREQ_LOW  = 100  # Hz — typical locust/stem borer wingbeat lower bound
PEST_FREQ_HIGH = 300  # Hz — upper bound
DETECTION_THRESHOLD = 0.35  # power ratio threshold


@app.post('/ai/acoustic-scan')
async def acoustic_scan(audio_file: UploadFile = File(...)):
    data = await audio_file.read()

    try:
        sample_rate, audio_data = wavfile.read(io.BytesIO(data))
    except Exception:
        # Could not parse — return safe default
        return {
            'pest_detected': False,
            'confidence': 0.0,
            'note': 'Could not parse audio. Please upload WAV format.',
            'method': 'fft_real',
            'frequency_range': f'{PEST_FREQ_LOW}-{PEST_FREQ_HIGH}Hz',
        }

    # Stereo to mono
    if audio_data.ndim > 1:
        audio_data = audio_data[:, 0]

    audio_data = audio_data.astype(np.float32)

    # FFT analysis
    fft_result = np.fft.rfft(audio_data)
    freqs = np.fft.rfftfreq(len(audio_data), d=1.0 / sample_rate)

    # Isolate 100-300Hz band (pest wingbeat frequencies)
    mask = (freqs >= PEST_FREQ_LOW) & (freqs <= PEST_FREQ_HIGH)

    pest_band_power = float(np.mean(np.abs(fft_result[mask])))
    total_power = float(np.mean(np.abs(fft_result))) + 1e-10
    ratio = pest_band_power / total_power

    pest_detected = ratio > DETECTION_THRESHOLD
    confidence = round(min(0.97, ratio * 2.5), 3)

    # Find dominant frequency in pest band
    if mask.any():
        peak_idx = np.argmax(np.abs(fft_result[mask]))
        freq_peak = float(freqs[mask][peak_idx])
    else:
        freq_peak = 0.0

    result = {
        'pest_detected': pest_detected,
        'confidence': confidence,
        'frequency_peak_hz': round(freq_peak, 1),
        'power_ratio': round(ratio, 4),
        'sample_rate': sample_rate,
        'method': 'fft_real',
        'frequency_range_analysed': f'{PEST_FREQ_LOW}-{PEST_FREQ_HIGH}Hz',
    }

    if pest_detected:
        result['pest_type'] = 'Possible Stem Borer / Locust Activity'
        result['action'] = (
            'Apply Chlorpyrifos 20EC at 2.5ml/L. '
            'Deploy pheromone traps. Alert nearby farmers.'
        )

    return result


@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'ShorraKhok'}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8002)
