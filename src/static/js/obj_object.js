/* JShint config */
/* globals ted */

/*
	object must be created with:
	- sprite: preloaded image reference
	- idealw, idealh: width and height of sprite image
	- originalpos: where this object occurs in the world as a percentage of overall world size
	- scalex, scaley: percent size the object should appear relative to canvas size
	- desc: text description associated with the object, will appear in the popup
*/
function ObjObj(sprite,idealw,idealh,originalpos,scalex,scaley,desc){
	this.originalpos = originalpos;
	this.worldpos = 0;
	this.xpos = 0;
	this.ypos = 0;
	this.idealw = idealw;
	this.idealh = idealh;
	this.w = 0;
	this.h = 0;
	this.sprite = sprite;
	this.spritex = 0;
	this.spritey = 0;
	this.spritew = 0;
	this.spriteh = 0;
	this.scalex = scalex;
	this.scaley = scaley;
	this.desc = desc;
	this.animate = 1;
	this.animateSpeed = 50;
	this.animateDir = 0;
	this.animateTimer = 0;
	this.animateBy = 0;

	this.init = function(){
		var sizes = ted.general.calculateAspectRatio(this.idealw,this.idealh,(ted.canvasw / 100) * this.scalex,(ted.canvash / 100) * this.scaley);
		this.w = sizes[0];
		this.h = sizes[1];

		this.worldpos = (ted.world.w / 100) * this.originalpos; //store where it is in the world
		this.ypos = (ted.canvash / 2) - (this.h / 2);

		this.spritew = this.idealw;
		this.spriteh = this.idealh;

		this.miny = this.ypos - (this.h / 4);
		this.maxy = this.ypos + (this.h / 4);
		this.animateBy = this.h / 30;
	};

	this.doActions = function(){
		this.xpos = this.worldpos - ted.world.xpos;
		if(this.xpos < ted.canvasw && this.xpos + this.w > 0){ //if it's on screen
			this.collision();
			this.doAnimation();
			this.draw();
		}
	};

	this.collision = function(){
		if(this.animate){
			if(ted.game.checkPlayerCollision(this,ted.player)){
				//console.log('hit');
				this.animate = 0;
				var infoel = document.getElementById('info');
				var infoelinner = document.getElementById('infoinner');
				infoelinner.innerHTML = this.desc;
				ted.general.removeClass(infoel,'fadeout');
			}
		}
	};

	this.draw = function(){
		//image, start drawing from sprite at x, at y, sprite width, sprite height, draw on canvas at x, at y, width to draw this at, height
		//ted.ctx.drawImage(obj.sprite, obj.spritex, obj.spritey, obj.spritew, obj.spriteh, obj.xpos, obj.ypos, obj.w, obj.h);
		ted.general.drawOnCanvas(this);
	};
	
	this.doAnimation = function(){
		if(this.animate){
			if(this.animateTimer < (new Date().getTime() - this.animateSpeed)){
				this.animateTimer = new Date().getTime();
				if(this.animateDir){
					if(this.ypos > this.miny){
						this.ypos -= this.animateBy;
					}
					else {
						this.animateDir = 0;
					}
				}
				else {
					if(this.ypos < this.maxy){
						this.ypos += this.animateBy;
					}
					else {
						this.animateDir = 1;
					}
				}
			}
		}
	};
}