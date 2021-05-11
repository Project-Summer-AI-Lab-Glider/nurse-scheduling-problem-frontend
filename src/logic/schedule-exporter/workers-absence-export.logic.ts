/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import xlsx from "exceljs";
import { ScheduleDataModel } from "../../state/schedule-data/schedule-data.model";
import { EMPTY_ROW, ABSENCE_HEADERS } from "../../helpers/parser.helper";
import { CELL_MARGIN } from "./schedule-export.logic";
import { ShiftCode, SHIFTS } from "../../state/schedule-data/shifts-types/shift-types.model";
import { TranslationHelper } from "../../helpers/translations.helper";

export class WorkersAbsenceExportLogic {
  private scheduleModel: ScheduleDataModel;

  constructor(scheduleModel: ScheduleDataModel) {
    this.scheduleModel = scheduleModel;
  }

  public setWorkersWorkSheet(workSheet: xlsx.Worksheet): void {
    workSheet.pageSetup.showGridLines = true;
    workSheet.pageSetup.fitToPage = true;
    workSheet.pageSetup.fitToHeight = 1;
    workSheet.pageSetup.fitToWidth = 1;
    workSheet.pageSetup.horizontalCentered = true;

    const workersInfoArray = WorkersAbsenceExportLogic.createWorkersInfoSection(this.scheduleModel);

    const colLens = workersInfoArray[0].map((_, colIndex) =>
      Math.max(...workersInfoArray.map((row) => row[colIndex]?.toString().length ?? 0))
    );

    workSheet.addRows(workersInfoArray);

    colLens.forEach((len, id) => {
      workSheet.getColumn(id + 1).width = len + CELL_MARGIN;
    });

    workSheet.getColumn(1).alignment = { vertical: "middle", horizontal: "left" };
    for (let i = 1; i <= ABSENCE_HEADERS.length; i++) {
      workSheet.getColumn(i).alignment = { vertical: "middle", horizontal: "center" };
    }

    workSheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
    workSheet.getRow(1).font = { bold: true };
  }

  private static createWorkersInfoSection(scheduleModel: ScheduleDataModel): (string | number)[][] {
    const names = Object.keys(scheduleModel.employee_info?.type);
    const month = scheduleModel.schedule_info.month_number;
    const year = scheduleModel.schedule_info.year;
    const workers: (string | number)[][] = [];

    workers.push(ABSENCE_HEADERS);
    workers.push(EMPTY_ROW);
    names.forEach((name) => {
      const workerShifts = scheduleModel.shifts[name] as ShiftCode[];
      workerShifts.forEach((shift, index) => {
        let daysNo = 1;
        if (shift !== ShiftCode.W && !SHIFTS[shift].isWorkingShift) {
          const from = scheduleModel.month_info.dates[index];
          while (
            index + 1 < workerShifts.length &&
            workerShifts[index + 1] === workerShifts[index]
          ) {
            index++;
            daysNo++;
            workerShifts[index - 1] = ShiftCode.W;
          }
          workerShifts[index] = ShiftCode.W;
          workers.push([
            name,
            SHIFTS[shift].name,
            `${from} ${TranslationHelper.polishMonthsGenetivus[month]}`,
            `${scheduleModel.month_info.dates[index]} ${TranslationHelper.polishMonthsGenetivus[month]}`,
            daysNo,
            daysNo * 8,
            year,
          ]);
        }
      });
    });
    return [...workers];
  }
}
