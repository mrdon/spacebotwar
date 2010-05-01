var GOODS = require('sbw').GOODS;
var Market = require('sbw/market').Market;
var Planet = require('sbw/planet').Planet;
var Sector = require('sbw/sector').Sector;
var Ship = require('sbw/ship').Ship;
var ShipRunner = require('sbw/shiprunner').ShipRunner;
var rnd = require('sbw/util').rnd;
var log = require('sbw').log;


var allGoods = [];
for (var id in GOODS) {
    allGoods.push(id);
}

function createPlanet(id, name, coords, conf) {
    var goodsPos = Math.floor(Math.random() * allGoods.length);
    var meanGoods = conf.meanGoods ? conf.meanGoods : 2000;
    var inhabitedPlanetRatio = conf.inhabitedPlanetRatio ? conf.inhabitedPlanetRatio : .4;
    var market;
    if (Math.random() < inhabitedPlanetRatio) {
        market = new Market(allGoods.slice(0, goodsPos), meanGoods);
    }

    return new Planet({
        x : coords[0],
        y : coords[1],
        name : name,
        id : id,
        market : market
    });
}

function createSystems(conf, sectors) {
    var systemsRatio = conf.systemsRatio ? conf.systemsRatio : .2;
    var maxPlanetsPerSector = conf.maxPlanetsPerSector ? conf.maxPlanetsPerSector : 9;
    var systemNames = conf.systemNames;

    var planets = [];
    var x, y, len, s, sid, numPlanets, pindex, p, sindex;
    var numSectors = sectors.length;
    var numSystems = Math.floor(sectors.length * systemsRatio);

    // fill out system names
    var curNameIndex = 0;
    var origNameMax = systemNames.length - 1;
    for (var count = 0; count < numSystems; count++) {
        if (!systemNames[count]) {
            systemNames[count] = systemNames[curNameIndex] + " " + count;
            if (++curNameIndex > origNameMax) {
                curNameIndex = 0;
            }
        }
    }

    // populate systems
    for (sindex = 0; sindex < numSystems; sindex++) {
        do {
            sid = Math.floor(Math.random() * numSectors);
            s = sectors[sid];
        } while (s.planets.length > 0)
        numPlanets = Math.floor(Math.random() * maxPlanetsPerSector + 1);
        for (pindex = 0; pindex < numPlanets; pindex++) {
            x = Math.floor(Math.random() * s.size/90 + s.size/10);
            y = Math.floor(Math.random() * s.size/90 + s.size/10);
            p = createPlanet(planets.length, systemNames[planets.length], [x, y], conf);
            planets.push(p);
            s.addPlanet(p);
        }
    }
    return planets; 

}

function findPotentialWarp(s, sectors, numSectors) {
    var tries, tid, target;
    tries = 1;
    do {
        tid = Math.floor(Math.random() * numSectors);//rnd(s.id, numSectors/100*tries);
        target = sectors[tid];
        tries++;
    } while (tid === s.id || tid < 0 || tid >= numSectors || target.warps.length ===  6 
                    || s.hasWarp(tid) !== undefined);
    return target;
}

function setWarps(s, sectors) {
    var target, x;
    var numSectors = sectors.length;
    var warpNum = Math.floor(Math.max(Math.min(Math.abs(rnd(3, 1)), 6), 2)); //Math.floor(Math.random() * 6 + 1);
    for (x = s.warps.length; x < warpNum; x++) {
        target = findPotentialWarp(s, sectors, numSectors);
        s.warps.push(target.id);
        target.warps.push(s.id);
    }
}

function linkSector(s, sectors, visited, hopDepth, maxHops) {
    var x, tries, tid, target;

    if (hopDepth >= maxHops || visited[s.id]) {
        return;
    }

    visited[s.id] = true;
    
    setWarps(s, sectors);
    s.expectedHops = hopDepth;

    for (x = 0; x < s.warps.length; x++) {
        linkSector(sectors[s.warps[x]], sectors, visited, hopDepth+1, maxHops);
    }
}

function calcHopsToSol(sectors) {
    var s = sectors[0];
    s.hopsToSol = 0;
    var queue = [], visited = [], node, x, len, warp, warpId;
    queue.push(s);

    var found = false;
    while (!found) {
        node = queue.shift();

        if (node !== undefined) {
            //log.debug("Popping " + node.id);
            for (x = 0, len = node.warps.length; x < len; x++) {
                warpId = node.warps[x];
                if (!visited[warpId]) {
                    warp = sectors[warpId];
                    visited[warpId] = true;
                    warp.hopsToSol = Math.min(warp.hopsToSol, node.hopsToSol + 1);
                    queue.push(warp);
                }
            }
        } else {
            found = true;
        }
    }

}

function linkOrphanSectors(sectors, maxHops) {
    var x, len, s, target, count = 0;
    for (x = 0, len = sectors.length; x < len; x++) {
        s = sectors[x];
        if (s.hopsToSol === Infinity) {
            count++;
            do {
                target = findPotentialWarp(s, sectors, sectors.length);
            } while (target.hopsToSol >= maxHops);
            target.warps.push(s.id);
            s.warps.push(target.id);
            s.hopsToSol = target.hopsToSol + 1;
        }
    }
    log.debug("Linked " + count + " orphans");
}
function createSectors(numSectors, maxHops, maxSectorSize) {
    var sectors = [];
    var x, hopDepth, sectorsToLink, len, s, warpNum, tid, target, tries, size;

    for (x = 0; x < numSectors; x++) {
        size = Math.floor(Math.random() * maxSectorSize + maxSectorSize/5);
        sectors[x] = new Sector(x, size);
    }

    linkSector(sectors[0], sectors, [], 0, maxHops);
    
    calcHopsToSol(sectors);

    linkOrphanSectors(sectors, maxHops);

    return sectors;
}

function bigBang(conf) {
    var numSectors = conf.numSectors;

    log.info("Creating sectors");
    var game = {};
    game.ships = [];
    game.sectors = createSectors(numSectors, conf.maxHops, conf.maxSectorSize);
    game.planets = createSystems(conf, game.sectors);
    game.shipRunners = [];
    game.addShip = function(name, type, ai) {
        var ship = new Ship({
            id : game.ships.length,
            name : name,
            sector : game.sectors[0],
            type : type,
            x : 10,
            y : 10,
        });
        game.ships.push(ship);

        var runner = new ShipRunner(game, ship, ai);
        game.shipRunners.push(runner);
        return ship;
    };
    game.runShips = function(ticks) {
        var tick, ticklen, x, len, runner;
        for (tick = 0; tick < ticks; tick++) {
            for (x = 0, len = game.shipRunners.length; x < len; x++) {
                runner = game.shipRunners[x];
                runner.tick();
            }
        }
    }
    return game;
};

exports.bigBang = bigBang;
