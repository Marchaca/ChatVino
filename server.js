const express = require('express');
const mysql = require('mysql');
const app = express();
const port = 3000;
const chatbotLogic = require('./chatbotLogic');
const dialogFlow = require('./dialogFlow');

//equire('dotenv').config();













const crypto = require('crypto');

function generadorDeSessionID() {
    return crypto.randomBytes(16).toString('hex');
}



// Iniciar el entrenamiento del clasificador
chatbotLogic.iniciarEntrenamiento();





/*
// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ChatVino'
});
*/



const db = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'chatvino'
});



/*
// Realizar una solicitud a la API PHP
fetch('database.php')
    .then(response => response.json())
    .then(data => {
        console.log(data); // Aquí manejas los datos recibidos
    })
    .catch(error => console.error('Error:', error));
*/








// Conectar a la base de datos
db.connect(err => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos');
});

const cors = require('cors');
app.use(express.json());
app.use(cors());

// Ruta para obtener los tipos de uvas
app.get('/api/uvas', (req, res) => {
    db.query('SELECT * FROM TiposDeUvas', (err, results) => {
        if (err) {
            console.error('Error al realizar la consulta:', err);
            res.status(500).send('Error al realizar la consulta');
            return;
        }
        console.log(results); // Imprime los resultados en la consola del servidor
        res.json(results);
    });
});



app.post('/api/registro', (req, res) => {
    const { nombre, email, password } = req.body;
    
    // Comprobar si el email ya existe
    console.log('Comprobamos si el usuario existe');
    db.query('SELECT Email FROM Usuarios WHERE Email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).send('Error al realizar la consulta');
        }

        if (results.length > 0) {
            console.log('El usuario ya existe');
            return res.status(400).send('El email ya está registrado');
        } else {
            // Insertar el nuevo usuario
            console.log('El usuario no existe');
            db.query('INSERT INTO Usuarios (Nombre, Email, Contrasena) VALUES (?, ?, ?)', [nombre, email, password], (err, results) => {
                if (err) {
                    console.error('Error al insertar en la base de datos:', err);
                    return res.status(500).send('Error al registrar el usuario');
                }

                // Obtener el ID del usuario recién insertado
                db.query('SELECT LAST_INSERT_ID() as usuarioId', (err, results) => {
                    if (err) {
                        console.error('Error al obtener el ID del usuario:', err);
                        return res.status(500).send('Error al obtener ID del usuario');
                    }
                    console.log('El usuario se ha registrado correctamente');
                    console.log(results[0].usuarioId);
                    const usuarioId = results[0].usuarioId;
                    res.status(201).json({ message: 'Usuario registrado con éxito', usuarioId: usuarioId });
                });
            });
        }
    });
});


app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM Usuarios WHERE Email = ? AND Contrasena = ?', [email, password], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).send('Error al realizar la consulta');
        }
        if (results.length > 0) {
            console.log(results[0].UsuarioID);

            let sessionID = generadorDeSessionID();
            chatbotLogic.establecerUsuarioID(results[0].UsuarioID, sessionID);


            res.status(200).json({ message: 'Login exitoso', usuarioId: results[0].UsuarioID });
        } else {
            res.status(400).send('Email o contraseña incorrectos');
        }
    });
});



// Ruta para recibir y responder a los mensajes del chatbot
//app.post('/api/message', (req, res) => {
//    console.log(req.body); // Agregar esto para ver qué se está recibiendo
//    const userMessage = req.body.message;

    // Aquí iría tu lógica para procesar el mensaje del usuario
    // Por ahora, simplemente vamos a devolver el mismo mensaje
//    const botResponse = `Chatbot responde: ${userMessage}`;
//
//    res.json({ message: botResponse });
//});




// Ruta para recibir y responder a los mensajes del chatbot
app.post('/api/message', async (req, res) => {
    if (!chatbotLogic.estaEntrenado()) {
        return res.status(503).send('El chatbot todavía se está entrenando. Por favor, inténtalo de nuevo en breve.');
    }
    const userMessage = req.body.message;
    
    let botResponse = await chatbotLogic.procesarMensajeUsuario(userMessage);
    console.log('Respuesta chatbot en server.js: '+botResponse);

    if (typeof botResponse.text === 'string') {
        botResponse = destacarPalabras(botResponse, palabrasParaDestacar);
        res.json({ message: botResponse });
    }
    // Si botResponse es un arreglo de cadenas
    else if (Array.isArray(botResponse)) {
        botResponse = botResponse.map(respuesta => destacarPalabras(respuesta, palabrasParaDestacar));
        res.json({ message: botResponse });
    }
    else{
        botResponse = destacarPalabras(botResponse, palabrasParaDestacar);
        res.json({ message: botResponse });
    }


});

const palabrasParaDestacar = ["vino ideal", "ChatVino@gmail.com", "ChatVino", "Chatbot", "dudas más habituales", "usuarios", "asistente personal",
"vinos perfectos", "información", "botellas", "recomendaciones", "asistencia", "frecuencia",
"contacto", "soporte", "funciones", "respuestas", "encontrar", "vino español", "tipo de vino", "vino tinto", "vino blanco", "vino espumoso", "vino rosado", "vino", "asistente",
"Teléfono", "123456789", "conocimientos", "vinicultura", "compartir", "principiantes", "aficionados", "Tempranillo", "Sousón", "principalmente", 
"tintos", "nororeste", "España", "Galicia", "tipo de uva", "calificación", "precio", "denominación", "maridaje", "año de cosecha", "bodegas", "denominaciones", "origen", "uva nativa", "Portugal", "color profundo", "alta acidez", "mezclada", 
"otras variedades", "equilibrar", "intensidad", "altamente valorados", "complejidad", "capacidad", "envejecimiento", "cuerpo medio", 
"suaves", "acidez equilibrada", "mezcla", "Garnacha", "Mazuelo", "uva tinta más importantes", "famosa", "Rioja", "Ribera del Duero", 
"vinos más prestigiosos", "país", "caracteriza", "versatilidad", "adaptarse", "diferentes climas", "suelos", "buen equilibrio", 
"tanimos", "buena acidez", "acidez", "moderadamente alta", "frescura", "clima fresco", "húmedo", "perfil aromático", "color oscuro", 
"tánica notable", "ricos sabores", "aronas", "frutas y especias", "vinos excepcionales", "vinos ricos", "jugosos", "Albariño", "Verdejo",
"Monastrell"];

function destacarPalabras(texto, palabrasADestacar) {
    let textoModificado = texto;

    palabrasADestacar.forEach(palabra => {
        // Uso de expresión regular para reemplazar todas las ocurrencias de la palabra
        const regex = new RegExp(`\\b${palabra}\\b`, 'gi'); // 'gi' para reemplazo global e insensible a mayúsculas
        textoModificado = textoModificado.replace(regex, (match) => `<strong>${match}</strong>`);
    });

    return textoModificado;
}





app.get('/api/botellas', (req, res) => {
    db.query('SELECT * FROM Botellas ORDER BY Calificacion DESC', (err, results) => {
        if (err) {
            console.error('Error al realizar la consulta:', err);
            res.status(500).send('Error al realizar la consulta');
            return;
        }
        res.json(results);
    });
});





app.post('/api/valorar', (req, res) => {
    const { botellaId, valoracion } = req.body;
    const nuevaValoracion = parseFloat(valoracion);
  
    // Obtener la calificación actual y el número de valoraciones
    db.query('SELECT Calificacion, NumeroValoraciones FROM Botellas WHERE BotellaID = ?', [botellaId], (err, results) => {
        if (err) {
            console.error('Error al consultar la base de datos:', err);
            return res.status(500).send('Error al procesar la valoración');
        }
  
        if (results.length > 0) {
            let { Calificacion, NumeroValoraciones } = results[0];
            NumeroValoraciones = NumeroValoraciones ? NumeroValoraciones + 1 : 1; // Incrementar el contador de valoraciones
            Calificacion = Calificacion ? ((Calificacion * (NumeroValoraciones - 1)) + nuevaValoracion) / NumeroValoraciones : nuevaValoracion;
  
            // Actualizar la calificación y el número de valoraciones en la tabla Botellas
            db.query('UPDATE Botellas SET Calificacion = ?, NumeroValoraciones = ? WHERE BotellaID = ?', [Calificacion, NumeroValoraciones, botellaId], (err, results) => {
                if (err) {
                    console.error('Error al actualizar la base de datos:', err);
                    return res.status(500).send('Error al actualizar la calificación');
                }
                res.status(200).send('Calificación actualizada con éxito');
            });
        } else {
            res.status(404).send('Botella no encontrada');
        }
    });
  });













app.post('/api/guardarPreferencias', (req, res) => {
    console.log('Vamos a guardar preferencias');
    const { usuarioId, tipoEvento, estacion, rangoPrecio, estadoAnimo } = req.body;
    console.log(req.body);

    // Iniciar una transacción
    db.beginTransaction((err) => {
        if (err) {
            console.error('Error al iniciar la transacción:', err);
            return res.status(500).send('Error del servidor');
        }

        // Comprobar si ya existen preferencias para el usuario
        const queryCheck = 'SELECT * FROM PreferenciasUsuario WHERE UsuarioID = ?';
        db.query(queryCheck, [usuarioId], (err, results) => {
            if (err) {
                db.rollback(() => {
                    console.error('Error al consultar la base de datos:', err);
                    return res.status(500).send('Error al guardar las preferencias');
                });
            }

            if (results.length > 0) {
                console.log('Existen preferencias del usuario, vamos a actualizarlas');
                // Actualizar las preferencias existentes
                const queryUpdate = 'UPDATE PreferenciasUsuario SET TipoEvento = ?, Estacion = ?, RangoPrecio = ?, EstadoAnimo = ? WHERE UsuarioID = ?';
                db.query(queryUpdate, [tipoEvento, estacion, rangoPrecio, estadoAnimo, usuarioId], (err, results) => {
                    if (err) {
                        db.rollback(() => {
                            console.error('Error al actualizar en la base de datos:', err);
                            return res.status(500).send('Error al guardar las preferencias');
                        });
                    } else {
                        db.commit((err) => {
                            if (err) {
                                console.error('Error al realizar el commit:', err);
                                return res.status(500).send('Error del servidor');
                            }
                            console.log('Se han actualizado preferencias');
                            res.status(200).send('Preferencias actualizadas con éxito');
                        });
                    }
                });
            } else {
                // Insertar nuevas preferencias
                console.log('No existen preferencias de este usuario, vamos a insertarlas');
                const queryInsert = 'INSERT INTO PreferenciasUsuario (UsuarioID, TipoEvento, Estacion, RangoPrecio, EstadoAnimo) VALUES (?, ?, ?, ?, ?)';
                db.query(queryInsert, [usuarioId, tipoEvento, estacion, rangoPrecio, estadoAnimo], (err, results) => {
                    if (err) {
                        db.rollback(() => {
                            console.error('Error al insertar en la base de datos:', err);
                            return res.status(500).send('Error al guardar las preferencias');
                        });
                    } else {
                        db.commit((err) => {
                            if (err) {
                                console.error('Error al realizar el commit:', err);
                                return res.status(500).send('Error del servidor');
                            }
                            console.log('Hemos insertado preferencias');
                            res.status(201).send('Preferencias guardadas con éxito');
                        });
                    }
                });
            }
        });
    });
});










// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
