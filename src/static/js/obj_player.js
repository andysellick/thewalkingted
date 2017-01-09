/* JShint config */
/* globals ted, allimages */

//general object for player
function PlayerObj(){
	this.created = 0; //flag used when calling the init function on resize, to make sure only certain things are done compared to when first created
	this.xpos = 100;
	this.ypos = 100;
	this.idealw = 350;
	this.idealh = 504;
	this.w = 0;
	this.h = 0;
	this.sprite = allimages[0].images[0];
	this.spritew = 350;
	this.spriteh = 504;
	this.spritex = 0;
	this.spritey = 0;
	this.walkrightframes = [];
	this.walkleftframes = [];
	//contains: key pressed, animation frames, frame duration, end frame, direction
	this.animations = [
		[39, allimages[2].images, 50, allimages[0].images[0], 1],
		[37, allimages[1].images, 50, allimages[0].images[1], -1],
		[0, [allimages[2].images[1]], 50, allimages[2].images[1],1],
		[0, [allimages[1].images[1]], 50, allimages[1].images[1],-1],
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
	this.jumpUp = 0; //flag to prevent double jumping, 1 is okay to jump, 0 is should fall
	this.jumpStart = 0; //height the jump started from
	this.jumpHeight = 0; //maximum jump height
	this.jumpSpeed = 10; //how fast jumping occurs
	this.jumpTiming = 0; //timer for jump frame pauses fixme not sure this is needed?
	this.floorpos = 0; //current height of the floor beneath the character. Is set on init and updated whenever movement occurs

	this.init = function(){
		var sizes = ted.general.calculateAspectRatio(this.idealw,this.idealh,ted.canvasw,ted.canvash / 2);
		this.w = sizes[0];
		this.h = sizes[1];

		var posx = (this.xpos / ted.prevcanvasw) * 100;
		this.xpos = (ted.canvasw / 100) * posx;
		var posy = (this.ypos / ted.prevcanvash) * 100;
		this.ypos = (ted.canvash / 100) * posy;

		if(!this.created){
			this.xpos = (ted.canvasw / 100) * 10; //fixme this needs to be more precise
			//http://stackoverflow.com/questions/12273451/how-to-fix-delay-in-javascript-keydown
			window.addEventListener('keydown',function(e){
			    ted.keyState[e.keyCode || e.which] = true;
			},true);
			window.addEventListener('keyup',function(e){
			    ted.keyState[e.keyCode || e.which] = false;
			},true);
			this.ypos = (ted.canvash / 2) - (this.h / 2);
		}

		this.limitxmin = (ted.canvasw / 100) * 10;
		this.limitxmax = (ted.canvasw / 100) * 50;

		//this.speed = (this.w / 100) * 100; //base the speed on the width of the character, 5% is an arbitrarily chosen value that looks okay. This is overridden below fixme
		this.jumpHeight = (this.h / 100) * 65;
		this.jumpBy = this.jumpHeight / 30;
		
		this.checkFloor(this.xpos); //find out where the floor is currently
		this.created = 1;
	};

	this.draw = function(){
		ted.general.drawOnCanvas(this);
	};

	//this is a bit clumsy but two keys need to cancel each other out
	this.move = function(keys){
		this.applyGravity();
		//shift key held down fixme temporary hack
		if(keys[16]){
			this.speed = (this.w / 100) * 20;
		}
		else {
			this.speed = (this.w / 100) * 2;
		}

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
		else if(keys[37] || ted.goleft){ //move left
			this.walkdirection = 37;
			this.facing = 0;
		}
		else if(keys[39] || ted.goright){ //move right
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

	//begin jumping
	this.initJump = function(){
		if(!this.jumping){
			this.clearAnimation();
			if(this.facing){
				this.curranim = this.animations[2];
			}
			else {
				this.curranim = this.animations[3];
			}
			this.maxFrames = 1;
			this.jumping = 1;
			this.jumpUp = 1;
			this.jumpStart = this.ypos + this.h;
		}
	};

	//we've started a jump, so make it happen
	this.handleJump = function(){
		if(this.jumpUp){
			if(this.jumpTiming < (new Date().getTime() - this.jumpSpeed)){
				this.jumpTiming = new Date().getTime();
				var newy = (this.ypos + this.h) - (this.jumpBy);
				var jumpatthispoint = (this.jumpHeight / (this.jumpStart - this.ypos - this.jumpHeight)) * 100;
				jumpatthispoint = (this.jumpBy / 100) * jumpatthispoint;
				//console.log(this.jumpBy,jumpatthispoint);
				if(newy > (this.jumpStart - this.jumpHeight)){ //this is confusing, remember y axis starts from 0 at the top of the canvas
					this.ypos = this.ypos - jumpatthispoint;//this.jumpBy;
				}
				else {
					this.jumpUp = 0;
				}
			}
		}
		else {
			this.stopJump();
		}
	};

	//finish a jump, reset various flags so gravity can kick in again
	this.stopJump = function(){
		if(this.jumping){
			this.jumpUp = 0;
			if(this.jumpTiming < (new Date().getTime() - this.jumpSpeed)){
				this.jumpTiming = new Date().getTime();
				if(this.ypos + this.h >= this.floorpos){
					this.clearAnimation();
					this.jumping = 0;
					if(this.facing){
						this.sprite = allimages[0].images[0];
					}
					else {
						this.sprite = allimages[0].images[1];
					}
				}
			}
		}
	};

	//animate the player
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
		this.moveCharacter();
		if(this.animationStart < (new Date().getTime() - this.curranim[2]) || this.animationStart === 0){ //if it's time to move to the next frame
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
	
	//work out our position with relation to the 'floor'
	this.checkFloor = function(newxpos){
		var currfloor = 0;
		var x1,y1,x2,y2 = 0;
		//find the two points of the floor that we are currently between
		for(var po = 0; po < ted.world.realfloor.length; po++){
			if(newxpos + ted.world.xpos + (this.w / 2) < ted.world.realfloor[po][0]){
				if(po > 0){
					x1 = ted.world.realfloor[po - 1][0] - ted.world.xpos;
					y1 = ted.world.realfloor[po - 1][1];
					x2 = ted.world.realfloor[po][0] - ted.world.xpos;
					y2 = ted.world.realfloor[po][1];
					//currfloor = [[ted.world.realfloor[po][0],ted.world.realfloor[po][1]],[ted.world.realfloor[po - 1][0],ted.world.realfloor[po - 1][1]]];
				}
				else {
					x1 = 0 - ted.world.xpos;
					y1 = ted.canvash;
					x2 = ted.world.realfloor[po][0] - ted.world.xpos;
					y2 = ted.world.realfloor[po][1];
					//currfloor = [[ted.world.realfloor[po][0],ted.world.realfloor[po][1]],[0,ted.canvash]];
				}
				break;
			}
		}
		/*
		var currpoint = [newxpos + ted.world.xpos + (this.w / 2),this.ypos + this.h];
		//http://math.stackexchange.com/questions/274712/calculate-on-which-side-of-straign-line-is-dot-located
		var whichside = ((currpoint[0] - currfloor[0][0]) * (currfloor[1][1] - currfloor[0][1])) - ((currpoint[1] - currfloor[0][1]) * (currfloor[1][0] - currfloor[0][0]));
		var moveyby = this.h / 100;
		if(whichside > 0){
			this.ypos -= moveyby;
			//console.log(po,'-1',whichside, currpoint,currfloor);
		}
		else if(whichside < 0){
			this.ypos += moveyby;
			//console.log(po,'+1',whichside, currpoint,currfloor);
		}
		*/
		//http://stackoverflow.com/questions/1934210/finding-a-point-on-a-line
		var d = Math.sqrt(Math.pow(x2 - x1,2) + Math.pow(y2 - y1,2));
		var currpos = this.xpos + (this.w / 2); //this is where we currently are in the world
		var n = currpos - x1; //this is the distance between where we are and the next point in the floor
		var r = n / d;
		var x3 = r * x2 + (1 - r) * x1; //x3 y3 is the co-ord of our current xpos on the line
		var y3 = r * y2 + (1 - r) * y1;
		//console.log('Next point:',Math.floor(x2),'xpos:',Math.floor(currpos),'n:',Math.floor(n),'output x y:',Math.floor(x3),Math.floor(y3));
		this.floorpos = y3;
	};

	//does what it says on the tin
	this.applyGravity = function(){
		if(!this.jumpUp){
			if(this.ypos + this.h > this.floorpos){
				this.ypos = Math.max(this.ypos - ted.world.gravity, this.floorpos - this.h);
			}
			else if(this.ypos + this.h < this.floorpos){
				this.ypos = Math.min(this.ypos + ted.world.gravity, this.floorpos - this.h);
			}
		}
	};

	//move the character on the screen within the limits of the bounding box, if outside, move the world
	this.moveCharacter = function(){
		var newxpos = this.xpos + (this.speed * this.curranim[4]);
		this.checkFloor(newxpos); //we need to check the position of the floor whenever we move as it is likely to have changed

		//move character or move world
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