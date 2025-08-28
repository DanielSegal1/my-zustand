import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';

type BaseStore = Record<string, any>;
type StoreSetter<T extends BaseStore> = (newState: Partial<T> | ((state: T) => Partial<T>)) => void;
type StoreCreator<T extends BaseStore> = (set: StoreSetter<T>) => T;
type UseStore<T extends BaseStore> = <Selected>(selector: (state: T) => Selected) => Selected;
type StoreListener = () => void;

export const sum = (a: number, b: number) => {
	if (a > 0 && b > 0) {
		return a + b;
	}

	return 0;
};

export const create = <T extends BaseStore = BaseStore>(stateCreator: StoreCreator<T>) => {
	let state: T;
	let listeners: Set<StoreListener> = new Set();

	const set: StoreSetter<T> = (newState) => {
		const newPartialState = typeof newState === 'function' ? newState(state) : newState;
		state = {...state, ...newPartialState};
		listeners.forEach(listener => { listener() });
	};

	state = stateCreator(set);

	const subscribe = (onStoreChange: StoreListener) => {
		listeners.add(onStoreChange);
		return () => {listeners.delete(onStoreChange);};
	};

	const getSnapshot = () => state;

	const hook: UseStore<T> = (selector) => {
		const selected = useSyncExternalStoreWithSelector(subscribe, getSnapshot, getSnapshot, selector);

		return selected;
	};

	return hook;
};
