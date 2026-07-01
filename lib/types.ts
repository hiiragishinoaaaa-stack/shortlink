export interface LinkRow {
  id: string;
  slug: string;
  destination_url: string;
  og_title: string;
  og_description: string;
  og_image: string | null;
  original_image: string | null;
  play_overlay: boolean;
  button_text: string;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateLinkInput {
  slug: string;
  destination_url: string;
  og_title: string;
  og_description: string;
  og_image: string | null;
  original_image: string | null;
  play_overlay: boolean;
  button_text: string;
}

export type UpdateLinkInput = Partial<CreateLinkInput>;
