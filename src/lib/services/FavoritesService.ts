import axios from "axios";
import { favoritesApi } from "@/lib/api";
import type {
  ApiError,
  ConvocatoriaFavoritaDTO,
  FavoriteStatusResponse,
  FavoriteToggleResponse,
} from "@/lib/types/favorites";

function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const payload = error.response?.data as Partial<ApiError> | undefined;

    if (payload?.message) {
      return {
        status: payload.status ?? status,
        message: payload.message,
        timestamp: payload.timestamp,
        path: payload.path,
      };
    }

    return {
      status,
      message: getDefaultMessageByStatus(status),
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "Error inesperado en favoritas." };
}

function getDefaultMessageByStatus(status?: number): string {
  if (status === 401) return "Sesion expirada. Inicia sesion de nuevo.";
  if (status === 403) return "No tienes permisos para gestionar favoritas.";
  if (status === 404) return "La convocatoria no existe o no esta disponible.";
  if (status === 500 || (status != null && status >= 500)) {
    return "Error temporal del servidor. Intentalo de nuevo.";
  }
  return "No se pudo completar la operacion de favoritas.";
}

export const FavoritesService = {
  async getFavoriteIds(): Promise<number[]> {
    try {
      const { data } = await favoritesApi.ids();
      return data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  async listFavorites(): Promise<ConvocatoriaFavoritaDTO[]> {
    try {
      const { data } = await favoritesApi.list();
      return data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  async isFavorite(convocatoriaId: number): Promise<boolean> {
    try {
      const { data } = await favoritesApi.status(convocatoriaId);
      return data.favorita;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  async addFavorite(convocatoriaId: number): Promise<FavoriteToggleResponse> {
    try {
      const { data } = await favoritesApi.add(convocatoriaId);
      return data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  async removeFavorite(convocatoriaId: number): Promise<FavoriteToggleResponse> {
    try {
      const { data } = await favoritesApi.remove(convocatoriaId);
      return data;
    } catch (error) {
      throw normalizeApiError(error);
    }
  },

  async toggleFavorite(
    convocatoriaId: number,
    currentState: boolean
  ): Promise<FavoriteToggleResponse> {
    if (currentState) {
      return this.removeFavorite(convocatoriaId);
    }
    return this.addFavorite(convocatoriaId);
  },
};

export type FavoritesServiceType = typeof FavoritesService;
export type { ApiError, ConvocatoriaFavoritaDTO, FavoriteStatusResponse };
