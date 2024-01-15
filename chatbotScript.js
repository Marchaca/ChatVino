function nextStep(stepNumber) {
    // Ocultar todos los pasos
    document.querySelectorAll('.form-step').forEach(step => {
      step.style.display = 'none';
    });
  
    // Mostrar el paso actual
    document.getElementById(`step${stepNumber}`).style.display = 'block';
  }
  