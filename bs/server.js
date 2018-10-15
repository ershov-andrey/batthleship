// Сервер аля джанго или apache/nginx, только в node
var express = require('express');

// Экземпляр сервера
var app = express();

// Создаём http сервер используя экспресс
var http = require('http').Server(app);

// Библиотека socket.io для WebSocket фронтенда
var io = require('socket.io')(http);

// Для экранирования html
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

// Логика игра
var BattleshipGame = require('./app/game.js');

// enum
var GameStatus = require('./app/gameStatus.js');

// Порт к которому будет коннект
var port = 80;

// Игроки
var users = {};

// Количество игр
var gameIdCounter = 1;

// Выдаёт статику из папки /public
app.use(express.static(__dirname + '/public'));

// Запускаем сервер
http.listen(port, function(){
  console.log('Game started at localhost:' + port);
});

// Логика подключения вебсокета
io.on('connection', function(socket) {

  // Создаём инстанс юзера
  users[socket.id] = {
    inGame: null,
    player: null
  }; 

  // Закидываем юзера в комнату ожидания, пока он один
  socket.join('waiting room');

  socket.on('chat', function(msg) {
    if(users[socket.id].inGame !== null && msg) {
      
      // Бродскастим опоненту
      socket.broadcast.to('game' + users[socket.id].inGame.id).emit('chat', {
        name: 'Противник',
        message: entities.encode(msg),
      });

      // Дублируем себе
      io.to(socket.id).emit('chat', {
        name: 'Я',
        message: entities.encode(msg),
      });
    }
  });


  socket.on('shot', function(position) {
    var game = users[socket.id].inGame
	var	opponent;
	
    if(game !== null) {
      if(game.currentPlayer === users[socket.id].player) {
        opponent = game.currentPlayer === 0 ? 1 : 0;

        if(game.shoot(position)) {
          checkGameOver(game);

          io.to(socket.id).emit('update', game.getGameState(users[socket.id].player, opponent));
          io.to(game.getPlayerId(opponent)).emit('update', game.getGameState(opponent, opponent));
        }
      }
    }
  });
  
  socket.on('leave', function() {
    if(users[socket.id].inGame !== null) {
      leaveGame(socket);

      socket.join('waiting room');
      joinWaitingPlayers();
    }
  });

  socket.on('disconnect', function() {    
    leaveGame(socket);
    delete users[socket.id];
  });

  joinWaitingPlayers();
});

function joinWaitingPlayers() {
  var players = getClientsInRoom('waiting room');
  
  if(players.length >= 2) {

	var game = new BattleshipGame(gameIdCounter++, players[0].id, players[1].id);

    players[0].leave('waiting room');
    players[1].leave('waiting room');
    players[0].join('game' + game.id);
    players[1].join('game' + game.id);

    users[players[0].id].player = 0;
    users[players[1].id].player = 1;
    users[players[0].id].inGame = game;
    users[players[1].id].inGame = game;
    
    io.to('game' + game.id).emit('join', game.id);

    io.to(players[0].id).emit('update', game.getGameState(0, 0));
    io.to(players[1].id).emit('update', game.getGameState(1, 1));

  }
}

function leaveGame(socket) {
  if(users[socket.id].inGame !== null) {

    socket.broadcast.to('game' + users[socket.id].inGame.id).emit('notification', {
      message: 'Ваш противник струсил и покинул игру.'
    });

    if(users[socket.id].inGame.gameStatus !== GameStatus.gameOver) {
      users[socket.id].inGame.abortGame(users[socket.id].player);
      checkGameOver(users[socket.id].inGame);
    }

    socket.leave('game' + users[socket.id].inGame.id);

    users[socket.id].inGame = null;
    users[socket.id].player = null;

    io.to(socket.id).emit('leave');
  }
}

function checkGameOver(game) {
  if(game.gameStatus === GameStatus.gameOver) {
    io.to(game.getWinnerId()).emit('gameover', true);
    io.to(game.getLoserId()).emit('gameover', false);
  }
}

function getClientsInRoom(room) {
  var clients = [];
  for (var id in io.sockets.adapter.rooms[room]) {
    clients.push(io.sockets.adapter.nsp.connected[id]);
  }
  return clients;
}
