const STORAGE_KEY = "kp-fog-app-v1";

const DEFAULT_STATE = {
  quoteNumber: "64",
  objectName: "Бейбарыс",
  cityName: "Астана",
  nozzleCount: 40,
  pipeLength: 40,
  settings: {
    pumpPrice1: 280000,
    pumpPrice2: 300000,
    pumpPrice3: 320000,
    pumpPrice4: 360000,
    pumpPrice5: 400000,
    adapterPrice: 1000,
    pipePrice: 1600,
    fittingPrice: 3500,
    nozzlePrice: 2600,
    plugPrice: 2600,
    installationPrice: 110000,
    filterPrice: 7000,
  },
};

const fields = {
  quoteNumber: document.querySelector("#quote-number"),
  objectName: document.querySelector("#object-name"),
  cityName: document.querySelector("#city-name"),
  nozzleCount: document.querySelector("#nozzle-count"),
  pipeLength: document.querySelector("#pipe-length"),
  pumpPrice1: document.querySelector("#price-pump-1"),
  pumpPrice2: document.querySelector("#price-pump-2"),
  pumpPrice3: document.querySelector("#price-pump-3"),
  pumpPrice4: document.querySelector("#price-pump-4"),
  pumpPrice5: document.querySelector("#price-pump-5"),
  pipePrice: document.querySelector("#price-pipe"),
  fittingPrice: document.querySelector("#price-fitting"),
  nozzlePrice: document.querySelector("#price-nozzle"),
  installationPrice: document.querySelector("#price-installation"),
};

const preview = document.querySelector("#quote-preview");
const summaryFittings = document.querySelector("#summary-fittings");
const summaryPump = document.querySelector("#summary-pump");
const summaryPipe = document.querySelector("#summary-pipe");
const summaryTotal = document.querySelector("#summary-total");
const statusLine = document.querySelector("#status-line");
const prevQuoteButton = document.querySelector("#prev-quote-button");
const nextQuoteButton = document.querySelector("#next-quote-button");
let isPreparingWhatsappPdf = false;
let isPreparingDownloadPdf = false;

let state = loadState();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      ...DEFAULT_STATE,
      ...saved,
      settings: {
        ...DEFAULT_STATE.settings,
        ...(saved?.settings || {}),
      },
    };
  } catch {
    return clone(DEFAULT_STATE);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function numberFromField(value, fallback = 0) {
  const normalized = String(value).replace(/\s+/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function wholeNumber(value, fallback = 1) {
  return Math.max(1, Math.round(numberFromField(value, fallback)));
}

function integerFromValue(value, fallback = 1) {
  const parsed = Math.round(numberFromField(value, fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function positiveNumber(value, fallback = 1) {
  return Math.max(0.1, numberFromField(value, fallback));
}

function money(value) {
  return new Intl.NumberFormat("ru-KZ", {
    maximumFractionDigits: 0,
  }).format(Math.round(value)) + " ₸";
}

function plainNumber(value) {
  return new Intl.NumberFormat("ru-KZ", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function quantity(value) {
  return new Intl.NumberFormat("ru-KZ", {
    maximumFractionDigits: 1,
  }).format(value);
}

function dateRu(date = new Date()) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function literWord(value) {
  const n = Math.abs(value) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return "литров";
  if (n1 > 1 && n1 < 5) return "литра";
  if (n1 === 1) return "литр";
  return "литров";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shiftQuoteNumber(direction) {
  const current = String(state.quoteNumber || DEFAULT_STATE.quoteNumber);
  const match = current.match(/^(.*?)(\d+)(\D*)$/);
  if (match) {
    const [, prefix, digits, suffix] = match;
    const next = Math.max(1, Number(digits) + direction);
    state.quoteNumber = `${prefix}${String(next).padStart(digits.length, "0")}${suffix}`;
  } else {
    state.quoteNumber = String(Math.max(1, integerFromValue(DEFAULT_STATE.quoteNumber, 1) + direction));
  }
  fields.quoteNumber.value = state.quoteNumber;
  saveState();
  renderQuote();
  setStatus(`Номер КП: ${state.quoteNumber}`);
}

function pumpForNozzles(nozzleCount, settings) {
  if (nozzleCount <= 20) return { liters: 1, price: settings.pumpPrice1 };
  if (nozzleCount <= 40) return { liters: 2, price: settings.pumpPrice2 };
  if (nozzleCount <= 55) return { liters: 3, price: settings.pumpPrice3 };
  if (nozzleCount <= 100) return { liters: 4, price: settings.pumpPrice4 };
  return { liters: 5, price: settings.pumpPrice5 };
}

function calculateQuote() {
  const nozzleCount = wholeNumber(state.nozzleCount, DEFAULT_STATE.nozzleCount);
  const pipeLength = positiveNumber(state.pipeLength, DEFAULT_STATE.pipeLength);
  const settings = state.settings;
  const fittings = nozzleCount;
  const pump = pumpForNozzles(nozzleCount, settings);

  const rows = [
    {
      name: "Переходник Slip Lock",
      description: 'Никелированная латунь · резьба 1/4" · сталь · до 120 бар',
      qty: 1,
      unit: "шт",
      price: settings.adapterPrice,
    },
    {
      name: "Трубка высокого давления",
      description: "Давление: 120 бар максимум",
      qty: pipeLength,
      unit: "м",
      price: settings.pipePrice,
    },
    {
      name: "Slip Lock фитинг для одной форсунки",
      description: "Материал: никелированная латунь. Труба: сталь. Давление: 120 бар максимум",
      qty: fittings,
      unit: "шт",
      price: settings.fittingPrice,
    },
    {
      name: "Форсунка высокого давления с фильтром",
      description: "Отверстие #1 — 0,1 мм · противокапельная система · керамический сердечник · латунь",
      qty: nozzleCount,
      unit: "шт",
      price: settings.nozzlePrice,
    },
    {
      name: "Заглушка для стальной трубы",
      description: 'Никелированная латунь · 3/8" (9.52 мм) · сталь · до 120 бар',
      qty: 1,
      unit: "шт",
      price: settings.plugPrice,
    },
    {
      name: "Монтаж системы",
      description: "Установка оборудования, труб, фитингов и форсунок",
      qty: 1,
      unit: "шт",
      price: settings.installationPrice,
    },
    {
      name: "Насос туманообразования",
      description: `Высокого давления, ${pump.liters} ${literWord(pump.liters)}`,
      qty: 1,
      unit: "шт",
      price: pump.price,
    },
    {
      name: "Фильтр грубой очистки воды",
      description: "Предварительная водоподготовка",
      qty: 1,
      unit: "шт",
      price: settings.filterPrice,
    },
  ].map((row) => ({
    ...row,
    sum: row.qty * row.price,
  }));

  const total = rows.reduce((sum, row) => sum + row.sum, 0);

  return {
    rows,
    total,
    nozzleCount,
    pipeLength,
    fittings,
    pumpLiters: pump.liters,
  };
}

function renderQuote() {
  const quote = calculateQuote();
  const quoteNumber = state.quoteNumber || DEFAULT_STATE.quoteNumber;
  const objectName = state.objectName || DEFAULT_STATE.objectName;
  const cityName = state.cityName || DEFAULT_STATE.cityName;
  const today = dateRu();

  summaryFittings.textContent = plainNumber(quote.fittings);
  summaryPump.textContent = `${quote.pumpLiters} л`;
  summaryPipe.textContent = `${quantity(quote.pipeLength)} м`;
  summaryTotal.textContent = money(quote.total);

  const rowsHtml = quote.rows
    .map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td class="item-name"><strong>${escapeHtml(row.name)}</strong><span>${escapeHtml(row.description)}</span></td>
        <td>${quantity(row.qty)}</td>
        <td>${escapeHtml(row.unit)}</td>
        <td>${money(row.price)}</td>
        <td>${money(row.sum)}</td>
      </tr>
    `)
    .join("");

  preview.innerHTML = `
    <header class="doc-header">
      <div class="doc-company">
        <div class="doc-logo"><img src="logo.png" alt="" /></div>
        <div>
          <strong>ИП «Бауыржан»</strong>
          <span>Системы туманообразования высокого давления</span>
        </div>
      </div>
      <div class="doc-contact">
        <strong>+7 (701) 988-80-25</strong><br />
        adilnug@gmail.com<br />
        г. Астана, ул. Аягоз, 1
      </div>
    </header>

    <section class="doc-title">
      <h2>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h2>
      <p>Поставка и монтаж системы туманообразования «под ключ»</p>
    </section>

    <section class="meta-grid">
      <div class="meta-cell">
        <span>Исходящий</span>
        <strong>№ ${escapeHtml(quoteNumber)} от ${today}</strong>
      </div>
      <div class="meta-cell">
        <span>Объект</span>
        <strong>${escapeHtml(objectName)}</strong>
      </div>
      <div class="meta-cell">
        <span>Город</span>
        <strong>${escapeHtml(cityName)}</strong>
      </div>
    </section>

    <p class="intro">ИП «Бауыржан» предлагает выполнить поставку и профессиональный монтаж системы туманообразования высокого давления. Все цены указаны в тенге (₸) с учётом материалов.</p>

    <table class="items-table">
      <thead>
        <tr>
          <th>№</th>
          <th>Наименование</th>
          <th>Кол-во</th>
          <th>Ед.</th>
          <th>Цена</th>
          <th>Сумма</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="5">ИТОГО</td>
          <td>${money(quote.total)}</td>
        </tr>
      </tfoot>
    </table>

    <section class="work-list">
      <h3>СОСТАВ РАБОТ</h3>
      <ul>
        <li>Монтаж насосного оборудования высокого давления</li>
        <li>Установка системы водоподготовки и фильтрации</li>
        <li>Прокладка труб высокого давления</li>
        <li>Монтаж фитингов и форсунок</li>
        <li>Подключение к водопроводу и пусконаладка системы</li>
      </ul>
    </section>

    <p class="closing">Будем рады сотрудничеству и готовы подобрать оптимальное решение под Ваш объект.</p>

    <section class="signature">
      <div>
        <span>Индивидуальный предприниматель Бауыржан С. А.</span>
        <span>______________________</span>
      </div>
      <img class="stamp-image" src="stamp.png" alt="Печать ИП «Бауыржан»" />
    </section>

    <footer class="doc-footer">ИП «Бауыржан» · Системы туманообразования</footer>
  `;
}

function syncFieldsFromState() {
  fields.quoteNumber.value = state.quoteNumber;
  fields.objectName.value = state.objectName;
  fields.cityName.value = state.cityName;
  fields.nozzleCount.value = state.nozzleCount;
  fields.pipeLength.value = state.pipeLength;
  fields.pumpPrice1.value = state.settings.pumpPrice1;
  fields.pumpPrice2.value = state.settings.pumpPrice2;
  fields.pumpPrice3.value = state.settings.pumpPrice3;
  fields.pumpPrice4.value = state.settings.pumpPrice4;
  fields.pumpPrice5.value = state.settings.pumpPrice5;
  fields.pipePrice.value = state.settings.pipePrice;
  fields.fittingPrice.value = state.settings.fittingPrice;
  fields.nozzlePrice.value = state.settings.nozzlePrice;
  fields.installationPrice.value = state.settings.installationPrice;
}

function updateStateFromField(event) {
  const target = event.target;
  if (target === fields.quoteNumber) state.quoteNumber = target.value.trim();
  if (target === fields.objectName) state.objectName = target.value.trim();
  if (target === fields.cityName) state.cityName = target.value.trim();
  if (target === fields.nozzleCount) state.nozzleCount = wholeNumber(target.value, DEFAULT_STATE.nozzleCount);
  if (target === fields.pipeLength) state.pipeLength = positiveNumber(target.value, DEFAULT_STATE.pipeLength);
  if (target === fields.pumpPrice1) state.settings.pumpPrice1 = numberFromField(target.value, DEFAULT_STATE.settings.pumpPrice1);
  if (target === fields.pumpPrice2) state.settings.pumpPrice2 = numberFromField(target.value, DEFAULT_STATE.settings.pumpPrice2);
  if (target === fields.pumpPrice3) state.settings.pumpPrice3 = numberFromField(target.value, DEFAULT_STATE.settings.pumpPrice3);
  if (target === fields.pumpPrice4) state.settings.pumpPrice4 = numberFromField(target.value, DEFAULT_STATE.settings.pumpPrice4);
  if (target === fields.pumpPrice5) state.settings.pumpPrice5 = numberFromField(target.value, DEFAULT_STATE.settings.pumpPrice5);
  if (target === fields.pipePrice) state.settings.pipePrice = numberFromField(target.value, DEFAULT_STATE.settings.pipePrice);
  if (target === fields.fittingPrice) state.settings.fittingPrice = numberFromField(target.value, DEFAULT_STATE.settings.fittingPrice);
  if (target === fields.nozzlePrice) state.settings.nozzlePrice = numberFromField(target.value, DEFAULT_STATE.settings.nozzlePrice);
  if (target === fields.installationPrice) state.settings.installationPrice = numberFromField(target.value, DEFAULT_STATE.settings.installationPrice);
  saveState();
  renderQuote();
}

function quoteAsFormattedText() {
  const quote = calculateQuote();
  const quoteNumber = state.quoteNumber || DEFAULT_STATE.quoteNumber;
  const objectName = state.objectName || DEFAULT_STATE.objectName;
  const cityName = state.cityName || DEFAULT_STATE.cityName;
  const lines = [
    "ИП «Бауыржан»",
    "Системы туманообразования высокого давления",
    "+7 (701) 988-80-25",
    "adilnug@gmail.com",
    "г. Астана, ул. Аягоз, 1",
    "",
    "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ",
    "Поставка и монтаж системы туманообразования «под ключ»",
    "",
    `Исходящий:\t№ ${quoteNumber} от ${dateRu()}`,
    `Объект:\t${objectName}`,
    `Город:\t${cityName}`,
    "",
    "ИП «Бауыржан» предлагает выполнить поставку и профессиональный монтаж системы туманообразования высокого давления. Все цены указаны в тенге (₸) с учётом материалов.",
    "",
    ["№", "Наименование", "Описание", "Кол-во", "Ед.", "Цена", "Сумма"].join("\t"),
    ...quote.rows.map((row, index) => [
      index + 1,
      row.name,
      row.description,
      quantity(row.qty),
      row.unit,
      money(row.price),
      money(row.sum),
    ].join("\t")),
    "",
    `ИТОГО: ${money(quote.total)}`,
    "",
    "СОСТАВ РАБОТ",
    "• Монтаж насосного оборудования высокого давления",
    "• Установка системы водоподготовки и фильтрации",
    "• Прокладка труб высокого давления",
    "• Монтаж фитингов и форсунок",
    "• Подключение к водопроводу и пусконаладка системы",
    "",
    "Будем рады сотрудничеству и готовы подобрать оптимальное решение под Ваш объект.",
    "",
    "Индивидуальный предприниматель Бауыржан С. А.",
    "Подпись: ______________________",
    "Печать: ИП «Бауыржан» / TUMAN PRO",
  ];
  return lines.join("\n");
}

function assetUrl(fileName) {
  return new URL(fileName, window.location.href).href;
}

function quoteAsHtml() {
  const quote = calculateQuote();
  const quoteNumber = state.quoteNumber || DEFAULT_STATE.quoteNumber;
  const objectName = state.objectName || DEFAULT_STATE.objectName;
  const cityName = state.cityName || DEFAULT_STATE.cityName;
  const rowsHtml = quote.rows
    .map((row, index) => `
      <tr>
        <td style="padding:8px;border:1px solid #d5e2e5;text-align:center;">${index + 1}</td>
        <td style="padding:8px;border:1px solid #d5e2e5;"><strong>${escapeHtml(row.name)}</strong><br><span style="color:#64747b;">${escapeHtml(row.description)}</span></td>
        <td style="padding:8px;border:1px solid #d5e2e5;text-align:right;">${quantity(row.qty)}</td>
        <td style="padding:8px;border:1px solid #d5e2e5;text-align:center;">${escapeHtml(row.unit)}</td>
        <td style="padding:8px;border:1px solid #d5e2e5;text-align:right;">${money(row.price)}</td>
        <td style="padding:8px;border:1px solid #d5e2e5;text-align:right;font-weight:700;">${money(row.sum)}</td>
      </tr>
    `)
    .join("");

  return `
    <article style="max-width:760px;color:#182227;background:#ffffff;font-family:Arial,Helvetica,sans-serif;line-height:1.35;">
      <header style="display:flex;justify-content:space-between;gap:18px;align-items:center;background:#0b3c49;color:#ffffff;padding:16px;border-radius:8px;">
        <div style="display:flex;gap:12px;align-items:center;">
          <img src="${assetUrl("logo.png")}" alt="" style="width:52px;height:52px;border-radius:50%;object-fit:cover;">
          <div>
            <div style="font-size:18px;font-weight:700;">ИП «Бауыржан»</div>
            <div style="color:#bfe0e7;font-size:12px;">Системы туманообразования высокого давления</div>
          </div>
        </div>
        <div style="color:#bfe0e7;font-size:12px;text-align:right;">
          <strong style="color:#ffffff;">+7 (701) 988-80-25</strong><br>
          adilnug@gmail.com<br>
          г. Астана, ул. Аягоз, 1
        </div>
      </header>

      <h1 style="margin:30px 0 6px;font-size:30px;line-height:1.05;">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
      <p style="margin:0 0 18px;color:#64747b;">Поставка и монтаж системы туманообразования «под ключ»</p>

      <table style="width:100%;border-collapse:collapse;margin:0 0 18px;">
        <tr>
          <td style="padding:10px;border:1px solid #d5e2e5;"><span style="color:#64747b;font-size:12px;text-transform:uppercase;">Исходящий</span><br><strong>№ ${escapeHtml(quoteNumber)} от ${dateRu()}</strong></td>
          <td style="padding:10px;border:1px solid #d5e2e5;"><span style="color:#64747b;font-size:12px;text-transform:uppercase;">Объект</span><br><strong>${escapeHtml(objectName)}</strong></td>
          <td style="padding:10px;border:1px solid #d5e2e5;"><span style="color:#64747b;font-size:12px;text-transform:uppercase;">Город</span><br><strong>${escapeHtml(cityName)}</strong></td>
        </tr>
      </table>

      <p>ИП «Бауыржан» предлагает выполнить поставку и профессиональный монтаж системы туманообразования высокого давления. Все цены указаны в тенге (₸) с учётом материалов.</p>

      <table style="width:100%;border-collapse:collapse;margin:18px 0;">
        <thead>
          <tr style="background:#0b3c49;color:#ffffff;">
            <th style="padding:8px;border:1px solid #0b3c49;">№</th>
            <th style="padding:8px;border:1px solid #0b3c49;text-align:left;">Наименование</th>
            <th style="padding:8px;border:1px solid #0b3c49;">Кол-во</th>
            <th style="padding:8px;border:1px solid #0b3c49;">Ед.</th>
            <th style="padding:8px;border:1px solid #0b3c49;">Цена</th>
            <th style="padding:8px;border:1px solid #0b3c49;">Сумма</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="5" style="padding:10px;border:1px solid #d5e2e5;text-align:right;font-weight:800;">ИТОГО</td>
            <td style="padding:10px;border:1px solid #d5e2e5;text-align:right;font-weight:800;">${money(quote.total)}</td>
          </tr>
        </tfoot>
      </table>

      <h2 style="font-size:16px;margin:20px 0 8px;">СОСТАВ РАБОТ</h2>
      <ul>
        <li>Монтаж насосного оборудования высокого давления</li>
        <li>Установка системы водоподготовки и фильтрации</li>
        <li>Прокладка труб высокого давления</li>
        <li>Монтаж фитингов и форсунок</li>
        <li>Подключение к водопроводу и пусконаладка системы</li>
      </ul>

      <p>Будем рады сотрудничеству и готовы подобрать оптимальное решение под Ваш объект.</p>

      <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:26px;">
        <div>
          <div>Индивидуальный предприниматель Бауыржан С. А.</div>
          <div>______________________</div>
        </div>
        <img src="${assetUrl("stamp.png")}" alt="Печать ИП «Бауыржан»" style="width:150px;height:150px;object-fit:contain;transform:rotate(-7deg);">
      </div>
    </article>
  `;
}

function copyTextFallback(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}

async function copyQuoteText() {
  const plainText = quoteAsFormattedText();
  const htmlText = quoteAsHtml();

  if (navigator.clipboard?.write && typeof ClipboardItem === "function") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([htmlText], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]);
      setStatus("КП скопировано в HTML и TXT.");
      return;
    } catch {
      // Fall back to plain text below.
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(plainText);
      setStatus("TXT КП скопирован.");
      return;
    } catch {
      // Fall back to the legacy selection API below.
    }
  }

  if (copyTextFallback(plainText)) {
    setStatus("TXT КП скопирован.");
  } else {
    setStatus("Копирование недоступно в этом браузере.");
  }
}

function safeFilePart(value) {
  return String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 60) || "object";
}

function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  const paragraphs = String(text).split("\n");
  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth || !line) {
        line = testLine;
      } else {
        lines.push(line);
        line = word;
      }
    });
    if (line) lines.push(line);
  });
  return lines;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 99) {
  const lines = wrapLines(ctx, text, maxWidth).slice(0, maxLines);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawRightText(ctx, text, x, y) {
  ctx.fillText(text, x - ctx.measureText(text).width, y);
}

function loadBrandImage() {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = "logo.png";
  });
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function drawBrandMark(ctx, image, x, y, size) {
  if (image) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, x, y, size, size);
    ctx.restore();
    return;
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px Arial, Helvetica, sans-serif";
  ctx.fillText("КП", x + 18, y + 20);
}

function drawStamp(ctx, image, x, y, size) {
  if (image) {
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(-0.12);
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.strokeStyle = "#b88a18";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#9a7210";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 22px Arial, Helvetica, sans-serif";
  ctx.fillText("TUMAN PRO", x + size / 2, y + size / 2);
  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
}

function drawPdfFooter(ctx, canvas, margin, pageRight, line, muted, pageNumber) {
  ctx.strokeStyle = line;
  ctx.beginPath();
  ctx.moveTo(margin, canvas.height - 88);
  ctx.lineTo(pageRight, canvas.height - 88);
  ctx.stroke();
  ctx.fillStyle = muted;
  ctx.font = "17px Arial, Helvetica, sans-serif";
  const footer = `ИП «Бауыржан» · Системы туманообразования · Стр. ${pageNumber}`;
  ctx.fillText(footer, canvas.width / 2 - ctx.measureText(footer).width / 2, canvas.height - 62);
}

function createQuoteCanvas(brandImage, stampImage) {
  const quote = calculateQuote();
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext("2d");
  const margin = 74;
  const pageRight = canvas.width - margin;
  const brand = "#0b3c49";
  const tableBrand = "#2e9cb5";
  const ink = "#182227";
  const muted = "#64747b";
  const line = "#c8d5d8";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "top";
  ctx.fillStyle = ink;

  ctx.fillStyle = brand;
  drawRoundedRect(ctx, margin, 70, canvas.width - margin * 2, 118, 8);
  ctx.fill();
  drawBrandMark(ctx, brandImage, margin + 28, 88, 76);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px Arial, Helvetica, sans-serif";
  ctx.fillText("ИП «Бауыржан»", margin + 126, 88);
  ctx.fillStyle = "#bfe0e7";
  ctx.font = "21px Arial, Helvetica, sans-serif";
  ctx.fillText("СИСТЕМЫ ТУМАНООБРАЗОВАНИЯ ВЫСОКОГО ДАВЛЕНИЯ", margin + 126, 132);

  ctx.font = "700 20px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "#ffffff";
  drawRightText(ctx, "+7 (701) 988-80-25", pageRight - 28, 88);
  ctx.font = "20px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "#bfe0e7";
  drawRightText(ctx, "adilnug@gmail.com", pageRight - 28, 118);
  drawRightText(ctx, "г. Астана, ул. Аягоз, 1", pageRight - 28, 148);

  ctx.fillStyle = tableBrand;
  ctx.fillRect(margin, 206, canvas.width - margin * 2, 6);

  ctx.fillStyle = ink;
  ctx.font = "700 46px Arial, Helvetica, sans-serif";
  ctx.fillText("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", margin, 246);
  ctx.fillStyle = muted;
  ctx.font = "24px Arial, Helvetica, sans-serif";
  ctx.fillText("Поставка и монтаж системы туманообразования «под ключ»", margin, 306);

  const metaTop = 366;
  const metaGap = 18;
  const metaWidth = (canvas.width - margin * 2 - metaGap * 2) / 3;
  const meta = [
    ["ИСХОДЯЩИЙ", `№ ${state.quoteNumber || DEFAULT_STATE.quoteNumber} от ${dateRu()}`],
    ["ОБЪЕКТ", state.objectName || DEFAULT_STATE.objectName],
    ["ГОРОД", state.cityName || DEFAULT_STATE.cityName],
  ];
  meta.forEach(([label, value], index) => {
    const x = margin + index * (metaWidth + metaGap);
    drawRoundedRect(ctx, x, metaTop, metaWidth, 98, 12);
    ctx.fillStyle = "#f7fbfc";
    ctx.fill();
    ctx.strokeStyle = "#d5e2e5";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = muted;
    ctx.font = "700 17px Arial, Helvetica, sans-serif";
    ctx.fillText(label, x + 18, metaTop + 20);
    ctx.fillStyle = ink;
    ctx.font = "700 25px Arial, Helvetica, sans-serif";
    drawWrappedText(ctx, value, x + 18, metaTop + 52, metaWidth - 36, 28, 1);
  });

  ctx.fillStyle = ink;
  ctx.font = "21px Arial, Helvetica, sans-serif";
  drawWrappedText(
    ctx,
    "ИП «Бауыржан» предлагает выполнить поставку и профессиональный монтаж системы туманообразования высокого давления. Все цены указаны в тенге (₸) с учётом материалов.",
    margin,
    502,
    canvas.width - margin * 2,
    29,
    3,
  );

  const tableTop = 596;
  const columns = [
    { title: "№", x: margin, w: 52, align: "center" },
    { title: "Наименование", x: margin + 52, w: 534, align: "left" },
    { title: "Кол-во", x: margin + 586, w: 88, align: "center" },
    { title: "Ед.", x: margin + 674, w: 70, align: "center" },
    { title: "Цена", x: margin + 744, w: 140, align: "right" },
    { title: "Сумма", x: margin + 884, w: 208, align: "right" },
  ];
  const tableWidth = columns.reduce((sum, column) => sum + column.w, 0);

  ctx.fillStyle = tableBrand;
  ctx.fillRect(margin, tableTop, tableWidth, 58);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.font = "700 18px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "#ffffff";
  columns.forEach((column) => {
    const textY = tableTop + 18;
    if (column.align === "right") drawRightText(ctx, column.title, column.x + column.w - 16, textY);
    else if (column.align === "center") ctx.fillText(column.title, column.x + column.w / 2 - ctx.measureText(column.title).width / 2, textY);
    else ctx.fillText(column.title, column.x + 14, textY);
  });

  let y = tableTop + 58;
  quote.rows.forEach((row, index) => {
    const nameLines = wrapLines(ctx, row.name, columns[1].w - 28);
    ctx.font = "18px Arial, Helvetica, sans-serif";
    const descriptionLines = wrapLines(ctx, row.description, columns[1].w - 28);
    const rowHeight = Math.max(70, 18 + nameLines.length * 24 + descriptionLines.length * 22 + 10);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(margin, y, tableWidth, rowHeight);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    columns.forEach((column) => ctx.strokeRect(column.x, y, column.w, rowHeight));

    ctx.fillStyle = ink;
    ctx.font = "18px Arial, Helvetica, sans-serif";
    const centerY = y + 24;
    ctx.fillText(String(index + 1), columns[0].x + columns[0].w / 2 - ctx.measureText(String(index + 1)).width / 2, centerY);

    ctx.font = "700 18px Arial, Helvetica, sans-serif";
    let textY = y + 16;
    nameLines.forEach((lineText) => {
      ctx.fillText(lineText, columns[1].x + 14, textY);
      textY += 24;
    });
    ctx.fillStyle = "#42535a";
    ctx.font = "17px Arial, Helvetica, sans-serif";
    descriptionLines.slice(0, 3).forEach((lineText) => {
      ctx.fillText(lineText, columns[1].x + 14, textY);
      textY += 22;
    });

    ctx.fillStyle = ink;
    ctx.font = "18px Arial, Helvetica, sans-serif";
    const values = [quantity(row.qty), row.unit, money(row.price), money(row.sum)];
    ctx.fillText(values[0], columns[2].x + columns[2].w / 2 - ctx.measureText(values[0]).width / 2, centerY);
    ctx.fillText(values[1], columns[3].x + columns[3].w / 2 - ctx.measureText(values[1]).width / 2, centerY);
    drawRightText(ctx, values[2], columns[4].x + columns[4].w - 16, centerY);
    drawRightText(ctx, values[3], columns[5].x + columns[5].w - 16, centerY);

    y += rowHeight;
  });

  ctx.fillStyle = "#f2f8fa";
  ctx.fillRect(margin, y, tableWidth, 58);
  ctx.strokeStyle = line;
  columns.forEach((column) => ctx.strokeRect(column.x, y, column.w, 58));
  ctx.fillStyle = ink;
  ctx.font = "700 22px Arial, Helvetica, sans-serif";
  ctx.fillText("ИТОГО", margin + tableWidth - 320, y + 18);
  drawRightText(ctx, money(quote.total), margin + tableWidth - 16, y + 18);

  drawPdfFooter(ctx, canvas, margin, pageRight, line, muted, 1);
  return [canvas, createQuoteSecondCanvas(brandImage, stampImage)];
}

function createQuoteSecondCanvas(brandImage, stampImage) {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext("2d");
  const margin = 74;
  const pageRight = canvas.width - margin;
  const brand = "#0b3c49";
  const tableBrand = "#2e9cb5";
  const ink = "#182227";
  const muted = "#64747b";
  const line = "#c8d5d8";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "top";

  ctx.fillStyle = brand;
  drawRoundedRect(ctx, margin, 70, canvas.width - margin * 2, 96, 8);
  ctx.fill();
  drawBrandMark(ctx, brandImage, margin + 24, 88, 58);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px Arial, Helvetica, sans-serif";
  ctx.fillText("ИП «Бауыржан»", margin + 96, 92);
  ctx.fillStyle = "#bfe0e7";
  ctx.font = "20px Arial, Helvetica, sans-serif";
  drawRightText(ctx, `КП № ${state.quoteNumber || DEFAULT_STATE.quoteNumber} от ${dateRu()}`, pageRight - 24, 104);
  ctx.fillStyle = tableBrand;
  ctx.fillRect(margin, 184, canvas.width - margin * 2, 6);

  let y = 238;
  ctx.fillStyle = ink;
  ctx.font = "700 24px Arial, Helvetica, sans-serif";
  ctx.fillText("СОСТАВ РАБОТ", margin, y);
  y += 54;
  ctx.font = "21px Arial, Helvetica, sans-serif";
  [
    "Монтаж насосного оборудования высокого давления",
    "Установка системы водоподготовки и фильтрации",
    "Прокладка труб высокого давления",
    "Монтаж фитингов и форсунок",
    "Подключение к водопроводу и пусконаладка системы",
  ].forEach((item) => {
    ctx.fillText(`- ${item}`, margin, y);
    y += 34;
  });

  y += 72;
  ctx.font = "21px Arial, Helvetica, sans-serif";
  drawWrappedText(ctx, "Будем рады сотрудничеству и готовы подобрать оптимальное решение под Ваш объект.", margin, y, canvas.width - margin * 2, 29, 2);
  y += 126;
  ctx.fillText("Индивидуальный предприниматель Бауыржан С. А.", margin, y);
  ctx.fillText("______________________", margin, y + 58);
  drawStamp(ctx, stampImage, pageRight - 204, y - 48, 172);

  drawPdfFooter(ctx, canvas, margin, pageRight, line, muted, 2);
  return canvas;
}

async function canvasToJpegBytes(canvas) {
  if (canvas.toBlob) {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.94));
    if (blob) return new Uint8Array(await blob.arrayBuffer());
  }
  const dataUrl = canvas.toDataURL("image/jpeg", 0.94);
  const binary = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function concatBytes(chunks, totalLength) {
  const result = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });
  return result;
}

function buildPdfFromJpegs(images) {
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let length = 0;
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const firstPageObject = 3;

  function addText(text) {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    length += bytes.length;
  }

  function addBytes(bytes) {
    chunks.push(bytes);
    length += bytes.length;
  }

  function startObject(number) {
    offsets[number] = length;
    addText(`${number} 0 obj\n`);
  }

  addText("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  startObject(1);
  addText("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  startObject(2);
  const pageObjects = images.map((_, index) => firstPageObject + index * 3);
  addText(`<< /Type /Pages /Kids [${pageObjects.map((number) => `${number} 0 R`).join(" ")}] /Count ${images.length} >>\nendobj\n`);

  images.forEach((image, index) => {
    const pageObject = firstPageObject + index * 3;
    const imageObject = pageObject + 1;
    const contentObject = pageObject + 2;
    const imageName = `Im${index}`;

    startObject(pageObject);
    addText(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /${imageName} ${imageObject} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${contentObject} 0 R >>\nendobj\n`);

    startObject(imageObject);
    addText(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`);
    addBytes(image.bytes);
    addText("\nendstream\nendobj\n");

    const stream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/${imageName} Do\nQ\n`;
    const streamLength = encoder.encode(stream).length;
    startObject(contentObject);
    addText(`<< /Length ${streamLength} >>\nstream\n${stream}endstream\nendobj\n`);
  });

  const xrefOffset = length;
  const objectCount = firstPageObject + images.length * 3;
  addText(`xref\n0 ${objectCount}\n0000000000 65535 f \n`);
  for (let i = 1; i < objectCount; i += 1) {
    addText(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
  }
  addText(`trailer\n<< /Size ${objectCount} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return concatBytes(chunks, length);
}

async function createQuotePdfBlob() {
  const [brandImage, stampImage] = await Promise.all([
    loadBrandImage(),
    loadImage("stamp.png"),
  ]);
  const canvases = createQuoteCanvas(brandImage, stampImage);
  const images = await Promise.all(canvases.map(async (canvas) => ({
    bytes: await canvasToJpegBytes(canvas),
    width: canvas.width,
    height: canvas.height,
  })));
  const pdfBytes = buildPdfFromJpegs(images);
  return new Blob([pdfBytes], { type: "application/pdf" });
}

function quoteFileName() {
  const number = safeFilePart(state.quoteNumber || DEFAULT_STATE.quoteNumber);
  const objectName = safeFilePart(state.objectName || DEFAULT_STATE.objectName);
  return `КП_${number}_${objectName}.pdf`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function whatsappText() {
  return [
    "Добрый день!",
    `Направляю коммерческое предложение № ${state.quoteNumber || DEFAULT_STATE.quoteNumber}.`,
    `Объект: ${state.objectName || DEFAULT_STATE.objectName}.`,
    `Итого: ${summaryTotal.textContent}.`,
  ].join("\n");
}

function openWhatsappWithText() {
  const url = `https://wa.me/?text=${encodeURIComponent(whatsappText())}`;
  window.location.href = url;
}

function downloadAndOpenWhatsapp(blob, fileName) {
  downloadBlob(blob, fileName);
  setStatus("PDF сохранен. Открываю WhatsApp...");
  window.setTimeout(openWhatsappWithText, 700);
}

async function saveQuotePdf() {
  if (isPreparingDownloadPdf) return;
  isPreparingDownloadPdf = true;
  const button = document.querySelector("#download-pdf-button");
  button.disabled = true;
  setStatus("Готовлю PDF...");
  try {
    const blob = await createQuotePdfBlob();
    if (navigator.clipboard?.write && typeof ClipboardItem === "function") {
      try {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        setStatus("PDF скопирован в буфер.");
        return;
      } catch {
        // Some browsers expose the API but reject PDF files; save the file instead.
      }
    }
    downloadBlob(blob, quoteFileName());
    setStatus("PDF сохранен.");
  } catch {
    setStatus("Не удалось создать PDF. Попробуйте кнопку «Печать».");
  } finally {
    button.disabled = false;
    isPreparingDownloadPdf = false;
  }
}

async function shareQuotePdf() {
  if (isPreparingWhatsappPdf) return;
  isPreparingWhatsappPdf = true;
  const button = document.querySelector("#share-pdf-button");
  button.disabled = true;
  setStatus("Готовлю PDF...");
  try {
    const blob = await createQuotePdfBlob();
    downloadAndOpenWhatsapp(blob, quoteFileName());
  } catch (error) {
    setStatus("Не удалось создать PDF. Попробуйте кнопку «Печать».");
  } finally {
    button.disabled = false;
    isPreparingWhatsappPdf = false;
  }
}

function setStatus(message) {
  statusLine.textContent = message;
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => {
    statusLine.textContent = "";
  }, 2400);
}

document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", updateStateFromField);
  input.addEventListener("change", updateStateFromField);
});

document.querySelector("#print-button").addEventListener("click", () => {
  window.print();
});

document.querySelector("#download-pdf-button").addEventListener("click", saveQuotePdf);

prevQuoteButton.addEventListener("click", () => shiftQuoteNumber(-1));
nextQuoteButton.addEventListener("click", () => shiftQuoteNumber(1));

document.querySelector("#share-pdf-button").addEventListener("click", shareQuotePdf);

document.querySelector("#copy-button").addEventListener("click", copyQuoteText);

document.querySelector("#reset-settings").addEventListener("click", () => {
  state.settings = clone(DEFAULT_STATE.settings);
  syncFieldsFromState();
  saveState();
  renderQuote();
  setStatus("Цены сброшены.");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

syncFieldsFromState();
renderQuote();
