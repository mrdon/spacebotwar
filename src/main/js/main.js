#!/usr/bin/env ringo

// main script to start application

var bigbang = require('sbw/bigbang');
include('sbw');
if (require.main == module.id) {
    var game = bigBang({
        numSectors : 100000,
        maxHops: 100,
        systemNames : ['koa', 'mommy', 'tasi', 'ak', 'Sol', 'Rigel 5', 'Beri', 'Vauh', 'Listehe', 'Xyna', 'Suier'],
        systemsRatio: .2,
        meanGoods : 2000,
        inhabitedPlanetRatio : .4,
        maxPlanetsPerSector : 9,
        maxSectorSize : 1000
    });

    var actions = [];
    var state = 'start';
    var ship = game.addShip("Bob", SHIP_TYPES.Pinto, {
        tick : function(api, clock) {
            if (actions.length > 0) {
                actions.shift()(api, clock);
            }
    });

    require("ringo/webapp").start();
}
