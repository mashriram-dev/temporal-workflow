
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

// Fix TS issues with globals
declare const require: any;
declare const process: any;

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities: activities.activities,
    taskQueue: 'nexus-workflow-queue',
  });

  console.log('Worker started. Ready to process workflows.');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
