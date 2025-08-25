// ExpresaTEA - Main JavaScript Logic
(function() {
  'use strict';

  // DOM Elements
  const elements = {
    startSection: document.getElementById('startSection'),
    analyzeForm: document.getElementById('analyzeForm'),
    startBtn: document.getElementById('startBtn'),
    reportIdInput: document.getElementById('reportId'),
    levelSelect: document.getElementById('levelSelect'),
    levelSubOptions: document.getElementById('levelSubOptions'),
    wordSelect: document.getElementById('currentWordSelect'),
    sessionInput: document.getElementById('sessionNumber'),
    audioInput: document.getElementById('audioFile'),
    selectAudioBtn: document.getElementById('selectAudioBtn'),
    fileNameDisplay: document.getElementById('fileName'),
    loading: document.getElementById('loading'),
    resultsBody: document.querySelector('#resultsTable tbody'),
    resultsTable: document.getElementById('resultsTable'),
    finishBtn: document.getElementById('finishBtn'),
    clearBtn: document.getElementById('clearBtn'),
    tableControls: document.getElementById('tableControls'),
    
    // Wizard elements
    wizardProgress: document.getElementById('wizardProgress'),
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3'),
    step4: document.getElementById('step4')
  };

  // Application State
  let reportId = '';
  let currentStep = 1;

  // Configuration Data
  const levelOptions = {
    'Level 1': ['Vocales', 'Abecedario', 'Sílabas'],
    'Level 2': ['Colores', 'Formas', 'Números'],
    'Level 3': ['Animales', 'Comida', 'Familia']
  };

  const wordLists = {
    'Vocales': ['a', 'e', 'i', 'o', 'u'],
    'Abecedario': ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'ñ', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
    'Sílabas': ['ma', 'me', 'mi', 'mo', 'mu'],
    'Colores': ['rojo', 'azul', 'verde', 'amarillo', 'naranja'],
    'Formas': ['círculo', 'cuadrado', 'triángulo'],
    'Números': ['uno', 'dos', 'tres', 'cuatro', 'cinco'],
    'Animales': ['lobo', 'zorro', 'ardilla'],
    'Comida': ['manzana', 'queso', 'pan', 'pollo'],
    'Familia': ['madre', 'padre', 'hermana', 'hermano']
  };

  // Wizard Management
  function updateWizard(step) {
    currentStep = step;
    
    const steps = [elements.step1, elements.step2, elements.step3, elements.step4];
    
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
    if (elements.wizardProgress) {
      const progressWidth = ((step - 1) / 3) * 100;
      elements.wizardProgress.style.width = progressWidth + '%';
    }
  }

  // Form Validation
  function validateRequiredFields(fieldIds) {
    const missingFields = [];
    
    for (const fieldId of fieldIds) {
      const field = document.getElementById(fieldId);
      if (!field || !field.value.trim()) {
        missingFields.push({
          field: field,
          label: field ? field.previousElementSibling?.textContent || fieldId : fieldId
        });
      }
    }
    
    if (missingFields.length > 0) {
      const firstMissing = missingFields[0];
      if (firstMissing.field) {
        firstMissing.field.focus();
        showFieldError(firstMissing.field);
      }
      showAlert(`Por favor completa el campo: ${firstMissing.label.replace(':', '')}`);
      return false;
    }
    
    return true;
  }

  function showFieldError(field) {
    field.style.borderColor = 'var(--danger-red)';
    field.style.boxShadow = '0 0 0 3px rgba(220, 53, 69, 0.1)';
    
    setTimeout(() => {
      field.style.borderColor = '';
      field.style.boxShadow = '';
    }, 3000);
  }

  function showAlert(message, type = 'error') {
    // Create and show alert
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

  // Level and Word Management
  function populateSublevels() {
    const level = elements.levelSelect.value;
    
    if (!level) {
      elements.levelSubOptions.innerHTML = `
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

    const options = levelOptions[level] || [];
    let html = `
      <div class="form-group">
        <label for="subSelect">Subnivel:</label>
        <select id="subSelect" name="sublevel" required>
          <option value="">Seleccionar subnivel...</option>
    `;
    
    options.forEach(option => {
      html += `<option value="${option}">${option}</option>`;
    });
    
    html += '</select></div>';
    elements.levelSubOptions.innerHTML = html;
    
    // Add event listener to new sublevel select
    const subSelect = document.getElementById('subSelect');
    if (subSelect) {
      subSelect.addEventListener('change', () => populateWords(subSelect.value));
    }
    
    populateWords('');
  }

  function populateWords(sublevel) {
    if (!sublevel) {
      elements.wordSelect.innerHTML = '<option value="">— Selecciona primero un subnivel —</option>';
      return;
    }

    const words = wordLists[sublevel] || [];
    let html = '<option value="">— Selecciona una palabra —</option>';
    
    words.forEach(word => {
      html += `<option value="${word}">${word}</option>`;
    });
    
    elements.wordSelect.innerHTML = html;
  }

  // Audio File Management
  function handleAudioSelection() {
    if (elements.audioInput.files[0]) {
      const fileName = elements.audioInput.files[0].name;
      elements.fileNameDisplay.innerHTML = `
        <span class="status-indicator status-success"></span>
        <strong>Archivo seleccionado:</strong> ${fileName}
      `;
    }
  }

  // Results Table Management
  function clearResults() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los resultados de la tabla?')) {
      elements.resultsBody.innerHTML = '<tr><td colspan="6" class="no-data">Sin datos disponibles.</td></tr>';
      elements.finishBtn.style.display = 'none';
      elements.resultsTable.style.display = 'none';
      updateWizard(2);
    }
  }

  function addResultsToTable(result) {
    // Show results table
    elements.resultsTable.style.display = 'table';
    
    // Clear initial "no data" message
    if (elements.resultsBody.children[0]?.children[0]?.classList?.contains('no-data')) {
      elements.resultsBody.innerHTML = '';
    }
    
    // Add separator if there are existing results
    if (elements.resultsBody.children.length > 0) {
      const separatorTr = document.createElement('tr');
      separatorTr.style.borderTop = '3px solid var(--primary-blue)';
      separatorTr.innerHTML = `
        <td colspan="6" style="height: 8px; background: linear-gradient(90deg, var(--primary-blue-light) 0%, white 100%);"></td>
      `;
      elements.resultsBody.appendChild(separatorTr);
    }
    
    // Add individual repetition rows
    if (result.repetitions && result.repetitions.length > 0) {
      result.repetitions.forEach((repetition, index) => {
        const tr = document.createElement('tr');
        tr.style.transition = 'all 0.3s ease';
        
        // Determine accuracy class
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
        elements.resultsBody.appendChild(tr);
      });
      
      // Add summary row
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
      elements.resultsBody.appendChild(summaryTr);
      
      // Add info row
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
        elements.resultsBody.appendChild(infoTr);
      }
    } else {
      // No repetitions found
      const tr = document.createElement('tr');
      tr.style.background = '#ffe6e6';
      tr.style.color = 'var(--danger-red)';
      tr.innerHTML = `
        <td><strong>${result.reportId}</strong></td>
        <td>Sesión ${result.sessionNumber}</td>
        <td><span style="color: var(--danger-red); font-weight: 600;">${result.word}</span></td>
        <td colspan="3" style="text-align: center;">
          ⌛ <strong>No se detectaron repeticiones válidas en el audio</strong>
          <small style="display: block; color: #666; margin-top: 5px;">
            ${new Date().toLocaleTimeString()}
          </small>
        </td>
      `;
      elements.resultsBody.appendChild(tr);
    }
  }

  // API Calls
  async function startReport() {
    const requiredFields = [
      'patientId', 'patientFullName', 'patientAge', 'patientGender', 'diagnostic',
      'medicalCenterId', 'medicalCenterName', 'medicalPlace', 'specialistName'
    ];
    
    if (!validateRequiredFields(requiredFields)) {
      return;
    }

    const patientDetails = {
      patientId: document.getElementById('patientId').value,
      patientFullName: document.getElementById('patientFullName').value,
      patientAge: document.getElementById('patientAge').value,
      patientGender: document.getElementById('patientGender').value,
      diagnostic: document.getElementById('diagnostic').value
    };

    const medicalDetails = {
      medicalCenterId: document.getElementById('medicalCenterId').value,
      medicalCenterName: document.getElementById('medicalCenterName').value,
      medicalPlace: document.getElementById('medicalPlace').value,
      specialistName: document.getElementById('specialistName').value
    };
    
    try {
      const response = await fetch('/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientDetails, medicalDetails })
      });
      
      if (!response.ok) {
        throw new Error('Error al iniciar el reporte');
      }
      
      const data = await response.json();
      reportId = data.reportId;
      elements.reportIdInput.value = reportId;
      
      // Transition to step 2
      elements.startSection.style.display = 'none';
      elements.analyzeForm.style.display = 'block';
      elements.analyzeForm.classList.add('slide-in');
      elements.tableControls.style.display = 'block';
      updateWizard(2);
      
      populateSublevels();
      showAlert('Reporte iniciado correctamente', 'success');
      
    } catch (error) {
      console.error('Error starting report:', error);
      showAlert('Error al iniciar el reporte: ' + error.message);
    }
  }

  async function analyzeAudio(event) {
    event.preventDefault();
    
    // Validation
    if (!reportId) {
      showAlert('Error: No se ha iniciado el reporte.');
      return;
    }
    
    const subSelect = document.getElementById('subSelect');
    if (!elements.levelSelect.value) {
      showAlert('Por favor selecciona un nivel.');
      elements.levelSelect.focus();
      return;
    }
    
    if (!subSelect?.value) {
      showAlert('Por favor selecciona un subnivel.');
      subSelect?.focus();
      return;
    }
    
    if (!elements.wordSelect.value) {
      showAlert('Por favor selecciona una palabra.');
      elements.wordSelect.focus();
      return;
    }
    
    if (!elements.audioInput.files.length) {
      showAlert('Por favor selecciona un archivo de audio.');
      elements.selectAudioBtn.focus();
      return;
    }

    const formData = new FormData(elements.analyzeForm);
    
    // Update wizard to step 3
    updateWizard(3);
    elements.loading.style.display = 'block';
    
    try {
      const response = await fetch('/analyze', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      const data = await response.json();
      console.log('Resultado del análisis:', data.result);
      
      addResultsToTable(data.result);
      
      // Update wizard to step 4 and show finish button
      updateWizard(4);
      elements.finishBtn.style.display = 'inline-block';
      
      // Clear form for next analysis
      elements.audioInput.value = '';
      elements.fileNameDisplay.innerHTML = '';
      
      showAlert('Análisis completado correctamente', 'success');
      
    } catch (error) {
      console.error('Error analyzing audio:', error);
      showAlert('Error: ' + error.message);
    } finally {
      elements.loading.style.display = 'none';
    }
  }

  async function downloadReport() {
    if (!reportId) {
      showAlert('No hay reporte para descargar');
      return;
    }
    
    try {
      elements.finishBtn.disabled = true;
      elements.finishBtn.textContent = '📥 Descargando...';
      
      const response = await fetch(`/report/${reportId}`);
      if (!response.ok) {
        throw new Error('Error al obtener el reporte');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Success feedback
      elements.finishBtn.style.background = 'var(--success-green)';
      elements.finishBtn.textContent = '✓ Descarga Completada';
      
      setTimeout(() => {
        elements.finishBtn.disabled = false;
        elements.finishBtn.style.background = '';
        elements.finishBtn.textContent = '📥 Finalizar y Descargar JSON';
      }, 3000);
      
      showAlert('Reporte descargado correctamente', 'success');
      
    } catch (error) {
      console.error('Error downloading report:', error);
      showAlert('Error al descargar el reporte: ' + error.message);
      elements.finishBtn.disabled = false;
      elements.finishBtn.textContent = '📥 Finalizar y Descargar JSON';
    }
  }

  // Event Listeners
  function initializeEventListeners() {
    // Start button
    if (elements.startBtn) {
      elements.startBtn.addEventListener('click', startReport);
    }

    // Level select
    if (elements.levelSelect) {
      elements.levelSelect.addEventListener('change', populateSublevels);
    }

    // Audio file selection
    if (elements.selectAudioBtn) {
      elements.selectAudioBtn.addEventListener('click', () => {
        elements.audioInput.click();
      });
    }

    if (elements.audioInput) {
      elements.audioInput.addEventListener('change', handleAudioSelection);
    }

    // Form submission
    if (elements.analyzeForm) {
      elements.analyzeForm.addEventListener('submit', analyzeAudio);
    }

    // Clear button
    if (elements.clearBtn) {
      elements.clearBtn.addEventListener('click', clearResults);
    }

    // Finish button
    if (elements.finishBtn) {
      elements.finishBtn.addEventListener('click', downloadReport);
    }

    // Add CSS for animations
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
  }

  // Initialize Application
  function init() {
    console.log('ExpresaTEA Application Starting...');
    
    // Check if DOM elements exist
    const missingElements = [];
    Object.keys(elements).forEach(key => {
      if (!elements[key]) {
        missingElements.push(key);
      }
    });
    
    if (missingElements.length > 0) {
      console.warn('Missing DOM elements:', missingElements);
    }
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize wizard
    updateWizard(1);
    
    // Initialize form states
    populateSublevels();
    
    console.log('ExpresaTEA Application Initialized Successfully');
  }

  // Start the application when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();