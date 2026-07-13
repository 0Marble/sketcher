import './style.css';
import type { ExerciseType, WorksheetResult } from './types';
import { Worksheet } from './worksheet/Worksheet';
import { generateTemplate } from './shapes/generateTemplate';
import { buildTargetCurves } from './geometry/targetCurves';
import { scoreCell } from './scoring/scoreCell';
import { saveResult, getHistory, clearHistory, getAllStats, getStatsByType } from './storage/historyStore';

const EXERCISE_LABELS: Record<ExerciseType, string> = {
  circle: 'Circles',
  ellipse: 'Ellipses',
  parallelLines: 'Parallel Lines',
  convergingLines: 'Converging Lines',
  curvedLines: 'Curved Lines',
};

const EXERCISE_EMOJI: Record<ExerciseType, string> = {
  circle: '⭕',
  ellipse: '🔘',
  parallelLines: '═',
  convergingLines: '↗',
  curvedLines: '〰',
};

class App {
  private root = document.getElementById('app')!;
  private worksheet: Worksheet | null = null;
  private exerciseWrapper: HTMLElement | null = null;
  private currentType: ExerciseType | null = null;

  constructor() {
    this.showPicker();
  }

  private clear(): void {
    this.root.innerHTML = '';
    if (this.worksheet) {
      this.worksheet.destroy();
      this.worksheet = null;
    }
  }

  private showPicker(): void {
    this.clear();
    this.currentType = null;
    const stats = getAllStats();

    const container = document.createElement('div');
    container.className = 'flex min-h-full flex-col items-center justify-center p-6';

    const title = document.createElement('h1');
    title.className = 'mb-2 text-3xl font-bold text-slate-900';
    title.textContent = 'Sketcher';
    container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'mb-8 text-slate-500';
    subtitle.textContent = 'Pick an exercise and trace the guides';
    container.appendChild(subtitle);

    const grid = document.createElement('div');
    grid.className = 'grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

    const types: ExerciseType[] = [
      'circle',
      'ellipse',
      'parallelLines',
      'convergingLines',
      'curvedLines',
    ];

    for (const type of types) {
      const card = document.createElement('button');
      card.className =
        'panel flex flex-col items-start text-left transition hover:border-blue-300 hover:shadow-md';
      card.innerHTML = `
        <span class="mb-2 text-3xl">${EXERCISE_EMOJI[type]}</span>
        <span class="text-lg font-semibold">${EXERCISE_LABELS[type]}</span>
        <span class="mt-1 text-xs text-slate-400">${stats[type].count} attempts · best ${Math.round(
          stats[type].best
        )}</span>
      `;
      card.addEventListener('click', () => this.startExercise(type));
      grid.appendChild(card);
    }
    container.appendChild(grid);

    const historyBtn = document.createElement('button');
    historyBtn.className = 'btn btn-secondary mt-8';
    historyBtn.textContent = 'View History';
    historyBtn.addEventListener('click', () => this.showHistory());
    container.appendChild(historyBtn);

    this.root.appendChild(container);
  }

  private startExercise(type: ExerciseType): void {
    this.clear();
    this.currentType = type;
    const template = generateTemplate(type, 200);

    const wrapper = document.createElement('div');
    wrapper.className = 'flex h-full flex-col';
    this.exerciseWrapper = wrapper;

    // Header
    const header = document.createElement('div');
    header.className =
      'flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3';
    header.innerHTML = `<span class="font-semibold">${EXERCISE_EMOJI[type]} ${EXERCISE_LABELS[type]}</span>`;
    const back = document.createElement('button');
    back.className = 'btn btn-secondary';
    back.textContent = 'Back';
    back.addEventListener('click', () => this.showPicker());
    header.appendChild(back);
    wrapper.appendChild(header);

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className =
      'flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2';

    const status = document.createElement('span');
    status.className = 'mr-auto text-sm text-slate-600';
    toolbar.appendChild(status);

    const undoBtn = document.createElement('button');
    undoBtn.className = 'btn btn-secondary';
    undoBtn.textContent = 'Undo';
    undoBtn.addEventListener('click', () => this.worksheet?.undoActiveCell());
    toolbar.appendChild(undoBtn);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-secondary';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => this.worksheet?.clearActiveCell());
    toolbar.appendChild(clearBtn);

    const tryAgainBtn = document.createElement('button');
    tryAgainBtn.className = 'btn btn-primary';
    tryAgainBtn.textContent = 'Try Again';
    tryAgainBtn.addEventListener('click', () => this.startExercise(type));
    toolbar.appendChild(tryAgainBtn);

    wrapper.appendChild(toolbar);

    // Canvas area
    const canvasArea = document.createElement('div');
    canvasArea.className = 'relative flex-1 min-h-0 bg-slate-100';
    wrapper.appendChild(canvasArea);

    this.root.appendChild(wrapper);

    this.worksheet = new Worksheet(canvasArea);
    this.worksheet.setTemplate(template);

    const requiredStrokes = template.flags.ignoreStrokeCount
      ? 1
      : buildTargetCurves(template.type, template.params).length;
    let autoFinished = false;

    const checkComplete = () => {
      if (autoFinished || !this.worksheet) return false;
      const cells = this.worksheet.getCells();
      return cells
        .filter((c) => c.kind === 'practice')
        .every((c) => c.strokes.length >= requiredStrokes);
    };

    this.worksheet.onChange = () => {
      this.updateStatus(status);
      if (checkComplete()) {
        autoFinished = true;
        this.finishExercise();
      }
    };
    this.updateStatus(status);
  }

  private updateStatus(statusEl: HTMLSpanElement): void {
    if (!this.worksheet) return;
    const cells = this.worksheet.getCells();
    const active = this.worksheet.getActiveIndex();
    const total = cells.length;
    const practiceTotal = cells.filter((c) => c.kind === 'practice').length;
    const completed = cells.filter(
      (c) => c.kind === 'practice' && c.strokes.length > 0
    ).length;
    const activeCell = cells[active];
    const activeLabel = activeCell?.kind === 'trace' ? 'Trace' : 'Practice';
    statusEl.textContent = `${activeLabel} cell ${active + 1}/${total} · ${completed}/${practiceTotal} drawn`;
  }

  private finishExercise(): void {
    if (!this.worksheet || !this.currentType) return;
    const template = this.worksheet.getTemplate();
    if (!template) return;

    const cells = this.worksheet.getCells();
    const scoreResults = cells.map((cell, i) => {
      if (cell.kind !== 'practice') {
        return { score: 0, error: 0, perPointErrors: [] as import('./geometry/types').PerPointError[][] };
      }
      const r = scoreCell(template.type, template.params, cell.strokes, template.flags);
      this.worksheet?.setPerPointErrors(i, r.perPointErrors);
      return r;
    });
    const scores = scoreResults.map((r) => r.score);
    this.worksheet.setScores(scores);

    const practiceScores = scores.filter((_, i) => cells[i].kind === 'practice');
    const finalScore =
      practiceScores.length > 0
        ? practiceScores.reduce((a, b) => a + b, 0) / practiceScores.length
        : 0;

    const result: WorksheetResult = {
      type: template.type,
      params: template.params,
      cellScores: scores,
      finalScore,
      timestamp: Date.now(),
    };

    saveResult(result);
    this.worksheet.setInteractive(false);
    this.worksheet.setReviewMode(true);
    this.showResultOverlay(result);
  }

  private showResultOverlay(result: WorksheetResult): void {
    if (!this.exerciseWrapper) return;
    const canvasArea = this.exerciseWrapper.querySelector('.relative.flex-1') as HTMLElement;
    if (!canvasArea) return;

    const overlay = document.createElement('div');
    overlay.className =
      'absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-4';

    const card = document.createElement('div');
    card.className = 'panel max-h-full w-full max-w-2xl overflow-auto';

    const title = document.createElement('h2');
    title.className = 'mb-2 text-center text-2xl font-bold';
    title.textContent = 'Worksheet Complete!';
    card.appendChild(title);

    const scoreEl = document.createElement('div');
    scoreEl.className = 'mb-4 text-center text-6xl font-black text-blue-600';
    scoreEl.textContent = Math.round(result.finalScore).toString();
    card.appendChild(scoreEl);

    const breakdown = document.createElement('div');
    breakdown.className = 'mb-4 grid grid-cols-5 gap-2';
    result.cellScores.forEach((score, i) => {
      const cell = document.createElement('div');
      cell.className = 'panel flex flex-col items-center p-2';
      const label = document.createElement('span');
      label.className = 'text-xs text-slate-400';
      label.textContent = `#${i + 1}`;
      const value = document.createElement('span');
      value.className = 'font-bold';
      value.textContent = score ? Math.round(score).toString() : '-';
      cell.appendChild(label);
      cell.appendChild(value);
      breakdown.appendChild(cell);
    });
    card.appendChild(breakdown);

    const legend = document.createElement('p');
    legend.className = 'mb-4 text-center text-sm text-slate-500';
    legend.innerHTML = '<span class="inline-block h-1 w-6 bg-red-500 align-middle"></span> red dashed = expected shape';
    card.appendChild(legend);

    const actions = document.createElement('div');
    actions.className = 'flex flex-wrap justify-center gap-3';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-secondary';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => overlay.remove());
    actions.appendChild(closeBtn);

    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn btn-primary';
    retryBtn.textContent = 'Try Again';
    retryBtn.addEventListener('click', () => this.startExercise(result.type));
    actions.appendChild(retryBtn);

    const newBtn = document.createElement('button');
    newBtn.className = 'btn btn-secondary';
    newBtn.textContent = 'New Exercise';
    newBtn.addEventListener('click', () => this.showPicker());
    actions.appendChild(newBtn);

    const historyBtn = document.createElement('button');
    historyBtn.className = 'btn btn-secondary';
    historyBtn.textContent = 'History';
    historyBtn.addEventListener('click', () => this.showHistory());
    actions.appendChild(historyBtn);

    card.appendChild(actions);
    overlay.appendChild(card);
    canvasArea.appendChild(overlay);
  }

  private showHistory(): void {
    this.clear();
    const history = getHistory();

    const container = document.createElement('div');
    container.className = 'flex h-full flex-col';

    const header = document.createElement('div');
    header.className =
      'flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3';
    header.innerHTML = '<span class="font-semibold">History</span>';
    const back = document.createElement('button');
    back.className = 'btn btn-secondary';
    back.textContent = 'Back';
    back.addEventListener('click', () => this.showPicker());
    header.appendChild(back);
    container.appendChild(header);

    const toolbar = document.createElement('div');
    toolbar.className = 'flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2';

    const filter = document.createElement('select');
    filter.className = 'rounded-lg border border-slate-300 px-3 py-1 text-sm';
    filter.innerHTML =
      '<option value="">All exercises</option>' +
      Object.entries(EXERCISE_LABELS)
        .map(([type, label]) => `<option value="${type}">${label}</option>`)
        .join('');
    toolbar.appendChild(filter);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-secondary text-red-600';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all history?')) {
        clearHistory();
        this.showHistory();
      }
    });
    toolbar.appendChild(clearBtn);

    container.appendChild(toolbar);

    const listContainer = document.createElement('div');
    listContainer.className = 'flex-1 overflow-auto p-4';

    const renderList = () => {
      listContainer.innerHTML = '';
      const selected = filter.value as ExerciseType | '';
      const filtered = selected
        ? history.filter((a) => a.type === selected)
        : history;

      if (filtered.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'text-center text-slate-400';
        empty.textContent = 'No attempts yet.';
        listContainer.appendChild(empty);
        return;
      }

      const table = document.createElement('table');
      table.className = 'w-full text-left text-sm';
      table.innerHTML = `
        <thead>
          <tr class="border-b border-slate-200 text-slate-500">
            <th class="py-2">Date</th>
            <th class="py-2">Exercise</th>
            <th class="py-2">Score</th>
            <th class="py-2">Cells</th>
          </tr>
        </thead>
      `;
      const tbody = document.createElement('tbody');
      for (const attempt of filtered) {
        const date = new Date(attempt.timestamp).toLocaleString();
        const row = document.createElement('tr');
        row.className = 'border-b border-slate-100';
        row.innerHTML = `
          <td class="py-2">${date}</td>
          <td class="py-2">${EXERCISE_LABELS[attempt.type]}</td>
          <td class="py-2 font-semibold">${Math.round(attempt.finalScore)}</td>
          <td class="py-2 text-slate-500">${attempt.cellScores
            .map((s) => (s ? Math.round(s) : '-'))
            .join(', ')}</td>
        `;
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
      listContainer.appendChild(table);

      // Stats for selected type
      const stats = selected ? getStatsByType(selected) : undefined;
      if (stats) {
        const statsEl = document.createElement('div');
        statsEl.className = 'mt-4 panel';
        statsEl.innerHTML = `
          <p class="text-slate-600">Attempts: <span class="font-semibold">${stats.count}</span></p>
          <p class="text-slate-600">Best: <span class="font-semibold">${Math.round(stats.best)}</span></p>
          <p class="text-slate-600">Average: <span class="font-semibold">${Math.round(stats.average)}</span></p>
        `;
        listContainer.appendChild(statsEl);
      }
    };

    filter.addEventListener('change', renderList);
    renderList();

    container.appendChild(listContainer);
    this.root.appendChild(container);
  }
}

new App();
