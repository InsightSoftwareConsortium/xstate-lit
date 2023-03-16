import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ActorRef, Interpreter, Subscribable, Subscription } from 'xstate';

export const defaultCompare = (a: any, b: any) => a === b;

export function isService(
  actor: any
): actor is Interpreter<any, any, any, any> {
  return 'state' in actor && 'machine' in actor;
}

export function isActorWithState<T extends ActorRef<any>>(
  actorRef: T
): actorRef is T & { state: any } {
  return 'state' in actorRef;
}

export function getServiceSnapshot<
  TService extends Interpreter<any, any, any, any>
>(service: TService): TService['state'] {
  return service.status !== 0
    ? service.getSnapshot()
    : service.machine.initialState;
}

export const getSnapshot = (actorRef: ActorRef<any>) => {
  if (isService(actorRef)) {
    return getServiceSnapshot(actorRef);
  }
  return isActorWithState(actorRef) ? actorRef.state : undefined;
};

export class SelectorController<
  TActor extends ActorRef<any, any>,
  T,
  TEmitted = TActor extends Subscribable<infer Emitted> ? Emitted : never
> implements ReactiveController
{
  private host: ReactiveControllerHost;
  private subscription: Subscription;
  private selected: T;

  constructor(
    host: ReactiveControllerHost,
    actorRef: TActor,
    selector: (emitted: TEmitted) => T,
    compare: (a: T, b: T) => boolean = defaultCompare
  ) {
    this.host = host;
    this.host.addController(this);

    this.selected = selector(getSnapshot(actorRef));

    this.subscription = actorRef.subscribe((emitted) => {
      const nextSelected = selector(emitted);
      if (!compare(this.selected, nextSelected)) {
        this.selected = nextSelected;
        this.host.requestUpdate();
      }
    });
  }

  get value() {
    return this.selected;
  }

  hostDisconnected() {
    this.subscription.unsubscribe();
  }
}

export function connectSelector<
  TActor extends ActorRef<any, any>,
  T,
  TEmitted = TActor extends Subscribable<infer Emitted> ? Emitted : never
>(
  host: ReactiveControllerHost,
  actorRef: TActor,
  selector: (emitted: TEmitted) => T,
  compare: (a: T, b: T) => boolean = defaultCompare
) {
  return new SelectorController(host, actorRef, selector, compare);
}
