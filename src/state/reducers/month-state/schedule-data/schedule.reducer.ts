/* eslint-disable @typescript-eslint/camelcase */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { combineReducers } from "redux";
import { ScheduleDataModel } from "../../../../common-models/schedule-data.model";
import { CombinedReducers } from "../../../app.reducer";
import { employeeInfoReducerF } from "../employee-info.reducer";
import { monthInfoReducerF } from "../month-info.reducer";
import { scheduleInfoReducerF } from "../schedule-info.reducer";
import { scheduleShiftsInfoReducerF } from "../shifts-info.reducer";

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function scheduleReducerF(name: string) {
  return combineReducers({
    schedule_info: scheduleInfoReducerF(name),
    shifts: scheduleShiftsInfoReducerF(name),
    month_info: monthInfoReducerF(name),
    employee_info: employeeInfoReducerF(name),
  } as CombinedReducers<ScheduleDataModel>);
}
