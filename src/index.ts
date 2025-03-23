import { bestbuys } from './bestbuys';
import { calculators } from './calculators';
import { components } from './components';
import { costOfDoingNothing } from './costofdoingnothing';

window.Webflow ||= [];

window.Webflow.push(() => {
  components();
  bestbuys();
  calculators();
  costOfDoingNothing();
});
