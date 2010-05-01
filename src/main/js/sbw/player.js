var util = require('sbw/util');

var Player = function(args) {
    this.id = args.id;
    this.name = args.name;
    this.ships = [];
}

Player.prototype.hasShip(shipId) {
    return util.hasMember(this.ships, shipId);    
}

exports.Player = Player;
