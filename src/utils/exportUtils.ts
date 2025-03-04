
import html2canvas from 'html2canvas';

export const exportAsImage = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID ${elementId} not found`);
    return;
  }

  try {
    const canvas = await html2canvas(element);
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `${fileName || 'export'}.png`;
    link.click();
  } catch (error) {
    console.error('Error exporting image:', error);
  }
};
