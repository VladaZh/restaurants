import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toISOWithTimezone,
  collectFormData,
  toggleButtonLoading,
  handleReservationSubmit,
  setMinDateTime
} from './reservation.js';
import * as apiModule from './api.js';

vi.mock('./api.js', () => ({
  sendReservation: vi.fn()
}));

describe('reservation.js — утилиты и логика отправки', () => {
  let form, submitBtn, mockAlert;

  beforeEach(() => {
    vi.useFakeTimers();

    document.body.innerHTML = `
      <form class="reserve-form">
        <input type="text" id="user-name" value="Иван Иванов">
        <input type="tel" id="user-phone" value="+79991234567">
        <input type="email" id="user-email" value="test@example.com">
        <input type="datetime-local" id="user-datetime" value="2026-05-20T12:30">
        <input type="number" id="guests" value="4">
        <button type="submit" class="form-button">Забронировать</button>
      </form>
    `;
    form = document.querySelector('.reserve-form');
    submitBtn = form.querySelector('.form-button');
    
    mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('toISOWithTimezone', () => {
    it('конвертирует валидную дату в ISO-формат', () => {
      const result = toISOWithTimezone('2026-05-20T12:30');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('возвращает null для пустого значения', () => {
      expect(toISOWithTimezone(null)).toBeNull();
      expect(toISOWithTimezone(undefined)).toBeNull();
      expect(toISOWithTimezone('')).toBeNull();
    });

    it('возвращает исходное значение для невалидной даты', () => {
      const invalid = 'not-a-date';
      expect(toISOWithTimezone(invalid)).toBe(invalid);
    });
  });

  describe('collectFormData', () => {
    it('собирает все поля формы в объект', () => {
      const data = collectFormData(form);
      
      expect(data).toEqual({
        name: 'Иван Иванов',
        phone_number: '+79991234567',
        email: 'test@example.com',
        reservation_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        number_of_guests: 4
      });
    });

    it('триммит значения полей', () => {
      form.querySelector('#user-name').value = '  Иван  ';
      const data = collectFormData(form);
      expect(data.name).toBe('Иван');
    });

    it('возвращает пустые строки для отсутствующих полей', () => {
      document.body.innerHTML = '<form><button class="form-button"></button></form>';
      const emptyForm = document.querySelector('form');
      const data = collectFormData(emptyForm);
      
      expect(data.name).toBe('');
      expect(data.phone_number).toBe('');
      expect(data.email).toBe('');
      expect(data.reservation_date).toBeNull();
      expect(data.number_of_guests).toBe(0);
    });

    it('парсит число гостей как integer', () => {
      form.querySelector('#guests').value = '5';
      const data = collectFormData(form);
      expect(data.number_of_guests).toBe(5);
      expect(typeof data.number_of_guests).toBe('number');
    });
  });

  describe('toggleButtonLoading', () => {
    it('блокирует кнопку при isLoading=true', () => {
      toggleButtonLoading(submitBtn, true);
      expect(submitBtn.disabled).toBe(true);
    });

    it('разблокирует кнопку при isLoading=false', () => {
      submitBtn.disabled = true;
      toggleButtonLoading(submitBtn, false);
      expect(submitBtn.disabled).toBe(false);
    });
  });

  describe('handleReservationSubmit', () => {
    it('отправляет данные и показывает успех при 200', async () => {
      apiModule.sendReservation.mockResolvedValueOnce({ success: true });
      
      const event = { preventDefault: vi.fn() };
      handleReservationSubmit(event, form);
      
      await vi.runAllTimersAsync();
      
      expect(event.preventDefault).toHaveBeenCalled();
      expect(apiModule.sendReservation).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Иван Иванов',
        phone_number: '+79991234567'
      }));
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Форма успешно отправлена')
      );
      expect(submitBtn.disabled).toBe(true);
    });

    it('показывает ошибку 409 при конфликте брони', async () => {
      apiModule.sendReservation.mockRejectedValueOnce({ status: 409 });
      
      handleReservationSubmit({ preventDefault: vi.fn() }, form);
      await vi.runAllTimersAsync();
      
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('такая бронь уже существует')
      );
      expect(submitBtn.disabled).toBe(false);
    });

    it('показывает ошибку 422 при невалидных данных', async () => {
      apiModule.sendReservation.mockRejectedValueOnce({ status: 422 });
      
      handleReservationSubmit({ preventDefault: vi.fn() }, form);
      await vi.runAllTimersAsync();
      
      expect(mockAlert).toHaveBeenCalledWith('Ошибка в данных формы');
    });

    it('обрабатывает AbortError (таймаут)', async () => {
      apiModule.sendReservation.mockRejectedValueOnce({ name: 'AbortError' });
      
      handleReservationSubmit({ preventDefault: vi.fn() }, form);
      await vi.runAllTimersAsync();
      
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Превышено время ожидания')
      );
    });

    it('обрабатывает TypeError (сетевая ошибка)', async () => {
      apiModule.sendReservation.mockRejectedValueOnce(new TypeError('Network error'));
      
      handleReservationSubmit({ preventDefault: vi.fn() }, form);
      await vi.runAllTimersAsync();
      
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Не удалось соединиться с сервером')
      );
    });

    it('обрабатывает неизвестные ошибки', async () => {
      apiModule.sendReservation.mockRejectedValueOnce(new Error('Unknown'));
      
      handleReservationSubmit({ preventDefault: vi.fn() }, form);
      await vi.runAllTimersAsync();
      
      expect(mockAlert).toHaveBeenCalledWith('Ошибка');
    });

    it('сбрасывает форму и очищает ошибки при успехе', async () => {
      apiModule.sendReservation.mockResolvedValueOnce({ success: true });
      
      const nameInput = form.querySelector('#user-name');
      const errorSpan = document.createElement('span');
      errorSpan.id = 'user-name-error';
      errorSpan.textContent = 'Ошибка';
      errorSpan.style.display = 'block';
      nameInput.classList.add('form_input--error');
      nameInput.parentNode.appendChild(errorSpan);
      
      handleReservationSubmit({ preventDefault: vi.fn() }, form);
      await vi.runAllTimersAsync();
      
      expect(nameInput.classList.contains('form_input--error')).toBe(false);
      expect(errorSpan.textContent).toBe('');
      expect(errorSpan.style.display).toBe('none');
    });
  });

  describe('setMinDateTime', () => {
    it('устанавливает min как "следующий час" для валидного input', () => {
      const fixedTime = new Date(2026, 4, 15, 10, 45);
      vi.setSystemTime(fixedTime);
      
      const input = document.createElement('input');
      input.type = 'datetime-local';
      
      setMinDateTime(input);
      
      expect(input.min).toBe('2026-05-15T11:00');
      
      vi.useRealTimers();
    });

    it('не меняет input, если тип не datetime-local', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.min = '2020-01-01';
      
      setMinDateTime(input);
      
      expect(input.min).toBe('2020-01-01');
    });

    it('безопасно работает с null/undefined', () => {
      expect(() => setMinDateTime(null)).not.toThrow();
      expect(() => setMinDateTime(undefined)).not.toThrow();
    });

    it('корректно форматирует дату с паддингом', () => {
      const fixedTime = new Date(2026, 0, 5, 9, 15);
      vi.setSystemTime(fixedTime);
      
      const input = document.createElement('input');
      input.type = 'datetime-local';
      setMinDateTime(input);
      
      expect(input.min).toBe('2026-01-05T10:00');
      
      vi.useRealTimers();
    });
  });
});
