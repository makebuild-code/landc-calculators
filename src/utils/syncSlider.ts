export function syncSlider(inputId: string, initialValue: number) {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) return;
  
    const wrapper = document.querySelector(`[fs-rangeslider-calc="${inputId}"]`);
    const handle = document.querySelector(`[fs-rangeslider-handlename="${inputId}"]`) as HTMLElement;
    const fill = document.querySelector(`[fs-rangeslider-fillname="${inputId}"]`) as HTMLElement;
    if (!wrapper || !handle) return;

  
    const updateSliderUI = () => {
      const value = parseFloat(input.value);
      if (isNaN(value)) return;
  
      const min = parseFloat(input.min || handle.getAttribute('aria-valuemin') || '0');
      const max = parseFloat(input.max || handle.getAttribute('aria-valuemax') || '100');
      const clamped = Math.min(Math.max(value, min), max);
      const percent = ((clamped - min) / (max - min)) * 100;
  
      const trackWidth = wrapper.clientWidth;
      const pixelOffset = (percent / 100) * trackWidth;
  
      handle.style.left = `${pixelOffset}px`;
      fill.style.width = `${pixelOffset}px`;
  
     
    };
  
    updateSliderUI();
  
    // On input update
    input.addEventListener('input', updateSliderUI);
  }
  