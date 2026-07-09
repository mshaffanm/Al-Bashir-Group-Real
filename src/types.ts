/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Survey {
  id: string;
  customerName: string;
  regNumber: string;
  advisorName: string;
  remarks: string;
  timestamp: string;
  [key: string]: any; // Allow dynamic rating parameter keys
}

export interface Question {
  id: string;
  header: string;
  label: string;
  description: string;
}

export interface Advisor {
  name: string;
}

export interface AdvisorStats {
  name: string;
  count: number;
  avg: number;
  promoters: number;
  passives: number;
  detractors: number;
  params: { [key: string]: number };
}

export interface SentimentCounts {
  promoters: number;
  passives: number;
  detractors: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
}