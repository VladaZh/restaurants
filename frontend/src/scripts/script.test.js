import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Инициализация datetime-поля', () => {
  let datetimeInput;
  let OriginalDate;

  beforeEach(async () => {
    OriginalDate = global.Date;
    const MockDate = class extends OriginalDate {
      constructor(...args) {
        super(...(args.length ? args : ['2026-05-15T10:00:00Z']));
      }
      static now() {
        return new OriginalDate('2026-05-15T10:00:00Z').getTime();
      }
    };
    global.Date = MockDate;

    document.body.innerHTML = '<input type="datetime-local" id="user-datetime">';
    datetimeInput = document.getElementById('user-datetime');

    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });

    await import('./script.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterEach(() => {
    global.Date = OriginalDate;
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('устанавливает значение "завтра 12:30" при инициализации', () => {
    expect(datetimeInput.value).toBe('2026-05-16T12:30');
  });

  it('добавляет класс default-value при установке значения', () => {
    expect(datetimeInput.classList.contains('default-value')).toBe(true);
  });

  it('удаляет класс default-value при первом вводе пользователя', () => {
    datetimeInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(datetimeInput.classList.contains('default-value')).toBe(false);
  });

  it('удаляет обработчик input после первого срабатывания', () => {
    datetimeInput.dispatchEvent(new Event('input'));
    expect(datetimeInput.classList.contains('default-value')).toBe(false);
    
    datetimeInput.value = '2026-05-20T15:00';
    datetimeInput.dispatchEvent(new Event('input'));
    
    expect(datetimeInput.classList.contains('default-value')).toBe(false);
  });

  it('не падает, если элемент с id="user-datetime" не найден', async () => {
    document.body.innerHTML = '<input type="datetime-local" id="other-id">';
    
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true,
    });

    await expect(import('./script.js?bust=' + Math.random())).resolves.not.toThrow();
    
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  it('корректно вычисляет дату с учётом часового пояса', () => {
    const value = datetimeInput.value;
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    
    const [datePart, timePart] = value.split('T');
    expect(datePart).toBe('2026-05-16');
    expect(timePart).toBe('12:30');
  });
});