/* ============================================================
   Money Calculator — Application Logic
   ============================================================ */

const ICON_UP = '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 7L5 3L8 7"/></svg>';
const ICON_DOWN = '<svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 3L5 7L8 3"/></svg>';

// ---- Denomination data ----
const DENOMINATIONS = {
  notes: [
    { label: '$1', value: 1.00 },
    { label: '$2', value: 2.00 },
    { label: '$5', value: 5.00 },
    { label: '$10', value: 10.00 },
    { label: '$20', value: 20.00 },
    { label: '$50', value: 50.00 },
    { label: '$100', value: 100.00 },
  ],
  coins: [
    { label: '1\u00A2', value: 0.01 },
    { label: '5\u00A2', value: 0.05 },
    { label: '10\u00A2', value: 0.10 },
    { label: '25\u00A2', value: 0.25 },
    { label: '50\u00A2', value: 0.50 },
    { label: '$1', value: 1.00 },
  ],
  rolled: [
    { label: '1\u00A2 roll', value: 0.50, info: '50 x 1\u00A2' },
    { label: '5\u00A2 roll', value: 2.00, info: '40 x 5\u00A2' },
    { label: '10\u00A2 roll', value: 5.00, info: '50 x 10\u00A2' },
    { label: '25\u00A2 roll', value: 10.00, info: '40 x 25\u00A2' },
    { label: '50\u00A2 roll', value: 10.00, info: '20 x 50\u00A2' },
    { label: '$1 roll', value: 25.00, info: '25 x $1' },
  ],
};

// ---- Helpers ----

function formatMoney(amount) {
  return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function padZero(n) {
  return String(n).padStart(2, '0');
}

// ---- Build denomination rows ----

function buildRows(section) {
  const grid = document.getElementById(`${section}-grid`);
  if (!grid) return;
  grid.innerHTML = '';

  DENOMINATIONS[section].forEach((denom, idx) => {
    const row = document.createElement('div');
    row.className = 'denom-row';
    row.setAttribute('data-testid', `row-${section}-${idx}`);

    const inputId = `input-${section}-${idx}`;

    row.innerHTML = `
      <div class="denom-label">${denom.label}</div>
      <div class="denom-input-wrap">
        <input type="text" inputmode="numeric" class="denom-input" id="${inputId}"
               placeholder="0" data-value="${denom.value}" data-section="${section}"
               data-testid="${inputId}"
               onfocus="this.select()"
               oninput="onInputChange(this)"
               onkeydown="handleKey(event, this)">
        <div class="stepper-group">
          <button type="button" class="stepper-btn" onclick="stepValue('${inputId}', 1)" title="Add" tabindex="-1">${ICON_UP}</button>
          <button type="button" class="stepper-btn" onclick="stepValue('${inputId}', -1)" title="Remove" tabindex="-1">${ICON_DOWN}</button>
        </div>
      </div>
      <div class="denom-total" id="total-${section}-${idx}" data-testid="total-${section}-${idx}">$0.00</div>
    `;
    grid.appendChild(row);
  });
}

// ---- Input handling ----

function onInputChange(input) {
  input.value = input.value.replace(/[^\d]/g, '');
  updateRowTotal(input);
  updateSectionSubtotal(input.dataset.section);
  updateGrandTotal();
}

function handleKey(event, input) {
  if (event.key === 'ArrowUp') { event.preventDefault(); stepValue(input.id, 1); }
  else if (event.key === 'ArrowDown') { event.preventDefault(); stepValue(input.id, -1); }
}

function stepValue(inputId, delta) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let current = parseInt(input.value) || 0;
  current += delta;
  if (current < 0) current = 0;
  input.value = current === 0 ? '' : current;
  updateRowTotal(input);
  updateSectionSubtotal(input.dataset.section);
  updateGrandTotal();
}

function updateRowTotal(input) {
  const value = parseFloat(input.dataset.value);
  const count = parseInt(input.value) || 0;
  const total = value * count;
  const row = input.closest('.denom-row');
  const totalEl = row.querySelector('.denom-total');
  if (totalEl) {
    totalEl.textContent = formatMoney(total);
    totalEl.classList.toggle('has-value', count > 0);
  }
}

// ---- Section & Grand Total ----

function getSectionTotal(section) {
  const grid = document.getElementById(`${section}-grid`);
  if (!grid) return 0;
  let total = 0;
  grid.querySelectorAll('.denom-input').forEach(input => {
    total += parseFloat(input.dataset.value) * (parseInt(input.value) || 0);
  });
  return total;
}

function updateSectionSubtotal(section) {
  const el = document.getElementById(`${section}-subtotal`);
  if (el) el.textContent = formatMoney(getSectionTotal(section));
}

function isSectionVisible(section) {
  const el = document.getElementById(`section-${section}`);
  return el && !el.classList.contains('hidden');
}

function updateGrandTotal() {
  let grand = 0;
  ['notes', 'coins', 'rolled'].forEach(s => {
    if (isSectionVisible(s)) grand += getSectionTotal(s);
  });
  document.getElementById('grand-total').textContent = formatMoney(grand);
}

// ---- Toggle sections ----

function toggleSection(section) {
  const cb = document.getElementById(`toggle-${section === 'notes' ? 'notes' : section}`);
  const el = document.getElementById(`section-${section}`);
  if (!cb || !el) return;
  el.classList.toggle('hidden', !cb.checked);
  updateGrandTotal();
}

// ---- Calculate ----

function calculateAll() {
  document.querySelectorAll('.denom-input').forEach(input => updateRowTotal(input));
  ['notes', 'coins', 'rolled'].forEach(s => updateSectionSubtotal(s));
  updateGrandTotal();
  const bar = document.getElementById('total-bar');
  bar.style.transform = 'scale(1.02)';
  setTimeout(() => { bar.style.transform = 'scale(1)'; }, 200);
}

// ---- Clear ----

function clearAll() {
  document.querySelectorAll('.denom-input').forEach(input => {
    input.value = '';
    updateRowTotal(input);
  });
  ['notes', 'coins', 'rolled'].forEach(s => updateSectionSubtotal(s));
  updateGrandTotal();
}

// ---- Print ----

function printSheet() {
  calculateAll();
  window.print();
}

// ---- Build PDF filename: total_money_count_MMDDYYYY_HHMMSS.pdf ----

function buildPDFFilename() {
  const now = new Date();
  const mm = padZero(now.getMonth() + 1);
  const dd = padZero(now.getDate());
  const yyyy = now.getFullYear();
  const hh = padZero(now.getHours());
  const mi = padZero(now.getMinutes());
  const ss = padZero(now.getSeconds());
  return `total_money_count_${mm}${dd}${yyyy}_${hh}${mi}${ss}.pdf`;
}

// ---- Collect data for a section ----

function collectSectionData(section) {
  const denoms = DENOMINATIONS[section];
  const rows = [];
  denoms.forEach((denom, idx) => {
    const input = document.getElementById(`input-${section}-${idx}`);
    const count = parseInt(input?.value) || 0;
    if (count > 0) {
      const total = denom.value * count;
      rows.push([denom.label, String(count), formatMoney(denom.value), formatMoney(total)]);
    }
  });
  return rows;
}

// ---- Save as PDF ----

function saveAsPDF() {
  calculateAll();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 14;

  // ---- Header bar ----
  doc.setFillColor(26, 86, 219);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('Money Calculator', margin, 13);

  const now = new Date();
  const genDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const genTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated: ' + genDate + ' at ' + genTime, pageWidth - margin, 13, { align: 'right' });

  let y = 28;

  // ---- Helper to draw a section table ----
  function drawSection(title, data, subtotal) {
    if (data.length === 0) return;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(28, 33, 39);
    doc.text(title, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 115, 129);
    doc.text('Subtotal: ' + subtotal, pageWidth - margin, y, { align: 'right' });
    y += 3;

    doc.autoTable({
      startY: y,
      head: [['Denomination', 'Count', 'Each', 'Total']],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: [36, 48, 63],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [28, 33, 39],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 40 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' },
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      styles: { lineColor: [200, 205, 212], lineWidth: 0.3 },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 10;
  }

  // ---- Draw sections ----
  if (isSectionVisible('notes')) {
    const data = collectSectionData('notes');
    drawSection('Banknotes', data, formatMoney(getSectionTotal('notes')));
  }

  if (isSectionVisible('coins')) {
    const data = collectSectionData('coins');
    drawSection('Coins', data, formatMoney(getSectionTotal('coins')));
  }

  if (isSectionVisible('rolled')) {
    const data = collectSectionData('rolled');
    drawSection('Rolled Coins', data, formatMoney(getSectionTotal('rolled')));
  }

  // ---- Grand Total bar ----
  const grandTotal = document.getElementById('grand-total').textContent;

  doc.setFillColor(36, 48, 63);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL', margin + 8, y + 9);
  doc.setFontSize(16);
  doc.text(grandTotal, pageWidth - margin - 8, y + 9.5, { align: 'right' });

  // ---- Save ----
  doc.save(buildPDFFilename());
}

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', () => {
  buildRows('notes');
  buildRows('coins');
  buildRows('rolled');
});
