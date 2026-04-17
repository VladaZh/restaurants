(function () {
  'use strict';

  const CONFIG = {
    debounceMs: 300,
    errorClass: 'form_input--error',
    successClass: 'form_input--success',
    buttonSelector: '.reserve-form button[type="submit"]',
  };

  const state = {};

  function init() {
    const form = document.querySelector('.reserve-form');
    if (!form) return;

    const inputs = form.querySelectorAll('input[required]');
    const submitBtn = form.querySelector(CONFIG.buttonSelector);

    inputs.forEach(input => {
      state[input.id] = { valid: false, touched: false };
      
      input.addEventListener('input', debounce(() => validate(input), CONFIG.debounceMs));
      input.addEventListener('blur', () => {
        state[input.id].touched = true;
        validate(input);
      });
      input.addEventListener('focus', () => clearError(input));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let allValid = true;
      inputs.forEach(input => {
        if (!validate(input)) {
          allValid = false;
          if (!document.activeElement || document.activeElement !== input) {
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
      const date = new Date(value);
      if (input.min) {
        const minDate = new Date(input.min);
        if (!isNaN(minDate.getTime()) && date < minDate) {
          showError(input, errorEl, 'Дата слишком ранняя');
          return false;
        }
      }
      if (input.max) {
        const maxDate = new Date(input.max);
        if (!isNaN(maxDate.getTime()) && date > maxDate) {
          showError(input, errorEl, 'Дата слишком поздняя');
          return false;
        }
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
    const data = Object.fromEntries(new FormData(form));
    
    console.log('Форма валидна, данные:', data);
    alert('Бронирование успешно!\n' + JSON.stringify(data, null, 2));
    
    form.reset();
    form.querySelectorAll('input').forEach(input => {
      clearError(input);
      state[input.id] = { valid: false, touched: false };
    });
    
    const button = form.querySelector(CONFIG.buttonSelector);
    updateButton(form, button);
  }

  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
