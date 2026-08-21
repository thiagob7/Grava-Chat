import type { ReadStateModel } from "~/@core/domain/models/message-model";
import { api } from "~/@core/lib/api";

export async function findReadStates(): Promise<ReadStateModel[]> {
  const response = await api.get<ReadStateModel[]>("/me/read-states");
  return response.data;
}
