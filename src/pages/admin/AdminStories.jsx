import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, Library, Pencil, Plus, SearchX, Trash2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import { ConfirmDialog } from "../../components/ui/Modal";
import { DifficultyBadge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Spinner";
import StoryFilters from "../../components/stories/StoryFilters";
import { StoryCover } from "../../components/stories/StoryCard";
import useDebounce from "../../hooks/useDebounce";
import useToast from "../../hooks/useToast";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { deleteStory, getStories } from "../../services/storyService";
import { getErrorMessage } from "../../utils/errors";
import { DIFFICULTY_VALUES } from "../../utils/difficulty";
import { excerpt, formatDate, wordCount } from "../../utils/format";

const PAGE_SIZE = 10;

function TableSkeleton() {
  return (
    <div className="admin-table__skeleton">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="admin-table__skeleton-row">
          <Skeleton width={40} height={40} radius={10} />
          <Skeleton width="35%" height={14} />
          <Skeleton width={80} height={22} radius={999} />
          <Skeleton width={60} height={14} />
        </div>
      ))}
    </div>
  );
}

export default function AdminStories() {
  useDocumentTitle("Manage stories");
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const difficultyParam = searchParams.get("difficulty") || "";
  const difficulty = DIFFICULTY_VALUES.includes(difficultyParam) ? difficultyParam : "";
  const searchParam = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(searchParam);
  const debouncedSearch = useDebounce(searchInput, 400);

  const [data, setData] = useState({ stories: [], totalStories: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const updateParams = useCallback(
    (changes) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined || (key === "page" && value === 1)) next.delete(key);
        else next.set(key, String(value));
      });
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    if (debouncedSearch.trim() !== searchParam) updateParams({ search: debouncedSearch.trim(), page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchInput((current) => (current.trim() === searchParam ? current : searchParam));
  }, [searchParam]);

  const load = useCallback(async () => {
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
    load();
  }, [load]);

  // After deleting the last story on a page, step back to a page that exists.
  useEffect(() => {
    if (!loading && data.totalPages > 0 && page > data.totalPages) updateParams({ page: data.totalPages });
  }, [loading, data.totalPages, page, updateParams]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteStory(toDelete._id);
      toast.success("Story deleted", `“${toDelete.title}” was removed.`);
      setToDelete(null);
      await load();
    } catch (err) {
      toast.error("Couldn't delete story", getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = Boolean(searchParam || difficulty);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Manage"
        title="Story library"
        subtitle={
          loading
            ? "Add, edit and remove stories."
            : `${data.totalStories} ${data.totalStories === 1 ? "story" : "stories"}${hasFilters ? " match your filters" : " in total"}`
        }
        actions={
          <Button to="/admin/stories/new" icon={Plus}>
            Add story
          </Button>
        }
      />

      <StoryFilters
        search={searchInput}
        onSearchChange={setSearchInput}
        difficulty={difficulty}
        onDifficultyChange={(value) => updateParams({ difficulty: value, page: 1 })}
      />

      <div className="card admin-table">
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorState title="Couldn't load stories" message={error} onRetry={load} />
        ) : data.stories.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX}
              title="No stories match"
              description="Try a different search or difficulty."
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
              title="Your library is empty"
              description="Add the first story so learners have something to read."
              action={
                <Button to="/admin/stories/new" icon={Plus}>
                  Add story
                </Button>
              }
            />
          )
        ) : (
          <table>
            <thead>
              <tr>
                <th scope="col">Story</th>
                <th scope="col">Difficulty</th>
                <th scope="col">Words</th>
                <th scope="col">Updated</th>
                <th scope="col" className="admin-table__actions-head">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.stories.map((story) => (
                <tr key={story._id}>
                  <td data-label="Story">
                    <div className="admin-table__story">
                      <StoryCover story={story} size="xs" />
                      <div>
                        <Link to={`/admin/stories/${story._id}/edit`} className="admin-table__title">
                          {story.title}
                        </Link>
                        <p className="admin-table__excerpt">{excerpt(story.content, 80)}</p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Difficulty">
                    <DifficultyBadge difficulty={story.difficulty} />
                  </td>
                  <td data-label="Words">{wordCount(story.content)}</td>
                  <td data-label="Updated">{formatDate(story.updatedAt)}</td>
                  <td className="admin-table__actions">
                    <Link to={`/stories/${story._id}`} className="icon-btn" aria-label={`View ${story.title}`} title="View">
                      <Eye size={17} />
                    </Link>
                    <Link
                      to={`/admin/stories/${story._id}/edit`}
                      className="icon-btn"
                      aria-label={`Edit ${story.title}`}
                      title="Edit"
                    >
                      <Pencil size={17} />
                    </Link>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      onClick={() => setToDelete(story)}
                      aria-label={`Delete ${story.title}`}
                      title="Delete"
                    >
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={data.totalPages} onChange={(p) => updateParams({ page: p })} disabled={loading} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete this story?"
        description={
          toDelete
            ? `“${toDelete.title}” will be permanently removed from the library. Reading history that points to it will show as “Story removed”.`
            : ""
        }
        confirmLabel="Delete story"
      />
    </div>
  );
}
