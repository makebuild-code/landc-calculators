import { bestbuys } from './bestbuys';
import { calculators } from './calculators';
import { components } from './components';
import { costOfDoingNothing } from './costofdoingnothing';
import { mct } from './mct';

window.Webflow ||= [];
window.Webflow.push(() => {
  components();
  bestbuys();
  calculators();
  costOfDoingNothing();
  mct();
});
