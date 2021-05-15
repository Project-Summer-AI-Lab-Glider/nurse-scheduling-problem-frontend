import PouchDB from "pouchdb-browser";
import { DATABASE_NAME, MonthDMToRevisionKeyDict } from "./local-storage-provider.model";
import { MonthDataModel, validateMonthDM } from "../../state/schedule-data/schedule-data.model";
import _ from "lodash";
import { MonthRevision, RevisionKey, ScheduleKey } from "./persistance-store.model";

export abstract class MonthPersistProvider {
  abstract saveMonth(revisionKey: RevisionKey, monthDataModel: MonthDataModel): Promise<void>;

  abstract getMonth(revisionKey: RevisionKey): Promise<MonthDataModel | undefined>;

  abstract reloadDb(): Promise<void>;

  abstract getAllMonths(): Promise<MonthDMToRevisionKeyDict>;
}

export class LocalMonthPersistProvider extends MonthPersistProvider {
  private storage: PouchDB.Database<MonthRevision>;

  constructor() {
    super();
    this.storage = new PouchDB(DATABASE_NAME);
  }

  async saveMonth(revisionKey: RevisionKey, monthDataModel: MonthDataModel): Promise<void> {
    let revision: string | undefined;
    try {
      const document = await this.storage.get(revisionKey);
      revision = document._rev;
    } catch (error) {
      // eslint-disable-next-line no-console
      error.status !== 404 && console.error(error);
    }

    const monthRev: MonthRevision = {
      _id: revisionKey,
      data: monthDataModel,
    };

    if (!_.isNil(revision)) {
      monthRev._rev = revision;
    }

    try {
      this.storage.put(monthRev);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  async getMonth(revisionKey: RevisionKey): Promise<MonthDataModel | undefined> {
    try {
      const monthData = (await this.storage.get(revisionKey)).data;
      const { month, year } = monthData.scheduleKey;
      monthData.scheduleKey = new ScheduleKey(month, year);

      validateMonthDM(monthData);
      return monthData;
    } catch (error) {
      // eslint-disable-next-line no-console
      error.status !== 404 && console.error(error);
      return undefined;
    }
  }

  async reloadDb(): Promise<void> {
    try {
      await this.storage.destroy();
      this.storage = new PouchDB(DATABASE_NAME);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }

  async getAllMonths(): Promise<MonthDMToRevisionKeyDict> {
    const revisions = await this.storage.allDocs({ include_docs: true });
    const validRevisions = _.compact(revisions.rows.map((r) => r.doc));

    const docs: { [revisionKey: string]: MonthDataModel } = {};
    validRevisions.forEach((revision) => {
      docs[revision._id] = revision.data;
    });
    return docs;
  }
}
