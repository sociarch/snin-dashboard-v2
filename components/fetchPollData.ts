import axios from "axios";
import { PollDataItem } from "./pollData";

const API_ENDPOINT = "https://0odsntgafl.execute-api.ap-southeast-1.amazonaws.com/Prod/codalookup";

export async function fetchPollData(): Promise<PollDataItem[]> {
    try {
        const response = await axios.get(API_ENDPOINT);

        if (response.data && response.data.success && Array.isArray(response.data.response)) {
            return response.data.response.map((item: any) => ({
                create_date: item.create_date || "",
                post_id: item.post_id || "",
                is_user_generated: item.is_user_generated || false,
                is_sponsored: item.is_sponsored || false,
                sponsor_id: item.sponsor_id || "",
                caption: item.caption || "Would you rather?",
                option1: item.option1 || "",
                option2: item.option2 || "",
                total_responses: item.total_responses || "",
                resp_option1: item.resp_option1 || "",
                pct_option1: item.pct_option1 || "",
                resp_option2: item.resp_option2 || "",
                pct_option2: item.pct_option2 || "",
                count_view: item.count_view || 0,
                count_like: item.count_like || 0,
                count_comment: item.count_comment || 0,
                count_bookmark: item.count_bookmark || 0,
                count_skip: item.count_skip || 0,
            }));
        } else {
            throw new Error("Invalid data structure received from the API");
        }
    } catch (error) {
        console.error("Error fetching poll data:", error);
        throw error;
    }
}
