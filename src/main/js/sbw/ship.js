var util = require('sbw/util');

var Ship = function(args) {
    this.x = args.x;
    this.y = args.y;
    this.id = args.id;
    this.name = args.name;
    this.sector = args.sector;

    // Copy in ship type properties
    var ind, len, val;
    for (ind in args.type) {
        if (args.type.hasOwnProperty(ind)) {
            val = args.type[ind];
            this[ind] = val;
        }   
    }

    this.bearing = 0;
    this.rotation = 0;
    this.xd = 0;
    this.yd = 0;
    this.weaponEnergy = 0;
    this.shields = 0;
}


Ship.prototype.updateExternalState = function(state) {
    state = state ? state : {};
    state.id = this.id;
    state.x = this.x;
    state.y = this.y;
    state.sector = this.sector.updateExternalState(state.sector);
    state.bearing = this.bearing;
    state.rotation = this.rotation;
    state.speed = Math.sqrt(this.xd*this.xd + this.yd*this.yd);
    state.weaponEnergy = this.weaponEnergy;
    state.shields = this.shields;
    return state;
}

Ship.prototype.updatePositionAndBearing = function() {
    var toRotate = this.nextRotation ? this.nextRotation : 0;
    if (this.nextRotation === undefined && this.rotation != 0) {
        toRotate = this.rotation;
    }
    if (toRotate != 0) {
        this.bearing = util.adjustBearing(this.bearing, toRotate);
    }
    this.nextRotation = undefined;

    this.x += this.xd;
    this.y += this.yd;
}


Ship.prototype.fireThrust = function(thrust) {
    thrust = Math.min(thrust, this.maxThrust);
    var ad = util.applyThrust(thrust, this.bearing);
    this.yd += ad.ydd;
    this.xd += ad.xdd;
};

Ship.prototype.fireTurnThrust = function(turnThrust) {
    if (turnThrust < 0) {
        turnThrust = Math.max(turnThrust, -1 * this.maxTurnThrust);
    } else {
        turnThrust = Math.min(turnThrust, this.maxTurnThrust);
    }
    this.nextRotation = this.rotation + turnThrust / 2;
    this.rotation += turnThrust;
}

Ship.prototype.fireRightTurnThrust = function(turnThrust) {
        this.fireTurnThrust(this, turnThrust);
};

Ship.prototype.fireLeftTurnThrust = function(turnThrust) {
        this.fireTurnThrust(this, -1 * turnThrust);
};
 
Ship.prototype.recoverEnergy = function(clock) {
    if (this.maxWeaponEnergy > this.weaponEnergy) {
        this.weaponEnergy += this.weaponEnergyRechargeRate;
    }

    this.weaponEnergy = Math.min(this.weaponEnergy, this.maxWeaponEnergy);
};

exports.Ship = Ship;
