// -----------------------------------------------------------------------------
// Documentation:       https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/
//                      https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Client.html
//                      https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Conversation.html
// Resources:
// Service:             https://www.twilio.com/docs/conversations/api/service-resource
// Conversation:        https://www.twilio.com/docs/conversations/api/conversation-resource
// Conversation Partic: https://www.twilio.com/docs/conversations/api/conversation-participant-resource
// Conversation Msg:    https://www.twilio.com/docs/conversations/api/conversation-message-resource
// User:                https://www.twilio.com/docs/conversations/api/user-resource
// Message:             https://www.twilio.com/docs/conversations/api/service-conversation-message-resource
// 
// -----------------------------------------------------------------------------
let thisConversationClient = "";
let theConversation = "";           // Conversation object
let thisToken;
let totalMessages = 0; // This count of read channel messages needs work to initialize and maintain the count.

userIdentity = "";
chatChannelName = "";
chatChannelDescription = "";
// const Twilio = require('twilio');
// const Chat = require('twilio-chat');

// -----------------------------------------------------------------------------
function createChatClientObject() {
    userIdentity = $("#username").val();
    if (userIdentity === "") {
        logger("Required: Username.");
        addChatMessage("Enter a Username to use when chatting.");
        return;
    }
    addChatMessage("++ Creating Conversations Client, please wait.");
    // Since, programs cannot make an Ajax call to a remote resource,
    // Need to do an Ajax call to a local program that goes and gets the token.
    logger("Refresh the token using client id: " + userIdentity);
    //
    // I should use: $.getJSON
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
            addChatMessage("+ Chat client created for the user: " + userIdentity);
            //
            // When the conversation object is created,
            //  the participant is automatically joined to the subscribed conversations.
            // The sample application maintains a list of subscribed/joined conversations.
            //  https://www.twilio.com/docs/conversations/javascript/exploring-conversations-javascript-quickstart#
            //  { conversations: [...this.state.conversations, conversation] }
            addChatMessage("+ Participant is subscribed and joined to conversations: ");
            thisConversationClient.getSubscribedConversations().then(function (paginator) {
                for (i = 0; i < paginator.items.length; i++) {
                    const aConversation = paginator.items[i];
                    let listString = '++ ' + aConversation.uniqueName + ": " + aConversation.friendlyName + ": " + aConversation.createdBy;
                    addChatMessage(listString);
                }
                addChatMessage("+ End list.");
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
            thisConversationClient.on('channelAdded', onChannelAdded);
            // thisConversationClient.on('channelRemoved', $.throttle(tc.loadChannelList));
            // thisConversationClient.on('tokenExpired', onTokenExpiring);
            //
            thisConversationClient.on('tokenAboutToExpire', onTokenAboutToExpire);
            //

            thisConversationClient.on("conversationJoined", (conversation) => {
                logger("+ Conversation joined: " + conversation.uniqueName);
            });
            thisConversationClient.on("conversationLeft", (thisConversation) => {
                logger("+ Existed the conversation.");
            });

        });
    }).fail(function () {
        logger("- Error refreshing the token and creating the chat client object.");
    });
}

function onChannelAdded(aChannel) {
    // https://media.twiliocdn.com/sdk/android/chat/releases/2.0.6/docs/com/twilio/chat/ChatClientListener.html
    // Called when the current user is added to a channel.
    logger("onChannelAdded, user added to the  channel: " + aChannel.friendlyName);
    // Note, joined but not subscribed.
}

function onTokenAboutToExpire() {
    logger("onTokenExpiring: Refresh the token using client id: " + userIdentity);
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
        // -------------------------------
    }).fail(function () {
        logger("- onTokenAboutToExpire: Error refreshing the chat client token.");
    });
}

// -----------------------------------------------------------------------------
function joinChatConversation() {
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
    var jqxhr = $.get("joinConversation?conversationid=" + conversationName + "&identity=" + userIdentity, function (returnString) {
        logger("+ returnString :" + returnString + ":");
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
    addChatMessage("++ Conversation joined.");
    setButtons("join");
    // -------------------------------------------------------------------------
    // Set conversation event listeners.
    theConversation.on('messageAdded', function (message) {
        // https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Message.html
        addChatMessage("> " + message.author + " : " + message.conversation.uniqueName + " : " + message.body);
        incCount();
    });
}

// -----------------------------------------------------------------------------
function listConversations() {
    if (thisConversationClient === "") {
        addChatMessage("First, create a Chat Client.");
        logger("Required: Chat Client.");
        return;
    }
    chatChannelName = $("#channelName").val();
    addChatMessage("+ List of conversations.");
    logger("Refresh the token using client id: " + userIdentity);
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
    logger("Function: deleteConversation()");
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
        if (returnString !== "0") {
            addChatMessage("-- Warning, conversation not removed.");
            logger("-- Conversation not removed.");
            return;
        }
        addChatMessage("+ Conversation removed.");
    }).fail(function () {
        logger("- Error removing conversation.");
    });
}

// -----------------------------------------------------------------------------
function listMembers() {
    logger("+ Called: listMembers().");
    var members = theConversation.getSubscribedUsers();
    addChatMessage("+ -----------------------");
    addChatMessage("+ Members of this conversation: " + theConversation.uniqueName);
    members.then(function (currentMembers) {
        currentMembers.forEach(function (member) {
            if (member.lastConsumedMessageIndex !== null) {
                addChatMessage("++ " + member.identity + ", Last Consumed Message Index = " + member.lastConsumedMessageIndex);
            } else {
                addChatMessage("++ " + member.identity);
            }
        });
    });
}

function listAllMessages() {
    logger("+ Called: listAllMessages().");
    theConversation.getMessages().then(function (messages) {
        totalMessages = messages.items.length;
        logger('Total Messages: ' + totalMessages);
        addChatMessage("+ -----------------------");
        addChatMessage("+ All current messages:");
        for (i = 0; i < totalMessages; i++) {
            const message = messages.items[i];
            // properties: https://media.twiliocdn.com/sdk/js/chat/releases/3.2.1/docs/Message.html
            addChatMessage("> " + message.author + " : " + message.body);
        }
        // theConversation.updateLastConsumedMessageIndex(totalMessages);
        addChatMessage('+ Total Messages: ' + totalMessages);
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
    // $("div.callMessages").html("Activity: " + activity);
    switch (activity) {
        case "init":
            $('#btn-createChatClient').prop('disabled', false);
            //
            $('#btn-list').prop('disabled', true);
            $('#btn-join').prop('disabled', true);
            //
            $('#btn-delete').prop('disabled', true);
            $('#btn-chat').prop('disabled', true);
            $('#btn-members').prop('disabled', true);
            $('#btn-count').prop('disabled', true);
            $('#btn-countzero').prop('disabled', true);
            $('#btn-listallmessages').prop('disabled', true);
            break;
        case "createChatClient":
            $('#btn-createChatClient').prop('disabled', true);
            //
            $('#btn-list').prop('disabled', false);
            $('#btn-join').prop('disabled', false);
            //
            $('#btn-delete').prop('disabled', false);
            $('#btn-chat').prop('disabled', true);
            $('#btn-members').prop('disabled', true);
            $('#btn-count').prop('disabled', true);
            $('#btn-countzero').prop('disabled', true);
            $('#btn-listallmessages').prop('disabled', true);
            break;
        case "join":
            $('#btn-createChatClient').prop('disabled', true);
            //
            $('#btn-list').prop('disabled', false);
            $('#btn-join').prop('disabled', false);
            //
            $('#btn-delete').prop('disabled', false);
            $('#btn-chat').prop('disabled', false);
            // $('#btn-members').prop('disabled', false);
            // $('#btn-count').prop('disabled', false);
            // $('#btn-countzero').prop('disabled', false);
            $('#btn-listallmessages').prop('disabled', false);
            break;
    }
}

function logger(message) {
    var aTextarea = document.getElementById('log');
    aTextarea.value += "\n> " + message;
    aTextarea.scrollTop = aTextarea.scrollHeight;
}
function clearLog() {
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
