import { useQuery } from "@tanstack/react-query";
import { getFeeds } from "../services/FeedsApi";

export function useFeeds() {
  return useQuery({
    queryKey: ["feeds"],
    queryFn: getFeeds,
  });
}
