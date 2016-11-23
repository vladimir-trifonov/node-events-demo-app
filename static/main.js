/* global jQuery, Rx, io */
(function ($, Rx) {
	var audio = null;

	function initBotsControls(socket) {
		//
		// Util functions
		//
		function toggleButtonState(target) {
			$(target).toggleClass('active');
		}

		function getBotName(target) {
			return $(target).data('name');
		}

		function getBotState(name) {
			return $('.' + name).data('state') || 'stop';
		}

		function animateBot(botAction) {
			var $bot = $('.' + botAction.name);
			switch (botAction.action) {
				case 'stop':
					$bot.animateSprite('play', 'stop');
					break;
				case 'animate':
					$bot.animateSprite('play', 'animate');
					break;
			}

			return {
				name: botAction.name,
				state: botAction.action
			};
		}

		function setButtonState(botState) {
			var btn = $('.button[data-name=' + botState.name + ']');
			// Similar to the ternary operator(alternative)
			botState.action === 'animate' && btn.addClass('active') || btn.removeClass('active');
		}

		function playMusic(play) {
			// Ternary operator
			play ? audio.play() : audio.pause();
		}

		function hasAnimatedBot() {
			return $('.bot')
				.map(function (i, el) {
					return $(el).data('state');
				})
				.toArray()
				.some(function (state) {
					return state === 'animate';
				});
		}

		function setBotState(botState) {
			$('.' + botState.name).data('state', botState.state);
		}

		function notify(botState) {
			$.post("/bots/" + botState.name + '/actions/' + botState.state, {
				user: socket.id
			});
		}

		// Animate bot and play music
		function play(botAction) {
			// Animate the bot
			var botState = animateBot(botAction);

			// Save the current bot's state
			setBotState(botState);

			// Play music
			playMusic(hasAnimatedBot());

			return botState;
		}

		//
		// Sockets source flow
		//
		var srcWS = Rx.Observable.fromEventPattern(
			function add(h) {
				socket.on('animate', h);
			}
		)
			.filter(function (data) {
				return data.sender !== socket.id;
			})
			.map(function (botInfo) {
				return {
					name: botInfo.name,
					action: botInfo.action
				}
			});

		srcWS.subscribe(setButtonState);

		srcWS
			.subscribe(play);

		//
		// Button click source flow
		//
		var srcBtn = Rx.Observable.fromEvent(document.getElementsByClassName('button'), 'click')
			.map(function (e) {
				return e.currentTarget;
			});

		srcBtn
			.subscribe(toggleButtonState);

		srcBtn
			.map(function (target) {
				var name = getBotName(target);
				var state = getBotState(name);
				return {
					name: name,
					action: state === 'animate' ? 'stop' : 'animate'
				}
			})
			.map(play)
			.subscribe(notify);
	}

	function initBotsAnimations(bots) {
		function genRange(cnt) {
			return Array.apply(null, Array(cnt)).map(function (val, idx) {
				return idx;
			});
		}

		function initBotAnimation(bot) {
			$('.' + bot.name).animateSprite({
				fps: 12,
				columns: 60,
				animations: {
					stop: [0],
					animate: bot.animateFrames
				},
				loop: true
			});
		}

		// Init bots animations
		bots.map(function (bot) {
			return {
				name: bot.name,
				animateFrames: genRange(bot.animateFramesCnt)
			};
		})
			.forEach(initBotAnimation);
	}

	function initSocketIO() {
		return io.connect();
	}

	function initAudio(fn) {
		audio = new Audio(fn);
		// Replay music - play in loop
		audio.addEventListener('ended', function () {
			this.currentTime = 0;
			this.play();
		}, false);
	}

	// Main
	$(function () {
		initBotsAnimations([{
			name: 'clo',
			animateFramesCnt: 60
		}, {
			name: 'pinko',
			animateFramesCnt: 10
		}, {
			name: 'flynn',
			animateFramesCnt: 25
		}]);

		var socket = initSocketIO();
		initBotsControls(socket);
		initAudio('music-trimmed.m4a');
	});
})(jQuery, Rx, io);