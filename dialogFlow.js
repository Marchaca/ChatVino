const dialogflow = require('dialogflow');
const { v4: uuidv4 } = require('uuid');

const projectId = 'data-gearbox-408103'; // https://dialogflow.com/docs/agents#settings
const sessionId = uuidv4(); // Genera un nuevo UUID para la sesión

const languageCode = 'es';

const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(projectId, sessionId);


async function sendMessage(text) {
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: 'es', // idioma correcto
            },
        },
    };

    try {
        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;

        console.log(`Query: ${result.queryText}`);
        console.log(`Response: ${result.fulfillmentText}`);
        if (result.intent) {
            console.log(`Intent: ${result.intent.displayName}`);
            console.log('-----------------------------------');
        } else {
            console.log('No intent matched.');
        }
        return result;
    } catch (error) {
        console.error('ERROR:', error);
    }
}

/*
    sendMessage('Hey, buenos días!').then(result => {
        // Puedes hacer algo con la respuesta aquí
        // Por ejemplo, enviar la respuesta a una interfaz de usuario
    });
*/

/*
    sendMessage('Necesito ayuda para encontrar una botella').then(result => {
        // Puedes hacer algo con la respuesta aquí
        // Por ejemplo, enviar la respuesta a una interfaz de usuario
    });

    sendMessage('Necesito que me ayudes a encontrar una botella').then(result => {
        // Puedes hacer algo con la respuesta aquí
        // Por ejemplo, enviar la respuesta a una interfaz de usuario
    });


    sendMessage('Tengo que comprar una botella de vino').then(result => {
        // Puedes hacer algo con la respuesta aquí
        // Por ejemplo, enviar la respuesta a una interfaz de usuario
    });

    sendMessage('Necesito ayuda para encontrar una botella').then(result => {
        // Puedes hacer algo con la respuesta aquí
        // Por ejemplo, enviar la respuesta a una interfaz de usuario
    });


    sendMessage('Necesito que me ayudes a encontrar una botella').then(result => {
        // Puedes hacer algo con la respuesta aquí
        // Por ejemplo, enviar la respuesta a una interfaz de usuario
    });



    sendMessage('Me puedes ayudar a encontrar una botella de vino?').then(result => {
        // Puedes hacer algo con la respuesta aquí
        // Por ejemplo, enviar la respuesta a una interfaz de usuario
    });
*/


module.exports.sendMessage = sendMessage;