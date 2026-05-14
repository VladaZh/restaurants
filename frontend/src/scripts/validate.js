import { handleReservationSubmit, setMinDateTime } from "./reservation.js";

class ReservationForm {
  constructor(selector, options = {}) {
    this.form = document.querySelector(selector);
    if (!this.form) return;

    this.config = {
      debounceMs: 300,
      errorClass: 'form_input--error',
      successClass: 'form_input--success',
      buttonSelector: '.form-button',
      ...options
    };

    this.inputs = Array.from(this.form.querySelectorAll('input[required]'));
    this.submitBtn = this.form.querySelector(this.config.buttonSelector);
    
    this.fieldsState = new Map();
    
    this.init();
  }

  init() {
    this.inputs.forEach(input => {
      this.fieldsState.set(input.id, { valid: false, touched: false });

      if (input.type === 'datetime-local') {
        this._applyDateTimeConstraints(input);
        input.step = 60;
      }

      input.addEventListener('input', this._createDebouncedHandler(() => this._onInput(input)));
      input.addEventListener('blur', () => this._onBlur(input));
      input.addEventListener('focus', () => this._onFocus(input));
    });

    this.form.addEventListener('submit', (e) => this._onSubmit(e));
    this.form.addEventListener('reset', () => this._onReset());
  }

  _onInput(input) {
    if (input.type === 'datetime-local') this._applyDateTimeConstraints(input);
    this._validate(input);
    this._updateButton();
  }

  _onBlur(input) {
    this.fieldsState.get(input.id).touched = true;
    this._validate(input);
    this._updateButton();
  }

  _onFocus(input) {
    if (input.type === 'datetime-local') this._applyDateTimeConstraints(input);
    this._clearError(input);
  }

  _onSubmit(e) {
    e.preventDefault();
    let allValid = true;

    this.inputs.forEach(input => {
      if (!this._validate(input)) {
        allValid = false;
        if (document.activeElement !== input) input.focus();
      }
    });

    if (allValid) {
      handleReservationSubmit({ preventDefault: () => {} }, this.form);
    }
  }

  _onReset() {
    this.inputs.forEach(input => {
      this.fieldsState.set(input.id, { valid: false, touched: false });
      input.classList.remove(this.config.errorClass, this.config.successClass);
      input.setAttribute('aria-invalid', 'false');
      
      const errorEl = document.getElementById(`${input.id}-error`);
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
      }
    });
    this._updateButton();
  }

  _validate(input) {
    const value = input.value.trim();
    const errorEl = document.getElementById(`${input.id}-error`);
    const state = this.fieldsState.get(input.id);

    if (!value && input.required) {
      return this._showError(input, errorEl, 'Это поле обязательно');
    }
    if (input.minLength > 0 && value.length < input.minLength) {
      return this._showError(input, errorEl, `Минимум ${input.minLength} символов`);
    }
    if (input.maxLength > 0 && value.length > input.maxLength) {
      return this._showError(input, errorEl, `Не более ${input.maxLength} символов`);
    }
    if (input.pattern && value) {
      try {
        if (!new RegExp(input.pattern).test(value)) {
          return this._showError(input, errorEl, input.dataset.errorMessage || 'Неверный формат');
        }
      } catch {
        console.warn('Invalid pattern:', input.id, input.pattern);
      }
    }
    if (input.type === 'number' && value) {
      const num = parseFloat(value);
      if (input.min !== '' && num < parseFloat(input.min)) {
        return this._showError(input, errorEl, `Минимум: ${input.min}`);
      }
      if (input.max !== '' && num > parseFloat(input.max)) {
        return this._showError(input, errorEl, `Максимум: ${input.max}`);
      }
    }
    if (input.type === 'datetime-local' && value) {
      const [datePart, timePart] = value.split('T');
      const [Y, M, D] = datePart.split('-').map(Number);
      const [h, m] = timePart.split(':').map(Number);
      const selected = new Date(Y, M - 1, D, h, m);
      
      if (selected < new Date()) {
        return this._showError(input, errorEl, 'Нельзя выбрать прошедшую дату и время');
      }
      if (h < 9 || h > 22 || (h === 22 && m > 0)) {
        return this._showError(input, errorEl, 'Выберите время с 9:00 до 22:00');
      }
    }

    this._clearError(input);
    state.valid = true;
    state.touched = true;
    return true;
  }

  _showError(input, errorEl, message) {
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
    input.classList.add(this.config.errorClass);
    input.classList.remove(this.config.successClass);
    input.setAttribute('aria-invalid', 'true');
    this.fieldsState.get(input.id).valid = false;
    return false;
  }

  _clearError(input) {
    const errorEl = document.getElementById(`${input.id}-error`);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
    input.classList.remove(this.config.errorClass, this.config.successClass);
    input.setAttribute('aria-invalid', 'false');
  }

  _updateButton() {
    if (!this.submitBtn) return;
    const allValid = this.inputs.every(inp => this.fieldsState.get(inp.id)?.valid === true);
    this.submitBtn.disabled = !allValid;
  }

  _applyDateTimeConstraints(input) {
    if (typeof setMinDateTime === 'function') setMinDateTime(input);
  }

  _createDebouncedHandler(fn) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), this.config.debounceMs);
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ReservationForm('.reserve-form'));
} else {
  new ReservationForm('.reserve-form');
}

export { ReservationForm };
