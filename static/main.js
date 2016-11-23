/* global jQuery, Rx, io */
(function ($, Rx) {
	var audio = null;

	function initBotsControls(socket) {
		//
		// Util functions
		//
		function toggleButton(target) {
			$(target).toggleClass('active');
			return target;
		}

		function getBotName(target) {
			return $(target).data('name');
		}

		function getBotState(name) {
			var state = $('.' + name).data('state') || 'stop';
			return {
				name: name,
				action: state === 'animate' ? 'stop' : 'animate'
			};
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

		function setButton(botInfo) {
			var btn = $('.button[data-name=' + botInfo.name + ']');
			botInfo.action === 'animate' && btn.addClass('active');
			botInfo.action === 'stop' && btn.removeClass('active');
		}

		function setMusic() {
			var hasAnimated = hasAnimatedBot() || false;
			hasAnimated ? audio.play() : audio.pause();
		}

		function hasAnimatedBot() {
			var someIsPlaying = false;
			$('.bot').each(function (i, el) {
				if ($(el).data('state') === 'animate') {
					someIsPlaying = true;
				}
			});
			return someIsPlaying;
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
		);

		srcWS
			.filter(function (data) {
				return data.sender !== socket.id;
			})
			.map(function(botInfo) {
				setButton(botInfo);
				animateBot(botInfo);
				return botInfo;
			})
			.subscribe(function (botInfo) {
				botInfo.state = botInfo.action;
				setBotState(botInfo);
				setMusic();
			});

		//
		// Button click source flow
		//
		var srcBtn = Rx.Observable.fromEvent(document.getElementsByClassName('button'), 'click')
			.map(function (e) {
				return e.currentTarget;
			});

		var btnObservable = srcBtn
			.map(toggleButton);

		var botObservable = srcBtn
			.map(getBotName)
			.map(getBotState)
			.map(animateBot);

		var source = Rx.Observable.zip(
			btnObservable,
			botObservable
		);

		source.subscribe(function (options) {
			var botInfo = options[1];
			setBotState(botInfo);
			notify(botInfo);
			setMusic();
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

		audio = new Audio('music-trimmed.m4a');
		audio.addEventListener('ended', function() {
			this.currentTime = 0;
			this.play();
		}, false);
	});
})(jQuery, Rx, io);