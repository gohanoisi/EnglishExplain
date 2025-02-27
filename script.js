document.addEventListener('DOMContentLoaded', () => {
  let allWords = [];         // 全単語データ
  let filteredWords = [];    // 出題対象（TF情報により正解済みを除外）
  let currentIndex = 0;
  let currentWord = null;
  let currentAnswer = null;  // ユーザー回答: true(わかった)/false(わからなかった)
  let tfInfo = {};           // { 単語ID: true/false } の形式で管理

  // --- ローカルストレージからTF情報を取得 ---
  const storedTF = localStorage.getItem('wordTF');
  if (storedTF) {
    tfInfo = JSON.parse(storedTF);
  }

  // --- HTML要素を取得 ---
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

  // --- 単語データを読み込み ---
  fetch('target1900.json')
    .then(response => response.json())
    .then(data => {
      // data.target1900.sections内の各セクションをフラットな配列にする
      const sections = data.target1900.sections;
      allWords = Object.values(sections)
        .flat()
        .map((wordObj, index) => {
          wordObj.id = index + 1; // ID付与
          return wordObj;
        });
    })
    .catch(error => console.error('Error loading words:', error));

  // ==============================
  // イベントリスナー: スタートボタン
  // ==============================
  startBtn.addEventListener('click', () => {
    let rangeStart = parseInt(rangeStartInput.value);
    let rangeEnd = parseInt(rangeEndInput.value);
    if (isNaN(rangeStart) || isNaN(rangeEnd) || rangeStart < 1 || rangeEnd < rangeStart) {
      alert('正しい出題範囲を入力してください。');
      return;
    }

    // モード取得（sequential / random）
    let selectedMode = 'sequential';
    for (let modeInput of modeInputs) {
      if (modeInput.checked) {
        selectedMode = modeInput.value;
        break;
      }
    }

    // 指定範囲の単語のみ抽出
    filteredWords = allWords.slice(rangeStart - 1, rangeEnd);

    // 既に「わかった」単語は除外
    filteredWords = filteredWords.filter(wordObj => {
      return !(tfInfo[wordObj.id] === true);
    });

    // ランダムモードならシャッフル
    if (selectedMode === 'random') {
      filteredWords.sort(() => Math.random() - 0.5);
    }

    if (filteredWords.length === 0) {
      alert('出題対象の単語がありません。');
      return;
    }

    // 出題開始
    currentIndex = 0;
    startScreen.style.display = 'none';
    wordScreen.style.display = 'block';
    showNextWord();
  });

  // ==============================
  // イベントリスナー: 再スタートボタン
  // ==============================
  restartBtn.addEventListener('click', () => {
    startScreen.style.display = 'block';
    endScreen.style.display = 'none';
    wordScreen.style.display = 'none';
  });

  // ==============================
  // 次の単語を表示
  // ==============================
  function showNextWord() {
    if (currentIndex >= filteredWords.length) {
      // 出題終了
      wordScreen.style.display = 'none';
      endScreen.style.display = 'block';
      return;
    }

    currentWord = filteredWords[currentIndex];
    currentAnswer = null;

    // 例文をハイライトして表示
    const highlightedExample = highlightTargetWord(currentWord.example, currentWord.word);
    exampleSentenceElem.innerHTML = highlightedExample;

    // 表示リセット
    hintElem.textContent = "";
    meaningElem.textContent = "";
    thinkingFlowElem.textContent = ""; // JSON上に無い場合は空のまま
    answerSection.style.display = 'none';
    afterAnswerButtons.style.display = 'none';

    // 初期ボタン
    hintBtn.style.display = 'inline-block';
    gotitBtn.style.display = 'inline-block';
    dontknowBtn.style.display = 'none';
  }

  // ==============================
  // 関数: 対象単語を <span> でハイライト
  // ==============================
  function highlightTargetWord(sentence, targetWord) {
    // 単語境界(\b)を含む正規表現で大文字小文字区別なし(gi)
    const regex = new RegExp("\\b" + targetWord + "\\b", "gi");
    // 例文中の targetWord 部分を <span class="highlight">...</span> に置換
    return sentence.replace(regex, (match) => {
      // match: 実際に置き換えられる文字列（大文字小文字を保持）
      return `<span class="highlight">${match}</span>`;
    });
  }

  // ==============================
  // 関数: 対象単語以外の wordMeanings を取得し文字列整形
  // ==============================
  function parseWordMeanings(wordMeaningsStr, targetWord) {
    // "create 創り出す new 新しい ideas アイデア ..." のように
    // [英単語 意味 英単語 意味 ...] が連続している想定
    const tokens = wordMeaningsStr.split(/\s+/);
    let result = [];

    // 2個ずつ [word, meaning] を取り出す
    for (let i = 0; i < tokens.length; i += 2) {
      const w = tokens[i];
      const m = tokens[i + 1] || "";
      // 対象単語は除外 (大文字小文字区別なし)
      if (w.toLowerCase() !== targetWord.toLowerCase()) {
        result.push(`${w} ${m}`);
      }
    }
    // 結果を半角スペース区切りで連結
    return result.join(' ');
  }

  // ==============================
  // 「ヒントを見る」ボタン
  // ==============================
  hintBtn.addEventListener('click', () => {
    // 対象単語以外の単語の意味を取り出して表示する
    const hintText = parseWordMeanings(currentWord.wordMeanings, currentWord.word);
    hintElem.textContent = "ヒント: " + hintText;

    // 回答エリアを表示 & 「わからない」ボタンも出す
    answerSection.style.display = 'block';
    dontknowBtn.style.display = 'inline-block';
  });

  // ==============================
  // 「わかった」ボタン
  // ==============================
  gotitBtn.addEventListener('click', () => {
    currentAnswer = true;

    // ヒント＋対象単語の意味を即表示
    const hintText = parseWordMeanings(currentWord.wordMeanings, currentWord.word);
    hintElem.textContent = "ヒント: " + hintText;
    meaningElem.textContent = "意味: " + currentWord.meaning;
    thinkingFlowElem.textContent = currentWord.thinkingFlow || "";

    // ボタン表示の切り替え
    answerSection.style.display = 'block';
    hintBtn.style.display = 'none';
    gotitBtn.style.display = 'none';
    dontknowBtn.style.display = 'none';
    afterAnswerButtons.style.display = 'block';
  });

  // ==============================
  // 「わからない」ボタン
  // ==============================
  dontknowBtn.addEventListener('click', () => {
    currentAnswer = false;

    // 対象単語の意味を表示
    meaningElem.textContent = "意味: " + currentWord.meaning;
    thinkingFlowElem.textContent = currentWord.thinkingFlow || "";

    // ボタン表示の切り替え
    answerSection.style.display = 'block';
    hintBtn.style.display = 'none';
    gotitBtn.style.display = 'none';
    dontknowBtn.style.display = 'none';
    afterAnswerButtons.style.display = 'block';
  });

  // ==============================
  // 「わからなかった」ボタン
  // ==============================
  wrongBtn.addEventListener('click', () => {
    // 明示的に false
    currentAnswer = false;
    saveTFInfo(currentWord.id, false);
    currentIndex++;
    showNextWord();
  });

  // ==============================
  // 「次へ進む」ボタン
  // ==============================
  nextBtn.addEventListener('click', () => {
    if (currentAnswer === true) {
      saveTFInfo(currentWord.id, true);
    } else {
      saveTFInfo(currentWord.id, false);
    }
    currentIndex++;
    showNextWord();
  });

  // ==============================
  // TF情報をローカルストレージに保存
  // ==============================
  function saveTFInfo(id, value) {
    tfInfo[id] = value;
    localStorage.setItem('wordTF', JSON.stringify(tfInfo));
  }
});
