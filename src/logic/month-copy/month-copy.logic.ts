/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import {
  MonthDataModel,
  ScheduleDataModel,
  validateScheduleDM,
} from "../../common-models/schedule-data.model";
import * as _ from "lodash";
import { ShiftCode, ShiftInfoModel } from "../../common-models/shift-info.model";
import { ArrayHelper } from "../../helpers/array.helper";
import { createDatesForMonth, MonthInfoModel } from "../../common-models/month-info.model";
import { ScheduleKey } from "../../api/persistance-store.model";
import { MonthHelper, NUMBER_OF_DAYS_IN_WEEK } from "../../helpers/month.helper";
import { ShiftHelper } from "../../helpers/shifts.helper";
import { DEFAULT_CHILDREN_NUMBER } from "../schedule-parser/children-info.parser";
import { DEFAULT_EXTRA_WORKERS_NUMBER } from "../schedule-parser/extra-workers.parser";

/* eslint-disable @typescript-eslint/camelcase */
export function copyMonthDM(
  currentSchedule: MonthDataModel,
  baseMonth: MonthDataModel
): ScheduleDataModel {
  const copiedMonth: ScheduleDataModel = {
    schedule_info: {
      UUID: "0",
      year: currentSchedule.scheduleKey.year,
      month_number: currentSchedule.scheduleKey.month,
    },
    shifts: copyShifts(currentSchedule, baseMonth.shifts),
    month_info: copyMonthInfo(currentSchedule, baseMonth.month_info),
    employee_info: _.cloneDeep(baseMonth.employee_info),
    shift_types: _.cloneDeep(baseMonth.shift_types),
    isAutoGenerated: false,
    isCorrupted: false,
  };
  validateScheduleDM(copiedMonth);
  return copiedMonth;
}

export function copyShifts(
  { scheduleKey: currentScheduleKey, shifts: currentScheduleShifts }: MonthDataModel,
  baseShifts: ShiftInfoModel
): ShiftInfoModel {
  const newMonthWorkersShifts: ShiftInfoModel = {};
  const { daysMissingFromPrevMonth } = MonthHelper.calculateMissingFullWeekDays(currentScheduleKey);
  const replacementStart = daysMissingFromPrevMonth > 0 ? NUMBER_OF_DAYS_IN_WEEK : 0;

  Object.keys(baseShifts).forEach((workerKey) => {
    const copiedShifts = copyMonthData(
      currentScheduleKey,
      baseShifts[workerKey],
      ShiftCode.W,
      currentScheduleShifts[workerKey]
    );
    newMonthWorkersShifts[workerKey] = ShiftHelper.replaceFreeShiftsWithFreeDay(
      copiedShifts,
      replacementStart
    );
  });
  return newMonthWorkersShifts;
}

export function copyMonthInfo(
  { scheduleKey: currentScheduleKey, month_info: currentMonthInfo }: MonthDataModel,
  baseMonthInfo: MonthInfoModel
): MonthInfoModel {
  const dates = createDatesForMonth(currentScheduleKey.year, currentScheduleKey.month);
  return {
    children_number: copyMonthData(
      currentScheduleKey,
      baseMonthInfo.children_number ?? [],
      DEFAULT_CHILDREN_NUMBER,
      currentMonthInfo.children_number ?? []
    ),
    extra_workers: copyMonthData(
      currentScheduleKey,
      baseMonthInfo.extra_workers ?? [],
      DEFAULT_EXTRA_WORKERS_NUMBER,
      currentMonthInfo.extra_workers ?? []
    ),
    dates,
    frozen_shifts: [],
  };
}

function copyMonthData<T>(
  monthKey: ScheduleKey,
  baseMonthData: T[],
  defaultCurrentValue: T,
  currentMonthData?: T[]
): T[] {
  const { month: baseMonth, year: baseYear } = monthKey.prevMonthKey;
  const numberOfDaysToBeCopied = getNumberOfDaysToBeCopied(monthKey);
  const copyBase = cropMonthDataToFullWeeks(baseYear, baseMonth, baseMonthData);
  const copiedData = ArrayHelper.circularExtendToLength(copyBase, numberOfDaysToBeCopied);
  const currentMonthLength = MonthHelper.getMonthLength(monthKey.year, monthKey.month);
  currentMonthData = currentMonthData ?? Array(currentMonthLength).fill(defaultCurrentValue);

  const isMonthStartInMonday = new Date(monthKey.year, monthKey.month).getDay() === 1;
  if (isMonthStartInMonday) {
    return copiedData;
  } else {
    const prevMonthLastWeekData = MonthHelper.getMonthLastWeekData(
      monthKey.prevMonthKey,
      baseMonthData,
      currentMonthData
    );
    return prevMonthLastWeekData.concat(copiedData);
  }
}
//returns always 4 or 5 weeks due by the algorithm which operates on whole weeks instead of months
function getNumberOfDaysToBeCopied(monthKey: ScheduleKey): number {
  return MonthHelper.findFirstMonthMondayIdx(monthKey.year, monthKey.month) +
    4 * NUMBER_OF_DAYS_IN_WEEK >=
    MonthHelper.getMonthLength(monthKey.year, monthKey.month)
    ? 4 * NUMBER_OF_DAYS_IN_WEEK
    : 5 * NUMBER_OF_DAYS_IN_WEEK;
}

function cropMonthDataToFullWeeks<T>(year: number, month: number, monthData: T[]): T[] {
  const firstMonthMonday = MonthHelper.findFirstMonthMondayIdx(year, month);
  return monthData.slice(
    firstMonthMonday,
    firstMonthMonday + MonthHelper.getMonthFullWeeksDaysLen(year, month)
  );
}
