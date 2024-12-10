import axios from 'axios';
import * as process from 'node:process';
import { setTimeout } from 'node:timers/promises';

jest.setTimeout(300000);

describe('AppController (e2e)', () => {
  const endpoint = process.env.ENDPOINT || 'http://localhost:3000';

  it('start', async () => {
    for (let i = 0; i < 1000; i++) {
      // console.log(`Adding job ${i}`);
      await axios.post(`${endpoint}/add-job`, { i });
    }

    while (true) {
      const resp = await axios.get<{ activeCount: number }>(endpoint);
      if (resp.data.activeCount === 0) {
        break;
      }
      await setTimeout(100);
    }
  });

  beforeAll(async () => {
    await axios
      .delete(`${endpoint}/clean-all`)
      .catch((e) => console.log(e.message));
  });

  afterAll(async () => {
    const resp = await axios.get(`${endpoint}/results`);
    console.log(resp.data);
    const failedCount = resp.data.filter((o) => !o.field2).length;
    console.log(`Failed records: ${failedCount}/${resp.data.length}`);
    expect(failedCount).toBe(0);
  });
});
