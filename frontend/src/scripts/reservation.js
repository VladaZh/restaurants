import { sendReservation } from "./api.js";

const log = (level, event, meta = {}) => console[level]({ ts: new Date().toISOString(), level, event, ...meta });

export const formatDateTimeLocal = (dateTimeLocal) => {
  if (!dateTimeLocal) return null;
  return dateTimeLocal;
};

export const collectFormData = (form) => {
  const payload = {
    name: form.querySelector('#user-name')?.value?.trim() || '',
    phone_number: form.querySelector('#user-phone')?.value?.trim() || '',
    email: form.querySelector('#user-email')?.value?.trim() || '',
    reservation_date: formatDateTimeLocal(form.querySelector('#user-datetime')?.value),
    number_of_guests: parseInt(form.querySelector('#guests')?.value || '0', 10)
  };
  log("info", "form_data_collected", {
    guests: payload.number_of_guests,
    has_date: !!payload.reservation_date
  });
  return payload;
};

export const toggleButtonLoading = (button, isLoading) => {
  button.disabled = isLoading;
  log("debug", "button_loading_toggled", { isLoading });
};

export const handleReservationSubmit = (evt, form) => {
  evt.preventDefault();

  const submitBtn = form.querySelector('.form-button');
  if (!submitBtn) {
    log("warn", "submit_button_not_found");
    return;
  }

  toggleButtonLoading(submitBtn, true);
  const payload = collectFormData(form);
  log("info", "reservation_submit_start");

  sendReservation(payload)
    .then((data) => {
      log("info", "reservation_submit_success");
      alert('Столик забронирован. Ждем Вас в нашем ресторане');
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
      log("error", "reservation_submit_failed", {
        status: error.status,
        name: error.name,
        detail: error.detail || error.message
      });

      if (error.status === 400) {
        alert(error.detail);
      } else if (error.status === 409) {
        alert(error.detail);
      } else if (error.status === 422) {
        alert('Ошибка в данных формы. Проверьте правильность заполнения.');
      } else if (error.name === 'AbortError') {
        alert('Превышено время ожидания ответа сервера. Попробуйте позже.');
      } else if (error instanceof TypeError) {
        alert('Не удалось соединиться с сервером. Проверьте интернет.');
      } else {
        alert('Произошла непредвиденная ошибка. Попробуйте позже.');
      }
      toggleButtonLoading(submitBtn, false);
    });
};

export const setMinDateTime = (input) => {
  if (!input || input.type !== 'datetime-local') return;

  const now = new Date();
  now.setHours(now.getHours() + 1);
  now.setMinutes(0, 0, 0);

  const pad = n => String(n).padStart(2, '0');
  const minVal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  input.min = minVal;
  log("debug", "min_datetime_set", { min: minVal });
};