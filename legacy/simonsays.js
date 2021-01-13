var Simon = (function () {
    var simon = {};

    var Oscillator = (function () {
        var mysound = {};
        var notes = [ 261.626, 329.628, 391.995, 523.251 ];
        // Temporary workaround until AudioContext is standardized 
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        var audioCtx = new AudioContext();
        var osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.start(0);

        mysound.sound = function (quadrant) {
            if ((quadrant < 0) || (quadrant > 3))
                return;
            beep(notes[quadrant],200, false);
        }
        mysound.silence = function () {
            beep(0, 200, false);
        }
        mysound.losebeep = function (after) {
            beep(155.563, 200, after);
        }
        var beep = function (frequency, duration, after) {
            if (typeof after != "function") {
                after = function () {};
            }
            osc.frequency.value = +frequency;
            osc.connect(audioCtx.destination);
            setTimeout(function () {
                osc.disconnect();
                after();
            }, +duration);
        }
        return mysound;
    })();

    var GameBoard = (function () {
        var game = {};
        var litcolors = ['red', 'yellow', 'lightblue', 'lightgreen'];
        var colors = ['darkred', 'darkorange', 'darkblue', 'darkgreen'];
        var innerRadius, outerRadius;
        var states = [ false, false, false, false ];
        var keys = [ 74, 75, 70, 68 ];
        var sequence = [];
        var seqitem = 0;
        var turn = 0;
        var timeout;
        var score = 0;
        var ctx;
        var c;

        game.setCanvas = function (canvas) {
            c = canvas;
            ctx = c.getContext("2d");
            return c;
        }

        game.paintToy = function (litquadrant) {
            writeMessage(c,10,25, ""+score);
            writeMessage(c,400,490, "Simon");
            outerRadius = c.width * 0.45;
            innerRadius = c.width * 0.05;
            ctx.translate(c.width / 2, c.height / 2);
            var i;
            for (i = 0; i < 4; i++) {
                states[i] = (litquadrant == i);
                slice(i);
            }
            ctx.translate(-c.width / 2, -c.height / 2);
        }
        var slice = function (quadrant) {
            ctx.rotate(quadrant * Math.PI/2);
            ctx.beginPath();
            ctx.arc(-5,-5,innerRadius,Math.PI, 3*Math.PI/2 );
            ctx.lineTo(-5,-outerRadius-5);
            ctx.arc(-5,-5,outerRadius, 3*Math.PI/2,Math.PI, true);
            ctx.closePath();
            if (states[quadrant]) {
                ctx.fillStyle = litcolors[quadrant];
            } else {
                ctx.fillStyle = colors[quadrant];
            }
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.stroke();
            ctx.rotate(-quadrant * Math.PI/2);
        }
        game.getQuadrant = function (mousePos) {
            var quadrant = 0;
            if (mousePos.y > c.width/2) {
                quadrant = 3;
            }
            if (mousePos.x > c.width/2) {
                if (quadrant == 3) {
                    quadrant = 2;
                } else {
                    quadrant++;
                }
            }
            return quadrant;
        }
        var writeMessage = function (canvas, x, y, message) {
            var context = canvas.getContext('2d');
            context.clearRect(x, y-30, canvas.width, 200);
            context.font = '18pt Calibri';
            context.fillStyle = 'black';
            context.fillText(message, x, y);
        }
        game.getMousePos = function (canvas, evt) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: Math.round((evt.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
                y: Math.round((evt.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height)
            };
        }
        game.getQuadrantKey = function (keycode) {
            var i;
            for (i = 0; i < 4; i++) {
                if (keys[i] == keycode) {
                    return i;
                }
            }
            return -1;
        }
        game.tryMove = function (quadrant) {
            game.paintToy(quadrant);
            if (sequence[seqitem++] == quadrant) {
                Oscillator.sound(quadrant);
                clearTimeout(timeout);
                if (seqitem == sequence.length) {
                    score++;
                    turn = 0;
                    setTimeout(game.computerTurn, 1000);
                } else {
                    timeout = setTimeout(lose, 5000);
                }
            } else {
                lose();
            }
        }
        game.isHumanTurn = function () {
            return turn == 1;
        }
        var computerPlay = function () {
            Oscillator.sound(sequence[seqitem]);
            game.paintToy(sequence[seqitem++]);
            setTimeout(clear, 200);
            if (seqitem < sequence.length) {
                setTimeout(computerPlay, 1000);
            } else {
                turn = 1;
                humanTurn();
            }
        }
        game.computerTurn = function () {
            sequence.push(Math.floor((Math.random() * 4)));
            seqitem = 0;
            computerPlay();
        }
        var clear = function () {
            Oscillator.silence();
            game.paintToy(-1);
        }
        var humanTurn = function () {
            seqitem = 0;
            timeout = setTimeout(lose, 5000);
        }
        var lose = function () {
            turn = -1;
            clearTimeout(timeout);
            Oscillator.losebeep(function(){alert("Sorry, you lose!")});
        }
        return game;
    })();

    var instructions = function () {
        alert("After the computer shows a sequence,\ntry to reproduce it.\nYou can use the keys dfjk or the mouse");
    }
    simon.run = function(canvas) {
        c = GameBoard.setCanvas(canvas);
        GameBoard.paintToy(-1);
        instructions();
        c.addEventListener('mousedown', function(evt) {
            var mousePos = GameBoard.getMousePos(c, evt);
            var quadrant = GameBoard.getQuadrant(mousePos);
            if (GameBoard.isHumanTurn()) {
                GameBoard.tryMove(quadrant);
            }
        }, false);    

        c.addEventListener('mouseup', function(evt) {
            GameBoard.paintToy(-1);
        }, false);    

        document.addEventListener('keyup', function(evt) {
            GameBoard.paintToy(-1);
        }, false);    

        document.addEventListener('keydown', function(evt) {
            var quadrant = GameBoard.getQuadrantKey(evt.keyCode);
            if (GameBoard.isHumanTurn()) {
                GameBoard.tryMove(quadrant);
            }
        }, false);

        GameBoard.computerTurn();
    }

    return simon;
})();
