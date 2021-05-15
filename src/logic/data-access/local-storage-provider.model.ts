/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import _ from "lodash";
import PouchDB from "pouchdb-browser";
import { ArrayPositionPointer, ArrayHelper } from "../../helpers/array.helper";
import { MonthHelper } from "../../helpers/month.helper";
import { VerboseDateHelper } from "../../helpers/verbose-date.helper";
import {
  MonthDataModel,
  isMonthModelEmpty,
  validateMonthDM,
  ScheduleDataModel,
  getScheduleKey,
  createEmptyMonthDataModel,
} from "../../state/schedule-data/schedule-data.model";
import { cropScheduleDMToMonthDM } from "../schedule-container-converter/schedule-container-converter";
import {
  PersistenceStoreProvider,
  MonthRevision,
  RevisionType,
  RevisionKey,
  getRevisionTypeFromKey,
  ScheduleKey,
} from "./persistance-store.model";
import { LocalMonthRevisionManager } from "./month-revision-manager";

export const DATABASE_NAME = "nurse-scheduling";
export type MonthDMToRevisionKeyDict = { [revisionKey: string]: MonthDataModel };

export class LocalStorageProvider extends PersistenceStoreProvider {
  private storage: PouchDB.Database<MonthRevision>;

  constructor() {
    super();
    this.storage = new PouchDB(DATABASE_NAME);
  }

  async reloadDb(): Promise<void> {
    try {
      await this.storage.destroy();
      this.storage = new PouchDB(DATABASE_NAME);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  async saveSchedule(type: RevisionType, scheduleDataModel: ScheduleDataModel): Promise<void> {
    const monthDataModel = cropScheduleDMToMonthDM(scheduleDataModel);
    await new LocalMonthRevisionManager().saveMonthRevision(type, monthDataModel);

    const { daysMissingFromNextMonth } = MonthHelper.calculateMissingFullWeekDays(
      monthDataModel.scheduleKey
    );

    if (daysMissingFromNextMonth !== 0) {
      const nextMonthRevisionKey = getScheduleKey(scheduleDataModel).nextMonthKey.getRevisionKey(
        type
      );
      await this.updateMonthPartBasedOnScheduleDM(
        nextMonthRevisionKey,
        scheduleDataModel,
        daysMissingFromNextMonth,
        "HEAD"
      );
    }
  }

  async updateMonthPartBasedOnScheduleDM(
    revisionKey: RevisionKey,
    scheduleDataModel: ScheduleDataModel,
    missingDays: number,
    updatePosition: ArrayPositionPointer
  ): Promise<void> {
    try {
      const updatedMonthDataModel = await this.getMonthRevision(revisionKey);
      if (_.isNil(updatedMonthDataModel)) return;

      const newShifts = _.cloneDeep(updatedMonthDataModel.shifts);

      Object.keys(updatedMonthDataModel.shifts).forEach((key) => {
        newShifts[key] =
          _.isNil(scheduleDataModel.shifts[key]) || scheduleDataModel.shifts[key]?.length === 0
            ? updatedMonthDataModel.shifts[key]
            : ArrayHelper.update(
                updatedMonthDataModel.shifts[key],
                updatePosition,
                scheduleDataModel.shifts[key],
                missingDays
              );
      });

      updatedMonthDataModel.shifts = newShifts;
      updatedMonthDataModel.month_info = {
        ...updatedMonthDataModel.month_info,
        children_number: ArrayHelper.update(
          updatedMonthDataModel.month_info.children_number ?? [],
          updatePosition,
          scheduleDataModel.month_info.children_number ?? [],
          missingDays
        ),
        extra_workers: ArrayHelper.update(
          updatedMonthDataModel.month_info.extra_workers ?? [],
          updatePosition,
          scheduleDataModel.month_info.extra_workers ?? [],
          missingDays
        ),
      };

      validateMonthDM(updatedMonthDataModel);
      await new LocalMonthRevisionManager().saveMonthRevision(
        getRevisionTypeFromKey(revisionKey),
        updatedMonthDataModel
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      error.status !== 404 && console.error(error);
    }
  }

  async getMonthRevision(revisionKey: RevisionKey): Promise<MonthDataModel | undefined> {
    try {
      const monthData = (await this.storage.get(revisionKey)).data;
      const { month, year } = monthData.scheduleKey;
      monthData.scheduleKey = new ScheduleKey(month, year);

      validateMonthDM(monthData);
      return monthData;
    } catch (error) {
      // eslint-disable-next-line no-console
      error.status !== 404 && console.error(error);
      return undefined;
    }
  }
}
