// Define the PollDataItem type
export type PollDataItem = {
    create_date: string;
    post_id: string;
    is_user_generated: boolean;
    is_sponsored: boolean;
    sponsor_id: string;
    caption: string;
    option1: string;
    option2: string;
    total_responses: string;
    resp_option1: string;
    pct_option1: string;
    resp_option2: string;
    pct_option2: string;
    count_view: string | number;
    count_like: string | number;
    count_comment: string | number;
    count_bookmark: string | number;
    count_skip: string | number;
};

// Define the raw data type that includes the extra columns
type RawPollData = PollDataItem & {
    "Column 19"?: string;
    "Column 20"?: string;
    "Column 21"?: string;
    "Column 22"?: string;
    "Column 23"?: string;
};

// Define the raw data
const rawPollData: RawPollData[] = [
    {
        create_date: "2024-09-09T00:00:00.000+08:00",
        post_id: "1717313917145-LRD9VX3",
        is_user_generated: false,
        is_sponsored: true,
        sponsor_id: "Software_reseller",
        caption: "Would you rather use a product prioritizing security or one focusing on convenience?",
        option1: "Prioritizes security",
        option2: "Focuses on convenience",
        total_responses: "585",
        resp_option1: "357",
        pct_option1: "0.610",
        resp_option2: "228",
        pct_option2: "0.390",
        count_view: "",
        count_like: "",
        count_comment: "",
        count_bookmark: "",
        count_skip: "",
        "Column 19": "",
        "Column 20": "",
        "Column 21": "",
        "Column 22": "",
        "Column 23": "",
    },
];

// Clean up the data by removing the extra columns
export const pollData: PollDataItem[] = rawPollData.map(item => {
    // Destructure to remove the extra columns
    const {
        ["Column 19"]: col19,
        ["Column 20"]: col20,
        ["Column 21"]: col21,
        ["Column 22"]: col22,
        ["Column 23"]: col23,
        ...cleanedItem
    } = item;
    
    return cleanedItem;
});
