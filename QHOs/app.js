const theCanvas = document.getElementById("theCanvas");
const theContext = theCanvas.getContext("2d");
const pauseButton = document.getElementById("pauseButton");
const speedSlider = document.getElementById("speedSlider");

const iMax = Number(theCanvas.width);	// max index in function arrays (so array size is iMax+1)
const pxPerX = 60;			// number of pixels per conventional x unit
const clockSpaceFraction = 0.25;	// fraction of vertical space taken up by clocks
const clockRadiusFraction = 0.45;	// as fraction of width or height of clock space
const clockSpaceHeight = theCanvas.height * clockSpaceFraction;
const clockPixelRadius = clockSpaceHeight * clockRadiusFraction;
const psi = {re: (new Array(iMax + 1)), im: (new Array(iMax + 1))};
const nMax = 7;				// maximum energy quantum number
const eigenPsi = new Array(nMax + 1);
const amplitude = new Array(nMax + 1);		// amplitudes of the eigenfunctions in psi
const phase = new Array(nMax + 1);			// phases of the eigenfunctions in psi
const nColors = 360;
const phaseColor = new Array(nColors + 1);
let running = true;
let mouseIsDown = false;
let mouseClock;

// Add mouse/touch handlers; down/start must be inside the canvas but drag can go outside it:
theCanvas.addEventListener('mousedown', mouseDown, false);
document.body.addEventListener('mousemove', mouseMove, false);
document.body.addEventListener('mouseup', mouseUp, false);	// button release could occur outside canvas
theCanvas.addEventListener('touchstart', touchStart, false);
document.body.addEventListener('touchmove', touchMove, false);
document.body.addEventListener('touchend', mouseUp, false);

init();
nextFrame();

function init() {
    // Initialize eigenfunctions (simple harmonic oscillator):
    for (let n = 0; n <= nMax; n++) {
        eigenPsi[n] = new Array(iMax + 1);
    }
    for (let i = 0; i <= iMax; i++) {
        const x = (i - iMax / 2) / pxPerX;
        eigenPsi[0][i] = Math.exp(-x * x / 2);
        eigenPsi[1][i] = Math.sqrt(2) * x * eigenPsi[0][i];
        eigenPsi[2][i] = (1 / Math.sqrt(2)) * (2 * x * x - 1) * eigenPsi[0][i];
        eigenPsi[3][i] = (1 / Math.sqrt(3)) * (2 * x * x * x - 3 * x) * eigenPsi[0][i];
        eigenPsi[4][i] = (1 / Math.sqrt(24)) * (4 * x * x * x * x - 12 * x * x + 3) * eigenPsi[0][i];
        eigenPsi[5][i] = (1 / Math.sqrt(60)) * (4 * x * x * x * x * x - 20 * x * x * x + 15 * x) * eigenPsi[0][i];
        eigenPsi[6][i] = (1 / Math.sqrt(720)) * (8 * x * x * x * x * x * x - 60 * x * x * x * x + 90 * x * x - 15) * eigenPsi[0][i];
        eigenPsi[7][i] = (1 / Math.sqrt(36 * 70)) * (8 * x * x * x * x * x * x * x - 84 * x * x * x * x * x + 210 * x * x * x - 105 * x) * eigenPsi[0][i];
    }
    // Initialize amplitudes and phases:
    for (let n = 0; n <= nMax; n++) {
        amplitude[n] = 0;
        phase[n] = 0;
    }

    //amplitude[0] = 1 / Math.sqrt(2);
    //amplitude[1] = 1 / Math.sqrt(2);
    // Initialize array of colors to represent phases:

    for (let c = 0; c <= nColors; c++) {
        phaseColor[c] = colorString(c / nColors);
    }
}

function nextFrame() {
    for (let n = 0; n <= nMax; n++) {
        phase[n] -= (n + 0.5) * Number(speedSlider.value);
        if (phase[n] < 0) phase[n] += 2 * Math.PI;
    }
    buildPsi();
    paintCanvas();
    if (running) window.setTimeout(nextFrame, 1000 / 30);
}

function buildPsi() {
    for (let i = 0; i <= iMax; i++) {
        psi.re[i] = 0;
        psi.im[i] = 0;
    }
    for (let n = 0; n <= nMax; n++) {
        const realPart = amplitude[n] * Math.cos(phase[n]);
        const imagPart = amplitude[n] * Math.sin(phase[n]);
        for (let i = 0; i <= iMax; i++) {
            psi.re[i] += realPart * eigenPsi[n][i];
            psi.im[i] += imagPart * eigenPsi[n][i];
        }
    }
}

function setMouseClock(relX, relY) {	// parameters are x,y in pixels, relative to clock center
    mouseIsDown = true;
    let pixelDistance = Math.sqrt(relX * relX + relY * relY);
    amplitude[mouseClock] = Math.min(pixelDistance / clockPixelRadius, 1);
    phase[mouseClock] = Math.atan2(relY, relX);
    if (phase[mouseClock] < 0)
        phase[mouseClock] += 2 * Math.PI;
    buildPsi();
    paintCanvas();
}

function mouseOrTouchStart(pageX, pageY, e) {
    if (pageY - theCanvas.offsetTop > theCanvas.height - clockSpaceHeight) {
        mouseClock = Math.floor((pageX - theCanvas.offsetLeft) / clockSpaceHeight);
        const clockCenterX = clockSpaceHeight * (mouseClock + 0.5);	// relative to left of canvas
        const clockCenterY = theCanvas.height - clockSpaceHeight * 0.5;	// relative to top of canvas
        const relX = pageX - theCanvas.offsetLeft - clockCenterX;
        const relY = clockCenterY - (pageY - theCanvas.offsetTop);	// measured up from clock center
        if (relX * relX + relY * relY <= clockPixelRadius * clockPixelRadius) {
            setMouseClock(relX, relY);
            e.preventDefault();
        }
    }
}

function mouseOrTouchMove(pageX, pageY, e) {
    if (mouseIsDown) {
        const clockCenterX = clockSpaceHeight * (mouseClock + 0.5);	// relative to left of canvas
        const clockCenterY = theCanvas.height - clockSpaceHeight * 0.5;	// relative to top of canvas
        const relX = pageX - theCanvas.offsetLeft - clockCenterX;
        const relY = clockCenterY - (pageY - theCanvas.offsetTop);	// measured up from clock center
        setMouseClock(relX, relY);
        e.preventDefault();
    }
}

function mouseDown(e) {
    mouseOrTouchStart(e.pageX, e.pageY, e);
}

function touchStart(e) {
    mouseOrTouchStart(e.targetTouches[0].pageX, e.targetTouches[0].pageY, e);
}

function mouseMove(e) {
    mouseOrTouchMove(e.pageX, e.pageY, e);
}

function touchMove(e) {
    mouseOrTouchMove(e.targetTouches[0].pageX, e.targetTouches[0].pageY, e);
}

function mouseUp(e) {
    mouseIsDown = false;
    paintCanvas();
}

function paintCanvas() {
    theContext.fillStyle = "black";
    theContext.fillRect(0, 0, theCanvas.width, theCanvas.height);

    let baselineY, pxPerY;
    baselineY = theCanvas.height * (1 - clockSpaceFraction) / 2;
    pxPerY = baselineY * 0.9;

    // Draw the horizontal axis:
    theContext.strokeStyle = "gray";
    theContext.lineWidth = 1;
    theContext.beginPath();
    theContext.moveTo(0, baselineY);
    theContext.lineTo(theCanvas.width, baselineY);
    theContext.stroke();

    theContext.lineWidth = 2;

    // Plot the real part of psi:
    theContext.beginPath();
    theContext.moveTo(0, baselineY - psi.re[0] * pxPerY);
    for (let i = 1; i <= iMax; i++) {
        theContext.lineTo(i, baselineY - psi.re[i] * pxPerY);
    }
    theContext.strokeStyle = "#ffc000";
    theContext.stroke();

    // Plot the imaginary part of psi:
    theContext.beginPath();
    theContext.moveTo(0, baselineY - psi.im[0] * pxPerY);
    for (let i = 1; i <= iMax; i++) {
        theContext.lineTo(i, baselineY - psi.im[i] * pxPerY);
    }
    theContext.strokeStyle = "#00d0ff";
    theContext.stroke();

    // Draw the eigen-phasor diagrams:
    const phasorSpace = theCanvas.height * clockSpaceFraction;
    const clockRadius = phasorSpace * clockRadiusFraction;
    for (let n = 0; n <= nMax; n++) {
        theContext.strokeStyle = "gray";
        theContext.lineWidth = 1;
        theContext.beginPath();
        const centerX = (n + 0.5) * phasorSpace;
        const centerY = theCanvas.height - 0.5 * phasorSpace;
        theContext.arc(centerX, centerY, clockRadius, 0, 2 * Math.PI);
        theContext.stroke();
        theContext.beginPath();
        theContext.moveTo(centerX, centerY);
        const clockHandX = centerX + clockRadius * amplitude[n] * Math.cos(phase[n]);
        const clockHandY = centerY - clockRadius * amplitude[n] * Math.sin(phase[n]);
        theContext.lineTo(clockHandX, clockHandY);
        theContext.strokeStyle = phaseColor[Math.round(phase[n] * nColors / (2 * Math.PI))];
        theContext.lineWidth = 3;
        theContext.stroke();
    }

    // Provide feedback when setting an amplitude:
    if (mouseIsDown) {
        theContext.fillStyle = "#a0a0a0";
        theContext.font = "20px monospace";
        theContext.fillText("n = " + mouseClock, 100, 30);
        const amp = amplitude[mouseClock];
        const ph = phase[mouseClock];
        theContext.fillText("Mag = " + Number(amp).toFixed(3), 195, 30);
        const deg = String.fromCharCode(parseInt('00b0', 16));		// degree symbol
        theContext.fillText("Phase = " + Math.round(ph * 180 / Math.PI) + deg, 360, 30);
        //theContext.fillText("Re = " + Number(amp*Math.cos[ph]).toFixed(3), 180, 30);
    }
}

function startStop() {
    running = !running;
    if (running) {
        pauseButton.innerHTML = "Pause";
        nextFrame();
    } else {
        pauseButton.innerHTML = "Resume";
    }
}

function zero() {
    for (let n = 0; n <= nMax; n++) {
        amplitude[n] = 0;
    }
    buildPsi();
    paintCanvas();
}

// Function to convert a number to a two-digit hex string (from stackoverflow):
function twoDigitHex(c) {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

// Function to create a hex color string for a given hue (between 0 and 1):
function colorString(hue) {
    let r, g, b;
    if (hue < 1 / 6) {
        r = 255;
        g = Math.round(hue * 6 * 255);
        b = 0;			// red to yellow
    } else if (hue < 1 / 3) {
        r = Math.round((1 / 3 - hue) * 6 * 255);
        g = 255;
        b = 0;	// yellow to green
    } else if (hue < 1 / 2) {
        r = 0;
        g = 255;
        b = Math.round((hue - 1 / 3) * 6 * 255);	// green to cyan
    } else if (hue < 2 / 3) {
        r = 0;
        g = Math.round((2 / 3 - hue) * 6 * 255);
        b = 255;	// cyan to blue
    } else if (hue < 5 / 6) {
        r = Math.round((hue - 2 / 3) * 6 * 255);
        g = 0;
        b = 255;	// blue to magenta
    } else {
        r = 255;
        g = 0;
        b = Math.round((1 - hue) * 6 * 255);	// magenta to red
    }
    return "#" + twoDigitHex(r) + twoDigitHex(g) + twoDigitHex(b);
}