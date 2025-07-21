export interface Label {
  labelId: string;
  name_en: string;
  name_fr: string;
  type: 'date' | 'text' | 'number' | 'enum' | 'media' | 'boolean';
  required: boolean;
  placeholder?: string;
  constraints?: { maxLength?: number; minLength?: number; pattern?: string; min?: number; max?: number; };
  options?: string[];
}

const LABELS_STORAGE_KEY = 'event-app-labels';

// Mock function to fetch labels from a relay
export async function fetchLabels(): Promise<Label[]> {
  console.log('Fetching labels...');
  // In a real implementation, this would be a network request to a relay.
  return new Promise(resolve => {
    setTimeout(() => {
      const labels: Label[] = [
        { 
          labelId: '1', 
          name_en: 'Event Name', 
          name_fr: 'Nom de l\'événement', 
          type: 'text', 
          required: true, 
          constraints: { maxLength: 35 } 
        },
        { 
          labelId: '2', 
          name_en: 'Event Date', 
          name_fr: 'Date de l\'événement', 
          type: 'date', 
          required: true 
        },
        { 
          labelId: '3', 
          name_en: 'Category', 
          name_fr: 'Catégorie', 
          type: 'enum', 
          required: true, 
          options: ['Music', 'Sports', 'Art'] 
        },
        { 
          labelId: '4', 
          name_en: 'Photo', 
          name_fr: 'Photo', 
          type: 'media', 
          required: false 
        },
      ];
      console.log('Labels received:', labels);
      resolve(labels);
    }, 1000);
  });
}

export function cacheLabels(labels: Label[]): void {
  localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(labels));
}

export function getCachedLabels(): Label[] | null {
  const storedLabels = localStorage.getItem(LABELS_STORAGE_KEY);
  if (storedLabels) {
    return JSON.parse(storedLabels);
  }
  return null;
}

export async function initializeLabels(): Promise<Label[]> {
  let labels = getCachedLabels();
  if (!labels) {
    labels = await fetchLabels();
    cacheLabels(labels);
  }
  return labels;
}