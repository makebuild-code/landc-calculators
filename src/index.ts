import { bestbuys } from './bestbuys';
import { calculators } from './calculators';
import { components } from './components';
import { costOfDoingNothing } from './costofdoingnothing';
import { mct } from './mct';
import { partnerBookingWidget } from './partner-booker';

window.Webflow ||= [];
window.Webflow.push(() => {
  components();
  bestbuys();
  calculators();
  costOfDoingNothing();
  mct();
  new partnerBookingWidget()
});
