var sceneManager, canvas;
var name, playing_time;
var score = 0;

function setup(){
    canvas = createCanvas(windowWidth,windowHeight);
    canvas.parent("canvas");
    sceneManager = new SceneManager();
    sceneManager.addScene(loginScene);
    sceneManager.addScene(playScene);
    sceneManager.addScene(endScene);
    sceneManager.showNextScene();
}

function draw(){
    sceneManager.draw();
}

function keyPressed(){
    sceneManager.handleEvent("keyPressed");
}

function touchMoved(){
    sceneManager.handleEvent("touchMoved");
}

//Scene:

function loginScene(){
    var bg;
    const NUM_BUBBLE = 30;
    const SIZE = [15, 30, 60];
    const OUT_SPACE = 30;
    const BORDER = [2,4,8];
    const SPEED = 3;
    var bubble_set = [];
    loginScene.prototype.setup = function(){
        bg = loadImage("res/bg.png");
        //Init bubbles:
        for (let i = 0; i < NUM_BUBBLE; i++){
            let x = Math.floor((Math.random() * windowWidth)) + 1;
            let y = Math.floor((Math.random() * windowHeight)) + 1;
            let size = Math.floor((Math.random() * 3));
            let vector_x =  Math.random() * 2 - 1;
            let vector_y =  Math.random() * 2 - 1;
            //Color:
            let r = Math.floor(Math.random() * 256);
            let g = Math.floor(Math.random() * 256);
            let b = Math.floor(Math.random() * 256);
            bubble_set.push([x,y,size,vector_x,vector_y,color(r,g,b)]);
        }
            //Set up button
            select("#btnPlay").touchStarted(tap);
            //Hide score and map elements:
            select("#score-panel").hide();
            select("#map-panel").hide();
    };

    loginScene.prototype.draw = function(){
        //Set background color
        background(bg);
        //Draw bubbles:
        for (let i = 0; i < bubble_set.length; i++){
            bubble_set[i][0] += bubble_set[i][3] * SPEED;    
            bubble_set[i][1] += bubble_set[i][4] * SPEED;
            if (bubble_set[i][0] < -SIZE[bubble_set[i][2]] - OUT_SPACE){
                bubble_set[i][0] = windowWidth + SIZE[bubble_set[i][2]];
            }
            if (bubble_set[i][0] > windowWidth + SIZE[bubble_set[i][2]] + OUT_SPACE){
                bubble_set[i][0] = -SIZE[bubble_set[i][2]];
            }
            if (bubble_set[i][1] < -SIZE[bubble_set[i][2]] - OUT_SPACE){
                bubble_set[i][1] = windowHeight + SIZE[bubble_set[i][2]];
            }
            if (bubble_set[i][1] > windowHeight + SIZE[bubble_set[i][2]] + OUT_SPACE){
                bubble_set[i][1] = -SIZE[bubble_set[i][2]];
            }
            stroke(bubble_set[i][5]);
            strokeWeight(BORDER[bubble_set[i][2]]);
            ellipse(bubble_set[i][0], bubble_set[i][1], SIZE[bubble_set[i][2]] * 2);
        }
    };
    
    loginScene.prototype.keyPressed = function(){
        if (keyCode == ENTER){
            //Play, same like tap
            name = select("#name-box").value();
            sceneManager.showNextScene();
        }
    }

    function tap(){
        // Play button pressed !
        name = select("#name-box").value();
        sceneManager.showNextScene();
    };
}

function playScene(){

    var bg;
    const OUT_SPACE = 30;
    const MAX_BULLET = 5;
    const NUM_PACKAGE = 2;

    var character, bubble = [], bullet = [], package = [];
    var num_bubble = 20;
    var remain_bullet;

    var first_time;
    var play_time;
    var bubble_gen; //After 7 seconds creating new generation
    var bullet_gen; //After 2 seconds creating new bullet

    //Audio
    var shoot_audio = new Audio("res/Shoot.wav");
    var explosion_audio = new Audio("res/Explosion.wav");
    var die_audio = new Audio("res/Die.wav");

    playScene.prototype.setup = function(){
        //Load background:
        bg = loadImage("res/bg.png");
        //Hide the login panel
        select(".overlay").hide();  
        //Show map and score panel
        select("#score-panel").show();
        select("#map-panel").show();

        //Init character
        character = new Character(windowWidth, windowHeight);
        character.init();
        //Init bubbles
        if (windowWidth <= 480) num_bubble = 10; //Mobile support
        for (let i = 0; i < num_bubble; i++){
            bubble.push(new Bubble(windowWidth, windowHeight));
            bubble[i].init();
        }

        //Init package
        for (let i = 0; i < NUM_PACKAGE; i++){
            package.push(new Package(windowWidth, windowHeight));
            package[package.length - 1].init();
        }
        
        //Init remain bullet:
        remain_bullet = MAX_BULLET;

        //Timing
        first_time = Date.now();
        play_time = first_time;

        //Generation
        bubble_gen = false;
        bullet_gen = false;

        //Phone tap
        select("#map-panel").touchStarted(phoneTouch);
    };

    playScene.prototype.draw = function(){

        //Timing:
        play_time = Date.now();
        playing_time = play_time - first_time;
        var timer = new Date(playing_time)
        let second = timer.getSeconds();

        //Generate new bubble after 7s
        if (second % 7 == 0){
            if (bubble_gen){
                bubble.push(new Bubble(windowWidth, windowHeight));
                bubble[bubble.length-1].init();
                bubble_gen = false;
            }
        }
        else{
            bubble_gen = true;
        }

        //Generate new bullet after 2s
        if (second % 2 == 0){
            if (bullet_gen){
                if (remain_bullet < MAX_BULLET){
                    remain_bullet++;
                }
                bullet_gen = false;
            }
        }
        else {
            bullet_gen = true;
        }

        background(bg);
        for (let i = 0; i < bubble.length; i++){
            bubble[i].update();
            bubble[i].render();
        }
        character.update();
        character.render();
        if (bullet.length > 0){
            for (let i = 0; i < bullet.length; i++){
                if (bullet[i].isDie()){
                    bullet.splice(i,1);
                    i--;
                }
                else {
                    bullet[i].update();
                    bullet[i].render();
                }
            }
        }

        for (let i = 0; i < NUM_PACKAGE; i++){
            package[i].update();
            package[i].render();
        }
        
        //If package hits character:
        for (let i = 0; i < NUM_PACKAGE; i++)
        {
            let da = Math.pow(character.getA()[0] - package[i].getPos()[0],2) 
                    + Math.pow(character.getA()[1] - package[i].getPos()[1],2);
            let db = Math.pow(character.getB()[0] - package[i].getPos()[0],2) 
                    + Math.pow(character.getB()[1] - package[i].getPos()[1],2);
            let dc = Math.pow(character.getC()[0] - package[i].getPos()[0],2) 
                    + Math.pow(character.getC()[1] - package[i].getPos()[1],2);
            let r = Math.pow(package[i].getSize(),2);
            if (da <= r || db <= r || dc <= r){
                //Hit a package
                remain_bullet = MAX_BULLET;
                package.splice(i,1);
                i--;
                package.push(new Package(windowWidth, windowHeight));
                package[package.length-1].init();
            }
        }

        //Check if bullets hit bubbles and character hits bubbles:
        for (let i = 0; i < bubble.length; i++){
            //Check character:
            {
                let da = Math.pow(character.getA()[0] - bubble[i].getCenter()[0],2) 
                    + Math.pow(character.getA()[1] - bubble[i].getCenter()[1],2);
                let db = Math.pow(character.getB()[0] - bubble[i].getCenter()[0],2) 
                    + Math.pow(character.getB()[1] - bubble[i].getCenter()[1],2);
                let dc = Math.pow(character.getC()[0] - bubble[i].getCenter()[0],2) 
                    + Math.pow(character.getC()[1] - bubble[i].getCenter()[1],2);
                let dCenter = Math.pow(character.getCenter()[0] - bubble[i].getCenter()[0],2) 
                            + Math.pow(character.getCenter()[1] - bubble[i].getCenter()[1],2);
                let r = Math.pow(bubble[i].getR(),2);
                if (da <= r || db <= r || dc <= r || dCenter <= r){
                    //Lose
                    die_audio.play();
                    sceneManager.showNextScene();
                }
            }
            //Check bullets:
            for (let j = 0; j < bullet.length; j++){
                let d = Math.pow(bullet[j].getCenter()[0] - bubble[i].getCenter()[0],2)
                 + Math.pow(bullet[j].getCenter()[1] - bubble[i].getCenter()[1],2);
                let r = Math.pow(bubble[i].getR() + bullet[j].getSize(),2);
                if (d <= r){
                    //Hit
                    explosion_audio.play();
                    score++;
                    bullet.splice(j,1);
                    j--;
                    if (bubble[i].getSize() > 0){
                        bubble.push(new Bubble(windowWidth, windowHeight));
                        bubble[bubble.length-1].init(bubble[i].getCenter()[0], bubble[i].getCenter()[1], 
                        bubble[i].getSize() - 1);
                        bubble.push(new Bubble(windowWidth, windowHeight));
                        bubble[bubble.length-1].init(bubble[i].getCenter()[0], bubble[i].getCenter()[1], 
                        bubble[i].getSize() - 1);
                    }
                    bubble.splice(i,1);
                    i--;
                    break;
                }
            }
        }

        //Make new bubble if the number is low:
        while (bubble.length < num_bubble){
            bubble.push(new Bubble(width, height));
            bubble[bubble.length-1].init();
        }

        select("#score").html("Điểm : "+score.toString());
        let bullet_string = "";
        for (let i = 0; i < remain_bullet; i++) bullet_string += "&#8226 ";
        select("#remain-bullet").html(bullet_string);
    };

    playScene.prototype.keyPressed = function(){
        if (keyCode == LEFT_ARROW || keyCode == 65){
            character.setStatus("LEFT");
        }
        else if (keyCode == RIGHT_ARROW || keyCode == 68){
            character.setStatus("RIGHT");
        }
        else if (keyCode == UP_ARROW || keyCode == 87){
            character.setStatus("UP");
        }
        else if (keyCode == DOWN_ARROW || keyCode == 83){
            character.setStatus("DOWN");
        }
        else if (keyCode == 32){ 
            //Shooting
            if (remain_bullet > 0){
                shoot_audio.play();
                remain_bullet--;
                bullet.push(new Bullet(windowWidth, windowHeight));
                bullet[bullet.length - 1].init(
                    character.getCenter()[0], character.getCenter()[1],
                    character.getHead()[0], character.getHead()[1]);
            }
        }
        else {

        }
    };

    playScene.prototype.touchMoved = function(){
        //Mobile touch
        let dtX = pmouseX - mouseX;
        let dtY = pmouseY - mouseY;
        let d = Math.pow(dtX,2)+Math.pow(dtY,2);
        let d0 = Math.pow(dtX,2);
        let cosin = d0/d;
        if (dtX > 0){
            //Left side
            if (dtY < 0){
                //Left or down side
                if (Math.acos(cosin) <= Math.PI / 4){
                    //Left:
                    character.setStatus("LEFT");
                }
                else {
                    //Down
                    character.setStatus("DOWN");
                }
            }
            else {
                //Left or up side
                if (Math.acos(cosin) <= Math.PI / 4){
                    //Left:
                    character.setStatus("LEFT");
                }
                else {
                    //Up
                    character.setStatus("UP");
                }
            }
        }
        else {
            //Right side
            if (dtY < 0){
                //Right or down side
                if (Math.acos(cosin) <= Math.PI / 4){
                    //Right:
                    character.setStatus("RIGHT");
                }
                else {
                    //Down
                    character.setStatus("DOWN");
                }
            }
            else {
                //Right or Up side
                if (Math.acos(cosin) <= Math.PI / 4){
                    //Right:
                    character.setStatus("RIGHT");
                }
                else {
                    //Up
                    character.setStatus("UP");
                }
            }
        }
    };

    function phoneTouch(){
        //Shooting
        if (remain_bullet > 0){
            shoot_audio.play();
            remain_bullet--;
            bullet.push(new Bullet(windowWidth, windowHeight));
            bullet[bullet.length - 1].init(
                character.getCenter()[0], character.getCenter()[1],
                character.getHead()[0], character.getHead()[1]);
        }
    }

    function Character(winWidth, winHeight){

        //Constructor:
        this.winWidth = winWidth;
        this.winHeight = winHeight;

        var ROTATE_SPEED = 0.01;
        var CHAR_SPEED = 3;
        var CHAR_SIZE = 20;
        const CHAR_COLOR = "#468499"; //Blue
        var char = [], status = "STATIC";
        var ax,ay,bx,by,cx,cy;

        this.init = function(){
            //Init character
            char.push(winWidth / 2);
            char.push(winHeight / 2);
            char.push(0); //Corner

            //Mobile support:
            if (winWidth <= 480){
                CHAR_SIZE = 15;
                CHAR_SPEED = 2;
            }
        };

        this.update = function(){
            //Draw character:
            //Move character:
            if (char[0] < -OUT_SPACE - CHAR_SIZE) char[0] = winWidth + CHAR_SIZE;
            if (char[1] < -OUT_SPACE - CHAR_SIZE) char[1] = winHeight + CHAR_SIZE;
            if (char[0] > winWidth + OUT_SPACE) char[0] = -OUT_SPACE - CHAR_SIZE;
            if (char[1] > winHeight + OUT_SPACE) char[1] = -OUT_SPACE - CHAR_SIZE;
            switch (status){
                case "LEFT":
                    char[0] -= CHAR_SPEED;
                    break;
                case "RIGHT":
                    char[0] += CHAR_SPEED;
                    break;
                case "UP":
                    char[1] -= CHAR_SPEED;
                    break;
                case "DOWN":
                    char[1] += CHAR_SPEED;
                    break;
                default:
                    break;
            }
            //Rotate character:
            char[2] += Math.PI * ROTATE_SPEED;
            if (char[2] >= 2*Math.PI) char[2] -= 2*Math.PI;
            ax = char[0] + CHAR_SIZE * Math.sin(char[2]);
            ay = char[1] - CHAR_SIZE * Math.cos(char[2]);
            bx = char[0] + CHAR_SIZE * Math.sin(char[2] + 2*Math.PI/3);
            by = char[1] - CHAR_SIZE * Math.cos(char[2] + 2*Math.PI/3);
            cx = char[0] + CHAR_SIZE * Math.sin(char[2] + 4*Math.PI/3);
            cy = char[1] - CHAR_SIZE * Math.cos(char[2] + 4*Math.PI/3);
        };

        this.render = function(){
            noStroke();
            fill(CHAR_COLOR);
            triangle(ax,ay,bx,by,cx,cy);
            //Draw bullet pot:
            fill("#FF0000");
            ellipse(ax, ay, 10);
            //Draw name:
            fill("black");
            textSize(20);
            text(name, char[0], char[1] - 40);
            //Return color and stroke
            fill(255); //White
            stroke(0); //Black
        };

        this.getCenter = function(){ return char;};
        this.getHead = function(){ return [ax,ay];};
        this.setStatus = function(stt){status = stt;}
        this.getStatus = function(){ return status;}

        this.getA = function(){return [ax,ay];};
        this.getB = function(){return [bx,by];};
        this.getC = function(){return [cx,cy];};
    };

    function Bullet(winWidth, winHeight){

        //Constructor:
        this.winWidth = winWidth;
        this.windowHeight = winHeight;

        const BULLET_COLOR = "#FF0000"; //Red
        var BULLET_SIZE = 10;
        const BULLET_SPEED = 0.3;
        var vector = [], pos = [], die = false;

        this.init = function(ox, oy, x, y){
            pos.push(x); pos.push(y);
            vector.push(x-ox);
            vector.push(y-oy);
            if (winWidth <= 480) BULLET_SIZE = 5; //Mobile support
        };

        this.update = function(){
            //If bullet is out
            if (pos[0] < -OUT_SPACE || pos[1] < -OUT_SPACE
                || pos[0] > winWidth + OUT_SPACE 
                || pos[1] > winHeight + OUT_SPACE){
                    //Bullet's out
                    die = true;
                }
            else {
                pos[0] += vector[0] * BULLET_SPEED;
                pos[1] += vector[1] * BULLET_SPEED;
            }
        };

        this.render = function(){
            noStroke();
            fill(BULLET_COLOR);
            ellipse(pos[0], pos[1], BULLET_SIZE);
            //Return color:
            fill(255); //White
            stroke(0); //Black
        };

        this.isDie = function(){return die;};
        this.getCenter = function(){ return pos;};
        this.getSize = function(){ return BULLET_SIZE;};
        this.die = function(){ die = true;};
    };

    function Bubble(winWidth, winHeight){
        //Constructor:
        this.winWidth = winWidth;
        this.winHeight = winHeight;

        var SIZE = [12, 24, 48];
        const BORDER_SIZE = [2,4,8];
        var SPEED = 2.75;
        var bubble_color;

        var pos = [], vector = [], size;

        this.init = function(px = 0, py = 0, psize = -1){
            
            if (psize == -1) size = Math.floor(Math.random() * 3);
            else {
                size = psize;
            }
            vector.push(Math.random() * 2 - 1);
            vector.push(Math.random() * 2 - 1);

            //Pos
            if (px == 0){
                if (vector[0] < 0) pos.push(-OUT_SPACE);
                else pos.push(winWidth + OUT_SPACE);
            } 
            else {
                pos.push(px);
            }
            if (py == 0){
                pos.push(winHeight/2);
            } 
            else {
                pos.push(py);
            }
            //Color random:
            let r = Math.floor(Math.random() * 256);
            let g = Math.floor(Math.random() * 256);
            let b = Math.floor(Math.random() * 256);
            bubble_color = color(r,g,b);
            //Mobile support:
            if (winWidth <= 480){
                SIZE = [6,12,24];
                SPEED = 1.85;
            }
        };

        this.update = function(){
            pos[0] += vector[0] * SPEED;    
            pos[1] += vector[1] * SPEED;
            // If bubble's out of screen
            if (pos[0] < -SIZE[size] - OUT_SPACE){
                pos[0] = winWidth + SIZE[size];
            }
            if (pos[0] > winWidth + SIZE[size] + OUT_SPACE){
                pos[0] = -SIZE[size];
            }
            if (pos[1] < -SIZE[size] - OUT_SPACE){
                pos[1] = winHeight + SIZE[size];
            }
            if (pos[1] > winHeight + SIZE[size] + OUT_SPACE){
                pos[1] = -SIZE[size];
            }
        };

        this.render = function(){
            stroke(bubble_color);
            strokeWeight(BORDER_SIZE[size]);
            fill(255); //White
            ellipse(pos[0], pos[1], SIZE[size] * 2);
            //Return color and stroke
            stroke(0);
            fill(255);
        };

        this.getCenter = function(){return pos;};
        this.getR = function(){ return SIZE[size];}; 
        this.getSize = function(){ return size;};
    };

    function Package(winWidth, winHeight){

        //Constructor:
        this.winWidth = winWidth;
        this.winHeight = winHeight;

        const SIZE = 20;
        const COLOR = "#87CEFA";
        const SPEED = 3;

        var pos = [], vector = [];

        this.init = function(){
            vector.push(Math.random() * 2 - 1);
            vector.push(Math.random() * 2 - 1);
            //Pos
            if (vector[0] < 0) pos.push(-OUT_SPACE);
            else pos.push(winWidth + OUT_SPACE);
            pos.push(winHeight/2);
        };

        this.update = function(){
            pos[0] += vector[0] * SPEED;    
            pos[1] += vector[1] * SPEED;
            // If bubble's out of screen
            if (pos[0] < -SIZE - OUT_SPACE){
                pos[0] = winWidth + SIZE;
            }
            if (pos[0] > winWidth + SIZE + OUT_SPACE){
                pos[0] = -SIZE;
            }
            if (pos[1] < -SIZE - OUT_SPACE){
                pos[1] = winHeight + SIZE;
            }
            if (pos[1] > winHeight + SIZE + OUT_SPACE){
                pos[1] = -SIZE;
            }
        };

        this.render = function(){
            noStroke();
            fill(COLOR);
            rect(pos[0], pos[1], SIZE, SIZE);
            //Return
            stroke(0); //Black
            fill(255);
        };

        this.getPos = function(){return pos;};
        this.getSize = function(){return SIZE;};
    }
}

function endScene(){

    endScene.prototype.setup = function(){

        select(".overlay").show();
        select("#score-panel").hide();
        select(".title").html("GAME OVER !");
        select(".tip").hide();
        select("#name-box").hide();
        select("#btnPlay").html("Chơi tiếp");
        
        let name_text = createDiv("<b>Tên nhân vật :</b> "+name.toString());
        name_text.parent("#info-form");
        name_text.class("form-text");

        let score_text = createDiv("<b>Điểm số :</b> "+score.toString());
        score_text.parent("#info-form");
        score_text.class("form-text");

        let timer = new Date(playing_time);
        let minute = timer.getMinutes().toString();
        let second = (timer.getSeconds() < 10) ? "0"+timer.getSeconds().toString():timer.getSeconds().toString();
        let time_text = createDiv("<b>Thời gian sống :</b> "+minute+":"+second);
        time_text.parent("#info-form");
        time_text.class("form-text");

        //Button event:
        select("#btnPlay").touchStarted(tap);
    };

    endScene.prototype.keyPressed = function(){
        if (keyCode == ENTER){
            //Reload, same like tap
            location.reload();
        }
    }

    function tap(){
        location.reload();
    }
}