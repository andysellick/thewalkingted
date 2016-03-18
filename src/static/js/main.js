
var loaders = [];
var imgpath = 'static/img/';
var tedframesmisc = ['right_stand.png','left_stand.png'];
var leftframeswalk = ['left_walk_01.png','left_walk_02.png','left_walk_03.png','left_walk_04.png','left_walk_05.png','left_walk_06.png','left_walk_07.png','left_walk_08.png','left_walk_09.png','left_walk_10.png','left_walk_11.png','left_walk_12.png','left_walk_13.png'];
var rightframeswalk = ['right_walk_01.png','right_walk_02.png','right_walk_03.png','right_walk_04.png','right_walk_05.png','right_walk_06.png','right_walk_07.png','right_walk_08.png','right_walk_09.png','right_walk_10.png','right_walk_11.png','right_walk_12.png','right_walk_13.png'];

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
	this.w = 350;
	this.h = 550;
	this.sprite = tedframesmisc[0];
	this.spritew = 350;
	this.spriteh = 550;
	this.walkrightframes = [];
	this.walkleftframes = [];
	//contains: key pressed, animation frames, frame duration, end frame, alter x pos by
	this.animations = [
		[39, rightframeswalk, 70, tedframesmisc[0], 15],
		[37, leftframeswalk, 10, tedframesmisc[1], -20]
	];
	this.curranim = 0;
	this.animationStart = 0;
	this.currentFrame = 0;
	this.maxFrames = 0;

	this.draw = function(){
		ted.general.drawOnCanvas(this);
	};

	this.moveLeft = function(key,upordown){
		if(upordown){
			this.doAnimation(39,1);
		}
	};
	this.moveRight = function(key,upordown){
		if(upordown){
			this.doAnimation(37,1);
		}
	};

	this.doAnimation = function(key, upordown){
		if(this.curranim === 0){ //look up and store the required animation
			for(var i = 0; i < this.animations.length; i++){
				if(this.animations[i][0] === key){ //the key pressed matches this action, so do it
					this.curranim = this.animations[i];
					this.currentFrame = 0;
					this.maxFrames = this.curranim[1].length; //store some data about this animation
					//this.animationStart = new Date().getTime(); //record now, the time we started the animation
					break;
				}
			}
		}
		if(upordown){ //key has been pressed down
			if(this.animationStart < (new Date().getTime() - this.curranim[2]) || this.animationStart === 0){ //if it's time to move to the next frame
				this.xpos += this.curranim[4]; //move the xpos, probably a better way to do this
				this.animationStart = new Date().getTime();
				if(this.currentFrame < this.maxFrames){ //check if we need to loop back to the first frame
					this.sprite = this.curranim[1][this.currentFrame];
					this.currentFrame++;
				}
				else {
					this.currentFrame = 0;
				}
			}
		}
		else { //key has been released, stop the animation somewhere sensible
			this.clearAnimation();
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
				var parentel = $('#canvas').parent();
				ted.canvas.width = ted.canvasw = parentel.outerWidth();
				ted.canvas.height = ted.canvash = parentel.outerHeight();
				ted.general.setupPlayer();
	            ted.game.gameLoop();
            }
        },
        clearCanvas: function(){
            ted.ctx.clearRect(0, 0, ted.canvas.width, ted.canvas.height);//clear the canvas
        },
        drawOnCanvas: function(obj){
			//console.log(obj.sprite);
			ted.ctx.drawImage(obj.sprite, 0, 0, obj.spritew, obj.spriteh, obj.xpos, obj.ypos, obj.w, obj.h);
		},
		setupPlayer: function(){
			ted.player = new PlayerObj();
			//http://stackoverflow.com/questions/12273451/how-to-fix-delay-in-javascript-keydown
			window.addEventListener('keydown',function(e){
			    ted.keyState[e.keyCode || e.which] = true;
			},true);
			window.addEventListener('keyup',function(e){
			    ted.keyState[e.keyCode || e.which] = false;
			},true);
		}
    },
    game: {
		gameLoop: function(){
			//this is slightly less flexible than I'd like but it works
			if(ted.keyState[37]){
				ted.player.moveRight(37,ted.keyState[37]);
			}
			else if(ted.keyState[39]){
				ted.player.moveLeft(39,ted.keyState[39]);
			}
			else {
				ted.player.clearAnimation();
			}

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
};