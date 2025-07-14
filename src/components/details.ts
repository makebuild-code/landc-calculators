import { queryElement } from '$utils/dom';

export const details = () => {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    const { tagName } = target;
    if (tagName !== 'SUMMARY') return;

    const details = target.closest('details') as HTMLDetailsElement;
    const icon = queryElement('[data-details="icon"]', details) as HTMLElement;

    if (!details || !icon) return;

    const { open } = details;
    let rotate = icon.dataset.detailsIconRotate as string;
    if (!rotate) rotate = '180';
    const rotateBy = open ? '0deg' : `${rotate}deg`;

    icon.style.transform = `rotate(${rotateBy})`;
  });
};
