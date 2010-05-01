var util = require('sbw/util');

var Sector = function(id, size) {
    this.id = id;
    this.size = size;
    this.hopsToSol = Infinity;
    this.warps = [];
    this.planets = [];
    this.ships = [];
    this.contents = {};
}
Sector.prototype.hasWarp = function(tid) {
    return util.hasMember(this.warps, tid);
}

Sector.prototype.hasPlanet = function(planetId) {
    return util.hasMember(this.planets, planetId);
}

Sector.prototype.hasShip = function(shipId) {
    return util.hasMember(this.ships, shipId);
}

Sector.prototype.hasContent = function(x, y) {
    return this.contents[[x, y]];
}

Sector.prototype.addPlanet = function(planet) {
    var coords = [planet.x, planet.y];
    planet.sector = this.id;
    this.contents[coords] = planet;
    this.planets.push(planet.id);
}

Sector.prototype.moveTo = function(movable, x, y) {
    delete this.contents[[movable.x, movable.y]];
    this.contents[[x, y]] = movable;
}

Sector.prototype.enterShip = function(ship) {
    var x = Math.floor(Math.random() * this.size);
    var y = util.rndBoolean() ? 0 : this.size - 1;
    if (util.rndBoolean()) {
        x = y;
        y = x;
    }

    ship.x = x;
    ship.y = y;
    this.contents[x, y] = ship;
    this.ships.push(ship.id);
    ship.sector = this;
}

Sector.prototype.exitShip = function(ship) {
    var x = this.hasShip(ship.id);
    this.ships.slice(x, 1);
    delete this.contents[ship.x, ship.y];
    ship.x = undefined;
    ship.y = undefined;
    ship.sector = undefined;
}

Sector.prototype.updateExternalState = function(state) {
    state = state ? state : {};
    state.id = this.id;
    state.size = this.size;
    state.warps = this.warps.slice();
    state.planets = this.planets.slice();
    return state;
}

exports.Sector = Sector;
