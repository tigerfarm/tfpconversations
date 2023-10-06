// -----------------------------------------------------------------------------
// For handling messages when this client is in the background or no longer in the browser.
// 
// Uses Firebase sample code snippets from https://firebase.google.com/docs/cloud-messaging/js/client
// -----------------------------------------------------------------------------
// [START initialize_firebase_in_sw]
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.

importScripts('https://www.gstatic.com/firebasejs/4.8.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/4.8.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker with the Firebase project number(messagingSenderId).
// + Firebase project Sender ID: messagingSenderId. This value was also used in index.html.
firebase.initializeApp({
    'messagingSenderId': "696202644334"     // Matches the value in index.html.
});

// Retrieve a Firebase Messaging instance to handle background messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
    // [firebase-messaging-sw.js] Received background message.
    // Customize the background notification:
    const notificationTitle = 'Conversation message received.';   // Notification background Message Title.
    const notificationOptions = {
        body: payload.data.twi_body                               // Notification background Message body.
    };
    return self.registration.showNotification(
            notificationTitle,
            notificationOptions);
});

// -----------------------------------------------------------------
// eof