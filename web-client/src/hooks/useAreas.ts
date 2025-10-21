import { useState, useEffect } from 'react';
import { areasApi } from '../services/api';
import type { Area } from '../services/api';

export const useAreas = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAreas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userAreas = await areasApi.getAreas();
      setAreas(userAreas);
    } catch (err) {
      console.error('Failed to fetch areas:', err);
      setError(err instanceof Error ? err.message : 'Failed to load areas');
    } finally {
      setIsLoading(false);
    }
  };

  const createArea = async (
    areaData: Parameters<typeof areasApi.createArea>[0],
  ) => {
    try {
      const newArea = await areasApi.createArea(areaData);
      setAreas((prev) => [newArea, ...prev]);
      return newArea;
    } catch (err) {
      console.error('Failed to create area:', err);
      throw err;
    }
  };

  const updateArea = async (
    id: number,
    areaData: Parameters<typeof areasApi.updateArea>[1],
  ) => {
    try {
      const updatedArea = await areasApi.updateArea(id, areaData);
      setAreas((prev) =>
        prev.map((area) => (area.id === id ? updatedArea : area)),
      );
      return updatedArea;
    } catch (err) {
      console.error('Failed to update area:', err);
      throw err;
    }
  };

  const deleteArea = async (id: number) => {
    try {
      await areasApi.deleteArea(id);
      setAreas((prev) => prev.filter((area) => area.id !== id));
    } catch (err) {
      console.error('Failed to delete area:', err);
      throw err;
    }
  };

  const toggleAreaStatus = async (id: number) => {
    const area = areas.find((a) => a.id === id);
    if (!area) throw new Error('Area not found');
    try {
      const updatedArea = await areasApi.updateArea(id, {
        is_active: !area.is_active,
      });
      setAreas((prev) => prev.map((a) => (a.id === id ? updatedArea : a)));
      return updatedArea;
    } catch (err) {
      console.error('Failed to toggle area status:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  return {
    areas,
    isLoading,
    error,
    fetchAreas,
    createArea,
    updateArea,
    deleteArea,
    toggleAreaStatus,
  };
};
