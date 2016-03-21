
var loaders = [];
var imgpath = 'static/img/';
var tedframesmisc = ['right_stand.png','left_stand.png'];
var leftframeswalk = ['left_walk_1.png','left_walk_2.png','left_walk_3.png','left_walk_4.png','left_walk_5.png','left_walk_6.png','left_walk_7.png','left_walk_8.png','left_walk_9.png','left_walk_10.png','left_walk_11.png','left_walk_12.png','left_walk_13.png'];
var rightframeswalk = ['right_walk_1.png','right_walk_2.png','right_walk_3.png','right_walk_4.png','right_walk_5.png','right_walk_6.png','right_walk_7.png','right_walk_8.png','right_walk_9.png','right_walk_10.png','right_walk_11.png','right_walk_12.png','right_walk_13.png'];

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
	this.jump = 0;
	this.jumpHeight = 50;
	
	this.init = function(){
		var sizes = ted.general.calculateAspectRatio(this.idealw,this.idealh,ted.canvasw,ted.canvash / 2);
		this.w = sizes[0];
		this.h = sizes[1];
		this.ypos = ted.canvash - this.h;
		this.speed = (this.w / 100) * 6; //base the speed on the width of the character, 6% is an arbitrarily chosen value that looks okay
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
			//this.xpos += this.curranim[4]; //move the xpos, probably a better way to do this
			this.xpos += this.speed * this.curranim[4];
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

	//clear any current animation, using the information stored within it
	this.clearAnimation = function(){
		if(this.curranim){
			this.sprite = this.curranim[3];
			this.animationStart = 0;
			this.curranim = 0;
		}
	};
}

(function( window, undefined ) {
var ted = {
	canvas: 0,
	ctx: 0,
	canvasw: 0,
	canvash: 0,
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
				ted.general.setupPlayer();
	            ted.game.gameLoop();
            }
        },
        //initialise the size of the canvas based on the ideal aspect ratio and the size of the parent element
		initCanvasSize: function(){
			//ideal size for canvas
			var destwidth = 1000;
			var destheight = 600;
			var parentel = $('#canvas').parent();
			/*
			var aspect = Math.floor((parentel.height() / destheight) * destwidth);

			var cwidth = Math.min(destwidth, parentel.width());
			var cheight = Math.min(destheight, parentel.height());

			ted.canvas.width = ted.canvasw = Math.min(parentel.width(),aspect);
			ted.canvas.height = ted.canvash = (ted.canvas.width / destwidth) * destheight;
			*/
			//resize the canvas to maintain aspect ratio depending on screen size
			var sizes = ted.general.calculateAspectRatio(destwidth,destheight,parentel.width(),parentel.height());
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
			ted.general.initCanvasSize();
			ted.player.init();
		},
        clearCanvas: function(){
            ted.ctx.clearRect(0, 0, ted.canvas.width, ted.canvas.height); //clear the canvas
        },
        drawOnCanvas: function(obj){
			//console.log(obj.sprite);
			ted.ctx.drawImage(obj.sprite, 0, 0, obj.spritew, obj.spriteh, obj.xpos, obj.ypos, obj.w, obj.h);
		},
		setupPlayer: function(){
			ted.player = new PlayerObj();
			ted.player.init();
			//http://stackoverflow.com/questions/12273451/how-to-fix-delay-in-javascript-keydown
			window.addEventListener('keydown',function(e){
			    ted.keyState[e.keyCode || e.which] = true;
			},true);
			window.addEventListener('keyup',function(e){
			    ted.keyState[e.keyCode || e.which] = false;
			},true);
		},
    },
    game: {
		gameLoop: function(){
			ted.player.move(ted.keyState);
			ted.general.clearCanvas();
			ted.player.draw();
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

