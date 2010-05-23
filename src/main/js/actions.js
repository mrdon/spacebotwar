include('ringo/webapp/response');

var game = require('config').game;

exports.index = function index(req) {
    return skinResponse('skins/index.html', {
        content: "It's working!"
    });
}

exports.ships = function (req, id) {
    if (id === undefined) {
        if (req.isPost) {
            var body = JSON.parse(req.input.read().decodeToString(req.charset
                    || "utf-8"));
            var name = body.name;
            var type = game.SHIP_TYPES[body.shipType];
            var ai = eval(body.ai);
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


