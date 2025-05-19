import {html, css} from 'lit'
import {GrampsjsView} from './GrampsjsView.js'
import {sharedStyles} from '../SharedStyles.js'

export class GrampsjsViewBooks extends GrampsjsView {
  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          margin: 2em;
        }
        .book-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 2em;
          padding: 1em;
        }
        .book-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1em;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .book-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .book-cover {
          width: 150px;
          height: 200px;
          object-fit: cover;
          border-radius: 4px;
          margin-bottom: 1em;
        }
        .book-title {
          font-size: 1.2em;
          font-weight: bold;
          text-align: center;
          margin-bottom: 0.5em;
        }
        .book-author {
          color: #666;
          margin-bottom: 0.5em;
        }
        .book-description {
          font-size: 0.9em;
          color: #666;
          text-align: center;
        }
        #pdfViewer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: white;
          z-index: 1000;
          display: none;
        }
        #pdfViewer.active {
          display: block;
        }
        .close-button {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1001;
          background: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .loading {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(255, 255, 255, 0.8);
          z-index: 1002;
        }
      `,
    ]
  }

  static get properties() {
    return {
      books: {type: Array},
      currentBook: {type: Object},
      showPdfViewer: {type: Boolean},
      pdfLoaded: {type: Boolean},
    }
  }

  constructor() {
    super()
    this.books = [
      {
        id: 1,
        title: 'В аду места не было',
        author: 'Аристакесян Дживан',
        description:
          'Все, что я написал, сказал, — спасенные из ада прошлого крохи и частицы, свидетельства моей жизни и жизни народа. Ведь я не раз обречен был исчезнуть, мое существование не должно было продлиться долго — но случилось чудо, и я в состоянии письменно свидетельствовать обо всем, что было. Тем самым я становлюсь правдивым, чистым и полноводным первоисточником. Но уже невозможно упорядочить мои записи согласно последовательности событий, мест и дат.',
        cover: '/static/img/18574939.webp',
        pdf: '/static/books/книга.pdf',
      },
      {
        id: 2,
        title: 'Книга 2',
        author: 'Автор 2',
        description: 'Описание второй книги',
        cover: '/static/img/book2.jpg',
        pdf: '/static/books/book2.pdf',
      },
      {
        id: 3,
        title: 'Книга 3',
        author: 'Автор 3',
        description: 'Описание третьей книги',
        cover: '/static/img/book3.jpg',
        pdf: '/static/books/book3.pdf',
      },
    ]
    this.currentBook = null
    this.showPdfViewer = false
    this.pdfLoaded = false
  }

  render() {
    return html`
      <h2>${this._('Библиотека')}</h2>
      <div class="book-grid">
        ${this.books.map(
          book => html`
            <div
              class="book-card"
              @click=${() => this._openBook(book)}
              @keydown=${e => this._handleKeyDown(e, book)}
              role="button"
              tabindex="0"
            >
              <img class="book-cover" src="${book.cover}" alt="${book.title}" />
              <div class="book-title">${book.title}</div>
              <div class="book-author">${book.author}</div>
              <div class="book-description">${book.description}</div>
            </div>
          `
        )}
      </div>
      <div id="pdfViewer" class="${this.showPdfViewer ? 'active' : ''}">
        <button class="close-button" @click=${this._closePdfViewer}>✕</button>
        ${this.currentBook
          ? html`
              <iframe
                src="${this.currentBook.pdf}"
                title="Book Viewer"
                @load=${this._handleIframeLoad}
                width="100%"
                height="100%"
                frameborder="0"
              ></iframe>
              ${!this.pdfLoaded
                ? html`<div class="loading">Loading PDF...</div>`
                : ''}
            `
          : ''}
      </div>
    `
  }

  _openBook(book) {
    this.currentBook = book
    this.showPdfViewer = true
    this.pdfLoaded = false
    // Сохраняем прогресс чтения
    const readingProgress = {
      bookId: book.id,
      timestamp: new Date().toISOString(),
      position: 0, // Начальная позиция
    }
    localStorage.setItem(
      `book_progress_${book.id}`,
      JSON.stringify(readingProgress)
    )
  }

  _closePdfViewer() {
    this.showPdfViewer = false
    this.currentBook = null
  }

  _handleKeyDown(event, book) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this._openBook(book)
    }
  }

  _handleIframeLoad() {
    this.pdfLoaded = true
    // Восстанавливаем позицию чтения, если она есть
    if (this.currentBook) {
      const savedProgress = localStorage.getItem(
        `book_progress_${this.currentBook.id}`
      )
      if (savedProgress) {
        const progress = JSON.parse(savedProgress)
        // Отправляем сообщение в iframe для восстановления позиции
        const iframe = this.shadowRoot.querySelector('iframe')
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              type: 'restorePosition',
              position: progress.position || 0,
            },
            '*'
          )
        }
      }
    }
  }

  // Добавляем обработчик сообщений от iframe
  connectedCallback() {
    super.connectedCallback()
    window.addEventListener('message', this._handlePdfMessage.bind(this))
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('message', this._handlePdfMessage.bind(this))
  }

  _handlePdfMessage(event) {
    if (event.data.type === 'positionChanged' && this.currentBook) {
      // Обновляем сохраненную позицию
      const readingProgress = {
        bookId: this.currentBook.id,
        timestamp: new Date().toISOString(),
        position: event.data.position,
      }
      localStorage.setItem(
        `book_progress_${this.currentBook.id}`,
        JSON.stringify(readingProgress)
      )
    }
  }
}

customElements.define('grampsjs-view-books', GrampsjsViewBooks)
