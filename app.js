const STORAGE_KEY = "kp-fog-app-v1";
const LOGO_SRC = "logo.png";
const STAMP_SRC = "stamp.png";

const DEFAULT_STATE = {
  quoteNumber: "64",
  objectName: "Бейбарыс",
  cityName: "Астана",
  quantities: {
    high: {
      nozzleCount: 40,
      pipeLength: 40,
    },
    low: {
      nozzleCount: 16,
      pipeLength: 18,
    },
  },
  selectedTypes: {
    high: true,
    low: false,
  },
  settings: {
    high: {
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
    low: {
      pipePrice: 800,
      adapterPrice: 1000,
      fittingPrice: 1200,
      nozzlePrice: 2300,
      plugPrice: 1000,
      installationPrice: 60000,
      pumpPrice: 60000,
      tankPrice: 35000,
      plumbingPrepPrice: 7000,
    },
  },
};

const fields = {
  quoteNumber: document.querySelector("#quote-number"),
  objectName: document.querySelector("#object-name"),
  cityName: document.querySelector("#city-name"),
  highNozzleCount: document.querySelector("#high-nozzle-count"),
  highPipeLength: document.querySelector("#high-pipe-length"),
  lowNozzleCount: document.querySelector("#low-nozzle-count"),
  lowPipeLength: document.querySelector("#low-pipe-length"),
  selectedHigh: document.querySelector("#type-high"),
  selectedLow: document.querySelector("#type-low"),
  highPumpPrice1: document.querySelector("#price-high-pump-1"),
  highPumpPrice2: document.querySelector("#price-high-pump-2"),
  highPumpPrice3: document.querySelector("#price-high-pump-3"),
  highPumpPrice4: document.querySelector("#price-high-pump-4"),
  highPumpPrice5: document.querySelector("#price-high-pump-5"),
  highAdapterPrice: document.querySelector("#price-high-adapter"),
  highPipePrice: document.querySelector("#price-high-pipe"),
  highFittingPrice: document.querySelector("#price-high-fitting"),
  highNozzlePrice: document.querySelector("#price-high-nozzle"),
  highPlugPrice: document.querySelector("#price-high-plug"),
  highInstallationPrice: document.querySelector("#price-high-installation"),
  highFilterPrice: document.querySelector("#price-high-filter"),
  lowPipePrice: document.querySelector("#price-low-pipe"),
  lowAdapterPrice: document.querySelector("#price-low-adapter"),
  lowFittingPrice: document.querySelector("#price-low-fitting"),
  lowNozzlePrice: document.querySelector("#price-low-nozzle"),
  lowPlugPrice: document.querySelector("#price-low-plug"),
  lowInstallationPrice: document.querySelector("#price-low-installation"),
  lowPumpPrice: document.querySelector("#price-low-pump"),
  lowTankPrice: document.querySelector("#price-low-tank"),
  lowPlumbingPrepPrice: document.querySelector("#price-low-plumbing-prep"),
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
let isPreparingWordFile = false;

let state = loadState();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function migrateState(saved) {
  const data = saved && typeof saved === "object" ? saved : {};
  const hasNestedSettings = Boolean(data.settings?.high || data.settings?.low);
  const flatSettings = data.settings && !hasNestedSettings ? data.settings : {};
  const highQuantityFallback = {
    nozzleCount: data.nozzleCount ?? DEFAULT_STATE.quantities.high.nozzleCount,
    pipeLength: data.pipeLength ?? DEFAULT_STATE.quantities.high.pipeLength,
  };

  return {
    quoteNumber: data.quoteNumber ?? DEFAULT_STATE.quoteNumber,
    objectName: data.objectName ?? DEFAULT_STATE.objectName,
    cityName: data.cityName ?? DEFAULT_STATE.cityName,
    quantities: {
      high: {
        ...DEFAULT_STATE.quantities.high,
        ...highQuantityFallback,
        ...(data.quantities?.high || {}),
      },
      low: {
        ...DEFAULT_STATE.quantities.low,
        ...(data.quantities?.low || {}),
      },
    },
    selectedTypes: {
      ...DEFAULT_STATE.selectedTypes,
      ...(data.selectedTypes || {}),
    },
    settings: {
      high: {
        ...DEFAULT_STATE.settings.high,
        ...flatSettings,
        ...(data.settings?.high || {}),
      },
      low: {
        ...DEFAULT_STATE.settings.low,
        ...(data.settings?.low || {}),
      },
    },
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return migrateState(saved);
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

function normalizeSelectedTypes() {
  if (!state.selectedTypes.high && !state.selectedTypes.low) {
    state.selectedTypes.high = true;
    if (fields.selectedHigh) fields.selectedHigh.checked = true;
    setStatus("Выберите минимум один тип КП.");
  }
}

function selectedTypeKeys() {
  normalizeSelectedTypes();
  return [
    state.selectedTypes.high ? "high" : null,
    state.selectedTypes.low ? "low" : null,
  ].filter(Boolean);
}

function incrementQuoteNumber(value, offset) {
  const current = String(value || DEFAULT_STATE.quoteNumber);
  const match = current.match(/^(.*?)(\d+)(\D*)$/);
  if (!match) return offset ? `${current}-${offset + 1}` : current;
  const [, prefix, digits, suffix] = match;
  const next = Math.max(1, Number(digits) + offset);
  return `${prefix}${String(next).padStart(digits.length, "0")}${suffix}`;
}

function quoteNumberFor(index) {
  const quoteNumber = state.quoteNumber || DEFAULT_STATE.quoteNumber;
  return incrementQuoteNumber(quoteNumber, index);
}

function pumpForHighNozzles(nozzleCount, settings) {
  if (nozzleCount <= 20) return { liters: 1, price: settings.pumpPrice1 };
  if (nozzleCount <= 40) return { liters: 2, price: settings.pumpPrice2 };
  if (nozzleCount <= 55) return { liters: 3, price: settings.pumpPrice3 };
  if (nozzleCount <= 100) return { liters: 4, price: settings.pumpPrice4 };
  return { liters: 5, price: settings.pumpPrice5 };
}

function calculateHighQuote() {
  const quantityState = state.quantities?.high || DEFAULT_STATE.quantities.high;
  const nozzleCount = wholeNumber(quantityState.nozzleCount, DEFAULT_STATE.quantities.high.nozzleCount);
  const pipeLength = positiveNumber(quantityState.pipeLength, DEFAULT_STATE.quantities.high.pipeLength);
  const settings = state.settings.high;
  const fittings = nozzleCount;
  const pump = pumpForHighNozzles(nozzleCount, settings);

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
    type: "high",
    shortCode: "ВД",
    label: "Высокое давление",
    brandColor: "#0b3c49",
    tableColor: "#2e9cb5",
    mutedColor: "#bfe0e7",
    systemLine: "Системы туманообразования высокого давления",
    titleLine: "Поставка и монтаж системы туманообразования высокого давления «под ключ»",
    intro: "ИП «Бауыржан» предлагает выполнить поставку и профессиональный монтаж системы туманообразования высокого давления. Все цены указаны в тенге (₸) с учётом материалов.",
    workItems: [
      "Монтаж насосного оборудования высокого давления",
      "Установка системы водоподготовки и фильтрации",
      "Прокладка труб высокого давления",
      "Монтаж фитингов и форсунок",
      "Подключение к водопроводу и пусконаладка системы",
    ],
    rows,
    total,
    nozzleCount,
    pipeLength,
    fittings,
    pumpLabel: `${pump.liters} л`,
  };
}

function calculateLowQuote() {
  const quantityState = state.quantities?.low || DEFAULT_STATE.quantities.low;
  const nozzleCount = wholeNumber(quantityState.nozzleCount, DEFAULT_STATE.quantities.low.nozzleCount);
  const pipeLength = positiveNumber(quantityState.pipeLength, DEFAULT_STATE.quantities.low.pipeLength);
  const settings = state.settings.low;
  const fittings = nozzleCount;

  const rows = [
    {
      name: "Труба низкого давления",
      description: "Рабочее давление - до 6 бар",
      qty: pipeLength,
      unit: "м",
      price: settings.pipePrice,
    },
    {
      name: "Переходник Slip Lock",
      description: 'Пластик · резьба 1/4" · сталь · до 10 бар',
      qty: 1,
      unit: "шт",
      price: settings.adapterPrice,
    },
    {
      name: "Фитинг Slip Lock для форсунки",
      description: "Пластик · до 10 бар",
      qty: fittings,
      unit: "шт",
      price: settings.fittingPrice,
    },
    {
      name: "Форсунка низкого давления с фильтром",
      description: "Отверстие #3 - 0,3 мм · противокапельная система · керамический сердечник · латунь",
      qty: nozzleCount,
      unit: "шт",
      price: settings.nozzlePrice,
    },
    {
      name: "Заглушка для трубки",
      description: 'Пластик · 1/4" · до 10 бар',
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
      name: "Насос",
      description: "Низкого давления, 4 бара",
      qty: 1,
      unit: "шт",
      price: settings.pumpPrice,
    },
    {
      name: "Емкость пластиковая, 50 литров",
      description: "Резервуар для воды",
      qty: 1,
      unit: "шт",
      price: settings.tankPrice,
    },
    {
      name: "Сантехническая подготовка",
      description: "Подключение к водопроводу, включая материалы",
      qty: 1,
      unit: "усл.",
      price: settings.plumbingPrepPrice,
    },
  ].map((row) => ({
    ...row,
    sum: row.qty * row.price,
  }));

  const total = rows.reduce((sum, row) => sum + row.sum, 0);

  return {
    type: "low",
    shortCode: "НД",
    label: "Низкое давление",
    brandColor: "#0c4c3f",
    tableColor: "#116b57",
    mutedColor: "#cfe6dd",
    systemLine: "Системы туманообразования низкого давления",
    titleLine: "Поставка и монтаж системы туманообразования низкого давления «под ключ»",
    intro: "ИП «Бауыржан» предлагает выполнить поставку и профессиональный монтаж системы туманообразования низкого давления. Все цены указаны в тенге (₸) с учётом материалов.",
    workItems: [
      "Монтаж насосного оборудования низкого давления",
      "Установка пластиковой емкости для воды",
      "Прокладка трубок низкого давления",
      "Монтаж фитингов и форсунок",
      "Сантехническая подготовка и подключение к водопроводу",
    ],
    rows,
    total,
    nozzleCount,
    pipeLength,
    fittings,
    pumpLabel: "4 бар",
  };
}

function calculateSelectedQuotes() {
  return selectedTypeKeys().map((type) => (type === "high" ? calculateHighQuote() : calculateLowQuote()));
}

function renderQuoteDocumentHtml(quote, displayNumber) {
  const quoteNumber = state.quoteNumber || DEFAULT_STATE.quoteNumber;
  const objectName = state.objectName || DEFAULT_STATE.objectName;
  const cityName = state.cityName || DEFAULT_STATE.cityName;
  const today = dateRu();

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

  return `
    <article class="quote-document quote-${quote.type}" style="--quote-brand: ${quote.brandColor}; --quote-brand-muted: ${quote.mutedColor};">
    <header class="doc-header">
      <div class="doc-company">
        <div class="doc-logo"><img src="${LOGO_SRC}" alt="" /></div>
        <div>
          <strong>ИП «Бауыржан»</strong>
          <span>${escapeHtml(quote.systemLine)}</span>
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
      <p>${escapeHtml(quote.titleLine)}</p>
    </section>

    <section class="meta-grid">
      <div class="meta-cell">
        <span>Исходящий</span>
        <strong>№ ${escapeHtml(displayNumber || quoteNumber)} от ${today}</strong>
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

    <p class="intro">${escapeHtml(quote.intro)}</p>

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
        ${quote.workItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>

    <p class="closing">Будем рады сотрудничеству и готовы подобрать оптимальное решение под Ваш объект.</p>

    <section class="signature">
      <div>
        <span>Индивидуальный предприниматель Бауыржан С. А.</span>
        <span>______________________</span>
      </div>
      <img class="stamp-image" src="${STAMP_SRC}" alt="Печать ИП «Бауыржан»" />
    </section>

    <footer class="doc-footer">ИП «Бауыржан» · Системы туманообразования</footer>
    </article>
  `;
}

function renderQuote() {
  const quotes = calculateSelectedQuotes();
  const total = quotes.reduce((sum, quote) => sum + quote.total, 0);

  summaryFittings.textContent = quotes.map((quote) => `${quote.shortCode} ${plainNumber(quote.fittings)}`).join(" / ");
  summaryPump.textContent = quotes.map((quote) => `${quote.shortCode} ${quote.pumpLabel}`).join(" / ");
  summaryPipe.textContent = quotes.map((quote) => `${quote.shortCode} ${quantity(quote.pipeLength)} м`).join(" / ");
  summaryTotal.textContent = money(total);

  preview.innerHTML = quotes
    .map((quote, index) => renderQuoteDocumentHtml(quote, quoteNumberFor(index)))
    .join("");
}

function syncFieldsFromState() {
  fields.quoteNumber.value = state.quoteNumber;
  fields.objectName.value = state.objectName;
  fields.cityName.value = state.cityName;
  fields.highNozzleCount.value = state.quantities.high.nozzleCount;
  fields.highPipeLength.value = state.quantities.high.pipeLength;
  fields.lowNozzleCount.value = state.quantities.low.nozzleCount;
  fields.lowPipeLength.value = state.quantities.low.pipeLength;
  fields.selectedHigh.checked = state.selectedTypes.high;
  fields.selectedLow.checked = state.selectedTypes.low;
  fields.highPumpPrice1.value = state.settings.high.pumpPrice1;
  fields.highPumpPrice2.value = state.settings.high.pumpPrice2;
  fields.highPumpPrice3.value = state.settings.high.pumpPrice3;
  fields.highPumpPrice4.value = state.settings.high.pumpPrice4;
  fields.highPumpPrice5.value = state.settings.high.pumpPrice5;
  fields.highAdapterPrice.value = state.settings.high.adapterPrice;
  fields.highPipePrice.value = state.settings.high.pipePrice;
  fields.highFittingPrice.value = state.settings.high.fittingPrice;
  fields.highNozzlePrice.value = state.settings.high.nozzlePrice;
  fields.highPlugPrice.value = state.settings.high.plugPrice;
  fields.highInstallationPrice.value = state.settings.high.installationPrice;
  fields.highFilterPrice.value = state.settings.high.filterPrice;
  fields.lowPipePrice.value = state.settings.low.pipePrice;
  fields.lowAdapterPrice.value = state.settings.low.adapterPrice;
  fields.lowFittingPrice.value = state.settings.low.fittingPrice;
  fields.lowNozzlePrice.value = state.settings.low.nozzlePrice;
  fields.lowPlugPrice.value = state.settings.low.plugPrice;
  fields.lowInstallationPrice.value = state.settings.low.installationPrice;
  fields.lowPumpPrice.value = state.settings.low.pumpPrice;
  fields.lowTankPrice.value = state.settings.low.tankPrice;
  fields.lowPlumbingPrepPrice.value = state.settings.low.plumbingPrepPrice;
}

function updateStateFromField(event) {
  const target = event.target;
  if (target === fields.quoteNumber) state.quoteNumber = target.value.trim();
  if (target === fields.objectName) state.objectName = target.value.trim();
  if (target === fields.cityName) state.cityName = target.value.trim();
  if (!state.quantities) state.quantities = clone(DEFAULT_STATE.quantities);
  if (!state.selectedTypes) state.selectedTypes = clone(DEFAULT_STATE.selectedTypes);
  if (!state.settings?.high || !state.settings?.low) state.settings = migrateState(state).settings;
  if (target === fields.highNozzleCount) state.quantities.high.nozzleCount = wholeNumber(target.value, DEFAULT_STATE.quantities.high.nozzleCount);
  if (target === fields.highPipeLength) state.quantities.high.pipeLength = positiveNumber(target.value, DEFAULT_STATE.quantities.high.pipeLength);
  if (target === fields.lowNozzleCount) state.quantities.low.nozzleCount = wholeNumber(target.value, DEFAULT_STATE.quantities.low.nozzleCount);
  if (target === fields.lowPipeLength) state.quantities.low.pipeLength = positiveNumber(target.value, DEFAULT_STATE.quantities.low.pipeLength);
  if (target === fields.selectedHigh) state.selectedTypes.high = target.checked;
  if (target === fields.selectedLow) state.selectedTypes.low = target.checked;
  if (target === fields.highPumpPrice1) state.settings.high.pumpPrice1 = numberFromField(target.value, DEFAULT_STATE.settings.high.pumpPrice1);
  if (target === fields.highPumpPrice2) state.settings.high.pumpPrice2 = numberFromField(target.value, DEFAULT_STATE.settings.high.pumpPrice2);
  if (target === fields.highPumpPrice3) state.settings.high.pumpPrice3 = numberFromField(target.value, DEFAULT_STATE.settings.high.pumpPrice3);
  if (target === fields.highPumpPrice4) state.settings.high.pumpPrice4 = numberFromField(target.value, DEFAULT_STATE.settings.high.pumpPrice4);
  if (target === fields.highPumpPrice5) state.settings.high.pumpPrice5 = numberFromField(target.value, DEFAULT_STATE.settings.high.pumpPrice5);
  if (target === fields.highAdapterPrice) state.settings.high.adapterPrice = numberFromField(target.value, DEFAULT_STATE.settings.high.adapterPrice);
  if (target === fields.highPipePrice) state.settings.high.pipePrice = numberFromField(target.value, DEFAULT_STATE.settings.high.pipePrice);
  if (target === fields.highFittingPrice) state.settings.high.fittingPrice = numberFromField(target.value, DEFAULT_STATE.settings.high.fittingPrice);
  if (target === fields.highNozzlePrice) state.settings.high.nozzlePrice = numberFromField(target.value, DEFAULT_STATE.settings.high.nozzlePrice);
  if (target === fields.highPlugPrice) state.settings.high.plugPrice = numberFromField(target.value, DEFAULT_STATE.settings.high.plugPrice);
  if (target === fields.highInstallationPrice) state.settings.high.installationPrice = numberFromField(target.value, DEFAULT_STATE.settings.high.installationPrice);
  if (target === fields.highFilterPrice) state.settings.high.filterPrice = numberFromField(target.value, DEFAULT_STATE.settings.high.filterPrice);
  if (target === fields.lowPipePrice) state.settings.low.pipePrice = numberFromField(target.value, DEFAULT_STATE.settings.low.pipePrice);
  if (target === fields.lowAdapterPrice) state.settings.low.adapterPrice = numberFromField(target.value, DEFAULT_STATE.settings.low.adapterPrice);
  if (target === fields.lowFittingPrice) state.settings.low.fittingPrice = numberFromField(target.value, DEFAULT_STATE.settings.low.fittingPrice);
  if (target === fields.lowNozzlePrice) state.settings.low.nozzlePrice = numberFromField(target.value, DEFAULT_STATE.settings.low.nozzlePrice);
  if (target === fields.lowPlugPrice) state.settings.low.plugPrice = numberFromField(target.value, DEFAULT_STATE.settings.low.plugPrice);
  if (target === fields.lowInstallationPrice) state.settings.low.installationPrice = numberFromField(target.value, DEFAULT_STATE.settings.low.installationPrice);
  if (target === fields.lowPumpPrice) state.settings.low.pumpPrice = numberFromField(target.value, DEFAULT_STATE.settings.low.pumpPrice);
  if (target === fields.lowTankPrice) state.settings.low.tankPrice = numberFromField(target.value, DEFAULT_STATE.settings.low.tankPrice);
  if (target === fields.lowPlumbingPrepPrice) state.settings.low.plumbingPrepPrice = numberFromField(target.value, DEFAULT_STATE.settings.low.plumbingPrepPrice);
  normalizeSelectedTypes();
  saveState();
  renderQuote();
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PUBLIC_ASSET_BASE_URL = "https://adilnug-orm.github.io/kp-fog-app/";

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wRun(text, options = {}) {
  const props = [
    '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>',
  ];
  if (options.bold) props.push("<w:b/>");
  if (options.color) props.push(`<w:color w:val="${options.color}"/>`);
  if (options.size) props.push(`<w:sz w:val="${options.size}"/>`);
  return `<w:r><w:rPr>${props.join("")}</w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
}

function wParagraph(content = "", options = {}) {
  const props = [];
  if (options.alignment) props.push(`<w:jc w:val="${options.alignment}"/>`);
  if (options.spacing) {
    const before = options.spacing.before || 0;
    const after = options.spacing.after || 0;
    props.push(`<w:spacing w:before="${before}" w:after="${after}"/>`);
  }
  const children = Array.isArray(content) ? content.join("") : content;
  return `<w:p>${props.length ? `<w:pPr>${props.join("")}</w:pPr>` : ""}${children}</w:p>`;
}

function wTableCell(content, width, options = {}) {
  const props = [
    `<w:tcW w:w="${width}" w:type="dxa"/>`,
    '<w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar>',
  ];
  if (options.gridSpan) props.push(`<w:gridSpan w:val="${options.gridSpan}"/>`);
  if (options.fill) props.push(`<w:shd w:val="clear" w:color="auto" w:fill="${options.fill}"/>`);
  if (options.valign) props.push(`<w:vAlign w:val="${options.valign}"/>`);
  const children = Array.isArray(content) ? content.join("") : content;
  return `<w:tc><w:tcPr>${props.join("")}</w:tcPr>${children}</w:tc>`;
}

function wTable(rows, columnWidths, options = {}) {
  const width = columnWidths.reduce((sum, value) => sum + value, 0);
  const border = options.borders === false
    ? '<w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>'
    : '<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="D5E2E5"/><w:left w:val="single" w:sz="4" w:space="0" w:color="D5E2E5"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="D5E2E5"/><w:right w:val="single" w:sz="4" w:space="0" w:color="D5E2E5"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="D5E2E5"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="D5E2E5"/></w:tblBorders>';
  return `
    <w:tbl>
      <w:tblPr><w:tblW w:w="${width}" w:type="dxa"/>${border}<w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0"/></w:tblPr>
      <w:tblGrid>${columnWidths.map((columnWidth) => `<w:gridCol w:w="${columnWidth}"/>`).join("")}</w:tblGrid>
      ${rows.map((row) => `<w:tr>${row.join("")}</w:tr>`).join("")}
    </w:tbl>
  `;
}

let docxImageId = 1;

function pxToEmu(value) {
  return Math.round(value * 9525);
}

function wImage(rId, name, width, height) {
  const id = docxImageId;
  docxImageId += 1;
  const cx = pxToEmu(width);
  const cy = pxToEmu(height);
  const safeName = xmlEscape(name);
  return `
    <w:r>
      <w:drawing>
        <wp:inline distT="0" distB="0" distL="0" distR="0">
          <wp:extent cx="${cx}" cy="${cy}"/>
          <wp:docPr id="${id}" name="${safeName}" descr="${safeName}"/>
          <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic>
                <pic:nvPicPr><pic:cNvPr id="${id}" name="${safeName}"/><pic:cNvPicPr/></pic:nvPicPr>
                <pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
                <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:inline>
      </w:drawing>
    </w:r>
  `;
}

function docxColor(value, fallback = "0B3C49") {
  return String(value || fallback).replace("#", "").toUpperCase();
}

function appendQuoteDocxBody(body, quote, displayNumber, { hasLogo, hasStamp }) {
  const objectName = state.objectName || DEFAULT_STATE.objectName;
  const cityName = state.cityName || DEFAULT_STATE.cityName;
  const brand = docxColor(quote.brandColor);
  const tableBrand = docxColor(quote.tableColor || quote.brandColor);
  const brandMuted = docxColor(quote.mutedColor, "BFE0E7");
  const muted = "64747B";
  const light = "F7FBFC";
  const contentWidth = 10460;

  body.push(wTable([[
    wTableCell(
      hasLogo
        ? wParagraph(wImage("rIdLogo", "TUMAN PRO", 54, 54), { alignment: "center" })
        : wParagraph(wRun("TUMAN PRO", { bold: true, color: "FFFFFF", size: 18 }), { alignment: "center" }),
      900,
      { fill: brand, valign: "center" },
    ),
    wTableCell([
      wParagraph(wRun("ИП «Бауыржан»", { bold: true, color: "FFFFFF", size: 28 }), { spacing: { after: 60 } }),
      wParagraph(wRun(quote.systemLine, { color: brandMuted, size: 18 })),
    ], 5600, { fill: brand, valign: "center" }),
    wTableCell([
      wParagraph(wRun("+7 (701) 988-80-25", { bold: true, color: "FFFFFF", size: 20 }), { alignment: "right" }),
      wParagraph(wRun("adilnug@gmail.com", { color: brandMuted, size: 18 }), { alignment: "right" }),
      wParagraph(wRun("г. Астана, ул. Аягоз, 1", { color: brandMuted, size: 18 }), { alignment: "right" }),
    ], 3960, { fill: brand, valign: "center" }),
  ]], [900, 5600, 3960], { borders: false }));

  body.push(wParagraph("", { spacing: { after: 260 } }));
  body.push(wParagraph(wRun("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", { bold: true, size: 44 }), { spacing: { after: 80 } }));
  body.push(wParagraph(wRun(quote.titleLine, { color: muted, size: 22 }), { spacing: { after: 220 } }));

  body.push(wTable([[
    wTableCell([
      wParagraph(wRun("ИСХОДЯЩИЙ", { bold: true, color: muted, size: 16 }), { spacing: { after: 40 } }),
      wParagraph(wRun(`№ ${displayNumber} от ${dateRu()}`, { bold: true, size: 22 })),
    ], 3486, { fill: light }),
    wTableCell([
      wParagraph(wRun("ОБЪЕКТ", { bold: true, color: muted, size: 16 }), { spacing: { after: 40 } }),
      wParagraph(wRun(objectName, { bold: true, size: 22 })),
    ], 3487, { fill: light }),
    wTableCell([
      wParagraph(wRun("ГОРОД", { bold: true, color: muted, size: 16 }), { spacing: { after: 40 } }),
      wParagraph(wRun(cityName, { bold: true, size: 22 })),
    ], 3487, { fill: light }),
  ]], [3486, 3487, 3487]));

  body.push(wParagraph("", { spacing: { after: 180 } }));
  body.push(wParagraph(wRun(quote.intro, { size: 22 }), { spacing: { after: 200 } }));

  const itemWidths = [500, 4420, 840, 650, 2025, 2025];
  const itemRows = [[
    wTableCell(wParagraph(wRun("№", { bold: true, color: "FFFFFF", size: 18 }), { alignment: "center" }), itemWidths[0], { fill: tableBrand, valign: "center" }),
    wTableCell(wParagraph(wRun("Наименование", { bold: true, color: "FFFFFF", size: 18 })), itemWidths[1], { fill: tableBrand, valign: "center" }),
    wTableCell(wParagraph(wRun("Кол-во", { bold: true, color: "FFFFFF", size: 18 }), { alignment: "center" }), itemWidths[2], { fill: tableBrand, valign: "center" }),
    wTableCell(wParagraph(wRun("Ед.", { bold: true, color: "FFFFFF", size: 18 }), { alignment: "center" }), itemWidths[3], { fill: tableBrand, valign: "center" }),
    wTableCell(wParagraph(wRun("Цена", { bold: true, color: "FFFFFF", size: 18 }), { alignment: "right" }), itemWidths[4], { fill: tableBrand, valign: "center" }),
    wTableCell(wParagraph(wRun("Сумма", { bold: true, color: "FFFFFF", size: 18 }), { alignment: "right" }), itemWidths[5], { fill: tableBrand, valign: "center" }),
  ]];

  quote.rows.forEach((row, index) => {
    itemRows.push([
      wTableCell(wParagraph(wRun(String(index + 1), { size: 18 }), { alignment: "center" }), itemWidths[0], { valign: "center" }),
      wTableCell([
        wParagraph(wRun(row.name, { bold: true, size: 18 }), { spacing: { after: 30 } }),
        wParagraph(wRun(row.description, { color: muted, size: 16 })),
      ], itemWidths[1], { valign: "center" }),
      wTableCell(wParagraph(wRun(quantity(row.qty), { size: 18 }), { alignment: "right" }), itemWidths[2], { valign: "center" }),
      wTableCell(wParagraph(wRun(row.unit, { size: 18 }), { alignment: "center" }), itemWidths[3], { valign: "center" }),
      wTableCell(wParagraph(wRun(money(row.price), { size: 18 }), { alignment: "right" }), itemWidths[4], { valign: "center" }),
      wTableCell(wParagraph(wRun(money(row.sum), { bold: true, size: 18 }), { alignment: "right" }), itemWidths[5], { valign: "center" }),
    ]);
  });

  itemRows.push([
    wTableCell(wParagraph(wRun("ИТОГО", { bold: true, size: 22 }), { alignment: "right" }), itemWidths.slice(0, 5).reduce((sum, width) => sum + width, 0), { fill: "F2F8FA", gridSpan: 5 }),
    wTableCell(wParagraph(wRun(money(quote.total), { bold: true, size: 22 }), { alignment: "right" }), itemWidths[5], { fill: "F2F8FA" }),
  ]);
  body.push(wTable(itemRows, itemWidths));

  body.push(wParagraph("", { spacing: { after: 200 } }));
  body.push(wParagraph(wRun("СОСТАВ РАБОТ", { bold: true, size: 22 }), { spacing: { after: 100 } }));
  quote.workItems.forEach((item) => {
    body.push(wParagraph(wRun(`- ${item}`, { size: 21 }), { spacing: { after: 70 } }));
  });

  body.push(wParagraph("", { spacing: { after: 140 } }));
  body.push(wParagraph(wRun("Будем рады сотрудничеству и готовы подобрать оптимальное решение под Ваш объект.", { size: 22 }), { spacing: { after: 200 } }));

  const stampContent = hasStamp
    ? wParagraph(wImage("rIdStamp", "Печать ИП Бауыржан", 150, 150), { alignment: "center" })
    : wParagraph(wRun("Печать ИП «Бауыржан» / TUMAN PRO", { bold: true, color: "7B5A16", size: 18 }), { alignment: "center" });
  body.push(wTable([[
    wTableCell([
      wParagraph(wRun("Индивидуальный предприниматель Бауыржан С. А.", { size: 21 }), { spacing: { after: 100 } }),
      wParagraph(wRun("______________________", { size: 21 })),
    ], 7000, { valign: "center" }),
    wTableCell(stampContent, contentWidth - 7000, { valign: "center" }),
  ]], [7000, contentWidth - 7000], { borders: false }));

  body.push(wParagraph("", { spacing: { after: 100 } }));
  body.push(wParagraph(wRun("ИП «Бауыржан» · Системы туманообразования", { color: muted, size: 16 }), { alignment: "center" }));
}

function createQuoteDocxDocumentXml({ hasLogo, hasStamp }) {
  const quotes = calculateSelectedQuotes();
  const body = [];
  docxImageId = 1;

  quotes.forEach((quote, index) => {
    if (index > 0) body.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
    appendQuoteDocxBody(body, quote, quoteNumberFor(index), { hasLogo, hasStamp });
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" mc:Ignorable="w14 wp14">
    <w:body>
      ${body.join("")}
      <w:sectPr>
        <w:pgSz w:w="11906" w:h="16838"/>
        <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/>
      </w:sectPr>
    </w:body>
  </w:document>`;
}

function docxStylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:docDefaults>
      <w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/></w:rPr></w:rPrDefault>
      <w:pPrDefault><w:pPr><w:spacing w:after="120"/></w:pPr></w:pPrDefault>
    </w:docDefaults>
    <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
  </w:styles>`;
}

function docxContentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Default Extension="png" ContentType="image/png"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  </Types>`;
}

function docxPackageRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  </Relationships>`;
}

function docxDocumentRelsXml({ hasLogo, hasStamp }) {
  const rels = [
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
  ];
  if (hasLogo) rels.push('<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>');
  if (hasStamp) rels.push('<Relationship Id="rIdStamp" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/stamp.png"/>');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join("")}</Relationships>`;
}

function crc32(bytes) {
  if (!crc32.table) {
    crc32.table = Array.from({ length: 256 }, (_, index) => {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      return value >>> 0;
    });
  }
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crc32.table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = Math.max(1980, date.getFullYear()) - 1980;
  return { time, date: (year << 9) | (month << 5) | day };
}

function binaryHeader(length, writer) {
  const bytes = new Uint8Array(length);
  writer(new DataView(bytes.buffer));
  return bytes;
}

function concatZipBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function zipData(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return new TextEncoder().encode(value);
}

function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  const stamp = dosDateTime();

  Object.entries(files).forEach(([name, value]) => {
    const nameBytes = encoder.encode(name);
    const data = zipData(value);
    const crc = crc32(data);
    const localHeader = binaryHeader(30, (view) => {
      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 0, true);
      view.setUint16(8, 0, true);
      view.setUint16(10, stamp.time, true);
      view.setUint16(12, stamp.date, true);
      view.setUint32(14, crc, true);
      view.setUint32(18, data.length, true);
      view.setUint32(22, data.length, true);
      view.setUint16(26, nameBytes.length, true);
      view.setUint16(28, 0, true);
    });
    localParts.push(localHeader, nameBytes, data);

    const centralHeader = binaryHeader(46, (view) => {
      view.setUint32(0, 0x02014b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 20, true);
      view.setUint16(8, 0, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, stamp.time, true);
      view.setUint16(14, stamp.date, true);
      view.setUint32(16, crc, true);
      view.setUint32(20, data.length, true);
      view.setUint32(24, data.length, true);
      view.setUint16(28, nameBytes.length, true);
      view.setUint16(30, 0, true);
      view.setUint16(32, 0, true);
      view.setUint16(34, 0, true);
      view.setUint16(36, 0, true);
      view.setUint32(38, 0, true);
      view.setUint32(42, localOffset, true);
    });
    centralParts.push(centralHeader, nameBytes);
    localOffset += localHeader.length + nameBytes.length + data.length;
  });

  const centralStart = localOffset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endHeader = binaryHeader(22, (view) => {
    view.setUint32(0, 0x06054b50, true);
    view.setUint16(4, 0, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, Object.keys(files).length, true);
    view.setUint16(10, Object.keys(files).length, true);
    view.setUint32(12, centralSize, true);
    view.setUint32(16, centralStart, true);
    view.setUint16(20, 0, true);
  });

  return concatZipBytes([...localParts, ...centralParts, endHeader]);
}

async function imageBytesFromCanvas(src) {
  const image = await loadImage(src);
  if (!image) return null;
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  return new Promise((resolve) => {
    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      }, "image/png");
    } catch {
      resolve(null);
    }
  });
}

async function loadAssetBytes(src) {
  async function fetchBytes(url) {
    try {
      const response = await fetch(url);
      if (response.ok) return new Uint8Array(await response.arrayBuffer());
    } catch {
      return null;
    }
    return null;
  }

  const relativeBytes = await fetchBytes(src);
  if (relativeBytes) return relativeBytes;

  const publicUrl = new URL(src, PUBLIC_ASSET_BASE_URL).href;
  const currentUrl = new URL(src, window.location.href).href;
  if (publicUrl !== currentUrl) {
    const publicBytes = await fetchBytes(publicUrl);
    if (publicBytes) return publicBytes;
  }

  try {
    return await imageBytesFromCanvas(src);
  } catch {
    return null;
  }
}

async function createQuoteDocxBlob() {
  const [logoBytes, stampBytes] = await Promise.all([
    loadAssetBytes(LOGO_SRC),
    loadAssetBytes(STAMP_SRC),
  ]);
  const hasLogo = Boolean(logoBytes);
  const hasStamp = Boolean(stampBytes);
  const files = {
    "[Content_Types].xml": docxContentTypesXml(),
    "_rels/.rels": docxPackageRelsXml(),
    "word/document.xml": createQuoteDocxDocumentXml({ hasLogo, hasStamp }),
    "word/styles.xml": docxStylesXml(),
    "word/_rels/document.xml.rels": docxDocumentRelsXml({ hasLogo, hasStamp }),
  };
  if (hasLogo) files["word/media/logo.png"] = logoBytes;
  if (hasStamp) files["word/media/stamp.png"] = stampBytes;
  return new Blob([createZip(files)], { type: DOCX_MIME });
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
    image.src = LOGO_SRC;
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

function createQuoteCanvas(quote, displayNumber, pageNumber, brandImage, stampImage) {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext("2d");
  const margin = 74;
  const pageRight = canvas.width - margin;
  const brand = quote.brandColor;
  const tableBrand = quote.tableColor || quote.brandColor;
  const brandMuted = quote.mutedColor;
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
  ctx.fillStyle = brandMuted;
  ctx.font = "21px Arial, Helvetica, sans-serif";
  ctx.fillText(quote.systemLine.toUpperCase(), margin + 126, 132);

  ctx.font = "700 20px Arial, Helvetica, sans-serif";
  ctx.fillStyle = "#ffffff";
  drawRightText(ctx, "+7 (701) 988-80-25", pageRight - 28, 88);
  ctx.font = "20px Arial, Helvetica, sans-serif";
  ctx.fillStyle = brandMuted;
  drawRightText(ctx, "adilnug@gmail.com", pageRight - 28, 118);
  drawRightText(ctx, "г. Астана, ул. Аягоз, 1", pageRight - 28, 148);

  ctx.fillStyle = tableBrand;
  ctx.fillRect(margin, 206, canvas.width - margin * 2, 6);

  ctx.fillStyle = ink;
  ctx.font = "700 46px Arial, Helvetica, sans-serif";
  ctx.fillText("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", margin, 246);
  ctx.fillStyle = muted;
  ctx.font = "24px Arial, Helvetica, sans-serif";
  ctx.fillText(quote.titleLine, margin, 306);

  const metaTop = 366;
  const metaGap = 18;
  const metaWidth = (canvas.width - margin * 2 - metaGap * 2) / 3;
  const meta = [
    ["ИСХОДЯЩИЙ", `№ ${displayNumber} от ${dateRu()}`],
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
    quote.intro,
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

  drawPdfFooter(ctx, canvas, margin, pageRight, line, muted, pageNumber);
  return [canvas, createQuoteSecondCanvas(quote, displayNumber, pageNumber + 1, brandImage, stampImage)];
}

function createQuoteSecondCanvas(quote, displayNumber, pageNumber, brandImage, stampImage) {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext("2d");
  const margin = 74;
  const pageRight = canvas.width - margin;
  const brand = quote.brandColor;
  const tableBrand = quote.tableColor || quote.brandColor;
  const brandMuted = quote.mutedColor;
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
  ctx.fillStyle = brandMuted;
  ctx.font = "20px Arial, Helvetica, sans-serif";
  drawRightText(ctx, `КП № ${displayNumber} от ${dateRu()}`, pageRight - 24, 104);
  ctx.fillStyle = tableBrand;
  ctx.fillRect(margin, 184, canvas.width - margin * 2, 6);

  let y = 238;
  ctx.fillStyle = ink;
  ctx.font = "700 24px Arial, Helvetica, sans-serif";
  ctx.fillText("СОСТАВ РАБОТ", margin, y);
  y += 54;
  ctx.font = "21px Arial, Helvetica, sans-serif";
  quote.workItems.forEach((item) => {
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

  drawPdfFooter(ctx, canvas, margin, pageRight, line, muted, pageNumber);
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
  const quotes = calculateSelectedQuotes();
  const [brandImage, stampImage] = await Promise.all([
    loadBrandImage(),
    loadImage(STAMP_SRC),
  ]);
  const canvases = quotes.flatMap((quote, index) =>
    createQuoteCanvas(quote, quoteNumberFor(index), index * 2 + 1, brandImage, stampImage),
  );
  const images = await Promise.all(canvases.map(async (canvas) => ({
    bytes: await canvasToJpegBytes(canvas),
    width: canvas.width,
    height: canvas.height,
  })));
  const pdfBytes = buildPdfFromJpegs(images);
  return new Blob([pdfBytes], { type: "application/pdf" });
}

function quoteNumberRange() {
  const quotes = calculateSelectedQuotes();
  if (quotes.length <= 1) return quoteNumberFor(0);
  return `${quoteNumberFor(0)}-${quoteNumberFor(quotes.length - 1)}`;
}

function quoteFileName(extension = "pdf") {
  const number = safeFilePart(quoteNumberRange());
  const objectName = safeFilePart(state.objectName || DEFAULT_STATE.objectName);
  return `КП_${number}_${objectName}.${extension}`;
}

function quoteDocxFileName() {
  return quoteFileName("docx");
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
  const quotes = calculateSelectedQuotes();
  const quoteNumbers = quotes.map((quote, index) => `№ ${quoteNumberFor(index)}`).join(" и ");
  const totals = quotes.map((quote) => `${quote.shortCode}: ${money(quote.total)}`);
  return [
    "Добрый день!",
    quotes.length > 1
      ? `Направляю коммерческие предложения ${quoteNumbers} в одном PDF-файле.`
      : `Направляю коммерческое предложение ${quoteNumbers}.`,
    `Объект: ${state.objectName || DEFAULT_STATE.objectName}.`,
    quotes.length > 1 ? `Итого: ${totals.join("; ")}. Общий итог: ${summaryTotal.textContent}.` : `Итого: ${summaryTotal.textContent}.`,
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

async function saveQuoteWord() {
  if (isPreparingWordFile) return;
  isPreparingWordFile = true;
  const button = document.querySelector("#download-word-button");
  button.disabled = true;
  setStatus("Готовлю Word файл...");
  try {
    const blob = await createQuoteDocxBlob();
    downloadBlob(blob, quoteDocxFileName());
    setStatus("Word файл сохранен.");
  } catch (error) {
    console.error(error);
    setStatus("Не удалось создать Word файл.");
  } finally {
    button.disabled = false;
    isPreparingWordFile = false;
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

document.querySelector("#download-word-button").addEventListener("click", saveQuoteWord);

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
