import { startBrowser, stopBrowser, newPage, closePage } from './helpers.js';

const modules = [
  './public.test.js',
  './auth.test.js',
  './student.test.js',
  './instructor.test.js',
  './admin.test.js',
];

async function main() {
  try {
    await startBrowser();
  } catch (err) {
    console.error(`FATAL: could not launch browser: ${err.message}`);
    process.exit(2);
  }

  let total = 0;
  let passed = 0;
  const failures = [];

  for (const mod of modules) {
    let suite;
    try {
      suite = await import(mod);
    } catch (err) {
      console.error(`FATAL: cannot load ${mod}: ${err.message}`);
      process.exit(2);
    }

    for (const test of suite.tests) {
      total += 1;
      const label = `[${suite.suite}] ${test.name}`;
      const page = await newPage();
      const start = Date.now();
      let ok = false;
      let err = null;
      try {
        await test.run(page);
        ok = true;
      } catch (e) {
        err = e;
      }
      const ms = Date.now() - start;
      if (ok) {
        passed += 1;
        console.log(`  PASS  ${label} (${ms}ms)`);
      } else {
        failures.push({ label, error: err });
        console.log(`  FAIL  ${label} (${ms}ms)`);
        console.log(`        ${err.message}`);
      }
      await closePage(page);
    }
  }

  await stopBrowser();

  console.log('\n==============================');
  console.log(`E2E Results: ${passed}/${total} passed`);
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  - ${f.label}\n      ${f.error.message.split('\n').join('\n      ')}`);
    }
    process.exit(1);
  }
  console.log('All E2E tests passed.');
  process.exit(0);
}

main().catch(err => {
  console.error('Runner crashed:', err);
  process.exit(2);
});