//load the AMD modules we need
require(['frozen/GameCore', 'frozen/ResourceManager', 'dojo/keys', 'frozen/utils', 'frozen/box2d/Box', 'frozen/box2d/RectangleEntity', 'frozen/box2d/PolygonEntity', 'frozen/box2d/CircleEntity', 'Die', 'dojo/domReady!'],
 function(GameCore, ResourceManager, keys, utils, Box, Rectangle, Polygon, Circle, Die){



  //dimensions same as canvas.
  var gameH = 553;
  var gameW = 558;
  
  var speed = 6;

  var rm = new ResourceManager();
  var backImg = rm.loadImage('images/background.png');
  var blueDiceImg = rm.loadImage('images/blue_dice.png');
  var redDiceImg = rm.loadImage('images/red_dice.png');
  var whiteDiceImg = rm.loadImage('images/white_dice.png');
  var clack = rm.loadSound('sounds/clack.wav');


  var PLANK_FRICTION = 0.6;
  var SOUND_IMPULSE_THRESHOLD = 0.5;
  var DIE_HALF_SIZE = 18;
  var DICE_STARTS = [{x: 90, y: 4},{x: 134, y: 12}, {x: 115, y: 50}];
  var RAND_POSITION_OFFSET = 40;
  var SOUND_IMPULSE_MAX = 50;



  var box;
  var world = {};
  var dice = [];

  //pixels per meter for box2d
  var SCALE = 30.0;

  //objects in box2d need an id
  var geomId = 1;

  //shapes in the box2 world, locations are their centers
  var ground, ceiling, leftWall, centerWall, rightWall, plank1, plank2, plank3, die, die2, die3;


  

  var shuffle= function(myArray){
    var i = myArray.length;
    while ( --i ) {
       var j = Math.floor( Math.random() * ( i + 1 ) );
       var tempi = myArray[i];
       var tempj = myArray[j];
       myArray[i] = tempj;
       myArray[j] = tempi;
     }
    return myArray;
  };
  shuffle(DICE_STARTS);

  //create each of the shapes in the world
  ground = new Rectangle({
    id: geomId,
    x: 279 / SCALE,
    y: 548 / SCALE,
    halfWidth: 1000 / SCALE,
    halfHeight: 10 / SCALE,
    staticBody: true,
    friction: 0.05
  });
  world[geomId] = ground; //keep a reference to the shape for fast lookup

  geomId++;
  celing = new Rectangle({
    id: geomId,
    x: 385 / SCALE,
    y: -200 / SCALE,
    halfWidth: 1000 / SCALE,
    halfHeight: 40 / SCALE,
    staticBody: true
  });
  world[geomId] = celing;

  geomId++;
  leftWall = new Rectangle({
    id: geomId,
    x: 34 / SCALE,
    y: 0 / SCALE,
    halfWidth: 19 / SCALE,
    halfHeight: 540 / SCALE,
    staticBody: true
  });
  world[geomId] = leftWall;

  geomId++;
  centerWall = new Rectangle({
    id: geomId,
    x: 275 / SCALE,
    y: 240 / SCALE,
    halfWidth: 18 / SCALE,
    halfHeight: 180 / SCALE,
    staticBody: true
  });
  world[geomId] = centerWall;

  geomId++;
  rightWall = new Rectangle({
    id: geomId,
    x: 519 / SCALE,
    y: 0 / SCALE,
    halfWidth: 19 / SCALE,
    halfHeight: 540 / SCALE,
    staticBody: true
  });
  world[geomId] = rightWall;

  geomId++;
  plank1 = new Polygon({
    id: geomId,
    points: utils.scalePoints([{x: 51, y: 117},{x: 165, y: 172},{x: 161, y: 179},{x: 51, y: 126}], 1/SCALE),
    staticBody: true,
    friction: PLANK_FRICTION
  });
  world[geomId] = plank1;

  geomId++;
  plank2 = new Polygon({
    id: geomId,
    points: utils.scalePoints([{x: 143, y: 315},{x: 257, y: 260},{x: 257, y: 268},{x: 147, y: 322}], 1/SCALE),
    staticBody: true,
    friction: PLANK_FRICTION
  });
  world[geomId] = plank2;

  geomId++;
  plank3 = new Polygon({
    id: geomId,
    points: utils.scalePoints([{x: 51, y: 422},{x: 191, y: 539},{x: 172, y: 539},{x: 51, y: 436}], 1/SCALE),
    staticBody: true,
    friction: PLANK_FRICTION
  });
  world[geomId] = plank3;

  geomId++;
  dice[0] = new Die({
    id: geomId,
    img: whiteDiceImg,
    halfWidth: DIE_HALF_SIZE / SCALE,
    halfHeight: DIE_HALF_SIZE / SCALE
  });
  world[geomId] = dice[0];

  geomId++;
  dice[1] = new Die({
    id: geomId,
    img: redDiceImg,
    halfWidth: DIE_HALF_SIZE / SCALE,
    halfHeight: DIE_HALF_SIZE / SCALE
  });
  world[geomId] = dice[1];

  geomId++;
  dice[2] = new Die({
    id: geomId,
    img: blueDiceImg,
    halfWidth: DIE_HALF_SIZE / SCALE,
    halfHeight: DIE_HALF_SIZE / SCALE
  });
  world[geomId] = dice[2];



 var reloadBox = function(){

    // create our box2d instance
    box = new Box({intervalRate:60, adaptive:false, width:gameW, height:gameH, scale:SCALE, gravityY:9.8, resolveCollisions: rm.audioContext ? true : false});
 
    box.addBody(ground);
    box.addBody(celing);
    box.addBody(leftWall);
    box.addBody(centerWall);
    box.addBody(rightWall);
    box.addBody(plank1);
    box.addBody(plank2);
    box.addBody(plank3);
    box.addBody(dice[0]);
    box.addBody(dice[1]);
    box.addBody(dice[2]);

    shuffle(DICE_STARTS);
    for (var i = 0; i < dice.length; i++) {
      dice[i].values = dice[i].getShuffledValues();
      box.setPosition(dice[i].id, (DICE_STARTS[i].x + Math.random() * RAND_POSITION_OFFSET) / SCALE, (DICE_STARTS[i].y + Math.random() * RAND_POSITION_OFFSET) / SCALE );
      box.setLinearVelocity(dice[i].id, 0, 0);
    }
 };

  //setup a GameCore instance
  var game = new GameCore({
    canvasId: 'canvas',
    resourceManager: rm,
    initInput: function(im){
      //tells the input manager to listen for key events
      im.addKeyAction(keys.LEFT_ARROW);
      im.addKeyAction(keys.RIGHT_ARROW);
      im.addKeyAction(keys.UP_ARROW);

      im.addKeyAction(keys.SPACE, true);

    },
    handleInput: function(im){
      if(im.keyActions[keys.LEFT_ARROW].isPressed()){
        box.applyImpulseDegrees(dice[0].id, 270, speed);
      }

      if(im.keyActions[keys.RIGHT_ARROW].isPressed()){
        box.applyImpulseDegrees(dice[0].id, 90, speed);
      }

      if(im.keyActions[keys.UP_ARROW].isPressed()){
        box.applyImpulseDegrees(dice[0].id, 0, speed);
      }

      if(im.keyActions[keys.SPACE].getAmount() || im.mouseAction.isPressed() || im.touchAction.isPressed()){
        reloadBox();
      }

    },
    update: function(millis){
      
      //have box2d do an interation
      box.update(millis);
      //have update local objects with box2d calculations
      box.updateExternalState(world);

      if(rm.audioContext){
        dice.forEach(function(die){
          if(die.collisions){
            die.collisions.forEach(function(collision){
              if(collision.impulse > SOUND_IMPULSE_THRESHOLD){
                var gain = Math.min(collision.impulse, SOUND_IMPULSE_MAX) / SOUND_IMPULSE_MAX;
                rm.playSound(clack, false, 0, gain);
                console.log(collision.impulse, gain);
              }
            });
          }
        });
      }
      

    },
    draw: function(context){
      context.drawImage(backImg, 0, 0, this.width, this.height);
      //ground.draw(context, SCALE);
      //leftWall.draw(context, SCALE);
      //centerWall.draw(context, SCALE);
      //rightWall.draw(context, SCALE);
      //plank1.draw(context, SCALE);
      //plank2.draw(context, SCALE);
      //plank3.draw(context, SCALE);
      dice.forEach(function(die){
        die.draw(context, SCALE);
      });
      
    }
  });

  //if you want to take a look at the game object in dev tools
  console.log(game);


  var resizeGame = function() {
    var gameArea = document.getElementById('gameArea');
    var widthToHeight = gameW / gameH;
    var newWidth = window.innerWidth;
    var newHeight = window.innerHeight;
    var newWidthToHeight = newWidth / newHeight;
    
    if (newWidthToHeight > widthToHeight) {
        newWidth = newHeight * widthToHeight;
        gameArea.style.height = newHeight + 'px';
        gameArea.style.width = newWidth + 'px';
    } else {
        newHeight = newWidth / widthToHeight;
        gameArea.style.width = newWidth + 'px';
        gameArea.style.height = newHeight + 'px';
    }
    
    //gameArea.style.marginTop = (-newHeight / 2) + 'px';
    gameArea.style.marginLeft = (-newWidth / 2) + 'px';
    
    // var gameCanvas = document.getElementById('canvas');
    // gameCanvas.width = newWidth;
    // gameCanvas.height = newHeight;
  };




  resizeGame();
  window.addEventListener('resize', resizeGame, false);
  window.addEventListener('orientationchange', resizeGame, false);

  reloadBox();

  //launch the game!
  game.run();
});