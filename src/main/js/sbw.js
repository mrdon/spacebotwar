var log = require('ringo/logging').getLogger(module.id);

exports.log = {
    debug : function(msg) {log.debug(msg);},
    info : function(msg) {log.info(msg);},
    warn : function(msg) {log.warn(msg);},
    error : function(msg) {log.error(msg);},
    fatal : function(msg) {log.fatal(msg);}
};


exports.GOODS = {
    food : {
        min : 1,
        max : 10},
    weapons : {
        min : 50,
        max : 100},
    medicine : {
        min : 10,
        max : 50}
};

exports.SHIP_TYPES = {
    Pinto: {
        maxThrust: 10,
        maxTurnThrust: 20,
        maxWeaponEnergy: 10,
        weaponEnergyRechargeRate: 0.1,
        maxShields: 10,
        maxHolds: 10
    },
    Wasp: {
        maxThrust: 20,
        maxTurnThrust: 30,
        maxWeaponEnergy: 10,
        weaponEnergyRechargeRate: 0.2,
        maxShields: 10,
        maxHolds: 20
    },
    Starflyr: {
        maxThrust: 20,
        maxTurnThrust: 10,
        maxWeaponEnergy: 50,
        weaponEnergyRechargeRate: 0.2,
        maxShields: 50,
        maxHolds: 50
    }
};

/*exports.init = function(settings) {
    sbw.log = settings.log ? settings.log : function(msg) {};
}
*/



