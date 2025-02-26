/*
【英文生成プロンプト仕様（コメント）】
あなたは英単語暗記アプリの問題生成エンジンです。以下の指示に従い、入力された各対象単語について、最終出力結果（JSON形式）を一発で出力してください。
出力には以下の情報を含むこと：
- 単語ID（id）
- 対象単語（word）
- 意味（meaning）
- 例文（example）
- 例文内の各単語とその意味（wordMeanings）
...（以下、仕様詳細は省略）
*/

document.addEventListener('DOMContentLoaded', () => {
  let allWords = [];         // 全単語データ
  let filteredWords = [];    // 出題対象（TF情報により正解済みを除外）
  let currentIndex = 0;
  let currentWord = null;
  let currentAnswer = null;  // ユーザーの回答：true（「わかった」）または false（「わからなかった」）
  let tfInfo = {};           // { id: true/false } 単語のTF情報

  // ローカルストレージからTF情報を取得
  const storedTF = localStorage.getItem('wordTF');
  if (storedTF) {
    tfInfo = JSON.parse(storedTF);
  }

  const startScreen = document.getElementById('start-screen');
  const wordScreen = document.getElementById('word-screen');
  const endScreen = document.getElementById('end-screen');

  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');

  const rangeStartInput = document.getElementById('range-start');
  const rangeEndInput = document.getElementById('range-end');
  const modeInputs = document.getElementsByName('mode');

  const exampleSentenceElem = document.getElementById('example-sentence');
  const hintElem = document.getElementById('hint');
  const meaningElem = document.getElementById('meaning');
  const thinkingFlowElem = document.getElementById('thinkingFlow');

  const hintBtn = document.getElementById('hint-btn');
  const gotitBtn = document.getElementById('gotit-btn');
  const dontknowBtn = document.getElementById('dontknow-btn');
  const wrongBtn = document.getElementById('wrong-btn');
  const nextBtn = document.getElementById('next-btn');

  const answerSection = document.getElementById('answer-section');
  const afterAnswerButtons = document.getElementById('after-answer-buttons');

  // 単語データを "ta-get1900.json" から読み込み
  fetch('ta-get1900.json')
    .then(response => response.json())
    .then(data => {
      // 各単語にIDを付与（1から始まる）
      allWords = data.map((wordObj, index) => {
        wordObj.id = index + 1;
        return wordObj;
      });
    })
    .catch(error => console.error('Error loading words:', error));

  // スタートボタン押下時
  startBtn.addEventListener('click', () => {
    let rangeStart = parseInt(rangeStartInput.value);
    let rangeEnd = parseInt(rangeEndInput.value);
    if (isNaN(rangeStart) || isNaN(rangeEnd) || rangeStart < 1 || rangeEnd < rangeStart) {
      alert('正しい出題範囲を入力してください。');
      return;
    }
    // 選択モード取得（sequential または random）
    let selectedMode = 'sequential';
    for (let modeInput of modeInputs) {
      if (modeInput.checked) {
        selectedMode = modeInput.value;
        break;
      }
    }
    // 指定範囲の単語抽出（インデックスは0始まり）
    filteredWords = allWords.slice(rangeStart - 1, rangeEnd);
    // すでに正解済み（TF情報がtrue）の単語を除外
    filteredWords = filteredWords.filter(wordObj => {
      return !(tfInfo[wordObj.id] === true);
    });
    // ランダムモードの場合はシャッフル
    if (selectedMode === 'random') {
      filteredWords.sort(() => Math.random() - 0.5);
    }
    if (filteredWords.length === 0) {
      alert('出題対象の単語がありません。');
      return;
    }
    currentIndex = 0;
    startScreen.style.display = 'none';
    wordScreen.style.display = 'block';
    showNextWord();
  });

  restartBtn.addEventListener('click', () => {
    startScreen.style.display = 'block';
    endScreen.style.display = 'none';
    wordScreen.style.display = 'none';
  });

  // 次の単語を表示
  function showNextWord() {
    if (currentIndex >= filteredWords.length) {
      wordScreen.style.display = 'none';
      endScreen.style.display = 'block';
      return;
    }
    currentWord = filteredWords[currentIndex];
    currentAnswer = null;
    // 表示リセット
    exampleSentenceElem.textContent = currentWord.example;
    hintElem.textContent = "";
    meaningElem.textContent = "";
    thinkingFlowElem.textContent = "";
    answerSection.style.display = 'none';
    afterAnswerButtons.style.display = 'none';
    // 初期ボタン（「ヒントを見る」「わかった」）を表示
    hintBtn.style.display = 'inline-block';
    gotitBtn.style.display = 'inline-block';
    dontknowBtn.style.display = 'none';
  }

  // 「ヒントを見る」ボタン：対象単語以外の例文中の単語の意味（ここではダミーテキスト）を表示
  hintBtn.addEventListener('click', () => {
    hintElem.textContent = "ヒント: 例文中の対象単語以外の単語の意味はここに表示されます。";
    answerSection.style.display = 'block';
    // ヒントを見た後、対象単語の意味を知るため「わからない」ボタンを表示
    dontknowBtn.style.display = 'inline-block';
  });

  // 「わかった」ボタン：即座にヒントと対象単語の意味・説明を表示
  gotitBtn.addEventListener('click', () => {
    currentAnswer = true;
    hintElem.textContent = "ヒント: 例文中の対象単語以外の単語の意味はここに表示されます。";
    meaningElem.textContent = "意味: " + currentWord.meaning;
    thinkingFlowElem.textContent = currentWord.thinkingFlow;
    answerSection.style.display = 'block';
    // 初期ボタン群を非表示
    hintBtn.style.display = 'none';
    gotitBtn.style.display = 'none';
    dontknowBtn.style.display = 'none';
    // 回答後の最終選択ボタンを表示
    afterAnswerButtons.style.display = 'block';
  });

  // 「わからない」ボタン：対象単語の意味・説明を表示（ヒント後に選択）
  dontknowBtn.addEventListener('click', () => {
    currentAnswer = false;
    meaningElem.textContent = "意味: " + currentWord.meaning;
    thinkingFlowElem.textContent = currentWord.thinkingFlow;
    answerSection.style.display = 'block';
    hintBtn.style.display = 'none';
    gotitBtn.style.display = 'none';
    dontknowBtn.style.display = 'none';
    afterAnswerButtons.style.display = 'block';
  });

  // 回答後の「わからなかった」ボタン：その単語のTF情報を false として保存
  wrongBtn.addEventListener('click', () => {
    currentAnswer = false;
    saveTFInfo(currentWord.id, false);
    currentIndex++;
    showNextWord();
  });

  // 回答後の「次へ進む」ボタン：ユーザーの判断により TF 情報を更新
  nextBtn.addEventListener('click', () => {
    if (currentAnswer === true) {
      saveTFInfo(currentWord.id, true);
    } else {
      saveTFInfo(currentWord.id, false);
    }
    currentIndex++;
    showNextWord();
  });

  // TF情報をローカルストレージに保存
  function saveTFInfo(id, value) {
    tfInfo[id] = value;
    localStorage.setItem('wordTF', JSON.stringify(tfInfo));
  }
});
