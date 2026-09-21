export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface Analysis {
  id: string;
  user_id?: string;
  media_type: 'audio' | 'image' | 'video';
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  status: 'processing' | 'completed' | 'failed';
  classification: string;
  confidence: number;
  synthetic_probability: number;
  real_probability?: number;
  calibrated?: boolean;
  threshold?: number;
  risk_level: 'low' | 'medium' | 'high';
  model_name: string;
  model_version: string;
  processing_time_ms: number;
  summary_explanation?: string;
  created_at: string;
}

export interface FrameMetric {
  frame_index: number;
  faces_detected: number;
  frame_synthetic_score: number;
  ela_discrepancy: number;
  spectral_spikes: number;
}

export interface AnalysisDetail {
  analysis: Analysis;
  technical_features: Record<string, any>;
  metadata_info: Record<string, any>;
  spectrogram_url?: string;
  gradcam_heatmap?: string;
  threshold?: number;
  calibrated?: boolean;
  real_probability?: number;
  production_safety_notice?: string;
  limitations?: string;
  face_count: number;
  frame_metrics?: FrameMetric[];
}

export interface TrendDataPoint {
  date: string;
  total: number;
  synthetic: number;
  authentic: number;
}

export interface DashboardStatistics {
  total_analyses: number;
  audio_analyses: number;
  image_analyses: number;
  video_analyses: number;
  suspicious_detections: number;
  high_risk_analyses: number;
  processing_failures: number;
  risk_distribution: {
    low: number;
    medium: number;
    high: number;
  };
  classification_distribution: {
    likely_authentic: number;
    suspicious: number;
    likely_synthetic: number;
  };
  trends: TrendDataPoint[];
  unresolved_alerts_count: number;
}

export interface RecentAnalysisItem {
  id: string;
  media_type: string;
  original_filename: string;
  risk_level: string;
  classification: string;
  synthetic_probability: number;
  confidence: number;
  created_at: string;
}

export interface ChallengeGenerateResponse {
  session_token: string;
  phrase: string;
  expires_at: string;
  instructions: string;
}

export interface ChallengeSubmitResponse {
  session_token: string;
  status: 'verified' | 'failed';
  similarity_score: number;
  voice_authenticity_score: number;
  is_authentic: boolean;
  explanation: string;
}

export interface ModelInfo {
  name: string;
  version: string;
  media_type: string;
  status: string;
  device: string;
  features_extracted: string[];
  description: string;
}

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  database: string;
  storage_writable: boolean;
  uptime_seconds: number;
}

export interface MetricSet {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  sensitivity?: number;
  specificity?: number;
  fpr?: number;
  fnr?: number;
  confusion_matrix?: {
    tp: number;
    tn: number;
    fp: number;
    fn: number;
  };
  calibration?: {
    ece: number;
    brier_score: number;
  };
}

export interface HardTestCase {
  file: string;
  ground_truth: 'real' | 'synthetic';
  prediction: 'real' | 'synthetic' | 'uncertain';
  synthetic_probability: number;
  correct: boolean;
}

export interface ProjectOutputsResponse {
  status: string;
  timestamp: string;
  model_name: string;
  model_version: string;
  model_architecture: string;
  optimal_threshold: number;
  temperature: number;
  uncertainty_band: number;
  metadata_invariance_deviation: number;
  in_distribution_test: {
    sample_count: number;
    uncertain_predictions: number;
    new_model: MetricSet;
    old_model: MetricSet;
  };
  out_of_distribution_test: {
    sample_count: number;
    uncertain_predictions: number;
    new_model: MetricSet;
    old_model: MetricSet;
  };
  hard_cases_test: {
    sample_count: number;
    accuracy_with_uncertainty: number;
    cases: HardTestCase[];
  };
  dataset_breakdown: {
    total_samples: number;
    train_samples: number;
    val_samples: number;
    test_in_dist_samples: number;
    test_out_of_dist_samples: number;
    test_hard_samples: number;
    generators_represented: string[];
    domains_represented: string[];
  };
  multimodal_modules: {
    image: {
      name: string;
      accuracy: number;
      recall: number;
      roc_auc: number;
      ece: number;
      status: string;
      features: string[];
    };
    audio: {
      name: string;
      status: string;
      features: string[];
    };
    video: {
      name: string;
      status: string;
      features: string[];
    };
    verification: {
      name: string;
      status: string;
      features: string[];
    };
  };
  production_safety_notice: string;
}
