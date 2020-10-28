import { WeekDay } from "../../common-models/month-info.model";
import { MetadataProvider } from "../schedule-provider";
import { DataRow } from "./data-row";
import { MonthInfoLogic, VerboseDate } from "./month-info.logic";
import { BaseSectionLogic } from "./section-logic.model";
import { MetaDataSectionKey } from "../section.model";
export enum MonthLogicActionType {
  UpdateFrozenDates = "updateFrozenDates",
}

export class MetadataLogic extends BaseSectionLogic implements MetadataProvider {
  sectionKey = MetadataLogic.name;
  private _frozenShifts: [number, number][] = [];
  public changeShiftFrozenState(workerIndex: number, index: number): [number, number][] {
    const blockedPairInd = this._frozenShifts.findIndex(
      (pair) => pair[0] === workerIndex && pair[1] === index
    );
    if (blockedPairInd !== -1) {
      this._frozenShifts = this._frozenShifts.filter((v, index) => index !== blockedPairInd);
    } else {
      this._frozenShifts.push([workerIndex, index]);
    }
    return this.frozenDates;
  }

  public monthLogic: MonthInfoLogic;

  constructor(
    private _year: string,
    private month: number,
    monthDates: number[],
    public daysFromPreviousMonthExists: boolean
  ) {
    super();
    this.monthLogic = new MonthInfoLogic(
      this.month,
      _year,
      monthDates,
      daysFromPreviousMonthExists
    );
  }

  public get verboseDates(): VerboseDate[] {
    return this.monthLogic.verboseDates;
  }

  public get frozenDates(): [number, number][] {
    return [
      ...(this.verboseDates
        .filter((date) => date.isFrozen)
        .map((date, index) => [0, index + 1]) as [number, number][]),
      ...this._frozenShifts,
    ];
  }
  public get monthNumber(): number {
    return this.monthLogic.monthNumber;
  }
  public get dayCount(): number {
    return this.monthLogic.dayCount;
  }

  public get year(): number {
    return parseInt(this._year);
  }

  public get daysOfWeek(): WeekDay[] {
    return this.monthLogic.daysOfWeek;
  }

  public get dates(): number[] {
    return this.monthLogic.verboseDates.map((d) => d.date);
  }

  public get dayNumbers(): number[] {
    return this.monthLogic.dates;
  }

  public get sectionData(): DataRow[] {
    return [new DataRow(MetaDataSectionKey.MonthDays, this.dayNumbers)];
  }
}
