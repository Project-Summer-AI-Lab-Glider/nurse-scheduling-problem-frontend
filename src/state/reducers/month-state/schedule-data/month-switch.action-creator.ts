/* eslint-disable @typescript-eslint/camelcase */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { ScheduleKey, ThunkFunction } from "../../../../api/persistance-store.model";
import { fetchOrCreateMonthDM, ScheduleDataActionCreator } from "./schedule-data.action-creator";
import * as _ from "lodash";
import { HistoryReducerActionCreator } from "../../history.reducer";
import { copyShiftsToMonth, cropMonthInfoToMonth, getDateWithMonthOffset } from "./common-reducers";
import {
  cropScheduleDMToMonthDM,
  MonthDataModel,
} from "../../../../common-models/schedule-data.model";

export class MonthSwitchActionCreator {
  static switchToNewMonth(offset: number): ThunkFunction<unknown> {
    return async (dispatch, getState): Promise<void> => {
      const history = getState().history;
      const actualSchedule = getState().actualState.persistentSchedule.present;
      const actualMonth = cropScheduleDMToMonthDM(actualSchedule);
      const { month, year } = actualMonth.scheduleKey;

      const historyAction = HistoryReducerActionCreator.addToMonthHistory(actualMonth);

      const newDate = getDateWithMonthOffset(month, year, offset);
      const newMonthKey = new ScheduleKey(newDate.getMonth(), newDate.getFullYear());

      const nextMonth = await fetchOrCreateMonthDM(newMonthKey, history, actualMonth);
      const addNewScheduleAction = ScheduleDataActionCreator.setScheduleFromMonthDM(nextMonth);

      dispatch(historyAction);
      dispatch(addNewScheduleAction);
    };
  }

  static copyActualMonthToMonthWithOffset(offset: number): ThunkFunction<unknown> {
    return async (dispatch, getState): Promise<void> => {
      const {
        month_number: month,
        year,
      } = getState().actualState.persistentSchedule.present.schedule_info;
      if (month === undefined || year === undefined) return;
      const toDate = getDateWithMonthOffset(month, year, offset);
      const copyingSchedule = getState().history[new ScheduleKey(month, year).key];
      const monthDataModel = copyMonthDM(
        new ScheduleKey(toDate.getMonth(), toDate.getFullYear()),
        copyingSchedule
      );

      dispatch(ScheduleDataActionCreator.setScheduleFromMonthDM(monthDataModel));
    };
  }
}

function copyMonthDM(newMonthKey: ScheduleKey, baseMonth: MonthDataModel): MonthDataModel {
  const { month, year } = newMonthKey;
  return {
    scheduleKey: newMonthKey,
    shifts: copyShiftsToMonth(
      new ScheduleKey(month, year),
      baseMonth.shifts,
      baseMonth.month_info.dates
    ),
    month_info: cropMonthInfoToMonth(new ScheduleKey(month, year), baseMonth.month_info),
    employee_info: _.cloneDeep(baseMonth.employee_info),
  };
}
