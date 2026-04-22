"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FavoritesService } from "@/lib/services/FavoritesService";
import type { ApiError, ConvocatoriaFavoritaDTO } from "@/lib/types/favorites";

type AsyncStatus = "idle" | "loading" | "success" | "error";

interface UseFavoritesListState {
  items: ConvocatoriaFavoritaDTO[];
  status: AsyncStatus;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

interface UseFavoriteIdsState {
  ids: Set<number>;
  status: AsyncStatus;
  error: ApiError | null;
  isFavorite: (convocatoriaId: number) => boolean;
  toggleFavorite: (convocatoriaId: number) => Promise<boolean>;
  refetch: () => Promise<void>;
  hydrateFromRecommendations: (items: Array<{ convocatoriaId: number; favorita?: boolean }>) => void;
}

interface UseFavoriteStatusState {
  favorita: boolean;
  status: AsyncStatus;
  error: ApiError | null;
  toggleFavorite: () => Promise<boolean>;
  refetch: () => Promise<void>;
}

function toApiError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null && "message" in error) {
    return error as ApiError;
  }
  return { message: "Error inesperado en favoritas." };
}

export function useFavoritesList(enabled = true): UseFavoritesListState {
  const [items, setItems] = useState<ConvocatoriaFavoritaDTO[]>([]);
  const [status, setStatus] = useState<AsyncStatus>(enabled ? "loading" : "idle");
  const [error, setError] = useState<ApiError | null>(null);

  const refetch = useCallback(async (options?: { skipLoading?: boolean }) => {
    if (!enabled) return;
    if (!options?.skipLoading) {
      setStatus("loading");
      setError(null);
    }
    try {
      const data = await FavoritesService.listFavorites();
      setItems(data);
      setStatus("success");
    } catch (err) {
      setError(toApiError(err));
      setStatus("error");
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    void (async () => {
      try {
        const data = await FavoritesService.listFavorites();
        if (cancelled) return;
        setItems(data);
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setError(toApiError(err));
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { items, status, error, refetch };
}

export function useFavoriteIds(enabled = true): UseFavoriteIdsState {
  const [ids, setIds] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<AsyncStatus>(enabled ? "loading" : "idle");
  const [error, setError] = useState<ApiError | null>(null);

  const refetch = useCallback(async (options?: { skipLoading?: boolean }) => {
    if (!enabled) return;
    if (!options?.skipLoading) {
      setStatus("loading");
      setError(null);
    }
    try {
      const data = await FavoritesService.getFavoriteIds();
      setIds(new Set(data));
      setStatus("success");
    } catch (err) {
      setError(toApiError(err));
      setStatus("error");
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    void (async () => {
      try {
        const data = await FavoritesService.getFavoriteIds();
        if (cancelled) return;
        setIds(new Set(data));
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setError(toApiError(err));
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const isFavorite = useCallback(
    (convocatoriaId: number) => ids.has(convocatoriaId),
    [ids]
  );

  const toggleFavorite = useCallback(async (convocatoriaId: number) => {
    const previous = new Set(ids);
    const currentlyFavorite = previous.has(convocatoriaId);

    setIds((prev) => {
      const next = new Set(prev);
      if (currentlyFavorite) {
        next.delete(convocatoriaId);
      } else {
        next.add(convocatoriaId);
      }
      return next;
    });

    try {
      const result = await FavoritesService.toggleFavorite(convocatoriaId, currentlyFavorite);
      return result.favorita;
    } catch (err) {
      setIds(previous);
      setError(toApiError(err));
      throw err;
    }
  }, [ids]);

  const hydrateFromRecommendations = useCallback(
    (items: Array<{ convocatoriaId: number; favorita?: boolean }>) => {
      if (items.length === 0) return;
      setIds((prev) => {
        const next = new Set(prev);
        for (const item of items) {
          if (item.favorita) {
            next.add(item.convocatoriaId);
          }
        }
        return next;
      });
    },
    []
  );

  return {
    ids,
    status,
    error,
    isFavorite,
    toggleFavorite,
    refetch,
    hydrateFromRecommendations,
  };
}

export function useFavoriteStatus(
  convocatoriaId: number | null,
  enabled = true
): UseFavoriteStatusState {
  const [favorita, setFavorita] = useState(false);
  const [status, setStatus] = useState<AsyncStatus>(enabled ? "loading" : "idle");
  const [error, setError] = useState<ApiError | null>(null);

  const refetch = useCallback(async (options?: { skipLoading?: boolean }) => {
    if (!enabled || convocatoriaId == null) return;
    if (!options?.skipLoading) {
      setStatus("loading");
      setError(null);
    }
    try {
      const isFav = await FavoritesService.isFavorite(convocatoriaId);
      setFavorita(isFav);
      setStatus("success");
    } catch (err) {
      setError(toApiError(err));
      setStatus("error");
    }
  }, [convocatoriaId, enabled]);

  useEffect(() => {
    if (!enabled || convocatoriaId == null) return;
    let cancelled = false;

    void (async () => {
      try {
        const isFav = await FavoritesService.isFavorite(convocatoriaId);
        if (cancelled) return;
        setFavorita(isFav);
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setError(toApiError(err));
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, convocatoriaId]);

  const toggleFavorite = useCallback(async () => {
    if (convocatoriaId == null) return false;
    const previous = favorita;
    const optimistic = !previous;
    setFavorita(optimistic);

    try {
      const result = await FavoritesService.toggleFavorite(convocatoriaId, previous);
      setFavorita(result.favorita);
      return result.favorita;
    } catch (err) {
      setFavorita(previous);
      setError(toApiError(err));
      throw err;
    }
  }, [convocatoriaId, favorita]);

  return useMemo(
    () => ({ favorita, status, error, toggleFavorite, refetch }),
    [favorita, status, error, toggleFavorite, refetch]
  );
}

