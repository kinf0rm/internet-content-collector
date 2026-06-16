const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Загрузка данных ключевых слов
const keywordsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'keywords.json'), 'utf8')
);

// Маршрут для получения списка URL по ключевому слову
app.post('/api/keywords', (req, res) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword || keyword.trim() === '') {
      return res.status(400).json({ 
        error: 'Ключевое слово не может быть пустым' 
      });
    }

    const normalizedKeyword = keyword.toLowerCase().trim();
    const urls = keywordsData[normalizedKeyword];

    if (!urls || urls.length === 0) {
      return res.status(404).json({ 
        error: `Ключевое слово "${keyword}" не найдено` 
      });
    }

    res.json({ 
      keyword: normalizedKeyword, 
      urls: urls 
    });
  } catch (error) {
    console.error('Error in /api/keywords:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера' 
    });
  }
});

// Маршрут для скачивания контента с прогрессом
app.post('/api/download', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ 
        error: 'Неверный URL' 
      });
    }

    // Устанавливаем заголовки для потоковой передачи
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Скачиваем контент с прогрессом
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const contentLength = response.headers['content-length'] || 0;
    let downloaded = 0;
    const chunks = [];

    response.data.on('data', (chunk) => {
      downloaded += chunk.length;
      chunks.push(chunk);
      
      // Отправляем прогресс
      if (contentLength > 0) {
        const progress = Math.round((downloaded / contentLength) * 100);
        res.write(JSON.stringify({ 
          type: 'progress', 
          progress, 
          downloaded, 
          total: contentLength 
        }) + '\n');
      }
    });

    response.data.on('end', () => {
      const content = Buffer.concat(chunks).toString('utf-8');
      const size = content.length;
      
      res.write(JSON.stringify({ 
        type: 'complete', 
        content, 
        size,
        url,
        timestamp: new Date().toISOString()
      }) + '\n');
      
      res.end();
    });

    response.data.on('error', (error) => {
      console.error('Download error:', error);
      res.write(JSON.stringify({ 
        type: 'error', 
        error: 'Ошибка при скачивании контента' 
      }) + '\n');
      res.end();
    });

  } catch (error) {
    console.error('Error in /api/download:', error);
    res.status(500).json({ 
      error: 'Ошибка при скачивании контента' 
    });
  }
});

// Вспомогательная функция для проверки URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log('Доступные ключевые слова:', Object.keys(keywordsData).join(', '));
});