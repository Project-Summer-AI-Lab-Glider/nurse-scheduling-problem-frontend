/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import React from "react";
import { useSelector } from "react-redux";
import { WorkerHourInfo } from "../../../../helpers/worker-hours-info.model";
import { ApplicationStateModel } from "../../../../state/models/application-state.model";
import { OvertimeHeaderComponent } from "../../../overtime-header-table/overtime-header.component";
import { TimeTableComponent } from "../../../timetable/timetable.component";
import { ScheduleFoldingSection } from "./schedule-parts/schedule-folding-section.component";
import { FoundationInfoComponent } from "./sections/foundation-info-section/foundation-info.component";
import { WorkerInfoSection } from "./sections/worker-info-section/worker-info-section.component";
import { useWorkerGroups } from "./use-worker-groups";

export function ScheduleComponent(): JSX.Element {
  const workerGroups = useWorkerGroups();

  const { time } = useSelector(
    (state: ApplicationStateModel) => state.actualState.persistentSchedule.present.employee_info
  );

  // Only for testing purposes
  if (
    process.env.REACT_APP_TEST_MODE &&
    Object.keys(time)
      .map((worker) => worker.toLowerCase())
      .includes(process.env.REACT_APP_ERROR_WORKER ?? "ERROR")
  ) {
    throw new Error("[TEST MODE] Error user was added");
  }

  return (
    <div style={{ margin: "20 0" }}>
      <div>
        <div className="sectionContainer timeHeader">
          <div className="timeTableContainer">
            <TimeTableComponent />
          </div>
          <div className="summaryContainer">
            <OvertimeHeaderComponent data={Object.values(WorkerHourInfo.summaryTranslations)} />
          </div>
        </div>

        {Object.entries(workerGroups).map(([groupName, workers], index) => (
          <ScheduleFoldingSection name={groupName} key={groupName}>
            <WorkerInfoSection sectionIndex={index} data={workers} sectionName={groupName} />
          </ScheduleFoldingSection>
        ))}

        <ScheduleFoldingSection name="Informacje">
          <FoundationInfoComponent />
        </ScheduleFoldingSection>
      </div>
    </div>
  );
}
