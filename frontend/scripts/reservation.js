import { sendReservation } from "./api.js";

export const toISOWithTimezone = (dateTimeLocal) => {
  if (!dateTimeLocal) return null;
  const date = new Date(dateTimeLocal);
  if (isNaN(date.getTime())) return dateTimeLocal;
  return date.toISOString();
};

export const collectFormData = (form) => ({
  name: form.querySelector('#user-name')?.value?.trim() || '',
  phone_number: form.querySelector('#user-phone')?.value?.trim() || '',
  email: form.querySelector('#user-email')?.value?.trim() || '',
  reservation_date: toISOWithTimezone(
    form.querySelector('#user-datetime')?.value
  ),
  number_of_guests: parseInt(
    form.querySelector('#guests')?.value || '0',
    10
  )
});

export const toggleButtonLoading = (button, isLoading, originalText, loadingText) => {
  if (isLoading) {
    button.dataset.originalText = originalText;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || originalText;
    button.disabled = false;
  }
};

export const showFormMessage = (form, message, type = 'info') => {
  let msgEl = form.querySelector('.form-message');
  
  if (!msgEl) {
    msgEl = document.createElement('div');
    msgEl.className = 'form-message';
    msgEl.setAttribute('role', 'alert');
    msgEl.setAttribute('aria-live', 'polite');
    form.insertBefore(msgEl, form.firstChild);
  }
  
  msgEl.textContent = message;
  msgEl.className = `form-message form-message--${type}`;
  
  if (type === 'success') {
    setTimeout(() => {
      msgEl.textContent = '';
      msgEl.className = 'form-message';
    }, 5000);
  }
};

export const handleReservationSubmit = (evt, form) => {
  evt.preventDefault();
  
  const submitBtn = form.querySelector('.form-button');
  if (!submitBtn) return;

  const originalBtnText = submitBtn.textContent;
  toggleButtonLoading(submitBtn, true, originalBtnText, 'Отправка...');
  showFormMessage(form, '', 'info');

  const payload = collectFormData(form);

  sendReservation(payload)
    .then((data) => {
      showFormMessage(
        form,
        `Форма успешно отправлена. На указанный номер перезвонят в течение 30 минут для подтверждения брони.`,
        'success'
      );
      form.reset();
      form.querySelectorAll('input').forEach(input => {
        const errorEl = document.getElementById(`${input.id}-error`);
        if (errorEl) {
          errorEl.textContent = '';
          errorEl.style.display = 'none';
        }
        input.classList.remove('form_input--error');
        input.classList.remove('form_input--success');
      });
    })
    .catch((error) => {
      console.error('Reservation error:', error);
      
      if (error.status === 409) {
        showFormMessage(
          form,
          'Ошибка: бронь на это имя, дату и время уже существует. Выберите другое время или дату.',
          'error'
        );
      } else if (error.status === 422) {
        showFormMessage(
          form,
          `${error.detail || 'Ошибка в данных формы'}`,
          'error'
        );
      } else if (error.name === 'AbortError') {
        alert(`Превышено время ожидания ответа сервера ${error}`)
      } else if (error instanceof TypeError) {
        alert(`Не удалось соединиться с сервером ${error}`)
      } else {
        alert(`Ошибка ${error}`)
      }
    })
    .finally(() => {
      toggleButtonLoading(submitBtn, false, originalBtnText, 'Отправка...');
    });
};

export const setMinDateTime = (input) => {
  if (!input || input.type !== 'datetime-local') return;
  
  const now = new Date();
  now.setHours(now.getHours() + 1);
  now.setMinutes(0, 0, 0);
  
  const pad = n => String(n).padStart(2, '0');
  input.min = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};
