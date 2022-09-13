console.log("+ Set callbacks directory routes/index.js.");
const callbacks = require('./callbacks');
module.exports = app => {
	callbacks(app);
};

