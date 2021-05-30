/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import _ from "lodash";
import {
  getScheduleKey,
  MonthDataModel,
  ScheduleDataModel,
  validateMonthDM,
} from "../../state/schedule-data/schedule-data.model";
import { cropScheduleDMToMonthDM } from "../schedule-container-converter/schedule-container-converter";
import { MonthHelper } from "../../helpers/month.helper";
import { ArrayHelper } from "../../helpers/array.helper";
import { PersistStorageManager, RevisionType } from "./persistance-store.model";
import { getMonthRevision, saveMonthRevision } from "./month-revision-manager";

export async function saveSchedule(
  revisionType: RevisionType,
  scheduleDataModel: ScheduleDataModel
): Promise<void> {
  const monthDataModel = cropScheduleDMToMonthDM(scheduleDataModel);
  await saveMonthRevision(
    revisionType,
    monthDataModel,
    PersistStorageManager.getInstance().actualPersistProvider
  );

  const { daysMissingFromNextMonth } = MonthHelper.calculateMissingFullWeekDays(
    monthDataModel.scheduleKey
  );

  if (daysMissingFromNextMonth !== 0) {
    await updateNextMonthRevision(revisionType, scheduleDataModel, daysMissingFromNextMonth);
  }
}

async function updateNextMonthRevision(
  revisionType: RevisionType,
  scheduleDataModel: ScheduleDataModel,
  missingDays: number
): Promise<void> {
  try {
    const nextMonthRevisionKey = getScheduleKey(scheduleDataModel).nextMonthKey.getRevisionKey(
      revisionType
    );
    const nextMonthDM = await getMonthRevision(
      nextMonthRevisionKey,
      PersistStorageManager.getInstance().actualPersistProvider
    );

    if (_.isNil(nextMonthDM)) return;

    nextMonthDM.shifts = updateNextMonthShifts(nextMonthDM, scheduleDataModel, missingDays);

    nextMonthDM.month_info = updateNextMonthMonthInfo(nextMonthDM, scheduleDataModel, missingDays);

    validateMonthDM(nextMonthDM);
    await saveMonthRevision(
      revisionType,
      nextMonthDM,
      PersistStorageManager.getInstance().actualPersistProvider
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    error.status !== 404 && console.error(error);
  }
}

function updateNextMonthShifts(
  nextMonthDM: MonthDataModel,
  scheduleDataModel: ScheduleDataModel,
  missingDays: number
) {
  const newShifts = _.cloneDeep(nextMonthDM.shifts);

  Object.keys(nextMonthDM.shifts).forEach((key) => {
    newShifts[key] =
      _.isNil(scheduleDataModel.shifts[key]) || scheduleDataModel.shifts[key]?.length === 0
        ? nextMonthDM.shifts[key]
        : ArrayHelper.update(
            nextMonthDM.shifts[key],
            "HEAD",
            scheduleDataModel.shifts[key],
            missingDays
          );
  });

  return newShifts;
}

function updateNextMonthMonthInfo(
  nextMonthDM: MonthDataModel,
  scheduleDataModel: ScheduleDataModel,
  missingDays: number
) {
  return {
    ...nextMonthDM.month_info,
    children_number: ArrayHelper.update(
      nextMonthDM.month_info.children_number ?? [],
      "HEAD",
      scheduleDataModel.month_info.children_number ?? [],
      missingDays
    ),
    extra_workers: ArrayHelper.update(
      nextMonthDM.month_info.extra_workers ?? [],
      "HEAD",
      scheduleDataModel.month_info.extra_workers ?? [],
      missingDays
    ),
  };
}