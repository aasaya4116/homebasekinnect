import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { homebaseApi } from '@/lib/api';
import type { MealChangeRequest, OverviewResponse, SchoolChildKey, SchoolResponse } from '@/lib/types';

type HomebaseContextValue = {
  overview: OverviewResponse | null;
  school: SchoolResponse | null;
  loadingOverview: boolean;
  loadingSchool: boolean;
  error: string | null;
  refreshOverview(): Promise<void>;
  refreshSchool(): Promise<void>;
  toggleChore(choreId: string, kid: string, done: boolean): Promise<void>;
  toggleSchoolTask(taskId: string, childKey: SchoolChildKey, done: boolean): Promise<void>;
  changeMeal(meal: MealChangeRequest): Promise<void>;
};

const HomebaseContext = createContext<HomebaseContextValue | null>(null);

export function HomebaseProvider({ children }: { children: ReactNode }) {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [school, setSchool] = useState<SchoolResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingSchool, setLoadingSchool] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      setOverview(await homebaseApi.overview());
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load Homebase.');
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const refreshSchool = useCallback(async () => {
    setLoadingSchool(true);
    try {
      setSchool(await homebaseApi.school());
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load school updates.');
    } finally {
      setLoadingSchool(false);
    }
  }, []);

  const toggleChore = useCallback(async (choreId: string, kid: string, done: boolean) => {
    const result = await homebaseApi.toggleChore(choreId, kid, done);
    setOverview((current) => current ? { ...current, chores: result.chores } : current);
    await Haptics.notificationAsync(
      done ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );
  }, []);

  const toggleSchoolTask = useCallback(async (taskId: string, childKey: SchoolChildKey, done: boolean) => {
    const result = await homebaseApi.toggleSchoolTask(taskId, childKey, done);
    setSchool((current) => current ? { ...current, completedTaskIds: result.completedTaskIds } : current);
    await Haptics.notificationAsync(
      done ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );
  }, []);

  const changeMeal = useCallback(async (meal: MealChangeRequest) => {
    try {
      await homebaseApi.changeMeal(meal);
      await refreshOverview();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Homebase could not save this meal.';
      setError(message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw caught;
    }
  }, [refreshOverview]);

  const value = useMemo(
    () => ({ overview, school, loadingOverview, loadingSchool, error, refreshOverview, refreshSchool, toggleChore, toggleSchoolTask, changeMeal }),
    [overview, school, loadingOverview, loadingSchool, error, refreshOverview, refreshSchool, toggleChore, toggleSchoolTask, changeMeal]
  );
  return <HomebaseContext.Provider value={value}>{children}</HomebaseContext.Provider>;
}

export function useHomebase() {
  const value = useContext(HomebaseContext);
  if (!value) throw new Error('useHomebase must be used inside HomebaseProvider');
  return value;
}
