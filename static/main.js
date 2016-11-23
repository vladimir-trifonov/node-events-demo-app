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

		function animateBot(botInfo) {
			var $bot = $('.' + botInfo.name);
			switch (botInfo.action) {
				case 'stop':
					$bot.animateSprite('play', 'stop');
					break;
				case 'animate':
					$bot.animateSprite('play', 'animate');
					break;
			}

			return {
				name: botInfo.name,
				state: botInfo.action
			};
		}

		function setButtonState(botInfo) {
			var btn = $('.button[data-name=' + botInfo.name + ']');
			// Similar to the ternary operator(alternative)
			botInfo.action === 'animate' && btn.addClass('active') || btn.removeClass('active');
		}

		function playMusic() {
			var hasAnimated = hasAnimatedBot() || false;
			// Ternary operator
			hasAnimated ? audio.play() : audio.pause();
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

		function setBotState(botInfo) {
			$('.' + botInfo.name).data('state', botInfo.state);
		}

		function notify(botInfo) {
			$.post("/bots/" + botInfo.name + '/actions/' + botInfo.state, {
				user: socket.id
			});
		}

		//
		// Sockets source flow
		//
		var srcWS = Rx.Observable.fromEventPattern(
			function add(h) {
				socket.on('animate', h);
			}
		).filter(function (data) {
			return data.sender !== socket.id;
		});

		srcWS.subscribe(setButtonState);

		srcWS
			.subscribe(function (botInfo) {
				// Animate the bot
				botInfo = animateBot(botInfo);

				// Save the current bot's state
				setBotState(botInfo);

				// Play music
				playMusic();
			});

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
			.subscribe(function (botInfo) {
				// Animate the bot
				botInfo = animateBot(botInfo);

				// Save the current bot's state
				setBotState(botInfo);

				// Send post request to notify about the changed state in bot's behaviour
				notify(botInfo);

				// Play music
				playMusic();
			});
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