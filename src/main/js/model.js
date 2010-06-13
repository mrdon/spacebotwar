// Use datastore implementation defined in config module
var store = require('./config').store;

export('Game', 'Ship');

/**
 * Game class
 * @param properties object containing persistent properties
 */
var Game = store.defineEntity('Game');

/*Book.prototype.getFullTitle = function() {
        return this.author.name + ": " + this.title;
};*/


