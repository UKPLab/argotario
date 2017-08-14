/**
 * math.js
 * Functions to calculate the coefficients of a parabola.
 * Heavily based on the code of Rudolf Brinkmann,
 * from his site http://www.brinkmann-du.de/mathe/rbtest/1sonstiges/par_d_3punkte/par_d3punkte_01.htm
 */

function FXArcAnimation(elem, start, end, duration) {
	var data		= fly([start,end]);
	function getY(x) {
		return data[0] + data[1]*x + data[2]*x*x;
	}

	var startTimestamp;
	var step = function(timestamp){
		if (!startTimestamp) startTimestamp = timestamp;
		var progress = (timestamp-startTimestamp)/duration;
		if (progress>=1) return;

		var x = progress;
		var x1 = start.x+(end.x-start.x)*progress,
		y	= getY(x1);

		var x2 = (2*x-1);
		var scale = 0.5*(-x2*x2)+1;

		// For the opacity: 1 in [0, 0.65], decreasing parabolically afterwards
		var x3 = 2*x-0.5;
		var opacity = min(1, 0.5*(-x3*x3)+1.2);
		elem.css({
			webkitTransform: 'translate3d('+x1+'px,'+y+'px,0px) scale('+scale+')',
			opacity: opacity
		});

		requestAnimationFrame(step);
	};

	requestAnimationFrame(step);

/*	setTimeout(function () {
		elem.remove();
	},duration+400);
*/
	function fly(data) {
		var coords		= [[data[0].x,data[0].y], [(data[0].x+data[1].x)/2, (data[0].y+data[1].y)/2-100], [data[1].x,data[1].y]];
		return getParabolaCoefficients( coords );
	}

	function min(x,y) {
		return x<y?x:y;
	}
}

function FXVaporize(elem, vertical, horizontal, duration) {

	var startTimestamp = null;
	function step(timestamp) {
		var progress, x, y, scale, opacity;
		if(startTimestamp === null) startTimestamp = timestamp;

		progress = (timestamp - startTimestamp) / duration;
		if (progress>=1) {
			elem.remove();
			return;
		};

		x = horizontal *Math.sin(progress * 20);
		y = -progress*vertical;
		scale = 1-progress*.5;
		opacity = 1-progress;
		elem.css({
			webkitTransform: 'translate3d('+x+'px,'+y+'px,0px) scale('+scale+')',
			opacity: opacity
		});

		requestAnimationFrame(step);
	}

	requestAnimationFrame(step);
}




function getParabolaCoefficients(coords) {

// --- Definition der globalen Variablen für den Gauss-Algorithmus --- //

var N = 3;   // Anzahl der Gleichungen

// ---------------------------------------------------------------------- //

x=new Array();  //Funktionsvariablen
y=new Array();  // Funktionswerte
a=new Array();  // Funktionskoeffizienten

var kmax=2;            // Anzahl der Koeffizienten hier bis a2 (3 Koeffizienten)

var xi=new Array();    // x-Koordinaten der Punkte
var yi=new Array();    // y-Koordinaten der Punkte
var paz=3;             // Anzahl der Punkte


gauss(coords);
return a;

function gauss(coords) {
	var i,text = " ";
	var ko=new Array();  // für die Koeffizientenmatrix

	 for (i = 0; i <= N+1; i++)
		{
		 // Koeffizienten initialisieren
		 xi[i]=0;
		 yi[i]=0;
		 ko[i]=0;
		}

	 for (i = 0; i <= N+1; i++)
		{
			ko[i] = new Array();
		}

	 // Koordinaten der Punkte einlesen
	 for (i = 1; i <= N; i++) {
		xi[i] = coords[i-1][0];
		yi[i] = coords[i-1][1];
	 }

	 // Koeffizienten berechnen

	 for (i = 1; i <= N; i++)
		{
		 ko[i][1]=Math.pow(xi[i],2);
		 ko[i][2]=xi[i];
		 ko[i][3]=1;
		 ko[i][4]=yi[i];
		}

	// Gaussalgorithmus
	eliminate(ko);
}





 // Gausssches Eliminationsverfahren
	function eliminate(ko) {
		var i, j, k, max,t,text="";

			for (i = 1; i <= N; i++)
			 {
				 max = i;
				 for (j =i+1; j <=N; j++)
					 if ( Math.abs(ko[j][i]) > Math.abs(ko[max][i]))
						 {
							 max = j;
						 }
			for ( k = i; k <= N+1; k++ )
				{
					t = ko[i][k];
							ko[i][k] = ko[max][k];
												 ko[max][k] = t;
				}
			for ( j = i+1; j <= N; j++ )
				{
					 for ( k = N+1; k >= i; k--)
						 {
							 ko[j][k] = ko[j][k] - ko[i][k]*ko[j][i]/ko[i][i]
						 }
				}

			}
		// Funktionskoeffizienten berechnen
		substitute(ko);
	}

	function substitute(ko) {
		var i,j,k,t=0,text="";
		var r = new Array();   // für die rechte Seite

		 for (i = 1; i <= N+1; i++)
			{
			 r[i]=0.0;
			}

		for( j = N; j >=1; j--)
			{
				t = 0.0;
				for( k=j+1; k<=N; k++)
					{
					 t = t + ko[j][k]*r[k];
					}
				r[j] = ( ko[j][N+1]-t )/ko[j][j];
			}

				for ( i=1; i<=N; i++)
			 {
				 a[N-i]=r[i];
				}
	}
}
