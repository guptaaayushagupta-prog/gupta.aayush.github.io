/* Web explorer add-on. Does not bypass website embedding restrictions. */
(() => {
  "use strict";
  if (document.getElementById("rp-browser-launch")) return;

  const scriptURL = document.currentScript ? document.currentScript.src : document.baseURI;
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = new URL("portfolio-browser.css", scriptURL).href;
  document.head.appendChild(style);

  const launch = document.createElement("button");
  launch.type = "button";
  launch.id = "rp-browser-launch";
  launch.className = "rp-browser-launch";
  launch.textContent = "↗ Web explorer";
  launch.setAttribute("aria-haspopup", "dialog");
  launch.setAttribute("aria-controls", "rp-browser");
  launch.setAttribute("aria-expanded", "false");
  const footer = document.querySelector("footer .foot-inner, footer .footer-inner, footer") || document.body;
  footer.appendChild(launch);

  const overlay = document.createElement("div");
  overlay.id = "rp-browser";
  overlay.className = "rp-browser";
  overlay.hidden = true;
  overlay.innerHTML = [
    '<div class="rp-browser-shade"></div>',
    '<section class="rp-browser-window" role="dialog" aria-modal="true" aria-labelledby="rp-browser-title">',
      '<div class="rp-browser-top"><div class="rp-browser-brand">',
        '<div class="rp-browser-mark" aria-hidden="true">↗</div>',
        '<div><strong id="rp-browser-title">Web explorer</strong><small>Research portfolio</small></div>',
      '</div><button type="button" class="rp-browser-icon rp-browser-close" aria-label="Close web explorer">✕</button></div>',
      '<form id="rp-browser-form" class="rp-browser-toolbar" autocomplete="off">',
        '<button type="button" class="rp-browser-icon rp-browser-back" aria-label="Previous address" title="Previous address" disabled>←</button>',
        '<button type="button" class="rp-browser-icon rp-browser-next" aria-label="Next address" title="Next address" disabled>→</button>',
        '<button type="button" class="rp-browser-icon rp-browser-reload" aria-label="Reload current address" title="Reload" disabled>↻</button>',
        '<label for="rp-browser-address" class="rp-browser-visually-hidden">Search or website address</label>',
        '<input id="rp-browser-address" aria-label="Search or website address" spellcheck="false" maxlength="2000" placeholder="Search the web or enter a website address">',
        '<button class="rp-browser-go" type="submit">Go →</button>',
      '</form>',
      '<div class="rp-browser-content">',
        '<div class="rp-browser-home" id="rp-browser-home">',
          '<span class="rp-browser-home-icon" aria-hidden="true">⌕</span>',
          '<p class="rp-browser-eyebrow">WEB EXPLORER</p>',
          '<h2>Where would you like to go?</h2>',
          '<p>Search or enter an address. Sites that permit embedded viewing will appear here.</p>',
          '<div class="rp-browser-quicklinks">',
            '<button type="button" data-address="pubmed.ncbi.nlm.nih.gov">PubMed</button>',
            '<button type="button" data-address="wikipedia.org">Wikipedia</button>',
            '<button type="button" data-address="instagram.com">Instagram</button>',
          '</div>',
        '</div>',
        '<iframe class="rp-browser-frame" id="rp-browser-frame" title="External web page" referrerpolicy="strict-origin-when-cross-origin" hidden></iframe>',
      '</div>',
      '<div class="rp-browser-bottom">',
        '<p>ⓘ Some websites, including social media, block embedded pages. If a page is blank or refuses to connect, use <strong>View in this tab</strong>.</p>',
        '<button type="button" id="rp-browser-direct" class="rp-browser-direct" disabled>View in this tab ↗</button>',
      '</div>',
    '</section>'
  ].join("");
  document.body.appendChild(overlay);

  const $ = selector => overlay.querySelector(selector);
  const addressInput = $("#rp-browser-address");
  const frame = $("#rp-browser-frame");
  const home = $("#rp-browser-home");
  const back = $(".rp-browser-back");
  const next = $(".rp-browser-next");
  const reload = $(".rp-browser-reload");
  const direct = $("#rp-browser-direct");
  let entries = [];
  let index = -1;
  let previousFocus = null;

  function destination(value) {
    const entered = value.trim();
    if (!entered) return null;
    const isAddress = /^https?:\/\//i.test(entered) ||
      /^(?:www\.)?[^\s/]+\.[a-z]{2,}(?:[/?#]|$)/i.test(entered);
    if (!isAddress) {
      const q = encodeURIComponent(entered);
      return {
        label: entered,
        embedded: "https://www.google.com/search?igu=1&q=" + q,
        direct: "https://www.google.com/search?q=" + q
      };
    }
    try {
      const parsed = new URL(/^https?:\/\//i.test(entered) ? entered : "https://" + entered);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      if (!parsed.hostname || parsed.username || parsed.password) return null;
      parsed.protocol = "https:";
      return {label: parsed.href, embedded: parsed.href, direct: parsed.href};
    } catch (_) {
      return null;
    }
  }
  function refreshControls() {
    back.disabled = index <= 0;
    next.disabled = index === -1 || index >= entries.length - 1;
    reload.disabled = index < 0;
    direct.disabled = index < 0;
  }
  function show(entry) {
    addressInput.value = entry.label;
    home.hidden = true;
    frame.hidden = false;
    frame.src = entry.embedded;
    refreshControls();
  }
  function go(raw) {
    const entry = destination(raw);
    if (!entry) {
      addressInput.setCustomValidity("Enter a search term or valid web address.");
      addressInput.reportValidity();
      return;
    }
    addressInput.setCustomValidity("");
    entries = entries.slice(0, index + 1);
    entries.push(entry);
    index = entries.length - 1;
    show(entry);
  }
  function openPanel() {
    previousFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("rp-browser-open");
    launch.setAttribute("aria-expanded", "true");
    addressInput.focus();
  }
  function closePanel() {
    overlay.hidden = true;
    document.body.classList.remove("rp-browser-open");
    launch.setAttribute("aria-expanded", "false");
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }
  launch.addEventListener("click", openPanel);
  $(".rp-browser-close").addEventListener("click", closePanel);
  $(".rp-browser-shade").addEventListener("click", closePanel);
  $("#rp-browser-form").addEventListener("submit", event => {
    event.preventDefault();
    go(addressInput.value);
  });
  addressInput.addEventListener("input", () => addressInput.setCustomValidity(""));
  back.addEventListener("click", () => { if (index > 0) show(entries[--index]); });
  next.addEventListener("click", () => { if (index < entries.length - 1) show(entries[++index]); });
  reload.addEventListener("click", () => { if (index >= 0) frame.src = entries[index].embedded; });
  direct.addEventListener("click", () => {
    if (index >= 0) window.location.assign(entries[index].direct);
  });
  home.querySelectorAll("[data-address]").forEach(button =>
    button.addEventListener("click", () => go(button.dataset.address)));
  document.addEventListener("keydown", event => {
    if (overlay.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
      return;
    }
    if (event.key === "Tab") {
      const focusables = [...overlay.querySelectorAll("button:not(:disabled), input:not(:disabled)")]
        .filter(el => !el.closest("[hidden]"));
      if (!focusables.length) return;
      if (event.shiftKey && document.activeElement === focusables[0]) {
        event.preventDefault();
        focusables[focusables.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === focusables[focusables.length - 1]) {
        event.preventDefault();
        focusables[0].focus();
      }
    }
  });
})();