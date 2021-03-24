/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { validateEmployeeInfo, WorkersInfoModel } from "./worker-info.model";
import { MonthInfoModel, validateMonthInfo } from "./month-info.model";
import { ScheduleMetadata, validateScheduleInfo } from "./schedule.model";
import {
  ShiftCode,
  ShiftInfoModel,
  ShiftsTypesDict,
  validateShiftInfoModel,
} from "./shift-info.model";
import { ScheduleKey } from "../api/persistance-store.model";
import * as _ from "lodash";
import { MonthHelper, NUMBER_OF_DAYS_IN_WEEK } from "../helpers/month.helper";

/* eslint-disable @typescript-eslint/camelcase */
export enum ScheduleContainerType {
  "MONTH_DM" = "MONTH_DM",
  "SCHEDULE_DM" = "SCHEDULE_DM",
}

export type ScheduleContainerLength = {
  [key in ScheduleContainerType]: number[];
};

const POSSIBLE_WEEK_COUNT_IN_MONTH = [4, 5, 6];

export const SCHEDULE_CONTAINERS_LENGTH: ScheduleContainerLength = {
  MONTH_DM: [28, 29, 30, 31],
  SCHEDULE_DM: POSSIBLE_WEEK_COUNT_IN_MONTH.map((wc) => wc * NUMBER_OF_DAYS_IN_WEEK),
};

export interface ScheduleDataModel {
  schedule_info: ScheduleMetadata;
  month_info: MonthInfoModel;
  employee_info: WorkersInfoModel;
  shifts: ShiftInfoModel;
  shift_types: ShiftsTypesDict;
  isAutoGenerated: boolean;
  isCorrupted: boolean;
}

export interface MonthDataModel extends Omit<ScheduleDataModel, "schedule_info" | "revisionType"> {
  scheduleKey: ScheduleKey;
}

export function validateScheduleDM({
  shifts,
  month_info: monthInfo,
  employee_info: employeeInfo,
  shift_types: shiftTypes,
  schedule_info: scheduleInfo,
}: ScheduleDataModel): void {
  validateScheduleInfo(scheduleInfo);
  validateShiftInfoModel(shifts, ScheduleContainerType.SCHEDULE_DM);
  validateMonthInfo(monthInfo, ScheduleContainerType.SCHEDULE_DM);
  validateEmployeeInfo(employeeInfo);
  validateScheduleContainerDataIntegrity({
    shifts,
    month_info: monthInfo,
    employee_info: employeeInfo,
    shift_types: shiftTypes,
  });
}

export function validateMonthDM({
  shifts,
  month_info: monthInfo,
  employee_info: employeeInfo,
  shift_types: shiftTypes,
}: MonthDataModel): void {
  validateShiftInfoModel(shifts, ScheduleContainerType.MONTH_DM);
  validateMonthInfo(monthInfo, ScheduleContainerType.MONTH_DM);
  validateEmployeeInfo(employeeInfo);
  validateScheduleContainerDataIntegrity({
    shifts,
    month_info: monthInfo,
    employee_info: employeeInfo,
    shift_types: shiftTypes,
  });
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
  const dates = MonthHelper.daysInMonth(scheduleKey.month, scheduleKey.year);
  const monthLength = dates.length;

  const freeShifts: ShiftInfoModel = {};
  Object.keys(shifts).forEach((key) => {
    freeShifts[key] = new Array(monthLength).fill(ShiftCode.W);
  });

  const monthDataModel = {
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
    isCorrupted: false,
  };

  validateMonthDM(monthDataModel);
  return monthDataModel;
}

export function getScheduleKey(newSchedule: ScheduleDataModel): ScheduleKey {
  return new ScheduleKey(
    newSchedule.schedule_info.month_number ?? new Date().getMonth(),
    newSchedule.schedule_info.year ?? new Date().getFullYear()
  );
}

function validateScheduleContainerDataIntegrity({
  month_info: monthInfo,
  employee_info: employeeInfo,
  shifts,
  shift_types: shiftTypes,
}: Pick<ScheduleDataModel, "month_info" | "employee_info" | "shifts" | "shift_types">): void {
  const scheduleLen = monthInfo.dates.length;
  validateShiftLengthIntegrity(scheduleLen, shifts);
  validateWorkersIntegrity(employeeInfo, shifts);
  validateShiftTypesIntegrity(shiftTypes, shifts);
}

function validateShiftLengthIntegrity(scheduleLen: number, shifts: ShiftInfoModel): void {
  if (shifts !== undefined && !_.isEmpty(shifts)) {
    const [worker, workerShifts] = Object.entries(shifts)[0];
    const shiftLen = workerShifts.length;
    if (shiftLen !== scheduleLen) {
      throw new Error(
        `Shifts for worker: ${worker} have different length ${shiftLen} than dates ${shiftLen} `
      );
    }
  }
}

function validateWorkersIntegrity(employeeInfo: WorkersInfoModel, shifts: ShiftInfoModel): void {
  const workersWithShifts = _.sortBy(Object.keys(shifts));
  const workersWithType = _.sortBy(Object.keys(employeeInfo.type));
  if (!_.isEqual(workersWithType, workersWithShifts)) {
    throw new Error(
      `Shifts cannot be defined for workers without defined type. Workers without defined shifts are
      ${workersWithType.filter((w) => !workersWithShifts.includes(w)).join(", ")}`
    );
  }
}

function validateShiftTypesIntegrity(shiftModel: ShiftsTypesDict, shifts: ShiftInfoModel): void {
  const shiftTypes = Object.keys(shiftModel);
  Object.values(shifts).forEach((workerShifts) => {
    const shiftsNotIncludedInShiftTypes = workerShifts.filter(
      (shift) => !shiftTypes.includes(shift)
    );
    if (shiftsNotIncludedInShiftTypes.length > 0) {
      throw new Error(
        `Worker shifts contain shifts codes ${JSON.stringify(
          shiftsNotIncludedInShiftTypes
        )} which are not included in shift model`
      );
    }
  });
}
