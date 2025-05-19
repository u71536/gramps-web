import {html} from 'lit'

import {GrampsjsViewTreeChartBase} from './GrampsjsViewTreeChartBase.js'
import '../components/GrampsjsTreeChart.js'

export class GrampsjsViewTreeChart extends GrampsjsViewTreeChartBase {
  constructor() {
    super()
    this.nAnc = 15
    this.nDesc = 15
    this._setAnc = true
  }

  _resetLevels() {
    this.nAnc = 15
    this.nDesc = 15
  }

  renderChart() {
    return html`
      <grampsjs-tree-chart
        ancestors
        grampsId=${this.grampsId}
        nAnc=${this.nAnc + 1}
        nDesc=${this.nDesc + 1}
        nameDisplayFormat=${this.nameDisplayFormat}
        .data=${this._data}
        .appState="${this.appState}"
      >
      </grampsjs-tree-chart>
    `
  }
}

window.customElements.define('grampsjs-view-tree-chart', GrampsjsViewTreeChart)
