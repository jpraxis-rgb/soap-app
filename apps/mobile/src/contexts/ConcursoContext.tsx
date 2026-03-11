import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseEdital as apiParseEdital, getEditais, deleteEdital as apiDeleteEdital, generateSchedule, updateEditalDisciplinas } from '../services/api';

const ACTIVE_CONCURSO_KEY = '@soap/active_concurso_id';

export interface ParsedDisciplina {
  id: string;
  name: string;
  weight: number;
  topics: string[];
  category?: 'geral' | 'especifico';
}

export interface ParsedEditalData {
  id: string;
  banca: string;
  orgao: string;
  cargo: string;
  exam_date: string;
  confidence: number;
  disciplinas: ParsedDisciplina[];
}

export interface ScheduleConfig {
  hours_per_week: number;
  available_days: number[]; // 0=Mon..6=Sun
  preferred_time: 'morning' | 'afternoon' | 'evening';
}

export interface Concurso {
  id: string;
  edital: ParsedEditalData;
  schedule_config: ScheduleConfig | null;
  created_at: string;
}

interface ConcursoContextType {
  concursos: Concurso[];
  activeConcursoId: string | null;
  activeConcurso: Concurso | null;
  addConcurso: (sourceUrl: string) => Promise<ParsedEditalData>;
  confirmEdital: (edital: ParsedEditalData, config: ScheduleConfig) => Promise<void>;
  setScheduleConfig: (concursoId: string, config: ScheduleConfig) => void;
  setActiveConcurso: (concursoId: string) => void;
  removeConcurso: (concursoId: string) => Promise<void>;
  loadConcursos: () => Promise<void>;
  hasAnyConcurso: boolean;
  hasActiveSchedule: boolean;
  isLoading: boolean;
}

const ConcursoContext = createContext<ConcursoContextType | null>(null);

export function ConcursoProvider({ children }: { children: React.ReactNode }) {
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [activeConcursoId, setActiveConcursoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeConcurso = concursos.find(c => c.id === activeConcursoId) || null;

  // Load concursos from API and restore active ID on mount
  const loadConcursos = useCallback(async () => {
    try {
      setIsLoading(true);
      const editais = await getEditais() as Concurso[];
      setConcursos(editais);

      const savedId = await AsyncStorage.getItem(ACTIVE_CONCURSO_KEY);
      if (savedId && editais.some(c => c.id === savedId)) {
        setActiveConcursoId(savedId);
      } else if (editais.length > 0) {
        setActiveConcursoId(editais[0].id);
      }
    } catch {
      // API unreachable, keep current state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConcursos();
  }, [loadConcursos]);

  // Persist activeConcursoId to AsyncStorage when it changes
  useEffect(() => {
    if (activeConcursoId) {
      AsyncStorage.setItem(ACTIVE_CONCURSO_KEY, activeConcursoId);
    } else {
      AsyncStorage.removeItem(ACTIVE_CONCURSO_KEY);
    }
  }, [activeConcursoId]);

  const addConcurso = useCallback(async (sourceUrl: string): Promise<ParsedEditalData> => {
    const editalData = await apiParseEdital(sourceUrl) as ParsedEditalData;

    const newConcurso: Concurso = {
      id: editalData.id || `concurso-${Date.now()}`,
      edital: editalData,
      schedule_config: null,
      created_at: new Date().toISOString(),
    };
    setConcursos(prev => [...prev, newConcurso]);
    // Auto-activate if it's the first one
    setActiveConcursoId(prev => prev || newConcurso.id);

    return editalData;
  }, []);

  const confirmEdital = useCallback(async (edital: ParsedEditalData, config: ScheduleConfig) => {
    // Sync disciplinas to DB before generating schedule
    await updateEditalDisciplinas(
      edital.id,
      edital.cargo,
      edital.disciplinas.map((d, i) => ({
        name: d.name,
        weight: d.weight,
        topics: d.topics,
        orderIndex: i,
      })),
    );

    await generateSchedule({
      edital_id: edital.id,
      hours_per_week: config.hours_per_week,
      available_days: config.available_days,
      exam_date: edital.exam_date,
    });

    const newConcurso: Concurso = {
      id: edital.id,
      edital,
      schedule_config: config,
      created_at: new Date().toISOString(),
    };

    setConcursos(prev => {
      const exists = prev.some(c => c.id === edital.id);
      if (exists) {
        return prev.map(c => c.id === edital.id ? { ...c, schedule_config: config } : c);
      }
      return [...prev, newConcurso];
    });
    setActiveConcursoId(prev => prev || edital.id);
  }, []);

  const setScheduleConfig = useCallback((concursoId: string, config: ScheduleConfig) => {
    setConcursos(prev =>
      prev.map(c => c.id === concursoId ? { ...c, schedule_config: config } : c)
    );
  }, []);

  const setActiveConcursoFn = useCallback((concursoId: string) => {
    setActiveConcursoId(concursoId);
  }, []);

  const removeConcurso = useCallback(async (concursoId: string) => {
    try {
      await apiDeleteEdital(concursoId);
    } catch {
      // Continue with local removal even if API fails
    }
    setConcursos(prev => prev.filter(c => c.id !== concursoId));
    setActiveConcursoId(prev => {
      if (prev !== concursoId) return prev;
      // Switch to another concurso or null
      const remaining = concursos.filter(c => c.id !== concursoId);
      return remaining.length > 0 ? remaining[0].id : null;
    });
  }, [concursos]);

  return (
    <ConcursoContext.Provider
      value={{
        concursos,
        activeConcursoId,
        activeConcurso,
        addConcurso,
        confirmEdital,
        setScheduleConfig,
        setActiveConcurso: setActiveConcursoFn,
        removeConcurso,
        loadConcursos,
        hasAnyConcurso: concursos.length > 0,
        hasActiveSchedule: activeConcurso?.schedule_config !== null,
        isLoading,
      }}
    >
      {children}
    </ConcursoContext.Provider>
  );
}

export function useConcurso() {
  const ctx = useContext(ConcursoContext);
  if (!ctx) throw new Error('useConcurso must be used within ConcursoProvider');
  return ctx;
}
