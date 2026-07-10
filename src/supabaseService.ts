import { supabase } from './supabaseClient';
import { Survey, Question, Advisor } from './types.js';
import { DEFAULT_ADVISORS, DEFAULT_QUESTIONS } from './defaultData';

function normalizeSurvey(row: any): Survey {
  return {
    ...row,
    id: row.id,
    timestamp: row.timestamp || new Date().toISOString(),
  } as Survey;
}

function normalizeQuestion(row: any): Question {
  return {
    id: row.id,
    header: row.header,
    label: row.label,
    desc: row.desc || '',
  } as Question;
}

function normalizeAdvisor(row: any): Advisor {
  return {
    name: row.name,
  } as Advisor;
}

export async function getSurveys(): Promise<Survey[]> {
  try {
    const { data, error } = await supabase.from('surveys').select('*').order('timestamp', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data.map(normalizeSurvey);
    }
    console.error('Supabase surveys error:', error);
  } catch (err) {
    console.error('Error reading surveys from Supabase:', err);
  }
  return [];
}

export async function getQuestions(): Promise<Question[]> {
  try {
    const { data, error } = await supabase.from('questions').select('*').order('header', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(normalizeQuestion);
    }
    if (!error) {
      return DEFAULT_QUESTIONS;
    }
    console.error('Supabase questions error:', error);
  } catch (err) {
    console.error('Error reading questions from Supabase:', err);
  }
  return DEFAULT_QUESTIONS;
}

export async function getAdvisors(): Promise<Advisor[]> {
  try {
    const { data, error } = await supabase.from('advisors').select('*').order('name', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(normalizeAdvisor);
    }
    if (!error) {
      return DEFAULT_ADVISORS;
    }
    console.error('Supabase advisors error:', error);
  } catch (err) {
    console.error('Error reading advisors from Supabase:', err);
  }
  return DEFAULT_ADVISORS;
}

export async function addSurvey(survey: Omit<Survey, 'id' | 'timestamp'>): Promise<Survey> {
  const newSurvey: Survey = {
    ...survey,
    id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  } as Survey;

  try {
    const { data, error } = await supabase.from('surveys').insert([newSurvey]).select('*').single();
    if (!error && data) {
      return normalizeSurvey(data);
    }
    console.error('Supabase addSurvey error:', error);
  } catch (err) {
    console.error('Error adding survey to Supabase:', err);
  }
  return newSurvey;
}

export async function deleteSurvey(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('surveys').delete().eq('id', id);
    if (!error) {
      return true;
    }
    console.error('Supabase deleteSurvey error:', error);
  } catch (err) {
    console.error('Error deleting survey from Supabase:', err);
  }
  return false;
}

export async function addQuestion(question: Omit<Question, 'id'>): Promise<Question> {
  const cleanLabel = question.label.toLowerCase().replace(/[^a-z0-9]/g, '');
  const id = `q_${cleanLabel.slice(0, 15)}_${Date.now()}`;
  const newQuestion: Question = { ...question, id };
  try {
    const { data, error } = await supabase.from('questions').insert([newQuestion]).select('*').single();
    if (!error && data) {
      return normalizeQuestion(data);
    }
    console.error('Supabase addQuestion error:', error);
  } catch (err) {
    console.error('Error adding question to Supabase:', err);
  }
  return newQuestion;
}

export async function updateQuestion(id: string, updated: Partial<Question>): Promise<Question | null> {
  try {
    const { data, error } = await supabase.from('questions').update(updated).eq('id', id).select('*').single();
    if (!error && data) {
      return normalizeQuestion(data);
    }
    console.error('Supabase updateQuestion error:', error);
  } catch (err) {
    console.error('Error updating question in Supabase:', err);
  }
  return null;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (!error) {
      return true;
    }
    console.error('Supabase deleteQuestion error:', error);
  } catch (err) {
    console.error('Error deleting question from Supabase:', err);
  }
  return false;
}

export async function addAdvisor(advisor: Advisor): Promise<Advisor> {
  try {
    const { data, error } = await supabase.from('advisors').insert([advisor]).select('*').single();
    if (!error && data) {
      return normalizeAdvisor(data);
    }
    console.error('Supabase addAdvisor error:', error);
  } catch (err) {
    console.error('Error adding advisor to Supabase:', err);
  }
  return advisor;
}

export async function deleteAdvisor(name: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('advisors').delete().eq('name', name);
    if (!error) {
      return true;
    }
    console.error('Supabase deleteAdvisor error:', error);
  } catch (err) {
    console.error('Error deleting advisor from Supabase:', err);
  }
  return false;
}
