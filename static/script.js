document.addEventListener('DOMContentLoaded', () => {
  const startSection    = document.getElementById('startSection');
  const analyzeForm     = document.getElementById('analyzeForm');
  const startBtn        = document.getElementById('startBtn');
  const rptIdInput      = document.getElementById('reportId');
  const levelSelect     = document.getElementById('levelSelect');
  const levelSubOpts    = document.getElementById('levelSubOptions');
  const wordSelect      = document.getElementById('currentWordSelect');
  const sessionInput    = document.getElementById('sessionNumber');
  const audioInput      = document.getElementById('audioFile');
  const fileNameDisplay = document.getElementById('fileName');
  const loading         = document.getElementById('loading');
  const resultsBody     = document.querySelector('#resultsTable tbody');
  const finishBtn       = document.getElementById('finishBtn');
  const clearBtn        = document.getElementById('clearBtn');

  let reportId = '';
  let currentStep = 1;

  // Wizard Management
  function updateWizard(step) {
    currentStep = step;
    
    const steps = [
      document.getElementById('step1'), 
      document.getElementById('step2'), 
      document.getElementById('step3'), 
      document.getElementById('step4')
    ];
    
    // Reset all steps
    steps.forEach((stepElement, index) => {
      if (!stepElement) return;
      
      stepElement.classList.remove('active', 'completed');
      if (index + 1 < step) {
        stepElement.classList.add('completed');
      } else if (index + 1 === step) {
        stepElement.classList.add('active');
      }
    });

    // Update progress bar
    const wizardProgress = document.getElementById('wizardProgress');
    if (wizardProgress) {
      const progressWidth = ((step - 1) / 3) * 100;
      wizardProgress.style.width = progressWidth + '%';
    }
  }

  // Función para mostrar alertas
  function showAlert(message, type = 'error') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      z-index: 1000;
      max-width: 400px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      animation: slideInRight 0.3s ease;
    `;
    
    if (type === 'error') {
      alertDiv.style.background = 'var(--danger-red)';
    } else if (type === 'success') {
      alertDiv.style.background = 'var(--success-green)';
    } else if (type === 'warning') {
      alertDiv.style.background = 'var(--warning-yellow)';
      alertDiv.style.color = '#856404';
    }
    
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      alertDiv.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        if (alertDiv.parentNode) {
          alertDiv.parentNode.removeChild(alertDiv);
        }
      }, 300);
    }, 4000);
  }

  // Función para validar campos requeridos
  function validateRequiredFields(fieldIds) {
    const missingFields = [];
    
    for (const fieldId of fieldIds) {
      const field = document.getElementById(fieldId);
      if (!field || !field.value.trim()) {
        missingFields.push({
          field: field,
          label: getFieldLabel(field, fieldId)
        });
      }
    }
    
    if (missingFields.length > 0) {
      const firstMissing = missingFields[0];
      if (firstMissing.field) {
        firstMissing.field.focus();
        showFieldError(firstMissing.field);
      }
      showAlert(`Por favor completa el campo: ${firstMissing.label}`);
      return false;
    }
    
    return true;
  }

  // Función para obtener la etiqueta del campo
  function getFieldLabel(field, fieldId) {
    if (field) {
      // Buscar el label asociado
      const label = field.previousElementSibling;
      if (label && label.tagName === 'LABEL') {
        return label.textContent.replace(':', '');
      }
      
      // Buscar por el atributo for
      const labelFor = document.querySelector(`label[for="${fieldId}"]`);
      if (labelFor) {
        return labelFor.textContent.replace(':', '');
      }
    }
    
    // Nombres por defecto basados en el ID
    const defaultLabels = {
      'patientId': 'ID Paciente',
      'patientFullName': 'Nombre Completo',
      'patientAge': 'Edad',
      'patientGender': 'Género',
      'diagnostic': 'Diagnóstico',
      'medicalCenterId': 'ID Centro',
      'medicalCenterName': 'Nombre del Centro',
      'medicalPlace': 'Ubicación',
      'specialistName': 'Especialista'
    };
    
    return defaultLabels[fieldId] || fieldId;
  }

  // Función para mostrar error en el campo
  function showFieldError(field) {
    field.style.borderColor = 'var(--danger-red)';
    field.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
    
    setTimeout(() => {
      field.style.borderColor = '';
      field.style.boxShadow = '';
    }, 3000);
  }

  // Función para limpiar la tabla manualmente
  if (clearBtn) {
    clearBtn.onclick = () => {
      if (confirm('¿Estás seguro de que quieres limpiar todos los resultados de la tabla?')) {
        resultsBody.innerHTML = '<tr><td colspan="6" class="no-data">Sin datos disponibles.</td></tr>';
        finishBtn.style.display = 'none';
        document.getElementById('resultsTable').style.display = 'none';
        // Reset wizard to step 2
        updateWizard(2);
      }
    };
  }

  // 1) Iniciar reporte con validaciones
  startBtn.onclick = async () => {
    // Validar todos los campos requeridos
    const requiredFields = [
      'patientId', 'patientFullName', 'patientAge', 'patientGender', 'diagnostic',
      'medicalCenterId', 'medicalCenterName', 'medicalPlace', 'specialistName'
    ];
    
    if (!validateRequiredFields(requiredFields)) {
      return;
    }

    // Validación específica para edad
    const ageField = document.getElementById('patientAge');
    const age = parseInt(ageField.value);
    if (age < 1 || age > 120) {
      showFieldError(ageField);
      showAlert('La edad debe estar entre 1 y 120 años');
      ageField.focus();
      return;
    }

    const patientDetails = {
      patientId:       document.getElementById('patientId').value.trim(),
      patientFullName: document.getElementById('patientFullName').value.trim(),
      patientAge:      document.getElementById('patientAge').value,
      patientGender:   document.getElementById('patientGender').value,
      diagnostic:      document.getElementById('diagnostic').value.trim()
    };
    
    const medicalDetails = {
      medicalCenterId:   document.getElementById('medicalCenterId').value.trim(),
      medicalCenterName: document.getElementById('medicalCenterName').value.trim(),
      medicalPlace:      document.getElementById('medicalPlace').value.trim(),
      specialistName:    document.getElementById('specialistName').value.trim()
    };

    try {
      startBtn.disabled = true;
      startBtn.textContent = '🔄 Iniciando...';
      
      const res = await fetch('/start', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({patientDetails, medicalDetails})
      });
      
      if (!res.ok) {
        throw new Error('Error al iniciar el reporte');
      }
      
      const j = await res.json();
      reportId = j.reportId;
      rptIdInput.value = reportId;
      
      startSection.style.display = 'none';
      analyzeForm.style.display  = 'block';
      analyzeForm.classList.add('slide-in');
      document.getElementById('tableControls').style.display = 'block';
      
      // Update wizard to step 2
      updateWizard(2);
      
      levelSelect.dispatchEvent(new Event('change'));
      
      showAlert('Reporte iniciado correctamente', 'success');
      
    } catch (error) {
      console.error('Error starting report:', error);
      showAlert('Error al iniciar el reporte: ' + error.message);
    } finally {
      startBtn.disabled = false;
      startBtn.textContent = '🚀 Continuar al Análisis';
    }
  };

  // 2) Renderizar subniveles y palabras
  levelSelect.onchange = () => {
    const lvl = levelSelect.value;
    
    if (!lvl) {
      levelSubOpts.innerHTML = `
        <div class="form-group">
          <label for="subSelect">Subnivel:</label>
          <select id="subSelect" name="sublevel" required>
            <option value="">Selecciona primero un nivel</option>
          </select>
        </div>
      `;
      populateWords('');
      return;
    }

    let html = `
      <div class="form-group">
        <label for="subSelect">Subnivel:</label>
        <select id="subSelect" name="sublevel" required>
          <option value="">Seleccionar subnivel...</option>
    `;
    
    const opts = {
      'Level 1': ['Vocales','Abecedario','Sílabas'],
    };
    
    if (opts[lvl]) {
      opts[lvl].forEach(o => html += `<option value="${o}">${o}</option>`);
    }
    
    html += '</select></div>';
    levelSubOpts.innerHTML = html;
    
    const sub = document.getElementById('subSelect');
    if (sub) {
      sub.onchange = () => populateWords(sub.value);
    }
    populateWords('');
  };

  function populateWords(sub) {
    if (!sub) {
      wordSelect.innerHTML = '<option value="">— Selecciona primero un subnivel —</option>';
      return;
    }

        const lists = {
      'Vocales':    ['a','e','i','o','u'],
      'Abecedario': ['c','d','f','g','h','j','k','n','ñ','q','r','t','v','w','x','y','z'],
      'Sílabas':    ['ba', 'be', 'bi', 'bo', 'bu', 
        'la', 'le', 'li', 'lo', 'lu', 
        'ma','me','mi','mo','mu',
        'pa', 'pe','pi','po','pu',
        'sa', 'se','si','so','su'
      ]
    };
    
    wordSelect.innerHTML = '<option value="">— Selecciona una palabra —</option>' +
      (lists[sub]||[]).map(w => `<option value="${w}">${w}</option>`).join('');
  }

  // 3) Nombre de archivo
  audioInput.onchange = () => {
    if (audioInput.files[0]) {
      const fileName = audioInput.files[0].name;
      fileNameDisplay.innerHTML = `
        <span class="status-indicator status-success"></span>
        <strong>Archivo seleccionado:</strong> ${fileName}
      `;
    }
  };

  // 4) Submit de análisis con validaciones
  analyzeForm.addEventListener('submit', async e => {
    e.preventDefault();
    
    // Validaciones
    if (!reportId) {
      showAlert('Error: No se ha iniciado el reporte.');
      return;
    }
    
    if (!levelSelect.value) {
      showAlert('Por favor selecciona un nivel.');
      levelSelect.focus();
      showFieldError(levelSelect);
      return;
    }
    
    const subSelect = document.getElementById('subSelect');
    if (!subSelect?.value) {
      showAlert('Por favor selecciona un subnivel.');
      if (subSelect) {
        subSelect.focus();
        showFieldError(subSelect);
      }
      return;
    }
    
    if (!wordSelect.value) {
      showAlert('Por favor selecciona una palabra.');
      wordSelect.focus();
      showFieldError(wordSelect);
      return;
    }
    
    if (!sessionInput.value || sessionInput.value < 1) {
      showAlert('Por favor ingresa un número de sesión válido.');
      sessionInput.focus();
      showFieldError(sessionInput);
      return;
    }
    
    if (!audioInput.files.length) {
      showAlert('Por favor selecciona un archivo de audio.');
      document.getElementById('selectAudioBtn')?.focus();
      return;
    }

    const form = new FormData(analyzeForm);
    
    // Update wizard to step 3 (processing)
    updateWizard(3);
    loading.style.display = 'block';
    
    try {
      const res = await fetch('/analyze', { method:'POST', body: form });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      const { result } = await res.json();
      
      console.log('Resultado del análisis:', result);
      
      // Mostrar tabla de resultados
      document.getElementById('resultsTable').style.display = 'table';
      
      // Limpiar tabla solo si tiene el mensaje inicial "Sin datos"
      if (resultsBody.children[0]?.children[0]?.classList?.contains('no-data')) {
        resultsBody.innerHTML = '';
      }
      
      // Agregar separador visual si ya hay datos en la tabla
      if (resultsBody.children.length > 0) {
        const separatorTr = document.createElement('tr');
        separatorTr.style.borderTop = '3px solid var(--primary-blue)';
        separatorTr.innerHTML = `<td colspan="6" style="height: 8px; background: linear-gradient(90deg, var(--primary-blue-light) 0%, white 100%);"></td>`;
        resultsBody.appendChild(separatorTr);
      }
      
      // Agregar una fila por cada repetición detectada
      if (result.repetitions && result.repetitions.length > 0) {
        result.repetitions.forEach((repetition, index) => {
          const tr = document.createElement('tr');
          tr.style.transition = 'all 0.3s ease';
          
          // Determinar clase de precisión
          let accuracyClass = 'danger';
          if (repetition.pronunciationAccuracy >= 70) accuracyClass = 'success';
          else if (repetition.pronunciationAccuracy >= 50) accuracyClass = 'warning';
          
          tr.innerHTML = `
            <td><strong>${result.reportId}</strong></td>
            <td><span class="badge">Sesión ${result.sessionNumber}</span></td>
            <td><span style="color: var(--primary-blue); font-weight: 600;">${result.word}</span></td>
            <td>Repetición ${index + 1}</td>
            <td><span class="accuracy-badge ${accuracyClass}">${repetition.pronunciationAccuracy}%</span></td>
            <td><span class="validation-badge ${repetition.pronunciationMatchesWord ? 'success' : 'danger'}">
              ${repetition.pronunciationMatchesWord ? '✓ Correcto' : '✗ Incorrecto'}
            </span></td>
          `;
          resultsBody.appendChild(tr);
        });
        
        // Agregar fila de resumen para este análisis específico
        const avgAccuracy = result.repetitions.reduce((sum, rep) => sum + rep.pronunciationAccuracy, 0) / result.repetitions.length;
        const correctCount = result.repetitions.filter(rep => rep.pronunciationMatchesWord).length;
        
        const summaryTr = document.createElement('tr');
        summaryTr.style.background = 'linear-gradient(135deg, var(--primary-blue-light) 0%, white 100%)';
        summaryTr.style.fontWeight = 'bold';
        summaryTr.style.borderTop = '2px solid var(--primary-blue)';
        summaryTr.style.borderBottom = '2px solid var(--primary-blue)';
        summaryTr.innerHTML = `
          <td colspan="3" style="color: var(--primary-blue);">📊 <strong>RESUMEN - ${result.word.toUpperCase()}</strong></td>
          <td><span class="summary-badge">${result.repetitions.length} repeticiones</span></td>
          <td><span class="summary-badge">Promedio: ${avgAccuracy.toFixed(1)}%</span></td>
          <td><span class="summary-badge">${correctCount}/${result.repetitions.length} correctas</span></td>
        `;
        resultsBody.appendChild(summaryTr);
        
        // Mostrar información adicional para este análisis
        if (result.segmentsDetected !== undefined) {
          const infoTr = document.createElement('tr');
          infoTr.style.background = 'var(--warning-yellow)';
          infoTr.style.fontSize = '0.9em';
          infoTr.style.fontStyle = 'italic';
          infoTr.style.color = '#856404';
          infoTr.innerHTML = `
            <td colspan="6" style="padding: 15px;">
              ℹ️ <strong>Análisis completado:</strong> 
              ${result.segmentsDetected} segmentos detectados, 
              ${result.validSegmentsProcessed} procesados válidos para "${result.word}"
              <small style="float: right; color: #666; font-weight: 600;">
                ${new Date().toLocaleTimeString()}
              </small>
            </td>
          `;
          resultsBody.appendChild(infoTr);
        }
      } else {
        // Si no hay repeticiones, mostrar mensaje de error pero mantener resultados anteriores
        const tr = document.createElement('tr');
        tr.style.background = '#ffe6e6';
        tr.style.color = 'var(--danger-red)';
        tr.innerHTML = `
          <td><strong>${result.reportId}</strong></td>
          <td>Sesión ${result.sessionNumber}</td>
          <td><span style="color: var(--danger-red); font-weight: 600;">${result.word}</span></td>
          <td colspan="3" style="text-align: center;">
            ⏱ <strong>No se detectaron repeticiones válidas en el audio</strong>
            <small style="display: block; color: #666; margin-top: 5px;">
              ${new Date().toLocaleTimeString()}
            </small>
          </td>
        `;
        resultsBody.appendChild(tr);
      }
      
      // Update wizard to step 4 (results) and show finish button
      updateWizard(4);
      finishBtn.style.display = 'inline-block';
      
      // Limpiar formulario para el siguiente análisis
      audioInput.value = '';
      fileNameDisplay.innerHTML = '';
      
      showAlert('Análisis completado correctamente', 'success');
      
    } catch(err) {
      console.error('Error completo:', err);
      showAlert('Error: ' + err.message);
    } finally {
      loading.style.display = 'none';
      // If there was an error, return to step 2
      if (currentStep === 3) {
        updateWizard(2);
      }
    }
  });

  // 5) Finalizar y descargar JSON maestro
  finishBtn.onclick = async () => {
    if (!reportId) {
      showAlert('No hay reporte para descargar');
      return;
    }
    
    try {
      finishBtn.disabled = true;
      finishBtn.textContent = '🔥 Descargando...';
      
      const res = await fetch(`/report/${reportId}`);
      if (!res.ok) {
        throw new Error('Error al obtener el reporte');
      }
      
      // Crear blob desde el response directamente
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `report_${reportId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      
      // Feedback de éxito
      finishBtn.style.background = 'var(--success-green)';
      finishBtn.textContent = '✓ Descarga Completada';
      
      setTimeout(() => {
        finishBtn.disabled = false;
        finishBtn.style.background = '';
        finishBtn.textContent = '🔥 Finalizar y Descargar JSON';
      }, 3000);
      
      showAlert('Reporte descargado correctamente', 'success');
      
    } catch(err) {
      console.error('Error descargando reporte:', err);
      showAlert('Error al descargar el reporte: ' + err.message);
      finishBtn.disabled = false;
      finishBtn.textContent = '🔥 Finalizar y Descargar JSON';
    }
  };

  // Botón para seleccionar audio
  const selectAudioBtn = document.getElementById('selectAudioBtn');
  if (selectAudioBtn) {
    selectAudioBtn.addEventListener('click', () => {
      audioInput.click();
    });
  }

  // Añadir estilos para las animaciones de alertas
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    .alert {
      transition: all 0.3s ease;
    }
  `;
  document.head.appendChild(style);

  // Initialize wizard on load
  updateWizard(1);
});