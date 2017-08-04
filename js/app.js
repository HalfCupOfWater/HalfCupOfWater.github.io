// 元素
var container = document.getElementById('game');
var myCanvas = document.getElementById("canvas");
var context = myCanvas.getContext("2d");
window.requestAnimFrame =
  window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||window.msRequestAnimationFrame || function(callback) {
    window.setTimeout(callback, 1000 / 30);
  };
var monNum = 7;
var level = 1;
var deadMon = 0;
var allMon = 7;
var plane = null;
var monsters = [];

var img_mon = new Image();
img_mon.src = "img/enemy.png";
var img_die = new Image();
img_die.src = "img/boom.png";
var img_plane = new Image();
img_plane.src = "img/plane.png";


/**
 * 整个游戏对象
 */
var GAME = {
  /**
   * 初始化函数,这个函数只执行一次
   * @param  {object} opts 
   * @return {[type]}      [description]
   */
  init: function(opts) {
    this.status = 'start';
    this.bindEvent();
  },
  bindEvent: function() {
    var self = this;
    var playBtn = document.querySelector('.js-play');
    // 开始游戏按钮绑定
    playBtn.onclick = function() {
      self.play();
      startGame();
      plane_move(plane);
      // plane = null;
      // monsters = [];
    };
    //进入下一关的事件绑定
    var nextLevel = document.querySelector(".js-next");
    nextLevel.onclick = function() {
      if(level<6) {level++;}
      self.play();
      startGame();
      plane_move(plane);
    }
    //重头玩游戏
    var replays = document.querySelectorAll('.js-replay');
    replays.forEach(function(replay){
      replay.onclick = function(){
      level = 1;
      deadMon = 0;
      self.play();
      startGame();
      plane_move(plane);
    };
    });

  },
  /**
   * 更新游戏状态，分别有以下几种状态：
   * start  游戏前
   * playing 游戏中
   * failed 游戏失败
   * success 游戏成功
   * stop 游戏暂停
   */
  setStatus: function(status) {
    this.status = status;
    container.setAttribute("data-status", status);
  },

  play: function() {
    this.setStatus('playing');
  },

  success:function(){
    this.setStatus('success');
    var p = document.querySelector(".game-next-level");
    if(p){
      var le = level+1;
      p.innerText = "下一个Level: "+le;
    }
  },

  failed:function(){
    this.setStatus("failed"); 
    var p = document.querySelector(".game-info-text");  
    if(p){
      p.innerText = "最终得分: "+deadMon;
    }
  },

  allSuccess:function(){
    this.setStatus("all-success");
  }
  
};
//定义怪物对象
function Monster(x,y){
    this.x = x;
    this.y = y;
    this.isSurvived = true;
    this.y_add = false;
    this.half_die = false;
    this.dead_line = 3;
}

Monster.prototype.toRight = [true];
Monster.prototype.yAdd = function(monsters){
  
  if(this.y_add){
    for(var m = 0;m<monsters.length;m++){
      monsters[m].y += 50;
      // console.log(this.y);
    }
    this.y_add = false;
  }
}
Monster.prototype.move = function() {
 
  if(this.toRight[0]){
    if(this.x<620){
      this.x += 2;
  }else{
      this.x += 2;
      this.toRight[0] = false;   
      this.y_add = true;
    }
  }else{
    if(this.x>30){
      this.x -= 2;
    }else{
      this.x += 2;
      this.toRight[0] = true;    
      this.y_add = true;
    }
  }
   // console.log(this);
}

//上半区动画
var animation = function(monsters,bullets){
  //碰撞消失
  for(var ms = 0;ms<monsters.length;ms++){
    for(var bs = 0;bs<bullets.length;bs++){
      if(bullets[bs].x > monsters[ms].x && bullets[bs].x < monsters[ms].x+50 && bullets[bs].y > monsters[ms].y && bullets[bs].y < monsters[ms].y+50&& monsters[ms].isSurvived){
        bullets.splice(bs,1);
        monsters[ms].half_die = true; 
        deadMon++;
        break;
      }else{
        console.log("出错啦！！！")
      }
    }
  }
  
  var len = monsters.length;
  // console.log(len);
  for(var i = 0;i<len;i++){

    if(monsters[i]){

      monsters[i].move();
      // console.log(monsters[i]);
      monsters[i].yAdd(monsters);
    }

  }
  //绘画得分
  context.clearRect(0,0,700,470);
  context.font = "18px arial";
  context.fillStyle = "white";
  context.fillText("得分:"+" "+deadMon,20,20);
  //画怪兽
  for(var h = 0;h<len;h++){
    
    if(monsters[h]){

      if(monsters[h].half_die){

        if(monsters[h].dead_line !== 0){
          context.drawImage(img_die,monsters[h].x,monsters[h].y,50,50);
          monsters[h].dead_line--;
        }else{

          monsters.splice(h,1);
          h--;
          continue;
        }
      }else{

        context.drawImage(img_mon,monsters[h].x,monsters[h].y,50,50);
      }
    }
  }
  //画子弹
  context.strokeStyle = "white";
  context.lineWidth = 2;
  if(bullets.length>0){

    for(var bu = 0;bu<bullets.length;bu++){
      
      if(bullets[bu]){

        if(bullets[bu].y<0){
         bullets[bu] = null;
         bullets.splice(bu,1);
         bu--;
         continue;
        } 

        bullets[bu].bulletDraw();
      }

    }
  }

  //游戏结束或通关
  var over = monsters.some(function(item){
    if(item.y>430)
      return true;
  });
  if(monsters.length>0 && !over) {

    requestAnimationFrame(function(){
        animation(monsters,bullets);
      });

  }else if(monsters.length === 0){
    context.clearRect(0,0,700,600);
    if(level == 6){
      GAME.allSuccess();

    }else{

      GAME.success();
    }


  }else if(monsters.length>0 && over){
    window.monsters = [];
    context.clearRect(0,0,700,600);
    GAME.failed();

  };
    
}
//飞机对象
function Plane(){
  this.x = 320;
  this.y = 470;
  this.toLeft = false;
  this.toRight = false;
  this.bullets = [];//子弹数组是要动态的，利用飞机的属性实现
}
Plane.prototype.moveToLeft = function(){
    if(this.x>30){
      this.x --;
    }
}
Plane.prototype.init = function(){
  context.drawImage(img_plane,this.x,this.y,60,100);
}
var plane_move = function(plane){
  context.clearRect(0,470,700,100);
  if(plane.toLeft){
    if(plane.x>30){
      plane.x -= 5; 
    } 
 }
  if(plane.toRight){
    if(plane.x<610){
      plane.x += 5;
      
    }
  }
  context.drawImage(img_plane,plane.x,plane.y,60,100);
 
  if(monsters.length>0){
   requestAnimationFrame(function(){plane_move(plane);});   
  }else{
    context.clearRect(0,470,700,100);
  }
  
}
Plane.prototype.createBui = function(){
  var bui = new Bullet(this.x+30);
  this.bullets.push(bui);
}

//飞机移动事件
document.addEventListener("keydown",function(e){
  var key = e.keyCode || e.which || e.charCode;
  switch(key){
    case 37:
      plane.toLeft = true;
     
    break;
    case 39:
      plane.toRight = true;
      break;
    case 32:
      plane.createBui();
      break;

    break;
    default:
    break;
  }
});
document.addEventListener("keyup",function(e){
  var key = e.keyCode || e.which || e.charCode;
  switch(key){
    case 37:
      plane.toLeft = false;
    break;
    case 39:
      plane.toRight = false;

    break;
    default:
    break;
  }
});

//子弹对象
function Bullet(x){
  this.x = x;
  this.y = 470;
}



Bullet.prototype.bulletDraw = function() {

  this.y -=10;
  context.beginPath();
  context.moveTo(this.x,this.y);
  context.lineTo(this.x,this.y+10);
  context.stroke();

}
// Monster.prototype.animation = function(){
//   self = this;
//   console.log(self);
//   self.move();
//   context.clearRect(0,0,700,600);
//   context.drawImage(img_mon,self.x,self.y,50,50);
//   if(self.y<470) requestAnimationFrame(function(){self.animation();});
// }
 
var startGame = function(){
  plane = new Plane();
  plane.init();
  var init_x = 30;
  var init_y = 30;
  if(level<2){
    for(var i = 0;i<7;i++,init_x +=60){

      var mon = new Monster(init_x,init_y);
      monsters.push(mon);
    }
    
  }else{
    for(var i = 0;i<level;i++,init_y += 50){
      for(var l = 0;l<7;l++,init_x += 60){
        var mon = new Monster(init_x,init_y);
        monsters.push(mon);
      }
      init_x = 30;
    }
  }
  
  animation(monsters,plane.bullets);
}


// 初始化
GAME.init();
