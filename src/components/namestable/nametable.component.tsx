/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React from "react";
import {
  AlgorithmErrorCode,
  GroupedScheduleErrors,
  ScheduleError,
} from "../../common-models/schedule-error.model";
import { BaseSectionOptions } from "../schedule-page/table/schedule/sections/base-section/base-section.component";
import { NameTableSection } from "./nametable-section.component";

interface NameSectionOptions extends Partial<BaseSectionOptions> {
  isWorker: boolean;
}

function nametableErrorSelector(
  worker: string,
  cellIndex: number,
  scheduleErrors: GroupedScheduleErrors
): ScheduleError[] {
  const errorsByType = [
    ...(scheduleErrors[AlgorithmErrorCode.WorkerOvertime] ?? []),
    ...(scheduleErrors[AlgorithmErrorCode.WorkerUnderTime] ?? []),
  ];
  return errorsByType.filter((error) => error.worker === worker);
}

export function NameTableComponent(options: NameSectionOptions): JSX.Element {
  const { data = [], isWorker } = options;

  return (
    <NameTableSection data={data} errorSelector={nametableErrorSelector} isWorker={isWorker} />
  );
}
