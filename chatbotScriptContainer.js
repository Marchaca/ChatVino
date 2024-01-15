document.addEventListener('DOMContentLoaded', function() {
  const chatbotForm = document.getElementById('chatbotForm');
  const chatbotContainer = document.getElementById('chatbotContainer');
  const sendMessageButton = document.getElementById('sendMessage');
  const userInput = document.getElementById('userInput');
  const chatbotMessages = document.getElementById('chatbotMessages');
  const loadingElement = document.getElementById('loading');
  const instructionsContainer = document.getElementById('instructionsContainer');
  const chatbotFormContainer = document.querySelector('.chatbot-form-container');

  // Manejar la presentación del formulario
  chatbotForm.addEventListener('submit', function(event) {
    event.preventDefault();

    // Mostrar el elemento de carga
    loadingElement.style.display = 'block';

    // Simular un retraso para la carga (puedes ajustar el tiempo según sea necesario)
    setTimeout(function() {
      // Ocultar elemento de carga
      loadingElement.style.display = 'none';

      // Ocultar instrucciones y formulario
      instructionsContainer.style.display = 'none';
      chatbotFormContainer.style.display = 'none';

      // Mostrar el contenedor del Chatbot
      chatbotContainer.style.display = 'block';
    }, 2000); // 2 segundos de retraso
  });

  // Manejar el envío de mensajes
  sendMessageButton.addEventListener('click', function() {
    const message = userInput.value.trim();
    if (message) {
      addMessageToChat('user', message);
      sendToBackend(message);
      userInput.value = '';
    }
  });

// Función para agregar mensajes al chat
function addMessageToChat(sender, message) {
  const messageElement = document.createElement('p');
  messageElement.className = sender === 'user' ? 'user-message' : 'chatbot-message';
  chatbotMessages.appendChild(messageElement);

  // Divide el mensaje en partes basadas en etiquetas HTML
  const parts = message.split(/(<\/?[^>]+>)/).filter(part => part.trim() !== '');
  let i = 0;
  let currentContent = ''; // Almacena el contenido actual mientras se construye

  function typeWriter() {
      if (i < parts.length) {
          currentContent += parts[i]; // Añade la parte actual al contenido acumulado
          messageElement.innerHTML = currentContent; // Establece el contenido acumulado como HTML
          i++;
          setTimeout(typeWriter, 200); // Ajusta la velocidad aquí
      }
  }

  typeWriter(); // Comienza a "escribir" el mensaje
  chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}








   // Función para enviar mensajes al backend y recibir respuesta
  function sendToBackend(message) {
    fetch('http://localhost:3000/api/message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
      if (Array.isArray(data.message)) {
          // Definir un retardo inicial
          let delay = 0;
          const delayIncrement = 2000; // 1500 ms = 2 segundos entre mensajes

          data.message.forEach(msg => {
              // Programar cada mensaje para que se muestre con un retardo
              setTimeout(() => {
                  addMessageToChat('bot', msg);
              }, delay);

              // Incrementar el retardo para el siguiente mensaje
              delay += delayIncrement;
          });
      } else {
          // Si no es un array, mostrar el mensaje directamente
          addMessageToChat('bot', data.message);
      }
  })
    .catch((error) => {
        console.error('Error:', error);
        addMessageToChat('bot', 'Hubo un error al procesar tu mensaje.');
    });
}
});
