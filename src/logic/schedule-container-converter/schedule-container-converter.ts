/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import * as _ from "lodash";
import { MonthHelper } from "../../helpers/month.helper";
import { ArrayHelper } from "../../helpers/array.helper";
import {
  validateWorkerShiftsModel,
  WorkerShiftsModel,
} from "../../state/schedule-data/workers-shifts/worker-shifts.model";
import { ShiftCode } from "../../state/schedule-data/shifts-types/shift-types.model";
import {
  FoundationInfoModel,
  validateFoundationInfo,
} from "../../state/schedule-data/foundation-info/foundation-info.model";
import {
  getScheduleKey,
  MonthDataModel,
  ScheduleContainerType,
  ScheduleDataModel,
  validateMonthDM,
  validateScheduleDM,
} from "../../state/schedule-data/schedule-data.model";
import { RevisionType, ScheduleKey } from "../data-access/persistance-store.model";
import { MonthRevisionManager } from "../data-access/month-revision-manager";

export function extendMonthDMToScheduleDM(
  prevMonthData: MonthDataModel,
  currentMonthData: MonthDataModel,
  nextMonthData: MonthDataModel
): ScheduleDataModel {
  const { scheduleKey } = currentMonthData;
  const {
    daysMissingFromPrevMonth,
    daysMissingFromNextMonth,
  } = MonthHelper.calculateMissingFullWeekDays(scheduleKey);
  const extendSchedule = <T>(
    sectionKey: string,
    valueKey: string,
    prevDefaultValue: T,
    nextDefaultValue: T
  ): T[] =>
    ArrayHelper.extend<T>(
      prevMonthData[sectionKey][valueKey],
      daysMissingFromPrevMonth,
      prevDefaultValue,
      currentMonthData[sectionKey][valueKey],
      nextMonthData[sectionKey][valueKey],
      daysMissingFromNextMonth,
      nextDefaultValue
    );

  const shifts: WorkerShiftsModel = {};
  Object.keys(currentMonthData.shifts).forEach((key) => {
    const nextMonthDefaultShift =
      nextMonthData.isAutoGenerated || nextMonthData.shifts[key] ? ShiftCode.W : ShiftCode.NZ;
    shifts[key] = extendSchedule("shifts", key, ShiftCode.NZ, nextMonthDefaultShift);
  });

  const foundationInfoModel: FoundationInfoModel = {
    children_number: extendSchedule("month_info", "children_number", 0, 0),
    extra_workers: extendSchedule("month_info", "extra_workers", 0, 0),
    dates: extendSchedule("month_info", "dates", 0, 0),
    frozen_shifts: [],
  };

  const scheduleDataModel = {
    ...currentMonthData,
    schedule_info: {
      UUID: "0",
      month_number: scheduleKey.month,
      year: scheduleKey.year,
    },
    month_info: foundationInfoModel,
    shifts,
  };

  validateScheduleDM(scheduleDataModel);
  return scheduleDataModel;
}

export function cropScheduleDMToMonthDM(schedule: ScheduleDataModel): MonthDataModel {
  const { dates } = schedule.month_info;
  const monthStart = dates.findIndex((v) => v === 1);
  const monthKey = getScheduleKey(schedule);
  const shift = cropShiftsToMonth(monthKey, schedule.shifts, monthStart);
  const month = cropMonthInfoToMonth(monthKey, schedule.month_info, monthStart);

  const monthDataModel: MonthDataModel = {
    ...schedule,
    scheduleKey: monthKey,
    shifts: shift,
    month_info: month,
  };

  validateMonthDM(monthDataModel);
  return monthDataModel;
}

export function cropShiftsToMonth(
  scheduleKey: ScheduleKey,
  shifts: WorkerShiftsModel,
  startFromIndex = 0
): WorkerShiftsModel {
  const { month, year } = scheduleKey;
  const days = MonthHelper.daysInMonth(month, year).length;
  const copiedShifts = _.cloneDeep(shifts);
  Object.keys(copiedShifts).forEach((key) => {
    copiedShifts[key] = copiedShifts[key].slice(startFromIndex, startFromIndex + days);
  });

  validateWorkerShiftsModel(copiedShifts, ScheduleContainerType.MONTH_DM);
  return copiedShifts;
}

export function cropMonthInfoToMonth(
  scheduleKey: ScheduleKey,
  monthInfo: FoundationInfoModel,
  startFromIndex = 0
): FoundationInfoModel {
  const { month, year } = scheduleKey;
  const days = MonthHelper.daysInMonth(month, year);

  const monthInfoModel = {
    children_number: ArrayHelper.createArrayOfLengthFromArray(
      monthInfo.children_number ?? [],
      days.length,
      0,
      startFromIndex
    ),
    extra_workers: ArrayHelper.createArrayOfLengthFromArray(
      monthInfo.extra_workers ?? [],
      days.length,
      0,
      startFromIndex
    ),
    dates: days,
    frozen_shifts: [],
  };

  validateFoundationInfo(monthInfoModel, ScheduleContainerType.MONTH_DM);
  return monthInfoModel;
}

export async function extendMonthDMRevisionToScheduleDM(
  currentMonthData: MonthDataModel,
  revision: RevisionType
): Promise<ScheduleDataModel> {
  const [prevMonth, nextMonth] = await new MonthRevisionManager().fetchOrCreateMonthNeighbours(
    currentMonthData,
    revision
  );
  return extendMonthDMToScheduleDM(prevMonth, currentMonthData, nextMonth);
}
