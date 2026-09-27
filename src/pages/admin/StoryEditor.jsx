import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Trash2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import ErrorState from "../../components/ui/ErrorState";
import { PageLoader } from "../../components/ui/Spinner";
import { ConfirmDialog } from "../../components/ui/Modal";
import StoryForm from "../../components/stories/StoryForm";
import useToast from "../../hooks/useToast";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { createStory, deleteStory, getStoryById, updateStory } from "../../services/storyService";
import { getErrorMessage, isNotFound } from "../../utils/errors";
import { formatDateTime } from "../../utils/format";

// Used for both /admin/stories/new and /admin/stories/:id/edit
export default function StoryEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  useDocumentTitle(isEdit ? "Edit story" : "Add story");

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState(null);
  const [serverError, setServerError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    setLoadError(null);
    try {
      setStory(await getStoryById(id));
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (values) => {
    setServerError("");
    try {
      if (isEdit) {
        await updateStory(id, values);
        toast.success("Story updated", `“${values.title}” has been saved.`);
      } else {
        await createStory(values);
        toast.success("Story added", `“${values.title}” is now in the library.`);
      }
      navigate("/admin/stories");
    } catch (err) {
      setServerError(getErrorMessage(err, "We couldn't save this story."));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStory(id);
      toast.success("Story deleted", `“${story?.title}” was removed.`);
      navigate("/admin/stories", { replace: true });
    } catch (err) {
      toast.error("Couldn't delete story", getErrorMessage(err));
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader label="Loading story…" />;

  if (loadError) {
    return (
      <div className="page">
        <ErrorState
          title={isNotFound(loadError) ? "Story not found" : "Couldn't load this story"}
          message={isNotFound(loadError) ? "It may have been deleted already." : getErrorMessage(loadError)}
          onRetry={isNotFound(loadError) ? undefined : load}
          action={
            <Button to="/admin/stories" variant="secondary" size="sm" icon={ArrowLeft}>
              Back to library
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <button type="button" className="back-link" onClick={() => navigate("/admin/stories")}>
        <ArrowLeft size={16} aria-hidden="true" /> Story library
      </button>

      <PageHeader
        eyebrow={isEdit ? "Edit story" : "New story"}
        title={isEdit ? story?.title : "Add a story"}
        subtitle={
          isEdit
            ? `Last updated ${formatDateTime(story?.updatedAt)}`
            : "Write a story for learners. Choose a difficulty that matches its vocabulary."
        }
        actions={
          isEdit && (
            <>
              <Button to={`/stories/${id}`} variant="secondary" icon={Eye} size="sm">
                View
              </Button>
              <Button variant="danger" icon={Trash2} size="sm" onClick={() => setConfirmOpen(true)}>
                Delete
              </Button>
            </>
          )
        }
      />

      <div className="card editor-card">
        <StoryForm
          key={story?._id || "new"}
          initialValues={
            story ? { title: story.title, content: story.content, difficulty: story.difficulty } : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => navigate("/admin/stories")}
          submitLabel={isEdit ? "Save changes" : "Publish story"}
          serverError={serverError}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this story?"
        description={`“${story?.title}” will be permanently removed from the library.`}
        confirmLabel="Delete story"
      />
    </div>
  );
}
