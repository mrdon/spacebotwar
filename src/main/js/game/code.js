
// Space Trader Bots
// Created March 8, 2010 9:40:15 PM
// Copyright (c) 2010 Don Browna

Debug.categories.all = true; // show everything
Debug.trace( "MyCategory", "This will be shown!" );

var Ships = {
    clone: function() {
        return {
            maxThrust: this.maxThrust,
            maxTurnThrust: this.maxTurnThrust,
            weaponEnergyRechargeRate: this.weaponEnergyRechargeRate,
            maxWeaponEnergy: this.maxWeaponEnergy,
            maxShields: this.maxShields
        };
    },
    Starflyer: {
        width: 64,
        height: 64,
        url: '/images/sprites/ships/starflyer.png',
        hitRect: new Rect( 8, 8, 56, 56 ),
        maxThrust: 1,
        maxTurnThrust: 20,
        weaponEnergyRechargeRate: 0.1,
        maxWeaponEnergy: 10,
        maxShields: 10,
        clone: this.clone
    },
    Pinto: {
        width: 38,
        height: 44,
        url: '/images/sprites/ships/pinto.png',
        hitRect: new Rect( 0, 0, 44, 44),
        maxThrust: 1,
        maxTurnThrust: 20,
        weaponEnergyRechargeRate: 0.1,
        maxWeaponEnergy: 10,
        maxShields: 10,
        clone: this.clone
    },
    Wasp: {

        width: 46,
        height: 47,
        url: '/images/sprites/ships/wasp.png',
        hitRect: new Rect( 0, 0, 44, 44),
        maxThrust: 1,
        maxTurnThrust: 20,
        weaponEnergyRechargeRate: 0.1,
        maxWeaponEnergy: 10,
        maxShields: 10,
        clone: this.clone
    },
};

var AI = {
    random: function(state) {
      if (Math.random() * 100 < 1) {
        return ['shoot', [5]];
      }
      if (Math.random() * 70 < 1) {
        return ['fireRightTurnThrust', [Math.random()]];
      } else if (Math.random() * 70 < 1) {
        return ['fireLeftTurnThrust', [Math.random()]];
      }
      if (Math.random() * 5 < 1) {
        return ['fireThrust', [Math.random()/10]];
      }
    },
    kamakazi: function(state) {
       var target;
       for (var shipId in state.ships) {
            if (state.ships[shipId].type == 'PlayerShip') {
                var x = state.x - state.ships[shipId].x;
                var y = state.y - state.ships[shipId].y;

                var angleRad = Math.atan(y/x);
                var angle = angleRad * (180/Math.PI);

                if (x > 0) {
                    angle += 270;
                } else {
                    angle += 90;
                }
                var adiff = Math.abs(state.bearing - angle);

                Debug.trace("adiff:"+adiff+" angle:"+angle+" bearing:"+state.bearing+" x:"+x+" y:"+y+" sx:" + state.y+" ssx:"+state.ships[shipId].y);
                if (adiff > 5) {
                    if (state.rotation == 0) {
                        return ['fireRightTurnThrust', [5]];
                    } 
                } else {
                    if (state.rotation != 0) {
                        return ['fireLeftTurnThrust', [5]]; 
                    } else {
                        return ['fireThrust', [1]];
                    }
                }
            }
       }
    }
};

Sprite.extend('ShipCommon', {
   collisions: true,
   screenLoop: false,
   bearing: 0,
   rotation: 0,
   sharedState: {
     ships: {}
   },
   __construct: function(shipType) {
        this.shipType = shipType;
        for (var x in shipType) {
            this[x] = shipType[x];
        }
        this.weaponEnergy = this.maxWeaponEnergy;
        this.shields = this.maxShields;
   },
   updateState: function(clock) {
        this.sharedState.id = this.id;
        this.sharedState.x = this.x;
        this.sharedState.y = this.y;
        this.sharedState.bearing = this.bearing;
        this.sharedState.rotation = this.rotation;
        this.sharedState.speed = Math.sqrt(this.xd*this.xd + this.yd*this.yd);
        this.sharedState.weaponEnergy = this.weaponEnergy;
        this.sharedState.shields = this.shields;
        this.sharedState.shipType = this.shipType;
        for (shipId in Game.ships) {
            if (!this.sharedState.ships[shipId]) {
                this.sharedState.ships[shipId] = {};
            }
            var gameShip = Game.ships[shipId];
            var ship = this.sharedState.ships[shipId];
            ship.id = shipId;
            ship.x = gameShip.x;
            ship.y = gameShip.y;
            ship.bearing = gameShip.bearing;
            ship.type = gameShip.type;
        }
   },
   scanEnemy: function(enemyId) {
        var enemy = Game.ships[enemyId];
        var ship = this.sharedState.ships[enemyId];
        ship.shipType = enemy.shipType.clone();
        ship.shields = enemy.shields;
        ship.weaponEnergy = enemy.weaponEnergy;
   },
    recoverEnergy: function(clock) {
        if (this.maxWeaponEnergy > this.weaponEnergy) {
            this.weaponEnergy += this.weaponEnergyRechargeRate;
        }

        this.weaponEnergy = Math.min(this.weaponEnergy, this.maxWeaponEnergy);
    },
    logic: function(clock) {
        this.preTurn(clock);
        this.doTurn(clock);
        this.postTurn(clock);
    },
    preTurn: function(clock) {
        this.updateState(clock);
    },
    postTurn: function(clock) {

      if (this.rotation != 0) {
        this.bearing += this.rotation;
        if (this.bearing > 360) this.bearing = 0;
        if (this.bearing < 0) this.bearing = 360;
        this.setRotation(this.bearing);
      }

       // now move the sprite
      var hit = this.move();
      if (hit) {
         // we hit something! let's see what it was...
         switch (hit.target.type) {
            case this.enemy: 
               // we hit an enemy! destroy it!
               hit.target.explode();
               
               // and destroy ourselves as well
               this.explode();
               this.checkWin();
               break;
         }
      }
      this.recoverEnergy(clock);
      
      // keep ship inside screen bounds
      if (this.x < 0) { this.x = 0; this.xd = 0; }
      else if (this.x > 640 - 64) { this.x = 640 - 64; this.xd = 0; }
      if (this.y < 0) { this.y = 0; this.yd = 0; }
      else if (this.y > 480 - 64) { this.y = 480 - 64; this.yd = 0; }
    },
    explode: function() {
        Effect.Audio.playSound( 'explosion.mp3' );
        this.destroy();
        this.checkWin();
    },
    checkWin: function() {
      // check if any enemies are left
      if (!this.plane.findSprites({ type:'EnemyShip' }).length || !this.plane.findSprites({ type:'PlayerShip' }).length) {
         // none left! level complete!
         Effect.Audio.playSound( 'win.mp3' );
      }
    },
    shoot: function(energy) {
        if (this.weaponEnergy <= 0) {
            return;
        }

        energy = Math.min(energy, this.weaponEnergy);
        this.weaponEnergy -= energy;

            // fire a photon!
            var photon = this.plane.createSprite( 'Photon', {
               x: this.centerPointX(),
               y: this.centerPointY(),
               enemy: this.enemy,
               energy: energy
            } );
            photon.setRotation(this.bearing);
            var bearingInRadians = this.bearing * (Math.PI/180);
            photon.yd = this.yd + -1 * (Math.cos(bearingInRadians) * 4);
            photon.xd = this.xd + Math.sin(bearingInRadians) * 4;

            Effect.Audio.playSound( 'shoot.mp3' );
    },
    fireThrust: function(thrust) {
        thrust = Math.min(thrust, this.maxThrust);
        var bearingInRadians = this.bearing * (Math.PI/180);
        var ydd = -1 * (Math.cos(bearingInRadians) * thrust);
        var xdd = Math.sin(bearingInRadians) * thrust;
        this.yd += ydd;
        this.xd += xdd;
    },
    fireRightTurnThrust: function(turnThrust) {
        this.fireTurnThrust(turnThrust);
    },
    fireLeftTurnThrust: function(turnThrust) {
        this.fireTurnThrust(-1 * turnThrust);
    },
    fireTurnThrust: function(turnThrust) {
        if (turnThrust < 0) {
            turnThrust = Math.max(turnThrust, -1 * this.maxTurnThrust);
        } else {
            turnThrust = Math.min(turnThrust, this.maxTurnThrust);
        }
        this.rotation += turnThrust;
    }
    
});

ShipCommon.extend( 'PlayerShip', {
   enemy: 'EnemyShip',
   doTurn: function(clock) {
      var oldBearing = this.bearing;
      var oldSpeed = this.speed;
      if (Effect.Game.isKeyDown('right')) this.fireRightTurnThrust(0.1);
      else if (Effect.Game.isKeyDown('left')) this.fireLeftTurnThrust(0.1);
      else if (Effect.Game.isKeyDown('up')) {
        this.fireThrust(0.1);
      }

      if (oldBearing != this.bearing || oldSpeed != this.speed)
          Debug.trace("foo", "dx:"+this.xd+" dy:"+this.yd+" speed:"+this.speed+" bearing:"+this.bearing);
   },
   setup: function() {
      // this is called once when our sprite is created
      // setup our key listener for shoot
      Effect.Game.setKeyHandler( 'shoot', this );
   },
   onKeyDown: function(id) {
      // a key was pressed, let's see which one
      switch (id) {
         case 'shoot':
            this.shoot(5);
            break;
      }
   }    
} );

ShipCommon.extend( 'EnemyShip', {
   enemy: 'PlayerShip',
   allowedMethods: ['shoot', 'fireThrust', 'fireTurnThrust', 'fireLeftTurnThrust', 'fireRightTurnThrust'],
   doTurn: function(clock) {
      var turn = AI.kamakazi.apply(AI.kamakazi, [this.sharedState]);
      if (turn) {
        for (var allowedMethodId in this.allowedMethods) {
            if (turn[0] == this.allowedMethods[allowedMethodId]) {
                Debug.trace('', "turn1 " + turn[1]);
                this[turn[0]].apply(this, turn[1]);
                return;
            }
        }
        Debug.trace("ERROR: not matched: " + turn[0]);
      }
      
      // move horizontally

   //   this.xd += Math.random() - 0.5;
   //   this.yd += Math.random() - 0.5;
/*
      if (Math.random() * 100 < 1) {
        this.shoot(5);
      }
      if (Math.random() * 70 < 1) {
        this.fireRightTurnThrust(Math.random());
      } else if (Math.random() * 70 < 1) {
        this.fireLeftTurnThrust(Math.random());
      }
      if (Math.random() * 5 < 1) {
        this.fireThrust(Math.random()/10);
      }
      */
   },
} );
EnemyShip.add(Ships.Wasp);
PlayerShip.add(Ships.Starflyer);


Sprite.extend( 'Photon', {
   width: 16,
   height: 16,
   url: '/images/sprites/photon.png',
   collisions: true,
   dieOffscreen: true,
   logic: function(clock) {
      // move photon upward, checking for collisions
      this.yd *= 1.01;
      this.xd *= 1.01;
      var hit = this.move();
      if (hit) {
         // we hit something! let's see what it was...
         switch (hit.target.type) {
            case this.enemy:
               hit.target.shields -= this.energy;
               if (hit.target.shields <= 0) {
                   // we hit an enemy! destroy it!
                   hit.target.explode();
               }
               // destroy ourselves as well
               this.destroy();
               break;
         }
      }
   }
} );

var Game = {
    ships : {},
    planes : {}
}

Effect.Game.addEventListener( 'onLoadGame', function() {
   // custom port background
   Effect.Port.setBackground({
      color: 'black',
      url: '/images/backgrounds/stars.jpg'
   });
   
   // create our sprite plane
   var splane = new SpritePlane( 'sprites' );
   Effect.Port.attach( splane );
   Game.planes.sprites = splane;
   
   // create our player sprite, centered on the bottom
   Game.ships['player'] = splane.createSprite( 'PlayerShip', {
      id: 'player',
      x: 320 - (64 / 2),
      y: 480 - 64
   } );
   
   // create some targets at random positions
   for (var idx = 0; idx < 5; idx++) {
      var id = 'enemy' + idx;
      Game.ships[id] = splane.createSprite( 'EnemyShip', {
         id: id,
         x: Math.random() * (640 - 64),
         y: Math.random() * 240,
      //   xd: probably(0.5) ? 1 : -1
      } );
   }
} );
