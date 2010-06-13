var rest = require('rest');
require('core/object');
var model = require('model');
var JSON = require('core/json').JSON;
var bigBang = require('sbw/bigbang').bigBang;

rest.exportAsRestController(exports, model.Game, 'games', {
    onPost : function(req, res, body) {
        print('body:'+ body + " res: " + req + " req:" + res);
        var game = bigBang(Object.merge(body, {
            numSectors : 10000,
            maxHops: 100,
            systemNames : ['koa', 'mommy', 'tasi', 'ak', 'Sol', 'Rigel 5', 'Beri', 'Vauh', 'Listehe', 'Xyna', 'Suier'],
            systemsRatio: .2,
            meanGoods : 2000,
            inhabitedPlanetRatio : .4,
            maxPlanetsPerSector : 9,
            maxSectorSize : 1000
        }));
        game = Object.merge(game, body);
        game = new model.Game(game);
        game.save();
        return game;
    },
    onIndex : function(req, res) {
        var result = [], x, game;
        var all = model.Game.all();
        for (x = 0; x < all.length; x++) {
            game = all[x];
            result.push({
                _id : game._id,
                name : game.name,
                ships : game.ships.length,
                planets : game.planets.length,
                sections : game.sectors.length
            });
        }
        return result;
    }
});
/*exports.ships = function (req, id) {
    if (id === undefined) {
        if (req.isPost) {
            var body = JSON.parse(req.input.read().decodeToString(req.charset
                    || "utf-8"));
            var name = body.name;
            var type = game.SHIP_TYPES[body.shipType];
            var ai = JSON.parse(body.ai);
            var ship = game.addShip(name, type, ai);
            var res = new Response();
            res.addHeader("Location", req.scheme + "://" + req.host + ":" + req.port + req.scriptName + req.pathInfo 
                    + "/" + ship.id);
            res.status = 201;
            return res;
        } else if (req.isGet) {
            var result = [];
            var key;
            for (key in game.ships) {
                result.push(key);
            }
            return jsonResponse(result);
        }
    } else {
        if (req.isDelete) {
            game.removeShip(id);
            var res = new Response("Ship removed successfully");
            res.status = 200;
            return res;
        } else {
            var ship = game.ships[id]; // Figure out response.
            return !ship ? notFoundResponse(req.path) : 
                jsonResponse(ship.updateExternalState()) 
        }
    }
};

*/
