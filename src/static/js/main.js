/* JShint config */
/* globals ted */

var loaders = [];
var imgpath = 'static/img/';
var tedframesmisc = ['right_stand.png','left_stand.png'];
var leftframeswalk = ['left_walk_1.png','left_walk_2.png','left_walk_3.png','left_walk_4.png','left_walk_5.png','left_walk_6.png','left_walk_7.png','left_walk_8.png','left_walk_9.png','left_walk_10.png','left_walk_11.png','left_walk_12.png','left_walk_13.png'];
var rightframeswalk = ['right_walk_1.png','right_walk_2.png','right_walk_3.png','right_walk_4.png','right_walk_5.png','right_walk_6.png','right_walk_7.png','right_walk_8.png','right_walk_9.png','right_walk_10.png','right_walk_11.png','right_walk_12.png','right_walk_13.png'];
var worldimages = ['layer_1.png','layer_2.png','layer_3.png','layer_4.png','layer_5.png'];

//preload images
function loadFile(src,array,num) {
    var deferred = $.Deferred();
	var sprite = new Image();
	sprite.onload = function() {
		array[num] = sprite;
		deferred.resolve();
	};
	sprite.src = src;
    return deferred.promise();
}
//loop through and call all the preload images
function callAllPreloads(array,dir){
    for(var z = 0; z < array.length; z++){
        loaders.push(loadFile(dir + array[z], array, z));
    }
}
//fixme at some point having all of these simply in a big structure would mean we could loop through it all in one call rather than all these individual ones
callAllPreloads(tedframesmisc,imgpath);
callAllPreloads(leftframeswalk,imgpath);
callAllPreloads(rightframeswalk,imgpath);
callAllPreloads(worldimages,imgpath + 'world/');

//general object for player
function PlayerObj(){
	this.xpos = 100;
	this.ypos = 100;
	this.idealw = 500;
	this.idealh = 504;
	this.w = 0;
	this.h = 0;
	this.sprite = tedframesmisc[0];
	this.spritew = 500;
	this.spriteh = 504;
	this.spritex = 0;
	this.spritey = 0;
	this.walkrightframes = [];
	this.walkleftframes = [];
	//contains: key pressed, animation frames, frame duration, end frame, direction
	this.animations = [
		[39, rightframeswalk, 50, tedframesmisc[0], 1],
		[37, leftframeswalk, 50, tedframesmisc[1], -1],
		[0, [rightframeswalk[1]], 50, rightframeswalk[1],1],
		[0, [leftframeswalk[1]], 50, leftframeswalk[1],-1],
	];
	this.curranim = 0;
	this.animationStart = 0;
	this.currentFrame = 0;
	this.maxFrames = 0;
	this.walkdirection = 0;
	this.facing = 1; //facing left
	this.speed = 0;
	this.limitxmin = 0; //this is the window within which the character can move, outside of the world moves
	this.limitxmax = 0;
	this.jumping = 0; //flag to indicate whether we've left the ground
	this.jumpBy = 0; //height to jump per frame
	this.jumpUp = 1; //flag to prevent double jumping, 1 is okay to jump, 0 is should fall
	this.jumpStart = 0; //height the jump started from
	this.jumpHeight = 0; //maximum jump height
	this.jumpSpeed = 20; //how fast jumping occurs
	this.jumpTiming = 0;

	this.init = function(){
		var sizes = ted.general.calculateAspectRatio(this.idealw,this.idealh,ted.canvasw,ted.canvash / 2);
		this.w = sizes[0];
		this.h = sizes[1];

		var posx = (this.xpos / ted.prevcanvasw) * 100;
		this.xpos = (ted.canvasw / 100) * posx;
		this.ypos = ted.canvash - this.h;

		this.limitxmin = (ted.canvasw / 100) * 10;
		this.limitxmax = (ted.canvasw / 100) * 40;

		this.speed = (this.w / 100) * 5; //base the speed on the width of the character, 5% is an arbitrarily chosen value that looks okay
		this.jumpHeight = (this.h / 100) * 50;
		this.jumpBy = this.jumpHeight / 10;
	};

	this.draw = function(){
		ted.general.drawOnCanvas(this);
	};

	//this is a bit clumsy but two keys need to cancel each other out
	this.move = function(keys){
		if(keys[38]){
			if(this.jumping){
				this.handleJump();
			}
			else {
				this.initJump();
			}
		}
		else {
			this.stopJump();
		}

		if(keys[37] && keys[39]){ //both keys are pressed, don't move
			this.walkdirection = 0;
		}
		else if(keys[37]){ //move right
			this.walkdirection = 37;
			this.facing = 0;
		}
		else if(keys[39]){ //move left
			this.walkdirection = 39;
			this.facing = 1;
		}
		else {
			this.walkdirection = 0;
		}
		if(this.walkdirection){
			this.doAnimation();
		}
		else {
			this.clearAnimation();
		}
	};

	this.handleJump = function(){
		var newy = (this.ypos + this.h) - this.jumpBy;
		if(this.jumpTiming < (new Date().getTime() - this.jumpSpeed)){
			this.jumpTiming = new Date().getTime();
			if(this.jumpUp){
				if(newy > (this.jumpStart - this.jumpHeight)){ //this is confusing, remember y axis starts from 0 at the top of the canvas
					this.ypos = this.ypos - this.jumpBy;
				}
				else {
					this.jumpUp = 0;
				}
			}
			else {
				this.stopJump();
			}
		}
	};

	this.stopJump = function(){
		if(this.jumping){
			if(this.ypos + this.h < this.jumpStart){
				this.ypos = Math.min(this.ypos + this.jumpBy, this.jumpStart - this.h);
			}
			else {
				this.jumping = 0;
				if(this.facing){
					this.sprite = tedframesmisc[0];
				}
				else {
					this.sprite = tedframesmisc[1];
				}
			}
		}
	};

	this.initJump = function(){
		this.clearAnimation();
		this.jumping = 1;
		this.jumpUp = 1;
		this.jumpStart = this.ypos + this.h;
	};

	this.doAnimation = function(){
		if(this.curranim === 0){ //look up and store the required animation
			for(var i = 0; i < this.animations.length; i++){
				if(this.animations[i][0] === this.walkdirection){ //the key pressed matches this action, so do it
					this.curranim = this.animations[i];
					this.currentFrame = 0;
					this.maxFrames = this.curranim[1].length; //store some data about this animation
					//this.animationStart = new Date().getTime(); //record now, the time we started the animation
					break;
				}
			}
		}
		if(this.animationStart < (new Date().getTime() - this.curranim[2]) || this.animationStart === 0){ //if it's time to move to the next frame
			this.moveCharacter();
			this.animationStart = new Date().getTime();
			if(this.currentFrame < this.maxFrames){ //check if we need to loop back to the first frame
				this.sprite = this.curranim[1][this.currentFrame];
				this.currentFrame++;
			}
			else {
				this.currentFrame = 0;
			}
		}
	};

	//move the character on the screen within the limits of the bounding box, if outside, move the world
	this.moveCharacter = function(){
		var newxpos = this.xpos + (this.speed * this.curranim[4]);
		if(newxpos < this.limitxmax && newxpos > this.limitxmin){
			this.xpos = newxpos;
		}
		else {
			ted.world.move(this.curranim[4],this.speed);
		}
	};

	//clear any current animation, using the information stored within it
	this.clearAnimation = function(){
		if(this.curranim){
			this.sprite = this.curranim[3];
			this.animationStart = 0;
			this.curranim = 0;
		}
	};
}

//object for the world
function WorldObj(){
	this.xpos = 0;
	this.w = 0;
	this.h = 0;
	this.limitxmin = 0;
	this.limitxmax = 500;
	this.layers = [
		{
			name: 'foreground',
			sprite: worldimages[0],
			spriteactualw: 10000,
			spriteactualh: 56,
			spritex: 0,
			spritey: 0,
			xpos: 0,
			ypos: 0,
			w: 0,
			h: 0,
			scalex: 2
		},
		{
			name: 'main',
			sprite: worldimages[1],
			spriteactualw: 5000,
			spriteactualh: 167,
			xpos: 0,
			ypos: 0,
			scalex: 1
		},
		{
			name: 'pyramids',
			sprite: worldimages[2],
			spriteactualw: 3000,
			spriteactualh: 343,
			xpos: 0,
			ypos: 0,
			scalex: 0.6
		},
		{
			name: 'hills',
			sprite: worldimages[3],
			spriteactualw: 3500,
			spriteactualh: 280,
			xpos: 0,
			ypos: 0,
			scalex: 0.7
		},
		{
			name: 'sky',
			sprite: worldimages[4],
			spriteactualw: 2500,
			spriteactualh: 645,
			xpos: 0,
			ypos: 0,
			scalex: 0.5
		}
	];

	this.init = function(){
		this.limitxmax = this.w;
		for(var i = 0; i < this.layers.length; i++){
			/*
				layers are set to the same width and height of the canvas
				the world is many times larger than the canvas (currently 5x)
				each layer moves at a different speed, the images displayed on them are an appropriate size for the speed, controlled by the scalex value, assuming a world size x5 of the canvas e.g.
				- layer with scalex 1 is same size as the world, moves at 1x world speed, so needs an image that is 500% the width of the canvas, or the same width as the world
				- layer with scalex 2 is same size as the world, moves at 2x world speed, so needs an image that is 1000% the width of the canvas, or twice the width of the world

			//set size of each layer, relates to the overall world size using the scalex value
			this.layers[i].w = this.w * this.layers[i].scalex + (ted.canvasw * (1 - this.layers[i].scalex)); //this extra addition makes all layers finish together at the right edge of the canvas
			this.layers[i].h = this.h * this.layers[i].scaley;
			*/
			if(!this.xpos){ //only do this on page load
				var posx = (this.layers[i].xpos / ted.prevcanvasw) * 100;
				this.layers[i].spritex = (ted.canvasw / 100) * posx;
				this.layers[i].spritey = 0;
			}


			var perc = ((ted.canvasw / this.w) * 100) / this.layers[i].scalex; //this is the percentage of the layer image we need to display
			this.layers[i].spritew = ((this.layers[i].spriteactualw / 100) * perc) ; //this is the actual px of the image we need to display
			this.layers[i].spriteh = this.layers[i].spriteactualh;

			var tmp = this.w * this.layers[i].scalex; //actual size of the image on this layer
			var tmp2 = (tmp / this.layers[i].spriteactualw) * 100;
			var tmp3 = (this.layers[i].spriteactualh / 100) * tmp2;
			this.layers[i].h = tmp3;
			this.layers[i].w = ted.canvasw;

			//draw each one from the bottom of the canvas, fixme may change
			this.layers[i].ypos = ted.canvash - this.layers[i].h;
		}
	};

	this.draw = function(layer){
		//image, start drawing from sprite at x, at y, sprite width, sprite height, draw on canvas at x, at y, width to draw this at, height
		//ted.ctx.drawImage(obj.sprite, obj.spritex, obj.spritey, obj.spritew, obj.spriteh, obj.xpos, obj.ypos, obj.w, obj.h);
		ted.general.drawOnCanvas(this.layers[layer]);
	};

	//move the world's x coordinate
	this.move = function(direction,speed){
		var newpos = this.xpos + (speed * direction);
		this.xpos = Math.max(this.limitxmin,Math.min(newpos,this.limitxmax));
		//console.log(newpos,this.xpos);

		//fixme bug here - speed seems proportional to screen size but wrong - small screen very slow movement
		for(var i = 0; i < this.layers.length; i++){
			var newx = this.layers[i].spritex + ((speed * direction) * this.layers[i].scalex);
			/*
			if(i == 1){
				console.log(this.layers[i].spritex,'speed:',speed,'dir:',direction,'scale:',this.layers[i].scalex,'newx:',newx,this.xpos);
			}
			*/
			this.layers[i].spritex = newx;
		}
	};
}




(function( window, undefined ) {
var ted = {
	canvas: 0,
	ctx: 0,
	canvasw: 0,
	canvash: 0,
	idealw: 1000,
	idealh: 600,
	prevcanvasw: 0, //used to 'remember' what the previous canvas size was, for purposes of recalculation
	prevcanvash: 0,
	player: 0,
	keyState: [],

    general: {
        init: function(){
            ted.canvas = document.getElementById('canvas');
            if(!ted.canvas.getContext){
                $('#canvas').html('Your browser does not support canvas. Sorry.');
            }
            else {
                ted.ctx = ted.canvas.getContext('2d');
                this.initCanvasSize();
                ted.prevcanvasw = ted.canvasw;
                ted.prevcanvash = ted.canvash;
				ted.general.setupPlayer();
				ted.general.setupWorld();
	            ted.game.gameLoop();
            }
        },
        //initialise the size of the canvas based on the ideal aspect ratio and the size of the parent element
		initCanvasSize: function(){
			var parentel = $('#canvas').parent();
			//resize the canvas to maintain aspect ratio depending on screen size
			var sizes = ted.general.calculateAspectRatio(ted.idealw,ted.idealh,parentel.width(),parentel.height());
			ted.canvas.width = ted.canvasw = sizes[0];
			ted.canvas.height = ted.canvash = sizes[1];

        },
        //given a width and height representing an aspect ratio, and the size of the containing thing, return the largest w and h matching that aspect ratio
		calculateAspectRatio: function(idealw,idealh,parentw,parenth){
			var aspect = Math.floor((parenth / idealh) * idealw);
			var cwidth = Math.min(idealw, parentw);
			var cheight = Math.min(idealh, parenth);

			var w = Math.min(parentw,aspect);
			var h = (w / idealw) * idealh;
			return([w,h]);
		},
        //fixme this will contain resizing for all the elements as well
        resizeCanvas: function(){
			ted.prevcanvasw = ted.canvasw;
			ted.prevcanvash = ted.canvash;
			ted.general.initCanvasSize();
			ted.player.init();
			ted.world.w = ted.canvasw * 5;
			ted.world.h = ted.canvash;
			ted.world.init();
		},
        clearCanvas: function(){
            ted.ctx.clearRect(0, 0, ted.canvas.width, ted.canvas.height); //clear the canvas
        },
        //given an object with assumed attributes, draw it on the canvas
        drawOnCanvas: function(obj){
			//image, start drawing from sprite at x, at y, sprite width, sprite height, draw on canvas at x, at y, width to draw this at, height
			ted.ctx.drawImage(obj.sprite, obj.spritex, obj.spritey, obj.spritew, obj.spriteh, obj.xpos, obj.ypos, obj.w, obj.h);
		},
		setupPlayer: function(){
			ted.player = new PlayerObj();
			//console.log(ted.canvasw,ted.player.w);
			ted.player.xpos = (ted.canvasw / 100) * 10; //fixme
			ted.player.init();
			//http://stackoverflow.com/questions/12273451/how-to-fix-delay-in-javascript-keydown
			window.addEventListener('keydown',function(e){
			    ted.keyState[e.keyCode || e.which] = true;
			},true);
			window.addEventListener('keyup',function(e){
			    ted.keyState[e.keyCode || e.which] = false;
			},true);
		},
		setupWorld: function(){
			ted.world = new WorldObj();
			ted.world.w = ted.canvasw * 5;
			ted.world.h = ted.canvash;
			ted.world.init();
		}
    },
    game: {
		gameLoop: function(){
			ted.player.move(ted.keyState);
			ted.general.clearCanvas(); //don't need to do this if we're completely overdrawing the canvas
			ted.world.draw(4);
			ted.world.draw(3);
			ted.world.draw(2);
			ted.world.draw(1);
			ted.player.draw();
			ted.world.draw(0);
			setTimeout(ted.game.gameLoop,20);
		}
	}
};
window.ted = ted;
})(window);



window.onload = function(){
	$.when.apply(null, loaders).done(function() {
	    ted.general.init();
    });

	var resize;
	window.addEventListener('resize', function(event){
		clearTimeout(resize);
		resize = setTimeout(ted.general.resizeCanvas,200);
	});
};

