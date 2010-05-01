export( 'rnd',
        'rnd_snd',
        'rndBoolean',
        'floatEqual',
        'floatCompare',
        'hasMember',
        'applyThrust',
        'adjustBearing');

function rnd_snd() {
    return (Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1);
}

function rnd(mean, stdev) {
    return Math.round(util.rnd_snd()*stdev+mean);
}

function rndBoolean() {
    return Math.random() > .5;
}

function floatEqual(first, second) {
    return Math.abs(first - second) < 0.000001;
}

function floatCompare(a, comp, b) {
    var precision = 6;
    var multiplier = Math.pow(10, precision);
    a = Math.round(a * multiplier); // multiply to do integer comparison instead of floating point
    b = Math.round(b * multiplier);
    switch (comp) {
        case ">":
            return (a > b);
        case ">=":
            return (a >= b);
        case "<":
            return (a < b);
        case "<=":
            return (a <= b);
        case "==":
            return (a == b);
    }
    throw new Error("Invalid comparison operator: " + comp);
}

function hasMember(arr, id) {
    var x, len;
    for (x = 0, len = arr.length; x < len; x++) {
        if (id === arr[x]) {
            return x;
        }
    }
    return undefined;
}

function applyThrust(thrust, bearing) {
    var angRad = bearing % 90;

    var bearingInRadians = angRad * (Math.PI/180);
    var ydd = Math.sin(bearingInRadians) * thrust;
    var xdd = Math.cos(bearingInRadians) * thrust;
    if (bearing < 90) {
        ydd *= -1;
    } else if (bearing < 180) {
        
    } else if (bearing < 270) {
        xdd *= -1;
    } else {
        xdd *= -1;
        ydd *= -1;
    }
    return {
        ydd : ydd,
        xdd : xdd
    };
}

function adjustBearing(deg, delta) {
    deg += delta;
    if (deg > 360) deg = deg - 360;
    if (deg < 0) deg = 360 + deg;
    if (util.floatEqual(deg, 360)) deg = 0;
    return deg;
}

