// -----------------------------------------------------------------------------
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
let thisConversationClient = "";
const conversationList = [];
let theConversation = "";           // Conversation object
let thisToken;
let totalMessages = 0; // This count of read channel messages needs work to initialize and maintain the count.

userIdentity = "";
chatChannelName = "";
chatChannelDescription = "";
// const Twilio = require('twilio');
// const Chat = require('twilio-chat');

function startUserFunctionMessage() {
    addChatMessage("+ ----------------------------------------------------------");
    logger("+ ----------------------------------------------------------");
}

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
    // Since, programs cannot make an Ajax call to a remote resource,
    // Need to do an Ajax call to a local program that goes and gets the token.
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
            // let thatConversation = "";
            thisConversationClient.getSubscribedConversations().then(function (paginator) {
                for (i = 0; i < paginator.items.length; i++) {
                    const aConversation = paginator.items[i];
                    conversationList[i] = aConversation;
                    // addChatMessage('++ ' + aConversation.uniqueName + ": " + aConversation.friendlyName + ": " + aConversation.createdBy);
                    // logger("++ conversationList " + i + ": " + conversationList[i].uniqueName);
                }
                addChatMessage("+ End list.");
                // conversationList now contains the list of joined/subscribed conversations.
                // Can send messages using the array. For example:
                //    conversationList[i].sendMessage("+ conversationList message: " + conversationList[i].uniqueName);
            });
            //
            // -------------------------------
            //
            setButtons("createChatClient");
            //
            // -------------------------------
            // Set event listeners.
            // 
            // Documentation:
            //   https://www.twilio.com/docs/chat/tutorials/chat-application-node-express?code-sample=code-initialize-the-chat-client-9&code-language=Node.js&code-sdk-version=default
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

        });
    }).fail(function () {
        logger("- Error refreshing the token and creating the chat client object.");
    });
}

function onConversationAdded(aChannel) {
    // https://media.twiliocdn.com/sdk/android/chat/releases/2.0.6/docs/com/twilio/chat/ChatClientListener.html
    // Called when the current user is added to a channel.
    // Note, joined but not subscribed.
    logger("onConversationAdded, user added to the  channel: " + aChannel.friendlyName);
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
function joinChatConversation() {
    startUserFunctionMessage();
    logger("+ Function: joinChatConversation()");
    if (thisConversationClient === "") {
        addChatMessage("First, create a Chat Client.");
        logger("Required: Chat Client.");
        return;
    }
    conversationName = $("#channelName").val();
    if (conversationName === "") {
        addChatMessage("Enter a conversation name.");
        logger("Required: conversation name.");
        return;
    }
    addChatMessage("+ Join the conversation: " + conversationName + ", as identity: " + userIdentity);

    // -----------------------------------------
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
    // Use serverside check because this uses is not authorized to see other private channels.
    //  If not exists, create it and join it.
    //  If exists, join it.
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

// -----------------------------------------------------------------------------
function joinChatConversationIfAdmin() {
    // Untested.
    // The following fails because it's a private channel and the current participant does not have authorization.
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

// -----------------------------------------------------------------------------
function joinChatConversationServerSide() {
    // The following works for:
    // + new rooms and 
    // + rooms created by others
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
    // addChatMessage("++ Conversation joined.");
    setButtons("join");
    // -------------------------------------------------------------------------
    theConversation.getParticipantsCount().then(data => {
        logger("+ participantCount = " + data);
    });
    theConversation.updateLastReadMessageIndex(0);
    theConversation.getUnreadMessagesCount().then(data => {
        logger("+ unreadCount = " + data);
    });
    // -------------------------------------------------------------------------
    // Set conversation event listeners.
    theConversation.on('messageAdded', function (message) {
        // https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Message.html
        addChatMessage("> " + message.author + " : " + message.conversation.uniqueName + " : " + message.body);
        incCount();
        theConversation.getUnreadMessagesCount().then(data => {
            logger("+ unreadCount = " + data);
        });
    });
}

// -----------------------------------------------------------------------------
function createConversation() {
    // http://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Client.html#createConversation__anchor
    logger("+ Create the conversation if it doesn't exist: " + chatChannelName);
    thisConversationClient.createConversation({
        uniqueName: conversationName,
        friendlyName: conversationName
    })
            .then(aConversation => {
                theConversation = aConversation;
                logger("+ Conversation created and theConversation object is set: "
                        + " SID: " + theConversation.sid
                        + " friendlyName: " + theConversation.friendlyName
                        + " uniqueName: " + theConversation.uniqueName
                        // + channel.getAttributes()
                        );
                theConversation.add(userIdentity);
                addChatMessage("+ Conversation created and participant is added to the conversation:" + userIdentity);
                setupTheConversation();
            })
            .catch(function () {
                logger("- Error, failed to create the conversation: " + conversationName);
            });
}

// -----------------------------------------------------------------------------
function listConversations() {
    startUserFunctionMessage();
    logger("+ Function: listConversations(), makes a server side call.");
    // if (thisConversationClient === "") {
    //    addChatMessage("First, create a Chat Client.");
    //    logger("Required: Chat Client.");
    //    return;
    // }
    chatChannelName = $("#channelName").val();
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
    conversationName = $("#channelName").val();
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
function listMembers() {
    startUserFunctionMessage();
    addChatMessage("+ Participants of this conversation: " + theConversation.uniqueName);
    logger("+ Function: listMembers(), makes a server side call.");
    chatChannelName = $("#channelName").val();
    addChatMessage("+ List of conversations.");
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
function sendMessage() {
    if (thisConversationClient === "") {
        addChatMessage("First, create a Chat Client.");
        return;
    }
    const message = $("#message").val();
    if (message === "") {
        return;
    }
    $("#message").val("");
    theConversation.sendMessage(message);
}

function listAllMessages() {
    startUserFunctionMessage();
    logger("+ Function: listAllMessages().");
    // theConversation.getMessages(3).then(function (messages) {
    // Default number of messages is 30. List the 30 most recent messages.
    // https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Conversation.html#getMessages__anchor
    theConversation.getMessages().then(function (messages) {
        totalMessages = messages.items.length;
        logger('Total Messages: ' + totalMessages);
        addChatMessage("+ Current messages for conversation: " + conversationName);
        for (i = 0; i < totalMessages; i++) {
            const message = messages.items[i];
            // properties: https://media.twiliocdn.com/sdk/js/chat/releases/3.2.1/docs/Message.html
            addChatMessage("> " + message.author + " : " + message.body);
        }
        // theConversation.updateLastConsumedMessageIndex(totalMessages);
        addChatMessage('+ Total Messages: ' + totalMessages);
    });
}

function deleteAllMessages() {
    startUserFunctionMessage();
    logger("+ Function: deleteAllMessages().");
    // theConversation.getMessages(3).then(function (messages) {
    // Default number of messages is 30. List the 30 most recent messages.
    // https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Message.html
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

function doCountZero() {
    logger("+ Called: doCountZero(): theConversation.setNoMessagesConsumed();");
    theConversation.setNoMessagesConsumed();
}

function incCount() {
    totalMessages++;
    logger('+ Increment Total Messages:' + totalMessages);
    theConversation.getMessages().then(function (messages) {
        // theConversation.updateLastConsumedMessageIndex(totalMessages);
    });
}

function setTotalMessages() {
    theConversation.getMessages().then(function (messages) {
        totalMessages = messages.items.length;
        logger('setTotalMessages, Total Messages:' + totalMessages);
    });
}

// -----------------------------------------------------------------------------
// UI Functions

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
    $("#btn-chat").click(function () {
        if (thisConversationClient === "") {
            addChatMessage("First, create a Chat Client.");
            return;
        }
        const message = $("#message").val();
        if (message === "") {
            return;
        }
        $("#message").val("");
        theConversation.sendMessage(message);
    });
    $("#message").on("keydown", function (e) {
        if (e.keyCode === 13) {
            $("#btn-chat").click();
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
