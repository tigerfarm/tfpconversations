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
// Message:             https://www.twilio.com/docs/conversations/api/service-conversation-message-resource
// User:                https://www.twilio.com/docs/conversations/api/user-resource
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
    var jqxhr = $.get("generateConversationToken?identity=" + userIdentity, function (token) {
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
            //
            // Note, the following load the conversation list: conversationList.
            // However, the following "async function ()" code could be removed
            // and the conversationList loaded in "conversationAdded" or "conversationJoined".
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
                        conversationList[counterConversations++] = aConversation; // Store the conversation names into an array.
                        addChatMessage("++ getSubscribedConversations: " + counterConversations
                                + " : " + aConversation.uniqueName
                                + ", " + aConversation.friendlyName
                                );
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
            // thisConversationClient.on('conversationAdded', onConversationAdded);
            // --- or ---
            thisConversationClient.on("conversationAdded", (aConversation) => {
                addChatMessage("++ conversationAdded: " + aConversation.uniqueName
                        + ": " + aConversation.friendlyName
                        + ": createdBy:" + aConversation.createdBy
                        );
            });
            thisConversationClient.on("conversationJoined", (aConversation) => {
                addChatMessage("++ conversationJoined: " + aConversation.uniqueName
                        + ": " + aConversation.friendlyName
                        + ": createdBy:" + aConversation.createdBy
                        );
            });
            thisConversationClient.on("conversationLeft", (aConversation) => {
                addChatMessage("++ Exited the conversation: " + aConversation.uniqueName);
            });
        });
    }).fail(function () {
        logger("- Error refreshing the token and creating the Conversations client object.");
    });
}

function onConversationAdded(aConversation) {
    // https://media.twiliocdn.com/sdk/android/chat/releases/2.0.6/docs/com/twilio/chat/ChatClientListener.html
    // Called when the current user is added to a channel.
    // Note, joined but not subscribed.
    logger("onConversationAdded, user added to the  channel: " + aConversation.friendlyName);
}

function onTokenAboutToExpire() {
    startUserFunctionMessage();
    logger("onTokenExpiring: Use a server side routine to refresh the token using client id: " + userIdentity);
    var jqxhr = $.get("generateConversationToken?identity=" + userIdentity, function (token, status) {
        if (token === "0") {
            logger("- Error refreshing the token.");
            return;
        }
        thisToken = token;
        logger("Token update: " + thisToken);
        // -------------------------------
        // https://www.twilio.com/docs/chat/access-token-lifecycle
        thisConversationClient.updateToken(thisToken);
        //
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
                    if (returnString === "1") {
                        // Participant was added to the conversation, initialize LastReadMessageIndex = 0.
                        theConversation.updateLastReadMessageIndex(0).then(data1 => {
                            theConversation.getUnreadMessagesCount().then(data => {
                                logger("+ setupTheConversation, unreadCount = " + data);
                                setupTheConversation();
                            });
                        });
                    } else {
                        setupTheConversation();
                    }
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
    // Set updateLastReadMessageIndex to 0 when joining a room, but not listing the messages.
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
function listIdentityConversations() {
    addChatMessage("+ List conversations for the identity: " + userIdentity);
    logger("+ Function: listParticipants(), makes a server side call.");
    chatConversationName = $("#conversationName").val();
    // http://localhost:8080/listIdentityConversations?theIdentity=dave
    var jqxhr = $.get("listIdentityConversations?theIdentity=" + userIdentity, function (returnString) {
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
        addChatMessage("First, create a Conversation Client.");
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
        // getMessages(5, 0, "forward");
        //  5: number of messages in a page.
        //  "forward": order retrieved.
        let paginator = await theConversation.getMessages(5, 0, "forward");
        hasMore = true;
        while (hasMore) {
            counterPages++;
            logger("++ paginator.items.length: " + paginator.items.length);
            for (i = 0; i < paginator.items.length; i++) {
                const message = paginator.items[i];
                addChatMessage("> " + counterItems++ + " " + message.author + " : " + message.index + " : " + message.type + " : " + message.body);
                if (message.type === "media") {
                    // https://media.twiliocdn.com/sdk/js/conversations/releases/2.4.0/docs/classes/Media.html
                    addChatMessage("> media: SID filename " + message.media.sid
                            + " " + message.media.contentType
                            + " " + message.media.filename
                            + " " + await message.media.getContentTemporaryUrl()
                            + " ");
                    // theURL = await message.media.getContentTemporaryUrl();
                    // addChatMessage("> media: theURL " + theURL);
                }
            }
            if (paginator.hasNextPage) {
                paginator = await paginator.nextPage();
            } else {
                hasMore = false;
            }
        }
        logger("+ Completed page loops, pages: " + counterPages + ", Number of messages: " + counterItems);
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
    // Stacy: only removes messages create by this participant.
    startUserFunctionMessage();
    logger("+ Function: deleteAllMessages().");
    theConversation.getMessages().then(function (messages) {
        totalMessages = messages.items.length;
        addChatMessage("+ Remove my Messages from the conversation: " + conversationName);
        for (i = 0; i < totalMessages; i++) {
            const message = messages.items[i].remove();
        }
        addChatMessage('+ My messages were removed.');
        // addChatMessage('+ Total Messages removed: ' + totalMessages);
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
    (async function () {
        logger('+ Called sendMedia() async.');
        // Fails due to CORS issue:
        //  CORS header ‘Access-Control-Allow-Origin’ missing
        const file1 = await fetch("https://tfpbooks.herokuapp.com/tfpconversations/custom/companyLogo.jpg");
        // Only works from localhost testing:
        //  const file1 = await fetch("http://localhost:8000/tfpconversations/custom/companyLogo.jpg");
        // Works for both localhost and when deployed to another server:
        //  const file1 = await fetch("/tfpconversations/0graphic1w.jpg");
        const fileM1 = await file1.blob();
        const sendMediaOptions1 = {
            // Header doesn't work:
            // Access-Control-Allow-Origin: *
            // accessControlAllowOrigin: "*",
            contentType: file1.headers.get("Content-Type"),
            filename: "graphic1.jpg",
            media: fileM1
        };
        await theConversation.prepareMessage()
                .setBody("+ sendMedia() files: M1")
                .addMedia(sendMediaOptions1)
                .build()
                .send();
        logger('+ Exit sendMedia() async.');
    })();
}
function sendMedia2() {
    // Media files are in the same directory as the index.html file, that loads this file
    // logger('+ Called sendMedia().');
    (async function () {
        // await theConversation.sendMessage('+ sendMedia() step 1');
        logger('+ Called sendMedia() async.');
        // Fails due to CORS issue:
        //  const file1 = await fetch("https://example.com/tfpconversations/custom/companyLogo.jpg");
        // Only works from localhost testing:
        //  const file1 = await fetch("http://localhost:8000/tfpconversations/custom/companyLogo.jpg");
        // Works for both localhost and when deployed to another server:
        const file1 = await fetch("/tfpconversations/0graphic1w.jpg");
        const fileM1 = await file1.blob();
        const sendMediaOptions1 = {
            contentType: file1.headers.get("Content-Type"),
            filename: "graphic1.jpg",
            media: fileM1
        };
        const file2 = await fetch("/tfpconversations/custom/companyLogo.jpg");
        const fileM2 = await file2.blob();
        const sendMediaOptions2 = {
            contentType: file1.headers.get("Content-Type"),
            filename: "graphic2.jpg",
            media: fileM2
        };
        // Send 2 media files:
        await theConversation.prepareMessage()
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
    logger("++ participant, identity = " + userIdentity
            + ", lastReadMessageIndex = " + theConversation.lastReadMessageIndex
            );
}

function getAllParticipantlastReadMessageIndex() {
    // --------------------------------------------------------
    logger("+ getAllParticipantlastReadMessageIndex()");
    // --------------------------------------------------------
    theConversation.getParticipantsCount().then(data => {
        logger("+ getParticipantCount(), participantCount = " + data);
        var participants = theConversation.getParticipants();
        // for each Participant, set up a listener for when the Participant is updated
        participants.then(function (currentParticipants) {
            currentParticipants.forEach(function (participant) {
                // > ++ identity = dave1, lastReadMessageIndex = 0, lastReadTimestamp: Mon Aug 01 2022 13:40:08 GMT-0700 (Pacific Daylight Time)
                logger("++ identity = " + participant.identity
                        + ", lastReadMessageIndex = " + participant.lastReadMessageIndex
                        + ", lastReadTimestamp: " + participant.lastReadTimestamp
                        );
            });
        });
        // --------------------------------------------------------
    });
}

function getParticipantCounts() {
    // Note, getMessagesCount() =               (Total messages = unread + read + 1)
    //      getUnreadMessagesCount()            (unread message count)
    //      + participant.lastReadMessageIndex  (read message index)
    //      + 1                                 (add 1 because index starts at 0)
    //      
    //      > 30 dave : 498 : and another
    //      > 31 dave : 501 : davve m1
    //      > 32 dave : 504 : dave m2
    //      > 33 here1 : 507 : here1 m1
    //      > 34 here1 : 510 : here1 m2
    //      > 35 here1 : 513 : here1 m3     (note: index starts at 0, i.e. 36 total messages)
    //      
    // > + getParticipantCounts(), Participant = dave:
    // > ++ Total number of messages in the conversation, getMessagesCount() = 36
    // > ++ theConversation, participant's getUnreadMessagesCount() = 3
    // > ++ theConversation, participant's lastReadMessageIndex = 504
    //
    logger("+ -----------------------------------------");
    logger("+ getParticipantCounts(), Participant = " + userIdentity + ":");
    (async function () {
        const newGetMessagesCount = await theConversation.getMessagesCount();
        logger("++ Total number of messages in the conversation, getMessagesCount() = " + newGetMessagesCount);
        const newGetUnreadMessagesCount = await theConversation.getUnreadMessagesCount();
        logger("++ theConversation, participant's getUnreadMessagesCount() = " + newGetUnreadMessagesCount);
        const newLastReadMessageIndex = theConversation.lastReadMessageIndex; // index is a message DB index value.
        logger("++ theConversation, participant's lastReadMessageIndex = " + newLastReadMessageIndex);
        //
        // --------------------------------------------------------
    })();
}

function setLastReadMessageIndex() {
    logger("+ setLastReadMessageIndex()");
    setReadMessageIndex = 2;
    (async function () {
        let iGetMessagesCount = await theConversation.getMessagesCount();
        logger("++ iGetMessagesCount = " + iGetMessagesCount);
        let setUpdateLastReadMessageIndex = await theConversation.updateLastReadMessageIndex(setReadMessageIndex);
        logger("++ setUpdateLastReadMessageIndex = " + setUpdateLastReadMessageIndex);
        let iGetUnreadMessagesCount = await theConversation.getUnreadMessagesCount();
        logger("++ iGetUnreadMessagesCount = " + iGetUnreadMessagesCount);
        //
        logger("++ Total messages = unread + read + 1 = " + iGetMessagesCount + " = "
                + iGetUnreadMessagesCount + " + " + setUpdateLastReadMessageIndex + " + 1");
    })();
    // Methods of calling: updateLastReadMessageIndex(...).
    // theConversation.updateLastReadMessageIndex(setUnreadCountTo);
    // theConversation.updateLastReadMessageIndex(setUnreadCountTo).then(data1 => {
    //     theConversation.getUnreadMessagesCount().then(data => {
    //         logger("+ setUnreadCount, unreadCount = " + data);
    //     });
    // });
    // Using "await" when calling: updateLastReadMessageIndex(...).
}

function setAllMessagesRead() {
    // Sets the unread count to 0 because all the messages are read.
    // Sets lastReadMessageIndex to the number of messages in the conversation, minus 1 because the index starts a 0.
    theConversation.setAllMessagesRead().then(data1 => {
        theConversation.getUnreadMessagesCount().then(data => {
            logger("+ setAllMessagesRead, unreadCount = " + data);
        });
    });
}
function setAllMessagesUnread() {
    // Sets the unread count and lastReadMessageIndex to null.
    theConversation.setAllMessagesUnread().then(data1 => {
        theConversation.getUnreadMessagesCount().then(data => {
            logger("+ setAllMessagesUnread, unreadCount = " + data);
        });
    });
}

// -----------------------------------------------------------------------------
function setFCM() {
    logger('+ Called setFCM().');
    // Passing FCM token to the "conversationClientInstance" to register for push notifications
    // Note, to make this proper, need to add the code from the project: notifyweb/address.
    //      I am in the stage of adding FCM to this application.
    // To setup:
    //      + Run notifyweb/address webserver.js
    //      + In a browser tab, go to: http://localhost:8080/
    //      + Get Firebase FCM message token.
    //      + Copy and paste the token here, below.
    //      + Stop notifyweb/address webserver.js, no longer needed.
    // To test:
    //      + In a browser tab, run this application.
    //      + In another browser tab, run this application.
    //      + In both tabs, join a room, each using a unique identity.
    //      + In one of the tabs, run this function.
    //      + In the other tab, send a message. An FCM notification is sent and received.
    // Firefox
    // fcmToken = "c2h7i9H7mcI:APA91bEifCmmIObAbgLUEUys1J_KwKx1bJW3XaxcggSqbheRAQIAwLLoZWccfmRhv3xw_XrNhqHu4OrDdAMF5fQmglY7dv2HetFkZm_3YG_WK1fd0-6yQGBvvHZKFyPM02rbDePLXswX";
    // Chrome
    // fcmToken = "fM0kI09YbYM:APA91bFwdXVVrvN6XOAFA2gByU9ndWE1R36DkDa57lOEKx3GLa-o3BhJbl8wyxDMuQ1rju-ZReprIKyNTjeAlbYLdbOr0v-E1RgrPk36okHnV0dPk-F5ewXDoN90vtitkREFjZ76So40";
    //
    fcmToken = thisFcmToken;
    logger('+ FCM token: ' + fcmToken);
    thisConversationClient.setPushRegistrationId('fcm', fcmToken);
    logger('+ Twilio Conversations Client FCM push registration completed.');
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
        listParticipants();
    });
    $("#btn-listallmessages").click(function () {
        listAllMessages();
    });
    $("#btn-listIdCnv").click(function () {
        listIdentityConversations();
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
            $('#btn-listIdCnv').prop('disabled', true);
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
            $('#btn-listIdCnv').prop('disabled', false);
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