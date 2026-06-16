// Конфигурация
const API_URL = 'http://localhost:3000'; // Замените на URL вашего сервера
// Для локальной разработки: const API_URL = 'http://localhost:3000';

// DOM элементы
const keywordInput = document.getElementById('keywordInput');
const searchBtn = document.getElementById('searchBtn');
const errorMessage = document.getElementById('errorMessage');
const loadingIndicator = document.getElementById('loadingIndicator');
const urlsSection = document.getElementById('urlsSection');
const urlsList = document.getElementById('urlsList');
const downloadProgress = document.getElementById('downloadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const contentSection = document.getElementById('contentSection');
const contentDisplay = document.getElementById('contentDisplay');
const saveContentBtn = document.getElementById('saveContentBtn');
const savedList = document.getElementById('savedList');
const savedContent = document.getElementById('savedContent');

// Текущее состояние
let currentContent = null;
let currentUrl = null;

// Показать ошибку
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

// Скрыть ошибку
function hideError() {
    errorMessage.classList.add('hidden');
}

// Показать загрузку
function showLoading() {
    loadingIndicator.classList.remove('hidden');
    searchBtn.disabled = true;
}

// Скрыть загрузку
function hideLoading() {
    loadingIndicator.classList.add('hidden');
    searchBtn.disabled = false;
}

// Поиск ключевого слова
async function searchKeyword() {
    const keyword = keywordInput.value.trim();
    
    if (!keyword) {
        showError('Пожалуйста, введите ключевое слово');
        return;
    }

    hideError();
    showLoading();
    urlsSection.style.display = 'none';
    contentSection.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/api/keywords`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Ошибка при поиске');
        }

        displayUrls(data.urls);
        urlsSection.style.display = 'block';
        hideLoading();
    } catch (error) {
        console.error('Error searching:', error);
        showError(error.message || 'Ошибка при поиске ключевого слова');
        hideLoading();
    }
}

// Отобразить список URL
function displayUrls(urls) {
    urlsList.innerHTML = '';
    
    urls.forEach(url => {
        const urlItem = document.createElement('div');
        urlItem.className = 'url-item';
        
        const urlText = document.createElement('span');
        urlText.className = 'url-text';
        urlText.textContent = url;
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = '📥 Скачать';
        downloadBtn.onclick = () => downloadContent(url, downloadBtn);
        
        urlItem.appendChild(urlText);
        urlItem.appendChild(downloadBtn);
        urlsList.appendChild(urlItem);
    });
}

// Скачать контент
async function downloadContent(url, button) {
    hideError();
    button.disabled = true;
    button.textContent = '⏳ Загрузка...';
    
    downloadProgress.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressText.textContent = 'Подготовка к загрузке...';
    contentSection.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/api/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка при скачивании');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let content = '';
        let size = 0;

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    
                    if (data.type === 'progress') {
                        const progress = data.progress || 0;
                        const total = data.total || 0;
                        const downloaded = data.downloaded || 0;
                        
                        progressFill.style.width = `${progress}%`;
                        progressText.textContent = `Загрузка: ${progress}% (${formatBytes(downloaded)} из ${formatBytes(total)})`;
                    } else if (data.type === 'complete') {
                        content = data.content;
                        size = data.size;
                        currentContent = content;
                        currentUrl = data.url;
                        
                        displayContent(content, size, data.url);
                        contentSection.style.display = 'block';
                        downloadProgress.classList.add('hidden');
                        button.textContent = '✅ Скачано';
                        button.disabled = false;
                    } else if (data.type === 'error') {
                        throw new Error(data.error);
                    }
                } catch (parseError) {
                    console.error('Parse error:', parseError);
                }
            }
        }
    } catch (error) {
        console.error('Download error:', error);
        showError(error.message || 'Ошибка при скачивании контента');
        downloadProgress.classList.add('hidden');
        button.textContent = '❌ Ошибка';
        button.disabled = false;
        setTimeout(() => {
            button.textContent = '📥 Скачать';
        }, 3000);
    }
}

// Отобразить контент
function displayContent(content, size, url) {
    const preview = content.length > 1000 ? content.substring(0, 1000) + '...' : content;
    contentDisplay.innerHTML = `
        <div style="margin-bottom: 10px; color: #666;">
            <strong>URL:</strong> ${url}<br>
            <strong>Размер:</strong> ${formatBytes(size)}
        </div>
        <div style="border-top: 1px solid #e9ecef; padding-top: 15px;">
            ${escapeHtml(preview)}
        </div>
    `;
}

// Форматирование размера
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Сохранить контент в LocalStorage
function saveContent() {
    if (!currentContent) {
        showError('Нет контента для сохранения');
        return;
    }

    try {
        const savedItems = JSON.parse(localStorage.getItem('savedContent') || '[]');
        const newItem = {
            id: Date.now(),
            url: currentUrl,
            content: currentContent,
            size: currentContent.length,
            timestamp: new Date().toISOString(),
            keyword: keywordInput.value.trim()
        };
        
        savedItems.push(newItem);
        localStorage.setItem('savedContent', JSON.stringify(savedItems));
        
        showSuccess('Контент сохранен в LocalStorage!');
        loadSavedContent();
    } catch (error) {
        console.error('Save error:', error);
        showError('Ошибка при сохранении в LocalStorage');
    }
}

// Показать сообщение об успехе
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        background: #d4edda;
        color: #155724;
        padding: 10px 15px;
        border-radius: 8px;
        border-left: 4px solid #28a745;
        margin: 10px 0;
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.opacity = '0';
        successDiv.style.transition = 'opacity 0.3s';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

// Загрузить сохраненный контент
function loadSavedContent() {
    try {
        const savedItems = JSON.parse(localStorage.getItem('savedContent') || '[]');
        savedList.innerHTML = '';
        
        if (savedItems.length === 0) {
            savedList.innerHTML = '<p style="color: #666;">Нет сохраненного контента</p>';
            savedContent.innerHTML = '';
            return;
        }
        
        savedItems.reverse().forEach((item, index) => {
            const savedItem = document.createElement('div');
            savedItem.className = 'saved-item';
            const preview = item.content.substring(0, 50) + '...';
            savedItem.textContent = `${item.keyword || 'Без ключа'}: ${preview}`;
            savedItem.title = item.url;
            savedItem.onclick = () => showSavedContent(item);
            savedList.appendChild(savedItem);
        });
    } catch (error) {
        console.error('Load saved error:', error);
        showError('Ошибка при загрузке сохраненного контента');
    }
}

// Показать сохраненный контент
function showSavedContent(item) {
    savedContent.innerHTML = `
        <div style="margin-bottom: 10px; color: #666;">
            <strong>URL:</strong> ${item.url}<br>
            <strong>Размер:</strong> ${formatBytes(item.size)}<br>
            <strong>Сохранен:</strong> ${new Date(item.timestamp).toLocaleString()}<br>
            <strong>Ключевое слово:</strong> ${item.keyword || 'Без ключа'}
        </div>
        <div style="border-top: 1px solid #e9ecef; padding-top: 15px; max-height: 300px; overflow-y: auto;">
            ${escapeHtml(item.content)}
        </div>
    `;
}

// Обработчики событий
searchBtn.addEventListener('click', searchKeyword);
keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchKeyword();
    }
});

saveContentBtn.addEventListener('click', saveContent);

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadSavedContent();
    
    // Проверка соединения с сервером
    fetch(`${API_URL}/api/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: 'test' })
    })
    .catch(() => {
        showError('Не удается подключиться к серверу. Проверьте соединение.');
    });
});