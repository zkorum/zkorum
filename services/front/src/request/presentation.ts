import { DefaultApiFactory } from "@/api";
import { activeSessionUcanAxios } from "@/interceptors";

export async function createPoll(): Promise<void> {
    const response = await DefaultApiFactory(
        undefined,
        undefined,
        activeSessionUcanAxios
    );
}
