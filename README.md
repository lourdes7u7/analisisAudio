# Análisis de Audio y Pronunciación - Aplicación en **Flask** para análisis de audio y evaluación de pronunciación, que integra métricas acústicas (pitch, jitter, shimmer) y reconocimiento de voz mediante **Wit.ai**.

---

## Requisitos

- **Python**: `3.10.10` (recomendado, otras versiones pueden causar incompatibilidades con `librosa`, `torch` o `numba`)
- **pip** >= 22.0
- Sistema operativo:
  - Windows 10/11
  - Linux (Ubuntu 20.04+)
  - macOS (Intel o Apple Silicon)

### Dependencias principales (se instalan automáticamente desde `requirements.txt`):
- Flask `3.0.3`
- librosa `0.10.2.post1`
- numpy `1.24.3`
- scipy `1.14.0`
- soundfile `0.12.1`
- torch `2.4.0`
- wit `6.0.1`
- openai-whisper (desde GitHub)
- scikit-learn, pandas, seaborn, matplotlib
- PyAudio, pyAudioAnalysis, webrtcvad

---

## Instalación local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/tu-repo.git
   cd tu-repo

2. Crear y activar el entorno virtual en Windows
   ```bash
    python -m venv venv
    venv\Scripts\activate

3. Instalar dependencias
   ```bash
   pip install -r requirements.txt

## Ejecución

Para iniciar el servidor Flask:
```bash
python app.py
