import { MyUtil } from '@app/shared';
import axios from 'axios';
import { randomUUID } from 'crypto';
import _ from 'lodash';
import * as process from 'node:process';
import { SalesOrderFulfillmentStatus } from '../src/sales/sales-order-fulfillment-status.enum';

jest.setTimeout(300000);

describe('AppController (e2e)', () => {
  const endpoint = process.env.ENDPOINT || 'http://localhost:3000';

  it('start', async () => {
    const sampleOrders = [];
    for (let i = 0; i < 1000; i++) {
      const sampleOrder = {
        id: i,
        name: `#${_.padStart(i.toString(), 4, '0')}`,
        updated_at: new Date(),
        line_items: [],
      };

      for (let j = 0; j < 3; j++) {
        sampleOrder.line_items.push({
          id: `${i}-${j}`,
          name: `test-${j}`,
          sku: `test-${j}`,
          quantity: j,
        });
      }

      sampleOrders.push(sampleOrder);
    }

    const promises = [];

    for (const sampleOrder of sampleOrders) {
      // shopify每种订单事件都会附带一个updated事件，且先后顺序不保证，所以用any来模拟
      const p = Promise.any([
        axios.post(`${endpoint}/store-shopify/-/webhooks`, sampleOrder, {
          headers: {
            'X-Shopify-Topic': 'orders/create',
            'X-Shopify-Hmac-Sha256': 'test',
            'X-Shopify-Shop-Domain': 'test-store',
            'X-Shopify-API-Version': '2021-07',
            'X-Shopify-Webhook-Id': randomUUID(),
            'X-Shopify-Triggered-At': new Date().toISOString(),
          },
        }),
        axios.post(`${endpoint}/store-shopify/-/webhooks`, sampleOrder, {
          headers: {
            'X-Shopify-Topic': 'orders/updated',
            'X-Shopify-Hmac-Sha256': 'test',
            'X-Shopify-Shop-Domain': 'test-store',
            'X-Shopify-API-Version': '2021-07',
            'X-Shopify-Webhook-Id': randomUUID(),
            'X-Shopify-Triggered-At': new Date().toISOString(),
          },
        }),
      ]);
      promises.push(p);
    }

    await MyUtil.sleep(1000);

    for (const sampleOrder of sampleOrders) {
      const p = Promise.any([
        axios.post(`${endpoint}/store-shopify/-/webhooks`, sampleOrder, {
          headers: {
            'X-Shopify-Topic': 'orders/fulfilled',
            'X-Shopify-Hmac-Sha256': 'test',
            'X-Shopify-Shop-Domain': 'test-store',
            'X-Shopify-API-Version': '2021-07',
            'X-Shopify-Webhook-Id': randomUUID(),
            'X-Shopify-Triggered-At': new Date().toISOString(),
          },
        }),
        axios.post(`${endpoint}/store-shopify/-/webhooks`, sampleOrder, {
          headers: {
            'X-Shopify-Topic': 'orders/updated',
            'X-Shopify-Hmac-Sha256': 'test',
            'X-Shopify-Shop-Domain': 'test-store',
            'X-Shopify-API-Version': '2021-07',
            'X-Shopify-Webhook-Id': randomUUID(),
            'X-Shopify-Triggered-At': new Date().toISOString(),
          },
        }),
      ]);
      promises.push(p);
    }

    await Promise.all(promises);

    while (true) {
      const resp = await axios.get<{ activeCount: number }>(endpoint);
      if (resp.data.activeCount === 0) {
        break;
      }
      await MyUtil.sleep(100);
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
    const failedCount = resp.data.filter(
      (o) => o.fulfillmentStatus !== SalesOrderFulfillmentStatus.FULFILLED,
    ).length;
    console.log(`Failed records: ${failedCount}/${resp.data.length}`);
    expect(failedCount).toBe(0);
  });
});
