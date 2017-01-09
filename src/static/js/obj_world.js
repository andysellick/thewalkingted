/* JShint config */
/* globals ted, allimages, worldsize */

//object for the world
function WorldObj(){
	this.created = 0; //flag used when calling the init function on resize, to make sure only certain things are done compared to when first created
	this.xpos = 0;
	this.w = 0;
	this.h = 0;
	this.limitxmin = 0;
	this.floor = [
		[0,98],
		[20,97],
		[21,70],
		[25,70],
		[26,75],
		[27,75],
		[28,80],
		[29,80],
		[30,90],
		[40,100],
		[50,80],
		[70,120],
		[80,100],
		[100,100]
	];
	this.layers = [
		{
			name: 'foreground',
			sprite: allimages[3].images[0],
			spriteactualw: 14000,
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
			sprite: allimages[3].images[1],
			spriteactualw: 7000,
			spriteactualh: 645,
			xpos: 0,
			ypos: 0,
			scalex: 1
		},
		{
			name: 'pyramids',
			sprite: allimages[3].images[2],
			spriteactualw: 4900,
			spriteactualh: 343,
			xpos: 0,
			ypos: 0,
			scalex: 0.7
		},
		{
			name: 'hills',
			sprite: allimages[3].images[3],
			spriteactualw: 4200,
			spriteactualh: 280,
			xpos: 0,
			ypos: 0,
			scalex: 0.6
		},
		{
			name: 'sky',
			sprite: allimages[3].images[4],
			spriteactualw: 3500,
			spriteactualh: 645,
			xpos: 0,
			ypos: 0,
			scalex: 0.5
		}
	];

	this.init = function(){
		this.w = ted.canvasw * worldsize;
		this.h = ted.canvash;
		/*
		//fixme what if the canvas didn't have a fixed aspect ratio?
		var aspect = (ted.idealh / ted.idealw) * 100;
		var tmp = (this.h / aspect) * 100;
		console.log(this.h,aspect,tmp);
		this.w = tmp * worldsize;
		*/
		this.limitxmax = this.w - ted.canvasw;

		if(this.created){
			var sizeof = (this.xpos / (ted.prevcanvasw * worldsize)) * 100; //get xpos as a percentage of the previous world size
			this.xpos = (this.w / 100) * sizeof; //now set new xpos accordingly
		}
		
		//create 'floor'
		this.realfloor = [];
		for(var f = 0; f < this.floor.length; f++){
			var fx = this.floor[f][0];
			var fy = this.floor[f][1];
			fx = (this.w / 100) * fx;
			fy = (this.h / 100) * fy;
			this.realfloor.push([fx,fy]);
		}

		//generate layers
		for(var i = 0; i < this.layers.length; i++){
			/*
				layers are set to the same width and height of the canvas
				the world is many times larger than the canvas (currently 5x)
				each layer moves at a different speed, the images displayed on them are an appropriate size for the speed, controlled by the scalex value, assuming a world size x5 of the canvas e.g.
				- layer with scalex 1 is same size as the world, moves at 1x world speed, so needs an image that is 500% the width of the canvas, or the same width as the world
				- layer with scalex 2 is same size as the world, moves at 2x world speed, so needs an image that is 1000% the width of the canvas, or twice the width of the world
			*/
			if(!this.created){
				var posx = (this.layers[i].xpos / ted.prevcanvasw) * 100;
				this.layers[i].spritex = (ted.canvasw / 100) * posx;
				this.layers[i].spritey = 0;
			}

			var perc = ((ted.canvasw / this.w) * 100) / this.layers[i].scalex; //this is the percentage of the layer image we need to display
			this.layers[i].spritew = ((this.layers[i].spriteactualw / 100) * perc); //this is the actual px of the image we need to display
			this.layers[i].spriteh = this.layers[i].spriteactualh;

			var tmp = this.w * this.layers[i].scalex; //actual size of the image on this layer
			var tmp2 = (tmp / this.layers[i].spriteactualw) * 100; //percentage size diff between original layer image w and displayed
			var tmp3 = (this.layers[i].spriteactualh / 100) * tmp2; //apply same percentage change to height to find layer height
			this.layers[i].h = tmp3;
			this.layers[i].w = ted.canvasw;

			//draw each one from the bottom of the canvas
			this.layers[i].ypos = ted.canvash - this.layers[i].h;
		}
		this.gravity = ted.canvash / 50;
		this.created = 1;
	};

	this.draw = function(layer){
		//image, start drawing from sprite at x, at y, sprite width, sprite height, draw on canvas at x, at y, width to draw this at, height
		//ted.ctx.drawImage(obj.sprite, obj.spritex, obj.spritey, obj.spritew, obj.spriteh, obj.xpos, obj.ypos, obj.w, obj.h);
		ted.general.drawOnCanvas(this.layers[layer]);
	};

	//move the world's x coordinate
	this.move = function(direction,speed){
		var newpos = this.xpos + (speed * direction);
		if(newpos > this.xpos){
			this.xpos = Math.min(newpos,this.limitxmax);
		}
		else {
			this.xpos = Math.max(newpos,this.limitxmin);
		}
		//move the layers based on the new world xpos
		for(var i = 0; i < this.layers.length; i++){
			var tmp = (this.xpos / this.w) * 100; //this is the current world pos as a percentage of the world width
			//apply the same percentage to the sprite for the layer
			//this.layers[i].spritex = ((this.layers[i].spriteactualw / 100) * tmp) - (ted.canvasw * (1 - this.layers[i].scalex)); //the subtraction here ends the layers together at the right of the screen
			this.layers[i].spritex = (this.layers[i].spriteactualw / 100) * tmp;
		}
		if(newpos > this.limitxmax || newpos < this.limitxmin){
		    ted.general.addClass(document.getElementById('info'),'fadeout');
		}
	};
}