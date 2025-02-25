/* script.js */

// グローバル変数
let wordsData = {};      // JSONから読み込んだ全データ
let currentIndex = 0;    // 現在の単語のインデックス
let selectedWords = [];  // 選択された単語リスト

// DOM要素の取得
const startScreen = document.getElementById('start-screen');
const wordScreen = document.getElementById('word-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const toggleAnswerBtn = document.getElementById('toggle-answer-btn');
const nextBtn = document.getElementById('next-btn');
const exampleSentenceElem = document.getElementById('example-sentence');
const meaningElem = document.getElementById('meaning');
const thinkingFlowElem = document.getElementById('thinkingFlow');

// イベントリスナー
startBtn.addEventListener('click', startSession);
restartBtn.addEventListener('click', restartSession);
toggleAnswerBtn.addEventListener('click', toggleAnswer);
nextBtn.addEventListener('click', showNextWord);

// セッション開始
async function startSession() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const section = document.getElementById('section-select').value;
  const rangeStart = parseInt(document.getElementById('range-start').value);
  const rangeEnd = parseInt(document.getElementById('range-end').value);
  
  // JSONから単語データ読み込み
  try {
    const response = await fetch('words.json');
    wordsData = await response.json();
  } catch (error) {
    alert('単語データの読み込みに失敗しました。');
    console.error(error);
    return;
  }
  
  // JSON構造: wordsData.target1900.sections[section] が配列になっている前提
  if (!wordsData.target1900 || !wordsData.target1900.sections || !wordsData.target1900.sections[section]) {
    alert('指定されたセクションのデータが存在しません。');
    return;
  }
  
  const sectionWords = wordsData.target1900.sections[section];
  
  // 範囲チェック
  if (rangeStart < 1 || rangeEnd > sectionWords.length || rangeStart > rangeEnd) {
    alert('正しい範囲を入力してください。');
    return;
  }
  
  // 選択範囲の単語リストを抽出（インデックス調整）
  selectedWords = sectionWords.slice(rangeStart - 1, rangeEnd);
  
  // モードに応じて並び替え
  if (mode === 'random') {
    shuffleArray(selectedWords);
  }
  
  currentIndex = 0;
  startScreen.style.display = 'none';
  wordScreen.style.display = 'block';
  
  // 次へボタンは常に表示
  nextBtn.style.display = 'inline-block';
  
  showWord();
}

// 現在の単語を表示
function showWord() {
  if (currentIndex >= selectedWords.length) {
    wordScreen.style.display = 'none';
    endScreen.style.display = 'block';
    return;
  }
  
  // 初期状態：回答非表示、トグルボタンは「回答を表示」
  document.getElementById('answer-section').style.display = 'none';
  toggleAnswerBtn.textContent = '回答を表示';
  
  const currentWord = selectedWords[currentIndex];
  
  // 例文内の対象単語をハイライト（正規表現・大小文字区別なし）
  const regex = new RegExp(`(${currentWord.word})`, 'gi');
  const highlightedSentence = currentWord.example.replace(regex, '<span class="highlight">$1</span>');
  exampleSentenceElem.innerHTML = highlightedSentence;
  
  // 意味もハイライト（英単語とリンク）
  meaningElem.innerHTML = '意味: <span class="highlight">' + currentWord.meaning + '</span>';
  thinkingFlowElem.textContent = '思考フロー: ' + currentWord.thinkingFlow;
}

// 回答の表示/非表示の切替
function toggleAnswer() {
  const answerSection = document.getElementById('answer-section');
  if (answerSection.style.display === 'none') {
    answerSection.style.display = 'block';
    toggleAnswerBtn.textContent = '回答を非表示';
  } else {
    answerSection.style.display = 'none';
    toggleAnswerBtn.textContent = '回答を表示';
  }
}

// 次の単語へ
function showNextWord() {
  currentIndex++;
  showWord();
}

// 再スタート
function restartSession() {
  endScreen.style.display = 'none';
  startScreen.style.display = 'block';
}

// Fisher-Yatesアルゴリズムによる配列シャッフル
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}