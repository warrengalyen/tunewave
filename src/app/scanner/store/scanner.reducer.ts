import { ActionReducer, createReducer, on } from '@ngrx/store';
import * as Actions from './scanner.actions';
import { initialState, ScannerState } from './scanner.state';

export const scannerReducer: ActionReducer<ScannerState> = createReducer(
  initialState,

    // @ts-ignore
  on(Actions.scanStart, (state) => ({ ...state, state: 'scanning' })),
    // @ts-ignore
  on(Actions.scanEnd, (state) => ({ ...state, state: 'idle' })),
    // @ts-ignore
  on(Actions.setLabel, (state, { label }) => ({ ...state, label })),
    // @ts-ignore
  on(Actions.scanSuccess, (state) => ({ ...state, state: 'success' })),
  on(Actions.scanFailure, (state, { error }) => ({
    ...state,
    error,
      // @ts-ignore
    state: 'error',
  }))
);
