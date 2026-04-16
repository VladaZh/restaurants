document.addEventListener('DOMContentLoaded', () => {
  const datetimeInput = document.getElementById('user-datetime');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 30, 0, 0);
  
  const localISO = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  
  datetimeInput.value = localISO;
  datetimeInput.classList.add('default-value');

  const removeDefaultClass = () => {
    datetimeInput.classList.remove('default-value');
    datetimeInput.removeEventListener('input', removeDefaultClass);
  };
  datetimeInput.addEventListener('input', removeDefaultClass);
});