/**
 * 🌸 イースターエッグ: 絵文字の雨
 * 「gimata0528」フォルダ作成時に発動
 * 絵文字＆テキストが加速しながら降り注ぎ、
 * 徐々に減速→でっかい「太。」がゆっくり降ってきて締まる
 */

let container: HTMLDivElement | null = null;
let interval: ReturnType<typeof setInterval> | null = null;

const ITEMS = [
  "💩", "🌸", "🍣", "🐱", "🔥", "👻", "🍺", "🎉", "⭐", "🦀", "🍕", "👾", "🌈", "🐸", "💀", "🫠", "🤡",
  "太", "犬",
];

const SECRET_FOLDER = "gimata0528";

function spawn(parent: HTMLDivElement) {
  const el = document.createElement("div");
  const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  const isText = item === "太" || item === "犬";
  const size = isText ? Math.random() * 16 + 24 : Math.random() * 20 + 20;
  const left = Math.random() * 100;
  const duration = Math.random() * 3 + 2;
  el.textContent = item;
  el.style.cssText = `position:absolute;top:-50px;left:${left}%;font-size:${size}px;white-space:nowrap;animation:confetti-fall ${duration}s linear forwards${isText ? ";font-weight:bold;color:#ec4899" : ""}`;
  parent.appendChild(el);
  setTimeout(() => el.remove(), (duration + 0.5) * 1000);
}

function stop() {
  if (interval) clearInterval(interval);
  interval = null;
  if (container) container.remove();
  container = null;
}

function start() {
  // トグル
  if (container) {
    stop();
    return;
  }

  const el = document.createElement("div");
  el.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden";
  document.body.appendChild(el);
  container = el;

  let rate = 2;
  let tick = 0;
  let winding = false; // 減速フェーズ

  // 初回バースト
  for (let i = 0; i < 15; i++) {
    setTimeout(() => container && spawn(container), Math.random() * 300);
  }

  // メインループ
  interval = setInterval(() => {
    tick++;

    if (winding) {
      // 減速: 0.5秒ごとに半分に減らす
      if (tick % 5 === 0) rate = Math.max(0, Math.floor(rate / 2));
      if (rate === 0) {
        // 完全に止まったらフィナーレ
        if (interval) clearInterval(interval);
        interval = null;
        showFinale();
        return;
      }
    } else {
      // 加速: 1秒ごとに3個ずつ増やす
      if (tick % 10 === 0) rate += 3;
    }

    for (let i = 0; i < rate; i++) {
      if (container) spawn(container);
    }
  }, 100);

  // 16秒後から減速開始（4秒かけて減っていく）
  setTimeout(() => { winding = true; }, 16000);
}

function showFinale() {
  if (!container) return;

  // でっかい「太」: ゆらゆら降りてくる → 止まる → 高速回転 → パッと消える
  const style = document.createElement("style");
  style.textContent = [
    "@keyframes finale-sway { 0%,100% { translate: -50% 0; rotate: -8deg } 50% { translate: -50% 0; rotate: 8deg } }",
    "@keyframes finale-spin { from { rotate: 0deg } to { rotate: 360deg } }",
  ].join("\n");
  document.head.appendChild(style);

  const finale = document.createElement("div");
  finale.textContent = "太";
  finale.style.cssText = [
    "position:absolute",
    "left:50%",
    "top:-40%",
    "font-size:min(80vw, 500px)",
    "font-weight:900",
    "color:#ec4899",
    "white-space:nowrap",
    "transition:top 5s cubic-bezier(0.25, 0.1, 0.25, 1)",
    "animation:finale-sway 2s ease-in-out infinite",
    "opacity:1",
  ].join(";");

  container.appendChild(finale);

  // ① ゆらゆら降下（5秒）
  requestAnimationFrame(() => {
    finale.style.top = "20%";
  });

  // ② 着地して止まる → 1秒待つ → 高速回転開始
  setTimeout(() => {
    finale.style.animation = "finale-spin 0.15s linear infinite";

    // ③ 1.5秒回ったら弾ける → 大量の小さい「太」が飛び散る
    setTimeout(() => {
      if (!container) return;
      finale.remove();

      // 爆発: 中心から大量の「太」がゆっくり飛び散る
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.25;
      for (let i = 0; i < 200; i++) {
        const mini = document.createElement("div");
        mini.textContent = "太";
        const size = Math.random() * 24 + 16;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * Math.max(window.innerWidth, window.innerHeight) + 200;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;
        const rot = Math.random() * 720 - 360;
        const dur = Math.random() * 2 + 2;
        mini.style.cssText = [
          `position:absolute`,
          `left:${cx}px`,
          `top:${cy}px`,
          `font-size:${size}px`,
          `font-weight:900`,
          `color:#ec4899`,
          `white-space:nowrap`,
          `transition:all ${dur}s cubic-bezier(0.22, 1, 0.36, 1)`,
          `opacity:1`,
        ].join(";");
        container.appendChild(mini);

        requestAnimationFrame(() => {
          mini.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
          mini.style.opacity = "0";
        });
      }

      // 飛び散り終わったら片付け
      setTimeout(() => {
        style.remove();
        stop();
      }, 4500);
    }, 1500);
  }, 6000);
}

/** フォルダ名がイースターエッグのトリガーかチェックして発動 */
export function checkEasterEgg(folderName: string) {
  if (folderName.trim() === SECRET_FOLDER) {
    start();
  }
}
