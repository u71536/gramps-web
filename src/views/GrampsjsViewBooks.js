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
      `,
    ]
  }

  static get properties() {
    return {
      books: {type: Array},
    }
  }

  constructor() {
    super()
    this.books = [
      {
        id: 1,
        title: 'В аду места не было',
        author: 'Dzhivan Aristakesian',
        description:
          'Все, что я написал, сказал, — спасенные из ада прошлого крохи и частицы, свидетельства моей жизни и жизни народа. Ведь я не раз обречен был исчезнуть, мое существование не должно было продлиться долго — но случилось чудо, и я в состоянии письменно свидетельствовать обо всем, что было. Тем самым я становлюсь правдивым, чистым и полноводным первоисточником. Но уже невозможно упорядочить мои записи согласно последовательности событий, мест и дат.',
        cover: 'images/image.jpg',
        link: 'https://drive.google.com/file/d/1QoQfYFk73uJbTNKzvtl2KN_MygL_8feC/view?usp=sharing',
      },
      {
        id: 2,
        title: 'Ջիվան_գիրք',
        author: 'Dzhivan Aristakesian',
        description: 'Չափածո ստեղծագործություններ',
        cover: 'images/image2.jpg',
        link: 'https://drive.google.com/file/d/1W2LWXIVg_84GXHwawui0Rx98yEscsysE/view?usp=sharing',
      },
      {
        id: 3,
        title: 'Հաստատելու համար',
        author: 'Dzhivan Aristakesian',
        description: 'Չափածո ստեղծագործություններ',
        cover: 'images/image3.jpg',
        link: 'https://drive.google.com/file/d/1dZjLy-YKURjGX714OfeclfS_tIgL6Sbt/view?usp=sharing',
      },
    ]
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
    `
  }

  // eslint-disable-next-line class-methods-use-this
  _openBook(book) {
    window.open(book.link, '_blank')
  }

  _handleKeyDown(event, book) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this._openBook(book)
    }
  }
}

customElements.define('grampsjs-view-books', GrampsjsViewBooks)
