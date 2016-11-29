/* global jQuery, Rx, io */
(function ($, Rx, io) {
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
			return $('.' + name).data('state') || 'chill';
		}

		function animateBot(botAction) {
			$('.' + botAction.name).animateSprite('play', botAction.action);
		}

		function setButton(botAction) {
			var btn = $('.button[data-name=' + botAction.name + ']');
			// Similar to the ternary operator(alternative)
			botAction.action === 'dance' && btn.addClass('active') || btn.removeClass('active');
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
					return state === 'dance';
				});
		}

		function saveBotState(botState) {
			$('.' + botState.name).data('state', botState.state);
		}

		function notify(botState) {
			$.post("/bots/" + botState.name + '/actions/' + botState.action, {
				user: socket.id
			});
		}

		// Animate bot and play music
		function playBot(botAction) {
			// Animate the bot
			animateBot(botAction);

			// Save the state
			saveBotState({
				name: botAction.name,
				state: botAction.action
			});

			// Play music
			playMusic(hasAnimatedBot());
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

		// Set button on/off
		srcWS.subscribe(setButton);

		// Animate the bot
		srcWS
			.subscribe(playBot);

		//
		// Button click source flow
		//
		var srcBtn = Rx.Observable.fromEvent(document.getElementsByClassName('button'), 'click')
			.map(function (e) {
				return e.currentTarget;
			});

		// Set button on/off
		srcBtn
			.subscribe(toggleButtonState);

		// Animate the bot
		srcBtn
			.map(function (target) {
				var name = getBotName(target);
				var state = getBotState(name);
				return {
					name: name,
					action: state === 'dance' ? 'chill' : 'dance'
				}
			})
			.subscribe(function (botAction) {
				// Animate the bot
				playBot(botAction);

				// Notify about the changed bot's state through a web socket
				notify(botAction);
			});
	}

	function initBotsAnimations(bots) {
		function genRange(cnt) {
			// Create a range array
			return Array.apply(null, Array(cnt)).map(function (val, idx) {
				return idx;
			});
		}

		function initBotAnimation(bot) {
			$('.' + bot.name).animateSprite({
				fps: 12,
				animations: {
					chill: [0],
					dance: bot.animateFrames
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
		initAudio('music.mp3');
	});
})(jQuery, Rx, io);
