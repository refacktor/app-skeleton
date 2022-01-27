/**
 * Think of it like a Redux store, but easier to use.
 * 
 * @see /examples/StateMachine/index.js for usage.
 **/

const ACTION_TYPE = ({ async *test() { } }).test.constructor;

export default (initialState, children = {}) => {
  let state = { ...initialState };
  const actions = {};
  const kids = {...children};
  const listeners = {
    complete: new Set(),
    step: new Set(),
  };

  const announce = (type, newState, oldState, path = []) => (
    listeners[type].forEach(listener => listener(newState, oldState, type, path))
  );

  const getState = (up = 0) => (
    (up === 0 || !self.parent) 
      ? state
      : self.parent.getState(up - 1)
  );

  const act = async iter => {
    const initState = state;
    for await (const newState of iter) {
      const interState = state;
      state = newState;
      announce('step', state, interState);
    }
    const final = (await iter.return()).value;
    announce('complete', state, initState);
    return final;
  };

  const action = fn => {
    if (typeof fn === 'object' && Object.keys(fn).length === 1) {
      return action(fn[Object.keys(fn)[0]]);
    }
    if (!fn || !fn.name || fn.constructor !== ACTION_TYPE) {
      console.warn('Actions MUST be of the form `async function* actionName() { ... }` or `{ async *actionName() { ... } }`');
    }
    actions[fn.name] = (...args) => act(fn(self, ...args));
    return actions[fn.name];
  };

  const add = (name, child) => {
    child.parent = self;
    kids[name] = machine;
    Object.defineProperty(actions, name, {
      enumerable: true,
      configurable: true, 
      get: () => child.actions,
    });
    state[name] = child.getState();
    ['step', 'complete'].forEach(type => {
      child.listen(type, (newState, _, path) => {
        const oldState = state;
        state[name] = newState;
        announce(type, state, oldState, [name, ...path]);
      });
    });
  };

  const listen = (type, listener) => {
    if (typeof type === 'function') {
      const unlisteners = ['step', 'complete'].map(t => listen(t, type));
      return () => unlisteners.forEach(u => u());
    }
    listeners[type]?.add(listener);
    return () => listeners[type]?.delete(listener);
  };

  // Public stuff
  const machine = { getState, act, listen };

  // Stuff you'll need for making actions
  const self = { ...machine, machine, action };

  Object.keys(kids).forEach(name => add(name, kids[name]));

  return self;
};