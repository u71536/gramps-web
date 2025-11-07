# Настройка медиафайлов для библиотеки книг

## Структура папок

Создайте следующую структуру папок в корне проекта:

```
media/
└── books/
    ├── v-adu-mesta-ne-bylo.jpg
    ├── jivan-girq.jpg
    └── hastatelou-hamar.jpg
```

## Шаги настройки

### 1. Создание папки books
```bash
mkdir -p media/books
```

### 2. Скачивание изображений с Google Drive

Скачайте изображения обложек книг из Google Drive и сохраните их с указанными именами:

- **Книга "В аду места не было"**
  - Google Drive ID: `1uICmdx9ZmakhO5ETyNKgegu-v8pU1ouF`
  - Сохранить как: `media/books/v-adu-mesta-ne-bylo.jpg`

- **Книга "Ջիվան_գիրք"**
  - Google Drive ID: `106dkS5G7nlg6tfzU8ZrOErlP-0ldLI_e`
  - Сохранить как: `media/books/jivan-girq.jpg`

- **Книга "Հաստատելու համար"**
  - Google Drive ID: `1myNh0eaBY7QyXKnsSIIMmgWrJUe74Zmd`
  - Сохранить как: `media/books/hastatelou-hamar.jpg`

### 3. Альтернативный способ скачивания

Можно использовать wget для скачивания:

```bash
# Переходим в папку books
cd media/books

# Скачиваем изображения (замените FILE_ID на соответствующие ID)
wget "https://drive.usercontent.google.com/download?id=1uICmdx9ZmakhO5ETyNKgegu-v8pU1ouF&export=view&authuser=0" -O v-adu-mesta-ne-bylo.jpg

wget "https://drive.usercontent.google.com/download?id=106dkS5G7nlg6tfzU8ZrOErlP-0ldLI_e&export=view&authuser=0" -O jivan-girq.jpg

wget "https://drive.usercontent.google.com/download?id=1myNh0eaBY7QyXKnsSIIMmgWrJUe74Zmd&export=view&authuser=0" -O hastatelou-hamar.jpg
```

### 4. Сборка проекта

После добавления изображений выполните сборку:

```bash
npm run build
```

### 5. Рекомендации по изображениям

- **Формат**: JPG или PNG
- **Размер**: рекомендуется 300x400 пикселей или больше
- **Соотношение сторон**: 3:4 (как у обычных книг)
- **Размер файла**: не более 500KB для быстрой загрузки

## Добавление новых книг

Для добавления новых книг:

1. Добавьте изображение в `media/books/`
2. Обновите массив `books` в файле `src/views/GrampsjsViewBooks.js`
3. Укажите правильный путь к изображению: `/media/books/filename.jpg`
4. Выполните сборку проекта

## Проверка

После настройки изображения должны отображаться по адресам:
- http://your-domain/media/books/v-adu-mesta-ne-bylo.jpg
- http://your-domain/media/books/jivan-girq.jpg
- http://your-domain/media/books/hastatelou-hamar.jpg