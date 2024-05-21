// -----------------------------------------------------------------------------
// Get and display a token.
function createChatClientObject() {
    userIdentity = "dave";
    logger("++ Creating Conversations Client, refresh the token using client id: " + userIdentity);
    var jqxhr = $.get("generateConversationToken?identity=" + userIdentity, function (token) {
        if (token === "0") {
            logger("- Error refreshing the token.");
            return;
        }
        thisToken = token;
        logger("New Token: " + thisToken);
    }).fail(function () {
        logger("- Error refreshing the token and creating the Conversations client object.");
    });
}
// -----------------------------------------------------------------------------
window.onload = function () {
    logger("+++ window.onload Start ------------------------------------------------------------------");
    createChatClientObject();
};
// -----------------------------------------------------------------------------
// eof