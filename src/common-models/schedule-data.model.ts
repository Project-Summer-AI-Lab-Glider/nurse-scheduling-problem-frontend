/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { WorkersInfoModel } from "./worker-info.model";
import { MonthInfoModel } from "./month-info.model";
import { ScheduleMetadata } from "./schedule.model";
import { ShiftCode, ShiftInfoModel, ShiftModel } from "./shift-info.model";
import { ScheduleKey } from "../api/persistance-store.model";
import _ from "lodash";
import {
  calculateMissingFullWeekDays,
  cropMonthInfoToMonth,
  cropShiftsToMonth,
  daysInMonth,
} from "../state/reducers/month-state/schedule-data/common-reducers";
import { ArrayHelper } from "../helpers/array.helper";

/* eslint-disable @typescript-eslint/camelcase */

export interface ScheduleDataModel {
  schedule_info: ScheduleMetadata;
  month_info: MonthInfoModel;
  employee_info: WorkersInfoModel;
  shifts: ShiftInfoModel;
  shift_types: ShiftModel;
  isAutoGenerated: boolean;
}

export interface MonthDataModel extends Omit<ScheduleDataModel, "schedule_info" | "revisionType"> {
  scheduleKey: ScheduleKey;
}

export function isMonthModelEmpty(monthDataModel: MonthDataModel): boolean {
  const requiredFields: (keyof Pick<
    MonthDataModel,
    "employee_info" | "month_info" | "shifts"
  >)[] = ["employee_info", "month_info", "shifts"];
  return requiredFields.every((field) => {
    const requiredObject = monthDataModel[field];
    return Object.values(requiredObject).every((field) => _.isEmpty(field));
  });
}

export function createEmptyMonthDataModel(
  scheduleKey: ScheduleKey,
  {
    employee_info,
    shifts,
    shift_types,
  }: Pick<MonthDataModel, "employee_info" | "shifts" | "shift_types">
): MonthDataModel {
  const dates = daysInMonth(scheduleKey.month, scheduleKey.year);
  const monthLength = dates.length;

  const freeShifts: ShiftInfoModel = {};
  Object.keys(shifts).forEach((key) => {
    freeShifts[key] = new Array(monthLength).fill(ShiftCode.W);
  });
  return {
    scheduleKey,
    month_info: {
      children_number: new Array(monthLength).fill(0),
      extra_workers: new Array(monthLength).fill(0),
      frozen_shifts: [],
      dates,
    },
    employee_info: _.cloneDeep(employee_info),
    shifts: freeShifts,
    isAutoGenerated: true,
    shift_types: _.cloneDeep(shift_types),
  };
}

export function getScheduleKey(newSchedule: ScheduleDataModel): ScheduleKey {
  return new ScheduleKey(
    newSchedule.schedule_info.month_number ?? new Date().getMonth(),
    newSchedule.schedule_info.year ?? new Date().getFullYear()
  );
}

export function extendMonthDMToScheduleDM(
  prevMonthData: MonthDataModel,
  currentMonthData: MonthDataModel,
  nextMonthData: MonthDataModel
): ScheduleDataModel {
  const { scheduleKey } = currentMonthData;
  const [missingFromPrev, missingFromNext] = calculateMissingFullWeekDays(scheduleKey);
  const extendSchedule = <T>(sectionKey: string, valueKey: string, defaultValue: T): T[] =>
    ArrayHelper.extend<T>(
      prevMonthData[sectionKey][valueKey],
      missingFromPrev,
      currentMonthData[sectionKey][valueKey],
      nextMonthData[sectionKey][valueKey],
      missingFromNext,
      defaultValue
    );

  const shifts: ShiftInfoModel = {};
  Object.keys(currentMonthData.shifts).forEach((key) => {
    shifts[key] = extendSchedule("shifts", key, ShiftCode.W);
  });

  debugger;
  const monthInfoModel: MonthInfoModel = {
    children_number: extendSchedule("month_info", "children_number", 0),
    extra_workers: extendSchedule("month_info", "extra_workers", 0),
    dates: extendSchedule("month_info", "dates", 0),
    frozen_shifts: [],
  };

  return {
    schedule_info: {
      UUID: "0",
      month_number: scheduleKey.month,
      year: scheduleKey.year,
    },
    month_info: monthInfoModel,
    employee_info: _.cloneDeep(currentMonthData.employee_info),
    shifts,
    isAutoGenerated: currentMonthData.isAutoGenerated,
    shift_types: _.cloneDeep(currentMonthData.shift_types),
  };
}

export function cropScheduleDMToMonthDM(schedule: ScheduleDataModel): MonthDataModel {
  const { dates } = schedule.month_info;
  const monthStart = dates.findIndex((v) => v === 1);
  const monthKey = getScheduleKey(schedule);
  const shift = cropShiftsToMonth(monthKey, schedule.shifts, monthStart);
  const month = cropMonthInfoToMonth(monthKey, schedule.month_info, monthStart);
  return {
    scheduleKey: monthKey,
    shifts: shift,
    month_info: month,
    employee_info: _.cloneDeep(schedule.employee_info),
    isAutoGenerated: schedule.isAutoGenerated,
    shift_types: _.cloneDeep(schedule.shift_types),
  };
}
