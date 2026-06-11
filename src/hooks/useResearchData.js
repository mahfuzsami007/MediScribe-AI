import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/auth';

// Helper: find most common meaningful word (excluding stop words)
function getMostCommonWord(texts) {
  const stopWords = new Set([
    'the', 'and', 'of', 'to', 'a', 'in', 'for', 'is', 'on', 'by', 'with', 'at', 'from',
    'as', 'are', 'was', 'were', 'be', 'this', 'that', 'these', 'those', 'but', 'or',
    'not', 'no', 'yes', 'patient', 'has', 'with'
  ]);
  const wordCount = new Map();

  texts.forEach(text => {
    if (!text) return;
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });
  });

  let maxWord = '';
  let maxCount = 0;
  for (const [word, count] of wordCount.entries()) {
    if (count > maxCount) {
      maxCount = count;
      maxWord = word;
    }
  }
  return maxWord || 'N/A';
}

// Helper: compute average heart rate from vitals JSONB
function computeAverageHeartRate(records) {
  const hrValues = records
    .map(r => r.vitals?.hr)
    .filter(v => typeof v === 'number' && !isNaN(v));
  if (hrValues.length === 0) return null;
  const sum = hrValues.reduce((a, b) => a + b, 0);
  return Math.round(sum / hrValues.length);
}

// Helper: count records with high BP (systolic ≥ 140 or diastolic ≥ 90)
function countHighBloodPressure(records) {
  return records.filter(record => {
    const bp = record.vitals?.bp;
    if (!bp || typeof bp !== 'string') return false;
    const match = bp.match(/(\d{2,3})\/(\d{2,3})/);
    if (!match) return false;
    const systolic = parseInt(match[1], 10);
    const diastolic = parseInt(match[2], 10);
    return systolic >= 140 || diastolic >= 90;
  }).length;
}

export function useResearchData() {
  const [rawRecords, setRawRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aggregates, setAggregates] = useState({
    totalCases: 0,
    genderBreakdown: { Male: 0, Female: 0, Other: 0, Unknown: 0 },
    mostCommonSymptom: '',
    averageHeartRate: null,
    highBpCount: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Get current doctor
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // Fetch all records for this doctor
    const { data, error: fetchError } = await supabase
      .from('research_data')
      .select('*')
      .eq('doctor_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setRawRecords(data || []);

    // Compute aggregates
    const total = data.length;
    const genderMap = { Male: 0, Female: 0, Other: 0, Unknown: 0 };
    const symptomTexts = [];

    data.forEach(record => {
      const gender = record.patient_gender;
      if (gender === 'Male') genderMap.Male++;
      else if (gender === 'Female') genderMap.Female++;
      else if (gender && gender !== 'Male' && gender !== 'Female') genderMap.Other++;
      else genderMap.Unknown++;

      if (record.symptoms_chief) symptomTexts.push(record.symptoms_chief);
      if (record.symptoms_findings) symptomTexts.push(record.symptoms_findings);
    });

    const commonSymptom = getMostCommonWord(symptomTexts);
    const avgHr = computeAverageHeartRate(data);
    const highBp = countHighBloodPressure(data);

    setAggregates({
      totalCases: total,
      genderBreakdown: genderMap,
      mostCommonSymptom: commonSymptom,
      averageHeartRate: avgHr,
      highBpCount: highBp,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { rawRecords, loading, error, aggregates, refetch: fetchData };
}