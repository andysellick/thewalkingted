
var loaders = [];
var imgpath = 'static/img/';
var tedframesmisc = [
'stand.png',
'stand_i.png',
];
var tedframeswalk = [
'walk_01.png',
'walk_02.png',
'walk_03.png',
'walk_04.png',
'walk_05.png',
'walk_06.png',
'walk_07.png',
'walk_08.png',
'walk_09.png',
'walk_10.png',
'walk_11.png',
'walk_12.png',
'walk_13.png',
'walk_14.png',
];

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
callAllPreloads(tedframesmisc,imgpath);
callAllPreloads(tedframeswalk,imgpath);

//general object for player
function PlayerObj(){
	this.xpos = 100;
	this.ypos = 100;
	this.w = 350;
	this.h = 550;
	this.sprite = 0;
	this.spritew = 350;
	this.spriteh = 550;
	this.draw = function(){
		ted.general.drawOnCanvas(this);
	};
	this.acceptKeypress = function(e, key, upordown){
		//console.log(key);
		if(key === 39){ //right
			this.sprite = tedframesmisc[0]; //fixme need better way of doing this
			this.xpos += 10;
		}
		else if(key === 37){ //left
			this.sprite = tedframesmisc[1];
			this.xpos -= 10;
		}
		else if(key === 38){ //up

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
			ted.player.sprite = tedframesmisc[0];
		    $(window).keydown(function(e){
		        var code = e.keyCode ? e.keyCode : e.which;
		        ted.player.acceptKeypress(e,code,1);
		    });

		    $(window).keyup(function(e){
		        var code = e.keyCode ? e.keyCode : e.which;
		        ted.player.acceptKeypress(e,code,0);
		    });
		}
    },
    game: {
		gameLoop: function(){
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