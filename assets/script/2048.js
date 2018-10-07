/*
 * Copyright (C) 2018, ghosind.com
 * Author: Chen Su <i@ghosind.com>
 * 2048 game (PC only).
 */

var cells = new Array();
var score = 0;
var highest_score = 0;
var empty_cells = new Array();
var last_move_location = -1;
var xStart = null;
var yStart = null;

function init() {
  new_game();
  document.onkeydown = function(event) {
    var code = event.keycode || event.which || event.char;
    move(code);
  };

  
  var frames = document.getElementsByClassName("g-frame");
  if (!!frames && frames.length > 0) {
    var frame = frames[0];
    
    frame.addEventListener("touchstart", touchStartHander, false);
    frame.addEventListener("touchmove", touchMoveHandler, false);
  }
}

function new_game() {
  empty_cells = new Array();
  for (var i = 0; i < 4; i++) {
    cells[i] = new Array();
    for (var j = 0; j < 4; j++) {
      cells[i][j] = 0;
      empty_cells.push(i * 4 + j);
    }
  }

  score = 0;

  generate_new_number();
  generate_new_number();

  paint();
}

function paint() {
  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 4; j++) {
      var cell = document.getElementById("r" + (i + 1) + "c" + (j + 1));
      if (cells[i][j] != 0) {
        cell.innerText = cells[i][j];
      }
      else {
        cell.innerText = "";
      }
    }
  }

  var score_lable = document.getElementById("score");
  score_lable.innerText = score;

  var highest_lable = document.getElementById("highest");
  highest_lable.innerText = highest_score;
}

function generate_new_number() {
  if (empty_cells.length == 0) {
    return false;
  }

  var index = Math.floor(Math.random() * empty_cells.length);
  if (last_move_location != -1 && empty_cells[index] == last_move_location) {
    // Re-generate index to avoiding repeated index.
    index = Math.floor(Math.random() * empty_cells.length);
  }
  var is_four = Math.floor(Math.random() * 10) == 0 ? true : false;

  var row = Math.floor(empty_cells[index] / 4);
  var column = empty_cells[index] % 4;
  cells[row][column] = is_four == true ? 4 : 2;
  empty_cells.splice(index, 1);
}

function move(keycode) {
  switch (keycode) {
    case 37:  // Left
    case 38:  // Up
    case 39:  // Right
    case 40:  // Down
      if (!merge(keycode)) {
        return ;
      }
      paint();
      break;
    default:
      return;
  }

  check_empty();
  generate_new_number();
  paint();
}

function merge(direction) {
  var moved = false;
  var start = direction < 39 ? 0 : 3;
  var step = direction < 39 ? 1 : -1;
  last_move_location = -1;

  for (var i = start; i < 4 && i > -1; i += step) {
    for (var j = start; j < 4 && j > -1; j += step) {
      if ((direction == 38 || direction == 40) && cells[j][i] != 0) {
        // i for columns number and j for rows number when pressed up or down.
        var k = j + step; // k means next non-zero cell's row number
        // merge equal number cells
        for (; k < 4 && k > -1 && cells[k][i] == 0; k += step) {}
        if (k < 4 && k > -1 && k != j && cells[k][i] == cells[j][i]) {
          cells[j][i] *= 2;
          cells[k][i] = 0;
          score += cells[j][i];
          moved = true;
          last_move_location = k * 4 + i;
        }

        var l = j - step; // l means previous non-zero cell's row number
        // move cell
        for (; l < 4 && l > -1 && cells[l][i] == 0; l -= step) {}
        if (l + step != j && cells[l + step][i] == 0) {
          cells[l + step][i] = cells[j][i];
          cells[j][i] = 0;
          moved = true;
          last_move_location = j * 4 + i;
        }
      } else if ((direction == 37 || direction == 39) && cells[i][j] != 0) {
        // j for columns number and i for rows number when pressed left or right.
        var k = j + step; // k means next non-zero cell's row number
        // merge equal number cells
        for (; k < 4 && k > -1 && cells[i][k] == 0; k += step) {}
        if (k < 4 && k > -1 && k != j && cells[i][k] == cells[i][j]) {
          cells[i][j] *= 2;
          cells[i][k] = 0;
          score += cells[i][j];
          moved = true;
          last_move_location = i * 4 + k;
        }

        var l = j - step; // l means previous non-zero cell's row number
        // move cell
        for (; l < 4 && l > -1 && cells[i][l] == 0; l -= step) {}
        if (l + step != j && cells[i][l + step] == 0) {
          cells[i][l + step] = cells[i][j];
          cells[i][j] = 0;
          moved = true;
          last_move_location = i * 4 + j;
        }
      }
    }
  }

  highest_score = score > highest_score ? score : highest_score;
  return moved;
}

function check_empty() {
  // Check and add empty cells to the empty list.
  empty_cells = new Array();
  for (var i = 0; i < 4; i++) {
    for (var j = 0; j < 4; j++) {
      if (cells[i][j] == 0) {
        empty_cells.push(i * 4 + j);
      }
    }
  }
}

function touchStartHander(event) {
  event.preventDefault();

  xStart = event.touches[0].clientX;
  yStart = event.touches[0].clientY;
}

function touchMoveHandler(event) {
  if (!xStart || !yStart) {
    return ;
  }

  event.preventDefault();

  var xEnd = event.touches[0].clientX;
  var yEnd = event.touches[0].clientY;

  var xDiff = xEnd - xStart;
  var yDiff = yEnd - yStart;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    if (xDiff > 0) {
      move(39)
    } else {
      move(37);
    }
  } else {
    if (yDiff > 0) {
      move(40);
    } else {
      move(38);
    }
  }

  xStart = yStart = null;
}