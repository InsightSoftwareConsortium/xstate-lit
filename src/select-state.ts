import { ContextConsumer } from "@lit-labs/context";
import { ReactiveController, ReactiveElement } from "lit";
import { AnyStateMachine, InterpreterFrom, Subscribable } from "xstate";
import { SelectorController } from "./select-controller";

const defaultCompare = (a: any, b: any) => a === b;

export class SelectState<
  TMachine extends AnyStateMachine,
  TContext extends {
    __context__: { service: InterpreterFrom<TMachine> };
  },
  T,
  TEmitted = InterpreterFrom<TMachine> extends Subscribable<infer Emitted>
    ? Emitted
    : never
> implements ReactiveController
{
  private serviceContext: ContextConsumer<TContext, ReactiveElement>;
  private selectorController?: SelectorController<
    InterpreterFrom<TMachine>,
    T,
    TEmitted
  >;
  private host: ReactiveElement;

  private selector: (emitted: TEmitted) => T;
  compare: (a: T, b: T) => boolean = defaultCompare; // is current value same as old value?

  constructor(
    context: TContext,
    host: ReactiveElement,
    selector: (emitted: TEmitted) => T,
    compare: (a: T, b: T) => boolean = defaultCompare
  ) {
    (this.host = host).addController(this);
    this.serviceContext = new ContextConsumer(
      this.host,
      context,
      undefined,
      true
    );
    this.selector = selector;
    this.compare = compare;
  }

  hostConnected() {
    // has hostConnected already been called?
    if (this.selectorController) {
      this.hostDisconnected();
    }
    this.serviceContext.hostConnected();
    this.selectorController = new SelectorController(
      this.host,
      this.serviceContext.value!.service,
      this.selector,
      this.compare
    );
  }

  hostDisconnected() {
    this.serviceContext?.hostDisconnected();
    this.selectorController?.hostDisconnected();
  }

  get value() {
    return this.selectorController?.value;
  }
}

export function connectState<
  T,
  TMachine extends AnyStateMachine,
  TContext extends {
    __context__: { service: InterpreterFrom<TMachine> };
  },
  TEmitted = InterpreterFrom<TMachine> extends Subscribable<infer Emitted>
    ? Emitted
    : never
>(
  context: TContext,
  host: ReactiveElement,
  selector: (emitted: TEmitted) => T,
  compare: (a: T, b: T) => boolean = defaultCompare
) {
  return new SelectState(context, host, selector, compare);
}

export const compareArrays = (a: unknown[], b: unknown[]) =>
  a.length === b.length && a.every((value, idx) => value === b[idx]);

export const compareObjects = (obj1: Object, obj2: Object) =>
  Object.keys(obj1).length === Object.keys(obj2).length &&
  (Object.keys(obj1) as (keyof typeof obj1)[]).every((key) => {
    return (
      Object.prototype.hasOwnProperty.call(obj2, key) && obj1[key] === obj2[key]
    );
  });
