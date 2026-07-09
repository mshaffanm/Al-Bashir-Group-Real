/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Survey, Question, Advisor } from './src/types.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getQuestions(): Promise<Question[]> {
  const { data, error } = await supabase.from('questions').select('*');
  if (error) throw error;
  return data as Question[];
}

export async function addQuestion(q: Omit<Question, 'id'>): Promise<Question> {
  const id = `q_${q.label.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15)}_${Date.now()}`;
  const { data, error } = await supabase.from('questions').insert({ id, ...q }).select().single();
  if (error) throw error;
  return data as Question;
}

export async function updateQuestion(id: string, updated: Partial<Question>): Promise<Question | null> {
  const { data, error } = await supabase.from('questions').update(updated).eq('id', id).select().single();
  if (error) return null;
  return data as Question;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  return !error;
}

export async function getAdvisors(): Promise<Advisor[]> {
  const { data, error } = await supabase.from('advisors').select('*');
  if (error) throw error;
  return data as Advisor[];
}

export async function addAdvisor(advisor: Advisor): Promise<Advisor> {
  const { data, error } = await supabase.from('advisors').insert(advisor).select().single();
  if (error) throw error;
  return data as Advisor;
}

export async function deleteAdvisor(name: string): Promise<boolean> {
  const { error } = await supabase.from('advisors').delete().eq('name', name);
  return !error;
}

export async function getSurveys(): Promise<Survey[]> {
  const { data, error } = await supabase
    .from('surveys')
    .select('*')
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    customerName: row.customer_name,
    regNumber: row.reg_number,
    advisorName: row.advisor_name,
    remarks: row.remarks,
    timestamp: row.timestamp,
    ...row.ratings,
  }));
}

export async function addSurvey(survey: Omit<Survey, 'id' | 'timestamp'>): Promise<Survey> {
  const { customerName, regNumber, advisorName, remarks, ...ratings } = survey as any;
  const id = `srv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const { data, error } = await supabase
    .from('surveys')
    .insert({
      id,
      customer_name: customerName,
      reg_number: regNumber,
      advisor_name: advisorName,
      remarks: remarks || '',
      ratings,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id,
    customerName,
    regNumber,
    advisorName,
    remarks: remarks || '',
    timestamp: data.timestamp,
    ...ratings,
  } as Survey;
}

export async function deleteSurvey(id: string): Promise<boolean> {
  const { error } = await supabase.from('surveys').delete().eq('id', id);
  return !error;
}