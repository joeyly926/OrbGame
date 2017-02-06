/**
 * @author Tuo Lei
 * @author leituo56@gmail.com
 */

//debug console
var isDebug = true;
function debug(str) {
	if(isDebug){
		$("#console").append(str + "<br/>").css("display","block");
	}
}

//global variables
var candyColor = ["red", "green", "blue", "yellow", "orange", "purple"];
var tileNum = 10; //10*10
var tileWidth = 50;
var tileHeight = 50;
var moveTime = 800;
var fadeTime = 800;

//2D Array stores reference of Candy.
var candyMatrix = new Array();
for ( i = 0; i < tileNum; i++) {
	candyMatrix[i] = new Array();
}

var selectedCandy = undefined;//store Candy that selected by Mouse

//ready
$(document).ready(function() {
	init();
	candyChain();
});

//Candy Class
function Candy(color, tileX, tileY) {
	var that = this;
	this.color = color;
	this.tileX = tileX;
	this.tileY = tileY;
	this.selected = false;

	//JQ is the HTML elem of Candy
	this.JQ = $("<div></div>");
	this.JQ.addClass("candy").addClass(candyColor[this.color]);
	this.JQ.css("top", (tileHeight * this.tileY + "px")).css("left", (tileWidth * this.tileX + "px"));

	//move function, simply move the Candy
	this.move = function(tileX, tileY) {
		var tarLeft = ((tileX > that.tileX) ? "+=" : "-=") + Math.abs(tileX - that.tileX) * tileWidth + "px";
		var tarTop = ((tileY > that.tileY) ? "+=" : "-=") + Math.abs(tileY - that.tileY) * tileHeight + "px";
		that.JQ.animate({
			left : tarLeft,
			top : tarTop
		}, moveTime, function() {});
	};

	//reposition function, move and set Tile data
	this.reposition = function(tileX, tileY) {
		that.move(tileX, tileY);
		that.setTile(tileX, tileY);
	};

	//setTile function, set datamembers and set global reference
	this.setTile = function(tileX, tileY) {
		that.tileX = tileX;
		that.tileY = tileY;
		candyMatrix[tileX][tileY] = that;
		that.JQ.html("x:" + tileX + "<br/>y:" + tileY);
	};

	//change select status
	this.setSelect = function(bool) {
		if (bool) {
			that.JQ.addClass("selected");
			selectedCandy = that;
		} else {
			that.JQ.removeClass("selected");
		}
	};

	//selection handling
	this.JQ.click(function() {
		if (selectedCandy) {
			if (selectedCandy == that) {
				selectedCandy.setSelect(false);
				that.setSelect(false);
				selectedCandy = undefined;
			} else {
				if (isAdjunct(that)) {
					swap(that, selectedCandy);
					selectedCandy.setSelect(false);
					that.setSelect(false);
					selectedCandy = undefined;
				} else {
					selectedCandy.setSelect(false);
					that.setSelect(true);
					selectedCandy = that;
				}
			}
		} else {
			that.setSelect(true);
		}
	});

	return this; //return a reference of this
}

function isAdjunct(candy) {
	if (!selectedCandy) {
		return false;
	}
	var a = Math.abs(candy.tileX - selectedCandy.tileX);
	var b = Math.abs(candy.tileY - selectedCandy.tileY);
	if ((a == 1 && b == 0) || (a == 0 && b == 1)) {
		return true;
	}
	return false;
}

function swap(candy1, candy2) {
	var x1 = candy1.tileX;
	var y1 = candy1.tileY;
	var x2 = candy2.tileX;
	var y2 = candy2.tileY;
	candy1.reposition(x2, y2);
	candy2.reposition(x1, y1);
	setTimeout(candyChain,moveTime);
}

//Repeat map class for handling repeatness of Candy, use in Candy Chain.
function repeatMap(repeatX, repeatY) {
	this.repeatX = repeatX;
	this.repeatY = repeatY;
	return this;
}

function candyChain() {
	var flagMatrix = new Array();
	for ( i = 0; i < tileNum; i++) {
		flagMatrix[i] = new Array();
	}
	for ( x = 0; x < tileNum; x++) {
		for ( y = 0; y < tileNum; y++) {
			var repeatX = 0;
			var repeatY = 0;
			if (x > 0) {
				repeatX = (candyMatrix[x][y].color == candyMatrix[x-1][y].color) ? flagMatrix[x-1][y].repeatX + 1 : 0;
				if (repeatX > 1) {
					var i = repeatX;
					for (i; i > 0; i--) {
						flagMatrix[x-i][y].repeatX = repeatX;
					}
				}
			}
			if (y > 0) {
				repeatY = (candyMatrix[x][y].color == candyMatrix[x][y - 1].color) ? flagMatrix[x][y - 1].repeatY + 1 : 0;
				if (repeatY > 1) {
					var i = repeatY;
					for (i; i > 0; i--) {
						flagMatrix[x][y - i].repeatY = repeatY;
					}
				}
			}
			flagMatrix[x][y] = new repeatMap(repeatX, repeatY);
		}
	}
	var flag = false;
	for ( x = 0; x < tileNum; x++) {
		for ( y = 0; y < tileNum; y++) {
			if (flagMatrix[x][y].repeatX > 1 || flagMatrix[x][y].repeatY > 1) {
				candyMatrix[x][y].JQ.fadeOut(fadeTime);
				candyMatrix[x][y] = undefined;
				flag = true;
			}
		}
	}
	if (flag)
		gravity();
}

//make Candies falling down
function gravity() {
	for ( x = 0; x < tileNum; x++) {
		var hole = 0;
		for ( y = tileNum - 1; y >= 0; y--) {
			if (!candyMatrix[x][y]) {
				hole++;
			} else {
				candyMatrix[x][y].reposition(x, y + hole);
			}
		}
		for ( i = 0; i < hole; i++) {
			var color = Math.floor(Math.random() * 6);
			var candy = new Candy(color, x, i-hole);
			$("#game").append(candy.JQ);
			candy.JQ.css("display","none");
			candy.reposition(x,i);
			candy.JQ.fadeIn(fadeTime);
		}
	}
	setTimeout(candyChain,moveTime);
}

function init() {
	for ( x = 0; x < tileNum; x++) {
		for ( y = 0; y < tileNum; y++) {
			var color = Math.floor(Math.random() * 6);
			var candy = new Candy(color, x, y);
			$("#game").append(candy.JQ);
			candyMatrix[x][y] = candy;
		}
	}
}