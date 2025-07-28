import { queryElement } from '$utils/dom';

export const details = () => {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    const details = target.closest('details') as HTMLDetailsElement;
    if (!details) return;

    const icon = queryElement('[data-details="icon"]', details) as HTMLElement;
    if (!icon) return;

    const { open } = details;
    let rotate = icon.dataset.detailsIconRotate as string;
    if (!rotate) rotate = '180';
    const rotateBy = open ? '0deg' : `${rotate}deg`;

    icon.style.transform = `rotate(${rotateBy})`;
  });
};
