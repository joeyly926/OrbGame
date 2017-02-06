var pics = [ 'white.png', 'milk.png', 'dark.png'];

window.setInterval( "changepic()", 2000 )

function changepic(){
	chocolate = document.getElementById("chocolate");
	randomChocolate = pics[Math.floor(Math.random()*pics.length)];
	chocolate.setAttribute("src", randomchocolate);
}