```typescript
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';

/**
 * Represents a base store with any type of state.
 */
type BaseStore = Record<string, any>;

/**
 * A function that sets the new state for the store and notifies listeners about the change.
 * @param {Partial<T> | ((state: T) => Partial<T>))} newState - The partial or full object representing the updated state of the store, 
 *                                                         which can be a function that takes the current state and returns an update to it.
 */
type StoreSetter<T extends BaseStore> = (newState: Partial<T> | ((state: T) => Partial<T>)) => void;

/**
 * A higher-order component for creating stores with a setter function that can be used by store subscribers.
 * @template <T extends BaseStore> 
 */
type StoreCreator<T extends BaseStore> = (set: StoreSetter<T>) => T;

/**
 * Retrieves the selected part of the state based on a provided selector function, using synchronous external storage with selectors.
 * @template <T extends BaseStore> 
 */
type UseStore<T extends BaseStore> = <Selected>(selector: (state: T) => Selected) => Selected;

/**
 * A simple listener callback that does nothing by default but can be overridden to perform actions when the store changes.
 */
type StoreListener = () => void;

export const sum = (a: number, b: number): number => {
    /** 
     * Calculates and returns the sum of two numbers if both are positive. Otherwise, it defaults to zero.
     */
	if (a > 0 && b > 0) {
		return a + b;
	}

	return 0;
};

/**
 * Creates an observable store with the ability for subscribers to listen and react to state changes using provided selectors.
 * @template <T extends BaseStore = BaseStore> T - The type of the initial or default state created by this function, which can be a partial object representing 
 *                                                         some aspects of the full store's state if needed for lazy initialization purposes (default is to use `BaseStore`).
 * @param {StoreCreator<T>} [stateCreator] - A higher-order component that creates and returns an initial or default store with a setter function. If not provided, 
 *                                            the file will create its own state using lazy initialization (default is to use `BaseStore`).
 */
export const create = <T extends BaseStore = BaseStore>(stateCreator: StoreCreator<T> | ((() => T) & { set(newState?: Partial<T>) })): UseStore<T> => {
	let state: T;
	let listeners: Set<StoreListener> = new Set();

    const set: StoreSetter<T> = (newState) => {
        /** 
         * Updates the store's current state with a partial or full update and notifies all subscribed listeners about this change. If `newState` is provided, it directly updates the state; otherwise, if no argument is given to `set`,
         * then an updater function that takes the current state as input will be used for creating new updated states before setting them in the store's internal variable 'state'. This allows lazy initialization of some parts 
         * of a complex initial or default state. After updating, it iterates over all listeners and calls their callback functions to notify about this change (default behavior). If no listener is provided when `subscribe` was called beforehand, the store will not do anything on its own after setting newState.
         */
		const newPartialState = typeof newState === 'function' ? newState(state) : newState;
		state = {...state, ...newPartialState};
		listeners.forEach(listener => listener());
	};

    state = stateCreator(set); // Initialize the store with a provided or default creator function and setter logic. Defaults to using `BaseStore` if no custom initializer is given, which will use lazy initialization for complex states (default behavior).

    const subscribe = (onStoreChange: StoreListener): ReturnType<typeof getSnapshot> => { // Returns a cleanup subscription that can be used with the store's snapshot to synchronize external stores. This function allows listeners to react when state changes occur and is typically paired with `useSyncExternalStoreWithSelector` in React components (default behavior).
	    let storedSubscription = null;
	    const cleanup = () => { // Clean-up subscription that will be called upon unmounting or explicitly returned by the subscriber to remove itself from listeners. This ensures proper resource management and avoids memory leaks in long-lived applications (default behavior).
	        storedSubscription && storedSubscription();
	    };

	    const snapshot = getSnapshot(); // Retrieves a current state of the store as an object, which is useful for synchronizing external stores or components that rely on this internal state. This function provides immediate access to the latest known good value (default behavior).

        storedSubscription = useSyncExternalStoreWithSelector(subscribe, snapshot);
	    return () => { listeners.delete(onStoreChange) && cleanup(); }; // Returns a subscription that can be used for unsubscribing from store changes and performing the necessary clean-up actions (default behavior). This allows subscribers to control when they want their callbacks executed, such as before component unmounting or after state updates.
    };

    const getSnapshot = () => { return state; } // Provides a snapshot of the current store's internal 'state'. It is used internally for synchronizing external stores and components that rely on this shared data (default behavior). This function ensures consistency across different parts of an application by providing immediate access to the latest known good value.

    const hook: UseStore<T> = (selector) => { return useSyncExternalStoreWithSelector(subscribe, getSnapshot(), state, selector); }; // Returns a selected part of the store's current internal 'state', which can be used in React components or other parts that need to reactively respond to changes. It uses synchronous external storage with selectors for efficient and safe access (default behavior). This function allows subscribers to focus on specific aspects of state, such as user authentication status or theme preferences, without being burdened by the full complexity of managing all store data directly in their components.

    return hook; // Returns a React `useStore` custom hook that can be used within functional components for reactive programming with Redux-like stores (default behavior). This function simplifies state management and makes it easier to create responsive user interfaces by providing an abstraction layer over the store's internal logic.
};
```