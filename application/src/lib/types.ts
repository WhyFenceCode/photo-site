export interface Variant { w: number; path: string }
export interface Photo {
  id: string;
  alt: string;
  title?: string;
  caption?: string;
  width: number;
  height: number;
  color?: string;
  film?: string;
  camera?: string;
  lens?: string;
  date?: string;
  location?: string;
  files?: { avif?: Variant[]; webp?: Variant[] };
}
export interface Collection {
  slug: string;
  title: string;
  year: string;
  description: string;
  featured: boolean;
  order: number;
  defaults?: { film?: string; camera?: string; lens?: string };
  cover?: string;
  palette?: string[];
  photos: Photo[];
}
export interface Catalog { version: 1; updatedAt: string; collections: Collection[] }
