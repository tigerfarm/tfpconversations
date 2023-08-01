// -----------------------------------------------------------------------------
// Through out this application, the unread count needs to be properly managed.
//  I have sample functions for setting and echo unread count.
//  See/find section: Test functions.
// 
// Documentation:       https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/
//                      https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Client.html
//                      https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Conversation.html
//                      https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Message.html
// Resources:
// Service:             https://www.twilio.com/docs/conversations/api/service-resource
// Conversation:        https://www.twilio.com/docs/conversations/api/conversation-resource
// Conversation Partic: https://www.twilio.com/docs/conversations/api/conversation-participant-resource
// Conversation Msg:    https://www.twilio.com/docs/conversations/api/conversation-message-resource
// User:                https://www.twilio.com/docs/conversations/api/user-resource
// Message:             https://www.twilio.com/docs/conversations/api/service-conversation-message-resource
// 
// Sample React app:    https://www.twilio.com/docs/conversations/javascript/exploring-conversations-javascript-quickstart
// 
// -----------------------------------------------------------------------------
let thisToken;
let thisConversationClient = "";
let conversationList = [];
let theConversation = ""; // Conversation object
userIdentity = "";
chatConversationName = "";

// This count of read channel messages needs work to initialize and maintain the count.
// Not fully implemented.
let totalMessages = 0;

// const Twilio = require('twilio');
// const Chat = require('twilio-chat');

function startUserFunctionMessage() {
    addChatMessage("+ ----------------------------------------------------------");
    logger("+ ----------------------------------------------------------");
}

// -----------------------------------------------------------------------------
// Chat Client Object functions
// -----------------------------------------------------------------------------

function createChatClientObject() {
    startUserFunctionMessage();
    userIdentity = $("#username").val();
    if (userIdentity === "") {
        logger("Required: Username.");
        addChatMessage("Enter a Username to use when chatting.");
        return;
    }
    addChatMessage("++ Creating Conversations Client...");
    // Ajax call to the web server that generates the token, for the userIdentity.
    logger("+ Use a server side routine to refresh the token using client id: " + userIdentity);
    var jqxhr = $.get("generateToken?identity=" + userIdentity, function (token) {
        if (token === "0") {
            logger("- Error refreshing the token.");
            return;
        }
        thisToken = token;
        logger("Token refreshed: " + thisToken);
        // -------------------------------
        // https://www.twilio.com/docs/conversations/initializing-conversations-sdk-clients
        Twilio.Conversations.Client.create(thisToken).then(conversationClient => {
            logger("Conversations client created: thisConversationClient.");
            thisConversationClient = conversationClient;
            addChatMessage("+ Conversation client created for the user: " + userIdentity);
            addChatMessage("+ Participant is subscribed and joined to the conversations: ");
            // http://media.twiliocdn.com/sdk/js/conversations/releases/2.0.0/docs/interfaces/Paginator.html
            (async function () {
                hasConversations = true;
                counterPages = 0;
                counterConversations = 0;
                logger("+ Loop through conversation pages.");
                let paginator = await thisConversationClient.getSubscribedConversations();
                if (paginator.items.length === 0) {
                    hasConversations = false;
                }
                while (hasConversations) {
                    counterPages++;
                    logger("+ Conversation loop: " + counterPages + " paginator.items which number: " + paginator.items.length);
                    for (i = 0; i < paginator.items.length; i++) {
                        const aConversation = paginator.items[i];
                        conversationList[counterConversations++] = aConversation;   // Store the conversation names into an array.
                        addChatMessage("++ " + counterConversations + " : " + aConversation.uniqueName);
                    }
                    hasNextPage = paginator.hasNextPage;
                    if (hasNextPage) {
                        paginator = await paginator.nextPage();
                    } else {
                        hasConversations = false;
                    }
                }
                logger("+ Completed conversation page loops, pages: " + counterPages + ", conversations: " + counterConversations);
                addChatMessage("+ ----------------------------------------------------------");
            })();
            //
            // -------------------------------
            //
            setButtons("createChatClient");
            //
            // -------------------------------
            // Set conversation client level event listeners.
            // 
            // thisConversationClient.on('channelRemoved', $.throttle(tc.loadChannelList));
            // thisConversationClient.on('tokenExpired', onTokenExpiring);
            //
            thisConversationClient.on('tokenAboutToExpire', onTokenAboutToExpire);
            //
            thisConversationClient.on('conversationAdded', onConversationAdded);
            thisConversationClient.on("conversationJoined", (aConversation) => {
                addChatMessage("++ Conversation joined: " + aConversation.uniqueName
                        + ": " + aConversation.friendlyName + ": " + aConversation.createdBy
                        );
            });
            thisConversationClient.on("conversationLeft", (aConversation) => {
                addChatMessage("++ Exited the conversation: " + aConversation.uniqueName);
            });
        }).fail(function () {
            logger("- Error creating the Conversations client object.");
        });
    }).fail(function () {
        logger("- Error refreshing the token and creating the Conversations client object.");
    });
}

function onConversationAdded(aConversation) {
    // https://media.twiliocdn.com/sdk/android/chat/releases/2.0.6/docs/com/twilio/chat/ChatClientListener.html
    // Called when the current user is added to a channel.
    // Note, joined but not subscribed.
    //  logger("onConversationAdded, user added to the  channel: " + aConversation.friendlyName);
}

function onTokenAboutToExpire() {
    startUserFunctionMessage();
    logger("onTokenExpiring: Use a server side routine to refresh the token using client id: " + userIdentity);
    var jqxhr = $.get("generateToken?identity=" + userIdentity, function (token, status) {
        if (token === "0") {
            logger("- Error refreshing the token.");
            return;
        }
        thisToken = token;
        logger("Token update: " + thisToken);
        // -------------------------------
        // https://www.twilio.com/docs/chat/access-token-lifecycle
        thisConversationClient.updateToken(thisToken);
        thisConversationClient.getSubscribedConversations();
        // -------------------------------
    }).fail(function () {
        logger("- onTokenAboutToExpire: Error refreshing the chat client token.");
    });
}

// -----------------------------------------------------------------------------
// Joining a Chat Conversation functions
// -----------------------------------------------------------------------------
function joinChatConversation() {
    startUserFunctionMessage();
    logger("+ Function: joinChatConversation()");
    if (thisConversationClient === "") {
        addChatMessage("First, create a Chat Client.");
        logger("Required: Chat Client.");
        return;
    }
    conversationName = $("#conversationName").val();
    if (conversationName === "") {
        addChatMessage("Enter a conversation name.");
        logger("Required: conversation name.");
        return;
    }
    // -----------------------------------------
    // Using defaults,
    // if the conversation was created by a different user,
    // they will not have access to use "getConversationByUniqueName" and "getConversationBySid".
    thisConversationClient.getConversationByUniqueName(conversationName)
            .then(aConversation => {
                logger("+ Use getConversationByUniqueName() " + conversationName);
                theConversation = aConversation;
                logger("++ Using getConversationByUniqueName(), theConversation object, "
                        + " SID: " + theConversation.sid
                        + " friendlyName: " + theConversation.friendlyName
                        + " uniqueName: " + theConversation.uniqueName
                        );
            })
            .catch(function () {
                logger("- Error conversation is not available: " + conversationName + ".");
            });
    // -----------------------------------------
    addChatMessage("+ Join the conversation: " + conversationName + ", as identity: " + userIdentity);
    // ---
    // This works for conversations already subscribed and joined.
    for (i = 0; i < conversationList.length; i++) {
        if (conversationList[i].uniqueName === conversationName) {
            theConversation = conversationList[i];
            addChatMessage("+ Joined the conversation and ready to chat.");
            setupTheConversation();
            return;
        }
    }
    // -----------------------------------------
    // Serverside check if the conversation exists.
    // Use serverside check because this user is not authorized to see other private channels.
    //      If not exists, create it and join it.
    //      If exists, join it.
    logger("+ Use a server side routine to check if a conversation exits.");
    var jqxhr = $.get("conversationExists?conversationid=" + conversationName, function (returnString) {
        // logger("+ returnString :" + returnString + ":");
        if (returnString === "0") {
            addChatMessage("+ Conversation does NOT exist: " + conversationName + ".");
            createConversation();
        } else if (returnString === "1") {
            addChatMessage("+ Conversation exists: " + conversationName + ". Has not joined: " + userIdentity);
            // Using a serverside request because
            //  System/admin authorization is required which this participant doesn't have.
            joinChatConversationServerSide();
        } else {
            logger("-- Error: " + returnString);
            return;
        }
    }).fail(function () {
        logger("- Error checking conversation id.");
    });
}

// -------------------------------------
function joinChatConversationIfAdmin() {
// Untested, unimplemented.
// This will work for new conversations where the participant has authorization to create rooms.
// The following fails because it's a private conversation and the current participant does not have authorization.
    thisConversationClient.getConversationByUniqueName(conversationName)
            .then(aConversation => {
                theConversation = aConversation;
                logger("+ theConversation object is set.");
                theConversation.add(userIdentity);
                addChatMessage("+ Conversation created and participant is added to the conversation:" + userIdentity);
                setupTheConversation();
            })
            .catch(function () {
                logger("- Error conversation is not available: " + conversationName + ".");
            });
}

// ----------------------------------------
function joinChatConversationServerSide() {
    // The following works for:
    // + new rooms and rooms created by others
    // + Will also work for already subscribed rooms.
    var jqxhr = $.get("joinConversation?conversationid=" + conversationName + "&identity=" + userIdentity, function (returnString) {
        // logger("+ returnString :" + returnString + ":");
        if (returnString === "0") {
            addChatMessage("+ Participant is already in the conversation: " + conversationName + ".");
        } else if (returnString === "1") {
            addChatMessage("+ Participant was added to the conversation: " + conversationName + ".");
        } else if (returnString === "-2") {
            logger("-- Error -2.");
            return;
        }
        thisConversationClient.getConversationByUniqueName(conversationName)
                .then(aConversation => {
                    theConversation = aConversation;
                    logger("+ theConversation object is set.");
                    setupTheConversation();
                })
                .catch(function () {
                    logger("- Error conversation is not available: " + conversationName + ".");
                });
    }).fail(function () {
        logger("- Error joining conversation.");
    });
}

function setupTheConversation() {
    setButtons("join");
    // -------------------------------------------------------------------------
    theConversation.getParticipantsCount().then(data => {
        // Gives 0 when first creating the conversation and adding the first participant.
        // Works there after such as re-joining the conversation or a new participant joining.
        logger("+ participantCount = " + data);
    });
    // If the consumption horizon is not set,
    //      "updateLastReadMessageIndex" will set it.
    // Set to updateLastReadMessageIndex to 0 when joining a room, but not listing the messages.
    // Stacy, testing without.
    // theConversation.updateLastReadMessageIndex(0).then(data1 => {
    //     theConversation.getUnreadMessagesCount().then(data => {
    //         logger("+ setupTheConversation, unreadCount = " + data);
    //     });
    // });
    // ---------------------------------------------
    // Set conversation messageAdded event listener.
    theConversation.on('messageAdded', function (message) {
        // https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Message.html
        addChatMessage("> " + message.author + " : " + message.conversation.uniqueName + " : " + message.body);
        incCount();
        // Stacy, unread count needs work.
        theConversation.getUnreadMessagesCount().then(data => {
            logger("+ messageAdded, unreadCount = " + data);
            if (message.author === userIdentity) {
                theConversation.updateLastReadMessageIndex(data - 1);
                theConversation.getUnreadMessagesCount().then(data => {
                    logger("+ messageAdded, unreadCount = " + data);
                });
            }
        });
    });
    // -------------------------------------------------------------------------
    // https://www.twilio.com/docs/conversations/typing-indicator#typing-indicator-consume
    // Set conversation typing event listeners.
    theConversation.on('typingStarted', function (participant) {
        logger("+ typingStarted: " + participant.identity);
    });
    //set  the listener for the typing ended Conversation event
    theConversation.on('typingEnded', function (participant) {
        // Once typingStarted, after 5 seconds, this is triggered.
        logger("+ typingEnded: " + participant.identity);
    });
    theConversation.on('participantUpdated', function (event) {
        logger("++ participantUpdated, identity = " + event.participant.identity
                + ", lastReadMessageIndex = " + event.participant.lastReadMessageIndex
                // + "\n++ participantUpdated, lastReadTimestamp = " + event.participant.lastReadTimestamp
                );
    });
}

// -----------------------------------------------------------------------------
// Conversation level functions
// -----------------------------------------------------------------------------

function createConversation() {
// http://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Client.html#createConversation__anchor
    logger("+ Create the conversation if it doesn't exist: " + chatConversationName);
    thisConversationClient.createConversation({
        uniqueName: conversationName,
        friendlyName: conversationName
    }).then(aConversation => {
        theConversation = aConversation;
        logger("+ Conversation created and theConversation object is set, "
                + "\n++ SID: " + theConversation.sid
                + "\n++ friendlyName: " + theConversation.friendlyName
                + "\n++ uniqueName: " + theConversation.uniqueName
                // + channel.getAttributes()
                );
        theConversation.add(userIdentity);
        addChatMessage("+ Conversation created and participant is added to the conversation:" + userIdentity);
        setupTheConversation();
    }).catch(function () {
        logger("- Error, failed to create the conversation: " + conversationName);
    });
}

// -----------------------------------------------------------------------------
function listConversations() {
    startUserFunctionMessage();
    logger("+ Function: listConversations(), makes a server side call.");
    chatConversationName = $("#conversationName").val();
    addChatMessage("+ List of conversations.");
    var jqxhr = $.get("listConversations", function (returnString) {
        if (returnString === "-1") {
            logger("-- Error retrieving conversation list.");
            return;
        }
        if (returnString === "0") {
            logger("+ No conversations to list.");
            return;
        }
        logger("++ List retrieved.");
        // -------------------------------
        addChatMessage(returnString);
        addChatMessage("+ End list.");
    }).fail(function () {
        logger("- Error retrieving conversation list.");
    });
}

// -----------------------------------------------------------------------------
function deleteConversation() {
    startUserFunctionMessage();
    logger("+ Function: deleteConversation(), makes a server side call.");
    if (thisConversationClient === "") {
        addChatMessage("First, create a Conversations Client.");
        logger("Required: Conversations Client.");
        return;
    }
    conversationName = $("#conversationName").val();
    if (conversationName === "") {
        addChatMessage("Enter a conversation name.");
        logger("Required: conversation name.");
        return;
    }
    addChatMessage("+ Remove conversation: " + conversationName);
    var jqxhr = $.get("removeConversation?conversationid=" + conversationName, function (returnString) {
        logger("+ returnString :" + returnString + ":");
        if (returnString !== "0") {
            addChatMessage("-- Warning, conversation not removed.");
            logger("-- Conversation not removed.");
            return;
        }
        addChatMessage("+ Conversation removed.");
        setButtons("createChatClient"); // back to ready to join a conversation.
    }).fail(function () {
        logger("- Error removing conversation.");
    });
}

// -----------------------------------------------------------------------------
function listParticipants() {
    startUserFunctionMessage();
    addChatMessage("+ Participants of this conversation: " + theConversation.uniqueName);
    logger("+ Function: listParticipants(), makes a server side call.");
    chatConversationName = $("#conversationName").val();
    addChatMessage("+ List of conversation's members.");
    // localhost:8000/listConversationParticipants?conversationSid=CHe02e49468eb64f8aaa92a845f10ece78
    var jqxhr = $.get("listConversationParticipants?conversationSid=" + theConversation.sid, function (returnString) {
        if (returnString === "-1") {
            logger("-- Error retrieving conversation list.");
            return;
        }
        if (returnString === "0") {
            logger("+ No conversations to list.");
            return;
        }
        logger("++ List retrieved.");
        // -------------------------------
        addChatMessage(returnString);
        addChatMessage("+ End list.");
    }).fail(function () {
        logger("- Error retrieving conversation list.");
    });
}

// -----------------------------------------------------------------------------
function sendTheMessage() {
    if (thisConversationClient === "") {
        addChatMessage("First, create a Chat Client.");
        return;
    }
    const theMessage = $("#message").val();
    if (theMessage === "") {
        return;
    }
    $("#message").val("");
    theIndex = theConversation.sendMessage(theMessage);
    if (theIndex.index !== undefined) {
        logger("sendTheMessage() " + theMessage + " index=" + theIndex.index);
    } else {
        logger("sendTheMessage() " + theMessage);
    }
}

function listAllMessages() {
    startUserFunctionMessage();
    logger("+ Function: listAllMessages().");
    // -------------------------------------
    (async function () {
        hasMore = true;
        counterPages = 0;
        counterItems = 0;
        logger("+ Loop through message pages.");
        let paginator = await theConversation.getMessages(5, 0, "forward");
        hasMore = true;
        while (hasMore) {
            counterPages++;
            for (i = 0; i < paginator.items.length; i++) {
                const message = paginator.items[i];
                addChatMessage("> " + counterItems++ + " " + message.author + " : " + message.index + " : " + message.body);
            }
            if (paginator.hasNextPage) {
                paginator = await paginator.nextPage();
            } else {
                hasMore = false;
            }
        }
        logger("+ Completed page loops, pages: " + counterPages + ", conversations: " + counterItems);
        addChatMessage("+ ----------------------------------------------------------");
        return;
        // -----------------
        // Following is for testing the other parameters of getMessages(...).
        const thePaginator = (paginator) => {
            logger("++ paginator.hasPrevPage = " + paginator.hasPrevPage);
            logger("++ paginator.hasNextPage = " + paginator.hasNextPage);
        };
        // theConversation.getMessages(10, 0, 'forward').then(thePaginator);
        // theConversation.getMessages(15, undefined, 'forward').then(thePaginator);
        // theConversation.getMessages(15, undefined, 'forward').then(thePaginator);
        // theConversation.getMessages(5).then(thePaginator);
    })();
    return;
    // -------------------------------------
    // The following only lists the number of messages retrieved using getMessages(x).
    // theConversation.getMessages(3).then(function (messages) {
    // Default number of messages is 30. List the 30 most recent messages.
    // https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Conversation.html#getMessages__anchor
    // https://media.twiliocdn.com/sdk/js/conversations/releases/2.1.0/docs/classes/Conversation.html#getMessages
    theConversation.getMessages().then(function (messages) {
        totalMessages = messages.items.length;
        logger('Total Messages: ' + totalMessages);
        addChatMessage("+ Current messages for conversation: " + conversationName);
        for (i = 0; i < totalMessages; i++) {
            const message = messages.items[i];
            // properties: https://media.twiliocdn.com/sdk/js/chat/releases/3.2.1/docs/Message.html
            addChatMessage("> " + message.author + " : " + message.index + " : " + message.body);
        }
        // theConversation.updateLastConsumedMessageIndex(totalMessages);
        addChatMessage('+ Total Messages: ' + totalMessages);
        theConversation.setAllMessagesRead().then(data1 => {
            theConversation.getUnreadMessagesCount().then(data => {
                logger("+ listAllMessages, unreadCount = " + data);
            });
        });
    });
}

function deleteAllMessages() {
    startUserFunctionMessage();
    logger("+ Function: deleteAllMessages().");
    // theConversation.getMessages(3).then(function (messages) {
    //      ...
    // });
    // Default number of messages is 30. List the 30 most recent messages.
    // https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Message.html
    // https://media.twiliocdn.com/sdk/js/conversations/releases/2.1.0/docs/classes/Conversation.html#getMessages
    theConversation.getMessages().then(function (messages) {
        totalMessages = messages.items.length;
        addChatMessage("+ Remove all Messages for conversation: " + conversationName);
        for (i = 0; i < totalMessages; i++) {
            const message = messages.items[i].remove();
        }
        addChatMessage('+ Total Messages removed: ' + totalMessages);
        doCountZero();
    });
}

// ---------
// Stacy, these need to work with index last read and unread count.
function doCountZero() {
    logger("+ Called: doCountZero();");
    totalMessages = 0;
}
function incCount() {
    totalMessages++;
    logger('+ Increment Total Messages: ' + totalMessages);
    theConversation.getMessages().then(function (messages) {
        // theConversation.updateLastConsumedMessageIndex(totalMessages);
    });
}
function setTotalMessages() {
    // theConversation.getMessages().then(function (messages) {
    //    totalMessages = messages.items.length;
    // });
    totalMessages = theConversation.getMessagesCount();
    logger('setTotalMessages, Total Messages:' + totalMessages);
}
// ---------

// Using curl:
//  https://www.twilio.com/docs/conversations/media-support-conversations#using-media-messaging-via-the-conversations-rest-api
function sendMedia() {
    // Media files are in the same directory as the index.html file, that loads this file
    // logger('+ Called sendMedia().');
    (async function () {
        // await theConversation.sendMessage('+ sendMedia() step 1');
        logger('+ Called sendMedia() async.');
        const file1 = await fetch("/0graphic1w.jpg");
        const fileM1 = await file1.blob();
        const sendMediaOptions1 = {
            contentType: file1.headers.get("Content-Type"),
            filename: "graphic1.jpg",
            media: fileM1
        };
        const file2 = await fetch("/custom/companyLogo.jpg");
        const fileM2 = await file2.blob();
        const sendMediaOptions2 = {
            contentType: file1.headers.get("Content-Type"),
            filename: "graphic2.jpg",
            media: fileM2
        };
        await theConversation.prepareMessage()
                // .setBody("+ sendMedia() file: M1")
                // .setBody("+ sendMedia() file: M2")
                .setBody("+ sendMedia() files: M1 and M2")
                .addMedia(sendMediaOptions1)
                .addMedia(sendMediaOptions2)
                .build()
                .send()
                ;
        logger('+ Exit sendMedia() async.');
    })();
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Section: Test functions for lastReadMessageIndex and unread message count.
// -----------------------------------------------------------------------------

function getParticipantlastReadMessageIndex() {
    logger("+ getParticipantUnreadCount");
    // --------------------------------------------------------
    var participants = theConversation.getParticipants();
    participants.then(function (currentParticipants) {
        currentParticipants.forEach(function (participant) {
            if (participant.identity === userIdentity) {
                logger("++ participantUpdated, identity = " + participant.identity
                        + ", lastReadMessageIndex = " + participant.lastReadMessageIndex
                        // + "\n++ participantUpdated, lastReadTimestamp = " + participant.lastReadTimestamp
                        );
            }
        });
    });
    // --------------------------------------------------------
}

function getAllParticipantlastReadMessageIndex() {
    theConversation.getParticipantsCount().then(data => {
        logger("+ getParticipantCount(), participantCount = " + data);
        // --------------------------------------------------------
        var participants = theConversation.getParticipants();
        // for each Participant, set up a listener for when the Participant is updated
        participants.then(function (currentParticipants) {
            currentParticipants.forEach(function (participant) {
                logger("++ participantUpdated, identity = " + participant.identity
                        + ", lastReadMessageIndex = " + participant.lastReadMessageIndex
                        // + "\n++ participantUpdated, lastReadTimestamp = " + participant.lastReadTimestamp
                        );
            });
        });
        // --------------------------------------------------------
    });
}

function getParticipantCounts() {
    // Alternative method to echo the unreadCount.
    // Note, updateLastReadMessageIndex does not set the unread Count value.
    logger("+ getParticipantCounts, Participant = " + userIdentity + ":");
    (async function () {
        const newGetMessagesCount = await theConversation.getMessagesCount();
        logger("++ Number of messages in the conversation, getMessagesCount() = " + newGetMessagesCount);
        const newGetUnreadMessagesCount = await theConversation.getUnreadMessagesCount();
        logger("++ Participant unread message count, getUnreadMessagesCount() = " + newGetUnreadMessagesCount);
        // --------------------------------------------------------
        var participants = theConversation.getParticipants();
        participants.then(function (currentParticipants) {
            currentParticipants.forEach(function (participant) {
                if (participant.identity === userIdentity) {
                    logger("++ Participant lastReadMessageIndex = " + participant.lastReadMessageIndex + " (index starts at 0)");
                }
            });
        });
        // --------------------------------------------------------
    })();

}
function setLastReadMessageIndex() {
    setUnreadCountTo = 2;
    logger("+ setUnreadCount = " + setUnreadCountTo);
    // Methods of calling: updateLastReadMessageIndex(...).
    // theConversation.updateLastReadMessageIndex(setUnreadCountTo);
    // theConversation.updateLastReadMessageIndex(setUnreadCountTo).then(data1 => {
    //     theConversation.getUnreadMessagesCount().then(data => {
    //         logger("+ setUnreadCount, unreadCount = " + data);
    //     });
    // });
    // Using "await" when calling: updateLastReadMessageIndex(...).
    (async function () {
        logger("+ setUnreadCount, await theConversation.updateLastReadMessageIndex...");
        const newLastReadMessageIndex = await theConversation.updateLastReadMessageIndex(setUnreadCountTo);
        logger("+ setUnreadCount, newLastReadMessageIndex = " + newLastReadMessageIndex);
    })();
}

function setAllMessagesRead() {
    // Doesn't change the unread count.
    theConversation.setAllMessagesRead().then(data1 => {
        theConversation.getUnreadMessagesCount().then(data => {
            logger("+ setAllMessagesRead, unreadCount = " + data);
        });
    });
}
function setAllMessagesUnread() {
    // Doesn't change the unread count.
    theConversation.setAllMessagesUnread().then(data1 => {
        theConversation.getUnreadMessagesCount().then(data => {
            logger("+ setAllMessagesUnread, unreadCount = " + data);
        });
    });
}

// -----------------------------------------------------------------------------
function setFCM() {
    logger('+ Called setFCM().');
    // passing FCM token to the `conversationClientInstance` to register for push notifications
    // Firefox
    fcmToken = "ewS_m63oS5A:APA91bGhWj6gAerckij2bGuSmsSYuy81ktkKPJ0KNci92u69ak6uwmpLCUPGRTyrjAPIcSa3VYLSNTpG9ztU5cF8t50dJMC_0zAcICe8kbVF-2WzFWIRVLR8c5oENtTSDPZ_cOkPZ6E7";
    // Chrome
    // fcmToken = "fM0kI09YbYM:APA91bFwdXVVrvN6XOAFA2gByU9ndWE1R36DkDa57lOEKx3GLa-o3BhJbl8wyxDMuQ1rju-ZReprIKyNTjeAlbYLdbOr0v-E1RgrPk36okHnV0dPk-F5ewXDoN90vtitkREFjZ76So40";
    thisConversationClient.setPushRegistrationId('fcm', fcmToken);
    logger('+ Exit setFCM().');
}

// -----------------------------------------------------------------------------
// UI Functions
// -----------------------------------------------------------------------------

var theBar = 0;
function menuicon() {
    // logger("+ Clicked menuicon");
    document.getElementById("menuDropdownItems").classList.toggle("show");
}
function menubar() {
    theBar = 1;
    // logger("+ Clicked menubar");
}
window.onclick = function (e) {
    if (!e.target.matches('.menuicon') && !e.target.matches('.menubar')) {
        if (theBar === 0) {
// logger("+ Clicked window");
            var dropdowns = document.getElementsByClassName("menuDropdownList");
            for (var d = 0; d < dropdowns.length; d++) {
                var openDropdown = dropdowns[d];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
        }
    }
    theBar = 0;
};
function activateChatBox() {
    $("#message").removeAttr("disabled");
    //
    $("#btn-createChatClient").click(function () {
        createChatClientObject();
    });
    $("#btn-join").click(function () {
        joinChatConversation();
    });
    $("#btn-list").click(function () {
        listConversations();
    });
    $("#btn-delete").click(function () {
        deleteConversation();
    });
    $("#btn-members").click(function () {
        listMembers();
    });
    $("#btn-listallmessages").click(function () {
        listAllMessages();
    });
    $("#btn-deleteallmessages").click(function () {
        deleteAllMessages();
    });
    $("#btn-countzero").click(function () {
        doCountZero();
    });
    // --------------------------------
    $("#message").on("keypress", function (e) {
        // logger("+ keypress: " + e.keyCode);
        if (e.keyCode === 13) {
            // if the RETURN/ENTER key is pressed, send the message
            sendTheMessage();
        } else {
            if (theConversation !== "") {
                // Send the Typing Indicator signal
                theConversation.typing();
            }
        }
    });

    // --------------------------------
}

function setButtons(activity) {
    logger("setButtons, activity: " + activity);
    switch (activity) {
        case "init":
            $('#btn-createChatClient').prop('disabled', false);
            //
            $('#btn-join').prop('disabled', true);
            $('#btn-list').prop('disabled', false);
            $('#btn-delete').prop('disabled', true);
            $('#btn-members').prop('disabled', true);
            //
            $('#btn-chat').prop('disabled', true);
            $('#btn-listallmessages').prop('disabled', true);
            $('#btn-deleteallmessages').prop('disabled', true);
            $('#btn-count').prop('disabled', true);
            $('#btn-countzero').prop('disabled', true);
            break;
        case "createChatClient":
            $('#btn-createChatClient').prop('disabled', true);
            //
            $('#btn-join').prop('disabled', false);
            $('#btn-delete').prop('disabled', false);
            $('#btn-members').prop('disabled', true);
            //
            $('#btn-chat').prop('disabled', true);
            $('#btn-listallmessages').prop('disabled', true);
            $('#btn-deleteallmessages').prop('disabled', true);
            //
            $('#btn-count').prop('disabled', true);
            $('#btn-countzero').prop('disabled', true);
            break;
        case "join":
            $('#btn-createChatClient').prop('disabled', true);
            //
            $('#btn-join').prop('disabled', false);
            $('#btn-delete').prop('disabled', false);
            $('#btn-members').prop('disabled', false);
            //
            $('#btn-chat').prop('disabled', false);
            $('#btn-listallmessages').prop('disabled', false);
            $('#btn-deleteallmessages').prop('disabled', false);
            //
            // $('#btn-count').prop('disabled', false);
            // $('#btn-countzero').prop('disabled', false);
            break;
    }
}

// -----------------------------------------------------------------------------
function logger(message) {
    var aTextarea = document.getElementById('log');
    aTextarea.value += "\n> " + message;
    aTextarea.scrollTop = aTextarea.scrollHeight;
}
function clearTextAreas() {
    chatMessages.value = "+ Ready";
    log.value = "+ Ready";
}
function addChatMessage(message) {
    var aTextarea = document.getElementById('chatMessages');
    aTextarea.value += "\n" + message;
    aTextarea.scrollTop = aTextarea.scrollHeight;
}
window.onload = function () {
    log.value = "+++ Start.";
    chatMessages.value = "+++ Ready to Create Conversations Client, then join a conversation and chat.";
    activateChatBox();
    setButtons("init");
};
// -----------------------------------------------------------------------------
// eof