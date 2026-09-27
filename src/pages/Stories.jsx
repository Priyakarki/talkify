import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Library, SearchX } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Button from "../components/ui/Button";
import StoryFilters from "../components/stories/StoryFilters";
import StoryCard, { StoryCardSkeleton } from "../components/stories/StoryCard";
import useDebounce from "../hooks/useDebounce";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { getStories } from "../services/storyService";
import { buildStatusMap, getProgress } from "../services/progressService";
import { getErrorMessage } from "../utils/errors";
import { DIFFICULTY_VALUES } from "../utils/difficulty";

const PAGE_SIZE = 9;

export default function Stories() {
  useDocumentTitle("Stories");
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters live in the URL so they survive refresh and the back button.
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const difficultyParam = searchParams.get("difficulty") || "";
  const difficulty = DIFFICULTY_VALUES.includes(difficultyParam) ? difficultyParam : "";
  const searchParam = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [data, setData] = useState({ stories: [], totalStories: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMap, setStatusMap] = useState({});

  const updateParams = useCallback(
    (changes) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined || (key === "page" && value === 1)) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  // Push the debounced search text into the URL (and go back to page 1).
  useEffect(() => {
    if (debouncedSearch.trim() !== searchParam) {
      updateParams({ search: debouncedSearch.trim(), page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Keep the input in sync when the URL changes from outside (back button).
  useEffect(() => {
    setSearchInput((current) => (current.trim() === searchParam ? current : searchParam));
  }, [searchParam]);

  const loadStories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getStories({ page, limit: PAGE_SIZE, search: searchParam, difficulty });
      setData({
        stories: result.stories || [],
        totalStories: result.totalStories || 0,
        totalPages: result.totalPages || 0,
      });
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load stories."));
    } finally {
      setLoading(false);
    }
  }, [page, searchParam, difficulty]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  // Show "Completed" / "In progress" badges on cards. Not critical, so errors are ignored.
  useEffect(() => {
    getProgress()
      .then((records) => setStatusMap(buildStatusMap(records)))
      .catch(() => {});
  }, []);

  // If the current page no longer exists (e.g. after filtering), jump to the last one.
  useEffect(() => {
    if (!loading && data.totalPages > 0 && page > data.totalPages) {
      updateParams({ page: data.totalPages });
    }
  }, [loading, data.totalPages, page, updateParams]);

  const handlePageChange = (nextPage) => {
    updateParams({ page: nextPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasFilters = Boolean(searchParam || difficulty);
  const from = data.totalStories === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, data.totalStories);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Library"
        title="Choose a story"
        subtitle="Pick a story at your level and read it out loud."
      />

      <StoryFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        difficulty={difficulty}
        onDifficultyChange={(value) => updateParams({ difficulty: value, page: 1 })}
      />

      {!loading && !error && data.totalStories > 0 && (
        <p className="results-count">
          Showing <strong>{from}–{to}</strong> of <strong>{data.totalStories}</strong>{" "}
          {data.totalStories === 1 ? "story" : "stories"}
          {searchParam && (
            <>
              {" "}for “<strong>{searchParam}</strong>”
            </>
          )}
        </p>
      )}

      {loading ? (
        <div className="story-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <StoryCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Couldn't load stories" message={error} onRetry={loadStories} />
      ) : data.stories.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={SearchX}
            title="No stories match"
            description="Try a different word or choose another difficulty."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchInput("");
                  setSearchParams(new URLSearchParams());
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Library}
            title="No stories yet"
            description="The library is empty. Add the first story from Manage stories."
            action={<Button to="/admin/stories/new">Add a story</Button>}
          />
        )
      ) : (
        <>
          <div className="story-grid">
            {data.stories.map((story) => (
              <StoryCard key={story._id} story={story} status={statusMap[story._id]} />
            ))}
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={handlePageChange} />
        </>
      )}
    </div>
  );
}
