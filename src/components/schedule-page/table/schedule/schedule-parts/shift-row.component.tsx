/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React from "react";
import { DataRow } from "../../../../../logic/schedule-logic/data-row";
import { BaseRowComponent, BaseRowOptions } from "./base-row.component";
import { ShiftCellComponent } from "./shift-cell/shift-cell.component";
import { BaseCellOptions } from "./base-cell/base-cell.component";
import { useScheduleStyling } from "../../../../common-components/use-schedule-styling/use-schedule-styling";

export interface ShiftRowOptions extends BaseRowOptions {
  dataRow: DataRow;
  onRowUpdated?: (row: DataRow) => void;
  cellComponent?: React.FC<BaseCellOptions>;
}

export function ShiftRowComponent(options: ShiftRowOptions): JSX.Element {
  const { dataRow } = options;
  let data = dataRow.rowData(false);
  data = useScheduleStyling(data);
  const styledDataRow = new DataRow(dataRow.rowKey, data);
  return <BaseRowComponent {...options} dataRow={dataRow} cellComponent={ShiftCellComponent} />;
}
