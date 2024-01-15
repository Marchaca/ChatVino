// chatbotLogic.js
const dialogFlow = require('./dialogFlow');

// Constantes respuestas chatbot (clasificacion)



// Saludo Usuario
// --------------------------------------------------------------------
const RESPUESTA_SALUDO_USUARIO = 'SaludoInicialUsuario';


// Buscar Vino
// --------------------------------------------------------------------
// General
const AYUDA_ENCONTRAR_BOTELLA = 'AyudaEncontrarBotella';
const AYUDA_ENCONTRAR_BOTELLA_MARIDAJE = 'AyudaEncontrarBotellaMaridaje'
// Por tipo----
// Tinto
const AYUDA_ENCONTRAR_BOTELLA_TINTO = 'AyudaEncontrarBotellaVinoTinto';
// Blanco
const AYUDA_ENCONTRAR_BOTELLA_BLANCO = 'AyudaEncontrarBotellaVinoBlanco';
// Rosado
const AYUDA_ENCONTRAR_BOTELLA_ROSADO = 'AyudaEncontrarBotellaVinoRosado';
// Espumoso
const AYUDA_ENCONTRAR_BOTELLA_ESPUMOSO = 'AyudaEncontrarBotellaVinoEspumoso';
// Dulce
const AYUDA_ENCONTRAR_BOTELLA_DULCE = 'AyudaEncontrarBotellaVinoDulce';
// Por bodega----



// Informacion
// --------------------------------------------------------------------
// Información Almacenamiento y Servicio
const INFORMACION_ALMACENAMIENTO = 'InformacionAlmacenamiento';
const INFORMACION_SERVICIO = 'InformacionServicio';
// Informacion Bodega
const INFORMACION_BODEGA = 'InformacionBodega'
// Informacion Variantes de Uva
const INFORMACION_VARIEDADES_DE_UVAS = 'InformacionVariedadesDeUva';
// Informacion DO
const INFORMACION_DO = 'InformacionDO';
// Historia Vino Tinto
const HISTORIA_VINO_TINTO = 'HistoriaVinoTintoEspaña';
// Historia Vino Blanco
const HISTORIA_VINO_BLANCO = 'HistoriaVinoBlancoEspaña';
// HIstoria Vino Rosado
const HISTORIA_VINO_ROSADO = 'HistoriaVinoRosadoEspaña';
// Historia Vino Espumoso
const HISTORIA_VINO_ESPUMOSO = 'HistoriaVinoEspumosoEspaña';
// Historia Vino Dulce
const HISTORIA_VINO_DULCE = 'HistoriaVinoDulceEspaña';


// Asistencia general
// --------------------------------------------------------------------
// Usos Chatvino
const ASISTENCIA_GENERAL_USOS_CHATVINO = 'AsistenciaGeneralUsosChatVino';
// Preguntas Frecuentes
const ASISTENCIA_GENERAL_PREGUNTAS_FRECUENTES = 'AsistenciaGeneralPreguntasFrecuentes';
// Contacto y Soporte
const ASISTENCIA_GENERAL_CONTACTO_Y_SOPORTE = 'AsistenciaGeneralContactoYSoporte';




// ADICCION
// --------------------------------------------------------------------
const ADICCION_BUSQUEDA = "AdiccionBusqueda";














require('dotenv').config();


const { IntentsClient } = require('dialogflow/src/v2');
const fs = require('fs');
const fs2 = require('fs').promises;
const fs3 = require('fs').promises;
const natural = require('natural');
const classifier = new natural.BayesClassifier();


const OpenAI = require("openai").default;
const openai = new OpenAI();


//const { OpenAIApi } = require("openai");

//const openai = new OpenAIApi({
//  apiKey: process.env.OPENAI_API_KEY,
//});




let usuariosConectados = {};

function establecerUsuarioID(userID, sessionID) {
    usuariosConectados[sessionID] = userID;
    console.log(usuariosConectados);
    establecerSessionIDActual(sessionID);
}


global.sessionIDActual = null;

function establecerSessionIDActual(sessionID) {
    global.sessionIDActual = sessionID;
}

function obtenerSessionIDActual() {
    return global.sessionIDActual;
}


function obtenerUserIDDeSessionActual() {
    const sessionIDActual = obtenerSessionIDActual();
    if (sessionIDActual && usuariosConectados.hasOwnProperty(sessionIDActual)) {
        return usuariosConectados[sessionIDActual];
    } else {
        console.log("No se encontró un userID para la sesión actual.");
        return null; // O manejar de otra manera si el sessionID no está definido o no tiene un userID asociado
    }
}





// Función para leer el archivo y entrenar el clasificador
function entrenarClasificadorDesdeArchivo(archivo, categoria) {
    const datos = fs.readFileSync(archivo, 'utf8');
    const frases = datos.split('\n');

    frases.forEach(frase => {
        if (frase.trim() !== '') {
            classifier.addDocument(frase.trim(), categoria);
        }
    });

    classifier.train();
}



const mysql = require('mysql');
const port = 3000;

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ChatVino'
});


// Conectar a la base de datos
db.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('CHATBOT: Conectado a la base de datos');
});




let estadoUsuario = {}; // Almacena el historial de búsquedas de cada usuario

/*
function actualizarEstadoUsuario(userId, categoria, DO) {
    // Inicializa el historial del usuario si es la primera vez
    if (!estadoUsuario[userId]) {
        estadoUsuario[userId] = [];
    }

    // Añade la nueva búsqueda al inicio del historial
    // y luego mantiene solo los 5 primeros elementos
    estadoUsuario[userId].unshift({ categoria, DO });
    estadoUsuario[userId] = estadoUsuario[userId].slice(0, 5);
    console.log(estadoUsuario);
}
*/



function actualizarEstadoUsuario(userId, categoria, TipoVino, DO, idsUvas, busquedaPorCalificacion, acumularIds, variedadUva, nombreBodega, idsBodegas, idsDOs, precioMinimo, precioMaximo, idsBotellas, preferenciaAnyo, valorAnyo, calificacionTipo, calificacionValor, maridajeBotella) {
    if (!estadoUsuario[userId]) {
        estadoUsuario[userId] = [];
    }

    // Si la categoría actual es 'InformacionVariedadesDeUva'
    if (categoria === 'InformacionVariedadesDeUva') {
        // Buscar el último estado de 'InformacionVariedadesDeUva' en el historial
        const indiceEstadoUva = estadoUsuario[userId].findIndex(estado => estado.categoria === 'InformacionVariedadesDeUva');

        if (indiceEstadoUva !== -1) {
            // Actualizar el estado existente y moverlo al frente del historial
            console.log('Actualizando estado existente de InformacionVariedadesDeUva');
            const estadoExistente = estadoUsuario[userId][indiceEstadoUva];

            if (acumularIds == 1 && estadoExistente.variedadUva != '' && estadoExistente.idsUvas == '') {   // Buscar tipos despues de uno especifico
                estadoExistente.variedadUva = variedadUva;
                estadoExistente.idsUvas = [];
                estadoExistente.acumularIds = acumularIds;
            }
            else if (acumularIds == 0 && variedadUva != '' && estadoExistente.idsUvas != '') {    // Buscar tipo especifico despues de buscar varios
                estadoExistente.variedadUva = variedadUva;
                estadoExistente.idsUvas = '';
                estadoExistente.acumularIds = acumularIds;
            }

            estadoExistente.TipoVino = TipoVino;
            estadoExistente.DO = DO;
            estadoExistente.idsUvas = acumularIds === 1 ? estadoExistente.idsUvas.concat(idsUvas) : idsUvas;
            estadoExistente.busquedaPorCalificacion = busquedaPorCalificacion;
            estadoExistente.variedadUva = variedadUva;
            estadoExistente.nombreBodega = nombreBodega;
            estadoExistente.idsBodegas = idsBodegas;
            estadoExistente.idsDOs = idsDOs;
            estadoExistente.precioMinimo = precioMinimo;
            estadoExistente.precioMaximo = precioMaximo;
            estadoExistente.idsBotellas = idsBotellas;
            estadoExistente.preferenciaAnyo = preferenciaAnyo;
            estadoExistente.valorAnyo = valorAnyo;
            estadoExistente.calificacionTipo = calificacionTipo;
            estadoExistente.calificacionValor = calificacionValor;
            estadoExistente.maridajeBotella = maridajeBotella;

            // Mover el estado actualizado al frente del historial
            estadoUsuario[userId].splice(indiceEstadoUva, 1);
            estadoUsuario[userId].unshift(estadoExistente);
        } else {
            // Añadir un nuevo estado al frente del historial
            console.log('Añadiendo nuevo estado para InformacionVariedadesDeUva');
            estadoUsuario[userId].unshift({ categoria, TipoVino, DO, idsUvas, busquedaPorCalificacion, acumularIds, variedadUva, nombreBodega, idsBodegas, idsDOs, precioMinimo, precioMaximo, idsBotellas, preferenciaAnyo, valorAnyo, calificacionTipo, calificacionValor, maridajeBotella });
        }
    }
    // Si la categoría actual es 'InformacionBodega'
    else if (categoria === 'InformacionBodega') {
        // Buscar el último estado de 'InformacionVariedadesDeUva' en el historial
        const indiceEstadoBodega = estadoUsuario[userId].findIndex(estado => estado.categoria === 'InformacionBodega');

        if (indiceEstadoBodega !== -1) {
            // Actualizar el estado existente y moverlo al frente del historial
            console.log('Actualizando estado existente de InformacionBodega');
            const estadoExistente = estadoUsuario[userId][indiceEstadoBodega];


            if (acumularIds == 1 && estadoExistente.nombreBodega != '' && estadoExistente.idsBodegas == '') {   // Buscar tipos despues de uno especifico
                estadoExistente.nombreBodega = nombreBodega;
                estadoExistente.idsBodegas = [];
                estadoExistente.acumularIds = acumularIds;
            }
            else if (acumularIds == 0 && nombreBodega != '' && estadoExistente.idsBodegas != '') {    // Buscar tipo especifico despues de buscar varios
                estadoExistente.nombreBodega = nombreBodega;
                estadoExistente.idsBodegas = '';
                estadoExistente.acumularIds = acumularIds;
            }

            estadoExistente.TipoVino = TipoVino;
            estadoExistente.DO = DO;
            estadoExistente.idsUvas = idsUvas;
            estadoExistente.busquedaPorCalificacion = busquedaPorCalificacion;
            estadoExistente.variedadUva = variedadUva;
            estadoExistente.nombreBodega = nombreBodega;
            estadoExistente.idsBodegas = acumularIds === 1 ? estadoExistente.idsBodegas.concat(idsBodegas) : idsBodegas;
            estadoExistente.idsDOs = idsDOs;
            estadoExistente.precioMinimo = precioMinimo;
            estadoExistente.precioMaximo = precioMaximo;
            estadoExistente.idsBotellas = idsBotellas;
            estadoExistente.preferenciaAnyo = preferenciaAnyo;
            estadoExistente.valorAnyo = valorAnyo;
            estadoExistente.calificacionTipo = calificacionTipo;
            estadoExistente.calificacionValor = calificacionValor;
            estadoExistente.maridajeBotella = maridajeBotella;


            // Mover el estado actualizado al frente del historial
            estadoUsuario[userId].splice(indiceEstadoBodega, 1);
            estadoUsuario[userId].unshift(estadoExistente);
        } else {
            // Añadir un nuevo estado al frente del historial
            console.log('Añadiendo nuevo estado para InformacionBodega');
            estadoUsuario[userId].unshift({ categoria, TipoVino, DO, idsUvas, busquedaPorCalificacion, acumularIds, variedadUva, nombreBodega, idsBodegas, idsDOs, precioMinimo, precioMaximo, idsBotellas, preferenciaAnyo, valorAnyo, calificacionTipo, calificacionValor, maridajeBotella });
        }
    }
    // Si la categoría actual es 'InformacionDO'
    else if (categoria === 'InformacionDO') {
        // Buscar el último estado de 'InformacionVariedadesDeUva' en el historial
        const indiceEstadoDO = estadoUsuario[userId].findIndex(estado => estado.categoria === 'InformacionDO');

        if (indiceEstadoDO !== -1) {
            // Actualizar el estado existente y moverlo al frente del historial
            console.log('Actualizando estado existente de InformacionDO');
            const estadoExistente = estadoUsuario[userId][indiceEstadoDO];

            if (acumularIds == 1 && estadoExistente.DO != '' && estadoExistente.idsDOs == '') {   // Buscar tipos despues de uno especifico
                estadoExistente.DO = DO;
                estadoExistente.idsDOs = [];
                estadoExistente.acumularIds = acumularIds;
            }
            else if (acumularIds == 0 && DO != '' && estadoExistente.idsDOs != '') {    // Buscar tipo especifico despues de buscar varios
                estadoExistente.DO = DO;
                estadoExistente.idsDOs = '';
                estadoExistente.acumularIds = acumularIds;
            }

            estadoExistente.TipoVino = TipoVino;
            estadoExistente.DO = DO;
            estadoExistente.idsUvas = idsUvas;
            estadoExistente.busquedaPorCalificacion = busquedaPorCalificacion;
            estadoExistente.variedadUva = variedadUva;
            estadoExistente.nombreBodega = nombreBodega;
            estadoExistente.idsBodegas = idsBodegas;
            estadoExistente.idsDOs = acumularIds === 1 ? estadoExistente.idsDOs.concat(idsDOs) : idsDOs;
            estadoExistente.precioMinimo = precioMinimo;
            estadoExistente.precioMaximo = precioMaximo;
            estadoExistente.idsBotellas = idsBotellas;
            estadoExistente.preferenciaAnyo = preferenciaAnyo;
            estadoExistente.valorAnyo = valorAnyo;
            estadoExistente.calificacionTipo = calificacionTipo;
            estadoExistente.calificacionValor = calificacionValor;
            estadoExistente.maridajeBotella = maridajeBotella;


            // Mover el estado actualizado al frente del historial
            estadoUsuario[userId].splice(indiceEstadoDO, 1);
            estadoUsuario[userId].unshift(estadoExistente);
        }
        else {
            // Añadir un nuevo estado al frente del historial
            console.log('Añadiendo nuevo estado para InformacionDO');
            estadoUsuario[userId].unshift({ categoria, TipoVino, DO, idsUvas, busquedaPorCalificacion, acumularIds, variedadUva, nombreBodega, idsBodegas, idsDOs, precioMinimo, precioMaximo, idsBotellas, preferenciaAnyo, valorAnyo, calificacionTipo, calificacionValor, maridajeBotella });
        }

    }
    else if (categoria === 'AyudaEncontrarBotella') {

        // Buscar el último estado de 'InformacionVariedadesDeUva' en el historial
        const indiceEstadoBotellas = estadoUsuario[userId].findIndex(estado => estado.categoria === 'AyudaEncontrarBotella');


        if (indiceEstadoBotellas !== -1) {
            // Actualizar el estado existente y moverlo al frente del historial
            console.log('Actualizando estado existente de AyudaEncontrarBotella');
            const estadoExistente = estadoUsuario[userId][indiceEstadoBotellas];


            if (acumularIds == 1 && estadoExistente.idsBotellas == '') {   // Antes estaba en 0 y ahora en 1

                estadoExistente.idsBotellas = idsBotellas;      // Setear idsBotellas

                estadoExistente.acumularIds = 1;        // Setear acumular ids

            }
            else if (acumularIds == 0 && estadoExistente.idsBotellas != '') {      // Antes estaba en 1 y ahora en 0

                estadoExistente.idsBotellas = [];

                estadoExistente.acumularIds = 0;

            }



            estadoExistente.TipoVino = TipoVino;
            estadoExistente.DO = DO;
            estadoExistente.idsUvas = idsUvas;
            estadoExistente.busquedaPorCalificacion = busquedaPorCalificacion;
            estadoExistente.variedadUva = variedadUva;
            estadoExistente.nombreBodega = nombreBodega;
            estadoExistente.idsBodegas = idsBodegas;
            estadoExistente.idsDOs = idsDOs;
            estadoExistente.precioMinimo = precioMinimo;
            estadoExistente.precioMaximo = precioMaximo;
            estadoExistente.idsBotellas = acumularIds === 1 ? estadoExistente.idsBotellas.concat(idsBotellas) : idsBotellas;
            console.log(estadoExistente.idsBotellas);
            estadoExistente.preferenciaAnyo = preferenciaAnyo;
            estadoExistente.valorAnyo = valorAnyo;
            estadoExistente.calificacionTipo = calificacionTipo;
            estadoExistente.calificacionValor = calificacionValor;
            estadoExistente.maridajeBotella = maridajeBotella;


            // Mover el estado actualizado al frente del historial
            estadoUsuario[userId].splice(indiceEstadoBotellas, 1);
            estadoUsuario[userId].unshift(estadoExistente);
        }
        else {
            // Añadir un nuevo estado al frente del historial
            console.log('Añadiendo nuevo estado para AyudaEncontrarBotella');
            estadoUsuario[userId].unshift({ categoria, TipoVino, DO, idsUvas, busquedaPorCalificacion, acumularIds, variedadUva, nombreBodega, idsBodegas, idsDOs, precioMinimo, precioMaximo, idsBotellas, preferenciaAnyo, valorAnyo, calificacionTipo, calificacionValor, maridajeBotella });
        }
    }
    else {
        // Para otras categorías, añadir un nuevo estado al frente del historial
        console.log('Añadiendo un nuevo estado para otra categoría');
        estadoUsuario[userId].unshift({ categoria, TipoVino, DO, idsUvas, busquedaPorCalificacion, acumularIds, variedadUva, nombreBodega, idsBodegas, idsDOs, precioMinimo, precioMaximo, idsBotellas, preferenciaAnyo, valorAnyo, calificacionTipo, calificacionValor, maridajeBotella });
    }

    // Mantener solo los 5 primeros elementos en el historial
    estadoUsuario[userId] = estadoUsuario[userId].slice(0, 5);

    console.log(estadoUsuario);
}























function obtenerEstadoUsuario(userId) {
    // Verificar si el usuario existe en el historial
    if (estadoUsuario[userId]) {
        return estadoUsuario[userId];
    } else {
        console.log("No se encontró el estado para el usuario con ID:", userId);
        return null; // El usuario no existe
    }
}



async function manejarDameMas(userId) {
    if (estadoUsuario[userId] && estadoUsuario[userId].length > 0) {
        const ultimaBusqueda = estadoUsuario[userId][0]; // Obtén la última búsqueda
        if (ultimaBusqueda.categoria === 'vino tinto') {
            return obtenerBotellasPorDO(ultimaBusqueda.DO);
        }
    }
    return ["No tengo más recomendaciones en esta categoría por el momento."];
}




function ejecutarConsulta(sql) {
    return new Promise((resolve, reject) => {
        db.query(sql, (error, results, fields) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}








async function procesarMensajeUsuario(mensaje) {
    const botResponse = await dialogFlow.sendMessage(mensaje);
    const tipoIntent = botResponse.intent.displayName;

    const IDusuario = obtenerUserIDDeSessionActual();
    console.log('ID usuario: ' + IDusuario);

    const usuarioState = obtenerEstadoMasRecienteUsuario(IDusuario);

    if (usuarioState) {   // El usuario ya ha interactuado antes

        // Obtener datos previos
        // ---------------------
        const categoria = usuarioState.categoria;
        console.log('Categoria mas reciente: ' + categoria);
        const DO = usuarioState.DO;
        console.log('Denominación mas reciente: ' + DO);
        const botellasIDs = usuarioState.idsBotellas;
        // ---------------------


        if (tipoIntent == RESPUESTA_SALUDO_USUARIO) { // Respuesta saludo usuario
            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), RESPUESTA_SALUDO_USUARIO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado
            return botResponse.fulfillmentText;
        }
        else if (tipoIntent == ASISTENCIA_GENERAL_USOS_CHATVINO) {    // Respuesta asistencia usos Chatvino
            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), ASISTENCIA_GENERAL_USOS_CHATVINO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado
            return botResponse.fulfillmentText;
        }
        else if (tipoIntent == ASISTENCIA_GENERAL_PREGUNTAS_FRECUENTES) { // Respuesta para asistencia a Preguntas Frecuentes
            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), ASISTENCIA_GENERAL_PREGUNTAS_FRECUENTES, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            // Necesito leer el fichero de Preguntas frecuentes

            const contenido = fs.readFileSync('AsistenciaGeneral/PreguntasFrecuentes.txt', 'utf8');
            console.log(contenido);

            const mensajesRespuesta = contenido.split('\n');

            mensajesRespuesta.unshift(botResponse.fulfillmentText);
            mensajesRespuesta.push('Estas son las respuestas sobre asistencia que los usuarios más suelen realizar');

            console.log(mensajesRespuesta);

            return mensajesRespuesta;
        }
        else if (tipoIntent == ASISTENCIA_GENERAL_CONTACTO_Y_SOPORTE) {   // Respuesta contacto y soporte al usuario
            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), ASISTENCIA_GENERAL_CONTACTO_Y_SOPORTE, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            const contenido = fs.readFileSync('AsistenciaGeneral/ContactoYSoporte.txt', 'utf8');
            console.log(contenido);

            const mensajesRespuesta = contenido.split('\n');

            mensajesRespuesta.unshift(botResponse.fulfillmentText);
            mensajesRespuesta.push('Esta es la información para poder contactar con el soporte y asistencia de ChatVino.');

            console.log(mensajesRespuesta);

            return mensajesRespuesta;
        }
        else if (tipoIntent == AYUDA_ENCONTRAR_BOTELLA) {    // Respuesta ayuda encontrar botella de vino


            // DEBEMOS COMPROBAR QUE TIPO DE VINO NOS ESTA PIDIENDO EL USUARIO
            mensaje = mensaje.toLowerCase();
            const palabrasUsuario2 = mensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras

            // Palabras clave para cada tipo de vino
            const vinoTintoPalabras = ['tinto', 'tintos', 'vino tinto', 'vinos tintos'];
            const vinoBlancoPalabras = ['blanco', 'blancos', 'vino blanco', 'vinos blancos'];
            const vinoDulcePalabras = ['dulce', 'dulces', 'vino dulce', 'vinos dulces'];
            const vinoEspumosoPalabras = ['espumoso', 'espumosos', 'vino espumoso', 'vinos espumosos'];
            const vinoRosadoPalabras = ['rosado', 'rosados', 'vino rosado', 'vinos rosados'];

            let esVinoTinto = vinoTintoPalabras.some(palabra => mensaje.includes(palabra));
            let esVinoBlanco = vinoBlancoPalabras.some(palabra => mensaje.includes(palabra));
            let esVinoDulce = vinoDulcePalabras.some(palabra => mensaje.includes(palabra));
            let esVinoEspumoso = vinoEspumosoPalabras.some(palabra => mensaje.includes(palabra));
            let esVinoRosado = vinoRosadoPalabras.some(palabra => mensaje.includes(palabra));

            let TipoVino = null;

            if (esVinoTinto) {    // VINO TINTO
                TipoVino = 1;
            }
            else if (esVinoBlanco) {    // VINO BLANCO
                TipoVino = 2;
            }
            else if (esVinoDulce) {    // VINO DULCE
                TipoVino = 5;
            }
            else if (esVinoEspumoso) {    // VINO ESPUMOSO
                TipoVino = 4;
            }
            else if (esVinoRosado) {    // VINO ROSADO
                TipoVino = 3;
            }


            console.log('Tipo de vino: ' + TipoVino);


            









            // VAMOS A COMPROBAR SI EL USUARIO QUIERE INFORMACION SOBRE UNA BOTELLA DE VINO EN ESPECÍFICO


            // VAMOS A COMPROBAR SI EL USUARIO QUIERE INFORMACION SOBRE UNA BOTELLA DE VINO EN ESPECÍFICO


            // Obtener palabras nombres botellas
            const nombresBotellas = await obtenerNombresBotellas();

            let BotellaEncontrada;
            let busquedaPorCalificacion2;
            let menorDistancia3 = Infinity;
            const umbralDistancia4 = 1.5;

            for (const botellaNombre of nombresBotellas) {
                const longitudBotella = botellaNombre.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario2, longitudBotella);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, botellaNombre.toLowerCase());
                    if (distancia < menorDistancia3 && distancia <= umbralDistancia4) {
                        menorDistancia3 = distancia;
                        BotellaEncontrada = botellaNombre;
                    }
                }
            }




            /*
            if(TipoVino == null && !BotellaEncontrada){   // El usuario no introdujo ningun tipo de vino

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Necesitoq que me indiques alguna característica como: Tipo, Región, Precio, Calificación, Año, Uva, Bodega o Maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA_TINTO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;
            }
            */
            if (BotellaEncontrada) {  // El usuario introdujo una botella especifica que buscar

                const botellasResultado = await buscarBotellasPorNombre(BotellaEncontrada);

                console.log('botellas resultado: ' + botellasResultado);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);
                mensajesRespuesta.unshift('Sobre la botella que me has indicado puedo ofrecerte la siguiente información:');
                mensajesRespuesta.push('Espero que te haya sido útil esta infomración. Si quieres saber algo más sólo dímelo!');
                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, "", "", "", "", 1, "", "", "", "", "", "", idsBotellas);   // Actualizar estado
                return mensajesRespuesta;
            }


            // VAMOS A VER SI PREGUNTA POR ALGUNA BOTELLA DE VINO QUE NO ESTE EN BBDD


            // Unir las palabras para formar la frase completa
            const fraseUsuario = palabrasUsuario2.join(' ');

            // Expresión regular para identificar la solicitud de información sobre una botella de vino
            const regex = /(?:dame información sobre|quiero saber sobre|Necesito que me hables sobre|búscame|información de|sobre) (?:la )?botella de vino (.+)/i;

            // Aplicar la expresión regular a la frase del usuario
            const resultado = fraseUsuario.match(regex);

            if (resultado && resultado[1]) {
                // Extraer el nombre de la botella de vino
                const nombreBotella = resultado[1].trim();
                console.log("Nombre de la botella buscada:", nombreBotella);


                // Ahora puedes usar 'await' dentro del bucle
                const completion4 = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: `Dame los siguientes datos sobre esta botella de vino: ${nombreBotella}, los datos que me tienes que dar en siempre en forma de lista, no numerada, son: Nombre:, Año de Cosecha:(dame sólo los 4 dígitos del año), Región:(Sólo la región, nada más), Descripción:(al menos 2 líneas, en la descrición se indica también el tipo de vino: tinto, blanco, rosado, dulce, espumoso), Precio:(sólo dígitos, sin símbolo), Volumen:(numero+ml), Stock:(Dame solo el numero, sin moneda), Tipo Uva:(sólo un tipo), Bodega: y Maridaje: . Sómo me tienes que dar eso, nada más. De forma que lo último que me des sea el maridaje. Esto es muy importante que sólo me des lo que te pido con los nombres que te digo, sin frases de introducción ni despedida.` }
                    ],
                });


                // Guardar el contenido de la respuesta en la variable
                detallesBotellaNuevaGPT = completion4.choices[0].message.content;
                console.log(detallesBotellaNuevaGPT);


                // Dividir la respuesta en líneas y eliminar líneas vacías
                const lineas = detallesBotellaNuevaGPT.trim().split('\n').filter(linea => linea.trim() !== '');

                // Crear un objeto para almacenar los datos
                let datosBotella = {};

                // Extraer los datos de cada línea
                lineas.forEach(linea => {
                    const [clave, valor] = linea.split(':').map(item => item.trim());
                    // Eliminar el guion inicial si existe
                    const claveLimpia = clave.replace('-', '').trim();
                    datosBotella[claveLimpia] = valor;
                });

                console.log(datosBotella);




                // Extraer la descripción del vino y buscar el tipo

                const descripcionVino = datosBotella['Descripción'].toLowerCase();
                const tipoVino = identificarTipoVino(descripcionVino);

                console.log("Tipo de vino identificado:", tipoVino);

                let tipoVinoNuevaBotella;

                switch (tipoVino) {
                    case 'tinto':
                        tipoVinoNuevaBotella = 1;
                        break;
                    case 'blanco':
                        tipoVinoNuevaBotella = 2;
                        break;
                    case 'rosado':
                        tipoVinoNuevaBotella = 3;
                        break;
                    case 'espumoso':
                        tipoVinoNuevaBotella = 4;
                        break;
                    case 'dulce':
                        tipoVinoNuevaBotella = 5;
                        break;
                }

                console.log(tipoVinoNuevaBotella);


                let nombreBodegaBotellaNueva = datosBotella['Bodega'];

                let idBodega = await obtenerIDBodega(nombreBodegaBotellaNueva);

                console.log('ID Bodega botella nueva: ' + idBodega);

                if (idBodega == null) {   // La bodega no existe


                    // La bodega no esta en BBDD, hay que buscar en ChatGPT


                    const completion = await openai.chat.completions.create({
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: `Necesito que me des la siguiente información sobre la bodega: ${nombreBodegaBotellaNueva}. La información que necesito es: Descripción:(al menos 5 líneas de descripción), Región:(Nombre de la región, a secas, no digas nada más ya que sólo quiero el nombre de la región), Año de Fundación:(Sólo el número del año, sin nada más) y Email de Contacto:(te lo puedes inventar). Cabe destacar que esta información debe presentarse siempre en forma de lista(Descripción:.....Región:.....), en un texto, sin enumeraciones, indicando cuál es cada parte(SIEMPRE). Y siempre en el orden indicado.` }
                        ],
                    });

                    // Guardar el contenido de la respuesta en la variable
                    detallesBodegaGPT = completion.choices[0].message.content;
                    console.log('Respuesta bodega: ' + detallesBodegaGPT);

                    // Dividir la respuesta en líneas y eliminar líneas vacías
                    const lineas = detallesBodegaGPT.trim().split('\n').filter(linea => linea.trim() !== '');
                    console.log(lineas);


                    // Crear un objeto para almacenar los datos
                    let datosBodega = {};

                    // Extraer los datos de cada línea
                    lineas.forEach(linea => {
                        const [clave, valor] = linea.split(':').map(item => item.trim());
                        // Eliminar el guion inicial si existe
                        const claveLimpia = clave.replace('-', '').trim();
                        datosBodega[claveLimpia] = valor;
                    });

                    console.log(datosBodega);




                    /*
                    // Dividir la respuesta en secciones
                    const secciones = detallesBodegaGPT.split('\n');

                    // Extraer datos consulta ChatGPT
                    const descripcion = secciones[0].split(': ')[1];
                    console.log(descripcion);
                    const region = secciones[1].split(': ')[1].replace(/\.$/, '');
                    console.log(region);
                    const anoFundacion = secciones[2].split(': ')[1];
                    console.log(anoFundacion);
                    const email = secciones[3].split(': ')[1];
                    console.log(email);
                    */


                    await insertarBodega(nombreBodegaBotellaNueva, datosBodega['Región'], datosBodega['Descripción'], datosBodega['Año de Fundación'], datosBodega['Email de Contacto'])
                        .then(resultados => console.log('Inserción completada:', resultados))
                        .catch(error => console.error('Error al insertar en la base de datos:', error));


                    idBodega = await obtenerIDBodega(nombreBodegaBotellaNueva);

                    console.log(idBodega);

                }

                // En este punto ya tengo el id de la bodega


                // Vamos a mirar ahora el UvaID y el DOID

                // UvaID

                let nombreUva = datosBotella['Tipo Uva'];

                console.log('Uva: ' + nombreUva);

                let idUva = await obtenerIDTipoDeUva(nombreUva);

                console.log('Id uva: ' + idUva);


                if (idUva == null) {  // La uva no existe en BBDD

                    // Debemos preguntar a chatGPT por nuevos tipos

                    const completion = await openai.chat.completions.create({
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: `Necesito que me des la siguiente información sobre el siguiente tipo de uva: ${nombreUva}. La información que necesito en forma de lista es la siguiente: - Características: , - Regíon Predominante: , - Notas de Sabor: y - Descripción: . Es muy importante que lo que te pido me lo des en forma de lista no numerada, de la forma en la que te he dicho, con frases completas, sin frases introductorias y frases de cierre.` }
                        ],
                    });


                    // Guardar el contenido de la respuesta en la variable
                    detallesUvaGPT = completion.choices[0].message.content;
                    console.log(detallesUvaGPT);

                    // Dividir la respuesta en secciones
                    const secciones = detallesUvaGPT.split('\n\n');


                    // Extraer datos consulta ChatGPT
                    const caracteristicas = secciones[0].split(': ')[1];
                    console.log(caracteristicas);
                    const region = secciones[1].split(': ')[1].replace(/\.$/, '');
                    console.log(region);
                    const notasDeSabor = secciones[2].split(': ')[1];
                    console.log(notasDeSabor);
                    const descripcion = secciones[3].split(': ')[1];
                    console.log(descripcion);


                    await insertarTipoDeUva(nombreUva, caracteristicas, region, notasDeSabor, descripcion)
                        .then(resultados => console.log('Inserción completada:', resultados))
                        .catch(error => console.error('Error al insertar en la base de datos:', error));

                    idUva = await obtenerIDTipoDeUva(nombreUva);

                }


                // DOID

                let nombreDO = datosBotella['Región'];

                console.log('DO: ' + nombreDO);

                let idDO = await obtenerIDDO(nombreDO);


                if(idDO == null){   // DO no existe en BBDD

                // Debemos preguntar a chatGPT por la nueva DO

                const completion = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: `Necesito que me des la siguiente información sobre la Denominación de Orgien: ${nombreDO}. La información que necesito es: Descripción: (Descripción: Al menos 3 líneas de descripción). Tiene que venir siempre de esta forma: Descripción:......` }
                    ],
                });


                // Guardar el contenido de la respuesta en la variable
                detallesDO = completion.choices[0].message.content;
                console.log(detallesDO);

                // Extraer datos consulta ChatGPT
                const descripcion = detallesDO.split(': ')[1];

                console.log(descripcion);


                await insertarDO(nombreDO, descripcion)
                    .then(resultados => console.log('Inserción completada:', resultados))
                    .catch(error => console.error('Error al insertar en la base de datos:', error));


                idDO = await obtenerIDDO(nombreDO);

                }

                console.log('IDDO: '+idDO);

                
                // Ya tengo todos los datos suficientes, lo que tengo que hacer es insertar la nueva botella

                await insertarBotellaBBDD(datosBotella['Nombre'], datosBotella['Año de Cosecha'], datosBotella['Región'], datosBotella['Descripción'], 
                datosBotella['Precio'], datosBotella['Volumen'].toString(), datosBotella['Stock'], datosBotella['Tipo Uva'], null, 0, idUva, tipoVinoNuevaBotella, 
                idDO, idBodega, datosBotella['Maridaje'])
                    .then(resultados => console.log('Inserción completada:', resultados))
                    .catch(error => console.error('Error al insertar en la base de datos:', error));



                const botellasResultado = await buscarBotellasPorNombre(datosBotella['Nombre']);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                    // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Claro! Puedo darte información sobre esto, aquí tienes:');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, "", "", "", "", 1, "", "", "", "", "", "", idsBotellas, "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;


                // Aquí puedes continuar con tu lógica para buscar la botella en tu base de datos
            } else {
                console.log("No se pudo identificar una solicitud de información sobre una botella de vino.");
            }


            // DEBEMOS COMPROBAR SI NOS INTRODUJO DO (denominacion de origen)
            mensaje = mensaje.toLowerCase();
            const palabrasUsuario = mensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras


            // VAMOS A COMPROBAR DO


            // Obtener palabras clave de DO de la base de datos
            const palabrasClaveDO = await obtenerPalabrasClaveDO();

            let DOEncontrada;
            let busquedaPorCalificacion;
            let menorDistancia = Infinity;
            const umbralDistancia = 1.5;

            for (const doNombre of palabrasClaveDO) {
                const longitudDO = doNombre.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudDO);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, doNombre.toLowerCase());
                    if (distancia < menorDistancia && distancia <= umbralDistancia) {
                        menorDistancia = distancia;
                        DOEncontrada = doNombre;
                    }
                }
            }


            // VAMOS A COMPROBAR EL TIPO DE UVA


            // Obtener palabras clave de Tipo Uva de la base de datos
            const palabrasClaveTipoUva = await obtenerPalabrasClaveTipoUva();

            let TipoUvaEncontrada;
            let menorDistancia2 = Infinity;
            const umbralDistancia2 = 1.5;

            for (const tipoUvaNombre of palabrasClaveTipoUva) {
                const longitudTipoUva = tipoUvaNombre.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudTipoUva);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, tipoUvaNombre.toLowerCase());
                    if (distancia < menorDistancia2 && distancia <= umbralDistancia2) {
                        menorDistancia2 = distancia;
                        TipoUvaEncontrada = tipoUvaNombre;
                    }
                }
            }


            // VAMOS A COMPROBAR PRECIO

            const { precioMinimo, precioMaximo } = extraerRangoDePrecios(mensaje);

            console.log('precio minimo: ' + precioMinimo);
            console.log('precio maximo: ' + precioMaximo);



            // VAMOS A COMPROBAR BODEGA

            // Obtener nombres de bodegas en BBDD
            const nombresBodegas = await obtenerNombresBodegas();


            let nombreBodegaEncontrado;
            menorDistancia = Infinity;
            const umbralDistancia3 = 1.5;

            for (const nombreBodega of nombresBodegas) {
                const longitudTipoUva = nombreBodega.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudTipoUva);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, nombreBodega.toLowerCase());
                    if (distancia < menorDistancia && distancia <= umbralDistancia3) {
                        menorDistancia = distancia;
                        nombreBodegaEncontrado = nombreBodega;
                    }
                }
            }


            // VAMOS A COMPROBAR SI EL USUARIO INDICA UN AÑO

            // Actualizar lógica para comparar secuencias de palabras
            function contieneSecuencia(palabras, frase) {
                const secuencia = frase.split(' '); // Dividir la frase en palabras
                for (let i = 0; i <= palabras.length - secuencia.length; i++) {
                    if (secuencia.every((palabra, index) => palabras[i + index] === palabra)) {
                        return true;
                    }
                }
                return false;
            }

            // Palabras clave actualizadas para la preferencia del año
            const palabrasInicioAno = ["después de", "a partir de", "siguiendo", "posterior a"];
            const palabrasFinAno = ["antes de", "hasta", "no más tarde de", "anterior a"];
            const palabrasExactoAno = ["en", "del año", "de", "igual a", "sea en"];

            let anoPreferencia = null;
            let tipoPreferenciaAno = null;

            const regexAno = /\b(19|20)\d{2}\b/;
            const resultadoAno = mensaje.match(regexAno);
            let anoEncontrado = resultadoAno ? parseInt(resultadoAno[0]) : null;
            console.log('Año Encontrado:', anoEncontrado);

            if (anoEncontrado) {
                const palabrasMensaje = mensaje.split(/\s+/);
                const indicePalabraAno = palabrasMensaje.findIndex(p => p.includes(anoEncontrado.toString()));
                console.log('Índice Palabra Año:', indicePalabraAno);

                const palabrasAntesDelAño = palabrasMensaje.slice(Math.max(0, indicePalabraAno - 10), indicePalabraAno);
                const palabrasDespuesDelAño = palabrasMensaje.slice(indicePalabraAno, indicePalabraAno + 10);

                if (palabrasInicioAno.some(frase => contieneSecuencia(palabrasAntesDelAño, frase)) || palabrasInicioAno.some(frase => contieneSecuencia(palabrasDespuesDelAño, frase))) {
                    tipoPreferenciaAno = 'inicio';
                } else if (palabrasFinAno.some(frase => contieneSecuencia(palabrasAntesDelAño, frase)) || palabrasFinAno.some(frase => contieneSecuencia(palabrasDespuesDelAño, frase))) {
                    tipoPreferenciaAno = 'fin';
                } else if (palabrasExactoAno.some(frase => contieneSecuencia(palabrasAntesDelAño, frase)) || palabrasExactoAno.some(frase => contieneSecuencia(palabrasDespuesDelAño, frase))) {
                    tipoPreferenciaAno = 'exacto';
                }
            }

            anoPreferencia = tipoPreferenciaAno ? { tipo: tipoPreferenciaAno, valor: anoEncontrado } : null;

            console.log('Preferencia de Año:', anoPreferencia);






            // VAMOS A COMPROBAR SI EL USUARIO INDICA ALGUN TIPO DE CALIFICACION


            // Patrones para diferentes tipos de consultas sobre calificaciones
            const patronesMejores = ["las más altas calificaciones", "top calificados", "mejor valorados",
                "con las mejores puntuaciones", "las más recomendadas", "los vinos mejor calificados", "máxima puntuación",
                "con altas valoraciones", "los más apreciados", "puntuaciones más altas", "mejor valoradas", "mejores notas",
                "mejores puntuaciones", "mejores"];

            const patronesPeores = ["las más bajas calificaciones", "menos valorados", "peor calificados",
                "con las peores puntuaciones", "las menos recomendadas", "los vinos peor calificados", "mínima puntuación",
                "con bajas valoraciones", "los menos apreciados", "puntuaciones más bajas", "peror valoradas", , "perores notas",
                "perores puntuaciones", "peores"];

            const patronesIgualA = [, "calificación sea igual a", "exactamente calificados como", "puntuación exacta de", "calificación precisa de",
                "valorados exactamente en", "con una puntuación de", "exactamente con", "calificados igual a",
                "con calificación de", "iguales en puntuación a", "valoración idéntica a", "calificación igual a", "calificación de", "calificación =",
                "puntuación igual", "nota igual", "calificación igual"];

            const patronesSuperiorA = ["calificación por encima de", "calificación sea mayor que", "calificación sea mayor a", "más altos que", "valorados por encima de",
                "superiores en calificación a", "con puntuación mayor que", "mejor que", "sobrepasan", "calificados más alto que",
                "por encima de la calificación de", "superan", "calificación mayor", "puntuación mayor", "nota superior", "superior a", "nota superior"];

            const patronesInferiorA = ["calificación por debajo de", "menos que", "valorados por debajo de",
                "inferiores en calificación a", "con puntuación menor que", "peor que", "no alcanzan", "calificados más bajo que",
                "por debajo de la calificación de", "no superan", "calificación menor", "puntuación menor", "nota inferior", "inferior a"];


            let consultaCalificacion = null;
            const regexNumero = /\b\d+(\.\d+)?\b/;

            // Función para verificar si alguna frase del array está en el mensaje
            const contieneFrase = (frases, mensaje) => {
                return frases.some(frase => mensaje.includes(frase));
            };

            // Función para extraer el valor numérico de la calificación
            const extraerValorCalificacion = (mensaje, frases) => {
                for (const frase of frases) {
                    if (mensaje.includes(frase)) {
                        const indiceFrase = mensaje.indexOf(frase) + frase.length;
                        const mensajeRestante = mensaje.substring(indiceFrase);
                        const resultado = mensajeRestante.match(regexNumero);
                        if (resultado) {
                            return parseFloat(resultado[0]);
                        }
                    }
                }
                return null;
            };

            // Procesar el tipo de consulta sobre calificaciones
            if (contieneFrase(patronesMejores, mensaje)) {
                consultaCalificacion = { tipo: "mejores" };
            } else if (contieneFrase(patronesPeores, mensaje)) {
                consultaCalificacion = { tipo: "peores" };
            } else if (contieneFrase(patronesIgualA, mensaje)) {
                consultaCalificacion = { tipo: "igualesA", valor: extraerValorCalificacion(mensaje, patronesIgualA) };
            } else if (contieneFrase(patronesSuperiorA, mensaje)) {
                consultaCalificacion = { tipo: "superioresA", valor: extraerValorCalificacion(mensaje, patronesSuperiorA) };
            } else if (contieneFrase(patronesInferiorA, mensaje)) {
                consultaCalificacion = { tipo: "inferioresA", valor: extraerValorCalificacion(mensaje, patronesInferiorA) };
            }

            console.log('Consulta sobre Calificación:', consultaCalificacion);




            // VAMOS AHORA A COMPROBAR MARIDAJE

            // Obtener palabras clave de Maridaje de la base de datos
            const palabrasClaveMaridaje = await obtenerPalabrasClaveMaridaje();

            let MaridajeEncontrado;
            let menorDistanciaMaridaje = Infinity;
            const umbralDistanciaMaridaje = 1.5;

            for (const maridajeNombre of palabrasClaveMaridaje) {
                const longitudMaridaje = maridajeNombre.split(/\s+/).length;
                const combinacionesUsuarioMaridaje = crearCombinacionesDePalabras(palabrasUsuario, longitudMaridaje);

                for (const combinacionUsuario of combinacionesUsuarioMaridaje) {
                    const distancia = levenshtein(combinacionUsuario, maridajeNombre.toLowerCase());
                    if (distancia < menorDistanciaMaridaje && distancia <= umbralDistanciaMaridaje) {
                        menorDistanciaMaridaje = distancia;
                        MaridajeEncontrado = maridajeNombre;
                    }
                }
            }

            console.log('Maridaje Encontrado:', MaridajeEncontrado);




            if(usuarioState.categoria == 'AyudaEncontrarBotella' && usuarioState.acumularIds == 0){   // Comprobar si viene de una respuesta donde no le dio nada

                console.log('LA ANTERIOR NO LE DIO NADA');


                // Tenemos que comprobar si el usuario no le introdujo nada más para la búsqueda

                let sql = '';

                // TIPO VINO

                if(usuarioState.TipoVino){
                    sql += 'SELECT * FROM Botellas WHERE TipoVinoID = '+usuarioState.TipoVino+' ';
                }
                else{

                    if(TipoVino){   // Introdujo vino

                        sql += 'SELECT * FROM Botellas WHERE TipoVinoID = '+TipoVino+' ';
    
                    }
                    else{   // No introdujo vino
                        sql += 'SELECT * FROM Botellas WHERE TipoVinoID IN (1, 2, 3, 4, 5) ';
                    }

                }

                


                // DO

                if(usuarioState.DO){
                    sql += 'AND Region = "'+usuarioState.DO+'" ';
                }
                else{

                    if(DOEncontrada){   // Introdujo
                        sql += 'AND Region = "'+DOEncontrada+'" ';
                    }

                }
                

                // Tipo Uva

                if(usuarioState.variedadUva){

                    const idTipoUva = await obtenerIDTipoDeUva(usuarioState.variedadUva);
    
                        console.log('ID del tipo de uva: ' + idTipoUva);
    
                        sql += 'AND UvaID = '+idTipoUva+' ';

                }
                else{

                    if(TipoUvaEncontrada){  // Introdujo

                        const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);
    
                        console.log('ID del tipo de uva: ' + idTipoUva);
    
                        sql += 'AND UvaID = '+idTipoUva+' ';
    
                    }

                }

                

                // Nombre Bodega

                if(usuarioState.nombreBodega){

                    // Buscar BodeID
                    const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                    console.log('ID de la bodega es: ' + idBodega);

                    sql += 'AND BodegaID = '+idBodega+' ';
                }
                else if(nombreBodegaEncontrado){ // Introdujo

                    // Buscar BodeID
                    const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                    console.log('ID de la bodega es: ' + idBodega);

                    sql += 'AND BodegaID = '+idBodega+' ';

                }

                // Rango Precios
                if(precioMinimo && precioMaximo){   // Ambos

                    sql += 'AND Precio BETWEEN '+precioMinimo+' AND '+precioMaximo+' ';

                }
                else if(precioMinimo){  // Minimo

                    sql += 'AND PRECIO >= '+precioMinimo+' ';

                }
                else if(precioMaximo){  // Maximo

                    sql += 'AND PRECIO <= '+precioMaximo+' ';

                }

                // Fecha cosecha
                else if(anoPreferencia){
                    if(anoPreferencia.tipo == 'exacto'){
                        sql += 'AND AnoCosecha = '+anoPreferencia.valor+' ';
                    }
                    else if(anoPreferencia.tipo == 'inicio'){  // Despues
                        sql += 'AND AnoCosecha >= '+anoPreferencia.valor+' ';
                    }
                    else if(anoPreferencia.tipo == 'fin'){  // Antes
                        sql += 'AND AnoCosecha <= '+anoPreferencia.valor+' ';
                    }
                }

                // Calificacion
                else if(consultaCalificacion){

                    if (consultaCalificacion.tipo == 'mejores') {      // mejores
                        sql += ' ORDER BY Calificacion DESC ';
                    }
                    else if (consultaCalificacion.tipo == 'peores') {  // peores
                        sql += ' ORDER BY Calificacion ASC ';
                    }
                    else if (consultaCalificacion.tipo == 'igualesA') {    // Iguales a
                        sql += ' AND Calificacion = '+consultaCalificacion.valor+' ';
                        sql += ' ORDER BY Calificacion DESC ';
                    }
                    else if (consultaCalificacion.tipo == 'superioresA') {   // Superior a
                        sql += ' AND Calificacion >= '+consultaCalificacion.valor+' ';
                        sql += ' ORDER BY Calificacion DESC ';
                    }
                    else if (consultaCalificacion.tipo == 'inferioresA') {   // Inferior a
                        sql += ' AND Calificacion <= '+consultaCalificacion.valor+' ';
                        sql += ' ORDER BY Calificacion DESC ';
                    }
                }


                // Maridaje
                else if(MaridajeEncontrado){

                    sql += 'AND Maridaje LIKE %' + MaridajeEncontrado + '%'

                }

                sql += 'LIMIT 5;'


                console.log('Query final: '+sql);


                let botellasResultado = await ejecutarConsulta(sql);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, (usuarioState.TipoVino)?usuarioState.TipoVino:TipoVino, (usuarioState.DO)?usuarioState.DO:DOEncontrada, "", "", 1, (usuarioState.variedadUva)?usuarioState.variedadUva:TipoUvaEncontrada, (usuarioState.nombreBodega)?usuarioState.nombreBodega:nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, (anoPreferencia)?anoPreferencia.tipo:"", (anoPreferencia)?anoPreferencia.valor:"", (consultaCalificacion)?consultaCalificacion.tipo:"", (consultaCalificacion)?consultaCalificacion.valor:"", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }









            if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && anoPreferencia && consultaCalificacion && MaridajeEncontrado) {    // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo, nombre de bodega, anyo, califiacion y maridaje

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoIgualConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {   // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoDespuesConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoAntesConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor, MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && anoPreferencia && MaridajeEncontrado) {   // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo, nombre de bodega, anyo y maridaje

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoIgualConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, MaridajeEncontrado, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoDespuesConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, MaridajeEncontrado, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoAntesConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, MaridajeEncontrado, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor, "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && consultaCalificacion && MaridajeEncontrado) { // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo, nombre de bodega, califiacion y maridaje

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);


                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = await buscarBotellasPorCriteriosConBodegaDOYUvaConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor, MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && anoPreferencia && consultaCalificacion) {  // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo, nombre de bodega, anyo y califiacion

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoIgualConCalificacion(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {   // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoDespuesConCalificacion(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoAntesConCalificacion(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && MaridajeEncontrado) {     // Introdujo DO, tipo de uva, precio minimo, maximo, bodega y maridaje

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);


                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                let botellasResultado = await buscarBotellasPorCriteriosConBodegaDOYUvaConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );



                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && consultaCalificacion) {     // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo, nombre de bodega y calificacion

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);


                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = await buscarBotellasPorCriteriosConBodegaDOYUvaConCalificacion(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && anoPreferencia && consultaCalificacion) {   // Usuario introdujo DO, tipo de uva, precio minimo, precio maximo, fecha y calificacion

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConAnyoIgualConDOYUvaMinimoYMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {   // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConAnyoDespuesConDOYUvaMinimoYMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConAnyoAntesConDOYUvaMinimoYMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }




                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && anoPreferencia) {      // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo, nombre de bodega y anyo

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && MaridajeEncontrado) {       // Introdujo DO, tipo de uva, precio minimo, precio maximo y maridaje

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaMinimoYMaximoConMaridaje(idTipoUva, TipoVino, DOEncontrada, precioMinimo, precioMaximo, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, precioMaximo, idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && consultaCalificacion) {     // Introdujo DO, tipo de uva, precio minimo, precio maximo y calificacion

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaMinimoYMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, precioMaximo, idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && anoPreferencia) {   // Introdujo DO, tipo de uva, precio minimo, precio maximo y anyo

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConAmbosPreciosYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConAmbosPreciosYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConAmbosPreciosYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, precioMaximo, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado) {    // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo y nombre de bodega
                // Debemos buscar en la BBDD las botellas con estas caracteristicas


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosConIdBodega(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && MaridajeEncontrado) {   // Usuario introdujo DO, tipo de uva, precio minimo y maridaje


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaMinimoConMaridaje(idTipoUva, TipoVino, DOEncontrada, precioMinimo, MaridajeEncontrado, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMaximo && MaridajeEncontrado) {   // Usuario introdujo DO, tipo de uva, precio maximo y maridaje

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaMaximoConMaridaje(idTipoUva, TipoVino, DOEncontrada, precioMaximo, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", precioMaximo, idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && consultaCalificacion && MaridajeEncontrado) {   // Usuario introdujo DO, tipo de uva, calificacion y maridaje

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor, MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && consultaCalificacion) { // Usuario introdujo DO, tipo de uva, precio minimo y calificacion

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaMinimoConCalificacion(idTipoUva, TipoVino, DOEncontrada, precioMinimo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, "", idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMaximo && consultaCalificacion) { // Usuario introdujo DO, tipo de uva, precio maximo y calificacion

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", precioMaximo, idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && TipoUvaEncontrada && anoPreferencia && consultaCalificacion) {   // Usuario introdujo DO, tipo de uva, fecha cosecha y calificacion

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConDOYUvaConAnyoIgualConCalificacion(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConDOYUvaConAnyoDespuesConCalificacion(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConDOYUvaConAnyoAntesConCalificacion(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && anoPreferencia) {       // Usuario introdujo DO, tipo de uva, precio minimo y anyo

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConPrecioMinimoYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConPrecioMinimoYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConPrecioMinimoYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMaximo && anoPreferencia) {

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConPrecioMaximoYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConPrecioMaximoYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConPrecioMaximoYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMaximo, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && nombreBodegaEncontrado) {   // Usuario introdujo DO, tipo de uva, precio minimo y nombre bodega

                // Debemos buscar en la BBDD las botellas con estas caracteristicas


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYMinimo(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMaximo && nombreBodegaEncontrado) {

                // Debemos buscar en la BBDD las botellas con estas caracteristicas


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYMaximo(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMaximo, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", "", precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo) {      // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo

                // El usuario introdujo tanto precio minimo como precio maximo

                // Debemos buscar en la BBDD las botellas con estas caracteristicas


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);


                // Ahora debemos buscar las botellas con esas caracteristicas


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriterios(idTipoUva, TipoVino, DOEncontrada, precioMinimo, precioMaximo, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && MaridajeEncontrado) {       // Usuario introdujo DO, tipo de uva y maridaje

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosConDOYUvaConMaridaje(idTipoUva, TipoVino, DOEncontrada, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && precioMinimo && MaridajeEncontrado) {        // Usuario introdujo DO, precio mínimo y maridaje

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosDOYMinimoConMaridaje(DOEncontrada, TipoVino, precioMinimo, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", precioMinimo, "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && precioMaximo && MaridajeEncontrado) {    // Usuario introdujo DO, precio maximo y maridaje

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosDOYMaximoConMaridaje(DOEncontrada, TipoVino, precioMaximo, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", precioMaximo, idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (TipoUvaEncontrada && precioMinimo && MaridajeEncontrado) {   // Usuario introdujo Tipo de uva, precio minimo y maridaje

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosUvaYMinimoConMaridaje(idTipoUva, TipoVino, precioMinimo, MaridajeEncontrado, idsExcluir);



                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (TipoUvaEncontrada && precioMaximo && MaridajeEncontrado) {   // Usuario introdujo Tipo de uva, precio maximo y maridaje

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosUvaYMaximoConMaridaje(idTipoUva, TipoVino, precioMaximo, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", "", precioMaximo, idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (TipoUvaEncontrada && consultaCalificacion && MaridajeEncontrado) {   // Usuario introdujo Tipo de uva, calificacion y maridaje


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosConUvaConCalificacionConMaridaje(idTipoUva, TipoVino, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);



                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", "", "", "", "", "", consultaCalificacion.tipo, consultaCalificacion.valor, MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && anoPreferencia && MaridajeEncontrado) {      // Usuario introdujo DO, anyo y maridaje


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);


                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConDOYAnyoIgualConMaridaje(DOEncontrada, TipoVino, anoPreferencia.valor, MaridajeEncontrado, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConDOYAnyoDespuesConMaridaje(DOEncontrada, TipoVino, anoPreferencia.valor, MaridajeEncontrado, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConDOYAnyoAntesConMaridaje(DOEncontrada, TipoVino, anoPreferencia.valor, MaridajeEncontrado, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor, "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && consultaCalificacion && MaridajeEncontrado) {    // Usuario introdujo DO, calificacion y maridaje

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosConDOYUvaConCalificacionConMaridaje(DOEncontrada, TipoVino, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", "", idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor, MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && consultaCalificacion) {     // Usuario introdujo DO, tipo de uva y calificacion

                // Debemos buscar en la BBDD las botellas con estas caracteristicas


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosConDOYUvaConCalificacion(idTipoUva, TipoVino, DOEncontrada, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;




            }
            else if (DOEncontrada && TipoUvaEncontrada && anoPreferencia) {   // Usuario introdujo DO, tipo de uva y anyo

                // En este punto el usuario solo introdujo el precio minimo de la botella

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                // Ahora debemos buscar las botellas con esas caracteristicas


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);


                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConDOTipoUvaYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConDOTipoUvaYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConDOTipoUvaYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (nombreBodegaEncontrado && precioMinimo && consultaCalificacion) {    // Usuario introduce bodega, precio minimo y calificación

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                let botellasResultado = await buscarBotellasPorCriteriosConBodegaConMinimoConCalificacion(idBodega, precioMinimo, TipoVino, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", precioMinimo, "", idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (nombreBodegaEncontrado && precioMaximo && consultaCalificacion) {    // Usuario introdujo DO, precio maximo y calificación

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = await buscarBotellasPorCriteriosConBodegaConMaximoConCalificacion(idBodega, precioMaximo, TipoVino, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", precioMaximo, idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && precioMinimo && anoPreferencia) {        // Introdujo DO, precio minimo y fecha cosecha

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConDOPrecioMinimoFechaIgual(DOEncontrada, TipoVino, precioMinimo, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConDOPrecioMinimoFechaDespues(DOEncontrada, TipoVino, precioMinimo, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConDOPrecioMinimoFechaAntes(DOEncontrada, TipoVino, precioMinimo, anoPreferencia.valor, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", precioMinimo, "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && precioMaximo && anoPreferencia) {        // Usuario introdujo DO, precio maximo, fecha de cosecha

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConDOPrecioMaximoFechaIgual(DOEncontrada, TipoVino, precioMaximo, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConDOPrecioMaximoFechaDespues(DOEncontrada, TipoVino, precioMaximo, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConDOPrecioMaximoFechaAntes(DOEncontrada, TipoVino, precioMaximo, anoPreferencia.valor, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo) {     // Usuario introdujo DO, tipo de uva, precio minimo

                // En este punto el usuario solo introdujo el precio minimo de la botella

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                // Ahora debemos buscar las botellas con esas caracteristicas


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosPrecioMinimo(idTipoUva, TipoVino, DOEncontrada, precioMinimo, idsExcluir);

                console.log('botellas resultado: ' + botellasResultado);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, "", idsBotellas);   // Actualizar estado


                return mensajesRespuesta;
            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMaximo) {     // Usuario introdujo DO, tipo de uva, precio maximo


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                // Ahora debemos buscar las botellas con esas caracteristicas


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosPrecioMaximo(idTipoUva, TipoVino, DOEncontrada, precioMaximo, idsExcluir);

                console.log('botellas resultado: ' + botellasResultado);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (DOEncontrada && TipoUvaEncontrada && nombreBodegaEncontrado) {   // Introdujo DO, tipo de uva y nombre de bodega

                // Debemos buscar en la BBDD las botellas con estas caracteristicas


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosTipoUvaYDOYBodega(idTipoUva, TipoVino, DOEncontrada, idBodega, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", "", "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (nombreBodegaEncontrado && precioMinimo && anoPreferencia) {  // Introdujo bodega, precio minimo y fecha cosecha

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);


                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosBodegaMinimoYFechaIgual(idBodega, TipoVino, anoPreferencia.valor, precioMinimo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosBodegaMinimoYFechaDespues(idBodega, TipoVino, anoPreferencia.valor, precioMinimo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosBodegaMinimoYFechaAntes(idBodega, TipoVino, anoPreferencia.valor, precioMinimo, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", precioMinimo, "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (nombreBodegaEncontrado && precioMaximo && anoPreferencia) {      // Introdujo bodega, precio maximo y fecha de cosecha

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosBodegaMaximaYFechaIgual(idBodega, TipoVino, anoPreferencia.valor, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosBodegaMaximaYFechaDespues(idBodega, TipoVino, anoPreferencia.valor, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosBodegaMaximaYFechaAntes(idBodega, TipoVino, anoPreferencia.valor, precioMaximo, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && MaridajeEncontrado) {    // El usuario introdujo DO y maridaje


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosConDOConMaridaje(DOEncontrada, TipoVino, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (TipoUvaEncontrada && MaridajeEncontrado) {       // El usuario introdujo tipo de uva y maridaje


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosConUvaConMaridaje(idTipoUva, TipoVino, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (nombreBodegaEncontrado && consultaCalificacion) {    // El usuario introdujo nombre de bodega y calificacion

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = await buscarBotellasPorCriteriosConBodegaConCalificacion(idBodega, TipoVino, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", "", idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (nombreBodegaEncontrado && MaridajeEncontrado) {  // Usuario introduce bodega y maridaje

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosBodegaYMaridaje(idBodega, TipoVino, MaridajeEncontrado, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && anoPreferencia) {

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosDOYFechaIgual(DOEncontrada, TipoVino, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosDOYFechaDespues(DOEncontrada, TipoVino, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosDOYFechaAntes(DOEncontrada, TipoVino, anoPreferencia.valor, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (nombreBodegaEncontrado && anoPreferencia) {        // Introdujo bodega y anyo de cosecha

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosBodegaYFechaIgual(idBodega, TipoVino, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosBodegaYFechaDespues(idBodega, TipoVino, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosBodegaYFechaAntes(idBodega, TipoVino, anoPreferencia.valor, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (TipoUvaEncontrada && anoPreferencia) {       // Introdujo tipo de uva y fecha de cosecha

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosTipoUvaYFechaIgual(idTipoUva, TipoVino, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosTipoUvaYFechaDespues(idTipoUva, TipoVino, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosTipoUvaYFechaAntes(idTipoUva, TipoVino, anoPreferencia.valor, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;




            }
            else if (nombreBodegaEncontrado && precioMinimo) {        // Introdujo bodega y precio minimo

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosBodegaYMinimo(idBodega, TipoVino, precioMinimo, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", precioMinimo, "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (nombreBodegaEncontrado && precioMaximo) {    // Introdujo bodega y precio máximo

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosBodegaYMaximo(idBodega, TipoVino, precioMaximo, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && precioMinimo) {      // Introdujo DO y Precio Mínimo

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosDOYMinimo(DOEncontrada, TipoVino, precioMinimo, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", precioMinimo, "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && precioMaximo) {      // Introdujo DO y Precio Maximo

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosDOYMaximo(DOEncontrada, TipoVino, precioMaximo, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (TipoUvaEncontrada && precioMinimo) {     // Introdujo Tipo de uva y precio minimo

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosTipoUvaYMinimo(idTipoUva, TipoVino, precioMinimo, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (TipoUvaEncontrada && precioMaximo) {     // Introdujo tipo de uva y precio maximo

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosTipoUvaYMaximo(idTipoUva, TipoVino, precioMaximo, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", "", precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && TipoUvaEncontrada) {     // Introdujo DO y Tipo de Uva


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosTipoUvaYDO(idTipoUva, TipoVino, DOEncontrada, idsExcluir);

                console.log('botellas resultado: ' + botellasResultado);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (TipoUvaEncontrada && nombreBodegaEncontrado) {       // Introdujo Tipo de uva y bodega

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosTipoUvaYBodega(idTipoUva, TipoVino, idBodega, idsExcluir);

                console.log('botellas resultado: ' + botellasResultado);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", "", "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (nombreBodegaEncontrado) {        // Introdujo solo Bodega

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosBodega(idBodega, TipoVino, idsExcluir);

                console.log('botellas resultado: ' + botellasResultado);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }









            //---------------------------------------------------------------------------------------
            // NECESITO PREGUNTARLE AL USUARIO POR MÁS INFORMACION
            //---------------------------------------------------------------------------------------







            else if (precioMinimo && MaridajeEncontrado) {  // Usuario introdujo precio minimo y maridaje

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas.....");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", precioMinimo, "", "", "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (precioMaximo && MaridajeEncontrado) {  // Usuario introdujo precio maximo y maridaje

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas....");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", precioMaximo, "", "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (anoPreferencia && MaridajeEncontrado) {      // Usuario introduje fecha cosecha y maridaje

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas.....");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "", anoPreferencia.tipo, anoPreferencia.valor, "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (consultaCalificacion && MaridajeEncontrado) {    // Usuario solo introdujo calificacion y maridaje

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "", "", "", consultaCalificacion.tipo, consultaCalificacion.valor, MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (anoPreferencia && consultaCalificacion) {    // Usuario solo introdujo fecha cosecha y calificacion

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "", anoPreferencia.tipo, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && consultaCalificacion) {  // Usuario solo introdujo DO y calificacion

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como precio, tipo de uva, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 0, "", "", "", "", "", "", "", "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (TipoUvaEncontrada && consultaCalificacion) {

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como precio, tipo de uva, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, TipoUvaEncontrada, "", "", "", "", "", "", "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (precioMinimo && anoPreferencia) {    // Usuario solo introdujo precio minimo y fecha de cosecha

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", precioMinimo, "", "", anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (precioMaximo && anoPreferencia) {    // Usuario solo introdujo precio maximo y fecha de cosecha

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", precioMaximo, "", anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (precioMinimo && precioMaximo) {      // Usuario solo introdujo rango de precio

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", precioMinimo, precioMaximo, "");   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (MaridajeEncontrado) {    // Usuario solo introdujo maridaje

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, fecha de cosecha, precios, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "", "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (consultaCalificacion) {  // Usuario solo introdujo calificacion

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, fecha de cosecha, precios, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "", "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (anoPreferencia) {        // Usuario solo introdujo fecha de cosecha

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, precios, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "", anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (precioMinimo) {      // Usuario solo introdujo Precio minimo

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                console.log('solo introdujo minimo');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", precioMinimo, "", "");   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (precioMaximo) {      // Usuario solo introdujo Precio maximo

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                console.log('solo introdujo maximo');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", precioMaximo, "");   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (DOEncontrada) {   // Usuario solo introdujo DO

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como precio, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (TipoUvaEncontrada) {     // Usuario solo introdujo Tipo de Uva

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como precio, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, TipoUvaEncontrada, "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (TipoVino) {  // Usuario solo introdujo el Tipo de vino

                const mensajesRespuesta = [botResponse.fulfillmentText];

                switch (TipoVino) {

                    case 1:     // TINTO
                        mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más del vino tinto que quieres, como precio, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");
                        break;
                    case 2:     // BLANCO
                        mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más del vino blanco que quieres, como precio, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");
                        break;
                    case 3:     // ROSADO
                        mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más del vino rosado que quieres, como precio, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");
                        break;
                    case 4:     // ESPUMOSO
                        mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más del vino espumoso que quieres, como precio, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");
                        break;
                    case 5:     // DULCE
                        mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más del vino dulce que quieres, como precio, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");
                        break
                }

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;


            }
            else {   // El usuario no introdujo nada

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como tipo de vino, precio, tipo de uva, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;
            }
            return botResponse.fulfillmentText;
        }
        else if (tipoIntent == INFORMACION_VARIEDADES_DE_UVAS) {    // Informacion sobre variedad de uva

            // DEBEMOS COMPROBAR SI NOS INTRODUJO VARIEDAD DE UVA ESPECIFICA
            const copMensaje = mensaje;
            mensaje = mensaje.toLowerCase();
            const palabrasUsuario = mensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras

            // Obtener palabras clave de Tipo Uva de la base de datos
            const palabrasClaveTipoUva = await obtenerPalabrasClaveTipoUva();

            let TipoUvaEncontrada;
            let busquedaPorCalificacion;
            let menorDistancia = Infinity;
            const umbralDistancia = 2.5;

            for (const tipoUvaNombre of palabrasClaveTipoUva) {
                const longitudTipoUva = tipoUvaNombre.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudTipoUva);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, tipoUvaNombre.toLowerCase());
                    if (distancia < menorDistancia && distancia <= umbralDistancia) {
                        menorDistancia = distancia;
                        TipoUvaEncontrada = tipoUvaNombre;
                    }
                }
            }
            if (TipoUvaEncontrada) {   // Usuario introdujo Tipo Uva existente en BBDD

                // Encontrar en BBDD ese tipo de uva y obtener info

                // Obtener info del tipo de uva
                const palabrasClaveTipoUva = await obtenerDescripcionTipoUva(TipoUvaEncontrada);

                console.log(palabrasClaveTipoUva);

                const mensajesRespuesta = [palabrasClaveTipoUva];

                mensajesRespuesta.unshift(botResponse.fulfillmentText);
                mensajesRespuesta.push('Esta es la información que tengo sobre el tipo de uva que indicaste.');

                console.log(mensajesRespuesta);

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_VARIEDADES_DE_UVAS, "", "", "", 0, TipoUvaEncontrada, "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;
            }
            else {   // El usuario no introdujo Tipo Uva existente en BBDD

                // DEBEMOS COMPROBAR SI NOS INTRODUJO VARIEDAD DE UVA ESPECIFICA
                const palabrasUsuario = copMensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras
                // Leer tipos de uva del fichero
                console.log(palabrasUsuario);
                const tiposDeUva = await leerTiposDeUvaDeFichero();
                let uvaEncontrada = false;
                let uvaNombre = null;

                for (const palabraUsuario of palabrasUsuario) {
                    if (tiposDeUva.includes(palabraUsuario)) {
                        uvaEncontrada = true;
                        uvaNombre = palabraUsuario;
                        break; // Rompe el ciclo si encuentra una coincidencia
                    }
                }

                if (uvaEncontrada) {
                    // Realizar acciones correspondientes si se encontró una coincidencia
                    console.log("Se encontró una coincidencia con un tipo de uva del fichero. Sabiendo que no esta en BBDD");

                    // El usuario está preguntando por informacion que no esta en BBDD, por lo cual debemos hacer una llamada a ChatGPT y obtener respuesta con información

                    console.log('La uva que quiere el usuario es: ' + uvaNombre);


                    const completion = await openai.chat.completions.create({
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: `Necesito que me des la siguiente información sobre la uva: ${uvaNombre}. La información que necesito es: Características:, Región:(Nombre de la región, a secas, no digas nada más ya que sólo quiero el nombre de la región), Notas de Sabor: y Descripción:. Cabe destacar que esta información debe presentarse siempre en forma de lista, en un texto, sin enumeraciones, indicando cuál es cada parte. Y siempre en el orden indicado.` }
                        ],
                    });

                    // Guardar el contenido de la respuesta en la variable
                    detallesUvaGPT = completion.choices[0].message.content;
                    console.log(detallesUvaGPT);


                    // Dividir la respuesta en secciones
                    const secciones = detallesUvaGPT.split('\n\n');


                    // Extraer datos consulta ChatGPT
                    const caracteristicas = secciones[0].split(': ')[1];
                    console.log(caracteristicas);
                    const region = secciones[1].split(': ')[1].replace(/\.$/, '');
                    console.log(region);
                    const notasDeSabor = secciones[2].split(': ')[1];
                    console.log(notasDeSabor);
                    const descripcion = secciones[3].split(': ')[1];
                    console.log(descripcion);


                    await insertarTipoDeUva(uvaNombre, caracteristicas, region, notasDeSabor, descripcion)
                        .then(resultados => console.log('Inserción completada:', resultados))
                        .catch(error => console.error('Error al insertar en la base de datos:', error));

                    // En este punto se ha insertado en BBDD el tipo de uva

                    // Buscar info del tipo uva insertada
                    const infoTipoUva = await obtenerDescripcionTipoUva(uvaNombre);

                    console.log(infoTipoUva);

                    const mensajesRespuesta = [infoTipoUva];

                    mensajesRespuesta.unshift(botResponse.fulfillmentText);
                    mensajesRespuesta.push('Esta es la información que tengo sobre el tipo de uva que indicaste.');

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_VARIEDADES_DE_UVAS, "", "", "", 0, uvaNombre, "", "", "", "", "", "");   // Actualizar estado

                    return mensajesRespuesta;

                } else {
                    // No se encontró coincidencia, el usuario quiere informacion sobre las uvas en general
                    console.log("No se encontró coincidencia con los tipos de uva del fichero.");

                    const userId = obtenerUserIDDeSessionActual();
                    const idsExcluir = obtenerIdsUvasRecientesDeEstadoUsuario(userId);
                    const infoUvas = await obtenerNombreYTiposDeUvas(idsExcluir);

                    const mensajesRespuesta = infoUvas.map(uva => `${uva.Nombre}: ${uva.Descripcion}`);

                    // Extraer solo los ID's en una variable separada
                    const idsUvas = infoUvas.map(uva => uva.UvaID);

                    mensajesRespuesta.unshift(botResponse.fulfillmentText);

                    mensajesRespuesta.push('Estos son algunos de los tipos de uva que se utilizan en la elaboración de vino español.');

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_VARIEDADES_DE_UVAS, "", idsUvas, "", 1, "", "", "", "", "", "", "");   // Actualizar estado

                    return mensajesRespuesta;


                }

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_VARIEDADES_DE_UVAS, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado
            }

            return mensajesRespuesta;

        }
        else if (tipoIntent == HISTORIA_VINO_TINTO) {     // Informacion sobre la historia del vino tinto


            const historiaVino = await obtenerHistoriaVino(1);

            console.log('Historia del vino: ' + historiaVino);

            const mensajesRespuesta = [historiaVino];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Esto es un resumen sobre los orígenes y el desarrollo del vino tinto en España.');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), HISTORIA_VINO_TINTO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;
        }
        else if (tipoIntent == HISTORIA_VINO_BLANCO) {     // Informacion sobre la historia del vino blanco

            const historiaVino = await obtenerHistoriaVino(2);

            console.log('Historia del vino: ' + historiaVino);

            const mensajesRespuesta = [historiaVino];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Esto es un resumen sobre los orígenes y el desarrollo del vino blanco en España.');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), HISTORIA_VINO_BLANCO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;


        }
        else if (tipoIntent == HISTORIA_VINO_ROSADO) {     // Informacion sobre la historia del vino rosado

            const historiaVino = await obtenerHistoriaVino(3);

            console.log('Historia del vino: ' + historiaVino);

            const mensajesRespuesta = [historiaVino];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Esto es un resumen sobre los orígenes y el desarrollo del vino rosado en España.');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), HISTORIA_VINO_ROSADO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;

        }
        else if (tipoIntent == HISTORIA_VINO_ESPUMOSO) {     // Informacion sobre la historia del vino espumoso

            const historiaVino = await obtenerHistoriaVino(4);

            console.log('Historia del vino: ' + historiaVino);

            const mensajesRespuesta = [historiaVino];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Esto es un resumen sobre los orígenes y el desarrollo del vino espumoso en España.');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), HISTORIA_VINO_ESPUMOSO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;

        }
        else if (tipoIntent == HISTORIA_VINO_DULCE) {     // Informacion sobre la historia del vino dulce

            const historiaVino = await obtenerHistoriaVino(4);

            console.log('Historia del vino: ' + historiaVino);

            const mensajesRespuesta = [historiaVino];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Esto es un resumen sobre los orígenes y el desarrollo del vino dulce en España.');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), HISTORIA_VINO_DULCE, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;

        }
        else if (tipoIntent == INFORMACION_ALMACENAMIENTO) {      // Informacion Almacenamiento

            const infoAlmacenamiento = await obtenerRespuestaAleatoriaAlmacenamientoVino();

            console.log('Información almacenamiento: ' + infoAlmacenamiento);

            const mensajesRespuesta = [infoAlmacenamiento];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Espero que te haya servido!');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_ALMACENAMIENTO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;

        }
        else if (tipoIntent == INFORMACION_SERVICIO) {        // Informacion Servicio

            const infoAlmacenamiento = await obtenerRespuestaAleatoriaAlmacenamientoServicio();

            console.log('Información servicio: ' + infoAlmacenamiento);

            const mensajesRespuesta = [infoAlmacenamiento];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Espero que te haya servido!');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_SERVICIO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;

        }
        else if (tipoIntent == INFORMACION_BODEGA) {    // Informacion sobre bodega

            // DEBEMOS COMPROBAR SI NOS INTRODUJO NOMBRE DE BODEGA
            const copMensaje = mensaje;
            mensaje = mensaje.toLowerCase();
            const palabrasUsuario = mensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras

            // Obtener nombres de bodegas en BBDD
            const nombresBodegas = await obtenerNombresBodegas();


            let nombreBodegaEncontrado;
            let busquedaPorCalificacion;
            let menorDistancia = Infinity;
            const umbralDistancia = 2.5;

            for (const nombreBodega of nombresBodegas) {
                const longitudTipoUva = nombreBodega.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudTipoUva);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, nombreBodega.toLowerCase());
                    if (distancia < menorDistancia && distancia <= umbralDistancia) {
                        menorDistancia = distancia;
                        nombreBodegaEncontrado = nombreBodega;
                    }
                }
            }

            if (nombreBodegaEncontrado) {     // La Bodega existe en BBDD

                // Encontrar en BBDD esa bodega

                // Obtener info de la bodega
                const infoBodega = await obtenerDescripcionBodega(nombreBodegaEncontrado);

                console.log(infoBodega);

                const mensajesRespuesta = [infoBodega];

                mensajesRespuesta.unshift(botResponse.fulfillmentText);
                mensajesRespuesta.push('Esta es la información que tengo sobre la bodega que has mencionado.');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_BODEGA, "", "", "", 0, "", nombreBodegaEncontrado, "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;

            }
            else {   // No tenemos la bodega en BBDD

                // Lo que debemos identificar ahora es si el usuario quiere informacion sobre una bodega que no esta en BBDD o si quiere informacion sobre varias bodegas

                const palabrasUsuario = copMensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras
                console.log(palabrasUsuario);
                const nombreBodegas = (await leerNombresBodegasFichero()).map(nombre => nombre.trim());
                console.log(nombreBodegas);
                let bodegaEncontrada = false;
                let bodegaNombre = null;

                for (const palabraUsuario of palabrasUsuario) {
                    console.log(palabraUsuario);
                    if (nombreBodegas.includes(palabraUsuario)) {
                        bodegaEncontrada = true;
                        bodegaNombre = palabraUsuario;
                        break; // Rompe el ciclo si encuentra una coincidencia
                    }
                }


                if (bodegaEncontrada) {   // El usuario quiere informacion sobre una bodega que no tenemos en BBDD

                    // Realizar acciones correspondientes si se encontró una coincidencia
                    console.log("Se encontró una coincidencia con nombre de Bodega. Sabiendo que no esta en BBDD");
                    // El usuario está preguntando por informacion que no esta en BBDD, por lo cual debemos hacer una llamada a ChatGPT y obtener respuesta con información
                    console.log('La info de la bodega que quiere el usuario es: ' + bodegaNombre);
                    const completion = await openai.chat.completions.create({
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: `Necesito que me des la siguiente información sobre la bodega: ${bodegaNombre}. La información que necesito es: Descripción:(al menos 5 líneas de descripción), Región:(Nombre de la región, a secas, no digas nada más ya que sólo quiero el nombre de la región), Año de Fundación:(Sólo el número del año, sin nada más) y Email de Contacto:(te lo puedes inventar). Cabe destacar que esta información debe presentarse siempre en forma de lista(Descripción:.....Región:.....), en un texto, sin enumeraciones, indicando cuál es cada parte(SIEMPRE). Y siempre en el orden indicado. Y cuando termine el contenido de la sección separa la siguiente por una línea en blanco` }
                        ],
                    });

                    // Guardar el contenido de la respuesta en la variable
                    detallesBodegaGPT = completion.choices[0].message.content;
                    console.log(detallesBodegaGPT);

                    // Dividir la respuesta en secciones
                    const secciones = detallesBodegaGPT.split('\n\n');

                    // Extraer datos consulta ChatGPT
                    const descripcion = secciones[0].split(': ')[1];
                    console.log(descripcion);
                    const region = secciones[1].split(': ')[1].replace(/\.$/, '');
                    console.log(region);
                    const anoFundacion = secciones[2].split(': ')[1];
                    console.log(anoFundacion);
                    const email = secciones[3].split(': ')[1];
                    console.log(email);


                    await insertarBodega(bodegaNombre, region, descripcion, anoFundacion, email)
                        .then(resultados => console.log('Inserción completada:', resultados))
                        .catch(error => console.error('Error al insertar en la base de datos:', error));

                    // Obtener info de la bodega
                    const infoBodega = await obtenerDescripcionBodega(bodegaNombre);

                    console.log(infoBodega);

                    const mensajesRespuesta = [infoBodega];

                    mensajesRespuesta.unshift(botResponse.fulfillmentText);
                    mensajesRespuesta.push('Esta es la información que tengo sobre la bodega que has mencionado.');

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_BODEGA, "", "", "", 0, "", bodegaNombre, "", "", "", "", "");   // Actualizar estado

                    return mensajesRespuesta;


                }
                else {   // El usuario quiere informacion sobre distintas bodegas
                    console.log('Quiere info sobre distintas bodegas');

                    const userId = obtenerUserIDDeSessionActual();
                    const idsExcluir = obtenerIdsBodegasRecientesDeEstadoUsuario(userId);
                    const infoBodegas = await obtenerNombre_Region_DescripcionBodegas(idsExcluir);

                    const mensajesRespuesta = infoBodegas.map(bodega => `<strong>Nombre:</strong> ${bodega.Nombre}<br><strong>Región:</strong> "${bodega.Region}"<br><strong>Descripción:</strong> ${bodega.Descripcion}`);


                    // Extraer solo los ID's en una variable separada
                    const idsBodegas = infoBodegas.map(bodega => bodega.BodegaID);

                    mensajesRespuesta.unshift(botResponse.fulfillmentText);

                    mensajesRespuesta.push('Estas son algunas bodegas que se encuentran dentro del territorio español.');

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_BODEGA, "", "", "", 1, "", "", idsBodegas, "", "", "", "");   // Actualizar estado

                    return mensajesRespuesta;


                }
            }

        }
        else if (tipoIntent == INFORMACION_DO) {  // Informacion sobre DO

            // DEBEMOS COMPROBAR SIN NOS ESTA INTRODUCIENDO UNA DO ESPECIFICA
            const copMensaje = mensaje;
            mensaje = mensaje.toLowerCase();
            const palabrasUsuario = mensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras

            // Obtener nombres DO
            const nombresDO = await obtenerNombresDO();


            let DOEncontrada;
            let busquedaPorCalificacion;
            let menorDistancia = Infinity;
            const umbralDistancia = 2.5;

            for (const DO of nombresDO) {
                const longitudDO = DO.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudDO);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, DO.toLowerCase());
                    if (distancia < menorDistancia && distancia <= umbralDistancia) {
                        menorDistancia = distancia;
                        DOEncontrada = DO;
                    }
                }
            }



            if (DOEncontrada) {  // El usuario introdujo una DO existente en BBDD

                // Encontrar en BBDD y obtener info

                // Obtener info de esa DO
                const descripcionDO = await obtenerDescripcionDO(DOEncontrada);

                console.log(descripcionDO);

                const mensajesRespuesta = [descripcionDO];

                mensajesRespuesta.unshift(botResponse.fulfillmentText);
                mensajesRespuesta.push('Esta es la información que tengo sobre la DO que indicaste.');

                console.log(mensajesRespuesta);

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_DO, DOEncontrada, "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;

            }
            else {   // El usuario no introdujo una DO existente en BBDD o quiere buscar info de varias DO

                console.log('No tenemos DO en BBDD');

                // DEBEMOS COMPROBAR SI NOS INTRODUJO VARIEDAD DE UVA ESPECIFICA
                const palabrasUsuario = copMensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras
                // Leer tipos de uva del fichero
                console.log(palabrasUsuario);
                const nombresDO = (await leerDOFichero()).map(nombre => nombre.trim());
                console.log(nombresDO);
                let DOEncontrada = false;
                let doNombre = null;

                for (const palabraUsuario of palabrasUsuario) {
                    if (nombresDO.includes(palabraUsuario)) {
                        DOEncontrada = true;
                        doNombre = palabraUsuario;
                        break; // Rompe el ciclo si encuentra una coincidencia
                    }
                }



                if (DOEncontrada) {     // Hemos encontrado DO en fichero, por lo que quiere info sobre una DO que no esta en BBDD

                    // Realizar acciones correspondientes si se encontró una coincidencia
                    console.log("Se encontró una coincidencia en el fichero de DO, por lo cual debemos buscar info y meter en BBDD");

                    // El usuario está preguntando por informacion que no esta en BBDD, por lo cual debemos hacer una llamada a ChatGPT y obtener respuesta con información

                    console.log('La DO que quiere el usuario es: ' + doNombre);


                    const completion = await openai.chat.completions.create({
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: `Necesito que me des la siguiente información sobre la Denominación de Orgien: ${doNombre}, perteneciente a la región de Canarias. La información que necesito es: Descripción: (Descripción: Al menos 3 líneas de descripción). Tiene que venir siempre de esta forma: Descripción:......` }
                        ],
                    });

                    // Guardar el contenido de la respuesta en la variable
                    detallesDO = completion.choices[0].message.content;
                    console.log(detallesDO);

                    // Extraer datos consulta ChatGPT
                    const descripcion = detallesDO.split(': ')[1];

                    console.log(descripcion);


                    await insertarDO(doNombre, descripcion)
                        .then(resultados => console.log('Inserción completada:', resultados))
                        .catch(error => console.error('Error al insertar en la base de datos:', error));


                    const descripcionDO = await obtenerDescripcionDO(doNombre);

                    console.log('Descripción DO: ' + descripcionDO);

                    const mensajesRespuesta = [descripcionDO];

                    mensajesRespuesta.unshift(botResponse.fulfillmentText);
                    mensajesRespuesta.push('Esta es la información que tengo sobre la DO que has mencionado.');

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_DO, doNombre, "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                    return mensajesRespuesta;

                }
                else {       // El usuario quiere informacion sobre varias DO

                    console.log('Quiere info sobre distintas DOs');

                    const userId = obtenerUserIDDeSessionActual();
                    const idsExcluir = obtenerIdsDOsRecientesDeEstadoUsuario(userId);
                    console.log(idsExcluir);
                    const infoDOs = await obtenerNombre_DescripcionDOs(idsExcluir);

                    const mensajesRespuesta = infoDOs.map(DO => `<strong>Nombre:</strong> ${DO.Nombre}<br><strong>Descripción:</strong> ${DO.Descripcion}`);

                    // Extraer solo los ID's en una variable separada
                    const idsDOs = infoDOs.map(DO => DO.DOID);

                    mensajesRespuesta.unshift(botResponse.fulfillmentText);

                    mensajesRespuesta.push('Estas son algunas DOs que se encuentran dentro del territorio español:');

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_DO, "", "", "", 1, "", "", "", idsDOs, "", "", "");   // Actualizar estado

                    return mensajesRespuesta;

                }
            }
        }
        else if (tipoIntent == ADICCION_BUSQUEDA) {   // El usuario quiere mas informacion

            // Debemos ver cual fue el ultimo estado de donde se busco la botella

            const userId = obtenerUserIDDeSessionActual();
            console.log('ID usuario: ' + userId);

            if (estadoUsuario[userId]) {    // Buscar búsqueda más reciente de botellas

                const indiceEstadoBotella = estadoUsuario[userId].findIndex(estado => estado.categoria === 'AyudaEncontrarBotella');
                const indiceEstadoUvas = estadoUsuario[userId].findIndex(estado => estado.categoria === 'InformacionVariedadesDeUva');
                const indiceEstadoDO = estadoUsuario[userId].findIndex(estado => estado.categoria === 'InformacionDO');

                if (indiceEstadoBotella !== -1 || indiceEstadoUvas !== -1 || indiceEstadoDO !== -1) {   // Ha encontrado busqueda anterior

                    const parametrosBusqueda = {};

                    if (indiceEstadoBotella !== -1) {     // ULTIMA BUSQUEDA DE BOTELLAS

                        const estadoBotella = estadoUsuario[userId][indiceEstadoBotella];

                        // Extracción y Verificación de los Elementos del Estado

                        for (const clave in estadoBotella) {
                            if (estadoBotella.hasOwnProperty(clave) && estadoBotella[clave] !== '' && estadoBotella[clave] !== undefined) {
                                parametrosBusqueda[clave] = estadoBotella[clave];
                            }
                        }
                    }
                    else if (indiceEstadoUvas !== -1) {   // ULTIMA BUSQUEDA DE UVAS

                        const estadoUva = estadoUsuario[userId][indiceEstadoUvas];

                        // Extracción y Verificación de los Elementos del Estado

                        for (const clave in estadoUva) {
                            if (estadoUva.hasOwnProperty(clave) && estadoUva[clave] !== '' && estadoUva[clave] !== undefined) {
                                parametrosBusqueda[clave] = estadoUva[clave];
                            }
                        }

                    }
                    else if (indiceEstadoDO !== -1) {    // ULTIMA BUSQUEDA DE DO

                        const estadoDO = estadoUsuario[userId][indiceEstadoDO];

                        // Extracción y Verificación de los Elementos del Estado

                        for (const clave in estadoDO) {
                            if (estadoDO.hasOwnProperty(clave) && estadoDO[clave] !== '' && estadoDO[clave] !== undefined) {
                                parametrosBusqueda[clave] = estadoDO[clave];
                            }
                        }

                    }


                    let parametros = 0;


                    let sql;

                    console.log(parametrosBusqueda);

                    if (parametrosBusqueda.categoria) {   // Categoria valida

                        console.log("ESTAMOS BUSCANDO MAS DATOS");


                        if (parametrosBusqueda.categoria == 'AyudaEncontrarBotella') {    // BOTELLAS
                            sql = 'SELECT * FROM Botellas ';
                        }
                        else if (parametrosBusqueda.categoria == 'InformacionVariedadesDeUva') {    // UVAS
                            sql = 'SELECT * FROM TiposDeUvas ';
                        }
                        else if (parametrosBusqueda.categoria == 'InformacionDO') {       // DENOMINACIONES
                            sql = 'SELECT * FROM DenominacionesDeOrigen ';
                        }
                        else if (parametrosBusqueda.categoria == 'InformacionBodega') {   // BODEGAS

                        }




                        if (parametrosBusqueda.TipoVino) {    // TIPO VINO ESPECIFICADO 
                            parametros = 1;
                            sql += 'WHERE TipoVinoID = ' + parametrosBusqueda.TipoVino + ' ';
                        }
                        else if (parametrosBusqueda.categoria != 'InformacionVariedadesDeUva' && parametrosBusqueda.categoria != 'InformacionDO') {   // TIPO DE VINO NO ESPECIFICADO
                            parametros = 1;
                            sql += 'WHERE TipoVinoID IN (1, 2, 3, 4, 5) ';
                        }

                        // Ya hemos mirado el tipo de vino


                        if (parametrosBusqueda.DO) {  // DO ESPECIFICADA
                            parametros = 1;
                            sql += 'AND Region = ' + '"' + parametrosBusqueda.DO + '"' + ' ';
                        }



                        if (parametrosBusqueda.variedadUva) {     // TIPO UVA

                            // Buscar UvaID
                            const idTipoUva = await obtenerIDTipoDeUva(parametrosBusqueda.variedadUva);

                            console.log('ID del tipo de uva: ' + idTipoUva);

                            parametros = 1;
                            sql += 'AND UvaID = ' + idTipoUva + ' ';
                        }


                        if (parametrosBusqueda.nombreBodega) {    // NOMBRE BODEGA
                            parametros = 1;
                            // Buscar BodeID
                            const idBodega = await obtenerIDBodega(parametrosBusqueda.nombreBodega);

                            console.log('ID de la bodega es: ' + idBodega);

                            sql += 'AND BodegaID = ' + idBodega + ' ';

                        }


                        if (parametrosBusqueda.precioMinimo && parametrosBusqueda.precioMaximo) {     // PRECIO MINIMO Y MAXIMO
                            parametros = 1;
                            sql += 'AND Precio BETWEEN ' + parametrosBusqueda.precioMinimo + ' AND ' + parametrosBusqueda.precioMaximo + ' ';

                        }
                        else if (parametrosBusqueda.precioMinimo) {   // PRECIO MINIMO
                            parametros = 1;
                            sql += 'AND Precio >= ' + parametrosBusqueda.precioMinimo + ' ';

                        }
                        else if (parametrosBusqueda.precioMaximo) {   // PRECIO MAXIMO
                            parametros = 1;
                            sql += 'AND Precio <= ' + parametrosBusqueda.precioMaximo + ' ';

                        }



                        if (parametrosBusqueda.preferenciaAnyo) {     // FECHA DE COSECHA
                            parametros = 1;
                            if (parametrosBusqueda.preferenciaAnyo == 'exacto') {
                                sql += 'AND AnoCosecha = ' + parametrosBusqueda.valorAnyo + ' ';
                            }
                            else if (parametrosBusqueda.preferenciaAnyo == 'inicio') {
                                sql += 'AND AnoCosecha >= ' + parametrosBusqueda.valorAnyo + ' ';
                            }
                            else if (parametrosBusqueda.preferenciaAnyo == 'fin') {
                                sql += 'AND AnoCosecha <= ' + parametrosBusqueda.valorAnyo + ' ';
                            }

                        }



                        if (parametrosBusqueda.calificacionTipo) {    //  CALIFICACION BOTELLA
                            parametros = 1;
                            if (parametrosBusqueda.calificacionTipo == 'mejores') {   // Mejores
                                sql += 'ORDER BY Calificacion DESC ';
                            }
                            else if (parametrosBusqueda.calificacionTipo == 'peores') {   // Peores
                                sql += 'ORDER BY Calificacion ASC ';
                            }
                            else if (parametrosBusqueda.calificacionTipo == 'igualesA') { // Iguales a
                                sql += 'AND Calificacion = ' + parametrosBusqueda.calificacionValor + ' ORDER BY Calificacion DESC ';
                            }
                            else if (parametrosBusqueda.calificacionTipo == 'superioresA') {  // Superiores a
                                sql += 'AND Calificacion >= ' + parametrosBusqueda.calificacionValor + ' ORDER BY Calificacion DESC ';
                            }
                            else if (parametrosBusqueda.calificacionTipo == 'inferioresA') {  // Inferiores a
                                sql += 'AND Calificacion <= ' + parametrosBusqueda.calificacionValor + ' ORDER BY Calificacion DESC ';
                            }

                        }



                        /*
                        // Vamos a ver las botellas que no tenemos que ver porque ya las hemos visto

                        if(parametrosBusqueda.acumularIds == 0){    // VENIMOS DE NO ACUMULAR

                        }
                        else if(parametrosBusqueda.acumularIds == 1){   // VENIMOS DE ACUMULAR

                        }
                        */


                        // Vamos a ver las botellas que tenemos que excluir en la búsqueda
                        if (parametrosBusqueda.idsBotellas && parametrosBusqueda.idsBotellas.length > 0) {
                            let idsExcluir = parametrosBusqueda.idsBotellas.join(', ');
                            sql += 'AND BotellaID NOT IN (' + idsExcluir + ') ';
                        }

                        if (parametros == 1 && parametrosBusqueda.categoria == 'InformacionVariedadesDeUva') {
                            // Vamos a ver las botellas que tenemos que excluir en la búsqueda
                            if (parametrosBusqueda.idsUvas && parametrosBusqueda.idsUvas.length > 0) {
                                let idsExcluir = parametrosBusqueda.idsUvas.join(', ');
                                sql += 'AND UvaID NOT IN (' + idsExcluir + ') ';
                            }
                        }
                        else if (parametros == 0 && parametrosBusqueda.categoria == 'InformacionVariedadesDeUva') {
                            // Vamos a ver las botellas que tenemos que excluir en la búsqueda
                            if (parametrosBusqueda.idsUvas && parametrosBusqueda.idsUvas.length > 0) {
                                let idsExcluir = parametrosBusqueda.idsUvas.join(', ');
                                sql += 'WHERE UvaID NOT IN (' + idsExcluir + ') ';
                            }
                        }
                        else if (parametros == 1 && parametrosBusqueda.categoria == 'InformacionDO') {
                            // Vamos a ver las botellas que tenemos que excluir en la búsqueda
                            if (parametrosBusqueda.idsUvas && parametrosBusqueda.idsUvas.length > 0) {
                                let idsExcluir = parametrosBusqueda.idsUvas.join(', ');
                                sql += 'AND UvaID NOT IN (' + idsExcluir + ') ';
                            }
                        }
                        else if (parametros == 0 && parametrosBusqueda.categoria == 'InformacionDO') {
                            // Vamos a ver las botellas que tenemos que excluir en la búsqueda
                            if (parametrosBusqueda.idsDOs && parametrosBusqueda.idsDOs.length > 0) {
                                let idsExcluir = parametrosBusqueda.idsDOs.join(', ');
                                sql += 'WHERE DOID NOT IN (' + idsExcluir + ') ';
                            }
                        }

                        // Debemos ver ahora para devolver el resultado



                        sql += ' LIMIT 5;';


                        console.log(sql);


                        // VAMOS A EJECUTAR LA QUERY CON LOS CAMPOS

                        let resultado = await ejecutarConsulta(sql);


                        if (parametrosBusqueda.categoria == 'AyudaEncontrarBotella') {     // BOTELLAS

                            const mensajesRespuesta = resultado.map(botella =>
                                `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                                `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                                `<strong>Región:</strong> "${botella.Region}"<br>` +
                                `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                                `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                                `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                                `<strong>Stock:</strong> ${botella.Stock}<br>` +
                                `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                                `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                            );

                            // Extraer solo los ID's en una variable separada
                            const idsBotellas = resultado.map(botella => botella.BotellaID);

                            console.log('IDS Botellas devueltas: ' + idsBotellas);


                            mensajesRespuesta.unshift('Aquí tienes más resultados:');
                            mensajesRespuesta.push('Espero que te haya sido útil esta infomración. Si quieres saber algo más sólo dímelo!');
                            // Actualizar estado
                            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA,
                                (parametrosBusqueda.TipoVino) ? parametrosBusqueda.TipoVino : "",
                                (parametrosBusqueda.DO) ? parametrosBusqueda.DO : "",
                                (parametrosBusqueda.idsUvas) ? parametrosBusqueda.idsUvas : "",
                                (parametrosBusqueda.busquedaPorCalificacion) ? parametrosBusqueda.busquedaPorCalificacion : "",
                                (parametrosBusqueda.acumularIds == 1) ? parametrosBusqueda.acumularIds : 1,
                                (parametrosBusqueda.variedadUva) ? parametrosBusqueda.variedadUva : "",
                                (parametrosBusqueda.nombreBodega) ? parametrosBusqueda.nombreBodega : "",
                                (parametrosBusqueda.idsBodegas) ? parametrosBusqueda.idsBodegas : "",
                                (parametrosBusqueda.idsDOs) ? parametrosBusqueda.idsDOs : "",
                                (parametrosBusqueda.precioMinimo) ? parametrosBusqueda.precioMinimo : "",
                                (parametrosBusqueda.precioMaximo) ? parametrosBusqueda.precioMaximo : "",
                                idsBotellas);
                            return mensajesRespuesta;

                        }
                        else if (parametrosBusqueda.categoria == 'InformacionVariedadesDeUva') {    // UVAS


                            const mensajesRespuesta = resultado.map(uva => `${uva.Nombre}: ${uva.Descripcion}`);

                            // Extraer solo los ID's en una variable separada
                            const idsUvas = resultado.map(uva => uva.UvaID);

                            mensajesRespuesta.unshift(botResponse.fulfillmentText);

                            mensajesRespuesta.push('Estos son algunos de los tipos de uva que se utilizan en la elaboración de vino español.');

                            // Actualizar estado
                            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_VARIEDADES_DE_UVAS,
                                (parametrosBusqueda.TipoVino) ? parametrosBusqueda.TipoVino : "",
                                (parametrosBusqueda.DO) ? parametrosBusqueda.DO : "",
                                idsUvas,
                                (parametrosBusqueda.busquedaPorCalificacion) ? parametrosBusqueda.busquedaPorCalificacion : "",
                                (parametrosBusqueda.acumularIds == 1) ? parametrosBusqueda.acumularIds : 1,
                                (parametrosBusqueda.variedadUva) ? parametrosBusqueda.variedadUva : "",
                                (parametrosBusqueda.nombreBodega) ? parametrosBusqueda.nombreBodega : "",
                                (parametrosBusqueda.idsBodegas) ? parametrosBusqueda.idsBodegas : "",
                                (parametrosBusqueda.idsDOs) ? parametrosBusqueda.idsDOs : "",
                                (parametrosBusqueda.precioMinimo) ? parametrosBusqueda.precioMinimo : "",
                                (parametrosBusqueda.precioMaximo) ? parametrosBusqueda.precioMaximo : "",
                                (parametrosBusqueda.idsBotellas) ? parametrosBusqueda.idsBotellas : "");
                            return mensajesRespuesta;

                        }
                        else if (parametrosBusqueda.categoria == 'InformacionDO') {   //  DENOMINACIONES

                            const mensajesRespuesta = resultado.map(DO => `<strong>Nombre:</strong> ${DO.Nombre}<br><strong>Descripción:</strong> ${DO.Descripcion}`);

                            // Extraer solo los ID's en una variable separada
                            const idsDOs = resultado.map(DO => DO.DOID);

                            mensajesRespuesta.unshift(botResponse.fulfillmentText);

                            mensajesRespuesta.push('Estas son algunas DOs que se encuentran dentro del territorio español:');


                            // Actualizar estado
                            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_DO,
                                (parametrosBusqueda.TipoVino) ? parametrosBusqueda.TipoVino : "",
                                (parametrosBusqueda.DO) ? parametrosBusqueda.DO : "",
                                (parametrosBusqueda.idsUvas) ? parametrosBusqueda.idsUvas : "",
                                (parametrosBusqueda.busquedaPorCalificacion) ? parametrosBusqueda.busquedaPorCalificacion : "",
                                (parametrosBusqueda.acumularIds == 1) ? parametrosBusqueda.acumularIds : 1,
                                (parametrosBusqueda.variedadUva) ? parametrosBusqueda.variedadUva : "",
                                (parametrosBusqueda.nombreBodega) ? parametrosBusqueda.nombreBodega : "",
                                (parametrosBusqueda.idsBodegas) ? parametrosBusqueda.idsBodegas : "",
                                idsDOs,
                                (parametrosBusqueda.precioMinimo) ? parametrosBusqueda.precioMinimo : "",
                                (parametrosBusqueda.precioMaximo) ? parametrosBusqueda.precioMaximo : "",
                                (parametrosBusqueda.idsBotellas) ? parametrosBusqueda.idsBotellas : "");
                            return mensajesRespuesta;


                        }








                    }

                }
                else {    // No existen busquedas anteriores

                    const mensajesRespuesta = ["No puedo ofrecerte información sobre lo que me estás pidiendo, ya que previamente no has pedido nada, por lo cual no puedo ofrecerte información sin saber el contexto de la situación. Disculpa."];

                    mensajesRespuesta.push("Pero puedes preguntarme sobre algún tipo de vino con el que quieres que te ayude, ya sea para saber más de el o si quieres comprarlo");

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), ADICCION_BUSQUEDA, "", "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                    return mensajesRespuesta;
                }

            }




        }
    }
    else {   // No hay interacciones previas

        if (tipoIntent == RESPUESTA_SALUDO_USUARIO) { // Respuesta saludo usuario
            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), RESPUESTA_SALUDO_USUARIO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado
            return botResponse.fulfillmentText;
        }
        else if (tipoIntent == ASISTENCIA_GENERAL_USOS_CHATVINO) {    // Respuesta asistencia usos Chatvino
            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), ASISTENCIA_GENERAL_USOS_CHATVINO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado
            return botResponse.fulfillmentText;
        }
        else if (tipoIntent == ASISTENCIA_GENERAL_PREGUNTAS_FRECUENTES) { // Respuesta para asistencia a Preguntas Frecuentes
            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), ASISTENCIA_GENERAL_PREGUNTAS_FRECUENTES, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            // Necesito leer el fichero de Preguntas frecuentes

            const contenido = fs.readFileSync('AsistenciaGeneral/PreguntasFrecuentes.txt', 'utf8');
            console.log(contenido);

            const mensajesRespuesta = contenido.split('\n');

            mensajesRespuesta.unshift(botResponse.fulfillmentText);
            mensajesRespuesta.push('Estas son las respuestas sobre asistencia que los usuarios más suelen realizar');

            console.log(mensajesRespuesta);

            return mensajesRespuesta;
        }
        else if (tipoIntent == ASISTENCIA_GENERAL_CONTACTO_Y_SOPORTE) {   // Respuesta contacto y soporte al usuario
            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), ASISTENCIA_GENERAL_CONTACTO_Y_SOPORTE, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            const contenido = fs.readFileSync('AsistenciaGeneral/ContactoYSoporte.txt', 'utf8');
            console.log(contenido);

            const mensajesRespuesta = contenido.split('\n');

            mensajesRespuesta.unshift(botResponse.fulfillmentText);
            mensajesRespuesta.push('Esta es la información para poder contactar con el soporte y asistencia de ChatVino.');

            console.log(mensajesRespuesta);

            return mensajesRespuesta;
        }
        else if (tipoIntent == ADICCION_BUSQUEDA) {   // El usuario quiere más sin haber pedido nada antes

            const mensajesRespuesta = ["No puedo ofrecerte información sobre lo que me estás pidiendo, ya que previamente no has pedido nada, por lo cual no puedo ofrecerte información sin saber el contexto de la situación. Disculpa."];

            mensajesRespuesta.push("Pero puedes preguntarme sobre algún tipo de vino con el que quieres que te ayude, ya sea para saber más de el o si quieres comprarlo");

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), ADICCION_BUSQUEDA, "", "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;

        }
        else if (tipoIntent == AYUDA_ENCONTRAR_BOTELLA) {    // Respuesta ayuda encontrar botella de vino


            // DEBEMOS COMPROBAR QUE TIPO DE VINO NOS ESTA PIDIENDO EL USUARIO
            mensaje = mensaje.toLowerCase();
            const palabrasUsuario2 = mensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras

            // Palabras clave para cada tipo de vino
            const vinoTintoPalabras = ['tinto', 'tintos', 'vino tinto', 'vinos tintos'];
            const vinoBlancoPalabras = ['blanco', 'blancos', 'vino blanco', 'vinos blancos'];
            const vinoDulcePalabras = ['dulce', 'dulces', 'vino dulce', 'vinos dulces'];
            const vinoEspumosoPalabras = ['espumoso', 'espumosos', 'vino espumoso', 'vinos espumosos'];
            const vinoRosadoPalabras = ['rosado', 'rosados', 'vino rosado', 'vinos rosados'];

            let esVinoTinto = vinoTintoPalabras.some(palabra => mensaje.includes(palabra));
            let esVinoBlanco = vinoBlancoPalabras.some(palabra => mensaje.includes(palabra));
            let esVinoDulce = vinoDulcePalabras.some(palabra => mensaje.includes(palabra));
            let esVinoEspumoso = vinoEspumosoPalabras.some(palabra => mensaje.includes(palabra));
            let esVinoRosado = vinoRosadoPalabras.some(palabra => mensaje.includes(palabra));

            let TipoVino = null;

            if (esVinoTinto) {    // VINO TINTO
                TipoVino = 1;
            }
            else if (esVinoBlanco) {    // VINO BLANCO
                TipoVino = 2;
            }
            else if (esVinoDulce) {    // VINO DULCE
                TipoVino = 5;
            }
            else if (esVinoEspumoso) {    // VINO ESPUMOSO
                TipoVino = 4;
            }
            else if (esVinoRosado) {    // VINO ROSADO
                TipoVino = 3;
            }


            console.log('Tipo de vino: ' + TipoVino);



            // VAMOS A COMPROBAR SI EL USUARIO QUIERE INFORMACION SOBRE UNA BOTELLA DE VINO EN ESPECÍFICO


            // Obtener palabras nombres botellas
            const nombresBotellas = await obtenerNombresBotellas();

            let BotellaEncontrada;
            let busquedaPorCalificacion2;
            let menorDistancia3 = Infinity;
            const umbralDistancia4 = 1.5;

            for (const botellaNombre of nombresBotellas) {
                const longitudBotella = botellaNombre.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario2, longitudBotella);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, botellaNombre.toLowerCase());
                    if (distancia < menorDistancia3 && distancia <= umbralDistancia4) {
                        menorDistancia3 = distancia;
                        BotellaEncontrada = botellaNombre;
                    }
                }
            }




            /*
            if(TipoVino == null && !BotellaEncontrada){   // El usuario no introdujo ningun tipo de vino

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Necesitoq que me indiques alguna característica como: Tipo, Región, Precio, Calificación, Año, Uva, Bodega o Maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA_TINTO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;
            }
            */
            if (BotellaEncontrada) {  // El usuario introdujo una botella especifica que buscar

                const botellasResultado = await buscarBotellasPorNombre(BotellaEncontrada);

                console.log('botellas resultado: ' + botellasResultado);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);
                mensajesRespuesta.unshift('Sobre la botella que me has indicado puedo ofrecerte la siguiente información:');
                mensajesRespuesta.push('Espero que te haya sido útil esta infomración. Si quieres saber algo más sólo dímelo!');
                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, "", "", "", "", 1, "", "", "", "", "", "", idsBotellas);   // Actualizar estado
                return mensajesRespuesta;
            }


            // VAMOS A VER SI PREGUNTA POR ALGUNA BOTELLA DE VINO QUE NO ESTE EN BBDD


            // Unir las palabras para formar la frase completa
            const fraseUsuario = palabrasUsuario2.join(' ');

            // Expresión regular para identificar la solicitud de información sobre una botella de vino
            const regex = /(?:dame información sobre|quiero saber sobre|Necesito que me hables sobre|búscame|información de|sobre) (?:la )?botella de vino (.+)/i;

            // Aplicar la expresión regular a la frase del usuario
            const resultado = fraseUsuario.match(regex);

            if (resultado && resultado[1]) {
                // Extraer el nombre de la botella de vino
                const nombreBotella = resultado[1].trim();
                console.log("Nombre de la botella buscada:", nombreBotella);


                // Ahora puedes usar 'await' dentro del bucle
                const completion4 = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: `Dame los siguientes datos sobre esta botella de vino: ${nombreBotella}, los datos que me tienes que dar en siempre en forma de lista, no numerada, son: Nombre:, Año de Cosecha:(dame sólo los 4 dígitos del año), Región:(Sólo la región, nada más), Descripción:(al menos 2 líneas, en la descrición se indica también el tipo de vino: tinto, blanco, rosado, dulce, espumoso), Precio:(sólo dígitos, sin símbolo), Volumen:(numero+ml), Stock:(Dame solo el numero, sin moneda), Tipo Uva:(sólo un tipo), Bodega: y Maridaje: . Sómo me tienes que dar eso, nada más. De forma que lo último que me des sea el maridaje. Esto es muy importante que sólo me des lo que te pido con los nombres que te digo, sin frases de introducción ni despedida.` }
                    ],
                });


                // Guardar el contenido de la respuesta en la variable
                detallesBotellaNuevaGPT = completion4.choices[0].message.content;
                console.log(detallesBotellaNuevaGPT);


                // Dividir la respuesta en líneas y eliminar líneas vacías
                const lineas = detallesBotellaNuevaGPT.trim().split('\n').filter(linea => linea.trim() !== '');

                // Crear un objeto para almacenar los datos
                let datosBotella = {};

                // Extraer los datos de cada línea
                lineas.forEach(linea => {
                    const [clave, valor] = linea.split(':').map(item => item.trim());
                    // Eliminar el guion inicial si existe
                    const claveLimpia = clave.replace('-', '').trim();
                    datosBotella[claveLimpia] = valor;
                });

                console.log(datosBotella);




                // Extraer la descripción del vino y buscar el tipo

                const descripcionVino = datosBotella['Descripción'].toLowerCase();
                const tipoVino = identificarTipoVino(descripcionVino);

                console.log("Tipo de vino identificado:", tipoVino);

                let tipoVinoNuevaBotella;

                switch (tipoVino) {
                    case 'tinto':
                        tipoVinoNuevaBotella = 1;
                        break;
                    case 'blanco':
                        tipoVinoNuevaBotella = 2;
                        break;
                    case 'rosado':
                        tipoVinoNuevaBotella = 3;
                        break;
                    case 'espumoso':
                        tipoVinoNuevaBotella = 4;
                        break;
                    case 'dulce':
                        tipoVinoNuevaBotella = 5;
                        break;
                }

                console.log(tipoVinoNuevaBotella);


                let nombreBodegaBotellaNueva = datosBotella['Bodega'];

                let idBodega = await obtenerIDBodega(nombreBodegaBotellaNueva);

                console.log('ID Bodega botella nueva: ' + idBodega);

                if (idBodega == null) {   // La bodega no existe


                    // La bodega no esta en BBDD, hay que buscar en ChatGPT


                    const completion = await openai.chat.completions.create({
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: `Necesito que me des la siguiente información sobre la bodega: ${nombreBodegaBotellaNueva}. La información que necesito es: Descripción:(al menos 5 líneas de descripción), Región:(Nombre de la región, a secas, no digas nada más ya que sólo quiero el nombre de la región), Año de Fundación:(Sólo el número del año, sin nada más) y Email de Contacto:(te lo puedes inventar). Cabe destacar que esta información debe presentarse siempre en forma de lista(Descripción:.....Región:.....), en un texto, sin enumeraciones, indicando cuál es cada parte(SIEMPRE). Y siempre en el orden indicado.` }
                        ],
                    });

                    // Guardar el contenido de la respuesta en la variable
                    detallesBodegaGPT = completion.choices[0].message.content;
                    console.log('Respuesta bodega: ' + detallesBodegaGPT);

                    // Dividir la respuesta en líneas y eliminar líneas vacías
                    const lineas = detallesBodegaGPT.trim().split('\n').filter(linea => linea.trim() !== '');
                    console.log(lineas);


                    // Crear un objeto para almacenar los datos
                    let datosBodega = {};

                    // Extraer los datos de cada línea
                    lineas.forEach(linea => {
                        const [clave, valor] = linea.split(':').map(item => item.trim());
                        // Eliminar el guion inicial si existe
                        const claveLimpia = clave.replace('-', '').trim();
                        datosBodega[claveLimpia] = valor;
                    });

                    console.log(datosBodega);




                    /*
                    // Dividir la respuesta en secciones
                    const secciones = detallesBodegaGPT.split('\n');

                    // Extraer datos consulta ChatGPT
                    const descripcion = secciones[0].split(': ')[1];
                    console.log(descripcion);
                    const region = secciones[1].split(': ')[1].replace(/\.$/, '');
                    console.log(region);
                    const anoFundacion = secciones[2].split(': ')[1];
                    console.log(anoFundacion);
                    const email = secciones[3].split(': ')[1];
                    console.log(email);
                    */


                    await insertarBodega(nombreBodegaBotellaNueva, datosBodega['Región'], datosBodega['Descripción'], datosBodega['Año de Fundación'], datosBodega['Email de Contacto'])
                        .then(resultados => console.log('Inserción completada:', resultados))
                        .catch(error => console.error('Error al insertar en la base de datos:', error));


                    idBodega = await obtenerIDBodega(nombreBodegaBotellaNueva);

                    console.log(idBodega);

                }

                // En este punto ya tengo el id de la bodega


                // Vamos a mirar ahora el UvaID y el DOID

                // UvaID

                let nombreUva = datosBotella['Tipo Uva'];

                console.log('Uva: ' + nombreUva);

                let idUva = await obtenerIDTipoDeUva(nombreUva);

                console.log('Id uva: ' + idUva);


                if (idUva == null) {  // La uva no existe en BBDD

                    // Debemos preguntar a chatGPT por nuevos tipos

                    const completion = await openai.chat.completions.create({
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: `Necesito que me des la siguiente información sobre el siguiente tipo de uva: ${nombreUva}. La información que necesito en forma de lista es la siguiente: - Características: , - Regíon Predominante: , - Notas de Sabor: y - Descripción: . Es muy importante que lo que te pido me lo des en forma de lista no numerada, de la forma en la que te he dicho, con frases completas, sin frases introductorias y frases de cierre.` }
                        ],
                    });


                    // Guardar el contenido de la respuesta en la variable
                    detallesUvaGPT = completion.choices[0].message.content;
                    console.log(detallesUvaGPT);

                    // Dividir la respuesta en secciones
                    const secciones = detallesUvaGPT.split('\n\n');


                    // Extraer datos consulta ChatGPT
                    const caracteristicas = secciones[0].split(': ')[1];
                    console.log(caracteristicas);
                    const region = secciones[1].split(': ')[1].replace(/\.$/, '');
                    console.log(region);
                    const notasDeSabor = secciones[2].split(': ')[1];
                    console.log(notasDeSabor);
                    const descripcion = secciones[3].split(': ')[1];
                    console.log(descripcion);


                    await insertarTipoDeUva(nombreUva, caracteristicas, region, notasDeSabor, descripcion)
                        .then(resultados => console.log('Inserción completada:', resultados))
                        .catch(error => console.error('Error al insertar en la base de datos:', error));

                    idUva = await obtenerIDTipoDeUva(nombreUva);

                }


                // DOID

                let nombreDO = datosBotella['Región'];

                console.log('DO: ' + nombreDO);

                let idDO = await obtenerIDDO(nombreDO);


                if(idDO == null){   // DO no existe en BBDD

                // Debemos preguntar a chatGPT por la nueva DO

                const completion = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [
                        { role: "system", content: "You are a helpful assistant." },
                        { role: "user", content: `Necesito que me des la siguiente información sobre la Denominación de Orgien: ${nombreDO}. La información que necesito es: Descripción: (Descripción: Al menos 3 líneas de descripción). Tiene que venir siempre de esta forma: Descripción:......` }
                    ],
                });


                // Guardar el contenido de la respuesta en la variable
                detallesDO = completion.choices[0].message.content;
                console.log(detallesDO);

                // Extraer datos consulta ChatGPT
                const descripcion = detallesDO.split(': ')[1];

                console.log(descripcion);


                await insertarDO(nombreDO, descripcion)
                    .then(resultados => console.log('Inserción completada:', resultados))
                    .catch(error => console.error('Error al insertar en la base de datos:', error));


                idDO = await obtenerIDDO(nombreDO);

                }

                console.log('IDDO: '+idDO);

                
                // Ya tengo todos los datos suficientes, lo que tengo que hacer es insertar la nueva botella

                await insertarBotellaBBDD(datosBotella['Nombre'], datosBotella['Año de Cosecha'], datosBotella['Región'], datosBotella['Descripción'], 
                datosBotella['Precio'], datosBotella['Volumen'].toString(), datosBotella['Stock'], datosBotella['Tipo Uva'], null, 0, idUva, tipoVinoNuevaBotella, 
                idDO, idBodega, datosBotella['Maridaje'])
                    .then(resultados => console.log('Inserción completada:', resultados))
                    .catch(error => console.error('Error al insertar en la base de datos:', error));



                const botellasResultado = await buscarBotellasPorNombre(datosBotella['Nombre']);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                    // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Claro! Puedo darte información sobre esto, aquí tienes:');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, "", "", "", "", 1, "", "", "", "", "", "", idsBotellas, "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;


                // Aquí puedes continuar con tu lógica para buscar la botella en tu base de datos
            } else {
                console.log("No se pudo identificar una solicitud de información sobre una botella de vino.");
            }



            // DEBEMOS COMPROBAR SI NOS INTRODUJO DO (denominacion de origen)
            mensaje = mensaje.toLowerCase();
            const palabrasUsuario = mensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras


            // VAMOS A COMPROBAR DO


            // Obtener palabras clave de DO de la base de datos
            const palabrasClaveDO = await obtenerPalabrasClaveDO();

            let DOEncontrada;
            let busquedaPorCalificacion;
            let menorDistancia = Infinity;
            const umbralDistancia = 1.5;

            for (const doNombre of palabrasClaveDO) {
                const longitudDO = doNombre.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudDO);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, doNombre.toLowerCase());
                    if (distancia < menorDistancia && distancia <= umbralDistancia) {
                        menorDistancia = distancia;
                        DOEncontrada = doNombre;
                    }
                }
            }


            // VAMOS A COMPROBAR EL TIPO DE UVA


            // Obtener palabras clave de Tipo Uva de la base de datos
            const palabrasClaveTipoUva = await obtenerPalabrasClaveTipoUva();

            let TipoUvaEncontrada;
            let menorDistancia2 = Infinity;
            const umbralDistancia2 = 1.5;

            for (const tipoUvaNombre of palabrasClaveTipoUva) {
                const longitudTipoUva = tipoUvaNombre.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudTipoUva);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, tipoUvaNombre.toLowerCase());
                    if (distancia < menorDistancia2 && distancia <= umbralDistancia2) {
                        menorDistancia2 = distancia;
                        TipoUvaEncontrada = tipoUvaNombre;
                    }
                }
            }


            // VAMOS A COMPROBAR PRECIO

            const { precioMinimo, precioMaximo } = extraerRangoDePrecios(mensaje);

            console.log('precio minimo: ' + precioMinimo);
            console.log('precio maximo: ' + precioMaximo);



            // VAMOS A COMPROBAR BODEGA

            // Obtener nombres de bodegas en BBDD
            const nombresBodegas = await obtenerNombresBodegas();


            let nombreBodegaEncontrado;
            menorDistancia = Infinity;
            const umbralDistancia3 = 1.5;

            for (const nombreBodega of nombresBodegas) {
                const longitudTipoUva = nombreBodega.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudTipoUva);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, nombreBodega.toLowerCase());
                    if (distancia < menorDistancia && distancia <= umbralDistancia3) {
                        menorDistancia = distancia;
                        nombreBodegaEncontrado = nombreBodega;
                    }
                }
            }


            // VAMOS A COMPROBAR SI EL USUARIO INDICA UN AÑO

            // Actualizar lógica para comparar secuencias de palabras
            function contieneSecuencia(palabras, frase) {
                const secuencia = frase.split(' '); // Dividir la frase en palabras
                for (let i = 0; i <= palabras.length - secuencia.length; i++) {
                    if (secuencia.every((palabra, index) => palabras[i + index] === palabra)) {
                        return true;
                    }
                }
                return false;
            }

            // Palabras clave actualizadas para la preferencia del año
            const palabrasInicioAno = ["después de", "a partir de", "siguiendo", "posterior a"];
            const palabrasFinAno = ["antes de", "hasta", "no más tarde de", "anterior a"];
            const palabrasExactoAno = ["en", "del año", "de", "igual a", "sea en"];

            let anoPreferencia = null;
            let tipoPreferenciaAno = null;

            const regexAno = /\b(19|20)\d{2}\b/;
            const resultadoAno = mensaje.match(regexAno);
            let anoEncontrado = resultadoAno ? parseInt(resultadoAno[0]) : null;
            console.log('Año Encontrado:', anoEncontrado);

            if (anoEncontrado) {
                const palabrasMensaje = mensaje.split(/\s+/);
                const indicePalabraAno = palabrasMensaje.findIndex(p => p.includes(anoEncontrado.toString()));
                console.log('Índice Palabra Año:', indicePalabraAno);

                const palabrasAntesDelAño = palabrasMensaje.slice(Math.max(0, indicePalabraAno - 10), indicePalabraAno);
                const palabrasDespuesDelAño = palabrasMensaje.slice(indicePalabraAno, indicePalabraAno + 10);

                if (palabrasInicioAno.some(frase => contieneSecuencia(palabrasAntesDelAño, frase)) || palabrasInicioAno.some(frase => contieneSecuencia(palabrasDespuesDelAño, frase))) {
                    tipoPreferenciaAno = 'inicio';
                } else if (palabrasFinAno.some(frase => contieneSecuencia(palabrasAntesDelAño, frase)) || palabrasFinAno.some(frase => contieneSecuencia(palabrasDespuesDelAño, frase))) {
                    tipoPreferenciaAno = 'fin';
                } else if (palabrasExactoAno.some(frase => contieneSecuencia(palabrasAntesDelAño, frase)) || palabrasExactoAno.some(frase => contieneSecuencia(palabrasDespuesDelAño, frase))) {
                    tipoPreferenciaAno = 'exacto';
                }
            }

            anoPreferencia = tipoPreferenciaAno ? { tipo: tipoPreferenciaAno, valor: anoEncontrado } : null;

            console.log('Preferencia de Año:', anoPreferencia);






            // VAMOS A COMPROBAR SI EL USUARIO INDICA ALGUN TIPO DE CALIFICACION


            // Patrones para diferentes tipos de consultas sobre calificaciones
            const patronesMejores = ["las más altas calificaciones", "top calificados", "mejor valorados",
                "con las mejores puntuaciones", "las más recomendadas", "los vinos mejor calificados", "máxima puntuación",
                "con altas valoraciones", "los más apreciados", "puntuaciones más altas", "mejor valoradas", "mejores notas",
                "mejores puntuaciones", "mejores"];

            const patronesPeores = ["las más bajas calificaciones", "menos valorados", "peor calificados",
                "con las peores puntuaciones", "las menos recomendadas", "los vinos peor calificados", "mínima puntuación",
                "con bajas valoraciones", "los menos apreciados", "puntuaciones más bajas", "peror valoradas", , "perores notas",
                "perores puntuaciones", "peores"];

            const patronesIgualA = [, "calificación sea igual a", "exactamente calificados como", "puntuación exacta de", "calificación precisa de",
                "valorados exactamente en", "con una puntuación de", "exactamente con", "calificados igual a",
                "con calificación de", "iguales en puntuación a", "valoración idéntica a", "calificación igual a", "calificación de", "calificación =",
                "puntuación igual", "nota igual", "calificación igual"];

            const patronesSuperiorA = ["calificación por encima de", "calificación sea mayor que", "calificación sea mayor a", "más altos que", "valorados por encima de",
                "superiores en calificación a", "con puntuación mayor que", "mejor que", "sobrepasan", "calificados más alto que",
                "por encima de la calificación de", "superan", "calificación mayor", "puntuación mayor", "nota superior", "superior a", "nota superior"];

            const patronesInferiorA = ["calificación por debajo de", "menos que", "valorados por debajo de",
                "inferiores en calificación a", "con puntuación menor que", "peor que", "no alcanzan", "calificados más bajo que",
                "por debajo de la calificación de", "no superan", "calificación menor", "puntuación menor", "nota inferior", "inferior a"];


            let consultaCalificacion = null;
            const regexNumero = /\b\d+(\.\d+)?\b/;

            // Función para verificar si alguna frase del array está en el mensaje
            const contieneFrase = (frases, mensaje) => {
                return frases.some(frase => mensaje.includes(frase));
            };

            // Función para extraer el valor numérico de la calificación
            const extraerValorCalificacion = (mensaje, frases) => {
                for (const frase of frases) {
                    if (mensaje.includes(frase)) {
                        const indiceFrase = mensaje.indexOf(frase) + frase.length;
                        const mensajeRestante = mensaje.substring(indiceFrase);
                        const resultado = mensajeRestante.match(regexNumero);
                        if (resultado) {
                            return parseFloat(resultado[0]);
                        }
                    }
                }
                return null;
            };

            // Procesar el tipo de consulta sobre calificaciones
            if (contieneFrase(patronesMejores, mensaje)) {
                consultaCalificacion = { tipo: "mejores" };
            } else if (contieneFrase(patronesPeores, mensaje)) {
                consultaCalificacion = { tipo: "peores" };
            } else if (contieneFrase(patronesIgualA, mensaje)) {
                consultaCalificacion = { tipo: "igualesA", valor: extraerValorCalificacion(mensaje, patronesIgualA) };
            } else if (contieneFrase(patronesSuperiorA, mensaje)) {
                consultaCalificacion = { tipo: "superioresA", valor: extraerValorCalificacion(mensaje, patronesSuperiorA) };
            } else if (contieneFrase(patronesInferiorA, mensaje)) {
                consultaCalificacion = { tipo: "inferioresA", valor: extraerValorCalificacion(mensaje, patronesInferiorA) };
            }

            console.log('Consulta sobre Calificación:', consultaCalificacion);




            // VAMOS AHORA A COMPROBAR MARIDAJE

            // Obtener palabras clave de Maridaje de la base de datos
            const palabrasClaveMaridaje = await obtenerPalabrasClaveMaridaje();

            let MaridajeEncontrado;
            let menorDistanciaMaridaje = Infinity;
            const umbralDistanciaMaridaje = 1.5;

            for (const maridajeNombre of palabrasClaveMaridaje) {
                const longitudMaridaje = maridajeNombre.split(/\s+/).length;
                const combinacionesUsuarioMaridaje = crearCombinacionesDePalabras(palabrasUsuario, longitudMaridaje);

                for (const combinacionUsuario of combinacionesUsuarioMaridaje) {
                    const distancia = levenshtein(combinacionUsuario, maridajeNombre.toLowerCase());
                    if (distancia < menorDistanciaMaridaje && distancia <= umbralDistanciaMaridaje) {
                        menorDistanciaMaridaje = distancia;
                        MaridajeEncontrado = maridajeNombre;
                    }
                }
            }

            console.log('Maridaje Encontrado:', MaridajeEncontrado);












            if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && anoPreferencia && consultaCalificacion && MaridajeEncontrado) {    // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo, nombre de bodega, anyo, califiacion y maridaje

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoIgualConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {   // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoDespuesConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoAntesConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor, MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && anoPreferencia && MaridajeEncontrado) {   // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo, nombre de bodega, anyo y maridaje

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoIgualConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, MaridajeEncontrado, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoDespuesConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, MaridajeEncontrado, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoAntesConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, MaridajeEncontrado, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor, "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && consultaCalificacion && MaridajeEncontrado) { // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo, nombre de bodega, califiacion y maridaje

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);


                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = await buscarBotellasPorCriteriosConBodegaDOYUvaConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor, MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && anoPreferencia && consultaCalificacion) {  // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo, nombre de bodega, anyo y califiacion

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoIgualConCalificacion(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {   // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoDespuesConCalificacion(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoAntesConCalificacion(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && MaridajeEncontrado) {     // Introdujo DO, tipo de uva, precio minimo, maximo, bodega y maridaje

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);


                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                let botellasResultado = await buscarBotellasPorCriteriosConBodegaDOYUvaConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );



                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && consultaCalificacion) {     // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo, nombre de bodega y calificacion

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);


                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = await buscarBotellasPorCriteriosConBodegaDOYUvaConCalificacion(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && anoPreferencia && consultaCalificacion) {   // Usuario introdujo DO, tipo de uva, precio minimo, precio maximo, fecha y calificacion

                console.log("entramos al nuevo");
                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConAnyoIgualConDOYUvaMinimoYMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {   // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConAnyoDespuesConDOYUvaMinimoYMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConAnyoAntesConDOYUvaMinimoYMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }




                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado && anoPreferencia) {      // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo, nombre de bodega y anyo

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, idBodega, anoPreferencia.valor, precioMinimo, precioMaximo, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && MaridajeEncontrado) {       // Introdujo DO, tipo de uva, precio minimo, precio maximo y maridaje

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaMinimoYMaximoConMaridaje(idTipoUva, TipoVino, DOEncontrada, precioMinimo, precioMaximo, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, precioMaximo, idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && consultaCalificacion) {     // Introdujo DO, tipo de uva, precio minimo, precio maximo y calificacion

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaMinimoYMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, precioMinimo, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, precioMaximo, idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && anoPreferencia) {   // Introdujo DO, tipo de uva, precio minimo, precio maximo y anyo

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConAmbosPreciosYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConAmbosPreciosYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConAmbosPreciosYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, precioMaximo, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo && nombreBodegaEncontrado) {    // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo y nombre de bodega
                // Debemos buscar en la BBDD las botellas con estas caracteristicas


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosConIdBodega(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && MaridajeEncontrado) {   // Usuario introdujo DO, tipo de uva, precio minimo y maridaje


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaMinimoConMaridaje(idTipoUva, TipoVino, DOEncontrada, precioMinimo, MaridajeEncontrado, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMaximo && MaridajeEncontrado) {   // Usuario introdujo DO, tipo de uva, precio maximo y maridaje

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaMaximoConMaridaje(idTipoUva, TipoVino, DOEncontrada, precioMaximo, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", precioMaximo, idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && consultaCalificacion && MaridajeEncontrado) {   // Usuario introdujo DO, tipo de uva, calificacion y maridaje

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor, MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && consultaCalificacion) { // Usuario introdujo DO, tipo de uva, precio minimo y calificacion

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaMinimoConCalificacion(idTipoUva, TipoVino, DOEncontrada, precioMinimo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, "", idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMaximo && consultaCalificacion) { // Usuario introdujo DO, tipo de uva, precio maximo y calificacion

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                botellasResultado = await buscarBotellasPorCriteriosConConDOYUvaMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, precioMaximo, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", precioMaximo, idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && TipoUvaEncontrada && anoPreferencia && consultaCalificacion) {   // Usuario introdujo DO, tipo de uva, fecha cosecha y calificacion

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConDOYUvaConAnyoIgualConCalificacion(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConDOYUvaConAnyoDespuesConCalificacion(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConDOYUvaConAnyoAntesConCalificacion(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && anoPreferencia) {       // Usuario introdujo DO, tipo de uva, precio minimo y anyo

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConPrecioMinimoYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConPrecioMinimoYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConPrecioMinimoYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMinimo, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMaximo && anoPreferencia) {

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConPrecioMaximoYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConPrecioMaximoYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConPrecioMaximoYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, precioMaximo, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && nombreBodegaEncontrado) {   // Usuario introdujo DO, tipo de uva, precio minimo y nombre bodega

                // Debemos buscar en la BBDD las botellas con estas caracteristicas


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                // Buscar botellas con estos criterios

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYMinimo(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", precioMinimo, "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMaximo && nombreBodegaEncontrado) {

                // Debemos buscar en la BBDD las botellas con estas caracteristicas


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosConIdBodegaYMaximo(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMaximo, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", "", precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo && precioMaximo) {      // Usuario introdujo DO, tipo de uva, precio minimo y precio maximo

                // El usuario introdujo tanto precio minimo como precio maximo

                // Debemos buscar en la BBDD las botellas con estas caracteristicas


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);


                // Ahora debemos buscar las botellas con esas caracteristicas


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriterios(idTipoUva, TipoVino, DOEncontrada, precioMinimo, precioMaximo, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && MaridajeEncontrado) {       // Usuario introdujo DO, tipo de uva y maridaje

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosConDOYUvaConMaridaje(idTipoUva, TipoVino, DOEncontrada, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && precioMinimo && MaridajeEncontrado) {        // Usuario introdujo DO, precio mínimo y maridaje

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosDOYMinimoConMaridaje(DOEncontrada, TipoVino, precioMinimo, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", precioMinimo, "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && precioMaximo && MaridajeEncontrado) {    // Usuario introdujo DO, precio maximo y maridaje

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosDOYMaximoConMaridaje(DOEncontrada, TipoVino, precioMaximo, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", precioMaximo, idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (TipoUvaEncontrada && precioMinimo && MaridajeEncontrado) {   // Usuario introdujo Tipo de uva, precio minimo y maridaje

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosUvaYMinimoConMaridaje(idTipoUva, TipoVino, precioMinimo, MaridajeEncontrado, idsExcluir);



                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (TipoUvaEncontrada && precioMaximo && MaridajeEncontrado) {   // Usuario introdujo Tipo de uva, precio maximo y maridaje

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosUvaYMaximoConMaridaje(idTipoUva, TipoVino, precioMaximo, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", "", precioMaximo, idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (TipoUvaEncontrada && consultaCalificacion && MaridajeEncontrado) {   // Usuario introdujo Tipo de uva, calificacion y maridaje


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosConUvaConCalificacionConMaridaje(idTipoUva, TipoVino, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);



                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", "", "", "", "", "", consultaCalificacion.tipo, consultaCalificacion.valor, MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && anoPreferencia && MaridajeEncontrado) {      // Usuario introdujo DO, anyo y maridaje


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);


                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConDOYAnyoIgualConMaridaje(DOEncontrada, TipoVino, anoPreferencia.valor, MaridajeEncontrado, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConDOYAnyoDespuesConMaridaje(DOEncontrada, TipoVino, anoPreferencia.valor, MaridajeEncontrado, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConDOYAnyoAntesConMaridaje(DOEncontrada, TipoVino, anoPreferencia.valor, MaridajeEncontrado, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor, "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && consultaCalificacion && MaridajeEncontrado) {    // Usuario introdujo DO, calificacion y maridaje

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosConDOYUvaConCalificacionConMaridaje(DOEncontrada, TipoVino, MaridajeEncontrado, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", "", idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor, MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && consultaCalificacion) {     // Usuario introdujo DO, tipo de uva y calificacion

                // Debemos buscar en la BBDD las botellas con estas caracteristicas


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosConDOYUvaConCalificacion(idTipoUva, TipoVino, DOEncontrada, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);



                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;




            }
            else if (DOEncontrada && TipoUvaEncontrada && anoPreferencia) {   // Usuario introdujo DO, tipo de uva y anyo

                // En este punto el usuario solo introdujo el precio minimo de la botella

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                // Ahora debemos buscar las botellas con esas caracteristicas


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);


                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConDOTipoUvaYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConDOTipoUvaYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConDOTipoUvaYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, anoPreferencia.valor, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (nombreBodegaEncontrado && precioMinimo && consultaCalificacion) {    // Usuario introduce bodega, precio minimo y calificación

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                let botellasResultado = await buscarBotellasPorCriteriosConBodegaConMinimoConCalificacion(idBodega, precioMinimo, TipoVino, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", precioMinimo, "", idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (nombreBodegaEncontrado && precioMaximo && consultaCalificacion) {    // Usuario introdujo DO, precio maximo y calificación

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = await buscarBotellasPorCriteriosConBodegaConMaximoConCalificacion(idBodega, precioMaximo, TipoVino, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", precioMaximo, idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && precioMinimo && anoPreferencia) {        // Introdujo DO, precio minimo y fecha cosecha

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConDOPrecioMinimoFechaIgual(DOEncontrada, TipoVino, precioMinimo, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConDOPrecioMinimoFechaDespues(DOEncontrada, TipoVino, precioMinimo, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConDOPrecioMinimoFechaAntes(DOEncontrada, TipoVino, precioMinimo, anoPreferencia.valor, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", precioMinimo, "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && precioMaximo && anoPreferencia) {        // Usuario introdujo DO, precio maximo, fecha de cosecha

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosConDOPrecioMaximoFechaIgual(DOEncontrada, TipoVino, precioMaximo, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosConDOPrecioMaximoFechaDespues(DOEncontrada, TipoVino, precioMaximo, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosConDOPrecioMaximoFechaAntes(DOEncontrada, TipoVino, precioMaximo, anoPreferencia.valor, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMinimo) {     // Usuario introdujo DO, tipo de uva, precio minimo

                // En este punto el usuario solo introdujo el precio minimo de la botella

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                // Ahora debemos buscar las botellas con esas caracteristicas


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosPrecioMinimo(idTipoUva, TipoVino, DOEncontrada, precioMinimo, idsExcluir);

                console.log('botellas resultado: ' + botellasResultado);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, "", idsBotellas);   // Actualizar estado


                return mensajesRespuesta;
            }
            else if (DOEncontrada && TipoUvaEncontrada && precioMaximo) {     // Usuario introdujo DO, tipo de uva, precio maximo


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                // Ahora debemos buscar las botellas con esas caracteristicas


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosPrecioMaximo(idTipoUva, TipoVino, DOEncontrada, precioMaximo, idsExcluir);

                console.log('botellas resultado: ' + botellasResultado);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (DOEncontrada && TipoUvaEncontrada && nombreBodegaEncontrado) {   // Introdujo DO, tipo de uva y nombre de bodega

                // Debemos buscar en la BBDD las botellas con estas caracteristicas


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                console.log('ID del tipo de uva: ' + idTipoUva);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosTipoUvaYDOYBodega(idTipoUva, TipoVino, DOEncontrada, idBodega, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", "", "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (nombreBodegaEncontrado && precioMinimo && anoPreferencia) {  // Introdujo bodega, precio minimo y fecha cosecha

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);


                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosBodegaMinimoYFechaIgual(idBodega, TipoVino, anoPreferencia.valor, precioMinimo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosBodegaMinimoYFechaDespues(idBodega, TipoVino, anoPreferencia.valor, precioMinimo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosBodegaMinimoYFechaAntes(idBodega, TipoVino, anoPreferencia.valor, precioMinimo, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", precioMinimo, "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (nombreBodegaEncontrado && precioMaximo && anoPreferencia) {      // Introdujo bodega, precio maximo y fecha de cosecha

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosBodegaMaximaYFechaIgual(idBodega, TipoVino, anoPreferencia.valor, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosBodegaMaximaYFechaDespues(idBodega, TipoVino, anoPreferencia.valor, precioMaximo, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosBodegaMaximaYFechaAntes(idBodega, TipoVino, anoPreferencia.valor, precioMaximo, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", precioMaximo, idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && MaridajeEncontrado) {    // El usuario introdujo DO y maridaje


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosConDOConMaridaje(DOEncontrada, TipoVino, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (TipoUvaEncontrada && MaridajeEncontrado) {       // El usuario introdujo tipo de uva y maridaje


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosConUvaConMaridaje(idTipoUva, TipoVino, MaridajeEncontrado, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (nombreBodegaEncontrado && consultaCalificacion) {    // El usuario introdujo nombre de bodega y calificacion

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);


                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = await buscarBotellasPorCriteriosConBodegaConCalificacion(idBodega, TipoVino, consultaCalificacion.tipo, consultaCalificacion.valor, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", "", idsBotellas, "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (nombreBodegaEncontrado && MaridajeEncontrado) {  // Usuario introduce bodega y maridaje

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                const botellasResultado = await buscarBotellasPorCriteriosBodegaYMaridaje(idBodega, TipoVino, MaridajeEncontrado, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", "", idsBotellas, "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && anoPreferencia) {

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosDOYFechaIgual(DOEncontrada, TipoVino, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosDOYFechaDespues(DOEncontrada, TipoVino, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosDOYFechaAntes(DOEncontrada, TipoVino, anoPreferencia.valor, idsExcluir);
                }


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (nombreBodegaEncontrado && anoPreferencia) {        // Introdujo bodega y anyo de cosecha

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosBodegaYFechaIgual(idBodega, TipoVino, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosBodegaYFechaDespues(idBodega, TipoVino, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosBodegaYFechaAntes(idBodega, TipoVino, anoPreferencia.valor, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (TipoUvaEncontrada && anoPreferencia) {       // Introdujo tipo de uva y fecha de cosecha

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);


                let botellasResultado = null;

                console.log(anoPreferencia.valor);

                if (anoPreferencia.tipo == 'exacto') {        // cosecha igual
                    botellasResultado = await buscarBotellasPorCriteriosTipoUvaYFechaIgual(idTipoUva, TipoVino, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'inicio') {      // cosecha despues
                    botellasResultado = await buscarBotellasPorCriteriosTipoUvaYFechaDespues(idTipoUva, TipoVino, anoPreferencia.valor, idsExcluir);
                }
                else if (anoPreferencia.tipo == 'fin') {      // cosecha antes
                    botellasResultado = await buscarBotellasPorCriteriosTipoUvaYFechaAntes(idTipoUva, TipoVino, anoPreferencia.valor, idsExcluir);
                }

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );


                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas, anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;




            }
            else if (nombreBodegaEncontrado && precioMinimo) {        // Introdujo bodega y precio minimo

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosBodegaYMinimo(idBodega, TipoVino, precioMinimo, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", precioMinimo, "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (nombreBodegaEncontrado && precioMaximo) {    // Introdujo bodega y precio máximo

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                console.log('ID de la bodega es: ' + idBodega);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosBodegaYMaximo(idBodega, TipoVino, precioMaximo, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);


                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (DOEncontrada && precioMinimo) {      // Introdujo DO y Precio Mínimo

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosDOYMinimo(DOEncontrada, TipoVino, precioMinimo, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", precioMinimo, "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && precioMaximo) {      // Introdujo DO y Precio Maximo

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosDOYMaximo(DOEncontrada, TipoVino, precioMaximo, idsExcluir);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, "", "", "", "", "", precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (TipoUvaEncontrada && precioMinimo) {     // Introdujo Tipo de uva y precio minimo

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosTipoUvaYMinimo(idTipoUva, TipoVino, precioMinimo, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", precioMinimo, "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;



            }
            else if (TipoUvaEncontrada && precioMaximo) {     // Introdujo tipo de uva y precio maximo

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosTipoUvaYMaximo(idTipoUva, TipoVino, precioMaximo, idsExcluir);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, "", "", "", "", precioMaximo, idsBotellas);   // Actualizar estado

                return mensajesRespuesta;


            }
            else if (DOEncontrada && TipoUvaEncontrada) {     // Introdujo DO y Tipo de Uva


                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosTipoUvaYDO(idTipoUva, TipoVino, DOEncontrada, idsExcluir);

                console.log('botellas resultado: ' + botellasResultado);


                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 1, TipoUvaEncontrada, "", "", "", "", "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (TipoUvaEncontrada && nombreBodegaEncontrado) {       // Introdujo Tipo de uva y bodega

                // Buscar uvaID
                const idTipoUva = await obtenerIDTipoDeUva(TipoUvaEncontrada);

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosTipoUvaYBodega(idTipoUva, TipoVino, idBodega, idsExcluir);

                console.log('botellas resultado: ' + botellasResultado);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, TipoUvaEncontrada, nombreBodegaEncontrado, "", "", "", "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (nombreBodegaEncontrado) {        // Introdujo solo Bodega

                // Buscar BodeID
                const idBodega = await obtenerIDBodega(nombreBodegaEncontrado);

                const userId = obtenerUserIDDeSessionActual();
                const idsExcluir = obtenerIdsBotellasRecientesDeEstadoUsuario(userId);

                const botellasResultado = await buscarBotellasPorCriteriosBodega(idBodega, TipoVino, idsExcluir);

                console.log('botellas resultado: ' + botellasResultado);

                const mensajesRespuesta = botellasResultado.map(botella =>
                    `<strong>Nombre:</strong> ${botella.Nombre}<br>` +
                    `<strong>Descripción:</strong> ${botella.Descripcion}<br>` +
                    `<strong>Región:</strong> "${botella.Region}"<br>` +
                    `<strong>Precio:</strong> ${botella.Precio}€<br>` +
                    `<strong>Año Cosecha:</strong> ${botella.AnoCosecha}<br>` +
                    `<strong>Volumen:</strong> ${botella.Volumen}<br>` +
                    `<strong>Stock:</strong> ${botella.Stock}<br>` +
                    `<strong>Calificación:</strong> ${botella.Calificacion}<br>` +
                    `<strong>Maridaje:</strong> ${botella.Maridaje}<br>`
                );

                // Extraer solo los ID's en una variable separada
                const idsBotellas = botellasResultado.map(botella => botella.BotellaID);

                mensajesRespuesta.unshift('Puedo ofrecerte los siguientes resultados basados en las indicaciones que me has dado:');

                mensajesRespuesta.push('Estos son algunos de los vinos que he encontrado con lo que me has dicho');


                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 1, "", nombreBodegaEncontrado, "", "", "", "", idsBotellas);   // Actualizar estado

                return mensajesRespuesta;

            }









            //---------------------------------------------------------------------------------------
            // NECESITO PREGUNTARLE AL USUARIO POR MÁS INFORMACION
            //---------------------------------------------------------------------------------------







            else if (precioMinimo && MaridajeEncontrado) {  // Usuario introdujo precio minimo y maridaje

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas.....");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", precioMinimo, "", "", "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (precioMaximo && MaridajeEncontrado) {  // Usuario introdujo precio maximo y maridaje

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas....");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", precioMaximo, "", "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (anoPreferencia && MaridajeEncontrado) {      // Usuario introduje fecha cosecha y maridaje

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas.....");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "", anoPreferencia.tipo, anoPreferencia.valor, "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (consultaCalificacion && MaridajeEncontrado) {    // Usuario solo introdujo calificacion y maridaje

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "", "", "", consultaCalificacion.tipo, consultaCalificacion.valor, MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (anoPreferencia && consultaCalificacion) {    // Usuario solo introdujo fecha cosecha y calificacion

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "", anoPreferencia.tipo, anoPreferencia.valor, consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (DOEncontrada && consultaCalificacion) {  // Usuario solo introdujo DO y calificacion

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como precio, tipo de uva, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 0, "", "", "", "", "", "", "", "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (TipoUvaEncontrada && consultaCalificacion) {

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como precio, tipo de uva, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, TipoUvaEncontrada, "", "", "", "", "", "", "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (precioMinimo && anoPreferencia) {    // Usuario solo introdujo precio minimo y fecha de cosecha

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", precioMinimo, "", "", anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (precioMaximo && anoPreferencia) {    // Usuario solo introdujo precio maximo y fecha de cosecha

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", precioMaximo, "", anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (precioMinimo && precioMaximo) {      // Usuario solo introdujo rango de precio

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", precioMinimo, precioMaximo, "");   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (MaridajeEncontrado) {    // Usuario solo introdujo maridaje

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, fecha de cosecha, precios, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "", "", "", "", "", MaridajeEncontrado);   // Actualizar estado

                return mensajesRespuesta;

            }
            else if (consultaCalificacion) {  // Usuario solo introdujo calificacion

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, fecha de cosecha, precios, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "", "", "", consultaCalificacion.tipo, consultaCalificacion.valor);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (anoPreferencia) {        // Usuario solo introdujo fecha de cosecha

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, precios, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "", anoPreferencia.tipo, anoPreferencia.valor);   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (precioMinimo) {      // Usuario solo introdujo Precio minimo

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                console.log('solo introdujo minimo');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", precioMinimo, "", "");   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (precioMaximo) {      // Usuario solo introdujo Precio maximo

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como denominación de origen, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                console.log('solo introdujo maximo');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", precioMaximo, "");   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (DOEncontrada) {   // Usuario solo introdujo DO

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como precio, tipo de uva, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, DOEncontrada, "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (TipoUvaEncontrada) {     // Usuario solo introdujo Tipo de Uva

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como precio, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, TipoUvaEncontrada, "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;
            }
            else if (TipoVino) {  // Usuario solo introdujo el Tipo de vino

                const mensajesRespuesta = [botResponse.fulfillmentText];

                switch (TipoVino) {

                    case 1:     // TINTO
                        mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más del vino tinto que quieres, como precio, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");
                        break;
                    case 2:     // BLANCO
                        mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más del vino blanco que quieres, como precio, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");
                        break;
                    case 3:     // ROSADO
                        mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más del vino rosado que quieres, como precio, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");
                        break;
                    case 4:     // ESPUMOSO
                        mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más del vino espumoso que quieres, como precio, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");
                        break;
                    case 5:     // DULCE
                        mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más del vino dulce que quieres, como precio, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");
                        break
                }

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;


            }
            else {   // El usuario no introdujo nada

                const mensajesRespuesta = [botResponse.fulfillmentText];

                mensajesRespuesta.push("Puedes indicarme si quieres alguna característica más, como tipo de vino, precio, tipo de uva, denominación de origen, calificación, año de cosecha, bodegas o maridaje.");

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), AYUDA_ENCONTRAR_BOTELLA, TipoVino, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;
            }
            return botResponse.fulfillmentText;
        }
        else if (tipoIntent == INFORMACION_VARIEDADES_DE_UVAS) {    // Informacion sobre variedad de uva

            // DEBEMOS COMPROBAR SI NOS INTRODUJO VARIEDAD DE UVA ESPECIFICA
            const copMensaje = mensaje;
            mensaje = mensaje.toLowerCase();
            const palabrasUsuario = mensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras

            // Obtener palabras clave de Tipo Uva de la base de datos
            const palabrasClaveTipoUva = await obtenerPalabrasClaveTipoUva();

            let TipoUvaEncontrada;
            let busquedaPorCalificacion;
            let menorDistancia = Infinity;
            const umbralDistancia = 2.5;

            for (const tipoUvaNombre of palabrasClaveTipoUva) {
                const longitudTipoUva = tipoUvaNombre.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudTipoUva);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, tipoUvaNombre.toLowerCase());
                    if (distancia < menorDistancia && distancia <= umbralDistancia) {
                        menorDistancia = distancia;
                        TipoUvaEncontrada = tipoUvaNombre;
                    }
                }
            }
            if (TipoUvaEncontrada) {   // Usuario introdujo Tipo Uva existente en BBDD

                // Encontrar en BBDD ese tipo de uva y obtener info

                // Obtener info del tipo de uva
                const palabrasClaveTipoUva = await obtenerDescripcionTipoUva(TipoUvaEncontrada);

                console.log(palabrasClaveTipoUva);

                const mensajesRespuesta = [palabrasClaveTipoUva];

                mensajesRespuesta.unshift(botResponse.fulfillmentText);
                mensajesRespuesta.push('Esta es la información que tengo sobre el tipo de uva que indicaste.');

                console.log(mensajesRespuesta);

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_VARIEDADES_DE_UVAS, "", "", "", 0, TipoUvaEncontrada, "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;
            }
            else {   // El usuario no introdujo Tipo Uva existente en BBDD

                // DEBEMOS COMPROBAR SI NOS INTRODUJO VARIEDAD DE UVA ESPECIFICA
                const palabrasUsuario = copMensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras
                // Leer tipos de uva del fichero
                console.log(palabrasUsuario);
                const tiposDeUva = await leerTiposDeUvaDeFichero();
                let uvaEncontrada = false;
                let uvaNombre = null;

                for (const palabraUsuario of palabrasUsuario) {
                    if (tiposDeUva.includes(palabraUsuario)) {
                        uvaEncontrada = true;
                        uvaNombre = palabraUsuario;
                        break; // Rompe el ciclo si encuentra una coincidencia
                    }
                }

                if (uvaEncontrada) {
                    // Realizar acciones correspondientes si se encontró una coincidencia
                    console.log("Se encontró una coincidencia con un tipo de uva del fichero. Sabiendo que no esta en BBDD");

                    // El usuario está preguntando por informacion que no esta en BBDD, por lo cual debemos hacer una llamada a ChatGPT y obtener respuesta con información

                    console.log('La uva que quiere el usuario es: ' + uvaNombre);


                    const completion = await openai.chat.completions.create({
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: `Necesito que me des la siguiente información sobre la uva: ${uvaNombre}. La información que necesito es: Características:, Región:(Nombre de la región, a secas, no digas nada más ya que sólo quiero el nombre de la región), Notas de Sabor: y Descripción:. Cabe destacar que esta información debe presentarse siempre en forma de lista, en un texto, sin enumeraciones, indicando cuál es cada parte. Y siempre en el orden indicado.` }
                        ],
                    });

                    // Guardar el contenido de la respuesta en la variable
                    detallesUvaGPT = completion.choices[0].message.content;
                    console.log(detallesUvaGPT);


                    // Dividir la respuesta en secciones
                    const secciones = detallesUvaGPT.split('\n\n');


                    // Extraer datos consulta ChatGPT
                    const caracteristicas = secciones[0].split(': ')[1];
                    console.log(caracteristicas);
                    const region = secciones[1].split(': ')[1].replace(/\.$/, '');
                    console.log(region);
                    const notasDeSabor = secciones[2].split(': ')[1];
                    console.log(notasDeSabor);
                    const descripcion = secciones[3].split(': ')[1];
                    console.log(descripcion);


                    await insertarTipoDeUva(uvaNombre, caracteristicas, region, notasDeSabor, descripcion)
                        .then(resultados => console.log('Inserción completada:', resultados))
                        .catch(error => console.error('Error al insertar en la base de datos:', error));

                    // En este punto se ha insertado en BBDD el tipo de uva

                    // Buscar info del tipo uva insertada
                    const infoTipoUva = await obtenerDescripcionTipoUva(uvaNombre);

                    console.log(infoTipoUva);

                    const mensajesRespuesta = [infoTipoUva];

                    mensajesRespuesta.unshift(botResponse.fulfillmentText);
                    mensajesRespuesta.push('Esta es la información que tengo sobre el tipo de uva que indicaste.');

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_VARIEDADES_DE_UVAS, "", "", "", 0, uvaNombre, "", "", "", "", "", "");   // Actualizar estado

                    return mensajesRespuesta;

                } else {
                    // No se encontró coincidencia, el usuario quiere informacion sobre las uvas en general
                    console.log("No se encontró coincidencia con los tipos de uva del fichero.");

                    const userId = obtenerUserIDDeSessionActual();
                    const idsExcluir = obtenerIdsUvasRecientesDeEstadoUsuario(userId);
                    const infoUvas = await obtenerNombreYTiposDeUvas(idsExcluir);

                    const mensajesRespuesta = infoUvas.map(uva => `${uva.Nombre}: ${uva.Descripcion}`);

                    // Extraer solo los ID's en una variable separada
                    const idsUvas = infoUvas.map(uva => uva.UvaID);

                    mensajesRespuesta.unshift(botResponse.fulfillmentText);

                    mensajesRespuesta.push('Estos son algunos de los tipos de uva que se utilizan en la elaboración de vino español.');

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_VARIEDADES_DE_UVAS, "", "", idsUvas, "", 1, "", "", "", "", "", "", "");   // Actualizar estado

                    return mensajesRespuesta;


                }

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_VARIEDADES_DE_UVAS, "", "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado
            }

            return mensajesRespuesta;

        }
        else if (tipoIntent == HISTORIA_VINO_TINTO) {     // Informacion sobre la historia del vino tinto


            const historiaVino = await obtenerHistoriaVino(1);

            console.log('Historia del vino: ' + historiaVino);

            const mensajesRespuesta = [historiaVino];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Esto es un resumen sobre los orígenes y el desarrollo del vino tinto en España.');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), HISTORIA_VINO_TINTO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;
        }
        else if (tipoIntent == HISTORIA_VINO_BLANCO) {     // Informacion sobre la historia del vino blanco

            const historiaVino = await obtenerHistoriaVino(2);

            console.log('Historia del vino: ' + historiaVino);

            const mensajesRespuesta = [historiaVino];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Esto es un resumen sobre los orígenes y el desarrollo del vino blanco en España.');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), HISTORIA_VINO_BLANCO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;


        }
        else if (tipoIntent == HISTORIA_VINO_ROSADO) {     // Informacion sobre la historia del vino rosado

            const historiaVino = await obtenerHistoriaVino(3);

            console.log('Historia del vino: ' + historiaVino);

            const mensajesRespuesta = [historiaVino];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Esto es un resumen sobre los orígenes y el desarrollo del vino rosado en España.');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), HISTORIA_VINO_ROSADO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;

        }
        else if (tipoIntent == HISTORIA_VINO_ESPUMOSO) {     // Informacion sobre la historia del vino espumoso

            const historiaVino = await obtenerHistoriaVino(4);

            console.log('Historia del vino: ' + historiaVino);

            const mensajesRespuesta = [historiaVino];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Esto es un resumen sobre los orígenes y el desarrollo del vino espumoso en España.');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), HISTORIA_VINO_ESPUMOSO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;

        }
        else if (tipoIntent == HISTORIA_VINO_DULCE) {     // Informacion sobre la historia del vino dulce

            const historiaVino = await obtenerHistoriaVino(4);

            console.log('Historia del vino: ' + historiaVino);

            const mensajesRespuesta = [historiaVino];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Esto es un resumen sobre los orígenes y el desarrollo del vino dulce en España.');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), HISTORIA_VINO_DULCE, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;

        }
        else if (tipoIntent == INFORMACION_ALMACENAMIENTO) {      // Informacion Almacenamiento

            const infoAlmacenamiento = await obtenerRespuestaAleatoriaAlmacenamientoVino();

            console.log('Información almacenamiento: ' + infoAlmacenamiento);

            const mensajesRespuesta = [infoAlmacenamiento];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Espero que te haya servido!');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_ALMACENAMIENTO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;

        }
        else if (tipoIntent == INFORMACION_SERVICIO) {        // Informacion Servicio

            const infoAlmacenamiento = await obtenerRespuestaAleatoriaAlmacenamientoServicio();

            console.log('Información servicio: ' + infoAlmacenamiento);

            const mensajesRespuesta = [infoAlmacenamiento];

            mensajesRespuesta.unshift(botResponse.fulfillmentText);

            mensajesRespuesta.push('Espero que te haya servido!');

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_SERVICIO, "", "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

            return mensajesRespuesta;

        }
        else if (tipoIntent == INFORMACION_BODEGA) {    // Informacion sobre bodega

            // DEBEMOS COMPROBAR SI NOS INTRODUJO NOMBRE DE BODEGA
            const copMensaje = mensaje;
            mensaje = mensaje.toLowerCase();
            const palabrasUsuario = mensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras

            // Obtener nombres de bodegas en BBDD
            const nombresBodegas = await obtenerNombresBodegas();


            let nombreBodegaEncontrado;
            let busquedaPorCalificacion;
            let menorDistancia = Infinity;
            const umbralDistancia = 2.5;

            for (const nombreBodega of nombresBodegas) {
                const longitudTipoUva = nombreBodega.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudTipoUva);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, nombreBodega.toLowerCase());
                    if (distancia < menorDistancia && distancia <= umbralDistancia) {
                        menorDistancia = distancia;
                        nombreBodegaEncontrado = nombreBodega;
                    }
                }
            }

            if (nombreBodegaEncontrado) {     // La Bodega existe en BBDD

                // Encontrar en BBDD esa bodega

                // Obtener info de la bodega
                const infoBodega = await obtenerDescripcionBodega(nombreBodegaEncontrado);

                console.log(infoBodega);

                const mensajesRespuesta = [infoBodega];

                mensajesRespuesta.unshift(botResponse.fulfillmentText);
                mensajesRespuesta.push('Esta es la información que tengo sobre la bodega que has mencionado.');

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_BODEGA, "", "", "", 0, "", nombreBodegaEncontrado, "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;

            }
            else {   // No tenemos la bodega en BBDD

                // Lo que debemos identificar ahora es si el usuario quiere informacion sobre una bodega que no esta en BBDD o si quiere informacion sobre varias bodegas

                const palabrasUsuario = copMensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras
                console.log(palabrasUsuario);
                const nombreBodegas = (await leerNombresBodegasFichero()).map(nombre => nombre.trim());
                console.log(nombreBodegas);
                let bodegaEncontrada = false;
                let bodegaNombre = null;

                for (const palabraUsuario of palabrasUsuario) {
                    console.log(palabraUsuario);
                    if (nombreBodegas.includes(palabraUsuario)) {
                        bodegaEncontrada = true;
                        bodegaNombre = palabraUsuario;
                        break; // Rompe el ciclo si encuentra una coincidencia
                    }
                }


                if (bodegaEncontrada) {   // El usuario quiere informacion sobre una bodega que no tenemos en BBDD

                    // Realizar acciones correspondientes si se encontró una coincidencia
                    console.log("Se encontró una coincidencia con nombre de Bodega. Sabiendo que no esta en BBDD");
                    // El usuario está preguntando por informacion que no esta en BBDD, por lo cual debemos hacer una llamada a ChatGPT y obtener respuesta con información
                    console.log('La info de la bodega que quiere el usuario es: ' + bodegaNombre);
                    const completion = await openai.chat.completions.create({
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: `Necesito que me des la siguiente información sobre la bodega: ${bodegaNombre}. La información que necesito es: Descripción:(al menos 5 líneas de descripción), Región:(Nombre de la región, a secas, no digas nada más ya que sólo quiero el nombre de la región), Año de Fundación:(Sólo el número del año, sin nada más) y Email de Contacto:(te lo puedes inventar). Cabe destacar que esta información debe presentarse siempre en forma de lista(Descripción:.....Región:.....), en un texto, sin enumeraciones, indicando cuál es cada parte(SIEMPRE). Y siempre en el orden indicado. Y cuando termine el contenido de la sección separa la siguiente por una línea en blanco` }
                        ],
                    });

                    // Guardar el contenido de la respuesta en la variable
                    detallesBodegaGPT = completion.choices[0].message.content;
                    console.log(detallesBodegaGPT);

                    // Dividir la respuesta en secciones
                    const secciones = detallesBodegaGPT.split('\n\n');

                    // Extraer datos consulta ChatGPT
                    const descripcion = secciones[0].split(': ')[1];
                    console.log(descripcion);
                    const region = secciones[1].split(': ')[1].replace(/\.$/, '');
                    console.log(region);
                    const anoFundacion = secciones[2].split(': ')[1];
                    console.log(anoFundacion);
                    const email = secciones[3].split(': ')[1];
                    console.log(email);


                    await insertarBodega(bodegaNombre, region, descripcion, anoFundacion, email)
                        .then(resultados => console.log('Inserción completada:', resultados))
                        .catch(error => console.error('Error al insertar en la base de datos:', error));

                    // Obtener info de la bodega
                    const infoBodega = await obtenerDescripcionBodega(bodegaNombre);

                    console.log(infoBodega);

                    const mensajesRespuesta = [infoBodega];

                    mensajesRespuesta.unshift(botResponse.fulfillmentText);
                    mensajesRespuesta.push('Esta es la información que tengo sobre la bodega que has mencionado.');

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_BODEGA, "", "", "", 0, "", bodegaNombre, "", "", "", "", "");   // Actualizar estado

                    return mensajesRespuesta;


                }
                else {   // El usuario quiere informacion sobre distintas bodegas
                    console.log('Quiere info sobre distintas bodegas');

                    const userId = obtenerUserIDDeSessionActual();
                    const idsExcluir = obtenerIdsBodegasRecientesDeEstadoUsuario(userId);
                    console.log(idsExcluir);
                    const infoBodegas = await obtenerNombre_Region_DescripcionBodegas(idsExcluir);

                    const mensajesRespuesta = infoBodegas.map(bodega => `<strong>Nombre:</strong> ${bodega.Nombre}<br><strong>Región:</strong> "${bodega.Region}"<br><strong>Descripción:</strong> ${bodega.Descripcion}`);


                    // Extraer solo los ID's en una variable separada
                    const idsBodegas = infoBodegas.map(bodega => bodega.BodegaID);

                    mensajesRespuesta.unshift(botResponse.fulfillmentText);

                    mensajesRespuesta.push('Estas son algunas bodegas que se encuentran dentro del territorio español.');

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_BODEGA, "", "", "", 1, "", "", idsBodegas, "", "", "", "");   // Actualizar estado

                    return mensajesRespuesta;


                }
            }

        }
        else if (tipoIntent == INFORMACION_DO) {  // Informacion sobre DO

            // DEBEMOS COMPROBAR SIN NOS ESTA INTRODUCIENDO UNA DO ESPECIFICA
            const copMensaje = mensaje;
            mensaje = mensaje.toLowerCase();
            const palabrasUsuario = mensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras

            // Obtener nombres DO
            const nombresDO = await obtenerNombresDO();


            let DOEncontrada;
            let busquedaPorCalificacion;
            let menorDistancia = Infinity;
            const umbralDistancia = 2.5;

            for (const DO of nombresDO) {
                const longitudDO = DO.split(/\s+/).length;
                const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudDO);

                for (const combinacionUsuario of combinacionesUsuario) {
                    const distancia = levenshtein(combinacionUsuario, DO.toLowerCase());
                    if (distancia < menorDistancia && distancia <= umbralDistancia) {
                        menorDistancia = distancia;
                        DOEncontrada = DO;
                    }
                }
            }



            if (DOEncontrada) {  // El usuario introdujo una DO existente en BBDD

                // Encontrar en BBDD y obtener info

                // Obtener info de esa DO
                const descripcionDO = await obtenerDescripcionDO(DOEncontrada);

                console.log(descripcionDO);

                const mensajesRespuesta = [descripcionDO];

                mensajesRespuesta.unshift(botResponse.fulfillmentText);
                mensajesRespuesta.push('Esta es la información que tengo sobre la DO que indicaste.');

                console.log(mensajesRespuesta);

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_DO, "", DOEncontrada, "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                return mensajesRespuesta;

            }
            else {   // El usuario no introdujo una DO existente en BBDD o quiere buscar info de varias DO

                console.log('No tenemos DO en BBDD');

                // DEBEMOS COMPROBAR SI NOS INTRODUJO VARIEDAD DE UVA ESPECIFICA
                const palabrasUsuario = copMensaje.replace(/\?/g, ' ').split(/\s+/); // Dividir el mensaje en palabras
                // Leer tipos de uva del fichero
                console.log(palabrasUsuario);
                const nombresDO = (await leerDOFichero()).map(nombre => nombre.trim());
                console.log(nombresDO);
                let DOEncontrada = false;
                let doNombre = null;

                for (const palabraUsuario of palabrasUsuario) {
                    if (nombresDO.includes(palabraUsuario)) {
                        DOEncontrada = true;
                        doNombre = palabraUsuario;
                        break; // Rompe el ciclo si encuentra una coincidencia
                    }
                }



                if (DOEncontrada) {     // Hemos encontrado DO en fichero, por lo que quiere info sobre una DO que no esta en BBDD

                    // Realizar acciones correspondientes si se encontró una coincidencia
                    console.log("Se encontró una coincidencia en el fichero de DO, por lo cual debemos buscar info y meter en BBDD");

                    // El usuario está preguntando por informacion que no esta en BBDD, por lo cual debemos hacer una llamada a ChatGPT y obtener respuesta con información

                    console.log('La DO que quiere el usuario es: ' + doNombre);


                    const completion = await openai.chat.completions.create({
                        model: "gpt-4",
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: `Necesito que me des la siguiente información sobre la Denominación de Orgien: ${doNombre}, perteneciente a la región de Canarias. La información que necesito es: Descripción: (Descripción: Al menos 3 líneas de descripción). Tiene que venir siempre de esta forma: Descripción:......` }
                        ],
                    });

                    // Guardar el contenido de la respuesta en la variable
                    detallesDO = completion.choices[0].message.content;
                    console.log(detallesDO);

                    // Extraer datos consulta ChatGPT
                    const descripcion = detallesDO.split(': ')[1];

                    console.log(descripcion);


                    await insertarDO(doNombre, descripcion)
                        .then(resultados => console.log('Inserción completada:', resultados))
                        .catch(error => console.error('Error al insertar en la base de datos:', error));


                    const descripcionDO = await obtenerDescripcionDO(doNombre);

                    console.log('Descripción DO: ' + descripcionDO);

                    const mensajesRespuesta = [descripcionDO];

                    mensajesRespuesta.unshift(botResponse.fulfillmentText);
                    mensajesRespuesta.push('Esta es la información que tengo sobre la DO que has mencionado.');

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_DO, "", doNombre, "", "", 0, "", "", "", "", "", "", "");   // Actualizar estado

                    return mensajesRespuesta;

                }
                else {       // El usuario quiere informacion sobre varias DO

                    console.log('Quiere info sobre distintas DOs');

                    const userId = obtenerUserIDDeSessionActual();
                    const idsExcluir = obtenerIdsDOsRecientesDeEstadoUsuario(userId);
                    console.log(idsExcluir);
                    const infoDOs = await obtenerNombre_DescripcionDOs(idsExcluir);

                    const mensajesRespuesta = infoDOs.map(DO => `<strong>Nombre:</strong> ${DO.Nombre}<br><strong>Descripción:</strong> ${DO.Descripcion}`);

                    // Extraer solo los ID's en una variable separada
                    const idsDOs = infoDOs.map(DO => DO.DOID);
                    console.log(idsDOs);

                    mensajesRespuesta.unshift(botResponse.fulfillmentText);

                    mensajesRespuesta.push('Estas son algunas DOs que se encuentran dentro del territorio español:');

                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), INFORMACION_DO, "", "", "", "", 1, "", "", "", idsDOs, "", "", "");   // Actualizar estado

                    return mensajesRespuesta;

                }
            }
        }
    }




    // Asegúrate de esperar a que la promesa de obtenerRespuestaPersonalizada se resuelva
    // return await obtenerRespuestaPersonalizada(mensaje, intencion);
    return botResponse;
}




// Definir las palabras clave para cada tipo de vino
const tiposVino = {
    tinto: ["tinto", "robusto", "taninos"],
    blanco: ["blanco", "cítricos", "fresco"],
    rosado: ["rosado", "floral", "ligero"],
    espumoso: ["espumoso", "burbujas", "chispeante"],
    dulce: ["dulce", "postre", "miel"]
};





// Función para identificar el tipo de vino
function identificarTipoVino(descripcion) {
    for (const tipo in tiposVino) {
        if (tiposVino[tipo].some(palabra => descripcion.includes(palabra))) {
            return tipo;
        }
    }
    return "No identificado";
}








function extraerRangoDePrecios(mensaje) {
    const palabrasMinimo = ["no menos de", "valga más de", "mínimo igual a", "mínimo sea de", "mínimo valga", "más de", "como mínimo", "mínimo de", "cueste más", "más de", "precio superior a", "precio mayor que", "partir de", "al menos", "valga más", "mínimo", "desde"];
    const palabrasMaximo = ["valga menos de", "máximo igual a", "máximo sea de", "máximo valga", "no más de", "como máximo", "máximo de", "cueste menos", "menos de", "precio inferior a", "menor que", "debajo de", "máximo", "hasta"];

    let precioMinimo = null;
    let precioMaximo = null;

    const palabras = mensaje.split(/\s+/);

    for (let i = 0; i < palabras.length; i++) {
        const numero = parseInt(palabras[i]);
        if (!isNaN(numero)) {
            const fraseAntes = palabras.slice(Math.max(0, i - 3), i).join(' ').toLowerCase();
            const fraseDespues = palabras.slice(i + 1, i + 4).join(' ').toLowerCase();

            const esMinimo = palabrasMinimo.some(p => fraseAntes.includes(p) || fraseDespues.includes(p));
            const esMaximo = palabrasMaximo.some(p => fraseAntes.includes(p) || fraseDespues.includes(p));

            if (esMinimo) {
                precioMinimo = numero;
            } else if (esMaximo) {
                precioMaximo = numero;
            }
        }
    }

    return { precioMinimo, precioMaximo };
}



async function obtenerIDDO(nombreDO) {
    const sql = `SELECT DOID FROM DenominacionesDeOrigen WHERE Nombre = ?`;
    const valores = [nombreDO];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                // Comprobar si hay resultados y devolver el primer UvaID
                if (resultados.length > 0) {
                    resolve(resultados[0].DOID);
                } else {
                    resolve(null); // O puedes optar por rechazar la promesa si no se encuentra el tipo de uva
                }
            }
        });
    });
}













async function obtenerIDTipoDeUva(TipoUvaEncontrada) {
    const sql = `SELECT UvaID FROM TiposDeUvas WHERE Nombre = ?`;
    const valores = [TipoUvaEncontrada];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                // Comprobar si hay resultados y devolver el primer UvaID
                if (resultados.length > 0) {
                    resolve(resultados[0].UvaID);
                } else {
                    resolve(null); // O puedes optar por rechazar la promesa si no se encuentra el tipo de uva
                }
            }
        });
    });
}


async function obtenerIDBodega(nombreBodegaEncontrado) {
    const sql = `SELECT BodegaID FROM Bodegas WHERE Nombre = ?`;
    const valores = [nombreBodegaEncontrado];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                // Comprobar si hay resultados y devolver el primer UvaID
                if (resultados.length > 0) {
                    resolve(resultados[0].BodegaID);
                } else {
                    resolve(null); // O puedes optar por rechazar la promesa si no se encuentra el tipo de uva
                }
            }
        });
    });
}






async function buscarBotellasPorCriterios(idTipoUva, TipoVino, DOEncontrada, precioMinimo, precioMaximo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND Precio BETWEEN ? AND ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, precioMinimo, precioMaximo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosConIdBodega(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND Precio BETWEEN ? AND ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosConIdBodegaYAnyoIgualConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND AnoCosecha = ?
        AND Precio BETWEEN ? AND ?
        AND Maridaje LIKE ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConIdBodegaYAnyoDespuesConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND AnoCosecha >= ?
        AND Precio BETWEEN ? AND ?
        AND Maridaje LIKE ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosConIdBodegaYAnyoAntesConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND AnoCosecha <= ?
        AND Precio BETWEEN ? AND ?
        AND Maridaje LIKE ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}












async function buscarBotellasPorCriteriosConIdBodegaYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND AnoCosecha = ?
        AND Precio BETWEEN ? AND ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConIdBodegaYAnyoIgualConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, MaridajeEncontrado, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND AnoCosecha = ?
        AND Precio BETWEEN ? AND ?
        AND Maridaje LIKE ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, '%' + MaridajeEncontrado + '%', calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosConIdBodegaYAnyoDespuesConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, MaridajeEncontrado, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND AnoCosecha >= ?
        AND Precio BETWEEN ? AND ?
        AND Maridaje LIKE ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, '%' + MaridajeEncontrado + '%', calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConIdBodegaYAnyoAntesConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, MaridajeEncontrado, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND AnoCosecha <= ?
        AND Precio BETWEEN ? AND ?
        AND Maridaje LIKE ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, '%' + MaridajeEncontrado + '%', calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}

























async function buscarBotellasPorCriteriosConIdBodegaYAnyoIgualConCalificacion(idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND AnoCosecha = ?
        AND Precio BETWEEN ? AND ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}





async function buscarBotellasPorCriteriosConConDOYUvaMinimoConMaridaje(idTipoUva, TipoVino, DOEncontrada, precioMinimo, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND Precio >= ?
        AND Maridaje LIKE ?
    `;





    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, precioMinimo, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosConConDOYUvaMaximoConMaridaje(idTipoUva, TipoVino, DOEncontrada, precioMaximo, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND Precio <= ?
        AND Maridaje LIKE ?
    `;





    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, precioMaximo, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}







async function buscarBotellasPorCriteriosConConDOYUvaConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, MaridajeEncontrado, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND Maridaje LIKE ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, '%' + MaridajeEncontrado + '%', calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}























async function buscarBotellasPorCriteriosConConDOYUvaMinimoConCalificacion(idTipoUva, TipoVino, DOEncontrada, precioMinimo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND Precio >= ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, precioMinimo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConConDOYUvaMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, precioMaximo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND Precio <= ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, precioMaximo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}





async function buscarBotellasPorCriteriosConConDOYUvaMinimoYMaximoConMaridaje(idTipoUva, TipoVino, DOEncontrada, precioMinimo, precioMaximo, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND Precio BETWEEN ? AND ?
        AND Maridaje LIKE ?
    `;




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, precioMinimo, precioMaximo, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function insertarBotellaBBDD(nombre, anoCosecha, region, descripcion, precio, volumen, stock, tipoUva, imagenURL, calificacion, uvaID, tipoVinoID, dOID, bodegaID, maridaje) {
    // Suponiendo que tienes un cliente de base de datos ya configurado y conectado
    // Por ejemplo, client podría ser una instancia de un cliente MySQL o PostgreSQL

    const query = `
        INSERT INTO Botellas (Nombre, AnoCosecha, Region, Descripcion, Precio, Volumen, Stock, UvaID, TipoVinoID, DOID, BodegaID, Maridaje) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        const resultados = await db.query(query, [nombre, anoCosecha, region, descripcion, precio, volumen, stock, uvaID, tipoVinoID, dOID, bodegaID, maridaje]);
        console.log('Inserción completada:', resultados);
        return resultados;
    } catch (error) {
        console.error('Error al insertar en la base de datos:', error);
        throw error;
    }
}




async function recuperarBotellaPorNombre(nombre) {
    // Suponiendo que tienes un cliente de base de datos ya configurado y conectado
    // Por ejemplo, client podría ser una instancia de un cliente MySQL o PostgreSQL

    const query = `
        SELECT * FROM Botellas WHERE Nombre = ?
    `;

    try {
        const resultados = await db.query(query, [nombre]);
        if (resultados.length > 0) {
            console.log('Botella encontrada:', resultados);
            return resultados[0]; // Devuelve la primera botella que coincida con el nombre
        } else {
            console.log('No se encontró ninguna botella con ese nombre');
            return null; // No se encontraron botellas
        }
    } catch (error) {
        console.error('Error al recuperar de la base de datos:', error);
        throw error;
    }
}












async function buscarBotellasPorCriteriosConConDOYUvaMinimoYMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, precioMinimo, precioMaximo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND Precio BETWEEN ? AND ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, precioMinimo, precioMaximo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}













async function buscarBotellasPorCriteriosConAnyoIgualConDOYUvaMinimoYMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, precioMaximo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha = ?
        AND Precio BETWEEN ? AND ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, precioMaximo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosConAnyoDespuesConDOYUvaMinimoYMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, precioMaximo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha >= ?
        AND Precio BETWEEN ? AND ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, precioMaximo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosConAnyoAntesConDOYUvaMinimoYMaximoConCalificacion(idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, precioMaximo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha <= ?
        AND Precio BETWEEN ? AND ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, precioMaximo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




















async function buscarBotellasPorCriteriosConIdBodegaYAnyoDespuesConCalificacion(idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND AnoCosecha >= ?
        AND Precio BETWEEN ? AND ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosConIdBodegaYAnyoAntesConCalificacion(idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND AnoCosecha <= ?
        AND Precio BETWEEN ? AND ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }




    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConBodegaConMinimoConCalificacion(idBodega, precioMinimo, TipoVino, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND Precio >= ?
        AND TipoVinoID = ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idBodega, precioMinimo, TipoVino, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConBodegaConMaximoConCalificacion(idBodega, precioMaximo, TipoVino, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND Precio <= ?
        AND TipoVinoID = ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idBodega, precioMaximo, TipoVino, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



















async function buscarBotellasPorCriteriosConBodegaConCalificacion(idBodega, TipoVino, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idBodega, TipoVino, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosConBodegaDOYUvaConCalificacionConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, MaridajeEncontrado, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND Precio BETWEEN ? AND ?
        AND Maridaje LIKE ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, '%' + MaridajeEncontrado + '%', calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosConBodegaDOYUvaConMaridaje(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND Precio BETWEEN ? AND ?
        AND Maridaje LIKE ?
    `;




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}
























async function buscarBotellasPorCriteriosConBodegaDOYUvaConCalificacion(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND Precio BETWEEN ? AND ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, precioMaximo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosConDOYUvaConAnyoIgualConCalificacion(idTipoUva, TipoVino, DOEncontrada, anyo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha = ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosConDOYUvaConMaridaje(idTipoUva, TipoVino, DOEncontrada, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND Maridaje LIKE ?
    `;




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}






async function buscarBotellasPorCriteriosConDOConMaridaje(DOEncontrada, TipoVino, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND Maridaje LIKE ?
    `;


    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }



    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [DOEncontrada, TipoVino, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosConUvaConMaridaje(idTipoUva, TipoVino, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Maridaje LIKE ?
    `;


    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }



    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}






















async function buscarBotellasPorCriteriosConDOYUvaConCalificacionConMaridaje(DOEncontrada, TipoVino, MaridajeEncontrado, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND Maridaje LIKE ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [DOEncontrada, TipoVino, '%' + MaridajeEncontrado + '%', calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}





async function buscarBotellasPorCriteriosConUvaConCalificacionConMaridaje(idTipoUva, TipoVino, MaridajeEncontrado, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Maridaje LIKE ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, '%' + MaridajeEncontrado + '%', calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}






















async function buscarBotellasPorCriteriosConDOYUvaConCalificacion(idTipoUva, TipoVino, DOEncontrada, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}













async function buscarBotellasPorCriteriosConDOYUvaConAnyoDespuesConCalificacion(idTipoUva, TipoVino, DOEncontrada, anyo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha >= ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosConDOYUvaConAnyoAntesConCalificacion(idTipoUva, TipoVino, DOEncontrada, anyo, calificacionTipo, calificacionValor, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha <= ?
    `;


    if (calificacionTipo == 'mejores') {      // mejores
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'peores') {  // peores
        sql += ' ORDER BY Calificacion ASC';
    }
    else if (calificacionTipo == 'igualesA') {    // Iguales a
        sql += ' AND Calificacion = ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'superioresA') {   // Superior a
        sql += ' AND Calificacion >= ?';
        sql += ' ORDER BY Calificacion DESC';
    }
    else if (calificacionTipo == 'inferioresA') {   // Inferior a
        sql += ' AND Calificacion <= ?';
        sql += ' ORDER BY Calificacion DESC';
    }




    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }





    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5;';


    console.log(sql);


    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, calificacionValor, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}
























async function buscarBotellasPorCriteriosConAmbosPreciosYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, precioMaximo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha = ?
        AND Precio BETWEEN ? AND ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, precioMaximo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosConPrecioMinimoYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha = ?
        AND Precio >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConPrecioMaximoYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, anyo, precioMaximo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha = ?
        AND Precio <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, precioMaximo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}





async function buscarBotellasPorCriteriosConDOYAnyoIgualConMaridaje(DOEncontrada, TipoVino, anyo, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND AnoCosecha = ?
        AND Maridaje LIKE ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, anyo, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConDOYAnyoDespuesConMaridaje(DOEncontrada, TipoVino, anyo, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND AnoCosecha >= ?
        AND Maridaje LIKE ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, anyo, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}





async function buscarBotellasPorCriteriosConDOYAnyoAntesConMaridaje(DOEncontrada, TipoVino, anyo, MaridajeEncontrado, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND AnoCosecha <= ?
        AND Maridaje LIKE ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, anyo, '%' + MaridajeEncontrado + '%', ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}














async function buscarBotellasPorCriteriosConDOTipoUvaYAnyoIgual(idTipoUva, TipoVino, DOEncontrada, anyo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha = ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConDOPrecioMinimoFechaIgual(DOEncontrada, TipoVino, precioMinimo, anyo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND Precio >= ?
        AND AnoCosecha = ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, precioMinimo, anyo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosConDOPrecioMaximoFechaIgual(DOEncontrada, TipoVino, precioMaximo, anyo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND Precio <= ?
        AND AnoCosecha = ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, precioMaximo, anyo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConDOPrecioMaximoFechaDespues(DOEncontrada, TipoVino, precioMaximo, anyo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND Precio <= ?
        AND AnoCosecha >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, precioMaximo, anyo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosConDOPrecioMaximoFechaAntes(DOEncontrada, TipoVino, precioMaximo, anyo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND Precio <= ?
        AND AnoCosecha <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, precioMaximo, anyo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}
















async function buscarBotellasPorCriteriosConDOPrecioMinimoFechaDespues(DOEncontrada, TipoVino, precioMinimo, anyo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND Precio >= ?
        AND AnoCosecha >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, precioMinimo, anyo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConDOPrecioMinimoFechaAntes(DOEncontrada, TipoVino, precioMinimo, anyo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND Precio >= ?
        AND AnoCosecha <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, precioMinimo, anyo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}














async function buscarBotellasPorCriteriosConDOTipoUvaYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, anyo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosConDOTipoUvaYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, anyo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}







async function buscarBotellasPorCriteriosConPrecioMinimoYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha >= ?
        AND Precio >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConPrecioMaximoYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, anyo, precioMaximo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha >= ?
        AND Precio <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, precioMaximo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}












async function buscarBotellasPorCriteriosConPrecioMinimoYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha <= ?
        AND Precio >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosConPrecioMaximoYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, anyo, precioMaximo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha <= ?
        AND Precio <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, precioMaximo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}











async function buscarBotellasPorCriteriosConAmbosPreciosYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, precioMaximo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha >= ?
        AND Precio BETWEEN ? AND ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, precioMaximo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosConAmbosPreciosYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, precioMaximo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND AnoCosecha <= ?
        AND Precio BETWEEN ? AND ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, anyo, precioMinimo, precioMaximo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}









async function buscarBotellasPorCriteriosConIdBodegaYAnyoDespues(idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND AnoCosecha >= ?
        AND Precio BETWEEN ? AND ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConIdBodegaYAnyoAntes(idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, idsAExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND AnoCosecha <= ?
        AND Precio BETWEEN ? AND ?
    `;

    // Agrega una cláusula para excluir IDs si idsAExcluir no está vacío
    if (idsAExcluir && idsAExcluir.length > 0) {
        const placeholders = idsAExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, anyo, precioMinimo, precioMaximo, ...idsAExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}













async function buscarBotellasPorCriteriosConIdBodegaYMinimo(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND Precio >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, precioMinimo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosConIdBodegaYMaximo(idTipoUva, TipoVino, DOEncontrada, idBodega, precioMaximo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
        AND Precio <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, precioMaximo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}











async function buscarBotellasPorCriteriosPrecioMinimo(idTipoUva, TipoVino, DOEncontrada, precioMinimo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND Precio >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, precioMinimo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosPrecioMaximo(idTipoUva, TipoVino, DOEncontrada, precioMaximo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND Precio <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, precioMaximo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosTipoUvaYDO(idTipoUva, TIpoVino, DOEncontrada, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TIpoVino, DOEncontrada, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosTipoUvaYMinimo(idTipoUva, TipoVino, precioMinimo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Precio >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, precioMinimo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosTipoUvaYMaximo(idTipoUva, TipoVino, precioMaximo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Precio <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, precioMaximo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosUvaYMinimoConMaridaje(idTipoUva, TipoVino, precioMinimo, MaridajeEncontrado, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Precio >= ?
        AND Maridaje LIKE ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, precioMinimo, '%' + MaridajeEncontrado + '%', ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosUvaYMaximoConMaridaje(idTipoUva, TipoVino, precioMaximo, MaridajeEncontrado, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Precio <= ?
        AND Maridaje LIKE ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, precioMaximo, '%' + MaridajeEncontrado + '%', ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}























async function buscarBotellasPorCriteriosDOYMinimoConMaridaje(DOEncontrada, TipoVino, precioMinimo, MaridajeEncontrado, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND Precio >= ?
        AND Maridaje LIKE ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, precioMinimo, '%' + MaridajeEncontrado + '%', ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosDOYMaximoConMaridaje(DOEncontrada, TipoVino, precioMaximo, MaridajeEncontrado, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND Precio <= ?
        AND Maridaje LIKE ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, precioMaximo, '%' + MaridajeEncontrado + '%', ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}












async function buscarBotellasPorCriteriosDOYMinimo(DOEncontrada, TipoVino, precioMinimo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND Precio >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, precioMinimo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosDOYMaximo(DOEncontrada, TipoVino, precioMaximo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND Precio <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, precioMaximo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}







async function buscarBotellasPorCriteriosTipoUvaYBodega(idTipoUva, TipoVino, idBodega, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND BodegaID = ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, idBodega, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorNombre(nombreBotella) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Nombre = ?
    `;

    const valores = [nombreBotella];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}
















async function buscarBotellasPorCriteriosBodega(idBodega, TipoVino, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idBodega, TipoVino, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}







async function buscarBotellasPorCriteriosTipoUvaYDOYBodega(idTipoUva, TipoVino, DOEncontrada, idBodega, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND Region = ?
        AND BodegaID = ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idTipoUva, TipoVino, DOEncontrada, idBodega, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosBodegaYMinimo(idBodega, TipoVino, precioMinimo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
        AND Precio >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idBodega, TipoVino, precioMinimo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosBodegaYMaridaje(idBodega, TipoVino, MaridajeEncontrado, idsExcluir) {

    let sql;
    let opcion;
    if(TipoVino == null){
        sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND Maridaje LIKE ?
    `;
    opcion = 1;
    }
    else{
        sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
        AND Maridaje LIKE ?
    `;
    opcion = 2;
    }
    

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    if(opcion == 1){
        const valores = [idBodega, '%' + MaridajeEncontrado + '%', ...idsExcluir];

        return new Promise((resolve, reject) => {
            db.query(sql, valores, (error, resultados) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(resultados);
                }
            });
        });
    }
    else{
        const valores = [idBodega, TipoVino, '%' + MaridajeEncontrado + '%', ...idsExcluir];

        return new Promise((resolve, reject) => {
            db.query(sql, valores, (error, resultados) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(resultados);
                }
            });
        });
    }
    
}








async function buscarBotellasPorCriteriosBodegaYFechaIgual(idBodega, TipoVino, anyo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
        AND AnoCosecha = ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idBodega, TipoVino, anyo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}




async function buscarBotellasPorCriteriosTipoUvaYFechaIgual(idUva, TipoVino, anyo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND AnoCosecha = ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idUva, TipoVino, anyo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosTipoUvaYFechaDespues(idUva, TipoVino, anyo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND AnoCosecha >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idUva, TipoVino, anyo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosTipoUvaYFechaAntes(idUva, TipoVino, anyo, idsExcluir) {

    let sql;
    let opcion;
    if(TipoVino == null){
        sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND AnoCosecha <= ?
    `;
    opcion = 1;
    }
    else{
        sql = `
        SELECT *
        FROM Botellas
        WHERE UvaID = ?
        AND TipoVinoID = ?
        AND AnoCosecha <= ?
    `;
    opcion = 2;
    }
    

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    if(opcion == 2){
        const valores = [idUva, TipoVino, anyo, ...idsExcluir];

        return new Promise((resolve, reject) => {
            db.query(sql, valores, (error, resultados) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(resultados);
                }
            });
        });
    }
    else{
        const valores = [idUva, anyo, ...idsExcluir];

        return new Promise((resolve, reject) => {
            db.query(sql, valores, (error, resultados) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(resultados);
                }
            });
        });
    }
    
}










async function buscarBotellasPorCriteriosDOYFechaIgual(DOEncontrada, TipoVino, anyo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND AnoCosecha = ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, anyo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosDOYFechaDespues(DOEncontrada, TipoVino, anyo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND AnoCosecha >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, anyo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}


async function buscarBotellasPorCriteriosDOYFechaAntes(DOEncontrada, TipoVino, anyo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE Region = ?
        AND TipoVinoID = ?
        AND AnoCosecha <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [DOEncontrada, TipoVino, anyo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}










async function buscarBotellasPorCriteriosBodegaYFechaDespues(idBodega, TipoVino, anyo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
        AND AnoCosecha >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idBodega, TipoVino, anyo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosBodegaYFechaAntes(idBodega, TipoVino, anyo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
        AND AnoCosecha <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idBodega, TipoVino, anyo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}










async function buscarBotellasPorCriteriosBodegaMinimoYFechaIgual(idBodega, TipoVino, anyo, precioMinimo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
        AND AnoCosecha = ?
        AND Precio >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idBodega, TipoVino, anyo, precioMinimo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosBodegaMaximaYFechaIgual(idBodega, TipoVino, anyo, precioMaximo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
        AND AnoCosecha = ?
        AND Precio <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idBodega, TipoVino, anyo, precioMaximo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosBodegaMaximaYFechaDespues(idBodega, TipoVino, anyo, precioMaximo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
        AND AnoCosecha >= ?
        AND Precio <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idBodega, TipoVino, anyo, precioMaximo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosBodegaMaximaYFechaAntes(idBodega, TipoVino, anyo, precioMaximo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
        AND AnoCosecha <= ?
        AND Precio <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idBodega, TipoVino, anyo, precioMaximo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}












async function buscarBotellasPorCriteriosBodegaMinimoYFechaDespues(idBodega, TipoVino, anyo, precioMinimo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
        AND AnoCosecha >= ?
        AND Precio >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idBodega, TipoVino, anyo, precioMinimo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}



async function buscarBotellasPorCriteriosBodegaMinimoYFechaAntes(idBodega, TipoVino, anyo, precioMinimo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
        AND AnoCosecha <= ?
        AND Precio >= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idBodega, TipoVino, anyo, precioMinimo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}











async function buscarBotellasPorCriteriosBodegaYMaximo(idBodega, TipoVino, precioMaximo, idsExcluir) {
    let sql = `
        SELECT *
        FROM Botellas
        WHERE BodegaID = ?
        AND TipoVinoID = ?
        AND Precio <= ?
    `;

    // Agrega una cláusula para excluir IDs si idsExcluir no está vacío
    if (idsExcluir && idsExcluir.length > 0) {
        const placeholders = idsExcluir.map(() => '?').join(',');
        sql += ` AND BotellaID NOT IN (${placeholders})`;
    }

    // Añade la cláusula LIMIT para restringir los resultados a 5
    sql += ' LIMIT 5';

    const valores = [idBodega, TipoVino, precioMaximo, ...idsExcluir];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    });
}










function obtenerIdsUvasRecientesDeEstadoUsuario(userId) {
    if (estadoUsuario[userId] && estadoUsuario[userId].length > 0) {
        // Buscar el último estado de 'InformacionVariedadesDeUva' en el historial
        const indiceEstadoUva = estadoUsuario[userId].findIndex(estado => estado.categoria === 'InformacionVariedadesDeUva');
        if (indiceEstadoUva !== -1) {
            const estadoVariedadesDeUva = estadoUsuario[userId][indiceEstadoUva];
            // Asegúrate de que estadoVariedadesDeUva.idsBotellas no sea undefined y sea un array
            if (Array.isArray(estadoVariedadesDeUva.idsUvas)) {
                return estadoVariedadesDeUva.idsUvas;
            }
        }
    }
    return [];
}


function obtenerIdsBotellasRecientesDeEstadoUsuario(userId) {
    if (estadoUsuario[userId] && estadoUsuario[userId].length > 0) {
        // Buscar el último estado de 'InformacionVariedadesDeUva' en el historial
        const indiceEstadoBotellas = estadoUsuario[userId].findIndex(estado => estado.categoria === 'AyudaEncontrarBotellaVinoTinto');
        if (indiceEstadoBotellas !== -1) {
            const estadoBotellas = estadoUsuario[userId][indiceEstadoBotellas];
            // Asegúrate de que estadoVariedadesDeUva.idsBotellas no sea undefined y sea un array
            if (Array.isArray(estadoBotellas.idsBotellas)) {
                return estadoBotellas.idsBotellas;
            }
        }
    }
    return [];
}








function obtenerIdsBodegasRecientesDeEstadoUsuario(userId) {
    if (estadoUsuario[userId] && estadoUsuario[userId].length > 0) {
        // Buscar el último estado de 'InformacionVariedadesDeUva' en el historial
        const indiceEstadoBodega = estadoUsuario[userId].findIndex(estado => estado.categoria === 'InformacionBodega');
        if (indiceEstadoBodega !== -1) {
            const estadoVariedadesDeBodega = estadoUsuario[userId][indiceEstadoBodega];
            // Asegúrate de que estadoVariedadesDeUva.idsBotellas no sea undefined y sea un array
            if (Array.isArray(estadoVariedadesDeBodega.idsBodegas)) {
                return estadoVariedadesDeBodega.idsBodegas;
            }
        }
    }
    return [];
}


function obtenerIdsDOsRecientesDeEstadoUsuario(userId) {
    if (estadoUsuario[userId] && estadoUsuario[userId].length > 0) {
        // Buscar el último estado de 'InformacionVariedadesDeUva' en el historial
        const indiceEstadoDO = estadoUsuario[userId].findIndex(estado => estado.categoria === 'InformacionDO');
        if (indiceEstadoDO !== -1) {
            const estadoVariedadesDeDO = estadoUsuario[userId][indiceEstadoDO];
            // Asegúrate de que estadoVariedadesDeUva.idsBotellas no sea undefined y sea un array
            if (Array.isArray(estadoVariedadesDeDO.idsDOs)) {
                return estadoVariedadesDeDO.idsDOs;
            }
        }
    }
    return [];
}






// Función para leer el fichero y obtener los tipos de uva
async function leerTiposDeUvaDeFichero() {
    try {
        const contenido = fs.readFileSync('DatosUVA/uvaFichero.txt', 'utf8');
        return contenido.split('\n');
    } catch (err) {
        console.error('Error al leer el fichero:', err);
        throw err;
    }
}


// Función para leer el fichero y obtener las distintas DO
async function leerDOFichero() {
    try {
        const contenido = fs.readFileSync('DatosDO/doFichero.txt', 'utf8');
        return contenido.split('\n');
    } catch (err) {
        console.error('Error al leer el fichero:', err);
        throw err;
    }
}



// Función para leer el fichero y obtener los nombres de las bodegas
async function leerNombresBodegasFichero() {
    try {
        const contenido = fs.readFileSync('DatosBodegas/bodegasFichero.txt', 'utf8');
        return contenido.split('\n');
    } catch (err) {
        console.error('Error al leer el fichero:', err);
        throw err;
    }
}







function leerRespuestasDesdeArchivo(archivo) {
    try {
        const datos = fs.readFileSync(archivo, 'utf8');
        return datos.split('\n').filter(linea => linea.trim() !== '');
    } catch (error) {
        console.error('Error al leer el archivo de respuestas:', error);
        return [];
    }
}



const respuestasSaludo = leerRespuestasDesdeArchivo('DatosChatbot/Respuestas/Saludo/respuestas_saludo.txt');

const respuestasDespedida = leerRespuestasDesdeArchivo('DatosChatbot/Respuestas/Despedida/respuestas_despedida.txt');

const respuestasCompraBotella = leerRespuestasDesdeArchivo('DatosChatbot/Respuestas/Ayuda/respuestas_compra_botella.txt');
const respuestasInformacionBotella = leerRespuestasDesdeArchivo('DatosChatbot/Respuestas/Ayuda/respuestas_informacion_botella.txt');
const respuestasGenericasBotella = leerRespuestasDesdeArchivo('DatosChatbot/Respuestas/Ayuda/respuestas_genericas_botella.txt');
const respuestasInformacionGeneral = leerRespuestasDesdeArchivo('DatosChatbot/Respuestas/Ayuda/respuestas_informacion_general.txt');
const respuestasAsistencia = leerRespuestasDesdeArchivo('DatosChatbot/Respuestas/Ayuda/respuestas_asistencia.txt');
const respuestasInformacionVino = leerRespuestasDesdeArchivo('DatosChatbot/Respuestas/Ayuda/respuestas_informacion_vino.txt');






function obtenerRespuestaAleatoria(categoria) {
    let respuestas;

    switch (categoria) {
        case 'saludo':
            respuestas = respuestasSaludo;
            break;
        case 'despedida':
            respuestas = respuestasDespedida;
            break;
        // ... otras categorías si es necesario ...
        default:
            return 'Lo siento, no entiendo tu pregunta. Intenta con otra cosa.';
    }

    const indiceAleatorio = Math.floor(Math.random() * respuestas.length);
    console.log('respuesta:' + respuestas[indiceAleatorio]);
    console.log('-------------------')
    return respuestas[indiceAleatorio];
}


function obtenerRespuestaPersonalizada(mensaje, categoria) {
    switch (categoria) {
        case 'ayuda':
            return Promise.resolve(respuestaParaAyuda(mensaje));
        // Añadir aquí más categorías con su lógica correspondiente
        case 'vino tinto':
            return respuestaParaVinoTinto(mensaje);
        case 'adiccion':
            return manejorespuestasParaAdiccion(mensaje);
        default:
            return Promise.resolve(obtenerRespuestaAleatoria(categoria));
    }
}



async function manejorespuestasParaAdiccion(mensaje) {
    mensaje = mensaje.toLowerCase();

    const IDusuario = obtenerUserIDDeSessionActual();
    console.log('ID usuario: ' + IDusuario);

    const usuarioState = obtenerEstadoMasRecienteUsuario(IDusuario);

    if (usuarioState) {
        const categoria = usuarioState.categoria;
        const DO = usuarioState.DO;
        const botellasIDs = usuarioState.idsBotellas;

        console.log('Categoría más reciente: ' + categoria);
        console.log('DO más reciente: ' + DO);
        console.log('IDs botellas búsqueda: ' + JSON.stringify(botellasIDs));

        if (DO != "") { // Con DO
            console.log('Tenemos tanto DO como categoría');

            if (usuarioState && usuarioState.categoria === 'vino tinto') {    // Mas botellas vino tinto
                const DO = usuarioState.DO;
                const idsBotellasPrevias = usuarioState.idsBotellas;
                const porCalificacion = usuarioState.busquedaPorCalificacion;

                let nuevasBotellas;

                if (porCalificacion === 1) {  // Por calificacion
                    console.log('Dame más por calificacion');
                    // Obtener nuevas botellas
                    nuevasBotellas = await obtenerBotellasPorDOOrdenadasPorCalificacionAdiccion(DO, idsBotellasPrevias);
                }
                else {
                    console.log('Dame más normal');
                    // Obtener nuevas botellas
                    nuevasBotellas = await obtenerNuevasBotellasPorDO(DO, idsBotellasPrevias);
                }



                // Crear un array de mensajes, uno para cada botella
                const mensajesRespuesta = nuevasBotellas.map(botella =>
                    `<strong>${botella.Nombre} (${botella.AnoCosecha})</strong><br>${botella.Descripcion}<br><strong>Precio:</strong> ${botella.Precio}€<br><strong>Stock:</strong> ${botella.Stock} unidades<br><strong>Calificación:</strong> ${botella.Calificacion}/5.`
                );

                let idsBotellas = nuevasBotellas.map(botella => botella.BotellaID); // Asumiendo que cada botella tiene un 'id'

                console.log('IDS nuevas botellas:' + idsBotellas);

                if (porCalificacion === 1) {  // Por calificacion
                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), 'vino tinto', DO, idsBotellas, 1, 1);
                }
                else {
                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), 'vino tinto', DO, idsBotellas, 0, 1);
                }


                let mensajeCierre = `Aquí te añado algunas botellas más!`;

                mensajesRespuesta.push(mensajeCierre);  // Mensaje cierre

                return mensajesRespuesta; // Devuelve el array de mensajes
            }

        }
        else {   // Sin DO
            console.log('Solo tenemos categoría');

            let tipoVino;

            if (usuarioState && usuarioState.categoria === 'vino tinto') {    // Mas botellas vino tinto
                const DO = usuarioState.DO;
                const idsBotellasPrevias = usuarioState.idsBotellas;
                const porCalificacion = usuarioState.busquedaPorCalificacion;
                tipoVino = 'Tinto';

                let nuevasBotellas;

                if (porCalificacion === 1) {  // Por calificacion
                    console.log('Dame más por calificacion');
                    // Obtener nuevas botellas
                    nuevasBotellas = await obtenerBotellasPorTipoOrdenadasPorCalificacionSinDO(tipoVino, idsBotellasPrevias);
                }
                else {
                    console.log('Dame más normal');
                    // Obtener nuevas botellas
                    nuevasBotellas = await obtenerNuevasBotellasPorDO(DO, idsBotellasPrevias);
                }

                console.log('respuesta: ' + nuevasBotellas);

                // Crear un array de mensajes, uno para cada botella
                const mensajesRespuesta = nuevasBotellas.map(botella =>
                    `<strong>${botella.Nombre} (${botella.AnoCosecha})</strong><br>${botella.Descripcion}<br><strong>Precio:</strong> ${botella.Precio}€<br><strong>Stock:</strong> ${botella.Stock} unidades<br><strong>Calificación:</strong> ${botella.Calificacion}/5.`
                );

                let idsBotellas = nuevasBotellas.map(botella => botella.BotellaID); // Asumiendo que cada botella tiene un 'id'

                console.log('IDS nuevas botellas:' + idsBotellas);

                if (porCalificacion === 1) {  // Por calificacion
                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), 'vino tinto', "", idsBotellas, 1, 1);
                }
                else {
                    actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), 'vino tinto', "", idsBotellas, 0, 1);
                }


                let mensajeCierre = `Aquí te añado algunas botellas más!`;

                mensajesRespuesta.push(mensajeCierre);  // Mensaje cierre

                return mensajesRespuesta; // Devuelve el array de mensajes

            }

        }


    } else {
        console.log('No se encontró el estado más reciente para el usuario.');
    }
}



function obtenerEstadoMasRecienteUsuario(userId) {
    const estado = obtenerEstadoUsuario(userId);

    if (estado && estado.length > 0) {
        return estado[0]; // Devuelve el estado más reciente
    } else {
        console.log("No hay estados registrados para el usuario con ID:", userId);
        return null; // O manejar de otra manera si no hay estados
    }
}










function respuestaParaAyuda(mensaje) {
    mensaje = mensaje.toLowerCase();

    // Revisar si el mensaje se relaciona con la búsqueda de una botella de vino
    if (/botella(s)? de vino|botella/.test(mensaje)) {
        console.log('El usuario está en la búsqueda de una botella de vino');
        // Revisar si el mensaje implica una intención de búsqueda de una botella
        if (/información|ayud(a|e|ar|ando|es|ado|aremos|aría|arían|as|ase|aste|o)?\b/.test(mensaje)) {
            return obtenerRespuestaAleatoriaAyuda(respuestasInformacionVino);
        }
        // Revisar si el mensaje implica una intención de compra
        if (/compra|ordenar|pedir|comprar/.test(mensaje) || /ocasión especial|evento especial|celebración/.test(mensaje)) {
            return obtenerRespuestaAleatoriaAyuda(respuestasCompraBotella);
        }
        // Revisar si el mensaje implica una solicitud de información
        else if (/información|detalles|explicar|encontrar/.test(mensaje)) {
            return obtenerRespuestaAleatoriaAyuda(respuestasInformacionBotella);
        }
        // Respuesta genérica relacionada con botellas de vino
        else {
            return obtenerRespuestaAleatoriaAyuda(respuestasGenericasBotella);
        }
    }
    // Luego, revisar si el mensaje solicita información general
    else if (/información|encontrar|detalles|explicar/.test(mensaje)) {
        // Añadir una distinción para información específica de vino
        if (/vino/.test(mensaje)) {
            console.log('El usuario quiero información para encontrar una botella de vino');
            return obtenerRespuestaAleatoriaAyuda(respuestasInformacionVino);
        }
        // Información general no relacionada con vino
        else {
            return obtenerRespuestaAleatoriaAyuda(respuestasInformacionGeneral);
        }
    }
    else if (/comprar|ayud(a|e|ar|ando|es|ado|aremos|aría|arían|as|ase|aste|o)?\b/.test(mensaje)) {
        return obtenerRespuestaAleatoriaAyuda(respuestasInformacionVino);
    }
    // Respuesta por defecto si no se cumplen las condiciones anteriores
    else {
        return obtenerRespuestaAleatoriaAyuda(respuestasAsistencia);
    }
}


// Función para obtener una respuesta aleatoria de ayuda
function obtenerRespuestaAleatoriaAyuda(respuestas) {
    const indiceAleatorio = Math.floor(Math.random() * respuestas.length);
    return respuestas[indiceAleatorio];
}



async function respuestaParaVinoTinto(mensaje) {
    mensaje = mensaje.toLowerCase();
    const palabrasUsuario = mensaje.split(/\s+/);

    // Para cuando no encuentra DO 
    let mensajeIntroductorioSinDO;
    let DOUsuarioBBDD;
    let mensajeCierreSinDO;



    // Revisar si el mensaje busca recomendaciones de vino tinto
    if (/recomendar|sugerir|mejor|cuál es/.test(mensaje) && /vino(s)? tint(o|os)|vino(s)?/.test(mensaje)) {

        const mejores = /mejores|top|mejor valorados|mejor|más populares/.test(mensaje);    // Para el caso de los mejores

        // Obtener palabras clave de DO de la base de datos
        const palabrasClaveDO = await obtenerPalabrasClaveDO();

        let DOEncontrada;
        let busquedaPorCalificacion;
        let menorDistancia = Infinity;
        const umbralDistancia = 2.5;

        for (const doNombre of palabrasClaveDO) {
            const longitudDO = doNombre.split(/\s+/).length;
            const combinacionesUsuario = crearCombinacionesDePalabras(palabrasUsuario, longitudDO);

            for (const combinacionUsuario of combinacionesUsuario) {
                const distancia = levenshtein(combinacionUsuario, doNombre.toLowerCase());
                if (distancia < menorDistancia && distancia <= umbralDistancia) {
                    menorDistancia = distancia;
                    DOEncontrada = doNombre;
                }
            }
        }

        console.log('DO: ' + DOEncontrada);

        if (DOEncontrada) {

            let botellas;

            // Procesar la solicitud específica de la DO
            if (mejores) {
                console.log('Devolver respuesta de la DO ordenada por calificaciones');
                botellas = await obtenerBotellasPorDOOrdenadasPorCalificacion(DOEncontrada);
            }
            else {
                console.log('Devolver respuesta de la DO');
                botellas = await obtenerBotellasPorDO(DOEncontrada);
            }

            // console.log(estadoUsuario);
            // actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), 'vino tinto', DOEncontrada);


            // Crear el mensaje introductorio

            let mensajeIntroductorio;
            let mensajeCierre;

            if (mejores) {
                mensajeIntroductorio = `Claro! te voy a recomendar los <strong>tres mejores</strong> vinos tintos de ${DOEncontrada}:`;
                busquedaPorCalificacion = 1;
                mensajeCierre = `Si quieres que muestre más solo dímelo!.`;
            }
            else {
                mensajeIntroductorio = `Claro! Puedo recomendar <strong>algunos</strong> vinos tintos de ${DOEncontrada}:`;
                busquedaPorCalificacion = 0;
                mensajeCierre = `Si quieres que muestre más solo dímelo!.`;
            }



            // Crear un array de mensajes, uno para cada botella
            const mensajesRespuesta = botellas.map(botella =>
                `<strong>${botella.Nombre} (${botella.AnoCosecha})</strong><br>${botella.Descripcion}<br><strong>Precio:</strong> ${botella.Precio}€<br><strong>Stock:</strong> ${botella.Stock} unidades<br><strong>Calificación:</strong> ${botella.Calificacion}/5.`
            );


            // Supongamos que botellas es el array de objetos de botella obtenidos de la base de datos
            let idsBotellas = botellas.map(botella => botella.BotellaID); // Asumiendo que cada botella tiene un 'id'

            console.log('IDS botellas:' + idsBotellas);

            actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), 'vino tinto', DOEncontrada, idsBotellas, busquedaPorCalificacion, 0);
            // console.log(estadoUsuario);




            // Añadir el mensaje introductorio al principio del array
            mensajesRespuesta.unshift(mensajeIntroductorio);

            // Añadir el mensaje de cierre al final del array
            mensajesRespuesta.push(mensajeCierre);

            // console.log(mensajesRespuesta);

            return mensajesRespuesta; // Devuelve el array de mensajes


        } else {    // SIN DO o no encontrada

            try {
                const datos = await fs2.readFile('DatosDO/doFichero.txt', 'utf8');
                const listaDOs = datos.split(/\r?\n/).map(doNombre => doNombre.trim().toLowerCase());

                // Crear una expresión regular que combine todas las DOs, separadas por '|'
                const regexDOs = new RegExp('\\b(' + listaDOs.join('|') + ')\\b', 'i');

                // Buscar en todo el mensaje, no solo después de 'de'
                const coincidencia = mensaje.toLowerCase().match(regexDOs);
                const DOUsuario = coincidencia ? coincidencia[1] : null;

                let descripcionDO;

                if (DOUsuario) {
                    console.log('La Denominación existe pero no esta guardada:', DOUsuario);
                    // Procesa la DO encontrada en la lista

                    // Incluye una pregunta sobre la Denominación de Origen en la solicitud
                    const completion = await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: `¿Qué puedes decirme sobre la Denominación de Origen ${DOUsuario}?, resume en 3 líneas.` }
                        ],
                    });

                    // Guardar el contenido de la respuesta en la variable
                    descripcionDO = completion.choices[0].message.content;
                    console.log(descripcionDO);

                    // Insertar la DO en BBDD
                    if (descripcionDO) {
                        insertarDO(DOUsuario, descripcionDO);
                    }


                    const completion2 = await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [
                            { role: "system", content: "You are a helpful assistant." },
                            { role: "user", content: `Dame una lista de botellas de vino tinto de la Denominación de Origen ${DOUsuario}, incluyendo detalles como nombre, año de cosecha, región, descripción, precio (en dólares), volumen, stock (indicando 0 si está agotado), tipo de uva: (Tempranillo, etc...) y bodega:.` }
                        ],
                    });

                    // Aquí asumimos que la respuesta incluirá información sobre botellas de vino tinto
                    const respuestaChatGPT = completion2.choices[0].message.content;
                    console.log(respuestaChatGPT);

                    const botellasParsed = parsearBotellas(respuestaChatGPT, DOUsuario);
                    console.log(botellasParsed);

                    let bodegasYDOs = [];

                    // Array de las botellas obtenidas para setear datos y ver bodegas
                    botellasParsed.forEach(botella => {
                        botella.region = capitalizarPrimeraLetra(DOUsuario);

                        const bodegaBot = botella.bodega;

                        // Agrega cada combinación de bodega y DO al array
                        bodegasYDOs.push({
                            bodega: botella.bodega,
                            DO: botella.region
                        });

                    });
                    console.log(botellasParsed);
                    // Ahora puedes usar bodegasYDOs fuera del bucle
                    console.log("Bodegas y DOs:", bodegasYDOs);

                    // Array para almacenar la información extraída
                    let informacionBodegas = [];

                    for (const bodegaDO of bodegasYDOs) {
                        let nombreBodega = bodegaDO.bodega;
                        let DOBodega = bodegaDO.DO;

                        // Ahora puedes usar 'await' dentro del bucle
                        const completion3 = await openai.chat.completions.create({
                            model: "gpt-4",
                            messages: [
                                { role: "system", content: "You are a helpful assistant." },
                                { role: "user", content: `Dame los siguientes datos de la bodega de vino española: ${nombreBodega} situada en la siguiente Denominación de Origen: ${DOBodega}, el resultado de ser posible dámelo en forma de lista: Descripción (1 lineas), Año de Fundación de la bodega (necesario) y correo de contacto para la misma , tienes que inventar el correo de todas las bodegas.` }
                            ],
                        });

                        const respuestaChatGPT = completion3.choices[0].message.content;
                        console.log(respuestaChatGPT);

                        const infoBodega = analizarRespuestaChatGPT(respuestaChatGPT);

                        if (infoBodega) {
                            // Agregar la información extraída al array, junto con el nombre y DO de la bodega
                            informacionBodegas.push({
                                nombreBodega: nombreBodega,
                                DOBodega: DOBodega,
                                ...infoBodega
                            });
                        }

                        console.log("--------------------------------------")
                        console.log("Información recopilada de las bodegas:", informacionBodegas);
                        console.log("--------------------------------------")



                        // onsole.log(`Bodega: ${nombreBodega}, DO: ${DOBodega}`);
                        // Aquí puedes llamar a funciones que hagan algo con estos valores
                    }


                    // Debemos ver las bodegas una por una y con ello ver si podemos meter en BBDD

                    // Tras completar el bucle, procesar la información fuera de él
                    informacionBodegas.forEach(bodega => {
                        // Aquí puedes verificar cada objeto de bodega
                        // y decidir si lo insertas en la base de datos
                        console.log("Vamos a insertar la bodega:");
                        console.log(bodega);

                        // Ejemplo: Si 'anoFundacion' no es 'Información no disponible', insertar en BBDD
                        if (bodega.anoFundacion !== 'Información no disponible') {
                            // Llamada a tu función para insertar en BBDD
                            insertarBodegaEnBBDD(bodega);

                        }
                    });

                    // Una vez que hemos ingresado Bodegas ahora vamos a insertar las Botellas
                    for (const botella of botellasParsed) {
                        console.log("BOTELLA");
                        console.log("-------");
                        console.log("TIPO DE UVA A BUSCAR: " + botella.tipoUva);
                        let uva = await comprobarUva(botella.tipoUva);  // Espera a que esta promesa se resuelva
                        console.log('UVA DEL FICHERO: ' + uva);
                        if (uva == null) {    // La uva no estaba en el fichero de UVAS
                            // Necesito obtener información de ChatGPT
                            console.log('VAMOS A BUSCAR INFO DE UVA NUEVA EN CHATGPT:');

                            // Ahora puedes usar 'await' dentro del bucle
                            const completion4 = await openai.chat.completions.create({
                                model: "gpt-4",
                                messages: [
                                    { role: "system", content: "You are a helpful assistant." },
                                    { role: "user", content: `Dame los siguientes datos sobre este tipo de uva: ${botella.tipoUva}, los datos que me tienes que dar en forma de lista son: Características: , Notas de Sabor: y Descripción: ` }
                                ],
                            });

                            const respuestaChatGPT2 = completion4.choices[0].message.content;
                            console.log(respuestaChatGPT2);







                        }
                        await verificarYAgregarUva(uva, DOUsuario, db); // Espera a que esta promesa se resuelva
                    }


                    // En este punto hemos comprobado BODEGA, si no existe la insertamos
                    // Tambien hemos comprobado el tipo de Uva, sin no existe lo insertamos
                    // Ahora lo que queda después de las comprobaciones debemos insertar la botella

                    await procesarBotellas(botellasParsed, DOUsuario);  // Esperar a que se inserten las botellas

                    mensajeIntroductorioSinDO = `Claro! Puedo recomendar <strong>algunos</strong> vinos tintos de ${DOUsuario}:`;

                    mensajeCierreSinDO = `Si quieres que muestre más solo dímelo!.`;

                    DOUsuarioBBDD = capitalizarPrimeraLetra(DOUsuario);

                } else {
                    return ["Lo siento, pero creo que esa DO de la que me estás hablando no existe"];
                }
            } catch (error) {
                console.error('Error al leer el archivo:', error);
                return ["Hubo un error al procesar tu solicitud."];
            }


            if (mejores) {    // Mejores vinos tintos de la aplicacion

                busquedaPorCalificacion = 1;

                let botellas = await obtenerBotellasPorTipoVinoOrdenadasPorCalificacion("Tinto");

                let mensajeIntroductorio = `Claro! te voy a recomendar los <strong>tres mejores vinos tintos</strong> de la aplicación:`;
                let mensajeCierre = `Si quieres que muestre más solo dímelo!.`;

                // Crear un array de mensajes, uno para cada botella
                const mensajesRespuesta = botellas.map(botella =>
                    `<strong>${botella.Nombre} (${botella.AnoCosecha})</strong><br>${botella.Descripcion}<br><strong>Precio:</strong> ${botella.Precio}€<br><strong>Stock:</strong> ${botella.Stock} unidades<br><strong>Calificación:</strong> ${botella.Calificacion}/5.`
                );

                let idsBotellas = botellas.map(botella => botella.BotellaID); // Asumiendo que cada botella tiene un 'id'

                console.log('IDS botellas:' + idsBotellas);

                actualizarEstadoUsuario(obtenerUserIDDeSessionActual(), 'vino tinto', '', idsBotellas, busquedaPorCalificacion, 0);

                // Añadir el mensaje introductorio al principio del array
                mensajesRespuesta.unshift(mensajeIntroductorio);

                // Añade el mensaje de cierre al final del array
                mensajesRespuesta.push(mensajeCierre);

                return mensajesRespuesta; // Devuelve el array de mensajes
            }
            else {
                // Busqueda en ChatGPT
                console.log(mensajeIntroductorioSinDO);
                console.log(DOUsuarioBBDD);
                busquedaPorCalificacion = 0;

                console.log('Devolver respuesta de la DO');
                botellas = await obtenerBotellasPorDO(DOUsuarioBBDD);


                // Crear un array de mensajes, uno para cada botella
                const mensajesRespuesta = botellas.map(botella =>
                    `<strong>${botella.Nombre} (${botella.AnoCosecha})</strong><br>${botella.Descripcion}<br><strong>Precio:</strong> ${botella.Precio}€<br><strong>Stock:</strong> ${botella.Stock} unidades<br><strong>Calificación:</strong> ${botella.Calificacion}/5.`
                );


                // Supongamos que botellas es el array de objetos de botella obtenidos de la base de datos
                let idsBotellas = botellas.map(botella => botella.BotellaID); // Asumiendo que cada botella tiene un 'id'

                console.log('IDS botellas:' + idsBotellas);



                return obtenerRespuestaAleatoriaVinoTinto(respuestasRecomendacionVinoTinto);
            }

        }
    }
    // Revisar si el mensaje busca características de vino tinto
    else if (/características|propiedades|perfil|sabor|aroma/.test(mensaje) && /vino tinto/.test(mensaje)) {
        return obtenerRespuestaAleatoriaVinoTinto(respuestasCaracteristicasVinoTinto);
    }
    // Revisar si el mensaje pregunta sobre maridaje de vino tinto
    else if (/maridaje|acompañar|pareja|combinar/.test(mensaje) && /vino tinto/.test(mensaje)) {
        return obtenerRespuestaAleatoriaVinoTinto(respuestasMaridajeVinoTinto);
    }
    // Respuesta por defecto para preguntas sobre vino tinto
    else {
        return obtenerRespuestaAleatoriaVinoTinto(respuestasGenericasVinoTinto);
    }
}


function capitalizarPrimeraLetra(cadena) {
    return cadena.charAt(0).toUpperCase() + cadena.slice(1).toLowerCase();
}



function analizarRespuestaChatGPT(respuesta) {
    let descripcion = "Información no disponible";
    let anoFundacion = "Información no disponible";
    let correoContacto = "Información no disponible";

    // Extraer descripción
    let matchDescripcion = respuesta.match(/Descripción: (.+?)(?=\n|$)/);
    if (matchDescripcion) descripcion = matchDescripcion[1];

    // Extraer año de fundación
    let matchAnoFundacion = respuesta.match(/Año de Fundación: (\d{4})|se fundó en (\d{4})|Año de Fundación de la bodega: (\d{4})|Año de fundación: (\d{4})|Fue fundada en el año (\d{4})|La bodega fue fundada en (\d{4})|fue fundada en (\d{4})|fue fundada en el año (\d{4})|Fundada en (\d{4})|Año de Fundación de la Bodega: (\d{4})/);
    if (matchAnoFundacion) {
        anoFundacion = matchAnoFundacion[1] || matchAnoFundacion[2] || matchAnoFundacion[3] || matchAnoFundacion[4] || matchAnoFundacion[5] || matchAnoFundacion[6] || matchAnoFundacion[7] || matchAnoFundacion[8] || matchAnoFundacion[9] || matchAnoFundacion[10];
    }


    // Intentar extraer cualquier correo electrónico de la respuesta
    let matchCorreo = respuesta.match(/[\w.-]+@[\w.-]+\.\w+/);
    // También intentar extraer si viene precedido de "Correo de contacto para la bodega:"
    let matchCorreoAlternativo = respuesta.match(/Correo de contacto para la bodega: (\S+@\S+\.\S+)/);
    correoContacto = matchCorreo ? matchCorreo[0] : (matchCorreoAlternativo ? matchCorreoAlternativo[1] : correoContacto);

    return { descripcion, anoFundacion, correoContacto };
}




// Función principal que procesa las botellas
async function procesarBotellas(botellasParsed, DOUsuario) {
    console.log('VAMOS A PROCEDER A INSERTAR LAS BOTELLAS EN BBDD');
    for (const botella of botellasParsed) {
        console.log('BOTELLA: ----------------');
        console.log(botella);

        botella.do = capitalizarPrimeraLetra(DOUsuario);
        console.log('BOTELLA NOMBRE: ' + botella.nombre);
        console.log('DO BOTELLA: ' + botella.do);
        console.log('TIPO UVA: ' + botella.tipoUva);
        console.log('NOMBRE BODEGA: ' + botella.bodega);

        try {
            const uvaId = await consultarUvaId(botella.tipoUva);
            const doId = await consultarDoId(botella.do);
            const bodegaId = await consultarBodegaId(botella.bodega);

            console.log('UvaId:', uvaId);
            console.log('DOId:', doId);
            console.log('BodegaId:', bodegaId);

            if (uvaId != null && doId != null && bodegaId != null) {  // TODO CORRECTO

                // INSERTAR BOTELLA EN BBDD
                const resultadoInsercion = await insertarBotellaTinto(botella, uvaId, doId, bodegaId);
                console.log('Botella insertada con éxito:', resultadoInsercion);



            }

        } catch (error) {
            console.error('Error procesando botella:', error);
        }
    }
}


async function insertarBotellaTinto(botella, uvaId, doId, bodegaId) {
    return new Promise((resolve, reject) => {
        // Construir la sentencia SQL INSERT
        let query = `
            INSERT INTO Botellas (
                Nombre, AnoCosecha, Region, Descripcion, Precio, 
                Volumen, Stock, UvaID, TipoVinoID, DOID, BodegaID
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

        // Preparar los valores para la inserción
        let valores = [
            botella.nombre, botella.anoCosecha, botella.region,
            botella.descripcion, botella.precio, botella.volumen,
            botella.stock, uvaId, 1, doId, bodegaId // TipoVinoID es siempre 1 (tinto)
        ];

        // Ejecutar la consulta
        db.query(query, valores, function (err, results) {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
}






// Función para consultar el ID de la bodega
function consultarBodegaId(nombreBodega) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT BodegaID FROM Bodegas WHERE Nombre = ?';
        db.query(query, [nombreBodega], function (err, results) {
            if (err) {
                return reject(err);
            }
            const bodegaId = results.length > 0 ? results[0].BodegaID : null;
            resolve(bodegaId);
        });
    });
}


// Función para consultar el ID de la DO
function consultarDoId(doNombre) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT DOID FROM DenominacionesDeOrigen WHERE Nombre = ?';
        db.query(query, [doNombre], function (err, results) {
            if (err) {
                return reject(err);
            }
            const doId = results.length > 0 ? results[0].DOID : null;
            resolve(doId);
        });
    });
}



// Función para consultar el ID de la uva
function consultarUvaId(tipoUva) {
    return new Promise((resolve, reject) => {
        let query = 'SELECT UvaID FROM TiposDeUvas WHERE Nombre = ?';
        db.query(query, [tipoUva], function (err, results) {
            if (err) {
                return reject(err);
            }
            const uvaId = results.length > 0 ? results[0].UvaID : null;
            resolve(uvaId);
        });
    });
}













function parsearBotellas(respuesta) {
    // Modificar para dividir usando "Nombre", "Botella" y "Vino Nombre"
    const botellas = respuesta.split(/\d+\.\s(?:Nombre|Botella|Vino Nombre):/).slice(1);

    const botellasParsed = botellas.map(botella => {
        // Asegurarse de agregar "Nombre:", "Botella:" o "Vino Nombre:" al principio de cada botella
        if (!botella.startsWith("Nombre:") && !botella.startsWith("Botella:") && !botella.startsWith("Vino Nombre:")) {
            botella = "Nombre:" + botella;
        }

        // El resto del código para extraer los detalles de cada botella
        const nombre = botella.match(/(?:Nombre|Vino Nombre):\s*(.+)/)?.[1].trim();
        const anoCosecha = botella.match(/Año de Cosecha:\s*(\d+)/i)?.[1].trim();
        const region = botella.match(/Región:\s*(.+)/)?.[1].trim();
        const descripcion = botella.match(/Descripción:\s*(.+)/)?.[1].trim();
        const precio = parseFloat(botella.match(/Precio:\s*\$(.+)/)?.[1].trim());
        const volumen = botella.match(/Volumen:\s*(.+)/)?.[1].replace(/\s+ml/, 'ml').trim();
        let stock = botella.match(/Stock:\s*(.+)/)?.[1].trim();
        stock = stock.includes('(agotado)') ? 0 : parseInt(stock);
        let tipoUva = botella.match(/(?:Tipo de Uva|Uva):\s*(.+)/i)?.[1].trim();
        if (tipoUva && tipoUva.includes('(')) {
            tipoUva = tipoUva.split('(').map(part => part.trim().replace(/\)$/, '')).join(' - '); // Formato "Uva - Alias"
        }
        const bodega = botella.match(/Bodega:\s*(.+)/)?.[1].trim();

        return { nombre, anoCosecha, region, descripcion, precio, volumen, stock, tipoUva, bodega };
    });

    return botellasParsed;
}















function crearCombinacionesDePalabras(palabras, longitud) {
    let combinaciones = [];
    for (let i = 0; i <= palabras.length - longitud; i++) {
        combinaciones.push(palabras.slice(i, i + longitud).join(' '));
    }
    return combinaciones;
}







function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // Incrementar a lo largo de la primera columna de cada fila
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // Incrementar cada columna en la primera fila
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Rellenar el resto de la matriz
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // sustitución
                    matrix[i][j - 1] + 1,      // inserción
                    matrix[i - 1][j] + 1);     // eliminación
            }
        }
    }

    return matrix[b.length][a.length];
}




function primeraLetraMayuscula(cadena) {
    if (!cadena) return cadena;
    return cadena.charAt(0).toUpperCase() + cadena.slice(1);
}



/*
// Método para insertar la DO
function insertarDO(nombre, descripcion) {
    // Transformar la primera letra del nombre a mayúscula
    nombre = primeraLetraMayuscula(nombre);
    const query = 'INSERT INTO DenominacionesDeOrigen (Nombre, Descripcion) VALUES (?, ?)';
    db.query(query, [nombre, descripcion], function (error, results, fields) {
        if (error) throw error;
        console.log('Denominación de Origen insertada con ID:', results.insertId);
    });
}
*/



async function insertarBodegaEnBBDD(bodega) {
    // Suponiendo que tienes una conexión a la base de datos llamada 'db'
    const query = `INSERT INTO Bodegas (Nombre, Region, Descripcion, AnoFundacion, ImagenURL, ContactoEmail) VALUES (?, ?, ?, ?, ?, ?)`;

    // Valores a insertar en la base de datos
    const valores = [bodega.nombreBodega, bodega.DOBodega, bodega.descripcion, parseInt(bodega.anoFundacion), '[URL de imagen]', bodega.correoContacto];

    // Ejecutar la consulta SQL
    db.query(query, valores, (error, resultados) => {
        if (error) {
            // Manejar el error
            console.error('Error al insertar en la base de datos:', error);
        } else {
            // La inserción fue exitosa
            console.log('Bodega insertada con éxito:', resultados);
        }
    });
}



async function verificarYAgregarUva(nombreUva, regionPredominante, db) {
    nombreUva = capitalizarPrimeraLetra(nombreUva);
    console.log('VAMOS A COMPROBAR EL TIPO DE UVA: ' + nombreUva);

    try {
        const resultados = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM TiposDeUvas WHERE Nombre = ?', [nombreUva], (error, resultados) => {
                if (error) {
                    console.error('Error al consultar la base de datos:', error);
                    return reject(error);
                }
                resolve(resultados);
            });
        });

        if (resultados.length === 0) {
            console.log('EL TIPO DE UVA NO EXISTE: ' + nombreUva);
            await insertarNuevaUva(nombreUva, regionPredominante, db);
        } else {
            console.log('El tipo de uva ya existe:', resultados);
        }

        // Devolver el nombre de la uva
        return nombreUva;

    } catch (error) {
        console.error('Error en verificarYAgregarUva:', error);
        throw error; // O manejar el error como prefieras
    }
}


async function insertarNuevaUva(nombreUva, regionPredominante, db) {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO TiposDeUvas (Nombre, RegionPredominante) VALUES (?, ?)';
        db.query(query, [nombreUva, regionPredominante], (error, resultados) => {
            if (error) {
                console.error('Error al insertar la nueva uva:', error);
                return reject(error);
            }
            console.log('Tipo de uva insertado con éxito:', resultados);
            resolve(resultados);
        });
    });
}



async function comprobarUva(mensaje) {
    try {
        // Leer el fichero 'uvaFichero.txt'
        const datos = await fs2.readFile('DatosUVA/uvaFichero.txt', 'utf8');

        // Dividir los datos en líneas y procesar cada nombre de uva
        const listaUvas = datos.split(/\r?\n/).map(uvaNombre => uvaNombre.trim().toLowerCase());

        // Crear una expresión regular que combine todos los nombres de uvas, separados por '|'
        const regexUvas = new RegExp('\\b(' + listaUvas.join('|') + ')\\b', 'i');

        // Buscar en todo el mensaje la coincidencia con alguna uva
        const coincidencia = mensaje.toLowerCase().match(regexUvas);
        const uvaUsuario = coincidencia ? coincidencia[1] : null;

        return uvaUsuario;
    } catch (error) {
        console.error('Error al leer el archivo:', error);
    }
}





function procesarRespuestaAI(respuesta) {
    // Suponiendo que la respuesta es un texto donde cada detalle está separado por líneas
    const lineas = respuesta.split('\n');

    let caracteristicas = '';
    let regionPredominante = '';
    let notasDeSabor = '';
    let descripcion = '';

    lineas.forEach(linea => {
        if (linea.startsWith('Características:')) {
            caracteristicas = linea.replace('Características:', '').trim();
        } else if (linea.startsWith('Región Predominante:')) {
            regionPredominante = linea.replace('Región Predominante:', '').trim();
        } else if (linea.startsWith('Notas de Sabor:')) {
            notasDeSabor = linea.replace('Notas de Sabor:', '').trim();
        } else if (linea.startsWith('Descripción:')) {
            descripcion = linea.replace('Descripción:', '').trim();
        }
    });

    return [caracteristicas, regionPredominante, notasDeSabor, descripcion];
}




const util = require('util');
const dbQuery = util.promisify(db.query).bind(db);

async function obtenerPalabrasClaveMaridaje() {
    try {
        const resultado = await dbQuery("SELECT DISTINCT Maridaje FROM Botellas");
        if (resultado && resultado.length > 0) {
            const palabrasClaveMaridaje = resultado.map(row => row.Maridaje.split(',').map(palabra => palabra.trim()));
            return palabrasClaveMaridaje.flat();
        } else {
            console.error('No se encontraron resultados o el formato no es el esperado:', resultado);
            return [];
        }
    } catch (error) {
        console.error('Error al obtener palabras clave de maridaje:', error);
        throw error;
    }
}

















async function obtenerNombresBotellas() {
    return new Promise((resolve, reject) => {
        db.query('SELECT Nombre FROM Botellas', (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else {
                // Mapear los resultados para obtener un array de nombres de DO
                const palabrasClaveDO = results.map(row => row.Nombre);
                resolve(palabrasClaveDO);
            }
        });
    });
}













async function obtenerPalabrasClaveDO() {
    return new Promise((resolve, reject) => {
        db.query('SELECT Nombre FROM DenominacionesDeOrigen', (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else {
                // Mapear los resultados para obtener un array de nombres de DO
                const palabrasClaveDO = results.map(row => row.Nombre);
                resolve(palabrasClaveDO);
            }
        });
    });
}


async function obtenerPalabrasClaveTipoUva() {
    return new Promise((resolve, reject) => {
        db.query('SELECT Nombre FROM TiposDeUvas', (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else {
                // Mapear los resultados para obtener un array de nombres de Tipos de Uvas
                const palabrasClaveTiposUvas = results.map(row => row.Nombre);
                resolve(palabrasClaveTiposUvas);
            }
        });
    });
}


async function obtenerNombresBodegas() {
    return new Promise((resolve, reject) => {
        db.query('SELECT Nombre FROM Bodegas', (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else {
                // Mapear los resultados para obtener un array de nombres de Tipos de Uvas
                const nombresBodegas = results.map(row => row.Nombre);
                resolve(nombresBodegas);
            }
        });
    });
}


async function obtenerNombresDO() {
    return new Promise((resolve, reject) => {
        db.query('SELECT Nombre FROM DenominacionesDeOrigen', (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else {
                // Mapear los resultados para obtener un array de nombres de Tipos de Uvas
                const nombresDO = results.map(row => row.Nombre);
                resolve(nombresDO);
            }
        });
    });
}








async function insertarTipoDeUva(nombre, caracteristicas, region, notasDeSabor, descripcion) {

    const sql = `INSERT INTO TiposDeUvas (Nombre, Caracteristicas, RegionPredominante, NotasDeSabor, Descripcion) VALUES (?, ?, ?, ?, ?)`;
    const valores = [nombre, caracteristicas, region, notasDeSabor, descripcion];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    })
}


async function insertarBodega(nombre, region, descripcion, anoFundacion, email) {

    const sql = `INSERT INTO Bodegas (Nombre, Region, Descripcion, AnoFundacion, ContactoEmail) VALUES (?, ?, ?, ?, ?)`;
    const valores = [nombre, region, descripcion, anoFundacion, email];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    })
}



async function insertarDO(nombreDO, descripcion) {

    const sql = `INSERT INTO DenominacionesDeOrigen (Nombre, Descripcion) VALUES (?, ?)`;
    const valores = [nombreDO, descripcion];

    return new Promise((resolve, reject) => {
        db.query(sql, valores, (error, resultados) => {
            if (error) {
                reject(error);
            } else {
                resolve(resultados);
            }
        });
    })
}






async function obtenerHistoriaVino(tipoVinoID) {
    return new Promise((resolve, reject) => {

        db.query(`SELECT Historia FROM vinoshistoria WHERE TipoVinoID = ${tipoVinoID}`, (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else if (results.length === 0) {
                // No se encontró el tipo de vino
                resolve('No se encontró información para el tipo de vino especificado.');
            } else {
                // Retorna la descripción del primer registro (asumiendo que TipoVinoID es único)
                resolve(results[0].Historia);
            }
        });
    });
}



async function obtenerRespuestaAleatoriaAlmacenamientoVino() {
    return new Promise((resolve, reject) => {
        db.query("SELECT Respuesta FROM AlmacenamientoVinoFAQ ORDER BY RAND() LIMIT 1", (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else if (results.length === 0) {
                // No se encontraron respuestas
                resolve('No hay respuestas disponibles en este momento.');
            } else {
                // Retorna la respuesta aleatoria
                resolve(results[0].Respuesta);
            }
        });
    });
}



async function obtenerRespuestaAleatoriaAlmacenamientoServicio() {
    return new Promise((resolve, reject) => {
        db.query("SELECT Respuesta FROM ServicioFAQ ORDER BY RAND() LIMIT 1", (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else if (results.length === 0) {
                // No se encontraron respuestas
                resolve('No hay respuestas disponibles en este momento.');
            } else {
                // Retorna la respuesta aleatoria
                resolve(results[0].Respuesta);
            }
        });
    });
}



















async function obtenerDescripcionTipoUva(nombreUva) {
    return new Promise((resolve, reject) => {
        // Asegúrate de que nombreUva es una cadena segura para usar en una consulta SQL
        // para prevenir inyecciones SQL
        const nombreUvaSeguro = mysql.escape(nombreUva);

        db.query(`SELECT Descripcion FROM TiposDeUvas WHERE Nombre = ${nombreUvaSeguro}`, (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else if (results.length === 0) {
                // No se encontró la uva
                resolve('No se encontró información para el tipo de uva especificado.');
            } else {
                // Retorna la descripción de la primera fila (asumiendo que Nombre es único)
                resolve(results[0].Descripcion);
            }
        });
    });
}


async function obtenerDescripcionDO(nombreDO) {
    return new Promise((resolve, reject) => {
        // Asegúrate de que nombreUva es una cadena segura para usar en una consulta SQL
        // para prevenir inyecciones SQL
        const nombreDOSeguro = mysql.escape(nombreDO);

        db.query(`SELECT Descripcion FROM DenominacionesDeOrigen WHERE Nombre = ${nombreDOSeguro}`, (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else if (results.length === 0) {
                // No se encontró la uva
                resolve('No se encontró información para la DO especificada.');
            } else {
                // Retorna la descripción de la primera fila (asumiendo que Nombre es único)
                resolve(results[0].Descripcion);
            }
        });
    });
}




async function obtenerDescripcionBodega(nombreBodega) {
    return new Promise((resolve, reject) => {
        // Asegúrate de que nombreUva es una cadena segura para usar en una consulta SQL
        // para prevenir inyecciones SQL
        const nombreBodegaSeguro = mysql.escape(nombreBodega);

        db.query(`SELECT Descripcion FROM Bodegas WHERE Nombre = ${nombreBodegaSeguro}`, (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else if (results.length === 0) {
                // No se encontró la uva
                resolve('No se encontró información para la bodega especificada.');
            } else {
                // Retorna la descripción de la primera fila (asumiendo que Nombre es único)
                resolve(results[0].Descripcion);
            }
        });
    });
}












async function obtenerNombreYTiposDeUvas(idsExcluir) {
    return new Promise((resolve, reject) => {
        let sql = 'SELECT UvaID, Nombre, Descripcion FROM TiposDeUvas';

        // Agregar condición para excluir ID's si se proporciona el array y no está vacío
        if (idsExcluir && idsExcluir.length > 0) {
            const idsExcluirSQL = idsExcluir.join(', ');
            sql += ` WHERE UvaID NOT IN (${idsExcluirSQL})`;
        }

        sql += ' LIMIT 5';

        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else if (results.length === 0) {
                resolve('No se encontraron tipos de uva.');
            } else {
                resolve(results);
            }
        });
    });
}



async function obtenerNombre_Region_DescripcionBodegas(idsExcluir) {
    return new Promise((resolve, reject) => {
        let sql = 'SELECT BodegaID, Nombre, Region, Descripcion FROM Bodegas';

        // Agregar condición para excluir ID's si se proporciona el array y no está vacío
        if (idsExcluir && idsExcluir.length > 0) {
            const idsExcluirSQL = idsExcluir.join(', ');
            sql += ` WHERE BodegaID NOT IN (${idsExcluirSQL})`;
        }

        sql += ' LIMIT 5';

        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else if (results.length === 0) {
                resolve('No se encontraron tipos de uva.');
            } else {
                resolve(results);
            }
        });
    });
}


async function obtenerNombre_DescripcionDOs(idsExcluir) {
    return new Promise((resolve, reject) => {
        let sql = 'SELECT DOID, Nombre, Descripcion FROM DenominacionesDeOrigen';

        // Agregar condición para excluir ID's si se proporciona el array y no está vacío
        if (idsExcluir && idsExcluir.length > 0) {
            const idsExcluirSQL = idsExcluir.join(', ');
            sql += ` WHERE DOID NOT IN (${idsExcluirSQL})`;
        }

        sql += ' LIMIT 5';

        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else if (results.length === 0) {
                resolve('No se encontraron descripciones DOs.');
            } else {
                resolve(results);
            }
        });
    });
}









async function obtenerBotellasPorDO(nombreDO) {
    return new Promise((resolve, reject) => {
        console.log('estamos buscando botellas');
        const query = `
        SELECT
        B.BotellaID, 
        B.Nombre,
        B.AnoCosecha,
        B.Descripcion,
        B.Precio,
        B.Volumen,
        B.Stock,
        B.Calificacion
    FROM 
        Botellas B -- Alias para la tabla Botellas
    JOIN 
        TiposDeVino TV ON B.TipoVinoID = TV.TipoVinoID
    JOIN 
        DenominacionesDeOrigen DO ON B.DOID = DO.DOID
    WHERE 
        DO.Nombre = ? AND
        TV.Nombre = 'Tinto'
    LIMIT 5;
        `;
        db.query(query, [nombreDO], (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else {
                // console.log(results);
                resolve(results);
            }
        });
    });
}





async function obtenerBotellasPorDOOrdenadasPorCalificacion(nombreDO) {
    return new Promise((resolve, reject) => {
        console.log('Estamos buscando botellas ordenadas por calificación');
        const query = `
        SELECT
            B.BotellaID, 
            B.Nombre,
            B.AnoCosecha,
            B.Descripcion,
            B.Precio,
            B.Volumen,
            B.Stock,
            B.Calificacion
        FROM 
            Botellas B
        JOIN 
            TiposDeVino TV ON B.TipoVinoID = TV.TipoVinoID
        JOIN 
            DenominacionesDeOrigen DO ON B.DOID = DO.DOID
        WHERE 
            DO.Nombre = ? AND
            TV.Nombre = 'Tinto'
        ORDER BY 
            B.Calificacion DESC
        LIMIT 3;
        `;

        db.query(query, [nombreDO], (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else {
                // console.log(results);
                resolve(results);
            }
        });
    });
}



async function obtenerBotellasPorTipoVinoOrdenadasPorCalificacion(tipoVino) {
    return new Promise((resolve, reject) => {
        console.log('Estamos buscando botellas del tipo ' + tipoVino + ' ordenadas por calificación');
        const query = `
        SELECT
            B.BotellaID,
            B.Nombre,
            B.AnoCosecha,
            B.Descripcion,
            B.Precio,
            B.Volumen,
            B.Stock,
            B.Calificacion
        FROM 
            Botellas B
        JOIN 
            TiposDeVino TV ON B.TipoVinoID = TV.TipoVinoID
        WHERE 
            TV.Nombre = ?
        ORDER BY 
            B.Calificacion DESC
        LIMIT 3;
        `;

        db.query(query, [tipoVino], (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else {
                // console.log(results);
                resolve(results);
            }
        });
    });
}




async function obtenerNuevasBotellasPorDO(nombreDO, idsExcluidos) {
    return new Promise((resolve, reject) => {
        console.log('Buscando nuevas botellas que no estén en:', idsExcluidos);
        const query = `
        SELECT
            B.BotellaID, 
            B.Nombre,
            B.AnoCosecha,
            B.Descripcion,
            B.Precio,
            B.Volumen,
            B.Stock,
            B.Calificacion
        FROM 
            Botellas B
        JOIN 
            TiposDeVino TV ON B.TipoVinoID = TV.TipoVinoID
        JOIN 
            DenominacionesDeOrigen DO ON B.DOID = DO.DOID
        WHERE 
            DO.Nombre = ? AND
            TV.Nombre = 'Tinto' AND
            B.BotellaID NOT IN (?)
        LIMIT 5;
        `;
        db.query(query, [nombreDO, idsExcluidos], (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}


async function obtenerBotellasPorDOOrdenadasPorCalificacionAdiccion(nombreDO, idsExcluidos) {
    return new Promise((resolve, reject) => {
        console.log('Buscando botellas de ' + nombreDO + ' ordenadas por calificación, excluyendo:', idsExcluidos);
        const query = `
        SELECT
            B.BotellaID, 
            B.Nombre,
            B.AnoCosecha,
            B.Descripcion,
            B.Precio,
            B.Volumen,
            B.Stock,
            B.Calificacion
        FROM 
            Botellas B
        JOIN 
            TiposDeVino TV ON B.TipoVinoID = TV.TipoVinoID
        JOIN 
            DenominacionesDeOrigen DO ON B.DOID = DO.DOID
        WHERE 
            DO.Nombre = ? AND
            TV.Nombre = 'Tinto' AND
            B.BotellaID NOT IN (?)
        ORDER BY B.Calificacion DESC
        LIMIT 5;
        `;
        db.query(query, [nombreDO, idsExcluidos], (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}



async function obtenerBotellasPorTipoOrdenadasPorCalificacionSinDO(tipoVino, idsExcluidos) {
    return new Promise((resolve, reject) => {
        console.log(`Buscando botellas del tipo ${tipoVino} ordenadas por calificación, excluyendo:`, idsExcluidos);
        const query = `
        SELECT
            B.BotellaID, 
            B.Nombre,
            B.AnoCosecha,
            B.Descripcion,
            B.Precio,
            B.Volumen,
            B.Stock,
            B.Calificacion
        FROM 
            Botellas B
        JOIN 
            TiposDeVino TV ON B.TipoVinoID = TV.TipoVinoID
        WHERE 
            TV.Nombre = ? AND
            B.BotellaID NOT IN (?)
        ORDER BY B.Calificacion DESC
        LIMIT 5;
        `;
        db.query(query, [tipoVino, idsExcluidos], (err, results) => {
            if (err) {
                console.error('Error al realizar la consulta:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}














// Ejemplo de función para obtener una respuesta aleatoria de un array de respuestas
function obtenerRespuestaAleatoriaVinoTinto(respuestas) {
    const indiceAleatorio = Math.floor(Math.random() * respuestas.length);
    return respuestas[indiceAleatorio];
}

// Ejemplo de arrays de respuestas (deberían ser definidos en otra parte del código)
const respuestasRecomendacionVinoTinto = ['vino'
    // Array de posibles respuestas para recomendaciones de vino tinto
];

const respuestasCaracteristicasVinoTinto = [
    // Array de posibles respuestas sobre características de vino tinto
];

const respuestasMaridajeVinoTinto = [
    // Array de posibles respuestas para maridaje con vino tinto
];

const respuestasGenericasVinoTinto = [
    // Array de respuestas genéricas para preguntas sobre vino tinto
];





















let entrenado = false;

function iniciarEntrenamiento() {
    try {
        entrenarClasificadorDesdeArchivo('DatosChatbot/Saludo/Entrenamiento/saludos.txt', 'saludo');
        entrenarClasificadorDesdeArchivo('DatosChatbot/Saludo/Entrenamiento/despedidas.txt', 'despedida');
        entrenarClasificadorDesdeArchivo('DatosChatbot/Ayuda/Entrenamiento/frasesAyuda.txt', 'ayuda');
        entrenarClasificadorDesdeArchivo('DatosChatbot/BusquedaVino/Tinto/Entrenamiento/frasesVinoTinto.txt', 'vino tinto');
        entrenarClasificadorDesdeArchivo('DatosChatbot/Adiccion/Entrenamiento/frasesAdiccion.txt', 'adiccion');
        entrenado = true;
        console.log('El clasificador se ha entrenado exitosamente.');
    } catch (error) {
        entrenado = false;
        console.error('Error al entrenar el clasificador:', error);
    }
}

function estaEntrenado() {
    return entrenado;
}



module.exports = {
    procesarMensajeUsuario,
    iniciarEntrenamiento,
    establecerUsuarioID,
    estaEntrenado
};

