import JSZip from 'jszip';
import type { EventPackage } from '../types/event';

export async function exportEventPackageAsZip(eventPackage: EventPackage): Promise<Blob> {
  const zip = new JSZip();

  // Add annotations as a JSON file
  zip.file('annotations.json', JSON.stringify(eventPackage.annotations, null, 2));

  // Add media if available
  if (eventPackage.media) {
    // In a real scenario, you'd convert the base64 data back to a Blob/File
    // For this mock, we'll just add a text file indicating the media
    zip.file(
      `media.${eventPackage.media.type.split('/')[1]}`, // e.g., media.jpeg
      `Placeholder for ${eventPackage.media.type} data: ${eventPackage.media.data}`
    );
  }

  const content = await zip.generateAsync({ type: 'blob' });
  return content;
}
