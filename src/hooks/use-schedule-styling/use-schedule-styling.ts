/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { ShiftCode, SHIFTS } from "../../state/models/common-models/shift-info.model";
import { CellDataItem } from "../../components/schedule/base/base-row/base-row.models";

interface UseScheduleStylingReturn extends CellDataItem {
  value: ShiftCode;
  keepOn: boolean;
  hasNext: boolean;
}

export function applyScheduleStyling(data: ShiftCode[]): UseScheduleStylingReturn[] {
  let prevShift: ShiftCode | null = null;
  let nextShift: ShiftCode | null = null;
  let keepOn: boolean;
  let hasNext: boolean;
  const result: UseScheduleStylingReturn[] = [];

  data.map((value: ShiftCode, cellIndex) => {
    if (cellIndex < data.length - 1) {
      nextShift = data[cellIndex + 1];
    } else {
      nextShift = null;
    }
    keepOn = prevShift === value && !SHIFTS[value].isWorkingShift;
    hasNext = nextShift === value && !SHIFTS[value].isWorkingShift;
    prevShift = value;

    return result.push({ value, keepOn, hasNext });
  });

  return result;
}