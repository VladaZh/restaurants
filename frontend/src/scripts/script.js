const log = (level, event, meta = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message: event,
    service: {
      name: "restaurant-frontend"
    },
    ...meta
  }));
};

document.addEventListener('DOMContentLoaded', () => {
  const datetimeInput = document.getElementById('user-datetime');
  if (!datetimeInput) {
    log("warn", "datetime_input_not_found");
    return;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 30, 0, 0);

  const localISO = new Date(
    tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 16);

  datetimeInput.value = localISO;
  datetimeInput.classList.add('default-value');
  log("info", "datetime_default_set", { value: localISO });

  datetimeInput.dispatchEvent(new Event('input', { bubbles: true }));

  const removeDefaultClass = () => {
    datetimeInput.classList.remove('default-value');
    datetimeInput.removeEventListener('input', removeDefaultClass);
    log("debug", "datetime_default_class_removed");
  };
  datetimeInput.addEventListener('input', removeDefaultClass);
});