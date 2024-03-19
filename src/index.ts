import { calculators } from './calculators';
import { components } from './components';

window.Webflow ||= [];
window.Webflow.push(() => {
  components();
  calculators();
});
