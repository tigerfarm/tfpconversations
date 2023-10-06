// -----------------------------------------------------------------
// Firebase project tignotify worked, using the Project Cloud Messaging values:
// + Firebase project settings: Firebase/Project Overview(click icon)/Project setting/Cloud Messaging.
// + Cloud Messaging API (Legacy): Server key Token
// + Firebase project Sender ID: messagingSenderId. This value was also used in firebase-messaging-sw.js.
function initFirebase() {
    var config = {
        apiKey: "BBZWLqhbPGsB56YsVE2nMZ-ar6hg0O9fN2f2_baIg_xaKmoTw_gU7OHJEZlWLIbG-bMPLTqEFP-G1aLZo9YoqHA",
        messagingSenderId: "696202644334"
    };
    logger('+ firebase.initializeApp(config)');
    firebase.initializeApp(config);
    logger('+ Firebase Messaging object initialized.');
    //
    // FCM message listener for incomming notifications.
    // This works when this is running in the browser.
    // If not running in the browser, the following is used to handle incomming notifications:
    //      messaging.setBackgroundMessageHandler( ... )
    //      in firebase-messaging-sw.js.
    firebase.messaging().onMessage(function(payload) {
        console.log('+ Message received payload.', payload);
        logger('++ Payload notification message received:       ' + payload.data.twi_body);
        logger('++ Payload notification message from sender id: ' + payload.from);
    });
    
    GetFirebaseToken();
}

// -----------------------------------------------------------------
// Get a Firebase Cloud Messaging(FCM) token to identify this client application.
// Token is the device address and this client application.

thisFcmToken = "";

function GetFirebaseToken() {
    logger("+ GetFirebaseToken()");
    if (firebase && firebase.messaging()) {
        // requesting permission to use push notifications
        firebase.messaging().requestPermission().then(() => {
            // getting FCM token
            firebase.messaging().getToken().then((fcmToken) => {
                thisFcmToken = fcmToken;
                logger("+ Firebase FCM token for this device's web application:  " + thisFcmToken);
            }).catch((err) => {
                logger("- Error: Can't get token: " + err);
            });
        }).catch((err) => {
            logger("- Error: user has not granted permission.");
            logger(err);
        });
    } else {
        logger("- Error: Firebase library not initialized.");
    }
}

// -----------------------------------------------------------------
// eof