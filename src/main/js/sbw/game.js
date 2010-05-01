var bigbang = require('sbw/bigbang').bigbang;

export( 'addGame',
        'getGame'
      );
var games = {};
function addGame(gameName, settings) {
    var defaults = {
            numSectors : 100000,
            maxHops: 100,
            systemNames : ['koa', 'mommy', 'tasi', 'ak', 'Sol', 'Rigel 5', 'Beri', 'Vauh', 'Listehe', 'Xyna', 'Suier'],
            systemsRatio: .2,
            meanGoods : 2000,
            inhabitedPlanetRatio : .4,
            maxPlanetsPerSector : 9,
            maxSectorSize : 1000
        };

    settings.prototype = defaults;
    var game = bigbang(settings);
    games[gameName] = game;
    return game;
}

function getGame(gameName) {
    return games[gameName];
}

function getAllGames() {
    var result = {}, name;
    for (name in games) {
        result[name] = games[name];
    }
    return result;
}

