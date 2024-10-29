import axios from "axios";
import { PollDataItem } from "./pollData";

const API_ENDPOINT = "https://0odsntgafl.execute-api.ap-southeast-1.amazonaws.com/Prod/codalookup";

export async function fetchPollData(): Promise<PollDataItem[]> {
    try {
        console.log('Fetching poll data from:', API_ENDPOINT);
        const response = await axios.get(API_ENDPOINT);
        console.log('Raw API response:', response.data);

        if (!response.data) {
            throw new Error('No data received from API');
        }

        if (!response.data.success) {
            throw new Error(`API returned success: false - ${response.data.message || 'No error message provided'}`);
        }

        if (!Array.isArray(response.data.response)) {
            throw new Error('API response is not an array');
        }

        const pollItems = response.data.response.map((item: any) => ({
            create_date: item.create_date || "",
            post_id: item.post_id || "",
            is_user_generated: Boolean(item.is_user_generated),
            is_sponsored: Boolean(item.is_sponsored),
            sponsor_id: item.sponsor_id || "",
            caption: item.caption || "Would you rather?",
            option1: item.option1 || "",
            option2: item.option2 || "",
            total_responses: String(item.total_responses || ""),
            resp_option1: String(item.resp_option1 || ""),
            pct_option1: String(item.pct_option1 || ""),
            resp_option2: String(item.resp_option2 || ""),
            pct_option2: String(item.pct_option2 || ""),
            count_view: item.count_view || 0,
            count_like: item.count_like || 0,
            count_comment: item.count_comment || 0,
            count_bookmark: item.count_bookmark || 0,
            count_skip: item.count_skip || 0,
        }));

        console.log('Processed poll items:', pollItems);
        return pollItems;
    } catch (error) {
        console.error("Error fetching poll data:", error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
        }
        throw error;
    }
}
