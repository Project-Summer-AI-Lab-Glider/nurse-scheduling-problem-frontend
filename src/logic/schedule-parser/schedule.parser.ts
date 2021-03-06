/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { WorkerType } from "../../common-models/worker-info.model";
import { ChildrenInfoParser } from "./children-info.parser";
import { MetaDataParser } from "./metadata.parser";
import { ShiftsInfoParser } from "./shifts-info.parser";
import { Schedule, ScheduleProvider, Sections } from "../providers/schedule-provider.model";
import { InputFileErrorCode, ScheduleError } from "../../common-models/schedule-error.model";
import { FoundationInfoParser } from "./foundation-info.parser";
import { FoundationInfoOptions } from "../providers/foundation-info-provider.model";
import { ExtraWorkersInfoParser } from "./extra-workers-info.parser";

export class ScheduleParser implements ScheduleProvider {
  readonly sections: Sections;
  readonly schedule: Schedule;
  readonly isAutoGenerated: boolean;
  _parseErrors: ScheduleError[] = [];

  constructor(readonly month, readonly year, rawSchedule: string[][][]) {
    this.sections = this.parseSections(rawSchedule);
    this.isAutoGenerated = false;
    this.schedule = new Schedule(this);
  }

  private logLoadFileError(msg: string): void {
    this._parseErrors.push({
      kind: InputFileErrorCode.LOAD_FILE_ERROR,
      message: msg,
    });
  }

  private parseSections(rawSchedule: string[][][]): Sections {
    let children;
    let nurses;
    let babysiter;
    let dayWorkers;

    const metadataRaw = rawSchedule.find((r) => r[0][0].toLowerCase().trim() === "dni miesiąca");
    const metadata = new MetaDataParser(this.month, this.year, metadataRaw);

    rawSchedule.forEach((r) => {
      if (r && r.length !== 0 && r[0].length !== 0) {
        const rKey = r[0][0].toLowerCase().trim();
        if (rKey === "dni miesiąca") {
          if (r.length === 3) {
            children = new ChildrenInfoParser(metadata, r);
            dayWorkers = new ExtraWorkersInfoParser(metadata, r);
          }
        } else if (rKey === "pracownicy dzienni") {
          dayWorkers = new ExtraWorkersInfoParser(metadata, r);
        } else if (rKey === "dzieci") {
          children = new ChildrenInfoParser(metadata, r);
        } else if (!nurses) {
          nurses = new ShiftsInfoParser(WorkerType.NURSE, metadata, r);
        } else {
          babysiter = new ShiftsInfoParser(WorkerType.OTHER, metadata, r);
        }
      }
    });

    if (!children) {
      children = new ChildrenInfoParser(metadata);
    }
    if (!nurses) {
      nurses = new ShiftsInfoParser(WorkerType.NURSE, metadata);
    }
    if (!babysiter) {
      babysiter = new ShiftsInfoParser(WorkerType.OTHER, metadata);
    }
    if (!dayWorkers) {
      dayWorkers = new ExtraWorkersInfoParser(metadata);
    }

    const parsers: FoundationInfoOptions = {
      ChildrenInfo: children,
      NurseInfo: nurses,
      BabysitterInfo: babysiter,
      ExtraWorkersInfo: dayWorkers,
    };

    const foundationParser = new FoundationInfoParser(parsers);
    return {
      NurseInfo: nurses,
      BabysitterInfo: babysiter,
      FoundationInfo: foundationParser,
      Metadata: metadata,
    };
  }

  getWorkerTypes(): { [key: string]: WorkerType } {
    const result = {};
    Object.keys(this.sections.BabysitterInfo.workerShifts).forEach((babysitter) => {
      result[babysitter] = WorkerType.OTHER;
    });
    Object.keys(this.sections.NurseInfo.workerShifts).forEach((nurse) => {
      result[nurse] = WorkerType.NURSE;
    });

    return result;
  }
}
