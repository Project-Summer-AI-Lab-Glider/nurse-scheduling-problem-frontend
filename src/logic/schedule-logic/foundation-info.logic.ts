/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { WorkerType } from "../../common-models/worker-info.model";
import { DataRowHelper } from "../../helpers/data-row.helper";
import {
  FoundationInfoOptions,
  FoundationInfoProvider,
} from "../providers/foundation-info-provider.model";
import { Sections } from "../providers/schedule-provider.model";
import { ChildrenSectionKey, ExtraWorkersSectionKey, FoundationSectionKey } from "../section.model";
import { BaseSectionLogic } from "./base-section-logic.model";
import { DataRow } from "./data-row";
import { ShiftModel } from "../../common-models/shift-info.model";

export class FoundationInfoLogic
  extends FoundationInfoProvider
  implements Omit<BaseSectionLogic, "addDataRow"> {
  private shifts: ShiftModel;

  constructor(shifts: ShiftModel, sections: FoundationInfoOptions) {
    super(sections);
    this.shifts = shifts;
  }

  get sectionKey(): keyof Sections {
    return "FoundationInfo";
  }

  update(selectionMatrix: boolean[][], newValue: string): void {
    this.sectionData = DataRowHelper.copyWithReplaced(selectionMatrix, this.sectionData, newValue);
  }

  get childrenInfo(): number[] {
    return (
      this.rows.find((d) => d.rowKey === ChildrenSectionKey.RegisteredChildrenCount)?.rowData() ??
      []
    );
  }
  get extraWorkersInfo(): number[] {
    return (
      this.rows.find((d) => d.rowKey === ExtraWorkersSectionKey.ExtraWorkersCount)?.rowData() ?? []
    );
  }

  private rows: DataRow[] = [
    new DataRow(
      FoundationSectionKey.ExtraWorkersCount,
      this.sections.ExtraWorkersInfo.extraWorkers
    ),
    new DataRow(
      FoundationSectionKey.ChildrenCount,
      this.sections.ChildrenInfo.registeredChildrenNumber
    ),
    new DataRow(
      FoundationSectionKey.BabysittersCount,
      this.getWorkersCount(WorkerType.OTHER, this.shifts),
      false
    ),
    new DataRow(
      FoundationSectionKey.NurseCount,
      this.getWorkersCount(WorkerType.NURSE, this.shifts),
      false
    ),
  ];

  public disableEdit(): void {
    this.rows.forEach((row) => row.disableEdit());
  }

  get sectionData(): DataRow[] {
    return this.rows;
  }

  set sectionData(newValue: DataRow[]) {
    this.rows = this.rows.map((row) => {
      const newRow = newValue.find((nRow) => nRow.rowKey === row.rowKey);
      if (!newRow || !row.isEditable) {
        return row;
      }
      return newRow;
    });
  }
}
