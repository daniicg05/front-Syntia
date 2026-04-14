export interface GuiaSubvencionDTO {
  grant_summary?: {
    title?: string; organism?: string; objective?: string;
    who_can_apply?: string; deadline?: string; official_link?: string; legal_basis?: string;
  };
  application_methods?: Array<{ method?: string; description?: string; official_portal?: string }>;
  required_documents?: string[];
  universal_requirements_lgs_art13?: string[];
  workflows?: Array<{
    method?: string;
    steps?: Array<{
      step?: number; phase?: string; title?: string; description?: string;
      user_action?: string; portal_action?: string; required_documents?: string[];
      official_link?: string; estimated_time_minutes?: number;
    }>;
  }>;
  visual_guides?: Array<{
    method?: string;
    steps?: Array<{
      step?: number; phase?: string; title?: string; description?: string;
      screen_hint?: string; image_prompt?: string; official_link?: string;
    }>;
  }>;
  legal_disclaimer?: string;
}
