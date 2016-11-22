/* global jQuery, Rx, io */
(function ($, Rx) {
	function initBotsControls(socket) {
		function toggleButton(e) {
			$(e.currentTarget).toggleClass('active');
			return e;
		}

		function getBotName(e) {
			return $(e.currentTarget).data('name');
		}

		function getBotState(name) {
			return {
				name: name,
				state: $('.' + name).data('state') || 'stop'
			};
		}

		function animateBot(botInfo) {
			var state = null;
			switch (botInfo.state) {
				case 'animate':
					$('.' + botInfo.name).animateSprite('stop');
					state = 'stop';
					break;
				case 'stop':
					$('.' + botInfo.name).animateSprite('play', 'animate');
					state = 'animate';
					break;
			}

			return {
				name: botInfo.name,
				state: state
			};
		}

		var srcBtn = Rx.Observable.fromEvent(document.getElementsByClassName('button'), 'click');
		var srcWS = Rx.Observable.fromEventPattern(
			function add (h) {
				socket.on('animate', h);
			}
		);

		var btnObservable = srcBtn.map(toggleButton);
		var botObservable = srcBtn.map(getBotName)
			.map(getBotState)
			.map(animateBot);

		var source = Rx.Observable.combineLatest(
			btnObservable,
			botObservable
		);

		var setBotState = function(options) {
			var botInfo = options[1];
			$('.' + botInfo.name).data('state', botInfo.state);
		}

		// Subscribe to btn event click
		source.subscribe(setBotState);
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
	});
})(jQuery, Rx, io);