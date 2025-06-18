import { generateLCID } from './api/generateLCID';
import { initQuestionsStage } from '../stages/questions';
import { manager } from './manager';
import { testFetchProducts } from './api/tests/testFetchProducts';

export const route = async () => {
  console.log('routing');
  try {
    console.log('getting LCID');
    // Generate LCID
    const lcid = await generateLCID();
    manager.setLCID(lcid);

    console.log(`LCID: ${lcid}`);

    initQuestionsStage();

    testFetchProducts();

    // // Here you can add logic to determine where to direct the user
    // // For example:
    // if (/* some condition */) {
    //   // Pre-populate some questions
    //   // Then initialize questions stage
    // } else {
    //   // Initialize a different stage
    //   // initOtherStage();
    // }
  } catch (error) {
    console.error('Failed to initialize MCT:', error);
    // Handle error appropriately
  }
};
