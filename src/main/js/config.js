
module.shared = true;
exports.httpConfig = {
  staticDir: 'static'
};

exports.urls = [
    [ '/', 'actions' ]
];

exports.middleware = [
    'ringo/middleware/etag',
    'ringo/middleware/responselog',
    'ringo/middleware/error',
    'ringo/middleware/notfound'
    // 'ringo/middleware/profiler'
];

exports.app = require('ringo/webapp').handleRequest;

exports.macros = [
    'ringo/skin/macros',
    'ringo/skin/filters'
];


exports.game = require('sbw/bigbang').bigBang({
    numSectors : 100000,
    maxHops: 100,
    systemNames : ['koa', 'mommy', 'tasi', 'ak', 'Sol', 'Rigel 5', 'Beri', 'Vauh', 'Listehe', 'Xyna', 'Suier'],
    systemsRatio: .2,
    meanGoods : 2000,
    inhabitedPlanetRatio : .4,
    maxPlanetsPerSector : 9,
    maxSectorSize : 1000
});

exports.charset = 'UTF-8';
exports.contentType = 'text/html';
