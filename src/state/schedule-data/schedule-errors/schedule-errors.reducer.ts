/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import _ from "lodash";
import { GroupedScheduleErrors, ScheduleError } from "./schedule-error.model";

import { createAction, createReducer } from "@reduxjs/toolkit";

export enum ScheduleErrorActionType {
  UPDATE = "updateScheduleError",
}
export const updateScheduleErrors = createAction<ScheduleError[]>("schedule/updateErrors");
export const cleanScheduleErrors = createAction("schedule/cleanErrors");
export const scheduleErrorsReducer = createReducer({} as GroupedScheduleErrors, (builder) => {
  builder
    .addCase(updateScheduleErrors, (state, action) => {
      if (!action.payload) action.payload = [];
      const errors = _.groupBy(action.payload, (item) => item.kind);
      return errors;
    })
    .addCase(cleanScheduleErrors, (state, action) => null)
    .addDefaultCase((state) => state);
});
