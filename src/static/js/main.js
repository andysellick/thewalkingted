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
	this.walkrightframes = [];
	this.walkleftframes = [];
	//contains: key pressed, animation frames, frame duration, end frame, direction
	this.animations = [
		[39, rightframeswalk, 50, tedframesmisc[0], 1],
		[37, leftframeswalk, 50, tedframesmisc[1], -1]
	];
	this.curranim = 0;
	this.animationStart = 0;
	this.currentFrame = 0;
	this.maxFrames = 0;
	this.walkdirection = 0;
	this.speed = 10;
	this.limitxmin = 0; //this is the window within which the character can move, outside of the world moves
	this.limitxmax = 0;
	this.jump = 0;
	this.jumpHeight = 50;
	
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
	};

	this.draw = function(){
		ted.general.drawOnCanvas(this);
	};

	//this is a bit clumsy but two keys need to cancel each other out
	this.move = function(keys){
		if(keys[37] && keys[39]){ //both keys are pressed, don't move
			this.walkdirection = 0;
		}
		else if(keys[37]){ //move right
			this.walkdirection = 37;
		}
		else if(keys[39]){ //move left
			this.walkdirection = 39;
		}
		else {
			this.walkdirection = 0;
		}
		
		if(keys[38] && this.jump === 0){
			console.log('up');
		}
		
		if(this.walkdirection){
			this.doAnimation();
		}
		else {
			this.clearAnimation();
		}
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
			//check and move x position
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
	//this.speed = 10;
	this.w = 0;
	this.h = 0;
	this.limitxmin = 0;
	this.limitxmax = 500;
	this.layers = [
		{
			name: 'foreground',
			sprite: worldimages[0],
			spritew: 2880,
			spriteh: 56,
			xpos: 0,
			ypos: 0,
			idealw: 960,
			idealh: 56,
			w: 0,
			h: 0,
			scalex: 2,
			scaley: 0.1
		},
		{
			name: 'main',
			sprite: worldimages[1],
			spritew: 5000,
			spriteh: 167,
			xpos: 0,
			ypos: 0,
			idealw: 961,
			idealh: 167,
			w: 0,
			h: 0,
			scalex: 1,
			scaley: 0.3
		},
		{
			name: 'first background',
			sprite: worldimages[2],
			spritew: 3000,
			spriteh: 343,
			xpos: 0,
			ypos: 0,
			idealw: 714,
			idealh: 343,
			w: 0,
			h: 0,
			scalex: 0.8,
			scaley: 0.6
		},
		{
			name: 'second background',
			sprite: worldimages[3],
			spritew: 3500,
			spriteh: 280,
			xpos: 0,
			ypos: 0,
			idealw: 960,
			idealh: 280,
			w: 0,
			h: 0,
			scalex: 0.7,
			scaley: 0.5
		},
		{
			name: 'background',
			sprite: worldimages[4],
			spritew: 2500,
			spriteh: 645,
			xpos: 0,
			ypos: 0,
			idealw: 960,
			idealh: 645,
			w: 0,
			h: 0,
			scalex: 0.5,
			scaley: 1
		}
	];

	this.init = function(){
		for(var i = 0; i < this.layers.length; i++){
			//set size of each layer, relates to the overall world size using the scalex value
			this.layers[i].w = this.w * this.layers[i].scalex;
			this.layers[i].h = this.h * this.layers[i].scaley;

			var posx = (this.layers[i].xpos / ted.prevcanvasw) * 100;
			this.layers[i].xpos = (ted.canvasw / 100) * posx;

			//draw each one from the bottom of the canvas, fixme may change
			this.layers[i].ypos = ted.canvash - this.layers[i].h;
		}
	};

	this.draw = function(layer){
		//ted.ctx.drawImage(obj.sprite, 0, 0, obj.spritew, obj.spriteh, obj.xpos, obj.ypos, obj.w, obj.h);
		ted.general.drawOnCanvas(this.layers[layer]);
	};

	//move the world's x coordinate
	this.move = function(direction,speed){
		//var newpos = this.xpos + (this.speed * direction);
		//this.xpos = Math.max(this.limitxmin,Math.min(newpos,this.limitxmax));
		for(var i = 0; i < this.layers.length; i++){
			var newx = this.layers[i].xpos - ((speed * this.layers[i].scalex) * direction);
			this.layers[i].xpos = newx;
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
			ted.ctx.drawImage(obj.sprite, 0, 0, obj.spritew, obj.spriteh, obj.xpos, obj.ypos, obj.w, obj.h);
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
			ted.general.clearCanvas();
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

