import {html, css} from 'lit'

import {GrampsjsViewTreeChartBase} from './GrampsjsViewTreeChartBase.js'
import '../components/GrampsjsRelationshipChart.js'

export class GrampsjsViewRelationshipChart extends GrampsjsViewTreeChartBase {
  static get styles() {
    return [
      super.styles,
      css`
        :host {
          margin: 0;
        }
      `,
    ]
  }

  constructor() {
    super()
    this.nAnc = 15
    this._setSep = true
    this._setMaxImages = true
    this.color = ''
  }

  _resetLevels() {
    this.nAnc = 15
  }

  _getPersonRules(grampsId) {
    return {
      function: 'or',
      rules: [
        {
          name: 'DegreesOfSeparation',
          values: [grampsId, this.nAnc],
        },
      ],
    }
  }

  renderChart() {
    return html`
      <grampsjs-relationship-chart
        grampsId=${this.grampsId}
        nAnc=${this.nAnc + 1}
        nMaxImages=${this.nMaxImages}
        nameDisplayFormat=${this.nameDisplayFormat}
        .data=${this._data}
      >
      </grampsjs-relationship-chart>
    `
  }
}

window.customElements.define(
  'grampsjs-view-relationship-chart',
  GrampsjsViewRelationshipChart
)
