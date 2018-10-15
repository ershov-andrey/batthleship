var GameStatus = {
	inProgress: 1,
	gameOver: 2
}

var Game = (function() {
	var canvas = [], context = [], grid = [];
	var gridRows = 10;
	var gridCols = 10;
	var turn = false;
	var gameStatus;

	$('#enemy').on('click', '.cell', function(e) {
		if(turn) {
		var row = $(e.target).data('row');
		var column = $(e.target).data('column');
			var square = {x: column, y: row};
			sendShot(square);
		}
	});

	function initGame() {
		var i;

		gameStatus = GameStatus.inProgress;
		
		grid[0] = { shots: Array(gridRows * gridCols), ships: [] };
		grid[1] = { shots: Array(gridRows * gridCols), ships: [] };

		for(i = 0; i < gridRows * gridCols; i++) {
			grid[0].shots[i] = 0;
			grid[1].shots[i] = 0;
		}

		$('#turn-status').removeClass('alert-your-turn').removeClass('alert-opponent-turn')
						.removeClass('alert-winner').removeClass('alert-loser');

		drawGrid(0);
		drawGrid(1);
	};

	function updateGrid(player, gridState) {
		grid[player] = gridState;
		drawGrid(player);
	};

	function setTurn(turnState) {
		if(gameStatus !== GameStatus.gameOver) {
			turn = turnState;

			if(turn) {
				$('#enemy').css('opacity', 1);
				$('#turn-status').removeClass('alert-opponent-turn').addClass('alert-your-turn').html('ВАШ ХОД');
			} else {
				$('#enemy').css('opacity', 0.5);
				$('#turn-status').removeClass('alert-your-turn').addClass('alert-opponent-turn').html('ХОД СОПЕРНИКА');
			}
		}
	};

	function setGameOver(isWinner) {
		gameStatus = GameStatus.gameOver;
		turn = false;
		
		if(isWinner) {
			$('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn')
							.addClass('alert-winner').html('ПОБЕДА! <a href="#" class="btn-leave-game">ЕЩЁ РАЗ</a>');
		} else {
			$('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn')
							.addClass('alert-loser').html('ПОТРАЧЕНО. <a href="#" class="btn-leave-game">ЕЩЁ РАЗ</a>');
		}
		$('.btn-leave-game').click(sendLeaveRequest);
	}

	function drawGrid(gridIndex) {
		drawSquares(gridIndex);
		drawShips(gridIndex); 
		drawMarks(gridIndex);
	};

	function drawSquares(gridIndex) {
		var i, j, squareX, squareY;
	
	// Player or enemy
	var htmlID = '';
	if(gridIndex == 0){
		htmlID = 'player';
	} else if(gridIndex == 1){
		htmlID = 'enemy';
	}
	
	var html_code = '';
		for(i = 0; i < gridRows; i++) {
		
		html_code += '<div class="row">';
			for(j = 0; j < gridCols; j++) {
			html_code += '<div data-row="'+i+'" data-column="'+j+'" id="'+htmlID+'_'+i+'_'+j+'" class="cell"></div>';
			}
		html_code += '</div>';
		}
	
	$('#'+htmlID).html(html_code);
	
	};

	function drawShips(gridIndex) {
	
	var htmlID = '';
	if(gridIndex == 0){
		htmlID = 'player';
	} else if(gridIndex == 1){
		htmlID = 'enemy';
	}
		
		for(i = 0; i < grid[gridIndex].ships.length; i++) {
		var ship = grid[gridIndex].ships[i];
			
			for(var l = 0; l<ship.size; l++){
				if(!ship.horizontal){
					$('#'+htmlID+'_'+ (ship.y+l) + '_' + ship.x ).addClass('ship');
				} else {
					$('#'+htmlID+'_'+ ship.y + '_' + (ship.x+l) ).addClass('ship');
				}
			}
		
		}
	};

	function drawMarks(gridIndex) {

	var htmlID = '';
	if(gridIndex == 0){
		htmlID = 'player';
	} else if(gridIndex == 1){
		htmlID = 'enemy';
	}
	
	var missHTML = '<div class="miss"></div>';
	var shotHTML = '<div class="shot"></div>';
	
		for(var i = 0; i < gridRows; i++) {
			for(var j = 0; j < gridCols; j++) {
				if(grid[gridIndex].shots[i * gridCols + j] === 1) {
					$('#'+ htmlID +'_'+i+'_'+j).addClass('miss');
					$('#'+ htmlID +'_'+i+'_'+j).html(missHTML);
				} else if(grid[gridIndex].shots[i * gridCols + j] === 2) {
					$('#'+htmlID+'_'+i+'_'+j).addClass('shot');
					$('#'+ htmlID +'_'+i+'_'+j).html(shotHTML);
				}
			}
		}
	};

	return {
		'initGame': initGame,
		'updateGrid': updateGrid,
		'setTurn': setTurn,
		'setGameOver': setGameOver
	};
})();
