from flask import Flask, request, jsonify, render_template, Response
import librosa
import numpy as np
import os, time, datetime, json, requests
from scipy.stats import pearsonr
import soundfile as sf
from collections import OrderedDict

app = Flask(__name__, static_folder='static', template_folder='.')

# Directorios para subir y guardar resultados
UPLOAD_FOLDER = 'uploads'
RESULTS_FOLDER = 'results'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

wit_api_vocales = os.environ.get('WIT_API_VOCALES', 'VGO3EDVN5RAAAVIXVGV57YBPHYYYYNZM')
wit_api_abecedario = os.environ.get('WIT_API_ABECEDARIO', "YUFNV5VSE6S5DNVBSSYDY7UKQMHWQNOC")
wit_api_silabas = os.environ.get('WIT_API_SILABAS', "TGOBGNEL3NSLKLAJKWIG4ML46YJJILOV")

def analyze_audio(fp):
    """Carga audio y calcula métricas acústicas más precisas."""
    try:
        y, sr = librosa.load(fp, sr=None)
        
        # Extraer pitch/F0
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr, threshold=0.1)
        
        # Filtrar valores válidos de pitch
        pitch_values = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            if pitch > 0:
                pitch_values.append(pitch)
        
        if len(pitch_values) < 3:
            return None, None, None
            
        pitch_values = np.array(pitch_values)
        meanF0 = float(np.mean(pitch_values))
        
        # Cálculo de jitter (variabilidad de período)
        periods = 1.0 / pitch_values
        period_diff = np.diff(periods)
        jitter = float(np.std(period_diff) / np.mean(periods)) if len(period_diff) > 0 else 0.0
        
        # Cálculo de shimmer (variabilidad de amplitud)
        rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
        if len(rms) > 1:
            rms_diff = np.diff(rms)
            shimmer = float(np.std(rms_diff) / np.mean(rms)) if np.mean(rms) > 0 else 0.0
        else:
            shimmer = 0.0
            
        return meanF0, jitter, shimmer
        
    except Exception as e:
        print(f"Error analyzing audio: {e}")
        return None, None, None

def get_api_key_for_subnivel(subnivel):
    """Obtiene la API key correcta según el subnivel."""
    subnivel_clean = subnivel.lower().strip()
    
    if subnivel_clean == "vocales":
        return wit_api_vocales
    elif subnivel_clean in ["abecedario", "consonantes", "letras"]:
        return wit_api_abecedario
    elif subnivel_clean in ["sílabas", "silabas", "syllables"]:
        return wit_api_silabas
    else:
        return wit_api_vocales  # por defecto

def transcribe_speech(fp, subnivel):
    """Envía a Wit.ai y devuelve texto y confianza."""
    api_key = get_api_key_for_subnivel(subnivel)

    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'audio/wav'
        }
        
        with open(fp, 'rb') as f:
            response = requests.post(
                'https://api.wit.ai/speech?v=20201126',
                headers=headers,
                data=f,
                timeout=30
            )
        
        if response.status_code != 200:
            print(f"Wit.ai error: {response.status_code}")
            return "", 0.0
            
        data = response.json()
        text = data.get('text', '').strip()
        
        # Extraer confianza del speech
        confidence = 0.0
        if 'speech' in data and 'confidence' in data['speech']:
            confidence = data['speech']['confidence']
        elif 'intents' in data and len(data['intents']) > 0:
            confidence = data['intents'][0].get('confidence', 0.0)
        
        print(f"Usando API key para '{subnivel}': texto='{text}', confianza={confidence}")
        return text, confidence
        
    except Exception as e:
        print(f"Error transcribing speech: {e}")
        return "", 0.0

# Opciones válidas actualizadas según tus subniveles
valid_options = {
    # VOCALES
    'a': ['a', 'ah', 'A' 'AAA', 'aaaa'],
    'e': ['e', 'eh', 'E'],
    'i': ['i', 'y', 'I'],
    'o': ['o', 'oh', 'O'],
    'u': ['u', 'uh', 'U'],

    # ABECEDARIO (consonantes)
    'c': ['c', 'se', 'ce', 'C'],
    'd': ['d', 'de', 'D'],
    'f': ['f', 'efe', 'F'],
    'g': ['g', 'ge', 'G'],
    'h': ['h', 'hache', 'H'],
    'j': ['j', 'jota', 'J'],
    'k': ['k', 'ka', 'K'],
    'n': ['n', 'ene', 'N'],
    'ñ': ['ñ', 'eñe', 'Ñ'],
    'q': ['q', 'cu', 'Q'],
    'r': ['r', 'ere', 'R'],
    't': ['t', 'te', 'T'],
    'v': ['v', 've', 'V'],
    'w': ['w', 'doble ve', 'W'],
    'x': ['x', 'equis', 'X'],
    'y': ['y', 'ye', 'Y'],
    'z': ['z', 'zeta', 'Z'],

    # SÍLABAS
    'ba': ['ba', 'BA', 'Ba'],
    'be': ['be', 'BE', 'Be'],
    'bi': ['bi', 'BI', 'Bi'],
    'bo': ['bo', 'BO', 'Bo'],
    'bu': ['bu', 'BU', 'Bu'],
    
    'la': ['la', 'LA', 'La'],
    'le': ['le', 'LE', 'Le'],
    'li': ['li', 'LI', 'Li'],
    'lo': ['lo', 'LO', 'Lo'],
    'lu': ['lu', 'LU', 'Lu'],
    
    'ma': ['ma', 'MA', 'Ma'],
    'me': ['me', 'ME', 'Me'],
    'mi': ['mi', 'MI', 'Mi'],
    'mo': ['mo', 'MO', 'Mo'],
    'mu': ['mu', 'MU', 'Mu'],
    
    'pa': ['pa', 'PA', 'Pa'],
    'pe': ['pe', 'PE', 'Pe'],
    'pi': ['pi', 'PI', 'Pi'],
    'po': ['po', 'PO', 'Po'],
    'pu': ['pu', 'PU', 'Pu'],
    
    'sa': ['sa', 'SA', 'Sa'],
    'se': ['se', 'SE', 'Se'],
    'si': ['si', 'SI', 'Si'],
    'so': ['so', 'SO', 'So'],
    'su': ['su', 'SU', 'Su']
}

def calculate_pronunciation_accuracy(text, target_word, speech_confidence, jitter, shimmer, subnivel):
    """
    Calcula la precisión de pronunciación basada en múltiples factores y opciones válidas.
    """
    # Normalizar textos para comparación
    text_clean = text.lower().strip()
    target_clean = target_word.lower().strip()
    
    # Factor base: confianza del speech recognition
    base_score = speech_confidence * 100
    
    # Verificar si está en las opciones válidas
    exact_match_bonus = 0
    if target_clean in valid_options:
        valid_variants = [v.lower() for v in valid_options[target_clean]]
        if text_clean in valid_variants:
            exact_match_bonus = 25  # coincidencia exacta o variante válida
        elif text_clean == target_clean:
            exact_match_bonus = 20  # coincidencia exacta directa
    
    # Factor de calidad acústica (menos jitter y shimmer = mejor)
    acoustic_quality = max(0, 100 - (jitter * 1000 + shimmer * 100))
    acoustic_factor = min(15, acoustic_quality * 0.15)
    
    # Factor de similitud fonética por subnivel
    similarity_bonus = 0
    if not exact_match_bonus and text_clean and target_clean:
        subnivel_clean = subnivel.lower() if subnivel else ""
        
        if subnivel_clean == "vocales":
            # Para vocales, similitud muy estricta
            vowel_similar = {
                'a': ['ah'], 'e': ['eh'], 'i': ['y'], 'o': ['oh'], 'u': ['uh']
            }
            if target_clean in vowel_similar and text_clean in vowel_similar[target_clean]:
                similarity_bonus = 12
                
        elif subnivel_clean == "abecedario":
            # Consonantes fonéticamente similares
            consonant_groups = [
                ['b', 'p', 've'],         # bilabiales
                ['d', 't', 'de', 'te'],   # dentales/alveolares
                ['g', 'k', 'c', 'ge'],    # velares
                ['f', 'v', 'efe'],        # labiodentales
                ['s', 'z', 'se'],         # sibilantes
                ['m', 'n', 'ñ'],          # nasales
                ['l', 'r'],               # líquidas
                ['j', 'y', 'jota'],       # aproximantes
            ]
            
            for group in consonant_groups:
                if text_clean in group and target_clean in group:
                    similarity_bonus = 10
                    break
                    
        elif subnivel_clean in ["sílabas", "silabas"]:
            # Para sílabas, verificar consonante inicial o vocal final
            if len(text_clean) >= 2 and len(target_clean) >= 2:
                if text_clean[0] == target_clean[0]:  # misma consonante inicial
                    similarity_bonus = 12
                elif text_clean[-1] == target_clean[-1]:  # misma vocal final
                    similarity_bonus = 8
        
        # Coincidencia parcial genérica
        if not similarity_bonus:
            if target_clean in text_clean or text_clean in target_clean:
                similarity_bonus = 5
    
    
    # Cálculo final
    final_score = base_score + exact_match_bonus + acoustic_factor + similarity_bonus
    
    # Normalizar entre 0 y 100
    final_score = max(0, min(100, final_score))
    
    return round(final_score, 1)

def load_json(path, default):
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return default
    return default

def save_json(path, obj):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=2, ensure_ascii=False, sort_keys=False)

# --- Rutas ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/start', methods=['POST'])
def start_report():
    """Inicia un nuevo reporte con la estructura JSON correcta."""
    data = request.get_json()
    
    # Generar ID único para el reporte
    rid = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Estructura base exacta como tu ejemplo
    base = OrderedDict([
        ("patientDetails", OrderedDict([
            ("patientId", str(data["patientDetails"].get("patientId", ""))),
            ("patientFullName", data["patientDetails"].get("patientFullName", "")),
            ("patientAge", str(data["patientDetails"].get("patientAge", ""))),
            ("patientGender", data["patientDetails"].get("patientGender", "")),
            ("diagnostic", data["patientDetails"].get("diagnostic", ""))
        ])),
        ("medicalDetails", OrderedDict([
            ("medicalCenterId", str(data["medicalDetails"].get("medicalCenterId", ""))),
            ("medicalCenterName", data["medicalDetails"].get("medicalCenterName", "")),
            ("medicalPlace", data["medicalDetails"].get("medicalPlace", "")),
            ("specialistName", data["medicalDetails"].get("specialistName", ""))
        ])),
        ("reportDetails", OrderedDict([
            ("reportId", rid),
            ("reportCreated", datetime.datetime.now().strftime('%d-%m-%Y %H:%M')),
            ("reportType", "game"),
            ("reportStatus", "in_progress"),
            ("comments", ""),
            ("recommendations", "")
        ])),
        ("reports", OrderedDict([
            ("games", OrderedDict([
                ("expresatea", OrderedDict([
                    ("levels", OrderedDict([
                        ("Level 1", OrderedDict([
                            ("sublevels", OrderedDict([
                            ]))
                        ]))
                    ]))
                ]))
            ]))
        ]))
    ])
    
    # Guardar el reporte inicial
    path = os.path.join(RESULTS_FOLDER, f"report_{rid}.json")
    save_json(path, base)
    
    return jsonify({"reportId": rid, "status": "success"})

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analiza el audio y actualiza el reporte JSON."""
    # 1) Leer parámetros
    audio = request.files.get('audio')
    rid   = request.form.get('reportId')
    level = request.form.get('level')
    sub   = request.form.get('sublevel')
    sesn  = int(request.form.get('sessionNumber', 1))    
    word  = request.form.get('word')

    if not all([audio, rid, level, sub, word]):
        return jsonify({"error": "Faltan parámetros requeridos"}), 400

    # 2) Guardar temporalmente el audio
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S_%f')
    fp = os.path.join(UPLOAD_FOLDER, f"{rid}_{timestamp}_{audio.filename}")
    audio.save(fp)

    try:
        # 3) Cargar y segmentar el audio
        y, sr = librosa.load(fp, sr=None)
        # Mejorar la detección de segmentos con parámetros más sensibles
        intervals = librosa.effects.split(y, top_db=20, frame_length=2048, hop_length=512)
        
        print(f"Detectados {len(intervals)} segmentos de audio")
        
        if len(intervals) == 0:
            return jsonify({"error": "No se detectó ninguna pronunciación"}), 400

        # 4) Preparar JSON maestro
        master_path = os.path.join(RESULTS_FOLDER, f"report_{rid}.json")
        report = load_json(master_path, {})
        levels = report["reports"]["games"]["expresatea"]["levels"]
        levels.setdefault(level, {"sublevels": {}})
        subs = levels[level]["sublevels"]
        #Mapear el subnivel al numero
        sublevel_numbers = {
            "Vocales": 1,
            "Abecedario": 2,
            "Sílabas": 3
        }

        sublevel_num = sublevel_numbers.get(sub, 1)  # default a 1 si no encuentra
        
        subs.setdefault(sub, OrderedDict([
            ("sublevelName", f"Subnivel {sublevel_num}: {sub}"),
            ("sessions", [])
        ]))

        sessions = subs[sub]["sessions"]
        while len(sessions) < sesn:
            sessions.append(OrderedDict([
                ("sessionNumber", len(sessions) + 1),
                ("words", []),
                ("sessionAverage", OrderedDict([
                    ("pronunciationAccuracy", 0.0),
                    ("totalCorrectWords", 0)
                ]))
            ]))
        session_obj = sessions[sesn - 1]
        words = session_obj["words"]
        word_obj = next((w for w in words if w["word"] == word), None)
        if not word_obj:
            word_obj = OrderedDict([
                ("word", word),
                ("repetitions", []),
                ("individualAverage", OrderedDict([
                    ("pronunciationAccuracy", 0.0),
                    ("wordRepeatedCorrectly", False)
                ]))
            ])
            words.append(word_obj)

        # 5) Analizar cada segmento como una repetición
        repetitions_data = []
        for idx, (start, end) in enumerate(intervals):
            print(f"Procesando segmento {idx + 1}: {start}-{end}")
            
            y_seg = y[start:end]
            # Filtrar segmentos muy cortos (menos de 0.3 segundos)
            if len(y_seg) < sr * 0.3:
                print(f"Segmento {idx + 1} muy corto, saltando...")
                continue
                
            segment_fp = f"{fp}_seg{idx}.wav"
            sf.write(segment_fp, y_seg, sr)

            text, speech_confidence = transcribe_speech(segment_fp, sub)
            meanF0, jitter, shimmer = analyze_audio(segment_fp)

            print(f"Segmento {idx + 1}: texto='{text}', confianza={speech_confidence}")

            if meanF0 is None:
                print(f"Segmento {idx + 1}: análisis acústico falló")
                os.remove(segment_fp)
                continue

            pronunciation_accuracy = calculate_pronunciation_accuracy(
                text, word, speech_confidence, jitter, shimmer, sub
            )
            
            # Verificar si coincide usando valid_options
            matches = False
            if word.lower() in valid_options:
                valid_variants = [v.lower() for v in valid_options[word.lower()]]
                matches = text.lower().strip() in valid_variants
            else:
                matches = text.lower().strip() == word.lower().strip()

            repetition_data = OrderedDict([
                ("pronunciationAccuracy", pronunciation_accuracy),
                ("containsPronunciationSound", True),
                ("pronunciationMatchesWord", matches)
            ])
            
            word_obj["repetitions"].append(repetition_data)
            repetitions_data.append(repetition_data)
            
            os.remove(segment_fp)

        if not repetitions_data:
            return jsonify({"error": "No se pudieron procesar segmentos válidos"}), 400

        # 6) Recalcular promedios
        reps = word_obj["repetitions"]
        if reps:
            avg_accuracy = sum(r["pronunciationAccuracy"] for r in reps) / len(reps)
            any_correct = any(r["pronunciationMatchesWord"] for r in reps)
            word_obj["individualAverage"] = OrderedDict([
                ("pronunciationAccuracy", round(avg_accuracy, 1)),
                ("wordRepeatedCorrectly", any_correct)
            ])
            
        if words:
            session_accuracies = [w["individualAverage"]["pronunciationAccuracy"] for w in words]
            correct_words = sum(1 for w in words if w["individualAverage"]["wordRepeatedCorrectly"])
            session_obj["sessionAverage"] = OrderedDict([
                ("pronunciationAccuracy", round(sum(session_accuracies) / len(session_accuracies), 1)),
                ("totalCorrectWords", correct_words)
            ])

        save_json(master_path, report)
        
        return jsonify({
            "result": {
                "reportId": rid,
                "sessionNumber": sesn,
                "word": word,
                "repetitions": repetitions_data,
                "segmentsDetected": len(intervals),
                "validSegmentsProcessed": len(repetitions_data)
            }
        })

    except Exception as e:
        print(f"Error en analyze: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Error procesando audio: {str(e)}"}), 500

    finally:
        # Limpiar archivo temporal
        if os.path.exists(fp):
            os.remove(fp)

@app.route('/report/<rid>')
def get_report(rid):
    """Obtiene el reporte completo y lo marca como completado."""
    path = os.path.join(RESULTS_FOLDER, f"report_{rid}.json")
    if not os.path.exists(path):
        return jsonify({"error": "Reporte no encontrado"}), 404
    
    report = load_json(path, {})
    if not report:
        return jsonify({"error": "Error cargando reporte"}), 500
    
    # Marcar como completado y agregar comentarios/recomendaciones
    report["reportDetails"]["reportStatus"] = "completed"
    if not report["reportDetails"]["comments"]:
        report["reportDetails"]["comments"] = "The patient has shown significant improvement in attention and focus."
    if not report["reportDetails"]["recommendations"]:
        report["reportDetails"]["recommendations"] = "The patient should continue using the app for at least 30 minutes a day."
    
    save_json(path, report)

    # Usar Response en lugar de jsonify para preservar el orden
    json_str = json.dumps(report, indent=2, ensure_ascii=False, sort_keys=False)
    return Response(
        json_str,
        mimetype='application/json',
        headers={'Content-Disposition': f'attachment; filename="report_{rid}.json"'}
    )

@app.route('/reports')
def list_reports():
    """Lista todos los reportes disponibles."""
    reports = []
    for filename in os.listdir(RESULTS_FOLDER):
        if filename.startswith('report_') and filename.endswith('.json'):
            rid = filename.replace('report_', '').replace('.json', '')
            path = os.path.join(RESULTS_FOLDER, filename)
            report = load_json(path, {})
            if report:
                reports.append({
                    "reportId": rid,
                    "patientName": report.get("patientDetails", {}).get("patientFullName", ""),
                    "created": report.get("reportDetails", {}).get("reportCreated", ""),
                    "status": report.get("reportDetails", {}).get("reportStatus", "")
                })
    return jsonify({"reports": reports})

@app.route('/finalize/<rid>', methods=['POST'])
def finalize_report(rid):
    """Finaliza un reporte con comentarios y recomendaciones."""
    data = request.get_json()
    path = os.path.join(RESULTS_FOLDER, f"report_{rid}.json")
    
    if not os.path.exists(path):
        return jsonify({"error": "Reporte no encontrado"}), 404
    
    report = load_json(path, {})
    if not report:
        return jsonify({"error": "Error cargando reporte"}), 500
    
    # Actualizar comentarios y recomendaciones
    report["reportDetails"]["comments"] = data.get("comments", "")
    report["reportDetails"]["recommendations"] = data.get("recommendations", "")
    report["reportDetails"]["reportStatus"] = "completed"
    
    save_json(path, report)
    return jsonify({"status": "success", "message": "Reporte finalizado"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)