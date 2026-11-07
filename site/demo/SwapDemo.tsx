import { Stage } from './kit/stage'
import { Phone } from './kit/phone'
import { Bar } from './kit/window'
import { Roll, Swap } from './kit/motion'
import { Meter } from './kit/parts/Meter'
import type { Act } from './kit/act'
import { recipeById } from '../../shared/core.js'
import { plateSVG } from '../../shared/plate.js'
import './swap-demo.css'

// Tafel's swap, as the marketing page's "How it works" figure. Story in four
// beats on Friday of a real default plan: the week's total and Friday's meals
// (context); a tap on Swap under dinner opens the alternatives, each priced by
// what it does to the week (action); a tap on the cheaper stir-fry closes the
// sheet and the dinner changes in place (result); a beat later the week's
// total rolls down and the spare grows (payoff). Plays once, holds the payoff;
// the host's Replay button remounts it.
//
// Figures come from generatePlan() with default settings (2 adults, R1 200):
// R996 for the week, and swapping Friday's fishcakes for the stir-fry is -R28.
//
// Real strings: the total and its budget, R spare, Friday, Dinner, the two
// dinners, Swap, the two alternatives and their deltas. Breakfast and lunch
// are plates and lines.

type S = { open: boolean; picked: boolean; pressed: boolean }
const START: S = { open: false, picked: false, pressed: false }
const DONE: S = { open: false, picked: true, pressed: false }

const BUDGET = 1200
const BEFORE = 996
const AFTER = 968
const money = (n: number) => 'R' + n.toLocaleString('en-ZA').replace(/,/g, ' ')

const BREAKFAST = recipeById('b_maize_porridge')
const LUNCH = recipeById('l_livers_toast')
const FROM = recipeById('d_fishcakes')
const TO = recipeById('d_mince_cabbage')
const ALT2 = recipeById('d_bobotie')

const THEME = { dish: '#fbf9f3', rim: '#dedbd0', shadow: '#0000001c' }
function Plate({ recipe, size }: { recipe: any; size: number }) {
  return <span className="tf-plate" style={{ width: size, height: size }} aria-hidden dangerouslySetInnerHTML={{ __html: plateSVG(recipe, THEME, size) }} />
}

const REST = { wide: { x: 330, y: 560 }, compact: { x: 300, y: 530 } }

const script = async (a: Act<S>) => {
  await a.wait(1200)
  a.mark('swap')
  await a.click('swap')
  a.put({ open: true })
  // Reading time: the two prices are the point of the sheet
  await a.wait(1700)
  a.mark('pick')
  await a.click('pick')
  a.put({ pressed: true })
  await a.wait(220)
  a.put({ open: false, picked: true, pressed: false })
  await a.wait(500)
  a.move(REST[a.layout])
  await a.wait(2600)
}

export default function SwapDemo() {
  return (
    <Stage<S>
      width={400}
      height={580}
      compact={{ below: 400, width: 358, height: 552 }}
      initial={START}
      poster={DONE}
      play="once"
      script={script}
      cursor={{ at: REST, style: 'touch' }}
      className="tf"
    >
      {(s, _rect, layout) => {
        const total = s.picked ? AFTER : BEFORE
        return (
          <Phone width={layout === 'compact' ? 318 : 336} className="tf-phone">
            <div className="tf-app" data-back={s.open || undefined}>
              <div className="tf-head">
                <span className="tf-cap">2–8 Nov</span>
                <span className="tf-word">TAFEL</span>
                <span className="tf-head__end" />
              </div>

              <div className="tf-budget">
                <span className="tf-cap">Groceries this week</span>
                <div className="tf-budget__row">
                  <span className="tf-total"><Roll delay={420}>{money(total)}</Roll></span>
                  <span className="tf-of">of {money(BUDGET)}</span>
                  <span className="tf-spare"><Roll delay={520}>{money(BUDGET - total)}</Roll> to spare</span>
                </div>
                <Meter value={total / BUDGET} tone="ink" className="tf-meter" />
              </div>

              <div className="tf-day">Friday 6 November</div>

              <div className="tf-meals">
                {[BREAKFAST, LUNCH].map((r, i) => (
                  <div className="tf-meal" key={i}>
                    <Bar w={i ? 46 : 64} h={6} r={3} tone={2} className="tf-meal__when" />
                    <div className="tf-meal__main">
                      <Plate recipe={r} size={58} />
                      <span className="tf-meal__text">
                        <Bar w={i ? 150 : 128} h={10} r={4} tone={3} />
                        <Bar w={i ? 84 : 96} h={7} r={3} tone={2} />
                      </span>
                    </div>
                  </div>
                ))}
                <div className="tf-meal tf-meal--focus">
                  <span className="tf-meal__label">Dinner</span>
                  <div className="tf-meal__main">
                    <span className="tf-plates">
                      <span className="tf-plates__one" data-on={!s.picked || undefined}><Plate recipe={FROM} size={58} /></span>
                      <span className="tf-plates__one" data-on={s.picked || undefined}><Plate recipe={TO} size={58} /></span>
                    </span>
                    <span className="tf-meal__text">
                      <Swap id={s.picked ? 'to' : 'from'} className="tf-name">{s.picked ? TO.name : FROM.name}</Swap>
                      <Swap id={s.picked ? 'to-m' : 'from-m'} className="tf-meta">{s.picked ? `${TO.mins} min  •  26 g protein` : `${FROM.mins} min  •  33 g protein`}</Swap>
                    </span>
                    <span className="tf-link" data-target="swap">Swap</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="tf-scrim" data-on={s.open || undefined} />
            <div className="tf-sheet" data-open={s.open || undefined}>
              <div className="tf-sheet__top">
                <span className="tf-cap">Friday dinner</span>
                <span className="tf-cap tf-close">Close</span>
              </div>
              <div className="tf-sheet__lead">What each does to this week's total</div>
              <div className="tf-alt" data-target="pick" data-pressed-on={s.pressed || undefined}>
                <Plate recipe={TO} size={46} />
                <span className="tf-alt__text"><span className="tf-alt__name">{TO.name}</span><span className="tf-meta">{TO.mins} min  •  26 g protein</span></span>
                <span className="tf-delta tf-delta--down">−R28</span>
              </div>
              <div className="tf-alt">
                <Plate recipe={ALT2} size={46} />
                <span className="tf-alt__text"><span className="tf-alt__name">{ALT2.name}</span><span className="tf-meta">{ALT2.mins} min  •  36 g protein</span></span>
                <span className="tf-delta tf-delta--down">−R28</span>
              </div>
              <div className="tf-alt">
                <span className="tf-alt__ph" />
                <span className="tf-alt__text"><Bar w={132} h={10} r={4} tone={3} /><Bar w={88} h={7} r={3} tone={2} /></span>
                <Bar w={34} h={10} r={4} tone={2} />
              </div>
            </div>
          </Phone>
        )
      }}
    </Stage>
  )
}
