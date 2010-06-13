var Response = require('ringo/webapp/response').Response;
require('core/object');

function parseBody(req) {
    return JSON.parse(req.input.read().decodeToString(req.charset
                    || "utf-8"));
}

function writeEntity(res, entity) {
    if (!entity && res.status === 200) {
       res.status = 404; 
    } else {
        res.write(JSON.stringify(entity));
        res.contentType = 'application/json';
        return res;
    }
}

function callAction(res, actionFunc, args) {
    var result;
    //try {
       result = actionFunc.apply(actionFunc, args);
    /*} catch (e) {
        if (e.printStackTrace) {
            e.printStackTrace();
        } else {
            res.write(JSON.stringify(e));
        }
        res.contentType = 'application/json';
        if (e.status === 200) {
            e.status = 400;
        }
    }
    */
    return result;
}

function entityUrl(req, id)
{
    return req.scheme + "://" + req.host + ":" + req.port + req.scriptName + req.pathInfo 
                + "/" + id;
}

exports.exportAsRestController = function (exports, Entity, entityPluralName, actions) {
    var postFunc = function(req) {
        var body = parseBody(req);
        var res = new Response();
        var entity;
        if (actions.onPost) {
            entity = callAction(res, actions.onPost, [req, res, body]);
        } else {
            entity = new Entity(body);
            entity.save();
        }
        res.addHeader("Location", entityUrl(req, entity._id));
        res.status = 201;
        return res;
    };

    var putFunc = function(req, id) {
        var body = parseBody(req);
        var res = new Response();
        var entity;
        if (actions.onPut) {
            entity = callAction(res, actions.onPut, [req, res, id, body]);
        } else {
            entity = Entity.get(id);
            if (entity) {
                for (key in body) {
                    entity[key] = body[key];
                }
                entity.save();
            }
        }
        if (!entity && res.status === 200) {
            res.status = 404;
        } 
        return res;
    };

    var deleteFunc = function(req, id) {
        var result = {};
        var entity;
        var res = new Response();
        if (actions.onDelete) {
            entity = callAction(res, actions.onDelete, [req, res, id]);
        } else {
            entity = Entity.get(id);
            if (entity) {
                entity.remove();
            }
        }
        if (!entity && res.status === 200) {
            res.status = 404;
        } 
        return res;
    };

    var getFunc = function(req, id) {
        var result = {};
        var entity;
        var res = new Response();
        if (actions.onGet) {
            entity = callAction(res, actions.onGet, [req, res, id]);
        } else {
            entity = Entity.get(id);
        }
        writeEntity(res, entity);
        return res;
    };

    var indexFunc = function(req) {
        var result = [], x, e;
        var entity;
        var res = new Response();
        if (actions.onIndex) {
            entity = callAction(res, actions.onIndex, [req, res]);
        } else {
            entity = Entity.all();
            for (x in entity) {
                e = entity[x];
                if (e._id) {
                    e.link = entityUrl(req, e._id);
                }
            }
        }
        writeEntity(res, entity);
        return res;
    };

    exports[entityPluralName] = function(req, id) {
        if (id === undefined) {
            if (req.isPost) {
                return postFunc(req);
            } else if (req.isGet) {
                return indexFunc(req);
            }
        } else {
            if (req.isDelete) {
                return deleteFunc(req, id);
            } else {
                return getFunc(req, id);
            }
        }
    };
};



