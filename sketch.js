// =====================================
// p5.js 互動式測驗
// 中文：LXGW WenKai TC
// 英文與數字：Isometra
// =====================================


// =====================================
// 備用內建題庫
// =====================================

let defaultQuestions = [
  {
    question: "在 p5.js 中，設定畫布大小通常會使用哪一個函式？",
    options: [
      "setSize()",
      "createCanvas()",
      "canvas()",
      "initCanvas()"
    ],
    answer: 1,
    explanation:
      "createCanvas(width, height) 是 p5.js 中用來創建指定大小畫布的標準函式。"
  },
  {
    question:
      "下列哪一個 p5.js 核心函式會以每秒約 60 次的頻率重複執行？",
    options: [
      "setup()",
      "preload()",
      "draw()",
      "loop()"
    ],
    answer: 2,
    explanation:
      "draw() 函式預設會不斷循環執行，用於繪製動畫與動態畫面。"
  },
  {
    question:
      "程式碼 background(255) 會將畫布背景填滿成什麼顏色？",
    options: [
      "黑色",
      "白色",
      "紅色",
      "透明"
    ],
    answer: 1,
    explanation:
      "在 RGB/灰階模式下，數值 255 代表最大亮度，也就是白色。"
  },
  {
    question:
      "若想繪製一個左上角在 (50, 50)，寬 100、高 80 的矩形，應該使用哪段程式碼？",
    options: [
      "rect(50, 50, 100, 80)",
      "rect(100, 80, 50, 50)",
      "square(50, 50, 100)",
      "box(50, 50, 100, 80)"
    ],
    answer: 0,
    explanation:
      "rect(x, y, w, h) 的參數順序分別為：X 座標、Y 座標、寬度、高度。"
  },
  {
    question:
      "在 p5.js 中，代表目前滑鼠 X 軸位置的內建變數是什麼？",
    options: [
      "mouseX",
      "cursorX",
      "mouse.x",
      "getMouseX()"
    ],
    answer: 0,
    explanation:
      "p5.js 提供內建系統變數 mouseX 與 mouseY 來取得滑鼠目前的座標。"
  },
  {
    question:
      "若要去除所有圖形的外框線，應該在繪製圖形前呼叫哪一個函式？",
    options: [
      "noFill()",
      "noStroke()",
      "strokeWeight(0)",
      "removeBorder()"
    ],
    answer: 1,
    explanation:
      "noStroke() 會關閉圖形的外框線，而 noFill() 則是去除圖形內部的填充色。"
  },
  {
    question:
      "下列哪一個函式可用於載入圖片、字型等外部資源，並確保在 setup() 前載入完成？",
    options: [
      "loadAssets()",
      "setup()",
      "preload()",
      "beforeDraw()"
    ],
    answer: 2,
    explanation:
      "preload() 會在 setup() 執行前執行，確保外部資源載入完成。"
  }
];


// =====================================
// 全域變數
// =====================================

let allQuestions = [];
let quizQuestions = [];

let currentQuestionIndex = 0;
let correctCount = 0;
let score = 0;

let selectedOption = -1;
let isAnswered = false;
let isLoading = true;

let confettiParticles = [];

let btnX;
let btnW;
let btnH;
let btnYStart;
let btnGap;

let fontSizeTitle;
let fontSizeOption;
let fontSizeExplanation;


// =====================================
// 字體設定
// =====================================

const FONT_CHINESE = "LXGW WenKai TC";
const FONT_ENGLISH = "Isometra";


// =====================================
// 自訂文字繪製函式
// 根據文字內容，自動切換英數與中文字體
// =====================================

function drawMixedText(
  content,
  x,
  y,
  maxWidth = undefined,
  maxHeight = undefined
) {
  const textContent = String(content);

  // 將文字分割成：
  // 1. 英文、數字、英文符號
  // 2. 中文及其他文字
  const parts = textContent.match(
    /[A-Za-z0-9０-９.,!?()[\]{}'"`_+\-*/=<>:;#%&|\\ ]+|[^A-Za-z0-9０-９.,!?()[\]{}'"`_+\-*/=<>:;#%&|\\ ]+/g
  );

  if (!parts) {
    textFont(FONT_CHINESE);

    if (maxWidth !== undefined) {
      text(content, x, y, maxWidth, maxHeight);
    } else {
      text(content, x, y);
    }

    return;
  }

  let currentX = x;

  for (const part of parts) {
    const isEnglishOrNumber =
      /^[A-Za-z0-9０-９.,!?()[\]{}'"`_+\-*/=<>:;#%&|\\ ]+$/.test(part);

    textFont(
      isEnglishOrNumber
        ? FONT_ENGLISH
        : FONT_CHINESE
    );

    text(part, currentX, y);

    currentX += textWidth(part);
  }
}


// =====================================
// 初始化
// =====================================

function setup() {
  createCanvas(windowWidth, windowHeight);

  textFont(FONT_CHINESE);
  textAlign(LEFT, TOP);

  calculateLayout();
  loadQuestions();
}

function loadQuestions() {
  if (window.location.protocol === "file:") {
    useDefaultQuestions();
    return;
  }

  fetch("questions.csv", {
    cache: "no-store"
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("CSV 檔案未找到");
      }

      return response.text();
    })
    .then((csvText) => {
      parseCSV(csvText);

      if (allQuestions.length === 0) {
        useDefaultQuestions();
        return;
      }

      isLoading = false;
      startNewQuiz();
    })
    .catch((error) => {
      console.warn(
        "無法讀取 CSV，已啟用預設題庫：",
        error
      );
      useDefaultQuestions();
    });
}

function useDefaultQuestions() {
  allQuestions = [...defaultQuestions];
  isLoading = false;
  startNewQuiz();
}


// =====================================
// CSV 解析
// =====================================

function parseCSV(textContent) {
  const lines = textContent.split(/\r?\n/);

  allQuestions = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      continue;
    }

    let matches = line.match(
      /(".*?"|[^",]+)(?=\s*,|\s*$)/g
    );

    if (!matches || matches.length < 7) {
      matches = line.split(",");
    }

    const clean = matches.map((item) => {
      return item
        .replace(/^"|"$/g, "")
        .replace(/""/g, '"')
        .trim();
    });

    if (clean.length < 7) {
      continue;
    }

    const answerIndex = parseInt(clean[5], 10);

    if (
      Number.isNaN(answerIndex) ||
      answerIndex < 0 ||
      answerIndex > 3
    ) {
      continue;
    }

    allQuestions.push({
      question: clean[0],
      options: [
        clean[1],
        clean[2],
        clean[3],
        clean[4]
      ],
      answer: answerIndex,
      explanation: clean[6]
    });
  }
}


// =====================================
// 版面配置
// =====================================

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  calculateLayout();
}

function calculateLayout() {
  const isMobile =
    width < 600 || height < 550;

  btnW = min(width * 0.9, 560);
  btnX = (width - btnW) / 2;

  if (isMobile) {
    btnH = constrain(
      height * 0.075,
      46,
      62
    );

    btnYStart = max(
      130,
      height * 0.28
    );

    btnGap = btnH + 10;

    fontSizeTitle = constrain(
      width * 0.038,
      15,
      19
    );

    fontSizeOption = constrain(
      width * 0.035,
      14,
      17
    );

    fontSizeExplanation = constrain(
      width * 0.035,
      14,
      17
    );
  } else {
    btnH = 58;
    btnYStart = max(150, height * 0.3);
    btnGap = 68;

    fontSizeTitle = 20;
    fontSizeOption = 18;
    fontSizeExplanation = 18;
  }
}


// =====================================
// 開始新測驗
// =====================================

function startNewQuiz() {
  if (allQuestions.length === 0) {
    return;
  }

  currentQuestionIndex = 0;
  correctCount = 0;
  score = 0;
  selectedOption = -1;
  isAnswered = false;
  confettiParticles = [];

  const shuffledAll = shuffle([...allQuestions]);

  const selectedSet = shuffledAll.slice(
    0,
    min(7, shuffledAll.length)
  );

  quizQuestions = selectedSet.map((questionData, index) => {
    let optionsWithFlag =
      questionData.options.map(
        (option, optionIndex) => {
          return {
            text: option,
            isCorrect:
              optionIndex === questionData.answer
          };
        }
      );

    optionsWithFlag = shuffle(optionsWithFlag);

    const newAnswerIndex =
      optionsWithFlag.findIndex(
        (item) => item.isCorrect
      );

    return {
      question:
        `${index + 1}. ${questionData.question.replace(/^\d+\.\s*/, "")}`,
      options:
        optionsWithFlag.map(
          (item) => item.text
        ),
      answer: newAnswerIndex,
      explanation: questionData.explanation
    };
  });
}


// =====================================
// 主繪圖函式
// =====================================

function draw() {
  background(248);

  if (isLoading) {
    fill(100);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(20);
    textFont(FONT_CHINESE);
    text("載入題庫中⋯⋯", width / 2, height / 2);
    return;
  }

  if (
    currentQuestionIndex <
    quizQuestions.length
  ) {
    displayQuiz();
    updateAndDrawParticles();
  } else {
    displayScore();
  }
}


// =====================================
// 顯示題目
// =====================================

function displayQuiz() {
  const q =
    quizQuestions[currentQuestionIndex];

  fill(100);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(15);

  drawMixedText(
    `題目 ${currentQuestionIndex + 1} / ${quizQuestions.length}`,
    btnX,
    max(12, height * 0.03)
  );

  fill(30);
  textSize(fontSizeTitle);
  textStyle(BOLD);

  const titleY = max(
    40,
    height * 0.075
  );

  drawMixedText(
    q.question,
    btnX,
    titleY,
    btnW,
    btnYStart - titleY - 12
  );

  textStyle(NORMAL);

  for (let i = 0; i < 4; i++) {
    const y = btnYStart + i * btnGap;

    const isHover =
      mouseX >= btnX &&
      mouseX <= btnX + btnW &&
      mouseY >= y &&
      mouseY <= y + btnH;

    let bgColor = color(255);
    let borderColor = color(200);
    let textColor = color(50);

    if (isAnswered) {
      if (i === q.answer) {
        bgColor = color(200, 230, 201);
        borderColor = color(46, 125, 50);
        textColor = color(27, 94, 32);
      } else if (
        selectedOption !== q.answer &&
        i === selectedOption
      ) {
        bgColor = color(255, 205, 210);
        borderColor = color(198, 40, 40);
        textColor = color(183, 28, 28);
      } else {
        bgColor = color(240);
        textColor = color(150);
      }
    } else if (isHover) {
      bgColor = color(235, 245, 255);
      borderColor = color(33, 150, 243);
    }

    stroke(borderColor);
    strokeWeight(
      isAnswered &&
      (i === q.answer ||
        i === selectedOption)
        ? 2
        : 1
    );

    fill(bgColor);
    rect(
      btnX,
      y,
      btnW,
      btnH,
      10
    );

    noStroke();
    fill(textColor);
    textSize(fontSizeOption);
    textAlign(LEFT, CENTER);

    const labelText =
      `${String.fromCharCode(65 + i)}. ${q.options[i]}`;

    drawMixedText(
      labelText,
      btnX + 16,
      y + btnH / 2
    );
  }

  if (isAnswered) {
    const explanationY =
      btnYStart + 4 * btnGap + 10;

    textAlign(LEFT, TOP);
    textSize(fontSizeExplanation);
    textStyle(BOLD);

    if (selectedOption === q.answer) {
      fill(46, 125, 50);

      drawMixedText(
        `✓ 答對了！ ${q.explanation}`,
        btnX,
        explanationY,
        btnW,
        height - explanationY - 10
      );
    } else {
      fill(198, 40, 40);

      drawMixedText(
        `✗ 答錯了！ ${q.explanation}`,
        btnX,
        explanationY,
        btnW,
        height - explanationY - 10
      );
    }

    fill(120);
    textSize(13);
    textStyle(NORMAL);
    textAlign(RIGHT, TOP);

    drawMixedText(
      "（點擊任意處下一題）",
      btnX + btnW - 5,
      max(12, height * 0.03)
    );
  }
}


// =====================================
// 滑鼠互動
// =====================================

function mousePressed() {
  if (isLoading) {
    return;
  }

  if (
    currentQuestionIndex >=
    quizQuestions.length
  ) {
    const cardW = min(
      width * 0.88,
      450
    );

    const cardH = min(
      height * 0.82,
      350
    );

    const cardY =
      (height - cardH) / 2;

    const retryW = min(
      cardW * 0.75,
      230
    );

    const retryY =
      cardY + cardH * 0.83;

    const retryX =
      (width - retryW) / 2;

    if (
      mouseX >= retryX &&
      mouseX <= retryX + retryW &&
      mouseY >= retryY &&
      mouseY <= retryY + 40
    ) {
      startNewQuiz();
    }

    return;
  }

  if (!isAnswered) {
    for (let i = 0; i < 4; i++) {
      const y =
        btnYStart + i * btnGap;

      if (
        mouseX >= btnX &&
        mouseX <= btnX + btnW &&
        mouseY >= y &&
        mouseY <= y + btnH
      ) {
        selectedOption = i;
        isAnswered = true;

        if (
          i ===
          quizQuestions[
            currentQuestionIndex
          ].answer
        ) {
          correctCount++;
          createFireworkConfetti();
          playCorrectSound();
        } else {
          playWrongSound();
        }

        break;
      }
    }
  } else {
    currentQuestionIndex++;
    isAnswered = false;
    selectedOption = -1;
    confettiParticles = [];
  }
}


// =====================================
// 音效
// =====================================

function playCorrectSound() {
  const sound =
    new p5.Oscillator("sine");

  sound.start();
  sound.freq(523.25);
  sound.amp(0.3, 0.05);

  setTimeout(() => {
    sound.freq(659.25, 0.05);
  }, 100);

  setTimeout(() => {
    sound.amp(0, 0.1);

    setTimeout(() => {
      sound.stop();
    }, 120);
  }, 250);
}

function playWrongSound() {
  const sound =
    new p5.Oscillator("sawtooth");

  sound.start();
  sound.freq(150);
  sound.amp(0.25, 0.05);

  setTimeout(() => {
    sound.freq(120, 0.05);
  }, 100);

  setTimeout(() => {
    sound.amp(0, 0.1);

    setTimeout(() => {
      sound.stop();
    }, 120);
  }, 300);
}


// =====================================
// 彩紙動畫
// =====================================

function createFireworkConfetti() {
  for (let i = 0; i < 35; i++) {
    const angle = random(TWO_PI);
    const speed = random(3, 7);

    confettiParticles.push({
      x: width / 2,
      y: height / 2,
      vx: cos(angle) * speed,
      vy: sin(angle) * speed - random(1, 3),
      size: random(4, 9),
      color: color(
        random(255),
        random(255),
        random(255)
      ),
      alpha: 255
    });
  }
}

function updateAndDrawParticles() {
  noStroke();

  for (
    let i = confettiParticles.length - 1;
    i >= 0;
    i--
  ) {
    const particle =
      confettiParticles[i];

    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.2;
    particle.vx *= 0.98;
    particle.alpha -= 6;

    if (particle.alpha <= 0) {
      confettiParticles.splice(i, 1);
    } else {
      fill(
        red(particle.color),
        green(particle.color),
        blue(particle.color),
        particle.alpha
      );

      ellipse(
        particle.x,
        particle.y,
        particle.size
      );
    }
  }
}


// =====================================
// 顯示成績
// =====================================

function displayScore() {
  score = Math.round(
    (correctCount / quizQuestions.length) * 100
  );

  const cardW = min(
    width * 0.88,
    450
  );

  const cardH = min(
    height * 0.82,
    350
  );

  const cardX =
    (width - cardW) / 2;

  const cardY =
    (height - cardH) / 2;

  fill(255);
  stroke(230);
  strokeWeight(2);
  rect(
    cardX,
    cardY,
    cardW,
    cardH,
    16
  );

  textAlign(CENTER, CENTER);
  noStroke();

  fill(50);
  textSize(
    min(cardW * 0.06, 22)
  );
  textStyle(BOLD);
  textFont(FONT_CHINESE);

  text(
    "🎉 測驗完成！",
    width / 2,
    cardY + cardH * 0.14
  );

  let feedbackText = "";
  let subText = "";
  let themeColor;

  if (score >= 80) {
    feedbackText =
      "太強了！你簡直是 p5.js 大師 🚀";

    subText =
      "對觀念相當熟練，繼續保持！";

    themeColor = color(
      46,
      125,
      50
    );
  } else if (score >= 60) {
    feedbackText =
      "表現不錯！已掌握大部分觀念 👍";

    subText =
      "再複習一下不熟的題目會更棒！";

    themeColor = color(
      255,
      152,
      0
    );
  } else {
    feedbackText =
      "再接再厲，加油！ 💪";

    subText =
      "多練習程式設計語法會越來越順手！";

    themeColor = color(
      229,
      57,
      53
    );
  }

  const circleR = min(
    cardW * 0.22,
    76
  );

  fill(themeColor);
  ellipse(
    width / 2,
    cardY + cardH * 0.41,
    circleR,
    circleR
  );

  fill(255);
  textSize(
    min(circleR * 0.45, 30)
  );
  textStyle(BOLD);
  textFont(FONT_ENGLISH);

  text(
    score,
    width / 2,
    cardY + cardH * 0.4
  );

  textSize(14);
  textFont(FONT_CHINESE);
  textStyle(NORMAL);

  text(
    "分",
    width / 2,
    cardY + cardH * 0.48
  );

  fill(themeColor);
  textSize(
    min(cardW * 0.045, 17)
  );
  textStyle(BOLD);

  drawMixedText(
    feedbackText,
    width / 2,
    cardY + cardH * 0.67
  );

  fill(120);
  textSize(
    min(cardW * 0.032, 13)
  );
  textStyle(NORMAL);

  drawMixedText(
    subText,
    width / 2,
    cardY + cardH * 0.76
  );

  const retryW = min(
    cardW * 0.75,
    230
  );

  const retryY =
    cardY + cardH * 0.83;

  stroke(200);
  strokeWeight(1);
  fill(245);

  rect(
    (width - retryW) / 2,
    retryY,
    retryW,
    40,
    20
  );

  fill(80);
  textSize(13);
  textStyle(BOLD);

  drawMixedText(
    "按下 R 鍵或點擊此處重新測驗",
    width / 2,
    retryY + 20
  );
}


// =====================================
// 鍵盤操作
// =====================================

function keyPressed() {
  if (
    (key === "r" || key === "R") &&
    currentQuestionIndex >=
      quizQuestions.length
  ) {
    startNewQuiz();
  }
}