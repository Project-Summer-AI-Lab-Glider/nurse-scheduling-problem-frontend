/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { ScheduleError } from "../../common-models/schedule-error.model";
import { WorkerType } from "../../common-models/worker-info.model";
import { FoundationInfoOptions } from "../providers/foundation-info-provider.model";
import { Schedule, ScheduleProvider, Sections } from "../providers/schedule-provider.model";
import { ChildrenInfoParser } from "./children-info.parser";
import { ExtraWorkersInfoParser } from "./extra-workers-info.parser";
import { FoundationInfoHeaders, FoundationInfoParser } from "./foundation-info.parser";
import { MetaDataParser } from "./metadata.parser";
import { ShiftsInfoParser } from "./shifts-info.parser";
import { DEFAULT_WORKER_TYPE, WorkersInfoParser } from "./workers-info.parser";
import { ShiftsTypesInfoParser } from "./shifts-types-info.parser";

type WorkerTypesDict = { [key: string]: WorkerType };
export class ScheduleParser implements ScheduleProvider {
  readonly sections: Sections;
  readonly workersInfo: WorkersInfoParser;
  readonly shiftsInfo: ShiftsTypesInfoParser;
  readonly schedule: Schedule;
  readonly isAutoGenerated: boolean;
  _parseErrors: ScheduleError[] = [];

  constructor(
    readonly month,
    readonly year,
    rawSchedule: string[][][],
    workersInfo: string[][],
    shiftsInfo: string[][]
  ) {
    this.sections = this.parseSections(rawSchedule);
    this.workersInfo = new WorkersInfoParser(workersInfo);
    this.shiftsInfo = new ShiftsTypesInfoParser(shiftsInfo);
    this.isAutoGenerated = false;
    this.schedule = new Schedule(this);
  }

  private parseSections(rawSchedule: string[][][]): Sections {
    const foundationInfoHeaders = Object.values(FoundationInfoHeaders);

    const foundationInfoRaw = rawSchedule.find((r) =>
      foundationInfoHeaders.some((h) => r[0][0].toLowerCase().trim() === h)
    );
    const metadataRaw = foundationInfoRaw?.find(
      (r) => r[0].toLowerCase().trim() === FoundationInfoHeaders.MonthDates
    );
    const metadata = new MetaDataParser(this.month, this.year, metadataRaw);

    const childrenRaw = foundationInfoRaw?.find(
      (r) => r[0].toLowerCase().trim() === FoundationInfoHeaders.ChildrenInfo
    );
    const children = new ChildrenInfoParser(metadata, childrenRaw);

    const extraWorkersRaw = foundationInfoRaw?.find(
      (r) => r[0].toLowerCase().trim() === FoundationInfoHeaders.ExtraWorkers
    );
    const extraWorkers = new ExtraWorkersInfoParser(metadata, extraWorkersRaw);

    rawSchedule.splice(rawSchedule.indexOf(foundationInfoRaw!), 1);

    const groups = rawSchedule.map(
      (section, index) => new ShiftsInfoParser(metadata, index + 1, section)
    );

    const parsers: FoundationInfoOptions = {
      ChildrenInfo: children,
      WorkerGroups: groups,
      ExtraWorkersInfo: extraWorkers,
    };

    const foundationParser = new FoundationInfoParser(parsers);
    return {
      WorkerGroups: groups,
      FoundationInfo: foundationParser,
      Metadata: metadata,
    };
  }

  getWorkerTypes(): WorkerTypesDict {
    if (!this.workersInfo.isExists) {
      return this.mockWorkerTypes();
    }
    return this.getTypesFromWorkerDescription();
  }

  private getTypesFromWorkerDescription(): WorkerTypesDict {
    const workers = this.workersInfo.workerDescriptions;
    const result = {};
    workers.forEach((worker) => {
      result[worker.name] = worker.type;
    });
    return result;
  }

  private mockWorkerTypes(): WorkerTypesDict {
    const result = {};
    const shiftProviders = this.sections.WorkerGroups;
    shiftProviders.forEach((shifts) => {
      Object.keys(shifts.workerShifts).forEach((workerName) => {
        result[workerName] = DEFAULT_WORKER_TYPE;
      });
    });
    return result;
  }
}
