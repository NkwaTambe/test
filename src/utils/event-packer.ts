import type { EventPackage, EventAnnotation } from '../types/event';
import type { Label } from '../labels/label-manager';

export function createEventPackage(
  formData: { [key: string]: any },
  labels: Label[],
  mediaFile: File | null
): EventPackage {
  const annotations: EventAnnotation[] = labels.map(label => ({
    labelId: label.labelId,
    value: formData[label.labelId],
  }));

  let media = undefined;
  if (mediaFile) {
    // In a real app, you'd convert mediaFile to base64 or a URL
    // For now, we'll just store a placeholder string
    media = {
      type: mediaFile.type,
      data: `base64_encoded_data_of_${mediaFile.name}`,
    };
  }

  return {
    annotations,
    media,
  };
}
