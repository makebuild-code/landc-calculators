import { generateLCID } from '../calls/generateLCID';

async function testGenerateLCID() {
  try {
    const lcid = await generateLCID();
    console.log('Generated LCID:', lcid);
  } catch (error) {
    console.error('Error generating LCID:', error);
  }
}

// Run the test if this file is executed directly (ESM compatible)
if (import.meta.url === `file://${process.cwd()}/src/mct/shared/api/tests/test_generateLCID.ts`) {
  testGenerateLCID();
}

// npx tsx src/mct/shared/api/tests/test_generateLCID.ts
