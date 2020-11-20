import { ParseErrorCode, ScheduleErrorModel } from "../../common-models/schedule-error.model";
import { ShiftCode } from "../../common-models/shift-info.model";
import { ShiftsProvider } from "../providers/shifts-provider.model";
import { DataRowParser } from "./data-row.parser";
import { MetaDataParser } from "./metadata.parser";

export class ShiftsInfoParser extends ShiftsProvider {
  private _sectionRows: { [key: string]: DataRowParser } = {};
  private _parseErrors: ScheduleErrorModel[] = [];

  constructor(scheduleInfoSection: DataRowParser[], private metaData: MetaDataParser) {
    super();
    scheduleInfoSection
      .map((row) =>
        row
          .createWithCroppedData(this.metaData.validDataStart, this.metaData.validDataEnd + 1)
          .createWithProcessedRow((dataRow) => this.fillRowWithShifts(dataRow))
      )
      .forEach((row) => {
        this._sectionRows[row.rowKey] = row;
      });
  }

  public get errors(): ScheduleErrorModel[] {
    return [...this._parseErrors];
  }

  public get sectionData(): DataRowParser[] {
    return Object.values(this._sectionRows);
  }

  private mockAvailableWorkersWorkTime(): { [key: string]: number } {
    const workerDict = {};
    Object.keys(this.workerShifts).forEach((key) => (workerDict[key] = 1.0));
    return workerDict;
  }

  public get availableWorkersWorkTime(): { [key: string]: number } {
    // TODO: implement actual parsing of worker work time
    return this.mockAvailableWorkersWorkTime();
  }

  public get workersCount(): number {
    return this.sectionData.length;
  }

  public get workerShifts(): { [workerName: string]: ShiftCode[] } {
    return this.sectionData
      .map((row) => ({
        [row.rowKey]: this.fillRowWithShifts(row),
      }))
      .reduce((prev, curr) => ({ ...prev, ...curr }));
  }

  private static getShiftFromCell(cell: string): ShiftCode | null {
    return ShiftCode[cell?.trim().slice(0, 2).trim()];
  }

  private fillRowWithShifts(row: DataRowParser): ShiftCode[] {
    const continuousShifts = [ShiftCode.L4, ShiftCode.U];
    let previousShift: ShiftCode = ShiftCode.W;
    return row.rowData(true, false).map((cellValue, cellInd) => {
      let currentShiftValue = ShiftsInfoParser.getShiftFromCell(cellValue);
      if (!currentShiftValue) {
        if (cellValue && cellValue.trim()) {
          const currDate = this.metaData.dates[cellInd];
          this.logUnknownValue(currDate, row.rowKey, cellValue);
        }
        currentShiftValue = continuousShifts.includes(previousShift) ? previousShift : ShiftCode.W;
      }
      previousShift = currentShiftValue;
      return currentShiftValue;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private logUnknownValue(date: number, worker: string, value: any): void {
    this._parseErrors.push({
      code: ParseErrorCode.UNKNOWN_VALUE,
      day: date,
      worker: worker,
      actual: value,
    });
  }
}
