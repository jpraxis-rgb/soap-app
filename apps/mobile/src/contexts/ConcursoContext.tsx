import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseEdital as apiParseEdital, getEditais, deleteEdital as apiDeleteEdital, generateSchedule, updateEditalDisciplinas } from '../services/api';
import { showAlert } from '../utils/alert';
import { useAuth } from './AuthContext';

const ACTIVE_CONCURSO_KEY = '@soap/active_concurso_id';

export interface ParsedDisciplina {
  id: string;
  name: string;
  weight: number | null;
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
  sourceUrl?: string;
}

export interface ScheduleConfig {
  hours_per_week: number;
  available_days: number[]; // 0=Mon..6=Sun
  preferred_time: 'morning' | 'afternoon' | 'evening';
  day_configs?: Record<number, number>; // 0=Mon..6=Sun → hours
  disciplines_per_day?: number;
  custom_allocations?: Record<string, number>; // disciplinaId → hours
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
  const { isAuthenticated } = useAuth();

  const activeConcurso = concursos.find(c => c.id === activeConcursoId) || null;

  // Load concursos from API and restore active ID
  const loadConcursos = useCallback(async () => {
    try {
      setIsLoading(true);
      const rawEditais = await getEditais() as any[];
      if (!Array.isArray(rawEditais)) {
        console.warn('[ConcursoContext] getEditais returned non-array:', typeof rawEditais);
        setIsLoading(false);
        return;
      }
      const mapped: Concurso[] = rawEditais.map(e => {
        const parsed = e.parsedData || {};
        const discs = (e.disciplinas || []).map((d: any) => ({
          id: d.id || `d-${Math.random().toString(36).slice(2)}`,
          name: d.name || '',
          weight: d.weight,
          topics: Array.isArray(d.topics) ? d.topics : d.topics?.items || [],
          category: d.category,
        }));
        return {
          id: e.id,
          edital: {
            id: e.id,
            banca: parsed.banca || '',
            orgao: parsed.orgao || '',
            cargo: parsed.cargo || '',
            exam_date: e.examDate || parsed.exam_date || '',
            confidence: parsed.confidence || 0,
            disciplinas: discs,
          },
          schedule_config: null,
          created_at: e.updatedAt || new Date().toISOString(),
        };
      });
      setConcursos(mapped);

      const savedId = await AsyncStorage.getItem(ACTIVE_CONCURSO_KEY);
      if (savedId && mapped.some(c => c.id === savedId)) {
        setActiveConcursoId(savedId);
      } else if (mapped.length > 0) {
        setActiveConcursoId(mapped[0].id);
      }
    } catch (error) {
      console.warn('[ConcursoContext] loadConcursos failed:', error instanceof Error ? error.message : error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload concursos when auth state changes (user logs in/out)
  useEffect(() => {
    if (isAuthenticated) {
      loadConcursos();
    } else {
      setConcursos([]);
      setActiveConcursoId(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, loadConcursos]);

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
      exam_date: edital.exam_date || new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      day_configs: config.day_configs,
      disciplines_per_day: config.disciplines_per_day,
      custom_allocations: config.custom_allocations,
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
      setConcursos(prev => {
        const remaining = prev.filter(c => c.id !== concursoId);
        setActiveConcursoId(p => p === concursoId ? (remaining[0]?.id ?? null) : p);
        return remaining;
      });
    } catch (error) {
      console.error('[ConcursoContext] removeConcurso failed:', error);
      const message = error instanceof Error ? error.message : 'Não foi possível remover o concurso.';
      showAlert('Erro', message);
    }
  }, []);

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
