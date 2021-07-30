// -----------------------------------------------------------------------------
// Documentation:       https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/
//                      https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Client.html
//                      https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Conversation.htm
// 
// Documentation:       https://www.twilio.com/docs/chat/rest/channels
// Server side delete:  https://www.twilio.com/docs/chat/rest/channels
// Message properties:  https://www.twilio.com/docs/chat/rest/messages

// Members:             https://www.twilio.com/docs/chat/rest/member-resource
// Membersproperties:   https://www.twilio.com/docs/chat/rest/member-resource#member-properties
// 
// Users:               https://www.twilio.com/docs/chat/rest/user-resource
// User properties:     https://www.twilio.com/docs/chat/rest/user-resource#user-properties
// User property, attributes: The JSON string that stores application-specific data.
// 
// -----------------------------------------------------------------------------
let thisConversationsClient = "";
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
        Twilio.Conversations.Client.create(thisToken).then(chatClient => {
            logger("Conversations client created: thisConversationsClient.");
            thisConversationsClient = chatClient;
            addChatMessage("+ Chat client created for the user: " + userIdentity);
            //
            // thisConversationsClient.getSubscribedConversations();
            addChatMessage("+ Participant is subscribed to conversations: ");
            thisConversationsClient.getSubscribedConversations().then(function (paginator) {
                for (i = 0; i < paginator.items.length; i++) {
                    const channel = paginator.items[i];
                    let listString = '++ ' + channel.uniqueName + ": " + channel.friendlyName + ": " + channel.createdBy;
                    if (channel.uniqueName === chatChannelName) {
                        listString += " *";
                    }
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
            thisConversationsClient.on('channelAdded', onChannelAdded);
            // thisConversationsClient.on('channelRemoved', $.throttle(tc.loadChannelList));
            // thisConversationsClient.on('tokenExpired', onTokenExpiring);
            //
            thisConversationsClient.on('tokenAboutToExpire', onTokenAboutToExpire);
            //

            thisConversationsClient.on("conversationJoined", (conversation) => {
                logger("+ Conversation joined.");
            });
            thisConversationsClient.on("conversationLeft", (thisConversation) => {
                logger("+ Conversation left.");
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
        thisConversationsClient.updateToken(thisToken);
        // -------------------------------
    }).fail(function () {
        logger("- onTokenAboutToExpire: Error refreshing the chat client token.");
    });
}

// -----------------------------------------------------------------------------
function joinChatConversation() {
    logger("Function: joinChatConversation()");
    if (thisConversationsClient === "") {
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
    
    // Stacy need the conversation SID.
    var jqxhr = $.get("joinConversation?conversationsid=" + conversationName + "&identity=" + userIdentity, function (returnString) {
            logger("+ returnString :" + returnString + ":");
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

    joinConversation();
}

function createConversation() {
    // http://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Client.html#createConversation__anchor
    logger("+ Create the channel if it doesn't exist: " + chatChannelName);
    thisConversationsClient.createConversation({
        uniqueName: chatChannelName,
        friendlyName: chatChannelName
    })
            .then(channel => {
                theConversation = channel;
                logger("Conversation exists: " + chatChannelName + " : " + theConversation);
                joinConversation();
                logger("+ Conversation Attributes: "
                        // + channel.getAttributes()
                        + " SID: " + channel.sid
                        + " name: " + channel.friendlyName
                        );
            })
            .catch(function () {
                logger("- Error, failed to create the conversation.");
            });
}

function joinConversation() {
    if (thisConversationsClient === "") {
        addChatMessage("First, create a Chat Client.");
        logger("Required: Chat Client.");
        return;
    }
    chatChannelName = $("#channelName").val();
    if (chatChannelName === "") {
        addChatMessage("Enter a Channel name.");
        logger("Required: Channel name.");
        return;
    }

    theConversation.join().then(function (channel) {
        logger('Joined channel as ' + userIdentity);
        addChatMessage("+++ You can start chatting. Channel joined: " + channel + ".");
        setButtons("join");
    }).catch(function (err) {
        if (err.message === "Member already exists") {
            addChatMessage("++ You already exist in the channel.");
            setButtons("join");
        } else if (err.message === "Webhook cancelled processing of command") {
            addChatMessage("++ You have joined the channel.");
            setButtons("join");
        } else {
            logger("- Join failed: " + theConversation.uniqueName + ' :' + err.message + ":");
            addChatMessage("- Join failed: " + err.message);
        }
    });
    // -------------------------------------------------------------------------
    // Set conversation event listeners.
    theConversation.on('messageAdded', function (message) {
        // https://media.twiliocdn.com/sdk/js/conversations/releases/1.2.1/docs/Message.html
        addChatMessage("> " + message.author + " : " + message.conversation.uniqueName + " : " + message.body);
        incCount();
    });
}

// -----------------------------------------------------------------------------
function listChannels() {
    if (thisConversationsClient === "") {
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

function deleteChannel() {
    logger("Function: deleteChannel()");
    if (thisConversationsClient === "") {
        addChatMessage("First, create a Chat Client.");
        logger("Required: Chat Client.");
        return;
    }
    chatChannelName = $("#channelName").val();
    if (chatChannelName === "") {
        addChatMessage("Enter a Channel name.");
        logger("Required: Channel name.");
        return;
    }
    thisConversationsClient.getChannelByUniqueName(chatChannelName)
            .then(function (channel) {
                theConversation = channel;
                logger("Channel exists: " + chatChannelName + " : " + theConversation);
                theConversation.delete().then(function (channel) {
                    addChatMessage('+ Deleted channel: ' + chatChannelName);
                }).catch(function (err) {
                    if (theConversation.createdBy !== userIdentity) {
                        addChatMessage("- Can only be deleted by the creator: " + theConversation.createdBy);
                    } else {
                        logger("- Delete failed: " + theConversation.uniqueName + ', ' + err);
                        addChatMessage("- Delete failed: " + err);
                    }
                });
            }).catch(function () {
        logger("Channel doesn't exist.");
        addChatMessage("- Channel doesn't exist, cannot delete it: " + chatChannelName);
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
        listChannels();
    });
    $("#btn-delete").click(function () {
        deleteChannel();
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
        if (thisConversationsClient === "") {
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
            // $('#btn-delete').prop('disabled', false);
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
            // $('#btn-delete').prop('disabled', false);
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
