/* script.js */

// グローバル変数の宣言
let wordsData = [];      // JSONから読み込んだ全単語データ
let currentIndex = 0;    // 現在の単語のインデックス
let selectedWords = [];  // 範囲指定後、使用する単語リスト

// DOM要素の取得
const startScreen = document.getElementById('start-screen');
const wordScreen = document.getElementById('word-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const revealBtn = document.getElementById('reveal-btn');
const nextBtn = document.getElementById('next-btn');
const exampleSentenceElem = document.getElementById('example-sentence');
const meaningElem = document.getElementById('meaning');
const thinkingFlowElem = document.getElementById('thinkingFlow');

// イベントリスナーの設定
startBtn.addEventListener('click', startSession);
revealBtn.addEventListener('click', revealAnswer);
nextBtn.addEventListener('click', showNextWord);
restartBtn.addEventListener('click', restartSession);

// セッション開始の処理
async function startSession() {
  // ユーザーの設定を取得
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const rangeStart = parseInt(document.getElementById('range-start').value);
  const rangeEnd = parseInt(document.getElementById('range-end').value);

  // JSONファイルから単語データを読み込む
  try {
    const response = await fetch('words.json');
    wordsData = await response.json();
  } catch (error) {
    alert('単語データの読み込みに失敗しました。');
    console.error(error);
    return;
  }
  
  // 入力範囲のチェック（例: 範囲内か、開始番号 <= 終了番号か）
  if (rangeStart < 1 || rangeEnd > wordsData.length || rangeStart > rangeEnd) {
    alert('正しい範囲を入力してください。');
    return;
  }
  
  // 選択範囲の単語リストを抽出（JSONのインデックスは0始まり）
  selectedWords = wordsData.slice(rangeStart - 1, rangeEnd);
  
  // モードに応じて単語リストを並び替え
  if (mode === 'random') {
    shuffleArray(selectedWords);
  }
  
  currentIndex = 0;
  startScreen.style.display = 'none';
  wordScreen.style.display = 'block';
  
  showWord();
}

// 現在の単語を画面に表示
function showWord() {
  if (currentIndex >= selectedWords.length) {
    // 単語がすべて終了した場合、終了画面を表示
    wordScreen.style.display = 'none';
    endScreen.style.display = 'block';
    return;
  }
  
  // 表示エリアの初期化
  document.getElementById('answer-section').style.display = 'none';
  revealBtn.style.display = 'inline-block';
  nextBtn.style.display = 'none';
  
  const currentWord = selectedWords[currentIndex];
  
  // 例文内の対象単語をハイライトする（大文字小文字を区別せず）
  const regex = new RegExp(`(${currentWord.word})`, 'gi');
  const highlightedSentence = currentWord.example.replace(regex, '<span class="highlight">$1</span>');
  
  exampleSentenceElem.innerHTML = highlightedSentence;
  // 答え（意味と思考フロー）の設定
  meaningElem.textContent = `意味: ${currentWord.meaning}`;
  thinkingFlowElem.textContent = `思考フロー: ${currentWord.thinkingFlow}`;
}

// 「答えを見る」ボタン押下時の処理
function revealAnswer() {
  document.getElementById('answer-section').style.display = 'block';
  revealBtn.style.display = 'none';
  nextBtn.style.display = 'inline-block';
}

// 「次へ」ボタンで次の単語に切り替え
function showNextWord() {
  currentIndex++;
  showWord();
}

// 「再スタート」ボタン押下時の処理
function restartSession() {
  endScreen.style.display = 'none';
  startScreen.style.display = 'block';
}

// Fisher-Yatesアルゴリズムによる配列シャッフル関数
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}