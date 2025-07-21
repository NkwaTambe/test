export interface EventAnnotation {
  labelId: string;
  value: any;
}

export interface EventPackage {
  annotations: EventAnnotation[];
  media?: { // Optional for light package
    type: string; // e.g., 'image/jpeg', 'video/mp4'
    data: string; // Base64 encoded media data
  };
}
