/**
 * Gemz game logic.
 *
 * @author Joseph Ly
 * @version 1.0
 */

/** Colors for gems */
var gemColors = ['yellow','red','blue','purple','green'];
/** Size of the grid */
var gridVol = 6;
/** Height of the gems */
var gemHeight = 50;
/** Width of the gems */
var gemWidth = 50;
/** Grid matrix of the gems */
var gemGrid = new Array(gridVol);
/** The gem being dragged */
var gemHeld = new Gem(0,90,90);
/** Used for reverting gems to previous location */
var swapping = false;
/** Current mouse position in the window */
var currentMousePos = { x: -1, y: -1};
/** Offset of the first gem from the window */
var offset;
/** Color of the goal for the current level */
var colorGoal;
/** Fade time of the appearing gems */
var fadeTime = 300;
/** Delay until next chain can execute */
var cueNextChain = 500;
/** Animation time of the gem movements */
var animTime = 100;
/** Current progress towards goal */
var progress;
/** Current level in the game */
var currLevel = 0;
/** Current goal in the game */
var currGoal;
/** Current timer of the level */
var currTimer = -1;
/** Array of goals for each level */
var levelGoal = [ 5, 10, 15, 20, 1000000];
/** Array of timer limits for each level */
var timeLimit = [ 120000, 240000, 360000, 720000, 30000];
/** Current drag function */
var allowDrag = 'enable';
/** Time for compounding fading times */
var fadeInTime = 0;
/** Holds timer interval */
var timerInterval;

/** Tracks the current mouse location */
$(document).mousemove(function(ev){
	currentMousePos.x = event.pageX;
	currentMousePos.y = event.pageY;
});
/** Sets board size according to button pressed */
$(document).ready(function(){
	$('#grid6x6').click(function(){
		gridVol = 6;
		$('#frame').css('width',300).css('height',300);
	});
	$('#grid8x8').click(function(){
		gridVol = 8;
		$('#frame').css('width',400).css('height',400);
	});
});

/**
 * Initializes the board and sets
 * appropriate variables.
 */
function init(){
	if ( currTimer == 0 && currLevel){
		currLevel = 0;
		reset();
		return;
	}
	for( i=0; i < gridVol; i++)
		gemGrid[i] = new Array(gridVol);
	for( y = 0; y < gridVol; y++)
		for( x = 0; x < gridVol; x++)
			gemGrid[x][y] = new Gem( Math.floor(Math.random()*gemColors.length),x,y);
	offset = gemGrid[0][0].jqElem.offset();
	for( y = 0; y < gridVol; y++)
		for( x = 0; x < gridVol; x++){
			gemGrid[x][y].jqElem.css('top', gemHeight * gemGrid[x][y].gemY + offset.top);
			gemGrid[x][y].jqElem.css('left', gemWidth * gemGrid[x][y].gemX + offset.left);
		}
	progress = 0;
	currGoal = levelGoal[currLevel];
	currTimer = timeLimit[currLevel];
	colorGoal = Math.floor(Math.random()*gemColors.length);
	$('#level').html("Level: " + ++currLevel);
	$('#progress').html(gemColors[colorGoal] + ": " + progress + "/" + currGoal);
	$('#size').html( 'Grid Size: ' + gridVol + 'x' + gridVol);
	timerInterval = window.setInterval( "printtime()", 1);
	setTimeout(gemChain,1000);
}

/**
 * Gem object that holds position on grid,
 * functions relating to the gem itself,
 * and the color of the gem.
 * @param color an integer between 0 - 2
 * @param x x coordinate of gem
 * @param y y coordinate of gem
 */
function Gem(color, xCoor, yCoor) {
	this.color = color;
	this.gemX = xCoor;
	this.gemY = yCoor;
	var thisGem = this; // used for maintaining the gem itself for its jquery actions
	this.jqElem = $('<img />',{src: gemColors[this.color] + '.png'});
	this.jqElem.addClass('gem').addClass(gemColors[this.color]);
	this.jqElem.css('height', gemHeight).css('width', gemWidth);
	$('#frame').append(this.jqElem);
	
	var JQ = $(this.jqElem);
	var dragging = false;
	JQ.mousedown(function(){
		gemHeld = thisGem;
		gemHeld.jqElem.addClass("gemHeld");
	}).mouseup(function(){
		var currX = Math.floor((currentMousePos.x - offset.left) / gemWidth);
		var currY = Math.floor((currentMousePos.y - offset.top) / gemHeight);
		if(isValid(currX,currY)){
			var targetGem = gemGrid[currX][currY];
			var targetX = targetGem.gemX;
			var targetY = targetGem.gemY;
			targetGem.slide(gemHeld.gemX,gemHeld.gemY);
			gemHeld.slide(targetX,targetY);
			gemHeld.jqElem.removeClass("gemHeld");
			gemHeld = null;
			swapping = true;
			setTimeout(gemChain,cueNextChain);
		}
		else{
			swapping = false;
			gemHeld.jqElem.removeClass("gemHeld");
			gemHeld = null;
		}
	});
	JQ.draggable({
		containment:'parent',
		revert: function(){
			return !swapping;
		}
	});
	JQ.draggable(allowDrag);
	
	// Slide animation for repositioning after drop.
	// Both gems have to call this with each other's 
	// coordinates
	this.slide = function(destX, destY){
		var heldOffset = JQ.offset();
		JQ.animate({
			left: '+=' + ((destX * gemWidth + offset.left) - heldOffset.left), 
			top: '+=' + ((destY * gemHeight + offset.top) - heldOffset.top),
			duration: animTime
		});
		thisGem.gemX = destX;
		thisGem.gemY = destY;
		gemGrid[thisGem.gemX][thisGem.gemY] = thisGem;
	}
}

function draggability(drag){
	for ( i=0; i < gridVol; i++)
		for ( j = 0; j < gridVol; j++)
			gemGrid[i][j].jqElem.draggable(drag);
}


/**
 * Checks gems above, below, left,
 * and right of the current held gem.
 * 
 * @param checkX x coordinate of target location
 * @param checkY y coordinate of target location
 * @return returns validity of spots
 */
function isValid(checkX,checkY){
	if(!gemHeld){
		return false;
	}
	var xv = Math.abs(checkX - gemHeld.gemX);
	var yv = Math.abs(checkY - gemHeld.gemY);
	return ((xv == 1 && yv == 0) || (yv == 1 && xv == 0));
}
/**
 * Class used for checking chains 
 * found on the map. A value of 2 or
 * greater in either X or Y signifies 
 * a chain has been made.
 *
 * @param x Number of gems in horizontal chain
 * @param y Number of gems in vertical chain 
 */
function chain( x, y){
	this.X = x;
	this.Y = y;
	return this;
}

/**
 * Finds chains withhin the grid
 * after a user moves. Timer is paused
 * and the user must wait until all subsequent
 * chains are finished. 
 */
function gemChain(){
	draggability((allowDrag = 'disable'));
	var chainGrid = new Array(gridVol);
	for( z = 0; z < gridVol; z++)
		chainGrid[z] = new Array(gridVol);
	var chainX;
	var chainY;
	for ( i = 0; i < gridVol; i++){
		for ( j = 0; j <gridVol; j++){
			chainX = 0;
			chainY = 0;
			if ( i > 0 ){
				chainX = ( gemGrid[i][j].color == gemGrid[ i - 1 ][j].color ? chainGrid[ i - 1 ][j].X + 1 : 0);
				if( chainX >= 2 )
					for ( z = chainX; z > 0; z--)
						chainGrid[ i - z ][j].X = chainX;
			}
			if ( j > 0 ){
				chainY = ( gemGrid[i][j].color == gemGrid[i][ j - 1 ].color ? chainGrid[i][ j - 1 ].Y + 1 : 0);
				if( chainY >= 2 )
					for ( z = chainY; z > 0; z--)
						chainGrid[i][ j - z ].Y = chainY;
			}
			chainGrid[i][j] = new chain(chainX,chainY);
		}
	}
	var drop = false;
	for ( i = 0; i < gridVol; i++)
		for ( j = 0; j < gridVol; j++)
			if (chainGrid[i][j].X > 1 || chainGrid[i][j].Y > 1){
				if(gemGrid[i][j].color == colorGoal)
					progress++;
				gemGrid[i][j].jqElem.fadeOut(fadeTime);
				gemGrid[i][j] = undefined;
				drop = true;
			}
	$('#progress').html(gemColors[colorGoal] + ": " + progress + "/" + currGoal);
	if ( drop ){
		dropGems();
		setTimeout( function(){
			fadeInTime = 0;
		}, fadeInTime);
	}
	draggability((allowDrag = 'enable'));
	if (progress >= currGoal){
		setTimeout(function(){
			alert(" Congratulations on completing " 
			+ (currLevel))}, fadeInTime);
		setTimeout(reset, fadeInTime);
		return;
	}
}
/**
 * Reorganizes gems and fills in gaps
 * left by making chains.
 */
function dropGems(){
	var empty;
	//var emptyX;
	for ( i = 0; i < gridVol; i++){
		empty = 0;
		for ( j = gridVol - 1; j >= 0; j--){
			if(!gemGrid[i][j])
				empty++;
			else
				gemGrid[i][j].slide(i,j + empty);
		}
		for ( y = 0; y < empty; y++){
			var newGem = new Gem(Math.floor(Math.random() * gemColors.length), i, 0);
			$('#frame').prepend(newGem);
			newGem.jqElem.css('top', gemHeight * newGem.gemY + offset.top);
			newGem.jqElem.css('left', gemWidth * newGem.gemX + offset.left);
			newGem.jqElem.css('opacity', 0).delay(fadeTime).animate({opacity:1});
			newGem.slide(i,y);
			fadeInTime += fadeTime;
		}
	}
	setTimeout(gemChain,(fadeInTime + animTime));
}

/** Resets the board */
function reset(){
	$('#frame').empty();
	window.clearInterval(timerInterval);
	init();
}

/** Prints the timer every second */
function printtime() {
	window.clearInterval( timerInterval );
	if(currTimer){
		$('#timer').html("Timer: " + timeformat( (currTimer -= 1000) ));
		timerInterval = window.setInterval( "printtime()", 1000);
	}
	else{
		alert("You have failed!");
		currLevel = 0;
		reset();
	}
	
}

/** 
 * Formats the time from milliseconds
 * to minutes and seconds
 * @param time time in milliseconds
 * @return time formatted in minutes and seconds
 */
function timeformat(time) {
	//calculate the time in hours, minutes and seconds
	min = time / 60000;
	sec = min % 1;
	min -= sec;
	sec *= 60;
	remainder = sec % 1;
	sec -= remainder;
	if( min < 10 ) { min = "0" + min; }
	if( sec < 10 ) { sec = "0" + sec; }
	formattedtime = min + ":" + sec;
	return formattedtime;
}

