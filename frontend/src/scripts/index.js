import { setMinDateTime, handleReservationSubmit } from "./reservation.js";

const initReservationForm = () => {
  const form = document.querySelector('.reserve-form');
  if (!form) return;

  const datetimeInput = form.querySelector('#user-datetime');
  if (datetimeInput) {
    setMinDateTime(datetimeInput);
    datetimeInput.addEventListener('focus', () => setMinDateTime(datetimeInput));
  }

  form.addEventListener("submit", (evt) => {
    handleReservationSubmit(evt, form);
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReservationForm);
} else {
  initReservationForm();
}