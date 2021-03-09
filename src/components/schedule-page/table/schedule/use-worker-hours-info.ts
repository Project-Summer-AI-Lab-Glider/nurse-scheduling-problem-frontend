/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { useSelector } from "react-redux";
import { ShiftCode } from "../../../../common-models/shift-info.model";
import { isAllValuesDefined } from "../../../../common-models/type-utils";
import { MonthDataArray } from "../../../../helpers/shifts.helper";
import { WorkerHourInfo } from "../../../../helpers/worker-hours-info.model";
import {
  ApplicationStateModel,
  ScheduleStateModel,
} from "../../../../state/models/application-state.model";

export function useWorkerHoursInfo(workerName: string): WorkerHourInfo {
  const isEditMode = useSelector(
    (state: ApplicationStateModel) => state.actualState.mode === "edit"
  );
  const scheduleKey: keyof ScheduleStateModel = isEditMode
    ? "temporarySchedule"
    : "persistentSchedule";

  const workerTime = useSelector(
    (state: ApplicationStateModel) => state.actualState[scheduleKey].present.employee_info.time
  )[workerName];
  const workerShifts = useSelector(
    (state: ApplicationStateModel) => state.actualState[scheduleKey].present.shifts
  )[workerName];

  const baseWorkerShifts = useSelector(
    (state: ApplicationStateModel) => state.actualState.primaryRevision.shifts
  )[workerName];

  const { month_number: month, year } = useSelector(
    (state: ApplicationStateModel) => state.actualState[scheduleKey].present.schedule_info
  );
  const { dates } = useSelector(
    (state: ApplicationStateModel) => state.actualState[scheduleKey].present.month_info
  );

  if (!isAllValuesDefined([workerTime, workerShifts])) {
    return new WorkerHourInfo(0, 0);
  }

  return WorkerHourInfo.fromWorkerInfo(
    workerShifts,
    baseWorkerShifts as MonthDataArray<ShiftCode>, // TODO: modify MonthDataModel to contain only MonthDataArray
    workerTime,
    month,
    year,
    dates
  );
}
