var rnd = require('sbw/util').rnd;
var GOODS = require('sbw').GOODS;

function Item(itemType, meanGoods) {
    this.type = itemType;
    this.sellPrice = 0;
    this.buyPrice = 0;
    this.amount = rnd(meanGoods, meanGoods/5);
    this.maxAmount = this.amount * 2;
}

Item.prototype.resetPrice = function() {
    this.buyPrice = Math.floor(Math.random()*item.max + item.min);
    this.sellPrice = Math.floor(Math.random()*item.max + this.buy[id]);
}

var Market = function(goodIds, meanGoods) {
    var x, len, id;
    this.items = {};
    for (x = 0, len = goodIds.length; x < len; x++) {
        id = goodIds[x];
        this.items[id] = new Item(GOODS[id], meanGoods);
    }
}
Market.prototype.resetPrice = function() {
    var x, len, item;
    for (x = 0, len = this.items.length; x < len; x++) {
        item = this.items[x];
        item.resetPrice();
    }
}

exports.Market = Market;
