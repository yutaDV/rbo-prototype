/* ---------------------------------------
   RBO Prototype — app.js (vanilla JS)
   - Page navigation (offers <-> details)
   - Chat open/close + simple echo reply
   - Drag & drop:
     * .js-draggable -> anywhere on screen
     * .js-draggable-in-card -> within card bounds
   - Details amount sync: range <-> input
---------------------------------------- */

(function () {
  // -------------------------
  // Utilities
  // -------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const formatUA = (n) => {
    try {
      return new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(n);
    } catch {
      // fallback
      return String(n);
    }
  };

  const toNumberLoose = (s) => {
    // "1 000 000" -> 1000000
    if (s == null) return NaN;
    const cleaned = String(s).replace(/[^\d]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  };

  // -------------------------
  // Pages
  // -------------------------
  const pageOffers = $("#page-offers");
  const pageDetails = $("#page-details");

  const detailsTitle = $("#details-title");
  const detailsTitleBc = $("#details-title-bc");

  function showPage(name) {
    if (name === "offers") {
      pageOffers.classList.add("page--active");
      pageDetails.classList.remove("page--active");
      setChatContext("Кредити • Персональні пропозиції");
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    if (name === "details") {
      pageOffers.classList.remove("page--active");
      pageDetails.classList.add("page--active");
      setChatContext("Кредити • Деталі пропозиції");
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
  }

  // Offer titles mapping (for details page label)
  const OFFER_TITLES = {
    growth: "Розвиток бізнесу",
    overdraft180: "Овердрафт 180 днів",
    dovira: "Довіра",
  };

  function openDetails(offerKey) {
    // For now — 1 details layout (like screenshot). We just change title text.
    const title = OFFER_TITLES[offerKey] || "Овердрафт 180 днів";
    if (detailsTitle) detailsTitle.textContent = title;
    if (detailsTitleBc) detailsTitleBc.textContent = title;

    showPage("details");
  }

  function backToOffers() {
    showPage("offers");
  }

  // Bind details buttons
  $$(".js-open-details").forEach((btn) => {
    btn.addEventListener("click", () => {
      const offer = btn.getAttribute("data-offer") || "overdraft180";
      openDetails(offer);
    });
  });

  // Back buttons on details
  $$(".js-back").forEach((btn) => btn.addEventListener("click", backToOffers));

  // Default page
  showPage("offers");

  // -------------------------
  // Chat
  // -------------------------
  const chat = $("#chat");
  const chatMsgs = $("#chat-messages");
  const chatInput = $("#chat-input");
  const chatSend = $("#chat-send");
  const chatContext = $("#chat-context");

  function setChatContext(text) {
    if (chatContext) chatContext.textContent = text;
  }

  function openChat() {
    if (!chat) return;
    chat.classList.add("is-open");
    chat.setAttribute("aria-hidden", "false");
    // focus input for demo
    setTimeout(() => chatInput?.focus(), 50);
  }

  function closeChat() {
    if (!chat) return;
    chat.classList.remove("is-open");
    chat.setAttribute("aria-hidden", "true");
  }

  function addMessage(role, text) {
    if (!chatMsgs) return;

    const wrap = document.createElement("div");
    wrap.className = role === "user" ? "msg msg--user" : "msg msg--bot";

    const bubble = document.createElement("div");
    bubble.className = "msg__bubble";
    bubble.textContent = text;

    wrap.appendChild(bubble);
    chatMsgs.appendChild(wrap);

    // scroll to bottom
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }

  function sendChat() {
    const text = (chatInput?.value || "").trim();
    if (!text) return;

    addMessage("user", text);
    chatInput.value = "";

    // Simple “bank-like” stub reply
    setTimeout(() => {
      addMessage(
        "bot",
        "Прийнято ✅ У прототипі відповідаю заглушкою. Напишіть суму/строк/чи є застава — і я підкажу, що виглядає найдоречніше."
      );
    }, 250);
  }

  // Open chat from any entry
  $$(".js-ai-open").forEach((el) => el.addEventListener("click", openChat));

  // Close chat
  $$(".js-chat-close").forEach((el) => el.addEventListener("click", closeChat));

  // Send
  chatSend?.addEventListener("click", sendChat);
  chatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChat();
    if (e.key === "Escape") closeChat();
  });

  // -------------------------
  // Drag & Drop: free (screen)
  // -------------------------
  function enableFreeDrag(el) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    // Ensure positioned for left/top drag
    const ensurePositioning = () => {
      const style = window.getComputedStyle(el);
      if (style.position !== "fixed" && style.position !== "absolute") {
        el.style.position = "fixed";
      }
    };

    const onPointerDown = (e) => {
      // avoid right click
      if (e.button != null && e.button !== 0) return;

      ensurePositioning();
      dragging = true;

      const rect = el.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;

      el.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!dragging) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const rect = el.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      const x = clamp(e.clientX - offsetX, 8, vw - w - 8);
      const y = clamp(e.clientY - offsetY, 8, vh - h - 8);

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.right = "auto";
      el.style.bottom = "auto";
    };

    const onPointerUp = () => {
      dragging = false;
    };

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  $$(".js-draggable").forEach(enableFreeDrag);

  // -------------------------
  // Drag & Drop: inside card bounds
  // -------------------------
  function enableInCardDrag(el) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const onPointerDown = (e) => {
      if (e.button != null && e.button !== 0) return;

      const cardId = el.getAttribute("data-card-id");
      const card = cardId ? document.querySelector(`.offer-card[data-card="${cardId}"]`) : el.closest(".offer-card");
      if (!card) return;

      dragging = true;

      const elRect = el.getBoundingClientRect();
      offsetX = e.clientX - elRect.left;
      offsetY = e.clientY - elRect.top;

      el.setPointerCapture?.(e.pointerId);

      const onMove = (ev) => {
        if (!dragging) return;
        const cardRect = card.getBoundingClientRect();
        const btnRect = el.getBoundingClientRect();

        const w = btnRect.width;
        const h = btnRect.height;

        const x = clamp(ev.clientX - cardRect.left - offsetX, 0, cardRect.width - w);
        const y = clamp(ev.clientY - cardRect.top - offsetY, 0, cardRect.height - h);

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.right = "auto";
        el.style.bottom = "auto";
      };

      const onUp = () => {
        dragging = false;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };

    el.addEventListener("pointerdown", onPointerDown);
  }

  $$(".js-draggable-in-card").forEach((el) => {
    // make sure it's absolutely positioned within card
    el.style.position = "absolute";
    enableInCardDrag(el);
  });

  // -------------------------
  // Details: amount sync (range <-> input)
  // -------------------------
  const amountRange = $("#amountRange");
  const amountInput = $("#amountInput");

  function setAmountUI(n) {
    if (!Number.isFinite(n)) return;

    // clamp to slider bounds if possible
    const min = amountRange ? Number(amountRange.min) : 0;
    const max = amountRange ? Number(amountRange.max) : n;

    const value = clamp(n, min, max);

    if (amountRange) amountRange.value = String(value);
    if (amountInput) amountInput.value = String(value);
  }

  amountRange?.addEventListener("input", () => {
    const n = Number(amountRange.value);
    setAmountUI(n);
  });

  amountInput?.addEventListener("input", () => {
    const n = toNumberLoose(amountInput.value);
    if (Number.isFinite(n)) {
      setAmountUI(n);
    }
  });

  amountInput?.addEventListener("blur", () => {
    // On blur, normalize number string (optional)
    const n = toNumberLoose(amountInput.value);
    if (Number.isFinite(n)) amountInput.value = String(n);
  });

  // -------------------------
  // Small UX: ESC closes chat if open
  // -------------------------
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeChat();
  });

})();
