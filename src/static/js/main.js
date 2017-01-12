/* JShint config */
/* globals Deferred, orientation, ted, PlayerObj, WorldObj, ObjObj */

var worldsize = 7;
var loaders = [];
var imgpath = 'static/img/';

var allimages = [
	{
		'name': 'tedframesmisc',
		'images': ['right_stand.png','left_stand.png'],
		'dir': 'character'
	},
	{
		'name': 'leftframeswalk',
		'images': ['left_walk_1.png','left_walk_2.png','left_walk_3.png','left_walk_4.png','left_walk_5.png','left_walk_6.png','left_walk_7.png','left_walk_8.png','left_walk_9.png','left_walk_10.png','left_walk_11.png','left_walk_12.png','left_walk_13.png'],
		'dir': 'character'
	},
	{
		'name': 'rightframeswalk',
		'images': ['right_walk_1.png','right_walk_2.png','right_walk_3.png','right_walk_4.png','right_walk_5.png','right_walk_6.png','right_walk_7.png','right_walk_8.png','right_walk_9.png','right_walk_10.png','right_walk_11.png','right_walk_12.png','right_walk_13.png'],
		'dir': 'character'
	},
	{
		'name': 'worldimages',
		'images': ['layer_1.png','layer_2.png','layer_3.png','layer_4.png','layer_5.png'],
		'dir': 'world'
	},
	{
		'name': 'objectimages',
		'images': ['chair.png','clock.png','tv.png','camera.png'],
		'dir': 'objects'
	},
];

var imageloadprogress = 0;
var imageloadtotal = 0;

/*
//preload images
function loadFile(src,array,num) {
    var deferred = $.Deferred();
	var sprite = new Image();
	sprite.onload = function() {
		array[num] = sprite;
		deferred.resolve();
		imageloadprogress++;
		document.getElementById('loading').style.width = (imageloadprogress / imageloadtotal) * 100 + '%';
	};
	sprite.src = src;
    return deferred.promise();
}
*/

//preload images
function loadFile(src,array,num){
	var deferred = new Deferred();
	var sprite = new Image();
	sprite.onload = function() {
		array[num] = sprite;
		deferred.resolve();
		imageloadprogress++;
		document.getElementById('loading').style.width = (imageloadprogress / imageloadtotal) * 100 + '%';
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
for(var im = 0; im < allimages.length; im++){
	imageloadtotal += allimages[im].images.length;
	callAllPreloads(allimages[im].images, imgpath + allimages[im].dir + '/');
}

(function( window, undefined ) {
var ted = {
	canvas: 0,
	ctx: 0,
	canvasw: 0,
	canvash: 0,
	idealw: 1000,
	idealh: 645,
	gameloopvar: 1,
	prevcanvasw: 0, //used to 'remember' what the previous canvas size was, for purposes of recalculation
	prevcanvash: 0,
	player: 0,
	objects: [],
	keyState: [],
	framecount: 0,
	frametime: 0,
	debug: 0, //draws FPS and floor lines, massively reduces performance as well
	debugmsg: '',

    general: {
        init: function(){
            ted.canvas = document.getElementById('canvas');
            if(!ted.canvas.getContext){
                document.getElementById('canvas').innerHTML = 'Your browser does not support canvas. Sorry.';
            }
            else {
                ted.ctx = ted.canvas.getContext('2d');
                this.initCanvasSize();
                ted.prevcanvasw = ted.canvasw;
                ted.prevcanvash = ted.canvash;
				ted.general.setupWorld();
				ted.general.setupPlayer();
				ted.general.setupObjects();
				ted.general.setupControls();
	            //setInterval(ted.game.gameLoop,500); //fixme should have variable to control
	            //http://www.playmycode.com/blog/2011/08/building-a-game-mainloop-in-javascript/
	            var animFrame = window.requestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame    ||
					window.oRequestAnimationFrame      ||
					window.msRequestAnimationFrame     ||
					null ;
				if(animFrame !== null){
					var recursiveAnim = function() {
						ted.game.gameLoop();
						animFrame(recursiveAnim);
					};
					animFrame(recursiveAnim);
				}
				else {
					setInterval(ted.game.gameLoop,1000 / 60);
				}
            }
        },
        //initialise the size of the canvas based on the ideal aspect ratio and the size of the parent element
		initCanvasSize: function(){
			var parentel = document.getElementById('canvasparent');
			//resize the canvas to maintain aspect ratio depending on screen size
			//var sizes = ted.general.calculateAspectRatio(ted.idealw,ted.idealh,parentel.width(),parentel.height());
			var sizes = ted.general.calculateAspectRatio(ted.idealw,ted.idealh,parentel.offsetWidth,parentel.offsetHeight);
			ted.canvas.width = ted.canvasw = sizes[0];
			ted.canvas.height = ted.canvash = sizes[1];
			
			//check to see if the screen is rotated wrong on a mobile device
			if(parentel.offsetHeight > parentel.offsetWidth){
				ted.general.addClass(document.getElementById('mobile'),'shown'); //show the rotation message
				ted.gameloopvar = 0; //pause the game
			}
			else {
				ted.general.removeClass(document.getElementById('mobile'),'shown');
				ted.gameloopvar = 1;
			}
			/*
			//fixme what if the canvas didn't have a fixed aspect ratio?
			ted.canvas.width = ted.canvasw = parentel.width();
			ted.canvas.height = ted.canvash = parentel.height();
			*/
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
        //resize the canvas and call init on all the elements as well
        resizeCanvas: function(){
			ted.prevcanvasw = ted.canvasw;
			ted.prevcanvash = ted.canvash;
			ted.general.initCanvasSize();
			ted.world.init();
			ted.player.init();
			for(var m = 0; m < ted.objects.length; m++){
				ted.objects[m].init();
			}
		},
        clearCanvas: function(){
			/*
            ted.ctx.clearRect(0, 0, ted.canvas.width, ted.canvas.height); //clear the canvas
            //fixme this is just debug to clear out non-graphics drawn on the canvas
            var w = ted.canvas.width;
            ted.canvas.width = 1;
            ted.canvas.width = w;
            */
            ted.canvas.width = ted.canvas.width; //this is apparently a hack but seems to work
        },
        //given an object with assumed attributes, draw it on the canvas
        drawOnCanvas: function(obj){
			//image, start drawing from sprite at x, at y, sprite width, sprite height, draw on canvas at x, at y, width to draw this at, height
			ted.ctx.drawImage(obj.sprite, Math.round(obj.spritex), Math.round(obj.spritey), Math.round(obj.spritew), Math.round(obj.spriteh), Math.round(obj.xpos), Math.round(obj.ypos), Math.round(obj.w), Math.round(obj.h));
		},
		setupPlayer: function(){
			ted.player = new PlayerObj();
			ted.player.init();
		},
		setupWorld: function(){
			ted.world = new WorldObj();
			ted.world.init();
		},
		setupObjects: function(){
			//fixme this is just testing for now
			var obj = new ObjObj(allimages[4].images[0],140,176,20,30,30,'Chairs were invented by the ancient Egyptians originally as places to put cats. Years later slaves discovered they could also be used for sitting, although this was often discouraged publically.'); //chair
			obj.init();
			ted.objects.push(obj);
			var obj2 = new ObjObj(allimages[4].images[1],75,78,40,15,15,'The first clock was made from grass strands and mud and was only correct twice a day.'); //clock
			obj2.init();
			ted.objects.push(obj2);
			var obj3 = new ObjObj(allimages[4].images[2],207,130,60,20,20,'The origins of the television are lost in the mists of time but it is believed that an Egyptian named Lhost R\'mote pioneered the idea of having pictures moving on a screen for entertainment.'); //tv
			obj3.init();
			ted.objects.push(obj3);
			var obj4 = new ObjObj(allimages[4].images[3],42,25,80,5,5,'The first photograph was taken in 1000BC in Alexandria by a native of the city. It was a Tuesday.'); //camera
			obj4.init();
			ted.objects.push(obj4);
		},
		setupControls: function(){
			//click/touch left or right of screen to walk in that direction
			var rightel = document.getElementById('right');
			var leftel = document.getElementById('left');

			rightel.addEventListener('mousedown',function(){ted.goright = 1;});
			rightel.addEventListener('touchstart',function(){ted.goright = 1;});
			rightel.addEventListener('mouseup',function(){ted.goright = 0;});
			rightel.addEventListener('touchend',function(){ted.goright = 0;});

			leftel.addEventListener('mousedown',function(){ted.goleft = 1;});
			leftel.addEventListener('touchstart',function(){ted.goleft = 1;});
			leftel.addEventListener('mouseup',function(){ted.goleft = 0;});
			leftel.addEventListener('touchend',function(){ted.goleft = 0;});
			
			var closeinfo = document.getElementById('infoclose');
			closeinfo.addEventListener('click',function(){ted.general.addClass(document.getElementById('info'),'fadeout');});

			//detect motion on mobile devices
			//http://stackoverflow.com/questions/4378435/how-to-access-accelerometer-gyroscope-data-from-javascript/4378439#4378439
			var tilt = 0;
			var yaw = 0;

			if(window.DeviceOrientationEvent) { //desktop, samsung tab, ipod and ipad, apparently
				window.addEventListener('deviceorientation',function(){
					//$('#notice').html([event.beta.toFixed(2),' ',event.gamma.toFixed(2)]);
					//liam's phone uses this one
					ted.game.tilt(event.beta, event.gamma);
				},true);
			} else if(window.DeviceMotionEvent) {
				window.addEventListener('devicemotion',function(){
					ted.game.tilt(event.acceleration.x * 2, event.acceleration.y * 2);
					//$('#notice').html([(event.acceleration.x * 2).toFixed(2),' ',(event.acceleration.y * 2).toFixed(2)]);
				},true);
			} else {
				window.addEventListener('MozOrientation',function(){
					ted.game.tilt(orientation.x * 50, orientation.y * 50);
					//$('#notice').html([(orientation.x * 50).toFixed(2),' ',(orientation.y * 50).toFixed(2)]);
				},true);
			}
			ted.orientation = window.orientation;
			//listen for orientation changes
			window.addEventListener('orientationchange', function() {
				ted.orientation = window.orientation;
			}, false);
		},
		//jquery's addClass without jquery
		addClass: function(el,className){
		    if(el.classList){
				el.classList.add(className);
			}
			else {
				el.className += ' ' + className;
			}
		},
		//jquery's removeClass without jquery
		removeClass: function(el,className){
			if(el.classList){
				el.classList.remove(className);
			}
			else {
				el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
			}
		}
    },
    game: {
		tilt: function(tilt,yaw){
			//$('#notice').html(tilt.toFixed(2));
			var tiltby = 5;
			if(tilt > tiltby){
				//0 = portrait, -90 = landscape rotated to right, 90 = landscape rotated to left
				//fixme hey this code is a bit clunky
				if(ted.orientation === -90){
					ted.goleft = 1;
					ted.goright = 0;
				}
				else {
					ted.goleft = 0;
					ted.goright = 1;
				}
			}
			else if(tilt < -tiltby){
				if(ted.orientation === -90){
					ted.goleft = 0;
					ted.goright = 1;
				}
				else {
					ted.goleft = 1;
					ted.goright = 0;
				}
			}
			else {
				ted.goleft = 0;
				ted.goright = 0;
			}
		},
		//generic collision checking function between any given object and the player
		checkPlayerCollision: function(obj,tp){
		    //rule out any possible collisions, remembering that all y numbers are inverted on canvas
		    //player bottom edge is higher than object top edge
		    if(tp.ypos + tp.h < obj.ypos){
		        return(0);
			}
		    //player top edge is lower than obj bottom edge
		    if(tp.ypos > obj.ypos + obj.h){
		        return(0);
			}
		    //player left edge is to the right of obj right edge
		    if(tp.xpos > obj.xpos + obj.w){
		        return(0);
			}
		    //player right edge is to the left of obj left edge
		    if(tp.xpos + tp.w < obj.xpos){
		        return(0);
			}
		    return(1); //collision
		},
		gameLoop: function(){
			if(ted.gameloopvar){
				ted.gameloopvar = 0;
				//ted.general.clearCanvas(); //fixme don't need to do this if we're completely overdrawing the canvas
				ted.player.move(ted.keyState);
				ted.world.draw(4);
				ted.world.draw(3);
				ted.world.draw(2);
				ted.world.draw(1);
				/*
				//fixme - bit of debug to draw the width of the world
				ted.ctx.rect(0 - ted.world.xpos,(ted.canvash / 10) * 8,ted.world.w,ted.canvash / 20);
				//console.log(ted.world.w,ted.world.xpos,0 - ted.world.xpos);
				ted.ctx.fillStyle = 'green';
				ted.ctx.fill();
				*/

				for(var z = 0; z < ted.objects.length; z++){
					ted.objects[z].doActions();
				}
				ted.player.draw();
				ted.world.draw(0);
				
				//debug mode
				if(ted.debug){
					//draw the floor lines
					ted.ctx.beginPath();
					ted.ctx.lineWidth = 1;
					ted.ctx.strokeStyle = '#ff0000';

					ted.ctx.moveTo(ted.world.realfloor[0][0] - ted.world.xpos, ted.world.realfloor[0][1]);
					for(var p = 1; p < ted.world.realfloor.length; p++){
						ted.ctx.lineTo(ted.world.realfloor[p][0] - ted.world.xpos, ted.world.realfloor[p][1]);
						ted.ctx.stroke();
					}

					//show frames per second
					if(ted.frametime < (new Date().getTime() - 1000)){
						ted.frametime = new Date().getTime();
						ted.debugmsg = ted.framecount + ' FPS';
						ted.framecount = 0;
					}
					ted.framecount++;
					document.getElementById('notice').innerHTML = ted.debugmsg;
				}
				ted.gameloopvar = 1;
			}
		}
	}
};
window.ted = ted;
})(window);



window.onload = function(){
	/*
	$.when.apply(null, loaders).done(function() {
	    ted.general.init();
	    ted.general.addClass(document.getElementById('loading'),'fadeout');
    });
    */
    Deferred.when(loaders).then(
    	function(){
		    ted.general.init();
		    ted.general.addClass(document.getElementById('loading'),'fadeout');
		}
    );

	var resize;
	window.addEventListener('resize', function(event){
		clearTimeout(resize);
		resize = setTimeout(ted.general.resizeCanvas,200);
	});
};

