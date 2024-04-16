import { queryElement } from '$utils/queryElement';
import { queryElements } from '$utils/queryelements';

export const dialogs = () => {
  const attr = 'data-dialog';
  const components = queryElements<HTMLDivElement>(`[${attr}="component"]`);

  console.log(components);

  components.forEach((component) => {
    // get the required elemenets
    const open = queryElement<HTMLButtonElement>(`[${attr}="open"]`, component);
    const dialog = queryElement<HTMLDialogElement>('dialog', component);
    const close = queryElement<HTMLButtonElement>(`[${attr}="close"]`, component);

    if (!open || !dialog || !close) return;

    // open the dialog
    open.addEventListener('click', () => {
      dialog.showModal();
    });

    // close the dialog
    close.addEventListener('click', () => {
      dialog.close();
    });
  });
};
