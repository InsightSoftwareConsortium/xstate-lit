import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { assign, createMachine, createActor } from 'xstate';
import { SelectorController } from '../../src/select-controller';

const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  context: {
    count: -1,
  },
  states: {
    inactive: {
      entry: assign({ count: ({ context }) => context.count + 1 }),
      on: { TOGGLE: 'active' },
    },
    active: {
      entry: assign({ count: ({ context }) => context.count + 1 }),
      on: { TOGGLE: 'inactive' },
    },
  },
});

const actor = createActor(toggleMachine).start();

@customElement('my-element')
export class MyElement extends LitElement {
  count = new SelectorController(this, actor, (state) => {
    return state.context.count;
  });

  isActive = new SelectorController(
    this,
    actor,
    (state) => state.value === 'active'
  );

  render() {
    const styles = { color: this.isActive.value ? 'green' : 'gray' };
    return html`
      <slot></slot>
      <div class="card">
        <button @click=${this._onClick} part="button" style=${styleMap(styles)}>
          count is ${this.count.value}
        </button>
      </div>
    `;
  }

  private _onClick() {
    actor.send({ type: 'TOGGLE' });
  }

  static styles = css`
    :host {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }

    .card {
      padding: 2em;
    }

    button {
      border-radius: 8px;
      border: 1px solid transparent;
      padding: 0.6em 1.2em;
      font-size: 1em;
      font-weight: 500;
      font-family: inherit;
      background-color: #1a1a1a;
      cursor: pointer;
      transition: border-color 0.25s;
    }
    button:hover {
      border-color: #646cff;
    }
    button:focus,
    button:focus-visible {
      outline: 4px auto -webkit-focus-ring-color;
    }

    @media (prefers-color-scheme: light) {
      a:hover {
        color: #747bff;
      }
      button {
        background-color: #f9f9f9;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'my-element': MyElement;
  }
}
