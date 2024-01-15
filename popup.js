function showPopup() {
    var popup = document.getElementById('chatbot-popup');
    popup.style.display = 'block';
    setTimeout(function() {
        popup.style.transform = 'translateY(0)';
    }, 10);  // Pequeño retraso para asegurar que la animación se ejecute correctamente
}

function closePopup() {
    var popup = document.getElementById('chatbot-popup');
    popup.style.transform = 'translateY(100%)';
    setTimeout(function() {
        popup.style.display = 'none';
    }, 300);  // Alineado con la duración de la transición CSS
}

// Muestra el pop-up después de 2 segundos
setTimeout(showPopup, 2000);
