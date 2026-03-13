(function SixSevenEmojiReplacer() {
  const STYLE_ID = "sixseven-style";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .sixseven-emoji {
        display: inline-flex;
        align-items: center;
        gap: 0.02em;
        vertical-align: middle;
        white-space: nowrap;
        margin: 0 0.05em;
      }

      .sixseven-digit {
        display: inline-block;
        font-weight: 900;
        font-size: 1em;
        line-height: 1;
        color: cyan;
        text-shadow:
          0 0 2px rgba(0, 255, 255, 0.9),
          0 0 8px rgba(0, 255, 255, 0.6),
          0 0 16px rgba(0, 255, 255, 0.4);
        will-change: transform;
        -webkit-text-stroke: 0.7px rgba(255,255,255,0.30);
      }

      .sixseven-digit.six {
        transform-origin: center;
        animation: sixsevenSix 2.2s ease-in-out infinite;
      }

      .sixseven-digit.seven {
        transform-origin: center;
        animation: sixsevenSeven 2.2s ease-in-out infinite;
      }

      @keyframes sixsevenSix {
        0%   { transform: translateY(0em); }
        25%  { transform: translateY(-0.12em); }
        50%  { transform: translateY(0em); }
        75%  { transform: translateY(0.12em); }
        100% { transform: translateY(0em); }
      }

      @keyframes sixsevenSeven {
        0%   { transform: translateY(0em); }
        25%  { transform: translateY(0.12em); }
        50%  { transform: translateY(0em); }
        75%  { transform: translateY(-0.12em); }
        100% { transform: translateY(0em); }
      }
    `;
    document.head.appendChild(style);
  }

  const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "NOSCRIPT"]);

  function shouldSkip(node) {
    if (!node || !node.parentElement) return true;
    const parent = node.parentElement;

    if (SKIP_TAGS.has(parent.tagName)) return true;
    if (parent.closest("[contenteditable='true']")) return true;
    if (parent.closest("button, input, textarea")) return true;
    if (parent.closest(".sixseven-emoji")) return true;

    return false;
  }

  function createSixSevenNode() {
    const span = document.createElement("span");
    span.className = "sixseven-emoji";
    span.setAttribute("aria-label", "Six Seven");
    span.innerHTML = `
      <span class="sixseven-digit six">6</span><span class="sixseven-digit seven">7</span>
    `;
    return span;
  }

  // Só aplica em "67" que NÃO esteja colado em letras ou números
  const SIXSEVEN_REGEX = /(^|[^A-Za-z0-9])67(?=[^A-Za-z0-9]|$)/g;

  function replaceTextNode(textNode) {
    if (shouldSkip(textNode)) return;
    const text = textNode.nodeValue;
    if (!text || !text.includes("67")) return;
    if (textNode.parentElement?.closest(".sixseven-emoji")) return;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    SIXSEVEN_REGEX.lastIndex = 0;

    while ((match = SIXSEVEN_REGEX.exec(text)) !== null) {
      const fullMatchIndex = match.index;
      const prefix = match[1];
      const prefixLength = prefix.length;
      const start67 = fullMatchIndex + prefixLength;
      const end67 = start67 + 2;

      if (start67 > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, start67)));
      }

      frag.appendChild(createSixSevenNode());
      lastIndex = end67;
    }

    if (lastIndex === 0) return;

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.replaceWith(frag);
  }

  function walk(node) {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      replaceTextNode(node);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (SKIP_TAGS.has(node.tagName)) return;
    if (node.classList?.contains("sixseven-emoji")) return;

    const children = [...node.childNodes];
    for (const child of children) {
      walk(child);
    }
  }

  function processPage() {
    injectStyle();
    walk(document.body);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData" && mutation.target) {
        replaceTextNode(mutation.target);
      }

      for (const node of mutation.addedNodes) {
        walk(node);
      }
    }
  });

  function start() {
    processPage();

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();