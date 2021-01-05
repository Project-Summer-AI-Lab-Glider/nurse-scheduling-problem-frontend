import { ScheduleModel } from "../../../common-models/schedule.model";
import { scheduleDataInitialState } from "./schedule-data/schedule-data-initial-state";
import { ScheduleActionModel } from "./schedule-data/schedule-data.action-creator";
import { TemporaryScheduleActionType } from "./schedule-data/temporary-schedule.reducer";

let uuid = 0;

/* eslint-disable @typescript-eslint/camelcase */

export function scheduleInfoReducer(
  state: ScheduleModel = scheduleDataInitialState.schedule_info,
  action: ScheduleActionModel
): ScheduleModel {
  const data = action.payload?.schedule_info;
  if (!data) return state;
  switch (action.type) {
    case TemporaryScheduleActionType.ADD_NEW:
      uuid += 1;
      return { ...data, UUID: uuid.toString() };
    case TemporaryScheduleActionType.UPDATE:
      return { ...state, ...data };
    default:
      return state;
  }
}