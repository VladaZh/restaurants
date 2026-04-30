import { handleReservationSubmit } from "./reservation.js";

const CONFIG = {
  debounceMs: 300,
  errorClass: 'form_input--error',
  successClass: 'form_input--success',
  buttonSelector: '.reserve-form button[type="submit"]',
};

const state = {};

function getMinDateTimeString() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00`;
}

function loadBookings() {
  const stored = localStorage.getItem('restaurant_bookings');
  return stored ? JSON.parse(stored) : [];
}

function saveBookings(bookings) {
  localStorage.setItem('restaurant_bookings', JSON.stringify(bookings));
}

function isDuplicateBooking(newBooking, existingBookings) {
  return existingBookings.some(booking =>
    booking.name === newBooking.name &&
    booking.date === newBooking.date &&
    booking.time === newBooking.time
  );
}

function addBooking(booking) {
  const bookings = loadBookings();
  if (isDuplicateBooking(booking, bookings)) {
    return false;
  }
  bookings.push(booking);
  saveBookings(bookings);
  return true;
}

function init() {
  const form = document.querySelector('.reserve-form');
  if (!form) return;

  const inputs = form.querySelectorAll('input[required]');
  const submitBtn = form.querySelector(CONFIG.buttonSelector);

  inputs.forEach(input => {
    state[input.id] = { valid: false, touched: false };

    if (input.type === 'datetime-local') {
      input.min = getMinDateTimeString();
      input.step = 60;
    }

    input.addEventListener('input', debounce(() => {
      if (input.type === 'datetime-local') {
        input.min = getMinDateTimeString();
      }
      validate(input);
      updateButton(form, submitBtn);
    }, CONFIG.debounceMs));

    input.addEventListener('blur', () => {
      state[input.id].touched = true;
      validate(input);
      updateButton(form, submitBtn);
    });

    input.addEventListener('focus', () => {
      if (input.type === 'datetime-local') {
        input.min = getMinDateTimeString();
      }
      clearError(input);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let allValid = true;
    inputs.forEach(input => {
      if (!validate(input)) {
        allValid = false;
        if (document.activeElement !== input) {
          input.focus();
        }
      }
    });

    if (allValid) {
      handleSubmit(form);
    }
  });

  updateButton(form, submitBtn);
}

function validate(input) {
  const value = input.value.trim();
  const errorEl = document.getElementById(`${input.id}-error`);

  if (!value && input.required) {
    showError(input, errorEl, 'Это поле обязательно');
    return false;
  }

  if (input.minLength > 0 && value.length < input.minLength) {
    showError(input, errorEl, `Минимум ${input.minLength} символов`);
    return false;
  }

  if (input.maxLength > 0 && value.length > input.maxLength) {
    showError(input, errorEl, `Не более ${input.maxLength} символов`);
    return false;
  }

  if (input.pattern && value) {
    try {
      const regex = new RegExp(input.pattern);
      if (!regex.test(value)) {
        showError(input, errorEl, input.dataset.errorMessage || 'Неверный формат');
        return false;
      }
    } catch (e) {
      console.warn('Invalid pattern for', input.id, input.pattern);
    }
  }

  if (input.type === 'number' && value) {
    const num = parseFloat(value);
    if (input.min !== '' && num < parseFloat(input.min)) {
      showError(input, errorEl, `Минимум: ${input.min}`);
      return false;
    }
    if (input.max !== '' && num > parseFloat(input.max)) {
      showError(input, errorEl, `Максимум: ${input.max}`);
      return false;
    }
  }

  if (input.type === 'datetime-local' && value) {
    const [datePart, timePart] = value.split('T');
    const [Y, M, D] = datePart.split('-').map(Number);
    const [h, m] = timePart.split(':').map(Number);
    const selectedDate = new Date(Y, M - 1, D, h, m);
    const now = new Date();

    if (selectedDate < now) {
      showError(input, errorEl, 'Нельзя выбрать прошедшую дату и время');
      return false;
    }

    if (h < 9 || h > 22 || (h === 22 && m > 0)) {
      showError(input, errorEl, 'Выберите время с 9:00 до 22:00');
      return false;
    }
  }

  clearError(input);
  state[input.id] = { valid: true, touched: true };
  return true;
}

function showError(input, errorEl, message) {
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
  input.classList.add(CONFIG.errorClass);
  input.classList.remove(CONFIG.successClass);
  input.setAttribute('aria-invalid', 'true');
  state[input.id].valid = false;
}

function clearError(input) {
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
  input.classList.remove(CONFIG.errorClass);
  if (input.value.trim()) {
    input.classList.add(CONFIG.successClass);
    state[input.id].valid = true;
  }
  input.setAttribute('aria-invalid', 'false');
}

function updateButton(form, button) {
  if (!button || !form) return;

  const requiredInputs = form.querySelectorAll('input[required]');
  const allValid = Array.from(requiredInputs).every(input =>
    state[input.id]?.valid === true
  );

  button.disabled = !allValid;
}

function handleSubmit(form) {
  if (typeof handleReservationSubmit === 'function') {
    const fakeEvent = { preventDefault: () => {} };
    handleReservationSubmit(fakeEvent, form);
  } else {
    alert('Форма успешно отправлена. На указанный номер перезвонят в течение 30 минут для подтверждения брони.');
    form.reset();
    form.querySelectorAll('input').forEach(input => {
      clearError(input);
      state[input.id] = { valid: false, touched: false };
    });
    const button = form.querySelector(CONFIG.buttonSelector);
    updateButton(form, button);
  }
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
