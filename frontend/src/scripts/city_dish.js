document.addEventListener('DOMContentLoaded', function() {

    async function fetchDishes() {
        const url = 'https://www.themealdb.com/api/json/v1/1/filter.php?a=Italian';
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.meals || data.meals.length === 0) {
            throw new Error('Блюда не найдены');
        }
        
        const shuffled = [...data.meals];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const selected = shuffled.slice(0, 6);
        
        return selected.map(meal => ({
            name: meal.strMeal,
            image: meal.strMealThumb
        }));
    }

    const dishesContainer = document.getElementById('dishes-list');
    if (dishesContainer) {
        dishesContainer.innerHTML = '<li class="loading-text">Загрузка фирменных блюд...</li>';
        
        fetchDishes().then(dishes => {
            if (!dishes.length) {
                dishesContainer.innerHTML = '<li class="error-text">Не удалось загрузить блюда. Попробуйте позже.</li>';
                return;
            }
            
            let cardsHtml = '';
            for (const dish of dishes) {
                cardsHtml += `
                    <li class="dish-card">
                        <img src="${dish.image}" alt="${dish.name}" onerror="this.src='https://via.placeholder.com/280x280?text=Нет+фото'">
                        <h4>${dish.name}</h4>
                    </li>
                `;
            }
            dishesContainer.innerHTML = cardsHtml;
        }).catch(err => {
            dishesContainer.innerHTML = '<li class="error-text">Ошибка загрузки меню. Обновите страницу.</li>';
            console.error(err);
        });
    }
});