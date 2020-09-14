import { ScheduleDataModel } from "./schedule-data/schedule-data.model";
import { ScheduleErrorMessageModel } from "./schedule-data/schedule-error-message.model";

export interface ApplicationStateModel {
  uploadedScheduleSheet?: Array<Object>;
  scheduleData?: ScheduleDataModel;
  scheduleErrors?: ScheduleErrorMessageModel[];
}
