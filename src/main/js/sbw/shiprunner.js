
var util = require('sbw.util');
var floatEqual = util.floatEqual;
var floatCompare = util.floatCompare;
var log = require('sbw').log;

function ensureValid(type, arr, id) {
    var s = arr[id];
    if (s === undefined) {
        throw new Error("Invalid " + type + ": " + id);
    }
    return s;
}

function ensureValidShip(game, id) {
    return ensureValid('ship', game.ships, id);
}

function ensureValidSector(game, id) {
    return ensureValid('sector', game.sectors, id);
}

function ensurePlayerOwnsShip(player, shipId) {
    if (player.hasShip(shipId) === undefined) {
        throw new Error("Player " + player.name + " doesn't own ship " + shipId); 
    }
}

function ensureSectorNotCurrent(ship, targetId) {
    if (ship.sector.id === targetId) {
        throw new Error("ship " + ship.name + " already in sector " + targetId);
    }
}

function ensureWarpable(ship) {
    var size = ship.sector.size;
    return ship.x <= 0 || ship.x >= size - 1 ||
           ship.y <= 0 || ship.y >= size - 1;
}


function warp(game, state, toSectorId, actions) {
    var ship = state.ship;
    var from = ship.sector;
    var to = ensureValidSector(game, toSectorId);
    ensureSectorNotCurrent(ship, toSectorId);
    ensureWarpable(ship);
    actions.push(function(clock) {
        from.exitShip(ship);
        to.enterShip(ship);
    });
}

function bringRotationToStop(state, actions) {
    if (floatEqual(state.rotation, 0)) {
        return;
    }
    var turnFunc, fullTurns, remainingVelocity, bearingAdjustment;
    var rotation = state.rotation;
    var bearing = state.bearing;
    var ship = state.ship;
    var max = ship.maxTurnThrust;
    turnFunc = floatCompare(rotation, '>', 0) ? ship.fireLeftTurnThrust : ship.fireRightTurnThrust;
    bearingAdjustment = floatCompare(rotation, '<', 0) ? 1 : -1;
    fullTurns = Math.floor(calcBurnsToChangeVelocity(max, Math.abs(rotation), 0));
    for (x = 0; x < fullTurns; x++) {
        fireTurnThrust(state, max * bearingAdjustment, actions);
    }

    var remainingVelocity = state.rotation;
    if (!floatEqual(remainingVelocity, 0)) {
        fireTurnThrust(state, remainingVelocity * -1, actions);
    }
}

function calcVelocityDirection(xd, yd) {
    var angRad = Math.atan(Math.abs(yd / xd));
    var ang = angRad * (180/Math.PI);

    if (floatCompare(xd, '>=', 0)) {
        // quad I
        if (floatCompare(yd, '<=', 0)) {
            // keep answer
        // quad IV
        } else {
            ang += 90;
        }
    } else {
        // quad III
        if (floatCompare(yd, '<=', 0)) {
            ang += 270
        // quad II
        } else {
            ang += 180;
        }
    } 
    return ang;

}
function bringVelocityToStop(state, actions) {
    if (floatEqual(state.xd, 0) && floatEqual(state.yd, 0)) {
        return;
    }
    var velocityMagnitude = Math.sqrt(state.xd*state.xd + state.yd*state.yd);
    var velocityDirection = calcVelocityDirection(state.xd, state.yd);
    var ship = state.ship;

    var actionsBeforeTurn = actions.length;
    turnTo(state, util.adjustBearing(velocityDirection, 180), actions);
    var turns = actions.length - actionsBeforeTurn;
    state.x += state.xd * turns;
    state.y += state.yd * turns;
    
    var max = ship.maxThrust;
    var thrust, ad;
    if (floatCompare(velocityMagnitude, '>', 0)) {
        thrust = Math.min(max, velocityMagnitude);
        fireThrust(state, thrust, actions);
    }
}

function findShortestDistance(targetDeg, bearing) {
    var diff = targetDeg - bearing;

    if (diff > 180) {
        diff = diff - 360;
    } else if (diff < -180) {
        diff = 360 + diff;
    }
    return diff;
}

function turnTo(state, targetDeg, actions) {
    var bearing = state.bearing;
    var rotation = state.rotation;
    var ship = state.ship;
    var max = ship.maxTurnThrust;
    var turnFunc, diff, thrust;


    if (floatEqual(state.rotation, 0) && floatEqual(state.bearing, targetDeg)) {
        return;
    }

    // bring to a stop
    if (!floatEqual(rotation, 0)) {
        bringRotationToStop(state, actions);
        bearing = state.bearing;
    }

    if (floatEqual(bearing, targetDeg) && floatEqual(rotation, 0)) {
        return;
    }

    diff = findShortestDistance(targetDeg, bearing);

    var bearingAdjustment = floatCompare(diff, '>', 0) ? 1 : -1;
    var remainingDistance = Math.abs(diff);
    thrust = Math.min(remainingDistance, max);

    fireTurnThrust(state, thrust * bearingAdjustment, actions);

    var remainingDistance = remainingDistance - thrust / 2;
    while (floatCompare(remainingDistance, '>=', thrust * 1.5)) {
        fireTurnThrust(state, 0, actions);
        remainingDistance -= thrust;
    }

    var revBearingAdjustment = bearingAdjustment * -1;
    fireTurnThrust(state, thrust * revBearingAdjustment, actions);
    remainingDistance -= thrust / 2;

    var remainingThrust = Math.min(remainingDistance, max);
    if (!floatEqual(remainingThrust, 0)) {
        fireTurnThrust(state, remainingThrust * bearingAdjustment, actions);
        fireTurnThrust(state, remainingThrust * revBearingAdjustment, actions);
    }
    if (!floatEqual(state.bearing, targetDeg) || !floatEqual(state.rotation, 0)) {
        debugger;
        throw new Error("Turn unsuccessful");
    }
}
    

function calcDistance(time, acceleration, initialVelocity) {
    initialVelocity = initialVelocity ? initialVelocity : 0;
    return initialVelocity * time + .5 * acceleration * time * time;
}   

function calcBurnsToChangeVelocity(acceleration, initialVelocity, targetVelocity) {
    // v = v0 + a * t
    return Math.floor(Math.abs((targetVelocity - initialVelocity) / acceleration));
}

function moveTo(state, targetX, targetY, actions) {
    var ship = state.ship;
    //bringRotationToStop(state, actions);
    bringVelocityToStop(state, actions);
    var startX = state.x;
    var startY = state.y;
    if (floatEqual(startX, targetX) && floatEqual(startY, targetY)) {
        return;
    }
    var distanceToTarget = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(targetY - startY, 2));
    var bearing = calcVelocityDirection(targetX - startX, targetY - startY);
    var max = ship.maxThrust;

    move(state, bearing, distanceToTarget, actions);

    if (!floatEqual(state.x, targetX) || !floatEqual(state.y, targetY)) {
        log.error("Incorrect post-moveTo state");
        debugger;
    }
}

function calcTurnMoves(state, targetBearing) {
    var rotateActions = [];
    var oldBearing = state.bearing;
    turnTo(state, targetBearing, rotateActions);
    state.bearing = oldBearing;
    return rotateActions.length;
}

function move(state, bearing, distanceToTarget, actions) {
    var ad;
    var ship = state.ship;
   
    turnTo(state, bearing, actions);

    var max = ship.maxThrust;
    var revBearing = util.adjustBearing(bearing, 180);
    
    // calculate number of actions to reverse direction
    var coastingTurns = calcTurnMoves(state, revBearing);
    var idealSegmentLength = distanceToTarget / (coastingTurns + 1);
    var thrust = Math.min(idealSegmentLength, max);

    fireThrust(state, thrust, actions);
    var remainingDistance = distanceToTarget - thrust / 2;

    turnTo(state, revBearing, actions);
    remainingDistance -= coastingTurns * thrust;

    while (floatCompare(remainingDistance, '>', thrust / 2)) {
        fireThrust(state, 0, actions);
        remainingDistance -= thrust;
    }
    
    fireThrust(state, thrust, actions);
    remainingDistance -= thrust / 2;

    if (!floatEqual(remainingDistance, 0)) {
        move(state, revBearing, -1 * remainingDistance, actions);
    }
}

function fireThrust(state, amount, actions) {
    var ship = state.ship;
    if (floatEqual(amount, 0)) {
        state.x += state.xd;
        state.y += state.yd;
        actions.push(function(clock) {});
    } else {
        var ad = util.applyThrust(amount, state.bearing);
        state.x += state.xd + ad.xdd / 2;
        state.y += state.yd + ad.ydd / 2;
        state.xd += ad.xdd;
        state.yd += ad.ydd;
        actions.push(function(clock) {ship.fireThrust(amount);});
    }
    state.bearing = util.adjustBearing(state.bearing, state.rotation);
}

function fireTurnThrust(state, amount, actions) {
    var ship = state.ship;
    if (floatEqual(amount, 0)) {
        state.bearing = util.adjustBearing(state.bearing, state.rotation);
        actions.push(function(clock) {});
    } else {
        actions.push(function(clock) {ship.fireTurnThrust(amount);});
        state.bearing = util.adjustBearing(state.bearing, state.rotation + amount / 2);
        state.rotation += amount;
    }
    state.x += state.xd;
    state.y += state.yd;
}

function updateActionState(ship, state) {
    state.bearing = ship.bearing;
    state.rotation = ship.rotation;
    state.x = ship.x;
    state.y = ship.y;
    state.xd = ship.xd;
    state.yd = ship.yd;
    state.ship = ship;
}

function executeActionFunction(actions, doneCallback, func) {
    func();
    if (doneCallback !== undefined) {
        actions.push(function(clock) {doneCallback();});
    }
}

var ShipRunner = function(game, ship, ai) {
    this.game = game;
    this.ship = ship;
    this.ai = ai;
    this.state = {};
    var actionState = {};
    this.actionState = actionState;
   
    var actions = [];
    var api = {
        state : this.state,
        clearActions : function() {
            log.info("Clearing actions");
            actions.length = 0;
        },
        warp : function(toSectorId, doneCallback) {
            executeActionFunction(actions, doneCallback, function() {
                log.info("Warping to " + toSectorId); 
                warp(game, actionState, toSectorId, actions)
            }); 
        },
        fireThrust : function(amount, doneCallback) {
            executeActionFunction(actions, doneCallback, function() {
                log.info("Firing thrust " + amount); 
                fireThrust(actionState, amount, actions);
            });
        },
        fireLeftTurnThrust : function(amount, doneCallback) {
            executeActionFunction(actions, doneCallback, function() {
                log.info("Firing left thrust " + amount);
                fireTurnThrust(actionState, amount * -1, actions);
            });
        },
        fireRightTurnThrust : function(amount, doneCallback) {
            executeActionFunction(actions, doneCallback, function() {
                log.info("Firing right thrust " + amount);
                fireTurnThrust(actionState, amount, actions);
            });
        },
        turnTo : function(targetDegrees, doneCallback) {
            executeActionFunction(actions, doneCallback, function() {
                log.info("Turning to " + targetDegrees);
                turnTo(actionState, targetDegrees, actions);        
            });
        },
        moveTo : function(x, y, doneCallback) {
            executeActionFunction(actions, doneCallback, function() {
                log.info("Moving to " + x + " " + y);
                moveTo(actionState, x, y, actions);        
            });
        }
    };
   

    this.api = api;
    this.actions = actions;
}

ShipRunner.prototype.tick = function(clock) {
    this.ship.updateExternalState(this.state);
    this.state.actionsRemaining = this.actions.length;
    if (this.actions.length === 0) {
        updateActionState(this.ship, this.actionState);
    }
    this.ai.tick(this.api, clock);
    var action = this.actions.shift();
    if (action) {
        action(clock);
    }

    // todo: check for collisions
    var nextX = this.ship.x + this.ship.xd;
    var nextY = this.ship.y + this.ship.yd;
    this.ship.sector.moveTo(this.ship, nextX, nextY);
    this.ship.updatePositionAndBearing();
    this.ship.recoverEnergy(clock);
}

exports.ShipRunner = ShipRunner;
