const STORAGE_KEY="leebacc_hsk_user_v3";

const hskData={
    1:Array.isArray(window.HSK1)?[...window.HSK1]:[],
    2:Array.isArray(window.HSK2)?[...window.HSK2]:[],
    3:Array.isArray(window.HSK3)?[...window.HSK3]:[]
};

const sentenceData=
    Array.isArray(window.CAU_HSK3)
    ? [...window.CAU_HSK3]
    : [];

const epnhuaData=
    Array.isArray(window.EPNHUA)
    ? [...window.EPNHUA]
    : [];

let currentUser=null;
let currentHSK=1;
let currentIndex=0;
let currentQuestion=null;
let wrongAttempts=0;
let answerShown=false;
let questionCompleted=false;
let lastQuestion=null;
let hasPreviousQuestion=false;
let nextTimer=null;
let correctCount=0;
let wrongCount=0;
let doneCount=0;
let selectedCourse=1;
let currentLearningType="hsk";

/* =====================================================
   STORAGE
===================================================== */

function getSavedUser(){
    try{
        const saved=localStorage.getItem(STORAGE_KEY);
        if(!saved)return null;
        return JSON.parse(saved);
    }catch(error){
        console.error(error);
        return null;
    }
}

function saveUser(){
    if(!currentUser)return;
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(currentUser)
    );
}

/* =====================================================
   HSK PROGRESS
===================================================== */

function createLevelProgress(level){
    const data=hskData[level]||[];

    return{
        order:data.map(function(item,index){
            return index;
        }),
        index:0,
        correct:0,
        wrong:0,
        done:0
    };
}

/* =====================================================
   SENTENCE PROGRESS
===================================================== */

function createSentenceProgress(){
    return{
        order:sentenceData.map(function(item,index){
            return index;
        }),
        index:0,
        correct:0,
        wrong:0,
        done:0
    };
}

/* =====================================================
   EPNHUA PROGRESS
===================================================== */

function createEpnhuaProgress(){
    return{
        order:epnhuaData.map(function(item,index){
            return index;
        }),
        index:0,
        correct:0,
        wrong:0,
        done:0
    };
}

function getEpnhuaProgress(){
    ensureUserData();
    return currentUser.epnhua;
}

/* =====================================================
   ENSURE DATA
===================================================== */

function ensureUserData(){
    if(!currentUser)return;

    if(!currentUser.hsk){
        currentUser.hsk={};
    }

    [1,2,3].forEach(function(level){
        if(
            !currentUser.hsk[level] ||
            !Array.isArray(currentUser.hsk[level].order)
        ){
            currentUser.hsk[level]=createLevelProgress(level);
        }
    });

    if(
        !currentUser.sentence ||
        !Array.isArray(currentUser.sentence.order)
    ){
        currentUser.sentence=createSentenceProgress();
    }

    if(
        !currentUser.epnhua ||
        !Array.isArray(currentUser.epnhua.order)
    ){
        currentUser.epnhua=createEpnhuaProgress();
    }

    if(!currentUser.lastCourse){
        currentUser.lastCourse=1;
    }

    if(!currentUser.lastHSK){
        currentUser.lastHSK=1;
    }
}

function getLevelProgress(level){
    ensureUserData();
    return currentUser.hsk[level];
}

function getSentenceProgress(){
    ensureUserData();
    return currentUser.sentence;
}

/* =====================================================
   SHUFFLE
===================================================== */

function shuffle(array){
    for(let i=array.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));

        const temp=array[i];
        array[i]=array[j];
        array[j]=temp;
    }
}

function createShuffledOrder(level){
    const data=hskData[level]||[];

    const order=data.map(function(item,index){
        return index;
    });

    shuffle(order);

    return order;
}

function createShuffledSentenceOrder(){
    const order=sentenceData.map(function(item,index){
        return index;
    });

    shuffle(order);

    return order;
}

function createShuffledEpnhuaOrder(){
    const order=epnhuaData.map(function(item,index){
        return index;
    });

    shuffle(order);

    return order;
}

function randomizeLevel(level){
    const progress=getLevelProgress(level);

    progress.order=createShuffledOrder(level);
    progress.index=0;

    return progress;
}

function randomizeSentence(){
    const progress=getSentenceProgress();

    progress.order=createShuffledSentenceOrder();
    progress.index=0;

    return progress;
}

function randomizeEpnhua(){
    const progress=getEpnhuaProgress();

    progress.order=createShuffledEpnhuaOrder();
    progress.index=0;

    return progress;
}

/* =====================================================
   CREATE USER
===================================================== */

function createUser(name){
    currentUser={
        name:name,
        lastHSK:1,
        lastCourse:1,

        hsk:{
            1:createLevelProgress(1),
            2:createLevelProgress(2),
            3:createLevelProgress(3)
        },

        sentence:createSentenceProgress(),
        epnhua:createEpnhuaProgress()
    };

    saveUser();
}

/* =====================================================
   NAME SCREEN
===================================================== */

function showNameScreen(){

    document.getElementById("nameScreen")
        .classList.remove("hidden");

    document.getElementById("learningArea")
        .classList.add("hidden");

    document.getElementById("selectionArea")
        .classList.add("hidden");

    document.getElementById("courseArea")
        .classList.add("hidden");

    document.getElementById("userArea")
        .classList.add("hidden");

    document.getElementById("headerUserName")
        .textContent="Luyện tiếng Trung";

    setTimeout(function(){
        document.getElementById("nameInput").focus();
    },100);
}

function startLearning(){

    const input=document.getElementById("nameInput");

    const name=input.value.trim();

    if(!name){
        input.focus();
        return;
    }

    createUser(name);

    document.getElementById("nameScreen")
        .classList.add("hidden");

    showSelection();
}

/* =====================================================
   CONTINUE SCREEN
===================================================== */

function showContinueScreen(){

    if(!currentUser){
        showNameScreen();
        return;
    }

    ensureUserData();

    const course=Number(currentUser.lastCourse)||1;

    let text="";

    if(course>=1&&course<=3){

        const level=Number(currentUser.lastHSK)||1;

        const progress=getLevelProgress(level);

        const total=hskData[level].length;

        text=
            "HSK "+level+
            " — Đã học "+
            progress.done+"/"+total+" câu";
    }

    else if(course===4){

        const progress=getSentenceProgress();

        text=
            "LUYỆN CÂU — Đã làm "+
            progress.done+"/"+sentenceData.length+" câu";
    }

    else if(course===5){

        const progress=getEpnhuaProgress();

        text=
            "ÉP NHỰA — Đã học "+
            progress.done+"/"+epnhuaData.length+" từ";
    }

    document.getElementById("userGreeting")
        .textContent=
        "👤 Xin chào, "+currentUser.name;

    document.getElementById("userProgress")
        .textContent=text;

    document.getElementById("userArea")
        .classList.remove("hidden");

    document.getElementById("learningArea")
        .classList.add("hidden");

    document.getElementById("selectionArea")
        .classList.add("hidden");

    document.getElementById("courseArea")
        .classList.add("hidden");

    document.getElementById("headerUserName")
        .textContent=
        "👤 "+currentUser.name;
}

/* =====================================================
   SELECTION
===================================================== */

function showSelection(){

    if(!currentUser){
        showNameScreen();
        return;
    }

    ensureUserData();

    document.getElementById("nameScreen")
        .classList.add("hidden");

    document.getElementById("userArea")
        .classList.add("hidden");

    document.getElementById("courseArea")
        .classList.add("hidden");

    document.getElementById("learningArea")
        .classList.add("hidden");

    document.getElementById("selectionArea")
        .classList.remove("hidden");

    document.getElementById("headerUserName")
        .textContent=
        "👤 "+currentUser.name;
}

/* =====================================================
   OPEN COURSE
===================================================== */

function openCourse(course){

    selectedCourse=Number(course);

    const icon=document.getElementById("courseIcon");
    const title=document.getElementById("courseTitle");
    const description=
        document.getElementById("courseDescription");

    if(selectedCourse===1){

        icon.textContent="📘";
        title.textContent="HSK 1";

        description.textContent=
            "Luyện viết chữ Hán HSK1 theo danh sách từ vựng.";
    }

    else if(selectedCourse===2){

        icon.textContent="📗";
        title.textContent="HSK 2";

        description.textContent=
            "Luyện viết chữ Hán HSK2 theo danh sách từ vựng.";
    }

    else if(selectedCourse===3){

        icon.textContent="📕";
        title.textContent="HSK 3";

        description.textContent=
            "Luyện viết chữ Hán HSK3 theo danh sách từ vựng.";
    }

    else if(selectedCourse===4){

        icon.textContent="✍️";
        title.textContent="LUYỆN CÂU";

        description.textContent=
            "Hiện tiếng Việt và tự nhập câu tiếng Trung bằng chữ Hán.";
    }

    else if(selectedCourse===5){

        icon.textContent="🏭";
        title.textContent="ÉP NHỰA";

        description.textContent=
            "Luyện viết 200 từ tiếng Trung thường gặp về máy ép nhựa, lỗi sản phẩm, thông số và xử lý sự cố.";
    }

    document.getElementById("selectionArea")
        .classList.add("hidden");

    document.getElementById("learningArea")
        .classList.add("hidden");

    document.getElementById("courseArea")
        .classList.remove("hidden");
}

/* =====================================================
   BACK
===================================================== */

function backToSelection(){

    if(nextTimer){
        clearTimeout(nextTimer);
        nextTimer=null;
    }

    showSelection();
}

function exitLearning(){

    if(nextTimer){
        clearTimeout(nextTimer);
        nextTimer=null;
    }

    saveCurrentProgress();

    showSelection();
}

/* =====================================================
   START SELECTED COURSE
===================================================== */

function startSelectedCourse(){

    if(selectedCourse===4){
        startSentencePractice();
        return;
    }

    if(selectedCourse===5){
        startEpnhuaPractice();
        return;
    }

    startHSKPractice(selectedCourse);
}

/* =====================================================
   START HSK
===================================================== */

function startHSKPractice(level){

    if(!currentUser)return;

    ensureUserData();

    currentLearningType="hsk";

    currentHSK=Number(level);

    currentIndex=0;

    randomizeLevel(currentHSK);

    const progress=getLevelProgress(currentHSK);

    correctCount=progress.correct||0;
    wrongCount=progress.wrong||0;
    doneCount=progress.done||0;

    currentUser.lastHSK=currentHSK;
    currentUser.lastCourse=currentHSK;

    saveUser();

    document.getElementById("courseArea")
        .classList.add("hidden");

    document.getElementById("selectionArea")
        .classList.add("hidden");

    document.getElementById("userArea")
        .classList.add("hidden");

    document.getElementById("learningArea")
        .classList.remove("hidden");

    document.getElementById("headerUserName")
        .textContent=
        "👤 "+currentUser.name;

    loadQuestion();
}

/* =====================================================
   START SENTENCE
===================================================== */

function startSentencePractice(){

    if(!currentUser)return;

    ensureUserData();

    currentLearningType="sentence";

    currentIndex=0;

    randomizeSentence();

    const progress=getSentenceProgress();

    correctCount=progress.correct||0;
    wrongCount=progress.wrong||0;
    doneCount=progress.done||0;

    currentUser.lastCourse=4;

    saveUser();

    document.getElementById("courseArea")
        .classList.add("hidden");

    document.getElementById("selectionArea")
        .classList.add("hidden");

    document.getElementById("userArea")
        .classList.add("hidden");

    document.getElementById("learningArea")
        .classList.remove("hidden");

    document.getElementById("headerUserName")
        .textContent=
        "👤 "+currentUser.name;

    loadSentenceQuestion();
}

/* =====================================================
   START EPNHUA
===================================================== */

function startEpnhuaPractice(){

    if(!currentUser)return;

    ensureUserData();

    if(!epnhuaData.length){
        alert("Không tải được dữ liệu epnhua.js!");
        return;
    }

    currentLearningType="epnhua";

    currentIndex=0;

    randomizeEpnhua();

    const progress=getEpnhuaProgress();

    correctCount=progress.correct||0;
    wrongCount=progress.wrong||0;
    doneCount=progress.done||0;

    currentUser.lastCourse=5;

    saveUser();

    document.getElementById("courseArea")
        .classList.add("hidden");

    document.getElementById("selectionArea")
        .classList.add("hidden");

    document.getElementById("userArea")
        .classList.add("hidden");

    document.getElementById("learningArea")
        .classList.remove("hidden");

    document.getElementById("headerUserName")
        .textContent=
        "👤 "+currentUser.name;

    loadEpnhuaQuestion();
}

/* =====================================================
   CONTINUE LEARNING
===================================================== */

function enterLearning(){

    if(!currentUser)return;

    ensureUserData();

    const course=Number(currentUser.lastCourse)||1;

    if(course===4){
        startSentencePractice();
        return;
    }

    if(course===5){
        startEpnhuaPractice();
        return;
    }

    let level=Number(currentUser.lastHSK)||1;

    if(level!==1&&level!==2&&level!==3){
        level=1;
    }

    startHSKPractice(level);
}

function continueLearning(){

    if(!currentUser){
        showNameScreen();
        return;
    }

    enterLearning();
}

function changeUser(){

    if(nextTimer){
        clearTimeout(nextTimer);
        nextTimer=null;
    }

    document.getElementById("nameInput").value="";

    showNameScreen();
}

/* =====================================================
   SELECT HSK
===================================================== */

function selectHSK(level){

    if(nextTimer){
        clearTimeout(nextTimer);
        nextTimer=null;
    }

    startHSKPractice(level);
}

/* =====================================================
   LOAD HSK
===================================================== */

function loadQuestion(){

    currentLearningType="hsk";

    const data=hskData[currentHSK];
    const progress=getLevelProgress(currentHSK);

    const input=document.getElementById("answerInput");
    const result=document.getElementById("result");
    const hint=document.getElementById("hint");

    wrongAttempts=0;
    answerShown=false;
    questionCompleted=false;

    input.value="";

    input.classList.remove(
        "input-correct",
        "input-wrong"
    );

    result.innerHTML="";
    result.className="result";

    hint.innerHTML="Sai 3 lần sẽ hiện đáp án.";

    if(!data||!data.length){

        document.getElementById("question")
            .textContent=
            "Không có dữ liệu HSK "+currentHSK;

        return;
    }

    if(!progress.order.length){
        progress.order=createShuffledOrder(currentHSK);
    }

    const realIndex=
        progress.order[
            currentIndex%progress.order.length
        ];

    const item=data[realIndex];

    currentQuestion={
        question:item[2],
        answer:item[0],
        pinyin:item[1]
    };

    document.getElementById("modeTitle")
        .textContent=
        "HSK "+currentHSK+" • LUYỆN VIẾT";

    document.getElementById("question")
        .textContent=
        currentQuestion.question;

    input.placeholder="Nhập chữ Hán...";

    updateProgress();
    updateStats();

    setTimeout(function(){
        input.focus();
    },50);
}

/* =====================================================
   LOAD SENTENCE
===================================================== */

function loadSentenceQuestion(){

    currentLearningType="sentence";

    const data=sentenceData;
    const progress=getSentenceProgress();

    const input=document.getElementById("answerInput");
    const result=document.getElementById("result");
    const hint=document.getElementById("hint");

    wrongAttempts=0;
    answerShown=false;
    questionCompleted=false;

    input.value="";

    input.classList.remove(
        "input-correct",
        "input-wrong"
    );

    result.innerHTML="";
    result.className="result";

    hint.innerHTML=
        "Nhập câu tiếng Trung bằng chữ Hán.";

    if(!data||!data.length){

        document.getElementById("question")
            .textContent=
            "Chưa có dữ liệu cauhsk3.js";

        return;
    }

    if(!progress.order.length){
        progress.order=createShuffledSentenceOrder();
    }

    const realIndex=
        progress.order[
            currentIndex%progress.order.length
        ];

    const item=data[realIndex];

    currentQuestion={
        question:item[0],
        answer:item[1],
        pinyin:""
    };

    document.getElementById("modeTitle")
        .textContent=
        "LUYỆN CÂU • HSK 3+";

    document.getElementById("question")
        .textContent=
        currentQuestion.question;

    input.placeholder=
        "Nhập câu tiếng Trung...";

    updateSentenceProgress();
    updateStats();

    setTimeout(function(){
        input.focus();
    },50);
}

/* =====================================================
   LOAD EPNHUA
===================================================== */

function loadEpnhuaQuestion(){

    currentLearningType="epnhua";

    const data=epnhuaData;
    const progress=getEpnhuaProgress();

    const input=document.getElementById("answerInput");
    const result=document.getElementById("result");
    const hint=document.getElementById("hint");

    wrongAttempts=0;
    answerShown=false;
    questionCompleted=false;

    input.value="";

    input.classList.remove(
        "input-correct",
        "input-wrong"
    );

    result.innerHTML="";
    result.className="result";

    hint.innerHTML="Sai 3 lần sẽ hiện đáp án.";

    if(!data||!data.length){

        document.getElementById("question")
            .textContent=
            "Không có dữ liệu epnhua.js";

        return;
    }

    if(!progress.order.length){
        progress.order=createShuffledEpnhuaOrder();
    }

    const realIndex=
        progress.order[
            currentIndex%progress.order.length
        ];

    const item=data[realIndex];

    currentQuestion={
        question:item[2],
        answer:item[0],
        pinyin:item[1]
    };

    document.getElementById("modeTitle")
        .textContent=
        "ÉP NHỰA • LUYỆN TỪ VỰNG";

    document.getElementById("question")
        .textContent=
        currentQuestion.question;

    input.placeholder=
        "Nhập từ tiếng Trung...";

    updateEpnhuaProgress();
    updateStats();

    setTimeout(function(){
        input.focus();
    },50);
}

/* =====================================================
   NORMALIZE
===================================================== */

function normalizeText(text){

    return String(text)
        .trim()
        .replace(/\s+/g,"")
        .replace(
            /[，。！？、,.!?;；:：'"“”‘’`]/g,
            ""
        );
}

/* =====================================================
   CHECK
===================================================== */

function checkAnswer(){

    if(!currentQuestion||questionCompleted)return;

    const input=document.getElementById("answerInput");

    const userAnswer=normalizeText(input.value);

    if(!userAnswer)return;

    const correctAnswer=
        normalizeText(currentQuestion.answer);

    if(userAnswer===correctAnswer){

        questionCompleted=true;

        correctCount++;
        doneCount++;

        input.classList.remove("input-wrong");
        input.classList.add("input-correct");

        const result=document.getElementById("result");

        result.className="result correct";

        if(currentLearningType==="sentence"){

            result.innerHTML=
                '<div class="answer">'+
                escapeHTML(currentQuestion.answer)+
                '</div>';

        }else{

            result.innerHTML=
                '<div class="answer">'+
                escapeHTML(currentQuestion.answer)+
                '</div>'+
                '<div class="answer-pinyin">'+
                escapeHTML(currentQuestion.pinyin)+
                '</div>';
        }

        saveLastQuestion();
        saveCurrentProgress();
        updateStats();

        nextTimer=setTimeout(function(){

            nextTimer=null;

            currentIndex++;

            saveCurrentProgress();

            if(currentLearningType==="sentence"){

                loadSentenceQuestion();

            }else if(currentLearningType==="epnhua"){

                loadEpnhuaQuestion();

            }else{

                loadQuestion();
            }

        },1500);

        return;
    }

    if(!answerShown){

        wrongAttempts++;
        wrongCount++;
    }

    input.classList.remove("input-correct");
    input.classList.add("input-wrong");

    saveCurrentProgress();
    updateStats();

    if(currentLearningType==="sentence"){

        if(wrongAttempts>=3&&!answerShown){

            answerShown=true;
            showSentenceAnswer();
        }

        return;
    }

    if(wrongAttempts===2){
        showPinyinInitials();
    }

    if(wrongAttempts>=3&&!answerShown){

        answerShown=true;
        showAnswerAfterThreeWrong();
    }
}

/* =====================================================
   ANSWERS
===================================================== */

function showSentenceAnswer(){

    const result=document.getElementById("result");

    result.className="result wrong";

    result.innerHTML=
        '<div class="answer">'+
        escapeHTML(currentQuestion.answer)+
        '</div>';

    document.getElementById("hint").innerHTML=
        "Hãy gõ lại đúng đáp án để tiếp tục.";
}

function showPinyinInitials(){

    const hint=document.getElementById("hint");

    const pinyin=
        String(currentQuestion.pinyin).trim();

    const initials=pinyin
        .split(/\s+/)
        .map(function(word){
            return word?word.charAt(0):"";
        })
        .join("");

    hint.innerHTML=
        "Gợi ý Pinyin: "+
        escapeHTML(initials);
}

function showAnswerAfterThreeWrong(){

    const result=document.getElementById("result");

    result.className="result wrong";

    result.innerHTML=
        '<div class="answer">'+
        escapeHTML(currentQuestion.answer)+
        '</div>'+
        '<div class="answer-pinyin">'+
        escapeHTML(currentQuestion.pinyin)+
        '</div>';

    document.getElementById("hint").innerHTML=
        "Hãy gõ lại đúng đáp án để tiếp tục.";
}

/* =====================================================
   LAST QUESTION
===================================================== */

function saveLastQuestion(){

    lastQuestion={
        question:currentQuestion.question,
        answer:currentQuestion.answer,
        pinyin:currentQuestion.pinyin
    };

    hasPreviousQuestion=true;
}

/* =====================================================
   PREVIOUS
===================================================== */

function showPreviousQuestion(){

    if(!hasPreviousQuestion||!lastQuestion){

        document.getElementById("hint").innerHTML=
            "Chưa có câu vừa làm.";

        return;
    }

    if(nextTimer){

        clearTimeout(nextTimer);
        nextTimer=null;
    }

    currentQuestion={
        question:lastQuestion.question,
        answer:lastQuestion.answer,
        pinyin:lastQuestion.pinyin
    };

    questionCompleted=true;
    answerShown=true;

    document.getElementById("question")
        .textContent=
        lastQuestion.question;

    const input=
        document.getElementById("answerInput");

    input.value="";

    input.classList.remove("input-wrong");
    input.classList.add("input-correct");

    const result=
        document.getElementById("result");

    result.className="result correct";

    if(currentLearningType==="sentence"){

        result.innerHTML=
            '<div class="answer">'+
            escapeHTML(lastQuestion.answer)+
            '</div>';

    }else{

        result.innerHTML=
            '<div class="answer">'+
            escapeHTML(lastQuestion.answer)+
            '</div>'+
            '<div class="answer-pinyin">'+
            escapeHTML(lastQuestion.pinyin)+
            '</div>';
    }

    document.getElementById("hint").innerHTML=
        "Đây là câu vừa làm.";
}

/* =====================================================
   SHUFFLE
===================================================== */

function shuffleCurrentLevel(){

    if(nextTimer){

        clearTimeout(nextTimer);
        nextTimer=null;
    }

    if(currentLearningType==="sentence"){

        randomizeSentence();

        currentIndex=0;

        saveCurrentProgress();

        loadSentenceQuestion();

        return;
    }

    if(currentLearningType==="epnhua"){

        randomizeEpnhua();

        currentIndex=0;

        saveCurrentProgress();

        loadEpnhuaQuestion();

        return;
    }

    randomizeLevel(currentHSK);

    currentIndex=0;

    saveCurrentProgress();

    loadQuestion();
}

/* =====================================================
   SAVE PROGRESS
===================================================== */

function saveCurrentProgress(){

    if(!currentUser)return;

    if(currentLearningType==="sentence"){

        const progress=getSentenceProgress();

        progress.index=currentIndex;
        progress.correct=correctCount;
        progress.wrong=wrongCount;
        progress.done=doneCount;

        currentUser.lastCourse=4;

        saveUser();

        return;
    }

    if(currentLearningType==="epnhua"){

        const progress=getEpnhuaProgress();

        progress.index=currentIndex;
        progress.correct=correctCount;
        progress.wrong=wrongCount;
        progress.done=doneCount;

        currentUser.lastCourse=5;

        saveUser();

        return;
    }

    const progress=getLevelProgress(currentHSK);

    progress.index=currentIndex;
    progress.correct=correctCount;
    progress.wrong=wrongCount;
    progress.done=doneCount;

    currentUser.lastHSK=currentHSK;
    currentUser.lastCourse=currentHSK;

    saveUser();
}

/* =====================================================
   STATS
===================================================== */

function updateStats(){

    document.getElementById("correctCount")
        .textContent=correctCount;

    document.getElementById("wrongCount")
        .textContent=wrongCount;

    document.getElementById("doneCount")
        .textContent=doneCount;

    let accuracy=0;

    if(doneCount>0){

        accuracy=Math.round(
            (correctCount/doneCount)*100
        );
    }

    document.getElementById("accuracy")
        .textContent=
        accuracy+"%";
}

/* =====================================================
   PROGRESS
===================================================== */

function setProgressPercent(position,total){

    if(!total){

        document.getElementById("progressFill")
            .style.width="0%";

        return;
    }

    const percent=((position+1)/total)*100;

    document.getElementById("progressFill")
        .style.width=
        percent+"%";
}

function updateProgress(){

    const data=hskData[currentHSK];

    if(!data||!data.length){

        setProgressPercent(0,0);

        return;
    }

    const position=
        currentIndex%data.length;

    setProgressPercent(
        position,
        data.length
    );
}

function updateSentenceProgress(){

    if(!sentenceData.length){

        setProgressPercent(0,0);

        return;
    }

    const position=
        currentIndex%sentenceData.length;

    setProgressPercent(
        position,
        sentenceData.length
    );
}

function updateEpnhuaProgress(){

    if(!epnhuaData.length){

        setProgressPercent(0,0);

        return;
    }

    const position=
        currentIndex%epnhuaData.length;

    setProgressPercent(
        position,
        epnhuaData.length
    );
}

/* =====================================================
   ESCAPE
===================================================== */

function escapeHTML(text){

    return String(text)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}

/* =====================================================
   ENTER CHECK
===================================================== */

document.getElementById("answerInput")
    .addEventListener(
        "keydown",
        function(event){

            if(event.key==="Enter"){

                event.preventDefault();

                checkAnswer();
            }
        }
    );

/* =====================================================
   ENTER START
===================================================== */

document.getElementById("nameInput")
    .addEventListener(
        "keydown",
        function(event){

            if(event.key==="Enter"){

                event.preventDefault();

                startLearning();
            }
        }
    );

/* =====================================================
   INIT
===================================================== */

(function init(){

    const savedUser=getSavedUser();

    if(!savedUser){

        showNameScreen();

        return;
    }

    currentUser=savedUser;

    ensureUserData();

    saveUser();

    showContinueScreen();

})();