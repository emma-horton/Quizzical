// declare global varaibles 
var nextQuestion = 0;
var incorrect_question = 0;
var halfWrongAnsUsed = false;
var bestScore = 0;
var paused = false;
var pauseUsed = false;
var players = [];
var selectedDifficulty = 'any';
var currentQuestionActive = false;

var User = function(username, score) {
    this.username = username;
    this.score = score;
}

// COPIED FROM WEEK 3 LECTURE ON CLOSURES 
function makeCounter() {
    let count = 0;
    return {
        getCount: function() { return count; },
        increment: function(by = 1) { count += by; },
        reset: function() { count = 0; }
    };
}
// Track the numbers of questions a player has answered correctly and incorrectly with the game
var incorrect_count = makeCounter();
var correct_count = makeCounter();

// Prevent the same question coming up more than once (unless the page is reloaded). 
function getSessionToken() {
    fetch('https://opentdb.com/api_token.php?command=request')
    .then(response => response.json())
    .then(tokenResponse => {
        let sessionToken = tokenResponse.token;
        console.log(tokenResponse)
        fetchData(sessionToken);
    })
    .catch(error => console.error('Error fetching session token:', error));
}
// fetch question 
function fetchData(sessionToken) {
    const url = `https://opentdb.com/api.php?amount=10&token=${sessionToken}`;
    console.log(url)
    fetch(url)
    .then(response => response.json())
    .then(dat => {
        data = dat.results;
        console.log(data)
        //loadQuestion(data, 0)
        document.getElementById("catagory").innerHTML = '';
        getBonusCatagories()
    })
    .catch(function(error) {
        console.log(error)
    })
}

// Repeatedly present the user with multiple choice questions obtained from the API 
// allow them to select an answer. If using the Open Trivial DB API 
// answers should be presented in a random order.
function loadQuestion(data, nextQuestion, halfWrongAnsUsed = false) {
    console.log(nextQuestion);
    let dat = data[nextQuestion]
    let wrongAns = dat.incorrect_answers
    document.getElementById('question').innerHTML = dat.question;
    if (halfWrongAnsUsed === true) {
        var half_length = Math.ceil(wrongAns.length / 2);
        wrongAns = wrongAns.slice(0,half_length);
    }
    let answers = wrongAns.concat([dat.correct_answer]);
    answers.sort()
    console.log(answers);
    for (let i = 0; i<answers.length;i++){
        const newButton = document.createElement('button');
        newButton.textContent = answers[i];
        newButton.id = 'answerBtn' + i;
        newButton.addEventListener('click', function() {
            checkAnswer(answers[i], dat.correct_answer, dat.difficulty, dat.category)
        });
        let container = document.getElementById('button-list');
        container.appendChild(newButton);
    }  
    countDown();
    if (dat.category === selectedCatagory){
        alert('Bonus Round!!')
    }
    console.log(nextQuestion)
}

function checkAnswer(selectedAnswer, correctAnswer, difficulty, category) {
    let mark = calculateMark(difficulty);
    console.log(difficulty);
    if (selectedAnswer === correctAnswer) {
        let bonus = category === selectedCatagory ? 2 : 1;
        correct_count.increment(mark * bonus); // Increment by calculated mark * bonus
        alert('Bonus Score!');
    } else {
        incorrect_count.increment(mark);
        incorrect_question++;
    }
    document.getElementById('correct').innerHTML = 'Correct: ' + correct_count.getCount();
    document.getElementById('incorrect').innerHTML = 'Incorrect: ' + incorrect_count.getCount();

    // Finish the game appropriately when a player answers three questions incorrectly (i.e. the player loses the game and gets 0 score).
    if (incorrect_question > 2) {
        loseGame();
    }
    if (!currentQuestionActive) { // Only move to the next question if we're not currently handling a half-wrong situation
        getNextQuestion();
    } else {
        currentQuestionActive = false;
    }
}

// Assign the player a score based on the difficulty of the question (e.g. easy = 1; medium = 2; hard = 3). Use this to calculate the player's score.
function calculateMark(difficulty) {
    if (difficulty === 'hard'){
        return 3
    }else if (difficulty === 'medium') {
        return 2
    }else if (difficulty === 'easy') {
        return 1
    } else {
        return 0
    }
}

// Keep track of the player's best score and display it alongside their current score.
function keepBestScore() {
    bestScore = Math.max(bestScore, correct_count);
    console.log(bestScore);
}

// Allow the player to request half of the wrong answers be removed for a question, leaving them with the correct answer and any remaining wrong answers. Only allow this once per game.
function halfWrongAns() {
    if (halfWrongAnsUsed === true){
        return alert('You have already used this function in this game. Please wait until the next game to use again')
    }
    halfWrongAnsUsed = true;
    currentQuestionActive = true;
    document.getElementById('button-list').innerHTML = '';
    loadQuestion(data, nextQuestion, true)
}

function getNextQuestion(){
    if (selectedDifficulty === 'any'){
        nextQuestion++;
    }else {
        nextQuestion = getQuestionDifficulty();
    }
    document.getElementById('button-list').innerHTML = '';
    loadQuestion(data, nextQuestion);
}

// Finish the game appropriately when a player chooses to stop (i.e. the player 'wins' and gets a score equal to the number of questions they answered correctly).
function endGame(){
    document.getElementById("GameOver").style.display = "block"
    document.getElementById("webpage").style.display = "none"
    document.getElementById('game-outcome').innerHTML = 'You Win';
    document.getElementById('result').innerHTML = 'Score ' + correct_count.getCount();
    document.getElementById("welcome-page").style.display ="block"
    document.getElementById("welcome-line").style.display = "Want to try again?";
    score = correct_count.getCount();
    keepBestScore();
    saveUserInfo();
}

function loseGame(){
    document.getElementById("GameOver").style.display = "block"
    document.getElementById("webpage").style.display = "none"
    document.getElementById('game-outcome').innerHTML = 'You Lose';
    document.getElementById('result').innerHTML = 'Score: 0';
    document.getElementById("welcome-page").style.display ="block"
    document.getElementById("welcome-line").style.display = "Want to try again?";
    score = 0;
    keepBestScore();
    saveUserInfo();
}

// After a game has finished, allow a player to start a new game without reloading the page
function startScreen(){
    username = document.getElementById("username").value;
    document.getElementById("webpage").style.display ="block"
    document.getElementById("GameOver").style.display ="none"
    document.getElementById("welcome-page").style.display ="none"
    document.getElementById("catagory").style.display =""
    incorrect_count.reset();
    correct_count.reset();
    incorrect_question = 0;
    halfWrongAnsUsed = false;
    pauseUsed = false;
    currentQuestionActive = false;
    document.getElementById('button-list').innerHTML = '';
    document.getElementById('correct').innerHTML = 'Correct ' + correct_count.getCount();
    document.getElementById('incorrect').innerHTML = 'Incorrect ' + incorrect_count.getCount();
    document.getElementById('best-score').innerHTML = 'Best score ' + bestScore;
    getSessionToken();
    loadQuestion(data, 0);
}

// Provide a countdown clock limiting the time available to answer a question. If the time runs out, the player is deemed to have got the answer wrong.
function countDown() {
    var countdownTime = 10;
    if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
    }
    window.countdownInterval = setInterval(function() {
    if (!paused) {
        countdownTime--;
        document.getElementById('countdown').innerHTML = countdownTime;
        if (countdownTime <= 0) {
            clearInterval(countdownInterval);
            document.getElementById('countdown').innerHTML ='EXPIRED';
            handleTimeOut();
        }
    }
    },1000);
    return window.countdownInterval;
}

function handleTimeOut() {
    incorrect_count.increment();
    document.getElementById('incorrect').innerHTML = 'Incorrect: ' + incorrect_count.getCount();
}

// Allow the player to pause the timer for a question for 1 minute so they can try to find the answer. Only allow this once per game
function togglePause() {
    if (!pauseUsed && !paused) { 
        paused = true;
        pauseUsed = true; 
        document.getElementById('pause-button').textContent = 'Resume in 60s';
        setTimeout(function() {
            if (paused) { 
                paused = false;
                document.getElementById('pause-button').textContent = 'Pause';
                countDown(); 
            }
        }, 60000); 
    } else if (paused) { 
        paused = false;
        document.getElementById('pause-button').textContent = 'Pause';
    }
}

// At the start of each game, present the user with four randomly selected categories and allow them to choose one as their `bonus' category.
function getBonusCatagories() {
    //document.getElementById("catagory").innerHTML = '';
    let catagoriesSet = new Set();
    for (let i = 0; i < data.length; i++) {
        catagoriesSet.add(data[i].category);
    }
    let catagories = Array.from(catagoriesSet)
    for (let i = 0; i < 4; i++) {
        var x = document.getElementById("catagory");
        var option = document.createElement("option");
        option.value = catagories[i];
        option.text = catagories[i];
        x.add(option);
    }
    let selectedElement = document.getElementById('catagory');
    selectedElement.addEventListener('change', function() {
        selectedCatagory = selectedElement.value;
        console.log('User selected ' + selectedCatagory)
    });
}

// Allow the user to choose the difficulty of their next question (easy, medium, or hard).
function chooseQuestionDifficulty() {
    let selectedElement = document.getElementById('choose-difficulty');
    selectedDifficulty= selectedElement.value;
    console.log('User selected ' + selectedDifficulty)
}

function getQuestionDifficulty() {
    getSessionToken();
    console.log(data);
    for (let i=0; i< data.length; i++){
        if (data[i].difficulty === selectedDifficulty){
            console.log(i)
            return i;
        }
    }
}

function saveUserInfo() {
    var user = new User(username, score);
    players.push(user);
    console.log(players)
    document.getElementById('leaderboard').innerHTML = '';
    displayLeaderboard();
}

// Track the top ten scores, and the names of the players who achieved them. After each game, display the names and scores in a leader board.
function displayLeaderboard() {
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    const username = document.createElement('th');
    username.innerText = 'Username';
    const score = document.createElement('th');
    score.innerText = 'Score';
    tr.append(username,score);
    thead.appendChild(tr);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    let sortedPlayers = players.sort((a,b) => b.score - a.score);
    sortedPlayers.splice(10);

    for (let i = 0; i < sortedPlayers.length; i++) {
        player = sortedPlayers[i];
        const tr = document.createElement('tr');

        const tdUsername = document.createElement('td');
        tdUsername.innerText = player.username;
        tr.appendChild(tdUsername)
        tbody.appendChild(tr);

        const tdScore = document.createElement('td');
        tdScore.innerText = player.score;
        tr.appendChild(tdScore)
        tbody.appendChild(tr);
    }
    // display table
    leaderboard = document.getElementById('leaderboard')
    leaderboard.innerText = '';
    leaderboard.appendChild(table);
}

getSessionToken();