export type JobCategory = 
  | 'Engineering' 
  | 'Power & Energy' 
  | 'Transportation' 
  | 'Ports' 
  | 'Urban Development' 
  | 'Finance' 
  | 'Other';

export interface JobCircular {
  id: string;
  organization: string;
  department?: string;
  postName: string;
  vacancies: string;
  requirements: string;
  deadline: string;
  link: string;
  documents: string[];
  category: JobCategory;
  isUrgent: boolean;
  postedDate: string;
}

export interface SearchResult {
  circulars: JobCircular[];
  lastUpdated: string;
}
