import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReservationForm } from './validate.js';
import * as reservationModule from './reservation.js';

vi.mock('./reservation.js', () => ({
  handleReservationSubmit: vi.fn(),
  setMinDateTime: vi.fn()
}));

const HTML = `
  <form class="reserve-form">
    <input type="text" id="name" required minlength="2" maxlength="5" pattern="^[a-zA-Z]+$" data-error-message="Неверный формат">
    <span id="name-error" class="form-error"></span>
    
    <input type="number" id="guests" required min="1" max="5">
    <span id="guests-error" class="form-error"></span>
    
    <input type="datetime-local" id="date" required>
    <span id="date-error" class="form-error"></span>
    
    <button type="submit" class="form-button" disabled>Забронировать</button>
    <button type="reset">Сбросить</button>
  </form>
`;

describe('ReservationForm', () => {
  let formInstance;
  let form, nameInput, guestsInput, dateInput, submitBtn, nameError, guestsError, dateError;

  beforeEach(() => {
    document.body.innerHTML = HTML;
    form = document.querySelector('.reserve-form');
    nameInput = document.getElementById('name');
    guestsInput = document.getElementById('guests');
    dateInput = document.getElementById('date');
    submitBtn = document.querySelector('.form-button');
    nameError = document.getElementById('name-error');
    guestsError = document.getElementById('guests-error');
    dateError = document.getElementById('date-error');

    vi.clearAllMocks();
    reservationModule.handleReservationSubmit.mockReset();
    reservationModule.setMinDateTime.mockReset();

    formInstance = new ReservationForm('.reserve-form');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('корректно инициализируется и блокирует кнопку по умолчанию', () => {
    expect(formInstance).toBeDefined();
    expect(submitBtn.disabled).toBe(true);
  });

  it('показывает ошибку при пустом required-поле на blur', () => {
    nameInput.dispatchEvent(new Event('blur'));
    expect(nameInput.classList.contains('form_input--error')).toBe(true);
    expect(nameError.textContent).toBe('Это поле обязательно');
    expect(nameInput.getAttribute('aria-invalid')).toBe('true');
    expect(submitBtn.disabled).toBe(true);
  });

  it('валидирует minlength и maxlength', () => {
    nameInput.value = 'a';
    nameInput.dispatchEvent(new Event('blur'));
    expect(nameError.textContent).toContain('Минимум 2 символов');

    nameInput.value = 'abcdef';
    nameInput.dispatchEvent(new Event('blur'));
    expect(nameError.textContent).toContain('Не более 5 символов');
  });

  it('валидирует pattern и использует data-error-message', () => {
    nameInput.value = '123';
    nameInput.dispatchEvent(new Event('blur'));
    expect(nameError.textContent).toBe('Неверный формат');
  });

  it('валидирует числовые min/max', () => {
    guestsInput.value = '0';
    guestsInput.dispatchEvent(new Event('blur'));
    expect(guestsError.textContent).toContain('Минимум: 1');

    guestsInput.value = '10';
    guestsInput.dispatchEvent(new Event('blur'));
    expect(guestsError.textContent).toContain('Максимум: 5');
  });

  it('валидирует datetime-local (прошедшая дата и время вне диапазона)', () => {
    const now = new Date('2026-05-15T10:00:00');
    vi.setSystemTime(now);

    dateInput.value = '2026-05-14T10:00';
    dateInput.dispatchEvent(new Event('blur'));
    expect(dateError.textContent).toContain('Нельзя выбрать прошедшую дату');

    dateInput.value = '2026-05-16T08:00';
    dateInput.dispatchEvent(new Event('blur'));
    expect(dateError.textContent).toContain('Выберите время с 9:00 до 22:00');

    dateInput.value = '2026-05-16T22:30';
    dateInput.dispatchEvent(new Event('blur'));
    expect(dateError.textContent).toContain('Выберите время с 9:00 до 22:00');
  });

  it('разблокирует кнопку и убирает ошибки при валидных данных', () => {
    nameInput.value = 'Valid';
    guestsInput.value = '2';
    dateInput.value = '2026-05-16T12:00';

    [nameInput, guestsInput, dateInput].forEach(input => input.dispatchEvent(new Event('blur')));

    expect(submitBtn.disabled).toBe(false);
    expect(nameInput.classList.contains('form_input--error')).toBe(false);
    expect(nameInput.getAttribute('aria-invalid')).toBe('false');
  });

  it('корректно работает debounce при вводе', () => {
    vi.useFakeTimers();
    nameInput.value = 'Test';
    nameInput.dispatchEvent(new Event('input'));

    expect(nameError.textContent).toBe('');

    vi.advanceTimersByTime(350);
    expect(nameError.textContent).toBe('');
  });

  it('вызывает handleReservationSubmit при успешной отправке', () => {
    nameInput.value = 'Valid';
    guestsInput.value = '2';
    dateInput.value = '2026-05-16T12:00';
    [nameInput, guestsInput, dateInput].forEach(i => i.dispatchEvent(new Event('blur')));

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(reservationModule.handleReservationSubmit).toHaveBeenCalledTimes(1);
  });

  it('блокирует отправку и фокусирует первое невалидное поле', () => {
    const focusSpy = vi.spyOn(nameInput, 'focus');
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(reservationModule.handleReservationSubmit).not.toHaveBeenCalled();
    expect(focusSpy).toHaveBeenCalled();
  });

  it('сбрасывает состояние формы через reset', () => {
    nameInput.value = 'Valid';
    guestsInput.value = '2';
    dateInput.value = '2026-05-16T12:00'; 

    nameInput.dispatchEvent(new Event('blur'));
    guestsInput.dispatchEvent(new Event('blur'));
    dateInput.dispatchEvent(new Event('blur'));

    expect(submitBtn.disabled).toBe(false);

    form.reset();

    expect(nameInput.value).toBe('');
    expect(nameInput.classList.contains('form_input--error')).toBe(false);
    expect(submitBtn.disabled).toBe(true);
    expect(nameError.textContent).toBe('');
    });

  it('поддерживает несколько независимых экземпляров', () => {
    document.body.insertAdjacentHTML('beforeend', `
      <form class="reserve-form-2">
        <input type="text" id="name2" required>
        <span id="name2-error"></span>
        <button type="submit" class="form-button" disabled></button>
      </form>
    `);

    const form2 = new ReservationForm('.reserve-form-2');
    const input2 = document.getElementById('name2');
    const btn2 = document.querySelector('.reserve-form-2 .form-button');

    input2.value = 'Test';
    input2.dispatchEvent(new Event('blur'));

    const btn1 = document.querySelector('.reserve-form .form-button');
    expect(btn1.disabled).toBe(true);
    expect(btn2.disabled).toBe(false);
  });
});
