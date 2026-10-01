import { setMinDateTime, handleReservationSubmit } from "./reservation.js";

const log = (level, event, meta = {}) => console[level]({ ts: new Date().toISOString(), level, event, ...meta });

const initReservationForm = () => {
  const form = document.querySelector('.reserve-form');
  if (!form) {
    log("warn", "form_not_found", { selector: ".reserve-form" });
    return;
  }

  const datetimeInput = form.querySelector('#user-datetime');
  if (datetimeInput) {
    setMinDateTime(datetimeInput);
    datetimeInput.addEventListener('focus', () => setMinDateTime(datetimeInput));
    log("info", "datetime_input_initialized");
  }

  form.addEventListener("submit", (evt) => {
    log("info", "form_submit_triggered", { selector: ".reserve-form" });
    handleReservationSubmit(evt, form);
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    log("info", "dom_content_loaded");
    initReservationForm();
  });
} else {
  log("info", "dom_already_loaded");
  initReservationForm();
}