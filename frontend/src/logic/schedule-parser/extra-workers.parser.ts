import { DataRow } from "../schedule-logic/data-row";
import { ExtraWorkersInfoProvider } from "../schedule-provider";
import { ExtraWorkersSectionKey } from "../models/extra-workers-section.model";

export class ExtraWorkersParser implements ExtraWorkersInfoProvider {
  private extraWorkersInfoAsDataRows: { [key: string]: DataRow } = {};

  constructor(numberOfDays: number) {
    const extraWorkers = new Array(numberOfDays).fill(0);
    this.extraWorkersInfoAsDataRows = {
      [ExtraWorkersSectionKey.ExtraWorkersCount]: new DataRow(
        ExtraWorkersSectionKey.ExtraWorkersCount,
        extraWorkers
      ),
    };
  }

  public get extraWorkers() {
    return this.extraWorkersInfoAsDataRows[ExtraWorkersSectionKey.ExtraWorkersCount]
      .rowData(true, false)
      .map((i) => parseInt(i));
  }

  public get sectionData() {
    return Object.values(this.extraWorkersInfoAsDataRows);
  }
}
