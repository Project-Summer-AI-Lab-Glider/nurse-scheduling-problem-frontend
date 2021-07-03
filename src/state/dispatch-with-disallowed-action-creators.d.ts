import { PayloadActionCreator } from "@reduxjs/toolkit";
import { AnyAction, Dispatch } from "redux";

/**
 * Custom useDispatch declaration to prevent situations, where instead of Action, ActionCreator is dispatched
 * to state.
 * e.g
 * const actionCreator = createAction("exampleAction");
 * const dispatch = useDispatch();
 * dispatch(actionCreator) <---- error, because here should be an action created by actionCreator.
 * dispatch(actionCreator()) <---- correct
 *
 * ----
 * In case if it is an intended behavior, call useDispatch with generic type param set to AnyAction:
 * const dispatch = useDispatch<AnyAction>()
 * dispatch(actionCreator) <---- now there is no error.
 */

interface DispatchWithDisallowedActionCreators<TPayload> {
  <T extends ThunkFunction<TPayload> | ActionModel<TPayload>>(
    action: T extends PayloadActionCreator ? never : T
  ): T;
}

declare module "react-redux" {
  export function useDispatch<TPayload = unknown>(): TPayload extends AnyAction
    ? Dispatch<AnyAction>
    : DispatchWithDisallowedActionCreators<TPayload>;
}
