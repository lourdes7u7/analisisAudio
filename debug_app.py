# detailed_debug.py - Diagnóstico más específico
import sys
import os
import traceback
print(f"Python version: {sys.version}")

# Test 1: Verificar librerías básicas
print("\n=== TEST 1: LIBRERÍAS BÁSICAS ===")
try:
    import flask
    print(f"✓ Flask version: {flask.__version__}")
except Exception as e:
    print(f"✗ Error importando Flask: {e}")

try:
    import librosa
    print(f"✓ Librosa version: {librosa.__version__}")
except Exception as e:
    print(f"✗ Error importando Librosa: {e}")

try:
    import numpy as np
    print(f"✓ Numpy version: {np.__version__}")
except Exception as e:
    print(f"✗ Error importando Numpy: {e}")

try:
    import scipy
    print(f"✓ Scipy version: {scipy.__version__}")
except Exception as e:
    print(f"✗ Error importando Scipy: {e}")

try:
    import soundfile
    print(f"✓ Soundfile version: {soundfile.__version__}")
except Exception as e:
    print(f"✗ Error importando Soundfile: {e}")

try:
    import requests
    print(f"✓ Requests version: {requests.__version__}")
except Exception as e:
    print(f"✗ Error importando Requests: {e}")

# Test 2: Probar carga de audio (esto podría ser donde falla)
print("\n=== TEST 2: CARGA DE AUDIO ===")
try:
    print("Intentando cargar archivo de ejemplo de librosa...")
    y, sr = librosa.load(librosa.ex('trumpet'), duration=5)
    print(f"✓ Librosa puede cargar archivos de audio: {len(y)} samples, {sr} Hz")
except Exception as e:
    print(f"✗ Error cargando audio con librosa: {e}")
    traceback.print_exc()

# Test 3: Verificar directorios necesarios
print("\n=== TEST 3: DIRECTORIOS ===")
required_dirs = ['uploads', 'results', 'static']
for dir_name in required_dirs:
    if os.path.exists(dir_name):
        print(f"✓ Directorio '{dir_name}' existe")
    else:
        print(f"✗ Directorio '{dir_name}' NO existe - creando...")
        try:
            os.makedirs(dir_name, exist_ok=True)
            print(f"✓ Directorio '{dir_name}' creado")
        except Exception as e:
            print(f"✗ Error creando directorio '{dir_name}': {e}")

# Test 4: Verificar template
print("\n=== TEST 4: TEMPLATE ===")
if os.path.exists('index.html'):
    print("✓ Template index.html existe")
    with open('index.html', 'r', encoding='utf-8') as f:
        content = f.read()
        print(f"✓ Template tiene {len(content)} caracteres")
else:
    print("✗ Template index.html NO existe")
    print("Tu app necesita un archivo index.html en el directorio raíz")

# Test 5: Verificar conectividad a Wit.ai
print("\n=== TEST 5: CONECTIVIDAD WIT.AI ===")
try:
    import requests
    response = requests.get('https://api.wit.ai/', timeout=10)
    print(f"✓ Wit.ai accesible: Status {response.status_code}")
except Exception as e:
    print(f"✗ Error conectando a Wit.ai: {e}")

# Test 6: Probar funciones específicas de tu app
print("\n=== TEST 6: FUNCIONES ESPECÍFICAS ===")
try:
    # Probar función analyze_audio básica
    print("Probando análisis de audio básico...")
    from scipy.stats import pearsonr
    print("✓ scipy.stats importado correctamente")
    
    # Probar carga de JSON
    import json
    from collections import OrderedDict
    test_dict = OrderedDict([("test", "value")])
    json_str = json.dumps(test_dict, ensure_ascii=False)
    print("✓ JSON con OrderedDict funciona")
    
except Exception as e:
    print(f"✗ Error en funciones específicas: {e}")
    traceback.print_exc()

# Test 7: Verificar puerto
print("\n=== TEST 7: PUERTO ===")
import socket
try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', 5000))
    if result == 0:
        print("✗ Puerto 5000 está ocupado")
    else:
        print("✓ Puerto 5000 está libre")
    sock.close()
except Exception as e:
    print(f"? Error verificando puerto: {e}")

print("\n=== DIAGNÓSTICO COMPLETADO ===")
print("Si todo está OK arriba, el problema podría estar en:")
print("1. El template index.html faltante")
print("2. Un bucle infinito en alguna función")
print("3. Problema de codificación en app.py")
print("4. Llamada bloqueante a alguna API")